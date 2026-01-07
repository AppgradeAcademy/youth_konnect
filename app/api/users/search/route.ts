import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const userId = searchParams.get('userId'); // Current user ID to exclude from results and check follows

    // If no query, return suggested users (recent users, excluding current user)
    if (!query.trim()) {
      const suggestedUsers = await prisma.user.findMany({
        where: userId ? { id: { not: userId } } : {},
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' }, // Most recent users first
      });

      // If userId provided, check if current user follows each user
      if (userId && suggestedUsers.length > 0) {
        const followingIds = await prisma.userFollow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });
        const followingSet = new Set(followingIds.map(f => f.followingId));

        const usersWithFollowStatus = suggestedUsers.map(user => ({
          ...user,
          isFollowing: followingSet.has(user.id),
        }));

        return NextResponse.json(usersWithFollowStatus);
      }

      return NextResponse.json(suggestedUsers);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
            ],
          },
          ...(userId ? [{ id: { not: userId } }] : []), // Exclude current user
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    // If userId provided, check if current user follows each user
    if (userId) {
      const followingIds = await prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingSet = new Set(followingIds.map(f => f.followingId));

      const usersWithFollowStatus = users.map(user => ({
        ...user,
        isFollowing: followingSet.has(user.id),
      }));

      return NextResponse.json(usersWithFollowStatus);
    }

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

