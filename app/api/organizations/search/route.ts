import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET search organizations or get suggested organizations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const userId = searchParams.get('userId'); // Current user ID to check if following

    // If no query, return suggested organizations (not yet followed, sorted by follower count)
    if (!query.trim()) {
      let suggestedOrganizations: any[] = [];
      
      if (userId) {
        // Get organizations the current user is already following
        let followingOrgIds: any[] = [];
        let followingOrgSet = new Set<string>();
        
        try {
          followingOrgIds = await prisma.organizationFollow.findMany({
            where: { userId },
            select: { organizationId: true },
          });
          followingOrgSet = new Set(followingOrgIds.map(f => f.organizationId));
        } catch (error: any) {
          console.warn('OrganizationFollow table may not exist yet:', error?.message);
        }

        // Get all organizations, prioritize those not yet followed
        let allOrgs: any[] = [];
        try {
          allOrgs = await prisma.organization.findMany({
            include: {
              _count: {
                select: {
                  followers: true,
                  groups: true,
                },
              },
            },
            take: 50,
          });
        } catch (error: any) {
          // If _count fails, try without it
          console.warn('Error fetching organizations with _count:', error?.message);
          const orgsWithoutCount = await prisma.organization.findMany({
            take: 50,
          });
          allOrgs = orgsWithoutCount.map(org => ({
            ...org,
            _count: { followers: 0, groups: 0 },
          }));
        }

        // Filter to organizations not yet followed, prioritize by follower count
        const notFollowedOrgs = allOrgs
          .filter(org => !followingOrgSet.has(org.id))
          .sort((a, b) => (b._count?.followers || 0) - (a._count?.followers || 0))
          .slice(0, 10);

        suggestedOrganizations = notFollowedOrgs.map(org => ({
          ...org,
          isFollowing: false,
        }));

        // If we don't have enough, add some already-followed organizations
        if (suggestedOrganizations.length < 10) {
          const followedOrgs = allOrgs
            .filter(org => followingOrgSet.has(org.id))
            .sort((a, b) => (b._count?.followers || 0) - (a._count?.followers || 0))
            .slice(0, 10 - suggestedOrganizations.length)
            .map(org => ({
              ...org,
              isFollowing: true,
            }));
          
          suggestedOrganizations = [...suggestedOrganizations, ...followedOrgs];
        }
      } else {
        // No userId, just return most popular organizations
        try {
          suggestedOrganizations = await prisma.organization.findMany({
            include: {
              _count: {
                select: {
                  followers: true,
                  groups: true,
                },
              },
            },
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
          });
        } catch (error: any) {
          // If _count fails, try without it
          console.warn('Error fetching organizations with _count:', error?.message);
          const orgsWithoutCount = await prisma.organization.findMany({
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
          });
          suggestedOrganizations = orgsWithoutCount.map(org => ({
            ...org,
            _count: { followers: 0, groups: 0 },
          }));
        }
      }

      return NextResponse.json(suggestedOrganizations);
    }

    // Search organizations by name
    let organizations: any[] = [];
    try {
      organizations = await prisma.organization.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        include: {
          _count: {
            select: {
              followers: true,
              groups: true,
            },
          },
        },
        take: 20,
        orderBy: { name: 'asc' },
      });
    } catch (error: any) {
      // If _count fails, try without it
      console.warn('Error searching organizations with _count:', error?.message);
      const orgsWithoutCount = await prisma.organization.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 20,
        orderBy: { name: 'asc' },
      });
      organizations = orgsWithoutCount.map(org => ({
        ...org,
        _count: { followers: 0, groups: 0 },
      }));
    }

    // If userId provided, check if current user follows each organization
    if (userId) {
      let followingOrgIds: any[] = [];
      let followingOrgSet = new Set<string>();
      
      try {
        followingOrgIds = await prisma.organizationFollow.findMany({
          where: { userId },
          select: { organizationId: true },
        });
        followingOrgSet = new Set(followingOrgIds.map(f => f.organizationId));
      } catch (error: any) {
        console.warn('OrganizationFollow table may not exist yet:', error?.message);
      }

      const orgsWithFollowStatus = organizations.map(org => ({
        ...org,
        isFollowing: followingOrgSet.has(org.id),
      }));

      return NextResponse.json(orgsWithFollowStatus);
    }

    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error('Error searching organizations:', error);
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

