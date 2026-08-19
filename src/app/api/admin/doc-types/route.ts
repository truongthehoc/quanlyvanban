import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const docTypes = await prisma.documentType.findMany({
      include: {
        defaultBook: true,
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    const books = await prisma.documentBook.findMany({
      where: { isActive: true },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({ docTypes, books });
  } catch (error) {
    console.error('Error fetching document types:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, numberingPattern, defaultBookId, description } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Mã và Tên loại văn bản là bắt buộc' }, { status: 400 });
    }

    const created = await prisma.documentType.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        numberingPattern: numberingPattern?.trim() || '{STT}/{MA_LOAI}-{MA_DV}',
        defaultBookId: defaultBookId || undefined,
        description: description?.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating document type:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, numberingPattern, defaultBookId, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updated = await prisma.documentType.update({
      where: { id },
      data: {
        name,
        numberingPattern,
        defaultBookId,
        description,
        isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating document type:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
