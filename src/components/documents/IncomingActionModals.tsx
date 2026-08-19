'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import { X, Send, FileCheck, CheckCircle2, Building2, Calendar, AlertCircle, Inbox, FileText } from 'lucide-react';

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
  const [useCustomSender, setUseCustomSender] = useState(false);
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch('/api/admin/doc-types').then((r) => r.json()),
      fetch('/api/admin/organizations').then((r) => r.json()),
    ]).then(([typeData, orgData]) => {
      setDocTypes(typeData.docTypes || []);
      setOrganizations(orgData || []);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3] font-bold">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tiếp nhận & Vào sổ Văn bản Đến</h2>
              <p className="text-[11px] text-slate-500">Đăng ký thông tin văn bản đến từ cơ quan bên ngoài</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-3.5 text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số/Ký hiệu văn bản gốc *</label>
              <input
                type="text"
                placeholder="VD: 108/UBND-VX"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Cơ quan ban hành (Nơi gửi) *</label>
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
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer"
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
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Trích yếu nội dung văn bản *</label>
            <textarea
              rows={3}
              placeholder="Nhập tóm tắt nội dung chính của văn bản đến..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Loại văn bản</label>
              <select
                value={formData.documentTypeId}
                onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
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
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              >
                <option value="NORMAL">Bình thường</option>
                <option value="URGENT">Khẩn</option>
                <option value="TOP_URGENT">Hỏa tốc / Thượng khẩn</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Độ mật</label>
              <select
                value={formData.confidentialityLevel}
                onChange={(e) => setFormData({ ...formData, confidentialityLevel: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              >
                <option value="NORMAL">Thường</option>
                <option value="CONFIDENTIAL">Mật</option>
                <option value="TOP_SECRET">Tuyệt mật</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày ban hành</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày tiếp nhận</label>
              <input
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hạn xử lý (nếu có)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              />
            </div>
          </div>

          {/* Direct to leader toggle */}
          <div className="rounded-2xl bg-blue-50/70 p-4 border border-blue-200 flex items-center space-x-3">
            <input
              type="checkbox"
              id="submitDirectlyToLeader"
              checked={formData.submitDirectlyToLeader}
              onChange={(e) => setFormData({ ...formData, submitDirectlyToLeader: e.target.checked })}
              className="h-4 w-4 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="submitDirectlyToLeader" className="font-semibold text-blue-900 cursor-pointer text-xs">
              Trình ngay lên Lãnh đạo cho ý kiến chỉ đạo sau khi tiếp nhận
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#1E60F3] px-6 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              {loading ? 'Đang lưu...' : 'Vào sổ & Tiếp nhận'}
            </button>
          </div>
        </form>
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
  const [directiveText, setDirectiveText] = useState('');
  const [primaryDeptId, setPrimaryDeptId] = useState('');
  const [coordinateDeptIds, setCoordinateDeptIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/admin/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data || []);
        if (data?.length > 0) {
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
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-sm">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Lãnh đạo cho ý kiến chỉ đạo</h2>
              <p className="text-[11px] text-slate-500">Phân công đơn vị chủ trì và phối hợp thực hiện</p>
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
            <label className="block font-bold text-slate-700 mb-1">Nội dung ý kiến chỉ đạo *</label>
            <textarea
              rows={3}
              placeholder="VD: Giao Trung tâm CNTT chủ trì, Phòng KHTC phối hợp rà soát và đề xuất phương án..."
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Đơn vị CHỦ TRÌ xử lý *</label>
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
            <label className="block font-bold text-slate-700 mb-1">Đơn vị PHỐI HỢP (Chọn nhiều)</label>
            <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-2xl p-3 max-h-40 overflow-y-auto bg-slate-50/50">
              {departments
                .filter((d) => d.id !== primaryDeptId)
                .map((d) => (
                  <label key={d.id} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coordinateDeptIds.includes(d.id)}
                      onChange={() => toggleCoordDept(d.id)}
                      className="rounded-full border-slate-300 text-blue-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium">{d.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hạn xử lý yêu cầu</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#1E60F3] px-6 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              {loading ? 'Đang gửi...' : 'Lưu & Chuyển Văn thư phát hành'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ==========================================
// 3. MODAL VĂN THƯ CHUYỂN TIẾP PHÒNG BAN
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleForward = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'FORWARD',
          actorId: currentUser?.id,
          data: {},
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
      <div className="w-full max-w-md max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold shadow-sm">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Vào sổ & Chuyển tiếp Phòng ban</h2>
              <p className="text-[11px] text-slate-500">Phát hành lệnh xử lý đến các phòng ban phụ trách</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Bạn chuẩn bị chuyển giao văn bản <span className="font-bold text-slate-900">"{doc.title}"</span> đến các đơn vị đã được Lãnh đạo chỉ đạo:
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-blue-900">Ý kiến Lãnh đạo:</p>
            <p className="italic text-slate-700 leading-relaxed">"{doc.leaderDirective}"</p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3.5 text-emerald-800 text-[11px] border border-emerald-200 font-medium">
            ✓ Hệ thống sẽ gửi thông báo tức thì đến Trưởng các đơn vị được chỉ đạo.
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
              onClick={handleForward}
              disabled={loading}
              className="rounded-full bg-indigo-600 px-6 py-2 font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
            >
              {loading ? 'Đang chuyển...' : 'Xác nhận Chuyển tiếp'}
            </button>
          </div>
        </div>
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
              <p className="text-[11px] text-slate-500">Báo cáo kết quả công việc lên Lãnh đạo</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Trạng thái xử lý *</label>
            <select
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="IN_PROGRESS">Đang thực hiện (Cập nhật tiến độ)</option>
              <option value="COMPLETED">Đã hoàn thành toàn bộ nhiệm vụ</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Báo cáo kết quả / Ghi chú chi tiết *</label>
            <textarea
              rows={4}
              placeholder="VD: Đã hoàn tất dự thảo kế hoạch và gửi báo cáo thẩm định..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-emerald-600 px-6 py-2 font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
            >
              {loading ? 'Đang lưu...' : 'Lưu kết quả'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
