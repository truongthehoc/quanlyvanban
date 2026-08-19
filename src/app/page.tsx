'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Inbox,
  Send,
  Radio,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  PlusCircle,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import {
  DirectiveModal,
  ForwardModal,
  ProgressModal,
  CreateIncomingModal,
} from '@/components/documents/IncomingActionModals';
import { CreateOutgoingModal, IssueAndNumberModal } from '@/components/documents/OutgoingActionModals';
import { CreateInternalModal } from '@/components/documents/InternalActionModals';

export default function DashboardPage() {
  const { currentUser, hasRole } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showIncomingCreate, setShowIncomingCreate] = useState(false);
  const [showOutgoingCreate, setShowOutgoingCreate] = useState(false);
  const [showInternalCreate, setShowInternalCreate] = useState(false);
  const [directiveDoc, setDirectiveDoc] = useState<any>(null);
  const [forwardDoc, setForwardDoc] = useState<any>(null);
  const [progressDoc, setProgressDoc] = useState<any>(null);
  const [issueDoc, setIssueDoc] = useState<any>(null);

  const fetchStats = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(
        `/api/stats/dashboard?userId=${currentUser.id}&role=${currentUser.roles[0]}&departmentId=${currentUser.departmentId || ''}`
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Premium Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800/80">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 rounded-full bg-blue-500/15 px-3.5 py-1 text-xs font-bold text-blue-300 border border-blue-400/25 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Hệ thống Quản lý Văn bản và Điều hành Điện tử</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Xin chào, {currentUser?.fullName || 'Cán bộ'}!
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bạn đang làm việc với chức vụ <span className="font-bold text-white uppercase bg-white/10 px-2.5 py-0.5 rounded-full">{currentUser?.position}</span> thuộc <span className="font-semibold text-blue-200">{currentUser?.departmentName || 'Hệ thống'}</span>.
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            {hasRole(['CLERK', 'ADMIN']) && (
              <button
                onClick={() => setShowIncomingCreate(true)}
                className="flex items-center space-x-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Tiếp nhận VB Đến</span>
              </button>
            )}

            <button
              onClick={() => setShowOutgoingCreate(true)}
              className="flex items-center space-x-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Tạo Dự thảo Đi</span>
            </button>

            <button
              onClick={() => setShowInternalCreate(true)}
              className="flex items-center space-x-2 rounded-full bg-slate-800/90 px-5 py-2.5 text-xs font-bold text-blue-200 border border-slate-700/80 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              <Radio className="h-4 w-4" />
              <span>Đăng VB Nội bộ</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards - Full Width Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: VB Đến */}
        <Link
          href="/van-ban-den"
          className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Văn bản Đến</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Inbox className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{stats?.totals?.incoming ?? 0}</span>
            <span className="text-xs font-semibold text-slate-400">văn bản</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Chờ chỉ đạo: <strong className="text-amber-600 font-bold">{stats?.incomingStats?.pendingLeader ?? 0}</strong></span>
            <span>Đang xử lý: <strong className="text-indigo-600 font-bold">{stats?.incomingStats?.processing ?? 0}</strong></span>
          </div>
        </Link>

        {/* Metric 2: VB Đi */}
        <Link
          href="/van-ban-di"
          className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Văn bản Đi</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <Send className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{stats?.totals?.outgoing ?? 0}</span>
            <span className="text-xs font-semibold text-slate-400">văn bản</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Đã ban hành: <strong className="text-emerald-600 font-bold">{stats?.outgoingStats?.issued ?? 0}</strong></span>
            <span>Chờ cấp số: <strong className="text-amber-600 font-bold">{stats?.outgoingStats?.approved ?? 0}</strong></span>
          </div>
        </Link>

        {/* Metric 3: VB Nội bộ */}
        <Link
          href="/van-ban-noi-bo"
          className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Văn bản Nội bộ</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
              <Radio className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{stats?.totals?.internal ?? 0}</span>
            <span className="text-xs font-semibold text-slate-400">thông báo</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span className="truncate">Phân quyền theo phạm vi phòng ban/nhóm</span>
            <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 transition-colors flex-shrink-0" />
          </div>
        </Link>

        {/* Metric 4: Tình trạng Quá hạn */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Cảnh báo Tiến độ</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-600 tracking-tight">{stats?.totals?.overdue ?? 0}</span>
            <span className="text-xs font-semibold text-slate-400">quá hạn xử lý</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
            Tự động theo dõi thời hạn hoàn thành (Due date)
          </div>
        </div>
      </div>

      {/* Main Content Grid: Action Items & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Actionable Items for Current Role */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Nhiệm vụ cần xử lý ngay
                </h2>
                <p className="text-[11px] text-slate-400">Dành riêng cho vai trò: {currentUser?.position}</p>
              </div>
            </div>

            <Link
              href="/van-ban-den"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {stats?.myActionItems && stats.myActionItems.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.myActionItems.map((doc: any) => (
                <div
                  key={doc.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 px-3 rounded-2xl transition-all"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="rounded-full bg-blue-50 px-3 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-200/60">
                        {doc.documentNumber || doc.subNumber || 'VB Đến'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">• {doc.senderOrg || 'Nội bộ'}</span>
                      {doc.dueDate && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                          Hạn: {new Date(doc.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    
                    <p
                      onClick={() => setSelectedDoc(doc)}
                      className="font-bold text-slate-900 text-xs sm:text-sm hover:text-blue-600 cursor-pointer line-clamp-1"
                    >
                      {doc.title}
                    </p>
                    
                    {doc.leaderDirective && (
                      <p className="text-xs text-blue-800 italic line-clamp-1 bg-blue-50/50 px-3 py-1 rounded-xl border border-blue-100">
                        Chỉ đạo: "{doc.leaderDirective}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                    >
                      Chi tiết
                    </button>

                    {hasRole('LEADER') && doc.status === 'PENDING_DIRECTIVE' && (
                      <button
                        onClick={() => setDirectiveDoc(doc)}
                        className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                      >
                        Cho chỉ đạo
                      </button>
                    )}

                    {hasRole('CLERK') && doc.status === 'DIRECTED' && (
                      <button
                        onClick={() => setForwardDoc(doc)}
                        className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                      >
                        Chuyển tiếp
                      </button>
                    )}

                    {hasRole('CLERK') && doc.status === 'APPROVED' && (
                      <button
                        onClick={() => setIssueDoc(doc)}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                      >
                        Cấp số phát hành
                      </button>
                    )}

                    {hasRole(['HEAD_DEPT', 'OFFICER']) && doc.status === 'PROCESSING' && (
                      <button
                        onClick={() => setProgressDoc(doc)}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                      >
                        Báo cáo kết quả
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center text-xs text-slate-400">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="font-bold text-slate-800 text-sm">Tuyệt vời! Bạn không có nhiệm vụ tồn đọng nào.</p>
              <p className="text-slate-400 text-xs mt-1">Mọi văn bản trong phạm vi phụ trách đã được xử lý xong.</p>
            </div>
          )}
        </div>

        {/* Right Col: Recent System Activities */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-4">
            <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Nhật ký luân chuyển</h2>
              <p className="text-[11px] text-slate-400">Hoạt động mới nhất trong cơ quan</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act: any) => (
                <div key={act.id} className="text-xs flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0 shadow-sm" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">
                      {act.actor?.fullName} <span className="font-semibold text-blue-600">[{act.action}]</span>
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{act.notes}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(act.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có hoạt động mới.</p>
            )}
          </div>

          {/* Quick RBAC shortcut info */}
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 border border-blue-200/60 text-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold mb-1">
              <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
              <span>Phân quyền động (RBAC)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Bạn có thể bật/tắt quyền truy cập danh mục & chức năng cho từng Role bất kỳ lúc nào.
            </p>
            <Link
              href="/quan-tri/phan-quyen"
              className="mt-2.5 inline-flex items-center text-blue-700 font-bold text-xs hover:underline"
            >
              Mở Ma trận Phân quyền &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* MODALS */}
      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onRefresh={fetchStats}
          onOpenDirectiveModal={(d) => setDirectiveDoc(d)}
          onOpenForwardModal={(d) => setForwardDoc(d)}
          onOpenProgressModal={(d) => setProgressDoc(d)}
          onOpenIssueModal={(d) => setIssueDoc(d)}
        />
      )}

      {showIncomingCreate && (
        <CreateIncomingModal
          onClose={() => setShowIncomingCreate(false)}
          onSuccess={fetchStats}
        />
      )}

      {showOutgoingCreate && (
        <CreateOutgoingModal
          onClose={() => setShowOutgoingCreate(false)}
          onSuccess={fetchStats}
        />
      )}

      {showInternalCreate && (
        <CreateInternalModal
          onClose={() => setShowInternalCreate(false)}
          onSuccess={fetchStats}
        />
      )}

      {directiveDoc && (
        <DirectiveModal
          document={directiveDoc}
          onClose={() => setDirectiveDoc(null)}
          onSuccess={fetchStats}
        />
      )}

      {forwardDoc && (
        <ForwardModal
          document={forwardDoc}
          onClose={() => setForwardDoc(null)}
          onSuccess={fetchStats}
        />
      )}

      {progressDoc && (
        <ProgressModal
          document={progressDoc}
          onClose={() => setProgressDoc(null)}
          onSuccess={fetchStats}
        />
      )}

      {issueDoc && (
        <IssueAndNumberModal
          document={issueDoc}
          onClose={() => setIssueDoc(null)}
          onSuccess={fetchStats}
        />
      )}

    </div>
  );
}
