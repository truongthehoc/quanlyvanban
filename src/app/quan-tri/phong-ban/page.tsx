'use client';

import React, { useState, useEffect } from 'react';
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Area with Rounded Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Danh Mục Phòng Ban & Cơ Cấu Tổ Chức
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
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
          className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Phòng Ban Mới</span>
        </button>
      </div>

      {/* 2. Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số đơn vị</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{departments.length}</p>
            <p className="text-xs text-slate-400 font-medium">Khoa / Phòng / Trung tâm</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3]">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Tổng nhân sự</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {departments.reduce((acc, d) => acc + (d._count?.users || 0), 0)}
            </p>
            <p className="text-xs text-slate-400 font-medium">Cán bộ công chức viên chức</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Nhiệm vụ phân công</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {departments.reduce((acc, d) => acc + (d._count?.assignees || 0), 0)}
            </p>
            <p className="text-xs text-slate-400 font-medium">Văn bản đang xử lý</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <FileText className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. Search Bar with Rounded Input */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDepartments()}
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs focus:border-[#1E60F3] focus:outline-none placeholder:text-slate-400 shadow-sm"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* 4. Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                <th className="py-3.5 px-4 sm:px-5 w-32 font-bold text-slate-800">Mã đơn vị</th>
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Tên Phòng Ban / Đơn vị</th>
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Mô tả chức năng</th>
                <th className="py-3.5 px-4 sm:px-5 w-32 text-center font-bold text-slate-800">Nhân sự</th>
                <th className="py-3.5 px-4 sm:px-5 w-36 text-center font-bold text-slate-800">VB phụ trách</th>
                <th className="py-3.5 px-4 sm:px-5 w-24 text-right font-bold text-slate-800">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh mục phòng ban...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy phòng ban nào.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 sm:px-5 font-mono font-bold text-[#1E60F3]">
                      {dept.code}
                    </td>

                    <td className="py-4 px-4 sm:px-5">
                      <span className="font-bold text-slate-900">{dept.name}</span>
                    </td>

                    <td className="py-4 px-4 sm:px-5 text-slate-600 leading-relaxed">
                      {dept.description || 'Chưa cập nhật mô tả'}
                    </td>

                    <td className="py-4 px-4 sm:px-5 text-center">
                      <span className="inline-flex items-center space-x-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 border border-blue-100">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span>{dept._count?.users || 0} cán bộ</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-5 text-center">
                      <span className="inline-flex items-center space-x-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                        <FileText className="h-3 w-3 text-slate-400" />
                        <span>{dept._count?.assignees || 0} nhiệm vụ</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
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

      {/* CREATE SLIDE-OVER DRAWER */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
          <div className="w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 ease-out">
            
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
                <label className="block font-bold text-slate-700 mb-1">Mã đơn vị *</label>
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
                <label className="block font-bold text-slate-700 mb-1">Tên Phòng Ban / Đơn vị *</label>
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
        </div>
      )}

    </div>
  );
}
