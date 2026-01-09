import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST join room (mark user as present)
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await request.json();
    const groupId = params.groupId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user is a member of the group
    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to join the chatroom' },
        { status: 403 }
      );
    }

    // Check if chatroom is active
    const chatroomSettings = await prisma.chatroomSettings.findUnique({
      where: { groupId },
    });

    if (!chatroomSettings || !chatroomSettings.isActive) {
      return NextResponse.json(
        { error: 'This chatroom is currently inactive' },
        { status: 403 }
      );
    }

    // Create or update presence (user joins the room)
    const presence = await prisma.roomPresence.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        userId,
        groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: 'Joined room successfully',
      presence 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE leave room (remove presence)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const groupId = params.groupId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.roomPresence.deleteMany({
      where: {
        userId,
        groupId,
      },
    });

    return NextResponse.json({ message: 'Left room successfully' });
  } catch (error: any) {
    console.error('Error leaving room:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET list of users currently present in room
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const groupId = params.groupId;

    // Get all users currently present (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const presences = await prisma.roomPresence.findMany({
      where: {
        groupId,
        lastSeen: {
          gte: fiveMinutesAgo, // Only show users active in last 5 minutes
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        lastSeen: 'desc',
      },
    });

    return NextResponse.json(presences.map(p => ({
      id: p.user.id,
      name: p.user.username || p.user.name,
      joinedAt: p.joinedAt,
      lastSeen: p.lastSeen,
    })));
  } catch (error: any) {
    console.error('Error fetching room presence:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

