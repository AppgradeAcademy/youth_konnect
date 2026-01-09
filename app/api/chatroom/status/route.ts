import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET chatroom status for a group
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Check if ChatroomSettings exists for this group, if not create with default
    let settings = await prisma.chatroomSettings.findUnique({
      where: { groupId },
    });

    if (!settings) {
      settings = await prisma.chatroomSettings.create({
        data: {
          groupId,
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

// PATCH update chatroom status for a group
export async function PATCH(request: NextRequest) {
  try {
    const { isActive, groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const settings = await prisma.chatroomSettings.upsert({
      where: { groupId },
      update: { isActive: Boolean(isActive) },
      create: {
        groupId,
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


