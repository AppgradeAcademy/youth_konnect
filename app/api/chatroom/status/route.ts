import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET chatroom status
export async function GET() {
  try {
    // Check if ChatroomSettings exists, if not create with default
    let settings = await prisma.chatroomSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      settings = await prisma.chatroomSettings.create({
        data: {
          id: 'main',
          isActive: true,
        },
      });
    }

    return NextResponse.json({ isActive: settings.isActive });
  } catch (error) {
    console.error('Error fetching chatroom status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update chatroom status
export async function PATCH(request: NextRequest) {
  try {
    const { isActive } = await request.json();

    const settings = await prisma.chatroomSettings.upsert({
      where: { id: 'main' },
      update: { isActive: Boolean(isActive) },
      create: {
        id: 'main',
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ isActive: settings.isActive });
  } catch (error) {
    console.error('Error updating chatroom status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


