import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST/UPDATE RSVP to an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const { userId, status } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (status && !['going', 'interested'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "going" or "interested"' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if RSVP already exists
    const existingRSVP = await prisma.eventRSVP.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingRSVP) {
      // Update existing RSVP
      const rsvp = await prisma.eventRSVP.update({
        where: { id: existingRSVP.id },
        data: {
          status: status || existingRSVP.status,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(rsvp);
    } else {
      // Create new RSVP
      const rsvp = await prisma.eventRSVP.create({
        data: {
          eventId,
          userId,
          status: status || 'interested',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(rsvp, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating/updating RSVP:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE remove RSVP
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.eventRSVP.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    return NextResponse.json({ message: 'RSVP removed successfully' });
  } catch (error: any) {
    console.error('Error removing RSVP:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET RSVPs for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // Optional filter by status

    const whereClause: any = { eventId };
    if (status && ['going', 'interested'].includes(status)) {
      whereClause.status = status;
    }

    const rsvps = await prisma.eventRSVP.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(rsvps);
  } catch (error: any) {
    console.error('Error fetching RSVPs:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

