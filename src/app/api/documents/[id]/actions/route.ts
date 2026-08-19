import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDocumentNumber } from '@/lib/numbering-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const body = await req.json();
    const { actionType, actorId, data } = body;

    if (!documentId || !actionType || !actorId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const currentDoc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { documentType: true, department: true, assignees: true },
    });

    if (!currentDoc) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 });
    }

    // -------------------------------------------------------------
    // ACTION 1: Lãnh đạo cho ý kiến chỉ đạo (DIRECTIVE)
    // -------------------------------------------------------------
    if (actionType === 'DIRECTIVE') {
      const { leaderDirective, primaryDeptId, coordinateDeptIds = [], dueDate } = data;

      const updated = await prisma.$transaction(async (tx) => {
        // Cập nhật Document
        const doc = await tx.document.update({
          where: { id: documentId },
          data: {
            leaderDirective,
            leaderId: actorId,
            status: 'DIRECTED',
            dueDate: dueDate ? new Date(dueDate) : currentDoc.dueDate,
          },
        });

        // Xóa phân công cũ nếu có
        await tx.documentAssignee.deleteMany({ where: { documentId } });

        // Tạo phân công Đơn vị Chủ trì
        if (primaryDeptId) {
          await tx.documentAssignee.create({
            data: {
              documentId,
              departmentId: primaryDeptId,
              roleType: 'PRIMARY',
              status: 'PENDING',
            },
          });
        }

        // Tạo phân công Đơn vị Phối hợp
        for (const coordId of coordinateDeptIds) {
          if (coordId !== primaryDeptId) {
            await tx.documentAssignee.create({
              data: {
                documentId,
                departmentId: coordId,
                roleType: 'COORDINATE',
                status: 'PENDING',
              },
            });
          }
        }

        // Ghi log
        await tx.documentProcessingLog.create({
          data: {
            documentId,
            actorId,
            action: 'CHO Ý KIẾN CHỈ ĐẠO',
            notes: `Chỉ đạo: ${leaderDirective}. Hạn xử lý: ${dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : 'Không ghi'}`,
            fromStatus: currentDoc.status,
            toStatus: 'DIRECTED',
          },
        });

        return doc;
      });

      // Thông báo lại cho Văn thư để văn thư vào sổ chuyển tiếp
      const clerks = await prisma.user.findMany({
        where: { roles: { some: { role: { code: 'CLERK' } } }, isActive: true },
      });
      for (const clerk of clerks) {
        await prisma.notification.create({
          data: {
            userId: clerk.id,
            title: 'Lãnh đạo đã cho ý kiến chỉ đạo',
            content: `Văn bản "${currentDoc.title}" đã có chỉ đạo. Vui lòng vào sổ và chuyển tiếp.`,
            link: `/van-ban-den`,
            type: 'DIRECTIVE',
          },
        });
      }

      return NextResponse.json(updated);
    }

    // -------------------------------------------------------------
    // ACTION 2: Văn thư chuyển tiếp đến phòng ban (FORWARD)
    // -------------------------------------------------------------
    if (actionType === 'FORWARD') {
      const updated = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id: documentId },
          data: {
            clerkId: actorId,
            status: 'PROCESSING',
          },
        });

        // Cập nhật trạng thái assignees sang ACCEPTED hoặc IN_PROGRESS
        await tx.documentAssignee.updateMany({
          where: { documentId },
          data: { status: 'ACCEPTED' },
        });

        // Ghi log
        await tx.documentProcessingLog.create({
          data: {
            documentId,
            actorId,
            action: 'CHUYỂN TIẾP XỬ LÝ',
            notes: 'Văn thư đã chuyển tiếp văn bản đến các đơn vị được chỉ đạo.',
            fromStatus: currentDoc.status,
            toStatus: 'PROCESSING',
          },
        });

        return doc;
      });

      // Gửi thông báo đến Trưởng các phòng ban được phân công
      const assignees = await prisma.documentAssignee.findMany({
        where: { documentId },
        include: { department: true },
      });

      for (const ass of assignees) {
        if (ass.departmentId) {
          const deptUsers = await prisma.user.findMany({
            where: { departmentId: ass.departmentId, isActive: true },
          });

          for (const u of deptUsers) {
            await prisma.notification.create({
              data: {
                userId: u.id,
                title: ass.roleType === 'PRIMARY' ? 'Được giao CHỦ TRÌ xử lý văn bản' : 'Được giao PHỐI HỢP xử lý văn bản',
                content: `Văn bản: "${currentDoc.title}". Ý kiến Lãnh đạo: "${currentDoc.leaderDirective || ''}"`,
                link: `/van-ban-den`,
                type: 'ASSIGNMENT',
              },
            });
          }
        }
      }

      return NextResponse.json(updated);
    }

    // -------------------------------------------------------------
    // ACTION 3: Trưởng phòng / Chuyên viên cập nhật tiến độ (UPDATE_PROGRESS)
    // -------------------------------------------------------------
    if (actionType === 'UPDATE_PROGRESS') {
      const { newStatus, notes, progressStatus } = data;

      const updated = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id: documentId },
          data: {
            status: newStatus || currentDoc.status,
          },
        });

        // Cập nhật assignee
        if (data.assigneeId) {
          await tx.documentAssignee.update({
            where: { id: data.assigneeId },
            data: {
              status: progressStatus || 'IN_PROGRESS',
              notes,
              completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
            },
          });
        }

        // Ghi log
        await tx.documentProcessingLog.create({
          data: {
            documentId,
            actorId,
            action: newStatus === 'COMPLETED' ? 'HOÀN THÀNH XỬ LÝ' : 'CẬP NHẬT TIẾN ĐỘ',
            notes: notes || 'Cập nhật tình trạng xử lý văn bản.',
            fromStatus: currentDoc.status,
            toStatus: newStatus || currentDoc.status,
          },
        });

        return doc;
      });

      return NextResponse.json(updated);
    }

    // -------------------------------------------------------------
    // ACTION 4: Lãnh đạo phê duyệt dự thảo văn bản đi (APPROVE_OUTGOING)
    // -------------------------------------------------------------
    if (actionType === 'APPROVE_OUTGOING') {
      const updated = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id: documentId },
          data: {
            leaderId: actorId,
            status: 'APPROVED',
          },
        });

        await tx.documentProcessingLog.create({
          data: {
            documentId,
            actorId,
            action: 'PHÊ DUYỆT DỰ THẢO',
            notes: 'Lãnh đạo đã xem xét và đồng ý ký duyệt ban hành văn bản.',
            fromStatus: currentDoc.status,
            toStatus: 'APPROVED',
          },
        });

        return doc;
      });

      // Thông báo cho Văn thư để cấp số & phát hành
      const clerks = await prisma.user.findMany({
        where: { roles: { some: { role: { code: 'CLERK' } } }, isActive: true },
      });
      for (const clerk of clerks) {
        await prisma.notification.create({
          data: {
            userId: clerk.id,
            title: 'Dự thảo văn bản đi đã được duyệt',
            content: `Văn bản "${currentDoc.title}" đã được Lãnh đạo duyệt. Vui lòng cấp số và phát hành.`,
            link: `/van-ban-di`,
            type: 'OUTGOING_ISSUED',
          },
        });
      }

      return NextResponse.json(updated);
    }

    // -------------------------------------------------------------
    // ACTION 5: Văn thư Cấp số tự động & Phát hành (ISSUE_AND_NUMBER)
    // -------------------------------------------------------------
    if (actionType === 'ISSUE_AND_NUMBER') {
      const { dispatchMethod = 'Bưu điện & Điện tử', recipientOrg } = data;

      if (!currentDoc.documentTypeId) {
        return NextResponse.json({ error: 'Văn bản chưa chọn Loại văn bản để sinh số' }, { status: 400 });
      }

      // Gọi service sinh số tự động
      const { documentNumber, autoSequence, bookId } = await generateDocumentNumber({
        documentTypeId: currentDoc.documentTypeId,
        departmentCode: currentDoc.department?.code || 'BGD',
      });

      const updated = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id: documentId },
          data: {
            documentNumber,
            autoSequence,
            bookId,
            clerkId: actorId,
            status: 'ISSUED',
            issueDate: new Date(),
            dispatchMethod,
            dispatchStatus: 'Đã gửi đi',
            dispatchDate: new Date(),
            recipientOrg: recipientOrg || currentDoc.recipientOrg,
          },
        });

        await tx.documentProcessingLog.create({
          data: {
            documentId,
            actorId,
            action: 'CẤP SỐ & PHÁT HÀNH',
            notes: `Hệ thống tự động cấp số: ${documentNumber}. Văn thư tạo đơn gửi qua: ${dispatchMethod}.`,
            fromStatus: currentDoc.status,
            toStatus: 'ISSUED',
          },
        });

        return doc;
      });

      // Thông báo cho người tạo dự thảo biết số văn bản đã phát hành
      await prisma.notification.create({
        data: {
          userId: currentDoc.creatorId,
          title: 'Văn bản đi của bạn đã được phát hành!',
          content: `Văn bản "${currentDoc.title}" đã được cấp số chính thức ${documentNumber} và phát hành.`,
          link: `/van-ban-di`,
          type: 'OUTGOING_ISSUED',
        },
      });

      return NextResponse.json(updated);
    }

    // -------------------------------------------------------------
    // ACTION 6: Xác nhận đã đọc văn bản nội bộ (CONFIRM_READ)
    // -------------------------------------------------------------
    if (actionType === 'CONFIRM_READ') {
      await prisma.documentInternalAudience.updateMany({
        where: {
          documentId,
          OR: [
            { userId: actorId },
            { scopeType: 'ALL' },
          ],
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action type not recognized' }, { status: 400 });
  } catch (error: any) {
    console.error('Error executing document action:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
