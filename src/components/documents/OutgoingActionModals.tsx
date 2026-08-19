'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, Stamp, Send, Sparkles, FileText, AlertCircle } from 'lucide-react';

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
  const { currentUser } = useAuth();
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    recipientOrg: '',
    recipientOrgId: '',
    documentTypeId: '',
    urgencyLevel: 'NORMAL',
    confidentialityLevel: 'NORMAL',
    submitDirectlyToLeader: false,
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
          recipientOrgId: orgData[0].id,
          recipientOrg: orgData[0].shortName || orgData[0].name,
        }));
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Soạn thảo Dự thảo Văn bản Đi</h2>
          </div>
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trích yếu nội dung văn bản *</label>
            <textarea
              rows={2}
              placeholder="VD: Quyết định V/v Kiện toàn nhân sự ban chuyển đổi số..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loại văn bản *</label>
              <select
                value={formData.documentTypeId}
                onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                {docTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.name} ({dt.code}) - Mẫu: {dt.numberingPattern}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Nơi nhận văn bản *</label>
                <button
                  type="button"
                  onClick={() => setUseCustomRecipient(!useCustomRecipient)}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  {useCustomRecipient ? 'Chọn từ danh mục' : 'Nhập tự do'}
                </button>
              </div>

              {!useCustomRecipient ? (
                <select
                  value={formData.recipientOrgId}
                  onChange={(e) => handleOrgSelect(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
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
                  placeholder="VD: UBND tỉnh, Sở GD&ĐT, Các phòng ban..."
                  value={formData.recipientOrg}
                  onChange={(e) => setFormData({ ...formData, recipientOrg: e.target.value, recipientOrgId: '' })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tóm tắt / Thuyết minh nội dung</label>
            <textarea
              rows={3}
              placeholder="Mô tả tóm tắt nội dung văn bản dự thảo..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="rounded-lg bg-blue-50/70 p-3 border border-blue-200 flex items-center space-x-3">
            <input
              type="checkbox"
              id="submitDirectlyToLeaderOut"
              checked={formData.submitDirectlyToLeader}
              onChange={(e) => setFormData({ ...formData, submitDirectlyToLeader: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="submitDirectlyToLeaderOut" className="font-semibold text-blue-900 cursor-pointer">
              Trình ngay lên Lãnh đạo phê duyệt ban hành
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
              {loading ? 'Đang lưu...' : 'Lưu dự thảo'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  const { currentUser } = useAuth();
  const [dispatchMethod, setDispatchMethod] = useState('Bưu chính & Điện tử');
  const [recipientOrg, setRecipientOrg] = useState(doc.recipientOrg || '');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <Stamp className="h-5 w-5 text-blue-700" />
            <h2 className="text-base font-bold text-slate-800">Cấp Số Tự Động & Phát Hành Văn Bản Đi</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-900 font-bold mb-1">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Quy tắc sinh số tự động (Numbering Engine)</span>
            </div>
            <p className="text-slate-600 text-xs">
              Mẫu số quy định: <span className="font-bold text-blue-800">{doc.documentType?.numberingPattern || '{STT}/{MA_LOAI}-{MA_DV}'}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Hệ thống sẽ tự động khóa sổ, lấy số tiếp theo và cập nhật vào Sổ văn bản đi năm 2026.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hình thức gửi văn bản *</label>
            <select
              value={dispatchMethod}
              onChange={(e) => setDispatchMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="Bưu chính & Điện tử">Bưu chính & Điện tử (Hệ thống liên thông)</option>
              <option value="Chuyển phát bưu điện">Chuyển phát bưu điện (Đường thư)</option>
              <option value="Gửi thư điện tử Email">Gửi thư điện tử (Email công vụ)</option>
              <option value="Trao trực tiếp">Trao trực tiếp tại cơ quan</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nơi nhận xác nhận *</label>
            <input
              type="text"
              value={recipientOrg}
              onChange={(e) => setRecipientOrg(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800 text-[11px] border border-emerald-200">
            ✓ Sau khi phát hành, người soạn thảo sẽ nhận được thông báo số văn bản chính thức.
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleIssue}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-sm"
            >
              {loading ? 'Đang xử lý...' : 'Cấp số & Phát hành ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
