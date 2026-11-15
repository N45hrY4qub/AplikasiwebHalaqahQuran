/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  BookOpen,
  Eye,
  Filter,
  Search,
  Building,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Plus,
  Settings,
  X,
  Layers,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Halaqah, Siswa, UserRole } from '../types';
import {
  calculateStudentProgress,
  formatTargetPeriod,
  formatTargetRange,
  resolveTargetElement,
  getTargetTextForMonth,
  checkStudentTargetMetForMonth,
  getDurasiTargetLabel,
  StudentProgressResult,
  SURAH_LIST,
  getSurahJumlahAyat
} from '../utils/targetProgressHelper';

interface ManageHalaqahPribadiProgressProps {
  myHalaqahs: Halaqah[];
  myStudents: Siswa[];
  role?: UserRole;
  selectedHalaqahId?: string;
  onSelectHalaqah?: (id: string) => void;
  onOpenTargetModal?: (halaqahId?: string) => void;
}

export const ManageHalaqahPribadiProgress: React.FC<ManageHalaqahPribadiProgressProps> = ({
  myHalaqahs,
  myStudents,
  role,
  selectedHalaqahId: initialSelectedHalaqahId,
  onSelectHalaqah,
  onOpenTargetModal: externalOpenTargetModal
}) => {
  const {
    gurus,
    setorans,
    moduls,
    elemenSettings,
    studentTargets,
    generalTargets,
    updateHalaqah,
    addLog
  } = useApp();

  // Filter: ONLY private halaqahs that have target & progress configured!
  const targetedPrivateHalaqahs = useMemo(() => {
    return myHalaqahs.filter(h => {
      return (
        h.sourceType === 'private_halaqah' &&
        h.targetConfigEnabled === true &&
        !!h.targetConfig
      );
    });
  }, [myHalaqahs]);

  // Selected private halaqah filter
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>(() => {
    if (initialSelectedHalaqahId && targetedPrivateHalaqahs.some(h => h.id === initialSelectedHalaqahId)) {
      return initialSelectedHalaqahId;
    }
    return targetedPrivateHalaqahs.length > 0 ? 'all' : '';
  });

  // Sync selection if targetedPrivateHalaqahs changes
  useEffect(() => {
    if (selectedHalaqahId !== 'all' && selectedHalaqahId && !targetedPrivateHalaqahs.some(h => h.id === selectedHalaqahId)) {
      setSelectedHalaqahId(targetedPrivateHalaqahs.length > 0 ? 'all' : '');
    }
  }, [targetedPrivateHalaqahs, selectedHalaqahId]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'tuntas' | 'berprogres' | 'belum_mulai'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [evalMonthIdx, setEvalMonthIdx] = useState<number>(0);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentProgressResult | null>(null);

  // Target Config Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [configModalHalaqahId, setConfigModalHalaqahId] = useState<string>('');
  const [targetFormElemenId, setTargetFormElemenId] = useState<string>('');
  const [targetFormPeriod, setTargetFormPeriod] = useState<'tahunan' | 'kuartal'>('tahunan');
  const [targetFormBulanDuration, setTargetFormBulanDuration] = useState<number>(12);
  const [targetFormQuranMode, setTargetFormQuranMode] = useState<'juz' | 'surat_ayat' | 'paket_pemula'>('juz');
  const [targetFormJuzAwal, setTargetFormJuzAwal] = useState<number>(30);
  const [targetFormJuzAkhir, setTargetFormJuzAkhir] = useState<number>(30);
  const [targetFormSuratAwal, setTargetFormSuratAwal] = useState<string>("An-Naba'");
  const [targetFormAyatAwal, setTargetFormAyatAwal] = useState<number>(1);
  const [targetFormSuratAkhir, setTargetFormSuratAkhir] = useState<string>('An-Nas');
  const [targetFormAyatAkhir, setTargetFormAyatAkhir] = useState<number>(6);
  const [targetFormModulType, setTargetFormModulType] = useState<'Al-Quran' | 'Selain Al-Quran'>('Al-Quran');
  const [targetFormNonQuranModulId, setTargetFormNonQuranModulId] = useState<string>('');
  const [targetFormJilidAwal, setTargetFormJilidAwal] = useState<number>(1);
  const [targetFormHalamanAwal, setTargetFormHalamanAwal] = useState<number>(1);
  const [targetFormJilidAkhir, setTargetFormJilidAkhir] = useState<number>(1);
  const [targetFormHalamanAkhir, setTargetFormHalamanAkhir] = useState<number>(40);

  // Open config modal with initial values
  const handleOpenConfigModal = (hId?: string) => {
    const targetHId = hId || (selectedHalaqahId !== 'all' ? selectedHalaqahId : myHalaqahs[0]?.id) || '';
    setConfigModalHalaqahId(targetHId);
    
    const hObj = myHalaqahs.find(h => h.id === targetHId);
    if (hObj && hObj.targetConfig) {
      const cfg = hObj.targetConfig;
      setTargetFormElemenId(cfg.selectedElemenId || '');
      setTargetFormPeriod(cfg.targetPeriod || 'tahunan');
      setTargetFormBulanDuration(cfg.tahunanBulanDuration || 12);
      setTargetFormQuranMode(cfg.tahunanMode || 'juz');
      setTargetFormJuzAwal(cfg.tahunanJuzAwal || 30);
      setTargetFormJuzAkhir(cfg.tahunanJuzAkhir || 30);
      setTargetFormSuratAwal(cfg.tahunanSuratAwal || "An-Naba'");
      setTargetFormAyatAwal(cfg.tahunanAyatAwal || 1);
      setTargetFormSuratAkhir(cfg.tahunanSuratAkhir || 'An-Nas');
      setTargetFormAyatAkhir(cfg.tahunanAyatAkhir || 6);
      setTargetFormModulType(cfg.selectedModulType || 'Al-Quran');
      setTargetFormNonQuranModulId(cfg.selectedNonQuranModulId || '');
      setTargetFormJilidAwal(cfg.tahunanJilidAwal || 1);
      setTargetFormHalamanAwal(cfg.tahunanHalamanAwal || 1);
      setTargetFormJilidAkhir(cfg.tahunanJilidAkhir || 1);
      setTargetFormHalamanAkhir(cfg.tahunanHalamanAkhir || 40);
    } else {
      setTargetFormElemenId(elemenSettings[0]?.id || '');
      setTargetFormPeriod('tahunan');
      setTargetFormBulanDuration(12);
      setTargetFormQuranMode('juz');
      setTargetFormJuzAwal(30);
      setTargetFormJuzAkhir(30);
      setTargetFormSuratAwal("An-Naba'");
      setTargetFormAyatAwal(1);
      setTargetFormSuratAkhir('An-Nas');
      setTargetFormAyatAkhir(6);
      setTargetFormModulType('Al-Quran');
      setTargetFormNonQuranModulId('');
      setTargetFormJilidAwal(1);
      setTargetFormHalamanAwal(1);
      setTargetFormJilidAkhir(1);
      setTargetFormHalamanAkhir(40);
    }
    setIsConfigModalOpen(true);
  };

  // Save Target Config for Private Halaqah
  const handleSaveConfigModal = async () => {
    if (!configModalHalaqahId) {
      alert('Pilih halaqah pribadi yang ingin diatur targetnya.');
      return;
    }

    const targetHalaqah = myHalaqahs.find(h => h.id === configModalHalaqahId);
    if (!targetHalaqah) return;

    const elemObj = elemenSettings.find(e => e.id === targetFormElemenId) || elemenSettings[0];
    const elemName = elemObj ? elemObj.nama : 'Tahfidz';

    // Auto calculate monthly milestones based on targetFormBulanDuration
    const monthlyTargets: Record<number, any> = {};
    const duration = targetFormBulanDuration || 12;

    if (targetFormModulType === 'Al-Quran') {
      if (targetFormQuranMode === 'paket_pemula') {
        const PEMULA_SURAT = ['Al-Fatihah', 'An-Nas', 'Al-Falaq', 'Al-Ikhlas', 'Al-Lahab', 'An-Nasr', 'Al-Kafirun', 'Al-Kausar'];
        for (let m = 0; m < duration; m++) {
          const sIdx = Math.min(m, PEMULA_SURAT.length - 1);
          monthlyTargets[m] = {
            suratAwal: PEMULA_SURAT[sIdx],
            ayatAwal: 1,
            suratAkhir: PEMULA_SURAT[sIdx],
            ayatAkhir: getSurahJumlahAyat(SURAH_LIST.find(s => s.nama === PEMULA_SURAT[sIdx])?.no || 1, moduls),
            catatan: `Surat ${PEMULA_SURAT[sIdx]}`
          };
        }
      } else if (targetFormQuranMode === 'juz') {
        const startJ = Math.min(targetFormJuzAwal, targetFormJuzAkhir);
        const endJ = Math.max(targetFormJuzAwal, targetFormJuzAkhir);
        const totalJuz = Math.max(1, endJ - startJ + 1);
        for (let m = 0; m < duration; m++) {
          const progressJ = startJ + Math.min(endJ - startJ, Math.floor((m / duration) * totalJuz));
          monthlyTargets[m] = {
            suratAwal: "An-Naba'",
            ayatAwal: 1,
            suratAkhir: 'An-Nas',
            ayatAkhir: 6,
            juzAwal: progressJ,
            juzAkhir: progressJ,
            catatan: `Tahapan Juz ${progressJ}`
          };
        }
      } else {
        for (let m = 0; m < duration; m++) {
          monthlyTargets[m] = {
            suratAwal: targetFormSuratAwal,
            ayatAwal: targetFormAyatAwal,
            suratAkhir: targetFormSuratAkhir,
            ayatAkhir: targetFormAyatAkhir,
            catatan: `Tahapan Bulan ${m + 1}`
          };
        }
      }
    } else {
      const totalHal = Math.max(1, targetFormHalamanAkhir - targetFormHalamanAwal + 1);
      for (let m = 0; m < duration; m++) {
        const stepHal = Math.round(targetFormHalamanAwal + ((m + 1) / duration) * totalHal - 1);
        monthlyTargets[m] = {
          jilidAwal: targetFormJilidAwal,
          halamanAwal: targetFormHalamanAwal,
          jilidAkhir: targetFormJilidAkhir,
          halamanAkhir: Math.min(targetFormHalamanAkhir, Math.max(targetFormHalamanAwal, stepHal)),
          catatan: `Halaman ${targetFormHalamanAwal} - ${Math.min(targetFormHalamanAkhir, Math.max(targetFormHalamanAwal, stepHal))}`
        };
      }
    }

    const newCfg: any = {
      targetPeriod: targetFormPeriod,
      selectedElemenId: targetFormElemenId,
      selectedElemenName: elemName,
      selectedModulType: targetFormModulType,
      selectedNonQuranModulId: targetFormNonQuranModulId,
      tahunanBulanDuration: duration,
      tahunanMode: targetFormQuranMode,
      tahunanJuzAwal: targetFormJuzAwal,
      tahunanJuzAkhir: targetFormJuzAkhir,
      tahunanSuratAwal: targetFormSuratAwal,
      tahunanAyatAwal: targetFormAyatAwal,
      tahunanSuratAkhir: targetFormSuratAkhir,
      tahunanAyatAkhir: targetFormAyatAkhir,
      tahunanJilidAwal: targetFormJilidAwal,
      tahunanHalamanAwal: targetFormHalamanAwal,
      tahunanJilidAkhir: targetFormJilidAkhir,
      tahunanHalamanAkhir: targetFormHalamanAkhir,
      tahunanMonthlyTargets: monthlyTargets,
      quarters: {
        q1ModulType: targetFormModulType,
        q1ElemenId: targetFormElemenId,
        q1NonQuranModulId: targetFormNonQuranModulId
      }
    };

    const rangeText = formatTargetRange(newCfg, moduls);
    const compiledText = {
      pekanan: "Sesuai Target Bulanan",
      bulanan: `Durasi ${duration} Bulan`,
      kuartal: "",
      semester: "",
      tahunan: `Tahunan: [${elemName}: ${rangeText}]`
    };

    await updateHalaqah(targetHalaqah.id, {
      targetConfigEnabled: true,
      targetConfig: newCfg,
      targetConfigText: compiledText
    });

    addLog(
      'Target Halaqah Pribadi',
      `Target pembelajaran halaqah pribadi "${targetHalaqah.namaHalaqah}" berhasil disimpan dan diaktifkan.`
    );

    setIsConfigModalOpen(false);
    setSelectedHalaqahId(targetHalaqah.id);
    alert(`Target Pembelajaran untuk Halaqah Pribadi "${targetHalaqah.namaHalaqah}" berhasil disimpan dan diaktifkan!`);
  };

  // Active halaqah object if a single halaqah is selected
  const activeHalaqah = useMemo(() => {
    if (selectedHalaqahId === 'all' || !selectedHalaqahId) return null;
    return targetedPrivateHalaqahs.find(h => h.id === selectedHalaqahId) || null;
  }, [selectedHalaqahId, targetedPrivateHalaqahs]);

  // Determine total months from active halaqah's duration
  const totalBulanTarget = useMemo(() => {
    if (activeHalaqah?.targetConfig?.tahunanBulanDuration) {
      return Number(activeHalaqah.targetConfig.tahunanBulanDuration) || 12;
    }
    if (targetedPrivateHalaqahs.length > 0) {
      const firstWithDuration = targetedPrivateHalaqahs.find(h => h.targetConfig?.tahunanBulanDuration);
      if (firstWithDuration?.targetConfig?.tahunanBulanDuration) {
        return Number(firstWithDuration.targetConfig.tahunanBulanDuration) || 12;
      }
    }
    return 12;
  }, [activeHalaqah, targetedPrivateHalaqahs]);

  // Ensure evalMonthIdx does not exceed total months
  useEffect(() => {
    if (evalMonthIdx >= totalBulanTarget) {
      setEvalMonthIdx(0);
    }
  }, [totalBulanTarget, evalMonthIdx]);

  // Students belonging to targeted private halaqahs
  const targetedStudents = useMemo(() => {
    const validHalaqahIds = new Set(targetedPrivateHalaqahs.map(h => h.id));
    return myStudents.filter(s => validHalaqahIds.has(s.halaqahId));
  }, [myStudents, targetedPrivateHalaqahs]);

  // Calculate progress for each student
  const studentMetrics = useMemo(() => {
    return targetedStudents.map(siswa => {
      const hObj = targetedPrivateHalaqahs.find(h => h.id === siswa.halaqahId);
      return calculateStudentProgress(
        siswa,
        hObj,
        studentTargets,
        generalTargets,
        setorans,
        moduls,
        elemenSettings
      );
    });
  }, [targetedStudents, targetedPrivateHalaqahs, studentTargets, generalTargets, setorans, moduls, elemenSettings]);

  // Filtered by selected halaqah, search, and status
  const filteredMetrics = useMemo(() => {
    return studentMetrics.filter(item => {
      // Filter by selected halaqah
      if (selectedHalaqahId !== 'all' && item.siswa.halaqahId !== selectedHalaqahId) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.siswa.namaLengkap.toLowerCase().includes(q);
        const matchNis = (item.siswa.nis || '').toLowerCase().includes(q);
        if (!matchName && !matchNis) return false;
      }

      // Filter by status
      if (statusFilter === 'tuntas' && item.percent < 100) return false;
      if (statusFilter === 'berprogres' && (item.percent <= 0 || item.percent >= 100)) return false;
      if (statusFilter === 'belum_mulai' && item.percent > 0) return false;

      return true;
    });
  }, [studentMetrics, selectedHalaqahId, searchQuery, statusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const relevant = selectedHalaqahId === 'all'
      ? studentMetrics
      : studentMetrics.filter(m => m.siswa.halaqahId === selectedHalaqahId);

    const totalStudents = relevant.length;
    const completedCount = relevant.filter(m => m.percent >= 100).length;
    const inProgressCount = relevant.filter(m => m.percent > 0 && m.percent < 100).length;
    const notStartedCount = relevant.filter(m => m.percent === 0).length;
    const sumPercent = relevant.reduce((acc, curr) => acc + curr.percent, 0);
    const avgPercent = totalStudents > 0 ? Math.round(sumPercent / totalStudents) : 0;

    return {
      totalHalaqahs: targetedPrivateHalaqahs.length,
      totalStudents,
      completedCount,
      inProgressCount,
      notStartedCount,
      avgPercent
    };
  }, [studentMetrics, selectedHalaqahId, targetedPrivateHalaqahs]);

  // Active milestone target info for evaluated month
  const activeMilestoneTarget = useMemo(() => {
    const h = activeHalaqah || targetedPrivateHalaqahs[0];
    const cfg = h?.targetConfig || generalTargets?.config;
    return getTargetTextForMonth(cfg, evalMonthIdx, moduls);
  }, [activeHalaqah, targetedPrivateHalaqahs, generalTargets, evalMonthIdx, moduls]);

  // Students who reached evaluated month milestone
  const milestoneAchievers = useMemo(() => {
    const relevant = selectedHalaqahId === 'all'
      ? filteredMetrics
      : filteredMetrics.filter(m => m.siswa.halaqahId === selectedHalaqahId);

    return relevant.filter(item => {
      const hObj = targetedPrivateHalaqahs.find(h => h.id === item.siswa.halaqahId);
      return checkStudentTargetMetForMonth(
        item.siswa.id,
        evalMonthIdx,
        hObj,
        studentTargets,
        generalTargets,
        setorans,
        moduls,
        elemenSettings
      );
    });
  }, [filteredMetrics, selectedHalaqahId, targetedPrivateHalaqahs, evalMonthIdx, studentTargets, generalTargets, setorans, moduls, elemenSettings]);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* 1. HEADER SECTION & ACTIONS */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Halaqah Pribadi
            </span>
            <span className="text-xs text-indigo-200">Monitoring Capaian Santri</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-emerald-400" />
            Target & Progres Halaqah Pribadi
          </h2>
          <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
            Pantau kepatuhan target, evaluasi tahapan bulanan, dan progres hafalan santri pada kelompok halaqah belajar mandiri Anda.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenConfigModal()}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Atur Target Halaqah</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. IF NO TARGETED PRIVATE HALAQAH EXISTS */}
      {/* ---------------------------------------------------- */}
      {targetedPrivateHalaqahs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-2xl max-w-2xl mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Target className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Halaqah Pribadi yang Diatur Target & Progresnya
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Halaqah pribadi yang belum diatur target & progresnya oleh guru tidak dapat dipantau di sini.
              Tetapkan target pembelajaran santri sekarang untuk mulai melacak capaian hafalan dan kepatuhan milestone bulanan.
            </p>
          </div>
          <button
            onClick={() => handleOpenConfigModal(myHalaqahs[0]?.id)}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 rounded-xl transition shadow-md flex items-center gap-2 mx-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tetapkan Target Halaqah Pribadi Sekarang</span>
          </button>
        </div>
      ) : (
        <>
          {/* ---------------------------------------------------- */}
          {/* 3. KPI OVERVIEW METRICS CARDS */}
          {/* ---------------------------------------------------- */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Halaqah Ber-Target */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Halaqah Ber-Target
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.totalHalaqahs}
                </span>
                <span className="text-xs text-slate-400 font-medium">Halaqah</span>
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                Target & Progres Aktif
              </p>
            </div>

            {/* Card 2: Total Santri Ber-Target */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Santri Ber-Target
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.totalStudents}
                </span>
                <span className="text-xs text-slate-400 font-medium">Santri</span>
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                Total santri dipantau
              </p>
            </div>

            {/* Card 3: Rata-rata Capaian */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rata-rata Capaian
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.avgPercent}%
                </span>
                <span className="text-xs text-slate-400 font-medium">Kepatuhan</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.avgPercent)}%` }}
                />
              </div>
            </div>

            {/* Card 4: Santri Tuntas */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Target Tuntas
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {stats.completedCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">Santri (100%)</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                Khatam target penuh
              </p>
            </div>

            {/* Card 5: Sedang Berprogres */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Sedang Berprogres
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {stats.inProgressCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">Santri (1-99%)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>{stats.notStartedCount} Belum Mulai</span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* 4. HALAQAH PRIBADI SELECTOR & ACTIVE HALAQAH BANNER */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Pilih Halaqah Pribadi yang Dipantau:
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setSelectedHalaqahId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    selectedHalaqahId === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Semua Halaqah Pribadi ({targetedPrivateHalaqahs.length})
                </button>
                {targetedPrivateHalaqahs.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHalaqahId(h.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      selectedHalaqahId === h.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: h.warnaIdentitas || '#6366F1' }}
                    />
                    <span>{h.namaHalaqah}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Halaqah Details Banner */}
            {activeHalaqah && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-indigo-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-slate-850 border border-indigo-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: activeHalaqah.warnaIdentitas || '#6366F1' }}
                    />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {activeHalaqah.namaHalaqah}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                      {activeHalaqah.jenisProgram}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      Elemen: {resolveTargetElement(activeHalaqah.targetConfig, elemenSettings).nama}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                    <span>
                      <strong>Guru Pengampu:</strong>{' '}
                      {gurus.find(g => g.id === activeHalaqah.guruPembimbingId)?.namaLengkap || activeHalaqah.guruPembimbingNama || 'Guru Bimbingan'}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Rentang Target:</strong>{' '}
                      {formatTargetRange(activeHalaqah.targetConfig, moduls)}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Periode:</strong>{' '}
                      {formatTargetPeriod(activeHalaqah.targetConfig)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenConfigModal(activeHalaqah.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ubah Target</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------- */}
          {/* 5. EVALUASI TAHAPAN BULANAN (MILESTONE 1-N) */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Evaluasi Tahapan Bulanan (Milestone 1 - {totalBulanTarget})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pilih bulan untuk melihat kepatuhan capaian target santri
              </span>
            </div>

            {/* Month Selection Pills (1 to totalBulanTarget) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {Array.from({ length: totalBulanTarget }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setEvalMonthIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                    evalMonthIdx === idx
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Bulan {idx + 1}
                </button>
              ))}
            </div>

            {/* Active Month Milestone Target Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-150 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Target Capaian Bulan ke-{evalMonthIdx + 1}:
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeMilestoneTarget}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {milestoneAchievers.length} Santri Telah Capai
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {filteredMetrics.length - milestoneAchievers.length} Belum
                  </span>
                </div>
              </div>

              {/* Progress bar of monthly milestone achievement */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Tingkat Kepatuhan Bulan {evalMonthIdx + 1}</span>
                  <span>
                    {filteredMetrics.length > 0
                      ? Math.round((milestoneAchievers.length / filteredMetrics.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        filteredMetrics.length > 0
                          ? Math.round((milestoneAchievers.length / filteredMetrics.length) * 100)
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* 6. DAFTAR PROGRES SANTRI (GRID OR TABLE) */}
          {/* ---------------------------------------------------- */}
          <div className="space-y-4">
            {/* Control Bar: Search, Status Tabs, View Toggle */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari nama santri atau NIS..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Semua ({studentMetrics.length})
                </button>
                <button
                  onClick={() => setStatusFilter('tuntas')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === 'tuntas'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tuntas ({stats.completedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('berprogres')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === 'berprogres'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Progres ({stats.inProgressCount})
                </button>
                <button
                  onClick={() => setStatusFilter('belum_mulai')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === 'belum_mulai'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Belum ({stats.notStartedCount})
                </button>
              </div>

              {/* View Mode Toggle (Grid / Table) */}
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Tampilan Kartu"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Tampilan Tabel"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List Content */}
            {filteredMetrics.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tidak ada santri yang sesuai filter atau pencarian.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Coba ubah kata kunci pencarian atau sesuaikan filter status kepatuhan.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMetrics.map(item => {
                  const hObj = targetedPrivateHalaqahs.find(h => h.id === item.siswa.halaqahId);
                  const isCompleted = item.percent >= 100;
                  const isStarted = item.percent > 0;

                  return (
                    <div
                      key={item.siswa.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left"
                    >
                      {/* Header card: Student info + Halaqah badge */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                              {item.siswa.namaLengkap.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                {item.siswa.namaLengkap}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                NIS: {item.siswa.nis || '-'}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isStarted
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {isCompleted ? 'Tuntas' : isStarted ? 'Berprogres' : 'Belum Mulai'}
                          </span>
                        </div>

                        {/* Halaqah Name Pill */}
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{hObj?.namaHalaqah || 'Halaqah Pribadi'}</span>
                        </div>
                      </div>

                      {/* Body: Target details & progress bar */}
                      <div className="space-y-3">
                        <div className="p-3 bg-indigo-50/40 dark:bg-slate-850 rounded-xl border border-indigo-100/60 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                              Target {item.elementName}:
                            </span>
                            {item.isCustom && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                            {item.targetRangeText}
                          </p>
                        </div>

                        {/* Capaian saat ini */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Capaian Terakhir Disetorkan:
                          </span>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-2">
                            {item.latestCapaianText}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Kepatuhan Target</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.percent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted
                                  ? 'bg-emerald-500'
                                  : isStarted
                                  ? 'bg-indigo-600'
                                  : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              style={{ width: `${Math.min(100, item.percent)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer: Detail button */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => setSelectedStudentDetail(item)}
                          className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-150 dark:border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Detail</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4">Santri</th>
                        <th className="py-3 px-4">Halaqah</th>
                        <th className="py-3 px-4">Target Ditetapkan</th>
                        <th className="py-3 px-4">Capaian Terakhir</th>
                        <th className="py-3 px-4 w-36">Kepatuhan (%)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredMetrics.map((item, idx) => {
                        const hObj = targetedPrivateHalaqahs.find(h => h.id === item.siswa.halaqahId);
                        const isCompleted = item.percent >= 100;
                        const isStarted = item.percent > 0;

                        return (
                          <tr
                            key={item.siswa.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition"
                          >
                            <td className="py-3 px-4 text-center text-slate-400 font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {item.siswa.namaLengkap}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                NIS: {item.siswa.nis || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                              {hObj?.namaHalaqah || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.targetRangeText}
                              </span>
                              <div className="text-[10px] text-slate-400">
                                Elemen: {item.elementName}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                              {item.latestCapaianText}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                                  <div
                                    className={`h-full rounded-full ${
                                      isCompleted
                                        ? 'bg-emerald-500'
                                        : isStarted
                                        ? 'bg-indigo-600'
                                        : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${Math.min(100, item.percent)}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.percent}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : isStarted
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {isCompleted ? 'Tuntas' : isStarted ? 'Berprogres' : 'Belum'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedStudentDetail(item)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. MODAL DETAIL SANTRI */}
      {/* ---------------------------------------------------- */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {selectedStudentDetail.siswa.namaLengkap.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedStudentDetail.siswa.namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-400">
                    NIS: {selectedStudentDetail.siswa.nis || '-'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Breakdown */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Target Pembelajaran:
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedStudentDetail.targetRangeText}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Elemen: <strong>{selectedStudentDetail.elementName}</strong></span>
                  <span>•</span>
                  <span>Periode: <strong>{selectedStudentDetail.targetPeriodText}</strong></span>
                </div>
              </div>

              {/* Progress Detail */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Tingkat Kepatuhan Capaian:
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {selectedStudentDetail.percent}%
                  </span>
                </div>
                <div className="w-full bg-emerald-100 dark:bg-emerald-900/40 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, selectedStudentDetail.percent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 pt-1">
                  <span>Total Setoran Lulus Sesuai Target:</span>
                  <strong>{selectedStudentDetail.setoransCount} kali</strong>
                </div>
              </div>

              {/* Latest Capaian */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Capaian Terakhir Disetorkan:
                </span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                  {selectedStudentDetail.latestCapaianText}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentDetail(null)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase transition"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. MODAL ATUR TARGET HALAQAH PRIBADI */}
      {/* ---------------------------------------------------- */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Atur Target Halaqah Pribadi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasikan target pembelajaran dan durasi waktu capaian
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Select Private Halaqah */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  Pilih Halaqah Pribadi:
                </label>
                <select
                  value={configModalHalaqahId}
                  onChange={e => setConfigModalHalaqahId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {myHalaqahs.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.namaHalaqah} ({h.jenisProgram})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Elemen Penilaian */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  Elemen Penilaian:
                </label>
                <select
                  value={targetFormElemenId}
                  onChange={e => setTargetFormElemenId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {elemenSettings.map(elem => (
                    <option key={elem.id} value={elem.id}>
                      {elem.nama} ({elem.tipeModul})
                    </option>
                  ))}
                </select>
              </div>

              {/* Modul Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  Tipe Materi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetFormModulType('Al-Quran')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      targetFormModulType === 'Al-Quran'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Al-Qur'an</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFormModulType('Selain Al-Quran')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      targetFormModulType === 'Selain Al-Quran'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Selain Al-Qur'an</span>
                  </button>
                </div>
              </div>

              {/* Durasi Target / Periode */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  Durasi Target (Waktu Efektif):
                </label>
                <select
                  value={targetFormBulanDuration}
                  onChange={e => setTargetFormBulanDuration(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value={12}>12 Bulan (1 Tahun Penuh)</option>
                  <option value={10}>10 Bulan (Tahun Ajaran Efektif)</option>
                  <option value={6}>6 Bulan (1 Semester Penuh)</option>
                  <option value={3}>3 Bulan (1 Kuartal)</option>
                  <option value={1}>1 Bulan (Uji Coba Cepat)</option>
                </select>
              </div>

              {/* Al-Quran Specific Target Inputs */}
              {targetFormModulType === 'Al-Quran' ? (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Metode Penentuan Target Al-Qur'an:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetFormQuranMode('juz')}
                        className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition ${
                          targetFormQuranMode === 'juz'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Berdasarkan Juz
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetFormQuranMode('surat_ayat')}
                        className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition ${
                          targetFormQuranMode === 'surat_ayat'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Surat & Ayat
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetFormQuranMode('paket_pemula')}
                        className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition ${
                          targetFormQuranMode === 'paket_pemula'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Paket Pemula
                      </button>
                    </div>
                  </div>

                  {targetFormQuranMode === 'juz' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Dari Juz:
                        </label>
                        <select
                          value={targetFormJuzAwal}
                          onChange={e => setTargetFormJuzAwal(Number(e.target.value))}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          {Array.from({ length: 30 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Juz {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Sampai Juz:
                        </label>
                        <select
                          value={targetFormJuzAkhir}
                          onChange={e => setTargetFormJuzAkhir(Number(e.target.value))}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          {Array.from({ length: 30 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Juz {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {targetFormQuranMode === 'surat_ayat' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Surat Awal:</label>
                          <select
                            value={targetFormSuratAwal}
                            onChange={e => setTargetFormSuratAwal(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          >
                            {SURAH_LIST.map(s => (
                              <option key={s.no} value={s.nama}>
                                {s.no}. {s.nama}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Ayat Awal:</label>
                          <input
                            type="number"
                            min={1}
                            value={targetFormAyatAwal}
                            onChange={e => setTargetFormAyatAwal(Number(e.target.value))}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Surat Akhir:</label>
                          <select
                            value={targetFormSuratAkhir}
                            onChange={e => setTargetFormSuratAkhir(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          >
                            {SURAH_LIST.map(s => (
                              <option key={s.no} value={s.nama}>
                                {s.no}. {s.nama}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Ayat Akhir:</label>
                          <input
                            type="number"
                            min={1}
                            value={targetFormAyatAkhir}
                            onChange={e => setTargetFormAyatAkhir(Number(e.target.value))}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {targetFormQuranMode === 'paket_pemula' && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                      <strong>Paket Pemula:</strong> Menargetkan hafalan Surat Al-Fatihah serta urutan dari Surat An-Nas mundur ke Al-Kausar (8 Surat Pendek).
                    </div>
                  )}
                </div>
              ) : (
                /* Selain Al-Quran Inputs */
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Pilih Modul Pembelajaran:
                    </label>
                    <select
                      value={targetFormNonQuranModulId}
                      onChange={e => setTargetFormNonQuranModulId(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="">-- Pilih Buku / Kitab --</option>
                      {moduls
                        .filter(m => m.tipe !== 'Al-Quran')
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {m.judulModul || m.namaSurat}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Halaman Awal:</label>
                      <input
                        type="number"
                        min={1}
                        value={targetFormHalamanAwal}
                        onChange={e => setTargetFormHalamanAwal(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Halaman Akhir:</label>
                      <input
                        type="number"
                        min={1}
                        value={targetFormHalamanAkhir}
                        onChange={e => setTargetFormHalamanAkhir(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveConfigModal}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan & Aktifkan Target</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
