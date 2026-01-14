import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET a specific meeting minute
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const minute = await prisma.meetingMinute.findUnique({
      where: { id: params.id },
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
            email: true,
          },
        },
      },
    });

    if (!minute) {
      return NextResponse.json(
        { error: 'Meeting minute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(minute);
  } catch (error: any) {
    console.error('Error fetching meeting minute:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH update a meeting minute
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, content, meetingDate } = await request.json();

    const minute = await prisma.meetingMinute.findUnique({
      where: { id: params.id },
      select: {
        organizationId: true,
        createdById: true,
      },
    });

    if (!minute) {
      return NextResponse.json(
        { error: 'Meeting minute not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user is owner, leader, or creator
    const organization = await prisma.organization.findUnique({
      where: { id: minute.organizationId },
      select: { ownerId: true },
    });

    const isOwner = organization?.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: minute.organizationId,
        },
      },
    });
    const isCreator = minute.createdById === userId;

    if (!isOwner && !isLeader && !isCreator) {
      return NextResponse.json(
        { error: 'You do not have permission to update this meeting minute' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (meetingDate !== undefined) updateData.meetingDate = new Date(meetingDate);

    const updatedMinute = await prisma.meetingMinute.update({
      where: { id: params.id },
      data: updateData,
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
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMinute);
  } catch (error: any) {
    console.error('Error updating meeting minute:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE a meeting minute
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const minute = await prisma.meetingMinute.findUnique({
      where: { id: params.id },
      select: {
        organizationId: true,
        createdById: true,
      },
    });

    if (!minute) {
      return NextResponse.json(
        { error: 'Meeting minute not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: minute.organizationId },
      select: { ownerId: true },
    });

    const isOwner = organization?.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: minute.organizationId,
        },
      },
    });

    if (!isOwner && !isLeader && minute.createdById !== userId) {
      return NextResponse.json(
        { error: 'Only organization owners, leaders, or creators can delete meeting minutes' },
        { status: 403 }
      );
    }

    await prisma.meetingMinute.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Meeting minute deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting meeting minute:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

