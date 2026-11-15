/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  Home, 
  FolderLock, 
  History, 
  FileText, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  FolderPlus,
  Compass,
  CheckCircle,
  Award,
  ShieldCheck,
  Cloud,
  Calendar,
  TrendingUp,
  MessageCircle,
  Video,
  RefreshCw,
  ClipboardCheck,
  GraduationCap,
  Network,
  Trash2,
  Laptop,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileCheck,
  FileCheck2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, hasAdminPermission, ADMIN_MENU_ORDER, getAdminMenuLabel } from '../types';
import { Avatar } from './Avatar';
import { AdaptiveLogo } from './AdaptiveLogo';
import { resolveInstitutionName } from '../utils/brandingHelper';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  mobileOpen, 
  setMobileOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const { 
    currentSession, 
    logout, 
    darkMode, 
    setDarkMode, 
    themePreference,
    setThemePreference,
    refreshDatabase, 
    gurus, 
    pwaSettings, 
    programEnrollments, 
    siswas, 
    halaqahs,
    studentTargets,
    pengumumans,
    isGuruEligibleForRpp,
    syahadahSettings,
    strukturLembaga
  } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);

  const unreadAnnouncementsCount = useMemo(() => {
    if (!currentSession.user?.id) return 0;
    const userId = currentSession.user.id;
    const userRole = currentSession.user.role;

    return (pengumumans || []).filter(p => {
      if (!p.isPublished) return false;
      if (userRole === UserRole.ADMIN) {
        // Admin sees all
        const read = p.dibacaOleh || [];
        return !read.includes(userId);
      } else if (userRole === UserRole.GURU) {
        if (p.targetAudiens !== 'ALL' && p.targetAudiens !== 'GURU') return false;
        const read = p.dibacaOleh || [];
        return !read.includes(userId);
      } else if (userRole === UserRole.SISWA) {
        if (p.targetAudiens !== 'ALL' && p.targetAudiens !== 'SISWA') return false;
        const read = p.dibacaOleh || [];
        return !read.includes(userId);
      }
      return false;
    }).length;
  }, [pengumumans, currentSession.user]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refreshDatabase();
    } catch (e) {
      console.error("Manual sync failed", e);
    }
    // Artificial slight delay for feedback aesthetics
    setTimeout(() => {
      setIsSyncing(false);
    }, 605);
  };

  const [showResetCacheModal, setShowResetCacheModal] = useState(false);
  const [isResettingCache, setIsResettingCache] = useState(false);

  const handleResetCache = () => {
    setShowResetCacheModal(true);
  };

  const executeResetCache = async () => {
    setIsResettingCache(true);
    try {
      // Clear all Cache Storage
      if ('caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map(key => window.caches.delete(key)));
      }
      
      // Unregister all Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      // Force a full reload from the server
      window.location.reload();
    } catch (err) {
      console.error("Gagal membersihkan cache:", err);
      setIsResettingCache(false);
      setShowResetCacheModal(false);
      window.location.reload();
    }
  };

  if (!currentSession.user) return null;
  const { role, namaLengkap, email, fotoProfil } = currentSession.user;

  const currentGuru = role === UserRole.GURU ? (gurus || []).find(g => 
    g.id === currentSession.user?.id || 
    (g.email && currentSession.user?.email && g.email.toLowerCase() === currentSession.user.email.toLowerCase()) ||
    (g.namaLengkap && currentSession.user?.namaLengkap && g.namaLengkap.toLowerCase() === currentSession.user.namaLengkap.toLowerCase())
  ) : null;

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false); // Close drawer on mobile click
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: role === UserRole.ADMIN ? getAdminMenuLabel('dashboard', 'Beranda') : (role === UserRole.GURU ? 'Dashboard Guru' : 'Dashboard Siswa'), 
      icon: LayoutDashboard, 
      roles: [UserRole.ADMIN, UserRole.GURU, UserRole.SISWA] 
    },
    { 
      id: 'pengguna', 
      label: getAdminMenuLabel('pengguna', 'Pengguna'), 
      icon: Users, 
      roles: [UserRole.ADMIN] 
    },
    { 
      id: 'struktur_lembaga', 
      label: role === UserRole.ADMIN ? getAdminMenuLabel('struktur_lembaga', 'Lembaga') : 'Struktur Lembaga', 
      icon: Network, 
      roles: [UserRole.ADMIN] 
    },
    { 
      id: 'kelashalaqah', 
      label: role === UserRole.ADMIN ? getAdminMenuLabel('kelashalaqah', 'Halaqah') : 'Manajemen Halaqah', 
      icon: Home, 
      roles: [UserRole.ADMIN] 
    },
    { 
      id: 'kurikulum_modul', 
      label: getAdminMenuLabel('kurikulum_modul', 'Kurikulum & Modul'), 
      icon: BookOpen, 
      roles: [UserRole.ADMIN] 
    },
    {
      id: 'manajemen_syahadah',
      label: role === UserRole.ADMIN ? getAdminMenuLabel('manajemen_syahadah', 'Syahadah') : 'Sistem Syahadah (Ijazah)',
      icon: ShieldCheck,
      roles: [UserRole.ADMIN, UserRole.GURU, UserRole.SISWA],
      show: role === UserRole.ADMIN || 
            (role === UserRole.GURU && Boolean(syahadahSettings?.isEnabledForGuru)) || 
            (role === UserRole.SISWA && Boolean(syahadahSettings?.isEnabledForSiswa))
    },
    { 
      id: 'program_keilmuan', 
      label: role === UserRole.ADMIN ? getAdminMenuLabel('program_keilmuan', 'Program Keilmuan') : 'Program Keilmuan', 
      icon: GraduationCap, 
      roles: [UserRole.ADMIN, UserRole.GURU, UserRole.SISWA],
      show: role !== UserRole.SISWA || (programEnrollments || []).some(e => e.siswaId === currentSession.user?.id)
    },
    { 
      id: 'setorans', 
      label: role === UserRole.ADMIN ? getAdminMenuLabel('setorans', 'Mutabaah') : 'Manajemen Setoran', 
      icon: CheckedCircleIcon(role), 
      roles: [UserRole.ADMIN] 
    },
    {
      id: 'pengumuman',
      label: getAdminMenuLabel('pengumuman', 'Pengumuman'),
      icon: Megaphone,
      roles: [UserRole.ADMIN]
    },
    { 
      id: 'system', 
      label: role === UserRole.ADMIN ? getAdminMenuLabel('system', 'Pengaturan') : 'Sistem & Backup', 
      icon: Settings, 
      roles: [UserRole.ADMIN] 
    },
    // Guru customized view lists
    {
      id: 'guru_siswas',
      label: 'Siswa Halaqah',
      icon: Users,
      roles: [UserRole.GURU]
    },
    {
      id: 'guru_administrasi_rpp',
      label: 'Administrasi & RPP',
      icon: FileCheck,
      roles: [UserRole.GURU],
      show: isGuruEligibleForRpp(currentSession.user?.id)
    },
    {
      id: 'guru_mutabaah',
      label: 'Mutabaah',
      icon: BookPlusIcon(),
      roles: [UserRole.GURU]
    },
    {
      id: 'guru_absensi',
      label: 'Absensi Halaqah',
      icon: Calendar,
      roles: [UserRole.GURU]
    },
    {
      id: 'pelaksanaan_assessment',
      label: 'Pelaksanaan Assessment',
      icon: GraduationCap,
      roles: [UserRole.GURU]
    },
    {
      id: 'murojaah_berpasangan',
      label: 'Murojaah Berpasangan',
      icon: Users,
      roles: [UserRole.GURU]
    },
    {
      id: 'guru_halaqah_pribadi',
      label: 'Halaqah Pribadi',
      icon: Home,
      roles: [UserRole.GURU],
      show: role === UserRole.GURU && !!currentGuru?.izinHalaqahPribadi
    },
    // Siswa customized menu items
    {
      id: 'siswa_target',
      label: 'Target Capaian',
      icon: Compass,
      roles: [],
      show: false
    },
    {
      id: 'siswa_mutabaah',
      label: 'Mutabaah',
      icon: BookOpen,
      roles: [UserRole.SISWA]
    },
    {
      id: 'hasil_assessment',
      label: 'Hasil Assessment (Ujian)',
      icon: Award,
      roles: [UserRole.SISWA]
    },
    { 
      id: 'profile', 
      label: role === UserRole.SISWA ? 'Profil Siswa' : 'Profil Pengguna', 
      icon: User, 
      roles: [UserRole.SISWA] 
    }
  ];

  function BookPlusIcon() {
    return BookOpen;
  }

  function CheckedCircleIcon(userRole: UserRole) {
    if (userRole === UserRole.SISWA) return Award;
    return CheckCircle;
  }

  let filteredMenuItems = menuItems.filter(item => {
    if (!item.roles.includes(role)) return false;
    if (item.show !== undefined && !item.show) return false;
    if (role === UserRole.ADMIN) {
      if (!hasAdminPermission(currentSession.user as any, item.id)) {
        return false;
      }
    }
    return true;
  });

  if (role === UserRole.ADMIN) {
    const adminOrder: string[] = ADMIN_MENU_ORDER;
    filteredMenuItems = filteredMenuItems
      .filter(item => adminOrder.includes(item.id))
      .sort((a, b) => {
        const idxA = adminOrder.indexOf(a.id);
        const idxB = adminOrder.indexOf(b.id);
        return idxA - idxB;
      });
  }

  if (role === UserRole.GURU) {
    const guruOrder = [
      'dashboard',
      'guru_absensi',
      'guru_mutabaah',
      'murojaah_berpasangan',
      'guru_administrasi_rpp',
      'pelaksanaan_assessment',
      'program_keilmuan',
      'manajemen_syahadah',
      'guru_siswas',
      'guru_halaqah_pribadi'
    ];
    filteredMenuItems = [...filteredMenuItems].sort((a, b) => {
      const idxA = guruOrder.indexOf(a.id);
      const idxB = guruOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  if (role === UserRole.SISWA) {
    const siswaOrder = [
      'dashboard',
      'siswa_mutabaah',
      'program_keilmuan',
      'hasil_assessment',
      'manajemen_syahadah',
      'profile'
    ];
    filteredMenuItems = [...filteredMenuItems].sort((a, b) => {
      const idxA = siswaOrder.indexOf(a.id);
      const idxB = siswaOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  const activeIcon = pwaSettings?.appIcon || '';
  const activeName = resolveInstitutionName(pwaSettings?.appName, strukturLembaga?.yayasan?.nama);
  let activeSubtitle = 'PORTAL HALAQAH';
  if (role === UserRole.ADMIN) {
    activeSubtitle = 'HALAQAH ADMIN';
  } else if (role === UserRole.GURU) {
    activeSubtitle = 'HALAQAH GURU';
  } else if (role === UserRole.SISWA) {
    activeSubtitle = 'HALAQAH SISWA';
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 select-none border-r border-slate-200 dark:border-slate-850 transition-colors duration-300 overflow-hidden">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-20 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <AdaptiveLogo
              src={activeIcon}
              alt={activeName}
              sizeClassName="w-10 h-10"
              roundedClassName="rounded-xl"
              fallbackIcon={
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              }
            />
          </motion.div>
          <AnimatePresence initial={false}>
            {(!isCollapsed || mobileOpen) && (
              <motion.div
                key="brand-info"
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-w-0 max-w-[150px] overflow-hidden whitespace-nowrap"
              >
                <h1 className="font-sans font-bold text-sm tracking-tight leading-none text-emerald-900 dark:text-white truncate">
                  {activeName}
                </h1>
                <p className="font-mono text-[9px] text-emerald-600 dark:text-emerald-450 font-bold tracking-wider uppercase mt-1 truncate">
                  {activeSubtitle}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {mobileOpen && (
          <motion.button 
            id="close-mobile-menu"
            onClick={() => setMobileOpen(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </motion.button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {filteredMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group">
              <motion.button
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                whileHover={{ x: isCollapsed && !mobileOpen ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center w-full px-3 py-2.5 rounded-xl transition-colors duration-200 text-left font-sans text-xs font-semibold uppercase tracking-wider relative cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-900/70 hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed && !mobileOpen ? 'justify-center' : ''}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-pill"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-600 dark:bg-emerald-400 rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isCollapsed && !mobileOpen ? '' : 'mr-3'} ${isActive ? 'text-emerald-600 dark:text-emerald-400 scale-105' : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`} />
                
                <AnimatePresence initial={false}>
                  {(!isCollapsed || mobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8, transition: { duration: 0.12 } }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 truncate whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {(item as any).badge && (!isCollapsed || mobileOpen) && (
                  <span className="ml-auto px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-md leading-none shadow-xs">
                    {(item as any).badge}
                  </span>
                )}

                {item.id === 'pengumuman' && unreadAnnouncementsCount > 0 && (!isCollapsed || mobileOpen) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full leading-none shadow-xs"
                  >
                    {unreadAnnouncementsCount > 9 ? '9+' : unreadAnnouncementsCount}
                  </motion.span>
                )}

                {item.id === 'pengumuman' && unreadAnnouncementsCount > 0 && isCollapsed && !mobileOpen && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                )}
              </motion.button>

              {/* Floating Tooltip on hover when collapsed */}
              {isCollapsed && !mobileOpen && (
                <div className="fixed left-20 ml-2 hidden group-hover:flex items-center z-50 pointer-events-none transition-all">
                  <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-800 flex items-center space-x-2">
                    <span>{item.label}</span>
                    {(item as any).badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-500 text-white rounded-full">
                        {(item as any).badge}
                      </span>
                    )}
                    {item.id === 'pengumuman' && unreadAnnouncementsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full">
                        {unreadAnnouncementsCount}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Dark Mode toggle and Collapsible Trigger */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-slate-400 flex-shrink-0">
        <AnimatePresence initial={false}>
          {(!isCollapsed || mobileOpen) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0, transition: { duration: 0.12 } }}
              className="text-[10px] font-bold tracking-widest uppercase overflow-hidden whitespace-nowrap pl-1"
            >
              TEMA & SYNC
            </motion.span>
          )}
        </AnimatePresence>
        <div className={`flex items-center space-x-0.5 ${isCollapsed && !mobileOpen ? 'mx-auto justify-center' : ''}`}>
          <motion.button
            id="manual-sync-button"
            onClick={handleManualSync}
            disabled={isSyncing}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white cursor-pointer ${isSyncing ? '!cursor-not-allowed text-emerald-500' : ''}`}
            title="Muat Ulang / Sinkronisasi Data"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`} />
          </motion.button>
          <motion.button
            id="dark-mode-toggle"
            onClick={() => {
              setThemePreference(darkMode ? 'light' : 'dark');
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
              themePreference !== 'system' 
                ? 'text-slate-800 dark:text-white bg-slate-200/60 dark:bg-slate-800/60 font-semibold' 
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
            title={darkMode ? 'Ubah ke Mode Terang (Manual)' : 'Ubah ke Mode Gelap (Manual)'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </motion.button>
          <motion.button
            id="system-theme-toggle"
            onClick={() => setThemePreference('system')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
              themePreference === 'system' 
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' 
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
            title={`Mode Sistem Otomatis: Aktif (${darkMode ? 'Gelap' : 'Terang'} mengikuti perangkat)`}
          >
            <Laptop className="w-4 h-4" />
          </motion.button>
          <motion.button
            id="reset-cache-button"
            onClick={handleResetCache}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors flex items-center justify-center text-slate-500 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 cursor-pointer"
            title="Bersihkan Cache & Perbarui Aplikasi"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* User Information and Logout */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-shrink-0">
        <motion.button
          id="sidebar-user-profile-button"
          onClick={() => handleNavClick('profile')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full p-2 rounded-xl flex items-center space-x-3 transition-all cursor-pointer text-left ${
            activeTab === 'profile'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/40 shadow-xs'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
          } ${isCollapsed && !mobileOpen ? 'justify-center !px-1' : ''}`}
          title="Buka Profil Pengguna"
        >
          <div className="relative flex-shrink-0">
            <Avatar 
              namaLengkap={namaLengkap} 
              fotoProfil={fotoProfil} 
              className="w-8 h-8 text-[10px] font-bold flex-shrink-0 ring-1 ring-slate-300 dark:ring-slate-700"
            />
            {activeTab === 'profile' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </div>
          <AnimatePresence initial={false}>
            {(!isCollapsed || mobileOpen) && (
              <motion.div
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 overflow-hidden whitespace-nowrap"
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="font-sans text-xs font-bold text-slate-800 dark:text-white truncate leading-tight">{namaLengkap}</p>
                  <User className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-1.5 py-0.2 rounded-md">
                    {role}
                  </span>
                  <span className={`text-[10px] font-semibold ${activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    Profil
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        <AnimatePresence initial={false}>
          {(!isCollapsed || mobileOpen) && (
            <motion.button
              id="handle-logout"
              onClick={logout}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.15 } }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center w-full px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-450 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer overflow-hidden whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span>Keluar Aplikasi</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar with smooth spring width animation */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
        className="hidden md:flex flex-col h-screen fixed top-0 left-0 z-30 shadow-xl overflow-visible"
      >
        {sidebarContent}
        {/* Collapse toggle button pinned on sidebar edge with animated rotation */}
        <motion.button
          id="sidebar-collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.92 }}
          title={isCollapsed ? "Perluas Menu Sidebar" : "Ciutkan Menu Sidebar"}
          className="absolute -right-3.5 top-7 w-7 h-7 items-center justify-center hidden md:flex rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/30 border-2 border-white dark:border-slate-950 transition-colors z-40"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </motion.aside>

      {/* Mobile Drawer with smooth backdrop and slide-in motion */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Overlay mask */}
            <motion.div 
              id="mobile-drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            {/* Menu Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-slate-950 h-full z-10 shadow-2xl overflow-hidden"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Reset Cache */}
      {showResetCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                <RefreshCw className={`w-5 h-5 ${isResettingCache ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Bersihkan Cache &amp; Refresh
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pembaruan data &amp; aset aplikasi
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda ingin membersihkan cache penyimpanan aplikasi dan memuat ulang? Tindakan ini akan memastikan Anda mendapatkan versi aplikasi terbaru secara instan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isResettingCache}
                onClick={() => setShowResetCacheModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResettingCache}
                onClick={executeResetCache}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {isResettingCache ? 'Memproses...' : 'Ya, Bersihkan & Refresh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
