import { NextResponse } from 'next/server';

// In-memory / initial server configuration fallback
let serverConfig = {
  adminInfo: {
    orgName: 'Ủy ban Nhân dân Thành phố',
    shortName: 'UBND Thành phố',
    orgCode: 'UBND-TP',
    address: 'Số 01 Đường Quang Trung, Phường 1, TP. Thủ Dầu Một',
    phone: '0274.3822.999',
    email: 'vanthu@binhduong.gov.vn',
    website: 'https://binhduong.gov.vn',
    leaderName: 'Võ Văn Minh - Chủ tịch UBND',
    logoUrl: '',
  },
  brandTheme: {
    primaryColor: '#1E60F3',
    primaryHover: '#174ec7',
    accentColor: '#3B82F6',
    themeMode: 'LIGHT',
    borderRadius: 'rounded-full',
  },
  softwareInfo: {
    softwareName: 'e-Office DMS',
    slogan: 'Hệ thống Quản lý Văn bản & Điều hành',
    developer: 'e-Office Tech Solutions JSC',
    currentVersion: 'v2.6.2',
  },
  versionHistory: [
    {
      id: 'v-2-6-2',
      version: 'v2.6.2',
      releaseType: 'PATCH',
      releaseDate: '2026-08-19 14:30',
      authorName: 'Nguyễn Văn Quản Trị',
      changelog: [
        'Tối ưu giao diện Modal Popup căn giữa với React Portal (createPortal) phủ kín 100% màn hình.',
        'Thêm cơ chế Static Backdrop chống tắt nhầm khi thao tác.',
        'Cập nhật nhãn phân công văn bản phòng ban theo chuẩn hành chính.',
      ],
    },
    {
      id: 'v-2-6-1',
      version: 'v2.6.1',
      releaseType: 'PATCH',
      releaseDate: '2026-08-19 10:15',
      authorName: 'Nguyễn Văn Quản Trị',
      changelog: [
        'Tái cấu trúc giao diện Sidebar-first hiện đại với nút thu nhỏ border pill < và >.',
        'Tối ưu độ rộng Sidebar và tích hợp thương hiệu cơ quan lên đầu Sidebar.',
      ],
    },
    {
      id: 'v-2-6-0',
      version: 'v2.6.0',
      releaseType: 'MINOR',
      releaseDate: '2026-08-18 09:00',
      authorName: 'e-Office Core Team',
      changelog: [
        'Ra mắt phân hệ Quản lý Sổ văn bản điện tử và tự động cấp số văn bản.',
        'Tích hợp ma trận phân quyền động 5 vai trò (RBAC 2.6).',
        'Hỗ trợ đầy đủ luồng văn bản Đến, Đi và Nội bộ.',
      ],
    },
    {
      id: 'v-2-0-0',
      version: 'v2.0.0',
      releaseType: 'MAJOR',
      releaseDate: '2026-08-01 08:00',
      authorName: 'e-Office Core Team',
      changelog: [
        'Khởi tạo kiến trúc hệ thống e-Office DMS trên nền tảng Next.js 15 và TailwindCSS.',
        'Thiết lập toàn bộ cơ sở dữ liệu và API xử lý nghiệp vụ hành chính.',
      ],
    },
  ],
};

export async function GET() {
  return NextResponse.json(serverConfig);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    serverConfig = {
      ...serverConfig,
      ...body,
      adminInfo: { ...serverConfig.adminInfo, ...(body.adminInfo || {}) },
      brandTheme: { ...serverConfig.brandTheme, ...(body.brandTheme || {}) },
      softwareInfo: { ...serverConfig.softwareInfo, ...(body.softwareInfo || {}) },
      versionHistory: body.versionHistory || serverConfig.versionHistory,
    };
    return NextResponse.json({ success: true, config: serverConfig });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update system config' }, { status: 500 });
  }
}
