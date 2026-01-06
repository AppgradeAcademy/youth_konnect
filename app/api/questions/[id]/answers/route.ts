import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all answers for a question
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const answers = await prisma.answer.findMany({
      where: { questionId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(answers);
  } catch (error: any) {
    console.error('Error fetching answers:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST create answer to a question
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, content } = await request.json();

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id: params.id },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const answer = await prisma.answer.create({
      data: {
        questionId: params.id,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(answer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}


