/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ManageMataPelajaran } from './ManageMataPelajaran';
import { ManageModul } from './ManageModul';
import { ManageAdministrasiGuru } from './ManageAdministrasiGuru';
import { ManageAssessment } from './AssessmentSystem';
import { BookOpen, Layers, FileSpreadsheet, GraduationCap, ShieldAlert } from 'lucide-react';
import { hasAdminTabPermission, getAdminTabLabel } from '../types';

export const ManageKurikulumModul: React.FC = () => {
  const { mataPelajarans, moduls, currentSession } = useApp();
  const user = currentSession.user;

  const allTabs = [
    {
      id: 'matapelajaran' as const,
      label: getAdminTabLabel('kurikulum_modul', 'matapelajaran', 'Mata Pelajaran & Elemen'),
      icon: BookOpen,
      count: mataPelajarans?.length || 0,
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
    },
    {
      id: 'modul' as const,
      label: getAdminTabLabel('kurikulum_modul', 'modul', 'Modul Pembelajaran'),
      icon: Layers,
      count: moduls?.length || 0,
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
    },
    {
      id: 'administrasi' as const,
      label: getAdminTabLabel('kurikulum_modul', 'administrasi', 'Administrasi Guru (CP, TP, RPP)'),
      icon: FileSpreadsheet,
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
    },
    {
      id: 'assessment' as const,
      label: getAdminTabLabel('kurikulum_modul', 'assessment', 'Bank Assessment'),
      icon: GraduationCap,
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
    }
  ];

  const tabs = allTabs.filter(tab => hasAdminTabPermission(user, 'kurikulum_modul', tab.id));

  const [activeTab, setActiveTab] = useState<'matapelajaran' | 'modul' | 'administrasi' | 'assessment'>(() => {
    return tabs[0]?.id || 'matapelajaran';
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
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans text-slate-900 dark:text-white">
              Pusat Kurikulum, Modul & Assessment
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Integrasi mata pelajaran, capaian & tujuan pembelajaran, modul kurikulum, serta instrumen assessment
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Akses Kurikulum Dibatasi</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Akun Anda tidak memiliki izin akses untuk sub-tab pada menu Kurikulum & Modul. Silakan hubungi Administrator Utama.
          </p>
        </div>
      ) : (
        <div>
          {activeTab === 'matapelajaran' && tabs.some(t => t.id === 'matapelajaran') && <ManageMataPelajaran />}
          {activeTab === 'modul' && tabs.some(t => t.id === 'modul') && <ManageModul />}
          {activeTab === 'administrasi' && tabs.some(t => t.id === 'administrasi') && <ManageAdministrasiGuru />}
          {activeTab === 'assessment' && tabs.some(t => t.id === 'assessment') && <ManageAssessment />}
        </div>
      )}
    </div>
  );
};
