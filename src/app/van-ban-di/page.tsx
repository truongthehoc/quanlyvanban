'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Send,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Stamp,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Info,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  AlertCircle,
  Building2,
  X,
} from 'lucide-react';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import { CreateOutgoingModal, IssueAndNumberModal } from '@/components/documents/OutgoingActionModals';

export default function OutgoingDocsPage() {
  const router = useRouter();
  const { currentUser, hasRole } = useAuth();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issueDoc, setIssueDoc] = useState<any>(null);

  const fetchDocs = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        urgency: urgencyFilter,
        search,
        role: currentUser.roles[0],
        departmentId: currentUser.departmentId || '',
        userId: currentUser.id,
      });

      const res = await fetch(`/api/documents/out?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search effect with 300ms debounce on typing / filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocs();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentUser, search, statusFilter, urgencyFilter]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchDocs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setUrgencyFilter('ALL');
    fetchDocs();
  };

  const totalCount = documents.length;
  const draftCount = documents.filter((d) => d.status === 'DRAFT').length;
  const pendingLeaderCount = documents.filter((d) => d.status === 'PENDING_DIRECTIVE').length;
  const approvedCount = documents.filter((d) => d.status === 'APPROVED').length;
  const issuedCount = documents.filter((d) => d.status === 'ISSUED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Dự thảo
          </span>
        );
      case 'PENDING_DIRECTIVE':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
            Chờ duyệt ký
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1E60F3] border border-blue-100">
            Đã ký - Chờ cấp số
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
            Đã ban hành
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {status}
          </span>
        );
    }
  };

  const totalPages = Math.ceil(documents.length / pageSize) || 1;
  const paginatedDocs = documents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Area with Rounded Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Văn bản đi
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Soạn thảo dự thảo, trình ký duyệt, tự động cấp số văn bản và phát hành.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo dự thảo văn bản đi</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Widgets (4 Cards Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Tổng số văn bản */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/40 ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-[#1E60F3] border-transparent shadow-md shadow-blue-500/15'
              : 'border-blue-100/80 hover:border-blue-300/80 shadow-sm hover:shadow-md hover:shadow-blue-500/5'
          }`}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-blue-400/15 blur-xl pointer-events-none group-hover:bg-blue-400/25 transition-all" />
          <Send className="absolute -right-2 -bottom-2 h-14 w-14 text-blue-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />

          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-[#1E60F3] uppercase tracking-wider">Tổng số văn bản</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{totalCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Trong hệ thống</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-100/60">
            <Send className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Chờ ký duyệt */}
        <div
          onClick={() => setStatusFilter('PENDING_DIRECTIVE')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 ${
            statusFilter === 'PENDING_DIRECTIVE'
              ? 'ring-2 ring-amber-500 border-transparent shadow-md shadow-amber-500/15'
              : 'border-amber-100/80 hover:border-amber-300/80 shadow-sm hover:shadow-md hover:shadow-amber-500/5'
          }`}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-amber-400/15 blur-xl pointer-events-none group-hover:bg-amber-400/25 transition-all" />
          <Clock className="absolute -right-2 -bottom-2 h-14 w-14 text-amber-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />

          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chờ ký duyệt</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{pendingLeaderCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Trình Ban Giám đốc</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25 ring-4 ring-amber-100/60">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Chờ cấp số & Gửi */}
        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/40 ${
            statusFilter === 'APPROVED'
              ? 'ring-2 ring-indigo-500 border-transparent shadow-md shadow-indigo-500/15'
              : 'border-indigo-100/80 hover:border-indigo-300/80 shadow-sm hover:shadow-md hover:shadow-indigo-500/5'
          }`}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-indigo-400/15 blur-xl pointer-events-none group-hover:bg-indigo-400/25 transition-all" />
          <Stamp className="absolute -right-2 -bottom-2 h-14 w-14 text-indigo-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />

          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Chờ cấp số & Gửi</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{approvedCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Văn thư phát hành</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25 ring-4 ring-indigo-100/60">
            <Stamp className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Đã ban hành */}
        <div
          onClick={() => setStatusFilter('ISSUED')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 ${
            statusFilter === 'ISSUED'
              ? 'ring-2 ring-emerald-500 border-transparent shadow-md shadow-emerald-500/15'
              : 'border-emerald-100/80 hover:border-emerald-300/80 shadow-sm hover:shadow-md hover:shadow-emerald-500/5'
          }`}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-emerald-400/15 blur-xl pointer-events-none group-hover:bg-emerald-400/25 transition-all" />
          <CheckCircle2 className="absolute -right-2 -bottom-2 h-14 w-14 text-emerald-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />

          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã ban hành</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{issuedCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Đã gửi đi thành công</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-100/60">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 3. Search & Filter Bar with Rounded Inputs */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Tìm theo số ký hiệu, trích yếu, nơi nhận..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-xs focus:border-[#1E60F3] focus:outline-none placeholder:text-slate-400 shadow-sm"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              title="Xóa tìm kiếm"
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 text-xs w-full sm:w-auto justify-end">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Dự thảo</option>
            <option value="PENDING_DIRECTIVE">Chờ duyệt ký</option>
            <option value="APPROVED">Đã ký - Chờ cấp số</option>
            <option value="ISSUED">Đã ban hành</option>
          </select>
        </div>
      </div>

      {/* 4. Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                <th className="py-3.5 px-4 sm:px-5 w-36 font-bold text-slate-800">Số ký hiệu</th>
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Trích yếu nội dung</th>
                <th className="py-3.5 px-4 sm:px-5 w-40 font-bold text-slate-800">Loại văn bản</th>
                <th className="py-3.5 px-4 sm:px-5 w-48 font-bold text-slate-800">Nơi nhận</th>
                <th className="py-3.5 px-4 sm:px-5 w-36 font-bold text-slate-800">Đơn vị soạn</th>
                <th className="py-3.5 px-4 sm:px-5 w-36 font-bold text-slate-800">Trạng thái</th>
                <th className="py-3.5 px-4 sm:px-5 w-28 text-right font-bold text-slate-800">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách văn bản đi...
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy văn bản đi nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => router.push(`/van-ban-di/${doc.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Số ký hiệu */}
                    <td className="py-4 px-4 sm:px-5 font-bold text-[#1E60F3] whitespace-nowrap">
                      <span className="group-hover:underline">
                        {doc.documentNumber || '(Chờ cấp số)'}
                      </span>
                    </td>

                    {/* Trích yếu */}
                    <td className="py-4 px-4 sm:px-5 max-w-md">
                      <div className="font-semibold text-slate-900 group-hover:text-[#1E60F3] transition-colors line-clamp-2">
                        {doc.title}
                      </div>
                    </td>

                    {/* Loại VB */}
                    <td className="py-4 px-4 sm:px-5 text-slate-700 font-medium whitespace-nowrap">
                      {doc.documentType?.name || '---'}
                    </td>

                    {/* Nơi nhận */}
                    <td className="py-4 px-4 sm:px-5 text-slate-700 font-medium">
                      <span className="line-clamp-2">{doc.recipientOrg || '---'}</span>
                    </td>

                    {/* Đơn vị soạn */}
                    <td className="py-4 px-4 sm:px-5 text-slate-600 whitespace-nowrap">
                      {doc.department?.name || '---'}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-4 sm:px-5 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-4 sm:px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => router.push(`/van-ban-di/${doc.id}`)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {hasRole('CLERK') && doc.status === 'APPROVED' && (
                          <button
                            onClick={() => setIssueDoc(doc)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Cấp số & Phát hành"
                          >
                            <Stamp className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 bg-white text-xs text-slate-600">
          <div>
            Hiển thị <span className="font-bold text-slate-800">{documents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, documents.length)}</span> trong tổng số <span className="font-bold text-slate-800">{totalCount}</span> văn bản
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = currentPage === pageNum;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1E60F3] text-white shadow-sm'
                      : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* MODALS */}
      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onRefresh={fetchDocs}
          onOpenIssueModal={(d) => setIssueDoc(d)}
        />
      )}

      {showCreateModal && (
        <CreateOutgoingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchDocs}
        />
      )}

      {issueDoc && (
        <IssueAndNumberModal
          document={issueDoc}
          onClose={() => setIssueDoc(null)}
          onSuccess={fetchDocs}
        />
      )}

    </div>
  );
}
