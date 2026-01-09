import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const userId = searchParams.get('userId'); // Current user ID to exclude from results and check follows

    // If no query, return suggested users (users not yet followed, excluding current user)
    if (!query.trim()) {
      let suggestedUsers: any[] = [];
      
      if (userId) {
        // Get users the current user is already following (handle case where table might not exist)
        let followingIds: any[] = [];
        let followingSet = new Set<string>();
        
        try {
          followingIds = await prisma.userFollow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
          });
          followingSet = new Set(followingIds.map(f => f.followingId));
        } catch (error: any) {
          // If UserFollow table doesn't exist yet, just continue without filtering
          console.warn('UserFollow table may not exist yet:', error?.message);
        }

        // Get all users except current user and those already followed
        let allUsers: any[] = [];
        try {
          allUsers = await prisma.user.findMany({
            where: {
              id: { not: userId },
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
            take: 50, // Get more to filter
          });
        } catch (error: any) {
          // If _count fails (tables don't exist), try without it
          console.warn('Error fetching users with _count:', error?.message);
          allUsers = await prisma.user.findMany({
            where: {
              id: { not: userId },
            },
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              role: true,
              createdAt: true,
            },
            take: 50,
          });
          // Add empty _count for compatibility
          allUsers = allUsers.map(u => ({
            ...u,
            _count: { followers: 0, following: 0 },
          }));
        }

        // Filter to users not yet followed, prioritize by follower count (popular users first)
        const notFollowedUsers = allUsers
          .filter(u => !followingSet.has(u.id))
          .sort((a, b) => (b._count?.followers || 0) - (a._count?.followers || 0))
          .slice(0, 10);

        suggestedUsers = notFollowedUsers.map(user => ({
          ...user,
          isFollowing: false,
        }));

        // If we don't have enough, add some already-followed users (marked as following)
        if (suggestedUsers.length < 10) {
          const followedUsers = allUsers
            .filter(u => followingSet.has(u.id))
            .sort((a, b) => (b._count?.followers || 0) - (a._count?.followers || 0))
            .slice(0, 10 - suggestedUsers.length)
            .map(user => ({
              ...user,
              isFollowing: true,
            }));
          
          suggestedUsers = [...suggestedUsers, ...followedUsers];
        }
      } else {
        // No userId, just return most popular users
        try {
          suggestedUsers = await prisma.user.findMany({
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
            orderBy: { createdAt: 'desc' },
          });
        } catch (error: any) {
          // If _count fails, try without it
          console.warn('Error fetching users with _count:', error?.message);
          const usersWithoutCount = await prisma.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              role: true,
              createdAt: true,
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
          });
          suggestedUsers = usersWithoutCount.map(u => ({
            ...u,
            _count: { followers: 0, following: 0 },
          }));
        }
      }

      return NextResponse.json(suggestedUsers);
    }

    let users: any[] = [];
    try {
      users = await prisma.user.findMany({
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
    } catch (error: any) {
      // If _count fails, try without it
      console.warn('Error searching users with _count:', error?.message);
      const usersWithoutCount = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { username: { contains: query, mode: 'insensitive' } },
              ],
            },
            ...(userId ? [{ id: { not: userId } }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
        },
        take: 20,
        orderBy: { name: 'asc' },
      });
      users = usersWithoutCount.map(u => ({
        ...u,
        _count: { followers: 0, following: 0 },
      }));
    }

    // If userId provided, check if current user follows each user
    if (userId) {
      let followingIds: any[] = [];
      let followingSet = new Set<string>();
      
      try {
        followingIds = await prisma.userFollow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });
        followingSet = new Set(followingIds.map(f => f.followingId));
      } catch (error: any) {
        // If UserFollow table doesn't exist yet, just continue without follow status
        console.warn('UserFollow table may not exist yet:', error?.message);
      }

      const usersWithFollowStatus = users.map(user => ({
        ...user,
        isFollowing: followingSet.has(user.id),
      }));

      return NextResponse.json(usersWithFollowStatus);
    }

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error searching users:', error);
    console.error('Error details:', error?.message, error?.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

