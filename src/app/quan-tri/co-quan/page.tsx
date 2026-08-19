'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Landmark,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  Filter,
  Info,
  Building,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function OrganizationsAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [deletingOrg, setDeletingOrg] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryToast, setCategoryToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    type: 'GOVERNMENT',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  });

  const [categoryFormData, setCategoryFormData] = useState({
    code: '',
    name: '',
    color: 'blue',
    order: 1,
    description: '',
  });

  const showCatToast = (text: string, type: 'success' | 'error' = 'success') => {
    setCategoryToast({ text, type });
    setTimeout(() => setCategoryToast(null), 3000);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/organization-categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (!editingCat) {
          const maxOrder = data.reduce((max: number, c: any) => Math.max(max, c.order || 0), 0);
          setCategoryFormData((prev) => ({ ...prev, order: maxOrder + 1 }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        type: typeFilter,
      });
      const res = await fetch(`/api/admin/organizations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrgs();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingOrg ? 'PATCH' : 'POST';
      const bodyData = editingOrg ? { ...formData, id: editingOrg.id } : formData;

      const res = await fetch('/api/admin/organizations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingOrg(null);
        setFormData({
          code: '',
          name: '',
          shortName: '',
          type: categories[0]?.code || 'GOVERNMENT',
          email: '',
          phone: '',
          address: '',
          contactPerson: '',
        });
        fetchOrgs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrg) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations?id=${deletingOrg.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletingOrg(null);
        fetchOrgs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name || (!editingCat && !categoryFormData.code)) {
      showCatToast('Vui lòng nhập đầy đủ thông tin phân loại', 'error');
      return;
    }
    setCategoryLoading(true);
    try {
      if (editingCat) {
        const res = await fetch('/api/admin/organization-categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCat.id,
            name: categoryFormData.name,
            color: categoryFormData.color,
            order: Number(categoryFormData.order) || 1,
            description: categoryFormData.description,
          }),
        });
        if (res.ok) {
          showCatToast('Đã cập nhật phân loại thành công');
          setEditingCat(null);
          setCategoryFormData({ code: '', name: '', color: 'blue', order: categories.length + 1, description: '' });
          fetchCategories();
        } else {
          const data = await res.json();
          showCatToast(data.error || 'Lỗi khi cập nhật', 'error');
        }
      } else {
        const res = await fetch('/api/admin/organization-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...categoryFormData,
            order: Number(categoryFormData.order) || 1,
          }),
        });
        if (res.ok) {
          showCatToast('Đã thêm phân loại mới thành công');
          setCategoryFormData({ code: '', name: '', color: 'blue', order: categories.length + 2, description: '' });
          fetchCategories();
        } else {
          const data = await res.json();
          showCatToast(data.error || 'Lỗi khi tạo phân loại', 'error');
        }
      }
    } catch (err) {
      showCatToast('Lỗi hệ thống', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleStartEditCat = (cat: any) => {
    setEditingCat(cat);
    setCategoryFormData({
      code: cat.code,
      name: cat.name,
      color: cat.color || 'blue',
      order: cat.order || 1,
      description: cat.description || '',
    });
  };

  const handleCancelEditCat = () => {
    setEditingCat(null);
    const maxOrder = categories.reduce((max: number, c: any) => Math.max(max, c.order || 0), 0);
    setCategoryFormData({ code: '', name: '', color: 'blue', order: maxOrder + 1, description: '' });
  };

  const handleDeleteCategory = async (id: string, code: string) => {
    try {
      const res = await fetch(`/api/admin/organization-categories?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showCatToast('Đã xóa phân loại');
        fetchCategories();
      } else {
        const data = await res.json();
        showCatToast(data.error || 'Không thể xóa phân loại này', 'error');
      }
    } catch (err) {
      showCatToast('Lỗi hệ thống', 'error');
    }
  };

  const BADGE_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  };

  const getTypeBadge = (type: string) => {
    const found = categories.find((c) => c.code === type);
    const colorKey = found?.color || (type === 'GOVERNMENT' ? 'blue' : type === 'DEPARTMENT' ? 'purple' : type === 'ENTERPRISE' ? 'amber' : 'teal');
    const colorStyle = BADGE_COLOR_MAP[colorKey] || BADGE_COLOR_MAP.blue;
    const displayName = found?.name?.split('(')[0]?.trim() || (type === 'GOVERNMENT' ? 'Cơ quan Nhà nước' : type === 'DEPARTMENT' ? 'Sở ban ngành' : type === 'ENTERPRISE' ? 'Doanh nghiệp / Bưu chính' : type === 'PARTNER' ? 'Đối tác' : type);

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}>
        {displayName}
      </span>
    );
  };

  // Stats
  const countGov = organizations.filter((o) => o.type === 'GOVERNMENT').length;
  const countDept = organizations.filter((o) => o.type === 'DEPARTMENT').length;
  const countEnter = organizations.filter((o) => o.type === 'ENTERPRISE' || o.type === 'PARTNER').length;

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Header Area with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Danh Mục Cơ Quan / Đơn Vị Bên Ngoài
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh bạ cơ quan ban hành (Nơi gửi của VB Đến) và đơn vị nhận (Nơi nhận của VB Đi).
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center space-x-1.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Building className="h-4 w-4 text-purple-600" />
            <span>Phân Loại Đơn Vị ({categories.length})</span>
          </button>

          <button
            onClick={() => {
              setEditingOrg(null);
              setFormData({
                code: '',
                name: '',
                shortName: '',
                type: categories[0]?.code || 'GOVERNMENT',
                email: '',
                phone: '',
                address: '',
                contactPerson: '',
              });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Cơ Quan / Đơn Vị</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Widgets (4 Cards Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1 */}
        <div
          onClick={() => setTypeFilter('ALL')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            typeFilter === 'ALL' ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số đơn vị</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{organizations.length}</p>
            <p className="text-xs text-slate-400 font-medium">Trong danh mục liên thông</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3]">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => setTypeFilter('GOVERNMENT')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            typeFilter === 'GOVERNMENT' ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Cơ quan Nhà nước</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{countGov}</p>
            <p className="text-xs text-slate-400 font-medium">UBND, Bộ, Ngành, BHXH</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => setTypeFilter('DEPARTMENT')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            typeFilter === 'DEPARTMENT' ? 'ring-2 ring-purple-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Sở ban ngành</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{countDept}</p>
            <p className="text-xs text-slate-400 font-medium">Sở Y tế, Tài chính, KH&CN...</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Building className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => setTypeFilter('ENTERPRISE')}
          className={`cursor-pointer rounded-2xl border p-5 sm:p-6 bg-white shadow-sm transition-all hover:shadow-md flex items-center justify-between ${
            typeFilter === 'ENTERPRISE' ? 'ring-2 ring-amber-500 border-transparent' : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Doanh nghiệp / Đối tác</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{countEnter}</p>
            <p className="text-xs text-slate-400 font-medium">Bưu điện VNPost, đối tác</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* 3. Search & Filter Bar with Rounded Pills */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Tìm theo tên cơ quan, mã, tên viết tắt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs focus:border-[#1E60F3] focus:outline-none placeholder:text-slate-400 shadow-sm"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </form>

        <div className="flex items-center space-x-2 text-xs w-full sm:w-auto justify-end">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">Loại đơn vị:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 focus:border-[#1E60F3] focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="ALL">Tất cả loại cơ quan</option>
            {categories.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name.split('(')[0].trim()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Table Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                <th className="py-3.5 px-4 sm:px-5 w-32 font-bold text-slate-800">Mã cơ quan</th>
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Tên cơ quan / Đơn vị & Tên tắt</th>
                <th className="py-3.5 px-4 sm:px-5 w-44 font-bold text-slate-800">Phân loại</th>
                <th className="py-3.5 px-4 sm:px-5 w-52 font-bold text-slate-800">Thông tin liên hệ</th>
                <th className="py-3.5 px-4 sm:px-5 w-64 font-bold text-slate-800">Địa chỉ trụ sở</th>
                <th className="py-3.5 px-4 sm:px-5 w-28 text-center font-bold text-slate-800">VB liên kết</th>
                <th className="py-3.5 px-4 sm:px-5 w-24 text-right font-bold text-slate-800">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách cơ quan / đơn vị...
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy cơ quan / đơn vị nào.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => {
                  const docCount = (org._count?.incomingDocuments || 0) + (org._count?.outgoingDocuments || 0);

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Mã */}
                      <td className="py-4 px-4 sm:px-5 font-mono font-bold text-[#1E60F3]">
                        {org.code}
                      </td>

                      {/* Tên & Tên tắt */}
                      <td className="py-4 px-4 sm:px-5">
                        <div className="font-bold text-slate-900 text-xs">{org.name}</div>
                        {org.shortName && org.shortName !== org.name && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            Tên viết tắt: <strong className="text-slate-600">{org.shortName}</strong>
                          </div>
                        )}
                      </td>

                      {/* Phân loại */}
                      <td className="py-4 px-4 sm:px-5">
                        {getTypeBadge(org.type)}
                      </td>

                      {/* Liên hệ */}
                      <td className="py-4 px-4 sm:px-5 text-slate-600 space-y-1">
                        {org.contactPerson && (
                          <div className="font-bold text-slate-900 text-xs flex items-center space-x-1 mb-0.5">
                            <span className="text-[10px] text-slate-400 font-normal">LH:</span>
                            <span>{org.contactPerson}</span>
                          </div>
                        )}
                        {org.email && (
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{org.email}</span>
                          </div>
                        )}
                        {org.phone && (
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <Phone className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span>{org.phone}</span>
                          </div>
                        )}
                        {!org.email && !org.phone && !org.contactPerson && <span className="text-slate-400">---</span>}
                      </td>

                      {/* Địa chỉ */}
                      <td className="py-4 px-4 sm:px-5 text-slate-600 text-[11px] leading-relaxed">
                        {org.address || '---'}
                      </td>

                      {/* VB Liên kết */}
                      <td className="py-4 px-4 sm:px-5 text-center">
                        <span className="inline-flex items-center space-x-1 rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-bold text-slate-700">
                          <FileText className="h-3 w-3 text-slate-400" />
                          <span>{docCount} VB</span>
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 sm:px-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingOrg(org);
                              setFormData({
                                code: org.code,
                                name: org.name,
                                shortName: org.shortName || org.name,
                                type: org.type,
                                email: org.email || '',
                                phone: org.phone || '',
                                address: org.address || '',
                                contactPerson: org.contactPerson || '',
                              });
                              setShowModal(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingOrg(org)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL (Rendered via Portal to document.body) */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingOrg ? 'Chỉnh Sửa Cơ Quan / Đơn Vị' : 'Thêm Cơ Quan / Đơn Vị Mới'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Được dùng làm Nơi gửi của VB Đến và Nơi nhận của VB Đi.
                </p>
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã cơ quan <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập mã cơ quan..."
                    value={formData.code}
                    disabled={!!editingOrg}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs uppercase focus:border-[#1E60F3] focus:outline-none disabled:bg-slate-100 font-mono"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên viết tắt</label>
                  <input
                    type="text"
                    placeholder="Nhập tên viết tắt..."
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên đầy đủ Cơ quan / Đơn vị <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên đầy đủ cơ quan / đơn vị..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Phân loại cơ quan / đơn vị <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-[11px] font-bold text-[#1E60F3] hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Thêm phân loại</span>
                  </button>
                </div>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Người liên hệ
                </label>
                <input
                  type="text"
                  placeholder="Nhập họ tên người liên hệ..."
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email liên hệ / Điện tử</label>
                  <input
                    type="email"
                    placeholder="Nhập địa chỉ email..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở</label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ trụ sở..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#1E60F3] px-6 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {editingOrg ? 'Lưu Thay Đổi' : 'Thêm Cơ Quan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL QUẢN LÝ PHÂN LOẠI CƠ QUAN / ĐƠN VỊ (EXPANDED WIDE) */}
      {/* ======================================================== */}
      {showCategoryModal && mounted && createPortal(
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50/80 px-6 py-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white font-bold shadow-md shadow-purple-500/20">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Quản Lý Phân Loại Cơ Quan / Đơn Vị
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Sắp xếp thứ tự (STT) và tùy chỉnh các phân loại cơ quan bên ngoài trong toàn hệ thống
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-purple-100/80 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body (2 Columns Layout) */}
            <div className="flex-1 overflow-y-auto p-6 text-xs space-y-4">
              
              {/* Toast inside modal */}
              {categoryToast && (
                <div
                  className={`flex items-center space-x-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-white shadow-sm animate-in fade-in ${
                    categoryToast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{categoryToast.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. Left Column: Table of Categories (Col Span 7) */}
                <div className="lg:col-span-7 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                      <span>Danh sách phân loại hiện có</span>
                      <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-bold">
                        {categories.length}
                      </span>
                    </h3>
                    <span className="text-[11px] text-slate-400 italic">
                      * Thứ tự hiển thị theo STT
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3 text-center w-12">STT</th>
                          <th className="py-2.5 px-3">Tên Phân Loại & Huy Hiệu</th>
                          <th className="py-2.5 px-3 text-center w-24">Số Đơn Vị</th>
                          <th className="py-2.5 px-3 text-right w-20">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {categories.map((cat, idx) => {
                          const mappedCount = organizations.filter((o) => o.type === cat.code).length;
                          const isSelected = editingCat?.id === cat.id;

                          return (
                            <tr
                              key={cat.id}
                              className={`transition-colors ${
                                isSelected ? 'bg-purple-50/80 font-medium' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              {/* STT */}
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-purple-800 font-mono">
                                  {cat.order || idx + 1}
                                </span>
                              </td>

                              {/* Huy hiệu & Tên */}
                              <td className="py-3 px-3 space-y-1">
                                <div className="flex items-center space-x-2">
                                  {getTypeBadge(cat.code)}
                                  <span className="font-mono text-[10px] text-slate-400 font-bold">
                                    {cat.code}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium line-clamp-1">
                                  {cat.name}
                                </div>
                              </td>

                              {/* Số đơn vị */}
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center space-x-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                                  <span>{mappedCount}</span>
                                </span>
                              </td>

                              {/* Thao tác */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditCat(cat)}
                                    className="p-1.5 rounded-full text-[#1E60F3] hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Sửa phân loại này"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>

                                  {!cat.isDefault && mappedCount === 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(cat.id, cat.code)}
                                      className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Xóa phân loại này"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Right Column: Form Create / Edit Category (Col Span 5) */}
                <div className="lg:col-span-5">
                  <form
                    onSubmit={handleSaveCategory}
                    className={`rounded-2xl border p-4.5 space-y-3.5 transition-all shadow-xs ${
                      editingCat ? 'border-purple-300 bg-purple-50/50' : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                      <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                        {editingCat ? (
                          <>
                            <Edit2 className="h-3.5 w-3.5 text-purple-600" />
                            <span>Chỉnh Sửa Phân Loại</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 text-purple-600" />
                            <span>Thêm Phân Loại Mới</span>
                          </>
                        )}
                      </h3>

                      {editingCat && (
                        <button
                          type="button"
                          onClick={handleCancelEditCat}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Hủy sửa
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {/* STT Input */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          STT <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="1, 2..."
                          value={categoryFormData.order}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, order: Number(e.target.value) || 1 })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-center font-bold font-mono focus:border-purple-600 focus:outline-none"
                          required
                        />
                      </div>

                      {/* Mã phân loại */}
                      <div className="col-span-2">
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          Mã phân loại <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="BENH_VIEN, TRUONG_HOC..."
                          value={categoryFormData.code}
                          disabled={!!editingCat}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value.toUpperCase() })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono uppercase focus:border-purple-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Tên phân loại */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        Tên phân loại <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tên phân loại cơ quan / đơn vị..."
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-purple-600 focus:outline-none font-semibold"
                        required
                      />
                    </div>

                    {/* Color Choice */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">
                        Màu sắc nhận diện huy hiệu
                      </label>
                      <div className="flex items-center space-x-2">
                        {[
                          { key: 'blue', name: 'Xanh dương', class: 'bg-blue-600' },
                          { key: 'purple', name: 'Tím', class: 'bg-purple-600' },
                          { key: 'amber', name: 'Vàng cam', class: 'bg-amber-500' },
                          { key: 'emerald', name: 'Xanh lá', class: 'bg-emerald-600' },
                          { key: 'rose', name: 'Hồng đỏ', class: 'bg-rose-600' },
                          { key: 'indigo', name: 'Chàm', class: 'bg-indigo-600' },
                          { key: 'teal', name: 'Xanh ngọc', class: 'bg-teal-600' },
                        ].map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => setCategoryFormData({ ...categoryFormData, color: c.key })}
                            className={`h-6 w-6 rounded-full transition-all cursor-pointer ${c.class} ${
                              categoryFormData.color === c.key ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                            }`}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Mô tả ngắn */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        Mô tả tóm tắt (Tùy chọn)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Nhập mô tả tóm tắt phạm vi phân loại..."
                        value={categoryFormData.description}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-purple-600 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-purple-100">
                      {editingCat && (
                        <button
                          type="button"
                          onClick={handleCancelEditCat}
                          className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={categoryLoading}
                        className="inline-flex items-center space-x-1.5 rounded-full bg-purple-600 px-5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{categoryLoading ? 'Đang lưu...' : editingCat ? 'Cập Nhật' : 'Tạo Phân Loại'}</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL XÁC NHẬN XÓA CƠ QUAN / ĐƠN VỊ (BEAUTIFUL DELETE DIALOG) */}
      {/* ======================================================== */}
      {deletingOrg && mounted && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-sm border border-rose-100">
              <Trash2 className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Xác Nhận Xóa Cơ Quan?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hành động này sẽ xóa cơ quan / đơn vị khỏi danh mục và không thể hoàn tác.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-left space-y-1.5 font-mono">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="font-sans">Tên cơ quan:</span>
                <span className="text-rose-700 font-sans truncate max-w-[180px]">{deletingOrg.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-sans">Mã cơ quan:</span>
                <span className="text-blue-700 font-bold">{deletingOrg.code}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOrg(null)}
                className="rounded-full border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {deleteLoading ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
