import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update program
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = params.id;
    const { title, description, imageUrl, date, location, isActive, userId } = await request.json();

    // Verify user is creator or organization owner/leader
    const program = await prisma.churchProgram.findUnique({
      where: { id: programId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    const isCreator = program.createdById === userId;
    const isOwner = program.organization.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: program.organizationId,
        },
      },
    });

    if (!isCreator && !isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only program creators, organization owners, or leaders can update programs' },
        { status: 403 }
      );
    }

    const updated = await prisma.churchProgram.update({
      where: { id: programId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
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
    console.error('Error updating program:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user is creator or organization owner/leader
    const program = await prisma.churchProgram.findUnique({
      where: { id: programId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    const isCreator = program.createdById === userId;
    const isOwner = program.organization.ownerId === userId;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: program.organizationId,
        },
      },
    });

    if (!isCreator && !isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only program creators, organization owners, or leaders can delete programs' },
        { status: 403 }
      );
    }

    await prisma.churchProgram.delete({
      where: { id: programId },
    });

    return NextResponse.json({ message: 'Program deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

