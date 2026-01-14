import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET all announcements (optionally filtered by organization)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    const whereClause: any = { isActive: true };
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const announcements = await prisma.announcement.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new announcement (admin/leader only)
export async function POST(request: NextRequest) {
  try {
    const { organizationId, title, content, imageUrl, createdById } = await request.json();

    if (!organizationId || !title || !content || !createdById) {
      return NextResponse.json(
        { error: 'Organization ID, title, content, and creator ID are required' },
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
        { error: 'Only organization owners or leaders can create announcements' },
        { status: 403 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        organizationId,
        title,
        content,
        imageUrl: imageUrl || null,
        createdById,
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

    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

