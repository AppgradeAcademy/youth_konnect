import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update announcement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const announcementId = params.id;
    const { title, content, imageUrl, isActive, userId } = await request.json();

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    const isCreator = announcement.createdById === userId;
    const isOwner = announcement.organization.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: announcement.organizationId,
        },
      },
    });

    if (!isCreator && !isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only announcement creators, organization owners, or leaders can update announcements' },
        { status: 403 }
      );
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
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
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const announcementId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    const isCreator = announcement.createdById === userId;
    const isOwner = announcement.organization.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: announcement.organizationId,
        },
      },
    });

    if (!isCreator && !isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only announcement creators, organization owners, or leaders can delete announcements' },
        { status: 403 }
      );
    }

    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

