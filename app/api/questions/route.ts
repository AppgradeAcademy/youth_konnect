import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all questions
export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: {
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
        },
        _count: {
          select: { answers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Don't expose user info for anonymous questions
    const sanitizedQuestions = questions.map(q => ({
      ...q,
      user: q.isAnonymous ? null : q.user,
    }));

    return NextResponse.json(sanitizedQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create question
export async function POST(request: NextRequest) {
  try {
    const { userId, title, content, isAnonymous, tags } = await request.json();

    if (!userId || !title || !content) {
      return NextResponse.json(
        { error: 'User ID, title, and content are required' },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        userId,
        title,
        content,
        isAnonymous: isAnonymous || false,
        tags: tags || null,
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

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

