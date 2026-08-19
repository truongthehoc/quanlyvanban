'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import { CreateOutgoingModal, IssueAndNumberModal } from '@/components/documents/OutgoingActionModals';

export default function OutgoingDocsPage() {
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

  useEffect(() => {
    fetchDocs();
  }, [currentUser, statusFilter, urgencyFilter]);

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
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Dự thảo
          </span>
        );
      case 'PENDING_DIRECTIVE':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
            Chờ duyệt ký
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1E60F3] border border-blue-100">
            Đã ký - Chờ cấp số
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
            Đã ban hành
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1 */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'ALL' ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#1E60F3] uppercase tracking-wider">Tổng số văn bản</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</p>
            <p className="text-xs text-slate-400 font-medium">Trong hệ thống</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3]">
            <Send className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => setStatusFilter('PENDING_DIRECTIVE')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'PENDING_DIRECTIVE' ? 'ring-2 ring-amber-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chờ ký duyệt</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{pendingLeaderCount}</p>
            <p className="text-xs text-slate-400 font-medium">Trình Ban Giám đốc</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'APPROVED' ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#1E60F3] uppercase tracking-wider">Chờ cấp số & Gửi</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{approvedCount}</p>
            <p className="text-xs text-slate-400 font-medium">Văn thư phát hành</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3]">
            <Stamp className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => setStatusFilter('ISSUED')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'ISSUED' ? 'ring-2 ring-emerald-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã ban hành</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{issuedCount}</p>
            <p className="text-xs text-slate-400 font-medium">Đã gửi đi thành công</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* 3. Search & Filter Bar with Rounded Inputs */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Tìm theo số ký hiệu, trích yếu, nơi nhận..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs focus:border-[#1E60F3] focus:outline-none placeholder:text-slate-400 shadow-sm"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </form>

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
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Số ký hiệu */}
                    <td className="py-4 px-4 sm:px-5 font-bold text-[#1E60F3]">
                      <span
                        onClick={() => setSelectedDoc(doc)}
                        className="hover:underline cursor-pointer"
                      >
                        {doc.documentNumber || '(Chờ cấp số)'}
                      </span>
                    </td>

                    {/* Trích yếu */}
                    <td className="py-4 px-4 sm:px-5 max-w-md">
                      <div
                        onClick={() => setSelectedDoc(doc)}
                        className="font-semibold text-slate-900 hover:text-[#1E60F3] cursor-pointer line-clamp-2"
                      >
                        {doc.title}
                      </div>
                    </td>

                    {/* Loại VB */}
                    <td className="py-4 px-4 sm:px-5 text-slate-700 font-medium">
                      {doc.documentType?.name || '---'}
                    </td>

                    {/* Nơi nhận */}
                    <td className="py-4 px-4 sm:px-5 text-slate-700 font-medium">
                      {doc.recipientOrg || '---'}
                    </td>

                    {/* Đơn vị soạn */}
                    <td className="py-4 px-4 sm:px-5 text-slate-600">
                      {doc.department?.name || '---'}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-4 sm:px-5">
                      {getStatusBadge(doc.status)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-4 sm:px-5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors"
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
