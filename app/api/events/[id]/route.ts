import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update event (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, date, time, place } = await request.json();

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (place !== undefined) updateData.place = place;

    const event = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(event);
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE event (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

