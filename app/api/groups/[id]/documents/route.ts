import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all documents for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;

    const documents = await prisma.groupDocument.findMany({
      where: { groupId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Error fetching group documents:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST upload a document to a group (group member only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const { title, description, fileUrl, fileType, uploadedById } = await request.json();

    if (!title || !fileUrl || !uploadedById) {
      return NextResponse.json(
        { error: 'Title, file URL, and uploader ID are required' },
        { status: 400 }
      );
    }

    // Verify user is a member of the group
    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId: uploadedById,
          groupId,
        },
      },
    });

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    const isOwner = group?.ownerId === uploadedById;

    if (!membership && !isOwner) {
      return NextResponse.json(
        { error: 'You must be a member of this group to upload documents' },
        { status: 403 }
      );
    }

    const document = await prisma.groupDocument.create({
      data: {
        groupId,
        title,
        description: description || null,
        fileUrl,
        fileType: fileType || null,
        uploadedById,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group document:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

