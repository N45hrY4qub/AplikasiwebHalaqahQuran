/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserRole, 
  StatusAktif, 
  JenisKelamin, 
  Admin, 
  Guru, 
  Siswa, 
  Kelas, 
  Halaqah,
  AdminSubRole,
  AdminPermissionKey,
  getConfigurableAdminMenus,
  normalizeAdminPermissions,
  normalizeAdminTabPermissions,
  createDefaultSubAdminAccess,
  isAdminUtama,
  isPrivateSiswa,
  getGuruLokasiText
} from '../types';
import { isDemoUser, DEMO_SISWA_IDS, DEMO_GURU_IDS } from '../data/mockTemplates';
import { Avatar, hasCustomProfilePhoto } from './Avatar';
import { AdminPermissionMatrix } from './AdminPermissionMatrix';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  Key, 
  Check, 
  X, 
  User, 
  Info,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Smartphone,
  Eye,
  Settings,
  Lock,
  MapPin,
  Hash,
  Layers,
  GraduationCap,
  Users,
  FolderOpen,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  Pencil,
  Tag,
  HelpCircle,
  Sparkles,
  Calendar,
  Bookmark,
  FileText,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

export type NisGroupingMode = 
  | 'angkatan'          // Rekomendasi Utama: Mengelompokkan per Tahun Angkatan (Auto Cerdas dari berbagai variasi NIS)
  | 'angkatan_halaqah'  // Angkatan + Kode Halaqah (Misal: Angkatan 2026 • Halaqah C)
  | 'pola_detail'       // Struktur Pola Teknis (Pola 1, Pola 2, Pola 3, Gelombang, Kustom)
  | 'all'               // Satu Tabel Utuh
  | 'auto'              // Alias untuk angkatan
  | 'pola1' | 'pola2' | 'pola3' | '4digit' | '6digit';

export interface ParsedNisInfo {
  raw: string;
  patternType: 'pola1' | 'pola2' | 'pola3' | '4digit' | '6digit' | 'other' | 'empty' | 'embedded' | 'date_fallback';
  patternName: string;
  patternBadge: string;
  exampleStr: string;
  tahun?: string;
  noUrut?: string;
  tahunDuaDigit?: string;
  kodeHalaqah?: string;
  urutanHalaqah?: string;
  groupKey: string;
  defaultGroupLabel: string;
  defaultGroupSubLabel: string;
  tahunAngkatan: string;
  labelAngkatan: string;
  subLabelAngkatan: string;
}

export const NIS_PATTERN_DEFINITIONS = [
  {
    id: 'angkatan',
    nama: 'Skema Fleksibel: Ekstraksi Cerdas Angkatan NIS (Rekomendasi Utama)',
    singkat: '🎓 Angkatan & Tahun Masuk (Auto Cerdas)',
    contoh: '202600126-C / 0012026-A / 2026001 / 001KS-A',
    penjelasan: 'Otomatis mendeteksi tahun angkatan dari semua variasi NIS (Pola 1, Pola 2, Pola 3, Prefix 2/4 Digit, Kode Halaqah, atau tanggal pendaftaran santri).',
    defaultNamaKelompok: 'Angkatan 2026 (TP 2026/2027)',
    defaultSubLabel: 'Santri Angkatan 2026',
    badge: '🎓 Angkatan',
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  {
    id: 'pola1',
    nama: 'Pola 1: Tahun + No.Urut + 2 Digit Tahun - Kode Halaqah',
    singkat: 'Pola 1 (202600126-C)',
    contoh: '202600126-C',
    penjelasan: 'Tahun Masuk (2026) + Nomor Urut (001) + Dua Angka Terakhir Tahun (26) - Kode Halaqah (C)',
    defaultNamaKelompok: 'Angkatan 2026 • Halaqah C',
    defaultSubLabel: 'Pola 1 (2026...26-C)',
    badge: '📌 Pola 1',
    badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
  },
  {
    id: 'pola2',
    nama: 'Pola 2: No.Urut + Kode Halaqah - Urutan Halaqah',
    singkat: 'Pola 2 (001KS-A / 001KS-B)',
    contoh: '001KS-A',
    contohAlt: '001KS-B',
    penjelasan: 'Nomor Urut (001) + Kode Halaqah (KS) - Urutan Halaqah (A atau B)',
    defaultNamaKelompok: 'Halaqah KS-A',
    defaultSubLabel: 'Pola 2 (...KS-A)',
    badge: '🏷️ Pola 2',
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  {
    id: 'pola3',
    nama: 'Pola 3: No.Urut + Tahun - Kode Halaqah',
    singkat: 'Pola 3 (0012026-A)',
    contoh: '0012026-A',
    penjelasan: 'Nomor Urut (001) + Tahun 4 Digit (2026) - Kode Halaqah (A)',
    defaultNamaKelompok: 'Angkatan 2026 • Halaqah A',
    defaultSubLabel: 'Pola 3 (...2026-A)',
    badge: '📅 Pola 3',
    badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  {
    id: '4digit',
    nama: 'Pola 4: Angkatan / Tahun Masuk 4 Digit',
    singkat: 'Angkatan (2026001)',
    contoh: '2026001',
    penjelasan: 'Tahun Masuk Angkatan (2026) + Nomor Urut Siswa (001)',
    defaultNamaKelompok: 'Angkatan / Tahun 2026',
    defaultSubLabel: 'Prefix: 2026••••',
    badge: '🎓 Angkatan',
    badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  }
];

export function parseNisFormat(nis: string, fallbackTanggalDibuat?: string): ParsedNisInfo {
  const clean = (nis || '').trim();
  
  // Extract year from registration date if available (e.g. "2026-03-15" -> "2026")
  let dateYear = '';
  if (fallbackTanggalDibuat && typeof fallbackTanggalDibuat === 'string') {
    const m = fallbackTanggalDibuat.match(/^(19\d{2}|20\d{2})/);
    if (m) dateYear = m[1];
  }

  if (!clean) {
    const yr = dateYear || 'unknown';
    const hasYr = yr !== 'unknown';
    return {
      raw: '',
      patternType: hasYr ? 'date_fallback' : 'empty',
      patternName: hasYr ? `Santri Baru (Reg. ${yr})` : 'Belum Memiliki NIS',
      patternBadge: hasYr ? '📅 Registrasi' : 'Tanpa NIS',
      exampleStr: '-',
      groupKey: hasYr ? `akt-${yr}` : 'no-nis',
      defaultGroupLabel: hasYr ? `Angkatan ${yr} (TP ${yr}/${parseInt(yr) + 1})` : 'Belum Memiliki NIS',
      defaultGroupSubLabel: hasYr ? `Terdata Masuk Tahun ${yr}` : 'Data santri tanpa nomor induk',
      tahunAngkatan: yr,
      labelAngkatan: hasYr ? `Angkatan ${yr} (TP ${yr}/${parseInt(yr) + 1})` : 'Belum Ditentukan Angkatannya',
      subLabelAngkatan: hasYr ? `Santri Masuk Tahun ${yr}` : 'Data santri tanpa NIS'
    };
  }

  // 1. Pola 1: Tahun (4 digit) + No Urut (3 digit) + 2 Angka Terakhir Tahun (2 digit) - Kode Halaqah
  // Contoh: 202600126-C  (2026 = Tahun, 001 = No Urut, 26 = Dua digit akhir tahun, C = Kode Halaqah)
  const matchPola1 = clean.match(/^(\d{4})(\d{3})(\d{2})-([A-Za-z0-9]+)$/i);
  if (matchPola1) {
    const [, tahun, noUrut, tahunDuaDigit, kodeHalaqah] = matchPola1;
    const kh = kodeHalaqah.toUpperCase();
    return {
      raw: clean,
      patternType: 'pola1',
      patternName: 'Pola 1 (Tahun + No.Urut + 2-Digit - Halaqah)',
      patternBadge: '📌 Pola 1',
      exampleStr: '202600126-C',
      tahun,
      noUrut,
      tahunDuaDigit,
      kodeHalaqah: kh,
      groupKey: `p1-${tahun}-${kh}`,
      defaultGroupLabel: `Angkatan ${tahun} • Halaqah ${kh}`,
      defaultGroupSubLabel: `Pola 1: ${tahun}...${tahunDuaDigit}-${kh}`,
      tahunAngkatan: tahun,
      labelAngkatan: `Angkatan ${tahun} (TP ${tahun}/${parseInt(tahun) + 1})`,
      subLabelAngkatan: `Pola 1: ${tahun}...${tahunDuaDigit}-${kh}`
    };
  }

  // 2. Pola 3: No Urut (3 digit) + Tahun (4 digit) - Kode Halaqah
  // Contoh: 0012026-A (001 = No Urut, 2026 = Tahun 4 digit, A = Kode Halaqah)
  const matchPola3 = clean.match(/^(\d{3})(\d{4})-([A-Za-z0-9]+)$/i);
  if (matchPola3) {
    const [, noUrut, tahun, kodeHalaqah] = matchPola3;
    const kh = kodeHalaqah.toUpperCase();
    return {
      raw: clean,
      patternType: 'pola3',
      patternName: 'Pola 3 (No.Urut + Tahun - Halaqah)',
      patternBadge: '📅 Pola 3',
      exampleStr: '0012026-A',
      noUrut,
      tahun,
      kodeHalaqah: kh,
      groupKey: `p3-${tahun}-${kh}`,
      defaultGroupLabel: `Angkatan ${tahun} • Halaqah ${kh}`,
      defaultGroupSubLabel: `Pola 3: ...${tahun}-${kh}`,
      tahunAngkatan: tahun,
      labelAngkatan: `Angkatan ${tahun} (TP ${tahun}/${parseInt(tahun) + 1})`,
      subLabelAngkatan: `Pola 3: ...${tahun}-${kh}`
    };
  }

  // 3. Pola 2: No Urut (3 digit) + Kode Halaqah - Urutan Halaqah
  // Contoh: 001KS-A, 001KS-B (001 = No Urut, KS = Kode Halaqah, A / B = Urutan Halaqah)
  const matchPola2 = clean.match(/^(\d{3})([A-Za-z0-9]+)-([A-Za-z0-9]+)$/i);
  if (matchPola2) {
    const [, noUrut, kodeHalaqah, urutanHalaqah] = matchPola2;
    const kh = kodeHalaqah.toUpperCase();
    const uh = urutanHalaqah.toUpperCase();
    const derivedYear = dateYear || '2026';
    return {
      raw: clean,
      patternType: 'pola2',
      patternName: 'Pola 2 (No.Urut + Kode - Urutan)',
      patternBadge: '🏷️ Pola 2',
      exampleStr: '001KS-A',
      noUrut,
      tahun: derivedYear,
      kodeHalaqah: `${kh}-${uh}`,
      urutanHalaqah: uh,
      groupKey: `p2-${kh}-${uh}`,
      defaultGroupLabel: `Halaqah ${kh}-${uh}`,
      defaultGroupSubLabel: `Pola 2: ...${kh}-${uh}`,
      tahunAngkatan: derivedYear,
      labelAngkatan: `Angkatan ${derivedYear} (TP ${derivedYear}/${parseInt(derivedYear) + 1})`,
      subLabelAngkatan: `Halaqah ${kh}-${uh}`
    };
  }

  // 4. Standar 6 Digit Gelombang (misal 202607001)
  const match6Digit = clean.match(/^(\d{6})/);
  if (match6Digit) {
    const key = match6Digit[1];
    const year = key.substring(0, 4);
    const month = key.substring(4, 6);
    const monthNames: Record<string, string> = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    const isYearMonth = /^(19|20)\d{2}(0[1-9]|1[0-2])$/.test(key);
    if (isYearMonth) {
      return {
        raw: clean,
        patternType: '6digit',
        patternName: 'Gelombang Bulanan (6-Digit)',
        patternBadge: '🌊 Gelombang',
        exampleStr: '202607001',
        tahun: year,
        groupKey: `g6-${key}`,
        defaultGroupLabel: `Gelombang ${monthNames[month] || month} ${year}`,
        defaultGroupSubLabel: `Prefix: ${key}•••`,
        tahunAngkatan: year,
        labelAngkatan: `Angkatan ${year} (TP ${year}/${parseInt(year) + 1})`,
        subLabelAngkatan: `Gelombang ${monthNames[month] || month} ${year}`
      };
    }
  }

  // 5. Standar 4 Digit Angkatan Awalan (misal 2026001, 2025091)
  const match4Digit = clean.match(/^(19\d{2}|20\d{2})/);
  if (match4Digit) {
    const year = match4Digit[1];
    return {
      raw: clean,
      patternType: '4digit',
      patternName: 'Angkatan 4 Digit',
      patternBadge: '🎓 Angkatan',
      exampleStr: '2026001',
      tahun: year,
      groupKey: `yr-${year}`,
      defaultGroupLabel: `Angkatan / Tahun ${year}`,
      defaultGroupSubLabel: `Prefix: ${year}••••`,
      tahunAngkatan: year,
      labelAngkatan: `Angkatan ${year} (TP ${year}/${parseInt(year) + 1})`,
      subLabelAngkatan: `Santri Masuk Tahun ${year}`
    };
  }

  // 6. Embedded 4-Digit Year anywhere in string (misal: HQ-2025-001, 2024/001/A, SAN-2026)
  const matchEmbeddedYear = clean.match(/(?:^|[^0-9])(19\d{2}|20\d{2})(?:[^0-9]|$)/);
  if (matchEmbeddedYear) {
    const year = matchEmbeddedYear[1];
    return {
      raw: clean,
      patternType: 'embedded',
      patternName: 'Format Kustom (Tahun Terdeteksi)',
      patternBadge: '🔍 NIS Khusus',
      exampleStr: clean,
      tahun: year,
      groupKey: `emb-${year}`,
      defaultGroupLabel: `Angkatan ${year} (Format Khusus)`,
      defaultGroupSubLabel: `Format: ${clean}`,
      tahunAngkatan: year,
      labelAngkatan: `Angkatan ${year} (TP ${year}/${parseInt(year) + 1})`,
      subLabelAngkatan: `Format NIS: ${clean}`
    };
  }

  // 7. Awalan 2-Digit Tahun (misal 26001 -> 2026, 25-001 -> 2025)
  const match2DigitPrefix = clean.match(/^(2[0-9])(?:[\.\-_/]?\d+)/);
  if (match2DigitPrefix) {
    const year = `20${match2DigitPrefix[1]}`;
    return {
      raw: clean,
      patternType: '4digit',
      patternName: 'Awalan 2-Digit Tahun',
      patternBadge: '🎓 2-Digit',
      exampleStr: clean,
      tahun: year,
      groupKey: `yr-${year}`,
      defaultGroupLabel: `Angkatan ${year} (NIS 2-Digit)`,
      defaultGroupSubLabel: `Prefix: ${match2DigitPrefix[1]}••••`,
      tahunAngkatan: year,
      labelAngkatan: `Angkatan ${year} (TP ${year}/${parseInt(year) + 1})`,
      subLabelAngkatan: `Format 2-Digit: ${match2DigitPrefix[1]}...`
    };
  }

  // 8. Fallback dengan tahun tanggal pendaftaran atau format generik
  const fallbackYear = dateYear || 'unknown';
  const hasValidYear = fallbackYear !== 'unknown';
  const genericKey = clean.substring(0, Math.min(clean.length, 6));

  return {
    raw: clean,
    patternType: hasValidYear ? 'date_fallback' : 'other',
    patternName: hasValidYear ? `Angkatan ${fallbackYear} (Terdeteksi Sistem)` : 'Format Non-Standar',
    patternBadge: hasValidYear ? '📅 Terdata' : '📝 Khusus',
    exampleStr: clean,
    tahun: hasValidYear ? fallbackYear : undefined,
    groupKey: hasValidYear ? `akt-${fallbackYear}` : `other-${genericKey}`,
    defaultGroupLabel: hasValidYear 
      ? `Angkatan ${fallbackYear} (TP ${fallbackYear}/${parseInt(fallbackYear) + 1})`
      : `Kelompok NIS ${genericKey}`,
    defaultGroupSubLabel: hasValidYear 
      ? `Terdata Masuk Tahun ${fallbackYear}`
      : `Format: ${genericKey}`,
    tahunAngkatan: fallbackYear,
    labelAngkatan: hasValidYear 
      ? `Angkatan ${fallbackYear} (TP ${fallbackYear}/${parseInt(fallbackYear) + 1})`
      : 'Belum Ditentukan Angkatannya',
    subLabelAngkatan: hasValidYear 
      ? `Santri Masuk Tahun ${fallbackYear}`
      : `NIS: ${clean}`
  };
}

interface ManageUsersProps {
  roleType?: 'admin' | 'guru' | 'siswa';
}

export const ManageUsers: React.FC<ManageUsersProps> = ({ roleType }) => {
  const { 
    currentSession,
    admins, 
    gurus, 
    siswas, 
    kelases, 
    halaqahs,
    createAdmin, 
    updateAdmin, 
    deleteAdmin,
    createGuru, 
    updateGuru, 
    deleteGuru, 
    importGurus,
    createSiswa, 
    updateSiswa, 
    deleteSiswa, 
    importSiswas,
    purgeAllDemoData,
    isDemoPurged,
    deletedUsersTrash,
    restoreFromTrash,
    permanentDeleteTrash,
    strukturLembaga
  } = useApp();

  // Tab state within ManageUsers: 'admin' | 'guru' | 'siswa'
  const [activeSubTab, setActiveSubTab] = useState<'admin' | 'guru' | 'siswa'>(roleType || 'admin');

  // Modal States for Demo Cleanup and Trash Recovery
  const [isCleanDemoModalOpen, setIsCleanDemoModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isPurgingDemo, setIsPurgingDemo] = useState(false);
  const [purgeSuccessMessage, setPurgeSuccessMessage] = useState<string | null>(null);

  // Demo counts calculation
  const demoSiswaCount = useMemo(() => siswas.filter(s => isDemoUser(s.id)).length, [siswas]);
  const demoGuruCount = useMemo(() => gurus.filter(g => isDemoUser(g.id)).length, [gurus]);
  const totalDemoCount = demoSiswaCount + demoGuruCount;

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // NIS Grouping & Table Controls for Siswa
  const [nisGroupingMode, setNisGroupingMode] = useState<NisGroupingMode>('angkatan');
  const [isNisGuideModalOpen, setIsNisGuideModalOpen] = useState<boolean>(false);
  const [selectedNisGroupFilter, setSelectedNisGroupFilter] = useState<string>('All');
  const [collapsedNisGroups, setCollapsedNisGroups] = useState<Record<string, boolean>>({});
  const [siswaSortBy, setSiswaSortBy] = useState<'nis-asc' | 'nis-desc' | 'name-asc' | 'name-desc'>('nis-asc');

  // Custom NIS Group Names (Editable by Admin)
  const [customNisGroupNames, setCustomNisGroupNames] = useState<Record<string, { label: string; subLabel?: string }>>(() => {
    try {
      const saved = localStorage.getItem('mh_custom_nis_group_names');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const saveCustomNisGroupNames = (updated: Record<string, { label: string; subLabel?: string }>) => {
    setCustomNisGroupNames(updated);
    try {
      localStorage.setItem('mh_custom_nis_group_names', JSON.stringify(updated));
    } catch {}
  };

  // State for Edit Group Name Modal
  const [isEditGroupNameModalOpen, setIsEditGroupNameModalOpen] = useState<boolean>(false);
  const [editingGroupKey, setEditingGroupKey] = useState<string>('');
  const [inputGroupLabel, setInputGroupLabel] = useState<string>('');
  const [inputGroupSubLabel, setInputGroupSubLabel] = useState<string>('');
  const [defaultGroupLabel, setDefaultGroupLabel] = useState<string>('');
  const [defaultGroupSubLabel, setDefaultGroupSubLabel] = useState<string>('');
  const [editingPatternType, setEditingPatternType] = useState<string>('pola1');
  const [editingExampleNis, setEditingExampleNis] = useState<string>('202600126-C');

  const openEditGroupNameModal = (
    groupKey: string,
    currentLabel: string,
    currentSubLabel: string,
    defLabel: string,
    defSubLabel: string,
    patternType?: string,
    exampleStr?: string
  ) => {
    setEditingGroupKey(groupKey);
    setInputGroupLabel(currentLabel);
    setInputGroupSubLabel(currentSubLabel || '');
    setDefaultGroupLabel(defLabel);
    setDefaultGroupSubLabel(defSubLabel);
    setEditingPatternType(patternType || 'pola1');
    setEditingExampleNis(exampleStr || '');
    setIsEditGroupNameModalOpen(true);
  };

  const handleSaveGroupName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingGroupKey) return;
    const trimmedLabel = inputGroupLabel.trim();
    const trimmedSub = inputGroupSubLabel.trim();

    const next = { ...customNisGroupNames };
    if (!trimmedLabel || trimmedLabel === defaultGroupLabel) {
      if (!trimmedSub || trimmedSub === defaultGroupSubLabel) {
        delete next[editingGroupKey];
      } else {
        next[editingGroupKey] = { label: defaultGroupLabel, subLabel: trimmedSub };
      }
    } else {
      next[editingGroupKey] = {
        label: trimmedLabel,
        subLabel: trimmedSub || defaultGroupSubLabel
      };
    }
    saveCustomNisGroupNames(next);
    setIsEditGroupNameModalOpen(false);
  };

  const handleResetGroupName = () => {
    if (!editingGroupKey) return;
    const next = { ...customNisGroupNames };
    delete next[editingGroupKey];
    saveCustomNisGroupNames(next);
    setInputGroupLabel(defaultGroupLabel);
    setInputGroupSubLabel(defaultGroupSubLabel);
    setIsEditGroupNameModalOpen(false);
  };

  // Modals status
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Dialog items
  const [selectedUserForReset, setSelectedUserForReset] = useState<{ id: string; nama: string; role: 'admin' | 'guru' | 'siswa' } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nama: string; role: 'admin' | 'guru' | 'siswa' } | null>(null);

  // Bulk / Excel Import local states
  const [csvText, setCsvText] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const [importFormatError, setImportFormatError] = useState('');

  // Form State
  const [formFields, setFormFields] = useState({
    namaLengkap: '',
    email: '',
    password: '',
    nomorHp: '',
    nomorHpOrangTua: '',
    jabatan: '',
    jenisKelamin: JenisKelamin.LAKI_LAKI,
    alamat: '',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    nis: '',
    kelasId: '',
    halaqahId: '',
    yayasanId: '',
    direktoratId: '',
    regionalId: '',
    sekolahId: '',
    jenjangId: '',
    izinHalaqahPribadi: false,
    lokasiMengajar: [] as string[],
    keteranganLokasi: ''
  });

  const [formError, setFormError] = useState('');
  
  // Custom states for guru assessment system role and competencies
  const [selectedPeran, setSelectedPeran] = useState<string[]>([]);
  const [selectedKompetensi, setSelectedKompetensi] = useState<string[]>([]);

  // Custom states for Admin sub-role and permissions
  const [selectedAdminSubRole, setSelectedAdminSubRole] = useState<AdminSubRole>('SUPER_ADMIN');
  const [adminJabatan, setAdminJabatan] = useState<string>('Super Admin Yayasan');
  const [selectedAdminPermissions, setSelectedAdminPermissions] = useState<AdminPermissionKey[]>(
    () => createDefaultSubAdminAccess().permissions
  );
  const [selectedAdminTabPermissions, setSelectedAdminTabPermissions] = useState<Record<string, string[]>>(
    () => createDefaultSubAdminAccess().adminTabPermissions
  );
  const [viewingAdminPermissionsModal, setViewingAdminPermissionsModal] = useState<Admin | null>(null);

  // Reset pagination on search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Setup form for CREATE or EDIT
  const openFormModal = (userId: string | null = null) => {
    setFormError('');
    if (userId) {
      // EDIT mode
      setEditingId(userId);
      if (activeSubTab === 'admin') {
        const item = admins.find(a => a.id === userId);
        if (item) {
          setFormFields({
            namaLengkap: item.namaLengkap,
            email: item.email,
            password: '', // do not display old password
            nomorHp: item.nomorHp,
            nomorHpOrangTua: '',
            jabatan: item.jabatan || '',
            jenisKelamin: JenisKelamin.LAKI_LAKI,
            alamat: '',
            fotoProfil: item.fotoProfil,
            status: item.status,
            nis: '',
            kelasId: '',
            halaqahId: '',
            yayasanId: '',
            direktoratId: '',
            regionalId: '',
            sekolahId: '',
            jenjangId: '',
            izinHalaqahPribadi: false,
            lokasiMengajar: [],
            keteranganLokasi: ''
          });
          setSelectedAdminSubRole(item.adminRole || (item.id === 'adm-1' ? 'SUPER_ADMIN' : 'SUB_ADMIN'));
          setAdminJabatan(item.jabatan || (item.id === 'adm-1' ? 'Super Admin Yayasan' : 'Admin SDM / Unit'));
          const resolvedPerms = item.permissions
            ? normalizeAdminPermissions(item.permissions)
            : getConfigurableAdminMenus().map(m => m.key);
          const resolvedTabs = normalizeAdminTabPermissions(
            resolvedPerms,
            item.adminTabPermissions,
            item.permissions
          );
          setSelectedAdminPermissions(resolvedPerms);
          setSelectedAdminTabPermissions(resolvedTabs);
        }
      } else if (activeSubTab === 'guru') {
        const item = gurus.find(g => g.id === userId);
        if (item) {
          setFormFields({
            namaLengkap: item.namaLengkap,
            email: item.email,
            password: '',
            nomorHp: item.nomorHp,
            nomorHpOrangTua: '',
            jabatan: item.jabatan,
            jenisKelamin: item.jenisKelamin,
            alamat: item.alamat,
            fotoProfil: item.fotoProfil,
            status: item.status,
            nis: '',
            kelasId: '',
            halaqahId: item.halaqahBimbinganId || '',
            yayasanId: item.yayasanId || '',
            direktoratId: item.direktoratId || '',
            regionalId: item.regionalId || '',
            sekolahId: item.sekolahId || '',
            jenjangId: item.jenjangId || '',
            izinHalaqahPribadi: item.izinHalaqahPribadi || false,
            lokasiMengajar: item.lokasiMengajar || [],
            keteranganLokasi: item.keteranganLokasi || (item.lokasiMengajar ? item.lokasiMengajar.join(', ') : '')
          });
          setSelectedPeran(item.peranGuru || ['Guru Halaqah']);
          setSelectedKompetensi(item.kompetensiGuru || []);
        }
      } else if (activeSubTab === 'siswa') {
        const item = siswas.find(s => s.id === userId);
        if (item) {
          setFormFields({
            namaLengkap: item.namaLengkap,
            email: item.email,
            password: '',
            nomorHp: '',
            nomorHpOrangTua: item.nomorHpOrangTua,
            jabatan: '',
            jenisKelamin: item.jenisKelamin,
            alamat: item.alamat,
            fotoProfil: item.fotoProfil,
            status: item.status,
            nis: item.nis,
            kelasId: item.kelasId,
            halaqahId: item.halaqahId,
            yayasanId: item.yayasanId || '',
            direktoratId: item.direktoratId || '',
            regionalId: item.regionalId || '',
            sekolahId: item.sekolahId || '',
            jenjangId: item.jenjangId || '',
            izinHalaqahPribadi: false,
            lokasiMengajar: [],
            keteranganLokasi: ''
          });
        }
      }
    } else {
      // CREATE mode
      setEditingId(null);
      setFormFields({
        namaLengkap: '',
        email: '',
        password: 'pass123', // default
        nomorHp: '',
        nomorHpOrangTua: '',
        jabatan: activeSubTab === 'guru' ? 'Guru Kelas' : '',
        jenisKelamin: JenisKelamin.LAKI_LAKI,
        alamat: '',
        fotoProfil: '',
        status: StatusAktif.AKTIF,
        nis: activeSubTab === 'siswa' ? `2026${Math.floor(1000 + Math.random() * 9000)}` : '',
        kelasId: kelases[0]?.id || '',
        halaqahId: halaqahs[0]?.id || '',
        yayasanId: 'yayasan',
        direktoratId: '',
        regionalId: '',
        sekolahId: '',
        jenjangId: '',
        izinHalaqahPribadi: false,
        lokasiMengajar: [],
        keteranganLokasi: ''
      });
      setSelectedPeran(['Guru Halaqah']);
      setSelectedKompetensi(['Tahfidz']);
      if (activeSubTab === 'admin') {
        const defaults = createDefaultSubAdminAccess();
        setSelectedAdminSubRole('SUB_ADMIN');
        setAdminJabatan('Staff Pengembangan SDM');
        setSelectedAdminPermissions(defaults.permissions);
        setSelectedAdminTabPermissions(defaults.adminTabPermissions);
      }
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formFields.namaLengkap.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (activeSubTab !== 'siswa' && !formFields.email.trim()) {
      setFormError('Alamat email wajib diisi.');
      return;
    }

    // Unique Email Validation (only if email is provided)
    if (!editingId && formFields.email.trim()) {
      const targetEmail = formFields.email.trim().toLowerCase();
      const emailExistsInAdmins = admins.some(a => a.email && a.email.toLowerCase() === targetEmail);
      const emailExistsInGurus = gurus.some(g => g.email && g.email.toLowerCase() === targetEmail);
      const emailExistsInSiswas = siswas.some(s => s.email && s.email.toLowerCase() === targetEmail);

      if (emailExistsInAdmins || emailExistsInGurus || emailExistsInSiswas) {
        setFormError('Alamat email ini sudah terdaftar di sistem. Gunakan email unik.');
        return;
      }
    }

    if (activeSubTab === 'admin') {
      const sanitizedPerms =
        selectedAdminSubRole === 'SUPER_ADMIN'
          ? undefined
          : normalizeAdminPermissions(selectedAdminPermissions);
      const sanitizedTabPerms =
        selectedAdminSubRole === 'SUPER_ADMIN'
          ? undefined
          : normalizeAdminTabPermissions(sanitizedPerms || [], selectedAdminTabPermissions);

      if (editingId) {
        updateAdmin(editingId, {
          namaLengkap: formFields.namaLengkap,
          email: formFields.email,
          nomorHp: formFields.nomorHp,
          status: formFields.status,
          fotoProfil: formFields.fotoProfil,
          adminRole: selectedAdminSubRole,
          jabatan: adminJabatan,
          permissions: sanitizedPerms,
          adminTabPermissions: sanitizedTabPerms
        });
      } else {
        createAdmin({
          namaLengkap: formFields.namaLengkap,
          email: formFields.email,
          nomorHp: formFields.nomorHp,
          status: formFields.status,
          fotoProfil: formFields.fotoProfil,
          adminRole: selectedAdminSubRole,
          jabatan: adminJabatan,
          permissions: sanitizedPerms,
          adminTabPermissions: sanitizedTabPerms
        });
      }
    } else if (activeSubTab === 'guru') {
      const hObj = halaqahs.find(h => h.id === formFields.halaqahId);
      if (editingId) {
        updateGuru(editingId, {
          namaLengkap: formFields.namaLengkap,
          email: formFields.email,
          nomorHp: formFields.nomorHp,
          jabatan: formFields.jabatan,
          jenisKelamin: formFields.jenisKelamin,
          alamat: formFields.alamat,
          status: formFields.status,
          halaqahBimbinganId: formFields.halaqahId,
          halaqahBimbinganNama: hObj ? hObj.namaHalaqah : '',
          peranGuru: selectedPeran,
          kompetensiGuru: selectedKompetensi,
          yayasanId: formFields.yayasanId,
          direktoratId: formFields.direktoratId,
          regionalId: formFields.regionalId,
          sekolahId: formFields.sekolahId,
          jenjangId: formFields.jenjangId,
          izinHalaqahPribadi: formFields.izinHalaqahPribadi,
          lokasiMengajar: formFields.lokasiMengajar,
          keteranganLokasi: formFields.keteranganLokasi
        });
      } else {
        createGuru({
          namaLengkap: formFields.namaLengkap,
          email: formFields.email,
          nomorHp: formFields.nomorHp,
          jabatan: formFields.jabatan,
          jenisKelamin: formFields.jenisKelamin,
          alamat: formFields.alamat,
          status: formFields.status,
          halaqahBimbinganId: formFields.halaqahId,
          halaqahBimbinganNama: hObj ? hObj.namaHalaqah : '',
          fotoProfil: formFields.fotoProfil,
          peranGuru: selectedPeran,
          kompetensiGuru: selectedKompetensi,
          yayasanId: formFields.yayasanId,
          direktoratId: formFields.direktoratId,
          regionalId: formFields.regionalId,
          sekolahId: formFields.sekolahId,
          jenjangId: formFields.jenjangId,
          izinHalaqahPribadi: formFields.izinHalaqahPribadi,
          lokasiMengajar: formFields.lokasiMengajar,
          keteranganLokasi: formFields.keteranganLokasi
        });
      }
    } else if (activeSubTab === 'siswa') {
      if (!formFields.nis.trim()) {
        setFormError('NIS wajib diisi untuk siswa.');
        return;
      }
      
      // Unique NIS Check for Siswa
      if (!editingId) {
        const nisExists = siswas.some(s => s.nis === formFields.nis.trim());
        if (nisExists) {
          setFormError('NIS siswa ini sudah terdaftar. NIS harus unik.');
          return;
        }
      }

      const selectedJenjang = strukturLembaga.jenjangList.find(j => j.id === formFields.jenjangId);
      const computedKelasId = formFields.jenjangId || formFields.kelasId;
      const computedKelasNama = selectedJenjang ? selectedJenjang.nama : (kelases.find(c => c.id === formFields.kelasId)?.namaKelas || '');
      const hObj = halaqahs.find(h => h.id === formFields.halaqahId || h.jenjangId === formFields.jenjangId || h.id === formFields.jenjangId);
      const resolvedHalaqahId = formFields.halaqahId || (hObj ? hObj.id : (selectedJenjang ? selectedJenjang.id : ''));
      const resolvedHalaqahNama = hObj ? hObj.namaHalaqah : (selectedJenjang ? selectedJenjang.nama : '');

      if (editingId) {
        updateSiswa(editingId, {
          namaLengkap: formFields.namaLengkap,
          nis: formFields.nis,
          email: formFields.email,
          nomorHpOrangTua: formFields.nomorHpOrangTua,
          jenisKelamin: formFields.jenisKelamin,
          alamat: formFields.alamat,
          status: formFields.status,
          kelasId: computedKelasId,
          kelasNama: computedKelasNama,
          halaqahId: resolvedHalaqahId,
          halaqahNama: resolvedHalaqahNama,
          yayasanId: formFields.yayasanId,
          direktoratId: formFields.direktoratId,
          regionalId: formFields.regionalId,
          sekolahId: formFields.sekolahId,
          jenjangId: formFields.jenjangId
        });
      } else {
        createSiswa({
          nis: formFields.nis,
          namaLengkap: formFields.namaLengkap,
          email: formFields.email,
          nomorHpOrangTua: formFields.nomorHpOrangTua,
          jenisKelamin: formFields.jenisKelamin,
          alamat: formFields.alamat,
          status: formFields.status,
          kelasId: computedKelasId,
          kelasNama: computedKelasNama,
          halaqahId: resolvedHalaqahId,
          halaqahNama: resolvedHalaqahNama,
          fotoProfil: formFields.fotoProfil,
          tanggalLahir: '2012-01-01',
          yayasanId: formFields.yayasanId,
          direktoratId: formFields.direktoratId,
          regionalId: formFields.regionalId,
          sekolahId: formFields.sekolahId,
          jenjangId: formFields.jenjangId
        });
      }
    }

    setIsFormOpen(false);
  };

  const handleDeleteUser = (id: string, nama: string) => {
    setConfirmDelete({ id, nama, role: activeSubTab });
  };

  const executeDeleteUser = () => {
    if (!confirmDelete) return;
    const { id, role } = confirmDelete;
    if (role === 'admin') {
      if (admins.length <= 1) {
        alert("Sistem membutuhkan minimal 1 Akun Admin. Silakan buat atau daftarkan akun admin baru terlebih dahulu sebelum menghapus akun ini.");
        setConfirmDelete(null);
        return;
      }
      deleteAdmin(id);
    }
    else if (role === 'guru') deleteGuru(id);
    else if (role === 'siswa') deleteSiswa(id);
    setConfirmDelete(null);
  };

  const handlePurgeAllDemo = async () => {
    setIsPurgingDemo(true);
    try {
      const ok = await purgeAllDemoData();
      if (ok) {
        setPurgeSuccessMessage('Seluruh data dummy / demo bawaan sistem berhasil dibersihkan permanen! Data asli lembaga Anda aman dan data demo dicegah muncul kembali secara otomatis.');
        setIsCleanDemoModalOpen(false);
      }
    } catch (e) {
      console.error('Error purging demo:', e);
    } finally {
      setIsPurgingDemo(false);
    }
  };

  // Reset Password Dialog Handler
  const openResetDialog = (userObj: { id: string; nama: string }) => {
    setSelectedUserForReset({
      id: userObj.id,
      nama: userObj.nama,
      role: activeSubTab
    });
    setNewPassword('sandi-baru-123');
    setResetSuccessMessage(false);
    setIsResetOpen(true);
  };

  const handleResetPasswordAction = () => {
    if (!selectedUserForReset) return;
    
    // In this robust state, we update the simulated state and trigger feedback
    if (selectedUserForReset.role === 'admin') {
      updateAdmin(selectedUserForReset.id, { password: newPassword });
    } else if (selectedUserForReset.role === 'guru') {
      updateGuru(selectedUserForReset.id, { password: newPassword });
    } else if (selectedUserForReset.role === 'siswa') {
      updateSiswa(selectedUserForReset.id, { password: newPassword });
    }

    setResetSuccessMessage(true);
    setTimeout(() => {
      setIsResetOpen(false);
    }, 1500);
  };

  const triggerProfileImageUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFields(prev => ({
          ...prev,
          fotoProfil: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Excel Bulk Import Simulation Parsing
  // Let's provide templates
  const downloadTemplateSim = () => {
    let header = '';
    let rows = '';
    if (activeSubTab === 'guru') {
      header = 'namaLengkap,email,nomorHp,jabatan,jenisKelamin,alamat\n';
      rows = 'Pembimbing Contoh 1,pembimbing1@halaqah.example,0800-0000-0101,Pengajar Tajwid,Laki-laki,Komplek Pendidikan Blok A\nPembimbing Contoh 2,pembimbing2@halaqah.example,0800-0000-0102,Pengajar Akhlak,Perempuan,Komplek Pendidikan Blok B';
    } else if (activeSubTab === 'siswa') {
      header = 'nis,namaLengkap,email,nomorHpOrangTua,jenisKelamin,alamat\n';
      rows = '202609001,Santri Contoh 1,santri1@halaqah.example,0800-0000-0201,Laki-laki,Asrama Putra Blok A\n202609002,Santri Contoh 2,santri2@halaqah.example,0800-0000-0202,Perempuan,Asrama Putri Blok B';
    }
    
    // Auto populate copy area
    setCsvText(header + rows);
    setImportNotice('Template CSV dimuat secara otomatis di kotak teks di bawah. Anda dapat mengedit values dan klik "Mulai Impor"!');
  };

  const handleBulkImportSubmit = () => {
    setImportFormatError('');
    if (!csvText.trim()) {
      setImportFormatError('Format teks CSV/Excel kosong.');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setImportFormatError('Data CSV minimal terdiri dari baris header dan 1 baris nilai.');
        return;
      }

      const headers = lines[0].split(',');
      const rows = lines.slice(1);

      if (activeSubTab === 'guru') {
        const listToImport = rows.map(row => {
          const cells = row.split(',');
          // cell map: namaLengkap, email, nomorHp, jabatan, jenisKelamin, alamat
          return {
            namaLengkap: cells[0] || 'Guru Baru',
            email: cells[1] || `guru-${Date.now()}@halaqah.example`,
            nomorHp: cells[2] || '08',
            jabatan: cells[3] || 'Guru',
            jenisKelamin: (cells[4] === 'Perempuan' ? JenisKelamin.PEREMPUAN : JenisKelamin.LAKI_LAKI),
            alamat: cells[5] || '-',
            status: StatusAktif.AKTIF,
            fotoProfil: '',
            halaqahBimbinganId: halaqahs[0]?.id || '',
            halaqahBimbinganNama: halaqahs[0]?.namaHalaqah || ''
          };
        });
        importGurus(listToImport);
      } else if (activeSubTab === 'siswa') {
        const listToImport = rows.map(row => {
          const cells = row.split(',');
          // cell map: nis, namaLengkap, email, nomorHpOrangTua, jenisKelamin, alamat
          return {
            nis: cells[0] || `2026${Math.floor(100 + Math.random() * 900)}`,
            namaLengkap: cells[1] || 'Siswa Baru',
            email: cells[2] || '',
            nomorHpOrangTua: cells[3] || '08',
            jenisKelamin: (cells[4] === 'Perempuan' ? JenisKelamin.PEREMPUAN : JenisKelamin.LAKI_LAKI),
            alamat: cells[5] || '-',
            status: StatusAktif.AKTIF,
            kelasId: kelases[0]?.id || '',
            kelasNama: kelases[0]?.namaKelas || '',
            halaqahId: halaqahs[0]?.id || '',
            halaqahNama: halaqahs[0]?.namaHalaqah || '',
            fotoProfil: '',
            tanggalLahir: '2012-01-01'
          };
        });
        importSiswas(listToImport);
      }

      setIsImportOpen(false);
      setCsvText('');
      setImportNotice('');
    } catch (e) {
      setImportFormatError('Parsing CSV Error. Pastikan dipisahkan koma dan sesuai petunjuk.');
    }
  };


  // Filtering lists
  let filteredList: any[] = [];
  if (activeSubTab === 'admin') {
    filteredList = admins.filter(a => {
      const matchSearch = a.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || a.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  } else if (activeSubTab === 'guru') {
    filteredList = gurus.filter(g => {
      const matchSearch = g.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || g.email.toLowerCase().includes(searchQuery.toLowerCase()) || g.jabatan.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || g.status === statusFilter;
      const matchGender = genderFilter === 'All' || g.jenisKelamin === genderFilter;
      return matchSearch && matchStatus && matchGender;
    });
  } else if (activeSubTab === 'siswa') {
    filteredList = siswas.filter(s => {
      // Exclude students from Halaqah Pribadi
      if (isPrivateSiswa(s, halaqahs)) return false;
      const matchSearch = s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery);
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchGender = genderFilter === 'All' || s.jenisKelamin === genderFilter;
      return matchSearch && matchStatus && matchGender;
    });
  }

  // Pagination logic
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Helper for NIS grouping format and categorization
  const getNisGroupInfo = (siswaOrNis: Siswa | string, mode: NisGroupingMode) => {
    const rawNis = typeof siswaOrNis === 'string' ? siswaOrNis : (siswaOrNis?.nis || '');
    const fallbackDate = typeof siswaOrNis === 'object' ? siswaOrNis?.tanggalDibuat : undefined;
    const halaqahName = typeof siswaOrNis === 'object' ? siswaOrNis?.halaqahNama : undefined;

    if (mode === 'all') {
      return {
        key: 'all',
        label: 'Seluruh Siswa / Santri',
        subLabel: 'Semua Nomor Induk Santri',
        defaultLabel: 'Seluruh Siswa / Santri',
        defaultSubLabel: 'Semua Nomor Induk Santri',
        isCustom: false,
        patternType: 'all',
        patternBadge: 'Semua',
        exampleStr: 'Semua Format NIS',
        parsed: {
          raw: rawNis,
          patternType: 'other' as const,
          patternName: 'Semua Format',
          patternBadge: 'Semua',
          exampleStr: '',
          groupKey: 'all',
          defaultGroupLabel: 'Seluruh Siswa / Santri',
          defaultGroupSubLabel: 'Semua Nomor Induk Santri',
          tahunAngkatan: 'all',
          labelAngkatan: 'Seluruh Santri',
          subLabelAngkatan: 'Semua Angkatan'
        }
      };
    }

    const parsed = parseNisFormat(rawNis, fallbackDate);

    let baseKey = parsed.groupKey;
    let baseLabel = parsed.defaultGroupLabel;
    let baseSubLabel = parsed.defaultGroupSubLabel;
    let patternType = parsed.patternType;
    let patternBadge = parsed.patternBadge;

    // Mode 1: 'angkatan' or 'auto' (Smart Year Grouping - Recommended Default)
    if (mode === 'angkatan' || mode === 'auto' || mode === '4digit') {
      const yr = parsed.tahunAngkatan;
      if (yr && yr !== 'unknown') {
        baseKey = `akt-${yr}`;
        baseLabel = `Angkatan ${yr} (TP ${yr}/${parseInt(yr) + 1})`;
        baseSubLabel = `Santri Masuk Tahun ${yr}`;
        patternType = '4digit';
        patternBadge = `🎓 Angkatan ${yr}`;
      } else {
        baseKey = 'no-akt';
        baseLabel = 'Belum Ditentukan Angkatannya';
        baseSubLabel = 'Data santri tanpa nomor induk / tanggal masuk';
        patternType = 'empty';
        patternBadge = 'Tanpa Angkatan';
      }
    } 
    // Mode 2: 'angkatan_halaqah' (Angkatan + Kode Halaqah)
    else if (mode === 'angkatan_halaqah') {
      const yr = (parsed.tahunAngkatan && parsed.tahunAngkatan !== 'unknown') ? parsed.tahunAngkatan : '2026';
      const kh = parsed.kodeHalaqah || halaqahName || 'Umum';
      const khKey = kh.replace(/[^A-Za-z0-9]/g, '_');
      baseKey = `ah-${yr}-${khKey}`;
      baseLabel = `Angkatan ${yr} • Halaqah ${kh}`;
      baseSubLabel = `Kelompok Halaqah ${kh} (${yr})`;
      patternType = parsed.patternType;
      patternBadge = `📌 ${yr} • ${kh}`;
    }
    // Mode 3: 'pola_detail' (Struktur Pola Teknis Pola 1 / 2 / 3 / Gelombang / Kustom)
    else if (mode === 'pola_detail' || mode === 'pola1' || mode === 'pola2' || mode === 'pola3' || mode === '6digit') {
      if (mode === 'pola1') {
        if (parsed.patternType === 'pola1') {
          baseKey = parsed.groupKey;
          baseLabel = parsed.defaultGroupLabel;
          baseSubLabel = parsed.defaultGroupSubLabel;
        } else {
          baseKey = 'p1-other';
          baseLabel = 'Format Non-Pola 1';
          baseSubLabel = 'Santri dengan format NIS lainnya';
          patternType = 'other';
          patternBadge = '📝 Non-Pola 1';
        }
      } else if (mode === 'pola2') {
        if (parsed.patternType === 'pola2') {
          baseKey = parsed.groupKey;
          baseLabel = parsed.defaultGroupLabel;
          baseSubLabel = parsed.defaultGroupSubLabel;
        } else {
          baseKey = 'p2-other';
          baseLabel = 'Format Non-Pola 2';
          baseSubLabel = 'Santri dengan format NIS lainnya';
          patternType = 'other';
          patternBadge = '📝 Non-Pola 2';
        }
      } else if (mode === 'pola3') {
        if (parsed.patternType === 'pola3') {
          baseKey = parsed.groupKey;
          baseLabel = parsed.defaultGroupLabel;
          baseSubLabel = parsed.defaultGroupSubLabel;
        } else {
          baseKey = 'p3-other';
          baseLabel = 'Format Non-Pola 3';
          baseSubLabel = 'Santri dengan format NIS lainnya';
          patternType = 'other';
          patternBadge = '📝 Non-Pola 3';
        }
      } else if (mode === '6digit') {
        if (parsed.patternType === '6digit') {
          baseKey = parsed.groupKey;
          baseLabel = parsed.defaultGroupLabel;
          baseSubLabel = parsed.defaultGroupSubLabel;
        } else {
          baseKey = 'g6-other';
          baseLabel = 'Format Non-Gelombang';
          baseSubLabel = 'Santri dengan format NIS lainnya';
          patternType = 'other';
          patternBadge = '📝 Non-Gelombang';
        }
      }
    }

    const custom = customNisGroupNames[baseKey];
    const hasCustomLabel = !!(custom && custom.label && custom.label.trim());
    const finalLabel = hasCustomLabel ? custom.label.trim() : baseLabel;
    const finalSubLabel = (custom && custom.subLabel !== undefined && custom.subLabel.trim()) ? custom.subLabel.trim() : baseSubLabel;

    return {
      key: baseKey,
      label: finalLabel,
      subLabel: finalSubLabel,
      defaultLabel: baseLabel,
      defaultSubLabel: baseSubLabel,
      isCustom: hasCustomLabel,
      patternType,
      patternBadge,
      exampleStr: parsed.exampleStr,
      parsed
    };
  };

  // Available NIS groups for selection dropdown
  const availableNisGroups = useMemo(() => {
    if (activeSubTab !== 'siswa') return [];
    const map = new Map<string, { 
      key: string; 
      label: string; 
      subLabel: string; 
      defaultLabel: string; 
      defaultSubLabel: string; 
      isCustom: boolean; 
      patternType: string;
      patternBadge: string;
      exampleStr: string;
      count: number;
    }>();
    
    siswas.forEach(s => {
      if (isPrivateSiswa(s, halaqahs)) return;
      const info = getNisGroupInfo(s, nisGroupingMode);
      if (!map.has(info.key)) {
        map.set(info.key, { 
          key: info.key, 
          label: info.label, 
          subLabel: info.subLabel,
          defaultLabel: info.defaultLabel,
          defaultSubLabel: info.defaultSubLabel,
          isCustom: info.isCustom,
          patternType: info.patternType,
          patternBadge: info.patternBadge,
          exampleStr: info.exampleStr,
          count: 0 
        });
      }
      map.get(info.key)!.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.key === 'no-nis' || a.key.endsWith('-other')) return 1;
      if (b.key === 'no-nis' || b.key.endsWith('-other')) return -1;
      return b.key.localeCompare(a.key);
    });
  }, [siswas, halaqahs, activeSubTab, nisGroupingMode, customNisGroupNames]);

  // Grouped Siswa data by NIS per table
  interface NisGroupData {
    groupKey: string;
    groupLabel: string;
    subLabel: string;
    defaultLabel: string;
    defaultSubLabel: string;
    isCustom: boolean;
    patternType: string;
    patternBadge: string;
    exampleStr: string;
    items: Siswa[];
    stats: {
      total: number;
      lakiLaki: number;
      perempuan: number;
      aktif: number;
      nonAktif: number;
    };
  }

  const groupedSiswaData = useMemo(() => {
    if (activeSubTab !== 'siswa') return [];

    const groupsMap = new Map<string, NisGroupData>();

    filteredList.forEach((s: Siswa) => {
      const info = getNisGroupInfo(s, nisGroupingMode);
      
      // If a specific NIS group is filtered
      if (selectedNisGroupFilter !== 'All' && info.key !== selectedNisGroupFilter) {
        return;
      }

      if (!groupsMap.has(info.key)) {
        groupsMap.set(info.key, {
          groupKey: info.key,
          groupLabel: info.label,
          subLabel: info.subLabel,
          defaultLabel: info.defaultLabel,
          defaultSubLabel: info.defaultSubLabel,
          isCustom: info.isCustom,
          patternType: info.patternType,
          patternBadge: info.patternBadge,
          exampleStr: info.exampleStr,
          items: [],
          stats: {
            total: 0,
            lakiLaki: 0,
            perempuan: 0,
            aktif: 0,
            nonAktif: 0
          }
        });
      }

      const grp = groupsMap.get(info.key)!;
      grp.items.push(s);
      grp.stats.total += 1;
      if (s.jenisKelamin === JenisKelamin.LAKI_LAKI) grp.stats.lakiLaki += 1;
      else if (s.jenisKelamin === JenisKelamin.PEREMPUAN) grp.stats.perempuan += 1;
      if (s.status === StatusAktif.AKTIF) grp.stats.aktif += 1;
      else grp.stats.nonAktif += 1;
    });

    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (a.groupKey === 'no-nis' || a.groupKey.endsWith('-other')) return 1;
      if (b.groupKey === 'no-nis' || b.groupKey.endsWith('-other')) return -1;
      return b.groupKey.localeCompare(a.groupKey);
    });

    sortedGroups.forEach(grp => {
      grp.items.sort((a, b) => {
        if (siswaSortBy === 'nis-desc') return (b.nis || '').localeCompare(a.nis || '');
        if (siswaSortBy === 'name-asc') return (a.namaLengkap || '').localeCompare(b.namaLengkap || '');
        if (siswaSortBy === 'name-desc') return (b.namaLengkap || '').localeCompare(a.namaLengkap || '');
        // default 'nis-asc'
        return (a.nis || '').localeCompare(b.nis || '');
      });
    });

    return sortedGroups;
  }, [filteredList, activeSubTab, nisGroupingMode, selectedNisGroupFilter, siswaSortBy, customNisGroupNames]);

  const toggleNisGroupCollapse = (groupKey: string) => {
    setCollapsedNisGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const expandAllNisGroups = () => {
    setCollapsedNisGroups({});
  };

  const collapseAllNisGroups = () => {
    const next: Record<string, boolean> = {};
    groupedSiswaData.forEach(g => {
      next[g.groupKey] = true;
    });
    setCollapsedNisGroups(next);
  };

  const editingSiswa = editingId && activeSubTab === 'siswa' ? siswas.find(s => s.id === editingId) : null;
  const selectedHalaqahObj = halaqahs.find(h => h.id === formFields.halaqahId);
  const isPrivateHalaqahSiswa = activeSubTab === 'siswa' && (
    (editingSiswa && (editingSiswa.sourceType === 'private_halaqah' || halaqahs.find(h => h.id === editingSiswa.halaqahId)?.sourceType === 'private_halaqah')) ||
    (!editingId && selectedHalaqahObj?.sourceType === 'private_halaqah')
  );

  // Dedicated Full Page View for Add / Edit User (Replaces Overlay Modal)
  if (isFormOpen) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Top Header Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition flex items-center gap-2 font-bold text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Daftar {activeSubTab === 'admin' ? 'Admin' : activeSubTab === 'guru' ? 'Guru' : 'Siswa'}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full uppercase tracking-wider border border-emerald-200/60 dark:border-emerald-800">
                  {editingId ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                  Sektor: {activeSubTab.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold font-sans text-slate-900 dark:text-white mt-1">
                {editingId 
                  ? (formFields.namaLengkap || 'Edit Profil Pengguna')
                  : (`Formulir Tambah ${activeSubTab === 'admin' ? 'Admin' : activeSubTab === 'guru' ? 'Guru / Pengajar' : 'Siswa / Santri'} Baru`)}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('user-page-form') as HTMLFormElement;
                if (formEl) formEl.requestSubmit();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Simpan Perubahan' : 'Buat Akun Baru'}
            </button>
          </div>
        </div>

        {/* Responsive Grid Form Layout */}
        <form id="user-page-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Photo Profile, Live Summary & Guidance */}
          <div className="space-y-6">
            {/* Profile Avatar Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Foto Profil & Ringkasan
              </h3>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative group">
                  <Avatar 
                    namaLengkap={formFields.namaLengkap || 'User'} 
                    fotoProfil={formFields.fotoProfil} 
                    className="w-24 h-24 text-2xl font-bold ring-4 ring-emerald-500/20 shadow-md"
                  />
                </div>

                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-base">
                    {formFields.namaLengkap || 'Nama Pengguna'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {activeSubTab === 'siswa' 
                      ? (formFields.nis ? `NIS: ${formFields.nis}` : 'NIS belum diisi')
                      : (formFields.email || 'Email belum diisi')}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      formFields.status === StatusAktif.AKTIF 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {formFields.status}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-full">
                      {activeSubTab === 'admin' ? (selectedAdminSubRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Sub') : activeSubTab === 'guru' ? (formFields.jabatan || 'Guru') : 'Siswa'}
                    </span>
                  </div>
                </div>

                <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Unggah / Ganti Foto Profil
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={triggerProfileImageUploadSim}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300 cursor-pointer"
                  />
                  {hasCustomProfilePhoto(formFields.fotoProfil) && (
                    <button
                      type="button"
                      onClick={() => setFormFields(prev => ({ ...prev, fotoProfil: '' }))}
                      className="mt-2 text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      Hapus Foto Profil
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Guidance Info Box */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <Info className="w-4 h-4 text-emerald-600" />
                Petunjuk Pengisian Form
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>Pastikan **Nama Lengkap** diisi sesuai dokumen resmi.</li>
                {activeSubTab !== 'siswa' && <li>**Email Kredensial** bersifat unik dan digunakan untuk login sistem.</li>}
                {activeSubTab === 'siswa' && <li>**NIS** wajib unik untuk tiap siswa/santri. Email orang tua/siswa bersifat opsional.</li>}
                {activeSubTab === 'admin' && <li>Admin Utama memiliki akses penuh, sedangkan Admin Tambahan dibatasi per menu yang dipilih.</li>}
                {activeSubTab === 'guru' && <li>Atur peran pendidik, halaqah bimbingan, serta hak akses pengelolaan halaqah pribadi.</li>}
              </ul>
            </div>
          </div>

          {/* Right Area: Form Input Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Informasi Utama & Kredensial */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                Informasi Utama & Kredensial Akun
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NIS for Student */}
                {activeSubTab === 'siswa' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="page-nis" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Nomor Induk Siswa (NIS) *
                      </label>
                      {formFields.nis && (
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {parseNisFormat(formFields.nis).patternBadge}
                        </span>
                      )}
                    </div>
                    <input
                      id="page-nis"
                      type="text"
                      required
                      value={formFields.nis}
                      onChange={(e) => setFormFields(prev => ({ ...prev, nis: e.target.value }))}
                      placeholder="Contoh: 202600126-C / 001KS-A / 0012026-A"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold font-mono focus:ring-2 focus:ring-emerald-500"
                    />

                    {/* Live NIS Pattern Diagnostic / Breakdown */}
                    {formFields.nis && (() => {
                      const p = parseNisFormat(formFields.nis);
                      return (
                        <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/80 rounded-xl text-[11px] space-y-1.5 animate-fade-in">
                          <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              {p.patternName}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700 rounded text-emerald-700 dark:text-emerald-300">
                              Kelompok: {p.groupKey}
                            </span>
                          </div>
                          
                          {/* Pattern Anatomy */}
                          {p.patternType === 'pola1' && (
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-700 font-mono">
                                Thn: <b>{p.tahun}</b>
                              </span>
                              <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-700 font-mono">
                                Urut: <b>{p.noUrut}</b>
                              </span>
                              <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-700 font-mono">
                                2-Digit: <b>{p.tahunDuaDigit}</b>
                              </span>
                              <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800 font-mono font-bold">
                                Halaqah: <b>{p.kodeHalaqah}</b>
                              </span>
                            </div>
                          )}

                          {p.patternType === 'pola2' && (
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-700 font-mono">
                                Urut: <b>{p.noUrut}</b>
                              </span>
                              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded border border-emerald-300 dark:border-emerald-700 font-mono font-bold">
                                Kode: <b>{p.kodeHalaqah}</b>
                              </span>
                              <span className="px-1.5 py-0.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800 font-mono font-bold">
                                Urutan: <b>{p.urutanHalaqah}</b>
                              </span>
                            </div>
                          )}

                          {p.patternType === 'pola3' && (
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-slate-700 font-mono">
                                Urut: <b>{p.noUrut}</b>
                              </span>
                              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded border border-amber-300 dark:border-amber-700 font-mono font-bold">
                                Tahun: <b>{p.tahun}</b>
                              </span>
                              <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800 font-mono font-bold">
                                Halaqah: <b>{p.kodeHalaqah}</b>
                              </span>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Nama otomatis: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.defaultGroupLabel}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quick Example Presets for Admin */}
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">
                        Format Pilihan Cepat:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setFormFields(prev => ({ ...prev, nis: '202600126-C' }))}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
                          title="Pola 1: Tahun+Urut+26-Kode (202600126-C)"
                        >
                          📌 Pola 1: 202600126-C
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormFields(prev => ({ ...prev, nis: '001KS-A' }))}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition"
                          title="Pola 2: Urut+Kode-Urutan (001KS-A)"
                        >
                          🏷️ Pola 2: 001KS-A
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormFields(prev => ({ ...prev, nis: '001KS-B' }))}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-pointer transition"
                          title="Pola 2: Urut+Kode-Urutan (001KS-B)"
                        >
                          🏷️ Pola 2: 001KS-B
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormFields(prev => ({ ...prev, nis: '0012026-A' }))}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer transition"
                          title="Pola 3: Urut+Tahun-Kode (0012026-A)"
                        >
                          📅 Pola 3: 0012026-A
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormFields(prev => ({ ...prev, nis: '2026001' }))}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer transition"
                          title="Pola 4: Angkatan (2026001)"
                        >
                          🎓 Angkatan: 2026001
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nama Lengkap */}
                <div className={activeSubTab === 'siswa' ? '' : 'md:col-span-2'}>
                  <label htmlFor="page-nama" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    id="page-nama"
                    type="text"
                    required
                    value={formFields.namaLengkap}
                    onChange={(e) => setFormFields(prev => ({ ...prev, namaLengkap: e.target.value }))}
                    placeholder="Masukkan nama lengkap beserta gelar jika ada..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label htmlFor="page-email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    {activeSubTab === 'siswa' ? 'Email (Opsional - Hubungkan ke Google Workspace)' : 'Email Kredensial Login *'}
                  </label>
                  <input
                    id="page-email"
                    type="email"
                    required={activeSubTab !== 'siswa'}
                    value={formFields.email}
                    onChange={(e) => setFormFields(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={activeSubTab === 'siswa' ? "Contoh: siswa@halaqah.example (Boleh dikosongkan)" : "Contoh: pengajar@halaqah.example"}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold disabled:opacity-45 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Phone fields & Gender */}
                {activeSubTab === 'siswa' ? (
                  <>
                    <div>
                      <label htmlFor="page-parent-phone" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Nomor HP Wali Murid / Orang Tua
                      </label>
                      <input
                        id="page-parent-phone"
                        type="tel"
                        value={formFields.nomorHpOrangTua}
                        onChange={(e) => setFormFields(prev => ({ ...prev, nomorHpOrangTua: e.target.value }))}
                        placeholder="0800..."
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="page-siswa-gender" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        id="page-siswa-gender"
                        value={formFields.jenisKelamin}
                        onChange={(e) => setFormFields(prev => ({ ...prev, jenisKelamin: e.target.value as JenisKelamin }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={JenisKelamin.LAKI_LAKI}>Laki-laki (Ikhwan)</option>
                        <option value={JenisKelamin.PEREMPUAN}>Perempuan (Akhwat)</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="page-general-phone" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Nomor HP / WhatsApp
                      </label>
                      <input
                        id="page-general-phone"
                        type="tel"
                        value={formFields.nomorHp}
                        onChange={(e) => setFormFields(prev => ({ ...prev, nomorHp: e.target.value }))}
                        placeholder="0812..."
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="page-guru-gender" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        id="page-guru-gender"
                        value={formFields.jenisKelamin}
                        onChange={(e) => setFormFields(prev => ({ ...prev, jenisKelamin: e.target.value as JenisKelamin }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={JenisKelamin.LAKI_LAKI}>Laki-laki (Ikhwan)</option>
                        <option value={JenisKelamin.PEREMPUAN}>Perempuan (Akhwat)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Admin or Guru specific role & privileges */}
            {activeSubTab === 'admin' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Level & Otoritas Akses Admin
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Tipe Kategori Akun Admin *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition ${selectedAdminSubRole === 'SUPER_ADMIN' ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-xs' : 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        <input
                          type="radio"
                          name="adminSubRolePage"
                          value="SUPER_ADMIN"
                          checked={selectedAdminSubRole === 'SUPER_ADMIN'}
                          onChange={() => {
                            setSelectedAdminSubRole('SUPER_ADMIN');
                            if (!adminJabatan || adminJabatan === 'Staff Divisi Pengembangan SDM') {
                              setAdminJabatan('Super Admin Yayasan');
                            }
                          }}
                          className="mt-0.5 accent-amber-600"
                        />
                        <div>
                          <p className="font-extrabold text-xs flex items-center gap-1">
                            🌟 Admin Utama (Super Admin)
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Akses penuh tanpa batas ke seluruh menu, pengaturan sistem, dan hak akses.
                          </p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition ${selectedAdminSubRole === 'SUB_ADMIN' ? 'bg-indigo-50/80 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-xs' : 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        <input
                          type="radio"
                          name="adminSubRolePage"
                          value="SUB_ADMIN"
                          checked={selectedAdminSubRole === 'SUB_ADMIN'}
                          onChange={() => {
                            setSelectedAdminSubRole('SUB_ADMIN');
                            if (!adminJabatan || adminJabatan === 'Super Admin Yayasan') {
                              setAdminJabatan('Staff Divisi Pengembangan SDM');
                            }
                          }}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                          <p className="font-extrabold text-xs flex items-center gap-1">
                            🛡️ Admin Tambahan (Sub-Admin)
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Akses dibatasi secara khusus sesuai modul yang diizinkan oleh Admin Utama.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="page-admin-jabatan" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Jabatan / Deskripsi Divisi *
                    </label>
                    <input
                      id="page-admin-jabatan"
                      type="text"
                      value={adminJabatan}
                      onChange={(e) => setAdminJabatan(e.target.value)}
                      placeholder="Contoh: Staff Pengembangan SDM, Admin Akademik, dsb."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {selectedAdminSubRole === 'SUB_ADMIN' && (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <AdminPermissionMatrix
                        selectedPermissions={selectedAdminPermissions}
                        onPermissionsChange={setSelectedAdminPermissions}
                        selectedTabPermissions={selectedAdminTabPermissions}
                        onTabPermissionsChange={setSelectedAdminTabPermissions}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'guru' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-600" />
                  Penugasan & Penempatan Guru
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="page-guru-role-name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Jabatan Pendidik
                    </label>
                    <input
                      id="page-guru-role-name"
                      type="text"
                      value={formFields.jabatan}
                      onChange={(e) => setFormFields(prev => ({ ...prev, jabatan: e.target.value }))}
                      placeholder="Contoh: Pengajar Tahfidz & Tajwid"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="page-guru-halaqat-id" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Halaqah Bimbingan Utama
                    </label>
                    <select
                      id="page-guru-halaqat-id"
                      value={formFields.halaqahId}
                      onChange={(e) => setFormFields(prev => ({ ...prev, halaqahId: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Belum Ditugasi</option>
                      {halaqahs.map(h => (
                        <option key={h.id} value={h.id}>{h.namaHalaqah}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Izin Halaqah Pribadi Toggle */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between p-4 bg-indigo-50/70 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                      <div>
                        <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">☑ Izin Pengelolaan Halaqah Pribadi</label>
                        <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400 mt-0.5">Izinkan guru mengelola grup halaqah pribadi/mandiri di luar struktur resmi institusi</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formFields.izinHalaqahPribadi || false}
                          onChange={(e) => setFormFields(prev => ({ ...prev, izinHalaqahPribadi: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Struktur Lembaga Affiliate Fields */}
            {((activeSubTab === 'guru') || (activeSubTab === 'siswa' && !isPrivateHalaqahSiswa)) && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Afiliasi Struktur Lembaga & Unit Sekolah
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="page-org-sekolah" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Unit Sekolah / Lembaga *
                    </label>
                    <select
                      id="page-org-sekolah"
                      required={!isPrivateHalaqahSiswa}
                      value={formFields.sekolahId}
                      onChange={(e) => {
                        const sId = e.target.value;
                        const selectedSch = strukturLembaga.sekolahList.find(s => s.id === sId);
                        setFormFields(prev => ({ 
                          ...prev, 
                          sekolahId: sId,
                          direktoratId: selectedSch?.direktoratId || '',
                          regionalId: selectedSch?.regionalId || '',
                          jenjangId: ''
                        }));
                      }}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Pilih Sekolah --</option>
                      {strukturLembaga.sekolahList.map(s => (
                        <option key={s.id} value={s.id}>{s.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="page-org-jenjang" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Halaqah Lembaga *
                    </label>
                    <select
                      id="page-org-jenjang"
                      required={!isPrivateHalaqahSiswa}
                      value={formFields.jenjangId}
                      onChange={(e) => setFormFields(prev => ({ ...prev, jenjangId: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Pilih Halaqah Lembaga --</option>
                      {strukturLembaga.jenjangList
                        .filter(j => !formFields.sekolahId || j.sekolahId === formFields.sekolahId)
                        .map(j => (
                          <option key={j.id} value={j.id}>{j.nama}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {strukturLembaga.selectedStructure !== 'A' && (formFields.direktoratId || formFields.regionalId) && (
                  <div className="flex gap-2 flex-wrap text-xs font-mono bg-slate-50 dark:bg-slate-950 p-3 border rounded-xl border-slate-200 dark:border-slate-800">
                    {formFields.direktoratId && (
                      <span className="text-amber-850 font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-lg">
                        📁 Dir: {strukturLembaga.direktoratList.find(d => d.id === formFields.direktoratId)?.nama || '-'}
                      </span>
                    )}
                    {strukturLembaga.selectedStructure === 'C' && formFields.regionalId && (
                      <span className="text-rose-850 font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 px-2.5 py-1 rounded-lg">
                        🌍 Reg: {strukturLembaga.regionalList.find(r => r.id === formFields.regionalId)?.nama || '-'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Alamat & Status Keaktifan */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600" />
                Alamat Domisili & Status Keaktifan Akun
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Status Keaktifan Akun
                  </label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields(prev => ({ ...prev, status: e.target.value as StatusAktif }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={StatusAktif.AKTIF}>Aktif (Bisa Login & Mengakses System)</option>
                    <option value={StatusAktif.NON_AKTIF}>Nonaktif (Dibekukan Sementara)</option>
                  </select>
                </div>

                {activeSubTab !== 'admin' && (
                  <div className="md:col-span-2">
                    <label htmlFor="page-address-area" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Alamat Rumah / Tempat Tinggal
                    </label>
                    <textarea
                      id="page-address-area"
                      value={formFields.alamat}
                      onChange={(e) => setFormFields(prev => ({ ...prev, alamat: e.target.value }))}
                      placeholder="Tuliskan alamat rumah lengkap..."
                      rows={3}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {formError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Action Footer Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Batalkan
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/25 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'Simpan Perubahan' : 'Buat Akun Baru'}
              </button>
            </div>

          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header operations bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-white">
            {activeSubTab === 'admin' 
              ? 'Manajemen Akun Administrator' 
              : activeSubTab === 'guru' 
              ? 'Manajemen Akun Asatidz & Guru' 
              : 'Manajemen Akun Siswa & Santri'}
          </h2>
          <p className="text-xs text-slate-400">
            {activeSubTab === 'admin' 
              ? 'Atur kredensial dan keanggotaan pimpinan / administrator' 
              : activeSubTab === 'guru' 
              ? 'Atur data asatidz, guru bimbingan halaqah, dan wali kelas' 
              : 'Atur data santri, nomor induk, bimbingan halaqah, dan penempatan kelas'}
          </p>
        </div>

        {/* Action Button cluster */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {deletedUsersTrash.length > 0 && (
            <button
              id="btn-trash-recovery"
              type="button"
              onClick={() => setIsTrashModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 transition cursor-pointer shadow-xs"
              title="Buka riwayat data guru atau santri yang terhapus untuk dipulihkan"
            >
              <RotateCcw className="w-4 h-4 mr-1.5 text-rose-600 dark:text-rose-400" /> 
              Pulihkan Data Terhapus ({deletedUsersTrash.length})
            </button>
          )}

          {totalDemoCount > 0 && (
            <button
              id="btn-clean-demo"
              type="button"
              onClick={() => setIsCleanDemoModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-200 transition cursor-pointer shadow-xs"
              title="Hapus seluruh data dummy bawaan sistem sekaligus"
            >
              <Trash2 className="w-4 h-4 mr-1.5 text-amber-600 dark:text-amber-400" />
              Bersihkan {totalDemoCount} Data Demo
            </button>
          )}

          {activeSubTab !== 'admin' && (
            <button
              id="btn-excel-import"
              onClick={() => {
                setImportFormatError('');
                downloadTemplateSim(); // pre-load
                setIsImportOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-305 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" /> Excel Bulk Import
            </button>
          )}

          <button
            id="btn-add-user"
            onClick={() => openFormModal(null)}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Tambah {activeSubTab === 'admin' ? 'Admin' : activeSubTab === 'guru' ? 'Guru' : 'Siswa'}
          </button>
        </div>
      </div>

      {/* Role Tabs */}
      {!roleType && (
        <div className="border-b border-slate-150 dark:border-slate-800/80">
          <nav className="flex space-x-8 text-sm">
            <button
              id="subtab-admin"
              onClick={() => { setActiveSubTab('admin'); setSearchQuery(''); setStatusFilter('All'); setCurrentPage(1); }}
              className={`pb-4 border-b-2 font-bold cursor-pointer transition-colors ${activeSubTab === 'admin' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-450 dark:border-emerald-450' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              Administrator ({admins.length})
            </button>
            <button
              id="subtab-guru"
              onClick={() => { setActiveSubTab('guru'); setSearchQuery(''); setStatusFilter('All'); setCurrentPage(1); }}
              className={`pb-4 border-b-2 font-bold cursor-pointer transition-colors ${activeSubTab === 'guru' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-450 dark:border-emerald-450' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              Asatidz / Guru ({gurus.length})
            </button>
            <button
              id="subtab-siswa"
              onClick={() => { setActiveSubTab('siswa'); setSearchQuery(''); setStatusFilter('All'); setCurrentPage(1); }}
              className={`pb-4 border-b-2 font-bold cursor-pointer transition-colors ${activeSubTab === 'siswa' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-450 dark:border-emerald-450' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              Siswa / Santri ({siswas.filter(s => !isPrivateSiswa(s, halaqahs)).length})
            </button>
          </nav>
        </div>
      )}

      {purgeSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{purgeSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setPurgeSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 font-bold p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {totalDemoCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/90 dark:border-amber-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Terdeteksi {totalDemoCount} Data Simulasi / Demo Bawaan
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900 dark:bg-amber-800 dark:text-amber-100 border border-amber-300 dark:border-amber-700">
                  {demoSiswaCount} Santri • {demoGuruCount} Guru
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                Data dummy ini sering muncul otomatis setelah koneksi ke Firebase terputus dan dapat memicu salah hapus data guru asli lembaga. Anda dapat membersihkan seluruh data demo sekaligus, dengan proteksi penuh untuk data akun asli Anda.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCleanDemoModalOpen(true)}
              className="w-full md:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Bersihkan Seluruh Data Demo
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
        
        {/* Realtime Search Input */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
          <input
            id="user-search-input"
            type="text"
            placeholder={`Cari nama, email, ${activeSubTab === 'siswa' ? 'NIS atau kelas' : 'kata kunci'}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-2 py-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none"
          >
            <option value="All">Semua Status</option>
            <option value={StatusAktif.AKTIF}>Status Aktif</option>
            <option value={StatusAktif.NON_AKTIF}>Status Nonaktif</option>
          </select>
        </div>

        {/* Gender Filter for Guru/Siswa */}
        <div>
          {activeSubTab !== 'admin' ? (
            <select
              id="gender-filter"
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none"
            >
              <option value="All">Semua Gender</option>
              <option value={JenisKelamin.LAKI_LAKI}>Laki-laki</option>
              <option value={JenisKelamin.PEREMPUAN}>Perempuan</option>
            </select>
          ) : (
            <div className="w-full px-2 py-2 border border-dotted border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-350 italic text-center">
              Fungsi filter dinonaktifkan
            </div>
          )}
        </div>

      </div>

      {/* NIS Grouping Toolbar - Exclusive for Siswa / Santri tab */}
      {activeSubTab === 'siswa' && (
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            {/* Grouping Mode Switcher */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2.5 flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" /> Mode Pengelompokan:
                </span>
                
                {/* 1. Angkatan Santri (Auto Cerdas) - Recommended */}
                <button
                  type="button"
                  onClick={() => setNisGroupingMode('angkatan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    nisGroupingMode === 'angkatan' || nisGroupingMode === 'auto'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Otomatis mengekstrak tahun angkatan dari semua variasi format NIS (Pola 1, Pola 2, Pola 3, dsb.)"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  🎓 Per Angkatan NIS (Cerdas)
                </button>

                {/* 2. Angkatan + Halaqah */}
                <button
                  type="button"
                  onClick={() => setNisGroupingMode('angkatan_halaqah')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    nisGroupingMode === 'angkatan_halaqah'
                      ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-xs border border-blue-200 dark:border-blue-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Kelompokkan berdasarkan kombinasi Angkatan dan Kode Halaqah"
                >
                  <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Angkatan + Halaqah
                </button>

                {/* 3. Detail Pola (Pola 1 / 2 / 3) */}
                <button
                  type="button"
                  onClick={() => setNisGroupingMode('pola_detail')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    nisGroupingMode === 'pola_detail' || nisGroupingMode === 'pola1' || nisGroupingMode === 'pola2' || nisGroupingMode === 'pola3'
                      ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-200 dark:border-indigo-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Memilah tabel berdasarkan detail pola NIS (Pola 1, Pola 2, Pola 3, Gelombang, dsb.)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Detail Pola NIS (1/2/3)
                </button>

                {/* 4. All in One */}
                <button
                  type="button"
                  onClick={() => setNisGroupingMode('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    nisGroupingMode === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Tampilkan seluruh santri dalam satu tabel utuh"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  Satu Tabel Utuh
                </button>
              </div>

              {/* Mode Explanation & Example Banner */}
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {(nisGroupingMode === 'angkatan' || nisGroupingMode === 'auto') && (
                    <span>
                      <b>Mode Per Angkatan (Solusi Fleksibel):</b> Sistem cerdas mengekstrak tahun angkatan dari semua variasi NIS (Pola 1 <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">202600126-C</code>, Pola 2 <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">001KS-A</code>, Pola 3 <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">0012026-A</code>, dll) sehingga santri terkelompok rapi per angkatan tanpa terpecah-pecah.
                    </span>
                  )}
                  {nisGroupingMode === 'angkatan_halaqah' && (
                    <span>
                      <b>Mode Angkatan + Halaqah:</b> Mengelompokkan santri per kombinasi Tahun Angkatan dan Kode Halaqah (misal: <code>Angkatan 2026 • Halaqah C</code> atau <code>Angkatan 2026 • Halaqah KS-A</code>).
                    </span>
                  )}
                  {(nisGroupingMode === 'pola_detail' || nisGroupingMode === 'pola1' || nisGroupingMode === 'pola2' || nisGroupingMode === 'pola3') && (
                    <span>
                      <b>Mode Detail Pola:</b> Memisahkan tabel berdasarkan spesifikasi struktur NIS (Pola 1, Pola 2, Pola 3, Format Kustom, dan Tanpa NIS).
                    </span>
                  )}
                  {nisGroupingMode === 'all' && (
                    <span>
                      <b>Satu Tabel Utuh:</b> Menampilkan seluruh santri dalam satu daftar tabel besar tanpa pemisah kelompok.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNisGuideModalOpen(true)}
                  className="shrink-0 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Buka panduan & tips standarisasi format NIS"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Panduan Format NIS
                </button>
              </div>
            </div>

            {/* Quick Actions for expand/collapse when in grouped mode */}
            {nisGroupingMode !== 'all' && (
              <div className="flex items-center gap-2 self-end lg:self-start pt-1">
                <button
                  type="button"
                  onClick={expandAllNisGroups}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Buka semua kelompok tabel"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> Buka Semua
                </button>
                <button
                  type="button"
                  onClick={collapseAllNisGroups}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Tutup semua kelompok tabel"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> Tutup Semua
                </button>
              </div>
            )}
          </div>

          {/* Sub-toolbar: Specific Group Filter & Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-900">
            {/* Filter by Specific NIS Group */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Fokus Kelompok NIS
              </label>
              <select
                value={selectedNisGroupFilter}
                onChange={(e) => setSelectedNisGroupFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="All">Semua Kelompok NIS ({availableNisGroups.reduce((acc, g) => acc + g.count, 0)} Santri)</option>
                {availableNisGroups.map(g => (
                  <option key={g.key} value={g.key}>
                    {g.patternBadge ? `[${g.patternBadge}] ` : ''}{g.label} ({g.count} Santri)
                  </option>
                ))}
              </select>
            </div>

            {/* Sort order within tables */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Urutkan Santri
              </label>
              <div className="relative">
                <select
                  value={siswaSortBy}
                  onChange={(e) => setSiswaSortBy(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="nis-asc">Nomor Induk NIS (Terkecil 0-9)</option>
                  <option value="nis-desc">Nomor Induk NIS (Terbesar 9-0)</option>
                  <option value="name-asc">Nama Santri (A ke Z)</option>
                  <option value="name-desc">Nama Santri (Z ke A)</option>
                </select>
              </div>
            </div>

            {/* Stats Summary Counter */}
            <div className="flex items-end">
              <div className="w-full py-1.5 px-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-lg flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-600" />
                  {nisGroupingMode !== 'all' ? `${groupedSiswaData.length} Tabel Kelompok` : '1 Tabel Utuh'}
                </span>
                <span className="font-mono text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                  {totalItems} Santri
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table view for SISWA when grouped */}
      {activeSubTab === 'siswa' && nisGroupingMode !== 'all' ? (
        <div className="space-y-6">
          {groupedSiswaData.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada data santri yang cocok</h4>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelompok NIS di atas.</p>
            </div>
          ) : (
            groupedSiswaData.map((group) => {
              const isCollapsed = !!collapsedNisGroups[group.groupKey];
              return (
                <div 
                  key={group.groupKey}
                  className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 overflow-hidden shadow-sm transition-all"
                >
                  {/* Group Header Card */}
                  <div 
                    onClick={() => toggleNisGroupCollapse(group.groupKey)}
                    className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-b border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/80 transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        group.patternType === 'pola1'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : group.patternType === 'pola2'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : group.patternType === 'pola3'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                      }`}>
                        {group.patternType === 'pola1' ? (
                          <Bookmark className="w-5 h-5" />
                        ) : group.patternType === 'pola2' ? (
                          <Tag className="w-5 h-5" />
                        ) : group.patternType === 'pola3' ? (
                          <Calendar className="w-5 h-5" />
                        ) : (
                          <GraduationCap className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-sans font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-1.5">
                            {group.groupLabel}
                            {group.isCustom && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                🏷️ Kustom
                              </span>
                            )}
                          </h3>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {group.patternBadge}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {group.subLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                          <span>Kode Kelompok: <b className="font-mono text-slate-600 dark:text-slate-300">{group.groupKey}</b></span>
                          {group.exampleStr && (
                            <span className="text-slate-400 dark:text-slate-500">
                              • Contoh Format NIS: <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{group.exampleStr}</code>
                            </span>
                          )}
                          {group.isCustom && (
                            <span className="text-slate-400 dark:text-slate-500 italic">
                              (Format asli: {group.defaultLabel})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons, Stats Pills & Collapse Toggle */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Edit Group Name Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditGroupNameModal(
                            group.groupKey,
                            group.groupLabel,
                            group.subLabel,
                            group.defaultLabel,
                            group.defaultSubLabel,
                            group.patternType,
                            group.exampleStr
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg transition cursor-pointer shadow-2xs"
                        title="Edit / Ganti Nama Kelompok Ini"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Edit Nama</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {group.stats.total} Santri
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-150 dark:border-blue-900 hidden md:inline-flex">
                          👦 {group.stats.lakiLaki}
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-150 dark:border-pink-900 hidden md:inline-flex">
                          👧 {group.stats.perempuan}
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-150 dark:border-emerald-900">
                          🟢 {group.stats.aktif} Aktif
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleNisGroupCollapse(group.groupKey); }}
                        className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer ml-1 shrink-0"
                        title={isCollapsed ? "Buka Tabel" : "Tutup Tabel"}
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Table Content */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-900 text-left">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                          <tr>
                            <th className="py-3 px-4 text-center w-12">#</th>
                            <th className="py-3 px-4">Nama Lengkap & ID</th>
                            <th className="py-3 px-4">NIS</th>
                            <th className="py-3 px-4">Kelas</th>
                            <th className="py-3 px-4">Halaqah</th>
                            <th className="py-3 px-4">Gender</th>
                            <th className="py-3 px-4">Detail Kontak & Wali</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                          {group.items.map((userObj, idx) => (
                            <tr key={userObj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                              {/* # */}
                              <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 text-center">
                                {idx + 1}
                              </td>

                              {/* Photo & Name */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center space-x-3">
                                  <Avatar 
                                    namaLengkap={userObj.namaLengkap} 
                                    fotoProfil={userObj.fotoProfil} 
                                    className="w-9 h-9 text-xs font-bold ring-1 ring-slate-200 dark:ring-slate-800"
                                  />
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{userObj.namaLengkap}</p>
                                    <div className="flex gap-1 items-center flex-wrap">
                                      <span className="text-[9px] text-slate-400 font-mono">{userObj.id}</span>
                                      {isDemoUser(userObj.id) ? (
                                        <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-1.5 py-0.2 rounded-md inline-flex items-center gap-1">
                                          🧪 Data Demo
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-md inline-flex items-center gap-1">
                                          ✅ Data Asli
                                        </span>
                                      )}
                                      {(userObj.sekolahId || userObj.jenjangId) && (() => {
                                        const sch = strukturLembaga.sekolahList.find(s => s.id === userObj.sekolahId);
                                        const jj = strukturLembaga.jenjangList.find(j => j.id === userObj.jenjangId);
                                        return sch ? (
                                          <span className="text-[9px] font-sans font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 px-1.5 py-0.2 rounded-md">
                                            🏫 {sch.nama} {jj ? `• ${jj.nama}` : ''}
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* NIS */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 font-mono font-extrabold text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                                  <Hash className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  {userObj.nis || '-'}
                                </span>
                              </td>

                              {/* Kelas */}
                              <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                                  {userObj.kelasNama || '-'}
                                </span>
                              </td>

                              {/* Halaqah */}
                              <td className="py-3.5 px-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50">
                                  {userObj.halaqahNama || 'Kosong'}
                                </span>
                              </td>

                              {/* Gender */}
                              <td className="py-3.5 px-4 text-xs font-medium">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  userObj.jenisKelamin === JenisKelamin.LAKI_LAKI
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-150 dark:border-blue-900'
                                    : 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-150 dark:border-pink-900'
                                }`}>
                                  {userObj.jenisKelamin === JenisKelamin.LAKI_LAKI ? '👦 Laki-laki' : '👧 Perempuan'}
                                </span>
                              </td>

                              {/* Contact details */}
                              <td className="py-3.5 px-4 space-y-0.5">
                                <p className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate max-w-[160px]">
                                  {userObj.email || <span className="text-slate-400 italic text-[11px]">-</span>}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                                  <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>{userObj.nomorHpOrangTua || 'Tidak ada'}</span>
                                </p>
                              </td>

                              {/* Status Indicator */}
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  userObj.status === StatusAktif.AKTIF 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' 
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                                }`}>
                                  {userObj.status === StatusAktif.AKTIF ? '🟢 Aktif' : '🔴 Nonaktif'}
                                </span>
                              </td>

                              {/* Action triggers */}
                              <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                                <button
                                  id={`btn-reset-${userObj.id}`}
                                  onClick={() => openResetDialog({ id: userObj.id, nama: userObj.namaLengkap })}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-400 rounded-lg inline-flex transition cursor-pointer"
                                  title="Ganti Password Akun"
                                >
                                  <Key className="w-4 h-4" />
                                </button>
                                <button
                                  id={`btn-edit-${userObj.id}`}
                                  onClick={() => openFormModal(userObj.id)}
                                  className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg inline-flex transition cursor-pointer"
                                  title="Edit Data Siswa/Santri"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  id={`btn-delete-${userObj.id}`}
                                  onClick={() => handleDeleteUser(userObj.id, userObj.namaLengkap)}
                                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg inline-flex transition cursor-pointer"
                                  title="Hapus Siswa/Santri"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Table Footer with group summary */}
                      <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Menampilkan {group.items.length} santri pada {group.groupLabel}</span>
                        <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Subtotal: {group.stats.total} santri ({group.stats.aktif} aktif)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Main Table panel for Admin, Guru, or Siswa when in 'all' single table mode */
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/85 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-900 text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                <tr>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  {activeSubTab === 'siswa' && <th className="py-3 px-4">NIS</th>}
                  <th className="py-3 px-4">Detail Kontak</th>
                  {activeSubTab === 'admin' && <th className="py-3 px-4">Level & Hak Akses</th>}
                  {activeSubTab === 'guru' && <th className="py-3 px-4">Jabatan</th>}
                  {activeSubTab === 'siswa' && (
                    <>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Halaqah</th>
                    </>
                  )}
                  {activeSubTab !== 'admin' && <th className="py-3 px-4">Gender</th>}
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                {paginatedList.map((userObj) => (
                  <tr key={userObj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/35 transition-colors">
                    {/* Photo & Name */}
                    <td className="py-3.5 px-4 flex items-center space-x-3">
                      <Avatar 
                        namaLengkap={userObj.namaLengkap} 
                        fotoProfil={userObj.fotoProfil} 
                        className="w-9 h-9 text-xs font-bold"
                      />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{userObj.namaLengkap}</p>
                        <div className="flex gap-1 items-center flex-wrap">
                          <span className="text-[9px] text-slate-400 font-mono">{userObj.id}</span>
                          {isDemoUser(userObj.id) ? (
                            <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-1.5 py-0.2 rounded-md inline-flex items-center gap-1">
                              🧪 Data Demo
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-md inline-flex items-center gap-1">
                              ✅ Data Asli
                            </span>
                          )}
                          {/* Lokasi Mengajar Badge if Guru */}
                          {activeSubTab === 'guru' && (
                            <span className="text-[9px] font-sans font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                              📍 {getGuruLokasiText(userObj, 'KANTOR PUSAT')}
                            </span>
                          )}
                          {/* Affiliation Badge if Guru/Siswa */}
                          {activeSubTab !== 'admin' && (userObj.sekolahId || userObj.jenjangId) && (() => {
                            const sch = strukturLembaga.sekolahList.find(s => s.id === userObj.sekolahId);
                            const jj = strukturLembaga.jenjangList.find(j => j.id === userObj.jenjangId);
                            return sch ? (
                              <span className="text-[9px] font-sans font-extrabold text-indigo-700 bg-indigo-50/70 border border-indigo-100/50 px-1.5 py-0.2 rounded-md">
                                🏫 {sch.nama} {jj ? `• ${jj.nama}` : ''}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </td>

                    {/* NIS for Siswa */}
                    {activeSubTab === 'siswa' && (
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {userObj.nis}
                      </td>
                    )}

                    {/* Contact details */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{userObj.email}</p>
                      <p className="text-slate-400 text-[11px] flex items-center">
                        <Smartphone className="w-3.5 h-3.5 mr-1" />
                        {userObj.nomorHp || userObj.nomorHpOrangTua || 'Tidak ada'}
                      </p>
                    </td>

                    {/* Admin Specific Level & Permissions */}
                    {activeSubTab === 'admin' && (() => {
                      const isUtama = isAdminUtama(userObj as any);
                      const jabatan = (userObj as Admin).jabatan || (isUtama ? 'Super Admin' : 'Admin Unit / SDM');
                      const perms = normalizeAdminPermissions((userObj as Admin).permissions);

                      return (
                        <td className="py-3.5 px-4 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isUtama ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                                🌟 Admin Utama
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                                🛡️ Admin Tambahan
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {jabatan}
                            </span>
                          </div>

                          {!isUtama && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                {perms.length} menu diizinkan
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewingAdminPermissionsModal(userObj as Admin)}
                                className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                              >
                                Rincian
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })()}

                    {/* Teacher Specific Jabatan */}
                    {activeSubTab === 'guru' && (
                      <td className="py-3.5 px-4 space-y-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-300 text-xs">{userObj.jabatan || 'Guru Pengajar'}</p>

                        {userObj.izinHalaqahPribadi && (
                          <div className="pt-0.5">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-55 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-[9px] font-extrabold border border-indigo-150 dark:border-indigo-900 uppercase tracking-wide">
                              ☑ Halaqah Pribadi
                            </span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Siswa Classes */}
                    {activeSubTab === 'siswa' && (
                      <>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {userObj.kelasNama || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100/65 dark:bg-emerald-950/40 dark:text-emerald-350">
                            {userObj.halaqahNama || 'Kosong'}
                          </span>
                        </td>
                      </>
                    )}

                    {/* Gender */}
                    {activeSubTab !== 'admin' && (
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {userObj.jenisKelamin}
                      </td>
                    )}

                    {/* Status Indicator */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        userObj.status === StatusAktif.AKTIF 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-green-950/40 dark:text-green-350' 
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'
                      }`}>
                        {userObj.status}
                      </span>
                    </td>

                    {/* Action triggers */}
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* Reset Password */}
                      <button
                        id={`btn-reset-${userObj.id}`}
                        onClick={() => openResetDialog({ id: userObj.id, nama: userObj.namaLengkap })}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-455 dark:text-slate-400 rounded-lg inline-flex"
                        title="Ganti Password Akun"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {/* Edit */}
                      <button
                        id={`btn-edit-${userObj.id}`}
                        onClick={() => openFormModal(userObj.id)}
                        className="p-1.5 hover:bg-emerald-50 dark:hover:bg-slate-900 text-emerald-600 rounded-lg inline-flex"
                        title={activeSubTab === 'siswa' ? "Edit Data Siswa/Santri" : "Edit Data Pengguna"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {/* Delete */}
                      <button
                        id={`btn-delete-${userObj.id}`}
                        onClick={() => handleDeleteUser(userObj.id, userObj.namaLengkap)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-slate-900 text-rose-600 rounded-lg inline-flex"
                        title={activeSubTab === 'siswa' ? "Hapus Siswa/Santri" : "Hapus Pengguna"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400 italic">
                      Belum ada data terekam untuk tab pilihan. Silakan tambah data baru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Multi-page Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-4.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Menampilkan {startIndex + 1} s/d {Math.min(totalItems, startIndex + itemsPerPage)} dari {totalItems} entri data
              </span>
              <div className="flex items-center space-x-2">
                <button
                  id="pagination-prev"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1 px-3 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <button
                  id="pagination-next"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1 px-3 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ==========================================
          MODAL DIALOG: GANTI PASSWORD
         ========================================== */}
      {isResetOpen && selectedUserForReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative border border-slate-100 dark:border-slate-900 my-auto">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Atur Ulang Sandi</h3>
            <p className="text-xs text-slate-400 mt-1">Mengganti password akun: {selectedUserForReset.nama}</p>
            
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 uppercase tracking-widest font-bold">PASSWORD BARU</label>
                <input 
                  type="text" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-55 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {resetSuccessMessage && (
                <p className="text-xs text-emerald-600 font-bold flex items-center">
                  <Check className="w-4 h-4 mr-1 text-emerald-500" /> Sandi berhasil diperbarui!
                </p>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  onClick={() => setIsResetOpen(false)}
                  className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetPasswordAction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                >
                  Ganti Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ==========================================
          MODAL DIALOG: MASS EXCEL IMPORT
         ========================================== */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-slate-100 dark:border-slate-900 my-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Excel Bulk Import ({activeSubTab === 'guru' ? 'Guru' : 'Siswa'})</h3>
                <p className="text-xs text-slate-400">Unggah berkas atau tempel baris sheet data Anda</p>
              </div>
              <button 
                onClick={() => setIsImportOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Instructions and Download Template Buttons */}
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl space-y-2">
                <div className="flex items-center text-xs font-bold text-emerald-800 dark:text-emerald-450 uppercase tracking-wider">
                  <Info className="w-4 h-4 mr-1.5" /> Panduan Impor Cepat
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Gunakan format kolom yang tepat dipisahkan koma (,). Kami menyediakan data sampel pengujian di kotak di bawah yang dapat Anda klik tombol template untuk memulihkannya.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={downloadTemplateSim}
                    className="inline-flex items-center px-3 py-1 bg-white hover:bg-slate-50 border border-emerald-250 rounded text-[10px] font-bold text-emerald-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Unduh Template Sample
                  </button>
                  {importNotice && <span className="text-[10px] text-emerald-600 font-bold">{importNotice}</span>}
                </div>
              </div>

              {/* Data pasted box */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1">KATA CSV (Paste dari Excel/Sheets Anda)</label>
                <textarea
                  id="import-csv-textarea"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste CSV rows here..."
                  className="w-full h-44 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {importFormatError && (
                <p className="text-xs text-rose-600 font-bold">{importFormatError}</p>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-550"
                >
                  Batal
                </button>
                <button
                  id="execute-csv-import"
                  onClick={handleBulkImportSubmit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Impor ke Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Old Modal - Replaced by full page view */}
      {false && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-900 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                  {editingId 
                    ? (activeSubTab === 'siswa' ? 'Edit Data Siswa/Santri' : 'Edit Data Pengguna') 
                    : (activeSubTab === 'siswa' ? 'Tambah Siswa/Santri Baru' : 'Tambah Pengguna Baru')}
                </h3>
                <p className="text-xs text-slate-400">Sektor: {activeSubTab.toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Photo Simulator */}
              <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <Avatar 
                  namaLengkap={formFields.namaLengkap || 'User'} 
                  fotoProfil={formFields.fotoProfil} 
                  className="w-12 h-12 text-sm font-bold"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Foto Profil Santri / Guru / Admin</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={triggerProfileImageUploadSim}
                      className="text-[10px] text-slate-405 block"
                    />
                    {hasCustomProfilePhoto(formFields.fotoProfil) && (
                      <button
                        type="button"
                        onClick={() => setFormFields(prev => ({ ...prev, fotoProfil: '' }))}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline self-start sm:self-auto cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* NIS only for Student */}
              {activeSubTab === 'siswa' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="form-nis" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Nomor Induk Siswa (NIS) *
                    </label>
                    {formFields.nis && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {parseNisFormat(formFields.nis).patternBadge}
                      </span>
                    )}
                  </div>
                  <input
                    id="form-nis"
                    type="text"
                    required
                    value={formFields.nis}
                    onChange={(e) => setFormFields(prev => ({ ...prev, nis: e.target.value }))}
                    placeholder="Contoh: 202600126-C / 001KS-A / 0012026-A"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                  />

                  {/* Live NIS Diagnostic */}
                  {formFields.nis && (() => {
                    const p = parseNisFormat(formFields.nis);
                    return (
                      <div className="p-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800 rounded-lg text-[10px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200">
                          <span>{p.patternName}</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-300">ID: {p.groupKey}</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          Nama Kelompok: <b>{p.defaultGroupLabel}</b>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Format Presets */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setFormFields(prev => ({ ...prev, nis: '202600126-C' }))}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                    >
                      📌 202600126-C
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFields(prev => ({ ...prev, nis: '001KS-A' }))}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                    >
                      🏷️ 001KS-A
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFields(prev => ({ ...prev, nis: '0012026-A' }))}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer"
                    >
                      📅 0012026-A
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFields(prev => ({ ...prev, nis: '2026001' }))}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer"
                    >
                      🎓 2026001
                    </button>
                  </div>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label htmlFor="form-nama" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap *</label>
                <input
                  id="form-nama"
                  type="text"
                  required
                  value={formFields.namaLengkap}
                  onChange={(e) => setFormFields(prev => ({ ...prev, namaLengkap: e.target.value }))}
                  placeholder="Masukkan nama lengkap..."
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-205 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="form-email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {activeSubTab === 'siswa' ? 'Email (Opsional - Hubungkan ke Google Workspace)' : 'Email Kredensial *'}
                </label>
                <input
                  id="form-email"
                  type="email"
                  required={activeSubTab !== 'siswa'}
                  value={formFields.email}
                  onChange={(e) => setFormFields(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={activeSubTab === 'siswa' ? "Contoh: siswa@halaqah.example (Boleh dikosongkan)" : "Contoh: pengajar@halaqah.example"}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-205 dark:border-slate-800 rounded-lg text-xs disabled:opacity-45 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Sub-inputs based on role */}
              <div className="grid grid-cols-2 gap-3.5">
                {activeSubTab === 'siswa' ? (
                  <>
                    {/* Orang Tua Phone */}
                    <div>
                      <label htmlFor="form-parent-phone" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">HP Wali Murid</label>
                      <input
                        id="form-parent-phone"
                        type="tel"
                        value={formFields.nomorHpOrangTua}
                        onChange={(e) => setFormFields(prev => ({ ...prev, nomorHpOrangTua: e.target.value }))}
                        placeholder="081..."
                        className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {/* Gender */}
                    <div>
                      <label htmlFor="form-siswa-gender" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gender</label>
                      <select
                        id="form-siswa-gender"
                        value={formFields.jenisKelamin}
                        onChange={(e) => setFormFields(prev => ({ ...prev, jenisKelamin: e.target.value as JenisKelamin }))}
                        className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs focus:ring-1"
                      >
                        <option value={JenisKelamin.LAKI_LAKI}>Laki-laki</option>
                        <option value={JenisKelamin.PEREMPUAN}>Perempuan</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* General phone */}
                    <div>
                      <label htmlFor="form-general-phone" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nomor HP / WA</label>
                      <input
                        id="form-general-phone"
                        type="tel"
                        value={formFields.nomorHp}
                        onChange={(e) => setFormFields(prev => ({ ...prev, nomorHp: e.target.value }))}
                        placeholder="081..."
                        className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {/* Gender for Guru */}
                    <div>
                      {activeSubTab === 'guru' ? (
                        <>
                          <label htmlFor="form-guru-gender" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gender</label>
                          <select
                            id="form-guru-gender"
                            value={formFields.jenisKelamin}
                            onChange={(e) => setFormFields(prev => ({ ...prev, jenisKelamin: e.target.value as JenisKelamin }))}
                            className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs focus:ring-1"
                          >
                            <option value={JenisKelamin.LAKI_LAKI}>Laki-laki</option>
                            <option value={JenisKelamin.PEREMPUAN}>Perempuan</option>
                          </select>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Aktif</label>
                          <select
                            value={formFields.status}
                            onChange={(e) => setFormFields(prev => ({ ...prev, status: e.target.value as StatusAktif }))}
                            className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                          >
                            <option value={StatusAktif.AKTIF}>Aktif</option>
                            <option value={StatusAktif.NON_AKTIF}>Nonaktif</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Admin Specific Level & Permission Options */}
              {activeSubTab === 'admin' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Level & Tipe Akun Admin *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${selectedAdminSubRole === 'SUPER_ADMIN' ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800 text-amber-900 dark:text-amber-200' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        <input
                          type="radio"
                          name="adminSubRole"
                          value="SUPER_ADMIN"
                          checked={selectedAdminSubRole === 'SUPER_ADMIN'}
                          onChange={() => {
                            setSelectedAdminSubRole('SUPER_ADMIN');
                            if (!adminJabatan || adminJabatan === 'Staff Pengembangan SDM') {
                              setAdminJabatan('Super Admin Yayasan');
                            }
                          }}
                          className="mt-0.5 accent-amber-600"
                        />
                        <div>
                          <p className="font-extrabold text-xs flex items-center gap-1">
                            🌟 Admin Utama
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Akses penuh tanpa batas ke seluruh menu & sistem.
                          </p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${selectedAdminSubRole === 'SUB_ADMIN' ? 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        <input
                          type="radio"
                          name="adminSubRole"
                          value="SUB_ADMIN"
                          checked={selectedAdminSubRole === 'SUB_ADMIN'}
                          onChange={() => {
                            setSelectedAdminSubRole('SUB_ADMIN');
                            if (!adminJabatan || adminJabatan === 'Super Admin Yayasan') {
                              setAdminJabatan('Staff Divisi Pengembangan SDM');
                            }
                          }}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                          <p className="font-extrabold text-xs flex items-center gap-1">
                            🛡️ Admin Tambahan
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Akses dibatasi sesuai menu yang diizinkan Admin Utama.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="form-admin-jabatan" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Jabatan / Divisi Admin *
                    </label>
                    <input
                      id="form-admin-jabatan"
                      type="text"
                      value={adminJabatan}
                      onChange={(e) => setAdminJabatan(e.target.value)}
                      placeholder="Contoh: Staff Pengembangan SDM, Admin Akademik, dsb."
                      className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {selectedAdminSubRole === 'SUB_ADMIN' && (
                    <div className="space-y-3 bg-slate-50/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <AdminPermissionMatrix
                        selectedPermissions={selectedAdminPermissions}
                        onPermissionsChange={setSelectedAdminPermissions}
                        selectedTabPermissions={selectedAdminTabPermissions}
                        onTabPermissionsChange={setSelectedAdminTabPermissions}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* More Guru details */}
              {activeSubTab === 'guru' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="form-guru-role-name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-bold">Jabatan Pendidik</label>
                      <input
                        id="form-guru-role-name"
                        type="text"
                        value={formFields.jabatan}
                        onChange={(e) => setFormFields(prev => ({ ...prev, jabatan: e.target.value }))}
                        placeholder="Contoh: Pengajar Tahfidz"
                        className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs focus:ring-1"
                      />
                    </div>
                    <div>
                      <label htmlFor="form-guru-halaqat-id" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-bold">Halaqah Bimbingan</label>
                      <select
                        id="form-guru-halaqat-id"
                        value={formFields.halaqahId}
                        onChange={(e) => setFormFields(prev => ({ ...prev, halaqahId: e.target.value }))}
                        className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                      >
                        <option value="">Belum Ditugasi</option>
                        {halaqahs.map(h => (
                          <option key={h.id} value={h.id}>{h.namaHalaqah}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Izin Halaqah Pribadi Toggle */}
                  <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between p-3 bg-indigo-50/70 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                        <div>
                          <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">☑ Izin Halaqah Pribadi</label>
                          <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400">Izinkan guru mengelola halaqah pribadi/mandiri di luar struktur resmi Yayasan</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formFields.izinHalaqahPribadi || false}
                            onChange={(e) => setFormFields(prev => ({ ...prev, izinHalaqahPribadi: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-205 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Lokasi / Tempat Mengajar */}
                    <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Keterangan Lokasi / Tempat Mengajar Guru</span>
                          </label>
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                            Bisa Lebih dari 1 Lokasi
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formFields.keteranganLokasi || (formFields.lokasiMengajar ? formFields.lokasiMengajar.join(', ') : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            const locList = val.split(/[,&]/).map(s => s.trim()).filter(Boolean);
                            setFormFields(prev => ({ ...prev, keteranganLokasi: val, lokasiMengajar: locList }));
                          }}
                          placeholder="e.g. KANTOR PUSAT, MASJID AL-IKHLAS, GEDUNG UTAMA"
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Pisahkan dengan koma jika guru mengajar di beberapa lokasi berbeda. Lokasi ini akan otomatis muncul pada dokumen & laporan presensi guru.
                        </p>
                      </div>
                    </div>
                </div>
              )}

              {/* Struktur Lembaga Affiliate Fields */}
              {((activeSubTab === 'guru') || (activeSubTab === 'siswa' && !isPrivateHalaqahSiswa)) && (
                <div className="border border-slate-150 p-4 rounded-xl space-y-3.5 bg-slate-50/50 mt-4">
                  <span className="text-[9px] font-black text-emerald-700 block uppercase tracking-widest font-mono">
                    Afiliasi Struktur Lembaga & Unit
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Pilih Sekolah */}
                    <div>
                      <label htmlFor="form-org-sekolah" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Sekolah / Lembaga *</label>
                      <select
                        id="form-org-sekolah"
                        required={!isPrivateHalaqahSiswa}
                        value={formFields.sekolahId}
                        onChange={(e) => {
                          const sId = e.target.value;
                          const selectedSch = strukturLembaga.sekolahList.find(s => s.id === sId);
                          setFormFields(prev => ({ 
                            ...prev, 
                            sekolahId: sId,
                            direktoratId: selectedSch?.direktoratId || '',
                            regionalId: selectedSch?.regionalId || '',
                            // Automatically clear/reset jenjang selection for safety
                            jenjangId: ''
                          }));
                        }}
                        className="mt-1 w-full p-2.5 bg-white border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                      >
                        <option value="">-- Pilih Sekolah --</option>
                        {strukturLembaga.sekolahList.map(s => (
                          <option key={s.id} value={s.id}>{s.nama}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pilih Jenjang / Halaqah */}
                    <div>
                      <label htmlFor="form-org-jenjang" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Halaqah Lembaga *</label>
                      <select
                        id="form-org-jenjang"
                        required={!isPrivateHalaqahSiswa}
                        value={formFields.jenjangId}
                        onChange={(e) => setFormFields(prev => ({ ...prev, jenjangId: e.target.value }))}
                        className="mt-1 w-full p-2.5 bg-white border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                      >
                        <option value="">-- Pilih Halaqah Lembaga --</option>
                        {strukturLembaga.jenjangList
                          .filter(j => !formFields.sekolahId || j.sekolahId === formFields.sekolahId)
                          .map(j => (
                            <option key={j.id} value={j.id}>{j.nama}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Non-A Structure Breadcrumb Summary */}
                  {strukturLembaga.selectedStructure !== 'A' && (formFields.direktoratId || formFields.regionalId) && (
                    <div className="flex gap-2 flex-wrap text-[10px] font-mono bg-white p-2 border rounded-lg border-slate-200">
                      {formFields.direktoratId && (
                        <span className="text-amber-850 font-bold bg-amber-50 px-2 py-0.5 rounded">
                          📁 Dir: {strukturLembaga.direktoratList.find(d => d.id === formFields.direktoratId)?.nama || '-'}
                        </span>
                      )}
                      {strukturLembaga.selectedStructure === 'C' && formFields.regionalId && (
                        <span className="text-rose-850 font-bold bg-rose-50 px-2 py-0.5 rounded">
                          🌍 Reg: {strukturLembaga.regionalList.find(r => r.id === formFields.regionalId)?.nama || '-'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Siswa Classes details removed as per user request */}

              {/* Status control for Guru/Siswa */}
              {activeSubTab !== 'admin' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Aktifitas Akun</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields(prev => ({ ...prev, status: e.target.value as StatusAktif }))}
                    className="mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                  >
                    <option value={StatusAktif.AKTIF}>Aktif</option>
                    <option value={StatusAktif.NON_AKTIF}>Nonaktif</option>
                  </select>
                </div>
              )}

              {/* Physical Alamat */}
              {activeSubTab !== 'admin' && (
                <div>
                  <label htmlFor="form-address-area" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alamat Rumah Lengkap</label>
                  <textarea
                    id="form-address-area"
                    value={formFields.alamat}
                    onChange={(e) => setFormFields(prev => ({ ...prev, alamat: e.target.value }))}
                    placeholder="Tulis alamat rumah..."
                    className="mt-1 w-full h-16 p-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 text-xs font-semibold rounded-lg">
                  {formError}
                </div>
              )}

              {/* Form buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-xs text-slate-550"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  id="submit-user-form"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  {editingId ? 'Simpan Perubahan' : 'Buat Akun Baru'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deletion with Smart Demo vs Real Detection */}
      {confirmDelete && (() => {
        const isDemo = isDemoUser(confirmDelete.id);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDemo 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}>
                  {isDemo ? <Info className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                    Konfirmasi Hapus Pengguna
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sektor: <span className="font-bold uppercase">{confirmDelete.role}</span>
                  </p>
                </div>
              </div>

              {!isDemo ? (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 rounded-xl space-y-1.5 text-xs text-rose-800 dark:text-rose-200">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>PERINGATAN: DATA PENGGUNA ASLI LEMBAGA!</span>
                  </div>
                  <p className="leading-relaxed">
                    Anda akan menghapus data guru/santri asli: <strong>{confirmDelete.nama}</strong>. Pastikan Anda tidak salah memilih data asli yang dikira data dummy.
                  </p>
                  <p className="text-[11px] text-rose-600/90 dark:text-rose-400 pt-1 border-t border-rose-200/60 dark:border-rose-900/60">
                    💡 <em>Keamanan Tambahan:</em> Data ini akan otomatis disimpan ke riwayat pemulihan (Trash) dan dapat dipulihkan kapan saja via tombol <strong>Pulihkan Data Terhapus</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/70 rounded-xl space-y-1 text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>DATA SIMULASI / DEMO BAWAAN</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Akun <strong>{confirmDelete.nama}</strong> merupakan data dummy demo bawaan. Menghapus akun ini aman dan tidak akan mempengaruhi data operasional lembaga.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin melanjutkan penghapusan data <strong>{confirmDelete.nama}</strong>?
              </p>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeDeleteUser}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Ya, Hapus Data
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Bersihkan Seluruh Data Demo Bawaan */}
      {isCleanDemoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 space-y-5 my-auto animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">
                    Bersihkan Seluruh Data Demo Bawaan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hapus permanen dummy santri & guru simulasi sekaligus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCleanDemoModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guaranteed Safety Card */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-100">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>JAMINAN KEAMANAN DATA ASLI LEMBAGA:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-emerald-800/90 dark:text-emerald-200 leading-relaxed">
                <li><strong>Akun Admin Utama</strong> ({admins[0]?.namaLengkap || 'Admin Utama'} / {admins[0]?.email || 'admin@sistem.id'}) <strong>100% AMAN</strong> dan tidak akan tersentuh saat pembersihan data demo.</li>
                <li><strong>Data Guru & Santri Asli Lembaga Anda</strong> (seluruh akun guru &amp; santri non-demo milik lembaga) <strong>100% AMAN &amp; Terlindungi</strong>.</li>
                <li>Sistem mengaktifkan proteksi permanen sehingga data dummy ini <strong>TIDAK AKAN muncul kembali</strong> bahkan saat jaringan terputus atau Firebase offline.</li>
              </ul>
            </div>

            {/* List of demo users to be cleaned */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Data simulasi yang akan dibersihkan ({totalDemoCount} data):
              </p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {gurus.filter(g => isDemoUser(g.id)).map(g => (
                  <div key={g.id} className="p-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        Guru Demo
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{g.namaLengkap}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{g.id}</span>
                  </div>
                ))}
                {siswas.filter(s => isDemoUser(s.id)).map(s => (
                  <div key={s.id} className="p-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                        Santri Demo
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{s.namaLengkap}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{s.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isPurgingDemo}
                onClick={() => setIsCleanDemoModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPurgingDemo}
                onClick={handlePurgeAllDemo}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPurgingDemo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sedang Membersihkan...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Ya, Bersihkan Permanen Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat Pengguna Terhapus (Trash & Recovery) */}
      {isTrashModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 space-y-5 my-auto animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300 shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">
                    Riwayat Pengguna Terhapus & Pemulihan Akun
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pulihkan data guru atau santri yang terhapus secara tidak sengaja
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrashModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {deletedUsersTrash.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Data Terhapus
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Semua data pengguna aman. Setiap kali ada data guru atau santri yang dihapus, riwayatnya akan tersimpan di sini sehingga dapat dipulihkan kapan pun dibutuhkan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  💡 Klik tombol <strong>Pulihkan</strong> pada baris data di bawah ini untuk mengembalikan akun guru atau santri secara langsung beserta seluruh informasi profilnya.
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {deletedUsersTrash.map((trashEntry) => (
                    <div 
                      key={trashEntry.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar 
                          namaLengkap={trashEntry.nama} 
                          fotoProfil={trashEntry.data?.fotoProfil} 
                          className="w-10 h-10 text-xs font-bold ring-1 ring-slate-200 dark:ring-slate-800"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                              {trashEntry.nama}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              trashEntry.role === 'guru' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300'
                            }`}>
                              {trashEntry.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>ID: {trashEntry.id}</span>
                            <span>•</span>
                            <span>Dihapus: {new Date(trashEntry.deletedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            restoreFromTrash(trashEntry.id);
                            setPurgeSuccessMessage(`Data ${trashEntry.nama} (${trashEntry.role}) berhasil dipulihkan!`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Kembalikan data ini ke daftar pengguna aktif"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Pulihkan
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentDeleteTrash(trashEntry.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Hapus dari riwayat pemulihan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTrashModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Nama Kelompok Santri */}
      {isEditGroupNameModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 space-y-5 my-auto animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">
                    Ubah Nama Kelompok Santri
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kustomisasi judul dan identitas kelompok NIS <span className="font-mono font-bold text-amber-600">{editingGroupKey}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditGroupNameModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pattern Description & Example Box */}
            <div className="p-3.5 bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-900 dark:to-amber-950/20 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Format Pola Terdeteksi:
                </span>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {editingPatternType === 'pola1' && '📌 Pola 1 (202600126-C)'}
                  {editingPatternType === 'pola2' && '🏷️ Pola 2 (001KS-A / B)'}
                  {editingPatternType === 'pola3' && '📅 Pola 3 (0012026-A)'}
                  {editingPatternType === '4digit' && '🎓 Angkatan (4 Digit)'}
                  {editingPatternType === '6digit' && '🌊 Gelombang (6 Digit)'}
                  {editingPatternType === 'other' && '📝 Format Khusus'}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                {editingPatternType === 'pola1' && (
                  <p>
                    <b>Struktur Pola 1:</b> <span className="font-mono text-indigo-700 dark:text-indigo-300">Tahun + Nomor Urut + 2 Angka Terakhir Tahun - Kode Halaqah</span>
                    <br />Contoh NIS: <code className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{editingExampleNis || '202600126-C'}</code>
                  </p>
                )}
                {editingPatternType === 'pola2' && (
                  <p>
                    <b>Struktur Pola 2:</b> <span className="font-mono text-emerald-700 dark:text-emerald-300">Nomor Urut + Kode Halaqah - Urutan Halaqah</span>
                    <br />Contoh NIS: <code className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{editingExampleNis || '001KS-A dan 001KS-B'}</code>
                  </p>
                )}
                {editingPatternType === 'pola3' && (
                  <p>
                    <b>Struktur Pola 3:</b> <span className="font-mono text-amber-700 dark:text-amber-300">Nomor Urut + Tahun - Kode Halaqah</span>
                    <br />Contoh NIS: <code className="font-bold font-mono text-amber-600 dark:text-amber-400">{editingExampleNis || '0012026-A'}</code>
                  </p>
                )}
                {editingPatternType === '4digit' && (
                  <p>
                    <b>Struktur Angkatan:</b> <span className="font-mono text-blue-700 dark:text-blue-300">4 Digit Tahun Masuk Santri</span>
                    <br />Contoh NIS: <code className="font-bold font-mono text-blue-600 dark:text-blue-400">2026001</code>
                  </p>
                )}
              </div>

              <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Nama Bawaan Sistem:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{defaultGroupLabel}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGroupName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama / Judul Kelompok <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inputGroupLabel}
                  onChange={(e) => setInputGroupLabel(e.target.value)}
                  placeholder={`Misal: ${defaultGroupLabel} - Generasi Qur'ani`}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nama ini akan muncul pada kartu judul tabel dan dropdown filter.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Keterangan / Sub-Label
                </label>
                <input
                  type="text"
                  value={inputGroupSubLabel}
                  onChange={(e) => setInputGroupSubLabel(e.target.value)}
                  placeholder={`Misal: ${defaultGroupSubLabel || 'Santri TP 2026/2027'}`}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Badge kecil di sebelah judul kelompok.
                </p>
              </div>

              {/* Quick Preset Buttons tailored for the pattern */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Saran Nama Cepat (Klik untuk memilih):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(editingPatternType === 'pola1' ? [
                    `${defaultGroupLabel} (Pola 202600126-C)`,
                    `Kelompok Halaqah Qur'ani ${editingGroupKey}`,
                    `Halaqah Intensif TP 2026`,
                    `Santri Angkatan 2026 Halaqah ${editingGroupKey}`,
                    `Tahfidz Unggulan ${editingGroupKey}`
                  ] : editingPatternType === 'pola2' ? [
                    `${defaultGroupLabel} (Pola 001KS-A)`,
                    `Kelompok Belajar Khusus ${editingGroupKey}`,
                    `Halaqah ${editingGroupKey} (Reguler)`,
                    `Santri Halaqah ${editingGroupKey}`,
                    `Program Muraja'ah ${editingGroupKey}`
                  ] : editingPatternType === 'pola3' ? [
                    `${defaultGroupLabel} (Pola 0012026-A)`,
                    `Kelompok Tahsin TP 2026`,
                    `Halaqah Santri ${editingGroupKey}`,
                    `Angkatan 2026 - Halaqah Khusus`
                  ] : [
                    `Angkatan ${editingGroupKey} (Reguler)`,
                    `Santri Baru ${editingGroupKey}`,
                    `Program Tahfidz ${editingGroupKey}`,
                    `Gelombang ${editingGroupKey}`,
                    `Kelas Intensif ${editingGroupKey}`
                  ]).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputGroupLabel(preset)}
                      className="px-2 py-1 bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium transition cursor-pointer border border-slate-200/60 dark:border-slate-700"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-slate-100/70 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pratinjau Tampilan Judul Tabel:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">
                    {inputGroupLabel.trim() || defaultGroupLabel}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    🏷️ Kustom
                  </span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {inputGroupSubLabel.trim() || defaultGroupSubLabel}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
                <div>
                  {customNisGroupNames[editingGroupKey] && (
                    <button
                      type="button"
                      onClick={handleResetGroupName}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset ke Standar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditGroupNameModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Simpan Nama Kelompok
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Detail Hak Akses Admin Tambahan */}
      {viewingAdminPermissionsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar namaLengkap={viewingAdminPermissionsModal.namaLengkap} fotoProfil={viewingAdminPermissionsModal.fotoProfil} className="w-9 h-9 font-bold text-xs" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{viewingAdminPermissionsModal.namaLengkap}</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{viewingAdminPermissionsModal.jabatan || 'Admin Tambahan'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAdminPermissionsModal(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const cleanPerms = normalizeAdminPermissions(viewingAdminPermissionsModal.permissions);
              const cleanTabPerms = normalizeAdminTabPermissions(
                cleanPerms,
                viewingAdminPermissionsModal.adminTabPermissions,
                viewingAdminPermissionsModal.permissions
              );
              const activeMenus = getConfigurableAdminMenus().filter(p => cleanPerms.includes(p.key));

              return (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                    Daftar Menu yang Diizinkan ({activeMenus.length} Menu):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {activeMenus.map(p => {
                      const userTabPerms = cleanTabPerms[p.key] || [];
                      const hasTabs = Boolean(p.tabs && p.tabs.length > 0);
                      const activeTabs = p.tabs?.filter(t => userTabPerms.includes(t.id)) || [];

                      return (
                        <div key={p.key} className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/80 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">{p.label}</p>
                            {hasTabs && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                {activeTabs.length}/{p.tabs!.length} Tab
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{p.desc}</p>
                          {hasTabs && (
                            <div className="pt-1.5 border-t border-emerald-200/50 dark:border-emerald-900/50 flex flex-wrap gap-1">
                              {p.tabs!.map(tab => {
                                const isAllowed = userTabPerms.includes(tab.id);
                                return (
                                  <span
                                    key={tab.id}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                      isAllowed
                                        ? 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 font-bold'
                                        : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 line-through opacity-60'
                                    }`}
                                  >
                                    {tab.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {activeMenus.length === 0 && (
                      <p className="text-xs text-slate-400 italic col-span-2 py-4 text-center">
                        Belum ada menu khusus yang diizinkan untuk akun ini.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 text-right border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingAdminPermissionsModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Panduan & Standarisasi Format NIS */}
      {isNisGuideModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Panduan Format NIS & Solusi Fleksibel</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Strategi pengelolaan santri per angkatan dengan variasi format NIS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNisGuideModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[65vh] overflow-y-auto pr-1">
              {/* Box Info Solusi Cerdas */}
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  Mengapa Pengelompokan Fleksibel Ini Dibuat?
                </div>
                <p className="text-[11.5px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                  Saat ini lembaga masih mencari format NIS yang paling ideal, sehingga format NIS antar-halaqah masih bervariasi. Sistem cerdas ini mengekstrak tahun masuk secara otomatis dari string NIS ataupun tanggal registrasi santri, sehingga seluruh santri tetap terkelompok rapi per angkatan tanpa terpecah.
                </p>
              </div>

              {/* 3 Pola NIS yang Dikenali */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                  Pola Format NIS yang Dikenali Sistem:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* Pola 1 */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-indigo-200/70 dark:border-indigo-900/60 space-y-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                      Pola 1
                    </span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs">
                      202600126-C
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Tahun (2026) + No.Urut (001) + Akhiran (26) - Kode Halaqah (C).
                    </p>
                  </div>

                  {/* Pola 2 */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-emerald-200/70 dark:border-emerald-900/60 space-y-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      Pola 2
                    </span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs">
                      001KS-A / 001KS-B
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      No.Urut (001) + Kode Lembaga (KS) - Sub-Halaqah (A / B).
                    </p>
                  </div>

                  {/* Pola 3 */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-amber-200/70 dark:border-amber-900/60 space-y-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                      Pola 3
                    </span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs">
                      0012026-A
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      No.Urut (001) + Tahun (2026) - Kode Halaqah (A).
                    </p>
                  </div>
                </div>
              </div>

              {/* Rekomendasi Format Masa Depan */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Rekomendasi Standarisasi Masa Depan (Bila Ingin Diseragamkan):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">Opsi A: Format Terpadu Halaqah</span>
                    <code className="font-mono font-bold text-slate-800 dark:text-slate-100">YYYYNNN-KODE</code> (Contoh: <code className="font-mono text-emerald-600">2026001-A</code>)
                    <p className="text-[10px] text-slate-400 mt-1">Sederhana, memuat tahun masuk, urut pendaftaran, dan penempatan halaqah.</p>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">Opsi B: Format Nomor Induk Murni</span>
                    <code className="font-mono font-bold text-slate-800 dark:text-slate-100">YYYYNNNN</code> (Contoh: <code className="font-mono text-indigo-600">20260001</code>)
                    <p className="text-[10px] text-slate-400 mt-1">NIS permanen seumur hidup santri, halaqah dapat berpindah tanpa merubah NIS.</p>
                  </div>
                </div>
              </div>

              {/* Fitur Kustomisasi Nama Kelompok */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 rounded-xl space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1">
                  ✏️ Kustomisasi Nama Kelompok:
                </span>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                  Admin dapat mengklik tombol <b>"Ubah Nama Kelompok"</b> pada masing-masing kartu tabel santri untuk memberi penamaan khusus yang disukai (misal: <i>"Angkatan 2026 - Ikhwan Reguler"</i>).
                </p>
              </div>
            </div>

            <div className="pt-2 text-right border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNisGuideModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
