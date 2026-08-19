import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        department: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const userDTOs = users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      position: u.position,
      departmentId: u.departmentId,
      departmentName: u.department?.name,
      departmentCode: u.department?.code,
      roles: u.roles.map((r) => r.role.code),
      avatar: u.avatar,
    }));

    // Fetch Role Permissions
    const rolePerms = await prisma.rolePermission.findMany({
      include: {
        role: true,
        permission: true,
      },
    });

    const rolePermissionsMap: Record<string, string[]> = {};
    rolePerms.forEach((rp) => {
      const rCode = rp.role.code;
      if (!rolePermissionsMap[rCode]) {
        rolePermissionsMap[rCode] = [];
      }
      rolePermissionsMap[rCode].push(rp.permission.code);
    });

    return NextResponse.json({
      users: userDTOs,
      rolePermissions: rolePermissionsMap,
    });
  } catch (error) {
    console.error('Error in /api/auth/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
