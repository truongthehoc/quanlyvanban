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

    const andConditions: any[] = [
      { documentTypeDoc: 'INCOMING' }
    ];

    // Role-based visibility
    if (role === 'HEAD_DEPT' && departmentId) {
      andConditions.push({
        OR: [
          { departmentId },
          { assignees: { some: { departmentId } } },
        ],
      });
    } else if (role === 'OFFICER' && userId) {
      andConditions.push({
        assignees: {
          some: { userId },
        },
      });
    }

    // Role-scoped base condition for stat cards
    const baseWhere = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };

    // Build filter conditions for document list
    const filterConditions = [...andConditions];

    if (status && status !== 'ALL') {
      if (status === 'PENDING_DIRECTIVE' || status === 'PENDING') {
        filterConditions.push({
          status: { in: ['PENDING_DIRECTIVE', 'DRAFT', 'DIRECTED', 'PENDING_PROCESSING'] }
        });
      } else if (status === 'DIRECTED') {
        filterConditions.push({ status: 'DIRECTED' });
      } else if (status === 'PROCESSING') {
        filterConditions.push({
          status: { in: ['PROCESSING', 'IN_PROGRESS'] }
        });
      } else if (status === 'COMPLETED') {
        filterConditions.push({
          status: { in: ['COMPLETED', 'PROCESSED'] }
        });
      } else if (status === 'OVERDUE') {
        filterConditions.push({
          OR: [
            { status: 'OVERDUE' },
            {
              dueDate: { lt: new Date() },
              status: { notIn: ['COMPLETED', 'ARCHIVED', 'PROCESSED'] },
            },
          ],
        });
      } else {
        filterConditions.push({ status });
      }
    }

    if (urgency && urgency !== 'ALL') {
      filterConditions.push({ urgencyLevel: urgency });
    }

    if (senderOrg && senderOrg !== 'ALL') {
      filterConditions.push({ senderOrg });
    }

    if (dateFrom || dateTo) {
      const dateCond: any = {};
      if (dateFrom) dateCond.gte = new Date(dateFrom);
      if (dateTo) {
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59, 999);
        dateCond.lte = dTo;
      }
      filterConditions.push({ arrivalDate: dateCond });
    }

    if (search) {
      filterConditions.push({
        OR: [
          { title: { contains: search } },
          { documentNumber: { contains: search } },
          { senderOrg: { contains: search } },
          { subNumber: { contains: search } },
        ],
      });
    }

    const queryWhere = filterConditions.length === 1 ? filterConditions[0] : { AND: filterConditions };

    const [documents, totalCount, pendingCount, processingCount, completedCount, overdueCount, senderOrgs] = await Promise.all([
      prisma.document.findMany({
        where: queryWhere,
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
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
          attachments: { select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true } },
        },
        orderBy: { arrivalDate: 'desc' },
      }),
      prisma.document.count({ where: baseWhere }),
      prisma.document.count({
        where: {
          AND: [
            baseWhere,
            { status: { in: ['PENDING_DIRECTIVE', 'DRAFT', 'DIRECTED', 'PENDING_PROCESSING'] } },
          ],
        },
      }),
      prisma.document.count({
        where: {
          AND: [
            baseWhere,
            { status: { in: ['PROCESSING', 'IN_PROGRESS'] } },
          ],
        },
      }),
      prisma.document.count({
        where: {
          AND: [
            baseWhere,
            { status: { in: ['COMPLETED', 'PROCESSED'] } },
          ],
        },
      }),
      prisma.document.count({
        where: {
          AND: [
            baseWhere,
            {
              OR: [
                { status: 'OVERDUE' },
                { dueDate: { lt: new Date() }, status: { notIn: ['COMPLETED', 'ARCHIVED', 'PROCESSED'] } },
              ],
            },
          ],
        },
      }),
      prisma.document.findMany({
        where: {
          AND: [
            baseWhere,
            { senderOrg: { not: null } },
          ],
        },
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
      leaderId,
      attachments = [],
    } = body;

    if (!title || !creatorId) {
      return NextResponse.json({ error: 'Trích yếu và Người tạo là bắt buộc' }, { status: 400 });
    }

    // 1. Sinh số vào sổ đến tự động
    const { autoSequence, subNumber, bookId } = await generateIncomingDocumentNumber();

    const initialStatus = submitDirectlyToLeader ? 'PENDING_DIRECTIVE' : 'DRAFT';

    // 2. Tạo bản ghi Document kèm attachments và processingLogs
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
        leaderId: submitDirectlyToLeader ? (leaderId || undefined) : undefined,
        clerkId: creatorId,
        creatorId,
        documentTypeId: documentTypeId || undefined,
        bookId,
        attachments: {
          create: attachments.map((att: any) => ({
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType || 'pdf',
            fileSize: att.fileSize || 0,
            uploadedById: creatorId,
          })),
        },
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
        leader: true,
        attachments: true,
      },
    });

    // 3. Gửi thông báo đến Lãnh đạo nếu trình duyệt ngay
    if (submitDirectlyToLeader) {
      if (leaderId) {
        await prisma.notification.create({
          data: {
            userId: leaderId,
            title: 'Văn bản đến mới cần cho ý kiến',
            content: `Văn thư đã tiếp nhận văn bản: "${title}". Số đến: ${subNumber}`,
            link: `/van-ban-den/${newDoc.id}`,
            type: 'DIRECTIVE',
          },
        });
      } else {
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
              link: `/van-ban-den/${newDoc.id}`,
              type: 'DIRECTIVE',
            },
          });
        }
      }
    }

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: any) {
    console.error('Error creating incoming document:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
