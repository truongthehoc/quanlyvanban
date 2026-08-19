import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    const where: any = {};
    if (type && type !== 'ALL') {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { shortName: { contains: search } },
      ];
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: {
            incomingDocuments: true,
            outgoingDocuments: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, shortName, type, email, phone, address } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Mã và Tên cơ quan/đơn vị là bắt buộc' }, { status: 400 });
    }

    const created = await prisma.organization.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        shortName: shortName?.trim() || name.trim(),
        type: type || 'GOVERNMENT',
        email: email?.trim(),
        phone: phone?.trim(),
        address: address?.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, shortName, type, email, phone, address, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name,
        shortName,
        type,
        email,
        phone,
        address,
        isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
