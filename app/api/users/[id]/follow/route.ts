import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { followerId } = await request.json();
    const followingId = params.id;

    if (!followerId) {
      return NextResponse.json(
        { error: 'Follower ID is required' },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Create follow relationship
    const follow = await prisma.userFollow.create({
      data: {
        followerId,
        followingId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(follow, { status: 201 });
  } catch (error: any) {
    console.error('Error following user:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    
    // Handle duplicate unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 409 }
      );
    }
    
    // Handle foreign key constraint error (user doesn't exist)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const followerId = searchParams.get('followerId');
    const followingId = params.id;

    if (!followerId) {
      return NextResponse.json(
        { error: 'Follower ID is required' },
        { status: 400 }
      );
    }

    await prisma.userFollow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });

    return NextResponse.json({ message: 'Unfollowed successfully' });
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET - Check if user is following
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const followerId = searchParams.get('followerId');
    const followingId = params.id;

    if (!followerId) {
      return NextResponse.json({ isFollowing: false });
    }

    const follow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error: any) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { 
        isFollowing: false,
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      }
    );
  }
}

