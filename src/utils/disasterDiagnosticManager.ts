/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemSnapshotData, AuditLog } from '../types';
import { simpleChecksum } from './backupRestoreManager';

export interface DiagnosticIssue {
  id: string;
  category: 'relational' | 'duplicate' | 'missing_data' | 'integrity';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  collection: string;
  affectedIds: string[];
  repairable: boolean;
  repairAction?: string;
}

export interface DatabaseHealthResult {
  score: number; // 0 - 100
  status: 'optimal' | 'good' | 'warning' | 'critical';
  scannedCollections: { name: string; key: string; count: number }[];
  totalRecords: number;
  issues: DiagnosticIssue[];
  timestamp: string;
}

export interface DryRunSimulationResult {
  canProceed: boolean;
  verdict: 'READY' | 'WARNING_OVERWRITE' | 'INCOMPATIBLE';
  mode: 'replace' | 'merge';
  incomingVersion: string;
  summary: {
    newRecords: number;
    updatedRecords: number;
    unchangedRecords: number;
    deletedRecords: number;
  };
  collectionDiffs: {
    key: string;
    label: string;
    currentCount: number;
    incomingCount: number;
    actionSummary: string;
  }[];
  conflicts: string[];
  warnings: string[];
}

export interface DRModuleGroup {
  id: string;
  name: string;
  description: string;
  iconName: string;
  collections: (keyof SystemSnapshotData['data'])[];
  badgeColor: string;
}

export const DR_MODULE_GROUPS: DRModuleGroup[] = [
  {
    id: 'users_structure',
    name: 'Pengguna & Struktur Lembaga',
    description: 'Data Admin, Guru, Siswa, Kelas, Halaqah, & Struktur Kepengurusan',
    iconName: 'Users',
    collections: ['admins', 'gurus', 'siswas', 'kelases', 'halaqahs', 'strukturLembaga'],
    badgeColor: 'emerald'
  },
  {
    id: 'mutabaah_setoran',
    name: 'Setoran & Mutabaah Harian',
    description: 'Riwayat setoran ziyadah, murojaah, dan murojaah berpasangan',
    iconName: 'BookOpen',
    collections: ['setorans', 'murojaahBerpasangans'],
    badgeColor: 'blue'
  },
  {
    id: 'curriculum_modul',
    name: 'Kurikulum & Modul Quran',
    description: 'Modul digital, kanvas tajwid, halaman surah, serta program keilmuan',
    iconName: 'Layers',
    collections: [
      'moduls',
      'modulPages',
      'programs',
      'programBabs',
      'programMateris',
      'programLatihans',
      'programAsesmens',
      'programAsesmenSettings',
      'programPraktikSettings',
      'programEnrollments'
    ],
    badgeColor: 'amber'
  },
  {
    id: 'assessment_syahadah',
    name: 'Penilaian & Syahadah',
    description: 'Format ujian, rekor nilai asesmen, pengajuan, sertifikat, & kaidah kelulusan',
    iconName: 'Award',
    collections: [
      'jenisAssessments',
      'templateAssessments',
      'assessmentRecords',
      'pengajuanAssessments',
      'syahadahs',
      'syahadahRules',
      'elemenSettings',
      'mataPelajarans',
      'tajwidCategories'
    ],
    badgeColor: 'purple'
  },
  {
    id: 'administration_rpp',
    name: 'Administrasi & RPP Guru',
    description: 'Capaian pembelajaran, bank aktivitas, template RPP, modul ajar, & absensi',
    iconName: 'FileSpreadsheet',
    collections: [
      'capaianPembelajarans',
      'tujuanPembelajarans',
      'bankAktivitas',
      'rppTemplates',
      'guruRppList',
      'guruAttendance',
      'studentAttendance',
      'guruSchedules',
      'rekapPresensiTemplate'
    ],
    badgeColor: 'teal'
  },
  {
    id: 'communication_logs',
    name: 'Komunikasi & Pengaturan Sistem',
    description: 'Papan pengumuman, chat obrolan, target hafalan, & log audit keamanan',
    iconName: 'ShieldAlert',
    collections: [
      'pengumumans',
      'chatMessages',
      'virtualMeetings',
      'auditLogs',
      'pwaSettings',
      'quranLinesConfig',
      'generalTargets',
      'studentTargets'
    ],
    badgeColor: 'slate'
  }
];

/**
 * Executes a comprehensive relational and integrity scan of the entire dataset
 */
export function runDatabaseHealthCheck(data: SystemSnapshotData['data']): DatabaseHealthResult {
  const issues: DiagnosticIssue[] = [];

  const siswas = Array.isArray(data.siswas) ? data.siswas : [];
  const gurus = Array.isArray(data.gurus) ? data.gurus : [];
  const admins = Array.isArray(data.admins) ? data.admins : [];
  const kelases = Array.isArray(data.kelases) ? data.kelases : [];
  const halaqahs = Array.isArray(data.halaqahs) ? data.halaqahs : [];
  const setorans = Array.isArray(data.setorans) ? data.setorans : [];
  const assessmentRecords = Array.isArray(data.assessmentRecords) ? data.assessmentRecords : [];
  const syahadahs = Array.isArray(data.syahadahs) ? data.syahadahs : [];
  const moduls = Array.isArray(data.moduls) ? data.moduls : [];

  const siswaIds = new Set(siswas.map(s => s.id));
  const guruIds = new Set([...gurus.map(g => g.id), ...admins.map(a => a.id)]);
  const halaqahIds = new Set(halaqahs.map(h => h.id));
  const kelasIds = new Set(kelases.map(k => k.id));

  // 1. Cek Siswa tanpa Halaqah atau halaqahId tidak ditemukan
  const orphanedSiswaIds: string[] = [];
  siswas.forEach(s => {
    if (!s.halaqahId || !halaqahIds.has(s.halaqahId)) {
      orphanedSiswaIds.push(s.id);
    }
  });

  if (orphanedSiswaIds.length > 0) {
    issues.push({
      id: 'issue-orphan-siswa',
      category: 'relational',
      severity: 'warning',
      title: 'Santri Tanpa Halaqah Aktif',
      description: `Ditemukan ${orphanedSiswaIds.length} santri yang tidak terhubung dengan kelompok halaqah yang valid.`,
      collection: 'siswas',
      affectedIds: orphanedSiswaIds,
      repairable: true,
      repairAction: 'Hubungkan ke Halaqah Default (Halaqah Umum / Mandiri)'
    });
  }

  // 2. Cek Halaqah tanpa Guru Pengampu
  const orphanHalaqahIds: string[] = [];
  halaqahs.forEach(h => {
    if (!h.guruPembimbingId || !guruIds.has(h.guruPembimbingId)) {
      orphanHalaqahIds.push(h.id);
    }
  });

  if (orphanHalaqahIds.length > 0) {
    issues.push({
      id: 'issue-orphan-halaqah',
      category: 'relational',
      severity: 'warning',
      title: 'Halaqah Tanpa Guru Pengampu Valid',
      description: `Ditemukan ${orphanHalaqahIds.length} halaqah dengan ID guru pengampu yang tidak terdaftar di daftar Guru/Admin.`,
      collection: 'halaqahs',
      affectedIds: orphanHalaqahIds,
      repairable: true,
      repairAction: 'Tugaskan ke Admin / Guru Aktif Pertama'
    });
  }

  // 3. Cek Setoran yang merujuk Siswa yang sudah terhapus
  const invalidSetoranIds: string[] = [];
  setorans.forEach(st => {
    if (!st.siswaId || !siswaIds.has(st.siswaId)) {
      invalidSetoranIds.push(st.id);
    }
  });

  if (invalidSetoranIds.length > 0) {
    issues.push({
      id: 'issue-orphan-setoran',
      category: 'relational',
      severity: 'warning',
      title: 'Rekor Setoran Santri Tak Bertuan (Orphan Records)',
      description: `Ditemukan ${invalidSetoranIds.length} rekor setoran mutabaah yang merujuk ke santri yang tidak ada dalam database.`,
      collection: 'setorans',
      affectedIds: invalidSetoranIds,
      repairable: true,
      repairAction: 'Arsipkan atau bersihkan rekor setoran tidak valid'
    });
  }

  // 4. Cek Rekor Asesmen Nilai yang Siswanya tidak ada
  const invalidAssessmentIds: string[] = [];
  assessmentRecords.forEach(ar => {
    if (!ar.siswaId || !siswaIds.has(ar.siswaId)) {
      invalidAssessmentIds.push(ar.id);
    }
  });

  if (invalidAssessmentIds.length > 0) {
    issues.push({
      id: 'issue-orphan-assessment',
      category: 'relational',
      severity: 'warning',
      title: 'Rekor Nilai Asesmen Tanpa Profil Santri',
      description: `Ditemukan ${invalidAssessmentIds.length} data nilai asesmen yang merujuk ke santri yang tidak ditemukan.`,
      collection: 'assessmentRecords',
      affectedIds: invalidAssessmentIds,
      repairable: true,
      repairAction: 'Tautkan kembali atau rapikan rekor nilai'
    });
  }

  // 5. Cek Syahadah tanpa Siswa
  const invalidSyahadahIds: string[] = [];
  syahadahs.forEach(sy => {
    if (!sy.siswaId || !siswaIds.has(sy.siswaId)) {
      invalidSyahadahIds.push(sy.id);
    }
  });

  if (invalidSyahadahIds.length > 0) {
    issues.push({
      id: 'issue-orphan-syahadah',
      category: 'relational',
      severity: 'info',
      title: 'Sertifikat Syahadah Tanpa Akun Santri',
      description: `Ditemukan ${invalidSyahadahIds.length} sertifikat kelulusan yang akun santrinya telah dihapus atau ID-nya berubah.`,
      collection: 'syahadahs',
      affectedIds: invalidSyahadahIds,
      repairable: false
    });
  }

  // 6. Cek Duplikasi ID di koleksi Siswa
  const seenSiswaIds = new Set<string>();
  const duplicateSiswaIds: string[] = [];
  siswas.forEach(s => {
    if (seenSiswaIds.has(s.id)) {
      duplicateSiswaIds.push(s.id);
    } else {
      seenSiswaIds.add(s.id);
    }
  });

  if (duplicateSiswaIds.length > 0) {
    issues.push({
      id: 'issue-dup-siswa',
      category: 'duplicate',
      severity: 'critical',
      title: 'Duplikasi ID Santri Terdeteksi',
      description: `Ditemukan ${duplicateSiswaIds.length} ID santri ganda yang dapat memicu anomali sinkronisasi mutabaah.`,
      collection: 'siswas',
      affectedIds: duplicateSiswaIds,
      repairable: true,
      repairAction: 'Diferensiasi ID duplikat dengan UUID unik'
    });
  }

  // 7. Cek Siswa tanpa Nama Lengkap atau NISN
  const incompleteSiswaIds: string[] = [];
  siswas.forEach(s => {
    if (!s.namaLengkap || s.namaLengkap.trim() === '') {
      incompleteSiswaIds.push(s.id);
    }
  });

  if (incompleteSiswaIds.length > 0) {
    issues.push({
      id: 'issue-incomplete-siswa',
      category: 'missing_data',
      severity: 'warning',
      title: 'Data Identitas Santri Tidak Lengkap',
      description: `Terdapat ${incompleteSiswaIds.length} santri yang tidak memiliki nama lengkap valid.`,
      collection: 'siswas',
      affectedIds: incompleteSiswaIds,
      repairable: true,
      repairAction: 'Beri nama standar [Santri - ID]'
    });
  }

  // 8. Cek Modul Quran tanpa Halaman atau Judul Kosong
  const invalidModulIds: string[] = [];
  moduls.forEach(m => {
    const title = m.judulModul || m.namaSurat;
    if (!title || title.trim() === '') {
      invalidModulIds.push(m.id);
    }
  });

  if (invalidModulIds.length > 0) {
    issues.push({
      id: 'issue-invalid-modul',
      category: 'missing_data',
      severity: 'info',
      title: 'Modul Pembelajaran Tanpa Judul Resmi',
      description: `Ditemukan ${invalidModulIds.length} modul kurikulum yang belum diberi nama modul.`,
      collection: 'moduls',
      affectedIds: invalidModulIds,
      repairable: true,
      repairAction: 'Beri nama default Modul Ajar'
    });
  }

  // Hitung Skor Integritas (100 - pinalti)
  let penalty = 0;
  issues.forEach(iss => {
    if (iss.severity === 'critical') penalty += 15;
    else if (iss.severity === 'warning') penalty += 5;
    else penalty += 2;
  });

  const score = Math.max(0, Math.min(100, 100 - penalty));

  let status: 'optimal' | 'good' | 'warning' | 'critical' = 'optimal';
  if (score >= 95) status = 'optimal';
  else if (score >= 80) status = 'good';
  else if (score >= 60) status = 'warning';
  else status = 'critical';

  const scannedCollections = [
    { name: 'Santri & Siswa', key: 'siswas', count: siswas.length },
    { name: 'Guru & Pembina', key: 'gurus', count: gurus.length },
    { name: 'Administrator', key: 'admins', count: admins.length },
    { name: 'Kelompok Halaqah', key: 'halaqahs', count: halaqahs.length },
    { name: 'Kelas Formal', key: 'kelases', count: kelases.length },
    { name: 'Rekor Setoran Hafalan', key: 'setorans', count: setorans.length },
    { name: 'Nilai Asesmen & Ujian', key: 'assessmentRecords', count: assessmentRecords.length },
    { name: 'Sertifikat Syahadah', key: 'syahadahs', count: syahadahs.length },
    { name: 'Modul Al-Qur\'an Digital', key: 'moduls', count: moduls.length }
  ];

  const totalRecords = scannedCollections.reduce((acc, curr) => acc + curr.count, 0);

  return {
    score,
    status,
    scannedCollections,
    totalRecords,
    issues,
    timestamp: new Date().toISOString()
  };
}

/**
 * Safely repairs anomalies in the dataset
 */
export function repairDatabaseAnomalies(
  data: SystemSnapshotData['data'],
  adminName: string = 'Administrator Utama'
): {
  repairedData: SystemSnapshotData['data'];
  actionsTaken: string[];
  repairedCount: number;
} {
  const actionsTaken: string[] = [];
  let repairedCount = 0;

  // Deep clone data
  const cloned = JSON.parse(JSON.stringify(data)) as SystemSnapshotData['data'];

  cloned.siswas = Array.isArray(cloned.siswas) ? cloned.siswas : [];
  cloned.gurus = Array.isArray(cloned.gurus) ? cloned.gurus : [];
  cloned.admins = Array.isArray(cloned.admins) ? cloned.admins : [];
  cloned.halaqahs = Array.isArray(cloned.halaqahs) ? cloned.halaqahs : [];
  cloned.setorans = Array.isArray(cloned.setorans) ? cloned.setorans : [];
  cloned.moduls = Array.isArray(cloned.moduls) ? cloned.moduls : [];

  const guruIds = new Set([...cloned.gurus.map(g => g.id), ...cloned.admins.map(a => a.id)]);
  const fallbackGuruId = cloned.gurus[0]?.id || cloned.admins[0]?.id || 'admin_1';

  // 1. Pastikan minimal ada 1 halaqah default jika ada santri tanpa halaqah
  let defaultHalaqah = cloned.halaqahs.find(h => 
    (h.namaHalaqah || '').toLowerCase().includes('umum') || 
    (h.namaHalaqah || '').toLowerCase().includes('mandiri')
  );
  if (!defaultHalaqah && cloned.halaqahs.length > 0) {
    defaultHalaqah = cloned.halaqahs[0];
  }

  if (!defaultHalaqah) {
    defaultHalaqah = {
      id: `halaqah_default_${Date.now()}`,
      namaHalaqah: 'Halaqah Mandiri / Bimbingan Umum',
      guruPembimbingId: fallbackGuruId,
      guruPembimbingNama: 'Pembina Tahfidz',
      kapasitasPeserta: 30,
      keterangan: 'Halaqah penampung otomatis hasil perbaikan diagnostik relasi',
      status: 'Aktif' as any,
      warnaIdentitas: '#10B981'
    };
    cloned.halaqahs.push(defaultHalaqah);
    actionsTaken.push('Membuat Halaqah Penampung Otomatis: "Halaqah Mandiri / Bimbingan Umum".');
    repairedCount++;
  }

  const halaqahIds = new Set(cloned.halaqahs.map(h => h.id));

  // 2. Perbaiki santri tanpa halaqah
  let fixedOrphanSiswa = 0;
  cloned.siswas.forEach(s => {
    if (!s.halaqahId || !halaqahIds.has(s.halaqahId)) {
      s.halaqahId = defaultHalaqah!.id;
      fixedOrphanSiswa++;
    }
  });

  if (fixedOrphanSiswa > 0) {
    actionsTaken.push(`Mengaitkan ${fixedOrphanSiswa} santri yatim ke "${defaultHalaqah.namaHalaqah}".`);
    repairedCount += fixedOrphanSiswa;
  }

  // 3. Perbaiki halaqah tanpa guru
  let fixedHalaqahGuru = 0;
  cloned.halaqahs.forEach(h => {
    if (!h.guruPembimbingId || !guruIds.has(h.guruPembimbingId)) {
      h.guruPembimbingId = fallbackGuruId;
      h.guruPembimbingNama = cloned.gurus.find(g => g.id === fallbackGuruId)?.namaLengkap || 'Pembina Tahfidz';
      fixedHalaqahGuru++;
    }
  });

  if (fixedHalaqahGuru > 0) {
    actionsTaken.push(`Menugaskan guru pembina default ke ${fixedHalaqahGuru} halaqah.`);
    repairedCount += fixedHalaqahGuru;
  }

  // 4. Perbaiki santri tanpa nama
  let fixedNames = 0;
  cloned.siswas.forEach((s, idx) => {
    if (!s.namaLengkap || s.namaLengkap.trim() === '') {
      s.namaLengkap = `Santri Bina ${idx + 1}`;
      fixedNames++;
    }
  });

  if (fixedNames > 0) {
    actionsTaken.push(`Melengkapi identitas nama pada ${fixedNames} santri.`);
    repairedCount += fixedNames;
  }

  // 5. Perbaiki modul tanpa nama
  let fixedModul = 0;
  cloned.moduls.forEach((m, idx) => {
    const title = m.judulModul || m.namaSurat;
    if (!title || title.trim() === '') {
      m.judulModul = `Modul Materi Pembelajaran ${idx + 1}`;
      fixedModul++;
    }
  });

  if (fixedModul > 0) {
    actionsTaken.push(`Memperbarui judul standar pada ${fixedModul} modul kurikulum.`);
    repairedCount += fixedModul;
  }

  // 6. Tangani duplikasi ID santri
  const seenIds = new Set<string>();
  let fixedDuplicates = 0;
  cloned.siswas.forEach((s, idx) => {
    if (seenIds.has(s.id)) {
      s.id = `${s.id}_dup_${idx}_${Date.now().toString().slice(-4)}`;
      fixedDuplicates++;
    } else {
      seenIds.add(s.id);
    }
  });

  if (fixedDuplicates > 0) {
    actionsTaken.push(`Meresolusi ${fixedDuplicates} ID santri duplikat dengan identifier unik.`);
    repairedCount += fixedDuplicates;
  }

  if (actionsTaken.length === 0) {
    actionsTaken.push('Integritas database sudah sempurna. Tidak ada anomali yang perlu diperbaiki.');
  }

  return {
    repairedData: cloned,
    actionsTaken,
    repairedCount
  };
}

/**
 * Runs a Dry Run Simulation of restoring a snapshot against current active data
 */
export function simulateDryRunRestore(
  incomingSnapshot: SystemSnapshotData,
  currentData: SystemSnapshotData['data'],
  mode: 'replace' | 'merge'
): DryRunSimulationResult {
  const incomingData = incomingSnapshot.data || {};
  const conflicts: string[] = [];
  const warnings: string[] = [];

  let newRecords = 0;
  let updatedRecords = 0;
  let unchangedRecords = 0;
  let deletedRecords = 0;

  const collectionDiffs: {
    key: string;
    label: string;
    currentCount: number;
    incomingCount: number;
    actionSummary: string;
  }[] = [];

  // Key collections to inspect
  const inspectKeys: { key: keyof SystemSnapshotData['data']; label: string }[] = [
    { key: 'admins', label: 'Administrator' },
    { key: 'gurus', label: 'Guru & Ustadz' },
    { key: 'siswas', label: 'Santri' },
    { key: 'kelases', label: 'Kelas' },
    { key: 'halaqahs', label: 'Halaqah' },
    { key: 'setorans', label: 'Rekor Setoran' },
    { key: 'moduls', label: 'Modul Al-Qur\'an' },
    { key: 'assessmentRecords', label: 'Nilai Asesmen' },
    { key: 'syahadahs', label: 'Sertifikat Syahadah' },
    { key: 'programs', label: 'Program Keilmuan' },
    { key: 'guruRppList', label: 'Dokumen RPP Guru' }
  ];

  for (const { key, label } of inspectKeys) {
    const currArr = Array.isArray(currentData[key]) ? (currentData[key] as any[]) : [];
    const incArr = Array.isArray(incomingData[key]) ? (incomingData[key] as any[]) : [];

    const currMap = new Map<string, any>(currArr.map(item => [item.id || '', item]));
    const incMap = new Map<string, any>(incArr.map(item => [item.id || '', item]));

    let collNew = 0;
    let collUpdated = 0;
    let collUnchanged = 0;
    let collDeleted = 0;

    if (mode === 'replace') {
      // In replace mode, any record in current not in incoming is considered deleted
      for (const [id] of currMap) {
        if (!incMap.has(id)) {
          collDeleted++;
        }
      }
      deletedRecords += collDeleted;
    }

    for (const [id, incItem] of incMap) {
      if (!currMap.has(id)) {
        collNew++;
      } else {
        const currItem = currMap.get(id);
        const currHash = simpleChecksum(JSON.stringify(currItem));
        const incHash = simpleChecksum(JSON.stringify(incItem));
        if (currHash === incHash) {
          collUnchanged++;
        } else {
          collUpdated++;
        }
      }
    }

    newRecords += collNew;
    updatedRecords += collUpdated;
    unchangedRecords += collUnchanged;

    let summaryText = '';
    if (mode === 'replace') {
      summaryText = `+${collNew} baru, ~${collUpdated} ditimpa, -${collDeleted} dihapus`;
    } else {
      summaryText = `+${collNew} baru, ~${collUpdated} diperbarui, ${collUnchanged} tetap`;
    }

    collectionDiffs.push({
      key,
      label,
      currentCount: currArr.length,
      incomingCount: incArr.length,
      actionSummary: summaryText
    });
  }

  // Conflict and risk checks
  if (mode === 'replace' && deletedRecords > 50) {
    warnings.push(`Mode Timpa Menyeluruh akan menghapus ${deletedRecords} data yang saat ini aktif di sistem.`);
  }

  if (newRecords === 0 && updatedRecords === 0) {
    warnings.push('Semua rekor data pada berkas cadangan identik dengan database saat ini (tidak ada perubahan data).');
  }

  const incomingAdminCount = Array.isArray(incomingData.admins) ? incomingData.admins.length : 0;
  if (incomingAdminCount === 0 && mode === 'replace') {
    conflicts.push('PERINGATAN KRITIS: Berkas cadangan tidak memiliki akun Administrator. Memulihkan dengan mode timpa dapat mengunci akses sistem.');
  }

  let verdict: 'READY' | 'WARNING_OVERWRITE' | 'INCOMPATIBLE' = 'READY';
  if (conflicts.length > 0) {
    verdict = 'INCOMPATIBLE';
  } else if (warnings.length > 0 || updatedRecords > 0 || deletedRecords > 0) {
    verdict = 'WARNING_OVERWRITE';
  }

  return {
    canProceed: conflicts.length === 0,
    verdict,
    mode,
    incomingVersion: incomingSnapshot.metadata?.version || 'v1.0',
    summary: {
      newRecords,
      updatedRecords,
      unchangedRecords,
      deletedRecords
    },
    collectionDiffs,
    conflicts,
    warnings
  };
}

/**
 * Creates a selective modular snapshot containing only chosen modules
 */
export function createSelectiveSnapshot(
  fullSnapshot: SystemSnapshotData,
  selectedModuleGroupIds: string[]
): SystemSnapshotData {
  const selectedKeys = new Set<keyof SystemSnapshotData['data']>();
  
  DR_MODULE_GROUPS.forEach(group => {
    if (selectedModuleGroupIds.includes(group.id)) {
      group.collections.forEach(k => selectedKeys.add(k));
    }
  });

  const partialData: SystemSnapshotData['data'] = {};
  selectedKeys.forEach(k => {
    if (fullSnapshot.data[k] !== undefined) {
      partialData[k] = JSON.parse(JSON.stringify(fullSnapshot.data[k]));
    }
  });

  // Calculate selective total records
  let selectiveTotal = 0;
  Object.values(partialData).forEach(val => {
    if (Array.isArray(val)) selectiveTotal += val.length;
    else if (val && typeof val === 'object') selectiveTotal += Object.keys(val).length;
  });

  const selectedNames = DR_MODULE_GROUPS
    .filter(g => selectedModuleGroupIds.includes(g.id))
    .map(g => g.name)
    .join(', ');

  const selectiveMeta = {
    ...fullSnapshot.metadata,
    version: `${fullSnapshot.metadata.version}-MODULAR`,
    notes: `Ekspor Selektif Modul: ${selectedNames}. ${fullSnapshot.metadata.notes || ''}`.trim(),
    totalRecords: selectiveTotal,
    timestamp: new Date().toISOString()
  };


  return {
    metadata: selectiveMeta,
    data: partialData
  };
}

export interface DRAuditEvent {
  id: string;
  timestamp: string;
  action: 'backup_export' | 'backup_restore' | 'cloud_save' | 'cloud_restore' | 'drive_upload' | 'drive_restore' | 'auto_repair' | 'dry_run_drill' | 'selective_export' | 'selective_restore';
  actionLabel: string;
  actor: string;
  version: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  recordCount: number;
  details: string;
  checksum?: string;
}

const DR_AUDIT_STORAGE_KEY = 'mh_dr_audit_trail';

/**
 * Records a Disaster Recovery event to the persistent audit trail
 */
export function recordDRAuditEvent(event: Omit<DRAuditEvent, 'id' | 'timestamp'>): DRAuditEvent {
  const fullEvent: DRAuditEvent = {
    ...event,
    id: `dr_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getDRAuditEvents();
      // Keep up to 100 recent DR audit events
      const updated = [fullEvent, ...existing].slice(0, 100);
      localStorage.setItem(DR_AUDIT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to record DR audit event:', e);
    }
  }

  return fullEvent;
}

/**
 * Retrieves the DR audit events
 */
export function getDRAuditEvents(): DRAuditEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DR_AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to get DR audit events:', e);
  }
  return [];
}

/**
 * Downloads a structured text report of Disaster Recovery activities
 */
export function downloadDRAuditReport(events: DRAuditEvent[]): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { dateStyle: 'full' });
  const timeStr = now.toLocaleTimeString('id-ID');

  let report = `========================================================================\n`;
  report += `   LAPORAN AUDIT PEMULIHAN BENCANA & CADANGAN DATA (DR AUDIT TRAIL)    \n`;
  report += `   PORTAL MANAJEMEN HALAQAH TAHFIDZ AL-QUR'AN                          \n`;
  report += `========================================================================\n\n`;
  report += `Tanggal Cetak   : ${dateStr}, Pukul ${timeStr} WIB\n`;
  report += `Total Peristiwa : ${events.length} Catatan Operasi\n`;
  report += `Penanggung Jawab: Administrator Utama (Super Admin)\n\n`;
  report += `------------------------------------------------------------------------\n`;
  report += `RIWAYAT PERISTIWA:\n`;
  report += `------------------------------------------------------------------------\n\n`;

  events.forEach((ev, idx) => {
    const evDate = new Date(ev.timestamp).toLocaleString('id-ID');
    report += `[#${idx + 1}] ${evDate}\n`;
    report += `    Tindakan  : [${ev.actionLabel}] - Status: ${ev.status}\n`;
    report += `    Operator  : ${ev.actor}\n`;
    report += `    Versi Data: ${ev.version} (${ev.recordCount} Rekor Data)\n`;
    if (ev.checksum) report += `    Checksum  : ${ev.checksum}\n`;
    report += `    Keterangan: ${ev.details}\n\n`;
  });

  report += `========================================================================\n`;
  report += `Dokumen ini digenerate secara otomatis oleh Disaster Recovery Engine.\n`;
  report += `========================================================================\n`;

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Audit_Disaster_Recovery_${now.toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

