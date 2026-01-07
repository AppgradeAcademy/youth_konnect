import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all messages with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId'); // Current user ID
    const filter = searchParams.get('filter') || 'all'; // 'all', 'following', 'church', 'mine'

    let whereClause: any = {};

    if (userId) {
      if (filter === 'mine') {
        // Only messages from current user
        whereClause.userId = userId;
      } else if (filter === 'following') {
        // Messages from users the current user follows
        const followingIds = await prisma.userFollow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });
        const followingSet = followingIds.map(f => f.followingId);
        if (followingSet.length > 0) {
          whereClause.userId = { in: followingSet };
        } else {
          // No one followed, return empty array
          return NextResponse.json([]);
        }
      } else if (filter === 'church') {
        // Messages from admins (church)
        const adminUsers = await prisma.user.findMany({
          where: { role: 'admin' },
          select: { id: true },
        });
        const adminIds = adminUsers.map(u => u.id);
        if (adminIds.length > 0) {
          whereClause.userId = { in: adminIds };
        } else {
          return NextResponse.json([]);
        }
      } else if (filter === 'followingAndChurch') {
        // Messages from following + church + own
        const followingIds = await prisma.userFollow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });
        const followingSet = followingIds.map(f => f.followingId);
        
        const adminUsers = await prisma.user.findMany({
          where: { role: 'admin' },
          select: { id: true },
        });
        const adminIds = adminUsers.map(u => u.id);
        
        const allIds = [...followingSet, ...adminIds, userId];
        const uniqueIds = [...new Set(allIds)];
        
        if (uniqueIds.length > 0) {
          whereClause.userId = { in: uniqueIds };
        }
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
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

// POST create message
export async function POST(request: NextRequest) {
  try {
    const { userId, content } = await request.json();

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        userId,
        content,
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
