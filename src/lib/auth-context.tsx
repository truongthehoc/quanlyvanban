'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDTO, RoleCode } from '@/types';

interface AuthContextType {
  currentUser: UserDTO | null;
  usersList: UserDTO[];
  rolePermissions: Record<string, string[]>;
  isLoading: boolean;
  switchUser: (username: string) => void;
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (role: RoleCode | RoleCode[]) => boolean;
  unreadNotificationCount: number;
  setUnreadNotificationCount: React.Dispatch<React.SetStateAction<number>>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);
  const [usersList, setUsersList] = useState<UserDTO[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  const fetchAuthData = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        setRolePermissions(data.rolePermissions || {});
        
        // Load saved user from localStorage or default to 'vanthu'
        const savedUsername = typeof window !== 'undefined' ? localStorage.getItem('active_user') : null;
        const defaultUser = data.users.find((u: UserDTO) => u.username === savedUsername) || 
                            data.users.find((u: UserDTO) => u.username === 'vanthu') || 
                            data.users[0];
        
        setCurrentUser(defaultUser);
      }
    } catch (err) {
      console.error('Failed to load auth users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthData();
  }, []);

  // Fetch unread notifications
  useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${currentUser.id}&unreadOnly=true`);
        if (res.ok) {
          const data = await res.json();
          setUnreadNotificationCount(data.length || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [currentUser]);

  const switchUser = (username: string) => {
    const target = usersList.find((u) => u.username === username);
    if (target) {
      setCurrentUser(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_user', username);
      }
    }
  };

  const hasRole = (roles: RoleCode | RoleCode[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.roles.includes('ADMIN')) return true; // Admin has all roles
    const checkRoles = Array.isArray(roles) ? roles : [roles];
    return checkRoles.some((r) => currentUser.roles.includes(r));
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.roles.includes('ADMIN')) return true;

    for (const role of currentUser.roles) {
      const perms = rolePermissions[role] || [];
      if (perms.includes(permissionCode)) return true;
    }
    return false;
  };

  const refreshData = async () => {
    await fetchAuthData();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersList,
        rolePermissions,
        isLoading,
        switchUser,
        hasPermission,
        hasRole,
        unreadNotificationCount,
        setUnreadNotificationCount,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
