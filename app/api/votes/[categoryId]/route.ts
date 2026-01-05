import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET vote count for a category
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const count = await prisma.vote.count({
      where: { categoryId: params.categoryId },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching vote count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE vote (supports both userId and email)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or Email is required' },
        { status: 400 }
      );
    }

    await prisma.vote.deleteMany({
      where: {
        categoryId: params.categoryId,
        ...(userId ? { userId } : { email }),
      },
    });

    return NextResponse.json({ message: 'Vote removed' });
  } catch (error) {
    console.error('Error deleting vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
