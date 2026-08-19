import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_CATEGORIES = [
  { code: 'GOVERNMENT', name: 'Cơ quan Nhà nước (UBND, Bộ, Ngành, BHXH...)', color: 'blue', order: 1, isDefault: true },
  { code: 'DEPARTMENT', name: 'Sở ban ngành địa phương (Sở Y tế, Tài chính, GD&ĐT...)', color: 'purple', order: 2, isDefault: true },
  { code: 'ENTERPRISE', name: 'Doanh nghiệp / Đơn vị Bưu chính', color: 'amber', order: 3, isDefault: true },
  { code: 'PARTNER', name: 'Đối tác / Tổ chức khác', color: 'emerald', order: 4, isDefault: true },
];

export async function GET(req: NextRequest) {
  try {
    let categories = await prisma.organizationCategory.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    // Seed default categories if none exist
    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.organizationCategory.create({
          data: cat,
        });
      }
      categories = await prisma.organizationCategory.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });
    } else {
      // If existing categories have order 0 or unassigned, ensure they have sequential order
      let hasZeroOrder = categories.some((c) => c.order === 0);
      if (hasZeroOrder) {
        for (let i = 0; i < categories.length; i++) {
          if (categories[i].order === 0) {
            await prisma.organizationCategory.update({
              where: { id: categories[i].id },
              data: { order: i + 1 },
            });
          }
        }
        categories = await prisma.organizationCategory.findMany({
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
      }
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching organization categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, color, order, description } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Mã và Tên phân loại là bắt buộc' }, { status: 400 });
    }

    const formattedCode = code.toUpperCase().trim().replace(/[\s-]/g, '_');

    const existing = await prisma.organizationCategory.findUnique({
      where: { code: formattedCode },
    });

    if (existing) {
      return NextResponse.json({ error: 'Mã phân loại này đã tồn tại' }, { status: 400 });
    }

    // Determine default order if not specified
    let targetOrder = Number(order);
    if (isNaN(targetOrder) || targetOrder < 1) {
      const maxOrderCat = await prisma.organizationCategory.findFirst({
        orderBy: { order: 'desc' },
      });
      targetOrder = (maxOrderCat?.order || 0) + 1;
    }

    const created = await prisma.organizationCategory.create({
      data: {
        code: formattedCode,
        name: name.trim(),
        color: color || 'blue',
        order: targetOrder,
        description: description?.trim() || null,
        isDefault: false,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organization category:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, color, order, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = Number(order) || 0;
    if (description !== undefined) updateData.description = description?.trim() || null;

    const updated = await prisma.organizationCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating organization category:', error);
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

    const category = await prisma.organizationCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Không tìm thấy phân loại' }, { status: 404 });
    }

    // Check if any organization is using this category code
    const inUseCount = await prisma.organization.count({
      where: { type: category.code },
    });

    if (inUseCount > 0) {
      return NextResponse.json(
        { error: `Đang có ${inUseCount} cơ quan/đơn vị thuộc phân loại này. Không thể xóa!` },
        { status: 400 }
      );
    }

    await prisma.organizationCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting organization category:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
