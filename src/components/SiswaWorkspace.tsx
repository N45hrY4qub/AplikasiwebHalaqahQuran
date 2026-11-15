/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getGoogleAccessToken, signInWithGoogleWorkspace } from './GoogleWorkspace';
import { jsPDF } from 'jspdf';
import { 
  UserRole, 
  StatusAktif, 
  TipeModul, 
  Siswa, 
  Setoran,
  Modul,
  Halaqah,
  isElemenAvailableForHalaqah
} from '../types';
import { Avatar } from './Avatar';
import { SiswaDashboard } from './SiswaDashboard';
import { SiswaMutabaah } from './SiswaMutabaah';
import { SiswaProfile } from './SiswaProfile';
import { getQuranDefaultJuz } from '../lib/quranJuzHelper';
import { calculateStudentProgress, StudentProgressResult } from '../utils/targetProgressHelper';
import { findMatchingGuruAttendanceRecord, normalizeHalaqahKey } from '../utils/studentAttendanceHelper';
import { 
  Trophy, 
  TrendingUp, 
  Award, 
  Calendar, 
  BookMarked, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  XCircle, 
  X,
  User, 
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  UserCheck,
  UserX,
  CalendarDays,
  Trash2,
  Mail, 
  Phone, 
  MapPin, 
  Compass, 
  BookOpen, 
  History, 
  FileText, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Bookmark, 
  Bell, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Filter, 
  Lock, 
  Activity, 
  Menu,
  Home,
  Video,
  ArrowLeft,
  ShieldAlert,
  Cloud,
  Folder,
  FolderPlus,
  FolderOpen,
  Save,
  Camera
} from 'lucide-react';
import { AnnouncementBoardWidget } from './AnnouncementBoardWidget';

// Helper function to sanitize Google Docs/Slides URLs for embedding layout
export const getEmbedUrl = (url: string, type: 'doc' | 'slide') => {
  if (!url) return '';
  try {
    if (url.includes('/preview') || url.includes('/embed')) return url;
    const docIdRegex = /\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(docIdRegex);
    if (match && match[1]) {
      const docId = match[1];
      if (type === 'doc') {
        return `https://docs.google.com/document/d/${docId}/preview`;
      } else {
        return `https://docs.google.com/presentation/d/${docId}/embed?start=false&loop=false`;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return url;
};

import { renderArabicEnhancedText } from '../lib/arabicHelper';
export { renderArabicEnhancedText };

interface SiswaWorkspaceProps {
  subTab: string;
  setActiveTab?: (tab: string) => void;
}

// ----------------------------------------------------------------------
// CONSTANTS & UTILITIES FOR AL-QURAN PERSONALIZATION
// ----------------------------------------------------------------------
export const QURAN_BG_THEMES = [
  { id: 'cream', name: 'Mushaf (Cream)', bgClass: 'bg-[#faf6eb]', textClass: 'text-[#2c2415]', borderClass: 'border-[#eae2cc]', desc: 'Klasik seperti kertas Mushaf cetak, nyaman untuk retina' },
  { id: 'white', name: 'Putih Bersih', bgClass: 'bg-white', textClass: 'text-slate-900', borderClass: 'border-slate-200', desc: 'Kontras default yang jernih' },
  { id: 'green', name: 'Hijau Daun', bgClass: 'bg-[#f4faf7]', textClass: 'text-[#0f3d23]', borderClass: 'border-[#d0edd8]', desc: 'Nuansa hijau Raudhah yang sejuk di mata' },
  { id: 'peach', name: 'Peach Teduh', bgClass: 'bg-[#fdf7ee]', textClass: 'text-[#3e2815]', borderClass: 'border-[#f3e5d0]', desc: 'Warna hangat pastel yang tenang' },
  { id: 'night', name: 'Mode Malam (Gelap)', bgClass: 'bg-[#141414]', textClass: 'text-slate-200', borderClass: 'border-[#2c2c2c]', desc: 'Mengurangi beban mata saat gelap gulita' }
];

export const QURAN_ACCENT_COLORS = [
  { id: 'emerald', name: 'Emerald', hex: '#10b981', label: 'Hijau' },
  { id: 'gold', name: 'Gold', hex: '#d97706', label: 'Emas' },
  { id: 'indigo', name: 'Indigo', hex: '#4f46e5', label: 'Nila' },
  { id: 'crimson', name: 'Crimson', hex: '#e11d48', label: 'Merah' },
  { id: 'teal', name: 'Teal', hex: '#0d9488', label: 'Sian' },
  { id: 'amber', name: 'Amber', hex: '#b45309', label: 'Kuning Jingga' },
  { id: 'blue', name: 'Blue', hex: '#2563eb', label: 'Biru' }
];

export const QURAN_TEXT_COLORS = [
  { id: 'black', name: 'Hitam (Default)', hexLight: '#000000', hexDark: '#ffffff', label: 'Hitam' },
  { id: 'emerald', name: 'Emerald', hexLight: '#064e3b', hexDark: '#34d399', label: 'Hijau' },
  { id: 'navy', name: 'Navy', hexLight: '#1e3a8a', hexDark: '#60a5fa', label: 'Biru' },
  { id: 'brown', name: 'Cokelat', hexLight: '#451a03', hexDark: '#fcdc94', label: 'Cokelat' },
  { id: 'slate', name: 'Slate', hexLight: '#334155', hexDark: '#cbd5e1', label: 'Abu-abu' }
];

export const toEasternArabicDigits = (num: number): string => {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => digits[parseInt(d)] || d).join('');
};

export const formatArabicFontClean = (text: string): string => {
  if (!text) return '';
  return text.replace(/[\s\r\n\u200B\u200C\u200D\u200E\u200F]+$/, '').trim();
};

interface ReadOnlyImageAnnotationCanvasProps {
  imageSrc: string;
  pageNumber: number;
  readOnlyStrokes?: string;
  readOnlyPins?: string;
}

const ReadOnlyImageAnnotationCanvas: React.FC<ReadOnlyImageAnnotationCanvasProps> = ({
  imageSrc,
  pageNumber,
  readOnlyStrokes,
  readOnlyPins
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const strokes = React.useMemo(() => {
    try {
      if (!readOnlyStrokes) return [];
      const parsed = JSON.parse(readOnlyStrokes);
      const cacheKey = `${imageSrc}_${pageNumber}`;
      return parsed[cacheKey] || [];
    } catch {
      return [];
    }
  }, [readOnlyStrokes, imageSrc, pageNumber]);

  const pins = React.useMemo(() => {
    try {
      if (!readOnlyPins) return [];
      const parsed = JSON.parse(readOnlyPins);
      const cacheKey = `${imageSrc}_${pageNumber}`;
      return parsed[cacheKey] || [];
    } catch {
      return [];
    }
  }, [readOnlyPins, imageSrc, pageNumber]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((stroke: any) => {
      if (stroke.points.length < 1) return;
      ctx.beginPath();
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.brushSize * 4;
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      if (stroke.isHighlighter) {
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = '#facc15'; // Highlighter Yellow
        ctx.lineWidth = stroke.brushSize * 3.5;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color || '#ef4444';
        ctx.lineWidth = stroke.brushSize || 4;
      }

      const firstPoint = stroke.points[0];
      ctx.moveTo(firstPoint.x * canvas.width, firstPoint.y * canvas.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
      }
      ctx.stroke();
    });

    // Reset canvas composition on completion
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  };

  useEffect(() => {
    const handleResize = () => redrawCanvas();
    window.addEventListener('resize', handleResize);
    redrawCanvas();
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes]);

  return (
    <div className="relative border border-slate-150 dark:border-slate-800 rounded-2xl bg-slate-100 dark:bg-slate-900/55 p-2.5 flex items-center justify-center select-none w-full max-h-[500px] min-h-[350px] overflow-hidden">
      <div 
        ref={containerRef} 
        className="relative max-h-full max-w-full flex items-center justify-center shrink-0 h-auto w-auto"
      >
        <img
          src={imageSrc}
          alt={`Page ${pageNumber}`}
          className="max-h-[440px] max-w-full block select-none rounded-xl h-auto w-auto"
          onLoad={redrawCanvas}
          referrerPolicy="no-referrer"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        {pins.map((pin: any, index: number) => {
          const left = `${pin.x}%`;
          const top = `${pin.y}%`;
          return (
            <div
              key={index}
              style={{ left, top }}
              className="absolute group z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="relative flex items-center justify-center w-7 h-7 bg-red-655 hover:bg-red-700 border-2 border-white text-white rounded-full font-bold text-xs shadow-lg transform hover:scale-125 transition-all">
                📌
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-red-400 opacity-20" />
              </div>
              {/* Tooltip on hover */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white text-[11px] p-2.5 rounded-lg whitespace-normal shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48 leading-relaxed font-sans z-30 font-semibold text-slate-100 italic text-left">
                <div className="font-bold border-b border-white/10 pb-1 mb-1 text-[9px] font-mono tracking-wider uppercase text-rose-450 italic font-semibold">Catatan Pin:</div>
                <p className="font-medium text-slate-100 leading-normal not-italic">{pin.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SiswaWorkspace: React.FC<SiswaWorkspaceProps> = ({ subTab, setActiveTab }) => {
  const { 
    currentSession, 
    siswas, 
    halaqahs, 
    gurus, 
    setorans, 
    moduls, 
    updateSiswa, 
    addLog,
    elemenSettings,
    virtualMeetings,
    generalTargets,
    studentTargets,
    guruAttendance,
    studentAttendance,
    guruSchedules,
    studentBookmarks,
    saveStudentBookmarks,
    murojaahBerpasangans,
    createMurojaahBerpasangan,
    updateMurojaahBerpasangan,
    deleteMurojaahBerpasangan
  } = useApp();

  const myUser = currentSession.user;
  const siswaId = myUser?.id || '';

  // 1. DATA PERSONAL SISWA
  const mySiswaObj = siswas.find(s => s.id === siswaId);
  const myHalaqah = mySiswaObj ? halaqahs.find(h => h.id === mySiswaObj.halaqahId) : null;
  const myGuruObj = myHalaqah ? gurus.find(g => g.id === myHalaqah.guruPembimbingId) : null;

  // Calculation for student's teacher attendance & schedule status today
  const teacherHalaqahStatus = React.useMemo(() => {
    if (!myGuruObj) return null;
    const now = new Date();
    const todayDateIso = now.toISOString().slice(0, 10);
    const localDateIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const daysMap = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayName = daysMap[now.getDay()];

    const myHalId = myHalaqah?.id || mySiswaObj?.halaqahId || '';
    const myHalName = myHalaqah?.namaHalaqah || mySiswaObj?.halaqahNama || '';
    const myHalKey = normalizeHalaqahKey(myHalName);

    // Schedule on this day for student's halaqah
    const scheduleForDay = (guruSchedules || []).find(
      s => s.status === StatusAktif.AKTIF &&
           (s.guruId === myGuruObj.id || (s.guruNama && s.guruNama.toLowerCase() === myGuruObj.namaLengkap.toLowerCase())) &&
           s.hari === todayDayName &&
           (!s.halaqahId && !s.halaqahNama
             ? true
             : ((myHalId && s.halaqahId === myHalId) ||
                (myHalKey && s.halaqahNama && normalizeHalaqahKey(s.halaqahNama) === myHalKey)))
    );

    // Setorans recorded by this teacher on todayDateIso (matching this halaqah when halaqahId is set)
    const setoransToday = (setorans || []).filter(set => {
      if (set.tanggalSetoran !== todayDateIso && set.tanggalSetoran !== localDateIso) return false;
      const matchGuru = (set.guruId && myGuruObj.id)
        ? set.guruId === myGuruObj.id
        : Boolean(set.guruNama && set.guruNama.toLowerCase() === myGuruObj.namaLengkap.toLowerCase());
      if (!matchGuru) return false;
      if (myHalId && set.halaqahId) return set.halaqahId === myHalId;
      return true;
    });

    const setoranCountToday = setoransToday.length;

    // Check admin override or auto-attendance record for today (strictly scoped by halaqah)
    const adminAttendanceRecord = findMatchingGuruAttendanceRecord(
      guruAttendance,
      [localDateIso, todayDateIso],
      {
        teacherId: myGuruObj.id,
        teacherName: myGuruObj.namaLengkap,
        halaqahId: myHalId,
        halaqahName: myHalName
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
  }, [myGuruObj, myHalaqah, mySiswaObj, guruSchedules, setorans, guruAttendance]);

  const studentActiveMeetings = virtualMeetings.filter(meet => meet.isActive && (meet.halaqahId === 'all' || meet.halaqahId === mySiswaObj?.halaqahId));

  // 2. SETORAN SISWA
  const mySetorans = setorans.filter(s => s.siswaId === siswaId).sort((a, b) => {
    if (a.tanggalSetoran !== b.tanggalSetoran) {
      return b.tanggalSetoran.localeCompare(a.tanggalSetoran);
    }
    const tsA = parseInt(a.id.replace('set-', '')) || 0;
    const tsB = parseInt(b.id.replace('set-', '')) || 0;
    return tsB - tsA;
  });
  const lastSetoran = mySetorans[0];
  const totalSetoran = mySetorans.length;
  
  // Selesai (Lulus)
  const passedSetorans = mySetorans.filter(s => s.statusLulus);
  const totalLulus = passedSetorans.length;

  // Unique surahs completed
  const completedSurahs = Array.from(new Set(
    passedSetorans.flatMap(s => {
      const list: string[] = [];
      if (s.suratNama) list.push(s.suratNama);
      if (s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0) {
        s.daftarSuratSetoran.forEach(sub => {
          if (sub.suratNama) list.push(sub.suratNama);
        });
      }
      return list;
    })
  ));

  // Unique Non-Quran modules completed
  const completedNonQuranModuls = Array.from(new Set(
    passedSetorans
      .filter(s => s.tipeModul === TipeModul.NON_AL_QURAN && s.modulNama)
      .map(s => s.modulNama)
  ));

  // 3. STATS ATTENDANCE BY FILTERING SHARED CONTEXT STATE
  const attendanceList = React.useMemo(() => {
    return (studentAttendance || []).filter((a: any) => a.siswaId === siswaId);
  }, [studentAttendance, siswaId]);

  // Murojaah Berpasangan - Siswa Side States
  const [stuMurDate, setStuMurDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [stuMurPasanganId, setStuMurPasanganId] = useState('');
  const [stuMurPasanganCustomNama, setStuMurPasanganCustomNama] = useState('');
  const [stuMurJenis, setStuMurJenis] = useState('Murojaah Hafalan');
  const [stuMurSuratAwal, setStuMurSuratAwal] = useState('');
  const [stuMurSuratAkhir, setStuMurSuratAkhir] = useState('');
  const [stuMurAyatAwal, setStuMurAyatAwal] = useState('');
  const [stuMurAyatAkhir, setStuMurAyatAkhir] = useState('');
  const [stuMurCatatan, setStuMurCatatan] = useState('');
  const [viewingSetoran, setViewingSetoran] = useState<Setoran | null>(null);
  
  // Search parameters
  const [stuMurSearch, setStuMurSearch] = useState('');
  const [stuMurDateFilter, setStuMurDateFilter] = useState('');

  const myTargets = studentTargets[siswaId] || {
    siswaId: siswaId,
    pekanan: "",
    bulanan: "",
    kuartal: "",
    semester: "",
    tahunan: "",
    pekananSelesai: false,
    bulananSelesai: false,
    kuartalSelesai: false,
    semesterSelesai: false,
    tahunanSelesai: false,
    pekananUmumSelesai: false,
    bulananUmumSelesai: false,
    kuartalUmumSelesai: false,
    semesterUmumSelesai: false,
    tahunanUmumSelesai: false,
  };

  // Helper inside SiswaWorkspace for calendar week comparison
  const isSameCalendarWeek = (d1: Date, d2: Date): boolean => {
    const getWeekNumber = (d: Date) => {
      const target = new Date(d.valueOf());
      const dayNr = (d.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
      }
      return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    };
    return d1.getFullYear() === d2.getFullYear() && getWeekNumber(d1) === getWeekNumber(d2);
  };

  // Automatic Target Progress Detection matching GuruWorkspace
  const today = new Date();
  const todayStr = today.toDateString();
  const siswaSetorans = setorans.filter(s => s.siswaId === siswaId);
  const harianDone = siswaSetorans.some(s => {
    const sDate = new Date(s.tanggalSetoran);
    return sDate.toDateString() === todayStr;
  });
  const setoranPekananDone = siswaSetorans.some(s => {
    const sDate = new Date(s.tanggalSetoran);
    return isSameCalendarWeek(sDate, today);
  });

  const isCustom = !!(myTargets && (myTargets.isCustom || (myTargets.config && Object.keys(myTargets.config).length > 0) || myTargets.pekanan || myTargets.bulanan || myTargets.kuartal || myTargets.semester || myTargets.tahunan));

  const targetMetrics: StudentProgressResult | null = React.useMemo(() => {
    if (!mySiswaObj) return null;
    return calculateStudentProgress(
      mySiswaObj,
      myHalaqah || undefined,
      studentTargets,
      generalTargets,
      setorans,
      moduls,
      elemenSettings
    );
  }, [mySiswaObj, myHalaqah, studentTargets, generalTargets, setorans, moduls, elemenSettings]);

  // 5-Tier Target texts
  const activePekananText = isCustom ? (myTargets.pekanan || '') : (generalTargets?.pekanan || '');
  const activeBulananText = isCustom ? (myTargets.bulanan || '') : (generalTargets?.bulanan || '');
  const activeKuartalText = isCustom ? (myTargets.kuartal || '') : (generalTargets?.kuartal || '');
  const activeSemesterText = isCustom ? (myTargets.semester || '') : (generalTargets?.semester || '');
  const activeTahunanText = isCustom ? (myTargets.tahunan || '') : (generalTargets?.tahunan || '');

  // 5-Tier Completion states
  const pekananDone = isCustom ? !!myTargets.pekananSelesai : !!myTargets.pekananUmumSelesai;
  const bulananDone = isCustom ? !!myTargets.bulananSelesai : !!myTargets.bulananUmumSelesai;
  const kuartalDone = isCustom ? !!myTargets.kuartalSelesai : !!myTargets.kuartalUmumSelesai;
  const semesterDone = isCustom ? !!myTargets.semesterSelesai : !!myTargets.semesterUmumSelesai;
  const tahunanDone = isCustom ? !!myTargets.tahunanSelesai : !!myTargets.tahunanUmumSelesai;

  // Active targets list (excluding empty targets)
  const targetTiers = [
    { id: 'pekanan', title: '1. Target Pekanan (Weekly)', color: 'indigo', text: activePekananText, done: pekananDone },
    { id: 'bulanan', title: '2. Target Bulanan (Monthly)', color: 'amber', text: activeBulananText, done: bulananDone },
    { id: 'kuartal', title: '3. Target Kuartal (Quarterly)', color: 'rose', text: activeKuartalText, done: kuartalDone },
    { id: 'semester', title: '4. Target Semester (Semester)', color: 'indigo', text: activeSemesterText, done: semesterDone },
    { id: 'tahunan', title: '5. Target Tahunan (Annual)', color: 'amber', text: activeTahunanText, done: tahunanDone }
  ];

  const activeTiersCount = targetTiers.filter(t => t.text.trim() !== '').length;
  const completedActiveCount = targetTiers.filter(t => t.text.trim() !== '' && t.done).length;

  const overallTargetPercentage = activeTiersCount > 0 
    ? Math.round((completedActiveCount / activeTiersCount) * 100)
    : 0;

  const shouldShowTarget = (myHalaqah?.targetConfigEnabled === true) || (isCustom && myTargets?.showTarget !== false);

  // Helper to translate date to Indonesian Day Name
  const getIndonesianDayName = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Harian';
      const dayIndex = date.getDay();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[dayIndex] || 'Harian';
    } catch (e) {
      return 'Harian';
    }
  };

  useEffect(() => {
    // Left empty since attendance is calculated reactively from Context
  }, [siswaId, subTab]);

  const hadirCount = attendanceList.filter(a => a.status === 'Hadir').length;
  const izinCount = attendanceList.filter(a => a.status === 'Izin').length;
  const sakitCount = attendanceList.filter(a => a.status === 'Sakit').length;
  const alphaCount = attendanceList.filter(a => a.status === 'Alpha').length;
  const totalAttendanceDays = attendanceList.length;
  const attendancePercentage = totalAttendanceDays > 0 
    ? Math.round((hadirCount / totalAttendanceDays) * 100) 
    : 100; // default state

  // Average Grade
  const calculateAverageGrade = () => {
    if (passedSetorans.length === 0) return 'Belum Ada';
    const grades = passedSetorans.map(s => s.nilai);
    const topScor = grades.filter(g => g.includes('Mumtaz') || g.includes('A'));
    if (topScor.length / grades.length >= 0.6) return 'Mumtaz';
    return 'Jayyid Jiddan';
  };

  // HALAQAH RANK (Simulated rank inside Halaqah based on total "Lulus" setups compared to peers)
  const getHalaqahRank = () => {
    if (!mySiswaObj || !mySiswaObj.halaqahId) return 1;
    const halaqahPeers = siswas.filter(s => s.halaqahId === mySiswaObj.halaqahId);
    
    const peersProgress = halaqahPeers.map(peer => {
      const peerPassed = setorans.filter(st => st.siswaId === peer.id && st.statusLulus).length;
      return { id: peer.id, count: peerPassed };
    });

    peersProgress.sort((a, b) => b.count - a.count);
    const myPos = peersProgress.findIndex(p => p.id === siswaId);
    return myPos >= 0 ? myPos + 1 : 1;
  };

  const halaqahRank = getHalaqahRank();

  // ----------------------------------------------------
  // PROFILE EDIT STATES
  // ----------------------------------------------------
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMedia || isIOSStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
  }, []);


  // ----------------------------------------------------
  // HISTORY FILTERS & INTERACTIVE VIEWS
  // ----------------------------------------------------
  const [riwayatViewLayout, setRiwayatViewLayout] = useState<'tabel' | 'grid'>('tabel');
  const [historyMonth, setHistoryMonth] = useState('All');
  const [historyModul, setHistoryModul] = useState('All');
  const [historyElemen, setHistoryElemen] = useState('All');
  const [selectedSetoranForModal, setSelectedSetoranForModal] = useState<Setoran | null>(null);
  const [studentPreviewPage, setStudentPreviewPage] = useState<number | null>(null);

  const handleCorrectionClick = (s: Setoran) => {
    setSelectedSetoranForModal(s);
    setStudentPreviewPage(s.nonQuranPageAwal || s.halaman || 1);
  };

  const filteredHistory = mySetorans.filter(item => {
    if (historyMonth !== 'All') {
      const monthPart = item.tanggalSetoran.split('-')[1]; // YYYY-MM-DD -> MM
      if (monthPart !== historyMonth) return false;
    }
    if (historyModul !== 'All' && item.modulId !== historyModul) {
      return false;
    }
    if (historyElemen !== 'All' && item.jenisSetoran !== historyElemen) {
      return false;
    }
    return true;
  });

  // ----------------------------------------------------
  // TARGET & CAPAIAN ESTIMATOR RULES
  // ----------------------------------------------------
  // Target Hafalan
  const targetSurahsList = ['Ad-Dhuha', 'Al-Inshirah', 'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Al-Zalzalah', 'Al-Adiyat', 'Al-Qari\'ah', 'At-Takathur', 'Al-Asr', 'Al-Humazah', 'Al-Fil', 'Quraysh', 'Al-Ma\'un', 'Al-Kautsar', 'Al-Kafirun', 'An-Nasr', 'Al-Lahab', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'].reverse();
  const surahProgressArray = targetSurahsList.map(name => {
    const isSelesai = completedSurahs.includes(name);
    // find setoran if any
    const latestSetForSurah = mySetorans.find(st => st.suratNama === name);
    const isSedangDipelajari = !isSelesai && !!latestSetForSurah;
    return {
      nama: name,
      status: isSelesai ? 'selesai' : (isSedangDipelajari ? 'sedang' : 'belum'),
      lastGrade: latestSetForSurah?.nilai || ''
    };
  });

  const totalFinishedSurahs = surahProgressArray.filter(s => s.status === 'selesai').length;
  const totalSedangSurahs = surahProgressArray.filter(s => s.status === 'sedang').length;
  const totalBelumSurahs = surahProgressArray.filter(s => s.status === 'belum').length;

  const totalQuranTargetPercentage = Math.round((totalFinishedSurahs / targetSurahsList.length) * 100);

  // Estimasi Penyelesaian Target:
  // if average setoran is e.g. 1 per week, and they have N remaining, calculate weeks remaining.
  const calculateEstimation = () => {
    const remaining = totalBelumSurahs + totalSedangSurahs;
    if (remaining === 0) return 'Seluruh target hafalan telah tercapai!';
    const monthlyRate = Math.max(1, Math.round(totalFinishedSurahs / 2)) || 2; // simulated rate based on completed
    const monthsNeeded = Math.ceil(remaining / monthlyRate);
    return `Estimasi ${monthsNeeded} bulan lagi (asumsi rata-rata ${monthlyRate} setoran tuntas per bulan)`;
  };

  // ----------------------------------------------------
  // INTERACTIVE MODULE VIEWER FOR STUDENTS
  // ----------------------------------------------------
  // List of IDs of modules that the student has chosen to learn.
  // Persisted in localStorage so it stays active.
  const [selectedToLearnIds, setSelectedToLearnIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`mh_siswa_selected_moduls_${siswaId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    // Default: if none chosen, initially assign ALL available modules in the system
    return moduls.map(m => m.id);
  });

  // Keep state synchronized on account switches
  useEffect(() => {
    if (typeof window !== 'undefined' && siswaId) {
      const saved = localStorage.getItem(`mh_siswa_selected_moduls_${siswaId}`);
      if (saved) {
        try {
          setSelectedToLearnIds(JSON.parse(saved));
          return;
        } catch (e) {
          console.error(e);
        }
      }
      setSelectedToLearnIds(moduls.map(m => m.id));
    }
  }, [siswaId, moduls]);

  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>('');
  
  // Custom mobile view toggle to view layout similar to chat
  const [showMobileReader, setShowMobileReader] = useState<boolean>(false);

  // States for interactive toolbar & searches
  const [quranSearchInput, setQuranSearchInput] = useState<string>('');

  const [selectedModulId, setSelectedModulId] = useState<string>('');
  const [readingJilidIndex, setReadingJilidIndex] = useState(0);
  const [readingPage, setReadingPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(100);

  // States for Quran personalization (translation toggle, background theme, accent/bracket color)
  const [showQuranTranslation, setShowQuranTranslation] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mh_siswa_show_quran_translation');
      return saved !== 'false'; // default true
    }
    return true;
  });

  const [quranBgTheme, setQuranBgTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mh_siswa_quran_bg_theme') || 'cream'; // default cream
    }
    return 'cream';
  });

  const [quranAccentColor, setQuranAccentColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mh_siswa_quran_accent_color') || 'emerald'; // default emerald
    }
    return 'emerald';
  });

  const [quranTextColor, setQuranTextColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mh_siswa_quran_text_color') || 'black'; // default black
    }
    return 'black';
  });

  // Sync personalization to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mh_siswa_show_quran_translation', String(showQuranTranslation));
      localStorage.setItem('mh_siswa_quran_bg_theme', quranBgTheme);
      localStorage.setItem('mh_siswa_quran_accent_color', quranAccentColor);
      localStorage.setItem('mh_siswa_quran_text_color', quranTextColor);
    }
  }, [showQuranTranslation, quranBgTheme, quranAccentColor, quranTextColor]);
  
  // Load first selected module as default
  useEffect(() => {
    if (moduls.length > 0) {
      // Find modules currently selected to learn
      const currentSelectedSet = moduls.filter(m => selectedToLearnIds.includes(m.id));
      if (currentSelectedSet.length > 0) {
        if (!selectedModulId || !selectedToLearnIds.includes(selectedModulId)) {
          setSelectedModulId(currentSelectedSet[0].id);
        }
      } else {
        // If nothing matches and selectedModulId is not valid, reset
        if (!selectedToLearnIds.includes(selectedModulId)) {
          setSelectedModulId('');
        }
      }
    }
  }, [moduls, selectedToLearnIds]);

  const currentModulObj = moduls.find(m => m.id === selectedModulId);

  const activeBgThemeObj = QURAN_BG_THEMES.find(t => t.id === quranBgTheme) || QURAN_BG_THEMES[0];
  const activeAccentColorObj = QURAN_ACCENT_COLORS.find(a => a.id === quranAccentColor) || QURAN_ACCENT_COLORS[0];
  const activeTextColorObj = QURAN_TEXT_COLORS.find(c => c.id === quranTextColor) || QURAN_TEXT_COLORS[0];
  const activeTextColor = quranBgTheme === 'night' ? activeTextColorObj.hexDark : activeTextColorObj.hexLight;

  // Load bookmarks dynamically from AppContext
  const bookmarks = React.useMemo(() => {
    const map: Record<string, { page: number, jilid: number }> = {};
    studentBookmarks.forEach((b: any) => {
      if (b.siswaId === siswaId && b.modulId) {
        map[b.modulId] = { page: b.page, jilid: b.jilid };
      }
    });
    return map;
  }, [studentBookmarks, siswaId]);

  const saveBookmark = () => {
    if (!selectedModulId) return;
    const otherBookmarks = studentBookmarks.filter((b: any) => !(b.siswaId === siswaId && b.modulId === selectedModulId));
    const newBookmarkObj = {
      siswaId,
      modulId: selectedModulId,
      page: readingPage,
      jilid: readingJilidIndex
    };
    const updated = [...otherBookmarks, newBookmarkObj];
    saveStudentBookmarks(updated);
    alert(`Halaman ${readingPage} berhasil disimpan sebagai Penanda terakhir!`);
  };

  const handleLoadBookmark = () => {
    const savedMark = bookmarks[selectedModulId];
    if (savedMark) {
      setReadingPage(savedMark.page);
      setReadingJilidIndex(savedMark.jilid);
      alert(`Berhasil lompat ke Halaman ${savedMark.page} (Penanda disimpan sebelumnya)`);
    } else {
      alert('Belum ada Penanda halaman untuk modul ini.');
    }
  };

  // Reset page when module changes
  useEffect(() => {
    if (currentModulObj) {
      setReadingPage(1);
      setReadingJilidIndex(0);
      
      // Auto-load bookmark if any
      const savedMark = bookmarks[selectedModulId];
      if (savedMark) {
        setReadingPage(savedMark.page);
        setReadingJilidIndex(savedMark.jilid);
      }
    }
  }, [selectedModulId]);

  // Navigations
  const handleNextPage = (maxPages: number) => {
    setReadingPage(prev => Math.min(maxPages, prev + 1));
  };

  const handlePrevPage = () => {
    setReadingPage(prev => Math.max(1, prev - 1));
  };

  // Handle toggling learn module inside selection modal / dropdown list
  const handleToggleLearnId = (id: string) => {
    setSelectedToLearnIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSaveSelectedToLearn = () => {
    localStorage.setItem(`mh_siswa_selected_moduls_${siswaId}`, JSON.stringify(selectedToLearnIds));
    setShowAssignModal(false);
    alert('Rencana materi belajar Anda berhasil diperbarui!');
  };

  // Compile real-time search results for Quran/Moduls in reader toolbar based on name or digits
  const quranSearchResults = React.useMemo(() => {
    const query = quranSearchInput.trim().toLowerCase();
    if (!query) return [];

    const results: Array<{ modulId: string; namaSurat: string; noSurat: number; ayatNum?: number }> = [];
    const num = parseInt(query, 10);

    // List only modules that are in Quran category and assigned
    const assignedAndQuran = moduls.filter(m => m.tipe === TipeModul.AL_QURAN && selectedToLearnIds.includes(m.id));

    assignedAndQuran.forEach(m => {
      const matchName = m.namaSurat?.toLowerCase().includes(query);
      const matchNum = m.nomorUrutSurat === num;

      if (matchName || matchNum) {
        results.push({
          modulId: m.id,
          namaSurat: m.namaSurat || '',
          noSurat: m.nomorUrutSurat || 0
        });
      }
    });

    // If current modul is Quran, check if user is searching a verse number
    if (currentModulObj && currentModulObj.tipe === TipeModul.AL_QURAN && !isNaN(num) && num > 0 && num <= (currentModulObj.jumlahAyat || 100)) {
      results.push({
        modulId: currentModulObj.id,
        namaSurat: currentModulObj.namaSurat || '',
        noSurat: currentModulObj.nomorUrutSurat || 0,
        ayatNum: num
      });
    }

    return results;
  }, [quranSearchInput, moduls, selectedToLearnIds, currentModulObj]);

  // ----------------------------------------------------
  // SIMULATED SYSTEM NOTIFICATIONS
  // ----------------------------------------------------
  const [notifs, setNotifs] = useState(() => {
    const initialNotifs = [
      {
        id: 'n1',
        title: '🎯 Target Baru Ditugaskan',
        message: 'Ustadz pembina menetapkan target Surah Al-Qari\'ah harus selesai pada pekan ini.',
        sender: myGuruObj?.namaLengkap || 'Ustadz Pembina',
        date: '2026-05-28',
        unread: true
      },
      {
        id: 'n2',
        title: '💬 Catatan Bimbingan Santri',
        message: `Catatan baru dari bimbingan ${lastSetoran?.modulNama || 'Al-Quran'}: "${lastSetoran?.catatanGuru || 'Bagus, terus tingkatkan kelancaran.'}"`,
        sender: myGuruObj?.namaLengkap || 'Ustadz Pembina',
        date: '2026-05-27',
        unread: false
      },
      {
        id: 'n3',
        title: '📢 Pengumuman Halaqah',
        message: 'Akan ada ujian Tasmi\' Akbar juz 30 di penghujung bulan Juni. Harap persiapkan hafalan santri.',
        sender: 'Sistem Admin',
        date: '2026-05-25',
        unread: false
      }
    ];
    return initialNotifs;
  });

  const unreadCount = notifs.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // ----------------------------------------------------
  // LAPORAN CETAK / PRINT ENGINE
  // ----------------------------------------------------
  const handlePrint = () => {
    const originalTitle = document.title;
    const sanitizedName = (myUser?.namaLengkap || 'Santri').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    document.title = `Laporan_Perkembangan_Santri_${sanitizedName}`;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Google Drive Integration States
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);
  const [driveSaveItem, setDriveSaveItem] = useState<{
    blob: Blob;
    mimeType: string;
    extension: string;
    defaultName: string;
  } | null>(null);
  const [driveFolders, setDriveFolders] = useState<Array<{ id: string; name: string; parents?: string[] }>>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([{ id: 'root', name: 'Drive Saya' }]);
  const [isFetchingFolders, setIsFetchingFolders] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [driveAuthPrompt, setDriveAuthPrompt] = useState<{ fileName: string; type: 'PDF' | 'Excel' } | null>(null);

  const fetchDriveFolders = async (parentId: string = 'root') => {
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsFetchingFolders(true);
    try {
      const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=100&orderBy=name`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Gagal mengambil list folder dari Google Drive');
      }
      const data = await response.json();
      setDriveFolders(data.files || []);
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengambil daftar folder: ' + err.message);
    } finally {
      setIsFetchingFolders(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Nama folder tidak boleh kosong!');
      return;
    }
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsCreatingFolder(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId]
        })
      });
      if (!response.ok) {
        throw new Error('Gagal membuat folder baru');
      }
      const newName = newFolderName.trim();
      setNewFolderName('');
      alert(`Folder "${newName}" berhasil dibuat!`);
      await fetchDriveFolders(currentFolderId);
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat folder: ' + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleNavigateFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    const newPath = [...folderPath, { id: folderId, name: folderName }];
    setFolderPath(newPath);
    fetchDriveFolders(folderId);
  };

  const handleStepBackFolder = (folderId: string, index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(folderId);
    fetchDriveFolders(folderId);
  };

  const executeUploadToDrive = async () => {
    if (!driveSaveItem) return;
    const token = getGoogleAccessToken();
    if (!token) {
      alert('Token akses tidak ditemukan. Silakan hubungkan kembali.');
      return;
    }

    setUploadingToDrive(driveSaveItem.defaultName);
    try {
      const finalName = customFileName.trim() 
        ? (customFileName.endsWith(`.${driveSaveItem.extension}`) ? customFileName : `${customFileName}.${driveSaveItem.extension}`)
        : `${driveSaveItem.defaultName}_${new Date().toISOString().slice(0, 10)}.${driveSaveItem.extension}`;

      const parents = currentFolderId && currentFolderId !== 'root' ? [currentFolderId] : undefined;

      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: finalName,
          mimeType: driveSaveItem.mimeType,
          description: `Disimpan dari Portal HalaqahMonitor oleh Santri`,
          ...(parents && { parents })
        })
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Gagal membuat metadata file di Google Drive');
      }

      const fileData = await createRes.json();
      const fileId = fileData.id;

      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': driveSaveItem.mimeType
        },
        body: driveSaveItem.blob
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Gagal mengunggah konten file ke Google Drive');
      }

      const folderName = folderPath[folderPath.length - 1].name;
      alert(`Berhasil menyimpan file "${finalName}" di folder "${folderName}" Google Drive pribadi Anda!`);
      setDriveSaveItem(null);
    } catch (err: any) {
      console.error(err);
      alert('Kesalahan saat menyimpan ke Google Drive: ' + err.message);
    } finally {
      setUploadingToDrive(null);
    }
  };

  const exportLocalLaporan = (fileName: string) => {
    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal');
      
      doc.setFontSize(16);
      doc.setTextColor(5, 150, 105);
      doc.setFont('Helvetica', 'bold');
      doc.text('LAPORAN AKADEMIK BIMBINGAN', 14, 20);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('Helvetica', 'normal');
      doc.text(`PESERTA HALAQAH ${(myHalaqah?.namaHalaqah || '[NAMA HALAQAH]').toUpperCase()}`, 14, 25);
      
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(1);
      doc.line(14, 28, 196, 28);
      
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 34, 182, 32, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(14, 34, 182, 32, 'D');
      
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.setFont('Helvetica', 'bold');
      doc.text('DETAIL PERKEMBANGAN SANTRI', 18, 40);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Nama Lengkap: ${mySiswaObj?.namaLengkap || '-'}`, 18, 46);
      doc.text(`Nomor Induk Santri (NIS): ${mySiswaObj?.nis || '-'}`, 18, 52);
      doc.text(`Kelas: ${mySiswaObj?.kelasNama || '-'}`, 18, 58);
      
      doc.text(`Kelompok Halaqah: ${myHalaqah?.namaHalaqah || '-'}`, 110, 46);
      doc.text(`Ustadz Pembina: ${myHalaqah?.guruPembimbingNama || '-'}`, 110, 52);
      doc.text(`Rerata Kehadiran: ${attendancePercentage || '0'}%`, 110, 58);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('1. REKAPITULASI CAPAIAN SETORAN', 14, 76);
      
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 82, 182, 8, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('Tanggal', 16, 87);
      doc.text('Materi / Surat', 40, 87);
      doc.text('Elemen', 90, 87);
      doc.text('Evaluasi Guru', 115, 87);
      doc.text('Nilai', 170, 87);
      doc.text('Status', 184, 87);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      let y = 96;
      mySetorans.forEach((s) => {
        doc.text(s.tanggalSetoran || '-', 16, y);
        
        const matName = `${s.modulNama || ''} ${s.suratNama ? `(${s.suratNama})` : ''}`;
        doc.text(matName.length > 28 ? matName.substring(0, 26) + '..' : matName, 40, y);
        
        doc.text(s.jenisSetoran || '-', 90, y);
        
        const cat = s.catatanGuru || '-';
        doc.text(cat.length > 30 ? cat.substring(0, 28) + '..' : cat, 115, y);
        
        doc.text(s.nilai || '-', 170, y);
        doc.text(s.statusLulus ? 'LULUS' : 'REMEDI', 184, y);
        
        y += 8;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      
      doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
      alert('Laporan berhasil diunduh secara lokal!');
    } catch (localErr: any) {
      alert('Gagal mengunduh file secara lokal: ' + localErr.message);
    }
  };

  const handleConnectDriveAndSave = async (fileName: string, type: 'PDF' | 'Excel') => {
    try {
      const token = await signInWithGoogleWorkspace(UserRole.SISWA);
      if (token) {
        setDriveAuthPrompt(null);
        setTimeout(() => {
          saveToGoogleDrive(fileName, type);
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghubungkan Google Drive: ' + err.message);
    }
  };

  const saveToGoogleDrive = async (fileName: string, type: 'PDF' | 'Excel') => {
    let token = getGoogleAccessToken();
    if (!token) {
      setDriveAuthPrompt({ fileName, type });
      return;
    }
    
    setUploadingToDrive(fileName);
    try {
      let fileBlob: Blob;
      let mimeType = 'application/pdf';
      let extension = 'pdf';
      
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal');
      
      doc.setFontSize(16);
      doc.setTextColor(5, 150, 105);
      doc.setFont('Helvetica', 'bold');
      doc.text('LAPORAN AKADEMIK BIMBINGAN', 14, 20);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('Helvetica', 'normal');
      doc.text(`PESERTA HALAQAH ${(myHalaqah?.namaHalaqah || '[NAMA HALAQAH]').toUpperCase()}`, 14, 25);
      
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(1);
      doc.line(14, 28, 196, 28);
      
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 34, 182, 32, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(14, 34, 182, 32, 'D');
      
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.setFont('Helvetica', 'bold');
      doc.text('DETAIL PERKEMBANGAN SANTRI', 18, 40);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Nama Lengkap: ${mySiswaObj?.namaLengkap || '-'}`, 18, 46);
      doc.text(`Nomor Induk Santri (NIS): ${mySiswaObj?.nis || '-'}`, 18, 52);
      doc.text(`Kelas: ${mySiswaObj?.kelasNama || '-'}`, 18, 58);
      
      doc.text(`Kelompok Halaqah: ${myHalaqah?.namaHalaqah || '-'}`, 110, 46);
      doc.text(`Ustadz Pembina: ${myHalaqah?.guruPembimbingNama || '-'}`, 110, 52);
      doc.text(`Rerata Kehadiran: ${attendancePercentage || '0'}%`, 110, 58);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('1. REKAPITULASI CAPAIAN SETORAN', 14, 76);
      
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 82, 182, 8, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('Tanggal', 16, 87);
      doc.text('Materi / Surat', 40, 87);
      doc.text('Elemen', 90, 87);
      doc.text('Evaluasi Guru', 115, 87);
      doc.text('Nilai', 170, 87);
      doc.text('Status', 184, 87);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      let y = 96;
      mySetorans.forEach((s, index) => {
        doc.text(s.tanggalSetoran || '-', 16, y);
        
        const matName = `${s.modulNama || ''} ${s.suratNama ? `(${s.suratNama})` : ''}`;
        doc.text(matName.length > 28 ? matName.substring(0, 26) + '..' : matName, 40, y);
        
        doc.text(s.jenisSetoran || '-', 90, y);
        
        const cat = s.catatanGuru || '-';
        doc.text(cat.length > 30 ? cat.substring(0, 28) + '..' : cat, 115, y);
        
        doc.text(s.nilai || '-', 170, y);
        doc.text(s.statusLulus ? 'LULUS' : 'REMEDI', 184, y);
        
        y += 8;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });

      fileBlob = doc.output('blob');

      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      setCustomFileName(`${fileName}_${new Date().toISOString().slice(0, 10)}`);
      setDriveSaveItem({
        blob: fileBlob,
        mimeType: mimeType,
        extension: extension,
        defaultName: fileName
      });

      setIsFetchingFolders(true);
      const q = `'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=100&orderBy=name`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDriveFolders(data.files || []);
      } else {
        console.error('Failed to pre-fetch root folders');
      }
      setIsFetchingFolders(false);
    } catch (err: any) {
      console.error(err);
      alert('Kesalahan saat menyiapkan file: ' + err.message);
    } finally {
      setUploadingToDrive(null);
    }
  };

  if (!myUser) return null;

  return (
    <div className="space-y-6">
      


      {/* ----------------------------------------------------
          TAB: DASHBOARD SISWA (MODULARIZED: SiswaDashboard.tsx)
          ---------------------------------------------------- */}
      {subTab === 'dashboard' && (
        <SiswaDashboard
          siswaId={siswaId}
          setActiveTab={setActiveTab}
          onViewSetoran={setViewingSetoran}
          mySiswaObj={mySiswaObj}
          myHalaqah={myHalaqah}
          myGuruObj={myGuruObj}
          mySetorans={mySetorans}
          attendanceList={attendanceList}
          attendancePercentage={attendancePercentage}
          hadirCount={hadirCount}
          izinCount={izinCount}
          sakitCount={sakitCount}
          alphaCount={alphaCount}
          totalAttendanceDays={totalAttendanceDays}
          halaqahRank={halaqahRank}
          completedSurahs={completedSurahs}
          completedNonQuranModuls={completedNonQuranModuls}
          teacherHalaqahStatus={teacherHalaqahStatus}
        />
      )}

      {/* ----------------------------------------------------
          TAB: PROFIL SISWA (MODULARIZED: SiswaProfile.tsx)
          ---------------------------------------------------- */}
      {subTab === 'profile' && (
        <SiswaProfile siswaId={siswaId} setActiveTab={setActiveTab} />
      )}

      {/* ----------------------------------------------------
          TAB: MUTABAAH SISWA (RIWAYAT, LAPORAN, MUROJAAH BERPASANGAN)
          ---------------------------------------------------- */}
      {(subTab === 'siswa_mutabaah' || subTab === 'siswa_riwayat' || subTab === 'siswa_reports' || subTab === 'siswa_murojaah_berpasangan' || subTab === 'murojaah_berpasangan') && (
        <SiswaMutabaah
          subTab={subTab}
          setActiveTab={setActiveTab}
          siswaId={siswaId}
          mySiswaObj={mySiswaObj || undefined}
          myHalaqah={myHalaqah || undefined}
          myGuruObj={myGuruObj || undefined}
          mySetorans={mySetorans}
          attendanceList={attendanceList}
          attendancePercentage={attendancePercentage}
          hadirCount={hadirCount}
          izinCount={izinCount}
          sakitCount={sakitCount}
          alphaCount={alphaCount}
        />
      )}

      {/* --------------------------------- */}
      {subTab === 'siswa_target' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Alur Target Capaian Santri</h2>
              <p className="text-xs text-slate-405">Peninjauan target pembelajaran umum & target khusus pribadi yang ditentukan Guru Pembimbing</p>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-4 py-2 rounded-xl flex items-center space-x-2 shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-emerald-350">
                Ustadz Pembimbing: <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">{myGuruObj?.namaLengkap || 'Ustadz Pembimbing'}</strong>
              </span>
            </div>
          </div>

          {/* Synchronized Official Target Progress Banner */}
          {targetMetrics && ((myHalaqah?.targetConfigEnabled && myTargets?.showTarget !== false) || (isCustom && myTargets?.showTarget !== false)) && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-teal-950 p-6 rounded-3xl border border-emerald-500/30 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-left flex-1 z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    {targetMetrics.isCustom ? '🎯 CAPAIAN TARGET MANDIRI' : '📢 CAPAIAN TARGET HALAQAH'}
                  </span>
                  <span className="text-xs text-emerald-200/90 font-bold bg-white/10 px-2 py-0.5 rounded-lg font-mono">
                    Elemen: {targetMetrics.elementName}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white">
                  {targetMetrics.targetRangeText}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {targetMetrics.targetPeriodText}
                </p>
                {targetMetrics.latestCapaianText && targetMetrics.latestCapaianText !== 'Belum ada capaian tercatat' && (
                  <p className="text-xs text-emerald-300 pt-1 font-medium">
                    Capaian Terakhir Disetorkan: <strong className="text-white underline">{targetMetrics.latestCapaianText}</strong>
                  </p>
                )}
              </div>

              {/* Circular Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0 z-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="text-white/10"
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
                    strokeDashoffset={2 * Math.PI * 46 * (1 - targetMetrics.percent / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono text-white tracking-tighter leading-none">
                    {targetMetrics.percent}<span className="text-xs text-emerald-400 font-bold">%</span>
                  </span>
                  <span className="text-[8px] text-slate-300 mt-1 font-bold font-mono tracking-wider uppercase">
                    PROGRES
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Target Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Completion Percentage card */}
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Progres Semua Target</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-baseline space-x-1.5">
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{overallTargetPercentage}%</h3>
                  <span className="text-[10px] text-slate-405">Tuntas</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${overallTargetPercentage}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">
                  Mencakup keseluruhan target umum & target khusus pribadi
                </p>
              </div>
            </div>

            {/* Target Umum Statuscard */}
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Target Umum Halaqah</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-xl">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {!isCustom ? completedActiveCount : 0} / {activeTiersCount}
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {isCustom ? (
                    <span className="italic block mt-1 text-slate-400">Sedang mengikuti program target khusus mandiri.</span>
                  ) : (
                    <span><strong className="text-indigo-600 dark:text-indigo-400">{completedActiveCount} dari {activeTiersCount} target umum</strong> aktif terdeteksi tuntas.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Target Khusus Statuscard */}
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-405 uppercase tracking-widest block">Target Khusus Mandiri</span>
                <div className="p-2 bg-sky-50 dark:bg-sky-950/20 text-sky-600 rounded-xl">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {isCustom ? `${completedActiveCount} / ${activeTiersCount}` : 'Tidak Ada'}
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {isCustom ? (
                    <span>Telah tuntas <strong className="text-sky-600 dark:text-sky-400 font-extrabold">{completedActiveCount} dari {activeTiersCount} target khusus personal</strong> yang ditentukan ustadz pembimbing.</span>
                  ) : (
                    <span className="italic block mt-1 text-slate-400">Mengikuti target umum halaqah. Belum ada target khusus personal yang diset.</span>
                  )}
                </p>
              </div>
            </div>

          </div>

          {/* Comprehensive 5-Tier Targets timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 block pb-1 border-b border-slate-100 dark:border-slate-900">
              DAFTAR CHECKLIST CAPAIAN BERJENJANG (TIERED TARGETS)
            </h3>

            <div className="space-y-6">
              {targetTiers.map((tier, idx) => {
                const borderAccent = tier.color === 'indigo' ? 'border-l-indigo-500' :
                                    tier.color === 'amber' ? 'border-l-amber-500' :
                                    tier.color === 'rose' ? 'border-l-rose-500' : 'border-l-indigo-500';

                const generalDoneForTier = !!(myTargets && (myTargets as any)[`${tier.id}UmumSelesai`]);
                const customDoneForTier = !!(myTargets && (myTargets as any)[`${tier.id}Selesai`]);
                const generalTextForTier = generalTargets ? (generalTargets as any)[tier.id] : '';
                const customTextForTier = myTargets ? (myTargets as any)[tier.id] : '';

                return (
                  <div key={idx} className={`bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 border-l-4 ${borderAccent} p-5 rounded-2xl shadow-xs transition duration-250 hover:shadow-sm`}>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900/50">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <strong className="text-xs py-0.5 px-2.5 rounded-full bg-slate-50 dark:bg-slate-900 border text-slate-500 font-mono">Tier {idx + 1}</strong>
                        {tier.title}
                      </span>
                      <div className="flex gap-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          Progres: {tier.done ? '1 / 1 Selesai' : '0 / 1 Selesai'}
                        </span>
                      </div>
                    </div>

                    {/* Target Cards Split */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Target Umum */}
                      <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-900 rounded-xl space-y-2 flex flex-col justify-between text-left">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">📢 Target Umum Halaqah</span>
                            {isCustom ? (
                              <span className="p-0.5 px-2 bg-slate-100 text-slate-400 dark:bg-slate-900/50 text-[8px] font-black uppercase rounded-md tracking-wider">
                                IKUT KUSTOM
                              </span>
                            ) : generalDoneForTier ? (
                              <span className="p-0.5 px-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[8px] font-black uppercase rounded-md tracking-wider">
                                LULUS
                              </span>
                            ) : (
                              <span className="p-0.5 px-2 bg-slate-100 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400 text-[8px] font-black uppercase rounded-md tracking-wider">
                                BELUM SELESAI
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 italic pl-2 border-l-2 border-slate-200 dark:border-slate-800">
                            "{generalTextForTier || 'Belum ada target umum ditetapkan'}"
                          </p>
                        </div>
                        <div className="pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100/50 dark:border-slate-900 mt-2">
                          <span>Status Evaluasi:</span>
                          <span className={`font-semibold ${isCustom ? 'text-slate-400' : generalDoneForTier ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isCustom ? 'Mengikuti Target Mandiri' : generalDoneForTier ? '✓ Terpenuhi (Lulus)' : '⏳ Sedang Berprogres'}
                          </span>
                        </div>
                      </div>

                      {/* Target Khusus (Mandiri) */}
                      <div className="p-3.5 bg-indigo-50/20 dark:bg-slate-900/10 border border-slate-100/50 dark:border-slate-900 rounded-xl space-y-2 flex flex-col justify-between text-left">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-mono">🎯 Target Khusus Mandiri</span>
                            {!isCustom ? (
                              <span className="p-0.5 px-2 bg-slate-100 text-slate-400 dark:bg-slate-900/50 text-[8px] font-black uppercase rounded-md tracking-wider">
                                IKUT UMUM
                              </span>
                            ) : customTextForTier ? (
                              customDoneForTier ? (
                                <span className="p-0.5 px-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[8px] font-black uppercase rounded-md tracking-wider">
                                  LULUS
                                </span>
                              ) : (
                                <span className="p-0.5 px-2 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 text-[8px] font-black uppercase rounded-md tracking-wider">
                                  BELUM SELESAI
                                </span>
                              )
                            ) : (
                              <span className="p-0.5 px-2 bg-slate-100 text-slate-400 dark:bg-slate-900/50 text-[8px] font-semibold uppercase rounded-md tracking-wider border-dashed border">
                                TIDAK ADA
                              </span>
                            )}
                          </div>

                          {!isCustom ? (
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2.5 italic">
                              🍃 Mengikuti target umum halaqah. Belum ada target khusus personal yang diset.
                            </p>
                          ) : customTextForTier ? (
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 italic pl-2 border-l-2 border-indigo-200 dark:border-indigo-900/40">
                              "{customTextForTier}"
                            </p>
                          ) : (
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2.5 italic">
                              🍃 Belum ada tugas target mandiri tambahan dari guru untuk tingkat ini.
                            </p>
                          )}
                        </div>
                        <div className="pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100/50 dark:border-slate-900 mt-2">
                          <span>Status Capaian:</span>
                          {!isCustom ? (
                            <span className="text-slate-400 font-semibold">Mengikuti Target Umum</span>
                          ) : customTextForTier ? (
                            <span className={`font-semibold ${customDoneForTier ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {customDoneForTier ? '✓ Terpenuhi (Lulus)' : '⏳ Sedang Berprogres'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold">-</span>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}



      {/* ----------------------------------------------------
          TAB: MODUL PEMBELAJARAN
          ---------------------------------------------------- */}
      {subTab === 'siswa_modul' && (() => {
        // Compute learning modules
        const myAssignedModuls = moduls.filter(m => selectedToLearnIds.includes(m.id));
        const mySortedAssignedModuls = [...myAssignedModuls].sort((a, b) => {
          if (a.tipe === TipeModul.AL_QURAN && b.tipe === TipeModul.AL_QURAN) {
            return (a.nomorUrutSurat || 0) - (b.nomorUrutSurat || 0);
          }
          if (a.tipe !== b.tipe) {
            return a.tipe === TipeModul.AL_QURAN ? -1 : 1;
          }
          const titleA = a.judulModul || a.namaSurat || '';
          const titleB = b.judulModul || b.namaSurat || '';
          return titleA.localeCompare(titleB);
        });

        const myAssignedModulsFiltered = mySortedAssignedModuls.filter(m => {
          const title = (m.judulModul || m.namaSurat || '').toLowerCase();
          const query = sidebarSearchQuery.toLowerCase();
          return title.includes(query);
        });

        const sortedAllModuls = [...moduls].sort((a, b) => {
          if (a.tipe === TipeModul.AL_QURAN && b.tipe === TipeModul.AL_QURAN) {
            return (a.nomorUrutSurat || 1) - (b.nomorUrutSurat || 1);
          }
          if (a.tipe !== b.tipe) {
            return a.tipe === TipeModul.AL_QURAN ? -1 : 1;
          }
          const titleA = a.judulModul || a.namaSurat || '';
          const titleB = b.judulModul || b.namaSurat || '';
          return titleA.localeCompare(titleB);
        });

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
              
              {/* Sidebar Modules navigation list */}
              <div id="siswa_modul_sidebar" className={`bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm space-y-4 lg:col-span-1 ${showMobileReader ? 'hidden lg:block' : 'block'}`}>
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Modul Ditugaskan</h3>
                  <button
                    onClick={() => {
                      setModalSearchQuery('');
                      setShowAssignModal(true);
                    }}
                    className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-250 dark:hover:bg-emerald-900/40 p-1 px-2 py-1 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Pilih</span>
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari modul..."
                    value={sidebarSearchQuery}
                    onChange={(e) => setSidebarSearchQuery(e.target.value)}
                    className="w-full pl-8 p-1.5 border rounded-lg text-[11px] bg-slate-50 dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-55"
                  />
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {myAssignedModulsFiltered.map(m => {
                    const isActive = m.id === selectedModulId;
                    const hasBookmark = !!bookmarks[m.id];
                    return (
                      <button 
                        key={m.id} 
                        onClick={() => {
                          setSelectedModulId(m.id);
                          setShowMobileReader(true);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs flex justify-between items-center transition cursor-pointer ${
                          isActive 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-850 dark:text-emerald-400 font-bold' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 text-slate-650 dark:text-slate-350 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex gap-2.5 items-start min-w-0 flex-1">
                          {m.tipe !== TipeModul.AL_QURAN && (m.coverModul || (m.coverModulPerJilid && m.coverModulPerJilid[0])) && (
                            <div className="w-9 h-12 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 shadow-xs mt-0.5">
                              <img 
                                src={m.coverModul || (m.coverModulPerJilid && m.coverModulPerJilid[0])} 
                                alt="Cover Mini" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          <div className="truncate pr-2">
                            <p className="truncate font-semibold">{m.namaSurat ? `Surat ${m.namaSurat}` : m.judulModul}</p>
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                              {m.tipe === TipeModul.AL_QURAN ? `Surat ke-${m.nomorUrutSurat}` : m.kategoriModul}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {hasBookmark && <span title="Ada Penanda"><Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /></span>}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                  {myAssignedModulsFiltered.length === 0 && (
                    <div className="text-center py-10 px-4 text-slate-400 dark:text-slate-500 text-xs italic">
                      {selectedToLearnIds.length === 0 ? (
                        <div className="space-y-3">
                          <p>Belum ada modul ditugaskan yang dipilih.</p>
                          <button
                            onClick={() => setShowAssignModal(true)}
                            className="p-1.5 px-3 bg-emerald-650 text-white rounded-lg text-[10px] font-bold not-italic hover:bg-emerald-700 cursor-pointer transition-all"
                          >
                            Pilih Modul Pembelajaran
                          </button>
                        </div>
                      ) : (
                        'Modul tidak ditemukan.'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Interactive reader workspace */}
              <div id="siswa_modul_reader" className={`lg:col-span-3 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm flex flex-col justify-between min-h-[480px] ${showMobileReader ? 'block' : 'hidden lg:flex'}`}>
                {currentModulObj ? (
                  <div className="flex-1 flex flex-col justify-between">
                    
                    {/* Top toolbar Controls */}
                    <div className="flex flex-col gap-3.5 border-b dark:border-slate-800 pb-3.5 mb-5 select-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {/* Back to Modules list button for mobile */}
                          <button 
                            onClick={() => setShowMobileReader(false)}
                            className="lg:hidden mr-3 p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-center transition-all"
                            title="Kembali ke Daftar Modul"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                              {currentModulObj.namaSurat ? `Surat ${currentModulObj.namaSurat}` : currentModulObj.judulModul}
                            </h4>
                            <p className="text-xs text-slate-400">Kategori: {currentModulObj.tipe} {currentModulObj.kategoriModul ? `• ${currentModulObj.kategoriModul}` : ''}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button 
                            onClick={() => setZoomScale(prev => Math.max(70, prev - 10))} 
                            className="p-1 border hover:bg-slate-50 dark:hover:bg-slate-900 dark:border-slate-850 rounded cursor-pointer" 
                            title="Perkecil"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">{zoomScale}%</span>
                          <button 
                            onClick={() => setZoomScale(prev => Math.min(150, prev + 10))} 
                            className="p-1 border hover:bg-slate-50 dark:hover:bg-slate-900 dark:border-slate-850 rounded cursor-pointer" 
                            title="Perbesar"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={saveBookmark}
                            className="p-1 px-2.5 bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded cursor-pointer flex items-center space-x-1 hover:bg-amber-100 dark:hover:bg-amber-950" 
                            title="Tandai Last Read"
                          >
                            <Bookmark className="w-3 h-3 text-amber-600" />
                            <span className="text-[9px] font-bold hidden sm:inline">Penanda</span>
                          </button>
                          {bookmarks[selectedModulId] && (
                            <button 
                              onClick={handleLoadBookmark}
                              className="p-1 px-2.5 text-[9px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-900 rounded font-bold hover:bg-sky-100"
                            >
                              Lompat Penanda
                            </button>
                          )}
                        </div>
                      </div>

                      {/* SPECIAL QURAN DROP DOWN SELECTORS & SEARCH */}
                      {currentModulObj.tipe === TipeModul.AL_QURAN && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-slate-50/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 mt-1">
                          
                          {/* Dropdown 1: Surat / Surah Select */}
                          <div className="flex flex-col">
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Pilih Surat</label>
                            <select
                              value={selectedModulId}
                              onChange={(e) => {
                                setSelectedModulId(e.target.value);
                              }}
                              className="w-full text-xs font-semibold p-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              {moduls
                                .filter(m => m.tipe === TipeModul.AL_QURAN && selectedToLearnIds.includes(m.id))
                                .sort((a, b) => (a.nomorUrutSurat || 0) - (b.nomorUrutSurat || 0))
                                .map(m => (
                                  <option key={m.id} value={m.id}>
                                    No. {m.nomorUrutSurat}. {m.namaSurat} ({m.jumlahAyat || 0} Ayat)
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Dropdown/Input 2: Live Autocomplete search by Name or Digits */}
                          <div className="flex flex-col relative">
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Cari Surat atau Ayat</label>
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Cari nama / nomor (misal: Al-Ikhlas, 112 atau 3)"
                                value={quranSearchInput}
                                onChange={(e) => setQuranSearchInput(e.target.value)}
                                className="w-full pl-7 p-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>

                            {/* Recommendations floating box */}
                            {quranSearchInput.trim() !== "" && quranSearchResults.length > 0 && (
                              <div className="absolute z-50 left-0 right-0 top-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto w-full">
                                {quranSearchResults.map((res, rIdx) => (
                                  <button
                                    key={rIdx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedModulId(res.modulId);
                                      if (res.ayatNum) {
                                        setReadingPage(res.ayatNum);
                                      }
                                      setQuranSearchInput(''); // clear
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-[11px] flex justify-between items-center border-b last:border-0 border-slate-100 dark:border-slate-800/40 cursor-pointer"
                                  >
                                    <div>
                                      <span className="font-bold text-slate-800 dark:text-slate-100">Surat {res.namaSurat}</span>
                                      {res.ayatNum && <span className="text-emerald-600 dark:text-emerald-450 font-extrabold ml-1.5">Ayat {res.ayatNum}</span>}
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400">Surat Ke-{res.noSurat}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* PERSONALIZATION RIBBON (TEMA LATAR, AKSEN & TERJEMAHAN) */}
                          <div className="col-span-1 md:col-span-3 mt-3.5 pt-3.5 border-t border-slate-150 dark:border-slate-800/80 flex flex-col md:flex-row md:flex-wrap items-start md:items-center justify-between gap-y-3.5 gap-x-5 w-full">
                            
                            {/* 1. Toggle Terjemahan */}
                            <div className="flex items-center space-x-2 select-none">
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={showQuranTranslation} 
                                  onChange={(e) => setShowQuranTranslation(e.target.checked)}
                                  className="sr-only peer" 
                                />
                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-emerald-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                <span className="ml-2 text-[11px] font-bold text-slate-600 dark:text-slate-350">Tampilkan Terjemahan</span>
                              </label>
                            </div>

                            {/* 2. Tema Latar (Background) */}
                            <div className="flex flex-wrap items-center gap-2 select-none">
                              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">Latar Belakang:</span>
                              <div className="flex flex-wrap items-center gap-1">
                                {QURAN_BG_THEMES.map((theme) => {
                                  const isSelected = quranBgTheme === theme.id;
                                  return (
                                    <button
                                      key={theme.id}
                                      type="button"
                                      onClick={() => setQuranBgTheme(theme.id)}
                                      className={`p-1 px-2 rounded-lg text-[10px] font-bold border transition-all duration-205 cursor-pointer ${
                                        isSelected 
                                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 scale-[1.02] shadow-xs' 
                                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50'
                                      }`}
                                      title={theme.desc}
                                    >
                                      {theme.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 3. Warna Kurung / Aksen */}
                            <div className="flex items-center gap-2 select-none">
                              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">Aksen Kurung:</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {QURAN_ACCENT_COLORS.map((color) => {
                                  const isSelected = quranAccentColor === color.id;
                                  return (
                                    <button
                                      key={color.id}
                                      type="button"
                                      onClick={() => setQuranAccentColor(color.id)}
                                      className="w-5 h-5 rounded-full border border-white dark:border-slate-950 transition-all cursor-pointer relative flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm"
                                      style={{ 
                                        backgroundColor: color.hex, 
                                        boxShadow: isSelected ? `0 0 0 2px ${color.hex}` : 'none'
                                      }}
                                      title={`Aksen Kurung ${color.label}`}
                                    >
                                      {isSelected && (
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 4. Warna Teks Ayat (Black Default) */}
                            <div className="flex items-center gap-2 select-none">
                              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">Warna Teks:</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {QURAN_TEXT_COLORS.map((color) => {
                                  const isSelected = quranTextColor === color.id;
                                  const renderHex = quranBgTheme === 'night' ? color.hexDark : color.hexLight;
                                  return (
                                    <button
                                      key={color.id}
                                      type="button"
                                      onClick={() => setQuranTextColor(color.id)}
                                      className="w-5 h-5 rounded-full border border-white dark:border-slate-950 transition-all cursor-pointer relative flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm"
                                      style={{ 
                                        backgroundColor: renderHex, 
                                        boxShadow: isSelected ? `0 0 0 2px ${renderHex}` : 'none'
                                      }}
                                      title={`Warna Teks ${color.label}`}
                                    >
                                      {isSelected && (
                                        <div className="w-1.5 h-1.5 bg-white dark:bg-slate-950 rounded-full"></div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                          </div>

                        </div>
                      )}
                    </div>

                    {/* Core reading body content wrapper */}
                    <div className={`flex-1 my-4 flex items-center justify-center p-4 rounded-xl overflow-auto select-none border transition-all duration-300 ${
                      currentModulObj.tipe === TipeModul.AL_QURAN 
                        ? `${activeBgThemeObj.bgClass} ${activeBgThemeObj.borderClass}` 
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                    }`}>
                      <div style={{ transform: `scale(${zoomScale / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }} className="w-full">
                        
                        {/* QURAN RENDER STYLING */}
                        {currentModulObj.tipe === TipeModul.AL_QURAN ? (
                          <div className="w-full space-y-4">
                            <div 
                              className="text-right p-6 md:p-8 rounded-2xl font-serif max-h-[600px] overflow-y-auto select-text shadow-inner transition-colors duration-300 w-full border border-slate-200/40 dark:border-slate-800/60" 
                              dir="rtl" 
                              style={{ 
                                backgroundColor: quranBgTheme === 'night' ? '#0b1329' : quranBgTheme === 'warm' ? '#fdfcf7' : '#ffffff' 
                              }}
                            >
                              {/* Juz badge for the module */}
                              {(() => {
                                const juzs = Array.from(new Set(currentModulObj.isiAyat?.map(a => a.juz || getQuranDefaultJuz(Number(currentModulObj.nomorUrutSurat), a.nomorAyat)) || [])).sort((a: any, b: any) => (a > b ? 1 : -1));
                                if (juzs.length > 0) {
                                  return (
                                    <div className="text-center mb-6 select-none animate-fade-in font-sans">
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#c5a880]/10 dark:bg-amber-600/10 text-[#a38054] dark:text-amber-400 border border-[#c5a880]/20 dark:border-amber-600/20">
                                        📖 Al-Quran Juz {juzs.join(', ')}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {currentModulObj.nomorUrutSurat !== 1 && currentModulObj.nomorUrutSurat !== 9 && (
                                <p 
                                  className="font-mushaf font-serif text-3.5xl font-normal leading-normal mb-8 transition-colors duration-300 text-center animate-fade-in"
                                  style={{ color: activeTextColor }}
                                  dir="rtl"
                                  lang="ar"
                                >
                                  {formatArabicFontClean('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')}
                                </p>
                              )}
                              
                              <div className="text-justify leading-[2.2] whitespace-normal break-words w-full" style={{ textAlignLast: 'center' }}>
                                {currentModulObj.isiAyat?.map((ayat, ayIdx) => {
                                  const isActiveAyat = readingPage === ayat.nomorAyat;
                                  const cleanedText = formatArabicFontClean(ayat.teksArab);

                                  return (
                                    <span key={ayIdx} className="inline">
                                      <span 
                                        onClick={() => setReadingPage(ayat.nomorAyat)}
                                        style={{ 
                                          fontSize: `${(zoomScale / 100) * 1.8}rem`,
                                          color: activeTextColor 
                                        }}
                                        className="font-mushaf font-serif inline cursor-pointer hover:bg-emerald-500/5 dark:hover:bg-slate-850/30 transition-all duration-150 rounded px-1 py-0.5 select-text align-middle"
                                      >
                                        {cleanedText}
                                      </span>
                                      
                                      {/* Centered Verse Circle flowing inline, replicating original King Fahd Mushaf layout like the admin workspace */}
                                      <span 
                                        onClick={() => setReadingPage(ayat.nomorAyat)}
                                        className="inline-flex items-center justify-center select-none font-mushaf font-serif mx-1.5 rounded-full border border-[#c5a880] dark:border-amber-600/80 bg-[#fdfcf7] dark:bg-slate-900 text-slate-800 dark:text-emerald-450 font-bold w-9 h-9 align-middle text-center shrink-0 shadow-xs relative cursor-pointer"
                                        style={{ 
                                          fontSize: `${(zoomScale / 100) * 1.05}rem`,
                                          lineHeight: '1',
                                          transform: 'translateY(-1px)'
                                        }}
                                        title={`Nomor Ayat ${ayat.nomorAyat}`}
                                      >
                                        <span className="absolute inset-[1px] rounded-full border border-dashed border-[#c5a880]/40 dark:border-amber-600/30" />
                                        <span className="relative z-10">{toEasternArabicDigits(ayat.nomorAyat)}</span>
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Elegant Translation Section below the Mushaf box */}
                            {showQuranTranslation && (
                              <div className="mt-4 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs rounded-xl p-4 md:p-6 text-left space-y-4">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#c5a880] mb-2 font-sans flex items-center gap-1.5">
                                  <span>🇮🇩 Terjemahan Bahasa Indonesia</span>
                                  {readingPage && (
                                    <span className="text-slate-400 font-medium normal-case">- Ayat {readingPage} terpilih</span>
                                  )}
                                </h4>
                                
                                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                                  {currentModulObj.isiAyat?.map((ayat, ayIdx) => {
                                    const isActiveAyat = readingPage === ayat.nomorAyat;
                                    return (
                                      <div 
                                        key={ayIdx}
                                        onClick={() => setReadingPage(ayat.nomorAyat)}
                                        className={`p-3 rounded-lg border transition-all duration-300 text-left cursor-pointer ${
                                          isActiveAyat 
                                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs' 
                                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/30'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span 
                                            className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full"
                                            style={{ 
                                              backgroundColor: activeAccentColorObj.hex + '1a', 
                                              color: activeAccentColorObj.hex 
                                            }}
                                          >
                                            Ayat {ayat.nomorAyat}
                                          </span>
                                          <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-805 text-slate-500 dark:text-slate-400">
                                            Juz {ayat.juz || getQuranDefaultJuz(Number(currentModulObj.nomorUrutSurat), ayat.nomorAyat)}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 font-serif italic leading-relaxed">
                                          "{ayat.terjemahan || 'Terjemahan tidak tersedia untuk ayat ini.'}"
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          
                          /* NON AL-QURAN BOOKLET RENDER */
                          <div className="text-center py-6 min-h-[220px] flex flex-col justify-between">
                            {/* Jilid options if multi jilid */}
                            {currentModulObj.isMultiJilid && (
                              <div className="flex justify-center space-x-2 mb-4">
                                {Array.from({ length: currentModulObj.jumlahJilid || 1 }).map((_, jIdx) => (
                                  <button
                                    key={jIdx}
                                    onClick={() => { setReadingJilidIndex(jIdx); setReadingPage(1); }}
                                    className={`p-1 px-3 text-[10px] uppercase font-bold tracking-wider rounded border cursor-pointer ${
                                      readingJilidIndex === jIdx 
                                        ? 'bg-emerald-600 text-white border-emerald-650' 
                                        : 'bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-250'
                                    }`}
                                  >
                                    Jilid {jIdx + 1}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Display page image if any / Text booklet view */}
                            {(() => {
                              const isTextMode = currentModulObj.tipeMateri === 'teks';
                              const pageText = isTextMode 
                                ? (currentModulObj.teksHalamanPerJilid?.[readingJilidIndex]?.[readingPage - 1] || currentModulObj.teksHalaman?.[readingPage - 1])
                                : null;
                              
                              const activeExplanation = currentModulObj.penjelasanHalamanPerJilid?.[readingJilidIndex]?.[readingPage - 1] || currentModulObj.penjelasanHalaman?.[readingPage - 1];

                              const imageSrc = !isTextMode 
                                ? (currentModulObj.halamanGambarPerJilid?.[readingJilidIndex]?.[readingPage - 1] || currentModulObj.halamanGambar?.[readingPage - 1])
                                : null;

                              const isGoogleEmbed = currentModulObj.tipeMateri === 'google_doc_slide';

                              if (isGoogleEmbed) {
                                return (
                                  <div className="space-y-4 w-full max-w-2xl mx-auto animate-fade-in text-left">
                                    <div className="flex flex-col gap-4">
                                      {currentModulObj.googleDocUrl && (
                                        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                                          <div className="bg-indigo-50/40 p-2 text-xs font-bold text-indigo-850 uppercase border-b border-indigo-100 flex justify-between items-center">
                                            <span>📝 Google Docs (Catatan Teks)</span>
                                            <a href={currentModulObj.googleDocUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline">Edit ↗</a>
                                          </div>
                                          <iframe 
                                            src={getEmbedUrl(currentModulObj.googleDocUrl, 'doc')} 
                                            className="w-full h-80 border-0" 
                                            title="Siswa Doc View" 
                                            allow="autoplay"
                                          />
                                        </div>
                                      )}
                                      {currentModulObj.googleSlideUrl && (
                                        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                                          <div className="bg-indigo-50/40 p-2 text-xs font-bold text-indigo-850 uppercase border-b border-indigo-100 flex justify-between items-center">
                                            <span>📊 Google Slides (Presentasi)</span>
                                            <a href={currentModulObj.googleSlideUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline">Edit ↗</a>
                                          </div>
                                          <iframe 
                                            src={getEmbedUrl(currentModulObj.googleSlideUrl, 'slide')} 
                                            className="w-full h-80 border-0" 
                                            title="Siswa Slides View" 
                                            allow="autoplay"
                                          />
                                        </div>
                                      )}
                                      {!currentModulObj.googleDocUrl && !currentModulObj.googleSlideUrl && (
                                        <div className="text-center py-12 text-xs text-slate-400">Tautan materi belum dikonfigurasikan oleh Guru / Admin.</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              const activeCover = currentModulObj.isMultiJilid 
                                ? (currentModulObj.coverModulPerJilid?.[readingJilidIndex] || currentModulObj.coverModul)
                                : (currentModulObj.coverModul || currentModulObj.coverModulPerJilid?.[0]);

                              return (
                                <div className="space-y-4 w-full max-w-xl mx-auto animate-fade-in">
                                  {activeCover && (
                                    <div className="flex justify-center mb-2">
                                      <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-xs opacity-25 group-hover:opacity-45 transition duration-1000 group-hover:duration-200"></div>
                                        <div className="relative w-36 h-48 rounded-2xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-slate-800 transition transform hover:scale-105 duration-300">
                                          <img 
                                            src={activeCover} 
                                            alt="Cover Modul" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs p-1.5 text-center text-[9px] text-white font-semibold uppercase tracking-wider">
                                            Sampul {currentModulObj.isMultiJilid ? `Jilid ${readingJilidIndex + 1}` : ''}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {imageSrc ? (
                                    <img 
                                      src={imageSrc} 
                                      alt={`Halaman ${readingPage}`} 
                                      className="max-h-[310px] mx-auto rounded-lg shadow border border-slate-200 dark:border-slate-800 animate-fade-in"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="p-6 text-slate-805 dark:text-slate-100 select-text leading-relaxed font-sans w-full bg-white dark:bg-slate-950 rounded-xl border border-dashed text-sm border-slate-250 dark:border-slate-850 animate-fade-in">
                                      <div className="space-y-3 text-left">
                                        <p className="font-extrabold pb-2 border-b border-dashed border-slate-205 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-sans">
                                          NASKAH MATERI HALAMAN {readingPage}
                                        </p>
                                        <div className="text-sm text-slate-800 dark:text-slate-150 leading-relaxed select-text font-sans page-html-output text-left">
                                          {pageText && pageText.includes('<') && pageText.includes('>') ? (
                                            <div dangerouslySetInnerHTML={{ __html: pageText }} />
                                          ) : (
                                            <div className="whitespace-pre-wrap">{pageText || currentModulObj.isiModulManual || '(Tidak ada naskah materi)'}</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Explanation/Uraian per page if available */}
                                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/45 rounded-xl border border-slate-150 dark:border-slate-850 text-left space-y-1">
                                    <span className="text-[9px] font-bold text-slate-404 uppercase tracking-wider block font-mono">
                                      Uraian / Penjelasan Singkat Halaman {readingPage}
                                    </span>
                                    <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-wrap font-sans font-medium">
                                      {activeExplanation || currentModulObj.isiModulManual || 'Tidak ada uraian penjelasan khusus untuk halaman ini.'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                        )}

                      </div>
                    </div>

                    {/* Page index footer sliders / nav controls */}
                    <div className="flex items-center justify-between border-t dark:border-slate-800 pt-3 mt-4 select-none">
                      {currentModulObj.tipe === TipeModul.AL_QURAN ? (
                        <div className="flex items-center justify-between w-full">
                          <button 
                            onClick={() => handlePrevPage()} 
                            disabled={readingPage <= 1} 
                            className="p-1 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[11px] font-bold tracking-wider uppercase rounded flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Ayat Prev</span>
                          </button>
                          <span className="text-xs font-mono font-bold text-slate-500">Ayat Active: {readingPage} / {currentModulObj.jumlahAyat || 10}</span>
                          <button 
                            onClick={() => handleNextPage(currentModulObj.jumlahAyat || 10)} 
                            disabled={readingPage >= (currentModulObj.jumlahAyat || 10)} 
                            className="p-1 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[11px] font-bold tracking-wider uppercase rounded flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                          >
                            <span>Ayat Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <button 
                            onClick={() => handlePrevPage()} 
                            disabled={readingPage <= 1} 
                            className="p-1 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[11px] font-bold tracking-wider uppercase rounded flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Materi Sebelum</span>
                          </button>
                          
                          {/* Pages counters specs */}
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            Halaman {readingPage} dari {
                              currentModulObj.isMultiJilid 
                                ? (currentModulObj.halamanPerJilid?.[readingJilidIndex] || 10) 
                                : (currentModulObj.halamanGambar?.length || 10)
                            }
                          </span>

                          <button 
                            onClick={() => handleNextPage(
                              currentModulObj.isMultiJilid 
                                ? (currentModulObj.halamanPerJilid?.[readingJilidIndex] || 10) 
                                : (currentModulObj.halamanGambar?.length || 10)
                            )} 
                            disabled={readingPage >= (currentModulObj.isMultiJilid ? (currentModulObj.halamanPerJilid?.[readingJilidIndex] || 10) : (currentModulObj.halamanGambar?.length || 10))} 
                            className="p-1 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[11px] font-bold tracking-wider uppercase rounded flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                          >
                            <span>Materi Lanjut</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center py-16 text-center text-slate-400 dark:text-slate-550">
                    <BookOpen className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-750 animate-pulse" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Belum ada modul pelajaran dipilih.</p>
                    <p className="text-xs text-slate-400 mt-1 pl-4 pr-4">Silakan klik tombol "Pilih" di panel samping kiri untuk menentukan subjek materi pembelajaran Anda!</p>
                  </div>
                )}
              </div>

            </div>

            {/* HIGH FIDELITY ASSIGN SELECTION MODAL */}
            {showAssignModal && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
                  <div className="p-5 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between bg-emerald-50/20">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
                        <BookOpen className="text-emerald-600 dark:text-emerald-450 w-5 h-5" />
                        <span>Pilih Modul</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pilih materi yang ingin Anda pelajari dan tampilkan di daftar "Modul Ditugaskan" Anda.</p>
                    </div>
                    <button 
                      onClick={() => setShowAssignModal(false)}
                      className="p-1 px-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Search inside Modal */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex flex-wrap gap-3 items-center justify-between bg-slate-50/30">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari berdasarkan nama surat, judul, kategori..."
                        value={modalSearchQuery}
                        onChange={(e) => setModalSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedToLearnIds(moduls.map(m => m.id));
                        }}
                        className="p-1 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedToLearnIds([]);
                        }}
                        className="p-1 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  {/* Scrollable list of All Modules */}
                  <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/40 dark:bg-slate-950/25">
                    {/* Map all categories: Al Quran vs Non Al Quran */}
                    {['Al-Quran', 'Materi Selain Al-Quran (Tajwid, Adab, Hadits, dsb.)'].map(groupLabel => {
                      const isQuranGroup = groupLabel.startsWith('Al-Quran');
                      
                      if (isQuranGroup) {
                        const quranModuls = sortedAllModuls.filter(m => m.tipe === TipeModul.AL_QURAN);
                        const quranIds = quranModuls.map(m => m.id);
                        const isQuranChecked = quranIds.some(id => selectedToLearnIds.includes(id));
                        
                        const query = modalSearchQuery.toLowerCase();
                        if (query && !'al-qur\'an'.includes(query) && !'alquran'.includes(query) && !'quran'.includes(query)) {
                          return null;
                        }

                        return (
                          <div key={groupLabel} className="space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 font-mono block pl-1">
                              {groupLabel}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isQuranChecked) {
                                    setSelectedToLearnIds(prev => prev.filter(id => !quranIds.includes(id)));
                                  } else {
                                    setSelectedToLearnIds(prev => [...prev.filter(id => !quranIds.includes(id)), ...quranIds]);
                                  }
                                }}
                                className={`p-4 rounded-xl border text-left flex items-center justify-between text-xs transition cursor-pointer select-none active:scale-98 col-span-1 sm:col-span-2 ${
                                  isQuranChecked
                                    ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 dark:bg-emerald-950/15 dark:text-emerald-400 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-705 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3.5 truncate">
                                  <input
                                    type="checkbox"
                                    checked={isQuranChecked}
                                    onChange={() => {}} // Click handled by button callback
                                    className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-800 rounded focus:ring-emerald-500 cursor-pointer pointer-events-none flex-shrink-0"
                                  />
                                  <div className="truncate pr-1">
                                    <p className="font-bold text-sm truncate">Al-Qur'an</p>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-550 font-normal block mt-1">
                                      Mata Pelajaran Utama Tahfidz & Tilawah • Terdiri dari {quranIds.length} Surat (Juz 1 - Juz 30)
                                    </span>
                                  </div>
                                </div>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const filteredListForGroup = sortedAllModuls.filter(m => {
                        const isQ = m.tipe === TipeModul.AL_QURAN;
                        if (isQ !== isQuranGroup) return false;

                        const title = (m.namaSurat || m.judulModul || '').toLowerCase();
                        const cat = (m.kategoriModul || '').toLowerCase();
                        const query = modalSearchQuery.toLowerCase();
                        return title.includes(query) || cat.includes(query);
                      });

                      if (filteredListForGroup.length === 0) return null;

                      return (
                        <div key={groupLabel} className="space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 font-mono block pl-1">
                            {groupLabel}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {filteredListForGroup.map(m => {
                              const isChecked = selectedToLearnIds.includes(m.id);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleToggleLearnId(m.id)}
                                  className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition cursor-pointer select-none active:scale-98 ${
                                    isChecked
                                      ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 dark:bg-emerald-950/15 dark:text-emerald-400 font-semibold'
                                      : 'bg-white border-slate-200 text-slate-705 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3 truncate">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // click event handle is on parent button
                                      className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-800 rounded focus:ring-emerald-500 cursor-pointer pointer-events-none flex-shrink-0"
                                    />
                                    <div className="truncate pr-1">
                                      <p className="font-bold truncate">{m.namaSurat ? `Surat ${m.namaSurat}` : m.judulModul}</p>
                                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal block mt-0.5">
                                        {m.tipe === TipeModul.AL_QURAN 
                                          ? `Surat Urut ${m.nomorUrutSurat} • ${m.jumlahAyat || 0} Ayat` 
                                          : `Kategori: ${m.kategoriModul || 'Rujukan'}`
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-slate-150 dark:border-slate-850 flex justify-end space-x-2 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="p-2 px-4 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition active:scale-95 cursor-pointer bg-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSelectedToLearn}
                      className="p-2 px-5 bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      Simpan Rencana Belajar ({selectedToLearnIds.length})
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* ----------------------------------------------------
          TAB: PENCAPAIAN DAN PRESTASI (ACHIEVEMENTS)
          ---------------------------------------------------- */}
      {subTab === 'siswa_achievements' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pencapaian & Medali Penghargaan</h2>
              <p className="text-xs text-slate-400">Prestasi santri bimbingan yang telah diselesaikan berdasarkan progress bimbingan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Achievement Badge index */}
            {[
              {
                title: '⭐ Hafiz Perdana',
                desc: 'Tuntas menyelesaikan minimal 1 Surat di Juz 30',
                unlocked: completedSurahs.length >= 1,
                icon: Trophy,
                color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
              },
              {
                title: '🔥 Pemburu Konsisten',
                desc: 'Tuntas menyetor minimal 3 kali ujian bimbingan',
                unlocked: totalSetoran >= 3,
                icon: Sparkles,
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20'
              },
              {
                title: '🏆 Mumtaz Master',
                desc: 'Memperoleh kelulusan bernilai "Mumtaz" di sekurangnya 2 setoran surat',
                unlocked: passedSetorans.filter(s => s.nilai.includes('Mumtaz') || s.nilai.includes('A')).length >= 2,
                icon: Award,
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
              },
              {
                title: '📘 Adab Master',
                desc: 'Membuka, mempelajari & menandai lebih dari 1 Modul Pembelajaran',
                unlocked: Object.keys(bookmarks).length >= 1,
                icon: BookMarked,
                color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20'
              }
            ].map((badge, bIdx) => {
              const IconComp = badge.icon;
              return (
                <div 
                  key={bIdx} 
                  className={`p-5 rounded-2xl border text-center space-y-3 shadow-sm transition ${
                    badge.unlocked 
                      ? 'bg-white dark:bg-slate-950 border-slate-150' 
                      : 'bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 opacity-60'
                  }`}
                >
                  <div className={`p-3 rounded-2xl inline-block ${badge.color}`}>
                    <IconComp className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-805 dark:text-white text-sm">{badge.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{badge.desc}</p>
                  </div>
                  <div className="pt-2">
                    {badge.unlocked ? (
                      <span className="p-1 px-3 text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full tracking-wider uppercase font-mono">
                        Unlocked
                      </span>
                    ) : (
                      <span className="p-1 px-3 text-[9px] font-bold bg-slate-205 text-slate-450 dark:bg-slate-800 rounded-full tracking-wider uppercase font-mono">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

          </div>

          {/* Level description */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm leading-relaxed text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b mb-3">Tingkat Kemajuan Belajar</h4>
            <p className="text-slate-500">
              Setiap santri dikelompokkan ke dalam level kemajuan: <strong className="text-emerald-700">Mubtadi\' (Pemula)</strong>, <strong className="text-indigo-600">Mutawassith (Menengah)</strong>, atau <strong className="text-amber-550">Mutaqaddim (Mahir)</strong>. Berdasarkan total <strong>{completedSurahs.length}</strong> surat yang telah lulus, Tingkatan Anda adalah:
            </p>
            <div className="mt-3 inline-block">
              <span className="p-1.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold font-mono text-[11px] tracking-wider uppercase shadow">
                {completedSurahs.length >= 8 ? 'MUTAWASSITH (MENENGAH)' : 'MUBTADI\' (PEMULA)'}
              </span>
            </div>
          </div>

        </div>
      )}






      {/* ====================================================
          MODAL HUBUNGKAN GOOGLE DRIVE (BEST EXPERIENCE)
          ==================================================== */}
      {driveAuthPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 text-left my-8">
            <button 
              type="button" 
              onClick={() => setDriveAuthPrompt(null)} 
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Koneksi Google Drive</h4>
                <p className="text-[9px] text-slate-400 font-mono">PILIHAN PENYIMPANAN LAPORAN</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                Akun Google Workspace Anda belum terhubung di sesi ini. Silakan hubungkan akun Google Anda untuk menyimpan file rekap ke folder Google Drive secara otomatis, atau langsung unduh file ke perangkat lokal Anda.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-900 text-[11px] text-slate-500 font-mono">
                <span className="font-bold block text-slate-600 dark:text-slate-400 mb-0.5">Nama File:</span>
                <span className="truncate block text-emerald-600 dark:text-emerald-400">{driveAuthPrompt.fileName}.{driveAuthPrompt.type === 'Excel' ? 'xlsx' : 'pdf'}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleConnectDriveAndSave(driveAuthPrompt.fileName, driveAuthPrompt.type)}
                className="flex items-center justify-center gap-2.5 w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition duration-150 cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-emerald-100" />
                Hubungkan Google &amp; Simpan ke Drive
              </button>

              <button
                type="button"
                onClick={() => {
                  exportLocalLaporan(driveAuthPrompt.fileName);
                  setDriveAuthPrompt(null);
                }}
                className="flex items-center justify-center gap-2.5 w-full p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/80 transition duration-150 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-450" />
                Unduh File ke Perangkat Lokal
              </button>

              <button
                type="button"
                onClick={() => setDriveAuthPrompt(null)}
                className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-widest pt-2 cursor-pointer transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL PILIH FOLDER & SIMPAN KE GOOGLE DRIVE
          ==================================================== */}
      {driveSaveItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 my-8 flex flex-col max-h-[85vh] text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
                  <Cloud className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Simpan ke Google Drive</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Tentukan folder &amp; letak dokumen disimpan</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setDriveSaveItem(null)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Nama File Input */}
            <div className="mt-4 mb-3 space-y-1.5 shrink-0">
              <label className="text-[10px] font-bold text-slate-400 block">Nama Dokumen</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Ketik nama file baru..."
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                <span className="text-slate-400 text-xs font-mono">.{driveSaveItem.extension}</span>
              </div>
            </div>

            {/* Breadcrumb Path */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl text-[11px] flex items-center flex-wrap gap-1 border border-slate-100 dark:border-slate-900 mb-3 shrink-0">
              <span className="text-slate-400 font-bold">Lokasi:</span>
              {folderPath.map((folder, index) => (
                <span className="flex items-center gap-1" key={folder.id + '-' + index}>
                  {index > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
                  <button
                    type="button"
                    onClick={() => handleStepBackFolder(folder.id, index)}
                    className={`hover:underline font-extrabold cursor-pointer transition ${
                      index === folderPath.length - 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>

            {/* Buat Folder Baru Widget */}
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900/50 p-3 rounded-xl mb-3 shrink-0 space-y-2">
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-slate-400" /> Buat Folder Baru Di Sini
              </span>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Nama folder baru..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 text-xs p-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder}
                  className="p-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold tracking-wider text-[10px] uppercase rounded-lg cursor-pointer transition shadow-xs flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  {isCreatingFolder ? 'Membuat...' : 'Buat Folder'}
                </button>
              </div>
            </div>

            {/* Folder List Scrollbox */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[180px] max-h-[260px] py-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/20 dark:bg-slate-950/20 text-left">
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 px-1 text-left">
                Folder Tersedia (Klik Untuk Masuk)
              </span>

              {isFetchingFolders ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                  <span className="text-[10px] italic font-mono">Mengambil daftar folder Google Drive...</span>
                </div>
              ) : driveFolders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic text-xs px-2 flex flex-col items-center justify-center gap-2">
                  <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-750 stroke-1" />
                  <span>Tidak ada sub-folder di tingkat ini.</span>
                </div>
              ) : (
                driveFolders.map((fd) => (
                  <button
                    key={fd.id}
                    type="button"
                    onClick={() => handleNavigateFolder(fd.id, fd.name)}
                    className="w-full text-left p-2.5 hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xs border border-transparent hover:border-slate-100 dark:hover:border-slate-850 rounded-xl transition flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="p-1.5 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-650 dark:text-emerald-450 rounded-lg">
                        <Folder className="w-4 h-4 fill-emerald-100 dark:fill-emerald-950/20 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs truncate max-w-[280px]">
                        {fd.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                ))
              )}
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 pt-4 border-t border-slate-105 dark:border-slate-900 flex justify-between items-center text-xs mt-3">
              <button 
                type="button" 
                onClick={() => setDriveSaveItem(null)} 
                className="p-2.5 px-4 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeUploadToDrive}
                disabled={!!uploadingToDrive || isCreatingFolder}
                className="p-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-wider uppercase text-[10px] rounded-xl cursor-pointer disabled:opacity-50 select-none shadow-xs flex items-center gap-1.5"
              >
                {uploadingToDrive ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Simpan Dokumen Di Sini
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Rincian Lengkap Setoran Modal */}
      {viewingSetoran && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl relative border border-slate-100 dark:border-slate-800/80 my-8 flex flex-col max-h-[90vh] text-left animate-fade-in overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm border border-emerald-100/30">
                  <BookOpen className="w-6 h-6 stroke-2" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Rincian Lengkap Setoran Saya</h4>
                  <div className="flex items-center space-x-2.5 mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{viewingSetoran.tanggalSetoran}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg text-slate-505 dark:text-slate-400 border border-slate-200/20">ID: {viewingSetoran.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider ${
                  viewingSetoran.statusLulus 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-350 border border-emerald-200/20' 
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-955/50 dark:text-rose-350 border border-rose-200/20'
                }`}>
                  {viewingSetoran.statusLulus ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Lulus</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Remedi</span>
                    </>
                  )}
                </span>
                <button 
                  type="button" 
                  onClick={() => setViewingSetoran(null)} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent hover:border-slate-200/35 dark:hover:border-slate-700/50"
                >
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Kolom Kiri: Informasi Santri & Pelajaran */}
                <div className="space-y-6">
                  
                  {/* Card Informasi Santri */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Informasi Santri</h5>
                    <div className="p-5 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl space-y-4 shadow-xs hover:shadow-sm transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-black text-base uppercase shadow-sm">
                          {viewingSetoran.siswaNama?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-base">{viewingSetoran.siswaNama}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">NIS: {viewingSetoran.siswaNis || '-'}</div>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Grup Halaqah</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.halaqahNama || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ustadz/Ustadzah Penguji</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.guruNama || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Materi Ajar & Kategori */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Materi Ajar & Kategori</h5>
                    <div className="p-5 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl space-y-4 shadow-xs hover:shadow-sm transition-all duration-300 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Modul/Kitab</span>
                        <span className="font-black text-slate-800 dark:text-white text-base block">{viewingSetoran.modulNama}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Elemen Setoran</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.jenisSetoran || 'Setoran'}</span>
                        </div>
                        {viewingSetoran.tipeTahfidz && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kategori</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.tipeTahfidz}</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Rincian Ayat/Halaman</span>
                        
                        {viewingSetoran.daftarSuratSetoran && viewingSetoran.daftarSuratSetoran.length > 0 ? (
                          <div className="space-y-2 mt-1">
                            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">Multi-Surat ({viewingSetoran.daftarSuratSetoran.length} surat):</span>
                            <div className="flex flex-wrap gap-1.5">
                              {viewingSetoran.daftarSuratSetoran.map((item, index) => (
                                <span key={index} className="inline-block px-2.5 py-1 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-bold">
                                  {item.suratNama}: {item.ayatAwal}-{item.ayatAkhir}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : viewingSetoran.tipeModul === TipeModul.AL_QURAN ? (
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-xs shadow-xs">
                              {viewingSetoran.suratNama || 'Surat Tidak Teridentifikasi'}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-xl border border-slate-100/50 dark:border-slate-800/50">Ayat {viewingSetoran.ayatAwal} s/d {viewingSetoran.ayatAkhir}</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs shadow-xs">
                              Jilid {viewingSetoran.nonQuranJilid || 1}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                              {viewingSetoran.nonQuranHalamanTunggal ? (
                                `Halaman ${viewingSetoran.halaman || 1}`
                              ) : (
                                `Halaman ${viewingSetoran.nonQuranPageAwal || viewingSetoran.halaman || 1} s/d ${viewingSetoran.nonQuranPageAkhir || viewingSetoran.halaman || 1}`
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nilai / Score Card */}
                  {(() => {
                    const categoryCounts = {
                      tajwid: 0,
                      makhraj: 0,
                      kelancaran: 0,
                      lainnya: 0
                    };
                    viewingSetoran.interactiveComments?.forEach(c => {
                      const cat = (c.category || '').toLowerCase();
                      if (cat.includes('tajwid')) categoryCounts.tajwid++;
                      else if (cat.includes('makhraj') || cat.includes('huruf') || cat.includes('tajwid_makhraj')) categoryCounts.makhraj++;
                      else if (cat.includes('lancar') || cat.includes('baca') || cat.includes('tajwid_kelancaran')) categoryCounts.kelancaran++;
                      else categoryCounts.lainnya++;
                    });
                    const hasMistakes = (categoryCounts.tajwid + categoryCounts.makhraj + categoryCounts.kelancaran + categoryCounts.lainnya) > 0;

                    // Parse the grade/nilai to avoid overflow
                    const parsedNilai = (() => {
                      const val = viewingSetoran.nilai || '';
                      const match = val.match(/\(([^)]+)\)/);
                      if (match) {
                        const code = match[1]; // e.g. "A+" or "B+"
                        const text = val.replace(/\s*\([^)]+\)/, '').trim(); // e.g. "Jayyid Jiddan"
                        return { code, text };
                      }
                      if (val.length <= 4) {
                        return { code: val, text: '' };
                      }
                      if (val.toLowerCase() === 'perlu ulangan') {
                        return { code: '⚠️', text: 'Perlu Ulangan' };
                      }
                      return { code: val.substring(0, 3).toUpperCase(), text: val };
                    })();

                    return (
                      <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 p-5 shadow-sm hover:shadow-md ${
                        viewingSetoran.statusLulus 
                          ? 'bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white dark:from-emerald-950/10 dark:via-slate-900/30 dark:to-slate-950 border-emerald-500/30 dark:border-emerald-500/15' 
                          : 'bg-gradient-to-br from-rose-50/40 via-amber-50/15 to-white dark:from-rose-950/10 dark:via-slate-900/30 dark:to-slate-950 border-rose-500/30 dark:border-rose-500/15'
                      }`}>
                        {/* Elegant background glowing design */}
                        <div className={`absolute -right-8 -bottom-8 w-36 h-36 rounded-full opacity-10 blur-3xl pointer-events-none ${
                          viewingSetoran.statusLulus ? 'bg-emerald-450 dark:bg-emerald-400' : 'bg-rose-450 dark:bg-rose-400'
                        }`}></div>
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-15 pointer-events-none">
                          <Award className="w-16 h-16 stroke-1 rotate-12 text-slate-400 dark:text-slate-600" />
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 relative z-10">
                          {/* Left Panel: Big circular Score / Grade badge with dynamic font-sizing to prevent wrap */}
                          <div className="flex items-center space-x-4 text-left">
                            <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shadow-md relative shrink-0 transition-all duration-300 ${
                              viewingSetoran.statusLulus
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-white dark:border-slate-900 text-white'
                                : 'bg-gradient-to-br from-rose-500 to-amber-600 border-white dark:border-slate-900 text-white'
                            }`}>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-1.5 right-1.5 animate-pulse" />
                              <span className={`font-sans font-black leading-none tracking-tight ${
                                parsedNilai.code.length > 2 ? 'text-lg' : 'text-3xl'
                              }`}>
                                {parsedNilai.code}
                              </span>
                              <span className="text-[8px] font-bold tracking-widest uppercase opacity-85 mt-1">Nilai</span>
                            </div>

                            <div className="space-y-1">
                              <span className={`text-[9px] font-black uppercase tracking-widest block px-2.5 py-0.5 rounded-full w-max ${
                                viewingSetoran.statusLulus 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              }`}>
                                {viewingSetoran.statusLulus ? 'LULUS / JAYYID' : 'BELUM LULUS / REMEDI'}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                                {parsedNilai.text ? `${parsedNilai.text} (${parsedNilai.code})` : viewingSetoran.nilai}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                Kesimpulan: <span className="font-extrabold text-slate-700 dark:text-slate-300">{viewingSetoran.kesimpulanHasilKelulusan || (viewingSetoran.statusLulus ? 'Lulus Sempurna' : 'Perlu Bimbingan Ulang')}</span>
                              </p>
                            </div>
                          </div>

                          {/* Right Panel: Mistakes summary capsules */}
                          <div className="flex flex-col gap-1.5 min-w-[160px] bg-white/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 text-left">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Ringkasan Evaluasi</span>
                            {!hasMistakes ? (
                              <div className="flex items-center space-x-1.5 text-xs text-emerald-650 dark:text-emerald-400 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>✨ Bacaan Mumtaz</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                                {categoryCounts.makhraj > 0 && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-100/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                    <span>{categoryCounts.makhraj} Makhraj</span>
                                  </span>
                                )}
                                {categoryCounts.tajwid > 0 && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-100/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                    <span>{categoryCounts.tajwid} Tajwid</span>
                                  </span>
                                )}
                                {categoryCounts.kelancaran > 0 && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-100/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    <span>{categoryCounts.kelancaran} Lancar</span>
                                  </span>
                                )}
                                {categoryCounts.lainnya > 0 && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-50 text-slate-750 dark:bg-slate-900/30 dark:text-slate-355 border border-slate-100/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-450 shrink-0"></span>
                                    <span>{categoryCounts.lainnya} Lainnya</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Kolom Kanan: Catatan Guru & Koreksi Detail */}
                <div className="space-y-6 text-left">
                  
                  {/* Card Catatan Guru */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2.5">Catatan Guru / Ustadz</h5>
                    <div className="p-5 bg-amber-50/15 dark:bg-amber-955/5 border border-amber-200/20 dark:border-amber-950/15 rounded-3xl relative min-h-[110px] shadow-xs hover:shadow-sm transition-all duration-300">
                      <span className="absolute top-2.5 right-4 text-amber-500/20 dark:text-amber-500/10 text-5xl font-serif select-none">“</span>
                      <p className="text-xs text-slate-750 dark:text-slate-300 italic font-medium leading-relaxed whitespace-pre-wrap relative z-10">
                        {viewingSetoran.catatanGuru?.trim() ? <>"{renderArabicEnhancedText(viewingSetoran.catatanGuru)}"</> : 'Tidak ada catatan tertulis khusus.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Koreksi Detail Per Kata / Ayat */}
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2.5">Koreksi Detail Per Kata / Ayat</h5>
                    {viewingSetoran.interactiveComments && viewingSetoran.interactiveComments.length > 0 ? (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1.5 scrollbar-thin">
                        {viewingSetoran.interactiveComments.map((item, idx) => (
                          <div key={item.id || idx} className="p-4 border border-amber-200/30 dark:border-slate-800/80 rounded-2xl bg-amber-50/10 dark:bg-slate-900/30 hover:bg-amber-50/20 dark:hover:bg-slate-900/50 transition-all duration-200 flex items-start space-x-4 text-xs shadow-xs">
                            <div className="font-mushaf font-serif text-2xl text-amber-950 dark:text-amber-100 bg-amber-50 dark:bg-amber-950 px-3.5 py-2 rounded-2xl border border-amber-200/50 dark:border-amber-900/50 shadow-inner shrink-0 select-text leading-none flex items-center justify-center min-w-[75px] h-12">
                              {item.target}
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                  {item.info}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                                "{item.comment}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-505 italic text-xs px-5 flex flex-col items-center justify-center gap-2 shadow-xs bg-slate-50/20 dark:bg-slate-900/10">
                        <CheckCircle className="w-8 h-8 text-emerald-500/40 stroke-1" />
                        <span>Alhamdulillah, tidak ada koreksi kesalahan tajwid/makhraj detail yang dicatat pada sesi setoran ini.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 p-5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 flex justify-end items-center">
              <button 
                type="button" 
                onClick={() => setViewingSetoran(null)} 
                className="py-3 px-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-250 font-bold uppercase text-[10px] tracking-wider rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow border border-slate-200/20"
              >
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// Help helper icon wrapper
function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
