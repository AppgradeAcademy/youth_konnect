import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint can be called by external cron services (like Vercel Cron, EasyCron, etc.)
// Set up a cron job to call this endpoint daily: POST /api/cron/cleanup-questions
// Optional: Add authorization header check for security

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization check for security
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

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

    console.log(`[Cron] Cleaned up ${result.count} question(s) older than 30 days`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} question(s) older than 30 days`,
      deletedCount: result.count,
      cutoffDate: thirtyDaysAgo.toISOString(),
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Cron] Error cleaning up questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}

