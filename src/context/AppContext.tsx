/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Admin, 
  Guru, 
  Siswa, 
  Kelas, 
  Halaqah, 
  Modul, 
  Setoran, 
  AuditLog, 
  Session, 
  UserRole, 
  StatusAktif,
  TipeModul,
  JenisKelamin,
  ElemenSetting,
  MasterPenalties,
  ElemenTargetScope,
  CustomPageLine,
  QuranLinesConfig,
  KategoriKesalahanPageRule,
  ChatMessage,
  VirtualMeeting,
  MurojaahBerpasangan,
  KategoriAssessment,
  JenisAssessment,
  RubrikItem,
  SyaratKelulusan,
  TemplateAssessment,
  AssessmentRecord,
  Syahadah,
  SyahadahRule,
  SyahadahSettings,
  MataPelajaran,
  SubElemen,
  StrukturLembaga,
  NonQuranFont,
  TajwidCategory,
  TajwidSubcategory,
  KategoriKesalahanTipe,
  KlasifikasiKesalahanType,
  ProgramKeilmuan,
  ProgramBab,
  ProgramMateri,
  ProgramLatihan,
  ProgramAsesmenKognitifQuestion,
  ProgramAsesmenKognitifSetting,
  ProgramAsesmenPraktikSetting,
  ProgramEnrollment,
  PengajuanAssessment,
  PwaSettings,
  PresensiGuruRecord,
  JadwalMengajarGuru,
  StatusKehadiranGuru,
  RekapPresensiPdfTemplate,
  Pengumuman,
  TargetAudiensPengumuman,
  KategoriPengumuman,
  CapaianPembelajaran,
  TujuanPembelajaran,
  BankAktivitasPembelajaran,
  RppTemplateAdmin,
  GuruRppDokumen,
  PilotTestingConfig,
  SopStandarPenilaianDoc,
  DEFAULT_SOP_PENILAIAN_DOC,
  normalizeSopPenilaianDoc,
  FeatureLabConfig,
  FeatureFlagItem,
  FeatureFlagStatus,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_FEATURE_LAB_CONFIG,
  SystemSnapshotData,
  SystemSnapshotMeta,
  SystemSnapshotStats,
  SystemVersionInfo,
  HijriCalendarSetting,
  DEFAULT_HIJRI_SETTING,
  CapaianBacaanAyatConfig,
  CapaianBacaanSesiPertemuan,
  CapaianBacaanTrialSettings,
  InstitutionThemeSettings,
  UserColorThemePreference,
  isAdminUtama
} from '../types';
import {
  DEFAULT_INSTITUTION_THEME,
  DEFAULT_USER_COLOR_THEME,
  applyThemeColorsToDocument,
  resolveEffectiveThemeColors
} from '../utils/themeColorEngine';
import { DEFAULT_PRESET_CAPAIAN_BACAAN, DAFTAR_114_SURAT } from '../data/capaianBacaanPresets';
import { 
  computeDataSignature,
  getSystemVersionInfo,
  calculateNextVersion,
  saveSystemVersionInfo,
  generateSnapshotFilename,
  downloadSnapshotFile,
  parseAndValidateSnapshot
} from '../utils/backupRestoreManager';
import { DEFAULT_REKAP_PRESENSI_TEMPLATE, getSavedPresensiTemplate } from '../components/ManageSetoran';
import { isGuruSelfSubmittedAttendance } from '../utils/studentAttendanceHelper';
import {
  DEFAULT_INSTITUTION_NAME,
  DEFAULT_INSTITUTION_ABBR,
  isLegacyInstitutionBranding,
  isLegacyPersonalData,
  resolveInstitutionName,
  sanitizePwaSettings,
  sanitizeStrukturLembaga,
  sanitizeRekapPresensiTemplate
} from '../utils/brandingHelper';
import { 
  INITIAL_CAPAIAN_PEMBELAJARAN,
  INITIAL_TUJUAN_PEMBELAJARAN,
  INITIAL_BANK_AKTIVITAS,
  INITIAL_RPP_TEMPLATES,
  INITIAL_GURU_RPP_LIST,
  INITIAL_PILOT_CONFIG
} from '../data/mockAdministrasiData';
import { 
  INITIAL_ADMINS, 
  INITIAL_GURUS, 
  INITIAL_KELAS, 
  INITIAL_HALAQAH, 
  INITIAL_SISWAS, 
  INITIAL_MODULS, 
  INITIAL_SETORANS, 
  INITIAL_AUDIT_LOGS,
  DEMO_SISWA_IDS,
  DEMO_GURU_IDS,
  DEMO_ADMIN_IDS,
  isDemoUser
} from '../data/mockTemplates';
import { 
  onSnapshot, 
  collection, 
  doc, 
  getDoc,
  setDoc as rawSetDoc, 
  updateDoc as rawUpdateDoc,
  deleteDoc, 
  getDocs,
  query,
  where,
  disableNetwork,
  enableNetwork,
  getDocsFromServer,
  getDocsFromCache,
  getDocFromCache,
  limit
} from 'firebase/firestore';
import { getFirebaseDb, clearCachedFirebaseDb, getActiveFirebaseConfig, isFirebaseConfigured } from '../lib/firebaseShare';
import { compressBase64Image } from '../utils/imageCompressor';
import { normalizeTeacherName, normalizeHalaqahKey } from '../utils/studentAttendanceHelper';
import { DEFAULT_APP_ID, DEFAULT_KEY_ID, DEFAULT_PRIVATE_KEY_PEM } from '../lib/jitsiToken';
import { isWithinOperationalHours, getWIBTime, getOperationalStatus, OPERATIONAL_CONFIG } from '../utils/operationalHours';
import { stripDummyProfilePhoto } from '../components/Avatar';

// Auto-persist active project config to local storage to protect user credentials across clean GitHub exports
if (typeof window !== 'undefined') {
  try {
    const custom = localStorage.getItem('mh_custom_firebase_config');
    if (!custom && isFirebaseConfigured()) {
      const active = getActiveFirebaseConfig();
      if (active && active.projectId && active.apiKey && !active.apiKey.includes('YOUR_')) {
        localStorage.setItem('mh_custom_firebase_config', JSON.stringify(active, null, 2));
      }
    }
  } catch {}
}

const DEFAULT_ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // SHA-256('admin123')

function sha256Fallback(ascii: string): string {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6]; hash[6] = hash[5]; hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2]; hash[2] = hash[1]; hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(unescape(encodeURIComponent(password)));
}

function isLegacyAdminAccount(admin: Partial<Admin> | null | undefined): boolean {
  if (!admin) return false;
  return (
    isLegacyPersonalData(admin.email) ||
    isLegacyInstitutionBranding(admin.email) ||
    isLegacyPersonalData(admin.namaLengkap)
  );
}

function sanitizeAdminRecord(admin: Admin): Admin {
  const cleanPhoto = stripDummyProfilePhoto(admin.fotoProfil);
  if (admin.id === 'adm-1' && isLegacyAdminAccount(admin)) {
    return {
      ...INITIAL_ADMINS[0],
      ...admin,
      id: 'adm-1',
      namaLengkap: INITIAL_ADMINS[0].namaLengkap,
      email: INITIAL_ADMINS[0].email,
      password: DEFAULT_ADMIN_PASSWORD_HASH,
      nomorHp: INITIAL_ADMINS[0].nomorHp,
      fotoProfil: cleanPhoto,
      adminRole: 'SUPER_ADMIN',
      permissions: INITIAL_ADMINS[0].permissions,
    };
  }
  if ((admin.id === 'adm-1' || admin.id === 'adm-default') && !admin.password) {
    return {
      ...admin,
      email: admin.email || INITIAL_ADMINS[0].email,
      password: DEFAULT_ADMIN_PASSWORD_HASH,
      fotoProfil: cleanPhoto,
    };
  }
  if (cleanPhoto !== (admin.fotoProfil || '')) {
    return {
      ...admin,
      fotoProfil: cleanPhoto,
    };
  }
  return admin;
}

function ensureDefaultAdminInList(list: Admin[]): Admin[] {
  const sanitized = list.map(sanitizeAdminRecord);
  const hasDefaultEmail = sanitized.some(
    a => (a.email || '').trim().toLowerCase() === INITIAL_ADMINS[0].email.toLowerCase()
  );
  if (hasDefaultEmail) return sanitized;
  const hasAdm1 = sanitized.some(a => a.id === 'adm-1');
  const defaultAdmin: Admin = {
    ...INITIAL_ADMINS[0],
    id: hasAdm1 ? 'adm-default' : 'adm-1',
    password: DEFAULT_ADMIN_PASSWORD_HASH,
  };
  return [defaultAdmin, ...sanitized];
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

let db: any = null;
try {
  db = getFirebaseDb();
} catch (e) {
  console.warn("Could not load Firestore at module load time. It will be loaded lazily on App mount.", e);
}

let globalSetQuotaExceeded: ((val: boolean) => void) | null = null;
let globalSetOffline: ((val: boolean) => void) | null = null;

export const cleanDataForFirestore = (obj: any): any => {
  if (obj === undefined) return undefined;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => {
        const cleaned = cleanDataForFirestore(item);
        return cleaned === undefined ? null : cleaned;
      });
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) return obj.toISOString();
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value !== undefined) {
        const subCleaned = cleanDataForFirestore(value);
        if (subCleaned !== undefined) {
          cleaned[key] = subCleaned;
        }
      }
    }
    return cleaned;
  }
  return obj;
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const sanitized = cleanDataForFirestore(data);
  if (options) {
    return rawSetDoc(docRef, sanitized, options);
  }
  return rawSetDoc(docRef, sanitized);
};

export const updateDoc = async (docRef: any, data: any) => {
  const sanitized = cleanDataForFirestore(data);
  return rawUpdateDoc(docRef, sanitized);
};

export const safeSetDoc = setDoc;
export const safeUpdateDoc = updateDoc;

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  const isQuota = errMessage.toLowerCase().includes('quota') || 
                  errMessage.toLowerCase().includes('exhausted') || 
                  errMessage.toLowerCase().includes('resource-exhausted') ||
                  errMessage.toLowerCase().includes('limit');

  const isNetworkOrOffline = 
    errMessage.toLowerCase().includes('unavailable') || 
    errMessage.toLowerCase().includes('could not reach cloud firestore backend') ||
    errMessage.toLowerCase().includes('offline') ||
    errMessage.toLowerCase().includes('network') ||
    errMessage.toLowerCase().includes('failed to connect') ||
    errMessage.toLowerCase().includes('connection') ||
    errMessage.toLowerCase().includes('target id already exists') ||
    errMessage.toLowerCase().includes('target_id_already_exists');

  const isPermissionOrNotFound = errMessage.toLowerCase().includes('permission') || 
                                 errMessage.toLowerCase().includes('insufficient') ||
                                 errMessage.toLowerCase().includes('not found') ||
                                 errMessage.toLowerCase().includes('not-found');

  if (isPermissionOrNotFound) {
    const isAlreadyFallback = typeof window !== 'undefined' && localStorage.getItem('mh_use_default_db_fallback') === 'true';
    if (!isAlreadyFallback && typeof window !== 'undefined') {
      const activeConfig = getActiveFirebaseConfig();
      if (!activeConfig || !activeConfig.firestoreDatabaseId) {
        console.warn('Permission denied or database not found on named database. Activating automatic fallback to (default) database...');
        try {
          localStorage.setItem('mh_use_default_db_fallback', 'true');
          setTimeout(() => {
            window.location.reload();
          }, 150);
        } catch (e) {
          console.error('Failed to set fallback flag:', e);
        }
        return; // Stop processing to allow reload
      } else {
        console.warn('Firestore error (Permission/NotFound) encountered on active named database:', errMessage);
      }
    }
  }

  if (isQuota) {
    console.warn('Firestore Status (Quota Exceeded):', errMessage);
    if (globalSetQuotaExceeded) {
      globalSetQuotaExceeded(true);
    }
    try {
      localStorage.setItem('mh_quota_exceeded_flag', 'true');
    } catch {}
    return; // Do not throw, keep App running locally
  }

  if (isNetworkOrOffline) {
    console.warn('Firestore Status (Operating Offline):', errMessage);
    if (globalSetOffline) {
      globalSetOffline(true);
    }
    return; // Do not throw, keep App running locally
  }

  if (operationType === OperationType.GET) {
    console.warn(`[Firestore Read Handled on '${path}']`, errMessage);
    return; // Do not crash the application on read failures, allow offline / cached data to serve smoothly
  }

  console.error('Firestore Error: ', errMessage);

  // Parse custom credentials session info for the diagnostic details requested by Firebase Integration Skill guidelines
  let userId = null;
  let email = null;
  let role = null;
  try {
    const sessionStr = localStorage.getItem('mh_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.user) {
        userId = session.user.id || session.user.email || null;
        email = session.user.email || null;
        role = session.user.role || null;
      }
    }
  } catch (e) {
    // Ignore JSON parsing errors
  }

  const errInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId,
      email,
      role,
      emailVerified: true,
      isAnonymous: false,
    }
  };

  throw new Error(JSON.stringify(errInfo));
}

// Helper to prepare Modul for Firestore (since Firestore doesn't support nested arrays)
export function toFirestoreModul(modul: any): any {
  if (!modul) return modul;
  const processed = { ...modul };
  
  // Clean heavy image and PDF data fields to avoid exceeding Firestore 1MB document limit
  delete processed.halamanGambar;
  delete processed.halamanGambarPerJilid;
  delete processed.thumbnailHalaman;
  delete processed.pdfBase64;

  if (processed.penjelasanHalamanPerJilid && Array.isArray(processed.penjelasanHalamanPerJilid)) {
    processed.penjelasanHalamanPerJilid = processed.penjelasanHalamanPerJilid.map((subArray: any) => {
      if (Array.isArray(subArray)) {
        return { items: subArray };
      }
      return subArray;
    });
  }
  if (processed.teksHalamanPerJilid && Array.isArray(processed.teksHalamanPerJilid)) {
    processed.teksHalamanPerJilid = processed.teksHalamanPerJilid.map((subArray: any) => {
      if (Array.isArray(subArray)) {
        return { items: subArray };
      }
      return subArray;
    });
  }
  if (processed.jumlahBarisPerHalamanPerJilid && Array.isArray(processed.jumlahBarisPerHalamanPerJilid)) {
    processed.jumlahBarisPerHalamanPerJilid = processed.jumlahBarisPerHalamanPerJilid.map((subArray: any) => {
      if (Array.isArray(subArray)) {
        return { items: subArray };
      }
      return subArray;
    });
  }
  if (processed.isiAyat && Array.isArray(processed.isiAyat)) {
    processed.isiAyat = processed.isiAyat.map((ayat: any) => {
      const cleanAyat: any = { ...ayat };
      Object.keys(cleanAyat).forEach(key => {
        if (cleanAyat[key] === undefined) {
          delete cleanAyat[key];
        }
      });
      return cleanAyat;
    });
  }
  return processed;
}

// Helper to save individual page images and PDFs to a segmented collection 'modulPages' to bypass the 1MB Firestore limit
export async function savePagesToCloud(modulId: string, isMultiJilid: boolean, halamanGambar: string[], halamanGambarPerJilid: string[][], pdfBase64?: string) {
  try {
    if (pdfBase64) {
      await setDoc(doc(db, 'modulPages', `${modulId}_-1_-1`), {
        modulId,
        jilidIdx: -1,
        pageIdx: -1,
        imageUrl: pdfBase64
      });
    }

    if (isMultiJilid && halamanGambarPerJilid) {
      for (let j = 0; j < halamanGambarPerJilid.length; j++) {
        const pages = halamanGambarPerJilid[j] || [];
        for (let p = 0; p < pages.length; p++) {
          const base64 = pages[p] || '';
          if (base64) {
            await setDoc(doc(db, 'modulPages', `${modulId}_${j}_${p}`), {
              modulId,
              jilidIdx: j,
              pageIdx: p,
              imageUrl: base64
            });
          }
        }
      }
    } else if (halamanGambar) {
      for (let p = 0; p < halamanGambar.length; p++) {
        const base64 = halamanGambar[p] || '';
        if (base64) {
          await setDoc(doc(db, 'modulPages', `${modulId}_0_${p}`), {
            modulId,
            jilidIdx: 0,
            pageIdx: p,
            imageUrl: base64
          });
        }
      }
    }
  } catch (error) {
    console.error("Gagal menyimpan halaman ke cloud: ", error);
  }
}

// Helper to restore Modul from Firestore
export function fromFirestoreModul(modul: any): any {
  if (!modul) return modul;
  const processed = { ...modul };
  if (processed.halamanGambarPerJilid && Array.isArray(processed.halamanGambarPerJilid)) {
    processed.halamanGambarPerJilid = processed.halamanGambarPerJilid.map((item: any) => {
      if (item && typeof item === 'object' && Array.isArray(item.pages)) {
        return item.pages;
      }
      return item;
    });
  }
  if (processed.penjelasanHalamanPerJilid && Array.isArray(processed.penjelasanHalamanPerJilid)) {
    processed.penjelasanHalamanPerJilid = processed.penjelasanHalamanPerJilid.map((item: any) => {
      if (item && typeof item === 'object' && Array.isArray(item.items)) {
        return item.items;
      }
      return item;
    });
  }
  if (processed.teksHalamanPerJilid && Array.isArray(processed.teksHalamanPerJilid)) {
    processed.teksHalamanPerJilid = processed.teksHalamanPerJilid.map((item: any) => {
      if (item && typeof item === 'object' && Array.isArray(item.items)) {
        return item.items;
      }
      return item;
    });
  }
  if (processed.jumlahBarisPerHalamanPerJilid && Array.isArray(processed.jumlahBarisPerHalamanPerJilid)) {
    processed.jumlahBarisPerHalamanPerJilid = processed.jumlahBarisPerHalamanPerJilid.map((item: any) => {
      if (item && typeof item === 'object' && Array.isArray(item.items)) {
        return item.items;
      }
      return item;
    });
  }
  return processed;
}

const isDbEmpty = async () => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false; // Never assume DB is empty when offline
    }

    const isPurged = typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';
    if (isPurged) {
      // If demo data was already purged, never report DB as empty to avoid re-seeding dummy data
      return false;
    }
    
    // Prevent accidental seeding when offline/cache-miss by checking if we have valid local state
    if (typeof window !== 'undefined') {
      try {
        const localAdmins = localStorage.getItem('mh_admins');
        if (localAdmins && JSON.parse(localAdmins).length > 0) return false;
        const localGurus = localStorage.getItem('mh_gurus');
        if (localGurus && JSON.parse(localGurus).length > 0) return false;
        const localSession = localStorage.getItem('mh_session');
        if (localSession) {
          const sess = JSON.parse(localSession);
          if (sess?.user?.id) return false;
        }
      } catch (err) {
        console.warn('Failed to parse local storage check', err);
      }
    }

    const snapAdmin = await getDocs(query(collection(db, 'admins'), limit(1)));
    if (!snapAdmin.empty) return false;
    const snapSiswa = await getDocs(query(collection(db, 'siswas'), limit(1)));
    if (!snapSiswa.empty) return false;
    const snapGuru = await getDocs(query(collection(db, 'gurus'), limit(1)));
    if (!snapGuru.empty) return false;
    return true;
  } catch (e) {
    console.warn('Database query check notice:', e);
    const errMessage = e instanceof Error ? e.message : String(e);
    if (errMessage.toLowerCase().includes('quota') || errMessage.toLowerCase().includes('exhausted') || errMessage.toLowerCase().includes('resource-exhausted')) {
      if (globalSetQuotaExceeded) {
        globalSetQuotaExceeded(true);
      }
    }
    return false;
  }
};

const INITIAL_JENIS_ASSESSMENTS: JenisAssessment[] = [
  {
    id: 'jenis-1',
    elemenId: 'tilawah',
    elemenNama: 'Tahfidz Al-Qur\'an',
    kategori: KategoriAssessment.TAHFIDZ,
    namaAssessment: 'Tasmi\' Juz 30',
    deskripsi: 'Ujian hafalan Juz 30 penuh secara lisan dengan sekali duduk sekurangnya dihadiri keluarga / santri lain.',
    statusAktif: true,
    sumberAssessment: 'internal',
    modulInternalOption: 'AL_QURAN',
    quranJuz: '30',
    quranRentangAyatStart: 1,
    quranRentangAyatEnd: 10,
    quranRentangHalamanStart: 1,
    quranRentangHalamanEnd: 604,
    quranHalamanUjianOption: 'guru',
    quranHalamanUjianCount: 3,
    quranMetodeTahfidz: 'Sambung Ayat'
  } as any,
  {
    id: 'jenis-3',
    elemenId: 'tilawah',
    elemenNama: 'Tahfidz Al-Qur\'an',
    kategori: KategoriAssessment.TAHFIDZ,
    namaAssessment: 'Tasmi\' 1/4 Juz 29',
    deskripsi: 'Ujian Tasmi\' kelancaran hafalan 1/4 Juz 29 (Surat Al-Mulk s/d Surat Al-Haqqah).',
    statusAktif: true,
    sumberAssessment: 'internal',
    modulInternalOption: 'AL_QURAN',
    quranJuz: '29',
    quranRentangSuratStart: 'Al-Mulk',
    quranRentangSuratEnd: 'Al-Haqqah',
    quranTahfidzRentangSuratStart: 'Al-Mulk',
    quranTahfidzRentangSuratEnd: 'Al-Haqqah',
    quranRentangAyatStart: 1,
    quranRentangAyatEnd: 52,
    quranHalamanUjianOption: 'guru',
    quranHalamanUjianCount: 3,
    quranMetodeTahfidz: 'Tasmi\''
  } as any,
  {
    id: 'jenis-2',
    elemenId: 'iqra',
    elemenNama: 'Tahfidz Jilid',
    kategori: KategoriAssessment.IQRA,
    namaAssessment: 'Kenaikan Jilid Iqra 1-3',
    deskripsi: 'Ujian komprehensif kelayakan membaca kelancaran jilid iqra pra-tahfidz.',
    statusAktif: true,
    sumberAssessment: 'internal',
    modulInternalOption: 'IQRA'
  } as any
];

const INITIAL_TEMPLATE_ASSESSMENTS: TemplateAssessment[] = [
  {
    id: 'tpl-3',
    namaTemplate: "Rubrik Penilaian Tasmi' 1/4 Juz 29",
    jenisAssessmentId: 'jenis-3',
    jenisAssessmentIds: ['jenis-3'],
    namaJenisAssessment: "Tasmi' 1/4 Juz 29",
    namaJenisAssessments: ["Tasmi' 1/4 Juz 29"],
    petunjukPelaksanaan: 'Uji santri melafalkan hafalan Surat Al-Mulk, Al-Qalam, dan Al-Haqqah secara berturut-turut atau acak.',
    rubrik: [
      { kriteria: 'Kelancaran (Fashohah)', bobotPersen: 40, poinPengurangan: 5 },
      { kriteria: 'Tajwid (Makharijul Huruf)', bobotPersen: 40, poinPengurangan: 5 },
      { kriteria: 'Adab & Tartil', bobotPersen: 20, poinPengurangan: 5 }
    ],
    syaratMinScore: 80,
    statusAktif: true,
    modelPengujian: 'Tunggal',
    sumberAssessment: 'internal',
    modulInternalOption: 'AL_QURAN',
    quranJuz: '29',
    quranRentangSuratStart: 'Al-Mulk',
    quranRentangSuratEnd: 'Al-Haqqah',
    quranTahfidzRentangSuratStart: 'Al-Mulk',
    quranTahfidzRentangSuratEnd: 'Al-Haqqah',
    rubrikPenilaian: [],
    syaratKelulusan: { nilaiMinimal: 80, tanpaKesalahanFatal: false, rekomendasiLayakHarus: false }
  } as any,
  {
    id: 'tpl-1',
    namaTemplate: 'Tasmi\' Juz 30 Standar',
    jenisAssessmentId: 'jenis-1',
    jenisAssessmentIds: ['jenis-1'],
    namaJenisAssessment: 'Tasmi\' Juz 30',
    namaJenisAssessments: ['Tasmi\' Juz 30'],
    petunjukPelaksanaan: 'Uji santri dengan membacakan satu surat awal di Juz 30, lalu minta santri melanjutkan ayat berikutnya secara acak.',
    rubrik: [
      { kriteria: 'Kelancaran (Fashohah)', bobotPersen: 40 },
      { kriteria: 'Tajwid (Makharijul Huruf)', bobotPersen: 40 },
      { kriteria: 'Adab & Tartil', bobotPersen: 20 }
    ],
    syaratMinScore: 85,
    statusAktif: true,
    modelPengujian: 'Tunggal',
    sumberAssessment: 'internal',
    modulInternalOption: 'AL_QURAN',
    quranJuz: '30',
    rubrikPenilaian: [],
    syaratKelulusan: { nilaiMinimal: 85, tanpaKesalahanFatal: false, rekomendasiLayakHarus: false }
  } as any,
  {
    id: 'tpl-2',
    namaTemplate: 'Ujian Kenaikan Iqra Jilid 1',
    jenisAssessmentId: 'jenis-2',
    jenisAssessmentIds: ['jenis-2'],
    namaJenisAssessment: 'Kenaikan Jilid Iqra 1-3',
    namaJenisAssessments: ['Kenaikan Jilid Iqra 1-3'],
    petunjukPelaksanaan: 'Santri diminta melafalkan secara acak minimal 10 baris pada halaman evaluasi akhir jilid 1.',
    rubrik: [
      { kriteria: 'Kelancaran Bacaan', bobotPersen: 50 },
      { kriteria: 'Makhraj Huruf', bobotPersen: 50 }
    ],
    syaratMinScore: 75,
    statusAktif: true,
    modelPengujian: 'Tunggal',
    sumberAssessment: 'internal',
    modulInternalOption: 'IQRA',
    rubrikPenilaian: [],
    syaratKelulusan: { nilaiMinimal: 75, tanpaKesalahanFatal: false, rekomendasiLayakHarus: false }
  } as any
];

const seedDatabase = async () => {
  try {
    const isPurged = typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';
    const defaultHash = await hashPassword('pass123');
    // 1. Admins - Always ensure Super Admin (adm-1) is present, while preserving custom name & credentials
    let existingAdmin1: any = null;
    try {
      const snapAdmin1 = await getDoc(doc(db, 'admins', INITIAL_ADMINS[0].id));
      if (snapAdmin1.exists()) {
        existingAdmin1 = snapAdmin1.data();
      }
    } catch (e) {
      // offline or cache miss
    }

    if (!existingAdmin1 && typeof window !== 'undefined') {
      try {
        const localAdminsStr = localStorage.getItem('mh_admins');
        if (localAdminsStr) {
          const parsed = JSON.parse(localAdminsStr);
          const found = parsed.find((a: any) => a.id === INITIAL_ADMINS[0].id);
          if (found) existingAdmin1 = found;
        }
        if (!existingAdmin1) {
          const localSessionStr = localStorage.getItem('mh_session');
          if (localSessionStr) {
            const parsedSess = JSON.parse(localSessionStr);
            if (parsedSess?.user?.id === INITIAL_ADMINS[0].id) {
              existingAdmin1 = parsedSess.user;
            }
          }
        }
      } catch (err) {}
    }

    const admin1PasswordHash = await hashPassword('admin123');
    const isExistingLegacyAdmin = isLegacyAdminAccount(existingAdmin1);
    const admin1ToSave = {
      ...INITIAL_ADMINS[0],
      ...(isExistingLegacyAdmin ? {} : (existingAdmin1 || {})),
      namaLengkap: isExistingLegacyAdmin ? INITIAL_ADMINS[0].namaLengkap : (existingAdmin1?.namaLengkap || INITIAL_ADMINS[0].namaLengkap),
      password: isExistingLegacyAdmin ? admin1PasswordHash : (existingAdmin1?.password || admin1PasswordHash),
      email: isExistingLegacyAdmin ? INITIAL_ADMINS[0].email : (existingAdmin1?.email || INITIAL_ADMINS[0].email),
      nomorHp: isExistingLegacyAdmin ? INITIAL_ADMINS[0].nomorHp : (existingAdmin1?.nomorHp || INITIAL_ADMINS[0].nomorHp),
      fotoProfil: stripDummyProfilePhoto(existingAdmin1?.fotoProfil || INITIAL_ADMINS[0].fotoProfil),
    };
    await setDoc(doc(db, 'admins', INITIAL_ADMINS[0].id), admin1ToSave, { merge: true });

    if (!isPurged) {
      for (const a of INITIAL_ADMINS.slice(1)) {
        await setDoc(doc(db, 'admins', a.id), { ...a, password: defaultHash }, { merge: true });
      }
    }
    // 2. Gurus - Only seed coordinator gru-koordinator if demo data is purged, preserving custom name & credentials
    let existingGuruKoordinator: any = null;
    try {
      const snapGuruB = await getDoc(doc(db, 'gurus', 'gru-koordinator'));
      if (snapGuruB.exists()) {
        existingGuruKoordinator = snapGuruB.data();
      }
    } catch (e) {}

    if (!existingGuruKoordinator && typeof window !== 'undefined') {
      try {
        const localGurusStr = localStorage.getItem('mh_gurus');
        if (localGurusStr) {
          const parsed = JSON.parse(localGurusStr);
          const found = parsed.find((g: any) => g.id === 'gru-koordinator');
          if (found) existingGuruKoordinator = found;
        }
        if (!existingGuruKoordinator) {
          const localSessionStr = localStorage.getItem('mh_session');
          if (localSessionStr) {
            const parsedSess = JSON.parse(localSessionStr);
            if (parsedSess?.user?.id === 'gru-koordinator') {
              existingGuruKoordinator = parsedSess.user;
            }
          }
        }
      } catch (err) {}
    }

    const koordinatorGuru = INITIAL_GURUS.find(g => g.id === 'gru-koordinator') || INITIAL_GURUS[0];
    const guruToSave = {
      ...koordinatorGuru,
      ...(existingGuruKoordinator || {}),
      namaLengkap: existingGuruKoordinator?.namaLengkap || koordinatorGuru.namaLengkap,
      password: existingGuruKoordinator?.password || defaultHash,
      email: existingGuruKoordinator?.email || koordinatorGuru.email,
      nomorHp: existingGuruKoordinator?.nomorHp || koordinatorGuru.nomorHp,
      fotoProfil: stripDummyProfilePhoto(existingGuruKoordinator?.fotoProfil || koordinatorGuru.fotoProfil),
    };

    if (!isPurged) {
      for (const g of INITIAL_GURUS) {
        if (g.id === 'gru-koordinator') {
          await setDoc(doc(db, 'gurus', g.id), guruToSave, { merge: true });
        } else {
          await setDoc(doc(db, 'gurus', g.id), { ...g, password: defaultHash }, { merge: true });
        }
      }
    } else {
      await setDoc(doc(db, 'gurus', 'gru-koordinator'), guruToSave, { merge: true });
    }
    // 3. Siswas - Never re-seed dummy students if purged
    if (!isPurged) {
      for (const s of INITIAL_SISWAS) {
        await setDoc(doc(db, 'siswas', s.id), { ...s, password: defaultHash });
      }
    }
    // 4. Kelases
    for (const c of INITIAL_KELAS) {
      await setDoc(doc(db, 'kelases', c.id), c);
    }
    // 5. Halaqahs
    for (const h of INITIAL_HALAQAH) {
      await setDoc(doc(db, 'halaqahs', h.id), h);
    }
    // 6. Moduls
    for (const m of INITIAL_MODULS) {
      await setDoc(doc(db, 'moduls', m.id), toFirestoreModul(m));
      await savePagesToCloud(m.id, m.isMultiJilid || false, m.halamanGambar || [], m.halamanGambarPerJilid || []);
    }
    // 7. Setorans
    for (const s of INITIAL_SETORANS) {
      await setDoc(doc(db, 'setorans', s.id), s);
    }
    // 7b. Jenis & Template Assessments
    for (const ja of INITIAL_JENIS_ASSESSMENTS) {
      await setDoc(doc(db, 'jenisAssessments', ja.id), ja);
    }
    for (const ta of INITIAL_TEMPLATE_ASSESSMENTS) {
      await setDoc(doc(db, 'templateAssessments', ta.id), ta);
    }
    // 8. ElemenSettings
    const defaultElemenSettings = [
      {
        id: 'tilawah',
        nama: 'Tilawah',
        tipeModul: TipeModul.AL_QURAN,
        jenisSetoranList: ['Binnadzar', 'Tahsin', 'Baru', 'Murojaah']
      },
      {
        id: 'tahfidz',
        nama: 'Tahfidz',
        tipeModul: TipeModul.AL_QURAN,
        jenisSetoranList: ['Hafalan Baru', 'Murojaah', 'Sambung Ayat', 'Tasmi\'']
      },
      {
        id: 'qiroah',
        nama: 'Qiroah',
        tipeModul: TipeModul.NON_AL_QURAN,
        jenisSetoranList: ['Baru', 'Murojaah']
      }
    ];
    for (const e of defaultElemenSettings) {
      await setDoc(doc(db, 'elemenSettings', e.id), e);
    }
    // 9. ChatMessages
    const initialChatMessages = [
      {
        id: 'chat-1',
        senderId: 'adm-1',
        senderNama: 'Administrator Utama',
        senderRole: UserRole.ADMIN,
        receiverId: 'all_roles',
        receiverNama: 'Semua Guru & Siswa',
        receiverRole: 'ALL',
        message: "Assalamu'alaikum wr. wb., selamat datang di Portal Monitoring Tahfidz Halaqah. Mari kita bimbing hafalan para santri secara istiqomah.",
        timestamp: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString()
      },
      {
        id: 'chat-2',
        senderId: 'adm-1',
        senderNama: 'Administrator Utama',
        senderRole: UserRole.ADMIN,
        receiverId: 'gru-1',
        receiverNama: 'Ustadz Muhammad Rayhan, Lc',
        receiverRole: UserRole.GURU,
        message: 'Ustadz Rayhan, mohon cek laporan setoran minggu ini ya, ada beberapa siswa yang belum diinput.',
        timestamp: new Date(Date.now() - 3600 * 24 * 2 * 1000).toISOString()
      },
      {
        id: 'chat-3',
        senderId: 'gru-1',
        senderNama: 'Ustadz Muhammad Rayhan, Lc',
        senderRole: UserRole.GURU,
        receiverId: 'adm-1',
        receiverNama: 'Administrator Utama',
        receiverRole: UserRole.ADMIN,
        message: "Na'am ustadz, segera saya lengkapi semua setorannya sore ini setelah halaqah selesai.",
        timestamp: new Date(Date.now() - 3600 * 20 * 2 * 1000).toISOString()
      },
      {
        id: 'chat-4',
        senderId: 'gru-1',
        senderNama: 'Ustadz Muhammad Rayhan, Lc',
        senderRole: UserRole.GURU,
        receiverId: 'sis-1',
        receiverNama: 'Ziyad Al-Fatih',
        receiverRole: UserRole.SISWA,
        message: 'Ziyad, hafalan Surat An-Naba juz 30 sudah sangat lancar. Pertahankan dan lanjutkan ke An-Naziat ya.',
        timestamp: new Date(Date.now() - 3600 * 12 * 1000).toISOString()
      },
      {
        id: 'chat-5',
        senderId: 'sis-1',
        senderNama: 'Ziyad Al-Fatih',
        senderRole: UserRole.SISWA,
        receiverId: 'gru-1',
        receiverNama: 'Ustadz Muhammad Rayhan, Lc',
        receiverRole: UserRole.GURU,
        message: 'Syukron ustadz, insyaAllah hari ini saya setorkan 10 ayat awal An-Naziat.',
        timestamp: new Date(Date.now() - 3600 * 11 * 1000).toISOString()
      },
      {
        id: 'chat-6',
        senderId: 'sis-1',
        senderNama: 'Ziyad Al-Fatih',
        senderRole: UserRole.SISWA,
        receiverId: 'sis-2',
        receiverNama: 'Aisyah Humaira',
        receiverRole: UserRole.SISWA,
        message: 'Aisyah, ada file modul baru di menu Modul selain Al-Quran. Sudah di-download?',
        timestamp: new Date(Date.now() - 3600 * 8 * 1000).toISOString()
      }
    ];
    for (const m of initialChatMessages) {
      await setDoc(doc(db, 'chatMessages', m.id), m);
    }
    // 10. VirtualMeetings
    const initialMeetings = [
      {
        id: 'meet-1',
        title: 'Halaqah Subuh - Murojaah Juz 30',
        halaqahId: 'hq-1',
        halaqahNama: 'Halaqah Abu Bakar',
        guruId: 'gru-1',
        guruNama: 'Ustadz Muhammad Rayhan, Lc',
        agenda: 'Setoran hafalan baru Surat An-Naziat dan Murojaah Surat An-Naba bersama-sama.',
        isActive: true,
        meetingUrl: 'https://meet.jit.si/Halaqah-Subuh-AbuBakar',
        startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        participantsCount: 4
      }
    ];
    for (const m of initialMeetings) {
      await setDoc(doc(db, 'virtualMeetings', m.id), m);
    }
    // 11. AuditLogs
    for (const l of INITIAL_AUDIT_LOGS) {
      await setDoc(doc(db, 'auditLogs', l.id), l);
    }
    // 12. MataPelajarans
    const initialMataPelajarans: MataPelajaran[] = [
      {
        id: 'mapel-1',
        nama: 'Al-Qur\'an',
        deskripsi: 'Pembelajaran utama hafalan, pemahaman, dan bacaan santri.',
        statusAktif: true,
        elemenList: [
          { id: 'sub-elem-1', nama: 'Tahfidz', deskripsi: 'Hafalan Al-Qur\'an santri', statusAktif: true },
          { id: 'sub-elem-2', nama: 'Tilawah', deskripsi: 'Seni dan kemampuan membaca santri', statusAktif: true }
        ],
        tanggalDibuat: '2026-06-11T00:00:00.000Z'
      },
      {
        id: 'mapel-2',
        nama: 'Kitab Kuning',
        deskripsi: 'Kajian kitab turats fiqih, nahwu shorof, dan akhlak.',
        statusAktif: true,
        elemenList: [
          { id: 'sub-elem-3', nama: 'Fiqih', deskripsi: 'Hukum dan amaliyah ibadah harian', statusAktif: true },
          { id: 'sub-elem-4', nama: 'Nahwu Shorof', deskripsi: 'Kaidah bahasa arab', statusAktif: true }
        ],
        tanggalDibuat: '2026-06-11T00:00:00.000Z'
      }
    ];
    for (const m of initialMataPelajarans) {
      await setDoc(doc(db, 'mataPelajarans', m.id), m);
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('permission') || msg.includes('Permission') || msg.includes('PERMISSION_DENIED')) {
      console.warn('Firestore database rules note: Write permissions restricted. Publish firestore.rules in Firebase Console to enable central cloud sync.', msg);
    } else {
      console.warn('Notice seeding Firestore database:', err);
    }
  }
};

interface AppContextType {
  admins: Admin[];
  gurus: Guru[];
  siswas: Siswa[];
  rawSiswas?: Siswa[];
  kelases: Kelas[];
  halaqahs: Halaqah[];
  moduls: Modul[];
  setorans: Setoran[];
  rawSetorans?: Setoran[];
  auditLogs: AuditLog[];
  currentSession: Session;
  selectedGuruHalaqahId: string | null;
  setSelectedGuruHalaqahId: (id: string | null) => void;
  darkMode: boolean;
  themePreference: 'light' | 'dark' | 'system';
  setThemePreference: (pref: 'light' | 'dark' | 'system') => void;
  elemenSettings: ElemenSetting[];
  masterPenalties: MasterPenalties;
  setMasterPenalties: (m: MasterPenalties) => void;
  saveMasterPenalties: (m: MasterPenalties) => Promise<void>;
  tajwidCategories: TajwidCategory[];
  createTajwidCategory: (nama: string, deskripsi?: string, subcategories?: TajwidSubcategory[], tipe?: KategoriKesalahanTipe) => Promise<void> | void;
  updateTajwidCategory: (id: string, nama: string, deskripsi?: string, subcategories?: TajwidSubcategory[], tipe?: KategoriKesalahanTipe) => Promise<void> | void;
  deleteTajwidCategory: (id: string) => Promise<void> | void;
  reorderTajwidCategories: (newOrderedList: TajwidCategory[]) => Promise<void> | void;
  klasifikasiKesalahanTypes: KlasifikasiKesalahanType[];
  createKlasifikasiKesalahanType: (val: Omit<KlasifikasiKesalahanType, 'isDefault'>) => Promise<void> | void;
  updateKlasifikasiKesalahanType: (id: string, val: Partial<KlasifikasiKesalahanType>) => Promise<void> | void;
  deleteKlasifikasiKesalahanType: (id: string) => Promise<void> | void;
  resetKlasifikasiKesalahanTypes: () => Promise<void> | void;
  isQuotaExceeded: boolean;
  isOffline: boolean;
  isCheckingConnection: boolean;
  isSiswaOperationalOpen: boolean;

  // Shared States from Firestore
  typography: {
    selectedFontPreset: string;
    customFont: { name: string; url: string; fileName: string } | null;
    ornamentStyle: 'bracket' | 'flower' | 'square' | 'circle';
    applyFontGlobally: boolean;
  };
  saveTypography: (data: Partial<{
    selectedFontPreset: string;
    customFont: { name: string; url: string; fileName: string } | null;
    ornamentStyle: 'bracket' | 'flower' | 'square' | 'circle';
    applyFontGlobally: boolean;
  }>) => Promise<void>;

  modulCategories: string[];
  saveModulCategories: (categories: string[]) => Promise<void>;

  quranLinesConfig: QuranLinesConfig;
  saveQuranLinesConfig: (config: QuranLinesConfig) => Promise<void>;

  nonQuranFonts: NonQuranFont[];
  saveNonQuranFonts: (fonts: NonQuranFont[]) => Promise<void>;

  generalTargets: {
    pekanan: string;
    bulanan: string;
    kuartal: string;
    semester: string;
    tahunan: string;
    config?: any;
  };
  saveGeneralTargets: (targets: {
    pekanan: string;
    bulanan: string;
    kuartal: string;
    semester: string;
    tahunan: string;
    config?: any;
  }) => Promise<void>;

  studentTargets: Record<string, any>;
  saveStudentTargets: (targets: Record<string, any>) => Promise<void>;

  guruAttendance: any[];
  saveGuruAttendance: (attendance: any[]) => Promise<void>;

  studentAttendance: any[];
  saveStudentAttendance: (attendance: any[]) => Promise<void>;

  guruSchedules: JadwalMengajarGuru[];
  saveGuruSchedules: (schedules: JadwalMengajarGuru[]) => Promise<void>;

  keepNotes: any[];
  saveKeepNotes: (notes: any[]) => Promise<void>;

  studentBookmarks: any[];
  saveStudentBookmarks: (bookmarks: any[]) => Promise<void>;

  whiteboardCanvas: string;
  saveWhiteboardCanvas: (canvasJson: string) => Promise<void>;

  whiteboardPins: any[];
  saveWhiteboardPins: (pins: any[]) => Promise<void>;

  // Actions
  login: (identifier: string, passwordPlain: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  setDarkMode: (dark: boolean) => void;
  addLog: (action: string, rincian: string) => Promise<void> | void;
  updateElemenSetting: (id: string, jenisSetoranList: string[]) => Promise<void> | void;
  createElemenSetting: (
    nama: string,
    tipeModul: TipeModul,
    jenisSetoranList: string[],
    kompetensi?: string,
    referensiModulId?: string,
    useJumlahBaris?: boolean,
    tipeKesalahan?: 'lahn_jaliy' | 'lahn_khafiy' | 'tajwid' | 'dasar' | 'all' | 'none' | 'page_based',
    usePageRules?: boolean,
    pageRules?: KategoriKesalahanPageRule[],
    useRubrikPenilaian?: boolean,
    useMasterPenalties?: boolean,
    baseScore?: number,
    rumusPenilaian?: 'absolut' | 'proporsional_baris',
    rubrikDeductions?: Record<string, number>,
    rubrikPredikat?: Array<{ minScore: number; maxScore: number; predikat: string; lulus: boolean }>,
    useCustomLinesConfig?: boolean,
    defaultLinesPerPage?: number,
    customPageLines?: CustomPageLine[],
    targetScope?: ElemenTargetScope,
    targetHalaqahIds?: string[],
    oncePerSessionCategories?: string[],
    bobotKlasifikasi?: Record<string, number>,
    bobotLahnJaliy?: number,
    bobotLahnKhafiy?: number,
    standarBarisQuran?: number,
    minBarisQuran?: number,
    maxBarisQuran?: number
  ) => Promise<void> | void;
  updateElemenSettingFull: (
    id: string,
    nama: string,
    tipeModul: TipeModul,
    jenisSetoranList: string[],
    kompetensi?: string,
    referensiModulId?: string,
    useJumlahBaris?: boolean,
    tipeKesalahan?: 'lahn_jaliy' | 'lahn_khafiy' | 'tajwid' | 'dasar' | 'all' | 'none' | 'page_based',
    usePageRules?: boolean,
    pageRules?: KategoriKesalahanPageRule[],
    useRubrikPenilaian?: boolean,
    useMasterPenalties?: boolean,
    baseScore?: number,
    rumusPenilaian?: 'absolut' | 'proporsional_baris',
    rubrikDeductions?: Record<string, number>,
    rubrikPredikat?: Array<{ minScore: number; maxScore: number; predikat: string; lulus: boolean }>,
    useCustomLinesConfig?: boolean,
    defaultLinesPerPage?: number,
    customPageLines?: CustomPageLine[],
    targetScope?: ElemenTargetScope,
    targetHalaqahIds?: string[],
    oncePerSessionCategories?: string[],
    bobotKlasifikasi?: Record<string, number>,
    bobotLahnJaliy?: number,
    bobotLahnKhafiy?: number,
    standarBarisQuran?: number,
    minBarisQuran?: number,
    maxBarisQuran?: number
  ) => Promise<void> | void;
  deleteElemenSetting: (id: string) => Promise<void> | void;
  saveElemenSettingObject: (elem: ElemenSetting) => Promise<void> | void;
  toggleStudentElemenOverride: (
    siswaId: string,
    elemenId: string,
    grant: boolean,
    catatan?: string,
    guruNama?: string
  ) => Promise<void> | void;

  // Admin Management
  createAdmin: (admin: Omit<Admin, 'id' | 'tanggalDibuat'>) => Promise<void> | void;
  updateAdmin: (id: string, admin: Partial<Admin>) => Promise<void> | void;
  deleteAdmin: (id: string) => Promise<void> | void;

  // Guru Management
  createGuru: (guru: Omit<Guru, 'id' | 'tanggalDibuat'>) => Promise<void> | void;
  updateGuru: (id: string, guru: Partial<Guru>) => Promise<void> | void;
  deleteGuru: (id: string) => Promise<void> | void;
  importGurus: (list: Array<Omit<Guru, 'id' | 'tanggalDibuat'>>) => Promise<void> | void;

  // Siswa Management
  createSiswa: (siswa: Omit<Siswa, 'id' | 'tanggalDibuat'>) => Promise<void> | void;
  updateSiswa: (id: string, siswa: Partial<Siswa>) => Promise<void> | void;
  deleteSiswa: (id: string) => Promise<void> | void;
  importSiswas: (list: Array<Omit<Siswa, 'id' | 'tanggalDibuat'>>) => Promise<void> | void;

  // Demo Data Purge & Safety
  purgeAllDemoData: () => Promise<boolean>;
  isDemoPurged: boolean;
  deletedUsersTrash: Array<{
    id: string;
    role: 'guru' | 'siswa';
    nama: string;
    deletedAt: string;
    data: any;
  }>;
  restoreFromTrash: (trashId: string) => Promise<void>;
  permanentDeleteTrash: (trashId: string) => void;

  // Kelas Management
  createKelas: (kelas: Omit<Kelas, 'id'>) => Promise<void> | void;
  updateKelas: (id: string, kelas: Partial<Kelas>) => Promise<void> | void;
  deleteKelas: (id: string) => Promise<void> | void;

  // Halaqah Management
  createHalaqah: (halaqah: Omit<Halaqah, 'id'>) => Promise<void> | void;
  updateHalaqah: (id: string, halaqah: Partial<Halaqah>) => Promise<void> | void;
  deleteHalaqah: (id: string) => Promise<void> | void;

  // Modul Management
  createModul: (modul: Omit<Modul, 'id'>) => Promise<void> | void;
  updateModul: (id: string, modul: Partial<Modul>) => Promise<void> | void;
  deleteModul: (id: string) => Promise<void> | void;

  // Setoran / Capaian Management
  createSetoran: (setoran: Omit<Setoran, 'id' | 'guruId' | 'guruNama'>) => Promise<void> | void;
  updateSetoran: (id: string, setoran: Partial<Setoran>) => Promise<void> | void;
  deleteSetoran: (id: string) => Promise<void> | void;

  // Murojaah Berpasangan Management
  murojaahBerpasangans: MurojaahBerpasangan[];
  createMurojaahBerpasangan: (murojaah: Omit<MurojaahBerpasangan, 'id'>) => Promise<void> | void;
  updateMurojaahBerpasangan: (id: string, murojaah: Partial<MurojaahBerpasangan>) => Promise<void> | void;
  deleteMurojaahBerpasangan: (id: string) => Promise<void> | void;

  // Integrated Assessment Management
  jenisAssessments: JenisAssessment[];
  createJenisAssessment: (val: Omit<JenisAssessment, 'id'>) => Promise<void> | void;
  updateJenisAssessment: (id: string, val: Partial<JenisAssessment>) => Promise<void> | void;
  deleteJenisAssessment: (id: string) => Promise<void> | void;

  templateAssessments: TemplateAssessment[];
  createTemplateAssessment: (val: Omit<TemplateAssessment, 'id'>) => Promise<void> | void;
  updateTemplateAssessment: (id: string, val: Partial<TemplateAssessment>) => Promise<void> | void;
  deleteTemplateAssessment: (id: string) => Promise<void> | void;

  assessmentRecords: AssessmentRecord[];
  createAssessmentRecord: (val: Omit<AssessmentRecord, 'id'>) => Promise<string>;
  updateAssessmentRecord: (id: string, val: Partial<AssessmentRecord>) => Promise<void> | void;
  deleteAssessmentRecord: (id: string) => Promise<void> | void;

  pengajuanAssessments: PengajuanAssessment[];
  createPengajuanAssessment: (val: Omit<PengajuanAssessment, 'id'>) => Promise<string>;
  updatePengajuanAssessment: (id: string, val: Partial<PengajuanAssessment>) => Promise<void>;
  deletePengajuanAssessment: (id: string) => Promise<void>;

  syahadahs: Syahadah[];
  createSyahadah: (val: Omit<Syahadah, 'id'>) => Promise<void> | void;
  updateSyahadah: (id: string, val: Partial<Syahadah>) => Promise<void>;
  deleteSyahadah: (id: string) => Promise<void> | void;

  syahadahRules: SyahadahRule[];
  createSyahadahRule: (val: Omit<SyahadahRule, 'id'>) => Promise<void>;
  updateSyahadahRule: (id: string, val: Partial<SyahadahRule>) => Promise<void>;
  deleteSyahadahRule: (id: string) => Promise<void>;

  syahadahSettings: SyahadahSettings;
  updateSyahadahSettings: (settings: Partial<SyahadahSettings>) => Promise<void>;

  // Mata Pelajaran Management
  mataPelajarans: MataPelajaran[];
  createMataPelajaran: (val: Omit<MataPelajaran, 'id' | 'tanggalDibuat'>) => Promise<void>;
  updateMataPelajaran: (id: string, val: Partial<MataPelajaran>) => Promise<void>;
  deleteMataPelajaran: (id: string) => Promise<void>;

  // Struktur Lembaga Management
  strukturLembaga: StrukturLembaga;
  saveStrukturLembaga: (val: StrukturLembaga) => Promise<void>;

  // Database actions
  backupDatabase: () => string;
  restoreDatabase: (json: string, options?: { mode?: 'replace' | 'merge' }) => Promise<boolean> | boolean;
  createSystemSnapshot: (options?: { customNotes?: string; manualVersion?: string; bumpType?: 'minor' | 'major' }) => { snapshot: SystemSnapshotData; filename: string };
  downloadMasterBackup: (options?: { customNotes?: string; manualVersion?: string; bumpType?: 'minor' | 'major' }) => { filename: string; snapshot: SystemSnapshotData };
  restoreSystemSnapshot: (snapshotData: any, options?: { mode?: 'replace' | 'merge'; keepCurrentAdminSession?: boolean }) => Promise<{ success: boolean; message: string; details?: any }>;
  systemVersionInfo: SystemVersionInfo;
  clearDatabase: () => Promise<void> | void;
  tryReconnectCloud: () => Promise<void>;
  refreshDatabase: () => Promise<void>;
  resetOfflineAndQuotaState: () => Promise<void>;

  // Chat Actions
  chatMessages: ChatMessage[];
  sendChatMessage: (receiverId: string, receiverNama: string, receiverRole: UserRole | 'ALL', message: string) => Promise<void> | void;
  editChatMessage: (id: string, newMessage: string) => Promise<void>;
  deleteChatMessage: (id: string) => Promise<void>;

  // Video Call / Conference (Halaqah Virtual) Actions
  virtualMeetings: VirtualMeeting[];
  createVirtualMeeting: (title: string, halaqahId: string, halaqahNama: string, agenda: string, meetingUrl?: string) => Promise<void> | void;
  endVirtualMeeting: (id: string) => Promise<void> | void;
  jitsiConfig: {
    appId: string;
    keyId: string;
    privateKey: string;
  };
  saveJitsiConfig: (config: { appId: string; keyId: string; privateKey: string }) => Promise<void>;
  saveOperationalHours: (openTime: string, closeTime: string) => Promise<void>;

  // Program Keilmuan (LMS)
  programs: ProgramKeilmuan[];
  programBabs: ProgramBab[];
  programMateris: ProgramMateri[];
  programLatihans: ProgramLatihan[];
  programAsesmens: ProgramAsesmenKognitifQuestion[];
  programAsesmenSettings: ProgramAsesmenKognitifSetting[];
  programPraktikSettings: ProgramAsesmenPraktikSetting[];
  programEnrollments: ProgramEnrollment[];

  createProgram: (prog: Omit<ProgramKeilmuan, 'id' | 'tanggalDibuat'>) => Promise<void>;
  updateProgram: (id: string, prog: Partial<ProgramKeilmuan>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;

  createProgramBab: (bab: Omit<ProgramBab, 'id'>) => Promise<void>;
  updateProgramBab: (id: string, bab: Partial<ProgramBab>) => Promise<void>;
  deleteProgramBab: (id: string) => Promise<void>;

  createProgramMateri: (mat: Omit<ProgramMateri, 'id'>) => Promise<void>;
  updateProgramMateri: (id: string, mat: Partial<ProgramMateri>) => Promise<void>;
  deleteProgramMateri: (id: string) => Promise<void>;

  createProgramLatihan: (lat: Omit<ProgramLatihan, 'id'>) => Promise<void>;
  updateProgramLatihan: (id: string, lat: Partial<ProgramLatihan>) => Promise<void>;
  deleteProgramLatihan: (id: string) => Promise<void>;

  createProgramAsesmen: (q: Omit<ProgramAsesmenKognitifQuestion, 'id'>) => Promise<void>;
  updateProgramAsesmen: (id: string, q: Partial<ProgramAsesmenKognitifQuestion>) => Promise<void>;
  deleteProgramAsesmen: (id: string) => Promise<void>;

  saveProgramAsesmenSetting: (setting: ProgramAsesmenKognitifSetting) => Promise<void>;
  saveProgramPraktikSetting: (setting: ProgramAsesmenPraktikSetting) => Promise<void>;

  createProgramEnrollment: (enrollment: Omit<ProgramEnrollment, 'id'>) => Promise<void>;
  updateProgramEnrollment: (id: string, enrollment: Partial<ProgramEnrollment>) => Promise<void>;
  deleteProgramEnrollment: (id: string) => Promise<void>;

  pwaSettings: PwaSettings;
  updatePwaSettings: (val: Partial<PwaSettings>) => Promise<void>;
  institutionTheme: InstitutionThemeSettings;
  saveInstitutionTheme: (val: Partial<InstitutionThemeSettings>) => Promise<void>;
  activeUserColorTheme: UserColorThemePreference;
  updateCurrentUserColorTheme: (pref: UserColorThemePreference) => Promise<void>;
  effectiveThemeColors: ReturnType<typeof resolveEffectiveThemeColors>;
  hijriSetting: HijriCalendarSetting;
  updateHijriSetting: (val: Partial<HijriCalendarSetting>) => Promise<void>;
  docTemplates: any[];
  updateDocTemplates: (templates: any[]) => Promise<void>;
  rekapPresensiTemplate: RekapPresensiPdfTemplate;
  saveRekapPresensiTemplate: (template: RekapPresensiPdfTemplate) => Promise<void>;

  // Papan Pengumuman & Broadcast Lembaga
  pengumumans: Pengumuman[];
  createPengumuman: (val: Omit<Pengumuman, 'id' | 'createdAt'>) => Promise<string>;
  updatePengumuman: (id: string, val: Partial<Pengumuman>) => Promise<void>;
  deletePengumuman: (id: string) => Promise<void>;
  markPengumumanAsRead: (id: string, userId: string) => Promise<void>;

  // Administrasi Guru (CP, TP, Bank Aktivitas, RPP Modul Ajar, Pilot Testing)
  capaianPembelajarans: CapaianPembelajaran[];
  tujuanPembelajarans: TujuanPembelajaran[];
  bankAktivitas: BankAktivitasPembelajaran[];
  rppTemplates: RppTemplateAdmin[];
  guruRppList: GuruRppDokumen[];
  pilotTestingConfig: PilotTestingConfig;
  isGuruEligibleForRpp: (guruId?: string) => boolean;

  createCapaianPembelajaran: (val: Omit<CapaianPembelajaran, 'id' | 'tanggalDibuat'>) => Promise<void>;
  updateCapaianPembelajaran: (id: string, val: Partial<CapaianPembelajaran>) => Promise<void>;
  deleteCapaianPembelajaran: (id: string) => Promise<void>;

  createTujuanPembelajaran: (val: Omit<TujuanPembelajaran, 'id' | 'tanggalDibuat'>) => Promise<void>;
  updateTujuanPembelajaran: (id: string, val: Partial<TujuanPembelajaran>) => Promise<void>;
  deleteTujuanPembelajaran: (id: string) => Promise<void>;

  createBankAktivitas: (val: Omit<BankAktivitasPembelajaran, 'id'>) => Promise<void>;
  updateBankAktivitas: (id: string, val: Partial<BankAktivitasPembelajaran>) => Promise<void>;
  deleteBankAktivitas: (id: string) => Promise<void>;

  createRppTemplate: (val: Omit<RppTemplateAdmin, 'id' | 'tanggalDibuat'>) => Promise<void>;
  updateRppTemplate: (id: string, val: Partial<RppTemplateAdmin>) => Promise<void>;
  deleteRppTemplate: (id: string) => Promise<void>;

  createGuruRpp: (val: Omit<GuruRppDokumen, 'id' | 'tanggalDibuat'>) => Promise<string>;
  updateGuruRpp: (id: string, val: Partial<GuruRppDokumen>) => Promise<void>;
  deleteGuruRpp: (id: string) => Promise<void>;

  savePilotTestingConfig: (val: PilotTestingConfig) => Promise<void>;

  // SOP Standar Penilaian Resmi Dokumen
  sopPenilaianDoc: SopStandarPenilaianDoc;
  saveSopPenilaianDoc: (val: SopStandarPenilaianDoc) => Promise<void>;
  resetSopPenilaianDoc: () => Promise<void>;
  saveSopElemenDoc: (elemenId: string, val: SopStandarPenilaianDoc) => Promise<void>;
  deleteSopElemenDoc: (elemenId: string) => Promise<void>;
  getSopForElemen: (elemenId?: string) => { doc: SopStandarPenilaianDoc; isCustom: boolean };

  // Laboratorium Fitur & Penguji Upgrade (Feature Lab & Beta Testing Ring)
  featureLabConfig: FeatureLabConfig;
  saveFeatureLabConfig: (val: FeatureLabConfig) => Promise<void>;
  toggleFeatureStatus: (featureId: string, status: FeatureFlagStatus) => Promise<void>;
  deleteFeatureFlag: (featureId: string) => Promise<void>;
  createFeatureFlag: (val: Omit<FeatureFlagItem, 'id' | 'updatedAt'>) => Promise<void>;
  resetFeatureFlagsToDefault: () => Promise<void>;
  toggleBetaTester: (userId: string) => Promise<void>;
  isFeatureEnabledForUser: (featureId: string, userId?: string, userRole?: string) => boolean;
  isUserBetaTester: (userId?: string) => boolean;

  // Instrumen Capaian Bacaan Ayat
  capaianBacaanConfigs: CapaianBacaanAyatConfig[];
  capaianBacaanSesiList: CapaianBacaanSesiPertemuan[];
  capaianBacaanTrialSettings: CapaianBacaanTrialSettings;
  saveCapaianBacaanConfig: (val: CapaianBacaanAyatConfig) => Promise<void>;
  deleteCapaianBacaanConfig: (id: string) => Promise<void>;
  saveCapaianBacaanSesi: (val: CapaianBacaanSesiPertemuan) => Promise<void>;
  updateCapaianBacaanSesiNama: (id: string, nama: string) => Promise<void>;
  deleteCapaianBacaanSesi: (id: string) => Promise<void>;
  updateCapaianBacaanTrialSettings: (val: Partial<CapaianBacaanTrialSettings>) => Promise<void>;
  isGuruEligibleForCapaianBacaan: (guruOrUserId?: string) => boolean;
  reorderCapaianBacaanConfigs: (newList: CapaianBacaanAyatConfig[]) => Promise<void>;
  seedCapaianBacaanPresets: (targetSuratNomor?: number) => Promise<void> | void;
  syncCapaianBacaanConfigsToFirestore: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-1',
    senderId: 'adm-1',
    senderNama: 'Administrator Utama',
    senderRole: UserRole.ADMIN,
    receiverId: 'all_roles',
    receiverNama: 'Semua Guru & Siswa',
    receiverRole: 'ALL',
    message: "Assalamu'alaikum wr. wb., selamat datang di Portal Monitoring Tahfidz Halaqah. Mari kita bimbing hafalan para santri secara istiqomah.",
    timestamp: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString()
  },
  {
    id: 'chat-2',
    senderId: 'adm-1',
    senderNama: 'Administrator Utama',
    senderRole: UserRole.ADMIN,
    receiverId: 'gru-1',
    receiverNama: 'Ustadz Muhammad Rayhan, Lc',
    receiverRole: UserRole.GURU,
    message: 'Ustadz Rayhan, mohon cek laporan setoran minggu ini ya, ada beberapa siswa yang belum diinput.',
    timestamp: new Date(Date.now() - 3600 * 24 * 2 * 1000).toISOString()
  },
  {
    id: 'chat-3',
    senderId: 'gru-1',
    senderNama: 'Ustadz Muhammad Rayhan, Lc',
    senderRole: UserRole.GURU,
    receiverId: 'adm-1',
    receiverNama: 'Administrator Utama',
    receiverRole: UserRole.ADMIN,
    message: "Na'am ustadz, segera saya lengkapi semua setorannya sore ini setelah halaqah selesai.",
    timestamp: new Date(Date.now() - 3600 * 20 * 2 * 1000).toISOString()
  },
  {
    id: 'chat-4',
    senderId: 'gru-1',
    senderNama: 'Ustadz Muhammad Rayhan, Lc',
    senderRole: UserRole.GURU,
    receiverId: 'sis-1',
    receiverNama: 'Ziyad Al-Fatih',
    receiverRole: UserRole.SISWA,
    message: 'Ziyad, hafalan Surat An-Naba juz 30 sudah sangat lancar. Pertahankan dan lanjutkan ke An-Naziat ya.',
    timestamp: new Date(Date.now() - 3600 * 12 * 1000).toISOString()
  },
  {
    id: 'chat-5',
    senderId: 'sis-1',
    senderNama: 'Ziyad Al-Fatih',
    senderRole: UserRole.SISWA,
    receiverId: 'gru-1',
    receiverNama: 'Ustadz Muhammad Rayhan, Lc',
    receiverRole: UserRole.GURU,
    message: 'Syukron ustadz, insyaAllah hari ini saya setorkan 10 ayat awal An-Naziat.',
    timestamp: new Date(Date.now() - 3600 * 11 * 1000).toISOString()
  },
  {
    id: 'chat-6',
    senderId: 'sis-1',
    senderNama: 'Ziyad Al-Fatih',
    senderRole: UserRole.SISWA,
    receiverId: 'sis-2',
    receiverNama: 'Aisyah Humaira',
    receiverRole: UserRole.SISWA,
    message: 'Aisyah, ada file modul baru di menu Modul selain Al-Quran. Sudah di-download?',
    timestamp: new Date(Date.now() - 3600 * 8 * 1000).toISOString()
  }
];

const INITIAL_MEETINGS: VirtualMeeting[] = [
  {
    id: 'meet-1',
    title: 'Halaqah Subuh - Murojaah Juz 30',
    halaqahId: 'hq-1',
    halaqahNama: 'Halaqah Abu Bakar',
    guruId: 'gru-1',
    guruNama: 'Ustadz Muhammad Rayhan, Lc',
    agenda: 'Setoran hafalan baru Surat An-Naziat dan Murojaah Surat An-Naba bersama-sama.',
    isActive: true,
    meetingUrl: 'https://meet.jit.si/Halaqah-Subuh-AbuBakar',
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    participantsCount: 4
  }
];

export const INITIAL_PENGUMUMANS: Pengumuman[] = [];

const sortModules = (list: Modul[]): Modul[] => {
  return [...list].sort((a, b) => {
    if (a.tipe === TipeModul.AL_QURAN && b.tipe === TipeModul.AL_QURAN) {
      const idxA = a.nomorUrutSurat || 0;
      const idxB = b.nomorUrutSurat || 0;
      return idxA - idxB;
    }
    if (a.tipe !== b.tipe) {
      return a.tipe === TipeModul.AL_QURAN ? -1 : 1;
    }
    const titleA = a.judulModul || a.namaSurat || '';
    const titleB = b.judulModul || b.namaSurat || '';
    return titleA.localeCompare(titleB);
  });
};

export const DEFAULT_STRUKTUR_LEMBAGA: StrukturLembaga = {
  id: 'master_struktur',
  yayasan: {
    nama: DEFAULT_INSTITUTION_NAME,
    singkatan: DEFAULT_INSTITUTION_ABBR,
    divisi: 'Divisi Pendidikan & Pembinaan Al-Quran',
    logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
    alamat: 'Sekretariat Lembaga Pusat',
    email: 'info@halaqah.example',
    nomorTelepon: '0800-0000-0000',
    website: 'https://halaqah.example'
  },
  selectedStructure: 'A',
  direktoratList: [
    {
      id: 'dir-1',
      nama: 'Direktorat Pendidikan Kepesantrenan',
      namaDirektur: 'Direktur Pendidikan',
      email: 'direktorat@halaqah.example',
      nomorHp: '0800-0000-0001'
    }
  ],
  regionalList: [
    {
      id: 'reg-1',
      direktoratId: 'dir-1',
      nama: 'Wilayah Pusat',
      penanggungJawab: 'Koordinator Regional',
      email: 'regional@halaqah.example',
      nomorHp: '0800-0000-0002'
    }
  ],
  sekolahList: [
    {
      id: 'sch-1',
      direktoratId: 'dir-1',
      regionalId: 'reg-1',
      nama: 'Unit Pembinaan Al-Quran 1',
      namaPimpinan: 'Kepala Unit Pendidikan',
      email: 'unit1@halaqah.example',
      nomorHp: '0800-0000-0003',
      jenisSekolah: 'Offline',
      alamat: 'Alamat Unit Pembinaan 1',
      statusAktif: true,
      kategoriUnit: 'Formal',
      modelLembaga: 'Sekolah',
      jenisStrukturId: 'js-1',
      jenisStrukturNama: 'Lembaga Formal'
    },
    {
      id: 'sch-2',
      direktoratId: 'dir-1',
      regionalId: 'reg-1',
      nama: 'Rumah Quran Al-Fatih',
      namaPimpinan: 'Koordinator Rumah Quran',
      email: 'unit2@halaqah.example',
      nomorHp: '0800-0000-0004',
      jenisSekolah: 'Hybrid',
      alamat: 'Alamat Unit Pembinaan 2',
      statusAktif: true,
      kategoriUnit: 'Non-Formal',
      modelLembaga: 'Rumah Quran',
      jenisStrukturId: 'js-2',
      jenisStrukturNama: 'Lembaga Non Formal'
    }
  ],
  jenjangList: [
    {
      id: 'jj-1',
      sekolahId: 'sch-1',
      nama: 'Halaqah Abu Bakar As-Siddiq',
      namaKepalaSekolah: 'Koordinator Halaqah Putra',
      email: 'jenjang1@halaqah.example',
      nomorHp: '0800-0000-0005'
    },
    {
      id: 'jj-2',
      sekolahId: 'sch-1',
      nama: 'Halaqah Khadijah Al-Kubra',
      namaKepalaSekolah: 'Koordinator Halaqah Putri',
      email: 'jenjang2@halaqah.example',
      nomorHp: '0800-0000-0006'
    },
    {
      id: 'jj-3',
      sekolahId: 'sch-2',
      nama: 'Halaqah Ali bin Abi Thalib',
      namaKepalaSekolah: 'Koordinator Halaqah Lanjutan',
      email: 'jenjang3@halaqah.example',
      nomorHp: '0800-0000-0007'
    }
  ],
  jenisStrukturList: [
    { id: 'js-1', nama: 'Lembaga Formal', deskripsi: 'Pendidikan Terstruktur & Kurikulum Nasional' },
    { id: 'js-2', nama: 'Lembaga Non Formal', deskripsi: 'Program Tahsin, Tahfizh, dan Pembelajaran Mandiri' }
  ]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [strukturLembaga, setStrukturLembaga] = useState<StrukturLembaga>(() => {
    try {
      const data = localStorage.getItem('mh_struktur_lembaga');
      return data ? sanitizeStrukturLembaga(JSON.parse(data)) : DEFAULT_STRUKTUR_LEMBAGA;
    } catch {
      return DEFAULT_STRUKTUR_LEMBAGA;
    }
  });

  const [isDemoPurged, setIsDemoPurged] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';
    } catch {
      return false;
    }
  });

  const [deletedUsersTrash, setDeletedUsersTrash] = useState<Array<{
    id: string;
    role: 'guru' | 'siswa';
    nama: string;
    deletedAt: string;
    data: any;
  }>>(() => {
    try {
      const saved = localStorage.getItem('mh_deleted_users_trash');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load from local storage or fallback to initial presets (acting as responsive defaults)
  const [admins, setAdmins] = useState<Admin[]>(() => {
    const purged = typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';
    const data = localStorage.getItem('mh_admins');
    if (data) {
      try {
        const list: Admin[] = JSON.parse(data);
        if (list.length > 0) {
          const migratedList = ensureDefaultAdminInList(list);
          return purged ? migratedList.filter(a => !DEMO_ADMIN_IDS.includes(a.id)) : migratedList;
        }
      } catch {}
    }
    // Check if mh_session has active Admin user info to preserve custom name and profile
    if (typeof window !== 'undefined') {
      try {
        const sess = localStorage.getItem('mh_session');
        if (sess) {
          const parsed = JSON.parse(sess);
          if (parsed?.user?.role === UserRole.ADMIN && parsed.user.id === 'adm-1') {
            const isOldPersonal = isLegacyAdminAccount(parsed.user);
            const adminFromSession: Admin = {
              ...INITIAL_ADMINS[0],
              ...parsed.user,
              namaLengkap: isOldPersonal ? INITIAL_ADMINS[0].namaLengkap : (parsed.user.namaLengkap || INITIAL_ADMINS[0].namaLengkap),
              email: isOldPersonal ? INITIAL_ADMINS[0].email : (parsed.user.email || INITIAL_ADMINS[0].email),
              password: isOldPersonal ? DEFAULT_ADMIN_PASSWORD_HASH : (parsed.user.password || DEFAULT_ADMIN_PASSWORD_HASH),
              fotoProfil: stripDummyProfilePhoto(parsed.user.fotoProfil),
            };
            return ensureDefaultAdminInList([adminFromSession]);
          }
        }
      } catch {}
    }
    return purged ? [INITIAL_ADMINS[0]] : INITIAL_ADMINS;
  });

  const [gurus, setGurus] = useState<Guru[]>(() => {
    const purged = typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';
    const data = localStorage.getItem('mh_gurus');
    if (data) {
      try {
        const list: Guru[] = JSON.parse(data);
        if (list.length > 0) {
          const migratedList = list.map(g => {
            const cleanPhoto = stripDummyProfilePhoto(g.fotoProfil);
            if (g.id === 'gru-koordinator' && isLegacyPersonalData(g.namaLengkap)) {
              return { ...g, namaLengkap: INITIAL_GURUS[0].namaLengkap, fotoProfil: cleanPhoto };
            }
            return cleanPhoto !== (g.fotoProfil || '') ? { ...g, fotoProfil: cleanPhoto } : g;
          });
          return purged ? migratedList.filter(g => !DEMO_GURU_IDS.includes(g.id)) : migratedList;
        }
      } catch {}
    }
    if (typeof window !== 'undefined') {
      try {
        const sess = localStorage.getItem('mh_session');
        if (sess) {
          const parsed = JSON.parse(sess);
          if (parsed?.user?.role === UserRole.GURU && parsed.user.id === 'gru-koordinator') {
            const koordinator = INITIAL_GURUS.find(g => g.id === 'gru-koordinator') || INITIAL_GURUS[0];
            const guruFromSession: Guru = {
              ...koordinator,
              ...parsed.user,
              namaLengkap: parsed.user.namaLengkap || koordinator.namaLengkap,
              email: parsed.user.email || koordinator.email,
              fotoProfil: stripDummyProfilePhoto(parsed.user.fotoProfil),
            };
            return [guruFromSession];
          }
        }
      } catch {}
    }
    const koordinator = INITIAL_GURUS.find(g => g.id === 'gru-koordinator') || INITIAL_GURUS[0];
    return purged ? [koordinator] : INITIAL_GURUS;
  });

  const [siswas, setSiswas] = useState<Siswa[]>(() => {
    const purged = typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';
    const data = localStorage.getItem('mh_siswas');
    if (data) {
      const list: Siswa[] = JSON.parse(data).map((s: Siswa) => {
        const cleanPhoto = stripDummyProfilePhoto(s.fotoProfil);
        return cleanPhoto !== (s.fotoProfil || '') ? { ...s, fotoProfil: cleanPhoto } : s;
      });
      return purged ? list.filter(s => !DEMO_SISWA_IDS.includes(s.id)) : list;
    }
    return purged ? [] : INITIAL_SISWAS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const data = localStorage.getItem('mh_chat_messages');
    return data ? JSON.parse(data) : [];
  });

  const [virtualMeetings, setVirtualMeetings] = useState<VirtualMeeting[]>(() => {
    const data = localStorage.getItem('mh_virtual_meetings');
    return data ? JSON.parse(data) : [];
  });

  const [kelases, setKelases] = useState<Kelas[]>(() => {
    const data = localStorage.getItem('mh_kelases');
    return data ? JSON.parse(data) : INITIAL_KELAS;
  });

  const [halaqahs, setHalaqahs] = useState<Halaqah[]>(() => {
    const data = localStorage.getItem('mh_halaqahs');
    return data ? JSON.parse(data) : INITIAL_HALAQAH;
  });

  const [rawModuls, setRawModuls] = useState<Modul[]>(() => {
    const data = localStorage.getItem('mh_moduls');
    const list: Modul[] = data ? JSON.parse(data) : INITIAL_MODULS;
    return sortModules(list);
  });

  const [rawPages, setRawPages] = useState<Record<string, string>>(() => {
    try {
      const data = localStorage.getItem('mh_raw_pages');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  });

  const [moduls, setModuls] = useState<Modul[]>([]);

  const updateRawPagesForModul = (modulId: string, isMultiJilid: boolean, halamanGambar: string[] | undefined, halamanGambarPerJilid: string[][] | undefined) => {
    setRawPages(prev => {
      const copy = { ...prev };
      if (isMultiJilid && halamanGambarPerJilid) {
        for (let j = 0; j < halamanGambarPerJilid.length; j++) {
          const pages = halamanGambarPerJilid[j] || [];
          for (let p = 0; p < pages.length; p++) {
            copy[`${modulId}_${j}_${p}`] = pages[p] || '';
          }
        }
      } else if (halamanGambar) {
        for (let p = 0; p < halamanGambar.length; p++) {
          copy[`${modulId}_0_${p}`] = halamanGambar[p] || '';
        }
      }
      return copy;
    });
  };

  const [setorans, setSetorans] = useState<Setoran[]>(() => {
    const data = localStorage.getItem('mh_setorans');
    return data ? JSON.parse(data) : INITIAL_SETORANS;
  });

  const [murojaahBerpasangans, setMurojaahBerpasangans] = useState<MurojaahBerpasangan[]>(() => {
    const data = localStorage.getItem('mh_murojaah_berpasangan');
    return data ? JSON.parse(data) : [];
  });

  // (Using global top-level INITIAL_JENIS_ASSESSMENTS and INITIAL_TEMPLATE_ASSESSMENTS)

  const [jenisAssessments, setJenisAssessments] = useState<JenisAssessment[]>(() => {
    const data = localStorage.getItem('mh_jenis_assessments');
    return data ? JSON.parse(data) : INITIAL_JENIS_ASSESSMENTS;
  });

  const [templateAssessments, setTemplateAssessments] = useState<TemplateAssessment[]>(() => {
    const data = localStorage.getItem('mh_template_assessments');
    return data ? JSON.parse(data) : INITIAL_TEMPLATE_ASSESSMENTS;
  });

  const [assessmentRecords, setAssessmentRecords] = useState<AssessmentRecord[]>(() => {
    const data = localStorage.getItem('mh_assessment_records');
    return data ? JSON.parse(data) : [];
  });

  const [pengajuanAssessments, setPengajuanAssessments] = useState<PengajuanAssessment[]>(() => {
    const data = localStorage.getItem('mh_pengajuan_assessments');
    return data ? JSON.parse(data) : [];
  });

  const [syahadahs, setSyahadahs] = useState<Syahadah[]>(() => {
    const data = localStorage.getItem('mh_syahadahs');
    return data ? JSON.parse(data) : [];
  });

  const [syahadahRules, setSyahadahRules] = useState<SyahadahRule[]>(() => {
    const data = localStorage.getItem('mh_syahadah_rules');
    return data ? JSON.parse(data) : [];
  });

  const [syahadahSettings, setSyahadahSettings] = useState<SyahadahSettings>(() => {
    const data = localStorage.getItem('mh_syahadah_settings');
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    return {
      isEnabledForGuru: false,
      isEnabledForSiswa: false
    };
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const data = localStorage.getItem('mh_audit_logs');
    return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
  });

  const DEFAULT_MASTER_PENALTIES: MasterPenalties = {
    baseScore: 100,
    standarBarisQuran: 15,
    minBarisQuran: 5,
    maxBarisQuran: 15,
    bobotLahnJaliy: 4,
    bobotLahnKhafiy: 2,
    bobotKlasifikasi: {
      'lahn_jaliy': 4,
      'lahn_khafiy': 2
    },
    defaultBarisNonQuran: 6,
    minBarisNonQuranRatio: 0.5,
    oncePerSessionCategories: [
      'makhraj-huruf',
      'Makhraj Huruf',
      'dasar-makhraj',
      'Makhraj Huruf Dasar'
    ],
    rubrikDeductions: {
      'lahn_jaliy': 4,
      'Lahn Jaliy': 4,
      'lahn_khafiy': 2,
      'Lahn Khafiy': 2,
      'dasar-lupa-huruf': 4,
      'Tertukar / Keliru Huruf Hijaiyah': 4,
      'Lupa/Tertukar Huruf': 4,
      'dasar-harakat-vokal': 4,
      'Salah Harakat / Bunyi Vokal': 4,
      'dasar-pendek-panjang': 4,
      'Keliru Mad Asli (Pendek/Panjang)': 4,
      'Harakat Pendek/Panjang': 4,
      'dasar-tasydid': 4,
      'Tasydid Hilang / Bertambah': 4,
      'dasar-terbata': 4,
      'Terbata-bata / Ejaan Terputus': 4,
      'makhraj-huruf': 2,
      'Makhraj Huruf': 2,
      'Makhraj & Sifat Huruf': 2,
      'idgham-bighunnah': 2,
      'Idgham Bighunnah': 2,
      'idgham-bilaghunnah': 2,
      'Idgham Bilaghunnah': 2,
      'iqlab': 2,
      'Iqlab': 2,
      'ikhfa': 2,
      'Ikhfa': 2,
      'izhar-halqi': 2,
      'Izhar Halqi': 2,
      'mad-jaiz-munfashil': 2,
      'Mad Jaiz Munfashil': 2,
      'mad-wajib-muttashil': 2,
      'Mad Wajib Muttashil': 2,
      'mad-shilah-thawilah': 2,
      'Mad Shilah Thawilah': 2,
      'mad-shilah-qashirah': 2,
      'Mad Shilah Qashirah': 2,
      'ghunnah': 2,
      'Ghunnah Musyaddadah': 2,
      'Ghunnah': 2,
      'waqaf': 2,
      'Waqaf & Ibtida\'': 2,
      'Waqaf': 2,
      'wasal': 2,
      'Wasal': 2,
      'qalqalah': 2,
      'Qalqalah': 2,
      'tafkhim': 2,
      'Tafkhim': 2,
      'tarqiq': 2,
      'Tarqiq': 2,
      'lainnya': 2,
      'Lainnya (Khafiy)': 2,
      'Lainnya': 2,
      'dasar-makhraj': 2,
      'Makhraj Huruf Dasar': 2
    }
  };

  const [masterPenalties, setMasterPenalties] = useState<MasterPenalties>(() => {
    const data = localStorage.getItem('mh_master_penalties');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return {
            baseScore: parsed.baseScore !== undefined ? parsed.baseScore : DEFAULT_MASTER_PENALTIES.baseScore,
            standarBarisQuran: parsed.standarBarisQuran !== undefined ? parsed.standarBarisQuran : DEFAULT_MASTER_PENALTIES.standarBarisQuran,
            minBarisQuran: parsed.minBarisQuran !== undefined ? parsed.minBarisQuran : DEFAULT_MASTER_PENALTIES.minBarisQuran,
            maxBarisQuran: parsed.maxBarisQuran !== undefined ? parsed.maxBarisQuran : DEFAULT_MASTER_PENALTIES.maxBarisQuran,
            bobotLahnJaliy: parsed.bobotLahnJaliy !== undefined ? parsed.bobotLahnJaliy : DEFAULT_MASTER_PENALTIES.bobotLahnJaliy,
            bobotLahnKhafiy: parsed.bobotLahnKhafiy !== undefined ? parsed.bobotLahnKhafiy : DEFAULT_MASTER_PENALTIES.bobotLahnKhafiy,
            bobotKlasifikasi: (parsed.bobotKlasifikasi && typeof parsed.bobotKlasifikasi === 'object')
              ? { ...DEFAULT_MASTER_PENALTIES.bobotKlasifikasi, ...parsed.bobotKlasifikasi }
              : {
                  'lahn_jaliy': parsed.bobotLahnJaliy !== undefined ? parsed.bobotLahnJaliy : DEFAULT_MASTER_PENALTIES.bobotLahnJaliy ?? 4,
                  'lahn_khafiy': parsed.bobotLahnKhafiy !== undefined ? parsed.bobotLahnKhafiy : DEFAULT_MASTER_PENALTIES.bobotLahnKhafiy ?? 2
                },
            defaultBarisNonQuran: parsed.defaultBarisNonQuran !== undefined ? parsed.defaultBarisNonQuran : DEFAULT_MASTER_PENALTIES.defaultBarisNonQuran,
            minBarisNonQuranRatio: parsed.minBarisNonQuranRatio !== undefined ? parsed.minBarisNonQuranRatio : DEFAULT_MASTER_PENALTIES.minBarisNonQuranRatio,
            rubrikDeductions: (parsed.rubrikDeductions && Object.keys(parsed.rubrikDeductions).length > 0)
              ? { ...DEFAULT_MASTER_PENALTIES.rubrikDeductions, ...parsed.rubrikDeductions }
              : DEFAULT_MASTER_PENALTIES.rubrikDeductions,
            oncePerSessionCategories: Array.isArray(parsed.oncePerSessionCategories)
              ? parsed.oncePerSessionCategories
              : DEFAULT_MASTER_PENALTIES.oncePerSessionCategories
          };
        }
      } catch (e) {
        console.warn('Failed to parse mh_master_penalties from local storage', e);
      }
    }
    return DEFAULT_MASTER_PENALTIES;
  });

  useEffect(() => { safeSaveLocalStorage('mh_master_penalties', masterPenalties); }, [masterPenalties]);

  const [elemenSettings, setElemenSettings] = useState<ElemenSetting[]>(() => {
    const data = localStorage.getItem('mh_elemen_settings');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((e: ElemenSetting) => {
            if (e.nama && e.nama.toLowerCase() === 'qiraah surah wajib' && !e.targetDurasiBulan) {
              return {
                ...e,
                targetDurasiBulan: 3,
                targetCakupanMateri: e.targetCakupanMateri || 'surah_pilihan',
                targetSurahList: (e.targetSurahList && e.targetSurahList.length > 0) ? e.targetSurahList : [1, 114, 113, 112, 111, 110, 109, 108],
                targetCatatanMateri: e.targetCatatanMateri || 'Urutan: Al-Fatihah, An-Nas, Al-Falaq, Al-Ikhlas, Al-Lahab, An-Nashr, Al-Kafirun, Al-Kautsar (8 Surah Pilihan)'
              };
            }
            return e;
          });
        }
      } catch {}
    }
    return [
      {
        id: 'qiraah-surah-wajib-4375',
        nama: 'Qiraah Surah Wajib',
        tipeModul: TipeModul.AL_QURAN,
        jenisSetoranList: ['Tahsin', 'Baru', 'Murojaah'],
        kompetensi: 'Bacaan',
        targetDurasiBulan: 3,
        targetCakupanMateri: 'surah_pilihan',
        targetSurahList: [1, 114, 113, 112, 111, 110, 109, 108],
        targetCatatanMateri: 'Urutan: Al-Fatihah, An-Nas, Al-Falaq, Al-Ikhlas, Al-Lahab, An-Nashr, Al-Kafirun, Al-Kautsar (8 Surah Pilihan)',
        isBerjenjang: true,
        jenjangLevel: 1,
        syaratBuka: 'ada_setoran'
      },
      {
        id: 'tilawah',
        nama: 'Tilawah',
        tipeModul: TipeModul.AL_QURAN,
        jenisSetoranList: ['Binnadzar', 'Tahsin', 'Baru', 'Murojaah'],
        kompetensi: 'Bacaan'
      },
      {
        id: 'tahfidz',
        nama: 'Tahfidz',
        tipeModul: TipeModul.AL_QURAN,
        jenisSetoranList: ['Hafalan Baru', 'Murojaah', 'Sambung Ayat', 'Tasmi\''],
        kompetensi: 'Hafalan'
      },
      {
        id: 'qiroah',
        nama: 'Qiroah',
        tipeModul: TipeModul.NON_AL_QURAN,
        jenisSetoranList: ['Baru', 'Murojaah'],
        kompetensi: 'Bacaan'
      }
    ];
  });

  const DEFAULT_HIJAIYAH_SUBCATS: TajwidSubcategory[] = [
    { id: 'alif', nama: 'ا (Alif)' },
    { id: 'ba', nama: 'ب (Ba)' },
    { id: 'ta', nama: 'ت (Ta)' },
    { id: 'tsa', nama: 'ث (Tsa)' },
    { id: 'jim', nama: 'ج (Jim)' },
    { id: 'ha', nama: 'ح (Ha)' },
    { id: 'kha', nama: 'خ (Kha)' },
    { id: 'dal', nama: 'د (Dal)' },
    { id: 'dzal', nama: 'ذ (Dzal)' },
    { id: 'ra', nama: 'ر (Ra)' },
    { id: 'zai', nama: 'ز (Zai)' },
    { id: 'sin', nama: 'س (Sin)' },
    { id: 'syin', nama: 'ش (Syin)' },
    { id: 'shad', nama: 'ص (Shad)' },
    { id: 'dhad', nama: 'ض (Dhad)' },
    { id: 'tha', nama: 'ط (Tha)' },
    { id: 'zha', nama: 'ظ (Zha)' },
    { id: 'ain', nama: 'ع (\'Ain)' },
    { id: 'ghain', nama: 'غ (Ghain)' },
    { id: 'fa', nama: 'ف (Fa)' },
    { id: 'qaf', nama: 'ق (Qaf)' },
    { id: 'kaf', nama: 'ك (Kaf)' },
    { id: 'lam', nama: 'ل (Lam)' },
    { id: 'mim', nama: 'م (Mim)' },
    { id: 'nun', nama: 'ن (Nun)' },
    { id: 'waw', nama: 'و (Waw)' },
    { id: 'ha_besar', nama: 'هـ (Ha)' },
    { id: 'hamzah', nama: 'ء (Hamzah)' },
    { id: 'ya', nama: 'ي (Ya)' }
  ];

  const ensureTajwidSubcategories = (cats: TajwidCategory[]): TajwidCategory[] => {
    let result = cats.map(c => {
      const nameLower = (c.nama || '').toLowerCase();
      const idLower = (c.id || '').toLowerCase();
      
      // Only normalize legacy values: 'dasar' -> 'lahn_jaliy', 'tajwid' -> 'lahn_khafiy'
      // All other types (including custom types like 'kelancaran', 'sifat_huruf', etc.) must be strictly preserved!
      let normTipe: KategoriKesalahanTipe = c.tipe || 'lahn_khafiy';
      if (c.tipe === 'dasar') {
        normTipe = 'lahn_jaliy';
      } else if (c.tipe === 'tajwid') {
        normTipe = 'lahn_khafiy';
      }

      if (
        (!c.subcategories || c.subcategories.length === 0) &&
        (nameLower.includes('makhraj') || nameLower.includes('huruf') || nameLower.includes('hijaiyah') || idLower.includes('makhraj') || idLower.includes('huruf'))
      ) {
        return { ...c, tipe: normTipe, subcategories: DEFAULT_HIJAIYAH_SUBCATS };
      }
      return { ...c, tipe: normTipe };
    });

    const hasSifatHuruf = result.some(c => (c.nama || '').toLowerCase() === 'sifat huruf' || c.id === 'sifat-huruf');
    if (!hasSifatHuruf) {
      result.splice(6, 0, {
        id: 'sifat-huruf',
        nama: 'Sifat Huruf',
        deskripsi: 'Kesalahan sifat huruf seperti memantulkan huruf sukun bukan qalqalah (lam, sin, nun, dll.), hams, shafir, rakhawah, atau takrir.',
        tipe: 'lahn_khafiy',
        subcategories: [
          { id: 'sub-memantulkan-huruf', nama: 'Memantulkan huruf' },
          { id: 'sub-kurang-hams', nama: 'Kurang Hams' },
          { id: 'sub-kurang-shafir', nama: 'Kurang Desis Shafir' },
          { id: 'sub-terlalu-takrir', nama: 'Takrir Ra Berlebih' },
          { id: 'sub-kurang-tafkhim', nama: 'Kurang Tebal (Tafkhim)' },
          { id: 'sub-terlalu-tebal-tarqiq', nama: 'Terlalu Tebal (Tarqiq)' }
        ]
      });
    } else {
      result = result.map(c => {
        if ((c.nama || '').toLowerCase() === 'sifat huruf' || c.id === 'sifat-huruf') {
          const subs = c.subcategories || [];
          if (!subs.some(s => s.nama.toLowerCase().includes('memantulkan'))) {
            return {
              ...c,
              subcategories: [{ id: 'sub-memantulkan-huruf', nama: 'Memantulkan huruf' }, ...subs]
            };
          }
        }
        return c;
      });
    }

    // Respect urutan or stored order
    let orderMap: Record<string, number> = {};
    try {
      const rawOrder = localStorage.getItem('mh_tajwid_order');
      if (rawOrder) {
        const parsedOrder = JSON.parse(rawOrder);
        if (Array.isArray(parsedOrder)) {
          parsedOrder.forEach((id: string, idx: number) => {
            orderMap[id] = idx;
          });
        }
      }
    } catch {}

    result.sort((a, b) => {
      const orderA = a.urutan !== undefined ? a.urutan : (orderMap[a.id] !== undefined ? orderMap[a.id] : 9999);
      const orderB = b.urutan !== undefined ? b.urutan : (orderMap[b.id] !== undefined ? orderMap[b.id] : 9999);
      if (orderA !== orderB) return orderA - orderB;
      return 0;
    });

    return result;
  };

  const DEFAULT_KLASIFIKASI_KESALAHAN_TYPES: KlasifikasiKesalahanType[] = [
    {
      id: 'lahn_jaliy',
      nama: 'Lahn Jaliy',
      labelSingkat: 'Jelas / Fatal',
      deskripsi: 'Kesalahan nyata yang berpotensi merusak lafadz kata atau merubah makna ayat (huruf tertukar, salah harakat, mad asli, tasydid).',
      isDefault: true
    },
    {
      id: 'lahn_khafiy',
      nama: 'Lahn Khafiy',
      labelSingkat: 'Samar / Tajwid',
      deskripsi: 'Kesalahan samar/tajwid yang mengurangi kesempurnaan tartil (kadar ghunnah, mad far\'i, qalqalah, tebal-tipis huruf).',
      isDefault: true
    }
  ];

  const [klasifikasiKesalahanTypes, setKlasifikasiKesalahanTypes] = useState<KlasifikasiKesalahanType[]>(() => {
    const data = localStorage.getItem('mh_klasifikasi_kesalahan_types');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing mh_klasifikasi_kesalahan_types', e);
      }
    }
    return DEFAULT_KLASIFIKASI_KESALAHAN_TYPES;
  });

  const [tajwidCategories, setTajwidCategories] = useState<TajwidCategory[]>(() => {
    const data = localStorage.getItem('mh_tajwid_categories');
    if (data) {
      try {
        const parsed: TajwidCategory[] = JSON.parse(data);
        return ensureTajwidSubcategories(parsed);
      } catch (e) {
        console.error('Error parsing mh_tajwid_categories', e);
      }
    }
    return [
      // 1. Kategori Lahn Jaliy (اللحن الجلي - Kesalahan Jelas / Fatal)
      { id: 'dasar-lupa-huruf', nama: 'Tertukar / Keliru Huruf Hijaiyah', deskripsi: 'Tertukar bentuk atau pelafalan huruf hijaiyah yang merubah identitas huruf (Lahn Jaliy).', tipe: 'lahn_jaliy', subcategories: DEFAULT_HIJAIYAH_SUBCATS },
      { id: 'dasar-harakat-vokal', nama: 'Salah Harakat / Bunyi Vokal', deskripsi: 'Salah harakat fathah, kasrah, dhammah, sukun atau tanwin yang berpotensi merubah makna ayat.', tipe: 'lahn_jaliy' },
      { id: 'dasar-pendek-panjang', nama: 'Keliru Mad Asli (Pendek/Panjang)', deskripsi: 'Memanjangkan huruf pendek atau memendekkan huruf mad thabi\'i/asli (merubah struktur huruf).', tipe: 'lahn_jaliy' },
      { id: 'dasar-tasydid', nama: 'Tasydid Hilang / Bertambah', deskripsi: 'Meninggalkan tasydid (menghilangkan satu huruf) atau menambah tasydid yang tidak ada.', tipe: 'lahn_jaliy' },
      { id: 'dasar-terbata', nama: 'Terbata-bata / Ejaan Terputus', deskripsi: 'Membaca terputus-putus atau lambat mengeja dari satu huruf ke huruf berikutnya.', tipe: 'lahn_jaliy' },

      // 2. Kategori Lahn Khafiy (اللحن الخفي - Kesalahan Samar / Tajwid)
      { id: 'makhraj-huruf', nama: 'Makhraj & Sifat Huruf', deskripsi: 'Tempat keluar huruf atau kesempurnaan sifat huruf (hams, rakhawah, shafir, istithalah) yang kurang presisi.', tipe: 'lahn_khafiy', subcategories: DEFAULT_HIJAIYAH_SUBCATS },
      { 
        id: 'sifat-huruf', 
        nama: 'Sifat Huruf', 
        deskripsi: 'Kesalahan sifat huruf seperti memantulkan huruf sukun bukan qalqalah (lam, sin, nun, dll.), hams, shafir, rakhawah, atau takrir.', 
        tipe: 'lahn_khafiy', 
        subcategories: [
          { id: 'sub-memantulkan-huruf', nama: 'Memantulkan huruf' },
          { id: 'sub-kurang-hams', nama: 'Kurang Hams' },
          { id: 'sub-kurang-shafir', nama: 'Kurang Desis Shafir' },
          { id: 'sub-terlalu-takrir', nama: 'Takrir Ra Berlebih' },
          { id: 'sub-kurang-tafkhim', nama: 'Kurang Tebal (Tafkhim)' },
          { id: 'sub-terlalu-tebal-tarqiq', nama: 'Terlalu Tebal (Tarqiq)' }
        ] 
      },
      { id: 'idgham-bighunnah', nama: 'Idgham Bighunnah', deskripsi: 'Membaca dengan memasukkan suara nun sukun/tanwin ke huruf berikutnya disertai dengung sempurna.', tipe: 'lahn_khafiy' },
      { id: 'idgham-bilaghunnah', nama: 'Idgham Bilaghunnah', deskripsi: 'Membaca dengan memasukkan suara nun sukun/tanwin ke huruf berikutnya tanpa dengung (lam dan ra).', tipe: 'lahn_khafiy' },
      { id: 'iqlab', nama: 'Iqlab', deskripsi: 'Mengubah bunyi nun sukun/tanwin menjadi mim sukun jika bertemu huruf ba disertai dengung.', tipe: 'lahn_khafiy' },
      { id: 'ikhfa', nama: 'Ikhfa', deskripsi: 'Membaca dengan menyamarkan bunyi nun sukun/tanwin ketika bertemu 15 huruf ikhfa.', tipe: 'lahn_khafiy' },
      { id: 'izhar-halqi', nama: 'Izhar Halqi', deskripsi: 'Membaca nun sukun/tanwin dengan jelas tanpa dengung saat bertemu huruf tenggorokan.', tipe: 'lahn_khafiy' },
      { id: 'mad-jaiz-munfashil', nama: 'Mad Jaiz Munfashil', deskripsi: 'Kadar panjang mad thabi\'i bertemu hamzah di lain kalimat kurang dari 4-5 harakat.', tipe: 'lahn_khafiy' },
      { id: 'mad-wajib-muttashil', nama: 'Mad Wajib Muttashil', deskripsi: 'Kadar panjang mad thabi\'i bertemu hamzah dalam satu kalimat kurang dari 4-5 harakat.', tipe: 'lahn_khafiy' },
      { id: 'mad-shilah-thawilah', nama: 'Mad Shilah Thawilah', deskripsi: 'Mad shilah qashirah bertemu dengan hamzah.', tipe: 'lahn_khafiy' },
      { id: 'mad-shilah-qashirah', nama: 'Mad Shilah Qashirah', deskripsi: 'Ha dhamir didahului dan diikuti huruf berharakat.', tipe: 'lahn_khafiy' },
      { id: 'ghunnah', nama: 'Ghunnah Musyaddadah', deskripsi: 'Kurang mendengungkan suara di pangkal hidung pada huruf mim dan nun bertasydid (2 harakat).', tipe: 'lahn_khafiy' },
      { id: 'waqaf', nama: 'Waqaf & Ibtida\'', deskripsi: 'Cara atau tanda pemberhentian dan memulai kembali bacaan yang kurang tepat.', tipe: 'lahn_khafiy' },
      { id: 'wasal', nama: 'Wasal', deskripsi: 'Cara menyambung bacaan antar ayat/kalimat.', tipe: 'lahn_khafiy' },
      { id: 'qalqalah', nama: 'Qalqalah', deskripsi: 'Memantulkan huruf qalqalah (baju di toko) saat sukun atau waqaf.', tipe: 'lahn_khafiy' },
      { id: 'tafkhim', nama: 'Tafkhim', deskripsi: 'Membaca tebal pada huruf-huruf istila atau Ra/Lam jalalah.', tipe: 'lahn_khafiy' },
      { id: 'tarqiq', nama: 'Tarqiq', deskripsi: 'Membaca tipis pada huruf-huruf tertentu.', tipe: 'lahn_khafiy' },
      { id: 'lainnya', nama: 'Lainnya (Khafiy)', deskripsi: 'Kesalahan tajwid umum lainnya.', tipe: 'lahn_khafiy' }
    ];
  });

  const [mataPelajarans, setMataPelajarans] = useState<MataPelajaran[]>(() => {
    const data = localStorage.getItem('mh_mata_pelajarans');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'mapel-1',
        nama: 'Al-Qur\'an',
        deskripsi: 'Pembelajaran utama hafalan, pemahaman, dan bacaan santri.',
        statusAktif: true,
        elemenList: [
          { id: 'sub-elem-1', nama: 'Tahfidz', deskripsi: 'Hafalan Al-Qur\'an santri', statusAktif: true },
          { id: 'sub-elem-2', nama: 'Tilawah', deskripsi: 'Seni dan kemampuan membaca santri', statusAktif: true }
        ],
        tanggalDibuat: '2026-06-11T00:00:00.000Z'
      },
      {
        id: 'mapel-2',
        nama: 'Kitab Kuning',
        deskripsi: 'Kajian kitab turats fiqih, nahwu shorof, dan akhlak.',
        statusAktif: true,
        elemenList: [
          { id: 'sub-elem-3', nama: 'Fiqih', deskripsi: 'Hukum dan amaliyah ibadah harian', statusAktif: true },
          { id: 'sub-elem-4', nama: 'Nahwu Shorof', deskripsi: 'Kaidah bahasa arab', statusAktif: true }
        ],
        tanggalDibuat: '2026-06-11T00:00:00.000Z'
      }
    ];
  });

  const [programs, setPrograms] = useState<ProgramKeilmuan[]>(() => {
    const data = localStorage.getItem('mh_programs');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'prog-tajwid-dasar',
        nama: 'Tajwid Dasar',
        kategori: 'Tajwid Dasar',
        deskripsi: 'Mempelajari hukum Nun Sukun/Tanwin, Mim Sukun, dan Makharijul Huruf dasar secara runtut.',
        tujuan: 'Santri dapat melafalkan huruf hijaiyah dengan benar dan menerapkan tajwid dasar.',
        sasaran: 'Siswa Halaqah Dasar',
        kkm: 75,
        bertahap: true,
        latihan: true,
        asesmenPraktik: true,
        remedial: true,
        ujianAkhir: true,
        sertifikat: true,
        status: 'Aktif',
        tanggalDibuat: '2026-06-28T00:00:00.000Z'
      },
      {
        id: 'prog-tajwid-lanjutan',
        nama: 'Tajwid Lanjutan',
        kategori: 'Tajwid Lanjutan',
        deskripsi: 'Pendalaman hukum mad, waqaf, wasal, serta sifat-sifat huruf secara mendalam dan terperinci.',
        tujuan: 'Santri memahami dan lancar mempraktikkan hukum tajwid tingkat lanjut dalam tadarus.',
        sasaran: 'Siswa Halaqah Lanjutan',
        kkm: 80,
        bertahap: true,
        latihan: true,
        asesmenPraktik: true,
        remedial: true,
        ujianAkhir: true,
        sertifikat: true,
        status: 'Aktif',
        tanggalDibuat: '2026-06-28T00:00:00.000Z'
      },
      {
        id: 'prog-ulumul-quran',
        nama: 'Ulumul Qur\'an',
        kategori: 'Ulumul Qur\'an',
        deskripsi: 'Pengantar ilmu tafsir, sejarah kodifikasi mushaf Al-Qur\'an, dan pemahaman asbabun nuzul.',
        tujuan: 'Santri memahami latar belakang sejarah dan metodologi pemahaman ayat Al-Qur\'an.',
        sasaran: 'Siswa Tingkat Menengah / Ustadz',
        kkm: 70,
        bertahap: false,
        latihan: false,
        asesmenPraktik: false,
        remedial: false,
        ujianAkhir: true,
        sertifikat: true,
        status: 'Aktif',
        tanggalDibuat: '2026-06-28T00:00:00.000Z'
      }
    ];
  });

  const [programBabs, setProgramBabs] = useState<ProgramBab[]>(() => {
    const data = localStorage.getItem('mh_program_babs');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'bab-makhorijul',
        programId: 'prog-tajwid-dasar',
        judul: 'Makharijul Huruf & Sifat Huruf',
        tujuanPembelajaran: 'Mengerti dan menguasai pengucapan tiap huruf hijaiyah.',
        indikator: 'Dapat melafalkan huruf halqi, lisan, syafawi, dan khaysyum.',
        estimasiWaktu: '2 Jam',
        urutan: 1
      },
      {
        id: 'bab-nunmati',
        programId: 'prog-tajwid-dasar',
        judul: 'Hukum Nun Mati & Tanwin',
        tujuanPembelajaran: 'Menguasai hukum izhar, idgham, iqlab, dan ikhfa.',
        indikator: 'Mampu membedakan dengung idgham bighunnah dan kejelasan izhar.',
        estimasiWaktu: '3 Jam',
        urutan: 2
      },
      {
        id: 'bab-mimmati',
        programId: 'prog-tajwid-dasar',
        judul: 'Hukum Mim Mati',
        tujuanPembelajaran: 'Memahami ikhfa syafawi, idgham mimi, dan izhar syafawi.',
        indikator: 'Tepat menahan dengung mim mati bertemu mim dan ba.',
        estimasiWaktu: '2 Jam',
        urutan: 3
      },
      {
        id: 'bab-mad',
        programId: 'prog-tajwid-lanjutan',
        judul: 'Hukum Mad (Pemanjangan Bacaan)',
        tujuanPembelajaran: 'Menguasai mad thabi\'i dan mad far\'i beserta panjang harakatnya.',
        indikator: 'Mampu membaca mad wajib 5 harakat dan mad jaiz dengan tepat.',
        estimasiWaktu: '4 Jam',
        urutan: 1
      },
      {
        id: 'bab-waqaf',
        programId: 'prog-tajwid-lanjutan',
        judul: 'Hukum Waqaf & Wasal',
        tujuanPembelajaran: 'Mengetahui tempat berhenti dan memulai bacaan Al-Qur\'an.',
        indikator: 'Dapat mengidentifikasi tanda waqaf lazim, jaiz, mamnu\'.',
        estimasiWaktu: '2 Jam',
        urutan: 2
      }
    ];
  });

  const [programMateris, setProgramMateris] = useState<ProgramMateri[]>(() => {
    const data = localStorage.getItem('mh_program_materis');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'mat-makhorijul-1',
        babId: 'bab-makhorijul',
        programId: 'prog-tajwid-dasar',
        judul: 'Pengantar Tempat Keluarnya Huruf (Makhraj)',
        tipe: 'Cetak',
        cetakInfo: {
          namaBuku: 'Tajwid Praktis Al-Qur\'an',
          penulis: 'KH. Ma\'shum Ali',
          penerbit: 'Pustaka Al-Anwar',
          tahunTerbit: '2021',
          edisi: 'Cetakan ke-5',
          bab: 'Bab I: Makharijul Huruf',
          halaman: 'Hal. 12 - 18',
          catatan: 'Perhatikan baik-baik gambar skema tenggorokan dan lisan.'
        },
        urutan: 1
      },
      {
        id: 'mat-nunmati-1',
        babId: 'bab-nunmati',
        programId: 'prog-tajwid-dasar',
        judul: 'Buku Panduan Izhar Halqi & Idgham',
        tipe: 'Cetak',
        cetakInfo: {
          namaBuku: 'Pedoman Ilmu Tajwid Lengkap',
          penulis: 'Drs. H. Ahmad Sunarto',
          penerbit: 'Penerbit Al-Hidayah',
          tahunTerbit: '2019',
          edisi: 'Edisi Revisi',
          bab: 'Bab II: Nun Mati',
          halaman: 'Hal. 24 - 31',
          catatan: 'Fokuskan latihan pengucapan huruf Izhar (Hamzah, Ha, Ain, Ha, Ghain, Kha).'
        },
        urutan: 1
      }
    ];
  });

  const [programLatihans, setProgramLatihans] = useState<ProgramLatihan[]>(() => {
    const data = localStorage.getItem('mh_program_latihans');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'lat-makhorijul-q1',
        babId: 'bab-makhorijul',
        programId: 'prog-tajwid-dasar',
        tipe: 'pilihan_ganda',
        pertanyaan: 'Ada berapa tempat makhraj huruf secara umum?',
        opsi: ['3 tempat', '5 tempat', '7 tempat', '17 tempat'],
        jawabanBenar: '5 tempat',
        urutan: 1
      },
      {
        id: 'lat-makhorijul-q2',
        babId: 'bab-makhorijul',
        programId: 'prog-tajwid-dasar',
        tipe: 'benar_salah',
        pertanyaan: 'Huruf Alif, Wawu, dan Ya adalah huruf-huruf yang keluar dari Al-Jauf (rongga mulut).',
        opsi: ['Benar', 'Salah'],
        jawabanBenar: 'Benar',
        urutan: 2
      },
      {
        id: 'lat-nunmati-q1',
        babId: 'bab-nunmati',
        programId: 'prog-tajwid-dasar',
        tipe: 'pilihan_ganda',
        pertanyaan: 'Apabila nun sukun atau tanwin bertemu dengan huruf Ba (ب), maka hukum bacaannya adalah...',
        opsi: ['Izhar', 'Idgham', 'Iqlab', 'Ikhfa'],
        jawabanBenar: 'Iqlab',
        urutan: 1
      },
      {
        id: 'lat-nunmati-q2',
        babId: 'bab-nunmati',
        programId: 'prog-tajwid-dasar',
        tipe: 'benar_salah',
        pertanyaan: 'Huruf-huruf Idgham Bilaghunnah berjumlah dua, yaitu Lam (ل) dan Ra (ر).',
        opsi: ['Benar', 'Salah'],
        jawabanBenar: 'Benar',
        urutan: 2
      }
    ];
  });

  const [programAsesmens, setProgramAsesmens] = useState<ProgramAsesmenKognitifQuestion[]>(() => {
    const data = localStorage.getItem('mh_program_asesmens');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'ase-makhorijul-q1',
        babId: 'bab-makhorijul',
        programId: 'prog-tajwid-dasar',
        tipe: 'pilihan_ganda',
        pertanyaan: 'Huruf Hamzah (أ) dan Ha (هـ) keluar dari tenggorokan bagian mana?',
        opsi: ['Aqshal Halqi (pangkal)', 'Wasthal Halqi (tengah)', 'Adnal Halqi (ujung)', 'Al-Lisan (lidah)'],
        jawabanBenar: 'Aqshal Halqi (pangkal)',
        bobot: 10,
        urutan: 1
      },
      {
        id: 'ase-makhorijul-q2',
        babId: 'bab-makhorijul',
        programId: 'prog-tajwid-dasar',
        tipe: 'benar_salah',
        pertanyaan: 'Huruf Qof (ق) keluar dari pangkal lidah dekat anak tekak.',
        opsi: ['Benar', 'Salah'],
        jawabanBenar: 'Benar',
        bobot: 10,
        urutan: 2
      },
      {
        id: 'ase-nunmati-q1',
        babId: 'bab-nunmati',
        programId: 'prog-tajwid-dasar',
        tipe: 'pilihan_ganda',
        pertanyaan: 'Berapakah jumlah huruf Ikhfa Haqiqi?',
        opsi: ['6 huruf', '15 huruf', '4 huruf', '26 huruf'],
        jawabanBenar: '15 huruf',
        bobot: 10,
        urutan: 1
      },
      {
        id: 'ase-nunmati-q2',
        babId: 'bab-nunmati',
        programId: 'prog-tajwid-dasar',
        tipe: 'benar_salah',
        pertanyaan: 'Membaca Idgham Bighunnah ditahan selama 2-3 harakat dengungnya.',
        opsi: ['Benar', 'Salah'],
        jawabanBenar: 'Benar',
        bobot: 10,
        urutan: 2
      }
    ];
  });

  const [programAsesmenSettings, setProgramAsesmenSettings] = useState<ProgramAsesmenKognitifSetting[]>(() => {
    const data = localStorage.getItem('mh_program_asesmen_settings');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'setting-makhorijul',
        programId: 'prog-tajwid-dasar',
        babId: 'bab-makhorijul',
        jumlahSoal: 2,
        durasi: 15,
        acakSoal: true,
        acakJawaban: false,
        bobotNilai: 50
      },
      {
        id: 'setting-nunmati',
        programId: 'prog-tajwid-dasar',
        babId: 'bab-nunmati',
        jumlahSoal: 2,
        durasi: 20,
        acakSoal: true,
        acakJawaban: false,
        bobotNilai: 50
      }
    ];
  });

  const [programPraktikSettings, setProgramPraktikSettings] = useState<ProgramAsesmenPraktikSetting[]>(() => {
    const data = localStorage.getItem('mh_program_praktik_settings');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'praktik-makhorijul',
        programId: 'prog-tajwid-dasar',
        babId: 'bab-makhorijul',
        tipePraktik: 'Membaca Al-Qur\'an',
        metodePelaksanaan: 'Pengumpulan Tugas',
        tugasTipe: 'Audio',
        tugasPetunjuk: 'Rekam atau unggah rekaman audio Anda melafalkan Surah Al-Fatihah ayat 1-7 dengan memerhatikan makhraj huruf tenggorokan (Halqi).',
        aspekPenilaian: {
          makharijulHuruf: 40,
          sifatulHuruf: 20,
          hukumTajwid: 10,
          kelancaran: 10,
          kefasihan: 10,
          pemahamanMateri: 10
        }
      },
      {
        id: 'praktik-nunmati',
        programId: 'prog-tajwid-dasar',
        babId: 'bab-nunmati',
        tipePraktik: 'Identifikasi Hukum Tajwid',
        metodePelaksanaan: 'Tatap Muka',
        aspekPenilaian: {
          makharijulHuruf: 20,
          sifatulHuruf: 10,
          hukumTajwid: 40,
          kelancaran: 10,
          kefasihan: 10,
          pemahamanMateri: 10
        }
      }
    ];
  });

  const [programEnrollments, setProgramEnrollments] = useState<ProgramEnrollment[]>(() => {
    const data = localStorage.getItem('mh_program_enrollments');
    return data ? JSON.parse(data) : [];
  });

  const [pengumumans, setPengumumans] = useState<Pengumuman[]>(() => {
    try {
      const data = localStorage.getItem('mh_pengumumans');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Filter out legacy dummy announcements
          const clean = parsed.filter((p: any) => p && p.id && !['ann-1', 'ann-2', 'ann-3'].includes(p.id) && !String(p.id).startsWith('dummy-'));
          if (clean.length !== parsed.length) {
            localStorage.setItem('mh_pengumumans', JSON.stringify(clean));
          }
          return clean;
        }
      }
    } catch (e) {
      console.warn('Error parsing cached pengumumans:', e);
    }
    return [];
  });

  // Administrasi Guru State Definitions
  const [capaianPembelajarans, setCapaianPembelajarans] = useState<CapaianPembelajaran[]>(() => {
    try {
      const data = localStorage.getItem('mh_capaian_pembelajaran');
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_CAPAIAN_PEMBELAJARAN;
  });

  const [tujuanPembelajarans, setTujuanPembelajarans] = useState<TujuanPembelajaran[]>(() => {
    try {
      const data = localStorage.getItem('mh_tujuan_pembelajaran');
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_TUJUAN_PEMBELAJARAN;
  });

  const [bankAktivitas, setBankAktivitas] = useState<BankAktivitasPembelajaran[]>(() => {
    try {
      const data = localStorage.getItem('mh_bank_aktivitas');
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_BANK_AKTIVITAS;
  });

  const [rppTemplates, setRppTemplates] = useState<RppTemplateAdmin[]>(() => {
    try {
      const data = localStorage.getItem('mh_rpp_templates');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((tpl: RppTemplateAdmin) => {
            const initialMatch = INITIAL_RPP_TEMPLATES.find(init => init.id === tpl.id);
            const openArr = (Array.isArray(tpl.pembukaanDefault) && tpl.pembukaanDefault.length > 0)
              ? tpl.pembukaanDefault
              : (initialMatch?.pembukaanDefault || (tpl.kegiatanPendahuluan ? tpl.kegiatanPendahuluan.split('\n').map((s: string) => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean) : []));
            const intiArr = (Array.isArray(tpl.intiDefault) && tpl.intiDefault.length > 0)
              ? tpl.intiDefault
              : (initialMatch?.intiDefault || (tpl.kegiatanInti ? tpl.kegiatanInti.split('\n').map((s: string) => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean) : []));
            const closeArr = (Array.isArray(tpl.penutupDefault) && tpl.penutupDefault.length > 0)
              ? tpl.penutupDefault
              : (initialMatch?.penutupDefault || (tpl.kegiatanPenutup ? tpl.kegiatanPenutup.split('\n').map((s: string) => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean) : []));

            return {
              ...tpl,
              fase: tpl.fase || initialMatch?.fase || 'Fase D (SMP/MTs/Wustha)',
              alokasiWaktu: tpl.alokasiWaktu || tpl.alokasiWaktuDefault || initialMatch?.alokasiWaktu || '2 x 45 Menit',
              capaianPembelajaranId: tpl.capaianPembelajaranId || initialMatch?.capaianPembelajaranId || '',
              tujuanPembelajaranIds: (tpl.tujuanPembelajaranIds && tpl.tujuanPembelajaranIds.length > 0) ? tpl.tujuanPembelajaranIds : (initialMatch?.tujuanPembelajaranIds || []),
              pembukaanDefault: openArr,
              intiDefault: intiArr,
              penutupDefault: closeArr
            };
          });
        }
      }
    } catch {}
    return INITIAL_RPP_TEMPLATES;
  });

  const [guruRppList, setGuruRppList] = useState<GuruRppDokumen[]>(() => {
    try {
      const data = localStorage.getItem('mh_guru_rpp_list');
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_GURU_RPP_LIST;
  });

  const [pilotTestingConfig, setPilotTestingConfig] = useState<PilotTestingConfig>(() => {
    try {
      const data = localStorage.getItem('mh_pilot_testing_config');
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_PILOT_CONFIG;
  });

  const [sopPenilaianDoc, setSopPenilaianDoc] = useState<SopStandarPenilaianDoc>(() => {
    try {
      const data = localStorage.getItem('mh_sop_penilaian_doc');
      if (data) return normalizeSopPenilaianDoc(JSON.parse(data));
    } catch {}
    return DEFAULT_SOP_PENILAIAN_DOC;
  });

  const sanitizeFeatureLabConfig = (raw: any): FeatureLabConfig => {
    if (!raw || typeof raw !== 'object') return DEFAULT_FEATURE_LAB_CONFIG;
    const deletedIds: string[] = Array.isArray(raw.deletedFeatureIds) ? raw.deletedFeatureIds : [];
    const filteredTesters: string[] = (raw.betaTesterUserIds || DEFAULT_FEATURE_LAB_CONFIG.betaTesterUserIds || []).filter((id: string) => id !== 'adm-1');

    // Saved features not in deleted list
    const savedFeatures: FeatureFlagItem[] = Array.isArray(raw.features)
      ? raw.features.filter((f: any) => f && f.id && !deletedIds.includes(f.id))
      : [];

    // Default features that have not been deleted and are not yet in savedFeatures
    const defaultRemaining = (DEFAULT_FEATURE_FLAGS || []).filter(
      df => !deletedIds.includes(df.id) && !savedFeatures.some(sf => sf.id === df.id)
    );

    return {
      ...DEFAULT_FEATURE_LAB_CONFIG,
      ...raw,
      deletedFeatureIds: deletedIds,
      betaTesterUserIds: filteredTesters,
      features: [...savedFeatures, ...defaultRemaining],
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  };

  const [featureLabConfig, setFeatureLabConfig] = useState<FeatureLabConfig>(() => {
    try {
      const data = localStorage.getItem('mh_feature_lab_config');
      if (data) {
        return sanitizeFeatureLabConfig(JSON.parse(data));
      }
    } catch {}
    return DEFAULT_FEATURE_LAB_CONFIG;
  });

  const [capaianBacaanConfigs, setCapaianBacaanConfigs] = useState<CapaianBacaanAyatConfig[]>(() => {
    try {
      const data = localStorage.getItem('mh_capaian_bacaan_configs');
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Merge preset perkata mapping (kataLafaz, kataUrut) if missing
          return parsed.map((cfg: CapaianBacaanAyatConfig) => {
            const presetMatch = DEFAULT_PRESET_CAPAIAN_BACAAN.find(p => p.suratNomor === cfg.suratNomor && p.nomorAyat === cfg.nomorAyat);
            if (presetMatch) {
              const updatedTargets = (cfg.targets || []).map(tgt => {
                const pTgt = presetMatch.targets.find(t => t.id === tgt.id || t.unsur === tgt.unsur);
                return {
                  ...tgt,
                  kataLafaz: tgt.kataLafaz || pTgt?.kataLafaz,
                  kataUrut: tgt.kataUrut || pTgt?.kataUrut,
                  kategoriKesalahanNama: tgt.kategoriKesalahanNama || pTgt?.kategoriKesalahanNama,
                  subKategoriKesalahanNama: tgt.subKategoriKesalahanNama || pTgt?.subKategoriKesalahanNama
                };
              });
              return { ...cfg, targets: updatedTargets };
            }
            return cfg;
          });
        }
      }
    } catch {}
    return DEFAULT_PRESET_CAPAIAN_BACAAN;
  });

  const [capaianBacaanSesiList, setCapaianBacaanSesiList] = useState<CapaianBacaanSesiPertemuan[]>(() => {
    try {
      const data = localStorage.getItem('mh_capaian_bacaan_sesi_list');
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  });

  const sanitizeTrialSettings = (raw: any): CapaianBacaanTrialSettings => {
    if (!raw || typeof raw !== 'object') {
      return { 
        enabledGuruIds: [], 
        enabledElemenIds: ['qiraah-surah-wajib-4375', 'qiroah'], 
        enabledElemenNames: ['Qiraah Surah Wajib', 'Qiroah'],
        selectedElemenItems: [{ id: 'qiraah-surah-wajib-4375', nama: 'Qiraah Surah Wajib' }],
        presetLoaded: true 
      };
    }
    const rawIds = Array.isArray(raw.enabledGuruIds) ? raw.enabledGuruIds : [];
    const cleanIds = Array.from(new Set(
      rawIds.filter((id: any) => typeof id === 'string' && id.trim().length > 0 && id !== 'g-1' && id !== 'g-2')
    ));

    const rawElemIds = Array.isArray(raw.enabledElemenIds) ? raw.enabledElemenIds : [];
    const cleanElemIds = Array.from(new Set(
      rawElemIds.filter((id: any) => typeof id === 'string' && id.trim().length > 0)
    ));

    const rawElemNames = Array.isArray(raw.enabledElemenNames) ? raw.enabledElemenNames : [];
    const cleanElemNames = Array.from(new Set(
      rawElemNames.filter((id: any) => typeof id === 'string' && id.trim().length > 0)
    ));

    const rawElemItems = Array.isArray(raw.selectedElemenItems) ? raw.selectedElemenItems : [];
    const cleanElemItems = rawElemItems.filter((item: any) => item && typeof item === 'object' && item.id && item.nama);

    return {
      ...raw,
      enabledGuruIds: cleanIds,
      enabledElemenIds: cleanElemIds,
      enabledElemenNames: cleanElemNames,
      selectedElemenItems: cleanElemItems,
      presetLoaded: raw.presetLoaded ?? true
    };
  };

  const [capaianBacaanTrialSettings, setCapaianBacaanTrialSettings] = useState<CapaianBacaanTrialSettings>(() => {
    try {
      const data = localStorage.getItem('mh_capaian_bacaan_trial');
      if (data) return sanitizeTrialSettings(JSON.parse(data));
    } catch {}
    return { 
      enabledGuruIds: ['gru-1', 'gru-koordinator'], 
      enabledElemenIds: ['qiraah-surah-wajib-4375', 'qiroah'], 
      enabledElemenNames: ['Qiraah Surah Wajib', 'Qiroah'],
      selectedElemenItems: [{ id: 'qiraah-surah-wajib-4375', nama: 'Qiraah Surah Wajib' }],
      presetLoaded: true 
    };
  });

  const [currentSession, setCurrentSession] = useState<Session>(() => {
    const data = localStorage.getItem('mh_session');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed?.user?.id === 'adm-1') {
          if (isLegacyPersonalData(parsed.user.namaLengkap) || !parsed.user.namaLengkap) {
            parsed.user.namaLengkap = INITIAL_ADMINS[0].namaLengkap;
          }
          if (isLegacyPersonalData(parsed.user.email) || !parsed.user.email) {
            parsed.user.email = INITIAL_ADMINS[0].email;
          }
          localStorage.setItem('mh_session', JSON.stringify(parsed));
        }
        if (parsed?.user?.id === 'gru-koordinator' && isLegacyPersonalData(parsed.user.namaLengkap)) {
          parsed.user.namaLengkap = INITIAL_GURUS[0].namaLengkap;
          localStorage.setItem('mh_session', JSON.stringify(parsed));
        }
        return parsed;
      } catch {}
    }
    return {
      user: null,
      waktuLogin: ''
    };
  });

  const [pwaSettings, setPwaSettings] = useState<PwaSettings>(() => {
    const data = localStorage.getItem('mh_pwa_settings');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        return sanitizePwaSettings(parsed, strukturLembaga?.yayasan?.nama);
      } catch {}
    }
    return sanitizePwaSettings(undefined, strukturLembaga?.yayasan?.nama);
  });

  const [institutionTheme, setInstitutionTheme] = useState<InstitutionThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('mh_institution_theme');
      if (saved) {
        return { ...DEFAULT_INSTITUTION_THEME, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_INSTITUTION_THEME;
  });

  const [hijriSetting, setHijriSetting] = useState<HijriCalendarSetting>(() => {
    try {
      const data = localStorage.getItem('mh_hijri_setting');
      if (data) return JSON.parse(data);
    } catch {}
    return DEFAULT_HIJRI_SETTING;
  });

  const [rekapPresensiTemplate, setRekapPresensiTemplate] = useState<RekapPresensiPdfTemplate>(() =>
    sanitizeRekapPresensiTemplate(getSavedPresensiTemplate(), strukturLembaga?.yayasan?.nama)
  );

  const defaultDocTemplates = useMemo(() => [
    {
      id: 'doc-ba-default',
      judulDokumen: 'Berita Acara Assessment Kelulusan Santri',
      peruntukan: 'BERITA ACARA ASSESSMENT',
      namaYayasan: pwaSettings?.baNamaYayasan || DEFAULT_INSTITUTION_NAME.toUpperCase(),
      namaPanitia: pwaSettings?.baNamaPanitia || 'PANITIA ASSESSMENT & EVALUASI AKADEMIK SANTRI',
      alamatKontak: pwaSettings?.baAlamatKontak || `Sekretariat ${DEFAULT_INSTITUTION_NAME}`,
      ttd1Jabatan: pwaSettings?.baTtd1Jabatan || 'PENGUJI',
      ttd1Nama: pwaSettings?.baTtd1Nama || pwaSettings?.baTtd1Sub || 'Penguji Assessment',
      ttd1Sub: pwaSettings?.baTtd1Nama || pwaSettings?.baTtd1Sub || '',
      ttd2Jabatan: pwaSettings?.baTtd2Jabatan || 'KOORDINATOR BIDANG',
      ttd2Nama: pwaSettings?.baTtd2Nama || 'Koordinator Bidang',
      ttd2Sub: '',
      nomorFormat: 'BA/ASS/2026/07/004',
      teksPengantar: 'Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT] oleh Tim Dewan Penguji terhadap santri di bawah ini dengan hasil rekapitulasi penilaian sebagai berikut:',
      teksPenutup: 'Demikian berita acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
      catatanKaki: 'Dokumen ini diterbitkan secara sah oleh Panitia Assessment Santri.',
      isDefault: true
    },
    {
      id: 'doc-transkrip-default',
      judulDokumen: 'Lembar Rincian Evaluasi & Transkrip Nilai Assessment',
      peruntukan: 'LEMBAR PENILAIAN & TRANSKRIP',
      namaYayasan: pwaSettings?.baNamaYayasan || DEFAULT_INSTITUTION_NAME.toUpperCase(),
      namaPanitia: 'TIM EVALUASI DAN PENILAIAN AKADEMIK SANTRI',
      alamatKontak: pwaSettings?.baAlamatKontak || `Sekretariat ${DEFAULT_INSTITUTION_NAME}`,
      ttd1Jabatan: 'PENGUJI',
      ttd1Nama: pwaSettings?.baTtd1Nama || 'Penguji Assessment',
      ttd1Sub: '',
      ttd2Jabatan: 'KOORDINATOR BIDANG',
      ttd2Nama: pwaSettings?.baTtd2Nama || 'Koordinator Bidang',
      ttd2Sub: '',
      nomorFormat: 'TRK/EVAL/2026/07/012',
      teksPengantar: 'Berikut adalah rincian transkrip penilaian evaluasi pembelajaran santri berdasarkan kriteria rubrik:',
      teksPenutup: 'Demikian rincian evaluasi hasil ujian assessment ini untuk dijadikan acuan pembelajaran.',
      catatanKaki: 'Rincian nilai mencakup evaluasi tajwid, fashohah, dan kelancaran hafalan.',
      isDefault: true
    },
    {
      id: 'doc-sertifikat-default',
      judulDokumen: 'Sertifikat Kelulusan Ujian & Syahadah Assessment',
      peruntukan: 'SERTIFIKAT KELULUSAN',
      namaYayasan: pwaSettings?.baNamaYayasan || DEFAULT_INSTITUTION_NAME.toUpperCase(),
      namaPanitia: 'PANITIA SYAHADAH & KELULUSAN UJIAN TAHFIDZ',
      alamatKontak: pwaSettings?.baAlamatKontak || `Sekretariat ${DEFAULT_INSTITUTION_NAME}`,
      ttd1Jabatan: 'PENGUJI',
      ttd1Nama: pwaSettings?.baTtd1Nama || 'Penguji Assessment',
      ttd1Sub: '',
      ttd2Jabatan: 'KOORDINATOR BIDANG',
      ttd2Nama: pwaSettings?.baTtd2Nama || 'Koordinator Bidang',
      ttd2Sub: '',
      nomorFormat: 'SRT/LULUS/2026/07/088',
      teksPengantar: 'Diberikan kepada santri atas keberhasilan menyelesaikan seluruh tahapan ujian assessment dengan predikat kelulusan:',
      teksPenutup: 'Semoga ilmu yang diperoleh mendatangkan keberkahan dan dapat terus diamalkan.',
      catatanKaki: 'Diberikan kepada santri yang dinyatakan LULUS Mumtaz pada Ujian Assessment.',
      isDefault: true
    }
  ], [pwaSettings]);

  const cleanDocTemplateSignatures = (tmpl: any) => {
    if (!tmpl) return tmpl;
    const t1 = (tmpl.ttd1Jabatan || '').toLowerCase();
    const t2 = (tmpl.ttd2Jabatan || '').toLowerCase();
    const isOld1 = !tmpl.ttd1Jabatan || t1.includes('penguji assessment') || t1.includes('guru penguji') || t1.includes('ketua tim penguji') || t1.includes('ketua penguji');
    const isOld2 = !tmpl.ttd2Jabatan || t2.includes('pimpinan pesantren') || t2.includes('pengasuh') || t2.includes('koordinator madrasah') || t2.includes('kepala bagian kurikulum');
    const safeNamaYayasan = isLegacyPersonalData(tmpl.namaYayasan) || isLegacyInstitutionBranding(tmpl.namaYayasan)
      ? DEFAULT_INSTITUTION_NAME.toUpperCase()
      : (tmpl.namaYayasan || DEFAULT_INSTITUTION_NAME.toUpperCase());
    const safeAlamatKontak = isLegacyPersonalData(tmpl.alamatKontak) || isLegacyInstitutionBranding(tmpl.alamatKontak)
      ? `Sekretariat ${DEFAULT_INSTITUTION_NAME}`
      : (tmpl.alamatKontak || `Sekretariat ${DEFAULT_INSTITUTION_NAME}`);
    const safeTtd1Nama = tmpl.ttd1Nama && !isLegacyPersonalData(tmpl.ttd1Nama) && !tmpl.ttd1Nama.toLowerCase().includes('asatidzah')
      ? tmpl.ttd1Nama
      : 'Penguji Assessment';
    const safeTtd2Nama = tmpl.ttd2Nama && !isLegacyPersonalData(tmpl.ttd2Nama)
      ? tmpl.ttd2Nama
      : 'Koordinator Bidang';
    return {
      ...tmpl,
      namaYayasan: safeNamaYayasan,
      alamatKontak: safeAlamatKontak,
      ttd1Jabatan: isOld1 ? 'PENGUJI' : tmpl.ttd1Jabatan,
      ttd1Nama: safeTtd1Nama,
      ttd1Sub: '',
      ttd2Jabatan: isOld2 ? 'KOORDINATOR BIDANG' : tmpl.ttd2Jabatan,
      ttd2Nama: safeTtd2Nama,
      ttd2Sub: ''
    };
  };

  const [docTemplates, setDocTemplates] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('mh_doc_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(cleanDocTemplateSignatures);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaultDocTemplates;
  });

  const [selectedGuruHalaqahId, setSelectedGuruHalaqahIdState] = useState<string | null>(() => {
    return localStorage.getItem('mh_selected_guru_halaqah_id');
  });

  const setSelectedGuruHalaqahId = (id: string | null) => {
    setSelectedGuruHalaqahIdState(id);
    const uId = currentSession?.user?.id || '';
    if (id) {
      localStorage.setItem('mh_selected_guru_halaqah_id', id);
      if (uId) {
        localStorage.setItem(`mh_selected_guru_halaqah_id_${uId}`, id);
        localStorage.setItem(`mh_last_used_halaqah_${uId}`, id);
      }
    } else {
      localStorage.removeItem('mh_selected_guru_halaqah_id');
      if (uId) {
        localStorage.removeItem(`mh_selected_guru_halaqah_id_${uId}`);
        localStorage.removeItem(`mh_last_used_halaqah_${uId}`);
      }
    }
  };

  const [themePreference, setThemePreferenceState] = useState<'light' | 'dark' | 'system'>(() => {
    const storedPref = localStorage.getItem('mh_theme_preference');
    if (storedPref === 'light' || storedPref === 'dark' || storedPref === 'system') {
      return storedPref as 'light' | 'dark' | 'system';
    }
    const storedDarkMode = localStorage.getItem('mh_dark_mode');
    if (storedDarkMode === 'true') return 'dark';
    if (storedDarkMode === 'false') return 'light';
    return 'system';
  });

  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    const storedPref = localStorage.getItem('mh_theme_preference');
    if (storedPref === 'dark') return true;
    if (storedPref === 'light') return false;
    if (storedPref === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
    }
    const storedDarkMode = localStorage.getItem('mh_dark_mode');
    return storedDarkMode === 'true';
  });

  const setThemePreference = (pref: 'light' | 'dark' | 'system') => {
    setThemePreferenceState(pref);
  };

  const setDarkMode = (dark: boolean) => {
    setThemePreferenceState(dark ? 'dark' : 'light');
  };

  const [typography, setTypography] = useState<{
    selectedFontPreset: string;
    customFont: { name: string; url: string; fileName: string } | null;
    ornamentStyle: 'bracket' | 'flower' | 'square' | 'circle';
    applyFontGlobally: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('mh_typography_backup');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse typography backup', e);
    }
    return {
      selectedFontPreset: 'System',
      customFont: null,
      ornamentStyle: 'bracket',
      applyFontGlobally: true
    };
  });

  const [modulCategories, setModulCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mh_modul_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Hadits', 'Adab & Akhlak', 'Fiqih Ibadah', 'Tajwid Modern'];
  });

  const [quranLinesConfig, setQuranLinesConfig] = useState<QuranLinesConfig>(() => {
    try {
      const saved = localStorage.getItem('mh_quran_lines_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      defaultLinesPerPage: 15,
      customPageLines: [
        { page: 1, lines: 7 },
        { page: 2, lines: 7 }
      ]
    };
  });

  const [nonQuranFonts, setNonQuranFonts] = useState<NonQuranFont[]>(() => {
    try {
      const saved = localStorage.getItem('mh_nonquran_fonts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [generalTargets, setGeneralTargets] = useState<{
    pekanan: string;
    bulanan: string;
    kuartal: string;
    semester: string;
    tahunan: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('mh_general_targets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      pekanan: "Target Hafalan Baru: Minimal 1 halaman / 10 ayat per pekan",
      bulanan: "Ujian Murojaah Bulanan: Sabqi & Manzil kelulusan 1 juz berjalan",
      kuartal: "Menyelesaikan Penilaian Kuartalan Teori Tajwid & Makhorijul Huruf",
      semester: "Ujian Tasmi' Ghab Sekali Duduk 1 Juz Penuh di depan Komite",
      tahunan: "Kelulusan Munaqosyah Akbar & Wisuda Khatam Juz 30 / Juz 29",
    };
  });

  const [studentTargets, setStudentTargets] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('mh_student_targets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const sanitizeGuruAttendanceList = (list: any[]) => {
    if (!Array.isArray(list)) return [];
    return list.filter(item => {
      if (!item) return false;
      if (item.siswaId && !item.guruId) return false;
      if (isGuruSelfSubmittedAttendance(item)) return false;
      const gNama = (item.guruNama || '').trim().toLowerCase();
      const gId = (item.guruId || '').trim();
      if (!gId && (!gNama || gNama === 'guru')) return false;
      if (gNama === 'guru' && !gId) return false;
      return true;
    });
  };

  const sanitizeStudentAttendanceList = (list: any[]) => {
    if (!Array.isArray(list)) return [];
    return list.filter(item => {
      if (!item || typeof item !== 'object') return false;
      // Valid student attendance must have a valid siswaId and tanggal
      if (!item.siswaId || typeof item.tanggal !== 'string' || !item.tanggal.trim()) {
        return false;
      }
      return true;
    });
  };

  const [guruAttendance, setGuruAttendance] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('mh_guru_attendance');
      if (saved) {
        const parsed = JSON.parse(saved);
        const sanitized = sanitizeGuruAttendanceList(parsed);
        if (Array.isArray(parsed) && parsed.some(isGuruSelfSubmittedAttendance)) {
          try {
            localStorage.setItem('mh_guru_attendance', JSON.stringify(sanitized));
          } catch {}
        }
        return sanitized;
      }
    } catch {}
    return [];
  });

  const [studentAttendance, setStudentAttendance] = useState<any[]>(() => {
    const isPurged = typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';
    try {
      const saved = localStorage.getItem('mh_student_attendance');
      if (saved) {
        const parsed = sanitizeStudentAttendanceList(JSON.parse(saved));
        try {
          localStorage.setItem('mh_student_attendance', JSON.stringify(parsed));
        } catch {}
        return isPurged ? parsed.filter((i: any) => !DEMO_SISWA_IDS.includes(i.siswaId)) : parsed;
      }
      // Migration from legacy mh_guru_attendance if it had student records
      const legacySaved = localStorage.getItem('mh_guru_attendance');
      if (legacySaved) {
        const parsedLegacy = JSON.parse(legacySaved);
        if (Array.isArray(parsedLegacy)) {
          const studentItems = sanitizeStudentAttendanceList(parsedLegacy.filter(i => i && i.siswaId));
          if (studentItems.length > 0) {
            return isPurged ? studentItems.filter((i: any) => !DEMO_SISWA_IDS.includes(i.siswaId)) : studentItems;
          }
        }
      }
    } catch {}

    if (isPurged) return [];

    const seed: any[] = [];
    const dates = [
      '2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30',
      '2026-04-10', '2026-04-15', '2026-04-20', '2026-04-25',
      '2026-03-05', '2026-03-12', '2026-03-24',
      '2026-01-15', '2026-01-20', '2026-02-10', '2026-02-22',
      '2025-10-12', '2025-10-25', '2025-11-14', '2025-11-28', '2025-12-10'
    ];

    INITIAL_SISWAS.forEach(s => {
      dates.forEach(d => {
        let charSum = 0;
        for (let i = 0; i < s.id.length; i++) charSum += s.id.charCodeAt(i);
        let dateSum = 0;
        for (let i = 0; i < d.length; i++) dateSum += d.charCodeAt(i);
        const rand = ((charSum * 31 + dateSum) % 100) / 100;

        let status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' = 'Hadir';
        let catatan = '';
        if (rand < 0.05) {
          status = 'Izin';
          catatan = 'Acara Keluarga';
        } else if (rand < 0.10) {
          status = 'Sakit';
          catatan = 'Demam';
        } else if (rand < 0.12) {
          status = 'Alpha';
        }
        seed.push({
          id: `att-${d}-${s.id}`,
          tanggal: d,
          siswaId: s.id,
          siswaNama: s.namaLengkap,
          status,
          catatan
        });
      });
    });
    return seed;
  });

  const [guruSchedules, setGuruSchedules] = useState<JadwalMengajarGuru[]>(() => {
    try {
      const saved = localStorage.getItem('mh_guru_schedules');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'sch-1',
        guruId: 'gru-koordinator',
        guruNama: 'Koordinator Halaqah',
        hari: 'Kamis',
        jamMulai: '07:30',
        jamSelesai: '09:00',
        halaqahId: 'hal-1',
        halaqahNama: 'Halaqah Abu Bakar Ash-Shidiq',
        materi: 'Halaqah Tahfidz Pagi',
        status: StatusAktif.AKTIF
      },
      {
        id: 'sch-2',
        guruId: 'gru-koordinator',
        guruNama: 'Koordinator Halaqah',
        hari: 'Jumat',
        jamMulai: '07:30',
        jamSelesai: '09:00',
        halaqahId: 'hal-1',
        halaqahNama: 'Halaqah Abu Bakar Ash-Shidiq',
        materi: 'Halaqah Tahfidz Pagi',
        status: StatusAktif.AKTIF
      }
    ];
  });

  const [keepNotes, setKeepNotes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('mh_keep_notes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [studentBookmarks, setStudentBookmarks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('mh_student_bookmarks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [whiteboardCanvas, setWhiteboardCanvas] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('mh_whiteboard_canvas');
      if (saved) return saved;
    } catch {}
    return '';
  });

  const [whiteboardPins, setWhiteboardPins] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('mh_whiteboard_pins');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  const isOfflineRef = useRef(isOffline);
  const isQuotaExceededRef = useRef(isQuotaExceeded);

  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);

  useEffect(() => {
    isQuotaExceededRef.current = isQuotaExceeded;
  }, [isQuotaExceeded]);

  const [isSiswaOperationalOpen, setIsSiswaOperationalOpen] = useState<boolean>(() => {
    return isWithinOperationalHours();
  });

  const [jitsiConfig, setJitsiConfig] = useState<{
    appId: string;
    keyId: string;
    privateKey: string;
  }>(() => {
    try {
      const storedAppId = localStorage.getItem('mh_jitsi_app_id');
      const storedKeyId = localStorage.getItem('mh_jitsi_key_id');
      const storedPrivateKey = localStorage.getItem('mh_jitsi_private_key');
      return {
        appId: storedAppId || DEFAULT_APP_ID,
        keyId: storedKeyId || DEFAULT_KEY_ID,
        privateKey: storedPrivateKey || DEFAULT_PRIVATE_KEY_PEM
      };
    } catch (e) {
      return {
        appId: DEFAULT_APP_ID,
        keyId: DEFAULT_KEY_ID,
        privateKey: DEFAULT_PRIVATE_KEY_PEM
      };
    }
  });

  useEffect(() => {
    globalSetQuotaExceeded = setIsQuotaExceeded;
    globalSetOffline = setIsOffline;
    return () => {
      globalSetQuotaExceeded = null;
      globalSetOffline = null;
    };
  }, []);

  // Auto-sync HALAQAH: Data kelompok halaqah yang dibuat pada menu LEMBAGA > Pengurusan Unit
  // (strukturLembaga.jenjangList) otomatis tampil dan tersinkronisasi pada menu HALAQAH > Halaqah Lembaga
  useEffect(() => {
    if (!strukturLembaga?.jenjangList || !Array.isArray(strukturLembaga.jenjangList)) return;

    setHalaqahs(prev => {
      let hasChanges = false;
      const updated = [...prev];

      strukturLembaga.jenjangList.forEach(jj => {
        const sch = (strukturLembaga.sekolahList || []).find(s => s.id === jj.sekolahId);
        const dir = sch?.direktoratId ? (strukturLembaga.direktoratList || []).find(d => d.id === sch.direktoratId) : null;
        const cleanJjGuru = normalizeTeacherName(jj.namaKepalaSekolah);
        const matchedGuru = gurus.find(g => {
          if (!cleanJjGuru) return false;
          const cleanGuru = normalizeTeacherName(g.namaLengkap);
          if (!cleanGuru) return false;
          if (cleanJjGuru === cleanGuru) return true;
          if (cleanJjGuru.includes(cleanGuru) || cleanGuru.includes(cleanJjGuru)) return true;
          const jjWords = cleanJjGuru.split(/\s+/).filter(w => w.length > 2);
          const guruWords = cleanGuru.split(/\s+/).filter(w => w.length > 2);
          return jjWords.some(w => guruWords.includes(w));
        });

        const jjKey = normalizeHalaqahKey(jj.nama);
        const existingIndex = updated.findIndex(h => 
          h.id === jj.id || 
          (jjKey && normalizeHalaqahKey(h.namaHalaqah) === jjKey && h.sekolahId === jj.sekolahId)
        );

        if (existingIndex >= 0) {
          const cur = updated[existingIndex];
          const newGuruId = matchedGuru?.id || (jj.namaKepalaSekolah ? cur.guruPembimbingId : '');
          const newGuruNama = jj.namaKepalaSekolah || cur.guruPembimbingNama || 'Belum Ditugasi';
          if (
            cur.namaHalaqah !== jj.nama ||
            cur.guruPembimbingNama !== newGuruNama ||
            (newGuruId && cur.guruPembimbingId !== newGuruId) ||
            cur.sekolahId !== jj.sekolahId ||
            cur.jenjangId !== jj.id
          ) {
            updated[existingIndex] = {
              ...cur,
              namaHalaqah: jj.nama,
              guruPembimbingNama: newGuruNama,
              guruPembimbingId: newGuruId,
              sekolahId: jj.sekolahId,
              sekolahNama: sch?.nama || cur.sekolahNama || '',
              jenjangId: jj.id,
              jenjangNama: jj.nama,
              direktoratId: sch?.direktoratId || cur.direktoratId || '',
              direktoratNama: dir?.nama || cur.direktoratNama || ''
            };
            hasChanges = true;
          }
        } else {
          updated.push({
            id: jj.id,
            namaHalaqah: jj.nama,
            guruPembimbingId: matchedGuru?.id || '',
            guruPembimbingNama: jj.namaKepalaSekolah || matchedGuru?.namaLengkap || 'Belum Ditugasi',
            kapasitasPeserta: 10,
            keterangan: `Halaqah resmi ${sch?.nama || 'Lembaga'}`,
            status: StatusAktif.AKTIF,
            warnaIdentitas: '#10B981',
            sekolahId: jj.sekolahId,
            sekolahNama: sch?.nama || '',
            jenjangId: jj.id,
            jenjangNama: jj.nama,
            direktoratId: sch?.direktoratId || '',
            direktoratNama: dir?.nama || '',
            sourceType: 'foundation'
          });
          hasChanges = true;
        }
      });

      // Filter out deleted foundation halaqahs (only those auto-generated with jj- prefix)
      const validJenjangIds = new Set(strukturLembaga.jenjangList.map(j => j.id));
      const finalUpdated = updated.filter(h => {
        if (h.sourceType === 'foundation' && h.id.startsWith('jj-')) {
          return validJenjangIds.has(h.id);
        }
        return true;
      });

      if (finalUpdated.length !== updated.length) hasChanges = true;

      if (hasChanges) {
        try {
          localStorage.setItem('mh_halaqahs', JSON.stringify(finalUpdated));
        } catch {}
        return finalUpdated;
      }
      return prev;
    });
  }, [strukturLembaga.jenjangList, strukturLembaga.sekolahList, gurus]);

  // Self-heal bloated data in LocalStorage & State on startup (e.g. if profile photos are too large)
  useEffect(() => {
    const healBloatedData = async () => {
      try {
        let isHealed = false;

        // Check if database states were accidentally wiped/empty due to initial offline/quota cache failure
        let activeAdmins = admins;
        let activeGurus = gurus;
        let activeSiswas = siswas;
        let activeKelases = kelases;
        let activeHalaqahs = halaqahs;
        let activeSetorans = setorans;

        const isPurged = typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';

        // Notice: We removed the aggressive fallback to INITIAL_* arrays here. 
        // If admins/gurus/siswas are empty in localStorage, it means they cleared cache. 
        // We should let them be empty and wait for Firebase to sync the real data 
        // to prevent users from logging in offline using default passwords.
        
        if (kelases.length === 0 && INITIAL_KELAS.length > 0) {
          activeKelases = INITIAL_KELAS;
          isHealed = true;
          console.log("Self-healing: Restored empty kelases to initial defaults.");
        }
        if (halaqahs.length === 0 && INITIAL_HALAQAH.length > 0) {
          activeHalaqahs = INITIAL_HALAQAH;
          isHealed = true;
          console.log("Self-healing: Restored empty halaqahs to initial defaults.");
        }
        if (setorans.length === 0 && INITIAL_SETORANS.length > 0 && !isPurged) {
          activeSetorans = INITIAL_SETORANS;
          isHealed = true;
          console.log("Self-healing: Restored empty setorans to initial defaults.");
        }
        if (rawModuls.length === 0 && INITIAL_MODULS.length > 0) {
          isHealed = true;
          setRawModuls(sortModules(INITIAL_MODULS));
          localStorage.setItem('mh_moduls', JSON.stringify(INITIAL_MODULS));
          console.log("Self-healing: Restored empty moduls to initial defaults.");
        }

        // 1. Heal Admins
        const healedAdmins = await Promise.all(activeAdmins.map(async (a) => {
          if (a.fotoProfil && a.fotoProfil.startsWith('data:image') && a.fotoProfil.length > 150000) {
            console.log(`Compressing bloated profile image for Admin: ${a.namaLengkap} (${a.fotoProfil.length} chars)`);
            const compressed = await compressBase64Image(a.fotoProfil, 200, 200, 0.7);
            isHealed = true;
            return { ...a, fotoProfil: compressed };
          }
          return a;
        }));

        // 2. Heal Gurus
        const healedGurus = await Promise.all(activeGurus.map(async (g) => {
          if (g.fotoProfil && g.fotoProfil.startsWith('data:image') && g.fotoProfil.length > 150000) {
            console.log(`Compressing bloated profile image for Guru: ${g.namaLengkap} (${g.fotoProfil.length} chars)`);
            const compressed = await compressBase64Image(g.fotoProfil, 200, 200, 0.7);
            isHealed = true;
            return { ...g, fotoProfil: compressed };
          }
          return g;
        }));

        // 3. Heal Siswas
        const healedSiswas = await Promise.all(activeSiswas.map(async (s) => {
          if (s.fotoProfil && s.fotoProfil.startsWith('data:image') && s.fotoProfil.length > 150000) {
            console.log(`Compressing bloated profile image for Siswa: ${s.namaLengkap} (${s.fotoProfil.length} chars)`);
            const compressed = await compressBase64Image(s.fotoProfil, 200, 200, 0.7);
            isHealed = true;
            return { ...s, fotoProfil: compressed };
          }
          return s;
        }));

        if (isHealed) {
          setAdmins(healedAdmins);
          setGurus(healedGurus);
          setSiswas(healedSiswas);
          setKelases(activeKelases);
          setHalaqahs(activeHalaqahs);
          setSetorans(activeSetorans);

          localStorage.setItem('mh_admins', JSON.stringify(healedAdmins));
          localStorage.setItem('mh_gurus', JSON.stringify(healedGurus));
          localStorage.setItem('mh_siswas', JSON.stringify(healedSiswas));
          localStorage.setItem('mh_kelases', JSON.stringify(activeKelases));
          localStorage.setItem('mh_halaqahs', JSON.stringify(activeHalaqahs));
          localStorage.setItem('mh_setorans', JSON.stringify(activeSetorans));
          console.log("Self-healing: Successfully compressed profile images and/or restored empty local data states.");
        }
      } catch (err) {
        console.error("Self-healing error:", err);
      }
    };

    healBloatedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Combine rawModuls and rawPages whenever they change
  useEffect(() => {
    const combined = rawModuls.map(m => {
      const id = m.id;
      const fullModul = { ...m };
      
      // Rebuild halamanGambar & halamanGambarPerJilid based on rawPages
      fullModul.pdfBase64 = rawPages[`${id}_-1_-1`] || '';
      if (fullModul.isMultiJilid) {
        const countJilid = fullModul.jumlahJilid || 1;
        const pageCounts = fullModul.halamanPerJilid || [10];
        
        const imagesPerJilid: string[][] = [];
        for (let j = 0; j < countJilid; j++) {
          const pgCount = pageCounts[j] || 10;
          const jilidImages: string[] = [];
          for (let p = 0; p < pgCount; p++) {
            const key = `${id}_${j}_${p}`;
            jilidImages.push(rawPages[key] || '');
          }
          imagesPerJilid.push(jilidImages);
        }
        
        fullModul.halamanGambarPerJilid = imagesPerJilid;
        fullModul.halamanGambar = imagesPerJilid[0] || [];
        fullModul.thumbnailHalaman = imagesPerJilid[0] || [];
      } else {
        const pageCount = (fullModul.halamanPerJilid && fullModul.halamanPerJilid[0]) || 10;
        const singleJilidImages: string[] = [];
        for (let p = 0; p < pageCount; p++) {
          const key = `${id}_0_${p}`;
          singleJilidImages.push(rawPages[key] || '');
        }
        fullModul.halamanGambar = singleJilidImages;
        fullModul.halamanGambarPerJilid = [singleJilidImages];
        fullModul.thumbnailHalaman = singleJilidImages;
      }
      return fullModul;
    });
    
    setModuls(combined);
    
    try {
      localStorage.setItem('mh_raw_pages', JSON.stringify(rawPages));
    } catch (e) {
      console.warn("Storage quota exceeded inside localStorage for raw pages.");
    }
  }, [rawModuls, rawPages]);

  const safeSaveLocalStorage = (key: string, value: any) => {
    // If the value is an empty array, prevent overwriting if we already have non-empty cache data
    if (Array.isArray(value) && value.length === 0) {
      if (isQuotaExceeded || isOffline) {
        console.log(`Prevented overwriting local cache for ${key} with empty array during offline/quota state.`);
        return;
      }
      try {
        const existingRaw = localStorage.getItem(key);
        if (existingRaw) {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Failsafe: Defended local storage cache '${key}' from being wiped with empty list.`);
            return;
          }
        }
      } catch {}
    }
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to save to localStorage under key ${key}:`, e);
    }
  };

  useEffect(() => { safeSaveLocalStorage('mh_admins', admins); }, [admins]);
  useEffect(() => { safeSaveLocalStorage('mh_gurus', gurus); }, [gurus]);
  useEffect(() => { safeSaveLocalStorage('mh_siswas', siswas); }, [siswas]);
  useEffect(() => { safeSaveLocalStorage('mh_kelases', kelases); }, [kelases]);
  useEffect(() => { safeSaveLocalStorage('mh_halaqahs', halaqahs); }, [halaqahs]);
  useEffect(() => { safeSaveLocalStorage('mh_moduls', moduls); }, [moduls]);
  useEffect(() => { safeSaveLocalStorage('mh_setorans', setorans); }, [setorans]);
  useEffect(() => { safeSaveLocalStorage('mh_murojaah_berpasangan', murojaahBerpasangans); }, [murojaahBerpasangans]);
  useEffect(() => { safeSaveLocalStorage('mh_jenis_assessments', jenisAssessments); }, [jenisAssessments]);
  useEffect(() => { safeSaveLocalStorage('mh_template_assessments', templateAssessments); }, [templateAssessments]);
  useEffect(() => { safeSaveLocalStorage('mh_assessment_records', assessmentRecords); }, [assessmentRecords]);
  useEffect(() => { safeSaveLocalStorage('mh_pengajuan_assessments', pengajuanAssessments); }, [pengajuanAssessments]);
  useEffect(() => { safeSaveLocalStorage('mh_syahadahs', syahadahs); }, [syahadahs]);
  useEffect(() => { safeSaveLocalStorage('mh_syahadah_rules', syahadahRules); }, [syahadahRules]);
  useEffect(() => { safeSaveLocalStorage('mh_syahadah_settings', syahadahSettings); }, [syahadahSettings]);
  useEffect(() => { safeSaveLocalStorage('mh_audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { safeSaveLocalStorage('mh_elemen_settings', elemenSettings); }, [elemenSettings]);
  useEffect(() => { safeSaveLocalStorage('mh_tajwid_categories', tajwidCategories); }, [tajwidCategories]);
  useEffect(() => { safeSaveLocalStorage('mh_klasifikasi_kesalahan_types', klasifikasiKesalahanTypes); }, [klasifikasiKesalahanTypes]);
  useEffect(() => { safeSaveLocalStorage('mh_mata_pelajarans', mataPelajarans); }, [mataPelajarans]);
  useEffect(() => { safeSaveLocalStorage('mh_chat_messages', chatMessages); }, [chatMessages]);
  useEffect(() => { safeSaveLocalStorage('mh_virtual_meetings', virtualMeetings); }, [virtualMeetings]);
  useEffect(() => { safeSaveLocalStorage('mh_modul_categories', modulCategories); }, [modulCategories]);
  useEffect(() => { safeSaveLocalStorage('mh_quran_lines_config', quranLinesConfig); }, [quranLinesConfig]);
  useEffect(() => { safeSaveLocalStorage('mh_general_targets', generalTargets); }, [generalTargets]);
  useEffect(() => { safeSaveLocalStorage('mh_student_targets', studentTargets); }, [studentTargets]);
  useEffect(() => { safeSaveLocalStorage('mh_guru_attendance', guruAttendance); }, [guruAttendance]);
  useEffect(() => { safeSaveLocalStorage('mh_student_attendance', studentAttendance); }, [studentAttendance]);
  useEffect(() => { safeSaveLocalStorage('mh_guru_schedules', guruSchedules); }, [guruSchedules]);
  useEffect(() => { safeSaveLocalStorage('mh_keep_notes', keepNotes); }, [keepNotes]);
  useEffect(() => { safeSaveLocalStorage('mh_student_bookmarks', studentBookmarks); }, [studentBookmarks]);
  useEffect(() => { safeSaveLocalStorage('mh_whiteboard_canvas', whiteboardCanvas); }, [whiteboardCanvas]);
  useEffect(() => { safeSaveLocalStorage('mh_whiteboard_pins', whiteboardPins); }, [whiteboardPins]);
  useEffect(() => { safeSaveLocalStorage('mh_struktur_lembaga', strukturLembaga); }, [strukturLembaga]);
  useEffect(() => { safeSaveLocalStorage('mh_programs', programs); }, [programs]);
  useEffect(() => { safeSaveLocalStorage('mh_program_babs', programBabs); }, [programBabs]);
  useEffect(() => { safeSaveLocalStorage('mh_program_materis', programMateris); }, [programMateris]);
  useEffect(() => { safeSaveLocalStorage('mh_program_latihans', programLatihans); }, [programLatihans]);
  useEffect(() => { safeSaveLocalStorage('mh_program_asesmens', programAsesmens); }, [programAsesmens]);
  useEffect(() => { safeSaveLocalStorage('mh_program_asesmen_settings', programAsesmenSettings); }, [programAsesmenSettings]);
  useEffect(() => { safeSaveLocalStorage('mh_program_praktik_settings', programPraktikSettings); }, [programPraktikSettings]);
  useEffect(() => { safeSaveLocalStorage('mh_program_enrollments', programEnrollments); }, [programEnrollments]);
  useEffect(() => { safeSaveLocalStorage('mh_pwa_settings', pwaSettings); }, [pwaSettings]);
  useEffect(() => { safeSaveLocalStorage('mh_institution_theme', institutionTheme); }, [institutionTheme]);
  useEffect(() => { safeSaveLocalStorage('mh_hijri_setting', hijriSetting); }, [hijriSetting]);
  useEffect(() => { safeSaveLocalStorage('rekap_presensi_pdf_template', rekapPresensiTemplate); }, [rekapPresensiTemplate]);
  useEffect(() => { safeSaveLocalStorage('mh_capaian_pembelajaran', capaianPembelajarans); }, [capaianPembelajarans]);
  useEffect(() => { safeSaveLocalStorage('mh_tujuan_pembelajaran', tujuanPembelajarans); }, [tujuanPembelajarans]);
  useEffect(() => { safeSaveLocalStorage('mh_bank_aktivitas', bankAktivitas); }, [bankAktivitas]);
  useEffect(() => { safeSaveLocalStorage('mh_rpp_templates', rppTemplates); }, [rppTemplates]);
  useEffect(() => { safeSaveLocalStorage('mh_guru_rpp_list', guruRppList); }, [guruRppList]);
  useEffect(() => { safeSaveLocalStorage('mh_pilot_testing_config', pilotTestingConfig); }, [pilotTestingConfig]);
  useEffect(() => { safeSaveLocalStorage('mh_feature_lab_config', featureLabConfig); }, [featureLabConfig]);
  useEffect(() => { safeSaveLocalStorage('mh_capaian_bacaan_configs', capaianBacaanConfigs); }, [capaianBacaanConfigs]);
  useEffect(() => { safeSaveLocalStorage('mh_capaian_bacaan_sesi_list', capaianBacaanSesiList); }, [capaianBacaanSesiList]);
  useEffect(() => { safeSaveLocalStorage('mh_capaian_bacaan_trial', capaianBacaanTrialSettings); }, [capaianBacaanTrialSettings]);

  // Client Session & Dark Mode Storage Sync (only client-specific configurations remain in localstorage)
  useEffect(() => {
    localStorage.setItem('mh_session', JSON.stringify(currentSession));
  }, [currentSession]);

  // Synchronize currentSession user profile reactively when admins, gurus, or siswas update from Firestore
  useEffect(() => {
    if (!currentSession.user) return;
    const { id, role } = currentSession.user;
    let freshUser: any = null;

    if (role === UserRole.ADMIN) {
      freshUser = admins.find(a => a.id === id);
    } else if (role === UserRole.GURU) {
      freshUser = gurus.find(g => g.id === id);
    } else if (role === UserRole.SISWA) {
      freshUser = siswas.find(s => s.id === id);
      if (freshUser) {
        const isSuspended = freshUser.status === StatusAktif.NON_AKTIF || 
                            (freshUser.status as string) === 'Nonaktif' || 
                            (freshUser.status as string) === 'nonaktif' || 
                            (freshUser as any).statusAktif === false;
        if (isSuspended) {
          const isPerempuan = freshUser.jenisKelamin === JenisKelamin.PEREMPUAN || 
                              (freshUser.jenisKelamin as string) === 'Perempuan' || 
                              (freshUser.jenisKelamin as string) === 'P';
          const sapaan = isPerempuan ? 'Saudari' : 'Saudara';
          const notifMsg = `Karena saat ini ${sapaan} sedang tidak aktif mengikuti pembelajaran, akun ${sapaan} dinonaktifkan sementara waktu. Kami harap hal ini dapat dimaklumi.\n\nSemoga Allah memberkahi ilmu yang telah ${sapaan} pelajari.`;
          sessionStorage.setItem('mh_suspended_student_notice', notifMsg);
          logout();
          return;
        }
      }
    }

    if (freshUser) {
      let freshNama = freshUser.namaLengkap;

      // Shield 1: If currentSession has a customized Super Admin name, preserve it instead of regressing to default template
      const isDefaultAdminTemplate = id === 'adm-1' && (freshUser.namaLengkap === INITIAL_ADMINS[0].namaLengkap || isLegacyPersonalData(freshUser.namaLengkap));
      const isCustomizedAdminInSession = id === 'adm-1' && currentSession.user.namaLengkap && currentSession.user.namaLengkap !== INITIAL_ADMINS[0].namaLengkap && !isLegacyPersonalData(currentSession.user.namaLengkap);
      if (isDefaultAdminTemplate && isCustomizedAdminInSession) {
        freshNama = currentSession.user.namaLengkap;
        setAdmins(prev => prev.map(a => a.id === 'adm-1' ? { ...a, namaLengkap: currentSession.user.namaLengkap } : a));
      } else if (id === 'adm-1' && isLegacyPersonalData(freshUser.namaLengkap)) {
        freshNama = INITIAL_ADMINS[0].namaLengkap;
        setAdmins(prev => prev.map(a => a.id === 'adm-1' ? { ...a, namaLengkap: INITIAL_ADMINS[0].namaLengkap } : a));
      }

      // Shield 2: Guru coordinator protection
      const isDefaultGuruTemplate = id === 'gru-koordinator' && (freshUser.namaLengkap === INITIAL_GURUS[0].namaLengkap || isLegacyPersonalData(freshUser.namaLengkap));
      const isCustomizedGuruInSession = id === 'gru-koordinator' && currentSession.user.namaLengkap && currentSession.user.namaLengkap !== INITIAL_GURUS[0].namaLengkap && !isLegacyPersonalData(currentSession.user.namaLengkap);
      if (isDefaultGuruTemplate && isCustomizedGuruInSession) {
        freshNama = currentSession.user.namaLengkap;
        setGurus(prev => prev.map(g => g.id === 'gru-koordinator' ? { ...g, namaLengkap: currentSession.user.namaLengkap } : g));
      } else if (id === 'gru-koordinator' && isLegacyPersonalData(freshUser.namaLengkap)) {
        freshNama = INITIAL_GURUS[0].namaLengkap;
        setGurus(prev => prev.map(g => g.id === 'gru-koordinator' ? { ...g, namaLengkap: INITIAL_GURUS[0].namaLengkap } : g));
      }

      const freshEmail = freshUser.email || '';
      const freshFoto = stripDummyProfilePhoto(freshUser.fotoProfil);
      const freshAdminRole = role === UserRole.ADMIN ? (freshUser.adminRole || (freshUser.id === 'adm-1' ? 'SUPER_ADMIN' : 'SUB_ADMIN')) : undefined;
      const freshPermissions = role === UserRole.ADMIN ? freshUser.permissions : undefined;
      const freshAdminTabPermissions = role === UserRole.ADMIN ? (freshUser as Admin).adminTabPermissions : undefined;
      const freshJabatan = freshUser.jabatan;
      const freshColorTheme = freshUser.colorTheme;

      if (
        currentSession.user.namaLengkap !== freshNama ||
        currentSession.user.email !== freshEmail ||
        currentSession.user.fotoProfil !== freshFoto ||
        (currentSession.user as any).adminRole !== freshAdminRole ||
        JSON.stringify((currentSession.user as any).permissions) !== JSON.stringify(freshPermissions) ||
        JSON.stringify((currentSession.user as any).adminTabPermissions) !== JSON.stringify(freshAdminTabPermissions) ||
        (currentSession.user as any).jabatan !== freshJabatan ||
        JSON.stringify(currentSession.user.colorTheme || null) !== JSON.stringify(freshColorTheme || null)
      ) {
        setCurrentSession(prev => {
          if (!prev.user || prev.user.id !== id || prev.user.role !== role) return prev;
          return {
            ...prev,
            user: {
              ...prev.user,
              namaLengkap: freshNama,
              email: freshEmail,
              fotoProfil: freshFoto,
              adminRole: freshAdminRole,
              permissions: freshPermissions,
              adminTabPermissions: freshAdminTabPermissions,
              jabatan: freshJabatan,
              colorTheme: freshColorTheme
            }
          };
        });
      }
    }
  }, [admins, gurus, siswas, currentSession.user?.id, currentSession.user?.role]);

  const activeUserColorTheme: UserColorThemePreference = useMemo(() => {
    const user = currentSession.user;
    if (!user) return DEFAULT_USER_COLOR_THEME;
    let liveUser: any = null;
    if (user.role === UserRole.ADMIN) {
      liveUser = admins.find(a => a.id === user.id);
    } else if (user.role === UserRole.GURU) {
      liveUser = gurus.find(g => g.id === user.id);
    } else if (user.role === UserRole.SISWA) {
      liveUser = siswas.find(s => s.id === user.id);
    }
    return liveUser?.colorTheme || user.colorTheme || DEFAULT_USER_COLOR_THEME;
  }, [currentSession.user, admins, gurus, siswas]);

  const effectiveThemeColors = useMemo(() => {
    return resolveEffectiveThemeColors(institutionTheme, activeUserColorTheme);
  }, [institutionTheme, activeUserColorTheme]);

  useEffect(() => {
    applyThemeColorsToDocument(effectiveThemeColors.primaryHex, effectiveThemeColors.secondaryHex);
  }, [effectiveThemeColors.primaryHex, effectiveThemeColors.secondaryHex]);

  useEffect(() => {
    localStorage.setItem('mh_theme_preference', themePreference);
    
    const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    
    const updateTheme = () => {
      let isDark = false;
      if (themePreference === 'system') {
        isDark = mediaQuery ? mediaQuery.matches : false;
      } else {
        isDark = themePreference === 'dark';
      }
      setDarkModeState(isDark);
      localStorage.setItem('mh_dark_mode', isDark.toString());
      
      const root = window.document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();

    // Listen to system changes
    if (themePreference === 'system' && mediaQuery) {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', updateTheme);
        return () => mediaQuery.removeEventListener('change', updateTheme);
      } else {
        mediaQuery.addListener(updateTheme);
        return () => mediaQuery.removeListener(updateTheme);
      }
    }
  }, [themePreference]);

  // Keep live check of Siswa operational hours
  useEffect(() => {
    const handleCheck = () => {
      const open = isWithinOperationalHours();
      setIsSiswaOperationalOpen((prev) => {
        if (prev !== open) {
          console.log(`[Operational Hours] Live shift detected: ${prev} -> ${open}`);
          return open;
        }
        return prev;
      });
    };
    
    // Initial check
    handleCheck();

    // Check every 10 seconds for instant response
    const intervalId = setInterval(handleCheck, 10000);
    return () => clearInterval(intervalId);
  }, []);


  // One-time load function of all database collections with smart Cache-First SWR optimization
  const loadDatabaseOnce = async () => {
    if (!isFirebaseConfigured()) {
      console.log("Firebase is not configured yet. Operating in local storage mode.");
      return;
    }
    // Check & Seed database if completely empty (skip for Siswa to prevent reads/errors)
    const isSiswa = currentSession.user?.role === UserRole.SISWA;
    if (!isSiswa) {
      try {
        // Sync demo purged status from cloud Firestore if available
        try {
          const demoStatusSnap = await getDoc(doc(db, 'system_meta', 'demo_status'));
          if (demoStatusSnap.exists() && demoStatusSnap.data()?.isPurged) {
            localStorage.setItem('mh_demo_data_purged', 'true');
            setIsDemoPurged(true);
          }
        } catch (e) {}

        const empty = await isDbEmpty();
        if (empty) {
          console.log('Central database is empty, seeding defaults into Firestore...');
          await seedDatabase();
        } else {
          // Self-healing migration: Ensure default admin (admin@sistem.id / admin123) exists in Firestore
          try {
            const adminsSnap = await getDocs(collection(db, 'admins'));
            const adminDocs = adminsSnap.docs.map(d => ({ docId: d.id, ...(d.data() as any) }));
            const adm1Doc = adminDocs.find(d => d.id === INITIAL_ADMINS[0].id || d.docId === INITIAL_ADMINS[0].id);

            if (!adm1Doc) {
              await setDoc(doc(db, 'admins', INITIAL_ADMINS[0].id), {
                ...INITIAL_ADMINS[0],
                password: DEFAULT_ADMIN_PASSWORD_HASH,
              });
            } else if (isLegacyAdminAccount(adm1Doc)) {
              await setDoc(doc(db, 'admins', INITIAL_ADMINS[0].id), {
                ...INITIAL_ADMINS[0],
                ...adm1Doc,
                id: INITIAL_ADMINS[0].id,
                namaLengkap: INITIAL_ADMINS[0].namaLengkap,
                email: INITIAL_ADMINS[0].email,
                password: DEFAULT_ADMIN_PASSWORD_HASH,
                nomorHp: INITIAL_ADMINS[0].nomorHp,
              }, { merge: true });
            } else {
              const hasDefaultAdmin = adminDocs.some(
                d => (d.email || '').trim().toLowerCase() === INITIAL_ADMINS[0].email.toLowerCase()
              );
              if (!hasDefaultAdmin) {
                await setDoc(doc(db, 'admins', 'adm-default'), {
                  ...INITIAL_ADMINS[0],
                  id: 'adm-default',
                  password: DEFAULT_ADMIN_PASSWORD_HASH,
                }, { merge: true });
              }
            }
          } catch (adminSeedErr) {
            console.warn("Notice: Default admin sync skipped (offline or restricted):", adminSeedErr);
          }

          // Self-healing migration: Ensure default assessments are seeded to Firestore for real-time synchronization if they aren't there yet
          try {
            const checkSnap = await getDocs(query(collection(db, 'jenisAssessments'), limit(1)));
            if (checkSnap.empty) {
              console.log("Seeding default assessments into Firestore for real-time sync...");
              for (const ja of INITIAL_JENIS_ASSESSMENTS) {
                await setDoc(doc(db, 'jenisAssessments', ja.id), ja);
              }
              for (const ta of INITIAL_TEMPLATE_ASSESSMENTS) {
                await setDoc(doc(db, 'templateAssessments', ta.id), ta);
              }
            }
          } catch (assessmentErr) {
            console.warn("Notice: Assessments initial check skipped (awaiting Firestore rules or offline):", assessmentErr);
          }
        }
      } catch (e: any) {
        const msg = e?.message || String(e);
        if (msg.includes('permission') || msg.includes('Permission') || msg.includes('PERMISSION_DENIED')) {
          console.warn('Firestore database rules note: Database access is restricted. Please publish firestore.rules in Firebase Console. App is continuing with local data.');
        } else {
          console.warn('Database initialization check notice:', e);
        }
      }
    }

    console.log("Fetching latest database records (one-time optimized cache SWR)...");

    // Generic helper for collections with Cache-First + Background Revalidation (SWR)
    const loadCollection = async <T,>(
      colName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      transform?: (docData: any) => any,
      afterLoad?: (list: T[]) => void
    ) => {
      const colRef = collection(db, colName);
      let loadedFromCache = false;
      const isPurged = typeof window !== 'undefined' && localStorage.getItem('mh_demo_data_purged') === 'true';

      const filterPurged = (items: T[]): T[] => {
        let result = items;
        if (isPurged) {
          if (colName === 'siswas') {
            result = result.filter((it: any) => !DEMO_SISWA_IDS.includes(it?.id));
          } else if (colName === 'gurus') {
            result = result.filter((it: any) => !DEMO_GURU_IDS.includes(it?.id));
          } else if (colName === 'admins') {
            result = result.filter((it: any) => !DEMO_ADMIN_IDS.includes(it?.id));
          }
        }

        // Identity Shield & Default Admin Sanitizer
        if (colName === 'admins') {
          result = ensureDefaultAdminInList(result as unknown as Admin[]) as unknown as T[];
          if (currentSession.user?.id === 'adm-1' && currentSession.user.namaLengkap && currentSession.user.namaLengkap !== INITIAL_ADMINS[0].namaLengkap) {
            result = result.map((it: any) => {
              if (it?.id === 'adm-1' && it?.namaLengkap === INITIAL_ADMINS[0].namaLengkap) {
                return { ...it, namaLengkap: currentSession.user.namaLengkap };
              }
              return it;
            });
          }
        }
        if (colName === 'gurus') {
          result = result.map((it: any) => {
            const cleanPhoto = stripDummyProfilePhoto(it?.fotoProfil);
            const updatedNama = (currentSession.user?.id === 'gru-koordinator' && currentSession.user.namaLengkap && currentSession.user.namaLengkap !== INITIAL_GURUS[0].namaLengkap && it?.id === 'gru-koordinator' && it?.namaLengkap === INITIAL_GURUS[0].namaLengkap)
              ? currentSession.user.namaLengkap
              : it?.namaLengkap;
            if (cleanPhoto !== (it?.fotoProfil || '') || updatedNama !== it?.namaLengkap) {
              return { ...it, namaLengkap: updatedNama, fotoProfil: cleanPhoto };
            }
            return it;
          });
        }
        if (colName === 'siswas') {
          result = result.map((it: any) => {
            const cleanPhoto = stripDummyProfilePhoto(it?.fotoProfil);
            return cleanPhoto !== (it?.fotoProfil || '') ? { ...it, fotoProfil: cleanPhoto } : it;
          });
        }
        return result;
      };

      // 1. Try Cache First
      try {
        const cacheSnap = await getDocsFromCache(colRef);
        if (!cacheSnap.empty) {
          let list: T[] = [];
          cacheSnap.forEach((doc) => {
            const data = doc.data();
            list.push(transform ? transform(data) : data as T);
          });
          list = filterPurged(list);
          if (list.length > 0 || isPurged) {
            if (afterLoad) {
              afterLoad(list);
            } else {
              setter(list);
            }
          }
          console.log(`[♻️ Cache Guard Hit] ${list.length} docs loaded via Offline Cache for '${colName}' (0 reads billed!)`);
          loadedFromCache = true;
        }
      } catch (cacheErr) {
        // Cache miss is fine
      }

      // 2. Server Sync Revalidation
      const fetchRemote = async () => {
        const isSiswaUser = currentSession.user?.role === UserRole.SISWA;
        if (isSiswaUser && !isWithinOperationalHours()) {
          console.log(`[Operational Hours Shield] Blocked remote read for collection '${colName}'`);
          return;
        }
        try {
          const serverSnap = await getDocs(colRef);
          let list: T[] = [];
          serverSnap.forEach((doc) => {
            const data = doc.data();
            list.push(transform ? transform(data) : data as T);
          });
          list = filterPurged(list);
          if (list.length > 0 || isPurged) {
            if (afterLoad) {
              afterLoad(list);
            } else {
              setter(list);
            }
            console.log(`[📡 Server Sync Complete] Loaded '${colName}' (${list.length} docs refresh)`);
          }
        } catch (serverError) {
          console.warn(`[Firebase SWR Guard notice for '${colName}']`, serverError);
          try {
            handleFirestoreError(serverError, OperationType.GET, colName);
          } catch (e) {
            console.warn(`[Firebase SWR Guard caught gracefully for '${colName}']`, e);
          }
        }
      };

      if (loadedFromCache) {
        // Async background sync with slight delay to prevent queue congestion
        setTimeout(fetchRemote, 300);
      } else {
        // Cold start - load inline from server
        await fetchRemote();
      }
    };

    // Generic helper for single documents with Cache-First + Background Revalidation (SWR)
    const loadDoc = async (
      docName: string,
      setter: (value: any) => void,
      transform: (data: any) => void
    ) => {
      const docRef = doc(db, 'shared_states', docName);
      let loadedFromCache = false;

      // 1. Try Cache First
      try {
        const cacheSnap = await getDocFromCache(docRef);
        if (cacheSnap.exists()) {
          transform(cacheSnap.data());
          console.log(`[♻️ Cache Guard Hit] Single doc '${docName}' loaded via Offline Cache (0 reads billed!)`);
          loadedFromCache = true;
        }
      } catch (cacheErr) {
        // Cache miss is fine
      }

      // 2. Server Sync Revalidation
      const fetchRemote = async () => {
        const isSiswa = currentSession.user?.role === UserRole.SISWA;
        if (isSiswa && docName !== 'operational_hours' && !isWithinOperationalHours()) {
          console.log(`[Operational Hours Shield] Blocked remote read for doc '${docName}'`);
          return;
        }
        try {
          const serverSnap = await getDoc(docRef);
          if (serverSnap.exists()) {
            transform(serverSnap.data());
            console.log(`[📡 Server Sync Complete] Loaded single doc '${docName}' refresh`);
          }
        } catch (serverError) {
          console.warn(`[Firebase SWR Guard notice for doc '${docName}']`, serverError);
          try {
            handleFirestoreError(serverError, OperationType.GET, `shared_states/${docName}`);
          } catch (e) {
            console.warn(`[Firebase SWR Guard caught gracefully for doc '${docName}']`, e);
          }
        }
      };

      if (loadedFromCache) {
        setTimeout(fetchRemote, 300);
      } else {
        await fetchRemote();
      }
    };

    // Begin Loading Core Collections
    await loadCollection<Admin>('admins', setAdmins);
    await loadCollection<Guru>('gurus', setGurus);
    await loadCollection<Siswa>('siswas', setSiswas);
    await loadCollection<Kelas>('kelases', setKelases);
    await loadCollection<Halaqah>('halaqahs', setHalaqahs);

    // Moduls
    await loadCollection<Modul>(
      'moduls', 
      setRawModuls, 
      (data) => fromFirestoreModul(data), 
      (list) => setRawModuls(sortModules(list))
    );

    // Modul Pages
    await loadCollection<any>(
      'modulPages',
      () => {},
      undefined,
      (list) => {
        const pagesMap: Record<string, string> = {};
        list.forEach((data) => {
          if (data && data.modulId) {
            pagesMap[`${data.modulId}_${data.jilidIdx}_${data.pageIdx}`] = data.imageUrl || '';
          }
        });
        setRawPages(pagesMap);
      }
    );

    // Setorans
    await loadCollection<Setoran>('setorans', setSetorans);

    // Audit Logs
    await loadCollection<AuditLog>(
      'auditLogs',
      setAuditLogs,
      undefined,
      (list) => {
        const sorted = [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAuditLogs(sorted);
      }
    );

    // Chat Messages
    await loadCollection<ChatMessage>(
      'chatMessages',
      setChatMessages,
      undefined,
      (list) => {
        const sorted = [...list].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setChatMessages(sorted);
      }
    );

    // Meetings, settings & subjects
    await loadCollection<VirtualMeeting>('virtualMeetings', setVirtualMeetings);
    await loadCollection<ElemenSetting>('elemenSettings', setElemenSettings);
    await loadCollection<TajwidCategory>('tajwidCategories', setTajwidCategories, undefined, (list) => setTajwidCategories(ensureTajwidSubcategories(list)));
    await loadCollection<MataPelajaran>('mataPelajarans', setMataPelajarans);
    await loadCollection<PengajuanAssessment>('pengajuan_assessments', setPengajuanAssessments);

    // Load assessment collections Cache-First
    await loadCollection<JenisAssessment>('jenisAssessments', setJenisAssessments);
    await loadCollection<TemplateAssessment>('templateAssessments', setTemplateAssessments);
    await loadCollection<AssessmentRecord>('assessmentRecords', setAssessmentRecords);
    await loadCollection<Syahadah>('syahadahs', setSyahadahs);
    await loadCollection<SyahadahRule>('syahadahRules', setSyahadahRules);

    // Load Program Keilmuan collections
    await loadCollection<ProgramKeilmuan>('programs', setPrograms);
    await loadCollection<ProgramBab>('programBabs', setProgramBabs);
    await loadCollection<ProgramMateri>('programMateris', setProgramMateris);
    await loadCollection<ProgramLatihan>('programLatihans', setProgramLatihans);
    await loadCollection<ProgramAsesmenKognitifQuestion>('programAsesmens', setProgramAsesmens);
    await loadCollection<ProgramAsesmenKognitifSetting>('programAsesmenSettings', setProgramAsesmenSettings);
    await loadCollection<ProgramAsesmenPraktikSetting>('programPraktikSettings', setProgramPraktikSettings);
    await loadCollection<ProgramEnrollment>('programEnrollments', setProgramEnrollments);

    // Load Pengumumans
    await loadCollection<Pengumuman>(
      'pengumumans',
      setPengumumans,
      undefined,
      async (list) => {
        const cleanList = (list || []).filter(p => p && p.id && !['ann-1', 'ann-2', 'ann-3'].includes(p.id) && !String(p.id).startsWith('dummy-'));
        const sorted = [...cleanList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPengumumans(sorted);
        try {
          localStorage.setItem('mh_pengumumans', JSON.stringify(sorted));
        } catch {}

        // Clean up legacy dummy documents from Firestore if present
        const legacyDummyItems = (list || []).filter(p => p && p.id && ['ann-1', 'ann-2', 'ann-3'].includes(p.id));
        if (legacyDummyItems.length > 0 && db) {
          for (const item of legacyDummyItems) {
            try {
              await deleteDoc(doc(db, 'pengumumans', item.id));
            } catch {}
          }
        }
      }
    );

    // Load Administrasi Guru collections
    await loadCollection<CapaianPembelajaran>('capaianPembelajarans', setCapaianPembelajarans);
    await loadCollection<TujuanPembelajaran>('tujuanPembelajarans', setTujuanPembelajarans);
    await loadCollection<BankAktivitasPembelajaran>('bankAktivitas', setBankAktivitas);
    await loadCollection<RppTemplateAdmin>('rppTemplates', setRppTemplates);
    await loadCollection<GuruRppDokumen>('guruRppList', setGuruRppList);
    // Load Capaian Bacaan Configs from authoritative shared document (Cache-First + Cloud SWR)
    try {
      const sharedDocRef = doc(db, 'shared_states', 'capaian_bacaan_configs');
      let cloudLoaded = false;
      try {
        const cacheSnap = await getDocFromCache(sharedDocRef);
        if (cacheSnap.exists()) {
          const cData = cacheSnap.data();
          const configs = cData?.configs;
          if (Array.isArray(configs)) {
            setCapaianBacaanConfigs(configs);
            cloudLoaded = true;
          }
        }
      } catch {}

      const fetchSharedCapaianConfigs = async () => {
        try {
          const serverSnap = await getDoc(sharedDocRef);
          if (serverSnap.exists()) {
            const sData = serverSnap.data();
            const configs = sData?.configs;
            if (Array.isArray(configs)) {
              setCapaianBacaanConfigs(configs);
              safeSaveLocalStorage('mh_capaian_bacaan_configs', configs);
              console.log(`[📡 Cloud Sync] Loaded ${configs.length} master target ayat from shared_states/capaian_bacaan_configs`);
            }
          } else {
            // First time bootstrap: take existing local storage customized config or default preset
            let initialConfigs = DEFAULT_PRESET_CAPAIAN_BACAAN;
            const localData = localStorage.getItem('mh_capaian_bacaan_configs');
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed)) {
                  initialConfigs = parsed;
                }
              } catch {}
            }
            const cleaned = cleanDataForFirestore(initialConfigs);
            await Promise.allSettled([
              setDoc(sharedDocRef, {
                configs: cleaned,
                updatedAt: new Date().toISOString(),
                updatedBy: 'System Bootstrap'
              }),
              setDoc(doc(db, 'appSettings', 'capaian_bacaan_configs'), {
                configs: cleaned,
                updatedAt: new Date().toISOString()
              })
            ]);
            setCapaianBacaanConfigs(initialConfigs);
            console.log(`[📡 Cloud Bootstrap] Initialized shared_states/capaian_bacaan_configs with ${initialConfigs.length} target ayat`);
          }
        } catch (serverErr) {
          console.warn('[Cloud Sync notice for shared_states/capaian_bacaan_configs]', serverErr);
        }
      };

      if (cloudLoaded) {
        setTimeout(fetchSharedCapaianConfigs, 300);
      } else {
        await fetchSharedCapaianConfigs();
      }
    } catch (e) {
      console.warn('Error syncing shared_states/capaian_bacaan_configs:', e);
    }

    await loadCollection<CapaianBacaanSesiPertemuan>('capaianBacaanSesiList', setCapaianBacaanSesiList);

    // Begin Loading Shared Config Docs
    await loadDoc('typography', setTypography, (val) => {
      const data = {
        selectedFontPreset: val.selectedFontPreset ?? 'System',
        customFont: val.customFont ?? null,
        ornamentStyle: val.ornamentStyle ?? 'bracket',
        applyFontGlobally: val.applyFontGlobally ?? true
      };
      setTypography(data);
      try {
        localStorage.setItem('mh_typography_backup', JSON.stringify(data));
      } catch (e) {
        console.warn('Storage quota exceeded or storage unavailable:', e);
      }
    });

    await loadDoc('modul_categories', setModulCategories, (data) => {
      setModulCategories(data.categories || []);
    });

    await loadDoc('quran_lines_config', setQuranLinesConfig, (data) => {
      setQuranLinesConfig({
        defaultLinesPerPage: data.defaultLinesPerPage ?? 15,
        customPageLines: data.customPageLines || [
          { page: 1, lines: 7 },
          { page: 2, lines: 7 }
        ]
      });
    });

    await loadDoc('non_quran_fonts', setNonQuranFonts, (data) => {
      const fonts = data.fonts || [];
      setNonQuranFonts(fonts);
      try {
        localStorage.setItem('mh_nonquran_fonts', JSON.stringify(fonts));
      } catch {}
    });

    await loadDoc('general_targets', setGeneralTargets, (val) => {
      setGeneralTargets({
        pekanan: val.pekanan ?? "",
        bulanan: val.bulanan ?? "",
        kuartal: val.kuartal ?? "",
        semester: val.semester ?? "",
        tahunan: val.tahunan ?? ""
      });
    });

    await loadDoc('student_targets', setStudentTargets, (data) => {
      setStudentTargets(data.targets || {});
    });

    await loadDoc('guru_attendance', (val: any) => {
      const rawList = Array.isArray(val) ? val : (val?.list || []);
      const cleaned = sanitizeGuruAttendanceList(rawList);
      setGuruAttendance(cleaned);
      try { localStorage.setItem('mh_guru_attendance', JSON.stringify(cleaned)); } catch {}
    }, (data) => {
      const rawList = Array.isArray(data) ? data : (data?.list || []);
      const cleaned = sanitizeGuruAttendanceList(rawList);
      setGuruAttendance(cleaned);
      try { localStorage.setItem('mh_guru_attendance', JSON.stringify(cleaned)); } catch {}
      if (Array.isArray(rawList) && rawList.some(isGuruSelfSubmittedAttendance) && db) {
        setDoc(doc(db, 'shared_states', 'guru_attendance'), { list: cleaned }).catch(err =>
          console.warn('Gagal membersihkan presensi mandiri guru lama dari Firestore:', err)
        );
      }
    });

    await loadDoc('student_attendance', (val: any) => {
      const cleaned = sanitizeStudentAttendanceList(val?.list || []);
      setStudentAttendance(cleaned);
      try { localStorage.setItem('mh_student_attendance', JSON.stringify(cleaned)); } catch {}
    }, (data) => {
      const cleaned = sanitizeStudentAttendanceList(data.list || []);
      setStudentAttendance(cleaned);
      try { localStorage.setItem('mh_student_attendance', JSON.stringify(cleaned)); } catch {}
    });

    await loadDoc('keep_notes', setKeepNotes, (data) => {
      setKeepNotes(data.list || []);
    });

    await loadDoc('student_bookmarks', setStudentBookmarks, (data) => {
      setStudentBookmarks(data.list || []);
    });

    await loadDoc('whiteboard_canvas', setWhiteboardCanvas, (data) => {
      setWhiteboardCanvas(data.canvas || '');
    });

    await loadDoc('whiteboard_pins', setWhiteboardPins, (data) => {
      setWhiteboardPins(data.pins || []);
    });

    await loadDoc('operational_hours', () => {}, (data) => {
      if (data && data.openTime && data.closeTime) {
        OPERATIONAL_CONFIG.OPEN_TIME = data.openTime;
        OPERATIONAL_CONFIG.CLOSE_TIME = data.closeTime;
        const open = isWithinOperationalHours();
        setIsSiswaOperationalOpen(open);
      }
    });

    await loadDoc('syahadah_settings', () => {}, (data) => {
      if (data) {
        setSyahadahSettings({
          isEnabledForGuru: Boolean(data.isEnabledForGuru),
          isEnabledForSiswa: Boolean(data.isEnabledForSiswa),
          keteranganKebijakan: data.keteranganKebijakan || ''
        });
      }
    });

    // Load PWA Settings from appSettings/pwa_settings
    try {
      const pwaRef = doc(db, 'appSettings', 'pwa_settings');
      // 1. Try Cache First
      try {
        const cacheSnap = await getDocFromCache(pwaRef);
        if (cacheSnap.exists()) {
          const data = sanitizePwaSettings(cacheSnap.data() as PwaSettings, strukturLembaga?.yayasan?.nama);
          setPwaSettings(data);
          localStorage.setItem('mh_pwa_settings', JSON.stringify(data));
          console.log("[♻️ Cache Guard Hit] Loaded pwa_settings via Offline Cache");
        }
      } catch (cacheErr) {
        // Cache miss is fine
      }

      // 2. Server Sync Revalidation
      const fetchRemotePwa = async () => {
        try {
          const serverSnap = await getDoc(pwaRef);
          if (serverSnap.exists()) {
            const data = sanitizePwaSettings(serverSnap.data() as PwaSettings, strukturLembaga?.yayasan?.nama);
            setPwaSettings(data);
            localStorage.setItem('mh_pwa_settings', JSON.stringify(data));
            console.log("[📡 Server Sync Complete] Loaded pwa_settings refresh");
          }
        } catch (serverError) {
          console.warn("Failed to sync pwa_settings from server on startup", serverError);
        }
      };

      setTimeout(fetchRemotePwa, 100);
    } catch (pwaErr) {
      console.warn("Failed to load pwa_settings on startup", pwaErr);
    }

    // Load Hijri Calendar Settings from appSettings/hijri_calendar
    try {
      const hijriRef = doc(db, 'appSettings', 'hijri_calendar');
      try {
        const cacheSnap = await getDocFromCache(hijriRef);
        if (cacheSnap.exists()) {
          const data = cacheSnap.data() as HijriCalendarSetting;
          setHijriSetting(data);
          localStorage.setItem('mh_hijri_setting', JSON.stringify(data));
        }
      } catch {}

      const fetchRemoteHijri = async () => {
        try {
          const serverSnap = await getDoc(hijriRef);
          if (serverSnap.exists()) {
            const data = serverSnap.data() as HijriCalendarSetting;
            setHijriSetting(data);
            localStorage.setItem('mh_hijri_setting', JSON.stringify(data));
          }
        } catch (serverError) {
          console.warn("Failed to sync hijri_calendar from server on startup", serverError);
        }
      };
      setTimeout(fetchRemoteHijri, 120);
    } catch (hErr) {
      console.warn("Failed to load hijri_calendar on startup", hErr);
    }

    // Load Presensi Template from appSettings/presensi_template
    try {
      const presensiRef = doc(db, 'appSettings', 'presensi_template');
      try {
        const cacheSnap = await getDocFromCache(presensiRef);
        if (cacheSnap.exists()) {
          const data = cacheSnap.data() as RekapPresensiPdfTemplate;
          const merged = sanitizeRekapPresensiTemplate({ ...DEFAULT_REKAP_PRESENSI_TEMPLATE, ...data }, strukturLembaga?.yayasan?.nama);
          setRekapPresensiTemplate(merged);
          localStorage.setItem('rekap_presensi_pdf_template', JSON.stringify(merged));
        }
      } catch (cacheErr) {}

      const fetchRemotePresensi = async () => {
        try {
          const serverSnap = await getDoc(presensiRef);
          if (serverSnap.exists()) {
            const data = serverSnap.data() as RekapPresensiPdfTemplate;
            const merged = sanitizeRekapPresensiTemplate({ ...DEFAULT_REKAP_PRESENSI_TEMPLATE, ...data }, strukturLembaga?.yayasan?.nama);
            setRekapPresensiTemplate(merged);
            localStorage.setItem('rekap_presensi_pdf_template', JSON.stringify(merged));
          }
        } catch (serverError) {
          console.warn("Failed to sync presensi_template from server on startup", serverError);
        }
      };
      setTimeout(fetchRemotePresensi, 100);
    } catch (presensiErr) {
      console.warn("Failed to load presensi_template on startup", presensiErr);
    }

    // Load Master Bobot Penilaian from appSettings/master_penalties
    try {
      const masterPenRef = doc(db, 'appSettings', 'master_penalties');
      try {
        const cacheSnap = await getDocFromCache(masterPenRef);
        if (cacheSnap.exists()) {
          const data = cacheSnap.data() as MasterPenalties;
          if (data && (data.rubrikDeductions || data.bobotKlasifikasi || data.bobotLahnJaliy)) {
            const merged: MasterPenalties = {
              baseScore: data.baseScore !== undefined ? data.baseScore : DEFAULT_MASTER_PENALTIES.baseScore,
              standarBarisQuran: data.standarBarisQuran !== undefined ? data.standarBarisQuran : DEFAULT_MASTER_PENALTIES.standarBarisQuran,
              minBarisQuran: data.minBarisQuran !== undefined ? data.minBarisQuran : DEFAULT_MASTER_PENALTIES.minBarisQuran,
              maxBarisQuran: data.maxBarisQuran !== undefined ? data.maxBarisQuran : DEFAULT_MASTER_PENALTIES.maxBarisQuran,
              bobotLahnJaliy: data.bobotLahnJaliy !== undefined ? data.bobotLahnJaliy : DEFAULT_MASTER_PENALTIES.bobotLahnJaliy,
              bobotLahnKhafiy: data.bobotLahnKhafiy !== undefined ? data.bobotLahnKhafiy : DEFAULT_MASTER_PENALTIES.bobotLahnKhafiy,
              bobotKlasifikasi: (data.bobotKlasifikasi && typeof data.bobotKlasifikasi === 'object')
                ? { ...DEFAULT_MASTER_PENALTIES.bobotKlasifikasi, ...data.bobotKlasifikasi }
                : DEFAULT_MASTER_PENALTIES.bobotKlasifikasi,
              defaultBarisNonQuran: data.defaultBarisNonQuran !== undefined ? data.defaultBarisNonQuran : DEFAULT_MASTER_PENALTIES.defaultBarisNonQuran,
              minBarisNonQuranRatio: data.minBarisNonQuranRatio !== undefined ? data.minBarisNonQuranRatio : DEFAULT_MASTER_PENALTIES.minBarisNonQuranRatio,
              rubrikDeductions: { ...DEFAULT_MASTER_PENALTIES.rubrikDeductions, ...(data.rubrikDeductions || {}) },
              oncePerSessionCategories: Array.isArray(data.oncePerSessionCategories)
                ? data.oncePerSessionCategories
                : DEFAULT_MASTER_PENALTIES.oncePerSessionCategories
            };
            setMasterPenalties(merged);
            safeSaveLocalStorage('mh_master_penalties', merged);
          }
        }
      } catch (cacheErr) {}

      const fetchRemoteMasterPen = async () => {
        try {
          const serverSnap = await getDoc(masterPenRef);
          if (serverSnap.exists()) {
            const data = serverSnap.data() as MasterPenalties;
            if (data && (data.rubrikDeductions || data.bobotKlasifikasi || data.bobotLahnJaliy)) {
              const merged: MasterPenalties = {
                baseScore: data.baseScore !== undefined ? data.baseScore : DEFAULT_MASTER_PENALTIES.baseScore,
                standarBarisQuran: data.standarBarisQuran !== undefined ? data.standarBarisQuran : DEFAULT_MASTER_PENALTIES.standarBarisQuran,
                minBarisQuran: data.minBarisQuran !== undefined ? data.minBarisQuran : DEFAULT_MASTER_PENALTIES.minBarisQuran,
                maxBarisQuran: data.maxBarisQuran !== undefined ? data.maxBarisQuran : DEFAULT_MASTER_PENALTIES.maxBarisQuran,
                bobotLahnJaliy: data.bobotLahnJaliy !== undefined ? data.bobotLahnJaliy : DEFAULT_MASTER_PENALTIES.bobotLahnJaliy,
                bobotLahnKhafiy: data.bobotLahnKhafiy !== undefined ? data.bobotLahnKhafiy : DEFAULT_MASTER_PENALTIES.bobotLahnKhafiy,
                bobotKlasifikasi: (data.bobotKlasifikasi && typeof data.bobotKlasifikasi === 'object')
                  ? { ...DEFAULT_MASTER_PENALTIES.bobotKlasifikasi, ...data.bobotKlasifikasi }
                  : DEFAULT_MASTER_PENALTIES.bobotKlasifikasi,
                defaultBarisNonQuran: data.defaultBarisNonQuran !== undefined ? data.defaultBarisNonQuran : DEFAULT_MASTER_PENALTIES.defaultBarisNonQuran,
                minBarisNonQuranRatio: data.minBarisNonQuranRatio !== undefined ? data.minBarisNonQuranRatio : DEFAULT_MASTER_PENALTIES.minBarisNonQuranRatio,
                rubrikDeductions: { ...DEFAULT_MASTER_PENALTIES.rubrikDeductions, ...(data.rubrikDeductions || {}) },
                oncePerSessionCategories: Array.isArray(data.oncePerSessionCategories)
                  ? data.oncePerSessionCategories
                  : DEFAULT_MASTER_PENALTIES.oncePerSessionCategories
              };
              setMasterPenalties(merged);
              safeSaveLocalStorage('mh_master_penalties', merged);
            }
          }
        } catch (serverError) {
          console.warn("Failed to sync master_penalties from server on startup", serverError);
        }
      };
      setTimeout(fetchRemoteMasterPen, 110);
    } catch (masterPenErr) {
      console.warn("Failed to load master_penalties on startup", masterPenErr);
    }

    // Load Klasifikasi Kesalahan Types from appSettings/klasifikasi_kesalahan_types
    try {
      const klasifikasiRef = doc(db, 'appSettings', 'klasifikasi_kesalahan_types');
      try {
        const cacheSnap = await getDocFromCache(klasifikasiRef);
        if (cacheSnap.exists()) {
          const data = cacheSnap.data();
          if (data && Array.isArray(data.types) && data.types.length > 0) {
            setKlasifikasiKesalahanTypes(data.types);
            safeSaveLocalStorage('mh_klasifikasi_kesalahan_types', data.types);
          }
        }
      } catch (cacheErr) {}

      const fetchRemoteKlasifikasi = async () => {
        try {
          const serverSnap = await getDoc(klasifikasiRef);
          if (serverSnap.exists()) {
            const data = serverSnap.data();
            if (data && Array.isArray(data.types) && data.types.length > 0) {
              setKlasifikasiKesalahanTypes(data.types);
              safeSaveLocalStorage('mh_klasifikasi_kesalahan_types', data.types);
            }
          }
        } catch (serverError) {
          console.warn("Failed to sync klasifikasi_kesalahan_types from server on startup", serverError);
        }
      };
      setTimeout(fetchRemoteKlasifikasi, 115);
    } catch (klasifikasiErr) {
      console.warn("Failed to load klasifikasi_kesalahan_types on startup", klasifikasiErr);
    }

    // Load Pilot Testing Config from appSettings/pilot_testing_config
    try {
      const pilotRef = doc(db, 'appSettings', 'pilot_testing_config');
      try {
        const cacheSnap = await getDocFromCache(pilotRef);
        if (cacheSnap.exists()) {
          const data = cacheSnap.data() as PilotTestingConfig;
          setPilotTestingConfig(data);
          localStorage.setItem('mh_pilot_testing_config', JSON.stringify(data));
        }
      } catch (cacheErr) {}

      const fetchRemotePilot = async () => {
        try {
          const serverSnap = await getDoc(pilotRef);
          if (serverSnap.exists()) {
            const data = serverSnap.data() as PilotTestingConfig;
            setPilotTestingConfig(data);
            localStorage.setItem('mh_pilot_testing_config', JSON.stringify(data));
          }
        } catch (serverError) {
          console.warn("Failed to sync pilot_testing_config from server on startup", serverError);
        }
      };
      setTimeout(fetchRemotePilot, 120);
    } catch (pilotErr) {
      console.warn("Failed to load pilot_testing_config on startup", pilotErr);
    }

    // Load SOP Standar Penilaian from appSettings/sop_standar_penilaian_doc
    try {
      const sopRef = doc(db, 'appSettings', 'sop_standar_penilaian_doc');
      try {
        const cacheSnap = await getDocFromCache(sopRef);
        if (cacheSnap.exists()) {
          const data = cacheSnap.data();
          if (data && data.nomorSK) {
            const normalized = normalizeSopPenilaianDoc(data);
            setSopPenilaianDoc(normalized);
            safeSaveLocalStorage('mh_sop_penilaian_doc', normalized);
          }
        }
      } catch (cacheErr) {}

      const fetchRemoteSop = async () => {
        try {
          const serverSnap = await getDoc(sopRef);
          if (serverSnap.exists()) {
            const data = serverSnap.data();
            if (data && data.nomorSK) {
              const normalized = normalizeSopPenilaianDoc(data);
              setSopPenilaianDoc(normalized);
              safeSaveLocalStorage('mh_sop_penilaian_doc', normalized);
            }
          }
        } catch (serverError) {
          console.warn("Failed to sync sop_standar_penilaian_doc from server on startup", serverError);
        }
      };
      setTimeout(fetchRemoteSop, 130);
    } catch (sopErr) {
      console.warn("Failed to load sop_standar_penilaian_doc on startup", sopErr);
    }

    // Load Feature Lab Config from appSettings/feature_lab_config
    try {
      const featRef = doc(db, 'appSettings', 'feature_lab_config');
      try {
        const cacheSnap = await getDocFromCache(featRef);
        if (cacheSnap.exists()) {
          const merged = sanitizeFeatureLabConfig(cacheSnap.data());
          setFeatureLabConfig(merged);
          localStorage.setItem('mh_feature_lab_config', JSON.stringify(merged));
        }
      } catch (cacheErr) {}

      const fetchRemoteFeat = async () => {
        try {
          const serverSnap = await getDoc(featRef);
          if (serverSnap.exists()) {
            const merged = sanitizeFeatureLabConfig(serverSnap.data());
            setFeatureLabConfig(merged);
            localStorage.setItem('mh_feature_lab_config', JSON.stringify(merged));
          }
        } catch (serverError) {
          console.warn("Failed to sync feature_lab_config from server on startup", serverError);
        }
      };
      setTimeout(fetchRemoteFeat, 140);
    } catch (featErr) {
      console.warn("Failed to load feature_lab_config on startup", featErr);
    }

    // Load Capaian Bacaan Trial Settings (checks shared_states, appSettings, and capaianBacaanTrialSettings)
    try {
      const sharedTrialRef = doc(db, 'shared_states', 'capaian_bacaan_trial');
      const appSetRef = doc(db, 'appSettings', 'capaian_bacaan_trial');
      const trialRef = doc(db, 'capaianBacaanTrialSettings', 'global_trial');

      // 1. Check cache first
      try {
        let cacheSnap = await getDocFromCache(sharedTrialRef);
        if (!cacheSnap.exists()) {
          cacheSnap = await getDocFromCache(appSetRef);
        }
        if (!cacheSnap.exists()) {
          cacheSnap = await getDocFromCache(trialRef);
        }
        if (cacheSnap.exists()) {
          const raw = cacheSnap.data();
          const targetData = raw?.settings || raw;
          const merged = sanitizeTrialSettings(targetData);
          setCapaianBacaanTrialSettings(merged);
          safeSaveLocalStorage('mh_capaian_bacaan_trial', merged);
        }
      } catch (cacheErr) {}

      // 2. Fetch remote from server
      const fetchRemoteTrial = async () => {
        try {
          let serverSnap = await getDoc(sharedTrialRef);
          if (!serverSnap.exists()) {
            serverSnap = await getDoc(appSetRef);
          }
          if (!serverSnap.exists()) {
            serverSnap = await getDoc(trialRef);
          }
          if (serverSnap.exists()) {
            const raw = serverSnap.data();
            const targetData = raw?.settings || raw;
            const merged = sanitizeTrialSettings(targetData);
            setCapaianBacaanTrialSettings(merged);
            safeSaveLocalStorage('mh_capaian_bacaan_trial', merged);
            console.log('[📡 Cloud Sync] Loaded capaian_bacaan_trial from cloud Firestore:', merged);
          }
        } catch (serverError) {
          console.warn("Failed to sync capaianBacaanTrialSettings from server on startup", serverError);
        }
      };
      setTimeout(fetchRemoteTrial, 150);
    } catch (trialErr) {
      console.warn("Failed to load capaianBacaanTrialSettings on startup", trialErr);
    }
  };

  const refreshDatabase = async () => {
    await loadDatabaseOnce();
  };

  // Load database and register status listeners on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mh_use_default_db_fallback');
      localStorage.setItem('mh_quota_exceeded_flag', 'false');
    }
    if (!db) {
      db = getFirebaseDb();
    }

    setIsCheckingConnection(true);
    loadDatabaseOnce().finally(() => {
      setIsCheckingConnection(false);
    });

    const handleOnline = () => {
      console.log("Browser went online.");
      setIsOffline(false);
      enableNetwork(db).catch(err => {
        console.warn("Could not enable network on browser online event:", err);
      });
    };

    const handleOffline = () => {
      console.log("Browser went offline.");
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic automatic connectivity check & self-healing poller (runs every 45 seconds)
    const intervalId = setInterval(async () => {
      // ONLY run self-healing if we are currently offline or out of quota!
      // If we are online and healthy, do NOT run the poller to conserve Firebase reads and prevent WatchChannel reconnect resets.
      const needsSelfHealing = isOfflineRef.current || isQuotaExceededRef.current;
      if (!needsSelfHealing) {
        return;
      }

      try {
        console.log("Background self-healing poller: Testing connectivity to Google Firestore...");
        try {
          await enableNetwork(db);
        } catch (netErr) {
          console.warn("enableNetwork poller notice:", netErr);
        }
        await getDocs(query(collection(db, 'shared_states'), limit(1)));
        
        // If we reach this line, Firebase is healthy and online!
        console.log("Background self-healing poller succeeded! Connection to Firebase is restored.");
        setIsOffline(false);
        setIsQuotaExceeded(false);
        localStorage.setItem('mh_quota_exceeded_flag', 'false');
        
        // Reload cloud database to get updated data
        loadDatabaseOnce();
      } catch (err: any) {
        // Ignored to avoid cluttering console, connection is still down/out of quota
        console.log("Background self-healing poller checked: Connection is currently unavailable/out of quota.");
      }
    }, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One-time cleanup: remove deprecated hardcoded personal credentials and migrate to Administrator Utama
  useEffect(() => {
    try {
      const storedAdmins = localStorage.getItem('mh_admins');
      if (storedAdmins) {
        const parsed = JSON.parse(storedAdmins);
        let modified = false;
        const updated = parsed.map((a: any) => {
          if (a.id === 'adm-1' && isLegacyAdminAccount(a)) {
            modified = true;
            return {
              ...a,
              namaLengkap: INITIAL_ADMINS[0].namaLengkap,
              email: INITIAL_ADMINS[0].email,
              password: DEFAULT_ADMIN_PASSWORD_HASH,
              nomorHp: INITIAL_ADMINS[0].nomorHp,
            };
          }
          return a;
        });
        const ensured = ensureDefaultAdminInList(updated);
        if (modified || ensured.length !== updated.length) {
          localStorage.setItem('mh_admins', JSON.stringify(ensured));
          setAdmins(ensured);
        }
      }
      const storedGurus = localStorage.getItem('mh_gurus');
      if (storedGurus) {
        const parsedGurus = JSON.parse(storedGurus);
        let guruModified = false;
        const cleanedGurus = parsedGurus.map((g: any) => {
          const cleanPhoto = stripDummyProfilePhoto(g.fotoProfil);
          if (cleanPhoto !== (g.fotoProfil || '')) {
            guruModified = true;
            return { ...g, fotoProfil: cleanPhoto };
          }
          return g;
        });
        if (guruModified) {
          localStorage.setItem('mh_gurus', JSON.stringify(cleanedGurus));
          setGurus(cleanedGurus);
        }
      }
      const storedSiswas = localStorage.getItem('mh_siswas');
      if (storedSiswas) {
        const parsedSiswas = JSON.parse(storedSiswas);
        let siswaModified = false;
        const cleanedSiswas = parsedSiswas.map((s: any) => {
          const cleanPhoto = stripDummyProfilePhoto(s.fotoProfil);
          if (cleanPhoto !== (s.fotoProfil || '')) {
            siswaModified = true;
            return { ...s, fotoProfil: cleanPhoto };
          }
          return s;
        });
        if (siswaModified) {
          localStorage.setItem('mh_siswas', JSON.stringify(cleanedSiswas));
          setSiswas(cleanedSiswas);
        }
      }
      const storedSession = localStorage.getItem('mh_session');
      if (storedSession) {
        const parsedSess = JSON.parse(storedSession);
        let sessModified = false;
        if (parsedSess?.user?.id === 'adm-1' && isLegacyAdminAccount(parsedSess.user)) {
          parsedSess.user.email = INITIAL_ADMINS[0].email;
          parsedSess.user.namaLengkap = INITIAL_ADMINS[0].namaLengkap;
          sessModified = true;
        }
        if (parsedSess?.user?.fotoProfil && stripDummyProfilePhoto(parsedSess.user.fotoProfil) !== parsedSess.user.fotoProfil) {
          parsedSess.user.fotoProfil = '';
          sessModified = true;
        }
        if (sessModified) {
          localStorage.setItem('mh_session', JSON.stringify(parsedSess));
          setCurrentSession(parsedSess);
        }
      }
    } catch {}
  }, []);

  // 1. Dedicated real-time listener for operational_hours to manage student access control safely without causing circular listener teardowns
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    console.log("Registering dedicated real-time operational_hours listener.");
    try {
      const unsubHours = onSnapshot(doc(db, 'shared_states', 'operational_hours'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.openTime && data.closeTime) {
            OPERATIONAL_CONFIG.OPEN_TIME = data.openTime;
            OPERATIONAL_CONFIG.CLOSE_TIME = data.closeTime;
            const open = isWithinOperationalHours();
            setIsSiswaOperationalOpen(open);
          }
        }
      }, (error) => {
        console.warn("Sync doc error on shared_states/operational_hours:", error);
      });
      return () => {
        console.log("Unsubscribing from dedicated operational hours listener.");
        try { unsubHours(); } catch (e) { console.error(e); }
      };
    } catch (err) {
      console.error("Failed to register dedicated sync doc for shared_states/operational_hours:", err);
    }
  }, []);

  // 2. Establish real-time live synchronization listeners for all core collections across devices
  const isSiswaUser = currentSession.user?.role === UserRole.SISWA;
  const shouldListenAll = !isSiswaUser || isSiswaOperationalOpen;

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    console.log(`Initializing real-time Firestore sync listeners. shouldListenAll: ${shouldListenAll}`);
    const unsubscribes: (() => void)[] = [];

    if (!shouldListenAll) {
      console.log("🛡️ [Operational Shield Active] Suspended registration of other real-time sync listeners.");
      return () => {
        console.log("Unsubscribing from core database sync listeners under operational shield.");
        unsubscribes.forEach((unsub) => {
          try { unsub(); } catch (e) { console.error(e); }
        });
      };
    }

    const listenCollection = <T,>(
      collectionName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      transform?: (docData: any) => any
    ) => {
      try {
        const ref = collection(db, collectionName);
        const unsub = onSnapshot(ref, (snapshot) => {
          if (snapshot.metadata.fromCache && snapshot.empty) {
            console.log(`[Cache Guard] Protected '${collectionName}' local state from empty offline snapshot.`);
            return;
          }
          let list: T[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push(transform ? transform(data) : data as T);
          });

          // Identity Shield & Default Admin Sanitizer
          if (collectionName === 'admins') {
            list = ensureDefaultAdminInList(list as unknown as Admin[]) as unknown as T[];
            if (currentSession.user?.id === 'adm-1' && currentSession.user.namaLengkap && currentSession.user.namaLengkap !== INITIAL_ADMINS[0].namaLengkap) {
              list = list.map((a: any) => {
                if (a.id === 'adm-1' && a.namaLengkap === INITIAL_ADMINS[0].namaLengkap) {
                  return { ...a, namaLengkap: currentSession.user.namaLengkap };
                }
                return a;
              });
            }
          }
          if (collectionName === 'gurus') {
            list = list.map((g: any) => {
              const cleanPhoto = stripDummyProfilePhoto(g.fotoProfil);
              const updatedNama = (currentSession.user?.id === 'gru-koordinator' && currentSession.user.namaLengkap && currentSession.user.namaLengkap !== INITIAL_GURUS[0].namaLengkap && g.id === 'gru-koordinator' && g.namaLengkap === INITIAL_GURUS[0].namaLengkap)
                ? currentSession.user.namaLengkap
                : g.namaLengkap;
              if (cleanPhoto !== (g.fotoProfil || '') || updatedNama !== g.namaLengkap) {
                return { ...g, namaLengkap: updatedNama, fotoProfil: cleanPhoto };
              }
              return g;
            });
          }
          if (collectionName === 'siswas') {
            list = list.map((s: any) => {
              const cleanPhoto = stripDummyProfilePhoto(s.fotoProfil);
              return cleanPhoto !== (s.fotoProfil || '') ? { ...s, fotoProfil: cleanPhoto } : s;
            });
          }

          setter(list);
        }, (error) => {
          console.warn(`Real-time sync error on ${collectionName}:`, error);
        });
        unsubscribes.push(unsub);
      } catch (err) {
        console.error(`Failed to register sync for ${collectionName}:`, err);
      }
    };

    // 1-5. Core Users and Structs
    listenCollection<Admin>('admins', setAdmins);
    listenCollection<Guru>('gurus', setGurus);
    listenCollection<Siswa>('siswas', setSiswas);
    listenCollection<Kelas>('kelases', setKelases);
    listenCollection<Halaqah>('halaqahs', setHalaqahs);

    // 6. Moduls (requires sorting and fromFirestore transform)
    try {
      const unsubModuls = onSnapshot(collection(db, 'moduls'), (snapshot) => {
        if (snapshot.metadata.fromCache && snapshot.empty) {
          console.log("[Cache Guard] Protected 'moduls' local state from empty offline snapshot.");
          return;
        }
        const list: Modul[] = [];
        snapshot.forEach((doc) => {
          list.push(fromFirestoreModul(doc.data()) as Modul);
        });
        setRawModuls(sortModules(list));
      }, (error) => {
        console.warn('Real-time sync error on moduls:', error);
      });
      unsubscribes.push(unsubModuls);
    } catch (err) {
      console.error(err);
    }

    // 7. Modul Pages
    try {
      const unsubPages = onSnapshot(collection(db, 'modulPages'), (snapshot) => {
        const pagesMap: Record<string, string> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data && data.modulId) {
            pagesMap[`${data.modulId}_${data.jilidIdx}_${data.pageIdx}`] = data.imageUrl || '';
          }
        });
        setRawPages(pagesMap);
      }, (error) => {
        console.warn('Real-time sync error on modulPages:', error);
      });
      unsubscribes.push(unsubPages);
    } catch (err) {
      console.error(err);
    }

    // 8. Setorans (Capaian) - GURUS INPUTS CAPAIAN, INSTANTLY REFLECTED ON STUDENTS & PARENTS SCREEN LIVE
    listenCollection<Setoran>('setorans', setSetorans);

    // 8b. Murojaah Berpasangan
    listenCollection<MurojaahBerpasangan>('murojaahBerpasangans', setMurojaahBerpasangans);

    // 8c. Integrated Assessments
    listenCollection<JenisAssessment>('jenisAssessments', setJenisAssessments);
    listenCollection<TemplateAssessment>('templateAssessments', setTemplateAssessments);
    listenCollection<AssessmentRecord>('assessmentRecords', setAssessmentRecords);
    listenCollection<PengajuanAssessment>('pengajuan_assessments', setPengajuanAssessments);
    listenCollection<Syahadah>('syahadahs', setSyahadahs);
    listenCollection<SyahadahRule>('syahadahRules', setSyahadahRules);

    // 9. Audit Logs
    try {
      const unsubLogs = onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AuditLog);
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAuditLogs(list);
      }, (error) => {
        console.warn('Real-time sync error on auditLogs:', error);
      });
      unsubscribes.push(unsubLogs);
    } catch (err) {
      console.error(err);
    }

    // 10. Chat Messages
    listenCollection<ChatMessage>('chatMessages', setChatMessages);

    // 11. Virtual Meetings
    listenCollection<VirtualMeeting>('virtualMeetings', setVirtualMeetings);

    // 12. Elemen Settings
    listenCollection<ElemenSetting>('elemenSettings', setElemenSettings);
    listenCollection<TajwidCategory>('tajwidCategories', ((val: any) => {
      const list = typeof val === 'function' ? val(tajwidCategories) : val;
      setTajwidCategories(ensureTajwidSubcategories(list));
    }) as any);

    // 12b. Mata Pelajarans
    listenCollection<MataPelajaran>('mataPelajarans', setMataPelajarans);

    // 12c. Program Keilmuan (LMS)
    listenCollection<ProgramKeilmuan>('programs', setPrograms);
    listenCollection<ProgramBab>('programBabs', setProgramBabs);
    listenCollection<ProgramMateri>('programMateris', setProgramMateris);
    listenCollection<ProgramLatihan>('programLatihans', setProgramLatihans);
    listenCollection<ProgramAsesmenKognitifQuestion>('programAsesmens', setProgramAsesmens);
    listenCollection<ProgramAsesmenKognitifSetting>('programAsesmenSettings', setProgramAsesmenSettings);
    listenCollection<ProgramAsesmenPraktikSetting>('programPraktikSettings', setProgramPraktikSettings);
    listenCollection<ProgramEnrollment>('programEnrollments', setProgramEnrollments);

    // 12d. Administrasi Guru & Pengumuman
    listenCollection<Pengumuman>('pengumumans', ((action: React.SetStateAction<Pengumuman[]>) => {
      setPengumumans(prev => {
        const rawList = typeof action === 'function' ? action(prev) : action;
        const cleanList = (rawList || []).filter(p => p && p.id && !['ann-1', 'ann-2', 'ann-3'].includes(p.id) && !String(p.id).startsWith('dummy-'));
        const sorted = [...cleanList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        try {
          localStorage.setItem('mh_pengumumans', JSON.stringify(sorted));
        } catch {}
        return sorted;
      });
    }) as React.Dispatch<React.SetStateAction<Pengumuman[]>>);
    listenCollection<CapaianPembelajaran>('capaianPembelajarans', setCapaianPembelajarans);
    listenCollection<TujuanPembelajaran>('tujuanPembelajarans', setTujuanPembelajarans);
    listenCollection<BankAktivitasPembelajaran>('bankAktivitas', setBankAktivitas);
    listenCollection<RppTemplateAdmin>('rppTemplates', setRppTemplates);
    // capaianBacaanConfigs is real-time synchronized via authoritative shared document listener below
    listenCollection<CapaianBacaanSesiPertemuan>('capaianBacaanSesiList', setCapaianBacaanSesiList);

    // 14. App Settings / PWA settings
    try {
      const unsubPwa = onSnapshot(doc(db, 'appSettings', 'pwa_settings'), (snap) => {
        if (snap.exists()) {
          const sanitized = sanitizePwaSettings(snap.data() as PwaSettings, strukturLembaga?.yayasan?.nama);
          setPwaSettings(sanitized);
          try { localStorage.setItem('mh_pwa_settings', JSON.stringify(sanitized)); } catch {}
        }
      }, (error) => {
        console.warn('Real-time sync error on appSettings/pwa_settings:', error);
      });
      unsubscribes.push(unsubPwa);
    } catch (err) {
      console.error(err);
    }

    // 14b. Institution Theme & Color Lock Settings
    try {
      const unsubTheme = onSnapshot(doc(db, 'appSettings', 'theme_settings'), (snap) => {
        if (snap.exists()) {
          const merged = { ...DEFAULT_INSTITUTION_THEME, ...(snap.data() as Partial<InstitutionThemeSettings>) };
          setInstitutionTheme(merged);
          safeSaveLocalStorage('mh_institution_theme', merged);
        }
      }, (error) => {
        console.warn('Real-time sync error on appSettings/theme_settings:', error);
      });
      unsubscribes.push(unsubTheme);
    } catch (err) {
      console.error(err);
    }

    // Hijri Calendar settings real-time listener
    try {
      const unsubHijri = onSnapshot(doc(db, 'appSettings', 'hijri_calendar'), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as HijriCalendarSetting;
          setHijriSetting(data);
          localStorage.setItem('mh_hijri_setting', JSON.stringify(data));
        }
      }, (error) => {
        console.warn('Real-time sync error on appSettings/hijri_calendar:', error);
      });
      unsubscribes.push(unsubHijri);
    } catch (err) {
      console.error(err);
    }

    // Presensi Kop & Docs Template Settings
    try {
      const unsubPresensi = onSnapshot(doc(db, 'appSettings', 'presensi_template'), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as RekapPresensiPdfTemplate;
          const merged = sanitizeRekapPresensiTemplate({ ...DEFAULT_REKAP_PRESENSI_TEMPLATE, ...data }, strukturLembaga?.yayasan?.nama);
          setRekapPresensiTemplate(merged);
          localStorage.setItem('rekap_presensi_pdf_template', JSON.stringify(merged));
        }
      }, (error) => {
        console.warn('Real-time sync error on appSettings/presensi_template:', error);
      });
      unsubscribes.push(unsubPresensi);
    } catch (err) {
      console.error(err);
    }

    // Feature Lab & Beta Testing Configuration
    try {
      const unsubFeatureLab = onSnapshot(doc(db, 'appSettings', 'feature_lab_config'), (snap) => {
        if (snap.exists()) {
          const merged = sanitizeFeatureLabConfig(snap.data());
          setFeatureLabConfig(merged);
          safeSaveLocalStorage('mh_feature_lab_config', merged);
        }
      }, (error) => {
        console.warn('Real-time sync error on appSettings/feature_lab_config:', error);
      });
      unsubscribes.push(unsubFeatureLab);
    } catch (err) {
      console.error(err);
    }

    // Capaian Bacaan Trial Whitelist Configuration (listen to shared_states, appSettings, and trialSettings)
    try {
      const handleSnap = (snap: any) => {
        if (snap && snap.exists()) {
          const raw = snap.data();
          const targetData = raw?.settings || raw;
          const merged = sanitizeTrialSettings(targetData);
          setCapaianBacaanTrialSettings(merged);
          safeSaveLocalStorage('mh_capaian_bacaan_trial', merged);
        }
      };
      const unsub1 = onSnapshot(doc(db, 'shared_states', 'capaian_bacaan_trial'), handleSnap, () => {});
      const unsub2 = onSnapshot(doc(db, 'appSettings', 'capaian_bacaan_trial'), handleSnap, () => {});
      const unsub3 = onSnapshot(doc(db, 'capaianBacaanTrialSettings', 'global_trial'), handleSnap, () => {});
      unsubscribes.push(unsub1, unsub2, unsub3);
    } catch (err) {
      console.error(err);
    }

    // Master Penalties (Bobot & Rubrik)
    try {
      const unsubMasterPen = onSnapshot(doc(db, 'appSettings', 'master_penalties'), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as MasterPenalties;
          if (data && (data.rubrikDeductions || data.bobotKlasifikasi || data.bobotLahnJaliy)) {
            const merged: MasterPenalties = {
              baseScore: data.baseScore !== undefined ? data.baseScore : DEFAULT_MASTER_PENALTIES.baseScore,
              standarBarisQuran: data.standarBarisQuran !== undefined ? data.standarBarisQuran : DEFAULT_MASTER_PENALTIES.standarBarisQuran,
              minBarisQuran: data.minBarisQuran !== undefined ? data.minBarisQuran : DEFAULT_MASTER_PENALTIES.minBarisQuran,
              maxBarisQuran: data.maxBarisQuran !== undefined ? data.maxBarisQuran : DEFAULT_MASTER_PENALTIES.maxBarisQuran,
              bobotLahnJaliy: data.bobotLahnJaliy !== undefined ? data.bobotLahnJaliy : DEFAULT_MASTER_PENALTIES.bobotLahnJaliy,
              bobotLahnKhafiy: data.bobotLahnKhafiy !== undefined ? data.bobotLahnKhafiy : DEFAULT_MASTER_PENALTIES.bobotLahnKhafiy,
              bobotKlasifikasi: (data.bobotKlasifikasi && typeof data.bobotKlasifikasi === 'object')
                ? { ...DEFAULT_MASTER_PENALTIES.bobotKlasifikasi, ...data.bobotKlasifikasi }
                : DEFAULT_MASTER_PENALTIES.bobotKlasifikasi,
              defaultBarisNonQuran: data.defaultBarisNonQuran !== undefined ? data.defaultBarisNonQuran : DEFAULT_MASTER_PENALTIES.defaultBarisNonQuran,
              minBarisNonQuranRatio: data.minBarisNonQuranRatio !== undefined ? data.minBarisNonQuranRatio : DEFAULT_MASTER_PENALTIES.minBarisNonQuranRatio,
              rubrikDeductions: { ...DEFAULT_MASTER_PENALTIES.rubrikDeductions, ...(data.rubrikDeductions || {}) },
              oncePerSessionCategories: Array.isArray(data.oncePerSessionCategories)
                ? data.oncePerSessionCategories
                : DEFAULT_MASTER_PENALTIES.oncePerSessionCategories
            };
            setMasterPenalties(merged);
            safeSaveLocalStorage('mh_master_penalties', merged);
          }
        }
      }, (error) => {
        console.warn('Real-time sync error on appSettings/master_penalties:', error);
      });
      unsubscribes.push(unsubMasterPen);
    } catch (err) {
      console.error(err);
    }

    // Klasifikasi Kesalahan Types Real-Time Listener
    try {
      const unsubKlasifikasi = onSnapshot(doc(db, 'appSettings', 'klasifikasi_kesalahan_types'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.types) && data.types.length > 0) {
            setKlasifikasiKesalahanTypes(data.types);
            safeSaveLocalStorage('mh_klasifikasi_kesalahan_types', data.types);
          }
        }
      }, (error) => {
        console.warn('Real-time sync error on appSettings/klasifikasi_kesalahan_types:', error);
      });
      unsubscribes.push(unsubKlasifikasi);
    } catch (err) {
      console.error(err);
    }

    // 13. Shared States documents:
    const listenDocument = (docPath: string, setter: (val: any) => void, dataKey?: string, defaultValue?: any) => {
      try {
        const unsub = onSnapshot(doc(db, 'shared_states', docPath), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const val = dataKey ? data[dataKey] : data;
            setter(val !== undefined && val !== null ? val : defaultValue);
          } else {
            setter(defaultValue);
          }
        }, (error) => {
          console.warn(`Sync doc error on shared_states/${docPath}:`, error);
        });
        unsubscribes.push(unsub);
      } catch (err) {
        console.error(`Failed to register sync doc for shared_states/${docPath}:`, err);
      }
    };

    listenDocument('typography', setTypography, undefined, {
      selectedFontPreset: 'System',
      customFont: null,
      ornamentStyle: 'bracket',
      applyFontGlobally: true
    });
    listenDocument('modul_categories', setModulCategories, 'categories', ['Hadits', 'Adab & Akhlak', 'Fiqih Ibadah', 'Tajwid Modern']);
    listenDocument('quran_lines_config', setQuranLinesConfig, undefined, {
      defaultLinesPerPage: 15,
      customPageLines: [
        { page: 1, lines: 7 },
        { page: 2, lines: 7 }
      ]
    });
    listenDocument('non_quran_fonts', setNonQuranFonts, 'fonts', []);
    listenDocument('general_targets', setGeneralTargets, undefined, {
      pekanan: "Target Hafalan Baru: Minimal 1 halaman / 10 ayat per pekan",
      bulanan: "Ujian Murojaah Bulanan: Sabqi & Manzil kelulusan 1 juz berjalan",
      kuartal: "Menyelesaikan Penilaian Kuartalan Teori Tajwid & Makhorijul Huruf",
      semester: "Ujian Tasmi' Ghab Sekali Duduk 1 Juz Penuh di depan Komite",
      tahunan: "Kelulusan Munaqosyah Akbar & Wisuda Khatam Juz 30 / Juz 29",
    });
    listenDocument('student_targets', setStudentTargets, 'targets', {});
    listenDocument('guru_attendance', (val: any) => {
      const rawList = Array.isArray(val) ? val : (val?.list || []);
      const cleaned = sanitizeGuruAttendanceList(rawList);
      setGuruAttendance(cleaned);
      try { localStorage.setItem('mh_guru_attendance', JSON.stringify(cleaned)); } catch {}
      if (Array.isArray(rawList) && rawList.some(isGuruSelfSubmittedAttendance) && db) {
        setDoc(doc(db, 'shared_states', 'guru_attendance'), { list: cleaned }).catch(err =>
          console.warn('Gagal menyinkronkan pembatalan presensi mandiri guru ke Firestore:', err)
        );
      }
    }, 'list', []);
    listenDocument('student_attendance', (val: any) => {
      const rawList = Array.isArray(val) ? val : (val?.list || []);
      const cleaned = sanitizeStudentAttendanceList(rawList);
      setStudentAttendance(cleaned);
      try {
        localStorage.setItem('mh_student_attendance', JSON.stringify(cleaned));
      } catch {}
    }, 'list', []);
    listenDocument('guru_schedules', setGuruSchedules, 'schedules', []);
    listenDocument('keep_notes', setKeepNotes, 'list', []);
    listenDocument('student_bookmarks', setStudentBookmarks, 'list', []);
    listenDocument('whiteboard_canvas', setWhiteboardCanvas, 'canvas', '');
    listenDocument('whiteboard_pins', setWhiteboardPins, 'pins', []);
    listenDocument('struktur_lembaga', (val: StrukturLembaga) => {
      setStrukturLembaga(sanitizeStrukturLembaga(val));
    }, undefined, DEFAULT_STRUKTUR_LEMBAGA);
    listenDocument('doc_templates', (val: any) => {
      if (Array.isArray(val) && val.length > 0) {
        const cleaned = val.map(cleanDocTemplateSignatures);
        setDocTemplates(cleaned);
        try { localStorage.setItem('mh_doc_templates', JSON.stringify(cleaned)); } catch (e) {}
      }
    }, 'templates', defaultDocTemplates);
    listenDocument('jitsi_config', setJitsiConfig, undefined, {
      appId: DEFAULT_APP_ID,
      keyId: DEFAULT_KEY_ID,
      privateKey: DEFAULT_PRIVATE_KEY_PEM
    });
    listenDocument('capaian_bacaan_configs', (val: any) => {
      let list: CapaianBacaanAyatConfig[] | null = null;
      if (Array.isArray(val)) {
        list = val;
      } else if (val && Array.isArray(val.configs)) {
        list = val.configs;
      }
      if (list !== null) {
        setCapaianBacaanConfigs(list);
        safeSaveLocalStorage('mh_capaian_bacaan_configs', list);
      }
    }, 'configs', undefined);

    listenDocument('capaian_bacaan_trial', (val: any) => {
      if (val && typeof val === 'object') {
        const targetData = val.settings || val;
        const merged = sanitizeTrialSettings(targetData);
        setCapaianBacaanTrialSettings(merged);
        safeSaveLocalStorage('mh_capaian_bacaan_trial', merged);
      }
    });

    listenDocument('syahadah_settings', (val: any) => {
      if (val && typeof val === 'object') {
        const merged: SyahadahSettings = {
          isEnabledForGuru: Boolean(val.isEnabledForGuru),
          isEnabledForSiswa: Boolean(val.isEnabledForSiswa),
          keteranganKebijakan: val.keteranganKebijakan || ''
        };
        setSyahadahSettings(merged);
        safeSaveLocalStorage('mh_syahadah_settings', merged);
      }
    });

    return () => {
      console.log("Unsubscribing from real-time database sync listeners.");
      unsubscribes.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          console.error(e);
        }
      });
    };
  }, [shouldListenAll]);

  // Log helper
  const addLog = async (action: string, rincian: string) => {
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newLog: AuditLog = {
      id,
      timestamp: new Date().toISOString(),
      actorNama: currentSession.user ? currentSession.user.namaLengkap : 'System',
      actorRole: currentSession.user ? currentSession.user.role : UserRole.ADMIN,
      action,
      rincian
    };
    try {
      await setDoc(doc(db, 'auditLogs', id), newLog);
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Operations
  const login = async (identifier: string, passwordPlain: string, role?: UserRole): Promise<boolean> => {
    let matchedUser = null;
    let finalRole: UserRole | null = role || null;
    const inputPasswordHash = await hashPassword(passwordPlain);

    if (finalRole) {
      if (finalRole === UserRole.ADMIN) {
        matchedUser = admins.find(u => u.email.toLowerCase() === identifier.toLowerCase());
        if (!matchedUser && (identifier.toLowerCase() === 'admin' || identifier.toLowerCase() === 'admin@sistem.id')) {
          matchedUser = admins.find(u => u.adminRole === 'SUPER_ADMIN') || admins[0] || INITIAL_ADMINS[0];
        }
      } else if (finalRole === UserRole.GURU) {
        matchedUser = gurus.find(u => u.email.toLowerCase() === identifier.toLowerCase());
      } else if (finalRole === UserRole.SISWA) {
        matchedUser = siswas.find(u => u.nis === identifier.trim() || (u.email && u.email.toLowerCase() === identifier.trim().toLowerCase()));
      }
    } else {
      // Auto-detect role!
      // 1. Try Admin
      matchedUser = admins.find(u => u.email.toLowerCase() === identifier.toLowerCase());
      if (!matchedUser && (identifier.toLowerCase() === 'admin' || identifier.toLowerCase() === 'admin@sistem.id')) {
        matchedUser = admins.find(u => u.adminRole === 'SUPER_ADMIN') || admins[0] || INITIAL_ADMINS[0];
      }
      if (matchedUser) {
        finalRole = UserRole.ADMIN;
      } else {
        // 2. Try Guru
        matchedUser = gurus.find(u => u.email.toLowerCase() === identifier.toLowerCase());
        if (matchedUser) {
          finalRole = UserRole.GURU;
        } else {
          // 3. Try Siswa
          matchedUser = siswas.find(u => u.nis === identifier.trim() || (u.email && u.email.toLowerCase() === identifier.trim().toLowerCase()));
          if (matchedUser) {
            finalRole = UserRole.SISWA;
          }
        }
      }
    }

    if (matchedUser && finalRole) {
      // Periksa Status Keaktifan Akun untuk Siswa/Santri
      if (finalRole === UserRole.SISWA) {
        const isNonaktif = matchedUser.status === StatusAktif.NON_AKTIF || 
                           (matchedUser.status as string) === 'Nonaktif' || 
                           (matchedUser.status as string) === 'nonaktif' || 
                           (matchedUser as any).statusAktif === false;
        if (isNonaktif) {
          const isPerempuan = matchedUser.jenisKelamin === JenisKelamin.PEREMPUAN || 
                              (matchedUser.jenisKelamin as string) === 'Perempuan' || 
                              (matchedUser.jenisKelamin as string) === 'P';
          const sapaan = isPerempuan ? 'Saudari' : 'Saudara';
          const notifPesan = `Karena saat ini ${sapaan} sedang tidak aktif mengikuti pembelajaran, akun ${sapaan} dinonaktifkan sementara waktu. Kami harap hal ini dapat dimaklumi.\n\nSemoga Allah memberkahi ilmu yang telah ${sapaan} pelajari.`;
          const err = new Error(notifPesan);
          (err as any).isSuspendedStudent = true;
          (err as any).sapaan = sapaan;
          (err as any).studentName = matchedUser.namaLengkap;
          throw err;
        }
      }

      const admin123Hash = await hashPassword('admin123');
      const pass123Hash = await hashPassword('pass123');
      
      const storedPasswordHash = matchedUser.password || admin123Hash;

      const isPasswordMatch =
        storedPasswordHash === inputPasswordHash ||
        matchedUser.password === passwordPlain ||
        (!matchedUser.password && (inputPasswordHash === admin123Hash || inputPasswordHash === pass123Hash));
      if (!isPasswordMatch) {
        return false;
      }

      const sess: Session = {
        user: {
          id: matchedUser.id,
          namaLengkap: matchedUser.namaLengkap,
          email: matchedUser.email || '',
          role: finalRole,
          fotoProfil: stripDummyProfilePhoto(matchedUser.fotoProfil),
          adminRole: finalRole === UserRole.ADMIN ? ((matchedUser as Admin).adminRole || (matchedUser.id === 'adm-1' ? 'SUPER_ADMIN' : 'SUB_ADMIN')) : undefined,
          permissions: finalRole === UserRole.ADMIN ? (matchedUser as Admin).permissions : undefined,
          adminTabPermissions: finalRole === UserRole.ADMIN ? (matchedUser as Admin).adminTabPermissions : undefined,
          jabatan: (matchedUser as any).jabatan,
          colorTheme: matchedUser.colorTheme
        },
        waktuLogin: new Date().toISOString()
      };
      setCurrentSession(sess);
      if (finalRole === UserRole.GURU) {
        setSelectedGuruHalaqahId(null);
      }
      
      // Log login event asynchronously
      const resolvedRole = finalRole;
      setTimeout(async () => {
        const userName = matchedUser?.namaLengkap || identifier;
        const newLogId = `log-${Date.now()}`;
        const newLog: AuditLog = {
          id: newLogId,
          timestamp: new Date().toISOString(),
          actorNama: userName,
          actorRole: resolvedRole,
          action: 'Masuk Akun',
          rincian: `Berhasil login sebagai ${resolvedRole}`
        };
        try {
          await setDoc(doc(db, 'auditLogs', newLogId), newLog);
        } catch (e) {
          console.error(e);
        }
      }, 50);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentSession.user) {
      addLog('Keluar Akun', `Berhasil logout dari sistem`);
    }
    setCurrentSession({ user: null, waktuLogin: null });
    setSelectedGuruHalaqahId(null);
  };

  // Admin CRUD
  const createAdmin = async (admin: Omit<Admin, 'id' | 'tanggalDibuat'>) => {
    const id = `adm-${Date.now()}`;
    const hashedPassword = admin.password ? await hashPassword(admin.password) : await hashPassword('pass123');
    let fotoProfil = admin.fotoProfil || '';
    if (fotoProfil && fotoProfil.startsWith('data:image')) {
      fotoProfil = await compressBase64Image(fotoProfil, 200, 200, 0.7);
    }
    const newAdmin: Admin = {
      ...admin,
      fotoProfil,
      id,
      password: hashedPassword,
      tanggalDibuat: new Date().toISOString().split('T')[0]
    };
    setAdmins(prev => [...prev.filter(a => a.id !== id), newAdmin]);
    try {
      await setDoc(doc(db, 'admins', id), newAdmin);
      addLog('Tambah Admin', `Admin baru ditambahkan: ${admin.namaLengkap}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${id}`);
    }
  };

  const updateAdmin = async (id: string, changedFields: Partial<Admin>) => {
    const existing = admins.find(a => a.id === id);
    if (!existing) return;
    const fieldsToUpdate = { ...changedFields };
    if (changedFields.password) {
      fieldsToUpdate.password = await hashPassword(changedFields.password);
    }
    if (changedFields.fotoProfil && changedFields.fotoProfil.startsWith('data:image')) {
      fieldsToUpdate.fotoProfil = await compressBase64Image(changedFields.fotoProfil, 200, 200, 0.7);
    }
    const updated = { ...existing, ...fieldsToUpdate };
    const nextAdmins = admins.map(a => a.id === id ? updated : a);
    setAdmins(nextAdmins);
    safeSaveLocalStorage('mh_admins', nextAdmins);

    // Update logged in user state immediately if they modified themselves
    if (currentSession.user && currentSession.user.id === id) {
      const nextSessionUser = {
        ...currentSession.user,
        ...fieldsToUpdate,
        namaLengkap: fieldsToUpdate.namaLengkap || currentSession.user.namaLengkap,
        email: fieldsToUpdate.email || currentSession.user.email,
        fotoProfil: fieldsToUpdate.fotoProfil !== undefined ? fieldsToUpdate.fotoProfil : currentSession.user.fotoProfil,
        jabatan: fieldsToUpdate.jabatan !== undefined ? fieldsToUpdate.jabatan : (currentSession.user as any).jabatan,
        adminRole: fieldsToUpdate.adminRole !== undefined ? fieldsToUpdate.adminRole : (currentSession.user as any).adminRole,
      };
      const nextSession = {
        ...currentSession,
        user: nextSessionUser
      };
      setCurrentSession(nextSession);
      safeSaveLocalStorage('mh_session', nextSession);
    }

    try {
      await setDoc(doc(db, 'admins', id), cleanDataForFirestore(updated));
      addLog('Update Admin', `Memperbarui data admin ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${id}`);
    }
  };

  const deleteAdmin = async (id: string) => {
    const target = admins.find(a => a.id === id);
    setAdmins(prev => prev.filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'admins', id));
      addLog('Hapus Admin', `Menghapus admin: ${target ? target.namaLengkap : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admins/${id}`);
    }
  };

  // Guru CRUD
  const createGuru = async (guru: Omit<Guru, 'id' | 'tanggalDibuat'>) => {
    const id = `gru-${Date.now()}`;
    const hashedPassword = guru.password ? await hashPassword(guru.password) : await hashPassword('pass123');
    let fotoProfil = guru.fotoProfil || '';
    if (fotoProfil && fotoProfil.startsWith('data:image')) {
      fotoProfil = await compressBase64Image(fotoProfil, 200, 200, 0.7);
    }
    const newGuru: Guru = {
      ...guru,
      fotoProfil,
      id,
      password: hashedPassword,
      tanggalDibuat: new Date().toISOString().split('T')[0]
    };
    setGurus(prev => [...prev.filter(g => g.id !== id), newGuru]);
    try {
      await setDoc(doc(db, 'gurus', id), newGuru);
      addLog('Tambah Guru', `Guru pendidik ditambahkan: ${guru.namaLengkap}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `gurus/${id}`);
    }
  };

  const updateGuru = async (id: string, changedFields: Partial<Guru>) => {
    const existing = gurus.find(g => g.id === id);
    if (!existing) return;
    const fieldsToUpdate = { ...changedFields };
    if (changedFields.password) {
      fieldsToUpdate.password = await hashPassword(changedFields.password);
    }
    if (changedFields.fotoProfil && changedFields.fotoProfil.startsWith('data:image')) {
      fieldsToUpdate.fotoProfil = await compressBase64Image(changedFields.fotoProfil, 200, 200, 0.7);
    }
    const updated = { ...existing, ...fieldsToUpdate };
    const nextGurus = gurus.map(g => g.id === id ? updated : g);
    setGurus(nextGurus);
    safeSaveLocalStorage('mh_gurus', nextGurus);

    // Update logged in user state immediately if they modified themselves
    if (currentSession.user && currentSession.user.id === id) {
      const nextSessionUser = {
        ...currentSession.user,
        ...fieldsToUpdate,
        namaLengkap: fieldsToUpdate.namaLengkap || currentSession.user.namaLengkap,
        email: fieldsToUpdate.email || currentSession.user.email,
        fotoProfil: fieldsToUpdate.fotoProfil !== undefined ? fieldsToUpdate.fotoProfil : currentSession.user.fotoProfil,
      };
      const nextSession = {
        ...currentSession,
        user: nextSessionUser
      };
      setCurrentSession(nextSession);
      safeSaveLocalStorage('mh_session', nextSession);
    }

    try {
      await setDoc(doc(db, 'gurus', id), cleanDataForFirestore(updated));
      
      // If name changes, we must update all halaqahs and kelases using this guru pembimbing!
      if (changedFields.namaLengkap) {
        for (const h of halaqahs) {
          if (h.guruPembimbingId === id) {
            await setDoc(doc(db, 'halaqahs', h.id), { ...h, guruPembimbingNama: changedFields.namaLengkap });
          }
        }
        for (const c of kelases) {
          if (c.waliKelasId === id) {
            await setDoc(doc(db, 'kelases', c.id), { ...c, waliKelasNama: changedFields.namaLengkap });
          }
        }
      }

      addLog('Update Guru', `Memperbarui data guru ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `gurus/${id}`);
    }
  };

  const saveToTrash = (role: 'guru' | 'siswa', item: any) => {
    if (!item) return;
    const entry = {
      id: item.id,
      role,
      nama: item.namaLengkap,
      deletedAt: new Date().toISOString(),
      data: item
    };
    setDeletedUsersTrash(prev => {
      const nextList = [entry, ...prev.filter(t => t.id !== item.id)].slice(0, 50);
      try {
        localStorage.setItem('mh_deleted_users_trash', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });
    if (db) {
      try {
        setDoc(doc(db, 'deleted_trash', item.id), entry);
      } catch {}
    }
  };

  const deleteGuru = async (id: string) => {
    const target = gurus.find(g => g.id === id);
    if (target) {
      saveToTrash('guru', target);
    }
    setGurus(prev => prev.filter(g => g.id !== id));
    try {
      await deleteDoc(doc(db, 'gurus', id));
      addLog('Hapus Guru', `Menghapus guru: ${target ? target.namaLengkap : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gurus/${id}`);
    }
  };

  const importGurus = async (list: Array<Omit<Guru, 'id' | 'tanggalDibuat'>>) => {
    try {
      const startTimestamp = Date.now();
      const defaultPassHash = await hashPassword('pass123');
      const importedList: Guru[] = [];
      for (let idx = 0; idx < list.length; idx++) {
        const item = list[idx];
        const id = `gru-${startTimestamp}-${idx}`;
        const hashedPassword = item.password ? await hashPassword(item.password) : defaultPassHash;
        const newGuru: Guru = {
          ...item,
          id,
          password: hashedPassword,
          tanggalDibuat: new Date().toISOString().split('T')[0]
        };
        importedList.push(newGuru);
      }
      setGurus(prev => {
        const nextList = [...prev];
        for (const ng of importedList) {
          const idx = nextList.findIndex(g => g.id === ng.id);
          if (idx > -1) {
            nextList[idx] = ng;
          } else {
            nextList.push(ng);
          }
        }
        return nextList;
      });
      for (const ng of importedList) {
        await setDoc(doc(db, 'gurus', ng.id), ng);
      }
      addLog('Mass Import Guru', `Berhasil mengimpor massal ${list.length} data guru dari file Excel`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'gurus');
    }
  };

  // Siswa CRUD
  const createSiswa = async (siswa: Omit<Siswa, 'id' | 'tanggalDibuat'>) => {
    const id = `sis-${Date.now()}`;
    const hashedPassword = siswa.password ? await hashPassword(siswa.password) : await hashPassword('pass123');
    let fotoProfil = siswa.fotoProfil;
    if (fotoProfil && fotoProfil.startsWith('data:image')) {
      fotoProfil = await compressBase64Image(fotoProfil, 200, 200, 0.7);
    }
    const newSiswa: Siswa = {
      kelasId: '',
      kelasNama: '',
      halaqahId: '',
      halaqahNama: '',
      email: '',
      nomorHpOrangTua: '',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: '',
      alamat: '',
      status: StatusAktif.AKTIF,
      ...siswa,
      fotoProfil: fotoProfil || '',
      id,
      password: hashedPassword,
      tanggalDibuat: new Date().toISOString().split('T')[0]
    };
    const sanitizedSiswa = cleanDataForFirestore(newSiswa);
    setSiswas(prev => [...prev.filter(s => s.id !== id), sanitizedSiswa]);
    try {
      await setDoc(doc(db, 'siswas', id), sanitizedSiswa);
      addLog('Tambah Siswa', `Siswa baru ditambahkan: ${siswa.namaLengkap}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `siswas/${id}`);
    }
  };

  const updateSiswa = async (id: string, changedFields: Partial<Siswa>) => {
    const existing = siswas.find(s => s.id === id);
    if (!existing) return;
    const fieldsToUpdate = { ...changedFields };
    if (changedFields.password) {
      fieldsToUpdate.password = await hashPassword(changedFields.password);
    }
    if (changedFields.fotoProfil && changedFields.fotoProfil.startsWith('data:image')) {
      fieldsToUpdate.fotoProfil = await compressBase64Image(changedFields.fotoProfil, 200, 200, 0.7);
    }
    const updated = { ...existing, ...fieldsToUpdate };
    const sanitizedUpdated = cleanDataForFirestore(updated);
    
    // Check if halaqah bimbingan has been changed
    const isHalaqahChanged = (changedFields.halaqahId !== undefined && changedFields.halaqahId !== existing.halaqahId) ||
                              (changedFields.halaqahNama !== undefined && changedFields.halaqahNama !== existing.halaqahNama);

    setSiswas(prev => prev.map(s => s.id === id ? sanitizedUpdated : s));
    try {
      await setDoc(doc(db, 'siswas', id), sanitizedUpdated);
      
      // If halaqah changed, update all existing setoran records for this student
      if (isHalaqahChanged) {
        const oldHalaqahId = existing.halaqahId || '';
        const oldHalaqahNama = existing.halaqahNama || '';
        const newHalaqahId = changedFields.halaqahId !== undefined ? changedFields.halaqahId : (existing.halaqahId || '');
        const newHalaqahNama = changedFields.halaqahNama !== undefined ? changedFields.halaqahNama : (existing.halaqahNama || '');

        if (newHalaqahId && newHalaqahId !== oldHalaqahId) {
          // Target transfer logic: 
          // If student is moved from a halaqah with a target (general or student-specific),
          // turn their old target into a custom target so they do not follow the new halaqah's targets (whether the new halaqah has active targets or not).
          const oldHalaqah = halaqahs.find(h => h.id === oldHalaqahId);
          const newHalaqah = halaqahs.find(h => h.id === newHalaqahId);

          const oldHalaqahHasTarget = !!(oldHalaqah && oldHalaqah.targetConfigEnabled === true && oldHalaqah.targetConfig);
          const oldStudentTarget = studentTargets[id];
          const hasOldSpecificTarget = !!(oldStudentTarget && oldStudentTarget.isCustom === true);

          const newHalaqahHasTarget = !!(newHalaqah && newHalaqah.targetConfigEnabled === true);

          if (oldHalaqahHasTarget || hasOldSpecificTarget) {
            let targetConfigToUse = null;
            let targetTextToUse = { pekanan: "", bulanan: "", kuartal: "", semester: "", tahunan: "" };

            if (hasOldSpecificTarget) {
              targetConfigToUse = oldStudentTarget.config || null;
              targetTextToUse = {
                pekanan: oldStudentTarget.pekanan || "",
                bulanan: oldStudentTarget.bulanan || "",
                kuartal: oldStudentTarget.kuartal || "",
                semester: oldStudentTarget.semester || "",
                tahunan: oldStudentTarget.tahunan || "",
              };
            } else if (oldHalaqahHasTarget) {
              targetConfigToUse = oldHalaqah.targetConfig;
              targetTextToUse = {
                pekanan: oldHalaqah.targetConfigText?.pekanan || "",
                bulanan: oldHalaqah.targetConfigText?.bulanan || "",
                kuartal: oldHalaqah.targetConfigText?.kuartal || "",
                semester: oldHalaqah.targetConfigText?.semester || "",
                tahunan: oldHalaqah.targetConfigText?.tahunan || "",
              };
            }

            const updatedStudentTargets = { ...studentTargets };
            updatedStudentTargets[id] = {
              siswaId: id,
              isCustom: true,
              config: targetConfigToUse,
              pekanan: targetTextToUse.pekanan,
              bulanan: targetTextToUse.bulanan,
              kuartal: targetTextToUse.kuartal,
              semester: targetTextToUse.semester,
              tahunan: targetTextToUse.tahunan,
              showTarget: true,
              pekananSelesai: oldStudentTarget?.pekananSelesai || false,
              bulananSelesai: oldStudentTarget?.bulananSelesai || false,
              kuartalSelesai: oldStudentTarget?.kuartalSelesai || false,
              semesterSelesai: oldStudentTarget?.semesterSelesai || false,
              tahunanSelesai: oldStudentTarget?.tahunanSelesai || false,
              pekananUmumSelesai: oldStudentTarget?.pekananUmumSelesai || false,
              bulananUmumSelesai: oldStudentTarget?.bulananUmumSelesai || false,
              kuartalUmumSelesai: oldStudentTarget?.kuartalUmumSelesai || false,
              semesterUmumSelesai: oldStudentTarget?.semesterUmumSelesai || false,
              tahunanUmumSelesai: oldStudentTarget?.tahunanUmumSelesai || false,
            };

            await saveStudentTargets(updatedStudentTargets);
            if (newHalaqahHasTarget) {
              addLog('Transfer Target Siswa', `Target lama dijadikan target khusus untuk ${existing.namaLengkap} di halaqah barunya agar tidak mengikuti target aktif halaqah baru.`);
            } else {
              addLog('Transfer Target Siswa', `Target lama dijadikan target khusus untuk ${existing.namaLengkap} di halaqah barunya yang tidak memiliki target.`);
            }
          }

          const studentSetorans = setorans.filter(s => s.siswaId === id);
          for (const setoran of studentSetorans) {
            if (setoran.halaqahId !== newHalaqahId) {
              let updatedCatatan = setoran.catatanGuru || '';
              const oldHalaqahLabel = setoran.halaqahNama || oldHalaqahNama || 'Halaqah Sebelumnya';
              const noteToAdd = `(capaian ini disetorkan pada halaqah ${oldHalaqahLabel})`;
              
              if (oldHalaqahLabel && oldHalaqahLabel !== newHalaqahNama && !updatedCatatan.includes('capaian ini disetorkan pada halaqah')) {
                updatedCatatan = updatedCatatan 
                  ? `${updatedCatatan}\n${noteToAdd}` 
                  : noteToAdd;
              }
              
              const updatedSetoran = {
                ...setoran,
                halaqahId: newHalaqahId,
                halaqahNama: newHalaqahNama,
                catatanGuru: updatedCatatan
              };
              
              // update local state
              setSetorans(prev => prev.map(s => s.id === setoran.id ? updatedSetoran : s));
              try {
                await setDoc(doc(db, 'setorans', setoran.id), JSON.parse(JSON.stringify(updatedSetoran)));
              } catch (err) {
                console.error(`Failed to transfer setoran ${setoran.id}:`, err);
              }
            }
          }
        }
      }

      // Update logged in user state immediately if they modified themselves or admin suspended them
      if (currentSession.user && currentSession.user.id === id) {
        const isSuspended = fieldsToUpdate.status === StatusAktif.NON_AKTIF || 
                            (fieldsToUpdate.status as string) === 'Nonaktif' || 
                            (fieldsToUpdate.status as string) === 'nonaktif' || 
                            (fieldsToUpdate as any).statusAktif === false;
        if (isSuspended) {
          const isPerempuan = updated.jenisKelamin === JenisKelamin.PEREMPUAN || 
                              (updated.jenisKelamin as string) === 'Perempuan' || 
                              (updated.jenisKelamin as string) === 'P';
          const sapaan = isPerempuan ? 'Saudari' : 'Saudara';
          const notifMsg = `Karena saat ini ${sapaan} sedang tidak aktif mengikuti pembelajaran, akun ${sapaan} dinonaktifkan sementara waktu. Kami harap hal ini dapat dimaklumi.\n\nSemoga Allah memberkahi ilmu yang telah ${sapaan} pelajari.`;
          sessionStorage.setItem('mh_suspended_student_notice', notifMsg);
          logout();
          return;
        }

        setCurrentSession(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            namaLengkap: fieldsToUpdate.namaLengkap || prev.user.namaLengkap,
            email: fieldsToUpdate.email || prev.user.email,
            fotoProfil: fieldsToUpdate.fotoProfil !== undefined ? fieldsToUpdate.fotoProfil : prev.user.fotoProfil,
            colorTheme: fieldsToUpdate.colorTheme !== undefined ? fieldsToUpdate.colorTheme : prev.user.colorTheme,
          } : null
        }));
      }

      addLog('Update Siswa', `Memperbarui data siswa ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `siswas/${id}`);
    }
  };

  const deleteSiswa = async (id: string) => {
    const target = siswas.find(s => s.id === id);
    if (target) {
      saveToTrash('siswa', target);
    }
    setSiswas(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, 'siswas', id));
      addLog('Hapus Siswa', `Menghapus siswa: ${target ? target.namaLengkap : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `siswas/${id}`);
    }
  };

  const purgeAllDemoData = async (): Promise<boolean> => {
    try {
      // 1. Immediately filter state
      setSiswas(prev => prev.filter(s => !DEMO_SISWA_IDS.includes(s.id)));
      setGurus(prev => prev.filter(g => !DEMO_GURU_IDS.includes(g.id)));
      setAdmins(prev => prev.filter(a => !DEMO_ADMIN_IDS.includes(a.id)));
      setStudentAttendance(prev => prev.filter(att => !DEMO_SISWA_IDS.includes(att.siswaId)));
      setSetorans(prev => prev.filter(s => !DEMO_SISWA_IDS.includes(s.siswaId)));

      // 2. Persist flag to LocalStorage
      localStorage.setItem('mh_demo_data_purged', 'true');
      setIsDemoPurged(true);

      const currentSiswas = siswas.filter(s => !DEMO_SISWA_IDS.includes(s.id));
      const currentGurus = gurus.filter(g => !DEMO_GURU_IDS.includes(g.id));
      const currentAdmins = admins.filter(a => !DEMO_ADMIN_IDS.includes(a.id));

      localStorage.setItem('mh_siswas', JSON.stringify(currentSiswas));
      localStorage.setItem('mh_gurus', JSON.stringify(currentGurus));
      localStorage.setItem('mh_admins', JSON.stringify(currentAdmins));

      // 3. Delete from Firestore cloud
      if (db) {
        for (const id of DEMO_SISWA_IDS) {
          try { await deleteDoc(doc(db, 'siswas', id)); } catch (e) {}
        }
        for (const id of DEMO_GURU_IDS) {
          try { await deleteDoc(doc(db, 'gurus', id)); } catch (e) {}
        }
        for (const id of DEMO_ADMIN_IDS) {
          try { await deleteDoc(doc(db, 'admins', id)); } catch (e) {}
        }
        try {
          await setDoc(doc(db, 'system_meta', 'demo_status'), {
            isPurged: true,
            purgedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {}
      }

      addLog('Pembersihan Data Demo', 'Seluruh data dummy/demo santri dan guru bawaan berhasil dibersihkan permanen.');
      return true;
    } catch (e) {
      console.error('Error purging demo data:', e);
      return false;
    }
  };

  const restoreFromTrash = async (trashId: string) => {
    const entry = deletedUsersTrash.find(t => t.id === trashId);
    if (!entry) return;

    if (entry.role === 'guru') {
      const restoredGuru: Guru = entry.data;
      setGurus(prev => [...prev.filter(g => g.id !== restoredGuru.id), restoredGuru]);
      if (db) {
        try {
          await setDoc(doc(db, 'gurus', restoredGuru.id), restoredGuru);
          await deleteDoc(doc(db, 'deleted_trash', trashId));
        } catch {}
      }
      addLog('Pulihkan Guru', `Memulihkan data guru: ${restoredGuru.namaLengkap}`);
    } else if (entry.role === 'siswa') {
      const restoredSiswa: Siswa = entry.data;
      setSiswas(prev => [...prev.filter(s => s.id !== restoredSiswa.id), restoredSiswa]);
      if (db) {
        try {
          await setDoc(doc(db, 'siswas', restoredSiswa.id), restoredSiswa);
          await deleteDoc(doc(db, 'deleted_trash', trashId));
        } catch {}
      }
      addLog('Pulihkan Siswa', `Memulihkan data siswa: ${restoredSiswa.namaLengkap}`);
    }

    setDeletedUsersTrash(prev => {
      const nextList = prev.filter(t => t.id !== trashId);
      try {
        localStorage.setItem('mh_deleted_users_trash', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });
  };

  const permanentDeleteTrash = (trashId: string) => {
    setDeletedUsersTrash(prev => {
      const nextList = prev.filter(t => t.id !== trashId);
      try {
        localStorage.setItem('mh_deleted_users_trash', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });
    if (db) {
      try {
        deleteDoc(doc(db, 'deleted_trash', trashId));
      } catch {}
    }
  };

  const importSiswas = async (list: Array<Omit<Siswa, 'id' | 'tanggalDibuat'>>) => {
    try {
      const startTimestamp = Date.now();
      const defaultPassHash = await hashPassword('pass123');
      const importedList: Siswa[] = [];
      for (let idx = 0; idx < list.length; idx++) {
        const item = list[idx];
        const id = `sis-${startTimestamp}-${idx}`;
        const hashedPassword = item.password ? await hashPassword(item.password) : defaultPassHash;
        const newSiswa: Siswa = {
          ...item,
          id,
          password: hashedPassword,
          tanggalDibuat: new Date().toISOString().split('T')[0]
        };
        importedList.push(newSiswa);
      }
      setSiswas(prev => {
        const nextList = [...prev];
        for (const ns of importedList) {
          const idx = nextList.findIndex(s => s.id === ns.id);
          if (idx > -1) {
            nextList[idx] = ns;
          } else {
            nextList.push(ns);
          }
        }
        return nextList;
      });
      for (const ns of importedList) {
        await setDoc(doc(db, 'siswas', ns.id), ns);
      }
      addLog('Mass Import Siswa', `Berhasil mengimpor massal ${list.length} data siswa dari file Excel`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siswas');
    }
  };

  // Kelas Actions
  const createKelas = async (kelas: Omit<Kelas, 'id'>) => {
    const id = `cls-${Date.now()}`;
    const newKelas: Kelas = {
      ...kelas,
      id
    };
    setKelases(prev => [...prev.filter(c => c.id !== id), newKelas]);
    try {
      await setDoc(doc(db, 'kelases', id), newKelas);
      addLog('Tambah Kelas', `Menambahkan kelas baru: ${kelas.namaKelas}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `kelases/${id}`);
    }
  };

  const updateKelas = async (id: string, changedFields: Partial<Kelas>) => {
    const existing = kelases.find(k => k.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    setKelases(prev => prev.map(k => k.id === id ? updated : k));
    
    // update cached kelasNama inside siswas list as well if rename occurred
    if (changedFields.namaKelas) {
      setSiswas(prev => prev.map(s => s.kelasId === id ? { ...s, kelasNama: changedFields.namaKelas } : s));
    }
    
    try {
      await setDoc(doc(db, 'kelases', id), updated);
      
      // update cached kelasNama inside siswas list as well if rename occurred
      if (changedFields.namaKelas) {
        for (const s of siswas) {
          if (s.kelasId === id) {
            await setDoc(doc(db, 'siswas', s.id), { ...s, kelasNama: changedFields.namaKelas });
          }
        }
      }

      addLog('Update Kelas', `Memperbarui info kelas ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `kelases/${id}`);
    }
  };

  const deleteKelas = async (id: string) => {
    const target = kelases.find(k => k.id === id);
    setKelases(prev => prev.filter(k => k.id !== id));
    try {
      await deleteDoc(doc(db, 'kelases', id));
      addLog('Hapus Kelas', `Menghapus kelas: ${target ? target.namaKelas : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `kelases/${id}`);
    }
  };

  // Halaqah Actions
  const createHalaqah = async (halaqah: Omit<Halaqah, 'id'>) => {
    const id = `hal-${Date.now()}`;
    const newHalaqah: Halaqah = {
      ...halaqah,
      id
    };
    const sanitizedHalaqah = cleanDataForFirestore(newHalaqah);
    setHalaqahs(prev => [...prev.filter(h => h.id !== id), sanitizedHalaqah]);

    // Also sync to strukturLembaga.jenjangList for foundation halaqah
    if (newHalaqah.sourceType !== 'private_halaqah') {
      setStrukturLembaga(prev => {
        if (prev.jenjangList.some(j => j.id === id || (newHalaqah.jenjangId && j.id === newHalaqah.jenjangId))) {
          return prev;
        }
        const updatedJenjang = [
          ...prev.jenjangList,
          {
            id,
            sekolahId: newHalaqah.sekolahId || prev.sekolahList[0]?.id || '',
            nama: newHalaqah.namaHalaqah,
            namaKepalaSekolah: newHalaqah.guruPembimbingNama || '',
            email: '',
            nomorHp: ''
          }
        ];
        const newStruktur = { ...prev, jenjangList: updatedJenjang };
        try {
          localStorage.setItem('mh_struktur_lembaga', JSON.stringify(newStruktur));
          if (db) setDoc(doc(db, 'shared_states', 'struktur_lembaga'), newStruktur);
        } catch {}
        return newStruktur;
      });
    }

    try {
      await setDoc(doc(db, 'halaqahs', id), sanitizedHalaqah);
      addLog('Tambah Halaqah', `Menambahkan kelompok halaqah baru: ${halaqah.namaHalaqah}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `halaqahs/${id}`);
    }
  };

  const updateHalaqah = async (id: string, changedFields: Partial<Halaqah>) => {
    const existing = halaqahs.find(h => h.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    const sanitizedUpdated = cleanDataForFirestore(updated);
    setHalaqahs(prev => prev.map(h => h.id === id ? sanitizedUpdated : h));
    
    // update cached halaqahNama in siswas list and gurus list
    if (changedFields.namaHalaqah) {
      setSiswas(prev => prev.map(s => s.halaqahId === id ? { ...s, halaqahNama: changedFields.namaHalaqah } : s));
      setGurus(prev => prev.map(g => g.halaqahBimbinganId === id ? { ...g, halaqahBimbinganNama: changedFields.namaHalaqah } : g));
    }

    // Sync changes to strukturLembaga.jenjangList
    if (changedFields.namaHalaqah || changedFields.guruPembimbingNama || changedFields.sekolahId) {
      setStrukturLembaga(prev => {
        const updatedJenjang = prev.jenjangList.map(j => {
          if (j.id === id || j.id === existing.jenjangId) {
            return {
              ...j,
              nama: changedFields.namaHalaqah || j.nama,
              namaKepalaSekolah: changedFields.guruPembimbingNama !== undefined ? changedFields.guruPembimbingNama : j.namaKepalaSekolah,
              sekolahId: changedFields.sekolahId || j.sekolahId
            };
          }
          return j;
        });
        const newStruktur = { ...prev, jenjangList: updatedJenjang };
        try {
          localStorage.setItem('mh_struktur_lembaga', JSON.stringify(newStruktur));
          if (db) setDoc(doc(db, 'shared_states', 'struktur_lembaga'), newStruktur);
        } catch {}
        return newStruktur;
      });
    }
    
    try {
      await setDoc(doc(db, 'halaqahs', id), sanitizedUpdated);
      
      // update cached halaqahNama in siswas list and gurus list
      if (changedFields.namaHalaqah) {
        for (const s of siswas) {
          if (s.halaqahId === id) {
            await setDoc(doc(db, 'siswas', s.id), { ...s, halaqahNama: changedFields.namaHalaqah });
          }
        }
        for (const g of gurus) {
          if (g.halaqahBimbinganId === id) {
            await setDoc(doc(db, 'gurus', g.id), { ...g, halaqahBimbinganNama: changedFields.namaHalaqah });
          }
        }
      }

      addLog('Update Halaqah', `Memperbarui info bimbingan halaqah ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `halaqahs/${id}`);
    }
  };

  const deleteHalaqah = async (id: string) => {
    const target = halaqahs.find(h => h.id === id);
    setHalaqahs(prev => prev.filter(h => h.id !== id));

    // Remove from strukturLembaga.jenjangList as well
    setStrukturLembaga(prev => {
      const updatedJenjang = prev.jenjangList.filter(j => j.id !== id && j.id !== target?.jenjangId);
      const newStruktur = { ...prev, jenjangList: updatedJenjang };
      try {
        localStorage.setItem('mh_struktur_lembaga', JSON.stringify(newStruktur));
        if (db) setDoc(doc(db, 'shared_states', 'struktur_lembaga'), newStruktur);
      } catch {}
      return newStruktur;
    });

    try {
      await deleteDoc(doc(db, 'halaqahs', id));
      addLog('Hapus Halaqah', `Menghapus halaqah: ${target ? target.namaHalaqah : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `halaqahs/${id}`);
    }
  };

  // Modul Actions
  const createModul = async (modul: Omit<Modul, 'id'>) => {
    const id = `mod-${Date.now()}`;
    const newModul: Modul = {
      ...modul,
      id
    };
    updateRawPagesForModul(id, newModul.isMultiJilid || false, newModul.halamanGambar, newModul.halamanGambarPerJilid);
    setRawModuls(prev => sortModules([...prev.filter(m => m.id !== id), newModul]));
    try {
      await setDoc(doc(db, 'moduls', id), toFirestoreModul(newModul));
      await savePagesToCloud(id, newModul.isMultiJilid || false, newModul.halamanGambar || [], newModul.halamanGambarPerJilid || [], newModul.pdfBase64);
      addLog('Tambah Modul', `Membuat modul pembelajaran baru: ${modul.judulModul || modul.namaSurat}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `moduls/${id}`);
    }
  };

  const updateModul = async (id: string, changedFields: Partial<Modul>) => {
    const existing = rawModuls.find(m => m.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    if (changedFields.halamanGambar || changedFields.halamanGambarPerJilid) {
      updateRawPagesForModul(id, updated.isMultiJilid || false, updated.halamanGambar, updated.halamanGambarPerJilid);
    }
    setRawModuls(prev => sortModules(prev.map(m => m.id === id ? updated : m)));
    try {
      await setDoc(doc(db, 'moduls', id), toFirestoreModul(updated));
      if (changedFields.halamanGambar || changedFields.halamanGambarPerJilid || changedFields.pdfBase64) {
        await savePagesToCloud(id, updated.isMultiJilid || false, updated.halamanGambar || [], updated.halamanGambarPerJilid || [], updated.pdfBase64);
      }
      addLog('Update Modul', `Memperbarui materi modul ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `moduls/${id}`);
    }
  };

  const deleteModul = async (id: string) => {
    const target = rawModuls.find(m => m.id === id);
    setRawModuls(prev => prev.filter(m => m.id !== id));
    setRawPages(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(key => {
        if (key.startsWith(`${id}_`)) {
          delete copy[key];
        }
      });
      return copy;
    });
    try {
      await deleteDoc(doc(db, 'moduls', id));
      const q = query(collection(db, 'modulPages'), where('modulId', '==', id));
      const snap = await getDocs(q);
      const batchDeletes = snap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(batchDeletes);
      
      addLog('Hapus Modul', `Menghapus modul ajar: ${target ? (target.judulModul || target.namaSurat) : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `moduls/${id}`);
    }
  };

  // Program Keilmuan (LMS) Actions
  const createProgram = async (prog: Omit<ProgramKeilmuan, 'id' | 'tanggalDibuat'>) => {
    const id = `prog-${Date.now()}`;
    const newProg: ProgramKeilmuan = {
      ...prog,
      id,
      tanggalDibuat: new Date().toISOString()
    };
    setPrograms(prev => [...prev.filter(p => p.id !== id), newProg]);
    try {
      await setDoc(doc(db, 'programs', id), JSON.parse(JSON.stringify(newProg)));
      addLog('Buat Program Keilmuan', `Membuat program keilmuan baru: ${prog.nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programs/${id}`);
    }
  };

  const updateProgram = async (id: string, prog: Partial<ProgramKeilmuan>) => {
    const existing = programs.find(p => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...prog };
    setPrograms(prev => prev.map(p => p.id === id ? updated : p));
    try {
      await setDoc(doc(db, 'programs', id), JSON.parse(JSON.stringify(updated)));
      addLog('Update Program Keilmuan', `Memperbarui program keilmuan: ${updated.nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programs/${id}`);
    }
  };

  const deleteProgram = async (id: string) => {
    const target = programs.find(p => p.id === id);
    setPrograms(prev => prev.filter(p => p.id !== id));
    try {
      await deleteDoc(doc(db, 'programs', id));
      addLog('Hapus Program Keilmuan', `Menghapus program keilmuan: ${target ? target.nama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programs/${id}`);
    }
  };

  // Program Bab Actions
  const createProgramBab = async (bab: Omit<ProgramBab, 'id'>) => {
    const id = `bab-${Date.now()}`;
    const newBab: ProgramBab = { ...bab, id };
    setProgramBabs(prev => [...prev, newBab]);
    try {
      await setDoc(doc(db, 'programBabs', id), JSON.parse(JSON.stringify(newBab)));
      addLog('Buat Bab Program', `Membuat bab baru: ${bab.judul}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programBabs/${id}`);
    }
  };

  const updateProgramBab = async (id: string, bab: Partial<ProgramBab>) => {
    const existing = programBabs.find(b => b.id === id);
    if (!existing) return;
    const updated = { ...existing, ...bab };
    setProgramBabs(prev => prev.map(b => b.id === id ? updated : b));
    try {
      await setDoc(doc(db, 'programBabs', id), JSON.parse(JSON.stringify(updated)));
      addLog('Update Bab Program', `Memperbarui bab program: ${updated.judul}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programBabs/${id}`);
    }
  };

  const deleteProgramBab = async (id: string) => {
    const target = programBabs.find(b => b.id === id);
    setProgramBabs(prev => prev.filter(b => b.id !== id));
    try {
      await deleteDoc(doc(db, 'programBabs', id));
      addLog('Hapus Bab Program', `Menghapus bab program: ${target ? target.judul : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programBabs/${id}`);
    }
  };

  // Program Materi Actions
  const createProgramMateri = async (mat: Omit<ProgramMateri, 'id'>) => {
    const id = `mat-${Date.now()}`;
    const newMat: ProgramMateri = { ...mat, id };
    setProgramMateris(prev => [...prev, newMat]);
    try {
      await setDoc(doc(db, 'programMateris', id), JSON.parse(JSON.stringify(newMat)));
      addLog('Buat Materi Program', `Membuat materi baru: ${mat.judul}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programMateris/${id}`);
    }
  };

  const updateProgramMateri = async (id: string, mat: Partial<ProgramMateri>) => {
    const existing = programMateris.find(m => m.id === id);
    if (!existing) return;
    const updated = { ...existing, ...mat };
    setProgramMateris(prev => prev.map(m => m.id === id ? updated : m));
    try {
      await setDoc(doc(db, 'programMateris', id), JSON.parse(JSON.stringify(updated)));
      addLog('Update Materi Program', `Memperbarui materi program: ${updated.judul}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programMateris/${id}`);
    }
  };

  const deleteProgramMateri = async (id: string) => {
    const target = programMateris.find(m => m.id === id);
    setProgramMateris(prev => prev.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'programMateris', id));
      addLog('Hapus Materi Program', `Menghapus materi program: ${target ? target.judul : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programMateris/${id}`);
    }
  };

  // Program Latihan Actions
  const createProgramLatihan = async (lat: Omit<ProgramLatihan, 'id'>) => {
    const id = `lat-${Date.now()}`;
    const newLat: ProgramLatihan = { ...lat, id };
    setProgramLatihans(prev => [...prev, newLat]);
    try {
      await setDoc(doc(db, 'programLatihans', id), JSON.parse(JSON.stringify(newLat)));
      addLog('Buat Latihan Program', `Membuat soal latihan baru`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programLatihans/${id}`);
    }
  };

  const updateProgramLatihan = async (id: string, lat: Partial<ProgramLatihan>) => {
    const existing = programLatihans.find(l => l.id === id);
    if (!existing) return;
    const updated = { ...existing, ...lat };
    setProgramLatihans(prev => prev.map(l => l.id === id ? updated : l));
    try {
      await setDoc(doc(db, 'programLatihans', id), JSON.parse(JSON.stringify(updated)));
      addLog('Update Latihan Program', `Memperbarui soal latihan`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programLatihans/${id}`);
    }
  };

  const deleteProgramLatihan = async (id: string) => {
    setProgramLatihans(prev => prev.filter(l => l.id !== id));
    try {
      await deleteDoc(doc(db, 'programLatihans', id));
      addLog('Hapus Latihan Program', `Menghapus soal latihan`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programLatihans/${id}`);
    }
  };

  // Program Asesmen Kognitif Actions
  const createProgramAsesmen = async (q: Omit<ProgramAsesmenKognitifQuestion, 'id'>) => {
    const id = `ase-${Date.now()}`;
    const newQ: ProgramAsesmenKognitifQuestion = { ...q, id };
    setProgramAsesmens(prev => [...prev, newQ]);
    try {
      await setDoc(doc(db, 'programAsesmens', id), JSON.parse(JSON.stringify(newQ)));
      addLog('Buat Asesmen Kognitif', `Membuat soal asesmen kognitif baru`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programAsesmens/${id}`);
    }
  };

  const updateProgramAsesmen = async (id: string, q: Partial<ProgramAsesmenKognitifQuestion>) => {
    const existing = programAsesmens.find(item => item.id === id);
    if (!existing) return;
    const updated = { ...existing, ...q };
    setProgramAsesmens(prev => prev.map(item => item.id === id ? updated : item));
    try {
      await setDoc(doc(db, 'programAsesmens', id), JSON.parse(JSON.stringify(updated)));
      addLog('Update Asesmen Kognitif', `Memperbarui soal asesmen kognitif`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programAsesmens/${id}`);
    }
  };

  const deleteProgramAsesmen = async (id: string) => {
    setProgramAsesmens(prev => prev.filter(item => item.id !== id));
    try {
      await deleteDoc(doc(db, 'programAsesmens', id));
      addLog('Hapus Asesmen Kognitif', `Menghapus soal asesmen kognitif`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programAsesmens/${id}`);
    }
  };

  // Settings
  const saveProgramAsesmenSetting = async (setting: ProgramAsesmenKognitifSetting) => {
    const id = setting.id || `setting-${setting.programId}-${setting.babId}`;
    const fullSetting = { ...setting, id };
    setProgramAsesmenSettings(prev => [...prev.filter(s => s.id !== id), fullSetting]);
    try {
      await setDoc(doc(db, 'programAsesmenSettings', id), JSON.parse(JSON.stringify(fullSetting)));
      addLog('Simpan Pengaturan Asesmen', `Menyimpan pengaturan kognitif untuk bab`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programAsesmenSettings/${id}`);
    }
  };

  const saveProgramPraktikSetting = async (setting: ProgramAsesmenPraktikSetting) => {
    const id = setting.id || `praktik-${setting.programId}-${setting.babId}`;
    const fullSetting = { ...setting, id };
    setProgramPraktikSettings(prev => [...prev.filter(s => s.id !== id), fullSetting]);
    try {
      await setDoc(doc(db, 'programPraktikSettings', id), JSON.parse(JSON.stringify(fullSetting)));
      addLog('Simpan Pengaturan Praktik', `Menyimpan pengaturan praktik untuk bab`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programPraktikSettings/${id}`);
    }
  };

  // Program Enrollment Actions
  const createProgramEnrollment = async (enrollment: Omit<ProgramEnrollment, 'id'>) => {
    const id = `${enrollment.programId}_${enrollment.siswaId}`;
    const newEnroll: ProgramEnrollment = { ...enrollment, id };
    setProgramEnrollments(prev => [...prev.filter(e => e.id !== id), newEnroll]);
    try {
      await setDoc(doc(db, 'programEnrollments', id), JSON.parse(JSON.stringify(newEnroll)));
      addLog('Daftar Program Keilmuan', `Mendaftarkan ${enrollment.siswaNama} ke program ${enrollment.programNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programEnrollments/${id}`);
    }
  };

  const updateProgramEnrollment = async (id: string, enrollment: Partial<ProgramEnrollment>) => {
    const existing = programEnrollments.find(e => e.id === id);
    if (!existing) return;
    const updated = { ...existing, ...enrollment };
    setProgramEnrollments(prev => prev.map(e => e.id === id ? updated : e));
    try {
      await setDoc(doc(db, 'programEnrollments', id), JSON.parse(JSON.stringify(updated)));
      addLog('Update Pendaftaran Program', `Memperbarui kemajuan program untuk ${updated.siswaNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `programEnrollments/${id}`);
    }
  };

  const deleteProgramEnrollment = async (id: string) => {
    const target = programEnrollments.find(e => e.id === id);
    setProgramEnrollments(prev => prev.filter(e => e.id !== id));
    try {
      await deleteDoc(doc(db, 'programEnrollments', id));
      addLog('Hapus Pendaftaran Program', `Membatalkan pendaftaran ${target ? target.siswaNama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programEnrollments/${id}`);
    }
  };

  // Setoran / Capaian Actions
  const createSetoran = async (setoran: Omit<Setoran, 'id' | 'guruId' | 'guruNama'>) => {
    const scorerId = currentSession.user ? currentSession.user.id : 'gru-1';
    const scorerNama = currentSession.user ? currentSession.user.namaLengkap : 'Ustadz Muhammad Rayhan, Lc';

    const id = `set-${Date.now()}`;
    const newSetoran: Setoran = {
      ...setoran,
      id,
      guruId: scorerId,
      guruNama: scorerNama
    };
    setSetorans(prev => [...prev.filter(s => s.id !== id), newSetoran]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newSetoran));
      await setDoc(doc(db, 'setorans', id), sanitized);
      addLog('Setoran Baru Hafalan', `Menambahkan setoran capaian untuk ${setoran.siswaNama} - ${setoran.modulNama}`);

      // Auto-link interactive comments to Capaian Bacaan Ayat session
      try {
        const comments = newSetoran.interactiveComments || [];
        if (comments.length > 0) {
          const normArabic = (t?: string) => (t || '')
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
            .replace(/[إأآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/[ىي]/g, 'ي')
            .replace(/ـ/g, '')
            .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '')
            .trim()
            .toLowerCase();
          const normLatin = (t?: string) => (t || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

          // Determine surah number
          let surahNomor = 1;
          const sNameNorm = normLatin(newSetoran.suratNama || newSetoran.modulNama);
          const matchedSurah = DAFTAR_114_SURAT.find(s => 
            normLatin(s.nama) === sNameNorm ||
            (sNameNorm && (sNameNorm.includes(normLatin(s.nama)) || normLatin(s.nama).includes(sNameNorm)))
          );
          if (matchedSurah) surahNomor = matchedSurah.nomor;

          // Determine session number (P1, P2...) based on student's prior setorans for this surah + 1
          const studentSetoransForSurah = (setorans || []).filter(s => 
            s.siswaId === newSetoran.siswaId && 
            (s.suratNama && matchedSurah && normLatin(s.suratNama).includes(normLatin(matchedSurah.nama)))
          );
          const sesiKe = studentSetoransForSurah.length + 1;
          const namaSesi = `P${sesiKe}`;

          const configsForThisSurah = capaianBacaanConfigs.filter(c => c.suratNomor === surahNomor);

          for (const cfg of configsForThisSurah) {
            const ayatNo = cfg.nomorAyat;
            const catatanTarget: Record<string, boolean> = {};

            for (const comment of comments) {
              let commentAyat: number | null = null;
              if (comment.targetKey) {
                const m = comment.targetKey.match(/quran-.*-(\d+)-/);
                if (m) commentAyat = Number(m[1]);
              }
              if (!commentAyat && comment.info) {
                const m = comment.info.match(/Ayat\s*(\d+)/i);
                if (m) commentAyat = Number(m[1]);
              }
              if (commentAyat !== null && commentAyat !== ayatNo) continue;

              const cTargetNorm = normArabic(comment.target);
              const cCatNorm = normLatin(comment.category);
              const cSubNorm = normLatin(comment.subcategory);

              for (const tgt of cfg.targets) {
                const tgtWordNorm = normArabic(tgt.kataLafaz);
                const tgtCatNorm = normLatin(tgt.kategoriKesalahanNama);
                const tgtSubNorm = normLatin(tgt.subKategoriKesalahanNama);

                // Word matching: matches per-kata
                const wordMatches = !tgtWordNorm || !cTargetNorm || 
                  tgtWordNorm === cTargetNorm || 
                  cTargetNorm.includes(tgtWordNorm) || 
                  tgtWordNorm.includes(cTargetNorm);

                // Category & subcategory matching
                const catMatches = (tgtCatNorm && cCatNorm && (tgtCatNorm === cCatNorm || tgtCatNorm.includes(cCatNorm) || cCatNorm.includes(tgtCatNorm))) ||
                  (tgtSubNorm && cSubNorm && (tgtSubNorm === cSubNorm || tgtSubNorm.includes(cSubNorm) || cSubNorm.includes(tgtSubNorm))) ||
                  (tgtSubNorm && cSubNorm && normLatin(tgt.unsur).includes(cSubNorm));

                if (wordMatches && catMatches) {
                  catatanTarget[tgt.id] = true;
                }
              }
            }

            // If there's any marked error on this ayat or this ayat is within the submitted range
            const isTestedAyat = (newSetoran.ayatAwal !== undefined && newSetoran.ayatAkhir !== undefined && ayatNo >= newSetoran.ayatAwal && ayatNo <= newSetoran.ayatAkhir) ||
              Object.keys(catatanTarget).length > 0;

            if (isTestedAyat) {
              const autoSesiId = `cb-sesi-auto-${newSetoran.siswaId}-${surahNomor}-${ayatNo}-${sesiKe}`;
              const autoSesi: CapaianBacaanSesiPertemuan = {
                id: autoSesiId,
                siswaId: newSetoran.siswaId,
                suratNomor: surahNomor,
                nomorAyat: ayatNo,
                sesiKe,
                namaSesi,
                tanggal: newSetoran.tanggalSetoran || new Date().toISOString().split('T')[0],
                guruId: scorerId,
                guruNama: scorerNama,
                elemenId: newSetoran.elemenId || '',
                elemenNama: newSetoran.jenisSetoran || '',
                catatanTarget,
                catatanTambahan: newSetoran.catatanGuru || ''
              };
              saveCapaianBacaanSesi(autoSesi);
            }
          }
        }
      } catch (e) {
        console.warn('Auto sync setoran to Capaian Bacaan notice:', e);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `setorans/${id}`);
    }
  };

  const updateSetoran = async (id: string, changedFields: Partial<Setoran>) => {
    const existing = setorans.find(s => s.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    setSetorans(prev => prev.map(s => s.id === id ? updated : s));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'setorans', id), sanitized);
      addLog('Update Setoran', `Memperbarui penilaian setoran ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `setorans/${id}`);
    }
  };

  const deleteSetoran = async (id: string) => {
    const target = setorans.find(s => s.id === id);
    setSetorans(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, 'setorans', id));
      addLog('Hapus Setoran', `Menghapus entri setoran: ${target ? target.siswaNama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `setorans/${id}`);
    }
  };

  // Murojaah Berpasangan Actions
  const createMurojaahBerpasangan = async (murojaah: Omit<MurojaahBerpasangan, 'id'>) => {
    const id = `mur-${Date.now()}`;
    const newMurojaah: MurojaahBerpasangan = {
      ...murojaah,
      id
    };
    setMurojaahBerpasangans(prev => [...prev.filter(m => m.id !== id), newMurojaah]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newMurojaah));
      await setDoc(doc(db, 'murojaahBerpasangans', id), sanitized);
      addLog('Murojaah Berpasangan Baru', `Menambahkan murojaah berpasangan: ${murojaah.siswaNama} & ${murojaah.pasanganNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `murojaahBerpasangans/${id}`);
    }
  };

  const updateMurojaahBerpasangan = async (id: string, changedFields: Partial<MurojaahBerpasangan>) => {
    const existing = murojaahBerpasangans.find(m => m.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    setMurojaahBerpasangans(prev => prev.map(m => m.id === id ? updated : m));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'murojaahBerpasangans', id), sanitized);
      addLog('Update Murojaah Berpasangan', `Memperbarui murojaah berpasangan ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `murojaahBerpasangans/${id}`);
    }
  };

  const deleteMurojaahBerpasangan = async (id: string) => {
    const target = murojaahBerpasangans.find(m => m.id === id);
    setMurojaahBerpasangans(prev => prev.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'murojaahBerpasangans', id));
      addLog('Hapus Murojaah Berpasangan', `Menghapus laporan murojaah berpasangan: ${target ? target.siswaNama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `murojaahBerpasangans/${id}`);
    }
  };

  // Jenis Assessment Actions
  const createJenisAssessment = async (val: Omit<JenisAssessment, 'id'>) => {
    const id = `jas-${Date.now()}`;
    const newRecord: JenisAssessment = { ...val, id };
    setJenisAssessments(prev => [...prev.filter(j => j.id !== id), newRecord]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newRecord));
      await setDoc(doc(db, 'jenisAssessments', id), sanitized);
      addLog('Tambah Jenis Assessment', `Menambahkan jenis assessment baru: ${val.namaAssessment}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `jenisAssessments/${id}`);
    }
  };

  const updateJenisAssessment = async (id: string, changedFields: Partial<JenisAssessment>) => {
    const existing = jenisAssessments.find(j => j.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    setJenisAssessments(prev => prev.map(j => j.id === id ? updated : j));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'jenisAssessments', id), sanitized);
      addLog('Update Jenis Assessment', `Memperbarui jenis assessment ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `jenisAssessments/${id}`);
    }
  };

  const deleteJenisAssessment = async (id: string) => {
    const target = jenisAssessments.find(j => j.id === id);
    setJenisAssessments(prev => prev.filter(j => j.id !== id));
    try {
      await deleteDoc(doc(db, 'jenisAssessments', id));
      addLog('Hapus Jenis Assessment', `Menghapus jenis assessment: ${target ? target.namaAssessment : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `jenisAssessments/${id}`);
    }
  };

  // Template Assessment Actions
  const createTemplateAssessment = async (val: Omit<TemplateAssessment, 'id'>) => {
    const id = `tpl-${Date.now()}`;
    const newRecord: TemplateAssessment = { ...val, id };
    setTemplateAssessments(prev => [...prev.filter(t => t.id !== id), newRecord]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newRecord));
      await setDoc(doc(db, 'templateAssessments', id), sanitized);
      addLog('Tambah Template Assessment', `Menambahkan template assessment baru: ${val.namaTemplate}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `templateAssessments/${id}`);
    }
  };

  const updateTemplateAssessment = async (id: string, changedFields: Partial<TemplateAssessment>) => {
    const existing = templateAssessments.find(t => t.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    setTemplateAssessments(prev => prev.map(t => t.id === id ? updated : t));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'templateAssessments', id), sanitized);
      addLog('Update Template Assessment', `Memperbarui template assessment ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `templateAssessments/${id}`);
    }
  };

  const deleteTemplateAssessment = async (id: string) => {
    const target = templateAssessments.find(t => t.id === id);
    setTemplateAssessments(prev => prev.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, 'templateAssessments', id));
      addLog('Hapus Template Assessment', `Menghapus template assessment: ${target ? target.namaTemplate : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `templateAssessments/${id}`);
    }
  };

  // Assessment Record Actions
  const createAssessmentRecord = async (val: Omit<AssessmentRecord, 'id'>) => {
    const id = `rec-${Date.now()}`;
    const newRecord: AssessmentRecord = { ...val, id };
    setAssessmentRecords(prev => [...prev.filter(r => r.id !== id), newRecord]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newRecord));
      await setDoc(doc(db, 'assessmentRecords', id), sanitized);
      addLog('Penilaian Assessment Baru', `Menyimpan penilaian assessment ${val.namaAssessment} untuk siswa ${val.siswaNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `assessmentRecords/${id}`);
    }
    return id;
  };

  const updateAssessmentRecord = async (id: string, changedFields: Partial<AssessmentRecord>) => {
    const existing = assessmentRecords.find(r => r.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    setAssessmentRecords(prev => prev.map(r => r.id === id ? updated : r));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'assessmentRecords', id), sanitized);
      addLog('Update Penilaian Assessment', `Memperbarui penilaian assessment ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `assessmentRecords/${id}`);
    }
  };

  const deleteAssessmentRecord = async (id: string) => {
    const target = assessmentRecords.find(r => r.id === id);
    setAssessmentRecords(prev => prev.filter(r => r.id !== id));
    try {
      await deleteDoc(doc(db, 'assessmentRecords', id));
      addLog('Hapus Penilaian Assessment', `Menghapus penilaian assessment siswa: ${target ? target.siswaNama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `assessmentRecords/${id}`);
    }
  };

  // Pengajuan Assessment Actions
  const createPengajuanAssessment = async (val: Omit<PengajuanAssessment, 'id'>) => {
    const id = `req-${Date.now()}`;
    const newRecord: PengajuanAssessment = { ...val, id };
    setPengajuanAssessments(prev => [...prev.filter(r => r.id !== id), newRecord]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newRecord));
      await setDoc(doc(db, 'pengajuan_assessments', id), sanitized);
      addLog('Pengajuan Assessment Baru', `Mengajukan assessment ${val.templateAssessmentNama} untuk siswa ${val.siswaNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pengajuan_assessments/${id}`);
    }
    return id;
  };

  const updatePengajuanAssessment = async (id: string, changedFields: Partial<PengajuanAssessment>) => {
    const existing = pengajuanAssessments.find(r => r.id === id);
    if (!existing) return;
    const updated = { ...existing, ...changedFields };
    setPengajuanAssessments(prev => prev.map(r => r.id === id ? updated : r));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'pengajuan_assessments', id), sanitized);
      addLog('Update Pengajuan Assessment', `Memperbarui status pengajuan assessment ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pengajuan_assessments/${id}`);
    }
  };

  const deletePengajuanAssessment = async (id: string) => {
    const target = pengajuanAssessments.find(r => r.id === id);
    setPengajuanAssessments(prev => prev.filter(r => r.id !== id));
    try {
      await deleteDoc(doc(db, 'pengajuan_assessments', id));
      addLog('Hapus Pengajuan Assessment', `Menghapus pengajuan assessment siswa: ${target ? target.siswaNama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `pengajuan_assessments/${id}`);
    }
  };

  const updatePwaSettings = async (val: Partial<PwaSettings>) => {
    const updated = { ...pwaSettings, ...val };
    setPwaSettings(updated);
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'appSettings', 'pwa_settings'), sanitized);
      addLog('Update App Settings', 'Memperbarui nama dan ikon aplikasi (PWA)');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/pwa_settings');
    }
  };

  const saveInstitutionTheme = async (val: Partial<InstitutionThemeSettings>) => {
    const updated: InstitutionThemeSettings = cleanDataForFirestore({
      ...institutionTheme,
      ...val,
      id: 'theme_settings',
      updatedAt: new Date().toISOString(),
      updatedBy: currentSession.user?.namaLengkap || 'Administrator'
    });
    setInstitutionTheme(updated);
    safeSaveLocalStorage('mh_institution_theme', updated);
    try {
      await setDoc(doc(db, 'appSettings', 'theme_settings'), updated);
      addLog(
        'Update Tema Lembaga',
        `Memperbarui warna identitas lembaga (${updated.primaryHex}, Kunci: ${updated.lockInstitutionTheme ? 'Aktif' : 'Nonaktif'})`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/theme_settings');
    }
  };

  const updateCurrentUserColorTheme = async (pref: UserColorThemePreference) => {
    const user = currentSession.user;
    if (!user) return;
    const cleanedPref: UserColorThemePreference = cleanDataForFirestore({
      ...pref,
      updatedAt: new Date().toISOString(),
    });
    if (user.role === UserRole.ADMIN) {
      await updateAdmin(user.id, { colorTheme: cleanedPref });
    } else if (user.role === UserRole.GURU) {
      await updateGuru(user.id, { colorTheme: cleanedPref });
    } else if (user.role === UserRole.SISWA) {
      await updateSiswa(user.id, { colorTheme: cleanedPref });
    }
  };

  const updateHijriSetting = async (val: Partial<HijriCalendarSetting>) => {
    const updated: HijriCalendarSetting = { 
      ...hijriSetting, 
      ...val,
      updatedAt: new Date().toISOString(),
      updatedBy: currentSession.user?.namaLengkap || 'Administrator'
    };
    setHijriSetting(updated);
    localStorage.setItem('mh_hijri_setting', JSON.stringify(updated));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'appSettings', 'hijri_calendar'), sanitized);
      addLog('Update Kalender Hijriah', `Memperbarui pengaturan kalender Hijriah (Mode: ${updated.mode}, Offset: ${updated.dayOffset >= 0 ? '+' : ''}${updated.dayOffset} hari)`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/hijri_calendar');
    }
  };

  const saveRekapPresensiTemplate = async (template: RekapPresensiPdfTemplate) => {
    const merged = { ...DEFAULT_REKAP_PRESENSI_TEMPLATE, ...template };
    setRekapPresensiTemplate(merged);
    localStorage.setItem('rekap_presensi_pdf_template', JSON.stringify(merged));
    try {
      const sanitized = JSON.parse(JSON.stringify(merged));
      await setDoc(doc(db, 'appSettings', 'presensi_template'), sanitized);
      addLog('Update Presensi Template', 'Memperbarui template Kop Rekap Presensi PDF & Docs');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/presensi_template');
    }
  };

  const updateDocTemplates = async (templates: any[]) => {
    setDocTemplates(templates);
    try {
      localStorage.setItem('mh_doc_templates', JSON.stringify(templates));
      const sanitized = JSON.parse(JSON.stringify(templates));
      await setDoc(doc(db, 'shared_states', 'doc_templates'), { templates: sanitized });
      addLog('Update Template Dokumen', `Memperbarui ${templates.length} template dokumen assessment.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'shared_states/doc_templates');
    }
  };

  // Syahadah Actions
  const createSyahadah = async (val: Omit<Syahadah, 'id'>) => {
    const id = `syh-${Date.now()}`;
    const newRecord: Syahadah = { ...val, id };
    setSyahadahs(prev => [...prev.filter(s => s.id !== id), newRecord]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newRecord));
      await setDoc(doc(db, 'syahadahs', id), sanitized);
      addLog('Syahadah Diterbitkan', `Berhasil menerbitkan syahadah ${val.nomorSertifikat} untuk ${val.siswaNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `syahadahs/${id}`);
    }
  };

  const updateSyahadah = async (id: string, val: Partial<Syahadah>) => {
    const target = syahadahs.find(s => s.id === id);
    if (!target) return;
    const updated = { ...target, ...val };
    setSyahadahs(prev => prev.map(s => s.id === id ? updated : s));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'syahadahs', id), sanitized);
      addLog('Syahadah Diperbarui', `Berhasil memperbarui status/data syahadah untuk ${target.siswaNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `syahadahs/${id}`);
    }
  };

  const deleteSyahadah = async (id: string) => {
    const target = syahadahs.find(s => s.id === id);
    setSyahadahs(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, 'syahadahs', id));
      addLog('Hapus Syahadah', `Menghapus dokumen syahadah: ${target ? target.nomorSertifikat : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `syahadahs/${id}`);
    }
  };

  // Syahadah Rules Actions
  const createSyahadahRule = async (val: Omit<SyahadahRule, 'id'>) => {
    const id = `rule-${Date.now()}`;
    const newRule: SyahadahRule = { ...val, id };
    setSyahadahRules(prev => [...prev.filter(r => r.id !== id), newRule]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newRule));
      await setDoc(doc(db, 'syahadahRules', id), sanitized);
      addLog('Aturan Syahadah Baru', `Berhasil menambahkan aturan syahadah: ${val.namaSyahadah}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `syahadahRules/${id}`);
    }
  };

  const updateSyahadahRule = async (id: string, val: Partial<SyahadahRule>) => {
    const target = syahadahRules.find(r => r.id === id);
    if (!target) return;
    const updated = { ...target, ...val };
    setSyahadahRules(prev => prev.map(r => r.id === id ? updated : r));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'syahadahRules', id), sanitized);
      addLog('Aturan Syahadah Diperbarui', `Berhasil memperbarui aturan syahadah: ${target.namaSyahadah}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `syahadahRules/${id}`);
    }
  };

  const deleteSyahadahRule = async (id: string) => {
    const target = syahadahRules.find(r => r.id === id);
    setSyahadahRules(prev => prev.filter(r => r.id !== id));
    try {
      await deleteDoc(doc(db, 'syahadahRules', id));
      addLog('Hapus Aturan Syahadah', `Berhasil menghapus aturan syahadah: ${target ? target.namaSyahadah : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `syahadahRules/${id}`);
    }
  };

  const createElemenSetting = async (
    nama: string,
    tipeModul: TipeModul,
    jenisSetoranList: string[],
    kompetensi?: string,
    referensiModulId?: string,
    useJumlahBaris?: boolean,
    tipeKesalahan?: 'lahn_jaliy' | 'lahn_khafiy' | 'tajwid' | 'dasar' | 'all' | 'none' | 'page_based',
    usePageRules?: boolean,
    pageRules?: KategoriKesalahanPageRule[],
    useRubrikPenilaian?: boolean,
    useMasterPenalties?: boolean,
    baseScore?: number,
    rumusPenilaian?: 'absolut' | 'proporsional_baris',
    rubrikDeductions?: Record<string, number>,
    rubrikPredikat?: Array<{ minScore: number; maxScore: number; predikat: string; lulus: boolean }>,
    useCustomLinesConfig?: boolean,
    defaultLinesPerPage?: number,
    customPageLines?: CustomPageLine[],
    targetScope?: ElemenTargetScope,
    targetHalaqahIds?: string[],
    oncePerSessionCategories?: string[],
    bobotKlasifikasi?: Record<string, number>,
    bobotLahnJaliy?: number,
    bobotLahnKhafiy?: number,
    standarBarisQuran?: number,
    minBarisQuran?: number,
    maxBarisQuran?: number
  ) => {
    const id = nama.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    const newElem: ElemenSetting = {
      id,
      nama,
      tipeModul,
      jenisSetoranList,
      kompetensi: kompetensi || (tipeModul === TipeModul.AL_QURAN ? 'Hafalan' : 'Bacaan'),
      referensiModulId,
      useJumlahBaris,
      tipeKesalahan,
      usePageRules,
      pageRules,
      useRubrikPenilaian,
      useMasterPenalties,
      baseScore,
      rumusPenilaian,
      rubrikDeductions,
      rubrikPredikat,
      useCustomLinesConfig,
      defaultLinesPerPage,
      customPageLines,
      targetScope: targetScope || 'all',
      targetHalaqahIds: targetHalaqahIds || [],
      oncePerSessionCategories,
      bobotKlasifikasi,
      bobotLahnJaliy,
      bobotLahnKhafiy,
      standarBarisQuran,
      minBarisQuran,
      maxBarisQuran
    };
    const sanitized = JSON.parse(JSON.stringify(newElem));
    setElemenSettings(prev => [...prev.filter(e => e.id !== id), newElem]);
    try {
      await setDoc(doc(db, 'elemenSettings', id), sanitized);
      addLog('Tambah Elemen Pembelajaran', `Menambahkan elemen pembelajaran baru dengan Rubrik: ${nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `elemenSettings/${id}`);
    }
  };

  const updateElemenSettingFull = async (
    id: string,
    nama: string,
    tipeModul: TipeModul,
    jenisSetoranList: string[],
    kompetensi?: string,
    referensiModulId?: string,
    useJumlahBaris?: boolean,
    tipeKesalahan?: 'lahn_jaliy' | 'lahn_khafiy' | 'tajwid' | 'dasar' | 'all' | 'none' | 'page_based',
    usePageRules?: boolean,
    pageRules?: KategoriKesalahanPageRule[],
    useRubrikPenilaian?: boolean,
    useMasterPenalties?: boolean,
    baseScore?: number,
    rumusPenilaian?: 'absolut' | 'proporsional_baris',
    rubrikDeductions?: Record<string, number>,
    rubrikPredikat?: Array<{ minScore: number; maxScore: number; predikat: string; lulus: boolean }>,
    useCustomLinesConfig?: boolean,
    defaultLinesPerPage?: number,
    customPageLines?: CustomPageLine[],
    targetScope?: ElemenTargetScope,
    targetHalaqahIds?: string[],
    oncePerSessionCategories?: string[],
    bobotKlasifikasi?: Record<string, number>,
    bobotLahnJaliy?: number,
    bobotLahnKhafiy?: number,
    standarBarisQuran?: number,
    minBarisQuran?: number,
    maxBarisQuran?: number
  ) => {
    const newElem: ElemenSetting = {
      id,
      nama,
      tipeModul,
      jenisSetoranList,
      kompetensi: kompetensi || (tipeModul === TipeModul.AL_QURAN ? 'Hafalan' : 'Bacaan'),
      referensiModulId,
      useJumlahBaris,
      tipeKesalahan,
      usePageRules,
      pageRules,
      useRubrikPenilaian,
      useMasterPenalties,
      baseScore,
      rumusPenilaian,
      rubrikDeductions,
      rubrikPredikat,
      useCustomLinesConfig,
      defaultLinesPerPage,
      customPageLines,
      targetScope: targetScope || 'all',
      targetHalaqahIds: targetHalaqahIds || [],
      oncePerSessionCategories,
      bobotKlasifikasi,
      bobotLahnJaliy,
      bobotLahnKhafiy,
      standarBarisQuran,
      minBarisQuran,
      maxBarisQuran
    };
    const sanitized = JSON.parse(JSON.stringify(newElem));
    setElemenSettings(prev => prev.map(e => e.id === id ? newElem : e));
    try {
      await setDoc(doc(db, 'elemenSettings', id), sanitized);
      addLog('Update Elemen Pembelajaran', `Memperbarui konfigurasi elemen pembelajaran & Rubrik ID: ${id} (${nama})`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `elemenSettings/${id}`);
    }
  };

  const deleteElemenSetting = async (id: string) => {
    const target = elemenSettings.find(e => e.id === id);
    setElemenSettings(prev => prev.filter(e => e.id !== id));
    try {
      await deleteDoc(doc(db, 'elemenSettings', id));
      addLog('Hapus Elemen Pembelajaran', `Menghapus elemen pembelajaran: ${target ? target.nama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `elemenSettings/${id}`);
    }
  };

  const updateElemenSetting = async (id: string, jenisSetoranList: string[]) => {
    const existing = elemenSettings.find(e => e.id === id);
    if (!existing) return;
    const updated = { ...existing, jenisSetoranList };
    const sanitized = JSON.parse(JSON.stringify(updated));
    setElemenSettings(prev => prev.map(e => e.id === id ? updated : e));
    try {
      await setDoc(doc(db, 'elemenSettings', id), sanitized);
      addLog('Update Elemen Pembelajaran', `Memperbarui jenis setoran untuk ${existing.nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `elemenSettings/${id}`);
    }
  };

  const saveElemenSettingObject = async (elem: ElemenSetting) => {
    const id = elem.id || (elem.nama.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4));
    const fullElem: ElemenSetting = { ...elem, id };
    const sanitized = JSON.parse(JSON.stringify(fullElem));
    setElemenSettings(prev => [...prev.filter(e => e.id !== id), fullElem]);
    try {
      await setDoc(doc(db, 'elemenSettings', id), sanitized);
      addLog('Simpan Elemen Pembelajaran', `Menyimpan konfigurasi elemen & perjenjangan: ${elem.nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `elemenSettings/${id}`);
    }
  };

  const toggleStudentElemenOverride = async (
    siswaId: string,
    elemenId: string,
    grant: boolean,
    catatan?: string,
    guruNama?: string
  ) => {
    const targetStudent = siswas.find(s => s.id === siswaId);
    if (!targetStudent) return;

    const currentUnlocked = new Set(targetStudent.unlockedElemenIds || []);
    const currentNotes = { ...(targetStudent.elemenAkselerasiNotes || {}) };

    if (grant) {
      currentUnlocked.add(elemenId);
      currentNotes[elemenId] = {
        tanggal: new Date().toISOString().split('T')[0],
        guruNama: guruNama || currentSession.user?.namaLengkap || 'Ustadz Pembimbing',
        catatan: catatan || 'Dispensasi / Akselerasi langsung oleh Guru'
      };
    } else {
      currentUnlocked.delete(elemenId);
      delete currentNotes[elemenId];
    }

    const updatedFields: Partial<Siswa> = {
      unlockedElemenIds: Array.from(currentUnlocked),
      elemenAkselerasiNotes: currentNotes
    };

    await updateSiswa(siswaId, updatedFields);
    addLog(
      grant ? 'Buka Akses Elemen Santri' : 'Kunci Akses Elemen Santri',
      `${grant ? 'Membuka akses akselerasi' : 'Mengunci kembali'} elemen ${elemenId} untuk santri ${targetStudent.namaLengkap}`
    );
  };

  const saveMasterPenalties = async (newPenalties: MasterPenalties) => {
    const sanitized: MasterPenalties = {
      baseScore: newPenalties.baseScore !== undefined ? Number(newPenalties.baseScore) : 100,
      standarBarisQuran: newPenalties.standarBarisQuran !== undefined ? Number(newPenalties.standarBarisQuran) : 15,
      minBarisQuran: newPenalties.minBarisQuran !== undefined ? Number(newPenalties.minBarisQuran) : 5,
      maxBarisQuran: newPenalties.maxBarisQuran !== undefined ? Number(newPenalties.maxBarisQuran) : 15,
      bobotLahnJaliy: newPenalties.bobotLahnJaliy !== undefined ? Number(newPenalties.bobotLahnJaliy) : 4,
      bobotLahnKhafiy: newPenalties.bobotLahnKhafiy !== undefined ? Number(newPenalties.bobotLahnKhafiy) : 2,
      bobotKlasifikasi: newPenalties.bobotKlasifikasi || {},
      defaultBarisNonQuran: newPenalties.defaultBarisNonQuran !== undefined ? Number(newPenalties.defaultBarisNonQuran) : 6,
      minBarisNonQuranRatio: newPenalties.minBarisNonQuranRatio !== undefined ? Number(newPenalties.minBarisNonQuranRatio) : 0.5,
      rubrikDeductions: newPenalties.rubrikDeductions || {},
      oncePerSessionCategories: Array.isArray(newPenalties.oncePerSessionCategories) ? newPenalties.oncePerSessionCategories : []
    };
    setMasterPenalties(sanitized);
    safeSaveLocalStorage('mh_master_penalties', sanitized);
    try {
      await setDoc(doc(db, 'appSettings', 'master_penalties'), sanitized);
      addLog('Konfigurasi Master Bobot', `Memperbarui Master Bobot Penilaian (Base: ${sanitized.baseScore}, ${Object.keys(sanitized.rubrikDeductions).length} kategori, ${sanitized.oncePerSessionCategories.length} kategori 1x per setoran)`);
    } catch (error) {
      console.error('Failed to save master_penalties to Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/master_penalties');
    }
  };

  const createTajwidCategory = async (nama: string, deskripsi?: string, subcategories?: TajwidSubcategory[], tipe?: KategoriKesalahanTipe) => {
    const id = `tajwid-${Date.now()}`;
    const resolvedTipe: KategoriKesalahanTipe = tipe || 'lahn_khafiy';
    const newCat: TajwidCategory = { id, nama, deskripsi: deskripsi || '', subcategories: subcategories || [], tipe: resolvedTipe, urutan: tajwidCategories.length };
    setTajwidCategories(prev => [...prev.filter(t => t.id !== id), newCat]);
    try {
      await setDoc(doc(db, 'tajwidCategories', id), newCat);
      const matchedType = klasifikasiKesalahanTypes.find(t => t.id === resolvedTipe);
      const labelTipe = matchedType ? matchedType.nama : (resolvedTipe === 'lahn_jaliy' ? 'Lahn Jaliy' : 'Lahn Khafiy');
      addLog('Tambah Kategori Kesalahan', `Menambahkan kategori kesalahan (${labelTipe}): ${nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tajwidCategories/${id}`);
    }
  };

  const updateTajwidCategory = async (id: string, nama: string, deskripsi?: string, subcategories?: TajwidSubcategory[], tipe?: KategoriKesalahanTipe) => {
    const resolvedTipe: KategoriKesalahanTipe = tipe || 'lahn_khafiy';
    const current = tajwidCategories.find(t => t.id === id);
    const updated: TajwidCategory = { id, nama, deskripsi: deskripsi || '', subcategories: subcategories || [], tipe: resolvedTipe, urutan: current?.urutan };
    setTajwidCategories(prev => prev.map(t => t.id === id ? updated : t));
    try {
      await setDoc(doc(db, 'tajwidCategories', id), updated);
      const matchedType = klasifikasiKesalahanTypes.find(t => t.id === resolvedTipe);
      const labelTipe = matchedType ? matchedType.nama : (resolvedTipe === 'lahn_jaliy' ? 'Lahn Jaliy' : 'Lahn Khafiy');
      addLog('Update Kategori Kesalahan', `Memperbarui kategori kesalahan (${labelTipe}): ${nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tajwidCategories/${id}`);
    }
  };

  const deleteTajwidCategory = async (id: string) => {
    const target = tajwidCategories.find(t => t.id === id);
    setTajwidCategories(prev => prev.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, 'tajwidCategories', id));
      addLog('Hapus Kategori Tajwid', `Menghapus kategori kesalahan tajwid: ${target ? target.nama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tajwidCategories/${id}`);
    }
  };

  const reorderTajwidCategories = async (newOrderedList: TajwidCategory[]) => {
    const withUrutan = newOrderedList.map((cat, idx) => ({
      ...cat,
      urutan: idx
    }));
    setTajwidCategories(withUrutan);
    safeSaveLocalStorage('mh_tajwid_categories', withUrutan);
    safeSaveLocalStorage('mh_tajwid_order', withUrutan.map(c => c.id));

    try {
      await setDoc(doc(db, 'appSettings', 'tajwid_categories_order'), {
        order: withUrutan.map(c => c.id),
        updatedAt: new Date().toISOString()
      });
      const updatePromises = withUrutan.map(cat => 
        setDoc(doc(db, 'tajwidCategories', cat.id), { urutan: cat.urutan }, { merge: true })
      );
      await Promise.all(updatePromises);
      addLog('Urutan Kategori Kesalahan', 'Memperbarui urutan susunan kategori kesalahan tajwid');
    } catch (error) {
      console.error('Error saving reordered tajwid categories to Firestore:', error);
    }
  };

  // Klasifikasi Kesalahan Types Actions
  const createKlasifikasiKesalahanType = async (val: Omit<KlasifikasiKesalahanType, 'isDefault'>) => {
    const newType: KlasifikasiKesalahanType = {
      ...val,
      isDefault: false
    };
    const nextList = [...klasifikasiKesalahanTypes.filter(t => t.id !== val.id), newType];
    setKlasifikasiKesalahanTypes(nextList);
    try {
      await setDoc(doc(db, 'appSettings', 'klasifikasi_kesalahan_types'), { types: nextList });
      addLog('Tambah Tipe Klasifikasi', `Menambahkan tipe klasifikasi kesalahan: ${val.nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/klasifikasi_kesalahan_types');
    }
  };

  const updateKlasifikasiKesalahanType = async (id: string, val: Partial<KlasifikasiKesalahanType>) => {
    const updatedList = klasifikasiKesalahanTypes.map(t => t.id === id ? { ...t, ...val } : t);
    setKlasifikasiKesalahanTypes(updatedList);
    try {
      await setDoc(doc(db, 'appSettings', 'klasifikasi_kesalahan_types'), { types: updatedList });
      addLog('Update Tipe Klasifikasi', `Memperbarui tipe klasifikasi kesalahan: ${val.nama || id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/klasifikasi_kesalahan_types');
    }
  };

  const deleteKlasifikasiKesalahanType = async (id: string) => {
    const target = klasifikasiKesalahanTypes.find(t => t.id === id);
    const filteredList = klasifikasiKesalahanTypes.filter(t => t.id !== id);
    setKlasifikasiKesalahanTypes(filteredList);
    try {
      await setDoc(doc(db, 'appSettings', 'klasifikasi_kesalahan_types'), { types: filteredList });
      addLog('Hapus Tipe Klasifikasi', `Menghapus tipe klasifikasi kesalahan: ${target ? target.nama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/klasifikasi_kesalahan_types');
    }
  };

  const resetKlasifikasiKesalahanTypes = async () => {
    setKlasifikasiKesalahanTypes(DEFAULT_KLASIFIKASI_KESALAHAN_TYPES);
    try {
      await setDoc(doc(db, 'appSettings', 'klasifikasi_kesalahan_types'), { types: DEFAULT_KLASIFIKASI_KESALAHAN_TYPES });
      addLog('Reset Tipe Klasifikasi', 'Mengembalikan seluruh tipe klasifikasi kesalahan ke standar awal (Lahn Jaliy & Lahn Khafiy)');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appSettings/klasifikasi_kesalahan_types');
    }
  };

  // Mata Pelajaran Actions
  const createMataPelajaran = async (val: Omit<MataPelajaran, 'id' | 'tanggalDibuat'>) => {
    const id = `mapel-${Date.now()}`;
    const newMapel: MataPelajaran = {
      ...val,
      id,
      tanggalDibuat: new Date().toISOString()
    };
    setMataPelajarans(prev => [...prev.filter(m => m.id !== id), newMapel]);
    try {
      const sanitized = JSON.parse(JSON.stringify(newMapel));
      await setDoc(doc(db, 'mataPelajarans', id), sanitized);
      addLog('Tambah Mata Pelajaran', `Menambahkan mata pelajaran baru: ${val.nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `mataPelajarans/${id}`);
    }
  };

  const updateMataPelajaran = async (id: string, val: Partial<MataPelajaran>) => {
    const existing = mataPelajarans.find(m => m.id === id);
    if (!existing) return;
    const updated = { ...existing, ...val };
    setMataPelajarans(prev => prev.map(m => m.id === id ? updated : m));
    try {
      const sanitized = JSON.parse(JSON.stringify(updated));
      await setDoc(doc(db, 'mataPelajarans', id), sanitized);
      addLog('Update Mata Pelajaran', `Memperbarui mata pelajaran: ${updated.nama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `mataPelajarans/${id}`);
    }
  };

  const deleteMataPelajaran = async (id: string) => {
    const target = mataPelajarans.find(m => m.id === id);
    setMataPelajarans(prev => prev.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'mataPelajarans', id));
      addLog('Hapus Mata Pelajaran', `Menghapus mata pelajaran: ${target ? target.nama : id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `mataPelajarans/${id}`);
    }
  };

  // Chat Actions
  const sendChatMessage = async (receiverId: string, receiverNama: string, receiverRole: UserRole | 'ALL', message: string) => {
    if (!currentSession.user) return;
    const id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newMsg: ChatMessage = {
      id,
      senderId: currentSession.user.id,
      senderNama: currentSession.user.namaLengkap,
      senderRole: currentSession.user.role,
      receiverId,
      receiverNama,
      receiverRole,
      message,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newMsg]);
    try {
      await setDoc(doc(db, 'chatMessages', id), newMsg);
      addLog('Kirim Pesan', `Kirim pesan ke: ${receiverNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chatMessages/${id}`);
    }
  };

  const editChatMessage = async (id: string, newMessage: string) => {
    setChatMessages(prev => prev.map(m => m.id === id ? { ...m, message: newMessage } : m));
    try {
      await setDoc(doc(db, 'chatMessages', id), { message: newMessage }, { merge: true });
      addLog('Edit Pesan', `Mengubah isi pesan`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chatMessages/${id}`);
    }
  };

  const deleteChatMessage = async (id: string) => {
    setChatMessages(prev => prev.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'chatMessages', id));
      addLog('Hapus Pesan', `Menghapus pesan`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chatMessages/${id}`);
    }
  };

  // Virtual Meeting Actions
  const createVirtualMeeting = async (title: string, halaqahId: string, halaqahNama: string, agenda: string, meetingUrl?: string) => {
    if (!currentSession.user) return;
    
    const id = `meet-${Date.now()}`;
    
    // Fall back to standard free public meet.jit.si unless custom private key is saved in jitsiConfig
    const isJaaSConfigured = jitsiConfig && jitsiConfig.appId && jitsiConfig.privateKey && jitsiConfig.privateKey.trim().length > 100 && jitsiConfig.privateKey !== DEFAULT_PRIVATE_KEY_PEM;
    
    const defaultDomain = isJaaSConfigured ? `8x8.vc/${jitsiConfig.appId}` : 'meet.jit.si';
    const generatedUrl = meetingUrl || `https://${defaultDomain}/Halaqah-${halaqahId || 'Umum'}-${Math.random().toString(36).substring(2, 8)}`;
    
    const newMeeting: VirtualMeeting = {
      id,
      title,
      halaqahId,
      halaqahNama,
      guruId: currentSession.user.id,
      guruNama: currentSession.user.namaLengkap,
      agenda,
      isActive: true,
      meetingUrl: generatedUrl,
      startTime: new Date().toISOString(),
      participantsCount: 1
    };

    setVirtualMeetings(prev => [...prev.filter(m => m.id !== id), newMeeting]);
    try {
      await setDoc(doc(db, 'virtualMeetings', id), newMeeting);
      addLog('Mulai Pertemuan Virtual', `Memulai Halaqah Virtual: ${title} untuk ${halaqahNama}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `virtualMeetings/${id}`);
    }
  };

  const endVirtualMeeting = async (id: string) => {
    const meet = virtualMeetings.find(m => m.id === id);
    if (!meet) return;
    const updated = { ...meet, isActive: false };
    setVirtualMeetings(prev => prev.map(m => m.id === id ? updated : m));
    try {
      await setDoc(doc(db, 'virtualMeetings', id), updated);
      addLog('Selesai Pertemuan Virtual', `Mengakhiri Halaqah Virtual: ${meet.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `virtualMeetings/${id}`);
    }
  };

  // System Versioning & Master Disaster Recovery
  const [systemVersionInfo, setSystemVersionInfo] = useState<SystemVersionInfo>(() => {
    return getSystemVersionInfo();
  });

  const createSystemSnapshot = (options?: { 
    customNotes?: string; 
    manualVersion?: string; 
    bumpType?: 'minor' | 'major';
  }): { snapshot: SystemSnapshotData; filename: string } => {
    const rawDataset: Record<string, any[]> = {
      admins,
      gurus,
      siswas,
      kelases,
      halaqahs,
      moduls,
      setorans,
      murojaahBerpasangans,
      jenisAssessments,
      templateAssessments,
      assessmentRecords,
      pengajuanAssessments,
      syahadahs,
      syahadahRules,
      elemenSettings,
      mataPelajarans,
      tajwidCategories,
      programs,
      programBabs,
      programMateris,
      programLatihans,
      programAsesmens,
      programAsesmenSettings,
      programPraktikSettings,
      programEnrollments,
      pengumumans,
      capaianPembelajarans,
      tujuanPembelajarans,
      bankAktivitas,
      rppTemplates,
      guruRppList,
      guruAttendance,
      studentAttendance,
      guruSchedules,
      chatMessages,
      virtualMeetings,
      auditLogs
    };

    const signature = computeDataSignature(rawDataset);
    const { nextVersion, newInfo } = calculateNextVersion(signature, {
      manualBump: !!options?.manualVersion,
      bumpType: options?.bumpType
    });

    const finalVersion = options?.manualVersion ? options.manualVersion : nextVersion;
    newInfo.versionString = finalVersion;
    saveSystemVersionInfo(newInfo);
    setSystemVersionInfo(newInfo);

    const stats: SystemSnapshotStats = {
      admins: admins.length,
      gurus: gurus.length,
      siswas: siswas.length,
      kelases: kelases.length,
      halaqahs: halaqahs.length,
      moduls: moduls.length,
      modulPages: Object.keys(rawPages || {}).length,
      setorans: setorans.length,
      murojaahBerpasangans: murojaahBerpasangans.length,
      jenisAssessments: jenisAssessments.length,
      templateAssessments: templateAssessments.length,
      assessmentRecords: assessmentRecords.length,
      pengajuanAssessments: pengajuanAssessments.length,
      syahadahs: syahadahs.length,
      syahadahRules: syahadahRules.length,
      elemenSettings: elemenSettings.length,
      mataPelajarans: mataPelajarans.length,
      tajwidCategories: tajwidCategories.length,
      programs: programs.length,
      programBabs: programBabs.length,
      programMateris: programMateris.length,
      programLatihans: programLatihans.length,
      programAsesmens: programAsesmens.length,
      programAsesmenSettings: programAsesmenSettings.length,
      programPraktikSettings: programPraktikSettings.length,
      programEnrollments: programEnrollments.length,
      pengumumans: pengumumans.length,
      capaianPembelajarans: capaianPembelajarans.length,
      tujuanPembelajarans: tujuanPembelajarans.length,
      bankAktivitas: bankAktivitas.length,
      rppTemplates: rppTemplates.length,
      guruRppList: guruRppList.length,
      guruAttendance: guruAttendance.length,
      studentAttendance: studentAttendance.length,
      guruSchedules: guruSchedules.length,
      chatMessages: chatMessages.length,
      virtualMeetings: virtualMeetings.length,
      auditLogs: auditLogs.length,
    };

    const totalRecords = Object.values(stats).reduce((a, b) => a + b, 0);

    const metadata: SystemSnapshotMeta = {
      app: resolveInstitutionName(pwaSettings?.appName, strukturLembaga?.yayasan?.nama),
      version: finalVersion,
      revision: newInfo.revisionCount,
      timestamp: new Date().toISOString(),
      exportedBy: currentSession.user?.namaLengkap || 'Administrator Utama',
      exportedByEmail: currentSession.user?.email || 'admin@sistem.id',
      totalRecords,
      stats,
      notes: options?.customNotes || 'Cadangan berkala sistem halaqah tahfidz',
      checksum: signature,
      formatVersion: 2
    };

    const snapshot: SystemSnapshotData = {
      metadata,
      data: {
        admins,
        gurus,
        siswas,
        kelases,
        halaqahs,
        moduls,
        modulPages: rawPages,
        setorans,
        murojaahBerpasangans,
        jenisAssessments,
        templateAssessments,
        assessmentRecords,
        pengajuanAssessments,
        syahadahs,
        syahadahRules,
        elemenSettings,
        mataPelajarans,
        tajwidCategories,
        strukturLembaga,
        programs,
        programBabs,
        programMateris,
        programLatihans,
        programAsesmens,
        programAsesmenSettings,
        programPraktikSettings,
        programEnrollments,
        pengumumans,
        capaianPembelajarans,
        tujuanPembelajarans,
        bankAktivitas,
        rppTemplates,
        guruRppList,
        guruAttendance,
        studentAttendance,
        guruSchedules,
        rekapPresensiTemplate,
        pwaSettings,
        institutionTheme,
        quranLinesConfig,
        generalTargets,
        studentTargets,
        chatMessages,
        virtualMeetings,
        auditLogs
      }
    };

    const filename = generateSnapshotFilename(finalVersion);
    newInfo.lastExportedFilename = filename;
    newInfo.lastExportedAt = metadata.timestamp;
    newInfo.lastExportedBy = metadata.exportedBy;
    saveSystemVersionInfo(newInfo);
    setSystemVersionInfo(newInfo);

    addLog('Ekspor Cadangan Master', `Mengekspor cadangan sistem ${finalVersion} (${totalRecords} entitas data) ke file: ${filename}`);

    return { snapshot, filename };
  };

  const downloadMasterBackup = (options?: { 
    customNotes?: string; 
    manualVersion?: string; 
    bumpType?: 'minor' | 'major';
  }): { filename: string; snapshot: SystemSnapshotData } => {
    const { snapshot, filename } = createSystemSnapshot(options);
    downloadSnapshotFile(snapshot, filename);
    return { filename, snapshot };
  };

  const restoreSystemSnapshot = async (
    rawInput: any, 
    options?: { mode?: 'replace' | 'merge'; keepCurrentAdminSession?: boolean }
  ): Promise<{ success: boolean; message: string; details?: any }> => {
    try {
      const jsonStr = typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput);
      const parsed = parseAndValidateSnapshot(jsonStr);

      if (!parsed.isValid || !parsed.data) {
        return { success: false, message: parsed.error || 'Format berkas cadangan tidak valid.' };
      }

      const d = parsed.data;
      const isMerge = options?.mode === 'merge';

      // 1. Immediately apply to local state & localStorage synchronously
      if (d.admins) {
        const nextAdmins = isMerge 
          ? [...admins, ...d.admins.filter((a: any) => !admins.some(curr => curr.id === a.id))]
          : d.admins;
        setAdmins(nextAdmins);
        safeSaveLocalStorage('mh_admins', nextAdmins);
      }
      if (d.gurus) {
        const nextGurus = isMerge
          ? [...gurus, ...d.gurus.filter((g: any) => !gurus.some(curr => curr.id === g.id))]
          : d.gurus;
        setGurus(nextGurus);
        safeSaveLocalStorage('mh_gurus', nextGurus);
      }
      if (d.siswas) {
        const nextSiswas = isMerge
          ? [...siswas, ...d.siswas.filter((s: any) => !siswas.some(curr => curr.id === s.id))]
          : d.siswas;
        setSiswas(nextSiswas);
        safeSaveLocalStorage('mh_siswas', nextSiswas);
      }
      if (d.kelases) {
        const nextKelases = isMerge
          ? [...kelases, ...d.kelases.filter((k: any) => !kelases.some(curr => curr.id === k.id))]
          : d.kelases;
        setKelases(nextKelases);
        safeSaveLocalStorage('mh_kelases', nextKelases);
      }
      if (d.halaqahs) {
        const nextHalaqahs = isMerge
          ? [...halaqahs, ...d.halaqahs.filter((h: any) => !halaqahs.some(curr => curr.id === h.id))]
          : d.halaqahs;
        setHalaqahs(nextHalaqahs);
        safeSaveLocalStorage('mh_halaqahs', nextHalaqahs);
      }
      if (d.moduls) {
        const nextModuls = isMerge
          ? [...moduls, ...d.moduls.filter((m: any) => !moduls.some(curr => curr.id === m.id))]
          : d.moduls;
        setModuls(nextModuls);
        setRawModuls(nextModuls);
        safeSaveLocalStorage('mh_moduls', nextModuls);
      }
      if (d.modulPages) {
        const nextPages = isMerge ? { ...rawPages, ...d.modulPages } : d.modulPages;
        setRawPages(nextPages);
        safeSaveLocalStorage('mh_modulPages', nextPages);
      }
      if (d.setorans) {
        const nextSetorans = isMerge
          ? [...setorans, ...d.setorans.filter((s: any) => !setorans.some(curr => curr.id === s.id))]
          : d.setorans;
        setSetorans(nextSetorans);
        safeSaveLocalStorage('mh_setorans', nextSetorans);
      }
      if (d.murojaahBerpasangans) {
        setMurojaahBerpasangans(d.murojaahBerpasangans);
        safeSaveLocalStorage('mh_murojaahBerpasangans', d.murojaahBerpasangans);
      }
      if (d.jenisAssessments) {
        setJenisAssessments(d.jenisAssessments);
        safeSaveLocalStorage('mh_jenisAssessments', d.jenisAssessments);
      }
      if (d.templateAssessments) {
        setTemplateAssessments(d.templateAssessments);
        safeSaveLocalStorage('mh_templateAssessments', d.templateAssessments);
      }
      if (d.assessmentRecords) {
        setAssessmentRecords(d.assessmentRecords);
        safeSaveLocalStorage('mh_assessmentRecords', d.assessmentRecords);
      }
      if (d.pengajuanAssessments) {
        setPengajuanAssessments(d.pengajuanAssessments);
        safeSaveLocalStorage('mh_pengajuan_assessments', d.pengajuanAssessments);
      }
      if (d.syahadahs) {
        setSyahadahs(d.syahadahs);
        safeSaveLocalStorage('mh_syahadahs', d.syahadahs);
      }
      if (d.syahadahRules) {
        setSyahadahRules(d.syahadahRules);
        safeSaveLocalStorage('mh_syahadahRules', d.syahadahRules);
      }
      if (d.elemenSettings) {
        setElemenSettings(d.elemenSettings);
        safeSaveLocalStorage('mh_elemenSettings', d.elemenSettings);
      }
      if (d.mataPelajarans) {
        setMataPelajarans(d.mataPelajarans);
        safeSaveLocalStorage('mh_mataPelajarans', d.mataPelajarans);
      }
      if (d.tajwidCategories) {
        setTajwidCategories(d.tajwidCategories);
        safeSaveLocalStorage('mh_tajwidCategories', d.tajwidCategories);
      }
      if (d.strukturLembaga) {
        setStrukturLembaga(d.strukturLembaga);
        safeSaveLocalStorage('mh_struktur_lembaga', d.strukturLembaga);
      }
      if (d.programs) {
        setPrograms(d.programs);
        safeSaveLocalStorage('mh_programs', d.programs);
      }
      if (d.programBabs) {
        setProgramBabs(d.programBabs);
        safeSaveLocalStorage('mh_programBabs', d.programBabs);
      }
      if (d.programMateris) {
        setProgramMateris(d.programMateris);
        safeSaveLocalStorage('mh_programMateris', d.programMateris);
      }
      if (d.programLatihans) {
        setProgramLatihans(d.programLatihans);
        safeSaveLocalStorage('mh_programLatihans', d.programLatihans);
      }
      if (d.programAsesmens) {
        setProgramAsesmens(d.programAsesmens);
        safeSaveLocalStorage('mh_programAsesmens', d.programAsesmens);
      }
      if (d.programAsesmenSettings) {
        setProgramAsesmenSettings(d.programAsesmenSettings);
        safeSaveLocalStorage('mh_programAsesmenSettings', d.programAsesmenSettings);
      }
      if (d.programPraktikSettings) {
        setProgramPraktikSettings(d.programPraktikSettings);
        safeSaveLocalStorage('mh_programPraktikSettings', d.programPraktikSettings);
      }
      if (d.programEnrollments) {
        setProgramEnrollments(d.programEnrollments);
        safeSaveLocalStorage('mh_programEnrollments', d.programEnrollments);
      }
      if (d.pengumumans) {
        setPengumumans(d.pengumumans);
        safeSaveLocalStorage('mh_pengumumans', d.pengumumans);
      }
      if (d.capaianPembelajarans) {
        setCapaianPembelajarans(d.capaianPembelajarans);
        safeSaveLocalStorage('mh_capaianPembelajarans', d.capaianPembelajarans);
      }
      if (d.tujuanPembelajarans) {
        setTujuanPembelajarans(d.tujuanPembelajarans);
        safeSaveLocalStorage('mh_tujuanPembelajarans', d.tujuanPembelajarans);
      }
      if (d.bankAktivitas) {
        setBankAktivitas(d.bankAktivitas);
        safeSaveLocalStorage('mh_bankAktivitas', d.bankAktivitas);
      }
      if (d.rppTemplates) {
        setRppTemplates(d.rppTemplates);
        safeSaveLocalStorage('mh_rppTemplates', d.rppTemplates);
      }
      if (d.guruRppList) {
        setGuruRppList(d.guruRppList);
        safeSaveLocalStorage('mh_guruRppList', d.guruRppList);
      }
      if (d.guruAttendance) {
        setGuruAttendance(d.guruAttendance);
        safeSaveLocalStorage('mh_guru_attendance', d.guruAttendance);
      }
      if (d.studentAttendance) {
        setStudentAttendance(d.studentAttendance);
        safeSaveLocalStorage('mh_student_attendance', d.studentAttendance);
      }
      if (d.guruSchedules) {
        setGuruSchedules(d.guruSchedules);
        safeSaveLocalStorage('mh_guru_schedules', d.guruSchedules);
      }
      if (d.rekapPresensiTemplate) {
        setRekapPresensiTemplate(d.rekapPresensiTemplate);
        safeSaveLocalStorage('mh_rekap_presensi_template', d.rekapPresensiTemplate);
      }
      if (d.pwaSettings) {
        setPwaSettings(d.pwaSettings);
        safeSaveLocalStorage('mh_pwa_settings', d.pwaSettings);
      }
      if (d.institutionTheme) {
        const mergedTheme = { ...DEFAULT_INSTITUTION_THEME, ...d.institutionTheme };
        setInstitutionTheme(mergedTheme);
        safeSaveLocalStorage('mh_institution_theme', mergedTheme);
      }
      if (d.quranLinesConfig) {
        setQuranLinesConfig(d.quranLinesConfig);
        safeSaveLocalStorage('mh_quran_lines_config', d.quranLinesConfig);
      }
      if (d.generalTargets) {
        setGeneralTargets(d.generalTargets);
        safeSaveLocalStorage('mh_general_targets', d.generalTargets);
      }
      if (d.studentTargets) {
        setStudentTargets(d.studentTargets);
        safeSaveLocalStorage('mh_student_targets', d.studentTargets);
      }
      if (d.chatMessages) {
        setChatMessages(d.chatMessages);
      }
      if (d.virtualMeetings) {
        setVirtualMeetings(d.virtualMeetings);
      }
      if (d.auditLogs) {
        setAuditLogs(d.auditLogs);
      }

      // Update version info
      if (parsed.metadata?.version) {
        const verInfo = getSystemVersionInfo();
        verInfo.versionString = parsed.metadata.version;
        verInfo.lastDataHash = parsed.metadata.checksum || '';
        saveSystemVersionInfo(verInfo);
        setSystemVersionInfo(verInfo);
      }

      // 2. Asynchronously sync to Cloud Firestore
      (async () => {
        try {
          const writeList = async (colName: string, items: any[], transformDoc?: (item: any) => any) => {
            if (!items || !Array.isArray(items)) return;
            for (const item of items) {
              if (item?.id) {
                const payload = transformDoc ? transformDoc(item) : item;
                await setDoc(doc(db, colName, item.id), payload);
              }
            }
          };

          await writeList('admins', d.admins);
          await writeList('gurus', d.gurus);
          await writeList('siswas', d.siswas);
          await writeList('kelases', d.kelases);
          await writeList('halaqahs', d.halaqahs);
          if (d.moduls) {
            for (const m of d.moduls) {
              await setDoc(doc(db, 'moduls', m.id), toFirestoreModul(m));
              await savePagesToCloud(m.id, m.isMultiJilid || false, m.halamanGambar || [], m.halamanGambarPerJilid || []);
            }
          }
          await writeList('setorans', d.setorans);
          await writeList('murojaahBerpasangans', d.murojaahBerpasangans);
          await writeList('jenisAssessments', d.jenisAssessments);
          await writeList('templateAssessments', d.templateAssessments);
          await writeList('assessmentRecords', d.assessmentRecords);
          await writeList('pengajuan_assessments', d.pengajuanAssessments);
          await writeList('syahadahs', d.syahadahs);
          await writeList('syahadahRules', d.syahadahRules);
          await writeList('elemenSettings', d.elemenSettings);
          await writeList('mataPelajarans', d.mataPelajarans);
          await writeList('tajwidCategories', d.tajwidCategories);
          await writeList('programs', d.programs);
          await writeList('programBabs', d.programBabs);
          await writeList('programMateris', d.programMateris);
          await writeList('programLatihans', d.programLatihans);
          await writeList('programAsesmens', d.programAsesmens);
          await writeList('programAsesmenSettings', d.programAsesmenSettings);
          await writeList('programPraktikSettings', d.programPraktikSettings);
          await writeList('programEnrollments', d.programEnrollments);
          await writeList('pengumumans', d.pengumumans);
          await writeList('capaianPembelajarans', d.capaianPembelajarans);
          await writeList('tujuanPembelajarans', d.tujuanPembelajarans);
          await writeList('bankAktivitas', d.bankAktivitas);
          await writeList('rppTemplates', d.rppTemplates);
          await writeList('guruRppList', d.guruRppList);
          await writeList('guruAttendance', d.guruAttendance);
          await writeList('studentAttendance', d.studentAttendance);
          await writeList('guruSchedules', d.guruSchedules);
          if (d.strukturLembaga) {
            await setDoc(doc(db, 'appSettings', 'struktur_lembaga'), d.strukturLembaga);
          }
          if (d.rekapPresensiTemplate) {
            await setDoc(doc(db, 'appSettings', 'rekap_presensi_template'), d.rekapPresensiTemplate);
          }
          if (d.pwaSettings) {
            await setDoc(doc(db, 'appSettings', 'pwa_settings'), d.pwaSettings);
          }
          if (d.institutionTheme) {
            await setDoc(doc(db, 'appSettings', 'theme_settings'), cleanDataForFirestore(d.institutionTheme));
          }
        } catch (cloudErr) {
          console.warn('Syncing snapshot to cloud Firestore had warnings:', cloudErr);
        }
      })();

      addLog('Pemulihan Sistem (Master Restore)', `Memulihkan database dari snapshot versi ${parsed.metadata?.version || 'N/A'}`);

      return {
        success: true,
        message: `Database berhasil dipulihkan dari cadangan versi ${parsed.metadata?.version || ''}! Seluruh data aktif diperbarui.`,
        details: parsed.stats
      };
    } catch (e: any) {
      console.error('Failed to restore snapshot:', e);
      return { success: false, message: `Gagal memulihkan database: ${e.message || 'Kesalahan sistem'}` };
    }
  };

  // Database Backup Utility (Legacy compatibility)
  const backupDatabase = () => {
    const { snapshot } = createSystemSnapshot();
    return JSON.stringify(snapshot, null, 2);
  };

  const restoreDatabase = async (json: string, options?: { mode?: 'replace' | 'merge' }): Promise<boolean> => {
    const res = await restoreSystemSnapshot(json, options);
    return res.success;
  };

  const clearDatabase = async () => {
    try {
      const collections = [
        'admins', 'gurus', 'siswas', 'kelases', 'halaqahs', 'moduls', 'modulPages',
        'setorans', 'murojaahBerpasangans', 'jenisAssessments', 'templateAssessments',
        'assessmentRecords', 'syahadahs', 'elemenSettings', 'mataPelajarans', 'chatMessages', 'virtualMeetings', 'auditLogs'
      ];
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        for (const docSnap of snap.docs) {
          await deleteDoc(doc(db, col, docSnap.id));
        }
      }
      await seedDatabase();
      await addLog('Reset Sistem', 'Seluruh database direset kembali ke data bawaan awal');
    } catch (e) {
      console.error(e);
    }
  };

  const tryReconnectCloud = async () => {
    try {
      console.log('Mengaktifkan jaringan Firestore...');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mh_use_default_db_fallback');
        localStorage.setItem('mh_quota_exceeded_flag', 'false');
      }
      if (!db) {
        db = getFirebaseDb();
      }

      try {
        await enableNetwork(db);
      } catch (netErr) {
        console.warn('enableNetwork notice (network may already be active):', netErr);
      }
      
      setIsQuotaExceeded(false);
      setIsOffline(false);
      
      console.log('Memuat ulang database dari cloud...');
      await loadDatabaseOnce();
      console.log('Koneksi berhasil dipulihkan!');
    } catch (e) {
      console.error('Gagal memulihkan jaringan Firestore:', e);
      setIsOffline(false);
    }
  };

  const resetOfflineAndQuotaState = async () => {
    try {
      console.log('Resetting connection and quota flags for self-healing...');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mh_use_default_db_fallback');
        localStorage.setItem('mh_quota_exceeded_flag', 'false');
      }
      if (!db) {
        db = getFirebaseDb();
      }

      setIsOffline(false);
      setIsQuotaExceeded(false);
      
      // Attempt to enable network and refresh database
      try {
        await enableNetwork(db);
      } catch (netErr) {
        console.warn('enableNetwork notice:', netErr);
      }
      await loadDatabaseOnce();
    } catch (e) {
      console.error('Failed to reset connection and quota state:', e);
    }
  };

  const saveTypography = async (data: any) => {
    try {
      const updated = { ...typography, ...data };
      setTypography(updated);
      try {
        localStorage.setItem('mh_typography_backup', JSON.stringify(updated));
      } catch (err) {
        console.warn('Storage quota exceeded or storage unavailable:', err);
      }
      await setDoc(doc(db, 'shared_states', 'typography'), updated);
    } catch (e) {
      console.error('Failed to sync typography to firestore:', e);
    }
  };

  const saveModulCategories = async (cats: string[]) => {
    setModulCategories(cats);
    try {
      await setDoc(doc(db, 'shared_states', 'modul_categories'), { categories: cats });
    } catch (e) {
      console.error(e);
    }
  };

  const saveQuranLinesConfig = async (config: QuranLinesConfig) => {
    setQuranLinesConfig(config);
    try {
      localStorage.setItem('mh_quran_lines_config', JSON.stringify(config));
      await setDoc(doc(db, 'shared_states', 'quran_lines_config'), config);
    } catch (e) {
      console.error('Failed to sync quran_lines_config to firestore:', e);
    }
  };

  const saveNonQuranFonts = async (fonts: NonQuranFont[]) => {
    setNonQuranFonts(fonts);
    try {
      localStorage.setItem('mh_nonquran_fonts', JSON.stringify(fonts));
    } catch {}
    try {
      await setDoc(doc(db, 'shared_states', 'non_quran_fonts'), { fonts });
    } catch (e) {
      console.error('Failed to sync nonQuranFonts to firestore:', e);
    }
  };

  const saveGeneralTargets = async (targets: any) => {
    setGeneralTargets(targets);
    try {
      await setDoc(doc(db, 'shared_states', 'general_targets'), targets);
    } catch (e) {
      console.error(e);
    }
  };

  const saveStudentTargets = async (targets: any) => {
    setStudentTargets(targets);
    try {
      await setDoc(doc(db, 'shared_states', 'student_targets'), { targets });
    } catch (e) {
      console.error(e);
    }
  };

  const saveGuruAttendance = async (attendance: any[]) => {
    const sanitized = sanitizeGuruAttendanceList(attendance);
    setGuruAttendance(sanitized);
    try {
      localStorage.setItem('mh_guru_attendance', JSON.stringify(sanitized));
      await setDoc(doc(db, 'shared_states', 'guru_attendance'), { list: sanitized });
    } catch (e) {
      console.error(e);
    }
  };

  const saveStudentAttendance = async (attendance: any[]) => {
    const cleaned = sanitizeStudentAttendanceList(attendance);
    setStudentAttendance(cleaned);
    try {
      localStorage.setItem('mh_student_attendance', JSON.stringify(cleaned));
      await setDoc(doc(db, 'shared_states', 'student_attendance'), { list: cleaned });
    } catch (e) {
      console.error(e);
    }
  };

  const saveGuruSchedules = async (schedules: JadwalMengajarGuru[]) => {
    setGuruSchedules(schedules);
    try {
      await setDoc(doc(db, 'shared_states', 'guru_schedules'), { schedules });
    } catch (e) {
      console.error(e);
    }
  };

  const saveKeepNotes = async (notes: any[]) => {
    setKeepNotes(notes);
    try {
      await setDoc(doc(db, 'shared_states', 'keep_notes'), { list: notes });
    } catch (e) {
      console.error(e);
    }
  };

  const saveStudentBookmarks = async (bookmarks: any[]) => {
    setStudentBookmarks(bookmarks);
    try {
      await setDoc(doc(db, 'shared_states', 'student_bookmarks'), { list: bookmarks });
    } catch (e) {
      console.error(e);
    }
  };

  const saveWhiteboardCanvas = async (canvasJson: string) => {
    setWhiteboardCanvas(canvasJson);
    try {
      await setDoc(doc(db, 'shared_states', 'whiteboard_canvas'), { canvas: canvasJson });
    } catch (e) {
      console.error(e);
    }
  };

  const saveWhiteboardPins = async (pins: any[]) => {
    setWhiteboardPins(pins);
    try {
      await setDoc(doc(db, 'shared_states', 'whiteboard_pins'), { pins });
    } catch (e) {
      console.error(e);
    }
  };

  const saveJitsiConfig = async (config: { appId: string; keyId: string; privateKey: string }) => {
    setJitsiConfig(config);
    try {
      localStorage.setItem('mh_jitsi_app_id', config.appId);
      localStorage.setItem('mh_jitsi_key_id', config.keyId);
      localStorage.setItem('mh_jitsi_private_key', config.privateKey);
    } catch (err) {
      console.warn('Storage unavailable or quota exceeded:', err);
    }
    try {
      await setDoc(doc(db, 'shared_states', 'jitsi_config'), config);
    } catch (e) {
      console.error('Failed to sync Jitsi config to firestore:', e);
    }
  };

  const saveOperationalHours = async (openTime: string, closeTime: string) => {
    try {
      OPERATIONAL_CONFIG.OPEN_TIME = openTime;
      OPERATIONAL_CONFIG.CLOSE_TIME = closeTime;
      const open = isWithinOperationalHours();
      setIsSiswaOperationalOpen(open);
      
      await setDoc(doc(db, 'shared_states', 'operational_hours'), {
        openTime,
        closeTime,
        updatedAt: new Date().toISOString()
      });
      console.log(`[Operational Hours] Successfully synced to Firestore: ${openTime} s.d. ${closeTime}`);
    } catch (e) {
      console.error('Failed to sync operational hours to firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'shared_states/operational_hours');
      throw e;
    }
  };

  const updateSyahadahSettings = async (settings: Partial<SyahadahSettings>) => {
    const updated: SyahadahSettings = {
      ...syahadahSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    setSyahadahSettings(updated);
    safeSaveLocalStorage('mh_syahadah_settings', updated);
    try {
      await setDoc(doc(db, 'shared_states', 'syahadah_settings'), updated);
      addLog('Pengaturan Syahadah', `Memperbarui akses modul syahadah: Guru=${updated.isEnabledForGuru ? 'Aktif' : 'Nonaktif'}, Siswa=${updated.isEnabledForSiswa ? 'Aktif' : 'Nonaktif'}`);
    } catch (e) {
      console.error('Failed to update shared_states/syahadah_settings:', e);
      handleFirestoreError(e, OperationType.WRITE, 'shared_states/syahadah_settings');
    }
  };

  const saveStrukturLembaga = async (val: StrukturLembaga) => {
    setStrukturLembaga(val);
    try {
      localStorage.setItem('mh_struktur_lembaga', JSON.stringify(val));
      await setDoc(doc(db, 'shared_states', 'struktur_lembaga'), val);
    } catch (e) {
      console.error('Failed to sync struktur_lembaga to firestore:', e);
    }

    // Immediately sync jenjangList (Data Halaqah) to halaqahs state
    if (val.jenjangList && Array.isArray(val.jenjangList)) {
      setHalaqahs(prev => {
        let hasChanges = false;
        const updated = [...prev];

        val.jenjangList.forEach(jj => {
          const sch = (val.sekolahList || []).find(s => s.id === jj.sekolahId);
          const dir = sch?.direktoratId ? (val.direktoratList || []).find(d => d.id === sch.direktoratId) : null;
          const cleanJjGuru = normalizeTeacherName(jj.namaKepalaSekolah);
          const matchedGuru = gurus.find(g => {
            if (!cleanJjGuru) return false;
            const cleanGuru = normalizeTeacherName(g.namaLengkap);
            if (!cleanGuru) return false;
            if (cleanJjGuru === cleanGuru) return true;
            if (cleanJjGuru.includes(cleanGuru) || cleanGuru.includes(cleanJjGuru)) return true;
            const jjWords = cleanJjGuru.split(/\s+/).filter(w => w.length > 2);
            const guruWords = cleanGuru.split(/\s+/).filter(w => w.length > 2);
            return jjWords.some(w => guruWords.includes(w));
          });

          const jjKey = normalizeHalaqahKey(jj.nama);
          const existingIndex = updated.findIndex(h => 
            h.id === jj.id || 
            (jjKey && normalizeHalaqahKey(h.namaHalaqah) === jjKey && h.sekolahId === jj.sekolahId)
          );

          if (existingIndex >= 0) {
            const cur = updated[existingIndex];
            const newGuruId = matchedGuru?.id || (jj.namaKepalaSekolah ? cur.guruPembimbingId : '');
            const newGuruNama = jj.namaKepalaSekolah || cur.guruPembimbingNama || 'Belum Ditugasi';
            if (
              cur.namaHalaqah !== jj.nama ||
              cur.guruPembimbingNama !== newGuruNama ||
              (newGuruId && cur.guruPembimbingId !== newGuruId) ||
              cur.sekolahId !== jj.sekolahId ||
              cur.jenjangId !== jj.id
            ) {
              updated[existingIndex] = {
                ...cur,
                namaHalaqah: jj.nama,
                guruPembimbingNama: newGuruNama,
                guruPembimbingId: newGuruId,
                sekolahId: jj.sekolahId,
                sekolahNama: sch?.nama || cur.sekolahNama || '',
                jenjangId: jj.id,
                jenjangNama: jj.nama,
                direktoratId: sch?.direktoratId || cur.direktoratId || '',
                direktoratNama: dir?.nama || cur.direktoratNama || ''
              };
              hasChanges = true;
            }
          } else {
            updated.push({
              id: jj.id,
              namaHalaqah: jj.nama,
              guruPembimbingId: matchedGuru?.id || '',
              guruPembimbingNama: jj.namaKepalaSekolah || matchedGuru?.namaLengkap || 'Belum Ditugasi',
              kapasitasPeserta: 10,
              keterangan: `Halaqah resmi ${sch?.nama || 'Lembaga'}`,
              status: StatusAktif.AKTIF,
              warnaIdentitas: '#10B981',
              sekolahId: jj.sekolahId,
              sekolahNama: sch?.nama || '',
              jenjangId: jj.id,
              jenjangNama: jj.nama,
              direktoratId: sch?.direktoratId || '',
              direktoratNama: dir?.nama || '',
              sourceType: 'foundation'
            });
            hasChanges = true;
          }
        });

        // Filter out deleted foundation halaqahs (only those auto-generated with jj- prefix)
        const validJenjangIds = new Set(val.jenjangList.map(j => j.id));
        const finalUpdated = updated.filter(h => {
          if (h.sourceType === 'foundation' && h.id.startsWith('jj-')) {
            return validJenjangIds.has(h.id);
          }
          return true;
        });

        if (finalUpdated.length !== updated.length) hasChanges = true;

        if (hasChanges) {
          try {
            localStorage.setItem('mh_halaqahs', JSON.stringify(finalUpdated));
          } catch {}
          return finalUpdated;
        }
        return prev;
      });
    }
  };

  const createPengumuman = async (val: Omit<Pengumuman, 'id' | 'createdAt'>): Promise<string> => {
    const newId = `ann-${Date.now()}`;
    const newObj: Pengumuman = {
      ...val,
      id: newId,
      createdAt: new Date().toISOString(),
      dibacaOleh: val.dibacaOleh || []
    };
    
    setPengumumans(prev => {
      const updated = [newObj, ...prev];
      try {
        localStorage.setItem('mh_pengumumans', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      if (db) {
        await setDoc(doc(db, 'pengumumans', newId), cleanDataForFirestore(newObj));
      }
      await addLog('Tambah Pengumuman', `Membuat pengumuman baru: "${newObj.judul}" (Target: ${newObj.targetAudiens})`);
    } catch (e) {
      console.error('Gagal menyimpan pengumuman ke Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'pengumumans');
    }
    return newId;
  };

  const updatePengumuman = async (id: string, val: Partial<Pengumuman>): Promise<void> => {
    setPengumumans(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...val, updatedAt: new Date().toISOString() } : item);
      try {
        localStorage.setItem('mh_pengumumans', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      if (db) {
        await updateDoc(doc(db, 'pengumumans', id), cleanDataForFirestore({
          ...val,
          updatedAt: new Date().toISOString()
        }));
      }
      await addLog('Ubah Pengumuman', `Memperbarui pengumuman ID: ${id}`);
    } catch (e) {
      console.error('Gagal memperbarui pengumuman di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'pengumumans');
    }
  };

  const deletePengumuman = async (id: string): Promise<void> => {
    const target = pengumumans.find(p => p.id === id);
    setPengumumans(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('mh_pengumumans', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      if (db) {
        await deleteDoc(doc(db, 'pengumumans', id));
      }
      await addLog('Hapus Pengumuman', `Menghapus pengumuman: "${target?.judul || id}"`);
    } catch (e) {
      console.error('Gagal menghapus pengumuman dari Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'pengumumans');
    }
  };

  const markPengumumanAsRead = async (id: string, userId: string): Promise<void> => {
    if (!userId) return;
    let alreadyRead = false;

    setPengumumans(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const currentRead = item.dibacaOleh || [];
          if (currentRead.includes(userId)) {
            alreadyRead = true;
            return item;
          }
          const updatedRead = [...currentRead, userId];
          return { ...item, dibacaOleh: updatedRead };
        }
        return item;
      });
    });

    if (alreadyRead) return;

    try {
      const target = pengumumans.find(p => p.id === id);
      const currentRead = target?.dibacaOleh || [];
      const updatedRead = Array.from(new Set([...currentRead, userId]));

      try {
        localStorage.setItem('mh_pengumumans', JSON.stringify(pengumumans));
      } catch {}

      if (db) {
        await updateDoc(doc(db, 'pengumumans', id), {
          dibacaOleh: updatedRead
        });
      }
    } catch (e) {
      console.warn('Gagal menandai baca pengumuman di Firestore:', e);
    }
  };

  // ==========================================
  // Administrasi Guru (CP, TP, Bank Aktivitas, RPP, Pilot Testing) Handlers
  // ==========================================
  const isGuruEligibleForRpp = (guruId?: string): boolean => {
    if (!guruId) return false;
    if (pilotTestingConfig.isGlobalEnabled) return true;
    return (pilotTestingConfig.whitelistGuruIds || []).includes(guruId);
  };

  const savePilotTestingConfig = async (val: PilotTestingConfig): Promise<void> => {
    const updated: PilotTestingConfig = {
      ...val,
      updatedAt: new Date().toISOString()
    };
    setPilotTestingConfig(updated);
    try {
      localStorage.setItem('mh_pilot_testing_config', JSON.stringify(updated));
    } catch {}

    try {
      if (db) {
        await setDoc(doc(db, 'appSettings', 'pilot_testing_config'), cleanDataForFirestore(updated));
      }
      await addLog('Pengaturan Uji Coba Administrasi', `Memperbarui konfigurasi whitelist uji coba administrasi guru (Global: ${updated.isGlobalEnabled ? 'Aktif' : 'Non-aktif'}, Total Guru Terpilih: ${updated.whitelistGuruIds.length})`);
    } catch (e) {
      console.error('Gagal menyimpan pilot testing config:', e);
      handleFirestoreError(e, OperationType.WRITE, 'appSettings/pilot_testing_config');
    }
  };

  const getSopForElemen = (elemenId?: string): { doc: SopStandarPenilaianDoc; isCustom: boolean } => {
    if (!elemenId || elemenId === 'global') {
      return { doc: sopPenilaianDoc, isCustom: false };
    }
    const custom = sopPenilaianDoc.elementOverrides?.[elemenId];
    if (custom) {
      return { doc: custom, isCustom: true };
    }
    return { doc: sopPenilaianDoc, isCustom: false };
  };

  const saveSopPenilaianDoc = async (val: SopStandarPenilaianDoc): Promise<void> => {
    const currentOverrides = sopPenilaianDoc.elementOverrides || {};
    const updated = normalizeSopPenilaianDoc({
      ...val,
      elementOverrides: val.elementOverrides !== undefined ? val.elementOverrides : currentOverrides,
      updatedAt: new Date().toISOString()
    });
    setSopPenilaianDoc(updated);
    safeSaveLocalStorage('mh_sop_penilaian_doc', updated);

    try {
      if (db) {
        await setDoc(doc(db, 'appSettings', 'sop_standar_penilaian_doc'), cleanDataForFirestore(updated));
      }
      await addLog('Pembaruan Standar Penilaian SOP', `Admin memperbarui naskah Standar Penilaian Resmi Master (SK: ${updated.nomorSK})`);
    } catch (e) {
      console.warn('Gagal menyimpan SOP ke Firestore, tetap tersimpan lokal:', e);
    }
  };

  const saveSopElemenDoc = async (elemenId: string, val: SopStandarPenilaianDoc): Promise<void> => {
    const existingOverrides = { ...(sopPenilaianDoc.elementOverrides || {}) };
    existingOverrides[elemenId] = {
      ...val,
      id: `sop_elemen_${elemenId}`,
      elemenId,
      updatedAt: new Date().toISOString()
    };

    const updated: SopStandarPenilaianDoc = {
      ...sopPenilaianDoc,
      elementOverrides: existingOverrides,
      updatedAt: new Date().toISOString()
    };

    setSopPenilaianDoc(updated);
    safeSaveLocalStorage('mh_sop_penilaian_doc', updated);

    try {
      if (db) {
        await setDoc(doc(db, 'appSettings', 'sop_standar_penilaian_doc'), cleanDataForFirestore(updated));
      }
      await addLog('Pembaruan SOP Khusus Elemen', `Admin memperbarui naskah SOP khusus untuk elemen "${val.elemenNama || elemenId}" (SK: ${val.nomorSK})`);
    } catch (e) {
      console.warn('Gagal menyimpan SOP Khusus ke Firestore, tetap tersimpan lokal:', e);
    }
  };

  const deleteSopElemenDoc = async (elemenId: string): Promise<void> => {
    const existingOverrides = { ...(sopPenilaianDoc.elementOverrides || {}) };
    const elemenNama = existingOverrides[elemenId]?.elemenNama || elemenId;
    delete existingOverrides[elemenId];

    const updated: SopStandarPenilaianDoc = {
      ...sopPenilaianDoc,
      elementOverrides: existingOverrides,
      updatedAt: new Date().toISOString()
    };

    setSopPenilaianDoc(updated);
    safeSaveLocalStorage('mh_sop_penilaian_doc', updated);

    try {
      if (db) {
        await setDoc(doc(db, 'appSettings', 'sop_standar_penilaian_doc'), cleanDataForFirestore(updated));
      }
      await addLog('Hapus SOP Khusus Elemen', `Admin menghapus SOP khusus untuk elemen "${elemenNama}". Elemen kini kembali mengacu ke SOP Master Global.`);
    } catch (e) {
      console.warn('Gagal menghapus SOP Khusus di Firestore, tetap terhapus lokal:', e);
    }
  };

  const resetSopPenilaianDoc = async (): Promise<void> => {
    const updated: SopStandarPenilaianDoc = {
      ...DEFAULT_SOP_PENILAIAN_DOC,
      elementOverrides: sopPenilaianDoc.elementOverrides || {},
      updatedAt: new Date().toISOString()
    };
    setSopPenilaianDoc(updated);
    safeSaveLocalStorage('mh_sop_penilaian_doc', updated);

    try {
      if (db) {
        await setDoc(doc(db, 'appSettings', 'sop_standar_penilaian_doc'), cleanDataForFirestore(updated));
      }
      await addLog('Reset Standar Penilaian SOP', 'Mengembalikan naskah Standar Penilaian SOP Master ke default resmi');
    } catch (e) {
      console.warn('Gagal mereset SOP di Firestore, tetap ter-reset lokal:', e);
    }
  };

  // Laboratorium Fitur & Penguji Upgrade (Feature Lab & Beta Testing Ring)
  const isUserBetaTester = (userId?: string): boolean => {
    if (!userId || userId === 'adm-1') return false; // Admin utama adalah pengelola, bukan akun penguji
    return (featureLabConfig.betaTesterUserIds || []).includes(userId);
  };

  const isFeatureEnabledForUser = (featureId: string, userId?: string, userRole?: string): boolean => {
    const feat = (featureLabConfig.features || []).find(f => f.id === featureId);
    if (!feat) return false;
    if (feat.status === 'off') return false;
    if (feat.status === 'live') return true;

    // Status is 'beta'
    if (feat.allowedUserIds && feat.allowedUserIds.length > 0) {
      if (userId && feat.allowedUserIds.includes(userId)) return true;
    } else {
      if (userId && (featureLabConfig.betaTesterUserIds || []).includes(userId)) return true;
    }
    // Admin always gets preview access
    if (userRole === UserRole.ADMIN || userRole === 'admin') return true;
    return false;
  };

  const saveFeatureLabConfig = async (val: FeatureLabConfig): Promise<void> => {
    const updated = sanitizeFeatureLabConfig(val);
    setFeatureLabConfig(updated);
    try {
      localStorage.setItem('mh_feature_lab_config', JSON.stringify(updated));
    } catch {}

    try {
      if (db) {
        await setDoc(doc(db, 'appSettings', 'feature_lab_config'), cleanDataForFirestore(updated));
      }
      await addLog('Laboratorium Fitur', `Memperbarui rilis fitur dan tester beta (Total: ${updated.features.length} fitur, ${updated.betaTesterUserIds.length} tester)`);
    } catch (e) {
      console.error('Gagal menyimpan feature lab config:', e);
      handleFirestoreError(e, OperationType.WRITE, 'appSettings/feature_lab_config');
    }
  };

  const toggleFeatureStatus = async (featureId: string, status: FeatureFlagStatus): Promise<void> => {
    const updatedFeatures = (featureLabConfig.features || []).map(f => {
      if (f.id === featureId) {
        return { ...f, status, updatedAt: new Date().toISOString() };
      }
      return f;
    });
    const updated: FeatureLabConfig = {
      ...featureLabConfig,
      features: updatedFeatures,
      updatedAt: new Date().toISOString()
    };
    await saveFeatureLabConfig(updated);
  };

  const deleteFeatureFlag = async (featureId: string): Promise<void> => {
    const target = (featureLabConfig.features || []).find(f => f.id === featureId);
    const currentDeleted = featureLabConfig.deletedFeatureIds || [];
    const nextDeleted = Array.from(new Set([...currentDeleted, featureId]));
    const nextFeatures = (featureLabConfig.features || []).filter(f => f.id !== featureId);
    const updated: FeatureLabConfig = {
      ...featureLabConfig,
      features: nextFeatures,
      deletedFeatureIds: nextDeleted,
      updatedAt: new Date().toISOString()
    };
    await saveFeatureLabConfig(updated);
    if (target) {
      await addLog('Laboratorium Fitur', `Menghapus permanen fitur upgrade: "${target.name}" [ID: ${target.id}]`);
    }
  };

  const createFeatureFlag = async (val: Omit<FeatureFlagItem, 'id' | 'updatedAt'>): Promise<void> => {
    const id = `feat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFeature: FeatureFlagItem = {
      ...val,
      id,
      updatedAt: new Date().toISOString()
    };
    const currentFeatures = featureLabConfig.features || [];
    const currentDeleted = (featureLabConfig.deletedFeatureIds || []).filter(dId => dId !== id);
    const updated: FeatureLabConfig = {
      ...featureLabConfig,
      features: [newFeature, ...currentFeatures],
      deletedFeatureIds: currentDeleted,
      updatedAt: new Date().toISOString()
    };
    await saveFeatureLabConfig(updated);
    await addLog('Laboratorium Fitur', `Mendaftarkan fitur upgrade baru: "${newFeature.name}"`);
  };

  const resetFeatureFlagsToDefault = async (): Promise<void> => {
    const updated: FeatureLabConfig = {
      ...featureLabConfig,
      features: DEFAULT_FEATURE_FLAGS,
      deletedFeatureIds: [],
      updatedAt: new Date().toISOString()
    };
    await saveFeatureLabConfig(updated);
    await addLog('Laboratorium Fitur', `Memulihkan seluruh fitur bawaan ke daftar default`);
  };

  const toggleBetaTester = async (userId: string): Promise<void> => {
    if (userId === 'adm-1') return; // Admin utama tidak dapat dimasukkan dalam daftar penguji
    const current = (featureLabConfig.betaTesterUserIds || []).filter(id => id !== 'adm-1');
    const exists = current.includes(userId);
    const nextTesters = exists ? current.filter(id => id !== userId) : [...current, userId];
    const updated: FeatureLabConfig = {
      ...featureLabConfig,
      betaTesterUserIds: nextTesters,
      updatedAt: new Date().toISOString()
    };
    await saveFeatureLabConfig(updated);
  };

  // 1. Capaian Pembelajaran (CP)
  const createCapaianPembelajaran = async (val: Omit<CapaianPembelajaran, 'id' | 'tanggalDibuat'>): Promise<void> => {
    const id = `cp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newCP: CapaianPembelajaran = {
      ...val,
      id,
      tanggalDibuat: new Date().toISOString()
    };
    setCapaianPembelajarans(prev => [newCP, ...prev]);
    try {
      if (db) {
        await setDoc(doc(db, 'capaianPembelajarans', id), cleanDataForFirestore(newCP));
      }
      await addLog('Tambah CP', `Menambahkan Capaian Pembelajaran baru: [${newCP.kodeCP}] ${newCP.mataPelajaranNama}`);
    } catch (e) {
      console.error('Gagal menyimpan CP ke Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'capaianPembelajarans');
    }
  };

  const updateCapaianPembelajaran = async (id: string, val: Partial<CapaianPembelajaran>): Promise<void> => {
    setCapaianPembelajarans(prev => prev.map(c => c.id === id ? { ...c, ...val, updatedAt: new Date().toISOString() } : c));
    try {
      if (db) {
        await updateDoc(doc(db, 'capaianPembelajarans', id), cleanDataForFirestore({ ...val, updatedAt: new Date().toISOString() }));
      }
      await addLog('Ubah CP', `Memperbarui Capaian Pembelajaran ID: ${id}`);
    } catch (e) {
      console.error('Gagal update CP di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'capaianPembelajarans');
    }
  };

  const deleteCapaianPembelajaran = async (id: string): Promise<void> => {
    const target = capaianPembelajarans.find(c => c.id === id);
    setCapaianPembelajarans(prev => prev.filter(c => c.id !== id));
    try {
      if (db) {
        await deleteDoc(doc(db, 'capaianPembelajarans', id));
      }
      await addLog('Hapus CP', `Menghapus Capaian Pembelajaran: [${target?.kodeCP || id}]`);
    } catch (e) {
      console.error('Gagal menghapus CP di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'capaianPembelajarans');
    }
  };

  // 2. Tujuan Pembelajaran (TP)
  const createTujuanPembelajaran = async (val: Omit<TujuanPembelajaran, 'id' | 'tanggalDibuat'>): Promise<void> => {
    const id = `tp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTP: TujuanPembelajaran = {
      ...val,
      id,
      tanggalDibuat: new Date().toISOString()
    };
    setTujuanPembelajarans(prev => [...prev, newTP]);
    try {
      if (db) {
        await setDoc(doc(db, 'tujuanPembelajarans', id), cleanDataForFirestore(newTP));
      }
      await addLog('Tambah TP', `Menambahkan Tujuan Pembelajaran baru: [${newTP.kodeTP}] ${newTP.judul}`);
    } catch (e) {
      console.error('Gagal menyimpan TP ke Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'tujuanPembelajarans');
    }
  };

  const updateTujuanPembelajaran = async (id: string, val: Partial<TujuanPembelajaran>): Promise<void> => {
    setTujuanPembelajarans(prev => prev.map(t => t.id === id ? { ...t, ...val, updatedAt: new Date().toISOString() } : t));
    try {
      if (db) {
        await updateDoc(doc(db, 'tujuanPembelajarans', id), cleanDataForFirestore({ ...val, updatedAt: new Date().toISOString() }));
      }
      await addLog('Ubah TP', `Memperbarui Tujuan Pembelajaran ID: ${id}`);
    } catch (e) {
      console.error('Gagal update TP di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'tujuanPembelajarans');
    }
  };

  const deleteTujuanPembelajaran = async (id: string): Promise<void> => {
    const target = tujuanPembelajarans.find(t => t.id === id);
    setTujuanPembelajarans(prev => prev.filter(t => t.id !== id));
    try {
      if (db) {
        await deleteDoc(doc(db, 'tujuanPembelajarans', id));
      }
      await addLog('Hapus TP', `Menghapus Tujuan Pembelajaran: [${target?.kodeTP || id}]`);
    } catch (e) {
      console.error('Gagal menghapus TP di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'tujuanPembelajarans');
    }
  };

  // 3. Bank Aktivitas Pembelajaran
  const createBankAktivitas = async (val: Omit<BankAktivitasPembelajaran, 'id'>): Promise<void> => {
    const id = `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newAct: BankAktivitasPembelajaran = { ...val, id };
    setBankAktivitas(prev => [...prev, newAct]);
    try {
      if (db) {
        await setDoc(doc(db, 'bankAktivitas', id), cleanDataForFirestore(newAct));
      }
      await addLog('Tambah Aktivitas', `Menambahkan referensi aktivitas RPP: ${newAct.judul}`);
    } catch (e) {
      console.error('Gagal menyimpan aktivitas ke Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'bankAktivitas');
    }
  };

  const updateBankAktivitas = async (id: string, val: Partial<BankAktivitasPembelajaran>): Promise<void> => {
    setBankAktivitas(prev => prev.map(a => a.id === id ? { ...a, ...val } : a));
    try {
      if (db) {
        await updateDoc(doc(db, 'bankAktivitas', id), cleanDataForFirestore(val));
      }
      await addLog('Ubah Aktivitas', `Memperbarui referensi aktivitas RPP ID: ${id}`);
    } catch (e) {
      console.error('Gagal update aktivitas di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'bankAktivitas');
    }
  };

  const deleteBankAktivitas = async (id: string): Promise<void> => {
    const target = bankAktivitas.find(a => a.id === id);
    setBankAktivitas(prev => prev.filter(a => a.id !== id));
    try {
      if (db) {
        await deleteDoc(doc(db, 'bankAktivitas', id));
      }
      await addLog('Hapus Aktivitas', `Menghapus aktivitas RPP: ${target?.judul || id}`);
    } catch (e) {
      console.error('Gagal menghapus aktivitas di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'bankAktivitas');
    }
  };

  // 4. Template RPP Admin
  const createRppTemplate = async (val: Omit<RppTemplateAdmin, 'id' | 'tanggalDibuat'>): Promise<void> => {
    const id = `rpp-tpl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTpl: RppTemplateAdmin = {
      ...val,
      id,
      tanggalDibuat: new Date().toISOString()
    };
    setRppTemplates(prev => [newTpl, ...prev]);
    try {
      if (db) {
        await setDoc(doc(db, 'rppTemplates', id), cleanDataForFirestore(newTpl));
      }
      await addLog('Tambah Template RPP', `Menambahkan template RPP Admin: "${newTpl.judul}"`);
    } catch (e) {
      console.error('Gagal menyimpan template RPP ke Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'rppTemplates');
    }
  };

  const updateRppTemplate = async (id: string, val: Partial<RppTemplateAdmin>): Promise<void> => {
    setRppTemplates(prev => prev.map(t => t.id === id ? { ...t, ...val, updatedAt: new Date().toISOString() } : t));
    try {
      if (db) {
        await updateDoc(doc(db, 'rppTemplates', id), cleanDataForFirestore({ ...val, updatedAt: new Date().toISOString() }));
      }
      await addLog('Ubah Template RPP', `Memperbarui template RPP ID: ${id}`);
    } catch (e) {
      console.error('Gagal update template RPP di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'rppTemplates');
    }
  };

  const deleteRppTemplate = async (id: string): Promise<void> => {
    const target = rppTemplates.find(t => t.id === id);
    setRppTemplates(prev => prev.filter(t => t.id !== id));
    try {
      if (db) {
        await deleteDoc(doc(db, 'rppTemplates', id));
      }
      await addLog('Hapus Template RPP', `Menghapus template RPP: "${target?.judul || id}"`);
    } catch (e) {
      console.error('Gagal menghapus template RPP di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'rppTemplates');
    }
  };

  // 5. RPP Guru Dokumen
  const createGuruRpp = async (val: Omit<GuruRppDokumen, 'id' | 'tanggalDibuat'>): Promise<string> => {
    const id = `rpp-doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newDoc: GuruRppDokumen = {
      ...val,
      id,
      tanggalDibuat: new Date().toISOString()
    };
    setGuruRppList(prev => [newDoc, ...prev]);
    try {
      if (db) {
        await setDoc(doc(db, 'guruRppList', id), cleanDataForFirestore(newDoc));
      }
      await addLog('Penyusunan RPP', `Guru (${newDoc.guruNama}) menyusun RPP: "${newDoc.materiPokok}" [${newDoc.mataPelajaranNama}]`);
    } catch (e) {
      console.error('Gagal menyimpan RPP Guru ke Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'guruRppList');
    }
    return id;
  };

  const updateGuruRpp = async (id: string, val: Partial<GuruRppDokumen>): Promise<void> => {
    setGuruRppList(prev => prev.map(d => d.id === id ? { ...d, ...val, updatedAt: new Date().toISOString() } : d));
    try {
      if (db) {
        await updateDoc(doc(db, 'guruRppList', id), cleanDataForFirestore({ ...val, updatedAt: new Date().toISOString() }));
      }
      await addLog('Ubah RPP Guru', `Memperbarui dokumen RPP ID: ${id}`);
    } catch (e) {
      console.error('Gagal update RPP Guru di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'guruRppList');
    }
  };

  const deleteGuruRpp = async (id: string): Promise<void> => {
    const target = guruRppList.find(d => d.id === id);
    setGuruRppList(prev => prev.filter(d => d.id !== id));
    try {
      if (db) {
        await deleteDoc(doc(db, 'guruRppList', id));
      }
      await addLog('Hapus RPP Guru', `Menghapus dokumen RPP: "${target?.materiPokok || id}"`);
    } catch (e) {
      console.error('Gagal menghapus RPP Guru di Firestore:', e);
      handleFirestoreError(e, OperationType.WRITE, 'guruRppList');
    }
  };

  // ----------------------------------------------------
  // Instrumen Capaian Bacaan Ayat Action Handlers
  // ----------------------------------------------------
  const saveCapaianBacaanConfig = async (val: CapaianBacaanAyatConfig): Promise<void> => {
    let nextList: CapaianBacaanAyatConfig[] = [];
    setCapaianBacaanConfigs(prev => {
      const idx = prev.findIndex(c => c.id === val.id);
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = val;
      } else {
        nextList = [val, ...prev];
      }
      safeSaveLocalStorage('mh_capaian_bacaan_configs', nextList);
      return nextList;
    });
    try {
      if (db) {
        const cleanedVal = cleanDataForFirestore(val);
        const cleanedList = cleanDataForFirestore(nextList);
        await Promise.allSettled([
          setDoc(doc(db, 'capaianBacaanConfigs', val.id), cleanedVal),
          setDoc(doc(db, 'shared_states', 'capaian_bacaan_configs'), {
            configs: cleanedList,
            updatedAt: new Date().toISOString(),
            updatedBy: currentSession.user ? currentSession.user.namaLengkap : 'Admin'
          }),
          setDoc(doc(db, 'appSettings', 'capaian_bacaan_configs'), {
            configs: cleanedList,
            updatedAt: new Date().toISOString()
          })
        ]);
      }
      await addLog('Target Capaian Bacaan', `Menyimpan standar target ayat: Surat ${val.suratNama || val.suratNomor} Ayat ${val.nomorAyat}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'capaianBacaanConfigs');
    }
  };

  const deleteCapaianBacaanConfig = async (id: string): Promise<void> => {
    let nextList: CapaianBacaanAyatConfig[] = [];
    setCapaianBacaanConfigs(prev => {
      nextList = prev.filter(c => c.id !== id);
      safeSaveLocalStorage('mh_capaian_bacaan_configs', nextList);
      return nextList;
    });
    try {
      if (db) {
        const cleanedList = cleanDataForFirestore(nextList);
        await Promise.allSettled([
          deleteDoc(doc(db, 'capaianBacaanConfigs', id)),
          setDoc(doc(db, 'shared_states', 'capaian_bacaan_configs'), {
            configs: cleanedList,
            updatedAt: new Date().toISOString(),
            updatedBy: currentSession.user ? currentSession.user.namaLengkap : 'Admin'
          }),
          setDoc(doc(db, 'appSettings', 'capaian_bacaan_configs'), {
            configs: cleanedList,
            updatedAt: new Date().toISOString()
          })
        ]);
      }
      await addLog('Hapus Target Capaian', `Menghapus standar target ayat ID: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'capaianBacaanConfigs');
    }
  };

  const saveCapaianBacaanSesi = async (val: CapaianBacaanSesiPertemuan): Promise<void> => {
    setCapaianBacaanSesiList(prev => {
      const idx = prev.findIndex(s => s.id === val.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = val;
        return copy;
      }
      return [val, ...prev];
    });
    try {
      if (db) {
        await setDoc(doc(db, 'capaianBacaanSesiList', val.id), cleanDataForFirestore(val));
      }
      await addLog('Catat Sesi Capaian', `Mencatat sesi ${val.namaSesi} untuk santri ID: ${val.siswaId}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'capaianBacaanSesiList');
    }
  };

  const updateCapaianBacaanSesiNama = async (id: string, nama: string): Promise<void> => {
    setCapaianBacaanSesiList(prev => prev.map(s => s.id === id ? { ...s, namaSesi: nama } : s));
    try {
      if (db) {
        await updateDoc(doc(db, 'capaianBacaanSesiList', id), { namaSesi: nama });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'capaianBacaanSesiList');
    }
  };

  const deleteCapaianBacaanSesi = async (id: string): Promise<void> => {
    setCapaianBacaanSesiList(prev => prev.filter(s => s.id !== id));
    try {
      if (db) {
        await deleteDoc(doc(db, 'capaianBacaanSesiList', id));
      }
      await addLog('Hapus Sesi Capaian', `Menghapus catatan sesi capaian ID: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'capaianBacaanSesiList');
    }
  };

  const updateCapaianBacaanTrialSettings = useCallback(async (val: Partial<CapaianBacaanTrialSettings>): Promise<void> => {
    let nextSettings: CapaianBacaanTrialSettings = { enabledGuruIds: [], presetLoaded: true };
    setCapaianBacaanTrialSettings(prev => {
      const merged = sanitizeTrialSettings({ ...prev, ...val });
      nextSettings = merged;
      return nextSettings;
    });
    try {
      safeSaveLocalStorage('mh_capaian_bacaan_trial', nextSettings);
      if (db) {
        const cleaned = cleanDataForFirestore(nextSettings);
        await Promise.allSettled([
          setDoc(doc(db, 'shared_states', 'capaian_bacaan_trial'), {
            settings: cleaned,
            ...cleaned,
            updatedAt: new Date().toISOString(),
            updatedBy: currentSession.user ? currentSession.user.namaLengkap : 'Admin'
          }),
          setDoc(doc(db, 'appSettings', 'capaian_bacaan_trial'), cleaned),
          setDoc(doc(db, 'capaianBacaanTrialSettings', 'global_trial'), cleaned)
        ]);
        console.log('[📡 Cloud Sync] Successfully saved capaian_bacaan_trial to shared_states:', cleaned);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'capaianBacaanTrialSettings');
    }
  }, [currentSession.user]);

  const isGuruEligibleForCapaianBacaan = useCallback((_guruOrUserId?: string): boolean => {
    return true;
  }, []);

  const reorderCapaianBacaanConfigs = async (newList: CapaianBacaanAyatConfig[]): Promise<void> => {
    setCapaianBacaanConfigs(newList);
    safeSaveLocalStorage('mh_capaian_bacaan_configs', newList);
    try {
      if (db) {
        const cleanedList = cleanDataForFirestore(newList);
        await Promise.allSettled([
          setDoc(doc(db, 'shared_states', 'capaian_bacaan_configs'), {
            configs: cleanedList,
            updatedAt: new Date().toISOString(),
            updatedBy: currentSession.user ? currentSession.user.namaLengkap : 'Admin'
          }),
          setDoc(doc(db, 'appSettings', 'capaian_bacaan_configs'), {
            configs: cleanedList,
            updatedAt: new Date().toISOString()
          })
        ]);
        for (const item of newList) {
          setDoc(doc(db, 'capaianBacaanConfigs', item.id), cleanDataForFirestore(item)).catch(() => {});
        }
      }
      await addLog('Penyusunan Ulang Target Ayat', `Memperbarui susunan dan urutan ${newList.length} target ayat ke Cloud`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'capaianBacaanConfigs');
    }
  };

  const seedCapaianBacaanPresets = async (targetSuratNomor?: number) => {
    const presetsToLoad = targetSuratNomor
      ? DEFAULT_PRESET_CAPAIAN_BACAAN.filter(p => p.suratNomor === targetSuratNomor)
      : DEFAULT_PRESET_CAPAIAN_BACAAN;

    let mergedList: CapaianBacaanAyatConfig[] = [];
    setCapaianBacaanConfigs(prev => {
      const merged = [...prev];
      presetsToLoad.forEach(preset => {
        const existingIdx = merged.findIndex(m => m.suratNomor === preset.suratNomor && m.nomorAyat === preset.nomorAyat);
        if (existingIdx >= 0) {
          merged[existingIdx] = preset;
        } else {
          merged.push(preset);
        }
      });
      mergedList = merged;
      safeSaveLocalStorage('mh_capaian_bacaan_configs', mergedList);
      return mergedList;
    });

    try {
      if (db) {
        const cleanedList = cleanDataForFirestore(mergedList);
        await Promise.allSettled([
          setDoc(doc(db, 'shared_states', 'capaian_bacaan_configs'), {
            configs: cleanedList,
            updatedAt: new Date().toISOString(),
            updatedBy: currentSession.user ? currentSession.user.namaLengkap : 'Admin'
          }),
          setDoc(doc(db, 'appSettings', 'capaian_bacaan_configs'), {
            configs: cleanedList,
            updatedAt: new Date().toISOString()
          })
        ]);
        for (const item of presetsToLoad) {
          setDoc(doc(db, 'capaianBacaanConfigs', item.id), cleanDataForFirestore(item)).catch(() => {});
        }
      }
      const surahLabel = targetSuratNomor === 1 ? 'Surah Al-Fatihah' : targetSuratNomor === 112 ? 'Surah Al-Ikhlas' : 'Surah Al-Fatihah & Al-Ikhlas';
      await addLog('Muat Preset Target', `Memuat preset standar bacaan ${surahLabel} ke Cloud`);
    } catch (e) {
      console.warn('Error syncing presets to cloud:', e);
    }
  };

  const syncCapaianBacaanConfigsToFirestore = async (): Promise<boolean> => {
    if (!db) return false;
    try {
      const cleanedList = cleanDataForFirestore(capaianBacaanConfigs);
      await Promise.allSettled([
        setDoc(doc(db, 'shared_states', 'capaian_bacaan_configs'), {
          configs: cleanedList,
          updatedAt: new Date().toISOString(),
          updatedBy: currentSession.user ? currentSession.user.namaLengkap : 'Admin'
        }),
        setDoc(doc(db, 'appSettings', 'capaian_bacaan_configs'), {
          configs: cleanedList,
          updatedAt: new Date().toISOString()
        })
      ]);
      for (const item of capaianBacaanConfigs) {
        setDoc(doc(db, 'capaianBacaanConfigs', item.id), cleanDataForFirestore(item)).catch(() => {});
      }
      await addLog('Sinkronisasi Target Capaian', `Berhasil sinkronisasi ${capaianBacaanConfigs.length} standar target ayat ke Cloud`);
      return true;
    } catch (e) {
      console.error('Error syncing capaian bacaan configs to cloud:', e);
      return false;
    }
  };

  // Filter out inactive/suspended students for GURU role
  const isGuruSession = currentSession.user?.role === UserRole.GURU;

  const visibleSiswas = useMemo(() => {
    if (!isGuruSession) return siswas;
    return siswas.filter(s => 
      s.status !== StatusAktif.NON_AKTIF && 
      (s.status as string) !== 'Nonaktif' && 
      (s.status as string) !== 'nonaktif' && 
      (s as any).statusAktif !== false
    );
  }, [siswas, isGuruSession]);

  const activeSiswaIdSet = useMemo(() => {
    if (!isGuruSession) return null;
    return new Set(visibleSiswas.map(s => s.id));
  }, [visibleSiswas, isGuruSession]);

  const visibleSetorans = useMemo(() => {
    if (!isGuruSession || !activeSiswaIdSet) return setorans;
    return setorans.filter(s => activeSiswaIdSet.has(s.siswaId));
  }, [setorans, activeSiswaIdSet, isGuruSession]);

  const visibleStudentAttendance = useMemo(() => {
    if (!isGuruSession || !activeSiswaIdSet) return studentAttendance;
    return studentAttendance.filter(a => activeSiswaIdSet.has(a.siswaId));
  }, [studentAttendance, activeSiswaIdSet, isGuruSession]);

  const visibleAssessmentRecords = useMemo(() => {
    if (!isGuruSession || !activeSiswaIdSet) return assessmentRecords;
    return assessmentRecords.filter(r => activeSiswaIdSet.has(r.siswaId));
  }, [assessmentRecords, activeSiswaIdSet, isGuruSession]);

  const visiblePengajuanAssessments = useMemo(() => {
    if (!isGuruSession || !activeSiswaIdSet) return pengajuanAssessments;
    return pengajuanAssessments.filter(p => activeSiswaIdSet.has(p.siswaId));
  }, [pengajuanAssessments, activeSiswaIdSet, isGuruSession]);

  const visibleMurojaah = useMemo(() => {
    if (!isGuruSession || !activeSiswaIdSet) return murojaahBerpasangans;
    return murojaahBerpasangans.filter(m => 
      activeSiswaIdSet.has(m.siswaId) && (!m.pasanganId || activeSiswaIdSet.has(m.pasanganId))
    );
  }, [murojaahBerpasangans, activeSiswaIdSet, isGuruSession]);

  const visibleSyahadahs = useMemo(() => {
    if (!isGuruSession || !activeSiswaIdSet) return syahadahs;
    return syahadahs.filter(s => activeSiswaIdSet.has(s.siswaId));
  }, [syahadahs, activeSiswaIdSet, isGuruSession]);

  return (
    <AppContext.Provider value={{
      admins,
      gurus,
      siswas: visibleSiswas,
      rawSiswas: siswas,
      kelases,
      halaqahs,
      moduls,
      setorans: visibleSetorans,
      rawSetorans: setorans,
      auditLogs,
      currentSession,
      selectedGuruHalaqahId,
      setSelectedGuruHalaqahId,
      darkMode,
      themePreference,
      setThemePreference,

      // Pengumuman
      pengumumans,
      createPengumuman,
      updatePengumuman,
      deletePengumuman,
      markPengumumanAsRead,

      strukturLembaga,
      saveStrukturLembaga,

      institutionTheme,
      saveInstitutionTheme,
      activeUserColorTheme,
      updateCurrentUserColorTheme,
      effectiveThemeColors,

      typography,
      saveTypography,
      modulCategories,
      saveModulCategories,
      quranLinesConfig,
      saveQuranLinesConfig,
      nonQuranFonts,
      saveNonQuranFonts,
      generalTargets,
      saveGeneralTargets,
      studentTargets,
      saveStudentTargets,
      guruAttendance,
      saveGuruAttendance,
      studentAttendance: visibleStudentAttendance,
      saveStudentAttendance,
      guruSchedules,
      saveGuruSchedules,
      keepNotes,
      saveKeepNotes,
      studentBookmarks,
      saveStudentBookmarks,
      whiteboardCanvas,
      saveWhiteboardCanvas,
      whiteboardPins,
      saveWhiteboardPins,

      login,
      logout,
      setDarkMode,
      addLog,

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

      createKelas,
      updateKelas,
      deleteKelas,

      createHalaqah,
      updateHalaqah,
      deleteHalaqah,

      createModul,
      updateModul,
      deleteModul,

      createSetoran,
      updateSetoran,
      deleteSetoran,

      murojaahBerpasangans: visibleMurojaah,
      createMurojaahBerpasangan,
      updateMurojaahBerpasangan,
      deleteMurojaahBerpasangan,

      jenisAssessments,
      createJenisAssessment,
      updateJenisAssessment,
      deleteJenisAssessment,
      templateAssessments,
      createTemplateAssessment,
      updateTemplateAssessment,
      deleteTemplateAssessment,
      assessmentRecords: visibleAssessmentRecords,
      createAssessmentRecord,
      updateAssessmentRecord,
      deleteAssessmentRecord,
      pengajuanAssessments: visiblePengajuanAssessments,
      createPengajuanAssessment,
      updatePengajuanAssessment,
      deletePengajuanAssessment,
      syahadahs: visibleSyahadahs,
      createSyahadah,
      updateSyahadah,
      deleteSyahadah,
      syahadahRules,
      createSyahadahRule,
      updateSyahadahRule,
      deleteSyahadahRule,
      syahadahSettings,
      updateSyahadahSettings,
      elemenSettings,
      masterPenalties,
      setMasterPenalties,
      saveMasterPenalties,
      updateElemenSetting,
      createElemenSetting,
      updateElemenSettingFull,
      deleteElemenSetting,
      saveElemenSettingObject,
      toggleStudentElemenOverride,
      
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
      
      mataPelajarans,
      createMataPelajaran,
      updateMataPelajaran,
      deleteMataPelajaran,

      isQuotaExceeded,
      isOffline,
      isCheckingConnection,
      isSiswaOperationalOpen,

      chatMessages,
      sendChatMessage,
      editChatMessage,
      deleteChatMessage,

      virtualMeetings,
      createVirtualMeeting,
      endVirtualMeeting,
      jitsiConfig,
      saveJitsiConfig,
      saveOperationalHours,

      // Program Keilmuan (LMS)
      programs,
      programBabs,
      programMateris,
      programLatihans,
      programAsesmens,
      programAsesmenSettings,
      programPraktikSettings,
      programEnrollments,
      createProgram,
      updateProgram,
      deleteProgram,
      createProgramBab,
      updateProgramBab,
      deleteProgramBab,
      createProgramMateri,
      updateProgramMateri,
      deleteProgramMateri,
      createProgramLatihan,
      updateProgramLatihan,
      deleteProgramLatihan,
      createProgramAsesmen,
      updateProgramAsesmen,
      deleteProgramAsesmen,
      saveProgramAsesmenSetting,
      saveProgramPraktikSetting,
      createProgramEnrollment,
      updateProgramEnrollment,
      deleteProgramEnrollment,

      pwaSettings,
      updatePwaSettings,
      hijriSetting,
      updateHijriSetting,
      docTemplates,
      updateDocTemplates,
      rekapPresensiTemplate,
      saveRekapPresensiTemplate,

      // Administrasi Guru (CP, TP, Bank Aktivitas, RPP, Pilot Testing)
      capaianPembelajarans,
      tujuanPembelajarans,
      bankAktivitas,
      rppTemplates,
      guruRppList,
      pilotTestingConfig,
      isGuruEligibleForRpp,
      createCapaianPembelajaran,
      updateCapaianPembelajaran,
      deleteCapaianPembelajaran,
      createTujuanPembelajaran,
      updateTujuanPembelajaran,
      deleteTujuanPembelajaran,
      createBankAktivitas,
      updateBankAktivitas,
      deleteBankAktivitas,
      createRppTemplate,
      updateRppTemplate,
      deleteRppTemplate,
      createGuruRpp,
      updateGuruRpp,
      deleteGuruRpp,
      savePilotTestingConfig,
      sopPenilaianDoc,
      saveSopPenilaianDoc,
      resetSopPenilaianDoc,
      saveSopElemenDoc,
      deleteSopElemenDoc,
      getSopForElemen,

      featureLabConfig,
      saveFeatureLabConfig,
      toggleFeatureStatus,
      deleteFeatureFlag,
      createFeatureFlag,
      resetFeatureFlagsToDefault,
      toggleBetaTester,
      isFeatureEnabledForUser,
      isUserBetaTester,

      // Instrumen Capaian Bacaan Ayat
      capaianBacaanConfigs,
      capaianBacaanSesiList,
      capaianBacaanTrialSettings,
      saveCapaianBacaanConfig,
      deleteCapaianBacaanConfig,
      saveCapaianBacaanSesi,
      updateCapaianBacaanSesiNama,
      deleteCapaianBacaanSesi,
      updateCapaianBacaanTrialSettings,
      isGuruEligibleForCapaianBacaan,
      reorderCapaianBacaanConfigs,
      seedCapaianBacaanPresets,
      syncCapaianBacaanConfigsToFirestore,

      backupDatabase,
      restoreDatabase,
      createSystemSnapshot,
      downloadMasterBackup,
      restoreSystemSnapshot,
      systemVersionInfo,
      clearDatabase,
      tryReconnectCloud,
      refreshDatabase,
      resetOfflineAndQuotaState
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
};
