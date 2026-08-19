import { prisma } from './prisma';

interface GenerateNumberOptions {
  documentTypeId: string;
  departmentCode?: string;
  year?: number;
  customPrefix?: string;
}

/**
 * Service cấp số văn bản tự động bảo đảm tính duy nhất và an toàn giao dịch
 */
export async function generateDocumentNumber(options: GenerateNumberOptions): Promise<{
  documentNumber: string;
  autoSequence: number;
  bookId: string;
}> {
  const targetYear = options.year || new Date().getFullYear();

  return await prisma.$transaction(async (tx) => {
    // 1. Lấy thông tin loại văn bản
    const docType = await tx.documentType.findUnique({
      where: { id: options.documentTypeId },
      include: { defaultBook: true },
    });

    if (!docType) {
      throw new Error('Loại văn bản không tồn tại trong hệ thống');
    }

    // 2. Tìm hoặc tạo Sổ văn bản tương ứng của năm
    let book = docType.defaultBook;
    if (!book || book.year !== targetYear) {
      book = await tx.documentBook.findFirst({
        where: {
          type: 'OUTGOING',
          year: targetYear,
          isActive: true,
        },
      });

      if (!book) {
        book = await tx.documentBook.create({
          data: {
            code: `SO-DI-${targetYear}`,
            name: `Sổ Văn bản Đi năm ${targetYear}`,
            type: 'OUTGOING',
            year: targetYear,
            currentNumber: 0,
            isActive: true,
          },
        });
      }
    }

    // 3. Tăng số thứ tự trong sổ
    const updatedBook = await tx.documentBook.update({
      where: { id: book.id },
      data: {
        currentNumber: {
          increment: 1,
        },
      },
    });

    const sequence = updatedBook.currentNumber;

    // 4. Áp dụng mẫu sinh số (Numbering Pattern)
    // Mặc định: "{STT}/{MA_LOAI}-{MA_DV}"
    const pattern = docType.numberingPattern || '{STT}/{MA_LOAI}-{MA_DV}';
    const deptCode = options.departmentCode || 'BGD';

    let formattedNumber = pattern
      .replace(/{STT}/g, sequence.toString())
      .replace(/{STT:2}/g, sequence.toString().padStart(2, '0'))
      .replace(/{STT:3}/g, sequence.toString().padStart(3, '0'))
      .replace(/{MA_LOAI}/g, docType.code)
      .replace(/{MA_DV}/g, deptCode)
      .replace(/{NAM}/g, targetYear.toString())
      .replace(/{NAM_2}/g, targetYear.toString().slice(-2));

    return {
      documentNumber: formattedNumber,
      autoSequence: sequence,
      bookId: updatedBook.id,
    };
  });
}

/**
 * Cấp số văn bản đến tự động theo Sổ văn bản đến
 */
export async function generateIncomingDocumentNumber(year?: number): Promise<{
  autoSequence: number;
  subNumber: string;
  bookId: string;
}> {
  const targetYear = year || new Date().getFullYear();

  return await prisma.$transaction(async (tx) => {
    let book = await tx.documentBook.findFirst({
      where: {
        type: 'INCOMING',
        year: targetYear,
        isActive: true,
      },
    });

    if (!book) {
      book = await tx.documentBook.create({
        data: {
          code: `SO-DEN-${targetYear}`,
          name: `Sổ Văn bản Đến năm ${targetYear}`,
          type: 'INCOMING',
          year: targetYear,
          currentNumber: 0,
          isActive: true,
        },
      });
    }

    const updatedBook = await tx.documentBook.update({
      where: { id: book.id },
      data: {
        currentNumber: {
          increment: 1,
        },
      },
    });

    const sequence = updatedBook.currentNumber;
    const subNumber = `${sequence}/${targetYear}`;

    return {
      autoSequence: sequence,
      subNumber,
      bookId: updatedBook.id,
    };
  });
}
