import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id;
    const { title, description, date, location, userId, taggedUserIds } = await request.json();

    // Verify user is creator or organization owner/leader
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const isCreator = schedule.createdById === userId;
    const isOwner = schedule.organization.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: schedule.organizationId,
        },
      },
    });

    if (!isCreator && !isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only schedule creators, organization owners, or leaders can update schedules' },
        { status: 403 }
      );
    }

    // Update tags if provided
    if (taggedUserIds !== undefined) {
      // Delete existing tags
      await prisma.scheduleTag.deleteMany({
        where: { scheduleId },
      });

      // Create new tags
      if (taggedUserIds.length > 0) {
        await prisma.scheduleTag.createMany({
          data: taggedUserIds.map((uid: string) => ({
            scheduleId,
            userId: uid,
          })),
        });
      }
    }

    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user is creator or organization owner/leader
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const isCreator = schedule.createdById === userId;
    const isOwner = schedule.organization.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: schedule.organizationId,
        },
      },
    });

    if (!isCreator && !isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only schedule creators, organization owners, or leaders can delete schedules' },
        { status: 403 }
      );
    }

    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

