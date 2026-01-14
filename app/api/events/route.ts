import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET all events (optionally filtered by organization)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    const whereClause: any = {};
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const userId = searchParams.get('userId'); // Optional: for filtering by visibility and RSVP status
    
    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        group: {
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
        _count: {
          select: {
            rsvps: true,
          },
        },
        ...(userId ? {
          rsvps: {
            where: { userId },
            select: {
              id: true,
              status: true,
            },
          },
        } : {}),
      },
      orderBy: { date: 'asc' },
    });

    // Filter events based on visibility if userId is provided
    let filteredEvents = events;
    if (userId) {
      // Wait for async filtering
      const visibilityChecks = await Promise.all(
        events.map(async (event) => {
          if (event.visibility === 'public') return true;
          if (event.visibility === 'leader-only') {
            const isLeader = await prisma.organizationLeader.findUnique({
              where: {
                userId_organizationId: {
                  userId,
                  organizationId: event.organizationId,
                },
              },
            });
            return !!isLeader;
          }
          if (event.visibility === 'group' && event.groupId) {
            const isMember = await prisma.groupMembership.findUnique({
              where: {
                userId_groupId: {
                  userId,
                  groupId: event.groupId,
                },
              },
            });
            return !!isMember;
          }
          return false;
        })
      );

      filteredEvents = events.filter((_, index) => visibilityChecks[index]);
    }

    return NextResponse.json(filteredEvents);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new event (admin/leader only)
export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId, 
      groupId,
      title, 
      description, 
      imageUrl, 
      date, 
      time,
      location, 
      eventType,
      visibility,
      createdById 
    } = await request.json();

    if (!organizationId || !title || !date || !createdById) {
      return NextResponse.json(
        { error: 'Organization ID, title, date, and creator ID are required' },
        { status: 400 }
      );
    }

    // Verify user is owner or leader of the organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    const isOwner = organization?.ownerId === createdById;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId: createdById,
          organizationId,
        },
      },
    });

    if (!isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only organization owners or leaders can create events' },
        { status: 403 }
      );
    }

    // Validate event type and visibility
    const validEventTypes = ['service', 'conference', 'meeting', 'rehearsal'];
    const validVisibility = ['public', 'group', 'leader-only'];
    
    if (eventType && !validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Event type must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (visibility && !validVisibility.includes(visibility)) {
      return NextResponse.json(
        { error: `Visibility must be one of: ${validVisibility.join(', ')}` },
        { status: 400 }
      );
    }

    // If visibility is 'group', groupId is required
    if (visibility === 'group' && !groupId) {
      return NextResponse.json(
        { error: 'Group ID is required for group-specific events' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        organizationId,
        groupId: groupId || null,
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        date: new Date(date),
        time: time || null,
        location: location || null,
        eventType: eventType || 'meeting',
        visibility: visibility || 'public',
        createdById,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        group: groupId ? {
          select: {
            id: true,
            name: true,
          },
        } : undefined,
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
