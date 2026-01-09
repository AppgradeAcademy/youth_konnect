import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all messages for a group (group-based chatroom like MXit)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId'); // Current user ID
    const groupId = searchParams.get('groupId'); // Group ID (required for group-based chat)

    if (!groupId) {
      // During migration, groupId might be null - return empty array
      return NextResponse.json([]);
    }

    // Verify user is a member of the group
    if (userId) {
      const membership = await prisma.groupMembership.findUnique({
        where: {
          userId_groupId: {
            userId: userId,
            groupId: groupId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this group' },
          { status: 403 }
        );
      }
    }

    // Check if chatroom is active for this group
    const chatroomSettings = await prisma.chatroomSettings.findUnique({
      where: { groupId },
    });

    if (chatroomSettings && !chatroomSettings.isActive) {
      return NextResponse.json(
        { error: 'Chatroom is currently inactive' },
        { status: 403 }
      );
    }

    // Get messages for this group
    const messages = await prisma.chatMessage.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 messages
    });

    // Reverse to show oldest first (scroll behavior)
    return NextResponse.json(messages.reverse());
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST create message in a group
export async function POST(request: NextRequest) {
  try {
    const { userId, content, groupId } = await request.json();

    if (!userId || !content || !groupId) {
      return NextResponse.json(
        { error: 'User ID, content, and group ID are required' },
        { status: 400 }
      );
    }

    // Verify user is a member of the group
    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Check if chatroom is active
    const chatroomSettings = await prisma.chatroomSettings.findUnique({
      where: { groupId },
    });

    if (chatroomSettings && !chatroomSettings.isActive) {
      return NextResponse.json(
        { error: 'Chatroom is currently inactive' },
        { status: 403 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        userId,
        content,
        groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
