import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET organization owned by user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findFirst({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            followers: true,
            groups: true,
            leaders: true,
            programs: true,
            schedules: true,
            events: true,
            announcements: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

