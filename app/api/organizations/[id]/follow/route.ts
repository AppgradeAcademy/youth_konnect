import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST follow organization
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json();
    const organizationId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.organizationFollow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this organization' },
        { status: 400 }
      );
    }

    const follow = await prisma.organizationFollow.create({
      data: {
        userId,
        organizationId,
      },
    });

    return NextResponse.json(follow, { status: 201 });
  } catch (error: any) {
    console.error('Error following organization:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already following this organization' },
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

// DELETE unfollow organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const organizationId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.organizationFollow.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return NextResponse.json({ message: 'Unfollowed successfully' });
  } catch (error: any) {
    console.error('Error unfollowing organization:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET check if following
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const organizationId = params.id;

    if (!userId) {
      return NextResponse.json({ isFollowing: false });
    }

    const follow = await prisma.organizationFollow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error: any) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ isFollowing: false });
  }
}
