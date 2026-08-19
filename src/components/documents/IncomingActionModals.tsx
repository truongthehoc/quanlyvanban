'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, Send, FileCheck, CheckCircle2, Building2, Calendar, AlertCircle } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-base font-bold text-slate-800">Tiếp nhận & Vào sổ Văn bản Đến</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-rose-50 p-3 text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số/Ký hiệu văn bản gốc *</label>
              <input
                type="text"
                placeholder="VD: 108/UBND-VX"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Cơ quan ban hành (Nơi gửi) *</label>
                <button
                  type="button"
                  onClick={() => setUseCustomSender(!useCustomSender)}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  {useCustomSender ? 'Chọn từ danh mục' : 'Nhập tự do'}
                </button>
              </div>

              {!useCustomSender ? (
                <select
                  value={formData.senderOrgId}
                  onChange={(e) => handleOrgSelect(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trích yếu nội dung văn bản *</label>
            <textarea
              rows={2}
              placeholder="Nhập tóm tắt nội dung chính của văn bản đến..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loại văn bản</label>
              <select
                value={formData.documentTypeId}
                onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                {docTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.name} ({dt.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Độ khẩn</label>
              <select
                value={formData.urgencyLevel}
                onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="NORMAL">Thường</option>
                <option value="URGENT">Khẩn</option>
                <option value="TOP_URGENT">Hỏa tốc / Thượng khẩn</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Độ mật</label>
              <select
                value={formData.confidentialityLevel}
                onChange={(e) => setFormData({ ...formData, confidentialityLevel: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="NORMAL">Thường</option>
                <option value="CONFIDENTIAL">Mật</option>
                <option value="TOP_SECRET">Tuyệt mật</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày ban hành</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày đến (Tiếp nhận)</label>
              <input
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hạn xử lý (nếu có)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Direct to leader toggle */}
          <div className="rounded-lg bg-blue-50/70 p-3 border border-blue-200 flex items-center space-x-3">
            <input
              type="checkbox"
              id="submitDirectlyToLeader"
              checked={formData.submitDirectlyToLeader}
              onChange={(e) => setFormData({ ...formData, submitDirectlyToLeader: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="submitDirectlyToLeader" className="font-semibold text-blue-900 cursor-pointer">
              Trình ngay lên Lãnh đạo xin ý kiến chỉ đạo sau khi vào sổ
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-sm"
            >
              {loading ? 'Đang lưu...' : 'Vào sổ & Tiếp nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [directiveText, setDirectiveText] = useState('');
  const [primaryDeptId, setPrimaryDeptId] = useState('');
  const [coordinateDeptIds, setCoordinateDeptIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50/80 px-6 py-4">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-blue-700" />
            <h2 className="text-base font-bold text-slate-800">Lãnh đạo cho ý kiến chỉ đạo</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-800 text-xs">Văn bản: {doc.title}</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Số đến: {doc.subNumber} • Gửi từ: {doc.senderOrg}</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nội dung ý kiến chỉ đạo *</label>
            <textarea
              rows={3}
              placeholder="VD: Giao Trung tâm CNTT chủ trì, Phòng KHTC phối hợp rà soát và đề xuất phương án..."
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Đơn vị CHỦ TRÌ xử lý *</label>
            <select
              value={primaryDeptId}
              onChange={(e) => setPrimaryDeptId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
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
            <label className="block font-semibold text-slate-700 mb-1">Đơn vị PHỐI HỢP (Chọn nhiều)</label>
            <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-lg p-2.5 max-h-36 overflow-y-auto bg-slate-50/50">
              {departments
                .filter((d) => d.id !== primaryDeptId)
                .map((d) => (
                  <label key={d.id} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coordinateDeptIds.includes(d.id)}
                      onChange={() => toggleCoordDept(d.id)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>{d.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hạn xử lý yêu cầu</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-sm"
            >
              {loading ? 'Đang gửi...' : 'Lưu & Chuyển Văn thư phát hành'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-indigo-700" />
            <h2 className="text-base font-bold text-slate-800">Vào sổ & Chuyển tiếp Phòng ban</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Bạn chuẩn bị chuyển giao văn bản <span className="font-bold text-slate-900">"{doc.title}"</span> đến các đơn vị đã được Lãnh đạo chỉ đạo:
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <p className="font-bold text-blue-900">Ý kiến Lãnh đạo:</p>
            <p className="italic text-slate-700">"{doc.leaderDirective}"</p>
          </div>

          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800 text-[11px] border border-emerald-200">
            ✓ Hệ thống sẽ gửi thông báo tức thì đến Trưởng các đơn vị được chỉ đạo.
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleForward}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700 shadow-sm"
            >
              {loading ? 'Đang chuyển...' : 'Xác nhận Chuyển tiếp'}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const { currentUser } = useAuth();
  const [progressStatus, setProgressStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-800">Cập nhật Tiến độ & Kết quả Xử lý</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trạng thái xử lý *</label>
            <select
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="IN_PROGRESS">Đang thực hiện (Cập nhật tiến độ)</option>
              <option value="COMPLETED">Đã hoàn thành toàn bộ nhiệm vụ</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Báo cáo kết quả / Ghi chú chi tiết *</label>
            <textarea
              rows={3}
              placeholder="VD: Đã hoàn tất dự thảo kế hoạch và gửi báo cáo thẩm định..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
            >
              {loading ? 'Đang lưu...' : 'Lưu kết quả'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
