'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import {
  X,
  Stamp,
  Send,
  Sparkles,
  FileText,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  Inbox,
  UploadCloud,
  Paperclip,
  File,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

// ==========================================
// 1. MODAL SOẠN THẢO DỰ THẢO VĂN BẢN ĐI
// ==========================================
export function CreateOutgoingModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { currentUser } = useAuth();
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    recipientOrg: '',
    recipientOrgId: '',
    documentTypeId: '',
    urgencyLevel: 'NORMAL',
    confidentialityLevel: 'NORMAL',
    submitDirectlyToLeader: false,
    leaderId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch('/api/admin/doc-types').then((r) => r.json()),
      fetch('/api/admin/organizations').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
    ]).then(([typeData, orgData, userData]) => {
      setDocTypes(typeData.docTypes || []);
      setOrganizations(orgData || []);

      const leaderList = (userData.users || []).filter((u: any) =>
        u.roles?.some((r: any) => r.role?.code === 'LEADER' || r.role?.code === 'ADMIN')
      );
      setLeaders(leaderList);

      if (typeData.docTypes?.length > 0) {
        setFormData((prev) => ({ ...prev, documentTypeId: typeData.docTypes[0].id }));
      }
      if (orgData?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          recipientOrgId: orgData[0].id,
          recipientOrg: orgData[0].shortName || orgData[0].name,
        }));
      }
      if (leaderList.length > 0) {
        setFormData((prev) => ({ ...prev, leaderId: leaderList[0].id }));
      }
    });
  }, []);

  const handleOrgSelect = (orgId: string) => {
    if (orgId === 'CUSTOM') {
      setUseCustomRecipient(true);
      setFormData((prev) => ({ ...prev, recipientOrgId: '', recipientOrg: '' }));
    } else {
      setUseCustomRecipient(false);
      const selected = organizations.find((o) => o.id === orgId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          recipientOrgId: selected.id,
          recipientOrg: selected.shortName || selected.name,
        }));
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  const uploadFiles = async (fileList: File[]) => {
    setUploading(true);
    setError('');
    try {
      const uploadData = new FormData();
      fileList.forEach((file) => uploadData.append('files', file));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        const result = await res.json();
        setAttachments((prev) => [...prev, ...(result.files || [])]);
      } else {
        const err = await res.json();
        setError(err.error || 'Tải tệp lên thất bại.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải tệp lên máy chủ.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.recipientOrg) {
      setError('Vui lòng nhập trích yếu và nơi nhận văn bản.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/documents/out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          attachments,
          creatorId: currentUser?.id,
          departmentId: currentUser?.departmentId,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Có lỗi xảy ra.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 cursor-pointer"
      />

      {/* Right Slide-over (Widened) */}
      <div className="fixed inset-y-0 right-0 z-[101] flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-3xl lg:max-w-4xl xl:max-w-5xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right duration-300 ease-out">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/95 px-6 py-4 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3] font-bold shadow-sm ring-4 ring-blue-50/50">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Soạn thảo Dự thảo Văn bản Đi</h2>
                <p className="text-xs text-slate-500">Tạo văn bản đi, trình duyệt ký và chuẩn bị phát hành</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              title="Đóng bảng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body: 2-Column Grid */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 text-xs">
            {error && (
              <div className="mb-5 flex items-center space-x-2 rounded-xl bg-rose-50 p-3.5 text-rose-700 border border-rose-200 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: Metadata & Workflow (7/12) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Section 1: Trích yếu & Nơi nhận */}
                <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="h-3.5 w-3.5 text-[#1E60F3]" />
                    <span>1. Nội dung & Nơi nhận</span>
                  </h3>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Trích yếu nội dung văn bản <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Nhập đầy đủ trích yếu tóm tắt nội dung văn bản..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm leading-relaxed"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Loại văn bản <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        value={formData.documentTypeId}
                        onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm cursor-pointer"
                      >
                        {docTypes.map((dt) => (
                          <option key={dt.id} value={dt.id}>
                            {dt.name} ({dt.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">
                          Nơi nhận văn bản <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setUseCustomRecipient(!useCustomRecipient)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          {useCustomRecipient ? 'Chọn từ danh mục' : 'Nhập tự do'}
                        </button>
                      </div>

                      {!useCustomRecipient ? (
                        <select
                          value={formData.recipientOrgId}
                          onChange={(e) => handleOrgSelect(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm"
                        >
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name} ({org.shortName || org.code})
                            </option>
                          ))}
                          <option value="CUSTOM">+ Nhập nơi nhận khác...</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Nhập tên cơ quan / nơi nhận..."
                          value={formData.recipientOrg}
                          onChange={(e) => setFormData({ ...formData, recipientOrg: e.target.value, recipientOrgId: '' })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Thuộc tính quản lý */}
                <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Building2 className="h-3.5 w-3.5 text-[#1E60F3]" />
                    <span>2. Phân loại & Mức độ</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Độ khẩn</label>
                      <select
                        value={formData.urgencyLevel}
                        onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                      >
                        <option value="NORMAL">Bình thường</option>
                        <option value="URGENT">⚡ Khẩn</option>
                        <option value="TOP_URGENT">🔥 Hỏa tốc / Thượng khẩn</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Độ mật</label>
                      <select
                        value={formData.confidentialityLevel}
                        onChange={(e) => setFormData({ ...formData, confidentialityLevel: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                      >
                        <option value="NORMAL">Thường</option>
                        <option value="CONFIDENTIAL">Mật</option>
                        <option value="TOP_SECRET">Tuyệt mật</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Luồng trình duyệt */}
                <div className="space-y-3 rounded-2xl bg-blue-50/80 p-4 border border-blue-200/80">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="submitDirectlyToLeaderOut"
                      checked={formData.submitDirectlyToLeader}
                      onChange={(e) => setFormData({ ...formData, submitDirectlyToLeader: e.target.checked })}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="submitDirectlyToLeaderOut" className="font-semibold text-blue-900 cursor-pointer text-xs select-none">
                      Trình ngay lên Lãnh đạo phê duyệt ban hành sau khi lưu
                    </label>
                  </div>

                  {formData.submitDirectlyToLeader && (
                    <div className="pt-2 pl-7 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block font-bold text-slate-700 text-xs">
                        Chọn Lãnh đạo phê duyệt dự thảo: <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.leaderId}
                        onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#1E60F3] focus:outline-none shadow-sm cursor-pointer"
                      >
                        {leaders.length === 0 ? (
                          <option value="">Đang tải danh sách Lãnh đạo...</option>
                        ) : (
                          leaders.map((leader) => (
                            <option key={leader.id} value={leader.id}>
                              {leader.fullName} {leader.position ? `— ${leader.position}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: File đính kèm (5/12) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Section 4: File đính kèm */}
                <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                      <Paperclip className="h-3.5 w-3.5 text-[#1E60F3]" />
                      <span>4. Tệp dự thảo đính kèm ({attachments.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-[11px] font-bold text-[#1E60F3] hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <span>+ Chọn tệp</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.length > 0) {
                        uploadFiles(Array.from(e.dataTransfer.files));
                      }
                    }}
                    className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#1E60F3] bg-white p-6 text-center space-y-2.5 transition-all cursor-pointer group"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1E60F3]" />
                        <p className="text-xs font-semibold text-slate-600">Đang tải tệp lên máy chủ...</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3] group-hover:scale-110 transition-transform shadow-xs">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-xs">
                            Kéo thả tệp dự thảo vào đây
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">hoặc nhấp chuột để duyệt từ máy tính</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium pt-1">Hỗ trợ: PDF, Word (DOC/DOCX), Excel, Ảnh scan</p>
                      </>
                    )}
                  </div>

                  {/* Uploaded list */}
                  {attachments.length > 0 && (
                    <div className="space-y-2 pt-1 flex-1 overflow-y-auto max-h-[280px]">
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1E60F3] flex-shrink-0">
                              <File className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate" title={file.fileName}>
                                {file.fileName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {formatFileSize(file.fileSize)} • {file.fileType?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa tệp này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            <div className="h-2" />
          </form>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/95 px-6 py-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="flex items-center space-x-1.5 rounded-full bg-[#1E60F3] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Lưu dự thảo</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

// ==========================================
// 2. MODAL CẤP SỐ TỰ ĐỘNG & PHÁT HÀNH
// ==========================================
export function IssueAndNumberModal({
  document: doc,
  onClose,
  onSuccess,
}: {
  document: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { currentUser } = useAuth();
  const [dispatchMethod, setDispatchMethod] = useState('Bưu chính & Điện tử');
  const [recipientOrg, setRecipientOrg] = useState(doc.recipientOrg || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleIssue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'ISSUE_AND_NUMBER',
          actorId: currentUser?.id,
          data: {
            dispatchMethod,
            recipientOrg,
          },
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-sm">
              <Stamp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Cấp Số Tự Động & Phát Hành Văn Bản Đi</h2>
              <p className="text-[11px] text-slate-500">Hệ thống tự động sinh số theo quy chuẩn Sổ Văn Bản</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="rounded-2xl bg-blue-50/70 p-4 border border-blue-200 space-y-1.5">
            <div className="flex items-center space-x-2 text-blue-900 font-bold mb-1">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Quy tắc sinh số tự động (Numbering Engine)</span>
            </div>
            <p className="text-slate-600 text-xs">
              Mẫu số quy định: <span className="font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded-full border border-blue-200">{doc.documentType?.numberingPattern || '{STT}/{MA_LOAI}-{MA_DV}'}</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Hệ thống sẽ tự động khóa sổ trong transaction, lấy số tiếp theo và cập nhật vào Sổ văn bản đi năm {new Date().getFullYear()}.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Hình thức gửi văn bản <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              value={dispatchMethod}
              onChange={(e) => setDispatchMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
            >
              <option value="Bưu chính & Điện tử">Bưu chính & Điện tử (Hệ thống liên thông)</option>
              <option value="Chuyển phát bưu điện">Chuyển phát bưu điện (Đường thư)</option>
              <option value="Gửi thư điện tử Email">Gửi thư điện tử (Email công vụ)</option>
              <option value="Trao trực tiếp">Trao trực tiếp tại cơ quan</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nơi nhận xác nhận <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              value={recipientOrg}
              onChange={(e) => setRecipientOrg(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              required
            />
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3.5 text-emerald-800 text-[11px] border border-emerald-200 font-medium">
            ✓ Sau khi phát hành, người soạn thảo sẽ nhận được thông báo số văn bản chính thức.
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleIssue}
              disabled={loading}
              className="rounded-full bg-[#1E60F3] px-6 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              {loading ? 'Đang xử lý...' : 'Cấp số & Phát hành ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
