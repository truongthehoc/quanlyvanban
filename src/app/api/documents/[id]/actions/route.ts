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
      include: {
        documentType: true,
        department: true,
        assignees: { include: { department: true, user: true } },
        clerk: true,
        leader: true,
      },
    });

    if (!currentDoc) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 });
    }

    // KHÓA BẤT BIẾN: Khi trạng thái đã là COMPLETED (Đã xử lý), không được phép chỉnh sửa hoặc cập nhật
    if (currentDoc.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Văn bản đã ở trạng thái "Đã xử lý" (Đã đóng hồ sơ), không thể chỉnh sửa hoặc cập nhật thêm.' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // ACTION 1: Lãnh đạo cho ý kiến chỉ đạo (DIRECTIVE)
    // Trạng thái: Chờ chỉ đạo (PENDING_DIRECTIVE) -> Chờ xử lý (DIRECTED)
    // Chuyển thẳng đến nơi được chỉ đạo
    // -------------------------------------------------------------
    if (actionType === 'DIRECTIVE') {
      const { leaderDirective, primaryDeptId, primaryUserId, coordinateDeptIds = [], dueDate } = data;

      const updated = await prisma.$transaction(async (tx) => {
        // Cập nhật Document sang trạng thái DIRECTED (Chờ xử lý)
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

        // Tạo phân công Đơn vị / Chuyên viên Chủ trì
        if (primaryDeptId || primaryUserId) {
          await tx.documentAssignee.create({
            data: {
              documentId,
              departmentId: primaryDeptId || undefined,
              userId: primaryUserId || undefined,
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
            notes: `Chỉ đạo: "${leaderDirective}". Hạn xử lý: ${dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : 'Không ghi'}. Đã chuyển thẳng đến phòng ban/bộ phận xử lý.`,
            fromStatus: currentDoc.status,
            toStatus: 'DIRECTED',
          },
        });

        return doc;
      });

      // 1. Thông báo cho Phòng ban/Bộ phận / Chuyên viên được phân công (Chủ trì & Phối hợp)
      if (primaryDeptId) {
        const deptUsers = await prisma.user.findMany({
          where: { departmentId: primaryDeptId, isActive: true },
        });
        for (const u of deptUsers) {
          await prisma.notification.create({
            data: {
              userId: u.id,
              title: 'Lãnh đạo giao CHỦ TRÌ xử lý văn bản',
              content: `Văn bản: "${currentDoc.title}". Ý kiến Lãnh đạo: "${leaderDirective}"`,
              link: `/van-ban-den/${currentDoc.id}`,
              type: 'ASSIGNMENT',
            },
          });
        }
      }

      if (primaryUserId) {
        await prisma.notification.create({
          data: {
            userId: primaryUserId,
            title: 'Lãnh đạo giao CHỦ TRÌ xử lý văn bản',
            content: `Văn bản: "${currentDoc.title}". Ý kiến Lãnh đạo: "${leaderDirective}"`,
            link: `/van-ban-den/${currentDoc.id}`,
            type: 'ASSIGNMENT',
          },
        });
      }

      for (const coordId of coordinateDeptIds) {
        if (coordId !== primaryDeptId) {
          const coordUsers = await prisma.user.findMany({
            where: { departmentId: coordId, isActive: true },
          });
          for (const u of coordUsers) {
            await prisma.notification.create({
              data: {
                userId: u.id,
                title: 'Lãnh đạo giao PHỐI HỢP xử lý văn bản',
                content: `Văn bản: "${currentDoc.title}". Ý kiến Lãnh đạo: "${leaderDirective}"`,
                link: `/van-ban-den/${currentDoc.id}`,
                type: 'ASSIGNMENT',
              },
            });
          }
        }
      }

      // 2. Thông báo cho Văn thư (Văn thư vẫn nhận được thông báo và có thể điều chỉnh nơi thực hiện)
      const primaryDeptName = primaryDeptId
        ? (await prisma.department.findUnique({ where: { id: primaryDeptId } }))?.name
        : '';
      const clerks = await prisma.user.findMany({
        where: { roles: { some: { role: { code: 'CLERK' } } }, isActive: true },
      });
      for (const clerk of clerks) {
        await prisma.notification.create({
          data: {
            userId: clerk.id,
            title: 'Lãnh đạo đã chỉ đạo chuyển phòng ban/bộ phận xử lý',
            content: `Lãnh đạo đã chỉ đạo văn bản "${currentDoc.title}". Phòng ban/bộ phận xử lý: ${primaryDeptName || 'Theo chỉ đạo'}. Văn thư có thể xem xét cập nhật lại nếu cần.`,
            link: `/van-ban-den/${currentDoc.id}`,
            type: 'DIRECTIVE',
          },
        });
      }

      return NextResponse.json(updated);
    }

    // -------------------------------------------------------------
    // ACTION 2: Văn thư cập nhật / điều chỉnh phòng ban/bộ phận xử lý (UPDATE_ASSIGNMENT / REASSIGN / FORWARD)
    // Chỉ được phép cập nhật sau khi Lãnh đạo đã cho ý kiến chỉ đạo
    // -------------------------------------------------------------
    if (actionType === 'FORWARD' || actionType === 'UPDATE_ASSIGNMENT') {
      if (currentDoc.status === 'PENDING_DIRECTIVE' || currentDoc.status === 'DRAFT') {
        return NextResponse.json(
          { error: 'Văn bản đang ở trạng thái "Chờ chỉ đạo". Cần có ý kiến chỉ đạo của Lãnh đạo trước khi Văn thư cập nhật lại phòng ban/bộ phận thực hiện.' },
          { status: 400 }
        );
      }

      const { primaryDeptId, primaryUserId, coordinateDeptIds = [], notes = '' } = data;

      const updated = await prisma.$transaction(async (tx) => {
        // Cập nhật lại các phân công
        if (primaryDeptId || primaryUserId || coordinateDeptIds.length > 0) {
          await tx.documentAssignee.deleteMany({ where: { documentId } });

          if (primaryDeptId || primaryUserId) {
            await tx.documentAssignee.create({
              data: {
                documentId,
                departmentId: primaryDeptId || undefined,
                userId: primaryUserId || undefined,
                roleType: 'PRIMARY',
                status: 'PENDING',
              },
            });
          }

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
        }

        const doc = await tx.document.update({
          where: { id: documentId },
          data: {
            clerkId: actorId,
          },
        });

        // Ghi log
        await tx.documentProcessingLog.create({
          data: {
            documentId,
            actorId,
            action: 'CẬP NHẬT NƠI XỬ LÝ',
            notes: notes || 'Văn thư đã cập nhật / điều chỉnh lại phòng ban/bộ phận và cá nhân thực hiện xử lý.',
            fromStatus: currentDoc.status,
            toStatus: currentDoc.status,
          },
        });

        return doc;
      });

      // 1. Thông báo cho Lãnh đạo biết Văn thư đã cập nhật nơi xử lý
      if (currentDoc.leaderId) {
        await prisma.notification.create({
          data: {
            userId: currentDoc.leaderId,
            title: 'Văn thư đã cập nhật phòng ban/bộ phận xử lý',
            content: `Văn thư đã điều chỉnh lại phòng ban/bộ phận / người thực hiện cho văn bản "${currentDoc.title}".`,
            link: `/van-ban-den/${currentDoc.id}`,
            type: 'DIRECTIVE',
          },
        });
      }

      // 2. Thông báo cho phòng ban/bộ phận / cá nhân mới được giao
      if (primaryDeptId) {
        const deptUsers = await prisma.user.findMany({
          where: { departmentId: primaryDeptId, isActive: true },
        });
        for (const u of deptUsers) {
          await prisma.notification.create({
            data: {
              userId: u.id,
              title: 'Được phân công CHỦ TRÌ xử lý văn bản',
              content: `Văn thư đã phân công phòng ban/bộ phận bạn chủ trì văn bản: "${currentDoc.title}".`,
              link: `/van-ban-den/${currentDoc.id}`,
              type: 'ASSIGNMENT',
            },
          });
        }
      }

      return NextResponse.json(updated);
    }

    // -------------------------------------------------------------
    // ACTION 3: Phòng ban/bộ phận xử lý tiếp nhận văn bản (ACCEPT_ASSIGNMENT)
    // Trạng thái: Chờ xử lý (DIRECTED) -> Đang xử lý (PROCESSING)
    // -------------------------------------------------------------
    if (actionType === 'ACCEPT_ASSIGNMENT') {
      const { notes } = data || {};

      const updated = await prisma.$transaction(async (tx) => {
        // Cập nhật Document sang trạng thái PROCESSING (Đang xử lý)
        const doc = await tx.document.update({
          where: { id: documentId },
          data: {
            status: 'PROCESSING',
          },
        });

        // Cập nhật trạng thái Assignee của actor hoặc của department của actor
        await tx.documentAssignee.updateMany({
          where: {
            documentId,
            OR: [
              { userId: actorId },
              { departmentId: data?.departmentId },
            ],
          },
          data: {
            status: 'IN_PROGRESS',
            userId: actorId, // Gán trực tiếp người tiếp nhận nếu chưa có
          },
        });

        // Ghi log
        await tx.documentProcessingLog.create({
          data: {
            documentId,
            actorId,
            action: 'TIẾP NHẬN XỬ LÝ',
            notes: notes || 'Phòng ban/bộ phận/Chuyên viên đã tiếp nhận văn bản và bắt đầu xử lý.',
            fromStatus: currentDoc.status,
            toStatus: 'PROCESSING',
          },
        });

        return doc;
      });

      // Thông báo cho Văn thư biết phòng ban/bộ phận xử lý đã tiếp nhận văn bản
      const actorUser = await prisma.user.findUnique({ where: { id: actorId } });
      const clerks = await prisma.user.findMany({
        where: { roles: { some: { role: { code: 'CLERK' } } }, isActive: true },
      });
      for (const clerk of clerks) {
        await prisma.notification.create({
          data: {
            userId: clerk.id,
            title: 'Phòng ban/bộ phận đã tiếp nhận văn bản',
            content: `${actorUser?.fullName || 'Cán bộ xử lý'} đã tiếp nhận xử lý văn bản "${currentDoc.title}".`,
            link: `/van-ban-den/${currentDoc.id}`,
            type: 'PROCESSING',
          },
        });
      }

      return NextResponse.json(updated);
    }

    // -------------------------------------------------------------
    // ACTION 4: Cập nhật tiến độ / Hoàn thành xử lý (UPDATE_PROGRESS / COMPLETE_ASSIGNMENT)
    // Trạng thái: Đang xử lý (PROCESSING) -> Đã xử lý (COMPLETED)
    // -------------------------------------------------------------
    if (actionType === 'UPDATE_PROGRESS' || actionType === 'COMPLETE_ASSIGNMENT') {
      const { newStatus, notes, progressStatus } = data;
      const isFinishing = newStatus === 'COMPLETED' || progressStatus === 'COMPLETED' || actionType === 'COMPLETE_ASSIGNMENT';
      const targetDocStatus = isFinishing ? 'COMPLETED' : 'PROCESSING';

      const updated = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id: documentId },
          data: {
            status: targetDocStatus,
          },
        });

        // Cập nhật assignees
        await tx.documentAssignee.updateMany({
          where: {
            documentId,
            OR: [
              { userId: actorId },
              { departmentId: data?.departmentId },
            ],
          },
          data: {
            status: isFinishing ? 'COMPLETED' : 'IN_PROGRESS',
            notes: notes || undefined,
            completedAt: isFinishing ? new Date() : undefined,
          },
        });

        // Ghi log
        await tx.documentProcessingLog.create({
          data: {
            documentId,
            actorId,
            action: isFinishing ? 'HOÀN THÀNH XỬ LÝ' : 'CẬP NHẬT TIẾN ĐỘ',
            notes: notes || (isFinishing ? 'Đã hoàn thành toàn bộ nội dung xử lý văn bản.' : 'Cập nhật tiến độ xử lý văn bản.'),
            fromStatus: currentDoc.status,
            toStatus: targetDocStatus,
          },
        });

        return doc;
      });

      const actorUser = await prisma.user.findUnique({ where: { id: actorId } });

      // Nếu hoàn thành xử lý -> Gửi thông báo cho Văn thư và Lãnh đạo
      if (isFinishing) {
        // 1. Thông báo cho Văn thư
        const clerks = await prisma.user.findMany({
          where: { roles: { some: { role: { code: 'CLERK' } } }, isActive: true },
        });
        for (const clerk of clerks) {
          await prisma.notification.create({
            data: {
              userId: clerk.id,
              title: 'Văn bản đã xử lý xong',
              content: `${actorUser?.fullName || 'Cán bộ xử lý'} đã xử lý xong văn bản "${currentDoc.title}". Hồ sơ đã hoàn tất.`,
              link: `/van-ban-den/${currentDoc.id}`,
              type: 'COMPLETED',
            },
          });
        }

        // 2. Thông báo cho Lãnh đạo
        if (currentDoc.leaderId) {
          await prisma.notification.create({
            data: {
              userId: currentDoc.leaderId,
              title: 'Văn bản chỉ đạo đã được xử lý xong',
              content: `Văn bản "${currentDoc.title}" đã được hoàn thành xử lý bởi ${actorUser?.fullName || 'Đơn vị phụ trách'}.`,
              link: `/van-ban-den/${currentDoc.id}`,
              type: 'COMPLETED',
            },
          });
        }
      }

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
