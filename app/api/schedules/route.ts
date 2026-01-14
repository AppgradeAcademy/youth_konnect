import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET schedules (optionally filtered by organization or user tags)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId'); // Get schedules where user is tagged

    if (userId) {
      // Get schedules where user is tagged
      const taggedSchedules = await prisma.scheduleTag.findMany({
        where: { userId },
        include: {
          schedule: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
              tags: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          schedule: {
            date: 'asc',
          },
        },
      });

      return NextResponse.json(taggedSchedules.map(t => t.schedule));
    }

    const whereClause: any = {};
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        tags: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new schedule (leader only)
export async function POST(request: NextRequest) {
  try {
    const { organizationId, title, description, date, location, createdById, taggedUserIds } = await request.json();

    if (!organizationId || !title || !date || !createdById) {
      return NextResponse.json(
        { error: 'Organization ID, title, date, and creator ID are required' },
        { status: 400 }
      );
    }

    // Verify user is a leader of the organization
    const leader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId: createdById,
          organizationId,
        },
      },
    });

    // Also check if user is the organization owner
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    if (!leader && organization?.ownerId !== createdById) {
      return NextResponse.json(
        { error: 'Only organization leaders can create schedules' },
        { status: 403 }
      );
    }

    // Create schedule with tags
    const schedule = await prisma.schedule.create({
      data: {
        organizationId,
        title,
        description: description || null,
        date: new Date(date),
        location: location || null,
        createdById,
        tags: {
          create: (taggedUserIds || []).map((userId: string) => ({
            userId,
          })),
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        tags: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

