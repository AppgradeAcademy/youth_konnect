import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET suggestions for users and groups based on common groups, friends, etc.
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const suggestions: {
      users: any[];
      groups: any[];
    } = {
      users: [],
      groups: [],
    };

    try {
      // 1. Get groups the user is a member of
      const userGroups = await prisma.groupMembership.findMany({
        where: { userId },
        select: { groupId: true },
      });
      const userGroupIds = userGroups.map(g => g.groupId);

      // 2. Get users the current user follows
      const following = await prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = new Set(following.map(f => f.followingId));

      // 3. Suggest users from same groups (mutual connections)
      if (userGroupIds.length > 0) {
        // Find other members in the same groups
        const groupMembers = await prisma.groupMembership.findMany({
          where: {
            groupId: { in: userGroupIds },
            userId: { not: userId }, // Exclude current user
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
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

        // Group by user and count mutual groups
        const userGroupCount: Record<string, { user: any; groups: any[]; mutualGroups: number }> = {};
        
        groupMembers.forEach((member) => {
          if (!followingIds.has(member.userId)) { // Not already following
            if (!userGroupCount[member.userId]) {
              userGroupCount[member.userId] = {
                user: member.user,
                groups: [],
                mutualGroups: 0,
              };
            }
            userGroupCount[member.userId].groups.push(member.group);
            userGroupCount[member.userId].mutualGroups++;
          }
        });

        // Convert to array and sort by mutual groups count
        const suggestedUsers = Object.values(userGroupCount)
          .sort((a, b) => b.mutualGroups - a.mutualGroups)
          .slice(0, 10)
          .map(item => ({
            ...item.user,
            mutualGroups: item.mutualGroups,
            commonGroups: item.groups.map(g => g.name),
            isFollowing: false,
          }));

        suggestions.users = suggestedUsers;
      }

      // 4. If we don't have enough user suggestions, add users from followed users' groups
      if (suggestions.users.length < 10 && followingIds.size > 0) {
        const followingUserGroups = await prisma.groupMembership.findMany({
          where: {
            userId: { in: Array.from(followingIds) },
          },
          select: { groupId: true },
        });
        const followingUserGroupIds = [...new Set(followingUserGroups.map(g => g.groupId))];

        if (followingUserGroupIds.length > 0) {
          const additionalMembers = await prisma.groupMembership.findMany({
            where: {
              groupId: { in: followingUserGroupIds },
              userId: { 
                not: userId,
                notIn: Array.from(followingIds),
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                  role: true,
                },
              },
            },
          });

          const additionalUserIds = new Set(suggestions.users.map(u => u.id));
          const newUsers = additionalMembers
            .filter(m => !additionalUserIds.has(m.userId))
            .slice(0, 10 - suggestions.users.length)
            .map(m => ({
              ...m.user,
              mutualGroups: 0,
              commonGroups: [],
              isFollowing: false,
            }));

          suggestions.users = [...suggestions.users, ...newUsers];
        }
      }

      // 5. Suggest groups the user is not a member of
      // First, get groups that users they follow are members of
      if (followingIds.size > 0) {
        const followedUserGroups = await prisma.groupMembership.findMany({
          where: {
            userId: { in: Array.from(followingIds) },
          },
          select: { groupId: true },
        });
        const followedUserGroupIds = [...new Set(followedUserGroups.map(g => g.groupId))];

        // Get groups not already joined
        const suggestedGroupsRaw = await prisma.group.findMany({
          where: {
            id: { 
              in: followedUserGroupIds,
              notIn: userGroupIds,
            },
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        });

        // Sort by member count in JavaScript (since Prisma doesn't support _count in orderBy)
        const suggestedGroups = suggestedGroupsRaw
          .sort((a, b) => (b._count.members || 0) - (a._count.members || 0))
          .slice(0, 5)
          .map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            organization: g.organization,
            memberCount: g._count.members,
          }));

        suggestions.groups = suggestedGroups;
      }

      // 6. If still not enough groups, add popular groups
      if (suggestions.groups.length < 5) {
        const existingGroupIds = new Set(suggestions.groups.map(g => g.id));
        const allGroupsNotJoined = await prisma.group.findMany({
          where: {
            id: { 
              notIn: [...userGroupIds, ...Array.from(existingGroupIds)],
            },
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        });

        // Sort by member count and take top groups
        const popularGroups = allGroupsNotJoined
          .sort((a, b) => (b._count.members || 0) - (a._count.members || 0))
          .slice(0, 5 - suggestions.groups.length)
          .map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            organization: g.organization,
            memberCount: g._count.members,
          }));

        suggestions.groups = [...suggestions.groups, ...popularGroups];
      }

    } catch (error: any) {
      console.warn('Error fetching suggestions (some tables may not exist):', error?.message);
      // Return empty suggestions if tables don't exist yet
    }

    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

