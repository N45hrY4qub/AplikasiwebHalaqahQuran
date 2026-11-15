/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { getGoogleAccessToken, signInWithGoogleWorkspace } from './GoogleWorkspace';
import { 
  UserRole, 
  TipeModul, 
  JenisSetoran, 
  TipeTahfidz, 
  StatusAktif, 
  Setoran,
  TajwidCategory,
  TajwidSubcategory,
  KlasifikasiKesalahanType,
  KategoriKesalahanPageRule,
  StatusKehadiranGuru,
  PresensiGuruRecord,
  JadwalMengajarGuru,
  JenisKelamin,
  isPrivateSetoran,
  isPrivateSiswa,
  isPrivateHalaqah,
  isElemenAvailableForHalaqah,
  ElemenSetting,
  ElemenTargetScope,
  RekapPresensiPdfTemplate,
  CustomTemplateTextBox,
  RekapPresensiTableColumns,
  getGuruLokasiText,
  hasAdminTabPermission,
  isAdminUtama,
  getAdminTabLabel
} from '../types';
import { 
  Plus, 
  Search, 
  BookOpen, 
  CheckCircle, 
  X, 
  FileText, 
  FileCode,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Table,
  Type,
  CheckSquare,
  Square,
  Heading1,
  Heading2,
  GripVertical,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Flame,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  Cloud,
  FolderPlus,
  FolderOpen,
  Save,
  Folder,
  ChevronRight,
  Eye,
  Mail,
  Send,
  Printer,
  ExternalLink,
  UserCheck,
  UserX,
  CalendarDays,
  Users,
  User,
  Check,
  Slash,
  HelpCircle,
  Filter,
  Sliders,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  FileSignature,
  Layers,
  Settings,
  Settings2,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Info,
  RotateCcw,
  Tag,
  Palette,
  FileCheck2,
  Lock,
  Unlock,
  GitMerge,
  ShieldCheck,
  Monitor,
  ZoomIn,
  ZoomOut,
  Target
} from 'lucide-react';
import { AdminHalaqahProgress } from './AdminHalaqahProgress';
import { CapaianBacaanSystem } from './CapaianBacaanSystem';
import { AdminPresensiSantri } from './AdminPresensiSantri';
import { getCategorySubcategoriesList, isMakhrajOrHijaiyahCategory } from '../utils/tajwidDeduction';
import { SURAH_LIST } from '../utils/targetProgressHelper';
import {
  findMatchingGuruAttendanceRecord,
  normalizeHalaqahKey,
  normalizeTeacherName,
  isHalaqahBelongingToTeacher
} from '../utils/studentAttendanceHelper';
import {
  DEFAULT_INSTITUTION_NAME,
  DEFAULT_INSTITUTION_ABBR,
  isLegacyInstitutionBranding,
  resolveYayasanDisplayName,
  sanitizeRekapPresensiTemplate
} from '../utils/brandingHelper';

const formatArabicFontClean = (text: string): string => {
  if (!text) return '';
  // Let's trim whitespace and any invisible control characters like \r, \u200F (RLM), \u200E (LRM)
  return text.replace(/[\s\r\n\u200B\u200C\u200D\u200E\u200F]+$/, '').trim();
};

const toEasternArabicDigits = (num: number): string => {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => digits[parseInt(d)] || d).join('');
};

const MONTH_NAMES_MAP: { [key: string]: string } = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember',
};

export const DEFAULT_REKAP_PRESENSI_TEMPLATE: RekapPresensiPdfTemplate = {
  headerBadgeText: 'DIVISI PEMBINAAN AL-QURAN',
  documentTitle: 'REKAP PRESENSI HALAQAH AL-QURAN',
  locationText: 'KANTOR PUSAT',
  autoLocation: true,
  footerSocialText: 'Portal Manajemen Halaqah Al-Quran',
  penanggungjawabJabatan: 'Penanggungjawab Kegiatan',
  penanggungjawabNama: 'Koordinator Halaqah',
  headerImageBase64: '',
  footerImageBase64: '',
  signatureImageBase64: '',
  primaryColorHex: '#045B2A',
  accentColorHex: '#EAB308',
  textBoxes: [],
  tableColumns: {
    showNo: true,
    showTanggal: true,
    showWaktu: false,
    showGuru: true,
    showHalaqah: false,
    showStatus: true,
    showKeterangan: true,
    showLokasi: false,
    customLabels: {
      no: 'No',
      tanggal: 'Tanggal',
      waktu: 'Waktu / Jam',
      guru: 'Nama Guru Pembimbing',
      halaqah: 'Halaqah',
      status: 'Status Kehadiran',
      keterangan: 'Keterangan / Detail Bimbingan',
      lokasi: 'Lokasi / Tempat Mengajar'
    }
  },
  tableDensity: 'normal',
  showSummaryBelowTable: true,
  summaryTextFormat: 'Rekap kehadiran bulan {bulan}: {jumlah} kali',
  showSignatureDate: false,
  elementsOrder: ['title', 'textboxes', 'table'],
};

export const formatPresensiSummaryText = (format: string | undefined, bulanNormal: string, totalHadir: number): string => {
  const defaultFmt = 'Rekap kehadiran bulan {bulan}: {jumlah} kali';
  const rawFmt = (format && format.trim().length > 0) ? format.trim() : defaultFmt;
  
  let res = rawFmt.replace(/{bulan}/gi, bulanNormal);
  if (/{jumlah}/i.test(res)) {
    res = res.replace(/{jumlah}/gi, `${totalHadir}`);
  } else {
    res = `${res.replace(/:\s*$/, '')}: ${totalHadir} kali`;
  }
  return res;
};

export const generateDefaultSignaturePng = (): string => {
  try {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.strokeStyle = '#141821';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Main curve
    ctx.beginPath();
    ctx.moveTo(30, 52);
    ctx.quadraticCurveTo(150, 32, 290, 44);
    // Top loop
    ctx.moveTo(190, 32);
    ctx.bezierCurveTo(230, 8, 250, 32, 230, 60);
    // Diagonal slash
    ctx.moveTo(170, 56);
    ctx.lineTo(270, 32);
    // Bottom underline
    ctx.moveTo(40, 76);
    ctx.lineTo(280, 76);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
};

export const getSavedPresensiTemplate = (): RekapPresensiPdfTemplate => {
  try {
    const saved = localStorage.getItem('rekap_presensi_pdf_template');
    if (saved) {
      const parsed = JSON.parse(saved);
      return sanitizeRekapPresensiTemplate({ 
        ...DEFAULT_REKAP_PRESENSI_TEMPLATE, 
        ...parsed,
        tableColumns: {
          ...DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns,
          ...(parsed.tableColumns || {}),
          customLabels: {
            ...DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns?.customLabels,
            ...(parsed.tableColumns?.customLabels || {})
          }
        },
        summaryTextFormat: parsed.summaryTextFormat || DEFAULT_REKAP_PRESENSI_TEMPLATE.summaryTextFormat,
        showSignatureDate: parsed.showSignatureDate ?? DEFAULT_REKAP_PRESENSI_TEMPLATE.showSignatureDate,
        textBoxes: Array.isArray(parsed.textBoxes) ? parsed.textBoxes : [],
        elementsOrder: Array.isArray(parsed.elementsOrder) && parsed.elementsOrder.length > 0
          ? parsed.elementsOrder
          : ['title', 'textboxes', 'table']
      });
    }
  } catch (e) {
    console.error('Error loading presensi template', e);
  }
  return DEFAULT_REKAP_PRESENSI_TEMPLATE;
};

export interface ManageSetoranProps {
  initialSubTab?: 'riwayat' | 'presensi_santri' | 'progres' | 'presensi_guru' | 'jadwal_guru' | 'pengaturan' | 'tajwid';
  isolatedTab?: 'presensi_guru' | 'jadwal_guru';
  hidePresensiJadwalTabs?: boolean;
}

export const ManageSetoran: React.FC<ManageSetoranProps> = ({
  initialSubTab = 'riwayat',
  isolatedTab,
  hidePresensiJadwalTabs = false
}) => {
  const { 
    currentSession, 
    siswas, 
    setorans, 
    moduls, 
    createSetoran, 
    updateSetoran,
    deleteSetoran,
    halaqahs,
    gurus,
    updateGuru,
    elemenSettings,
    masterPenalties,
    setMasterPenalties,
    saveMasterPenalties,
    updateElemenSetting,
    createElemenSetting,
    updateElemenSettingFull,
    deleteElemenSetting,
    saveElemenSettingObject,
    mataPelajarans,
    tajwidCategories,
    createTajwidCategory,
    updateTajwidCategory,
    deleteTajwidCategory,
    reorderTajwidCategories,
    klasifikasiKesalahanTypes,
    createKlasifikasiKesalahanType,
    updateKlasifikasiKesalahanType,
    deleteKlasifikasiKesalahanType,
    resetKlasifikasiKesalahanTypes,
    guruAttendance,
    saveGuruAttendance,
    guruSchedules,
    saveGuruSchedules,
    rekapPresensiTemplate,
    saveRekapPresensiTemplate,
    quranLinesConfig,
    capaianBacaanTrialSettings,
    updateHalaqah,
    strukturLembaga,
    addLog
  } = useApp();

  const institutionDisplayName = resolveYayasanDisplayName(strukturLembaga?.yayasan?.nama);
  const institutionAbbr = (strukturLembaga?.yayasan?.singkatan && !isLegacyInstitutionBranding(strukturLembaga.yayasan.singkatan))
    ? strukturLembaga.yayasan.singkatan.toUpperCase()
    : DEFAULT_INSTITUTION_ABBR;

  const user = currentSession.user;

  // EXPORTS & GOOGLE DRIVE INTEGRATION
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const [isDriveDropdownOpen, setIsDriveDropdownOpen] = useState(false);
  const [isPresensiDownloadDropdownOpen, setIsPresensiDownloadDropdownOpen] = useState(false);
  const [isPresensiDriveDropdownOpen, setIsPresensiDriveDropdownOpen] = useState(false);

  // Drive Save Modal State
  const [driveSaveItem, setDriveSaveItem] = useState<{
    blob: Blob;
    mimeType: string;
    extension: string;
    defaultName: string;
  } | null>(null);
  const [driveFolders, setDriveFolders] = useState<Array<{ id: string; name: string; parents?: string[] }>>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([{ id: 'root', name: 'Drive Saya' }]);
  const [isFetchingFolders, setIsFetchingFolders] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [driveAuthPrompt, setDriveAuthPrompt] = useState<{ fileName: string; type: 'PDF' | 'Excel' | 'Word' | 'Docs' | 'Sheet' } | null>(null);

  // Drive Bersama (Shared Drives) & Search States
  const [driveLocationTab, setDriveLocationTab] = useState<'my_drive' | 'shared_drives'>('my_drive');
  const [sharedDrivesList, setSharedDrivesList] = useState<Array<{ id: string; name: string }>>([]);
  const [isFetchingSharedDrives, setIsFetchingSharedDrives] = useState<boolean>(false);
  const [activeSharedDriveId, setActiveSharedDriveId] = useState<string | null>(null);
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; parents?: string[] }>>([]);
  const [isSearchingFolders, setIsSearchingFolders] = useState<boolean>(false);

  // PDF Template Settings State
  const [pdfTemplate, setPdfTemplate] = useState<RekapPresensiPdfTemplate>(() => rekapPresensiTemplate || getSavedPresensiTemplate());

  // Presensi Document Preview & Direct Email Modal States
  const [isPresensiPreviewOpen, setIsPresensiPreviewOpen] = useState(false);
  const [presensiPreviewData, setPresensiPreviewData] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
    list: any[];
    format: 'PDF' | 'Excel' | 'Word';
  } | null>(null);

  // Mode Tampilan PDF: 'SHEET' (Lembar Dokumen Langsung Terbuka untuk HP & Desktop) vs 'IFRAME' (Viewer Browser)
  const [pdfPreviewViewMode, setPdfPreviewViewMode] = useState<'SHEET' | 'IFRAME'>(() => {
    if (typeof window !== 'undefined') {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
        ? 'SHEET'
        : 'IFRAME';
    }
    return 'SHEET';
  });
  const [pdfPreviewZoom, setPdfPreviewZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 480) return 60;
      if (window.innerWidth < 640) return 75;
      if (window.innerWidth < 768) return 85;
    }
    return 100;
  });

  // Susunan Tombol Toolbar Presensi Guru pada Tampilan HP: 'scroll' (1 Baris Horizontal Geser) vs 'grid' (Grid Horizontal 2 Kolom)
  const [adminPresensiBtnLayout, setAdminPresensiBtnLayout] = useState<'scroll' | 'grid'>('scroll');

  const [isPresensiEmailModalOpen, setIsPresensiEmailModalOpen] = useState(false);
  const [emailToRecipients, setEmailToRecipients] = useState<string[]>([]);
  const [emailInputTo, setEmailInputTo] = useState('');
  const [emailCcRecipients, setEmailCcRecipients] = useState<string[]>([]);
  const [emailInputCc, setEmailInputCc] = useState('');
  const [emailFormSubject, setEmailFormSubject] = useState('');
  const [emailFormBody, setEmailFormBody] = useState('');
  const [emailBodyViewMode, setEmailBodyViewMode] = useState<'edit' | 'preview'>('edit');
  const [includeLaporanGuru, setIncludeLaporanGuru] = useState<boolean>(true);
  const [includeLaporanSantri, setIncludeLaporanSantri] = useState<boolean>(false);
  const [selectedAttachmentFormats, setSelectedAttachmentFormats] = useState<Array<'PDF' | 'Excel' | 'Word'>>(['PDF']);
  const emailAttachmentFormat = selectedAttachmentFormats[0] || 'PDF';
  const setEmailAttachmentFormat = (fmt: 'PDF' | 'Excel' | 'Word') => {
    setSelectedAttachmentFormats([fmt]);
  };
  const toggleAttachmentFormat = (fmt: 'PDF' | 'Excel' | 'Word') => {
    setSelectedAttachmentFormats(prev => {
      if (prev.includes(fmt)) {
        if (prev.length === 1) return prev;
        return prev.filter(f => f !== fmt);
      } else {
        return [...prev, fmt];
      }
    });
  };
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [quickRecipients, setQuickRecipients] = useState<Array<{ label: string; email: string }>>(() => {
    try {
      const saved = localStorage.getItem('mh_presensi_quick_recipients');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { label: 'Kepala Divisi', email: '' },
      { label: 'Pimpinan / Mudir', email: '' },
      { label: 'HRD / SDM', email: '' }
    ];
  });
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [newRecipientLabel, setNewRecipientLabel] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');

  const isValidEmailAddress = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const parseEmailsFromString = (text: string): string[] => {
    return text
      .split(/[,;\s\n\r]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
  };

  /**
   * Mendeteksi apakah baris teks berorientasi Arab (RTL).
   * Paragraf/baris yang diawali huruf Arab akan rata kanan (RTL).
   * Jika diawali huruf Latin (Indonesia/Inggris) meskipun mengandung teks Arab di tengahnya, tetap rata kiri (LTR).
   */
  const isLineArabicRtl = (line: string): boolean => {
    const cleaned = line.replace(/[\s\d\p{P}\p{S}\-–—_"'`()[\]{}<>«».,:;!?/\\@#$%^&*+=~]/gu, '');
    if (!cleaned) return false;
    const firstChar = cleaned.charAt(0);
    const arabicCharRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicCharRegex.test(firstChar);
  };

  /**
   * Memformat isi email (body) menjadi HTML email yang ramah klien (Gmail/Outlook).
   * Baris teks Arab otomatis rata kanan (RTL) dengan tipografi Arab yang anggun dan jelas.
   * Baris yang diawali teks Latin tetap rata kiri (LTR) dan kata Arab di dalamnya dialirkan inline secara alami (bidi).
   */
  const formatEmailBodyToHtml = (rawBody: string): string => {
    const lines = rawBody.split(/\r?\n/);
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        return '<div style="height: 12px; line-height: 12px;">&nbsp;</div>';
      }

      const isArabic = isLineArabicRtl(trimmed);
      const escaped = trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      if (isArabic) {
        return `<p dir="rtl" class="font-mushaf" style="margin: 0 0 10px 0; text-align: right; direction: rtl; font-family: 'MajmaMalikFahd', 'Amiri Quran', 'Amiri', 'Traditional Arabic', 'Scheherazade', Arial, sans-serif; font-size: 16px; line-height: 1.8; color: #1a202c;">${escaped}</p>`;
      } else {
        let processed = escaped;
        if (arabicRegex.test(escaped)) {
          processed = escaped.replace(/([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u064B-\u065F]+)/g, (match) => {
            if (arabicRegex.test(match)) {
              return `<bdi dir="rtl" class="font-mushaf" style="font-family: 'MajmaMalikFahd', 'Amiri Quran', 'Amiri', 'Traditional Arabic', Arial, sans-serif; font-size: 15px; font-weight: 500;">${match}</bdi>`;
            }
            return match;
          });
        }
        return `<p dir="ltr" style="margin: 0 0 10px 0; text-align: left; direction: ltr; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #2d3748;">${processed}</p>`;
      }
    });

    return `<div style="max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #2d3748;">
      ${formattedLines.join('\n')}
    </div>`;
  };

  const handleAddEmailToRecipients = (rawText: string) => {
    const parsed = parseEmailsFromString(rawText);
    if (parsed.length === 0) return;
    setEmailToRecipients(prev => {
      const next = [...prev];
      for (const email of parsed) {
        if (!next.some(e => e.toLowerCase() === email.toLowerCase())) {
          next.push(email);
        }
      }
      return next;
    });
    setEmailInputTo('');
  };

  const handleRemoveEmailToRecipient = (indexToRemove: number) => {
    setEmailToRecipients(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddEmailCcRecipients = (rawText: string) => {
    const parsed = parseEmailsFromString(rawText);
    if (parsed.length === 0) return;
    setEmailCcRecipients(prev => {
      const next = [...prev];
      for (const email of parsed) {
        if (!next.some(e => e.toLowerCase() === email.toLowerCase())) {
          next.push(email);
        }
      }
      return next;
    });
    setEmailInputCc('');
  };

  const handleRemoveEmailCcRecipient = (indexToRemove: number) => {
    setEmailCcRecipients(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };
  useEffect(() => {
    if (rekapPresensiTemplate) {
      setPdfTemplate(rekapPresensiTemplate);
    }
  }, [rekapPresensiTemplate]);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [tempTemplate, setTempTemplate] = useState<RekapPresensiPdfTemplate>(() => rekapPresensiTemplate || getSavedPresensiTemplate());
  useEffect(() => {
    if (isTemplateModalOpen && rekapPresensiTemplate) {
      setTempTemplate(rekapPresensiTemplate);
    }
  }, [isTemplateModalOpen, rekapPresensiTemplate]);
  const [activeTemplateTab, setActiveTemplateTab] = useState<'header' | 'content' | 'signature' | 'preview'>('header');

  // Interactive Inline Ringkasan Kehadiran di Bawah Tabel
  const [isEditingSummaryText, setIsEditingSummaryText] = useState<boolean>(false);
  const [inlineSummaryText, setInlineSummaryText] = useState<string>(() => (rekapPresensiTemplate || pdfTemplate || getSavedPresensiTemplate()).summaryTextFormat || 'Rekap kehadiran bulan {bulan}: {jumlah} kali');
  const [isSavingSummaryText, setIsSavingSummaryText] = useState<boolean>(false);

  useEffect(() => {
    if (pdfTemplate?.summaryTextFormat) {
      setInlineSummaryText(pdfTemplate.summaryTextFormat);
    }
  }, [pdfTemplate?.summaryTextFormat]);

  const handleSaveInlineSummaryText = async (newFormat?: string) => {
    const formatToSave = (newFormat !== undefined ? newFormat : inlineSummaryText).trim() || 'Rekap kehadiran bulan {bulan}: {jumlah} kali';
    setIsSavingSummaryText(true);
    try {
      const updated = {
        ...pdfTemplate,
        summaryTextFormat: formatToSave
      };
      await saveRekapPresensiTemplate(updated);
      setPdfTemplate(updated);
      setInlineSummaryText(formatToSave);
      setIsEditingSummaryText(false);
    } catch (e: any) {
      console.error('Error saving summary text format:', e);
      alert('Gagal menyimpan format teks ringkasan: ' + (e.message || e));
    } finally {
      setIsSavingSummaryText(false);
    }
  };

  // Custom Content & Layout Handlers for Presensi Template
  const handleAddTextBox = () => {
    const newBox: CustomTemplateTextBox = {
      id: 'tb_' + Date.now(),
      type: 'sub_judul',
      title: '',
      content: '',
      align: 'center',
      isBold: true
    };
    setTempTemplate(prev => ({
      ...prev,
      textBoxes: [...(prev.textBoxes || []), newBox]
    }));
  };

  const handleUpdateTextBox = (id: string, updates: Partial<CustomTemplateTextBox>) => {
    setTempTemplate(prev => ({
      ...prev,
      textBoxes: (prev.textBoxes || []).map(tb => tb.id === id ? { ...tb, ...updates } : tb)
    }));
  };

  const handleRemoveTextBox = (id: string) => {
    setTempTemplate(prev => ({
      ...prev,
      textBoxes: (prev.textBoxes || []).filter(tb => tb.id !== id)
    }));
  };

  const handleMoveTextBox = (index: number, direction: 'up' | 'down') => {
    setTempTemplate(prev => {
      const list = [...(prev.textBoxes || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return { ...prev, textBoxes: list };
    });
  };

  const handleMoveElement = (index: number, direction: 'up' | 'down') => {
    setTempTemplate(prev => {
      const order = [...(prev.elementsOrder || ['title', 'textboxes', 'table'])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= order.length) return prev;
      const temp = order[index];
      order[index] = order[targetIndex];
      order[targetIndex] = temp;
      return { ...prev, elementsOrder: order };
    });
  };

  const handleToggleColumn = (colKey: keyof RekapPresensiTableColumns) => {
    setTempTemplate(prev => {
      const currentCols = prev.tableColumns || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!;
      return {
        ...prev,
        tableColumns: {
          ...currentCols,
          [colKey]: !currentCols[colKey]
        }
      };
    });
  };

  const handleUpdateColumnLabel = (colKey: string, label: string) => {
    setTempTemplate(prev => {
      const currentCols = prev.tableColumns || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!;
      return {
        ...prev,
        tableColumns: {
          ...currentCols,
          customLabels: {
            ...(currentCols.customLabels || {}),
            [colKey]: label
          }
        }
      };
    });
  };

  // Modal Lokasi Mengajar State
  const [isLokasiModalOpen, setIsLokasiModalOpen] = useState<boolean>(false);
  const [selectedGuruForLokasiEdit, setSelectedGuruForLokasiEdit] = useState<string>('All');
  const [lokasiEditInput, setLokasiEditInput] = useState<string>('');

  // Helper to dynamically resolve teaching location for reports based on selected guru or dataset
  const getDynamicReportLocation = (guruIdFilter?: string, list?: any[]) => {
    if (guruIdFilter && guruIdFilter !== 'All') {
      const g = (gurus || []).find(x => x.id === guruIdFilter);
      if (g) {
        return getGuruLokasiText(g, pdfTemplate?.locationText || 'KANTOR PUSAT');
      }
    }
    if (list && list.length > 0) {
      const guruIds = Array.from(new Set(list.map(i => i.guruId || i.guruPembimbingId).filter(Boolean))) as string[];
      if (guruIds.length === 1) {
        const g = (gurus || []).find(x => x.id === guruIds[0]);
        if (g) {
          return getGuruLokasiText(g, pdfTemplate?.locationText || 'KANTOR PUSAT');
        }
      } else if (guruIds.length > 1) {
        const uniqueLocs = Array.from(new Set(
          guruIds.map(gid => {
            const g = (gurus || []).find(x => x.id === gid);
            return g ? getGuruLokasiText(g, '') : '';
          }).filter(Boolean)
        ));
        if (uniqueLocs.length > 0) {
          return uniqueLocs.join(', ');
        }
      }
    }
    return pdfTemplate?.locationText || 'KANTOR PUSAT';
  };

  // View Details Modal State
  const [viewingSetoran, setViewingSetoran] = useState<Setoran | null>(null);

  // Check tab access permissions for Admin
  const canAccessRiwayat = user.role !== UserRole.ADMIN || hasAdminTabPermission(user, 'setorans', 'riwayat');
  const canAccessPresensiSantri = user.role !== UserRole.ADMIN || hasAdminTabPermission(user, 'setorans', 'presensi_santri');
  const canAccessProgres = user.role !== UserRole.ADMIN || hasAdminTabPermission(user, 'setorans', 'progres');
  const canAccessPengaturan = user.role !== UserRole.ADMIN || hasAdminTabPermission(user, 'setorans', 'pengaturan');
  const canAccessTajwid = user.role !== UserRole.ADMIN || hasAdminTabPermission(user, 'setorans', 'tajwid');
  const canAccessCapaianBacaan = user.role === UserRole.ADMIN
    ? (isAdminUtama(user) || hasAdminTabPermission(user, 'setorans', 'capaian_bacaan'))
    : true;

  // Track active sub tab for Admin
  const [activeSubTab, setActiveSubTab] = useState<'riwayat' | 'presensi_santri' | 'progres' | 'presensi_guru' | 'jadwal_guru' | 'pengaturan' | 'tajwid' | 'capaian_bacaan'>(() => {
    if (isolatedTab) return isolatedTab;
    if (canAccessRiwayat) return 'riwayat';
    if (canAccessPresensiSantri) return 'presensi_santri';
    if (canAccessProgres) return 'progres';
    if (canAccessPengaturan) return 'pengaturan';
    if (canAccessTajwid) return 'tajwid';
    if (canAccessCapaianBacaan) return 'capaian_bacaan';
    return initialSubTab;
  });

  useEffect(() => {
    if (isolatedTab) {
      setActiveSubTab(isolatedTab);
    }
  }, [isolatedTab]);

  useEffect(() => {
    if (user.role === UserRole.ADMIN && !isolatedTab) {
      if (activeSubTab === 'riwayat' && !canAccessRiwayat) {
        if (canAccessPresensiSantri) setActiveSubTab('presensi_santri');
        else if (canAccessProgres) setActiveSubTab('progres');
        else if (canAccessPengaturan) setActiveSubTab('pengaturan');
        else if (canAccessTajwid) setActiveSubTab('tajwid');
        else if (canAccessCapaianBacaan) setActiveSubTab('capaian_bacaan');
      } else if (activeSubTab === 'presensi_santri' && !canAccessPresensiSantri) {
        if (canAccessRiwayat) setActiveSubTab('riwayat');
        else if (canAccessProgres) setActiveSubTab('progres');
        else if (canAccessPengaturan) setActiveSubTab('pengaturan');
        else if (canAccessTajwid) setActiveSubTab('tajwid');
        else if (canAccessCapaianBacaan) setActiveSubTab('capaian_bacaan');
      } else if (activeSubTab === 'progres' && !canAccessProgres) {
        if (canAccessRiwayat) setActiveSubTab('riwayat');
        else if (canAccessPresensiSantri) setActiveSubTab('presensi_santri');
        else if (canAccessPengaturan) setActiveSubTab('pengaturan');
        else if (canAccessTajwid) setActiveSubTab('tajwid');
        else if (canAccessCapaianBacaan) setActiveSubTab('capaian_bacaan');
      } else if (activeSubTab === 'pengaturan' && !canAccessPengaturan) {
        if (canAccessRiwayat) setActiveSubTab('riwayat');
        else if (canAccessPresensiSantri) setActiveSubTab('presensi_santri');
        else if (canAccessProgres) setActiveSubTab('progres');
        else if (canAccessTajwid) setActiveSubTab('tajwid');
        else if (canAccessCapaianBacaan) setActiveSubTab('capaian_bacaan');
      } else if (activeSubTab === 'tajwid' && !canAccessTajwid) {
        if (canAccessRiwayat) setActiveSubTab('riwayat');
        else if (canAccessPresensiSantri) setActiveSubTab('presensi_santri');
        else if (canAccessProgres) setActiveSubTab('progres');
        else if (canAccessPengaturan) setActiveSubTab('pengaturan');
        else if (canAccessCapaianBacaan) setActiveSubTab('capaian_bacaan');
      } else if (activeSubTab === 'capaian_bacaan' && !canAccessCapaianBacaan) {
        if (canAccessRiwayat) setActiveSubTab('riwayat');
        else if (canAccessPresensiSantri) setActiveSubTab('presensi_santri');
        else if (canAccessProgres) setActiveSubTab('progres');
        else if (canAccessPengaturan) setActiveSubTab('pengaturan');
        else if (canAccessTajwid) setActiveSubTab('tajwid');
      }
    }
  }, [canAccessRiwayat, canAccessPresensiSantri, canAccessProgres, canAccessPengaturan, canAccessTajwid, canAccessCapaianBacaan, activeSubTab, user.role, isolatedTab]);

  // Helper to determine if a setoran or student belongs to a private halaqah
  const isPrivateSetoranItem = (s: Setoran) => {
    return isPrivateSetoran(s, halaqahs, siswas);
  };

  // Presensi Guru States - Support Multi-Select Guru & Backward Compatibility
  const [attendanceFilterDate, setAttendanceFilterDate] = useState<string>('');
  const [attendanceFilterGurus, setAttendanceFilterGurus] = useState<string[]>([]);
  const [isGuruFilterDropdownOpen, setIsGuruFilterDropdownOpen] = useState<boolean>(false);
  const [guruFilterSearchQuery, setGuruFilterSearchQuery] = useState<string>('');

  // Backward compatibility alias for single-guru logic
  const attendanceFilterGuru = attendanceFilterGurus.length === 1
    ? attendanceFilterGurus[0]
    : (attendanceFilterGurus.length > 1 ? 'Multiple' : 'All');

  const setAttendanceFilterGuru = (val: string) => {
    if (val === 'All') {
      setAttendanceFilterGurus([]);
    } else {
      setAttendanceFilterGurus([val]);
    }
  };

  const handleToggleGuruFilter = (guruId: string) => {
    setAttendanceFilterGurus(prev => {
      if (prev.includes(guruId)) {
        return prev.filter(id => id !== guruId);
      } else {
        return [...prev, guruId];
      }
    });
  };

  const handleSelectAllGurusFilter = () => {
    const allIds = (gurus || []).map(g => g.id);
    setAttendanceFilterGurus(allIds);
  };

  const handleClearAllGurusFilter = () => {
    setAttendanceFilterGurus([]);
  };

  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState<string>('All');
  const [attendanceFilterMonth, setAttendanceFilterMonth] = useState<string>('All'); // 'All', '01', ..., '12', 'Custom'
  const [attendanceFilterYear, setAttendanceFilterYear] = useState<string>(() => new Date().getFullYear().toString());
  const [attendanceFilterStartDate, setAttendanceFilterStartDate] = useState<string>(''); // YYYY-MM-DD
  const [attendanceFilterEndDate, setAttendanceFilterEndDate] = useState<string>(''); // YYYY-MM-DD

  // Filter halaqah-halaqah yang diampu selain halaqah pribadi (menggunakan tick box)
  const [selectedHalaqahIdsForPresensi, setSelectedHalaqahIdsForPresensi] = useState<string[]>([]);
  const [lastSelectedTeacherId, setLastSelectedTeacherId] = useState<string>('');

  // Halaqah lembaga (selain halaqah pribadi) yang dibimbing oleh guru-guru terpilih
  const teacherNonPrivateHalaqahs = useMemo(() => {
    if (attendanceFilterGurus.length === 0) return [];

    const selectedGuruObjs = (gurus || []).filter(g => attendanceFilterGurus.includes(g.id));
    const guruNamesNorm = selectedGuruObjs.map(g => (g?.namaLengkap || '').trim().toLowerCase()).filter(Boolean);

    return (halaqahs || []).filter(h => {
      // Kecualikan halaqah pribadi secara ketat
      if (isPrivateHalaqah(h)) return false;
      if (h.sourceType === 'private_halaqah') return false;
      if (h.namaHalaqah && h.namaHalaqah.toLowerCase().includes('pribadi')) return false;

      // Verifikasi penugasan guru pada halaqah lembaga ini
      const matchesId = attendanceFilterGurus.includes(h.guruPembimbingId || '');
      const matchesName = Boolean(
        h.guruPembimbingNama &&
        guruNamesNorm.includes(h.guruPembimbingNama.trim().toLowerCase())
      );
      const matchesBimbinganId = selectedGuruObjs.some(g => g.halaqahBimbinganId && h.id === g.halaqahBimbinganId);
      const matchesSchedule = (guruSchedules || []).some(
        sch => attendanceFilterGurus.includes(sch.guruId) && (
          sch.halaqahId === h.id ||
          (sch.halaqahNama && h.namaHalaqah && sch.halaqahNama.trim().toLowerCase() === h.namaHalaqah.trim().toLowerCase())
        )
      );

      return matchesId || matchesName || matchesBimbinganId || matchesSchedule;
    });
  }, [attendanceFilterGurus, gurus, halaqahs, guruSchedules]);

  // Sinkronisasi pilihan tick box halaqah saat guru pembimbing berganti
  useEffect(() => {
    const gurusKey = attendanceFilterGurus.slice().sort().join(',');
    if (gurusKey !== lastSelectedTeacherId) {
      setLastSelectedTeacherId(gurusKey);
      if (attendanceFilterGurus.length > 0) {
        const availableIds = teacherNonPrivateHalaqahs.map(h => h.id);
        setSelectedHalaqahIdsForPresensi(availableIds);
      } else {
        setSelectedHalaqahIdsForPresensi([]);
      }
    }
  }, [attendanceFilterGurus, lastSelectedTeacherId, teacherNonPrivateHalaqahs]);

  // Jadwal mengajar untuk halaqah-halaqah yang sedang dicentang pada filter
  const displayedSchedulesForSelectedHalaqahs = useMemo(() => {
    if (attendanceFilterGurus.length === 0) return [];

    const selectedGuruObjs = (gurus || []).filter(g => attendanceFilterGurus.includes(g.id));
    const guruNamesNorm = selectedGuruObjs.map(g => (g?.namaLengkap || '').trim().toLowerCase()).filter(Boolean);

    // Hanya halaqah yang dicentang (tick box aktif)
    const checkedHalaqahs = teacherNonPrivateHalaqahs.filter(h =>
      selectedHalaqahIdsForPresensi.includes(h.id)
    );

    return checkedHalaqahs.map(h => {
      // Cari sesi jadwal spesifik di guruSchedules jika ada
      const slots = (guruSchedules || []).filter(sch => {
        const matchGuru = attendanceFilterGurus.includes(sch.guruId) ||
          (sch.guruNama && guruNamesNorm.includes(sch.guruNama.trim().toLowerCase()));
        const matchHalaqah = sch.halaqahId === h.id ||
          (sch.halaqahNama && h.namaHalaqah && sch.halaqahNama.trim().toLowerCase() === h.namaHalaqah.trim().toLowerCase());
        return matchGuru && matchHalaqah;
      });

      const students = (siswas || []).filter(s => s.halaqahId === h.id);

      return {
        halaqah: h,
        slots,
        studentCount: students.length
      };
    });
  }, [attendanceFilterGurus, gurus, teacherNonPrivateHalaqahs, selectedHalaqahIdsForPresensi, guruSchedules, siswas]);

  const handleAttendanceMonthChange = (monthVal: string, yearVal: string) => {
    setAttendanceFilterMonth(monthVal);
    setAttendanceFilterYear(yearVal);
    if (monthVal === 'All') {
      setAttendanceFilterStartDate('');
      setAttendanceFilterEndDate('');
    } else {
      const year = parseInt(yearVal) || new Date().getFullYear();
      const month = parseInt(monthVal);
      const lastDay = new Date(year, month, 0).getDate();
      const pad = (n: number) => n.toString().padStart(2, '0');
      setAttendanceFilterStartDate(`${year}-${pad(month)}-01`);
      setAttendanceFilterEndDate(`${year}-${pad(month)}-${pad(lastDay)}`);
    }
  };

  const handleAttendanceCustomDateChange = (start: string, end: string) => {
    setAttendanceFilterStartDate(start);
    setAttendanceFilterEndDate(end);
    setAttendanceFilterMonth('Custom');
  };
  const [isPresensiModalOpen, setIsPresensiModalOpen] = useState<boolean>(false);
  const [inputGuruId, setInputGuruId] = useState<string>('');
  const [inputHalaqahId, setInputHalaqahId] = useState<string>('');
  const [inputTanggal, setInputTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [inputStatus, setInputStatus] = useState<string>('Hadir');
  const [inputCatatan, setInputCatatan] = useState<string>('');
  const [editingPresensiId, setEditingPresensiId] = useState<string | null>(null);

  const getNonPrivateHalaqahsForGuru = (targetGuruId: string) => {
    if (!targetGuruId) return [];
    const guruObj = (gurus || []).find(g => g.id === targetGuruId);
    const guruUser = guruObj || { id: targetGuruId, namaLengkap: '' };
    return (halaqahs || []).filter(h => {
      if (isPrivateHalaqah(h)) return false;
      if (h.sourceType === 'private_halaqah') return false;
      if (h.namaHalaqah && h.namaHalaqah.toLowerCase().includes('pribadi')) return false;
      return isHalaqahBelongingToTeacher(h, guruUser, gurus, guruSchedules, siswas);
    });
  };

  const getDefaultHalaqahSelectionForGuru = (targetGuruId: string, preferredHalaqahId?: string) => {
    const list = getNonPrivateHalaqahsForGuru(targetGuruId);
    if (preferredHalaqahId && list.some(h => h.id === preferredHalaqahId)) {
      return preferredHalaqahId;
    }
    if (list.length === 1) return list[0].id;
    return '';
  };

  const inputPresensiDayName = useMemo(() => {
    if (!inputTanggal) return '';
    const parts = inputTanggal.split('-');
    if (parts.length !== 3) return '';
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (isNaN(d.getTime())) return '';
    return ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()] || '';
  }, [inputTanggal]);

  const availableHalaqahsForInputGuru = useMemo(() => {
    const list = getNonPrivateHalaqahsForGuru(inputGuruId);
    const guruObj = (gurus || []).find(g => g.id === inputGuruId);
    const guruNameNorm = normalizeTeacherName(guruObj?.namaLengkap);
    return list.map(h => {
      const hKey = normalizeHalaqahKey(h.namaHalaqah);
      const daySlots = (guruSchedules || []).filter(sch => {
        if (sch.status !== StatusAktif.AKTIF) return false;
        if (inputPresensiDayName && sch.hari !== inputPresensiDayName) return false;
        const matchGuru = (inputGuruId && sch.guruId === inputGuruId) ||
          (guruNameNorm && sch.guruNama && normalizeTeacherName(sch.guruNama) === guruNameNorm);
        const matchHalaqah = (h.id && sch.halaqahId === h.id) ||
          (hKey && sch.halaqahNama && normalizeHalaqahKey(sch.halaqahNama) === hKey);
        return matchGuru && matchHalaqah;
      });
      const allSlots = (guruSchedules || []).filter(sch => {
        if (sch.status !== StatusAktif.AKTIF) return false;
        const matchGuru = (inputGuruId && sch.guruId === inputGuruId) ||
          (guruNameNorm && sch.guruNama && normalizeTeacherName(sch.guruNama) === guruNameNorm);
        const matchHalaqah = (h.id && sch.halaqahId === h.id) ||
          (hKey && sch.halaqahNama && normalizeHalaqahKey(sch.halaqahNama) === hKey);
        return matchGuru && matchHalaqah;
      });
      const dayTimeLabel = daySlots.length > 0
        ? daySlots.map(s => `${s.jamMulai} - ${s.jamSelesai}`).join(', ')
        : (allSlots.length > 0 ? allSlots.map(s => `${s.hari} ${s.jamMulai}-${s.jamSelesai}`).join(', ') : '');
      return {
        halaqah: h,
        hasScheduleOnSelectedDay: daySlots.length > 0,
        dayTimeLabel,
      };
    });
  }, [inputGuruId, inputPresensiDayName, halaqahs, gurus, guruSchedules, siswas]);

  // Jadwal Mengajar Guru States
  const [scheduleFilterGuru, setScheduleFilterGuru] = useState<string>('All');
  const [scheduleFilterHari, setScheduleFilterHari] = useState<string>('All');
  const [scheduleViewMode, setScheduleViewMode] = useState<'halaqah' | 'hari'>('halaqah');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [schGuruId, setSchGuruId] = useState<string>('');
  const [schHari, setSchHari] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad'>('Senin');
  const [schJamMulai, setSchJamMulai] = useState<string>('07:30');
  const [schJamSelesai, setSchJamSelesai] = useState<string>('09:00');
  const [schHalaqahId, setSchHalaqahId] = useState<string>('');
  const [schMateri, setSchMateri] = useState<string>('Halaqah Tahfidz Pagi');
  const [schStatus, setSchStatus] = useState<StatusAktif>(StatusAktif.AKTIF);
  const [schCatatan, setSchCatatan] = useState<string>('');

  // Helper formatting nama dan gelar guru pembimbing
  const formatGuruTitleAndName = (guruNama: string, guruId?: string) => {
    if (!guruNama) return '-';
    const nameTrimmed = String(guruNama).trim();
    if (/^ustadz(ah)?\b/i.test(nameTrimmed)) {
      return nameTrimmed;
    }
    const matchedGuru = (gurus || []).find(g => g && (g.id === guruId || g.namaLengkap === guruNama));
    const isFemale = matchedGuru 
      ? (matchedGuru.jenisKelamin === 'Perempuan' || (matchedGuru.jenisKelamin as string) === 'PEREMPUAN')
      : false;
    const title = isFemale ? 'Ustadzah' : 'Ustadz';
    return `${title} ${nameTrimmed}`;
  };

  const getGuruTitleAndName = (g: any) => {
    if (!g) return 'Guru';
    const name = String(g.namaLengkap || g.nama || '').trim();
    if (/^ustadz(ah)?\b/i.test(name)) {
      return name;
    }
    const isFemale = g.jenisKelamin === 'Perempuan' || g.jenisKelamin === JenisKelamin.PEREMPUAN;
    const title = isFemale ? 'Ustadzah' : 'Ustadz';
    return `${title} ${name}`;
  };

  // Kelompok jadwal mengajar per halaqah untuk tampilan tab Jadwal Mengajar Guru
  const groupedSchedulesByHalaqah = useMemo(() => {
    const DAY_ORDER: Record<string, number> = {
      'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Ahad': 7
    };

    // 1. Ambil halaqah-halaqah lembaga (non-pribadi)
    const validHalaqahs = (halaqahs || []).filter(h => {
      if (!h) return false;
      try {
        if (typeof isPrivateHalaqah === 'function' && isPrivateHalaqah(h)) return false;
      } catch (e) {
        console.warn('Error checking isPrivateHalaqah:', e);
      }
      if (h.sourceType === 'private_halaqah') return false;
      if (h.namaHalaqah && typeof h.namaHalaqah === 'string' && h.namaHalaqah.toLowerCase().includes('pribadi')) return false;
      return true;
    });

    // 2. Filter halaqah berdasarkan guru jika filter aktif
    const filteredHalaqahs = validHalaqahs.filter(h => {
      if (scheduleFilterGuru === 'All') return true;

      const selectedGuruObj = (gurus || []).find(g => g && g.id === scheduleFilterGuru);
      const guruNameNorm = (selectedGuruObj?.namaLengkap || '').trim().toLowerCase();

      const matchesGuruId = h.guruPembimbingId === scheduleFilterGuru;
      const matchesGuruName = Boolean(
        guruNameNorm &&
        h.guruPembimbingNama &&
        typeof h.guruPembimbingNama === 'string' &&
        h.guruPembimbingNama.trim().toLowerCase() === guruNameNorm
      );
      const matchesBimbinganId = Boolean(selectedGuruObj?.halaqahBimbinganId && h.id === selectedGuruObj.halaqahBimbinganId);
      const hasMatchingSchedule = (guruSchedules || []).some(
        sch => sch && sch.guruId === scheduleFilterGuru && (
          sch.halaqahId === h.id ||
          (sch.halaqahNama && h.namaHalaqah && typeof sch.halaqahNama === 'string' && typeof h.namaHalaqah === 'string' && sch.halaqahNama.trim().toLowerCase() === h.namaHalaqah.trim().toLowerCase())
        )
      );

      return matchesGuruId || matchesGuruName || matchesBimbinganId || hasMatchingSchedule;
    });

    // 3. Untuk setiap halaqah, kumpulkan sesi jadwalnya
    const halaqahCards = filteredHalaqahs.map(h => {
      const guruObj = (gurus || []).find(g => g && g.id === h.guruPembimbingId) ||
        (gurus || []).find(g => g && h.guruPembimbingNama && typeof g.namaLengkap === 'string' && typeof h.guruPembimbingNama === 'string' && g.namaLengkap.trim().toLowerCase() === h.guruPembimbingNama.trim().toLowerCase());
      const guruNamaDisplay = guruObj ? formatGuruTitleAndName(guruObj.namaLengkap, guruObj.id) : (h.guruPembimbingNama ? formatGuruTitleAndName(h.guruPembimbingNama) : 'Belum Ditentukan');

      const slots = (guruSchedules || []).filter(sch => {
        if (!sch) return false;
        const matchHalaqah = sch.halaqahId === h.id ||
          (sch.halaqahNama && h.namaHalaqah && typeof sch.halaqahNama === 'string' && typeof h.namaHalaqah === 'string' && sch.halaqahNama.trim().toLowerCase() === h.namaHalaqah.trim().toLowerCase());
        if (!matchHalaqah) return false;

        if (scheduleFilterGuru !== 'All' && sch.guruId !== scheduleFilterGuru) return false;
        if (scheduleFilterHari !== 'All' && sch.hari !== scheduleFilterHari) return false;
        return true;
      });

      slots.sort((a, b) => (DAY_ORDER[a.hari] || 99) - (DAY_ORDER[b.hari] || 99) || String(a.jamMulai || '').localeCompare(String(b.jamMulai || '')));

      const studentCount = (siswas || []).filter(s => s && s.halaqahId === h.id).length;

      const hasHariFilterMatch = scheduleFilterHari === 'All'
        ? true
        : (slots.length > 0 || (typeof h.hariKegiatan === 'string' && h.hariKegiatan.toLowerCase().includes(scheduleFilterHari.toLowerCase())));

      return {
        halaqah: h,
        guruNama: guruNamaDisplay,
        guruId: guruObj?.id || h.guruPembimbingId || '',
        slots,
        studentCount,
        hasFilterMatch: hasHariFilterMatch
      };
    });

    // Sesi jadwal mandiri / umum (jika tidak terikat ke halaqah manapun)
    const standaloneSchedules = (guruSchedules || []).filter(sch => {
      if (!sch) return false;
      if (scheduleFilterGuru !== 'All' && sch.guruId !== scheduleFilterGuru) return false;
      if (scheduleFilterHari !== 'All' && sch.hari !== scheduleFilterHari) return false;
      
      const foundInHalaqah = validHalaqahs.some(h => 
        h && (h.id === sch.halaqahId || 
        (sch.halaqahNama && h.namaHalaqah && typeof sch.halaqahNama === 'string' && typeof h.namaHalaqah === 'string' && sch.halaqahNama.trim().toLowerCase() === h.namaHalaqah.trim().toLowerCase()))
      );
      return !foundInHalaqah;
    });
    standaloneSchedules.sort((a, b) => (DAY_ORDER[a.hari] || 99) - (DAY_ORDER[b.hari] || 99) || String(a.jamMulai || '').localeCompare(String(b.jamMulai || '')));

    return {
      halaqahCards: scheduleFilterHari === 'All' 
        ? halaqahCards 
        : halaqahCards.filter(hc => hc.hasFilterMatch),
      standaloneSchedules
    };
  }, [halaqahs, gurus, guruSchedules, siswas, scheduleFilterGuru, scheduleFilterHari]);

  // Helper to compile combined guru attendance records (Auto-detected from setorans + Manual entries from guruAttendance)
  const compiledGuruAttendance = useMemo(() => {
    // 1. Group student setorans by date, guruId, and halaqahId
    const setoranGroupMap = new Map<string, { 
      guruId: string; 
      guruNama: string; 
      date: string; 
      count: number;
      halaqahId: string;
      halaqahNama: string;
      halaqahIds: Set<string>;
      halaqahNamas: Set<string>;
    }>();
    
    (setorans || []).forEach(s => {
      if (!s.tanggalSetoran) return;
      if (isPrivateSetoranItem(s)) return; // Exclude setoran from private halaqah
      const date = s.tanggalSetoran;
      let gId = s.guruId || '';
      let gNama = s.guruNama || '';
      
      if (!gId && gNama) {
        const found = (gurus || []).find(g => g.namaLengkap.toLowerCase() === gNama.toLowerCase());
        if (found) gId = found.id;
      }
      if (gId && !gNama) {
        const found = (gurus || []).find(g => g.id === gId);
        if (found) gNama = found.namaLengkap;
      }

      if (!gId && !gNama) return;

      const student = (siswas || []).find(st => st.id === s.siswaId);
      const sHalaqahId = s.halaqahId || student?.halaqahId || '';
      const sHalaqahObj = (halaqahs || []).find(h => h.id === sHalaqahId);
      const sHalaqahNama = s.halaqahNama || sHalaqahObj?.namaHalaqah || '';

      const key = `${date}_${gId || gNama}_${sHalaqahId || 'general'}`;
      if (!setoranGroupMap.has(key)) {
        setoranGroupMap.set(key, { 
          guruId: gId, 
          guruNama: gNama, 
          date, 
          count: 0,
          halaqahId: sHalaqahId,
          halaqahNama: sHalaqahNama,
          halaqahIds: new Set<string>(),
          halaqahNamas: new Set<string>()
        });
      }
      const existing = setoranGroupMap.get(key)!;
      existing.count += 1;
      if (sHalaqahId) {
        existing.halaqahIds.add(sHalaqahId);
        if (!existing.halaqahId) existing.halaqahId = sHalaqahId;
      }
      if (sHalaqahNama) {
        existing.halaqahNamas.add(sHalaqahNama);
        if (!existing.halaqahNama) existing.halaqahNama = sHalaqahNama;
      }
    });

    // Combined list
    const combined: Array<{
      id: string;
      guruId: string;
      guruNama: string;
      tanggal: string;
      status: string;
      catatan: string;
      setoranCount: number;
      isAutoDetected: boolean;
      halaqahId?: string;
      halaqahNama?: string;
      halaqahIds?: string[];
      halaqahNamas?: string[];
      updatedByAdminNama?: string;
      updatedAt?: string;
    }> = [];

    // Map existing manual guruAttendance entries by date_guruId_halaqahId or date_guruId
    const manualMap = new Map<string, any>();
    (guruAttendance || []).forEach((att, idx) => {
      // Must NOT be student attendance record (siswaId without guruId)
      if (att.siswaId && !att.guruId) return;

      let gNama = (att.guruNama || '').trim();
      let gId = (att.guruId || '').trim();

      if (!gNama && gId) {
        const found = (gurus || []).find(g => g.id === gId);
        if (found) gNama = found.namaLengkap;
      } else if (!gId && gNama) {
        const found = (gurus || []).find(g => g.namaLengkap.toLowerCase() === gNama.toLowerCase());
        if (found) gId = found.id;
      }

      if (!gNama || gNama.toLowerCase() === 'guru') {
        const found = (gurus || []).find(g => g.id === gId);
        if (found) {
          gNama = found.namaLengkap;
        } else {
          return;
        }
      }

      const rawAttHId = (att.halaqahId || '').trim();
      const isGlobalMarker = rawAttHId.toLowerCase() === 'all' || rawAttHId.toLowerCase() === 'semua';
      let resolvedAttHalaqahId = isGlobalMarker ? '' : rawAttHId;
      let resolvedAttHalaqahNama = (att.halaqahNama || '').trim();
      if (!resolvedAttHalaqahId && resolvedAttHalaqahNama && !resolvedAttHalaqahNama.toLowerCase().startsWith('semua halaqah')) {
        const matchedHal = (halaqahs || []).find(h => normalizeHalaqahKey(h.namaHalaqah) === normalizeHalaqahKey(resolvedAttHalaqahNama));
        if (matchedHal) {
          resolvedAttHalaqahId = matchedHal.id;
          resolvedAttHalaqahNama = matchedHal.namaHalaqah;
        }
      } else if (resolvedAttHalaqahId && !resolvedAttHalaqahNama) {
        const matchedHal = (halaqahs || []).find(h => h.id === resolvedAttHalaqahId);
        if (matchedHal) resolvedAttHalaqahNama = matchedHal.namaHalaqah;
      }

      const key = `${att.tanggal}_${gId || gNama}${resolvedAttHalaqahId ? `_${resolvedAttHalaqahId}` : ''}`;
      manualMap.set(key, {
        ...att,
        guruId: gId,
        guruNama: gNama,
        halaqahId: resolvedAttHalaqahId,
        halaqahNama: resolvedAttHalaqahNama,
        id: att.id || `att-manual-${att.tanggal}-${gId || gNama || idx}${resolvedAttHalaqahId ? `-${resolvedAttHalaqahId}` : ''}`
      });
    });

    // Add all auto-detected from setoranGroupMap
    setoranGroupMap.forEach((val, key) => {
      const specificManualKey = `${val.date}_${val.guruId || val.guruNama}_${val.halaqahId || 'general'}`;
      const generalManualKey = `${val.date}_${val.guruId || val.guruNama}`;
      const manualRecord = manualMap.get(specificManualKey) || manualMap.get(generalManualKey);
      const hIds = Array.from(val.halaqahIds);
      const hNamas = Array.from(val.halaqahNamas);
      const singleHalaqahId = val.halaqahId || (hIds.length > 0 ? hIds[0] : '');
      const singleHalaqahNama = val.halaqahNama || (hNamas.length > 0 ? hNamas[0] : '');

      if (manualRecord) {
        // Manual override exists
        combined.push({
          id: manualRecord.id || `manual-${val.date}-${val.guruId || val.guruNama}-${singleHalaqahId}`,
          guruId: val.guruId || manualRecord.guruId,
          guruNama: val.guruNama || manualRecord.guruNama,
          tanggal: val.date,
          status: manualRecord.status || 'Hadir',
          catatan: manualRecord.catatan || `Tercatat ${val.count} setoran santri${singleHalaqahNama ? ` (${singleHalaqahNama})` : ''}`,
          setoranCount: val.count,
          isAutoDetected: false,
          halaqahId: singleHalaqahId || manualRecord.halaqahId || '',
          halaqahNama: singleHalaqahNama || manualRecord.halaqahNama || '',
          halaqahIds: hIds.length > 0 ? hIds : (manualRecord.halaqahId ? [manualRecord.halaqahId] : []),
          halaqahNamas: hNamas.length > 0 ? hNamas : (manualRecord.halaqahNama ? [manualRecord.halaqahNama] : []),
          updatedByAdminNama: manualRecord.updatedByAdminNama,
          updatedAt: manualRecord.updatedAt
        });
        if (manualMap.has(specificManualKey)) manualMap.delete(specificManualKey);
        else if (manualMap.has(generalManualKey)) manualMap.delete(generalManualKey);
      } else {
        // Pure auto-detected Hadir
        combined.push({
          id: `auto-${key}`,
          guruId: val.guruId,
          guruNama: val.guruNama,
          tanggal: val.date,
          status: 'Hadir',
          catatan: `Otomatis dari Riwayat Setoran: Guru membimbing ${val.count} setoran santri${singleHalaqahNama ? ` (${singleHalaqahNama})` : ''}`,
          setoranCount: val.count,
          isAutoDetected: true,
          halaqahId: singleHalaqahId,
          halaqahNama: singleHalaqahNama,
          halaqahIds: hIds,
          halaqahNamas: hNamas
        });
      }
    });

    // Add remaining manual records that had NO student setorans on that date (e.g. Sakit, Izin, Alpha or Manual Hadir)
    manualMap.forEach((manualRecord, key) => {
      let gNama = manualRecord.guruNama;
      let gId = manualRecord.guruId;
      if (!gNama && gId) {
        const found = (gurus || []).find(g => g.id === gId);
        if (found) gNama = found.namaLengkap;
      }
      if (!gNama || gNama.toLowerCase() === 'guru') {
        return;
      }
      combined.push({
        id: manualRecord.id || `manual-${manualRecord.tanggal}-${gId || gNama || key}`,
        guruId: gId || '',
        guruNama: gNama,
        tanggal: manualRecord.tanggal,
        status: manualRecord.status || 'Sakit',
        catatan: manualRecord.catatan || '',
        setoranCount: 0,
        isAutoDetected: false,
        halaqahId: manualRecord.halaqahId || '',
        halaqahNama: manualRecord.halaqahNama || '',
        halaqahIds: manualRecord.halaqahId ? [manualRecord.halaqahId] : [],
        halaqahNamas: manualRecord.halaqahNama ? [manualRecord.halaqahNama] : [],
        updatedByAdminNama: manualRecord.updatedByAdminNama,
        updatedAt: manualRecord.updatedAt
      });
    });

    // Sort by date descending
    return combined.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [setorans, guruAttendance, gurus, siswas, halaqahs]);

  // Memoized alert for teachers who have a schedule today but 0 student setorans logged today (scoped per halaqah/sesi)
  const scheduledGuruWithoutActivity = useMemo(() => {
    const now = new Date();
    const todayDateIso = now.toISOString().slice(0, 10);
    const localDateIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const daysMap = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayName = daysMap[now.getDay()];

    // Active schedules for today's weekday
    const todaySchedules = (guruSchedules || []).filter(
      s => s.status === StatusAktif.AKTIF && s.hari === todayDayName
    );

    const inactiveList: Array<{
      scheduleId: string;
      guruId: string;
      guruNama: string;
      halaqahId?: string;
      halaqahNama?: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      materi?: string;
      setoranCount: number;
      existingAttendanceStatus?: string;
      existingCatatan?: string;
    }> = [];

    todaySchedules.forEach(sch => {
      const schHalaqah = (halaqahs || []).find(h =>
        (sch.halaqahId && h.id === sch.halaqahId) ||
        (sch.halaqahNama && h.namaHalaqah && normalizeHalaqahKey(sch.halaqahNama) === normalizeHalaqahKey(h.namaHalaqah))
      );
      const schHalaqahId = schHalaqah?.id || sch.halaqahId || '';
      const schHalaqahNama = schHalaqah?.namaHalaqah || sch.halaqahNama || '';
      const schHalKey = normalizeHalaqahKey(schHalaqahNama);

      // Check if there are setorans for this guru (and specifically this halaqah if schedule specifies one) on today's date
      const setoransToday = (setorans || []).filter(set => {
        if (isPrivateSetoranItem(set)) return false;
        if (set.tanggalSetoran !== todayDateIso && set.tanggalSetoran !== localDateIso) return false;
        const matchGuru = (set.guruId && sch.guruId && set.guruId === sch.guruId) ||
          (set.guruNama && sch.guruNama && normalizeTeacherName(set.guruNama) === normalizeTeacherName(sch.guruNama));
        if (!matchGuru) return false;

        if (schHalaqahId || schHalKey) {
          const st = (siswas || []).find(s => s.id === set.siswaId);
          const setHId = set.halaqahId || st?.halaqahId || '';
          const setHKey = normalizeHalaqahKey(set.halaqahNama || '');
          const matchHId = Boolean(schHalaqahId && setHId && setHId === schHalaqahId);
          const matchHKey = Boolean(schHalKey && setHKey && setHKey === schHalKey);
          return matchHId || matchHKey;
        }
        return true;
      });

      const setoranCount = setoransToday.length;

      // Check if admin already manually set attendance record for today for this guru & halaqah
      const manualRecord = findMatchingGuruAttendanceRecord(
        guruAttendance,
        [localDateIso, todayDateIso],
        {
          teacherId: sch.guruId,
          teacherName: sch.guruNama,
          halaqahId: schHalaqahId,
          halaqahName: schHalaqahNama
        }
      );

      if (setoranCount === 0) {
        inactiveList.push({
          scheduleId: sch.id,
          guruId: sch.guruId,
          guruNama: sch.guruNama,
          halaqahId: schHalaqahId,
          halaqahNama: schHalaqahNama,
          hari: sch.hari,
          jamMulai: sch.jamMulai,
          jamSelesai: sch.jamSelesai,
          materi: sch.materi,
          setoranCount,
          existingAttendanceStatus: manualRecord ? manualRecord.status : undefined,
          existingCatatan: manualRecord ? manualRecord.catatan : undefined
        });
      }
    });

    return {
      todayDayName,
      todayDateIso: localDateIso || todayDateIso,
      inactiveList
    };
  }, [guruSchedules, setorans, guruAttendance, halaqahs, siswas]);

  // Handler Save Presensi Guru
  const handleSaveGuruAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGuruId || !inputTanggal || !inputStatus) {
      alert('Mohon lengkapi data Guru, Tanggal, dan Status Kehadiran.');
      return;
    }

    const teacherHalaqahs = getNonPrivateHalaqahsForGuru(inputGuruId);
    if (teacherHalaqahs.length > 1 && !inputHalaqahId) {
      alert('Guru ini membimbing lebih dari 1 halaqah. Mohon pilih Halaqah terdampak (atau pilih "Semua Halaqah" jika berhalangan seharian penuh).');
      return;
    }

    const selectedGuru = (gurus || []).find(g => g.id === inputGuruId);
    const guruNama = selectedGuru ? selectedGuru.namaLengkap : 'Guru';

    const isAllHalaqahSelected = !inputHalaqahId || inputHalaqahId === 'ALL';
    const selectedHalaqah = !isAllHalaqahSelected
      ? (halaqahs || []).find(h => h.id === inputHalaqahId)
      : (teacherHalaqahs.length === 1 ? teacherHalaqahs[0] : null);
    const resolvedHalaqahId = selectedHalaqah?.id || '';
    const resolvedHalaqahNama = selectedHalaqah?.namaHalaqah || '';

    let updatedList = [...(guruAttendance || [])];
    const existingIndex = updatedList.findIndex(item =>
      (editingPresensiId && item.id === editingPresensiId) ||
      (item.guruId === inputGuruId && item.tanggal === inputTanggal && ((item.halaqahId || '') === resolvedHalaqahId))
    );

    const recordPayload: PresensiGuruRecord = {
      id: editingPresensiId || `att-guru-${Date.now()}${resolvedHalaqahId ? `-${resolvedHalaqahId}` : ''}`,
      guruId: inputGuruId,
      guruNama,
      halaqahId: resolvedHalaqahId,
      halaqahNama: resolvedHalaqahNama,
      tanggal: inputTanggal,
      status: inputStatus,
      catatan: inputCatatan,
      updatedByAdminNama: user?.namaLengkap || 'Admin',
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      updatedList[existingIndex] = recordPayload;
    } else {
      updatedList.unshift(recordPayload);
    }

    await saveGuruAttendance(updatedList);
    addLog(
      'Presensi Guru',
      `Memperbarui presensi guru ${guruNama}${resolvedHalaqahNama ? ` (${resolvedHalaqahNama})` : ' (Semua Halaqah)'} status ${inputStatus} pada ${inputTanggal}`
    );

    setIsPresensiModalOpen(false);
    setEditingPresensiId(null);
    setInputHalaqahId('');
    setInputCatatan('');
    alert(
      `Presensi guru ${guruNama}${resolvedHalaqahNama ? ` untuk halaqah ${resolvedHalaqahNama}` : ''} berhasil disimpan dengan status "${inputStatus}".`
    );
  };

  const handleDeleteGuruAttendanceOverride = (
    recordId: string,
    guruId: string,
    guruNama: string,
    tanggal: string,
    halaqahId?: string,
    halaqahNama?: string
  ) => {
    const matchedGuru = (gurus || []).find(g => (guruId && g.id === guruId) || (guruNama && g.namaLengkap.toLowerCase() === guruNama.toLowerCase()));
    const displayNama = guruNama || matchedGuru?.namaLengkap || 'Guru';
    setConfirmDeleteAttendanceModal({
      recordId,
      guruId,
      guruNama: displayNama,
      tanggal,
      halaqahId: halaqahId || '',
      halaqahNama: halaqahNama || ''
    });
  };

  const executeDeleteGuruAttendanceOverride = async () => {
    if (!confirmDeleteAttendanceModal) return;
    const { recordId, guruId, guruNama, tanggal, halaqahId, halaqahNama } = confirmDeleteAttendanceModal;
    setConfirmDeleteAttendanceModal(null);

    const matchedGuru = (gurus || []).find(g => (guruId && g.id === guruId) || (guruNama && g.namaLengkap.toLowerCase() === guruNama.toLowerCase()));
    const displayNama = guruNama || matchedGuru?.namaLengkap || 'Guru';
    const targetHalaqahId = (halaqahId || '').trim();

    const updatedList = (guruAttendance || []).filter(item => {
      // 1. Exact ID match if ID exists
      if (recordId && item.id && item.id === recordId) {
        return false;
      }

      // 2. Date, teacher, and halaqah scope match
      if (item.tanggal === tanggal) {
        const itemHalaqahId = (item.halaqahId || '').trim();
        // Jangan hapus catatan presensi milik halaqah lain di tanggal yang sama
        if (targetHalaqahId && itemHalaqahId && targetHalaqahId !== itemHalaqahId) {
          return true;
        }
        if (targetHalaqahId !== itemHalaqahId) {
          return true;
        }

        const itemGuruId = item.guruId;
        const itemGuruNama = item.guruNama ? item.guruNama.trim().toLowerCase() : '';
        const targetGuruNama = guruNama ? guruNama.trim().toLowerCase() : '';
        const targetGuruId = guruId || matchedGuru?.id;

        const sameId = Boolean(targetGuruId && itemGuruId && targetGuruId === itemGuruId);
        const sameName = Boolean(targetGuruNama && itemGuruNama && targetGuruNama === itemGuruNama);
        const matchedViaGuruList = Boolean(matchedGuru && (
          (itemGuruId && itemGuruId === matchedGuru.id) ||
          (itemGuruNama && itemGuruNama === matchedGuru.namaLengkap.trim().toLowerCase())
        ));

        if (sameId || sameName || matchedViaGuruList) {
          return false;
        }

        if (!targetGuruId && !targetGuruNama && !itemGuruId && !itemGuruNama) {
          return false;
        }
      }

      return true;
    });

    await saveGuruAttendance(updatedList);
    try {
      localStorage.setItem('mh_guru_attendance', JSON.stringify(updatedList));
    } catch (err) {
      console.error(err);
    }
    addLog('Presensi Guru', `Menghapus presensi manual guru ${displayNama}${halaqahNama ? ` (${halaqahNama})` : ''} pada ${tanggal}`);
  };

  // Handler Save Schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schGuruId || !schHari || !schJamMulai || !schJamSelesai) {
      alert('Mohon isi nama Guru, Hari, dan Jam Mengajar.');
      return;
    }

    const selectedGuru = (gurus || []).find(g => g.id === schGuruId);
    const guruNama = selectedGuru ? selectedGuru.namaLengkap : 'Guru';
    const selectedHalaqah = (halaqahs || []).find(h => h.id === schHalaqahId);

    let updatedList = [...(guruSchedules || [])];

    const payload: JadwalMengajarGuru = {
      id: editingScheduleId || `sch-${Date.now()}`,
      guruId: schGuruId,
      guruNama,
      hari: schHari,
      jamMulai: schJamMulai,
      jamSelesai: schJamSelesai,
      halaqahId: schHalaqahId,
      halaqahNama: selectedHalaqah?.namaHalaqah || '',
      materi: schMateri,
      status: schStatus,
      catatan: schCatatan
    };

    if (editingScheduleId) {
      const idx = updatedList.findIndex(s => s.id === editingScheduleId);
      if (idx >= 0) updatedList[idx] = payload;
    } else {
      updatedList.push(payload);
    }

    await saveGuruSchedules(updatedList);
    addLog('Jadwal Mengajar Guru', `Menyimpan jadwal mengajar guru ${guruNama} hari ${schHari} (${schJamMulai} - ${schJamSelesai})`);

    // Sinkronkan hariKegiatan pada halaqah terkait
    if (schHalaqahId && updateHalaqah) {
      const activeForHalaqah = updatedList.filter(s => s.halaqahId === schHalaqahId && s.status === StatusAktif.AKTIF);
      const DAY_ORDER: Record<string, number> = {
        'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Ahad': 7
      };
      const uniqueDays = Array.from(new Set(activeForHalaqah.map(s => s.hari)));
      uniqueDays.sort((a, b) => (DAY_ORDER[a] || 99) - (DAY_ORDER[b] || 99));
      if (uniqueDays.length > 0) {
        updateHalaqah(schHalaqahId, { hariKegiatan: uniqueDays.join(', ') });
      }
    }

    setIsScheduleModalOpen(false);
    setEditingScheduleId(null);
    setSchMateri('');
    setSchCatatan('');
    alert(`Jadwal mengajar untuk ${guruNama} hari ${schHari} berhasil disimpan.`);
  };

  const handleDeleteSchedule = (id: string, guruNama: string, hari: string) => {
    setConfirmDeleteScheduleModal({ id, guruNama, hari });
  };

  const executeDeleteSchedule = async () => {
    if (!confirmDeleteScheduleModal) return;
    const { id, guruNama, hari } = confirmDeleteScheduleModal;
    const targetSchedule = (guruSchedules || []).find(s => s.id === id);
    setConfirmDeleteScheduleModal(null);
    const updatedList = (guruSchedules || []).filter(s => s.id !== id);
    await saveGuruSchedules(updatedList);
    addLog('Jadwal Mengajar Guru', `Menghapus jadwal mengajar ${guruNama} hari ${hari}`);

    if (targetSchedule?.halaqahId && updateHalaqah) {
      const activeForHalaqah = updatedList.filter(s => s.halaqahId === targetSchedule.halaqahId && s.status === StatusAktif.AKTIF);
      const DAY_ORDER: Record<string, number> = {
        'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Ahad': 7
      };
      const uniqueDays = Array.from(new Set(activeForHalaqah.map(s => s.hari)));
      uniqueDays.sort((a, b) => (DAY_ORDER[a] || 99) - (DAY_ORDER[b] || 99));
      updateHalaqah(targetSchedule.halaqahId, { hariKegiatan: uniqueDays.join(', ') || 'Belum diatur' });
    }
  };

  // Input states for managing custom jenis list
  const [newJenisInputs, setNewJenisInputs] = useState<{[key: string]: string}>({
    tilawah: '',
    tahfidz: '',
    qiroah: ''
  });

  // Element custom management modal/form states
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterFormBaseScore, setMasterFormBaseScore] = useState<number | ''>(100);
  const [masterFormStandarBarisQuran, setMasterFormStandarBarisQuran] = useState<number | ''>(15);
  const [masterFormMinBarisQuran, setMasterFormMinBarisQuran] = useState<number | ''>(5);
  const [masterFormMaxBarisQuran, setMasterFormMaxBarisQuran] = useState<number | ''>(15);
  const [masterFormBobotLahnJaliy, setMasterFormBobotLahnJaliy] = useState<number | ''>(4);
  const [masterFormBobotLahnKhafiy, setMasterFormBobotLahnKhafiy] = useState<number | ''>(2);
  const [masterFormBobotKlasifikasi, setMasterFormBobotKlasifikasi] = useState<Record<string, number | ''>>({});
  const [masterFormDefaultBarisNonQuran, setMasterFormDefaultBarisNonQuran] = useState<number | ''>(6);
  const [masterFormDeductions, setMasterFormDeductions] = useState<Record<string, number | ''>>({});
  const [masterFormOnceCategories, setMasterFormOnceCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isMasterModalOpen) {
      setMasterFormBaseScore(masterPenalties?.baseScore ?? 100);
      setMasterFormStandarBarisQuran(masterPenalties?.standarBarisQuran ?? 15);
      setMasterFormMinBarisQuran(masterPenalties?.minBarisQuran ?? 5);
      setMasterFormMaxBarisQuran(masterPenalties?.maxBarisQuran ?? 15);
      const jaliyWeight = masterPenalties?.bobotLahnJaliy ?? 4;
      const khafiyWeight = masterPenalties?.bobotLahnKhafiy ?? 2;
      setMasterFormBobotLahnJaliy(jaliyWeight);
      setMasterFormBobotLahnKhafiy(khafiyWeight);

      // Inisialisasi bobot dinamis untuk setiap tipe klasifikasi kesalahan yang aktif
      const initialBobot: Record<string, number | ''> = {};
      (klasifikasiKesalahanTypes || []).forEach(t => {
        if (masterPenalties?.bobotKlasifikasi && masterPenalties.bobotKlasifikasi[t.id] !== undefined) {
          initialBobot[t.id] = masterPenalties.bobotKlasifikasi[t.id];
        } else if (t.id === 'lahn_jaliy') {
          initialBobot[t.id] = jaliyWeight;
        } else if (t.id === 'lahn_khafiy') {
          initialBobot[t.id] = khafiyWeight;
        } else {
          // Default untuk tipe baru/tambahan (misalnya Kelancaran)
          initialBobot[t.id] = 2;
        }
      });
      setMasterFormBobotKlasifikasi(initialBobot);

      setMasterFormDefaultBarisNonQuran(masterPenalties?.defaultBarisNonQuran ?? 6);
      setMasterFormDeductions(masterPenalties?.rubrikDeductions ?? {});
      setMasterFormOnceCategories(
        masterPenalties?.oncePerSessionCategories ?? [
          'makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar'
        ]
      );
    }
  }, [isMasterModalOpen, masterPenalties, klasifikasiKesalahanTypes]);

  const isMasterCategoryOnce = (catId: string, catNama: string): boolean => {
    const normId = catId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normNama = catNama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return (masterFormOnceCategories || []).some(c => {
      const norm = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm === normId || norm === normNama;
    });
  };

  const toggleMasterCategoryOnce = (catId: string, catNama: string) => {
    const isCurrentlyOnce = isMasterCategoryOnce(catId, catNama);
    const normId = catId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normNama = catNama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (isCurrentlyOnce) {
      setMasterFormOnceCategories(prev =>
        (prev || []).filter(c => {
          const norm = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          return norm !== normId && norm !== normNama;
        })
      );
    } else {
      setMasterFormOnceCategories(prev => [...(prev || []), catId, catNama]);
    }
  };

  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDeductions: Record<string, number> = {};
    Object.entries(masterFormDeductions).forEach(([key, val]) => {
      cleanDeductions[key] = val === '' || val === undefined || val === null ? 0 : Number(val);
    });

    const cleanBobotKlasifikasi: Record<string, number> = {};
    (klasifikasiKesalahanTypes || []).forEach(t => {
      const val = masterFormBobotKlasifikasi[t.id];
      cleanBobotKlasifikasi[t.id] = (val === '' || val === undefined || val === null) ? (t.id === 'lahn_jaliy' ? 4 : 2) : Number(val);
    });

    const resolvedBobotJaliy = cleanBobotKlasifikasi['lahn_jaliy'] !== undefined
      ? cleanBobotKlasifikasi['lahn_jaliy']
      : (masterFormBobotLahnJaliy === '' ? 4 : Number(masterFormBobotLahnJaliy));

    const resolvedBobotKhafiy = cleanBobotKlasifikasi['lahn_khafiy'] !== undefined
      ? cleanBobotKlasifikasi['lahn_khafiy']
      : (masterFormBobotLahnKhafiy === '' ? 2 : Number(masterFormBobotLahnKhafiy));

    const updated = {
      baseScore: masterFormBaseScore === '' ? 100 : Number(masterFormBaseScore),
      standarBarisQuran: masterFormStandarBarisQuran === '' ? 15 : Number(masterFormStandarBarisQuran),
      minBarisQuran: masterFormMinBarisQuran === '' ? 5 : Number(masterFormMinBarisQuran),
      maxBarisQuran: masterFormMaxBarisQuran === '' ? 15 : Number(masterFormMaxBarisQuran),
      bobotLahnJaliy: resolvedBobotJaliy,
      bobotLahnKhafiy: resolvedBobotKhafiy,
      bobotKlasifikasi: cleanBobotKlasifikasi,
      defaultBarisNonQuran: masterFormDefaultBarisNonQuran === '' ? 6 : Number(masterFormDefaultBarisNonQuran),
      minBarisNonQuranRatio: 0.5,
      rubrikDeductions: cleanDeductions,
      oncePerSessionCategories: masterFormOnceCategories
    };
    setMasterPenalties(updated);
    if (saveMasterPenalties) {
      saveMasterPenalties(updated);
    }
    setIsMasterModalOpen(false);
  };

  // Element custom management modal/form states
  const [isElemModalOpen, setIsElemModalOpen] = useState(false);
  const [editingElemId, setEditingElemId] = useState<string | null>(null);
  const [elemFormNama, setElemFormNama] = useState('');
  const [elemFormTipeModul, setElemFormTipeModul] = useState<TipeModul>(TipeModul.AL_QURAN);
  const [elemFormCategories, setElemFormCategories] = useState('');
  const [elemFormKompetensi, setElemFormKompetensi] = useState('');
  const [elemFormReferensiModulId, setElemFormReferensiModulId] = useState('');
  const [elemFormUseJumlahBaris, setElemFormUseJumlahBaris] = useState(false);
  const [elemFormTipeKesalahan, setElemFormTipeKesalahan] = useState<'lahn_jaliy' | 'lahn_khafiy' | 'tajwid' | 'dasar' | 'all' | 'none' | 'page_based'>('all');
  const [elemFormUsePageRules, setElemFormUsePageRules] = useState(false);
  const [elemFormPageRules, setElemFormPageRules] = useState<KategoriKesalahanPageRule[]>([]);
  const [elemFormUseRubrikPenilaian, setElemFormUseRubrikPenilaian] = useState(false);
  const [elemFormUseMasterPenalties, setElemFormUseMasterPenalties] = useState(true);

  const [elemFormBaseScore, setElemFormBaseScore] = useState<number | ''>(100);
  const [elemFormRumusPenilaian, setElemFormRumusPenilaian] = useState<'absolut' | 'proporsional_baris'>('absolut');
  const [elemFormRubrikDeductions, setElemFormRubrikDeductions] = useState<Record<string, number | ''>>({});
  const [elemFormRubrikPredikat, setElemFormRubrikPredikat] = useState<Array<{ minScore: number | ''; maxScore: number | ''; predikat: string; lulus: boolean }>>([
    { minScore: 95, maxScore: 100, predikat: 'Mumtaz', lulus: true },
    { minScore: 85, maxScore: 94, predikat: 'Jayyid Jiddan', lulus: true },
    { minScore: 75, maxScore: 84, predikat: 'Jayyid', lulus: true },
    { minScore: 60, maxScore: 74, predikat: 'Maqbul', lulus: true },
    { minScore: 0, maxScore: 59, predikat: 'Murojaah / Rasib', lulus: false },
  ]);
  const [elemFormTargetScope, setElemFormTargetScope] = useState<ElemenTargetScope>('all');
  const [elemFormTargetHalaqahIds, setElemFormTargetHalaqahIds] = useState<string[]>([]);
  const [elemFormOnceCategories, setElemFormOnceCategories] = useState<string[]>([
    'makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar'
  ]);
  const [elemScopeFilter, setElemScopeFilter] = useState<'all' | 'foundation' | 'private'>('all');

  // Perjenjangan & Prasyarat States for Elemen Pembelajaran
  const [elemFormIsBerjenjang, setElemFormIsBerjenjang] = useState<boolean>(false);
  const [elemFormJenjangLevel, setElemFormJenjangLevel] = useState<number | ''>(1);
  const [elemFormPrerequisiteElemenIds, setElemFormPrerequisiteElemenIds] = useState<string[]>([]);
  const [elemFormSyaratBuka, setElemFormSyaratBuka] = useState<'tuntas_target' | 'minimal_setoran' | 'manual_guru'>('tuntas_target');
  const [elemFormMinimalSetoranLulus, setElemFormMinimalSetoranLulus] = useState<number | ''>(1);
  const [elemFormAllowTeacherOverride, setElemFormAllowTeacherOverride] = useState<boolean>(true);
  const [elemFormDeskripsiJenjang, setElemFormDeskripsiJenjang] = useState<string>('');

  // Target Tuntas Elemen & Cakupan Modul Pembelajaran States
  const [elemFormTargetDurasiBulan, setElemFormTargetDurasiBulan] = useState<number | ''>(3);
  const [elemFormTargetCakupanMateri, setElemFormTargetCakupanMateri] = useState<'semua' | 'surah_pilihan' | 'juz_range' | 'halaman_range'>('surah_pilihan');
  const [elemFormTargetSurahList, setElemFormTargetSurahList] = useState<number[]>([1, 114, 113, 112, 111, 110, 109, 108]);
  const [elemFormTargetJuzStart, setElemFormTargetJuzStart] = useState<number | ''>(30);
  const [elemFormTargetJuzEnd, setElemFormTargetJuzEnd] = useState<number | ''>(30);
  const [elemFormTargetHalamanStart, setElemFormTargetHalamanStart] = useState<number | ''>(1);
  const [elemFormTargetHalamanEnd, setElemFormTargetHalamanEnd] = useState<number | ''>(30);
  const [elemFormTargetCatatanMateri, setElemFormTargetCatatanMateri] = useState<string>('');
  const [elemSurahSearchTerm, setElemSurahSearchTerm] = useState<string>('');

  // Custom Penalties Override States for Elemen Pembelajaran
  const [elemFormBobotKlasifikasi, setElemFormBobotKlasifikasi] = useState<Record<string, number | ''>>({});
  const [elemFormBobotLahnJaliy, setElemFormBobotLahnJaliy] = useState<number | ''>(4);
  const [elemFormBobotLahnKhafiy, setElemFormBobotLahnKhafiy] = useState<number | ''>(2);
  const [elemFormStandarBarisQuran, setElemFormStandarBarisQuran] = useState<number | ''>(15);
  const [elemFormMinBarisQuran, setElemFormMinBarisQuran] = useState<number | ''>(5);
  const [elemFormMaxBarisQuran, setElemFormMaxBarisQuran] = useState<number | ''>(15);

  const isElemCategoryOnce = (catId: string, catNama: string) => {
    const cleanId = catId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNama = catNama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return elemFormOnceCategories.some(c => {
      const cleanC = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanC === cleanId || cleanC === cleanNama;
    });
  };

  const toggleElemCategoryOnce = (catId: string, catNama: string) => {
    const isCurrentlyOnce = isElemCategoryOnce(catId, catNama);
    const cleanId = catId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNama = catNama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (isCurrentlyOnce) {
      setElemFormOnceCategories(prev => prev.filter(c => {
        const cleanC = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanC !== cleanId && cleanC !== cleanNama;
      }));
    } else {
      setElemFormOnceCategories(prev => [...prev, catId, catNama]);
    }
  };

  const [selectedPelajaranId, setSelectedPelajaranId] = useState('');
  const [confirmDeleteElem, setConfirmDeleteElem] = useState<{ id: string; nama: string } | null>(null);
  const [confirmDeleteScheduleModal, setConfirmDeleteScheduleModal] = useState<{ id: string; guruNama: string; hari: string } | null>(null);
  const [confirmDeleteAttendanceModal, setConfirmDeleteAttendanceModal] = useState<{ recordId: string; guruId: string; guruNama: string; tanggal: string; halaqahId?: string; halaqahNama?: string } | null>(null);
  const [confirmDeleteSubcatModal, setConfirmDeleteSubcatModal] = useState<{ idx: number; nama: string } | null>(null);

  // Tajwid Categories states
  const [activeTajwidEditId, setActiveTajwidEditId] = useState<string | null>(null);
  const [tajwidFormNama, setTajwidFormNama] = useState('');
  const [tajwidFormDeskripsi, setTajwidFormDeskripsi] = useState('');
  const [tajwidFormTipe, setTajwidFormTipe] = useState<string>(() => klasifikasiKesalahanTypes[0]?.id || 'lahn_jaliy');
  const [selectedCategoryTypeFilter, setSelectedCategoryTypeFilter] = useState<string>('all');
  const [tajwidSubcategories, setTajwidSubcategories] = useState<TajwidSubcategory[]>([]);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');
  const [editingSubcategoryIdx, setEditingSubcategoryIdx] = useState<number | null>(null);
  const [editingSubcategoryInput, setEditingSubcategoryInput] = useState('');
  const [confirmDeleteTajwid, setConfirmDeleteTajwid] = useState<{ id: string; nama: string } | null>(null);
  const tajwidFormNamaInputRef = useRef<HTMLInputElement | null>(null);

  // Sync form type with active filter tab so new categories always inherit the viewed classification
  useEffect(() => {
    if (selectedCategoryTypeFilter !== 'all' && !activeTajwidEditId) {
      setTajwidFormTipe(selectedCategoryTypeFilter);
    }
  }, [selectedCategoryTypeFilter, activeTajwidEditId]);

  // Manajemen Tipe Klasifikasi Kesalahan states
  const [isManageKlasifikasiModalOpen, setIsManageKlasifikasiModalOpen] = useState(false);
  const [editingKlasifikasiId, setEditingKlasifikasiId] = useState<string | null>(null);
  const [klasifikasiFormNama, setKlasifikasiFormNama] = useState('');
  const [klasifikasiFormLabelSingkat, setKlasifikasiFormLabelSingkat] = useState('');
  const [klasifikasiFormDeskripsi, setKlasifikasiFormDeskripsi] = useState('');
  const [confirmDeleteKlasifikasi, setConfirmDeleteKlasifikasi] = useState<{ id: string; nama: string; affectedCount: number } | null>(null);
  const [confirmResetKlasifikasiModal, setConfirmResetKlasifikasiModal] = useState(false);
  const [klasifikasiSearchQuery, setKlasifikasiSearchQuery] = useState('');

  // Search & Filter state
  const [studentSearch, setStudentSearch] = useState('');
  const [guruFilter, setGuruFilter] = useState('All');
  const [halaqahFilter, setHalaqahFilter] = useState('All');

  // Filtered halaqahs based on selected guru in filter
  const filteredHalaqahsForDropdown = useMemo(() => {
    const baseHalaqahs = (halaqahs || []).filter(h => h.sourceType !== 'private_halaqah');
    if (guruFilter === 'All') {
      return baseHalaqahs;
    }
    const selectedGuru = (gurus || []).find(
      g => g.id === guruFilter || g.namaLengkap.toLowerCase() === guruFilter.toLowerCase()
    );
    return baseHalaqahs.filter(h => {
      const matchId = h.guruPembimbingId === guruFilter || (selectedGuru && h.guruPembimbingId === selectedGuru.id);
      const matchNama = (selectedGuru && h.guruPembimbingNama && h.guruPembimbingNama.trim().toLowerCase() === selectedGuru.namaLengkap.trim().toLowerCase()) ||
                        (h.guruPembimbingNama && h.guruPembimbingNama.trim().toLowerCase() === guruFilter.trim().toLowerCase());
      return matchId || matchNama;
    });
  }, [halaqahs, guruFilter, gurus]);

  const handleGuruFilterChange = (selectedGuruVal: string) => {
    setGuruFilter(selectedGuruVal);
    if (selectedGuruVal !== 'All' && halaqahFilter !== 'All') {
      const selectedGuru = (gurus || []).find(
        g => g.id === selectedGuruVal || g.namaLengkap.toLowerCase() === selectedGuruVal.toLowerCase()
      );
      const validHalaqahs = (halaqahs || []).filter(h => {
        if (h.sourceType === 'private_halaqah') return false;
        const matchId = h.guruPembimbingId === selectedGuruVal || (selectedGuru && h.guruPembimbingId === selectedGuru.id);
        const matchNama = (selectedGuru && h.guruPembimbingNama && h.guruPembimbingNama.trim().toLowerCase() === selectedGuru.namaLengkap.trim().toLowerCase()) ||
                          (h.guruPembimbingNama && h.guruPembimbingNama.trim().toLowerCase() === selectedGuruVal.trim().toLowerCase());
        return matchId || matchNama;
      });
      const isStillValid = validHalaqahs.some(h => h.id === halaqahFilter || h.namaHalaqah === halaqahFilter);
      if (!isStillValid) {
        setHalaqahFilter('All');
      }
    }
  };
  
  // Date & Month filter state
  const [filterStartDate, setFilterStartDate] = useState<string>(''); // YYYY-MM-DD
  const [filterEndDate, setFilterEndDate] = useState<string>('');     // YYYY-MM-DD
  const [filterMonth, setFilterMonth] = useState<string>('All');      // 'All', '01', ..., '12', 'Custom'
  const [filterYear, setFilterYear] = useState<string>(() => new Date().getFullYear().toString());

  const handleMonthChange = (monthVal: string, yearVal: string) => {
    setFilterMonth(monthVal);
    setFilterYear(yearVal);
    if (monthVal === 'All') {
      setFilterStartDate('');
      setFilterEndDate('');
    } else {
      const year = parseInt(yearVal) || new Date().getFullYear();
      const month = parseInt(monthVal);
      const lastDay = new Date(year, month, 0).getDate();
      const pad = (n: number) => n.toString().padStart(2, '0');
      setFilterStartDate(`${year}-${pad(month)}-01`);
      setFilterEndDate(`${year}-${pad(month)}-${pad(lastDay)}`);
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilterStartDate(start);
    setFilterEndDate(end);
    setFilterMonth('Custom');
  };
  
  // New Setoran Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [selectedModulId, setSelectedModulId] = useState('');
  const [editingSetoranId, setEditingSetoranId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; namaSiswa: string; materi: string } | null>(null);

  // Dynamic setoran options
  const [selectedElemen, setSelectedElemen] = useState<string>('tahfidz'); // 'tilawah' | 'tahfidz' | 'qiroah'
  const [selectedJenisSub, setSelectedJenisSub] = useState<string>(''); // customized sub type chosen in form

  const [ayatAwal, setAyatAwal] = useState(1);
  const [ayatAkhir, setAyatAkhir] = useState(1);

  // Non-Quran pages
  const [nonQuranHalaman, setNonQuranHalaman] = useState(1);

  // General evaluation
  const [catatanGuru, setCatatanGuru] = useState('');
  const [nilaiGrade, setNilaiGrade] = useState('Mumtaz (A+)');
  const [statusLulus, setStatusLulus] = useState(true);
  const [tanggalSetoran, setTanggalSetoran] = useState(() => new Date().toISOString().split('T')[0]);

  if (!user) return null;

  const isTeacherOrAdmin = user.role === UserRole.ADMIN || user.role === UserRole.GURU;

  // For Student Role: only list their personal logs
  const displayLogs = setorans.filter(s => {
    // Exclude setoran from private halaqah (should only appear under HALAQAH PRIBADI menu)
    if (isPrivateSetoranItem(s)) return false;

    // If Admin/Guru, see everything or see their halaqah. Let's filter depending on role
    if (user.role === UserRole.SISWA) {
      return s.siswaId === user.id;
    } else if (user.role === UserRole.GURU) {
      // Guru only sees setorans of his group
      const myHalaqah = halaqahs.find(h => h.guruPembimbingId === user.id);
      return myHalaqah ? s.halaqahId === myHalaqah.id : true;
    }
    return true; // Admin sees all non-private halaqah setorans
  }).filter(s => {
    const sObj = siswas.find(st => st.id === s.siswaId);
    const searchMatch = (s.siswaNama || '').toLowerCase().includes(studentSearch.toLowerCase()) || 
                        (s.modulNama || '').toLowerCase().includes(studentSearch.toLowerCase()) || 
                        (s.siswaNis || '').includes(studentSearch) ||
                        (s.guruNama || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                        (s.halaqahNama || '').toLowerCase().includes(studentSearch.toLowerCase());

    const matchGuru = guruFilter === 'All' || s.guruId === guruFilter || (s.guruNama || '').toLowerCase() === guruFilter.toLowerCase();
    const matchHalaqah = halaqahFilter === 'All' || s.halaqahId === halaqahFilter || (s.halaqahNama || '').toLowerCase() === halaqahFilter.toLowerCase();

    // Filter Rentang Tanggal
    const matchStartDate = !filterStartDate || (s.tanggalSetoran && s.tanggalSetoran >= filterStartDate);
    const matchEndDate = !filterEndDate || (s.tanggalSetoran && s.tanggalSetoran <= filterEndDate);

    return searchMatch && matchGuru && matchHalaqah && matchStartDate && matchEndDate;
  }).sort((a, b) => {
    if (a.tanggalSetoran !== b.tanggalSetoran) {
      return b.tanggalSetoran.localeCompare(a.tanggalSetoran);
    }
    const tsA = parseInt(a.id.replace('set-', '')) || 0;
    const tsB = parseInt(b.id.replace('set-', '')) || 0;
    return tsB - tsA;
  });

  // Calculate Student list options for the assessment form
  // If assessor is a Guru, only let him select students in his coaching circle!
  const myHalaqahObj = user.role === UserRole.GURU ? halaqahs.find(h => h.guruPembimbingId === user.id) : null;
  const assessmentStudents = siswas.filter(s => {
    // Exclude students belonging to private halaqah from foundation assessment
    if (isPrivateSiswa(s, halaqahs)) return false;

    if (user.role === UserRole.GURU && myHalaqahObj) {
      return s.halaqahId === myHalaqahObj.id && s.status === StatusAktif.AKTIF;
    }
    return s.status === StatusAktif.AKTIF; // Admin sees all active non-private students
  });

  // Load selected modul schema for live verse bounds
  const activeModulObj = moduls.find(m => m.id === selectedModulId);
  const maxAyat = activeModulObj?.jumlahAyat || 1;

  const activeElemObj = elemenSettings?.find(el => el.id === selectedElemen);
  const getNilaiPredikatLabel = () => {
    if (activeElemObj) {
      if (activeElemObj.kompetensi) {
        return `NILAI / PREDIKAT ${activeElemObj.kompetensi.toUpperCase()}`;
      }
      const nameLower = activeElemObj.nama.toLowerCase();
      if (nameLower.includes('tahfidz') || nameLower.includes('tahfizh')) {
        return 'NILAI / PREDIKAT HAFALAN';
      }
      if (nameLower.includes('qiroah') || nameLower.includes('tilawah') || nameLower.includes('baca')) {
        return 'NILAI / PREDIKAT BACAAN';
      }
    }
    return 'NILAI / PREDIKAT HAFALAN';
  };

  const handleOpenEditSetoran = (setoran: Setoran) => {
    setEditingSetoranId(setoran.id);
    setSelectedSiswaId(setoran.siswaId);
    setSelectedModulId(setoran.modulId);
    
    // Choose selectedElemen based on saving structure
    const matchedElem = elemenSettings?.find(e => {
      return e.id === setoran.jenisSetoran?.toLowerCase() || e.nama === setoran.jenisSetoran || e.nama.toLowerCase() === setoran.jenisSetoran?.toLowerCase();
    });
    
    const elem = matchedElem ? matchedElem.id : (setoran.tipeModul === TipeModul.AL_QURAN ? 'tahfidz' : 'qiroah');
    
    setSelectedElemen(elem);
    setSelectedJenisSub(setoran.tipeTahfidz || '');
    setAyatAwal(setoran.ayatAwal || 1);
    setAyatAkhir(setoran.ayatAkhir || 1);
    setNonQuranHalaman(setoran.halaman || 1);
    setCatatanGuru(setoran.catatanGuru);
    setNilaiGrade(setoran.nilai);
    setStatusLulus(setoran.statusLulus);
    setTanggalSetoran(setoran.tanggalSetoran);
    setIsFormOpen(true);
  };

  // Form handle
  const handleOpenForm = () => {
    if (assessmentStudents.length === 0) {
      alert('Tidak ada siswa aktif terdaftar di bimbingan untuk diuji.');
      return;
    }
    const firstSiswa = assessmentStudents[0]?.id || '';
    const firstModul = moduls[0];

    setSelectedSiswaId(firstSiswa);
    setSelectedModulId(firstModul?.id || '');

    // Set dynamic default elements
    if (firstModul) {
      if (firstModul.tipe === TipeModul.AL_QURAN) {
        setSelectedElemen('tahfidz');
        const elemDef = elemenSettings?.find(e => e.id === 'tahfidz');
        setSelectedJenisSub(elemDef?.jenisSetoranList[0] || '');
      } else {
        setSelectedElemen('qiroah');
        const elemDef = elemenSettings?.find(e => e.id === 'qiroah');
        setSelectedJenisSub(elemDef?.jenisSetoranList[0] || '');
      }
    }
    setCatatanGuru('Lancar, makharijul huruf tepat.');
    setNilaiGrade('Mumtaz (A+)');
    setStatusLulus(true);
    setAyatAwal(1);
    setAyatAkhir(1);
    setNonQuranHalaman(1);
    setEditingSetoranId(null);
    setIsFormOpen(true);
  };

  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswaId || !selectedModulId) return;

    const studentObj = siswas.find(s => s.id === selectedSiswaId);
    const modulObj = moduls.find(m => m.id === selectedModulId);

    if (!studentObj || !modulObj) return;

    // Map selectedElemen string dynamically from configured settings
    const activeElemObj = elemenSettings?.find(el => el.id === selectedElemen);
    const jSetorName = activeElemObj ? activeElemObj.nama : 'Setoran';

    const payload = {
      siswaId: selectedSiswaId,
      siswaNama: studentObj.namaLengkap,
      siswaNis: studentObj.nis,
      halaqahId: studentObj.halaqahId,
      halaqahNama: studentObj.halaqahNama,
      modulId: selectedModulId,
      modulNama: modulObj.namaSurat || modulObj.judulModul || 'Modul',
      tipeModul: modulObj.tipe,
      
      // Dynamic mapping from configured settings
      jenisSetoran: jSetorName,
      tipeTahfidz: selectedJenisSub || undefined,
      suratNama: modulObj.tipe === TipeModul.AL_QURAN ? modulObj.namaSurat : undefined,
      ayatAwal: modulObj.tipe === TipeModul.AL_QURAN ? ayatAwal : undefined,
      ayatAkhir: modulObj.tipe === TipeModul.AL_QURAN ? ayatAkhir : undefined,

      // Non quran fields
      halaman: modulObj.tipe === TipeModul.NON_AL_QURAN ? nonQuranHalaman : undefined,

      catatanGuru,
      nilai: nilaiGrade,
      statusLulus,
      tanggalSetoran
    };

    if (editingSetoranId) {
      updateSetoran(editingSetoranId, payload);
    } else {
      createSetoran(payload);
    }

    setIsFormOpen(false);
    setEditingSetoranId(null);
  };

  const handleOpenElemModal = (elem?: any) => {
    if (elem) {
      setEditingElemId(elem.id);
      setElemFormNama(elem.nama);
      setElemFormTipeModul(elem.tipeModul);
      setElemFormCategories(elem.jenisSetoranList.join(', '));
      setElemFormKompetensi(elem.kompetensi || '');
      setElemFormReferensiModulId(elem.referensiModulId || '');
      setElemFormUseJumlahBaris(!!elem.useJumlahBaris);
      setElemFormTipeKesalahan(elem.tipeKesalahan || 'all');
      setElemFormUsePageRules(!!elem.usePageRules || elem.tipeKesalahan === 'page_based');
      setElemFormPageRules(elem.pageRules || []);
      setElemFormUseRubrikPenilaian(!!elem.useRubrikPenilaian);
      setElemFormUseMasterPenalties(elem.useMasterPenalties !== undefined ? elem.useMasterPenalties : true);

      // Initialize custom penalties override fields
      const initialBobotKlasifikasi: Record<string, number | ''> = {};
      (klasifikasiKesalahanTypes || []).forEach(t => {
        if (elem.bobotKlasifikasi && elem.bobotKlasifikasi[t.id] !== undefined) {
          initialBobotKlasifikasi[t.id] = elem.bobotKlasifikasi[t.id];
        } else if (t.id === 'lahn_jaliy' && elem.bobotLahnJaliy !== undefined) {
          initialBobotKlasifikasi[t.id] = elem.bobotLahnJaliy;
        } else if (t.id === 'lahn_khafiy' && elem.bobotLahnKhafiy !== undefined) {
          initialBobotKlasifikasi[t.id] = elem.bobotLahnKhafiy;
        } else if (masterPenalties?.bobotKlasifikasi && masterPenalties.bobotKlasifikasi[t.id] !== undefined) {
          initialBobotKlasifikasi[t.id] = masterPenalties.bobotKlasifikasi[t.id];
        } else {
          initialBobotKlasifikasi[t.id] = (t.id === 'lahn_jaliy' ? 4 : 2);
        }
      });
      setElemFormBobotKlasifikasi(initialBobotKlasifikasi);
      setElemFormBobotLahnJaliy(elem.bobotLahnJaliy !== undefined ? elem.bobotLahnJaliy : (masterPenalties?.bobotLahnJaliy ?? 4));
      setElemFormBobotLahnKhafiy(elem.bobotLahnKhafiy !== undefined ? elem.bobotLahnKhafiy : (masterPenalties?.bobotLahnKhafiy ?? 2));
      setElemFormStandarBarisQuran(elem.standarBarisQuran !== undefined ? elem.standarBarisQuran : (masterPenalties?.standarBarisQuran ?? 15));
      setElemFormMinBarisQuran(elem.minBarisQuran !== undefined ? elem.minBarisQuran : (masterPenalties?.minBarisQuran ?? 5));
      setElemFormMaxBarisQuran(elem.maxBarisQuran !== undefined ? elem.maxBarisQuran : (masterPenalties?.maxBarisQuran ?? 15));

      setElemFormBaseScore(elem.baseScore !== undefined ? elem.baseScore : (masterPenalties?.baseScore ?? 100));
      setElemFormRumusPenilaian(elem.rumusPenilaian || 'proporsional_baris');
      setElemFormRubrikDeductions(elem.rubrikDeductions || {});
      setElemFormRubrikPredikat(elem.rubrikPredikat || [
        { minScore: 95, maxScore: 100, predikat: 'Mumtaz', lulus: true },
        { minScore: 85, maxScore: 94, predikat: 'Jayyid Jiddan', lulus: true },
        { minScore: 75, maxScore: 84, predikat: 'Jayyid', lulus: true },
        { minScore: 60, maxScore: 74, predikat: 'Maqbul', lulus: true },
        { minScore: 0, maxScore: 59, predikat: 'Murojaah / Rasib', lulus: false },
      ]);
      setElemFormTargetScope(elem.targetScope || 'all');
      setElemFormTargetHalaqahIds(elem.targetHalaqahIds || []);
      setElemFormOnceCategories(elem.oncePerSessionCategories || (masterPenalties?.oncePerSessionCategories || ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']));
      setElemFormIsBerjenjang(!!elem.isBerjenjang);
      setElemFormJenjangLevel(elem.jenjangLevel !== undefined ? elem.jenjangLevel : 1);
      setElemFormPrerequisiteElemenIds(elem.prerequisiteElemenIds || []);
      setElemFormSyaratBuka(elem.syaratBuka || 'tuntas_target');
      setElemFormMinimalSetoranLulus(elem.minimalSetoranLulus !== undefined ? elem.minimalSetoranLulus : 1);
      setElemFormAllowTeacherOverride(elem.allowTeacherOverride !== undefined ? elem.allowTeacherOverride : true);
      setElemFormDeskripsiJenjang(elem.deskripsiJenjang || '');

      // Target Tuntas & Cakupan Modul
      setElemFormTargetDurasiBulan(elem.targetDurasiBulan !== undefined ? elem.targetDurasiBulan : 3);
      setElemFormTargetCakupanMateri(elem.targetCakupanMateri || (elem.tipeModul === TipeModul.AL_QURAN ? 'surah_pilihan' : 'halaman_range'));
      setElemFormTargetSurahList(elem.targetSurahList || [1, 114, 113, 112, 111, 110, 109, 108]);
      setElemFormTargetJuzStart(elem.targetJuzStart !== undefined ? elem.targetJuzStart : 30);
      setElemFormTargetJuzEnd(elem.targetJuzEnd !== undefined ? elem.targetJuzEnd : 30);
      setElemFormTargetHalamanStart(elem.targetHalamanStart !== undefined ? elem.targetHalamanStart : 1);
      setElemFormTargetHalamanEnd(elem.targetHalamanEnd !== undefined ? elem.targetHalamanEnd : 30);
      setElemFormTargetCatatanMateri(elem.targetCatatanMateri || '');
      setElemSurahSearchTerm('');

      const matchingMapel = mataPelajarans?.find(mp => mp.elemenList.some(se => se.nama === elem.nama));
      if (matchingMapel) {
        setSelectedPelajaranId(matchingMapel.id);
      } else {
        setSelectedPelajaranId('');
      }
    } else {
      setEditingElemId(null);
      setElemFormNama('');
      setElemFormTipeModul(TipeModul.AL_QURAN);
      setElemFormCategories('Baru, Murojaah');
      setElemFormKompetensi('');
      setElemFormReferensiModulId('');
      setElemFormUseJumlahBaris(false);
      setElemFormTipeKesalahan('all');
      setElemFormUsePageRules(false);
      setElemFormPageRules([]);
      setElemFormUseRubrikPenilaian(false);
      setElemFormUseMasterPenalties(true);
      setElemFormOnceCategories(masterPenalties?.oncePerSessionCategories || ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']);

      const defaultBobotKlasifikasi: Record<string, number | ''> = {};
      (klasifikasiKesalahanTypes || []).forEach(t => {
        if (masterPenalties?.bobotKlasifikasi && masterPenalties.bobotKlasifikasi[t.id] !== undefined) {
          defaultBobotKlasifikasi[t.id] = masterPenalties.bobotKlasifikasi[t.id];
        } else {
          defaultBobotKlasifikasi[t.id] = (t.id === 'lahn_jaliy' ? 4 : 2);
        }
      });
      setElemFormBobotKlasifikasi(defaultBobotKlasifikasi);
      setElemFormBobotLahnJaliy(masterPenalties?.bobotLahnJaliy ?? 4);
      setElemFormBobotLahnKhafiy(masterPenalties?.bobotLahnKhafiy ?? 2);
      setElemFormStandarBarisQuran(masterPenalties?.standarBarisQuran ?? 15);
      setElemFormMinBarisQuran(masterPenalties?.minBarisQuran ?? 5);
      setElemFormMaxBarisQuran(masterPenalties?.maxBarisQuran ?? 15);

      setElemFormBaseScore(masterPenalties?.baseScore ?? 100);
      setElemFormRumusPenilaian('proporsional_baris');
      setElemFormRubrikDeductions({});
      setElemFormRubrikPredikat([
        { minScore: 95, maxScore: 100, predikat: 'Mumtaz', lulus: true },
        { minScore: 85, maxScore: 94, predikat: 'Jayyid Jiddan', lulus: true },
        { minScore: 75, maxScore: 84, predikat: 'Jayyid', lulus: true },
        { minScore: 60, maxScore: 74, predikat: 'Maqbul', lulus: true },
        { minScore: 0, maxScore: 59, predikat: 'Murojaah / Rasib', lulus: false },
      ]);
      setElemFormTargetScope('all');
      setElemFormTargetHalaqahIds([]);
      setSelectedPelajaranId('');
      setElemFormIsBerjenjang(false);
      setElemFormJenjangLevel(1);
      setElemFormPrerequisiteElemenIds([]);
      setElemFormSyaratBuka('tuntas_target');
      setElemFormMinimalSetoranLulus(1);
      setElemFormAllowTeacherOverride(true);
      setElemFormDeskripsiJenjang('');

      // Target Tuntas & Cakupan Modul
      setElemFormTargetDurasiBulan(3);
      setElemFormTargetCakupanMateri('surah_pilihan');
      setElemFormTargetSurahList([1, 114, 113, 112, 111, 110, 109, 108]);
      setElemFormTargetJuzStart(30);
      setElemFormTargetJuzEnd(30);
      setElemFormTargetHalamanStart(1);
      setElemFormTargetHalamanEnd(30);
      setElemFormTargetCatatanMateri('');
      setElemSurahSearchTerm('');
    }
    setIsElemModalOpen(true);
  };

  const getCategoryTypeObj = (tipe?: string): KlasifikasiKesalahanType => {
    if (!tipe) return klasifikasiKesalahanTypes[0] || { id: 'lahn_khafiy', nama: 'Lahn Khafiy', labelSingkat: 'Samar / Tajwid' };
    const norm = tipe.trim().toLowerCase();
    const found = klasifikasiKesalahanTypes.find(t => 
      t.id === tipe || 
      t.id.toLowerCase() === norm ||
      t.nama.toLowerCase() === norm ||
      (t.id === 'lahn_jaliy' && (norm === 'dasar' || norm === 'lahn_jaliy')) ||
      (t.id === 'lahn_khafiy' && (norm === 'tajwid' || norm === 'lahn_khafiy'))
    );
    if (found) return found;
    return {
      id: tipe,
      nama: tipe.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      labelSingkat: 'Kustom'
    };
  };

  const isCategoryMatchingType = (catTipe: string | undefined, targetTypeId: string) => {
    if (targetTypeId === 'all') return true;
    const c = (catTipe || 'lahn_khafiy').trim().toLowerCase();
    const t = targetTypeId.trim().toLowerCase();
    if (t === 'lahn_jaliy') return c === 'lahn_jaliy' || c === 'dasar';
    if (t === 'lahn_khafiy') return c === 'lahn_khafiy' || c === 'tajwid';
    
    const targetTypeObj = klasifikasiKesalahanTypes.find(kt => 
      kt.id.toLowerCase() === t || kt.nama.toLowerCase() === t
    );
    if (targetTypeObj) {
      return c === targetTypeObj.id.toLowerCase() || c === targetTypeObj.nama.toLowerCase();
    }
    return c === t;
  };

  // Quick change category type directly from card
  const handleQuickChangeCategoryType = async (cat: TajwidCategory, newTypeId: string) => {
    if (cat.tipe === newTypeId) return;
    await updateTajwidCategory(cat.id, cat.nama, cat.deskripsi, cat.subcategories, newTypeId);
  };

  // State & Handlers for reordering Tajwid Categories (Move Up / Down & Drag-and-Drop)
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);

  const handleMoveCategory = async (cat: TajwidCategory, direction: 'up' | 'down') => {
    const currentFiltered = (tajwidCategories || []).filter(c => isCategoryMatchingType(c.tipe, selectedCategoryTypeFilter));
    const currentIndex = currentFiltered.findIndex(c => c.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentFiltered.length) return;

    const targetCat = currentFiltered[targetIndex];

    const masterList = [...tajwidCategories];
    const masterCurrentIdx = masterList.findIndex(c => c.id === cat.id);
    const masterTargetIdx = masterList.findIndex(c => c.id === targetCat.id);

    if (masterCurrentIdx === -1 || masterTargetIdx === -1) return;

    // Swap / Move item within masterList
    masterList.splice(masterCurrentIdx, 1);
    masterList.splice(masterTargetIdx, 0, cat);

    await reorderTajwidCategories(masterList);
  };

  const handleDropCategoryReorder = async (draggedId: string, targetId: string) => {
    if (!draggedId || !targetId || draggedId === targetId) return;

    const masterList = [...tajwidCategories];
    const draggedIdx = masterList.findIndex(c => c.id === draggedId);
    const targetIdx = masterList.findIndex(c => c.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const [draggedItem] = masterList.splice(draggedIdx, 1);
    masterList.splice(targetIdx, 0, draggedItem);

    await reorderTajwidCategories(masterList);
    setDraggedCategoryId(null);
  };

  // Auto-heal categories that may have been wrongly coerced to lahn_khafiy during previous test
  useEffect(() => {
    if (!tajwidCategories || tajwidCategories.length === 0) return;
    if (!klasifikasiKesalahanTypes || klasifikasiKesalahanTypes.length === 0) return;

    const customTypes = klasifikasiKesalahanTypes.filter(t => t.id !== 'lahn_jaliy' && t.id !== 'lahn_khafiy');
    if (customTypes.length === 0) return;

    customTypes.forEach(customType => {
      const typeKeyword = customType.nama.toLowerCase();
      const candidateCats = tajwidCategories.filter(c => {
        const nameLower = (c.nama || '').toLowerCase();
        if (c.tipe === customType.id) return false;
        const matchesKeyword = nameLower.includes(typeKeyword) || 
          (typeKeyword.includes('lancar') && (nameLower.includes('terbata') || nameLower.includes('lancar')));
        const isCurrentlyLahnKhafiy = c.tipe === 'lahn_khafiy' || !c.tipe;
        return isCurrentlyLahnKhafiy && matchesKeyword;
      });

      if (candidateCats.length > 0) {
        candidateCats.forEach(async (cat) => {
          await updateTajwidCategory(cat.id, cat.nama, cat.deskripsi, cat.subcategories, customType.id);
        });
      }
    });
  }, [klasifikasiKesalahanTypes, tajwidCategories]);

  const getKlasifikasiBadgeClasses = (_warna?: string) => {
    return {
      badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      activeBtn: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
      filterBtn: 'bg-emerald-600 text-white shadow-sm',
      dot: 'bg-emerald-500'
    };
  };

  const handleOpenAddKlasifikasi = () => {
    setEditingKlasifikasiId(null);
    setKlasifikasiFormNama('');
    setKlasifikasiFormLabelSingkat('');
    setKlasifikasiFormDeskripsi('');
  };

  const handleStartEditKlasifikasi = (tipe: KlasifikasiKesalahanType) => {
    setEditingKlasifikasiId(tipe.id);
    setKlasifikasiFormNama(tipe.nama);
    setKlasifikasiFormLabelSingkat(tipe.labelSingkat || '');
    setKlasifikasiFormDeskripsi(tipe.deskripsi || '');
  };

  const handleSaveKlasifikasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!klasifikasiFormNama.trim()) {
      alert('Nama tipe klasifikasi tidak boleh kosong!');
      return;
    }
    if (editingKlasifikasiId) {
      await updateKlasifikasiKesalahanType(editingKlasifikasiId, {
        nama: klasifikasiFormNama.trim(),
        labelSingkat: klasifikasiFormLabelSingkat.trim(),
        deskripsi: klasifikasiFormDeskripsi.trim()
      });
      handleOpenAddKlasifikasi();
    } else {
      const slugId = klasifikasiFormNama.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `tipe_${Date.now()}`;
      const finalId = klasifikasiKesalahanTypes.some(t => t.id === slugId) ? `${slugId}_${Date.now().toString().slice(-4)}` : slugId;
      await createKlasifikasiKesalahanType({
        id: finalId,
        nama: klasifikasiFormNama.trim(),
        labelSingkat: klasifikasiFormLabelSingkat.trim(),
        deskripsi: klasifikasiFormDeskripsi.trim()
      });
      // Switch both form and active filter directly to this new classification type and close modal
      setTajwidFormTipe(finalId);
      setSelectedCategoryTypeFilter(finalId);
      setIsManageKlasifikasiModalOpen(false);
      handleOpenAddKlasifikasi();
      setTimeout(() => {
        tajwidFormNamaInputRef.current?.focus();
      }, 100);
    }
  };

  const handleRequestDeleteKlasifikasi = (tipe: KlasifikasiKesalahanType) => {
    const count = (tajwidCategories || []).filter(c => {
      if (tipe.id === 'lahn_jaliy') return c.tipe === 'lahn_jaliy' || c.tipe === 'dasar';
      if (tipe.id === 'lahn_khafiy') return c.tipe === 'lahn_khafiy' || c.tipe === 'tajwid';
      return c.tipe === tipe.id;
    }).length;
    setConfirmDeleteKlasifikasi({ id: tipe.id, nama: tipe.nama, affectedCount: count });
  };

  const handleConfirmDeleteKlasifikasi = async () => {
    if (!confirmDeleteKlasifikasi) return;
    const { id } = confirmDeleteKlasifikasi;
    const remainingTypes = klasifikasiKesalahanTypes.filter(t => t.id !== id);
    const fallbackTypeId = remainingTypes[0]?.id || 'lahn_khafiy';
    
    const affectedCats = (tajwidCategories || []).filter(c => {
      if (id === 'lahn_jaliy') return c.tipe === 'lahn_jaliy' || c.tipe === 'dasar';
      if (id === 'lahn_khafiy') return c.tipe === 'lahn_khafiy' || c.tipe === 'tajwid';
      return c.tipe === id;
    });

    for (const cat of affectedCats) {
      await updateTajwidCategory(cat.id, cat.nama, cat.deskripsi, cat.subcategories, fallbackTypeId);
    }

    await deleteKlasifikasiKesalahanType(id);
    if (editingKlasifikasiId === id) {
      handleOpenAddKlasifikasi();
    }
    if (tajwidFormTipe === id) {
      setTajwidFormTipe(fallbackTypeId);
    }
    if (selectedCategoryTypeFilter === id) {
      setSelectedCategoryTypeFilter('all');
    }
    setConfirmDeleteKlasifikasi(null);
  };

  const handleSaveTajwidCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tajwidFormNama.trim()) {
      alert('Nama kategori tidak boleh kosong!');
      return;
    }
    // Determine target classification type reliably
    let currentTipe = tajwidFormTipe;
    if (!currentTipe) {
      currentTipe = selectedCategoryTypeFilter !== 'all' ? selectedCategoryTypeFilter : (klasifikasiKesalahanTypes[0]?.id || 'lahn_jaliy');
    }

    if (activeTajwidEditId) {
      updateTajwidCategory(activeTajwidEditId, tajwidFormNama.trim(), tajwidFormDeskripsi.trim(), tajwidSubcategories, currentTipe);
    } else {
      createTajwidCategory(tajwidFormNama.trim(), tajwidFormDeskripsi.trim(), tajwidSubcategories, currentTipe);
    }

    // If viewing a specific classification, ensure filter shows this classification
    if (selectedCategoryTypeFilter !== 'all' && selectedCategoryTypeFilter !== currentTipe) {
      setSelectedCategoryTypeFilter(currentTipe);
    }

    // RESET
    setActiveTajwidEditId(null);
    setTajwidFormNama('');
    setTajwidFormDeskripsi('');
    // Keep current selected type so consecutive additions stay under this classification!
    setTajwidFormTipe(currentTipe);
    setTajwidSubcategories([]);
    setNewSubcategoryInput('');
    setEditingSubcategoryIdx(null);
    setEditingSubcategoryInput('');
  };

  const tajFormTipeUpdatedValue = () => {
    return tajwidFormTipe;
  };

  const handleEditTajwidClick = (cat: TajwidCategory) => {
    setActiveTajwidEditId(cat.id);
    setTajwidFormNama(cat.nama);
    setTajwidFormDeskripsi(cat.deskripsi || '');
    const typeObj = getCategoryTypeObj(cat.tipe);
    setTajwidFormTipe(typeObj.id);
    setTajwidSubcategories(cat.subcategories || []);
    setNewSubcategoryInput('');
    setEditingSubcategoryIdx(null);
    setEditingSubcategoryInput('');
  };

  const handleCancelTajwidEdit = () => {
    setActiveTajwidEditId(null);
    setTajwidFormNama('');
    setTajwidFormDeskripsi('');
    if (selectedCategoryTypeFilter !== 'all') {
      setTajwidFormTipe(selectedCategoryTypeFilter);
    } else {
      setTajwidFormTipe(klasifikasiKesalahanTypes[0]?.id || 'lahn_jaliy');
    }
    setTajwidSubcategories([]);
    setNewSubcategoryInput('');
    setEditingSubcategoryIdx(null);
    setEditingSubcategoryInput('');
  };

  const handleAddSubcategory = () => {
    if (!newSubcategoryInput.trim()) return;
    const subId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newSub: TajwidSubcategory = { id: subId, nama: newSubcategoryInput.trim() };
    setTajwidSubcategories(prev => [...prev, newSub]);
    setNewSubcategoryInput('');
  };

  const handleStartEditSubcategory = (idx: number, currentNama: string) => {
    setEditingSubcategoryIdx(idx);
    setEditingSubcategoryInput(currentNama);
  };

  const handleSaveSubcategoryEdit = (idx: number) => {
    if (!editingSubcategoryInput.trim()) return;
    setTajwidSubcategories(prev => prev.map((sub, i) => i === idx ? { ...sub, nama: editingSubcategoryInput.trim() } : sub));
    setEditingSubcategoryIdx(null);
    setEditingSubcategoryInput('');
  };

  const handleDeleteSubcategory = (idx: number) => {
    const target = tajwidSubcategories[idx];
    setConfirmDeleteSubcatModal({ idx, nama: target?.nama || `Subkategori ${idx + 1}` });
  };

  const executeDeleteSubcategory = () => {
    if (!confirmDeleteSubcatModal) return;
    const { idx } = confirmDeleteSubcatModal;
    setTajwidSubcategories(prev => prev.filter((_, i) => i !== idx));
    if (editingSubcategoryIdx === idx) {
      setEditingSubcategoryIdx(null);
      setEditingSubcategoryInput('');
    }
    setConfirmDeleteSubcatModal(null);
  };

  const handleMoveSubcategory = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === tajwidSubcategories.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    setTajwidSubcategories(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSaveElem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elemFormNama.trim()) {
      alert('Nama elemen tidak boleh kosong.');
      return;
    }
    const cats = elemFormCategories
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const cleanBaseScore = elemFormBaseScore === '' || elemFormBaseScore === undefined || elemFormBaseScore === null ? 100 : Number(elemFormBaseScore);

    const cleanDeductions: Record<string, number> = {};
    if (elemFormRubrikDeductions) {
      Object.entries(elemFormRubrikDeductions).forEach(([key, val]) => {
        cleanDeductions[key] = val === '' || val === undefined || val === null ? 0 : Number(val);
      });
    }

    const cleanPredikat = (elemFormRubrikPredikat || []).map(p => ({
      ...p,
      minScore: p.minScore === '' || p.minScore === undefined || p.minScore === null ? 0 : Number(p.minScore),
      maxScore: p.maxScore === '' || p.maxScore === undefined || p.maxScore === null ? 0 : Number(p.maxScore),
    }));

    const cleanBobotKlasifikasi: Record<string, number> = {};
    (klasifikasiKesalahanTypes || []).forEach(t => {
      const val = elemFormBobotKlasifikasi[t.id];
      const masterVal = masterPenalties?.bobotKlasifikasi?.[t.id] ?? (t.id === 'lahn_jaliy' ? 4 : 2);
      cleanBobotKlasifikasi[t.id] = (val === '' || val === undefined || val === null) ? masterVal : Number(val);
    });

    const cleanBobotJaliy = cleanBobotKlasifikasi['lahn_jaliy'] !== undefined
      ? cleanBobotKlasifikasi['lahn_jaliy']
      : (elemFormBobotLahnJaliy === '' ? (masterPenalties?.bobotLahnJaliy ?? 4) : Number(elemFormBobotLahnJaliy));

    const cleanBobotKhafiy = cleanBobotKlasifikasi['lahn_khafiy'] !== undefined
      ? cleanBobotKlasifikasi['lahn_khafiy']
      : (elemFormBobotLahnKhafiy === '' ? (masterPenalties?.bobotLahnKhafiy ?? 2) : Number(elemFormBobotLahnKhafiy));

    const cleanStandarBarisQuran = elemFormStandarBarisQuran === '' ? (masterPenalties?.standarBarisQuran ?? 15) : Number(elemFormStandarBarisQuran);
    const cleanMinBarisQuran = elemFormMinBarisQuran === '' ? (masterPenalties?.minBarisQuran ?? 5) : Number(elemFormMinBarisQuran);
    const cleanMaxBarisQuran = elemFormMaxBarisQuran === '' ? (masterPenalties?.maxBarisQuran ?? 15) : Number(elemFormMaxBarisQuran);

    const id = editingElemId || (elemFormNama.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4));
    const fullElem: ElemenSetting = {
      id,
      nama: elemFormNama.trim(),
      tipeModul: elemFormTipeModul,
      jenisSetoranList: cats,
      kompetensi: elemFormKompetensi.trim() || undefined,
      referensiModulId: elemFormReferensiModulId || undefined,
      useJumlahBaris: elemFormUseJumlahBaris,
      tipeKesalahan: elemFormTipeKesalahan,
      usePageRules: elemFormUsePageRules,
      pageRules: elemFormPageRules,
      useRubrikPenilaian: elemFormUseRubrikPenilaian,
      useMasterPenalties: elemFormUseMasterPenalties,
      baseScore: cleanBaseScore,
      rumusPenilaian: elemFormRumusPenilaian,
      rubrikDeductions: cleanDeductions,
      rubrikPredikat: cleanPredikat,
      targetScope: elemFormTargetScope,
      targetHalaqahIds: elemFormTargetHalaqahIds,
      oncePerSessionCategories: elemFormOnceCategories,
      bobotKlasifikasi: cleanBobotKlasifikasi,
      bobotLahnJaliy: cleanBobotJaliy,
      bobotLahnKhafiy: cleanBobotKhafiy,
      standarBarisQuran: cleanStandarBarisQuran,
      minBarisQuran: cleanMinBarisQuran,
      maxBarisQuran: cleanMaxBarisQuran,
      // Perjenjangan & Prasyarat
      isBerjenjang: elemFormIsBerjenjang,
      jenjangLevel: elemFormIsBerjenjang ? (Number(elemFormJenjangLevel) || 1) : undefined,
      prerequisiteElemenIds: elemFormIsBerjenjang ? elemFormPrerequisiteElemenIds : [],
      syaratBuka: elemFormIsBerjenjang ? elemFormSyaratBuka : undefined,
      minimalSetoranLulus: elemFormIsBerjenjang && elemFormSyaratBuka === 'minimal_setoran' ? (Number(elemFormMinimalSetoranLulus) || 1) : undefined,
      allowTeacherOverride: elemFormIsBerjenjang ? elemFormAllowTeacherOverride : true,
      deskripsiJenjang: elemFormDeskripsiJenjang.trim() || undefined,
      // Target Tuntas & Cakupan Modul Pembelajaran
      targetDurasiBulan: elemFormTargetDurasiBulan !== '' && Number(elemFormTargetDurasiBulan) > 0 ? Number(elemFormTargetDurasiBulan) : undefined,
      targetCakupanMateri: elemFormTargetCakupanMateri,
      targetSurahList: elemFormTargetCakupanMateri === 'surah_pilihan' ? elemFormTargetSurahList : undefined,
      targetJuzStart: elemFormTargetCakupanMateri === 'juz_range' && elemFormTargetJuzStart !== '' ? Number(elemFormTargetJuzStart) : undefined,
      targetJuzEnd: elemFormTargetCakupanMateri === 'juz_range' && elemFormTargetJuzEnd !== '' ? Number(elemFormTargetJuzEnd) : undefined,
      targetHalamanStart: elemFormTargetCakupanMateri === 'halaman_range' && elemFormTargetHalamanStart !== '' ? Number(elemFormTargetHalamanStart) : undefined,
      targetHalamanEnd: elemFormTargetCakupanMateri === 'halaman_range' && elemFormTargetHalamanEnd !== '' ? Number(elemFormTargetHalamanEnd) : undefined,
      targetCatatanMateri: elemFormTargetCatatanMateri.trim() || undefined
    };

    saveElemenSettingObject(fullElem);
    setIsElemModalOpen(false);
  };

  const handleResetElemenToMaster = (elem: ElemenSetting) => {
    if (!window.confirm(`Kembalikan pembobotan elemen "${elem.nama}" mengikuti standar Master Bobot Penilaian?`)) {
      return;
    }
    updateElemenSettingFull(
      elem.id,
      elem.nama,
      elem.tipeModul,
      elem.jenisSetoranList,
      elem.kompetensi,
      elem.referensiModulId,
      elem.useJumlahBaris,
      elem.tipeKesalahan,
      elem.usePageRules,
      elem.pageRules,
      elem.useRubrikPenilaian,
      true, // useMasterPenalties = true
      elem.baseScore,
      elem.rumusPenilaian,
      elem.rubrikDeductions,
      elem.rubrikPredikat,
      elem.useCustomLinesConfig,
      elem.defaultLinesPerPage,
      elem.customPageLines,
      elem.targetScope,
      elem.targetHalaqahIds,
      elem.oncePerSessionCategories,
      elem.bobotKlasifikasi,
      elem.bobotLahnJaliy,
      elem.bobotLahnKhafiy,
      elem.standarBarisQuran,
      elem.minBarisQuran,
      elem.maxBarisQuran
    );
  };

  const handleDeleteElemConfirm = (id: string) => {
    deleteElemenSetting(id);
    setConfirmDeleteElem(null);
  };

  // State handles for dynamic inputs in admin board
  const handleAddJenisSetoran = (elemId: string) => {
    const text = newJenisInputs[elemId]?.trim();
    if (!text) return;

    const elem = elemenSettings?.find(e => e.id === elemId);
    if (elem) {
      if (elem.jenisSetoranList.includes(text)) {
        alert('Jenis setoran ini sudah terdaftar.');
        return;
      }
      const updatedList = [...elem.jenisSetoranList, text];
      updateElemenSetting(elemId, updatedList);
      setNewJenisInputs(prev => ({ ...prev, [elemId]: '' }));
    }
  };

  const handleRemoveJenisSetoran = (elemId: string, item: string) => {
    const elem = elemenSettings?.find(e => e.id === elemId);
    if (elem) {
      const updatedList = elem.jenisSetoranList.filter(i => i !== item);
      updateElemenSetting(elemId, updatedList);
    }
  };

  const formatSetoranMateriDetail = (s: Setoran): string => {
    if (s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0) {
      const list = s.daftarSuratSetoran.map(item => `${item.suratNama}: ${item.ayatAwal}-${item.ayatAkhir}`);
      return `Multi-Surat (${list.join(', ')})`;
    } else if (s.suratNama) {
      const hasSurah = s.modulNama.toLowerCase().includes(s.suratNama.toLowerCase());
      if (hasSurah) {
        return `${s.modulNama}: ${s.ayatAwal}-${s.ayatAkhir}`;
      }
      return `${s.modulNama} (${s.suratNama}: ${s.ayatAwal}-${s.ayatAkhir})`;
    } else if (s.catatanModulLain) {
      return `${s.modulNama} (${s.catatanModulLain})`;
    }
    return s.modulNama;
  };

  const getExportFileName = () => {
    let rangeText = 'Semua_Periode';
    if (filterStartDate && filterEndDate) {
      rangeText = `${filterStartDate}_sd_${filterEndDate}`;
    } else if (filterStartDate) {
      rangeText = `sejak_${filterStartDate}`;
    } else if (filterEndDate) {
      rangeText = `sampai_${filterEndDate}`;
    }

    let teacherObj: any = null;
    if (user.role === UserRole.GURU) {
      teacherObj = user;
    } else if (guruFilter !== 'All') {
      teacherObj = (gurus || []).find(g => g.id === guruFilter || g.namaLengkap === guruFilter || g.namaLengkap.toLowerCase() === guruFilter.toLowerCase());
    } else if (user) {
      teacherObj = user;
    }

    let teacherSuffix = '';
    if (teacherObj && teacherObj.namaLengkap) {
      const isPerempuan = teacherObj.jenisKelamin === JenisKelamin.PEREMPUAN || teacherObj.jenisKelamin === 'Perempuan';
      const title = isPerempuan ? 'Ustadzah' : 'Ustadz';
      const cleanName = teacherObj.namaLengkap.replace(/^(ustadzah|ustadz|ust\.)\s+/i, '').trim();
      if (cleanName) {
        teacherSuffix = `_${title} ${cleanName}`;
      }
    }

    return `Rekap_Setoran_${rangeText}${teacherSuffix}`;
  };

  const generateRekapSetoranPDF = (doc: jsPDF) => {
    doc.setFontSize(18);
    doc.setTextColor(15, 118, 110);
    doc.text('REKAP INTEGRAL SETORAN HALAQAH (ADMIN)', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Halaqah: Semua Halaqah | Admin: ${currentSession.user?.namaLengkap || '-'}`, 14, 26);
    doc.text(`Status Harian / Mutabaah | Periode: ${filterStartDate || 'Awal'} s.d. ${filterEndDate || 'Sekarang'} | Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);
    
    doc.setDrawColor(148, 163, 184);
    doc.line(14, 36, 196, 36);

    // Measure maximum text widths
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    
    let maxTglW = doc.getTextWidth('Tanggal');
    let maxNamaW = doc.getTextWidth('Nama Santri');
    let maxMateriW = doc.getTextWidth('Materi Setoran');
    let maxNilaiW = doc.getTextWidth('Nilai');
    let maxStatusW = doc.getTextWidth('Status');
    
    displayLogs.forEach(s => {
      const tglW = doc.getTextWidth(s.tanggalSetoran || '');
      if (tglW > maxTglW) maxTglW = tglW;
      
      const nameW = doc.getTextWidth(s.siswaNama || '');
      if (nameW > maxNamaW) maxNamaW = nameW;
      
      const formattedMateri = formatSetoranMateriDetail(s);
      const matW = doc.getTextWidth(formattedMateri);
      if (matW > maxMateriW) maxMateriW = matW;
      
      const nilW = doc.getTextWidth(s.nilai || '');
      if (nilW > maxNilaiW) maxNilaiW = nilW;
      
      const statText = s.statusLulus ? 'LULUS' : 'MENGULANG';
      const statW = doc.getTextWidth(statText);
      if (statW > maxStatusW) maxStatusW = statW;
    });
    
    const pad = 4;
    maxTglW += pad;
    maxNamaW += pad;
    maxMateriW += pad;
    maxNilaiW += pad;
    maxStatusW += pad;

    let wTgl = Math.max(maxTglW, 22);
    let wStatus = Math.max(maxStatusW, 25);
    
    let remWidth = 182 - wTgl - wStatus;
    
    let totalFlexibleReqWidth = maxNamaW + maxMateriW + maxNilaiW;
    let wNama = Math.round(remWidth * (maxNamaW / totalFlexibleReqWidth));
    let wMateri = Math.round(remWidth * (maxMateriW / totalFlexibleReqWidth));
    let wNilai = Math.round(remWidth * (maxNilaiW / totalFlexibleReqWidth));
    
    if (wNama < 35) wNama = 35;
    if (wNilai < 30) wNilai = 30;
    if (wMateri < 35) wMateri = 35;
    
    let currentTotal = wTgl + wStatus + wNama + wMateri + wNilai;
    if (currentTotal !== 182) {
      const diff = 182 - currentTotal;
      wMateri += diff;
    }

    const xTgl = 14;
    const xNama = xTgl + wTgl;
    const xMateri = xNama + wNama;
    const xNilai = xMateri + wMateri;
    const xStatus = xNilai + wNilai;

    const drawHeader = (headerY: number) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, headerY, 182, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('Tgl', xTgl + 1, headerY + 5.5);
      doc.text('Nama', xNama + 1.5, headerY + 5.5);
      doc.text('Materi Setoran', xMateri + 1.5, headerY + 5.5);
      doc.text('Nilai', xNilai + 1.5, headerY + 5.5);
      doc.text('Status', xStatus + 1, headerY + 5.5);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
    };

    let y = 44;
    drawHeader(y);
    y += 11;

    displayLogs.forEach((s) => {
      const linesTgl = doc.splitTextToSize(s.tanggalSetoran || '', wTgl - 2);
      const linesNama = doc.splitTextToSize(s.siswaNama || '', wNama - 3);
      const linesMateri = doc.splitTextToSize(formatSetoranMateriDetail(s), wMateri - 3);
      const linesNilai = doc.splitTextToSize(s.nilai || '', wNilai - 3);
      const linesStatus = doc.splitTextToSize(s.statusLulus ? 'LULUS' : 'MENGULANG', wStatus - 2);

      const numLines = Math.max(linesTgl.length, linesNama.length, linesMateri.length, linesNilai.length, linesStatus.length);
      const rowHeight = numLines * 5 + 3;

      if (y + rowHeight > 280) {
        doc.addPage();
        y = 20;
        drawHeader(y);
        y += 11;
      }

      linesTgl.forEach((line, idx) => {
        doc.text(line, xTgl + 1, y + idx * 5 + 4);
      });
      linesNama.forEach((line, idx) => {
        doc.text(line, xNama + 1.5, y + idx * 5 + 4);
      });
      linesMateri.forEach((line, idx) => {
        doc.text(line, xMateri + 1.5, y + idx * 5 + 4);
      });
      linesNilai.forEach((line, idx) => {
        doc.text(line, xNilai + 1.5, y + idx * 5 + 4);
      });
      linesStatus.forEach((line, idx) => {
        doc.text(line, xStatus + 1, y + idx * 5 + 4);
      });

      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + rowHeight, 196, y + rowHeight);

      y += rowHeight;
    });
  };

  const getWordImageDimensions = (
    base64: string | undefined, 
    maxWidth: number, 
    maxHeight: number
  ): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (!base64 || typeof base64 !== 'string' || !base64.startsWith('data:image')) {
        return resolve(null);
      }
      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth || img.width || 1;
        const nh = img.naturalHeight || img.height || 1;
        
        const ratio = Math.min(maxWidth / nw, maxHeight / nh);
        const w = Math.round(nw * ratio);
        const h = Math.round(nh * ratio);
        resolve({ width: Math.max(1, w), height: Math.max(1, h) });
      };
      img.onerror = () => {
        resolve({ width: maxWidth, height: maxHeight });
      };
      img.src = base64;
    });
  };

  const generateSetoranWordHtml = async (logs: Setoran[]) => {
    const activeTemplate = pdfTemplate || getSavedPresensiTemplate();
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const resolvedLoc = getDynamicReportLocation(undefined, logs);

    const headerDim = await getWordImageDimensions(activeTemplate.headerImageBase64, 650, 120);
    const footerDim = await getWordImageDimensions(activeTemplate.footerImageBase64, 650, 90);
    const sigDim = await getWordImageDimensions(activeTemplate.signatureImageBase64, 140, 70);

    let headerHtml = '';
    if (activeTemplate.headerImageBase64 && headerDim) {
      headerHtml = `<div style="text-align: center; margin: 0; padding: 0;">
        <img src="${activeTemplate.headerImageBase64}" width="${headerDim.width}" height="${headerDim.height}" style="width: ${headerDim.width}px; max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Header Banner" />
      </div>`;
    } else {
      headerHtml = `
        <div style="background-color: #045B2A; color: #ffffff; padding: 10px 15px; border-top: 4px solid #EAB308; border-radius: 4px; margin: 0;">
          <table style="width: 100%; border-collapse: collapse; color: #ffffff; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
              <td style="font-weight: bold; font-size: 13px; font-family: Arial, sans-serif; border: none; color: #ffffff;">
                ${institutionDisplayName.toUpperCase()}
              </td>
              <td style="text-align: right; font-weight: bold; font-size: 11px; font-family: Arial, sans-serif; color: #EAB308; border: none;">
                ${activeTemplate.headerBadgeText || 'DIVISI PEMBINAAN AL-QURAN'}
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    let footerHtml = '';
    if (activeTemplate.footerImageBase64 && footerDim) {
      footerHtml = `<div style="text-align: center; margin: 0; padding: 0;">
        <img src="${activeTemplate.footerImageBase64}" width="${footerDim.width}" height="${footerDim.height}" style="width: ${footerDim.width}px; max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Footer Banner" />
      </div>`;
    } else {
      footerHtml = `
        <div style="background-color: #045B2A; color: #ffffff; padding: 6px 12px; border-bottom: 4px solid #EAB308; border-radius: 4px; margin: 0; text-align: left; font-size: 10px; font-family: Arial, sans-serif;">
          ${activeTemplate.footerSocialText || 'Portal Manajemen Halaqah Al-Quran'}
        </div>
      `;
    }

    let signatureImgHtml = '';
    if (activeTemplate.signatureImageBase64 && sigDim) {
      signatureImgHtml = `<img src="${activeTemplate.signatureImageBase64}" width="${sigDim.width}" height="${sigDim.height}" style="width: ${sigDim.width}px; height: ${sigDim.height}px; display: block; margin: 5px auto;" alt="Tanda Tangan" />`;
    } else {
      signatureImgHtml = `<div style="height: 50px; border-bottom: 1px dashed #9ca3af; width: 140px; margin: 10px auto;"></div>`;
    }

    const rowsHtml = logs.map((s, index) => {
      const tglFormatted = s.tanggalSetoran ? new Date(s.tanggalSetoran).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      const statusText = s.statusLulus ? 'Lulus' : 'Mengulang';
      const statusBg = s.statusLulus ? '#dcfce7' : '#fef3c7';
      const statusColor = s.statusLulus ? '#15803d' : '#b45309';

      return `
        <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">${index + 1}</td>
          <td style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">${tglFormatted}</td>
          <td style="padding: 6px; border: 1px solid #d1d5db; text-align: left; font-weight: bold;">${s.siswaNama || '-'}</td>
          <td style="padding: 6px; border: 1px solid #d1d5db; text-align: left;">${formatSetoranMateriDetail(s)}</td>
          <td style="padding: 6px; border: 1px solid #d1d5db; text-align: center; font-weight: bold;">${s.nilai}</td>
          <td style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">
            <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">
              ${statusText}
            </span>
          </td>
          <td style="padding: 6px; border: 1px solid #d1d5db; text-align: left; font-size: 10px; color: #4b5563;">${s.catatanGuru || '-'}</td>
        </tr>
      `;
    }).join('');

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8" />
        <title>REKAPITULASI LAPORAN SETORAN SANTRI</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21.0cm 29.7cm;
            margin: 2.8cm 1.5cm 2.2cm 1.5cm;
            mso-header-margin: 0.3cm;
            mso-footer-margin: 0.3cm;
            mso-header: h1;
            mso-footer: f1;
          }
          @page Section1 {
            size: 21.0cm 29.7cm;
            margin: 2.8cm 1.5cm 2.2cm 1.5cm;
            mso-header-margin: 0.3cm;
            mso-footer-margin: 0.3cm;
            mso-header: h1;
            mso-footer: f1;
          }
          div.Section1 {
            page: Section1;
          }
          p.MsoHeader, div.MsoHeader {
            margin: 0pt;
            margin-bottom: .0001pt;
            mso-pagination: widow-orphan;
            text-align: center;
          }
          p.MsoFooter, div.MsoFooter {
            margin: 0pt;
            margin-bottom: .0001pt;
            mso-pagination: widow-orphan;
            text-align: center;
          }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 0; }
          table { border-collapse: collapse; width: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          th { background-color: #045B2A; color: #ffffff; padding: 8px; font-size: 11px; border: 1px solid #045B2A; text-align: center; }
          td { font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${headerHtml}
          
          <div style="text-align: center; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 14px; font-weight: bold; color: #000000; text-transform: uppercase;">
              REKAPITULASI LAPORAN SETORAN & TILAWAH SANTRI
            </h2>
            <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: bold; color: #045B2A;">
              TEMPAT: ${resolvedLoc} | PERIODE: ${todayStr}
            </p>
          </div>

          <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="width: 5%;">NO</th>
                <th style="width: 15%;">TANGGAL</th>
                <th style="width: 25%;">NAMA SANTRI</th>
                <th style="width: 25%;">MATERI SETORAN</th>
                <th style="width: 8%;">NILAI</th>
                <th style="width: 10%;">STATUS</th>
                <th style="width: 12%;">CATATAN GURU</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="7" style="text-align:center; padding:15px; color:#9ca3af; border: 1px solid #d1d5db;">Tidak ada data setoran.</td></tr>`}
            </tbody>
          </table>

          <table style="width: 100%; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
              <td style="width: 50%; border: none;"></td>
              <td style="width: 50%; text-align: center; border: none; vertical-align: top;">
                <p style="margin: 0; font-size: 10px; color: #374151;">${activeTemplate.locationText || 'Kantor Pusat'}, ${todayStr}</p>
                <p style="margin: 2px 0 5px 0; font-weight: bold; font-size: 11px; color: #111827;">${activeTemplate.penanggungjawabJabatan || 'Penanggungjawab Kegiatan'}</p>
                ${signatureImgHtml}
                <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 11px; color: #111827; text-decoration: underline;">${activeTemplate.penanggungjawabNama || 'Koordinator Halaqah'}</p>
              </td>
            </tr>
          </table>
          
          ${footerHtml}
        </div>
      </body>
      </html>
    `;
  };

  const simulateExport = (type: 'PDF' | 'Excel' | 'Word' | 'Docs' | 'Sheet', name: string) => {
    if (type === 'Excel' || type === 'Sheet') {
      exportToExcel(name);
    } else if (type === 'Word' || type === 'Docs') {
      exportToWord(name);
    } else {
      exportToPDF(name);
    }
  };

  const exportToWord = async (name: string) => {
    setDownloading('Word');
    try {
      const htmlContent = await generateSetoranWordHtml(displayLogs);
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog(`Export Word`, `Mengekspor data ${name} ke Word`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat mengekspor ke Word: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const exportToExcel = (name: string) => {
    setDownloading('Excel');
    try {
      let worksheetData = displayLogs.map((s, index) => ({
        'No': index + 1,
        'Tanggal': s.tanggalSetoran,
        'Nama Santri': s.siswaNama,
        'Materi Setoran / Juz / Surah': formatSetoranMateriDetail(s),
        'Nilai': s.nilai,
        'Status': s.statusLulus ? 'Lulus' : 'Mengulang',
        'Catatan Guru': s.catatanGuru || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Data');
      
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const xlsxBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(xlsxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      addLog(`Export Excel`, `Mengekspor data ${name} ke Excel`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat mengekspor ke Excel: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const exportToPDF = (name: string) => {
    setDownloading('PDF');
    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal');
      generateRekapSetoranPDF(doc);
      doc.save(`${name}.pdf`);
      addLog(`Export PDF`, `Mengekspor data ${name} ke PDF`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat mengekspor ke PDF: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const getFilteredPresensiGuruList = (targetGuruId?: string) => {
    const hasSpecificTarget = Boolean(targetGuruId && targetGuruId !== 'ALL');

    return compiledGuruAttendance.filter(item => {
      // 1. Filter Tanggal
      if (attendanceFilterDate && item.tanggal !== attendanceFilterDate) return false;
      if (attendanceFilterStartDate && item.tanggal < attendanceFilterStartDate) return false;
      if (attendanceFilterEndDate && item.tanggal > attendanceFilterEndDate) return false;

      // 2. Filter Guru (Target Tertentu atau Pilihan Multi-Guru)
      if (hasSpecificTarget) {
        const targetGuruObj = (gurus || []).find(g => g.id === targetGuruId);
        const matchesId = item.guruId === targetGuruId;
        const matchesName = Boolean(
          targetGuruObj && item.guruNama && targetGuruObj.namaLengkap &&
          item.guruNama.trim().toLowerCase() === targetGuruObj.namaLengkap.trim().toLowerCase()
        );
        if (!matchesId && !matchesName) return false;
      } else if (attendanceFilterGurus.length > 0) {
        // Multi-guru filter
        const matchesId = attendanceFilterGurus.includes(item.guruId);
        const selectedGuruObjs = (gurus || []).filter(g => attendanceFilterGurus.includes(g.id));
        const selectedNames = selectedGuruObjs.map(g => (g?.namaLengkap || '').trim().toLowerCase()).filter(Boolean);
        const matchesName = Boolean(item.guruNama && selectedNames.includes(item.guruNama.trim().toLowerCase()));
        if (!matchesId && !matchesName) return false;
      }

      // 3. Filter Status Kehadiran
      if (attendanceFilterStatus !== 'All' && item.status !== attendanceFilterStatus) return false;

      // 4. Filter Berdasarkan Centang Tick Box Halaqah Diampu (Lembaga)
      // Berlaku baik saat pratinjau semua guru maupun pratinjau per guru secara bergantian
      if (teacherNonPrivateHalaqahs.length > 0) {
        // Jika seluruh tick box halaqah di-uncheck, jangan tampilkan data apa pun
        if (selectedHalaqahIdsForPresensi.length === 0) return false;

        // Ambil semua kemungkinan ID halaqah yang terasosiasi dengan catatan presensi ini
        const itemHalaqahIds: string[] = [];
        if (item.halaqahId) itemHalaqahIds.push(item.halaqahId);
        if (Array.isArray(item.halaqahIds)) {
          item.halaqahIds.forEach((hId: string) => {
            if (hId && !itemHalaqahIds.includes(hId)) itemHalaqahIds.push(hId);
          });
        }

        if (itemHalaqahIds.length > 0) {
          // Hanya lolos jika halaqah catatan ini termasuk yang dicentang di filter
          const isHalaqahChecked = itemHalaqahIds.some(hId => selectedHalaqahIdsForPresensi.includes(hId));
          if (!isHalaqahChecked) return false;
        } else {
          // Jika catatan tidak memiliki halaqahId (misal manual Sakit/Izin global):
          // Hanya tampilkan jika setidaknya satu halaqah dari guru ini dicentang
          const guruHalaqahIds = teacherNonPrivateHalaqahs
            .filter(h => h.guruPembimbingId === item.guruId)
            .map(h => h.id);
          if (guruHalaqahIds.length > 0) {
            const hasAnyChecked = guruHalaqahIds.some(hId => selectedHalaqahIdsForPresensi.includes(hId));
            if (!hasAnyChecked) return false;
          }
        }
      }

      return true;
    });
  };

  // Daftar unik guru yang ada dalam data presensi hasil filter saat ini (untuk switcher preview & email bersamaan)
  const previewAvailableGurus = useMemo(() => {
    const allFiltered = getFilteredPresensiGuruList();
    const map = new Map<string, { id: string; name: string; count: number }>();
    allFiltered.forEach(item => {
      const gId = item.guruId || 'UNKNOWN';
      const gName = item.guruNama || 'Ustadz / Pengajar';
      if (!map.has(gId)) {
        map.set(gId, { id: gId, name: gName, count: 0 });
      }
      map.get(gId)!.count += 1;
    });
    return Array.from(map.values());
  }, [compiledGuruAttendance, attendanceFilterGurus, attendanceFilterDate, attendanceFilterStartDate, attendanceFilterEndDate, attendanceFilterStatus, selectedHalaqahIdsForPresensi, teacherNonPrivateHalaqahs]);

  const getExportPresensiGuruFileName = (targetGuruId?: string) => {
    let guruPart = 'Semua_Guru';

    if (targetGuruId && targetGuruId !== 'ALL') {
      const selectedGuru = (gurus || []).find(g => g.id === targetGuruId);
      if (selectedGuru) {
        guruPart = getGuruTitleAndName(selectedGuru);
      } else {
        const foundInAtt = compiledGuruAttendance.find(a => a.guruId === targetGuruId);
        if (foundInAtt?.guruNama) guruPart = foundInAtt.guruNama;
      }
    } else if (attendanceFilterGurus.length === 1) {
      const selectedGuru = (gurus || []).find(g => g.id === attendanceFilterGurus[0]);
      if (selectedGuru) {
        guruPart = getGuruTitleAndName(selectedGuru);
      }
    } else if (attendanceFilterGurus.length > 1) {
      guruPart = `Multi_${attendanceFilterGurus.length}_Guru`;
    } else {
      const filteredList = getFilteredPresensiGuruList();
      if (filteredList.length > 0) {
        const firstGuruId = filteredList[0].guruId;
        const allSameGuru = filteredList.every(item => item.guruId === firstGuruId);
        if (allSameGuru && firstGuruId) {
          const selectedGuru = (gurus || []).find(g => g.id === firstGuruId);
          if (selectedGuru) {
            guruPart = getGuruTitleAndName(selectedGuru);
          }
        }
      }
    }

    let yearPart = attendanceFilterYear || new Date().getFullYear().toString();
    const filteredList = getFilteredPresensiGuruList(targetGuruId);
    if (filteredList.length > 0 && filteredList[0].tanggal) {
      const dateYear = filteredList[0].tanggal.substring(0, 4);
      if (dateYear && !isNaN(Number(dateYear)) && dateYear.length === 4) {
        yearPart = dateYear;
      }
    }

    return `Rekap_Presensi_${guruPart.replace(/\s+/g, '_')}_${yearPart}`;
  };

  const createPresensiGuruWorkbook = (list: any[]) => {
    const activeTemplate = pdfTemplate || getSavedPresensiTemplate();
    const cols = activeTemplate.tableColumns || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!;
    const labels = cols.customLabels || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!.customLabels!;

    // 1. Sort list by date ascending (tanggal terendah ke tertinggi)
    const sortedList = [...list].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
    const resolvedLoc = getDynamicReportLocation(attendanceFilterGuru, sortedList);

    const workbook = XLSX.utils.book_new();
    const groupedByMonth: Record<string, { monthName: string; items: any[] }> = {};

    sortedList.forEach(item => {
      let mKey = '00';
      let mName = 'Presensi Guru';

      if (item.tanggal && item.tanggal.length >= 7) {
        mKey = item.tanggal.substring(5, 7);
        mName = MONTH_NAMES_MAP[mKey] || `Bulan ${mKey}`;
      }

      if (!groupedByMonth[mKey]) {
        groupedByMonth[mKey] = { monthName: mName, items: [] };
      }
      groupedByMonth[mKey].items.push(item);
    });

    const monthKeys = Object.keys(groupedByMonth).sort();

    if (monthKeys.length === 0) {
      const emptyWorksheet = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(workbook, emptyWorksheet, 'Presensi Guru');
    } else {
      monthKeys.forEach(mKey => {
        const { monthName, items } = groupedByMonth[mKey];
        const worksheetData = items.map((item, index) => {
          const rowObj: Record<string, any> = {};
          if (cols.showNo !== false) rowObj[labels.no || 'No'] = index + 1;
          if (cols.showTanggal !== false) rowObj[labels.tanggal || 'Tanggal'] = item.tanggal || '-';
          if (cols.showWaktu) rowObj[labels.waktu || 'Waktu / Jam'] = item.jam || item.waktu || '-';
          if (cols.showGuru !== false) rowObj[labels.guru || 'Nama Guru Pembimbing'] = formatGuruTitleAndName(item.guruNama, item.guruId);
          if (cols.showHalaqah) rowObj[labels.halaqah || 'Halaqah'] = item.halaqahNama || '-';
          if (cols.showStatus !== false) rowObj[labels.status || 'Status Kehadiran'] = item.status || 'Hadir';
          if (cols.showKeterangan !== false) {
            rowObj[labels.keterangan || 'Keterangan / Detail Bimbingan'] = item.isAutoDetected 
              ? `${item.setoranCount || 0} setoran santri` 
              : (item.catatan || '-');
          }
          if (cols.showLokasi) rowObj[labels.lokasi || 'Lokasi / Tempat Mengajar'] = item.lokasi || resolvedLoc;
          return rowObj;
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, monthName);
      });
    }

    return workbook;
  };

  const generateRekapPresensiGuruPDF = (doc: jsPDF, list: any[], customTemplate?: RekapPresensiPdfTemplate) => {
    const activeTemplate = customTemplate || pdfTemplate || getSavedPresensiTemplate();
    // Sort list by date ascending
    const sortedList = [...list].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
    const resolvedLoc = getDynamicReportLocation(attendanceFilterGuru, sortedList);

    // Extract month and year from sortedList if available
    let bulanTahunUpper = 'JULI 2026';
    let bulanTahunNormal = 'Juli 2026';

    if (sortedList.length > 0 && sortedList[0].tanggal && sortedList[0].tanggal.length >= 7) {
      const year = sortedList[0].tanggal.substring(0, 4);
      const mKey = sortedList[0].tanggal.substring(5, 7);
      const mName = MONTH_NAMES_MAP[mKey] || `Bulan ${mKey}`;
      bulanTahunUpper = `${mName.toUpperCase()} ${year}`;
      bulanTahunNormal = `${mName} ${year}`;
    }

    const totalHadir = sortedList.filter(a => a.status === 'Hadir' || !a.status || a.status === 'Hadir (Auto)').length;

    // Helper to draw Default Vector Header
    const drawDefaultVectorHeader = () => {
      // 1. Top Yellow Accent Bar
      doc.setFillColor(234, 179, 8); // #EAB308 Gold/Yellow
      doc.rect(10, 8, 190, 3, 'F');

      // 2. Top Right Dark Green Badge ("DIVISI PEMBINAAN AL-QURAN")
      doc.setFillColor(4, 91, 42); // #045B2A Dark Green
      doc.triangle(120, 8, 130, 20, 120, 20, 'F');
      doc.rect(120, 8, 80, 12, 'F');

      // Yellow accent strip under dark green badge
      doc.setFillColor(234, 179, 8);
      doc.triangle(115, 8, 120, 8, 126, 20, 'F');
      doc.rect(115, 8, 5, 12, 'F');

      // Re-fill dark green over overlapping rect portion for crisp angled edge
      doc.setFillColor(4, 91, 42);
      doc.triangle(120, 8, 130, 20, 120, 20, 'F');

      // Badge Text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(activeTemplate.headerBadgeText || 'DIVISI PEMBINAAN AL-QURAN', 195, 15.5, { align: 'right' });

      // 3. Top Left Organization Logos
      doc.setFillColor(4, 91, 42);
      doc.ellipse(16, 17, 4, 4, 'F');
      doc.setFillColor(255, 255, 255);
      doc.ellipse(16, 17, 2, 2, 'F');
      doc.setFillColor(4, 91, 42);
      doc.ellipse(16, 16.2, 1.2, 1.8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(4, 91, 42);
      doc.text(institutionAbbr, 16, 23, { align: 'center' });

      doc.setFillColor(234, 179, 8);
      doc.triangle(28, 13, 31, 19, 25, 19, 'F');
      doc.setFillColor(4, 91, 42);
      doc.triangle(31, 13, 34, 19, 28, 19, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(4, 91, 42);
      doc.text('HALAQAH', 30, 22, { align: 'center' });
      doc.text('AL-QURAN', 30, 24, { align: 'center' });

      doc.setFillColor(4, 91, 42);
      doc.rect(42, 13, 6, 6, 'F');
      doc.setFillColor(234, 179, 8);
      doc.circle(45, 16, 1.5, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(4, 91, 42);
      doc.text(institutionDisplayName, 50, 18);
    };

    // Helper to draw Default Vector Footer
    const drawDefaultVectorFooter = () => {
      doc.setFillColor(234, 179, 8);
      doc.rect(10, 285, 190, 3, 'F');

      doc.setFillColor(4, 91, 42);
      doc.rect(10, 276, 80, 9, 'F');
      doc.triangle(90, 276, 96, 285, 90, 285, 'F');

      doc.setFillColor(234, 179, 8);
      doc.rect(10, 275, 80, 1, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(activeTemplate.footerSocialText || 'Portal Manajemen Halaqah Al-Quran', 13, 282);
    };

    // Helper to draw Header & Footer Frame matching template
    const drawPageFrameAndHeader = (pageNum: number, totalPages: number) => {
      if (activeTemplate.headerImageBase64) {
        try {
          const props = doc.getImageProperties(activeTemplate.headerImageBase64);
          const targetWidth = 190;
          const calcHeight = (props.height / props.width) * targetWidth;
          const finalHeight = Math.min(calcHeight, 28);
          doc.addImage(activeTemplate.headerImageBase64, 'PNG', 10, 8, targetWidth, finalHeight);
        } catch (e) {
          console.error('Error rendering custom header image', e);
          drawDefaultVectorHeader();
        }
      } else {
        drawDefaultVectorHeader();
      }

      if (activeTemplate.footerImageBase64) {
        try {
          const props = doc.getImageProperties(activeTemplate.footerImageBase64);
          const targetWidth = 190;
          const calcHeight = (props.height / props.width) * targetWidth;
          const finalHeight = Math.min(calcHeight, 25);
          const footerY = 288 - finalHeight;
          doc.addImage(activeTemplate.footerImageBase64, 'PNG', 10, footerY, targetWidth, finalHeight);
        } catch (e) {
          console.error('Error rendering custom footer image', e);
          drawDefaultVectorFooter();
        }
      } else {
        drawDefaultVectorFooter();
      }
    };

    // Draw Page 1 Frame
    drawPageFrameAndHeader(1, 1);

    // Prepare Column Definitions based on template config
    const cols = activeTemplate.tableColumns || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!;
    const labels = cols.customLabels || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!.customLabels!;

    interface PdfColDef {
      key: string;
      title: string;
      weight: number;
      align: 'left' | 'center' | 'right';
      getValue: (item: any, index: number) => string;
      w?: number;
      x?: number;
    }

    const allDefs: PdfColDef[] = [
      { key: 'showNo', title: labels.no || 'No', weight: 12, align: 'center', getValue: (_, idx) => `${idx + 1}` },
      { key: 'showTanggal', title: labels.tanggal || 'Tanggal', weight: 26, align: 'center', getValue: (i) => i.tanggal || '-' },
      { key: 'showWaktu', title: labels.waktu || 'Waktu/Jam', weight: 20, align: 'center', getValue: (i) => i.jam || i.waktu || '-' },
      { key: 'showGuru', title: labels.guru || 'Nama Guru Pembimbing', weight: 52, align: 'left', getValue: (i) => formatGuruTitleAndName(i.guruNama, i.guruId) },
      { key: 'showHalaqah', title: labels.halaqah || 'Halaqah', weight: 28, align: 'left', getValue: (i) => i.halaqahNama || '-' },
      { key: 'showStatus', title: labels.status || 'Status Kehadiran', weight: 24, align: 'center', getValue: (i) => i.status || 'Hadir' },
      { key: 'showKeterangan', title: labels.keterangan || 'Keterangan / Detail', weight: 32, align: 'left', getValue: (i) => i.isAutoDetected ? `${i.setoranCount || 0} setoran` : (i.catatan || '-') },
      { key: 'showLokasi', title: labels.lokasi || 'Lokasi Mengajar', weight: 28, align: 'left', getValue: (i) => i.lokasi || resolvedLoc }
    ];

    const activeCols = allDefs.filter(d => (cols as any)[d.key] !== false);
    const finalCols = activeCols.length > 0 ? activeCols : allDefs.filter(d => ['showNo', 'showTanggal', 'showGuru', 'showStatus'].includes(d.key));

    const totalWeight = finalCols.reduce((sum, c) => sum + c.weight, 0);
    const totalTableWidth = 160;
    let curX = 25;
    finalCols.forEach(c => {
      c.w = Math.round((c.weight / totalWeight) * totalTableWidth * 10) / 10;
      c.x = curX;
      curX += c.w;
    });
    const calculatedW = finalCols.reduce((sum, c) => sum + (c.w || 0), 0);
    if (finalCols.length > 0 && calculatedW !== totalTableWidth) {
      finalCols[finalCols.length - 1].w! += (totalTableWidth - calculatedW);
    }

    const drawTableHeader = (headerY: number) => {
      doc.setFillColor(235, 237, 232);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);

      finalCols.forEach(c => {
        doc.rect(c.x!, headerY, c.w!, 8, 'FD');
      });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);

      finalCols.forEach(c => {
        const textX = c.align === 'center' ? (c.x! + c.w! / 2) : (c.x! + 2);
        const titleLines = doc.splitTextToSize(c.title, c.w! - 2);
        if (titleLines.length === 1) {
          doc.text(titleLines[0], textX, headerY + 5.5, { align: c.align === 'center' ? 'center' : 'left' });
        } else {
          doc.text(titleLines[0], textX, headerY + 3.5, { align: c.align === 'center' ? 'center' : 'left' });
          doc.text(titleLines[1], textX, headerY + 7, { align: c.align === 'center' ? 'center' : 'left' });
        }
      });

      doc.setFont('Helvetica', 'normal');
    };

    let y = 36;
    const elementsOrder = activeTemplate.elementsOrder && activeTemplate.elementsOrder.length > 0 
      ? activeTemplate.elementsOrder 
      : ['title', 'textboxes', 'table'];

    elementsOrder.forEach(elem => {
      if (elem === 'title') {
        if (y > 245) {
          doc.addPage();
          drawPageFrameAndHeader(2, 2);
          y = 35;
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(activeTemplate.documentTitle || 'REKAP PRESENSI HALAQAH AL-QURAN', 105, y, { align: 'center' });
        y += 5.5;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(`BULAN ${bulanTahunUpper} | TEMPAT : ${resolvedLoc}`, 105, y, { align: 'center' });
        y += 7;
      } else if (elem === 'textboxes') {
        if (activeTemplate.textBoxes && activeTemplate.textBoxes.length > 0) {
          activeTemplate.textBoxes.forEach(tb => {
            if (y > 245) {
              doc.addPage();
              drawPageFrameAndHeader(2, 2);
              y = 35;
            }
            const align = tb.align || 'center';
            const posX = align === 'left' ? 25 : align === 'right' ? 185 : 105;

            if (tb.type === 'sub_judul') {
              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(10);
              doc.setTextColor(0, 0, 0);
              const lines = doc.splitTextToSize(tb.content || tb.title || '', 160);
              doc.text(lines, posX, y, { align });
              y += lines.length * 4.5 + 3;
            } else if (tb.type === 'catatan') {
              const fullText = (tb.title ? `${tb.title}: ` : '') + (tb.content || '');
              const lines = doc.splitTextToSize(fullText, 152);
              const boxHeight = lines.length * 4 + 6;
              doc.setFillColor(245, 247, 245);
              doc.setDrawColor(4, 91, 42);
              doc.setLineWidth(0.4);
              doc.roundedRect(25, y, 160, boxHeight, 2, 2, 'FD');
              doc.setFont('Helvetica', tb.isBold ? 'bold' : 'normal');
              doc.setFontSize(8);
              doc.setTextColor(20, 20, 20);
              doc.text(lines, 28, y + 4.5);
              y += boxHeight + 4;
            } else {
              doc.setFont('Helvetica', tb.isBold ? 'bold' : 'normal');
              doc.setFontSize(8.5);
              doc.setTextColor(50, 50, 50);
              if (tb.title) {
                doc.setFont('Helvetica', 'bold');
                doc.text(tb.title, posX, y, { align });
                y += 4;
                doc.setFont('Helvetica', tb.isBold ? 'bold' : 'normal');
              }
              const lines = doc.splitTextToSize(tb.content || '', 160);
              doc.text(lines, posX, y, { align });
              y += lines.length * 4 + 3;
            }
          });
        }
      } else if (elem === 'table') {
        if (y > 235) {
          doc.addPage();
          drawPageFrameAndHeader(2, 2);
          y = 35;
        }
        drawTableHeader(y);
        y += 8;

        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);

        sortedList.forEach((item, index) => {
          const rowValues = finalCols.map(c => {
            const val = c.getValue(item, index);
            const lines = doc.splitTextToSize(val, c.w! - 3);
            return { c, val, lines };
          });

          const maxLines = Math.max(...rowValues.map(r => r.lines.length), 1);
          const rowHeight = Math.max(activeTemplate.tableDensity === 'compact' ? 6 : 7, maxLines * 4 + 2.5);

          if (y + rowHeight > 255) {
            doc.addPage();
            drawPageFrameAndHeader(2, 2);
            y = 35;
            drawTableHeader(y);
            y += 8;
          }

          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          rowValues.forEach(r => {
            doc.rect(r.c.x!, y, r.c.w!, rowHeight);
            const textX = r.c.align === 'center' ? (r.c.x! + r.c.w! / 2) : (r.c.x! + 2);
            doc.text(r.lines, textX, y + 4.5, { align: r.c.align === 'center' ? 'center' : 'left' });
          });

          y += rowHeight;
        });

        if (activeTemplate.showSummaryBelowTable !== false) {
          y += 5;
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(0, 0, 0);
          const summaryStr = formatPresensiSummaryText(activeTemplate.summaryTextFormat, bulanTahunNormal, totalHadir);
          doc.text(summaryStr, 25, y);
          y += 2;
        }
      }
    });

    // Signature Block
    y += 10;
    if (y + 35 > 265) {
      doc.addPage();
      drawPageFrameAndHeader(2, 2);
      y = 40;
    }

    const sigCenterX = 155; // Centered under right side of table
    if (activeTemplate.showSignatureDate) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`${resolvedLoc}, ${todayStr}`, sigCenterX, y, { align: 'center' });
      y += 5;
    }
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(activeTemplate.penanggungjawabJabatan || 'Penanggungjawab Kegiatan', sigCenterX, y, { align: 'center' });

    if (activeTemplate.signatureImageBase64) {
      try {
        const sigProps = doc.getImageProperties(activeTemplate.signatureImageBase64);
        const maxW = 40;
        const maxH = 18;
        let w = maxW;
        let h = (sigProps.height / sigProps.width) * w;
        if (h > maxH) {
          h = maxH;
          w = (sigProps.width / sigProps.height) * h;
        }
        doc.addImage(activeTemplate.signatureImageBase64, 'PNG', sigCenterX - (w / 2), y + 2, w, h);
        y += h + 2;
      } catch (err) {
        console.error('Error rendering signature image', err);
        y += 4;
        doc.setDrawColor(20, 24, 33);
        doc.setLineWidth(0.6);
        const sigY = y + 5;
        doc.line(sigCenterX - 20, sigY + 4, sigCenterX + 22, sigY + 2);
        doc.ellipse(sigCenterX - 5, sigY + 1, 6, 3, 'S');
        doc.line(sigCenterX - 8, sigY + 6, sigCenterX + 12, sigY - 2);
        doc.line(sigCenterX - 18, sigY + 8, sigCenterX + 20, sigY + 8);
        y += 22;
      }
    } else {
      y += 4;
      doc.setDrawColor(20, 24, 33);
      doc.setLineWidth(0.6);

      // Loop & swirl path
      const sigY = y + 5;
      doc.line(sigCenterX - 20, sigY + 4, sigCenterX + 22, sigY + 2); // main horizontal line
      doc.ellipse(sigCenterX - 5, sigY + 1, 6, 3, 'S'); // top loop
      doc.line(sigCenterX - 8, sigY + 6, sigCenterX + 12, sigY - 2); // diagonal stroke
      doc.line(sigCenterX - 18, sigY + 8, sigCenterX + 20, sigY + 8); // bottom underline
      y += 22;
    }

    // Name under signature
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(activeTemplate.penanggungjawabNama || 'Koordinator Halaqah', sigCenterX, y, { align: 'center' });
  };

  const generateRekapPresensiGuruWordHtml = async (
    list: any[], 
    customTemplate?: RekapPresensiPdfTemplate
  ) => {
    const activeTemplate = customTemplate || rekapPresensiTemplate || pdfTemplate || getSavedPresensiTemplate();
    const sortedList = [...list].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
    const resolvedLoc = getDynamicReportLocation(attendanceFilterGuru, sortedList);
    const cols = activeTemplate.tableColumns || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!;
    const labels = cols.customLabels || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!.customLabels!;

    let bulanTahunUpper = 'JULI 2026';
    let bulanTahunNormal = 'Juli 2026';

    if (sortedList.length > 0 && sortedList[0].tanggal && sortedList[0].tanggal.length >= 7) {
      const year = sortedList[0].tanggal.substring(0, 4);
      const mKey = sortedList[0].tanggal.substring(5, 7);
      const mName = MONTH_NAMES_MAP[mKey] || `Bulan ${mKey}`;
      bulanTahunUpper = `${mName.toUpperCase()} ${year}`;
      bulanTahunNormal = `${mName} ${year}`;
    }

    const totalHadir = sortedList.filter(a => a.status === 'Hadir' || !a.status || a.status === 'Hadir (Auto)').length;
    const summaryTextFormatted = formatPresensiSummaryText(activeTemplate.summaryTextFormat, bulanTahunNormal, totalHadir);
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Dynamic Columns definition matching PDF weights and alignments
    interface HtmlColDef {
      key: string;
      title: string;
      weight: number;
      align: 'left' | 'center' | 'right';
      getValue: (item: any, index: number) => string;
      pct?: number;
    }

    const allDefs: HtmlColDef[] = [
      { key: 'showNo', title: labels.no || 'No', weight: 8, align: 'center', getValue: (_, idx) => `${idx + 1}` },
      { key: 'showTanggal', title: labels.tanggal || 'Tanggal', weight: 18, align: 'center', getValue: (i) => i.tanggal || '-' },
      { key: 'showWaktu', title: labels.waktu || 'Waktu/Jam', weight: 14, align: 'center', getValue: (i) => i.jam || i.waktu || '-' },
      { key: 'showGuru', title: labels.guru || 'Nama Guru Pembimbing', weight: 36, align: 'left', getValue: (i) => formatGuruTitleAndName(i.guruNama, i.guruId) },
      { key: 'showHalaqah', title: labels.halaqah || 'Halaqah', weight: 18, align: 'left', getValue: (i) => i.halaqahNama || '-' },
      { key: 'showStatus', title: labels.status || 'Status Kehadiran', weight: 18, align: 'center', getValue: (i) => i.status || 'Hadir' },
      { key: 'showKeterangan', title: labels.keterangan || 'Keterangan / Detail', weight: 24, align: 'left', getValue: (i) => i.isAutoDetected ? `${i.setoranCount || 0} setoran` : (i.catatan || '-') },
      { key: 'showLokasi', title: labels.lokasi || 'Lokasi Mengajar', weight: 20, align: 'left', getValue: (i) => i.lokasi || resolvedLoc }
    ];

    const activeCols = allDefs.filter(d => (cols as any)[d.key] !== false);
    const finalCols = activeCols.length > 0 ? activeCols : allDefs.filter(d => ['showNo', 'showTanggal', 'showGuru', 'showStatus'].includes(d.key));
    const totalWeight = finalCols.reduce((sum, c) => sum + c.weight, 0);

    const colsWithPercent = finalCols.map(c => ({
      ...c,
      pct: Math.max(5, Math.round((c.weight / totalWeight) * 100))
    }));
    const sumPct = colsWithPercent.reduce((s, c) => s + c.pct, 0);
    if (colsWithPercent.length > 0 && sumPct !== 100) {
      colsWithPercent[colsWithPercent.length - 1].pct += (100 - sumPct);
    }

    // Table Rows
    const rowsHtml = sortedList.map((item, idx) => {
      return `
        <tr style="background-color: #ffffff;">
          ${colsWithPercent.map(c => `
            <td style="padding: 5px 6px; border: 1px solid #000000; text-align: ${c.align}; font-size: 8.5pt; color: #000000; font-family: Arial, Helvetica, sans-serif; font-weight: normal; vertical-align: top;">
              ${c.getValue(item, idx)}
            </td>
          `).join('')}
        </tr>
      `;
    }).join('');

    const tableBlockHtml = `
      <div style="margin-top: 10px; margin-bottom: 12px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; table-layout: fixed; mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-family: Arial, Helvetica, sans-serif;">
          <thead>
            <tr style="background-color: #ebede8; color: #000000;">
              ${colsWithPercent.map(c => `
                <th style="padding: 7px 5px; border: 1px solid #000000; font-size: 8.5pt; font-weight: bold; text-align: ${c.align}; color: #000000; width: ${c.pct}%; font-family: Arial, Helvetica, sans-serif; vertical-align: middle;">
                  ${c.title}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="${colsWithPercent.length}" style="text-align: center; padding: 15px; color: #666666; border: 1px solid #000000; font-size: 8.5pt;">Tidak ada data presensi.</td></tr>`}
          </tbody>
        </table>

        ${activeTemplate.showSummaryBelowTable !== false ? `
          <p style="margin: 8px 0 14px 0; font-size: 8.5pt; color: #000000; text-align: left; font-family: Arial, Helvetica, sans-serif;">
            ${summaryTextFormatted}
          </p>
        ` : ''}
      </div>
    `;

    const headerDim = await getWordImageDimensions(activeTemplate.headerImageBase64, 650, 120);
    const footerDim = await getWordImageDimensions(activeTemplate.footerImageBase64, 650, 90);
    const sigDim = await getWordImageDimensions(activeTemplate.signatureImageBase64, 140, 70);

    // Header HTML: Custom image if provided; otherwise standard institution vector header matching PDF
    let headerHtml = '';
    if (activeTemplate.headerImageBase64 && headerDim) {
      headerHtml = `<div style="text-align: center; margin: 0 0 12px 0; padding: 0;">
        <img src="${activeTemplate.headerImageBase64}" width="${headerDim.width}" height="${headerDim.height}" style="width: ${headerDim.width}px; max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Header Banner" />
      </div>`;
    } else {
      headerHtml = `
        <div style="margin: 0 0 14px 0; padding: 0;">
          <div style="height: 3.5px; background-color: #EAB308; width: 100%; font-size: 1px; line-height: 1px; margin-bottom: 8px;">&nbsp;</div>
          <table style="width: 100%; border-collapse: collapse; border: none; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
              <td style="width: 60%; border: none; vertical-align: middle; padding: 0;">
                <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                  <tr>
                    <td style="border: none; padding: 0 10px 0 0; vertical-align: middle;">
                      <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                        <tr>
                          <td style="border: none; width: 34px; height: 34px; background-color: #045B2A; border-radius: 50%; text-align: center; vertical-align: middle; color: #EAB308; font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; line-height: 34px;">&#9733;</td>
                        </tr>
                      </table>
                    </td>
                    <td style="border: none; padding: 0; vertical-align: middle;">
                      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8pt; font-weight: bold; color: #045B2A; letter-spacing: 0.8px; margin: 0 0 2px 0; text-transform: uppercase;">${institutionAbbr}</div>
                      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: bold; color: #045B2A; margin: 0; line-height: 1.1;">${institutionDisplayName}</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="width: 40%; border: none; vertical-align: middle; text-align: right; padding: 0;">
                <table style="border-collapse: collapse; border: none; margin-left: auto;">
                  <tr>
                    <td style="border: none; background-color: #EAB308; width: 6px; height: 26px; padding: 0;">&nbsp;</td>
                    <td style="border: none; background-color: #045B2A; color: #ffffff; padding: 6px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; font-weight: bold; text-align: center; white-space: nowrap; letter-spacing: 0.5px;">
                      ${activeTemplate.headerBadgeText || 'DIVISI PEMBINAAN AL-QURAN'}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    // Footer HTML: Custom image if provided; otherwise standard institution vector footer matching PDF
    let footerHtml = '';
    if (activeTemplate.footerImageBase64 && footerDim) {
      footerHtml = `<div style="text-align: center; margin: 18px 0 0 0; padding: 0;">
        <img src="${activeTemplate.footerImageBase64}" width="${footerDim.width}" height="${footerDim.height}" style="width: ${footerDim.width}px; max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Footer Banner" />
      </div>`;
    } else {
      footerHtml = `
        <div style="margin-top: 24px; padding: 0;">
          <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 4px;">
            <tr>
              <td style="width: 65%; border: none; padding: 0;">
                <table style="border-collapse: collapse; border: none;">
                  <tr>
                    <td style="border-top: 2px solid #EAB308; border-bottom: none; border-left: none; border-right: none; background-color: #045B2A; color: #ffffff; padding: 4px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; font-weight: bold; white-space: nowrap;">
                      ${activeTemplate.footerSocialText || 'Portal Manajemen Halaqah Al-Quran'}
                    </td>
                  </tr>
                </table>
              </td>
              <td style="width: 35%; border: none;"></td>
            </tr>
          </table>
          <div style="height: 3px; background-color: #EAB308; width: 100%; font-size: 1px; line-height: 1px;">&nbsp;</div>
        </div>
      `;
    }

    // Signature image HTML
    let signatureImgHtml = '';
    if (activeTemplate.signatureImageBase64 && sigDim) {
      signatureImgHtml = `<img src="${activeTemplate.signatureImageBase64}" width="${sigDim.width}" height="${sigDim.height}" style="max-height: 48px; width: auto; display: block; margin: 4px auto;" alt="Tanda Tangan" />`;
    } else {
      const defSigUri = generateDefaultSignaturePng();
      if (defSigUri) {
        signatureImgHtml = `<img src="${defSigUri}" width="160" height="48" style="width: 160px; height: 48px; display: block; margin: 4px auto;" alt="Tanda Tangan" />`;
      } else {
        signatureImgHtml = `<div style="border-bottom: 1.5px solid #141821; width: 140px; margin: 24px auto 8px auto;"></div>`;
      }
    }

    // Build the Title HTML block matching PDF exact typography
    const titleBlockHtml = `
      <div style="text-align: center; margin: 12px 0 16px 0;">
        <p style="margin: 0 0 4px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12pt; font-weight: bold; color: #000000; text-transform: uppercase; text-align: center; letter-spacing: 0.3px;">
          ${activeTemplate.documentTitle || 'REKAP PRESENSI HALAQAH AL-QURAN'}
        </p>
        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 9pt; font-weight: bold; color: #000000; text-transform: uppercase; text-align: center;">
          BULAN ${bulanTahunUpper} | TEMPAT : ${resolvedLoc}
        </p>
      </div>
    `;

    // Build the Custom Text Boxes HTML block:
    let textBoxesHtml = '';
    if (activeTemplate.textBoxes && activeTemplate.textBoxes.length > 0) {
      textBoxesHtml = `
        <div style="margin-bottom: 12px;">
          ${activeTemplate.textBoxes.map(tb => {
            if (tb.type === 'sub_judul') {
              return `<h3 style="text-align: ${tb.align || 'center'}; font-size: 10pt; font-weight: bold; color: #000000; margin: 4px 0; font-family: Arial, sans-serif;">${tb.content || tb.title || ''}</h3>`;
            } else if (tb.type === 'catatan') {
              return `<div style="background-color: #f5f7f5; border: 1px solid #045B2A; border-left: 4px solid #045B2A; padding: 6px 12px; margin: 6px 0; font-size: 8pt; color: #141414; text-align: ${tb.align || 'left'}; font-weight: ${tb.isBold ? 'bold' : 'normal'}; font-family: Arial, sans-serif; border-radius: 2px;">
                ${tb.title ? `<strong>${tb.title}</strong>: ` : ''}${tb.content}
              </div>`;
            } else {
              return `<p style="text-align: ${tb.align || 'left'}; font-size: 8.5pt; margin: 4px 0; font-weight: ${tb.isBold ? 'bold' : 'normal'}; color: #323232; font-family: Arial, sans-serif;">
                ${tb.title ? `<strong>${tb.title}</strong><br/>` : ''}${tb.content}
              </p>`;
            }
          }).join('')}
        </div>
      `;
    }

    const elementsOrder = activeTemplate.elementsOrder && activeTemplate.elementsOrder.length > 0
      ? activeTemplate.elementsOrder
      : ['title', 'textboxes', 'table'];

    const contentBlocksHtml = elementsOrder.map(elem => {
      if (elem === 'title') return titleBlockHtml;
      if (elem === 'textboxes') return textBoxesHtml;
      if (elem === 'table') return tableBlockHtml;
      return '';
    }).join('\n');

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8" />
        <title>${activeTemplate.documentTitle || 'REKAP PRESENSI HALAQAH AL-QURAN'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21.0cm 29.7cm;
            margin: 1.8cm 1.6cm 1.8cm 1.6cm;
            mso-header-margin: 0.3cm;
            mso-footer-margin: 0.3cm;
          }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin: 0; padding: 0; }
          table { border-collapse: collapse; width: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          th { font-size: 8.5pt; }
          td { font-size: 8.5pt; }
        </style>
      </head>
      <body>
        <div style="max-width: 720px; margin: 0 auto; padding: 5px 0;">
          ${headerHtml}

          ${contentBlocksHtml}

          <table style="width: 100%; margin-top: 20px; border-collapse: collapse; border: none; page-break-inside: avoid; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
              <td style="width: 55%; border: none;"></td>
              <td style="width: 45%; text-align: center; border: none; vertical-align: top;">
                ${activeTemplate.showSignatureDate ? `<p style="margin: 0 0 3px 0; font-size: 8.5pt; color: #000000; font-family: Arial, sans-serif;">${resolvedLoc}, ${todayStr}</p>` : ''}
                <p style="margin: 0 0 6px 0; font-weight: normal; font-size: 9.5pt; color: #000000; font-family: Arial, sans-serif;">${activeTemplate.penanggungjawabJabatan || 'Penanggungjawab Kegiatan'}</p>
                <div style="min-height: 48px; margin: 4px auto; text-align: center;">
                  ${signatureImgHtml}
                </div>
                <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 9.5pt; color: #000000; font-family: Arial, sans-serif; text-decoration: underline;">${activeTemplate.penanggungjawabNama || 'Koordinator Halaqah'}</p>
              </td>
            </tr>
          </table>
          
          ${footerHtml}
        </div>
      </body>
      </html>
    `;
  };

  const exportPresensiGuruToWord = async (name: string, list: any[]) => {
    setDownloading('Word');
    try {
      const htmlContent = await generateRekapPresensiGuruWordHtml(list);
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog('Export Word Presensi Guru', `Mengekspor presensi guru ${name} ke Word`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat mengekspor presensi guru ke Word: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const exportPresensiGuruToExcel = (name: string, list: any[]) => {
    setDownloading('Excel');
    try {
      const workbook = createPresensiGuruWorkbook(list);
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const xlsxBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(xlsxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      addLog('Export Excel', `Mengekspor presensi guru ${name} ke Excel`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat mengekspor ke Excel: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const exportPresensiGuruToPDF = (name: string, list: any[]) => {
    setDownloading('PDF');
    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal');
      generateRekapPresensiGuruPDF(doc, list);
      doc.save(`${name}.pdf`);
      addLog('Export PDF', `Mengekspor presensi guru ${name} ke PDF`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat mengekspor ke PDF: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const savePresensiGuruToGoogleDrive = async (fileName: string, type: 'PDF' | 'Excel' | 'Word' | 'Docs' | 'Sheet', list: any[]) => {
    const token = getGoogleAccessToken();
    if (!token) {
      setDriveAuthPrompt({ fileName, type });
      return;
    }
    
    setUploadingToDrive(fileName);
    try {
      let fileBlob: Blob;
      let mimeType = '';
      let extension = '';
      
      if (type === 'Excel' || type === 'Sheet') {
        mimeType = 'application/vnd.google-apps.spreadsheet';
        extension = 'xlsx';
        const workbook = createPresensiGuruWorkbook(list);
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        fileBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else if (type === 'Word' || type === 'Docs') {
        mimeType = 'application/vnd.google-apps.document';
        extension = 'doc';
        const htmlContent = await generateRekapPresensiGuruWordHtml(list);
        fileBlob = new Blob(['\ufeff', htmlContent], { type: 'text/html;charset=utf-8' });
      } else {
        mimeType = 'application/pdf';
        extension = 'pdf';
        const doc = new jsPDF();
        doc.setFont('Helvetica', 'normal');
        generateRekapPresensiGuruPDF(doc, list);
        fileBlob = doc.output('blob');
      }

      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      setDriveLocationTab('my_drive');
      setActiveSharedDriveId(null);
      setFolderSearchTerm('');
      setSearchResults([]);
      setCustomFileName(fileName);
      setDriveSaveItem({
        blob: fileBlob,
        mimeType: mimeType,
        extension: extension,
        defaultName: fileName
      });
      fetchDriveFolders('root');
      fetchSharedDrives();
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat menyiapkan unggahan ke Google Drive: ' + error.message);
    } finally {
      setIsFetchingFolders(false);
      setUploadingToDrive(null);
    }
  };

  // State aktif untuk Pratinjau Guru Bergantian & Pengiriman Multi-Guru
  const [presensiPreviewActiveGuruId, setPresensiPreviewActiveGuruId] = useState<string>('ALL');
  const [emailAttachTeacherMode, setEmailAttachTeacherMode] = useState<'PER_GURU' | 'COMBINED'>('PER_GURU');

  const generatePresensiDocumentBlob = async (format: 'PDF' | 'Excel' | 'Word', list: any[], targetGuruId?: string) => {
    let fileBlob: Blob;
    let mimeType = '';
    let extension = '';
    const baseName = getExportPresensiGuruFileName(targetGuruId);

    if (format === 'Excel') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
      const workbook = createPresensiGuruWorkbook(list);
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      fileBlob = new Blob([wbout], { type: mimeType });
    } else if (format === 'Word') {
      mimeType = 'application/msword';
      extension = 'doc';
      const htmlContent = await generateRekapPresensiGuruWordHtml(list);
      fileBlob = new Blob(['\ufeff', htmlContent], { type: 'text/html;charset=utf-8' });
    } else {
      mimeType = 'application/pdf';
      extension = 'pdf';
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal');
      generateRekapPresensiGuruPDF(doc, list);
      fileBlob = doc.output('blob');
    }

    return { blob: fileBlob, mimeType, extension, fileName: `${baseName}.${extension}` };
  };

  const openPresensiPreview = async (format: 'PDF' | 'Excel' | 'Word' = 'PDF', targetGuruId: string = 'ALL') => {
    const list = getFilteredPresensiGuruList(targetGuruId);
    if (list.length === 0) {
      alert('Tidak ada data presensi guru yang sesuai dengan filter saat ini.');
      return;
    }

    try {
      if (presensiPreviewData?.url) {
        URL.revokeObjectURL(presensiPreviewData.url);
      }
      const docInfo = await generatePresensiDocumentBlob(format, list, targetGuruId);
      const url = URL.createObjectURL(docInfo.blob);
      setPresensiPreviewActiveGuruId(targetGuruId);
      setPresensiPreviewData({
        url,
        blob: docInfo.blob,
        fileName: docInfo.fileName,
        list,
        format
      });
      // Pada HP / mobile, pastikan mode tampilan PDF adalah SHEET agar langsung terbuka tanpa placeholder "Buka"
      if (typeof window !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768)) {
        setPdfPreviewViewMode('SHEET');
      }
      setIsPresensiPreviewOpen(true);
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyiapkan pratinjau dokumen: ' + (err.message || err));
    }
  };

  // Berpindah melihat dokumen rekap guru secara bergantian dalam modal pratinjau
  const switchPresensiPreviewGuru = async (targetGuruId: string) => {
    const currentFormat = presensiPreviewData?.format || 'PDF';
    const list = getFilteredPresensiGuruList(targetGuruId);
    if (list.length === 0) {
      alert('Tidak ada data presensi untuk guru ini pada periode terpilih.');
      return;
    }
    try {
      if (presensiPreviewData?.url) {
        URL.revokeObjectURL(presensiPreviewData.url);
      }
      const docInfo = await generatePresensiDocumentBlob(currentFormat, list, targetGuruId);
      const url = URL.createObjectURL(docInfo.blob);
      setPresensiPreviewActiveGuruId(targetGuruId);
      setPresensiPreviewData({
        url,
        blob: docInfo.blob,
        fileName: docInfo.fileName,
        list,
        format: currentFormat
      });
    } catch (err: any) {
      console.error(err);
      alert('Gagal berganti pratinjau guru: ' + (err.message || err));
    }
  };

  const closePresensiPreview = () => {
    if (presensiPreviewData?.url) {
      URL.revokeObjectURL(presensiPreviewData.url);
    }
    setPresensiPreviewData(null);
    setIsPresensiPreviewOpen(false);
  };

  const generateSetoranDocumentBlob = async (format: 'PDF' | 'Excel' | 'Word', list: Setoran[] = displayLogs) => {
    let fileBlob: Blob;
    let mimeType = '';
    let extension = '';
    const baseName = getExportFileName();

    if (format === 'Excel') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
      const worksheetData = list.map((s, index) => ({
        'No': index + 1,
        'Tanggal': s.tanggalSetoran,
        'Nama Santri': s.siswaNama,
        'Materi Setoran / Juz / Surah': formatSetoranMateriDetail(s),
        'Nilai': s.nilai,
        'Status': s.statusLulus ? 'Lulus' : 'Mengulang',
        'Catatan Guru': s.catatanGuru || '-'
      }));
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Setoran Santri');
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      fileBlob = new Blob([wbout], { type: mimeType });
    } else if (format === 'Word') {
      mimeType = 'application/msword';
      extension = 'doc';
      const htmlContent = await generateSetoranWordHtml(list);
      fileBlob = new Blob(['\ufeff', htmlContent], { type: 'text/html;charset=utf-8' });
    } else {
      mimeType = 'application/pdf';
      extension = 'pdf';
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal');
      generateRekapSetoranPDF(doc);
      fileBlob = doc.output('blob');
    }

    return { blob: fileBlob, mimeType, extension, fileName: `${baseName}.${extension}` };
  };

  const applyEmailSubjectAndBody = (incGuru: boolean, incSantri: boolean) => {
    const list = getFilteredPresensiGuruList();
    const santriBaseName = getExportFileName().replace(/_/g, ' ');
    const activeGurus = previewAvailableGurus;
    const isMultiGuru = activeGurus.length > 1;

    let guruHeaderDesc = '';
    let subjPrefix = '';

    if (isMultiGuru) {
      const guruNames = activeGurus.map(g => g.name).slice(0, 3).join(', ') + (activeGurus.length > 3 ? ` dkk. (${activeGurus.length} Guru)` : ` (${activeGurus.length} Guru)`);
      subjPrefix = `${activeGurus.length} Guru (${guruNames})`;
      guruHeaderDesc = `Laporan Rekapitulasi Presensi & Kehadiran ${activeGurus.length} Guru Pembimbing:\n` +
        activeGurus.map((g, idx) => `   ${idx + 1}. ${g.name} (${g.count} data presensi)`).join('\n');
    } else if (activeGurus.length === 1) {
      subjPrefix = activeGurus[0].name;
      guruHeaderDesc = `Laporan Rekapitulasi Presensi & Kehadiran Guru: ${activeGurus[0].name} (${list.length} data presensi)`;
    } else {
      subjPrefix = 'Semua Guru';
      guruHeaderDesc = `Laporan Rekapitulasi Presensi & Kehadiran Seluruh Guru (${list.length} data presensi)`;
    }

    if (incGuru && incSantri) {
      const subj = `[Laporan Gabungan Halaqah] Presensi ${subjPrefix} & Setoran Santri - ${attendanceFilterYear || new Date().getFullYear()}`;
      const body = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nYth. Pimpinan / Kepala Divisi,\n\nBersama email ini, kami sampaikan 2 (dua) jenis dokumen laporan resmi Halaqah Al-Quran:\n\n1. ${guruHeaderDesc}\n\n2. Laporan Rekapitulasi Mutabaah & Capaian Setoran Santri\n   - Periode: ${santriBaseName}\n   - Total Riwayat Setoran Tercatat: ${displayLogs.length} data setoran santri\n\nSeluruh dokumen resmi terlampir pada email ini dalam format siap periksa dan rekapitulasi data.\n\nMohon arahan dan konfirmasi apabila terdapat hal yang perlu disesuaikan.\nJazakumullahu khairan wa barakallahu fiikum.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\nBagian Administrasi Halaqah & Presensi`;
      setEmailFormSubject(subj);
      setEmailFormBody(body);
    } else if (incSantri) {
      const subj = `[Laporan Mutabaah Santri] Rekapitulasi Capaian Setoran Santri - ${santriBaseName}`;
      const body = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nYth. Pimpinan / Kepala Divisi,\n\nBersama email ini, kami sampaikan dokumen Rekapitulasi Capaian Setoran & Mutabaah Santri Halaqah.\n\nRincian Laporan:\n- Periode: ${santriBaseName}\n- Total Riwayat Setoran Tercatat: ${displayLogs.length} data setoran santri\n\nDokumen resmi terlampir pada email ini untuk diperiksa dan dicek kesesuaiannya.\n\nMohon arahan dan konfirmasi apabila terdapat hal yang perlu disesuaikan.\nJazakumullahu khairan wa barakallahu fiikum.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\nBagian Administrasi Halaqah & Mutabaah Santri`;
      setEmailFormSubject(subj);
      setEmailFormBody(body);
    } else {
      const subj = `[Laporan Presensi Guru] Rekapitulasi Kehadiran ${subjPrefix} - ${attendanceFilterYear || new Date().getFullYear()}`;
      const body = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nYth. Pimpinan / Kepala Divisi,\n\nBersama email ini, kami sampaikan dokumen Rekapitulasi Presensi & Kehadiran Guru Pembimbing Halaqah.\n\nRincian Laporan:\n- ${guruHeaderDesc}\n\nDokumen resmi masing-masing guru terlampir pada email ini untuk diperiksa dan dicek kesesuaiannya.\n\nMohon arahan dan konfirmasi apabila terdapat hal yang perlu disesuaikan.\nJazakumullahu khairan wa barakallahu fiikum.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh,\nBagian Administrasi Halaqah & Presensi Guru`;
      setEmailFormSubject(subj);
      setEmailFormBody(body);
    }
  };

  const openPresensiEmailModal = (format: 'PDF' | 'Excel' | 'Word' = 'PDF', alsoIncludeSantri: boolean = false) => {
    const list = getFilteredPresensiGuruList();
    if (list.length === 0 && !alsoIncludeSantri) {
      alert('Tidak ada data presensi guru yang sesuai dengan filter saat ini.');
      return;
    }

    setIncludeLaporanGuru(true);
    setIncludeLaporanSantri(alsoIncludeSantri);
    setSelectedAttachmentFormats([format]);
    setEmailSendStatus({ type: null, message: '' });
    setEmailInputTo('');
    setEmailInputCc('');
    applyEmailSubjectAndBody(true, alsoIncludeSantri);
    setIsPresensiEmailModalOpen(true);
  };

  const handleSendPresensiEmail = async () => {
    // Validasi pemilihan laporan
    if (!includeLaporanGuru && !includeLaporanSantri) {
      setEmailSendStatus({ type: 'error', message: 'Silakan pilih minimal 1 jenis laporan (Presensi Guru atau Mutabaah Santri) untuk dikirim.' });
      return;
    }

    if (selectedAttachmentFormats.length === 0) {
      setEmailSendStatus({ type: 'error', message: 'Pilih minimal 1 format berkas lampiran (PDF / Excel / Word).' });
      return;
    }

    // Commit any uncommitted text in the input fields
    const uncommittedTo = parseEmailsFromString(emailInputTo);
    const combinedTo = [...emailToRecipients, ...uncommittedTo];
    const uniqueTo = Array.from(new Set(combinedTo.map(e => e.trim()))).filter(e => isValidEmailAddress(e));

    if (uniqueTo.length === 0) {
      setEmailSendStatus({ type: 'error', message: 'Alamat email tujuan (To) wajib diisi dengan minimal 1 alamat email yang valid.' });
      return;
    }

    const uncommittedCc = parseEmailsFromString(emailInputCc);
    const combinedCc = [...emailCcRecipients, ...uncommittedCc];
    const uniqueCc = Array.from(new Set(combinedCc.map(e => e.trim()))).filter(e => isValidEmailAddress(e));

    const list = getFilteredPresensiGuruList();

    setIsSendingEmail(true);
    setEmailSendStatus({ type: null, message: '' });

    try {
      let token = getGoogleAccessToken();
      if (!token) {
        token = await signInWithGoogleWorkspace(user?.role || UserRole.ADMIN);
      }
      if (!token) {
        throw new Error('Akses Google Workspace / Gmail diperlukan untuk mengirim email.');
      }

      // 1. Generate all requested documents
      const attachmentsToBuild: Array<{ blob: Blob; mimeType: string; extension: string; fileName: string; reportType: string }> = [];

      if (includeLaporanGuru) {
        // Jika mode multi-guru per guru aktif dan ada lebih dari 1 guru:
        if (emailAttachTeacherMode === 'PER_GURU' && previewAvailableGurus.length > 1) {
          for (const g of previewAvailableGurus) {
            const teacherRecords = getFilteredPresensiGuruList(g.id);
            if (teacherRecords.length > 0) {
              for (const fmt of selectedAttachmentFormats) {
                const docInfo = await generatePresensiDocumentBlob(fmt, teacherRecords, g.id);
                attachmentsToBuild.push({ ...docInfo, reportType: `Presensi Guru (${g.name})` });
              }
            }
          }
        } else {
          // Dokumen gabungan seluruh guru
          for (const fmt of selectedAttachmentFormats) {
            const docInfo = await generatePresensiDocumentBlob(fmt, list);
            attachmentsToBuild.push({ ...docInfo, reportType: 'Presensi Guru' });
          }
        }
      }

      if (includeLaporanSantri) {
        for (const fmt of selectedAttachmentFormats) {
          const docInfo = await generateSetoranDocumentBlob(fmt, displayLogs);
          attachmentsToBuild.push({ ...docInfo, reportType: 'Mutabaah Santri' });
        }
      }

      if (attachmentsToBuild.length === 0) {
        setEmailSendStatus({ type: 'error', message: 'Tidak ada berkas laporan yang dapat dilampirkan.' });
        return;
      }

      // 2. Construct RFC 2822 Multipart MIME Message
      const boundary = `__presensi_boundary_${Date.now()}__`;
      const htmlContent = formatEmailBodyToHtml(emailFormBody);

      // Encode HTML body in base64 (with UTF-8 support)
      const base64Html = btoa(unescape(encodeURIComponent(htmlContent)))
        .match(/.{1,76}/g)?.join('\r\n') || btoa(unescape(encodeURIComponent(htmlContent)));

      const CRLF = '\r\n';
      let mimeMessage = '';
      mimeMessage += `To: ${uniqueTo.join(', ')}${CRLF}`;
      if (uniqueCc.length > 0) {
        mimeMessage += `Cc: ${uniqueCc.join(', ')}${CRLF}`;
      }
      mimeMessage += `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(emailFormSubject.trim())))}?=${CRLF}`;
      mimeMessage += `MIME-Version: 1.0${CRLF}`;
      mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"${CRLF}`;
      mimeMessage += CRLF; // Mandatory blank line separating message headers from body

      // Part 1: HTML Body
      mimeMessage += `--${boundary}${CRLF}`;
      mimeMessage += `Content-Type: text/html; charset="UTF-8"${CRLF}`;
      mimeMessage += `Content-Transfer-Encoding: base64${CRLF}`;
      mimeMessage += CRLF; // Mandatory blank line separating part headers from part content
      mimeMessage += `${base64Html}${CRLF}`;

      // Parts 2..N: Attachments
      for (const att of attachmentsToBuild) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || '';
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(att.blob);
        });

        const safeFileName = att.fileName.replace(/["\r\n]/g, '').trim();
        const chunkedAttachment = base64Data.match(/.{1,76}/g)?.join('\r\n') || base64Data;

        mimeMessage += `--${boundary}${CRLF}`;
        mimeMessage += `Content-Type: ${att.mimeType}; name="${safeFileName}"${CRLF}`;
        mimeMessage += `Content-Disposition: attachment; filename="${safeFileName}"${CRLF}`;
        mimeMessage += `Content-Transfer-Encoding: base64${CRLF}`;
        mimeMessage += CRLF;
        mimeMessage += `${chunkedAttachment}${CRLF}`;
      }

      // Closing boundary
      mimeMessage += `--${boundary}--${CRLF}`;

      // 4. Encode to Base64URL for Gmail API
      const uint8 = new TextEncoder().encode(mimeMessage);
      let binary = '';
      const len = uint8.byteLength;
      const chunkSize = 32768;
      for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize) as any);
      }
      const raw = btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 5. Send via Gmail API
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          // Token expired, attempt reauth
          const newToken = await signInWithGoogleWorkspace(user?.role || UserRole.ADMIN);
          if (newToken) {
            const retryRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ raw })
            });
            if (retryRes.ok) {
              finishSendSuccess(attachmentsToBuild.map(a => a.fileName), uniqueTo);
              return;
            }
          }
        }
        throw new Error(errorData?.error?.message || `Gagal mengirim email (Status ${res.status})`);
      }

      finishSendSuccess(attachmentsToBuild.map(a => a.fileName), uniqueTo);
    } catch (err: any) {
      console.error('Error sending presensi email:', err);
      setEmailSendStatus({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat mengirim email.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const finishSendSuccess = (fileNames: string | string[], toList: string[]) => {
    const toSummary = toList.length === 1 
      ? toList[0] 
      : `${toList.length} penerima (${toList.join(', ')})`;
    const fileList = Array.isArray(fileNames) ? fileNames : [fileNames];
    const fileSummary = fileList.length === 1
      ? `dokumen lampiran (${fileList[0]})`
      : `${fileList.length} berkas laporan (${fileList.join(', ')})`;

    setEmailSendStatus({
      type: 'success',
      message: `Email dan ${fileSummary} berhasil dikirim ke ${toSummary}!`
    });
    addLog('Kirim Email', `Mengirim ${fileSummary} ke ${toSummary}`);

    // Auto-save recipients into quick contacts history
    let updatedQuick = [...quickRecipients];
    let changed = false;
    for (const em of toList) {
      if (!updatedQuick.some(q => q.email.toLowerCase() === em.toLowerCase())) {
        updatedQuick.push({ label: em.split('@')[0], email: em });
        changed = true;
      }
    }
    if (changed) {
      setQuickRecipients(updatedQuick);
      try {
        localStorage.setItem('mh_presensi_quick_recipients', JSON.stringify(updatedQuick));
      } catch {}
    }
  };

  const handleSaveQuickRecipient = () => {
    if (!newRecipientEmail.trim() || !newRecipientLabel.trim()) {
      alert('Label kontak dan alamat email wajib diisi.');
      return;
    }
    const updated = [...quickRecipients, { label: newRecipientLabel.trim(), email: newRecipientEmail.trim() }];
    setQuickRecipients(updated);
    try {
      localStorage.setItem('mh_presensi_quick_recipients', JSON.stringify(updated));
    } catch {}
    setNewRecipientLabel('');
    setNewRecipientEmail('');
    setIsAddingRecipient(false);
  };

  const handleRemoveQuickRecipient = (index: number) => {
    const updated = quickRecipients.filter((_, i) => i !== index);
    setQuickRecipients(updated);
    try {
      localStorage.setItem('mh_presensi_quick_recipients', JSON.stringify(updated));
    } catch {}
  };

  const handleConnectDriveAndSave = async (fileName: string, type: 'PDF' | 'Excel' | 'Word' | 'Docs' | 'Sheet') => {
    try {
      const token = await signInWithGoogleWorkspace(user?.role || UserRole.ADMIN);
      if (token) {
        setDriveAuthPrompt(null);
        // Small delay to allow the popup to close cleanly
        setTimeout(() => {
          if (activeSubTab === 'presensi_guru') {
            savePresensiGuruToGoogleDrive(fileName, type, getFilteredPresensiGuruList());
          } else {
            saveToGoogleDrive(fileName, type);
          }
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert(
          `Gagal menghubungkan Google Drive (${err?.message || 'Error'}).\n\n` +
          `Penyebab Umum (Error 403: access_denied):\n` +
          `Project Google Cloud saat ini berada dalam status 'Testing' (Pengujian). Email '${user?.email || 'email-anda@example.com'}' perlu ditambahkan ke daftar 'Test Users' pada Google Cloud Console > APIs & Services > OAuth consent screen.\n\n` +
          `Anda tetap dapat mengunduh file laporan langsung ke perangkat lokal melalui tombol 'Unduh File ke Perangkat Lokal'.`
        );
      }
    }
  };

  const saveToGoogleDrive = async (fileName: string, type: 'PDF' | 'Excel' | 'Word' | 'Docs' | 'Sheet') => {
    const token = getGoogleAccessToken();
    if (!token) {
      setDriveAuthPrompt({ fileName, type });
      return;
    }
    
    setUploadingToDrive(fileName);
    try {
      let fileBlob: Blob;
      let mimeType = '';
      let extension = '';
      
      if (type === 'Excel' || type === 'Sheet') {
        mimeType = 'application/vnd.google-apps.spreadsheet';
        extension = 'xlsx';
        let worksheetData = displayLogs.map((s, index) => ({
          'No': index + 1,
          'Tanggal': s.tanggalSetoran,
          'Nama Santri': s.siswaNama,
          'Materi Setoran / Juz / Surah': formatSetoranMateriDetail(s),
          'Nilai': s.nilai,
          'Status': s.statusLulus ? 'Lulus' : 'Mengulang',
          'Catatan Guru': s.catatanGuru || '-'
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Data');
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        fileBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
      } else if (type === 'Word' || type === 'Docs') {
        mimeType = 'application/vnd.google-apps.document';
        extension = 'doc';
        const htmlContent = await generateSetoranWordHtml(displayLogs);
        fileBlob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
      } else {
        mimeType = 'application/pdf';
        extension = 'pdf';
        const doc = new jsPDF();
        doc.setFont('Helvetica', 'normal');
        generateRekapSetoranPDF(doc);
        fileBlob = doc.output('blob');
      }

      // Instead of direct saving, open the Folder & Filename Selector Modal
      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      setDriveLocationTab('my_drive');
      setActiveSharedDriveId(null);
      setFolderSearchTerm('');
      setSearchResults([]);
      setCustomFileName(fileName);
      setDriveSaveItem({
        blob: fileBlob,
        mimeType: mimeType,
        extension: extension,
        defaultName: fileName
      });
      fetchDriveFolders('root');
      fetchSharedDrives();

    } catch (err: any) {
      console.error(err);
      alert('Kesalahan saat menyiapkan file: ' + err.message);
    } finally {
      setUploadingToDrive(null);
    }
  };

  // Fetch Shared Drives (Drive Bersama) for Google Workspace
  const fetchSharedDrives = async () => {
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsFetchingSharedDrives(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/drives?pageSize=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSharedDrivesList(data.drives || []);
      }
    } catch (err) {
      console.warn('Gagal memuat Drive Bersama:', err);
    } finally {
      setIsFetchingSharedDrives(false);
    }
  };

  const fetchDriveFolders = async (parentId: string = 'root', sharedDriveId?: string) => {
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsFetchingFolders(true);
    try {
      const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=100&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      
      if (sharedDriveId) {
        url += `&corpora=drive&driveId=${encodeURIComponent(sharedDriveId)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        // Fallback without corpora if the user role does not require corpora param
        const fallbackUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=100&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        const fbRes = await fetch(fallbackUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          setDriveFolders(fbData.files || []);
          return;
        }
        throw new Error('Gagal mengambil list folder dari Google Drive');
      }
      const data = await response.json();
      setDriveFolders(data.files || []);
    } catch (err: any) {
      console.error(err);
      setDriveFolders([]);
    } finally {
      setIsFetchingFolders(false);
    }
  };

  const handleSearchFolders = async (term: string) => {
    setFolderSearchTerm(term);
    if (!term.trim() || term.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsSearchingFolders(true);
    try {
      const cleanTerm = term.replace(/'/g, "\\'");
      const q = `mimeType = 'application/vnd.google-apps.folder' and name contains '${cleanTerm}' and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=50&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.files || []);
      }
    } catch (err) {
      console.warn('Gagal mencari folder:', err);
    } finally {
      setIsSearchingFolders(false);
    }
  };

  const handleSwitchDriveTab = (tab: 'my_drive' | 'shared_drives') => {
    setDriveLocationTab(tab);
    setFolderSearchTerm('');
    setSearchResults([]);
    if (tab === 'my_drive') {
      setActiveSharedDriveId(null);
      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      fetchDriveFolders('root');
    } else {
      setActiveSharedDriveId(null);
      setCurrentFolderId('');
      setFolderPath([{ id: 'shared_root', name: 'Drive Bersama' }]);
      setDriveFolders([]);
      fetchSharedDrives();
    }
  };

  const handleSelectSharedDrive = (drive: { id: string; name: string }) => {
    setActiveSharedDriveId(drive.id);
    setCurrentFolderId(drive.id);
    setFolderPath([
      { id: 'shared_root', name: 'Drive Bersama' },
      { id: drive.id, name: drive.name }
    ]);
    fetchDriveFolders(drive.id, drive.id);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Nama folder tidak boleh kosong!');
      return;
    }
    const token = getGoogleAccessToken();
    if (!token) return;
    if (driveLocationTab === 'shared_drives' && !activeSharedDriveId && currentFolderId === '') {
      alert('Silakan pilih salah satu Drive Bersama terlebih dahulu sebelum membuat folder.');
      return;
    }
    setIsCreatingFolder(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId || activeSharedDriveId || 'root']
        })
      });
      if (response.ok) {
        setNewFolderName('');
        fetchDriveFolders(currentFolderId, activeSharedDriveId || undefined);
      } else {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Gagal membuat folder di Google Drive');
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat folder: ' + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleStepBackFolder = (folderId: string, idx: number) => {
    setFolderPath(prev => prev.slice(0, idx + 1));
    setFolderSearchTerm('');
    setSearchResults([]);

    if (driveLocationTab === 'shared_drives') {
      if (idx === 0) {
        // Back to list of all Shared Drives
        setActiveSharedDriveId(null);
        setCurrentFolderId('');
        setDriveFolders([]);
        fetchSharedDrives();
        return;
      }
      if (idx === 1) {
        // At the root of the active Shared Drive
        setCurrentFolderId(folderId);
        fetchDriveFolders(folderId, activeSharedDriveId || folderId);
        return;
      }
    }

    setCurrentFolderId(folderId);
    fetchDriveFolders(folderId, activeSharedDriveId || undefined);
  };

  const handleSelectFolder = (folder: { id: string; name: string }) => {
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setFolderSearchTerm('');
    setSearchResults([]);
    fetchDriveFolders(folder.id, activeSharedDriveId || undefined);
  };

  const handleSelectSearchResult = (folder: { id: string; name: string }) => {
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setFolderSearchTerm('');
    setSearchResults([]);
    fetchDriveFolders(folder.id, activeSharedDriveId || undefined);
  };

  const attachHeaderFooterToGoogleDoc = async (
    fileId: string,
    token: string,
    activeTemplate: RekapPresensiPdfTemplate,
    folderId?: string
  ) => {
    try {
      // 1. Create Default Header and Footer in Google Docs document via Docs API
      const batchReqRes = await fetch(`https://www.googleapis.com/docs/v1/documents/${fileId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            { createHeader: { type: 'DEFAULT' } },
            { createFooter: { type: 'DEFAULT' } }
          ]
        })
      });

      if (!batchReqRes.ok) {
        console.warn('Could not create header/footer sections via Docs API');
        return;
      }

      const batchData = await batchReqRes.json();
      const replies = batchData.replies || [];
      let headerId = '';
      let footerId = '';

      replies.forEach((r: any) => {
        if (r.createHeader?.headerId) headerId = r.createHeader.headerId;
        if (r.createFooter?.footerId) footerId = r.createFooter.footerId;
      });

      // Helper to upload base64 image to Google Drive as an accessible file for Google Docs API
      const uploadImageToDriveForDocs = async (base64Str: string, name: string): Promise<string | null> => {
        try {
          if (!base64Str || !base64Str.startsWith('data:image')) return null;
          
          const arr = base64Str.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/png';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const imgBlob = new Blob([u8arr], { type: mime });

          const parents = folderId && folderId !== 'root' ? [folderId] : undefined;
          const imgCreateRes = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `${name}_${Date.now()}.png`,
              mimeType: mime,
              ...(parents && { parents })
            })
          });
          if (!imgCreateRes.ok) return null;
          const imgData = await imgCreateRes.json();
          const imgFileId = imgData.id;

          const imgUploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${imgFileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': mime
            },
            body: imgBlob
          });
          if (!imgUploadRes.ok) return null;

          await fetch(`https://www.googleapis.com/drive/v3/files/${imgFileId}/permissions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' })
          }).catch(() => {});

          return `https://lh3.googleusercontent.com/d/${imgFileId}`;
        } catch (e) {
          console.error('Failed uploading header/footer image asset to Drive for Docs:', e);
          return null;
        }
      };

      const docRequests: any[] = [];

      // 2. Insert Header Image or Text directly into native Header
      if (headerId) {
        if (activeTemplate.headerImageBase64) {
          const headerImgUri = await uploadImageToDriveForDocs(activeTemplate.headerImageBase64, 'header_kop');
          if (headerImgUri) {
            docRequests.push({
              insertInlineImage: {
                uri: headerImgUri,
                location: { segmentId: headerId, index: 0 },
                objectSize: {
                  width: { magnitude: 468, unit: 'PT' }
                }
              }
            });
          }
        } else if (activeTemplate.headerBadgeText) {
          docRequests.push({
            insertText: {
              text: `${activeTemplate.headerBadgeText}\n`,
              location: { segmentId: headerId, index: 0 }
            }
          });
        }
      }

      // 3. Insert Footer Image or Text directly into native Footer
      if (footerId) {
        if (activeTemplate.footerImageBase64) {
          const footerImgUri = await uploadImageToDriveForDocs(activeTemplate.footerImageBase64, 'footer_kop');
          if (footerImgUri) {
            docRequests.push({
              insertInlineImage: {
                uri: footerImgUri,
                location: { segmentId: footerId, index: 0 },
                objectSize: {
                  width: { magnitude: 468, unit: 'PT' }
                }
              }
            });
          }
        } else if (activeTemplate.footerSocialText) {
          docRequests.push({
            insertText: {
              text: `${activeTemplate.footerSocialText}\n`,
              location: { segmentId: footerId, index: 0 }
            }
          });
        }
      }

      if (docRequests.length > 0) {
        await fetch(`https://www.googleapis.com/docs/v1/documents/${fileId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests: docRequests })
        });
      }
    } catch (err) {
      console.error('Error attaching native Header/Footer to Google Doc:', err);
    }
  };

  const handleReauthDrive = async () => {
    try {
      const newToken = await signInWithGoogleWorkspace(user?.role || UserRole.ADMIN);
      if (newToken) {
        fetchDriveFolders(currentFolderId || 'root', activeSharedDriveId || undefined);
        fetchSharedDrives();
        alert('Akun Google berhasil dihubungkan ulang. Silakan pilih folder dan simpan kembali.');
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Gagal menghubungkan akun Google: ' + (err?.message || 'Error'));
      }
    }
  };

  const executeUploadToDrive = async () => {
    if (!driveSaveItem) return;
    const token = getGoogleAccessToken();
    if (!token) {
      alert('Token akses Google Drive tidak ditemukan atau sesi telah berakhir. Silakan hubungkan kembali akun Google Anda.');
      return;
    }

    setUploadingToDrive(driveSaveItem.defaultName);
    try {
      const finalName = customFileName.trim() 
        ? (customFileName.endsWith(`.${driveSaveItem.extension}`) ? customFileName : `${customFileName}.${driveSaveItem.extension}`)
        : `${driveSaveItem.defaultName}_${new Date().toISOString().slice(0, 10)}.${driveSaveItem.extension}`;

      // Parent constraint: if currentFolderId is not 'root' and not empty, specify parents array
      const parents = currentFolderId && currentFolderId !== 'root' && currentFolderId !== 'shared_root' ? [currentFolderId] : undefined;

      // Case 1: Google Docs Conversion (HTML to native Google Docs document)
      if (driveSaveItem.mimeType === 'application/vnd.google-apps.document') {
        const docName = finalName.replace(/\.doc$/i, '');
        const boundary = '-------HalaqahDriveMultipartDoc' + Date.now();

        const metadata = {
          name: docName,
          mimeType: 'application/vnd.google-apps.document',
          description: `Disimpan dari Portal HalaqahMonitor oleh Admin`,
          ...(parents && { parents })
        };

        const htmlText = typeof driveSaveItem.blob.text === 'function'
          ? await driveSaveItem.blob.text()
          : await new Response(driveSaveItem.blob).text();

        let createdSuccessfully = false;

        // Try standard multipart conversion first to create native Google Doc
        try {
          const multipartBody = new Blob([
            `--${boundary}\r\n`,
            'Content-Type: application/json; charset=UTF-8\r\n\r\n',
            JSON.stringify(metadata),
            `\r\n--${boundary}\r\n`,
            'Content-Type: text/html; charset=UTF-8\r\n\r\n',
            htmlText,
            `\r\n--${boundary}--\r\n`
          ]);

          const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
          });

          if (uploadRes.status === 401) {
            localStorage.removeItem('mh_google_access_token');
            localStorage.removeItem('mh_google_access_token_expiry');
            throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
          }

          if (uploadRes.ok) {
            createdSuccessfully = true;
          } else {
            console.warn('Multipart Google Docs upload failed, trying 2-step Word upload fallback');
          }
        } catch (multipartErr: any) {
          if (multipartErr.message?.includes('Sesi Google Drive telah berakhir')) {
            throw multipartErr;
          }
          console.warn('Multipart upload encountered network or CORS issue, proceeding to fallback:', multipartErr);
        }

        // Fallback: If multipart conversion wasn't available in this browser/network context,
        // create a Word document (.doc) via 2-step upload which Google Drive natively opens with Google Docs
        if (!createdSuccessfully) {
          const wordFileName = finalName.endsWith('.doc') ? finalName : `${finalName}.doc`;
          const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: wordFileName,
              mimeType: 'application/msword',
              description: `Disimpan dari Portal HalaqahMonitor oleh Admin`,
              ...(parents && { parents })
            })
          });

          if (createRes.status === 401) {
            localStorage.removeItem('mh_google_access_token');
            localStorage.removeItem('mh_google_access_token_expiry');
            throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
          }

          if (!createRes.ok) {
            const errData = await createRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Gagal membuat metadata file di Google Drive');
          }

          const fileData = await createRes.json();
          const fileId = fileData.id;

          const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/msword'
            },
            body: driveSaveItem.blob
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Gagal mengunggah konten dokumen ke Google Drive');
          }
        }

        alert(`Sukses! Dokumen "${docName}" berhasil dibuat dan disimpan ke Google Drive.`);
        setDriveSaveItem(null);
        return;
      }

      // Case 2: Google Spreadsheet Conversion (xlsx to native Google Sheets or direct XLSX)
      if (driveSaveItem.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const sheetName = finalName.replace(/\.xlsx$/i, '');
        const boundary = '-------HalaqahDriveMultipartSheet' + Date.now();

        const metadata = {
          name: sheetName,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          description: `Disimpan dari Portal HalaqahMonitor oleh Admin`,
          ...(parents && { parents })
        };

        let createdSuccessfully = false;

        // Try multipart conversion first to create native Google Sheet
        try {
          const multipartBody = new Blob([
            `--${boundary}\r\n`,
            'Content-Type: application/json; charset=UTF-8\r\n\r\n',
            JSON.stringify(metadata),
            `\r\n--${boundary}\r\n`,
            'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n',
            driveSaveItem.blob,
            `\r\n--${boundary}--\r\n`
          ]);

          const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
          });

          if (uploadRes.status === 401) {
            localStorage.removeItem('mh_google_access_token');
            localStorage.removeItem('mh_google_access_token_expiry');
            throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
          }

          if (uploadRes.ok) {
            createdSuccessfully = true;
          } else {
            console.warn('Multipart Google Sheet upload failed, trying 2-step XLSX upload fallback');
          }
        } catch (multipartErr: any) {
          if (multipartErr.message?.includes('Sesi Google Drive telah berakhir')) {
            throw multipartErr;
          }
          console.warn('Multipart upload encountered network/CORS issue, proceeding to fallback:', multipartErr);
        }

        // Fallback: 2-step direct Excel (.xlsx) upload
        if (!createdSuccessfully) {
          const xlsxFileName = finalName.endsWith('.xlsx') ? finalName : `${finalName}.xlsx`;
          const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: xlsxFileName,
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              description: `Disimpan dari Portal HalaqahMonitor oleh Admin`,
              ...(parents && { parents })
            })
          });

          if (createRes.status === 401) {
            localStorage.removeItem('mh_google_access_token');
            localStorage.removeItem('mh_google_access_token_expiry');
            throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
          }

          if (!createRes.ok) {
            const errData = await createRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Gagal membuat file spreadsheet di Google Drive');
          }

          const fileData = await createRes.json();
          const fileId = fileData.id;

          const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            body: driveSaveItem.blob
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Gagal mengunggah konten spreadsheet ke Google Drive');
          }
        }

        alert(`Sukses! Berkas spreadsheet "${sheetName}" berhasil disimpan ke Google Drive.`);
        setDriveSaveItem(null);
        return;
      }

      // Case 3: Binary file upload (e.g. PDF)
      // Use standard, reliable 2-step Drive API upload
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: finalName,
          mimeType: driveSaveItem.mimeType || 'application/pdf',
          description: `Disimpan dari Portal HalaqahMonitor oleh Admin`,
          ...(parents && { parents })
        })
      });

      if (createRes.status === 401) {
        localStorage.removeItem('mh_google_access_token');
        localStorage.removeItem('mh_google_access_token_expiry');
        throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
      }

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Gagal membuat berkas di Google Drive');
      }

      const fileData = await createRes.json();
      const fileId = fileData.id;

      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': driveSaveItem.mimeType || 'application/pdf'
        },
        body: driveSaveItem.blob
      });

      if (uploadRes.status === 401) {
        localStorage.removeItem('mh_google_access_token');
        localStorage.removeItem('mh_google_access_token_expiry');
        throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
      }

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Gagal mengunggah konten berkas ke Google Drive');
      }

      alert(`Sukses! Berkas "${finalName}" berhasil disimpan ke Google Drive.`);
      setDriveSaveItem(null);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        alert(
          'Gagal mengunggah file ke Google Drive (Failed to fetch).\n\n' +
          'Kemungkinan penyebab:\n' +
          '1. Sesi login akun Google Anda telah berakhir atau belum terhubung.\n' +
          '2. Browser atau ekstensi memblokir koneksi API Google.\n\n' +
          'Solusi: Silakan klik tombol "Hubungkan Ulang Akun Google" di pojok kanan atas modal lalu coba simpan kembali.'
        );
      } else {
        alert('Kesalahan saat mengunggah file: ' + err.message);
      }
    } finally {
      setUploadingToDrive(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      {!isolatedTab && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-white">
              {user.role === UserRole.SISWA ? 'Riwayat Hafalan Saya' : (user.role === UserRole.ADMIN ? 'Mutabaah (Setoran Santri)' : 'Penilaian Setoran & Capaian')}
            </h2>
            <p className="text-xs text-slate-400">
              {user.role === UserRole.SISWA 
                ? 'Pantau log perkembangan kelulusan surah dan modul rujukan Anda' 
                : 'Pusat mutabaah harian santri, bimbingan tajwid, setoran harian dan tilawah'
              }
            </p>
          </div>

        {/* Action Trigger keys */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {displayLogs.length > 0 && (activeSubTab === 'riwayat' || user.role !== UserRole.ADMIN) && (
            <>
              {/* Button 1: UNDUH KE PERANGKAT (PDF, WORD, EXCEL) */}
              <div className="relative inline-block text-left">
                <button 
                  type="button"
                  onClick={() => {
                    setIsDownloadDropdownOpen(!isDownloadDropdownOpen);
                    setIsDriveDropdownOpen(false);
                  }}
                  className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                  title="Klik untuk memilih format unduhan ke perangkat Anda (PDF, Word, Excel)"
                >
                  <Download className="w-4 h-4 mr-1.5 text-white" />
                  <span>Unduh ke Perangkat</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </button>

                {isDownloadDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl z-50 p-1.5 space-y-1 animate-fade-in text-left">
                    <button
                      type="button"
                      onClick={() => {
                        exportToPDF(getExportFileName());
                        setIsDownloadDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Format PDF</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Dokumen PDF Siap Cetak</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        exportToWord(getExportFileName());
                        setIsDownloadDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Format WORD (.doc)</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Dokumen Microsoft Word</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        exportToExcel(getExportFileName());
                        setIsDownloadDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Format EXCEL (.xlsx)</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Lembar Kerja Spreadsheet</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Button 2: SIMPAN KE GOOGLE DRIVE (PDF, DOCS, SHEET) */}
              <div className="relative inline-block text-left">
                <button 
                  type="button"
                  onClick={() => {
                    setIsDriveDropdownOpen(!isDriveDropdownOpen);
                    setIsDownloadDropdownOpen(false);
                  }}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                  title="Klik untuk memilih format simpan langsung ke Google Drive (PDF, Docs, Sheet)"
                >
                  <Cloud className="w-4 h-4 mr-1.5 text-white" />
                  <span>Simpan ke Google Drive</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </button>

                {isDriveDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl z-50 p-1.5 space-y-1 animate-fade-in text-left">
                    <button
                      type="button"
                      onClick={() => {
                        saveToGoogleDrive(getExportFileName(), 'PDF');
                        setIsDriveDropdownOpen(false);
                      }}
                      disabled={!!uploadingToDrive}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-center space-x-2.5 cursor-pointer disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan PDF</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Format PDF ke Drive</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        saveToGoogleDrive(getExportFileName(), 'Docs');
                        setIsDriveDropdownOpen(false);
                      }}
                      disabled={!!uploadingToDrive}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-center space-x-2.5 cursor-pointer disabled:opacity-50"
                    >
                      <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan Docs</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Format Google Docs</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        saveToGoogleDrive(getExportFileName(), 'Sheet');
                        setIsDriveDropdownOpen(false);
                      }}
                      disabled={!!uploadingToDrive}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-center space-x-2.5 cursor-pointer disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan Sheet</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Format Google Sheet</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {user.role === UserRole.GURU && (
            <button
              id="start-assessment"
              onClick={handleOpenForm}
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Uji Setoran Baru
            </button>
          )}
        </div>
      </div>
      )}

      {/* Sub tabs for ADMIN role only */}
      {user.role === UserRole.ADMIN && !isolatedTab && (
        <div className="flex border-b border-slate-150 dark:border-slate-850 overflow-x-auto scrollbar-none">
          {canAccessRiwayat && (
            <button
              onClick={() => setActiveSubTab('riwayat')}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeSubTab === 'riwayat'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {getAdminTabLabel('setorans', 'riwayat', 'Laporan & Riwayat Setoran')}
            </button>
          )}
          {canAccessPresensiSantri && (
            <button
              id="tab-sub-presensi-santri"
              onClick={() => setActiveSubTab('presensi_santri')}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'presensi_santri'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {getAdminTabLabel('setorans', 'presensi_santri', 'Kehadiran Santri')}
            </button>
          )}
          {canAccessProgres && (
            <button
              id="tab-sub-progres"
              onClick={() => setActiveSubTab('progres')}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'progres'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              {getAdminTabLabel('setorans', 'progres', 'Rekapitulasi Capaian')}
            </button>
          )}
          {!hidePresensiJadwalTabs && (
            <>
              <button
                onClick={() => setActiveSubTab('presensi_guru')}
                className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSubTab === 'presensi_guru'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                {getAdminTabLabel('kelashalaqah', 'presensi', 'Kehadiran & Presensi Guru')}
              </button>
              <button
                onClick={() => setActiveSubTab('jadwal_guru')}
                className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSubTab === 'jadwal_guru'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {getAdminTabLabel('kelashalaqah', 'jadwal', 'Jadwal Mengajar Guru')}
              </button>
            </>
          )}
          {canAccessPengaturan && (
            <button
              onClick={() => setActiveSubTab('pengaturan')}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeSubTab === 'pengaturan'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {getAdminTabLabel('setorans', 'pengaturan', 'Konfigurasi Elemen & Jenis Setoran')}
            </button>
          )}
          {canAccessTajwid && (
            <button
              onClick={() => setActiveSubTab('tajwid')}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeSubTab === 'tajwid'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {getAdminTabLabel('setorans', 'tajwid', 'Kategori Kesalahan')}
            </button>
          )}
          {canAccessCapaianBacaan && (
            <button
              onClick={() => setActiveSubTab('capaian_bacaan')}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'capaian_bacaan'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{getAdminTabLabel('setorans', 'capaian_bacaan', 'Capaian Bacaan Ayat')}</span>
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          SUB-TAB 1: Pelaporan & Riwayat Setoran
         ========================================== */}
      {(activeSubTab === 'riwayat' || user.role !== UserRole.ADMIN) && (
        <div className="space-y-6">
          {/* Overview Tracker Stats banner for Students */}
          {user.role === UserRole.SISWA && displayLogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">TRACKING SETORAN TERAKHIR</span>
                  <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                    Surat {displayLogs[0].modulNama} • {displayLogs[0].nilai}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Disetujui oleh {displayLogs[0].guruNama}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3.5 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-900 pt-3 md:pt-0 pl-0 md:pl-5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">TANGGAL SETORAN TERKINI</span>
                  <p className="text-base font-bold text-slate-855 dark:text-white mt-0.5">
                    {new Date(displayLogs[0].tanggalSetoran).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Status kelulusan: <span className="font-bold text-emerald-600">{displayLogs[0].statusLulus ? 'LULUS' : 'REMEDI'}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Filter and interactive live search */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-3">
            
            {/* Top Row: Search Input + Guru Filter + Halaqah Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search Input */}
              <div className={`relative col-span-12 ${user.role === UserRole.SISWA ? 'md:col-span-12' : 'md:col-span-6'}`}>
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  id="student-setoran-search"
                  type="text"
                  placeholder={user.role === UserRole.SISWA ? 'Cari berdasarkan modul/surat...' : 'Cari nama santri, NIS, guru, halaqah, atau surat...'}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none"
                />
              </div>

              {/* Guru Filter */}
              {user.role !== UserRole.SISWA && (
                <div className="col-span-12 md:col-span-3">
                  <select
                    id="guru-filter"
                    value={guruFilter}
                    onChange={(e) => handleGuruFilterChange(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1"
                  >
                    <option value="All">Semua Guru</option>
                    {gurus && gurus.map(g => (
                      <option key={g.id} value={g.id}>{g.namaLengkap}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Halaqah Filter */}
              {user.role !== UserRole.SISWA && (
                <div className="col-span-12 md:col-span-3">
                  <select
                    id="halaqah-filter"
                    value={halaqahFilter}
                    onChange={(e) => setHalaqahFilter(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1"
                  >
                    <option value="All">Semua Halaqah</option>
                    {filteredHalaqahsForDropdown.map(h => (
                      <option key={h.id} value={h.id}>{h.namaHalaqah}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bottom Row: Date Range & Month Selection Controls */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-850/80 flex flex-wrap items-center gap-3 text-xs">
              
              {/* Pilihan Cepat Bulan & Tahun */}
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Bulan:</span>
                <select
                  id="filter-month-select"
                  value={filterMonth}
                  onChange={(e) => handleMonthChange(e.target.value, filterYear)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All">Semua Bulan</option>
                  {filterMonth === 'Custom' && <option value="Custom" disabled>Rentang Kustom</option>}
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>

                <select
                  id="filter-year-select"
                  value={filterYear}
                  onChange={(e) => handleMonthChange(filterMonth === 'Custom' ? 'All' : filterMonth, e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Tanggal Awal & Tanggal Akhir Inputs */}
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] pl-1">Dari:</span>
                <input
                  id="filter-start-date"
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => handleCustomDateChange(e.target.value, filterEndDate)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">s.d.</span>
                <input
                  id="filter-end-date"
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => handleCustomDateChange(filterStartDate, e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Reset Filter Button */}
              {(filterStartDate || filterEndDate || filterMonth !== 'All') && (
                <button
                  type="button"
                  onClick={() => handleMonthChange('All', new Date().getFullYear().toString())}
                  className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                  title="Reset Filter Tanggal"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reset Filter Waktu
                </button>
              )}

              {/* Active Filter Summary Badge */}
              {(filterStartDate || filterEndDate) && (
                <div className="ml-auto text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-md font-medium">
                  Periode: <span className="font-bold">{filterStartDate || 'Awal'}</span> s.d. <span className="font-bold">{filterEndDate || 'Akhir'}</span> ({displayLogs.length} data)
                </div>
              )}
            </div>

          </div>

          {/* History table list */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-900 text-left text-xs">
                <thead className="bg-slate-55 dark:bg-slate-950 text-slate-405 font-bold tracking-wider text-[10px] uppercase border-b dark:border-slate-900">
                  <tr>
                    <th className="py-3 px-4">Tanggalsetor</th>
                    {user.role !== UserRole.SISWA && (
                      <>
                        <th className="py-3 px-4">NIS</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                      </>
                    )}
                    <th className="py-3 px-4">Grup Halaqah</th>
                    <th className="py-3 px-4">Materi Ajar</th>
                    <th className="py-3 px-4">Elemen & Kategori</th>
                    <th className="py-3 px-4">Nilai</th>
                    <th className="py-3 px-4">Catatan Ustadz</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {displayLogs.map((setoran) => (
                    <tr key={setoran.id} className="hover:bg-slate-55/40 dark:hover:bg-slate-900/35 transition-all">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">
                        {setoran.tanggalSetoran}
                      </td>
                      {user.role !== UserRole.SISWA && (
                        <>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400">
                            {setoran.siswaNis}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {setoran.siswaNama}
                          </td>
                        </>
                      )}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-550 dark:bg-slate-900 dark:text-slate-350">
                            {setoran.halaqahNama}
                          </span>
                          {setoran.guruNama && (
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[120px]" title={`Penguji: ${setoran.guruNama}`}>
                              Ust. {setoran.guruNama}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                        {setoran.modulNama}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <div className="space-y-1">
                          <span className="font-semibold block text-[11px] text-slate-800 dark:text-slate-200">
                            {setoran.jenisSetoran || 'Setoran'} {setoran.tipeTahfidz ? ` - ${setoran.tipeTahfidz}` : ''}
                          </span>
                          {setoran.tipeModul === TipeModul.AL_QURAN ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold block">Ayat {setoran.ayatAwal} s/d {setoran.ayatAkhir}</span>
                          ) : (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">Halaman {setoran.halaman || 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-750 dark:text-emerald-450 font-sans text-sm">
                        {setoran.nilai}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate" title={setoran.catatanGuru}>
                        "{setoran.catatanGuru}"
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          setoran.statusLulus 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'
                        }`}>
                          {setoran.statusLulus ? 'Lulus' : 'Remedi'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => setViewingSetoran(setoran)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 rounded transition"
                            title="Lihat rincian lengkap"
                          >
                            <Eye className="w-4 h-4 cursor-pointer" />
                          </button>
                          {user.role === UserRole.GURU && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditSetoran(setoran)}
                                className="p-1 hover:bg-emerald-50 dark:hover:bg-slate-900 text-emerald-600 rounded transition"
                                title="Edit setoran"
                              >
                                <Edit3 className="w-4 h-4 cursor-pointer" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete({ id: setoran.id, namaSiswa: setoran.siswaNama || 'Siswa', materi: setoran.modulNama || 'Materi' })}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-slate-900 text-rose-600 rounded transition"
                                title="Hapus setoran"
                              >
                                <Trash2 className="w-4 h-4 cursor-pointer" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {displayLogs.length === 0 && (
                    <tr>
                      <td colSpan={user.role !== UserRole.SISWA ? 10 : 8} className="py-14 text-center text-slate-405 italic">
                        Belum ada riwayat mutabaah setoran terekam untuk tab pilihan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-TAB: Kehadiran & Presensi Santri (Admin Only)
         ========================================== */}
      {user.role === UserRole.ADMIN && activeSubTab === 'presensi_santri' && (
        <AdminPresensiSantri />
      )}

      {/* ==========================================
          SUB-TAB: Progres Santri per Halaqah (Admin Only)
         ========================================== */}
      {user.role === UserRole.ADMIN && activeSubTab === 'progres' && (
        <AdminHalaqahProgress />
      )}

      {/* ==========================================
          SUB-TAB 2: Pengaturan Elemen & Setoran (Admin Only)
         ========================================== */}
      {user.role === UserRole.ADMIN && activeSubTab === 'pengaturan' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-400">
                Konfigurasi Elemen Pembelajaran & Jenis Setoran
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Tentukan klasifikasi setoran untuk ustadz pembimbing. Elemen pembelajaran bertipe <strong className="text-slate-700 dark:text-slate-300">Al-Quran (Tilawah, Tahfidz)</strong> secara otomatis melacak ayat arab aktif, sedangkan elemen bertipe <strong className="text-slate-700 dark:text-slate-300">Selain Al-Quran (Qiroah)</strong> melacak nomor halaman. Tambahkan sub-kategori kustom (seperti Sabaq, Baru, Murojaah) untuk memandu evaluasi harian.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMasterModalOpen(true)}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 transition font-bold text-white text-xs rounded-xl shadow-sm whitespace-nowrap cursor-pointer shrink-0"
              >
                <Settings2 className="w-4 h-4 mr-2" /> Master Bobot
              </button>
              <button
                onClick={() => handleOpenElemModal()}
                className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 transition font-bold text-white text-xs rounded-xl shadow-sm whitespace-nowrap cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah Elemen
              </button>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Filter Cakupan:
              </span>
              <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setElemScopeFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    elemScopeFilter === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semua ({elemenSettings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setElemScopeFilter('foundation')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    elemScopeFilter === 'foundation'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Yayasan ({elemenSettings.filter(e => !e.targetScope || e.targetScope === 'all' || e.targetScope === 'foundation').length})
                </button>
                <button
                  type="button"
                  onClick={() => setElemScopeFilter('private')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    elemScopeFilter === 'private'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pribadi / Kustom ({elemenSettings.filter(e => e.targetScope === 'private' || e.targetScope === 'custom' || (!e.targetScope || e.targetScope === 'all')).length})
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 pr-1">
              Menampilkan {
                elemenSettings.filter(elem => {
                  if (elemScopeFilter === 'foundation') {
                    return !elem.targetScope || elem.targetScope === 'all' || elem.targetScope === 'foundation';
                  }
                  if (elemScopeFilter === 'private') {
                    return !elem.targetScope || elem.targetScope === 'all' || elem.targetScope === 'private' || elem.targetScope === 'custom';
                  }
                  return true;
                }).length
              } elemen pembelajaran aktif
            </div>
          </div>

          {/* VISUAL PETA ALUR PERJENJANGAN ELEMEN */}
          {(() => {
            const berjenjangElems = (elemenSettings || [])
              .filter(e => e.isBerjenjang)
              .sort((a, b) => (a.jenjangLevel || 1) - (b.jenjangLevel || 1));
            const bebasElems = (elemenSettings || []).filter(e => !e.isBerjenjang);

            return (
              <div className="bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-slate-50 dark:from-purple-950/20 dark:via-indigo-950/15 dark:to-slate-900/50 p-4 sm:p-5 rounded-2xl border border-purple-200/70 dark:border-purple-900/40 shadow-xs space-y-3.5 text-left">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                      <GitMerge className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Peta Alur &amp; Perjenjangan Kurikulum Elemen</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                          {berjenjangElems.length} Elemen Berjenjang • {bebasElems.length} Paralel
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Alur tingkatan belajar santri dari tingkat dasar hingga mahir. Santri wajib menuntaskan prasyarat atau mendapatkan dispensasi akselerasi dari ustadz.
                      </p>
                    </div>
                  </div>
                </div>

                {/* The visual step progression */}
                {berjenjangElems.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                      {berjenjangElems.map((elem, idx) => {
                        const isLast = idx === berjenjangElems.length - 1;
                        const reqNames = (elem.prerequisiteElemenIds || [])
                          .map(pid => (elemenSettings || []).find(e => e.id === pid)?.nama)
                          .filter(Boolean);

                        return (
                          <div key={elem.id} className="flex items-center shrink-0">
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-900/80 shadow-xs hover:border-purple-400 transition min-w-[190px] max-w-[220px]">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-600 text-white shadow-2xs">
                                  Tingkat {elem.jenjangLevel || (idx + 1)}
                                </span>
                                {elem.allowTeacherOverride !== false && (
                                  <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded" title="Dispensasi akselerasi diizinkan">
                                    ⚡ Akselerasi
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                {elem.nama}
                              </h5>
                              <p className="text-[9.5px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                {elem.kompetensi || (elem.tipeModul === TipeModul.AL_QURAN ? 'Al-Qur\'an' : 'Modul')}
                              </p>
                              {reqNames.length > 0 ? (
                                <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-500">
                                  <span className="font-bold text-purple-600 dark:text-purple-400">Prasyarat: </span>
                                  <span className="truncate block font-medium text-slate-700 dark:text-slate-300">{reqNames.join(', ')}</span>
                                </div>
                              ) : (
                                <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓ Tingkat Dasar (Akses Terbuka)
                                </div>
                              )}
                            </div>

                            {!isLast && (
                              <div className="px-2 flex items-center text-purple-400 dark:text-purple-600">
                                <span className="font-black text-sm">➔</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {bebasElems.length > 0 && (
                      <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/30 flex items-center gap-2 flex-wrap text-[10.5px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          Elemen Bebas / Paralel (Bisa Bersamaan):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {bebasElems.map(be => (
                            <span
                              key={be.id}
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-medium text-[9.5px]"
                            >
                              {be.nama}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-purple-200 dark:border-purple-900 text-center text-xs text-slate-500">
                    Semua elemen saat ini masih bersifat <strong>Bebas / Paralel</strong>. Klik tombol <strong>Edit</strong> pada elemen untuk mengaktifkan tingkatan berjenjang dan menetapkan prasyarat kelulusan.
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {elemenSettings
              ?.filter((elem) => {
                if (elemScopeFilter === 'foundation') {
                  return !elem.targetScope || elem.targetScope === 'all' || elem.targetScope === 'foundation';
                }
                if (elemScopeFilter === 'private') {
                  return !elem.targetScope || elem.targetScope === 'all' || elem.targetScope === 'private' || elem.targetScope === 'custom';
                }
                return true;
              })
              ?.map((elem) => {
              // Calculate linked moduls
              const linkedModuls = moduls.filter(m => {
                if (elem.tipeModul === TipeModul.AL_QURAN) {
                  return m.tipe === TipeModul.AL_QURAN;
                } else {
                  if (elem.referensiModulId) {
                    return m.id === elem.referensiModulId;
                  }
                  return m.tipe === TipeModul.NON_AL_QURAN;
                }
              });

              const targetScope = elem.targetScope || 'all';

              return (
                <div key={elem.id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">ELEMEN PEMBELAJARAN</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                            targetScope === 'foundation'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : targetScope === 'private'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : targetScope === 'custom'
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {targetScope === 'foundation' && '🏛️ Yayasan'}
                            {targetScope === 'private' && '👤 Pribadi'}
                            {targetScope === 'custom' && `🎯 Kustom (${elem.targetHalaqahIds?.length || 0})`}
                            {targetScope === 'all' && '🌐 Global'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                          <h4 className="text-lg font-extrabold text-slate-800 dark:text-white">
                            {elem.nama}
                          </h4>
                          {(capaianBacaanTrialSettings?.enabledElemenIds || []).includes(elem.id) && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 cursor-pointer hover:bg-emerald-200 transition"
                              title="Elemen ini aktif digunakan untuk Instrumen Capaian Bacaan Ayat. Klik untuk membuka tab Capaian Bacaan Ayat."
                              onClick={() => setActiveSubTab('capaian_bacaan')}
                            >
                              <FileCheck2 className="w-3 h-3 text-emerald-600" />
                              <span>Capaian Bacaan Ayat</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenElemModal(elem)}
                            className="p-1 text-slate-405 hover:text-emerald-600 dark:hover:text-emerald-450 hover:bg-slate-50 dark:hover:bg-slate-900 rounded transition cursor-pointer"
                            title="Edit Elemen"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteElem({ id: elem.id, nama: elem.nama })}
                            className="p-1 text-slate-405 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-slate-50 dark:hover:bg-slate-900 rounded transition cursor-pointer"
                            title="Hapus Elemen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {elem.kompetensi && (
                          <div className="mt-1 flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-450">
                            <span>Kompetensi:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                              {elem.kompetensi}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          elem.tipeModul === TipeModul.AL_QURAN 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                        }`}>
                          {elem.tipeModul === TipeModul.AL_QURAN ? 'Al-Quran' : 'Selain Al-Quran'}
                        </span>
                        {elem.useJumlahBaris && (
                          <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                            Baris Aktif
                          </span>
                        )}
                        {elem.useRubrikPenilaian && (
                          <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Auto Rubrik
                          </span>
                        )}
                        {(elem.usePageRules || elem.tipeKesalahan === 'page_based') && (
                          <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Batas Hal ({elem.pageRules?.length || 0} Aturan)
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          (elem.tipeKesalahan === 'tajwid' || elem.tipeKesalahan === 'lahn_khafiy' || (!elem.tipeKesalahan && elem.tipeModul === TipeModul.AL_QURAN))
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : (elem.tipeKesalahan === 'dasar' || elem.tipeKesalahan === 'lahn_jaliy' || (!elem.tipeKesalahan && elem.tipeModul !== TipeModul.AL_QURAN))
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : elem.tipeKesalahan === 'none'
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400'
                                : elem.tipeKesalahan === 'page_based'
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          Kesalahan: {(() => {
                            const val = elem.tipeKesalahan || (elem.tipeModul === TipeModul.AL_QURAN ? 'lahn_khafiy' : 'lahn_jaliy');
                            if (val === 'tajwid' || val === 'lahn_khafiy') return 'Lahn Khafiy';
                            if (val === 'dasar' || val === 'lahn_jaliy') return 'Lahn Jaliy';
                            if (val === 'none') return 'Tidak Ada';
                            if (val === 'page_based') return 'Aturan Halaman';
                            return 'Semua (Lahn Jaliy & Khafiy)';
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Status Perjenjangan & Prasyarat Elemen */}
                    {elem.isBerjenjang ? (
                      <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                            <GitMerge className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>Elemen Berjenjang • Tingkat / Level {elem.jenjangLevel || 1}</span>
                          </span>
                          {elem.allowTeacherOverride !== false && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800" title="Guru pembimbing dapat memberikan dispensasi akselerasi langsung jika santri berprestasi">
                              ⚡ Akselerasi Guru
                            </span>
                          )}
                        </div>
                        {elem.prerequisiteElemenIds && elem.prerequisiteElemenIds.length > 0 ? (
                          <div className="text-[10px] text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Prasyarat: </span>
                            {elem.prerequisiteElemenIds.map(pid => {
                              const reqElem = (elemenSettings || []).find(e => e.id === pid);
                              return reqElem ? reqElem.nama : pid;
                            }).join(', ')}
                            <span className="block text-[9px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                              ({elem.syaratBuka === 'ada_setoran' ? `Minimal ${elem.minimalSetoranLulus || 1}x setoran lulus` : 'Wajib lulus modul prasyarat'})
                            </span>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-slate-400 italic">
                            Tingkat awal (dapat langsung dipelajari santri baru).
                          </p>
                        )}
                        {elem.deskripsiJenjang && (
                          <p className="text-[9.5px] text-slate-500 italic border-t border-purple-150/50 dark:border-purple-900/30 pt-1 mt-1">
                            ℹ️ {elem.deskripsiJenjang}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          <span>Alur: <strong>Bebas / Paralel</strong></span>
                        </span>
                        <span className="text-[9px] text-slate-400">Dapat dipelajari bersamaan</span>
                      </div>
                    )}

                    {/* Target Tuntas & Cakupan Modul */}
                    {(elem.targetDurasiBulan || elem.targetCakupanMateri || (elem.targetSurahList && elem.targetSurahList.length > 0)) && (
                      <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                            <Target className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span>Target Tuntas Kurikulum</span>
                          </span>
                          {elem.targetDurasiBulan && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-extrabold border border-teal-200 dark:border-teal-800">
                              ⏱️ {elem.targetDurasiBulan} Bulan
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-600 dark:text-slate-300">
                          {elem.targetCakupanMateri === 'surah_pilihan' && elem.targetSurahList && elem.targetSurahList.length > 0 ? (
                            <div>
                              <span className="font-bold text-teal-700 dark:text-teal-400">
                                📖 {elem.targetSurahList.length} Surah Pilihan:
                              </span>{' '}
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {SURAH_LIST.filter(s => elem.targetSurahList!.includes(s.no)).map(s => s.nama).join(', ')}
                              </span>
                            </div>
                          ) : elem.targetCakupanMateri === 'juz_range' ? (
                            <div>
                              <span className="font-bold text-teal-700 dark:text-teal-400">
                                📖 Rentang Juz:
                              </span>{' '}
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                Juz {elem.targetJuzStart || 30}{elem.targetJuzEnd && elem.targetJuzEnd !== elem.targetJuzStart ? ` s/d Juz ${elem.targetJuzEnd}` : ''}
                              </span>
                            </div>
                          ) : elem.targetCakupanMateri === 'halaman_range' ? (
                            <div>
                              <span className="font-bold text-teal-700 dark:text-teal-400">
                                📖 Rentang Halaman:
                              </span>{' '}
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                Hal. {elem.targetHalamanStart || 1} s/d {elem.targetHalamanEnd || 30}
                              </span>
                            </div>
                          ) : (
                            <span className="italic text-slate-400">Cakupan bebas / seluruh modul</span>
                          )}
                        </div>

                        {elem.targetCatatanMateri && (
                          <p className="text-[9.5px] text-teal-800/80 dark:text-teal-300/80 italic border-t border-teal-150/50 dark:border-teal-900/30 pt-1 mt-1">
                            ℹ️ {elem.targetCatatanMateri}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Associated Modul list (Keterkaitan Elemen) */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        KETERKAITAN MODUL AKTIF ({linkedModuls.length})
                      </span>
                      {linkedModuls.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {linkedModuls.map((m) => (
                            <span 
                              key={m.id}
                              className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[9px] text-slate-600 dark:text-slate-400 font-medium"
                            >
                              {m.namaSurat ? `Surat ${m.namaSurat}` : m.judulModul}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">
                          Belum ada materi/modul terdaftar untuk elemen ini.
                        </p>
                      )}
                    </div>

                    {/* Rubrik Penilaian Summary */}
                    {elem.useRubrikPenilaian && (
                      <div className={`p-3 rounded-xl border space-y-1.5 text-[11px] text-left transition ${
                        elem.useMasterPenalties === false
                          ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-200/70 dark:border-amber-800/50'
                          : 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/30'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className={elem.useMasterPenalties === false ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-400'}>
                            Penilaian Otomatis
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-sans uppercase font-black text-[8px] flex items-center gap-1 ${
                            elem.useMasterPenalties === false
                              ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                              : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                          }`}>
                            <span>{elem.useMasterPenalties === false ? '⚡' : '🔗'}</span>
                            <span>{elem.useMasterPenalties === false ? 'Pengecualian Khusus' : 'Standar Master'}</span>
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-slate-650 dark:text-slate-400">
                          <span>Nilai Dasar:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {elem.useMasterPenalties === false ? (elem.baseScore ?? 100) : (masterPenalties?.baseScore ?? 100)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-slate-650 dark:text-slate-400">
                          <span>Metode Rumus:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {(elem.useMasterPenalties === false ? elem.rumusPenilaian : 'proporsional_baris') === 'proporsional_baris' ? 'Proporsional Baris' : 'Pengurangan Absolut'}
                          </span>
                        </div>

                        {/* Ringkasan Bobot Klasifikasi Kesalahan */}
                        <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-800/60">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            {elem.useMasterPenalties === false ? 'Bobot Klasifikasi Khusus:' : 'Bobot Klasifikasi (Master):'}
                          </span>
                          <div className="flex flex-wrap gap-1 text-[9.5px]">
                            {(klasifikasiKesalahanTypes || []).map((t) => {
                              const customVal = elem.bobotKlasifikasi?.[t.id] !== undefined
                                ? elem.bobotKlasifikasi[t.id]
                                : (t.id === 'lahn_jaliy' && elem.bobotLahnJaliy !== undefined ? elem.bobotLahnJaliy : (t.id === 'lahn_khafiy' && elem.bobotLahnKhafiy !== undefined ? elem.bobotLahnKhafiy : undefined));
                              const masterVal = masterPenalties?.bobotKlasifikasi?.[t.id] ?? (t.id === 'lahn_jaliy' ? (masterPenalties?.bobotLahnJaliy ?? 4) : (masterPenalties?.bobotLahnKhafiy ?? 2));
                              const val = (elem.useMasterPenalties === false && customVal !== undefined) ? customVal : masterVal;
                              const isDiff = elem.useMasterPenalties === false && customVal !== undefined && customVal !== masterVal;

                              return (
                                <span
                                  key={t.id}
                                  className={`px-1.5 py-0.5 rounded font-medium ${
                                    isDiff
                                      ? 'bg-amber-200/90 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                                  }`}
                                  title={isDiff ? `Khusus elemen ini: ${val} pt (Master: ${masterVal} pt)` : `Standar: ${val} pt`}
                                >
                                  {t.nama}: <strong>-{val} pt</strong>
                                  {isDiff && ' ⚡'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Setoran Types (Jika tidak ada maka kosongkan) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          OPSI KATEGORI SETORAN
                        </span>
                        {elem.jenisSetoranList.length === 0 && (
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">KOSONG</span>
                        )}
                      </div>

                      {elem.jenisSetoranList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {elem.jenisSetoranList.map((item) => (
                            <span 
                              key={item}
                              className="inline-flex items-center pl-2.5 pr-1.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-705 dark:text-slate-350 rounded-lg text-xs font-semibold"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => handleRemoveJenisSetoran(elem.id, item)}
                                className="ml-1.5 p-0.5 hover:bg-slate-205 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-rose-500 transition cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50/55 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 italic text-[11px]">
                          Tidak ada sub-jenis tersimpan. Input kosong.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add action */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Tambah Kategori Setoran
                    </label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        placeholder="Contoh: Baru, Murojaah, Sabaq..."
                        value={newJenisInputs[elem.id] || ''}
                        onChange={(e) => setNewJenisInputs(prev => ({ ...prev, [elem.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddJenisSetoran(elem.id);
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddJenisSetoran(elem.id)}
                        className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer font-sans"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-TAB 3: Kategori Kesalahan (Admin Only)
         ========================================== */}
      {user.role === UserRole.ADMIN && activeSubTab === 'tajwid' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-teal-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <Tag className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-teal-900 dark:text-emerald-450">
                  Manajemen Kategori Kesalahan
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Kelola ragam kategori kesalahan evaluasi dan atur <strong>Tipe Klasifikasi Kesalahan</strong> (seperti Lahn Jaliy, Lahn Khafiy, Sifat Huruf, atau klasifikasi kustom) yang digunakan oleh ustadz pembimbing saat menandai kesalahan bacaan dalam bimbingan setoran.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleOpenAddKlasifikasi();
                  setIsManageKlasifikasiModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Kelola Tipe Klasifikasi ({klasifikasiKesalahanTypes.length})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">
                    {activeTajwidEditId ? 'EDIT KATEGORI KESALAHAN' : 'TAMBAH KATEGORI KESALAHAN'}
                  </h4>
                  {selectedCategoryTypeFilter !== 'all' && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Target: {getCategoryTypeObj(selectedCategoryTypeFilter).nama}
                    </span>
                  )}
                </div>
                {activeTajwidEditId && (
                  <button
                    type="button"
                    onClick={handleCancelTajwidEdit}
                    className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveTajwidCategory} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Tipe Klasifikasi Kesalahan *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenAddKlasifikasi();
                        setIsManageKlasifikasiModalOpen(true);
                      }}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer transition hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Kelola Tipe
                    </button>
                  </div>

                  {/* Clean Dropdown Selector */}
                  <select
                    value={tajwidFormTipe}
                    onChange={(e) => setTajwidFormTipe(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                  >
                    {klasifikasiKesalahanTypes.map((tItem) => (
                      <option key={tItem.id} value={tItem.id}>
                        {tItem.nama} {tItem.labelSingkat ? `(${tItem.labelSingkat})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Clean Quick Pill Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {klasifikasiKesalahanTypes.map((tItem) => {
                      const isSelected = isCategoryMatchingType(tajwidFormTipe, tItem.id);
                      return (
                        <button
                          key={tItem.id}
                          type="button"
                          onClick={() => setTajwidFormTipe(tItem.id)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <span>{tItem.nama}</span>
                          {tItem.labelSingkat && (
                            <span className="opacity-75 text-[10px] ml-1 font-normal">({tItem.labelSingkat})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {(() => {
                    const activeTypeObj = getCategoryTypeObj(tajwidFormTipe);
                    if (!activeTypeObj) return null;
                    return (
                      <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            Target Tipe: {activeTypeObj.nama}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {activeTypeObj.deskripsi || (activeTypeObj.labelSingkat ? `Klasifikasi ${activeTypeObj.labelSingkat}` : 'Kategori evaluasi kesalahan bimbingan santri.')}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                          {activeTypeObj.labelSingkat || activeTypeObj.nama}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Nama Kategori *
                  </label>
                  <input
                    ref={tajwidFormNamaInputRef}
                    type="text"
                    required
                    placeholder="Contoh: Salah Harakat, Idgham Bighunnah, Hams..."
                    value={tajwidFormNama}
                    onChange={(e) => setTajwidFormNama(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-905 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Deskripsi Penjelasan (Opsional)
                  </label>
                  <textarea
                    placeholder="Tuliskan pengertian singkat atau catatan panduan..."
                    value={tajwidFormDeskripsi}
                    onChange={(e) => setTajwidFormDeskripsi(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 h-24 focus:outline-none focus:ring-1 focus:ring-emerald-605 font-medium text-slate-905 dark:text-slate-100"
                  />
                </div>

                {/* Subcategories Editor */}
                <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Daftar Subkategori (Opsional)
                    </label>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Tambahkan rincian subkategori untuk mempercepat guru saat menandai kesalahan (contoh huruf makhraj atau macam-macam sifat huruf).
                    </p>
                  </div>

                  {/* Subcategories List */}
                  {tajwidSubcategories.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {tajwidSubcategories.map((sub, idx) => (
                        <div key={sub.id || idx} className="flex items-center justify-between gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850 text-xs">
                          {editingSubcategoryIdx === idx ? (
                            <div className="flex-1 flex items-center gap-1">
                              <input
                                type="text"
                                value={editingSubcategoryInput}
                                onChange={(e) => setEditingSubcategoryInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveSubcategoryEdit(idx);
                                  }
                                }}
                                className="flex-1 px-2 py-1 border border-emerald-500 rounded text-xs bg-white dark:bg-slate-950 focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSubcategoryEdit(idx)}
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Simpan
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {sub.nama}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSubcategory(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                                  title="Pindahkan Ke Atas"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSubcategory(idx, 'down')}
                                  disabled={idx === tajwidSubcategories.length - 1}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                                  title="Pindahkan Ke Bawah"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditSubcategory(idx, sub.nama)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                                  title="Ubah Subkategori"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubcategory(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Hapus Subkategori"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-dashed border-slate-150 dark:border-slate-850 text-center text-slate-400 italic text-[10px]">
                      Belum ada subkategori. Tambahkan beberapa di bawah.
                    </div>
                  )}

                  {/* Add Subcategory Input */}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Nama subkategori baru..."
                      value={newSubcategoryInput}
                      onChange={(e) => setNewSubcategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubcategory();
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    {activeTajwidEditId ? 'Simpan Perubahan' : 'Tambah Kategori'}
                  </button>
                  {activeTajwidEditId && (
                    <button
                      type="button"
                      onClick={handleCancelTajwidEdit}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-250 dark:bg-slate-900 dark:hover:bg-slate-805 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-8 space-y-3">
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block sm:inline">
                      DAFTAR KATEGORI AKTIF ({(tajwidCategories || []).filter(c => isCategoryMatchingType(c.tipe, selectedCategoryTypeFilter)).length})
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium italic sm:ml-2">
                      Langsung terhubung ke workspace guru
                    </span>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-205 dark:border-slate-800 self-start sm:self-auto flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryTypeFilter('all')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                        selectedCategoryTypeFilter === 'all'
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                      }`}
                    >
                      Semua ({(tajwidCategories || []).length})
                    </button>
                    {klasifikasiKesalahanTypes.map((tItem) => {
                      const isSelected = selectedCategoryTypeFilter === tItem.id || selectedCategoryTypeFilter.toLowerCase() === tItem.id.toLowerCase();
                      const catCount = (tajwidCategories || []).filter(c => isCategoryMatchingType(c.tipe, tItem.id)).length;
                      return (
                        <button
                          key={tItem.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryTypeFilter(tItem.id);
                            if (!activeTajwidEditId) {
                              setTajwidFormTipe(tItem.id);
                            }
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                          }`}
                        >
                          <span>{tItem.nama}</span>
                          <span className="text-[9px] opacity-80">({catCount})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-900">
                  {(() => {
                    const filtered = (tajwidCategories || []).filter(c => isCategoryMatchingType(c.tipe, selectedCategoryTypeFilter));

                    if (filtered.length === 0) {
                      const activeFilterType = klasifikasiKesalahanTypes.find(t => t.id === selectedCategoryTypeFilter);
                      return (
                        <div className="p-8 text-center text-slate-400 space-y-3">
                          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                            <Layers className="w-5 h-5" />
                          </div>
                          <p className="text-xs italic text-slate-500 dark:text-slate-400">
                            Belum ada Kategori Kesalahan {activeFilterType ? `"${activeFilterType.nama}"` : ''} yang tersimpan.
                          </p>
                          {activeFilterType && (
                            <button
                              type="button"
                              onClick={() => {
                                setTajwidFormTipe(activeFilterType.id);
                                setTimeout(() => tajwidFormNamaInputRef.current?.focus(), 50);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah Kategori Baru ke {activeFilterType.nama}</span>
                            </button>
                          )}
                        </div>
                      );
                    }
                    return filtered.map((cat, index) => {
                      const catTypeObj = getCategoryTypeObj(cat.tipe);
                      const isFirst = index === 0;
                      const isLast = index === filtered.length - 1;
                      const isBeingDragged = draggedCategoryId === cat.id;

                      return (
                        <div 
                          key={cat.id || index} 
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', cat.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedCategoryId(cat.id);
                          }}
                          onDragEnd={() => setDraggedCategoryId(null)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const draggedId = e.dataTransfer.getData('text/plain') || draggedCategoryId;
                            if (draggedId && draggedId !== cat.id) {
                              handleDropCategoryReorder(draggedId, cat.id);
                            }
                          }}
                          className={`p-4 flex items-start justify-between gap-3 transition-all duration-150 hover:bg-slate-50/70 dark:hover:bg-slate-900/30 ${
                            isBeingDragged ? 'opacity-40 bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-400' : ''
                          } ${
                            activeTajwidEditId === cat.id ? 'bg-emerald-50/15 dark:bg-emerald-950/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Grip & Order Number Badge */}
                            <div 
                              className="flex flex-col items-center justify-center pt-0.5 text-slate-400 dark:text-slate-500 shrink-0 select-none group"
                              title="Tahan dan seret untuk memindahkan posisi urutan kategori ini"
                            >
                              <div className="cursor-grab active:cursor-grabbing p-1 -m-1 text-slate-350 hover:text-slate-600 dark:hover:text-slate-300 transition">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <span className="text-[9px] font-bold font-mono text-slate-400 dark:text-slate-500 mt-1">
                                #{index + 1}
                              </span>
                            </div>

                            <div className="space-y-1 text-left flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-slate-805 dark:text-white">
                                  {cat.nama}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {catTypeObj.nama}
                                </span>
                                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                  <span className="text-[8px] hidden sm:inline">Pindah:</span>
                                  <select
                                    value={catTypeObj.id}
                                    onChange={(e) => handleQuickChangeCategoryType(cat, e.target.value)}
                                    className="text-[9px] font-bold py-0.5 px-1.5 rounded border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                    title="Ubah tipe klasifikasi kategori ini secara langsung"
                                  >
                                    {klasifikasiKesalahanTypes.map(t => (
                                      <option key={t.id} value={t.id}>
                                        {t.nama}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <span className="text-[8px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-1 py-0.2 rounded uppercase lg:inline hidden">
                                  ID: {cat.id}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                                {cat.deskripsi || <span className="italic text-slate-400">Tidak ada deskripsi rincian pelajaran.</span>}
                              </p>
                              {(() => {
                                const subList = getCategorySubcategoriesList(cat, cat.nama);
                                if (!subList || subList.length === 0) return null;
                                return (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50 font-mono">
                                        🔤 Subkategori ({subList.length} {isMakhrajOrHijaiyahCategory(cat.nama) ? 'Huruf Hijaiyah' : 'Item'}):
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                      {subList.map((sub, sidx) => (
                                        <span 
                                          key={sub.id || sidx}
                                          className="text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-medium"
                                        >
                                          {sub.nama}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Action Buttons: Pindahkan Ke Atas / Ke Bawah, Edit, Hapus */}
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            {/* Tombol Pindah Posisi (Naik / Turun) */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-2xs mr-1">
                              <button
                                type="button"
                                onClick={() => handleMoveCategory(cat, 'up')}
                                disabled={isFirst}
                                className={`p-1.5 rounded transition cursor-pointer ${
                                  isFirst
                                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-35'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 shadow-2xs'
                                }`}
                                title={isFirst ? 'Sudah berada di posisi paling atas' : 'Pindahkan ke atas'}
                                aria-label="Pindahkan ke atas"
                              >
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCategory(cat, 'down')}
                                disabled={isLast}
                                className={`p-1.5 rounded transition cursor-pointer ${
                                  isLast
                                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-35'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 shadow-2xs'
                                }`}
                                title={isLast ? 'Sudah berada di posisi paling bawah' : 'Pindahkan ke bawah'}
                                aria-label="Pindahkan ke bawah"
                              >
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleEditTajwidClick(cat)}
                              className={`p-1.5 rounded transition cursor-pointer ${
                                activeTajwidEditId === cat.id
                                  ? 'bg-emerald-100 text-emerald-805 dark:bg-emerald-900 dark:text-emerald-305'
                                  : 'text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-emerald-600'
                              }`}
                              title="Edit Kategori"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTajwid({ id: cat.id, nama: cat.nama })}
                              className="p-1.5 rounded text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-rose-600 transition cursor-pointer"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ==========================================
          SUB-TAB: Presensi & Kehadiran Guru (Admin Only)
         ========================================== */}
      {user.role === UserRole.ADMIN && activeSubTab === 'presensi_guru' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Header Banner - Teks & Deskripsi di Atas Memanjang ke Kanan, Tombol di Bawah */}
          <div className="flex flex-col gap-4 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-blue-50/50 dark:from-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-slate-800 shadow-2xs">
            {/* Bagian Judul & Deskripsi Memanjang Penuh ke Kanan */}
            <div className="w-full">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0">
                  <UserCheck className="w-5 h-5" />
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Rekapitulasi Kehadiran & Presensi Guru Bimbingan
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Sistem melacak kehadiran guru secara otomatis berdasarkan riwayat pembimbingan setoran santri pada hari tersebut. Admin juga dapat menginputkan keterangan khusus jika guru <strong className="text-amber-600 dark:text-amber-400">Sakit</strong>, <strong className="text-blue-600 dark:text-blue-400">Izin</strong>, atau <strong className="text-rose-600 dark:text-rose-400">Tanpa Keterangan</strong>.
              </p>
            </div>

            {/* Garis Pemisah Halus */}
            <div className="w-full border-t border-emerald-200/60 dark:border-slate-800/80 pt-0.5" />

            {/* Toolbar Tombol Aksi - Berada di Bawah Teks Memanjang Rapi Horizontal */}
            <div className="w-full space-y-2">
              {/* Opsi Switcher Tampilan Khusus Mobile / HP */}
              <div className="flex sm:hidden items-center justify-between gap-2 px-0.5 text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 text-[10.5px] whitespace-nowrap shrink-0">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Susunan:</span>
                </span>
                <div className="flex items-center gap-0.5 bg-white/90 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setAdminPresensiBtnLayout('scroll')}
                    className={`px-2 py-1 rounded-md font-bold transition cursor-pointer text-[10px] whitespace-nowrap ${
                      adminPresensiBtnLayout === 'scroll'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                    title="1 Baris Horizontal Geser (Kompak)"
                  >
                    ↔ 1 Baris Geser
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminPresensiBtnLayout('grid')}
                    className={`px-2 py-1 rounded-md font-bold transition cursor-pointer text-[10px] whitespace-nowrap ${
                      adminPresensiBtnLayout === 'grid'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                    title="Grid Horizontal 2 Kolom Simetris"
                  >
                    ⊞ 2 Kolom Rapi
                  </button>
                </div>
              </div>

              {/* Kontainer Tombol Utama */}
              <div
                className={
                  adminPresensiBtnLayout === 'scroll'
                    ? 'flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 sm:pb-0 scrollbar-thin sm:overflow-visible sm:flex-wrap w-full'
                    : 'grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 sm:flex-wrap w-full'
                }
              >
                {/* 1. Button Input Presensi Guru (Aksi Utama) */}
                <button
                  type="button"
                  onClick={() => {
                    const defaultGuruId = attendanceFilterGurus.length === 1
                      ? attendanceFilterGurus[0]
                      : ((gurus && gurus[0]?.id) || '');
                    setEditingPresensiId(null);
                    setInputGuruId(defaultGuruId);
                    setInputHalaqahId(getDefaultHalaqahSelectionForGuru(defaultGuruId));
                    setInputTanggal(new Date().toISOString().slice(0, 10));
                    setInputStatus('Sakit');
                    setInputCatatan('');
                    setIsPresensiModalOpen(true);
                  }}
                  className={`h-10 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap inline-flex items-center justify-center ${
                    adminPresensiBtnLayout === 'grid'
                      ? 'w-full min-w-0 overflow-hidden px-2.5 sm:px-4 text-[11px] sm:text-xs gap-1 sm:gap-1.5 sm:w-auto sm:shrink-0 sm:overflow-visible'
                      : 'px-3 sm:px-4 text-xs gap-1.5 shrink-0'
                  }`}
                  title="Catat dan input kehadiran/presensi guru pembimbing"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Input Presensi Guru</span>
                </button>

                {/* 2. Button Preview Dokumen Presensi */}
                <button
                  type="button"
                  onClick={() => openPresensiPreview('PDF')}
                  className={`h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap inline-flex items-center justify-center active:scale-95 ${
                    adminPresensiBtnLayout === 'grid'
                      ? 'w-full min-w-0 overflow-hidden px-2.5 sm:px-3.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5 sm:w-auto sm:shrink-0 sm:overflow-visible'
                      : 'px-3 sm:px-3.5 text-xs gap-1.5 shrink-0'
                  }`}
                  title="Lihat Pratinjau Dokumen Presensi Resmi Sebelum Disimpan atau Dikirim"
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                  <span className="truncate">Preview Dokumen</span>
                </button>

                {/* 3. Dropdown Unduh ke Perangkat (PDF, Word, Excel) */}
                <div className={`relative text-left ${adminPresensiBtnLayout === 'grid' ? 'w-full min-w-0 sm:w-auto' : 'shrink-0'}`}>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsPresensiDownloadDropdownOpen(!isPresensiDownloadDropdownOpen);
                      setIsPresensiDriveDropdownOpen(false);
                    }}
                    className={`h-10 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap active:scale-95 ${
                      adminPresensiBtnLayout === 'grid'
                        ? 'w-full min-w-0 overflow-hidden px-2 sm:px-3.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5 sm:w-auto sm:shrink-0 sm:overflow-visible'
                        : 'px-3 sm:px-3.5 text-xs gap-1.5 shrink-0'
                    }`}
                    title="Unduh rekap presensi guru ke PC / Gadget / HP (PDF, Word, Excel)"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                    <span className="truncate">{downloading ? `Mengunduh...` : 'Unduh ke Perangkat'}</span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {isPresensiDownloadDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-2xs" 
                        onClick={() => setIsPresensiDownloadDropdownOpen(false)} 
                      />
                      <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 bottom-6 sm:bottom-auto sm:mt-2 w-auto sm:w-72 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl z-50 p-3 sm:p-2 space-y-1 animate-fade-in text-left">
                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Simpan ke PC / Gadget / HP
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setIsPresensiDownloadDropdownOpen(false)}
                            className="sm:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            exportPresensiGuruToPDF(getExportPresensiGuruFileName(), getFilteredPresensiGuruList());
                            setIsPresensiDownloadDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white text-xs block">Format PDF (.pdf)</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Dokumen PDF Resmi Berbingkai</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            exportPresensiGuruToWord(getExportPresensiGuruFileName(), getFilteredPresensiGuruList());
                            setIsPresensiDownloadDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                        >
                          <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white text-xs block">Format WORD (.doc)</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Microsoft Word dengan Header/Footer</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            exportPresensiGuruToExcel(getExportPresensiGuruFileName(), getFilteredPresensiGuruList());
                            setIsPresensiDownloadDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white text-xs block">Format EXCEL (.xlsx)</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Spreadsheet Rekapitulasi Presensi</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* 4. Button Kirim ke Email Atasan / Kepala Divisi */}
                <button
                  type="button"
                  onClick={() => openPresensiEmailModal('PDF')}
                  className={`h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap inline-flex items-center justify-center active:scale-95 ${
                    adminPresensiBtnLayout === 'grid'
                      ? 'w-full min-w-0 overflow-hidden px-2.5 sm:px-3.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5 sm:w-auto sm:shrink-0 sm:overflow-visible'
                      : 'px-3 sm:px-3.5 text-xs gap-1.5 shrink-0'
                  }`}
                  title="Kirim Laporan Presensi Langsung ke Email Atasan / Kepala Divisi"
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                  <span className="truncate">Kirim ke Email</span>
                </button>

                {/* 5. Dropdown Simpan ke Google Drive (PDF, Docs, Sheet) */}
                <div className={`relative text-left ${adminPresensiBtnLayout === 'grid' ? 'w-full min-w-0 sm:w-auto' : 'shrink-0'}`}>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsPresensiDriveDropdownOpen(!isPresensiDriveDropdownOpen);
                      setIsPresensiDownloadDropdownOpen(false);
                    }}
                    className={`h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap active:scale-95 ${
                      adminPresensiBtnLayout === 'grid'
                        ? 'w-full min-w-0 overflow-hidden px-2 sm:px-3.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5 sm:w-auto sm:shrink-0 sm:overflow-visible'
                        : 'px-3 sm:px-3.5 text-xs gap-1.5 shrink-0'
                    }`}
                    title="Simpan rekap presensi guru langsung ke Google Drive (PDF, Docs, Sheet)"
                  >
                    <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                    <span className="truncate">{uploadingToDrive ? 'Menyiapkan...' : 'Simpan ke Drive'}</span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  </button>

                  {isPresensiDriveDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-2xs" 
                        onClick={() => setIsPresensiDriveDropdownOpen(false)} 
                      />
                      <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 bottom-6 sm:bottom-auto sm:mt-2 w-auto sm:w-72 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl z-50 p-3 sm:p-2 space-y-1 animate-fade-in text-left">
                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Simpan ke Google Drive
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setIsPresensiDriveDropdownOpen(false)}
                            className="sm:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            savePresensiGuruToGoogleDrive(getExportPresensiGuruFileName(), 'PDF', getFilteredPresensiGuruList());
                            setIsPresensiDriveDropdownOpen(false);
                          }}
                          disabled={!!uploadingToDrive}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan PDF ke Drive</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Format PDF Resmi Berbingkai</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            savePresensiGuruToGoogleDrive(getExportPresensiGuruFileName(), 'Docs', getFilteredPresensiGuruList());
                            setIsPresensiDriveDropdownOpen(false);
                          }}
                          disabled={!!uploadingToDrive}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer disabled:opacity-50"
                        >
                          <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan Docs ke Drive</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Format Google Docs (Bisa Diedit)</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            savePresensiGuruToGoogleDrive(getExportPresensiGuruFileName(), 'Sheet', getFilteredPresensiGuruList());
                            setIsPresensiDriveDropdownOpen(false);
                          }}
                          disabled={!!uploadingToDrive}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer disabled:opacity-50"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan Sheet ke Drive</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Format Google Sheet Spreadsheet</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* 6. Button Template Dokumen (Atur Header, Footer, Logo, Kop & Tanda Tangan) */}
                <button
                  type="button"
                  onClick={() => {
                    setTempTemplate(pdfTemplate);
                    setIsTemplateModalOpen(true);
                  }}
                  className={`h-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition shadow-xs border ${
                    (pdfTemplate.headerImageBase64 || pdfTemplate.footerImageBase64)
                      ? 'border-emerald-300 dark:border-emerald-700'
                      : 'border-slate-200 dark:border-slate-700'
                  } cursor-pointer inline-flex items-center justify-center active:scale-95 ${
                    adminPresensiBtnLayout === 'grid'
                      ? 'w-full min-w-0 overflow-hidden px-2 sm:px-3.5 text-[11px] sm:text-xs gap-1.5 sm:w-auto sm:shrink-0 sm:overflow-visible'
                      : 'px-3 sm:px-3.5 text-xs gap-1.5 shrink-0 whitespace-nowrap'
                  }`}
                  title="Atur Header & Footer dokumen, Kop Surat, Logo & Tanda Tangan"
                >
                  <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {adminPresensiBtnLayout === 'grid' ? (
                    <>
                      {/* Mobile 2-kolom: tampilkan rapi tanpa overflow saat badge Kustom aktif */}
                      <span className="sm:hidden min-w-0 flex flex-col items-start justify-center leading-none text-left">
                        <span className="truncate max-w-full leading-tight">Template Dokumen</span>
                        {(pdfTemplate.headerImageBase64 || pdfTemplate.footerImageBase64) && (
                          <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
                            Kustom Aktif
                          </span>
                        )}
                      </span>
                      {/* Desktop: tetap sebaris */}
                      <span className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span>Template Dokumen</span>
                        {(pdfTemplate.headerImageBase64 || pdfTemplate.footerImageBase64) && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full font-mono font-bold shrink-0">
                            Kustom
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Template Dokumen</span>
                      {(pdfTemplate.headerImageBase64 || pdfTemplate.footerImageBase64) && (
                        <span className="ml-0.5 px-1.5 py-0.5 text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full font-mono font-bold shrink-0">
                          Kustom
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Petunjuk Geser jika dalam mode scroll horizontal */}
              {adminPresensiBtnLayout === 'scroll' && (
                <div className="flex sm:hidden items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                  <span>👉 Geser horizontal untuk melihat semua tombol</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">6 Tombol Aksi</span>
                </div>
              )}
            </div>
          </div>

          {/* Notifikasi Inaktivitas Guru Terjadwal Hari Ini */}
          {scheduledGuruWithoutActivity.inactiveList.length > 0 && (
            <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider font-mono">
                    PERINGATAN JADWAL MENGAJAR GURU HARI INI ({scheduledGuruWithoutActivity.todayDayName.toUpperCase()}, {scheduledGuruWithoutActivity.todayDateIso})
                  </h4>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-md">
                  {scheduledGuruWithoutActivity.inactiveList.length} Guru Terjadwal Belum Ada Input Setoran
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Guru berikut terdaftar memiliki <strong>Jadwal Mengajar Hari Ini ({scheduledGuruWithoutActivity.todayDayName})</strong>, namun belum ada riwayat kegiatan/pembimbingan setoran santri yang diinput pada tanggal tersebut:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {scheduledGuruWithoutActivity.inactiveList.map((item) => (
                  <div key={item.scheduleId} className="p-3 bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{item.guruNama}</span>
                        {item.halaqahNama && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 px-1.5 py-0.5 rounded-md">
                            <BookOpen className="w-2.5 h-2.5" /> {item.halaqahNama}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Jadwal: {item.materi || item.halaqahNama || 'Halaqah'} ({item.jamMulai} - {item.jamSelesai})
                      </span>
                      {item.existingAttendanceStatus ? (
                        <span className="text-[9px] font-extrabold uppercase font-mono block text-blue-600 dark:text-blue-400 mt-0.5">
                          ● Status Presensi: {item.existingAttendanceStatus}
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase font-mono block text-rose-600 dark:text-rose-400 mt-0.5">
                          ● Belum Ada Setoran & Belum Ada Keterangan Admin
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPresensiId(null);
                        setInputGuruId(item.guruId);
                        setInputHalaqahId(getDefaultHalaqahSelectionForGuru(item.guruId, item.halaqahId));
                        setInputTanggal(scheduledGuruWithoutActivity.todayDateIso);
                        setInputStatus(item.existingAttendanceStatus || 'Sakit');
                        setInputCatatan(
                          item.existingCatatan ||
                          `Guru memiliki jadwal mengajar${item.halaqahNama ? ` (${item.halaqahNama})` : ''} hari ini namun tidak ada riwayat setoran siswa`
                        );
                        setIsPresensiModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg transition shrink-0 cursor-pointer"
                    >
                      Input Presensi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats Summary Cards */}
          {(() => {
            const filteredPresensiList = getFilteredPresensiGuruList();
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs flex items-center space-x-3.5">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Hadir</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white">
                      {filteredPresensiList.filter(a => a.status === 'Hadir').length}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">sesi</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs flex items-center space-x-3.5">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Guru Sakit</p>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {filteredPresensiList.filter(a => a.status === 'Sakit').length}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">kali</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs flex items-center space-x-3.5">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Guru Izin</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {filteredPresensiList.filter(a => a.status === 'Izin').length}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">kali</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs flex items-center space-x-3.5">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Tanpa Keterangan</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {filteredPresensiList.filter(a => a.status === 'Tanpa Keterangan' || a.status === 'Alpha').length}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">kali</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs space-y-3">
            {/* Top Row Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 font-mono shrink-0">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>FILTER:</span>
              </div>

              {/* Filter Multi-Guru Popover Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  id="attendance-guru-filter-btn"
                  onClick={() => setIsGuruFilterDropdownOpen(!isGuruFilterDropdownOpen)}
                  className={`inline-flex items-center gap-2 border rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    attendanceFilterGurus.length > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-2xs font-bold'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  title="Pilih satu atau lebih guru pembimbing"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-[260px]">
                    {attendanceFilterGurus.length === 0
                      ? 'Semua Guru Pembimbing'
                      : attendanceFilterGurus.length === 1
                      ? getGuruTitleAndName((gurus || []).find(g => g.id === attendanceFilterGurus[0]) || { namaLengkap: '1 Guru' })
                      : `${attendanceFilterGurus.length} Guru Terpilih`}
                  </span>
                  {attendanceFilterGurus.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-mono">
                      {attendanceFilterGurus.length}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isGuruFilterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Modal/Popover */}
                {isGuruFilterDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 space-y-2.5 animate-fade-in text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        Pilih Guru Pembimbing
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsGuruFilterDropdownOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Cari nama guru..."
                        value={guruFilterSearchQuery}
                        onChange={(e) => setGuruFilterSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Quick Selection Actions */}
                    <div className="flex items-center justify-between text-[11px] px-1 font-semibold">
                      <button
                        type="button"
                        onClick={handleSelectAllGurusFilter}
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Pilih Semua ({(gurus || []).length})
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={handleClearAllGurusFilter}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline cursor-pointer"
                      >
                        Semua Guru (Reset)
                      </button>
                    </div>

                    {/* Guru Checkbox List */}
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                      {(gurus || [])
                        .filter(g => {
                          if (!guruFilterSearchQuery) return true;
                          const name = (g.namaLengkap || '').toLowerCase();
                          return name.includes(guruFilterSearchQuery.toLowerCase());
                        })
                        .map(g => {
                          const isChecked = attendanceFilterGurus.includes(g.id);
                          return (
                            <label
                              key={g.id}
                              className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 font-semibold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleGuruFilter(g.id)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer accent-emerald-600"
                              />
                              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {(g.namaLengkap || 'G').charAt(0)}
                              </div>
                              <span className="truncate flex-1">{getGuruTitleAndName(g)}</span>
                              {isChecked && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                            </label>
                          );
                        })}
                    </div>

                    {/* Footer Close Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {attendanceFilterGurus.length === 0 ? 'Semua Guru Dipilih' : `${attendanceFilterGurus.length} Guru Aktif`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsGuruFilterDropdownOpen(false)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer text-xs"
                      >
                        Selesai
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Status */}
              <select
                id="attendance-status-filter"
                value={attendanceFilterStatus}
                onChange={(e) => setAttendanceFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="All">Semua Status Kehadiran</option>
                <option value="Hadir">Hadir</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Tanpa Keterangan">Tanpa Keterangan (Alpha)</option>
              </select>

              {/* Filter Specific Single Date */}
              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tgl Spesifik:</span>
                <input
                  id="attendance-date-filter"
                  type="date"
                  value={attendanceFilterDate}
                  onChange={(e) => setAttendanceFilterDate(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden"
                />
                {attendanceFilterDate && (
                  <button onClick={() => setAttendanceFilterDate('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Info Lokasi Mengajar Badge */}
              <div className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl px-3 py-1.5 text-xs font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-[11px]">Lokasi Laporan:</span>
                <span className="font-bold underline decoration-emerald-400 text-xs">
                  {getDynamicReportLocation(attendanceFilterGuru, getFilteredPresensiGuruList())}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const targetGId = attendanceFilterGuru !== 'All' ? attendanceFilterGuru : (gurus[0]?.id || 'All');
                    setSelectedGuruForLokasiEdit(targetGId);
                    const targetG = (gurus || []).find(g => g.id === targetGId);
                    setLokasiEditInput(targetG ? (targetG.keteranganLokasi || (targetG.lokasiMengajar ? targetG.lokasiMengajar.join(', ') : '')) : '');
                    setIsLokasiModalOpen(true);
                  }}
                  className="ml-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Kelola Lokasi Mengajar Guru"
                >
                  <Settings className="w-3 h-3" />
                  <span>Atur Lokasi</span>
                </button>
              </div>
            </div>

            {/* Selected Guru Chips */}
            {attendanceFilterGurus.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mr-1">
                  Guru Dipilih ({attendanceFilterGurus.length}):
                </span>
                {attendanceFilterGurus.map(gId => {
                  const gObj = (gurus || []).find(g => g.id === gId);
                  if (!gObj) return null;
                  return (
                    <span
                      key={gId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 shadow-2xs"
                    >
                      <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{getGuruTitleAndName(gObj)}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleGuruFilter(gId)}
                        className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
                        title={`Hapus ${gObj.namaLengkap} dari filter`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={handleClearAllGurusFilter}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer ml-1"
                >
                  Reset Semua
                </button>
              </div>
            )}

            {/* Halaqah-Halaqah yang Diampu Guru Terpilih (Dengan Fitur Tick Box Pemilihan Jadwal) */}
            {attendanceFilterGurus.length > 0 && (
              <div className="pt-3 pb-1 border-t border-slate-100 dark:border-slate-850/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      HALAQAH DIAMPU (LEMBAGA):
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      (Centang tick box di depan halaqah untuk memilih jadwal & kehadiran mana saja yang ingin ditampilkan)
                    </span>
                  </div>
                  {teacherNonPrivateHalaqahs.length > 1 && (
                    <div className="flex items-center gap-2 text-[10px] shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedHalaqahIdsForPresensi(teacherNonPrivateHalaqahs.map(h => h.id))}
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        Pilih Semua ({teacherNonPrivateHalaqahs.length})
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedHalaqahIdsForPresensi([])}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  )}
                </div>

                {teacherNonPrivateHalaqahs.length === 0 ? (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 italic">
                    Guru ini belum memiliki halaqah bimbingan lembaga (non-pribadi) yang terdaftar.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {teacherNonPrivateHalaqahs.map(h => {
                      const isChecked = selectedHalaqahIdsForPresensi.includes(h.id);
                      const studentCount = (siswas || []).filter(s => s.halaqahId === h.id).length;
                      
                      return (
                        <label
                          key={h.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 shadow-2xs font-semibold'
                              : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedHalaqahIdsForPresensi(prev => [...prev, h.id]);
                              } else {
                                setSelectedHalaqahIdsForPresensi(prev => prev.filter(id => id !== h.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer accent-emerald-600"
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: h.warnaIdentitas || '#10B981' }}
                          />
                          <span className="text-xs">{h.namaHalaqah}</span>
                          {(h.hariKegiatan || h.waktuKegiatan) && (
                            <span className="text-[10px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/90 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 font-mono">
                              {h.hariKegiatan || ''} {h.waktuKegiatan ? `(${h.waktuKegiatan})` : ''}
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {studentCount} santri
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Row: Month & Year Selection + Date Range Controls */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-850/80 flex flex-wrap items-center gap-3 text-xs">
              
              {/* Pilihan Cepat Bulan & Tahun */}
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Bulan:</span>
                <select
                  id="attendance-filter-month-select"
                  value={attendanceFilterMonth}
                  onChange={(e) => handleAttendanceMonthChange(e.target.value, attendanceFilterYear)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All">Semua Bulan</option>
                  {attendanceFilterMonth === 'Custom' && <option value="Custom" disabled>Rentang Kustom</option>}
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>

                <select
                  id="attendance-filter-year-select"
                  value={attendanceFilterYear}
                  onChange={(e) => handleAttendanceMonthChange(attendanceFilterMonth === 'Custom' ? 'All' : attendanceFilterMonth, e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Tanggal Awal & Tanggal Akhir Inputs */}
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] pl-1">Dari:</span>
                <input
                  id="attendance-filter-start-date"
                  type="date"
                  value={attendanceFilterStartDate}
                  onChange={(e) => handleAttendanceCustomDateChange(e.target.value, attendanceFilterEndDate)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">s.d.</span>
                <input
                  id="attendance-filter-end-date"
                  type="date"
                  value={attendanceFilterEndDate}
                  onChange={(e) => handleAttendanceCustomDateChange(attendanceFilterStartDate, e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Reset Filter Button */}
              {(attendanceFilterStartDate || attendanceFilterEndDate || attendanceFilterMonth !== 'All' || attendanceFilterDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setAttendanceFilterDate('');
                    handleAttendanceMonthChange('All', new Date().getFullYear().toString());
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                  title="Reset Filter Tanggal & Bulan"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reset Filter Waktu
                </button>
              )}

              {/* Active Filter Summary Badge */}
              <div className="ml-auto text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Total Hasil: <span className="font-bold text-slate-800 dark:text-slate-200">{getFilteredPresensiGuruList().length}</span> catatan
              </div>
            </div>
          </div>

          {/* Jadwal Mengajar & Kegiatan Halaqah Terpilih */}
          {attendanceFilterGurus.length > 0 && (
            <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-850">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>Jadwal Mengajar & Kegiatan Halaqah</span>
                      <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {displayedSchedulesForSelectedHalaqahs.length} dari {teacherNonPrivateHalaqahs.length} halaqah aktif terpilih
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Guru: <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {attendanceFilterGurus.length === 1
                          ? formatGuruTitleAndName((gurus || []).find(g => g.id === attendanceFilterGurus[0])?.namaLengkap || '', attendanceFilterGurus[0])
                          : `${attendanceFilterGurus.length} Guru Terpilih (${attendanceFilterGurus.map(id => (gurus || []).find(g => g.id === id)?.namaLengkap).filter(Boolean).join(', ')})`
                        }
                      </span>
                      {selectedHalaqahIdsForPresensi.length > 0 && (
                        <span className="ml-1.5 text-slate-400">• Jadwal yang tampil disesuaikan dengan centang tick box pada filter</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedules Content */}
              {selectedHalaqahIdsForPresensi.length === 0 ? (
                <div className="p-6 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Tidak ada jadwal yang ditampilkan karena semua halaqah di-uncheck.
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                    Silakan centang satu atau lebih tick box halaqah pada bagian FILTER di atas untuk menampilkan jadwal bimbingannya.
                  </p>
                  {teacherNonPrivateHalaqahs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedHalaqahIdsForPresensi(teacherNonPrivateHalaqahs.map(h => h.id))}
                      className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Centang Semua Halaqah ({teacherNonPrivateHalaqahs.length})</span>
                    </button>
                  )}
                </div>
              ) : displayedSchedulesForSelectedHalaqahs.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-400 italic">
                  Belum ada data halaqah lembaga untuk guru ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {displayedSchedulesForSelectedHalaqahs.map(({ halaqah: h, slots, studentCount }) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2.5 transition hover:shadow-xs"
                      style={{ borderLeftWidth: '4px', borderLeftColor: h.warnaIdentitas || '#10B981' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.warnaIdentitas || '#10B981' }} />
                            <span>{h.namaHalaqah}</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {h.sekolahNama || h.jenjangNama || 'Halaqah Lembaga'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                          {studentCount} Santri
                        </span>
                      </div>

                      {/* Detail Sesi Jadwal */}
                      <div className="space-y-1.5 text-xs">
                        {slots.length > 0 ? (
                          slots.map(sch => (
                            <div
                              key={sch.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{sch.hari}</span>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="font-mono text-[11px] font-semibold">{sch.jamMulai} - {sch.jamSelesai}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <span>{sch.materi || 'Tahfidz & Murojaah'}</span>
                                  {sch.catatan && (
                                    <span className="italic text-slate-400">({sch.catatan})</span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
                                sch.status === StatusAktif.AKTIF 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}>
                                {sch.status}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                              <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Hari: <strong className="text-emerald-700 dark:text-emerald-300">{h.hariKegiatan || 'Belum diatur'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Waktu: <strong className="font-mono text-[11px]">{h.waktuKegiatan || 'Sesuai jam operasional halaqah'}</strong></span>
                            </div>
                            <p className="text-[10px] text-slate-400 italic pt-0.5">
                              (Mengikuti jadwal agenda kegiatan halaqah lembaga)
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer Halaqah info */}
                      {(h.keterangan || h.jenisProgram) && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-slate-150/60 dark:border-slate-800/60">
                          Program: <span className="font-semibold text-slate-700 dark:text-slate-300">{h.jenisProgram || h.keterangan}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Table list of Attendance Records */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-150 dark:border-slate-850 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Nama Guru Pembimbing</th>
                    <th className="p-3.5 text-center">Status Kehadiran</th>
                    <th className="p-3.5">Keterangan & Riwayat Bimbingan</th>
                    <th className="p-3.5 text-center">Sumber Data</th>
                    <th className="p-3.5 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {(() => {
                    const filtered = getFilteredPresensiGuruList();

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                            Belum ada riwayat kehadiran guru yang sesuai dengan kriteria filter.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(item => {
                      let statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                          <UserCheck className="w-3 h-3" /> Hadir
                        </span>
                      );

                      if (item.status === 'Sakit') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/50">
                            <AlertCircle className="w-3 h-3" /> Sakit
                          </span>
                        );
                      } else if (item.status === 'Izin') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/50">
                            <Calendar className="w-3 h-3" /> Izin
                          </span>
                        );
                      } else if (item.status === 'Tanpa Keterangan' || item.status === 'Alpha') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/50">
                            <UserX className="w-3 h-3" /> Tanpa Keterangan
                          </span>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                          <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {item.tanggal}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-white">
                            {item.guruNama}
                          </td>
                          <td className="p-3.5 text-center">
                            {statusBadge}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs">
                            <p className="font-medium text-xs leading-relaxed">{item.catatan || '-'}</p>
                            {item.halaqahNamas && item.halaqahNamas.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {item.halaqahNamas.map((hName, hIdx) => (
                                  <span key={hIdx} className="inline-flex items-center gap-1 text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 px-1.5 py-0.5 rounded-md">
                                    <BookOpen className="w-2.5 h-2.5" /> {hName}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.updatedByAdminNama && (
                              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                Diinput admin: {item.updatedByAdminNama}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            {item.isAutoDetected ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                <Sparkles className="w-2.5 h-2.5" /> Otomatis Riwayat ({item.setoranCount} setoran)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                                <Edit3 className="w-2.5 h-2.5" /> Input Manual Admin
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const rowHId = item.halaqahId || (item.halaqahIds && item.halaqahIds.length === 1 ? item.halaqahIds[0] : '');
                                  const teacherHals = getNonPrivateHalaqahsForGuru(item.guruId);
                                  setEditingPresensiId(item.isAutoDetected ? null : item.id);
                                  setInputGuruId(item.guruId);
                                  setInputHalaqahId(
                                    rowHId
                                      ? rowHId
                                      : (teacherHals.length > 1 ? 'ALL' : getDefaultHalaqahSelectionForGuru(item.guruId))
                                  );
                                  setInputTanggal(item.tanggal);
                                  setInputStatus(item.status);
                                  setInputCatatan(item.catatan);
                                  setIsPresensiModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
                                title="Ubah / Input Manual"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {!item.isAutoDetected && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGuruAttendanceOverride(item.id, item.guruId, item.guruNama, item.tanggal, item.halaqahId, item.halaqahNama)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                  title="Hapus Keterangan Manual (Kembali ke Otomatis)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>

              {/* Interactive Ringkasan Kehadiran di Bawah Tabel Dokumen (PDF & Google Docs) */}
              {(() => {
                const filteredList = getFilteredPresensiGuruList();
                const totalHadirCalculated = filteredList.filter(a => a.status === 'Hadir' || !a.status || a.status === 'Hadir (Auto)').length;
                let bulanNormal = 'Juli 2026';
                if (filteredList.length > 0 && filteredList[0].tanggal && filteredList[0].tanggal.length >= 7) {
                  const year = filteredList[0].tanggal.substring(0, 4);
                  const mKey = filteredList[0].tanggal.substring(5, 7);
                  const mName = MONTH_NAMES_MAP[mKey] || `Bulan ${mKey}`;
                  bulanNormal = `${mName} ${year}`;
                }

                return (
                  <div className="p-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-slate-50/60 dark:from-emerald-950/30 dark:via-slate-900/40 dark:to-slate-950 border-t border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Ringkasan Jumlah Hadir di Bawah Tabel (Dokumen PDF & Google Docs)</span>
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Jumlah: {totalHadirCalculated} Hadir (Otomatis)
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                            Teks Bebas Diedit
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 font-sans pl-6">
                          Teks yang tercetak: <strong className="text-emerald-800 dark:text-emerald-300 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/50 font-mono">
                            &ldquo;{formatPresensiSummaryText(pdfTemplate.summaryTextFormat, bulanNormal, totalHadirCalculated)}&rdquo;
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setInlineSummaryText(pdfTemplate.summaryTextFormat || 'Rekap kehadiran bulan {bulan}: {jumlah} kali');
                            setIsEditingSummaryText(!isEditingSummaryText);
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{isEditingSummaryText ? 'Tutup Editor' : 'Edit Teks Ringkasan'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Editor Drawer */}
                    {isEditingSummaryText && (
                      <div className="mt-3.5 pt-3.5 border-t border-emerald-100/80 dark:border-emerald-900/40 space-y-3 animate-fade-in">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2.5 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span>Sesuaikan Teks Kalimat Ringkasan:</span>
                            </label>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                              <span>Variabel:</span>
                              <code className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded">{"{bulan}"}</code>
                              <span>(Nama Bulan)</span>
                              <code className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded">{"{jumlah}"}</code>
                              <span>(Angka Otomatis: {totalHadirCalculated})</span>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={inlineSummaryText}
                            onChange={(e) => setInlineSummaryText(e.target.value)}
                            placeholder="Contoh: Rekap kehadiran bulan {bulan}: {jumlah} kali"
                            className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                          />

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold">Pilihan Cepat Kalimat:</span>
                            <button
                              type="button"
                              onClick={() => setInlineSummaryText('Rekap kehadiran bulan {bulan}: {jumlah} kali')}
                              className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                            >
                              Standar
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineSummaryText('Total kehadiran pengajar pada {bulan}: {jumlah} kali pertemuan')}
                              className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                            >
                              Formal
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineSummaryText('Jumlah Hadir: {jumlah} kali')}
                              className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                            >
                              Ringkas
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineSummaryText('Total presensi guru pembimbing {bulan}: {jumlah} pertemuan')}
                              className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                            >
                              Halaqah
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineSummaryText('Akumulasi tatap muka mengajar {bulan}: {jumlah} sesi')}
                              className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                            >
                              Sesi Mengajar
                            </button>
                          </div>

                          {/* Live Preview Box */}
                          <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
                            <span className="text-[9.5px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">
                              Hasil Pratinjau Teks Dokumen (Angka Dihitung Otomatis):
                            </span>
                            <p className="font-mono font-semibold">
                              {formatPresensiSummaryText(inlineSummaryText, bulanNormal, totalHadirCalculated)}
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEditingSummaryText(false)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={isSavingSummaryText}
                              onClick={() => handleSaveInlineSummaryText(inlineSummaryText)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{isSavingSummaryText ? 'Menyimpan...' : 'Simpan Format Teks'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bottom Quick-Action Toolbar */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono">
                  <span>Total Data:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {getFilteredPresensiGuruList().length} catatan presensi
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setTempTemplate(pdfTemplate);
                      setIsTemplateModalOpen(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer text-xs"
                    title="Atur Header & Footer dokumen, Kop Surat, Logo & Tanda Tangan"
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Template Dokumen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportPresensiGuruToPDF(getExportPresensiGuruFileName(), getFilteredPresensiGuruList())}
                    className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer text-xs"
                    title="Unduh Rekap Presensi Format PDF ke Perangkat"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    <span>Unduh PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPresensiPreview('PDF')}
                    className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer text-xs"
                    title="Lihat Pratinjau Dokumen Rekap Presensi Resmi Sebelum Dikirim atau Diunduh"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    <span>Preview PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPresensiEmailModal('PDF')}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer text-xs"
                    title="Kirim Rekap Presensi Langsung ke Email Atasan / Kepala Divisi"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    <span>Kirim ke Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportPresensiGuruToWord(getExportPresensiGuruFileName(), getFilteredPresensiGuruList())}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer text-xs"
                    title="Unduh Rekap Presensi Format Word (.doc) ke Perangkat"
                  >
                    <FileCode className="w-3.5 h-3.5 mr-1.5" />
                    <span>Unduh Word</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportPresensiGuruToExcel(getExportPresensiGuruFileName(), getFilteredPresensiGuruList())}
                    className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer text-xs"
                    title="Unduh Rekap Presensi Format Excel (.xlsx) ke Perangkat"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                    <span>Unduh Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => savePresensiGuruToGoogleDrive(getExportPresensiGuruFileName(), 'PDF', getFilteredPresensiGuruList())}
                    disabled={!!uploadingToDrive}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer text-xs disabled:opacity-50"
                    title="Simpan Rekap Presensi langsung ke Google Drive"
                  >
                    <Cloud className="w-3.5 h-3.5 mr-1.5" />
                    <span>Ke Google Drive</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-TAB: Jadwal Mengajar Guru (Admin Only)
         ========================================== */}
      {user.role === UserRole.ADMIN && activeSubTab === 'jadwal_guru' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50/50 dark:from-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-emerald-100/80 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Jadwal Mengajar Guru & Sesi Halaqah
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
                Manajemen jadwal rutin mengajar ustadz/ustadzah pembimbing dalam sepekan, dikelompokkan rapi per kelompok halaqah santri, lengkap dengan waktu sesi, materi bimbingan, dan status aktif.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingScheduleId(null);
                setSchGuruId((gurus && gurus[0]?.id) || '');
                setSchHari('Senin');
                setSchJamMulai('07:30');
                setSchJamSelesai('09:00');
                setSchHalaqahId('');
                setSchMateri('Halaqah Tahfidz Pagi');
                setSchStatus(StatusAktif.AKTIF);
                setSchCatatan('');
                setIsScheduleModalOpen(true);
              }}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0 gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Sesi Jadwal Baru
            </button>
          </div>

          {/* Filter Bar & View Mode */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 font-mono">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>FILTER JADWAL:</span>
              </div>

              {/* Filter Guru */}
              <select
                value={scheduleFilterGuru}
                onChange={(e) => setScheduleFilterGuru(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="All">Semua Guru Pembimbing</option>
                {(gurus || []).map(g => (
                  <option key={g.id} value={g.id}>{g.namaLengkap}</option>
                ))}
              </select>

              {/* Filter Hari */}
              <select
                value={scheduleFilterHari}
                onChange={(e) => setScheduleFilterHari(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="All">Semua Hari (Senin - Ahad)</option>
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('halaqah')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    scheduleViewMode === 'halaqah'
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Per Halaqah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('hari')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    scheduleViewMode === 'hari'
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Per Hari</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-slate-400">
              <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {groupedSchedulesByHalaqah.halaqahCards.length} Halaqah
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200/60 dark:border-emerald-900/60">
                {
                  (guruSchedules || []).filter(s => {
                    if (scheduleFilterGuru !== 'All' && s.guruId !== scheduleFilterGuru) return false;
                    if (scheduleFilterHari !== 'All' && s.hari !== scheduleFilterHari) return false;
                    return true;
                  }).length
                } Sesi Total
              </span>
            </div>
          </div>

          {/* Tampilan Sesuai Mode: Per Halaqah (Default yang Elok) atau Per Hari */}
          {scheduleViewMode === 'halaqah' ? (
            groupedSchedulesByHalaqah.halaqahCards.length === 0 && groupedSchedulesByHalaqah.standaloneSchedules.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Tidak ada jadwal atau halaqah yang sesuai dengan filter yang dipilih.
                </p>
                {(scheduleFilterGuru !== 'All' || scheduleFilterHari !== 'All') && (
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleFilterGuru('All');
                      setScheduleFilterHari('All');
                    }}
                    className="mt-3 px-3 py-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer underline"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedSchedulesByHalaqah.halaqahCards.map(({ halaqah: h, guruNama, guruId, slots, studentCount }) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2.5 transition hover:shadow-xs flex flex-col justify-between"
                    style={{ borderLeftWidth: '4px', borderLeftColor: h.warnaIdentitas || '#10B981' }}
                  >
                    <div className="space-y-2.5">
                      {/* Halaqah Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.warnaIdentitas || '#10B981' }} />
                            <span>{h.namaHalaqah}</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {h.sekolahNama || h.jenjangNama || 'Halaqah Lembaga'}
                          </p>
                          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                            Guru: {guruNama}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                          {studentCount} Santri
                        </span>
                      </div>

                      {/* Detail Sesi Jadwal */}
                      <div className="space-y-1.5 text-xs">
                        {slots.length > 0 ? (
                          slots.map(sch => (
                            <div
                              key={sch.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{sch.hari}</span>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="font-mono text-[11px] font-semibold">{sch.jamMulai} - {sch.jamSelesai}</span>
                                </div>

                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <span>{sch.materi || 'Tahfidz & Murojaah'}</span>
                                  {sch.catatan && (
                                    <span className="italic text-slate-400">({sch.catatan})</span>
                                  )}
                                </div>
                                {sch.guruId !== guruId && sch.guruNama && (
                                  <p className="text-[9px] text-slate-400 font-mono">
                                    Pengajar: {sch.guruNama}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
                                  sch.status === StatusAktif.AKTIF 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>
                                  {sch.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingScheduleId(sch.id);
                                    setSchGuruId(sch.guruId);
                                    setSchHari(sch.hari);
                                    setSchJamMulai(sch.jamMulai);
                                    setSchJamSelesai(sch.jamSelesai);
                                    setSchHalaqahId(sch.halaqahId || h.id);
                                    setSchMateri(sch.materi || '');
                                    setSchStatus(sch.status);
                                    setSchCatatan(sch.catatan || '');
                                    setIsScheduleModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-emerald-600 rounded transition cursor-pointer"
                                  title="Edit Sesi Jadwal"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSchedule(sch.id, sch.guruNama, sch.hari)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Hapus Sesi Jadwal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                              <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Hari: <strong className="text-emerald-700 dark:text-emerald-300">{h.hariKegiatan || 'Belum diatur'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Waktu: <strong className="font-mono text-[11px]">{h.waktuKegiatan || 'Sesuai jam operasional halaqah'}</strong></span>
                            </div>
                            <p className="text-[10px] text-slate-400 italic pt-0.5">
                              (Mengikuti jadwal agenda kegiatan halaqah lembaga)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer info */}
                    {(h.keterangan || h.jenisProgram || h.hariKegiatan) && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-slate-150/60 dark:border-slate-800/60 flex items-center justify-between">
                        <span>Program: <strong className="font-semibold text-slate-700 dark:text-slate-300">{h.jenisProgram || h.keterangan || 'Tahfidz'}</strong></span>
                        {h.hariKegiatan && <span className="font-mono text-[9px] text-slate-400">{h.hariKegiatan}</span>}
                      </div>
                    )}
                  </div>
                ))}

                {/* Sesi Mandiri / Umum jika ada */}
                {groupedSchedulesByHalaqah.standaloneSchedules.length > 0 && (
                  <div
                    className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-slate-50/40 dark:bg-slate-900/40 space-y-2.5 transition hover:shadow-xs flex flex-col justify-between"
                    style={{ borderLeftWidth: '4px', borderLeftColor: '#3B82F6' }}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span>Jadwal Bimbingan Mandiri / Lainnya</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Jadwal mengajar umum di luar halaqah terdaftar
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 shrink-0">
                          {groupedSchedulesByHalaqah.standaloneSchedules.length} Sesi
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {groupedSchedulesByHalaqah.standaloneSchedules.map(sch => (
                          <div
                            key={sch.id}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                                <span>{sch.hari}</span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="font-mono text-[11px] font-semibold">{sch.jamMulai} - {sch.jamSelesai}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="font-medium">{sch.materi}</span>
                                <span className="text-slate-400 ml-1.5">• Guru: {sch.guruNama}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
                                sch.status === StatusAktif.AKTIF 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}>
                                {sch.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingScheduleId(sch.id);
                                  setSchGuruId(sch.guruId);
                                  setSchHari(sch.hari);
                                  setSchJamMulai(sch.jamMulai);
                                  setSchJamSelesai(sch.jamSelesai);
                                  setSchHalaqahId(sch.halaqahId || '');
                                  setSchMateri(sch.materi || '');
                                  setSchStatus(sch.status);
                                  setSchCatatan(sch.catatan || '');
                                  setIsScheduleModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                                title="Edit Jadwal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSchedule(sch.id, sch.guruNama, sch.hari)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Tampilan Per Hari */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map(day => {
                if (scheduleFilterHari !== 'All' && scheduleFilterHari !== day) return null;

                const daySchedules = (guruSchedules || []).filter(s => {
                  if (s.hari !== day) return false;
                  if (scheduleFilterGuru !== 'All' && s.guruId !== scheduleFilterGuru) return false;
                  return true;
                });

                return (
                  <div key={day} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs overflow-hidden flex flex-col space-y-3 p-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-emerald-600" /> Hari {day}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        {daySchedules.length} Sesi
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      {daySchedules.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 text-xs italic">
                          Tidak ada jadwal mengajar pada hari {day}.
                        </p>
                      ) : (
                        daySchedules.map(sch => {
                          const matchedHalaqah = (halaqahs || []).find(h => h && (
                            h.id === sch.halaqahId || 
                            (sch.halaqahNama && h.namaHalaqah && typeof sch.halaqahNama === 'string' && typeof h.namaHalaqah === 'string' && sch.halaqahNama.trim().toLowerCase() === h.namaHalaqah.trim().toLowerCase())
                          ));
                          const hColor = matchedHalaqah?.warnaIdentitas || '#10B981';

                          return (
                            <div
                              key={sch.id}
                              className="p-2.5 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition space-y-1.5"
                              style={{ borderLeftWidth: '3px', borderLeftColor: hColor }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                    {sch.guruNama}
                                  </span>
                                  {sch.halaqahNama && (
                                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: hColor }} />
                                      {sch.halaqahNama}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md shrink-0">
                                  {sch.jamMulai} - {sch.jamSelesai}
                                </span>
                              </div>

                              {sch.materi && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-tight">
                                  {sch.materi}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-850/60 text-[10px]">
                                <span className={`font-bold uppercase ${sch.status === StatusAktif.AKTIF ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  ● {sch.status}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingScheduleId(sch.id);
                                      setSchGuruId(sch.guruId);
                                      setSchHari(sch.hari);
                                      setSchJamMulai(sch.jamMulai);
                                      setSchJamSelesai(sch.jamSelesai);
                                      setSchHalaqahId(sch.halaqahId || '');
                                      setSchMateri(sch.materi || '');
                                      setSchStatus(sch.status);
                                      setSchCatatan(sch.catatan || '');
                                      setIsScheduleModalOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded transition cursor-pointer"
                                    title="Edit Jadwal"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSchedule(sch.id, sch.guruNama, sch.hari)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                    title="Hapus Jadwal"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SUB-TAB: Instrumen Capaian Bacaan Ayat
         ========================================== */}
      {activeSubTab === 'capaian_bacaan' && canAccessCapaianBacaan && (
        <div className="animate-fade-in">
          <CapaianBacaanSystem />
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-900 my-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
              <div>
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                  {editingSetoranId ? 'Edit Info Capaian Setoran' : 'Uji Capaian Setoran Baru'}
                </h3>
                <p className="text-xs text-slate-405">Menilai setoran santri di majelis halaqah</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-405" />
              </button>
            </div>

            <form onSubmit={handleAssessmentSubmit} className="space-y-4">
              
              {/* Select student */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">PILIH SISWA / SANTRI *</label>
                <select
                  value={selectedSiswaId}
                  onChange={(e) => setSelectedSiswaId(e.target.value)}
                  className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                >
                  {assessmentStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.namaLengkap} (NIS: {s.nis} | {s.kelasNama})</option>
                  ))}
                </select>
              </div>

              {/* Select target modul */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">PILIH MODUL / MATERI AJAR *</label>
                <select
                  value={selectedModulId}
                  onChange={(e) => {
                    const modulId = e.target.value;
                    setSelectedModulId(modulId);
                    const m = moduls.find(item => item.id === modulId);
                    if (m) {
                      const matchedElements = elemenSettings?.filter(el => {
                        if (m.tipe === TipeModul.NON_AL_QURAN) {
                          if (el.referensiModulId) {
                            return el.referensiModulId === m.id;
                          }
                        }
                        return el.tipeModul === m.tipe;
                      }) || [];
                      if (matchedElements.length > 0) {
                        const firstElem = matchedElements[0];
                        setSelectedElemen(firstElem.id);
                        setSelectedJenisSub(firstElem.jenisSetoranList[0] || '');
                      }
                    }
                  }}
                  className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {moduls.map(m => (
                    <option key={m.id} value={m.id}>{m.namaSurat ? `Surat ${m.namaSurat} (${m.tipe})` : `${m.judulModul} (${m.tipe})`}</option>
                  ))}
                </select>
              </div>

              {/* Render conditional inputs based on selectedModul type */}
              {activeModulObj?.tipe === TipeModul.AL_QURAN ? (
                /* AL QURAN SETORAN OPTIONS */
                <div className="p-3.5 bg-emerald-50/40 dark:bg-slate-900 border border-emerald-150 rounded-xl space-y-4">
                  {(() => {
                    const quranElems = elemenSettings?.filter(e => e.tipeModul === TipeModul.AL_QURAN) || [];
                    if (quranElems.length === 0) return null;
                    return (
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-450 uppercase tracking-wider shrink-0">METODE JALUR:</span>
                        {quranElems.map(elem => (
                          <label key={elem.id} className="inline-flex items-center text-xs text-slate-705 dark:text-slate-350 cursor-pointer">
                            <input 
                              type="radio" 
                              name="setorMethod" 
                              checked={selectedElemen === elem.id} 
                              onChange={() => {
                                setSelectedElemen(elem.id);
                                setSelectedJenisSub(elem.jenisSetoranList[0] || '');
                              }}
                              className="mr-1 text-emerald-600 dark:text-emerald-450 focus:ring-0" 
                            />
                            {elem.nama}
                          </label>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Sub-types of Al-Quran setoran */}
                  {(() => {
                    const activeElem = elemenSettings?.find(e => e.id === selectedElemen);
                    if (activeElem && activeElem.jenisSetoranList.length > 0) {
                      return (
                        <div>
                          <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-wider mb-1">KATEGORI PENILAIAN *</label>
                          <select
                            value={selectedJenisSub}
                            onChange={(e) => setSelectedJenisSub(e.target.value)}
                            className="w-full p-2 border border-slate-205 dark:border-slate-800 rounded bg-white text-xs cursor-pointer"
                          >
                            {activeElem.jenisSetoranList.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Ayat bounds selections */}
                  <div className="grid grid-cols-2 gap-3 pb-1">
                    <div>
                      <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-wider">DARI AYAT</label>
                      <input
                        type="number"
                        min="1"
                        max={maxAyat}
                        value={ayatAwal}
                        onChange={(e) => setAyatAwal(Math.min(maxAyat, Number(e.target.value)))}
                        className="mt-1 w-full p-2 border border-slate-205 dark:border-slate-800 rounded bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Hingga AYAT</label>
                      <input
                        type="number"
                        min={ayatAwal}
                        max={maxAyat}
                        value={ayatAkhir}
                        onChange={(e) => setAyatAkhir(Math.max(ayatAwal, Math.min(maxAyat, Number(e.target.value))))}
                        className="mt-1 w-full p-2 border border-slate-205 dark:border-slate-800 rounded bg-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Render Live Arabic RTL verse text of selected verses array as visual queue */}
                  {activeModulObj?.isiAyat && activeModulObj.isiAyat.length > 0 && (
                    <div className="p-3 bg-white rounded-lg border text-right font-mushaf font-serif leading-relaxed text-slate-850 text-xs shadow-inner">
                      <span className="text-[9px] font-bold text-slate-400 block text-left uppercase font-sans tracking-wide">MUTABAAH MONITORING (LIVE PROMPT)</span>
                      <p className="mt-2 font-normal text-slate-900 dir-rtl font-mushaf flex flex-row flex-wrap gap-x-2 gap-y-1 items-center justify-start text-lg leading-loose" dir="rtl">
                        {activeModulObj.isiAyat
                          .filter(a => a.nomorAyat >= ayatAwal && a.nomorAyat <= ayatAkhir)
                          .map((a, idx) => (
                            <React.Fragment key={idx}>
                              <span>{formatArabicFontClean(a.teksArab)}</span>
                              <span 
                                className="font-mushaf font-serif text-lg font-normal text-emerald-600 dark:text-emerald-400 select-none mx-1 inline-flex items-center justify-center"
                                title={`Nomor Ayat ${a.nomorAyat}`}
                              >
                                {toEasternArabicDigits(a.nomorAyat)}
                              </span>
                            </React.Fragment>
                          ))}
                      </p>
                    </div>
                  )}
                  
                </div>
              ) : (
                /* NON AL QURAN OPTION */
                <div className="p-3.5 bg-indigo-50/50 dark:bg-slate-900 border border-indigo-150 rounded-xl space-y-4">
                  {(() => {
                    const nonQuranElems = elemenSettings?.filter(e => e.tipeModul === TipeModul.NON_AL_QURAN) || [];
                    if (nonQuranElems.length > 1) {
                      return (
                        <div className="flex flex-wrap items-center gap-4 mb-2">
                          <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider shrink-0">METODE:</span>
                          {nonQuranElems.map(elem => (
                            <label key={elem.id} className="inline-flex items-center text-xs text-slate-705 dark:text-slate-355 cursor-pointer">
                              <input 
                                type="radio" 
                                name="nonQuranMethod" 
                                checked={selectedElemen === elem.id} 
                                onChange={() => {
                                  setSelectedElemen(elem.id);
                                  setSelectedJenisSub(elem.jenisSetoranList[0] || '');
                                }}
                                className="mr-1 text-indigo-600 focus:ring-0" 
                              />
                              {elem.nama}
                            </label>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {(() => {
                    const activeElem = elemenSettings?.find(e => e.id === selectedElemen) || elemenSettings?.find(e => e.tipeModul === TipeModul.NON_AL_QURAN);
                    if (activeElem && activeElem.jenisSetoranList.length > 0) {
                      return (
                        <div>
                          <label className="block text-[10px] font-bold text-indigo-850 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                            KATEGORI SETORAN {activeElem.nama.toUpperCase()} *
                          </label>
                          <select
                            value={selectedJenisSub}
                            onChange={(e) => setSelectedJenisSub(e.target.value)}
                            className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold cursor-pointer"
                          >
                            {activeElem.jenisSetoranList.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div>
                    <label className="block text-[10px] font-bold text-indigo-850 uppercase tracking-wider">NOMOR HALAMAN MODUL *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={nonQuranHalaman}
                      onChange={(e) => setNonQuranHalaman(Number(e.target.value))}
                      className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-mono focus:ring-1"
                    />
                  </div>
                </div>
              )}

              {/* Assessment Evaluations values */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-bold">{getNilaiPredikatLabel()} *</label>
                  <select
                    value={nilaiGrade}
                    onChange={(e) => setNilaiGrade(e.target.value)}
                    className="mt-1 w-full p-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                  >
                    <option value="Mumtaz (A+)">Mumtaz (A+)</option>
                    <option value="Jayyid Jiddan (B+)">Jayyid Jiddan (B+)</option>
                    <option value="Jayyid (B)">Jayyid (B)</option>
                    <option value="Maqbul (C)">Maqbul (C)</option>
                    <option value="Perlu Ulangan">Perlu Ulangan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">STATUS EVALUASI</label>
                  <select
                    value={statusLulus ? 'lulus' : 'remedi'}
                    onChange={(e) => setStatusLulus(e.target.value === 'lulus')}
                    className="mt-1 w-full p-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-semibold"
                  >
                    <option value="lulus">LULUS (Masuk Rapor)</option>
                    <option value="remedi">REMEDI (Ulangi)</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">TANGGAL UJI COBA</label>
                <input
                  type="date"
                  required
                  value={tanggalSetoran}
                  onChange={(e) => setTanggalSetoran(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>

              {/* Catatan / Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-bold">CATATAN DAN EVALUASI GURU</label>
                <textarea
                  value={catatanGuru}
                  onChange={(e) => setCatatanGuru(e.target.value)}
                  placeholder="Hafalan lancar, kesalahan tajwid..."
                  className="mt-1 w-full h-16 p-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-105">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 rounded text-xs text-slate-500"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  id="submit-assessment-form"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                >
                  {editingSetoranId ? 'Simpan Perubahan' : 'Simpan Penilaian'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus catatan setoran {confirmDelete.materi} untuk santri <strong>{confirmDelete.namaSiswa}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSetoran(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Elemen Modal */}
      {confirmDeleteElem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Hapus Elemen Pembelajaran</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus elemen pembelajaran <strong>{confirmDeleteElem.nama}</strong>? Seluruh materi ajar yang tergabung ke dalam kategori ini tidak akan bisa menggunakan metode ini lagi.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteElem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteElemConfirm(confirmDeleteElem.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Tajwid Category Modal */}
      {confirmDeleteTajwid && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto text-left">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Hapus Kategori Tajwid</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus Kategori Evaluasi/Kesalahan Tajwid <strong>{confirmDeleteTajwid.nama}</strong>? Tindakan ini akan menghapusnya dari daftar pilihan evaluasi bimbingan guru.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteTajwid(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-805 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTajwidCategory(confirmDeleteTajwid.id);
                  setConfirmDeleteTajwid(null);
                  if (activeTajwidEditId === confirmDeleteTajwid.id) {
                    handleCancelTajwidEdit();
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: Manajemen Tipe Klasifikasi Kesalahan (Admin Only)
         ============================================================== */}
      {isManageKlasifikasiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto text-left overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:from-slate-900 dark:to-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-slate-900 dark:text-white text-base">
                    Kelola Tipe Klasifikasi Kesalahan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tambah, ubah nama, label singkat, deskripsi, atau hapus klasifikasi kesalahan evaluasi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageKlasifikasiModalOpen(false);
                  handleOpenAddKlasifikasi();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Form Col (5 cols) */}
                <div className="lg:col-span-5 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                      {editingKlasifikasiId ? 'EDIT TIPE KLASIFIKASI' : 'TAMBAH TIPE BARU'}
                    </span>
                    {editingKlasifikasiId && (
                      <button
                        type="button"
                        onClick={handleOpenAddKlasifikasi}
                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveKlasifikasi} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Nama Tipe Klasifikasi *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Sifat Huruf, Kelancaran..."
                        value={klasifikasiFormNama}
                        onChange={(e) => setKlasifikasiFormNama(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Label Singkat / Keterangan Singkat
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Hams/Jahr/Isti'la, Jelas/Fatal..."
                        value={klasifikasiFormLabelSingkat}
                        onChange={(e) => setKlasifikasiFormLabelSingkat(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Deskripsi Penjelasan (Opsional)
                      </label>
                      <textarea
                        placeholder="Panduan bagi guru pembimbing mengenai jenis kesalahan ini..."
                        value={klasifikasiFormDeskripsi}
                        onChange={(e) => setKlasifikasiFormDeskripsi(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 h-20 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingKlasifikasiId ? 'Simpan Perubahan Tipe' : 'Tambah Tipe Klasifikasi'}</span>
                    </button>
                  </form>
                </div>

                {/* List Col (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        DAFTAR TIPE KLASIFIKASI ({klasifikasiKesalahanTypes.length})
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Klik tombol edit untuk memperbarui nama & keterangan, atau ikon tempat sampah untuk menghapus.
                      </p>
                    </div>
                  </div>

                  {/* Search Bar for types if many */}
                  {klasifikasiKesalahanTypes.length > 4 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari tipe klasifikasi..."
                        value={klasifikasiSearchQuery}
                        onChange={(e) => setKlasifikasiSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {klasifikasiKesalahanTypes
                      .filter(t => !klasifikasiSearchQuery.trim() || t.nama.toLowerCase().includes(klasifikasiSearchQuery.toLowerCase()) || (t.labelSingkat && t.labelSingkat.toLowerCase().includes(klasifikasiSearchQuery.toLowerCase())))
                      .map((tItem) => {
                        const usageCount = (tajwidCategories || []).filter(c => {
                          const cType = c.tipe || 'lahn_khafiy';
                          if (tItem.id === 'lahn_jaliy') return cType === 'lahn_jaliy' || cType === 'dasar';
                          if (tItem.id === 'lahn_khafiy') return cType === 'lahn_khafiy' || cType === 'tajwid';
                          return cType === tItem.id;
                        }).length;

                        return (
                          <div
                            key={tItem.id}
                            className={`p-3.5 bg-white dark:bg-slate-900 rounded-xl border transition-all ${
                              editingKlasifikasiId === tItem.id
                                ? 'border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {tItem.nama}
                                  </span>
                                  {tItem.labelSingkat && (
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      • {tItem.labelSingkat}
                                    </span>
                                  )}
                                  <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                    ID: {tItem.id}
                                  </span>
                                </div>
                                {tItem.deskripsi && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                    {tItem.deskripsi}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {usageCount} Kategori
                                  </span>
                                  <span>menggunakan tipe ini</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategoryTypeFilter(tItem.id);
                                    setTajwidFormTipe(tItem.id);
                                    setIsManageKlasifikasiModalOpen(false);
                                    setTimeout(() => tajwidFormNamaInputRef.current?.focus(), 100);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title={`Tambah Kategori Baru ke ${tItem.nama}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span className="hidden sm:inline">Tambah Kategori</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditKlasifikasi(tItem)}
                                  className={`p-1.5 rounded transition cursor-pointer ${
                                    editingKlasifikasiId === tItem.id
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600'
                                  }`}
                                  title="Edit Tipe Klasifikasi"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRequestDeleteKlasifikasi(tItem)}
                                  disabled={klasifikasiKesalahanTypes.length <= 1}
                                  className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={klasifikasiKesalahanTypes.length <= 1 ? 'Minimal harus tersisa 1 tipe klasifikasi' : 'Hapus Tipe Klasifikasi'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConfirmResetKlasifikasiModal(true)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 cursor-pointer transition hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Standar Awal (Lahn Jaliy & Lahn Khafiy)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsManageKlasifikasiModalOpen(false);
                  handleOpenAddKlasifikasi();
                }}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer w-full sm:w-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Klasifikasi Type Modal */}
      {confirmDeleteKlasifikasi && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
              Hapus Tipe Klasifikasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus tipe klasifikasi <strong>"{confirmDeleteKlasifikasi.nama}"</strong>?
            </p>
            {confirmDeleteKlasifikasi.affectedCount > 0 ? (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                ⚠️ Tipe ini sedang digunakan oleh <strong>{confirmDeleteKlasifikasi.affectedCount} kategori kesalahan</strong>. Kategori tersebut akan otomatis dialihkan ke tipe klasifikasi standar (Lahn Khafiy).
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">
                Tidak ada kategori yang saat ini menggunakan tipe ini.
              </p>
            )}
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteKlasifikasi(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteKlasifikasi}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus & Alihkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Klasifikasi Types Modal */}
      {confirmResetKlasifikasiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto text-left">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
              Reset Tipe Klasifikasi ke Standar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Tindakan ini akan mengembalikan daftar tipe klasifikasi kesalahan ke standar baku: <strong>Lahn Jaliy</strong> (Jelas / Fatal) dan <strong>Lahn Khafiy</strong> (Samar / Tajwid).
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmResetKlasifikasiModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resetKlasifikasiKesalahanTypes();
                  setConfirmResetKlasifikasiModal(false);
                  handleOpenAddKlasifikasi();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Schedule Modal */}
      {confirmDeleteScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto text-left">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Hapus Jadwal Mengajar</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus jadwal mengajar guru <strong>{confirmDeleteScheduleModal.guruNama}</strong> pada hari <strong>{confirmDeleteScheduleModal.hari}</strong>?
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteScheduleModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteSchedule}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Attendance Override Modal */}
      {confirmDeleteAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto text-left">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Hapus Presensi Manual</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus catatan presensi manual untuk <strong>{confirmDeleteAttendanceModal.guruNama}</strong>{confirmDeleteAttendanceModal.halaqahNama ? <> (Halaqah <strong>{confirmDeleteAttendanceModal.halaqahNama}</strong>)</> : null} pada tanggal <strong>{confirmDeleteAttendanceModal.tanggal}</strong>? Data akan kembali ke status otomatis.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteAttendanceModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteGuruAttendanceOverride}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus Presensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Subcategory Modal */}
      {confirmDeleteSubcatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto text-left">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Hapus Subkategori Kesalahan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus subkategori <strong>{confirmDeleteSubcatModal.nama}</strong> dari daftar evaluasi tajwid?
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteSubcatModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteSubcategory}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage/Add Elemen Pembelajaran Modal */}
      {/* ==========================================
          MASTER PENALTIES MODAL
          ========================================== */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/20 rounded-t-3xl shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Master Bobot Penilaian</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Atur standar nilai dasar, bobot pengurangan, dan batas frekuensi pemotongan nilai</p>
                </div>
              </div>
              <button onClick={() => setIsMasterModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMaster} className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Nilai Dasar (Base Score) Standar *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={masterFormBaseScore}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMasterFormBaseScore(val === '' ? '' : Number(val));
                  }}
                  className="w-full p-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                />
              </div>

              {/* Parameter Pembobotan Proporsional Baris (Error Density) */}
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚖️</span>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Standar Pembobotan Proporsional Baris (Kerapatan Kesalahan / Error Density)
                    </h4>
                    <p className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80">
                      Formula penalti terbalik: semakin sedikit baris setoran, semakin besar bobot nilai per kesalahan dengan batas aman guardrail.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1">
                      Standar Baris Al-Qur'an
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={masterFormStandarBarisQuran}
                        onChange={(e) => setMasterFormStandarBarisQuran(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium">baris</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1" title="Batas bawah pembagi baris agar hukuman kesalahan tidak melompat ekstrem pada setoran sangat pendek">
                      Batas Bawah (Floor) Min
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={masterFormMinBarisQuran}
                        onChange={(e) => setMasterFormMinBarisQuran(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium">baris</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1" title="Batas atas pembagi baris agar potongan nilai pada setoran panjang (misal 2-5 halaman) tetap terukur">
                      Batas Atas (Ceiling) Maks
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="60"
                        value={masterFormMaxBarisQuran}
                        onChange={(e) => setMasterFormMaxBarisQuran(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium">baris</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Standar Baris Non-Quran
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={masterFormDefaultBarisNonQuran}
                        onChange={(e) => setMasterFormDefaultBarisNonQuran(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium">baris (Iqro)</span>
                    </div>
                  </div>

                  {/* Dinamis Sesuai Tipe Klasifikasi Kesalahan pada Tab Kategori Kesalahan */}
                  {(klasifikasiKesalahanTypes || []).map((tipeKlasifikasi) => {
                    const currentBobot = masterFormBobotKlasifikasi[tipeKlasifikasi.id] !== undefined
                      ? masterFormBobotKlasifikasi[tipeKlasifikasi.id]
                      : (tipeKlasifikasi.id === 'lahn_jaliy' ? masterFormBobotLahnJaliy : (tipeKlasifikasi.id === 'lahn_khafiy' ? masterFormBobotLahnKhafiy : 2));

                    return (
                      <div key={tipeKlasifikasi.id} className="relative">
                        <label className="block text-[9px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                          Bobot Standar {tipeKlasifikasi.nama}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={currentBobot}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setMasterFormBobotKlasifikasi(prev => ({
                                ...prev,
                                [tipeKlasifikasi.id]: val
                              }));
                              // Sinkronisasi legacy fields untuk backward compatibility
                              if (tipeKlasifikasi.id === 'lahn_jaliy') {
                                setMasterFormBobotLahnJaliy(val);
                              } else if (tipeKlasifikasi.id === 'lahn_khafiy') {
                                setMasterFormBobotLahnKhafiy(val);
                              }
                            }}
                            className="w-full p-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium">pt / salah</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-white/80 dark:bg-slate-900/60 rounded-xl text-[10px] text-indigo-950 dark:text-indigo-200/90 leading-relaxed border border-indigo-150 dark:border-indigo-900/40">
                  <div className="font-semibold mb-1 flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300">
                    <span>📐</span>
                    <span><strong>Rumus Penilaian</strong>: <code>Poin Pengurangan = (Standar Baris × Bobot Klasifikasi) / Baris Setoran Efektif</code></span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[9.5px] text-slate-650 dark:text-slate-300 mt-1">
                    {(klasifikasiKesalahanTypes || []).map((tipeKlasifikasi) => {
                      const bVal = masterFormBobotKlasifikasi[tipeKlasifikasi.id] !== undefined && masterFormBobotKlasifikasi[tipeKlasifikasi.id] !== ''
                        ? Number(masterFormBobotKlasifikasi[tipeKlasifikasi.id])
                        : (tipeKlasifikasi.id === 'lahn_jaliy' ? 4 : 2);
                      const acuan15 = bVal;
                      const acuan5 = Number(((15 * bVal) / 5).toFixed(1));
                      return (
                        <div key={tipeKlasifikasi.id}>
                          • <strong>{tipeKlasifikasi.nama}</strong>: 15 baris = <strong>-{acuan15} pt</strong> • 5 baris = <strong>-{acuan5} pt</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Informative Banner for 1x Per Session */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-left">
                <span className="text-xl shrink-0 leading-none mt-0.5">✨</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Fitur Pengurangan Maksimal 1x per Setoran
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                      {masterFormOnceCategories.length > 0 ? `${Math.round(masterFormOnceCategories.length / 2)} kategori aktif` : 'Semua tiap kesalahan'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                    Kategori yang diaktifkan sebagai <strong>"Maks 1x Potong"</strong> hanya akan mengurangi nilai satu kali dalam satu sesi setoran, meskipun santri melakukan kesalahan berulang pada kategori tersebut (misalnya <em>Makhraj Huruf</em>). Kategori bertanda <strong>"Tiap Kesalahan"</strong> akan dipotong setiap kali kesalahan dicatat.
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setMasterFormOnceCategories(['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar'])}
                      className="text-[10px] font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                    >
                      Pilih Standar (Hanya Makhraj)
                    </button>
                    <span className="text-amber-400">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const all: string[] = [];
                        (tajwidCategories || []).forEach(tc => {
                          all.push(tc.id, tc.nama);
                        });
                        setMasterFormOnceCategories(all);
                      }}
                      className="text-[10px] font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                    >
                      Semua Kategori 1x
                    </button>
                    <span className="text-amber-400">•</span>
                    <button
                      type="button"
                      onClick={() => setMasterFormOnceCategories([])}
                      className="text-[10px] font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                    >
                      Reset Semua ke Tiap Kesalahan
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Kebijakan Pemotongan per Kategori
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Total Kategori: {(tajwidCategories || []).length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[380px] overflow-y-auto custom-scrollbar">
                  {(tajwidCategories || []).map(cat => {
                    const rawVal = masterFormDeductions[cat.id] !== undefined ? masterFormDeductions[cat.id] : masterFormDeductions[cat.nama];
                    const currentVal = rawVal !== undefined ? rawVal : 0;
                    const isOnce = isMasterCategoryOnce(cat.id, cat.nama);
                    const subList = getCategorySubcategoriesList(cat, cat.nama);
                    const hasSubs = subList && subList.length > 0;
                    const isMakhraj = isMakhrajOrHijaiyahCategory(cat.nama) || isMakhrajOrHijaiyahCategory(cat.id);

                    return (
                      <div
                        key={cat.id}
                        className={`p-2.5 rounded-xl border transition flex flex-col gap-2 ${
                          isOnce
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {cat.nama}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                              {cat.tipe || 'tajwid'}
                            </span>
                            {hasSubs && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shrink-0" title={`Memiliki ${subList.length} subkategori / huruf hijaiyah`}>
                                🔤 {subList.length} {isMakhraj ? 'Huruf' : 'Sub'}
                              </span>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => toggleMasterCategoryOnce(cat.id, cat.nama)}
                            className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer ${
                              isOnce
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                            title={
                              isOnce 
                                ? hasSubs
                                  ? 'Kategori ini memotong poin maksimal 1 kali per huruf/subkategori unik (huruf yang berbeda tetap dipotong)'
                                  : 'Kategori ini hanya memotong poin 1 kali per setoran'
                                : 'Klik untuk mengubah menjadi pemotongan 1 kali per setoran'
                            }
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnce ? 'bg-white' : 'bg-slate-400'}`}></span>
                            <span>{isOnce ? (hasSubs ? (isMakhraj ? 'Maks 1x per Huruf' : 'Maks 1x per Sub') : 'Maks 1x Potong') : 'Tiap Kesalahan'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 rounded-xl text-left flex items-start gap-2.5">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                    <span className="font-bold block">Aturan "Maks 1x Potong" untuk Kategori Bersubkategori (Contoh: Makhraj Huruf):</span>
                    Untuk kategori yang memiliki subkategori (seperti 29 huruf hijaiyah pada Makhraj Huruf), opsi <strong>Maks 1x Potong</strong> berlaku <strong>per huruf/subkategori unik</strong>. Jika santri salah melafalkan huruf <strong className="font-mushaf text-xs">ع</strong> berulang kali, hanya dipotong 1x. Jika santri juga salah pada huruf <strong className="font-mushaf text-xs">ق</strong>, maka dihitung sebagai kesalahan baru (total 2x potong).
                  </div>
                </div>
              </div>

              {/* Ringkasan & Akses Cepat Pengecualian Bobot per Elemen Pembelajaran */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 text-left">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-150">
                        Pengecualian Bobot per Elemen Pembelajaran
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Atur bobot khusus untuk elemen tertentu (misal: Tasmi' kompetensi hafalan, bobot Kelancaran dinaikkan).
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {(elemenSettings || []).filter(e => e.useMasterPenalties === false).length} dari {(elemenSettings || []).length} elemen menggunakan pengecualian
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(elemenSettings || []).length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      Belum ada Elemen Pembelajaran yang terdaftar.
                    </div>
                  ) : (
                    (elemenSettings || []).map((elem) => {
                      const isCustom = elem.useMasterPenalties === false;
                      return (
                        <div
                          key={elem.id}
                          className={`p-3 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isCustom
                              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/60'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-850 dark:text-slate-150">
                                {elem.nama}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {elem.kompetensi || (elem.tipeModul === TipeModul.AL_QURAN ? 'Hafalan' : 'Bacaan')}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                                isCustom
                                  ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                                  : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                              }`}>
                                <span>{isCustom ? '⚡' : '🔗'}</span>
                                <span>{isCustom ? 'Pengecualian Khusus' : 'Standar Master'}</span>
                              </span>
                            </div>

                            {isCustom ? (
                              <div className="flex flex-wrap gap-1.5 pt-0.5 text-[9.5px]">
                                {(klasifikasiKesalahanTypes || []).map((t) => {
                                  const customVal = elem.bobotKlasifikasi?.[t.id] !== undefined
                                    ? elem.bobotKlasifikasi[t.id]
                                    : (t.id === 'lahn_jaliy' && elem.bobotLahnJaliy !== undefined ? elem.bobotLahnJaliy : (t.id === 'lahn_khafiy' && elem.bobotLahnKhafiy !== undefined ? elem.bobotLahnKhafiy : undefined));
                                  const masterVal = masterFormBobotKlasifikasi[t.id] !== undefined
                                    ? masterFormBobotKlasifikasi[t.id]
                                    : (t.id === 'lahn_jaliy' ? masterFormBobotLahnJaliy : 2);
                                  const isDiff = customVal !== undefined && customVal !== masterVal;
                                  return (
                                    <span
                                      key={t.id}
                                      className={`px-1.5 py-0.5 rounded font-medium ${
                                        isDiff
                                          ? 'bg-amber-200/90 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      }`}
                                      title={isDiff ? `Pengecualian: ${customVal} pt (Master: ${masterVal} pt)` : `Sama dgn master: ${masterVal} pt`}
                                    >
                                      {t.nama}: <strong>{customVal !== undefined ? customVal : masterVal} pt</strong>
                                      {isDiff && ' ⚡'}
                                    </span>
                                  );
                                })}
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Base: {elem.baseScore || 100}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Rumus: {elem.rumusPenilaian === 'absolut' ? 'Absolut' : 'Proporsional Baris'}
                                </span>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 leading-snug">
                                Mengikuti seluruh parameter Master (Base {masterFormBaseScore}, Lahn Jaliy {masterFormBobotLahnJaliy} pt, Lahn Khafiy {masterFormBobotLahnKhafiy} pt, dll).
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {isCustom ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsMasterModalOpen(false);
                                    handleOpenElemModal(elem);
                                  }}
                                  className="px-2.5 py-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                  <span>✏️</span>
                                  <span>Ubah Pengecualian</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetElemenToMaster(elem)}
                                  className="px-2 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                                  title="Kembalikan elemen ini agar mengikuti standar Master"
                                >
                                  <span>↺ Reset</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsMasterModalOpen(false);
                                  handleOpenElemModal(elem);
                                  setElemFormUseMasterPenalties(false);
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg transition cursor-pointer flex items-center gap-1"
                              >
                                <span>➕</span>
                                <span>Atur Pengecualian</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                <button type="button" onClick={() => setIsMasterModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-xl transition flex items-center">
                  <Save className="w-4 h-4 mr-2" /> Simpan Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isElemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850 mb-4">
              <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                {editingElemId ? 'Modifikasi Elemen Pembelajaran' : 'Tambah Elemen Pembelajaran Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsElemModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-405" />
              </button>
            </div>

            <form onSubmit={handleSaveElem} className="space-y-4">
              {/* Row 1: Pelajaran & Nama Elemen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Pelajaran
                  </label>
                  <select
                    value={selectedPelajaranId}
                    onChange={(e) => {
                      const mapelId = e.target.value;
                      setSelectedPelajaranId(mapelId);
                      if (mapelId) {
                        const mapel = mataPelajarans?.find(m => m.id === mapelId);
                        if (mapel && mapel.elemenList && mapel.elemenList.length > 0) {
                          setElemFormNama(mapel.elemenList[0].nama);
                        } else {
                          setElemFormNama('');
                        }
                      } else {
                        setElemFormNama('');
                      }
                    }}
                    className="w-full p-2.5 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Pilih Pelajaran (Opsional) --</option>
                    {mataPelajarans?.map(m => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Nama Elemen Pembelajaran *
                  </label>
                  {selectedPelajaranId ? (
                    (() => {
                      const mapel = mataPelajarans?.find(m => m.id === selectedPelajaranId);
                      const listElemen = mapel?.elemenList || [];
                      return (
                        <select
                          required
                          value={elemFormNama}
                          onChange={(e) => setElemFormNama(e.target.value)}
                          className="w-full p-2.5 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Elemen Pembelajaran --</option>
                          {listElemen.map(se => (
                            <option key={se.id} value={se.nama}>{se.nama}</option>
                          ))}
                        </select>
                      );
                    })()
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Tahfizh Baru, Bimbingan Tajwid, Hadits"
                      value={elemFormNama}
                      onChange={(e) => setElemFormNama(e.target.value)}
                      className="w-full p-2.5 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Row 2: Kategori Kompetensi & Tipe Modul Acuan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Kategori Kompetensi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hafalan atau Bacaan"
                    value={elemFormKompetensi}
                    onChange={(e) => setElemFormKompetensi(e.target.value)}
                    className="w-full p-2.5 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed">
                    Digunakan untuk label penilaian setoran (contoh: "Nilai / Predikat Hafalan").
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-bold">
                    Tipe Modul Acuan / Modul Selain Al-Quran *
                  </label>
                  <select
                    value={elemFormTipeModul === TipeModul.AL_QURAN ? 'AL_QURAN' : `NON_AL_QURAN:${elemFormReferensiModulId}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'AL_QURAN') {
                        setElemFormTipeModul(TipeModul.AL_QURAN);
                        setElemFormReferensiModulId('');
                      } else {
                        setElemFormTipeModul(TipeModul.NON_AL_QURAN);
                        const mId = val.replace('NON_AL_QURAN:', '');
                        setElemFormReferensiModulId(mId);
                      }
                    }}
                    className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer bg-white dark:bg-slate-900 focus:outline-none"
                  >
                    <option value="AL_QURAN">Al-Quran (Pelacakan Ayat Arab)</option>
                    <optgroup label="Modul Selain Al-Quran yang Telah Ditambahkan">
                      {moduls.filter(m => m.tipe === TipeModul.NON_AL_QURAN).map(m => (
                        <option key={m.id} value={`NON_AL_QURAN:${m.id}`}>
                          {m.judulModul || m.id}
                        </option>
                      ))}
                      <option value="NON_AL_QURAN:">Selain Al-Quran (Umum / Tanpa Modul Spesifik)</option>
                    </optgroup>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed">
                    Rujukan utama pelacakan setoran modul siswa.
                  </span>
                </div>
              </div>

              {/* Row 3: Kategori Utama / Jenis Setoran & Kategori Kesalahan yang Digunakan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Kategori Utama / Jenis Setoran (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Baru, Murojaah, Sabaq, Ghoib"
                    value={elemFormCategories}
                    onChange={(e) => setElemFormCategories(e.target.value)}
                    className="w-full p-2.5 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed">
                    Pilihan ustadz saat melakukan evaluasi (contoh: Baru, Murojaah).
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Kategori Kesalahan yang Digunakan *
                  </label>
                  <select
                    value={elemFormTipeKesalahan}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setElemFormTipeKesalahan(val);
                      if (val === 'page_based') {
                        setElemFormUsePageRules(true);
                      }
                    }}
                    className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="all">Semua Tipe Kesalahan ({klasifikasiKesalahanTypes.map(k => k.nama).join(' & ') || 'Semua'})</option>
                    {klasifikasiKesalahanTypes.map(k => (
                      <option key={k.id} value={k.id}>
                        Hanya {k.nama} {k.labelSingkat ? `(${k.labelSingkat})` : ''}
                      </option>
                    ))}
                    <option value="page_based">Berdasarkan Rentang Halaman / Jilid (Otomatis Sesuai Halaman)</option>
                    <option value="none">Tidak Ada (Sembunyikan panel kesalahan)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed">
                    Menentukan klasifikasi kesalahan yang akan muncul pada lembar evaluasi.
                  </span>
                </div>
              </div>

              {/* TARGET CAKUPAN HALAQAH (SCOPE) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Cakupan Target Halaqah
                    </label>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tentukan halaqah mana saja yang dapat melihat dan menggunakan elemen ini saat input setoran.
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider ${
                    elemFormTargetScope === 'foundation'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                      : elemFormTargetScope === 'private'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                        : elemFormTargetScope === 'custom'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  }`}>
                    {elemFormTargetScope === 'foundation' && 'Khusus Yayasan'}
                    {elemFormTargetScope === 'private' && 'Khusus Halaqah Pribadi'}
                    {elemFormTargetScope === 'custom' && `Kustom (${elemFormTargetHalaqahIds.length} Halaqah)`}
                    {elemFormTargetScope === 'all' && 'Semua Halaqah (Global)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                    elemFormTargetScope === 'all' 
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="elemTargetScopeRadio"
                      value="all"
                      checked={elemFormTargetScope === 'all'}
                      onChange={() => setElemFormTargetScope('all')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="block font-bold">Semua (Global)</span>
                      <span className="text-[9px] text-slate-400 block font-normal">Yayasan & Pribadi</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                    elemFormTargetScope === 'foundation' 
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-950 dark:text-blue-200 font-bold' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="elemTargetScopeRadio"
                      value="foundation"
                      checked={elemFormTargetScope === 'foundation'}
                      onChange={() => setElemFormTargetScope('foundation')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="block font-bold">Halaqah Yayasan</span>
                      <span className="text-[9px] text-slate-400 block font-normal">Hanya halaqah resmi</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                    elemFormTargetScope === 'private' 
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200 font-bold' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="elemTargetScopeRadio"
                      value="private"
                      checked={elemFormTargetScope === 'private'}
                      onChange={() => setElemFormTargetScope('private')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div className="text-xs">
                      <span className="block font-bold">Halaqah Pribadi</span>
                      <span className="text-[9px] text-slate-400 block font-normal">Hanya bimbingan mandiri</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                    elemFormTargetScope === 'custom' 
                      ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-purple-200 font-bold' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="elemTargetScopeRadio"
                      value="custom"
                      checked={elemFormTargetScope === 'custom'}
                      onChange={() => setElemFormTargetScope('custom')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <span className="block font-bold">Pilih Tertentu</span>
                      <span className="text-[9px] text-slate-400 block font-normal">Daftar halaqah khusus</span>
                    </div>
                  </label>
                </div>

                {elemFormTargetScope === 'custom' && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-900 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Pilih Halaqah Target ({elemFormTargetHalaqahIds.length} Dipilih):</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setElemFormTargetHalaqahIds((halaqahs || []).map(h => h.id))}
                          className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setElemFormTargetHalaqahIds([])}
                          className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {(halaqahs || []).map(h => {
                        const isPriv = isPrivateHalaqah(h);
                        const isChecked = elemFormTargetHalaqahIds.includes(h.id);
                        return (
                          <label
                            key={h.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setElemFormTargetHalaqahIds(prev => [...prev, h.id]);
                                } else {
                                  setElemFormTargetHalaqahIds(prev => prev.filter(id => id !== h.id));
                                }
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                            />
                            <div className="truncate">
                              <span className="truncate block font-medium">{h.namaHalaqah}</span>
                              <span className="text-[9px] text-slate-400 block font-normal">
                                {isPriv ? 'Halaqah Pribadi' : (h.guruPembimbingNama || 'Yayasan')}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* DYNAMIC PAGE RANGE RULES FOR ERROR CATEGORY */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-xl space-y-3 text-left">
                <div className="flex items-start space-x-2.5">
                  <input
                    id="elem-form-use-page-rules"
                    type="checkbox"
                    checked={elemFormUsePageRules || elemFormTipeKesalahan === 'page_based'}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setElemFormUsePageRules(checked);
                      if (checked && elemFormTipeKesalahan !== 'page_based') {
                        setElemFormTipeKesalahan('page_based');
                      } else if (!checked && elemFormTipeKesalahan === 'page_based') {
                        setElemFormTipeKesalahan('all');
                      }
                    }}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4"
                  />
                  <div className="flex-1">
                    <label htmlFor="elem-form-use-page-rules" className="text-xs font-black text-amber-900 dark:text-amber-300 cursor-pointer">
                      Aktifkan Aturan Batas / Rentang Halaman Kategori Kesalahan
                    </label>
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-400 leading-relaxed mt-0.5 font-medium">
                      Memungkinkan pemisahan kategori kesalahan otomatis berdasarkan jilid atau halaman modul (contoh: Jilid Awal = Lahn Jaliy, Lanjut = Lahn Khafiy).
                    </p>
                  </div>
                </div>

                {(elemFormUsePageRules || elemFormTipeKesalahan === 'page_based') && (
                  <div className="mt-2 pt-3 border-t border-amber-200/50 dark:border-amber-800/40 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider font-mono">
                        Daftar Aturan Rentang Halaman ({elemFormPageRules.length})
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setElemFormPageRules([
                              {
                                id: `rule_${Date.now()}_1`,
                                jilidAwal: 1,
                                jilidAkhir: 1,
                                startPage: 4,
                                endPage: 25,
                                tipeKesalahan: 'lahn_jaliy',
                                keterangan: 'Makhraj & Lahn Jaliy (Tingkat Dasar)'
                              },
                              {
                                id: `rule_${Date.now()}_2`,
                                jilidAwal: 1,
                                jilidAkhir: 1,
                                startPage: 26,
                                endPage: 999,
                                tipeKesalahan: 'lahn_khafiy',
                                keterangan: 'Penerapan Kaidah Lahn Khafiy / Tajwid'
                              }
                            ]);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 rounded-lg border border-amber-300 dark:border-amber-700 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>⚡</span>
                          <span>Muat Contoh Standar (Hal 4-25 Lahn Jaliy, Hal 26+ Lahn Khafiy)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const lastRule = elemFormPageRules[elemFormPageRules.length - 1];
                            const nextStart = lastRule ? lastRule.endPage + 1 : 1;
                            const newRule: KategoriKesalahanPageRule = {
                              id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                              jilidAwal: 1,
                              jilidAkhir: 1,
                              startPage: nextStart,
                              endPage: nextStart + 10,
                              tipeKesalahan: 'lahn_jaliy',
                              keterangan: ''
                            };
                            setElemFormPageRules(prev => [...prev, newRule]);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>+</span>
                          <span>Tambah Aturan Halaman</span>
                        </button>
                      </div>
                    </div>

                    {elemFormPageRules.length === 0 ? (
                      <div className="p-3 bg-white/70 dark:bg-slate-900/70 border border-dashed border-amber-300 dark:border-amber-800 rounded-xl text-center text-xs text-amber-800 dark:text-amber-400 font-medium">
                        Belum ada aturan rentang halaman ditambahkan. Klik tombol <strong>+ Tambah Aturan Halaman</strong> atau gunakan tombol contoh di atas.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {elemFormPageRules.map((rule, idx) => (
                          <div key={rule.id || idx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                              <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 font-mono">
                                #ATURAN {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setElemFormPageRules(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                              >
                                Hapus ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-left">
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase">Jilid (Opsional)</label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Contoh: 1"
                                  value={rule.jilidAwal || ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                    setElemFormPageRules(prev => prev.map((r, i) => i === idx ? { ...r, jilidAwal: val, jilidAkhir: val } : r));
                                  }}
                                  className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold bg-slate-50 dark:bg-slate-950"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase">Hal. Awal *</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={rule.startPage}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 1;
                                    setElemFormPageRules(prev => prev.map((r, i) => i === idx ? { ...r, startPage: val } : r));
                                  }}
                                  className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold bg-slate-50 dark:bg-slate-950"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase">Hal. Akhir *</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={rule.endPage}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 1;
                                    setElemFormPageRules(prev => prev.map((r, i) => i === idx ? { ...r, endPage: val } : r));
                                  }}
                                  className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold bg-slate-50 dark:bg-slate-950"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase">Kategori Kesalahan *</label>
                                <select
                                  value={rule.tipeKesalahan}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    setElemFormPageRules(prev => prev.map((r, i) => i === idx ? { ...r, tipeKesalahan: val } : r));
                                  }}
                                  className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold bg-slate-50 dark:bg-slate-950 cursor-pointer"
                                >
                                  <option value="lahn_jaliy">Lahn Jaliy (Jelas / Fatal)</option>
                                  <option value="lahn_khafiy">Lahn Khafiy (Samar / Tajwid)</option>
                                  <option value="all">Semua Kesalahan (Jaliy & Khafiy)</option>
                                  <option value="none">Tidak Ada</option>
                                </select>
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase">Keterangan / Label</label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Makhraj"
                                  value={rule.keterangan || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setElemFormPageRules(prev => prev.map((r, i) => i === idx ? { ...r, keterangan: val } : r));
                                  }}
                                  className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium bg-slate-50 dark:bg-slate-950"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-2.5 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-105 dark:border-slate-850">
                <input
                  id="elem-form-use-jumlah-baris"
                  type="checkbox"
                  checked={elemFormUseJumlahBaris}
                  onChange={(e) => setElemFormUseJumlahBaris(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <div className="flex-1">
                  <label htmlFor="elem-form-use-jumlah-baris" className="text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Aktifkan Fitur Input Jumlah Baris
                  </label>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 font-medium">
                    Jika diaktifkan, ustadz pembimbing dapat mencatat jumlah baris yang berhasil diselesaikan santri saat menginput setoran baru pada elemen ini.
                  </p>
                </div>
              </div>

              {/* SISTEM PENILAIAN OTOMATIS & RUBRIK */}
              <div className="space-y-3.5 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-150/80 dark:border-emerald-900/40 rounded-2xl">
                <div className="flex items-start space-x-2.5">
                  <input
                    id="elem-form-use-rubrik"
                    type="checkbox"
                    checked={elemFormUseRubrikPenilaian}
                    onChange={(e) => setElemFormUseRubrikPenilaian(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                  />
                  <div className="flex-1">
                    <label htmlFor="elem-form-use-rubrik" className="text-xs font-black text-emerald-800 dark:text-emerald-400 cursor-pointer">
                      Gunakan Sistem Penilaian Otomatis (Rubrik & Bobot) *
                    </label>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500 leading-relaxed mt-0.5 font-medium">
                      Jika diaktifkan, nilai dan predikat setoran akan dikunci mutlak dari sistem berdasarkan bobot kesalahan yang dicatat ustadz saat koreksi.
                    </p>
                  </div>
                </div>

                {elemFormUseRubrikPenilaian && (
                  <div className="mt-3 space-y-4 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/30 animate-fade-in text-left">
                    {/* Pilihan: Ikuti Master vs Pengecualian Khusus */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setElemFormUseMasterPenalties(true)}
                        className={`p-2.5 rounded-lg text-left transition flex items-start gap-2.5 cursor-pointer ${
                          elemFormUseMasterPenalties
                            ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-xs border border-blue-200 dark:border-blue-700/60'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-base mt-0.5">🔗</span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Ikuti Master Bobot</span>
                            {elemFormUseMasterPenalties && (
                              <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-extrabold">Aktif</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Mengikuti nilai dasar, rumus, standar baris, dan bobot kesalahan dari Master.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setElemFormUseMasterPenalties(false)}
                        className={`p-2.5 rounded-lg text-left transition flex items-start gap-2.5 cursor-pointer ${
                          !elemFormUseMasterPenalties
                            ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-300 dark:border-amber-700/70'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-base mt-0.5">⚡</span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Pengecualian Bobot Khusus</span>
                            {!elemFormUseMasterPenalties && (
                              <span className="text-[9px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-extrabold">Override</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Atur bobot khusus (misal: Kelancaran dinaikkan jadi 4 pt untuk Tasmi').
                          </p>
                        </div>
                      </button>
                    </div>

                    {elemFormUseMasterPenalties ? (
                      /* Tampilan Saat Mengikuti Master */
                      <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">ℹ️</span>
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                            Elemen ini mengikuti Master Bobot Penilaian
                          </span>
                        </div>
                        <p className="text-[10.5px] text-blue-800/90 dark:text-blue-300/80 leading-relaxed">
                          Pengurangan nilai dihitung otomatis sesuai konfigurasi Master. Nilai Dasar: <strong>{masterPenalties?.baseScore ?? 100}</strong>.
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(klasifikasiKesalahanTypes || []).map((t) => {
                            const bVal = masterPenalties?.bobotKlasifikasi?.[t.id] ?? (t.id === 'lahn_jaliy' ? (masterPenalties?.bobotLahnJaliy ?? 4) : (masterPenalties?.bobotLahnKhafiy ?? 2));
                            return (
                              <span key={t.id} className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-300 rounded font-bold border border-blue-200/80 dark:border-blue-800/60">
                                {t.nama}: -{bVal} pt
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 italic pt-1">
                          💡 Klik tombol <strong>Pengecualian Bobot Khusus</strong> di atas jika ingin membedakan bobot kelancaran atau parameter penilaian untuk elemen ini.
                        </p>
                      </div>
                    ) : (
                      /* Tampilan Mode Pengecualian Bobot Khusus */
                      <div className="space-y-4 animate-fade-in">
                        {/* Banner Pengecualian */}
                        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5">
                          <span className="text-base mt-0.5">⚡</span>
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                              Mode Pengecualian Bobot Khusus Aktif untuk {elemFormNama || 'Elemen Ini'}
                            </span>
                            <p className="text-[10.5px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                              Atur bobot pengurangan yang berbeda khusus untuk elemen ini. Contoh pada elemen <strong>Tasmi'</strong> ({elemFormKompetensi || 'Hafalan'}), Anda dapat menaikkan <strong>Bobot Standar Kelancaran</strong> (misal dari 2 menjadi 4 poin) agar kesalahan kelancaran hafalan memiliki bobot pengurangan lebih signifikan.
                            </p>
                          </div>
                        </div>

                        {/* Standar Bobot per Tipe Klasifikasi Kesalahan */}
                        <div className="p-3.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                Bobot Standar per Klasifikasi Kesalahan (Poin / Kesalahan) *
                              </label>
                              <p className="text-[10px] text-slate-400">
                                Tentukan bobot pengurangan nilai untuk tiap klasifikasi kesalahan pada elemen ini.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const resetMap: Record<string, number | ''> = {};
                                (klasifikasiKesalahanTypes || []).forEach(t => {
                                  resetMap[t.id] = masterPenalties?.bobotKlasifikasi?.[t.id] ?? (t.id === 'lahn_jaliy' ? 4 : 2);
                                });
                                setElemFormBobotKlasifikasi(resetMap);
                                setElemFormBobotLahnJaliy(masterPenalties?.bobotLahnJaliy ?? 4);
                                setElemFormBobotLahnKhafiy(masterPenalties?.bobotLahnKhafiy ?? 2);
                              }}
                              className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer uppercase"
                            >
                              Samakan dgn Master
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {(klasifikasiKesalahanTypes || []).map((tipeKlasifikasi) => {
                              const masterVal = masterPenalties?.bobotKlasifikasi?.[tipeKlasifikasi.id] ?? (tipeKlasifikasi.id === 'lahn_jaliy' ? 4 : 2);
                              const currentVal = elemFormBobotKlasifikasi[tipeKlasifikasi.id] !== undefined
                                ? elemFormBobotKlasifikasi[tipeKlasifikasi.id]
                                : masterVal;
                              const isDiff = currentVal !== '' && Number(currentVal) !== Number(masterVal);

                              return (
                                <div
                                  key={tipeKlasifikasi.id}
                                  className={`p-2.5 rounded-xl border transition ${
                                    isDiff
                                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-750'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5 gap-1">
                                    <label className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 truncate" title={tipeKlasifikasi.nama}>
                                      {tipeKlasifikasi.nama}
                                    </label>
                                    {isDiff ? (
                                      <span className="text-[8.5px] px-1.5 py-0.2 rounded font-extrabold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
                                        ⚡ Override
                                      </span>
                                    ) : (
                                      <span className="text-[8.5px] px-1 py-0.2 rounded font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                        = Master ({masterVal})
                                      </span>
                                    )}
                                  </div>

                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="1"
                                      max="30"
                                      value={currentVal}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const val = raw === '' ? '' : Number(raw);
                                        setElemFormBobotKlasifikasi(prev => ({
                                          ...prev,
                                          [tipeKlasifikasi.id]: val
                                        }));
                                        if (tipeKlasifikasi.id === 'lahn_jaliy') {
                                          setElemFormBobotLahnJaliy(val);
                                        } else if (tipeKlasifikasi.id === 'lahn_khafiy') {
                                          setElemFormBobotLahnKhafiy(val);
                                        }
                                      }}
                                      className="w-full p-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-black pr-14 focus:ring-1 focus:ring-amber-500"
                                    />
                                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">
                                      pt / salah
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Nilai Dasar & Rumus Penilaian */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                              Nilai Dasar (Base Score) *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              max="100"
                              value={elemFormBaseScore}
                              onChange={(e) => {
                                const val = e.target.value;
                                setElemFormBaseScore(val === '' ? '' : Number(val));
                              }}
                              className="w-full p-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                              Metode Rumus Penilaian *
                            </label>
                            <select
                              value={elemFormRumusPenilaian}
                              onChange={(e) => setElemFormRumusPenilaian(e.target.value as any)}
                              className="w-full p-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                            >
                              <option value="proporsional_baris">Proporsional Terhadap Jumlah Baris (Error Density)</option>
                              <option value="absolut">Pengurangan Absolut (Langsung)</option>
                            </select>
                          </div>
                        </div>

                        {/* Parameter Baris jika Proporsional */}
                        {elemFormRumusPenilaian === 'proporsional_baris' && (
                          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl space-y-2.5">
                            <span className="text-[10.5px] font-bold text-indigo-950 dark:text-indigo-200 block">
                              📐 Parameter Baris &amp; Guardrail untuk Elemen Ini:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[9px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1">
                                  Standar Baris
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={elemFormStandarBarisQuran}
                                    onChange={(e) => setElemFormStandarBarisQuran(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full p-1.5 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                                  />
                                  <span className="absolute right-2 top-1.5 text-[9.5px] text-slate-400">baris</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1">
                                  Batas Bawah Min (Floor)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="15"
                                    value={elemFormMinBarisQuran}
                                    onChange={(e) => setElemFormMinBarisQuran(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full p-1.5 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                                  />
                                  <span className="absolute right-2 top-1.5 text-[9.5px] text-slate-400">baris</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1">
                                  Batas Atas Maks (Ceiling)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="10"
                                    max="60"
                                    value={elemFormMaxBarisQuran}
                                    onChange={(e) => setElemFormMaxBarisQuran(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full p-1.5 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                                  />
                                  <span className="absolute right-2 top-1.5 text-[9.5px] text-slate-400">baris</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Kebijakan Pemotongan per Kategori (Maks 1x per Huruf) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              Kebijakan Pemotongan per Kategori Kesalahan
                            </label>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold">
                              <button
                                type="button"
                                onClick={() => setElemFormOnceCategories(['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar'])}
                                className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                              >
                                Standar (Makhraj)
                              </button>
                              <span className="text-slate-300 dark:text-slate-650">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const all: string[] = [];
                                  (tajwidCategories || []).forEach(tc => all.push(tc.id, tc.nama));
                                  setElemFormOnceCategories(all);
                                }}
                                className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                              >
                                Semua 1x
                              </button>
                              <span className="text-slate-300 dark:text-slate-650">•</span>
                              <button
                                type="button"
                                onClick={() => setElemFormOnceCategories([])}
                                className="text-slate-500 hover:underline cursor-pointer"
                              >
                                Reset Tiap Kesalahan
                              </button>
                            </div>
                          </div>

                          {(() => {
                            const filtered = (tajwidCategories || []).filter(c => {
                              if (elemFormTipeKesalahan === 'all') return true;
                              const isJaliy = c.tipe === 'lahn_jaliy' || c.tipe === 'dasar';
                              if (elemFormTipeKesalahan === 'tajwid' || elemFormTipeKesalahan === 'lahn_khafiy') return !isJaliy;
                              if (elemFormTipeKesalahan === 'dasar' || elemFormTipeKesalahan === 'lahn_jaliy') return isJaliy;
                              if (elemFormTipeKesalahan === 'page_based' || elemFormUsePageRules) {
                                if (!elemFormPageRules || elemFormPageRules.length === 0) return true;
                                const allowedTypes = elemFormPageRules.map(r => r.tipeKesalahan);
                                if (allowedTypes.includes('all')) return true;
                                if (isJaliy && (allowedTypes.includes('dasar') || allowedTypes.includes('lahn_jaliy'))) return true;
                                if (!isJaliy && (allowedTypes.includes('tajwid') || allowedTypes.includes('lahn_khafiy'))) return true;
                                return false;
                              }
                              return false;
                            });

                            if (filtered.length === 0) {
                              return (
                                <span className="text-xs text-rose-500 block italic">
                                  Belum ada kategori kesalahan yang sesuai.
                                </span>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-105 dark:border-slate-850 max-h-56 overflow-y-auto">
                                {filtered.map(cat => {
                                  const isOnce = isElemCategoryOnce(cat.id, cat.nama);
                                  const subList = getCategorySubcategoriesList(cat, cat.nama);
                                  const hasSubs = subList && subList.length > 0;
                                  const isMakhraj = isMakhrajOrHijaiyahCategory(cat.nama) || isMakhrajOrHijaiyahCategory(cat.id);

                                  return (
                                    <div
                                      key={cat.id}
                                      className={`p-2 rounded-xl border transition flex items-center justify-between gap-1.5 ${
                                        isOnce
                                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={cat.nama}>
                                          {cat.nama}
                                        </span>
                                        <span className="text-[9px] text-slate-400 italic">({cat.tipe || 'tajwid'})</span>
                                        {hasSubs && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                                            🔤 {subList.length} {isMakhraj ? 'Huruf' : 'Sub'}
                                          </span>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => toggleElemCategoryOnce(cat.id, cat.nama)}
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer ${
                                          isOnce
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isOnce ? 'bg-white' : 'bg-slate-400'}`}></span>
                                        <span>{isOnce ? (hasSubs ? (isMakhraj ? 'Maks 1x per Huruf' : 'Maks 1x per Sub') : 'Maks 1x Potong') : 'Tiap Kesalahan'}</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 rounded-xl text-left flex items-start gap-2">
                          <div className="p-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md shrink-0 mt-0.5">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-[10.5px] text-blue-900 dark:text-blue-200 leading-relaxed">
                            <strong>Aturan "Maks 1x Potong" per Huruf Hijaiyah</strong>: Untuk kategori Makhraj Huruf, pembatasan 1x potong berlaku per huruf hijaiyah unik. Jika santri salah mengucapkan huruf yang sama berkali-kali, hanya dipotong 1x.
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Rentang Predikat */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Konfigurasi Predikat & Kelulusan
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setElemFormRubrikPredikat([
                              { minScore: 95, maxScore: 100, predikat: 'Mumtaz', lulus: true },
                              { minScore: 85, maxScore: 94, predikat: 'Jayyid Jiddan', lulus: true },
                              { minScore: 75, maxScore: 84, predikat: 'Jayyid', lulus: true },
                              { minScore: 60, maxScore: 74, predikat: 'Maqbul', lulus: true },
                              { minScore: 0, maxScore: 59, predikat: 'Murojaah / Rasib', lulus: false },
                            ]);
                          }}
                          className="text-[9px] font-extrabold text-emerald-600 hover:underline bg-transparent border-none cursor-pointer uppercase tracking-wider"
                        >
                          Reset Default
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {elemFormRubrikPredikat.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-slate-105 dark:border-slate-850">
                            <div className="flex items-center space-x-1 shrink-0">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Min"
                                value={item.minScore}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const val = raw === '' ? '' : Number(raw);
                                  setElemFormRubrikPredikat(prev => prev.map((p, i) => i === idx ? { ...p, minScore: val } : p));
                                }}
                                className="w-12 p-1 border border-slate-200 dark:border-slate-800 rounded-center text-center text-xs font-bold"
                              />
                              <span className="text-xs text-slate-400 font-bold">-</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Max"
                                value={item.maxScore}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const val = raw === '' ? '' : Number(raw);
                                  setElemFormRubrikPredikat(prev => prev.map((p, i) => i === idx ? { ...p, maxScore: val } : p));
                                }}
                                className="w-12 p-1 border border-slate-200 dark:border-slate-800 rounded-center text-center text-xs font-bold"
                              />
                            </div>

                            <input
                              type="text"
                              required
                              placeholder="Predikat, misal: Mumtaz"
                              value={item.predikat}
                              onChange={(e) => {
                                const val = e.target.value;
                                setElemFormRubrikPredikat(prev => prev.map((p, i) => i === idx ? { ...p, predikat: val } : p));
                              }}
                              className="flex-1 p-1 border border-slate-200 dark:border-slate-800 rounded text-xs font-bold placeholder-slate-350"
                            />

                            <label className="flex items-center space-x-1 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={item.lulus}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setElemFormRubrikPredikat(prev => prev.map((p, i) => i === idx ? { ...p, lulus: val } : p));
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-3.5 w-3.5"
                              />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lulus</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PENGATURAN PERJENJANGAN ELEMEN & PRASYARAT PEMBELAJARAN */}
              <div className="space-y-3.5 p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 rounded-2xl text-left">
                <div className="flex items-start space-x-2.5">
                  <input
                    id="elem-form-is-berjenjang"
                    type="checkbox"
                    checked={elemFormIsBerjenjang}
                    onChange={(e) => setElemFormIsBerjenjang(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer h-4 w-4"
                  />
                  <div className="flex-1">
                    <label htmlFor="elem-form-is-berjenjang" className="text-xs font-black text-purple-900 dark:text-purple-300 cursor-pointer flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Atur Sebagai Elemen Berjenjang / Prasyarat Bertingkat</span>
                    </label>
                    <p className="text-[10px] text-purple-800/80 dark:text-purple-400 leading-relaxed mt-0.5 font-medium">
                      Jika diaktifkan, elemen ini memiliki tingkat/urutan dan prasyarat kelulusan dari elemen sebelumnya (misal: Qiraah Wajib ➔ Qiraah Modul ➔ Qiraah Tambahan ➔ Tasmi'). Jika tidak dicentang, elemen ini bersifat bebas/paralel dan dapat dipelajari kapan saja.
                    </p>
                  </div>
                </div>

                {elemFormIsBerjenjang && (
                  <div className="space-y-4 pt-3 border-t border-purple-200/60 dark:border-purple-900/40 animate-fade-in">
                    {/* Level / Tingkatan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">
                          Tingkatan / Level Jenjang *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            required
                            value={elemFormJenjangLevel}
                            onChange={(e) => setElemFormJenjangLevel(Number(e.target.value) || 1)}
                            className="w-24 p-2 border border-purple-300 dark:border-purple-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-200"
                          />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            (Level 1 = Dasar, Level 2 = Lanjutan, dst.)
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">
                          Syarat Membuka Akses *
                        </label>
                        <select
                          value={elemFormSyaratBuka}
                          onChange={(e) => setElemFormSyaratBuka(e.target.value as any)}
                          className="w-full p-2 border border-purple-300 dark:border-purple-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="tuntas_target">Wajib Tuntas / Lulus Seluruh Modul Prasyarat</option>
                          <option value="minimal_setoran">Pernah Menyetor Minimal N Kali (Setoran Lulus)</option>
                        </select>
                      </div>
                    </div>

                    {elemFormSyaratBuka === 'minimal_setoran' && (
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-900 flex items-center justify-between">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          Minimal Jumlah Setoran Lulus pada Elemen Prasyarat:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={elemFormMinimalSetoranLulus}
                            onChange={(e) => setElemFormMinimalSetoranLulus(Math.max(1, Number(e.target.value) || 1))}
                            className="w-16 p-1.5 border border-purple-300 dark:border-purple-800 rounded text-center text-xs font-bold bg-purple-50 dark:bg-purple-950/40"
                          />
                          <span className="text-[10px] text-slate-400">kali</span>
                        </div>
                      </div>
                    )}

                    {/* Elemen Prasyarat (Pilih dari elemen lain) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                        Elemen Prasyarat (Harus Diselesaikan Lebih Dulu):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-900">
                        {elemenSettings
                          .filter(e => e.id !== editingElemId)
                          .map(otherElem => {
                            const isChecked = elemFormPrerequisiteElemenIds.includes(otherElem.id);
                            return (
                              <label
                                key={otherElem.id}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-purple-100/70 dark:bg-purple-950/60 border-purple-400 text-purple-950 dark:text-purple-200 font-bold'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setElemFormPrerequisiteElemenIds(prev => [...prev, otherElem.id]);
                                    } else {
                                      setElemFormPrerequisiteElemenIds(prev => prev.filter(id => id !== otherElem.id));
                                    }
                                  }}
                                  className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                                />
                                <div className="truncate">
                                  <span className="truncate block font-bold">{otherElem.nama}</span>
                                  <span className="text-[9px] text-slate-400 block font-normal">
                                    {otherElem.isBerjenjang ? `Level ${otherElem.jenjangLevel || 1}` : 'Bebas'} • {otherElem.kompetensi || otherElem.tipeModul}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        {elemenSettings.filter(e => e.id !== editingElemId).length === 0 && (
                          <div className="col-span-2 text-center text-xs text-slate-400 py-3 italic">
                            Belum ada elemen lain yang tersedia sebagai prasyarat.
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        Tip: Jika tidak ada prasyarat yang dipilih, elemen berjenjang ini dianggap sebagai tingkat pertama (Level 1).
                      </p>
                    </div>

                    {/* Teacher Acceleration Override */}
                    <div className="flex items-start space-x-2.5 p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-900">
                      <input
                        id="elem-form-allow-override"
                        type="checkbox"
                        checked={elemFormAllowTeacherOverride}
                        onChange={(e) => setElemFormAllowTeacherOverride(e.target.checked)}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4"
                      />
                      <div className="flex-1">
                        <label htmlFor="elem-form-allow-override" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Izinkan Akselerasi Guru (Dispensasi Guru)</span>
                        </label>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                          Memungkinkan guru membuka akses elemen ini secara langsung untuk santri yang memiliki capaian bacaan sangat baik tanpa harus menyelesaikan seluruh modul prasyarat terlebih dahulu.
                        </p>
                      </div>
                    </div>

                    {/* Deskripsi Jenjang */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">
                        Catatan / Panduan Jenjang (Opsional)
                      </label>
                      <input
                        type="text"
                        value={elemFormDeskripsiJenjang}
                        onChange={(e) => setElemFormDeskripsiJenjang(e.target.value)}
                        placeholder="Contoh: Prasyarat: Selesai Qiraah Wajib atau lulus tes akselerasi makhraj."
                        className="w-full p-2 border border-purple-200 dark:border-purple-800 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TARGET TUNTAS ELEMEN & CAKUPAN MODUL PEMBELAJARAN */}
              <div className="space-y-4 p-4 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/50 rounded-2xl text-left">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Target Tuntas Elemen &amp; Cakupan Modul</span>
                        {elemFormTargetDurasiBulan && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                            ⏱️ Target: {elemFormTargetDurasiBulan} Bulan
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Tentukan estimasi durasi tuntas kurikulum serta materi spesifik (daftar surah/modul) yang wajib diselesaikan santri.
                      </p>
                    </div>
                  </div>

                  {/* Preset Cepat */}
                  {elemFormTipeModul === TipeModul.AL_QURAN && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setElemFormTargetDurasiBulan(3);
                          setElemFormTargetCakupanMateri('surah_pilihan');
                          setElemFormTargetSurahList([1, 114, 113, 112, 111, 110, 109, 108]);
                          setElemFormTargetCatatanMateri('Urutan setoran: Surah Al-Fatihah kemudian An-Nas mundur s/d Al-Kautsar (8 Surah Pilihan)');
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/60 dark:hover:bg-teal-800 text-teal-900 dark:text-teal-200 rounded-lg border border-teal-300 dark:border-teal-700 transition cursor-pointer shadow-2xs"
                      >
                        ⚡ 8 Surah Wajib (3 Bulan)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setElemFormTargetDurasiBulan(6);
                          setElemFormTargetCakupanMateri('juz_range');
                          setElemFormTargetJuzStart(30);
                          setElemFormTargetJuzEnd(30);
                          setElemFormTargetCatatanMateri('Khatam Juz 30 (Juz \'Amma)');
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-lg border border-emerald-300 dark:border-emerald-700 transition cursor-pointer shadow-2xs"
                      >
                        ⚡ Juz 30 (6 Bulan)
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-teal-200/50 dark:border-teal-900/30 space-y-4">
                  {/* Row 1: Target Durasi Tuntas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">
                        Target Durasi Tuntas *
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative w-28">
                          <input
                            type="number"
                            min="1"
                            max="60"
                            placeholder="Contoh: 3"
                            value={elemFormTargetDurasiBulan}
                            onChange={(e) => {
                              const val = e.target.value;
                              setElemFormTargetDurasiBulan(val === '' ? '' : Math.max(1, Number(val)));
                            }}
                            className="w-full p-2 border border-teal-300 dark:border-teal-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 pr-12"
                          />
                          <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">Bulan</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          (Fleksibel sejak santri mulai aktif)
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">
                        Tipe Cakupan Materi Modul *
                      </label>
                      <select
                        value={elemFormTargetCakupanMateri}
                        onChange={(e) => setElemFormTargetCakupanMateri(e.target.value as any)}
                        className="w-full p-2 border border-teal-300 dark:border-teal-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
                      >
                        {elemFormTipeModul === TipeModul.AL_QURAN ? (
                          <>
                            <option value="surah_pilihan">Daftar Surah Tertentu / Surah Pilihan</option>
                            <option value="juz_range">Rentang Juz Tertentu (misal: Juz 30)</option>
                            <option value="semua">Seluruh Al-Qur'an (Bebas / Tanpa Batasan Surah)</option>
                          </>
                        ) : (
                          <>
                            <option value="halaman_range">Rentang Halaman / Jilid Modul</option>
                            <option value="semua">Seluruh Modul (Semua Halaman)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* KONDISIONAL: SURAH PILIHAN */}
                  {elemFormTipeModul === TipeModul.AL_QURAN && elemFormTargetCakupanMateri === 'surah_pilihan' && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-teal-900 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            Pilih Surah Target Pembelajaran ({elemFormTargetSurahList.length} Surah Dipilih):
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setElemFormTargetSurahList([1, 114, 113, 112, 111, 110, 109, 108])}
                            className="text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                          >
                            Pilih 8 Surah Wajib
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const juz30Surahs = SURAH_LIST.filter(s => s.no >= 78 && s.no <= 114).map(s => s.no);
                              setElemFormTargetSurahList(juz30Surahs);
                            }}
                            className="text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                          >
                            Pilih Semua Juz 30 (37 Surah)
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setElemFormTargetSurahList([])}
                            className="text-rose-600 hover:underline cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        </div>
                      </div>

                      {/* Filter Search Surah */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari nama atau nomor surah..."
                          value={elemSurahSearchTerm}
                          onChange={(e) => setElemSurahSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                        />
                      </div>

                      {/* Surah Checkbox Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                        {SURAH_LIST
                          .filter(s => {
                            if (!elemSurahSearchTerm.trim()) return true;
                            const q = elemSurahSearchTerm.toLowerCase();
                            return s.nama.toLowerCase().includes(q) || String(s.no).includes(q);
                          })
                          .map(s => {
                            const isChecked = elemFormTargetSurahList.includes(s.no);
                            return (
                              <label
                                key={s.no}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-950 dark:text-teal-200 font-bold'
                                    : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setElemFormTargetSurahList(prev => [...prev, s.no]);
                                    } else {
                                      setElemFormTargetSurahList(prev => prev.filter(no => no !== s.no));
                                    }
                                  }}
                                  className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                                />
                                <span className="font-mono text-[10px] text-slate-400 w-5">{s.no}.</span>
                                <span className="truncate text-[11px]">{s.nama}</span>
                              </label>
                            );
                          })}
                      </div>

                      {/* Selected Surahs Summary Tag */}
                      {elemFormTargetSurahList.length > 0 && (
                        <div className="p-2 bg-slate-50 dark:bg-slate-950/80 rounded-lg border border-slate-200/80 dark:border-slate-800 text-[10.5px]">
                          <span className="font-bold text-teal-700 dark:text-teal-300">Surah yang Ditetapkan: </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {SURAH_LIST.filter(s => elemFormTargetSurahList.includes(s.no)).map(s => s.nama).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KONDISIONAL: JUZ RANGE */}
                  {elemFormTipeModul === TipeModul.AL_QURAN && elemFormTargetCakupanMateri === 'juz_range' && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-teal-900 flex items-center gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Juz Awal *</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={elemFormTargetJuzStart}
                          onChange={(e) => setElemFormTargetJuzStart(Number(e.target.value) || 1)}
                          className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-950 text-center"
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-bold mt-4">s/d</span>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Juz Akhir *</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={elemFormTargetJuzEnd}
                          onChange={(e) => setElemFormTargetJuzEnd(Number(e.target.value) || 30)}
                          className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-950 text-center"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-4">
                        (Misal: Juz 30 s/d 30 untuk Juz 'Amma)
                      </span>
                    </div>
                  )}

                  {/* KONDISIONAL: HALAMAN RANGE (MODUL BUKU) */}
                  {elemFormTargetCakupanMateri === 'halaman_range' && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-teal-900 flex items-center gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Halaman Awal *</label>
                        <input
                          type="number"
                          min="1"
                          value={elemFormTargetHalamanStart}
                          onChange={(e) => setElemFormTargetHalamanStart(Number(e.target.value) || 1)}
                          className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-950 text-center"
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-bold mt-4">s/d</span>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Halaman Akhir *</label>
                        <input
                          type="number"
                          min="1"
                          value={elemFormTargetHalamanEnd}
                          onChange={(e) => setElemFormTargetHalamanEnd(Number(e.target.value) || 30)}
                          className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-950 text-center"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-4">
                        (Rentang halaman modul buku yang wajib diselesaikan)
                      </span>
                    </div>
                  )}

                  {/* Catatan Panduan Materi */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">
                      Catatan / Panduan Urutan Pembelajaran (Opsional)
                    </label>
                    <input
                      type="text"
                      value={elemFormTargetCatatanMateri}
                      onChange={(e) => setElemFormTargetCatatanMateri(e.target.value)}
                      placeholder="Contoh: Urutan setoran: Surah Al-Fatihah kemudian An-Nas mundur s/d Al-Kautsar"
                      className="w-full p-2 border border-teal-200 dark:border-teal-800 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-105 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsElemModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded text-xs text-slate-500 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                >
                  {editingElemId ? 'Simpan Perubahan' : 'Tambah Elemen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL HUBUNGKAN GOOGLE DRIVE (BEST EXPERIENCE)
          ==================================================== */}
      {driveAuthPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 text-left my-8">
            <button 
              type="button" 
              onClick={() => setDriveAuthPrompt(null)} 
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Koneksi Google Drive</h4>
                <p className="text-[9px] text-slate-400 font-mono">PILIHAN PENYIMPANAN LAPORAN</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                Akun Google Workspace Anda belum terhubung di sesi ini. Silakan hubungkan akun Google Anda untuk menyimpan file rekap ke folder Google Drive secara otomatis, atau langsung unduh file ke perangkat lokal Anda.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-900 text-[11px] text-slate-500 font-mono">
                <span className="font-bold block text-slate-600 dark:text-slate-400 mb-0.5">Nama File:</span>
                <span className="truncate block text-emerald-600 dark:text-emerald-400">{driveAuthPrompt.fileName}.{driveAuthPrompt.type === 'Excel' ? 'xlsx' : 'pdf'}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleConnectDriveAndSave(driveAuthPrompt.fileName, driveAuthPrompt.type)}
                className="flex items-center justify-center gap-2.5 w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition duration-150 cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-emerald-100" />
                Hubungkan Google &amp; Simpan ke Drive
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeSubTab === 'presensi_guru') {
                    if (driveAuthPrompt.type === 'Excel' || driveAuthPrompt.type === 'Sheet') {
                      exportPresensiGuruToExcel(driveAuthPrompt.fileName, getFilteredPresensiGuruList());
                    } else if (driveAuthPrompt.type === 'Word' || driveAuthPrompt.type === 'Docs') {
                      exportPresensiGuruToWord(driveAuthPrompt.fileName, getFilteredPresensiGuruList());
                    } else {
                      exportPresensiGuruToPDF(driveAuthPrompt.fileName, getFilteredPresensiGuruList());
                    }
                  } else {
                    simulateExport(driveAuthPrompt.type, driveAuthPrompt.fileName);
                  }
                  setDriveAuthPrompt(null);
                }}
                className="flex items-center justify-center gap-2.5 w-full p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/80 transition duration-150 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-450" />
                Unduh File ke Perangkat Lokal
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1">
                Catatan: Jika Google menampilkan <strong>Error 403: access_denied</strong>, email Anda belum didaftarkan di <em>Test Users</em> pada Google Cloud Console project <em>aplikasimonitoring-b5c84</em>. Anda dapat langsung mengunduh file secara lokal di atas.
              </p>

              <button
                type="button"
                onClick={() => setDriveAuthPrompt(null)}
                className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-widest pt-1 cursor-pointer transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
          ====================================================
          MODAL PILIH FOLDER & SIMPAN KE GOOGLE DRIVE
          ==================================================== */}
      {driveSaveItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 my-8 flex flex-col max-h-[85vh] text-left animate-fade-in">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
                  <Cloud className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Simpan ke Google Drive</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Tentukan folder &amp; letak dokumen disimpan</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  type="button" 
                  onClick={handleReauthDrive} 
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title="Hubungkan ulang atau perbarui token akun Google Anda jika sesi kedaluwarsa"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Hubungkan Ulang</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setDriveSaveItem(null)} 
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Drive Selection Tabs (Drive Saya vs Drive Bersama) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mt-3 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchDriveTab('my_drive')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  driveLocationTab === 'my_drive'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Drive Saya</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDriveTab('shared_drives')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  driveLocationTab === 'shared_drives'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Drive Bersama</span>
                {sharedDrivesList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-full font-mono">
                    {sharedDrivesList.length}
                  </span>
                )}
              </button>
            </div>

            {/* Nama File Input */}
            <div className="mb-2 space-y-1 shrink-0">
              <label className="text-[10px] font-bold text-slate-400 block">Nama Dokumen</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Ketik nama file baru..."
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                <span className="text-slate-400 text-xs font-mono">.{driveSaveItem.extension}</span>
              </div>
            </div>

            {/* Search Folder Bar */}
            <div className="relative mb-2 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={folderSearchTerm}
                onChange={(e) => handleSearchFolders(e.target.value)}
                placeholder="Cari nama folder di Google Drive..."
                className="w-full text-xs pl-8 pr-7 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400 text-left"
              />
              {folderSearchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setFolderSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Bersihkan pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Breadcrumb Path & Refresh */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl text-[11px] flex items-center justify-between border border-slate-100 dark:border-slate-900 mb-2 shrink-0">
              <div className="flex items-center flex-wrap gap-1 min-w-0">
                <span className="text-slate-400 font-bold shrink-0">Lokasi:</span>
                {folderPath.map((folder, index) => (
                  <span className="flex items-center gap-1 shrink-0" key={folder.id + '-' + index}>
                    {index > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
                    <button
                      type="button"
                      onClick={() => handleStepBackFolder(folder.id, index)}
                      className={`hover:underline font-extrabold cursor-pointer transition ${
                        index === folderPath.length - 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (driveLocationTab === 'shared_drives' && !activeSharedDriveId) {
                    fetchSharedDrives();
                  } else {
                    fetchDriveFolders(currentFolderId, activeSharedDriveId || undefined);
                  }
                }}
                disabled={isFetchingFolders || isFetchingSharedDrives}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition shrink-0 ml-2 cursor-pointer"
                title="Segarkan daftar folder"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingFolders || isFetchingSharedDrives ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            </div>

            {/* Buat Folder Baru Widget */}
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-900/50 p-2.5 rounded-xl mb-2 shrink-0 space-y-1.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-slate-400" /> Buat Folder Baru Di Lokasi Ini
              </span>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Nama folder baru..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 text-xs p-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder}
                  className="p-2 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold tracking-wider text-[10px] uppercase rounded-lg cursor-pointer transition shadow-xs flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  {isCreatingFolder ? 'Membuat...' : 'Buat Folder'}
                </button>
              </div>
            </div>

            {/* Folder List Scrollbox */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[170px] max-h-[240px] py-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/20 dark:bg-slate-950/20">
              
              {/* Case 1: Search Active */}
              {folderSearchTerm.trim().length >= 2 ? (
                <div className="space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 mb-1 px-1">
                    Hasil Pencarian Folder ("{folderSearchTerm}"):
                  </span>
                  {isSearchingFolders ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      <span className="text-[10px] italic font-mono">Mencari folder...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs px-2">
                      Tidak ditemukan folder dengan kata kunci "{folderSearchTerm}".
                    </div>
                  ) : (
                    searchResults.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(folder)}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{folder.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg shrink-0">
                          Pilih Folder
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : driveLocationTab === 'shared_drives' && !activeSharedDriveId ? (
                /* Case 2: Shared Drives Root List */
                <div className="space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-sky-600 mb-1 px-1">
                    Daftar Drive Bersama (Shared Drives)
                  </span>
                  {isFetchingSharedDrives ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
                      <span className="text-[10px] italic font-mono">Memuat daftar Drive Bersama...</span>
                    </div>
                  ) : sharedDrivesList.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs px-3 space-y-1">
                      <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-slate-600 dark:text-slate-400">Belum ada Drive Bersama yang terdeteksi</p>
                      <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                        Jika akun Google Workspace Anda memiliki Drive Bersama, pastikan email telah ditambahkan sebagai anggota, atau simpan dokumen melalui tab <strong>"Drive Saya"</strong>.
                      </p>
                    </div>
                  ) : (
                    sharedDrivesList.map((drive) => (
                      <button
                        key={drive.id}
                        type="button"
                        onClick={() => handleSelectSharedDrive(drive)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-100 dark:border-slate-900 hover:border-sky-300 transition flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Users className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{drive.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition" />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Case 3: Folder list inside current folder (personal or shared drive) */
                <div className="space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 px-1">
                    Folder Tersedia (Klik Untuk Masuk)
                  </span>

                  {isFetchingFolders ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      <span className="text-[10px] italic font-mono">Mengambil daftar folder Google Drive...</span>
                    </div>
                  ) : driveFolders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs px-2 flex flex-col items-center justify-center gap-1.5">
                      <FolderOpen className="w-7 h-7 text-slate-300 dark:text-slate-700 stroke-1" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Tidak ada sub-folder di tingkat ini.</span>
                      <span className="text-[10.5px] text-slate-400 max-w-xs leading-relaxed">
                        Dokumen akan langsung disimpan di folder ini (<strong>{folderPath[folderPath.length - 1]?.name}</strong>). Anda juga dapat membuat folder baru di atas.
                      </span>
                    </div>
                  ) : (
                    driveFolders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleSelectFolder(folder)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{folder.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 pt-4 border-t border-slate-150 dark:border-slate-900 flex justify-between items-center text-xs mt-3">
              <button 
                type="button" 
                onClick={() => setDriveSaveItem(null)} 
                className="p-2.5 px-4 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeUploadToDrive}
                disabled={!!uploadingToDrive || isCreatingFolder || (driveLocationTab === 'shared_drives' && !activeSharedDriveId)}
                className="p-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-wider uppercase text-[10px] rounded-xl cursor-pointer disabled:opacity-50 select-none shadow-xs flex items-center gap-1.5"
                title={driveLocationTab === 'shared_drives' && !activeSharedDriveId ? 'Silakan pilih salah satu Drive Bersama terlebih dahulu' : 'Simpan dokumen ke lokasi terpilih'}
              >
                {uploadingToDrive ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {driveLocationTab === 'shared_drives' && !activeSharedDriveId 
                        ? 'Pilih Drive Bersama Dulu' 
                        : `Simpan ke: ${folderPath[folderPath.length - 1]?.name || 'Drive Saya'}`}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 
          ====================================================
          MODAL DETAIL SETORAN LENGKAP (VIEW ONLY)
          ==================================================== */}
      {viewingSetoran && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl relative border border-slate-100 dark:border-slate-800/80 my-8 flex flex-col max-h-[90vh] text-left animate-fade-in overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm border border-emerald-100/30">
                  <BookOpen className="w-6 h-6 stroke-2" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Rincian Lengkap Setoran</h4>
                  <div className="flex items-center space-x-2.5 mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{viewingSetoran.tanggalSetoran}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200/20">ID: {viewingSetoran.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider ${
                  viewingSetoran.statusLulus 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-350 border border-emerald-200/20' 
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-350 border border-rose-200/20'
                }`}>
                  {viewingSetoran.statusLulus ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Lulus</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Remedi</span>
                    </>
                  )}
                </span>
                <button 
                  type="button" 
                  onClick={() => setViewingSetoran(null)} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent hover:border-slate-200/35 dark:hover:border-slate-700/50"
                >
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Kolom Kiri: Informasi Santri & Pelajaran */}
                <div className="space-y-6">
                  
                  {/* Card Informasi Santri */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Informasi Santri</h5>
                    <div className="p-5 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl space-y-4 shadow-xs hover:shadow-sm transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-black text-base uppercase shadow-sm">
                          {viewingSetoran.siswaNama?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-base">{viewingSetoran.siswaNama}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">NIS: {viewingSetoran.siswaNis || '-'}</div>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Grup Halaqah</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.halaqahNama || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ustadz/Ustadzah Penguji</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.guruNama || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Materi Ajar & Kategori */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Materi Ajar & Kategori</h5>
                    <div className="p-5 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl space-y-4 shadow-xs hover:shadow-sm transition-all duration-300 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Modul/Kitab</span>
                        <span className="font-black text-slate-800 dark:text-white text-base block">{viewingSetoran.modulNama}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Elemen Setoran</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.jenisSetoran || 'Setoran'}</span>
                        </div>
                        {viewingSetoran.tipeTahfidz && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kategori</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.tipeTahfidz}</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Rincian Ayat/Halaman</span>
                        
                        {viewingSetoran.daftarSuratSetoran && viewingSetoran.daftarSuratSetoran.length > 0 ? (
                          <div className="space-y-2 mt-1">
                            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">Multi-Surat ({viewingSetoran.daftarSuratSetoran.length} surat):</span>
                            <div className="flex flex-wrap gap-1.5">
                              {viewingSetoran.daftarSuratSetoran.map((item, index) => (
                                <span key={index} className="inline-block px-2.5 py-1 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-bold">
                                  {item.suratNama}: {item.ayatAwal}-{item.ayatAkhir}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : viewingSetoran.tipeModul === TipeModul.AL_QURAN ? (
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-xs shadow-xs">
                              {viewingSetoran.suratNama || 'Surat Tidak Teridentifikasi'}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-xl border border-slate-100/50 dark:border-slate-800/50">Ayat {viewingSetoran.ayatAwal} s/d {viewingSetoran.ayatAkhir}</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs shadow-xs">
                              Jilid {viewingSetoran.nonQuranJilid || 1}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                              {viewingSetoran.nonQuranHalamanTunggal ? (
                                `Halaman ${viewingSetoran.halaman || 1}`
                              ) : (
                                `Halaman ${viewingSetoran.nonQuranPageAwal || viewingSetoran.halaman || 1} s/d ${viewingSetoran.nonQuranPageAkhir || viewingSetoran.halaman || 1}`
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nilai / Score Card */}
                  {(() => {
                    const categoryCounts = {
                      tajwid: 0,
                      makhraj: 0,
                      kelancaran: 0,
                      lainnya: 0
                    };
                    viewingSetoran.interactiveComments?.forEach(c => {
                      const cat = (c.category || '').toLowerCase();
                      if (cat.includes('tajwid')) categoryCounts.tajwid++;
                      else if (cat.includes('makhraj') || cat.includes('huruf') || cat.includes('tajwid_makhraj')) categoryCounts.makhraj++;
                      else if (cat.includes('lancar') || cat.includes('baca') || cat.includes('tajwid_kelancaran')) categoryCounts.kelancaran++;
                      else categoryCounts.lainnya++;
                    });
                    const hasMistakes = (categoryCounts.tajwid + categoryCounts.makhraj + categoryCounts.kelancaran + categoryCounts.lainnya) > 0;

                    // Parse the grade/nilai to avoid overflow
                    const parsedNilai = (() => {
                      const val = viewingSetoran.nilai || '';
                      const match = val.match(/\(([^)]+)\)/);
                      if (match) {
                        const code = match[1]; // e.g. "A+" or "B+"
                        const text = val.replace(/\s*\([^)]+\)/, '').trim(); // e.g. "Jayyid Jiddan"
                        return { code, text };
                      }
                      if (val.length <= 4) {
                        return { code: val, text: '' };
                      }
                      if (val.toLowerCase() === 'perlu ulangan') {
                        return { code: '⚠️', text: 'Perlu Ulangan' };
                      }
                      return { code: val.substring(0, 3).toUpperCase(), text: val };
                    })();

                    return (
                      <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 p-5 shadow-sm hover:shadow-md ${
                        viewingSetoran.statusLulus 
                          ? 'bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white dark:from-emerald-950/10 dark:via-slate-900/30 dark:to-slate-950 border-emerald-500/30 dark:border-emerald-500/15' 
                          : 'bg-gradient-to-br from-rose-50/40 via-amber-50/15 to-white dark:from-rose-950/10 dark:via-slate-900/30 dark:to-slate-950 border-rose-500/30 dark:border-rose-500/15'
                      }`}>
                        {/* Elegant background glowing design */}
                        <div className={`absolute -right-8 -bottom-8 w-36 h-36 rounded-full opacity-10 blur-3xl pointer-events-none ${
                          viewingSetoran.statusLulus ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}></div>
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-15 pointer-events-none">
                          <Award className="w-16 h-16 stroke-1 rotate-12 text-slate-400 dark:text-slate-600" />
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 relative z-10">
                          {/* Left Panel: Big circular Score / Grade badge with dynamic font-sizing to prevent wrap */}
                          <div className="flex items-center space-x-4">
                            <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shadow-md relative shrink-0 transition-all duration-300 ${
                              viewingSetoran.statusLulus
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-white dark:border-slate-900 text-white'
                                : 'bg-gradient-to-br from-rose-500 to-amber-600 border-white dark:border-slate-900 text-white'
                            }`}>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-1.5 right-1.5 animate-pulse" />
                              <span className={`font-sans font-black leading-none tracking-tight ${
                                parsedNilai.code.length > 2 ? 'text-lg' : 'text-3xl'
                              }`}>
                                {parsedNilai.code}
                              </span>
                              <span className="text-[8px] font-bold tracking-widest uppercase opacity-85 mt-1">Nilai</span>
                            </div>

                            <div className="space-y-1">
                              <span className={`text-[9px] font-black uppercase tracking-widest block px-2.5 py-0.5 rounded-full w-max ${
                                viewingSetoran.statusLulus 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              }`}>
                                {viewingSetoran.statusLulus ? 'LULUS / JAYYID' : 'BELUM LULUS / REMEDI'}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                                {parsedNilai.text ? `${parsedNilai.text} (${parsedNilai.code})` : viewingSetoran.nilai}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                Kesimpulan: <span className="font-extrabold text-slate-700 dark:text-slate-300">{viewingSetoran.kesimpulanHasilKelulusan || (viewingSetoran.statusLulus ? 'Lulus Sempurna' : 'Perlu Bimbingan Ulang')}</span>
                              </p>
                            </div>
                          </div>

                          {/* Right Panel: Mistakes summary capsules */}
                          <div className="flex flex-col gap-1.5 min-w-[160px] bg-white/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Ringkasan Evaluasi</span>
                            {!hasMistakes ? (
                              <div className="flex items-center space-x-1.5 text-xs text-emerald-650 dark:text-emerald-400 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>✨ Bacaan Mumtaz</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                                {categoryCounts.makhraj > 0 && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-100/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                    <span>{categoryCounts.makhraj} Makhraj</span>
                                  </span>
                                )}
                                {categoryCounts.tajwid > 0 && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-100/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                    <span>{categoryCounts.tajwid} Tajwid</span>
                                  </span>
                                )}
                                {categoryCounts.kelancaran > 0 && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-100/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    <span>{categoryCounts.kelancaran} Lancar</span>
                                  </span>
                                )}
                                {categoryCounts.lainnya > 0 && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-50 text-slate-750 dark:bg-slate-900/30 dark:text-slate-355 border border-slate-100/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-450 shrink-0"></span>
                                    <span>{categoryCounts.lainnya} Lainnya</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Kolom Kanan: Catatan Guru & Koreksi Detail */}
                <div className="space-y-6">
                  
                  {/* Card Catatan Guru */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Catatan Guru / Ustadz</h5>
                    <div className="p-5 bg-amber-50/15 dark:bg-amber-950/5 border border-amber-200/20 dark:border-amber-950/15 rounded-3xl relative min-h-[110px] shadow-xs hover:shadow-sm transition-all duration-300">
                      <span className="absolute top-2.5 right-4 text-amber-500/20 dark:text-amber-500/10 text-5xl font-serif select-none">“</span>
                      <p className="text-xs text-slate-750 dark:text-slate-300 italic font-medium leading-relaxed whitespace-pre-wrap relative z-10">
                        {viewingSetoran.catatanGuru?.trim() ? `"${viewingSetoran.catatanGuru}"` : 'Tidak ada catatan tertulis khusus.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Koreksi Detail Per Kata / Ayat */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Koreksi Detail Per Kata / Ayat</h5>
                    {viewingSetoran.interactiveComments && viewingSetoran.interactiveComments.length > 0 ? (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1.5 scrollbar-thin">
                        {viewingSetoran.interactiveComments.map((item, idx) => (
                          <div key={item.id || idx} className="p-4 border border-amber-200/30 dark:border-slate-800/80 rounded-2xl bg-amber-50/10 dark:bg-slate-900/30 hover:bg-amber-50/20 dark:hover:bg-slate-900/50 transition-all duration-200 flex items-start space-x-4 text-xs shadow-xs">
                            <div className="font-mushaf font-serif text-2xl text-amber-950 dark:text-amber-100 bg-amber-50 dark:bg-amber-950 px-3.5 py-2 rounded-2xl border border-amber-200/50 dark:border-amber-900/50 shadow-inner shrink-0 select-text leading-none flex items-center justify-center min-w-[75px] h-12">
                              {item.target}
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                  {item.info}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                                "{item.comment}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 italic text-xs px-5 flex flex-col items-center justify-center gap-2 shadow-xs bg-slate-50/20 dark:bg-slate-900/10">
                        <CheckCircle className="w-8 h-8 text-emerald-500/40 stroke-1" />
                        <span>Alhamdulillah, tidak ada koreksi kesalahan tajwid/makhraj detail yang dicatat pada sesi setoran ini.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 p-5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 flex justify-end items-center">
              <button 
                type="button" 
                onClick={() => setViewingSetoran(null)} 
                className="py-3 px-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-250 font-bold uppercase text-[10px] tracking-wider rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow border border-slate-200/20"
              >
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: INPUT / EDIT PRESENSI GURU (ADMIN)
         ========================================== */}
      {isPresensiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-850 my-8 text-left">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-slate-850 dark:text-white text-sm">
                  {editingPresensiId ? 'Edit Presensi Guru' : 'Input Presensi / Keterangan Guru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPresensiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGuruAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Pilih Guru Pembimbing *
                </label>
                <select
                  required
                  value={inputGuruId}
                  onChange={(e) => {
                    const nextGuruId = e.target.value;
                    setInputGuruId(nextGuruId);
                    setInputHalaqahId(getDefaultHalaqahSelectionForGuru(nextGuruId));
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Guru --</option>
                  {(gurus || []).map(g => (
                    <option key={g.id} value={g.id}>{g.namaLengkap}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Tanggal Presensi *
                </label>
                <input
                  type="date"
                  required
                  value={inputTanggal}
                  onChange={(e) => setInputTanggal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              {inputGuruId && availableHalaqahsForInputGuru.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Halaqah / Sesi Terdampak {availableHalaqahsForInputGuru.length > 1 ? '*' : ''}
                    </label>
                    {availableHalaqahsForInputGuru.length > 1 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        Membimbing {availableHalaqahsForInputGuru.length} Halaqah
                      </span>
                    )}
                  </div>

                  {availableHalaqahsForInputGuru.length === 1 ? (
                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {availableHalaqahsForInputGuru[0].halaqah.namaHalaqah}
                        </span>
                      </div>
                      {availableHalaqahsForInputGuru[0].dayTimeLabel && (
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 shrink-0">
                          {availableHalaqahsForInputGuru[0].dayTimeLabel}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <select
                        required
                        value={inputHalaqahId}
                        onChange={(e) => setInputHalaqahId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                      >
                        <option value="">-- Pilih Halaqah yang Diizin / Terdampak --</option>
                        {availableHalaqahsForInputGuru.map(({ halaqah, hasScheduleOnSelectedDay, dayTimeLabel }) => (
                          <option key={halaqah.id} value={halaqah.id}>
                            {halaqah.namaHalaqah}
                            {dayTimeLabel
                              ? ` (${hasScheduleOnSelectedDay ? `Jadwal ${inputPresensiDayName}: ` : ''}${dayTimeLabel})`
                              : ''}
                          </option>
                        ))}
                        <option value="ALL">
                          Semua Halaqah Bimbingan Guru ({availableHalaqahsForInputGuru.length} Halaqah - Libur Seharian)
                        </option>
                      </select>
                      <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {inputHalaqahId === 'ALL'
                          ? 'Seluruh halaqah yang dibimbing guru ini pada tanggal tersebut akan mengikuti status presensi ini.'
                          : 'Memilih salah satu halaqah memastikan santri di halaqah lain yang tetap diajar tidak berubah menjadi Libur (L).'}
                      </p>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Status Kehadiran *
                </label>
                <select
                  required
                  value={inputStatus}
                  onChange={(e) => setInputStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="Hadir">🟢 Hadir</option>
                  <option value="Sakit">🟡 Sakit</option>
                  <option value="Izin">🔵 Izin</option>
                  <option value="Tanpa Keterangan">🔴 Tanpa Keterangan (Alpha)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Catatan / Keterangan Admin
                </label>
                <textarea
                  rows={3}
                  placeholder="Misal: Sakit demam tinggi / Izin keperluan keluarga"
                  value={inputCatatan}
                  onChange={(e) => setInputCatatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPresensiModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: INPUT / EDIT JADWAL MENGAJAR GURU (ADMIN)
         ========================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-850 my-8 text-left">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-slate-850 dark:text-white text-sm">
                  {editingScheduleId ? 'Edit Jadwal Mengajar Guru' : 'Tambah Jadwal Mengajar Guru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Pilih Guru Pembimbing *
                </label>
                <select
                  required
                  value={schGuruId}
                  onChange={(e) => setSchGuruId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Guru --</option>
                  {(gurus || []).map(g => (
                    <option key={g.id} value={g.id}>{g.namaLengkap}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Hari Mengajar *
                </label>
                <select
                  required
                  value={schHari}
                  onChange={(e) => setSchHari(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map(h => (
                    <option key={h} value={h}>Hari {h}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={schJamMulai}
                    onChange={(e) => setSchJamMulai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                    Jam Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={schJamSelesai}
                    onChange={(e) => setSchJamSelesai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Kelompok / Halaqah (Opsional)
                </label>
                <select
                  value={schHalaqahId}
                  onChange={(e) => setSchHalaqahId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Tanpa Halaqah Khusus --</option>
                  {(halaqahs || []).map(h => (
                    <option key={h.id} value={h.id}>{h.namaHalaqah}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Materi / Program Bimbingan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Halaqah Tahfidz Pagi & Murojaah Sabqi"
                  value={schMateri}
                  onChange={(e) => setSchMateri(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Status Aktif Schedule
                </label>
                <select
                  value={schStatus}
                  onChange={(e) => setSchStatus(e.target.value as StatusAktif)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value={StatusAktif.AKTIF}>AKTIF</option>
                  <option value={StatusAktif.NON_AKTIF}>NONAKTIF</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN TEMPLATE PDF REKAP PRESENSI */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <Sliders className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white leading-tight">
                    Pengaturan Template PDF Rekap Presensi
                  </h3>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Kustomisasi bingkai, logo header, tanda tangan, dan teks dokumen rekap
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 pt-3 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTemplateTab('header')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTemplateTab === 'header'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Header & Bingkai</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('content')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTemplateTab === 'content'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Isi & Tata Letak</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('signature')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTemplateTab === 'signature'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FileSignature className="w-4 h-4" />
                <span>Tanda Tangan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('preview')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTemplateTab === 'preview'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Pratinjau Layar</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              {/* TAB 1: HEADER & BINGKAI */}
              {activeTemplateTab === 'header' && (
                <div className="space-y-5">
                  {/* Automated Location Notice Banner */}
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start space-x-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          Keterangan Lokasi / Tempat Otomatis
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                          Otomatis Aktif
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
                        Keterangan tempat laporan kini terisi otomatis sesuai <strong>Lokasi Laporan</strong> atau <strong>Lokasi Mengajar Guru</strong> yang sedang dipilih. Pengaturan Judul Dokumen, Sub-Judul, Text Box Kustom, dan Tabel telah dipindahkan ke tab <strong>Isi & Tata Letak</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Header Image Upload */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Gambar Header / Banner Atas (Opsional)</span>
                      </label>
                      {tempTemplate.headerImageBase64 && (
                        <button
                          type="button"
                          onClick={() => setTempTemplate(prev => ({ ...prev, headerImageBase64: '' }))}
                          className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gunakan Bingkai Standar Lembaga</span>
                        </button>
                      )}
                    </div>

                    {tempTemplate.headerImageBase64 ? (
                      <div className="relative p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                        <img
                          src={tempTemplate.headerImageBase64}
                          alt="Header Banner Preview"
                          className="max-h-24 object-contain rounded-lg shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center bg-white dark:bg-slate-900 hover:bg-slate-50 transition">
                        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Upload gambar header/banner lembaga (.png / .jpg)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Rekomendasi rasio memanjang (8:1 / 10:1). Skala tinggi otomatis disesuaikan secara proporsional agar tidak terdistorsi.
                          <br />
                          Jika kosong, sistem otomatis memakai bingkai & logo vector standar lembaga.
                        </p>
                        <label className="mt-3 inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs">
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          <span>Pilih Gambar Header</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setTempTemplate(prev => ({ ...prev, headerImageBase64: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Footer Image Upload */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Gambar Footer / Banner Bawah (Opsional)</span>
                      </label>
                      {tempTemplate.footerImageBase64 && (
                        <button
                          type="button"
                          onClick={() => setTempTemplate(prev => ({ ...prev, footerImageBase64: '' }))}
                          className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gunakan Footer Standar Lembaga</span>
                        </button>
                      )}
                    </div>

                    {tempTemplate.footerImageBase64 ? (
                      <div className="relative p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                        <img
                          src={tempTemplate.footerImageBase64}
                          alt="Footer Banner Preview"
                          className="max-h-20 object-contain rounded-lg shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center bg-white dark:bg-slate-900 hover:bg-slate-50 transition">
                        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Upload gambar footer/banner bawah (.png / .jpg)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Format banner kaki/footer. Skala tinggi otomatis disesuaikan secara proporsional.
                          <br />
                          Jika kosong, sistem memakai bar informasi standar lembaga.
                        </p>
                        <label className="mt-3 inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs">
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          <span>Pilih Gambar Footer</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setTempTemplate(prev => ({ ...prev, footerImageBase64: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Header & Footer Text Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Badge Sub-Header (Atas Kanan)
                      </label>
                      <input
                        type="text"
                        value={tempTemplate.headerBadgeText}
                        onChange={(e) => setTempTemplate(prev => ({ ...prev, headerBadgeText: e.target.value }))}
                        placeholder="e.g. DIVISI PEMBINAAN AL-QURAN"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Dicetak pada badge pojok kanan atas kop dokumen.</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Teks Footer (Media Sosial / Informasi)
                      </label>
                      <input
                        type="text"
                        value={tempTemplate.footerSocialText}
                        onChange={(e) => setTempTemplate(prev => ({ ...prev, footerSocialText: e.target.value }))}
                        placeholder="e.g. Portal Manajemen Halaqah Al-Quran"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Dicetak pada bilah bagian kaki / footer halaman.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ISI DOKUMEN & TATA LETAK */}
              {activeTemplateTab === 'content' && (
                <div className="space-y-6">
                  {/* Bagian 1: Urutan Tata Letak Elemen Dokumen */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Urutan Posisi Elemen Dokumen (Tata Letak)
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Klik tombol ▲ / ▼ untuk memindahkan urutan posisi
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(tempTemplate.elementsOrder || ['title', 'textboxes', 'table']).map((elemKey, idx, arr) => {
                        const isTitle = elemKey === 'title';
                        const isTextBoxes = elemKey === 'textboxes';
                        const isTable = elemKey === 'table';

                        return (
                          <div 
                            key={elemKey}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center space-x-2">
                                  {isTitle && <Heading1 className="w-4 h-4 text-blue-600" />}
                                  {isTextBoxes && <Type className="w-4 h-4 text-purple-600" />}
                                  {isTable && <Table className="w-4 h-4 text-emerald-600" />}
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {isTitle && 'Judul Utama Dokumen & Info Periode/Lokasi'}
                                    {isTextBoxes && `Text Box Kustom & Sub-Judul (${(tempTemplate.textBoxes || []).length} text box)`}
                                    {isTable && 'Tabel Rekapitulasi Presensi Kehadiran'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {isTitle && 'Mencetak judul utama, periode bulan, dan lokasi bimbingan otomatis.'}
                                  {isTextBoxes && 'Mencetak sub-judul, pengantar dokumen, atau catatan instruksi bimbingan.'}
                                  {isTable && 'Mencetak tabel catatan kehadiran guru mengajar sesuai kolom yang dicentang.'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveElement(idx, 'up')}
                                title="Pindah ke Atas"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === arr.length - 1}
                                onClick={() => handleMoveElement(idx, 'down')}
                                title="Pindah ke Bawah"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bagian 2: Judul Utama Dokumen */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Heading1 className="w-4 h-4 text-emerald-600" />
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Judul Utama Dokumen
                      </label>
                    </div>
                    <input
                      type="text"
                      value={tempTemplate.documentTitle}
                      onChange={(e) => setTempTemplate(prev => ({ ...prev, documentTitle: e.target.value }))}
                      placeholder="e.g. REKAP PRESENSI HALAQAH AL-QURAN"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Tercetak dengan huruf kapital dan ukuran menonjol. Di bawahnya otomatis tercantum: <em>BULAN [PERIODE] | TEMPAT : [LOKASI LAPORAN]</em>.
                    </p>
                  </div>

                  {/* Bagian 3: Text Box Kustom (Sub-Judul, Keterangan Tambahan, Catatan / Pengantar) */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Type className="w-4 h-4 text-emerald-600" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Text Box Kustom (Sub-Judul / Keterangan Dokumen)
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Tambahkan sub-judul, teks pengantar, atau catatan pengesahan sebelum/sesudah tabel
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTextBox}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Text Box</span>
                      </button>
                    </div>

                    {(!tempTemplate.textBoxes || tempTemplate.textBoxes.length === 0) ? (
                      <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-white dark:bg-slate-900">
                        <Type className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Belum ada Text Box tambahan
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Klik tombol <strong>+ Tambah Text Box</strong> di atas jika Anda ingin menyisipkan sub-judul, deskripsi halaqah, atau catatan khusus pada dokumen.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tempTemplate.textBoxes.map((tb, tbIdx, tbArr) => (
                          <div
                            key={tb.id}
                            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-md font-mono">
                                  #{tbIdx + 1}
                                </span>
                                <select
                                  value={tb.type}
                                  onChange={(e) => handleUpdateTextBox(tb.id, { type: e.target.value as any })}
                                  className="p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100"
                                >
                                  <option value="sub_judul">Tipe: Sub-Judul (Heading)</option>
                                  <option value="paragraf">Tipe: Paragraf Keterangan</option>
                                  <option value="catatan">Tipe: Kotak Catatan (Notice Box)</option>
                                </select>
                              </div>

                              {/* Text Box Controls: Alignment, Bold, Reorder, Delete */}
                              <div className="flex items-center space-x-1.5">
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTextBox(tb.id, { align: 'left' })}
                                    title="Rata Kiri"
                                    className={`p-1 rounded-md cursor-pointer transition ${
                                      tb.align === 'left' || (!tb.align && tb.type !== 'sub_judul')
                                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <AlignLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTextBox(tb.id, { align: 'center' })}
                                    title="Rata Tengah"
                                    className={`p-1 rounded-md cursor-pointer transition ${
                                      tb.align === 'center' || (!tb.align && tb.type === 'sub_judul')
                                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <AlignCenter className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTextBox(tb.id, { align: 'right' })}
                                    title="Rata Kanan"
                                    className={`p-1 rounded-md cursor-pointer transition ${
                                      tb.align === 'right'
                                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    <AlignRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateTextBox(tb.id, { isBold: !tb.isBold })}
                                  title="Teks Tebal"
                                  className={`p-1.5 rounded-lg border cursor-pointer transition ${
                                    tb.isBold
                                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <Bold className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={tbIdx === 0}
                                  onClick={() => handleMoveTextBox(tbIdx, 'up')}
                                  title="Pindah ke Atas"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={tbIdx === tbArr.length - 1}
                                  onClick={() => handleMoveTextBox(tbIdx, 'down')}
                                  title="Pindah ke Bawah"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveTextBox(tb.id)}
                                  title="Hapus Text Box"
                                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Label / Judul Khusus Text Box (Opsional) */}
                            <div>
                              <input
                                type="text"
                                value={tb.title || ''}
                                onChange={(e) => handleUpdateTextBox(tb.id, { title: e.target.value })}
                                placeholder="Label / Judul Tambahan (Opsional, misal: 'Catatan Halaqah Santri')"
                                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Konten Teks */}
                            <div>
                              <textarea
                                rows={2}
                                value={tb.content}
                                onChange={(e) => handleUpdateTextBox(tb.id, { content: e.target.value })}
                                placeholder="Tulis isi sub-judul, keterangan, atau catatan pengantar di sini..."
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-sans"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bagian 4: Pengaturan Kolom Tabel Presensi */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Table className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Pengaturan Kolom Tabel Presensi (Tampil / Sembunyikan & Kustom Nama)
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Centang kolom yang ingin dicetak pada dokumen dan sesuaikan nama kolom jika diinginkan
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const cols = tempTemplate.tableColumns || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!;
                      const labels = cols.customLabels || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!.customLabels!;

                      const columnOptions: Array<{
                        key: keyof RekapPresensiTableColumns;
                        labelKey: string;
                        defaultLabel: string;
                        desc: string;
                      }> = [
                        { key: 'showNo', labelKey: 'no', defaultLabel: 'No', desc: 'Nomor urut baris' },
                        { key: 'showTanggal', labelKey: 'tanggal', defaultLabel: 'Tanggal', desc: 'Tanggal kehadiran mengajar' },
                        { key: 'showWaktu', labelKey: 'waktu', defaultLabel: 'Waktu / Jam', desc: 'Jam bimbingan guru' },
                        { key: 'showGuru', labelKey: 'guru', defaultLabel: 'Nama Guru Pembimbing', desc: 'Nama lengkap guru mengajar' },
                        { key: 'showHalaqah', labelKey: 'halaqah', defaultLabel: 'Halaqah', desc: 'Kelompok halaqah bimbingan' },
                        { key: 'showStatus', labelKey: 'status', defaultLabel: 'Status Kehadiran', desc: 'Hadir, Izin, Sakit, Alpa' },
                        { key: 'showKeterangan', labelKey: 'keterangan', defaultLabel: 'Keterangan / Detail Bimbingan', desc: 'Jumlah setoran / catatan guru' },
                        { key: 'showLokasi', labelKey: 'lokasi', defaultLabel: 'Lokasi / Tempat Mengajar', desc: 'Tempat bimbingan guru' },
                      ];

                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {columnOptions.map(col => {
                              const isChecked = cols[col.key] !== false;
                              const currentLabel = (labels as any)[col.labelKey] || col.defaultLabel;

                              return (
                                <div
                                  key={col.key}
                                  className={`p-3 rounded-xl border transition ${
                                    isChecked
                                      ? 'bg-white dark:bg-slate-900 border-emerald-500/40 shadow-xs'
                                      : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleColumn(col.key)}
                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                      />
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {col.defaultLabel}
                                      </span>
                                    </label>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      isChecked
                                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                      {isChecked ? 'Tampil' : 'Sembunyi'}
                                    </span>
                                  </div>

                                  {isChecked && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Nama Judul Kolom (Kustom):
                                      </label>
                                      <input
                                        type="text"
                                        value={currentLabel}
                                        onChange={(e) => handleUpdateColumnLabel(col.labelKey, e.target.value)}
                                        placeholder={col.defaultLabel}
                                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-800 dark:text-white"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Kerapatan Baris & Ringkasan */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                Kerapatan Baris Tabel:
                              </span>
                              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-900">
                                <button
                                  type="button"
                                  onClick={() => setTempTemplate(prev => ({ ...prev, tableDensity: 'normal' }))}
                                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                    tempTemplate.tableDensity !== 'compact'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                  }`}
                                >
                                  Normal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTempTemplate(prev => ({ ...prev, tableDensity: 'compact' }))}
                                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                    tempTemplate.tableDensity === 'compact'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                  }`}
                                >
                                  Ringkas (Compact)
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-800">
                              <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={tempTemplate.showSummaryBelowTable !== false}
                                  onChange={(e) => setTempTemplate(prev => ({ ...prev, showSummaryBelowTable: e.target.checked }))}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                />
                                <span>Tampilkan Ringkasan Jumlah Hadir di Bawah Tabel</span>
                              </label>

                              {tempTemplate.showSummaryBelowTable !== false && (
                                <div className="pl-6 space-y-2.5 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                      <span>Format Teks Ringkasan (Dapat Diedit):</span>
                                      <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Angka otomatis</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={tempTemplate.summaryTextFormat ?? 'Rekap kehadiran bulan {bulan}: {jumlah} kali'}
                                      onChange={(e) => setTempTemplate(prev => ({ ...prev, summaryTextFormat: e.target.value }))}
                                      placeholder="Contoh: Rekap kehadiran bulan {bulan}: {jumlah} kali"
                                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                                    />
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                                      💡 <strong>Keterangan Variabel:</strong> Teks kalimat bebas diedit. Gunakan <code className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded">{"{bulan}"}</code> untuk nama bulan & tahun, dan <code className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded">{"{jumlah}"}</code> untuk total angka kehadiran otomatis.
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-slate-400 font-bold">Pilihan Cepat:</span>
                                    <button
                                      type="button"
                                      onClick={() => setTempTemplate(prev => ({ ...prev, summaryTextFormat: 'Rekap kehadiran bulan {bulan}: {jumlah} kali' }))}
                                      className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                                    >
                                      Standar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTempTemplate(prev => ({ ...prev, summaryTextFormat: 'Total kehadiran pengajar pada {bulan}: {jumlah} kali pertemuan' }))}
                                      className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                                    >
                                      Formal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTempTemplate(prev => ({ ...prev, summaryTextFormat: 'Jumlah Hadir: {jumlah} kali' }))}
                                      className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                                    >
                                      Ringkas
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTempTemplate(prev => ({ ...prev, summaryTextFormat: 'Total presensi guru pembimbing {bulan}: {jumlah} pertemuan' }))}
                                      className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                                    >
                                      Halaqah
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTempTemplate(prev => ({ ...prev, summaryTextFormat: 'Akumulasi tatap muka mengajar {bulan}: {jumlah} sesi' }))}
                                      className="text-[10px] px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
                                    >
                                      Sesi Mengajar
                                    </button>
                                  </div>

                                  <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 font-sans">
                                    <span className="text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-black block mb-0.5">Hasil Pratinjau Teks (Angka Dihitung Otomatis):</span>
                                    {(() => {
                                      const fl = getFilteredPresensiGuruList();
                                      const tot = fl.filter(a => a.status === 'Hadir' || !a.status || a.status === 'Hadir (Auto)').length;
                                      let bName = 'September 2026';
                                      if (fl.length > 0 && fl[0].tanggal && fl[0].tanggal.length >= 7) {
                                        const y = fl[0].tanggal.substring(0, 4);
                                        const m = fl[0].tanggal.substring(5, 7);
                                        bName = `${MONTH_NAMES_MAP[m] || 'Bulan ' + m} ${y}`;
                                      }
                                      return (
                                        <p className="font-mono font-semibold">
                                          {formatPresensiSummaryText(tempTemplate.summaryTextFormat, bName, tot)}
                                        </p>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 3: TANDA TANGAN */}
              {activeTemplateTab === 'signature' && (
                <div className="space-y-5">
                  {/* Signature Image Upload */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <FileSignature className="w-4 h-4 text-emerald-600" />
                        <span>Gambar Tanda Tangan Digital (Opsional)</span>
                      </label>
                      {tempTemplate.signatureImageBase64 && (
                        <button
                          type="button"
                          onClick={() => setTempTemplate(prev => ({ ...prev, signatureImageBase64: '' }))}
                          className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gunakan Tanda Tangan Standar Lembaga</span>
                        </button>
                      )}
                    </div>

                    {tempTemplate.signatureImageBase64 ? (
                      <div className="relative p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                        <img
                          src={tempTemplate.signatureImageBase64}
                          alt="Signature Preview"
                          className="max-h-20 object-contain rounded-lg shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center bg-white dark:bg-slate-900 hover:bg-slate-50 transition">
                        <FileSignature className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Upload file tanda tangan (.png transparan / latar putih)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Jika tidak ada gambar, sistem akan menggambar tanda tangan grafis standar.
                        </p>
                        <label className="mt-3 inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs">
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          <span>Pilih File Tanda Tangan</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setTempTemplate(prev => ({ ...prev, signatureImageBase64: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Penanggungjawab Text Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Jabatan Penanggungjawab
                      </label>
                      <input
                        type="text"
                        value={tempTemplate.penanggungjawabJabatan}
                        onChange={(e) => setTempTemplate(prev => ({ ...prev, penanggungjawabJabatan: e.target.value }))}
                        placeholder="e.g. Penanggungjawab Kegiatan"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Nama Terang Penanggungjawab
                      </label>
                      <input
                        type="text"
                        value={tempTemplate.penanggungjawabNama}
                        onChange={(e) => setTempTemplate(prev => ({ ...prev, penanggungjawabNama: e.target.value }))}
                        placeholder="e.g. Koordinator Halaqah"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!tempTemplate.showSignatureDate}
                        onChange={(e) => setTempTemplate(prev => ({ ...prev, showSignatureDate: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs">Tampilkan Baris Tempat &amp; Tanggal di Atas Jabatan (contoh: "KANTOR PUSAT, 30 September 2026")</span>
                    </label>
                    <p className="text-[10px] text-slate-400 pl-6 pt-0.5">
                      Secara standar dibiarkan tidak dicentang agar format dokumen PDF dan Google Docs bersih dan seragam.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: PRATINJAU LAYAR */}
              {activeTemplateTab === 'preview' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Pratinjau langsung tampilan halaman PDF & dokumen Rekap Presensi sesuai tata letak modular:</span>
                  </div>

                  {/* Mini Paper Canvas Preview */}
                  {(() => {
                    const previewLocationText = getDynamicReportLocation(attendanceFilterGuru, getFilteredPresensiGuruList());
                    return (
                      <div className="bg-white text-slate-900 border-2 border-slate-300 rounded-2xl p-5 shadow-lg max-w-xl mx-auto space-y-4 font-sans text-left relative overflow-hidden">
                        {/* Header Strip */}
                        {tempTemplate.headerImageBase64 ? (
                          <div className="w-full h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                            <img src={tempTemplate.headerImageBase64} alt="Header" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="relative border-t-4 border-amber-500 pt-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[8px]">
                                {institutionAbbr}
                              </div>
                              <span className="text-[10px] font-bold text-emerald-900">{institutionDisplayName}</span>
                            </div>
                            <div className="bg-emerald-800 text-white text-[9px] font-bold px-3 py-1 rounded-l-md">
                              {tempTemplate.headerBadgeText || 'DIVISI PEMBINAAN AL-QURAN'}
                            </div>
                          </div>
                        )}

                        {/* RENDER MODULAR ELEMENTS ACCORDING TO elementsOrder */}
                        {(() => {
                          const order = tempTemplate.elementsOrder || ['title', 'textboxes', 'table'];
                          const previewCols = tempTemplate.tableColumns || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!;
                          const previewLabels = previewCols.customLabels || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!.customLabels!;

                          return order.map(elementKey => {
                            if (elementKey === 'title') {
                              return (
                                <div key="title" className="text-center pt-1 border-b border-dashed border-slate-200 pb-2">
                                  <h4 className="font-bold text-xs uppercase tracking-tight text-slate-900">
                                    {tempTemplate.documentTitle || 'REKAP PRESENSI HALAQAH AL-QURAN'}
                                  </h4>
                                  <p className="text-[10px] font-bold text-slate-600 mt-0.5">
                                    BULAN JULI 2026 | TEMPAT : {previewLocationText}
                                  </p>
                                </div>
                              );
                            }

                        if (elementKey === 'textboxes') {
                          if (!tempTemplate.textBoxes || tempTemplate.textBoxes.length === 0) return null;
                          return (
                            <div key="textboxes" className="space-y-1.5 py-1">
                              {tempTemplate.textBoxes.map((tb, tbIdx) => {
                                const alignClass = tb.align === 'center' ? 'text-center' : tb.align === 'right' ? 'text-right' : 'text-left';
                                const boldClass = tb.isBold ? 'font-bold' : '';

                                if (tb.type === 'sub_judul') {
                                  return (
                                    <div key={tb.id || tbIdx} className={`${alignClass} ${boldClass}`}>
                                      {tb.title && <span className="text-[10px] font-bold text-slate-800 block">{tb.title}</span>}
                                      <h5 className="text-[11px] font-bold text-slate-900">{tb.content || '(Sub Judul Kosong)'}</h5>
                                    </div>
                                  );
                                }

                                if (tb.type === 'catatan') {
                                  return (
                                    <div key={tb.id || tbIdx} className={`p-2 bg-slate-50 border-l-3 border-emerald-700 rounded-r-md text-[9px] text-slate-700 ${alignClass} ${boldClass}`}>
                                      {tb.title && <strong className="text-slate-900 mr-1">{tb.title}:</strong>}
                                      <span>{tb.content || '(Catatan Kosong)'}</span>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={tb.id || tbIdx} className={`text-[9.5px] text-slate-700 ${alignClass} ${boldClass}`}>
                                    {tb.title && <strong className="text-slate-900 block text-[9.5px]">{tb.title}</strong>}
                                    <p className="leading-snug">{tb.content || '(Teks Kosong)'}</p>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        if (elementKey === 'table') {
                          return (
                            <div key="table" className="space-y-1.5">
                              <div className="border border-slate-300 rounded-lg overflow-x-auto text-[9px]">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-slate-200/80 font-bold text-slate-800 border-b border-slate-300 text-center">
                                      {previewCols.showNo !== false && (
                                        <th className="p-1 border-r border-slate-300 w-7">{previewLabels.no || 'No'}</th>
                                      )}
                                      {previewCols.showTanggal !== false && (
                                        <th className="p-1 border-r border-slate-300 w-16">{previewLabels.tanggal || 'Tanggal'}</th>
                                      )}
                                      {previewCols.showWaktu && (
                                        <th className="p-1 border-r border-slate-300 w-14">{previewLabels.waktu || 'Waktu'}</th>
                                      )}
                                      {previewCols.showGuru !== false && (
                                        <th className="p-1 border-r border-slate-300 text-left pl-1.5">{previewLabels.guru || 'Nama Guru'}</th>
                                      )}
                                      {previewCols.showHalaqah && (
                                        <th className="p-1 border-r border-slate-300 text-left pl-1.5">{previewLabels.halaqah || 'Halaqah'}</th>
                                      )}
                                      {previewCols.showStatus !== false && (
                                        <th className="p-1 border-r border-slate-300 w-14">{previewLabels.status || 'Status'}</th>
                                      )}
                                      {previewCols.showKeterangan !== false && (
                                        <th className="p-1 border-r border-slate-300 text-left pl-1.5">{previewLabels.keterangan || 'Keterangan'}</th>
                                      )}
                                      {previewCols.showLokasi && (
                                        <th className="p-1 text-left pl-1.5">{previewLabels.lokasi || 'Lokasi'}</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-slate-200 text-center text-slate-700">
                                      {previewCols.showNo !== false && <td className="p-1 border-r border-slate-200">1</td>}
                                      {previewCols.showTanggal !== false && <td className="p-1 border-r border-slate-200">01/07/2026</td>}
                                      {previewCols.showWaktu && <td className="p-1 border-r border-slate-200">06:00</td>}
                                      {previewCols.showGuru !== false && <td className="p-1 border-r border-slate-200 text-left pl-1.5 font-bold">Ustadz Ahmad, S.Pd</td>}
                                      {previewCols.showHalaqah && <td className="p-1 border-r border-slate-200 text-left pl-1.5">Tahfidz A</td>}
                                      {previewCols.showStatus !== false && <td className="p-1 border-r border-slate-200 text-emerald-700 font-bold">Hadir</td>}
                                      {previewCols.showKeterangan !== false && <td className="p-1 border-r border-slate-200 text-left pl-1.5">4 setoran santri</td>}
                                      {previewCols.showLokasi && <td className="p-1 text-left pl-1.5">{previewLocationText}</td>}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {tempTemplate.showSummaryBelowTable !== false && (
                                <p className="text-[8.5px] text-slate-700 font-medium pl-1">
                                  {formatPresensiSummaryText(tempTemplate.summaryTextFormat, 'September 2026', 7)}
                                </p>
                              )}
                            </div>
                          );
                        }

                        return null;
                      });
                    })()}

                    {/* Mock Signature */}
                    <div className="flex justify-end pt-2 pr-4">
                      <div className="text-center space-y-1">
                        {tempTemplate.showSignatureDate && (
                          <p className="text-[8.5px] text-slate-500 mb-0.5">
                            {previewLocationText}, 30 September 2026
                          </p>
                        )}
                        <p className="text-[10px] font-medium text-slate-700">
                          {tempTemplate.penanggungjawabJabatan || 'Penanggungjawab Kegiatan'}
                        </p>
                        <div className="h-10 flex items-center justify-center my-1">
                          {tempTemplate.signatureImageBase64 ? (
                            <img src={tempTemplate.signatureImageBase64} alt="Signature" className="max-h-10 object-contain" />
                          ) : (
                            <div className="italic font-serif text-slate-800 text-xs tracking-widest border-b border-slate-800 px-3">
                              (Tanda Tangan)
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-900">
                          {tempTemplate.penanggungjawabNama || 'Koordinator Halaqah'}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    {tempTemplate.footerImageBase64 ? (
                      <div className="w-full bg-slate-100 rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                        <img src={tempTemplate.footerImageBase64} alt="Footer Banner" className="w-full max-h-12 object-contain" />
                      </div>
                    ) : (
                      <div className="border-b-4 border-amber-500 pt-2 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                        <span>{tempTemplate.footerSocialText || 'Portal Manajemen Halaqah Al-Quran'}</span>
                        <span>Halaman 1 dari 1</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTempTemplate(DEFAULT_REKAP_PRESENSI_TEMPLATE)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Standar Sistem</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await saveRekapPresensiTemplate(tempTemplate);
                      setPdfTemplate(tempTemplate);
                      setIsTemplateModalOpen(false);
                      alert('Template PDF & Docs Rekap Presensi berhasil disimpan!');
                    } catch (e: any) {
                      console.error('Error saving PDF template', e);
                      alert('Gagal menyimpan template PDF & Docs: ' + (e.message || e));
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PRATINJAU DOKUMEN REKAP PRESENSI GURU (PREVIEW)
          ======================================================== */}
      {isPresensiPreviewOpen && presensiPreviewData && (
        <div className="fixed inset-0 z-[90] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden text-left">
            
            {/* Header Modal */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shrink-0">
                  <Eye className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base text-white leading-tight">
                      Pratinjau Dokumen Rekap Kehadiran Guru
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                      {presensiPreviewData.format}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-0.5 truncate max-w-md">
                    {presensiPreviewData.fileName} • {presensiPreviewData.list.length} Data Kehadiran
                  </p>
                </div>
              </div>

              {/* Action Buttons in Preview Header */}
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {/* Tombol Kirim Email */}
                <button
                  type="button"
                  onClick={() => {
                    openPresensiEmailModal(presensiPreviewData.format);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  title="Kirim dokumen yang sedang dilihat langsung ke email atasan / kepala divisi"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Kirim ke Email</span>
                </button>

                {/* Tombol Simpan ke Google Drive */}
                <button
                  type="button"
                  onClick={() => {
                    savePresensiGuruToGoogleDrive(getExportPresensiGuruFileName(), presensiPreviewData.format, presensiPreviewData.list);
                  }}
                  disabled={!!uploadingToDrive}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Simpan dokumen ini langsung ke Google Drive"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Ke Drive</span>
                </button>

                {/* Tombol Unduh File */}
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = presensiPreviewData.url;
                    a.download = presensiPreviewData.fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  title="Unduh file ke perangkat lokal"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Unduh</span>
                </button>

                {/* Tombol Buka Tab Baru / Cetak */}
                <a
                  href={presensiPreviewData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                  title="Buka dokumen di tab baru browser"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Tombol Tutup */}
                <button
                  type="button"
                  onClick={closePresensiPreview}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Toolbar Bergantian Guru (Jika Terdapat Lebih dari 1 Guru Terpilih / Dalam Filter) */}
            {previewAvailableGurus.length > 1 && (
              <div className="px-4 py-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-850/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 font-mono">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    PILIH DOKUMEN GURU (LIHAT BERGANTIAN):
                  </span>
                  <span className="hidden md:inline text-[10.5px] text-slate-500 dark:text-slate-400">
                    Klik guru untuk melihat rekapitulasi resminya secara bergantian
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                  {/* Tab Semua Guru (Gabungan) */}
                  <button
                    type="button"
                    onClick={() => switchPresensiPreviewGuru('ALL')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
                      presensiPreviewActiveGuruId === 'ALL'
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                    title="Tampilkan dokumen gabungan seluruh guru terpilih"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Semua Guru (Gabungan)</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-black/10 dark:bg-white/20 rounded-full font-mono">
                      {getFilteredPresensiGuruList().length}
                    </span>
                  </button>

                  {/* Tab Masing-Masing Guru */}
                  {previewAvailableGurus.map(g => {
                    const isActive = presensiPreviewActiveGuruId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => switchPresensiPreviewGuru(g.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title={`Beralih ke dokumen ${g.name}`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{g.name}</span>
                        <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {g.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Switcher Format Pratinjau */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs gap-2">
              <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 sm:mr-2 font-mono shrink-0">
                  Format Tampilan:
                </span>
                <button
                  type="button"
                  onClick={() => openPresensiPreview('PDF')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    presensiPreviewData.format === 'PDF'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  PDF Resmi Berbingkai
                </button>
                <button
                  type="button"
                  onClick={() => openPresensiPreview('Excel')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    presensiPreviewData.format === 'Excel'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Tabel Data (Excel)
                </button>
                <button
                  type="button"
                  onClick={() => openPresensiPreview('Word')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    presensiPreviewData.format === 'Word'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Dokumen Word (Doc)
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Total: <strong className="text-slate-800 dark:text-slate-200">{presensiPreviewData.list.length} Presensi</strong></span>
                <span>•</span>
                <span>Hadir: <strong className="text-emerald-600">{presensiPreviewData.list.filter(p => p.status === 'Hadir' || !p.status || p.status === 'Hadir (Auto)').length}</strong></span>
                <span>•</span>
                <span>Izin/Sakit: <strong className="text-amber-600">{presensiPreviewData.list.filter(p => p.status === 'Izin' || p.status === 'Sakit').length}</strong></span>
              </div>
            </div>

            {/* Sub-toolbar khusus PDF: Mode Lembar Langsung (HP & Desktop) vs Viewer iFrame & Zoom */}
            {presensiPreviewData.format === 'PDF' && (
              <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-850/60 text-xs gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-mono mr-1">
                    Mode Lembar:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPdfPreviewViewMode('SHEET')}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      pdfPreviewViewMode === 'SHEET'
                        ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-100/50'
                    }`}
                    title="Tampilan Lembar PDF Resmi langsung terbuka di layar HP / Desktop tanpa butuh plugin peramban"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lembar Resmi Langsung (HP &amp; Layar)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPdfPreviewViewMode('IFRAME')}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      pdfPreviewViewMode === 'IFRAME'
                        ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-100/50'
                    }`}
                    title="Gunakan peramban PDF Viewer iFrame komputer bawaan"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Viewer Browser (iFrame)</span>
                    <span className="sm:hidden">Viewer iFrame</span>
                  </button>
                </div>

                {/* Kontrol Zoom / Skala & Buka Tab Baru */}
                <div className="flex items-center gap-2 flex-wrap">
                  {pdfPreviewViewMode === 'SHEET' && (
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-850 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setPdfPreviewZoom(prev => Math.max(40, prev - 10))}
                        className="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                        title="Perkecil Lembar"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                        {pdfPreviewZoom}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setPdfPreviewZoom(prev => Math.min(150, prev + 10))}
                        className="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                        title="Perbesar Lembar"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            const fitScale = Math.min(100, Math.max(45, Math.round(((window.innerWidth - 48) / 720) * 100)));
                            setPdfPreviewZoom(fitScale);
                          }
                        }}
                        className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold hover:bg-emerald-200 cursor-pointer"
                        title="Paskan Lembar dengan Lebar Layar HP"
                      >
                        Paskan HP
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfPreviewZoom(100)}
                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold hover:bg-slate-200 cursor-pointer"
                        title="Kembalikan ke Ukuran Normal 100%"
                      >
                        100%
                      </button>
                    </div>
                  )}

                  <a
                    href={presensiPreviewData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                    title="Buka file PDF langsung di tab baru browser atau aplikasi penampil PDF perangkat"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Buka Tab Baru</span>
                  </a>
                </div>
              </div>
            )}

            {/* Viewer Body Area */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden relative flex flex-col">
              {presensiPreviewData.format === 'PDF' ? (
                pdfPreviewViewMode === 'SHEET' ? (
                  <div className="w-full h-full flex-1 overflow-auto bg-slate-200/80 dark:bg-slate-950 p-2 sm:p-4 flex flex-col items-center rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                    {/* Notice for mobile users */}
                    <div className="w-full max-w-3xl mb-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-850 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 shadow-2xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>Tampilan Langsung Terbuka:</strong> Format PDF berbingkai resmi ini dapat dibaca, dizoom, dan digeser langsung pada HP.</span>
                      </span>
                      <span className="hidden sm:inline font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                        Skala: {pdfPreviewZoom}%
                      </span>
                    </div>

                    {/* Lembar Dokumen A4 Resmi Berbingkai */}
                    {(() => {
                      const activeTemplate = pdfTemplate || getSavedPresensiTemplate();
                      const sortedList = [...presensiPreviewData.list].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
                      const resolvedLoc = getDynamicReportLocation(attendanceFilterGuru, sortedList);

                      let bulanTahunUpper = 'JULI 2026';
                      let bulanTahunNormal = 'Juli 2026';
                      if (sortedList.length > 0 && sortedList[0].tanggal && sortedList[0].tanggal.length >= 7) {
                        const year = sortedList[0].tanggal.substring(0, 4);
                        const mKey = sortedList[0].tanggal.substring(5, 7);
                        const mName = MONTH_NAMES_MAP[mKey] || `Bulan ${mKey}`;
                        bulanTahunUpper = `${mName.toUpperCase()} ${year}`;
                        bulanTahunNormal = `${mName} ${year}`;
                      }

                      const totalHadir = sortedList.filter(a => a.status === 'Hadir' || !a.status || a.status === 'Hadir (Auto)').length;
                      const totalIzin = sortedList.filter(a => a.status === 'Izin').length;
                      const totalSakit = sortedList.filter(a => a.status === 'Sakit').length;
                      const totalAlpha = sortedList.filter(a => a.status === 'Alpha' || a.status === 'Alpa').length;

                      const cols = activeTemplate.tableColumns || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!;
                      const labels = cols.customLabels || DEFAULT_REKAP_PRESENSI_TEMPLATE.tableColumns!.customLabels!;
                      const elementsOrder = activeTemplate.elementsOrder && activeTemplate.elementsOrder.length > 0 
                        ? activeTemplate.elementsOrder 
                        : ['title', 'textboxes', 'table'];

                      const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

                      return (
                        <div 
                          className="w-full flex justify-center pb-8"
                          style={{
                            zoom: `${pdfPreviewZoom}%`
                          }}
                        >
                          <div className="w-[740px] max-w-full bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-6 sm:p-9 my-1 select-text font-sans relative">
                            
                            {/* Kop & Bingkai Atas */}
                            {activeTemplate.headerImageBase64 ? (
                              <div className="w-full flex justify-center mb-5">
                                <img src={activeTemplate.headerImageBase64} alt="Kop Surat" className="w-full max-h-24 object-contain" />
                              </div>
                            ) : (
                              <div className="relative mb-5">
                                {/* Yellow Top Bar */}
                                <div className="h-1.5 w-full bg-[#EAB308] rounded-t-xs" />

                                <div className="flex items-center justify-between pt-2 pb-1">
                                  {/* Left Logos */}
                                  <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full border-2 border-[#045B2A] flex items-center justify-center p-0.5 bg-white shadow-2xs">
                                          <div className="w-full h-full rounded-full border border-[#045B2A] flex items-center justify-center bg-[#045B2A]">
                                            <span className="text-[7.5px] font-bold text-white tracking-tighter">{institutionAbbr}</span>
                                          </div>
                                        </div>
                                        <span className="text-[6.5px] font-extrabold text-[#045B2A] tracking-wider mt-0.5 uppercase">{institutionAbbr}</span>
                                      </div>

                                      <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
                                        <div className="w-7 h-7 bg-[#045B2A] rounded-md flex items-center justify-center relative shadow-2xs">
                                          <div className="w-3.5 h-3.5 rounded-full bg-[#EAB308]" />
                                        </div>
                                        <div className="leading-tight">
                                          <span className="font-extrabold text-sm text-[#045B2A] block font-serif tracking-tight">{institutionDisplayName}</span>
                                          <span className="font-bold text-[10px] text-[#045B2A] block tracking-normal">Manajemen Halaqah Al-Quran</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right Badge */}
                                    <div className="relative">
                                      <div 
                                        className="bg-[#045B2A] text-white font-extrabold text-[11px] py-1.5 pl-6 pr-4 shadow-sm tracking-wider uppercase font-mono flex items-center justify-end"
                                        style={{ clipPath: 'polygon(14px 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                                      >
                                        {activeTemplate.headerBadgeText || 'DIVISI PEMBINAAN AL-QURAN'}
                                      </div>
                                      <div 
                                        className="h-1 w-full bg-[#EAB308] mt-0.5"
                                        style={{ clipPath: 'polygon(10px 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Elemen Dokumen sesuai urutan tata letak */}
                              {elementsOrder.map((elemKey, elIdx) => {
                                if (elemKey === 'title') {
                                  return (
                                    <div key={`title_${elIdx}`} className="text-center my-4">
                                      <h2 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-slate-900 font-serif">
                                        {activeTemplate.documentTitle || 'REKAP PRESENSI HALAQAH AL-QURAN'}
                                    </h2>
                                    <p className="font-bold text-xs uppercase tracking-wide text-slate-800 mt-1 font-mono">
                                      BULAN {bulanTahunUpper} | TEMPAT : {resolvedLoc}
                                    </p>
                                  </div>
                                );
                              }

                              if (elemKey === 'textboxes') {
                                if (!activeTemplate.textBoxes || activeTemplate.textBoxes.length === 0) return null;
                                return (
                                  <div key={`tb_${elIdx}`} className="space-y-2 mb-4">
                                    {activeTemplate.textBoxes.map((tb, tbIdx) => {
                                      const alignClass = tb.align === 'left' ? 'text-left' : tb.align === 'right' ? 'text-right' : 'text-center';
                                      const boldClass = tb.isBold ? 'font-bold' : 'font-normal';
                                      if (tb.type === 'sub_judul') {
                                        return (
                                          <h3 key={tb.id || tbIdx} className={`text-xs font-bold uppercase tracking-wider text-slate-900 ${alignClass}`}>
                                            {tb.content || tb.title}
                                          </h3>
                                        );
                                      }
                                      if (tb.type === 'catatan') {
                                        return (
                                          <div key={tb.id || tbIdx} className={`p-2.5 bg-emerald-50/70 border-l-4 border-[#045B2A] rounded-r-lg text-xs text-slate-800 ${alignClass} ${boldClass}`}>
                                            {tb.title && <strong className="text-emerald-950 mr-1.5">{tb.title}:</strong>}
                                            <span>{tb.content}</span>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div key={tb.id || tbIdx} className={`text-xs text-slate-700 leading-relaxed ${alignClass} ${boldClass}`}>
                                          {tb.title && <strong className="text-slate-900 block text-xs">{tb.title}</strong>}
                                          <p>{tb.content}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }

                              if (elemKey === 'table') {
                                return (
                                  <div key={`table_${elIdx}`} className="my-3 space-y-2">
                                    <div className="overflow-x-auto border border-slate-900 rounded-xs">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-[#EBEDE8] text-slate-900 font-extrabold border-b border-slate-900 text-[11px] uppercase tracking-wider">
                                            {cols.showNo !== false && <th className="p-2 border-r border-slate-900 text-center w-10">{labels.no || 'No'}</th>}
                                            {cols.showTanggal !== false && <th className="p-2 border-r border-slate-900 text-center whitespace-nowrap w-24">{labels.tanggal || 'Tanggal'}</th>}
                                            {cols.showWaktu && <th className="p-2 border-r border-slate-900 text-center whitespace-nowrap w-20">{labels.waktu || 'Waktu/Jam'}</th>}
                                            {cols.showGuru !== false && <th className="p-2 border-r border-slate-900">{labels.guru || 'Nama Guru Pembimbing'}</th>}
                                            {cols.showHalaqah && <th className="p-2 border-r border-slate-900">{labels.halaqah || 'Halaqah'}</th>}
                                            {cols.showStatus !== false && <th className="p-2 border-r border-slate-900 text-center w-24">{labels.status || 'Status'}</th>}
                                            {cols.showKeterangan !== false && <th className="p-2 border-r border-slate-900">{labels.keterangan || 'Keterangan / Detail'}</th>}
                                            {cols.showLokasi && <th className="p-2">{labels.lokasi || 'Lokasi Mengajar'}</th>}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800 text-[11px]">
                                          {sortedList.map((item, idx) => (
                                            <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                                              {cols.showNo !== false && <td className="p-2 border-r border-slate-900 text-center font-mono font-medium">{idx + 1}</td>}
                                              {cols.showTanggal !== false && <td className="p-2 border-r border-slate-900 text-center font-mono whitespace-nowrap">{item.tanggal || '-'}</td>}
                                              {cols.showWaktu && <td className="p-2 border-r border-slate-900 text-center font-mono whitespace-nowrap">{item.jam || item.waktu || item.jamMasuk || '-'}</td>}
                                              {cols.showGuru !== false && (
                                                <td className="p-2 border-r border-slate-900 font-bold text-slate-950">
                                                  {formatGuruTitleAndName(item.guruNama, item.guruId)}
                                                </td>
                                              )}
                                              {cols.showHalaqah && <td className="p-2 border-r border-slate-900">{item.halaqahNama || '-'}</td>}
                                              {cols.showStatus !== false && (
                                                <td className="p-2 border-r border-slate-900 text-center">
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    item.status === 'Hadir' || item.status === 'Hadir (Auto)' || !item.status
                                                      ? 'bg-emerald-100 text-emerald-800'
                                                      : item.status === 'Izin'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : item.status === 'Sakit'
                                                          ? 'bg-amber-100 text-amber-800'
                                                          : 'bg-rose-100 text-rose-800'
                                                  }`}>
                                                    {item.status || 'Hadir'}
                                                  </span>
                                                </td>
                                              )}
                                              {cols.showKeterangan !== false && (
                                                <td className="p-2 border-r border-slate-900 text-slate-700 italic">
                                                  {item.isAutoDetected ? `${item.setoranCount || 0} setoran santri` : (item.catatan || '-')}
                                                </td>
                                              )}
                                              {cols.showLokasi && <td className="p-2 text-slate-700">{item.lokasi || resolvedLoc}</td>}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Ringkasan Rekap di Bawah Tabel */}
                                    {activeTemplate.showSummaryBelowTable !== false && (
                                      <div className="my-2.5 p-3 bg-slate-50 border border-slate-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                        <div className="font-semibold text-slate-800">
                                          {formatPresensiSummaryText(activeTemplate.summaryTextFormat, bulanTahunNormal, totalHadir)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10.5px] font-mono flex-wrap">
                                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Hadir: {totalHadir}</span>
                                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">Izin: {totalIzin}</span>
                                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">Sakit: {totalSakit}</span>
                                          {totalAlpha > 0 && <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">Alpha: {totalAlpha}</span>}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              return null;
                            })}

                            {/* Blok Tanda Tangan Resmi */}
                            <div className="mt-8 mb-5 flex justify-end">
                              <div className="w-64 text-center space-y-1">
                                {activeTemplate.showSignatureDate && (
                                  <p className="text-xs text-slate-600 mb-1 font-sans">
                                    {resolvedLoc}, {todayStr}
                                  </p>
                                )}
                                <p className="text-xs font-bold text-slate-800">
                                  {activeTemplate.penanggungjawabJabatan || 'Penanggungjawab Kegiatan'}
                                </p>

                                <div className="h-16 flex items-center justify-center my-1">
                                  {activeTemplate.signatureImageBase64 ? (
                                    <img src={activeTemplate.signatureImageBase64} alt="Tanda Tangan Digital" className="max-h-16 object-contain" />
                                  ) : (
                                    <svg viewBox="0 0 320 100" className="h-14 w-44 mx-auto text-slate-900" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M 30 52 Q 150 32 290 44" />
                                      <path d="M 190 32 C 230 8, 250 32, 230 60" />
                                      <path d="M 170 56 L 270 32" />
                                      <path d="M 40 76 L 280 76" />
                                    </svg>
                                  )}
                                </div>

                                <p className="text-xs font-bold text-slate-900 border-b border-slate-900 pb-0.5 inline-block">
                                  {activeTemplate.penanggungjawabNama || 'Koordinator Halaqah'}
                                </p>
                              </div>
                            </div>

                            {/* Footer Banner */}
                            {activeTemplate.footerImageBase64 ? (
                              <div className="w-full flex justify-center mt-6">
                                <img src={activeTemplate.footerImageBase64} alt="Footer Banner" className="w-full max-h-20 object-contain" />
                              </div>
                            ) : (
                              <div className="mt-8 pt-3 border-t-2 border-[#EAB308] flex items-center justify-between text-[10px] text-slate-600 font-mono">
                                <div className="bg-[#045B2A] text-white px-3 py-1 rounded font-bold text-[9px] tracking-wide">
                                  {activeTemplate.footerSocialText || 'Portal Manajemen Halaqah Al-Quran'}
                                </div>
                                <span className="text-slate-400">Dokumen Rekapitulasi Presensi Resmi</span>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="w-full h-full flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-white">
                    <iframe
                      src={presensiPreviewData.url}
                      title="PDF Document Preview"
                      className="w-full h-full flex-1"
                    />
                    <div className="p-2 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-600">
                      <span>Jika pada HP dokumen tidak tampil langsung atau muncul tombol 'Buka', beralihlah ke tab <strong>'Lembar Resmi Langsung (HP & Layar)'</strong> di atas.</span>
                    </div>
                  </div>
                )
              ) : presensiPreviewData.format === 'Excel' ? (
                <div className="w-full h-full flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-y-auto space-y-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-amber-900 dark:text-amber-300 text-xs">Pratinjau Data Tabel Rekap Excel</h5>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Data siap diekspor ke file .xlsx lengkap dengan rincian kehadiran dan persentase.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportPresensiGuruToExcel(getExportPresensiGuruFileName(), presensiPreviewData.list)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Unduh .xlsx Sekarang
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="p-2 text-center w-10">No</th>
                          <th className="p-2">Tanggal</th>
                          <th className="p-2">Nama Guru</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Waktu Sesi</th>
                          <th className="p-2">Kelompok / Halaqah</th>
                          <th className="p-2">Keterangan / Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {presensiPreviewData.list.map((item, idx) => {
                          const guru = (gurus || []).find(g => g.id === item.guruId);
                          const halaqah = (halaqahs || []).find(h => h.id === item.halaqahId);
                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-2 text-center font-mono">{idx + 1}</td>
                              <td className="p-2 font-mono whitespace-nowrap">{item.tanggal}</td>
                              <td className="p-2 font-bold text-slate-800 dark:text-slate-100">
                                {guru ? getGuruTitleAndName(guru) : item.guruId}
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'Hadir' || item.status === 'Hadir (Auto)' || !item.status
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : item.status === 'Izin'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                      : item.status === 'Sakit'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}>
                                  {item.status || 'Hadir'}
                                </span>
                              </td>
                              <td className="p-2 font-mono text-[11px] text-slate-500">
                                {item.jamMasuk ? `${item.jamMasuk} - ${item.jamKeluar || ''}` : '-'}
                              </td>
                              <td className="p-2 text-slate-600 dark:text-slate-300">
                                {halaqah ? halaqah.namaHalaqah : '-'}
                              </td>
                              <td className="p-2 text-slate-500 italic max-w-xs truncate">
                                {item.catatan || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-y-auto space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-blue-900 dark:text-blue-300 text-xs">Pratinjau Dokumen Format Microsoft Word (.doc)</h5>
                      <p className="text-[11px] text-blue-700 dark:text-blue-400">
                        Format resmi berstruktur dokumen yang dapat diedit langsung menggunakan Microsoft Word atau Google Docs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportPresensiGuruToWord(getExportPresensiGuruFileName(), presensiPreviewData.list)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Unduh .doc Sekarang
                    </button>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-serif text-sm max-w-3xl mx-auto space-y-4 text-left shadow-xs">
                    <div className="text-center pb-3 border-b border-slate-300 dark:border-slate-700">
                      <h4 className="font-bold text-base uppercase tracking-wider text-slate-900 dark:text-white">
                        {pdfTemplate?.documentTitle || institutionDisplayName.toUpperCase()}
                      </h4>
                      <p className="text-xs text-slate-500 uppercase">{pdfTemplate?.headerBadgeText || 'DIVISI DAKWAH & PENDIDIKAN'}</p>
                      <h5 className="font-bold text-sm text-emerald-800 dark:text-emerald-400 mt-2">
                        REKAPITULASI PRESENSI &amp; KEHADIRAN GURU PEMBIMBING
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                        Dokumen: {presensiPreviewData.fileName}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      Dokumen ini merangkum total <strong>{presensiPreviewData.list.length} kehadiran pengajar</strong> pada halaqah. Di dalamnya tercantum rincian tanggal pelaksanaan, waktu mengajar, status kehadiran, serta kolom tanda tangan pengesahan resmi.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dokumen telah terverifikasi dengan susunan bingkai dan tanda tangan resmi.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closePresensiPreview}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
                <button
                  type="button"
                  onClick={() => openPresensiEmailModal(presensiPreviewData.format)}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Kirim ke Email Atasan</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KIRIM DOKUMEN KE EMAIL ATASAN / KEPALA DIVISI
          ======================================================== */}
      {isPresensiEmailModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden text-left my-6 flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <Mail className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white leading-tight">
                    Kirim Dokumen ke Email Atasan / Kepala Divisi
                  </h3>
                  <p className="text-xs text-indigo-100/80 mt-0.5">
                    Kirimkan langsung berkas presensi resmi via Gmail API akun terhubung
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPresensiEmailModalOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Card Pilihan Laporan yang Dikirim & Multi-Lampiran Dokumen */}
              <div className="p-3.5 bg-gradient-to-br from-indigo-50/90 via-slate-50 to-emerald-50/70 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-emerald-950/30 border border-indigo-200/90 dark:border-indigo-800/60 rounded-2xl space-y-3.5 shadow-2xs">
                
                {/* Bagian 1: Pilih Jenis Laporan (Bisa Centang 2 Laporan Sekaligus) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Pilih Laporan yang Dikirim (Bisa Keduanya Sekaligus):
                    </span>
                    {includeLaporanGuru && includeLaporanSantri && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shadow-2xs animate-fade-in">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Mode 2 Laporan Sekaligus Aktif!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Opsi Laporan 1: Presensi Guru */}
                    <label 
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        includeLaporanGuru
                          ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 shadow-xs ring-1 ring-indigo-500/30'
                          : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={includeLaporanGuru}
                        onChange={(e) => {
                          const nextVal = e.target.checked;
                          if (!nextVal && !includeLaporanSantri) {
                            alert('Minimal 1 jenis laporan harus dipilih.');
                            return;
                          }
                          setIncludeLaporanGuru(nextVal);
                          applyEmailSubjectAndBody(nextVal, includeLaporanSantri);
                        }}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            1. Rekap Presensi Guru
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Kehadiran guru pembimbing halaqah ({previewAvailableGurus.length > 1 ? `${previewAvailableGurus.length} guru terpilih` : '1 guru / semua'}) • {(getFilteredPresensiGuruList()).length} data
                        </p>
                      </div>
                    </label>

                    {/* Opsi Laporan 2: Mutabaah / Setoran Santri */}
                    <label 
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        includeLaporanSantri
                          ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 shadow-xs ring-1 ring-emerald-500/30'
                          : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={includeLaporanSantri}
                        onChange={(e) => {
                          const nextVal = e.target.checked;
                          if (!nextVal && !includeLaporanGuru) {
                            alert('Minimal 1 jenis laporan harus dipilih.');
                            return;
                          }
                          setIncludeLaporanSantri(nextVal);
                          applyEmailSubjectAndBody(includeLaporanGuru, nextVal);
                        }}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            2. Rekap Setoran Santri
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Capaian mutabaah hafalan &amp; bacaan santri ({displayLogs.length} data)
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Mode Lampiran Multi-Guru (Jika Lebih dari 1 Guru Terpilih) */}
                  {includeLaporanGuru && previewAvailableGurus.length > 1 && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 font-mono">
                          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          MODE LAMPIRAN {previewAvailableGurus.length} GURU TERPILIH:
                        </span>
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold">
                          Kirim Bersamaan Sekaligus
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition ${
                          emailAttachTeacherMode === 'PER_GURU'
                            ? 'bg-white dark:bg-slate-900 border-indigo-500 text-indigo-800 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
                            : 'bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white/80'
                        }`}>
                          <input
                            type="radio"
                            name="email-teacher-attach-mode"
                            checked={emailAttachTeacherMode === 'PER_GURU'}
                            onChange={() => setEmailAttachTeacherMode('PER_GURU')}
                            className="text-indigo-600 cursor-pointer accent-indigo-600"
                          />
                          <span>Lampirkan Terpisah Per Guru ({previewAvailableGurus.length} Berkas)</span>
                        </label>

                        <label className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition ${
                          emailAttachTeacherMode === 'COMBINED'
                            ? 'bg-white dark:bg-slate-900 border-indigo-500 text-indigo-800 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
                            : 'bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white/80'
                        }`}>
                          <input
                            type="radio"
                            name="email-teacher-attach-mode"
                            checked={emailAttachTeacherMode === 'COMBINED'}
                            onChange={() => setEmailAttachTeacherMode('COMBINED')}
                            className="text-indigo-600 cursor-pointer accent-indigo-600"
                          />
                          <span>Dokumen Gabungan 1 Berkas</span>
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {emailAttachTeacherMode === 'PER_GURU'
                          ? `Setiap guru (${previewAvailableGurus.map(g => g.name).slice(0, 3).join(', ')}${previewAvailableGurus.length > 3 ? ' dkk.' : ''}) akan dibuatkan berkas resmi terpisah dan dikirim bersamaan dalam satu email.`
                          : 'Seluruh catatan presensi guru disatukan dalam satu berkas laporan gabungan.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bagian 2: Pilih Format Berkas Lampiran (Bisa Lebih dari 1 Format) */}
                <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                      Format Berkas Lampiran:
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Bisa pilih lebih dari satu)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleAttachmentFormat('PDF')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
                        selectedAttachmentFormats.includes('PDF')
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {selectedAttachmentFormats.includes('PDF') && <Check className="w-3 h-3" />}
                      <span>PDF Resmi (.pdf)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAttachmentFormat('Excel')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
                        selectedAttachmentFormats.includes('Excel')
                          ? 'bg-amber-600 border-amber-700 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {selectedAttachmentFormats.includes('Excel') && <Check className="w-3 h-3" />}
                      <span>Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAttachmentFormat('Word')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
                        selectedAttachmentFormats.includes('Word')
                          ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {selectedAttachmentFormats.includes('Word') && <Check className="w-3 h-3" />}
                      <span>Word (.doc)</span>
                    </button>
                  </div>
                </div>

                {/* Bagian 3: Daftar Berkas Terlampir (Visual Ringkasan) */}
                <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 font-mono">
                    <span className="font-bold flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                      Daftar Lampiran yang Akan Dikirim:
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {((includeLaporanGuru ? (emailAttachTeacherMode === 'PER_GURU' && previewAvailableGurus.length > 1 ? previewAvailableGurus.length : 1) * selectedAttachmentFormats.length : 0) + (includeLaporanSantri ? selectedAttachmentFormats.length : 0))} Berkas Terlampir Sekaligus
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {includeLaporanGuru && (
                      emailAttachTeacherMode === 'PER_GURU' && previewAvailableGurus.length > 1 ? (
                        previewAvailableGurus.map(g => (
                          selectedAttachmentFormats.map(fmt => (
                            <span 
                              key={`guru-${g.id}-${fmt}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 shadow-2xs"
                              title={`${g.name} (${g.count} data)`}
                            >
                              <FileText className="w-3 h-3 text-indigo-600" />
                              <span>{getExportPresensiGuruFileName(g.id)}.{fmt === 'Excel' ? 'xlsx' : fmt === 'Word' ? 'doc' : 'pdf'}</span>
                            </span>
                          ))
                        ))
                      ) : (
                        selectedAttachmentFormats.map(fmt => (
                          <span 
                            key={`guru-${fmt}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 shadow-2xs"
                          >
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>{getExportPresensiGuruFileName()}.{fmt === 'Excel' ? 'xlsx' : fmt === 'Word' ? 'doc' : 'pdf'}</span>
                          </span>
                        ))
                      )
                    )}

                    {includeLaporanSantri && selectedAttachmentFormats.map(fmt => (
                      <span 
                        key={`santri-${fmt}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-2xs"
                      >
                        <BookOpen className="w-3 h-3 text-emerald-600" />
                        <span>{getExportFileName()}.{fmt === 'Excel' ? 'xlsx' : fmt === 'Word' ? 'doc' : 'pdf'}</span>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Input Email Penerima (To) - Multi-Recipient Chip UI */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                      Email Penerima (To) *
                    </label>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      emailToRecipients.length > 0
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {emailToRecipients.length > 0 ? `${emailToRecipients.length} Penerima Terpilih` : 'Belum Ada Penerima'}
                    </span>
                  </div>

                  {emailToRecipients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEmailToRecipients([])}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>

                {/* Chips Container + Input */}
                <div 
                  onClick={() => document.getElementById('email-input-to-field')?.focus()}
                  className="min-h-[46px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 flex flex-wrap items-center gap-1.5 transition cursor-text"
                >
                  {emailToRecipients.map((em, idx) => {
                    const valid = isValidEmailAddress(em);
                    return (
                      <span 
                        key={idx} 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition ${
                          valid
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <Mail className="w-3 h-3 shrink-0 opacity-70" />
                        <span className="font-mono">{em}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveEmailToRecipient(idx);
                          }}
                          className="hover:bg-indigo-200 dark:hover:bg-indigo-800/60 rounded p-0.5 text-indigo-500 dark:text-indigo-300 hover:text-rose-600 transition"
                          title="Hapus email ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}

                  <input
                    id="email-input-to-field"
                    type="text"
                    value={emailInputTo}
                    onChange={(e) => setEmailInputTo(e.target.value)}
                    onKeyDown={(e) => {
                      if (['Enter', ',', ';', ' '].includes(e.key)) {
                        if (emailInputTo.trim()) {
                          e.preventDefault();
                          handleAddEmailToRecipients(emailInputTo);
                        }
                      } else if (e.key === 'Backspace' && !emailInputTo && emailToRecipients.length > 0) {
                        handleRemoveEmailToRecipient(emailToRecipients.length - 1);
                      }
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text');
                      if (text && (text.includes(',') || text.includes(';') || text.includes('\n') || text.includes(' '))) {
                        e.preventDefault();
                        handleAddEmailToRecipients(text);
                      }
                    }}
                    onBlur={() => {
                      if (emailInputTo.trim()) {
                        handleAddEmailToRecipients(emailInputTo);
                      }
                    }}
                    placeholder={
                      emailToRecipients.length === 0
                        ? "Ketik email atau tempel daftar email (pisahkan koma/Enter/spasi)..."
                        : "Tambah email penerima lainnya..."
                    }
                    className="grow shrink-0 min-w-[200px] bg-transparent border-none outline-hidden text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono py-1 px-1"
                  />
                </div>

                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span>💡 Tips: Pisahkan dengan koma (,), titik koma (;), spasi, atau Enter untuk memasukkan lebih dari satu email.</span>
                  {emailInputTo.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddEmailToRecipients(emailInputTo)}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Tambahkan &quot;{emailInputTo.trim()}&quot;
                    </button>
                  )}
                </div>

                {/* Quick Recipient Contacts Chips */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5 mr-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                      Kontak Cepat:
                    </span>
                    {quickRecipients.some(q => isValidEmailAddress(q.email)) && (
                      <button
                        type="button"
                        onClick={() => {
                          const validQuickEmails = quickRecipients
                            .map(q => q.email.trim())
                            .filter(e => isValidEmailAddress(e));
                          setEmailToRecipients(prev => {
                            const next = [...prev];
                            for (const em of validQuickEmails) {
                              if (!next.some(c => c.toLowerCase() === em.toLowerCase())) {
                                next.push(em);
                              }
                            }
                            return next;
                          });
                        }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60"
                        title="Tambahkan semua kontak yang memiliki email ke daftar penerima"
                      >
                        + Pilih Semua
                      </button>
                    )}
                  </div>

                  {quickRecipients.map((rec, rIdx) => {
                    const isSelected = rec.email && emailToRecipients.some(e => e.toLowerCase() === rec.email.trim().toLowerCase());
                    return (
                      <div 
                        key={rIdx} 
                        className={`inline-flex items-center rounded-lg p-0.5 border transition ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (rec.email) {
                              const emLower = rec.email.trim().toLowerCase();
                              if (emailToRecipients.some(e => e.toLowerCase() === emLower)) {
                                setEmailToRecipients(prev => prev.filter(e => e.toLowerCase() !== emLower));
                              } else {
                                setEmailToRecipients(prev => [...prev, rec.email.trim()]);
                              }
                            } else {
                              const newEm = prompt(`Masukkan alamat email untuk '${rec.label}':`);
                              if (newEm && newEm.trim()) {
                                const trimmed = newEm.trim();
                                const updated = quickRecipients.map((q, i) => i === rIdx ? { ...q, email: trimmed } : q);
                                setQuickRecipients(updated);
                                if (isValidEmailAddress(trimmed) && !emailToRecipients.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
                                  setEmailToRecipients(prev => [...prev, trimmed]);
                                }
                                try { localStorage.setItem('mh_presensi_quick_recipients', JSON.stringify(updated)); } catch {}
                              }
                            }
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 cursor-pointer"
                          title={rec.email ? `Klik untuk ${isSelected ? 'menghapus dari' : 'menambahkan ke'} daftar penerima` : 'Klik untuk menyetel email'}
                        >
                          {isSelected ? (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <span>👤</span>
                          )}
                          <span>{rec.label}</span>
                          {rec.email ? (
                            <span className="font-mono opacity-70">({rec.email.split('@')[0]})</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 underline font-normal">(Set Email)</span>
                          )}
                        </button>
                        {rec.email && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickRecipient(rIdx)}
                            className="text-slate-400 hover:text-rose-500 px-1 font-bold text-[10px]"
                            title="Hapus kontak ini"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Tombol Simpan Kontak Baru */}
                  {!isAddingRecipient ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingRecipient(true)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-1 cursor-pointer"
                    >
                      + Tambah Kontak
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 p-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <input
                        type="text"
                        placeholder="Label (misal: Mudir)"
                        value={newRecipientLabel}
                        onChange={(e) => setNewRecipientLabel(e.target.value)}
                        className="p-1 text-[10px] bg-white dark:bg-slate-900 border rounded font-medium w-24"
                      />
                      <input
                        type="email"
                        placeholder="Email..."
                        value={newRecipientEmail}
                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                        className="p-1 text-[10px] bg-white dark:bg-slate-900 border rounded font-mono w-36"
                      />
                      <button
                        type="button"
                        onClick={handleSaveQuickRecipient}
                        className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingRecipient(false)}
                        className="px-1 text-slate-400 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Tembusan (Cc) - Multi-Recipient Chip UI */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                      Tembusan / Cc (Opsional)
                    </label>
                    {emailCcRecipients.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {emailCcRecipients.length} Cc Terpilih
                      </span>
                    )}
                  </div>
                  {emailCcRecipients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEmailCcRecipients([])}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Semua Cc
                    </button>
                  )}
                </div>

                <div 
                  onClick={() => document.getElementById('email-input-cc-field')?.focus()}
                  className="min-h-[42px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 flex flex-wrap items-center gap-1.5 transition cursor-text"
                >
                  {emailCcRecipients.map((em, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                    >
                      <Mail className="w-3 h-3 shrink-0 opacity-70" />
                      <span className="font-mono">{em}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveEmailCcRecipient(idx);
                        }}
                        className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5 text-slate-500 hover:text-rose-600 transition"
                        title="Hapus Cc ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <input
                    id="email-input-cc-field"
                    type="text"
                    value={emailInputCc}
                    onChange={(e) => setEmailInputCc(e.target.value)}
                    onKeyDown={(e) => {
                      if (['Enter', ',', ';', ' '].includes(e.key)) {
                        if (emailInputCc.trim()) {
                          e.preventDefault();
                          handleAddEmailCcRecipients(emailInputCc);
                        }
                      } else if (e.key === 'Backspace' && !emailInputCc && emailCcRecipients.length > 0) {
                        handleRemoveEmailCcRecipient(emailCcRecipients.length - 1);
                      }
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text');
                      if (text && (text.includes(',') || text.includes(';') || text.includes('\n') || text.includes(' '))) {
                        e.preventDefault();
                        handleAddEmailCcRecipients(text);
                      }
                    }}
                    onBlur={() => {
                      if (emailInputCc.trim()) {
                        handleAddEmailCcRecipients(emailInputCc);
                      }
                    }}
                    placeholder={
                      emailCcRecipients.length === 0
                        ? "Contoh: arsip@halaqah.example, koordinator@halaqah.example (opsional)"
                        : "Tambah email Cc lainnya..."
                    }
                    className="grow shrink-0 min-w-[200px] bg-transparent border-none outline-hidden text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono py-1 px-1"
                  />
                </div>
              </div>

              {/* Input Subjek Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Subjek Email *
                </label>
                <input
                  type="text"
                  required
                  value={emailFormSubject}
                  onChange={(e) => setEmailFormSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Textarea Pesan Pengantar (Body) with Smart Auto RTL/LTR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                      Pesan Pengantar (Body Email) *
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Auto RTL (Arab Kanan) & LTR (Latin Kiri)
                    </span>
                  </div>

                  {/* Mode Tulis / Pratinjau Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setEmailBodyViewMode('edit')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        emailBodyViewMode === 'edit'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Tulis
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailBodyViewMode('preview')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        emailBodyViewMode === 'preview'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Pratinjau Format
                    </button>
                  </div>
                </div>

                {emailBodyViewMode === 'edit' ? (
                  <>
                    <textarea
                      required
                      dir="auto"
                      rows={7}
                      value={emailFormBody}
                      onChange={(e) => setEmailFormBody(e.target.value)}
                      placeholder="Tulis pesan pengantar email..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed transition"
                      style={{ unicodeBidi: 'plaintext' }}
                    />

                    {/* Toolbar Tombol Cepat Teks Arab */}
                    <div className="mt-1.5 flex items-center flex-wrap gap-1.5 text-[10px]">
                      <span className="text-slate-400 font-semibold font-mono">Sisipkan Salam Arab:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const greeting = "السلام عليكم ورحمة الله وبركاته\n\n";
                          setEmailFormBody(prev => greeting + prev.replace(/^Assalamu'alaikum Warahmatullahi Wabarakatuh,?\n\n?/i, ''));
                        }}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-serif cursor-pointer transition"
                        title="Ganti salam pembuka ke tulisan Arab"
                      >
                        + السلام عليكم ورحمة الله وبركاته
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const closing = "\n\nجَزَاكُمُ اللّٰهُ خَيْرًا وَبَارَكَ اللّٰهُ فِيْكُمْ\nوَالسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ";
                          setEmailFormBody(prev => prev + closing);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-serif cursor-pointer transition"
                        title="Tambahkan doa penutup bahasa Arab"
                      >
                        + جزاكم الله خيرا
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full p-3.5 min-h-[170px] max-h-[260px] overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 font-mono pb-1 border-b border-slate-100 dark:border-slate-800">
                      Tampilan Pesan di Email Klien (Gmail/Outlook):
                    </div>
                    <div 
                      className="space-y-1 text-xs"
                      dangerouslySetInnerHTML={{ __html: formatEmailBodyToHtml(emailFormBody) }}
                    />
                  </div>
                )}

                <p className="mt-1.5 text-[10px] text-slate-400 leading-normal">
                  💡 <strong>Deteksi Pintar:</strong> Baris teks Arab langsung otomatis rata kanan (RTL). Jika teks Arab berada di tengah kalimat Latin (Indonesia/Inggris), baris tetap rata kiri (LTR) dan kata Arab mengalir inline secara alami.
                </p>
              </div>

              {/* Alert Status Feedback */}
              {emailSendStatus.type && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fade-in ${
                  emailSendStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}>
                  {emailSendStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{emailSendStatus.message}</span>
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => openPresensiPreview(emailAttachmentFormat)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Pratinjau Dokumen Dulu</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPresensiEmailModalOpen(false)}
                  disabled={isSendingEmail}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendPresensiEmail}
                  disabled={isSendingEmail}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengirim Email & Lampiran...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Email Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Kelola Lokasi Mengajar Guru */}
      {isLokasiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <MapPin className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Kelola Lokasi / Tempat Mengajar Guru</h3>
                  <p className="text-[11px] text-emerald-100/90">
                    Satu guru bisa mengajar di lebih dari 1 lokasi. Lokasi ini otomatis tercetak pada dokumen laporan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLokasiModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Select Guru */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Asatidz / Guru Pembimbing
                </label>
                <select
                  value={selectedGuruForLokasiEdit}
                  onChange={(e) => {
                    const gId = e.target.value;
                    setSelectedGuruForLokasiEdit(gId);
                    const targetG = (gurus || []).find(g => g.id === gId);
                    setLokasiEditInput(targetG ? (targetG.keteranganLokasi || (targetG.lokasiMengajar ? targetG.lokasiMengajar.join(', ') : '')) : '');
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {(gurus || []).map(g => (
                    <option key={g.id} value={g.id}>
                      {getGuruTitleAndName(g)} — {getGuruLokasiText(g, 'Belum ada lokasi')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Lokasi */}
              {(() => {
                const activeG = (gurus || []).find(g => g.id === selectedGuruForLokasiEdit);
                if (!activeG) return null;

                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {getGuruTitleAndName(activeG)}
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {activeG.id}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Detail Lokasi Mengajar (Pisahkan dengan koma jika lebih dari 1):
                      </label>
                      <input
                        type="text"
                        value={lokasiEditInput}
                        onChange={(e) => setLokasiEditInput(e.target.value)}
                        placeholder="e.g. KANTOR PUSAT, MASJID AL-IKHLAS, GEDUNG UTAMA"
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                        Pilihan Cepat Tambah Lokasi:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {['KANTOR PUSAT', 'MASJID AL-IKHLAS', 'GEDUNG UTAMA', 'RUANG TAHFIDZ', 'MASJID AGUNG'].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              const currentList = lokasiEditInput.split(/[,&]/).map(s => s.trim()).filter(Boolean);
                              if (!currentList.includes(preset)) {
                                const newList = [...currentList, preset];
                                setLokasiEditInput(newList.join(', '));
                              }
                            }}
                            className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 px-2.5 py-1 rounded-md transition cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const locList = lokasiEditInput.split(/[,&]/).map(s => s.trim()).filter(Boolean);
                          updateGuru(activeG.id, {
                            keteranganLokasi: lokasiEditInput,
                            lokasiMengajar: locList
                          });
                          alert(`Lokasi mengajar untuk ${activeG.namaLengkap} berhasil diperbarui!`);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Lokasi Guru Ini</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* List All Gurus Locations Overview */}
              <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Daftar Lokasi Mengajar Seluruh Guru ({gurus.length}):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(gurus || []).map(g => (
                    <div
                      key={g.id}
                      onClick={() => {
                        setSelectedGuruForLokasiEdit(g.id);
                        setLokasiEditInput(g.keteranganLokasi || (g.lokasiMengajar ? g.lokasiMengajar.join(', ') : ''));
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        selectedGuruForLokasiEdit === g.id
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                          : 'bg-slate-50/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{getGuruTitleAndName(g)}</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{getGuruLokasiText(g, 'Belum disetel')}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 hover:text-emerald-600">
                        Edit &rarr;
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLokasiModalOpen(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Selesai
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
