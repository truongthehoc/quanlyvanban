import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { attachments = [], uploaderId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Không tìm thấy văn bản' }, { status: 404 });
    }

    if (doc.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Văn bản đã ở trạng thái "Đã xử lý", không thể đính kèm thêm tệp.' },
        { status: 400 }
      );
    }

    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ error: 'Không có tệp đính kèm nào' }, { status: 400 });
    }

    const created = await prisma.documentAttachment.createMany({
      data: attachments.map((att: any) => ({
        documentId: id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType || 'pdf',
        fileSize: att.fileSize || 0,
        uploadedById: uploaderId || undefined,
      })),
    });

    if (uploaderId) {
      await prisma.documentProcessingLog.create({
        data: {
          documentId: id,
          actorId: uploaderId,
          action: 'BỔ SUNG TỆP ĐÍNH KÈM',
          notes: `Đã tải lên bổ sung ${attachments.length} tệp đính kèm mới.`,
        },
      });
    }

    const allAttachments = await prisma.documentAttachment.findMany({
      where: { documentId: id },
    });

    return NextResponse.json({ success: true, count: created.count, attachments: allAttachments });
  } catch (error: any) {
    console.error('Error adding attachments:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
