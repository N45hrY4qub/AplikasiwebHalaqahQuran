/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { InstitutionThemeSettings, UserColorThemePreference } from './utils/themeColorEngine';
export type { InstitutionThemeSettings, UserColorThemePreference };

export enum UserRole {
  ADMIN = 'Admin',
  GURU = 'Guru',
  SISWA = 'Siswa',
}

export enum JenisKelamin {
  LAKI_LAKI = 'Laki-laki',
  PEREMPUAN = 'Perempuan',
}

export enum StatusAktif {
  AKTIF = 'Aktif',
  NON_AKTIF = 'Nonaktif',
}

export enum TingkatJenjang {
  SD = 'SD/MI',
  SMP = 'SMP/MTs',
  SMA = 'SMA/MA',
  UMUM = 'Umum',
}

export enum JenisSetoran {
  TILAWAH = 'Tilawah',
  TAHFIDZ = 'Tahfidz',
  QIROAH = 'Qiroah',
}

export type KategoriKesalahanTipe = 'lahn_jaliy' | 'lahn_khafiy' | 'dasar' | 'tajwid' | string;

export interface KlasifikasiKesalahanType {
  id: string;
  nama: string;
  labelSingkat?: string;
  deskripsi?: string;
  warna?: 'rose' | 'amber' | 'emerald' | 'blue' | 'indigo' | 'purple' | 'cyan' | 'slate' | string;
  icon?: string;
  isDefault?: boolean;
}

export interface KategoriKesalahanPageRule {
  id: string;
  jilidAwal?: number;
  jilidAkhir?: number;
  startPage: number;
  endPage: number;
  tipeKesalahan: 'lahn_jaliy' | 'lahn_khafiy' | 'dasar' | 'tajwid' | 'all' | 'none';
  keterangan?: string;
}

export interface CustomPageLine {
  page: number;
  lines: number;
  jilid?: number; // optional jilid/volume for multi-jilid modules (1-based index)
}

export interface QuranLinesConfig {
  defaultLinesPerPage: number;
  customPageLines: CustomPageLine[];
}

export type ElemenTargetScope = 'all' | 'foundation' | 'private' | 'custom';

export interface ElemenSetting {
  id: string; // e.g. 'tilawah', 'tahfidz', 'qiroah'
  nama: string; // e.g. 'Tilawah', 'Tahfidz', 'Qiroah'
  tipeModul: TipeModul;
  jenisSetoranList: string[]; // e.g. ['Baru', 'Murojaah', 'Ziyadah']
  kompetensi?: string; // e.g., 'Hafalan' or 'Bacaan'
  referensiModulId?: string; // Links to a specific non-Al-Quran module (Modul)
  useJumlahBaris?: boolean;
  tipeKesalahan?: 'lahn_jaliy' | 'lahn_khafiy' | 'tajwid' | 'dasar' | 'all' | 'none' | 'page_based';
  usePageRules?: boolean;
  pageRules?: KategoriKesalahanPageRule[];
  useRubrikPenilaian?: boolean;
  useMasterPenalties?: boolean;
  baseScore?: number;
  rumusPenilaian?: 'absolut' | 'proporsional_baris';
  rubrikDeductions?: Record<string, number>;
  oncePerSessionCategories?: string[];
  rubrikPredikat?: Array<{ minScore: number; maxScore: number; predikat: string; lulus: boolean }>;
  
  // Pengecualian Bobot & Parameter Penilaian per Elemen (Custom Overrides)
  bobotKlasifikasi?: Record<string, number>;
  bobotLahnJaliy?: number;
  bobotLahnKhafiy?: number;
  standarBarisQuran?: number;
  minBarisQuran?: number;
  maxBarisQuran?: number;

  // Custom line count override per element (inherited from Modul by default)
  useCustomLinesConfig?: boolean;
  defaultLinesPerPage?: number;
  customPageLines?: CustomPageLine[];

  // Target Halaqah Scope
  targetScope?: ElemenTargetScope; // 'all' (default), 'foundation', 'private', 'custom'
  targetHalaqahIds?: string[]; // IDs of specific halaqahs when targetScope === 'custom'

  // Perjenjangan & Prasyarat Elemen (Hierarki & Sekuensial vs Paralel)
  isBerjenjang?: boolean; // false = Bebas / Paralel (bisa bersamaan), true = Berjenjang (butuh prasyarat)
  jenjangLevel?: number; // nomor urut jenjang (1, 2, 3...)
  prerequisiteElemenIds?: string[]; // ID elemen yang harus diselesaikan terlebih dahulu
  syaratBuka?: 'tuntas_target' | 'minimal_setoran' | 'manual_guru' | 'lulus_prasyarat' | 'ada_setoran'; // kriteria otomatis terbuka
  minimalSetoranLulus?: number; // jika syaratBuka === 'minimal_setoran'
  allowTeacherOverride?: boolean; // apakah guru pembimbing diizinkan memberikan dispensasi/akselerasi langsung
  deskripsiJenjang?: string; // keterangan/panduan jenjang

  // Target Tuntas Elemen & Cakupan Modul Pembelajaran
  targetDurasiBulan?: number; // Target durasi tuntas dalam satuan bulan (misal: 3 bulan)
  targetCakupanMateri?: 'semua' | 'surah_pilihan' | 'juz_range' | 'halaman_range'; // Tipe cakupan materi modul
  targetSurahList?: number[]; // Daftar nomor surah pilihan (misal: [1, 114, 113, 112, 111, 110, 109, 108])
  targetJuzStart?: number; // Juz awal (misal: 30)
  targetJuzEnd?: number; // Juz akhir
  targetHalamanStart?: number; // Halaman awal untuk modul buku/selain Al-Quran
  targetHalamanEnd?: number; // Halaman akhir
  targetCatatanMateri?: string; // Catatan panduan materi kurikulum elemen
}

export enum TipeTahfidz {
  BARU = 'Hafalan Baru',
  MUROJAAH = 'Murojaah',
  SAMBUNG_AYAT = 'Sambung Ayat',
  TASMI = 'Tasmi\'',
  LAINNYA = 'Lainnya',
}

export interface TajwidSubcategory {
  id: string;
  nama: string;
}

export interface TajwidCategory {
  id: string;
  nama: string;
  deskripsi?: string;
  subcategories?: TajwidSubcategory[];
  tipe?: KategoriKesalahanTipe;
  urutan?: number;
}

export interface CapaianBacaanTargetItem {
  id: string;
  unsur: string; // e.g. "س (sin)", "ل (lam)", "ب (ba)", "ح (ha)", "ع ('ain)"
  target: string; // e.g. "Tidak memantulkan huruf sin (س) sukun dan mengalirkan sifat hams & shafir."
  kategoriKesalahanId?: string;
  kategoriKesalahanNama?: string; // e.g. "Sifat Huruf"
  subKategoriKesalahanNama?: string; // e.g. "Memantulkan huruf"
  kataLafaz?: string; // Target lafaz perkata, misal: "بِسْمِ", "الْحَمْدُ"
  kataUrut?: number; // Urutan kata dalam ayat (1-indexed)
}

export interface CapaianBacaanAyatConfig {
  id: string;
  suratNomor: number;
  suratNama: string;
  nomorAyat: number;
  teksArab: string;
  targets: CapaianBacaanTargetItem[];
  keterangan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CapaianBacaanSesiPertemuan {
  id: string;
  siswaId: string;
  suratNomor: number;
  nomorAyat: number;
  sesiKe: number; // 1, 2, 3...
  namaSesi: string; // e.g. "P1", "P1 (Talaqqi Awal)", "P2 (Koreksi Lam Sukun)"
  tanggal: string;
  guruId: string;
  guruNama: string;
  halaqahId?: string;
  catatanTarget: Record<string, boolean>; // targetId -> true jika ada catatan kesalahan
  catatanTambahan?: string;
  createdAt?: string;
  elemenId?: string; // ID Elemen Pembelajaran dari Konfigurasi Elemen & jenis setoran
  elemenNama?: string; // Nama Elemen Pembelajaran (misal: 'Qiraah Tambahan', 'Tilawah')
}

export interface CapaianBacaanTrialSettings {
  enabledGuruIds: string[];
  enabledElemenIds?: string[]; // Elemen pembelajaran yang ditentukan admin untuk instrumen capaian bacaan ayat
  enabledElemenNames?: string[]; // Nama elemen pembelajaran yang ditentukan admin (misal 'Qiraah Surah Wajib')
  selectedElemenItems?: Array<{ id: string; nama: string }>;
  presetLoaded?: boolean;
}

export interface UserPasskey {
  credentialId: string;
  publicKey: string;
  deviceName: string;
  createdAt: string;
  biometricType?: 'fingerprint' | 'face';
}

export type AdminSubRole = 'SUPER_ADMIN' | 'SUB_ADMIN';

export type AdminPermissionKey = 
  | 'dashboard'
  | 'pengguna'
  | 'struktur_lembaga'
  | 'kelashalaqah'
  | 'kurikulum_modul'
  | 'manajemen_syahadah'
  | 'program_keilmuan'
  | 'setorans'
  | 'pengumuman'
  | 'system'
  // Legacy keys for backward compatibility
  | 'admins'
  | 'gurus'
  | 'siswas'
  | 'matapelajaran_elemen'
  | 'manajemen_assessment'
  | 'administrasi_guru'
  | 'moduls'
  | 'guru_halaqah_pribadi'
  | 'profile';

export interface AdminSubTabDef {
  id: string;
  label: string;
  desc?: string;
}

export interface AdminMenuPermissionDef {
  key: AdminPermissionKey;
  label: string;
  group: string;
  desc: string;
  tabs?: AdminSubTabDef[];
}

export const ALL_ADMIN_PERMISSIONS: AdminMenuPermissionDef[] = [
  { 
    key: 'dashboard', 
    label: 'Beranda', 
    group: 'Monitoring', 
    desc: 'Melihat ringkasan statistik, grafik perkembangan & presensi SDM' 
  },
  { 
    key: 'pengguna', 
    label: 'Pengguna', 
    group: 'SDM & Akun', 
    desc: 'Manajemen akun Admin, Guru & Ustadz, serta Santri & Siswa',
    tabs: [
      { id: 'admin', label: 'Admin & Pengelola', desc: 'Akses data & pengaturan akun pengelola/admin' },
      { id: 'guru', label: 'Guru & Ustadz', desc: 'Melihat & mengelola profil guru & ustadz pengajar' },
      { id: 'siswa', label: 'Santri & Siswa', desc: 'Melihat & mengelola data santri & NIS' }
    ]
  },
  { 
    key: 'struktur_lembaga', 
    label: 'Lembaga', 
    group: 'Organisasi', 
    desc: 'Identitas yayasan, divisi dakwah, unit bimbingan & bagan organisasi',
    tabs: [
      { id: 'profil', label: 'Identitas Lembaga', desc: 'Identitas, divisi, kontak, dan logo yayasan' },
      { id: 'unit', label: 'Unit & Halaqah', desc: 'Satuan unit bimbingan & halaqah binaan' },
      { id: 'visual', label: 'Bagan Organisasi', desc: 'Visualisasi hierarki struktur lembaga' }
    ]
  },
  { 
    key: 'kelashalaqah', 
    label: 'Halaqah', 
    group: 'Akademik', 
    desc: 'Pusat pengelolaan halaqah lembaga, presensi & jadwal guru',
    tabs: [
      { id: 'lembaga', label: 'Halaqah Lembaga', desc: 'Grup halaqah santri resmi naungan lembaga' },
      { id: 'presensi', label: 'Kehadiran & Presensi Guru', desc: 'Pencatatan & rekap kehadiran guru mengajar' },
      { id: 'jadwal', label: 'Jadwal Mengajar Guru', desc: 'Penjadwalan hari & jam bimbingan halaqah' }
    ]
  },
  { 
    key: 'kurikulum_modul', 
    label: 'Kurikulum & Modul', 
    group: 'Kurikulum', 
    desc: 'Pengaturan mata pelajaran, modul kurikulum, administrasi guru & bank assessment',
    tabs: [
      { id: 'matapelajaran', label: 'Mata Pelajaran & Elemen', desc: 'Mata pelajaran dan capaian kurikulum' },
      { id: 'modul', label: 'Modul Pembelajaran', desc: 'Jilid, modul, materi & buku panduan' },
      { id: 'administrasi', label: 'Administrasi Guru (CP, TP, RPP)', desc: 'Capaian pembelajaran, TP & modul RPP guru' },
      { id: 'assessment', label: 'Bank Assessment', desc: 'Instrumen evaluasi dan ujian terpadu' }
    ]
  },
  { 
    key: 'manajemen_syahadah', 
    label: 'Syahadah', 
    group: 'Akademik', 
    desc: 'Penerbitan ijazah/syahadah, verifikasi sertifikat & template aturan',
    tabs: [
      { id: 'penerbitan', label: 'Penerbitan & Persetujuan', desc: 'Penerbitan dan pengesahan syahadah santri' },
      { id: 'aturan', label: 'Aturan Syahadah', desc: 'Konfigurasi aturan kelulusan & template syahadah' }
    ]
  },
  { 
    key: 'program_keilmuan', 
    label: 'Program Keilmuan', 
    group: 'Akademik', 
    desc: 'Kurikulum diklat keilmuan bersanad, bab materi & evaluasi kognitif' 
  },
  { 
    key: 'setorans', 
    label: 'Mutabaah', 
    group: 'Akademik', 
    desc: 'Monitoring jurnal riwayat setoran hafalan santri & konfigurasi penilaian',
    tabs: [
      { id: 'riwayat', label: 'Laporan & Riwayat Setoran', desc: 'Catatan mutabaah & jurnal setoran santri' },
      { id: 'presensi_santri', label: 'Kehadiran Santri', desc: 'Rekap kehadiran santri, status sakit/izin/alpa & grafik bulanan' },
      { id: 'progres', label: 'Rekapitulasi Capaian', desc: 'Monitoring progres santri dari halaqah yang ditetapkan target & progres' },
      { id: 'pengaturan', label: 'Konfigurasi Elemen & Jenis Setoran', desc: 'Setting kriteria penilaian, elemen & target hafalan' },
      { id: 'tajwid', label: 'Kategori Kesalahan', desc: 'Master hukum tajwid & jenis kesalahan' },
      { id: 'capaian_bacaan', label: 'Capaian Bacaan Ayat', desc: 'Instrumen capaian talaqqi santri per ayat & lafaz' }
    ]
  },
  { 
    key: 'pengumuman', 
    label: 'Pengumuman', 
    group: 'Komunikasi', 
    desc: 'Mengelola siaran pengumuman & informasi untuk guru dan santri' 
  },
  { 
    key: 'system', 
    label: 'Pengaturan', 
    group: 'Sistem (Super Admin)', 
    desc: 'Melihat log audit, backup database & pengaturan sistem (Hanya Admin Utama)' 
  }
];

export const ADMIN_MENU_ORDER: AdminPermissionKey[] = ALL_ADMIN_PERMISSIONS.map(m => m.key);

export function getConfigurableAdminMenus(): AdminMenuPermissionDef[] {
  return ALL_ADMIN_PERMISSIONS.filter(m => m.key !== 'system');
}

export function getAdminMenuDef(menuKey: string): AdminMenuPermissionDef | undefined {
  return ALL_ADMIN_PERMISSIONS.find(m => m.key === menuKey);
}

export function getAdminMenuLabel(menuKey: string, fallback = ''): string {
  return getAdminMenuDef(menuKey)?.label || fallback;
}

export function getAdminMenuTabs(menuKey: string): AdminSubTabDef[] {
  return getAdminMenuDef(menuKey)?.tabs || [];
}

export function getAdminTabLabel(menuKey: string, tabId: string, fallback = ''): string {
  const tab = getAdminMenuTabs(menuKey).find(t => t.id === tabId);
  return tab?.label || fallback;
}

export function normalizeAdminPermissions(rawPerms?: AdminPermissionKey[]): AdminPermissionKey[] {
  const configurableMenus = getConfigurableAdminMenus();
  const validKeys = new Set<string>(configurableMenus.map(m => m.key));
  const normalizedSet = new Set<AdminPermissionKey>();

  (rawPerms || []).forEach(key => {
    if (validKeys.has(key)) {
      normalizedSet.add(key);
      return;
    }
    // Map legacy keys cleanly to current unified menus
    if (key === 'gurus' || key === 'siswas') {
      normalizedSet.add('pengguna');
    } else if (
      key === 'matapelajaran_elemen' ||
      key === 'moduls' ||
      key === 'administrasi_guru' ||
      key === 'manajemen_assessment'
    ) {
      normalizedSet.add('kurikulum_modul');
    }
  });

  // Return in canonical registry order
  return configurableMenus
    .map(m => m.key)
    .filter(k => normalizedSet.has(k));
}

export function normalizeAdminTabPermissions(
  normalizedPerms: AdminPermissionKey[],
  rawTabPerms?: Record<string, string[]>,
  rawOriginalPerms?: AdminPermissionKey[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const permSet = new Set(normalizedPerms);
  const origSet = new Set(rawOriginalPerms || normalizedPerms);

  getConfigurableAdminMenus().forEach(menu => {
    if (!permSet.has(menu.key) || !menu.tabs || menu.tabs.length === 0) return;
    const validTabIds = menu.tabs.map(t => t.id);
    const validTabSet = new Set(validTabIds);
    const explicitTabs = rawTabPerms?.[menu.key];

    if (Array.isArray(explicitTabs)) {
      const cleaned = new Set<string>();
      explicitTabs.forEach(tabId => {
        if (menu.key === 'struktur_lembaga' && tabId === 'wizard') {
          if (validTabSet.has('profil')) cleaned.add('profil');
          if (validTabSet.has('unit')) cleaned.add('unit');
        } else if (validTabSet.has(tabId)) {
          cleaned.add(tabId);
        }
      });
      result[menu.key] = validTabIds.filter(id => cleaned.has(id));
      return;
    }

    // Legacy inference if adminTabPermissions didn't have explicit entry for this menu
    if (menu.key === 'pengguna' && rawOriginalPerms && !origSet.has('pengguna')) {
      const inferred: string[] = [];
      if (origSet.has('admins') && validTabSet.has('admin')) inferred.push('admin');
      if (origSet.has('gurus') && validTabSet.has('guru')) inferred.push('guru');
      if (origSet.has('siswas') && validTabSet.has('siswa')) inferred.push('siswa');
      result[menu.key] = inferred;
      return;
    }

    if (menu.key === 'kurikulum_modul' && rawOriginalPerms && !origSet.has('kurikulum_modul')) {
      const inferred: string[] = [];
      if (origSet.has('matapelajaran_elemen') && validTabSet.has('matapelajaran')) inferred.push('matapelajaran');
      if (origSet.has('moduls') && validTabSet.has('modul')) inferred.push('modul');
      if (origSet.has('administrasi_guru') && validTabSet.has('administrasi')) inferred.push('administrasi');
      if (origSet.has('manajemen_assessment') && validTabSet.has('assessment')) inferred.push('assessment');
      result[menu.key] = inferred;
      return;
    }

    // Default when permitted without explicit sub-tab restriction: all live tabs are accessible
    result[menu.key] = [...validTabIds];
  });

  return result;
}

export function createDefaultSubAdminAccess(): {
  permissions: AdminPermissionKey[];
  adminTabPermissions: Record<string, string[]>;
} {
  const defaultCandidates: AdminPermissionKey[] = ['dashboard', 'pengguna', 'kelashalaqah', 'setorans'];
  const configurable = getConfigurableAdminMenus();
  const permissions = configurable
    .map(m => m.key)
    .filter(k => defaultCandidates.includes(k));

  const adminTabPermissions: Record<string, string[]> = {};
  configurable.forEach(menu => {
    if (!permissions.includes(menu.key) || !menu.tabs || menu.tabs.length === 0) return;
    if (menu.key === 'setorans') {
      const starterIds = ['riwayat', 'pengaturan', 'tajwid'];
      const filtered = menu.tabs.map(t => t.id).filter(id => starterIds.includes(id));
      adminTabPermissions[menu.key] = filtered.length > 0 ? filtered : [menu.tabs[0].id];
    } else {
      adminTabPermissions[menu.key] = menu.tabs.map(t => t.id);
    }
  });

  return { permissions, adminTabPermissions };
}

export function isAdminUtama(user?: { id?: string; role?: string; adminRole?: AdminSubRole } | null): boolean {
  if (!user) return false;
  if (user.role && user.role !== UserRole.ADMIN) return false;
  if (user.id === 'adm-1') return true;
  return user.adminRole === 'SUPER_ADMIN';
}

export function getGuruLokasiText(guru?: { lokasiMengajar?: string[]; keteranganLokasi?: string } | null, defaultLoc: string = 'KANTOR PUSAT'): string {
  if (!guru) return defaultLoc;
  if (guru.keteranganLokasi && guru.keteranganLokasi.trim()) {
    return guru.keteranganLokasi.trim();
  }
  if (guru.lokasiMengajar && guru.lokasiMengajar.length > 0) {
    return guru.lokasiMengajar.filter(Boolean).join(' & ');
  }
  return defaultLoc;
}

export function isPrivateHalaqah(halaqah?: Halaqah | null | { id?: string; sourceType?: string; namaHalaqah?: string }): boolean {
  if (!halaqah) return false;
  try {
    if (halaqah.sourceType === 'private_halaqah') return true;
    const hId = String(halaqah.id || '').toLowerCase();
    if (hId && (hId.includes('pribadi') || hId.startsWith('hlq-prv') || hId.startsWith('ph-'))) return true;
    const hNama = String(halaqah.namaHalaqah || '').toLowerCase();
    if (hNama && hNama.includes('pribadi')) return true;
  } catch {
    return false;
  }
  return false;
}

export function isElemenAvailableForHalaqah(
  elemen: ElemenSetting,
  halaqah?: Halaqah | null | { id?: string; sourceType?: string; namaHalaqah?: string }
): boolean {
  const scope = elemen.targetScope || 'all';
  if (scope === 'all') return true;
  if (!halaqah) return true; // If no specific halaqah context, show all

  const isPrivate = isPrivateHalaqah(halaqah);

  if (scope === 'foundation') {
    return !isPrivate;
  }

  if (scope === 'private') {
    return isPrivate;
  }

  if (scope === 'custom') {
    if (!elemen.targetHalaqahIds || elemen.targetHalaqahIds.length === 0) return true;
    return !!halaqah.id && elemen.targetHalaqahIds.includes(halaqah.id);
  }

  return true;
}

export function isPrivateSiswa(siswa?: Siswa | null, allHalaqahs?: Halaqah[]): boolean {
  if (!siswa) return false;
  if (siswa.sourceType === 'private_halaqah' || siswa.isSiswaMandiri) return true;
  if (siswa.id && (siswa.id.toLowerCase().includes('pribadi') || siswa.id.startsWith('sis-prv') || siswa.id.startsWith('sp-'))) return true;
  if (siswa.halaqahId && allHalaqahs) {
    const h = allHalaqahs.find(item => item.id === siswa.halaqahId);
    if (h && (h.sourceType === 'private_halaqah' || (h.namaHalaqah && h.namaHalaqah.toLowerCase().includes('pribadi')))) return true;
  }
  return false;
}

export function isPrivateSetoran(setoran?: Setoran | null, allHalaqahs?: Halaqah[], allSiswas?: Siswa[]): boolean {
  if (!setoran) return false;
  if (setoran.sourceType === 'private_halaqah') return true;
  
  if (setoran.halaqahId && allHalaqahs) {
    const h = allHalaqahs.find(item => item.id === setoran.halaqahId);
    if (h && (h.sourceType === 'private_halaqah' || (h.namaHalaqah && h.namaHalaqah.toLowerCase().includes('pribadi')))) return true;
  }

  if (setoran.siswaId && allSiswas) {
    const st = allSiswas.find(item => item.id === setoran.siswaId);
    if (st && isPrivateSiswa(st, allHalaqahs)) return true;
  }

  if (setoran.halaqahNama && setoran.halaqahNama.toLowerCase().includes('pribadi')) return true;
  if (setoran.halaqahId && (setoran.halaqahId.toLowerCase().includes('pribadi') || setoran.halaqahId.startsWith('hlq-prv') || setoran.halaqahId.startsWith('ph-'))) return true;
  if (setoran.siswaId && (setoran.siswaId.toLowerCase().includes('pribadi') || setoran.siswaId.startsWith('sis-prv') || setoran.siswaId.startsWith('sp-'))) return true;
  if (setoran.id && (setoran.id.toLowerCase().includes('pribadi') || setoran.id.startsWith('set-prv'))) return true;

  return false;
}

export function hasAdminPermission(
  user: { id?: string; role?: string; adminRole?: AdminSubRole; permissions?: AdminPermissionKey[] } | null | undefined, 
  permKey: string
): boolean {
  if (!user) return false;
  // If role is explicitly provided and not ADMIN, return false
  if (user.role && user.role !== UserRole.ADMIN) return false;
  
  if (isAdminUtama(user)) return true;

  // For Sub-Admin (Admin Tambahan):
  const userPerms = user.permissions || ['dashboard', 'gurus', 'siswas', 'setorans', 'profile'];
  if (permKey === 'admins' || permKey === 'system') return false;
  if (permKey === 'profile') return true;

  if (permKey === 'pengguna') {
    return userPerms.some(p => p === 'admins' || p === 'gurus' || p === 'siswas' || p === 'pengguna');
  }

  if (permKey === 'kurikulum_modul') {
    return userPerms.some(p => p === 'matapelajaran_elemen' || p === 'moduls' || p === 'administrasi_guru' || p === 'manajemen_assessment' || p === 'kurikulum_modul');
  }

  if (permKey === 'kelashalaqah') {
    return userPerms.some(p => p === 'kelashalaqah');
  }

  // Legacy mappings:
  if (permKey === 'gurus' || permKey === 'siswas') {
    return userPerms.includes(permKey as any) || userPerms.includes('pengguna');
  }

  return userPerms.includes(permKey as AdminPermissionKey);
}

export function hasAdminTabPermission(
  user: { 
    id?: string; 
    role?: string; 
    adminRole?: AdminSubRole; 
    permissions?: AdminPermissionKey[];
    adminTabPermissions?: Record<string, string[]>;
  } | null | undefined,
  menuKey: string,
  tabId: string
): boolean {
  if (!user) return false;
  if (user.role && user.role !== UserRole.ADMIN) return false;
  if (isAdminUtama(user)) return true;

  // First check if user has access to the parent menu
  if (!hasAdminPermission(user, menuKey)) return false;

  // If specific sub-tabs are configured for this menu:
  const menuTabPerms = user.adminTabPermissions?.[menuKey];
  if (menuTabPerms && Array.isArray(menuTabPerms)) {
    if (menuKey === 'struktur_lembaga') {
      if (tabId === 'profil' || tabId === 'unit') {
        return menuTabPerms.includes(tabId) || menuTabPerms.includes('wizard');
      }
    }
    return menuTabPerms.includes(tabId);
  }

  // Legacy fallback if adminTabPermissions is not yet set:
  if (menuKey === 'pengguna') {
    if (tabId === 'admin') return (user.permissions || []).includes('admins');
    if (tabId === 'guru') return (user.permissions || []).includes('gurus') || (user.permissions || []).includes('pengguna');
    if (tabId === 'siswa') return (user.permissions || []).includes('siswas') || (user.permissions || []).includes('pengguna');
  }
  if (menuKey === 'kurikulum_modul') {
    if (tabId === 'matapelajaran') return (user.permissions || []).includes('matapelajaran_elemen') || (user.permissions || []).includes('kurikulum_modul');
    if (tabId === 'modul') return (user.permissions || []).includes('moduls') || (user.permissions || []).includes('kurikulum_modul');
    if (tabId === 'administrasi') return (user.permissions || []).includes('administrasi_guru') || (user.permissions || []).includes('kurikulum_modul');
    if (tabId === 'assessment') return (user.permissions || []).includes('manajemen_assessment') || (user.permissions || []).includes('kurikulum_modul');
  }

  // Default: if no explicit sub-tab restriction is recorded, grant access
  return true;
}

export interface Admin {
  id: string;
  namaLengkap: string;
  email: string;
  password?: string;
  nomorHp: string;
  fotoProfil: string; // URL can be a generated placeholder or data URI
  status: StatusAktif;
  tanggalDibuat: string;
  passkeys?: UserPasskey[];
  adminRole?: AdminSubRole;
  jabatan?: string;
  permissions?: AdminPermissionKey[];
  adminTabPermissions?: Record<string, string[]>;
  colorTheme?: UserColorThemePreference;
}

export interface Guru {
  id: string;
  nip?: string;
  namaLengkap: string;
  jabatan: string;
  email: string;
  password?: string;
  nomorHp: string;
  jenisKelamin: JenisKelamin;
  alamat: string;
  fotoProfil: string;
  halaqahBimbinganId?: string; // ID of the Halaqah they coach
  halaqahBimbinganNama?: string;
  status: StatusAktif;
  tanggalDibuat: string;
  peranGuru?: string[]; // E.g., ['Guru Halaqah', 'Penguji Assessment', 'Koordinator Penguji']
  kompetensiGuru?: string[]; // E.g., ['Tilawah', 'Tahfidz', 'Iqra', 'Tajwid', 'Kitab', 'Bahasa Arab', 'Program Khusus']
  izinHalaqahPribadi?: boolean;
  lokasiMengajar?: string[]; // List of teaching locations e.g. ['KANTOR PUSAT', 'MASJID AL-IKHLAS']
  keteranganLokasi?: string; // Custom location description e.g. "Kantor Pusat & Masjid Kampus"
  yayasanId?: string;
  direktoratId?: string;
  regionalId?: string;
  sekolahId?: string;
  jenjangId?: string;
  yayasanNama?: string;
  direktoratNama?: string;
  regionalNama?: string;
  sekolahNama?: string;
  jenjangNama?: string;
  passkeys?: UserPasskey[];
  colorTheme?: UserColorThemePreference;
}

export interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
  kelasId: string;
  kelasNama: string;
  halaqahId: string;
  halaqahNama: string;
  email: string;
  password?: string;
  nomorHpOrangTua: string;
  jenisKelamin: JenisKelamin;
  tanggalLahir: string;
  alamat: string;
  fotoProfil: string;
  status: StatusAktif;
  tanggalDibuat: string;
  yayasanId?: string;
  direktoratId?: string;
  regionalId?: string;
  sekolahId?: string;
  jenjangId?: string;
  yayasanNama?: string;
  direktoratNama?: string;
  regionalNama?: string;
  sekolahNama?: string;
  jenjangNama?: string;
  sourceType?: 'foundation' | 'private_halaqah';
  isSiswaMandiri?: boolean;
  catatan?: string;
  passkeys?: UserPasskey[];
  currentJuz?: number | string;
  juz?: number | string;
  currentLevel?: number | string;
  jilid?: number | string;
  unlockedElemenIds?: string[]; // Elemen yang dibuka khusus / di-akselerasi oleh guru/admin
  elemenAkselerasiNotes?: Record<string, { tanggal: string; guruNama?: string; catatan?: string }>;
  colorTheme?: UserColorThemePreference;
}

export interface Kelas {
  id: string;
  namaKelas: string;
  jenjang: TingkatJenjang;
  tahunAjaran: string; // e.g. "2025/2026"
  waliKelasId?: string;
  waliKelasNama?: string;
}

export interface Halaqah {
  id: string;
  namaHalaqah: string;
  guruPembimbingId: string;
  guruPembimbingNama: string;
  kapasitasPeserta: number;
  keterangan: string;
  status: StatusAktif;
  warnaIdentitas: string; // HEX color or tailwind custom class e.g., "#10B981"
  fotoHalaqah?: string; // Base64 or local URL for profile picture
  sekolahId?: string;
  jenjangId?: string;
  sekolahNama?: string;
  jenjangNama?: string;
  direktoratId?: string;
  direktoratNama?: string;
  sourceType?: 'foundation' | 'private_halaqah';
  jenisProgram?: string;
  hariKegiatan?: string;
  waktuKegiatan?: string;
  targetConfigEnabled?: boolean;
  targetConfig?: any;
  targetConfigText?: any;
}

export enum TipeModul {
  AL_QURAN = 'Al-Quran',
  NON_AL_QURAN = 'Selain Al-Quran',
}

export interface AyatModul {
  nomorAyat: number;
  teksArab: string;
  terjemahan?: string;
  juz?: number;
  halaman?: number;
  baris?: number; // Menentukan ayat berada pada baris ke berapa di halaman mushaf (misal ayat 1 Surah Al-Fatihah baris 1)
  barisAkhir?: number; // Baris akhir jika ayat panjang mencakup lebih dari satu baris
  modulId?: string;
  suratNama?: string;
  suratNomor?: number;
}

export interface Modul {
  id: string;
  tipe: TipeModul;
  elemenId?: string;
  elemenNama?: string;
  // Quran specific
  namaSurat?: string;
  nomorUrutSurat?: number;
  jumlahAyat?: number;
  rujukanMushaf?: string; // Rujukan cetakan/standar mushaf (e.g. "Mushaf Madinah (Majma Malik Fahd - Standar 15 Baris)")
  isiAyat?: AyatModul[]; // Parsed ayat or manual list
  // Non Quran specific
  judulModul?: string; // Also used generally
  kategoriModul?: string;
  halamanGambar?: string[]; // Data URLs or empty arrays for single jilid
  fileDocxName?: string;
  isiModulManual?: string; // fallback text
  thumbnailHalaman?: string[];
  
  // Multi-Volume/Jilid specs
  isMultiJilid?: boolean;
  jumlahJilid?: number;
  halamanPerJilid?: number[]; // [10, 15, 8] for Jilid 1, 2, 3
  halamanGambarPerJilid?: string[][]; // string[jilidIndex][pageIndex] storing data URLs/Base64 images

  // Content type specifications
  tipeMateri?: 'gambar' | 'teks' | 'google_doc_slide' | 'pdf' | 'hanya_identitas'; // whether upload is image-based, text-based, linked Google Docs/Slides, PDF, or identity-only (copyrighted)
  googleDocUrl?: string; // linked Google Docs url
  googleSlideUrl?: string; // linked Google Slides url
  pdfBase64?: string; // Base64 or Data URL of the uploaded PDF file
  pdfFileName?: string; // name of the uploaded PDF file
  penjelasanHalaman?: string[]; // list of explanation text per page
  penjelasanHalamanPerJilid?: string[][]; // list of explanation text per page per jilid
  teksHalaman?: string[]; // main text content per page for 'teks' mode
  teksHalamanPerJilid?: string[][]; // main text content per page per jilid for 'teks' mode
  
  // Identity-only copyrighted modules
  penulisModul?: string;
  penerbitModul?: string;
  tahunTerbit?: string;
  deskripsiIdentitas?: string;
  coverModul?: string; // Data URL for single jilid cover
  coverModulPerJilid?: string[]; // Data URLs for multi-jilid covers

  // Line count per page configurations
  useJumlahBarisPerHalaman?: boolean;
  defaultLinesPerPage?: number; // Default number of lines per page (e.g. 15 for Quran, or custom for Iqro/Kitab)
  customPageLines?: CustomPageLine[]; // Exceptions / custom line count per specific page
  jumlahBarisPerHalaman?: (number | null)[]; // line count per page (1-based index)
  jumlahBarisPerHalamanPerJilid?: (number | null)[][]; // line count per page per jilid (1-based index)

  // Optional alias properties for backward compatibility
  namaModul?: string;
  tipeModul?: TipeModul;
}

export interface Setoran {
  id: string;
  siswaId: string;
  siswaNama: string;
  siswaNis: string;
  halaqahId: string;
  halaqahNama: string;
  guruId: string;
  guruNama: string;
  modulId: string;
  modulNama: string;
  tipeModul: TipeModul;
  sourceType?: 'foundation' | 'private_halaqah';
  predikatNilai?: string;
  keterangan?: string;
  
  // Quran fields
  elemenId?: string;
  elemenNama?: string;
  jenisSetoran?: string; // Tilawah / Tahfidz or custom
  tipeTahfidz?: string; // Baru, Murojaah, dynamically configured
  suratNama?: string;
  ayatAwal?: number;
  ayatAkhir?: number;

  // Multiple Surahs
  banyakSurat?: number;
  daftarSuratSetoran?: Array<{
    modulId: string;
    suratNama: string;
    ayatAwal: number;
    ayatAkhir: number;
  }>;

  // Non-Quran fields
  jilid?: string | number;
  halaman?: number;
  catatanModulLain?: string;
  jumlahBaris?: number;
  barisAwal?: number;
  barisAkhir?: number;

  // Additional optional fields for compatibility
  surahMulai?: string;
  ayatMulai?: number;
  surahSelesai?: string;
  ayatSelesai?: number;
  barisSelesai?: number;
  jilidNonQuran?: number;
  babNonQuran?: string;
  halamanNonQuran?: number;
  tanggalMulai?: string;
  tanggalSelesai?: string;

  // Evaluation fields
  catatanGuru: string;
  nilai: string; // e.g., "A", "B+", "Mumtaz", "Jayyid", "85"
  statusLulus: boolean;
  kesimpulanHasilKelulusan?: string; // e.g., "Lulus", "Belum Lulus", "Perlu Perbaikan", "Mengulang"
  tanggalSetoran: string; // YYYY-MM-DD

  // Annotated Canvas fields (Iqro / Kitab Modul Gambar)
  canvasStrokesKeys?: string;     // JSON string of { [pageNum: number]: any[] }
  canvasPinsKeys?: string;        // JSON string of { [pageNum: number]: any[] }
  nonQuranJilid?: number;
  nonQuranPageAwal?: number;
  nonQuranPageAkhir?: number;
  nonQuranHalamanTunggal?: boolean;
  interactiveComments?: Array<{ id: string; target: string; targetKey?: string; targetKeys?: string[]; category?: string; subcategory?: string; comment: string; info: string }>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorNama: string;
  actorRole: UserRole;
  action: string; // e.g., "Menambahkan siswa Ahmad Dani"
  rincian: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderNama: string;
  senderRole: UserRole;
  receiverId: string; // string (User ID or 'all_gurus' or 'all_siswas' or 'all_roles')
  receiverNama: string;
  receiverRole: UserRole | 'ALL';
  message: string;
  timestamp: string;
}

export interface Session {
  user: {
    id: string;
    namaLengkap: string;
    email: string;
    role: UserRole;
    fotoProfil: string;
    adminRole?: AdminSubRole;
    permissions?: AdminPermissionKey[];
    adminTabPermissions?: Record<string, string[]>;
    jabatan?: string;
    colorTheme?: UserColorThemePreference;
  } | null;
  waktuLogin: string | null;
}

export interface VirtualMeeting {
  id: string;
  title: string;
  halaqahId: string; // e.g. hq-1 or 'all'
  halaqahNama: string; // e.g. Halaqah Abu Bakar
  guruId: string;
  guruNama: string;
  agenda: string;
  isActive: boolean;
  meetingUrl: string;
  startTime: string;
  participantsCount: number;
}

export enum StatusKehadiranGuru {
  HADIR = 'Hadir',
  SAKIT = 'Sakit',
  IZIN = 'Izin',
  ALPHA = 'Tanpa Keterangan',
}

export interface PresensiGuruRecord {
  id: string;
  guruId: string;
  guruNama: string;
  halaqahId?: string;
  halaqahNama?: string;
  tanggal: string; // YYYY-MM-DD
  status: StatusKehadiranGuru | string; // 'Hadir', 'Sakit', 'Izin', 'Tanpa Keterangan'
  isAutoDetected?: boolean;
  jumlahSetoranLog?: number;
  catatan: string;
  updatedByAdminNama?: string;
  updatedAt?: string;
}

export interface JadwalMengajarGuru {
  id: string;
  guruId: string;
  guruNama: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';
  jamMulai: string; // "07:30"
  jamSelesai: string; // "09:00"
  halaqahId?: string;
  halaqahNama?: string;
  materi?: string;
  status: StatusAktif;
  catatan?: string;
}

export interface MurojaahBerpasangan {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  siswaNama: string;
  halaqahId: string;
  halaqahNama: string;
  pasanganId: string;
  pasanganNama: string;
  jenisMurojaah: string; // "Murojaah Hafalan" or "Lainnya"
  elemenNama?: string; // e.g. "Tahfidz" or "Tilawah"
  modulId?: string;
  modulNama?: string;
  suratAwal?: string;
  suratAkhir?: string;
  ayatAwal?: string;
  ayatAkhir?: string;
  catatan?: string;
  catatanGuru?: string;
  statusVerifikasi: 'Belum Diverifikasi' | 'Disetujui' | 'Perlu Perbaikan';
  statusPasangan: 'Belum Dikonfirmasi' | 'Dikonfirmasi' | 'Ditolak';
}

export enum KategoriAssessment {
  TILAWAH = 'Tilawah',
  TAHFIDZ = 'Tahfidz',
  IQRA = 'Iqra',
  KITAB = 'Kitab',
  PROGRAM = 'Program',
}

export interface JenisAssessment {
  id: string;
  elemenId?: string;
  elemenNama?: string;
  kategori: KategoriAssessment;
  namaAssessment: string;
  deskripsi: string;
  statusAktif: boolean | StatusAktif;
  
  // Custom integrations for Pelajaran, Elemen & Modul Terkait
  pelajaranId?: string;
  pelajaranNama?: string;
  elemen?: string;
  modulId?: string;
  modulNama?: string;
  
  // Quran assessment specs
  sumberAssessment?: 'internal' | 'eksternal';
  modulInternalOption?: 'AL_QURAN' | 'IQRA' | 'KITAB' | 'LAINNYA';
  
  // External Integration Specs
  eksternalTipe?: 'upload' | 'text' | 'link';
  eksternalText?: string;
  eksternalFileBase64?: string;
  eksternalFileName?: string;
  eksternalFileType?: string;
  eksternalFileSize?: number;
  eksternalLink?: string;
  quranJuz?: string;
  quranSurat?: string;
  quranRentangSuratStart?: string;
  quranRentangSuratEnd?: string;
  quranRentangAyatStart?: number;
  quranRentangAyatEnd?: number;
  quranRentangHalamanStart?: number;
  quranRentangHalamanEnd?: number;
  quranHalamanUjianOption?: 'guru' | 'acak' | 'kombinasi';
  quranHalamanUjianCount?: number;
  quranMetodeTahfidz?: string; // Sambung Ayat, Sambung Surat, Tasmi', Setor Hafalan Lengkap, Acak Otomatis, Gabungan
  quranTahfidzRentangSuratStart?: string;
  quranTahfidzRentangSuratEnd?: string;
  quranTahfidzRentangJuzStart?: string;
  quranTahfidzRentangJuzEnd?: string;
  quranTahfidzJumlahSoal?: number;
  quranSuratMode?: 'semua' | 'single' | 'rentang' | 'kustom';
  quranSelectedSurahs?: string[];
}

export interface RubrikItem {
  id?: string;
  kriteria?: string;
  namaKriteria?: string; // e.g. "Kelancaran", "Tajwid", etc.
  bobotPersen: number; // e.g. 40
  poinPengurangan?: number; // Poin pengurangan per kesalahan (e.g. 5)
  categoryIds?: string[]; // IDs or names of linked error categories from TajwidCategory
  oncePerSessionCategories?: string[]; // IDs or names of categories in this rubrik that only deduct once per session
}

export interface SyaratKelulusan {
  nilaiMinimal: number; // e.g. 80
  tanpaKesalahanFatal: boolean; // true or false
  rekomendasiLayakHarus: boolean; // whether needs 'Layak' / 'Layak Syahadah' to graduate
}

export interface TemplateAssessment {
  id: string;
  namaTemplate: string;
  jenisAssessmentId: string; // references primary/legacy JenisAssessment.id
  jenisAssessmentIds?: string[]; // references array of connected JenisAssessment.id
  namaJenisAssessment: string;
  namaJenisAssessments?: string[]; // list of connected JenisAssessment names
  petunjukPelaksanaan: string; // default petunjuk
  petunjukPerJenis?: Record<string, string>; // optional custom petunjuk per jenisAssessmentId (key: jenisAssessmentId)
  rubrikPenilaian?: RubrikItem[];
  rubrik?: RubrikItem[];
  rubrikNilai?: RubrikItem[];
  syaratKelulusan?: SyaratKelulusan;
  syaratMinScore?: number;
  statusAktif?: StatusAktif | boolean;
  kategori?: KategoriAssessment;
  elemenId?: string;
  elemenNama?: string;
  modePenilaian?: 'Langsung' | 'PenguranganKesalahan'; // mode scoring
  
  // Aturan pemotongan kesalahan (seperti Master Bobot Mutabaah)
  oncePerSessionCategories?: string[]; // Kategori-kategori kesalahan yang hanya dihitung 1x potong per sesi ujian
  
  // Custom Quran parameters can also be configured/carried at template level
  sumberAssessment?: 'internal' | 'eksternal';
  modulInternalOption?: 'AL_QURAN' | 'IQRA' | 'KITAB' | 'LAINNYA';
  quranJuz?: string;
  quranSurat?: string;
  quranRentangSuratStart?: string;
  quranRentangSuratEnd?: string;
  quranRentangAyatStart?: number;
  quranRentangAyatEnd?: number;
  quranRentangHalamanStart?: number;
  quranRentangHalamanEnd?: number;
  quranHalamanUjianOption?: 'guru' | 'acak' | 'kombinasi';
  quranHalamanUjianCount?: number;
  quranMetodeTahfidz?: string; 
  quranTahfidzRentangSuratStart?: string;
  quranTahfidzRentangSuratEnd?: string;
  quranTahfidzRentangJuzStart?: string;
  quranTahfidzRentangJuzEnd?: string;
  quranTahfidzJumlahSoal?: number;
  modelPengujian?: 'Tunggal' | 'Ganda' | 'Tim';
  quranSuratMode?: 'semua' | 'single' | 'rentang' | 'kustom';
  quranSelectedSurahs?: string[];
}

export interface KoreksiLiveItem {
  id: string;
  surahNama: string;
  target: string;
  targetKey?: string;
  category: string;
  rubrikKriteria?: string;
  comment: string;
  timestamp?: string;
}

export interface AssessmentRecord {
  id: string;
  siswaId: string;
  siswaNama: string;
  siswaNis: string;
  halaqahId: string;
  halaqahNama: string;
  
  // Assessment details
  jenisAssessmentId: string;
  namaAssessment: string;
  kategori: KategoriAssessment;
  elemenId: string;
  elemenNama: string;
  templateId?: string;
  
  // Guru / Penguji
  guruId: string;
  guruNama: string;
  
  // Team/Examiner System variables
  modelPengujian?: 'Tunggal' | 'Ganda' | 'Tim';
  ketuaPengujiId?: string;
  ketuaPengujiNama?: string;
  anggotaPengujiIds?: string[];
  anggotaPengujiNamas?: string[];
  
  nilaiPenguji1?: number; // For Penguji Ganda
  nilaiPenguji2?: number; // For Penguji Ganda
  nilaiAkhirMethod?: 'Rerata' | 'Ketua' | 'Musyawarah'; // Keputusan Akhir
  
  // Details for Tim Penguji
  nilaiPerPenguji?: Record<string, number>; // e.g. { "gru-koordinator": 90, "gru-1": 85 }
  catatanPerPenguji?: Record<string, string>; // e.g. { "gru-koordinator": "Lancar", "gru-1": "Tajwid bagus" }
  
  tanggalAssessment: string; // YYYY-MM-DD
  modePenilaian?: 'Langsung' | 'PenguranganKesalahan'; // mode scoring used
  
  rubrikNilaiInput: Array<{
    namaKriteria: string;
    bobotPersen: number;
    nilaiInput: number; // 0 - 100
    jumlahKesalahan?: number; // Jumlah kesalahan yang diinput
    poinPengurangan?: number; // Poin pengurangan per kesalahan
  }>;
  
  kesalahanFatal: boolean;
  catatanGuru: string;
  rekomendasiLayak: 'Layak' | 'Belum Layak' | 'Layak Syahadah';
  
  // Calculated
  nilaiAkhir: number;
  statusHasil: 'Lulus' | 'Lulus Bersyarat' | 'Perlu Perbaikan' | 'Mengulang' | 'Belum Lulus' | string;
  statusKelulusan?: string;
  tanggalDibuat: string;

  // Custom Quran actual test logging
  quranHalamanTerpilih?: number[];
  quranCuesTested?: string[];
  quranMetodeTahfidzTested?: string;
  
  // Integration promos
  isKenaikanJuz?: boolean;
  isKenaikanLevel?: boolean;
  isMunaqasyahEligible?: boolean;
  kenaikanJuzKeterangan?: string;

  // Riwayat koreksi live sesi ujian
  riwayatKoreksiLive?: KoreksiLiveItem[];
  catatanKoreksiLive?: KoreksiLiveItem[];
}

export interface PengajuanAssessment {
  id: string;
  siswaId: string;
  siswaNama: string;
  siswaNis: string;
  halaqahId: string;
  halaqahNama: string;
  targetJuzAtauJilid: string;
  jenisAssessmentId: string;
  jenisAssessmentNama: string;
  templateAssessmentId: string;
  templateAssessmentNama: string;
  pengajuGuruId: string;
  pengajuGuruNama: string;
  pengujiGuruId: string;
  pengujiGuruNama: string;
  guruNama?: string;
  tanggalPengajuan: string;
  status: 'Pending' | 'Selesai' | 'Ditolak';
  catatanGuru?: string;
  catatanPenguji?: string;
  nilaiAkhir?: number;
  statusHasil?: string;
  statusKelulusan?: string;
}

export interface Syahadah {
  id: string;
  siswaId: string;
  siswaNama: string;
  siswaNis: string;
  assessmentRecordId: string;
  namaAssessment: string;
  kategori: KategoriAssessment;
  nilaiAkhir: number;
  predikat: string;
  nomorSertifikat: string; // e.g. SYH/2026/06/001
  tanggalTerbit: string;
  ttdNama: string; // E.g., Kepala Madrasah / Admin
  ttdJabatan: string;

  // Typo mapping compatibility fields
  jeniaAssessmentNama?: string;
  nilaiPertanggungjawaban?: number;

  // Flow & lifecycle states
  status?: 'Pending_Guru' | 'Pending_Admin' | 'Ditunda_Guru' | 'Ditolak_Guru' | 'Disetujui' | 'Ditolak_Admin';
  catatanGuru?: string;
  catatanAdmin?: string;
  rekomendatorGuruId?: string;
  rekomendatorGuruNama?: string;
  approverAdminId?: string;
  approverAdminNama?: string;

  // Custom styling, positions and slides
  ruleId?: string;
  templateType?: 'slides' | 'image';
  slidesTemplateUrl?: string;
  imageUrl?: string;
  fieldPositions?: Record<string, { x: number; y: number; fontSize?: number }>;
  qrCodeUrl?: string;
}

export interface SyahadahSettings {
  isEnabledForGuru: boolean;
  isEnabledForSiswa: boolean;
  keteranganKebijakan?: string;
  updatedAt?: string;
}

export interface SyahadahRule {
  id: string;
  namaSyahadah: string; // e.g., "Syahadah Juz 30"
  jenisAssessmentId: string; // references JenisAssessment.id
  namaAssessment: string; // references name of assessment
  nilaiMinimal: number; // e.g., 85
  
  templateType: 'slides' | 'image';
  slidesTemplateUrl?: string; // e.g., slides ID
  imageUrl?: string; // background template URL
  fieldPositions?: Record<string, { x: number; y: number; fontSize?: number }>;
  ttdNama: string;
  ttdJabatan: string;
  tanggalDibuat: string;

  // Organizational & curricular scopes
  elemenId?: string;
  elemenNama?: string;
  yayasanId?: string;
  yayasanNama?: string;
  direktoratId?: string;
  direktoratNama?: string;
  sekolahId?: string;
  sekolahNama?: string;
  jenjangId?: string;
  jenjangNama?: string;
}

export interface SubElemen {
  id: string;
  nama: string;
  deskripsi?: string;
  statusAktif: boolean;
}

export interface MataPelajaran {
  id: string;
  nama: string;
  deskripsi?: string;
  statusAktif: boolean;
  elemenList: SubElemen[];
  tanggalDibuat: string;
}

export interface YayasanData {
  nama: string;
  singkatan: string;
  divisi?: string;
  logo: string;
  alamat: string;
  email: string;
  nomorTelepon: string;
  website: string;
}

export type OrgStructureType = 'A' | 'B' | 'C';

export interface DirektoratNode {
  id: string;
  nama: string;
  namaDirektur: string;
  email: string;
  nomorHp: string;
  logo?: string;
}

export interface RegionalNode {
  id: string;
  direktoratId: string;
  nama: string;
  penanggungJawab: string;
  email: string;
  nomorHp: string;
}

export interface JenisStruktur {
  id: string;
  nama: string; // e.g. "Lembaga Formal", "Lembaga Non Formal"
  deskripsi?: string;
}

export interface SekolahNode {
  id: string;
  direktoratId?: string;
  regionalId?: string;
  nama: string;
  namaPimpinan: string; // Direktur/Pimpinan (Nama Kepala Sekolah)
  email: string;
  nomorHp: string;
  jenisSekolah: 'Offline' | 'Online' | 'Hybrid';
  alamat: string;
  statusAktif: boolean;
  kategoriUnit?: 'Formal' | 'Non-Formal';
  modelLembaga?: 'Sekolah' | 'Madrasah' | 'Rumah Quran' | 'Quran Online' | 'Kampung Santri' | 'Lainnya';
  jenisStrukturId?: string;
  jenisStrukturNama?: string;
}

export interface JenjangNode {
  id: string;
  sekolahId: string;
  nama: string; // Nama Kelas (e.g. "Kelas A", "Kelas B")
  namaKepalaSekolah: string; // Nama Wali Kelas
  email: string;
  nomorHp: string;
}

export interface StrukturLembaga {
  id: string;
  yayasan: YayasanData;
  selectedStructure: OrgStructureType;
  direktoratList: DirektoratNode[];
  regionalList: RegionalNode[];
  sekolahList: SekolahNode[];
  jenjangList: JenjangNode[];
  jenisStrukturList?: JenisStruktur[];
}

export interface NonQuranFont {
  id: string;
  name: string;
  url: string; // Base64 or objectUrl
  fileName: string;
  type: 'arab' | 'latin';
  isGoogleFont?: boolean;
}

export interface ProgramKeilmuan {
  id: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  tujuan: string;
  sasaran: string;
  kkm?: number;
  bertahap: boolean;
  latihan: boolean;
  asesmenPraktik: boolean;
  remedial: boolean;
  ujianAkhir: boolean;
  sertifikat: boolean;
  status: 'Aktif' | 'Nonaktif' | 'Diarsipkan';
  tanggalDibuat: string;
  tipeMateri?: 'Modul' | 'Cetak';
  modulId?: string;
  aspekPenilaianList?: string[];
  cetakInfo?: {
    namaBuku: string;
    penulis: string;
    penerbit: string;
    tahunTerbit: string;
    edisi: string;
    bab: string;
    halaman: string;
    catatan: string;
  };
  // Anti-Cheat Proctoring Settings
  antiCheatEnabled?: boolean;
  maxViolations?: number;
  requireFullscreen?: boolean;
  blockCopyPaste?: boolean;
  petunjukKejujuran?: string;
}

export interface ProgramBab {
  id: string;
  programId: string;
  judul: string;
  tujuanPembelajaran: string;
  indikator: string;
  estimasiWaktu: string;
  urutan: number;
}

export interface ProgramMateri {
  id: string;
  babId: string;
  programId: string;
  judul: string;
  tipe: 'Modul' | 'Cetak' | 'Audio';
  modulId?: string;
  cetakInfo?: {
    namaBuku: string;
    penulis: string;
    penerbit: string;
    tahunTerbit: string;
    edisi: string;
    bab: string;
    halaman: string;
    catatan: string;
  };
  urutan?: number;
  isPraktik?: boolean;
  praktikPetunjuk?: string;
  aspekPenilaianSelected?: string[];
}

export interface ProgramLatihan {
  id: string;
  babId: string;
  programId: string;
  tipe: 'pilihan_ganda' | 'benar_salah' | 'menjodohkan' | 'isian' | 'membaca';
  pertanyaan: string;
  opsi?: string[];
  jawabanBenar?: string | string[];
  urutan: number;
}

export interface ProgramAsesmenKognitifQuestion {
  id: string;
  babId: string;
  programId: string;
  tipe: 'pilihan_ganda' | 'pilihan_ganda_multi' | 'benar_salah' | 'menjodohkan' | 'rumpang' | 'isian_singkat' | 'esai' | 'susun_urutan';
  pertanyaan: string;
  opsi?: string[];
  jawabanBenar?: string | string[];
  bobot?: number;
  urutan: number;
}

export interface ProgramAsesmenKognitifSetting {
  id: string;
  programId: string;
  babId: string;
  jumlahSoal: number;
  durasi: number;
  acakSoal: boolean;
  acakJawaban: boolean;
  bobotNilai: number;
  antiCheatEnabled?: boolean;
  maxViolations?: number;
  requireFullscreen?: boolean;
  blockCopyPaste?: boolean;
  petunjukKejujuran?: string;
}

export interface ProgramAsesmenPraktikSetting {
  id: string;
  programId: string;
  babId: string;
  tipePraktik: 'Membaca Al-Qur\'an' | 'Menjelaskan Kaidah Tajwid' | 'Identifikasi Hukum Tajwid' | 'Analisis Hukum Tajwid dalam Ayat' | 'Koreksi Kesalahan Bacaan';
  metodePelaksanaan: 'Tatap Muka' | 'Video Call' | 'Pengumpulan Tugas';
  tugasTipe?: 'Audio' | 'Video';
  tugasPetunjuk?: string;
  aspekPenilaian: {
    makharijulHuruf: number;
    sifatulHuruf: number;
    hukumTajwid: number;
    kelancaran: number;
    kefasihan: number;
    pemahamanMateri: number;
  };
}

export interface ProgramEnrollment {
  id: string;
  programId: string;
  programNama: string;
  siswaId: string;
  siswaNama: string;
  siswaNis: string;
  halaqahId: string;
  halaqahNama: string;
  status: 'Peserta Aktif' | 'Selesai Program' | 'Tidak Aktif';
  tanggalDaftar: string;
  progressPercent: number;
  babProgress: Record<string, {
    completedMateriIds: string[];
    materiPraktikProgress?: Record<string, {
      status: 'Belum Mengikuti' | 'Perlu Penilaian' | 'Lulus' | 'Belum Lulus';
      fileBase64?: string;
      fileName?: string;
      fileType?: string;
      nilai?: number;
      catatan?: string;
      nilaiDetail?: {
        makharijulHuruf: number;
        sifatulHuruf: number;
        hukumTajwid: number;
        kelancaran: number;
        kefasihan: number;
        pemahamanMateri: number;
      };
      submittedAt?: string;
      submittedAtIso?: string;
    }>;
    readingTimes?: Record<string, string>;
    readingCompletedDetails?: Record<string, {
      materiId: string;
      materiJudul: string;
      babId: string;
      babJudul: string;
      completedAtIso: string;
      completedAtFormatted: string;
      readByGuru?: boolean;
    }>;
    praktikSubmittedAtIso?: string;
    nilaiAkhir?: number;
    latihanCompleted: boolean;
    latihanScore?: number;
    kognitifScore?: number;
    kognitifStatus?: 'Lulus' | 'Belum Lulus';
    kognitifAttempts?: number;
    praktikStatus?: 'Belum Mengikuti' | 'Perlu Penilaian' | 'Lulus' | 'Belum Lulus';
    praktikScore?: number;
    praktikCatatan?: string;
    praktikFileBase64?: string;
    praktikFileName?: string;
    praktikFileType?: string;
    praktikNilaiDetail?: {
      makharijulHuruf: number;
      sifatulHuruf: number;
      hukumTajwid: number;
      kelancaran: number;
      kefasihan: number;
      pemahamanMateri: number;
    };
    kognitifAnswers?: Record<string, string>;
    kognitifQuestions?: ProgramAsesmenKognitifQuestion[];
    kognitifManualCorrections?: Record<string, 'correct' | 'incorrect'>;
    cheatLogs?: Array<{
      type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste_attempt' | 'devtools_attempt';
      message: string;
      timestamp: string;
      timestampIso: string;
    }>;
    violationCount?: number;
    autoSubmittedDueToCheat?: boolean;
    lulusBab: boolean;
  }>;
  ujianAkhirStatus?: 'Belum Mengikuti' | 'Perlu Penilaian' | 'Lulus' | 'Belum Lulus';
  ujianAkhirTeoriScore?: number;
  ujianAkhirPraktikScore?: number;
  ujianAkhirPraktikFile?: string;
  ujianAkhirPraktikFileName?: string;
  lulusProgram: boolean;
  sertifikatTerbit: boolean;
  sertifikatNo?: string;
  sertifikatTanggal?: string;
  lastReadingUpdate?: {
    materiId: string;
    materiJudul: string;
    babId: string;
    babJudul: string;
    siswaId: string;
    siswaNama: string;
    siswaNis: string;
    timestamp: string;
    timestampIso: string;
    readByGuru?: boolean;
  };
}

export interface PwaSettings {
  id: string;
  adminName: string;
  adminIcon?: string;
  guruName: string;
  guruIcon?: string;
  siswaName: string;
  siswaIcon?: string;
  appName?: string;
  appIcon?: string;
  // Berita Acara Template Properties
  baNamaYayasan?: string;
  baNamaPanitia?: string;
  baAlamatKontak?: string;
  baTtd1Jabatan?: string;
  baTtd1Nama?: string;
  baTtd1Sub?: string;
  baTtd2Jabatan?: string;
  baTtd2Nama?: string;
  baTtd2Sub?: string;
}

export interface CustomTemplateTextBox {
  id: string;
  type: 'sub_judul' | 'paragraf' | 'catatan';
  title?: string;
  content: string;
  align?: 'left' | 'center' | 'right';
  isBold?: boolean;
}

export interface RekapPresensiTableColumns {
  showNo: boolean;
  showTanggal: boolean;
  showWaktu: boolean;
  showGuru: boolean;
  showHalaqah: boolean;
  showStatus: boolean;
  showKeterangan: boolean;
  showLokasi: boolean;
  customLabels?: {
    no?: string;
    tanggal?: string;
    waktu?: string;
    guru?: string;
    halaqah?: string;
    status?: string;
    keterangan?: string;
    lokasi?: string;
  };
}

export interface RekapPresensiPdfTemplate {
  headerBadgeText: string;
  documentTitle: string;
  locationText?: string;
  autoLocation?: boolean; // Default true: otomatis mengikuti Lokasi Laporan / Lokasi Mengajar Guru
  footerSocialText: string;
  penanggungjawabJabatan: string;
  penanggungjawabNama: string;
  headerImageBase64?: string;
  footerImageBase64?: string;
  signatureImageBase64?: string;
  primaryColorHex?: string;
  accentColorHex?: string;
  
  // Fitur Bagian Isi & Tata Letak Dokumen
  textBoxes?: CustomTemplateTextBox[];
  tableColumns?: RekapPresensiTableColumns;
  tableDensity?: 'normal' | 'compact';
  showSummaryBelowTable?: boolean;
  summaryTextFormat?: string; // Format teks ringkasan, contoh: "Rekap kehadiran bulan {bulan}: {jumlah} kali"
  showSignatureDate?: boolean; // Tampilkan baris tanggal di atas jabatan tanda tangan
  elementsOrder?: Array<'title' | 'textboxes' | 'table'>;
}

export interface HijriCalendarSetting {
  mode: 'auto_offset' | 'manual';
  dayOffset: number; // -2, -1, 0, +1, +2
  customText?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_HIJRI_SETTING: HijriCalendarSetting = {
  mode: 'auto_offset',
  dayOffset: 0,
  customText: ''
};

export type TargetAudiensPengumuman = 'ALL' | 'GURU' | 'SISWA';
export type KategoriPengumuman = 'INFO_UMUM' | 'UMUM' | 'AKADEMIK' | 'URGENT' | 'DARURAT' | 'AGENDA' | 'KEGIATAN' | 'LIBUR' | 'PENGINGAT';

export interface Pengumuman {
  id: string;
  judul: string;
  konten: string;
  targetAudiens: TargetAudiensPengumuman; // 'ALL' | 'GURU' | 'SISWA'
  kategori: KategoriPengumuman;
  isPinned?: boolean; // Tampilkan di posisi paling atas / banner khusus
  isPublished: boolean;
  tanggalMulai?: string; // Format YYYY-MM-DD
  tanggalSelesai?: string; // Format YYYY-MM-DD
  tanggalBerakhir?: string; // Alias untuk tanggal selesai
  lampiranUrl?: string; // Link gambar atau file
  lampiranNama?: string;
  lampiranTipe?: 'image' | 'pdf' | 'link';
  authorId: string;
  authorNama: string;
  authorRole: string;
  dibacaOleh?: string[]; // Array user IDs yang sudah membaca
  createdAt: string;
  updatedAt?: string;
}

export interface CapaianPembelajaran {
  id: string;
  kodeCP: string; // e.g. "CP-TAJWID-01"
  jenjang: TingkatJenjang | string;
  fase?: string; // e.g. "Fase A", "Fase B", "Fase C", "Fase D", "Fase E", "Fase F", "Tingkat Dasar", "Tingkat Lanjutan"
  mataPelajaranId?: string;
  mataPelajaranNama: string;
  elemen: string; // e.g. "Makharijul Huruf", "Hukum Nun Sukun & Tanwin", "Thaharah"
  deskripsi: string;
  deskripsiCP?: string;
  rasional?: string;
  tahunAjaran?: string;
  statusAktif: boolean;
  tanggalDibuat: string;
}

export interface TujuanPembelajaran {
  id: string;
  cpId?: string; // References CapaianPembelajaran.id
  capaianPembelajaranId?: string; // Alias for cpId
  mataPelajaranId?: string;
  kodeTP: string; // e.g. "TP-1.1", "TP-1.2"
  mataPelajaranNama: string;
  babId?: string;
  babNama?: string;
  judul: string;
  deskripsi: string;
  indikatorKetercapaian: string[]; // KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
  alokasiWaktu?: string; // e.g. "2 JP (2 x 45 Menit)"
  alokasiWaktuMenit?: number;
  urutan: number;
  statusAktif: boolean;
  tanggalDibuat: string;
}

export interface BankAktivitasPembelajaran {
  id: string;
  kategori: 'pendahuluan' | 'pembukaan' | 'inti' | 'penutup' | 'media' | 'asesmen';
  judul: string;
  deskripsi: string;
  metode?: string;
  alokasiMenitDefault?: number;
  rekomendasiWaktuMenit?: number;
  tags?: string[];
}

export interface RppTemplateAdmin {
  id: string;
  judul: string;
  mataPelajaranId?: string;
  mataPelajaranNama: string;
  jenjang?: string;
  fase?: string;
  metodeUtama?: string;
  alokasiWaktu?: string;
  alokasiWaktuDefault?: string;
  capaianPembelajaranId?: string;
  tujuanPembelajaranIds?: string[];
  pembukaanDefault?: string[];
  intiDefault?: string[];
  penutupDefault?: string[];
  mediaDanAlat?: string[];
  mediaPembelajaran?: string;
  sumberBelajar?: string | string[];
  asesmenMetode?: string[];
  asesmenPenilaian?: string;
  catatanAdmin?: string;
  catatanGuruPreset?: string;
  kegiatanPendahuluan?: string;
  kegiatanInti?: string;
  kegiatanPenutup?: string;
  statusAktif: boolean;
  tanggalDibuat: string;
}

export interface GuruRppDokumen {
  id: string;
  guruId: string;
  guruNama: string;
  templateRefId?: string;
  judul?: string;
  materiPokok?: string;
  mataPelajaranNama: string;
  mataPelajaranId?: string;
  kelasAtauHalaqah?: string;
  halaqahId?: string;
  halaqahNama?: string;
  kelasNama?: string;
  jenjang?: string;
  fase?: string;
  tahunAjaran?: string;
  semester: 'Ganjil' | 'Genap' | string;
  pertemuanKe: number | string;
  tanggalPelaksanaan: string; // YYYY-MM-DD
  alokasiWaktu: string;
  
  // Capaian & Tujuan yang dipilih
  capaianPembelajaranId?: string;
  capaianPembelajaranDeskripsi?: string;
  cpId?: string;
  cpKode?: string;
  cpDeskripsi?: string;
  tujuanPembelajaranDipilih?: Array<{
    tpId: string;
    kodeTP: string;
    judul: string;
    indikator: string[];
  }>;
  tpIds?: string[];
  tpList?: Array<{ kodeTP: string; judul: string; deskripsi: string }>;
  
  // Pokok Bahasan & Langkah Pembelajaran
  kegiatanPembukaan?: string[];
  kegiatanInti?: string[] | string;
  kegiatanPenutup?: string[] | string;
  mediaDanAlat?: string[];
  sumberBelajar?: string[] | string;
  asesmenMetode?: string[];
  refleksiGuru?: string;
  babNama?: string;
  metodePembelajaran?: string;
  kegiatanPendahuluan?: string;
  mediaDanSumber?: string;
  asesmenRencana?: string;
  
  // Status & Evaluasi
  status: 'draft' | 'final' | 'Draft' | 'Siap Digunakan' | 'Terlaksana' | 'Dievaluasi' | string;
  catatanRefleksiGuru?: string;
  ketercapaianSantri?: 'Semua Tercapai' | 'Mayoritas Tercapai' | 'Perlu Pengulangan / Remedial' | string;
  
  tanggalDibuat: string;
  updatedAt?: string;
}

export interface PilotTestingConfig {
  id: string; // 'pilot_testing_config'
  isGlobalEnabled: boolean; // true = semua guru bisa akses, false = hanya guru di whitelist
  whitelistGuruIds: string[]; // array of Guru.id yang diizinkan
  catatanAdmin?: string;
  updatedAt: string;
}

export interface SopBabItem {
  id: string;
  nomorBab: string; // e.g. "BAB I", "BAB II", "BAB VII"
  judul: string;
  isi: string;
  tipeKhusus?: 'standar' | 'rasio_penalti' | 'formula_guardrail' | 'tabel_simulasi' | string;
}

export const DEFAULT_SOP_BAB_LIST: SopBabItem[] = [
  {
    id: 'bab-1',
    nomorBab: 'BAB I',
    judul: 'LANDASAN FILOSOFIS & PRINSIP KERAPATAN KESALAHAN (ERROR DENSITY)',
    isi: 'Dalam evaluasi bacaan dan hafalan Al-Qur\'an, model pemotongan nilai statis memiliki kelemahan pedagogis mendasar. Santri yang membaca 15 baris penuh lalu membuat 1 kesalahan jauh lebih lancar dibandingkan santri yang hanya membaca 3 baris tetapi telah membuat 1 kesalahan. Oleh sebab itu, lembaga menerapkan konsep Kerapatan Kesalahan (Error Density) dengan sistem proporsional terbalik: semakin sedikit baris yang disetor oleh santri, semakin tinggi bobot denda nilai untuk setiap kesalahan yang terjadi, dengan tetap dilindungi oleh batas aman agar tidak terjadi kezaliman nilai.',
    tipeKhusus: 'standar'
  },
  {
    id: 'bab-2',
    nomorBab: 'BAB II',
    judul: 'KLASIFIKASI KESALAHAN & RASIO PEMBOBOTAN 2 : 1',
    isi: 'Kesalahan bacaan dikelompokkan ke dalam dua tingkatan utama dengan rasio bobot tetap 2 : 1:\n1. Lahn Jaliy (Kesalahan Fatal/Jelas): Kesalahan yang merubah arti kata, tertukar huruf hijaiyah, harakat keliru, atau mad asli/tasydid gugur. Bobot dasar acuan adalah 4 poin.\n2. Lahn Khafiy (Kesalahan Ringan/Tajwid): Kesalahan yang mengurangi kesempurnaan kaidah tajwid seperti kadar ghunnah/dengung, tebal-tipis huruf, kesempurnaan sifat huruf, waqaf/ibtida\'. Bobot dasar acuan adalah 2 poin.',
    tipeKhusus: 'rasio_penalti'
  },
  {
    id: 'bab-3',
    nomorBab: 'BAB III',
    judul: 'FORMULA MATEMATIS & GUARDRAILS (BATAS AMAN)',
    isi: 'Rumus Pengurangan Nilai: Poin Pengurangan = (Standar Baris Acuan x Bobot Lahn) / Baris Setoran Efektif.\n\nBatas Pengaman (Guardrails):\n• Batas Bawah (Floor = 5 Baris): Jika santri menyetor setoran pendek (1-4 baris), pembagi baris dikunci minimal 5 baris. Denda Lahn Jaliy terkunci maksimal 12 poin per kesalahan.\n• Batas Atas (Ceiling = 15 Baris): Jika santri menyetor lebih dari 15 baris (misal 2-5 halaman), pembagi baris dikunci di 15 baris agar setiap Lahn Jaliy tetap terpotong minimal 4 poin dan Khafiy minimal 2 poin.',
    tipeKhusus: 'formula_guardrail'
  },
  {
    id: 'bab-4',
    nomorBab: 'BAB IV',
    judul: 'PENERAPAN PADA MODUL NON-AL-QUR\'AN (IQRO / YANBU\'A / TILAWATI)',
    isi: 'Untuk modul jilid berjenjang (seperti Iqro, Yanbu\'a, atau Tilawati), sistem secara otomatis mengadopsi standar baris per halaman dari modul yang bersangkutan (default: 6 baris untuk Iqro). Batas minimal pengunci baris adalah 50% dari standar halaman buku. Dengan demikian, prinsip keadilan berlaku seimbang di seluruh tingkat kemahiran santri.',
    tipeKhusus: 'standar'
  },
  {
    id: 'bab-5',
    nomorBab: 'BAB V',
    judul: 'KEBIJAKAN PROTEKSI MAKSIMAL 1X POTONG PER SESI (NON-DOUBLE PENALTY)',
    isi: 'Bagi kategori Makharijul Huruf, santri yang melakukan kesalahan berulang pada huruf hijaiyah yang sama dalam satu sesi setoran hanya dikenakan pemotongan satu kali saja. Ketentuan ini melindungi proses tumbuh kembang motorik lisan santri dan mencegah keputusasaan belajar.',
    tipeKhusus: 'standar'
  },
  {
    id: 'bab-6',
    nomorBab: 'BAB VI',
    judul: 'TABEL SIMULASI & PREDIKAT KELULUSAN',
    isi: 'Kriteria kelulusan asesmen setoran diklasifikasikan ke dalam 5 predikat resmi:\n• Nilai 95 - 100 : Mumtaz (Lulus Istimewa)\n• Nilai 85 - 94 : Jayyid Jiddan (Lulus Sangat Baik)\n• Nilai 75 - 84 : Jayyid (Lulus Baik)\n• Nilai 60 - 74 : Maqbul (Lulus Cukup)\n• Nilai < 60 : Murojaah / Rasib (Wajib Mengulang/Remedial)',
    tipeKhusus: 'tabel_simulasi'
  }
];

export interface SopStandarPenilaianDoc {
  id: string; // 'sop_standar_penilaian_doc' or 'sop_elemen_{elemenId}'
  elemenId?: string; // undefined or 'global' for global/master; or specific elemen ID
  elemenNama?: string; // name of element if specific
  nomorSK: string;
  judulUtama: string;
  subjudul: string;
  pengantar: string;
  
  // Daftar Bab yang fleksibel (dapat ditambah, dikurangi, diurutkan, dan diedit judulnya)
  daftarBab: SopBabItem[];
  
  // Naskah Per Bab (Backward compatibility)
  bab1Judul?: string;
  bab1Isi?: string;
  bab2Judul?: string;
  bab2Isi?: string;
  bab3Judul?: string;
  bab3Isi?: string;
  bab4Judul?: string;
  bab4Isi?: string;
  bab5Judul?: string;
  bab5Isi?: string;
  bab6Judul?: string;
  bab6Isi?: string;
  
  // Pengesahan
  titiMangsaTempat?: string;
  penandatangan1Jabatan: string;
  penandatangan1Nama: string;
  penandatangan2Jabatan: string;
  penandatangan2Nama: string;
  
  updatedAt: string;
  updatedBy?: string;

  // Custom SOP per Elemen Pembelajaran
  elementOverrides?: Record<string, SopStandarPenilaianDoc>;
}

export const DEFAULT_SOP_PENILAIAN_DOC: SopStandarPenilaianDoc = {
  id: 'sop_standar_penilaian_doc',
  nomorSK: '04/SK-KUR/2026',
  judulUtama: 'STANDAR OPERASIONAL PROSEDUR (SOP) & PEDOMAN PENILAIAN MUTABAAH',
  subjudul: 'SISTEM PEMBOBOTAN NILAI PROPORSIONAL (ERROR DENSITY) & RASIO LAHN JALIY-KHAFIY',
  pengantar: 'Dokumen ini merupakan rujukan operasional resmi yang mengikat bagi seluruh Asatidz / Guru Pengampu Halaqah dalam melakukan evaluasi setoran hafalan (tahfidz), tilawah, dan qiroah santri. Tujuannya adalah menciptakan keadilan penilaian yang terukur, obyektif, dan mendidik.',
  
  daftarBab: DEFAULT_SOP_BAB_LIST,
  
  bab1Judul: 'LANDASAN FILOSOFIS & PRINSIP KERAPATAN KESALAHAN (ERROR DENSITY)',
  bab1Isi: 'Dalam evaluasi bacaan dan hafalan Al-Qur\'an, model pemotongan nilai statis memiliki kelemahan pedagogis mendasar. Santri yang membaca 15 baris penuh lalu membuat 1 kesalahan jauh lebih lancar dibandingkan santri yang hanya membaca 3 baris tetapi telah membuat 1 kesalahan. Oleh sebab itu, lembaga menerapkan konsep Kerapatan Kesalahan (Error Density) dengan sistem proporsional terbalik: semakin sedikit baris yang disetor oleh santri, semakin tinggi bobot denda nilai untuk setiap kesalahan yang terjadi, dengan tetap dilindungi oleh batas aman agar tidak terjadi kezaliman nilai.',
  
  bab2Judul: 'KLASIFIKASI KESALAHAN & RASIO PEMBOBOTAN 2 : 1',
  bab2Isi: 'Kesalahan bacaan dikelompokkan ke dalam dua tingkatan utama dengan rasio bobot tetap 2 : 1:\n1. Lahn Jaliy (Kesalahan Fatal/Jelas): Kesalahan yang merubah arti kata, tertukar huruf hijaiyah, harakat keliru, atau mad asli/tasydid gugur. Bobot dasar acuan adalah 4 poin.\n2. Lahn Khafiy (Kesalahan Ringan/Tajwid): Kesalahan yang mengurangi kesempurnaan kaidah tajwid seperti kadar ghunnah/dengung, tebal-tipis huruf, kesempurnaan sifat huruf, waqaf/ibtida\'. Bobot dasar acuan adalah 2 poin.',
  
  bab3Judul: 'FORMULA MATEMATIS & GUARDRAILS (BATAS AMAN)',
  bab3Isi: 'Rumus Pengurangan Nilai: Poin Pengurangan = (Standar Baris Acuan x Bobot Lahn) / Baris Setoran Efektif.\n\nBatas Pengaman (Guardrails):\n• Batas Bawah (Floor = 5 Baris): Jika santri menyetor setoran pendek (1-4 baris), pembagi baris dikunci minimal 5 baris. Denda Lahn Jaliy terkunci maksimal 12 poin per kesalahan.\n• Batas Atas (Ceiling = 15 Baris): Jika santri menyetor lebih dari 15 baris (misal 2-5 halaman), pembagi baris dikunci di 15 baris agar setiap Lahn Jaliy tetap terpotong minimal 4 poin dan Khafiy minimal 2 poin.',
  
  bab4Judul: 'PENERAPAN PADA MODUL NON-AL-QUR\'AN (IQRO / YANBU\'A / TILAWATI)',
  bab4Isi: 'Untuk modul jilid berjenjang (seperti Iqro, Yanbu\'a, atau Tilawati), sistem secara otomatis mengadopsi standar baris per halaman dari modul yang bersangkutan (default: 6 baris untuk Iqro). Batas minimal pengunci baris adalah 50% dari standar halaman buku. Dengan demikian, prinsip keadilan berlaku seimbang di seluruh tingkat kemahiran santri.',
  
  bab5Judul: 'KEBIJAKAN PROTEKSI MAKSIMAL 1X POTONG PER SESI (NON-DOUBLE PENALTY)',
  bab5Isi: 'Bagi kategori Makharijul Huruf, santri yang melakukan kesalahan berulang pada huruf hijaiyah yang sama dalam satu sesi setoran hanya dikenakan pemotongan satu kali saja. Ketentuan ini melindungi proses tumbuh kembang motorik lisan santri dan mencegah keputusasaan belajar.',
  
  bab6Judul: 'TABEL SIMULASI & PREDIKAT KELULUSAN',
  bab6Isi: 'Kriteria kelulusan asesmen setoran diklasifikasikan ke dalam 5 predikat resmi:\n• Nilai 95 - 100 : Mumtaz (Lulus Istimewa)\n• Nilai 85 - 94 : Jayyid Jiddan (Lulus Sangat Baik)\n• Nilai 75 - 84 : Jayyid (Lulus Baik)\n• Nilai 60 - 74 : Maqbul (Lulus Cukup)\n• Nilai < 60 : Murojaah / Rasib (Wajib Mengulang/Remedial)',
  
  titiMangsaTempat: 'Lembaga Pusat',
  penandatangan1Jabatan: 'Koordinator Tahsin & Mutabaah',
  penandatangan1Nama: 'Divisi Kurikulum Al-Qur\'an',
  penandatangan2Jabatan: 'Mudir / Pimpinan Lembaga',
  penandatangan2Nama: 'Pimpinan Majelis & Pesantren',
  
  elementOverrides: {},
  updatedAt: new Date().toISOString()
};

/**
 * Normalizes a stored SOP document to ensure daftarBab and elementOverrides are always populated
 */
export const normalizeSopPenilaianDoc = (raw: any): SopStandarPenilaianDoc => {
  if (!raw) return DEFAULT_SOP_PENILAIAN_DOC;
  
  let daftarBab: SopBabItem[] = Array.isArray(raw.daftarBab) && raw.daftarBab.length > 0 
    ? raw.daftarBab 
    : [];

  // Migration fallback if old object had fixed bab1...bab6
  if (daftarBab.length === 0) {
    if (raw.bab1Judul || raw.bab1Isi) {
      daftarBab = [
        { id: 'bab-1', nomorBab: 'BAB I', judul: raw.bab1Judul || 'LANDASAN FILOSOFIS & PRINSIP KERAPATAN KESALAHAN', isi: raw.bab1Isi || '', tipeKhusus: 'standar' },
        { id: 'bab-2', nomorBab: 'BAB II', judul: raw.bab2Judul || 'KLASIFIKASI KESALAHAN & RASIO PEMBOBOTAN 2 : 1', isi: raw.bab2Isi || '', tipeKhusus: 'rasio_penalti' },
        { id: 'bab-3', nomorBab: 'BAB III', judul: raw.bab3Judul || 'FORMULA MATEMATIS & GUARDRAILS (BATAS AMAN)', isi: raw.bab3Isi || '', tipeKhusus: 'formula_guardrail' },
        { id: 'bab-4', nomorBab: 'BAB IV', judul: raw.bab4Judul || 'PENERAPAN PADA MODUL NON-AL-QUR\'AN (IQRO / YANBU\'A / TILAWATI)', isi: raw.bab4Isi || '', tipeKhusus: 'standar' },
        { id: 'bab-5', nomorBab: 'BAB V', judul: raw.bab5Judul || 'KEBIJAKAN PROTEKSI MAKSIMAL 1X POTONG PER SESI (NON-DOUBLE PENALTY)', isi: raw.bab5Isi || '', tipeKhusus: 'standar' },
        { id: 'bab-6', nomorBab: 'BAB VI', judul: raw.bab6Judul || 'TABEL SIMULASI & PREDIKAT KELULUSAN', isi: raw.bab6Isi || '', tipeKhusus: 'tabel_simulasi' }
      ];
    } else {
      daftarBab = DEFAULT_SOP_BAB_LIST;
    }
  }

  // Normalize elementOverrides if present
  const normalizedOverrides: Record<string, SopStandarPenilaianDoc> = {};
  if (raw.elementOverrides && typeof raw.elementOverrides === 'object') {
    Object.entries(raw.elementOverrides).forEach(([eId, docVal]: [string, any]) => {
      if (docVal && typeof docVal === 'object') {
        const itemDaftarBab = Array.isArray(docVal.daftarBab) && docVal.daftarBab.length > 0
          ? docVal.daftarBab
          : DEFAULT_SOP_BAB_LIST;
        normalizedOverrides[eId] = {
          ...docVal,
          id: docVal.id || `sop_elemen_${eId}`,
          elemenId: eId,
          elemenNama: docVal.elemenNama || '',
          nomorSK: docVal.nomorSK || raw.nomorSK || '04/SK-KUR/2026',
          judulUtama: docVal.judulUtama || `STANDAR OPERASIONAL PROSEDUR (SOP) PENILAIAN ELEMEN ${docVal.elemenNama || eId}`,
          subjudul: docVal.subjudul || raw.subjudul || '',
          pengantar: docVal.pengantar || raw.pengantar || '',
          daftarBab: itemDaftarBab,
          penandatangan1Jabatan: docVal.penandatangan1Jabatan || raw.penandatangan1Jabatan || 'Koordinator Tahsin & Mutabaah',
          penandatangan1Nama: docVal.penandatangan1Nama || raw.penandatangan1Nama || '',
          penandatangan2Jabatan: docVal.penandatangan2Jabatan || raw.penandatangan2Jabatan || 'Mudir / Pimpinan Lembaga',
          penandatangan2Nama: docVal.penandatangan2Nama || raw.penandatangan2Nama || '',
          updatedAt: docVal.updatedAt || new Date().toISOString()
        };
      }
    });
  }

  return {
    ...DEFAULT_SOP_PENILAIAN_DOC,
    ...raw,
    daftarBab,
    elementOverrides: normalizedOverrides
  };
};

export type FeatureFlagStatus = 'off' | 'beta' | 'live';
export type FeatureCategory = 'guru' | 'siswa' | 'admin' | 'all';

export interface FeatureFlagItem {
  id: string;
  name: string;
  category: FeatureCategory;
  description: string;
  status: FeatureFlagStatus;
  versionTag: string;
  badgeText?: string;
  highlightPoints?: string[];
  allowedUserIds?: string[]; // Optional specific overrides; if empty/undefined, all betaTesterUserIds get access
  updatedAt?: string;
}

export interface FeatureLabConfig {
  id: string; // 'feature_lab_config'
  features: FeatureFlagItem[];
  deletedFeatureIds?: string[]; // List of permanently deleted/cancelled feature IDs
  betaTesterUserIds: string[]; // List of user IDs (guru, siswa, admin) who are designated testers
  notes?: string;
  updatedAt: string;
  updatedBy?: string;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlagItem[] = [
  {
    id: 'guru_cockpit_modern',
    name: 'Cockpit Modern Halaqah: Live Sesi & Kartu Aksi Cepat',
    category: 'guru',
    description: 'Tampilan interaktif sesi halaqah aktif di bagian atas dashboard guru, dilengkapi penghitung progres setoran hari ini (sudah setor vs belum) dan tombol aksi cepat ke santri bimbingan.',
    status: 'beta',
    versionTag: 'v1.1-preview',
    badgeText: 'Unggulan',
    highlightPoints: [
      'Banner sesi aktif interaktif dengan indikator waktu mengajar',
      'Pelacak progres santri yang sudah menghadap vs antrean',
      'Tombol satu sentuhan untuk input setoran atau WhatsApp wali'
    ],
    updatedAt: '2026-09-15T00:00:00Z'
  },
  {
    id: 'guru_tren_setoran_mingguan',
    name: 'Grafik Tren Setoran 7 Hari Terakhir (Dashboard Guru)',
    category: 'guru',
    description: 'Menampilkan visual grafik batang aktivitas mutabaah dan frekuensi setoran harian halaqah bimbingan selama 7 hari terakhir di beranda dashboard guru.',
    status: 'off',
    versionTag: 'v1.0-stable',
    badgeText: 'Grafik Mutabaah',
    highlightPoints: [
      'Visual batang dinamis frekuensi setoran harian halaqah',
      'Kalkulasi otomatis rata-rata setoran per hari',
      'Penanda visual waktu hari ini'
    ],
    updatedAt: '2026-09-15T00:00:00Z'
  },
  {
    id: 'guru_mushaf_assistant',
    name: 'Mushaf Assistant & Tagging Cepat Tajwid',
    category: 'guru',
    description: 'Panel koreksi ayat mushaf terpadu dengan tombol cepat menandai kekeliruan tajwid/makhraj (Ghunnah, Mad, Qalqalah, dsb.) secara instan untuk catatan santri.',
    status: 'beta',
    versionTag: 'v1.0-beta',
    badgeText: 'Eksperimental',
    highlightPoints: [
      'Mode layar fokus tanpa distraksi navigasi',
      'Tombol tag tajwid 1-klik yang otomatis menyusun teks catatan',
      'Penyimpanan instan ke riwayat setoran siswa'
    ],
    updatedAt: '2026-09-15T00:00:00Z'
  },
  {
    id: 'guru_voice_feedback',
    name: 'Audio Feedback & Voice Notes Bimbingan',
    category: 'guru',
    description: 'Memungkinkan guru merekam pesan suara ringkas contoh pelafalan ayat yang benar untuk didengar kembali oleh santri dan orang tua di rumah.',
    status: 'off',
    versionTag: 'v0.9-alpha',
    badgeText: 'Konsep',
    highlightPoints: [
      'Perekaman audio browser langsung tanpa aplikasi tambahan',
      'Pemutar audio terpasang langsung di buku mutabaah siswa',
      'Dukungan kompresi hemat kuota untuk perangkat mobile'
    ],
    updatedAt: '2026-09-15T00:00:00Z'
  },
  {
    id: 'guru_khatam_milestone',
    name: 'Kartu Apresiasi & Pencapaian Khatam Santri',
    category: 'guru',
    description: 'Kartu sorotan otomatis untuk santri yang menuntaskan 1 Juz atau khatam Al-Qur\'an, dengan generator piagam mini dan template ucapan apresiasi.',
    status: 'beta',
    versionTag: 'v1.0-beta',
    badgeText: 'Motivasi',
    highlightPoints: [
      'Notifikasi otomatis saat santri menyelesaikan juz terakhir',
      'Opsi cetak sertifikat mini instan',
      'Template ucapan doa dan selamat untuk grup wali santri'
    ],
    updatedAt: '2026-09-15T00:00:00Z'
  },
  {
    id: 'siswa_interactive_analytics',
    name: 'Visual Grafik Capaian & Target Progresif Siswa',
    category: 'siswa',
    description: 'Grafik interaktif tren setoran dan kecepatan hafalan santri dengan visualisasi juz interaktif dan proyeksi estimasi tanggal khatam.',
    status: 'beta',
    versionTag: 'v1.1-preview',
    badgeText: 'Analitik',
    highlightPoints: [
      'Grafik tren predikat nilai (Mumtaz, Jayyid, Maqbul)',
      'Estimasi cerdas tanggal target juz tercapai',
      'Lencana pencapaian murojaah konsisten'
    ],
    updatedAt: '2026-09-15T00:00:00Z'
  },
  {
    id: 'siswa_murojaah_mandiri',
    name: 'Mode Murojaah Mandiri & Timer Hafalan',
    category: 'siswa',
    description: 'Fitur pendamping santri mengulang hafalan sendiri di asrama/rumah dengan pengingat waktu dan checklist ayat yang sering terlupa.',
    status: 'off',
    versionTag: 'v0.8-alpha',
    badgeText: 'Fitur Santri',
    highlightPoints: [
      'Timer fokus murojaah dengan interval tartil',
      'Daftar ayat yang perlu diperhatikan berdasar feedback ustadz',
      'Pencatatan durasi latihan harian'
    ],
    updatedAt: '2026-09-15T00:00:00Z'
  },
  {
    id: 'admin_live_monitoring',
    name: 'Pusat Pemantauan Real-Time Halaqah Aktif',
    category: 'admin',
    description: 'Dashboard monitor menyeluruh bagi pimpinan/admin untuk melihat halaqah mana yang saat ini sedang aktif berlangsung, kehadiran ustadz, dan statistik setoran hari ini.',
    status: 'beta',
    versionTag: 'v1.2-preview',
    badgeText: 'Pimpinan',
    highlightPoints: [
      'Peta halaqah berjalan secara langsung (Real-Time)',
      'Statistik presensi guru & santri hari ini dalam 1 layar',
      'Alert jika ada halaqah yang belum dimulai melebihi jam operasional'
    ],
    updatedAt: '2026-09-15T00:00:00Z'
  }
];

export const DEFAULT_FEATURE_LAB_CONFIG: FeatureLabConfig = {
  id: 'feature_lab_config',
  features: DEFAULT_FEATURE_FLAGS,
  deletedFeatureIds: [],
  betaTesterUserIds: ['gru-koordinator'], // Admin utama tidak dimasukkan karena berperan sebagai pengelola/penentu fitur
  notes: 'Konfigurasi eksperimen fitur bertahap dan penguji beta M-Halaqah.',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Administrator'
};

export interface SystemVersionInfo {
  major: number;
  minor: number;
  patch: number;
  versionString: string; // e.g. "v1.2"
  revisionCount: number;
  lastDataHash: string;
  lastExportedAt?: string;
  lastExportedBy?: string;
  lastExportedFilename?: string;
}

export interface SystemSnapshotStats {
  admins: number;
  gurus: number;
  siswas: number;
  kelases: number;
  halaqahs: number;
  moduls: number;
  modulPages: number;
  setorans: number;
  murojaahBerpasangans: number;
  jenisAssessments: number;
  templateAssessments: number;
  assessmentRecords: number;
  pengajuanAssessments: number;
  syahadahs: number;
  syahadahRules: number;
  elemenSettings: number;
  mataPelajarans: number;
  tajwidCategories: number;
  programs: number;
  programBabs: number;
  programMateris: number;
  programLatihans: number;
  programAsesmens: number;
  programAsesmenSettings: number;
  programPraktikSettings: number;
  programEnrollments: number;
  pengumumans: number;
  capaianPembelajarans: number;
  tujuanPembelajarans: number;
  bankAktivitas: number;
  rppTemplates: number;
  guruRppList: number;
  guruAttendance: number;
  studentAttendance: number;
  guruSchedules: number;
  chatMessages: number;
  virtualMeetings: number;
  auditLogs: number;
}

export interface SystemSnapshotMeta {
  app: string;
  version: string;
  revision: number;
  timestamp: string;
  exportedBy: string;
  exportedByEmail?: string;
  totalRecords: number;
  stats: SystemSnapshotStats;
  notes?: string;
  checksum: string;
  formatVersion: number;
}

export interface SystemSnapshotData {
  metadata: SystemSnapshotMeta;
  data: {
    admins?: Admin[];
    gurus?: Guru[];
    siswas?: Siswa[];
    kelases?: Kelas[];
    halaqahs?: Halaqah[];
    moduls?: Modul[];
    modulPages?: Record<string, string>;
    setorans?: Setoran[];
    murojaahBerpasangans?: MurojaahBerpasangan[];
    jenisAssessments?: JenisAssessment[];
    templateAssessments?: TemplateAssessment[];
    assessmentRecords?: AssessmentRecord[];
    pengajuanAssessments?: PengajuanAssessment[];
    syahadahs?: Syahadah[];
    syahadahRules?: SyahadahRule[];
    elemenSettings?: ElemenSetting[];
    mataPelajarans?: MataPelajaran[];
    tajwidCategories?: TajwidCategory[];
    strukturLembaga?: StrukturLembaga;
    programs?: ProgramKeilmuan[];
    programBabs?: ProgramBab[];
    programMateris?: ProgramMateri[];
    programLatihans?: ProgramLatihan[];
    programAsesmens?: ProgramAsesmenKognitifQuestion[];
    programAsesmenSettings?: ProgramAsesmenKognitifSetting[];
    programPraktikSettings?: ProgramAsesmenPraktikSetting[];
    programEnrollments?: ProgramEnrollment[];
    pengumumans?: Pengumuman[];
    capaianPembelajarans?: CapaianPembelajaran[];
    tujuanPembelajarans?: TujuanPembelajaran[];
    bankAktivitas?: BankAktivitasPembelajaran[];
    rppTemplates?: RppTemplateAdmin[];
    guruRppList?: GuruRppDokumen[];
    guruAttendance?: any[];
    studentAttendance?: any[];
    guruSchedules?: JadwalMengajarGuru[];
    rekapPresensiTemplate?: RekapPresensiPdfTemplate;
    pwaSettings?: PwaSettings;
    institutionTheme?: InstitutionThemeSettings;
    quranLinesConfig?: QuranLinesConfig;
    generalTargets?: any;
    studentTargets?: Record<string, any>;
    chatMessages?: ChatMessage[];
    virtualMeetings?: VirtualMeeting[];
    auditLogs?: AuditLog[];
  };
}








export interface MasterPenalties {
  baseScore: number;
  rubrikDeductions: Record<string, number>;
  oncePerSessionCategories?: string[];
  // Proporsional Baris Settings
  standarBarisQuran?: number; // default: 15
  minBarisQuran?: number; // default: 5
  maxBarisQuran?: number; // default: 15
  bobotLahnJaliy?: number; // default: 4 (Total acuan = 15*4 = 60)
  bobotLahnKhafiy?: number; // default: 2 (Total acuan = 15*2 = 30)
  bobotKlasifikasi?: Record<string, number>; // Bobot dinamis per ID tipe klasifikasi kesalahan
  defaultBarisNonQuran?: number; // default: 6
  minBarisNonQuranRatio?: number; // default: 0.5 (or min 3 baris)
}
