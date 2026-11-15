/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  UserCheck,
  UserX,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  CalendarDays,
  ExternalLink,
  RefreshCw,
  Cloud,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { useApp } from '../context/AppContext';
import { Siswa, Halaqah, Guru, Setoran, JadwalMengajarGuru, StatusAktif, UserRole } from '../types';
import { getGoogleAccessToken, signInWithGoogleWorkspace } from './GoogleWorkspace';
import {
  INDONESIAN_DAY_NAMES,
  INDONESIAN_MONTH_FULL,
  isHalaqahScheduledOnDayIndex,
  getStudentAttendanceForDate,
  StudentAttendanceStatusResult
} from '../utils/studentAttendanceHelper';

export const AdminPresensiSantri: React.FC = () => {
  const {
    currentSession,
    siswas = [],
    halaqahs = [],
    gurus = [],
    setorans = [],
    studentAttendance = [],
    guruAttendance = [],
    guruSchedules = []
  } = useApp();

  const user = currentSession?.user;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const todayStr = now.toISOString().split('T')[0];

  // Filters State
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>('All');
  const [selectedGuruId, setSelectedGuruId] = useState<string>('All');

  // Helper pemeriksa apakah halaqah dibimbing oleh guru tertentu
  const isHalaqahBelongsToGuru = useCallback((h: Halaqah, guruId: string, guruObj?: Guru | null) => {
    if (h.guruPembimbingId === guruId) return true;
    if (guruObj) {
      if (guruObj.halaqahBimbinganId && guruObj.halaqahBimbinganId === h.id) return true;
      if (h.guruPembimbingNama && guruObj.namaLengkap && h.guruPembimbingNama.trim().toLowerCase() === guruObj.namaLengkap.trim().toLowerCase()) return true;
    }
    return false;
  }, []);

  // Guru terpilih saat ini
  const selectedGuruObj = useMemo(() => {
    if (selectedGuruId === 'All') return null;
    return gurus.find(g => g.id === selectedGuruId) || null;
  }, [selectedGuruId, gurus]);

  // Daftar halaqah yang tersedia berdasarkan guru yang dipilih:
  // Jika 'All', tampilkan semua halaqah. Jika guru tertentu dipilih, hanya tampilkan halaqah bimbingan guru tersebut.
  const availableHalaqahs = useMemo(() => {
    if (selectedGuruId === 'All') {
      return halaqahs;
    }
    return (halaqahs || []).filter(h => isHalaqahBelongsToGuru(h, selectedGuruId, selectedGuruObj));
  }, [halaqahs, selectedGuruId, selectedGuruObj, isHalaqahBelongsToGuru]);

  // Otomatis reset atau sesuaikan selectedHalaqahId saat selectedGuruId berganti
  useEffect(() => {
    if (selectedGuruId !== 'All' && selectedHalaqahId !== 'All') {
      const isValid = availableHalaqahs.some(h => h.id === selectedHalaqahId);
      if (!isValid) {
        setSelectedHalaqahId('All');
      }
    }
  }, [selectedGuruId, availableHalaqahs, selectedHalaqahId]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [activeViewTab, setActiveViewTab] = useState<'matriks' | 'rekap_halaqah'>('matriks');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Google Drive & Download Integration States
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const [isDriveDropdownOpen, setIsDriveDropdownOpen] = useState(false);
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
  const [driveLocationTab, setDriveLocationTab] = useState<'my_drive' | 'shared_drives'>('my_drive');
  const [sharedDrivesList, setSharedDrivesList] = useState<Array<{ id: string; name: string }>>([]);
  const [activeSharedDriveId, setActiveSharedDriveId] = useState<string | null>(null);
  const [isFetchingSharedDrives, setIsFetchingSharedDrives] = useState<boolean>(false);
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [isSearchingFolders, setIsSearchingFolders] = useState<boolean>(false);
  const [driveAuthPrompt, setDriveAuthPrompt] = useState<{ fileName: string; type: 'PDF' | 'Excel' } | null>(null);

  // Month days range
  const monthInt = parseInt(selectedMonth, 10);
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, monthInt, 0).getDate();
  }, [selectedYear, monthInt]);

  const daysList = useMemo(() => {
    const list: Array<{ dayNum: number; dateStr: string; dayIndex: number; dayName: string; isPastOrToday: boolean }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${selectedYear}-${selectedMonth}-${dayStr}`;
      const dObj = new Date(selectedYear, monthInt - 1, d);
      const dayIndex = dObj.getDay();
      list.push({
        dayNum: d,
        dateStr,
        dayIndex,
        dayName: INDONESIAN_DAY_NAMES[dayIndex],
        isPastOrToday: dateStr <= todayStr
      });
    }
    return list;
  }, [selectedYear, selectedMonth, monthInt, daysInMonth, todayStr]);

  // Active students filtering
  const activeStudents = useMemo(() => {
    return (siswas || []).filter(s => {
      // Must not be explicitly inactive
      if (s.status && s.status !== StatusAktif.AKTIF) return false;

      // Halaqah filter
      if (selectedHalaqahId !== 'All') {
        const matchesHalaqahId = s.halaqahId === selectedHalaqahId;
        const halaqahObj = halaqahs.find(h => h.id === selectedHalaqahId);
        const matchesHalaqahNama = halaqahObj && s.halaqahNama &&
          s.halaqahNama.trim().toLowerCase() === halaqahObj.namaHalaqah.trim().toLowerCase();
        if (!matchesHalaqahId && !matchesHalaqahNama) return false;
      }

      // Guru filter
      if (selectedGuruId !== 'All') {
        const studentHalaqah = halaqahs.find(h => h.id === s.halaqahId || h.namaHalaqah === s.halaqahNama);
        if (!studentHalaqah || !isHalaqahBelongsToGuru(studentHalaqah, selectedGuruId, selectedGuruObj)) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (s.namaLengkap || '').toLowerCase().includes(q);
        const matchNis = (s.nis || '').toLowerCase().includes(q);
        const matchHalaqah = (s.halaqahNama || '').toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchHalaqah) return false;
      }

      return true;
    });
  }, [siswas, halaqahs, selectedHalaqahId, selectedGuruId, selectedGuruObj, isHalaqahBelongsToGuru, searchTerm]);

  // Student month attendance matrix computation
  interface StudentMatrixRow {
    student: Siswa;
    halaqah?: Halaqah;
    guruNama: string;
    dailyStatuses: Record<number, StudentAttendanceStatusResult>;
    totalScheduled: number;
    totalHadirSetoran: number;
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlpa: number;
    totalLibur: number;
    attendancePercent: number;
  }

  const studentMatrixRows: StudentMatrixRow[] = useMemo(() => {
    return activeStudents.map(student => {
      const halaqah = halaqahs.find(h => h.id === student.halaqahId || h.namaHalaqah === student.halaqahNama);
      const guru = halaqah ? gurus.find(g => g.id === halaqah.guruPembimbingId) : null;
      const guruNama = guru?.namaLengkap || (halaqah as any)?.guruPembimbingNama || '-';
      const teacherId = guru?.id || halaqah?.guruPembimbingId || '';
      const teacherName = guru?.namaLengkap || (halaqah as any)?.guruPembimbingNama || '';

      const dailyStatuses: Record<number, StudentAttendanceStatusResult> = {};
      let totalScheduled = 0;
      let totalHadirSetoran = 0;
      let totalSakit = 0;
      let totalIzin = 0;
      let totalAlpa = 0;
      let totalLibur = 0;

      daysList.forEach(dayItem => {
        const isScheduled = isHalaqahScheduledOnDayIndex(halaqah, dayItem.dayIndex, guruSchedules, teacherId, teacherName);
        const statusResult = getStudentAttendanceForDate(
          student,
          dayItem.dateStr,
          setorans,
          studentAttendance,
          isScheduled,
          todayStr,
          guruAttendance,
          halaqah,
          teacherId,
          teacherName,
          siswas
        );

        dailyStatuses[dayItem.dayNum] = statusResult;

        // Tally scheduled days that occurred up to today or have records
        if (isScheduled && dayItem.isPastOrToday) {
          if (statusResult.type === 'libur') {
            totalLibur++;
            // Note: If teacher is on leave/excused (Libur L), student percentage is not penalized
          } else if (statusResult.type === 'not_started' || statusResult.type === 'off' || statusResult.type === 'future') {
            // Belum dimulai / belum ada kegiatan: Tidak dihitung sebagai Alpha maupun pengurang persentase kehadiran
          } else {
            totalScheduled++;
            if (statusResult.type === 'setoran') {
              totalHadirSetoran++;
            } else if (statusResult.type === 'sakit') {
              totalSakit++;
            } else if (statusResult.type === 'izin') {
              totalIzin++;
            } else if (statusResult.type === 'alpha') {
              totalAlpa++;
            }
          }
        }
      });

      const totalHadir = totalHadirSetoran;
      const attendancePercent = totalScheduled > 0 ? Math.round((totalHadir / totalScheduled) * 100) : (totalLibur > 0 ? 100 : 100);

      return {
        student,
        halaqah,
        guruNama,
        dailyStatuses,
        totalScheduled,
        totalHadirSetoran,
        totalHadir,
        totalSakit,
        totalIzin,
        totalAlpa,
        totalLibur,
        attendancePercent
      };
    });
  }, [activeStudents, halaqahs, gurus, daysList, guruSchedules, setorans, studentAttendance, guruAttendance, todayStr, siswas]);

  // Filtered rows by status filter
  const displayedRows = useMemo(() => {
    if (selectedStatusFilter === 'All') return studentMatrixRows;
    return studentMatrixRows.filter(row => {
      if (selectedStatusFilter === 'Hadir') return row.totalHadir > 0;
      if (selectedStatusFilter === 'Sakit') return row.totalSakit > 0;
      if (selectedStatusFilter === 'Izin') return row.totalIzin > 0;
      if (selectedStatusFilter === 'Alpha') return row.totalAlpa > 0;
      if (selectedStatusFilter === 'Libur') return row.totalLibur > 0;
      return true;
    });
  }, [studentMatrixRows, selectedStatusFilter]);

  // Aggregated KPIs
  const kpiData = useMemo(() => {
    let grandTotalScheduled = 0;
    let grandTotalHadirSetoran = 0;
    let grandTotalSakit = 0;
    let grandTotalIzin = 0;
    let grandTotalAlpa = 0;
    let grandTotalLibur = 0;

    studentMatrixRows.forEach(r => {
      grandTotalScheduled += r.totalScheduled;
      grandTotalHadirSetoran += r.totalHadirSetoran;
      grandTotalSakit += r.totalSakit;
      grandTotalIzin += r.totalIzin;
      grandTotalAlpa += r.totalAlpa;
      grandTotalLibur += r.totalLibur;
    });

    const grandTotalHadir = grandTotalHadirSetoran;
    const overallAttendanceRate = grandTotalScheduled > 0 ? Math.round((grandTotalHadir / grandTotalScheduled) * 100) : (grandTotalLibur > 0 ? 100 : 0);

    return {
      totalStudents: studentMatrixRows.length,
      overallAttendanceRate,
      grandTotalScheduled,
      grandTotalHadir,
      grandTotalHadirSetoran,
      grandTotalSakit,
      grandTotalIzin,
      grandTotalAlpa,
      grandTotalLibur
    };
  }, [studentMatrixRows]);

  // Daily Chart Data for the Selected Month
  const dailyChartData = useMemo(() => {
    return daysList.map(dayItem => {
      let hadirCount = 0;
      let sakitIzinCount = 0;
      let alpaCount = 0;
      let liburCount = 0;

      studentMatrixRows.forEach(r => {
        const s = r.dailyStatuses[dayItem.dayNum];
        if (!s) return;
        if (s.type === 'setoran') hadirCount++;
        else if (s.type === 'sakit' || s.type === 'izin') sakitIzinCount++;
        else if (s.type === 'alpha') alpaCount++;
        else if (s.type === 'libur') liburCount++;
      });

      return {
        tanggal: `${dayItem.dayNum} ${dayItem.dayName.slice(0, 3)}`,
        dayNum: dayItem.dayNum,
        Hadir: hadirCount,
        'Sakit & Izin': sakitIzinCount,
        Alpa: alpaCount,
        Libur: liburCount
      };
    });
  }, [daysList, studentMatrixRows]);

  // Monthly Comparison Chart Data (Last 6 Months)
  const monthlyComparisonData = useMemo(() => {
    const list = [];
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(selectedYear, monthInt - 1 - offset, 1);
      const y = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const mName = INDONESIAN_MONTH_FULL[d.getMonth()].slice(0, 3);
      const label = `${mName} '${String(y).slice(-2)}`;

      // Count setorans in this month
      const prefix = `${y}-${mStr}`;
      const monthSetorans = (setorans || []).filter(s => s.tanggalSetoran && s.tanggalSetoran.startsWith(prefix));
      const monthAttendances = (studentAttendance || []).filter((a: any) => a.tanggal && a.tanggal.startsWith(prefix));

      const hadirCount = monthSetorans.length + monthAttendances.filter((a: any) => a.status === 'Hadir').length;
      const sakitIzinCount = monthAttendances.filter((a: any) => a.status === 'Sakit' || a.status === 'Izin').length;
      const alpaCount = monthAttendances.filter((a: any) => a.status === 'Alpha' || a.status === 'Alpa').length;

      const totalRecords = hadirCount + sakitIzinCount + alpaCount;
      const attendancePercent = totalRecords > 0 ? Math.round((hadirCount / totalRecords) * 100) : 0;

      list.push({
        bulan: label,
        year: y,
        monthStr: mStr,
        TotalHadir: hadirCount,
        TingkatKehadiran: attendancePercent,
        SakitIzin: sakitIzinCount,
        Alpa: alpaCount
      });
    }
    return list;
  }, [selectedYear, monthInt, setorans, studentAttendance]);

  // Status Distribution Pie Data
  const statusPieData = useMemo(() => {
    const data = [
      { name: 'Hadir Setoran', value: kpiData.grandTotalHadirSetoran, color: '#10b981' },
      { name: 'Sakit', value: kpiData.grandTotalSakit, color: '#f59e0b' },
      { name: 'Izin', value: kpiData.grandTotalIzin, color: '#a855f7' },
      { name: 'Alpa', value: kpiData.grandTotalAlpa, color: '#ef4444' },
      { name: 'Libur (Guru Berhalangan)', value: kpiData.grandTotalLibur, color: '#3b82f6' }
    ];
    return data.filter(d => d.value > 0);
  }, [kpiData]);

  // Unrecorded Follow-Up Items
  // Halaqah Summary Comparison
  const halaqahSummaryList = useMemo(() => {
    const targetHalaqahs = (availableHalaqahs || []).filter(h => selectedHalaqahId === 'All' || h.id === selectedHalaqahId);
    return targetHalaqahs.map(h => {
      const guru = gurus.find(g => g.id === h.guruPembimbingId);
      const studentsInHalaqah = studentMatrixRows.filter(r => r.halaqah?.id === h.id || r.student.halaqahId === h.id);

      let hScheduled = 0;
      let hHadir = 0;
      let hSakit = 0;
      let hIzin = 0;
      let hAlpa = 0;
      let hLibur = 0;

      studentsInHalaqah.forEach(r => {
        hScheduled += r.totalScheduled;
        hHadir += r.totalHadir;
        hSakit += r.totalSakit;
        hIzin += r.totalIzin;
        hAlpa += r.totalAlpa;
        hLibur += r.totalLibur;
      });

      const rate = hScheduled > 0 ? Math.round((hHadir / hScheduled) * 100) : (hLibur > 0 ? 100 : 0);

      return {
        halaqah: h,
        guruNama: guru?.namaLengkap || '-',
        studentCount: studentsInHalaqah.length,
        scheduledDaysCount: hScheduled,
        totalHadir: hHadir,
        totalSakit: hSakit,
        totalIzin: hIzin,
        totalAlpa: hAlpa,
        totalLibur: hLibur,
        attendanceRate: rate
      };
    });
  }, [availableHalaqahs, selectedHalaqahId, gurus, studentMatrixRows]);

  // Helper to generate Excel Workbook
  const generateExcelWorkbook = () => {
    // Sheet 1: Matrix Data
    const headers = ['No', 'NIS', 'Nama Santri', 'Halaqah', 'Guru Pembimbing'];
    for (let d = 1; d <= daysInMonth; d++) {
      headers.push(String(d));
    }
    headers.push('Hadir Setoran (H)', 'Sakit (S)', 'Izin (I)', 'Alpha (A)', 'Libur (L)', 'Total Hadir', '% Kehadiran');

    const rowsData = displayedRows.map((r, idx) => {
      const row = [
        idx + 1,
        r.student.nis || '-',
        r.student.namaLengkap,
        r.halaqah?.namaHalaqah || r.student.halaqahNama || '-',
        r.guruNama
      ];

      for (let d = 1; d <= daysInMonth; d++) {
        const st = r.dailyStatuses[d];
        row.push(st ? st.code : '-');
      }

      row.push(
        r.totalHadirSetoran,
        r.totalSakit,
        r.totalIzin,
        r.totalAlpa,
        r.totalLibur,
        r.totalHadir,
        `${r.attendancePercent}%`
      );

      return row;
    });

    const wsMatrix = XLSX.utils.aoa_to_sheet([headers, ...rowsData]);

    // Sheet 2: Halaqah Summary
    const summaryHeaders = ['No', 'Nama Halaqah', 'Guru Pembimbing', 'Jumlah Santri', 'Total Hadir', 'Sakit', 'Izin', 'Alpa', 'Libur (L)', '% Kehadiran'];
    const summaryRows = halaqahSummaryList.map((h, idx) => [
      idx + 1,
      h.halaqah.namaHalaqah,
      h.guruNama,
      h.studentCount,
      h.totalHadir,
      h.totalSakit,
      h.totalIzin,
      h.totalAlpa,
      h.totalLibur,
      `${h.attendanceRate}%`
    ]);
    const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriks Kehadiran');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Rekap per Halaqah');

    return wb;
  };

  // Helper to generate PDF document (Native jsPDF landscape)
  const generatePDFDocument = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const monthName = INDONESIAN_MONTH_FULL[monthInt - 1];

    const drawHeader = (startY: number) => {
      // Document Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 118, 110);
      doc.text('REKAPITULASI KEHADIRAN SANTRI (MUTABAAH)', 10, startY);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Periode: Bulan ${monthName} ${selectedYear} | Total: ${kpiData.totalStudents} Santri | Kehadiran: ${kpiData.overallAttendanceRate}% | Cetak: ${new Date().toLocaleDateString('id-ID')}`, 10, startY + 5);

      // Table Header Bar
      const tableY = startY + 9;
      doc.setFillColor(241, 245, 249);
      doc.rect(10, tableY, 277, 7, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);

      doc.text('No', 11, tableY + 4.5);
      doc.text('NIS', 18, tableY + 4.5);
      doc.text('Nama Santri', 34, tableY + 4.5);
      doc.text('Halaqah', 70, tableY + 4.5);

      const dayColW = 145 / daysInMonth;
      for (let d = 1; d <= daysInMonth; d++) {
        const x = 96 + (d - 1) * dayColW;
        doc.text(String(d), x + 1, tableY + 4.5);
      }

      const summaryStartX = 96 + daysInMonth * dayColW;
      doc.text('H', summaryStartX + 1, tableY + 4.5);
      doc.text('S', summaryStartX + 6, tableY + 4.5);
      doc.text('I', summaryStartX + 11, tableY + 4.5);
      doc.text('A', summaryStartX + 16, tableY + 4.5);
      doc.text('L', summaryStartX + 21, tableY + 4.5);
      doc.text('%', summaryStartX + 26, tableY + 4.5);

      doc.setDrawColor(203, 213, 225);
      doc.line(10, tableY + 7, 287, tableY + 7);
      return tableY + 7;
    };

    let currentY = drawHeader(12);
    const rowHeight = 5;
    const dayColW = 145 / daysInMonth;
    const summaryStartX = 96 + daysInMonth * dayColW;

    displayedRows.forEach((r, idx) => {
      if (currentY + rowHeight > 195) {
        doc.addPage();
        currentY = drawHeader(12);
      }

      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, currentY, 277, rowHeight, 'F');
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);

      // No, NIS, Nama, Halaqah
      doc.text(String(idx + 1), 11, currentY + 3.5);
      doc.text((r.student.nis || '-').slice(0, 10), 18, currentY + 3.5);
      doc.text((r.student.namaLengkap || '-').slice(0, 22), 34, currentY + 3.5);
      doc.text((r.halaqah?.namaHalaqah || r.student.halaqahNama || '-').slice(0, 15), 70, currentY + 3.5);

      // Days 1..daysInMonth
      for (let d = 1; d <= daysInMonth; d++) {
        const st = r.dailyStatuses[d];
        const x = 96 + (d - 1) * dayColW;
        const code = st ? st.code : '-';

        if (code === 'H') {
          doc.setTextColor(16, 185, 129);
        } else if (code === 'S') {
          doc.setTextColor(217, 119, 6);
        } else if (code === 'I') {
          doc.setTextColor(147, 51, 234);
        } else if (code === 'A') {
          doc.setTextColor(225, 29, 72);
        } else if (code === 'L') {
          doc.setTextColor(37, 99, 235);
        } else {
          doc.setTextColor(148, 163, 184);
        }

        doc.text(code, x + 1, currentY + 3.5);
      }

      // Summary
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(String(r.totalHadir), summaryStartX + 1, currentY + 3.5);

      doc.setTextColor(217, 119, 6);
      doc.text(String(r.totalSakit), summaryStartX + 6, currentY + 3.5);

      doc.setTextColor(147, 51, 234);
      doc.text(String(r.totalIzin), summaryStartX + 11, currentY + 3.5);

      doc.setTextColor(225, 29, 72);
      doc.text(String(r.totalAlpa), summaryStartX + 16, currentY + 3.5);

      doc.setTextColor(37, 99, 235);
      doc.text(String(r.totalLibur), summaryStartX + 21, currentY + 3.5);

      doc.setTextColor(30, 41, 59);
      doc.text(`${r.attendancePercent}%`, summaryStartX + 26, currentY + 3.5);

      // Row line
      doc.setDrawColor(241, 245, 249);
      doc.line(10, currentY + rowHeight, 287, currentY + rowHeight);

      currentY += rowHeight;
    });

    return doc;
  };

  // Export Matrix to Excel (Download)
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const monthName = INDONESIAN_MONTH_FULL[monthInt - 1];
      const fileName = `Rekap_Kehadiran_Santri_${monthName}_${selectedYear}.xlsx`;
      const wb = generateExcelWorkbook();
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Gagal mengekspor data ke Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Matrix to PDF (Download)
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const monthName = INDONESIAN_MONTH_FULL[monthInt - 1];
      const fileName = `Rekap_Kehadiran_Santri_${monthName}_${selectedYear}.pdf`;
      const doc = generatePDFDocument();
      doc.save(fileName);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      alert('Gagal mengekspor data ke PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch Google Drive Folders
  const fetchDriveFolders = async (parentId: string = 'root', corporaId?: string) => {
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsFetchingFolders(true);
    try {
      const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=100&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      if (corporaId) {
        url += `&corpora=drive&driveId=${corporaId}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDriveFolders(data.files || []);
      }
    } catch (err) {
      console.warn('Gagal memuat folder Google Drive:', err);
    } finally {
      setIsFetchingFolders(false);
    }
  };

  // Fetch Shared Drives (Drive Bersama)
  const fetchSharedDrives = async () => {
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsFetchingSharedDrives(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/drives?pageSize=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSharedDrivesList(data.drives || []);
      }
    } catch (err) {
      console.warn('Gagal memuat Drive Bersama:', err);
    } finally {
      setIsFetchingSharedDrives(false);
    }
  };

  // Search Folders in Google Drive
  const handleSearchFolders = async (term: string) => {
    setFolderSearchTerm(term);
    if (!term.trim() || term.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsSearchingFolders(true);
    try {
      const cleanTerm = term.replace(/'/g, "\\'");
      const q = `mimeType = 'application/vnd.google-apps.folder' and name contains '${cleanTerm}' and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=50&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.files || []);
      }
    } catch (err) {
      console.warn('Gagal mencari folder:', err);
    } finally {
      setIsSearchingFolders(false);
    }
  };

  const handleSelectSearchResult = (folder: { id: string; name: string }) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, folder]);
    setFolderSearchTerm('');
    setSearchResults([]);
    fetchDriveFolders(folder.id, activeSharedDriveId || undefined);
  };

  const handleSwitchDriveTab = (tab: 'my_drive' | 'shared_drives') => {
    setDriveLocationTab(tab);
    setFolderSearchTerm('');
    setSearchResults([]);
    if (tab === 'my_drive') {
      setActiveSharedDriveId(null);
      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      fetchDriveFolders('root');
    } else {
      setActiveSharedDriveId(null);
      setCurrentFolderId('');
      setFolderPath([{ id: 'shared_root', name: 'Drive Bersama' }]);
      setDriveFolders([]);
      fetchSharedDrives();
    }
  };

  const handleSelectSharedDrive = (drive: { id: string; name: string }) => {
    setActiveSharedDriveId(drive.id);
    setCurrentFolderId(drive.id);
    setFolderPath([
      { id: 'shared_root', name: 'Drive Bersama' },
      { id: drive.id, name: drive.name }
    ]);
    fetchDriveFolders(drive.id, drive.id);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Nama folder tidak boleh kosong!');
      return;
    }
    const token = getGoogleAccessToken();
    if (!token) return;
    if (driveLocationTab === 'shared_drives' && !activeSharedDriveId && currentFolderId === '') {
      alert('Silakan pilih salah satu Drive Bersama terlebih dahulu sebelum membuat folder.');
      return;
    }
    setIsCreatingFolder(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId || activeSharedDriveId || 'root']
        })
      });
      if (response.ok) {
        setNewFolderName('');
        fetchDriveFolders(currentFolderId, activeSharedDriveId || undefined);
      } else {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Gagal membuat folder di Google Drive');
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat folder: ' + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleStepBackFolder = (folderId: string, idx: number) => {
    setFolderPath(prev => prev.slice(0, idx + 1));
    setFolderSearchTerm('');
    setSearchResults([]);
    if (driveLocationTab === 'shared_drives') {
      if (idx === 0) {
        setActiveSharedDriveId(null);
        setCurrentFolderId('');
        setDriveFolders([]);
        fetchSharedDrives();
        return;
      }
    }
    setCurrentFolderId(folderId);
    fetchDriveFolders(folderId, activeSharedDriveId || undefined);
  };

  const handleOpenFolder = (folder: { id: string; name: string }) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, folder]);
    setFolderSearchTerm('');
    setSearchResults([]);
    fetchDriveFolders(folder.id, activeSharedDriveId || undefined);
  };

  const handleReauthDrive = async () => {
    try {
      const newToken = await signInWithGoogleWorkspace(user?.role || UserRole.ADMIN);
      if (newToken) {
        fetchDriveFolders(currentFolderId || 'root', activeSharedDriveId || undefined);
        fetchSharedDrives();
        alert('Akun Google berhasil dihubungkan ulang. Silakan pilih folder dan simpan kembali.');
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Gagal menghubungkan akun Google: ' + (err?.message || 'Error'));
      }
    }
  };

  const handleConnectDriveAndSave = async (fileName: string, type: 'PDF' | 'Excel') => {
    try {
      const token = await signInWithGoogleWorkspace(user?.role || UserRole.ADMIN);
      if (token) {
        setDriveAuthPrompt(null);
        setTimeout(() => {
          saveToGoogleDrive(type);
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Gagal menghubungkan Google Drive: ' + (err?.message || 'Error'));
      }
    }
  };

  // Open Drive Modal to select Folder and File Name
  const saveToGoogleDrive = async (type: 'PDF' | 'Excel') => {
    const monthName = INDONESIAN_MONTH_FULL[monthInt - 1];
    const defaultName = `Rekap_Kehadiran_Santri_${monthName}_${selectedYear}`;
    const token = getGoogleAccessToken();
    if (!token) {
      setDriveAuthPrompt({ fileName: defaultName, type });
      return;
    }

    setUploadingToDrive(defaultName);
    try {
      let fileBlob: Blob;
      let mimeType = '';
      let extension = '';

      if (type === 'Excel') {
        mimeType = 'application/vnd.google-apps.spreadsheet';
        extension = 'xlsx';
        const wb = generateExcelWorkbook();
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        fileBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else {
        mimeType = 'application/pdf';
        extension = 'pdf';
        const doc = generatePDFDocument();
        fileBlob = doc.output('blob');
      }

      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      setDriveLocationTab('my_drive');
      setActiveSharedDriveId(null);
      setFolderSearchTerm('');
      setSearchResults([]);
      setCustomFileName(defaultName);
      setDriveSaveItem({
        blob: fileBlob,
        mimeType,
        extension,
        defaultName
      });
      fetchDriveFolders('root');
      fetchSharedDrives();
    } catch (err: any) {
      console.error(err);
      alert('Kesalahan saat menyiapkan file: ' + err.message);
    } finally {
      setUploadingToDrive(null);
    }
  };

  // Execute Upload to Selected Google Drive Folder
  const executeUploadToDrive = async () => {
    if (!driveSaveItem) return;
    const token = getGoogleAccessToken();
    if (!token) {
      alert('Token akses Google Drive tidak ditemukan atau sesi telah berakhir. Silakan hubungkan kembali akun Google Anda.');
      return;
    }

    setUploadingToDrive(driveSaveItem.defaultName);
    try {
      const finalName = customFileName.trim()
        ? (customFileName.endsWith(`.${driveSaveItem.extension}`) ? customFileName : `${customFileName}.${driveSaveItem.extension}`)
        : `${driveSaveItem.defaultName}_${new Date().toISOString().slice(0, 10)}.${driveSaveItem.extension}`;

      const parents = currentFolderId && currentFolderId !== 'root' && currentFolderId !== 'shared_root' ? [currentFolderId] : undefined;

      // Case 1: Google Spreadsheet Conversion (.xlsx to native Google Sheet or XLSX)
      if (driveSaveItem.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const sheetName = finalName.replace(/\.xlsx$/i, '');
        const boundary = '-------HalaqahDriveMultipartSheet' + Date.now();
        const metadata = {
          name: sheetName,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          description: `Disimpan dari Portal HalaqahMonitor oleh Admin (Rekap Kehadiran Santri)`,
          ...(parents && { parents })
        };

        let createdSuccessfully = false;
        try {
          const multipartBody = new Blob([
            `--${boundary}\r\n`,
            'Content-Type: application/json; charset=UTF-8\r\n\r\n',
            JSON.stringify(metadata),
            `\r\n--${boundary}\r\n`,
            'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n',
            driveSaveItem.blob,
            `\r\n--${boundary}--\r\n`
          ]);

          const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
          });

          if (uploadRes.status === 401) {
            localStorage.removeItem('mh_google_access_token');
            localStorage.removeItem('mh_google_access_token_expiry');
            throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
          }

          if (uploadRes.ok) {
            createdSuccessfully = true;
          }
        } catch (multipartErr: any) {
          if (multipartErr.message?.includes('Sesi Google Drive telah berakhir')) throw multipartErr;
        }

        // Fallback: 2-step direct Excel (.xlsx) upload
        if (!createdSuccessfully) {
          const xlsxFileName = finalName.endsWith('.xlsx') ? finalName : `${finalName}.xlsx`;
          const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: xlsxFileName,
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              description: `Disimpan dari Portal HalaqahMonitor oleh Admin (Rekap Kehadiran Santri)`,
              ...(parents && { parents })
            })
          });

          if (createRes.status === 401) {
            localStorage.removeItem('mh_google_access_token');
            localStorage.removeItem('mh_google_access_token_expiry');
            throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali.');
          }

          if (!createRes.ok) {
            const errData = await createRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Gagal membuat file spreadsheet di Google Drive');
          }

          const fileData = await createRes.json();
          const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileData.id}?uploadType=media&supportsAllDrives=true`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            body: driveSaveItem.blob
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Gagal mengunggah konten spreadsheet ke Google Drive');
          }
        }

        alert(`Sukses! Berkas spreadsheet "${sheetName}" berhasil disimpan ke Google Drive.`);
        setDriveSaveItem(null);
        return;
      }

      // Case 2: PDF file upload
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: finalName,
          mimeType: driveSaveItem.mimeType || 'application/pdf',
          description: `Disimpan dari Portal HalaqahMonitor oleh Admin (Rekap Kehadiran Santri)`,
          ...(parents && { parents })
        })
      });

      if (createRes.status === 401) {
        localStorage.removeItem('mh_google_access_token');
        localStorage.removeItem('mh_google_access_token_expiry');
        throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
      }

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Gagal membuat berkas di Google Drive');
      }

      const fileData = await createRes.json();
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileData.id}?uploadType=media&supportsAllDrives=true`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': driveSaveItem.mimeType || 'application/pdf'
        },
        body: driveSaveItem.blob
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Gagal mengunggah konten berkas ke Google Drive');
      }

      alert(`Sukses! Berkas "${finalName}" berhasil disimpan ke Google Drive.`);
      setDriveSaveItem(null);
    } catch (err: any) {
      console.error(err);
      alert('Kesalahan saat mengunggah ke Google Drive: ' + err.message);
    } finally {
      setUploadingToDrive(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                Laporan &amp; Rekapitulasi Kehadiran Santri (Mutabaah)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sinkronisasi otomatis antara jadwal mengajar guru di halaqah, riwayat setoran hafalan harian, dan pencatatan absensi ustadz/ah.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Unduh ke Perangkat & Simpan ke Google Drive */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Dropdown 1: UNDUH KE PERANGKAT (PDF, EXCEL) */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => {
                setIsDownloadDropdownOpen(!isDownloadDropdownOpen);
                setIsDriveDropdownOpen(false);
              }}
              disabled={isExporting || displayedRows.length === 0}
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
              title="Klik untuk memilih format unduhan ke perangkat Anda (PDF, Excel)"
            >
              <Download className="w-4 h-4 mr-1.5 text-white" />
              <span>{isExporting ? 'Mengekspor berkas...' : 'Unduh ke Perangkat'}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
            </button>

            {isDownloadDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDownloadDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-fade-in text-left">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Pilihan Format Unduh ke Perangkat
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDownloadDropdownOpen(false);
                      handleExportPDF();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white text-xs block">Format Dokumen PDF (.pdf)</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Dokumen Matriks Siap Cetak</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDownloadDropdownOpen(false);
                      handleExportExcel();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white text-xs block">Format EXCEL (.xlsx)</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Lembar Kerja Matriks &amp; Rekap</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Dropdown 2: SIMPAN KE GOOGLE DRIVE (PDF, SPREADSHEET) */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => {
                setIsDriveDropdownOpen(!isDriveDropdownOpen);
                setIsDownloadDropdownOpen(false);
              }}
              disabled={isExporting || displayedRows.length === 0}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
              title="Simpan rekap kehadiran santri langsung ke Google Drive (PDF / Spreadsheet)"
            >
              <Cloud className="w-4 h-4 mr-1.5 text-white" />
              <span>{uploadingToDrive ? `Menyiapkan ${uploadingToDrive}...` : 'Simpan ke Google Drive'}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
            </button>

            {isDriveDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDriveDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-fade-in text-left">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Pilihan Format Simpan Drive
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDriveDropdownOpen(false);
                      saveToGoogleDrive('PDF');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white text-xs block">Format Dokumen PDF (.pdf)</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Matriks Resmi Landscape</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDriveDropdownOpen(false);
                      saveToGoogleDrive('Excel');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white text-xs block">Google Spreadsheet (.xlsx)</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Matriks, Unrecorded &amp; Rekap</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Santri</span>
          <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">
            {kpiData.totalStudents}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Santri aktif</span>
        </div>

        <div className="bg-green-50/60 dark:bg-green-950/20 p-4 rounded-2xl border border-green-200/60 dark:border-green-900/40 shadow-2xs">
          <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest block">Tingkat Hadir</span>
          <span className="text-2xl font-black text-green-600 dark:text-green-400 mt-1 block">
            {kpiData.overallAttendanceRate}%
          </span>
          <span className="text-[10px] text-green-700 dark:text-green-400 block mt-0.5 font-medium">
            {kpiData.grandTotalHadir} sesi kehadiran
          </span>
        </div>

        <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block">Hadir Setoran</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {kpiData.grandTotalHadirSetoran}
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5">
            Total presensi Hadir (H)
          </span>
        </div>

        <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">Sakit</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {kpiData.grandTotalSakit}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">Izin sakit santri</span>
        </div>

        <div className="bg-purple-50/60 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest block">Izin</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {kpiData.grandTotalIzin}
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-0.5">Izin santri</span>
        </div>

        <div className="bg-sky-50/60 dark:bg-sky-950/20 p-4 rounded-2xl border border-sky-200/60 dark:border-sky-900/40 shadow-2xs">
          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest block">Libur (L)</span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
            {kpiData.grandTotalLibur}
          </span>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 block mt-0.5 font-medium">Guru izin/sakit/alpa</span>
        </div>

        <div className="bg-rose-50/60 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest block">Alpha (A)</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {kpiData.grandTotalAlpa}
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5 font-medium">Tanpa keterangan</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-1" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {INDONESIAN_MONTH_FULL.map((mName, idx) => {
                  const mVal = String(idx + 1).padStart(2, '0');
                  return (
                    <option key={mVal} value={mVal}>
                      {mName}
                    </option>
                  );
                })}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Guru Filter */}
            <select
              value={selectedGuruId}
              onChange={(e) => setSelectedGuruId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">Semua Guru Pembimbing ({gurus.length})</option>
              {gurus.map(g => (
                <option key={g.id} value={g.id}>{g.namaLengkap}</option>
              ))}
            </select>

            {/* Halaqah Filter (setelah Pilih Guru) */}
            <select
              value={selectedHalaqahId}
              onChange={(e) => setSelectedHalaqahId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">
                {selectedGuruId === 'All'
                  ? `Semua Halaqah (${halaqahs.length})`
                  : availableHalaqahs.length === 0
                  ? 'Belum Ada Halaqah Terkait (0)'
                  : `Semua Halaqah Terkait (${availableHalaqahs.length})`}
              </option>
              {availableHalaqahs.map(h => (
                <option key={h.id} value={h.id}>{h.namaHalaqah}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama santri / NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Status Quick Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-900">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mr-1">Status:</span>
          {[
            { id: 'All', label: 'Semua Status' },
            { id: 'Hadir', label: 'Pernah Hadir' },
            { id: 'Sakit', label: 'Ada Sakit' },
            { id: 'Izin', label: 'Ada Izin' },
            { id: 'Alpha', label: 'Ada Alpa' },
            { id: 'Libur', label: 'Ada Libur (L)' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedStatusFilter(p.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                selectedStatusFilter === p.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* INTERACTIVE GRAPHS SECTION (GRAFIK PER BULAN & BULANAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph 1: Tren Kehadiran Harian Bulan Ini */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Grafik Tren Kehadiran Harian ({INDONESIAN_MONTH_FULL[monthInt - 1]} {selectedYear})</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Jumlah santri yang hadir, izin/sakit, dan alpa per tanggal
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-green-500 inline-block" /> Hadir
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Sakit/Izin
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Alpa
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="dayNum" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dayData = dailyChartData.find(d => d.dayNum === Number(label));
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-bold border-b border-slate-800 pb-1">
                            {dayData?.tanggal} {selectedYear}
                          </p>
                          <p className="text-green-400">Hadir: {payload[0]?.value || 0} santri</p>
                          <p className="text-amber-400">Sakit &amp; Izin: {payload[1]?.value || 0} santri</p>
                          <p className="text-rose-400">Alpa: {payload[2]?.value || 0} santri</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Hadir" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Sakit & Izin" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Alpa" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Komparasi Tren Bulan ke Bulan (6 Bulan Terakhir) */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Komparasi Bulanan (6 Bulan)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Perkembangan persentase kehadiran santri bulan ke bulan
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Tingkat Kehadiran']}
                  labelFormatter={(lbl) => `Periode ${lbl}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="TingkatKehadiran"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* VIEW TABS: Matriks Kalender | Perlu Keterangan Guru | Rekap per Halaqah */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveViewTab('matriks')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeViewTab === 'matriks'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Matriks Kalender Absensi (1 - {daysInMonth})</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {displayedRows.length} santri
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('rekap_halaqah')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeViewTab === 'rekap_halaqah'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekapitulasi per Halaqah</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {halaqahSummaryList.length} halaqah
          </span>
        </button>
      </div>

      {/* TAB 1: MATRIKS KALENDER ABSENSI */}
      {activeViewTab === 'matriks' && (
        <div className="space-y-3">
          {/* Legend Guide */}
          <div className="flex items-center gap-2.5 flex-wrap p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mr-1">Keterangan Simbol:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 font-bold text-[11px]">
              <span className="font-mono">H</span> Hadir Setoran
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px]">
              <span className="font-mono">S</span> Sakit
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[11px]">
              <span className="font-mono">I</span> Izin
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px]">
              <span className="font-mono">A</span> Alpha
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[11px]">
              <span className="font-mono">L</span> Libur (Guru Izin/Sakit/Alpa)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[11px]">
              <span className="font-mono font-bold">-</span> Belum Dimulai / Belum Ada Kegiatan / Bukan Jadwal
            </span>
          </div>

          {/* Matrix Table */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-20 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-50 dark:bg-slate-900 z-30">No</th>
                    <th className="py-3 px-3 min-w-[150px] sticky left-10 bg-slate-50 dark:bg-slate-900 z-30">Nama Santri</th>
                    <th className="py-3 px-3 min-w-[120px]">Halaqah</th>
                    <th className="py-3 px-3 min-w-[120px]">Ustadz/ah</th>

                    {/* Day numbers 1 .. daysInMonth */}
                    {daysList.map(d => (
                      <th
                        key={d.dayNum}
                        className={`py-2 px-1 text-center w-8 font-mono ${
                          d.dayIndex === 5 ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : ''
                        }`}
                        title={`${d.dayName}, ${d.dateStr}`}
                      >
                        <span className="block">{d.dayNum}</span>
                        <span className="text-[8px] font-normal opacity-70 block">{d.dayName.slice(0, 1)}</span>
                      </th>
                    ))}

                    <th className="py-3 px-2 text-center bg-green-50/50 dark:bg-green-950/20 text-green-800 dark:text-green-300" title="Hadir Setoran / Hadir">H</th>
                    <th className="py-3 px-2 text-center bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300" title="Sakit">S</th>
                    <th className="py-3 px-2 text-center bg-purple-50/50 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300" title="Izin">I</th>
                    <th className="py-3 px-2 text-center bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300" title="Alpha">A</th>
                    <th className="py-3 px-2 text-center bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300" title="Libur (Guru Berhalangan/Izin)">L</th>
                    <th className="py-3 px-3 text-center bg-slate-100 dark:bg-slate-800 font-black">Kehadiran</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {displayedRows.map((r, idx) => (
                    <tr key={r.student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 sticky left-0 bg-white dark:bg-slate-950 z-10">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100 sticky left-10 bg-white dark:bg-slate-950 z-10">
                        <div className="truncate max-w-[160px]" title={r.student.namaLengkap}>
                          {r.student.namaLengkap}
                        </div>
                        {r.student.nis && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            NIS: {r.student.nis}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <span className="truncate max-w-[120px] block" title={r.halaqah?.namaHalaqah || r.student.halaqahNama || '-'}>
                          {r.halaqah?.namaHalaqah || r.student.halaqahNama || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="truncate max-w-[120px] block" title={r.guruNama}>
                          {r.guruNama}
                        </span>
                      </td>

                      {/* Day cells 1 .. daysInMonth */}
                      {daysList.map(d => {
                        const st = r.dailyStatuses[d.dayNum];
                        if (!st) return <td key={d.dayNum} className="text-center font-mono text-[10px] text-slate-300">-</td>;

                        return (
                          <td
                            key={d.dayNum}
                            className={`py-2 px-1 text-center font-mono text-[11px] ${
                              st.type === 'libur'
                                ? 'bg-blue-100/70 text-blue-700 font-bold dark:bg-blue-950/50 dark:text-blue-300'
                                : st.type === 'setoran'
                                ? 'bg-green-50/50 text-green-700 font-bold'
                                : st.type === 'sakit'
                                ? 'bg-amber-50/50 text-amber-700 font-bold'
                                : st.type === 'izin'
                                ? 'bg-purple-50/50 text-purple-700 font-bold'
                                : st.type === 'alpha'
                                ? 'bg-rose-100/50 text-rose-700 font-bold'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                            title={`${d.dayName}, ${d.dateStr}: ${st.label}${st.catatan ? ` - Catatan: ${st.catatan}` : ''}`}
                          >
                            {st.code}
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2.5 px-2 text-center font-bold text-green-700 dark:text-green-400 bg-green-50/30 dark:bg-green-950/10">
                        {r.totalHadirSetoran}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10">
                        {r.totalSakit}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-purple-700 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/10">
                        {r.totalIzin}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
                        {r.totalAlpa}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10" title="Total Hari Libur Guru">
                        {r.totalLibur}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                          r.attendancePercent >= 80
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                            : r.attendancePercent >= 60
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {r.attendancePercent}%
                        </span>
                      </td>
                    </tr>
                  ))}

                  {displayedRows.length === 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 10} className="py-12 text-center text-slate-400 italic">
                        Tidak ada data santri yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI PER HALAQAH */}
      {activeViewTab === 'rekap_halaqah' && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Halaqah</th>
                  <th className="py-3 px-4">Guru Pembimbing</th>
                  <th className="py-3 px-4 text-center">Jumlah Santri</th>
                  <th className="py-3 px-4 text-center">Sesi Hadir</th>
                  <th className="py-3 px-4 text-center">Sakit &amp; Izin</th>
                  <th className="py-3 px-4 text-center">Alpa</th>
                  <th className="py-3 px-4 text-center">Libur (L)</th>
                  <th className="py-3 px-4 text-center font-bold">Rata-rata Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {halaqahSummaryList.map((h, idx) => (
                  <tr key={h.halaqah.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {h.halaqah.namaHalaqah}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {h.guruNama}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200">
                      {h.studentCount} santri
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-green-600 dark:text-green-400">
                      {h.totalHadir}
                    </td>
                    <td className="py-3 px-4 text-center text-amber-600 dark:text-amber-400 font-semibold">
                      {h.totalSakit + h.totalIzin}
                    </td>
                    <td className="py-3 px-4 text-center text-rose-600 dark:text-rose-400 font-semibold">
                      {h.totalAlpa}
                    </td>
                    <td className="py-3 px-4 text-center text-blue-600 dark:text-blue-400 font-semibold">
                      {h.totalLibur}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${
                        h.attendanceRate >= 80
                          ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                          : h.attendanceRate >= 60
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {h.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: KONEKSI GOOGLE DRIVE (AUTH PROMPT)
          ==================================================== */}
      {driveAuthPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 text-left my-8">
            <div className="flex items-center space-x-3 mb-4 border-b border-slate-100 dark:border-slate-900 pb-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                <Cloud className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Koneksi Google Drive</h4>
                <p className="text-[9px] text-slate-400 font-mono">PILIHAN PENYIMPANAN LAPORAN PRESENSI</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                Akun Google Workspace Anda belum terhubung di sesi ini. Silakan hubungkan akun Google Anda untuk menyimpan file rekap presensi ke folder Google Drive secara otomatis, atau langsung unduh file ke perangkat lokal Anda.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-900 text-[11px] text-slate-500 font-mono">
                <span className="font-bold block text-slate-600 dark:text-slate-400 mb-0.5">Nama File:</span>
                <span className="truncate block text-emerald-600 dark:text-emerald-400">
                  {driveAuthPrompt.fileName}.{driveAuthPrompt.type === 'Excel' ? 'xlsx' : 'pdf'}
                </span>
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
                  if (driveAuthPrompt.type === 'Excel') {
                    handleExportExcel();
                  } else {
                    handleExportPDF();
                  }
                  setDriveAuthPrompt(null);
                }}
                className="flex items-center justify-center gap-2.5 w-full p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/80 transition duration-150 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-450" />
                Unduh File ke Perangkat Lokal
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1">
                Catatan: Jika Google menampilkan <strong>Error 403: access_denied</strong>, email Anda belum didaftarkan di <em>Test Users</em> pada Google Cloud Console. Anda dapat langsung mengunduh file secara lokal di atas.
              </p>

              <button
                type="button"
                onClick={() => setDriveAuthPrompt(null)}
                className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-widest pt-1 cursor-pointer transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: PILIH FOLDER & SIMPAN KE GOOGLE DRIVE
          ==================================================== */}
      {driveSaveItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 my-8 flex flex-col max-h-[85vh] text-left animate-fade-in">
            
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
              <div className="flex items-center space-x-2">
                <button 
                  type="button" 
                  onClick={handleReauthDrive} 
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title="Hubungkan ulang atau perbarui token akun Google Anda jika sesi kedaluwarsa"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Hubungkan Ulang</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setDriveSaveItem(null)} 
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Drive Selection Tabs (Drive Saya vs Drive Bersama) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mt-3 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchDriveTab('my_drive')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  driveLocationTab === 'my_drive'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Drive Saya</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDriveTab('shared_drives')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  driveLocationTab === 'shared_drives'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Drive Bersama</span>
                {sharedDrivesList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-full font-mono">
                    {sharedDrivesList.length}
                  </span>
                )}
              </button>
            </div>

            {/* Nama File Input */}
            <div className="mb-2 space-y-1 shrink-0">
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

            {/* Search Folder Bar */}
            <div className="relative mb-2 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={folderSearchTerm}
                onChange={(e) => handleSearchFolders(e.target.value)}
                placeholder="Cari nama folder di Google Drive..."
                className="w-full text-xs pl-8 pr-7 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400 text-left"
              />
              {folderSearchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setFolderSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Bersihkan pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Breadcrumb Path & Refresh */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl text-[11px] flex items-center justify-between border border-slate-100 dark:border-slate-900 mb-2 shrink-0">
              <div className="flex items-center flex-wrap gap-1 min-w-0">
                <span className="text-slate-400 font-bold shrink-0">Lokasi:</span>
                {folderPath.map((folder, index) => (
                  <span className="flex items-center gap-1 shrink-0" key={folder.id + '-' + index}>
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
              <button
                type="button"
                onClick={() => {
                  if (driveLocationTab === 'shared_drives' && !activeSharedDriveId) {
                    fetchSharedDrives();
                  } else {
                    fetchDriveFolders(currentFolderId, activeSharedDriveId || undefined);
                  }
                }}
                disabled={isFetchingFolders || isFetchingSharedDrives}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition shrink-0 ml-2 cursor-pointer"
                title="Segarkan daftar folder"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingFolders || isFetchingSharedDrives ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            </div>

            {/* Buat Folder Baru Widget */}
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-900/50 p-2.5 rounded-xl mb-2 shrink-0 space-y-1.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-slate-400" /> Buat Folder Baru Di Lokasi Ini
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
                  className="p-2 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold tracking-wider text-[10px] uppercase rounded-lg cursor-pointer transition shadow-xs flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  {isCreatingFolder ? 'Membuat...' : 'Buat Folder'}
                </button>
              </div>
            </div>

            {/* Folder List Scrollbox */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[170px] max-h-[240px] py-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/20 dark:bg-slate-950/20">
              
              {/* Case 1: Search Active */}
              {folderSearchTerm.trim().length >= 2 ? (
                <div className="space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 mb-1 px-1">
                    Hasil Pencarian Folder ("{folderSearchTerm}"):
                  </span>
                  {isSearchingFolders ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      <span className="text-[10px] italic font-mono">Mencari folder...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs px-2">
                      Tidak ditemukan folder dengan kata kunci "{folderSearchTerm}".
                    </div>
                  ) : (
                    searchResults.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(folder)}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{folder.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg shrink-0">
                          Pilih Folder
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : driveLocationTab === 'shared_drives' && !activeSharedDriveId ? (
                /* Case 2: Shared Drives Root List */
                <div className="space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-sky-600 mb-1 px-1">
                    Daftar Drive Bersama (Shared Drives)
                  </span>
                  {isFetchingSharedDrives ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
                      <span className="text-[10px] italic font-mono">Memuat daftar Drive Bersama...</span>
                    </div>
                  ) : sharedDrivesList.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs px-3 space-y-1">
                      <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-slate-600 dark:text-slate-400">Belum ada Drive Bersama yang terdeteksi</p>
                      <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                        Jika akun Google Workspace Anda memiliki Drive Bersama, pastikan email telah ditambahkan sebagai anggota, atau simpan dokumen melalui tab <strong>"Drive Saya"</strong>.
                      </p>
                    </div>
                  ) : (
                    sharedDrivesList.map((drive) => (
                      <button
                        key={drive.id}
                        type="button"
                        onClick={() => handleSelectSharedDrive(drive)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-100 dark:border-slate-900 hover:border-sky-300 transition flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Users className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{drive.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition" />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Case 3: Folder list inside current folder (personal or shared drive) */
                <div className="space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 px-1">
                    Folder Tersedia (Klik Untuk Masuk)
                  </span>

                  {isFetchingFolders ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2 text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      <span className="text-[10px] italic font-mono">Mengambil daftar folder Google Drive...</span>
                    </div>
                  ) : driveFolders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs px-2 flex flex-col items-center justify-center gap-1.5">
                      <FolderOpen className="w-7 h-7 text-slate-300 dark:text-slate-700 stroke-1" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Tidak ada sub-folder di tingkat ini.</span>
                      <span className="text-[10.5px] text-slate-400 max-w-xs leading-relaxed">
                        Dokumen akan langsung disimpan di folder ini (<strong>{folderPath[folderPath.length - 1]?.name}</strong>). Anda juga dapat membuat folder baru di atas.
                      </span>
                    </div>
                  ) : (
                    driveFolders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleOpenFolder(folder)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{folder.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 pt-4 border-t border-slate-150 dark:border-slate-900 flex justify-between items-center text-xs mt-3">
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
                disabled={!!uploadingToDrive || isCreatingFolder || (driveLocationTab === 'shared_drives' && !activeSharedDriveId)}
                className="p-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-wider uppercase text-[10px] rounded-xl cursor-pointer disabled:opacity-50 select-none shadow-xs flex items-center gap-1.5"
                title={driveLocationTab === 'shared_drives' && !activeSharedDriveId ? 'Silakan pilih salah satu Drive Bersama terlebih dahulu' : 'Simpan dokumen ke lokasi terpilih'}
              >
                {uploadingToDrive ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {driveLocationTab === 'shared_drives' && !activeSharedDriveId 
                        ? 'Pilih Drive Bersama Dulu' 
                        : `Simpan ke: ${folderPath[folderPath.length - 1]?.name || 'Drive Saya'}`}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
