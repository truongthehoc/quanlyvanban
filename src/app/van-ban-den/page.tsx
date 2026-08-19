'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Info,
  Download,
  Plus,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Eye,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Loader2,
} from 'lucide-react';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import {
  CreateIncomingModal,
  DirectiveModal,
  ForwardModal,
  ProgressModal,
} from '@/components/documents/IncomingActionModals';

export default function IncomingDocsPage() {
  const { currentUser, hasRole } = useAuth();
  
  // Data state
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 128,
    pending: 15,
    processing: 23,
    completed: 85,
    overdue: 5,
  });
  const [senderOrgsList, setSenderOrgsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [senderOrgFilter, setSenderOrgFilter] = useState('ALL');
  const [fieldFilter, setFieldFilter] = useState('ALL');
  const [isExpandedFilter, setIsExpandedFilter] = useState(false);

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [directiveDoc, setDirectiveDoc] = useState<any>(null);
  const [forwardDoc, setForwardDoc] = useState<any>(null);
  const [progressDoc, setProgressDoc] = useState<any>(null);

  const fetchDocuments = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        urgency: urgencyFilter,
        senderOrg: senderOrgFilter,
        dateFrom,
        dateTo,
        search,
        role: currentUser.roles[0],
        departmentId: currentUser.departmentId || '',
        userId: currentUser.id,
      });

      const res = await fetch(`/api/documents/in?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.senderOrgs) {
          setSenderOrgsList(data.senderOrgs);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentUser, statusFilter, urgencyFilter, senderOrgFilter]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchDocuments();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('ALL');
    setUrgencyFilter('ALL');
    setSenderOrgFilter('ALL');
    setFieldFilter('ALL');
    fetchDocuments();
  };

  const handleExportExcel = () => {
    const headers = ['Số ký hiệu', 'Trích yếu', 'Nơi gửi', 'Ngày đến', 'Độ khẩn', 'Trạng thái', 'Người xử lý'];
    const rows = documents.map((d) => [
      d.documentNumber || d.subNumber,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.senderOrg || ''}"`,
      d.arrivalDate ? new Date(d.arrivalDate).toLocaleDateString('vi-VN') : '',
      d.urgencyLevel,
      d.status,
      d.assignees?.[0]?.user?.fullName || '-',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh_sach_van_ban_den_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'TOP_URGENT':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-100">
            Hỏa tốc
          </span>
        );
      case 'URGENT':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-100">
            Khẩn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-100">
            Bình thường
          </span>
        );
    }
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue = status === 'OVERDUE' || (dueDate && new Date(dueDate) < new Date() && status !== 'COMPLETED');

    if (isOverdue) {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-100">
          Quá hạn
        </span>
      );
    }

    switch (status) {
      case 'PENDING_DIRECTIVE':
      case 'DRAFT':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
            Chờ xử lý
          </span>
        );
      case 'DIRECTED':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
            Đang xử lý
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
            Đã xử lý
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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const totalPages = Math.ceil(documents.length / pageSize) || 1;
  const paginatedDocs = documents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Area with Rounded Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Văn bản đến
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý, theo dõi và xử lý văn bản đến
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tiếp nhận văn bản</span>
          </button>
        </div>
      </div>

      {/* 2. Status Metric Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Card 1 */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'ALL' ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#1E60F3]">Tất cả văn bản</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.total}</p>
            <p className="text-xs text-slate-400 font-medium">Trong tổng số</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3]">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'PENDING' ? 'ring-2 ring-amber-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-amber-600">Chờ xử lý</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.pending}</p>
            <p className="text-xs text-slate-400 font-medium">Văn bản</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => setStatusFilter('PROCESSING')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'PROCESSING' ? 'ring-2 ring-purple-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-purple-600">Đang xử lý</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.processing}</p>
            <p className="text-xs text-slate-400 font-medium">Văn bản</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-emerald-600">Đã xử lý</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.completed}</p>
            <p className="text-xs text-slate-400 font-medium">Văn bản</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 5 */}
        <div
          onClick={() => setStatusFilter('OVERDUE')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            statusFilter === 'OVERDUE' ? 'ring-2 ring-rose-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-rose-600">Quá hạn</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.overdue}</p>
            <p className="text-xs text-slate-400 font-medium">Văn bản</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* 3. Search and Filter Container with Rounded Inputs */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
        
        {/* Row 1 Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          
          {/* Từ khóa */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Từ khóa</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo số ký hiệu, trích yếu, nơi gửi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs focus:border-[#1E60F3] focus:outline-none placeholder:text-slate-400 shadow-sm"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 cursor-pointer" onClick={() => handleSearch()} />
            </div>
          </div>

          {/* Ngày đến Range */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Ngày đến</label>
            <div className="flex items-center space-x-1.5">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-full border border-slate-200 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                />
              </div>
              <span className="text-slate-400">-</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-full border border-slate-200 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="COMPLETED">Đã xử lý</option>
              <option value="OVERDUE">Quá hạn</option>
            </select>
          </div>

          {/* Độ khẩn */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Độ khẩn</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="ALL">Tất cả</option>
              <option value="NORMAL">Bình thường</option>
              <option value="URGENT">Khẩn</option>
              <option value="TOP_URGENT">Hỏa tốc</option>
            </select>
          </div>

          {/* Nơi gửi */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Nơi gửi</label>
            <select
              value={senderOrgFilter}
              onChange={(e) => setSenderOrgFilter(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="ALL">Tất cả</option>
              {senderOrgsList.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Row 2 Filters & Search Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          
          {/* Lĩnh vực & Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="w-56 text-xs">
              <label className="block font-bold text-slate-700 mb-1.5">Lĩnh vực</label>
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm"
              >
                <option value="ALL">Tất cả</option>
                <option value="HANH_CHINH">Hành chính - Quản trị</option>
                <option value="TAI_CHINH">Kế hoạch - Tài chính</option>
                <option value="Y_TE">Y tế & Y tế dự phòng</option>
                <option value="CONG_NGHE">Công nghệ thông tin</option>
              </select>
            </div>

            <div className="flex items-end space-x-2 pt-6">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Làm mới</span>
              </button>

              <button
                type="button"
                onClick={() => handleSearch()}
                className="flex items-center space-x-1.5 rounded-full bg-[#1E60F3] px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Tìm kiếm</span>
              </button>
            </div>
          </div>

          {/* Mở rộng toggle */}
          <button
            onClick={() => setIsExpandedFilter(!isExpandedFilter)}
            className="flex items-center space-x-1 text-xs font-semibold text-[#1E60F3] hover:underline"
          >
            <span>Mở rộng</span>
            {isExpandedFilter ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

      </div>

      {/* 4. Table Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-bold">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={documents.length > 0 && selectedIds.length === documents.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded-full border-slate-300 text-[#1E60F3] focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 w-36 font-bold text-slate-800">Số ký hiệu</th>
                <th className="py-3.5 px-4 font-bold text-slate-800">Trích yếu</th>
                <th className="py-3.5 px-4 w-48 font-bold text-slate-800">Nơi gửi</th>
                <th className="py-3.5 px-4 w-36 font-bold text-slate-800">Ngày đến</th>
                <th className="py-3.5 px-4 w-28 font-bold text-slate-800">Độ khẩn</th>
                <th className="py-3.5 px-4 w-28 font-bold text-slate-800">Trạng thái</th>
                <th className="py-3.5 px-4 w-32 font-bold text-slate-800">Người xử lý</th>
                <th className="py-3.5 px-4 w-32 text-right font-bold text-slate-800">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Đang tải dữ liệu văn bản đến...</span>
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    Không tìm thấy văn bản đến nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const isChecked = selectedIds.includes(doc.id);
                  const handlerName = doc.assignees?.[0]?.user?.fullName || doc.assignees?.[0]?.department?.name || '-';

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-blue-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(doc.id)}
                          className="h-4 w-4 rounded-full border-slate-300 text-[#1E60F3] focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Số ký hiệu */}
                      <td className="py-4 px-4 font-bold text-[#1E60F3]">
                        <span
                          onClick={() => setSelectedDoc(doc)}
                          className="hover:underline cursor-pointer"
                        >
                          {doc.documentNumber || doc.subNumber}
                        </span>
                      </td>

                      {/* Trích yếu */}
                      <td className="py-4 px-4 max-w-md text-slate-800 leading-snug">
                        <div
                          onClick={() => setSelectedDoc(doc)}
                          className="font-medium hover:text-[#1E60F3] cursor-pointer line-clamp-2"
                        >
                          {doc.title}
                        </div>
                      </td>

                      {/* Nơi gửi */}
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        {doc.senderOrg || '---'}
                      </td>

                      {/* Ngày đến */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {formatDateTime(doc.arrivalDate)}
                      </td>

                      {/* Độ khẩn */}
                      <td className="py-4 px-4">
                        {getUrgencyBadge(doc.urgencyLevel)}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4">
                        {getStatusBadge(doc.status, doc.dueDate)}
                      </td>

                      {/* Người xử lý */}
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        {handlerName}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            title="Xem chi tiết văn bản"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (hasRole('LEADER') && doc.status === 'PENDING_DIRECTIVE') {
                                setDirectiveDoc(doc);
                              } else if (hasRole('CLERK') && doc.status === 'DIRECTED') {
                                setForwardDoc(doc);
                              } else {
                                setProgressDoc(doc);
                              }
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            title="Xử lý / Chuyển tiếp"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                            title="Tùy chọn khác"
                          >
                            <MoreHorizontal className="h-4 w-4" />
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

        {/* 5. Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 bg-white text-xs text-slate-600">
          <div>
            Hiển thị <span className="font-bold text-slate-800">{documents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, documents.length)}</span> trong tổng số <span className="font-bold text-slate-800">{stats.total}</span> văn bản
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 focus:border-[#1E60F3] focus:outline-none cursor-pointer"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
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

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODALS */}
      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onRefresh={fetchDocuments}
          onOpenDirectiveModal={(d) => setDirectiveDoc(d)}
          onOpenForwardModal={(d) => setForwardDoc(d)}
          onOpenProgressModal={(d) => setProgressDoc(d)}
        />
      )}

      {showCreateModal && (
        <CreateIncomingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchDocuments}
        />
      )}

      {directiveDoc && (
        <DirectiveModal
          document={directiveDoc}
          onClose={() => setDirectiveDoc(null)}
          onSuccess={fetchDocuments}
        />
      )}

      {forwardDoc && (
        <ForwardModal
          document={forwardDoc}
          onClose={() => setForwardDoc(null)}
          onSuccess={fetchDocuments}
        />
      )}

      {progressDoc && (
        <ProgressModal
          document={progressDoc}
          onClose={() => setProgressDoc(null)}
          onSuccess={fetchDocuments}
        />
      )}

    </div>
  );
}
