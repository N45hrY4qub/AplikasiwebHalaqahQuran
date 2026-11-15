import React, { useState, useMemo } from 'react';
import {
  Search,
  Table,
  LayoutGrid,
  Eye,
  MessageSquare,
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  Sparkles,
  MapPin,
  UserCheck,
  UserX,
  ChevronRight,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';
import { Siswa, Halaqah, StatusAktif, JenisKelamin } from '../types';

export interface GuruSiswaHalaqahProps {
  myHalaqah?: Halaqah | null;
  myStudents?: Siswa[];
  myStudentsAll?: Siswa[];
  myUser?: any;
  myGuruObj?: any;
  formatIndonesianDate?: (d: string) => string;
  addLog?: (action: string, details: string) => void;
  setActiveTab?: (tab: string) => void;
  studentProgressMetrics?: Array<{ siswa: Siswa; percent: number; [key: string]: any }>;
  setSelectedSiswaProfile?: (siswa: Siswa | null) => void;
}

export const GuruSiswaHalaqah: React.FC<GuruSiswaHalaqahProps> = ({
  myHalaqah,
  myStudents = [],
  myStudentsAll,
  myUser,
  myGuruObj,
  formatIndonesianDate,
  addLog,
  setActiveTab,
  studentProgressMetrics = [],
  setSelectedSiswaProfile: externalSetSelectedProfile
}) => {
  const { siswas, setorans } = useApp();

  // Determine list of halaqah students
  const baseStudents = useMemo(() => {
    if (myStudentsAll && myStudentsAll.length > 0) return myStudentsAll;
    if (myHalaqah) {
      return siswas.filter(s => s.halaqahId === myHalaqah.id);
    }
    return myStudents;
  }, [myStudentsAll, myHalaqah, siswas, myStudents]);

  // View state & filters
  const [siswaViewMode, setSiswaViewMode] = useState<'table' | 'grid'>('table');
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaClassFilter, setSiswaClassFilter] = useState('All');
  const [siswaGenderFilter, setSiswaGenderFilter] = useState<'All' | JenisKelamin>('All');
  const [siswaStatusFilter, setSiswaStatusFilter] = useState<'All' | StatusAktif>('All');
  const [siswaAchievementFilter, setSiswaAchievementFilter] = useState<'All' | 'tinggi' | 'rendah'>('All');
  
  // Local active student modal
  const [selectedProfile, setSelectedProfile] = useState<Siswa | null>(null);

  // Helper date formatter fallback
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    if (formatIndonesianDate) return formatIndonesianDate(dateStr);
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Student progress percentage finder
  const getProgress = (siswaId: string): number => {
    const metric = studentProgressMetrics.find(m => m.siswa?.id === siswaId);
    if (metric && typeof metric.percent === 'number') return metric.percent;
    // Fallback: estimate based on lulus count
    const studentSetoranLulus = setorans.filter(s => s.siswaId === siswaId && s.statusLulus).length;
    return Math.min(100, studentSetoranLulus * 5 || 15);
  };

  // Distinct class list for filter dropdown
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    const options: Array<{ id: string; nama: string }> = [];
    baseStudents.forEach(s => {
      const id = s.kelasId || s.kelasNama || '';
      const nama = s.kelasNama || s.jenjangNama || '-';
      if (id && !set.has(id)) {
        set.add(id);
        options.push({ id, nama });
      }
    });
    return options;
  }, [baseStudents]);

  // Filtered student list
  const filteredHalaqahSiswa = useMemo(() => {
    return baseStudents.filter(siswa => {
      // Search by name or NIS
      if (siswaSearch.trim()) {
        const query = siswaSearch.toLowerCase().trim();
        const matchName = (siswa.namaLengkap || '').toLowerCase().includes(query);
        const matchNis = (siswa.nis || '').toLowerCase().includes(query);
        if (!matchName && !matchNis) return false;
      }

      // Filter by Class
      if (siswaClassFilter !== 'All') {
        const currentClassId = siswa.kelasId || siswa.kelasNama || '';
        if (currentClassId !== siswaClassFilter) return false;
      }

      // Filter by Gender
      if (siswaGenderFilter !== 'All') {
        if (siswa.jenisKelamin !== siswaGenderFilter) return false;
      }

      // Filter by Status
      if (siswaStatusFilter !== 'All') {
        if (siswa.status !== siswaStatusFilter) return false;
      }

      // Filter by Progress
      if (siswaAchievementFilter !== 'All') {
        const prog = getProgress(siswa.id);
        if (siswaAchievementFilter === 'tinggi' && prog < 60) return false;
        if (siswaAchievementFilter === 'rendah' && prog >= 60) return false;
      }

      return true;
    });
  }, [
    baseStudents,
    siswaSearch,
    siswaClassFilter,
    siswaGenderFilter,
    siswaStatusFilter,
    siswaAchievementFilter,
    studentProgressMetrics,
    setorans
  ]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = baseStudents.length;
    const active = baseStudents.filter(s => s.status === StatusAktif.AKTIF).length;
    const ikhwan = baseStudents.filter(s => s.jenisKelamin === JenisKelamin.LAKI_LAKI).length;
    const akhwat = baseStudents.filter(s => s.jenisKelamin === JenisKelamin.PEREMPUAN).length;
    
    let totalProgress = 0;
    baseStudents.forEach(s => {
      totalProgress += getProgress(s.id);
    });
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    const needAttention = baseStudents.filter(s => getProgress(s.id) < 60).length;

    return { total, active, ikhwan, akhwat, avgProgress, needAttention };
  }, [baseStudents, studentProgressMetrics, setorans]);

  // Open profile modal
  const handleOpenProfile = (siswa: Siswa) => {
    setSelectedProfile(siswa);
    if (externalSetSelectedProfile) {
      externalSetSelectedProfile(siswa);
    }
  };

  // EXPORT: Excel (.xlsx)
  const handleExportExcel = () => {
    const halaqahName = myHalaqah?.namaHalaqah || 'Semua_Halaqah';
    const rows = filteredHalaqahSiswa.map((siswa, idx) => ({
      'No': idx + 1,
      'Nama Santri': siswa.namaLengkap,
      'NIS': siswa.nis,
      'Kelas': siswa.kelasNama || siswa.jenjangNama || '-',
      'Jenis Kelamin': siswa.jenisKelamin === JenisKelamin.LAKI_LAKI ? 'Laki-laki' : 'Perempuan',
      'Status': siswa.status,
      'No HP Orang Tua': siswa.nomorHpOrangTua || '-',
      'Capaian Hafalan (%)': `${getProgress(siswa.id)}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');
    XLSX.writeFile(workbook, `Data_Siswa_Halaqah_${halaqahName.replace(/\s+/g, '_')}.xlsx`);

    if (addLog) {
      addLog('Export Excel', `Mengekspor data santri halaqah ${halaqahName} ke Excel`);
    }
  };

  // EXPORT: PDF
  const handleExportPDF = () => {
    const halaqahName = myHalaqah?.namaHalaqah || 'Halaqah';
    const guruName = myGuruObj?.namaLengkap || myUser?.namaLengkap || 'Pembimbing';
    const doc = new jsPDF();

    // Header Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('DAFTAR SISWA HALAQAH BIMBINGAN', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Halaqah: ${halaqahName}`, 14, 28);
    doc.text(`Pembimbing: ${guruName}`, 14, 34);
    doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString().split('T')[0])}`, 14, 40);

    // Table Header
    let y = 50;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 6, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('NO', 16, y);
    doc.text('NAMA SANTRI', 26, y);
    doc.text('NIS', 85, y);
    doc.text('KELAS', 115, y);
    doc.text('STATUS', 145, y);
    doc.text('CAPAIAN', 170, y);

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    y += 8;

    filteredHalaqahSiswa.forEach((siswa, index) => {
      const progress = getProgress(siswa.id);
      doc.text((index + 1).toString(), 16, y);
      doc.text(siswa.namaLengkap, 26, y);
      doc.text(siswa.nis, 85, y);
      doc.text(siswa.kelasNama || siswa.jenjangNama || '-', 115, y);
      doc.text(siswa.status, 145, y);
      doc.text(`${progress}%`, 170, y);

      y += 8;
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
    });

    // Signature Area
    y = Math.min(260, y + 15);
    doc.setFontSize(9);
    doc.text('Mengetahui,', 145, y);
    doc.text('Pembimbing Halaqah', 145, y + 6);
    doc.text(`(${guruName})`, 145, y + 25);

    doc.save(`Data_Siswa_Halaqah_${halaqahName.replace(/\s+/g, '_')}.pdf`);

    if (addLog) {
      addLog('Export PDF', `Mengekspor data santri halaqah ${halaqahName} ke PDF`);
    }
  };

  // PRINT
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              SISWA HALAQAH
            </h2>
            {myHalaqah && (
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold rounded-full">
                {myHalaqah.namaHalaqah}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen profil serta pantauan progress per-siswa bimbingan halaqah
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleExportExcel}
            className="p-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
            title="Unduh format spreadsheet Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="p-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
            title="Cetak/Unduh dokumen format PDF"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 px-3 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
            title="Cetak Halaman"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* QUICK SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Santri</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Santri Aktif</span>
            <span className="text-xl font-extrabold text-teal-700 dark:text-teal-400">{stats.active}</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Rata-rata Capaian</span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.avgProgress}%</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Butuh Perhatian</span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.needAttention}</span>
          </div>
        </div>
      </div>

      {/* SEARCH, FILTERS & CONTROLS */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa (Nama/NIS)..."
            value={siswaSearch}
            onChange={(e) => setSiswaSearch(e.target.value)}
            className="w-full pl-9 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
          {siswaSearch && (
            <button
              onClick={() => setSiswaSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Toggle View Mode */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => setSiswaViewMode('table')}
              className={`p-1.5 px-2.5 rounded-md flex items-center space-x-1 text-[11px] font-bold cursor-pointer transition ${
                siswaViewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              title="Tampilan Tabel"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setSiswaViewMode('grid')}
              className={`p-1.5 px-2.5 rounded-md flex items-center space-x-1 text-[11px] font-bold cursor-pointer transition ${
                siswaViewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              title="Tampilan Kartu Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>

          {/* Filter Kelas */}
          <select
            value={siswaClassFilter}
            onChange={(e) => setSiswaClassFilter(e.target.value)}
            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">Semua Kelas</option>
            {classOptions.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={siswaStatusFilter}
            onChange={(e) => setSiswaStatusFilter(e.target.value as any)}
            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">Semua Status</option>
            <option value={StatusAktif.AKTIF}>Aktif</option>
            <option value={StatusAktif.NON_AKTIF}>Non-Aktif</option>
          </select>

          {/* Filter Tingkat Progres */}
          <select
            value={siswaAchievementFilter}
            onChange={(e) => setSiswaAchievementFilter(e.target.value as any)}
            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">Semua Capaian</option>
            <option value="tinggi">Hafalan Tinggi (&ge; 60%)</option>
            <option value="rendah">Butuh Perhatian (&lt; 60%)</option>
          </select>
        </div>
      </div>

      {/* LIST CONTENT: TABLE OR GRID */}
      {siswaViewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-150 dark:border-slate-850 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-4 pl-6 text-center w-12">No</th>
                  <th className="p-4">Santri</th>
                  <th className="p-4">NIS</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Pilihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/70 text-xs">
                {filteredHalaqahSiswa.map((siswa, idx) => {
                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 pl-6 text-center text-slate-400 font-mono tabular-nums font-semibold">
                        {idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar
                            namaLengkap={siswa.namaLengkap}
                            fotoProfil={siswa.fotoProfil}
                            className="w-9 h-9 text-xs font-bold border border-slate-100 dark:border-slate-800"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-[13px] block">
                              {siswa.namaLengkap}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {siswa.jenisKelamin === JenisKelamin.LAKI_LAKI ? 'Ikhwan (L)' : 'Akhwat (P)'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono tabular-nums text-slate-500 font-medium">
                        {siswa.nis}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-md tracking-wider">
                          {siswa.kelasNama || siswa.jenjangNama || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              siswa.status === StatusAktif.AKTIF ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
                            {siswa.status.toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenProfile(siswa)}
                            className="inline-flex items-center space-x-1 p-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 text-[10px] font-mono uppercase tracking-wider rounded-lg transition font-bold cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                            title="Lihat Profil Santri"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Profil</span>
                          </button>
                          {siswa.nomorHpOrangTua && (
                            <a
                              href={`https://wa.me/${siswa.nomorHpOrangTua.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 p-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono uppercase tracking-wider rounded-lg transition font-bold cursor-pointer"
                              title="Hubungi Wali Murid via WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 text-white" />
                              <span>WA</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredHalaqahSiswa.length === 0 && (
            <div className="py-16 text-center text-slate-400 italic text-xs">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
              Tidak ditemukan santri yang cocok dengan kriteria pencarian
            </div>
          )}
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHalaqahSiswa.map((siswa) => {
            const progress = getProgress(siswa.id);
            const isLow = progress < 60;

            return (
              <div
                key={siswa.id}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <Avatar
                        namaLengkap={siswa.namaLengkap}
                        fotoProfil={siswa.fotoProfil}
                        className="w-12 h-12 text-sm font-bold border-2 border-emerald-500/20"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {siswa.namaLengkap}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          NIS: {siswa.nis}
                        </p>
                        <div className="flex items-center space-x-1.5 mt-1.5">
                          <span className="inline-block px-2 py-0.5 text-[8px] font-bold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded-full tracking-wider uppercase font-mono">
                            {siswa.kelasNama || siswa.jenjangNama || '-'}
                          </span>
                          <span className="inline-block px-1.5 py-0.5 text-[8px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md">
                            {siswa.jenisKelamin === JenisKelamin.LAKI_LAKI ? 'Ikhwan' : 'Akhwat'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        siswa.status === StatusAktif.AKTIF ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={siswa.status}
                    />
                  </div>

                  {/* Progress Bar in Card */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850">
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                      <span className="text-slate-400">Progres Capaian</span>
                      <span className={isLow ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <button
                    onClick={() => handleOpenProfile(siswa)}
                    className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Profil Lengkap</span>
                  </button>
                  {siswa.nomorHpOrangTua && (
                    <a
                      href={`https://wa.me/${siswa.nomorHpOrangTua.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                      title="Hubungi Wali Murid via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {filteredHalaqahSiswa.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-950 rounded-2xl border text-slate-400 italic">
              Tidak ditemukan santri bimbingan yang cocok dengan penyaringan pencarian
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL PROFIL SANTRI */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center space-x-4">
                <Avatar
                  namaLengkap={selectedProfile.namaLengkap}
                  fotoProfil={selectedProfile.fotoProfil}
                  className="w-14 h-14 text-base font-bold border-2 border-emerald-500/20"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedProfile.namaLengkap}
                    </h3>
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                        selectedProfile.status === StatusAktif.AKTIF
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {selectedProfile.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    NIS: {selectedProfile.nis} • {selectedProfile.kelasNama || selectedProfile.jenjangNama || 'Halaqah'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProfile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Academic & Halaqah */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="font-bold text-[11px] text-slate-900 dark:text-white flex items-center space-x-1.5 uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Data Akademik & Halaqah</span>
                  </span>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-400 pt-1">
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-400">Kelas</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProfile.kelasNama || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-400">Halaqah</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProfile.halaqahNama || myHalaqah?.namaHalaqah || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-400">Pembimbing</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{myGuruObj?.namaLengkap || myUser?.namaLengkap || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Terdaftar Sejak</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedProfile.tanggalDibuat)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Personal & Contact */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="font-bold text-[11px] text-slate-900 dark:text-white flex items-center space-x-1.5 uppercase tracking-wider">
                    <Phone className="w-4 h-4 text-teal-600" />
                    <span>Kontak & Data Pribadi</span>
                  </span>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-400 pt-1">
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-400">Jenis Kelamin</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedProfile.jenisKelamin === JenisKelamin.LAKI_LAKI ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-400">Tanggal Lahir</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedProfile.tanggalLahir)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-400">WhatsApp Wali</span>
                      <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{selectedProfile.nomorHpOrangTua || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Alamat</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[180px]">{selectedProfile.alamat || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick WhatsApp Action if number exists */}
              {selectedProfile.nomorHpOrangTua && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block leading-snug">
                        Hubungi Orang Tua / Wali Santri
                      </span>
                      <span className="text-[11px] font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 block mt-0.5 truncate">
                        {selectedProfile.nomorHpOrangTua}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${selectedProfile.nomorHpOrangTua.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <span>Chat WA</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedProfile(null)}
                className="p-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
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
