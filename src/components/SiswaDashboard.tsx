/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Siswa, Halaqah, Guru, Setoran, TipeModul, StatusAktif } from '../types';
import { Avatar } from './Avatar';
import { AnnouncementBoardWidget } from './AnnouncementBoardWidget';
import { renderArabicEnhancedText } from '../lib/arabicHelper';
import { 
  calculateStudentProgress,
  getQuranTargetRange,
  isPaketFatihahAnnasKausar,
  FATIHAH_ANNAS_KAUSAR_ORDER,
  SURAH_LIST,
  getSurahNumber,
  formatSetoranClean,
  isSetoranLulus,
  isMatchingStudent,
  StudentProgressResult
} from '../utils/targetProgressHelper';
import { findMatchingGuruAttendanceRecord, normalizeHalaqahKey } from '../utils/studentAttendanceHelper';
import { 
  Trophy, 
  Sparkles, 
  History, 
  CheckCircle, 
  BookOpen, 
  Calendar, 
  Award, 
  Compass, 
  Eye, 
  UserCheck, 
  AlertCircle, 
  UserX, 
  CalendarDays,
  X
} from 'lucide-react';

export interface SiswaDashboardProps {
  siswaId?: string;
  setActiveTab?: (tab: string) => void;
  onViewSetoran?: (setoran: Setoran) => void;
  mySiswaObj?: Siswa | null;
  myHalaqah?: Halaqah | null;
  myGuruObj?: Guru | null;
  mySetorans?: Setoran[];
  attendanceList?: any[];
  attendancePercentage?: number;
  hadirCount?: number;
  izinCount?: number;
  sakitCount?: number;
  alphaCount?: number;
  totalAttendanceDays?: number;
  halaqahRank?: number;
  completedSurahs?: string[];
  completedNonQuranModuls?: string[];
  teacherHalaqahStatus?: any;
}

export const SiswaDashboard: React.FC<SiswaDashboardProps> = ({
  siswaId: propSiswaId,
  setActiveTab,
  onViewSetoran,
  mySiswaObj: propSiswaObj,
  myHalaqah: propHalaqah,
  myGuruObj: propGuruObj,
  mySetorans: propSetorans,
  attendanceList: propAttendanceList,
  attendancePercentage: propAttendancePercentage,
  hadirCount: propHadirCount,
  izinCount: propIzinCount,
  sakitCount: propSakitCount,
  alphaCount: propAlphaCount,
  totalAttendanceDays: propTotalAttendanceDays,
  halaqahRank: propHalaqahRank,
  completedSurahs: propCompletedSurahs,
  completedNonQuranModuls: propCompletedNonQuranModuls,
  teacherHalaqahStatus: propTeacherStatus
}) => {
  const {
    currentSession,
    siswas,
    halaqahs,
    gurus,
    setorans,
    moduls,
    elemenSettings,
    studentAttendance,
    studentTargets,
    generalTargets,
    guruSchedules,
    guruAttendance
  } = useApp();

  const user = currentSession.user;
  const currentSiswaId = propSiswaId || user?.id || '';

  // 1. Data Personal Siswa
  const siswaObj = useMemo(() => {
    if (propSiswaObj !== undefined) return propSiswaObj;
    return (siswas || []).find(s => s.id === currentSiswaId) || null;
  }, [propSiswaObj, siswas, currentSiswaId]);

  const halaqahObj = useMemo(() => {
    if (propHalaqah !== undefined) return propHalaqah;
    if (!siswaObj?.halaqahId) return null;
    return (halaqahs || []).find(h => h.id === siswaObj.halaqahId) || null;
  }, [propHalaqah, halaqahs, siswaObj]);

  const guruObj = useMemo(() => {
    if (propGuruObj !== undefined) return propGuruObj;
    if (!halaqahObj) return null;
    return (gurus || []).find(g => 
      (halaqahObj.guruPembimbingId && g.id === halaqahObj.guruPembimbingId) ||
      (halaqahObj.guruPembimbingNama && g.namaLengkap.toLowerCase() === halaqahObj.guruPembimbingNama.toLowerCase())
    ) || null;
  }, [propGuruObj, gurus, halaqahObj]);

  // 2. Setoran Siswa
  const siswaSetorans = useMemo(() => {
    if (propSetorans !== undefined) return propSetorans;
    return (setorans || [])
      .filter(s => isMatchingStudent(s, siswaObj || { id: currentSiswaId }))
      .sort((a, b) => {
        if (a.tanggalSetoran !== b.tanggalSetoran) {
          return b.tanggalSetoran.localeCompare(a.tanggalSetoran);
        }
        const tsA = parseInt(a.id.replace('set-', '')) || 0;
        const tsB = parseInt(b.id.replace('set-', '')) || 0;
        return tsB - tsA;
      });
  }, [propSetorans, setorans, currentSiswaId, siswaObj]);

  const totalSetoran = siswaSetorans.length;

  const passedSetorans = useMemo(() => {
    return siswaSetorans.filter(isSetoranLulus);
  }, [siswaSetorans]);

  const completedSurahsList = useMemo(() => {
    if (propCompletedSurahs !== undefined) return propCompletedSurahs;
    const list: string[] = [];
    passedSetorans.forEach(s => {
      const isQuran = s.tipeModul === TipeModul.AL_QURAN || s.tipeModul === ('Al-Quran' as any) || Boolean(s.suratNama) || Boolean(s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0);
      if (isQuran) {
        if (s.suratNama) list.push(s.suratNama);
        if (s.daftarSuratSetoran) {
          s.daftarSuratSetoran.forEach(sub => {
            if (sub.suratNama) list.push(sub.suratNama);
          });
        }
      }
    });
    return Array.from(new Set(list));
  }, [propCompletedSurahs, passedSetorans]);

  const completedNonQuranList = useMemo(() => {
    if (propCompletedNonQuranModuls !== undefined) return propCompletedNonQuranModuls;
    return Array.from(new Set(
      passedSetorans
        .filter(s => s.tipeModul === TipeModul.NON_AL_QURAN && s.modulNama)
        .map(s => s.modulNama)
    ));
  }, [propCompletedNonQuranModuls, passedSetorans]);

  // 3. Attendance
  const attendanceList = useMemo(() => {
    if (propAttendanceList !== undefined) return propAttendanceList;
    return (studentAttendance || []).filter((a: any) => a.siswaId === currentSiswaId);
  }, [propAttendanceList, studentAttendance, currentSiswaId]);

  const hadirCount = propHadirCount !== undefined ? propHadirCount : attendanceList.filter(a => a.status === 'Hadir').length;
  const izinCount = propIzinCount !== undefined ? propIzinCount : attendanceList.filter(a => a.status === 'Izin').length;
  const sakitCount = propSakitCount !== undefined ? propSakitCount : attendanceList.filter(a => a.status === 'Sakit').length;
  const alphaCount = propAlphaCount !== undefined ? propAlphaCount : attendanceList.filter(a => a.status === 'Alpha').length;
  const totalAttendanceDays = propTotalAttendanceDays !== undefined ? propTotalAttendanceDays : attendanceList.length;
  const attendancePercentage = propAttendancePercentage !== undefined 
    ? propAttendancePercentage 
    : (totalAttendanceDays > 0 ? Math.round((hadirCount / totalAttendanceDays) * 100) : 100);

  // 4. Halaqah Rank
  const halaqahRank = useMemo(() => {
    if (propHalaqahRank !== undefined) return propHalaqahRank;
    if (!siswaObj || !siswaObj.halaqahId) return 1;
    const halaqahPeers = (siswas || []).filter(s => s.halaqahId === siswaObj.halaqahId);
    
    const peersProgress = halaqahPeers.map(peer => {
      const peerPassed = (setorans || []).filter(st => st.siswaId === peer.id && st.statusLulus).length;
      return { id: peer.id, count: peerPassed };
    });

    peersProgress.sort((a, b) => b.count - a.count);
    const myPos = peersProgress.findIndex(p => p.id === currentSiswaId);
    return myPos >= 0 ? myPos + 1 : 1;
  }, [propHalaqahRank, siswaObj, siswas, setorans, currentSiswaId]);

  // 5. Target & Progression (Sinkronisasi resmi dengan perhitungan Akun Guru & Admin)
  const myTargets = studentTargets[currentSiswaId] || null;
  const isCustom = !!(myTargets && (myTargets.isCustom || (myTargets.config && Object.keys(myTargets.config).length > 0) || myTargets.pekanan || myTargets.bulanan || myTargets.kuartal || myTargets.semester || myTargets.tahunan));

  const effectiveSiswaForTarget = useMemo(() => {
    return siswaObj || {
      id: currentSiswaId,
      nis: (user as any)?.nis || '',
      namaLengkap: user?.namaLengkap || 'Santri',
      halaqahId: halaqahObj?.id || ''
    } as Siswa;
  }, [siswaObj, currentSiswaId, user, halaqahObj]);

  const targetMetrics: StudentProgressResult | null = useMemo(() => {
    if (!effectiveSiswaForTarget) return null;
    return calculateStudentProgress(
      effectiveSiswaForTarget,
      halaqahObj || undefined,
      studentTargets,
      generalTargets,
      setorans,
      moduls,
      elemenSettings
    );
  }, [effectiveSiswaForTarget, halaqahObj, studentTargets, generalTargets, setorans, moduls, elemenSettings]);

  const effectiveConfig = (isCustom && myTargets?.config) 
    ? myTargets.config 
    : (halaqahObj?.targetConfig || generalTargets?.config);

  const shouldShowTarget = (halaqahObj?.targetConfigEnabled === true && myTargets?.showTarget !== false)
    || (isCustom && myTargets?.showTarget !== false)
    || !!(myTargets && (myTargets.pekanan || myTargets.bulanan || myTargets.kuartal || myTargets.semester || myTargets.tahunan));

  const isQuranTarget = !effectiveConfig || effectiveConfig.selectedModulType === 'Al-Quran';

  const targetSurahsList = useMemo(() => {
    if (!isQuranTarget) return [];
    if (effectiveConfig && isPaketFatihahAnnasKausar(effectiveConfig)) {
      return FATIHAH_ANNAS_KAUSAR_ORDER.map(s => s.nama);
    }
    const range = getQuranTargetRange(effectiveConfig);
    if (range && range.sAwalNo !== 0 && range.sAkhirNo !== 0) {
      if (range.sAwalNo <= range.sAkhirNo) {
        return SURAH_LIST.filter(s => s.no >= range.sAwalNo && s.no <= range.sAkhirNo).map(s => s.nama);
      } else {
        return SURAH_LIST.filter(s => s.no <= range.sAwalNo && s.no >= range.sAkhirNo).reverse().map(s => s.nama);
      }
    }
    return ['Ad-Duha', 'Asy-Syarh', 'At-Tin', 'Al-\'Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-\'Adiyat', 'Al-Qari\'ah', 'At-Takasur', 'Al-\'Asr', 'Al-Humazah', 'Al-Fil', 'Quraisy', 'Al-Ma\'un', 'Al-Kausar', 'Al-Kafirun', 'An-Nasr', 'Al-Lahab', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'].reverse();
  }, [isQuranTarget, effectiveConfig]);

  const surahProgressArray = useMemo(() => {
    return targetSurahsList.map(name => {
      const sNo = getSurahNumber(name);
      const isSelesai = passedSetorans.some(s => {
        if (s.suratNama && getSurahNumber(s.suratNama) === sNo) return true;
        if (s.daftarSuratSetoran && s.daftarSuratSetoran.some(sub => getSurahNumber(sub.suratNama) === sNo)) return true;
        return false;
      }) || completedSurahsList.some(cs => getSurahNumber(cs) === sNo);

      const latestSetForSurah = siswaSetorans.find(st => {
        if (st.suratNama && getSurahNumber(st.suratNama) === sNo) return true;
        if (st.daftarSuratSetoran && st.daftarSuratSetoran.some(sub => getSurahNumber(sub.suratNama) === sNo)) return true;
        return false;
      });

      const isSedangDipelajari = !isSelesai && !!latestSetForSurah;
      return {
        nama: name,
        sNo,
        status: isSelesai ? 'selesai' : (isSedangDipelajari ? 'sedang' : 'belum'),
        lastGrade: latestSetForSurah?.nilai || ''
      };
    });
  }, [targetSurahsList, passedSetorans, completedSurahsList, siswaSetorans]);

  const totalFinishedSurahs = surahProgressArray.filter(s => s.status === 'selesai').length;
  const totalSedangSurahs = surahProgressArray.filter(s => s.status === 'sedang').length;
  const totalBelumSurahs = surahProgressArray.filter(s => s.status === 'belum').length;

  // Persentase capaian target tersinkronisasi 100% dengan Akun Guru & Admin
  const totalQuranTargetPercentage = targetMetrics !== null 
    ? targetMetrics.percent 
    : (targetSurahsList.length > 0 ? Math.round((totalFinishedSurahs / targetSurahsList.length) * 100) : 0);

  const calculateEstimation = () => {
    if (totalQuranTargetPercentage >= 100) return 'Seluruh target hafalan telah tercapai!';
    const remaining = isQuranTarget 
      ? (totalBelumSurahs + totalSedangSurahs) 
      : Math.max(0, (targetMetrics?.totalTargetCount || 10) - (targetMetrics?.memorizedCount || 0));
    if (remaining === 0) return 'Seluruh target pembelajaran telah tercapai!';
    const monthlyRate = Math.max(1, Math.round(totalFinishedSurahs / 2)) || 2;
    const monthsNeeded = Math.ceil(remaining / monthlyRate);
    return `Estimasi ${monthsNeeded} bulan lagi (asumsi rata-rata ${monthlyRate} setoran tuntas per bulan)`;
  };

  // 6. Teacher Halaqah Status & Admin Attendance Record
  const now = new Date();
  const todayDateIso = now.toISOString().slice(0, 10);
  const localDateIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const teacherHalaqahStatus = useMemo(() => {
    if (propTeacherStatus !== undefined && propTeacherStatus !== null) return propTeacherStatus;
    if (!guruObj) return null;
    const daysMap = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayName = daysMap[now.getDay()];

    const studentHalaqahId = halaqahObj?.id || siswaObj?.halaqahId || '';
    const studentHalaqahName = halaqahObj?.namaHalaqah || siswaObj?.halaqahNama || '';
    const studentHalKey = normalizeHalaqahKey(studentHalaqahName);

    const scheduleForDay = (guruSchedules || []).find(
      s => s.status === StatusAktif.AKTIF &&
           (s.guruId === guruObj.id || (s.guruNama && s.guruNama.toLowerCase() === guruObj.namaLengkap.toLowerCase())) &&
           s.hari === todayDayName &&
           (!s.halaqahId && !s.halaqahNama
             ? true
             : ((studentHalaqahId && s.halaqahId === studentHalaqahId) ||
                (studentHalKey && s.halaqahNama && normalizeHalaqahKey(s.halaqahNama) === studentHalKey)))
    );

    const setoransToday = (setorans || []).filter(set => {
      if (set.tanggalSetoran !== todayDateIso && set.tanggalSetoran !== localDateIso) return false;
      const matchGuru = (set.guruId && guruObj.id)
        ? set.guruId === guruObj.id
        : Boolean(set.guruNama && set.guruNama.toLowerCase() === guruObj.namaLengkap.toLowerCase());
      if (!matchGuru) return false;
      if (studentHalaqahId && set.halaqahId) return set.halaqahId === studentHalaqahId;
      return true;
    });

    const setoranCountToday = setoransToday.length;

    const adminAttendanceRecord = findMatchingGuruAttendanceRecord(
      guruAttendance,
      [localDateIso, todayDateIso],
      {
        teacherId: guruObj.id,
        teacherName: guruObj.namaLengkap,
        halaqahId: studentHalaqahId,
        halaqahName: studentHalaqahName
      }
    );

    return {
      todayDateIso,
      localDateIso,
      todayDayName,
      scheduleForDay,
      setoranCountToday,
      adminAttendanceRecord
    };
  }, [propTeacherStatus, guruObj, halaqahObj, siswaObj, guruSchedules, setorans, guruAttendance, todayDateIso, localDateIso]);

  // Active Teacher Attendance Record from Admin (menu: Kehadiran & Presensi Guru) - strictly scoped by student's halaqah
  const teacherAttendanceRecord = useMemo(() => {
    if (!guruObj) return null;
    const studentHalaqahId = halaqahObj?.id || siswaObj?.halaqahId || '';
    const studentHalaqahName = halaqahObj?.namaHalaqah || siswaObj?.halaqahNama || '';
    const freshRecord = findMatchingGuruAttendanceRecord(
      guruAttendance,
      [localDateIso, todayDateIso],
      {
        teacherId: guruObj.id,
        teacherName: guruObj.namaLengkap,
        halaqahId: studentHalaqahId,
        halaqahName: studentHalaqahName
      }
    );
    return freshRecord || teacherHalaqahStatus?.adminAttendanceRecord || null;
  }, [guruObj, halaqahObj, siswaObj, guruAttendance, teacherHalaqahStatus, todayDateIso, localDateIso]);

  const teacherScheduleToday = useMemo(() => {
    if (!guruObj) return null;
    const daysMap = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayName = daysMap[new Date().getDay()];
    const studentHalaqahId = halaqahObj?.id || siswaObj?.halaqahId || '';
    const studentHalaqahName = halaqahObj?.namaHalaqah || siswaObj?.halaqahNama || '';
    const studentHalKey = normalizeHalaqahKey(studentHalaqahName);
    return (guruSchedules || []).find(
      s => s.status === StatusAktif.AKTIF &&
           (s.guruId === guruObj.id || (s.guruNama && s.guruNama.toLowerCase() === guruObj.namaLengkap.toLowerCase())) &&
           s.hari === todayDayName &&
           (!s.halaqahId && !s.halaqahNama
             ? true
             : ((studentHalaqahId && s.halaqahId === studentHalaqahId) ||
                (studentHalKey && s.halaqahNama && normalizeHalaqahKey(s.halaqahNama) === studentHalKey)))
    ) || teacherHalaqahStatus?.scheduleForDay || null;
  }, [guruObj, halaqahObj, siswaObj, guruSchedules, teacherHalaqahStatus]);

  // Modal States
  const [showAttModal, setShowAttModal] = useState(false);
  const [localViewingSetoran, setLocalViewingSetoran] = useState<Setoran | null>(null);

  const handleOpenSetoran = (setoran: Setoran) => {
    if (onViewSetoran) {
      onViewSetoran(setoran);
    } else {
      setLocalViewingSetoran(setoran);
    }
  };

  // Helper Indonesian Day
  const getIndonesianDayName = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Harian';
      const dayIndex = date.getDay();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[dayIndex] || 'Harian';
    } catch {
      return 'Harian';
    }
  };

  // Helper Indonesian Full Date (e.g. "Senin, 14 September 2026")
  const formatIndonesianFullDate = (dateStr?: string) => {
    if (!dateStr) return 'Hari ini';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${days[date.getDay()]}, ${day} ${months[month]} ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-emerald-900 border border-emerald-500/10 shadow-2xl rounded-3xl p-6 md:p-8 text-white relative overflow-hidden transition-all">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none transform translate-x-12">
          <Trophy className="w-80 h-80 text-emerald-400" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Profile Card left */}
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
            <Avatar 
              namaLengkap={siswaObj?.namaLengkap || ''} 
              fotoProfil={siswaObj?.fotoProfil} 
              className="w-20 h-20 text-2xl font-bold border-4 border-white/10 select-none shadow-xl transform hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex flex-col md:flex-row items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans flex items-center gap-1.5">
                  <Sparkles className="w-5.5 h-5.5 text-emerald-400 inline shrink-0 animate-pulse" />
                  Ahlan, {siswaObj ? siswaObj.namaLengkap : 'Sahabat Santri'}!
                </h2>
                <span className="p-1 px-3 rounded-full text-[9px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono tracking-wider uppercase">
                  Santri Aktif
                </span>
              </div>

              {/* Minimal Grid/Pills for metadata */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <div className="inline-flex items-center gap-1.5 bg-white/5 dark:bg-black/25 px-3 py-1.5 rounded-xl text-xs text-white border border-white/10 shadow-sm font-sans transition-colors hover:bg-white/10">
                  <span className="text-emerald-400 font-bold uppercase text-[9px] font-mono tracking-widest">NIS</span>
                  <span className="font-semibold text-slate-100">{siswaObj?.nis || '-'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/5 dark:bg-black/25 px-3 py-1.5 rounded-xl text-xs text-white border border-white/10 shadow-sm font-sans transition-colors hover:bg-white/10">
                  <span className="text-emerald-400 font-bold uppercase text-[9px] font-mono tracking-widest">Kelas</span>
                  <span className="font-semibold text-slate-100">{siswaObj?.kelasNama || '-'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/5 dark:bg-black/25 px-3 py-1.5 rounded-xl text-xs text-white border border-white/10 shadow-sm font-sans transition-colors hover:bg-white/10">
                  <span className="text-emerald-400 font-bold uppercase text-[9px] font-mono tracking-widest">Kelompok</span>
                  <span className="font-semibold text-slate-100 underline decoration-emerald-500 decoration-2 underline-offset-2">{halaqahObj ? halaqahObj.namaHalaqah : 'Belum Bergabung'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/5 dark:bg-black/25 px-3 py-1.5 rounded-xl text-xs text-white border border-white/10 shadow-sm font-sans transition-colors hover:bg-white/10">
                  <span className="text-emerald-400 font-bold uppercase text-[9px] font-mono tracking-widest">Ustadz/ah</span>
                  <span className="font-semibold text-emerald-300">{guruObj ? guruObj.namaLengkap : 'Belum Ditunjuk'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Banner Badge (Target Progress or Motivation Card) */}
          {shouldShowTarget ? (
            <div className="bg-slate-950/60 backdrop-blur-lg p-5 rounded-3xl border border-emerald-500/20 text-center flex flex-col items-center justify-center min-w-[220px] shadow-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
              {/* Glowing decorative background */}
              <div className="absolute -right-12 -bottom-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -left-12 -top-12 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
              
              <span className="text-[9px] font-black text-emerald-300 tracking-widest uppercase font-mono flex items-center gap-1.5 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {(targetMetrics?.isCustom || isCustom) ? "CAPAIAN TARGET MANDIRI" : "CAPAIAN TARGET HALAQAH"}
              </span>

              {/* Elegant Circular Progress SVG */}
              <div className="relative w-28 h-28 flex items-center justify-center my-1.5">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="text-white/5"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="text-emerald-400 transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - totalQuranTargetPercentage / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono text-white tracking-tighter leading-none">
                    {totalQuranTargetPercentage}<span className="text-xs text-emerald-400 font-bold">%</span>
                  </span>
                  <span className="text-[8px] text-slate-300 mt-1 font-bold font-mono tracking-wider uppercase">
                    PROGRES
                  </span>
                </div>
              </div>

              <div className="mt-3 bg-emerald-950/40 border border-emerald-500/15 p-2 rounded-xl w-full text-center">
                <span className="text-[10px] text-slate-200 font-mono tracking-wider font-semibold block">
                  {isQuranTarget ? (
                    <>Tuntas: <span className="text-emerald-300 font-extrabold">{totalFinishedSurahs}</span> / <span className="text-white font-extrabold">{targetSurahsList.length}</span> Surat</>
                  ) : (
                    <>Tuntas: <span className="text-emerald-300 font-extrabold">{targetMetrics?.memorizedCount || 0}</span> / <span className="text-white font-extrabold">{targetMetrics?.totalTargetCount || 10}</span> {targetMetrics?.targetRangeText?.includes('Halaman') ? 'Halaman' : 'Satuan'}</>
                  )}
                </span>
                {targetMetrics?.targetRangeText && (
                  <span className="block text-[8.5px] text-emerald-300/80 font-medium truncate mt-0.5" title={targetMetrics.targetRangeText}>
                    {targetMetrics.targetRangeText}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/45 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-center flex flex-col justify-center min-w-[220px] max-w-[280px] shadow-lg relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <span className="text-[9px] font-extrabold text-emerald-300 tracking-widest uppercase font-mono flex items-center justify-center gap-1">
                ✨ Motivasi Harian
              </span>
              <p className="mt-3 text-[11px] font-semibold leading-relaxed text-slate-100 italic">
                "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya."
              </p>
              <span className="text-[9px] text-emerald-400 mt-2 font-mono tracking-wider font-semibold">
                (HR. Bukhari)
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Announcement Board Widget */}
      {setActiveTab && <AnnouncementBoardWidget setActiveTab={setActiveTab} />}

      {/* Keterangan Jika Ustadz Pembimbing Izin atau Sakit (Dari menu admin: HALAQAH > Kehadiran & Presensi Guru) */}
      {guruObj && teacherAttendanceRecord && ['Sakit', 'Izin', 'Tanpa Keterangan', 'Alpha'].includes(teacherAttendanceRecord.status) && (
        <div id="banner-kehadiran-guru" className="animate-fade-in">
          {teacherAttendanceRecord.status === 'Sakit' && (
            <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 p-4 sm:p-5 rounded-2xl shadow-sm text-xs space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
                      Ustadz Tidak Hadir
                    </h4>
                    <span className="px-2.5 py-0.5 bg-amber-200/90 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-[11px] font-black rounded-full border border-amber-300 dark:border-amber-700 shadow-2xs">
                      Ket: Sakit 🟡
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/85 dark:text-amber-300/90 mt-1 leading-relaxed">
                    Ustadz Pembimbing Anda (<strong className="font-bold text-amber-950 dark:text-amber-100">{guruObj.namaLengkap}</strong>) berhalangan hadir membimbing halaqah hari ini ({formatIndonesianFullDate(teacherAttendanceRecord.tanggal || todayDateIso)}) dikarenakan <strong className="font-bold text-amber-950 dark:text-amber-100">Sakit</strong>.
                    {teacherScheduleToday && (
                      <span className="ml-1 text-[11px] font-mono text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        Jadwal: {teacherScheduleToday.jamMulai} - {teacherScheduleToday.jamSelesai} WIB
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/90 dark:border-amber-800/60 space-y-1">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-900 dark:text-amber-200 shrink-0">Keterangan:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {teacherAttendanceRecord.catatan ? (
                      teacherAttendanceRecord.catatan
                    ) : (
                      'Ustadz sedang berhalangan hadir karena sakit.'
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                  Doa santri: Semoga Allah Ta'ala lekas memberikan kesembuhan dan keafiatan kepada Ustadz (شَفَاهُ اللهُ). Santri dipersilakan melanjutkan murojaah hafalan secara mandiri.
                </p>
              </div>
            </div>
          )}

          {teacherAttendanceRecord.status === 'Izin' && (
            <div className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/80 p-4 sm:p-5 rounded-2xl shadow-sm text-xs space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-extrabold text-blue-950 dark:text-blue-100 tracking-tight">
                      Ustadz Tidak Hadir
                    </h4>
                    <span className="px-2.5 py-0.5 bg-blue-200/90 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200 text-[11px] font-black rounded-full border border-blue-300 dark:border-blue-700 shadow-2xs">
                      Ket: Izin 🔵
                    </span>
                  </div>
                  <p className="text-xs text-blue-900/85 dark:text-blue-300/90 mt-1 leading-relaxed">
                    Ustadz Pembimbing Anda (<strong className="font-bold text-blue-950 dark:text-blue-100">{guruObj.namaLengkap}</strong>) berhalangan hadir membimbing halaqah hari ini ({formatIndonesianFullDate(teacherAttendanceRecord.tanggal || todayDateIso)}) dikarenakan <strong className="font-bold text-blue-950 dark:text-blue-100">Izin</strong>.
                    {teacherScheduleToday && (
                      <span className="ml-1 text-[11px] font-mono text-blue-800 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        Jadwal: {teacherScheduleToday.jamMulai} - {teacherScheduleToday.jamSelesai} WIB
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-blue-200/90 dark:border-blue-800/60 space-y-1">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-900 dark:text-blue-200 shrink-0">Keterangan:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {teacherAttendanceRecord.catatan ? (
                      teacherAttendanceRecord.catatan
                    ) : (
                      'Ustadz sedang ada uzur/keperluan izin yang telah terkonfirmasi ke admin.'
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                  Santri diharapkan tetap menjaga ketertiban halaqah dan melanjutkan murojaah hafalan secara mandiri atau berpasangan.
                </p>
              </div>
            </div>
          )}

          {(teacherAttendanceRecord.status === 'Tanpa Keterangan' || teacherAttendanceRecord.status === 'Alpha') && (
            <div className="bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/80 p-4 sm:p-5 rounded-2xl shadow-sm text-xs space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 shadow-xs">
                  <UserX className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-extrabold text-rose-950 dark:text-rose-100 tracking-tight">
                      Ustadz Tidak Hadir
                    </h4>
                    <span className="px-2.5 py-0.5 bg-rose-200/90 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 text-[11px] font-black rounded-full border border-rose-300 dark:border-rose-700 shadow-2xs">
                      Ket: Tanpa Keterangan 🔴
                    </span>
                  </div>
                  <p className="text-xs text-rose-900/85 dark:text-rose-300/90 mt-1 leading-relaxed">
                    Ustadz Pembimbing Anda (<strong className="font-bold text-rose-950 dark:text-rose-100">{guruObj.namaLengkap}</strong>) tercatat berhalangan hadir pada halaqah hari ini ({formatIndonesianFullDate(teacherAttendanceRecord.tanggal || todayDateIso)}).
                    {teacherScheduleToday && (
                      <span className="ml-1 text-[11px] font-mono text-rose-800 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-900/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        Jadwal: {teacherScheduleToday.jamMulai} - {teacherScheduleToday.jamSelesai} WIB
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-rose-200/90 dark:border-rose-800/60 space-y-1">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-rose-900 dark:text-rose-200 shrink-0">Keterangan:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {teacherAttendanceRecord.catatan ? (
                      teacherAttendanceRecord.catatan
                    ) : (
                      'Belum ada keterangan / uzur resmi yang tercatat di sistem presensi admin.'
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                  Santri dipersilakan melanjutkan kegiatan halaqah dan murojaah hafalan secara mandiri.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Setor</span>
            <div className="p-2 bg-emerald-50 dark:bg-slate-900 text-emerald-600 rounded-xl">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalSetoran}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Ujian bimbingan diajukan</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hafalan Lulus</span>
            <div className="p-2 bg-indigo-50 dark:bg-slate-900 text-indigo-600 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{completedSurahsList.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Surat Juz 30 selesai</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modul Non Quran</span>
            <div className="p-2 bg-amber-50 dark:bg-slate-900 text-amber-500 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{completedNonQuranList.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Modul non-Quran tuntas</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kehadiran</span>
            <button
              type="button"
              onClick={() => setShowAttModal(true)}
              className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-slate-900 border border-rose-100/50 dark:border-slate-800 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1 rounded-lg transition-all cursor-pointer"
              title="Lihat Detail Riwayat Harian"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Rincian</span>
            </button>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{attendancePercentage}%</h3>
              <p className="text-[10px] text-slate-400 mt-1">{hadirCount} Hadir dari {totalAttendanceDays} Hari</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAttModal(true)}
              className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 hover:underline cursor-pointer"
            >
              Detail Riwayat &rarr;
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Halaqah Rank</span>
            <div className="p-2 bg-sky-50 dark:bg-slate-900 text-sky-500 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">#{halaqahRank}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Siswa bimbingan terajin</p>
          </div>
        </div>

      </div>

      {/* Graphic progress metric & recent setorans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progression Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Grafik Perkembangan Penilaian</h3>
                <p className="text-[11px] text-slate-400">Tingkat capaian nilai (Mumtaz, Jayyid, Maqbul) per tanggal setor</p>
              </div>
            </div>

            {siswaSetorans.length > 1 ? (
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <div className="relative h-44 w-full">
                  {/* Vertical limits */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-slate-400 font-mono">
                    <span>Mumtaz (A)</span>
                    <span>Jayyid (B)</span>
                    <span>Maqbul (C)</span>
                  </div>
                  
                  {/* Grid background lines */}
                  <div className="absolute left-16 right-0 top-0 bottom-0 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
                    <div className="border-b border-dashed border-slate-200 dark:border-slate-850 w-full" />
                    <div className="border-b border-dashed border-slate-200 dark:border-slate-850 w-full" />
                    <div className="border-b border-slate-200 dark:border-slate-850 w-full" />
                  </div>

                  {/* SVG Draw Plotted Multi-Segment Graph */}
                  <svg className="absolute left-16 right-0 top-0 bottom-0 h-40 w-[80%] md:w-[90%]" viewBox="0 0 400 100">
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      points={siswaSetorans.slice(0, 5).reverse().map((s, i) => {
                        const x = (i / Math.max(1, siswaSetorans.slice(0, 5).length - 1)) * 360 + 20;
                        let scaler = 2;
                        if (s.nilai.includes('Mumtaz') || s.nilai.includes('A')) scaler = 4;
                        else if (s.nilai.includes('Jayyid Jiddan')) scaler = 3;
                        else if (s.nilai.includes('Jayyid') || s.nilai.includes('B')) scaler = 2.5;

                        const y = 100 - ((scaler - 1.5) / 2.5) * 80;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {siswaSetorans.slice(0, 5).reverse().map((s, i) => {
                      const x = (i / Math.max(1, siswaSetorans.slice(0, 5).length - 1)) * 360 + 20;
                      let scaler = 2;
                      if (s.nilai.includes('Mumtaz') || s.nilai.includes('A')) scaler = 4;
                      else if (s.nilai.includes('Jayyid Jiddan')) scaler = 3;
                      else if (s.nilai.includes('Jayyid') || s.nilai.includes('B')) scaler = 2.5;

                      const y = 100 - ((scaler - 1.5) / 2.5) * 80;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5.5" fill="#34D399" stroke="#047857" strokeWidth="1.5" />
                          <text x={x} y={y - 12} fontSize="8" fill="#10B981" fontWeight="bold" textAnchor="middle">
                            {s.nilai}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 mt-4 pl-16">
                  {siswaSetorans.slice(0, 5).reverse().map((s, i) => (
                    <span key={i} className="truncate max-w-[65px] font-medium">{s.tanggalSetoran}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-14 bg-slate-50 dark:bg-slate-900 border border-dashed rounded-xl text-center text-xs text-slate-400 italic">
                Belum ada riwayat bimbingan yang terekam untuk menyusun grafik tren perkembangan.
              </div>
            )}
          </div>

          {/* Target Berikutnya info (Hanya muncul jika halaqah mengaktifkan target) */}
          {shouldShowTarget && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-150/60 dark:border-indigo-950 text-xs text-indigo-950 dark:text-indigo-400 mt-4 relative overflow-hidden group hover:shadow-md transition-all duration-200">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 text-indigo-900 pointer-events-none">
                <Compass className="w-32 h-32" />
              </div>
              <div className="flex items-center space-x-2 font-black uppercase tracking-widest text-[10px] text-indigo-800 dark:text-indigo-300">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>SASARAN TARGET BERIKUTNYA • {targetMetrics?.elementName || 'Tahfidz'}</span>
              </div>
              <p className="mt-2.5 font-bold text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                {isQuranTarget ? (
                  <>Surat berikutnya yang wajib diselesaikan: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold underline decoration-indigo-400 decoration-2 underline-offset-4">{surahProgressArray.find(s => s.status === 'belum')?.nama || (totalFinishedSurahs >= targetSurahsList.length ? 'Semua Target Selesai 🎉' : 'Selesai')}</span></>
                ) : (
                  <>Target Pembelajaran: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{targetMetrics?.targetRangeText || 'Selain Al-Qur\'an'}</span></>
                )}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                <span className="flex items-center gap-1">
                  <span>⏳</span>
                  <span>{calculateEstimation()}</span>
                </span>
                {targetMetrics?.latestCapaianText && targetMetrics.latestCapaianText !== 'Belum ada capaian tercatat' && (
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100/60 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                    Terakhir: {targetMetrics.latestCapaianText}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Setoran list inside Dashboard right panel */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3.5">Riwayat Setoran Terbaru</h4>
            
            <div className="space-y-3">
              {siswaSetorans.slice(0, 4).map((setoran, index) => (
                <div key={setoran.id || index} className="p-3 bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-white truncate max-w-[140px]">{setoran.modulNama}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${setoran.statusLulus ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20'}`}>
                        {setoran.statusLulus ? 'LULUS' : 'MENGULANG'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSetoran(setoran)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded cursor-pointer"
                        title="Lihat rincian lengkap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">{setoran.tanggalSetoran} • Oleh {setoran.guruNama}</p>
                  <p className="text-[11px] bg-white dark:bg-slate-950 p-1.5 rounded text-slate-600 dark:text-slate-350 italic border border-slate-100 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                    {setoran.catatanGuru ? <>"{renderArabicEnhancedText(setoran.catatanGuru)}"</> : '"Tanpa catatan"'}
                  </p>
                </div>
              ))}
              {siswaSetorans.length === 0 && (
                <p className="text-center py-10 italic text-slate-400 text-xs">Belum ada riwayat setoran</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* DETAIL ABSENSI SANTRI POPUP MODAL (STUDENT SIDE) */}
      {showAttModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 my-8 flex flex-col max-h-[85vh] text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center font-extrabold text-sm font-mono shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Rincian Hari &amp; Tanggal Kehadiran</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Laporan Presensi Bulanan / Pekanan Berjalan Anda</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAttModal(false)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Quick Metrics Statistics */}
            <div className="grid grid-cols-5 gap-2 my-4 shrink-0 font-semibold text-xs">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-center rounded-xl border border-emerald-100/50 dark:border-emerald-900/40">
                <span className="block text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{attendancePercentage}%</span>
                <span className="text-[8px] font-black tracking-wider uppercase text-slate-400">Rerata</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900 text-center rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{hadirCount}x</span>
                <span className="text-[8px] font-black tracking-wider uppercase text-emerald-600 font-bold">Hadir</span>
              </div>
              <div className="p-2 bg-indigo-50/40 dark:bg-slate-900 text-center rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="block text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400">{izinCount}x</span>
                <span className="text-[8px] font-black tracking-wider uppercase text-indigo-600 font-bold">Izin</span>
              </div>
              <div className="p-2 bg-amber-50/40 dark:bg-slate-900 text-center rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="block text-xs font-mono font-bold text-amber-700 dark:text-amber-400">{sakitCount}x</span>
                <span className="text-[8px] font-black tracking-wider uppercase text-amber-600 font-bold">Sakit</span>
              </div>
              <div className="p-2 bg-rose-50/40 dark:bg-slate-900 text-center rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="block text-xs font-mono font-bold text-rose-700 dark:text-rose-400">{alphaCount}x</span>
                <span className="text-[8px] font-black tracking-wider uppercase text-rose-600 font-bold">Alpha</span>
              </div>
            </div>

            {/* Attendance detailed list scrollbox */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[250px] py-1 border-t border-b border-slate-50 dark:border-slate-900/50 my-2">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">JURNAL RIWAYAT KEHADIRAN ANDA</span>
              
              {attendanceList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic text-xs">
                  Belum ada catatan kehadiran yang terinput oleh Guru Pembimbing halaqah Anda.
                </div>
              ) : (
                attendanceList.slice().sort((a: any, b: any) => b.tanggal.localeCompare(a.tanggal)).map((rec: any, idx: number) => {
                  let badgeColors = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
                  if (rec.status === 'Izin') badgeColors = 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400';
                  if (rec.status === 'Sakit') badgeColors = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
                  if (rec.status === 'Alpha') badgeColors = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400';

                  return (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs transition-colors hover:border-slate-200">
                      <div>
                        <div className="flex items-center space-x-1.5 font-bold">
                          <span className="text-slate-800 dark:text-slate-200">
                            📅 {getIndonesianDayName(rec.tanggal)}, {rec.tanggal}
                          </span>
                        </div>
                        {rec.catatan ? (
                          <p className="text-[11px] italic text-slate-500 mt-1 dark:text-slate-400 font-medium">"{renderArabicEnhancedText(rec.catatan)}"</p>
                        ) : (
                          <p className="text-[9px] text-slate-400 mt-0.5">Tidak ada catatan feedback guru.</p>
                        )}
                      </div>

                      <span className={`p-1 px-3.5 text-[9px] font-black uppercase tracking-wider rounded-full shrink-0 ${badgeColors}`}>
                        {rec.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer buttons */}
            <div className="shrink-0 pt-3 flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-400 font-mono">Sistem Absensi Halaqah Digital</span>
              <button 
                type="button" 
                onClick={() => setShowAttModal(false)} 
                className="p-2 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold tracking-wider uppercase text-[10px] rounded-xl shadow transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Fallback local viewing setoran modal if no onViewSetoran provided */}
      {localViewingSetoran && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Rincian Hasil Setoran</h4>
                <p className="text-xs text-slate-400">{localViewingSetoran.tanggalSetoran} • {localViewingSetoran.guruNama}</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalViewingSetoran(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-300">Materi</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{localViewingSetoran.modulNama}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-300">Nilai</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{localViewingSetoran.nilai}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-300">Status Kelulusan</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${localViewingSetoran.statusLulus ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                  {localViewingSetoran.statusLulus ? 'LULUS' : 'MENGULANG'}
                </span>
              </div>
              {localViewingSetoran.catatanGuru && (
                <div className="p-3 bg-amber-50/50 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-900/30 rounded-xl">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">Catatan Ustadz:</span>
                  <p className="italic text-slate-700 dark:text-slate-300">{renderArabicEnhancedText(localViewingSetoran.catatanGuru)}</p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setLocalViewingSetoran(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
