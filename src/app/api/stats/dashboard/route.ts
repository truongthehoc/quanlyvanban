import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const departmentId = searchParams.get('departmentId');

    // 1. Total counts by documentTypeDoc
    const [incomingTotal, outgoingTotal, internalTotal] = await Promise.all([
      prisma.document.count({ where: { documentTypeDoc: 'INCOMING' } }),
      prisma.document.count({ where: { documentTypeDoc: 'OUTGOING' } }),
      prisma.document.count({ where: { documentTypeDoc: 'INTERNAL' } }),
    ]);

    // 2. Incoming breakdown
    const [
      incomingPendingLeader,
      incomingProcessing,
      incomingCompleted,
    ] = await Promise.all([
      prisma.document.count({ where: { documentTypeDoc: 'INCOMING', status: 'PENDING_DIRECTIVE' } }),
      prisma.document.count({ where: { documentTypeDoc: 'INCOMING', status: 'PROCESSING' } }),
      prisma.document.count({ where: { documentTypeDoc: 'INCOMING', status: 'COMPLETED' } }),
    ]);

    // 3. Outgoing breakdown
    const [
      outgoingDraft,
      outgoingApproved,
      outgoingIssued,
    ] = await Promise.all([
      prisma.document.count({ where: { documentTypeDoc: 'OUTGOING', status: 'DRAFT' } }),
      prisma.document.count({ where: { documentTypeDoc: 'OUTGOING', status: 'APPROVED' } }),
      prisma.document.count({ where: { documentTypeDoc: 'OUTGOING', status: 'ISSUED' } }),
    ]);

    // 4. Overdue count (dueDate < now and not completed)
    const now = new Date();
    const overdueCount = await prisma.document.count({
      where: {
        documentTypeDoc: 'INCOMING',
        dueDate: { lt: now },
        status: { notIn: ['COMPLETED', 'ARCHIVED'] },
      },
    });

    // 5. Actionable items for the current user/role
    let myActionItems: any[] = [];
    if (role === 'LEADER') {
      // Leader needs to direct incoming documents
      myActionItems = await prisma.document.findMany({
        where: { documentTypeDoc: 'INCOMING', status: 'PENDING_DIRECTIVE' },
        include: { documentType: true, department: true },
        take: 5,
        orderBy: { arrivalDate: 'desc' },
      });
    } else if (role === 'CLERK') {
      // Clerk needs to forward directed docs or issue approved outgoing docs
      myActionItems = await prisma.document.findMany({
        where: {
          OR: [
            { documentTypeDoc: 'INCOMING', status: 'DIRECTED' },
            { documentTypeDoc: 'OUTGOING', status: 'APPROVED' },
          ],
        },
        include: { documentType: true, department: true },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });
    } else if (role === 'HEAD_DEPT' || role === 'OFFICER') {
      // Assigned tasks
      if (departmentId || userId) {
        myActionItems = await prisma.document.findMany({
          where: {
            documentTypeDoc: 'INCOMING',
            status: 'PROCESSING',
            assignees: {
              some: {
                OR: [
                  departmentId ? { departmentId } : {},
                  userId ? { userId } : {},
                ],
                status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
              },
            },
          },
          include: { documentType: true, department: true, assignees: true },
          take: 5,
          orderBy: { dueDate: 'asc' },
        });
      }
    }

    // 6. Recent activities
    const recentActivities = await prisma.documentProcessingLog.findMany({
      include: {
        actor: true,
        document: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    return NextResponse.json({
      totals: {
        incoming: incomingTotal,
        outgoing: outgoingTotal,
        internal: internalTotal,
        overdue: overdueCount,
      },
      incomingStats: {
        pendingLeader: incomingPendingLeader,
        processing: incomingProcessing,
        completed: incomingCompleted,
      },
      outgoingStats: {
        draft: outgoingDraft,
        approved: outgoingApproved,
        issued: outgoingIssued,
      },
      myActionItems,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
