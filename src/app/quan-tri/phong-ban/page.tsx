'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Plus,
  Search,
  Users,
  FileText,
  Edit2,
  Trash2,
  Info,
  Layers,
  X,
  AlertCircle,
} from 'lucide-react';

export default function DepartmentsAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/departments?search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ code: '', name: '', description: '' });
        fetchDepartments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Header Area with Rounded Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Danh Mục Phòng Ban & Cơ Cấu Tổ Chức
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-help" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý cây cơ cấu phòng ban, trung tâm và đơn vị trực thuộc cơ quan.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingDept(null);
            setFormData({ code: '', name: '', description: '' });
            setShowModal(true);
          }}
          className="inline-flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Phòng Ban Mới</span>
        </button>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số đơn vị</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{departments.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Khoa / Phòng / Trung tâm</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3]">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng nhân sự</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {departments.reduce((acc, curr) => acc + (curr._count?.users || 0), 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cán bộ công chức viên chức</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Văn bản được phân công</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {departments.reduce((acc, curr) => acc + (curr._count?.primaryDocs || 0), 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Văn bản đang xử lý</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FileText className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. Search Toolbar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDepartments()}
            className="w-full rounded-full border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1E60F3] focus:bg-white focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Mã đơn vị</th>
                <th className="py-3.5 px-6">Tên Phòng Ban / Đơn vị</th>
                <th className="py-3.5 px-6">Mô tả chức năng</th>
                <th className="py-3.5 px-6 text-center">Nhân sự</th>
                <th className="py-3.5 px-6 text-center">Văn bản được phân công</th>
                <th className="py-3.5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh sách phòng ban...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Chưa có dữ liệu phòng ban nào.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-blue-600">
                      {dept.code}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {dept.name}
                    </td>
                    <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                      {dept.description || 'Chưa cập nhật mô tả'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        {dept._count?.users || 0} cán bộ
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                        {dept._count?.primaryDocs || 0} văn bản
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingDept(dept);
                            setFormData({
                              code: dept.code,
                              name: dept.name,
                              description: dept.description || '',
                            });
                            setShowModal(true);
                          }}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL (Rendered via Portal to document.body) */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Thêm Phòng Ban Mới</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Khởi tạo cơ cấu tổ chức phòng ban trong cơ quan</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã đơn vị <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: KHTC, CNTT, VP..."
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs uppercase focus:border-[#1E60F3] focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên Phòng Ban / Đơn vị <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Phòng Kế hoạch - Tài chính"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả chức năng nhiệm vụ</label>
                <textarea
                  rows={4}
                  placeholder="Mô tả chức năng tham mưu, quản lý..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#1E60F3] px-6 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Lưu Phòng Ban
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
