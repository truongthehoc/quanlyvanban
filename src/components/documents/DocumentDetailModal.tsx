'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import {
  X,
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
  Stamp,
  Download,
  Eye,
  Share2,
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: any;
  onClose: () => void;
  onRefresh: () => void;
  onOpenDirectiveModal?: (doc: any) => void;
  onOpenForwardModal?: (doc: any) => void;
  onOpenProgressModal?: (doc: any) => void;
  onOpenIssueModal?: (doc: any) => void;
}

export default function DocumentDetailModal({
  document: doc,
  onClose,
  onRefresh,
  onOpenDirectiveModal,
  onOpenForwardModal,
  onOpenProgressModal,
  onOpenIssueModal,
}: DocumentDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const { currentUser, hasRole, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'directive' | 'history'>('preview');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!doc || !mounted) return null;

  // Helpers
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'TOP_URGENT':
        return <span className="rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200">🔥 HỎA TỐC</span>;
      case 'URGENT':
        return <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">⚡ KHẨN</span>;
      default:
        return <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Thường</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">Dự thảo</span>;
      case 'PENDING_DIRECTIVE':
        return <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 animate-pulse-subtle">Chờ Lãnh đạo cho ý kiến</span>;
      case 'DIRECTED':
        return <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 border border-blue-200">Đã chỉ đạo (Chờ Văn thư chuyển)</span>;
      case 'PROCESSING':
        return <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800 border border-indigo-200">Đang xử lý</span>;
      case 'PENDING_APPROVAL':
        return <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Chờ duyệt ký</span>;
      case 'APPROVED':
        return <span className="rounded-md bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800">Đã duyệt (Chờ cấp số phát hành)</span>;
      case 'ISSUED':
        return <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">✓ Đã phát hành chính thức</span>;
      case 'COMPLETED':
        return <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">✓ Đã hoàn thành</span>;
      default:
        return <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{status}</span>;
    }
  };

  // Actions
  const handleApproveDraft = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'APPROVE_OUTGOING',
          actorId: currentUser.id,
          data: {},
        }),
      });
      if (res.ok) {
        onRefresh();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReadInternal = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CONFIRM_READ',
          actorId: currentUser.id,
          data: {},
        }),
      });
      if (res.ok) {
        onRefresh();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Box */}
      <div className="flex flex-col h-[90vh] w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-base">
                  {doc.documentNumber || `Số đến: ${doc.subNumber || 'Chưa vào sổ'}`}
                </span>
                {getUrgencyBadge(doc.urgencyLevel)}
                {getStatusBadge(doc.status)}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-xl">
                {doc.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Nội dung & Bản Scan / PDF</span>
          </button>

          {doc.documentTypeDoc === 'INCOMING' && (
            <button
              onClick={() => setActiveTab('directive')}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'directive'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              <span>Ý kiến chỉ đạo & Phân công</span>
              {doc.leaderDirective && (
                <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] text-blue-800">
                  Có chỉ đạo
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Nhật ký luân chuyển ({doc.processingLogs?.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          
          {/* TAB 1: Preview Administrative Document */}
          {activeTab === 'preview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Administrative Paper Document Mockup */}
              <div className="lg:col-span-2 document-paper p-8 rounded-xl relative">
                
                {/* Simulated Official Vietnam Header */}
                <div className="grid grid-cols-2 border-b border-slate-200 pb-6 mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {doc.senderOrg || 'CƠ QUAN BAN HÀNH'}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      Số: <span className="text-blue-700 font-bold">{doc.documentNumber || doc.subNumber || '...'}</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="text-xs font-semibold text-slate-700 underline decoration-slate-400">
                      Độc lập - Tự do - Hạnh phúc
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-2">
                      Ngày {doc.issueDate ? new Date(doc.issueDate).getDate() : '...'} tháng {doc.issueDate ? new Date(doc.issueDate).getMonth() + 1 : '...'} năm {doc.issueDate ? new Date(doc.issueDate).getFullYear() : '2026'}
                    </p>
                  </div>
                </div>

                {/* Title & Summary */}
                <div className="my-6">
                  <div className="text-center mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {doc.documentType?.name || 'VĂN BẢN ĐIỀU HÀNH'}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1 max-w-xl mx-auto leading-snug">
                      {doc.title}
                    </h2>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-700 space-y-3">
                    <p className="font-semibold text-slate-900">Trích yếu / Tóm tắt nội dung:</p>
                    <p className="whitespace-pre-line text-slate-700">
                      {doc.summary || 'Văn bản hướng dẫn thi hành các quy định về quản lý điều hành và thực hiện nhiệm vụ được giao theo thẩm quyền.'}
                    </p>
                  </div>
                </div>

                {/* Signature & Seal Area */}
                <div className="grid grid-cols-2 mt-12 pt-6 border-t border-slate-100 items-end">
                  <div className="text-[11px] text-slate-500">
                    <p className="font-bold text-slate-700">Nơi nhận:</p>
                    <p>- {doc.recipientOrg || 'Như trên'}</p>
                    <p>- Lưu: VT, {doc.department?.code || 'HC'}.</p>
                  </div>

                  <div className="text-center relative">
                    <p className="text-xs font-bold uppercase text-slate-800">
                      {doc.documentTypeDoc === 'OUTGOING' ? 'THẨM QUYỀN KÝ' : 'CƠ QUAN BAN HÀNH'}
                    </p>
                    <p className="text-xs font-medium text-slate-600 mb-8">(Đã ký số / Ký đóng dấu)</p>
                    
                    {/* Simulated Official Seal */}
                    {doc.status === 'ISSUED' && (
                      <div className="absolute right-6 -top-2 seal-badge px-3 py-1.5 rounded text-[11px] font-extrabold uppercase shadow-sm">
                        ★ ĐÃ PHÁT HÀNH ★
                      </div>
                    )}
                    
                    <p className="text-xs font-bold text-slate-900">
                      {doc.leader?.fullName || 'LÃNH ĐẠO ĐƠN VỊ'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Col: Metadata Sidebar */}
              <div className="space-y-4">
                
                {/* Meta details box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                    Thông tin văn bản
                  </h3>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Loại văn bản:</span>
                    <span className="font-semibold text-slate-800">{doc.documentType?.name || 'Công văn'}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Sổ đăng ký:</span>
                    <span className="font-semibold text-slate-800">{doc.book?.name || 'Sổ 2026'}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Đơn vị gửi/tạo:</span>
                    <span className="font-semibold text-slate-800">{doc.senderOrg || doc.department?.name || 'Cơ quan'}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Ngày ban hành:</span>
                    <span className="font-semibold text-slate-800">
                      {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString('vi-VN') : '---'}
                    </span>
                  </div>

                  {doc.arrivalDate && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Ngày tiếp nhận:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(doc.arrivalDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}

                  {doc.dueDate && (
                    <div className="flex justify-between py-1 border-b border-slate-50 bg-rose-50/50 px-2 rounded">
                      <span className="text-rose-700 font-semibold">Hạn xử lý:</span>
                      <span className="font-bold text-rose-800">
                        {new Date(doc.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Người nhập/tạo:</span>
                    <span className="font-semibold text-slate-800">{doc.creator?.fullName || 'Văn thư'}</span>
                  </div>
                </div>

                {/* Attachments Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Tệp đính kèm / Scan</span>
                    <span className="text-slate-400 font-normal">1 tệp</span>
                  </h3>
                  <div className="mt-3 flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-blue-50/40 transition-colors">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
                        PDF
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">Van_ban_dinh_kem_scan.pdf</p>
                        <p className="text-[10px] text-slate-500">1.4 MB • Bản scan màu có chữ ký</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 p-1">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Directive & Assignments */}
          {activeTab === 'directive' && (
            <div className="space-y-6">
              
              {/* Leader Directive Card */}
              <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1.5 bg-blue-600" />
                <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm mb-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <span>Ý kiến chỉ đạo của Lãnh đạo</span>
                </div>

                {doc.leaderDirective ? (
                  <div className="bg-blue-50/60 p-4 rounded-lg border border-blue-100 text-xs leading-relaxed text-slate-800">
                    <p className="font-bold text-blue-900 mb-1">
                      Lãnh đạo: {doc.leader?.fullName || 'Lãnh đạo cơ quan'}
                    </p>
                    <p className="text-sm font-medium text-slate-900 whitespace-pre-line">
                      "{doc.leaderDirective}"
                    </p>
                    {doc.dueDate && (
                      <p className="mt-2 text-xs font-semibold text-rose-700">
                        ⏰ Yêu cầu hoàn thành trước ngày: {new Date(doc.dueDate).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Chưa có ý kiến chỉ đạo từ Lãnh đạo.
                  </div>
                )}
              </div>

              {/* Assigned Departments & Officers */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-xs">
                <h3 className="font-bold text-slate-800 text-sm mb-4">
                  Danh sách đơn vị & cá nhân được phân công xử lý
                </h3>

                {doc.assignees && doc.assignees.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {doc.assignees.map((ass: any) => (
                      <div key={ass.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              ass.roleType === 'PRIMARY'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ass.roleType === 'PRIMARY' ? 'CHỦ TRÌ' : 'PHỐI HỢP'}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">
                              {ass.department?.name || 'Phòng ban'}
                            </p>
                            {ass.user && (
                              <p className="text-[11px] text-slate-500">
                                Người phụ trách: {ass.user.fullName} ({ass.user.position})
                              </p>
                            )}
                            {ass.notes && (
                              <p className="text-[11px] text-slate-600 italic mt-0.5">
                                Ghi chú: {ass.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              ass.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ass.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ass.status === 'COMPLETED' ? 'Đã hoàn thành' : ass.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Tiếp nhận'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa phân công đơn vị nào.</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: Audit Trail & Processing History */}
          {activeTab === 'history' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-xs">
              <h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center space-x-2">
                <History className="h-4 w-4 text-blue-600" />
                <span>Nhật ký Luân chuyển & Xử lý Văn bản (Audit Trail)</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {doc.processingLogs && doc.processingLogs.length > 0 ? (
                  doc.processingLogs.map((log: any, idx: number) => (
                    <div key={log.id || idx} className="relative group">
                      <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-sm" />
                      
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group-hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            {log.action}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Thực hiện bởi: <span className="font-semibold text-slate-700">{log.actor?.fullName}</span> ({log.actor?.position})
                        </p>

                        {log.notes && (
                          <div className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-full border border-slate-100">
                            {log.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Chưa có nhật ký ghi nhận.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions Toolbar */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            Đang thao tác với tư cách: <span className="font-bold text-slate-700">{currentUser?.fullName}</span> [{currentUser?.roles.join(', ')}]
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            {/* Close */}
            <button
              onClick={onClose}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Đóng
            </button>

            {/* ACTION 1: Lãnh đạo cho ý kiến chỉ đạo (Chỉ hiển thị cho Leader khi doc là INCOMING và PENDING_DIRECTIVE) */}
            {hasRole('LEADER') && doc.documentTypeDoc === 'INCOMING' && doc.status === 'PENDING_DIRECTIVE' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDirectiveModal?.(doc);
                }}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 flex items-center space-x-1.5"
              >
                <FileCheck className="h-4 w-4" />
                <span>Cho ý kiến chỉ đạo</span>
              </button>
            )}

            {/* ACTION 2: Văn thư chuyển tiếp văn bản (Chỉ hiển thị cho Văn thư khi doc là INCOMING và DIRECTED) */}
            {hasRole('CLERK') && doc.documentTypeDoc === 'INCOMING' && doc.status === 'DIRECTED' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenForwardModal?.(doc);
                }}
                className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20 flex items-center space-x-1.5"
              >
                <Send className="h-4 w-4" />
                <span>Vào sổ & Chuyển tiếp phòng ban</span>
              </button>
            )}

            {/* ACTION 3: Trưởng phòng / Chuyên viên cập nhật tiến độ (Khi INCOMING và PROCESSING) */}
            {(hasRole(['HEAD_DEPT', 'OFFICER'])) && doc.documentTypeDoc === 'INCOMING' && doc.status === 'PROCESSING' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenProgressModal?.(doc);
                }}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20 flex items-center space-x-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Báo cáo tiến độ / Hoàn thành</span>
              </button>
            )}

            {/* ACTION 4: Lãnh đạo phê duyệt dự thảo văn bản đi */}
            {hasRole('LEADER') && doc.documentTypeDoc === 'OUTGOING' && doc.status === 'PENDING_APPROVAL' && (
              <button
                onClick={handleApproveDraft}
                disabled={isSubmitting}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Stamp className="h-4 w-4" />
                <span>Ký duyệt ban hành</span>
              </button>
            )}

            {/* ACTION 5: Văn thư Cấp số tự động & Phát hành văn bản đi */}
            {hasRole('CLERK') && doc.documentTypeDoc === 'OUTGOING' && (doc.status === 'APPROVED' || doc.status === 'DRAFT') && (
              <button
                onClick={() => {
                  onClose();
                  onOpenIssueModal?.(doc);
                }}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Stamp className="h-4 w-4" />
                <span>Cấp số tự động & Phát hành</span>
              </button>
            )}

            {/* ACTION 6: Xác nhận đã đọc văn bản nội bộ */}
            {doc.documentTypeDoc === 'INTERNAL' && (
              <button
                onClick={handleConfirmReadInternal}
                disabled={isSubmitting}
                className="rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Xác nhận đã tiếp nhận</span>
              </button>
            )}

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
