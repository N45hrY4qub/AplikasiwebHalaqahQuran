/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemSnapshotData, SystemSnapshotMeta, SystemSnapshotStats, SystemVersionInfo } from '../types';

const VERSION_STORAGE_KEY = 'mh_system_version_info';

/**
 * Generates a simple 32-bit checksum hash string for data integrity tracking
 */
export function simpleChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Computes a concise signature of the current application dataset
 */
export function computeDataSignature(dataset: Record<string, any[]>): string {
  const parts: string[] = [];
  const keys = Object.keys(dataset).sort();
  for (const k of keys) {
    const arr = Array.isArray(dataset[k]) ? dataset[k] : [];
    parts.push(`${k}:${arr.length}`);
    if (arr.length > 0) {
      // Sample first and last item ID / timestamp
      const first = arr[0]?.id || arr[0]?.timestamp || '';
      const last = arr[arr.length - 1]?.id || arr[arr.length - 1]?.timestamp || '';
      parts.push(`${first}-${last}`);
    }
  }
  return simpleChecksum(parts.join('|'));
}

/**
 * Retrieves the current system version info from localStorage
 */
export function getSystemVersionInfo(): SystemVersionInfo {
  if (typeof window === 'undefined') {
    return {
      major: 1,
      minor: 0,
      patch: 0,
      versionString: 'v1.0',
      revisionCount: 1,
      lastDataHash: ''
    };
  }

  try {
    const saved = localStorage.getItem(VERSION_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading system version info:', e);
  }

  const initial: SystemVersionInfo = {
    major: 1,
    minor: 0,
    patch: 0,
    versionString: 'v1.0',
    revisionCount: 1,
    lastDataHash: ''
  };

  try {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(initial));
  } catch (_) {}

  return initial;
}

/**
 * Calculates the next version string based on current data changes
 */
export function calculateNextVersion(
  currentSignature: string,
  options?: { manualBump?: boolean; bumpType?: 'minor' | 'major' }
): { nextVersion: string; isChanged: boolean; newInfo: SystemVersionInfo } {
  const info = getSystemVersionInfo();
  const isChanged = !info.lastDataHash || info.lastDataHash !== currentSignature || !!options?.manualBump;

  if (!isChanged) {
    return {
      nextVersion: info.versionString,
      isChanged: false,
      newInfo: info
    };
  }

  let major = info.major;
  let minor = info.minor;
  let patch = info.patch;

  if (options?.bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else {
    minor += 1;
  }

  const versionString = `v${major}.${minor}`;
  const newInfo: SystemVersionInfo = {
    major,
    minor,
    patch,
    versionString,
    revisionCount: info.revisionCount + 1,
    lastDataHash: currentSignature,
    lastExportedAt: new Date().toISOString()
  };

  return {
    nextVersion: versionString,
    isChanged: true,
    newInfo
  };
}

/**
 * Saves updated system version info
 */
export function saveSystemVersionInfo(info: SystemVersionInfo) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(info));
    } catch (e) {
      console.warn('Failed to persist system version info:', e);
    }
  }
}

/**
 * Formats a clean, standard backup filename
 */
export function generateSnapshotFilename(versionString: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  
  const cleanVersion = versionString.startsWith('v') ? versionString : `v${versionString}`;
  return `Backup_Tahfidz_${cleanVersion}_${yyyy}-${mm}-${dd}_${hh}${min}.json`;
}

/**
 * Triggers a browser download of the snapshot JSON
 */
export function downloadSnapshotFile(snapshot: SystemSnapshotData, customFilename?: string): string {
  const filename = customFilename || generateSnapshotFilename(snapshot.metadata.version);
  const jsonStr = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Free blob URL after a short timeout
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  
  return filename;
}

/**
 * Parses and validates an uploaded or pasted JSON string
 */
export function parseAndValidateSnapshot(rawJson: string): {
  isValid: boolean;
  isLegacy: boolean;
  metadata?: SystemSnapshotMeta;
  stats?: SystemSnapshotStats;
  data: any;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, isLegacy: false, data: null, error: 'Berkas cadangan bukan objek JSON yang valid.' };
    }

    // Check if it's the modern versioned snapshot format
    if (parsed.metadata && parsed.data) {
      const meta = parsed.metadata as SystemSnapshotMeta;
      const data = parsed.data;
      
      const stats: SystemSnapshotStats = meta.stats || {
        admins: data.admins?.length || 0,
        gurus: data.gurus?.length || 0,
        siswas: data.siswas?.length || 0,
        kelases: data.kelases?.length || 0,
        halaqahs: data.halaqahs?.length || 0,
        moduls: data.moduls?.length || 0,
        modulPages: Object.keys(data.modulPages || {}).length,
        setorans: data.setorans?.length || 0,
        murojaahBerpasangans: data.murojaahBerpasangans?.length || 0,
        jenisAssessments: data.jenisAssessments?.length || 0,
        templateAssessments: data.templateAssessments?.length || 0,
        assessmentRecords: data.assessmentRecords?.length || 0,
        pengajuanAssessments: data.pengajuanAssessments?.length || 0,
        syahadahs: data.syahadahs?.length || 0,
        syahadahRules: data.syahadahRules?.length || 0,
        elemenSettings: data.elemenSettings?.length || 0,
        mataPelajarans: data.mataPelajarans?.length || 0,
        tajwidCategories: data.tajwidCategories?.length || 0,
        programs: data.programs?.length || 0,
        programBabs: data.programBabs?.length || 0,
        programMateris: data.programMateris?.length || 0,
        programLatihans: data.programLatihans?.length || 0,
        programAsesmens: data.programAsesmens?.length || 0,
        programAsesmenSettings: data.programAsesmenSettings?.length || 0,
        programPraktikSettings: data.programPraktikSettings?.length || 0,
        programEnrollments: data.programEnrollments?.length || 0,
        pengumumans: data.pengumumans?.length || 0,
        capaianPembelajarans: data.capaianPembelajarans?.length || 0,
        tujuanPembelajarans: data.tujuanPembelajarans?.length || 0,
        bankAktivitas: data.bankAktivitas?.length || 0,
        rppTemplates: data.rppTemplates?.length || 0,
        guruRppList: data.guruRppList?.length || 0,
        guruAttendance: data.guruAttendance?.length || 0,
        studentAttendance: data.studentAttendance?.length || 0,
        guruSchedules: data.guruSchedules?.length || 0,
        chatMessages: data.chatMessages?.length || 0,
        virtualMeetings: data.virtualMeetings?.length || 0,
        auditLogs: data.auditLogs?.length || 0,
      };

      return {
        isValid: true,
        isLegacy: false,
        metadata: meta,
        stats,
        data
      };
    }

    // Check if it's legacy format where collections are top-level keys
    if (parsed.admins || parsed.gurus || parsed.siswas || parsed.moduls || parsed.setorans) {
      const stats: SystemSnapshotStats = {
        admins: parsed.admins?.length || 0,
        gurus: parsed.gurus?.length || 0,
        siswas: parsed.siswas?.length || 0,
        kelases: parsed.kelases?.length || 0,
        halaqahs: parsed.halaqahs?.length || 0,
        moduls: parsed.moduls?.length || 0,
        modulPages: Object.keys(parsed.modulPages || {}).length,
        setorans: parsed.setorans?.length || 0,
        murojaahBerpasangans: parsed.murojaahBerpasangans?.length || 0,
        jenisAssessments: parsed.jenisAssessments?.length || 0,
        templateAssessments: parsed.templateAssessments?.length || 0,
        assessmentRecords: parsed.assessmentRecords?.length || 0,
        pengajuanAssessments: parsed.pengajuanAssessments?.length || 0,
        syahadahs: parsed.syahadahs?.length || 0,
        syahadahRules: parsed.syahadahRules?.length || 0,
        elemenSettings: parsed.elemenSettings?.length || 0,
        mataPelajarans: parsed.mataPelajarans?.length || 0,
        tajwidCategories: parsed.tajwidCategories?.length || 0,
        programs: parsed.programs?.length || 0,
        programBabs: parsed.programBabs?.length || 0,
        programMateris: parsed.programMateris?.length || 0,
        programLatihans: parsed.programLatihans?.length || 0,
        programAsesmens: parsed.programAsesmens?.length || 0,
        programAsesmenSettings: parsed.programAsesmenSettings?.length || 0,
        programPraktikSettings: parsed.programPraktikSettings?.length || 0,
        programEnrollments: parsed.programEnrollments?.length || 0,
        pengumumans: parsed.pengumumans?.length || 0,
        capaianPembelajarans: parsed.capaianPembelajarans?.length || 0,
        tujuanPembelajarans: parsed.tujuanPembelajarans?.length || 0,
        bankAktivitas: parsed.bankAktivitas?.length || 0,
        rppTemplates: parsed.rppTemplates?.length || 0,
        guruRppList: parsed.guruRppList?.length || 0,
        guruAttendance: parsed.guruAttendance?.length || 0,
        studentAttendance: parsed.studentAttendance?.length || 0,
        guruSchedules: parsed.guruSchedules?.length || 0,
        chatMessages: parsed.chatMessages?.length || 0,
        virtualMeetings: parsed.virtualMeetings?.length || 0,
        auditLogs: parsed.auditLogs?.length || 0,
      };

      const total = Object.values(stats).reduce((acc, val) => acc + val, 0);

      const legacyMeta: SystemSnapshotMeta = {
        app: 'Halaqah Tahfidz',
        version: 'v1.0 (Format Cadangan Klasik)',
        revision: 1,
        timestamp: new Date().toISOString(),
        exportedBy: 'Cadangan Sistem',
        totalRecords: total,
        stats,
        checksum: 'LEGACY_COMPATIBLE',
        formatVersion: 1
      };

      return {
        isValid: true,
        isLegacy: true,
        metadata: legacyMeta,
        stats,
        data: parsed
      };
    }

    return {
      isValid: false,
      isLegacy: false,
      data: null,
      error: 'Struktur berkas cadangan tidak dikenali. Pastikan file adalah hasil ekspor resmi aplikasi.'
    };
  } catch (e: any) {
    return {
      isValid: false,
      isLegacy: false,
      data: null,
      error: `Gagal membaca format JSON: ${e.message || 'Sintaks tidak valid'}`
    };
  }
}

/**
 * Formats byte size into human readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export interface CloudVaultSnapshotItem {
  id: string;
  dataDocId: string;
  version: string;
  revision: number;
  timestamp: string;
  exportedBy: string;
  notes?: string;
  totalRecords: number;
  stats: SystemSnapshotStats;
  compressedSize?: number;
  checksum: string;
}

export interface AutoBackupConfig {
  enabled: boolean;
  intervalHours: number;
  lastBackupAt?: string;
  backupToCloud: boolean;
  retentionCount: number;
}

const AUTO_BACKUP_STORAGE_KEY = 'mh_auto_backup_config';
const CLOUD_CATALOG_STORAGE_KEY = 'mh_cloud_vault_catalog';

/**
 * Retrieves auto backup configuration
 */
export function getAutoBackupConfig(): AutoBackupConfig {
  const defaultConfig: AutoBackupConfig = {
    enabled: true,
    intervalHours: 24,
    backupToCloud: true,
    retentionCount: 10
  };

  if (typeof window === 'undefined') return defaultConfig;

  try {
    const raw = localStorage.getItem(AUTO_BACKUP_STORAGE_KEY);
    if (raw) {
      return { ...defaultConfig, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to parse auto backup config:', e);
  }

  return defaultConfig;
}

/**
 * Saves auto backup configuration
 */
export function saveAutoBackupConfig(config: AutoBackupConfig) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save auto backup config:', e);
    }
  }
}

/**
 * Local cache getter for cloud catalog fallback
 */
export function getLocalCloudCatalog(): CloudVaultSnapshotItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CLOUD_CATALOG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read local cloud catalog:', e);
  }
  return [];
}

/**
 * Local cache setter for cloud catalog fallback
 */
export function saveLocalCloudCatalog(items: CloudVaultSnapshotItem[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CLOUD_CATALOG_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save local cloud catalog:', e);
    }
  }
}

