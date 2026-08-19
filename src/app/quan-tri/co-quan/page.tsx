'use client';

import React, { useState, useEffect } from 'react';
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
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    type: 'GOVERNMENT',
    email: '',
    phone: '',
    address: '',
  });

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
          type: 'GOVERNMENT',
          email: '',
          phone: '',
          address: '',
        });
        fetchOrgs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cơ quan "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/organizations?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchOrgs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'GOVERNMENT':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
            Cơ quan Nhà nước
          </span>
        );
      case 'DEPARTMENT':
        return (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
            Sở ban ngành
          </span>
        );
      case 'ENTERPRISE':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
            Doanh nghiệp / Bưu chính
          </span>
        );
      case 'PARTNER':
        return (
          <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-100">
            Đối tác / Hiệp hội
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {type}
          </span>
        );
    }
  };

  // Stats
  const countGov = organizations.filter((o) => o.type === 'GOVERNMENT').length;
  const countDept = organizations.filter((o) => o.type === 'DEPARTMENT').length;
  const countEnter = organizations.filter((o) => o.type === 'ENTERPRISE' || o.type === 'PARTNER').length;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Area */}
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

        <button
          onClick={() => {
            setEditingOrg(null);
            setFormData({
              code: '',
              name: '',
              shortName: '',
              type: 'GOVERNMENT',
              email: '',
              phone: '',
              address: '',
            });
            setShowModal(true);
          }}
          className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Cơ Quan / Đơn Vị</span>
        </button>
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
            <option value="GOVERNMENT">Cơ quan Nhà nước</option>
            <option value="DEPARTMENT">Sở ban ngành</option>
            <option value="ENTERPRISE">Doanh nghiệp / Bưu chính</option>
            <option value="PARTNER">Đối tác / Khác</option>
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
                        {!org.email && !org.phone && <span className="text-slate-400">---</span>}
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
                              });
                              setShowModal(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-[#1E60F3] hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(org.id, org.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 transition-colors"
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

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                  <label className="block font-bold text-slate-700 mb-1">Mã cơ quan *</label>
                  <input
                    type="text"
                    placeholder="VD: UBND-BD"
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
                    placeholder="VD: UBND tỉnh Bình Dương"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên đầy đủ Cơ quan / Đơn vị *</label>
                <input
                  type="text"
                  placeholder="VD: Ủy ban Nhân dân tỉnh Bình Dương"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phân loại cơ quan / đơn vị</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none cursor-pointer"
                >
                  <option value="GOVERNMENT">Cơ quan Nhà nước (UBND, Bộ, Ngành, BHXH...)</option>
                  <option value="DEPARTMENT">Sở ban ngành địa phương (Sở Y tế, Tài chính, GD&ĐT...)</option>
                  <option value="ENTERPRISE">Doanh nghiệp / Đơn vị Bưu chính</option>
                  <option value="PARTNER">Đối tác / Tổ chức khác</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email liên hệ / Điện tử</label>
                  <input
                    type="email"
                    placeholder="vanthu@binhduong.gov.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#1E60F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0274.3822..."
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
                  placeholder="Trung tâm Hành chính tỉnh, TP. Thủ Dầu Một..."
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
                  className="rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#1E60F3] px-6 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  {editingOrg ? 'Lưu Thay Đổi' : 'Thêm Cơ Quan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
