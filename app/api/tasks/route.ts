import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all tasks (optionally filtered by organization, assignedTo, or status)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const assignedToId = searchParams.get('assignedToId');
    const status = searchParams.get('status');
    const createdById = searchParams.get('createdById');

    const whereClause: any = {};
    if (organizationId) whereClause.organizationId = organizationId;
    if (assignedToId) whereClause.assignedToId = assignedToId;
    if (status) whereClause.status = status;
    if (createdById) whereClause.createdById = createdById;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new task (admin/leader only)
export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId, 
      title, 
      description, 
      assignedToId,
      dueDate,
      createdById 
    } = await request.json();

    if (!organizationId || !title || !createdById) {
      return NextResponse.json(
        { error: 'Organization ID, title, and creator ID are required' },
        { status: 400 }
      );
    }

    // Verify user is owner or leader of the organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    const isOwner = organization?.ownerId === createdById;
    const isLeader = await prisma.organizationLeader.findUnique({
      where: {
        userId_organizationId: {
          userId: createdById,
          organizationId,
        },
      },
    });

    if (!isOwner && !isLeader) {
      return NextResponse.json(
        { error: 'Only organization owners or leaders can create tasks' },
        { status: 403 }
      );
    }

    const task = await prisma.task.create({
      data: {
        organizationId,
        title,
        description: description || null,
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById,
        status: 'pending',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: assignedToId ? {
          select: {
            id: true,
            name: true,
            email: true,
          },
        } : undefined,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

