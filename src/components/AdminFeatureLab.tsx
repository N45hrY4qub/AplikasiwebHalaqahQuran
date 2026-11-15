import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  GraduationCap, 
  BookOpen, 
  UserCheck, 
  UserX, 
  Sliders, 
  Tag, 
  Info, 
  ChevronRight, 
  RotateCcw, 
  Save, 
  Plus, 
  Eye, 
  EyeOff, 
  Laptop, 
  Clock, 
  Check, 
  X,
  Layers,
  ArrowRight,
  Trash2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  FeatureFlagItem, 
  FeatureFlagStatus, 
  FeatureCategory, 
  DEFAULT_FEATURE_FLAGS,
  UserRole 
} from '../types';
import { AdminModularizationTracker } from './AdminModularizationTracker';
import { Avatar } from './Avatar';

export const AdminFeatureLab: React.FC = () => {
  const { 
    featureLabConfig, 
    saveFeatureLabConfig, 
    toggleFeatureStatus, 
    deleteFeatureFlag,
    createFeatureFlag,
    resetFeatureFlagsToDefault,
    toggleBetaTester,
    gurus,
    siswas,
    admins,
    halaqahs
  } = useApp();

  // Active sub-tab inside Feature Lab
  const [activeTab, setActiveTab] = useState<'features' | 'testers' | 'modularization'>('features');

  // Filters for Features tab
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru' | 'siswa' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FeatureFlagStatus>('all');
  const [searchFeature, setSearchFeature] = useState('');

  // Filters for Testers tab
  const [testerRoleFilter, setTesterRoleFilter] = useState<'all' | 'guru' | 'siswa' | 'admin'>('all');
  const [searchTester, setSearchTester] = useState('');

  // Permanent Delete Feature Modal State
  const [featureToDelete, setFeatureToDelete] = useState<FeatureFlagItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Feature Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureCategory, setNewFeatureCategory] = useState<FeatureCategory>('guru');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newFeatureVersion, setNewFeatureVersion] = useState('v1.0-preview');
  const [newFeatureBadge, setNewFeatureBadge] = useState('Baru');
  const [newFeatureStatus, setNewFeatureStatus] = useState<FeatureFlagStatus>('beta');
  const [newFeaturePoints, setNewFeaturePoints] = useState('');

  // Reset/Restore Confirmation Modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Stats calculation
  const features = featureLabConfig.features || [];
  const betaTesterUserIds = featureLabConfig.betaTesterUserIds || [];

  const totalFeatures = features.length;
  const betaCount = features.filter(f => f.status === 'beta').length;
  const liveCount = features.filter(f => f.status === 'live').length;
  const offCount = features.filter(f => f.status === 'off').length;

  // Breakdown of active testers (Admin Utama dikecualikan karena pengelola sistem)
  const testerGuruCount = betaTesterUserIds.filter(id => gurus.some(g => g.id === id)).length;
  const testerSiswaCount = betaTesterUserIds.filter(id => siswas.some(s => s.id === id)).length;
  const isMainAdmin = (a: any) => a.id === 'adm-1' || a.adminRole === 'SUPER_ADMIN' || a.id === admins[0]?.id;
  const staffAdmins = admins.filter(a => !isMainAdmin(a));
  const testerAdminCount = betaTesterUserIds.filter(id => staffAdmins.some(a => a.id === id)).length;

  // Filtered features
  const filteredFeatures = useMemo(() => {
    return features.filter(f => {
      const matchRole = roleFilter === 'all' || f.category === roleFilter || f.category === 'all';
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchSearch = searchFeature === '' || 
        f.name.toLowerCase().includes(searchFeature.toLowerCase()) ||
        f.description.toLowerCase().includes(searchFeature.toLowerCase()) ||
        (f.versionTag && f.versionTag.toLowerCase().includes(searchFeature.toLowerCase()));
      return matchRole && matchStatus && matchSearch;
    });
  }, [features, roleFilter, statusFilter, searchFeature]);

  // Unified list of users for tester management (Admin Utama dikecualikan)
  const allUsersList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      email?: string;
      role: 'guru' | 'siswa' | 'admin';
      meta: string;
      fotoProfil?: string;
    }> = [];

    // Sub-Admins / Staf (Admin Utama tidak dimasukkan karena bertindak sebagai pengatur akun-akun selainnya)
    staffAdmins.forEach(a => {
      list.push({
        id: a.id,
        name: a.namaLengkap,
        email: a.email,
        role: 'admin',
        meta: (a as any).jabatan || 'Staf Administrator',
        fotoProfil: a.fotoProfil
      });
    });

    // Gurus
    gurus.forEach(g => {
      const hNama = g.halaqahBimbinganNama || halaqahs.find(h => h.id === g.halaqahBimbinganId)?.namaHalaqah || g.jabatan || 'Guru Pengampu';
      list.push({
        id: g.id,
        name: g.namaLengkap,
        email: g.email,
        role: 'guru',
        meta: `Halaqah: ${hNama}`,
        fotoProfil: g.fotoProfil
      });
    });

    // Siswas
    siswas.forEach(s => {
      const hNama = halaqahs.find(h => h.id === s.halaqahId)?.namaHalaqah || 'Belum ada halaqah';
      list.push({
        id: s.id,
        name: s.namaLengkap,
        email: s.nis,
        role: 'siswa',
        meta: `NIS: ${s.nis} • ${hNama}`,
        fotoProfil: s.fotoProfil
      });
    });

    return list;
  }, [staffAdmins, gurus, siswas, halaqahs]);

  // Main Admin reference
  const mainAdmin = useMemo(() => {
    return admins.find(a => isMainAdmin(a)) || admins[0];
  }, [admins]);

  // Distinct segmented lists for each account type
  const adminUsers = useMemo(() => {
    return allUsersList.filter(u => u.role === 'admin').filter(u => {
      if (!searchTester) return true;
      const q = searchTester.toLowerCase();
      return u.name.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q)) || u.meta.toLowerCase().includes(q);
    });
  }, [allUsersList, searchTester]);

  const guruUsers = useMemo(() => {
    return allUsersList.filter(u => u.role === 'guru').filter(u => {
      if (!searchTester) return true;
      const q = searchTester.toLowerCase();
      return u.name.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q)) || u.meta.toLowerCase().includes(q);
    });
  }, [allUsersList, searchTester]);

  const siswaUsers = useMemo(() => {
    return allUsersList.filter(u => u.role === 'siswa').filter(u => {
      if (!searchTester) return true;
      const q = searchTester.toLowerCase();
      return u.name.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q)) || u.meta.toLowerCase().includes(q);
    });
  }, [allUsersList, searchTester]);

  const filteredUsers = useMemo(() => {
    return allUsersList.filter(u => {
      const matchRole = testerRoleFilter === 'all' || u.role === testerRoleFilter;
      const matchSearch = searchTester === '' ||
        u.name.toLowerCase().includes(searchTester.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTester.toLowerCase())) ||
        u.meta.toLowerCase().includes(searchTester.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [allUsersList, testerRoleFilter, searchTester]);

  // Batch actions
  const handleBatchEnrollAllGurus = async () => {
    const guruIds = gurus.map(g => g.id);
    const merged = Array.from(new Set([...betaTesterUserIds, ...guruIds])).filter(id => id !== 'adm-1');
    await saveFeatureLabConfig({
      ...featureLabConfig,
      betaTesterUserIds: merged,
      updatedAt: new Date().toISOString()
    });
    showToast(`Berhasil menjadikan seluruh ${guruIds.length} Guru sebagai Penguji Upgrade.`);
  };

  const handleBatchRevokeRole = async (role: 'guru' | 'siswa' | 'admin') => {
    const targetIds = allUsersList.filter(u => u.role === role).map(u => u.id);
    const updated = betaTesterUserIds.filter(id => !targetIds.includes(id) && id !== 'adm-1');
    await saveFeatureLabConfig({
      ...featureLabConfig,
      betaTesterUserIds: updated,
      updatedAt: new Date().toISOString()
    });
    const label = role === 'guru' ? 'Guru' : role === 'siswa' ? 'Santri' : 'Staf Admin';
    showToast(`Hak penguji untuk seluruh akun ${label} telah dinonaktifkan.`);
  };

  const handleBatchResetTesters = async () => {
    // Reset ke akun guru percontohan saja tanpa menyertakan Admin Utama
    await saveFeatureLabConfig({
      ...featureLabConfig,
      betaTesterUserIds: ['gru-koordinator'],
      updatedAt: new Date().toISOString()
    });
    showToast(`Daftar akun penguji berhasil direset ke pengaturan awal.`);
  };

  const handleResetDefaultFeatures = async () => {
    await saveFeatureLabConfig({
      ...featureLabConfig,
      features: DEFAULT_FEATURE_FLAGS,
      updatedAt: new Date().toISOString()
    });
    showToast(`Daftar fitur upgrade berhasil dikembalikan ke standar bawaan.`);
  };

  return (
    <div className="space-y-6" id="feature-lab-manager-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="feature-lab-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium transition-all transform duration-200 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700 shadow-emerald-950/20'
              : 'bg-indigo-900 text-indigo-100 border-indigo-700 shadow-indigo-950/20'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMessage.text}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-indigo-800/30">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold tracking-wide">
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              <span>SISTEM FEATURE FLAGS & CANARY TESTING</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Laboratorium Fitur & Penguji Upgrade
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Pusat kendali eksperimen peningkatan fitur untuk akun Guru, Siswa, dan Admin. 
              Tentukan akun pengguna mana saja yang menjadi penguji sebelum fitur dirilis secara publik.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              onClick={handleResetDefaultFeatures}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-medium text-slate-200 transition"
              title="Kembalikan daftar fitur ke standar awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Fitur Bawaan</span>
            </button>
          </div>
        </div>

        {/* Protection / Canary Guarantee Info Box */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white block">Keamanan Pengguna Umum</span>
              Pengguna non-penguji tidak akan melihat perubahan mendadak atau terganggu oleh fitur dalam tahap uji coba.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white block">Akses Penguji Terarah</span>
              Hanya akun terpilih di tab &quot;Penunjukan Akun&quot; yang dapat mengakses dan mengevaluasi modul beta.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white block">Rollback Instan 1-Klik</span>
              Jika terjadi evaluasi atau pembatalan ide fitur, admin dapat menonaktifkan atau mengembalikan status seketika.
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Fitur Upgrade</div>
            <div className="text-xl font-bold text-slate-800 dark:text-white">{totalFeatures} Modul</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Dalam Uji Coba Beta</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{betaCount} Fitur</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Rilis Penuh (Live)</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{liveCount} Fitur</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Akun Penguji Aktif</div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {betaTesterUserIds.length} <span className="text-xs font-normal text-slate-400">({testerGuruCount} Guru • {testerSiswaCount} Santri{testerAdminCount > 0 ? ` • ${testerAdminCount} Staf` : ''})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="w-full max-w-full overflow-hidden border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full">
          <button
            id="tab-features-btn"
            onClick={() => setActiveTab('features')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
              activeTab === 'features'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span>Katalog Fitur Upgrade ({totalFeatures})</span>
          </button>

          <button
            id="tab-testers-btn"
            onClick={() => setActiveTab('testers')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
              activeTab === 'testers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Penunjukan Akun Penguji ({betaTesterUserIds.length})</span>
          </button>

          <button
            id="tab-modularization-btn"
            onClick={() => setActiveTab('modularization')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
              activeTab === 'modularization'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Arsip Modularisasi (100% Selesai)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FEATURES CATALOG */}
      {activeTab === 'features' && (
        <div className="space-y-4" id="features-catalog-panel">
          {/* Information Banner & Action Bar */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900/60 dark:to-slate-900/40 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Manajemen Siklus Rilis & Pembatalan Fitur
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    Feature Lifecycle
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Gunakan status <span className="font-semibold text-slate-700 dark:text-slate-300">⚪ Nonaktif</span> untuk mematikan fitur sementara waktu (dapat diaktifkan kembali kapan saja). Jika fitur diputuskan tidak jadi digunakan atau rencana upgrade dibatalkan, gunakan tombol <span className="font-semibold text-rose-600 dark:text-rose-400">🗑️ Hapus Permanen</span> pada masing-masing kartu fitur di bawah.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {(featureLabConfig.deletedFeatureIds || []).length > 0 && (
                <button
                  type="button"
                  id="btn-restore-default-features"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
                  title="Pulihkan fitur bawaan sistem yang pernah dihapus"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pulihkan Bawaan ({(featureLabConfig.deletedFeatureIds || []).length})</span>
                </button>
              )}

              <button
                type="button"
                id="btn-add-feature-flag"
                onClick={() => {
                  setNewFeatureName('');
                  setNewFeatureCategory('guru');
                  setNewFeatureDesc('');
                  setNewFeatureVersion('v1.0-preview');
                  setNewFeatureBadge('Baru');
                  setNewFeatureStatus('beta');
                  setNewFeaturePoints('');
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Fitur Upgrade</span>
              </button>
            </div>
          </div>

          {/* Controls & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFeature}
                onChange={e => setSearchFeature(e.target.value)}
                placeholder="Cari nama fitur, modul, atau tag versi..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
              />
              {searchFeature && (
                <button
                  onClick={() => setSearchFeature('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    roleFilter === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Semua Role
                </button>
                <button
                  onClick={() => setRoleFilter('guru')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    roleFilter === 'guru' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  👨‍🏫 Guru
                </button>
                <button
                  onClick={() => setRoleFilter('siswa')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    roleFilter === 'siswa' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🎓 Siswa
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    roleFilter === 'admin' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🛡️ Admin
                </button>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Semua Status
                </button>
                <button
                  onClick={() => setStatusFilter('beta')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    statusFilter === 'beta' ? 'bg-amber-500 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🧪 Beta
                </button>
                <button
                  onClick={() => setStatusFilter('live')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    statusFilter === 'live' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🟢 Live
                </button>
                <button
                  onClick={() => setStatusFilter('off')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    statusFilter === 'off' ? 'bg-slate-400 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ⚪ Off
                </button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeatures.map(feat => {
              const categoryBadge = {
                guru: { label: 'Akun Guru', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50' },
                siswa: { label: 'Akun Santri', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' },
                admin: { label: 'Akun Admin', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50' },
                all: { label: 'Semua Akun', color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
              }[feat.category];

              return (
                <div
                  key={feat.id}
                  id={`feature-card-${feat.id}`}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                    feat.status === 'beta'
                      ? 'border-amber-300/80 dark:border-amber-700/60 ring-1 ring-amber-400/20'
                      : feat.status === 'live'
                      ? 'border-emerald-300/80 dark:border-emerald-700/60 ring-1 ring-emerald-400/20'
                      : 'border-slate-200 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryBadge.color}`}>
                          {categoryBadge.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono font-medium">
                          {feat.versionTag}
                        </span>
                        {feat.badgeText && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                            {feat.badgeText}
                          </span>
                        )}
                      </div>

                      {/* Current Status Indicator */}
                      <div>
                        {feat.status === 'beta' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
                            <FlaskConical className="w-3 h-3" />
                            Uji Coba Beta
                          </span>
                        )}
                        {feat.status === 'live' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3" />
                            Rilis Publik
                          </span>
                        )}
                        {feat.status === 'off' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <EyeOff className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h4 className="text-base font-bold text-slate-800 dark:text-white leading-snug">
                        {feat.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>

                    {/* Highlight Points */}
                    {feat.highlightPoints && feat.highlightPoints.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Sorotan Kemampuan:
                        </span>
                        <ul className="space-y-1">
                          {feat.highlightPoints.map((pt, i) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Bottom Segmented Status Controller */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Status Ketersediaan:</span>
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">
                        {feat.status === 'beta' 
                          ? `${betaTesterUserIds.length} Akun Penguji Berhak Akses` 
                          : feat.status === 'live' 
                          ? 'Dapat Diakses Seluruh Pengguna' 
                          : 'Terkunci / Nonaktif Sementara'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                      {/* OFF */}
                      <button
                        type="button"
                        onClick={async () => {
                          await toggleFeatureStatus(feat.id, 'off');
                          showToast(`Fitur "${feat.name}" dinonaktifkan sementara.`);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          feat.status === 'off'
                            ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                        title="Matikan sementara fitur ini tanpa menghapusnya dari sistem"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Nonaktif</span>
                      </button>

                      {/* BETA */}
                      <button
                        type="button"
                        onClick={async () => {
                          await toggleFeatureStatus(feat.id, 'beta');
                          showToast(`Fitur "${feat.name}" diset ke Uji Coba Beta (Hanya Penguji).`);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          feat.status === 'beta'
                            ? 'bg-amber-500 text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                        title="Buka akses fitur khusus bagi akun yang terdaftar sebagai penguji beta"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>🧪 Uji Coba</span>
                      </button>

                      {/* LIVE */}
                      <button
                        type="button"
                        onClick={async () => {
                          await toggleFeatureStatus(feat.id, 'live');
                          showToast(`Fitur "${feat.name}" berhasil dirilis penuh (Live untuk semua)!`);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          feat.status === 'live'
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                        title="Rilis penuh fitur untuk seluruh pengguna tanpa terkecuali"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>🟢 Rilis Live</span>
                      </button>
                    </div>

                    {/* Permanent Delete Action / Cancel Upgrade */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                      <span className="text-slate-400 dark:text-slate-500">
                        Batal upgrade / tidak digunakan?
                      </span>
                      <button
                        type="button"
                        onClick={() => setFeatureToDelete(feat)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 font-medium transition cursor-pointer"
                        title="Hapus fitur ini secara permanen dari sistem dan batalkan upgrade"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFeatures.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <FlaskConical className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">Tidak ada fitur yang cocok</h4>
              <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci pencarian atau filter status dan perannya.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BETA TESTER MANAGEMENT */}
      {activeTab === 'testers' && (
        <div className="space-y-6" id="beta-testers-panel">
          {/* Header Actions & Quick Shortcuts */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span>Daftar Penunjukan Akun Penguji (Beta Tester Ring)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola dan tunjuk akun penguji berdasarkan kelompok akun: Administrator, Guru Pengampu, dan Santri Bimbingan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBatchEnrollAllGurus}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Jadikan Semua Guru Penguji</span>
                </button>

                <button
                  onClick={handleBatchResetTesters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Bawaan</span>
                </button>
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTesterRoleFilter('all')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  testerRoleFilter === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Semua Kategori</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  testerRoleFilter === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {betaTesterUserIds.length} Penguji
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTesterRoleFilter('admin')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  testerRoleFilter === 'admin'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-300 hover:bg-purple-100/60 dark:hover:bg-purple-900/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>1. Akun Admin</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  testerRoleFilter === 'admin' ? 'bg-purple-700 text-white' : 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200'
                }`}>
                  {staffAdmins.length > 0 ? `${testerAdminCount} Penguji` : 'Utama (Akses Penuh)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTesterRoleFilter('guru')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  testerRoleFilter === 'guru'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <span>2. Akun Guru</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  testerRoleFilter === 'guru' ? 'bg-blue-700 text-white' : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                }`}>
                  {testerGuruCount} / {gurus.length} Penguji
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTesterRoleFilter('siswa')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  testerRoleFilter === 'siswa'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>3. Akun Siswa</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  testerRoleFilter === 'siswa' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                }`}>
                  {testerSiswaCount} / {siswas.length} Penguji
                </span>
              </button>
            </div>

            {/* Filter Bar & Search */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTester}
                onChange={e => setSearchTester(e.target.value)}
                placeholder="Cari pengguna di semua kategori berdasarkan nama, email, NIS, atau halaqah..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
              />
              {searchTester && (
                <button
                  onClick={() => setSearchTester('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 1: KELOMPOK AKUN ADMINISTRATOR                       */}
          {/* ============================================================ */}
          {(testerRoleFilter === 'all' || testerRoleFilter === 'admin') && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-sm overflow-hidden" id="section-admin-testers">
              {/* Header Section */}
              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border-b border-purple-200/80 dark:border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        1. Kelompok Akun Administrator
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-300 dark:border-purple-800">
                        {staffAdmins.length > 0 ? `1 Admin Utama • ${staffAdmins.length} Staf Admin` : '1 Admin Utama Terdaftar'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pengelola sistem utama memiliki hak penuh, sedangkan staf admin operasional dapat ditugaskan sebagai penguji.
                    </p>
                  </div>
                </div>

                {staffAdmins.length > 0 && testerAdminCount > 0 && (
                  <button
                    onClick={() => handleBatchRevokeRole('admin')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Cabut Semua Penguji Staf</span>
                  </button>
                )}
              </div>

              {/* Card Admin Utama */}
              <div className="p-4 bg-purple-50/30 dark:bg-purple-950/10 border-b border-purple-100 dark:border-purple-900/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-purple-200 dark:border-purple-800/50">
                  <div className="flex items-center gap-3">
                    <Avatar
                      namaLengkap={mainAdmin?.namaLengkap || 'Administrator Utama'}
                      fotoProfil={mainAdmin?.fotoProfil}
                      className="w-10 h-10 text-sm font-bold shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {mainAdmin?.namaLengkap || 'Administrator Utama'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                          Super Administrator
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {mainAdmin?.email || 'admin@sistem.id'} • ID: <span className="font-semibold text-purple-600 dark:text-purple-400">{mainAdmin?.id || 'adm-1'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                      <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Pengelola Sistem (Akses Penuh Otomatis)</span>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1 leading-relaxed">
                  💡 <strong>Catatan Otoritas:</strong> Admin Utama tidak perlu dicentang sebagai tester karena memegang wewenang mengatur konfigurasi fitur dan otomatis dapat menguji semua fitur upgrade.
                </div>
              </div>

              {/* Tabel Staf Administrator (Jika ada staf admin) */}
              {staffAdmins.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Staf Administrator</th>
                        <th className="py-2.5 px-4">Jabatan & Hak Akses</th>
                        <th className="py-2.5 px-4">ID Akun</th>
                        <th className="py-2.5 px-4 text-center">Status Penguji</th>
                        <th className="py-2.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {adminUsers.map(user => {
                        const isTester = betaTesterUserIds.includes(user.id);
                        return (
                          <tr key={user.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${isTester ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  namaLengkap={user.name}
                                  fotoProfil={user.fotoProfil}
                                  className="w-8 h-8 text-xs font-bold shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    {isTester && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        Penguji
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">{user.email || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">{user.meta}</td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{user.id}</td>
                            <td className="py-3 px-4 text-center">
                              {isTester ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-800">
                                  <FlaskConical className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  Penguji Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                                  Biasa
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={async () => {
                                  await toggleBetaTester(user.id);
                                  showToast(isTester ? `Status penguji ${user.name} dinonaktifkan.` : `${user.name} dijadikan Tim Penguji!`);
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                  isTester
                                    ? 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                    : 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                }`}
                              >
                                {isTester ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Cabut Hak</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Jadikan Penguji</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {adminUsers.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Tidak ada staf admin yang cocok dengan kata kunci pencarian.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 text-center text-xs text-slate-500">
                  Tidak ada staf administrator tambahan. Seluruh wewenang sistem saat ini dikelola oleh Admin Utama.
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION 2: KELOMPOK AKUN GURU PENGAMPU                       */}
          {/* ============================================================ */}
          {(testerRoleFilter === 'all' || testerRoleFilter === 'guru') && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-sm overflow-hidden" id="section-guru-testers">
              {/* Header Section */}
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        2. Kelompok Akun Guru Pengampu
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-bold border border-blue-300 dark:border-blue-800">
                        {testerGuruCount} Penguji Aktif dari {gurus.length} Guru
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ustadz/Ustadzah pembina halaqah yang berhak mencoba modul pembelajaran dan penilaian baru.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchEnrollAllGurus}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Jadikan Semua Guru Penguji</span>
                  </button>
                  {testerGuruCount > 0 && (
                    <button
                      onClick={() => handleBatchRevokeRole('guru')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Cabut Semua</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabel Guru */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Guru Pengampu</th>
                      <th className="py-2.5 px-4">Halaqah Bimbingan & Tugas</th>
                      <th className="py-2.5 px-4">ID Akun</th>
                      <th className="py-2.5 px-4 text-center">Status Penguji</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {guruUsers.map(user => {
                      const isTester = betaTesterUserIds.includes(user.id);
                      return (
                        <tr 
                          key={user.id} 
                          id={`tester-guru-${user.id}`}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${isTester ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar
                                namaLengkap={user.name}
                                fotoProfil={user.fotoProfil}
                                className="w-8 h-8 text-xs font-bold shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isTester && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Penguji
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">{user.email || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-700 dark:text-slate-300">{user.meta}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{user.id}</td>
                          <td className="py-3 px-4 text-center">
                            {isTester ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-800">
                                <FlaskConical className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                Penguji Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                                Pengguna Biasa
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                await toggleBetaTester(user.id);
                                showToast(
                                  isTester 
                                    ? `Status penguji untuk Ust. ${user.name} dinonaktifkan.` 
                                    : `Ust. ${user.name} resmi ditambahkan ke Tim Penguji Upgrade!`
                                );
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                isTester
                                  ? 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                  : 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              }`}
                            >
                              {isTester ? (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Cabut Hak Penguji</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Jadikan Penguji</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {guruUsers.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Tidak ada akun guru yang cocok dengan pencarian &quot;{searchTester}&quot;.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION 3: KELOMPOK AKUN SANTRI / SISWA                      */}
          {/* ============================================================ */}
          {(testerRoleFilter === 'all' || testerRoleFilter === 'siswa') && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm overflow-hidden" id="section-siswa-testers">
              {/* Header Section */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-200/80 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        3. Kelompok Akun Santri / Siswa Bimbingan
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                        {testerSiswaCount} Penguji Aktif dari {siswas.length} Santri
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Santri perwakilan yang dapat mencoba tampilan dashboard santri, hafalan mandiri, atau fitur mutabaah terbaru.
                    </p>
                  </div>
                </div>

                {testerSiswaCount > 0 && (
                  <button
                    onClick={() => handleBatchRevokeRole('siswa')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Cabut Semua Penguji Santri</span>
                  </button>
                )}
              </div>

              {/* Tabel Santri */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Santri Bimbingan</th>
                      <th className="py-2.5 px-4">NIS & Halaqah</th>
                      <th className="py-2.5 px-4">ID Santri</th>
                      <th className="py-2.5 px-4 text-center">Status Penguji</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {siswaUsers.map(user => {
                      const isTester = betaTesterUserIds.includes(user.id);
                      return (
                        <tr 
                          key={user.id}
                          id={`tester-siswa-${user.id}`}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${isTester ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar
                                namaLengkap={user.name}
                                fotoProfil={user.fotoProfil}
                                className="w-8 h-8 text-xs font-bold shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isTester && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Penguji
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">NIS: {user.email || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-700 dark:text-slate-300">{user.meta}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{user.id}</td>
                          <td className="py-3 px-4 text-center">
                            {isTester ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-800">
                                <FlaskConical className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                Penguji Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                                Pengguna Biasa
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                await toggleBetaTester(user.id);
                                showToast(
                                  isTester 
                                    ? `Status penguji santri ${user.name} dinonaktifkan.` 
                                    : `Santri ${user.name} ditunjuk sebagai Penguji Upgrade!`
                                );
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                isTester
                                  ? 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {isTester ? (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Cabut Hak Penguji</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Jadikan Penguji</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {siswaUsers.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Tidak ada akun santri yang cocok dengan pencarian &quot;{searchTester}&quot;.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MODULARIZATION ARCHIVE */}
      {activeTab === 'modularization' && (
        <div className="space-y-4" id="modularization-archive-panel">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block text-sm">Status Arsitektur Modular: 100% Selesai & Mandiri</span>
              Seluruh modul akun Guru (7 modul), akun Siswa (6 modul), dan akun Admin telah berhasil dipisahkan ke dalam komponen mandiri yang siap dihubungkan dengan saklar Feature Lab di atas.
            </div>
          </div>
          <AdminModularizationTracker />
        </div>
      )}

      {/* MODAL 1: KONFIRMASI HAPUS PERMANEN FITUR UPGRADE */}
      {featureToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Hapus Permanen Fitur Upgrade?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Batalkan rencana upgrade dan hapus fitur ini secara menyeluruh dari katalog sistem.
                </p>
              </div>
            </div>

            {/* Target Feature Details Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                  {featureToDelete.category === 'guru' ? 'Guru' : featureToDelete.category === 'siswa' ? 'Santri' : featureToDelete.category === 'admin' ? 'Admin' : 'Semua'}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {featureToDelete.versionTag}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                {featureToDelete.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {featureToDelete.description}
              </p>
            </div>

            {/* Warning Callout Box */}
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Perbedaan Nonaktif vs Hapus Permanen</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                • <strong>Nonaktif</strong>: Fitur tetap ada di daftar dan kodenya tersimpan, hanya dimatikan sementara.<br />
                • <strong>Hapus Permanen</strong>: Fitur dihapus total dari database & katalog upgrade. Pengguna/penguji tidak akan lagi dapat melihatnya.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFeatureToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-feature"
                disabled={isDeleting}
                onClick={async () => {
                  if (!featureToDelete) return;
                  setIsDeleting(true);
                  try {
                    await deleteFeatureFlag(featureToDelete.id);
                    showToast(`Fitur "${featureToDelete.name}" berhasil dihapus secara permanen.`, 'success');
                    setFeatureToDelete(null);
                  } catch (e) {
                    showToast('Gagal menghapus fitur.', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH FITUR UPGRADE BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Tambah Fitur Upgrade Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan rencana fitur baru ke dalam katalog Laboratorium Fitur.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newFeatureName.trim()) {
                  showToast('Nama fitur wajib diisi.', 'error');
                  return;
                }
                const points = newFeaturePoints
                  .split('\n')
                  .map(p => p.trim())
                  .filter(Boolean);

                try {
                  await createFeatureFlag({
                    name: newFeatureName.trim(),
                    category: newFeatureCategory,
                    description: newFeatureDesc.trim() || 'Fitur baru dalam tahap pengembangan.',
                    status: newFeatureStatus,
                    versionTag: newFeatureVersion.trim() || 'v1.0-preview',
                    badgeText: newFeatureBadge.trim() || undefined,
                    highlightPoints: points.length > 0 ? points : undefined
                  });
                  showToast(`Fitur upgrade "${newFeatureName}" berhasil ditambahkan ke katalog!`, 'success');
                  setIsAddModalOpen(false);
                } catch (err) {
                  showToast('Gagal menambahkan fitur baru.', 'error');
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Fitur Upgrade <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFeatureName}
                  onChange={e => setNewFeatureName(e.target.value)}
                  placeholder="Contoh: Generator Kuis Mandiri Santri"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Sasaran Akun / Kategori
                  </label>
                  <select
                    value={newFeatureCategory}
                    onChange={e => setNewFeatureCategory(e.target.value as FeatureCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="guru">👨‍🏫 Akun Guru Pengampu</option>
                    <option value="siswa">🎓 Akun Santri Bimbingan</option>
                    <option value="admin">🛡️ Akun Administrator</option>
                    <option value="all">🌐 Semua Kelompok Akun</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Status Ketersediaan Awal
                  </label>
                  <select
                    value={newFeatureStatus}
                    onChange={e => setNewFeatureStatus(e.target.value as FeatureFlagStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="beta">🧪 Uji Coba Beta (Hanya Penguji)</option>
                    <option value="off">⚪ Nonaktif Sementara (Disimpan)</option>
                    <option value="live">🟢 Rilis Live (Seluruh Pengguna)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tag Versi / Milestone
                  </label>
                  <input
                    type="text"
                    value={newFeatureVersion}
                    onChange={e => setNewFeatureVersion(e.target.value)}
                    placeholder="v1.0-preview"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Lencana / Label Badge
                  </label>
                  <input
                    type="text"
                    value={newFeatureBadge}
                    onChange={e => setNewFeatureBadge(e.target.value)}
                    placeholder="Baru, Eksperimen, Unggulan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Deskripsi & Tujuan Fitur
                </label>
                <textarea
                  rows={2}
                  value={newFeatureDesc}
                  onChange={e => setNewFeatureDesc(e.target.value)}
                  placeholder="Jelaskan manfaat dan alur fitur ini secara singkat..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Sorotan Kemampuan (1 baris per poin)
                </label>
                <textarea
                  rows={3}
                  value={newFeaturePoints}
                  onChange={e => setNewFeaturePoints(e.target.value)}
                  placeholder="Poin 1: Otomatisasi pembuatan kuis&#10;Poin 2: Terintegrasi buku mutabaah&#10;Poin 3: Analitik progres hafalan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan ke Katalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PULIHKAN FITUR BAWAAN */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Pulihkan Seluruh Fitur Bawaan?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sistem akan mengembalikan fitur-fitur standar bawaan sistem yang sebelumnya telah Anda hapus dari katalog.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1 leading-relaxed">
              <p>
                Terdapat <strong>{(featureLabConfig.deletedFeatureIds || []).length} fitur bawaan</strong> yang saat ini berstatus terhapus.
              </p>
              <p className="text-slate-500 text-[11px]">
                Dengan memulihkan bawaan, daftar fitur standar akan kembali tersedia untuk diuji coba atau dirilis live.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-restore-default"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await resetFeatureFlagsToDefault();
                    showToast('Seluruh fitur bawaan berhasil dipulihkan ke katalog!', 'success');
                    setIsResetConfirmOpen(false);
                  } catch (e) {
                    showToast('Gagal memulihkan fitur bawaan.', 'error');
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Memulihkan...' : 'Ya, Pulihkan Bawaan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
