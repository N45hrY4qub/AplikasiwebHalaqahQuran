import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Info,
  CalendarDays,
  UserCheck,
  UserX,
  AlertCircle,
  FileSpreadsheet,
  Download,
  CalendarCheck,
  Calendar,
  X,
  Plus,
  Trash2,
  Users,
  Clock,
  RefreshCw,
  TrendingUp,
  Check,
  Save,
  Search,
  Eye,
  ListFilter,
  RotateCcw,
  Lock,
  CalendarOff,
  HeartPulse,
  AlertTriangle
} from 'lucide-react';
import { StatusAktif, Siswa } from '../types';
import { GuruMonthlyAttendanceList } from './GuruMonthlyAttendanceList';
import { isHalaqahScheduledOnDayIndex, getActiveSchedulesForHalaqah, getTeacherHalaqahs, findMatchingGuruAttendanceRecord } from '../utils/studentAttendanceHelper';
export interface AttendanceEntry {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  siswaNama: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  catatan: string;
}


interface GuruAbsensiProps {
  myHalaqah: any;
  myStudents: any[];
  myUser: any;
  myGuruObj: any;
  formatIndonesianDate: (dateStr: string) => string;
  addLog: (action: string, description: string) => void;
}

export const GuruAbsensi: React.FC<GuruAbsensiProps> = ({ 
  myHalaqah, 
  myStudents, 
  myUser, 
  myGuruObj, 
  formatIndonesianDate,
  addLog
}) => {
  const { 
    guruSchedules, 
    setorans, 
    guruAttendance, 
    studentAttendance, 
    saveStudentAttendance,
    halaqahs,
    gurus,
    siswas,
    setSelectedGuruHalaqahId
  } = useApp();

  const teacherHalaqahs = useMemo(() => {
    return getTeacherHalaqahs(halaqahs, myUser, gurus, guruSchedules, siswas);
  }, [halaqahs, myUser, gurus, guruSchedules, siswas]);

  const [attendance, setAttendance] = useState<AttendanceEntry[]>(() => {
    try {
      const local = localStorage.getItem('mh_student_attendance');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return studentAttendance || [];
  });
  
  useEffect(() => {
    if (Array.isArray(studentAttendance)) {
      setAttendance(studentAttendance);
    }
  }, [studentAttendance]);

  const [selectedStudentAttendance, setSelectedStudentAttendance] = useState<any | null>(null);

  // Attendance inputs state
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(() => {
    try {
      const stored = localStorage.getItem('mh_selected_attendance_date');
      if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
        localStorage.removeItem('mh_selected_attendance_date');
        return stored;
      }
    } catch {}
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mh_selected_attendance_date');
      if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
        localStorage.removeItem('mh_selected_attendance_date');
        setSelectedAttendanceDate(stored);
      }
    } catch {}
  }, []);

  const [tempAttendance, setTempAttendance] = useState<Record<string, { status?: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | '', catatan: string }>>(() => {
    const today = new Date().toISOString().split('T')[0];
    const daily = (studentAttendance || []).filter(a => a.tanggal === today);
    const map: Record<string, { status?: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | '', catatan: string }> = {};
    (myStudents || []).forEach(s => {
      const match = daily.find(d => d.siswaId === s.id);
      map[s.id] = {
        status: match ? match.status : '',
        catatan: match ? match.catatan : ''
      };
    });
    return map;
  });
  const [innerAbsensiTab, setInnerAbsensiTab] = useState<'pencatatan' | 'rekap'>('pencatatan');
  const [rekapTimeframe, setRekapTimeframe] = useState<'harian' | 'pekanan' | 'bulanan' | 'kuartal' | 'semester' | 'tahunan'>('bulanan');

  // Calculation for teacher's own attendance status & schedule reminders from Admin
  const teacherAttendanceStatus = useMemo(() => {
    if (!selectedAttendanceDate || !myUser) return null;
    const dateObj = new Date(selectedAttendanceDate);
    const daysMap = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = daysMap[dateObj.getDay()];

    const teacherId = myUser.id || '';
    const teacherName = (myUser.namaLengkap || myGuruObj?.namaLengkap || '').toLowerCase();

    // Schedule on this day
    const scheduleForDay = (guruSchedules || []).find(
      s => s.status === StatusAktif.AKTIF &&
           ((s.guruId && teacherId && s.guruId === teacherId) || (s.guruNama && teacherName && s.guruNama.toLowerCase() === teacherName)) &&
           s.hari === dayName
    );

    // Setorans recorded by this teacher on selectedAttendanceDate
    const setoransOnDate = (setorans || []).filter(set => {
      if (set.tanggalSetoran !== selectedAttendanceDate) return false;
      if (set.guruId && teacherId) return set.guruId === teacherId;
      if (set.guruNama && teacherName) return set.guruNama.toLowerCase() === teacherName;
      return false;
    });

    const setoranCountOnDate = setoransOnDate.length;

    // Check admin override or auto-attendance record for this date (strictly scoped by halaqah)
    const adminAttendanceRecord = findMatchingGuruAttendanceRecord(
      guruAttendance,
      selectedAttendanceDate,
      {
        teacherId,
        teacherName,
        halaqahId: myHalaqah?.id || '',
        halaqahName: myHalaqah?.namaHalaqah || ''
      }
    );

    return {
      dayName,
      scheduleForDay,
      setoranCountOnDate,
      adminAttendanceRecord
    };
  }, [selectedAttendanceDate, guruSchedules, setorans, guruAttendance, myUser, myGuruObj, myHalaqah]);

  // Edit Pertemuan & Rincian states
  const [isEditPertemuanModalOpen, setIsEditPertemuanModalOpen] = useState(false);
  const [newEffectiveDate, setNewEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [editRecDate, setEditRecDate] = useState<string | null>(null);
  const [editRecStatus, setEditRecStatus] = useState<'Hadir' | 'Izin' | 'Sakit' | 'Alpha'>('Hadir');
  const [editRecCatatan, setEditRecCatatan] = useState('');

  // Day order standard for Indonesia (Senin to Ahad)
  const DAY_ORDER: Record<string, number> = {
    'Senin': 1,
    'Selasa': 2,
    'Rabu': 3,
    'Kamis': 4,
    'Jumat': 5,
    'Sabtu': 6,
    'Ahad': 7,
    'Minggu': 7
  };

  // Active schedules assigned to this teacher & halaqah from Admin > HALAQAH > Jadwal Mengajar Guru
  const myActiveSchedules = useMemo(() => {
    const teacherId = myUser?.id || myGuruObj?.id || '';
    const teacherName = myUser?.namaLengkap || myGuruObj?.namaLengkap || '';
    return getActiveSchedulesForHalaqah(myHalaqah, guruSchedules, teacherId, teacherName);
  }, [guruSchedules, myUser, myGuruObj, myHalaqah]);

  // Sorted days list according to chronological day order (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Ahad)
  const scheduledDaysList = useMemo<string[]>(() => {
    if (myActiveSchedules.length > 0) {
      const days = Array.from(new Set<string>(myActiveSchedules.map(s => s.hari)));
      return days.sort((a, b) => (DAY_ORDER[a] || 99) - (DAY_ORDER[b] || 99));
    }

    // Fallback to myHalaqah.hariKegiatan ONLY if explicitly set and not "Belum diatur"
    if (myHalaqah?.hariKegiatan) {
      const raw = myHalaqah.hariKegiatan.toLowerCase();
      if (!raw.includes('belum diatur') && !raw.includes('tidak diatur') && !raw.includes('libur') && !raw.includes('off') && !raw.includes('non-aktif')) {
        const dayWordRegex = /\b(senin|selasa|rabu|kamis|jumat|jum'?at|sabtu|ahad|minggu)\b/gi;
        const matched = myHalaqah.hariKegiatan.match(dayWordRegex);
        if (matched && matched.length > 0) {
          const capitalizedDays: string[] = matched.map(w => {
            const lower = w.toLowerCase().replace("'", "");
            if (lower === 'minggu') return 'Ahad';
            if (lower === 'jumat') return 'Jumat';
            return lower.charAt(0).toUpperCase() + lower.slice(1);
          });
          const uniqueDays = Array.from(new Set<string>(capitalizedDays));
          return uniqueDays.sort((a, b) => (DAY_ORDER[a] || 99) - (DAY_ORDER[b] || 99));
        }
      }
    }

    return [];
  }, [myActiveSchedules, myHalaqah]);

  // Common schedule time summary if available
  const scheduleSummaryTime = useMemo(() => {
    if (myActiveSchedules.length > 0) {
      const times = Array.from(new Set(myActiveSchedules.map(s => `${s.jamMulai} - ${s.jamSelesai}`)));
      if (times.length === 1) return times[0];
      return null;
    }
    if (myHalaqah?.waktuKegiatan) {
      const rawWaktu = myHalaqah.waktuKegiatan.trim();
      const lowerWaktu = rawWaktu.toLowerCase();
      if (!lowerWaktu.includes('sesuai jam operasional') && !lowerWaktu.includes('belum diatur')) {
        return rawWaktu;
      }
    }
    return null;
  }, [myActiveSchedules, myHalaqah]);

  // Helper to parse day name safely from YYYY-MM-DD
  const getDayNameFromDateStr = (dateStr: string): string => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const daysMap = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return daysMap[d.getDay()];
  };

  // Check whether a date matches this teacher's scheduled teaching days
  const isDateInScheduledDays = (dateStr: string, schedules: string[]): boolean => {
    if (!schedules || schedules.length === 0) return true;
    const dayName = getDayNameFromDateStr(dateStr);
    return schedules.includes(dayName) || 
      ((dayName === 'Ahad' || dayName === 'Minggu') && (schedules.includes('Ahad') || schedules.includes('Minggu')));
  };

  // Check whether a date is a scheduled active learning day for this halaqah/teacher
  // as configured by admin in Halaqah > Jadwal Mengajar Guru
  const isDateActiveHalaqahDay = useCallback((dateStr: string): boolean => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayIndex = d.getDay(); // 0 = Ahad, 1 = Senin, ... 6 = Sabtu

    // 1. If teacher has active schedules in scheduledDaysList from Admin > Halaqah > Jadwal Mengajar Guru
    if (scheduledDaysList && scheduledDaysList.length > 0) {
      const daysMap = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = daysMap[dayIndex];
      const schedList = scheduledDaysList as string[];
      return schedList.includes(dayName) ||
        ((dayName === 'Ahad' || dayName === 'Minggu') && (schedList.includes('Ahad') || schedList.includes('Minggu')));
    }

    // 2. Fallback to isHalaqahScheduledOnDayIndex helper (which checks guruSchedules or halaqah.hariKegiatan)
    const teacherId = myUser?.id || myGuruObj?.id || '';
    const teacherName = myUser?.namaLengkap || myGuruObj?.namaLengkap || '';
    return isHalaqahScheduledOnDayIndex(myHalaqah, dayIndex, guruSchedules, teacherId, teacherName);
  }, [scheduledDaysList, myHalaqah, guruSchedules, myUser, myGuruObj]);

  // Check if a student has setoran records on a specific date
  const getStudentSetoransOnDate = useCallback((studentId: string, dateStr: string = selectedAttendanceDate) => {
    return (setorans || []).filter(
      s => s && s.siswaId === studentId && s.tanggalSetoran === dateStr
    );
  }, [setorans, selectedAttendanceDate]);

  // Determine if a student automatically qualifies as Hadir due to setoran on an active learning day
  const isStudentAutoHadir = useCallback((studentId: string, dateStr: string = selectedAttendanceDate): boolean => {
    const isScheduled = isDateActiveHalaqahDay(dateStr);
    if (!isScheduled) return false;
    const studentSetorans = getStudentSetoransOnDate(studentId, dateStr);
    return studentSetorans.length > 0;
  }, [isDateActiveHalaqahDay, getStudentSetoransOnDate, selectedAttendanceDate]);

  // Check if currently selected date is a scheduled active halaqah day
  const isCurrentDateScheduled = useMemo(() => {
    return isDateActiveHalaqahDay(selectedAttendanceDate);
  }, [isDateActiveHalaqahDay, selectedAttendanceDate]);

  // Gender & title of teacher (Ustadzah for female, Ustadz for male)
  const isTeacherFemale = useMemo(() => {
    const rawGender = (myGuruObj?.jenisKelamin || myUser?.jenisKelamin || (myHalaqah as any)?.guruPembimbingJenisKelamin || '').toString().toLowerCase();
    return rawGender === 'perempuan';
  }, [myGuruObj, myUser, myHalaqah]);

  const teacherTitle = isTeacherFemale ? 'Ustadzah' : 'Ustadz';
  const rawTeacherName = myGuruObj?.namaLengkap || myUser?.namaLengkap || (myHalaqah as any)?.guruPembimbingNama || 'Guru';
  const cleanTeacherName = rawTeacherName.replace(/^ustadz(ah)?\b/i, '').trim();
  const fullTeacherDisplayName = `${teacherTitle} ${cleanTeacherName}`;

  // Check if the halaqah's teacher is marked Izin, Sakit, Alpha, or Tanpa Keterangan on the selected date
  const teacherAbsenceStatus = useMemo(() => {
    const teacherId = myUser?.id || myGuruObj?.id || myHalaqah?.guruPembimbingId || '';
    const teacherNameNorm = cleanTeacherName.toLowerCase();
    const curHalaqahId = myHalaqah?.id || '';
    const curHalaqahName = (myHalaqah?.namaHalaqah || '').toLowerCase().trim();

    const record = findMatchingGuruAttendanceRecord(
      guruAttendance,
      selectedAttendanceDate,
      {
        teacherId,
        teacherName: rawTeacherName,
        halaqahId: curHalaqahId,
        halaqahName: myHalaqah?.namaHalaqah || ''
      }
    );

    if (!record) return null;
    const raw = (record.status || '').trim();
    const lower = raw.toLowerCase();
    if (lower === 'izin' || lower === 'sakit' || lower === 'alpha' || lower === 'alpa' || lower === 'tanpa keterangan') {
      return {
        status: raw,
        type: (lower === 'sakit' ? 'sakit' : lower === 'izin' ? 'izin' : 'alpha') as 'sakit' | 'izin' | 'alpha',
        catatan: record.catatan || ''
      };
    }
    return null;
  }, [guruAttendance, selectedAttendanceDate, myUser, myGuruObj, myHalaqah, cleanTeacherName]);

  // helper to filter attendance by selected timeframe relative to simulating date or today,
  // strictly aligned with the teacher's scheduled teaching days (e.g. Kamis & Jumat -> 2 days/week)
  const getRekapFilteredEntries = (timeframe: 'harian' | 'pekanan' | 'bulanan' | 'kuartal' | 'semester' | 'tahunan') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = selectedAttendanceDate || todayStr;

    if (timeframe === 'harian') {
      return attendance.filter(entry => entry.tanggal === targetDate);
    }

    const maxDateInAttendance = attendance.reduce((max, entry) => {
      return entry.tanggal > max ? entry.tanggal : max;
    }, todayStr);

    // Anchor on selectedAttendanceDate if it has records, or latest recorded date
    const hasSelectedDateEntries = attendance.some(a => a.tanggal === selectedAttendanceDate);
    const anchorDateStr = hasSelectedDateEntries 
      ? selectedAttendanceDate 
      : (maxDateInAttendance > '2026-05-31' ? maxDateInAttendance : '2026-05-31');

    const anchorParts = anchorDateStr.split('-');
    const anchorDate = new Date(parseInt(anchorParts[0], 10), parseInt(anchorParts[1], 10) - 1, parseInt(anchorParts[2], 10));

    return (attendance || []).filter(entry => {
      if (!entry || !entry.tanggal) return false;
      // If teacher has active scheduled teaching days, filter entries strictly by schedule
      if (scheduledDaysList.length > 0 && !isDateInScheduledDays(entry.tanggal, scheduledDaysList)) {
        return false;
      }

      const entryParts = entry.tanggal.split('-');
      if (entryParts.length !== 3) return false;
      const entryDate = new Date(parseInt(entryParts[0], 10), parseInt(entryParts[1], 10) - 1, parseInt(entryParts[2], 10));
      const diffTime = anchorDate.getTime() - entryDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeframe === 'pekanan') {
        // In 7 consecutive days (diffDays 0 through 6), each scheduled day occurs once per week
        // E.g., if scheduledDaysList is ['Kamis', 'Jumat'], exactly 2 meetings pass
        return diffDays >= 0 && diffDays < 7;
      }
      if (timeframe === 'bulanan') {
        return diffDays >= 0 && diffDays < 30;
      }
      if (timeframe === 'kuartal') {
        return diffDays >= 0 && diffDays < 90;
      }
      if (timeframe === 'semester') {
        const year = entryDate.getFullYear();
        const month = entryDate.getMonth(); // 0 is January, 5 is June
        return year === 2026 && month >= 0 && month <= 5;
      }
      if (timeframe === 'tahunan') {
        return diffDays >= 0 && diffDays < 365;
      }
      return true;
    });
  };

  const [attendanceLastSaved, setAttendanceLastSaved] = useState<string | null>(null);

  // Helper to check if any saved entry exists for the current students on this date
  const isDateSaved = () => {
    const daily = attendance.filter(a => a.tanggal === selectedAttendanceDate);
    return myStudents.some(s => daily.some(d => d.siswaId === s.id));
  };

  // Helper to check if tempAttendance matches the saved attendance state
  const isAttendanceChanged = () => {
    const daily = attendance.filter(a => a.tanggal === selectedAttendanceDate);
    const dateHasSavedData = myStudents.some(s => daily.some(d => d.siswaId === s.id));

    // If date has not been saved yet, check if teacher has selected any status
    if (!dateHasSavedData) {
      return myStudents.some(student => {
        const current = tempAttendance[student.id];
        return Boolean(current?.status) || Boolean(current?.catatan);
      });
    }

    // If date has existing saved records, compare against saved state
    for (const student of myStudents) {
      const savedEntry = daily.find(d => d.siswaId === student.id);
      const savedStatus = savedEntry ? savedEntry.status : '';
      const savedCatatan = savedEntry ? savedEntry.catatan : '';
      
      const current = tempAttendance[student.id];
      const curStatus = current ? (current.status || '') : '';
      const curCatatan = current ? (current.catatan || '') : '';
      if (curStatus !== savedStatus || curCatatan !== savedCatatan) {
        return true;
      }
    }
    return false;
  };

  // Keep track of the last loaded date and halaqah ID to avoid resetting unsaved changes on standard renders
  const lastLoadedRef = React.useRef<{ date: string; halaqahId: string } | null>(null);

  // Create a ref for tempAttendance to avoid stale closures inside the initialization useEffect
  const tempAttendanceRef = React.useRef(tempAttendance);
  useEffect(() => {
    tempAttendanceRef.current = tempAttendance;
  }, [tempAttendance]);

  // Initialize selected attendance form with existing data (or neutral unselected state if not recorded yet)
  useEffect(() => {
    const halaqahId = myHalaqah?.id || '';
    const dateChanged = !lastLoadedRef.current || lastLoadedRef.current.date !== selectedAttendanceDate;
    const halaqahChanged = !lastLoadedRef.current || lastLoadedRef.current.halaqahId !== halaqahId;

    // Helper to check if tempAttendance matches the saved attendance state
    const daily = attendance.filter(a => a.tanggal === selectedAttendanceDate);
    const hasUnsavedChanges = myStudents.some(student => {
      const saved = daily.find(d => d.siswaId === student.id);
      const savedStatus = saved ? saved.status : '';
      const savedCatatan = saved ? saved.catatan : '';
      const current = tempAttendanceRef.current[student.id];
      if (!current) return false;
      const curStatus = current.status || '';
      const curCatatan = current.catatan || '';
      return savedStatus !== curStatus || savedCatatan !== curCatatan;
    });

    // We initialize/reset when:
    // 1. Selected date or halaqah group changes.
    // 2. OR when there are no unsaved changes and the actual attendance records list or students list changes.
    if (dateChanged || halaqahChanged || !hasUnsavedChanges) {
      const map: Record<string, { status?: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | '', catatan: string }> = {};
      
      myStudents.forEach(s => {
        const autoHadir = isStudentAutoHadir(s.id, selectedAttendanceDate);
        const match = daily.find(d => d.siswaId === s.id);
        map[s.id] = {
          // If student submitted setoran on an active learning day, automatically mark as Hadir
          status: autoHadir ? 'Hadir' : (match ? match.status : ''),
          catatan: match ? match.catatan : ''
        };
      });
      setTempAttendance(map);
      lastLoadedRef.current = { date: selectedAttendanceDate, halaqahId };
    }
  }, [selectedAttendanceDate, myHalaqah, attendance, myStudents, setorans, guruSchedules, isStudentAutoHadir]);

  const saveTodayAttendance = async () => {
    // Check if ALL students are unselected (empty)
    const anySelected = myStudents.some(s => isStudentAutoHadir(s.id, selectedAttendanceDate) || Boolean(tempAttendance[s.id]?.status));
    const studentIds = myStudents.map(s => s.id);
    const hasSavedRecords = attendance.some(u => u.tanggal === selectedAttendanceDate && studentIds.includes(u.siswaId));

    if (!anySelected) {
      if (hasSavedRecords) {
        if (confirm(`Semua status kehadiran santri pada tanggal ${selectedAttendanceDate} dalam keadaan kosong (dibatalkan).\n\nApakah Anda ingin membatalkan dan menghapus rekaman absensi tanggal ${selectedAttendanceDate} dari database?`)) {
          handleDeleteDateAttendance();
          return;
        }
      } else {
        alert('Belum ada status kehadiran santri yang dipilih. Silakan pilih status santri terlebih dahulu.');
        return;
      }
      return;
    }

    // Check if some student status is still unselected (excluding auto-Hadir students)
    const unselectedStudents = myStudents.filter(s => !isStudentAutoHadir(s.id, selectedAttendanceDate) && !tempAttendance[s.id]?.status);
    if (unselectedStudents.length > 0) {
      const confirmSave = confirm(
        `Terdapat ${unselectedStudents.length} santri yang belum dipilih status kehadirannya.\n\nApakah Anda ingin menetapkan ${unselectedStudents.length} santri tersebut otomatis sebagai "Hadir" dan menyimpan absensi?`
      );
      if (!confirmSave) return;
    }

    const baseList = Array.isArray(studentAttendance) && studentAttendance.length > 0 ? studentAttendance : attendance;
    const updated = [...baseList];
    myStudents.forEach(s => {
      const autoHadir = isStudentAutoHadir(s.id, selectedAttendanceDate);
      const formVal = tempAttendance[s.id];
      const finalStatus: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' = autoHadir
        ? 'Hadir'
        : (formVal?.status && ['Hadir', 'Izin', 'Sakit', 'Alpha'].includes(formVal.status))
        ? (formVal.status as 'Hadir' | 'Izin' | 'Sakit' | 'Alpha')
        : 'Hadir'; // fallback when auto-confirmed

      const idx = updated.findIndex(u => u.tanggal === selectedAttendanceDate && u.siswaId === s.id);
      const entry: AttendanceEntry = {
        id: idx >= 0 ? updated[idx].id : `att-${selectedAttendanceDate}-${s.id}`,
        tanggal: selectedAttendanceDate,
        siswaId: s.id,
        siswaNama: s.namaLengkap,
        status: finalStatus,
        catatan: formVal?.catatan || (autoHadir ? 'Hadir Otomatis (Setoran)' : '')
      };
      if (idx >= 0) {
        updated[idx] = entry;
      } else {
        updated.push(entry);
      }
    });
    setAttendance(updated);
    try {
      localStorage.setItem('mh_student_attendance', JSON.stringify(updated));
    } catch {}
    await saveStudentAttendance(updated); // Persist directly to central database!
    setAttendanceLastSaved(`Berhasil disimpan pukul ${new Date().toLocaleTimeString('id-ID')} (Tanggal: ${selectedAttendanceDate})`);
    addLog('Mencatat Kehadiran', `Memperbarui absensi halaqah tanggal ${selectedAttendanceDate}`);
    alert(`Absensi untuk tanggal ${selectedAttendanceDate} berhasil disimpan!`);
  };

  // Handler to delete a specific date from effective meeting days for this halaqah
  const handleDeleteEffectiveDate = (dateStr: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Hari Efektif tanggal ${dateStr}? Semua data presensi seluruh santri di halaqah ini pada tanggal tersebut akan dihapus.`)) {
      const studentIds = myStudents.map(s => s.id);
      const updated = attendance.filter(entry => !(entry.tanggal === dateStr && studentIds.includes(entry.siswaId)));
      setAttendance(updated);
      localStorage.setItem('mh_student_attendance', JSON.stringify(updated));
      saveStudentAttendance(updated);
      addLog('Hapus Hari Efektif', `Menghapus hari bimbingan efektif tanggal ${dateStr}`);
    }
  };

  // Handler to add a new effective meeting date for students in this halaqah
  const handleAddEffectiveDate = () => {
    if (!newEffectiveDate) {
      alert('Silakan pilih tanggal terlebih dahulu!');
      return;
    }
    
    // Check if some records for this date already exist for this halaqah
    const studentIds = myStudents.map(s => s.id);
    const exists = attendance.some(entry => entry.tanggal === newEffectiveDate && studentIds.includes(entry.siswaId));
    if (exists) {
      alert(`Hari Efektif untuk tanggal ${newEffectiveDate} sudah terdaftar atau memiliki catatan data.`);
      return;
    }

    const updated = [...attendance];
    myStudents.forEach(s => {
      updated.push({
        id: `att-${newEffectiveDate}-${s.id}`,
        tanggal: newEffectiveDate,
        siswaId: s.id,
        siswaNama: s.namaLengkap,
        status: 'Hadir',
        catatan: ''
      });
    });

    setAttendance(updated);
    localStorage.setItem('mh_student_attendance', JSON.stringify(updated));
    saveStudentAttendance(updated);
    addLog('Tambah Hari Efektif', `Menentukan hari bimbingan efektif baru tanggal ${newEffectiveDate}`);
    alert(`Tanggal efektif ${newEffectiveDate} berhasil ditambahkan dengan kehadiran default "Hadir" untuk seluruh santri.`);
  };

  // Handler to sync / view effective meeting schedule from Admin's Jadwal Mengajar Guru
  const handleSyncEffectiveDatesFromSchedule = (autoNotice: boolean = false) => {
    if (myActiveSchedules.length === 0) {
      if (!autoNotice) {
        alert('Belum ada Jadwal HALAQAH aktif yang diatur oleh Admin pada menu Admin > HALAQAH > Jadwal Mengajar Guru.');
      }
      return 0;
    }

    const scheduledDays = scheduledDaysList;
    if (!autoNotice) {
      alert(`Jadwal bimbingan halaqah aktif bulan ini adalah setiap hari: ${scheduledDays.join(', ')}.\n\nPresensi kehadiran santri dicatat secara akurat saat kegiatan halaqah berlangsung melalui tombol "Simpan Absensi" atau otomatis saat santri menyetorkan hafalan.`);
    }
    return scheduledDays.length;
  };

  // Handler to update a single record (Rincian) for a student on a specific date
  const handleUpdateSiswaRecord = (siswaId: string, tanggal: string, newStatus: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha', newCatatan: string) => {
    const updated = attendance.map(entry => {
      if (entry.siswaId === siswaId && entry.tanggal === tanggal) {
        return { ...entry, status: newStatus, catatan: newCatatan };
      }
      return entry;
    });
    
    setAttendance(updated);
    localStorage.setItem('mh_student_attendance', JSON.stringify(updated));
    saveStudentAttendance(updated);
    
    // Dynamically update rendering state in the open modal as well
    setSelectedStudentAttendance((prev: any) => {
      if (!prev) return null;
      const newRecords = prev.records.map((r: any) => 
        r.tanggal === tanggal ? { ...r, status: newStatus, catatan: newCatatan } : r
      );
      const total = newRecords.length;
      const hadir = newRecords.filter((r: any) => r.status === 'Hadir').length;
      const izin = newRecords.filter((r: any) => r.status === 'Izin').length;
      const sakit = newRecords.filter((r: any) => r.status === 'Sakit').length;
      const alpha = newRecords.filter((r: any) => r.status === 'Alpha').length;
      const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
      return {
        ...prev,
        records: newRecords,
        total, hadir, izin, sakit, alpha, rate
      };
    });
    
    addLog('Ubah Rincian Absensi', `Memperbarui rincian absensi tanggal ${tanggal} siswa ID: ${siswaId}`);
  };

  // Handler to reset all attendance logs for a single student
  const handleResetSiswaAttendance = (siswaId: string) => {
    if (!selectedStudentAttendance) return;
    if (confirm(`Apakah Anda yakin ingin mereset seluruh log presensi kehadiran untuk ${selectedStudentAttendance.siswa.namaLengkap}? Segenap data statistik presensi siswa ini akan dikosongkan.`)) {
      const updated = attendance.filter(entry => entry.siswaId !== siswaId);
      
      setAttendance(updated);
      localStorage.setItem('mh_student_attendance', JSON.stringify(updated));
      saveStudentAttendance(updated);
      
      setSelectedStudentAttendance((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          records: [],
          total: 0,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0,
          rate: 100
        };
      });
      
      addLog('Reset Absensi Siswa', `Mereset riwayat log presensi siswa ${selectedStudentAttendance.siswa.namaLengkap}`);
      alert(`Seluruh riwayat presensi siswa ${selectedStudentAttendance.siswa.namaLengkap} berhasil direset.`);
    }
  };

  // Helper search and calculations for Absensi Halaqah
  const [absensiSearch, setAbsensiSearch] = useState('');

  const halaqahEffectiveDates = useMemo(() => {
    const studentIds = myStudents.map(s => s.id);
    const dates = new Set<string>();
    attendance.forEach(entry => {
      if (studentIds.includes(entry.siswaId)) {
        dates.add(entry.tanggal);
      }
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [attendance, myStudents]);

  const handleToggleStatus = (studentId: string, targetStatus: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha') => {
    if (isStudentAutoHadir(studentId, selectedAttendanceDate)) {
      alert('Santri ini memiliki riwayat setoran pada hari aktif halaqah ini sehingga otomatis berstatus Hadir. Status Hadir terkunci dan tidak dapat diubah kecuali riwayat setorannya dihapus pada menu Mutabaah > Riwayat Setoran.');
      return;
    }
    setTempAttendance(prev => {
      const cur = prev[studentId];
      const isAlreadyActive = cur?.status === targetStatus;
      return {
        ...prev,
        [studentId]: {
          status: isAlreadyActive ? '' : targetStatus,
          catatan: cur?.catatan || ''
        }
      };
    });
  };

  const handleClearSingleStatus = (studentId: string) => {
    if (isStudentAutoHadir(studentId, selectedAttendanceDate)) {
      alert('Santri ini memiliki riwayat setoran pada hari aktif halaqah ini sehingga otomatis berstatus Hadir. Status Hadir terkunci dan tidak dapat dibatalkan kecuali riwayat setorannya dihapus pada menu Mutabaah > Riwayat Setoran.');
      return;
    }
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: {
        status: '',
        catatan: prev[studentId]?.catatan || ''
      }
    }));
  };

  const handleDoubleClickStatus = (studentId: string) => {
    handleClearSingleStatus(studentId);
  };

  const handleSetAllPresent = () => {
    const map: Record<string, { status?: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | '', catatan: string }> = {};
    myStudents.forEach(s => {
      const autoHadir = isStudentAutoHadir(s.id, selectedAttendanceDate);
      map[s.id] = {
        status: 'Hadir',
        catatan: autoHadir ? 'Hadir Otomatis (Setoran)' : (tempAttendance[s.id]?.catatan || '')
      };
    });
    setTempAttendance(map);
  };

  const handleResetAllSelections = () => {
    const map: Record<string, { status?: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | '', catatan: string }> = {};
    myStudents.forEach(s => {
      const autoHadir = isStudentAutoHadir(s.id, selectedAttendanceDate);
      map[s.id] = {
        status: autoHadir ? 'Hadir' : '',
        catatan: autoHadir ? 'Hadir Otomatis (Setoran)' : (tempAttendance[s.id]?.catatan || '')
      };
    });
    setTempAttendance(map);
  };

  const handleDeleteDateAttendance = () => {
    const studentIds = myStudents.map(s => s.id);
    const existing = attendance.filter(a => a.tanggal === selectedAttendanceDate && studentIds.includes(a.siswaId));
    if (existing.length === 0) {
      handleResetAllSelections();
      alert(`Pilihan status kehadiran untuk tanggal ${selectedAttendanceDate} telah dikosongkan.`);
      return;
    }

    if (confirm(`Apakah Anda yakin ingin membatalkan & menghapus seluruh catatan absensi halaqah pada tanggal ${formatIndonesianDate(selectedAttendanceDate)} (${selectedAttendanceDate})?\n\nSemua rekaman kehadiran santri pada tanggal ini akan dibatalkan dan dihapus dari database.`)) {
      const updated = attendance.filter(entry => !(entry.tanggal === selectedAttendanceDate && studentIds.includes(entry.siswaId)));
      setAttendance(updated);
      localStorage.setItem('mh_student_attendance', JSON.stringify(updated));
      saveStudentAttendance(updated);
      handleResetAllSelections();
      setAttendanceLastSaved(null);
      addLog('Batal/Hapus Absensi Tanggal', `Membatalkan dan menghapus catatan absensi halaqah tanggal ${selectedAttendanceDate}`);
      alert(`Catatan absensi tanggal ${selectedAttendanceDate} berhasil dibatalkan dan dihapus dari sistem.`);
    }
  };

  const openStudentAttendanceModal = (siswa: Siswa) => {
    const allRecords = attendance.filter(a => a.siswaId === siswa.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const rekapEntries = getRekapFilteredEntries(rekapTimeframe);
    const timeframeRecords = rekapEntries.filter(a => a.siswaId === siswa.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    const activeRecords = timeframeRecords.length > 0 ? timeframeRecords : allRecords;
    const total = activeRecords.length;
    const hadir = activeRecords.filter(r => r.status === 'Hadir').length;
    const izin = activeRecords.filter(r => r.status === 'Izin').length;
    const sakit = activeRecords.filter(r => r.status === 'Sakit').length;
    const alpha = activeRecords.filter(r => r.status === 'Alpha').length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;

    setSelectedStudentAttendance({
      siswa,
      records: activeRecords,
      allRecords,
      timeframeRecords,
      viewMode: timeframeRecords.length > 0 ? 'timeframe' : 'all',
      timeframe: rekapTimeframe,
      total,
      hadir,
      izin,
      sakit,
      alpha,
      rate
    });
  };

  const handleExportAbsensiCsv = () => {
    const rekap = getRekapFilteredEntries(rekapTimeframe);
    let csvContent = 'data:text/csv;charset=utf-8,';
    const pertemuanColTitle = scheduledDaysList.length > 0 && rekapTimeframe === 'pekanan'
      ? `Total Pertemuan (${scheduledDaysList.length} Hari/Pekan)`
      : 'Total Pertemuan';
    csvContent += `NIS,Nama Santri,Halaqah,${pertemuanColTitle},Hadir,Izin,Sakit,Alpha,Persentase Hadir (%)\r\n`;
    
    myStudents.forEach(s => {
      const studentRecords = rekap.filter(r => r.siswaId === s.id);
      const total = studentRecords.length;
      const hadir = studentRecords.filter(r => r.status === 'Hadir').length;
      const izin = studentRecords.filter(r => r.status === 'Izin').length;
      const sakit = studentRecords.filter(r => r.status === 'Sakit').length;
      const alpha = studentRecords.filter(r => r.status === 'Alpha').length;
      const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
      csvContent += `"${s.nis}","${s.namaLengkap}","${myHalaqah?.namaHalaqah || '-'}","${total} Hari","${hadir}","${izin}","${sakit}","${alpha}","${rate}%"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Absensi_${myHalaqah?.namaHalaqah || 'Halaqah'}_${rekapTimeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
        <div className="w-full max-w-7xl mx-auto px-2 md:px-4 space-y-6 animate-fade-in pb-16">
          
          {/* Header Banner */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 rounded-2xl sm:rounded-3xl border border-emerald-700/40 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
            {/* Subtle decorative background glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3 sm:space-y-4 max-w-3xl">
              {/* Header: Icon + Title + Halaqah Badge */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner mt-0.5">
                  <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-xl font-bold tracking-tight text-white leading-tight">
                      Presensi &amp; Kehadiran Halaqah
                    </h2>
                    {teacherHalaqahs.length > 1 ? (
                      <select
                        value={myHalaqah?.id || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && setSelectedGuruHalaqahId) {
                            setSelectedGuruHalaqahId(val);
                          }
                        }}
                        className="inline-flex items-center text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30 font-mono cursor-pointer hover:bg-emerald-500/30 transition-colors"
                        title="Ganti Halaqah Bimbingan"
                      >
                        {teacherHalaqahs.map(h => (
                          <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                            {h.namaHalaqah}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30 font-mono">
                        {myHalaqah?.namaHalaqah || 'Halaqah Bimbingan'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                    Pencatatan cepat kehadiran santri harian secara 1-klik, pemantauan kedisiplinan, serta rekapitulasi kehadiran berkala.
                  </p>
                </div>
              </div>

              {/* Meta Badges: Santri & Jadwal HALAQAH */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                {/* Santri Bimbingan Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-emerald-500/20 text-emerald-200 shadow-xs shrink-0">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span><strong className="text-white font-bold">{myStudents.length}</strong> Santri Bimbingan</span>
                </div>

                {/* Jadwal HALAQAH Badge - Clean & Responsive */}
                <div className={`px-3 py-2 rounded-xl border transition shadow-xs flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2.5 ${
                  scheduledDaysList.length > 0
                    ? 'bg-black/30 border-emerald-500/20 text-emerald-100'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${scheduledDaysList.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-[11px] font-semibold text-emerald-300/90 uppercase tracking-wider font-mono">
                      Jadwal:
                    </span>
                  </div>
                  {scheduledDaysList.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white tracking-wide">
                        {scheduledDaysList.join(', ')}
                      </span>
                      {scheduleSummaryTime && (
                        <span className="inline-flex items-center text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-md border border-emerald-400/25 whitespace-nowrap">
                          {scheduleSummaryTime}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="font-semibold text-amber-300 italic text-xs">
                      Jadwal belum diatur
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Ergonomic & Balanced on Mobile */}
            <div className="relative z-10 w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2.5 pt-1 lg:pt-0 shrink-0">
              <button
                type="button"
                onClick={() => handleSyncEffectiveDatesFromSchedule(false)}
                className="w-full lg:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm shadow-xs active:scale-[0.98]"
                title="Sesuaikan tanggal pertemuan efektif bulan ini secara otomatis berdasarkan Jadwal HALAQAH"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="whitespace-nowrap">Sinkron Jadwal HALAQAH</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditPertemuanModalOpen(true)}
                className="w-full lg:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Kelola Hari Efektif ({halaqahEffectiveDates.length})</span>
              </button>
            </div>
          </div>

          {/* FITUR: DAFTAR KEHADIRAN GURU DALAM BULAN AKTIF (DI BAWAH KARTU PRESENSI & KEHADIRAN HALAQAH) */}
          <GuruMonthlyAttendanceList
            myUser={myUser}
            myGuruObj={myGuruObj}
            myHalaqah={myHalaqah}
            variant="full"
            formatIndonesianDate={formatIndonesianDate}
            addLog={addLog}
          />

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setInnerAbsensiTab('pencatatan')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                innerAbsensiTab === 'pencatatan'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Presensi &amp; Rekap Harian (1-Klik)</span>
            </button>
            <button
              type="button"
              onClick={() => setInnerAbsensiTab('rekap')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                innerAbsensiTab === 'rekap'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Rekapitulasi Kehadiran</span>
            </button>
          </div>

          {/* VIEW 1: PENCATATAN HARIAN */}
          {innerAbsensiTab === 'pencatatan' && (
            <div className="space-y-5">
              
              {/* Toolbar Tanggal & Quick Action */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Date Picker & Information */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Pilih Tanggal Pertemuan:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={selectedAttendanceDate}
                        onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedAttendanceDate(new Date().toISOString().split('T')[0])}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Hari Ini
                      </button>
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-3 space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatIndonesianDate(selectedAttendanceDate)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isDateSaved() ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3" />
                          <span>Tersimpan di Sistem</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          Belum Ada Rekaman
                        </span>
                      )}

                      {/* Schedule status badge for selected date */}
                      {(() => {
                        const daysMap: Array<'Ahad' | 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'> = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        const dayName = daysMap[new Date(selectedAttendanceDate).getDay()];
                        const isScheduled = scheduledDaysList.includes(dayName) || 
                          ((dayName === 'Ahad') && ((scheduledDaysList as string[]).includes('Ahad') || (scheduledDaysList as string[]).includes('Minggu')));
                        
                        if (scheduledDaysList.length === 0) {
                          return (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/70 dark:border-amber-800/60">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Jadwal HALAQAH: Belum diatur</span>
                            </span>
                          );
                        }
                        
                        if (isScheduled) {
                          const todaySch = myActiveSchedules.find(s => s.hari === dayName);
                          return (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Sesuai Jadwal HALAQAH ({dayName}{todaySch?.jamMulai ? ` • ${todaySch.jamMulai}-${todaySch.jamSelesai}` : ''})</span>
                            </span>
                          );
                        }
                        
                        return (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Di Luar Jadwal Rutin ({dayName})</span>
                          </span>
                        );
                      })()}

                      {isAttendanceChanged() && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          <span>Perubahan Belum Disimpan</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1-Click Fast Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isDateSaved() && (
                    <button
                      type="button"
                      onClick={handleDeleteDateAttendance}
                      className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Batalkan dan hapus rekaman absensi yang tersimpan pada tanggal ini jika salah pilih hari"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Hapus Absensi Tanggal Ini</span>
                    </button>
                  )}

                  {isCurrentDateScheduled && !teacherAbsenceStatus && (
                    <>
                      <button
                        type="button"
                        onClick={handleResetAllSelections}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Kosongkan seluruh pilihan kehadiran santri untuk tanggal ini (misal jika salah pilih hari)"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Kosongkan Pilihan</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSetAllPresent}
                        className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
                        title="Jadikan semua santri bimbingan hadir secara otomatis dalam 1 klik"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Semua Hadir (1-Klik)</span>
                      </button>

                      <button
                        type="button"
                        onClick={saveTodayAttendance}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Absensi</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* KONDISI 1: JIKA BUKAN PADA HARI TERJADWAL */}
              {!isCurrentDateScheduled ? (
                <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-900/60 dark:to-amber-950/20 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm text-center space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/60 shadow-xs">
                    <CalendarOff className="w-7 h-7" />
                  </div>

                  <div className="max-w-md mx-auto space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Hari di Luar Jadwal Rutin</span>
                    </span>

                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                      Tidak Ada Jadwal Halaqah pada Hari Ini
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Pada hari <strong>{formatIndonesianDate(selectedAttendanceDate)}</strong>, kelompok bimbingan <strong>{myHalaqah?.namaHalaqah || 'Halaqah'}</strong> tidak memiliki jadwal aktif pembelajaran.
                    </p>
                  </div>

                  <div className="p-4 max-w-lg mx-auto bg-white/80 dark:bg-slate-950/70 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <div className="flex items-center justify-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Jadwal Resmi Mengajar: <strong className="text-emerald-700 dark:text-emerald-400">{scheduledDaysList.join(' dan ') || 'Belum diatur'}</strong>
                        {scheduleSummaryTime ? ` (${scheduleSummaryTime})` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Silakan pilih tanggal lain yang bertepatan dengan hari aktif jadwal halaqah di atas untuk melakukan penginputan absensi santri bimbingan.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedAttendanceDate(new Date().toISOString().split('T')[0])}
                      className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pindah ke Hari Ini</span>
                    </button>
                  </div>
                </div>
              ) : teacherAbsenceStatus ? (
                /* KONDISI 2: JIKA PADA HARI TERJADWAL USTADZ / USTADZAH IZIN, SAKIT, ATAU ALPHA */
                <div className={`p-6 sm:p-8 rounded-2xl border shadow-sm text-center space-y-4 animate-fadeIn ${
                  teacherAbsenceStatus.type === 'sakit'
                    ? 'bg-gradient-to-br from-sky-50 to-blue-50/40 dark:from-sky-950/30 dark:to-blue-950/20 border-sky-200 dark:border-sky-900/60'
                    : teacherAbsenceStatus.type === 'izin'
                    ? 'bg-gradient-to-br from-purple-50 to-amber-50/30 dark:from-purple-950/30 dark:to-amber-950/20 border-purple-200 dark:border-purple-900/60'
                    : 'bg-gradient-to-br from-rose-50 to-slate-50 dark:from-rose-950/30 dark:to-slate-950/20 border-rose-200 dark:border-rose-900/60'
                }`}>
                  <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border shadow-xs ${
                    teacherAbsenceStatus.type === 'sakit'
                      ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                      : teacherAbsenceStatus.type === 'izin'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}>
                    {teacherAbsenceStatus.type === 'sakit' ? (
                      <HeartPulse className="w-7 h-7" />
                    ) : teacherAbsenceStatus.type === 'izin' ? (
                      <UserX className="w-7 h-7" />
                    ) : (
                      <AlertTriangle className="w-7 h-7" />
                    )}
                  </div>

                  <div className="max-w-md mx-auto space-y-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider border ${
                      teacherAbsenceStatus.type === 'sakit'
                        ? 'bg-sky-100/90 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                        : teacherAbsenceStatus.type === 'izin'
                        ? 'bg-purple-100/90 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                        : 'bg-rose-100/90 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    }`}>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Halaqah Diliburkan • {teacherTitle} {teacherAbsenceStatus.status}</span>
                    </span>

                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                      Kegiatan Halaqah Ditiadakan
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      Pada hari <strong>{formatIndonesianDate(selectedAttendanceDate)}</strong>, kegiatan bimbingan halaqah <strong>{myHalaqah?.namaHalaqah || ''}</strong> tidak ada karena <strong>{fullTeacherDisplayName}</strong> {
                        teacherAbsenceStatus.type === 'sakit'
                          ? 'sedang sakit'
                          : teacherAbsenceStatus.type === 'izin'
                          ? 'sedang izin'
                          : 'berhalangan hadir (Alpha)'
                      }.
                    </p>
                  </div>

                  {teacherAbsenceStatus.catatan && (
                    <div className="p-3 max-w-lg mx-auto bg-white/80 dark:bg-slate-950/70 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 italic">
                      Catatan kehadiran: "{teacherAbsenceStatus.catatan}"
                    </div>
                  )}

                  <div className="p-3.5 max-w-lg mx-auto bg-white/70 dark:bg-slate-950/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Seluruh santri bimbingan otomatis tercatat <strong>Libur (L)</strong> pada sistem rekapitulasi kehadiran dan tidak perlu diinput absensi manual.</span>
                  </div>
                </div>
              ) : (
                /* KONDISI 3: HARI TERJADWAL & GURU HADIR (TAMPILKAN DAFTAR SANTRI DAN INPUT ABSENSI) */
                <>
                  {/* Tips Koreksi Kesalahan Hari / Tanggal */}
                  <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    <strong>Tips Koreksi Hari / Kehadiran:</strong> Jika keliru memilih hari, klik ulang atau <strong>dobel klik</strong> pada tombol Hadir (atau status lainnya) untuk membatalkan/mengosongkannya (warna hijau otomatis hilang). Gunakan juga tombol <em>Kosongkan Pilihan</em> atau <em>Hapus Absensi Tanggal Ini</em> untuk pembatalan menyeluruh.
                  </span>
                </div>
              </div>

              {/* Rekapitulasi Kehadiran Harian */}
              {(() => {
                const totalSantri = myStudents.length;
                const autoCount = myStudents.filter(s => isStudentAutoHadir(s.id, selectedAttendanceDate)).length;
                const hadirCount = myStudents.filter(s => {
                  const autoHadir = isStudentAutoHadir(s.id, selectedAttendanceDate);
                  return autoHadir || tempAttendance[s.id]?.status === 'Hadir';
                }).length;
                const izinCount = myStudents.filter(s => !isStudentAutoHadir(s.id, selectedAttendanceDate) && tempAttendance[s.id]?.status === 'Izin').length;
                const sakitCount = myStudents.filter(s => !isStudentAutoHadir(s.id, selectedAttendanceDate) && tempAttendance[s.id]?.status === 'Sakit').length;
                const alphaCount = myStudents.filter(s => !isStudentAutoHadir(s.id, selectedAttendanceDate) && tempAttendance[s.id]?.status === 'Alpha').length;
                const belumCount = myStudents.filter(s => !isStudentAutoHadir(s.id, selectedAttendanceDate) && !tempAttendance[s.id]?.status).length;
                const totalDiisi = hadirCount + izinCount + sakitCount + alphaCount;
                const hadirPct = totalDiisi > 0 ? Math.round((hadirCount / totalDiisi) * 100) : 0;
                const dateSaved = isDateSaved();

                return (
                  <div className="p-4 sm:p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-900 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dateSaved || belumCount === 0 ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-amber-400 ring-4 ring-amber-400/20'}`}></div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
                          Rekapitulasi Kehadiran Harian
                        </h3>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          • {formatIndonesianDate(selectedAttendanceDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {belumCount > 0 && !dateSaved ? 'Status Pengisian:' : 'Tingkat Kehadiran:'}
                        </span>
                        <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                          belumCount === totalSantri && !dateSaved
                            ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            : belumCount > 0
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : hadirPct >= 85
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : hadirPct >= 70
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}>
                          {belumCount === totalSantri && !dateSaved
                            ? 'Belum Dicatat'
                            : belumCount > 0
                            ? `${totalDiisi}/${totalSantri} Santri Terisi`
                            : `${hadirPct}% Hadir`}
                        </span>
                      </div>
                    </div>

                    {autoCount > 0 && (
                      <div className="px-3 py-2 bg-emerald-50/90 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/90 dark:border-emerald-800/80 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          <strong>{autoCount} Santri Otomatis Hadir:</strong> Santri yang memiliki riwayat setoran pada hari aktif jadwal halaqah otomatis berstatus Hadir (tombol hijau terkunci). Status dapat diubah manual setelah riwayat setoran dihapus.
                        </span>
                      </div>
                    )}

                    <div className={`grid grid-cols-2 ${belumCount > 0 ? 'sm:grid-cols-6' : 'sm:grid-cols-5'} gap-3`}>
                      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block">Total Santri</span>
                        <span className="text-base font-bold text-slate-800 dark:text-slate-100">{totalSantri} Santri</span>
                      </div>
                      {belumCount > 0 && (
                        <div className="p-3 bg-slate-100/90 dark:bg-slate-900/90 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block">Belum Diisi</span>
                          <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">{belumCount} Santri</span>
                        </div>
                      )}
                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono block">
                          Hadir {autoCount > 0 ? `(${autoCount} Otomatis)` : ''}
                        </span>
                        <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{hadirCount} Santri</span>
                      </div>
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/70 dark:border-amber-900/50">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase font-mono block">Izin</span>
                        <span className="text-base font-bold text-amber-700 dark:text-amber-300">{izinCount} Santri</span>
                      </div>
                      <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl border border-sky-200/70 dark:border-sky-900/50">
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase font-mono block">Sakit</span>
                        <span className="text-base font-bold text-sky-700 dark:text-sky-300">{sakitCount} Santri</span>
                      </div>
                      <div className={`p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/70 dark:border-rose-900/50 ${belumCount > 0 ? '' : 'col-span-2 sm:col-span-1'}`}>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase font-mono block">Alpha</span>
                        <span className="text-base font-bold text-rose-700 dark:text-rose-300">{alphaCount} Santri</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Pencarian Santri */}
              {myStudents.length > 6 && (
                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={absensiSearch}
                    onChange={(e) => setAbsensiSearch(e.target.value)}
                    placeholder="Cari santri bimbingan..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {absensiSearch && (
                    <button
                      type="button"
                      onClick={() => setAbsensiSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Daftar Santri & Input Kehadiran */}
              <div className="space-y-3">
                {myStudents
                  .filter(s => !absensiSearch.trim() || (s.namaLengkap || '').toLowerCase().includes(absensiSearch.toLowerCase()) || (s.nis || '').toLowerCase().includes(absensiSearch.toLowerCase()))
                  .map((student, idx) => {
                    const autoHadir = isStudentAutoHadir(student.id, selectedAttendanceDate);
                    const studentSetorans = getStudentSetoransOnDate(student.id, selectedAttendanceDate);
                    const currentEntry = tempAttendance[student.id];
                    const currentStatus = autoHadir ? 'Hadir' : (currentEntry?.status || '');

                    return (
                      <div
                        key={student.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          currentStatus === 'Hadir'
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
                            : currentStatus === 'Izin'
                            ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/50'
                            : currentStatus === 'Sakit'
                            ? 'bg-sky-50/30 dark:bg-sky-950/10 border-sky-200/80 dark:border-sky-900/50'
                            : currentStatus === 'Alpha'
                            ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/50'
                            : 'bg-white dark:bg-slate-950 border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                          {/* Info Santri */}
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <span className="text-xs font-mono font-bold text-slate-400 w-5">
                              {idx + 1}.
                            </span>
                            <Avatar
                              namaLengkap={student.namaLengkap}
                              fotoProfil={student.fotoProfil}
                              className="w-10 h-10 text-xs font-bold shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                  {student.namaLengkap}
                                </h4>
                                {!currentStatus ? (
                                  <span className="text-[9px] font-semibold font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
                                    Belum Dipilih
                                  </span>
                                ) : autoHadir ? (
                                  <span
                                    title={`Otomatis Hadir karena terdapat ${studentSetorans.length} riwayat setoran pada hari aktif halaqah (${selectedAttendanceDate}). Hapus riwayat setoran di menu Mutabaah > Riwayat Setoran jika ingin mengubah manual.`}
                                    className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 cursor-help"
                                  >
                                    <span>✓ Hadir (Otomatis Setoran)</span>
                                    <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleClearSingleStatus(student.id)}
                                    title="Klik untuk membatalkan status ini (kosongkan)"
                                    className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border cursor-pointer transition inline-flex items-center gap-1 hover:opacity-85 active:scale-95 ${
                                      currentStatus === 'Hadir'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                        : currentStatus === 'Izin'
                                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                        : currentStatus === 'Sakit'
                                        ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                    }`}
                                  >
                                    <span>{currentStatus === 'Hadir' ? '✓ Hadir' : currentStatus}</span>
                                    <X className="w-2.5 h-2.5 opacity-60" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                NIS: {student.nis} {student.kelasNama ? `• ${student.kelasNama}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* 4 Pilihan Status Kehadiran + Koreksi Batal */}
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                              {/* Hadir */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(student.id, 'Hadir')}
                                onDoubleClick={(e) => {
                                  e.preventDefault();
                                  handleDoubleClickStatus(student.id);
                                }}
                                title={
                                  autoHadir
                                    ? `Hadir Otomatis (Terkunci oleh ${studentSetorans.length} riwayat setoran). Hapus setoran di Mutabaah > Riwayat Setoran jika ingin mengubah manual.`
                                    : currentStatus === 'Hadir'
                                    ? 'Klik ulang atau dobel klik untuk membatalkan Hadir'
                                    : 'Tandai Hadir (klik ulang atau dobel klik untuk batal)'
                                }
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 select-none active:scale-95 ${
                                  currentStatus === 'Hadir'
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-500/30 cursor-pointer'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 dark:border-slate-800 cursor-pointer'
                                }`}
                              >
                                <Check className={`w-3.5 h-3.5 ${currentStatus === 'Hadir' ? 'text-white' : 'text-slate-400'}`} />
                                <span>Hadir</span>
                                {autoHadir && (
                                  <Lock className="w-3 h-3 text-white/90 shrink-0" />
                                )}
                              </button>

                              {/* Izin */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(student.id, 'Izin')}
                                onDoubleClick={(e) => {
                                  e.preventDefault();
                                  handleDoubleClickStatus(student.id);
                                }}
                                title={
                                  autoHadir
                                    ? 'Terkunci: Santri ini berstatus Hadir otomatis karena memiliki riwayat setoran pada tanggal ini.'
                                    : currentStatus === 'Izin'
                                    ? 'Klik ulang atau dobel klik untuk membatalkan Izin'
                                    : 'Tandai Izin (klik ulang atau dobel klik untuk batal)'
                                }
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 select-none ${
                                  autoHadir
                                    ? 'opacity-35 cursor-not-allowed bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800'
                                    : currentStatus === 'Izin'
                                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 ring-2 ring-amber-400/30 cursor-pointer active:scale-95'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 border border-slate-200 dark:border-slate-800 cursor-pointer active:scale-95'
                                }`}
                              >
                                <span>Izin</span>
                              </button>

                              {/* Sakit */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(student.id, 'Sakit')}
                                onDoubleClick={(e) => {
                                  e.preventDefault();
                                  handleDoubleClickStatus(student.id);
                                }}
                                title={
                                  autoHadir
                                    ? 'Terkunci: Santri ini berstatus Hadir otomatis karena memiliki riwayat setoran pada tanggal ini.'
                                    : currentStatus === 'Sakit'
                                    ? 'Klik ulang atau dobel klik untuk membatalkan Sakit'
                                    : 'Tandai Sakit (klik ulang atau dobel klik untuk batal)'
                                }
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 select-none ${
                                  autoHadir
                                    ? 'opacity-35 cursor-not-allowed bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800'
                                    : currentStatus === 'Sakit'
                                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 ring-2 ring-sky-500/30 cursor-pointer active:scale-95'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 dark:border-slate-800 cursor-pointer active:scale-95'
                                }`}
                              >
                                <span>Sakit</span>
                              </button>

                              {/* Alpha */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(student.id, 'Alpha')}
                                onDoubleClick={(e) => {
                                  e.preventDefault();
                                  handleDoubleClickStatus(student.id);
                                }}
                                title={
                                  autoHadir
                                    ? 'Terkunci: Santri ini berstatus Hadir otomatis karena memiliki riwayat setoran pada tanggal ini.'
                                    : currentStatus === 'Alpha'
                                    ? 'Klik ulang atau dobel klik untuk membatalkan Alpha'
                                    : 'Tandai Alpha (klik ulang atau dobel klik untuk batal)'
                                }
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 select-none ${
                                  autoHadir
                                    ? 'opacity-35 cursor-not-allowed bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800'
                                    : currentStatus === 'Alpha'
                                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 ring-2 ring-rose-500/30 cursor-pointer active:scale-95'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 dark:border-slate-800 cursor-pointer active:scale-95'
                                }`}
                              >
                                <span>Alpha</span>
                              </button>
                            </div>

                            {/* Tombol Kosongkan Cepat / Indikator Terkunci */}
                            {autoHadir ? (
                              <div
                                title="Status kehadiran Hadir terkunci otomatis dari riwayat setoran. Hapus data setoran pada menu Mutabaah > Riwayat Setoran jika ingin mengubah manual."
                                className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 shrink-0 cursor-help flex items-center justify-center"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            ) : Boolean(currentStatus) && (
                              <button
                                type="button"
                                onClick={() => handleClearSingleStatus(student.id)}
                                title="Batalkan/kosongkan status kehadiran santri ini"
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer shrink-0 border border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-300"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Catatan / Keterangan Khusus */}
                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="text"
                              value={currentEntry?.catatan || (autoHadir && !currentEntry?.catatan ? 'Hadir Otomatis (Setoran)' : '')}
                              onChange={(e) => setTempAttendance(prev => ({
                                ...prev,
                                [student.id]: { status: currentStatus, catatan: e.target.value }
                              }))}
                              placeholder={
                                autoHadir
                                  ? 'Hadir Otomatis (Setoran)'
                                  : currentStatus === 'Hadir'
                                  ? 'Keterangan tambahan (opsional)...'
                                  : currentStatus
                                  ? `Keterangan ${currentStatus} (misal: demam, pulang, izin keluarga)...`
                                  : 'Keterangan kehadiran (opsional)...'
                              }
                              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 ${
                                currentStatus && currentStatus !== 'Hadir'
                                  ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-slate-800 dark:text-slate-200 focus:ring-amber-500'
                                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:ring-emerald-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {myStudents.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
                    Belum ada santri yang terdaftar di halaqah ini. Silakan hubungi admin untuk penempatan santri.
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="sticky bottom-4 z-20 p-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{attendanceLastSaved || `Tanggal aktif: ${selectedAttendanceDate}`}</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetAllSelections}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Kosongkan seluruh pilihan kehadiran santri untuk tanggal ini"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kosongkan Pilihan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSetAllPresent}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Semua Hadir</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveTodayAttendance}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Absensi Sekarang</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

          {/* VIEW 2: REKAPITULASI KEHADIRAN */}
          {innerAbsensiTab === 'rekap' && (
            <div className="space-y-5">
              
              {/* Filter Timeframe & Export */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Rentang Waktu Rekapitulasi:
                    </span>
                    {scheduledDaysList.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>Jadwal HALAQAH: {scheduledDaysList.join(', ')} ({scheduledDaysList.length} Hari/Pekan)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        <span>Jadwal HALAQAH belum diatur</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['harian', 'pekanan', 'bulanan', 'kuartal', 'semester', 'tahunan'] as const).map((tf) => {
                      const schCount = scheduledDaysList.length;
                      let label = '';
                      if (tf === 'harian') {
                        label = 'Harian (1 Hari)';
                      } else if (tf === 'pekanan') {
                        label = schCount > 0 ? `Pekanan (${schCount} Hari)` : 'Pekanan (7 Hari)';
                      } else if (tf === 'bulanan') {
                        label = schCount > 0 ? `Bulanan (~${schCount * 4} Hari)` : 'Bulanan (30 Hari)';
                      } else if (tf === 'kuartal') {
                        label = schCount > 0 ? `Kuartal (~${schCount * 12} Hari)` : 'Kuartal (90 Hari)';
                      } else if (tf === 'semester') {
                        label = schCount > 0 ? `Semester (~${schCount * 24} Hari)` : 'Semester Ini';
                      } else {
                        label = 'Tahunan';
                      }

                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setRekapTimeframe(tf)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                            rekapTimeframe === tf
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportAbsensiCsv}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Ekspor CSV</span>
                  </button>
                </div>
              </div>

              {/* Rangkuman Ringkasan Periode */}
              {(() => {
                const rekapEntries = getRekapFilteredEntries(rekapTimeframe);
                const halaqahStudentIds = myStudents.map(s => s.id);
                const filteredHalaqahEntries = rekapEntries.filter(r => halaqahStudentIds.includes(r.siswaId));
                
                const distinctDates = Array.from(new Set(filteredHalaqahEntries.map(r => r.tanggal)));
                const totalHadir = filteredHalaqahEntries.filter(r => r.status === 'Hadir').length;
                const totalIzin = filteredHalaqahEntries.filter(r => r.status === 'Izin').length;
                const totalSakit = filteredHalaqahEntries.filter(r => r.status === 'Sakit').length;
                const totalAlpha = filteredHalaqahEntries.filter(r => r.status === 'Alpha').length;
                const totalAll = filteredHalaqahEntries.length;
                const avgRate = totalAll > 0 ? Math.round((totalHadir / totalAll) * 100) : 100;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="p-3.5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Pertemuan</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">{distinctDates.length} Hari</span>
                      {scheduledDaysList.length > 0 && rekapTimeframe === 'pekanan' && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block truncate">
                          Target: {scheduledDaysList.length} Hari ({scheduledDaysList.join(', ')})
                        </span>
                      )}
                    </div>
                    <div className="p-3.5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Rata-Rata Hadir</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{avgRate}%</span>
                    </div>
                    <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono block">Total Hadir</span>
                      <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{totalHadir}</span>
                    </div>
                    <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-900/40">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase font-mono block">Total Izin</span>
                      <span className="text-base font-bold text-amber-700 dark:text-amber-300">{totalIzin}</span>
                    </div>
                    <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/20 rounded-2xl border border-sky-200/50 dark:border-sky-900/40">
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase font-mono block">Total Sakit</span>
                      <span className="text-base font-bold text-sky-700 dark:text-sky-300">{totalSakit}</span>
                    </div>
                    <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/50 dark:border-rose-900/40">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase font-mono block">Total Alpha</span>
                      <span className="text-base font-bold text-rose-700 dark:text-rose-300">{totalAlpha}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Tabel Rekap Santri */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4">Santri</th>
                        <th className="py-3 px-4 text-center">
                          <span>Pertemuan</span>
                          {scheduledDaysList.length > 0 && rekapTimeframe === 'pekanan' && (
                            <span className="block text-[9px] font-normal text-emerald-600 dark:text-emerald-400 lowercase font-sans">
                              ({scheduledDaysList.length} hari/pekan)
                            </span>
                          )}
                        </th>
                        <th className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400">Hadir</th>
                        <th className="py-3 px-4 text-center text-amber-600 dark:text-amber-400">Izin</th>
                        <th className="py-3 px-4 text-center text-sky-600 dark:text-sky-400">Sakit</th>
                        <th className="py-3 px-4 text-center text-rose-600 dark:text-rose-400">Alpha</th>
                        <th className="py-3 px-4 text-center min-w-[140px]">% Kehadiran</th>
                        <th className="py-3 px-4 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {(() => {
                        const rekapEntries = getRekapFilteredEntries(rekapTimeframe);

                        return myStudents.map((s, idx) => {
                          const studentRecords = rekapEntries.filter(r => r.siswaId === s.id);
                          const total = studentRecords.length;
                          const hadir = studentRecords.filter(r => r.status === 'Hadir').length;
                          const izin = studentRecords.filter(r => r.status === 'Izin').length;
                          const sakit = studentRecords.filter(r => r.status === 'Sakit').length;
                          const alpha = studentRecords.filter(r => r.status === 'Alpha').length;
                          const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;

                          return (
                            <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition">
                              <td className="py-3.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <Avatar namaLengkap={s.namaLengkap} fotoProfil={s.fotoProfil} className="w-8 h-8 text-[10px] font-bold" />
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{s.namaLengkap}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">NIS: {s.nis}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs">
                                  {total} Hari
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {hadir}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                                {izin}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                                {sakit}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                                {alpha}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        rate >= 85
                                          ? 'bg-emerald-500'
                                          : rate >= 70
                                          ? 'bg-amber-500'
                                          : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                                    />
                                  </div>
                                  <span className={`text-[11px] font-bold font-mono ${
                                    rate >= 85
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : rate >= 70
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {rate}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => openStudentAttendanceModal(s)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Rincian</span>
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      {/* MODAL: RINCIAN LOG KEHADIRAN SISWA */}
      {selectedStudentAttendance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden p-6 space-y-5 animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
              <div className="flex items-center space-x-3">
                <Avatar
                  namaLengkap={selectedStudentAttendance.siswa.namaLengkap}
                  fotoProfil={selectedStudentAttendance.siswa.fotoProfil}
                  className="w-11 h-11 text-xs font-bold"
                />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Log Presensi: {selectedStudentAttendance.siswa.namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    NIS: {selectedStudentAttendance.siswa.nis} • Halaqah: {myHalaqah?.namaHalaqah || '-'} • Periode: {selectedStudentAttendance.timeframe?.toUpperCase() || rekapTimeframe.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentAttendance(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeframe vs All Switcher */}
            {selectedStudentAttendance.timeframeRecords && selectedStudentAttendance.allRecords && selectedStudentAttendance.allRecords.length > selectedStudentAttendance.timeframeRecords.length && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const recs = selectedStudentAttendance.timeframeRecords;
                    const hadir = recs.filter((r: any) => r.status === 'Hadir').length;
                    setSelectedStudentAttendance((prev: any) => ({
                      ...prev,
                      records: recs,
                      viewMode: 'timeframe',
                      total: recs.length,
                      hadir,
                      izin: recs.filter((r: any) => r.status === 'Izin').length,
                      sakit: recs.filter((r: any) => r.status === 'Sakit').length,
                      alpha: recs.filter((r: any) => r.status === 'Alpha').length,
                      rate: recs.length > 0 ? Math.round((hadir / recs.length) * 100) : 100
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedStudentAttendance.viewMode === 'timeframe'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Periode Rekap ({selectedStudentAttendance.timeframeRecords.length} Hari)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const recs = selectedStudentAttendance.allRecords;
                    const hadir = recs.filter((r: any) => r.status === 'Hadir').length;
                    setSelectedStudentAttendance((prev: any) => ({
                      ...prev,
                      records: recs,
                      viewMode: 'all',
                      total: recs.length,
                      hadir,
                      izin: recs.filter((r: any) => r.status === 'Izin').length,
                      sakit: recs.filter((r: any) => r.status === 'Sakit').length,
                      alpha: recs.filter((r: any) => r.status === 'Alpha').length,
                      rate: recs.length > 0 ? Math.round((hadir / recs.length) * 100) : 100
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedStudentAttendance.viewMode === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Semua Riwayat ({selectedStudentAttendance.allRecords.length} Hari)
                </button>
              </div>
            )}

            {/* Quick summary cards */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Pertemuan</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentAttendance.total} Hari</span>
              </div>
              <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono block">Hadir</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{selectedStudentAttendance.hadir}</span>
              </div>
              <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase font-mono block">Izin</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">{selectedStudentAttendance.izin}</span>
              </div>
              <div className="p-2.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase font-mono block">Sakit</span>
                <span className="font-bold text-sky-700 dark:text-sky-300">{selectedStudentAttendance.sakit}</span>
              </div>
              <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase font-mono block">Alpha</span>
                <span className="font-bold text-rose-700 dark:text-rose-300">{selectedStudentAttendance.alpha}</span>
              </div>
            </div>

            {/* Scrollable list of attendance records */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
              {selectedStudentAttendance.records.map((record: any) => (
                <div
                  key={record.id || record.tanggal}
                  className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="min-w-[150px]">
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {record.tanggal}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {formatIndonesianDate(record.tanggal)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={record.status}
                      onChange={(e) => handleUpdateSiswaRecord(
                        selectedStudentAttendance.siswa.id,
                        record.tanggal,
                        e.target.value as any,
                        record.catatan || ''
                      )}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Izin">Izin</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Alpha">Alpha</option>
                    </select>

                    <input
                      type="text"
                      defaultValue={record.catatan || ''}
                      onBlur={(e) => {
                        if (e.target.value !== record.catatan) {
                          handleUpdateSiswaRecord(
                            selectedStudentAttendance.siswa.id,
                            record.tanggal,
                            record.status,
                            e.target.value
                          );
                        }
                      }}
                      placeholder="Catatan..."
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}

              {selectedStudentAttendance.records.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Belum ada rekaman kehadiran untuk santri ini.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleResetSiswaAttendance(selectedStudentAttendance.siswa.id)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Log Santri</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentAttendance(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: KELOLA TANGGAL PERTEMUAN EFEKTIF */}
      {isEditPertemuanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-5 animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                  <span>Kelola Hari Pertemuan Efektif</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tambah atau hapus tanggal pertemuan halaqah bimbingan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPertemuanModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tambah Hari Efektif Baru */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-mono block">
                Tambah Tanggal Pertemuan Baru:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newEffectiveDate}
                  onChange={(e) => setNewEffectiveDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddEffectiveDate}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                Santri pada tanggal baru ini otomatis diset default "Hadir".
              </p>
            </div>

            {/* List Hari Efektif Terdaftar */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                Daftar Tanggal Pertemuan Terdaftar ({halaqahEffectiveDates.length}):
              </span>
              {halaqahEffectiveDates.map((dateStr) => (
                <div
                  key={dateStr}
                  className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {dateStr}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {formatIndonesianDate(dateStr)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAttendanceDate(dateStr);
                        setIsEditPertemuanModalOpen(false);
                      }}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Buka
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEffectiveDate(dateStr)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Hapus tanggal ini beserta seluruh catatan presensinya"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {halaqahEffectiveDates.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs italic">
                  Belum ada tanggal pertemuan efektif terdaftar.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditPertemuanModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
