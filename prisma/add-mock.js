const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMockDocs() {
  const clerk = await prisma.user.findFirst({ where: { username: 'vanthu' } });
  const userA = await prisma.user.findFirst({ where: { username: 'truongkhoa_cntt' } });
  const userB = await prisma.user.findFirst({ where: { username: 'chuyenvien_tc' } });
  const userC = await prisma.user.findFirst({ where: { username: 'truongphong_tc' } });
  const dept = await prisma.department.findFirst({ where: { code: 'VP' } });
  const docType = await prisma.documentType.findFirst({ where: { code: 'CV' } });
  const book = await prisma.documentBook.findFirst({ where: { type: 'INCOMING' } });

  const mockItems = [
    {
      documentNumber: '1234/UBND-VP',
      subNumber: '17/2026',
      documentTypeDoc: 'INCOMING',
      title: 'V/v triển khai công tác cải cách hành chính năm 2024',
      senderOrg: 'UBND tỉnh Bình Dương',
      arrivalDate: new Date('2024-05-18T09:15:00'),
      issueDate: new Date('2024-05-17'),
      urgencyLevel: 'URGENT',
      status: 'PENDING_DIRECTIVE',
      creatorId: clerk.id,
      departmentId: dept.id,
      documentTypeId: docType.id,
      bookId: book.id,
    },
    {
      documentNumber: '567/SYT-NVY',
      subNumber: '18/2026',
      documentTypeDoc: 'INCOMING',
      title: 'V/v tăng cường công tác phòng chống dịch bệnh',
      senderOrg: 'Sở Y tế',
      arrivalDate: new Date('2024-05-17T14:30:00'),
      issueDate: new Date('2024-05-16'),
      urgencyLevel: 'NORMAL',
      status: 'PROCESSING',
      creatorId: clerk.id,
      departmentId: dept.id,
      documentTypeId: docType.id,
      bookId: book.id,
      assignees: {
        create: [
          {
            userId: userA.id,
            roleType: 'PRIMARY',
            status: 'IN_PROGRESS',
          },
        ],
      },
    },
    {
      documentNumber: '89/BHXH-TST',
      subNumber: '19/2026',
      documentTypeDoc: 'INCOMING',
      title: 'V/v hướng dẫn thanh toán chi phí KCB BHYT',
      senderOrg: 'Bảo hiểm xã hội tỉnh',
      arrivalDate: new Date('2024-05-17T08:45:00'),
      issueDate: new Date('2024-05-16'),
      urgencyLevel: 'TOP_URGENT',
      status: 'COMPLETED',
      creatorId: clerk.id,
      departmentId: dept.id,
      documentTypeId: docType.id,
      bookId: book.id,
      assignees: {
        create: [
          {
            userId: userB.id,
            roleType: 'PRIMARY',
            status: 'COMPLETED',
          },
        ],
      },
    },
    {
      documentNumber: '4567/UBND-KT',
      subNumber: '20/2026',
      documentTypeDoc: 'INCOMING',
      title: 'V/v báo cáo tình hình kinh tế - xã hội quý I/2024',
      senderOrg: 'UBND tỉnh Bình Dương',
      arrivalDate: new Date('2024-05-16T16:20:00'),
      issueDate: new Date('2024-05-15'),
      urgencyLevel: 'NORMAL',
      status: 'PROCESSING',
      creatorId: clerk.id,
      departmentId: dept.id,
      documentTypeId: docType.id,
      bookId: book.id,
      assignees: {
        create: [
          {
            userId: userC.id,
            roleType: 'PRIMARY',
            status: 'IN_PROGRESS',
          },
        ],
      },
    },
    {
      documentNumber: '234/SYT-KHTC',
      subNumber: '21/2026',
      documentTypeDoc: 'INCOMING',
      title: 'V/v dự toán ngân sách năm 2025',
      senderOrg: 'Sở Y tế',
      arrivalDate: new Date('2024-05-16T10:05:00'),
      issueDate: new Date('2024-05-15'),
      dueDate: new Date('2024-06-01'),
      urgencyLevel: 'URGENT',
      status: 'OVERDUE',
      creatorId: clerk.id,
      departmentId: dept.id,
      documentTypeId: docType.id,
      bookId: book.id,
    },
  ];

  for (const item of mockItems) {
    const existing = await prisma.document.findFirst({ where: { documentNumber: item.documentNumber } });
    if (!existing) {
      await prisma.document.create({ data: item });
    }
  }
  console.log('✓ Mock items inserted matching the UI screenshot.');
}

addMockDocs()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
