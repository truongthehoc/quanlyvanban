import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

    const where: any = {};
    if (type && type !== 'ALL') where.type = type;
    if (year && !isNaN(year)) where.year = year;

    const books = await prisma.documentBook.findMany({
      where,
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: [{ year: 'desc' }, { type: 'asc' }],
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, type, year, currentNumber, startNumber = 1, isActive = true } = body;

    if (!code || !name || !type || !year) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ các trường bắt buộc' }, { status: 400 });
    }

    // Determine initial currentNumber based on startNumber or provided currentNumber
    const initCurrent = currentNumber !== undefined && currentNumber !== null
      ? parseInt(currentNumber.toString())
      : Math.max(0, parseInt(startNumber.toString()) - 1);

    const created = await prisma.documentBook.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        year: parseInt(year.toString()),
        currentNumber: initCurrent,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, type, year, currentNumber, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID sổ văn bản' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (type) updateData.type = type;
    if (year) updateData.year = parseInt(year.toString());
    if (currentNumber !== undefined && currentNumber !== null) updateData.currentNumber = parseInt(currentNumber.toString());
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.documentBook.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating book:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID sổ văn bản' }, { status: 400 });
    }

    // Check if book has documents
    const docCount = await prisma.document.count({
      where: { bookId: id },
    });

    if (docCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa sổ này vì đã có ${docCount} văn bản lưu trữ. Vui lòng chuyển hoặc lưu trữ trước!` },
        { status: 400 }
      );
    }

    await prisma.documentBook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa sổ văn bản thành công' });
  } catch (error: any) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
