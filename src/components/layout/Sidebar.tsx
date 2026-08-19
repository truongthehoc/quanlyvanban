'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import {
  LayoutDashboard,
  Inbox,
  Send,
  Radio,
  BookOpen,
  ShieldCheck,
  Building2,
  Users,
  Landmark,
  FileCode2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, hasPermission, hasRole } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navGroups = [
    {
      title: 'TỔNG QUAN',
      items: [
        {
          label: 'Bảng điều khiển',
          href: '/',
          icon: LayoutDashboard,
          show: true,
        },
      ],
    },
    {
      title: 'QUẢN LÝ VĂN BẢN',
      items: [
        {
          label: 'Văn bản Đến',
          href: '/van-ban-den',
          icon: Inbox,
          show: hasPermission('doc_in:view_all') || hasPermission('doc_in:view_dept') || hasPermission('doc_in:create'),
        },
        {
          label: 'Văn bản Đi',
          href: '/van-ban-di',
          icon: Send,
          show: hasPermission('doc_out:view_all') || hasPermission('doc_out:create'),
        },
        {
          label: 'Văn bản Nội bộ',
          href: '/van-ban-noi-bo',
          icon: Radio,
          show: hasPermission('doc_internal:view') || hasPermission('doc_internal:create'),
        },
        {
          label: 'Sổ Văn bản',
          href: '/so-van-ban',
          icon: BookOpen,
          show: hasPermission('books:manage') || hasPermission('books:export'),
        },
      ],
    },
    {
      title: 'QUẢN LÝ DANH MỤC',
      items: [
        {
          label: 'Danh mục Phòng ban',
          href: '/quan-tri/phong-ban',
          icon: Building2,
          show: hasRole('ADMIN') || hasPermission('system:departments'),
        },
        {
          label: 'Danh mục Người dùng',
          href: '/quan-tri/nguoi-dung',
          icon: Users,
          show: hasRole('ADMIN') || hasPermission('system:users'),
        },
        {
          label: 'Cơ quan / Đơn vị ngoài',
          href: '/quan-tri/co-quan',
          icon: Landmark,
          show: hasRole('ADMIN') || hasRole('CLERK') || hasPermission('system:departments'),
        },
        {
          label: 'Loại VB & Mẫu số',
          href: '/quan-tri/loai-van-ban',
          icon: FileCode2,
          show: hasRole('ADMIN') || hasPermission('system:doc_types'),
        },
        {
          label: 'Ma trận Phân quyền',
          href: '/quan-tri/phan-quyen',
          icon: ShieldCheck,
          badge: 'RBAC',
          show: hasRole('ADMIN') || hasPermission('system:matrix'),
        },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between border-r border-slate-200 bg-white select-none transition-all duration-300 ease-in-out z-10 h-screen flex-shrink-0 ${
        isCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Modern Floating Border Toggle Button (< and >) */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md hover:border-blue-400 hover:text-[#1E60F3] hover:bg-blue-50 transition-all duration-200 hover:scale-110 focus:outline-none cursor-pointer"
        title={isCollapsed ? 'Mở rộng thanh điều hướng (>)' : 'Thu gọn thanh điều hướng (<)'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* 1. Top Sidebar Branding / Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-3.5 bg-white">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center space-x-3 group overflow-hidden w-full">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  e-Office <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">DMS</span>
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-[#1E60F3] border border-blue-200">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                Quản lý Văn bản & Điều hành
              </p>
            </div>
          </Link>
        ) : (
          <Link href="/" className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:scale-105 transition-transform" title="e-Office DMS v2.6">
            <FileText className="h-5 w-5" />
          </Link>
        )}
      </div>

      {/* 2. Navigation Menu */}
      <div className="py-4 overflow-y-auto overflow-x-hidden flex-1 space-y-6">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((i) => i.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className={isCollapsed ? 'px-2' : 'px-3'}>
              {!isCollapsed ? (
                <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  {group.title}
                </div>
              ) : (
                gIdx > 0 && <div className="mx-auto my-3 h-px w-6 bg-slate-200" />
              )}

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`group relative flex items-center rounded-2xl transition-all duration-150 ${
                        isCollapsed
                          ? 'justify-center h-10 w-10 mx-auto'
                          : 'justify-between px-3.5 py-2.5 text-xs font-semibold'
                      } ${
                        isActive
                          ? 'bg-[#1E60F3] text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                        <Icon
                          className={`h-4.5 w-4.5 flex-shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 z-50 hidden rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl group-hover:block whitespace-nowrap pointer-events-none">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Footer Info */}
      {!isCollapsed ? (
        <div className="p-3.5 border border-slate-200/80 bg-slate-50/70 m-3 rounded-2xl text-xs">
          <p className="font-bold text-slate-800">Cơ chế RBAC 2.6</p>
          <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
            Phân quyền động theo vai trò người dùng.
          </p>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-100 text-center">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mx-auto ring-4 ring-emerald-50" title="Hệ thống trực tuyến" />
        </div>
      )}
    </aside>
  );
}
