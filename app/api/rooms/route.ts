import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all available chatrooms (groups with active chatrooms)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId'); // Optional: filter to user's groups or show all

    // Get groups that have active chatrooms
    const groups = await prisma.group.findMany({
      where: {
        chatroomSettings: {
          isActive: true,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        chatroomSettings: {
          select: {
            isActive: true,
            requiresPassword: true,
          },
        },
        _count: {
          select: {
            members: true,
            presences: true, // Count of users currently in room
            messages: true,
          },
        },
      },
    });

    // Sort manually by active users count (most active first)
    groups.sort((a, b) => (b._count.presences || 0) - (a._count.presences || 0));

    // If userId provided, check membership status and current presence
    if (userId) {
      const userMemberships = await prisma.groupMembership.findMany({
        where: { userId },
        select: { groupId: true },
      });
      const membershipSet = new Set(userMemberships.map(m => m.groupId));

      const userPresences = await prisma.roomPresence.findMany({
        where: { userId },
        select: { groupId: true },
      });
      const presenceSet = new Set(userPresences.map(p => p.groupId));

      const rooms = groups.map(group => ({
        ...group,
        isMember: membershipSet.has(group.id),
        isPresent: presenceSet.has(group.id),
        memberCount: group._count.members,
        activeUsers: group._count.presences,
        messageCount: group._count.messages,
      }));

      return NextResponse.json(rooms);
    }

    // No userId, return public info
    const rooms = groups.map(group => ({
      ...group,
      isMember: false,
      isPresent: false,
      memberCount: group._count.members,
      activeUsers: group._count.presences,
      messageCount: group._count.messages,
    }));

    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

