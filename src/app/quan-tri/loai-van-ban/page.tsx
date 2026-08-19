'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileCode2, Plus, Sparkles, CheckCircle2, Info, Edit2, X, Code2 } from 'lucide-react';

export default function DocumentTypesAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    numberingPattern: '{STT}/{MA_LOAI}-{MA_DV}',
    defaultBookId: '',
    description: '',
  });

  const fetchDocTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/doc-types');
      if (res.ok) {
        const data = await res.json();
        setDocTypes(data.docTypes || []);
        setBooks(data.books || []);
        if (data.books?.length > 0) {
          setFormData((prev) => ({ ...prev, defaultBookId: data.books[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingType ? 'PATCH' : 'POST';
      const bodyData = editingType ? { ...formData, id: editingType.id } : formData;

      const res = await fetch('/api/admin/doc-types', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingType(null);
        setFormData({
          code: '',
          name: '',
          numberingPattern: '{STT}/{MA_LOAI}-{MA_DV}',
          defaultBookId: books[0]?.id || '',
          description: '',
        });
        fetchDocTypes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSimulatedNumber = (pattern: string, code: string) => {
    const year = new Date().getFullYear();
    return pattern
      .replace(/{STT}/g, '25')
      .replace(/{STT:2}/g, '25')
      .replace(/{STT:3}/g, '025')
      .replace(/{MA_LOAI}/g, code)
      .replace(/{MA_DV}/g, 'BGD')
      .replace(/{NAM}/g, year.toString())
      .replace(/{NAM_2}/g, year.toString().slice(-2));
  };

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Header Area with Rounded Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Loại Văn Bản & Quy Tắc Cấp Số Tự Động
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình quy tắc sinh số hiệu văn bản đi theo mẫu quy định (Numbering Pattern Engine).
          </p>
        </div>

        <button
          onClick={() => {
            setEditingType(null);
            setFormData({
              code: '',
              name: '',
              numberingPattern: '{STT}/{MA_LOAI}-{MA_DV}',
              defaultBookId: books[0]?.id || '',
              description: '',
            });
            setShowModal(true);
          }}
          className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Loại Văn Bản</span>
        </button>
      </div>

      {/* 2. Numbering Engine Help Note */}
      <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-5 sm:p-6 text-xs text-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="font-bold text-blue-900 flex items-center space-x-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Quy chuẩn công thức sinh số (Pattern Tokens):</span>
          </p>
          <p className="text-slate-600 leading-relaxed text-xs">
            Hệ thống hỗ trợ các biến: <code className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-bold font-mono text-blue-700">{'{STT}'}</code> (Số tăng dần), <code className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-bold font-mono text-blue-700">{'{MA_LOAI}'}</code> (Mã loại VB), <code className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-bold font-mono text-blue-700">{'{MA_DV}'}</code> (Mã đơn vị), <code className="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-bold font-mono text-blue-700">{'{NAM}'}</code> (Năm 4 số).
          </p>
        </div>
      </div>

      {/* 3. Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                <th className="py-3.5 px-4 sm:px-5 w-28 font-bold text-slate-800">Mã loại</th>
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Tên loại văn bản</th>
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Công thức sinh số (Pattern)</th>
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Mẫu số thực tế minh họa</th>
                <th className="py-3.5 px-4 sm:px-5 w-40 font-bold text-slate-800">Sổ văn bản mặc định</th>
                <th className="py-3.5 px-4 sm:px-5 w-20 text-right font-bold text-slate-800">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh mục loại văn bản...
                  </td>
                </tr>
              ) : (
                docTypes.map((dt) => (
                  <tr key={dt.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="py-4 px-4 sm:px-5 font-mono font-bold text-[#1E60F3]">
                      {dt.code}
                    </td>

                    <td className="py-4 px-4 sm:px-5 font-bold text-slate-900">
                      {dt.name}
                    </td>

                    <td className="py-4 px-4 sm:px-5 font-mono text-slate-600 bg-slate-50/50">
                      {dt.numberingPattern}
                    </td>

                    <td className="py-4 px-4 sm:px-5">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-200">
                        {getSimulatedNumber(dt.numberingPattern, dt.code)}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-5 text-slate-600 font-medium">
                      {dt.defaultBook?.name || 'Sổ mặc định'}
                    </td>

                    <td className="py-4 px-4 sm:px-5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setEditingType(dt);
                            setFormData({
                              code: dt.code,
                              name: dt.name,
                              numberingPattern: dt.numberingPattern,
                              defaultBookId: dt.defaultBookId || '',
                              description: dt.description || '',
                            });
                            setShowModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          title="Chỉnh sửa công thức"
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

      {/* EDIT / CREATE MODAL (Rendered via Portal to document.body) */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingType ? 'Chỉnh Sửa Loại Văn Bản & Mẫu Số' : 'Thêm Loại Văn Bản Mới'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Cấu hình công thức sinh số tự động cho loại văn bản</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã loại văn bản <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập mã loại văn bản (CV, QD, TB...)"
                    value={formData.code}
                    disabled={!!editingType}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs uppercase focus:border-[#1E60F3] focus:outline-none font-mono disabled:bg-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên loại văn bản <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên loại văn bản..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mẫu quy tắc sinh số (Pattern) <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập công thức sinh số..."
                  value={formData.numberingPattern}
                  onChange={(e) => setFormData({ ...formData, numberingPattern: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono text-[#1E60F3] font-bold focus:border-[#1E60F3] focus:outline-none"
                  required
                />
                <div className="mt-2 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                  <span className="text-slate-500 font-semibold">Xem trước kết quả sinh số:</span>
                  <span className="ml-2 font-mono font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200 inline-block mt-1">
                    {getSimulatedNumber(formData.numberingPattern, formData.code || 'CV')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sổ văn bản mặc định</label>
                <select
                  value={formData.defaultBookId}
                  onChange={(e) => setFormData({ ...formData, defaultBookId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer font-medium text-slate-800"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
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
                  Lưu Cấu Hình Mẫu Số
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
