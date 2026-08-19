'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Radio,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Building2,
  Users,
  Check,
} from 'lucide-react';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import { CreateInternalModal } from '@/components/documents/InternalActionModals';

export default function InternalDocsPage() {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDocs = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        userId: currentUser.id,
        departmentId: currentUser.departmentId || '',
      });

      const res = await fetch(`/api/documents/internal?${params.toString()}`);
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
  }, [currentUser]);

  const handleConfirmRead = async (docId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/documents/${docId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CONFIRM_READ',
          actorId: currentUser.id,
        }),
      });
      if (res.ok) {
        fetchDocs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalCount = documents.length;
  const generalNoticeCount = documents.filter((d) => !d.departmentId).length;
  const deptScopeCount = documents.filter((d) => d.departmentId).length;

  const totalPages = Math.ceil(documents.length / pageSize) || 1;
  const paginatedDocs = documents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Area with Rounded Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Văn bản nội bộ & Thông báo
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thông báo, quy định, hướng dẫn và lịch công tác nội bộ cơ quan.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Đăng thông báo nội bộ</span>
        </button>
      </div>

      {/* 2. Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#1E60F3] uppercase tracking-wider">Tổng văn bản nội bộ</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</p>
            <p className="text-xs text-slate-400 font-medium">Đã đăng tải trên hệ thống</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3]">
            <Radio className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Toàn thể cơ quan</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{generalNoticeCount}</p>
            <p className="text-xs text-slate-400 font-medium">Phạm vi công khai</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Theo Khoa / Phòng ban</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{deptScopeCount}</p>
            <p className="text-xs text-slate-400 font-medium">Phạm vi nhóm cụ thể</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. Search Bar with Rounded Input */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Tìm kiếm thông báo, trích yếu, người đăng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDocs()}
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs focus:border-[#1E60F3] focus:outline-none placeholder:text-slate-400 shadow-sm"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* 4. Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Trích yếu nội dung thông báo</th>
                <th className="py-3.5 px-4 sm:px-5 w-44 font-bold text-slate-800">Phạm vi đối tượng</th>
                <th className="py-3.5 px-4 sm:px-5 w-44 font-bold text-slate-800">Người đăng tải</th>
                <th className="py-3.5 px-4 sm:px-5 w-36 font-bold text-slate-800">Ngày đăng</th>
                <th className="py-3.5 px-4 sm:px-5 w-32 text-center font-bold text-slate-800">Tiếp nhận</th>
                <th className="py-3.5 px-4 sm:px-5 w-28 text-right font-bold text-slate-800">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh sách thông báo nội bộ...
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy văn bản nội bộ nào.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const isRead = doc.internalAudiences?.some((a: any) => a.userId === currentUser?.id && a.isRead);

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Trích yếu */}
                      <td className="py-4 px-4 sm:px-5 max-w-lg">
                        <div
                          onClick={() => setSelectedDoc(doc)}
                          className="font-bold text-slate-900 hover:text-[#1E60F3] cursor-pointer line-clamp-2"
                        >
                          {doc.title}
                        </div>
                        {doc.summary && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{doc.summary}</p>
                        )}
                      </td>

                      {/* Phạm vi */}
                      <td className="py-4 px-4 sm:px-5">
                        {doc.department ? (
                          <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
                            {doc.department.name}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                            Toàn thể cơ quan
                          </span>
                        )}
                      </td>

                      {/* Người đăng */}
                      <td className="py-4 px-4 sm:px-5 font-semibold text-slate-800">
                        {doc.creator?.fullName || '---'}
                      </td>

                      {/* Ngày đăng */}
                      <td className="py-4 px-4 sm:px-5 text-slate-600 font-medium">
                        {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Tiếp nhận trạng thái */}
                      <td className="py-4 px-4 sm:px-5 text-center">
                        {isRead ? (
                          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                            <Check className="h-3.5 w-3.5" />
                            <span>Đã xem</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConfirmRead(doc.id)}
                            className="inline-flex items-center space-x-1 rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-bold text-[#1E60F3] border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <span>Xác nhận đọc</span>
                          </button>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 sm:px-5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 bg-white text-xs text-slate-600">
          <div>
            Hiển thị <span className="font-bold text-slate-800">{documents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, documents.length)}</span> trong tổng số <span className="font-bold text-slate-800">{totalCount}</span> thông báo
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
        />
      )}

      {showCreateModal && (
        <CreateInternalModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchDocs}
        />
      )}

    </div>
  );
}
