import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true, documents: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, description } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Mã và Tên phòng ban là bắt buộc' }, { status: 400 });
    }

    const created = await prisma.department.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description?.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
