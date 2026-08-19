'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import { useSystemConfig } from '@/lib/system-config-context';
import {
  BookOpen,
  Plus,
  Calendar,
  Layers,
  CheckCircle2,
  Lock,
  Unlock,
  Info,
  X,
  FileText,
  Search,
  Filter,
  Sparkles,
  Sliders,
  Edit2,
  Trash2,
  Hash,
  ArrowUpRight,
  TrendingUp,
  FolderOpen,
  LayoutGrid,
  List,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';

interface DocumentBookItem {
  id: string;
  code: string;
  name: string;
  type: string; // INCOMING, OUTGOING, INTERNAL
  year: number;
  currentNumber: number;
  startNumber?: number;
  isAutoIncrement?: boolean;
  isActive: boolean;
  _count?: {
    documents: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function DocumentBooksPage() {
  const [mounted, setMounted] = useState(false);
  const { hasRole } = useAuth();
  const { config } = useSystemConfig();

  const currentBrandColor = config?.brandTheme?.primaryColor || '#1E60F3';
  const currentHeadingColor = config?.brandTheme?.headingColor || '#190072';

  const [books, setBooks] = useState<DocumentBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<DocumentBookItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'INCOMING',
    year: new Date().getFullYear(),
    startNumber: 1,
    currentNumber: 0,
    isAutoIncrement: true,
    isActive: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

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
      showToast('Lỗi khi tải dữ liệu sổ văn bản', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !searchQuery ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = selectedType === 'ALL' || b.type === selectedType;
      const matchYear = selectedYear === 'ALL' || b.year.toString() === selectedYear;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && b.isActive) ||
        (selectedStatus === 'LOCKED' && !b.isActive);

      return matchSearch && matchType && matchYear && matchStatus;
    });
  }, [books, searchQuery, selectedType, selectedYear, selectedStatus]);

  // Unique Years available in dataset
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(books.map((b) => b.year)));
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b - a);
  }, [books]);

  // Stats
  const stats = useMemo(() => {
    const total = books.length;
    const active = books.filter((b) => b.isActive).length;
    const totalDocs = books.reduce((acc, curr) => acc + (curr._count?.documents || 0), 0);
    const totalIssued = books.reduce((acc, curr) => acc + (curr.currentNumber || 0), 0);
    return { total, active, totalDocs, totalIssued };
  }, [books]);

  // Auto-generate code when type or year changes in create mode
  const handleTypeOrYearChange = (newType: string, newYear: number) => {
    let prefix = 'SO-DEN';
    let defaultName = 'Sổ Đăng ký Văn bản Đến';
    if (newType === 'OUTGOING') {
      prefix = 'SO-DI';
      defaultName = 'Sổ Đăng ký Văn bản Đi';
    } else if (newType === 'INTERNAL') {
      prefix = 'SO-NB';
      defaultName = 'Sổ Đăng ký Văn bản Nội bộ';
    }

    setFormData((prev) => ({
      ...prev,
      type: newType,
      year: newYear,
      code: !editingBook ? `${prefix}-${newYear}` : prev.code,
      name: !editingBook ? `${defaultName} năm ${newYear}` : prev.name,
    }));
  };

  const handleOpenCreateModal = () => {
    const currentYear = new Date().getFullYear();
    setEditingBook(null);
    setFormData({
      code: `SO-DEN-${currentYear}`,
      name: `Sổ Đăng ký Văn bản Đến năm ${currentYear}`,
      type: 'INCOMING',
      year: currentYear,
      startNumber: 1,
      currentNumber: 0,
      isAutoIncrement: true,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (book: DocumentBookItem) => {
    setEditingBook(book);
    setFormData({
      code: book.code,
      name: book.name,
      type: book.type,
      year: book.year,
      startNumber: book.startNumber || 1,
      currentNumber: book.currentNumber,
      isAutoIncrement: book.isAutoIncrement !== false,
      isActive: book.isActive,
    });
    setShowModal(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        // Update
        const res = await fetch('/api/books', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingBook.id,
            name: formData.name,
            type: formData.type,
            year: formData.year,
            currentNumber: formData.currentNumber,
            isActive: formData.isActive,
          }),
        });
        if (res.ok) {
          showToast('Đã cập nhật sổ văn bản thành công');
          setShowModal(false);
          fetchBooks();
        } else {
          const data = await res.json();
          showToast(data.error || 'Lỗi khi cập nhật sổ', 'error');
        }
      } else {
        // Create
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast('Đã mở sổ văn bản mới thành công');
          setShowModal(false);
          fetchBooks();
        } else {
          const data = await res.json();
          showToast(data.error || 'Lỗi khi tạo sổ', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi hệ thống khi lưu sổ', 'error');
    }
  };

  const handleToggleLock = async (book: DocumentBookItem) => {
    try {
      const res = await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: book.id,
          isActive: !book.isActive,
        }),
      });
      if (res.ok) {
        showToast(book.isActive ? 'Đã khóa sổ văn bản' : 'Đã mở lại sổ văn bản');
        fetchBooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (book: DocumentBookItem) => {
    if (book._count?.documents && book._count.documents > 0) {
      showToast(`Sổ này đang chứa ${book._count.documents} văn bản. Không thể xóa!`, 'error');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa "${book.name}" (${book.code})?`)) return;

    try {
      const res = await fetch(`/api/books?id=${book.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Đã xóa sổ văn bản thành công');
        fetchBooks();
      } else {
        const data = await res.json();
        showToast(data.error || 'Lỗi khi xóa sổ', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi hệ thống', 'error');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INCOMING':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            <span>Văn bản Đến</span>
          </span>
        );
      case 'OUTGOING':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-extrabold text-indigo-700 border border-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
            <span>Văn bản Đi</span>
          </span>
        );
      case 'INTERNAL':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-extrabold text-teal-700 border border-teal-200">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600"></span>
            <span>Nội bộ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-[120] flex items-center space-x-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl animate-in slide-in-from-top-4 ${
            toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1
              className="text-xl sm:text-2xl font-black tracking-tight"
              style={{ color: currentHeadingColor }}
            >
              Quản Lý Sổ Đăng Ký Văn Bản
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi danh mục Sổ Văn bản Đến, Sổ Văn bản Đi, Sổ Nội bộ; cấu hình cơ chế tự động cấp số và số khởi tạo theo từng năm.
          </p>
        </div>

        {hasRole(['CLERK', 'ADMIN']) && (
          <button
            onClick={handleOpenCreateModal}
            style={{ backgroundColor: currentBrandColor }}
            className="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Mở Sổ Mới Cho Năm</span>
          </button>
        )}
      </div>

      {/* 2. Stat Widgets (4 Cards Row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Số Sổ</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sổ Đang Mở</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Số Cấp Lũy Kế</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.totalIssued}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VB Đã Lưu Trữ</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalDocs}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <FolderOpen className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên sổ, mã định danh sổ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#1E60F3] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-50"
          >
            <option value="ALL">Tất cả loại sổ</option>
            <option value="INCOMING">Sổ Văn bản Đến</option>
            <option value="OUTGOING">Sổ Văn bản Đi</option>
            <option value="INTERNAL">Sổ Văn bản Nội bộ</option>
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-50"
          >
            <option value="ALL">Tất cả năm</option>
            {availableYears.map((y) => (
              <option key={y} value={y.toString()}>
                Năm {y}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-50"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang mở sổ</option>
            <option value="LOCKED">Đã khóa</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode('GRID')}
              className={`rounded-full p-1.5 transition-all cursor-pointer ${
                viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`rounded-full p-1.5 transition-all cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Xem dạng bảng"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Books Display */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          Đang tải danh sách sổ văn bản...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">Không tìm thấy sổ văn bản nào phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc thêm sổ đăng ký mới cho năm</p>
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`rounded-3xl border bg-white p-6 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between relative overflow-hidden group ${
                book.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-80'
              }`}
            >
              {/* Top Row: Type Badge + Year */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {getTypeBadge(book.type)}
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-slate-600 bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Năm {book.year}</span>
                  </span>
                </div>

                {/* Title & Code */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-[#1E60F3] transition-colors">
                    {book.name}
                  </h3>
                  <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">{book.code}</p>
                </div>

                {/* Numbering Mechanism Tag */}
                <div className="flex items-center space-x-2 pt-1">
                  <span
                    className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                      book.isAutoIncrement !== false
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {book.isAutoIncrement !== false ? (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>Tự động tăng số (+1)</span>
                      </>
                    ) : (
                      <>
                        <Hash className="h-3 w-3" />
                        <span>Nhập số thủ công</span>
                      </>
                    )}
                  </span>

                  <span className="text-[10px] text-slate-500 font-medium">
                    Bắt đầu: <strong className="text-slate-800 font-mono">{book.startNumber || 1}</strong>
                  </span>
                </div>
              </div>

              {/* Middle Metrics Box */}
              <div className="my-4 rounded-2xl bg-slate-50/80 p-4 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Số hiện tại đã cấp:</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {book.currentNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 border-t border-slate-200/60 pt-2 text-[11px]">
                  <span>Tổng văn bản lưu trữ:</span>
                  <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {book._count?.documents || 0} văn bản
                  </span>
                </div>
              </div>

              {/* Bottom Row: Status & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                {/* Active Status Badge */}
                <div>
                  {book.isActive ? (
                    <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-extrabold text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Đang mở sổ</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 text-slate-400 font-bold text-[11px]">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Đã khóa sổ</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggleLock(book)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title={book.isActive ? 'Khóa sổ này' : 'Mở lại sổ'}
                  >
                    {book.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(book)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Chỉnh sửa cấu hình sổ"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteBook(book)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa sổ (khi chưa có văn bản)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600">
                  <th className="py-3.5 px-4 font-extrabold">Mã sổ</th>
                  <th className="py-3.5 px-4 font-extrabold">Tên sổ đăng ký</th>
                  <th className="py-3.5 px-4 font-extrabold">Phân loại</th>
                  <th className="py-3.5 px-4 font-extrabold text-center">Năm</th>
                  <th className="py-3.5 px-4 font-extrabold">Cơ chế tăng số</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Số bắt đầu</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Số đã cấp</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Tổng VB</th>
                  <th className="py-3.5 px-4 font-extrabold text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1E60F3]">{book.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{book.name}</td>
                    <td className="py-3 px-4">{getTypeBadge(book.type)}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-600">{book.year}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                          book.isAutoIncrement !== false
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {book.isAutoIncrement !== false ? 'Tự động (+1)' : 'Thủ công'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                      {book.startNumber || 1}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {book.currentNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">
                      {book._count?.documents || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {book.isActive ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Mở sổ
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleToggleLock(book)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title={book.isActive ? 'Khóa sổ' : 'Mở lại sổ'}
                        >
                          {book.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(book)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL MỞ SỔ / CẤU HÌNH SỔ VĂN BẢN (CREATE PORTAL)       */}
      {/* ======================================================== */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0"
              style={{
                backgroundColor: `${currentBrandColor}10`,
              }}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl text-white font-bold shadow-xs"
                  style={{ backgroundColor: currentBrandColor }}
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: currentHeadingColor }}
                  >
                    {editingBook ? 'Cấu Hình Sổ Văn Bản' : 'Mở Sổ Đăng Ký Văn Bản Mới'}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {editingBook
                      ? 'Điều chỉnh thông tin, số hiện tại và cơ chế cấp số'
                      : 'Khởi tạo sổ đăng ký quản lý số và luân chuyển văn bản cho năm'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveBook} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              
              {/* Type & Year (2 cols) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Loại sổ văn bản <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeOrYearChange(e.target.value, formData.year)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="INCOMING">Sổ Văn bản Đến</option>
                    <option value="OUTGOING">Sổ Văn bản Đi</option>
                    <option value="INTERNAL">Sổ Văn bản Nội bộ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Năm áp dụng <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleTypeOrYearChange(formData.type, Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none font-bold font-mono"
                    required
                  />
                </div>
              </div>

              {/* Code */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã định danh sổ <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: SO-DEN-2026"
                  value={formData.code}
                  disabled={!!editingBook}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs uppercase focus:border-[#1E60F3] focus:outline-none font-mono font-bold disabled:bg-slate-100"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên sổ đăng ký <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Sổ Đăng ký Văn bản Đến năm 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none font-semibold"
                  required
                />
              </div>

              {/* CƠ CHẾ TĂNG SỐ: CÓ TĂNG TỰ ĐỘNG HAY KHÔNG */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <label className="block font-bold text-slate-800 text-xs">
                  Cơ chế cấp số đăng ký <span className="text-rose-500 font-bold">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isAutoIncrement: true })}
                    className={`rounded-2xl p-3 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      formData.isAutoIncrement
                        ? 'border-purple-600 bg-purple-50/80 ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-purple-900 text-xs">Tự động tăng</span>
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Hệ thống tự động cấp số tiếp theo (+1) khi vào sổ.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isAutoIncrement: false })}
                    className={`rounded-2xl p-3 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      !formData.isAutoIncrement
                        ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900 text-xs">Nhập thủ công</span>
                      <Hash className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Văn thư tự gõ số khi tiếp nhận hoặc phát hành.</p>
                  </button>
                </div>
              </div>

              {/* SỐ BẮT ĐẦU VÀ SỐ HIỆN TẠI ĐÃ CẤP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số bắt đầu (Start Number) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.startNumber}
                    onChange={(e) => {
                      const start = Math.max(1, Number(e.target.value));
                      setFormData({
                        ...formData,
                        startNumber: start,
                        currentNumber: !editingBook ? Math.max(0, start - 1) : formData.currentNumber,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none font-mono font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Thường đặt là 1 hoặc số nối tiếp từ sổ cũ.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số hiện tại đã cấp
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.currentNumber}
                    onChange={(e) => setFormData({ ...formData, currentNumber: Math.max(0, Number(e.target.value)) })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Số cuối cùng đã phát hành trong sổ.</p>
                </div>
              </div>

              {/* Trạng thái mở sổ / đóng sổ */}
              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Đang mở sổ tiếp nhận văn bản (Active)
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: currentBrandColor }}
                  className="inline-flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{editingBook ? 'Lưu Thay Đổi' : 'Tạo Sổ Văn Bản'}</span>
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
