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
  Edit2,
  Trash2,
  Hash,
  ArrowUpRight,
  TrendingUp,
  Folder,
  FolderOpen,
  FolderTree,
  AlertCircle,
  Clock,
  Check,
  HardDrive,
  ChevronRight,
  Inbox,
  Send,
  Radio,
  FileSpreadsheet,
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
  periodType?: 'YEAR' | 'QUARTER';
  quarter?: number;
  storagePath?: string;
  isActive: boolean;
  _count?: {
    documents: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

const FIXED_BOOK_CATEGORIES = [
  {
    type: 'INCOMING',
    title: 'Sổ Văn Bản Đến',
    codePrefix: 'SO-DEN',
    folderName: 'Van-ban-den',
    description: 'Quản lý toàn bộ công văn, văn bản đến từ cơ quan ngoài và cấp số tiếp nhận',
    color: 'blue',
    icon: Inbox,
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  {
    type: 'OUTGOING',
    title: 'Sổ Văn Bản Đi',
    codePrefix: 'SO-DI',
    folderName: 'Van-ban-di',
    description: 'Quản lý công văn, quyết định ban hành đi và tự động lấy số theo quy chuẩn',
    color: 'indigo',
    icon: Send,
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
  },
  {
    type: 'INTERNAL',
    title: 'Sổ Văn Bản Nội Bộ',
    codePrefix: 'SO-NB',
    folderName: 'Van-ban-noi-bo',
    description: 'Quản lý thông báo, phân công, chỉ đạo nội bộ trong đơn vị và các phòng ban',
    color: 'teal',
    icon: Radio,
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
  },
];

export default function DocumentBooksPage() {
  const [mounted, setMounted] = useState(false);
  const { hasRole } = useAuth();
  const { config } = useSystemConfig();

  const currentBrandColor = config?.brandTheme?.primaryColor || '#1E60F3';
  const currentHeadingColor = config?.brandTheme?.headingColor || '#190072';

  const [books, setBooks] = useState<DocumentBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<DocumentBookItem | null>(null);
  const [inspectingFolderBook, setInspectingFolderBook] = useState<DocumentBookItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'INCOMING',
    periodType: 'YEAR' as 'YEAR' | 'QUARTER',
    year: new Date().getFullYear(),
    quarter: 1,
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

  // Compute storage path for any book
  const getBookStoragePath = (book: { type: string; year: number; code?: string }) => {
    const cat = FIXED_BOOK_CATEGORIES.find((c) => c.type === book.type);
    const folder = cat ? cat.folderName : 'Khac';
    return `DOCS/${folder}/${book.year}`;
  };

  // Available Years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(books.map((b) => b.year)));
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b - a);
  }, [books]);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !searchQuery ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchYear = selectedYear === 'ALL' || b.year.toString() === selectedYear;
      const matchCat = selectedCategoryTab === 'ALL' || b.type === selectedCategoryTab;

      return matchSearch && matchYear && matchCat;
    });
  }, [books, searchQuery, selectedYear, selectedCategoryTab]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = books.length;
    const active = books.filter((b) => b.isActive).length;
    const totalDocs = books.reduce((acc, curr) => acc + (curr._count?.documents || 0), 0);
    const totalIssued = books.reduce((acc, curr) => acc + (curr.currentNumber || 0), 0);
    return { total, active, totalDocs, totalIssued };
  }, [books]);

  // Auto generate code and name for form
  const syncFormFields = (
    type: string,
    periodType: 'YEAR' | 'QUARTER',
    year: number,
    quarter: number
  ) => {
    const cat = FIXED_BOOK_CATEGORIES.find((c) => c.type === type) || FIXED_BOOK_CATEGORIES[0];
    let code = `${cat.codePrefix}-${year}`;
    let name = `${cat.title} năm ${year}`;

    if (periodType === 'QUARTER') {
      code = `${cat.codePrefix}-Q${quarter}-${year}`;
      name = `${cat.title} Quý ${quarter}/${year}`;
    }

    setFormData((prev) => ({
      ...prev,
      type,
      periodType,
      year,
      quarter,
      code: !editingBook ? code : prev.code,
      name: !editingBook ? name : prev.name,
    }));
  };

  const handleOpenCreateModal = (defaultType?: string) => {
    const currentYear = new Date().getFullYear();
    const type = defaultType || 'INCOMING';
    const cat = FIXED_BOOK_CATEGORIES.find((c) => c.type === type) || FIXED_BOOK_CATEGORIES[0];

    setEditingBook(null);
    setFormData({
      code: `${cat.codePrefix}-${currentYear}`,
      name: `${cat.title} năm ${currentYear}`,
      type,
      periodType: 'YEAR',
      year: currentYear,
      quarter: 1,
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
      periodType: (book.periodType as 'YEAR' | 'QUARTER') || 'YEAR',
      year: book.year,
      quarter: book.quarter || 1,
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
              Quản Lý Sổ Đăng Ký Văn Bản & Cấu Trúc Thư Mục
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống 3 loại sổ cố định (Đến, Đi, Nội bộ). Mỗi kỳ mở sổ tương ứng 1 thư mục lưu trữ trên server <span className="font-mono font-bold text-slate-700">DOCS/[Loại]/[Năm]/[Tháng]/</span>.
          </p>
        </div>

        {hasRole(['CLERK', 'ADMIN']) && (
          <button
            onClick={() => handleOpenCreateModal()}
            style={{ backgroundColor: currentBrandColor }}
            className="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Mở Sổ Mới (Năm / Quý)</span>
          </button>
        )}
      </div>

      {/* 2. Top Overview Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Số Kỳ Sổ</p>
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Văn Bản Lưu Trữ</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalDocs}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <HardDrive className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Global Filter & Search Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên sổ, mã sổ hoặc đường dẫn lưu trữ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#1E60F3] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Filter */}
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setSelectedCategoryTab('ALL')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả sổ (3 loại)
            </button>
            <button
              onClick={() => setSelectedCategoryTab('INCOMING')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryTab === 'INCOMING' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              VB Đến
            </button>
            <button
              onClick={() => setSelectedCategoryTab('OUTGOING')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryTab === 'OUTGOING' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              VB Đi
            </button>
            <button
              onClick={() => setSelectedCategoryTab('INTERNAL')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryTab === 'INTERNAL' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              VB Nội bộ
            </button>
          </div>

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
        </div>
      </div>

      {/* 4. Hierarchical Master List for the 3 Fixed Categories */}
      <div className="space-y-6">
        {FIXED_BOOK_CATEGORIES.filter(
          (cat) => selectedCategoryTab === 'ALL' || selectedCategoryTab === cat.type
        ).map((category) => {
          const categoryBooks = filteredBooks.filter((b) => b.type === category.type);
          const CatIcon = category.icon;

          return (
            <div
              key={category.type}
              className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden"
            >
              {/* Category Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${category.badgeBg} ${category.badgeText} ${category.badgeBorder}`}
                  >
                    <CatIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2
                        className="text-base font-black tracking-tight"
                        style={{ color: currentHeadingColor }}
                      >
                        {category.title}
                      </h2>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                        📁 DOCS/{category.folderName}/
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500 mr-1">
                    Đã mở: <strong className="text-slate-900">{categoryBooks.length}</strong> kỳ sổ
                  </span>

                  {hasRole(['CLERK', 'ADMIN']) && (
                    <button
                      onClick={() => handleOpenCreateModal(category.type)}
                      style={{ backgroundColor: currentBrandColor }}
                      className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Mở Sổ Cho Năm/Quý</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Books List for this Category */}
              {categoryBooks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Folder className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Chưa có sổ văn bản nào được mở cho mục này trong năm đã chọn.</p>
                  <p className="mt-1">Nhấn "+ Mở Sổ Cho Năm/Quý" để khởi tạo sổ và thư mục lưu trữ mới.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-5">Kỳ Mở Sổ / Tên Sổ</th>
                        <th className="py-3 px-4">Mã Định Danh</th>
                        <th className="py-3 px-4">Đường Dẫn Thư Mục Server</th>
                        <th className="py-3 px-4">Cơ Chế Tăng Số</th>
                        <th className="py-3 px-4 text-right">Số Bắt Đầu</th>
                        <th className="py-3 px-4 text-right">Số Đã Cấp</th>
                        <th className="py-3 px-4 text-right">Văn Bản Lưu</th>
                        <th className="py-3 px-4 text-center">Trạng Thái</th>
                        <th className="py-3 px-5 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryBooks.map((book) => {
                        const storagePath = getBookStoragePath(book);

                        return (
                          <tr
                            key={book.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              !book.isActive ? 'bg-slate-50/40 opacity-75' : ''
                            }`}
                          >
                            {/* Name & Period */}
                            <td className="py-3.5 px-5">
                              <div className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-[10px] text-slate-600 border border-slate-200">
                                  Năm {book.year}
                                </span>
                                <span className="font-extrabold">{book.name}</span>
                              </div>
                            </td>

                            {/* Code */}
                            <td className="py-3.5 px-4 font-mono font-bold text-[#1E60F3]">
                              {book.code}
                            </td>

                            {/* Storage Folder Path on Server */}
                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => setInspectingFolderBook(book)}
                                className="group flex items-center space-x-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer border border-slate-200/80"
                                title="Xem cấu trúc thư mục lưu trữ tháng trên server"
                              >
                                <Folder className="h-3.5 w-3.5 text-amber-500 group-hover:text-blue-600" />
                                <span className="font-bold">{storagePath}/</span>
                                <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                              </button>
                            </td>

                            {/* Numbering Mechanism Tag */}
                            <td className="py-3.5 px-4">
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
                                    <span>Tự động (+1)</span>
                                  </>
                                ) : (
                                  <>
                                    <Hash className="h-3 w-3" />
                                    <span>Thủ công</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Start Number */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                              {book.startNumber || 1}
                            </td>

                            {/* Current Number */}
                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                              {book.currentNumber}
                            </td>

                            {/* Docs Count */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {book._count?.documents || 0} VB
                              </span>
                            </td>

                            {/* Active Status */}
                            <td className="py-3.5 px-4 text-center">
                              {book.isActive ? (
                                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>Đang mở</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                                  <Lock className="h-3 w-3" />
                                  <span>Đã khóa</span>
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => setInspectingFolderBook(book)}
                                  className="p-1.5 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Xem cây thư mục lưu file"
                                >
                                  <FolderTree className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() => handleToggleLock(book)}
                                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title={book.isActive ? 'Khóa sổ này' : 'Mở lại sổ'}
                                >
                                  {book.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 text-emerald-600" />}
                                </button>

                                <button
                                  onClick={() => handleOpenEditModal(book)}
                                  className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Chỉnh sửa cấu hình sổ"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteBook(book)}
                                  className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Xóa sổ (khi chưa có văn bản)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODAL MỞ SỔ / CẤU HÌNH SỔ VĂN BẢN (CREATE / EDIT PORTAL) */}
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
                      ? 'Điều chỉnh thông tin, số bắt đầu, số hiện tại và cơ chế cấp số'
                      : 'Khởi tạo sổ theo kỳ (Năm / Quý) và định cấu trúc thư mục lưu file trên server'}
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
              
              {/* 1. Chọn loại sổ cố định */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Loại sổ văn bản cố định <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FIXED_BOOK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.type}
                      type="button"
                      disabled={!!editingBook}
                      onClick={() => syncFormFields(cat.type, formData.periodType, formData.year, formData.quarter)}
                      className={`rounded-2xl p-2.5 border text-center transition-all cursor-pointer ${
                        formData.type === cat.type
                          ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      } ${editingBook ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <p className="text-xs font-extrabold">{cat.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{cat.folderName}/</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Chu kỳ mở sổ: Theo Năm hoặc Theo Quý */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    Chu kỳ mở sổ <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => syncFormFields(formData.type, 'YEAR', formData.year, formData.quarter)}
                      className={`rounded-full px-3 py-1 font-bold transition-all cursor-pointer ${
                        formData.periodType === 'YEAR' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Theo Năm
                    </button>
                    <button
                      type="button"
                      onClick={() => syncFormFields(formData.type, 'QUARTER', formData.year, formData.quarter)}
                      className={`rounded-full px-3 py-1 font-bold transition-all cursor-pointer ${
                        formData.periodType === 'QUARTER' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Theo Quý
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Năm áp dụng <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => syncFormFields(formData.type, formData.periodType, Number(e.target.value), formData.quarter)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none font-bold font-mono"
                      required
                    />
                  </div>

                  {formData.periodType === 'QUARTER' ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Chọn Quý <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        value={formData.quarter}
                        onChange={(e) => syncFormFields(formData.type, formData.periodType, formData.year, Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none font-bold cursor-pointer"
                      >
                        <option value={1}>Quý 1 (Tháng 01 - 03)</option>
                        <option value={2}>Quý 2 (Tháng 04 - 06)</option>
                        <option value={3}>Quý 3 (Tháng 07 - 09)</option>
                        <option value={4}>Quý 4 (Tháng 10 - 12)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center text-[11px] text-slate-500">
                      <span>Cả năm {formData.year}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Tự động chia 12 folder tháng</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Mã định danh & Tên sổ */}
              <div className="space-y-3">
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
              </div>

              {/* 4. Preview Đường Dẫn Lưu Trữ Trên Server */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <Folder className="h-4 w-4 text-amber-600" />
                  <span>Đường dẫn lưu file đính kèm trên server:</span>
                </div>
                <p className="font-mono text-xs font-extrabold text-blue-800 bg-white px-3 py-1.5 rounded-xl border border-amber-200">
                  📁 DOCS/{FIXED_BOOK_CATEGORIES.find((c) => c.type === formData.type)?.folderName}/{formData.year}/[Thang_01..12]/
                </p>
                <p className="text-[10px] text-slate-500">
                  Hệ thống sẽ tự động phân loại tệp vào folder tháng tương ứng dựa trên ngày phát hành / tiếp nhận văn bản.
                </p>
              </div>

              {/* 5. CƠ CHẾ TĂNG SỐ: CÓ TĂNG TỰ ĐỘNG HAY KHÔNG */}
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
                      <span className="font-extrabold text-purple-900 text-xs">Tự động tăng (+1)</span>
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

              {/* 6. SỐ BẮT ĐẦU VÀ SỐ HIỆN TẠI ĐÃ CẤP */}
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

      {/* ======================================================== */}
      {/* MODAL XEM CÂY THƯ MỤC LƯU FILE TRÊN SERVER (TREE MODAL) */}
      {/* ======================================================== */}
      {inspectingFolderBook && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-xs">
                  <FolderTree className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Cấu Trúc Thư Mục Lưu File Trên Server
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {getBookStoragePath(inspectingFolderBook)}/
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingFolderBook(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tree View Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
              <div className="rounded-2xl bg-slate-900 text-emerald-400 p-4 leading-relaxed overflow-x-auto shadow-inner">
                <p className="text-slate-400 font-bold">// Cây thư mục lưu trữ file đính kèm trên Server</p>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-amber-400 font-bold">📂 DOCS/</p>
                  <p className="pl-4 text-blue-400 font-bold">
                    └── 📂 {FIXED_BOOK_CATEGORIES.find((c) => c.type === inspectingFolderBook.type)?.folderName}/
                  </p>
                  <p className="pl-8 text-indigo-300 font-extrabold">
                    └── 📂 {inspectingFolderBook.year}/ <span className="text-slate-400 font-normal">({inspectingFolderBook.name})</span>
                  </p>
                  
                  {/* 12 Months breakdown */}
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const monthStr = (idx + 1).toString().padStart(2, '0');
                    const isCurrentMonth = new Date().getMonth() === idx && inspectingFolderBook.year === new Date().getFullYear();
                    
                    return (
                      <p key={idx} className={`pl-12 flex items-center justify-between ${isCurrentMonth ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                        <span>├── 📁 Thang_{monthStr}/</span>
                        <span className="text-[10px] text-slate-500">
                          {isCurrentMonth ? '● Đang ghi file hiện tại' : 'Tự động phân loại theo ngày'}
                        </span>
                      </p>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 space-y-1.5 font-sans">
                <p className="font-bold text-blue-900 text-xs">💡 Nguyên lý vận hành lưu trữ:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-blue-800">
                  <li>Khi người dùng tải lên tệp đính kèm (PDF, Word, Scan...), hệ thống căn cứ theo loại văn bản và ngày tháng tiếp nhận để tạo tự động đường dẫn.</li>
                  <li>Cấu trúc phân cấp <strong className="font-mono">DOCS / [Loại_VB] / [Năm] / [Tháng] / [Tên_file]</strong> giúp máy chủ dễ dàng sao lưu (backup), phân quyền và bảo mật dữ liệu.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setInspectingFolderBook(null)}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
