/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { ManageUsers } from './components/ManageUsers';
import { ManageHalaqah } from './components/ManageHalaqah';
import { ManageHalaqahPribadi } from './components/ManageHalaqahPribadi';
import { ManageMataPelajaran } from './components/ManageMataPelajaran';
import { ManageModul } from './components/ManageModul';
import { ManageSetoran } from './components/ManageSetoran';
import { Profile } from './components/Profile';
import { SystemBackup } from './components/SystemBackup';
import { GoogleWorkspace } from './components/GoogleWorkspace';
import { GuruWorkspace } from './components/GuruWorkspace';
import { SiswaWorkspace } from './components/SiswaWorkspace';
import { ManageAssessment, PelaksanaanAssessment, HasilAssessment } from './components/AssessmentSystem';
import ManageSyahadah from './components/ManageSyahadah';
import { ManageStrukturLembaga } from './components/ManageStrukturLembaga';
import { ProgramKeilmuanSystem } from './components/ProgramKeilmuanSystem';
import { ManagePengumuman } from './components/ManagePengumuman';
import { ManageAdministrasiGuru } from './components/ManageAdministrasiGuru';
import { GuruAdministrasiModule } from './components/GuruAdministrasiModule';
import { ManagePengguna } from './components/ManagePengguna';
import { ManageHalaqahUnified } from './components/ManageHalaqahUnified';
import { ManageKurikulumModul } from './components/ManageKurikulumModul';
import { Menu, RefreshCw, Check, Bell, X, MessageSquare, Database, Key, HelpCircle, Info, Lock, Settings, AlertTriangle, Globe, Sparkles, Copy, Plus, ExternalLink, FlaskConical } from 'lucide-react';
import { UserRole, hasAdminPermission } from './types';
import { LockScreenOverlay } from './components/LockScreenOverlay';
import { HalaqahSelector } from './components/HalaqahSelector';
import { getTeacherHalaqahs, normalizeHalaqahKey } from './utils/studentAttendanceHelper';
import { parseAndValidateSnapshot } from './utils/backupRestoreManager';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { IslamicHeaderOrnament } from './components/IslamicHeaderOrnament';
import { getSharedState, isFirebaseConfigured, parseFirebaseConfigInput, getActiveFirebaseConfig } from './lib/firebaseShare';
import { resolveInstitutionName, DEFAULT_INSTITUTION_NAME } from './utils/brandingHelper';

const AppContent: React.FC = () => {
  const { 
    currentSession, 
    selectedGuruHalaqahId,
    setSelectedGuruHalaqahId,
    darkMode, 
    restoreDatabase, 
    typography, 
    isQuotaExceeded, 
    isOffline,
    chatMessages, 
    halaqahs,
    tryReconnectCloud,
    resetOfflineAndQuotaState,
    siswas,
    gurus,
    admins,
    isSiswaOperationalOpen,
    logout,
    nonQuranFonts,
    pwaSettings,
    updatePwaSettings,
    guruSchedules,
    strukturLembaga,
    isUserBetaTester,
    syahadahSettings
  } = useApp();
  const isGuru = currentSession.user?.role === UserRole.GURU;
  const isSiswa = currentSession.user?.role === UserRole.SISWA;
  const isAdmin = currentSession.user?.role === UserRole.ADMIN;
  const isCurrentTester = isUserBetaTester(currentSession.user?.id);

  const activeGuruObject = useMemo(() => {
    if (!isGuru || !currentSession.user?.id) return null;
    return gurus.find(g => g.id === currentSession.user?.id) || (currentSession.user?.role === UserRole.GURU ? currentSession.user : null);
  }, [isGuru, gurus, currentSession.user]);

  const activeGuruHalaqahObject = useMemo(() => {
    if (!selectedGuruHalaqahId) return null;
    return halaqahs.find(h => 
      h.id === selectedGuruHalaqahId || 
      h.namaHalaqah === selectedGuruHalaqahId ||
      normalizeHalaqahKey(h.namaHalaqah) === normalizeHalaqahKey(selectedGuruHalaqahId)
    );
  }, [halaqahs, selectedGuruHalaqahId]);

  const activeHalaqahNama = activeGuruHalaqahObject?.namaHalaqah || selectedGuruHalaqahId || 'Semua Halaqah';

  const activeSiswaObject = useMemo(() => {
    if (!isSiswa || !currentSession.user?.id) return null;
    return siswas.find(s => s.id === currentSession.user?.id);
  }, [isSiswa, siswas, currentSession.user?.id]);

  const activeSiswaHalaqahObject = useMemo(() => {
    if (!activeSiswaObject?.halaqahId) return null;
    return halaqahs.find(h => h.id === activeSiswaObject.halaqahId);
  }, [activeSiswaObject, halaqahs]);

  const siswaHalaqahNama = activeSiswaHalaqahObject?.namaHalaqah || '-';
  const siswaNis = activeSiswaObject?.nis || '-';

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('mh_active_tab');
      if (savedTab) return savedTab;
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      localStorage.setItem('mh_active_tab', activeTab);
    }
  }, [activeTab]);

  // Route protection & tab validation for active session role
  useEffect(() => {
    if (!currentSession.user) return;

    if (currentSession.user.role === UserRole.ADMIN) {
      if (!hasAdminPermission(currentSession.user as any, activeTab)) {
        setActiveTab('dashboard');
      }
    } else if (isGuru) {
      const validGuruTabs = [
        'dashboard',
        'guru_siswas',
        'guru_mutabaah',
        'guru_capaian_bacaan',
        'guru_absensi',
        'guru_administrasi_rpp',
        'pelaksanaan_assessment',
        'program_keilmuan',
        'manajemen_syahadah',
        'murojaah_berpasangan',
        'guru_halaqah_pribadi',
        'profile'
      ];
      // If current activeTab is not a valid Guru tab, automatically revert to 'dashboard'
      if (!validGuruTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else if (isSiswa) {
      const validSiswaTabs = [
        'dashboard',
        'siswa_mutabaah',
        'siswa_target',
        'siswa_progress',
        'siswa_riwayat',
        'siswa_modul',
        'siswa_achievements',
        'siswa_reports',
        'murojaah_berpasangan',
        'program_keilmuan',
        'hasil_assessment',
        'manajemen_syahadah',
        'profile'
      ];
      if (!validSiswaTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [isGuru, isSiswa, activeTab, currentSession.user, activeGuruObject]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mh_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showCustomConfigModal, setShowCustomConfigModal] = useState(false);
  const [useFormMode, setUseFormMode] = useState<boolean>(false); // Default to JSON/Code paste mode for speed
  const [isSuccessfullySaved, setIsSuccessfullySaved] = useState(false);
  const [customConfigError, setCustomConfigError] = useState<string | null>(null);
  const [templateCopied, setTemplateCopied] = useState(false);

  // Individual fields loaded from localStorage or blank
  useEffect(() => {
    try {
      localStorage.removeItem('mh_last_login_demo');
    } catch {}
  }, []);
  const [configFields, setConfigFields] = useState(() => {
    let savedObj = {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_custom_firebase_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            savedObj = {
              apiKey: parsed.apiKey || '',
              authDomain: parsed.authDomain || '',
              projectId: parsed.projectId || '',
              storageBucket: parsed.storageBucket || '',
              messagingSenderId: parsed.messagingSenderId || '',
              appId: parsed.appId || ''
            };
          }
        } catch (_) {}
      }
    }
    return savedObj;
  });

  const [rawJsonText, setRawJsonText] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_custom_firebase_config');
      if (saved) return saved;
    }
    return '';
  });

  const handleCopyCleanTemplate = () => {
    const cleanTemplate = {
      projectId: "",
      appId: "",
      apiKey: "",
      authDomain: "",
      firestoreDatabaseId: "",
      storageBucket: "",
      messagingSenderId: "",
      measurementId: "",
      oAuthClientId: "",
      recaptchaSiteKey: ""
    };
    navigator.clipboard.writeText(JSON.stringify(cleanTemplate, null, 2));
    setTemplateCopied(true);
    setTimeout(() => setTemplateCopied(false), 3000);
  };

  const handleSaveCustomFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomConfigError(null);
    let finalConfig: any = null;

    if (useFormMode) {
      if (!configFields.apiKey || !configFields.projectId) {
        setCustomConfigError('API Key dan Project ID wajib diisi!');
        return;
      }
      finalConfig = { ...configFields };
    } else {
      const parsed = parseFirebaseConfigInput(rawJsonText);
      if (!parsed || !parsed.apiKey || !parsed.projectId) {
        setCustomConfigError('Konfigurasi Firebase tidak valid. Tempelkan objek JSON atau potongan kode `const firebaseConfig = { ... }` dari Firebase Console.');
        return;
      }
      finalConfig = parsed;
    }

    try {
      localStorage.setItem('mh_custom_firebase_config', JSON.stringify(finalConfig, null, 2));
      setIsSuccessfullySaved(true);
      setTimeout(() => {
        setIsSuccessfullySaved(false);
        setShowCustomConfigModal(false);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setCustomConfigError(err.message || 'Gagal menyimpan konfigurasi.');
    }
  };

  const handleResetToDefaultFirebase = () => {
    if (confirm('Apakah Anda yakin ingin menghapus konfigurasi Firebase kustom dan kembali ke Firebase Sandbox bawaan?')) {
      localStorage.removeItem('mh_custom_firebase_config');
      setIsSuccessfullySaved(true);
      setTimeout(() => {
        setIsSuccessfullySaved(false);
        setShowCustomConfigModal(false);
        window.location.reload();
      }, 1500);
    }
  };

  const handleReconnectCloud = async () => {
    setIsSyncingCloud(true);
    setSyncError(null);
    setSyncSuccess(false);
    try {
      await tryReconnectCloud();
      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
      }, 5000);
    } catch (e: any) {
      console.error('Failed to reconnect and sync:', e);
      setSyncError(e.message || 'Gagal memulihkan sinkronisasi cloud. Silakan periksa koneksi jaringan Anda.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Chat Recipient Context and Notification Toasts
  const [activeChatRecipient, setActiveChatRecipient] = useState<{ id: string; nama: string; role: any } | null>(null);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    senderId: string;
    senderNama: string;
    senderRole: any;
    receiverId: string;
    message: string;
  }>>([]);

  const lastProcessedMessageIdRef = React.useRef<string | null>(null);
  const isInitializedRef = React.useRef<boolean>(false);

  // Pure Web Audio tone synthesis for instant notification chime
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      
      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.28);
    } catch (err) {
      console.warn("Audio notification failed or blocked:", err);
    }
  };

  useEffect(() => {
    // Chat notifications are disabled indefinitely since the Chat (Obrolan) feature has been removed
    if (toasts.length > 0) {
      setToasts([]);
    }
  }, [toasts.length]);

  // Local state to track the active role on the login/auth screen
  const [authSelectedRole, setAuthSelectedRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('mh_pwa_active_role');
    return (saved as UserRole) || UserRole.ADMIN;
  });

  useEffect(() => {
    const handleRoleChange = () => {
      const saved = localStorage.getItem('mh_pwa_active_role');
      if (saved) {
        setAuthSelectedRole(saved as UserRole);
      }
    };
    window.addEventListener('pwa-role-changed', handleRoleChange);
    return () => window.removeEventListener('pwa-role-changed', handleRoleChange);
  }, []);

  // Dynamic PWA manifest, apple-touch-icon, and document title updater
  useEffect(() => {
    const manifestEl = document.querySelector('link[rel="manifest"]');
    const appleIconEl = document.querySelector('link[rel="apple-touch-icon"]');
    const appleTitleEl = document.querySelector('meta[name="apple-mobile-web-app-title"]');

    if (!manifestEl) return;

    let appName = resolveInstitutionName(pwaSettings?.appName, strukturLembaga?.yayasan?.nama);
    let appIcon: string | undefined = pwaSettings?.appIcon || undefined;
    let roleInitial = 'HQ';
    let bgStart = '#0f172a';
    let bgEnd = '#1e293b';

    // Function to generate canvas-based high-quality icon if custom uploaded icon is empty
    const generateFallbackIcon = (initials: string, size: number): string => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Fill with emerald-600 background (#059669)
      ctx.fillStyle = '#059669';
      const radius = size * 0.22;
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, size, size, radius);
      } else {
        ctx.arc(radius, radius, radius, Math.PI, Math.PI * 1.5);
        ctx.lineTo(size - radius, 0);
        ctx.arc(size - radius, radius, radius, Math.PI * 1.5, Math.PI * 2);
        ctx.lineTo(size, size - radius);
        ctx.arc(size - radius, size - radius, radius, 0, Math.PI * 0.5);
        ctx.lineTo(radius, size);
        ctx.arc(radius, size - radius, radius, Math.PI * 0.5, Math.PI);
        ctx.closePath();
      }
      ctx.fill();

      // Draw beautiful Lucide BookOpen path in the center
      const bookSize = size * 0.52;
      const offset = (size - bookSize) / 2;
      const mapX = (x: number) => offset + (x / 24) * bookSize;
      const mapY = (y: number) => offset + (y / 24) * bookSize;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2.5, size * 0.08);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left page path
      ctx.beginPath();
      ctx.moveTo(mapX(2), mapY(3));
      ctx.lineTo(mapX(8), mapY(3));
      ctx.quadraticCurveTo(mapX(12), mapY(3), mapX(12), mapY(7));
      ctx.lineTo(mapX(12), mapY(21));
      ctx.quadraticCurveTo(mapX(9), mapY(21), mapX(9), mapY(18));
      ctx.lineTo(mapX(2), mapY(18));
      ctx.closePath();
      ctx.stroke();

      // Right page path
      ctx.beginPath();
      ctx.moveTo(mapX(22), mapY(3));
      ctx.lineTo(mapX(16), mapY(3));
      ctx.quadraticCurveTo(mapX(12), mapY(3), mapX(12), mapY(7));
      ctx.lineTo(mapX(12), mapY(21));
      ctx.quadraticCurveTo(mapX(15), mapY(21), mapX(15), mapY(18));
      ctx.lineTo(mapX(22), mapY(18));
      ctx.closePath();
      ctx.stroke();

      return canvas.toDataURL('image/png');
    };

    // Use custom icon or fall back to high-res dynamic initials canvas icon
    const icon192 = appIcon || generateFallbackIcon(roleInitial, 192);
    const icon512 = appIcon || generateFallbackIcon(roleInitial, 512);

    // Dynamic Manifest JSON Object
    const dynamicManifest = {
      short_name: appName,
      name: appName,
      description: `${appName} - Monitoring Halaqah Al-Qur'an`,
      start_url: window.location.origin + "/",
      background_color: "#0f172a",
      theme_color: "#0f172a",
      display: "standalone",
      orientation: "portrait-primary",
      icons: [
        {
          src: icon192,
          type: "image/png",
          sizes: "192x192"
        },
        {
          src: icon512,
          type: "image/png",
          sizes: "512x512"
        }
      ]
    };

    const stringManifest = JSON.stringify(dynamicManifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(blob);

    manifestEl.setAttribute('href', manifestUrl);
    
    // Dynamically update all standard favicons as well
    const iconEls = document.querySelectorAll('link[rel*="icon"]');
    const originalIcons: { el: Element; href: string | null; type: string | null }[] = [];
    iconEls.forEach(el => {
      originalIcons.push({
        el,
        href: el.getAttribute('href'),
        type: el.getAttribute('type')
      });
      el.setAttribute('href', icon192);
      el.setAttribute('type', 'image/png');
    });
    
    if (appleTitleEl) {
      appleTitleEl.setAttribute('content', appName);
    }

    // Set document/window HTML title dynamically
    document.title = appName;

    console.log(`[PWA] Manifest, Icons, & Title dynamically updated to: "${appName}"`);

    return () => {
      manifestEl.setAttribute('href', '/manifest.json');
      originalIcons.forEach(item => {
        if (item.href) item.el.setAttribute('href', item.href);
        if (item.type) item.el.setAttribute('type', item.type);
      });
      if (appleTitleEl) {
        appleTitleEl.setAttribute('content', DEFAULT_INSTITUTION_NAME);
      }
      document.title = "Halaqah - Sistem Informasi Al-Qur'an";
      URL.revokeObjectURL(manifestUrl);
    };
  }, [currentSession?.user?.role, authSelectedRole, pwaSettings]);

  // Sharing or database synchronization states
  const [shareDataPending, setShareDataPending] = useState<string | null>(null);
  const [shareDataId, setShareDataId] = useState<string | null>(null);
  const [isLoadingShareId, setIsLoadingShareId] = useState(false);
  const [shareDataStatus, setShareDataStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasShareQueryParam, setHasShareQueryParam] = useState(false);
  const [shareImportMode, setShareImportMode] = useState<'replace' | 'merge'>('replace');

  const parsedShareInfo = useMemo(() => {
    if (!shareDataPending) return null;
    return parseAndValidateSnapshot(shareDataPending);
  }, [shareDataPending]);

  React.useEffect(() => {
    // Check if share_state or share_id query parameter exists
    const params = new URLSearchParams(window.location.search);
    const shareState = params.get('share_state');
    const shareId = params.get('share_id');
    
    if (shareState || shareId) {
      setHasShareQueryParam(true);
    }

    if (shareState) {
      try {
        const decodedJson = decodeURIComponent(escape(atob(shareState)));
        setShareDataPending(decodedJson);
      } catch (e) {
        console.error("Gagal mendecode share_state:", e);
        setShareDataStatus('error');
      }
    } else if (shareId) {
      setShareDataId(shareId);
      const fetchState = async () => {
        setIsLoadingShareId(true);
        try {
          const dataJson = await getSharedState(shareId);
          if (dataJson) {
            setShareDataPending(dataJson);
          } else {
            setShareDataStatus('error');
          }
        } catch (e) {
          console.error("Gagal mengambil share_id dari cloud:", e);
          setShareDataStatus('error');
        } finally {
          setIsLoadingShareId(false);
        }
      };
      fetchState();
    }
  }, []);

  const handleApplySharedData = async () => {
    if (!shareDataPending) return;
    try {
      const success = await restoreDatabase(shareDataPending, { mode: shareImportMode });
      if (success) {
        setShareDataStatus('success');
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
        setTimeout(() => {
          setShareDataPending(null);
          setHasShareQueryParam(false);
          setShareDataStatus('idle');
          window.location.reload();
        }, 1500);
      } else {
        setShareDataStatus('error');
      }
    } catch (e) {
      console.error("Gagal menerapkan database yang dibagikan:", e);
      setShareDataStatus('error');
    }
  };

  const handleDeclineSharedData = () => {
    setShareDataPending(null);
    setHasShareQueryParam(false);
    setShareDataStatus('idle');
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState(null, '', cleanUrl);
  };

  // Render personal/custom Firebase project setup modal interface (Restricted to Admin only)
  const renderCustomConfigModal = () => {
    if (!showCustomConfigModal || !isAdmin) return null;

    const isCurrentlyCustom = typeof window !== 'undefined' && !!localStorage.getItem('mh_custom_firebase_config');

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-amber-100 dark:border-amber-900/30 flex flex-col space-y-5 animate-fade-in my-8">
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-sans font-black text-slate-950 dark:text-white text-lg">Konfigurasi Database Firebase</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                  Cloud Firestore Real-Time
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowCustomConfigModal(false);
                setCustomConfigError(null);
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connection Status Indicator */}
          {isFirebaseConfigured() ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-350">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Terhubung ke Proyek: <strong className="font-mono">{getActiveFirebaseConfig().projectId}</strong></span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">TERHUBUNG</span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-350">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Status: <strong>Belum Dikonfigurasi (Mode Lokal / Offline)</strong></span>
              </div>
              <span className="text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">OFFLINE</span>
            </div>
          )}

          {/* GitHub Clean Export Tool */}
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Siap Share Kode ke GitHub?
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Salin template kosong untuk file <code>firebase-applet-config.json</code> agar kredensial pribadi Anda tidak ikut terunggah ke GitHub.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCleanTemplate}
              className="shrink-0 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              {templateCopied ? 'Template Bersih Disalin!' : 'Salin Template GitHub'}
            </button>
          </div>

          {isSuccessfullySaved ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Check className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Konfigurasi Firebase Berhasil Diperbarui!</p>
              <p className="text-xs text-slate-450 dark:text-slate-400 text-center">Memuat ulang portal dalam beberapa detik untuk memulai database baru...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveCustomFirebase} className="space-y-4">
              {customConfigError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{customConfigError}</span>
                </div>
              )}

              {/* Mode Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setUseFormMode(true)}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    useFormMode 
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                  }`}
                >
                  Form Input Satuan (Rekomendasi & Aman)
                </button>
                <button
                  type="button"
                  onClick={() => setUseFormMode(false)}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !useFormMode 
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                  }`}
                >
                  Tempel Kode JSON SDK Firebase
                </button>
              </div>

              {/* Form Mode fields */}
              {useFormMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-slate-400" /> API KEY *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AIzaSyA..."
                      value={configFields.apiKey}
                      onChange={e => setConfigFields(prev => ({ ...prev, apiKey: e.target.value.trim() }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-950 dark:text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-slate-400" /> PROJECT ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="muntaka-halaqah-firebase"
                      value={configFields.projectId}
                      onChange={e => setConfigFields(prev => ({ ...prev, projectId: e.target.value.trim() }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-950 dark:text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      AUTH DOMAIN
                    </label>
                    <input
                      type="text"
                      placeholder="muntaka-halaqah-firebase.firebaseapp.com"
                      value={configFields.authDomain}
                      onChange={e => setConfigFields(prev => ({ ...prev, authDomain: e.target.value.trim() }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-950 dark:text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      STORAGE BUCKET
                    </label>
                    <input
                      type="text"
                      placeholder="muntaka-halaqah-firebase.firebasestorage.app"
                      value={configFields.storageBucket}
                      onChange={e => setConfigFields(prev => ({ ...prev, storageBucket: e.target.value.trim() }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-950 dark:text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      MESSAGING SENDER ID
                    </label>
                    <input
                      type="text"
                      placeholder="123456789012"
                      value={configFields.messagingSenderId}
                      onChange={e => setConfigFields(prev => ({ ...prev, messagingSenderId: e.target.value.trim() }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-950 dark:text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      APP ID
                    </label>
                    <input
                      type="text"
                      placeholder="1:123456789012:web:abcdef123456"
                      value={configFields.appId}
                      onChange={e => setConfigFields(prev => ({ ...prev, appId: e.target.value.trim() }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-950 dark:text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none transition"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tempel JSON Konfigurasi SDK Firebase Web
                  </label>
                  <textarea
                    rows={7}
                    placeholder={`{\n  "apiKey": "AIzaSyA...",\n  "authDomain": "muntaka-halaqah.firebaseapp.com",\n  "projectId": "muntaka-halaqah",\n  "storageBucket": "muntaka-halaqah.firebasestorage.app",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                    value={rawJsonText}
                    onChange={e => setRawJsonText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-950 dark:text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none transition leading-normal"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    💡 Tips: Masukkan teks JSON SDK yang Anda dapatkan dari Settings pada Firebase Console.
                  </p>
                </div>
              )}

              {/* Instructions Divider */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                  <HelpCircle className="w-4 h-4 text-amber-500" /> Panduan Langkah Membuat & Memasang Proyek Firebase Sendiri (2 Menit):
                </h4>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 list-decimal pl-4 leading-relaxed font-semibold">
                  <li>Buka browser baru dan buka <strong><a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-bold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-2.5 h-2.5" /></a></strong> lalu login dengan akun Google Anda.</li>
                  <li>Klik tombol <strong>"Add Project"</strong> (Buat Proyek) dan berikan nama (contoh: <code>Portal Halaqah Yayasan</code>).</li>
                  <li>Lanjutkan klik next, silakan nonaktifkan Google Analytics (opsional) lalu klik <strong>"Create Project"</strong>.</li>
                  <li>Setelah proyek siap, klik lambang Web App <strong><code>&lt;/&gt;</code></strong> untuk meregistrasikan aplikasi web baru. Beri nama lalu klik register.</li>
                  <li>Salin konfigurasi <code>firebaseConfig</code> yang berisi <code>apiKey, projectId</code> dll, dan masukkan ke form di atas!</li>
                  <li>Lalu buka menu samping Firebase, pilih <strong>Build &gt; Firestore Database</strong>, aktifkan, dan pada tab <strong>Rules</strong> pastikan aturannya mengizinkan baca & tulis.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                {isCurrentlyCustom ? (
                  <button
                    type="button"
                    onClick={handleResetToDefaultFirebase}
                    className="w-full sm:w-auto text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-[11px] font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    🗑️ Reset Ke Sandbox Bawaan
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  {!isFirebaseConfigured() && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomConfigModal(false);
                        setCustomConfigError(null);
                      }}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Coba Mode Offline
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomConfigModal(false);
                      setCustomConfigError(null);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2 border border-slate-105 dark:border-slate-800 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Simpan & Hubungkan
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  };

  // Render share state loading modal OVERLAY first if any
  const renderShareStateModal = () => {
    if (!hasShareQueryParam) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col space-y-4">
          <div className="flex items-center space-x-3 text-emerald-600">
            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <div>
              <h3 className="font-sans font-bold text-slate-900 dark:text-white text-lg leading-snug">Sinkronisasi Database Bimbingan</h3>
              <span className="text-[9px] bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">ONLINE STATE IMPORT</span>
            </div>
          </div>

          {isLoadingShareId ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-500 font-sans font-semibold">Mengunduh database bimbingan dari cloud...</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                Tautan khusus terdeteksi! Tautan ini memuat snapshot database lengkap yang dibagikan oleh Admin/Ustadz.
              </p>

              {parsedShareInfo?.isValid && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Snapshot: {parsedShareInfo.metadata?.version || 'v1.0'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {parsedShareInfo.metadata?.timestamp ? new Date(parsedShareInfo.metadata.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Terbaru'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pembuat: <strong className="text-slate-700 dark:text-slate-300">{parsedShareInfo.metadata?.exportedBy || 'Administrator Utama'}</strong>
                  </p>

                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center text-[10px]">
                    <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-400 block">Santri</span>
                      <strong className="text-emerald-600 font-bold">{parsedShareInfo.stats?.siswas || 0}</strong>
                    </div>
                    <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-400 block">Guru</span>
                      <strong className="text-emerald-600 font-bold">{parsedShareInfo.stats?.gurus || 0}</strong>
                    </div>
                    <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-400 block">Halaqah</span>
                      <strong className="text-emerald-600 font-bold">{parsedShareInfo.stats?.halaqahs || 0}</strong>
                    </div>
                    <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-400 block">Setoran</span>
                      <strong className="text-emerald-600 font-bold">{parsedShareInfo.stats?.setorans || 0}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Pilih Cara Penerapan Data:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShareImportMode('replace')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                      shareImportMode === 'replace'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>🔄 Timpa Bersih</span>
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Sama persis link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareImportMode('merge')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                      shareImportMode === 'merge'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>➕ Gabungkan</span>
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Tambah data baru</span>
                  </button>
                </div>
              </div>

              {shareDataStatus === 'success' && (
                <div className="p-3 bg-emerald-100 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-lg text-center font-sans">
                  🎉 Berhasil Sinkronisasi! Memuat ulang sistem portal...
                </div>
              )}

              {shareDataStatus === 'error' && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg text-center font-sans">
                  ❌ Format data share rusak, kedaluwarsa, atau tidak valid. Tautan gagal dimuat.
                </div>
              )}

              {shareDataStatus === 'idle' && (
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDeclineSharedData}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer font-sans"
                  >
                    Abaikan (Gunakan Data Lokal)
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySharedData}
                    disabled={!shareDataPending}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 font-sans ${
                      shareDataPending 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Terapkan Data & Sinkronkan
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Synchronize Quran and module custom fonts globally from Firestore shared state
  React.useEffect(() => {
    const syncFont = () => {
      const styleId = 'custom-mushaf-font-sheet';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      const selectedFontPreset = typography?.selectedFontPreset || 'System';
      const customFontData = typography?.customFont;
      let newCss = '';

      if (customFontData && customFontData.url) {
        const fontName = customFontData.name || 'MajmaMalikFahd';
        newCss = `
          @font-face {
            font-family: '${fontName}';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }
          @font-face {
            font-family: 'MajmaMalikFahd';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }
          @font-face {
            font-family: 'UthmanicHafs';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }
          @font-face {
            font-family: 'CustomQuranFont';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }

          /* Aliases for standard Arabic fonts so any component with inline or legacy font names automatically uses the uploaded font */
          @font-face {
            font-family: 'Amiri';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }
          @font-face {
            font-family: 'Amiri Quran';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }
          @font-face {
            font-family: 'Noto Naskh Arabic';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }
          @font-face {
            font-family: 'Scheherazade New';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }
          @font-face {
            font-family: 'Traditional Arabic';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
          }

          /* Map Arabic unicode ranges into standard UI fonts so mixed text automatically renders Arabic characters in the uploaded font */
          @font-face {
            font-family: 'Plus Jakarta Sans';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
            unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+FDF0-FDFD;
          }
          @font-face {
            font-family: 'ui-sans-serif';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
            unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+FDF0-FDFD;
          }
          @font-face {
            font-family: 'ui-serif';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
            unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+FDF0-FDFD;
          }
          @font-face {
            font-family: 'JetBrains Mono';
            src: url('${customFontData.url}');
            font-weight: normal 900;
            font-style: normal;
            unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+FDF0-FDFD;
          }

          :root {
            --font-arabic: '${fontName}', 'MajmaMalikFahd', 'Amiri Quran', 'Amiri', 'Noto Naskh Arabic', 'Scheherazade New', 'Lateef', 'Traditional Arabic', serif;
          }

          /* Global Arabic and Quran selectors across ALL accounts (Admin, Guru, Siswa, Orang Tua) */
          .font-mushaf,
          .font-arabic,
          .font-quran,
          .arabic-text,
          .teks-arab,
          .quran-text,
          [dir="rtl"],
          [dir="rtl"] *,
          :lang(ar),
          [lang="ar"],
          [lang="ar"] *,
          bdi[dir="rtl"],
          .page-html-output [dir="rtl"],
          .page-html-output [dir="rtl"] * {
            font-family: '${fontName}', 'MajmaMalikFahd', 'Amiri Quran', 'Amiri', 'Scheherazade New', 'Lateef', 'Traditional Arabic', serif !important;
            text-rendering: optimizeLegibility !important;
            font-feature-settings: "liga" on, "clig" on, "calt" on, "ccmp" on, "mark" on, "mkmk" on !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }

          /* Form elements, inputs, selects, and options containing Arabic */
          select, option, input, textarea {
            font-family: "Plus Jakarta Sans", var(--font-arabic), ui-sans-serif, system-ui, sans-serif;
          }

          /* In Quranic and Arabic contexts, ensure font-serif prioritizes the uploaded font */
          .font-serif {
            font-family: '${fontName}', 'MajmaMalikFahd', 'Amiri Quran', 'Amiri', 'Scheherazade New', ui-serif, Georgia, serif !important;
          }

          /* Print / PDF styles to retain authentic uploaded font */
          @media print {
            .font-mushaf,
            .font-arabic,
            .font-quran,
            .arabic-text,
            .teks-arab,
            [dir="rtl"],
            [dir="rtl"] *,
            :lang(ar),
            [lang="ar"],
            bdi[dir="rtl"] {
              font-family: '${fontName}', 'MajmaMalikFahd', 'Amiri Quran', 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif !important;
              text-rendering: optimizeLegibility !important;
              font-feature-settings: "liga" on, "clig" on, "calt" on, "ccmp" on, "mark" on, "mkmk" on !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `;
      } else if (selectedFontPreset === 'System') {
        newCss = `
          :root {
            --font-arabic: 'Amiri Quran', 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', 'Lateef', 'Traditional Arabic', serif;
          }
          .font-mushaf,
          .font-arabic,
          .font-quran,
          .arabic-text,
          .teks-arab,
          .quran-text,
          [dir="rtl"],
          [dir="rtl"] *,
          :lang(ar),
          [lang="ar"],
          [lang="ar"] *,
          bdi[dir="rtl"],
          .font-serif,
          .page-html-output [dir="rtl"],
          .page-html-output [dir="rtl"] * {
            font-family: 'Amiri Quran', 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', 'Lateef', 'Traditional Arabic', serif !important;
            text-rendering: optimizeLegibility !important;
            font-feature-settings: "liga" on, "clig" on, "calt" on, "ccmp" on, "mark" on, "mkmk" on !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }
          select, option, input, textarea {
            font-family: "Plus Jakarta Sans", var(--font-arabic), ui-sans-serif, system-ui, sans-serif;
          }
        `;
      } else {
        const fontMap: Record<string, string> = {
          'Amiri Quran': 'Amiri Quran',
          'Amiri': 'Amiri',
          'Noto Naskh Arabic': 'Noto Naskh Arabic',
          'Lateef': 'Lateef',
          'Reem Kufi': 'Reem Kufi',
          'Scheherazade New': 'Scheherazade New'
        };
        const loadedFont = fontMap[selectedFontPreset] || selectedFontPreset || 'Amiri Quran';
        
        const linkId = 'gfont-' + loadedFont.replace(/\s+/g, '-');
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${loadedFont.replace(/\s+/g, '+')}&display=swap`;
          document.head.appendChild(link);
        }

        newCss = `
          :root {
            --font-arabic: '${loadedFont}', 'Amiri Quran', 'Amiri', 'Scheherazade New', serif;
          }
          .font-mushaf,
          .font-arabic,
          .font-quran,
          .arabic-text,
          .teks-arab,
          .quran-text,
          [dir="rtl"],
          [dir="rtl"] *,
          :lang(ar),
          [lang="ar"],
          [lang="ar"] *,
          bdi[dir="rtl"],
          .font-serif,
          .page-html-output [dir="rtl"],
          .page-html-output [dir="rtl"] * {
            font-family: '${loadedFont}', 'Amiri Quran', 'Amiri', serif !important;
            text-rendering: optimizeLegibility !important;
            font-feature-settings: "liga" on, "clig" on, "calt" on, "ccmp" on, "mark" on, "mkmk" on !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }
          select, option, input, textarea {
            font-family: "Plus Jakarta Sans", var(--font-arabic), ui-sans-serif, system-ui, sans-serif;
          }
        `;
      }

      if (styleEl.textContent !== newCss) {
        styleEl.textContent = newCss;
      }
    };

    syncFont();
  }, [typography?.selectedFontPreset, typography?.customFont?.url, typography?.customFont?.name]);

  // Synchronize non-Quran custom fonts globally
  React.useEffect(() => {
    const syncNonQuranFonts = () => {
      const styleId = 'custom-nonquran-fonts-sheet';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      let newContent = '';
      if (nonQuranFonts && nonQuranFonts.length > 0) {
        let rules = '';
        nonQuranFonts.forEach(font => {
          if (font.isGoogleFont) {
            const linkId = 'gfont-nonquran-' + font.name.replace(/\s+/g, '-');
            if (!document.getElementById(linkId)) {
              const link = document.createElement('link');
              link.id = linkId;
              link.rel = 'stylesheet';
              link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}&display=swap`;
              document.head.appendChild(link);
            }
          } else if (font.url) {
            rules += `
              @font-face {
                font-family: '${font.name}';
                src: url('${font.url}');
                font-weight: normal;
                font-style: normal;
              }
            `;
          }
        });
        newContent = rules;
      }

      if (styleEl.textContent !== newContent) {
        styleEl.textContent = newContent;
      }
    };
    syncNonQuranFonts();
  }, [nonQuranFonts]);

  // Dynamic Browser Tab Title
  React.useEffect(() => {
    if (currentSession.user) {
      const { role, namaLengkap } = currentSession.user;
      
      // 1. Set document title: Jabatan: Nama Akun (e.g. Admin: Administrator Utama)
      document.title = `${role}: ${namaLengkap}`;
    } else {
      // Default fallback when not logged in
      document.title = 'Aplikasi Mutabaah Halaqah';
    }
  }, [currentSession.user]);

  const teacherHalaqahs = useMemo(() => {
    if (!currentSession.user || currentSession.user.role !== UserRole.GURU) return [];
    return getTeacherHalaqahs(halaqahs, currentSession.user, gurus, guruSchedules, siswas, strukturLembaga);
  }, [halaqahs, currentSession.user, gurus, guruSchedules, siswas, strukturLembaga]);

  // If teacher only has 1 halaqah, auto-select that single halaqah
  useEffect(() => {
    if (isGuru && teacherHalaqahs.length === 1 && !selectedGuruHalaqahId) {
      setSelectedGuruHalaqahId(teacherHalaqahs[0].id);
    }
  }, [isGuru, teacherHalaqahs, selectedGuruHalaqahId, setSelectedGuruHalaqahId]);

  // If not logged in, render authentication page
  if (!currentSession.user) {
    return (
      <>
        <Auth />
        {renderShareStateModal()}
      </>
    );
  }

  const shouldShowHalaqahSelector = isGuru && teacherHalaqahs.length > 1 && !selectedGuruHalaqahId;

  // If student and outside operational hours, show lock screen
  if (isSiswa && !isSiswaOperationalOpen) {
    return (
      <>
        <LockScreenOverlay 
          onLogout={logout} 
          userNama={currentSession.user?.namaLengkap || 'Siswa'} 
        />
      </>
    );
  }

  // If guru with multiple halaqas has not selected yet, show halaqah selector
  if (shouldShowHalaqahSelector) {
    return (
      <>
        <HalaqahSelector onSelect={(id) => setSelectedGuruHalaqahId(id)} />
      </>
    );
  }

  // Render components dynamically based on chosen tab
  const renderTabContent = () => {
    const isGuru = currentSession.user?.role === UserRole.GURU;
    const isSiswa = currentSession.user?.role === UserRole.SISWA;
    const isAdmin = currentSession.user?.role === UserRole.ADMIN;

    // Enforce admin permission guards for Sub-Admin
    if (isAdmin && !hasAdminPermission(currentSession.user as any, activeTab)) {
      return <Dashboard setActiveTab={setActiveTab} />;
    }

    switch (activeTab) {
      case 'dashboard':
        if (isGuru) return <GuruWorkspace subTab="dashboard" setActiveTab={setActiveTab} />;
        if (isSiswa) return <SiswaWorkspace subTab="dashboard" setActiveTab={setActiveTab} />;
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'pengumuman':
        if (isGuru) return <GuruWorkspace subTab="dashboard" setActiveTab={setActiveTab} />;
        if (isSiswa) return <SiswaWorkspace subTab="dashboard" setActiveTab={setActiveTab} />;
        return <ManagePengumuman setActiveTab={setActiveTab} />;
      case 'guru_siswas':
        return <GuruWorkspace subTab="guru_siswas" setActiveTab={setActiveTab} />;
      case 'guru_mutabaah':
        return <GuruWorkspace subTab="guru_mutabaah" setActiveTab={setActiveTab} />;
      case 'guru_capaian_bacaan':
        return <GuruWorkspace subTab="guru_mutabaah" setActiveTab={setActiveTab} />;
      case 'guru_absensi':
        return <GuruWorkspace subTab="guru_absensi" setActiveTab={setActiveTab} />;
      case 'siswa_mutabaah':
        return <SiswaWorkspace subTab="siswa_mutabaah" setActiveTab={setActiveTab} />;
      case 'siswa_target':
        return <SiswaWorkspace subTab="siswa_target" setActiveTab={setActiveTab} />;
      case 'siswa_progress':
        return <SiswaWorkspace subTab="siswa_progress" setActiveTab={setActiveTab} />;
      case 'siswa_riwayat':
        return <SiswaWorkspace subTab="siswa_riwayat" setActiveTab={setActiveTab} />;
      case 'siswa_modul':
        return <SiswaWorkspace subTab="siswa_modul" setActiveTab={setActiveTab} />;
      case 'siswa_achievements':
        return <SiswaWorkspace subTab="siswa_achievements" setActiveTab={setActiveTab} />;
      case 'siswa_reports':
        return <SiswaWorkspace subTab="siswa_reports" setActiveTab={setActiveTab} />;
      case 'pengguna':
        return <ManagePengguna />;
      case 'admins':
        return <ManagePengguna initialTab="admin" />;
      case 'gurus':
        return <ManagePengguna initialTab="guru" />;
      case 'siswas':
        return <ManagePengguna initialTab="siswa" />;
      case 'struktur_lembaga':
        return <ManageStrukturLembaga />;
      case 'kelashalaqah':
        if (currentSession.user?.role === UserRole.ADMIN) {
          return <ManageHalaqahUnified />;
        }
        return <ManageHalaqah />;
      case 'guru_halaqah_pribadi':
        return <ManageHalaqahPribadi />;
      case 'kurikulum_modul':
      case 'matapelajaran_elemen':
      case 'moduls':
      case 'manajemen_assessment':
      case 'administrasi_guru':
        return <ManageKurikulumModul />;
      case 'guru_administrasi_rpp':
        return <GuruAdministrasiModule />;
      case 'setorans':
        return <ManageSetoran hidePresensiJadwalTabs={currentSession.user?.role === UserRole.ADMIN} />;
      case 'manajemen_syahadah':
        if (isGuru && !syahadahSettings?.isEnabledForGuru) {
          return <Dashboard setActiveTab={setActiveTab} />;
        }
        if (isSiswa && !syahadahSettings?.isEnabledForSiswa) {
          return <Dashboard setActiveTab={setActiveTab} />;
        }
        return <ManageSyahadah />;
      case 'program_keilmuan':
        return <ProgramKeilmuanSystem />;
      case 'pelaksanaan_assessment':
        return <PelaksanaanAssessment />;
      case 'hasil_assessment':
        return <HasilAssessment />;
      case 'murojaah_berpasangan':
        if (isGuru) return <GuruWorkspace subTab="guru_murojaah_berpasangan" setActiveTab={setActiveTab} />;
        if (isSiswa) return <SiswaWorkspace subTab="siswa_murojaah_berpasangan" setActiveTab={setActiveTab} />;
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'profile':
        if (isSiswa) return <SiswaWorkspace subTab="profile" />;
        return <Profile />;
      case 'google_workspace':
        return <GoogleWorkspace />;
      case 'system':
        return <SystemBackup />;
      default:
        if (isGuru) return <GuruWorkspace subTab="dashboard" setActiveTab={setActiveTab} />;
        if (isSiswa) return <SiswaWorkspace subTab="dashboard" setActiveTab={setActiveTab} />;
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 transition-colors duration-300`}>
      
      {/* Permanent Desktop sidebar or Mobile collapsible bar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main viewport area, shifted on desktop sizing */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'} flex flex-col ${activeTab === 'chat' ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'}`}>
        
        {/* Header toolbar with mobile hamburger trigger */}
        <header className="h-16 sm:h-20 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850/80 px-3 sm:px-6 flex items-center justify-between md:justify-end shrink-0 sticky top-0 z-20">
          <button
            id="mobile-menu-trigger"
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-1.5 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition shrink-0"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>


          {/* Institutional metadata */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {isCurrentTester && (
              <div 
                id="header-beta-tester-badge"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-400 shadow-xs animate-fade-in"
                title="Akun Anda terdaftar sebagai Penguji Upgrade (Beta Tester). Anda memiliki akses ke fitur-fitur baru di M-Halaqah."
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                <span>Penguji Upgrade</span>
              </div>
            )}

            <div className="text-right text-xs min-w-0">
            {isGuru && selectedGuruHalaqahId ? (
              <>
                <span className="text-slate-400 dark:text-slate-300 font-semibold uppercase tracking-wider block">
                  Halaqah: {activeHalaqahNama}
                </span>
                {teacherHalaqahs.length > 1 ? (
                  <button
                    onClick={() => setSelectedGuruHalaqahId(null)}
                    className="inline-flex items-center text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer active:scale-95 mt-0.5"
                    title="Pilih halaqah bimbingan lain"
                  >
                    Ganti Halaqah
                  </button>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 font-mono font-bold">PORTAL GURU</span>
                )}
              </>
            ) : isSiswa ? (
              <>
                <span className="text-slate-400 dark:text-slate-300 font-semibold uppercase tracking-wider block">
                  HALAQAH: {siswaHalaqahNama}
                </span>
                <span className="text-slate-700 dark:text-emerald-400 font-mono font-bold block">
                  ID PESERTA: {siswaNis}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5 justify-end py-0.5 min-w-0">
                {isAdmin && (
                  <button
                    onClick={() => setShowCustomConfigModal(true)}
                    title="Pengaturan Koneksi Firebase"
                    className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs shrink-0"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Firebase</span>
                  </button>
                )}
                <IslamicHeaderOrnament 
                  className="w-auto" 
                  onOpenSettings={() => setActiveTab('system')} 
                />
              </div>
            )}
            </div>
          </div>
        </header>

        {isOffline && (
          <div className="mx-6 md:mx-8 mt-6 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm animate-fade-in text-amber-800 dark:text-amber-400">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <div className="text-xs font-sans font-medium">
                Mode Offline: Aplikasi berjalan di penyimpanan lokal sementara Anda offline. Data akan otomatis disinkronkan kembali saat koneksi terhubung.
                {syncError && <span className="block text-[10px] text-red-500 font-mono mt-1 font-bold">Gagal menghubungkan: {syncError}</span>}
              </div>
            </div>
            <button
              onClick={async () => {
                setIsSyncingCloud(true);
                setSyncError(null);
                try {
                  await tryReconnectCloud();
                  setSyncSuccess(true);
                  setTimeout(() => setSyncSuccess(false), 4500);
                } catch (err: any) {
                  setSyncError(err.message || 'Koneksi ke Firebase cloud gagal.');
                } finally {
                  setIsSyncingCloud(false);
                }
              }}
              disabled={isSyncingCloud}
              className="self-end md:self-auto inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              {isSyncingCloud ? 'Menghubungkan...' : 'Hubungkan Re-sync'}
            </button>
          </div>
        )}

        {isQuotaExceeded && (
          <div className="mx-6 md:mx-8 mt-6 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm animate-fade-in text-amber-800 dark:text-amber-400">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <div className="text-xs font-sans font-medium">
                Batas Kuota Harian Sandbox Terlampaui. Aplikasi tetap berjalan normal menggunakan cache lokal browser Anda.
                {syncError && <span className="block text-[10px] text-red-500 font-mono mt-1 font-bold">Gagal menghubungkan: {syncError}</span>}
              </div>
            </div>
            <button
              onClick={async () => {
                setIsSyncingCloud(true);
                setSyncError(null);
                try {
                  await resetOfflineAndQuotaState();
                  setSyncSuccess(true);
                  setTimeout(() => setSyncSuccess(false), 4500);
                } catch (err: any) {
                  setSyncError(err.message || 'Reset status kuota gagal.');
                } finally {
                  setIsSyncingCloud(false);
                }
              }}
              disabled={isSyncingCloud}
              className="self-end md:self-auto inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              {isSyncingCloud ? 'Mengecek...' : 'Coba Hubungkan Cloud'}
            </button>
          </div>
        )}

        {syncSuccess && (
          <div className="mx-6 md:mx-8 mt-6 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-3.5 flex items-center gap-2.5 shadow-sm animate-fade-in text-emerald-850 dark:text-emerald-400">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-sans font-medium">
              Koneksi Firebase berhasil tersambung & disinkronkan kembali online!
            </span>
          </div>
        )}

        {/* Dynamic component workspace with comfortable padding */}
        <main className={`flex-1 min-w-0 max-w-full ${activeTab === 'chat' ? 'p-4 md:p-6 overflow-hidden flex flex-col' : 'p-4 sm:p-6 md:p-8 overflow-y-auto'}`}>
          {renderTabContent()}
        </main>

      </div>

      {/* Toast Notifications Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full font-sans pointer-events-none">
        {toasts.map(toast => {
          let resolvedGroupNama = 'Grup Halaqah';
          if (toast.receiverId.startsWith('group_')) {
            const hId = toast.receiverId.replace('group_', '');
            const matchHDetails = halaqahs.find(h => h.id === hId);
            resolvedGroupNama = matchHDetails ? matchHDetails.namaHalaqah : 'Grup Halaqah';
          }

          return (
            <div 
              key={toast.id}
              className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-emerald-900/40 rounded-2xl shadow-2xl p-4 flex gap-3 cursor-pointer select-none ring-1 ring-slate-100 dark:ring-emerald-950/20 pointer-events-auto transform transition duration-300 hover:scale-[1.02] hover:-translate-y-0.5 animate-slide-in-right"
              onClick={() => {
                setActiveTab('chat');
                if (toast.receiverId.startsWith('group_')) {
                  setActiveChatRecipient({
                    id: toast.receiverId,
                    nama: resolvedGroupNama,
                    role: 'ALL'
                  });
                } else {
                  setActiveChatRecipient({
                    id: toast.senderId,
                    nama: toast.senderNama,
                    role: toast.senderRole
                  });
                }
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-450">
                <Bell className="w-5 h-5 animate-bounce-slow" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest font-mono">Pesan Baru</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }}
                    className="p-1 -mr-1.5 -mt-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5 font-sans">
                  {toast.receiverId.startsWith('group_') ? `${toast.senderNama} @ ${resolvedGroupNama}` : toast.senderNama}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1 leading-normal font-sans">
                  {toast.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {renderCustomConfigModal()}
      {renderShareStateModal()}
      <PwaInstallBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
