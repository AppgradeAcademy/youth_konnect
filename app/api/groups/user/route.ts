import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all groups a user is a member of
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

    const memberships = await prisma.groupMembership.findMany({
      where: { userId },
      include: {
        group: {
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
        },
      },
      orderBy: {
        group: {
          createdAt: 'desc',
        },
      },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      membershipRole: m.role,
      memberCount: m.group._count.members,
    }));

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

