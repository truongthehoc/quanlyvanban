'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Info,
  Lock,
  RotateCcw,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function PermissionMatrixPage() {
  const { refreshData } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/matrix');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setPermissions(data.permissions || []);
        setMatrixData(data.matrix || []);
      }
    } catch (err) {
      console.error('Error fetching permission matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleToggle = async (roleId: string, permissionId: string, currentEnabled: boolean) => {
    const key = `${roleId}_${permissionId}`;
    setUpdatingKey(key);

    try {
      const res = await fetch('/api/admin/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          permissionId,
          enabled: !currentEnabled,
        }),
      });

      if (res.ok) {
        setMatrixData((prev) =>
          prev.map((item) => {
            if (item.roleId === roleId) {
              const hasPerm = item.permissionIds.includes(permissionId);
              const newPerms = hasPerm
                ? item.permissionIds.filter((p: string) => p !== permissionId)
                : [...item.permissionIds, permissionId];
              return { ...item, permissionIds: newPerms };
            }
            return item;
          })
        );

        setToastMessage('Đã cập nhật quyền hạn trong MySQL thành công!');
        setTimeout(() => setToastMessage(null), 3000);
        await refreshData();
      }
    } catch (err) {
      console.error('Error updating permission:', err);
    } finally {
      setUpdatingKey(null);
    }
  };

  const groupedPermissions: Record<string, any[]> = {};
  permissions.forEach((p) => {
    const mod = p.module || 'OTHER';
    if (!groupedPermissions[mod]) groupedPermissions[mod] = [];
    groupedPermissions[mod].push(p);
  });

  const getModuleName = (moduleKey: string) => {
    switch (moduleKey) {
      case 'DASHBOARD':
        return '1. Bảng điều khiển & Thống kê';
      case 'DOC_IN':
        return '2. Quản lý Văn bản Đến';
      case 'DOC_OUT':
        return '3. Quản lý Văn bản Đi';
      case 'DOC_INTERNAL':
        return '4. Quản lý Văn bản Nội bộ';
      case 'BOOKS':
        return '5. Quản lý Sổ Văn bản';
      case 'SYSTEM':
        return '6. Quản trị Danh mục & Hệ thống';
      default:
        return moduleKey;
    }
  };

  const getRoleNameVi = (code: string) => {
    switch (code) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'LEADER':
        return 'Ban Giám đốc';
      case 'CLERK':
        return 'Cán bộ Văn thư';
      case 'HEAD_DEPT':
        return 'Trưởng Phòng ban';
      case 'OFFICER':
        return 'Chuyên viên';
      default:
        return code;
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Area with Rounded Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Ma Trận Phân Quyền Động (RBAC Matrix)
            </h1>
            <Info className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bật/tắt quyền truy cập danh mục & chức năng cho từng vai trò trong hệ thống.
          </p>
        </div>

        <button
          onClick={fetchMatrix}
          className="flex items-center space-x-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 text-slate-500" />
          <span>Tải lại dữ liệu</span>
        </button>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="flex items-center space-x-2 rounded-full bg-emerald-50 px-5 py-3 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. RBAC Matrix Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                <th className="py-4 px-5 w-80 font-bold text-slate-800">
                  Chức năng / Quyền hạn hệ thống
                </th>
                <th className="py-4 px-4 w-36 font-bold text-slate-500 font-mono">Mã quyền (Code)</th>
                {roles.map((role) => (
                  <th key={role.id} className="py-4 px-3 text-center font-bold text-slate-800 w-32">
                    <div className="text-xs">{getRoleNameVi(role.code)}</div>
                    <div className="font-mono text-[10px] text-[#1E60F3] font-bold mt-0.5">{role.code}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={2 + roles.length} className="py-14 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Đang tải ma trận phân quyền RBAC...</span>
                  </td>
                </tr>
              ) : (
                Object.keys(groupedPermissions).map((moduleKey) => {
                  const perms = groupedPermissions[moduleKey];

                  return (
                    <React.Fragment key={moduleKey}>
                      {/* Group Header */}
                      <tr className="bg-slate-100/70 border-y border-slate-200 font-bold text-slate-800">
                        <td colSpan={2 + roles.length} className="py-3 px-5 text-xs tracking-wide">
                          {getModuleName(moduleKey)}
                        </td>
                      </tr>

                      {/* Permissions Rows */}
                      {perms.map((perm) => (
                        <tr key={perm.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5">
                            <span className="font-semibold text-slate-900">{perm.name}</span>
                            {perm.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{perm.description}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-medium">
                            {perm.code}
                          </td>

                          {roles.map((role) => {
                            const isSystemAdmin = role.code === 'ADMIN';
                            const roleMatrix = matrixData.find((m) => m.roleId === role.id);
                            const isEnabled = isSystemAdmin || (roleMatrix?.permissionIds.includes(perm.id) ?? false);
                            const isUpdating = updatingKey === `${role.id}_${perm.id}`;

                            return (
                              <td key={role.id} className="py-3.5 px-3 text-center">
                                {isSystemAdmin ? (
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200" title="Toàn quyền hệ thống">
                                    <Check className="h-4 w-4" />
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleToggle(role.id, perm.id, isEnabled)}
                                    disabled={isUpdating}
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all focus:outline-none ${
                                      isEnabled
                                        ? 'bg-[#1E60F3] text-white shadow-sm hover:bg-blue-700'
                                        : 'border border-slate-200 bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'
                                    }`}
                                    title={isEnabled ? 'Bấm để tắt quyền' : 'Bấm để cấp quyền'}
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isEnabled ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
