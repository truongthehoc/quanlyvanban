'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSystemConfig } from '@/lib/system-config-context';
import {
  ArrowLeft,
  FileText,
  Clock,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Send,
  ArrowRight,
  Shield,
  FileCheck,
  History,
  Download,
  Eye,
  Share2,
  Printer,
  FileDown,
  Loader2,
  Tag,
  BookOpen,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  QrCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  DirectiveModal,
  ForwardModal,
  ProgressModal,
} from '@/components/documents/IncomingActionModals';

export default function IncomingDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, hasRole } = useAuth();
  const { config } = useSystemConfig();
  const documentId = params?.id as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'assignment' | 'timeline' | 'print'>('overview');

  // Modals
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Xử lý tiêu đề in để loại bỏ dòng tiêu đề mặc định ở giữa của trình duyệt
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

  // File Upload in Tab
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Accept Assignment
  const [accepting, setAccepting] = useState(false);

  const handleAcceptAssignment = async () => {
    if (!currentUser || !documentId) return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'ACCEPT_ASSIGNMENT',
          actorId: currentUser.id,
          data: {
            departmentId: currentUser.departmentId,
          },
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Lỗi khi tiếp nhận xử lý');
      }
      fetchDocument();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tiếp nhận văn bản');
    } finally {
      setAccepting(false);
    }
  };

  const handleUploadDetailFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !documentId) return;

    setUploadingFiles(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Không thể tải tệp lên');
      const uploadData = await uploadRes.json();

      const saveRes = await fetch(`/api/documents/${documentId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: uploadData.files || [],
          uploaderId: currentUser?.id,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json();
        throw new Error(errorData.error || 'Không thể lưu tệp đính kèm');
      }
      const saveData = await saveRes.json();

      setDocument((prev: any) => ({
        ...prev,
        attachments: saveData.attachments || prev.attachments,
      }));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải tệp');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchDocument = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) {
        throw new Error('Không thể tải thông tin văn bản');
      }
      const data = await res.json();
      setDocument(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tải chi tiết văn bản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#1E60F3]" />
        <p className="text-sm font-semibold text-slate-500">Đang tải chi tiết văn bản...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4 my-12">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-rose-900">Không tìm thấy văn bản</h2>
        <p className="text-xs text-rose-700">{error || 'Văn bản không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        <button
          onClick={() => router.push('/van-ban-den')}
          className="inline-flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  const isCompleted = document.status === 'COMPLETED';
  const isOverdue =
    document.status === 'OVERDUE' ||
    (document.dueDate && new Date(document.dueDate) < new Date() && !isCompleted);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'TOP_URGENT':
        return (
          <span className="inline-flex items-center space-x-1 whitespace-nowrap rounded-full bg-rose-500 text-white px-3 py-1 text-xs font-bold shadow-sm">
            <span>🔥 HỎA TỐC</span>
          </span>
        );
      case 'URGENT':
        return (
          <span className="inline-flex items-center space-x-1 whitespace-nowrap rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold shadow-sm">
            <span>⚡ KHẨN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 whitespace-nowrap rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-semibold">
            <span>Bình thường</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    if (isOverdue) {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-800 px-3 py-1 text-xs font-bold border border-rose-200">
          ⚠️ Quá hạn
        </span>
      );
    }

    switch (status) {
      case 'PENDING_DIRECTIVE':
      case 'DRAFT':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold border border-amber-200">
            Chờ chỉ đạo
          </span>
        );
      case 'DIRECTED':
      case 'PENDING_PROCESSING':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold border border-blue-200">
            Chờ xử lý
          </span>
        );
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-800 px-3 py-1 text-xs font-bold border border-purple-200">
            Đang xử lý
          </span>
        );
      case 'COMPLETED':
      case 'PROCESSED':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold border border-emerald-200">
            ✓ Đã xử lý
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const primaryAssignee = document.assignees?.find((a: any) => a.roleType === 'PRIMARY');
  const coordinateAssignees = document.assignees?.filter((a: any) => a.roleType === 'COORDINATE') || [];

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Top Breadcrumb & Back Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 print:hidden">
        
        {/* Breadcrumb */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Link href="/van-ban-den" className="hover:text-[#1E60F3] transition-colors flex items-center space-x-1">
              <span>Văn bản đến</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">Chi tiết văn bản</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[#1E60F3] font-bold">{document.documentNumber || document.subNumber}</span>
          </div>
          <div className="flex items-center space-x-3 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {document.documentNumber || document.subNumber}
            </h1>
            {getUrgencyBadge(document.urgencyLevel)}
            {getStatusBadge(document.status)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push('/van-ban-den')}
            className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
            <span>Quay lại</span>
          </button>

          {/* Khi văn bản ĐÃ XỬ LÝ -> Khóa toàn bộ các nút thao tác nghiệp vụ */}
          {!isCompleted && (
            <>
              {/* Lãnh đạo cho ý kiến chỉ đạo */}
              {(hasRole('LEADER') || hasRole('ADMIN')) && (
                <button
                  onClick={() => setShowDirectiveModal(true)}
                  className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-700 transition-all cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Chỉ đạo xử lý</span>
                </button>
              )}

              {/* Văn thư cập nhật / điều chỉnh phòng ban/bộ phận xử lý (Chỉ hiển thị sau khi Lãnh đạo đã chỉ đạo) */}
              {(hasRole('CLERK') || hasRole('ADMIN')) && document.status !== 'PENDING_DIRECTIVE' && document.status !== 'DRAFT' && (
                <button
                  onClick={() => setShowForwardModal(true)}
                  className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Cập nhật phòng ban/bộ phận</span>
                </button>
              )}

              {/* Nơi xử lý bấm Tiếp nhận xử lý khi ở trạng thái Chờ xử lý */}
              {document.status === 'DIRECTED' && (
                <button
                  onClick={handleAcceptAssignment}
                  disabled={accepting}
                  className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {accepting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Tiếp nhận xử lý</span>
                </button>
              )}

              {/* Báo cáo tiến độ / Hoàn tất xử lý (Chỉ hiển thị khi đã được chỉ đạo / đang xử lý) */}
              {document.status !== 'PENDING_DIRECTIVE' && document.status !== 'DRAFT' && (
                <button
                  onClick={() => setShowProgressModal(true)}
                  className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-violet-700 transition-all cursor-pointer"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Báo cáo tiến độ / Hoàn tất</span>
                </button>
              )}
            </>
          )}

          {/* In phiếu xử lý */}
          <button
            onClick={() => {
              setActiveTab('print');
              setTimeout(() => window.print(), 200);
            }}
            className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>In phiếu</span>
          </button>
        </div>

      </div>

      {/* COMPLETED / LOCKED BANNER */}
      {isCompleted && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold flex-shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-xs">Văn bản đã xử lý xong (Đã đóng hồ sơ)</h4>
              <p className="text-[11px] text-emerald-700 font-medium">Hồ sơ đã được lưu trữ hoàn tất. Mọi thông tin đã được khóa và không thể chỉnh sửa hay cập nhật thêm.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-white px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-xs self-start sm:self-auto">
            ✓ Hồ sơ đã đóng
          </span>
        </div>
      )}

      {/* 2. Leader Directive Highlight Banner (If directed) */}
      {document.leaderDirective && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50/30 p-5 shadow-sm print:hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <Sparkles className="h-24 w-24 text-amber-700" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">
                  ★
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Ý kiến chỉ đạo của Lãnh đạo
                </h3>
                {document.leader && (
                  <span className="text-xs font-bold text-slate-700">
                    — {document.leader.fullName}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800 italic pl-8">
                &ldquo;{document.leaderDirective}&rdquo;
              </p>
            </div>

            {document.dueDate && (
              <div className="flex items-center space-x-2 rounded-xl bg-white/90 px-4 py-2.5 shadow-sm border border-amber-200/80 flex-shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
                <div className="text-xs">
                  <p className="text-slate-500 font-medium">Hạn hoàn thành:</p>
                  <p className="font-bold text-amber-700">{formatDate(document.dueDate)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        
        {/* Left / Main Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6 print:w-full print:p-0 print:m-0">
          
          {/* Main Title & Overview Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4 print:hidden">
            <div>
              <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1E60F3] uppercase tracking-wider mb-2">
                {document.documentType?.name || 'Văn bản hành chính'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {document.title}
              </h2>
              {document.summary && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-800 font-semibold">Tóm tắt: </strong>
                  {document.summary}
                </p>
              )}
            </div>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Nơi gửi</span>
                <span className="font-bold text-slate-800 block truncate mt-0.5" title={document.senderOrg}>
                  {document.senderOrg || '---'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Ngày ban hành</span>
                <span className="font-bold text-slate-800 block mt-0.5">{formatDate(document.issueDate)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Ngày tiếp nhận</span>
                <span className="font-bold text-slate-800 block mt-0.5">{formatDate(document.arrivalDate)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Sổ văn bản</span>
                <span className="font-bold text-slate-800 block mt-0.5 truncate">{document.book?.name || 'Sổ VB Đến'}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-200 print:hidden">
            <nav className="flex space-x-6 text-xs font-bold" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-[#1E60F3] text-[#1E60F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Thông tin chi tiết</span>
              </button>

              <button
                onClick={() => setActiveTab('files')}
                className={`py-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'files'
                    ? 'border-[#1E60F3] text-[#1E60F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Download className="h-4 w-4" />
                <span>Tệp đính kèm ({document.attachments?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('assignment')}
                className={`py-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'assignment'
                    ? 'border-[#1E60F3] text-[#1E60F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Phân công & Tiến độ ({document.assignees?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'border-[#1E60F3] text-[#1E60F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Nhật ký luân chuyển ({document.processingLogs?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('print')}
                className={`py-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'print'
                    ? 'border-[#1E60F3] text-[#1E60F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Printer className="h-4 w-4" />
                <span>Phiếu trình xử lý</span>
              </button>
            </nav>
          </div>

          {/* TAB 1: OVERVIEW METADATA */}
          {activeTab === 'overview' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                <Layers className="h-4 w-4 text-[#1E60F3]" />
                <span>Thuộc tính & Tham số văn bản</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Số ký hiệu gốc:</span>
                  <span className="font-bold text-slate-800">{document.documentNumber || '---'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Số đến nội bộ:</span>
                  <span className="font-bold text-[#1E60F3]">{document.subNumber || '---'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Cơ quan / Nơi gửi:</span>
                  <span className="font-bold text-slate-800 text-right">{document.senderOrg || '---'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Loại văn bản:</span>
                  <span className="font-bold text-slate-800">{document.documentType?.name || '---'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Độ khẩn:</span>
                  <span className="font-bold">{getUrgencyBadge(document.urgencyLevel)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Độ mật:</span>
                  <span className="font-bold text-slate-800">
                    {document.confidentialityLevel === 'TOP_SECRET' ? 'Tuyệt mật' : document.confidentialityLevel === 'CONFIDENTIAL' ? 'Mật' : 'Thường'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Ngày ký ban hành:</span>
                  <span className="font-bold text-slate-800">{formatDate(document.issueDate)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Ngày văn thư tiếp nhận:</span>
                  <span className="font-bold text-slate-800">{formatDateTime(document.arrivalDate)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Hạn hoàn thành xử lý:</span>
                  <span className={`font-bold ${isOverdue ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                    {document.dueDate ? formatDate(document.dueDate) : 'Không ghi hạn'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Cán bộ văn thư tiếp nhận:</span>
                  <span className="font-bold text-slate-800">{document.clerk?.fullName || 'Văn thư cơ quan'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FILES & ATTACHMENTS */}
          {activeTab === 'files' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Download className="h-4 w-4 text-[#1E60F3]" />
                    <span>Danh mục tệp đính kèm văn bản ({document.attachments?.length || 0})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Định dạng hỗ trợ: PDF, Word (DOC/DOCX), Excel, Ảnh</p>
                </div>
                
                {!isCompleted && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleUploadDetailFiles}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFiles}
                      className="flex items-center space-x-1.5 rounded-full bg-[#1E60F3] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {uploadingFiles ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Đang tải lên...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-3.5 w-3.5" />
                          <span>+ Tải thêm tệp đính kèm</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {document.attachments && document.attachments.length > 0 ? (
                <div className="space-y-3">
                  {document.attachments.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-[#1E60F3] font-bold flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate" title={file.fileName}>
                            {file.fileName}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Tệp văn bản'} • Định dạng: {file.fileType?.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem tệp</span>
                        </a>
                        <a
                          href={file.fileUrl}
                          download={file.fileName}
                          className="flex items-center space-x-1 rounded-full bg-[#1E60F3] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Tải về</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 space-y-3">
                  <FileText className="h-10 w-10 mx-auto text-slate-400" />
                  <p className="font-semibold text-xs text-slate-700">Chưa có tệp đính kèm nào được tải lên cho văn bản này.</p>
                  {!isCompleted && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFiles}
                      className="inline-flex items-center space-x-1.5 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs cursor-pointer"
                    >
                      <span>+ Nhấp để tải tệp đính kèm ngay</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSIGNMENTS & PROGRESS */}
          {activeTab === 'assignment' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-[#1E60F3]" />
                  <span>Phân công phòng ban/bộ phận & Cán bộ xử lý</span>
                </h3>
                {!isCompleted && (
                  <button
                    onClick={() => setShowProgressModal(true)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-[#1E60F3] hover:underline cursor-pointer"
                  >
                    <span>+ Cập nhật tiến độ xử lý</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Phòng ban/bộ phận chủ trì */}
                {primaryAssignee ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="rounded-full bg-[#1E60F3] px-2.5 py-0.5 text-[11px] font-bold text-white">
                          PHÒNG BAN/BỘ PHẬN CHỦ TRÌ
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {primaryAssignee.department?.name || 'Phòng ban/bộ phận chủ trì'}
                        </h4>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1E60F3] border border-blue-200 shadow-sm">
                        {primaryAssignee.status === 'COMPLETED' ? '✓ Đã xử lý xong' : 'Đang xử lý'}
                      </span>
                    </div>

                    {primaryAssignee.user && (
                      <p className="text-xs text-slate-600 pl-1">
                        Cán bộ thực hiện: <strong className="text-slate-800">{primaryAssignee.user.fullName}</strong>
                      </p>
                    )}

                    {primaryAssignee.notes && (
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-blue-100 mt-2">
                        <strong>Ghi chú tiến độ: </strong>
                        {primaryAssignee.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center text-xs">
                    Chưa phân công phòng ban/bộ phận chủ trì.
                  </div>
                )}

                {/* Phòng ban/bộ phận phối hợp */}
                {coordinateAssignees.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Phòng ban/bộ phận phối hợp thực hiện ({coordinateAssignees.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {coordinateAssignees.map((coord: any) => (
                        <div key={coord.id} className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/60 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{coord.department?.name || 'Phòng phối hợp'}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Phối hợp</span>
                          </div>
                          {coord.user && (
                            <p className="text-[11px] text-slate-600">
                              Người phối hợp: <span className="font-medium text-slate-800">{coord.user.fullName}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: WORKFLOW TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                <History className="h-4 w-4 text-[#1E60F3]" />
                <span>Nhật ký luân chuyển & Lịch sử xử lý văn bản</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {document.processingLogs && document.processingLogs.length > 0 ? (
                  document.processingLogs.map((log: any, idx: number) => (
                    <div key={log.id || idx} className="relative group">
                      <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#1E60F3] shadow-xs group-hover:scale-125 transition-transform" />
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                          <span className="font-bold text-slate-800">{log.action}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{formatDateTime(log.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Thực hiện bởi: <strong className="text-slate-700">{log.actor?.fullName || 'Người dùng'}</strong>
                        </p>
                        {log.notes && (
                          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 mt-1 italic">
                            "{log.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Chưa có nhật ký luân chuyển.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PRINT SUMMARY (PHIẾU TRÌNH GIẢI QUYẾT VĂN BẢN ĐẾN) */}
          {activeTab === 'print' && (
            <div className="printable-document-sheet rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm space-y-6 print:border-none print:shadow-none print:m-0 print:space-y-4">
              
              {/* Dòng định danh hệ thống nằm ở góc trên cùng bên phải */}
              <div className="flex justify-end w-full pb-1">
                <span className="text-[10px] text-slate-500 print:text-black italic font-medium">
                  {config.softwareInfo.softwareName
                    ? `${config.softwareInfo.slogan || 'Hệ thống Quản lý Văn bản và Điều hành Công việc'} (${config.softwareInfo.softwareName})`
                    : 'Hệ thống Quản lý Văn bản và Điều hành Công việc (e-Office DMS)'}
                </span>
              </div>

              {/* Header: Logo & Tên đơn vị (Bên trái) + Quốc hiệu & Tiêu ngữ (Bên phải) */}
              <div className="grid grid-cols-2 gap-4 pb-2 items-end">
                {/* Cột trái: Logo căn giữa ngay phía trên Tên cơ quan & Phòng ban */}
                <div className="flex flex-col items-center text-center space-y-0.5">
                  <div className="mb-1.5 flex items-center justify-center">
                    {config.adminInfo.logoUrl ? (
                      <img
                        src={config.adminInfo.logoUrl}
                        alt="Logo"
                        className="h-12 w-auto max-h-12 object-contain"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold print:border print:border-black print:text-black print:bg-white"
                        style={{ backgroundColor: config.brandTheme.primaryColor || '#1E60F3' }}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs uppercase font-black text-slate-900 print:text-black leading-tight tracking-tight">
                    {config.adminInfo.orgName || 'CƠ QUAN / ĐƠN VỊ TIẾP NHẬN'}
                  </p>
                  <p className="text-[11px] font-bold text-slate-800 print:text-black uppercase leading-tight">
                    {currentUser?.departmentName || document.clerk?.department?.name || 'BỘ PHẬN VĂN THƯ - LƯU TRỮ'}
                  </p>
                </div>

                {/* Cột phải: Quốc hiệu & Tiêu ngữ (Ngang hàng với Tên cơ quan & Phòng ban - In đậm) */}
                <div className="flex flex-col items-center text-center space-y-0.5">
                  <p className="text-xs uppercase font-black text-slate-950 print:text-black tracking-wide leading-tight">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="text-xs font-bold text-slate-900 print:text-black leading-tight">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                </div>
              </div>

              {/* Tiêu đề phiếu: Cách rộng rãi so với Header Quốc hiệu */}
              <div className="text-center space-y-1.5 pt-6 pb-2 print:pt-8 print:pb-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 print:text-black uppercase tracking-wider">
                  PHIẾU GIẢI QUYẾT VĂN BẢN ĐẾN
                </h2>
                <p className="text-xs italic text-slate-600 print:text-black">
                  Số đến nội bộ: <strong>{document.subNumber || '---'}</strong> • Số ký hiệu gốc: <strong>{document.documentNumber || '---'}</strong>
                </p>
              </div>

              {/* Bảng thông tin hành chính chính quy */}
              <div className="border border-slate-300 print:border-black rounded-lg overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-300 print:border-black">
                      <td className="w-1/4 p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black">
                        Cơ quan / Nơi gửi:
                      </td>
                      <td className="w-1/4 p-2.5 font-semibold text-slate-900 print:text-black border-r border-slate-300 print:border-black">
                        {document.senderOrg || '---'}
                      </td>
                      <td className="w-1/4 p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black">
                        Ngày đến:
                      </td>
                      <td className="w-1/4 p-2.5 font-semibold text-slate-900 print:text-black">
                        {formatDateTime(document.arrivalDate)}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300 print:border-black">
                      <td className="p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black">
                        Ngày ban hành:
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900 print:text-black border-r border-slate-300 print:border-black">
                        {formatDate(document.issueDate)}
                      </td>
                      <td className="p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black">
                        Độ khẩn / Độ mật:
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900 print:text-black">
                        {document.urgencyLevel === 'VERY_URGENT' ? 'Thượng khẩn' : document.urgencyLevel === 'URGENT' ? 'Khẩn' : 'Bình thường'} / {document.securityLevel === 'SECRET' ? 'Mật' : 'Thường'}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300 print:border-black">
                      <td className="p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black align-top">
                        Trích yếu nội dung:
                      </td>
                      <td colSpan={3} className="p-2.5 font-semibold text-slate-900 print:text-black leading-relaxed">
                        {document.title}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300 print:border-black">
                      <td className="p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black align-top">
                        Ý kiến chỉ đạo của Lãnh đạo:
                      </td>
                      <td colSpan={3} className="p-2.5 text-slate-900 print:text-black leading-relaxed">
                        {document.leaderDirective ? (
                          <span className="font-bold italic">"{document.leaderDirective}"</span>
                        ) : (
                          <span className="italic text-slate-400 print:text-slate-600">Chờ Lãnh đạo cho ý kiến chỉ đạo.</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300 print:border-black">
                      <td className="p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black">
                        Phòng ban/Bộ phận chủ trì:
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900 print:text-black border-r border-slate-300 print:border-black">
                        {primaryAssignee?.department?.name || 'Chưa phân công'}
                        {primaryAssignee?.user && ` (${primaryAssignee.user.fullName})`}
                      </td>
                      <td className="p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black">
                        Hạn hoàn thành:
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900 print:text-black">
                        {document.dueDate ? formatDate(document.dueDate) : 'Không ghi hạn'}
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50 print:bg-white text-slate-700 print:text-black border-r border-slate-300 print:border-black align-top">
                        Phòng ban/Bộ phận phối hợp:
                      </td>
                      <td colSpan={3} className="p-2.5 font-semibold text-slate-900 print:text-black">
                        {coordinateAssignees.length > 0
                          ? coordinateAssignees.map((c: any) => c.department?.name).filter(Boolean).join(', ')
                          : 'Không'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Chữ ký & Phê duyệt: Thời gian chính xác của tiếp nhận và duyệt chỉ đạo */}
              {(() => {
                // Ngày tiếp nhận
                const arrivalDateObj = document.arrivalDate
                  ? new Date(document.arrivalDate)
                  : (document.createdAt ? new Date(document.createdAt) : new Date());
                const formattedArrivalDate = `Ngày ${String(arrivalDateObj.getDate()).padStart(2, '0')} tháng ${String(arrivalDateObj.getMonth() + 1).padStart(2, '0')} năm ${arrivalDateObj.getFullYear()}`;

                // Ngày lãnh đạo phê duyệt chỉ đạo
                const directiveLog = document.processingLogs?.find(
                  (l: any) => l.action === 'CHO Ý KIẾN CHỈ ĐẠO' || l.action === 'CHỈ ĐẠO XỬ LÝ'
                );
                const dDate = directiveLog?.createdAt ? new Date(directiveLog.createdAt) : null;
                const formattedLeaderDate = dDate
                  ? `Ngày ${String(dDate.getDate()).padStart(2, '0')} tháng ${String(dDate.getMonth() + 1).padStart(2, '0')} năm ${dDate.getFullYear()}`
                  : 'Ngày ..... tháng ..... năm 20...';

                return (
                  <div className="pt-6 grid grid-cols-2 text-center text-xs print:pt-4">
                    {/* Cột trái: Nhân viên tiếp nhận */}
                    <div className="space-y-16 print:space-y-12">
                      <div>
                        <p className="text-[11px] italic text-slate-600 print:text-slate-700 leading-normal">
                          {formattedArrivalDate}
                        </p>
                        <p className="font-bold text-slate-900 print:text-black uppercase mt-0.5">
                          NHÂN VIÊN TIẾP NHẬN
                        </p>
                        <p className="text-[11px] italic text-slate-500 print:text-slate-600">
                          (Ký và ghi rõ họ tên)
                        </p>
                      </div>
                      <p className="font-bold text-slate-900 print:text-black text-xs">
                        {document.clerk?.fullName || currentUser?.fullName || 'Lê Thị Văn Thư'}
                      </p>
                    </div>

                    {/* Cột phải: Lãnh đạo phê duyệt */}
                    <div className="space-y-16 print:space-y-12">
                      <div>
                        <p className="text-[11px] italic text-slate-600 print:text-slate-700 leading-normal">
                          {formattedLeaderDate}
                        </p>
                        <p className="font-bold text-slate-900 print:text-black uppercase mt-0.5">
                          LÃNH ĐẠO PHÊ DUYỆT
                        </p>
                        <p className="text-[11px] italic text-slate-500 print:text-slate-600">
                          (Ký và ghi rõ họ tên)
                        </p>
                      </div>
                      <p className="font-bold text-slate-900 print:text-black text-xs">
                        {document.leader?.fullName || config.adminInfo.leaderName || 'Lãnh đạo đơn vị'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Footer bản in: Bên trái là tên phần mềm, bên phải là Thời gian in | Người in (Nằm ở đáy trang A4) */}
              <div className="printable-document-footer pt-4 mt-6 border-t border-dashed border-slate-300 flex justify-between items-center text-[10px] text-slate-500 print:text-black italic">
                <span>
                  {config.softwareInfo.softwareName
                    ? `${config.softwareInfo.slogan || 'Hệ thống Quản lý Văn bản và Điều hành Công việc'} (${config.softwareInfo.softwareName})`
                    : 'Hệ thống Quản lý Văn bản và Điều hành Công việc (e-Office DMS)'}
                </span>
                <span>
                  Thời gian in: <strong>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date().toLocaleDateString('vi-VN')}</strong> | Người in: <strong>{currentUser?.fullName || 'Người dùng hệ thống'}</strong>
                </span>
              </div>

              {/* Nút in chỉ hiển thị trên màn hình */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 rounded-full bg-[#1E60F3] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>In phiếu ngay</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right / Sidebar Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          
          {/* Status & Timing Box */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Trạng thái & Tiến độ
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tình trạng:</span>
                <div>{getStatusBadge(document.status)}</div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mức độ khẩn:</span>
                <div>{getUrgencyBadge(document.urgencyLevel)}</div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Hạn giải quyết:</span>
                <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                  {document.dueDate ? formatDate(document.dueDate) : 'Không ghi'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Thao tác xử lý nhanh
            </h3>

            <div className="space-y-2">
              {isCompleted ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-800">✓ Đã xử lý xong</p>
                  <p className="text-[11px] text-emerald-600">Hồ sơ đã đóng và không thể chỉnh sửa.</p>
                </div>
              ) : (
                <>
                  {(hasRole('LEADER') || hasRole('ADMIN')) && (
                    <button
                      onClick={() => setShowDirectiveModal(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center space-x-2">
                        <FileCheck className="h-4 w-4 text-amber-600" />
                        <span>Chỉ đạo xử lý</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
                    </button>
                  )}

                  {/* Văn thư cập nhật phòng ban: chỉ hiển thị sau khi đã có chỉ đạo của lãnh đạo */}
                  {(hasRole('CLERK') || hasRole('ADMIN')) && document.status !== 'PENDING_DIRECTIVE' && document.status !== 'DRAFT' && (
                    <button
                      onClick={() => setShowForwardModal(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center space-x-2">
                        <Send className="h-4 w-4 text-blue-600" />
                        <span>Cập nhật phòng ban/bộ phận</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
                    </button>
                  )}

                  {document.status === 'DIRECTED' && (
                    <button
                      onClick={handleAcceptAssignment}
                      disabled={accepting}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 text-teal-900 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center space-x-2">
                        {accepting ? <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> : <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                        <span>Tiếp nhận xử lý</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-teal-500" />
                    </button>
                  )}

                  {document.status !== 'PENDING_DIRECTIVE' && document.status !== 'DRAFT' && (
                    <button
                      onClick={() => setShowProgressModal(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-900 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <span className="flex items-center space-x-2">
                        <History className="h-4 w-4 text-purple-600" />
                        <span>Báo cáo tiến độ / Hoàn tất</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-purple-500" />
                    </button>
                  )}

                  {/* Thông báo trạng thái đang chờ lãnh đạo chỉ đạo */}
                  {document.status === 'PENDING_DIRECTIVE' && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <p className="font-bold flex items-center space-x-1.5">
                        <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span>Đang chờ Lãnh đạo chỉ đạo</span>
                      </p>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        Văn bản vừa được tiếp nhận. Sau khi Lãnh đạo đưa ra chỉ đạo giao việc, Văn thư và Phòng ban xử lý mới có thể thực hiện các bước tiếp theo.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Digital Verification & Stamp Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm space-y-3 text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-blue-100 text-[#1E60F3]">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Xác thực số e-Office DMS</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Mã định danh văn bản số hợp lệ</p>
            </div>
            <div className="font-mono text-[10px] bg-slate-100 p-2 rounded-lg text-slate-600 break-all select-all">
              {document.id}
            </div>
          </div>

        </div>

      </div>

      {/* MODALS */}
      {showDirectiveModal && (
        <DirectiveModal
          document={document}
          onClose={() => setShowDirectiveModal(false)}
          onSuccess={() => {
            setShowDirectiveModal(false);
            fetchDocument();
          }}
        />
      )}

      {showForwardModal && (
        <ForwardModal
          document={document}
          onClose={() => setShowForwardModal(false)}
          onSuccess={() => {
            setShowForwardModal(false);
            fetchDocument();
          }}
        />
      )}

      {showProgressModal && (
        <ProgressModal
          document={document}
          onClose={() => setShowProgressModal(false)}
          onSuccess={() => {
            setShowProgressModal(false);
            fetchDocument();
          }}
        />
      )}

    </div>
  );
}
