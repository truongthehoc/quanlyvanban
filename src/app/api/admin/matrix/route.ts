import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [roles, permissions, rolePermissions] = await Promise.all([
      prisma.role.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.permission.findMany({ orderBy: { module: 'asc' } }),
      prisma.rolePermission.findMany(),
    ]);

    // Build role matrix data
    const matrix = roles.map((role) => {
      const permsForRole = rolePermissions
        .filter((rp) => rp.roleId === role.id)
        .map((rp) => rp.permissionId);

      return {
        roleId: role.id,
        roleCode: role.code,
        roleName: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissionIds: permsForRole,
      };
    });

    return NextResponse.json({
      roles,
      permissions,
      matrix,
    });
  } catch (error) {
    console.error('Error fetching permission matrix:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roleId, permissionId, enabled } = body;

    if (!roleId || !permissionId) {
      return NextResponse.json({ error: 'roleId and permissionId are required' }, { status: 400 });
    }

    if (enabled) {
      // Add permission to role
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    } else {
      // Remove permission from role
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId,
        },
      });
    }

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error('Error updating permission matrix:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
