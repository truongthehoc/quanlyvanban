'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AdminInfo {
  orgName: string;
  shortName: string;
  orgCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  leaderName: string;
  logoUrl?: string;
}

export interface BrandTheme {
  primaryColor: string; // e.g. '#1E60F3'
  primaryHover: string;
  accentColor: string;
  themeMode: 'LIGHT' | 'DARK' | 'SLATE';
  borderRadius: 'rounded-full' | 'rounded-2xl' | 'rounded-xl';
}

export interface SoftwareInfo {
  softwareName: string;
  slogan: string;
  developer: string;
  currentVersion: string;
}

export interface VersionLog {
  id: string;
  version: string;
  releaseType: 'MAJOR' | 'MINOR' | 'PATCH' | 'CUSTOM';
  releaseDate: string;
  authorName: string;
  changelog: string[];
}

export interface SystemConfig {
  adminInfo: AdminInfo;
  brandTheme: BrandTheme;
  softwareInfo: SoftwareInfo;
  versionHistory: VersionLog[];
}

const DEFAULT_CONFIG: SystemConfig = {
  adminInfo: {
    orgName: 'Ủy ban Nhân dân Thành phố',
    shortName: 'UBND Thành phố',
    orgCode: 'UBND-TP',
    address: 'Số 01 Đường Quang Trung, Phường 1, TP. Thủ Dầu Một',
    phone: '0274.3822.999',
    email: 'vanthu@binhduong.gov.vn',
    website: 'https://binhduong.gov.vn',
    leaderName: 'Võ Văn Minh - Chủ tịch UBND',
    logoUrl: '',
  },
  brandTheme: {
    primaryColor: '#1E60F3',
    primaryHover: '#174ec7',
    accentColor: '#3B82F6',
    themeMode: 'LIGHT',
    borderRadius: 'rounded-full',
  },
  softwareInfo: {
    softwareName: 'e-Office DMS',
    slogan: 'Hệ thống Quản lý Văn bản & Điều hành',
    developer: 'e-Office Tech Solutions JSC',
    currentVersion: 'v2.6.2',
  },
  versionHistory: [
    {
      id: 'v-2-6-2',
      version: 'v2.6.2',
      releaseType: 'PATCH',
      releaseDate: '2026-08-19 14:30',
      authorName: 'Nguyễn Văn Quản Trị',
      changelog: [
        'Tối ưu giao diện Modal Popup căn giữa với React Portal (createPortal) phủ kín 100% màn hình.',
        'Thêm cơ chế Static Backdrop chống tắt nhầm khi thao tác.',
        'Cập nhật nhãn phân công văn bản phòng ban theo chuẩn hành chính.',
      ],
    },
    {
      id: 'v-2-6-1',
      version: 'v2.6.1',
      releaseType: 'PATCH',
      releaseDate: '2026-08-19 10:15',
      authorName: 'Nguyễn Văn Quản Trị',
      changelog: [
        'Tái cấu trúc giao diện Sidebar-first hiện đại với nút thu nhỏ border pill < và >.',
        'Tối ưu độ rộng Sidebar và tích hợp thương hiệu cơ quan lên đầu Sidebar.',
      ],
    },
    {
      id: 'v-2-6-0',
      version: 'v2.6.0',
      releaseType: 'MINOR',
      releaseDate: '2026-08-18 09:00',
      authorName: 'e-Office Core Team',
      changelog: [
        'Ra mắt phân hệ Quản lý Sổ văn bản điện tử và tự động cấp số văn bản.',
        'Tích hợp ma trận phân quyền động 5 vai trò (RBAC 2.6).',
        'Hỗ trợ đầy đủ luồng văn bản Đến, Đi và Nội bộ.',
      ],
    },
    {
      id: 'v-2-0-0',
      version: 'v2.0.0',
      releaseType: 'MAJOR',
      releaseDate: '2026-08-01 08:00',
      authorName: 'e-Office Core Team',
      changelog: [
        'Khởi tạo kiến trúc hệ thống e-Office DMS trên nền tảng Next.js 15 và TailwindCSS.',
        'Thiết lập toàn bộ cơ sở dữ liệu và API xử lý nghiệp vụ hành chính.',
      ],
    },
  ],
};

interface SystemConfigContextType {
  config: SystemConfig;
  updateAdminInfo: (info: Partial<AdminInfo>) => void;
  updateBrandTheme: (theme: Partial<BrandTheme>) => void;
  updateSoftwareInfo: (info: Partial<SoftwareInfo>) => void;
  releaseNewVersion: (params: {
    releaseType: 'MAJOR' | 'MINOR' | 'PATCH' | 'CUSTOM';
    customVersion?: string;
    changelog: string[];
    authorName?: string;
  }) => string;
  calculateNextVersion: (type: 'MAJOR' | 'MINOR' | 'PATCH', current?: string) => string;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

const STORAGE_KEY = 'eoffice_system_config_v2';

export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stored configuration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig((prev) => ({
          ...prev,
          ...parsed,
          adminInfo: { ...prev.adminInfo, ...(parsed.adminInfo || {}) },
          brandTheme: { ...prev.brandTheme, ...(parsed.brandTheme || {}) },
          softwareInfo: { ...prev.softwareInfo, ...(parsed.softwareInfo || {}) },
          versionHistory: parsed.versionHistory || prev.versionHistory,
        }));
      }
    } catch (err) {
      console.error('Failed to load system config from localStorage', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Apply CSS variables and global theme styles dynamically
  const applyGlobalThemeStyles = (color: string, hoverColor?: string) => {
    if (typeof document === 'undefined' || !color) return;
    const hover = hoverColor || color;

    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-hover', hover);
    document.documentElement.style.setProperty('--primary-light', `${color}18`);

    let styleTag = document.getElementById('eoffice-dynamic-theme-style') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'eoffice-dynamic-theme-style';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      :root {
        --primary: ${color};
        --primary-hover: ${hover};
      }
      .bg-\\[\\#1E60F3\\],
      .bg-blue-600,
      button.bg-blue-600,
      a.bg-blue-600,
      .btn-primary {
        background-color: ${color} !important;
      }
      .hover\\:bg-blue-700:hover,
      .hover\\:bg-\\[\\#1E60F3\\]:hover {
        filter: brightness(0.92) !important;
      }
      .text-\\[\\#1E60F3\\],
      .text-blue-600 {
        color: ${color} !important;
      }
      .border-\\[\\#1E60F3\\],
      .border-blue-600,
      .border-blue-500 {
        border-color: ${color} !important;
      }
      .bg-blue-50 {
        background-color: ${color}14 !important;
      }
      .border-blue-200 {
        border-color: ${color}33 !important;
      }
      .focus\\:border-\\[\\#1E60F3\\]:focus,
      .focus\\:border-blue-600:focus {
        border-color: ${color} !important;
      }
      .selection\\:bg-blue-600::selection {
        background-color: ${color} !important;
      }
    `;
  };

  useEffect(() => {
    applyGlobalThemeStyles(config.brandTheme.primaryColor, config.brandTheme.primaryHover);
  }, [config.brandTheme.primaryColor, config.brandTheme.primaryHover]);

  // Save config to storage and update CSS variables
  const saveConfig = (newConfig: SystemConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (err) {
      console.error('Failed to save system config', err);
    }

    applyGlobalThemeStyles(newConfig.brandTheme.primaryColor, newConfig.brandTheme.primaryHover);
  };

  const updateAdminInfo = (info: Partial<AdminInfo>) => {
    const updated = {
      ...config,
      adminInfo: { ...config.adminInfo, ...info },
    };
    saveConfig(updated);
  };

  const updateBrandTheme = (theme: Partial<BrandTheme>) => {
    const updated = {
      ...config,
      brandTheme: { ...config.brandTheme, ...theme },
    };
    saveConfig(updated);
  };

  const updateSoftwareInfo = (info: Partial<SoftwareInfo>) => {
    const updated = {
      ...config,
      softwareInfo: { ...config.softwareInfo, ...info },
    };
    saveConfig(updated);
  };

  // Helper to calculate semantic version
  const calculateNextVersion = (type: 'MAJOR' | 'MINOR' | 'PATCH', currentVer = config.softwareInfo.currentVersion) => {
    // Strip leading 'v'
    const cleanVer = currentVer.replace(/^v/i, '');
    const parts = cleanVer.split('.').map((p) => parseInt(p, 10) || 0);
    let [major = 2, minor = 0, patch = 0] = parts;

    if (type === 'MAJOR') {
      major += 1;
      minor = 0;
      patch = 0;
    } else if (type === 'MINOR') {
      minor += 1;
      patch = 0;
    } else if (type === 'PATCH') {
      patch += 1;
    }

    return `v${major}.${minor}.${patch}`;
  };

  const releaseNewVersion = ({
    releaseType,
    customVersion,
    changelog,
    authorName = 'Quản trị viên Hệ thống',
  }: {
    releaseType: 'MAJOR' | 'MINOR' | 'PATCH' | 'CUSTOM';
    customVersion?: string;
    changelog: string[];
    authorName?: string;
  }): string => {
    const nextVer =
      releaseType === 'CUSTOM' && customVersion
        ? customVersion.startsWith('v')
          ? customVersion
          : `v${customVersion}`
        : calculateNextVersion(releaseType as 'MAJOR' | 'MINOR' | 'PATCH', config.softwareInfo.currentVersion);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLog: VersionLog = {
      id: `v-${Date.now()}`,
      version: nextVer,
      releaseType,
      releaseDate: dateStr,
      authorName,
      changelog: changelog.filter((c) => c.trim().length > 0),
    };

    const updated: SystemConfig = {
      ...config,
      softwareInfo: {
        ...config.softwareInfo,
        currentVersion: nextVer,
      },
      versionHistory: [newLog, ...config.versionHistory],
    };

    saveConfig(updated);
    return nextVer;
  };

  return (
    <SystemConfigContext.Provider
      value={{
        config,
        updateAdminInfo,
        updateBrandTheme,
        updateSoftwareInfo,
        releaseNewVersion,
        calculateNextVersion,
      }}
    >
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  if (!context) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
}
