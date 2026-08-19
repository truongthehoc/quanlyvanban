import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const departmentId = searchParams.get('departmentId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    const where: any = {
      documentTypeDoc: 'INTERNAL',
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { documentNumber: { contains: search } },
      ];
    }

    // Role-based visibility for internal documents
    if (role !== 'ADMIN' && role !== 'LEADER') {
      where.internalAudiences = {
        some: {
          OR: [
            { scopeType: 'ALL' },
            departmentId ? { departmentId } : {},
            userId ? { userId } : {},
          ],
        },
      };
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        documentType: true,
        department: true,
        creator: true,
        internalAudiences: {
          include: {
            department: true,
            user: true,
          },
        },
        processingLogs: {
          include: {
            actor: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching internal documents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      summary,
      documentNumber,
      documentTypeId,
      creatorId,
      departmentId,
      scopeType = 'ALL', // 'ALL' | 'DEPARTMENT'
      targetDepartmentIds = [],
    } = body;

    if (!title || !creatorId) {
      return NextResponse.json({ error: 'Trích yếu và Người đăng tải là bắt buộc' }, { status: 400 });
    }

    // 1. Tạo bản ghi Document
    const newDoc = await prisma.document.create({
      data: {
        documentNumber: documentNumber || 'NB-LƯU',
        documentTypeDoc: 'INTERNAL',
        title,
        summary,
        issueDate: new Date(),
        status: 'ISSUED',
        creatorId,
        departmentId: departmentId || undefined,
        documentTypeId: documentTypeId || undefined,
        processingLogs: {
          create: [
            {
              actorId: creatorId,
              action: 'ĐĂNG TẢI VĂN BẢN NỘI BỘ',
              notes: `Phát hành văn bản nội bộ. Phạm vi: ${scopeType === 'ALL' ? 'Toàn cơ quan' : 'Các phòng ban được chọn'}.`,
              fromStatus: null,
              toStatus: 'ISSUED',
            },
          ],
        },
      },
    });

    // 2. Tạo đối tượng xem (InternalAudiences)
    if (scopeType === 'ALL') {
      await prisma.documentInternalAudience.create({
        data: {
          documentId: newDoc.id,
          scopeType: 'ALL',
          isRead: false,
        },
      });

      // Gửi thông báo đến tất cả user active
      const allUsers = await prisma.user.findMany({ where: { isActive: true } });
      await prisma.notification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          title: 'Văn bản nội bộ mới',
          content: `Có thông báo nội bộ mới: "${title}"`,
          link: `/van-ban-noi-bo`,
          type: 'INTERNAL_NEW',
        })),
      });
    } else {
      // Phạm vi theo các phòng ban được chọn
      for (const dId of targetDepartmentIds) {
        await prisma.documentInternalAudience.create({
          data: {
            documentId: newDoc.id,
            departmentId: dId,
            scopeType: 'DEPARTMENT',
            isRead: false,
          },
        });

        // Gửi thông báo đến các nhân sự thuộc phòng ban
        const deptUsers = await prisma.user.findMany({
          where: { departmentId: dId, isActive: true },
        });

        if (deptUsers.length > 0) {
          await prisma.notification.createMany({
            data: deptUsers.map((u) => ({
              userId: u.id,
              title: 'Văn bản nội bộ gửi đến Đơn vị',
              content: `Đơn vị bạn nhận được văn bản nội bộ mới: "${title}"`,
              link: `/van-ban-noi-bo`,
              type: 'INTERNAL_NEW',
            })),
          });
        }
      }
    }

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: any) {
    console.error('Error creating internal document:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
