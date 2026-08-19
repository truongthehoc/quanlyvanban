import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateIncomingDocumentNumber } from '@/lib/numbering-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');
    const search = searchParams.get('search');
    const senderOrg = searchParams.get('senderOrg');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const departmentId = searchParams.get('departmentId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    const where: any = {
      documentTypeDoc: 'INCOMING',
    };

    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        where.status = { in: ['PENDING_DIRECTIVE', 'DRAFT'] };
      } else if (status === 'PROCESSING') {
        where.status = { in: ['DIRECTED', 'PROCESSING'] };
      } else if (status === 'COMPLETED') {
        where.status = 'COMPLETED';
      } else if (status === 'OVERDUE') {
        where.OR = [
          { status: 'OVERDUE' },
          {
            dueDate: { lt: new Date() },
            status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          },
        ];
      } else {
        where.status = status;
      }
    }

    if (urgency && urgency !== 'ALL') {
      where.urgencyLevel = urgency;
    }

    if (senderOrg && senderOrg !== 'ALL') {
      where.senderOrg = senderOrg;
    }

    if (dateFrom || dateTo) {
      where.arrivalDate = {};
      if (dateFrom) where.arrivalDate.gte = new Date(dateFrom);
      if (dateTo) {
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59, 999);
        where.arrivalDate.lte = dTo;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { documentNumber: { contains: search } },
        { senderOrg: { contains: search } },
        { subNumber: { contains: search } },
      ];
    }

    // Role-based visibility
    if (role === 'HEAD_DEPT' && departmentId) {
      where.OR = [
        { departmentId },
        { assignees: { some: { departmentId } } },
      ];
    } else if (role === 'OFFICER' && userId) {
      where.assignees = {
        some: { userId },
      };
    }

    const [documents, totalCount, pendingCount, processingCount, completedCount, overdueCount, senderOrgs] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          documentType: true,
          department: true,
          book: true,
          leader: true,
          clerk: true,
          creator: true,
          assignees: {
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
        orderBy: { arrivalDate: 'desc' },
      }),
      prisma.document.count({ where: { documentTypeDoc: 'INCOMING' } }),
      prisma.document.count({
        where: { documentTypeDoc: 'INCOMING', status: { in: ['PENDING_DIRECTIVE', 'DRAFT'] } },
      }),
      prisma.document.count({
        where: { documentTypeDoc: 'INCOMING', status: { in: ['DIRECTED', 'PROCESSING'] } },
      }),
      prisma.document.count({
        where: { documentTypeDoc: 'INCOMING', status: 'COMPLETED' },
      }),
      prisma.document.count({
        where: {
          documentTypeDoc: 'INCOMING',
          OR: [
            { status: 'OVERDUE' },
            { dueDate: { lt: new Date() }, status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
          ],
        },
      }),
      prisma.document.findMany({
        where: { documentTypeDoc: 'INCOMING', senderOrg: { not: null } },
        select: { senderOrg: true },
        distinct: ['senderOrg'],
      }),
    ]);

    return NextResponse.json({
      documents,
      stats: {
        total: totalCount,
        pending: pendingCount,
        processing: processingCount,
        completed: completedCount,
        overdue: overdueCount,
      },
      senderOrgs: senderOrgs.map((s) => s.senderOrg).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching incoming documents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentNumber,
      title,
      summary,
      senderOrg,
      issueDate,
      arrivalDate,
      dueDate,
      urgencyLevel,
      confidentialityLevel,
      documentTypeId,
      creatorId,
      submitDirectlyToLeader = true,
    } = body;

    if (!title || !creatorId) {
      return NextResponse.json({ error: 'Trích yếu và Người tạo là bắt buộc' }, { status: 400 });
    }

    // 1. Sinh số vào sổ đến tự động
    const { autoSequence, subNumber, bookId } = await generateIncomingDocumentNumber();

    const initialStatus = submitDirectlyToLeader ? 'PENDING_DIRECTIVE' : 'DRAFT';

    // 2. Tạo bản ghi Document
    const newDoc = await prisma.document.create({
      data: {
        documentNumber: documentNumber || `Đến-${autoSequence}`,
        autoSequence,
        subNumber,
        documentTypeDoc: 'INCOMING',
        title,
        summary,
        senderOrg,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        arrivalDate: arrivalDate ? new Date(arrivalDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        urgencyLevel: urgencyLevel || 'NORMAL',
        confidentialityLevel: confidentialityLevel || 'NORMAL',
        status: initialStatus,
        clerkId: creatorId,
        creatorId,
        documentTypeId: documentTypeId || undefined,
        bookId,
        processingLogs: {
          create: [
            {
              actorId: creatorId,
              action: 'TIẾP NHẬN VÀO SỔ',
              notes: `Tiếp nhận văn bản số ${documentNumber || ''}, cấp số đến: ${subNumber}. ${submitDirectlyToLeader ? 'Đã trình Lãnh đạo xin ý kiến chỉ đạo.' : ''}`,
              fromStatus: 'DRAFT',
              toStatus: initialStatus,
            },
          ],
        },
      },
      include: {
        documentType: true,
        department: true,
        book: true,
        creator: true,
      },
    });

    // 3. Gửi thông báo đến Lãnh đạo nếu trình duyệt ngay
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
            title: 'Văn bản đến mới cần cho ý kiến',
            content: `Văn thư đã tiếp nhận văn bản: "${title}". Số đến: ${subNumber}`,
            link: `/van-ban-den`,
            type: 'DIRECTIVE',
          },
        });
      }
    }

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: any) {
    console.error('Error creating incoming document:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
