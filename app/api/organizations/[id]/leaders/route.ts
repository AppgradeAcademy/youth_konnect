import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all leaders of an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;

    const leaders = await prisma.organizationLeader.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leaders);
  } catch (error: any) {
    console.error('Error fetching leaders:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST add leader to organization
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id;
    const { userId, adminId } = await request.json();

    if (!userId || !adminId) {
      return NextResponse.json(
        { error: 'User ID and Admin ID are required' },
        { status: 400 }
      );
    }

    // Verify admin is owner of organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    if (!organization || organization.ownerId !== adminId) {
      return NextResponse.json(
        { error: 'Only the organization owner can add leaders' },
        { status: 403 }
      );
    }

    // Create leader relationship
    const leader = await prisma.organizationLeader.create({
      data: {
        userId,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });

    // Update user role to leader
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'leader' },
    });

    return NextResponse.json(leader, { status: 201 });
  } catch (error: any) {
    console.error('Error adding leader:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User is already a leader of this organization' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

