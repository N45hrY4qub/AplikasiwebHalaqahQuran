/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ManageUsers } from './ManageUsers';
import { ShieldCheck, GraduationCap, Users, UserCog, ShieldAlert } from 'lucide-react';
import { isAdminUtama, hasAdminPermission, hasAdminTabPermission, getAdminTabLabel } from '../types';

interface ManagePenggunaProps {
  initialTab?: 'admin' | 'guru' | 'siswa';
}

export const ManagePengguna: React.FC<ManagePenggunaProps> = ({ initialTab }) => {
  const { currentSession, admins, gurus, siswas } = useApp();
  const user = currentSession.user;

  const canAccessAdmin = isAdminUtama(user as any) || (hasAdminPermission(user, 'pengguna') && hasAdminTabPermission(user, 'pengguna', 'admin'));
  const canAccessGuru = isAdminUtama(user as any) || (hasAdminPermission(user, 'pengguna') && hasAdminTabPermission(user, 'pengguna', 'guru'));
  const canAccessSiswa = isAdminUtama(user as any) || (hasAdminPermission(user, 'pengguna') && hasAdminTabPermission(user, 'pengguna', 'siswa'));

  const tabs = [
    ...(canAccessAdmin ? [{
      id: 'admin' as const,
      label: getAdminTabLabel('pengguna', 'admin', 'Admin & Pengelola'),
      icon: ShieldCheck,
      count: admins.length,
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
    }] : []),
    ...(canAccessGuru ? [{
      id: 'guru' as const,
      label: getAdminTabLabel('pengguna', 'guru', 'Guru & Ustadz'),
      icon: GraduationCap,
      count: gurus.length,
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
    }] : []),
    ...(canAccessSiswa ? [{
      id: 'siswa' as const,
      label: getAdminTabLabel('pengguna', 'siswa', 'Santri & Siswa'),
      icon: Users,
      count: siswas.length,
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
    }] : [])
  ];

  const resolvedInitialTab = initialTab && tabs.some(t => t.id === initialTab)
    ? initialTab 
    : (tabs[0]?.id || 'guru');

  const [activeTab, setActiveTab] = useState<'admin' | 'guru' | 'siswa'>(resolvedInitialTab);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans text-slate-900 dark:text-white">
              Pusat Manajemen Pengguna
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola data seluruh akun lembaga (Admin, Guru/Ustadz, dan Santri/Siswa) dalam satu pintu
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        {tabs.length > 0 && (
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 self-start sm:self-auto overflow-x-auto max-w-full">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${tab.badgeColor}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Active User Management Table */}
      {tabs.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Akses Pengguna Dibatasi</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Akun Anda tidak memiliki izin akses untuk sub-tab pada menu Pengguna. Silakan hubungi Administrator Utama.
          </p>
        </div>
      ) : (
        <div className="transition-all">
          <ManageUsers roleType={activeTab} key={activeTab} />
        </div>
      )}
    </div>
  );
};
