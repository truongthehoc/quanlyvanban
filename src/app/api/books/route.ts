import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

    const where: any = {};
    if (type) where.type = type;
    if (year) where.year = year;

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
    const { code, name, type, year, currentNumber = 0 } = body;

    if (!code || !name || !type || !year) {
      return NextResponse.json({ error: 'Missing required book fields' }, { status: 400 });
    }

    const created = await prisma.documentBook.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        type,
        year: parseInt(year.toString()),
        currentNumber: parseInt(currentNumber.toString()),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
