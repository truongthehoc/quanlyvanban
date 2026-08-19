'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import {
  Bell,
  User,
  Shield,
  CheckCircle,
  FileText,
  Clock,
  ChevronDown,
  Building2,
  Sparkles,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const {
    currentUser,
    usersList,
    switchUser,
    unreadNotificationCount,
    setUnreadNotificationCount,
  } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications list:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, markAll: true }),
      });
      setUnreadNotificationCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Sidebar Toggle Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all focus:outline-none border border-slate-200 shadow-sm"
          title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-[#1E60F3]" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-slate-600" />
          )}
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span>Hệ thống Quản lý Văn bản</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-800 font-semibold">{currentUser?.departmentName || 'Cơ quan'}</span>
          </div>
        </div>
      </div>

      {/* Right: Role Switcher & User Action Center */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Quick Role Switcher */}
        <div className="flex items-center space-x-2 rounded-full bg-slate-50 p-1.5 border border-slate-200 shadow-sm">
          <div className="hidden lg:flex items-center space-x-1.5 pl-3 text-xs font-semibold text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Thử nghiệm vai trò:</span>
          </div>
          <select
            value={currentUser?.username || ''}
            onChange={(e) => switchUser(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm focus:border-[#1E60F3] focus:outline-none cursor-pointer max-w-[200px] sm:max-w-none truncate"
          >
            {usersList.map((u) => (
              <option key={u.username} value={u.username}>
                {u.fullName} — [{u.position} / {u.roles.join(', ')}]
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              if (!showNotifMenu) loadNotifications();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none border border-slate-200"
            title="Thông báo"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-sm">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Thông báo luân chuyển</span>
                  {unreadNotificationCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {unreadNotificationCount} mới
                    </span>
                  )}
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#1E60F3] hover:underline font-semibold"
                  >
                    Đã đọc tất cả
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Không có thông báo mới
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors rounded-xl ${
                        !n.isRead ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 line-clamp-2">{n.content}</p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setShowNotifMenu(false)}
                          className="mt-2 inline-flex items-center text-[#1E60F3] hover:underline text-[11px] font-semibold"
                        >
                          Xem chi tiết <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current User Card */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2.5 rounded-full border border-slate-200 bg-white pl-2 pr-3 py-1.5 hover:bg-slate-50 transition-all focus:outline-none shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E60F3] text-white font-bold text-xs shadow-sm">
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{currentUser?.fullName}</div>
              <div className="text-[10px] text-slate-400 font-semibold">{currentUser?.position}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="border-b border-slate-100 pb-2.5 mb-2">
                <p className="font-bold text-slate-900 text-xs">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-500">{currentUser?.email || currentUser?.username}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {currentUser?.roles.map((r) => (
                    <span key={r} className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      {r}
                    </span>
                  ))}
                  {currentUser?.departmentName && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {currentUser.departmentName}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center space-x-2 py-0.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px]">Đơn vị: <strong>{currentUser?.departmentName || 'Chưa gán'}</strong></span>
                </div>
                <div className="flex items-center space-x-2 py-0.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px]">Quyền: {currentUser?.roles.includes('ADMIN') ? 'Toàn quyền Quản trị' : 'Theo chức vụ'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
