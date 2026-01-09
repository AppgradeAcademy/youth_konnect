import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all organizations (for users to follow)
export async function GET(request: NextRequest) {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            followers: true,
            groups: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST create organization (admin only)
export async function POST(request: NextRequest) {
  try {
    const { name, description, ownerId } = await request.json();

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: 'Name and owner ID are required' },
        { status: 400 }
      );
    }

    // Verify owner is admin
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true },
    });

    if (!owner || owner.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create organizations' },
        { status: 403 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        ownerId,
      },
      include: {
        _count: {
          select: {
            followers: true,
            groups: true,
          },
        },
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Organization with this name already exists' },
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

