/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { saveSharedState } from '../lib/firebaseShare';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Info, 
  ShieldCheck, 
  Check, 
  FileCode,
  Search,
  X,
  Share2,
  Link,
  Copy,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Palette,
  Smartphone,
  Laptop,
  RotateCcw,
  FileImage,
  Sparkles,
  BookOpen,
  Cloud,
  FlaskConical,
  Calendar,
  CheckCircle2,
  Save,
  History
} from 'lucide-react';
import { OPERATIONAL_CONFIG, getOperationalStatus } from '../utils/operationalHours';
import { compressBase64Image } from '../utils/imageCompressor';
import { GoogleWorkspace } from './GoogleWorkspace';
import { AdaptiveLogo } from './AdaptiveLogo';
import { MasterDisasterRecovery } from './MasterDisasterRecovery';
import { AdminModularizationTracker } from './AdminModularizationTracker';
import { AdminFeatureLab } from './AdminFeatureLab';
import { InstitutionThemeSettingsCard } from './InstitutionThemeSettingsCard';
import { formatHijriDate, getOffsetPreview } from '../utils/hijriDate';
import { resolveInstitutionName, DEFAULT_INSTITUTION_NAME } from '../utils/brandingHelper';

export const SystemBackup: React.FC = () => {
  const { 
    backupDatabase, 
    restoreDatabase, 
    auditLogs,
    addLog,
    saveOperationalHours,
    pwaSettings,
    updatePwaSettings,
    hijriSetting,
    updateHijriSetting,
    strukturLembaga
  } = useApp();

  // Sub Tab Navigation state
  const [activeSubTab, setActiveSubTab] = useState<'maintenance' | 'branding' | 'theme_color' | 'hijri_calendar' | 'audit_log' | 'google_workspace' | 'feature_lab' | 'modularisasi'>('maintenance');

  // Kalender Hijriah State
  const [hijriMode, setHijriMode] = useState<'auto_offset' | 'manual'>(() => hijriSetting?.mode || 'auto_offset');
  const [hijriDayOffset, setHijriDayOffset] = useState<number>(() => hijriSetting?.dayOffset ?? 0);
  const [hijriCustomText, setHijriCustomText] = useState<string>(() => hijriSetting?.customText || '');
  const [isSavingHijri, setIsSavingHijri] = useState(false);
  const [hijriSuccessMsg, setHijriSuccessMsg] = useState('');
  const [hijriErrorMsg, setHijriErrorMsg] = useState('');

  React.useEffect(() => {
    if (hijriSetting) {
      setHijriMode(hijriSetting.mode || 'auto_offset');
      setHijriDayOffset(hijriSetting.dayOffset ?? 0);
      setHijriCustomText(hijriSetting.customText || '');
    }
  }, [hijriSetting]);

  const handleSaveHijriCalendar = async () => {
    setIsSavingHijri(true);
    setHijriSuccessMsg('');
    setHijriErrorMsg('');
    try {
      await updateHijriSetting({
        mode: hijriMode,
        dayOffset: hijriDayOffset,
        customText: hijriCustomText
      });
      setHijriSuccessMsg('Pengaturan kalender Hijriah & hilal berhasil disimpan dan disinkronkan ke seluruh aplikasi!');
    } catch (err: any) {
      setHijriErrorMsg('Gagal menyimpan pengaturan kalender Hijriah: ' + (err?.message || err));
    } finally {
      setIsSavingHijri(false);
    }
  };

  const handleResetHijriCalendar = async () => {
    setHijriMode('auto_offset');
    setHijriDayOffset(0);
    setHijriCustomText('');
    setIsSavingHijri(true);
    setHijriSuccessMsg('');
    setHijriErrorMsg('');
    try {
      await updateHijriSetting({
        mode: 'auto_offset',
        dayOffset: 0,
        customText: ''
      });
      setHijriSuccessMsg('Kalender Hijriah berhasil dikembalikan ke standar bawaan (Offset 0 hari).');
    } catch (err: any) {
      setHijriErrorMsg('Gagal mereset kalender Hijriah.');
    } finally {
      setIsSavingHijri(false);
    }
  };

  // Branding PWA settings state
  const resolvedDefaultName = resolveInstitutionName(pwaSettings?.appName, strukturLembaga?.yayasan?.nama);
  const [appName, setAppName] = useState(resolvedDefaultName);
  const [appIcon, setAppIcon] = useState(pwaSettings?.appIcon || '');

  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});
  const [brandingSuccessMsg, setBrandingSuccessMsg] = useState('');
  const [brandingErrorMsg, setBrandingErrorMsg] = useState('');
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isResetBrandingModalOpen, setIsResetBrandingModalOpen] = useState(false);

  React.useEffect(() => {
    if (pwaSettings) {
      setAppName(resolveInstitutionName(pwaSettings.appName, strukturLembaga?.yayasan?.nama));
      setAppIcon(pwaSettings.appIcon || '');
    }
  }, [pwaSettings, strukturLembaga?.yayasan?.nama]);

  const [pastedJson, setPastedJson] = useState('');
  const [backupText, setBackupText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search log state
  const [logSearch, setLogSearch] = useState('');
  // Share link states
  const [generatedShareLink, setGeneratedShareLink] = useState('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Operational hours state
  const [openTime, setOpenTime] = useState(() => OPERATIONAL_CONFIG.OPEN_TIME);
  const [closeTime, setCloseTime] = useState(() => OPERATIONAL_CONFIG.CLOSE_TIME);
  const [timeSuccess, setTimeSuccess] = useState('');
  const [timeError, setTimeError] = useState('');
  
  // Re-read status info dynamically
  const [statusInfo, setStatusInfo] = useState(() => getOperationalStatus());

  // Operational mock hour and mode state
  const [mockMode, setMockMode] = useState<'open' | 'before_open' | 'after_close' | null>(() => {
    return typeof window !== 'undefined' 
      ? (localStorage.getItem('mh_dev_mock_mode') as 'open' | 'before_open' | 'after_close' | null)
      : null;
  });

  const [mockOpenHour, setMockOpenHour] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_dev_mock_open_hour');
      return saved ? parseInt(saved, 10) : 18;
    }
    return 18;
  });

  const [mockBeforeOpenHour, setMockBeforeOpenHour] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_dev_mock_before_open_hour');
      return saved ? parseInt(saved, 10) : 14;
    }
    return 14;
  });

  const [mockAfterCloseHour, setMockAfterCloseHour] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_dev_mock_after_close_hour');
      return saved ? parseInt(saved, 10) : 21;
    }
    return 21;
  });

  const [showDeveloperSimulation, setShowDeveloperSimulation] = useState(false);

  const handleSetMockMode = (mode: 'open' | 'before_open' | 'after_close' | null) => {
    if (mode === null) {
      localStorage.removeItem('mh_dev_mock_mode');
      localStorage.removeItem('mh_dev_mock_hour');
    } else {
      localStorage.setItem('mh_dev_mock_mode', mode);
      
      let hourVal = 18;
      if (mode === 'open') hourVal = mockOpenHour;
      else if (mode === 'before_open') hourVal = mockBeforeOpenHour;
      else if (mode === 'after_close') hourVal = mockAfterCloseHour;
      
      localStorage.setItem('mh_dev_mock_hour', String(hourVal));
    }
    setMockMode(mode);
    window.location.reload();
  };

  const handleIconChange = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG/JPG/SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        try {
          // Compress base64 image to 192x192px max with high quality to store easily in Firestore
          const compressed = await compressBase64Image(base64, 192, 192, 0.85);
          setAppIcon(compressed);
        } catch (err) {
          console.error("Gagal kompresi ikon:", err);
          setAppIcon(base64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive({ app: true });
    } else if (e.type === "dragleave") {
      setDragActive({ app: false });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ app: false });
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleIconChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveBranding = async () => {
    setBrandingSuccessMsg('');
    setBrandingErrorMsg('');
    setIsSavingBranding(true);

    try {
      await updatePwaSettings({
        appName: appName.trim(),
        appIcon: appIcon || undefined
      });
      setBrandingSuccessMsg('Kustomisasi branding nama dan ikon aplikasi berhasil disimpan!');
      if (addLog) {
        addLog('Update PWA Branding', 'Memperbarui nama dan ikon aplikasi (PWA)');
      }
    } catch (err: any) {
      console.error(err);
      setBrandingErrorMsg(err.message || 'Gagal menyimpan branding.');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleResetBranding = () => {
    setIsResetBrandingModalOpen(true);
  };

  const executeResetBranding = async () => {
    setIsResetBrandingModalOpen(false);
    setBrandingSuccessMsg('');
    setBrandingErrorMsg('');
    setIsSavingBranding(true);
    try {
      const defaultName = resolveInstitutionName('', strukturLembaga?.yayasan?.nama) || DEFAULT_INSTITUTION_NAME;
      await updatePwaSettings({
        appName: defaultName,
        appIcon: ''
      });
      setAppName(defaultName);
      setAppIcon('');
      setBrandingSuccessMsg('Kustomisasi branding disetel ulang ke standar bawaan.');
      if (addLog) {
        addLog('Reset PWA Branding', 'Menyetel ulang branding aplikasi ke default');
      }
    } catch (err: any) {
      console.error(err);
      setBrandingErrorMsg(err.message || 'Gagal menyetel ulang.');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleSaveOperationalHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimeSuccess('');
    setTimeError('');

    if (!openTime || !closeTime) {
      setTimeError('Waktu buka dan waktu tutup wajib diisi.');
      return;
    }

    try {
      await saveOperationalHours(openTime, closeTime);

      const updatedStatus = getOperationalStatus();
      setStatusInfo(updatedStatus);

      setTimeSuccess(`Jam operasional berhasil diperbarui! Jam buka: ${openTime} s.d. Jam tutup: ${closeTime} WIB.`);
      
      if (addLog) {
        addLog('Ubah Jam Operasional', `Mengubah jam operasional siswa menjadi pukul ${openTime} s.d. ${closeTime} WIB`);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      let detail = '';
      if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('denied')) {
        detail = ' (Izin ditolak oleh aturan keamanan Firestore)';
      } else if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted')) {
        detail = ' (Batas kuota harian Firebase terlampaui)';
      } else if (errMsg.toLowerCase().includes('unavailable') || errMsg.toLowerCase().includes('reach')) {
        detail = ' (Koneksi Firebase sedang offline/tidak tersedia)';
      } else {
        detail = ` (${errMsg})`;
      }
      setTimeError(`Gagal mensinkronisasikan jam operasional ke Cloud${detail}. Namun, pengaturan telah berhasil disimpan di browser lokal ini.`);
    }
  };

  const handleResetOperationalHours = async () => {
    setTimeSuccess('');
    setTimeError('');
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('app_open_time');
        localStorage.removeItem('app_close_time');
      }
      
      await saveOperationalHours("17:00", "20:00");
      setOpenTime("17:00");
      setCloseTime("20:00");
      
      const updatedStatus = getOperationalStatus();
      setStatusInfo(updatedStatus);

      setTimeSuccess('Jam operasional berhasil dikembalikan ke pengaturan bawaan (17:00 s.d. 20:00 WIB).');
      
      if (addLog) {
        addLog('Reset Jam Operasional', `Mengembalikan jam operasional siswa ke default: 17:00 s.d. 20:00 WIB`);
      }
    } catch (err) {
      console.error(err);
      setTimeError('Gagal mereset jam operasional.');
    }
  };

  const handleGenerateShareLink = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSharing(true);
    setGeneratedShareLink('');
    try {
      const dataStr = backupDatabase();
      // Store on Firestore cloud and obtain lightweight 8-char code.
      const shareId = await saveSharedState(dataStr);
      // Clean short absolute path that passes cloud routers safely
      const shareLink = `${window.location.origin}${window.location.pathname}?share_id=${shareId}`;
      setGeneratedShareLink(shareLink);
      setSuccessMsg('Tautan berbagi database berhasil dibuat di Cloud!');
    } catch (e) {
      setErrorMsg('Gagal membuat tautan berbagi database cloud. Hubungi admin/developer.');
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!generatedShareLink) return;
    navigator.clipboard.writeText(generatedShareLink);
    setCopiedShareLink(true);
    setTimeout(() => {
      setCopiedShareLink(false);
    }, 2000);
  };

  const handleBackupClick = () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const dataStr = backupDatabase();
      setBackupText(dataStr);
      setSuccessMsg('Database berhasil dicadangkan! Salin teks JSON di bawah untuk disimpan.');
    } catch (e) {
      setErrorMsg('Gagal melakukan pencadangan database.');
    }
  };

  const handleRestoreClick = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!pastedJson.trim()) {
      setErrorMsg('Teks JSON cadangan wajib diisi.');
      return;
    }

    const success = restoreDatabase(pastedJson);
    if (success) {
      setSuccessMsg('Database berhasil dipulihkan (Restore)!');
      setPastedJson('');
    } else {
      setErrorMsg('Format JSON cadangan tidak valid atau rusak. Periksa kembali struktur data.');
    }
  };

  // Filter logs based on search
  const filteredLogs = auditLogs.filter(log => {
    return log.action.toLowerCase().includes(logSearch.toLowerCase()) || 
           log.rincian.toLowerCase().includes(logSearch.toLowerCase()) ||
           log.actorNama.toLowerCase().includes(logSearch.toLowerCase());
  });

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      
      {/* Upper header */}
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">Pemeliharaan & Cadangan Sistem</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Pusat kontrol pencadangan database, pemulihan data rujukan, kustomisasi branding, dan audit log pimpinan
        </p>
      </div>

      {/* Mobile Dropdown Quick Selector (Resolusi Layar HP) */}
      <div className="sm:hidden w-full space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Pilih Submenu Pengaturan:</span>
          <span className="text-[10px] text-slate-400 font-normal">Geser tab di bawah atau pilih langsung</span>
        </label>
        <div className="relative">
          <select
            value={activeSubTab === 'modularisasi' ? 'feature_lab' : activeSubTab}
            onChange={(e) => setActiveSubTab(e.target.value as any)}
            className="w-full appearance-none bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          >
            <option value="maintenance">🕒 Jam Operasional & Cadangan</option>
            <option value="branding">📱 Nama & Ikon Aplikasi (PWA)</option>
            <option value="theme_color">🎨 Tema & Warna Identitas Aplikasi</option>
            <option value="hijri_calendar">📅 Kalender Hijriah</option>
            <option value="audit_log">📜 Histori Jurnal Audit Log</option>
            <option value="google_workspace">☁️ Integrasi Google Workspace</option>
            <option value="feature_lab">🧪 Laboratorium Fitur & Penguji</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Sub Tabs Selection (Responsif Mobile & Desktop - Tetap Rapi di Resolusi HP) */}
      <div className="relative w-full max-w-full">
        {/* Subtle mobile right-edge fade indicator to invite horizontal scrolling */}
        <div className="sm:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10 opacity-70" />

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full border-b border-slate-200 dark:border-slate-800 pb-0.5 px-0.5 -mx-0.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('maintenance')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition-all rounded-t-xl border-t border-x cursor-pointer select-none ${
              activeSubTab === 'maintenance'
                ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs -mb-[1px] relative z-10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 bg-transparent'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'maintenance' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Jam Operasional & Cadangan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('branding')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition-all rounded-t-xl border-t border-x cursor-pointer select-none ${
              activeSubTab === 'branding'
                ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs -mb-[1px] relative z-10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 bg-transparent'
            }`}
          >
            <Smartphone className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'branding' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Nama & Ikon Aplikasi (PWA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('theme_color')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition-all rounded-t-xl border-t border-x cursor-pointer select-none ${
              activeSubTab === 'theme_color'
                ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs -mb-[1px] relative z-10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 bg-transparent'
            }`}
          >
            <Palette className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'theme_color' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Tema &amp; Warna Aplikasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hijri_calendar')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition-all rounded-t-xl border-t border-x cursor-pointer select-none ${
              activeSubTab === 'hijri_calendar'
                ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-extrabold shadow-xs -mb-[1px] relative z-10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 bg-transparent'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'hijri_calendar' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>Kalender Hijriah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('audit_log')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition-all rounded-t-xl border-t border-x cursor-pointer select-none ${
              activeSubTab === 'audit_log'
                ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs -mb-[1px] relative z-10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 bg-transparent'
            }`}
          >
            <History className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'audit_log' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Histori Jurnal Audit Log</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('google_workspace')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition-all rounded-t-xl border-t border-x cursor-pointer select-none ${
              activeSubTab === 'google_workspace'
                ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs -mb-[1px] relative z-10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 bg-transparent'
            }`}
          >
            <Cloud className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'google_workspace' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Integrasi Google Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('feature_lab')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition-all rounded-t-xl border-t border-x cursor-pointer select-none ${
              activeSubTab === 'feature_lab' || activeSubTab === 'modularisasi'
                ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-xs -mb-[1px] relative z-10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/70 bg-transparent'
            }`}
          >
            <FlaskConical className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'feature_lab' || activeSubTab === 'modularisasi' ? 'text-indigo-500' : 'text-slate-400'}`} />
            <span>Laboratorium Fitur & Penguji</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: MAINTENANCE & BACKUPS */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-6 animate-fade-in w-full min-w-0">

          {/* CARD: PENGATURAN JAM OPERASIONAL SISTEM (ADMIN ONLY) */}
      <div className="bg-white dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/35 rounded-xl text-amber-600 shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Atur Jam Operasional Portal (Siswa)</h3>
              <p className="text-xs text-slate-400">Batasi jam akses masuk dan sinkronisasi data bagi seluruh akun Siswa</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 self-start sm:self-auto">
            <span className={`w-2 h-2 rounded-full inline-block ${statusInfo.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              STATUS AKSES SISWA: <strong className={statusInfo.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}>{statusInfo.isOpen ? 'BUKA' : 'TUTUP'}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveOperationalHours} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input Jam Buka */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Jam Akses Dibuka (WIB)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <p className="text-[9px] text-slate-400">Siswa diizinkan login dan interaksi setelah waktu ini.</p>
            </div>

            {/* Input Jam Tutup */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Jam Akses Ditutup (WIB)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <p className="text-[9px] text-slate-400">Siswa otomatis terkunci dan dialihkan ke layar pembatasan setelah waktu ini.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Zona waktu operasional dipatok menggunakan standard **Asia/Jakarta (WIB)**</span>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleResetOperationalHours}
                className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Reset Bawaan
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-650 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <span>Simpan Jam Operasional</span>
              </button>
            </div>
          </div>
        </form>

        {timeSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{timeSuccess}</span>
          </div>
        )}

        {timeError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{timeError}</span>
          </div>
        )}

        {/* SUBSECTION: DEVELOPER SYSTEM SIMULATION */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850">
          <button
            type="button"
            onClick={() => setShowDeveloperSimulation(!showDeveloperSimulation)}
            className="flex items-center justify-between w-full text-left py-2 text-xs font-bold font-sans text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Simulasi Keamanan & Jam Operasional (Uji Developer - Klik untuk Membuka)</span>
            </div>
            {showDeveloperSimulation ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showDeveloperSimulation && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <p className="text-[11px] text-slate-400 leading-normal">
                Gunakan opsi di bawah untuk mengatur dan mensimulasikan sistem keamanan jam operasional siswa guna menguji tampilan 'Akses Ditutup' tanpa harus mengedit kode sumber program. Anda dapat mengubah jam masing-masing jenis simulasi di bawah ini secara instan:
              </p>

              {/* EDITABLE MOCK HOURS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Simulasi Sebelum Buka */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <label className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    Jam Sebelum Buka
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={mockBeforeOpenHour}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          const clamped = Math.max(0, Math.min(23, val));
                          setMockBeforeOpenHour(clamped);
                          localStorage.setItem('mh_dev_mock_before_open_hour', String(clamped));
                          if (mockMode === 'before_open') {
                            localStorage.setItem('mh_dev_mock_hour', String(clamped));
                          }
                        }
                      }}
                      className="w-16 px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg text-center font-mono text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-[11px] text-slate-400 font-semibold">:00 WIB</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal mt-1">Estimasi status: <span className="text-rose-500 font-semibold">TUTUP</span></p>
                </div>

                {/* Simulasi Buka */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <label className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Jam Simulasi Buka
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={mockOpenHour}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          const clamped = Math.max(0, Math.min(23, val));
                          setMockOpenHour(clamped);
                          localStorage.setItem('mh_dev_mock_open_hour', String(clamped));
                          if (mockMode === 'open') {
                            localStorage.setItem('mh_dev_mock_hour', String(clamped));
                          }
                        }
                      }}
                      className="w-16 px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg text-center font-mono text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] text-slate-400 font-semibold">:00 WIB</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal mt-1">Estimasi status: <span className="text-emerald-500 font-bold">BUKA</span></p>
                </div>

                {/* Simulasi Setelah Tutup */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <label className="text-[10px] font-extrabold text-rose-600 dark:text-rose-450 uppercase tracking-wider block">
                    Jam Setelah Tutup
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={mockAfterCloseHour}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          const clamped = Math.max(0, Math.min(23, val));
                          setMockAfterCloseHour(clamped);
                          localStorage.setItem('mh_dev_mock_after_close_hour', String(clamped));
                          if (mockMode === 'after_close') {
                            localStorage.setItem('mh_dev_mock_hour', String(clamped));
                          }
                        }
                      }}
                      className="w-16 px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg text-center font-mono text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-400 font-semibold">:00 WIB</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal mt-1">Estimasi status: <span className="text-rose-500 font-semibold">TUTUP</span></p>
                </div>
              </div>

              {/* SIMULATION ACTIONS */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetMockMode('before_open')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1 border cursor-pointer ${
                    mockMode === 'before_open'
                      ? 'bg-amber-600/15 border-amber-500/70 text-amber-600 dark:text-amber-400 font-extrabold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Simulasi Sebelum Buka ({mockBeforeOpenHour}:00 WIB)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetMockMode('open')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1 border cursor-pointer ${
                    mockMode === 'open'
                      ? 'bg-emerald-600/15 border-emerald-500/70 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Simulasi Buka ({mockOpenHour}:00 WIB)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetMockMode('after_close')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1 border cursor-pointer ${
                    mockMode === 'after_close'
                      ? 'bg-rose-600/15 border-rose-500/70 text-rose-600 dark:text-rose-450 font-extrabold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Simulasi Setelah Tutup ({mockAfterCloseHour}:00 WIB)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetMockMode(null)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center space-x-1 border cursor-pointer ${
                    mockMode === null
                      ? 'bg-slate-900 border-slate-800 text-white dark:bg-slate-100 dark:border-slate-200 dark:text-slate-900 font-extrabold'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin-slow" />
                  <span>Gunakan Jam Riil Sistem</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Master Disaster Recovery Suite (Langkah 1 & 2: PC, Cloud Vault, Google Drive, Smart Share) */}
      <MasterDisasterRecovery />

      {/* Critical actions bar */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-lg">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-250 text-rose-850 text-xs font-bold rounded-lg">
          {errorMsg}
        </div>
      )}

        </div>
      )}

      {/* TAB CONTENT: BRANDING & PWA CUSTOMIZER */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/35 rounded-xl text-emerald-600">
                <Palette className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Kustomisasi Nama & Ikon Aplikasi (PWA)</h3>
                <p className="text-xs text-slate-400">Atur nama dan upload ikon kustom untuk aplikasi Admin, Guru, dan Siswa/Santri</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-850 pt-4">
              Ketika aplikasi ini diinstall baik di desktop atau HP/smartphone, ikon dan nama aplikasi yang digunakan akan disesuaikan dengan peran pengguna yang login (Admin, Guru, atau Siswa/Santri). Rancang nama dan pasang ikon terbaik yang konsisten di semua platform.
            </p>

            {brandingSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center animate-fade-in">
                <Check className="w-4 h-4 mr-2 text-emerald-600 shrink-0" /> {brandingSuccessMsg}
              </div>
            )}

            {brandingErrorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center animate-fade-in">
                <X className="w-4 h-4 mr-2 text-rose-500 shrink-0" /> {brandingErrorMsg}
              </div>
            )}

            <div className="max-w-xl mx-auto border border-slate-200/85 dark:border-slate-800 rounded-2xl p-6 space-y-5 relative overflow-hidden bg-slate-50/30 dark:bg-slate-900/10">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600" />
              <div className="pl-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-650 dark:text-emerald-400 tracking-wider uppercase">BRANDING UTAMA APLIKASI UNIFIED</span>
                  <Smartphone className="w-5 h-5 text-emerald-500" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">Nama Aplikasi</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Halaqah"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide block">Ikon Aplikasi (PWA)</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2.5 select-none ${
                      dragActive['app']
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/25'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-800'
                    }`}
                    onClick={() => document.getElementById('app-file-upload')?.click()}
                  >
                    <input
                      id="app-file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleIconChange(e.target.files[0])}
                    />
                    <div className="relative group inline-block mx-auto">
                      <AdaptiveLogo
                        src={appIcon}
                        alt="Ikon Aplikasi"
                        sizeClassName="w-16 h-16"
                        roundedClassName="rounded-2xl"
                        fallbackIcon={
                          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200/20 dark:shadow-none mx-auto">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                        }
                      />
                      {appIcon && (
                        <div className="absolute inset-0 bg-black/45 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                          <FileImage className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Drag & drop atau klik untuk ganti ikon
                      </p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500">
                        Rekomendasi file gambar PNG/SVG berukuran 192x192 atau 512x512 piksel
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-850 justify-end">
            <button
              type="button"
              onClick={handleResetBranding}
              disabled={isSavingBranding}
              className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset ke Default
            </button>
            <button
              type="button"
              onClick={handleSaveBranding}
              disabled={isSavingBranding || !appName.trim()}
              className="flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSavingBranding ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5 text-emerald-250" /> Simpan & Terapkan Branding PWA
                </>
              )}
            </button>
          </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEMA & WARNA IDENTITAS APLIKASI */}
      {activeSubTab === 'theme_color' && (
        <div className="space-y-6 animate-fade-in">
          <InstitutionThemeSettingsCard />
        </div>
      )}

      {/* TAB CONTENT: KALENDER HIJRIAH & HILAL */}
      {activeSubTab === 'hijri_calendar' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-amber-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-700/50 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
              <Calendar className="w-48 h-48 text-amber-200" />
            </div>

            <div className="relative z-10 space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <Calendar className="w-5 h-5 text-amber-300" />
                </span>
                <span className="text-xs uppercase tracking-widest font-mono font-bold text-amber-300">
                  Pengaturan Tanggal Qamariyah
                </span>
              </div>
              <h3 className="font-extrabold text-xl text-white">
                Kalender Hijriah &amp; Penyesuaian Hilal
              </h3>
              <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
                Penetapan tanggal qamariyah bersifat dinamis dan bergantung pada hasil sidang isbat / rukyatul hilal di wilayah setempat. Sesuaikan koreksi selisih hari agar tanggal Hijriah di ornamen pojok kanan atas aplikasi selalu akurat dan tersinkronisasi otomatis untuk seluruh akun Admin, Guru, dan Santri.
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {hijriSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
              <span>{hijriSuccessMsg}</span>
            </div>
          )}

          {hijriErrorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-2xl flex items-center animate-fade-in shadow-xs">
              <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 shrink-0" />
              <span>{hijriErrorMsg}</span>
            </div>
          )}

          {/* Card 1: Pratinjau Tampilan Header Langsung */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                  Pratinjau Tampilan Ornamen Header
                </h4>
                <p className="text-xs text-slate-400">
                  Berikut tampilan kaligrafi Basmalah dan tanggal Hijriah yang akan tampil di pojok kanan atas aplikasi
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/60">
                Live Preview
              </span>
            </div>

            <div className="p-6 bg-slate-50/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center gap-3">
              {/* Ornamen Header Preview Component */}
              <div className="relative inline-flex items-center gap-3.5 select-none px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/[0.04] via-amber-500/[0.06] to-emerald-500/[0.08] dark:from-emerald-950/30 dark:via-amber-950/20 dark:to-emerald-900/30 border border-amber-500/25 dark:border-amber-500/30 shadow-md">
                <svg className="w-5 h-8 text-amber-500/70 dark:text-amber-400/80 shrink-0" viewBox="0 0 20 32" fill="none">
                  <path d="M18 4 C10 8, 4 12, 4 16 C4 20, 10 24, 18 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="4" cy="16" r="2" fill="currentColor" />
                  <circle cx="12" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
                  <circle cx="12" cy="23" r="1.2" fill="currentColor" opacity="0.6" />
                </svg>
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[19px] leading-tight font-serif tracking-normal text-slate-800 dark:text-amber-200 font-medium select-none" dir="rtl">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-[1px] w-6 bg-gradient-to-r from-transparent via-amber-400/60 to-amber-500/80"></div>
                    <span className="text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-300 font-sans">
                      {hijriMode === 'manual' && hijriCustomText.trim()
                        ? hijriCustomText.trim()
                        : getOffsetPreview(hijriDayOffset).formatted}
                    </span>
                    <div className="h-[1px] w-6 bg-gradient-to-l from-transparent via-amber-400/60 to-amber-500/80"></div>
                  </div>
                </div>
                <svg className="w-5 h-8 text-amber-500/70 dark:text-amber-400/80 shrink-0" viewBox="0 0 20 32" fill="none">
                  <path d="M2 4 C10 8, 16 12, 16 16 C16 20, 10 24, 2 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="16" cy="16" r="2" fill="currentColor" />
                  <circle cx="8" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
                  <circle cx="8" cy="23" r="1.2" fill="currentColor" opacity="0.6" />
                </svg>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Bersesuaian dengan tanggal Masehi: <strong>{getOffsetPreview(0).gregorianDate}</strong>
              </p>
            </div>
          </div>

          {/* Card 2: Pengaturan Koreksi Hari (Hilal Day Offset) */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Pilih Mode &amp; Koreksi Selisih Hari Hilal
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Tentukan bagaimana penanggalan Hijriah dikalkulasikan
              </p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-4 rounded-2xl border flex items-start space-x-3 cursor-pointer transition ${
                  hijriMode === 'auto_offset'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <input 
                  type="radio"
                  name="hijri_mode"
                  checked={hijriMode === 'auto_offset'}
                  onChange={() => setHijriMode('auto_offset')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-white text-xs block">
                    Mode Otomatis dengan Koreksi Hilal (Rekomendasi)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                    Tanggal otomatis bergulir setiap hari, disesuaikan dengan selisih rukyatul hilal (-2 s/d +2 hari dari kalender Ummul Qura).
                  </span>
                </div>
              </label>

              <label 
                className={`p-4 rounded-2xl border flex items-start space-x-3 cursor-pointer transition ${
                  hijriMode === 'manual'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <input 
                  type="radio"
                  name="hijri_mode"
                  checked={hijriMode === 'manual'}
                  onChange={() => setHijriMode('manual')}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-white text-xs block">
                    Mode Kustom Manual
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                    Tuliskan teks tanggal atau ucapan hari besar Islam secara manual (misal: "12 Rabi'ul Awwal 1448 H" atau "1 Syawal 1447 H").
                  </span>
                </div>
              </label>
            </div>

            {/* If Auto Offset Mode */}
            {hijriMode === 'auto_offset' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                    Pilih Penyesuaian Selisih Hari (Hilal Offset):
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                    Offset Terpilih: {hijriDayOffset >= 0 ? `+${hijriDayOffset}` : hijriDayOffset} Hari
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { val: -2, label: '-2 Hari', desc: 'Mundur 2 hari' },
                    { val: -1, label: '-1 Hari', desc: 'Hilal belum terlihat (Istikmal)' },
                    { val: 0, label: '0 (Standar)', desc: 'Algoritma Ummul Qura' },
                    { val: 1, label: '+1 Hari', desc: 'Hilal terlihat lebih awal' },
                    { val: 2, label: '+2 Hari', desc: 'Maju 2 hari' }
                  ].map((item) => {
                    const isSelected = hijriDayOffset === item.val;
                    const preview = getOffsetPreview(item.val);
                    return (
                      <div
                        key={item.val}
                        onClick={() => setHijriDayOffset(item.val)}
                        className={`p-3.5 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <div>
                          <span className={`text-xs font-extrabold block ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {item.label}
                          </span>
                          <span className={`text-[10px] mt-0.5 block leading-tight ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {item.desc}
                          </span>
                        </div>
                        <div className={`mt-3 pt-2 border-t text-[11px] font-bold ${isSelected ? 'border-emerald-500/60 text-emerald-100 font-mono' : 'border-slate-100 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-mono'}`}>
                          {preview.formatted}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Catatan Cara Kerja:</span>
                  </p>
                  <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 pl-5.5">
                    Ketika Anda memilih <strong>-1 Hari</strong> atau <strong>+1 Hari</strong>, sistem tidak hanya mengubah tanggal hari ini, melainkan menggeser kurva kalender secara otomatis. Jadi di hari-hari berikutnya, tanggal akan terus berjalan bergulir secara akurat tanpa perlu disetel ulang setiap hari.
                  </p>
                </div>
              </div>
            )}

            {/* If Manual Mode */}
            {hijriMode === 'manual' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Tanggal Hijriah Kustom *
                  </label>
                  <input 
                    type="text"
                    value={hijriCustomText}
                    onChange={(e) => setHijriCustomText(e.target.value)}
                    placeholder="Contoh: 12 Rabi'ul Awwal 1448 H / 1 Syawwal 1447 H - Idul Fitri"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                    Pilihan Contoh Cepat:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "12 Rabi'ul Awwal 1448 H",
                      "1 Ramadhan 1448 H",
                      "1 Syawwal 1448 H (Idul Fitri)",
                      "10 Dzulhijjah 1448 H (Idul Adha)",
                      "1 Muharram 1448 H"
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setHijriCustomText(sample)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                      >
                        + {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Terakhir diperbarui: <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">{hijriSetting?.updatedAt ? new Date(hijriSetting.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Bawaan Sistem'}</span> {hijriSetting?.updatedBy ? `oleh ${hijriSetting.updatedBy}` : ''}
              </div>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleResetHijriCalendar}
                  disabled={isSavingHijri}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  Reset ke Default (0)
                </button>
                <button
                  type="button"
                  onClick={handleSaveHijriCalendar}
                  disabled={isSavingHijri}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingHijri ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Pengaturan Kalender</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: AUDIT LOG */}
      {activeSubTab === 'audit_log' && (
        <div className="space-y-6 animate-fade-in">

      {/* Big Audit Logs Database Sheet */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-3">
          <div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Jurnal Histori Lengkap (Audit Log)</h3>
            <p className="text-xs text-slate-400">Histori terperinci seluruh tindakan CRUD admin & penilaian setoran</p>
          </div>
          {/* Internal search filter for logs */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari kata kunci log..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="pl-8 pr-2 py-1.5 border border-slate-205 dark:border-slate-800 rounded font-sans text-xs bg-slate-50 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-900 text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
              <tr>
                <th className="py-2.5 px-3">Tanggal & Waktu</th>
                <th className="py-2.5 px-3">Pelaku Utama</th>
                <th className="py-2.5 px-3">Peran Akun</th>
                <th className="py-2.5 px-3">Aktivitas</th>
                <th className="py-2.5 px-3">Rincian Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-sans text-[11px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-450 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{log.actorNama}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-semibold">{log.actorRole}</td>
                  <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-semibold">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-350">{log.rincian}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                    Belum ada log terekam yang cocok dengan kata pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}

      {activeSubTab === 'google_workspace' && (
        <div className="space-y-6 animate-fade-in">
          <GoogleWorkspace />
        </div>
      )}

      {(activeSubTab === 'feature_lab' || activeSubTab === 'modularisasi') && (
        <div className="space-y-6 animate-fade-in">
          <AdminFeatureLab />
        </div>
      )}

      {/* Confirm Reset Branding Modal */}
      {isResetBrandingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Reset Kustomisasi Branding</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menyetel ulang kustomisasi branding ke standar bawaan sistem? Nama dan ikon aplikasi akan dikembalikan ke default.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setIsResetBrandingModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeResetBranding}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Ya, Reset ke Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
