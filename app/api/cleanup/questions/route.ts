import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE questions older than 30 days
export async function POST(request: NextRequest) {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete questions older than 30 days
    const result = await prisma.question.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return NextResponse.json({
      message: `Deleted ${result.count} question(s) older than 30 days`,
      deletedCount: result.count,
      cutoffDate: thirtyDaysAgo.toISOString(),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error cleaning up questions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check how many questions would be deleted (for testing)
export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const count = await prisma.question.count({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return NextResponse.json({
      message: `${count} question(s) are older than 30 days`,
      count,
      cutoffDate: thirtyDaysAgo.toISOString(),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error checking questions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}




