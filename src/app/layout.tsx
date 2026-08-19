import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { SidebarProvider } from '@/lib/sidebar-context';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Hệ thống Quản lý Văn bản và Điều hành Công việc (e-Office DMS)',
  description: 'Nền tảng Quản lý Văn bản Đến, Văn bản Đi, Văn bản Nội bộ, Tự động cấp số và Ma trận phân quyền RBAC',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="bg-slate-100/70 text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <SidebarProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-slate-50/70">
                  <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
