'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSystemConfig } from '@/lib/system-config-context';
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
  X,
  FileSpreadsheet,
  Printer,
  FileText,
  FileDown,
} from 'lucide-react';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import {
  CreateIncomingModal,
  DirectiveModal,
  ForwardModal,
  ProgressModal,
} from '@/components/documents/IncomingActionModals';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function IncomingDocsPage() {
  const router = useRouter();
  const { currentUser, hasRole } = useAuth();
  const { config } = useSystemConfig();
  
  // Data state
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    overdue: 0,
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintListModal, setShowPrintListModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [directiveDoc, setDirectiveDoc] = useState<any>(null);
  const [forwardDoc, setForwardDoc] = useState<any>(null);
  const [progressDoc, setProgressDoc] = useState<any>(null);

  // Tải trực tiếp file PDF xuống máy tính với căn chỉnh tỷ lệ trang A4 chuẩn xác
  const handleDownloadPDF = async () => {
    const printElement = document.getElementById('printable-document-list-sheet');
    if (!printElement) return;

    try {
      setDownloadingPdf(true);

      const canvas = await html2canvas(printElement, {
        scale: 3, // Độ phân giải siêu nét (3x Retina quality)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const sheet = clonedDoc.getElementById('printable-document-list-sheet');
          if (sheet) {
            sheet.style.paddingBottom = '35px'; // Đảm bảo dòng footer có khoảng trống đệm dưới không bị cắt chữ
          }
        },
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297; // A4 Landscape width
      const pageHeight = 210; // A4 Landscape height
      const margin = 8; // Lề an toàn 8mm
      const maxW = pageWidth - margin * 2; // 281mm
      const maxH = pageHeight - margin * 2; // 194mm

      const canvasAspectRatio = canvas.width / canvas.height;
      let finalW = maxW;
      let finalH = maxW / canvasAspectRatio;

      // Đảm bảo chiều cao không vượt quá 1 trang A4 Landscape để không bị đứt trang
      if (finalH > maxH) {
        finalH = maxH;
        finalW = maxH * canvasAspectRatio;
      }

      // Căn giữa trang A4 Landscape
      const xPos = (pageWidth - finalW) / 2;
      const yPos = (pageHeight - finalH) / 2;

      pdf.addImage(imgData, 'PNG', xPos, yPos, finalW, finalH, undefined, 'FAST');
      pdf.save(`Danh_sach_van_ban_den_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Xử lý tiêu đề khi in danh sách để tránh tiêu đề mặc định của trình duyệt
  useEffect(() => {
    let originalTitle = '';
    const handleBeforePrint = () => {
      originalTitle = document.title;
      document.title = '';
    };
    const handleAfterPrint = () => {
      if (originalTitle) {
        document.title = originalTitle;
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const fetchControllerRef = React.useRef<AbortController | null>(null);

  const fetchDocuments = async () => {
    if (!currentUser) return;

    // Cancel any previous in-flight request immediately
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    const controller = new AbortController();
    fetchControllerRef.current = controller;

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

      const res = await fetch(`/api/documents/in?${params.toString()}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.stats) setStats(data.stats);
        if (data.senderOrgs) setSenderOrgsList(data.senderOrgs);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Instant filter change - no debounce for tab clicks, minimal debounce for typing
  useEffect(() => {
    setCurrentPage(1);
    const isTyping = search.length > 0;
    const delay = isTyping ? 200 : 0;
    const timer = setTimeout(() => {
      fetchDocuments();
    }, delay);

    return () => clearTimeout(timer);
  }, [currentUser, search, dateFrom, dateTo, statusFilter, urgencyFilter, senderOrgFilter, fieldFilter]);

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
    const orgName = config.adminInfo.orgName || 'CƠ QUAN / ĐƠN VỊ TIẾP NHẬN';
    const deptName = currentUser?.departmentName || 'BỘ PHẬN VĂN THƯ - LƯU TRỮ';
    const exportDateStr = new Date().toLocaleString('vi-VN');
    const exporterName = currentUser?.fullName || 'Người dùng hệ thống';

    // Tạo file Excel chuẩn định dạng XML/HTML mở được trực tiếp trên Excel với đầy đủ Tiếng Việt và định dạng bảng
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Danh sách văn bản đến</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; }
          table { border-collapse: collapse; width: 100%; }
          .org-title { font-size: 11pt; font-weight: bold; text-align: left; }
          .main-title { font-size: 16pt; font-weight: bold; text-align: center; color: #002060; }
          .meta-info { font-size: 10pt; font-style: italic; text-align: center; color: #333333; }
          th { background-color: #1E60F3; color: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 8px 4px; text-align: center; }
          td { border: 1px solid #000000; padding: 6px 4px; vertical-align: middle; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="11" class="org-title">${orgName.toUpperCase()}</td>
          </tr>
          <tr>
            <td colspan="11" style="font-weight: bold; text-align: left; font-size: 10pt;">${deptName.toUpperCase()}</td>
          </tr>
          <tr><td colspan="11" style="border:none;"></td></tr>
          <tr>
            <td colspan="11" class="main-title">DANH SÁCH VĂN BẢN ĐẾN</td>
          </tr>
          <tr>
            <td colspan="11" class="meta-info">Thời gian xuất: ${exportDateStr} | Người xuất: ${exporterName} | Tổng số: ${documents.length} văn bản</td>
          </tr>
          <tr><td colspan="11" style="border:none;"></td></tr>
          <thead>
            <tr>
              <th style="width: 45px;">STT</th>
              <th style="width: 120px;">Số đến / Ký hiệu</th>
              <th style="width: 320px;">Trích yếu nội dung</th>
              <th style="width: 180px;">Cơ quan / Nơi gửi</th>
              <th style="width: 100px;">Ngày đến</th>
              <th style="width: 100px;">Ngày ban hành</th>
              <th style="width: 90px;">Độ khẩn</th>
              <th style="width: 120px;">Trạng thái</th>
              <th style="width: 180px;">Phòng ban / Người chủ trì</th>
              <th style="width: 110px;">Hạn hoàn thành</th>
              <th style="width: 130px;">Thời gian hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            ${documents.map((d, index) => {
              const isOverdue = d.status === 'OVERDUE' || (d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'COMPLETED');
              let statusText = 'Đang xử lý';
              if (isOverdue) statusText = 'Quá hạn';
              else if (d.status === 'PENDING_DIRECTIVE' || d.status === 'DRAFT') statusText = 'Chờ chỉ đạo';
              else if (d.status === 'DIRECTED' || d.status === 'PENDING_PROCESSING') statusText = 'Chờ xử lý';
              else if (d.status === 'PROCESSING') statusText = 'Đang xử lý';
              else if (d.status === 'COMPLETED') statusText = 'Đã xử lý';

              const urgencyText = d.urgencyLevel === 'TOP_URGENT' ? 'Hỏa tốc' : d.urgencyLevel === 'URGENT' ? 'Khẩn' : 'Bình thường';
              const primary = d.assignees?.find((a: any) => a.roleType === 'PRIMARY');
              const assigneeText = primary?.department?.name 
                ? `${primary.department.name}${primary.user ? ` (${primary.user.fullName})` : ''}`
                : (d.assignees?.[0]?.user?.fullName || 'Chưa phân công');
              
              const completedTimeText = d.status === 'COMPLETED'
                ? (d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('vi-VN') : 'Đã hoàn thành')
                : 'Chưa hoàn thành';

              return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td class="bold text-center">${d.documentNumber || d.subNumber || '---'}</td>
                  <td>${d.title || ''}</td>
                  <td>${d.senderOrg || '---'}</td>
                  <td class="text-center">${d.arrivalDate ? new Date(d.arrivalDate).toLocaleDateString('vi-VN') : '---'}</td>
                  <td class="text-center">${d.issueDate ? new Date(d.issueDate).toLocaleDateString('vi-VN') : '---'}</td>
                  <td class="text-center">${urgencyText}</td>
                  <td class="text-center bold">${statusText}</td>
                  <td>${assigneeText}</td>
                  <td class="text-center">${d.dueDate ? new Date(d.dueDate).toLocaleDateString('vi-VN') : 'Không ghi hạn'}</td>
                  <td class="text-center">${completedTimeText}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh_sach_van_ban_den_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'TOP_URGENT':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-100">
            Hỏa tốc
          </span>
        );
      case 'URGENT':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-100">
            Khẩn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-100">
            Bình thường
          </span>
        );
    }
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue = status === 'OVERDUE' || (dueDate && new Date(dueDate) < new Date() && status !== 'COMPLETED');

    if (isOverdue) {
      return (
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-100">
          Quá hạn
        </span>
      );
    }

    switch (status) {
      case 'PENDING_DIRECTIVE':
      case 'DRAFT':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
            Chờ chỉ đạo
          </span>
        );
      case 'DIRECTED':
      case 'PENDING_PROCESSING':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
            Chờ xử lý
          </span>
        );
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
            Đang xử lý
          </span>
        );
      case 'COMPLETED':
      case 'PROCESSED':
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
            Đã xử lý
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
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  const paginatedDocs = documents.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <>
      <div className="w-full space-y-6 animate-in fade-in duration-200 print:hidden">
      
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

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 rounded-full border border-emerald-300 bg-emerald-50/80 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-sm transition-colors cursor-pointer"
            title="Xuất danh sách văn bản ra file Excel có định dạng chuẩn"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => setShowPrintListModal(true)}
            className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
            title="In hoặc Xuất danh sách văn bản định dạng PDF có đầy đủ Logo & Tiêu đề"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Xuất PDF / In</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Card 1: Tất cả văn bản */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/40 ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-[#1E60F3] border-transparent shadow-md shadow-blue-500/15'
              : 'border-blue-100/80 hover:border-blue-300/80 shadow-sm hover:shadow-md hover:shadow-blue-500/5'
          }`}
        >
          {/* Decorative Pattern & Glow */}
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-blue-400/15 blur-xl pointer-events-none group-hover:bg-blue-400/25 transition-all" />
          <Briefcase className="absolute -right-2 -bottom-2 h-14 w-14 text-blue-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
          
          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-[#1E60F3] tracking-wide">Tất cả văn bản</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</p>
            <p className="text-[11px] text-slate-500 font-medium">Trong tổng số</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-100/60">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Chờ xử lý */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 ${
            statusFilter === 'PENDING'
              ? 'ring-2 ring-amber-500 border-transparent shadow-md shadow-amber-500/15'
              : 'border-amber-100/80 hover:border-amber-300/80 shadow-sm hover:shadow-md hover:shadow-amber-500/5'
          }`}
        >
          {/* Decorative Pattern & Glow */}
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-amber-400/15 blur-xl pointer-events-none group-hover:bg-amber-400/25 transition-all" />
          <Clock className="absolute -right-2 -bottom-2 h-14 w-14 text-amber-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />

          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-amber-600 tracking-wide">Chờ xử lý</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.pending}</p>
            <p className="text-[11px] text-slate-500 font-medium">Văn bản</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25 ring-4 ring-amber-100/60">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Đang xử lý */}
        <div
          onClick={() => setStatusFilter('PROCESSING')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/40 ${
            statusFilter === 'PROCESSING'
              ? 'ring-2 ring-purple-500 border-transparent shadow-md shadow-purple-500/15'
              : 'border-purple-100/80 hover:border-purple-300/80 shadow-sm hover:shadow-md hover:shadow-purple-500/5'
          }`}
        >
          {/* Decorative Pattern & Glow */}
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-purple-400/15 blur-xl pointer-events-none group-hover:bg-purple-400/25 transition-all" />
          <Loader2 className="absolute -right-2 -bottom-2 h-14 w-14 text-purple-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />

          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-purple-600 tracking-wide">Đang xử lý</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.processing}</p>
            <p className="text-[11px] text-slate-500 font-medium">Văn bản</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md shadow-purple-500/25 ring-4 ring-purple-100/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </div>

        {/* Card 4: Đã xử lý */}
        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 ${
            statusFilter === 'COMPLETED'
              ? 'ring-2 ring-emerald-500 border-transparent shadow-md shadow-emerald-500/15'
              : 'border-emerald-100/80 hover:border-emerald-300/80 shadow-sm hover:shadow-md hover:shadow-emerald-500/5'
          }`}
        >
          {/* Decorative Pattern & Glow */}
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-emerald-400/15 blur-xl pointer-events-none group-hover:bg-emerald-400/25 transition-all" />
          <CheckCircle2 className="absolute -right-2 -bottom-2 h-14 w-14 text-emerald-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />

          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-emerald-600 tracking-wide">Đã xử lý</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.completed}</p>
            <p className="text-[11px] text-slate-500 font-medium">Văn bản</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-100/60">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Card 5: Quá hạn */}
        <div
          onClick={() => setStatusFilter('OVERDUE')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between bg-gradient-to-br from-rose-50/90 via-white to-red-50/40 ${
            statusFilter === 'OVERDUE'
              ? 'ring-2 ring-rose-500 border-transparent shadow-md shadow-rose-500/15'
              : 'border-rose-100/80 hover:border-rose-300/80 shadow-sm hover:shadow-md hover:shadow-rose-500/5'
          }`}
        >
          {/* Decorative Pattern & Glow */}
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-rose-400/15 blur-xl pointer-events-none group-hover:bg-rose-400/25 transition-all" />
          <AlertTriangle className="absolute -right-2 -bottom-2 h-14 w-14 text-rose-600/[0.07] pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />

          <div className="relative z-10 space-y-0.5">
            <p className="text-xs font-bold text-rose-600 tracking-wide">Quá hạn</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.overdue}</p>
            <p className="text-[11px] text-slate-500 font-medium">Văn bản</p>
          </div>
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 ring-4 ring-rose-100/60">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 3. Search and Filter Container (Single Row) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-wrap xl:flex-nowrap items-end gap-2.5 text-xs">
          
          {/* 1. Từ khóa */}
          <div className="flex-1 min-w-[180px]">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Từ khóa</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Số ký hiệu, trích yếu, nơi gửi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs focus:border-[#1E60F3] focus:outline-none placeholder:text-slate-400 shadow-sm"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  title="Xóa tìm kiếm"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Ngày đến Range */}
          <div className="w-auto min-w-[215px] flex-shrink-0">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Ngày đến</label>
            <div className="flex items-center space-x-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[102px] rounded-full border border-slate-200 px-2 py-2 text-[11px] focus:border-[#1E60F3] focus:outline-none shadow-sm text-slate-600"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[102px] rounded-full border border-slate-200 px-2 py-2 text-[11px] focus:border-[#1E60F3] focus:outline-none shadow-sm text-slate-600"
              />
            </div>
          </div>

          {/* 3. Trạng thái */}
          <div className="w-28 lg:w-32 flex-shrink-0">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm text-slate-700"
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING_DIRECTIVE">Chờ chỉ đạo</option>
              <option value="DIRECTED">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="COMPLETED">Đã xử lý</option>
              <option value="OVERDUE">Quá hạn</option>
            </select>
          </div>

          {/* 4. Độ khẩn */}
          <div className="w-28 lg:w-30 flex-shrink-0">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Độ khẩn</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm text-slate-700"
            >
              <option value="ALL">Tất cả</option>
              <option value="NORMAL">Bình thường</option>
              <option value="URGENT">Khẩn</option>
              <option value="TOP_URGENT">Hỏa tốc</option>
            </select>
          </div>

          {/* 5. Nơi gửi */}
          <div className="w-32 lg:w-36 flex-shrink-0">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Nơi gửi</label>
            <select
              value={senderOrgFilter}
              onChange={(e) => setSenderOrgFilter(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm text-slate-700 truncate"
            >
              <option value="ALL">Tất cả</option>
              {senderOrgsList.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Lĩnh vực */}
          <div className="w-32 lg:w-36 flex-shrink-0">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Lĩnh vực</label>
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm text-slate-700 truncate"
            >
              <option value="ALL">Tất cả</option>
              <option value="HANH_CHINH">Hành chính</option>
              <option value="TAI_CHINH">Tài chính</option>
              <option value="Y_TE">Y tế</option>
              <option value="CONG_NGHE">CNTT</option>
            </select>
          </div>

          {/* 7. Action Buttons */}
          <div className="flex items-center space-x-1.5 flex-shrink-0 pt-2 xl:pt-0">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Làm mới bộ lọc"
              className="flex items-center space-x-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => handleSearch()}
              className="flex items-center space-x-1.5 rounded-full bg-[#1E60F3] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer flex-shrink-0"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Tìm kiếm</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. Table Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-bold">
                <th className="py-3.5 px-4 sm:px-5 w-40 font-bold text-slate-800 whitespace-nowrap">Số ký hiệu</th>
                <th className="py-3.5 px-4 w-72 max-w-[280px] font-bold text-slate-800">Trích yếu</th>
                <th className="py-3.5 px-4 w-44 font-bold text-slate-800">Nơi gửi</th>
                <th className="py-3.5 px-4 w-36 font-bold text-slate-800 whitespace-nowrap">Ngày đến</th>
                <th className="py-3.5 px-4 w-36 font-bold text-slate-800 text-center whitespace-nowrap">Độ khẩn</th>
                <th className="py-3.5 px-4 w-40 font-bold text-slate-800 text-center whitespace-nowrap">Trạng thái</th>
                <th className="py-3.5 px-4 w-36 font-bold text-slate-800 whitespace-nowrap">Người xử lý</th>
                <th className="py-3.5 px-4 sm:pr-5 w-28 text-right font-bold text-slate-800 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Đang tải dữ liệu văn bản đến...</span>
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    Không tìm thấy văn bản đến nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const handlerName = doc.assignees?.[0]?.user?.fullName || doc.assignees?.[0]?.department?.name || '-';

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => router.push(`/van-ban-den/${doc.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Số ký hiệu */}
                      <td className="py-4 px-4 sm:px-5 font-bold text-[#1E60F3] whitespace-nowrap">
                        <span className="group-hover:underline">
                          {doc.documentNumber || doc.subNumber}
                        </span>
                      </td>

                      {/* Trích yếu */}
                      <td className="py-4 px-4 w-72 max-w-[280px] text-slate-800 leading-snug">
                        <div className="font-medium group-hover:text-[#1E60F3] transition-colors line-clamp-2">
                          {doc.title}
                        </div>
                      </td>

                      {/* Nơi gửi */}
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        <span className="line-clamp-2">{doc.senderOrg || '---'}</span>
                      </td>

                      {/* Ngày đến */}
                      <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {formatDateTime(doc.arrivalDate)}
                      </td>

                      {/* Độ khẩn */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {getUrgencyBadge(doc.urgencyLevel)}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(doc.status, doc.dueDate)}
                      </td>

                      {/* Người xử lý */}
                      <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {handlerName}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => router.push(`/van-ban-den/${doc.id}`)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
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
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                            title="Xử lý / Chuyển tiếp"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => router.push(`/van-ban-den/${doc.id}`)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem chi tiết"
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
            Hiển thị <span className="font-bold text-slate-800">{documents.length > 0 ? (validPage - 1) * pageSize + 1 : 0}</span> - <span className="font-bold text-slate-800">{Math.min(validPage * pageSize, documents.length)}</span> trong số <span className="font-bold text-slate-800">{documents.length}</span> văn bản {statusFilter !== 'ALL' && <span className="text-slate-400 font-normal">(Tổng toàn bộ: {stats.total})</span>}
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

      {/* MODAL / KHUNG XUẤT PDF & IN DANH SÁCH VĂN BẢN */}
      {showPrintListModal && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A4 landscape !important;
                margin: 0 !important;
              }
            }
          ` }} />
          <div className="printable-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:p-0 print:bg-white print:static">
            <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl print:max-h-none print:w-full print:max-w-none print:p-0 print:shadow-none print:rounded-none">
              
              {/* Modal Actions on screen (hidden in print) */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
                <div className="flex items-center space-x-2">
                  <Printer className="h-5 w-5 text-[#1E60F3]" />
                  <h3 className="text-base font-bold text-slate-900">Xem trước & Xuất PDF Danh sách Văn bản đến</h3>
                </div>
                <div className="flex items-center space-x-2.5">
                  {/* Nút 1: Tải xuống file PDF trực tiếp */}
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="flex items-center space-x-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 text-xs font-bold text-[#1E60F3] shadow-sm hover:bg-blue-100 disabled:opacity-50 transition-colors cursor-pointer"
                    title="Tải trực tiếp file PDF về máy"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#1E60F3]" />
                    ) : (
                      <FileDown className="h-4 w-4 text-[#1E60F3]" />
                    )}
                    <span>{downloadingPdf ? 'Đang tạo PDF...' : 'Tải xuống PDF'}</span>
                  </button>

                  {/* Nút 2: In danh sách */}
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all cursor-pointer"
                    title="In trực tiếp danh sách ra máy in"
                  >
                    <Printer className="h-4 w-4" />
                    <span>In danh sách</span>
                  </button>

                  {/* Nút Đóng */}
                  <button
                    onClick={() => setShowPrintListModal(false)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors ml-1"
                    title="Đóng cửa sổ xem trước"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Khung nội dung in chuẩn A4 (printable-document-sheet) */}
              <div id="printable-document-list-sheet" className="printable-document-sheet space-y-4 print:space-y-2 text-slate-900 bg-white pb-6 print:pb-4">
                
                {/* Header: Logo & Tên đơn vị (Trái) + Quốc hiệu & Tiêu ngữ (Phải) */}
                <div className="grid grid-cols-2 gap-4 pb-1 print:pb-0.5 items-end">
                  {/* Cột trái: Logo căn giữa ngay phía trên Tên cơ quan & Phòng ban */}
                  <div className="flex flex-col items-center text-center space-y-0.5">
                    <div className="mb-1 print:mb-0.5 flex items-center justify-center">
                      {config.adminInfo.logoUrl ? (
                        <img
                          src={config.adminInfo.logoUrl}
                          alt="Logo"
                          className="h-10 max-h-10 print:h-8 print:max-h-8 w-auto object-contain"
                        />
                      ) : (
                        <div
                          className="flex h-9 w-9 print:h-7 print:w-7 items-center justify-center rounded-xl text-white font-bold print:border print:border-black print:text-black print:bg-white"
                          style={{ backgroundColor: config.brandTheme.primaryColor || '#1E60F3' }}
                        >
                          <FileText className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs print:text-[11px] uppercase font-black text-slate-900 print:text-black leading-tight tracking-tight">
                      {config.adminInfo.orgName || 'CƠ QUAN / ĐƠN VỊ TIẾP NHẬN'}
                    </p>
                    <p className="text-[11px] print:text-[10px] font-bold text-slate-800 print:text-black uppercase leading-tight">
                      {currentUser?.departmentName || 'BỘ PHẬN VĂN THƯ - LƯU TRỮ'}
                    </p>
                  </div>

                  {/* Cột phải: Quốc hiệu & Tiêu ngữ */}
                  <div className="flex flex-col items-center text-center space-y-0.5">
                    <p className="text-xs print:text-[11px] uppercase font-black text-slate-950 print:text-black tracking-wide leading-tight">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="text-xs print:text-[11px] font-bold text-slate-900 print:text-black leading-tight">
                      Độc lập - Tự do - Hạnh phúc
                    </p>
                  </div>
                </div>

                {/* Tiêu đề danh sách */}
                <div className="text-center space-y-1 print:space-y-0.5 pt-3 pb-1 print:pt-1 print:pb-0.5">
                  <h2 className="text-base print:text-sm font-black text-slate-900 print:text-black uppercase tracking-wider">
                    DANH SÁCH VĂN BẢN ĐẾN
                  </h2>
                  <p className="text-xs print:text-[10.5px] italic text-slate-700 print:text-black font-semibold">
                    {dateFrom || dateTo ? (
                      <span>
                        (Từ ngày {dateFrom ? new Date(dateFrom).toLocaleDateString('vi-VN') : '---'} đến ngày {dateTo ? new Date(dateTo).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')})
                      </span>
                    ) : (
                      <span>
                        (Từ ngày 01/01/{new Date().getFullYear()} đến ngày {new Date().toLocaleDateString('vi-VN')})
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] print:text-[9.5px] italic text-slate-600 print:text-black">
                    Tổng số: <strong>{documents.length}</strong> văn bản • Ngày kết xuất: <strong>{new Date().toLocaleDateString('vi-VN')}</strong>
                  </p>
                </div>

                {/* Bảng dữ liệu in sắc nét */}
                <div className="border border-slate-300 print:border-black rounded-lg overflow-hidden text-[11px] print:text-[9px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-200 border-b border-slate-300 print:border-black">
                        <th className="p-2 print:py-1 print:px-1 text-center font-bold border-r border-slate-300 print:border-black w-[4%]">STT</th>
                        <th className="p-2 print:py-1 print:px-1 text-center font-bold border-r border-slate-300 print:border-black w-[11%]">Số đến/Ký hiệu</th>
                        <th className="p-2 print:py-1 print:px-1.5 text-left font-bold border-r border-slate-300 print:border-black w-[28%]">Trích yếu nội dung</th>
                        <th className="p-2 print:py-1 print:px-1 text-left font-bold border-r border-slate-300 print:border-black w-[13%]">Nơi gửi</th>
                        <th className="p-2 print:py-1 print:px-1 text-center font-bold border-r border-slate-300 print:border-black w-[8%]">Ngày đến</th>
                        <th className="p-2 print:py-1 print:px-1 text-center font-bold border-r border-slate-300 print:border-black w-[7%]">Độ khẩn</th>
                        <th className="p-2 print:py-1 print:px-1 text-center font-bold border-r border-slate-300 print:border-black w-[9%]">Trạng thái</th>
                        <th className="p-2 print:py-1 print:px-1 text-left font-bold border-r border-slate-300 print:border-black w-[11%]">Đơn vị / Người xử lý</th>
                        <th className="p-2 print:py-1 print:px-1 text-center font-bold border-r border-slate-300 print:border-black w-[8%]">Hạn xử lý</th>
                        <th className="p-2 print:py-1 print:px-1 text-center font-bold w-[9%]">Ngày hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((d, idx) => {
                        const isOverdue = d.status === 'OVERDUE' || (d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'COMPLETED');
                        let statusText = 'Đang xử lý';
                        if (isOverdue) statusText = 'Quá hạn';
                        else if (d.status === 'PENDING_DIRECTIVE' || d.status === 'DRAFT') statusText = 'Chờ chỉ đạo';
                        else if (d.status === 'DIRECTED' || d.status === 'PENDING_PROCESSING') statusText = 'Chờ xử lý';
                        else if (d.status === 'PROCESSING') statusText = 'Đang xử lý';
                        else if (d.status === 'COMPLETED') statusText = 'Đã xử lý';

                        const urgencyText = d.urgencyLevel === 'TOP_URGENT' ? 'Hỏa tốc' : d.urgencyLevel === 'URGENT' ? 'Khẩn' : 'Bình thường';
                        const primary = d.assignees?.find((a: any) => a.roleType === 'PRIMARY');
                        const assigneeText = primary?.department?.name 
                          ? `${primary.department.name}${primary.user ? ` (${primary.user.fullName})` : ''}`
                          : (d.assignees?.[0]?.user?.fullName || '-');

                        const completedText = d.status === 'COMPLETED'
                          ? (d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('vi-VN') : 'Đã hoàn thành')
                          : '---';

                        return (
                          <tr key={d.id || idx} className="border-b border-slate-300 print:border-black">
                            <td className="p-2 print:py-1 print:px-1 text-center border-r border-slate-300 print:border-black">{idx + 1}</td>
                            <td className="p-2 print:py-1 print:px-1 text-center font-bold border-r border-slate-300 print:border-black">{d.documentNumber || d.subNumber || '---'}</td>
                            <td className="p-2 print:py-1 print:px-1.5 border-r border-slate-300 print:border-black">{d.title}</td>
                            <td className="p-2 print:py-1 print:px-1 border-r border-slate-300 print:border-black">{d.senderOrg || '---'}</td>
                            <td className="p-2 print:py-1 print:px-1 text-center border-r border-slate-300 print:border-black">{d.arrivalDate ? new Date(d.arrivalDate).toLocaleDateString('vi-VN') : '---'}</td>
                            <td className="p-2 print:py-1 print:px-1 text-center border-r border-slate-300 print:border-black">{urgencyText}</td>
                            <td className="p-2 print:py-1 print:px-1 text-center font-semibold border-r border-slate-300 print:border-black">{statusText}</td>
                            <td className="p-2 print:py-1 print:px-1 border-r border-slate-300 print:border-black">{assigneeText}</td>
                            <td className="p-2 print:py-1 print:px-1 text-center border-r border-slate-300 print:border-black">{d.dueDate ? new Date(d.dueDate).toLocaleDateString('vi-VN') : '---'}</td>
                            <td className="p-2 print:py-1 print:px-1 text-center">{completedText}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              {/* Khung chữ ký */}
              <div className="printable-signature-block pt-4 print:pt-2 grid grid-cols-2 text-center text-xs print:text-[10px]">
                <div className="space-y-8 print:space-y-5">
                  <div>
                    <p className="text-[11px] print:text-[9.5px] italic text-slate-600 print:text-slate-700 leading-normal">
                      Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </p>
                    <p className="font-bold text-slate-900 print:text-black uppercase mt-0.5">
                      NGƯỜI LẬP DANH SÁCH
                    </p>
                    <p className="text-[11px] print:text-[9.5px] italic text-slate-500 print:text-slate-600">
                      (Ký và ghi rõ họ tên)
                    </p>
                  </div>
                  <p className="font-bold text-slate-900 print:text-black text-xs print:text-[10px]">
                    {currentUser?.fullName || 'Người lập biểu'}
                  </p>
                </div>

                <div className="space-y-8 print:space-y-5">
                  <div>
                    <p className="text-[11px] print:text-[9.5px] italic text-slate-600 print:text-slate-700 leading-normal">
                      Ngày ..... tháng ..... năm 20...
                    </p>
                    <p className="font-bold text-slate-900 print:text-black uppercase mt-0.5">
                      THỦ TRƯỞNG ĐƠN VỊ
                    </p>
                    <p className="text-[11px] print:text-[9.5px] italic text-slate-500 print:text-slate-600">
                      (Ký và ghi rõ họ tên)
                    </p>
                  </div>
                  <p className="font-bold text-slate-900 print:text-black text-xs print:text-[10px]">
                    {config.adminInfo.leaderName || 'Lãnh đạo đơn vị'}
                  </p>
                </div>
              </div>

              {/* Chân trang cố định: Bên trái là tên phần mềm, bên phải là Thời gian in | Người in */}
              <div className="printable-document-footer pt-3 mt-4 pb-2.5 print:pt-1.5 print:mt-2 border-t border-dashed border-slate-300 flex justify-between items-center text-[10px] print:text-[8.5px] text-slate-500 print:text-black italic">
                <span>
                  {config.softwareInfo.softwareName
                    ? `${config.softwareInfo.slogan || 'Hệ thống Quản lý Văn bản và Điều hành Công việc'} (${config.softwareInfo.softwareName})`
                    : 'Hệ thống Quản lý Văn bản và Điều hành Công việc (e-Office DMS)'}
                </span>
                <span>
                  Thời gian in: <strong>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date().toLocaleDateString('vi-VN')}</strong> | Người in: <strong>{currentUser?.fullName || 'Người dùng hệ thống'}</strong>
                </span>
              </div>

            </div>
          </div>
        </div>
        </>
      )}

      {/* End of modals */}
    </>
  );
}
