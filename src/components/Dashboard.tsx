/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, StatusAktif, Setoran, Siswa, Guru, isPrivateSiswa, isPrivateSetoran } from '../types';
import { Avatar } from './Avatar';
import { AnnouncementBoardWidget } from './AnnouncementBoardWidget';
import { 
  Users, 
  Home, 
  BookOpen, 
  FileText, 
  Trophy, 
  TrendingUp, 
  Bell, 
  ArrowUpRight,  
  RotateCcw, 
  CheckCircle2, 
  Calendar,
  AlertTriangle,
  Award,
  BookMarked,
  Sparkles,
  ArrowRight,
  TrendingDown,
  UserCheck,
  UserX,
  Clock,
  Filter,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Building2
} from 'lucide-react';

export const Dashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { 
    currentSession, 
    admins, 
    gurus, 
    siswas, 
    halaqahs, 
    kelases, 
    setorans, 
    auditLogs 
  } = useApp();

  const user = currentSession.user;
  if (!user) return null;

  // Render components according to role
  switch (user.role) {
    case UserRole.ADMIN:
      return <AdminDashboard adminsCount={admins.length} gurus={gurus} siswas={siswas} halaqahs={halaqahs} kelases={kelases} setorans={setorans} auditLogs={auditLogs} setActiveTab={setActiveTab} />;
    case UserRole.GURU:
      return <GuruDashboard teacherId={user.id} gurus={gurus} siswas={siswas} halaqahs={halaqahs} setorans={setorans} setActiveTab={setActiveTab} />;
    case UserRole.SISWA:
      return <SiswaDashboard siswaId={user.id} siswas={siswas} halaqahs={halaqahs} setorans={setorans} setActiveTab={setActiveTab} />;
    default:
      return null;
  }
};

// ==========================================
// 1. ADMIN DASHBOARD
// ==========================================
interface AdminDashboardProps {
  adminsCount: number;
  gurus: Guru[];
  siswas: Siswa[];
  halaqahs: any[];
  kelases: any[];
  setorans: Setoran[];
  auditLogs: any[];
  setActiveTab: (tab: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  adminsCount, 
  gurus, 
  siswas, 
  halaqahs, 
  kelases, 
  setorans, 
  auditLogs,
  setActiveTab
}) => {
  // Filter foundation halaqat, students, and setorans (excluding private halaqah)
  const foundationHalaqahs = useMemo(() => halaqahs.filter(h => h.sourceType !== 'private_halaqah' && !h.namaHalaqah?.toLowerCase().includes('pribadi')), [halaqahs]);
  const foundationSiswas = useMemo(() => siswas.filter(s => !isPrivateSiswa(s, halaqahs)), [siswas, halaqahs]);
  const foundationSetorans = useMemo(() => setorans.filter(s => !isPrivateSetoran(s, halaqahs, siswas)), [setorans, halaqahs, siswas]);

  // Statistics Calculations
  const activeGurus = gurus.filter(g => g.status === StatusAktif.AKTIF).length;
  const activeSiswa = foundationSiswas.filter(s => s.status === StatusAktif.AKTIF).length;
  const activeHalaqah = foundationHalaqahs.filter(h => h.status === StatusAktif.AKTIF).length;

  // Let's count total Tilawah entries vs Tahfidz for foundation
  const totalTilawah = foundationSetorans.filter(s => s.jenisSetoran === 'Tilawah').length;
  const totalTahfidz = foundationSetorans.filter(s => s.jenisSetoran === 'Tahfidz').length;

  // Calculating top list of halaqat based on student count
  const halaqahSiswaStats = foundationHalaqahs.map(h => {
    const studentsInHalaqah = foundationSiswas.filter(s => s.halaqahId === h.id);
    const setoranCount = foundationSetorans.filter(s => s.halaqahId === h.id).length;
    return {
      nama: h.namaHalaqah,
      pembimbing: h.guruPembimbingNama,
      warna: h.warnaIdentitas,
      siswaCount: studentsInHalaqah.length,
      kapasitas: h.kapasitasPeserta,
      setorans: setoranCount
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Greeting banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all border-l-4 border-l-emerald-600">
        {/* Abstract shapes layout to look premium */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-12 translate-x-12">
          <BookOpen className="w-64 h-64 text-emerald-800 dark:text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-750 dark:text-emerald-400 mb-3 font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-550" /> KONSOL ADMINISTRATOR UTAMA
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
            Ahlan wa Sahlan, Admin!
          </h2>
          <p className="mt-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans font-normal">
            Selamat datang di portal monitoring Halaqah Al-Quran. Semua modul monitoring santri, guru pembimbing, kelas bimbingan, pencadangan sistem dapat dipantau secara langsung.
          </p>
        </div>
      </div>

      {/* Announcement Board Widget */}
      <AnnouncementBoardWidget setActiveTab={setActiveTab} />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Guru */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Guru</span>
            <div className="p-2.5 bg-emerald-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{gurus.length}</span>
            <span className="ml-2 text-xs font-semibold text-emerald-600 font-sans">{activeGurus} Aktif</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Guru pembimbing halaqah</p>
        </div>

        {/* Card 2: Siswa */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Siswa</span>
            <div className="p-2.5 bg-sky-100 dark:bg-slate-900 text-sky-600 dark:text-sky-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{siswas.length}</span>
            <span className="ml-2 text-xs font-semibold text-sky-600">{activeSiswa} Aktif</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Siswa dan santri terdaftar</p>
        </div>

        {/* Card 3: Halaqah */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Halaqah Ring</span>
            <div className="p-2.5 bg-amber-100 dark:bg-slate-900 text-amber-600 dark:text-amber-400 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{halaqahs.length}</span>
            <span className="ml-2 text-xs font-semibold text-amber-600">{activeHalaqah} Aktif</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Grup bimbingan tahfidz</p>
        </div>

        {/* Card 4: Total Setoran */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Setoran</span>
            <div className="p-2.5 bg-indigo-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{setorans.length}</span>
            <span className="ml-1 text-xs text-slate-400 font-sans">diuji</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Total riwayat mutabaah</p>
        </div>

      </div>

      {/* Main Charts & Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - Halaqah Student Statistics Progress Meter */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Sebaran Santri per Halaqah</h3>
                <p className="text-xs text-slate-400">Statistik kapasitas & rasio bimbingan</p>
              </div>
              <button 
                onClick={() => setActiveTab('kelashalaqah')}
                className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer"
              >
                Atur Halaqah <ArrowRight className="w-4.5 h-4.5 ml-1" />
              </button>
            </div>

            {/* Custom Bar Chart progress list representing and replacing recharts for absolute reliability */}
            <div className="space-y-4">
              {halaqahSiswaStats.map((h, i) => {
                const fillRatio = Math.min(100, (h.siswaCount / h.kapasitas) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: h.warna || '#10B981' }} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{h.nama}</span>
                      </div>
                      <span className="font-mono text-slate-500">{h.siswaCount} / {h.kapasitas} Santri ({fillRatio.toFixed(0)}%)</span>
                    </div>
                    {/* Progress container */}
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${fillRatio}%`,
                          backgroundColor: h.warna || '#10B981'
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pl-5">
                      <span>Wali: {h.pembimbing}</span>
                      <span>{h.setorans} Setoran Tercatat</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Ratio Pie Equivalent */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-950 flex justify-around">
            <div className="text-center">
              <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalTahfidz}</p>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide uppercase">Setoran Tahfidz</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 self-center" />
            <div className="text-center">
              <p className="font-mono text-xl font-bold text-sky-600 dark:text-sky-400">{totalTilawah}</p>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide uppercase">Setoran Tilawah</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 self-center" />
            <div className="text-center">
              <p className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">{(activeSiswa/Math.max(1, gurus.length)).toFixed(1)}</p>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide uppercase">Rasio Santri/Guru</p>
            </div>
          </div>

        </div>

        {/* Right column - Recent Audit Logs */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Aktivitas & Log Sistem</h3>
              <p className="text-xs text-slate-400">Timestamps audit log real-time</p>
            </div>
            <span className="p-1.5 bg-slate-100 dark:bg-slate-900 text-slate-600 rounded-lg text-xs font-bold font-mono">
              REALTIME
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[310px] pr-1">
            {auditLogs.slice(0, 6).map((log, index) => (
              <div key={log.id || index} className="flex space-x-3 text-xs border-b border-slate-50 dark:border-slate-950 pb-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm mt-1" />
                  {index !== 5 && <span className="w-0.5 h-8 bg-slate-200 dark:bg-slate-800 mt-2" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 dark:text-slate-200 font-semibold leading-snug">
                    {log.action}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5 whitespace-normal leading-relaxed">
                    {log.rincian}
                  </p>
                  <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-400">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{log.actorNama} ({log.actorRole})</span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                Log aktivitas kosong.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Real-Time HR/SDM Attendance Report Widget */}
      <AdminAttendanceWidget 
        gurus={gurus} 
        siswas={siswas} 
        halaqahs={halaqahs} 
        setorans={setorans} 
        setActiveTab={setActiveTab} 
      />

    </div>
  );
};

// ==========================================
// REAL-TIME SDM ATTENDANCE SUMMARY WIDGET
// ==========================================
interface AdminAttendanceWidgetProps {
  gurus: Guru[];
  siswas: Siswa[];
  halaqahs: any[];
  setorans: Setoran[];
  setActiveTab: (tab: string) => void;
}

const AdminAttendanceWidget: React.FC<AdminAttendanceWidgetProps> = ({
  gurus,
  siswas,
  halaqahs,
  setorans,
  setActiveTab
}) => {
  const { guruAttendance, studentAttendance, guruSchedules } = useApp();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeSubTab, setActiveSubTab] = useState<'guru' | 'siswa'>('guru');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [halaqahFilter, setHalaqahFilter] = useState<string>('All');

  const activeGurus = gurus.filter(g => g.status === StatusAktif.AKTIF);
  const activeSiswas = siswas.filter(s => s.status === StatusAktif.AKTIF);

  // Helper for Indonesian Day Name
  const getIndonesianDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[d.getDay()] || 'Senin';
  };
  const currentDayName = getIndonesianDay(selectedDate);

  // 1. Compute Guru Attendance List
  const guruAttendanceList = activeGurus.map(guru => {
    // Check manual override in guruAttendance
    const manualRec = (guruAttendance || []).find(
      (a: any) => a.guruId === guru.id && a.tanggal === selectedDate
    );

    // Count setorans guided on selectedDate
    const guruSetorans = setorans.filter(
      s => s.guruId === guru.id && s.tanggalSetoran === selectedDate
    );

    // Find halaqah
    const halaqah = halaqahs.find(h => h.guruPembimbingId === guru.id);

    // Check if scheduled
    const isScheduled = (guruSchedules || []).some(
      (sch: any) => sch.guruId === guru.id && sch.hari === currentDayName && sch.status === StatusAktif.AKTIF
    );

    let status = 'Belum Presensi';
    let statusCategory: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Off' = 'Alpha';
    let source = '';
    let catatan = '';

    if (manualRec) {
      status = manualRec.status;
      catatan = manualRec.catatan || '';
      source = `Diinput ${manualRec.updatedByAdminNama || 'Admin'}`;
      if (status === 'Hadir') statusCategory = 'Hadir';
      else if (status === 'Sakit') statusCategory = 'Sakit';
      else if (status === 'Izin') statusCategory = 'Izin';
      else statusCategory = 'Alpha';
    } else if (guruSetorans.length > 0) {
      status = 'Hadir';
      statusCategory = 'Hadir';
      source = 'Otomatis (Setoran)';
    } else if (isScheduled) {
      status = 'Tanpa Keterangan';
      statusCategory = 'Alpha';
      source = 'Terjadwal Belum Ada Input';
    } else {
      status = 'Tidak Ada Jadwal';
      statusCategory = 'Off';
      source = 'Luar Jadwal';
    }

    return {
      guru,
      halaqahNama: halaqah ? halaqah.namaHalaqah : (guru.halaqahBimbinganNama || 'Tidak Terikat'),
      setoranCount: guruSetorans.length,
      status,
      statusCategory,
      source,
      catatan,
      isScheduled
    };
  });

  // Filtered Guru List
  const filteredGuruData = guruAttendanceList.filter(item => {
    const matchesSearch = item.guru.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.guru.jabatan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.halaqahNama.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'All') {
      if (statusFilter === 'Hadir' && item.statusCategory !== 'Hadir') return false;
      if (statusFilter === 'SakitIzin' && item.statusCategory !== 'Sakit' && item.statusCategory !== 'Izin') return false;
      if (statusFilter === 'Alpha' && item.statusCategory !== 'Alpha') return false;
    }
    return true;
  });

  // Guru Stats
  const totalGuruCount = activeGurus.length;
  const guruHadirCount = guruAttendanceList.filter(i => i.statusCategory === 'Hadir').length;
  const guruSakitIzinCount = guruAttendanceList.filter(i => i.statusCategory === 'Sakit' || i.statusCategory === 'Izin').length;
  const guruAlphaCount = guruAttendanceList.filter(i => i.statusCategory === 'Alpha').length;
  const guruAttendanceRate = totalGuruCount > 0 ? ((guruHadirCount / totalGuruCount) * 100).toFixed(0) : '0';

  // 2. Compute Siswa Attendance List
  const siswaAttendanceList = activeSiswas.map(siswa => {
    const manualRec = (studentAttendance || []).find(
      (a: any) => a.siswaId === siswa.id && a.tanggal === selectedDate
    );

    const siswaSetorans = setorans.filter(
      s => s.siswaId === siswa.id && s.tanggalSetoran === selectedDate
    );

    const halaqah = halaqahs.find(h => h.id === siswa.halaqahId);

    let status = 'Belum Presensi';
    let statusCategory: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' = 'Alpha';
    let catatan = '';

    if (manualRec) {
      status = manualRec.status;
      catatan = manualRec.catatan || '';
      if (status === 'Hadir') statusCategory = 'Hadir';
      else if (status === 'Sakit') statusCategory = 'Sakit';
      else if (status === 'Izin') statusCategory = 'Izin';
      else statusCategory = 'Alpha';
    } else if (siswaSetorans.length > 0) {
      status = 'Hadir';
      statusCategory = 'Hadir';
    } else {
      status = 'Belum Presensi';
      statusCategory = 'Alpha';
    }

    const lastSetoran = siswaSetorans[0];

    return {
      siswa,
      halaqahNama: halaqah ? halaqah.namaHalaqah : (siswa.halaqahNama || '-'),
      pembimbingNama: halaqah ? halaqah.guruPembimbingNama : '-',
      setoranCount: siswaSetorans.length,
      lastSetoranText: lastSetoran ? `${lastSetoran.modulNama} (${lastSetoran.jenisSetoran || 'Mutabaah'})` : 'Belum Ada',
      status,
      statusCategory,
      catatan
    };
  });

  // Filtered Siswa List
  const filteredSiswaData = siswaAttendanceList.filter(item => {
    const matchesSearch = item.siswa.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.siswa.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.halaqahNama.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (halaqahFilter !== 'All' && item.siswa.halaqahId !== halaqahFilter) return false;
    if (statusFilter !== 'All') {
      if (statusFilter === 'Hadir' && item.statusCategory !== 'Hadir') return false;
      if (statusFilter === 'SakitIzin' && item.statusCategory !== 'Sakit' && item.statusCategory !== 'Izin') return false;
      if (statusFilter === 'Alpha' && item.statusCategory !== 'Alpha') return false;
    }
    return true;
  });

  // Siswa Stats
  const totalSiswaCount = activeSiswas.length;
  const siswaHadirCount = siswaAttendanceList.filter(i => i.statusCategory === 'Hadir').length;
  const siswaSakitIzinCount = siswaAttendanceList.filter(i => i.statusCategory === 'Sakit' || i.statusCategory === 'Izin').length;
  const siswaAlphaCount = siswaAttendanceList.filter(i => i.statusCategory === 'Alpha').length;
  const siswaAttendanceRate = totalSiswaCount > 0 ? ((siswaHadirCount / totalSiswaCount) * 100).toFixed(0) : '0';

  // Export CSV Handler
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeSubTab === 'guru') {
      csvContent += "Nama Guru,Jabatan,Halaqah Asuhan,Tanggal,Status Kehadiran,Jumlah Setoran Dibimbing,Catatan Keterangan\n";
      filteredGuruData.forEach(item => {
        csvContent += `"${item.guru.namaLengkap}","${item.guru.jabatan || 'Guru'}","${item.halaqahNama}","${selectedDate}","${item.status}","${item.setoranCount}","${item.catatan}"\n`;
      });
    } else {
      csvContent += "Nama Siswa,NIS,Halaqah,Wali Pembimbing,Tanggal,Status Kehadiran,Status Setoran,Catatan Keterangan\n";
      filteredSiswaData.forEach(item => {
        csvContent += `"${item.siswa.namaLengkap}","${item.siswa.nis}","${item.halaqahNama}","${item.pembimbingNama}","${selectedDate}","${item.status}","${item.lastSetoranText}","${item.catatan}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekapitulasi_Presensi_${activeSubTab.toUpperCase()}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Widget Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base md:text-lg flex items-center gap-2">
                Rekapitulasi Kehadiran Real-Time SDM & Santri
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                  🔴 LIVE MONITORING
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Laporan kedisiplinan presensi harian Divisi SDM untuk Guru Pembimbing dan Santri Halaqah
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Date Picker & Export Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${selectedDate === todayStr ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setSelectedDate(yesterday.toISOString().slice(0, 10));
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${selectedDate !== todayStr ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Kemarin
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 font-bold cursor-pointer pr-2"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition active:scale-95 cursor-pointer"
            title="Unduh Laporan Format CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Tingkat Kehadiran {activeSubTab === 'guru' ? 'Guru' : 'Siswa'}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
              {activeSubTab === 'guru' ? `${guruAttendanceRate}%` : `${siswaAttendanceRate}%`}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
              ({activeSubTab === 'guru' ? `${guruHadirCount}/${totalGuruCount}` : `${siswaHadirCount}/${totalSiswaCount}`} Hadir)
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
            Sakit & Izin
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-200 font-mono">
              {activeSubTab === 'guru' ? guruSakitIzinCount : siswaSakitIzinCount}
            </span>
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Orang</span>
          </div>
        </div>

        <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
            Alpha / Belum Presensi
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-rose-900 dark:text-rose-200 font-mono">
              {activeSubTab === 'guru' ? guruAlphaCount : siswaAlphaCount}
            </span>
            <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">Perlu Tindak Lanjut</span>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            Status Kedisiplinan SDM
          </span>
          <div className="mt-1">
            {Number(activeSubTab === 'guru' ? guruAttendanceRate : siswaAttendanceRate) >= 85 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                ✨ Sangat Baik
              </span>
            ) : Number(activeSubTab === 'guru' ? guruAttendanceRate : siswaAttendanceRate) >= 70 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                ⚠️ Perlu Perhatian
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                🚨 Rendah / Evaluasi
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Search Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
        {/* Toggle Guru vs Siswa */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('guru')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'guru'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Guru SDM ({totalGuruCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('siswa')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'siswa'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Santri / Siswa ({totalSiswaCount})
          </button>
        </div>

        {/* Filter dropdowns & Search */}
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
          {activeSubTab === 'siswa' && (
            <select
              value={halaqahFilter}
              onChange={(e) => setHalaqahFilter(e.target.value)}
              className="text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">Semua Halaqah</option>
              {halaqahs.map(h => (
                <option key={h.id} value={h.id}>{h.namaHalaqah}</option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">Semua Status Kehadiran</option>
            <option value="Hadir">Hadir</option>
            <option value="SakitIzin">Sakit / Izin</option>
            <option value="Alpha">Alpha / Belum Presensi</option>
          </select>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Concise Summary Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
        {activeSubTab === 'guru' ? (
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-2.5 px-3">Guru & Staff SDM</th>
                <th className="py-2.5 px-3">Halaqah Asuhan</th>
                <th className="py-2.5 px-3">Status Kehadiran Hari Ini</th>
                <th className="py-2.5 px-3">Aktivitas Bimbingan</th>
                <th className="py-2.5 px-3">Catatan / Keterangan SDM</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900 text-xs">
              {filteredGuruData.map((item) => (
                <tr key={item.guru.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar namaLengkap={item.guru.namaLengkap} fotoProfil={item.guru.fotoProfil} className="w-7 h-7 text-[10px] font-bold shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.guru.namaLengkap}</p>
                        <p className="text-[10px] text-slate-400">{item.guru.jabatan || 'Guru Pembimbing'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                      {item.halaqahNama}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {item.statusCategory === 'Hadir' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        {item.status}
                      </span>
                    ) : item.statusCategory === 'Sakit' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Sakit
                      </span>
                    ) : item.statusCategory === 'Izin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Clock className="w-3 h-3 text-blue-600" />
                        Izin
                      </span>
                    ) : item.statusCategory === 'Off' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800">
                        Off / Tidak Ada Jadwal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        {item.status}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{item.source}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.setoranCount} Setoran
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {item.setoranCount > 0 ? 'Aktif membimbing hari ini' : 'Belum menginput setoran'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {item.catatan ? (
                      <span className="italic text-[11px]">"{item.catatan}"</span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveTab('setorans')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Kelola Presensi SDM
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGuruData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic text-xs">
                    Tidak ditemukan data guru sesuai filter/pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-2.5 px-3">Nama Santri & NIS</th>
                <th className="py-2.5 px-3">Halaqah & Ustadz Pembimbing</th>
                <th className="py-2.5 px-3">Status Kehadiran</th>
                <th className="py-2.5 px-3">Setoran Hari Ini</th>
                <th className="py-2.5 px-3">Catatan / Keterangan Absensi</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900 text-xs">
              {filteredSiswaData.map((item) => (
                <tr key={item.siswa.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar namaLengkap={item.siswa.namaLengkap} fotoProfil={item.siswa.fotoProfil} className="w-7 h-7 text-[10px] font-bold shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.siswa.namaLengkap}</p>
                        <p className="text-[10px] text-slate-400 font-mono">NIS: {item.siswa.nis} | {item.siswa.kelasNama}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      {item.halaqahNama}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Ustadz: {item.pembimbingNama}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {item.statusCategory === 'Hadir' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Hadir
                      </span>
                    ) : item.statusCategory === 'Sakit' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Sakit
                      </span>
                    ) : item.statusCategory === 'Izin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Clock className="w-3 h-3 text-blue-600" />
                        Izin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      {item.lastSetoranText}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {item.setoranCount} kali setor hari ini
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {item.catatan ? (
                      <span className="italic text-[11px]">"{item.catatan}"</span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {item.siswa.nomorHpOrangTua ? (
                      <a
                        href={`https://wa.me/${item.siswa.nomorHpOrangTua}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800"
                      >
                        Hubungi Ortu <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab('siswas')}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition cursor-pointer"
                      >
                        Detail
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSiswaData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic text-xs">
                    Tidak ditemukan data santri sesuai filter/pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. GURU / TEACHER DASHBOARD
// ==========================================
interface GuruDashboardProps {
  teacherId: string;
  gurus: Guru[];
  siswas: Siswa[];
  halaqahs: any[];
  setorans: Setoran[];
  setActiveTab: (tab: string) => void;
}

const GuruDashboard: React.FC<GuruDashboardProps> = ({
  teacherId,
  gurus,
  siswas,
  halaqahs,
  setorans,
  setActiveTab
}) => {
  // Find current teacher details
  const myGuruObj = gurus.find(g => g.id === teacherId);
  const myHalaqah = halaqahs.find(h => h.guruPembimbingId === teacherId);

  // List of students that are in this teacher's halaqah
  const myStudents = myHalaqah 
    ? siswas.filter(s => s.halaqahId === myHalaqah.id && s.status === StatusAktif.AKTIF) 
    : [];

  const myStudentsIds = myStudents.map(s => s.id);

  // Setoran entered by this advisor today
  const todayStr = new Date().toISOString().split('T')[0];
  const totalSetoranToday = setorans.filter(s => s.guruId === teacherId && s.tanggalSetoran === todayStr).length;

  // Let's check which student hasn't checked in with a setoran in the last 3 days
  const activeSiswaNeedSetoran = myStudents.filter(s => {
    const studentSetorans = setorans.filter(set => set.siswaId === s.id);
    if (studentSetorans.length === 0) return true;
    
    // Sort descending by date
    const lastSetoran = studentSetorans[0];
    const msDiff = Date.now() - new Date(lastSetoran.tanggalSetoran).getTime();
    const daysDiff = msDiff / (1000 * 60 * 60 * 24);
    return daysDiff > 3; // Trigger warning tag if > 3 days of absence
  });

  return (
    <div className="space-y-6">
      
      {/* Greeting banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all border-l-4 border-l-emerald-600">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-6 translate-x-12">
          <Sparkles className="w-64 h-64 text-emerald-500" />
        </div>
        <div className="relative z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-750 dark:text-emerald-400 mb-3 font-mono tracking-widest uppercase">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-650" /> MAJELIS BIMBINGAN HALAQAH
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
            Ahlan wa Sahlan, {myGuruObj ? myGuruObj.namaLengkap : 'Ustadz'}
          </h2>
          <div className="mt-1.5 inline-block">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-450 font-bold font-mono uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">
              Halaqah Bimbingan: <span className="font-extrabold text-emerald-800 dark:text-emerald-350">{myHalaqah ? myHalaqah.namaHalaqah : 'Tidak Terikat'}</span>
            </p>
          </div>
          <p className="mt-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-normal leading-relaxed">
            Gunakan konsol ini untuk memantau kemajuan hafalan Al-Quran santri asuhan Anda serta mencatat perkembangan mutabaah tilawah/tahfidz mutakhir mereka secara langsung.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Stat 1 */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Siswa Asuhan</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block mt-2">{myStudents.length}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Santri aktif dalam halaqah bimbingan</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Setoran Hari Ini</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block mt-2">{totalSetoranToday}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Setoran mutabaah dicatat hari ini</span>
          </div>
          <div className="p-3 bg-sky-50 dark:bg-slate-900 text-sky-600 dark:text-sky-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Belum Setor (&gt;3 Hari)</span>
            <span className={`text-3xl font-extrabold tracking-tight block mt-2 ${activeSiswaNeedSetoran.length > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
              {activeSiswaNeedSetoran.length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Santri memerlukan follow-up segera</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-slate-900 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
        </div>

      </div>

      {/* Student List Grid and Action triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - list of teacher's students with setoran alerts */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Progress Siswa Halaqah</h3>
              <p className="text-xs text-slate-400">Status mutakhir & catatan harian santri bimbingan Anda</p>
            </div>
            <button
              onClick={() => setActiveTab('setorans')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            >
              + Input Setoran Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-900 text-left">
              <thead>
                <tr className="text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                  <th className="pb-3 text-left">Nama Lengkap</th>
                  <th className="pb-3 text-left">NIS</th>
                  <th className="pb-3 text-left">Kelas</th>
                  <th className="pb-3 text-left">Terakhir Setor</th>
                  <th className="pb-3长 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-900 text-xs">
                {myStudents.map((siswa, idx) => {
                  const sSetorans = setorans.filter(s => s.siswaId === siswa.id);
                  const lastEntry = sSetorans[0];
                  const needsCalling = activeSiswaNeedSetoran.some(ns => ns.id === siswa.id);

                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 flex items-center space-x-3">
                        <Avatar 
                          namaLengkap={siswa.namaLengkap}
                          fotoProfil={siswa.fotoProfil}
                          className="w-8 h-8 text-[10px] font-bold"
                        />
                        <div>
                          <p className="font-semibold text-slate-850 dark:text-slate-200">{siswa.namaLengkap}</p>
                          <p className="text-[10px] text-slate-400 font-mono uppercase">{siswa.jenisKelamin}</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-mono font-medium">{siswa.nis}</td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-semibold">{siswa.kelasNama}</td>
                      <td className="py-3.5">
                        {lastEntry ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-350 block">
                              {lastEntry.modulNama} {lastEntry.suratNama ? `(${lastEntry.suratNama}: ${lastEntry.ayatAwal}-${lastEntry.ayatAkhir})` : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(lastEntry.tanggalSetoran).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-350 italic text-[11px]">Belum pernah menyetor</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        {needsCalling ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200">
                            Terlambat Setor
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200">
                            Sesuai Target
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {myStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                      Tidak ada siswa dalam bimbingan halaqah Anda saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column - Quick notifications reminders */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-4">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Tindak Lanjut & Notif</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Daftar siswa yang tidak menyetor hafalan baru atau tilawah dalam 3 hari terakhir. Harap segera hubungi wali murid / santri.
            </p>

            <div className="space-y-3.5">
              {activeSiswaNeedSetoran.map((siswa, idx) => {
                const phone = siswa.nomorHpOrangTua || '08';
                return (
                  <div key={siswa.id} className="p-3 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/60 rounded-xl flex items-start space-x-3">
                    <Avatar 
                      namaLengkap={siswa.namaLengkap}
                      fotoProfil={siswa.fotoProfil}
                      className="w-8 h-8 text-[10px] font-bold mt-0.5"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-205">{siswa.namaLengkap}</p>
                      <p className="text-slate-500 font-medium text-[11px] mt-0.5">NIS: {siswa.nis} | {siswa.kelasNama}</p>
                      {/* Interactive simulated whatsapp launcher to keep user actions rich */}
                      <a 
                        href={`https://wa.me/${phone}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-450 hover:underline"
                      >
                        Hubungi Orang Tua ({phone}) <ArrowUpRight className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
              {activeSiswaNeedSetoran.length === 0 && (
                <div className="text-center py-10 bg-emerald-50/20 text-emerald-800 rounded-xl border border-dashed border-emerald-200 p-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold">Luar biasa!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Seluruh santri bimbingan Anda telah menyetor sesuai target pekanan.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};


// ==========================================
// 3. SISWA / STUDENT DASHBOARD
// ==========================================
interface SiswaDashboardProps {
  siswaId: string;
  siswas: Siswa[];
  halaqahs: any[];
  setorans: Setoran[];
  setActiveTab: (tab: string) => void;
}

const SiswaDashboard: React.FC<SiswaDashboardProps> = ({
  siswaId,
  siswas,
  halaqahs,
  setorans,
  setActiveTab
}) => {
  const mySiswaObj = siswas.find(s => s.id === siswaId);
  const myHalaqah = mySiswaObj ? halaqahs.find(h => h.id === mySiswaObj.halaqahId) : null;

  // Filter setoran for this student
  const mySetorans = setorans.filter(s => s.siswaId === siswaId);
  const totalSetoran = mySetorans.length;

  // Last setoran log
  const lastSetoran = mySetorans[0];

  // Calculate Average Evaluation Grade / Rank representation
  // Let's count how many marked "Mumtaz" or "Lulus"
  const passedSetorans = mySetorans.filter(s => s.statusLulus).length;
  const progressRatio = totalSetoran > 0 ? (passedSetorans / totalSetoran) * 100 : 0;

  // Render a beautiful SVG progression chart tracker representing grades over days
  // Let's map grades to Y-values: A+ (Mumtaz) => 4, B+ => 3, B => 2, C => 1
  const chartData = mySetorans.slice(0, 5).reverse().map((s, index) => {
    let scalar = 2;
    if (s.nilai.includes('Mumtaz') || s.nilai.includes('A')) scalar = 4;
    else if (s.nilai.includes('Jayyid Jiddan') || s.nilai.includes('B+')) scalar = 3;
    else if (s.nilai.includes('Jayyid') || s.nilai.includes('B')) scalar = 2.5;

    return {
      label: s.modulNama,
      val: scalar,
      date: s.tanggalSetoran
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Greeting Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all border-l-4 border-l-emerald-600">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-12 translate-x-12">
          <Trophy className="w-64 h-64 text-emerald-600" />
        </div>
        <div className="relative z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-750 dark:text-emerald-400 mb-3 font-mono tracking-widest uppercase">
            <Trophy className="w-3.5 h-3.5 mr-1 text-amber-550" /> BISMILLAH, MARI SEMANGAT MENGHAFAL!
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
            Ahlan wa Sahlan, {mySiswaObj ? mySiswaObj.namaLengkap : 'Sahabat Santri'}!
          </h2>
          <div className="mt-1.5 inline-block">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-450 font-bold font-mono uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">
              NIS: <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono text-xs">{mySiswaObj ? mySiswaObj.nis : '-'}</span> | Kelas: <span className="font-extrabold text-emerald-850 dark:text-white">{mySiswaObj ? mySiswaObj.kelasNama : '-'}</span>
            </p>
          </div>
          <p className="mt-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-normal leading-relaxed">
            Terus pertahankan setoran terbaikmu! Pantau perkembangan capaian hafalan Quran, bimbingan Tahsin, evaluasi dari Ustadz pembina beserta target hafalanmu di bawah ini.
          </p>
        </div>
      </div>

      {/* Stats KPI Block */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total setor */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Setoran</span>
            <div className="p-2 bg-emerald-100 dark:bg-slate-900 text-emerald-600 rounded-lg">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalSetoran}</p>
          <p className="text-[11px] text-slate-400 mt-1">Kali menyetor hafalan</p>
        </div>

        {/* Stat 2: Passed ratio */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rasio Lulus</span>
            <div className="p-2 bg-indigo-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{progressRatio.toFixed(0)}%</p>
          <p className="text-[11px] text-slate-400 mt-1">{passedSetorans} Setoran dinyatakan Lulus</p>
        </div>

        {/* Stat 3: Halaqah */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Halaqah</span>
            <div className="p-2 bg-amber-100 dark:bg-slate-900 text-amber-600 rounded-lg">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
            {myHalaqah ? myHalaqah.namaHalaqah : 'Mengambang'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Ustadz: {myHalaqah ? myHalaqah.guruPembimbingNama : '-'}</p>
        </div>

        {/* Stat 4: Last Status */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nilai Terakhir</span>
            <div className="p-2 bg-sky-100 dark:bg-slate-900 text-sky-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-slate-800 dark:text-white truncate">
            {lastSetoran ? lastSetoran.nilai : 'Belum Ada'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{lastSetoran ? `Surat: ${lastSetoran.modulNama}` : 'Belum mulai setoran'}</p>
        </div>

      </div>

      {/* Left panel & right panel split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - Development Trend Charts and comments */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Grafik Nilai Perkembangan Hafalan</h3>
                <p className="text-xs text-slate-400">Peringkat evaluasi setoran terakhir (Mumtaz, Jayyid, Maqbul)</p>
              </div>
            </div>

            {/* Custom Interactive Line chart mock rendering with SVG */}
            {chartData.length > 1 ? (
              <div className="mt-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <div className="relative h-44 w-full">
                  {/* Axis indicators */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono">
                    <span>A+ (Mumtaz)</span>
                    <span>B+ (Baik)</span>
                    <span>B (Cukup)</span>
                  </div>
                  {/* Grid Lines */}
                  <div className="absolute left-16 right-0 top-0 bottom-0 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
                    <div className="border-b border-dashed border-slate-200 dark:border-slate-800/60 w-full" />
                    <div className="border-b border-dashed border-slate-200 dark:border-slate-800/60 w-full" />
                    <div className="border-b border-slate-200 dark:border-slate-800/60 w-full" />
                  </div>
                  
                  {/* Plot SVG path */}
                  <svg className="absolute left-16 right-0 top-0 bottom-0 h-40 w-[80%] md:w-[90%]" viewBox="0 0 400 100">
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      points={chartData.map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 360 + 20;
                        // Y scaler invert. range val is 2 to 4. Height is 100 max.
                        const y = 100 - ((d.val - 1.5) / 2.5) * 80;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* Circle dots */}
                    {chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 360 + 20;
                      const y = 100 - ((d.val - 1.5) / 2.5) * 80;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill="#34D399" stroke="#047857" strokeWidth="1.5" />
                          <text x={x} y={y - 10} fontSize="8" fill="#10B981" fontWeight="bold" textAnchor="middle">
                            {d.val >= 4 ? 'Mumtaz' : d.val >= 3 ? 'Jayyid' : 'Suka'}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                {/* Chart labels bottom */}
                <div className="flex justify-between text-[10px] text-slate-400 mt-4 pl-16">
                  {chartData.map((d, i) => (
                    <span key={i} className="truncate max-w-[60px]">{d.label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 bg-slate-50 dark:bg-slate-900 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                Data bimbingan belum mencukupi untuk membuat grafik pertumbuhan (minimal butuh 2 setoran lulus).
              </div>
            )}
          </div>

          {/* Core Target Info */}
          <div className="p-4 bg-emerald-50/50 dark:bg-slate-900 rounded-xl mt-6">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5" /> TARGET BULAN INI
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Mampu menyelesaikan setoran hafalan barumu (Sura An-Nas, Al-Falaq, Al-Ikhlas) dengan lancar di depan Ustadz pembina & memperoleh kelulusan dengan status minimal Jayyid Jiddan.
            </p>
          </div>

        </div>

        {/* Right column - Timelines of previous setoran comments */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Riwayat & Catatan Ustadz</h3>
              <p className="text-xs text-slate-400">Komentar mutabaah lengkap</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-350 rounded-full font-mono">
              MUTABAAH
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[340px] pr-1">
            {mySetorans.map((setoran, index) => (
              <div key={setoran.id || index} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-205">{setoran.modulNama}</span>
                  <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${setoran.statusLulus ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'}`}>
                    {setoran.statusLulus ? 'Lulus' : 'Remedi'}
                  </span>
                </div>
                {setoran.suratNama && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    {setoran.jenisSetoran} | Ayat {setoran.ayatAwal} s/d {setoran.ayatAkhir}
                  </p>
                )}
                <div className="p-2 bg-white dark:bg-slate-950 rounded-lg text-slate-600 dark:text-slate-400 text-xs italic border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                  "{setoran.catatanGuru}"
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Nama Guru: {setoran.guruNama}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-450">{setoran.nilai}</span>
                </div>
              </div>
            ))}
            {mySetorans.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400">
                Belum ada catatan setoran bimbingan terekam. Silakan datang ke halaqah asuhan untuk mulai menguji hafalan.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
