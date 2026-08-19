import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Không có tệp nào được tải lên' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];

    for (const file of files) {
      if (typeof file === 'string') continue;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      // Tạo tên tệp an toàn kèm timestamp để tránh trùng lặp
      const extension = path.extname(file.name) || '';
      const baseName = path.basename(file.name, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFileName = `${Date.now()}_${baseName}${extension}`;
      const filePath = path.join(uploadDir, uniqueFileName);

      await writeFile(filePath, buffer);

      const fileType = extension.replace('.', '').toLowerCase() || 'unknown';

      uploadedFiles.push({
        fileName: file.name,
        fileUrl: `/uploads/${uniqueFileName}`,
        fileType,
        fileSize: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi tải tệp lên máy chủ' },
      { status: 500 }
    );
  }
}
