import React from 'react';
import { LayoutTemplate, CheckCircle2, Circle, ArrowRight, Code2 } from 'lucide-react';

export const modularizationData = {
  guru: [
    { id: 'guru_dashboard', name: 'DASHBOARD GURU', status: 'done', currentFile: 'GuruDashboard.tsx' },
    { id: 'guru_siswas', name: 'SISWA HALAQAH', status: 'done', currentFile: 'GuruSiswaHalaqah.tsx' },
    { id: 'guru_mutabaah', name: 'MUTABAAH', status: 'done', currentFile: 'GuruMutabaah.tsx' },
    
    { id: 'guru_target_progress', name: 'Target & Progres', status: 'done', currentFile: 'GuruTargetProgress.tsx' },
    { id: 'guru_murojaah_berpasangan', name: 'Murojaah Berpasangan', status: 'done', currentFile: 'GuruMurojaahBerpasangan.tsx' },
    { id: 'guru_absensi', name: 'Absensi & Kehadiran', status: 'done', currentFile: 'GuruAbsensi.tsx' },
    { id: 'guru_administrasi_rpp', name: 'Administrasi & RPP Guru', status: 'done', currentFile: 'GuruAdministrasiModule.tsx' },
  ],
  siswa: [
    { id: 'siswa_dashboard', name: 'DASHBOARD SISWA', status: 'done', currentFile: 'SiswaDashboard.tsx' },
    { id: 'siswa_mutabaah', name: 'MUTABAAH', status: 'done', currentFile: 'SiswaMutabaah.tsx' },
    { id: 'siswa_program_keilmuan', name: 'PROGRAM KEILMUAN', status: 'done', currentFile: 'ProgramKeilmuanSystem.tsx' },
    { id: 'siswa_hasil_assessment', name: 'HASIL ASSESSMENT (UJIAN)', status: 'done', currentFile: 'AssessmentSystem.tsx' },
    { id: 'siswa_manajemen_syahadah', name: 'SISTEM SYAHADAH (IJAZAH)', status: 'done', currentFile: 'ManageSyahadah.tsx' },
    { id: 'siswa_profil', name: 'PROFIL SISWA', status: 'done', currentFile: 'SiswaProfile.tsx' },
  ],
  admin: [
    { id: 'admin_dashboard', name: 'Dashboard Admin', status: 'done', currentFile: 'Dashboard.tsx' },
    { id: 'admin_struktur', name: 'Struktur Lembaga', status: 'done', currentFile: 'ManageStrukturLembaga.tsx' },
    { id: 'admin_users', name: 'Manajemen Pengguna', status: 'done', currentFile: 'ManageUsers.tsx' },
    { id: 'admin_halaqah', name: 'Manajemen Halaqah', status: 'done', currentFile: 'ManageHalaqah.tsx' },
    { id: 'admin_assessment', name: 'Sistem Assessment', status: 'done', currentFile: 'AssessmentSystem.tsx' },
    { id: 'admin_program', name: 'Program Keilmuan', status: 'done', currentFile: 'ProgramKeilmuanSystem.tsx' },
  ]
};

export const AdminModularizationTracker: React.FC = () => {
  const calculateProgress = (items: any[]) => {
    const done = items.filter(i => i.status === 'done').length;
    return Math.round((done / items.length) * 100);
  };

  const renderSection = (title: string, items: typeof modularizationData.guru) => {
    const progress = calculateProgress(items);
    
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white capitalize">{title}</h3>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-500 w-9">{progress}%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {item.status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${item.status === 'done' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <Code2 className="w-3 h-3" />
                    {item.currentFile}
                  </p>
                </div>
              </div>
              
              <div className="shrink-0">
                {item.status === 'done' ? (
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    Terpisah
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    Menunggu
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-800 to-blue-900 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <LayoutTemplate className="w-6 h-6 text-indigo-300" />
          <h2 className="text-xl font-bold">Tracker Modularisasi Sistem</h2>
        </div>
        <p className="text-indigo-100 text-sm max-w-3xl">
          Dasbor ini melacak progres pemisahan file (refactoring) komponen besar ke file terpisah. 
          Pemisahan ini penting untuk menghindari error saat perbaikan AI dan meningkatkan stabilitas sistem jangka panjang.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderSection('Akun Guru (GuruWorkspace)', modularizationData.guru)}
        <div className="space-y-6">
          {renderSection('Akun Siswa (SiswaWorkspace)', modularizationData.siswa)}
          {renderSection('Akun Admin (Modul Mandiri)', modularizationData.admin)}
        </div>
      </div>
    </div>
  );
};
