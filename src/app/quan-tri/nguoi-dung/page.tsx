'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Building2,
  Shield,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Info,
  CheckCircle2,
  X,
  UserCheck,
} from 'lucide-react';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Area with Rounded Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Danh Mục Tài Khoản & Người Dùng
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tài khoản cán bộ, chuyên viên, phân quyền vai trò và đơn vị công tác.
          </p>
        </div>

        <button
          onClick={() => alert('Chức năng thêm người dùng đang mở trong chế độ Quản trị viên.')}
          className="flex items-center space-x-2 rounded-full bg-[#1E60F3] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Người Dùng</span>
        </button>
      </div>

      {/* 2. Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng người dùng</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{users.length}</p>
            <p className="text-xs text-slate-400 font-medium">Tài khoản trong hệ thống</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1E60F3]">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đang hoạt động</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{users.filter((u) => u.isActive).length}</p>
            <p className="text-xs text-slate-400 font-medium">Trạng thái Active</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Lãnh đạo & Quản lý</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {users.filter((u) => u.roles?.some((r: any) => ['LEADER', 'HEAD_DEPT', 'ADMIN'].includes(r.role?.code))).length}
            </p>
            <p className="text-xs text-slate-400 font-medium">Giám đốc, Trưởng phòng</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Shield className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Văn thư & Chuyên viên</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {users.filter((u) => u.roles?.some((r: any) => ['CLERK', 'OFFICER'].includes(r.role?.code))).length}
            </p>
            <p className="text-xs text-slate-400 font-medium">Tiếp nhận & Thực thi</p>
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. Search Bar with Rounded Input */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Tìm theo họ tên, username, chức vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
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
                <th className="py-3.5 px-4 sm:px-5 font-bold text-slate-800">Cán bộ / Họ và tên</th>
                <th className="py-3.5 px-4 sm:px-5 w-36 font-bold text-slate-800">Tên đăng nhập</th>
                <th className="py-3.5 px-4 sm:px-5 w-44 font-bold text-slate-800">Chức vụ</th>
                <th className="py-3.5 px-4 sm:px-5 w-48 font-bold text-slate-800">Phòng ban</th>
                <th className="py-3.5 px-4 sm:px-5 w-48 font-bold text-slate-800">Vai trò (Roles)</th>
                <th className="py-3.5 px-4 sm:px-5 w-28 text-center font-bold text-slate-800">Trạng thái</th>
                <th className="py-3.5 px-4 sm:px-5 w-20 text-right font-bold text-slate-800">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="py-4 px-4 sm:px-5">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                          {u.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-[11px] text-slate-400">{u.email || 'Chưa cập nhật email'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-5 font-mono font-semibold text-slate-700">
                      {u.username}
                    </td>

                    <td className="py-4 px-4 sm:px-5 font-semibold text-slate-800">
                      {u.position}
                    </td>

                    <td className="py-4 px-4 sm:px-5 text-slate-600 font-medium">
                      {u.department?.name || '---'}
                    </td>

                    <td className="py-4 px-4 sm:px-5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((ur: any) => (
                          <span
                            key={ur.role?.code}
                            className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100"
                          >
                            {ur.role?.code}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-5 text-center">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                        Hoạt động
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

    </div>
  );
}
