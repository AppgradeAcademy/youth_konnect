import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET votes for a user (userId required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const votes = await prisma.vote.findMany({
      where: { userId },
      include: {
        category: true,
        contestant: true,
      },
    });

    return NextResponse.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create vote (userId required, one vote per category)
export async function POST(request: NextRequest) {
  try {
    const { userId, categoryId, contestantId } = await request.json();

    if (!categoryId || !contestantId) {
      return NextResponse.json(
        { error: 'Category ID and Contestant ID are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please log in to vote.' },
        { status: 401 }
      );
    }

    // Delete any existing vote for this user in this category (one vote per category)
    await prisma.vote.deleteMany({
      where: {
        userId,
        categoryId,
      },
    });

    // Create the new vote
    const vote = await prisma.vote.create({
      data: {
        userId,
        categoryId,
        contestantId,
      },
      include: {
        category: true,
        contestant: true,
      },
    });

    return NextResponse.json(vote, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
