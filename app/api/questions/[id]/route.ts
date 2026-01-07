import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update question/post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, title, content, isAnonymous, tags, imageUrl } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify the post exists and belongs to the user
    const existingPost = await prisma.question.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own posts' },
        { status: 403 }
      );
    }

    // Update the post
    const updatedPost = await prisma.question.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(isAnonymous !== undefined && { isAnonymous }),
        ...(tags !== undefined && { tags }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { answers: true },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE question/post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify the post exists and belongs to the user
    const existingPost = await prisma.question.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete the post (answers will be deleted via cascade)
    await prisma.question.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
