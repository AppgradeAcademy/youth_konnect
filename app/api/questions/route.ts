import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all questions with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId'); // Current user ID for filtering
    const filter = searchParams.get('filter') || 'all'; // 'all', 'forYou', 'following'

    let whereClause: any = {};

    // If filter is 'forYou' or 'following', we need userId
    if ((filter === 'forYou' || filter === 'following') && userId) {
      let allowedUserIds: string[] = [];

      if (filter === 'following') {
        // Get users the current user follows
        try {
          const followingIds = await prisma.userFollow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
          });
          allowedUserIds = followingIds.map(f => f.followingId);
        } catch (error: any) {
          console.warn('UserFollow table may not exist yet:', error?.message);
        }
      } else if (filter === 'forYou') {
        // Get users from groups the current user is a member of + users they follow
        try {
          // Get groups the user is a member of
          const memberships = await prisma.groupMembership.findMany({
            where: { userId },
            select: { groupId: true },
          });
          const groupIds = memberships.map(m => m.groupId);

          // Get all users in those groups
          const groupMembers = await prisma.groupMembership.findMany({
            where: { groupId: { in: groupIds } },
            select: { userId: true },
          });
          const groupUserIds = [...new Set(groupMembers.map(m => m.userId))];

          // Get users the current user follows
          const followingIds = await prisma.userFollow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
          });
          const followingUserIds = followingIds.map(f => f.followingId);

          // Combine: users in same groups + users they follow
          allowedUserIds = [...new Set([...groupUserIds, ...followingUserIds])];
        } catch (error: any) {
          console.warn('Error fetching forYou filter data:', error?.message);
        }
      }

      if (allowedUserIds.length > 0) {
        whereClause.userId = { in: allowedUserIds };
      } else {
        // No matching users, return empty array
        return NextResponse.json([]);
      }
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        isAnonymous: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
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
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    console.error('Error details:', error?.message, error?.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST create question
export async function POST(request: NextRequest) {
  try {
    const { userId, title, content, isAnonymous, tags, imageUrl } = await request.json();

    if (!userId || !title) {
      return NextResponse.json(
        { error: 'User ID and title are required' },
        { status: 400 }
      );
    }
    
    // If content is not provided, use title as content
    const finalContent = content || title;

    const question = await prisma.question.create({
      data: {
        userId,
        title,
        content: finalContent,
        isAnonymous: isAnonymous || false,
        tags: tags || null,
        imageUrl: imageUrl || null,
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
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

