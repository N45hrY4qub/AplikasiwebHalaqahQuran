/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ManageHalaqah } from './ManageHalaqah';
import { ManageSetoran } from './ManageSetoran';
import { Home, UserCheck, CalendarDays, BookOpenCheck, ShieldAlert } from 'lucide-react';
import { UserRole, hasAdminTabPermission, getAdminTabLabel } from '../types';

export const ManageHalaqahUnified: React.FC = () => {
  const { currentSession, halaqahs } = useApp();
  const user = currentSession.user;

  const allTabs = [
    {
      id: 'lembaga' as const,
      label: getAdminTabLabel('kelashalaqah', 'lembaga', 'Halaqah Lembaga'),
      icon: Home,
      count: halaqahs.filter(h => h.sourceType !== 'private_halaqah').length,
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
    },
    {
      id: 'presensi' as const,
      label: getAdminTabLabel('kelashalaqah', 'presensi', 'Kehadiran & Presensi Guru'),
      icon: UserCheck,
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
    },
    {
      id: 'jadwal' as const,
      label: getAdminTabLabel('kelashalaqah', 'jadwal', 'Jadwal Mengajar Guru'),
      icon: CalendarDays,
      badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400'
    }
  ];

  // Filter tabs strictly based on sub-admin permissions
  const tabs = allTabs.filter(tab => hasAdminTabPermission(user, 'kelashalaqah', tab.id));

  const [activeTab, setActiveTab] = useState<'lembaga' | 'presensi' | 'jadwal'>(() => {
    return tabs[0]?.id || 'lembaga';
  });

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans text-slate-900 dark:text-white">
              Pusat Manajemen Halaqah & Guru
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tata kelola halaqah santri lembaga, presensi kehadiran guru, serta jadwal mengajar
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
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${tab.badgeColor}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tab Content */}
      {tabs.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Akses Tab Dibatasi</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Akun Anda belum memiliki izin akses untuk sub-tab pada menu Halaqah. Hubungi Administrator Utama untuk memperbarui hak akses Anda.
          </p>
        </div>
      ) : (
        <div>
          {activeTab === 'lembaga' && tabs.some(t => t.id === 'lembaga') && <ManageHalaqah />}
          {activeTab === 'presensi' && tabs.some(t => t.id === 'presensi') && <ManageSetoran isolatedTab="presensi_guru" />}
          {activeTab === 'jadwal' && tabs.some(t => t.id === 'jadwal') && <ManageSetoran isolatedTab="jadwal_guru" />}
        </div>
      )}
    </div>
  );
};
