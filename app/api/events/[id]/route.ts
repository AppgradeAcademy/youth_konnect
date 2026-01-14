import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const { 
      title, 
      description, 
      imageUrl, 
      date, 
      time,
      location, 
      eventType,
      visibility,
      groupId,
      userId 
    } = await request.json();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const isCreator = event.createdById === userId;
    const isOwner = event.organization.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: event.organizationId,
        },
      },
    });

    if (!isCreator && !isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only event creators, organization owners, or leaders can update events' },
        { status: 403 }
      );
    }

    // Validate event type and visibility if provided
    if (eventType) {
      const validEventTypes = ['service', 'conference', 'meeting', 'rehearsal'];
      if (!validEventTypes.includes(eventType)) {
        return NextResponse.json(
          { error: `Event type must be one of: ${validEventTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (visibility) {
      const validVisibility = ['public', 'group', 'leader-only'];
      if (!validVisibility.includes(visibility)) {
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
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (date) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (location !== undefined) updateData.location = location;
    if (eventType) updateData.eventType = eventType;
    if (visibility) updateData.visibility = visibility;
    if (groupId !== undefined) updateData.groupId = groupId;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
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
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const isCreator = event.createdById === userId;
    const isOwner = event.organization.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: event.organizationId,
        },
      },
    });

    if (!isCreator && !isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only event creators, organization owners, or leaders can delete events' },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
