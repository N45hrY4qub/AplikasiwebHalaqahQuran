import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { 
  Award, 
  Target, 
  Sliders, 
  Cloud, 
  Check, 
  X, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  Sparkles, 
  RotateCcw, 
  Eye, 
  Edit2, 
  Table, 
  LayoutGrid, 
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Calendar,
  ChevronLeft,
  GitMerge,
  ShieldCheck
} from 'lucide-react';
import { Siswa, Halaqah, Modul, TipeModul, ElemenSetting, isElemenAvailableForHalaqah } from '../types';
import { getStudentLearningStage } from '../utils/elemenPrerequisiteHelper';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
  SURAH_LIST,
  isPaketFatihahAnnasKausar,
  getSurahNumber,
  getSurahJumlahAyat,
  getQuranDefaultJuz,
  getJuzStartInfo,
  getJuzEndInfo,
  resolveTargetElement,
  formatTargetRange,
  formatTargetPeriod,
  getLatestCapaianNarative,
  getTargetTextForMonth,
  getQuranTargetRange,
  buildVersesSetInRange,
  checkStudentTargetMetForMonth,
  calculateTargetDateRange,
  INDONESIAN_MONTH_NAMES,
  isMatchingStudent,
  isSetoranLulus,
  formatSetoranClean,
  isRelatedElem
} from '../utils/targetProgressHelper';

interface GuruTargetProgressProps {
  myHalaqah: Halaqah | null | undefined;
  myStudents: Siswa[];
  myUser: any;
  myGuruObj: any;
  formatIndonesianDate?: (dateStr: string) => string;
  addLog: (action: string, description: string) => void;
  setSelectedSiswaProfile?: (siswa: Siswa) => void;
}

export const GuruTargetProgress: React.FC<GuruTargetProgressProps> = ({
  myHalaqah,
  myStudents,
  myUser,
  myGuruObj,
  addLog,
  setSelectedSiswaProfile
}) => {
  const { 
    studentTargets, 
    saveStudentTargets, 
    generalTargets, 
    setorans, 
    moduls, 
    elemenSettings, 
    halaqahs, 
    updateHalaqah 
  } = useApp();

  const [activeTargetTab, setActiveTargetTab] = useState<'progress' | 'manage'>('progress');
  const [targetDisplayView, setTargetDisplayView] = useState<'grid' | 'table'>('grid');
  const [evalMonthIdx, setEvalMonthIdx] = useState<number>(11);
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);

  // Filter available element settings for halaqah
  const availableElemenSettings = useMemo(() => {
    return elemenSettings.filter(e => isElemenAvailableForHalaqah(e, myHalaqah));
  }, [elemenSettings, myHalaqah]);

  const hasStudentsWithCustomTarget = useMemo(() => {
    return myStudents.some(s => {
      const t = studentTargets[s.id];
      return t && t.isCustom === true && (t as any).showTarget !== false;
    });
  }, [myStudents, studentTargets]);

  const isProgressTabAvailable = (myHalaqah?.targetConfigEnabled === true) || hasStudentsWithCustomTarget;

  // Target Settings Modal States
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetModalMode, setTargetModalMode] = useState<'halaqah' | 'siswa'>('halaqah');
  const [targetModalSiswaId, setTargetModalSiswaId] = useState<string>('');

  // Target Form Values
  const [targetFormIsCustom, setTargetFormIsCustom] = useState<boolean>(false);
  const [targetFormElemenId, setTargetFormElemenId] = useState<string>('');
  const [targetFormModulType, setTargetFormModulType] = useState<'Al-Quran' | 'Selain Al-Quran'>('Al-Quran');
  const [targetFormNonQuranModulId, setTargetFormNonQuranModulId] = useState<string>('');
  const [targetFormPeriod, setTargetFormPeriod] = useState<'tahunan' | 'kuartal'>('tahunan');
  const [targetFormQuranMode, setTargetFormQuranMode] = useState<'surat' | 'juz' | 'paket_pemula'>('paket_pemula');
  const [targetFormJuzAwal, setTargetFormJuzAwal] = useState<number>(30);
  const [targetFormJuzAkhir, setTargetFormJuzAkhir] = useState<number>(30);
  const [targetFormSuratAwal, setTargetFormSuratAwal] = useState<string>('Al-Fatihah');
  const [targetFormAyatAwal, setTargetFormAyatAwal] = useState<number>(1);
  const [targetFormSuratAkhir, setTargetFormSuratAkhir] = useState<string>('Al-Kausar');
  const [targetFormAyatAkhir, setTargetFormAyatAkhir] = useState<number>(3);
  const [targetFormJilidAwal, setTargetFormJilidAwal] = useState<number>(1);
  const [targetFormHalamanAwal, setTargetFormHalamanAwal] = useState<number>(1);
  const [targetFormJilidAkhir, setTargetFormJilidAkhir] = useState<number>(1);
  const [targetFormHalamanAkhir, setTargetFormHalamanAkhir] = useState<number>(10);
  const [targetFormBulanDuration, setTargetFormBulanDuration] = useState<number>(12);
  const [targetFormActiveQuarter, setTargetFormActiveQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [targetFormStartDay, setTargetFormStartDay] = useState<number>(1);
  const [targetFormStartMonth, setTargetFormStartMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [targetFormStartYear, setTargetFormStartYear] = useState<number>(() => new Date().getFullYear());
  const [calViewMonth, setCalViewMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [calViewYear, setCalViewYear] = useState<number>(() => new Date().getFullYear());
  const [calendarViewMode, setCalendarViewMode] = useState<'visual' | 'input'>('visual');

  // Ensure student target record exists
  const ensureStudentTarget = (targetsRecord: Record<string, any>, sId: string) => {
    if (!targetsRecord[sId]) {
      targetsRecord[sId] = {
        isCustom: false,
        harian: '',
        pekanan: '',
        bulanan: '',
        kuartal: '',
        semester: '',
        tahunan: '',
        harianDone: false,
        pekananDone: false,
        bulananDone: false,
        kuartalSelesai: false,
        semesterSelesai: false,
        tahunanSelesai: false,
      };
    }
  };

  // Build target config from form
  const buildConfigFromForm = () => {
    let sAwal = targetFormSuratAwal || 'Al-Fatihah';
    let aAwal = Number(targetFormAyatAwal) || 1;
    let sAkhir = targetFormSuratAkhir || 'An-Nas';
    let aAkhir = Number(targetFormAyatAkhir) || 6;

    if (targetFormModulType === 'Al-Quran') {
      if (targetFormQuranMode === 'paket_pemula') {
        sAwal = 'Al-Fatihah';
        aAwal = 1;
        sAkhir = 'Al-Kausar';
        aAkhir = 3;
      } else if (targetFormQuranMode === 'juz') {
        const startJ = getJuzStartInfo(Number(targetFormJuzAwal) || 30);
        const endJ = getJuzEndInfo(Number(targetFormJuzAkhir) || 30);
        const sAwalObj = SURAH_LIST.find(s => s.no === startJ.surah);
        const sAkhirObj = SURAH_LIST.find(s => s.no === endJ.surah);
        sAwal = sAwalObj ? sAwalObj.nama : 'Al-Mulk';
        aAwal = startJ.ayat;
        sAkhir = sAkhirObj ? sAkhirObj.nama : 'Al-Mursalat';
        aAkhir = endJ.ayat;
      }
    }

    const duration = Math.max(1, Number(targetFormBulanDuration) || 12);
    const monthlyTargets: Record<number, any> = {};

    if (targetFormModulType === 'Al-Quran') {
      if (targetFormQuranMode === 'paket_pemula') {
        const pemulaMonthlyTargets = [
          { suratAwal: 'Al-Fatihah', ayatAwal: 1, suratAkhir: 'Al-Fatihah', ayatAkhir: 7, catatan: 'Surah Al-Fatihah (Ayat 1-7)' },
          { suratAwal: 'An-Nas', ayatAwal: 1, suratAkhir: 'An-Nas', ayatAkhir: 6, catatan: 'Surah An-Nas (Ayat 1-6)' },
          { suratAwal: 'Al-Falaq', ayatAwal: 1, suratAkhir: 'Al-Falaq', ayatAkhir: 5, catatan: 'Surah Al-Falaq (Ayat 1-5)' },
          { suratAwal: 'Al-Ikhlas', ayatAwal: 1, suratAkhir: 'Al-Ikhlas', ayatAkhir: 4, catatan: 'Surah Al-Ikhlas (Ayat 1-4)' },
          { suratAwal: 'Al-Lahab', ayatAwal: 1, suratAkhir: 'Al-Lahab', ayatAkhir: 5, catatan: 'Surah Al-Lahab (Ayat 1-5)' },
          { suratAwal: 'An-Nasr', ayatAwal: 1, suratAkhir: 'An-Nasr', ayatAkhir: 3, catatan: 'Surah An-Nasr (Ayat 1-3)' },
          { suratAwal: 'Al-Kafirun', ayatAwal: 1, suratAkhir: 'Al-Kafirun', ayatAkhir: 6, catatan: 'Surah Al-Kafirun (Ayat 1-6)' },
          { suratAwal: 'Al-Kausar', ayatAwal: 1, suratAkhir: 'Al-Kausar', ayatAkhir: 3, catatan: 'Surah Al-Kausar (Ayat 1-3)' },
        ];
        if (duration === 12) {
          pemulaMonthlyTargets.forEach((item, idx) => {
            monthlyTargets[idx] = item;
          });
          monthlyTargets[8] = { suratAwal: 'An-Nas', ayatAwal: 1, suratAkhir: 'Al-Ikhlas', ayatAkhir: 4, catatan: "Penguatan / Muroja'ah: An-Nas s/d Al-Ikhlas" };
          monthlyTargets[9] = { suratAwal: 'Al-Lahab', ayatAwal: 1, suratAkhir: 'Al-Kausar', ayatAkhir: 3, catatan: "Penguatan / Muroja'ah: Al-Lahab s/d Al-Kausar" };
          monthlyTargets[10] = { suratAwal: 'Al-Fatihah', ayatAwal: 1, suratAkhir: 'Al-Kausar', ayatAkhir: 3, catatan: "Muroja'ah Menyeluruh: Al-Fatihah & An-Nas s/d Al-Kausar" };
          monthlyTargets[11] = { suratAwal: 'Al-Fatihah', ayatAwal: 1, suratAkhir: 'Al-Kausar', ayatAkhir: 3, catatan: "Tasmi' Akhir: Al-Fatihah & An-Nas s/d Al-Kausar" };
        } else {
          for (let m = 0; m < duration; m++) {
            const idx = Math.min(m, pemulaMonthlyTargets.length - 1);
            monthlyTargets[m] = pemulaMonthlyTargets[idx];
          }
        }
      } else {
        const sNoAwal = SURAH_LIST.findIndex(s => s.nama.toLowerCase().replace(/[^a-z0-9]/g, '') === sAwal.toLowerCase().replace(/[^a-z0-9]/g, '')) + 1 || 1;
        const sNoAkhir = SURAH_LIST.findIndex(s => s.nama.toLowerCase().replace(/[^a-z0-9]/g, '') === sAkhir.toLowerCase().replace(/[^a-z0-9]/g, '')) + 1 || 114;
        const minS = Math.min(sNoAwal, sNoAkhir);
        const maxS = Math.max(sNoAwal, sNoAkhir);
        const surahsInRange: Array<{ no: number; nama: string; ayatCount: number }> = [];
        for (let s = minS; s <= maxS; s++) {
          const sObj = SURAH_LIST.find(item => item.no === s);
          if (sObj) {
            surahsInRange.push({
              no: s,
              nama: sObj.nama,
              ayatCount: getSurahJumlahAyat(s)
            });
          }
        }
        if (surahsInRange.length >= duration) {
          const perMonth = Math.ceil(surahsInRange.length / duration);
          for (let m = 0; m < duration; m++) {
            const startIdx = m * perMonth;
            const endIdx = Math.min(startIdx + perMonth - 1, surahsInRange.length - 1);
            if (startIdx < surahsInRange.length) {
              const firstSurah = surahsInRange[startIdx];
              const lastSurah = surahsInRange[endIdx];
              monthlyTargets[m] = {
                suratAwal: firstSurah.nama,
                ayatAwal: m === 0 ? aAwal : 1,
                suratAkhir: lastSurah.nama,
                ayatAkhir: m === duration - 1 ? aAkhir : lastSurah.ayatCount
              };
            } else {
              const lastSurah = surahsInRange[surahsInRange.length - 1];
              monthlyTargets[m] = {
                suratAwal: lastSurah.nama,
                ayatAwal: 1,
                suratAkhir: lastSurah.nama,
                ayatAkhir: lastSurah.ayatCount
              };
            }
          }
        } else {
          for (let m = 0; m < duration; m++) {
            const sIdx = Math.min(m, surahsInRange.length - 1);
            const currentSurah = surahsInRange[sIdx] || { nama: sAwal, ayatCount: 10 };
            monthlyTargets[m] = {
              suratAwal: currentSurah.nama,
              ayatAwal: 1,
              suratAkhir: currentSurah.nama,
              ayatAkhir: currentSurah.ayatCount
            };
          }
        }
      }
    } else {
      const selectedModulObj = moduls.find(m => m.id === targetFormNonQuranModulId);
      const isSingleJilid = selectedModulObj ? (!selectedModulObj.isMultiJilid || !selectedModulObj.jumlahJilid || selectedModulObj.jumlahJilid <= 1) : false;
      const hAwal = Number(targetFormHalamanAwal) || 1;
      const hAkhir = Math.max(hAwal, Number(targetFormHalamanAkhir) || 10);
      const totalPages = Math.max(1, (hAkhir - hAwal + 1));
      const pagesPerMonth = Math.max(1, Math.ceil(totalPages / duration));

      for (let m = 0; m < duration; m++) {
        const startPage = hAwal + (m * pagesPerMonth);
        const endPage = Math.min(hAkhir, startPage + pagesPerMonth - 1);
        if (isSingleJilid) {
          monthlyTargets[m] = {
            halamanAwal: startPage,
            halamanAkhir: Math.max(startPage, endPage)
          };
        } else {
          monthlyTargets[m] = {
            jilidAwal: Number(targetFormJilidAwal) || 1,
            halamanAwal: startPage,
            jilidAkhir: Number(targetFormJilidAkhir) || 1,
            halamanAkhir: Math.max(startPage, endPage)
          };
        }
      }
    }

    const selectedElemObj = elemenSettings.find(e => e.id === targetFormElemenId) || availableElemenSettings.find(e => e.id === targetFormElemenId);
    const selectedElemName = selectedElemObj?.nama || (targetFormElemenId ? targetFormElemenId : "Tahfidz");

    const newCfg: any = {
      selectedElemenId: targetFormElemenId,
      selectedElemenName: selectedElemName,
      selectedModulType: targetFormModulType,
      selectedNonQuranModulId: targetFormNonQuranModulId,
      targetPeriod: targetFormPeriod,
      tahunanMode: targetFormQuranMode,
      customQuranOrder: targetFormQuranMode === 'paket_pemula' ? 'fatihah_then_nas_to_kausar' : undefined,
      isPaketFatihahAnnasKausar: targetFormQuranMode === 'paket_pemula',
      tahunanJuzAwal: Number(targetFormJuzAwal) || 30,
      tahunanJuzAkhir: Number(targetFormJuzAkhir) || 30,
      tahunanSuratAwal: sAwal,
      tahunanAyatAwal: aAwal,
      tahunanSuratAkhir: sAkhir,
      tahunanAyatAkhir: aAkhir,
      tahunanJilidAwal: Number(targetFormJilidAwal) || 1,
      tahunanJilidAkhir: Number(targetFormJilidAkhir) || 1,
      tahunanHalamanAwal: Number(targetFormHalamanAwal) || 1,
      tahunanHalamanAkhir: Number(targetFormHalamanAkhir) || 10,
      tahunanBulanDuration: duration,
      tahunanMonthlyTargets: monthlyTargets,
      activeSTQuarter: targetFormActiveQuarter,
      quarters: {
        q1ElemenId: targetFormElemenId,
        q2ElemenId: targetFormElemenId,
        q3ElemenId: targetFormElemenId,
        q4ElemenId: targetFormElemenId,
        [`${targetFormActiveQuarter}ElemenId`]: targetFormElemenId,
        [`${targetFormActiveQuarter}ModulType`]: targetFormModulType,
        [`${targetFormActiveQuarter}NonQuranModulId`]: targetFormNonQuranModulId,
        [`${targetFormActiveQuarter}SuratAwal`]: sAwal,
        [`${targetFormActiveQuarter}AyatAwal`]: aAwal,
        [`${targetFormActiveQuarter}SuratAkhir`]: sAkhir,
        [`${targetFormActiveQuarter}AyatAkhir`]: aAkhir,
        [`${targetFormActiveQuarter}JilidAwal`]: Number(targetFormJilidAwal) || 1,
        [`${targetFormActiveQuarter}JilidAkhir`]: Number(targetFormJilidAkhir) || 1,
        [`${targetFormActiveQuarter}HalamanAwal`]: Number(targetFormHalamanAwal) || 1,
        [`${targetFormActiveQuarter}HalamanAkhir`]: Number(targetFormHalamanAkhir) || 10,
      },
      startDay: Math.min(31, Math.max(1, Number(targetFormStartDay) || 1)),
      startMonth: Math.min(12, Math.max(1, Number(targetFormStartMonth) || 1)),
      startYear: Number(targetFormStartYear) || new Date().getFullYear(),
      startDate: `${Number(targetFormStartYear) || new Date().getFullYear()}-${String(Math.min(12, Math.max(1, Number(targetFormStartMonth) || 1))).padStart(2, '0')}-${String(Math.min(31, Math.max(1, Number(targetFormStartDay) || 1))).padStart(2, '0')}`
    };

    return newCfg;
  };

  const compileTargetStrings = (cfg: any) => {
    let pekanan = "";
    let bulanan = "";
    let kuartal = "";
    let semester = "";
    let tahunan = "";
    if (!cfg) return { pekanan, bulanan, kuartal, semester, tahunan };

    if (cfg.targetPeriod === 'tahunan') {
      const { nama: elementName } = resolveTargetElement(cfg, elemenSettings);
      const elemPrefix = elementName ? `${elementName}: ` : '';
      const formattedRange = formatTargetRange(cfg, moduls);
      tahunan = `Tahunan: [${elemPrefix}${formattedRange}]`;
      kuartal = "";
      pekanan = isPaketFatihahAnnasKausar(cfg) 
        ? "Sesuai Target Bulanan (Urutan: Al-Fatihah ➔ An-Nas s/d Al-Kausar)" 
        : "Sesuai Target Bulanan";
      bulanan = "Tersusun dalam target bulanan terstruktur";
    }
    return { pekanan, bulanan, kuartal, semester, tahunan };
  };

  const openTargetModalForHalaqah = () => {
    setTargetModalMode('halaqah');
    setTargetModalSiswaId('');
    const existingCfg = myHalaqah?.targetConfig;
    if (existingCfg) {
      const cfgModulType = existingCfg.selectedModulType || 'Al-Quran';
      setTargetFormModulType(cfgModulType);
      const candidateElemenId = existingCfg.selectedElemenId || existingCfg.quarters?.q1ElemenId || '';
      const elemExists = availableElemenSettings.some(e => e.id === candidateElemenId);
      const matchedModulElem = availableElemenSettings.find(e => 
        cfgModulType === 'Al-Quran' ? e.tipeModul === TipeModul.AL_QURAN : e.tipeModul !== TipeModul.AL_QURAN
      );
      setTargetFormElemenId(elemExists ? candidateElemenId : (matchedModulElem?.id || availableElemenSettings[0]?.id || ''));
      const nonQList = moduls.filter(m => m.tipe !== TipeModul.AL_QURAN);
      const initialNonQ = existingCfg.selectedNonQuranModulId && nonQList.some(m => m.id === existingCfg.selectedNonQuranModulId)
        ? existingCfg.selectedNonQuranModulId
        : (nonQList[0]?.id || '');
      setTargetFormNonQuranModulId(initialNonQ);
      setTargetFormPeriod(existingCfg.targetPeriod || 'tahunan');
      if (isPaketFatihahAnnasKausar(existingCfg)) {
        setTargetFormQuranMode('paket_pemula');
      } else {
        setTargetFormQuranMode(existingCfg.tahunanMode || (existingCfg.tahunanJuzAwal ? 'juz' : 'surat'));
      }
      setTargetFormJuzAwal(Number(existingCfg.tahunanJuzAwal) || 30);
      setTargetFormJuzAkhir(Number(existingCfg.tahunanJuzAkhir) || 30);
      setTargetFormSuratAwal(existingCfg.tahunanSuratAwal || 'Al-Mulk');
      setTargetFormAyatAwal(Number(existingCfg.tahunanAyatAwal) || 1);
      setTargetFormSuratAkhir(existingCfg.tahunanSuratAkhir || 'Al-Mursalat');
      setTargetFormAyatAkhir(Number(existingCfg.tahunanAyatAkhir) || 50);
      setTargetFormJilidAwal(Number(existingCfg.tahunanJilidAwal) || 1);
      setTargetFormHalamanAwal(Number(existingCfg.tahunanHalamanAwal) || 1);
      setTargetFormJilidAkhir(Number(existingCfg.tahunanJilidAkhir) || 1);
      setTargetFormHalamanAkhir(Number(existingCfg.tahunanHalamanAkhir) || 10);
      setTargetFormBulanDuration(Number(existingCfg.tahunanBulanDuration) || 12);
      setTargetFormActiveQuarter(existingCfg.activeSTQuarter || 'q1');
      const sDay = Number(existingCfg.startDay) || 1;
      const sMonth = Number(existingCfg.startMonth) || (new Date().getMonth() + 1);
      const sYear = Number(existingCfg.startYear) || new Date().getFullYear();
      setTargetFormStartDay(sDay);
      setTargetFormStartMonth(sMonth);
      setTargetFormStartYear(sYear);
      setCalViewMonth(sMonth);
      setCalViewYear(sYear);
    } else {
      const defaultAlquranElem = availableElemenSettings.find(e => e.tipeModul === TipeModul.AL_QURAN);
      setTargetFormElemenId(defaultAlquranElem?.id || availableElemenSettings[0]?.id || '');
      setTargetFormModulType('Al-Quran');
      const defaultNonQ = moduls.find(m => m.tipe !== TipeModul.AL_QURAN);
      setTargetFormNonQuranModulId(defaultNonQ?.id || '');
      setTargetFormPeriod('tahunan');
      setTargetFormQuranMode('juz');
      setTargetFormJuzAwal(30);
      setTargetFormJuzAkhir(30);
      setTargetFormSuratAwal('An-Naba\'');
      setTargetFormAyatAwal(1);
      setTargetFormSuratAkhir('An-Nas');
      setTargetFormAyatAkhir(6);
      setTargetFormJilidAwal(1);
      setTargetFormHalamanAwal(1);
      setTargetFormJilidAkhir(1);
      setTargetFormHalamanAkhir(10);
      setTargetFormBulanDuration(12);
      setTargetFormActiveQuarter('q1');
      const now = new Date();
      setTargetFormStartDay(1);
      setTargetFormStartMonth(now.getMonth() + 1);
      setTargetFormStartYear(now.getFullYear());
      setCalViewMonth(now.getMonth() + 1);
      setCalViewYear(now.getFullYear());
    }
    setIsTargetModalOpen(true);
  };

  const openTargetModalForSiswa = (siswaId: string) => {
    setTargetModalMode('siswa');
    setTargetModalSiswaId(siswaId);
    const sTarget = studentTargets[siswaId];
    const isCustom = sTarget?.isCustom === true;
    setTargetFormIsCustom(isCustom);
    const cfgToLoad = (isCustom && sTarget?.config) ? sTarget.config : myHalaqah?.targetConfig;
    if (cfgToLoad) {
      const cfgModulType = cfgToLoad.selectedModulType || 'Al-Quran';
      setTargetFormModulType(cfgModulType);
      const candidateElemenId = cfgToLoad.selectedElemenId || cfgToLoad.quarters?.q1ElemenId || '';
      const elemExists = availableElemenSettings.some(e => e.id === candidateElemenId);
      const matchedModulElem = availableElemenSettings.find(e => 
        cfgModulType === 'Al-Quran' ? e.tipeModul === TipeModul.AL_QURAN : e.tipeModul !== TipeModul.AL_QURAN
      );
      setTargetFormElemenId(elemExists ? candidateElemenId : (matchedModulElem?.id || availableElemenSettings[0]?.id || ''));
      const nonQList = moduls.filter(m => m.tipe !== TipeModul.AL_QURAN);
      const initialNonQ = cfgToLoad.selectedNonQuranModulId && nonQList.some(m => m.id === cfgToLoad.selectedNonQuranModulId)
        ? cfgToLoad.selectedNonQuranModulId
        : (nonQList[0]?.id || '');
      setTargetFormNonQuranModulId(initialNonQ);
      setTargetFormPeriod(cfgToLoad.targetPeriod || 'tahunan');
      if (isPaketFatihahAnnasKausar(cfgToLoad)) {
        setTargetFormQuranMode('paket_pemula');
      } else {
        setTargetFormQuranMode(cfgToLoad.tahunanMode || (cfgToLoad.tahunanJuzAwal ? 'juz' : 'surat'));
      }
      setTargetFormJuzAwal(Number(cfgToLoad.tahunanJuzAwal) || 30);
      setTargetFormJuzAkhir(Number(cfgToLoad.tahunanJuzAkhir) || 30);
      setTargetFormSuratAwal(cfgToLoad.tahunanSuratAwal || 'Al-Mulk');
      setTargetFormAyatAwal(Number(cfgToLoad.tahunanAyatAwal) || 1);
      setTargetFormSuratAkhir(cfgToLoad.tahunanSuratAkhir || 'Al-Mursalat');
      setTargetFormAyatAkhir(Number(cfgToLoad.tahunanAyatAkhir) || 50);
      setTargetFormJilidAwal(Number(cfgToLoad.tahunanJilidAwal) || 1);
      setTargetFormHalamanAwal(Number(cfgToLoad.tahunanHalamanAwal) || 1);
      setTargetFormJilidAkhir(Number(cfgToLoad.tahunanJilidAkhir) || 1);
      setTargetFormHalamanAkhir(Number(cfgToLoad.tahunanHalamanAkhir) || 10);
      setTargetFormBulanDuration(Number(cfgToLoad.tahunanBulanDuration) || 12);
      setTargetFormActiveQuarter(cfgToLoad.activeSTQuarter || 'q1');
      const sDay = Number(cfgToLoad.startDay) || 1;
      const sMonth = Number(cfgToLoad.startMonth) || (new Date().getMonth() + 1);
      const sYear = Number(cfgToLoad.startYear) || new Date().getFullYear();
      setTargetFormStartDay(sDay);
      setTargetFormStartMonth(sMonth);
      setTargetFormStartYear(sYear);
      setCalViewMonth(sMonth);
      setCalViewYear(sYear);
    } else {
      const defaultAlquranElem = availableElemenSettings.find(e => e.tipeModul === TipeModul.AL_QURAN);
      setTargetFormElemenId(defaultAlquranElem?.id || availableElemenSettings[0]?.id || '');
      setTargetFormModulType('Al-Quran');
      const defaultNonQ = moduls.find(m => m.tipe !== TipeModul.AL_QURAN);
      setTargetFormNonQuranModulId(defaultNonQ?.id || '');
      setTargetFormPeriod('tahunan');
      setTargetFormQuranMode('juz');
      setTargetFormJuzAwal(30);
      setTargetFormJuzAkhir(30);
      setTargetFormSuratAwal('An-Naba\'');
      setTargetFormAyatAwal(1);
      setTargetFormSuratAkhir('An-Nas');
      setTargetFormAyatAkhir(6);
      setTargetFormJilidAwal(1);
      setTargetFormHalamanAwal(1);
      setTargetFormJilidAkhir(1);
      setTargetFormHalamanAkhir(10);
      setTargetFormBulanDuration(12);
      setTargetFormActiveQuarter('q1');
      const now = new Date();
      setTargetFormStartDay(1);
      setTargetFormStartMonth(now.getMonth() + 1);
      setTargetFormStartYear(now.getFullYear());
      setCalViewMonth(now.getMonth() + 1);
      setCalViewYear(now.getFullYear());
    }
    setIsTargetModalOpen(true);
  };

  const handleSaveTargetModal = async () => {
    if (targetModalMode === 'halaqah') {
      if (!myHalaqah || !myHalaqah.id) {
        alert('Halaqah tidak ditemukan.');
        return;
      }
      const newCfg = buildConfigFromForm();
      const compiledText = compileTargetStrings(newCfg);
      await updateHalaqah(myHalaqah.id, {
        targetConfigEnabled: true,
        targetConfig: newCfg,
        targetConfigText: compiledText,
      });
      addLog('Pengaturan Target Halaqah', `Guru memperbarui target capaian pembelajaran halaqah: ${myHalaqah.namaHalaqah}`);
      setIsTargetModalOpen(false);
      alert(`Target Pembelajaran untuk Halaqah ${myHalaqah.namaHalaqah} berhasil disimpan dan diaktifkan!`);
    } else {
      if (!targetModalSiswaId) return;
      const targetSiswaObj = myStudents.find(s => s.id === targetModalSiswaId);
      const updatedTargets = { ...studentTargets };
      ensureStudentTarget(updatedTargets, targetModalSiswaId);
      if (!targetFormIsCustom) {
        updatedTargets[targetModalSiswaId] = {
          ...updatedTargets[targetModalSiswaId],
          isCustom: false,
        };
        addLog('Reset Target Siswa', `Guru mengembalikan target santri ${targetSiswaObj?.namaLengkap || ''} sesuai target halaqah`);
        await saveStudentTargets(updatedTargets);
        setIsTargetModalOpen(false);
        alert(`Target ${targetSiswaObj?.namaLengkap || 'Santri'} berhasil diset mengikuti target halaqah.`);
      } else {
        const customCfg = buildConfigFromForm();
        const compiledText = compileTargetStrings(customCfg);
        updatedTargets[targetModalSiswaId] = {
          ...updatedTargets[targetModalSiswaId],
          isCustom: true,
          config: customCfg,
          pekanan: compiledText.pekanan,
          bulanan: compiledText.bulanan,
          kuartal: compiledText.kuartal,
          semester: compiledText.semester,
          tahunan: compiledText.tahunan,
        };
        addLog('Target Khusus Siswa', `Guru menetapkan target khusus untuk santri ${targetSiswaObj?.namaLengkap || ''}`);
        await saveStudentTargets(updatedTargets);
        setIsTargetModalOpen(false);
        alert(`Target khusus untuk ${targetSiswaObj?.namaLengkap || 'Santri'} berhasil disimpan!`);
      }
    }
  };

  const handleToggleHalaqahTargetStatus = async () => {
    if (!myHalaqah || !myHalaqah.id) return;
    const currentStatus = myHalaqah.targetConfigEnabled === true;
    if (currentStatus) {
      if (confirm(`Nonaktifkan target pembelajaran untuk halaqah ${myHalaqah.namaHalaqah}?`)) {
        await updateHalaqah(myHalaqah.id, { targetConfigEnabled: false });
        addLog('Nonaktifkan Target Halaqah', `Guru menonaktifkan target halaqah: ${myHalaqah.namaHalaqah}`);
      }
    } else {
      if (!myHalaqah.targetConfig) {
        openTargetModalForHalaqah();
      } else {
        await updateHalaqah(myHalaqah.id, { targetConfigEnabled: true });
        addLog('Aktifkan Target Halaqah', `Guru mengaktifkan kembali target halaqah: ${myHalaqah.namaHalaqah}`);
      }
    }
  };

  const handleResetAllStudentsToHalaqah = async () => {
    const hasCustom = myStudents.some(s => studentTargets[s.id]?.isCustom === true);
    if (!hasCustom) {
      alert('Semua santri di halaqah ini sudah mengikuti target halaqah.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menyamakan target SEMUA santri di halaqah ${myHalaqah?.namaHalaqah} agar mengikuti target halaqah?`)) {
      const updated = { ...studentTargets };
      myStudents.forEach(s => {
        if (updated[s.id]) {
          updated[s.id] = {
            ...updated[s.id],
            isCustom: false,
          };
        }
      });
      await saveStudentTargets(updated);
      addLog('Reset Semua Target Santri', `Guru menyamakan seluruh target santri halaqah ${myHalaqah?.namaHalaqah} ke target halaqah`);
      alert('Berhasil menyamakan seluruh target santri ke target halaqah!');
    }
  };

  // Auto set evalMonthIdx based on target duration
  useEffect(() => {
    if (activeTargetTab === 'progress') {
      const config = myHalaqah?.targetConfig || generalTargets?.config;
      if (config) {
        const duration = config.tahunanBulanDuration || 12;
        setEvalMonthIdx(duration - 1);
      }
    }
  }, [activeTargetTab, myHalaqah?.targetConfig, generalTargets?.config]);

  // Target students filter
  const targetStudents = useMemo(() => {
    if (!myHalaqah) return [];
    if (myHalaqah.targetConfigEnabled === true) {
      return myStudents;
    }
    return myStudents.filter(siswa => {
      const savedTarget = studentTargets[siswa.id];
      return savedTarget && savedTarget.isCustom === true && (savedTarget as any).showTarget !== false;
    });
  }, [myHalaqah, myStudents, studentTargets]);

  // Compute student progress metrics
  const studentProgressMetrics = useMemo(() => {
    return targetStudents.map(siswa => {
      const savedTarget = studentTargets[siswa.id];
      const studentHalaqah = halaqahs.find(h => h.id === siswa.halaqahId) || myHalaqah;
      const config = (savedTarget?.isCustom && savedTarget?.config)
        ? savedTarget.config
        : (studentHalaqah?.targetConfig || generalTargets?.config);
      const isTargetEnabled = !!(studentHalaqah && studentHalaqah.targetConfigEnabled === true);
      const isQuran = config?.selectedModulType === 'Al-Quran';
      const isNonQuran = config?.selectedModulType === 'Selain Al-Quran';
      const { id: qElemenId, nama: elementName } = resolveTargetElement(config, elemenSettings);

      const finishedSetorans = setorans.filter(s => {
        if (!isMatchingStudent(s, siswa) || !isSetoranLulus(s)) return false;
        const sElemName = (s.jenisSetoran || '').toLowerCase().trim();
        const targetElemName = elementName.toLowerCase().trim();
        const targetElemId = (qElemenId || '').toLowerCase().trim();
        const isElemMatch = sElemName === targetElemName || (targetElemId && sElemName === targetElemId) || isRelatedElem(s.jenisSetoran || '', elementName);
        if (!isElemMatch) return false;
        if (isQuran || s.tipeModul === TipeModul.AL_QURAN || s.tipeModul === ('Al-Quran' as any)) {
          const sSub = (s.tipeTahfidz || '').toLowerCase().trim();
          if (sSub && (sSub.includes('murojaah') || sSub.includes('murajaah') || sSub.includes('ulang'))) {
            return false;
          }
        }
        return true;
      });

      const completedCount = finishedSetorans.length;
      let percent = 0;

      if (config?.targetPeriod === 'tahunan') {
        if (isQuran) {
          const range = getQuranTargetRange(config);
          if (range) {
            const targetVersesSet = buildVersesSetInRange(range.sAwalNo, range.aAwal, range.sAkhirNo, range.aAkhir, config);
            const memorizedVersesSet = new Set<string>();
            finishedSetorans.forEach(s => {
              if (s.tipeModul === TipeModul.AL_QURAN && s.suratNama) {
                const sNo = getSurahNumber(s.suratNama);
                for (let a = (s.ayatAwal || 1); a <= (s.ayatAkhir || 1); a++) {
                  memorizedVersesSet.add(`${sNo}-${a}`);
                }
              }
            });
            if (targetVersesSet.size > 0) {
              let intersectionCount = 0;
              targetVersesSet.forEach(v => {
                if (memorizedVersesSet.has(v)) intersectionCount++;
              });
              percent = Math.round((intersectionCount / targetVersesSet.size) * 100);
            } else {
              percent = completedCount > 0 ? 100 : 0;
            }
          } else {
            percent = completedCount > 0 ? 100 : 0;
          }
        } else if (isNonQuran) {
          percent = Math.min(100, Math.round((completedCount / 10) * 100));
        } else {
          percent = Math.min(100, Math.round((completedCount / 10) * 100));
        }
      } else {
        percent = Math.min(100, Math.round((completedCount / 5) * 100));
      }

      if (!config && !savedTarget) {
        percent = completedCount > 0 ? Math.min(100, Math.round((completedCount / 5) * 100)) : 15;
      }

      return {
        siswa,
        percent,
        isCustom: !!savedTarget?.isCustom,
        isTargetEnabled
      };
    });
  }, [targetStudents, studentTargets, halaqahs, myHalaqah, generalTargets, elemenSettings, setorans]);

  // Monthly evaluation metrics
  const monthlyEvaluationMetrics = useMemo(() => {
    let totalTargeted = 0;
    const reached: typeof studentProgressMetrics = [];
    const missed: typeof studentProgressMetrics = [];

    studentProgressMetrics.forEach(p => {
      const studentHalaqah = halaqahs.find(h => h.id === p.siswa.halaqahId) || myHalaqah;
      const savedTarget = studentTargets[p.siswa.id];
      const config = (savedTarget?.isCustom && savedTarget?.config)
        ? savedTarget.config
        : (studentHalaqah?.targetConfig || generalTargets?.config);

      if (!config || config.targetPeriod !== 'tahunan') return;
      totalTargeted++;

      const isMet = checkStudentTargetMetForMonth(
        p.siswa.id,
        evalMonthIdx,
        studentHalaqah,
        studentTargets,
        generalTargets,
        setorans,
        moduls,
        elemenSettings
      );

      if (isMet) {
        reached.push(p);
      } else {
        missed.push(p);
      }
    });

    const percentReached = totalTargeted > 0 ? Math.round((reached.length / totalTargeted) * 100) : 0;
    const percentMissed = totalTargeted > 0 ? Math.round((missed.length / totalTargeted) * 100) : 0;

    return {
      totalTargeted,
      reached,
      missed,
      percentReached,
      percentMissed
    };
  }, [studentProgressMetrics, evalMonthIdx, studentTargets, halaqahs, myHalaqah, generalTargets, setorans, moduls, elemenSettings]);

  // Exports
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text('RAPOR TARGET & PROGRES SANTRI', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Halaqah: ${myHalaqah?.namaHalaqah || '-'} | Guru: ${myUser?.namaLengkap || myGuruObj?.namaLengkap || '-'}`, 14, 26);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);
    doc.line(14, 36, 196, 36);

    doc.setFillColor(241, 245, 249);
    doc.rect(14, 44, 182, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('No', 16, 49.5);
    doc.text('Nama Santri', 26, 49.5);
    doc.text('NIS', 85, 49.5);
    doc.text('Kelas', 115, 49.5);
    doc.text('Target Tercapai', 150, 49.5);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let y = 58;
    studentProgressMetrics.forEach((p, index) => {
      doc.text((index + 1).toString(), 16, y);
      doc.text(p.siswa.namaLengkap, 26, y);
      doc.text(p.siswa.nis, 85, y);
      doc.text(p.siswa.kelasNama || '-', 115, y);
      doc.text(`${p.percent}% Selesai`, 150, y);
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    const halaqahName = (myHalaqah?.namaHalaqah || 'Halaqah').replace(/\s+/g, '_');
    doc.save(`Target_Perkembangan_Santri_${halaqahName}.pdf`);
  };

  const exportToExcel = () => {
    const worksheetData = studentProgressMetrics.map((p, index) => {
      const targetsVal = studentTargets[p.siswa.id];
      const studentHalaqah = halaqahs.find(h => h.id === p.siswa.halaqahId) || myHalaqah;
      const config = (targetsVal?.isCustom && targetsVal?.config) ? targetsVal.config : (studentHalaqah?.targetConfig || generalTargets?.config);
      const targetRange = formatTargetRange(config, moduls);
      const targetPeriod = formatTargetPeriod(config);
      const latestCapaian = getLatestCapaianNarative(p.siswa.id, config, setorans, elemenSettings);

      return {
        'No': index + 1,
        'Nama Santri': p.siswa.namaLengkap,
        'NIS': p.siswa.nis,
        'Kelas': p.siswa.kelasNama || '-',
        'Kepatuhan (%)': `${p.percent}%`,
        'Target Ditentukan': `${targetRange} (${targetPeriod})`,
        'Capaian Saat Ini': latestCapaian
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Target & Progres');
    const halaqahName = (myHalaqah?.namaHalaqah || 'Halaqah').replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Target_Perkembangan_Santri_${halaqahName}.xlsx`);
  };

  const saveToGoogleDrive = async (fileName: string) => {
    setUploadingToDrive(fileName);
    setTimeout(() => {
      setUploadingToDrive(null);
      exportToPDF();
      alert('Rapor Progress berhasil disiapkan!');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Target &amp; Progres Pencapaian Siswa</h2>
          <p className="text-xs text-slate-400">Pemisahan manajemen penetapan target berjenjang dan pemantauan serta rekapitulasi real-time progress siswa</p>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button 
            onClick={exportToPDF}
            className="p-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cetak Rapor Progress (PDF)</span>
          </button>
          <button 
            onClick={exportToExcel}
            className="p-2 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>
          <button 
            onClick={() => saveToGoogleDrive('Target_Perkembangan_Santri')}
            disabled={!!uploadingToDrive}
            className="p-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1.5 shadow-xs"
          >
            <Cloud className="w-4 h-4" />
            <span>{uploadingToDrive ? 'Menyimpan...' : 'Simpan ke Drive (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTargetTab('progress')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTargetTab === 'progress'
              ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          📊 Progres Pencapaian Siswa
        </button>
        <button
          onClick={() => setActiveTargetTab('manage')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTargetTab === 'manage'
              ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          🎯 Pengaturan Target Siswa
        </button>
      </div>

      {/* TAB CONTENT: PROGRESS PENCAPAIAN SISWA */}
      {activeTargetTab === 'progress' && (
        isProgressTabAvailable ? (
        <div className="space-y-6">
          {/* COMPONENT: BULANAN TARGET EVALUATOR */}
          {myHalaqah?.targetConfigEnabled === true && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-900/60 dark:to-slate-950 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-850/80 shadow-xs space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-850/80">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/30">
                    <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Evaluasi Pencapaian Target Bulanan</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Analisis pencapaian target santri pada akhir bulan pilihan secara real-time</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3.5 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2 font-mono">Pilih Bulan Evaluasi:</span>
                  <select
                    value={evalMonthIdx}
                    onChange={(e) => setEvalMonthIdx(Number(e.target.value))}
                    className="p-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <option key={idx} value={idx}>
                        Bulan {idx + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {monthlyEvaluationMetrics.totalTargeted === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl bg-amber-500/5 border border-amber-500/10 text-slate-500 dark:text-slate-400 text-xs max-w-2xl mx-auto space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Target Bulanan / Tahunan Belum Aktif</p>
                  <p className="leading-relaxed">
                    Evaluasi bulanan hanya tersedia untuk target dengan jangka waktu <strong>Per Tahun (Tahunan)</strong>. Saat ini, halaqah Anda menggunakan target jangka pendek atau belum menetapkan target tahunan.
                  </p>
                  <button
                    onClick={() => setActiveTargetTab('manage')}
                    className="mt-2 p-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Konfigurasi Target Tahunan Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Target Description Banner */}
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest font-mono">🎯 Target Bulan {evalMonthIdx + 1}</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                        {getTargetTextForMonth(myHalaqah?.targetConfig || generalTargets?.config, evalMonthIdx, moduls)}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Status Kelompok</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                        {monthlyEvaluationMetrics.reached.length} / {monthlyEvaluationMetrics.totalTargeted} Santri ({monthlyEvaluationMetrics.percentReached}%) Lulus Target
                      </span>
                    </div>
                  </div>

                  {/* Main Layout Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* CARD 1: OVERALL GRAPH & STATISTICS */}
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850/80 shadow-xs flex flex-col justify-between space-y-6">
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Ringkasan Evaluasi</span>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">Metrik Bulan {evalMonthIdx + 1}</h4>
                      </div>

                      {/* Radial Progress Display */}
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-slate-100 dark:stroke-slate-900 fill-transparent"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className="stroke-emerald-500 dark:stroke-emerald-400 fill-transparent transition-all duration-1000 ease-out"
                              strokeWidth="8"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 - (251.2 * monthlyEvaluationMetrics.percentReached) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{monthlyEvaluationMetrics.percentReached}%</span>
                            <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider font-mono">Tercapai</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 text-center leading-relaxed font-medium">
                          Sebanyak <strong>{monthlyEvaluationMetrics.reached.length}</strong> dari <strong>{monthlyEvaluationMetrics.totalTargeted}</strong> santri telah berhasil mencapai atau melampaui target sampai dengan batas akhir Bulan {evalMonthIdx + 1}.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-900">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono block">Lulus Target</span>
                          <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">{monthlyEvaluationMetrics.reached.length}</span>
                        </div>
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center">
                          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase font-mono block">Belum Lulus</span>
                          <span className="text-lg font-black text-rose-700 dark:text-rose-300 font-mono">{monthlyEvaluationMetrics.missed.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: SANTRI YANG TELAH LULUS TARGET */}
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850/80 shadow-xs flex flex-col space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Santri Lulus Target ({monthlyEvaluationMetrics.reached.length})</h4>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                          {monthlyEvaluationMetrics.percentReached}%
                        </span>
                      </div>

                      {monthlyEvaluationMetrics.reached.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs space-y-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                            ✕
                          </div>
                          <p>Belum ada santri yang menyelesaikan target Bulan {evalMonthIdx + 1}.</p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1">
                          {monthlyEvaluationMetrics.reached.map(p => (
                            <div key={p.siswa.id} className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 rounded-xl flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar namaLengkap={p.siswa.namaLengkap} fotoProfil={p.siswa.fotoProfil} className="w-8 h-8 text-[10px]" />
                                <div>
                                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">{p.siswa.namaLengkap}</h5>
                                  <span className="text-[10px] text-slate-400 font-mono">NIS: {p.siswa.nis}</span>
                                </div>
                              </div>
                              <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                                {p.percent}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CARD 3: SANTRI YANG BELUM LULUS TARGET */}
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850/80 shadow-xs flex flex-col space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Santri Belum Lulus ({monthlyEvaluationMetrics.missed.length})</h4>
                        </div>
                        <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                          {monthlyEvaluationMetrics.percentMissed}%
                        </span>
                      </div>

                      {monthlyEvaluationMetrics.missed.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs space-y-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                            ✓
                          </div>
                          <p className="text-emerald-600 font-bold">Luar biasa! Seluruh santri berhasil mencapai target Bulan {evalMonthIdx + 1}.</p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1">
                          {monthlyEvaluationMetrics.missed.map(p => (
                            <div key={p.siswa.id} className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/30 rounded-xl flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar namaLengkap={p.siswa.namaLengkap} fotoProfil={p.siswa.fotoProfil} className="w-8 h-8 text-[10px]" />
                                <div>
                                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">{p.siswa.namaLengkap}</h5>
                                  <span className="text-[10px] text-slate-400 font-mono">NIS: {p.siswa.nis}</span>
                                </div>
                              </div>
                              <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
                                {p.percent}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW SWITCH & FILTER HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Detail Progres Capaian per Santri</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pemantauan akurat target dan pencapaian aktual masing-masing santri</p>
            </div>
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTargetDisplayView('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  targetDisplayView === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetDisplayView('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  targetDisplayView === 'table'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>
          </div>

          {/* VIEW: GRID VIEW (DEFAULT) */}
          {targetDisplayView === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {studentProgressMetrics.map((p, idx) => {
                const targetsVal = studentTargets[p.siswa.id];
                const studentHalaqah = halaqahs.find(h => h.id === p.siswa.halaqahId) || myHalaqah;
                const config = (targetsVal?.isCustom && targetsVal?.config) ? targetsVal.config : (studentHalaqah?.targetConfig || generalTargets?.config);
                const targetRange = formatTargetRange(config, moduls);
                const targetPeriod = formatTargetPeriod(config);
                const studentSetorans = (setorans || []).filter(s => isMatchingStudent(s, p.siswa));
                const studentPassedSetorans = studentSetorans.filter(isSetoranLulus);
                const latestCapaianRaw = getLatestCapaianNarative(p.siswa.id, config, setorans, elemenSettings, p.siswa);
                const latestCapaian = (latestCapaianRaw && latestCapaianRaw !== 'Belum ada capaian tercatat')
                  ? latestCapaianRaw
                  : studentPassedSetorans.length > 0
                  ? formatSetoranClean(studentPassedSetorans.sort((a, b) => (b.tanggalSetoran || '').localeCompare(a.tanggalSetoran || ''))[0])
                  : studentSetorans.length > 0
                  ? (isSetoranLulus(studentSetorans[0]) ? formatSetoranClean(studentSetorans[0]) : `${formatSetoranClean(studentSetorans[0])} (Mengulang)`)
                  : 'Belum ada capaian tercatat';
                const { nama: elementName } = resolveTargetElement(config, elemenSettings);

                return (
                  <div key={idx} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850/80 shadow-xs flex flex-col justify-between space-y-4">
                    {/* Header info */}
                    <div className="flex items-center space-x-3.5">
                      <Avatar namaLengkap={p.siswa.namaLengkap} fotoProfil={p.siswa.fotoProfil} className="w-10 h-10 text-xs" />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.siswa.namaLengkap}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">NIS: {p.siswa.nis} | Kelas: {p.siswa.kelasNama || '-'}</p>
                      </div>
                    </div>

                    {/* Status Jenjang Belajar Santri */}
                    {(() => {
                      const stg = getStudentLearningStage(p.siswa, setorans, elemenSettings);
                      if (!stg.currentStageElemen) return null;
                      return (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs">
                          <span className="font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 truncate">
                            <GitMerge className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="truncate">Level {stg.currentLevel} • {stg.currentStageElemen.nama}</span>
                          </span>
                          {stg.hasAkselerasi && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 shrink-0">
                              ⚡ Akselerasi
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Progress bar info */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Tingkat Kepatuhan Target</span>
                        <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 block font-mono">{p.percent}% Selesai</span>
                      </div>
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-850" />
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent border-r-transparent rotate-45" style={{ transform: `rotate(${(p.percent || 0) * 3.6}deg)` }} />
                        <span className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-350">{p.percent}%</span>
                      </div>
                    </div>

                    {/* Narrative Target Breakdown */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3.5 text-left text-xs">
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">🎯 Dari target yang ditentukan:</span>
                        <p className="text-slate-900 dark:text-slate-100 font-bold mt-1 text-xs leading-relaxed">
                          {targetRange}
                        </p>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono mt-0.5 block">
                          ⏱️ {targetPeriod}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">📈 Capaian Saat Ini adalah:</span>
                        <p className="text-emerald-700 dark:text-emerald-450 font-bold mt-1 text-xs leading-relaxed flex items-center gap-1.5">
                          <span>✨</span>
                          <span>{latestCapaian}</span>
                        </p>
                        <span className="text-[10px] text-slate-550 font-mono mt-1 block">
                          🏷️ Pada elemen: <span className="font-bold text-indigo-600 dark:text-indigo-400">{elementName}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW: TABLE VIEW */
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-450 dark:text-slate-400 font-mono uppercase tracking-wider bg-slate-50 dark:bg-slate-900/40">
                      <th className="py-3 px-4 font-bold">Santri</th>
                      <th className="py-3 px-4 font-bold">Target yang Ditentukan</th>
                      <th className="py-3 px-4 font-bold">Capaian Saat Ini</th>
                      <th className="py-3 px-4 font-bold text-center">Kepatuhan</th>
                      {setSelectedSiswaProfile && <th className="py-3 px-4 font-bold text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                    {studentProgressMetrics.map((p, idx) => {
                      const targetsVal = studentTargets[p.siswa.id];
                      const studentHalaqah = halaqahs.find(h => h.id === p.siswa.halaqahId) || myHalaqah;
                      const config = (targetsVal?.isCustom && targetsVal?.config) ? targetsVal.config : (studentHalaqah?.targetConfig || generalTargets?.config);
                      const targetRange = formatTargetRange(config, moduls);
                      const targetPeriod = formatTargetPeriod(config);
                      const studentSetorans = (setorans || []).filter(s => isMatchingStudent(s, p.siswa));
                      const studentPassedSetorans = studentSetorans.filter(isSetoranLulus);
                      const latestCapaianRaw = getLatestCapaianNarative(p.siswa.id, config, setorans, elemenSettings, p.siswa);
                      const latestCapaian = (latestCapaianRaw && latestCapaianRaw !== 'Belum ada capaian tercatat')
                        ? latestCapaianRaw
                        : studentPassedSetorans.length > 0
                        ? formatSetoranClean(studentPassedSetorans.sort((a, b) => (b.tanggalSetoran || '').localeCompare(a.tanggalSetoran || ''))[0])
                        : studentSetorans.length > 0
                        ? (isSetoranLulus(studentSetorans[0]) ? formatSetoranClean(studentSetorans[0]) : `${formatSetoranClean(studentSetorans[0])} (Mengulang)`)
                        : 'Belum ada capaian tercatat';
                      const { nama: elementName } = resolveTargetElement(config, elemenSettings);

                      return (
                        <tr key={p.siswa.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <Avatar namaLengkap={p.siswa.namaLengkap} fotoProfil={p.siswa.fotoProfil} className="w-8 h-8 text-[10px]" />
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs">{p.siswa.namaLengkap}</h4>
                                <p className="text-[10px] text-slate-400 font-mono">NIS: {p.siswa.nis} | Kelas: {p.siswa.kelasNama || '-'}</p>
                                {(() => {
                                  const stg = getStudentLearningStage(p.siswa, setorans, elemenSettings);
                                  if (!stg.currentStageElemen) return null;
                                  return (
                                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800">
                                      <GitMerge className="w-2.5 h-2.5" />
                                      <span>L{stg.currentLevel}: {stg.currentStageElemen.nama}</span>
                                      {stg.hasAkselerasi && <span>⚡</span>}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {targetRange}
                            </div>
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono mt-0.5">
                              ⏱️ {targetPeriod}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <span>✨</span>
                              <span>{latestCapaian}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              🏷️ {elementName}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                              <span>{p.percent}%</span>
                            </div>
                          </td>
                          {setSelectedSiswaProfile && (
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedSiswaProfile(p.siswa)}
                                className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Detail</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        ) : (
          <div className="bg-white dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center border border-amber-200 dark:border-amber-900/50">
              <Target className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Target Pembelajaran Halaqah Belum Aktif</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Halaqah <strong className="text-slate-700 dark:text-slate-200 font-bold">{myHalaqah?.namaHalaqah}</strong> saat ini belum memiliki target capaian aktif. Anda dapat mengaktifkan target halaqah atau menyetel target khusus santri agar grafik evaluasi dan progres santri dapat dihitung secara real-time.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTargetTab('manage');
                  openTargetModalForHalaqah();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center space-x-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Atur & Aktifkan Target Sekarang</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* TAB CONTENT: PENGATURAN TARGET SISWA */}
      {activeTargetTab === 'manage' && (
        <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-fade-in">
          {/* Header Tab Manage */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Pengaturan Target Pembelajaran Halaqah</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kelola dan tetapkan target capaian hafalan/modul per kuartal atau tahunan untuk seluruh anggota halaqah {myHalaqah?.namaHalaqah}.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={'px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ' + (
                myHalaqah?.targetConfigEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
              )}>
                Status: {myHalaqah?.targetConfigEnabled ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                type="button"
                onClick={handleToggleHalaqahTargetStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  myHalaqah?.targetConfigEnabled
                    ? 'bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-300 dark:border-slate-800'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                {myHalaqah?.targetConfigEnabled ? 'Nonaktifkan Target' : 'Aktifkan Target'}
              </button>
              <button
                type="button"
                onClick={openTargetModalForHalaqah}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Atur Target Halaqah</span>
              </button>
            </div>
          </div>

          {myHalaqah?.targetConfigEnabled ? (
            <>
              {/* Halaqah Target Info Summary Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-850/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>Target Saat Ini ({myHalaqah?.namaHalaqah || 'Halaqah'})</span>
                  </h4>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={openTargetModalForHalaqah}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Ubah Target</span>
                    </button>
                    {isProgressTabAvailable && (
                      <button
                        type="button"
                        onClick={() => setActiveTargetTab('progress')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Lihat Progres Real-time</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Elemen Capaian</span>
                    <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mt-1">
                      🏷️ {resolveTargetElement(myHalaqah?.targetConfig || generalTargets?.config, elemenSettings).nama}
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Rentang Target</span>
                    <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mt-1">
                      {formatTargetRange(myHalaqah?.targetConfig || generalTargets?.config, moduls)}
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Periode & Durasi</span>
                    <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mt-1">
                      {formatTargetPeriod(myHalaqah?.targetConfig || generalTargets?.config)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Student Target List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Daftar Target Individual Santri ({myStudents.length} Santri)
                  </h4>
                  {myStudents.some(s => studentTargets[s.id]?.isCustom === true) && (
                    <button
                      type="button"
                      onClick={handleResetAllStudentsToHalaqah}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Samakan Semua ke Target Halaqah</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myStudents.map((siswa) => {
                    const tVal = studentTargets[siswa.id];
                    const isCustom = tVal?.isCustom === true;
                    const cfg = (isCustom && tVal?.config) ? tVal.config : (myHalaqah?.targetConfig || generalTargets?.config);
                    const range = formatTargetRange(cfg, moduls);
                    const period = formatTargetPeriod(cfg);
                    const targetElem = resolveTargetElement(cfg, elemenSettings);

                    return (
                      <div key={siswa.id} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-850/80 flex flex-col justify-between space-y-3 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition shadow-2xs">
                        {/* Header Santri */}
                        <div className="flex items-center space-x-2.5">
                          <Avatar namaLengkap={siswa.namaLengkap} fotoProfil={siswa.fotoProfil} className="w-10 h-10 text-xs shrink-0" />
                          <div className="overflow-hidden flex-1">
                            <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate">{siswa.namaLengkap}</h5>
                            <span className="text-[10px] text-slate-400 font-mono block">NIS: {siswa.nis} | {siswa.kelasNama || myHalaqah?.namaHalaqah || '-'}</span>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-900/40">
                                🏷️ {targetElem.nama}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Detail Target Capaian Santri */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-medium">Status Target:</span>
                            <span className={isCustom 
                              ? "font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded-md text-[10px]" 
                              : "font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-md text-[10px]"
                            }>
                              {isCustom ? "Khusus / Mandiri" : "Sesuai Halaqah"}
                            </span>
                          </div>

                          {/* Info Target (Tampil untuk semua santri: baik yang custom maupun yang mengikuti halaqah) */}
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between gap-1 text-[9.5px]">
                              <span className="font-bold text-slate-400 uppercase tracking-wider font-mono">
                                Elemen Capaian:
                              </span>
                              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 truncate">
                                {targetElem.nama}
                              </span>
                            </div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-2">
                              {range}
                            </p>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
                              <span>{period}</span>
                              {!isCustom && (
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold italic">
                                  (Target Halaqah)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Tahapan Prasyarat Kurikulum Berjenjang (Sebagai referensi jika ada, dengan label jelas agar tidak tertukar dengan target) */}
                          {(() => {
                            const stg = getStudentLearningStage(siswa, setorans, elemenSettings);
                            if (!stg.currentStageElemen) return null;
                            return (
                              <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-850 px-2 py-1 rounded-lg border border-slate-200/50 dark:border-slate-800">
                                <span className="flex items-center gap-1 truncate" title="Tahapan Prasyarat Pembelajaran Berjenjang">
                                  <GitMerge className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                                  <span className="truncate">Tahap Prasyarat: <strong className="text-purple-700 dark:text-purple-300">Level {stg.currentLevel} ({stg.currentStageElemen.nama})</strong></span>
                                </span>
                                {stg.hasAkselerasi && <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-1">⚡ Akselerasi</span>}
                              </div>
                            );
                          })()}
                        </div>
                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openTargetModalForSiswa(siswa.id)}
                            className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 transition cursor-pointer flex items-center justify-center space-x-1"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Atur Target</span>
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              title="Kembalikan target santri ke target umum halaqah"
                              onClick={async () => {
                                if (confirm(`Kembalikan target ${siswa.namaLengkap} agar mengikuti target halaqah?`)) {
                                  const updated = { ...studentTargets };
                                  if (updated[siswa.id]) {
                                    updated[siswa.id] = { ...updated[siswa.id], isCustom: false };
                                  }
                                  await saveStudentTargets(updated);
                                  addLog('Reset Target Siswa', `Guru mengembalikan target santri ${siswa.namaLengkap} ke target halaqah`);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-200 dark:hover:border-amber-900/50 transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* MODAL: PENGATURAN TARGET (HALAQAH & SISWA) */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {targetModalMode === 'halaqah' 
                      ? `Atur Target Halaqah: ${myHalaqah?.namaHalaqah || ''}`
                      : `Atur Target Santri: ${myStudents.find(s => s.id === targetModalSiswaId)?.namaLengkap || ''}`
                    }
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {targetModalMode === 'halaqah'
                      ? 'Target capaian umum yang berlaku untuk semua santri di halaqah ini'
                      : `NIS: ${myStudents.find(s => s.id === targetModalSiswaId)?.nis || '-'} | Kelas: ${myStudents.find(s => s.id === targetModalSiswaId)?.kelasNama || '-'}`
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Mode Siswa: Switch Target Halaqah vs Mandiri */}
              {targetModalMode === 'siswa' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-850/80 space-y-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                    Tipe Target Santri:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetFormIsCustom(false)}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        !targetFormIsCustom
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <span>Sesuai Target Halaqah</span>
                      <span className={`text-[10px] font-normal ${!targetFormIsCustom ? 'text-indigo-100' : 'text-slate-400'}`}>Otomatis sinkron</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetFormIsCustom(true)}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        targetFormIsCustom
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                      }`}
                    >
                      <span>Target Khusus / Mandiri</span>
                      <span className={`text-[10px] font-normal ${targetFormIsCustom ? 'text-amber-100' : 'text-slate-400'}`}>Tentukan sendiri</span>
                    </button>
                  </div>
                  {!targetFormIsCustom && (
                    <div className="mt-3 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <p className="text-[11px] leading-relaxed">
                        Santri ini akan mengikuti target capaian yang ditetapkan untuk halaqah:
                        <br />
                        <strong className="text-slate-900 dark:text-white font-bold block mt-1">
                          {formatTargetRange(myHalaqah?.targetConfig || generalTargets?.config, moduls)}
                        </strong>
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                          {formatTargetPeriod(myHalaqah?.targetConfig || generalTargets?.config)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Form fields */}
              {(targetModalMode === 'halaqah' || targetFormIsCustom) && (
                <div className="space-y-4">
                  {/* Elemen Pembelajaran */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase font-mono tracking-wider block">
                      Elemen Capaian Pembelajaran:
                    </label>
                    <select
                      value={targetFormElemenId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setTargetFormElemenId(newId);
                        const selectedEl = availableElemenSettings.find(el => el.id === newId);
                        if (selectedEl) {
                          if (selectedEl.tipeModul === TipeModul.AL_QURAN && targetFormModulType !== 'Al-Quran') {
                            setTargetFormModulType('Al-Quran');
                          } else if (selectedEl.tipeModul !== TipeModul.AL_QURAN) {
                            if (targetFormModulType !== 'Selain Al-Quran') {
                              setTargetFormModulType('Selain Al-Quran');
                            }
                            const nonQList = moduls.filter(m => m.tipe !== TipeModul.AL_QURAN);
                            if (selectedEl.referensiModulId && nonQList.some(m => m.id === selectedEl.referensiModulId)) {
                              setTargetFormNonQuranModulId(selectedEl.referensiModulId);
                            } else if (!targetFormNonQuranModulId || !nonQList.some(m => m.id === targetFormNonQuranModulId)) {
                              if (nonQList.length > 0) setTargetFormNonQuranModulId(nonQList[0].id);
                            }
                          }
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableElemenSettings.map((el) => (
                        <option key={el.id} value={el.id}>
                          {el.nama} {el.tipeModul === TipeModul.AL_QURAN ? "(Al-Qur'an)" : "(Selain Al-Qur'an)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipe Modul */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase font-mono tracking-wider block">
                      Jenis Modul Pembelajaran:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetFormModulType('Al-Quran');
                          const alquranElems = availableElemenSettings.filter(e => e.tipeModul === TipeModul.AL_QURAN);
                          if (alquranElems.length > 0 && !alquranElems.some(e => e.id === targetFormElemenId)) {
                            setTargetFormElemenId(alquranElems[0].id);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                          targetFormModulType === 'Al-Quran'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Al-Qur'an (Tahfidz)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetFormModulType('Selain Al-Quran');
                          const nonQuranElems = availableElemenSettings.filter(e => e.tipeModul !== TipeModul.AL_QURAN);
                          if (nonQuranElems.length > 0 && !nonQuranElems.some(e => e.id === targetFormElemenId)) {
                            setTargetFormElemenId(nonQuranElems[0].id);
                          }
                          const nonQList = moduls.filter(m => m.tipe !== TipeModul.AL_QURAN);
                          const curEl = availableElemenSettings.find(e => e.id === targetFormElemenId);
                          if (curEl?.referensiModulId && nonQList.some(m => m.id === curEl.referensiModulId)) {
                            setTargetFormNonQuranModulId(curEl.referensiModulId);
                          } else if (!targetFormNonQuranModulId || !nonQList.some(m => m.id === targetFormNonQuranModulId)) {
                            if (nonQList.length > 0) setTargetFormNonQuranModulId(nonQList[0].id);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                          targetFormModulType === 'Selain Al-Quran'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Selain Al-Qur'an (Kitab/Modul)</span>
                      </button>
                    </div>
                  </div>

                  {/* Spesifikasi Target: Al-Qur'an */}
                  {targetFormModulType === 'Al-Quran' ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-850/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase font-mono tracking-wider">
                          Mode Target Al-Qur'an:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTargetFormQuranMode('paket_pemula')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              targetFormQuranMode === 'paket_pemula'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            Paket Pemula
                          </button>
                          <button
                            type="button"
                            onClick={() => setTargetFormQuranMode('juz')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              targetFormQuranMode === 'juz'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            Mode Juz
                          </button>
                          <button
                            type="button"
                            onClick={() => setTargetFormQuranMode('surat')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              targetFormQuranMode === 'surat'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            Mode Surat & Ayat
                          </button>
                        </div>
                      </div>

                      {targetFormQuranMode === 'paket_pemula' ? (
                        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5 pt-2">
                          <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 text-xs">
                            <span>✨ Urutan Setoran Pemula (Al-Fatihah &amp; An-Nas s/d Al-Kausar):</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                            Target ditetapkan untuk <strong>Surah Al-Fatihah</strong> kemudian dilanjutkan <strong>Surah An-Nas mundur s/d Surah Al-Kausar</strong> (total 8 Surah).
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {['1. Al-Fatihah', '2. An-Nas', '3. Al-Falaq', '4. Al-Ikhlas', '5. Al-Lahab', '6. An-Nasr', '7. Al-Kafirun', '8. Al-Kausar'].map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-md text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : targetFormQuranMode === 'juz' ? (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Juz Awal:</label>
                            <select
                              value={targetFormJuzAwal}
                              onChange={(e) => setTargetFormJuzAwal(Number(e.target.value))}
                              className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {Array.from({ length: 30 }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>Juz {i + 1}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Juz Akhir:</label>
                            <select
                              value={targetFormJuzAkhir}
                              onChange={(e) => setTargetFormJuzAkhir(Number(e.target.value))}
                              className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {Array.from({ length: 30 }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>Juz {i + 1}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Surat Awal:</label>
                              <select
                                value={targetFormSuratAwal}
                                onChange={(e) => setTargetFormSuratAwal(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {SURAH_LIST.map((s) => (
                                  <option key={s.no} value={s.nama}>{s.no}. {s.nama}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Ayat Awal:</label>
                              <input
                                type="number"
                                min={1}
                                value={targetFormAyatAwal}
                                onChange={(e) => setTargetFormAyatAwal(Math.max(1, Number(e.target.value)))}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Surat Akhir:</label>
                              <select
                                value={targetFormSuratAkhir}
                                onChange={(e) => setTargetFormSuratAkhir(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {SURAH_LIST.map((s) => (
                                  <option key={s.no} value={s.nama}>{s.no}. {s.nama}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Ayat Akhir:</label>
                              <input
                                type="number"
                                min={1}
                                value={targetFormAyatAkhir}
                                onChange={(e) => setTargetFormAyatAkhir(Math.max(1, Number(e.target.value)))}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-850/80 space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase font-mono block mb-1">
                          PILIH MODUL PEMBELAJARAN:
                        </label>
                        <select
                          value={targetFormNonQuranModulId}
                          onChange={(e) => setTargetFormNonQuranModulId(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                        >
                          {moduls.filter(m => m.tipe !== TipeModul.AL_QURAN).length === 0 ? (
                            <option value="" disabled className="text-slate-500 bg-white dark:bg-slate-900">
                              -- Tidak ada modul selain Al-Qur'an (tambahkan di Kurikulum & Modul) --
                            </option>
                          ) : (
                            <>
                              {!targetFormNonQuranModulId && (
                                <option value="" disabled className="text-slate-500 bg-white dark:bg-slate-900">
                                  -- Pilih Modul Pembelajaran --
                                </option>
                              )}
                              {moduls.filter(m => m.tipe !== TipeModul.AL_QURAN).map((m) => {
                                const judul = m.judulModul || (m as any).namaModul || (m as any).nama || m.namaSurat || `Modul #${m.id}`;
                                const kategori = m.kategoriModul ? ` [${m.kategoriModul}]` : '';
                                return (
                                  <option 
                                    key={m.id} 
                                    value={m.id}
                                    className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 font-semibold py-1.5"
                                  >
                                    📖 {judul}{kategori}
                                  </option>
                                );
                              })}
                            </>
                          )}
                        </select>

                        {/* Ringkasan Modul Terpilih */}
                        {(() => {
                          const curModul = moduls.find(m => m.id === targetFormNonQuranModulId);
                          if (!curModul) return null;
                          const judul = curModul.judulModul || (curModul as any).nama || 'Modul Pembelajaran';
                          return (
                            <div className="mt-2 p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-indigo-950 dark:text-indigo-200">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span>📚 {judul}</span>
                                {curModul.kategoriModul && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-indigo-200/70 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-300 font-mono">
                                    {curModul.kategoriModul}
                                  </span>
                                )}
                              </div>
                              {curModul.isMultiJilid && curModul.jumlahJilid && curModul.jumlahJilid > 1 && (
                                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                  {curModul.jumlahJilid} Jilid
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Jilid Awal & Akhir jika Modul Multi-Jilid */}
                      {(() => {
                        const curModul = moduls.find(m => m.id === targetFormNonQuranModulId);
                        const isMulti = Boolean(curModul?.isMultiJilid && (curModul.jumlahJilid || 1) > 1);
                        return isMulti ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">
                                Jilid Awal:
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={curModul?.jumlahJilid || 20}
                                value={targetFormJilidAwal}
                                onChange={(e) => setTargetFormJilidAwal(Math.max(1, Number(e.target.value)))}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">
                                Jilid Akhir:
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={curModul?.jumlahJilid || 20}
                                value={targetFormJilidAkhir}
                                onChange={(e) => setTargetFormJilidAkhir(Math.max(1, Number(e.target.value)))}
                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Halaman Awal & Akhir */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Halaman Awal:</label>
                          <input
                            type="number"
                            min={1}
                            value={targetFormHalamanAwal}
                            onChange={(e) => setTargetFormHalamanAwal(Math.max(1, Number(e.target.value)))}
                            className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Halaman Akhir:</label>
                          <input
                            type="number"
                            min={1}
                            value={targetFormHalamanAkhir}
                            onChange={(e) => setTargetFormHalamanAkhir(Math.max(1, Number(e.target.value)))}
                            className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Periode & Durasi */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-850/80 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Periode & Durasi Pembelajaran:</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetFormPeriod('tahunan')}
                        className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          targetFormPeriod === 'tahunan'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        Tahunan (Per Bulan)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetFormPeriod('kuartal')}
                        className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          targetFormPeriod === 'kuartal'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        Kuartal (Q1 - Q4)
                      </button>
                    </div>

                    {targetFormPeriod === 'tahunan' ? (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Durasi Target (Bulan):</label>
                        <select
                          value={targetFormBulanDuration}
                          onChange={(e) => setTargetFormBulanDuration(Number(e.target.value))}
                          className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={12}>12 Bulan (1 Tahun Penuh)</option>
                          <option value={10}>10 Bulan (Tahun Ajaran Efektif)</option>
                          <option value={6}>6 Bulan (1 Semester)</option>
                          <option value={3}>3 Bulan (1 Kuartal)</option>
                          <option value={1}>1 Bulan</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Kuartal Aktif:</label>
                        <select
                          value={targetFormActiveQuarter}
                          onChange={(e) => setTargetFormActiveQuarter(e.target.value as any)}
                          className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="q1">Kuartal 1 (Bulan 1 - 3)</option>
                          <option value="q2">Kuartal 2 (Bulan 4 - 6)</option>
                          <option value="q3">Kuartal 3 (Bulan 7 - 9)</option>
                          <option value="q4">Kuartal 4 (Bulan 10 - 12)</option>
                        </select>
                      </div>
                    )}

                    {/* Fitur Menentukan Hari & Bulan Awal Mulai Target Berjalan (Fitur Kalender) */}
                    <div className="p-3.5 bg-white dark:bg-slate-950 rounded-2xl border border-indigo-150 dark:border-indigo-900/50 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-50 dark:border-indigo-950 pb-2">
                        <div>
                          <label className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>Fitur Kalender: Mulai Target Berjalan</span>
                          </label>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {targetModalMode === 'halaqah' 
                              ? 'Tentukan hari dan bulan awal target berjalan untuk halaqah ini melalui kalender' 
                              : 'Tentukan hari dan bulan awal target berjalan khusus santri ini melalui kalender'
                            }
                          </p>
                        </div>

                        {/* View Switcher: Kalender Visual vs Dropdown Manual */}
                        <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setCalendarViewMode('visual')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              calendarViewMode === 'visual'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Kalender</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCalendarViewMode('input')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              calendarViewMode === 'input'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                            }`}
                          >
                            <span>Dropdown</span>
                          </button>
                        </div>
                      </div>

                      {/* Display Selected Date Banner & Native Date Picker */}
                      {(() => {
                        const selDateObj = new Date(targetFormStartYear, targetFormStartMonth - 1, targetFormStartDay);
                        const dayNamesIndo = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        const dayName = dayNamesIndo[selDateObj.getDay()] || 'Senin';
                        const monthName = INDONESIAN_MONTH_NAMES[targetFormStartMonth - 1] || 'Januari';
                        const isoString = `${targetFormStartYear}-${String(targetFormStartMonth).padStart(2, '0')}-${String(targetFormStartDay).padStart(2, '0')}`;

                        return (
                          <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase font-mono tracking-wider flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Hari & Bulan Mulai Terpilih:
                              </span>
                              <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                                {dayName}, {targetFormStartDay} {monthName} {targetFormStartYear}
                              </p>
                            </div>

                            {/* Direct Native Date Picker Sync */}
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:inline">
                                Pilih Tanggal:
                              </label>
                              <input
                                type="date"
                                value={isoString}
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  const [y, m, d] = e.target.value.split('-').map(Number);
                                  if (y && m && d) {
                                    setTargetFormStartYear(y);
                                    setTargetFormStartMonth(m);
                                    setTargetFormStartDay(d);
                                    setCalViewYear(y);
                                    setCalViewMonth(m);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Tombol Pintas Preset */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Pilihan Cepat Waktu Mulai:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              setTargetFormStartDay(today.getDate());
                              setTargetFormStartMonth(today.getMonth() + 1);
                              setTargetFormStartYear(today.getFullYear());
                              setCalViewMonth(today.getMonth() + 1);
                              setCalViewYear(today.getFullYear());
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800 transition cursor-pointer"
                          >
                            📅 Hari Ini
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              setTargetFormStartDay(1);
                              setTargetFormStartMonth(today.getMonth() + 1);
                              setTargetFormStartYear(today.getFullYear());
                              setCalViewMonth(today.getMonth() + 1);
                              setCalViewYear(today.getFullYear());
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition cursor-pointer"
                          >
                            🗓️ Awal Bulan Ini (Tgl 1)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetFormStartDay(1);
                              setTargetFormStartMonth(7);
                              setCalViewMonth(7);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition cursor-pointer"
                          >
                            🎒 Tahun Ajaran (1 Juli)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetFormStartDay(1);
                              setTargetFormStartMonth(1);
                              setCalViewMonth(1);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition cursor-pointer"
                          >
                            🚩 Awal Tahun (1 Jan)
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: KALENDER VISUAL INTERAKTIF */}
                      {calendarViewMode === 'visual' && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                          {/* Calendar Month & Year Bar */}
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (calViewMonth === 1) {
                                  setCalViewMonth(12);
                                  setCalViewYear(prev => prev - 1);
                                } else {
                                  setCalViewMonth(prev => prev - 1);
                                }
                              }}
                              title="Bulan Sebelumnya"
                              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1.5">
                              <select
                                value={calViewMonth}
                                onChange={(e) => setCalViewMonth(Number(e.target.value))}
                                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                              >
                                {INDONESIAN_MONTH_NAMES.map((mName, idx) => (
                                  <option key={idx + 1} value={idx + 1}>
                                    {mName}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={calViewYear}
                                onChange={(e) => setCalViewYear(Number(e.target.value))}
                                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                              >
                                {Array.from({ length: 9 }, (_, i) => 2024 + i).map(year => (
                                  <option key={year} value={year}>
                                    {year}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (calViewMonth === 12) {
                                  setCalViewMonth(1);
                                  setCalViewYear(prev => prev + 1);
                                } else {
                                  setCalViewMonth(prev => prev + 1);
                                }
                              }}
                              title="Bulan Berikutnya"
                              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Day-of-Week Header (7 Columns) */}
                          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px]">
                            <span className="text-rose-500 dark:text-rose-400 py-0.5">Min</span>
                            <span className="text-slate-500 dark:text-slate-400 py-0.5">Sen</span>
                            <span className="text-slate-500 dark:text-slate-400 py-0.5">Sel</span>
                            <span className="text-slate-500 dark:text-slate-400 py-0.5">Rab</span>
                            <span className="text-slate-500 dark:text-slate-400 py-0.5">Kam</span>
                            <span className="text-emerald-600 dark:text-emerald-400 py-0.5">Jum</span>
                            <span className="text-slate-500 dark:text-slate-400 py-0.5">Sab</span>
                          </div>

                          {/* Grid of Days */}
                          {(() => {
                            const daysInMonth = new Date(calViewYear, calViewMonth, 0).getDate();
                            const firstDayOfWeek = new Date(calViewYear, calViewMonth - 1, 1).getDay(); // 0 = Min, ..., 6 = Sab
                            const today = new Date();
                            const todayDate = today.getDate();
                            const todayMonth = today.getMonth() + 1;
                            const todayYear = today.getFullYear();

                            const blanks = Array.from({ length: firstDayOfWeek });
                            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

                            return (
                              <div className="grid grid-cols-7 gap-1">
                                {blanks.map((_, idx) => (
                                  <div key={`blank-${idx}`} className="h-8 sm:h-9" />
                                ))}

                                {days.map((day) => {
                                  const isSelected = targetFormStartDay === day && targetFormStartMonth === calViewMonth && targetFormStartYear === calViewYear;
                                  const isToday = todayDate === day && todayMonth === calViewMonth && todayYear === calViewYear;

                                  return (
                                    <button
                                      key={`day-${day}`}
                                      type="button"
                                      onClick={() => {
                                        setTargetFormStartDay(day);
                                        setTargetFormStartMonth(calViewMonth);
                                        setTargetFormStartYear(calViewYear);
                                      }}
                                      className={`h-8 sm:h-9 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-400 dark:ring-indigo-300 z-10'
                                          : isToday
                                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                                            : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-750 border border-slate-200/50 dark:border-slate-750/50'
                                      }`}
                                    >
                                      <span>{day}</span>
                                      {isToday && !isSelected && (
                                        <span className="w-1 h-1 rounded-full bg-indigo-500 absolute bottom-1" />
                                      )}
                                      {isSelected && (
                                        <span className="w-1 h-1 rounded-full bg-white absolute bottom-1" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                              <span>Hari Terpilih</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full border border-indigo-400 bg-indigo-50 inline-block"></span>
                              <span>Hari Ini</span>
                            </span>
                            <span>Klik tanggal pada kalender untuk memilih</span>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: DROPDOWN MANUAL */}
                      {calendarViewMode === 'input' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                              Hari / Tanggal Mulai:
                            </label>
                            <select
                              value={targetFormStartDay}
                              onChange={(e) => {
                                const d = Math.min(31, Math.max(1, Number(e.target.value)));
                                setTargetFormStartDay(d);
                              }}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <option key={day} value={day}>
                                  Tanggal {day}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                              Bulan Mulai Target:
                            </label>
                            <select
                              value={targetFormStartMonth}
                              onChange={(e) => {
                                const m = Math.min(12, Math.max(1, Number(e.target.value)));
                                setTargetFormStartMonth(m);
                                setCalViewMonth(m);
                              }}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                              {INDONESIAN_MONTH_NAMES.map((mName, idx) => (
                                <option key={idx + 1} value={idx + 1}>
                                  {idx + 1}. {mName}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                              Tahun Mulai:
                            </label>
                            <input
                              type="number"
                              min={2020}
                              max={2035}
                              value={targetFormStartYear}
                              onChange={(e) => {
                                const y = Number(e.target.value);
                                setTargetFormStartYear(y);
                                setCalViewYear(y);
                              }}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Live Calculated Schedule Box */}
                      {(() => {
                        const computedRange = calculateTargetDateRange({
                          startDay: targetFormStartDay,
                          startMonth: targetFormStartMonth,
                          startYear: targetFormStartYear,
                          tahunanBulanDuration: targetFormBulanDuration
                        });
                        if (!computedRange) return null;
                        const sD = computedRange.startDay;
                        const sM = INDONESIAN_MONTH_NAMES[computedRange.startMonth - 1];
                        const sY = computedRange.startYear;
                        const eD = computedRange.endDate.getDate();
                        const eM = INDONESIAN_MONTH_NAMES[computedRange.endDate.getMonth()];
                        const eY = computedRange.endDate.getFullYear();

                        return (
                          <div className="p-2.5 bg-gradient-to-r from-indigo-50/90 to-teal-50/60 dark:from-indigo-950/40 dark:to-teal-950/30 rounded-xl border border-indigo-150 dark:border-indigo-900/50 text-[11px] text-indigo-950 dark:text-indigo-200 space-y-1 shadow-2xs">
                            <div className="flex flex-wrap items-center gap-1.5 font-bold">
                              <span className="text-indigo-600 dark:text-indigo-400">🗓️ Jadwal Target Berjalan:</span>
                              <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 font-extrabold">
                                {sD} {sM} {sY}
                              </span>
                              <span>s/d</span>
                              <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-extrabold">
                                {eD} {eM} {eY}
                              </span>
                            </div>
                            <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 font-mono">
                              ✓ Target aktif berjalan selama {computedRange.durationMonths} bulan terhitung sejak tanggal awal dimulai.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Live Preview Box */}
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase font-mono tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Pratinjau Rumusan Target:</span>
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatTargetRange(buildConfigFromForm(), moduls)}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {formatTargetPeriod(buildConfigFromForm())}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end space-x-2.5 bg-slate-50/50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTargetModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Terapkan Target</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
