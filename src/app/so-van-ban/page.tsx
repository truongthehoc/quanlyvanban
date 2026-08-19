'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import {
  BookOpen,
  Plus,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Info,
  X,
  FileText,
} from 'lucide-react';

export default function DocumentBooksPage() {
  const [mounted, setMounted] = useState(false);
  const { hasRole } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [newBook, setNewBook] = useState({
    name: '',
    code: '',
    type: 'INCOMING',
    year: new Date().getFullYear(),
  });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchBooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INCOMING':
        return <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">Sổ Văn bản Đến</span>;
      case 'OUTGOING':
        return <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">Sổ Văn bản Đi</span>;
      case 'INTERNAL':
        return <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-100">Sổ Nội bộ</span>;
      default:
        return <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Header Area with Rounded Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Quản lý Sổ Đăng Ký Văn Bản
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi danh mục Sổ Văn bản Đến, Sổ Văn bản Đi, Sổ Nội bộ và số lượng văn bản đã vào sổ theo từng năm.
          </p>
        </div>

        {hasRole(['CLERK', 'ADMIN']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Mở Sổ Mới Cho Năm</span>
          </button>
        )}
      </div>

      {/* 2. Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-14 text-center text-slate-400">
            Đang tải danh sách sổ văn bản...
          </div>
        ) : (
          books.map((book) => (
            <div
              key={book.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {getTypeBadge(book.type)}
                  <span className="flex items-center space-x-1 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Năm {book.year}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{book.name}</h3>
                  <p className="text-xs font-mono font-bold text-[#1E60F3] mt-0.5">{book.code}</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Số hiện tại đã cấp:</span>
                  <span className="text-lg font-extrabold text-slate-900">{book.currentNumber}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tổng văn bản lưu trữ:</span>
                  <span className="font-bold text-slate-800">{book._count?.documents || 0} văn bản</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đang mở sổ</span>
                </span>
                <span className="text-slate-400 text-xs">Tự động tăng số</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL (Rendered via Portal to document.body) */}
      {showCreateModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Mở Sổ Đăng Ký Văn Bản Mới</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Khởi tạo sổ đăng ký quản lý số và luân chuyển văn bản</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreateBook} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã định danh sổ <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: SO-DEN-2027"
                  value={newBook.code}
                  onChange={(e) => setNewBook({ ...newBook, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs uppercase focus:border-[#1E60F3] focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên sổ đăng ký <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Sổ Đăng ký Văn bản Đến năm 2027"
                  value={newBook.name}
                  onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại sổ</label>
                  <select
                    value={newBook.type}
                    onChange={(e) => setNewBook({ ...newBook, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer"
                  >
                    <option value="INCOMING">Văn bản Đến</option>
                    <option value="OUTGOING">Văn bản Đi</option>
                    <option value="INTERNAL">Văn bản Nội bộ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Năm áp dụng</label>
                  <input
                    type="number"
                    value={newBook.year}
                    onChange={(e) => setNewBook({ ...newBook, year: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#1E60F3] px-6 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Tạo Sổ Văn Bản
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
