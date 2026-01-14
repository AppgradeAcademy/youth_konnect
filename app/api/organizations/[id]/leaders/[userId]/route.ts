import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE remove leader from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const organizationId = params.id;
    const userId = params.userId;
    const searchParams = request.nextUrl.searchParams;
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
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
        { error: 'Only the organization owner can remove leaders' },
        { status: 403 }
      );
    }

    await prisma.organizationLeader.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return NextResponse.json({ message: 'Leader removed successfully' });
  } catch (error: any) {
    console.error('Error removing leader:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

