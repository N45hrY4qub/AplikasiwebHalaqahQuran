import React, { useMemo } from 'react';
import {
  Bell,
  BookOpen,
  Home,
  ChevronRight,
  Users,
  Calendar,
  CheckCircle2,
  XSquare,
  Award,
  TrendingUp,
  Sparkles,
  Clock,
  ArrowRight,
  AlertCircle,
  Activity,
  FileCheck,
  Check,
  UserCheck,
  FlaskConical
} from 'lucide-react';
import { Siswa, Halaqah, Setoran, JenisKelamin, StatusAktif } from '../types';
import { Avatar } from './Avatar';
import { AnnouncementBoardWidget } from './AnnouncementBoardWidget';
import { GuruMonthlyAttendanceList } from './GuruMonthlyAttendanceList';
import { useApp } from '../context/AppContext';
import { findUnrecordedAttendanceForGuru, getActiveSchedulesForHalaqah, getTeacherHalaqahs } from '../utils/studentAttendanceHelper';

export interface GuruDashboardProps {
  myHalaqah?: Halaqah | null;
  myStudents: Siswa[];
  myStudentsAll?: Siswa[];
  myGuruObj?: any;
  myUser?: any;
  updateHalaqah?: (id: string, updates: Partial<Halaqah>) => void;
  addLog?: (action: string, details: string) => void;
  setActiveTab: (tab: string) => void;
  attendance?: any[];
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({
  myHalaqah,
  myStudents = [],
  myStudentsAll = [],
  myGuruObj,
  myUser,
  updateHalaqah: updateHalaqahProp,
  addLog: addLogProp,
  setActiveTab,
  attendance: attendanceProp
}) => {
  const { 
    setorans = [], 
    siswas = [],
    halaqahs = [],
    gurus = [],
    guruSchedules = [], 
    studentAttendance = [],
    guruAttendance = [],
    updateHalaqah: updateHalaqahContext, 
    addLog: addLogContext,
    isFeatureEnabledForUser,
    currentSession,
    setSelectedGuruHalaqahId
  } = useApp();

  const teacherHalaqahs = useMemo(() => {
    return getTeacherHalaqahs(halaqahs, myUser, gurus, guruSchedules, siswas);
  }, [halaqahs, myUser, gurus, guruSchedules, siswas]);

  const teacherId = myUser?.id || myGuruObj?.id || '';

  const showCockpitModern = isFeatureEnabledForUser('guru_cockpit_modern', currentSession.user?.id, currentSession.user?.role);
  const showKhatamMilestone = isFeatureEnabledForUser('guru_khatam_milestone', currentSession.user?.id, currentSession.user?.role);
  const showTrenSetoran = isFeatureEnabledForUser('guru_tren_setoran_mingguan', currentSession.user?.id, currentSession.user?.role);

  const updateHalaqah = updateHalaqahProp || updateHalaqahContext;
  const addLog = addLogProp || addLogContext;

  const attendance = useMemo(() => {
    if (attendanceProp && Array.isArray(attendanceProp)) return attendanceProp;
    try {
      const saved = localStorage.getItem('mh_student_attendance') || localStorage.getItem('mh_guru_attendance');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  }, [attendanceProp]);

  // Pengecekan santri yang belum ada keterangan kehadiran pada hari jadwal halaqah
  const unrecordedAlert = useMemo(() => {
    const rawAttendance = (studentAttendance && studentAttendance.length > 0) ? studentAttendance : attendance;
    return findUnrecordedAttendanceForGuru(
      myHalaqah,
      myStudents,
      guruSchedules,
      setorans,
      rawAttendance,
      14,
      guruAttendance,
      teacherId,
      myGuruObj?.namaLengkap
    );
  }, [myHalaqah, myStudents, guruSchedules, setorans, studentAttendance, attendance, guruAttendance, teacherId, myGuruObj]);

  // Himpunan ID seluruh santri yang terdaftar dalam halaqah terpilih
  const selectedHalaqahStudentIds = useMemo(() => {
    const idSet = new Set<string>();
    myStudents.forEach(s => { if (s.id) idSet.add(s.id); });
    (myStudentsAll || []).forEach(s => { if (s.id) idSet.add(s.id); });
    if (myHalaqah) {
      siswas.forEach(s => {
        if (s.halaqahId === myHalaqah.id) {
          idSet.add(s.id);
        } else if (
          myHalaqah.namaHalaqah &&
          s.halaqahNama &&
          s.halaqahNama.trim().toLowerCase() === myHalaqah.namaHalaqah.trim().toLowerCase()
        ) {
          idSet.add(s.id);
        }
      });
    }
    return idSet;
  }, [myStudents, myStudentsAll, myHalaqah, siswas]);

  // Filter setoran khusus untuk bimbingan pada halaqah terpilih
  const halaqahSetorans = useMemo(() => {
    if (!myHalaqah) {
      return setorans.filter(s => s.guruId === teacherId);
    }
    return setorans.filter(s => {
      // Jika record setoran mencantumkan halaqahId yang secara eksplisit berbeda, jangan sertakan
      if (s.halaqahId && myHalaqah.id && s.halaqahId !== myHalaqah.id) {
        return false;
      }

      // Cocokkan apakah santri merupakan anggota halaqah terpilih
      const isStudentMatch = Boolean(s.siswaId && selectedHalaqahStudentIds.has(s.siswaId));

      // Cocokkan id halaqah
      const isHalaqahIdMatch = Boolean(s.halaqahId && myHalaqah.id && s.halaqahId === myHalaqah.id);

      // Cocokkan nama halaqah (fallback untuk data tanpa id halaqah)
      const isHalaqahNamaMatch = Boolean(
        s.halaqahNama &&
        myHalaqah.namaHalaqah &&
        s.halaqahNama.trim().toLowerCase() === myHalaqah.namaHalaqah.trim().toLowerCase()
      );

      return isStudentMatch || isHalaqahIdMatch || isHalaqahNamaMatch;
    });
  }, [setorans, myHalaqah, teacherId, selectedHalaqahStudentIds]);

  // Today string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's setorans
  const setorToday = useMemo(() => {
    return halaqahSetorans.filter(s => s.tanggalSetoran === todayStr);
  }, [halaqahSetorans, todayStr]);

  const myStudentsSetorToday = useMemo(() => {
    return setorToday.filter(s => myStudents.some(ms => ms.id === s.siswaId)).length;
  }, [setorToday, myStudents]);

  // Attendance for today
  const todayAtList = useMemo(() => {
    return attendance.filter(a => a.tanggal === todayStr);
  }, [attendance, todayStr]);

  const totalHalaqahHadirToday = useMemo(() => {
    return todayAtList.filter(a => a.status === 'Hadir' && myStudents.some(ms => ms.id === a.siswaId)).length;
  }, [todayAtList, myStudents]);

  // Total capaian lulus
  const totalCapaianLulus = useMemo(() => {
    return halaqahSetorans.filter(s => s.statusLulus && myStudents.some(ms => ms.id === s.siswaId)).length;
  }, [halaqahSetorans, myStudents]);

  // Real Weekly Setoran Counts for the last 7 days
  const weeklyChartData = useMemo(() => {
    const daysName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const result: Array<{ day: string; dateStr: string; val: number; isToday: boolean }> = [];

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = daysName[d.getDay()];

      const count = halaqahSetorans.filter(s => s.tanggalSetoran === dateStr).length;
      result.push({
        day: dayName,
        dateStr,
        val: count,
        isToday: dateStr === todayStr
      });
    }
    return result;
  }, [halaqahSetorans, todayStr]);

  const maxWeeklyVal = useMemo(() => {
    const maxVal = Math.max(...weeklyChartData.map(d => d.val), 5);
    return maxVal;
  }, [weeklyChartData]);

  // 5 setoran terbaru khusus menampilkan data santri dari halaqah terpilih
  const latestSetorans = useMemo(() => {
    if (!myHalaqah) return [];
    return [...halaqahSetorans]
      .filter(s => {
        // Prioritaskan verifikasi ID santri halaqah terpilih
        if (selectedHalaqahStudentIds.size > 0) {
          return Boolean(s.siswaId && selectedHalaqahStudentIds.has(s.siswaId));
        }
        // Fallback jika halaqah belum memiliki daftar santri terdaftar
        return (
          (s.halaqahId && myHalaqah.id && s.halaqahId === myHalaqah.id) ||
          (s.halaqahNama && myHalaqah.namaHalaqah && s.halaqahNama.trim().toLowerCase() === myHalaqah.namaHalaqah.trim().toLowerCase())
        );
      })
      .sort((a, b) => new Date(b.tanggalSetoran || 0).getTime() - new Date(a.tanggalSetoran || 0).getTime())
      .slice(0, 5);
  }, [halaqahSetorans, myHalaqah, selectedHalaqahStudentIds]);

  // Students who haven't submitted setoran in > 3 days
  const studentsNeedAttention = useMemo(() => {
    const now = new Date().getTime();
    return myStudents.filter(student => {
      const studentSetorans = halaqahSetorans.filter(s => s.siswaId === student.id);
      if (studentSetorans.length === 0) return true;

      const latest = [...studentSetorans].sort(
        (a, b) => new Date(b.tanggalSetoran || 0).getTime() - new Date(a.tanggalSetoran || 0).getTime()
      )[0];

      if (!latest.tanggalSetoran) return true;
      const lastDate = new Date(latest.tanggalSetoran).getTime();
      const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
      return diffDays > 3;
    });
  }, [myStudents, halaqahSetorans]);

  const todayDateStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const todayHalaqahSetorans = useMemo(() => {
    return halaqahSetorans.filter(s => (s.tanggalSetoran || '').startsWith(todayDateStr));
  }, [halaqahSetorans, todayDateStr]);

  const studentIdsSubmittedToday = useMemo(() => {
    return new Set(todayHalaqahSetorans.map(s => s.siswaId));
  }, [todayHalaqahSetorans]);

  const todayCompletedCount = myStudents.filter(s => studentIdsSubmittedToday.has(s.id)).length;
  const todayPendingCount = Math.max(0, myStudents.length - todayCompletedCount);
  const todayProgressPercent = myStudents.length > 0 ? Math.round((todayCompletedCount / myStudents.length) * 100) : 0;

  const isUstadzah = myGuruObj?.jenisKelamin === JenisKelamin.PEREMPUAN;
  const titlePanggilan = isUstadzah ? 'Ustadzah' : 'Ustadz';

  // Cek apakah halaqah yang terpilih memiliki jadwal pembelajaran pada hari ini
  // Berdasarkan jadwal yang telah diatur oleh admin pada menu HALAQAH > Jadwal Mengajar Guru
  const { isHalaqahScheduledToday, todayDayName, scheduleNote } = useMemo(() => {
    const daysMap = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
    const now = new Date();
    const todayDayIndex = now.getDay(); // 0 = Ahad/Minggu, 1 = Senin, ..., 6 = Sabtu
    const currentDayName = daysMap[todayDayIndex];

    if (!myHalaqah) {
      return { isHalaqahScheduledToday: false, todayDayName: currentDayName, scheduleNote: '' };
    }

    const dayAliases: Record<string, number> = {
      'ahad': 0, 'minggu': 0, 'sunday': 0,
      'senin': 1, 'monday': 1,
      'selasa': 2, 'tuesday': 2,
      'rabu': 3, 'wednesday': 3,
      'kamis': 4, 'thursday': 4,
      'jumat': 5, "jum'at": 5, 'jumaat': 5, 'friday': 5,
      'sabtu': 6, 'saturday': 6
    };

    // 1. Prioritaskan jadwal aktif dari Admin > HALAQAH > Jadwal Mengajar Guru
    const activeSchedules = getActiveSchedulesForHalaqah(myHalaqah, guruSchedules, teacherId, myGuruObj?.namaLengkap);

    if (activeSchedules.length > 0) {
      const DAY_ORDER: Record<string, number> = {
        'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Ahad': 7
      };
      const uniqueDays = Array.from(new Set(activeSchedules.map(s => s.hari)));
      uniqueDays.sort((a, b) => (DAY_ORDER[a] || 99) - (DAY_ORDER[b] || 99));

      const scheduledDaysSet = new Set<number>();
      uniqueDays.forEach(day => {
        const idx = dayAliases[day.toLowerCase()];
        if (idx !== undefined) scheduledDaysSet.add(idx);
      });

      const times = Array.from(new Set(activeSchedules.map(s => `${s.jamMulai} - ${s.jamSelesai}`)));
      const timeNote = times.length === 1 ? ` (${times[0]})` : '';

      return {
        isHalaqahScheduledToday: scheduledDaysSet.has(todayDayIndex),
        todayDayName: currentDayName,
        scheduleNote: `${uniqueDays.join(', ')}${timeNote}`
      };
    }

    // 2. Fallback HANYA JIKA belum ada jadwal yang diatur oleh Admin pada Jadwal Mengajar Guru
    const scheduledDaysSet = new Set<number>();
    let hasAnyExplicitSchedule = false;

    // Cek string jadwal pada data halaqah terpilih (hariKegiatan, jadwal, dsb.)
    const scheduleStr = [
      myHalaqah.hariKegiatan,
      (myHalaqah as any).jadwal,
      (myHalaqah as any).jadwalKegiatan,
      (myHalaqah as any).jadwalHalaqah
    ].filter(Boolean).join(' ').trim();

    if (scheduleStr) {
      const lower = scheduleStr.toLowerCase();

      if (lower.includes('belum diatur') || lower.includes('tidak diatur') || lower.includes('belum ada') || lower.includes('libur') || lower.includes('tidak ada jadwal') || lower.includes('non-aktif') || lower.includes('off')) {
        hasAnyExplicitSchedule = false;
      } else if (lower.includes('setiap hari') || lower.includes('harian') || lower.includes('tiap hari') || lower.includes('semua hari')) {
        hasAnyExplicitSchedule = true;
        for (let i = 0; i <= 6; i++) scheduledDaysSet.add(i);
      } else {
        const rangeRegex = /(senin|selasa|rabu|kamis|jumat|jum'?at|sabtu|ahad|minggu)\s*(?:-|s\/d|s\.d|sampai|to)\s*(senin|selasa|rabu|kamis|jumat|jum'?at|sabtu|ahad|minggu)/gi;
        let rangeMatch;
        while ((rangeMatch = rangeRegex.exec(lower)) !== null) {
          hasAnyExplicitSchedule = true;
          const sKey = rangeMatch[1].toLowerCase();
          const eKey = rangeMatch[2].toLowerCase();
          const sIdx = dayAliases[sKey];
          const eIdx = dayAliases[eKey];
          if (sIdx !== undefined && eIdx !== undefined) {
            if (sIdx <= eIdx) {
              for (let i = sIdx; i <= eIdx; i++) scheduledDaysSet.add(i);
            } else {
              for (let i = sIdx; i <= 6; i++) scheduledDaysSet.add(i);
              for (let i = 0; i <= eIdx; i++) scheduledDaysSet.add(i);
            }
          }
        }

        const dayWordRegex = /\b(senin|selasa|rabu|kamis|jumat|jum'?at|sabtu|ahad|minggu)\b/gi;
        const matched = lower.match(dayWordRegex);
        if (matched && matched.length > 0) {
          hasAnyExplicitSchedule = true;
          matched.forEach(w => {
            const idx = dayAliases[w.toLowerCase()];
            if (idx !== undefined) scheduledDaysSet.add(idx);
          });
        }
      }
    }

    if (!hasAnyExplicitSchedule && myHalaqah.keterangan) {
      const lowerKet = myHalaqah.keterangan.toLowerCase();
      const dayWordRegex = /\b(senin|selasa|rabu|kamis|jumat|jum'?at|sabtu|ahad|minggu)\b/gi;
      const matched = lowerKet.match(dayWordRegex);
      if (matched && matched.length > 0) {
        hasAnyExplicitSchedule = true;
        matched.forEach(w => {
          const idx = dayAliases[w.toLowerCase()];
          if (idx !== undefined) scheduledDaysSet.add(idx);
        });
      }
    }

    if (!hasAnyExplicitSchedule || scheduledDaysSet.size === 0) {
      return {
        isHalaqahScheduledToday: false,
        todayDayName: currentDayName,
        scheduleNote: 'Belum Terjadwal'
      };
    }

    return {
      isHalaqahScheduledToday: scheduledDaysSet.has(todayDayIndex),
      todayDayName: currentDayName,
      scheduleNote: myHalaqah.hariKegiatan || Array.from(scheduledDaysSet).map(idx => daysMap[idx]).join(', ')
    };
  }, [myHalaqah, guruSchedules, teacherId, myGuruObj]);

  return (
    <div id="guru-dashboard-root" className="space-y-6 animate-fadeIn">
      {/* Top Info Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 sm:p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden transition-all">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-8 translate-x-8">
          <BookOpen className="w-48 h-48 sm:w-64 sm:h-64 text-white" />
        </div>
        
        <div className="relative z-10">
          {/* Header Row: Pill Badge & Profile Photo on Top Right */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-white/10 text-emerald-300 dark:text-emerald-400 font-mono tracking-wider sm:tracking-widest uppercase">
                <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-emerald-400 animate-swing shrink-0" /> MAJELIS GURU BIMBINGAN
              </span>

              {teacherHalaqahs.length > 1 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/40 border border-emerald-400/30 rounded-xl text-emerald-200">
                  <span className="text-[10px] font-mono text-emerald-300/80 font-bold uppercase">Halaqah:</span>
                  <select
                    value={myHalaqah?.id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && setSelectedGuruHalaqahId) {
                        setSelectedGuruHalaqahId(val);
                      }
                    }}
                    className="text-[11px] font-bold bg-transparent text-emerald-300 cursor-pointer focus:outline-none"
                    title="Ganti Halaqah Bimbingan"
                  >
                    {teacherHalaqahs.map(h => (
                      <option key={h.id} value={h.id} className="bg-slate-900 text-white font-sans">
                        {h.namaHalaqah}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {myHalaqah && (
              <div className="relative group shrink-0 flex flex-col items-center">
                <div className="relative cursor-pointer">
                  <Avatar
                    namaLengkap={myHalaqah.namaHalaqah}
                    fotoProfil={myHalaqah.fotoHalaqah}
                    className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 text-sm sm:text-base md:text-xl border-2 border-white/40 shadow-md transition-transform active:scale-95"
                  />
                  <label 
                    className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200"
                    title="Ubah Foto Profil Halaqah"
                  >
                    <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">Ubah</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && myHalaqah) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateHalaqah(myHalaqah.id, { fotoHalaqah: reader.result as string });
                            addLog('Update Foto Halaqah', `Mengubah foto profil halaqah: ${myHalaqah.namaHalaqah}`);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {myHalaqah.fotoHalaqah && myHalaqah.fotoHalaqah !== '' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (myHalaqah) {
                        updateHalaqah(myHalaqah.id, { fotoHalaqah: '' });
                        addLog('Hapus Foto Halaqah', `Menghapus foto profil halaqah: ${myHalaqah.namaHalaqah}`);
                      }
                    }}
                    className="text-[8px] sm:text-[9px] text-emerald-200 hover:text-white mt-1 underline cursor-pointer font-sans transition-colors"
                    title="Hapus foto profil halaqah"
                  >
                    Hapus
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Title & Motivational Quote */}
          <div className="mt-2.5 sm:mt-3 max-w-3xl pr-2">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight font-sans leading-snug">
              Ahlan Wa Sahlan {titlePanggilan}{myGuruObj?.namaLengkap ? ` ${myGuruObj.namaLengkap}` : ''}, Selamat bertugas kembali
            </h2>
            <p className="mt-1.5 sm:mt-2.5 text-[11px] sm:text-xs md:text-sm text-slate-100 leading-relaxed font-sans font-medium italic opacity-95">
              "Niatkan selalu tugas bimbingan Al-Qur'an yang {titlePanggilan} jalankan tulus ikhlas semata-mata karena Allah ta'ala, bersabarlah dengan penuh kelembutan dalam membimbing setiap santri, dan semoga khidmat mulia ini menjadi pemberat timbangan amal kebaikan di akhirat kelak."
            </p>
          </div>
        </div>
      </div>

      {/* Announcement Board Widget */}
      <AnnouncementBoardWidget setActiveTab={setActiveTab} />

      {/* Pengingat Keterangan Ketidakhadiran Santri (Berdasarkan Jadwal Halaqah Guru) */}
      {unrecordedAlert && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-500/30 dark:border-amber-400/30 rounded-2xl p-4 sm:p-5 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    Pengingat Absensi Santri
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {unrecordedAlert.scheduleLabel}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white">
                  Terdapat {unrecordedAlert.count} santri belum memiliki catatan kehadiran
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Santri: <strong className="text-amber-700 dark:text-amber-300">{unrecordedAlert.namesPreview}</strong> tidak ada riwayat setoran pada hari {unrecordedAlert.datesLabel} dan belum dilengkapi status kehadirannya (Sakit, Izin, atau Alpa).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (unrecordedAlert.targetDateToOpen) {
                  try {
                    localStorage.setItem('mh_selected_attendance_date', unrecordedAlert.targetDateToOpen);
                  } catch {}
                }
                setActiveTab('guru_absensi');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-900/20 transition active:scale-95 shrink-0 cursor-pointer"
            >
              <span>Lengkapi Keterangan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FEATURE LAB UPGRADE: Cockpit Modern Halaqah (Canary/Beta Feature) */}
      {showCockpitModern && (
        <div 
          id="guru-cockpit-modern-card"
          className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white border border-indigo-500/40 shadow-xl relative overflow-hidden animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Sesi Halaqah Aktif
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                  <FlaskConical className="w-3 h-3 text-amber-400" />
                  Cockpit Upgrade (Beta)
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Pusat Kendali Bimbingan Hari Ini
              </h3>
              <p className="text-xs text-indigo-200/80 leading-relaxed max-w-xl">
                Pantau langsung santri yang sudah menyetorkan hafalan hari ini dan kelola antrean bimbingan secara cepat dan efisien.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
              <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/10 text-center">
                <span className="text-[11px] text-slate-300 block font-medium">Santri Binaan</span>
                <span className="text-xl font-black text-white">{myStudents.length}</span>
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-emerald-400/30 text-center">
                <span className="text-[11px] text-emerald-200 block font-medium">Sudah Setor</span>
                <span className="text-xl font-black text-emerald-300">{todayCompletedCount}</span>
              </div>
              <div className="bg-amber-500/20 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-amber-400/30 text-center">
                <span className="text-[11px] text-amber-200 block font-medium">Belum Menghadap</span>
                <span className="text-xl font-black text-amber-300">{todayPendingCount}</span>
              </div>
            </div>
          </div>

          {/* Progress bar today */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-1.5 max-w-md">
              <div className="flex items-center justify-between text-xs text-indigo-200">
                <span>Progres Setoran Hari Ini</span>
                <span className="font-bold text-white font-mono">{todayProgressPercent}% ({todayCompletedCount}/{myStudents.length})</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
                  style={{ width: `${todayProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('guru_mutabaah')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Input Setoran Cepat</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guru_murojaah_berpasangan')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs transition"
              >
                <Users className="w-3.5 h-3.5 text-indigo-300" />
                <span>Murojaah Pasangan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guru_absensi')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs transition"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>Presensi Hari Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Halaqah Pribadi Dashboard Shortcut Widget */}
      {myGuruObj?.izinHalaqahPribadi && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/40 dark:from-indigo-950/25 dark:to-indigo-950/10 border border-indigo-100 dark:border-indigo-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl text-indigo-700 dark:text-indigo-300">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">☑ Akses Halaqah Pribadi Aktif</h4>
              <p className="text-xs text-slate-500 mt-0.5">Anda memiliki izin mendirikan dan mengelola halaqah serta santri mandiri di luar Yayasan resmi.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('guru_halaqah_pribadi');
              } else {
                const navEl = document.getElementById('nav-item-guru_halaqah_pribadi');
                if (navEl) navEl.click();
              }
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase flex items-center transition shadow-md shrink-0"
          >
            Mulai Kelola <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      )}

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Menu 1: Input Setoran */}
        <div className="relative group">
          <div className="pointer-events-none absolute -top-8.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 transition-all duration-200 z-30 hidden md:flex items-center px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap shadow-xl border border-slate-700/60 backdrop-blur-xs">
            <span>Mutabaah santri</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-slate-800 border-r border-b border-slate-700/60" />
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('guru_mutabaah')}
            title="Mutabaah santri"
            className="w-full h-full p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-left hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5 sm:gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
              Input Setoran
            </span>
          </button>
        </div>

        {/* Menu 2: Absensi Presensi */}
        <div className="relative group">
          <div className="pointer-events-none absolute -top-8.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 transition-all duration-200 z-30 hidden md:flex items-center px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap shadow-xl border border-slate-700/60 backdrop-blur-xs">
            <span>Presensi harian</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-slate-800 border-r border-b border-slate-700/60" />
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('guru_absensi')}
            title="Presensi harian"
            className="w-full h-full p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-left hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5 sm:gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              Absensi Presensi
            </span>
          </button>
        </div>

        {/* Menu 3: Murojaah Pasangan */}
        <div className="relative group">
          <div className="pointer-events-none absolute -top-8.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 transition-all duration-200 z-30 hidden md:flex items-center px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap shadow-xl border border-slate-700/60 backdrop-blur-xs">
            <span>Simaan antar santri</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-slate-800 border-r border-b border-slate-700/60" />
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('guru_murojaah_berpasangan')}
            title="Simaan antar santri"
            className="w-full h-full p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-left hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5 sm:gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
              Murojaah Pasangan
            </span>
          </button>
        </div>

        {/* Menu 4: Data Santri */}
        <div className="relative group">
          <div className="pointer-events-none absolute -top-8.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 transition-all duration-200 z-30 hidden md:flex items-center px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap shadow-xl border border-slate-700/60 backdrop-blur-xs">
            <span>{myStudents.length} santri binaan</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-slate-800 border-r border-b border-slate-700/60" />
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('guru_siswas')}
            title={`${myStudents.length} santri binaan`}
            className="w-full h-full p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-left hover:border-sky-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5 sm:gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
              Data Santri
            </span>
          </button>
        </div>
      </div>

      {/* WIDGET: DAFTAR KEHADIRAN GURU DALAM BULAN AKTIF */}
      <GuruMonthlyAttendanceList
        myUser={myUser}
        myGuruObj={myGuruObj}
        myHalaqah={myHalaqah}
        variant="dashboard"
        onNavigateToFull={() => setActiveTab('guru_absensi')}
        addLog={addLog}
      />

      {/* KPI Dashboard Grid (Dinonaktifkan sementara sesuai permintaan) */}
      {false && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1: Jumlah Siswa Halaqah */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siswa Asuhan</span>
              <div className="p-2 bg-emerald-50 dark:bg-slate-900 text-emerald-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{myStudents.length}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Status santri bimbingan aktif</p>
            </div>
          </div>

          {/* KPI 2: Hadir Hari Ini */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siswa Hadir Hari Ini</span>
              <div className="p-2 bg-indigo-50 dark:bg-slate-900 text-indigo-600 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {totalHalaqahHadirToday}/{myStudents.length}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Siswa ter-absen hari ini</p>
            </div>
          </div>

          {/* KPI 3: Setor Hari Ini */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setor Hari Ini</span>
              <div className="p-2 bg-sky-50 dark:bg-slate-900 text-sky-600 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{myStudentsSetorToday}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Telah menyetor baru</p>
            </div>
          </div>

          {/* KPI 4: Belum Setor */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum Setor</span>
              <div className="p-2 bg-rose-50 dark:bg-slate-900 text-rose-500 rounded-xl">
                <XSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                {Math.max(0, myStudents.length - myStudentsSetorToday)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Siswa belum ujian hari ini</p>
            </div>
          </div>

          {/* KPI 5: Total Capaian Selesai */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lulus Capaian</span>
              <div className="p-2 bg-amber-50 dark:bg-slate-900 text-amber-500 rounded-xl">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalCapaianLulus}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Total capaian bimbingan lulus</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Charts & Need Attention */}
      {showTrenSetoran ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setoran Mingguan chart representation */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tren Setoran 7 Hari Terakhir</h4>
                <p className="text-[11px] text-slate-400">Aktivitas mutabaah setoran harian halaqah bimbingan</p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-slate-900 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Graphic Custom design bar chart using absolute layout */}
            <div className="h-52 flex items-end justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              {weeklyChartData.map((item, idx) => {
                const hPercent = (item.val / maxWeeklyVal) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 space-y-2 group relative">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                      {item.val}
                    </span>
                    <div
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                        item.isToday
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/20'
                          : item.val > 0
                          ? 'bg-emerald-400 dark:bg-emerald-500/80 hover:bg-emerald-500'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                      style={{ height: `${Math.max(12, hPercent * 1.3)}px` }}
                    />
                    <div className="text-center">
                      <span className={`text-[10px] font-bold block ${item.isToday ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
                        {item.day}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                        {item.dateStr.slice(8, 10)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">Rata-rata: {(weeklyChartData.reduce((acc, curr) => acc + curr.val, 0) / 7).toFixed(1)} setoran/hari</span>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
                <span className="text-[10px] text-slate-400">Hari Ini</span>
              </div>
            </div>
          </div>

          {/* Santri Butuh Pantauan / Perhatian */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Santri Perlu Perhatian</h4>
                <p className="text-[11px] text-slate-400">Belum menyetor dalam 3+ hari terakhir</p>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-slate-900 text-amber-500 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
              {studentsNeedAttention.length === 0 ? (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                  <p className="text-xs font-medium">Alhamdulillah! Semua santri aktif menyetor secara berkala.</p>
                </div>
              ) : (
                studentsNeedAttention.slice(0, 5).map(student => (
                  <div
                    key={student.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{student.namaLengkap}</p>
                      <p className="text-[10px] text-slate-400 font-mono">NIS: {student.nis || '-'}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('guru_mutabaah')}
                      className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition flex items-center shrink-0"
                    >
                      Bimbing <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-400">Total: {studentsNeedAttention.length} santri</span>
              <button
                onClick={() => setActiveTab('guru_siswas')}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center"
              >
                Lihat Semua Santri <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Layout Selaras saat Tren Setoran Dinonaktifkan: Kolom kedua (Progres Bimbingan Hari Ini) hanya tampil jika halaqah terpilih memiliki jadwal pembelajaran pada hari ini */
        <div className={`grid grid-cols-1 ${isHalaqahScheduledToday ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Kolom 1: Santri Perlu Perhatian */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Santri Perlu Perhatian</h4>
                  {studentsNeedAttention.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {studentsNeedAttention.length} Santri
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Belum menyetor hafalan dalam 3+ hari terakhir</p>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-slate-900 text-amber-500 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2 pr-1">
              {studentsNeedAttention.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alhamdulillah! Semua Santri Aktif</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada santri yang tertinggal menyetor lebih dari 3 hari.</p>
                </div>
              ) : (
                studentsNeedAttention.slice(0, 5).map(student => (
                  <div
                    key={student.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 hover:border-amber-200 dark:hover:border-amber-900/60 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{student.namaLengkap}</p>
                      <p className="text-[10px] text-slate-400 font-mono">NIS: {student.nis || '-'}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('guru_mutabaah')}
                      className="px-3 py-1.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition flex items-center shrink-0 shadow-xs"
                    >
                      Bimbing <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-400">Total: {studentsNeedAttention.length} santri binaan</span>
              <button
                onClick={() => setActiveTab('guru_siswas')}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center"
              >
                Lihat Semua Santri <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Kolom 2: Aktivitas & Kesiapan Bimbingan Hari Ini (Hanya ditampilkan jika halaqah terpilih memiliki jadwal pembelajaran pada hari ini) */}
          {isHalaqahScheduledToday && (
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Progres Bimbingan Hari Ini</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                      {todayProgressPercent}% Selesai
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Ringkasan realtime aktivitas setoran dan presensi halaqah</p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-slate-900 text-emerald-600 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="flex-1 space-y-3.5">
                {/* 3 Mini Metric Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Sudah Setor</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {todayCompletedCount} <span className="text-[10px] text-slate-400 font-normal">/ {myStudents.length}</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Belum Menghadap</span>
                    <span className="text-base font-extrabold text-amber-500 font-mono">
                      {todayPendingCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Presensi Hadir</span>
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                      {totalHalaqahHadirToday}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Tingkat Penuntasan Bimbingan</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{todayCompletedCount} dari {myStudents.length} Santri</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${todayProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Status Setoran Hari Ini */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Setoran Masuk Hari Ini</span>
                  {todayHalaqahSetorans.length === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Belum ada setoran tercatat hari ini. Buka input setoran untuk mulai menyimak santri.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {todayHalaqahSetorans.slice(0, 3).map((st, i) => (
                        <div key={i} className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div className="truncate min-w-0 pr-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-[11px]">{st.siswaNama}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{st.modulNama || st.suratNama || 'Al-Quran'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${st.statusLulus ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'}`}>
                            {st.statusLulus ? 'Lulus' : 'Ulang'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('guru_mutabaah')}
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Input Setoran Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guru_absensi')}
                  className="py-2 px-3 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Presensi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Latest Setoran Section */}
      <div id="kartu-setoran-terbaru" className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Setoran Terbaru</h4>
              {myHalaqah?.namaHalaqah && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 truncate max-w-[220px]">
                  {myHalaqah.namaHalaqah}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {myHalaqah?.namaHalaqah 
                ? `Riwayat setoran mutakhir khusus santri ${myHalaqah.namaHalaqah}` 
                : 'Pemberian setoran mutakhir bimbingan Anda'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('guru_mutabaah')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center hover:underline cursor-pointer"
          >
            Lihat Semua Riwayat <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <th className="pb-2">Nama Santri</th>
                <th className="pb-2">Modul / Materi</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Tanggal</th>
                <th className="pb-2 text-right">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900 font-medium">
              {latestSetorans.map((s, idx) => (
                <tr key={idx} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/45 transition">
                  <td className="py-3 font-bold">{s.siswaNama}</td>
                  <td className="py-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{s.modulNama}</span>
                    {s.suratNama && (
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {s.suratNama}: {s.ayatAwal}-{s.ayatAkhir}
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${
                        s.statusLulus
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {s.statusLulus ? 'LULUS' : 'MENGULANG'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{s.tanggalSetoran || '-'}</td>
                  <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {s.nilai ?? '-'}
                  </td>
                </tr>
              ))}
              {latestSetorans.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center italic text-slate-400">
                    Belum ada riwayat setoran santri di {myHalaqah?.namaHalaqah ? `halaqah ${myHalaqah.namaHalaqah}` : 'halaqah ini'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
