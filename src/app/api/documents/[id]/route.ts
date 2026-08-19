import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        documentType: true,
        department: true,
        book: true,
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        clerk: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        assignees: {
          include: {
            department: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            roleType: 'asc', // PRIMARY first, then COORDINATE
          },
        },
        attachments: true,
        processingLogs: {
          include: {
            actor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        internalAudiences: {
          include: {
            department: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Không tìm thấy văn bản' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error: any) {
    console.error('Error fetching document details:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi tải chi tiết văn bản' },
      { status: 500 }
    );
  }
}
