import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all programs (optionally filtered by organization)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    const whereClause: any = { isActive: true };
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const programs = await prisma.churchProgram.findMany({
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

    return NextResponse.json(programs);
  } catch (error: any) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new program (leader only)
export async function POST(request: NextRequest) {
  try {
    const { organizationId, title, description, imageUrl, date, location, createdById } = await request.json();

    if (!organizationId || !title || !createdById) {
      return NextResponse.json(
        { error: 'Organization ID, title, and creator ID are required' },
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
        { error: 'Only organization leaders can create programs' },
        { status: 403 }
      );
    }

    const program = await prisma.churchProgram.create({
      data: {
        organizationId,
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        date: date ? new Date(date) : null,
        location: location || null,
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

    return NextResponse.json(program, { status: 201 });
  } catch (error: any) {
    console.error('Error creating program:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

