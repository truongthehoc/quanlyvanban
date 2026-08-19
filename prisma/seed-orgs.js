const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedOrganizations() {
  console.log('--- Seeding Organizations ---');

  const orgs = [
    {
      code: 'UBND-BD',
      name: 'Ủy ban Nhân dân tỉnh Bình Dương',
      shortName: 'UBND tỉnh Bình Dương',
      type: 'GOVERNMENT',
      email: 'ubnd@binhduong.gov.vn',
      phone: '0274.3822234',
      address: 'Trung tâm Hành chính tỉnh Bình Dương, TP. Thủ Dầu Một',
    },
    {
      code: 'SYT-BD',
      name: 'Sở Y tế tỉnh Bình Dương',
      shortName: 'Sở Y tế',
      type: 'DEPARTMENT',
      email: 'syt@binhduong.gov.vn',
      phone: '0274.3822096',
      address: 'Tầng 15, Tháp A, Tòa nhà Trung tâm Hành chính tỉnh Bình Dương',
    },
    {
      code: 'BHXH-BD',
      name: 'Bảo hiểm Xã hội tỉnh Bình Dương',
      shortName: 'Bảo hiểm xã hội tỉnh',
      type: 'GOVERNMENT',
      email: 'bhxh@binhduong.gov.vn',
      phone: '0274.3825390',
      address: 'Số 17, Đường số 1, KDC Hiệp Thành 2, TP. Thủ Dầu Một',
    },
    {
      code: 'BGDDT',
      name: 'Bộ Giáo dục và Đào tạo',
      shortName: 'Bộ GD&ĐT',
      type: 'GOVERNMENT',
      email: 'bogddt@moet.gov.vn',
      phone: '024.38695144',
      address: 'Số 35 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
    },
    {
      code: 'UBND-TP',
      name: 'Ủy ban Nhân dân Thành phố Hồ Chí Minh',
      shortName: 'UBND TP.HCM',
      type: 'GOVERNMENT',
      email: 'ubnd@tphcm.gov.vn',
      phone: '028.38296052',
      address: '86 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    },
    {
      code: 'STC-BD',
      name: 'Sở Tài chính tỉnh Bình Dương',
      shortName: 'Sở Tài chính',
      type: 'DEPARTMENT',
      email: 'stc@binhduong.gov.vn',
      phone: '0274.3822212',
      address: 'Tầng 11, Tháp A, Trung tâm Hành chính tỉnh Bình Dương',
    },
    {
      code: 'SKHCN-BD',
      name: 'Sở Khoa học và Công nghệ tỉnh Bình Dương',
      shortName: 'Sở KH&CN',
      type: 'DEPARTMENT',
      email: 'skhcn@binhduong.gov.vn',
      phone: '0274.3822834',
      address: 'Tầng 8, Tháp B, Trung tâm Hành chính tỉnh Bình Dương',
    },
    {
      code: 'VNPOST',
      name: 'Tổng công ty Bưu điện Việt Nam (VNPost)',
      shortName: 'Bưu điện VN',
      type: 'ENTERPRISE',
      email: 'vanthu@vnpost.vn',
      phone: '1900 54 54 81',
      address: 'Số 5 Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
    },
  ];

  for (const org of orgs) {
    const saved = await prisma.organization.upsert({
      where: { code: org.code },
      update: org,
      create: org,
    });

    // Map to existing documents that match the name or shortName
    await prisma.document.updateMany({
      where: {
        OR: [
          { senderOrg: { contains: org.shortName } },
          { senderOrg: { contains: org.name } },
        ],
        senderOrgId: null,
      },
      data: {
        senderOrgId: saved.id,
      },
    });

    await prisma.document.updateMany({
      where: {
        OR: [
          { recipientOrg: { contains: org.shortName } },
          { recipientOrg: { contains: org.name } },
        ],
        recipientOrgId: null,
      },
      data: {
        recipientOrgId: saved.id,
      },
    });
  }

  console.log('✓ Organizations seeded and mapped to documents!');
}

seedOrganizations()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
