import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const roles = await prisma.role.findMany({
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ users, roles });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, fullName, position, email, phone, departmentId, roleCodes = [] } = body;

    if (!username || !fullName || !position) {
      return NextResponse.json({ error: 'Tên đăng nhập, họ tên và chức vụ là bắt buộc' }, { status: 400 });
    }

    const createdUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        fullName: fullName.trim(),
        position: position.trim(),
        email: email?.trim(),
        phone: phone?.trim(),
        departmentId: departmentId || undefined,
      },
    });

    // Assign roles
    for (const code of roleCodes) {
      const role = await prisma.role.findUnique({ where: { code } });
      if (role) {
        await prisma.userRole.create({
          data: {
            userId: createdUser.id,
            roleId: role.id,
          },
        });
      }
    }

    return NextResponse.json(createdUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
