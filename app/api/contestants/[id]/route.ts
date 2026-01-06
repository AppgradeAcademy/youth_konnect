import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update contestant
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, surname, picture } = body;

    const contestant = await prisma.contestant.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(surname !== undefined && { surname }),
        ...(picture !== undefined && { picture }),
      },
    });

    return NextResponse.json(contestant);
  } catch (error) {
    console.error('Error updating contestant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE contestant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contestant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Contestant deleted successfully' });
  } catch (error) {
    console.error('Error deleting contestant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




