'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, Radio, Building2, Globe, Users, AlertCircle } from 'lucide-react';

export function CreateInternalModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    documentNumber: '',
    documentTypeId: '',
    scopeType: 'ALL', // 'ALL' | 'DEPARTMENT'
    targetDepartmentIds: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/departments').then((r) => r.json()),
      fetch('/api/admin/doc-types').then((r) => r.json()),
    ]).then(([deptData, typeData]) => {
      setDepartments(deptData || []);
      setDocTypes(typeData.docTypes || []);
      if (typeData.docTypes?.length > 0) {
        setFormData((prev) => ({ ...prev, documentTypeId: typeData.docTypes[0].id }));
      }
    });
  }, []);

  const toggleDept = (deptId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetDepartmentIds: prev.targetDepartmentIds.includes(deptId)
        ? prev.targetDepartmentIds.filter((id) => id !== deptId)
        : [...prev.targetDepartmentIds, deptId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      setError('Vui lòng nhập trích yếu văn bản nội bộ.');
      return;
    }
    if (formData.scopeType === 'DEPARTMENT' && formData.targetDepartmentIds.length === 0) {
      setError('Vui lòng chọn ít nhất một phòng ban nhận văn bản.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/documents/internal', {
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl border-l border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 ease-out">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3] font-bold">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Đăng tải Văn bản & Thông báo Nội bộ</h2>
              <p className="text-[11px] text-slate-500">Phát hành thông báo đến toàn cơ quan hoặc nhóm phòng ban</p>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Trích yếu / Tiêu đề thông báo *</label>
              <input
                type="text"
                placeholder="VD: Thông báo Lịch nghỉ Lễ & Phân công trực ban..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Số/Ký hiệu nội bộ</label>
              <input
                type="text"
                placeholder="VD: 09/TB-VP"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tóm tắt / Nội dung thông báo</label>
            <textarea
              rows={3}
              placeholder="Nội dung truyền đạt đến các phòng ban/cá nhân..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
            />
          </div>

          {/* Phân quyền đối tượng nhận */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70 space-y-3">
            <label className="block font-bold text-slate-800 text-xs">
              Phân quyền đối tượng nhận văn bản (Audience Scope) *
            </label>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-800 font-semibold">
                <input
                  type="radio"
                  name="scopeType"
                  value="ALL"
                  checked={formData.scopeType === 'ALL'}
                  onChange={() => setFormData({ ...formData, scopeType: 'ALL' })}
                  className="rounded-full text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <Globe className="h-4 w-4 text-blue-600" />
                <span>Toàn cơ quan (Mọi người đều xem được)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-800 font-semibold">
                <input
                  type="radio"
                  name="scopeType"
                  value="DEPARTMENT"
                  checked={formData.scopeType === 'DEPARTMENT'}
                  onChange={() => setFormData({ ...formData, scopeType: 'DEPARTMENT' })}
                  className="rounded-full text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>Theo Phòng ban cụ thể</span>
              </label>
            </div>

            {formData.scopeType === 'DEPARTMENT' && (
              <div className="pt-2">
                <p className="text-[11px] text-slate-500 mb-2">Chọn các phòng ban được phép xem văn bản:</p>
                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {departments.map((d) => (
                    <label key={d.id} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.targetDepartmentIds.includes(d.id)}
                        onChange={() => toggleDept(d.id)}
                        className="rounded-full border-slate-300 text-blue-600 cursor-pointer"
                      />
                      <span>{d.name} ({d.code})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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
              {loading ? 'Đang đăng...' : 'Đăng tải thông báo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
