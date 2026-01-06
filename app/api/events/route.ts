import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST create new event (admin only)
export async function POST(request: NextRequest) {
  try {
    const { name, date, time, place } = await request.json();

    if (!name || !date || !time || !place) {
      return NextResponse.json(
        { error: 'Name, date, time, and place are required' },
        { status: 400 }
      );
    }

    // Convert date string to DateTime
    const eventDate = new Date(date);

    const event = await prisma.event.create({
      data: {
        name,
        date: eventDate,
        time,
        place,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

