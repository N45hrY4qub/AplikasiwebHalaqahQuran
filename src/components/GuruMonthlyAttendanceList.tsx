import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
  UserCheck,
  AlertCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  TrendingUp,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Info,
  ListFilter,
  Maximize2,
  Minimize2,
  Eye,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusAktif, isPrivateSetoran, isPrivateHalaqah } from '../types';
import { isHalaqahBelongingToTeacher, normalizeTeacherName, normalizeHalaqahKey } from '../utils/studentAttendanceHelper';

export interface GuruMonthlyAttendanceProps {
  myUser?: any;
  myGuruObj?: any;
  myHalaqah?: any;
  variant?: 'full' | 'dashboard';
  onNavigateToFull?: () => void;
  formatIndonesianDate?: (dateStr: string) => string;
  addLog?: (action: string, details: string) => void;
}

export interface GuruAttendanceDayRecord {
  id?: string;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayName: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Tanpa Keterangan' | 'Belum Presensi' | 'Mendatang';
  catatan: string;
  isAutoDetected: boolean;
  setoranCount: number;
  halaqahNames: string[];
  isScheduled: boolean;
  scheduleInfo?: { jamMulai?: string; jamSelesai?: string; halaqahNama?: string };
  isToday: boolean;
  isPast: boolean;
  updatedByAdminNama?: string;
  updatedAt?: string;
}

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDO_DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const GuruMonthlyAttendanceList: React.FC<GuruMonthlyAttendanceProps> = ({
  myUser,
  myGuruObj,
  myHalaqah,
  variant = 'full',
  onNavigateToFull,
  formatIndonesianDate: formatIndonesianDateProp
}) => {
  const {
    gurus = [],
    halaqahs = [],
    siswas = [],
    setorans = [],
    guruAttendance = [],
    guruSchedules = [],
    currentSession,
    selectedGuruHalaqahId,
    setSelectedGuruHalaqahId
  } = useApp();

  // Resolve Teacher identity
  const teacherId = myUser?.id || myGuruObj?.id || currentSession?.user?.id || '';
  const teacherName = myUser?.namaLengkap || myGuruObj?.namaLengkap || currentSession?.user?.namaLengkap || '';

  const matchedGuru = useMemo(() => {
    return (gurus || []).find(g => 
      (teacherId && g.id === teacherId) ||
      (teacherName && g.namaLengkap && g.namaLengkap.toLowerCase().trim() === teacherName.toLowerCase().trim()) ||
      (myUser?.email && g.email && g.email.toLowerCase().trim() === myUser.email.toLowerCase().trim())
    );
  }, [gurus, teacherId, teacherName, myUser]);

  const teacherIds = useMemo(() => {
    const s = new Set<string>();
    if (teacherId) s.add(teacherId);
    if (myGuruObj?.id) s.add(myGuruObj.id);
    if (matchedGuru?.id) s.add(matchedGuru.id);
    return s;
  }, [teacherId, myGuruObj, matchedGuru]);

  const teacherNames = useMemo(() => {
    const s = new Set<string>();
    if (teacherName) s.add(teacherName.toLowerCase().trim());
    if (myGuruObj?.namaLengkap) s.add(myGuruObj.namaLengkap.toLowerCase().trim());
    if (matchedGuru?.namaLengkap) s.add(matchedGuru.namaLengkap.toLowerCase().trim());
    return s;
  }, [teacherName, myGuruObj, matchedGuru]);

  const displayTeacherName = matchedGuru?.namaLengkap || teacherName || 'Guru Pembimbing';

  // Daftar halaqah lembaga (selain halaqah pribadi) yang dibimbing oleh guru ini
  const teacherHalaqahs = useMemo(() => {
    const tId = teacherId;
    const tName = normalizeTeacherName(displayTeacherName);

    const list = (halaqahs || []).filter(h => {
      if (isPrivateHalaqah(h)) return false;
      if (h.sourceType === 'private_halaqah') return false;
      if (h.namaHalaqah && h.namaHalaqah.toLowerCase().includes('pribadi')) return false;

      return isHalaqahBelongingToTeacher(h, { id: tId, namaLengkap: displayTeacherName }, gurus, guruSchedules);
    });

    if (myHalaqah && myHalaqah.id && !isPrivateHalaqah(myHalaqah) && !list.some(h => h.id === myHalaqah.id)) {
      list.unshift(myHalaqah);
    }

    return list;
  }, [halaqahs, teacherId, displayTeacherName, gurus, guruSchedules, myHalaqah]);

  // Filter halaqah yang dipilih: default ke myHalaqah?.id || selectedGuruHalaqahId || halaqah pertama guru || 'all'
  const [filterHalaqahId, setFilterHalaqahId] = useState<string>(() => {
    return myHalaqah?.id || selectedGuruHalaqahId || (teacherHalaqahs[0]?.id ?? 'all');
  });

  // Sinkronisasi otomatis jika induk komponen mengganti myHalaqah atau konteks global selectedGuruHalaqahId berganti
  React.useEffect(() => {
    if (myHalaqah?.id) {
      setFilterHalaqahId(myHalaqah.id);
    } else if (selectedGuruHalaqahId) {
      setFilterHalaqahId(selectedGuruHalaqahId);
    }
  }, [myHalaqah?.id, selectedGuruHalaqahId]);

  const activeHalaqahObj = useMemo(() => {
    if (filterHalaqahId === 'all') return null;
    return halaqahs.find(h => h.id === filterHalaqahId) || (myHalaqah?.id === filterHalaqahId ? myHalaqah : null);
  }, [filterHalaqahId, halaqahs, myHalaqah]);

  const handleHalaqahChange = (hId: string) => {
    setFilterHalaqahId(hId);
    if (hId !== 'all' && setSelectedGuruHalaqahId) {
      setSelectedGuruHalaqahId(hId);
    }
  };

  // Active Month & Year state
  const today = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [selectedYear, setSelectedYear] = useState<number>(() => today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today.getMonth() + 1); // 1-12

  // View mode and filters
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Hadir' | 'Izin' | 'Sakit' | 'Tanpa Keterangan'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // List view 5-row scrollable vs full view states
  const [isTableFullView, setIsTableFullView] = useState<boolean>(false);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const [isDashboardFullView, setIsDashboardFullView] = useState<boolean>(false);
  const dashboardContainerRef = useRef<HTMLDivElement | null>(null);

  const handleToggleTableFullView = (expanded: boolean) => {
    setIsTableFullView(expanded);
    if (!expanded && tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Month navigation helpers
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === (today.getMonth() + 1);
  const selectedYearMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthName = INDO_MONTHS[selectedMonth - 1] || '';

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (formatIndonesianDateProp) return formatIndonesianDateProp(dateStr);
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    if (isNaN(date.getTime())) return dateStr;
    const dayName = INDO_DAYS[date.getDay()];
    const mName = INDO_MONTHS[m];
    return `${dayName}, ${d} ${mName} ${y}`;
  };

  // Scheduled days from guruSchedules for this teacher (filtered by halaqah yang dipilih)
  const teacherSchedules = useMemo(() => {
    return (guruSchedules || []).filter(sch => {
      const matchId = sch.guruId && teacherIds.has(sch.guruId);
      const matchName = sch.guruNama && teacherNames.has(sch.guruNama.toLowerCase().trim());
      if (!(matchId || matchName)) return false;
      if (sch.status === StatusAktif.NON_AKTIF || (sch.status as any) === 'nonaktif' || (sch.status as any) === 'Nonaktif') return false;

      // Filter berdasarkan halaqah yang dipilih jika bukan 'all'
      if (filterHalaqahId !== 'all') {
        const curHId = filterHalaqahId;
        const curHName = (activeHalaqahObj?.namaHalaqah || '').toLowerCase().trim();
        if (sch.halaqahId && curHId && sch.halaqahId !== curHId) {
          return false;
        }
        if (sch.halaqahNama && curHName && sch.halaqahNama.toLowerCase().trim() !== curHName && !sch.halaqahId) {
          return false;
        }
      }

      return true;
    });
  }, [guruSchedules, teacherIds, teacherNames, filterHalaqahId, activeHalaqahObj]);

  const scheduledDaysMap = useMemo(() => {
    const map = new Map<string, { jamMulai: string; jamSelesai: string; halaqahNama?: string }>();
    teacherSchedules.forEach(sch => {
      if (sch.hari) {
        map.set(sch.hari, {
          jamMulai: sch.jamMulai || '',
          jamSelesai: sch.jamSelesai || '',
          halaqahNama: sch.halaqahNama || ''
        });
      }
    });
    return map;
  }, [teacherSchedules]);

  // Compile monthly attendance records - STRICT PARITY with Admin & filtered by halaqah yang dipilih
  const monthlyData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    // Map: id santri -> halaqahId santri
    const studentHalaqahMap = new Map<string, string>();
    (siswas || []).forEach(s => {
      if (s.id && s.halaqahId) {
        studentHalaqahMap.set(s.id, s.halaqahId);
      }
    });

    // 1. Group student setorans by date + halaqah for this teacher in the selected active month
    // Exclude private halaqahs and filter by selected halaqah
    const setoranByKey = new Map<string, {
      date: string;
      count: number;
      halaqahId: string;
      halaqahIds: Set<string>;
      halaqahNames: Set<string>;
    }>();

    (setorans || []).forEach(s => {
      if (!s.tanggalSetoran || !s.tanggalSetoran.startsWith(selectedYearMonthStr)) return;
      if (isPrivateSetoran(s, halaqahs, siswas)) return; // Exclude private halaqah

      const setoranHId = s.halaqahId || studentHalaqahMap.get(s.siswaId || '') || '';
      const matchedHal = (halaqahs || []).find(h =>
        (setoranHId && h.id === setoranHId) ||
        (s.halaqahNama && h.namaHalaqah && normalizeHalaqahKey(s.halaqahNama) === normalizeHalaqahKey(h.namaHalaqah))
      );
      const resolvedHId = matchedHal?.id || setoranHId || '';
      const resolvedHNama = matchedHal?.namaHalaqah || s.halaqahNama || '';

      // Filter berdasarkan halaqah yang dipilih jika bukan 'all'
      if (filterHalaqahId !== 'all') {
        const matchHalaqahId = Boolean(resolvedHId && resolvedHId === filterHalaqahId);
        const matchHalaqahName = Boolean(
          activeHalaqahObj?.namaHalaqah &&
          resolvedHNama &&
          normalizeHalaqahKey(resolvedHNama) === normalizeHalaqahKey(activeHalaqahObj.namaHalaqah)
        );
        if (!matchHalaqahId && !matchHalaqahName) return;
      }

      let gId = s.guruId || '';
      let gNama = s.guruNama || '';

      if (!gId && gNama) {
        const found = (gurus || []).find(g => g.namaLengkap && g.namaLengkap.toLowerCase().trim() === gNama.toLowerCase().trim());
        if (found) gId = found.id;
      }
      if (gId && !gNama) {
        const found = (gurus || []).find(g => g.id === gId);
        if (found) gNama = found.namaLengkap;
      }

      if (!gId && !gNama) return;

      const isTeacher = (gId && teacherIds.has(gId)) ||
        (gNama && teacherNames.has(gNama.toLowerCase().trim()));
      if (!isTeacher) return;

      const date = s.tanggalSetoran;
      const groupKey = `${date}_${resolvedHId || 'general'}`;
      if (!setoranByKey.has(groupKey)) {
        setoranByKey.set(groupKey, {
          date,
          count: 0,
          halaqahId: resolvedHId,
          halaqahIds: new Set<string>(),
          halaqahNames: new Set<string>()
        });
      }
      const item = setoranByKey.get(groupKey)!;
      item.count += 1;
      if (resolvedHId) item.halaqahIds.add(resolvedHId);
      if (resolvedHNama) item.halaqahNames.add(resolvedHNama);
    });

    // 2. Map manual guruAttendance entries for this teacher in the selected active month
    const manualByKey = new Map<string, any>();
    (guruAttendance || []).forEach(att => {
      if (!att.tanggal || !att.tanggal.startsWith(selectedYearMonthStr)) return;
      // Skip student attendance records without guruId
      if (att.siswaId && !att.guruId) return;

      let gNama = (att.guruNama || '').trim();
      let gId = (att.guruId || '').trim();

      if (!gNama && gId) {
        const found = (gurus || []).find(g => g.id === gId);
        if (found) gNama = found.namaLengkap;
      } else if (!gId && gNama) {
        const found = (gurus || []).find(g => g.namaLengkap && g.namaLengkap.toLowerCase().trim() === gNama.toLowerCase().trim());
        if (found) gId = found.id;
      }

      // Skip phantom "Guru" corrupt records
      if (!gNama || gNama.toLowerCase() === 'guru') {
        const found = (gurus || []).find(g => g.id === gId);
        if (found) {
          gNama = found.namaLengkap;
        } else {
          return;
        }
      }

      const isTeacher = (gId && teacherIds.has(gId)) ||
        (gNama && teacherNames.has(gNama.toLowerCase().trim()));
      if (!isTeacher) return;

      const rawAttHId = (att.halaqahId || '').trim();
      const isGlobalMarker = rawAttHId.toLowerCase() === 'all' || rawAttHId.toLowerCase() === 'semua';
      let resolvedAttHId = isGlobalMarker ? '' : rawAttHId;
      let resolvedAttHNama = (att.halaqahNama || '').trim();
      if (!resolvedAttHId && resolvedAttHNama && !resolvedAttHNama.toLowerCase().startsWith('semua halaqah')) {
        const matchedHal = (halaqahs || []).find(h => normalizeHalaqahKey(h.namaHalaqah) === normalizeHalaqahKey(resolvedAttHNama));
        if (matchedHal) {
          resolvedAttHId = matchedHal.id;
          resolvedAttHNama = matchedHal.namaHalaqah;
        }
      } else if (resolvedAttHId && !resolvedAttHNama) {
        const matchedHal = (halaqahs || []).find(h => h.id === resolvedAttHId);
        if (matchedHal) resolvedAttHNama = matchedHal.namaHalaqah;
      }

      // Filter berdasarkan halaqah yang dipilih jika bukan 'all'
      if (filterHalaqahId !== 'all') {
        if (resolvedAttHId && resolvedAttHId !== filterHalaqahId) {
          return;
        }
        if (!resolvedAttHId && resolvedAttHNama && activeHalaqahObj?.namaHalaqah && !resolvedAttHNama.toLowerCase().startsWith('semua halaqah')) {
          if (normalizeHalaqahKey(resolvedAttHNama) !== normalizeHalaqahKey(activeHalaqahObj.namaHalaqah)) {
            return;
          }
        }
      }

      const key = `${att.tanggal}${resolvedAttHId ? `_${resolvedAttHId}` : ''}`;
      const existing = manualByKey.get(key);
      // Do not let a global record overwrite an existing specific record in single-halaqah view
      if (existing && !resolvedAttHId && existing.halaqahId) return;

      manualByKey.set(key, {
        ...att,
        guruId: gId,
        guruNama: gNama,
        halaqahId: resolvedAttHId,
        halaqahNama: resolvedAttHNama,
        id: att.id || `att-manual-${att.tanggal}-${gId || gNama}${resolvedAttHId ? `-${resolvedAttHId}` : ''}`
      });
    });

    // 3. Combine records EXACTLY as compiledGuruAttendance in Admin
    const allRecords: GuruAttendanceDayRecord[] = [];
    const defaultHalaqahName = activeHalaqahObj?.namaHalaqah || myHalaqah?.namaHalaqah;

    // Combine from setoranByKey (auto-detected presence or manual overrides per halaqah)
    setoranByKey.forEach((val) => {
      const dateStr = val.date;
      const parts = dateStr.split('-');
      const dayNum = parseInt(parts[2], 10);
      const dObj = new Date(selectedYear, selectedMonth - 1, dayNum);
      const dayName = INDO_DAYS[dObj.getDay()];
      const isScheduled = scheduledDaysMap.has(dayName);
      const scheduleInfo = scheduledDaysMap.get(dayName);
      const isToday = dateStr === todayDateStr;
      const isPast = dateStr < todayDateStr;

      const specificKey = `${dateStr}_${val.halaqahId || 'general'}`;
      const globalKey = dateStr;
      const manualRecord = manualByKey.get(specificKey) || manualByKey.get(globalKey);
      const hNames = Array.from(val.halaqahNames);

      if (manualRecord) {
        allRecords.push({
          id: manualRecord.id || `manual-${specificKey}`,
          dateStr,
          dayNumber: dayNum,
          dayName,
          status: (manualRecord.status as any) || 'Hadir',
          catatan: manualRecord.catatan || (val.count > 0 ? `Tercatat ${val.count} setoran santri` : ''),
          isAutoDetected: false,
          setoranCount: val.count,
          halaqahNames: hNames.length > 0 ? hNames : (manualRecord.halaqahNama ? [manualRecord.halaqahNama] : (defaultHalaqahName ? [defaultHalaqahName] : [])),
          isScheduled,
          scheduleInfo,
          isToday,
          isPast,
          updatedByAdminNama: manualRecord.updatedByAdminNama,
          updatedAt: manualRecord.updatedAt
        });
        if (manualByKey.has(specificKey)) manualByKey.delete(specificKey);
        else if (manualByKey.has(globalKey)) manualByKey.delete(globalKey);
      } else {
        allRecords.push({
          id: `auto-${specificKey}-${displayTeacherName}`,
          dateStr,
          dayNumber: dayNum,
          dayName,
          status: 'Hadir',
          catatan: `Otomatis dari Riwayat Setoran: Guru membimbing ${val.count} setoran santri`,
          isAutoDetected: true,
          setoranCount: val.count,
          halaqahNames: hNames.length > 0 ? hNames : (defaultHalaqahName ? [defaultHalaqahName] : []),
          isScheduled,
          scheduleInfo,
          isToday,
          isPast
        });
      }
    });

    // Add remaining manual records that had NO student setorans on that date (Sakit, Izin, Alpha, or manual Hadir)
    manualByKey.forEach((manualRecord) => {
      const dateStr = manualRecord.tanggal;
      const parts = dateStr.split('-');
      const dayNum = parseInt(parts[2], 10);
      const dObj = new Date(selectedYear, selectedMonth - 1, dayNum);
      const dayName = INDO_DAYS[dObj.getDay()];
      const isScheduled = scheduledDaysMap.has(dayName);
      const scheduleInfo = scheduledDaysMap.get(dayName);
      const isToday = dateStr === todayDateStr;
      const isPast = dateStr < todayDateStr;

      allRecords.push({
        id: manualRecord.id || `manual-${dateStr}-${manualRecord.halaqahId || 'general'}`,
        dateStr,
        dayNumber: dayNum,
        dayName,
        status: (manualRecord.status as any) || 'Sakit',
        catatan: manualRecord.catatan || '',
        isAutoDetected: false,
        setoranCount: 0,
        halaqahNames: manualRecord.halaqahNama ? [manualRecord.halaqahNama] : (defaultHalaqahName ? [defaultHalaqahName] : []),
        isScheduled,
        scheduleInfo,
        isToday,
        isPast,
        updatedByAdminNama: manualRecord.updatedByAdminNama,
        updatedAt: manualRecord.updatedAt
      });
    });

    // Sort by date descending (matching Admin: b.tanggal.localeCompare(a.tanggal))
    allRecords.sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    // Calculate Summary Stats matching Admin metrics
    const hadirRecords = allRecords.filter(r => r.status === 'Hadir');
    const izinRecords = allRecords.filter(r => r.status === 'Izin');
    const sakitRecords = allRecords.filter(r => r.status === 'Sakit');
    const alphaRecords = allRecords.filter(r => r.status === 'Tanpa Keterangan' || (r.status as any) === 'Alpha');

    const totalHadir = hadirRecords.length;
    const totalIzin = izinRecords.length;
    const totalSakit = sakitRecords.length;
    const totalAlpha = alphaRecords.length;

    const totalConsidered = totalHadir + totalIzin + totalSakit + totalAlpha;
    const persentaseHadir = totalConsidered > 0 ? Math.round((totalHadir / totalConsidered) * 100) : (totalHadir > 0 ? 100 : 0);

    const totalSetoranSantri = allRecords.reduce((acc, r) => acc + r.setoranCount, 0);

    // Today's status for this teacher
    const todayRecord = allRecords.find(r => r.dateStr === todayDateStr);
    const todayStatus = todayRecord ? todayRecord.status : (scheduledDaysMap.has(INDO_DAYS[today.getDay()]) ? 'Belum Presensi' : 'Tidak Ada Jadwal');

    return {
      allRecords,
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlpha,
      totalConsidered,
      persentaseHadir,
      totalSetoranSantri,
      todayRecord,
      todayStatus,
      daysInMonth
    };
  }, [
    setorans,
    guruAttendance,
    gurus,
    halaqahs,
    siswas,
    selectedYear,
    selectedMonth,
    selectedYearMonthStr,
    teacherIds,
    teacherNames,
    displayTeacherName,
    scheduledDaysMap,
    todayDateStr,
    today,
    myHalaqah,
    filterHalaqahId,
    activeHalaqahObj
  ]);

  // Filtered records for display
  const filteredRecords = useMemo(() => {
    return monthlyData.allRecords.filter(r => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'Tanpa Keterangan') {
          if (r.status !== 'Tanpa Keterangan' && (r.status as any) !== 'Alpha') return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDate = r.dateStr.includes(q) || r.dayName.toLowerCase().includes(q);
        const matchCatatan = r.catatan.toLowerCase().includes(q);
        const matchHalaqah = r.halaqahNames.some(h => h.toLowerCase().includes(q));
        const matchStatus = r.status.toLowerCase().includes(q);
        if (!matchDate && !matchCatatan && !matchHalaqah && !matchStatus) return false;
      }

      return true;
    });
  }, [monthlyData.allRecords, statusFilter, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const records = monthlyData.allRecords;
    if (!records || records.length === 0) {
      alert('Tidak ada data kehadiran guru untuk diekspor pada bulan ini.');
      return;
    }

    let csv = 'No,Tanggal,Hari,Status,Keterangan,Jumlah Setoran Santri,Halaqah,Sumber Data\n';
    records.forEach((r, idx) => {
      const cleanCatatan = (r.catatan || '').replace(/"/g, '""');
      const cleanHalaqah = (r.halaqahNames.join('; ') || '-').replace(/"/g, '""');
      const sumber = r.isAutoDetected ? 'Otomatis dari Setoran' : (r.updatedByAdminNama ? `Diinput Admin (${r.updatedByAdminNama})` : 'Diinput Admin');
      csv += `"${idx + 1}","${r.dateStr}","${r.dayName}","${r.status}","${cleanCatatan}","${r.setoranCount}","${cleanHalaqah}","${sumber}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Kehadiran_Guru_${displayTeacherName.replace(/\s+/g, '_')}_${selectedYearMonthStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hadir':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border border-green-200/80 dark:border-green-800">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Hadir
          </span>
        );
      case 'Izin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Izin
          </span>
        );
      case 'Sakit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Sakit
          </span>
        );
      case 'Tanpa Keterangan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Alpha
          </span>
        );
      case 'Belum Presensi':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Hari Ini
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  // =========================================================================
  // VARIANT: DASHBOARD COMPACT WIDGET
  // =========================================================================
  if (variant === 'dashboard') {
    const recentRecords = monthlyData.allRecords;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden transition-all duration-300">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                  Kehadiran Guru (Bulan Aktif)
                </h3>
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 font-mono">
                  {monthName} {selectedYear}
                </span>
                {teacherHalaqahs.length > 1 ? (
                  <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                    <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <select
                      value={filterHalaqahId}
                      onChange={(e) => handleHalaqahChange(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                      title="Pilih Halaqah"
                    >
                      <option value="all">Semua Halaqah</option>
                      {teacherHalaqahs.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.namaHalaqah}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <BookOpen className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    {activeHalaqahObj?.namaHalaqah || myHalaqah?.namaHalaqah || 'Halaqah Bimbingan'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pemantauan keaktifan &amp; rekap kehadiran mengajar halaqah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onNavigateToFull && (
              <button
                type="button"
                onClick={onNavigateToFull}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Selengkapnya</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Status Hari Ini Banner */}
        <div className="mt-4 p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-emerald-50/40 dark:from-slate-850 dark:to-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              monthlyData.todayStatus === 'Hadir' 
                ? 'bg-green-500 text-white shadow-xs' 
                : 'bg-amber-500 text-white shadow-xs'
            }`}>
              {monthlyData.todayStatus === 'Hadir' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status Hari Ini:
                </span>
                {getStatusBadge(monthlyData.todayStatus)}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                {monthlyData.todayStatus === 'Hadir' ? (
                  <span>Alhamdulillah, kehadiran Anda hari ini telah tercatat di sistem.</span>
                ) : (
                  <span>Kehadiran tercatat otomatis saat menyimak setoran santri. Jika berhalangan (izin/sakit), silakan sampaikan alasannya kepada Admin.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Mini Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
          <div className="p-3 bg-green-50/60 dark:bg-green-950/30 rounded-xl border border-green-200/60 dark:border-green-900/40 text-center">
            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider block">Hadir</span>
            <span className="text-xl sm:text-2xl font-black text-green-800 dark:text-green-200 mt-0.5 block">{monthlyData.totalHadir} Hari</span>
            <span className="text-[10px] text-green-600 dark:text-green-400 block mt-0.5 font-medium">{monthlyData.totalSetoranSantri} Setoran</span>
          </div>
          <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-200/60 dark:border-sky-900/40 text-center">
            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">Izin</span>
            <span className="text-xl sm:text-2xl font-black text-sky-800 dark:text-sky-200 mt-0.5 block">{monthlyData.totalIzin} Hari</span>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 block mt-0.5 font-medium">Izin Resmi</span>
          </div>
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-center">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Sakit</span>
            <span className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-200 mt-0.5 block">{monthlyData.totalSakit} Hari</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium">Keterangan Sakit</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Persentase</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 block">{monthlyData.persentaseHadir}%</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">Tingkat Disiplin</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Tingkat Kehadiran Bulan Ini</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{monthlyData.persentaseHadir}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, monthlyData.persentaseHadir))}%` }}
            />
          </div>
        </div>

        {/* Recent Attendance List */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Riwayat Kehadiran Terbaru Bulan Ini:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Total {recentRecords.length} Catatan
            </span>
          </div>

          {recentRecords.length > 0 ? (
            <div className="space-y-2.5">
              <div 
                ref={dashboardContainerRef}
                className={`space-y-2 transition-all duration-300 ${
                  !isDashboardFullView 
                    ? 'max-h-[305px] overflow-y-auto pr-1 custom-scrollbar' 
                    : 'max-h-none overflow-visible'
                }`}
              >
                {recentRecords.map(item => (
                  <div 
                    key={item.dateStr}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:border-slate-200 dark:hover:border-slate-700 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatDate(item.dateStr)}
                        </span>
                        {item.isToday && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Hari Ini
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.catatan || (item.setoranCount > 0 ? `Membimbing ${item.setoranCount} setoran santri` : 'Presensi kehadiran')}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>

              {recentRecords.length > 5 && (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    {!isDashboardFullView ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Mode 5 baris (scroll untuk melihat seluruh {recentRecords.length} catatan)</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                        <span>Menampilkan seluruh {recentRecords.length} catatan</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isDashboardFullView;
                      setIsDashboardFullView(nextState);
                      if (!nextState && dashboardContainerRef.current) {
                        dashboardContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                      !isDashboardFullView
                        ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {!isDashboardFullView ? (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Lihat Lengkap ({recentRecords.length})</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Sembunyikan / Kembali ke 5 Baris</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              Belum ada riwayat kehadiran guru yang tercatat pada bulan {monthName} {selectedYear}.
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VARIANT: FULL COMPREHENSIVE COMPONENT (FOR GURU ABSENSI)
  // =========================================================================
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm transition-all duration-300 overflow-hidden">
      
      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Teacher Details */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Daftar Kehadiran Guru (Bulan Aktif)
                </h3>
                <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700 font-mono">
                  {displayTeacherName}
                </span>
                {teacherHalaqahs.length > 1 ? (
                  <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-emerald-300/70 dark:border-emerald-700/80 text-xs shadow-xs">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <select
                      value={filterHalaqahId}
                      onChange={(e) => handleHalaqahChange(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
                      title="Pilih Halaqah Bimbingan"
                    >
                      <option value="all">Semua Halaqah Guru</option>
                      {teacherHalaqahs.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.namaHalaqah}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {activeHalaqahObj?.namaHalaqah || myHalaqah?.namaHalaqah || 'Halaqah Bimbingan'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Rekapitulasi log kehadiran bimbingan {activeHalaqahObj ? `(${activeHalaqahObj.namaHalaqah})` : ''}, verifikasi kedisiplinan mengajar, dan riwayat presensi harian guru.
              </p>
            </div>
          </div>

          {/* Month Selector & Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Prev Month */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Current Month Dropdown/Indicator */}
            <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 shadow-xs">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-200 whitespace-nowrap">
                {monthName} {selectedYear}
              </span>
              {isCurrentMonth && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">
                  Aktif
                </span>
              )}
            </div>

            {/* Next Month */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
              title="Bulan Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentMonth && (
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Kembali ke Bulan Berjalan"
              >
                Bulan Ini
              </button>
            )}

            {/* Collapse/Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
              title={isExpanded ? 'Sembunyikan Rincian' : 'Buka Rincian Kehadiran'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Status & Actions Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Presensi Hari Ini:
            </span>
            {getStatusBadge(monthlyData.todayStatus)}
            {monthlyData.todayRecord && monthlyData.todayRecord.setoranCount > 0 && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ({monthlyData.todayRecord.setoranCount} setoran disimak)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60 rounded-xl text-[11px] font-medium">
              <Info className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>Input izin/ketidakhadiran guru terpusat oleh Admin</span>
            </span>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Unduh data kehadiran guru dalam format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Tingkat Kehadiran */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
                  Tingkat Kehadiran Bulan Ini
                </span>
                <Award className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight">{monthlyData.persentaseHadir}%</span>
                <span className="text-xs text-emerald-100 font-medium">Disiplin Mengajar</span>
              </div>
              <div className="space-y-1">
                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, monthlyData.persentaseHadir))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-emerald-100">
                  <span>{monthlyData.totalHadir} Hadir dari {monthlyData.totalConsidered} Catatan Kehadiran</span>
                  <span>Target 100%</span>
                </div>
              </div>
            </div>

            {/* Card 2: Hadir */}
            <div className="p-4 rounded-2xl bg-green-50/70 dark:bg-green-950/30 border border-green-200/80 dark:border-green-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-green-700 dark:text-green-300">
                <span className="text-[10px] font-bold uppercase tracking-wider">Hadir</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-green-800 dark:text-green-200">
                  {monthlyData.totalHadir} <span className="text-xs font-semibold text-green-600 dark:text-green-400">Hari</span>
                </div>
                <p className="text-[11px] text-green-700 dark:text-green-400 mt-0.5">
                  {monthlyData.totalSetoranSantri} Setoran santri disimak
                </p>
              </div>
            </div>

            {/* Card 3: Izin */}
            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-sky-700 dark:text-sky-300">
                <span className="text-[10px] font-bold uppercase tracking-wider">Izin</span>
                <FileText className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-sky-800 dark:text-sky-200">
                  {monthlyData.totalIzin} <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Hari</span>
                </div>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">
                  Izin terkonfirmasi
                </p>
              </div>
            </div>

            {/* Card 4: Sakit */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
                <span className="text-[10px] font-bold uppercase tracking-wider">Sakit</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-200">
                  {monthlyData.totalSakit} <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Hari</span>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  Keterangan sakit
                </p>
              </div>
            </div>

            {/* Card 5: Alpha */}
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
                <span className="text-[10px] font-bold uppercase tracking-wider">Alpha</span>
                <XCircle className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-rose-800 dark:text-rose-200">
                  {monthlyData.totalAlpha} <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Hari</span>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                  Tanpa keterangan
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Search, Filter Tabs & View Toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { key: 'all', label: `Semua (${monthlyData.allRecords.length})` },
                { key: 'Hadir', label: `Hadir (${monthlyData.totalHadir})` },
                { key: 'Izin', label: `Izin (${monthlyData.totalIzin})` },
                { key: 'Sakit', label: `Sakit (${monthlyData.totalSakit})` },
                { key: 'Tanpa Keterangan', label: `Alpha (${monthlyData.totalAlpha})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search and View Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tanggal, catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Daftar
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Kalender
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: DAFTAR RIWAYAT KEHADIRAN (TABLE / LIST) */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredRecords.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
                  
                  {/* Top Bar for View Mode & Action */}
                  <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      {!isTableFullView ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-300/60 dark:border-emerald-800 text-[11px]">
                            <ListFilter className="w-3 h-3" />
                            Tampilan 5 Baris
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {filteredRecords.length > 5 ? (
                              <>Scroll / gulir ke bawah pada tabel untuk melihat data lainnya (Total {filteredRecords.length} data)</>
                            ) : (
                              <>Menampilkan seluruh {filteredRecords.length} baris data</>
                            )}
                            {activeHalaqahObj ? ` • Halaqah: ${activeHalaqahObj.namaHalaqah}` : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-300/60 dark:border-sky-800 text-[11px]">
                            <Eye className="w-3 h-3" />
                            Tampilan Lengkap
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Menampilkan seluruh {filteredRecords.length} baris data tanpa scroll
                            {activeHalaqahObj ? ` • Halaqah: ${activeHalaqahObj.namaHalaqah}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {filteredRecords.length > 5 && (
                      <button
                        type="button"
                        onClick={() => handleToggleTableFullView(!isTableFullView)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                          !isTableFullView
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {!isTableFullView ? (
                          <>
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Lihat Lengkap ({filteredRecords.length} Baris)</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <Minimize2 className="w-3.5 h-3.5" />
                            <span>Sembunyikan / Kembali ke 5 Baris</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Scrollable Container: 5 rows height with scroll when not in full view */}
                  <div 
                    ref={tableContainerRef}
                    className={`overflow-x-auto transition-all duration-300 ${
                      !isTableFullView 
                        ? 'max-h-[295px] overflow-y-auto custom-scrollbar' 
                        : 'max-h-none overflow-y-visible'
                    }`}
                  >
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] shadow-xs">
                        <tr>
                          <th className="py-3 px-4">Tanggal &amp; Hari</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Keterangan / Aktivitas</th>
                          <th className="py-3 px-4">Bimbingan Santri</th>
                          <th className="py-3 px-4">Halaqah</th>
                          <th className="py-3 px-4 text-right">Sumber Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredRecords.map((rec) => {
                          return (
                            <tr 
                              key={rec.dateStr}
                              className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
                                rec.isToday ? 'bg-emerald-50/30 dark:bg-emerald-950/15' : ''
                              }`}
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {rec.dayName}, {rec.dayNumber} {monthName} {selectedYear}
                                  </span>
                                  {rec.isToday && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                                      Hari Ini
                                    </span>
                                  )}
                                  {rec.isScheduled && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50" title="Jadwal mengajar resmi">
                                      Terjadwal
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                {getStatusBadge(rec.status)}
                              </td>

                              <td className="py-3 px-4">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {rec.catatan || '-'}
                                </span>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                {rec.setoranCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {rec.setoranCount} Setoran
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                {rec.halaqahNames.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {rec.halaqahNames.map((h, i) => (
                                      <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {h}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {rec.isAutoDetected ? (
                                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800" title="Otomatis terekam saat guru menyimak setoran santri">
                                    ⚡ Otomatis Riwayat ({rec.setoranCount} setoran)
                                  </span>
                                ) : rec.updatedByAdminNama ? (
                                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full" title={`Diinput oleh Admin: ${rec.updatedByAdminNama}`}>
                                    ✍️ Admin ({rec.updatedByAdminNama})
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    ✍️ Diinput Admin
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Footer Info */}
                  <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-850/80 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    {!isTableFullView ? (
                      <span>
                        {filteredRecords.length > 5 ? (
                          <>Menampilkan mode 5 baris • Silakan scroll tabel ke bawah untuk melihat sisa baris lainnya ({filteredRecords.length} total baris)</>
                        ) : (
                          <>Menampilkan seluruh {filteredRecords.length} baris data</>
                        )}
                      </span>
                    ) : (
                      <span>
                        Seluruh {filteredRecords.length} baris data sedang ditampilkan penuh
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                    Tidak ada catatan kehadiran yang cocok dengan filter.
                  </p>
                  <p className="text-xs mt-1">
                    Silakan ubah filter status atau sampaikan alasan ketidakhadiran kepada Admin jika diperlukan pencatatan khusus.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: KALENDER BULANAN INTERAKTIF */}
          {viewMode === 'calendar' && (
            <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {/* Day Headers (Ahad .. Sabtu) */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d, i) => (
                  <div key={d} className={`py-1.5 ${i === 5 ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {(() => {
                  const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
                  const totalDays = monthlyData.daysInMonth;
                  const cells = [];

                  // Empty padding before day 1
                  for (let p = 0; p < firstDayIndex; p++) {
                    cells.push(
                      <div key={`empty-${p}`} className="h-16 sm:h-20 rounded-xl bg-transparent opacity-0 pointer-events-none" />
                    );
                  }

                  // Day cells
                  for (let day = 1; day <= totalDays; day++) {
                    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const rec = monthlyData.allRecords.find(r => r.dateStr === dateStr);
                    const isToday = dateStr === todayDateStr;
                    const dObj = new Date(selectedYear, selectedMonth - 1, day);
                    const dayName = INDO_DAYS[dObj.getDay()];
                    const isScheduled = scheduledDaysMap.has(dayName);

                    let bgClass = 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800';
                    let dotColor = '';

                    if (rec) {
                      if (rec.status === 'Hadir') {
                        bgClass = 'bg-green-50/70 dark:bg-green-950/40 border-green-300 dark:border-green-800';
                        dotColor = 'bg-green-500';
                      } else if (rec.status === 'Izin') {
                        bgClass = 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800';
                        dotColor = 'bg-sky-500';
                      } else if (rec.status === 'Sakit') {
                        bgClass = 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
                        dotColor = 'bg-amber-500';
                      } else if (rec.status === 'Tanpa Keterangan') {
                        bgClass = 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
                        dotColor = 'bg-rose-500';
                      }
                    }

                    cells.push(
                      <div
                        key={dateStr}
                        className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition ${bgClass} ${
                          isToday ? 'ring-2 ring-emerald-500 shadow-xs' : ''
                        }`}
                        title={`${formatDate(dateStr)}: ${rec?.status || 'Belum presensi'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${
                            isToday 
                              ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono' 
                              : 'text-slate-700 dark:text-slate-200'
                          }`}>
                            {day}
                          </span>
                          {isScheduled && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Jadwal mengajar" />
                          )}
                        </div>

                        {rec ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                              <span className="text-[10px] font-bold truncate text-slate-800 dark:text-slate-200">
                                {rec.status}
                              </span>
                            </div>
                            {rec.setoranCount > 0 && (
                              <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold block truncate">
                                {rec.setoranCount} setoran
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">
                            -
                          </span>
                        )}
                      </div>
                    );
                  }

                  return cells;
                })()}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span>Hadir</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>Izin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Sakit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Alpha / Tanpa Keterangan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Hari Terjadwal Bimbingan</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
