import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE vote for a contestant (userId required)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { contestantId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please log in.' },
        { status: 401 }
      );
    }

    await prisma.vote.deleteMany({
      where: {
        contestantId: params.contestantId,
        userId,
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
