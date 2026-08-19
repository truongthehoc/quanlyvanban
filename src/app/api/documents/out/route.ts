import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const departmentId = searchParams.get('departmentId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    const where: any = {
      documentTypeDoc: 'OUTGOING',
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { documentNumber: { contains: search } },
        { recipientOrg: { contains: search } },
      ];
    }

    // Role-based visibility
    if (role === 'HEAD_DEPT' && departmentId) {
      where.departmentId = departmentId;
    } else if (role === 'OFFICER' && userId) {
      where.creatorId = userId;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        documentType: true,
        department: true,
        book: true,
        leader: true,
        clerk: true,
        creator: true,
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
    console.error('Error fetching outgoing documents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      summary,
      recipientOrg,
      urgencyLevel,
      confidentialityLevel,
      documentTypeId,
      creatorId,
      departmentId,
      submitDirectlyToLeader = false,
    } = body;

    if (!title || !creatorId) {
      return NextResponse.json({ error: 'Trích yếu và Người soạn thảo là bắt buộc' }, { status: 400 });
    }

    const initialStatus = submitDirectlyToLeader ? 'PENDING_APPROVAL' : 'DRAFT';

    const newDoc = await prisma.document.create({
      data: {
        documentTypeDoc: 'OUTGOING',
        title,
        summary,
        recipientOrg,
        urgencyLevel: urgencyLevel || 'NORMAL',
        confidentialityLevel: confidentialityLevel || 'NORMAL',
        status: initialStatus,
        creatorId,
        departmentId: departmentId || undefined,
        documentTypeId: documentTypeId || undefined,
        processingLogs: {
          create: [
            {
              actorId: creatorId,
              action: 'SOẠN THẢO DỰ THẢO',
              notes: `Tạo dự thảo văn bản đi. ${submitDirectlyToLeader ? 'Đã trình Lãnh đạo phê duyệt.' : 'Lưu dự thảo.'}`,
              fromStatus: null,
              toStatus: initialStatus,
            },
          ],
        },
      },
      include: {
        documentType: true,
        department: true,
        creator: true,
      },
    });

    // Notify leaders if submitted directly
    if (submitDirectlyToLeader) {
      const leaders = await prisma.user.findMany({
        where: {
          roles: { some: { role: { code: 'LEADER' } } },
          isActive: true,
        },
      });

      for (const leader of leaders) {
        await prisma.notification.create({
          data: {
            userId: leader.id,
            title: 'Dự thảo văn bản đi cần phê duyệt',
            content: `Có dự thảo mới: "${title}" cần xem xét ký duyệt.`,
            link: `/van-ban-di`,
            type: 'DIRECTIVE',
          },
        });
      }
    }

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: any) {
    console.error('Error creating outgoing document draft:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
