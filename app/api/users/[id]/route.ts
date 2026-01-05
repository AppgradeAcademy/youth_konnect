import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update user (username)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { username } = await request.json();

    // Validate username if provided
    if (username !== null && username !== undefined) {
      if (username.length > 50) {
        return NextResponse.json(
          { error: 'Username must be 50 characters or less' },
          { status: 400 }
        );
      }
      // Check if username is already taken (if not empty)
      if (username.trim() !== '') {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: username.trim(),
            id: { not: params.id },
          },
        });
        if (existingUser) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 400 }
          );
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        username: username === '' ? null : (username?.trim() || null),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

