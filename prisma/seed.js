const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Seeding Data for QuanLyVanBan ---');

  // 1. Roles
  const roles = [
    { code: 'ADMIN', name: 'Quản trị hệ thống', description: 'Toàn quyền quản trị danh mục, người dùng và hệ thống', isSystem: true },
    { code: 'LEADER', name: 'Lãnh đạo cơ quan', description: 'Cho ý kiến chỉ đạo văn bản đến, ký duyệt phát hành văn bản đi', isSystem: true },
    { code: 'CLERK', name: 'Văn thư', description: 'Tiếp nhận văn bản đến, vào sổ, cấp số tự động văn bản đi, đóng dấu phát hành', isSystem: true },
    { code: 'HEAD_DEPT', name: 'Trưởng phòng / Đơn vị', description: 'Phân công nhiệm vụ trong phòng, duyệt dự thảo phòng ban', isSystem: true },
    { code: 'OFFICER', name: 'Chuyên viên / Nhân viên', description: 'Soạn thảo văn bản đi, xử lý văn bản đến được giao, tiếp nhận văn bản nội bộ', isSystem: true },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: r,
      create: r,
    });
  }
  console.log('✓ Roles seeded.');

  // 2. Permissions
  const permissions = [
    // Dashboard
    { code: 'dashboard:view_all', module: 'DASHBOARD', action: 'VIEW_ALL', name: 'Xem Dashboard toàn cơ quan', description: 'Xem tổng hợp số liệu toàn cơ quan' },
    { code: 'dashboard:view_dept', module: 'DASHBOARD', action: 'VIEW_DEPT', name: 'Xem Dashboard phòng ban', description: 'Xem thống kê trong phạm vi phòng' },
    { code: 'dashboard:view_own', module: 'DASHBOARD', action: 'VIEW_OWN', name: 'Xem Dashboard cá nhân', description: 'Xem việc cần xử lý của bản thân' },
    
    // Văn bản Đến
    { code: 'doc_in:create', module: 'DOC_IN', action: 'CREATE', name: 'Tiếp nhận & Nhập VB Đến', description: 'Vào sổ và đính kèm scan văn bản đến' },
    { code: 'doc_in:submit_leader', module: 'DOC_IN', action: 'SUBMIT_LEADER', name: 'Trình Lãnh đạo xin ý kiến', description: 'Chuyển VB đến lên lãnh đạo duyệt' },
    { code: 'doc_in:directive', module: 'DOC_IN', action: 'DIRECTIVE', name: 'Ghi ý kiến chỉ đạo Lãnh đạo', description: 'Chỉ đạo đơn vị chủ trì, phối hợp, thời hạn' },
    { code: 'doc_in:forward', module: 'DOC_IN', action: 'FORWARD', name: 'Chuyển tiếp đến Phòng ban', description: 'Phát hành chuyển giao văn bản đến phòng ban' },
    { code: 'doc_in:assign_dept', module: 'DOC_IN', action: 'ASSIGN_DEPT', name: 'Trưởng phòng giao chuyên viên', description: 'Phân công chuyên viên trong phòng xử lý' },
    { code: 'doc_in:process', module: 'DOC_IN', action: 'PROCESS', name: 'Xử lý & Cập nhật tiến độ', description: 'Tiếp nhận, xử lý và báo cáo kết quả' },
    { code: 'doc_in:view_all', module: 'DOC_IN', action: 'VIEW_ALL', name: 'Xem tất cả VB Đến', description: 'Xem toàn bộ văn bản đến của cơ quan' },
    { code: 'doc_in:view_dept', module: 'DOC_IN', action: 'VIEW_DEPT', name: 'Xem VB Đến của Phòng', description: 'Xem các văn bản được giao cho phòng' },
    
    // Văn bản Đi
    { code: 'doc_out:create', module: 'DOC_OUT', action: 'CREATE', name: 'Soạn thảo Dự thảo VB Đi', description: 'Tạo và cập nhật dự thảo văn bản đi' },
    { code: 'doc_out:approve_dept', module: 'DOC_OUT', action: 'APPROVE_DEPT', name: 'Trưởng phòng duyệt dự thảo', description: 'Ký nháy / Duyệt cấp phòng' },
    { code: 'doc_out:approve_leader', module: 'DOC_OUT', action: 'APPROVE_LEADER', name: 'Lãnh đạo phê duyệt ban hành', description: 'Ký duyệt phát hành chính thức' },
    { code: 'doc_out:numbering', module: 'DOC_OUT', action: 'NUMBERING', name: 'Cấp số tự động (Văn thư)', description: 'Tự động lấy số tiếp theo theo sổ và loại VB' },
    { code: 'doc_out:dispatch', module: 'DOC_OUT', action: 'DISPATCH', name: 'Tạo đơn gửi & Phát hành', description: 'Ghi nhận hình thức gửi và trạng thái gửi' },
    { code: 'doc_out:view_all', module: 'DOC_OUT', action: 'VIEW_ALL', name: 'Xem tất cả VB Đi', description: 'Xem danh sách toàn bộ văn bản đi' },
    
    // Văn bản Nội bộ
    { code: 'doc_internal:create', module: 'DOC_INTERNAL', action: 'CREATE', name: 'Đăng tải VB Nội bộ', description: 'Tạo thông báo, quy chế nội bộ' },
    { code: 'doc_internal:set_audience', module: 'DOC_INTERNAL', action: 'SET_AUDIENCE', name: 'Phân quyền phạm vi nhận', description: 'Chọn đối tượng xem văn bản' },
    { code: 'doc_internal:view', module: 'DOC_INTERNAL', action: 'VIEW', name: 'Xem VB Nội bộ được chia sẻ', description: 'Đọc văn bản thuộc phạm vi quyền' },
    { code: 'doc_internal:confirm_read', module: 'DOC_INTERNAL', action: 'CONFIRM_READ', name: 'Xác nhận đã đọc', description: 'Ghi nhận trạng thái tiếp nhận thông tin' },
    
    // Sổ văn bản
    { code: 'books:manage', module: 'BOOKS', action: 'MANAGE', name: 'Quản lý Sổ văn bản', description: 'Thêm, sửa, đóng/mở sổ văn bản' },
    { code: 'books:export', module: 'BOOKS', action: 'EXPORT', name: 'Xuất Sổ văn bản', description: 'Xuất file báo cáo sổ đến/đi' },
    
    // Hệ thống & Danh mục
    { code: 'system:users', module: 'SYSTEM', action: 'USERS', name: 'Quản trị Người dùng', description: 'Thêm, sửa, gán quyền tài khoản' },
    { code: 'system:departments', module: 'SYSTEM', action: 'DEPARTMENTS', name: 'Quản trị Cơ cấu tổ chức', description: 'Quản lý danh mục phòng ban' },
    { code: 'system:doc_types', module: 'SYSTEM', action: 'DOC_TYPES', name: 'Quản trị Loại VB & Mẫu số', description: 'Cấu hình quy tắc sinh số tự động' },
    { code: 'system:matrix', module: 'SYSTEM', action: 'MATRIX', name: 'Quản trị Ma trận Phân quyền', description: 'Bật/tắt quyền động cho từng role' },
    { code: 'system:audit_logs', module: 'SYSTEM', action: 'AUDIT_LOGS', name: 'Xem Nhật ký hệ thống', description: 'Tra cứu vết xử lý tài liệu' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }
  console.log('✓ Permissions seeded.');

  // 3. Map Default Role Permissions
  const roleAdmin = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const roleLeader = await prisma.role.findUnique({ where: { code: 'LEADER' } });
  const roleClerk = await prisma.role.findUnique({ where: { code: 'CLERK' } });
  const roleHeadDept = await prisma.role.findUnique({ where: { code: 'HEAD_DEPT' } });
  const roleOfficer = await prisma.role.findUnique({ where: { code: 'OFFICER' } });

  const allPerms = await prisma.permission.findMany();

  // Admin gets all permissions
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAdmin.id, permissionId: p.id } },
      update: {},
      create: { roleId: roleAdmin.id, permissionId: p.id },
    });
  }

  // Leader permissions
  const leaderCodes = [
    'dashboard:view_all', 'dashboard:view_dept', 'dashboard:view_own',
    'doc_in:directive', 'doc_in:view_all',
    'doc_out:approve_leader', 'doc_out:view_all',
    'doc_internal:create', 'doc_internal:set_audience', 'doc_internal:view', 'doc_internal:confirm_read',
    'books:export', 'system:audit_logs'
  ];
  for (const code of leaderCodes) {
    const perm = allPerms.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleLeader.id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleLeader.id, permissionId: perm.id },
      });
    }
  }

  // Clerk permissions
  const clerkCodes = [
    'dashboard:view_all', 'dashboard:view_dept', 'dashboard:view_own',
    'doc_in:create', 'doc_in:submit_leader', 'doc_in:forward', 'doc_in:view_all',
    'doc_out:numbering', 'doc_out:dispatch', 'doc_out:view_all',
    'doc_internal:create', 'doc_internal:set_audience', 'doc_internal:view', 'doc_internal:confirm_read',
    'books:manage', 'books:export', 'system:doc_types'
  ];
  for (const code of clerkCodes) {
    const perm = allPerms.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleClerk.id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleClerk.id, permissionId: perm.id },
      });
    }
  }

  // Head of Dept permissions
  const headCodes = [
    'dashboard:view_dept', 'dashboard:view_own',
    'doc_in:assign_dept', 'doc_in:process', 'doc_in:view_dept',
    'doc_out:create', 'doc_out:approve_dept',
    'doc_internal:create', 'doc_internal:set_audience', 'doc_internal:view', 'doc_internal:confirm_read'
  ];
  for (const code of headCodes) {
    const perm = allPerms.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleHeadDept.id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleHeadDept.id, permissionId: perm.id },
      });
    }
  }

  // Officer permissions
  const officerCodes = [
    'dashboard:view_own',
    'doc_in:process',
    'doc_out:create',
    'doc_internal:view', 'doc_internal:confirm_read'
  ];
  for (const code of officerCodes) {
    const perm = allPerms.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleOfficer.id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleOfficer.id, permissionId: perm.id },
      });
    }
  }
  console.log('✓ Role Permissions mapped.');

  // 4. Departments
  const depts = [
    { code: 'BGD', name: 'Ban Giám đốc', description: 'Cấp lãnh đạo cao nhất điều hành cơ quan' },
    { code: 'VP', name: 'Văn phòng & Hành chính', description: 'Bộ phận Văn thư, Lưu trữ, Tổng hợp' },
    { code: 'KHTC', name: 'Phòng Kế hoạch - Tài chính', description: 'Phòng tham mưu kế hoạch, tài chính, dự toán' },
    { code: 'DTKH', name: 'Phòng Quản lý Đào tạo & Khoa học', description: 'Phòng chuyên môn đào tạo và NCKH' },
    { code: 'CNTT', name: 'Trung tâm Công nghệ Thông tin', description: 'Quản trị hạ tầng mạng, chuyển đổi số & phần mềm' },
  ];

  const deptMap = {};
  for (const d of depts) {
    const created = await prisma.department.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
    deptMap[d.code] = created;
  }
  console.log('✓ Departments seeded.');

  // 5. Users
  const users = [
    {
      username: 'admin',
      fullName: 'Nguyễn Văn Quản Trị',
      position: 'Quản trị viên Hệ thống',
      email: 'admin@eoffice.vn',
      phone: '0901234567',
      departmentId: deptMap['VP'].id,
      roleCode: 'ADMIN',
    },
    {
      username: 'giamdoc',
      fullName: 'TS. Trần Văn Lãnh Đạo',
      position: 'Giám đốc Cơ quan',
      email: 'giamdoc@eoffice.vn',
      phone: '0912345678',
      departmentId: deptMap['BGD'].id,
      roleCode: 'LEADER',
    },
    {
      username: 'vanthu',
      fullName: 'Lê Thị Văn Thư',
      position: 'Cán bộ Văn thư - Tiếp nhận',
      email: 'vanthu@eoffice.vn',
      phone: '0923456789',
      departmentId: deptMap['VP'].id,
      roleCode: 'CLERK',
    },
    {
      username: 'truongphong_tc',
      fullName: 'Phạm Văn Kế Hoạch',
      position: 'Trưởng phòng Kế hoạch - Tài chính',
      email: 'truongphong.tc@eoffice.vn',
      phone: '0934567890',
      departmentId: deptMap['KHTC'].id,
      roleCode: 'HEAD_DEPT',
    },
    {
      username: 'chuyenvien_tc',
      fullName: 'Hoàng Thị Chuyên Viên',
      position: 'Chuyên viên Quản lý Ngân sách',
      email: 'chuyenvien.tc@eoffice.vn',
      phone: '0945678901',
      departmentId: deptMap['KHTC'].id,
      roleCode: 'OFFICER',
    },
    {
      username: 'truongkhoa_cntt',
      fullName: 'Đặng Công Nghệ',
      position: 'Giám đốc Trung tâm CNTT',
      email: 'cntt@eoffice.vn',
      phone: '0956789012',
      departmentId: deptMap['CNTT'].id,
      roleCode: 'HEAD_DEPT',
    },
  ];

  const userMap = {};
  for (const u of users) {
    const role = await prisma.role.findUnique({ where: { code: u.roleCode } });
    const createdUser = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        fullName: u.fullName,
        position: u.position,
        email: u.email,
        phone: u.phone,
        departmentId: u.departmentId,
      },
      create: {
        username: u.username,
        passwordHash: '123456',
        fullName: u.fullName,
        position: u.position,
        email: u.email,
        phone: u.phone,
        departmentId: u.departmentId,
      },
    });

    userMap[u.username] = createdUser;

    // Assign user role
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: createdUser.id, roleId: role.id } },
      update: {},
      create: { userId: createdUser.id, roleId: role.id },
    });
  }
  console.log('✓ Users seeded.');

  // 6. Document Books (2026)
  const currentYear = 2026;
  const books = [
    { code: `SO-DEN-${currentYear}`, name: `Sổ Văn bản Đến năm ${currentYear}`, type: 'INCOMING', year: currentYear, currentNumber: 15 },
    { code: `SO-DI-${currentYear}`, name: `Sổ Văn bản Đi năm ${currentYear}`, type: 'OUTGOING', year: currentYear, currentNumber: 24 },
    { code: `SO-NB-${currentYear}`, name: `Sổ Văn bản Nội bộ năm ${currentYear}`, type: 'INTERNAL', year: currentYear, currentNumber: 8 },
  ];

  const bookMap = {};
  for (const b of books) {
    const createdBook = await prisma.documentBook.upsert({
      where: { code: b.code },
      update: b,
      create: b,
    });
    bookMap[b.type] = createdBook;
  }
  console.log('✓ Document Books seeded.');

  // 7. Document Types
  const docTypes = [
    { code: 'CV', name: 'Công văn', numberingPattern: '{STT}/CV-{MA_DV}', defaultBookId: bookMap['OUTGOING'].id, description: 'Trao đổi công việc hành chính' },
    { code: 'QD', name: 'Quyết định', numberingPattern: '{STT}/QĐ-{MA_DV}', defaultBookId: bookMap['OUTGOING'].id, description: 'Quyết định quy phạm / cá biệt của lãnh đạo' },
    { code: 'TB', name: 'Thông báo', numberingPattern: '{STT}/TB-{MA_DV}', defaultBookId: bookMap['INTERNAL'].id, description: 'Truyền đạt thông tin, lịch trình, quy định' },
    { code: 'TTr', name: 'Tờ trình', numberingPattern: '{STT}/TTr-{MA_DV}', defaultBookId: bookMap['OUTGOING'].id, description: 'Tờ trình đề xuất phương án' },
    { code: 'KH', name: 'Kế hoạch', numberingPattern: '{STT}/KH-{MA_DV}', defaultBookId: bookMap['OUTGOING'].id, description: 'Kế hoạch công tác năm/tháng/quý' },
    { code: 'BC', name: 'Báo cáo', numberingPattern: '{STT}/BC-{MA_DV}', defaultBookId: bookMap['OUTGOING'].id, description: 'Báo cáo định kỳ hoặc đột xuất' },
  ];

  const docTypeMap = {};
  for (const dt of docTypes) {
    const createdDt = await prisma.documentType.upsert({
      where: { code: dt.code },
      update: dt,
      create: dt,
    });
    docTypeMap[dt.code] = createdDt;
  }
  console.log('✓ Document Types seeded.');

  // 8. Sample Documents (Workflow data)
  // 8.1. Văn bản Đến: Đã có chỉ đạo của Giám đốc, đang được TT CNTT & KHTC xử lý
  const docIn1 = await prisma.document.create({
    data: {
      documentNumber: '108/UBND-VX',
      autoSequence: 15,
      subNumber: '15/2026',
      documentTypeDoc: 'INCOMING',
      title: 'V/v Đẩy mạnh triển khai chuyển đổi số và nâng cao an toàn an ninh thông tin năm 2026',
      summary: 'Yêu cầu các đơn vị trực thuộc nâng cấp hệ thống điều hành điện tử, rà soát lỗ hổng bảo mật và báo cáo kết quả trước ngày 30/08/2026.',
      senderOrg: 'Ủy ban Nhân dân Thành phố',
      issueDate: new Date('2026-08-10'),
      arrivalDate: new Date('2026-08-12'),
      dueDate: new Date('2026-08-30'),
      urgencyLevel: 'URGENT',
      confidentialityLevel: 'NORMAL',
      status: 'PROCESSING',
      leaderDirective: 'Giao Trung tâm CNTT chủ trì xây dựng phương án kỹ thuật; Phòng KHTC phối hợp cân đối dự toán. Báo cáo tôi trước ngày 28/08/2026.',
      leaderId: userMap['giamdoc'].id,
      clerkId: userMap['vanthu'].id,
      creatorId: userMap['vanthu'].id,
      departmentId: deptMap['VP'].id,
      documentTypeId: docTypeMap['CV'].id,
      bookId: bookMap['INCOMING'].id,
      assignees: {
        create: [
          {
            departmentId: deptMap['CNTT'].id,
            userId: userMap['truongkhoa_cntt'].id,
            roleType: 'PRIMARY',
            status: 'IN_PROGRESS',
            notes: 'Đang xây dựng đề án an toàn thông tin và nâng cấp phần mềm e-Office.',
          },
          {
            departmentId: deptMap['KHTC'].id,
            userId: userMap['truongphong_tc'].id,
            roleType: 'COORDINATE',
            status: 'ACCEPTED',
            notes: 'Đã tiếp nhận văn bản, chuẩn bị dự toán kinh phí.',
          },
        ],
      },
      processingLogs: {
        create: [
          {
            actorId: userMap['vanthu'].id,
            action: 'TIẾP NHẬN & VÀO SỔ',
            notes: 'Tiếp nhận văn bản số 108/UBND-VX từ UBND TP, chuyển trình Giám đốc.',
            fromStatus: 'DRAFT',
            toStatus: 'PENDING_DIRECTIVE',
          },
          {
            actorId: userMap['giamdoc'].id,
            action: 'CHO Ý KIẾN CHỈ ĐẠO',
            notes: 'Chỉ đạo: Giao TT CNTT chủ trì, Phòng KHTC phối hợp.',
            fromStatus: 'PENDING_DIRECTIVE',
            toStatus: 'DIRECTED',
          },
          {
            actorId: userMap['vanthu'].id,
            action: 'CHUYỂN TIẾP XỬ LÝ',
            notes: 'Đã chuyển văn bản và thông báo đến Trung tâm CNTT và Phòng KHTC.',
            fromStatus: 'DIRECTED',
            toStatus: 'PROCESSING',
          },
        ],
      },
    },
  });

  // 8.2. Văn bản Đến: Mới vào sổ, chờ Lãnh đạo cho ý kiến
  const docIn2 = await prisma.document.create({
    data: {
      documentNumber: '425/BGDĐT-KHTC',
      autoSequence: 16,
      subNumber: '16/2026',
      documentTypeDoc: 'INCOMING',
      title: 'V/v Hướng dẫn lập dự toán ngân sách nhà nước năm 2027 và kế hoạch tài chính 3 năm',
      summary: 'Hướng dẫn các đơn vị trực thuộc lập dự toán thu chi và phân bổ ngân sách.',
      senderOrg: 'Bộ Giáo dục và Đào tạo',
      issueDate: new Date('2026-08-15'),
      arrivalDate: new Date('2026-08-17'),
      dueDate: new Date('2026-09-15'),
      urgencyLevel: 'NORMAL',
      confidentialityLevel: 'NORMAL',
      status: 'PENDING_DIRECTIVE',
      clerkId: userMap['vanthu'].id,
      creatorId: userMap['vanthu'].id,
      departmentId: deptMap['VP'].id,
      documentTypeId: docTypeMap['CV'].id,
      bookId: bookMap['INCOMING'].id,
      processingLogs: {
        create: [
          {
            actorId: userMap['vanthu'].id,
            action: 'TIẾP NHẬN & TRÌNH LÃNH ĐẠO',
            notes: 'Văn thư đã vào sổ số đến 16/2026 và trình Giám đốc xin ý kiến chỉ đạo.',
            fromStatus: 'DRAFT',
            toStatus: 'PENDING_DIRECTIVE',
          },
        ],
      },
    },
  });

  // 8.3. Văn bản Đi: Đã phát hành chính thức (Sinh số tự động 24/QĐ-BGD)
  const docOut1 = await prisma.document.create({
    data: {
      documentNumber: '24/QĐ-BGD',
      autoSequence: 24,
      documentTypeDoc: 'OUTGOING',
      title: 'Quyết định V/v Ban hành Quy chế Quản lý Văn bản và Điều hành công việc điện tử',
      summary: 'Quy định chi tiết về quy trình tiếp nhận, luân chuyển văn bản đến, thẩm quyền ký và phát hành văn bản đi trên nền tảng số.',
      recipientOrg: 'Các phòng ban, đơn vị trực thuộc cơ quan',
      issueDate: new Date('2026-08-18'),
      urgencyLevel: 'NORMAL',
      confidentialityLevel: 'NORMAL',
      status: 'ISSUED',
      leaderId: userMap['giamdoc'].id,
      clerkId: userMap['vanthu'].id,
      creatorId: userMap['truongkhoa_cntt'].id,
      departmentId: deptMap['CNTT'].id,
      documentTypeId: docTypeMap['QD'].id,
      bookId: bookMap['OUTGOING'].id,
      dispatchMethod: 'Điện tử & Bưu chính',
      dispatchStatus: 'Đã gửi toàn cơ quan',
      dispatchDate: new Date('2026-08-18'),
      processingLogs: {
        create: [
          {
            actorId: userMap['truongkhoa_cntt'].id,
            action: 'SOẠN THẢO DỰ THẢO',
            notes: 'Tạo dự thảo Quyết định quy chế quản lý văn bản.',
            fromStatus: 'DRAFT',
            toStatus: 'PENDING_APPROVAL',
          },
          {
            actorId: userMap['giamdoc'].id,
            action: 'PHÊ DUYỆT & KÝ BAN HÀNH',
            notes: 'Giám đốc đã ký duyệt ban hành quy chế.',
            fromStatus: 'PENDING_APPROVAL',
            toStatus: 'APPROVED',
          },
          {
            actorId: userMap['vanthu'].id,
            action: 'CẤP SỐ & PHÁT HÀNH',
            notes: 'Văn thư cấp số chính thức 24/QĐ-BGD, vào sổ đi và gửi thông báo toàn cơ quan.',
            fromStatus: 'APPROVED',
            toStatus: 'ISSUED',
          },
        ],
      },
    },
  });

  // 8.4. Văn bản Nội bộ: Thông báo nội bộ toàn cơ quan
  const docInternal1 = await prisma.document.create({
    data: {
      documentNumber: '08/TB-VP',
      autoSequence: 8,
      documentTypeDoc: 'INTERNAL',
      title: 'Thông báo Lịch nghỉ Lễ Quốc khánh 02/09 và Phân công Lực lượng trực ban cơ quan',
      summary: 'Thông báo thời gian nghỉ lễ từ ngày 01/09 đến hết ngày 03/09/2026 và danh sách phân công cán bộ trực chỉ huy.',
      issueDate: new Date('2026-08-18'),
      urgencyLevel: 'NORMAL',
      confidentialityLevel: 'NORMAL',
      status: 'ISSUED',
      creatorId: userMap['vanthu'].id,
      departmentId: deptMap['VP'].id,
      documentTypeId: docTypeMap['TB'].id,
      bookId: bookMap['INTERNAL'].id,
      internalAudiences: {
        create: [
          { scopeType: 'ALL', isRead: false },
        ],
      },
      processingLogs: {
        create: [
          {
            actorId: userMap['vanthu'].id,
            action: 'ĐĂNG TẢI VĂN BẢN NỘI BỘ',
            notes: 'Phát hành thông báo nội bộ đến toàn thể cán bộ, nhân viên.',
            fromStatus: 'DRAFT',
            toStatus: 'ISSUED',
          },
        ],
      },
    },
  });

  // 8.5. Notifications sample
  await prisma.notification.createMany({
    data: [
      {
        userId: userMap['giamdoc'].id,
        title: 'Văn bản đến mới cần cho ý kiến',
        content: 'Văn thư đã trình văn bản số 425/BGDĐT-KHTC từ Bộ Giáo dục và Đào tạo.',
        link: `/van-ban-den/${docIn2.id}`,
        type: 'DIRECTIVE',
      },
      {
        userId: userMap['truongkhoa_cntt'].id,
        title: 'Ý kiến chỉ đạo mới từ Giám đốc',
        content: 'Bạn được giao chủ trì xử lý văn bản số 108/UBND-VX. Hạn xử lý: 30/08/2026.',
        link: `/van-ban-den/${docIn1.id}`,
        type: 'ASSIGNMENT',
      },
      {
        userId: userMap['truongkhoa_cntt'].id,
        title: 'Văn bản đi đã được phát hành',
        content: 'Dự thảo Quyết định quy chế của bạn đã được cấp số chính thức 24/QĐ-BGD.',
        link: `/van-ban-di/${docOut1.id}`,
        type: 'OUTGOING_ISSUED',
      },
    ],
  });

  console.log('✓ Sample Documents & Notifications seeded.');
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
