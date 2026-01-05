import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all contestants for a category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contestants = await prisma.contestant.findMany({
      where: { categoryId: params.id },
      include: {
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(contestants);
  } catch (error: any) {
    console.error('Error fetching contestants:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined 
      },
      { status: 500 }
    );
  }
}

// POST create new contestant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, surname, picture } = await request.json();

    if (!name || !surname) {
      return NextResponse.json(
        { error: 'Name and surname are required' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const contestant = await prisma.contestant.create({
      data: {
        categoryId: params.id,
        name,
        surname,
        picture: picture || null,
      },
    });

    return NextResponse.json(contestant, { status: 201 });
  } catch (error) {
    console.error('Error creating contestant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

