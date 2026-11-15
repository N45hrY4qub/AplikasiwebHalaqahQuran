/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Siswa, Halaqah, Setoran, JadwalMengajarGuru, StatusAktif } from '../types';

export const INDONESIAN_DAY_NAMES = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
export type IndonesianDayName = typeof INDONESIAN_DAY_NAMES[number];

export const INDONESIAN_MONTH_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
] as const;

export const DAY_ALIASES_MAP: Record<string, number> = {
  'ahad': 0, 'minggu': 0, 'sunday': 0,
  'senin': 1, 'monday': 1,
  'selasa': 2, 'tuesday': 2,
  'rabu': 3, 'wednesday': 3,
  'kamis': 4, 'thursday': 4,
  'jumat': 5, "jum'at": 5, 'jumaat': 5, 'friday': 5,
  'sabtu': 6, 'saturday': 6
};

export const normalizeHalaqahKey = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^halaqah\s+/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\bash[- ]?shidd?iq\b/g, 'shiddiq')
    .replace(/\bas[- ]?sidd?iq\b/g, 'shiddiq')
    .replace(/\bshidiq\b/g, 'shiddiq')
    .replace(/\bsiddiq\b/g, 'shiddiq')
    .replace(/\s+/g, ' ')
    .trim();
};

export const normalizeTeacherName = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^ustadz(ah)?\b/i, '')
    .replace(/^ust\.?\b/i, '')
    .replace(/,\s*(s\.pd|s\.ag|lc|m\.pd|s\.e|s\.si|m\.si|m\.ag|ph\.d|dr\.?)\b/gi, '')
    .replace(/\b(s\.pd|s\.ag|lc|m\.pd|s\.e|s\.si|m\.si|m\.ag)\b/gi, '')
    .replace(/[-_.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Checks whether a halaqah belongs to or is assigned to the teacher.
 * Handles:
 * 1. halaqah.guruPembimbingId matching teacher's user ID or guru record ID
 * 2. halaqah.guruPembimbingNama matching teacher's clean name (with or without titles)
 * 3. Guru record halaqahBimbinganId, halaqahBimbinganNama, or bimbinganHalaqahIds
 * 4. Active assignment in Admin's Jadwal Mengajar Guru (guruSchedules)
 */
export const isHalaqahBelongingToTeacher = (
  halaqah: Halaqah | undefined | null,
  user: any,
  gurus: any[] = [],
  guruSchedules: JadwalMengajarGuru[] = [],
  siswas: any[] = []
): boolean => {
  if (!halaqah || !user) return false;

  const teacherUserId = user.id || '';
  const cleanUserName = normalizeTeacherName(user.namaLengkap);

  // 1. Matched Guru Object in gurus array
  const guruObj = (gurus || []).find(g => {
    if (!g) return false;
    if (teacherUserId && (g.id === teacherUserId || g.userId === teacherUserId)) return true;
    if (user.email && g.email && g.email.toLowerCase() === user.email.toLowerCase()) return true;
    if (cleanUserName && g.namaLengkap && normalizeTeacherName(g.namaLengkap) === cleanUserName) return true;
    return false;
  });

  const teacherIds = new Set<string>();
  if (teacherUserId) teacherIds.add(teacherUserId);
  if (guruObj?.id) teacherIds.add(guruObj.id);
  if (user.guruId) teacherIds.add(user.guruId);
  if (user.email) teacherIds.add(user.email.toLowerCase());
  if (guruObj?.email) teacherIds.add(guruObj.email.toLowerCase());

  // Include primary coordinator system IDs if matched
  const isPrimaryCoordinator =
    teacherUserId === 'gru-koordinator' ||
    teacherUserId === 'adm-1';

  if (isPrimaryCoordinator) {
    teacherIds.add('gru-koordinator');
    teacherIds.add('adm-1');
    teacherIds.add('g1');
  }

  // 2. Direct ID match
  if (halaqah.guruPembimbingId && (teacherIds.has(halaqah.guruPembimbingId) || halaqah.guruPembimbingId === teacherUserId)) {
    return true;
  }

  // 3. Name match with halaqah.guruPembimbingNama
  if (halaqah.guruPembimbingNama && cleanUserName) {
    const cleanHalaqahGuruNama = normalizeTeacherName(halaqah.guruPembimbingNama);
    if (cleanHalaqahGuruNama === cleanUserName) return true;
    if (cleanHalaqahGuruNama && cleanUserName && (cleanHalaqahGuruNama.includes(cleanUserName) || cleanUserName.includes(cleanHalaqahGuruNama))) {
      return true;
    }
    // Partial word match (e.g. "Ahmad", "Fatimah")
    const userWords = cleanUserName.split(/\s+/).filter(w => w.length > 2);
    const halGuruWords = cleanHalaqahGuruNama.split(/\s+/).filter(w => w.length > 2);
    if (userWords.some(w => halGuruWords.includes(w))) {
      return true;
    }
  }

  // 4. Guru profile direct halaqah link
  if (guruObj) {
    if (guruObj.halaqahBimbinganId && (guruObj.halaqahBimbinganId === halaqah.id || guruObj.halaqahBimbinganId === halaqah.namaHalaqah)) {
      return true;
    }
    if (guruObj.halaqahBimbinganNama && normalizeHalaqahKey(guruObj.halaqahBimbinganNama) === normalizeHalaqahKey(halaqah.namaHalaqah)) {
      return true;
    }
    if (Array.isArray(guruObj.bimbinganHalaqahIds) && (guruObj.bimbinganHalaqahIds.includes(halaqah.id) || guruObj.bimbinganHalaqahIds.includes(halaqah.namaHalaqah))) {
      return true;
    }
  }

  // User object direct halaqah link
  if (user.halaqahBimbinganId && (user.halaqahBimbinganId === halaqah.id || user.halaqahBimbinganId === halaqah.namaHalaqah)) {
    return true;
  }
  if (user.halaqahBimbinganNama && normalizeHalaqahKey(user.halaqahBimbinganNama) === normalizeHalaqahKey(halaqah.namaHalaqah)) {
    return true;
  }

  const halKey = normalizeHalaqahKey(halaqah.namaHalaqah);

  // 5. Admin's Jadwal Mengajar Guru (guruSchedules)
  if (Array.isArray(guruSchedules) && guruSchedules.length > 0) {
    const hasActiveSchedule = guruSchedules.some(s => {
      if (!s) return false;
      // Active unless explicitly set to non-active
      const isInactive = s.status && (
        s.status === StatusAktif.NON_AKTIF || 
        (s.status as string).toLowerCase() === 'non-aktif' || 
        (s.status as string).toLowerCase() === 'nonaktif'
      );
      if (isInactive) return false;

      const sGuruClean = normalizeTeacherName(s.guruNama || '');
      const matchTeacher = 
        (s.guruId && teacherIds.has(s.guruId)) ||
        (sGuruClean && cleanUserName && (
          sGuruClean === cleanUserName ||
          sGuruClean.includes(cleanUserName) ||
          cleanUserName.includes(sGuruClean)
        ));

      if (!matchTeacher) return false;

      const sHalClean = normalizeHalaqahKey(s.halaqahNama || '');
      const matchHalaqahId = Boolean(s.halaqahId && s.halaqahId === halaqah.id);
      const matchHalaqahNama = Boolean(
        sHalClean && halKey && (
          sHalClean === halKey ||
          sHalClean.includes(halKey) ||
          halKey.includes(sHalClean)
        )
      );
      const matchHalaqahInText = Boolean(
        halKey && (
          (s.materi && s.materi.toLowerCase().includes(halKey)) ||
          (s.catatan && s.catatan.toLowerCase().includes(halKey)) ||
          (s.hari && halKey.includes(s.hari.toLowerCase()))
        )
      );

      return matchHalaqahId || matchHalaqahNama || matchHalaqahInText;
    });

    if (hasActiveSchedule) return true;
  }

  // 6. Currently selected or stored in localStorage for THIS specific teacher
  try {
    const userStoredHalaqahId = typeof window !== 'undefined' ? localStorage.getItem(`mh_selected_guru_halaqah_id_${teacherUserId}`) : null;
    const lastUsedHalaqahId = typeof window !== 'undefined' ? localStorage.getItem(`mh_last_used_halaqah_${teacherUserId}`) : null;
    if (userStoredHalaqahId && (
      halaqah.id === userStoredHalaqahId || 
      halaqah.namaHalaqah === userStoredHalaqahId ||
      normalizeHalaqahKey(halaqah.namaHalaqah) === normalizeHalaqahKey(userStoredHalaqahId)
    )) {
      return true;
    }
    if (lastUsedHalaqahId && (
      halaqah.id === lastUsedHalaqahId || 
      halaqah.namaHalaqah === lastUsedHalaqahId ||
      normalizeHalaqahKey(halaqah.namaHalaqah) === normalizeHalaqahKey(lastUsedHalaqahId)
    )) {
      return true;
    }
  } catch {}

  // 7. Santri (Siswas) assignment link
  if (Array.isArray(siswas) && siswas.length > 0) {
    const hasStudentUnderTeacher = siswas.some(s => {
      if (!s) return false;
      const matchHal = s.halaqahId === halaqah.id || (s.halaqahNama && halKey && normalizeHalaqahKey(s.halaqahNama) === halKey);
      if (!matchHal) return false;
      const matchGuru = (s.guruId && teacherIds.has(s.guruId)) || 
        (s.guruNama && cleanUserName && normalizeTeacherName(s.guruNama).includes(cleanUserName));
      return matchGuru;
    });
    if (hasStudentUnderTeacher) return true;
  }

  // 8. Private halaqah created by this teacher
  if (halaqah.sourceType === 'private_halaqah') {
    if (halaqah.guruPembimbingId && teacherIds.has(halaqah.guruPembimbingId)) return true;
    if (halaqah.guruPembimbingNama && cleanUserName && normalizeTeacherName(halaqah.guruPembimbingNama).includes(cleanUserName)) return true;
  }

  return false;
};

/**
 * Returns all halaqahs belonging to or assigned to the specified teacher.
 */
export const getTeacherHalaqahs = (
  halaqahs: Halaqah[] = [],
  user: any,
  gurus: any[] = [],
  guruSchedules: JadwalMengajarGuru[] = [],
  siswas: any[] = [],
  strukturLembaga?: any
): Halaqah[] => {
  if (!user) return [];
  const combinedHalaqahs: Halaqah[] = [...(Array.isArray(halaqahs) ? halaqahs : [])];

  // Merge any registered halaqah from strukturLembaga.jenjangList if not yet present in halaqahs array
  if (strukturLembaga && Array.isArray(strukturLembaga.jenjangList)) {
    strukturLembaga.jenjangList.forEach((jj: any) => {
      if (!jj || !jj.nama) return;
      const already = combinedHalaqahs.some(h => 
        h.id === jj.id || 
        (normalizeHalaqahKey(h.namaHalaqah) === normalizeHalaqahKey(jj.nama))
      );
      if (!already) {
        const sch = (strukturLembaga.sekolahList || []).find((s: any) => s.id === jj.sekolahId);
        combinedHalaqahs.push({
          id: jj.id,
          namaHalaqah: jj.nama,
          guruPembimbingNama: jj.namaKepalaSekolah || '',
          guruPembimbingId: '',
          kapasitasPeserta: 10,
          keterangan: `Halaqah resmi ${sch?.nama || 'Sistem Halaqah Al-Quran'}`,
          status: StatusAktif.AKTIF,
          warnaIdentitas: '#10B981',
          sekolahId: jj.sekolahId || '',
          sekolahNama: sch?.nama || '',
          jenjangId: jj.id,
          jenjangNama: jj.nama,
          sourceType: 'foundation'
        } as Halaqah);
      }
    });
  }

  return combinedHalaqahs.filter(h => isHalaqahBelongingToTeacher(h, user, gurus, guruSchedules, siswas));
};

/**
 * Retrieves active schedules configured by admin in Admin > HALAQAH > Jadwal Mengajar Guru
 * that apply to the given halaqah (or teacher's halaqah).
 */
export const getActiveSchedulesForHalaqah = (
  halaqah: Halaqah | undefined | null,
  guruSchedules: JadwalMengajarGuru[] = [],
  teacherId?: string,
  teacherName?: string
): JadwalMengajarGuru[] => {
  if (!guruSchedules || guruSchedules.length === 0) return [];

  const halId = halaqah?.id || '';
  const halKey = normalizeHalaqahKey(halaqah?.namaHalaqah);
  const targetTeacherId = teacherId || halaqah?.guruPembimbingId || '';
  const cleanTeacherName = normalizeTeacherName(teacherName || (halaqah as any)?.guruPembimbingNama || '');

  // 1. If halaqah is specified, ONLY return active schedules explicitly assigned to this halaqah
  if (halId || halKey) {
    return (guruSchedules || []).filter(s => {
      if (!s || s.status !== StatusAktif.AKTIF) return false;

      // Must explicitly match halaqah ID or halaqah Nama
      const matchHalaqahId = Boolean(halId && s.halaqahId && s.halaqahId === halId);
      const matchHalaqahNama = Boolean(halKey && s.halaqahNama && normalizeHalaqahKey(s.halaqahNama) === halKey);

      if (!matchHalaqahId && !matchHalaqahNama) {
        return false;
      }

      // If teacher is specified, ensure schedule doesn't belong to a different teacher
      if (targetTeacherId || cleanTeacherName) {
        const sTeacherId = s.guruId || '';
        const sTeacherName = normalizeTeacherName(s.guruNama || '');
        
        if (sTeacherId && targetTeacherId && sTeacherId !== targetTeacherId && sTeacherId !== 'gru-koordinator' && sTeacherId !== 'g1') {
          return false;
        }
        if (sTeacherName && cleanTeacherName && sTeacherName !== cleanTeacherName && !sTeacherName.includes(cleanTeacherName) && !cleanTeacherName.includes(sTeacherName)) {
          return false;
        }
      }

      return true;
    });
  }

  // 2. If NO halaqah is specified at all, filter by teacher
  if (targetTeacherId || cleanTeacherName) {
    return (guruSchedules || []).filter(s => {
      if (!s || s.status !== StatusAktif.AKTIF) return false;
      const matchId = targetTeacherId && s.guruId && (s.guruId === targetTeacherId || s.guruId === 'gru-koordinator' || s.guruId === 'g1');
      const sClean = normalizeTeacherName(s.guruNama || '');
      const matchName = cleanTeacherName && sClean && (sClean === cleanTeacherName || sClean.includes(cleanTeacherName) || cleanTeacherName.includes(sClean));
      return matchId || matchName;
    });
  }

  return [];
};

/**
 * Checks if a halaqah has a schedule on a specific day of week index (0 = Ahad, 1 = Senin, ... 6 = Sabtu).
 * Rules:
 * 1. Admin's Jadwal Mengajar Guru (`guruSchedules`) is the PRIMARY authoritative source.
 *    If active schedules are configured in `guruSchedules` for this halaqah (or teacher),
 *    THOSE schedules are strictly used and NO fallback is evaluated.
 * 2. Fallback to `halaqah.hariKegiatan` / text schedule is ONLY evaluated when ZERO schedules
 *    are configured in Admin's Jadwal Mengajar Guru.
 */
export const isHalaqahScheduledOnDayIndex = (
  halaqah: Halaqah | undefined | null,
  dayIndex: number,
  guruSchedules: JadwalMengajarGuru[] = [],
  teacherId?: string,
  teacherName?: string
): boolean => {
  if (!halaqah && !teacherId) return false;

  // 1. Check Admin's Jadwal Mengajar Guru (`guruSchedules`)
  const activeSchedules = getActiveSchedulesForHalaqah(halaqah, guruSchedules, teacherId, teacherName);

  if (activeSchedules.length > 0) {
    const targetDayName = INDONESIAN_DAY_NAMES[dayIndex];
    return activeSchedules.some(s => (s.hari || '').toLowerCase() === targetDayName.toLowerCase());
  }

  // 2. Fallback ONLY if there are NO active schedules configured in Admin > HALAQAH > Jadwal Mengajar Guru
  if (halaqah) {
    const rawSchedule = [
      halaqah.hariKegiatan,
      (halaqah as any).jadwal,
      (halaqah as any).jadwalKegiatan,
      (halaqah as any).keterangan
    ].filter(Boolean).join(' ').toLowerCase();

    if (rawSchedule) {
      if (rawSchedule.includes('belum diatur') || rawSchedule.includes('tidak diatur') || rawSchedule.includes('belum ada') || rawSchedule.includes('libur') || rawSchedule.includes('non-aktif') || rawSchedule.includes('off') || rawSchedule.includes('tidak ada jadwal')) {
        return false;
      }
      if (rawSchedule.includes('setiap hari') || rawSchedule.includes('harian') || rawSchedule.includes('tiap hari') || rawSchedule.includes('semua hari')) {
        return true;
      }

      // Check specific day occurrence
      const targetDayName = INDONESIAN_DAY_NAMES[dayIndex];
      const dayWord = targetDayName.toLowerCase();
      if (rawSchedule.includes(dayWord)) {
        return true;
      }
      if (dayWord === 'ahad' && rawSchedule.includes('minggu')) {
        return true;
      }
    }
  }

  return false;
};

export interface StudentAttendanceStatusResult {
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Belum Ada Keterangan' | 'Libur' | 'Mendatang' | 'Belum Dimulai';
  code: 'H' | 'S' | 'I' | 'A' | 'L' | '?' | '-' | '•';
  type: 'setoran' | 'sakit' | 'izin' | 'alpha' | 'libur' | 'unrecorded' | 'off' | 'future' | 'not_started';
  label: string;
  catatan?: string;
  setoranCount?: number;
  badgeClass: string;
  guruStatus?: string;
}

/**
 * Computes accurate attendance status for a student on a specific date.
 * Hierarchy:
 * 1. Guru Attendance: If guru is marked Izin, Sakit, or Alpha on a scheduled day -> Halaqah is Libur (Code "L").
 * 2. Teacher Record: If guru explicitly recorded Sakit, Izin, Alpha, or Hadir for student in Absensi Halaqah -> matches teacher's record.
 * 3. Automatic Setoran: If student submitted setoran on scheduled date -> automatically Hadir (Code "H").
 * 4. Activity Check: If halaqah learning session has NOT started yet (no student setoran, no attendance recorded, guru not marked Hadir) -> Belum Ada Kegiatan (Code "-").
 * 5. Fallback: If session held but student absent -> Alpha (Code "A"). Future dates -> Belum Dimulai (Code "-"). Non-scheduled -> Bukan Jadwal ("-").
 */
/**
 * Finds the applicable guruAttendance record for a specific halaqah on a given date (or list of date strings).
 * Strict Halaqah Scoping Rules:
 * 1. If a record specifies a halaqahId (or non-empty halaqahNama), it ONLY applies to THAT halaqah.
 *    It will NEVER leak or turn another halaqah taught by the same teacher into Libur (L).
 * 2. Halaqah-specific records ALWAYS take precedence over global records (!att.halaqahId && !att.halaqahNama)
 *    for the same teacher & date.
 * 3. Global records (without halaqahId/halaqahNama or halaqahId === 'all') apply only when no halaqah-specific
 *    record exists for this halaqah.
 */
export const findMatchingGuruAttendanceRecord = (
  guruAttendance: any[] = [],
  dateOrDates: string | string[],
  options: {
    teacherId?: string;
    teacherName?: string;
    halaqahId?: string;
    halaqahName?: string;
  }
): any | null => {
  if (!Array.isArray(guruAttendance) || guruAttendance.length === 0) return null;
  const dateSet = new Set(
    (Array.isArray(dateOrDates) ? dateOrDates : [dateOrDates]).filter(Boolean)
  );
  if (dateSet.size === 0) return null;

  const targetTeacherId = (options.teacherId || '').trim();
  const targetTeacherName = (options.teacherName || '').toLowerCase().trim();
  const targetTeacherNorm = normalizeTeacherName(options.teacherName);
  const targetHalaqahId = (options.halaqahId || '').trim();
  const targetHalaqahKey = normalizeHalaqahKey(options.halaqahName);

  const isTeacherMatch = (att: any): boolean => {
    if (targetTeacherId && att.guruId && att.guruId === targetTeacherId) return true;
    if (att.guruNama) {
      const attLower = String(att.guruNama).toLowerCase().trim();
      if (targetTeacherName && attLower === targetTeacherName) return true;
      const attNorm = normalizeTeacherName(att.guruNama);
      if (targetTeacherNorm && attNorm && attNorm === targetTeacherNorm) return true;
    }
    return false;
  };

  const getRecordHalaqahScope = (att: any) => {
    const rawHId = (att.halaqahId || '').trim();
    const isAllKeyword = rawHId.toLowerCase() === 'all' || rawHId.toLowerCase() === 'semua';
    const recHalaqahId = isAllKeyword ? '' : rawHId;
    const rawHName = (att.halaqahNama || '').trim();
    const isAllName = rawHName.toLowerCase().startsWith('semua halaqah');
    const recHalaqahKey = isAllName ? '' : normalizeHalaqahKey(rawHName);
    const isScoped = Boolean(recHalaqahId || recHalaqahKey);
    return { recHalaqahId, recHalaqahKey, isScoped };
  };

  const candidateRecords = guruAttendance.filter((att: any) => {
    if (!att || !att.tanggal || !dateSet.has(att.tanggal)) return false;
    if (att.siswaId && !att.guruId) return false;
    return true;
  });

  if (candidateRecords.length === 0) return null;

  // Tier 1: Halaqah-specific match (highest priority)
  if (targetHalaqahId || targetHalaqahKey) {
    const specificMatch = candidateRecords.find((att: any) => {
      const { recHalaqahId, recHalaqahKey, isScoped } = getRecordHalaqahScope(att);
      if (!isScoped) return false;
      const matchesHId = Boolean(targetHalaqahId && recHalaqahId && targetHalaqahId === recHalaqahId);
      const matchesHName = Boolean(targetHalaqahKey && recHalaqahKey && targetHalaqahKey === recHalaqahKey);
      if (!matchesHId && !matchesHName) return false;
      return isTeacherMatch(att) || matchesHId;
    });
    if (specificMatch) return specificMatch;
  }

  // Tier 2: Global / unscoped record for this teacher (never leak a specific halaqah record to a different halaqah)
  const globalMatch = candidateRecords.find((att: any) => {
    const { isScoped } = getRecordHalaqahScope(att);
    if (isScoped) {
      if (!targetHalaqahId && !targetHalaqahKey) {
        return isTeacherMatch(att);
      }
      return false;
    }
    return isTeacherMatch(att);
  });

  return globalMatch || null;
};

/**
 * Identifies teacher attendance records that were self-submitted from a teacher's own account
 * (via the deprecated Presensi Cepat or Catat Presensi / Keterangan features) rather than entered/approved by Admin.
 */
export const isGuruSelfSubmittedAttendance = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false;
  const id = String(item.id || '').trim();
  const catatan = String(item.catatan || '').trim().toLowerCase();

  if (
    catatan.startsWith('presensi mandiri hadir bimbingan halaqah') ||
    catatan.startsWith('presensi dicatat oleh guru')
  ) {
    return true;
  }

  // Legacy teacher self-attendance IDs used format: att-guru-YYYY-MM-DD-...
  // Admin entries use att-guru-${Date.now()} (digits only).
  if (/^att-guru-\d{4}-\d{2}-\d{2}-/.test(id)) {
    const updatedByNorm = normalizeTeacherName(item.updatedByAdminNama);
    const guruNameNorm = normalizeTeacherName(item.guruNama);
    if (!updatedByNorm || !guruNameNorm || updatedByNorm === guruNameNorm) {
      return true;
    }
  }

  return false;
};

export const getStudentAttendanceForDate = (
  student: Siswa,
  dateStr: string,
  setorans: Setoran[] = [],
  studentAttendance: any[] = [],
  isScheduled: boolean = true,
  todayStr: string = new Date().toISOString().split('T')[0],
  guruAttendance: any[] = [],
  halaqah?: Halaqah | null,
  teacherId?: string,
  teacherName?: string,
  allStudents: Siswa[] = []
): StudentAttendanceStatusResult => {
  // 1. Check if the halaqah's teacher is recorded as Izin, Sakit, or Alpha on this date (strictly scoped by halaqah)
  const targetTeacherId = teacherId || halaqah?.guruPembimbingId || '';
  const targetTeacherName = (teacherName || (halaqah as any)?.guruPembimbingNama || '').toLowerCase().trim();
  const targetHalaqahId = halaqah?.id || student.halaqahId || '';
  const targetHalaqahName = (halaqah?.namaHalaqah || student.halaqahNama || '').trim();
  const halKey = normalizeHalaqahKey(targetHalaqahName);

  const teacherRecord = findMatchingGuruAttendanceRecord(guruAttendance, dateStr, {
    teacherId: targetTeacherId,
    teacherName: targetTeacherName,
    halaqahId: targetHalaqahId,
    halaqahName: targetHalaqahName
  });

  if (teacherRecord && isScheduled) {
    const rawGuruStatus = (teacherRecord.status || '').trim();
    const gLower = rawGuruStatus.toLowerCase();
    const isGuruExcusedOrAbsent = (
      gLower === 'izin' || 
      gLower === 'sakit' || 
      gLower === 'alpha' || 
      gLower === 'alpa' || 
      gLower === 'tanpa keterangan'
    );

    if (isGuruExcusedOrAbsent) {
      return {
        status: 'Libur',
        code: 'L',
        type: 'libur',
        label: `Libur (Guru ${rawGuruStatus})`,
        catatan: teacherRecord.catatan || `Halaqah diliburkan karena Guru berhalangan (${rawGuruStatus})`,
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold',
        guruStatus: rawGuruStatus
      };
    }
  }

  // 2. Check if guru explicitly recorded a manual attendance status for this student in Absensi Halaqah (Sakit, Izin, Alpha, Hadir)
  const manualRecord = (studentAttendance || []).find(
    (a: any) => a && a.siswaId === student.id && a.tanggal === dateStr
  );

  if (manualRecord && manualRecord.status) {
    const rawStatus = (manualRecord.status || '').trim();
    if (rawStatus === 'Sakit') {
      return {
        status: 'Sakit',
        code: 'S',
        type: 'sakit',
        label: 'Sakit',
        catatan: manualRecord.catatan || '',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
      };
    }
    if (rawStatus === 'Izin') {
      return {
        status: 'Izin',
        code: 'I',
        type: 'izin',
        label: 'Izin',
        catatan: manualRecord.catatan || '',
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold'
      };
    }
    if (rawStatus === 'Alpha' || rawStatus === 'Alpa' || rawStatus === 'Tanpa Keterangan') {
      return {
        status: 'Alpha',
        code: 'A',
        type: 'alpha',
        label: 'Alpha (Tanpa Keterangan)',
        catatan: manualRecord.catatan || '',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
      };
    }
    if (rawStatus === 'Hadir') {
      return {
        status: 'Hadir',
        code: 'H',
        type: 'setoran',
        label: 'Hadir Bimbingan',
        catatan: manualRecord.catatan || '',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
      };
    }
  }

  // 3. Automatic attendance from setoran submissions (if student submitted setoran on this date)
  const studentSetorans = (setorans || []).filter(
    s => s && s.siswaId === student.id && s.tanggalSetoran === dateStr
  );

  if (studentSetorans.length > 0) {
    return {
      status: 'Hadir',
      code: 'H',
      type: 'setoran',
      label: 'Hadir Setoran',
      setoranCount: studentSetorans.length,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
    };
  }

  // 4. If not a scheduled halaqah day
  if (!isScheduled) {
    return {
      status: 'Libur',
      code: '-',
      type: 'off',
      label: 'Bukan Hari Jadwal',
      badgeClass: 'bg-slate-50 text-slate-400 dark:bg-slate-900/40 dark:text-slate-600'
    };
  }

  // 5. Day IS scheduled, but this student has neither setoran nor individual manual attendance
  // A) Future date: learning has not happened yet
  if (dateStr > todayStr) {
    return {
      status: 'Belum Dimulai',
      code: '-',
      type: 'not_started',
      label: 'Belum Dimulai (Mendatang)',
      badgeClass: 'text-slate-300 dark:text-slate-600'
    };
  }

  // B) Date is past or today: verify whether the halaqah has actually started / conducted learning!
  // Collect all student IDs belonging to this halaqah to detect group activity
  const halaqahStudentIds = new Set<string>();
  if (student.id) halaqahStudentIds.add(student.id);

  if (Array.isArray(allStudents) && allStudents.length > 0) {
    allStudents.forEach(s => {
      if (!s) return;
      const matchId = targetHalaqahId && s.halaqahId && s.halaqahId === targetHalaqahId;
      const matchName = halKey && s.halaqahNama && normalizeHalaqahKey(s.halaqahNama) === halKey;
      if (matchId || matchName) {
        halaqahStudentIds.add(s.id);
      }
    });
  }

  // Check 1: Did ANY student in this halaqah submit a setoran on dateStr?
  const hasHalaqahSetoran = (setorans || []).some(s => {
    if (!s || s.tanggalSetoran !== dateStr) return false;
    if (s.siswaId && halaqahStudentIds.has(s.siswaId)) return true;
    if (targetHalaqahId && s.halaqahId && s.halaqahId === targetHalaqahId) return true;
    if (halKey && s.halaqahNama && normalizeHalaqahKey(s.halaqahNama) === halKey) return true;
    return false;
  });

  // Check 2: Was attendance recorded for ANY student in this halaqah on dateStr?
  const hasHalaqahStudentAttendance = (studentAttendance || []).some((a: any) => {
    if (!a || a.tanggal !== dateStr) return false;
    if (a.siswaId && halaqahStudentIds.has(a.siswaId)) return true;
    if (targetHalaqahId && a.halaqahId && a.halaqahId === targetHalaqahId) return true;
    if (halKey && a.halaqahNama && normalizeHalaqahKey(a.halaqahNama) === halKey) return true;
    return false;
  });

  // Check 3: Did teacher record guru attendance as 'Hadir' on dateStr for this halaqah?
  const isGuruHadir = Boolean(
    teacherRecord && (teacherRecord.status || '').toLowerCase().trim() === 'hadir'
  );

  const isHalaqahSessionHeld = hasHalaqahSetoran || hasHalaqahStudentAttendance || isGuruHadir;

  // If learning in this halaqah has not started yet / no activity on this date:
  if (!isHalaqahSessionHeld) {
    return {
      status: 'Belum Dimulai',
      code: '-',
      type: 'not_started',
      label: 'Belum Ada Kegiatan (Halaqah Belum Dimulai)',
      badgeClass: 'text-slate-300 dark:text-slate-600'
    };
  }

  // If halaqah session was held today (todayStr), but this student hasn't submitted yet and hasn't been marked:
  if (dateStr === todayStr) {
    return {
      status: 'Belum Ada Keterangan',
      code: '-',
      type: 'not_started',
      label: 'Belum Ada Keterangan (Hari Ini)',
      badgeClass: 'text-slate-400 dark:text-slate-500'
    };
  }

  // Halaqah session was held on a past date, but this student did not submit setoran and has no excuse -> Alpha (A)
  return {
    status: 'Alpha',
    code: 'A',
    type: 'alpha',
    label: 'Alpha (Tanpa Keterangan)',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
  };
};

export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatIndonesianDateLabel = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return dateStr;
  const dayName = INDONESIAN_DAY_NAMES[d.getDay()];
  const monthName = INDONESIAN_MONTH_FULL[d.getMonth()];
  return `${dayName}, ${day} ${monthName} ${year}`;
};

export interface UnrecordedAttendanceAlert {
  count: number;
  dateStr?: string;
  dates: string[];
  datesLabel: string;
  dayName?: string;
  scheduleLabel: string;
  students: Siswa[];
  namesPreview: string;
  targetDateToOpen: string;
}

/**
 * Finds unrecorded attendance on scheduled days for a teacher's halaqah in the current month (for Dashboard reminders).
 * Rules:
 * 1. Per-month system: Only checks scheduled dates within the current month (from 1st of month to today). Past months are closed and never alerted.
 * 2. If the guru is marked Izin, Sakit, Alpha, or Tanpa Keterangan on a scheduled day, that day is treated as Libur and NOT alerted.
 * 3. Only students who have neither setoran nor recorded manual attendance are considered unrecorded; students with attendance are excluded.
 * 4. Dates label is formatted as e.g. "Kamis, 05 November 2026" or multiple dates separated by comma.
 */
export const findUnrecordedAttendanceForGuru = (
  myHalaqah: Halaqah | null | undefined,
  myStudents: Siswa[] = [],
  guruSchedules: JadwalMengajarGuru[] = [],
  setorans: Setoran[] = [],
  studentAttendance: any[] = [],
  _lookbackDays: number = 7,
  guruAttendance: any[] = [],
  teacherId?: string,
  teacherName?: string
): UnrecordedAttendanceAlert | null => {
  if (!myHalaqah || myStudents.length === 0) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const todayDateNum = today.getDate(); // 1 to 31

  const targetTeacherId = teacherId || myHalaqah.guruPembimbingId || '';
  const targetHalaqahId = myHalaqah.id || '';
  const targetHalaqahName = (myHalaqah.namaHalaqah || '').toLowerCase().trim();

  // Merge studentAttendance from props/context with localStorage to ensure no recorded data is missed
  let combinedAttendance = Array.isArray(studentAttendance) ? [...studentAttendance] : [];
  try {
    const rawLocal = localStorage.getItem('mh_student_attendance');
    if (rawLocal) {
      const parsedLocal = JSON.parse(rawLocal);
      if (Array.isArray(parsedLocal)) {
        parsedLocal.forEach(item => {
          if (item && item.siswaId && item.tanggal) {
            const exists = combinedAttendance.some(c => c.siswaId === item.siswaId && c.tanggal === item.tanggal);
            if (!exists) combinedAttendance.push(item);
          }
        });
      }
    }
  } catch {}

  const unrecordedDaysList: Array<{
    dateStr: string;
    dayIndex: number;
    dayName: string;
    formattedDateLabel: string;
    students: Siswa[];
  }> = [];

  // Inspect strictly from day 1 of the CURRENT MONTH up to today
  // (Past months are closed and never reminded because rekapitulasi is monthly)
  for (let dayNum = 1; dayNum <= todayDateNum; dayNum++) {
    const checkDate = new Date(currentYear, currentMonth, dayNum);
    const dateStr = formatLocalDate(checkDate);
    const dayIndex = checkDate.getDay();
    const dayName = INDONESIAN_DAY_NAMES[dayIndex];

    // 1. Is this day scheduled for this halaqah/teacher?
    const isScheduled = isHalaqahScheduledOnDayIndex(myHalaqah, dayIndex, guruSchedules, targetTeacherId, teacherName);
    if (!isScheduled) continue;

    // 2. Check if guru is excused or absent on this date for this halaqah (Izin, Sakit, Alpha, Tanpa Keterangan)
    const matchedTeacherAtt = findMatchingGuruAttendanceRecord(guruAttendance, dateStr, {
      teacherId: targetTeacherId,
      teacherName: teacherName || (myHalaqah as any)?.guruPembimbingNama || '',
      halaqahId: targetHalaqahId,
      halaqahName: myHalaqah.namaHalaqah || ''
    });
    const matchedStatus = (matchedTeacherAtt?.status || '').toLowerCase().trim();
    const isGuruExcusedOrAbsent = Boolean(
      matchedTeacherAtt && (
        matchedStatus === 'izin' ||
        matchedStatus === 'sakit' ||
        matchedStatus === 'alpha' ||
        matchedStatus === 'alpa' ||
        matchedStatus === 'tanpa keterangan'
      )
    );

    if (isGuruExcusedOrAbsent) {
      // Guru was absent or halaqah was excused/libur -> skip this date
      continue;
    }

    // 3. Find students in this halaqah who have NOT been recorded on this scheduled date
    const unrecordedOnDate = myStudents.filter(student => {
      // a) Does student have a setoran on this date? (Automatically Hadir)
      const hasSetoran = (setorans || []).some(s => {
        if (!s || s.tanggalSetoran !== dateStr) return false;
        const matchId = s.siswaId && s.siswaId === student.id;
        const matchNis = student.nis && s.siswaNis && s.siswaNis === student.nis;
        const matchNama = student.namaLengkap && s.siswaNama && s.siswaNama.toLowerCase().trim() === student.namaLengkap.toLowerCase().trim();
        return matchId || matchNis || matchNama;
      });
      if (hasSetoran) return false; // Already attended via setoran

      // b) Does student have a manual attendance record on this date?
      const hasManualAttendance = (combinedAttendance || []).some((a: any) => {
        if (!a || a.tanggal !== dateStr) return false;
        const matchId = a.siswaId && a.siswaId === student.id;
        const matchNis = student.nis && a.siswaNis && a.siswaNis === student.nis;
        const matchNama = student.namaLengkap && a.siswaNama && a.siswaNama.toLowerCase().trim() === student.namaLengkap.toLowerCase().trim();
        if (!matchId && !matchNis && !matchNama) return false;
        const st = (a.status || '').trim();
        return ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Alpa', 'Tanpa Keterangan'].includes(st);
      });
      if (hasManualAttendance) return false; // Already attended / recorded manually

      // Neither setoran nor manual attendance -> Unrecorded!
      return true;
    });

    if (unrecordedOnDate.length > 0) {
      unrecordedDaysList.push({
        dateStr,
        dayIndex,
        dayName,
        formattedDateLabel: formatIndonesianDateLabel(dateStr),
        students: unrecordedOnDate
      });
    }
  }

  if (unrecordedDaysList.length === 0) {
    return null;
  }

  // Collect unique unrecorded students across all unrecorded scheduled dates
  const uniqueStudentsMap = new Map<string, Siswa>();
  unrecordedDaysList.forEach(item => {
    item.students.forEach(s => {
      uniqueStudentsMap.set(s.id, s);
    });
  });
  const allUnrecordedStudents = Array.from(uniqueStudentsMap.values());

  const names = allUnrecordedStudents.map(s => s.namaLengkap);
  const namesPreview = names.length <= 3 
    ? names.join(', ')
    : `${names.slice(0, 3).join(', ')} dan ${names.length - 3} lainnya`;

  // Sort dates chronologically
  unrecordedDaysList.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  const datesLabel = unrecordedDaysList.map(d => d.formattedDateLabel).join(', ');
  const latestDateObj = unrecordedDaysList[unrecordedDaysList.length - 1];

  const scheduleLabel = unrecordedDaysList.length === 1
    ? `${myHalaqah.namaHalaqah} (${unrecordedDaysList[0].formattedDateLabel})`
    : `${myHalaqah.namaHalaqah} (${unrecordedDaysList.length} Hari Terjadwal)`;

  return {
    count: allUnrecordedStudents.length,
    dateStr: latestDateObj.dateStr,
    dates: unrecordedDaysList.map(d => d.dateStr),
    datesLabel,
    dayName: latestDateObj.dayName,
    scheduleLabel,
    students: allUnrecordedStudents,
    namesPreview,
    targetDateToOpen: latestDateObj.dateStr
  };
};
