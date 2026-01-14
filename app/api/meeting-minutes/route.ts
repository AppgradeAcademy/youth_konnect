import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all meeting minutes (optionally filtered by organization)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    const whereClause: any = {};
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const minutes = await prisma.meetingMinute.findMany({
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
            email: true,
          },
        },
      },
      orderBy: { meetingDate: 'desc' },
    });

    return NextResponse.json(minutes);
  } catch (error: any) {
    console.error('Error fetching meeting minutes:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new meeting minute (admin/leader only)
export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId, 
      title, 
      content,
      meetingDate,
      createdById 
    } = await request.json();

    if (!organizationId || !title || !content || !meetingDate || !createdById) {
      return NextResponse.json(
        { error: 'Organization ID, title, content, meeting date, and creator ID are required' },
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
        { error: 'Only organization owners or leaders can create meeting minutes' },
        { status: 403 }
      );
    }

    const minute = await prisma.meetingMinute.create({
      data: {
        organizationId,
        title,
        content,
        meetingDate: new Date(meetingDate),
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
            email: true,
          },
        },
      },
    });

    return NextResponse.json(minute, { status: 201 });
  } catch (error: any) {
    console.error('Error creating meeting minute:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

