import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE a group document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const groupId = params.id;
    const docId = params.docId;

    const document = await prisma.groupDocument.findUnique({
      where: { id: docId },
      select: {
        groupId: true,
        uploadedById: true,
      },
    });

    if (!document || document.groupId !== groupId) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    const isOwner = group?.ownerId === userId;
    const isUploader = document.uploadedById === userId;

    if (!isOwner && !isUploader) {
      return NextResponse.json(
        { error: 'Only group owners or document uploaders can delete documents' },
        { status: 403 }
      );
    }

    await prisma.groupDocument.delete({
      where: { id: docId },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting group document:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

