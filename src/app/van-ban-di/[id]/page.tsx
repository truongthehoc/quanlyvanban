'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
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
  Stamp,
} from 'lucide-react';
import { IssueAndNumberModal } from '@/components/documents/OutgoingActionModals';

export default function OutgoingDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, hasRole } = useAuth();
  const documentId = params?.id as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'timeline' | 'print'>('overview');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

      if (!saveRes.ok) throw new Error('Không thể lưu tệp đính kèm');
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
        throw new Error('Không thể tải thông tin văn bản đi');
      }
      const data = await res.json();
      setDocument(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tải chi tiết văn bản đi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const handleApproveDraft = async () => {
    if (!currentUser || !document) return;
    if (!confirm('Bạn có chắc chắn đồng ý ký duyệt dự thảo văn bản này?')) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/documents/${document.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'APPROVE_OUTGOING',
          actorId: currentUser.id,
          data: {},
        }),
      });
      if (res.ok) {
        fetchDocument();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#1E60F3]" />
        <p className="text-sm font-semibold text-slate-500">Đang tải chi tiết văn bản đi...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4 my-12">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-rose-900">Không tìm thấy văn bản đi</h2>
        <p className="text-xs text-rose-700">{error || 'Văn bản không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        <button
          onClick={() => router.push('/van-ban-di')}
          className="inline-flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Dự thảo</span>;
      case 'PENDING_DIRECTIVE':
        return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">Chờ Lãnh đạo ký duyệt</span>;
      case 'APPROVED':
        return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">Đã duyệt (Chờ cấp số phát hành)</span>;
      case 'ISSUED':
        return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">✓ Đã phát hành chính thức</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{status}</span>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN');
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

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Link href="/van-ban-di" className="hover:text-[#1E60F3] transition-colors flex items-center space-x-1">
              <span>Văn bản đi</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">Chi tiết dự thảo / văn bản đi</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[#1E60F3] font-bold">{document.documentNumber || '(Dự thảo chưa cấp số)'}</span>
          </div>
          <div className="flex items-center space-x-3 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {document.documentNumber || '(Dự thảo văn bản đi)'}
            </h1>
            {getStatusBadge(document.status)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push('/van-ban-di')}
            className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
            <span>Quay lại</span>
          </button>

          {/* Lãnh đạo phê duyệt */}
          {(hasRole('LEADER') || hasRole('ADMIN')) && document.status === 'PENDING_DIRECTIVE' && (
            <button
              onClick={handleApproveDraft}
              disabled={isApproving}
              className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>{isApproving ? 'Đang duyệt...' : 'Phê duyệt & Ký văn bản'}</span>
            </button>
          )}

          {/* Văn thư cấp số & phát hành */}
          {(hasRole('CLERK') || hasRole('ADMIN')) && document.status === 'APPROVED' && (
            <button
              onClick={() => setShowIssueModal(true)}
              className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              <Stamp className="h-3.5 w-3.5" />
              <span>Cấp số & Phát hành chính thức</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('print');
              setTimeout(() => window.print(), 200);
            }}
            className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>In văn bản</span>
          </button>
        </div>

      </div>

      {/* 2. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Title Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <div>
              <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#1E60F3] uppercase tracking-wider mb-2">
                {document.documentType?.name || 'Văn bản đi'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {document.title}
              </h2>
              {document.summary && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-800 font-semibold">Trích yếu tóm tắt: </strong>
                  {document.summary}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Nơi nhận</span>
                <span className="font-bold text-slate-800 block truncate mt-0.5" title={document.recipientOrg}>
                  {document.recipientOrg || '---'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Đơn vị soạn thảo</span>
                <span className="font-bold text-slate-800 block mt-0.5 truncate">{document.department?.name || '---'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Người soạn</span>
                <span className="font-bold text-slate-800 block mt-0.5">{document.creator?.fullName || '---'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Phương thức gửi</span>
                <span className="font-bold text-slate-800 block mt-0.5 truncate">{document.dispatchMethod || 'Điện tử & Bưu điện'}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-6 text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-[#1E60F3] text-[#1E60F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Thông tin văn bản</span>
              </button>

              <button
                onClick={() => setActiveTab('files')}
                className={`py-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'files'
                    ? 'border-[#1E60F3] text-[#1E60F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Download className="h-4 w-4" />
                <span>Tệp dự thảo & Tài liệu ký</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-3 border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'border-[#1E60F3] text-[#1E60F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Quy trình ký duyệt & Phát hành</span>
              </button>
            </nav>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Số văn bản chính thức:</span>
                  <span className="font-bold text-[#1E60F3]">{document.documentNumber || 'Chưa cấp số'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Loại văn bản:</span>
                  <span className="font-bold text-slate-800">{document.documentType?.name || '---'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Nơi nhận / Cơ quan tiếp nhận:</span>
                  <span className="font-bold text-slate-800">{document.recipientOrg || '---'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Ngày lập dự thảo:</span>
                  <span className="font-bold text-slate-800">{formatDate(document.createdAt)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Lãnh đạo ký duyệt:</span>
                  <span className="font-bold text-slate-800">{document.leader?.fullName || 'Chờ duyệt'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Ngày phát hành:</span>
                  <span className="font-bold text-slate-800">{document.issueDate ? formatDate(document.issueDate) : 'Chưa phát hành'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FILES */}
          {activeTab === 'files' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Download className="h-4 w-4 text-[#1E60F3]" />
                    <span>Danh mục tệp dự thảo đính kèm ({document.attachments?.length || 0})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Định dạng hỗ trợ: PDF, Word (DOC/DOCX), Excel, Ảnh</p>
                </div>

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
                        <span>+ Tải thêm tệp dự thảo</span>
                      </>
                    )}
                  </button>
                </div>
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
                  <p className="font-semibold text-xs text-slate-700">Chưa có tệp đính kèm nào được tải lên cho dự thảo này.</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFiles}
                    className="inline-flex items-center space-x-1.5 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs cursor-pointer"
                  >
                    <span>+ Nhấp để tải tệp dự thảo ngay</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                <History className="h-4 w-4 text-[#1E60F3]" />
                <span>Nhật ký luân chuyển & Ký duyệt</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {document.processingLogs && document.processingLogs.length > 0 ? (
                  document.processingLogs.map((log: any) => (
                    <div key={log.id} className="relative space-y-1 text-xs">
                      <div className="absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1E60F3] text-white text-[10px]">
                        ✓
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-slate-400">{formatDateTime(log.createdAt)}</span>
                      </div>
                      <p className="text-slate-600">Thực hiện: <strong>{log.actor?.fullName || 'Hệ thống'}</strong></p>
                      {log.notes && <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">{log.notes}</p>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">Chưa có nhật ký ký duyệt nào.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Thông tin phát hành
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trạng thái:</span>
                <div>{getStatusBadge(document.status)}</div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Đơn vị soạn:</span>
                <span className="font-bold text-slate-800">{document.department?.name || '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Văn thư phát hành:</span>
                <span className="font-bold text-slate-800">{document.clerk?.fullName || '---'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ISSUE MODAL */}
      {showIssueModal && (
        <IssueAndNumberModal
          document={document}
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => {
            setShowIssueModal(false);
            fetchDocument();
          }}
        />
      )}

    </div>
  );
}
