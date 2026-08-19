'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import {
  X,
  Send,
  FileCheck,
  CheckCircle2,
  Building2,
  Calendar,
  AlertCircle,
  Inbox,
  FileText,
  Loader2,
  UploadCloud,
  Paperclip,
  File,
  Trash2,
  UserCheck,
} from 'lucide-react';

// ==========================================
// 1. MODAL TIẾP NHẬN & NHẬP VĂN BẢN ĐẾN
// ==========================================
export function CreateIncomingModal({
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
  const [useCustomSender, setUseCustomSender] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    documentNumber: '',
    title: '',
    summary: '',
    senderOrg: '',
    senderOrgId: '',
    issueDate: new Date().toISOString().split('T')[0],
    arrivalDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    urgencyLevel: 'NORMAL',
    confidentialityLevel: 'NORMAL',
    documentTypeId: '',
    submitDirectlyToLeader: true,
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
          senderOrgId: orgData[0].id,
          senderOrg: orgData[0].shortName || orgData[0].name,
        }));
      }
      if (leaderList.length > 0) {
        setFormData((prev) => ({ ...prev, leaderId: leaderList[0].id }));
      }
    });
  }, []);

  const handleOrgSelect = (orgId: string) => {
    if (orgId === 'CUSTOM') {
      setUseCustomSender(true);
      setFormData((prev) => ({ ...prev, senderOrgId: '', senderOrg: '' }));
    } else {
      setUseCustomSender(false);
      const selected = organizations.find((o) => o.id === orgId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          senderOrgId: selected.id,
          senderOrg: selected.shortName || selected.name,
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
    if (!formData.title || !formData.senderOrg) {
      setError('Vui lòng điền đầy đủ Trích yếu và Cơ quan gửi.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/documents/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          attachments,
          creatorId: currentUser?.id,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Có lỗi xảy ra khi tạo văn bản.');
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
      {/* 1. Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 cursor-pointer"
      />

      {/* 2. Right-side Slide-Over Panel (Widened) */}
      <div className="fixed inset-y-0 right-0 z-[101] flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-3xl lg:max-w-4xl xl:max-w-5xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right duration-300 ease-out">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/95 px-6 py-4 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3] font-bold shadow-sm ring-4 ring-blue-50/50">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Tiếp nhận & Vào sổ Văn bản Đến</h2>
                <p className="text-xs text-slate-500">Đăng ký và số hóa thông tin văn bản đến từ cơ quan bên ngoài</p>
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

          {/* Body Form: 2-Column Grid */}
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
                
                {/* Section 1: Thông tin văn bản gốc */}
                <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="h-3.5 w-3.5 text-[#1E60F3]" />
                    <span>1. Thông tin văn bản gốc</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Số/Ký hiệu văn bản gốc <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 123/UBND-VP..."
                        value={formData.documentNumber}
                        onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">
                          Cơ quan gửi <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setUseCustomSender(!useCustomSender)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          {useCustomSender ? 'Chọn từ danh mục' : 'Nhập tự do'}
                        </button>
                      </div>

                      {!useCustomSender ? (
                        <select
                          value={formData.senderOrgId}
                          onChange={(e) => handleOrgSelect(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm"
                        >
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name} ({org.shortName || org.code})
                            </option>
                          ))}
                          <option value="CUSTOM">+ Nhập cơ quan khác...</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Nhập tên cơ quan gửi..."
                          value={formData.senderOrg}
                          onChange={(e) => setFormData({ ...formData, senderOrg: e.target.value, senderOrgId: '' })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                          required
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Trích yếu nội dung văn bản <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Nhập đầy đủ trích yếu tóm tắt nội dung của văn bản đến..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm leading-relaxed"
                      required
                    />
                  </div>
                </div>

                {/* Section 2: Phân loại & Mức độ */}
                <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Building2 className="h-3.5 w-3.5 text-[#1E60F3]" />
                    <span>2. Phân loại & Mức độ</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Loại văn bản</label>
                      <select
                        value={formData.documentTypeId}
                        onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                      >
                        {docTypes.map((dt) => (
                          <option key={dt.id} value={dt.id}>
                            {dt.name} ({dt.code})
                          </option>
                        ))}
                      </select>
                    </div>

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

                {/* Section 3: Mốc thời gian */}
                <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Calendar className="h-3.5 w-3.5 text-[#1E60F3]" />
                    <span>3. Thời gian & Hạn xử lý</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày ban hành</label>
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày tiếp nhận</label>
                      <input
                        type="date"
                        value={formData.arrivalDate}
                        onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hạn xử lý (nếu có)</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Luồng xử lý & Chọn Lãnh đạo Dropdown */}
                <div className="space-y-3 rounded-2xl bg-blue-50/80 p-4 border border-blue-200/80">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="submitDirectlyToLeader"
                      checked={formData.submitDirectlyToLeader}
                      onChange={(e) => setFormData({ ...formData, submitDirectlyToLeader: e.target.checked })}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="submitDirectlyToLeader" className="font-semibold text-blue-900 cursor-pointer text-xs select-none">
                      Trình ngay lên Lãnh đạo cho ý kiến chỉ đạo sau khi tiếp nhận
                    </label>
                  </div>

                  {/* Dropdown chọn Lãnh đạo */}
                  {formData.submitDirectlyToLeader && (
                    <div className="pt-2 pl-7 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block font-bold text-slate-700 text-xs">
                        Chọn Lãnh đạo phê duyệt / cho ý kiến chỉ đạo: <span className="text-rose-500">*</span>
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

              {/* RIGHT COLUMN: Attachments & File Upload (5/12) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Section 5: Tệp đính kèm / File scan */}
                <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                      <Paperclip className="h-3.5 w-3.5 text-[#1E60F3]" />
                      <span>5. Tệp đính kèm ({attachments.length})</span>
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

                  {/* Dropzone Box */}
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
                            Kéo thả tệp scan văn bản vào đây
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">hoặc nhấp chuột để duyệt từ máy tính</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium pt-1">Hỗ trợ: PDF, Word (DOC/DOCX), Excel, Ảnh scan</p>
                      </>
                    )}
                  </div>

                  {/* Uploaded attachments list */}
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
                  <span>Vào sổ & Tiếp nhận</span>
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
// 2. MODAL LÃNH ĐẠO CHO Ý KIẾN CHỈ ĐẠO
// ==========================================
export function DirectiveModal({
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [directiveText, setDirectiveText] = useState(doc.leaderDirective || '');
  const [primaryDeptId, setPrimaryDeptId] = useState(
    doc.assignees?.find((a: any) => a.roleType === 'PRIMARY')?.departmentId || ''
  );
  const [coordinateDeptIds, setCoordinateDeptIds] = useState<string[]>(
    doc.assignees?.filter((a: any) => a.roleType === 'COORDINATE').map((a: any) => a.departmentId) || []
  );
  const [dueDate, setDueDate] = useState(
    doc.dueDate ? new Date(doc.dueDate).toISOString().split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/admin/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data || []);
        if (data?.length > 0 && !primaryDeptId) {
          setPrimaryDeptId(data[0].id);
        }
      });
  }, []);

  const toggleCoordDept = (deptId: string) => {
    setCoordinateDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveText.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'DIRECTIVE',
          actorId: currentUser?.id,
          data: {
            leaderDirective: directiveText,
            primaryDeptId,
            coordinateDeptIds,
            dueDate: dueDate || undefined,
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
      <div className="w-full max-w-xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-amber-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-600 text-white font-bold shadow-sm">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Lãnh đạo cho ý kiến chỉ đạo</h2>
              <p className="text-[11px] text-slate-500">Chỉ đạo & Giao trực tiếp đến phòng ban/bộ phận xử lý</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="font-bold text-slate-800 text-xs">{doc.title}</p>
            <p className="text-slate-500 text-[11px] mt-1 font-medium">Số đến: {doc.subNumber} • Gửi từ: {doc.senderOrg}</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nội dung ý kiến chỉ đạo <span className="text-rose-500 font-bold">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Nhập ý kiến chỉ đạo, giao nhiệm vụ..."
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Phòng ban/bộ phận CHỦ TRÌ xử lý <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              value={primaryDeptId}
              onChange={(e) => setPrimaryDeptId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              required
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phòng ban/bộ phận PHỐI HỢP (Chọn nhiều)</label>
            <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-2xl p-3 max-h-36 overflow-y-auto bg-slate-50/50">
              {departments
                .filter((d) => d.id !== primaryDeptId)
                .map((d) => (
                  <label key={d.id} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coordinateDeptIds.includes(d.id)}
                      onChange={() => toggleCoordDept(d.id)}
                      className="rounded-md border-slate-300 text-blue-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium truncate">{d.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hạn xử lý yêu cầu (nếu có)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
            />
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-[11px] text-amber-800 border border-amber-200">
            ℹ️ Văn bản sẽ chuyển thẳng sang trạng thái <strong>Chờ xử lý</strong> và gửi thông báo tới phòng ban/bộ phận được chỉ đạo và Văn thư.
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2 font-bold text-white hover:from-amber-600 hover:to-orange-700 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {loading ? 'Đang lưu...' : 'Lưu chỉ đạo & Giao phòng ban/bộ phận'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ==========================================
// 3. MODAL VĂN THƯ CẬP NHẬT / ĐIỀU CHỈNH NƠI XỬ LÝ
// ==========================================
export function ForwardModal({
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [primaryDeptId, setPrimaryDeptId] = useState(
    doc.assignees?.find((a: any) => a.roleType === 'PRIMARY')?.departmentId || ''
  );
  const [coordinateDeptIds, setCoordinateDeptIds] = useState<string[]>(
    doc.assignees?.filter((a: any) => a.roleType === 'COORDINATE').map((a: any) => a.departmentId) || []
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/admin/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data || []);
        if (data?.length > 0 && !primaryDeptId) {
          setPrimaryDeptId(data[0].id);
        }
      });
  }, []);

  const toggleCoordDept = (deptId: string) => {
    setCoordinateDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'UPDATE_ASSIGNMENT',
          actorId: currentUser?.id,
          data: {
            primaryDeptId,
            coordinateDeptIds,
            notes,
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
      <div className="w-full max-w-xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1E60F3] text-white font-bold shadow-sm">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Điều chỉnh & Cập nhật nơi xử lý</h2>
              <p className="text-[11px] text-slate-500">Văn thư hiệu chỉnh lại phòng ban/bộ phận / người thực hiện</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleUpdateAssignment} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {doc.leaderDirective && (
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-1">
              <p className="font-bold text-amber-900 text-xs">Ý kiến chỉ đạo của Lãnh đạo:</p>
              <p className="italic text-amber-800 text-[11px] leading-relaxed">"{doc.leaderDirective}"</p>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Phòng ban/bộ phận CHỦ TRÌ xử lý <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              value={primaryDeptId}
              onChange={(e) => setPrimaryDeptId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              required
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phòng ban/bộ phận PHỐI HỢP</label>
            <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-2xl p-3 max-h-36 overflow-y-auto bg-slate-50/50">
              {departments
                .filter((d) => d.id !== primaryDeptId)
                .map((d) => (
                  <label key={d.id} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coordinateDeptIds.includes(d.id)}
                      onChange={() => toggleCoordDept(d.id)}
                      className="rounded-md border-slate-300 text-blue-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium truncate">{d.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú điều chỉnh</label>
            <textarea
              rows={2}
              placeholder="Ghi chú lý do cập nhật nơi thực hiện..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
            />
          </div>

          <div className="rounded-2xl bg-blue-50 p-3 text-[11px] text-blue-800 border border-blue-200">
            ℹ️ Khi Văn thư cập nhật lại nơi xử lý, <strong>Lãnh đạo và phòng ban/bộ phận mới được giao</strong> sẽ nhận được thông báo tự động.
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#1E60F3] px-6 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {loading ? 'Đang cập nhật...' : 'Lưu cập nhật & Báo Lãnh đạo'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ==========================================
// 4. MODAL BÁO CÁO TIẾN ĐỘ / HOÀN THÀNH
// ==========================================
export function ProgressModal({
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
  const [progressStatus, setProgressStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/documents/${doc.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'UPDATE_PROGRESS',
          actorId: currentUser?.id,
          data: {
            newStatus: progressStatus === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING',
            progressStatus,
            notes,
            departmentId: currentUser?.departmentId,
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
        <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Cập nhật Tiến độ & Kết quả Xử lý</h2>
              <p className="text-[11px] text-slate-500">Báo cáo kết quả công việc lên Lãnh đạo & Văn thư</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Trạng thái xử lý <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="IN_PROGRESS">Đang xử lý (Cập nhật tiến độ tiếp tục)</option>
              <option value="COMPLETED">Đã xử lý (Xong toàn bộ & Khóa hồ sơ)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Báo cáo kết quả / Ghi chú chi tiết <span className="text-rose-500 font-bold">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Nhập nội dung báo cáo kết quả thực hiện chi tiết..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          {progressStatus === 'COMPLETED' ? (
            <div className="rounded-2xl bg-rose-50 p-3.5 text-rose-800 text-[11px] border border-rose-200 font-medium">
              🔒 <strong>Lưu ý quan trọng:</strong> Khi chọn <strong>"Đã xử lý"</strong>, văn bản sẽ hoàn thành và khóa toàn bộ hồ sơ. Sau khi lưu, không thể cập nhật trạng thái hay chỉnh sửa bất kỳ thông tin nào khác.
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800 text-[11px] border border-emerald-200">
              ✓ Văn thư sẽ nhận được thông báo tiến độ cập nhật.
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-emerald-600 px-6 py-2 font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              {loading ? 'Đang lưu...' : progressStatus === 'COMPLETED' ? 'Xác nhận Hoàn thành' : 'Lưu tiến độ'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
