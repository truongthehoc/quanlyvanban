'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import { useSystemConfig, VersionLog, CustomColorItem } from '@/lib/system-config-context';
import {
  Settings,
  Building2,
  Palette,
  Rocket,
  Upload,
  Check,
  Sparkles,
  Save,
  Plus,
  History,
  FileText,
  Clock,
  User,
  X,
  CheckCircle2,
  Trash2,
  MousePointerClick,
  Type,
} from 'lucide-react';

export default function SystemConfigPage() {
  const [mounted, setMounted] = useState(false);
  const { currentUser } = useAuth();
  const { config, updateAdminInfo, updateBrandTheme, updateSoftwareInfo, releaseNewVersion, calculateNextVersion } =
    useSystemConfig();

  const [activeTab, setActiveTab] = useState<'admin' | 'brand' | 'software'>('brand');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [adminForm, setAdminForm] = useState(config.adminInfo);
  const [brandForm, setBrandForm] = useState(config.brandTheme);
  const [softwareForm, setSoftwareForm] = useState(config.softwareInfo);

  // Add new color state
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#190072');

  // Modal Release Version
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseType, setReleaseType] = useState<'PATCH' | 'MINOR' | 'MAJOR' | 'CUSTOM'>('PATCH');
  const [customVerInput, setCustomVerInput] = useState('');
  const [changelogInput, setChangelogInput] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAdminForm(config.adminInfo);
    setBrandForm(config.brandTheme);
    setSoftwareForm(config.softwareInfo);
  }, [config]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const savedColors: CustomColorItem[] = brandForm.savedColors || [
    { id: 'c1', name: 'Màu Thuận Mỹ TDM', hex: '#C52998' },
    { id: 'c2', name: 'Xanh Đậm Tiêu Đề', hex: '#190072' },
    { id: 'c3', name: 'Xanh e-Office Chuẩn', hex: '#1E60F3' },
  ];

  // Assign color to Primary (Buttons & Sidebar)
  const handleAssignPrimary = (hex: string) => {
    const updated = {
      ...brandForm,
      primaryColor: hex,
      primaryHover: hex,
      savedColors,
    };
    setBrandForm(updated);
    updateBrandTheme(updated);
    showToast(`Đã áp dụng mã màu ${hex} cho Nút Bấm & Menu Sidebar!`);
  };

  // Assign color to Headings (Page titles & section headers)
  const handleAssignHeading = (hex: string) => {
    const updated = {
      ...brandForm,
      headingColor: hex,
      savedColors,
    };
    setBrandForm(updated);
    updateBrandTheme(updated);
    showToast(`Đã áp dụng mã màu ${hex} cho Tiêu Đề Các Trang & Mục!`);
  };

  // Add a new custom color to the list
  const handleAddNewColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorHex) return;
    const name = newColorName.trim() || `Màu ${newColorHex.toUpperCase()}`;
    const newId = `c-${Date.now()}`;
    const updatedColors = [...savedColors, { id: newId, name, hex: newColorHex }];

    const updated = {
      ...brandForm,
      savedColors: updatedColors,
    };
    setBrandForm(updated);
    updateBrandTheme(updated);
    setNewColorName('');
    showToast(`Đã thêm màu "${name}" vào bảng màu!`);
  };

  // Delete a color from the list
  const handleDeleteColor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedColors.length <= 1) {
      alert('Hệ thống cần giữ ít nhất một màu chủ đạo.');
      return;
    }
    const updatedColors = savedColors.filter((c) => c.id !== id);
    let newPrimary = brandForm.primaryColor;
    let newHeading = brandForm.headingColor;
    const deletingColor = savedColors.find((c) => c.id === id);

    if (deletingColor && deletingColor.hex.toLowerCase() === brandForm.primaryColor.toLowerCase()) {
      newPrimary = updatedColors[0].hex;
    }
    if (deletingColor && deletingColor.hex.toLowerCase() === (brandForm.headingColor || '').toLowerCase()) {
      newHeading = updatedColors[0].hex;
    }

    const updated = {
      ...brandForm,
      primaryColor: newPrimary,
      primaryHover: newPrimary,
      headingColor: newHeading,
      savedColors: updatedColors,
    };
    setBrandForm(updated);
    updateBrandTheme(updated);
    showToast('Đã xóa màu khỏi danh sách.');
  };

  // Save Administrative Info
  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminInfo(adminForm);
    showToast('Đã lưu thông tin hành chính & logo cơ quan thành công!');
  };

  // Save Brand Theme
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandTheme(brandForm);
    showToast('Đã lưu cấu hình nhận diện thương hiệu thành công!');
  };

  // Save Software Info
  const handleSaveSoftware = (e: React.FormEvent) => {
    e.preventDefault();
    updateSoftwareInfo(softwareForm);
    showToast('Đã lưu thông tin phần mềm thành công!');
  };

  // Release New Version
  const handleReleaseVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const items = changelogInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (items.length === 0) {
      alert('Vui lòng nhập ít nhất 1 nội dung thay đổi (Changelog).');
      return;
    }

    const newVer = releaseNewVersion({
      releaseType,
      customVersion: releaseType === 'CUSTOM' ? customVerInput : undefined,
      changelog: items,
      authorName: currentUser?.fullName || 'Nguyễn Văn Quản Trị',
    });

    setShowReleaseModal(false);
    setChangelogInput('');
    setCustomVerInput('');
    showToast(`Đã phát hành phiên bản mới ${newVer} thành công!`);
  };

  // Handle Logo Upload (Simulated Data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAdminForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentBrandColor = brandForm.primaryColor || config.brandTheme.primaryColor || '#C52998';
  const currentHeadingColor = brandForm.headingColor || config.brandTheme.headingColor || '#190072';

  return (
    <div className="w-full space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[110] flex items-center space-x-2.5 rounded-2xl bg-slate-900 text-white px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl text-white font-bold shadow-md transition-colors duration-200"
              style={{ backgroundColor: currentBrandColor }}
            >
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1
                className="text-xl font-extrabold tracking-tight"
                style={{ color: currentHeadingColor }}
              >
                Cấu Hình Hệ Thống & Quản Trị Thương Hiệu
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tùy biến thông tin hành chính, màu sắc giao diện động và tự động quản lý phiên bản phần mềm.
              </p>
            </div>
          </div>
        </div>

        {/* Current Version Pill */}
        <div className="flex items-center space-x-2 rounded-full bg-white px-4 py-2 border border-slate-200 shadow-xs self-start sm:self-auto">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">
            Phiên bản hiện tại:{' '}
            <span className="font-mono font-bold" style={{ color: currentBrandColor }}>
              {config.softwareInfo.currentVersion}
            </span>
          </span>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('admin')}
          style={
            activeTab === 'admin'
              ? {
                  borderColor: currentBrandColor,
                  color: currentBrandColor,
                  backgroundColor: `${currentBrandColor}12`,
                }
              : undefined
          }
          className={`flex items-center space-x-2 border-b-2 py-3 px-5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'admin'
              ? 'rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>1. Thông tin Hành chính & Logo</span>
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          style={
            activeTab === 'brand'
              ? {
                  borderColor: currentBrandColor,
                  color: currentBrandColor,
                  backgroundColor: `${currentBrandColor}12`,
                }
              : undefined
          }
          className={`flex items-center space-x-2 border-b-2 py-3 px-5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'brand'
              ? 'rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>2. Nhận diện Thương hiệu & Bảng màu</span>
        </button>

        <button
          onClick={() => setActiveTab('software')}
          style={
            activeTab === 'software'
              ? {
                  borderColor: currentBrandColor,
                  color: currentBrandColor,
                  backgroundColor: `${currentBrandColor}12`,
                }
              : undefined
          }
          className={`flex items-center space-x-2 border-b-2 py-3 px-5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'software'
              ? 'rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Rocket className="h-4 w-4" />
          <span>3. Thông tin Phần mềm & Quản lý Phiên bản</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: THÔNG TIN HÀNH CHÍNH & LOGO                       */}
      {/* ======================================================== */}
      {activeTab === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div>
              <h2
                className="text-base font-bold"
                style={{ color: currentHeadingColor }}
              >
                Thông Tin Đơn Vị / Cơ Quan Chủ Quản
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các thông tin này sẽ được in trên đầu các mẫu phiếu báo cáo, trích lục văn bản và tiêu đề cơ quan.
              </p>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên đầy đủ Cơ quan / Đơn vị *</label>
                  <input
                    type="text"
                    placeholder="VD: Bệnh viện Thuận Mỹ TDM"
                    value={adminForm.orgName}
                    onChange={(e) => setAdminForm({ ...adminForm, orgName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên viết tắt / Hiển thị gọn</label>
                  <input
                    type="text"
                    placeholder="VD: TMTDM"
                    value={adminForm.shortName}
                    onChange={(e) => setAdminForm({ ...adminForm, shortName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thủ trưởng / Người đứng đầu</label>
                <input
                  type="text"
                  placeholder="VD: Phí Thùy Châu"
                  value={adminForm.leaderName}
                  onChange={(e) => setAdminForm({ ...adminForm, leaderName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở chính</label>
                <input
                  type="text"
                  placeholder="VD: Số 01 Đường Quang Trung, Phường 1, TP. Thủ Dầu Một"
                  value={adminForm.address}
                  onChange={(e) => setAdminForm({ ...adminForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại Hotline</label>
                  <input
                    type="text"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email công vụ</label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cổng thông tin (Website)</label>
                  <input
                    type="text"
                    value={adminForm.website}
                    onChange={(e) => setAdminForm({ ...adminForm, website: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  style={{ backgroundColor: currentBrandColor }}
                  className="inline-flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Lưu Thông Tin Hành Chính</span>
                </button>
              </div>
            </form>
          </div>

          {/* Logo Card & Preview (1 col) */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3
                  className="text-sm font-bold"
                  style={{ color: currentHeadingColor }}
                >
                  Logo Cơ Quan & Hiển Thị
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Logo sẽ được gắn ở góc trên Sidebar, tiêu đề phiếu trình và tài liệu xuất ra.
                </p>
              </div>

              {/* Logo Preview Area */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/70 text-center">
                {adminForm.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={adminForm.logoUrl}
                      alt="Logo cơ quan"
                      className="h-24 w-24 object-contain rounded-2xl shadow-md border border-white bg-white p-2"
                    />
                    <button
                      onClick={() => setAdminForm({ ...adminForm, logoUrl: '' })}
                      className="absolute -top-2 -right-2 rounded-full bg-rose-500 p-1.5 text-white shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
                      title="Xóa logo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-3xl mb-2 shadow-xs"
                      style={{
                        backgroundColor: `${currentBrandColor}18`,
                        color: currentBrandColor,
                      }}
                    >
                      <Building2 className="h-8 w-8" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Chưa thiết lập Logo riêng</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Đang dùng biểu tượng mặc định</span>
                  </div>
                )}

                <label className="mt-4 inline-flex items-center space-x-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Tải lên Logo mới</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              {/* Sidebar Header Live Mockup */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Xem trước trên Header Sidebar:
                </span>
                <div className="flex items-center space-x-3 rounded-2xl bg-white p-3 border border-slate-200 shadow-xs">
                  {adminForm.logoUrl ? (
                    <img src={adminForm.logoUrl} alt="Logo" className="h-9 w-9 rounded-2xl object-contain" />
                  ) : (
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-2xl text-white font-bold"
                      style={{ backgroundColor: currentBrandColor }}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-extrabold" style={{ color: currentBrandColor }}>
                      {config.softwareInfo.softwareName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{adminForm.shortName || 'TMTDM'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: NHẬN DIỆN THƯƠNG HIỆU & MÀU SẮC                    */}
      {/* ======================================================== */}
      {activeTab === 'brand' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            
            {/* 1. Header & Compact Add Color Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: currentHeadingColor }}
                  >
                    Bảng Màu & Phân Vùng Nhận Diện Thương Hiệu
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thêm các mã màu thương hiệu và chỉ định phân vùng áp dụng tương ứng.
                  </p>
                </div>
              </div>

              {/* Compact Add Color Bar */}
              <form
                onSubmit={handleAddNewColor}
                className="flex flex-wrap items-center gap-2.5 p-2 rounded-2xl border border-slate-200 bg-slate-50/80"
              >
                {/* Circular Color Swatch Picker */}
                <div
                  className="relative h-8 w-8 rounded-full overflow-hidden shadow-xs border-2 border-white ring-1 ring-slate-300 flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: newColorHex }}
                  title="Nhấp để mở bảng chọn màu"
                >
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </div>

                <input
                  type="text"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-24 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-mono uppercase text-xs focus:outline-none"
                  placeholder="#HEX"
                />

                <input
                  type="text"
                  placeholder="Tên màu (VD: Màu Thuận Mỹ...)"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="flex-1 min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none"
                />

                <button
                  type="submit"
                  style={{ backgroundColor: newColorHex }}
                  className="rounded-xl px-4 py-2 font-bold text-xs text-white shadow-sm transition-all hover:scale-105 cursor-pointer flex items-center space-x-1 flex-shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm màu</span>
                </button>
              </form>
            </div>

            {/* 2. Hai Khối Phân Vùng Màu Sắc Trọng Tâm */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Phân Vùng Màu Sắc Trực Quan (Bấm vào màu bạn muốn gán):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Khối 1: Nút Bấm & Sidebar */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-xs"
                        style={{ backgroundColor: currentBrandColor }}
                      >
                        <MousePointerClick className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Màu Nút Bấm & Sidebar</p>
                        <p className="text-[10px] text-slate-400">Nút thêm, tìm kiếm, menu active</p>
                      </div>
                    </div>
                    <span
                      className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${currentBrandColor}18`,
                        color: currentBrandColor,
                      }}
                    >
                      {currentBrandColor}
                    </span>
                  </div>

                  {/* Swatches to pick for Primary */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                    {savedColors.map((col) => {
                      const isSelected = brandForm.primaryColor.toLowerCase() === col.hex.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={col.id}
                          onClick={() => handleAssignPrimary(col.hex)}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full shadow-xs border border-white"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="truncate max-w-[90px]">{col.name}</span>
                          {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Khối 2: Tiêu Đề Các Trang & Mục */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-xs"
                        style={{ backgroundColor: currentHeadingColor }}
                      >
                        <Type className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Màu Tiêu Đề Trang & Mục</p>
                        <p className="text-[10px] text-slate-400">Tiêu đề các trang, đề mục lớn</p>
                      </div>
                    </div>
                    <span
                      className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${currentHeadingColor}18`,
                        color: currentHeadingColor,
                      }}
                    >
                      {currentHeadingColor}
                    </span>
                  </div>

                  {/* Swatches to pick for Heading */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                    {savedColors.map((col) => {
                      const isSelected = (brandForm.headingColor || '').toLowerCase() === col.hex.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={col.id}
                          onClick={() => handleAssignHeading(col.hex)}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full shadow-xs border border-white"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="truncate max-w-[90px]">{col.name}</span>
                          {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Danh Sách Chi Tiết Các Màu Đã Lưu (Palette Chips) */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Các thẻ màu trong bảng nhận diện ({savedColors.length} màu):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {savedColors.map((col) => {
                  const isPrimary = brandForm.primaryColor.toLowerCase() === col.hex.toLowerCase();
                  const isHeading = (brandForm.headingColor || '').toLowerCase() === col.hex.toLowerCase();

                  return (
                    <div
                      key={col.id}
                      className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs"
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-white shadow-xs flex-shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="font-bold text-slate-800">{col.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{col.hex}</span>
                      
                      {isPrimary && (
                        <span
                          className="px-1.5 py-0.2 text-[9px] font-bold rounded-full"
                          style={{
                            backgroundColor: `${col.hex}20`,
                            color: col.hex,
                          }}
                        >
                          Nút
                        </span>
                      )}
                      {isHeading && (
                        <span
                          className="px-1.5 py-0.2 text-[9px] font-bold rounded-full"
                          style={{
                            backgroundColor: `${col.hex}20`,
                            color: col.hex,
                          }}
                        >
                          Tiêu đề
                        </span>
                      )}

                      {savedColors.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteColor(col.id, e)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                          title="Xóa màu này"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSaveBrand}
                style={{ backgroundColor: currentBrandColor }}
                className="inline-flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Lưu Cấu Hình Bảng Màu</span>
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div>
              <div className="flex items-center space-x-2 font-bold">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3
                  className="text-sm font-bold"
                  style={{ color: currentHeadingColor }}
                >
                  Xem Trước Giao Diện Thực Tế
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Hiệu ứng phân vùng màu sắc áp dụng thời gian thực</p>
            </div>

            <div className="p-4 rounded-3xl border border-slate-200 bg-slate-50/70 space-y-4 text-xs">
              {/* Heading Sample */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Tiêu Đề Trang ({currentHeadingColor}):
                </span>
                <h4
                  className="text-base font-extrabold tracking-tight"
                  style={{ color: currentHeadingColor }}
                >
                  Văn bản Đến & Điều Hành
                </h4>
              </div>

              {/* Primary Button Sample */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Nút Hành Động ({currentBrandColor}):
                </span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full font-bold text-xs text-white shadow-sm hover:opacity-90 transition-transform cursor-pointer"
                  style={{ backgroundColor: currentBrandColor }}
                >
                  + Tiếp Nhận Văn Bản
                </button>
              </div>

              {/* Sidebar Active Menu Sample */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Menu Active Trên Sidebar:
                </span>
                <div
                  className="flex items-center justify-between px-3.5 py-2 rounded-2xl text-white font-semibold shadow-xs text-xs"
                  style={{ backgroundColor: currentBrandColor }}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Văn bản Đến (Active)</span>
                  </div>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">12</span>
                </div>
              </div>

              {/* Sidebar Header Software Name Sample */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Tên Phần Mềm Trên Header Sidebar:
                </span>
                <span className="text-sm font-black" style={{ color: currentBrandColor }}>
                  {config.softwareInfo.softwareName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PHẦN MỀM & QUẢN LÝ PHIÊN BẢN (CHANGELOG)         */}
      {/* ======================================================== */}
      {activeTab === 'software' && (
        <div className="space-y-6">
          {/* Top Hero & Release Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Version Hero Box */}
            <div
              className="rounded-3xl border p-6 shadow-xs flex flex-col justify-between"
              style={{
                borderColor: `${currentBrandColor}30`,
                background: `linear-gradient(135deg, ${currentBrandColor}0d 0%, #ffffff 100%)`,
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold text-white shadow-xs"
                    style={{ backgroundColor: currentBrandColor }}
                  >
                    ACTIVE RELEASE
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Bản phát hành chính thức</span>
                </div>

                <div className="mt-4">
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{config.softwareInfo.currentVersion}</p>
                  <p className="text-sm font-extrabold mt-1" style={{ color: currentBrandColor }}>
                    {config.softwareInfo.softwareName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{config.softwareInfo.slogan}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Bản quyền: {config.softwareInfo.developer}</span>
              </div>
            </div>

            {/* Software Info Form */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: currentHeadingColor }}
                  >
                    Thông Tin Ứng Dụng
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Hiển thị trên màn hình đăng nhập, chân trang và tiêu đề.</p>
                </div>

                {/* Release New Version Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setReleaseType('PATCH');
                    setShowReleaseModal(true);
                  }}
                  style={{ backgroundColor: currentBrandColor }}
                  className="inline-flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Phát Hành Phiên Bản Mới</span>
                </button>
              </div>

              <form onSubmit={handleSaveSoftware} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên phần mềm / Ứng dụng *</label>
                    <input
                      type="text"
                      value={softwareForm.softwareName}
                      onChange={(e) => setSoftwareForm({ ...softwareForm, softwareName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Đơn vị phát triển / Tác giả *</label>
                    <input
                      type="text"
                      value={softwareForm.developer}
                      onChange={(e) => setSoftwareForm({ ...softwareForm, developer: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khẩu hiệu / Slogan giải pháp</label>
                  <input
                    type="text"
                    value={softwareForm.slogan}
                    onChange={(e) => setSoftwareForm({ ...softwareForm, slogan: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Lưu Thông Tin Phần Mềm</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Version Changelog History Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-slate-700" />
              <div>
                <h2
                  className="text-base font-bold"
                  style={{ color: currentHeadingColor }}
                >
                  Nhật Ký Thay Đổi Các Phiên Bản (Changelog History)
                </h2>
                <p className="text-xs text-slate-500">Toàn bộ lịch sử nâng cấp và cập nhật tính năng qua các giai đoạn.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {config.versionHistory.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-extrabold text-sm text-slate-900">{item.version}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          item.releaseType === 'MAJOR'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.releaseType === 'MINOR'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.releaseType === 'MAJOR'
                          ? 'Nâng cấp Lớn (Major)'
                          : item.releaseType === 'MINOR'
                          ? 'Tính năng Mới (Minor)'
                          : 'Vá lỗi & Tối ưu (Patch)'}
                      </span>
                      {idx === 0 && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-white">
                          HIỆN TẠI
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.authorName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.releaseDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {item.changelog.map((c, cIdx) => (
                        <li key={cIdx} className="flex items-start space-x-2">
                          <span className="font-bold mt-0.5" style={{ color: currentBrandColor }}>•</span>
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PHÁT HÀNH PHIÊN BẢN MỚI (CREATE PORTAL)           */}
      {/* ======================================================== */}
      {showReleaseModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0"
              style={{
                backgroundColor: `${currentBrandColor}12`,
              }}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl text-white font-bold shadow-xs"
                  style={{ backgroundColor: currentBrandColor }}
                >
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: currentHeadingColor }}
                  >
                    Phát Hành Phiên Bản Mới
                  </h2>
                  <p className="text-[11px] text-slate-500">Tự động tăng số version và ghi log lịch sử</p>
                </div>
              </div>
              <button
                onClick={() => setShowReleaseModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleReleaseVersion} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Chọn loại nâng cấp phiên bản *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReleaseType('PATCH')}
                    className={`rounded-2xl p-3 border text-left transition-all cursor-pointer ${
                      releaseType === 'PATCH'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-extrabold text-emerald-800">Patch</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">+0.0.1 (Vá lỗi)</p>
                    <p className="font-mono font-bold text-slate-900 text-xs mt-1">
                      {calculateNextVersion('PATCH')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReleaseType('MINOR')}
                    className={`rounded-2xl p-3 border text-left transition-all cursor-pointer ${
                      releaseType === 'MINOR'
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-extrabold text-blue-800">Minor</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">+0.1.0 (Tính năng)</p>
                    <p className="font-mono font-bold text-slate-900 text-xs mt-1">
                      {calculateNextVersion('MINOR')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReleaseType('MAJOR')}
                    className={`rounded-2xl p-3 border text-left transition-all cursor-pointer ${
                      releaseType === 'MAJOR'
                        ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-extrabold text-rose-800">Major</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">+1.0.0 (Lớn)</p>
                    <p className="font-mono font-bold text-slate-900 text-xs mt-1">
                      {calculateNextVersion('MAJOR')}
                    </p>
                  </button>
                </div>
              </div>

              {releaseType === 'CUSTOM' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số phiên bản tùy chỉnh *</label>
                  <input
                    type="text"
                    placeholder="VD: v3.1.0-beta"
                    value={customVerInput}
                    onChange={(e) => setCustomVerInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung thay đổi (Changelog) - Mỗi dòng là 1 đầu mục *
                </label>
                <textarea
                  rows={4}
                  placeholder={`- Bổ sung trang Cấu hình Hệ thống & Nhận diện thương hiệu\n- Cải tiến tính năng tự động ghi log phiên bản\n- Tối ưu hiệu năng và sửa lỗi hiển thị`}
                  value={changelogInput}
                  onChange={(e) => setChangelogInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <div
                className="rounded-2xl p-3.5 border text-[11px] font-medium"
                style={{
                  backgroundColor: `${currentBrandColor}12`,
                  borderColor: `${currentBrandColor}30`,
                  color: currentBrandColor,
                }}
              >
                ✓ Phiên bản mới sẽ tự động cập nhật ngay lên đỉnh Sidebar và các báo cáo hành chính.
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: currentBrandColor }}
                  className="rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 cursor-pointer transition-all"
                >
                  Xác Nhận Phát Hành
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
