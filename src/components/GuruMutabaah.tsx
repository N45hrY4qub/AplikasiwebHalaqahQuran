import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { ImageAnnotationCanvas } from './ImageAnnotationCanvas';
import { SiswaErrorAnalytics } from './SiswaErrorAnalytics';
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
  ListFilter,
  BookPlusIcon,
  Search,
  Book,
  BookOpen,
  Filter,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  Clock,
  Save,
  Check,
  RefreshCw,
  Users,
  ShieldAlert,
  RotateCcw,
  Cloud,
  Table,
  LayoutGrid,
  Edit2,
  Award,
  FileCheck2
} from 'lucide-react';
import { StatusAktif, JenisKelamin, Siswa, TipeModul, ElemenSetting, TajwidCategory, KategoriKesalahanPageRule, Halaqah, Setoran, isElemenAvailableForHalaqah, isPrivateHalaqah, isPrivateSetoran, isAdminUtama } from '../types';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { getQuranPageRangeString, getQuranPageNumber } from '../lib/quranPageHelper';
import { getElemenLineCountForPage, calculateTotalLinesForRange } from '../utils/lineCalculation';
import { calculateSetoranRubrikDeductions, DeductionCalculationResult } from '../utils/tajwidDeduction';
import { getTeacherHalaqahs, normalizeHalaqahKey } from '../utils/studentAttendanceHelper';
import { StandarPenilaianDokumen } from './StandarPenilaianDokumen';
import { CapaianBacaanSystem } from './CapaianBacaanSystem';
import { renderArabicEnhancedText } from '../lib/arabicHelper';
import { filterModulesForElemen, getElemenModulScopeLabel } from '../utils/targetProgressHelper';

interface GuruMutabaahProps {
  myHalaqah: any;
  myStudents: any[];
  myUser: any;
  myGuruObj: any;
  formatIndonesianDate: (dateStr: string) => string;
  addLog: (action: string, description: string) => void;
  getElemenLineCountForPage?: (
    elemen?: ElemenSetting,
    modul?: any,
    page?: number,
    jilidIndex?: number,
    quranConfig?: any
  ) => number;
  initialInnerTab?: 'input' | 'riwayat' | 'capaian_bacaan';
}

const formatArabicFontClean = (text: string): string => {
  if (!text) return '';
  // Let's trim whitespace and any invisible control characters like \r, \u200F (RLM), \u200E (LRM)
  // Menjaga tanda waqaf (صلى, قلى, ج, لا, مـ, ۛ dll.) tetap utuh sesuai mushaf Al-Quran
  return text.replace(/[\s\r\n\u200B\u200C\u200D\u200E\u200F]+$/, '').trim();
};

const toEasternArabicDigits = (num: number): string => {
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, x => easternDigits[parseInt(x)]);
};

const getEffectiveTipeKesalahan = (
  elemObj: ElemenSetting | undefined,
  activePage: number,
  activeJilid: number = 1
): { tipe: 'lahn_jaliy' | 'lahn_khafiy' | 'dasar' | 'tajwid' | 'all' | 'none', activeRule?: KategoriKesalahanPageRule } => {
  if (!elemObj) return { tipe: 'all' };
  
  if ((elemObj as any).kategoriKesalahanRules && (elemObj as any).kategoriKesalahanRules.length > 0) {
    const applicableRule = ((elemObj as any).kategoriKesalahanRules as any[]).find(rule => {
      const matchJilid = rule.jilid === undefined || rule.jilid === activeJilid;
      if (!matchJilid) return false;
      
      const matchAwal = rule.halamanAwal === undefined || activePage >= rule.halamanAwal;
      const matchAkhir = rule.halamanAkhir === undefined || activePage <= rule.halamanAkhir;
      
      return matchAwal && matchAkhir;
    });

    if (applicableRule) {
      return { tipe: applicableRule.tipeYangDigunakan, activeRule: applicableRule };
    }
  }

  return { tipe: (elemObj as any).kategoriKesalahanMode || 'all' };
};

const getValidErrorCategoriesForElemen = (
  elemObj: ElemenSetting | undefined,
  activePage: number,
  activeJilid: number = 1,
  allCategories: TajwidCategory[] = []
): {
  filteredCategories: TajwidCategory[];
  configuredTipe: 'lahn_jaliy' | 'lahn_khafiy' | 'dasar' | 'tajwid' | 'all' | 'none';
  activeRule?: KategoriKesalahanPageRule;
} => {
  const safeCats = allCategories || [];
  if (!elemObj) {
    return { filteredCategories: safeCats, configuredTipe: 'all' };
  }
  
  const { tipe: configuredTipe, activeRule } = getEffectiveTipeKesalahan(elemObj, activePage, activeJilid);
  
  if (configuredTipe === 'none') {
    return { filteredCategories: [], configuredTipe: 'none', activeRule };
  }
  
  const isJaliyRule = configuredTipe === 'dasar' || (configuredTipe as string) === 'lahn_jaliy';
  const isKhafiyRule = configuredTipe === 'tajwid' || (configuredTipe as string) === 'lahn_khafiy';

  const cats = configuredTipe === 'all'
    ? safeCats
    : isJaliyRule
      ? safeCats.filter(c => c && (c.tipe === 'lahn_jaliy' || c.tipe === 'dasar'))
      : safeCats.filter(c => c && (c.tipe === 'lahn_khafiy' || c.tipe === 'tajwid' || !c.tipe));
      
  return { filteredCategories: cats, configuredTipe, activeRule };
};

const getEmbedUrl = (url: string = '', type: 'doc' | 'slide') => {
  if (!url) return '';
  let cleanUrl = url.trim();
  const idMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    const fileId = idMatch[1];
    if (type === 'doc') {
      return `https://docs.google.com/document/d/${fileId}/pub?embedded=true`;
    } else {
      return `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`;
    }
  }
  if (cleanUrl.includes('/pub') || cleanUrl.includes('/embed')) {
    return cleanUrl;
  }
  return cleanUrl;
};



const SURAH_LIST = [
  { no: 1, nama: "Al-Fatihah" }, { no: 2, nama: "Al-Baqarah" }, { no: 3, nama: "Ali 'Imran" }, { no: 4, nama: "An-Nisa'" },
  { no: 5, nama: "Al-Ma'idah" }, { no: 6, nama: "Al-An'am" }, { no: 7, nama: "Al-A'raf" }, { no: 8, nama: "Al-Anfal" },
  { no: 9, nama: "At-Taubah" }, { no: 10, nama: "Yunus" }, { no: 11, nama: "Hud" }, { no: 12, nama: "Yusuf" },
  { no: 13, nama: "Ar-Ra'd" }, { no: 14, nama: "Ibrahim" }, { no: 15, nama: "Al-Hijr" }, { no: 16, nama: "An-Nahl" },
  { no: 17, nama: "Al-Isra'" }, { no: 18, nama: "Al-Kahf" }, { no: 19, nama: "Maryam" }, { no: 20, nama: "Taha" },
  { no: 21, nama: "Al-Anbiya'" }, { no: 22, nama: "Al-Hajj" }, { no: 23, nama: "Al-Mu'minun" }, { no: 24, nama: "An-Nur" },
  { no: 25, nama: "Al-Furqan" }, { no: 26, nama: "Asy-Syu'ara'" }, { no: 27, nama: "An-Naml" }, { no: 28, nama: "Al-Qasas" },
  { no: 29, nama: "Al-'Ankabut" }, { no: 30, nama: "Ar-Rum" }, { no: 31, nama: "Luqman" }, { no: 32, nama: "As-Sajdah" },
  { no: 33, nama: "Al-Ahzab" }, { no: 34, nama: "Saba'" }, { no: 35, nama: "Fatir" }, { no: 36, nama: "Ya Sin" },
  { no: 37, nama: "As-Saffat" }, { no: 38, nama: "Sad" }, { no: 39, nama: "Az-Zumar" }, { no: 40, nama: "Ghafir" },
  { no: 41, nama: "Fussilat" }, { no: 42, nama: "Asy-Syura" }, { no: 43, nama: "Az-Zukhruf" }, { no: 44, nama: "Ad-Dukhan" },
  { no: 45, nama: "Al-Jasiyah" }, { no: 46, nama: "Al-Ahqaf" }, { no: 47, nama: "Muhammad" }, { no: 48, nama: "Al-Fath" },
  { no: 49, nama: "Al-Hujurat" }, { no: 50, nama: "Qaf" }, { no: 51, nama: "Az-Zariyat" }, { no: 52, nama: "At-Tur" },
  { no: 53, nama: "An-Najm" }, { no: 54, nama: "Al-Qamar" }, { no: 55, nama: "Ar-Rahman" }, { no: 56, nama: "Al-Waqi'ah" },
  { no: 57, nama: "Al-Hadid" }, { no: 58, nama: "Al-Mujadilah" }, { no: 59, nama: "Al-Hasyr" }, { no: 60, nama: "Al-Mumtahanah" },
  { no: 61, nama: "As-Saff" }, { no: 62, nama: "Al-Jumu'ah" }, { no: 63, nama: "Al-Munafiqun" }, { no: 64, nama: "At-Tagabun" },
  { no: 65, nama: "At-Talaq" }, { no: 66, nama: "At-Tahrim" }, { no: 67, nama: "Al-Mulk" }, { no: 68, nama: "Al-Qalam" },
  { no: 69, nama: "Al-Haqqah" }, { no: 70, nama: "Al-Ma'arij" }, { no: 71, nama: "Nuh" }, { no: 72, nama: "Al-Jinn" },
  { no: 73, nama: "Al-Muzzammil" }, { no: 74, nama: "Al-Muddassir" }, { no: 75, nama: "Al-Qiyamah" }, { no: 76, nama: "Al-Insan" },
  { no: 77, nama: "Al-Mursalat" }, { no: 78, nama: "An-Naba'" }, { no: 79, nama: "An-Nazi'at" }, { no: 80, nama: "'Abasa" },
  { no: 81, nama: "At-Takwir" }, { no: 82, nama: "Al-Infitar" }, { no: 83, nama: "Al-Mutaffifin" }, { no: 84, nama: "Al-Insyiqaq" },
  { no: 85, nama: "Al-Buruj" }, { no: 86, nama: "At-Tariq" }, { no: 87, nama: "Al-A'la" }, { no: 88, nama: "Al-Gasyiyah" },
  { no: 89, nama: "Al-Fajr" }, { no: 90, nama: "Al-Balad" }, { no: 91, nama: "Asy-Syams" }, { no: 92, nama: "Al-Lail" },
  { no: 93, nama: "Ad-Duha" }, { no: 94, nama: "Asy-Syarh" }, { no: 95, nama: "At-Tin" }, { no: 96, nama: "Al-'Alaq" },
  { no: 97, nama: "Al-Qadr" }, { no: 98, nama: "Al-Bayyinah" }, { no: 99, nama: "Az-Zalzalah" }, { no: 100, nama: "Al-'Adiyat" },
  { no: 101, nama: "Al-Qari'ah" }, { no: 102, nama: "At-Takasur" }, { no: 103, nama: "Al-'Asr" }, { no: 104, nama: "Al-Humazah" },
  { no: 105, nama: "Al-Fil" }, { no: 106, nama: "Quraisy" }, { no: 107, nama: "Al-Ma'un" }, { no: 108, nama: "Al-Kausar" },
  { no: 109, nama: "Al-Kafirun" }, { no: 110, nama: "An-Nasr" }, { no: 111, nama: "Al-Lahab" }, { no: 112, nama: "Al-Ikhlas" },
  { no: 113, nama: "Al-Falaq" }, { no: 114, nama: "An-Nas" }
];

export const GuruMutabaah: React.FC<GuruMutabaahProps> = ({ 
  myHalaqah, 
  myStudents, 
  myUser, 
  myGuruObj, 
  formatIndonesianDate,
  addLog,
  getElemenLineCountForPage: getElemenLineCountForPageProp,
  initialInnerTab
}) => {
  const { 
    guruSchedules, 
    gurus,
    setorans, 
    guruAttendance, 
    studentAttendance, 
    saveStudentAttendance, 
    siswas,
    halaqahs,
    moduls,
    mataPelajarans,
    elemenSettings,
    quranLinesConfig,
    createSetoran,
    updateSetoran,
    deleteSetoran,
    masterPenalties,
    whiteboardCanvas,
    whiteboardPins,
    saveWhiteboardCanvas,
    saveWhiteboardPins,
    tajwidCategories,
    selectedGuruHalaqahId,
    setSelectedGuruHalaqahId,
    capaianBacaanTrialSettings,
    isGuruEligibleForCapaianBacaan
  } = useApp();

  const isCapaianBacaanTrialEnabled = true;

  const [innerTab, setInnerTab] = useState<'input' | 'riwayat' | 'capaian_bacaan'>(initialInnerTab || 'input');

  useEffect(() => {
    if (initialInnerTab) {
      setInnerTab(initialInnerTab);
    }
  }, [initialInnerTab]);

  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);
  const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);
  const [isPanduanModalOpen, setIsPanduanModalOpen] = useState(false);
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);
  
  const teacherId = myUser?.id || '';
  const myHalaqahs = useMemo(() => {
    return getTeacherHalaqahs(halaqahs, myUser, gurus, guruSchedules, siswas);
  }, [halaqahs, myUser, gurus, guruSchedules, siswas]);

  // Active selected halaqah (from global context selector or prop)
  const activeSelectedHalaqahId = selectedGuruHalaqahId || myHalaqah?.id || '';
  const activeSelectedHalaqah = useMemo(() => {
    if (selectedGuruHalaqahId) {
      const found = halaqahs.find(h => 
        h.id === selectedGuruHalaqahId || 
        h.namaHalaqah === selectedGuruHalaqahId ||
        normalizeHalaqahKey(h.namaHalaqah) === normalizeHalaqahKey(selectedGuruHalaqahId)
      );
      if (found) return found;
    }
    return myHalaqah || null;
  }, [selectedGuruHalaqahId, halaqahs, myHalaqah]);

  const availableElemenSettings = useMemo(() => {
    if (!elemenSettings || elemenSettings.length === 0) return [];
    const activeTargetHalaqah = activeSelectedHalaqah;
    const filtered = elemenSettings.filter(elem => isElemenAvailableForHalaqah(elem, activeTargetHalaqah));
    return filtered.length > 0 ? filtered : elemenSettings;
  }, [elemenSettings, activeSelectedHalaqah]);

  const formatSetoranMateriDetail = (s: Setoran): string => {
    if (s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0) {
      const list = s.daftarSuratSetoran.map(item => `${item.suratNama}: ${item.ayatAwal}-${item.ayatAkhir}`);
      return `Multi-Surat (${list.join(', ')})`;
    } else if (s.suratNama) {
      const hasSurah = s.modulNama.toLowerCase().includes(s.suratNama.toLowerCase());
      if (hasSurah) {
        return `${s.modulNama}: ${s.ayatAwal}-${s.ayatAkhir}`;
      }
      return `${s.modulNama} (${s.suratNama}: ${s.ayatAwal}-${s.ayatAkhir})`;
    } else if (s.catatanModulLain) {
      return s.catatanModulLain;
    }
    return s.modulNama || '-';
  };

  const getExportFileName = (): string => {
    const halaqahName = (activeSelectedHalaqah?.namaHalaqah || myHalaqah?.namaHalaqah || 'Halaqah').replace(/\s+/g, '_');
    const rangeText = new Date().toISOString().split('T')[0];
    return `Rekap_Mutabaah_${halaqahName}_${rangeText}`;
  };

  const generateRekapPDF = (doc: jsPDF) => {
    doc.setFontSize(18);
    doc.setTextColor(15, 118, 110);
    doc.text('REKAP INTEGRAL MUTABAAH & SETORAN HALAQAH', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Halaqah: ${activeSelectedHalaqah?.namaHalaqah || myHalaqah?.namaHalaqah || '-'} | Guru: ${myUser?.namaLengkap || myGuruObj?.namaLengkap || '-'}`, 14, 26);
    doc.text(`Status Mutabaah | Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);
    
    doc.setDrawColor(148, 163, 184);
    doc.line(14, 36, 196, 36);

    doc.setFillColor(241, 245, 249);
    doc.rect(14, 42, 182, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Tgl', 16, 47.5);
    doc.text('Nama Santri', 42, 47.5);
    doc.text('Materi Setoran', 95, 47.5);
    doc.text('Nilai', 155, 47.5);
    doc.text('Status', 175, 47.5);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let y = 56;

    filteredHistory.forEach((s) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(s.tanggalSetoran || '', 16, y);
      doc.text(s.siswaNama || '', 42, y);
      const materiLines = doc.splitTextToSize(formatSetoranMateriDetail(s), 55);
      doc.text(materiLines, 95, y);
      doc.text(s.nilai || '-', 155, y);
      doc.text(s.statusLulus ? 'LULUS' : 'MENGULANG', 175, y);
      y += Math.max(materiLines.length * 5, 7) + 2;
    });
  };

  const exportToPDF = (name: string) => {
    const doc = new jsPDF();
    generateRekapPDF(doc);
    doc.save(`${name}.pdf`);
  };

  const exportToExcel = (name: string) => {
    const worksheetData = filteredHistory.map((s, index) => ({
      'No': index + 1,
      'Tanggal': s.tanggalSetoran,
      'Nama Santri': s.siswaNama,
      'NIS': s.siswaNis,
      'Materi Setoran': formatSetoranMateriDetail(s),
      'Nilai': s.nilai || '-',
      'Status': s.statusLulus ? 'Lulus' : 'Mengulang',
      'Catatan Guru': s.catatanGuru || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Mutabaah');
    XLSX.writeFile(workbook, `${name}.xlsx`);
  };

  const simulateExport = (type: 'PDF' | 'Excel', name: string) => {
    if (type === 'Excel') {
      exportToExcel(name);
    } else {
      exportToPDF(name);
    }
  };

  const saveToGoogleDrive = async (fileName: string, type: 'PDF' | 'Excel') => {
    setUploadingToDrive(fileName);
    setTimeout(() => {
      setUploadingToDrive(null);
      if (type === 'Excel') {
        exportToExcel(fileName);
      } else {
        exportToPDF(fileName);
      }
    }, 1000);
  };
  


  
  const getSurahNumber = (surahName: string): number => {
    if (!surahName) return 0;
    let cleaned = surahName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleaned.startsWith('surat')) {
      cleaned = cleaned.slice(5);
    } else if (cleaned.startsWith('surah')) {
      cleaned = cleaned.slice(5);
    }
    const idx = SURAH_LIST.findIndex(s => {
      let sCleaned = s.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sCleaned.startsWith('surat')) {
        sCleaned = sCleaned.slice(5);
      } else if (sCleaned.startsWith('surah')) {
        sCleaned = sCleaned.slice(5);
      }
      return sCleaned === cleaned;
    });
    return idx !== -1 ? idx + 1 : 0;
  };

  // INPUT SETORAN WORKFLOW STATES
  // ----------------------------------------------------
  const [setoranDate, setSetoranDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [setoranHalaqahId, setSetoranHalaqahId] = useState(activeSelectedHalaqahId);

  // Sync setoranHalaqahId whenever the active selected halaqah changes
  useEffect(() => {
    if (activeSelectedHalaqahId) {
      setSetoranHalaqahId(activeSelectedHalaqahId);
    }
  }, [activeSelectedHalaqahId]);
  const [setoranSiswaId, setSetoranSiswaId] = useState('');
  const [capaianBacaanSiswaId, setCapaianBacaanSiswaId] = useState<string>('');
  const [setoranElemen, setSetoranElemen] = useState('tilawah');
  const [setoranJenisSub, setSetoranJenisSub] = useState('');
  const [setoranModulId, setSetoranModulId] = useState('');
  const [setoranNote, setSetoranNote] = useState('');
  const [setoranGrade, setSetoranGrade] = useState('Mumtaz');
  const [selectedPredikat, setSelectedPredikat] = useState('Mumtaz');
  const [setoranScore, setSetoranScore] = useState<number | ''>(100);
  const [setoranPass, setSetoranPass] = useState(true);
  const [kesimpulanHasilKelulusan, setKesimpulanHasilKelulusan] = useState('Lulus');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isManualGradeOverride, setIsManualGradeOverride] = useState(false);
  const [isManualKelulusanOverride, setIsManualKelulusanOverride] = useState(false);

  useEffect(() => {
    setIsManualGradeOverride(false);
    setIsManualKelulusanOverride(false);
    setSetoranScore(100);
  }, [setoranSiswaId, setoranElemen, setoranModulId]);

  // Ensure setoranElemen is valid within available elements for active halaqah
  useEffect(() => {
    if (availableElemenSettings && availableElemenSettings.length > 0) {
      if (!availableElemenSettings.some(e => e.id === setoranElemen)) {
        setSetoranElemen(availableElemenSettings[0].id);
      }
    }
  }, [availableElemenSettings, setoranElemen]);

  // Multi-Surah Workflow States
  const [isMultiSurah, setIsMultiSurah] = useState(false);
  const [banyakSuratSubmit, setBanyakSuratSubmit] = useState(1);
  const [multiSurahsList, setMultiSurahsList] = useState<Array<{
    id: string;
    modulId: string;
    suratNama: string;
    ayatAwal: number | '';
    ayatAkhir: number | '';
    jumlahAyat: number;
  }>>([]);
  const [activePreviewSurahIndex, setActivePreviewSurahIndex] = useState(0);

  // Search filter for modules in Input Setoran
  const [modulSearchQuery, setModulSearchQuery] = useState('');
  const [isModulComboboxOpen, setIsModulComboboxOpen] = useState(false);
  const [openMultiSurahComboboxIndex, setOpenMultiSurahComboboxIndex] = useState<number | null>(null);
  const [multiSurahSearchQuery, setMultiSurahSearchQuery] = useState('');
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
  const [isEvaluationCollapsed, setIsEvaluationCollapsed] = useState(false);

  // Quran Bounds
  const [quranSuratName, setQuranSuratName] = useState('Al-Qari\'ah');
  const [quranAyatAwal, setQuranAyatAwal] = useState<number | ''>(1);
  const [quranAyatAkhir, setQuranAyatAkhir] = useState<number | ''>(5);

  // NonQuran Bounds
  const [nonQuranJilid, setNonQuranJilid] = useState(1);
  const [nonQuranPageAwal, setNonQuranPageAwal] = useState<number | ''>(1);
  const [nonQuranPageAkhir, setNonQuranPageAkhir] = useState<number | ''>(3);
  const [nonQuranPageSingle, setNonQuranPageSingle] = useState<number | ''>(15);
  const [isSinglePageNonQuran, setIsSinglePageNonQuran] = useState(true);
  const [jumlahBaris, setJumlahBaris] = useState<number | ''>('');
  const [barisAwal, setBarisAwal] = useState<number | ''>('');
  const [barisAkhir, setBarisAkhir] = useState<number | ''>('');
  const [isManualBaris, setIsManualBaris] = useState(false);
  const [missingBarisInfo, setMissingBarisInfo] = useState<string>('');
  const [showOnlySetoranRange, setShowOnlySetoranRange] = useState(true);

  const activeModul = moduls.find(m => m.id === setoranModulId);
  const selectedElemenObj = elemenSettings.find(e => e.id === setoranElemen);

  const matchedModules = useMemo(() => {
    return filterModulesForElemen(moduls, selectedElemenObj);
  }, [selectedElemenObj, moduls]);

  const matchedQuranModules = useMemo(() => {
    return matchedModules.filter(m => m.tipe === TipeModul.AL_QURAN);
  }, [matchedModules]);

  const activeElemenScopeLabel = useMemo(() => {
    return getElemenModulScopeLabel(selectedElemenObj, matchedModules.length);
  }, [selectedElemenObj, matchedModules.length]);

  const resolveLineCount = (elem?: ElemenSetting, mod?: any, page?: number, jIdx?: number, qCfg?: any): number => {
    try {
      if (typeof getElemenLineCountForPageProp === 'function') {
        return getElemenLineCountForPageProp(elem, mod, page, jIdx, qCfg);
      }
      if (typeof getElemenLineCountForPage === 'function') {
        return getElemenLineCountForPage(elem, mod, page, jIdx, qCfg);
      }
    } catch (e) {
      console.warn('Error calculating line count for page:', e);
    }
    return 15;
  };

  const getPageLineCountHelper = () => {
    try {
      if (!selectedElemenObj?.useJumlahBaris && !activeModul?.useJumlahBarisPerHalaman) return null;
      
      const jIdx = activeModul?.isMultiJilid ? (Number(nonQuranJilid) - 1) : 0;
      
      if (isSinglePageNonQuran) {
        const pageNum = Number(nonQuranPageSingle) || 1;
        const count = resolveLineCount(selectedElemenObj, activeModul, pageNum, jIdx, quranLinesConfig);
        return count > 0 ? { type: 'single', page: pageNum, count } : null;
      } else {
        const startPg = (Number(nonQuranPageAwal) || 1);
        const endPg = (Number(nonQuranPageAkhir) || 1);
        const ranges: { page: number; count: number }[] = [];
        for (let p = startPg; p <= endPg; p++) {
          const count = resolveLineCount(selectedElemenObj, activeModul, p, jIdx, quranLinesConfig);
          if (count > 0) {
            ranges.push({ page: p, count });
          }
        }
        return ranges.length > 0 ? { type: 'range', ranges } : null;
      }
    } catch (err) {
      console.warn('Error in getPageLineCountHelper:', err);
      return null;
    }
  };

  // Helper to compute verse line count accurately
  const calculateVersesLineCount = (verses: any[]) => {
    if (!verses || verses.length === 0) return { totalLines: 0, bAwal: '' as number | '', bAkhir: '' as number | '' };

    const valid = verses.filter((v: any) => v.baris !== undefined && v.baris !== null && v.baris !== '');
    if (valid.length === 0) return { totalLines: 0, bAwal: '' as number | '', bAkhir: '' as number | '' };

    // Sort valid verses by halaman and then by baris to ensure first and last are correct
    valid.sort((a, b) => {
      if (Number(a.halaman) !== Number(b.halaman)) return Number(a.halaman) - Number(b.halaman);
      return Number(a.baris) - Number(b.baris);
    });

    const firstV = valid[0];
    const lastV = valid[valid.length - 1];

    const bAwal = Number(firstV.baris);
    const bAkhir = Number(lastV.barisAkhir !== undefined && lastV.barisAkhir !== null && lastV.barisAkhir !== '' ? lastV.barisAkhir : lastV.baris);
    
    const linesSet = new Set<string>();

    valid.forEach((v: any) => {
      const h = Number(v.halaman);
      const b1 = Number(v.baris);
      const b2 = Number(v.barisAkhir !== undefined && v.barisAkhir !== null && v.barisAkhir !== '' ? v.barisAkhir : v.baris);
      
      if (!isNaN(h) && !isNaN(b1) && !isNaN(b2)) {
        if (b2 < b1) {
          // Cross-page verse (spans to the next page)
          for (let i = b1; i <= 15; i++) {
            linesSet.add(`${h}-${i}`);
          }
          const nextH = h + 1;
          for (let i = 1; i <= b2; i++) {
            linesSet.add(`${nextH}-${i}`);
          }
        } else {
          for (let i = b1; i <= b2; i++) {
            linesSet.add(`${h}-${i}`);
          }
        }
      }
    });

    return { totalLines: linesSet.size, bAwal, bAkhir };
  };

  // Effect for Auto-Calculation (Quran only, when !isManualBaris)
  useEffect(() => {
    if (activeModul?.tipe !== TipeModul.AL_QURAN || isManualBaris) {
      if (activeModul?.tipe !== TipeModul.AL_QURAN) setMissingBarisInfo('');
      return;
    }

    if (isMultiSurah && multiSurahsList.length > 0) {
      let allVerses: any[] = [];
      let totalMissingCount = 0;

      multiSurahsList.forEach((item) => {
        const mod = moduls.find(m => m.id === item.modulId);
        if (mod && mod.isiAyat) {
          const itemAyatAwal = Number(item.ayatAwal);
          const itemAyatAkhir = Number(item.ayatAkhir);
          const mVerses = mod.isiAyat.filter((v: any) => v.nomorAyat >= itemAyatAwal && v.nomorAyat <= itemAyatAkhir);
          
          const missing = mVerses.filter((v: any) => !v.halaman || !v.baris);
          totalMissingCount += missing.length;

          allVerses = allVerses.concat(mVerses);
        }
      });

      if (totalMissingCount > 0) {
        setMissingBarisInfo(`⚠️ Info: Terdapat ${totalMissingCount} ayat yang belum diatur data letak hal/barisnya dalam modul.`);
      } else {
        setMissingBarisInfo('');
      }

      const res = calculateVersesLineCount(allVerses);
      setBarisAwal(res.bAwal);
      setBarisAkhir(res.bAkhir);
      setJumlahBaris(res.totalLines > 0 ? res.totalLines : '');
    } else {
      const aAwal = quranAyatAwal === '' ? 1 : Number(quranAyatAwal);
      const aAkhir = quranAyatAkhir === '' ? (activeModul.jumlahAyat || 10) : Number(quranAyatAkhir);
      const verses = activeModul.isiAyat || [];
      const versesInRange = verses.filter((v: any) => v.nomorAyat >= aAwal && v.nomorAyat <= aAkhir);

      if (versesInRange.length > 0) {
        const missing = versesInRange.filter((v: any) => !v.halaman || !v.baris);
        if (missing.length > 0) {
          setMissingBarisInfo(`⚠️ Info: Terdapat ${missing.length} ayat yang belum diatur data letak hal/barisnya dalam modul.`);
        } else {
          setMissingBarisInfo('');
        }
        const res = calculateVersesLineCount(versesInRange);
        setBarisAwal(res.bAwal);
        setBarisAkhir(res.bAkhir);
        setJumlahBaris(res.totalLines > 0 ? res.totalLines : '');
      } else {
        setMissingBarisInfo('');
        setBarisAwal('');
        setBarisAkhir('');
        setJumlahBaris('');
      }
    }
  }, [quranAyatAwal, quranAyatAkhir, activeModul, isManualBaris, isMultiSurah, multiSurahsList, moduls]);

    // Effect for Manual Calculation (Non-Quran OR when isManualBaris = true)
  useEffect(() => {
    if (activeModul?.tipe === TipeModul.AL_QURAN && !isManualBaris) return;
    
    if (barisAwal !== '' && barisAkhir !== '') {
      const start = Number(barisAwal);
      const end = Number(barisAkhir);
      if (end >= start) {
        setJumlahBaris(end - start + 1);
      } else {
        setJumlahBaris(0);
      }
    } else {
      setJumlahBaris('');
    }
  }, [barisAwal, barisAkhir, activeModul, isManualBaris]);

  const [activeNonQuranPreviewPage, setActiveNonQuranPreviewPage] = useState<number | null>(null);
  const [siswaViewMode, setSiswaViewMode] = useState<'table' | 'grid'>('table');

  // Synchronize first multi-surah item with setoranModulId to keep Quran UI active
  useEffect(() => {
    if (isMultiSurah && multiSurahsList.length > 0) {
      const firstSurah = multiSurahsList[0];
      if (firstSurah && firstSurah.modulId !== setoranModulId) {
        setSetoranModulId(firstSurah.modulId);
      }
    }
  }, [isMultiSurah, multiSurahsList, setoranModulId]);

  // Handle click outside for both combobox elements
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isModulComboboxOpen && !target.closest('#combobox-wrapper')) {
        setIsModulComboboxOpen(false);
      }
      if (openMultiSurahComboboxIndex !== null && !target.closest('.multi-surah-combobox-container')) {
        setOpenMultiSurahComboboxIndex(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isModulComboboxOpen, openMultiSurahComboboxIndex]);

  // Scroll active/selected module into view when combobox is opened
  useEffect(() => {
    if (isModulComboboxOpen && setoranModulId) {
      const timer = setTimeout(() => {
        const container = document.getElementById('modul-options-container');
        const activeEl = document.getElementById(`modul-opt-${setoranModulId}`);
        if (container && activeEl) {
          const containerTop = container.getBoundingClientRect().top;
          const activeTop = activeEl.getBoundingClientRect().top;
          const relativeTop = activeTop - containerTop;
          container.scrollTop = container.scrollTop + relativeTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
        } else if (activeEl) {
          activeEl.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isModulComboboxOpen, setoranModulId]);

  useEffect(() => {
    if (openMultiSurahComboboxIndex !== null) {
      const idx = openMultiSurahComboboxIndex;
      const currentItem = multiSurahsList[idx];
      if (currentItem && currentItem.modulId) {
        const scrollToActive = () => {
          const container = document.getElementById(`multi-modul-options-container-${idx}`);
          const activeEl = document.getElementById(`multi-modul-opt-${idx}-${currentItem.modulId}`);
          if (container && activeEl) {
            const containerTop = container.getBoundingClientRect().top;
            const activeTop = activeEl.getBoundingClientRect().top;
            const relativeTop = activeTop - containerTop;
            container.scrollTop = container.scrollTop + relativeTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
          } else if (activeEl) {
            activeEl.scrollIntoView({ block: 'center', behavior: 'auto' });
          }
        };

        const timer1 = setTimeout(scrollToActive, 30);
        const timer2 = setTimeout(scrollToActive, 100);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [openMultiSurahComboboxIndex, multiSurahsList]);

  // Synchronize multi-surah list with matched Quran modules on mode toggling
  useEffect(() => {
    if (isMultiSurah) {
      const qModules = matchedQuranModules;
      if (qModules.length > 0) {
        const existingMainId = setoranModulId || qModules[0].id;
        const mainMod = qModules.find(m => m.id === existingMainId) || qModules[0];
        const initialSuratAkhir = mainMod.jumlahAyat && mainMod.jumlahAyat <= 15 
          ? mainMod.jumlahAyat 
          : Math.min(mainMod.jumlahAyat || 10, 5);
        const isExistingValid = qModules.some(m => m.id === existingMainId);

        setMultiSurahsList([
          {
            id: '1',
            modulId: mainMod.id,
            suratNama: mainMod.namaSurat || '',
            ayatAwal: isExistingValid ? (quranAyatAwal || 1) : 1,
            ayatAkhir: isExistingValid ? (quranAyatAkhir || initialSuratAkhir) : initialSuratAkhir,
            jumlahAyat: mainMod.jumlahAyat || 10
          },
          {
            id: '2',
            modulId: mainMod.id,
            suratNama: mainMod.namaSurat || '',
            ayatAwal: 1,
            ayatAkhir: initialSuratAkhir,
            jumlahAyat: mainMod.jumlahAyat || 10
          }
        ]);
        setBanyakSuratSubmit(2);
        setActivePreviewSurahIndex(0);
      }
    } else {
      setMultiSurahsList([]);
      setBanyakSuratSubmit(1);
    }
  }, [isMultiSurah]);

  // Keep multi-surah selections valid when element or its scope changes
  useEffect(() => {
    if (!isMultiSurah) return;
    if (selectedElemenObj && selectedElemenObj.tipeModul !== TipeModul.AL_QURAN) {
      setIsMultiSurah(false);
      return;
    }
    if (matchedQuranModules.length === 0) return;

    const allowedIds = new Set(matchedQuranModules.map(m => m.id));
    const hasOutOfScope = multiSurahsList.some(item => !allowedIds.has(item.modulId));
    if (hasOutOfScope) {
      const fallbackMod = matchedQuranModules[0];
      const fallbackAyatAkhir = fallbackMod.jumlahAyat && fallbackMod.jumlahAyat <= 15
        ? fallbackMod.jumlahAyat
        : Math.min(fallbackMod.jumlahAyat || 10, 5);

      setMultiSurahsList(prev =>
        prev.map(item =>
          allowedIds.has(item.modulId)
            ? item
            : {
                ...item,
                modulId: fallbackMod.id,
                suratNama: fallbackMod.namaSurat || '',
                ayatAwal: 1,
                ayatAkhir: fallbackAyatAkhir,
                jumlahAyat: fallbackMod.jumlahAyat || 10
              }
        )
      );
    }
  }, [isMultiSurah, selectedElemenObj, matchedQuranModules, multiSurahsList]);

  const updateMultiSurahItem = (index: number, fields: Partial<{ modulId: string; ayatAwal: number | ''; ayatAkhir: number | '' }>) => {
    setMultiSurahsList(prev => {
      const oldItem = prev[index];
      const oldModulId = oldItem?.modulId;

      let selectedMObj: typeof moduls[0] | undefined;
      let newAyatAkhir: number = 5;
      if (fields.modulId) {
        selectedMObj = moduls.find(m => m.id === fields.modulId);
        newAyatAkhir = selectedMObj?.jumlahAyat && selectedMObj.jumlahAyat <= 15 
          ? selectedMObj.jumlahAyat 
          : Math.min(selectedMObj?.jumlahAyat || 10, 5);
      }

      return prev.map((item, idx) => {
        // Item yang sedang dipilih/diedit langsung oleh guru
        if (idx === index) {
          const updated = { ...item, ...fields };
          if (fields.modulId && selectedMObj) {
            updated.suratNama = selectedMObj.namaSurat || '';
            updated.jumlahAyat = selectedMObj.jumlahAyat || 10;
            updated.ayatAwal = 1;
            updated.ayatAkhir = newAyatAkhir;
          }
          return updated;
        }

        // Ketika guru memilih surat pada nomor urut ini, otomatis samakan surat pada nomor berikutnya (index + 1)
        // dan surat-surat setelahnya yang sebelumnya masih mengikuti surat lama (oldModulId),
        // agar guru sangat mudah memilih surat lanjutan tanpa perlu scroll jauh dari awal
        if (fields.modulId && selectedMObj && idx > index) {
          const shouldCascade = idx === index + 1 || item.modulId === oldModulId;
          if (shouldCascade) {
            return {
              ...item,
              modulId: fields.modulId,
              suratNama: selectedMObj.namaSurat || '',
              jumlahAyat: selectedMObj.jumlahAyat || 10,
              ayatAwal: 1,
              ayatAkhir: newAyatAkhir,
            };
          }
        }

        return item;
      });
    });
  };

  const addMultiSurahItem = () => {
    const qModules = matchedQuranModules;
    if (qModules.length === 0) return;
    const defaultMod = qModules[0];
    const lastItem = multiSurahsList.length > 0 ? multiSurahsList[multiSurahsList.length - 1] : null;
    const refModul = lastItem ? (qModules.find(m => m.id === lastItem.modulId) || defaultMod) : defaultMod;
    const refAyatAkhir = refModul.jumlahAyat && refModul.jumlahAyat <= 15 ? refModul.jumlahAyat : Math.min(refModul.jumlahAyat || 10, 5);

    setMultiSurahsList(prev => [
      ...prev,
      {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
        modulId: refModul.id,
        suratNama: refModul.namaSurat || '',
        ayatAwal: 1,
        ayatAkhir: refAyatAkhir,
        jumlahAyat: refModul.jumlahAyat || 10
      }
    ]);
    setBanyakSuratSubmit(prev => prev + 1);
  };

  const removeMultiSurahItem = (index: number) => {
    if (multiSurahsList.length <= 1) return;
    setMultiSurahsList(prev => prev.filter((_, idx) => idx !== index));
    setBanyakSuratSubmit(prev => Math.max(1, prev - 1));
    setActivePreviewSurahIndex(0);
  };

  const handleBanyakSuratChange = (newCount: number) => {
    const qModules = matchedQuranModules;
    if (qModules.length === 0) return;
    const defaultMod = qModules[0];
    
    setBanyakSuratSubmit(newCount);
    if (newCount > multiSurahsList.length) {
      const diff = newCount - multiSurahsList.length;
      // Gunakan surat terakhir atau surat aktif sebagai acuan awal untuk slot surat berikutnya
      const lastItem = multiSurahsList.length > 0 ? multiSurahsList[multiSurahsList.length - 1] : null;
      const refModul = lastItem ? (qModules.find(m => m.id === lastItem.modulId) || defaultMod) : defaultMod;
      const refAyatAkhir = refModul.jumlahAyat && refModul.jumlahAyat <= 15 ? refModul.jumlahAyat : Math.min(refModul.jumlahAyat || 10, 5);

      const extra: typeof multiSurahsList = [];
      for (let i = 0; i < diff; i++) {
        extra.push({
          id: `extra-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          modulId: refModul.id,
          suratNama: refModul.namaSurat || '',
          ayatAwal: 1,
          ayatAkhir: refAyatAkhir,
          jumlahAyat: refModul.jumlahAyat || 10
        });
      }
      setMultiSurahsList(prev => [...prev, ...extra]);
    } else if (newCount < multiSurahsList.length) {
      setMultiSurahsList(prev => prev.slice(0, newCount));
      setActivePreviewSurahIndex(0);
    }
  };

  const TAJWID_CATEGORIES = tajwidCategories.map(t => t.nama);

  // Interactive Highlighting Comments States
  const [selectedHighlightText, setSelectedHighlightText] = useState('');
  const [selectedHighlightKey, setSelectedHighlightKey] = useState('');
  const [rangeStartKey, setRangeStartKey] = useState<string | null>(null);
  const [rangeEndKey, setRangeEndKey] = useState<string | null>(null);
  const [selectedHighlightKeys, setSelectedHighlightKeys] = useState<string[]>([]);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [isRangeSelectMode, setIsRangeSelectMode] = useState<boolean>(false);
  const [activeWordContext, setActiveWordContext] = useState<{
    containerPrefix: string;
    allWords: string[];
    startIdx: number;
    endIdx: number;
    isRtl: boolean;
  } | null>(null);
  const quranPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const nonQuranPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const wordDragRef = useRef<{
    active: boolean;
    isTouch: boolean;
    containerPrefix: string;
    allWords: string[];
    startIdx: number;
    currentIdx: number;
    hasDraggedMultiple: boolean;
    startX: number;
    startY: number;
    gestureDecided: boolean;
    isRtl: boolean;
  } | null>(null);
  const suppressNextWordClickRef = useRef<boolean>(false);
  const [selectedErrorCategory, setSelectedErrorCategory] = useState<string>('Lainnya');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showSetoranCategoryPicker, setShowSetoranCategoryPicker] = useState<boolean>(false);
  const [activeCommentInput, setActiveCommentInput] = useState('');
  const [showNonQuranQuickNote, setShowNonQuranQuickNote] = useState<boolean>(false);
  const [showQuranQuickNote, setShowQuranQuickNote] = useState<boolean>(false);

  const DEFAULT_HIJAIYAH_SUBCATS_LIST = [
    { id: 'alif', nama: 'ا (Alif)' },
    { id: 'ba', nama: 'ب (Ba)' },
    { id: 'ta', nama: 'ت (Ta)' },
    { id: 'tsa', nama: 'ث (Tsa)' },
    { id: 'jim', nama: 'ج (Jim)' },
    { id: 'ha', nama: 'ح (Ha)' },
    { id: 'kha', nama: 'خ (Kha)' },
    { id: 'dal', nama: 'د (Dal)' },
    { id: 'dzal', nama: 'ذ (Dzal)' },
    { id: 'ra', nama: 'ر (Ra)' },
    { id: 'zai', nama: 'ز (Zai)' },
    { id: 'sin', nama: 'س (Sin)' },
    { id: 'syin', nama: 'ش (Syin)' },
    { id: 'shad', nama: 'ص (Shad)' },
    { id: 'dhad', nama: 'ض (Dhad)' },
    { id: 'tha', nama: 'ط (Tha)' },
    { id: 'zha', nama: 'ظ (Zha)' },
    { id: 'ain', nama: "ع ('Ain)" },
    { id: 'ghain', nama: 'غ (Ghain)' },
    { id: 'fa', nama: 'ف (Fa)' },
    { id: 'qaf', nama: 'ق (Qaf)' },
    { id: 'kaf', nama: 'ك (Kaf)' },
    { id: 'lam', nama: 'ل (Lam)' },
    { id: 'mim', nama: 'م (Mim)' },
    { id: 'nun', nama: 'ن (Nun)' },
    { id: 'waw', nama: 'و (Waw)' },
    { id: 'ha_besar', nama: 'هـ (Ha)' },
    { id: 'hamzah', nama: 'ء (Hamzah)' },
    { id: 'ya', nama: 'ي (Ya)' }
  ];

  const getCategorySubcategoriesList = (catObj?: any, catName?: string) => {
    if (catObj?.subcategories && catObj.subcategories.length > 0) {
      return catObj.subcategories;
    }
    const nameLower = (catName || catObj?.nama || '').toLowerCase();
    const idLower = (catObj?.id || '').toLowerCase();
    if (
      nameLower.includes('makhraj') ||
      nameLower.includes('huruf') ||
      nameLower.includes('hijaiyah') ||
      idLower.includes('makhraj') ||
      idLower.includes('huruf')
    ) {
      return DEFAULT_HIJAIYAH_SUBCATS_LIST;
    }
    return [];
  };

  const handleCategorySelect = (catName: string, subcategoriesCount = 0) => {
    setSelectedErrorCategory(catName);
    setSelectedSubCategory(null);
    if (subcategoriesCount === 0) {
      setShowSetoranCategoryPicker(false);
    }
  };

  const handleSubCategorySelect = (subName: string, autoClose = true) => {
    setSelectedSubCategory(subName);
    setShowSetoranCategoryPicker(false);
  };

  const handleClearSubCategory = () => {
    setSelectedSubCategory(null);
  };

  const normalizeSubKey = (sub?: string): string => {
    if (!sub) return '';
    const trimmed = sub.trim().toLowerCase().replace(/\s+/g, ' ');
    const letterMatch = trimmed.match(/^([\u0600-\u06FF]+)\s*\(/);
    if (letterMatch && letterMatch[1]) {
      return letterMatch[1].trim();
    }
    return trimmed;
  };

  const getDeductionTrackingKey = (canonKey: string, subcategory?: string): string => {
    const subKey = normalizeSubKey(subcategory);
    return subKey ? `${canonKey}:::${subKey}` : `${canonKey}:::_general`;
  };

  const [interactiveComments, setInteractiveComments] = useState<Array<{ id: string; target: string; targetKey?: string; targetKeys?: string[]; category?: string; subcategory?: string; comment: string; info: string }>>([]);

  const handleUpdateInteractiveComment = (commentId: string, newText: string) => {
    setInteractiveComments(prev => {
      const targetItem = prev.find(c => c.id === commentId);
      if (!targetItem) return prev;
      
      const updated = prev.map(c => c.id === commentId ? { ...c, comment: newText } : c);
      
      setSetoranNote(currentNote => {
        const lines = currentNote.split('\n');
        const targetSub = targetItem.subcategory ? ` - ${targetItem.subcategory}` : '';
        const targetCat = targetItem.category && targetItem.category !== 'Lainnya' ? ` [${targetItem.category}${targetSub}]` : '';
        const newCommentSuffix = newText.trim() ? `: ${newText.trim()}` : '';

        let matched = false;
        const updatedLines = lines.map(line => {
          if (!matched && line.includes(`"${targetItem.target}"`) && line.includes(targetItem.info)) {
            matched = true;
            const isRange = line.includes('Rentang ');
            const labelPrefix = isRange ? 'Rentang ' : '';
            return `• [Koreksi ${labelPrefix}"${targetItem.target}"${targetCat} di ${targetItem.info}]${newCommentSuffix}`;
          }
          return line;
        });

        if (!matched) {
          updatedLines.push(`• [Koreksi "${targetItem.target}"${targetCat} di ${targetItem.info}]${newCommentSuffix}`);
        }

        return updatedLines.join('\n');
      });

      return updated;
    });
  };

  const handleDeleteInteractiveComment = (commentId: string) => {
    setInteractiveComments(prev => {
      const targetItem = prev.find(c => c.id === commentId);
      if (targetItem) {
        setSetoranNote(currentNote => {
          return currentNote
            .split('\n')
            .filter(line => !(line.includes(`"${targetItem.target}"`) && line.includes(targetItem.info)))
            .join('\n');
        });
      }
      return prev.filter(c => c.id !== commentId);
    });
  };

  const handleClearAllInteractiveComments = () => {
    setInteractiveComments([]);
    setSetoranNote(currentNote => {
      return currentNote
        .split('\n')
        .filter(line => !line.trim().startsWith('• [Koreksi'))
        .join('\n');
    });
  };

  const [guruQuranZoom, setGuruQuranZoom] = useState(110);

  // Mode Form Koreksi: 'modal' (Popup / Modal Mengambang) atau 'inline' (Di Bawah Ayat)
  const [correctionFormMode, setCorrectionFormMode] = useState<'inline' | 'modal'>(() => {
    try {
      const saved = localStorage.getItem('mh_guru_correction_form_mode');
      if (saved === 'inline' || saved === 'modal') return saved;
    } catch {
      // fallback
    }
    return 'modal'; // Default modal agar guru langsung merasakan kemudahan popup saat kata/ayat diklik
  });

  const handleSetCorrectionFormMode = (mode: 'inline' | 'modal') => {
    setCorrectionFormMode(mode);
    if (mode === 'modal' && selectedHighlightText) {
      setIsCorrectionModalOpen(true);
    } else if (mode === 'inline') {
      setIsCorrectionModalOpen(false);
    }
    try {
      localStorage.setItem('mh_guru_correction_form_mode', mode);
    } catch {
      // ignore
    }
  };

  const handleCancelCorrection = () => {
    setSelectedHighlightText('');
    setSelectedHighlightKey('');
    setSelectedHighlightKeys([]);
    setRangeStartKey(null);
    setRangeEndKey(null);
    setIsCorrectionModalOpen(false);
    setActiveWordContext(null);
    setSelectedErrorCategory('Lainnya');
    setSelectedSubCategory(null);
    setActiveCommentInput('');
    setShowQuranQuickNote(false);
    setShowNonQuranQuickNote(false);
  };

  const handleCancelQuranCorrection = handleCancelCorrection;
  const handleCancelNonQuranCorrection = handleCancelCorrection;

  const handleSaveQuranCorrection = () => {
    const clickedVerse = (() => {
      const firstKey = selectedHighlightKeys[0] || selectedHighlightKey;
      if (firstKey) {
        if (firstKey.endsWith('-verse')) {
          const match = firstKey.match(/quran-.*-(\d+)-verse$/);
          if (match) return match[1];
        }
        const match = firstKey.match(/quran-.*-(\d+)-(\d+)$/);
        if (match) {
          return match[1];
        }
        const parts = firstKey.split('-');
        if (parts.length >= 2) {
          return parts[parts.length - 2];
        }
      }
      return '';
    })();

    const userNote = activeCommentInput.trim();
    const activeSName = isMultiSurah && multiSurahsList[activePreviewSurahIndex]
      ? multiSurahsList[activePreviewSurahIndex].suratNama
      : quranSuratName;
    const isRange = selectedHighlightKeys.length > 1;
    const labelPrefix = isRange ? 'Rentang ' : '';
    const subSuffix = selectedSubCategory ? ` - ${selectedSubCategory}` : '';
    const catSuffix = selectedErrorCategory && selectedErrorCategory !== 'Lainnya' ? ` [${selectedErrorCategory}${subSuffix}]` : '';
    const verseSuffix = clickedVerse ? ` Ayat ${clickedVerse}` : '';
    const commentSuffix = userNote ? `: ${userNote}` : '';
    const correctionLine = `• [Koreksi ${labelPrefix}"${selectedHighlightText}"${catSuffix} di Surah ${activeSName}${verseSuffix}]${commentSuffix}`;

    setSetoranNote(prev => prev ? `${prev}\n${correctionLine}` : correctionLine);

    // Store in history for list representation
    const newComment = {
      id: Date.now().toString(),
      target: selectedHighlightText,
      targetKey: selectedHighlightKey,
      targetKeys: selectedHighlightKeys,
      category: selectedErrorCategory,
      subcategory: selectedSubCategory || undefined,
      comment: userNote,
      info: isMultiSurah && multiSurahsList[activePreviewSurahIndex]
        ? `${multiSurahsList[activePreviewSurahIndex].suratNama} Ayat ${clickedVerse || (multiSurahsList[activePreviewSurahIndex].ayatAwal === multiSurahsList[activePreviewSurahIndex].ayatAkhir ? multiSurahsList[activePreviewSurahIndex].ayatAwal : multiSurahsList[activePreviewSurahIndex].ayatAwal + '-' + multiSurahsList[activePreviewSurahIndex].ayatAkhir)}`
        : `Ayat ${clickedVerse || (quranAyatAwal === quranAyatAkhir ? quranAyatAwal : quranAyatAwal + '-' + quranAyatAkhir)}`
    };
    setInteractiveComments(prev => [...prev, newComment]);

    // Reset states
    handleCancelCorrection();
  };

  const handleSaveNonQuranCorrection = (targetPage?: number) => {
    const pageNum = targetPage ?? (
      (activeNonQuranPreviewPage !== null && activeNonQuranPreviewPage > 0)
        ? activeNonQuranPreviewPage
        : (isSinglePageNonQuran ? (nonQuranPageSingle === '' ? 1 : Number(nonQuranPageSingle)) : (nonQuranPageAwal === '' ? 1 : Number(nonQuranPageAwal)))
    );
    const userNote = activeCommentInput.trim();
    const isRange = selectedHighlightKeys.length > 1;
    const labelPrefix = isRange ? 'Rentang ' : '';
    const subSuffix = selectedSubCategory ? ` - ${selectedSubCategory}` : '';
    const catSuffix = selectedErrorCategory && selectedErrorCategory !== 'Lainnya' ? ` [${selectedErrorCategory}${subSuffix}]` : '';
    const commentSuffix = userNote ? `: ${userNote}` : '';
    const correctionLine = `• [Koreksi ${labelPrefix}"${selectedHighlightText}"${catSuffix} di Jilid ${nonQuranJilid} Hlm ${pageNum}]${commentSuffix}`;

    setSetoranNote(prev => prev ? `${prev}\n${correctionLine}` : correctionLine);

    // Store in current session history
    const newComment = {
      id: Date.now().toString(),
      target: selectedHighlightText,
      targetKey: selectedHighlightKey,
      targetKeys: selectedHighlightKeys,
      category: selectedErrorCategory,
      subcategory: selectedSubCategory || undefined,
      comment: userNote,
      info: `Jilid ${nonQuranJilid} Hlm ${pageNum}`
    };
    setInteractiveComments(prev => [...prev, newComment]);

    // Reset
    handleCancelCorrection();
  };

  // Keyboard shortcut: Tutup modal koreksi dengan tombol Escape
  useEffect(() => {
    if (correctionFormMode === 'modal' && selectedHighlightText) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancelCorrection();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [correctionFormMode, selectedHighlightText]);

  const effectiveOnceCategories: string[] = useMemo(() => {
    if (selectedElemenObj?.useMasterPenalties && masterPenalties?.oncePerSessionCategories !== undefined) {
      return masterPenalties.oncePerSessionCategories || [];
    }
    return selectedElemenObj?.oncePerSessionCategories || ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar'];
  }, [selectedElemenObj, masterPenalties]);

  const isOnceCategory = (searchKey?: string): { isOnce: boolean; canonKey: string; matched?: any } => {
    if (!searchKey) return { isOnce: false, canonKey: '' };
    const cleanSearch = searchKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = tajwidCategories?.find(tc => 
      tc.id === searchKey || 
      tc.nama === searchKey || 
      tc.id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSearch || 
      tc.nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSearch
    );
    const canonKey = matched ? matched.id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : cleanSearch;
    const isOnce = (effectiveOnceCategories || []).some(c => {
      const cleanC = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanC === cleanSearch || cleanC === canonKey) return true;
      if (matched) {
        const matchNamaClean = matched.nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanC === matchNamaClean) return true;
      }
      return false;
    });
    return { isOnce, canonKey, matched };
  };

  const applyWordRangeSelection = useCallback((
    containerPrefix: string,
    allWords: string[],
    idxA: number,
    idxB: number,
    isRtl: boolean,
    options?: { openModal?: boolean; resetCategory?: boolean }
  ) => {
    if (!allWords || allWords.length === 0) return;
    const minIdx = Math.max(0, Math.min(idxA, idxB));
    const maxIdx = Math.min(allWords.length - 1, Math.max(idxA, idxB));
    const keysRange: string[] = [];
    const textRange: string[] = [];

    for (let i = minIdx; i <= maxIdx; i++) {
      keysRange.push(`${containerPrefix}-${i}`);
      textRange.push(allWords[i]);
    }

    const startKey = `${containerPrefix}-${minIdx}`;
    const endKey = minIdx === maxIdx ? null : `${containerPrefix}-${maxIdx}`;

    setRangeStartKey(startKey);
    setRangeEndKey(endKey);
    setSelectedHighlightKeys(keysRange);
    setSelectedHighlightKey(`${containerPrefix}-${maxIdx}`);
    setSelectedHighlightText(textRange.join(' '));
    setActiveWordContext({ containerPrefix, allWords, startIdx: minIdx, endIdx: maxIdx, isRtl });

    if (options?.resetCategory) {
      setActiveCommentInput('');
      setSelectedErrorCategory('Lainnya');
      setSelectedSubCategory(null);
    }

    if (options?.openModal !== undefined) {
      setIsCorrectionModalOpen(options.openModal);
    }
  }, []);

  const startWordDrag = useCallback((
    clientX: number,
    clientY: number,
    isTouch: boolean,
    containerPrefix: string,
    allWords: string[],
    wordIdx: number,
    isRtl: boolean
  ) => {
    wordDragRef.current = {
      active: true,
      isTouch,
      containerPrefix,
      allWords,
      startIdx: wordIdx,
      currentIdx: wordIdx,
      hasDraggedMultiple: false,
      startX: clientX,
      startY: clientY,
      gestureDecided: !isTouch,
      isRtl
    };
  }, []);

  // Global mouse & touch drag/swipe handlers for multi-word selection across words
  useEffect(() => {
    const handleMovePoint = (clientX: number, clientY: number) => {
      const drag = wordDragRef.current;
      if (!drag || !drag.active) return;

      const hit = document.elementFromPoint(clientX, clientY);
      const wordEl = hit?.closest('[data-word-idx]') as HTMLElement | null;
      if (!wordEl) return;

      const hitPrefix = wordEl.getAttribute('data-word-prefix');
      if (hitPrefix !== drag.containerPrefix) return;

      const hoveredIdx = parseInt(wordEl.getAttribute('data-word-idx') || '', 10);
      if (isNaN(hoveredIdx) || hoveredIdx === drag.currentIdx) return;

      const isFirstExpand = !drag.hasDraggedMultiple;
      drag.currentIdx = hoveredIdx;
      if (hoveredIdx !== drag.startIdx) {
        drag.hasDraggedMultiple = true;
      }

      applyWordRangeSelection(
        drag.containerPrefix,
        drag.allWords,
        drag.startIdx,
        hoveredIdx,
        drag.isRtl,
        { openModal: false, resetCategory: isFirstExpand }
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      const drag = wordDragRef.current;
      if (!drag || !drag.active || drag.isTouch) return;
      handleMovePoint(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const drag = wordDragRef.current;
      if (!drag || !drag.active || !drag.isTouch || e.touches.length !== 1) return;
      const t = e.touches[0];

      if (!drag.gestureDecided) {
        const dx = Math.abs(t.clientX - drag.startX);
        const dy = Math.abs(t.clientY - drag.startY);
        if (dx < 8 && dy < 8) return;

        // Vertical dominant swipe = normal scroll
        if (dy > dx * 1.15) {
          wordDragRef.current = null;
          return;
        }
        drag.gestureDecided = true;
      }

      e.preventDefault();
      handleMovePoint(t.clientX, t.clientY);
    };

    const finishDrag = (isTouchEvent: boolean, e?: TouchEvent) => {
      const drag = wordDragRef.current;
      if (!drag || !drag.active) return;
      if (isTouchEvent !== drag.isTouch) return;

      wordDragRef.current = null;

      if (drag.hasDraggedMultiple) {
        suppressNextWordClickRef.current = true;
        setTimeout(() => {
          suppressNextWordClickRef.current = false;
        }, 150);

        if (isTouchEvent && e && e.cancelable) {
          e.preventDefault();
        }

        if (correctionFormMode === 'modal') {
          setIsCorrectionModalOpen(true);
        }
      }
    };

    const handleMouseUp = () => finishDrag(false);
    const handleTouchEnd = (e: TouchEvent) => finishDrag(true, e);
    const handleTouchCancel = () => {
      if (wordDragRef.current?.isTouch) {
        wordDragRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const qEl = quranPreviewContainerRef.current;
    const nqEl = nonQuranPreviewContainerRef.current;
    qEl?.addEventListener('touchmove', handleTouchMove, { passive: false });
    nqEl?.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      qEl?.removeEventListener('touchmove', handleTouchMove);
      nqEl?.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [applyWordRangeSelection, correctionFormMode, activeModul?.id, activeModul?.tipe, activeNonQuranPreviewPage, nonQuranPageSingle, nonQuranPageAwal, nonQuranJilid, isSinglePageNonQuran]);

  const handleWordSelection = (
    wordKey: string, 
    wordText: string, 
    wordIdx: number, 
    allWords: string[],
    options?: { isShift?: boolean; isRtl?: boolean }
  ) => {
    if (suppressNextWordClickRef.current) {
      suppressNextWordClickRef.current = false;
      return;
    }

    const lastDashIdx = wordKey.lastIndexOf('-');
    const containerPrefix = wordKey.substring(0, lastDashIdx);
    const isRtl = options?.isRtl ?? containerPrefix.startsWith('quran-');
    const isTwoClickPending = isRangeSelectMode || Boolean(options?.isShift);

    if (rangeStartKey === wordKey && !rangeEndKey) {
      setRangeStartKey(null);
      setRangeEndKey(null);
      setSelectedHighlightKeys([]);
      setSelectedHighlightKey('');
      setSelectedHighlightText('');
      setIsCorrectionModalOpen(false);
      setActiveWordContext(null);
      setActiveCommentInput('');
      setSelectedErrorCategory('Lainnya');
      setSelectedSubCategory(null);
      return;
    }

    const existingStartPrefix = rangeStartKey ? rangeStartKey.substring(0, rangeStartKey.lastIndexOf('-')) : '';
    const canCompleteRange = Boolean(
      rangeStartKey &&
      !rangeEndKey &&
      existingStartPrefix === containerPrefix &&
      (correctionFormMode === 'inline' || isTwoClickPending || !isCorrectionModalOpen)
    );

    if (!canCompleteRange || !rangeStartKey) {
      const shouldOpenModalNow = correctionFormMode === 'modal' && !isTwoClickPending;
      applyWordRangeSelection(containerPrefix, allWords, wordIdx, wordIdx, isRtl, {
        openModal: shouldOpenModalNow,
        resetCategory: true
      });
    } else {
      const startIdx = parseInt(rangeStartKey.split('-').pop() || '0', 10);
      applyWordRangeSelection(containerPrefix, allWords, startIdx, wordIdx, isRtl, {
        openModal: correctionFormMode === 'modal',
        resetCategory: true
      });
    }
  };

  const renderModalWordRangeAdjuster = () => {
    if (!activeWordContext || activeWordContext.allWords.length <= 1) return null;
    const { containerPrefix, allWords, startIdx, endIdx, isRtl } = activeWordContext;
    const prevWord = startIdx > 0 ? allWords[startIdx - 1] : null;
    const nextWord = endIdx < allWords.length - 1 ? allWords[endIdx + 1] : null;
    const windowStart = Math.max(0, startIdx - 4);
    const windowEnd = Math.min(allWords.length - 1, endIdx + 4);
    const windowIndices: number[] = [];
    for (let i = windowStart; i <= windowEnd; i++) {
      windowIndices.push(i);
    }

    return (
      <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider font-mono">
            🔗 Sesuaikan Rentang Kata (Antar Kata)
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {endIdx > startIdx && (
              <button
                type="button"
                onClick={() => applyWordRangeSelection(containerPrefix, allWords, startIdx, startIdx, isRtl, { resetCategory: false })}
                className="px-2 py-0.5 text-[9.5px] font-bold rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Reset 1 Kata
              </button>
            )}
            <span className="text-[9.5px] font-semibold text-amber-700/90 dark:text-amber-400/90">
              {endIdx - startIdx + 1} Kata Terpilih
            </span>
          </div>
        </div>

        <div
          dir={isRtl ? 'rtl' : 'auto'}
          className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-950 border border-amber-100 dark:border-slate-800"
        >
          {windowStart > 0 && (
            <span className="text-xs text-slate-400 px-1 select-none">...</span>
          )}
          {windowIndices.map(idx => {
            const w = allWords[idx];
            const isInRange = idx >= startIdx && idx <= endIdx;
            return (
              <button
                key={`${containerPrefix}-adj-${idx}`}
                type="button"
                onClick={() => {
                  if (idx < startIdx) {
                    applyWordRangeSelection(containerPrefix, allWords, idx, endIdx, isRtl, { resetCategory: false });
                  } else if (idx > endIdx) {
                    applyWordRangeSelection(containerPrefix, allWords, startIdx, idx, isRtl, { resetCategory: false });
                  } else if (startIdx < endIdx) {
                    if (idx === startIdx) {
                      applyWordRangeSelection(containerPrefix, allWords, startIdx + 1, endIdx, isRtl, { resetCategory: false });
                    } else if (idx === endIdx) {
                      applyWordRangeSelection(containerPrefix, allWords, startIdx, endIdx - 1, isRtl, { resetCategory: false });
                    } else {
                      applyWordRangeSelection(containerPrefix, allWords, idx, idx, isRtl, { resetCategory: false });
                    }
                  }
                }}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  isRtl ? 'font-mushaf font-serif text-lg leading-normal' : 'font-sans text-xs font-semibold'
                } ${
                  isInRange
                    ? 'bg-amber-200 text-amber-950 dark:bg-amber-500/30 dark:text-amber-200 ring-1 ring-amber-400 font-bold shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300'
                }`}
                title={
                  isInRange
                    ? (startIdx < endIdx ? 'Klik untuk hapus/persempit dari rentang' : 'Kata terpilih')
                    : 'Klik untuk memperluas rentang hingga kata ini'
                }
              >
                {w}
              </button>
            );
          })}
          {windowEnd < allWords.length - 1 && (
            <span className="text-xs text-slate-400 px-1 select-none">...</span>
          )}
        </div>

        {(prevWord || nextWord) && (
          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {prevWord && (
                <button
                  type="button"
                  onClick={() => applyWordRangeSelection(containerPrefix, allWords, startIdx - 1, endIdx, isRtl, { resetCategory: false })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                >
                  <span>+ Sebelumnya:</span>
                  <span className={isRtl ? 'font-mushaf font-serif text-sm font-normal' : 'font-sans font-bold'}>{prevWord}</span>
                </button>
              )}
              {nextWord && (
                <button
                  type="button"
                  onClick={() => applyWordRangeSelection(containerPrefix, allWords, startIdx, endIdx + 1, isRtl, { resetCategory: false })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                >
                  <span>+ Sesudahnya:</span>
                  <span className={isRtl ? 'font-mushaf font-serif text-sm font-normal' : 'font-sans font-bold'}>{nextWord}</span>
                </button>
              )}
            </div>
            <span className="text-[9.5px] text-slate-400 dark:text-slate-500 italic">
              Klik kata tetangga untuk menggabungkan
            </span>
          </div>
        )}
      </div>
    );
  };

  const handleVerseSelection = (
    verseNum: number,
    words: string[],
    modulId: string,
    suratNama?: string
  ) => {
    const verseKey = `quran-${modulId}-${verseNum}-verse`;
    const wordKeys = words.map((_, idx) => `quran-${modulId}-${verseNum}-${idx}`);

    if (selectedHighlightKey === verseKey) {
      setRangeStartKey(null);
      setRangeEndKey(null);
      setSelectedHighlightKeys([]);
      setSelectedHighlightKey('');
      setSelectedHighlightText('');
      setIsCorrectionModalOpen(false);
      setActiveWordContext(null);
      setActiveCommentInput('');
      setSelectedErrorCategory('Lainnya');
      setSelectedSubCategory(null);
      return;
    }

    const targetLabel = suratNama ? `Surah ${suratNama} Ayat ${verseNum}` : `Ayat ${verseNum}`;
    setSelectedHighlightKey(verseKey);
    setSelectedHighlightKeys([verseKey, ...wordKeys]);
    setSelectedHighlightText(targetLabel);
    setRangeStartKey(null);
    setRangeEndKey(null);
    setActiveWordContext(null);
    if (correctionFormMode === 'modal') {
      setIsCorrectionModalOpen(true);
    }

    // Auto-select "Kelancaran / Hafalan" or "Tersendat" error category for verse selection
    const kelancaranCat = tajwidCategories.find(c => 
      c.nama.toLowerCase().includes('lancar') || 
      c.nama.toLowerCase().includes('fashohah') || 
      c.nama.toLowerCase().includes('hafalan') ||
      c.nama.toLowerCase().includes('kelancaran')
    );

    const catName = kelancaranCat ? kelancaranCat.nama : (tajwidCategories.length > 0 ? tajwidCategories[0].nama : 'Kelancaran');
    setSelectedErrorCategory(catName);

    const subCat = kelancaranCat?.subcategories?.find(s => 
      s.nama.toLowerCase().includes('sendat') || 
      s.nama.toLowerCase().includes('tidak lancar') || 
      s.nama.toLowerCase().includes('lupa')
    );
    const subName = subCat ? subCat.nama : 'Tidak Lancar / Tersendat';
    setSelectedSubCategory(subName);

    setActiveCommentInput(`Ayat ${verseNum} tersendat / tidak lancar`);
  };

  // Active student list based on setoranHalaqahId selection
  const setoranCandidates = useMemo(() => {
    const targetHalaqahId = setoranHalaqahId || myHalaqah?.id || '';
    return siswas.filter(s => (!targetHalaqahId || s.halaqahId === targetHalaqahId) && s.status === StatusAktif.AKTIF);
  }, [siswas, setoranHalaqahId, myHalaqah?.id]);

  const lastSiswaIdRef = React.useRef<string>('');
  const lastElemenRef = React.useRef<string>('');
  const lastSelectedSiswaIdRef = React.useRef<string | null>(null);
  const isRestoringFromPrevRef = React.useRef<boolean>(false);

  // Helper to find matching Elemen in elemenSettings for a Setoran object
  const findElemForSetoran = (s: Setoran | null) => {
    if (!s) return null;
    const sElemId = (s as any).elemenId;
    const sElemNama = (s as any).elemenNama;
    const sJenis = s.jenisSetoran;

    return elemenSettings.find(e => {
      if (sElemId && (e.id === sElemId || e.nama === sElemId)) return true;
      if (sElemNama && (e.nama.toLowerCase().trim() === sElemNama.toLowerCase().trim() || e.id === sElemNama)) return true;
      if (sJenis) {
        const eNama = e.nama.toLowerCase().trim();
        const eId = e.id.toLowerCase().trim();
        const jNorm = sJenis.toLowerCase().trim();
        if (eNama === jNorm || eId === jNorm) return true;
        if (eNama && (jNorm.includes(eNama) || eNama.includes(jNorm))) return true;
      }
      return false;
    });
  };

  // Set isRestoringFromPrevRef back to false on subsequent render cycles
  useEffect(() => {
    if (isRestoringFromPrevRef.current) {
      isRestoringFromPrevRef.current = false;
    }
  });

  // Automatically pick first candidate if none is chosen
  useEffect(() => {
    if (setoranCandidates.length > 0 && !setoranCandidates.some(c => c.id === setoranSiswaId)) {
      setSetoranSiswaId(setoranCandidates[0].id);
    }
  }, [setoranCandidates, setoranHalaqahId]);

  // Reset previous setoran notes expansion and auto-suggest last Elemen, Modul, and dynamic progress when picking a new student or element
  useEffect(() => {
    setIsNotesExpanded(false);
    
    if (setoranSiswaId) {
      const isSiswaChanged = lastSiswaIdRef.current !== setoranSiswaId;
      const isElemenChanged = lastElemenRef.current !== setoranElemen;

      let prev: Setoran | null = null;

      if (isSiswaChanged) {
        // 1. Tatkala nama santri diganti, selalu ambil setoran TERAKHIR santri tersebut secara keseluruhan (terlepas dari elemen sebelumnya)
        const overallLatest = getSiswaCapaianSebelumnya(setoranSiswaId);
        if (overallLatest) {
          const matchedElem = findElemForSetoran(overallLatest);
          if (matchedElem) {
            if (matchedElem.id !== setoranElemen) {
              setSetoranElemen(matchedElem.id);
            }
            lastElemenRef.current = matchedElem.id;
          } else {
            lastElemenRef.current = setoranElemen;
          }
          prev = overallLatest;
        } else {
          // Santri belum pernah setoran sama sekali
          prev = null;
          lastElemenRef.current = setoranElemen;
        }
        lastSiswaIdRef.current = setoranSiswaId;
      } else if (isElemenChanged) {
        // 2. Jika guru secara manual mengubah pilihan ELEMEN CAPAIAN untuk santri yang sama
        lastElemenRef.current = setoranElemen;
        prev = getSiswaCapaianSebelumnya(setoranSiswaId, setoranElemen);
      } else {
        // Render ulang dengan siswa & elemen yang sama
        prev = getSiswaCapaianSebelumnya(setoranSiswaId, setoranElemen);
      }

      if (prev) {
        isRestoringFromPrevRef.current = true;

        // Pastikan Elemen Capaian tersinkronisasi HANYA jika pergantian terjadi karena siswa baru dipilih
        if (isSiswaChanged) {
          const matchedElem = findElemForSetoran(prev);
          if (matchedElem && matchedElem.id !== setoranElemen) {
            setSetoranElemen(matchedElem.id);
          }
        }
        
        // Sinkronisasi Modul (pastikan modul tetap dalam cakupan elemen aktif)
        const effectiveElemObj = (isSiswaChanged ? findElemForSetoran(prev) : null) || elemenSettings.find(e => e.id === setoranElemen);
        const scopedModuls = filterModulesForElemen(moduls, effectiveElemObj);

        let matchedModul = null;
        if (prev.modulId) {
          const foundPrevMod = moduls.find(m => m.id === prev.modulId);
          if (foundPrevMod && (scopedModuls.length === 0 || scopedModuls.some(m => m.id === foundPrevMod.id))) {
            matchedModul = foundPrevMod;
            setSetoranModulId(prev.modulId);
          }
        }

        // Sinkronisasi Detail Progress (Ayat untuk Al-Quran, Halaman untuk Non-Al-Quran)
        if (matchedModul) {
          if (matchedModul.tipe === TipeModul.AL_QURAN) {
            const maxAyat = matchedModul.jumlahAyat || 114;
            let nextAyatAwal = 1;
            let nextAyatAkhir = 5;

            if (prev.statusLulus) {
              const lastAyatAkhir = prev.ayatAkhir || 0;
              if (lastAyatAkhir < maxAyat) {
                nextAyatAwal = lastAyatAkhir + 1;
                const prevDiff = (prev.ayatAkhir && prev.ayatAwal) ? (prev.ayatAkhir - prev.ayatAwal + 1) : 5;
                nextAyatAkhir = Math.min(maxAyat, lastAyatAkhir + prevDiff);
              } else {
                nextAyatAwal = 1;
                nextAyatAkhir = Math.min(maxAyat, 5);
              }
            } else {
              nextAyatAwal = prev.ayatAwal || 1;
              nextAyatAkhir = prev.ayatAkhir || Math.min(maxAyat, 5);
            }

            setQuranSuratName(matchedModul.namaSurat || '');
            setQuranAyatAwal(nextAyatAwal);
            setQuranAyatAkhir(nextAyatAkhir);
            if (prev.tipeTahfidz) {
              setSetoranJenisSub(prev.tipeTahfidz);
            }
          } else if (matchedModul.tipe === TipeModul.NON_AL_QURAN) {
            const isSingle = prev.nonQuranHalamanTunggal ?? true;
            const jilid = prev.nonQuranJilid || 1;
            let nextPgAwal = 1;
            let nextPgAkhir = 3;
            let nextPgSingle = 1;

            if (prev.statusLulus) {
              if (isSingle) {
                nextPgSingle = (prev.nonQuranPageAwal || 1) + 1;
                nextPgAwal = nextPgSingle;
                nextPgAkhir = nextPgSingle;
              } else {
                const lastPgAkhir = prev.nonQuranPageAkhir || 1;
                nextPgAwal = lastPgAkhir + 1;
                const prevDiff = (prev.nonQuranPageAkhir && prev.nonQuranPageAwal) ? (prev.nonQuranPageAkhir - prev.nonQuranPageAwal + 1) : 3;
                nextPgAkhir = nextPgAwal + prevDiff - 1;
              }
            } else {
              nextPgSingle = prev.nonQuranPageAwal || 1;
              nextPgAwal = prev.nonQuranPageAwal || 1;
              nextPgAkhir = prev.nonQuranPageAkhir || 3;
            }

            setNonQuranJilid(jilid);
            setIsSinglePageNonQuran(isSingle);
            setNonQuranPageSingle(nextPgSingle);
            setNonQuranPageAwal(nextPgAwal);
            setNonQuranPageAkhir(nextPgAkhir);
          }
        } else if (scopedModuls.length > 0) {
          const fallbackModul = scopedModuls[0];
          setSetoranModulId(fallbackModul.id);
          if (fallbackModul.tipe === TipeModul.AL_QURAN) {
            setQuranSuratName(fallbackModul.namaSurat || 'Al-Fatihah');
            setQuranAyatAwal(1);
            setQuranAyatAkhir(Math.min(fallbackModul.jumlahAyat || 5, 5));
          } else if (fallbackModul.tipe === TipeModul.NON_AL_QURAN) {
            setNonQuranJilid(1);
            setIsSinglePageNonQuran(true);
            setNonQuranPageSingle(1);
            setNonQuranPageAwal(1);
            setNonQuranPageAkhir(3);
          }
        }
      } else {
        // Jika tidak ada riwayat setoran sebelumnya, inisialisasi modul dan target default yang kompatibel dengan elemen saat ini
        const currentElemObj = elemenSettings.find(e => e.id === setoranElemen);
        if (currentElemObj) {
          const compatibleModuls = filterModulesForElemen(moduls, currentElemObj);
          if (compatibleModuls.length > 0) {
            const targetModul = compatibleModuls[0];
            setSetoranModulId(targetModul.id);
            if (targetModul.tipe === TipeModul.AL_QURAN) {
              setQuranSuratName(targetModul.namaSurat || 'Al-Fatihah');
              setQuranAyatAwal(1);
              setQuranAyatAkhir(Math.min(targetModul.jumlahAyat || 5, 5));
            } else if (targetModul.tipe === TipeModul.NON_AL_QURAN) {
              setNonQuranJilid(1);
              setIsSinglePageNonQuran(true);
              setNonQuranPageSingle(1);
              setNonQuranPageAwal(1);
              setNonQuranPageAkhir(3);
            }
          }
          if (currentElemObj.jenisSetoranList && currentElemObj.jenisSetoranList.length > 0) {
            setSetoranJenisSub(currentElemObj.jenisSetoranList[0]);
          }
        }
      }
    } else {
      lastSiswaIdRef.current = '';
      lastElemenRef.current = '';
    }
  }, [setoranSiswaId, setoranElemen, elemenSettings, moduls]);

  // Find previous setoran for selected aluno/siswa (filtered by element if targetElemenId provided)
  const getSiswaCapaianSebelumnya = (sid: string, targetElemenId?: string) => {
    if (!sid) return null;
    const studentHistory = setorans.filter(s => s.siswaId === sid);
    if (studentHistory.length === 0) return null;

    let filteredHistory = studentHistory;

    if (targetElemenId) {
      const selectedElem = elemenSettings.find(e => e.id === targetElemenId || e.nama === targetElemenId);
      if (selectedElem) {
        const norm = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const elemNameNorm = norm(selectedElem.nama);
        const elemIdNorm = norm(selectedElem.id);

        filteredHistory = studentHistory.filter(s => {
          const sJenisNorm = norm(s.jenisSetoran);
          const sElemIdNorm = norm((s as any).elemenId);
          const sElemNamaNorm = norm((s as any).elemenNama);

          // Direct match on elemenId / elemenNama
          if (sElemIdNorm && (sElemIdNorm === elemIdNorm || sElemIdNorm === elemNameNorm)) return true;
          if (sElemNamaNorm && (sElemNamaNorm === elemNameNorm || sElemNamaNorm === elemIdNorm)) return true;

          // Match on jenisSetoran
          if (sJenisNorm) {
            if (sJenisNorm === elemNameNorm || sJenisNorm === elemIdNorm) return true;
            if (elemNameNorm && (sJenisNorm.includes(elemNameNorm) || elemNameNorm.includes(sJenisNorm))) return true;
          }

          // Fallback matching for Quran types (Tahfidz vs Tilawah/Qiraah)
          if (selectedElem.tipeModul && s.tipeModul === selectedElem.tipeModul) {
            const isElemTahfidz = elemNameNorm.includes('tahfidz');
            const isElemTilawah = elemNameNorm.includes('tilawah') || elemNameNorm.includes('qira') || elemNameNorm.includes('qiroah');

            const isSetoranTahfidz = sJenisNorm.includes('tahfidz') || Boolean(s.tipeTahfidz) || sJenisNorm === 'hafalan';
            const isSetoranTilawah = sJenisNorm.includes('tilawah') || sJenisNorm.includes('qira') || sJenisNorm.includes('qiroah') || sJenisNorm === 'bacaan';

            if (isElemTahfidz && isSetoranTahfidz) return true;
            if (isElemTilawah && isSetoranTilawah) return true;
          }

          return false;
        });
      }
    }

    if (filteredHistory.length === 0) return null;
    
    // Sort studentHistory chronologically descending (newest first)
    const studentHistorySorted = [...filteredHistory].sort((a, b) => {
      // Primary: Convert tanggalSetoran to millisecond timestamps
      const timeA = new Date(a.tanggalSetoran).getTime() || 0;
      const timeB = new Date(b.tanggalSetoran).getTime() || 0;

      if (timeA !== timeB) {
        return timeB - timeA; // Newest date first
      }

      // Secondary: Compare high-resolution storage timestamps encoded in the ID
      const getNumericVal = (idStr: string) => {
        if (!idStr) return 0;
        const cleaned = idStr.replace(/[^0-9]/g, '');
        return cleaned ? parseInt(cleaned, 10) : 0;
      };

      const tsA = getNumericVal(a.id);
      const tsB = getNumericVal(b.id);
      
      if (tsA !== tsB) {
        return tsB - tsA; // Newest physical storage first
      }

      // Fallback
      return b.id.localeCompare(a.id);
    });

    return studentHistorySorted[0];
  };

  const resolveKesimpulanStatus = (setoran: any) => {
    if (!setoran) return '';
    if (setoran.kesimpulanHasilKelulusan) {
      return setoran.kesimpulanHasilKelulusan;
    }
    return setoran.statusLulus ? 'Lulus' : 'Mengulang';
  };

  const renderStatusBadge = (status: string) => {
    const norm = (status || '').trim().toLowerCase();
    if (norm === 'lulus') {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 py-1 px-3 rounded-full text-xs shadow-xs tracking-wide">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>LULUS</span>
        </span>
      );
    } else if (norm === 'belum lulus' || norm === 'belum lulus / ulang' || norm === 'ulang') {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold bg-rose-50 dark:bg-rose-955/25 text-rose-700 dark:text-rose-400 border border-rose-250/60 dark:border-rose-800/60 py-1 px-3 rounded-full text-xs shadow-xs tracking-wide">
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>BELUM LULUS</span>
        </span>
      );
    } else if (norm === 'perlu perbaikan') {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold bg-amber-50 dark:bg-amber-955/25 text-amber-700 dark:text-amber-400 border border-amber-250/60 dark:border-amber-800/60 py-1 px-3 rounded-full text-xs shadow-xs tracking-wide">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>PERLU PERBAIKAN</span>
        </span>
      );
    } else if (norm === 'mengulang') {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold bg-orange-50 dark:bg-orange-955/25 text-orange-700 dark:text-orange-400 border border-orange-250/60 dark:border-orange-800/60 py-1 px-3 rounded-full text-xs shadow-xs tracking-wide">
          <RotateCcw className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
          <span>MENGULANG</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-1 px-3 rounded-full text-xs shadow-xs tracking-wide uppercase font-sans">
          <span>{status.toUpperCase()}</span>
        </span>
      );
    }
  };

  const renderCatatanList = (catatan: string) => {
    if (!catatan) return <p className="text-slate-400 dark:text-slate-500 italic text-[11px] font-sans">Tidak ada catatan evaluasi khusus.</p>;
    const rawLines = catatan.split('\n').map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return <p className="text-slate-400 dark:text-slate-500 italic text-[11px] font-sans">Tidak ada catatan evaluasi khusus.</p>;

    const displayLines = isNotesExpanded ? rawLines : rawLines.slice(0, 3);
    const hasMore = rawLines.length > 3;

    return (
      <div className="space-y-2 mt-1">
        <ul className="space-y-1.5">
          {displayLines.map((line, idx) => {
            const isBullet = line.startsWith('•');
            const content = isBullet ? line.substring(1).trim() : line;
            return (
              <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-150 dark:border-slate-800/80 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0 mt-1.5 select-none" />
                <span className="leading-relaxed font-medium font-sans text-left flex-1">{renderArabicEnhancedText(content)}</span>
              </li>
            );
          })}
        </ul>
        {hasMore && (
          <div className="text-left pt-0.5">
            <button
              type="button"
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline transition-all uppercase tracking-wider font-sans focus:outline-none bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 px-3 py-1 rounded-lg cursor-pointer"
            >
              {isNotesExpanded ? '▲ Sembunyikan Catatan' : `▼ Lihat Selengkapnya (${rawLines.length - 3} catatan lagi)`}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFullCatatan = (catatan: string) => {
    if (!catatan) return <span className="text-slate-350 italic text-[11px]">-</span>;
    const lines = catatan.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return <span className="text-slate-350 italic text-[11px]">-</span>;

    return (
      <div className="space-y-1 mt-0.5 max-w-full">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 leading-relaxed text-[11px]">
              <span className="text-indigo-500 font-semibold shrink-0 select-none mt-0.5">•</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold break-words text-left">{renderArabicEnhancedText(cleanLine)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const prevSetoranObj = getSiswaCapaianSebelumnya(setoranSiswaId, setoranElemen);

  // Filter modules lists
  const selectedSiswaObj = siswas.find(s => s.id === setoranSiswaId);

  const cleanPredikatText = (txt?: string): string => {
    if (!txt) return '';
    return txt
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{FE00}-\u{FE0F}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{200D}]/gu, '')
      .replace(/^[✓✔✕✖\s]+/, '')
      .trim();
  };

  const defaultPredicatesList = useMemo(() => [
    { minScore: 95, maxScore: 100, predikat: 'Mumtaz', lulus: true },
    { minScore: 85, maxScore: 94, predikat: 'Jayyid Jiddan', lulus: true },
    { minScore: 75, maxScore: 84, predikat: 'Jayyid', lulus: true },
    { minScore: 60, maxScore: 74, predikat: 'Maqbul', lulus: true },
    { minScore: 0, maxScore: 59, predikat: 'Murojaah / Rasib', lulus: false },
  ], []);

  const activePredicates = useMemo(() => {
    if (selectedElemenObj?.rubrikPredikat && selectedElemenObj.rubrikPredikat.length > 0) {
      return selectedElemenObj.rubrikPredikat.map(p => ({
        ...p,
        predikat: cleanPredikatText(p.predikat)
      }));
    }
    return defaultPredicatesList;
  }, [selectedElemenObj, defaultPredicatesList]);

  const getMatchedPredicate = (score: number | '') => {
    if (score === '' || score === null || score === undefined) {
      return { predikat: '-', lulus: false };
    }
    const numericScore = typeof score === 'number' ? score : (Number(score) || 0);
    const predicates = activePredicates;
    return predicates.find(p => numericScore >= p.minScore && numericScore <= p.maxScore) || {
      predikat: numericScore >= 60 ? 'Maqbul' : 'Murojaah / Rasib',
      lulus: numericScore >= 60
    };
  };

  const handleSelectPredikat = (predikatName: string, isLulus?: boolean) => {
    const cleanedName = cleanPredikatText(predikatName);
    setSelectedPredikat(cleanedName);
    const isRubrikActive = Boolean(selectedElemenObj?.useRubrikPenilaian);
    const targetPred = activePredicates.find(p => p.predikat.toLowerCase() === cleanedName.toLowerCase());
    const passStatus = isLulus !== undefined ? isLulus : (targetPred ? targetPred.lulus : true);

    setSetoranPass(passStatus);
    setKesimpulanHasilKelulusan(passStatus ? 'Lulus' : 'Belum Lulus');
    setIsManualKelulusanOverride(false);

    if (isRubrikActive) {
      setIsManualGradeOverride(true);
      if (targetPred) {
        const midScore = Math.round((targetPred.minScore + targetPred.maxScore) / 2);
        setSetoranScore(midScore);
        setSetoranGrade(`${midScore} (${cleanedName})`);
      } else {
        if (setoranScore !== '') {
          setSetoranGrade(`${setoranScore} (${cleanedName})`);
        } else {
          setSetoranGrade(cleanedName);
        }
      }
    } else {
      setSetoranScore('');
      setSetoranGrade(cleanedName);
    }
  };

  // Reset scoring & predikat state when student, element, or module changes
  useEffect(() => {
    setIsManualGradeOverride(false);
    setIsManualKelulusanOverride(false);
    const isRubrikActive = Boolean(selectedElemenObj?.useRubrikPenilaian);
    if (isRubrikActive) {
      const base = selectedElemenObj.useMasterPenalties && masterPenalties ? (masterPenalties.baseScore !== undefined ? masterPenalties.baseScore : 100) : (selectedElemenObj?.baseScore !== undefined ? selectedElemenObj.baseScore : 100);
      setSetoranScore(base);
      const matched = getMatchedPredicate(base);
      setSelectedPredikat(matched.predikat);
      setSetoranGrade(`${base} (${matched.predikat})`);
      setSetoranPass(matched.lulus);
      setKesimpulanHasilKelulusan(matched.lulus ? 'Lulus' : 'Belum Lulus');
    } else {
      setSetoranScore('');
      const defaultPred = activePredicates[0]?.predikat || 'Mumtaz';
      const isLulus = activePredicates[0] ? activePredicates[0].lulus : true;
      setSelectedPredikat(defaultPred);
      setSetoranGrade(defaultPred);
      setSetoranPass(isLulus);
      setKesimpulanHasilKelulusan(isLulus ? 'Lulus' : 'Belum Lulus');
    }
  }, [setoranSiswaId, setoranElemen, setoranModulId, selectedElemenObj, masterPenalties]);

  // Dedicated memoized deduction summary based on active rubric configuration & formula
  const currentDeductionSummary = useMemo<DeductionCalculationResult | null>(() => {
    if (!selectedElemenObj?.useRubrikPenilaian) return null;
    const isQuran = selectedElemenObj.tipeModul === TipeModul.AL_QURAN || (!selectedElemenObj.referensiModulId && !setoranModulId);
    
    let modulLines = 6;
    if (!isQuran) {
      const foundModul = moduls?.find(m => m.id === setoranModulId || m.id === selectedElemenObj.referensiModulId);
      if (foundModul?.defaultLinesPerPage && foundModul.defaultLinesPerPage > 0) {
        modulLines = foundModul.defaultLinesPerPage;
      } else if (selectedElemenObj.defaultLinesPerPage && selectedElemenObj.defaultLinesPerPage > 0) {
        modulLines = selectedElemenObj.defaultLinesPerPage;
      } else if (masterPenalties?.defaultBarisNonQuran) {
        modulLines = masterPenalties.defaultBarisNonQuran;
      }
    }

    const isCustomOverride = selectedElemenObj.useMasterPenalties === false;

    const effectiveDeductions = isCustomOverride && selectedElemenObj.rubrikDeductions
      ? selectedElemenObj.rubrikDeductions
      : (masterPenalties?.rubrikDeductions || {});

    const effectiveOnceCategories: string[] = isCustomOverride && selectedElemenObj.oncePerSessionCategories !== undefined
      ? (selectedElemenObj.oncePerSessionCategories || [])
      : (masterPenalties?.oncePerSessionCategories || ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']);

    const effectiveBobotKlasifikasi = isCustomOverride && selectedElemenObj.bobotKlasifikasi
      ? { ...(masterPenalties?.bobotKlasifikasi || {}), ...selectedElemenObj.bobotKlasifikasi }
      : (masterPenalties?.bobotKlasifikasi || {});

    const effectiveBobotJaliy = isCustomOverride && selectedElemenObj.bobotLahnJaliy !== undefined
      ? selectedElemenObj.bobotLahnJaliy
      : (masterPenalties?.bobotLahnJaliy ?? 4);

    const effectiveBobotKhafiy = isCustomOverride && selectedElemenObj.bobotLahnKhafiy !== undefined
      ? selectedElemenObj.bobotLahnKhafiy
      : (masterPenalties?.bobotLahnKhafiy ?? 2);

    const effectiveStandarBarisQuran = isCustomOverride && selectedElemenObj.standarBarisQuran !== undefined
      ? selectedElemenObj.standarBarisQuran
      : (masterPenalties?.standarBarisQuran ?? 15);

    const effectiveMinBarisQuran = isCustomOverride && selectedElemenObj.minBarisQuran !== undefined
      ? selectedElemenObj.minBarisQuran
      : (masterPenalties?.minBarisQuran ?? 5);

    const effectiveMaxBarisQuran = isCustomOverride && selectedElemenObj.maxBarisQuran !== undefined
      ? selectedElemenObj.maxBarisQuran
      : (masterPenalties?.maxBarisQuran ?? 15);

    return calculateSetoranRubrikDeductions({
      comments: interactiveComments,
      tajwidCategories,
      effectiveOnceCategories,
      effectiveDeductions,
      rumusPenilaian: selectedElemenObj.rumusPenilaian,
      jumlahBaris: jumlahBaris,
      isQuran,
      standarBarisQuran: effectiveStandarBarisQuran,
      minBarisQuran: effectiveMinBarisQuran,
      maxBarisQuran: effectiveMaxBarisQuran,
      standarBarisModul: modulLines,
      bobotLahnJaliy: effectiveBobotJaliy,
      bobotLahnKhafiy: effectiveBobotKhafiy,
      bobotKlasifikasi: effectiveBobotKlasifikasi,
      defaultDeduction: 2
    });
  }, [selectedElemenObj, masterPenalties, interactiveComments, jumlahBaris, tajwidCategories, setoranModulId, moduls]);

  // Automated Rubric Calculation logic based on errors and lines
  useEffect(() => {
    if (selectedElemenObj?.useRubrikPenilaian && !isManualGradeOverride) {
      const isCustomOverride = selectedElemenObj.useMasterPenalties === false;
      const baseScore = isCustomOverride
        ? (selectedElemenObj.baseScore !== undefined ? selectedElemenObj.baseScore : 100)
        : (masterPenalties?.baseScore !== undefined ? masterPenalties.baseScore : 100);

      const totalDeductions = currentDeductionSummary ? currentDeductionSummary.totalDeductions : 0;
      const finalScore = Math.max(0, Math.round(baseScore - totalDeductions));

      const matched = getMatchedPredicate(finalScore);

      setSetoranScore(finalScore);
      setSelectedPredikat(matched.predikat);
      setSetoranGrade(`${finalScore} (${matched.predikat})`);
      if (!isManualKelulusanOverride) {
        setKesimpulanHasilKelulusan(matched.lulus ? 'Lulus' : 'Belum Lulus');
        setSetoranPass(matched.lulus);
      }
    }
  }, [selectedElemenObj, masterPenalties, currentDeductionSummary, isManualGradeOverride, activePredicates, isManualKelulusanOverride]);

  // Synchronize score to grade, pass, and result when manually edited or non-rubric is active
  useEffect(() => {
    if (!selectedElemenObj?.useRubrikPenilaian) {
      setSetoranScore('');
      const curPred = selectedPredikat || 'Mumtaz';
      setSetoranGrade(curPred);
      const targetPred = activePredicates.find(p => p.predikat.toLowerCase() === curPred.toLowerCase());
      const passStatus = targetPred ? targetPred.lulus : true;
      if (!isManualKelulusanOverride) {
        setSetoranPass(passStatus);
        setKesimpulanHasilKelulusan(passStatus ? 'Lulus' : 'Belum Lulus');
      }
    } else if (isManualGradeOverride) {
      if (setoranScore === '') {
        setSetoranGrade(selectedPredikat || '');
        const targetPred = activePredicates.find(p => p.predikat.toLowerCase() === (selectedPredikat || '').toLowerCase());
        const passStatus = targetPred ? targetPred.lulus : false;
        if (!isManualKelulusanOverride) {
          setKesimpulanHasilKelulusan(passStatus ? 'Lulus' : 'Belum Lulus');
          setSetoranPass(passStatus);
        }
      } else {
        const matched = getMatchedPredicate(setoranScore);
        setSelectedPredikat(matched.predikat);
        setSetoranGrade(`${setoranScore} (${matched.predikat})`);
        if (!isManualKelulusanOverride) {
          setKesimpulanHasilKelulusan(matched.lulus ? 'Lulus' : 'Belum Lulus');
          setSetoranPass(matched.lulus);
        }
      }
    }
  }, [setoranScore, selectedElemenObj, isManualGradeOverride, selectedPredikat, activePredicates, isManualKelulusanOverride]);

  const getNilaiPredikatLabel = () => {
    if (selectedElemenObj) {
      if (selectedElemenObj.kompetensi) {
        return `NILAI / PREDIKAT ${selectedElemenObj.kompetensi.toUpperCase()}`;
      }
      const nameLower = selectedElemenObj.nama.toLowerCase();
      if (nameLower.includes('tahfidz') || nameLower.includes('tahfizh')) {
        return 'NILAI / PREDIKAT HAFALAN';
      }
      if (nameLower.includes('qiroah') || nameLower.includes('tilawah') || nameLower.includes('baca')) {
        return 'NILAI / PREDIKAT BACAAN';
      }
    }
    return 'NILAI / PREDIKAT HAFALAN';
  };

  // Automatically pick first compatible module when sub elements or scope toggle
  useEffect(() => {
    if (isRestoringFromPrevRef.current) return;
    if (matchedModules.length > 0) {
      const isCurrentlyCompatible = matchedModules.some(m => m.id === setoranModulId);
      if (!isCurrentlyCompatible) {
        setSetoranModulId(matchedModules[0].id);
      }
    } else if (setoranModulId) {
      setSetoranModulId('');
    }
  }, [setoranElemen, matchedModules, setoranModulId]);

  // Choose sub categories default on element swap
  useEffect(() => {
    if (isRestoringFromPrevRef.current) return;
    if (selectedElemenObj && selectedElemenObj.jenisSetoranList.length > 0) {
      setSetoranJenisSub(selectedElemenObj.jenisSetoranList[0]);
    }
  }, [setoranElemen]);

  // Auto-adjust selected error category to stay strictly within active page rules and element bounds
  useEffect(() => {
    if (isRestoringFromPrevRef.current) return;
    if (!selectedElemenObj) return;

    const activePage = selectedElemenObj.tipeModul === TipeModul.AL_QURAN
      ? (() => {
          const activeSName = isMultiSurah && multiSurahsList[activePreviewSurahIndex]
            ? multiSurahsList[activePreviewSurahIndex].suratNama
            : quranSuratName;
          const activeAAwal = isMultiSurah && multiSurahsList[activePreviewSurahIndex]
            ? Number(multiSurahsList[activePreviewSurahIndex].ayatAwal) || 1
            : Number(quranAyatAwal) || 1;
          const surahObj = SURAH_LIST.find(s => s.nama === activeSName);
          const surahNo = surahObj ? surahObj.no : 1;
          return getQuranPageNumber(surahNo, activeAAwal, activeModul);
        })()
      : ((activeNonQuranPreviewPage !== null && activeNonQuranPreviewPage > 0)
          ? activeNonQuranPreviewPage
          : (isSinglePageNonQuran ? (nonQuranPageSingle === '' ? 1 : Number(nonQuranPageSingle)) : (nonQuranPageAwal === '' ? 1 : Number(nonQuranPageAwal))));

    const activeJilid = selectedElemenObj.tipeModul === TipeModul.NON_AL_QURAN ? (nonQuranJilid || 1) : 1;

    const { filteredCategories, configuredTipe } = getValidErrorCategoriesForElemen(
      selectedElemenObj,
      activePage,
      activeJilid,
      tajwidCategories
    );

    if (configuredTipe === 'none' || filteredCategories.length === 0) {
      if (selectedErrorCategory !== '') {
        setSelectedErrorCategory('');
        setSelectedSubCategory('');
      }
      return;
    }

    const isStillValid = filteredCategories.some(c => c.nama === selectedErrorCategory);
    if (!isStillValid && filteredCategories.length > 0) {
      setSelectedErrorCategory(filteredCategories[0].nama);
      setSelectedSubCategory('');
    }
  }, [
    setoranElemen,
    quranSuratName,
    quranAyatAwal,
    isMultiSurah,
    multiSurahsList,
    activePreviewSurahIndex,
    activeModul,
    nonQuranPageSingle,
    nonQuranPageAwal,
    nonQuranJilid,
    activeNonQuranPreviewPage,
    tajwidCategories,
    selectedElemenObj,
    isSinglePageNonQuran
  ]);

  // Preset bounds when Quran selectedModul updates
  useEffect(() => {
    if (isRestoringFromPrevRef.current) return;
    if (activeModul && activeModul.tipe === TipeModul.AL_QURAN) {
      setQuranSuratName(activeModul.namaSurat || '');
      setQuranAyatAwal(1);
      setQuranAyatAkhir(Math.min(activeModul.jumlahAyat || 10, 5));
    } else if (activeModul && activeModul.tipe === TipeModul.NON_AL_QURAN) {
      setNonQuranPageAwal(1);
      setNonQuranPageAkhir(3);
    }
  }, [setoranModulId]);

  // Quran verse preview generator helper
  const getQuranLivePreviewList = () => {
    if (isMultiSurah && multiSurahsList.length > 0) {
      const activeItem = multiSurahsList[activePreviewSurahIndex];
      if (!activeItem) return [];
      const parentModul = moduls.find(m => m.id === activeItem.modulId);
      if (!parentModul || parentModul.tipe !== TipeModul.AL_QURAN) return [];
      const verses = parentModul.isiAyat || [];
      const aAwal = activeItem.ayatAwal === '' ? 1 : activeItem.ayatAwal;
      const aAkhir = activeItem.ayatAkhir === '' ? (parentModul.jumlahAyat || 10) : activeItem.ayatAkhir;
      return verses
        .filter(v => v.nomorAyat >= aAwal && v.nomorAyat <= aAkhir)
        .map(v => ({ ...v, modulId: parentModul.id }));
    }
    if (!activeModul || activeModul.tipe !== TipeModul.AL_QURAN) return [];
    const verses = activeModul.isiAyat || [];
    const aAwal = quranAyatAwal === '' ? 1 : quranAyatAwal;
    const aAkhir = quranAyatAkhir === '' ? (activeModul.jumlahAyat || 10) : quranAyatAkhir;
    return verses
      .filter(v => v.nomorAyat >= aAwal && v.nomorAyat <= aAkhir)
      .map(v => ({ ...v, modulId: activeModul.id }));
  };

  const handleCreateSetoranByGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setoranSiswaId || !setoranModulId) {
      alert('Mohon pilih siswa dan modul terlebih dahulu!');
      return;
    }

    const siswaObj = siswas.find(s => s.id === setoranSiswaId);
    const modulObj = moduls.find(m => m.id === setoranModulId);
    if (!siswaObj || !modulObj) return;

    if (isMultiSurah && multiSurahsList.length === 0) {
      alert('Mohon pilih minimal satu surat untuk setoran multi-surat!');
      return;
    }

    const firstMulti = multiSurahsList[0];
    const finalModulId = isMultiSurah && firstMulti ? firstMulti.modulId : setoranModulId;
    const finalModulObj = moduls.find(m => m.id === finalModulId) || modulObj;

    const finalAyatAwalNum = quranAyatAwal === '' ? 1 : quranAyatAwal;
    const finalAyatAkhirNum = quranAyatAkhir === '' ? (finalModulObj.jumlahAyat || 10) : quranAyatAkhir;

    if (finalModulObj.tipe === TipeModul.AL_QURAN && !isMultiSurah) {
      if (finalAyatAwalNum > finalAyatAkhirNum) {
        alert('Ayat awal tidak boleh lebih besar dari ayat akhir!');
        return;
      }
    }

    const finalNonQuranPageAwal = isSinglePageNonQuran
      ? (nonQuranPageSingle === '' ? 1 : Number(nonQuranPageSingle))
      : (nonQuranPageAwal === '' ? 1 : Number(nonQuranPageAwal));
    const finalNonQuranPageAkhir = isSinglePageNonQuran
      ? (nonQuranPageSingle === '' ? 1 : Number(nonQuranPageSingle))
      : (nonQuranPageAkhir === '' ? 1 : Number(nonQuranPageAkhir));

    const payload: Omit<Setoran, 'id' | 'guruId' | 'guruNama'> = {
      siswaId: setoranSiswaId,
      siswaNama: siswaObj.namaLengkap,
      siswaNis: siswaObj.nis,
      halaqahId: siswaObj.halaqahId,
      halaqahNama: siswaObj.halaqahNama,
      modulId: finalModulId,
      modulNama: isMultiSurah 
        ? `Multi-Surat (${multiSurahsList.map(s => s.suratNama).join(', ')})`
        : (finalModulObj.namaSurat ? `Surat ${finalModulObj.namaSurat}` : (finalModulObj.judulModul || '')),
      tipeModul: finalModulObj.tipe,
      elemenId: selectedElemenObj?.id,
      elemenNama: selectedElemenObj?.nama,
      catatanGuru: setoranNote,
      nilai: setoranGrade,
      statusLulus: kesimpulanHasilKelulusan === 'Lulus',
      kesimpulanHasilKelulusan: kesimpulanHasilKelulusan,
      tanggalSetoran: setoranDate,
      jumlahBaris: selectedElemenObj?.useJumlahBaris && jumlahBaris !== '' ? Number(jumlahBaris) : undefined,
      barisAwal: selectedElemenObj?.useJumlahBaris && barisAwal !== '' ? Number(barisAwal) : undefined,
      barisAkhir: selectedElemenObj?.useJumlahBaris && barisAkhir !== '' ? Number(barisAkhir) : undefined,
      
      // Conditionally attach Quran properties
      ...(finalModulObj.tipe === TipeModul.AL_QURAN ? {
        jenisSetoran: selectedElemenObj?.nama || 'Tahfidz',
        tipeTahfidz: setoranJenisSub,
        suratNama: isMultiSurah && firstMulti ? firstMulti.suratNama : quranSuratName,
        ayatAwal: isMultiSurah && firstMulti 
          ? (firstMulti.ayatAwal === '' ? 1 : firstMulti.ayatAwal) 
          : finalAyatAwalNum,
        ayatAkhir: isMultiSurah && firstMulti 
          ? (firstMulti.ayatAkhir === '' ? (firstMulti.jumlahAyat || 10) : firstMulti.ayatAkhir) 
          : finalAyatAkhirNum,
        banyakSurat: isMultiSurah ? multiSurahsList.length : 1,
        daftarSuratSetoran: isMultiSurah ? multiSurahsList.map(item => {
          const aAwal = item.ayatAwal === '' ? 1 : item.ayatAwal;
          const aAkhir = item.ayatAkhir === '' ? (item.jumlahAyat || 10) : item.ayatAkhir;
          return {
            modulId: item.modulId,
            suratNama: item.suratNama,
            ayatAwal: aAwal,
            ayatAkhir: aAkhir
          };
        }) : undefined,
        interactiveComments: interactiveComments
      } : {
        jenisSetoran: selectedElemenObj?.nama || 'Qiroah',
        tipeTahfidz: setoranJenisSub,
        halaman: finalNonQuranPageAkhir,
        catatanModulLain: isSinglePageNonQuran 
          ? `Jilid ${nonQuranJilid}, Halaman ${finalNonQuranPageAwal}`
          : `Jilid ${nonQuranJilid}, Halaman ${finalNonQuranPageAwal}-${finalNonQuranPageAkhir}`,
        canvasStrokesKeys: whiteboardCanvas || undefined,
        canvasPinsKeys: (whiteboardPins && whiteboardPins.length > 0) ? JSON.stringify(whiteboardPins[0]) : undefined,
        nonQuranJilid: nonQuranJilid,
        nonQuranPageAwal: finalNonQuranPageAwal,
        nonQuranPageAkhir: finalNonQuranPageAkhir,
        nonQuranHalamanTunggal: isSinglePageNonQuran,
        interactiveComments: interactiveComments
      })
    };

    createSetoran(payload);
    alert(`Setoran ${siswaObj.namaLengkap} berhasil disimpan!`);
    
    // Clear / Reset form note and interactive correction states
    setSetoranNote('');
    setInteractiveComments([]);
    setJumlahBaris('');
    setBarisAwal('');
    setBarisAkhir('');
    try {
      saveWhiteboardCanvas('{}');
      saveWhiteboardPins([]);
    } catch (e) {
      console.error('Failed to clear whiteboard states after submission:', e);
    }
    setSelectedHighlightText('');
    setSelectedHighlightKey('');
    setRangeStartKey(null);
    setRangeEndKey(null);
    setSelectedHighlightKeys([]);
    setSelectedErrorCategory('Lainnya');
    setActiveCommentInput('');
    setKesimpulanHasilKelulusan('Lulus');
    setIsManualKelulusanOverride(false);
    setIsMultiSurah(false);
    setMultiSurahsList([]);
    setBanyakSuratSubmit(1);
    setActivePreviewSurahIndex(0);
  };

  // ----------------------------------------------------
  // RIWAYAT SETORAN FILTERS & ACTIONS
  // ----------------------------------------------------
  const [historySearch, setHistorySearch] = useState('');
  const [historyModulFilter, setHistoryModulFilter] = useState('All');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('All');
  const [historyViewMode, setHistoryViewMode] = useState<'table' | 'grid'>('table');

  // Edit Setoran state
  const [editingSetoranObj, setEditingSetoranObj] = useState<Setoran | null>(null);
  const [historyPreviewPage, setHistoryPreviewPage] = useState<number | null>(null);
  const [isEditAddingCorrection, setIsEditAddingCorrection] = useState(false);
  const [editNewWord, setEditNewWord] = useState('');
  const [editNewCategory, setEditNewCategory] = useState('');
  const [editNewSubcategory, setEditNewSubcategory] = useState('');
  const [editNewComment, setEditNewComment] = useState('');
  const [isSavingEditSetoran, setIsSavingEditSetoran] = useState(false);

  // Selected student attendance details modal state
  const [selectedStudentAttendance, setSelectedStudentAttendance] = useState<any | null>(null);

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

  // Map of siswa id to halaqahId for fallback lookup
  const siswaHalaqahMap = useMemo(() => {
    const map = new Map<string, string>();
    (siswas || []).forEach(sw => {
      if (sw.id && sw.halaqahId) {
        map.set(sw.id, sw.halaqahId);
      }
    });
    return map;
  }, [siswas]);

  // All elements defined by admin under KURIKULUM & MODUL > Mata Pelajaran & Elemen
  const adminMapelElements = useMemo(() => {
    const list: Array<{ id: string; nama: string; mapelNama: string }> = [];
    (mataPelajarans || []).forEach(mp => {
      (mp.elemenList || []).forEach(elem => {
        if (elem && elem.nama) {
          list.push({
            id: elem.id,
            nama: elem.nama.trim(),
            mapelNama: mp.nama
          });
        }
      });
    });
    return list;
  }, [mataPelajarans]);

  // Elements from elemenSettings
  const adminElemenSettingsList = useMemo(() => {
    return (elemenSettings || []).map(e => ({
      id: e.id,
      nama: e.nama.trim(),
      mapelNama: 'Pengaturan Setoran'
    }));
  }, [elemenSettings]);

  // Helper to resolve canonical element name for any setoran
  const resolveSetoranElemenName = useCallback((s: Setoran): string => {
    if (!s) return '';

    // 1. Direct elemenNama
    if (s.elemenNama && s.elemenNama.trim()) {
      const match = adminMapelElements.find(e => e.nama.toLowerCase() === s.elemenNama?.trim().toLowerCase());
      if (match) return match.nama;
      const matchSetting = adminElemenSettingsList.find(e => e.nama.toLowerCase() === s.elemenNama?.trim().toLowerCase());
      if (matchSetting) return matchSetting.nama;
      return s.elemenNama.trim();
    }

    // 2. Direct elemenId
    if (s.elemenId) {
      const match = adminMapelElements.find(e => e.id === s.elemenId || e.nama.toLowerCase() === s.elemenId?.toLowerCase());
      if (match) return match.nama;
      const matchSetting = adminElemenSettingsList.find(e => e.id === s.elemenId || e.nama.toLowerCase() === s.elemenId?.toLowerCase());
      if (matchSetting) return matchSetting.nama;
    }

    // 3. From jenisSetoran
    if (s.jenisSetoran && s.jenisSetoran.trim()) {
      const jNorm = s.jenisSetoran.trim().toLowerCase();
      const match = adminMapelElements.find(e => e.nama.toLowerCase() === jNorm || e.id.toLowerCase() === jNorm);
      if (match) return match.nama;
      const matchSetting = adminElemenSettingsList.find(e => e.nama.toLowerCase() === jNorm || e.id.toLowerCase() === jNorm);
      if (matchSetting) return matchSetting.nama;
      return s.jenisSetoran.trim();
    }

    // 4. Fallback based on module type
    if (s.tipeModul === TipeModul.AL_QURAN) {
      return 'Tahfidz';
    }
    return 'Qiroah';
  }, [adminMapelElements, adminElemenSettingsList]);

  // Filtered setorans strictly belonging to the currently selected halaqah
  const halaqahHistorySetorans = useMemo(() => {
    const targetHId = activeSelectedHalaqahId;
    const targetHNama = (activeSelectedHalaqah?.namaHalaqah || '').trim().toLowerCase();
    const isTargetPrivate = isPrivateHalaqah(activeSelectedHalaqah);

    return (setorans || []).filter(s => {
      // Exclude private halaqah setorans if viewing a non-private halaqah
      if (!isTargetPrivate && isPrivateSetoran(s, halaqahs, siswas)) {
        return false;
      }

      // Filter based on selected halaqah
      if (targetHId) {
        const sHalaqahId = s.halaqahId || siswaHalaqahMap.get(s.siswaId || '') || '';
        const matchHalaqahId = Boolean(sHalaqahId && sHalaqahId === targetHId);
        const matchHalaqahName = Boolean(
          targetHNama &&
          s.halaqahNama &&
          s.halaqahNama.trim().toLowerCase() === targetHNama
        );
        return matchHalaqahId || matchHalaqahName;
      }
      return s.guruId === teacherId || (myHalaqahs.length > 0 && myHalaqahs.some(h => h.id === s.halaqahId));
    });
  }, [setorans, activeSelectedHalaqahId, activeSelectedHalaqah, halaqahs, siswas, siswaHalaqahMap, teacherId, myHalaqahs]);

  // Dynamic elements list: strictly only elements that are submitted/achieved in this halaqah!
  const historyAvailableElements = useMemo(() => {
    const elemMap = new Map<string, { key: string; nama: string; count: number }>();

    halaqahHistorySetorans.forEach(s => {
      const elemName = resolveSetoranElemenName(s);
      if (!elemName) return;
      const key = elemName.toLowerCase();
      if (elemMap.has(key)) {
        elemMap.get(key)!.count += 1;
      } else {
        elemMap.set(key, { key, nama: elemName, count: 1 });
      }
    });

    // If there are setorans with elements in this halaqah, display ONLY those elements
    if (elemMap.size > 0) {
      return Array.from(elemMap.values()).sort((a, b) => a.nama.localeCompare(b.nama));
    }

    // Fallback if no setorans recorded yet in this halaqah: show admin elements
    const fallbackMap = new Map<string, { key: string; nama: string; count: number }>();
    adminMapelElements.forEach(e => {
      const key = e.nama.toLowerCase();
      if (!fallbackMap.has(key)) {
        fallbackMap.set(key, { key, nama: e.nama, count: 0 });
      }
    });
    adminElemenSettingsList.forEach(e => {
      const key = e.nama.toLowerCase();
      if (!fallbackMap.has(key)) {
        fallbackMap.set(key, { key, nama: e.nama, count: 0 });
      }
    });

    return Array.from(fallbackMap.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [halaqahHistorySetorans, resolveSetoranElemenName, adminMapelElements, adminElemenSettingsList]);

  // Automatically reset historyTypeFilter if selected element no longer exists in current halaqah
  useEffect(() => {
    if (historyTypeFilter !== 'All') {
      const exists = historyAvailableElements.some(e => 
        e.nama.toLowerCase() === historyTypeFilter.toLowerCase() || 
        e.key.toLowerCase() === historyTypeFilter.toLowerCase()
      );
      if (!exists && historyAvailableElements.length > 0) {
        setHistoryTypeFilter('All');
      }
    }
  }, [activeSelectedHalaqahId, historyAvailableElements]);

  // Filter setorans strictly based on the currently selected halaqah
  const filteredHistory = useMemo(() => {
    return halaqahHistorySetorans.filter(s => {
      // Search query matched with student nama or NIS
      if (historySearch) {
        const query = historySearch.toLowerCase().trim();
        const matchNama = s.siswaNama && s.siswaNama.toLowerCase().includes(query);
        const matchNis = s.siswaNis && s.siswaNis.includes(query);
        if (!matchNama && !matchNis) return false;
      }

      // Modul filter
      if (historyModulFilter !== 'All' && s.modulId !== historyModulFilter) {
        return false;
      }

      // Date filter
      if (historyDateFilter && s.tanggalSetoran !== historyDateFilter) {
        return false;
      }

      // Elemen Pembelajaran filter
      if (historyTypeFilter !== 'All') {
        const sElemName = resolveSetoranElemenName(s);
        const targetElem = historyTypeFilter.trim().toLowerCase();
        const matchesElemName = sElemName.trim().toLowerCase() === targetElem;
        const matchesJenis = (s.jenisSetoran || '').trim().toLowerCase() === targetElem;
        const matchesElemenNama = (s.elemenNama || '').trim().toLowerCase() === targetElem;
        const matchesElemenId = (s.elemenId || '').trim().toLowerCase() === targetElem;

        if (!matchesElemName && !matchesJenis && !matchesElemenNama && !matchesElemenId) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (a.tanggalSetoran !== b.tanggalSetoran) {
        return b.tanggalSetoran.localeCompare(a.tanggalSetoran);
      }
      const tsA = parseInt(a.id.replace('set-', '')) || 0;
      const tsB = parseInt(b.id.replace('set-', '')) || 0;
      return tsB - tsA;
    });
  }, [
    halaqahHistorySetorans,
    historySearch,
    historyModulFilter,
    historyDateFilter,
    historyTypeFilter,
    resolveSetoranElemenName
  ]);

  const handleSaveEditSetoran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetoranObj) return;

    updateSetoran(editingSetoranObj.id, editingSetoranObj);
    alert('Penilaian setoran berhasil diperbarui!');
    setEditingSetoranObj(null);
  };

  const [confirmDeleteSetoran, setConfirmDeleteSetoran] = useState<{ id: string; sname: string } | null>(null);

  const handleDeleteSetoranAction = (id: string, sname: string) => {
    setConfirmDeleteSetoran({ id, sname });
  };

  const executeDeleteSetoran = () => {
    if (!confirmDeleteSetoran) return;
    deleteSetoran(confirmDeleteSetoran.id);
    addLog('Hapus Setoran', `Guru menghapus setoran siswa: ${confirmDeleteSetoran.sname}`);
    setConfirmDeleteSetoran(null);
  };

  const renderQuranCorrectionFormFields = () => {
    const activeSName = isMultiSurah && multiSurahsList[activePreviewSurahIndex]
      ? multiSurahsList[activePreviewSurahIndex].suratNama
      : quranSuratName;
    const activeAAwal = isMultiSurah && multiSurahsList[activePreviewSurahIndex]
      ? Number(multiSurahsList[activePreviewSurahIndex].ayatAwal) || 1
      : Number(quranAyatAwal) || 1;
    const surahObj = SURAH_LIST.find(s => s.nama === activeSName);
    const surahNo = surahObj ? surahObj.no : 1;
    const currentActivePage = getQuranPageNumber(surahNo, activeAAwal, activeModul);
    const { filteredCategories: filteredCats, configuredTipe, activeRule } = getValidErrorCategoriesForElemen(
      selectedElemenObj,
      currentActivePage,
      1,
      tajwidCategories
    );

    return (
      <div className="space-y-3.5">
        {/* Presets Cepat khusus bila Ayat Terpilih */}
        {(selectedHighlightKey.endsWith('-verse') || selectedHighlightText.toLowerCase().includes('ayat')) && (
          <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 rounded-xl space-y-2">
            <span className="block text-[9px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              ⚡ Preset Cepat Koreksi Ayat (Klik Langsung):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveCommentInput(`${selectedHighlightText} tersendat / tidak lancar`);
                  setSelectedSubCategory('Tidak Lancar / Tersendat');
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs"
              >
                🔴 Ayat Tersendat / Tidak Lancar
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCommentInput(`Lupa kelanjutan bacaan pada ${selectedHighlightText}`);
                  setSelectedSubCategory('Lupa Hafalan');
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs"
              >
                🟡 Lupa Kelanjutan Ayat
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCommentInput(`Tukar / salah sambung pada ${selectedHighlightText}`);
                  setSelectedSubCategory('Salah Sambung');
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors shadow-xs"
              >
                🟧 Salah Sambung Ayat
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCommentInput(`Perlu pengulangan murojaah ulang pada ${selectedHighlightText}`);
                  setSelectedSubCategory('Perlu Pengulangan');
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors shadow-xs"
              >
                🔁 Perlu Pengulangan Ulang
              </button>
            </div>
          </div>
        )}

        {/* Category & Subcategory selection */}
        {configuredTipe === 'none' ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300">
            <span>📌</span>
            <span>Aturan Halaman Aktif (Hal {currentActivePage}): Kategori kesalahan dinonaktifkan untuk rentang halaman ini.</span>
          </div>
        ) : filteredCats.length > 0 ? (
          <div className="space-y-2">
            {activeRule && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-md text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                <span>📌</span>
                <span>
                  Batas Halaman Aktif: Hal {activeRule.startPage} - {activeRule.endPage > 900 ? 'Seterusnya' : activeRule.endPage} &rarr; Otomatis {activeRule.tipeKesalahan === 'dasar' || activeRule.tipeKesalahan === 'lahn_jaliy' ? 'Lahn Jaliy' : activeRule.tipeKesalahan === 'tajwid' || activeRule.tipeKesalahan === 'lahn_khafiy' ? 'Lahn Khafiy' : activeRule.tipeKesalahan === 'none' ? 'Tanpa Kesalahan' : 'Semua Kesalahan'} {activeRule.keterangan ? `(${activeRule.keterangan})` : ''}
                </span>
              </div>
            )}
            {!showSetoranCategoryPicker ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 shadow-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400">Kategori:</span>
                    <span className="px-2.5 py-1 bg-amber-500 text-amber-950 border border-amber-600 font-extrabold text-xs rounded-lg shadow-2xs">
                      {selectedErrorCategory}
                    </span>
                    {selectedSubCategory && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold text-[11px] rounded-md flex items-center gap-1">
                        <span>Sub: {selectedSubCategory}</span>
                        <button
                          type="button"
                          onClick={handleClearSubCategory}
                          className="hover:text-rose-600 ml-0.5 text-xs cursor-pointer"
                          title="Hapus subkategori"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {(() => {
                      const { isOnce, canonKey } = isOnceCategory(selectedErrorCategory);
                      if (!isOnce) return null;
                      if (selectedSubCategory) {
                        const subNorm = normalizeSubKey(selectedSubCategory);
                        const alreadyLogged = interactiveComments.some(c => {
                          const cCat = (c.category || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                          if (cCat !== canonKey && cCat !== (selectedErrorCategory || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')) return false;
                          return normalizeSubKey(c.subcategory) === subNorm;
                        });
                        return alreadyLogged ? (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-semibold text-[10px] rounded-md" title="Huruf ini sudah tercatat di sesi ini (0 pt • Maks 1x)">
                            Sudah 1x (0 pt)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold text-[10px] rounded-md" title="Kesalahan pertama pada huruf ini memotong poin (Maksimal 1x potong per huruf)">
                            Maks 1x per huruf
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold text-[10px] rounded-md" title="Kategori ini memotong nilai maksimal 1x per sesi/subkategori">
                          Maks 1x Potong
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSetoranCategoryPicker(true)}
                    className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Pilih / Ganti Kategori</span>
                    <span>▾</span>
                  </button>
                </div>

                {/* Subcategories / Huruf Hijaiyah for active category */}
                {(() => {
                  const currentCatObj = tajwidCategories.find(c => c.nama === selectedErrorCategory);
                  const subcategories = getCategorySubcategoriesList(currentCatObj, selectedErrorCategory);
                  if (subcategories.length === 0) return null;
                  return (
                    <div className="p-2.5 bg-emerald-50/70 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl space-y-1.5 shadow-2xs animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <span>🔤</span>
                          <span>Subkategori / Huruf Hijaiyah ({selectedErrorCategory}):</span>
                        </span>
                        {selectedSubCategory && (
                          <button
                            type="button"
                            onClick={handleClearSubCategory}
                            className="text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            Reset Huruf ✕
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-[140px] overflow-y-auto p-0.5">
                        {subcategories.map((sub: any) => {
                          const isSubSelected = selectedSubCategory === sub.nama;
                          const subNorm = normalizeSubKey(sub.nama);
                          const { isOnce, canonKey } = isOnceCategory(selectedErrorCategory);
                          const alreadyLogged = isOnce && interactiveComments.some(c => {
                            const cCat = (c.category || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (cCat !== canonKey && cCat !== (selectedErrorCategory || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')) return false;
                            return normalizeSubKey(c.subcategory) === subNorm;
                          });

                          return (
                            <button
                              key={sub.id || sub.nama}
                              type="button"
                              onClick={() => handleSubCategorySelect(sub.nama, false)}
                              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                isSubSelected
                                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold ring-2 ring-emerald-400 scale-105'
                                  : alreadyLogged
                                    ? 'bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/60'
                                    : 'bg-white hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                              title={alreadyLogged ? `${sub.nama} (sudah pernah dicatat di sesi ini • maks 1x potong)` : sub.nama}
                            >
                              <span>{sub.nama}</span>
                              {alreadyLogged && (
                                <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 rounded font-bold">
                                  1x
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Expanded category picker */
              <div className="bg-white/95 dark:bg-slate-900/95 p-3 rounded-xl border border-amber-300 dark:border-amber-800 space-y-2.5 animate-fade-in shadow-sm">
                <div className="flex items-center justify-between border-b border-amber-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 font-mono">
                    {configuredTipe === 'dasar' ? 'PILIH KATEGORI KESALAHAN DASAR:' : 'PILIH KATEGORI KESALAHAN TAJWID:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSetoranCategoryPicker(false)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                  >
                    Tutup ▴
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-0.5">
                  {filteredCats.map(cat => {
                    const isSelected = selectedErrorCategory === cat.nama;
                    const subList = getCategorySubcategoriesList(cat, cat.nama);
                    const hasSub = subList.length > 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.nama, subList.length)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'ring-2 ring-amber-500 font-extrabold shadow-xs bg-amber-500 text-amber-950 border-amber-600 scale-102'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800'
                        }`}
                      >
                        <span>{cat.nama}</span>
                        {hasSub && (
                          <span className={`text-[9px] px-1 py-0.2 rounded-md font-mono ${
                            isSelected ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {subList.length} sub
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Subcategory selection inside expanded view */}
                {(() => {
                  const currentCatObj = tajwidCategories.find(c => c.nama === selectedErrorCategory);
                  const subcategories = getCategorySubcategoriesList(currentCatObj, selectedErrorCategory);
                  if (subcategories.length === 0) return null;
                  return (
                    <div className="p-2.5 bg-emerald-50/80 dark:bg-slate-850/90 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest font-mono flex items-center gap-1">
                          <span>🔤</span>
                          <span>Pilih Huruf Hijaiyah / Subkategori ({selectedErrorCategory}):</span>
                        </span>
                        {selectedSubCategory && (
                          <button
                            type="button"
                            onClick={handleClearSubCategory}
                            className="text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            Reset Huruf ✕
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-[150px] overflow-y-auto p-0.5">
                        {subcategories.map((sub: any) => {
                          const isSubSelected = selectedSubCategory === sub.nama;
                          const subNorm = normalizeSubKey(sub.nama);
                          const { isOnce, canonKey } = isOnceCategory(selectedErrorCategory);
                          const alreadyLogged = isOnce && interactiveComments.some(c => {
                            const cCat = (c.category || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (cCat !== canonKey && cCat !== (selectedErrorCategory || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')) return false;
                            return normalizeSubKey(c.subcategory) === subNorm;
                          });

                          return (
                            <button
                              key={sub.id || sub.nama}
                              type="button"
                              onClick={() => handleSubCategorySelect(sub.nama, false)}
                              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                isSubSelected
                                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold ring-2 ring-emerald-400 scale-105'
                                  : alreadyLogged
                                    ? 'bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/60'
                                    : 'bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                              title={alreadyLogged ? `${sub.nama} (sudah pernah dicatat di sesi ini • maks 1x potong)` : sub.nama}
                            >
                              <span>{sub.nama}</span>
                              {alreadyLogged && (
                                <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 rounded font-bold">
                                  1x
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : null}

        {/* Optional quick note input */}
        <div>
          {!showQuranQuickNote && !activeCommentInput ? (
            <button
              type="button"
              onClick={() => setShowQuranQuickNote(true)}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>+ Tambah catatan teks sekarang (opsional)</span>
            </button>
          ) : (
            <div className="space-y-1 pt-1 animate-fade-in">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span>Catatan Langsung (Opsional):</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommentInput('');
                    setShowQuranQuickNote(false);
                  }}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer font-bold"
                >
                  Tutup ×
                </button>
              </div>
              <input
                type="text"
                value={activeCommentInput}
                onChange={(e) => setActiveCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveQuranCorrection();
                  }
                }}
                placeholder="Tulis detail kesalahan tambahan jika perlu..."
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-sans"
                autoFocus
              />
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-sans flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <span>💡</span>
          <span><strong>Alur Cepat Guru:</strong> Cukup tekan <strong>SIMPAN KOREKSI</strong>. Anda tidak harus mengetik sekarang, catatan perbaikan dapat dilengkapi di daftar bawah setelah santri selesai setoran.</span>
        </p>
      </div>
    );
  };

  const renderNonQuranCorrectionFormFields = (activePageNum: number) => {
    const currentActivePage = activePageNum;
    const currentActiveJilid = nonQuranJilid || 1;
    const { filteredCategories: filteredCats, configuredTipe, activeRule } = getValidErrorCategoriesForElemen(
      selectedElemenObj,
      currentActivePage,
      currentActiveJilid,
      tajwidCategories
    );

    return (
      <div className="space-y-3.5">
        {/* Category & Subcategory selection for Non-Quran */}
        {configuredTipe === 'none' ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300">
            <span>📌</span>
            <span>Aturan Halaman Aktif (Hal {currentActivePage}): Kategori kesalahan dinonaktifkan untuk rentang halaman ini.</span>
          </div>
        ) : filteredCats.length > 0 ? (
          <div className="space-y-2">
            {activeRule && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                <span>📌</span>
                <span>
                  Aturan Halaman Aktif: Jilid {activeRule.jilidAwal || 1} Hal {activeRule.startPage} - {activeRule.endPage > 900 ? 'Seterusnya' : activeRule.endPage} &rarr; {activeRule.tipeKesalahan === 'dasar' || activeRule.tipeKesalahan === 'lahn_jaliy' ? 'Lahn Jaliy' : activeRule.tipeKesalahan === 'tajwid' || activeRule.tipeKesalahan === 'lahn_khafiy' ? 'Lahn Khafiy' : activeRule.tipeKesalahan === 'none' ? 'Tanpa Kesalahan' : 'Semua Kesalahan'} {activeRule.keterangan ? `(${activeRule.keterangan})` : ''}
                </span>
              </div>
            )}
            {!showSetoranCategoryPicker ? (
              /* Collapsed state (showing active category + ALWAYS VISIBLE SUBCATEGORIES IF AVAILABLE) */
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 shadow-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400">Kategori:</span>
                    <span className="px-2.5 py-1 bg-amber-500 text-amber-950 border border-amber-600 font-extrabold text-xs rounded-lg shadow-2xs">
                      {selectedErrorCategory}
                    </span>
                    {selectedSubCategory && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold text-[11px] rounded-md flex items-center gap-1">
                        <span>Sub: {selectedSubCategory}</span>
                        <button
                          type="button"
                          onClick={handleClearSubCategory}
                          className="hover:text-rose-600 ml-0.5 text-xs cursor-pointer"
                          title="Hapus subkategori"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {(() => {
                      const { isOnce, canonKey } = isOnceCategory(selectedErrorCategory);
                      if (!isOnce) return null;
                      if (selectedSubCategory) {
                        const subNorm = normalizeSubKey(selectedSubCategory);
                        const alreadyLogged = interactiveComments.some(c => {
                          const cCat = (c.category || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                          if (cCat !== canonKey && cCat !== (selectedErrorCategory || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')) return false;
                          return normalizeSubKey(c.subcategory) === subNorm;
                        });
                        return alreadyLogged ? (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-semibold text-[10px] rounded-md" title="Huruf ini sudah tercatat di sesi ini (0 pt • Maks 1x)">
                            Sudah 1x (0 pt)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold text-[10px] rounded-md" title="Kesalahan pertama pada huruf ini memotong poin (Maksimal 1x potong per huruf)">
                            Maks 1x per huruf
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold text-[10px] rounded-md" title="Kategori ini memotong nilai maksimal 1x per sesi/subkategori">
                          Maks 1x Potong
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSetoranCategoryPicker(true)}
                    className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Pilih / Ganti Kategori</span>
                    <span>▾</span>
                  </button>
                </div>

                {/* ALWAYS VISIBLE SUBCATEGORIES FOR ACTIVE CATEGORY (e.g. Huruf Hijaiyah for Makhraj) */}
                {(() => {
                  const currentCatObj = tajwidCategories.find(c => c.nama === selectedErrorCategory);
                  const subcategories = getCategorySubcategoriesList(currentCatObj, selectedErrorCategory);
                  if (subcategories.length === 0) return null;
                  return (
                    <div className="p-2.5 bg-indigo-50/70 dark:bg-slate-900/80 border border-indigo-200/80 dark:border-indigo-900/50 rounded-xl space-y-1.5 shadow-2xs animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-extrabold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <span>🔤</span>
                          <span>Subkategori / Huruf Hijaiyah ({selectedErrorCategory}):</span>
                        </span>
                        {selectedSubCategory && (
                          <button
                            type="button"
                            onClick={handleClearSubCategory}
                            className="text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            Reset Huruf ✕
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-[140px] overflow-y-auto p-0.5">
                        {subcategories.map((sub: any) => {
                          const isSubSelected = selectedSubCategory === sub.nama;
                          const subNorm = normalizeSubKey(sub.nama);
                          const { isOnce, canonKey } = isOnceCategory(selectedErrorCategory);
                          const alreadyLogged = isOnce && interactiveComments.some(c => {
                            const cCat = (c.category || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (cCat !== canonKey && cCat !== (selectedErrorCategory || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')) return false;
                            return normalizeSubKey(c.subcategory) === subNorm;
                          });

                          return (
                            <button
                              key={sub.id || sub.nama}
                              type="button"
                              onClick={() => handleSubCategorySelect(sub.nama, false)}
                              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                isSubSelected
                                  ? 'bg-indigo-600 text-white shadow-xs font-extrabold ring-2 ring-indigo-400 scale-105'
                                  : alreadyLogged
                                    ? 'bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/60'
                                    : 'bg-white hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                              title={alreadyLogged ? `${sub.nama} (sudah pernah dicatat di sesi ini • maks 1x potong)` : sub.nama}
                            >
                              <span>{sub.nama}</span>
                              {alreadyLogged && (
                                <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 rounded font-bold">
                                  1x
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Expanded state when choosing category */
              <div className="bg-white/95 dark:bg-slate-900/95 p-3 rounded-xl border border-amber-300 dark:border-amber-800 space-y-2.5 animate-fade-in shadow-sm">
                <div className="flex items-center justify-between border-b border-amber-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 font-mono">
                    {configuredTipe === 'dasar' ? 'PILIH KATEGORI KESALAHAN DASAR:' : 'PILIH KATEGORI KESALAHAN TAJWID:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSetoranCategoryPicker(false)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                  >
                    Tutup ▴
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-0.5">
                  {filteredCats.map(cat => {
                    const isSelected = selectedErrorCategory === cat.nama;
                    const subList = getCategorySubcategoriesList(cat, cat.nama);
                    const hasSub = subList.length > 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.nama, subList.length)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'ring-2 ring-amber-500 font-extrabold shadow-xs bg-amber-500 text-amber-950 border-amber-600 scale-102'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800'
                        }`}
                      >
                        <span>{cat.nama}</span>
                        {hasSub && (
                          <span className={`text-[9px] px-1 py-0.2 rounded-md font-mono ${
                            isSelected ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {subList.length} sub
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Subcategory Selection inside expanded view */}
                {(() => {
                  const currentCatObj = tajwidCategories.find(c => c.nama === selectedErrorCategory);
                  const subcategories = getCategorySubcategoriesList(currentCatObj, selectedErrorCategory);
                  if (subcategories.length === 0) return null;
                  return (
                    <div className="p-2.5 bg-indigo-50/80 dark:bg-slate-850/90 border border-indigo-200 dark:border-indigo-900/60 rounded-xl space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-extrabold text-indigo-800 dark:text-indigo-300 uppercase tracking-widest font-mono flex items-center gap-1">
                          <span>🔤</span>
                          <span>Pilih Huruf Hijaiyah / Subkategori ({selectedErrorCategory}):</span>
                        </span>
                        {selectedSubCategory && (
                          <button
                            type="button"
                            onClick={handleClearSubCategory}
                            className="text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            Reset Huruf ✕
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-[150px] overflow-y-auto p-0.5">
                        {subcategories.map((sub: any) => {
                          const isSubSelected = selectedSubCategory === sub.nama;
                          const subNorm = normalizeSubKey(sub.nama);
                          const { isOnce, canonKey } = isOnceCategory(selectedErrorCategory);
                          const alreadyLogged = isOnce && interactiveComments.some(c => {
                            const cCat = (c.category || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (cCat !== canonKey && cCat !== (selectedErrorCategory || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')) return false;
                            return normalizeSubKey(c.subcategory) === subNorm;
                          });

                          return (
                            <button
                              key={sub.id || sub.nama}
                              type="button"
                              onClick={() => handleSubCategorySelect(sub.nama, false)}
                              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                isSubSelected
                                  ? 'bg-indigo-600 text-white shadow-xs font-extrabold ring-2 ring-indigo-400 scale-105'
                                  : alreadyLogged
                                    ? 'bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/60'
                                    : 'bg-white hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}
                              title={alreadyLogged ? `${sub.nama} (sudah pernah dicatat di sesi ini • maks 1x potong)` : sub.nama}
                            >
                              <span>{sub.nama}</span>
                              {alreadyLogged && (
                                <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 rounded font-bold">
                                  1x
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : null}

        {/* Optional quick note input */}
        <div>
          {!showNonQuranQuickNote && !activeCommentInput ? (
            <button
              type="button"
              onClick={() => setShowNonQuranQuickNote(true)}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>+ Tambah catatan teks sekarang (opsional)</span>
            </button>
          ) : (
            <div className="space-y-1 pt-1 animate-fade-in">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span>Catatan Langsung (Opsional):</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommentInput('');
                    setShowNonQuranQuickNote(false);
                  }}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer font-bold"
                >
                  Tutup ×
                </button>
              </div>
              <input
                type="text"
                value={activeCommentInput}
                onChange={(e) => setActiveCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNonQuranCorrection(currentActivePage);
                  }
                }}
                placeholder="Ketik catatan rincian kesalahan jika perlu..."
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-sans"
                autoFocus
              />
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-sans flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <span>💡</span>
          <span><strong>Alur Cepat Guru:</strong> Cukup tekan <strong>SIMPAN KOREKSI</strong>. Anda tidak harus mengetik sekarang, catatan perbaikan dapat dilengkapi di daftar <strong>KOREKSI INTERAKTIF SESI INI</strong> di bawah setelah santri selesai setoran.</span>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Mutabaah Navigation Tabs with horizontal mobile layout (left to right) */}
      <div className="w-full max-w-full pb-1">
        <div className="w-full bg-slate-100/80 dark:bg-slate-900/70 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-2">
            <button
              type="button"
              onClick={() => setInnerTab('input')}
              className={`w-full sm:w-auto px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                innerTab === 'input' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-200/60 dark:border-indigo-800/80' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <BookPlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Input Setoran</span>
              <span className="inline sm:hidden">Input</span>
            </button>
            <button
              type="button"
              onClick={() => setInnerTab('riwayat')}
              className={`w-full sm:w-auto px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                innerTab === 'riwayat' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-200/60 dark:border-indigo-800/80' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Riwayat Setoran</span>
              <span className="inline sm:hidden">Riwayat</span>
            </button>
            <button
              type="button"
              onClick={() => setInnerTab('capaian_bacaan')}
              className={`w-full sm:w-auto px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                innerTab === 'capaian_bacaan' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <FileCheck2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${innerTab === 'capaian_bacaan' ? 'text-white' : 'text-emerald-600'}`} />
              <span className="hidden sm:inline">Capaian Bacaan Ayat</span>
              <span className="inline sm:hidden text-[11px] truncate">Capaian Ayat</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {innerTab === 'capaian_bacaan' && (
          <div className="animate-fade-in">
            <CapaianBacaanSystem 
              initialHalaqahId={activeSelectedHalaqahId || setoranHalaqahId || myHalaqah?.id} 
              initialSiswaId={capaianBacaanSiswaId || setoranSiswaId}
              onSiswaChange={(newId) => setCapaianBacaanSiswaId(newId)}
            />
          </div>
        )}
        {innerTab === 'input' && (
          <div>
                    <div className="w-full max-w-7xl mx-auto px-2 md:px-4 space-y-4 animate-fade-in">

          {/* Header section with humble literal styling and clear brief text */}
          <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📖</span>
                <span>Uji &amp; Catat Setoran Capaian Santri</span>
              </h2>
              <p className="text-xs text-slate-405 mt-0.5">Gunakan panel terpisah untuk mengatur setoran, membaca lembar mushaf/kitab, dan memberi penilaian.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
                className={`p-2 px-3 text-[11px] font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  isConfigCollapsed 
                    ? 'bg-transparent border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600'
                }`}
              >
                <span>⚙️</span>
                <span>{isConfigCollapsed ? "Buka Form" : "Sembunyikan Form"}</span>
              </button>
              <button 
                type="button"
                onClick={() => setIsEvaluationCollapsed(!isEvaluationCollapsed)}
                className={`p-2 px-3 text-[11px] font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  isEvaluationCollapsed 
                    ? 'bg-transparent border-dashed border-[#c5a880] text-amber-600 dark:text-amber-500' 
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600'
                }`}
              >
                <span>📝</span>
                <span>{isEvaluationCollapsed ? "Buka Panel Nilai" : "Sembunyikan Panel Nilai"}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateSetoranByGuru} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <div className="lg:col-span-4 space-y-6 flex flex-col">
              
              {/* ========================================================
                  BLOK A: INFORMASI SETORAN & KONFIGURASI (Collapsible)
                  ======================================================== */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs overflow-hidden transition-all">
                {/* Header Toggle */}
                <div 
                  onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
                  className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-855 flex items-center justify-between cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-905 transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">⚙️</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      BLOK A: Konfigurasi Setoran
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-all font-bold">
                    {isConfigCollapsed ? "▼ BUKA" : "▲ SEMBUNYIKAN"}
                  </span>
                </div>

                {/* Collapsed Brief Summary */}
                {isConfigCollapsed && (
                  <div className="p-4 bg-emerald-50/10 border-b border-slate-50 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-300 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">Nama Santri:</span>
                      <strong className="text-slate-800 dark:text-white font-extrabold">{selectedSiswaObj?.namaLengkap || 'Belum dipilih'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">Materi / Surah:</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                        {isMultiSurah 
                          ? `Multi-Surat [${multiSurahsList.length}]` 
                          : (activeModul?.namaSurat ? `Surat ${activeModul.namaSurat}` : activeModul?.judulModul || 'Belum dipilih')}
                      </strong>
                    </div>
                    {!isMultiSurah && activeModul?.tipe === TipeModul.AL_QURAN && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Rentang Ayat:</span>
                        <strong className="text-indigo-650 dark:text-indigo-400 font-mono">Ayat {quranAyatAwal} s/d {quranAyatAkhir}</strong>
                      </div>
                    )}
                    {activeModul?.tipe === TipeModul.NON_AL_QURAN && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Rentang Halaman:</span>
                        <strong className="text-indigo-650 dark:text-indigo-400 font-mono">
                          {activeModul.isMultiJilid ? `Jilid ${nonQuranJilid} - ` : ''} 
                          {isSinglePageNonQuran 
                            ? `Halaman ${nonQuranPageSingle}` 
                            : `Halaman ${nonQuranPageAwal} s/d ${nonQuranPageAkhir}`}
                        </strong>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsConfigCollapsed(false)}
                      className="w-full mt-2 py-1 bg-slate-100 hover:bg-slate-205 dark:bg-slate-900 border text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300 rounded-lg text-center"
                    >
                      Ubah Konfigurasi
                    </button>
                  </div>
                )}

                {/* Main Content Form Fields */}
                <div className={`p-5 space-y-4 ${isConfigCollapsed ? 'hidden' : 'block'}`}>
            
                  {/* Day & Date selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-900 dark:text-emerald-450 uppercase tracking-widest mb-1.5">TANGGAL SETORAN *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-450" />
                      <input 
                        type="date" 
                        value={setoranDate}
                        onChange={(e) => setSetoranDate(e.target.value)}
                        required
                        className="w-full pl-9 p-2 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Halaqah Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-900 dark:text-emerald-450 uppercase tracking-widest mb-1.5">KELOMPOK HALAQAH *</label>
                    <select 
                      value={setoranHalaqahId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSetoranHalaqahId(val);
                        if (val && setSelectedGuruHalaqahId) {
                          setSelectedGuruHalaqahId(val);
                        }
                      }}
                      className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900"
                    >
                      <option value="">-- Pilih Halaqah --</option>
                      {myHalaqahs.map(h => <option key={h.id} value={h.id}>{h.namaHalaqah}</option>)}
                    </select>
                  </div>

                  {/* Student Candidate selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-900 dark:text-emerald-450 uppercase tracking-widest mb-1.5">PILIH SANTRI *</label>
                    <select 
                      value={setoranSiswaId}
                      onChange={(e) => setSetoranSiswaId(e.target.value)}
                      required
                      className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value="">-- Pilih Santri --</option>
                      {setoranCandidates.map(c => <option key={c.id} value={c.id}>{c.namaLengkap} - NIS: {c.nis}</option>)}
                    </select>
                  </div>

                  {/* Elemen Capaian (automatically loads dynamic element models set by admin) */}
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-900 dark:text-emerald-450 uppercase tracking-widest mb-1.5">ELEMEN CAPAIAN *</label>
                    <select 
                      value={setoranElemen}
                      onChange={(e) => setSetoranElemen(e.target.value)}
                      className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 font-bold"
                    >
                      {availableElemenSettings.map(elem => (
                        <option key={elem.id} value={elem.id}>
                          {elem.isBerjenjang ? `Level ${elem.jenjangLevel || 1} - ${elem.nama}` : elem.nama}
                        </option>
                      ))}
                    </select>

                    {(isCapaianBacaanTrialEnabled || isAdminUtama(myUser)) && (capaianBacaanTrialSettings?.enabledElemenIds || []).includes(setoranElemen) && (
                      <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Elemen ini terhubung dengan <strong>Capaian Bacaan Ayat</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInnerTab('capaian_bacaan')}
                          className="shrink-0 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition cursor-pointer"
                        >
                          Buka Capaian Ayat →
                        </button>
                      </div>
                    )}
                  </div>

            {/* PREVIOUS RECORD PREVIEW SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-xs shadow-xs overflow-hidden transition-all">
              
              {/* Header Box */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-900/50 flex items-center justify-center shrink-0 shadow-2xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-sans leading-tight">
                        CAPAIAN SEBELUMNYA SISWA
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                        {selectedSiswaObj
                          ? `Santri: ${selectedSiswaObj.namaLengkap}`
                          : 'Riwayat mutabaah terakhir yang tercatat'}
                      </p>
                    </div>
                  </div>

                  {prevSetoranObj && (
                    <div className="shrink-0">
                      {renderStatusBadge(resolveKesimpulanStatus(prevSetoranObj))}
                    </div>
                  )}
                </div>
              </div>

              {prevSetoranObj ? (
                <div className="p-3.5 sm:p-4 space-y-3">
                  
                  {/* Hero Box: Modul, Surah / Halaman & Rincian */}
                  <div className="bg-slate-50/75 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">
                          {prevSetoranObj.modulNama || 'Materi Modul'}
                        </span>
                        <p className="font-extrabold text-[13px] text-slate-900 dark:text-white leading-snug break-words">
                          {prevSetoranObj.suratNama 
                            ? `Surat ${prevSetoranObj.suratNama}` 
                            : (prevSetoranObj.catatanModulLain || prevSetoranObj.modulNama || 'Setoran Modul')}
                        </p>
                      </div>
                    </div>

                    {/* Chips Bar: Ayat / Halaman / Baris */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                      {prevSetoranObj.suratNama && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900/50">
                          Ayat {prevSetoranObj.ayatAwal} – {prevSetoranObj.ayatAkhir}
                        </span>
                      )}
                      
                      {/* Non-Quran Page Info */}
                      {(prevSetoranObj.nonQuranPageAwal !== undefined || prevSetoranObj.halaman !== undefined || (prevSetoranObj.catatanModulLain && !prevSetoranObj.suratNama)) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900/50">
                          {prevSetoranObj.nonQuranJilid !== undefined || prevSetoranObj.jilid !== undefined 
                            ? `Jilid ${prevSetoranObj.nonQuranJilid ?? prevSetoranObj.jilid} • ` 
                            : ''}
                          {prevSetoranObj.nonQuranHalamanTunggal || prevSetoranObj.nonQuranPageAwal === prevSetoranObj.nonQuranPageAkhir
                            ? `Hal. ${prevSetoranObj.nonQuranPageAwal ?? prevSetoranObj.halaman}`
                            : (prevSetoranObj.nonQuranPageAwal !== undefined && prevSetoranObj.nonQuranPageAkhir !== undefined)
                              ? `Hal. ${prevSetoranObj.nonQuranPageAwal} – ${prevSetoranObj.nonQuranPageAkhir}`
                              : (prevSetoranObj.halaman ? `Hal. ${prevSetoranObj.halaman}` : (prevSetoranObj.catatanModulLain || 'Halaman'))}
                        </span>
                      )}

                      {/* Line Count (Baris) */}
                      {prevSetoranObj.jumlahBaris !== undefined && prevSetoranObj.jumlahBaris !== null && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-900/50">
                          {prevSetoranObj.jumlahBaris} Baris {prevSetoranObj.barisAwal !== undefined && prevSetoranObj.barisAkhir !== undefined ? `(${prevSetoranObj.barisAwal}–${prevSetoranObj.barisAkhir})` : ''}
                        </span>
                      )}
                    </div>

                    {/* Multi-Surah Sub-List (if any) */}
                    {prevSetoranObj.daftarSuratSetoran && prevSetoranObj.daftarSuratSetoran.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-1.5">
                        <span className="text-[9.5px] font-semibold text-slate-400 self-center mr-1">Rincian:</span>
                        {prevSetoranObj.daftarSuratSetoran.map((ds, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs">
                            <span>{ds.suratNama}</span>
                            <span className="font-mono text-[9px] text-slate-500">({ds.ayatAwal}–{ds.ayatAkhir})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clean Structured Parameter List (Key-Value Row Design - Left Aligned, No Icons) */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-200/60 dark:divide-slate-800/60 text-[11px] overflow-hidden">
                    
                    {/* Row 1: Elemen Capaian */}
                    <div className="px-3.5 py-2.5 grid grid-cols-[120px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2">
                      <div className="flex items-center justify-between pr-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                        <span>Elemen Capaian</span>
                        <span className="text-slate-300 dark:text-slate-600 font-normal">:</span>
                      </div>
                      <div className="text-left font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {(prevSetoranObj.jenisSetoran || (prevSetoranObj.tipeModul === TipeModul.AL_QURAN ? "Tahfidz Al-Qur'an" : "Qiroah"))
                          .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{FE00}-\u{FE0F}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{200D}]/gu, '')
                          .trim()}
                      </div>
                    </div>

                    {/* Row 2: Kategori / Tipe */}
                    <div className="px-3.5 py-2.5 grid grid-cols-[120px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2">
                      <div className="flex items-center justify-between pr-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                        <span>Kategori / Tipe</span>
                        <span className="text-slate-300 dark:text-slate-600 font-normal">:</span>
                      </div>
                      <div className="text-left font-semibold text-slate-800 dark:text-slate-200 uppercase truncate">
                        {(prevSetoranObj.tipeTahfidz || (prevSetoranObj.jenisSetoran ? 'Reguler' : '-'))
                          .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{FE00}-\u{FE0F}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{200D}]/gu, '')
                          .trim()}
                      </div>
                    </div>

                    {/* Row 3: Tanggal */}
                    <div className="px-3.5 py-2.5 grid grid-cols-[120px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2">
                      <div className="flex items-center justify-between pr-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                        <span>Tanggal</span>
                        <span className="text-slate-300 dark:text-slate-600 font-normal">:</span>
                      </div>
                      <div className="text-left font-medium text-slate-800 dark:text-slate-200">
                        {formatIndonesianDate ? formatIndonesianDate(prevSetoranObj.tanggalSetoran) : prevSetoranObj.tanggalSetoran}
                      </div>
                    </div>

                    {/* Row 4: Predikat & Nilai */}
                    <div className="px-3.5 py-2.5 grid grid-cols-[120px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2">
                      <div className="flex items-center justify-between pr-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">
                        <span>Predikat &amp; Nilai</span>
                        <span className="text-slate-300 dark:text-slate-600 font-normal">:</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-left flex-wrap">
                        {prevSetoranObj.predikatNilai ? (
                          <>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {cleanPredikatText(prevSetoranObj.predikatNilai)}
                            </span>
                            {prevSetoranObj.nilai !== undefined && prevSetoranObj.nilai !== null && String(prevSetoranObj.nilai).trim() !== '' && (
                              <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                                ({prevSetoranObj.nilai})
                              </span>
                            )}
                          </>
                        ) : (prevSetoranObj.nilai !== undefined && prevSetoranObj.nilai !== null && String(prevSetoranObj.nilai).trim() !== '') ? (
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {prevSetoranObj.nilai}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Catatan Guru Box */}
                  <div className="bg-amber-50/30 dark:bg-amber-950/15 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        CATATAN GURU
                      </span>
                      {prevSetoranObj.guruNama && (
                        <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium font-sans truncate max-w-[170px]">
                          Pembimbing: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{prevSetoranObj.guruNama}</strong>
                        </span>
                      )}
                    </div>
                    {renderCatatanList(prevSetoranObj.catatanGuru)}
                  </div>

                </div>
              ) : (
                <div className="p-5 text-center bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {selectedElemenObj
                      ? `Belum Ada Riwayat Setoran untuk Elemen "${selectedElemenObj.nama}"`
                      : 'Belum Ada Riwayat Mutabaah Sebelumnya'}
                  </p>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                    {selectedSiswaObj
                      ? `${selectedSiswaObj.namaLengkap} belum memiliki catatan setoran sebelumnya pada elemen ini.`
                      : 'Pilih santri untuk melihat riwayat dan capaian mutabaah sebelumnya.'}
                  </p>
                </div>
              )}
            </div>

            {/* Toggle Mode: 1 Surat vs Multi-Surat */}
            {selectedElemenObj?.tipeModul === TipeModul.AL_QURAN && (
              <div className="flex items-center justify-between p-3 bg-emerald-50/20 dark:bg-slate-900/40 rounded-xl border border-emerald-100/40 dark:border-slate-800/60 shadow-xs">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 block uppercase tracking-wider font-mono">MODE SETORAN AL-QURAN</span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Setor beberapa surat sekaligus</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMultiSurah(!isMultiSurah)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isMultiSurah ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isMultiSurah ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            )}

            {/* Choose specific module linked to selected active element */}
            {!isMultiSurah && (
              <div className="space-y-1 relative" id="combobox-wrapper">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-[10px] font-bold text-indigo-900 dark:text-emerald-450 uppercase tracking-widest">
                    PILIH MODUL / MATERI AJAR *
                  </label>
                  {activeElemenScopeLabel && (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/70">
                      📖 {activeElemenScopeLabel}
                    </span>
                  )}
                </div>
                
                {/* Trigger Combobox Dropdown */}
                <div 
                  onClick={() => setIsModulComboboxOpen(!isModulComboboxOpen)}
                  className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 cursor-pointer flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span>📕</span>
                    <span className="truncate">
                      {(() => {
                        if (!setoranModulId) return '-- Pilih Modul Ajar --';
                        const currentSelectedMod = matchedModules.find(m => m.id === setoranModulId);
                        if (!currentSelectedMod) return '-- Pilih Modul Ajar --';
                        const noStr = currentSelectedMod.nomorUrutSurat ? String(currentSelectedMod.nomorUrutSurat).padStart(2, '0') : '00';
                        return currentSelectedMod.namaSurat 
                          ? `${noStr}. Al-Qur'an Surat ${currentSelectedMod.namaSurat}` 
                          : `${currentSelectedMod.judulModul || 'Modul Lain'}`;
                      })()}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[9px]">▼</span>
                </div>

                {/* Dropdown Options List Overlay */}
                {isModulComboboxOpen && (
                  <div className="absolute z-40 left-0 right-0 mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-3 space-y-2 max-h-[300px] overflow-y-auto animate-fade-in">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Ketik nomor surat atau nama latin... (misal: 2 atau Baqarah)"
                        value={modulSearchQuery}
                        onChange={(e) => setModulSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                      />
                      {modulSearchQuery && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setModulSearchQuery(''); }}
                          className="absolute right-2 top-1.5 text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-1.5 py-0.5 rounded"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div id="modul-options-container" className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                      {(() => {
                        const searchFiltered = matchedModules.filter(m => {
                          if (!modulSearchQuery) return true;
                          const q = modulSearchQuery.toLowerCase();
                          const nameLatin = (m.namaSurat || '').toLowerCase();
                          const rawNo = m.nomorUrutSurat ? String(m.nomorUrutSurat) : '';
                          const padNo = m.nomorUrutSurat ? String(m.nomorUrutSurat).padStart(2, '0') : '';
                          const headingText = (m.judulModul || '').toLowerCase();
                          return nameLatin.includes(q) || rawNo.includes(q) || padNo.includes(q) || headingText.includes(q);
                        });

                        if (searchFiltered.length === 0) {
                          return (
                            <p className="text-center py-4 text-slate-405 italic text-[11px]">
                              Tidak ditemukan modul yang cocok.
                            </p>
                          );
                        }

                        return searchFiltered.map(m => {
                          const noStr = m.nomorUrutSurat ? String(m.nomorUrutSurat).padStart(2, '0') : '01';
                          const displayName = m.namaSurat ? `${noStr}. Al-Qur'an Surat ${m.namaSurat}` : m.judulModul;
                          const isCurrent = m.id === setoranModulId;

                          return (
                            <div 
                              key={m.id}
                              id={`modul-opt-${m.id}`}
                              onClick={() => {
                                setSetoranModulId(m.id);
                                setIsModulComboboxOpen(false);
                                setModulSearchQuery('');
                              }}
                              className={`p-2 rounded-lg text-xs font-semibold cursor-pointer text-left transition ${
                                isCurrent 
                                  ? 'bg-emerald-600 text-white font-bold' 
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{displayName}</span>
                                {m.jumlahAyat && <span className="text-[10px] opacity-80 font-mono font-normal">{m.jumlahAyat} Ayat</span>}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic setoran sub-category from element declaration */}
            {selectedElemenObj && selectedElemenObj.jenisSetoranList.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-indigo-900 dark:text-emerald-450 uppercase tracking-widest mb-1.5">JENIS SETORAN *</label>
                <select 
                  value={setoranJenisSub}
                  onChange={(e) => setSetoranJenisSub(e.target.value)}
                  className="w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900"
                >
                  {selectedElemenObj.jenisSetoranList.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            )}

            {/* QURAN CONDITIONAL BOUNDS FLOW */}
            {activeModul?.tipe === TipeModul.AL_QURAN && (
              <div className="p-3 bg-emerald-50/15 dark:bg-slate-900/40 rounded-xl border border-emerald-100/30 space-y-3 mt-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold text-emerald-850 dark:text-emerald-400 block uppercase tracking-wider font-mono">
                      {isMultiSurah ? 'KONFIGURASI SETORAN BEBERAPA SURAT' : 'KONFIGURASI BATASAN AYAT AL-QURAN'}
                    </span>
                    {isMultiSurah && activeElemenScopeLabel && (
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/70">
                        📖 {activeElemenScopeLabel}
                      </span>
                    )}
                  </div>
                  
                  {!isMultiSurah ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-wider">AYAT AWAL</label>
                      <input 
                        type="number" 
                        min={1}
                        max={activeModul.jumlahAyat || 100}
                        value={quranAyatAwal}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr === '') {
                            setQuranAyatAwal('');
                          } else {
                            const valNum = Number(valStr);
                            setQuranAyatAwal(Math.min(activeModul.jumlahAyat || 100, Math.max(1, valNum)));
                          }
                        }}
                        className="w-full p-2 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-wider">AYAT AKHIR</label>
                      <input 
                        type="number" 
                        min={1}
                        max={activeModul.jumlahAyat || 100}
                        value={quranAyatAkhir}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr === '') {
                            setQuranAyatAkhir('');
                          } else {
                            const valNum = Number(valStr);
                            setQuranAyatAkhir(Math.min(activeModul.jumlahAyat || 100, valNum));
                          }
                        }}
                        className="w-full p-2 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                      <label className="block text-[9px] font-bold text-emerald-800 dark:text-emerald-450 uppercase tracking-wider">JUMLAH SURAT YANG DISETORKAN</label>
                      <select
                        value={banyakSuratSubmit}
                        onChange={(e) => handleBanyakSuratChange(Number(e.target.value))}
                        className="p-1 px-3 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Surat</option>)}
                      </select>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {multiSurahsList.map((item, idx) => {
                        const qModules = matchedQuranModules;
                        return (
                          <div key={item.id} className={`multi-surah-combobox-container p-3 rounded-xl border transition-all ${activePreviewSurahIndex === idx ? 'bg-emerald-500/5 dark:bg-slate-950/25 border-emerald-400/80 shadow-xs' : 'bg-white dark:bg-slate-900/20 border-slate-200 dark:border-slate-800'}`}>
                            <div className="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-slate-100 dark:border-slate-850">
                              <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-450 uppercase tracking-wider font-mono">Surat #{idx + 1}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setActivePreviewSurahIndex(idx)}
                                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md transition ${activePreviewSurahIndex === idx ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-100 hover:bg-slate-250 dark:bg-slate-950 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                >
                                  {activePreviewSurahIndex === idx ? '● Pratinjau Aktif' : 'Lihat Pratinjau'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeMultiSurahItem(idx)}
                                  className="text-slate-400 hover:text-rose-500 transition disabled:opacity-30"
                                  title="Hapus Surat"
                                  disabled={multiSurahsList.length <= 2}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              <div className="relative">
                                <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-0.5">NAMA SURAT</label>
                                
                                {/* Custom Searchable Combobox Trigger */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (openMultiSurahComboboxIndex === idx) {
                                      setOpenMultiSurahComboboxIndex(null);
                                      setMultiSurahSearchQuery('');
                                    } else {
                                      setOpenMultiSurahComboboxIndex(idx);
                                      setActivePreviewSurahIndex(idx);
                                      setMultiSurahSearchQuery('');
                                    }
                                  }}
                                  className="w-full p-1.5 border border-slate-150 dark:border-slate-805 rounded bg-white dark:bg-slate-955 text-xs font-semibold cursor-pointer flex items-center justify-between text-slate-800 dark:text-slate-100 shadow-3xs hover:border-slate-300 dark:hover:border-slate-700"
                                >
                                  <span className="truncate">
                                    {(() => {
                                      const selectedM = qModules.find(m => m.id === item.modulId);
                                      if (!selectedM) return 'Pilih Surat...';
                                      const noStr = selectedM.nomorUrutSurat ? String(selectedM.nomorUrutSurat).padStart(2, '0') : '00';
                                      return selectedM.namaSurat ? `${noStr}. Surat ${selectedM.namaSurat}` : selectedM.judulModul;
                                    })()}
                                  </span>
                                  <span className="text-slate-400 font-mono text-[8px]">▼</span>
                                </div>

                                {/* Autocomplete Search Dropdown */}
                                {openMultiSurahComboboxIndex === idx && (
                                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 shadow-lg rounded-lg p-2 space-y-1.5 max-h-[220px] overflow-y-auto animate-fade-in text-left">
                                    <div className="relative">
                                      <input 
                                        type="text"
                                        placeholder="Cari nama / nomor surat..."
                                        value={multiSurahSearchQuery}
                                        onChange={(e) => setMultiSurahSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-450 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        autoFocus
                                      />
                                      {multiSurahSearchQuery && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setMultiSurahSearchQuery(''); }}
                                          className="absolute right-2 top-1 text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-1 py-0.5 rounded"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </div>

                                    <div id={`multi-modul-options-container-${idx}`} className="space-y-0.5 max-h-[140px] overflow-y-auto pr-0.5">
                                      {(() => {
                                        const query = multiSurahSearchQuery.toLowerCase();
                                        const filtered = qModules.filter(m => {
                                          if (!query) return true;
                                          const name = (m.namaSurat || '').toLowerCase();
                                          const rawNo = m.nomorUrutSurat ? String(m.nomorUrutSurat) : '';
                                          const padNo = m.nomorUrutSurat ? String(m.nomorUrutSurat).padStart(2, '0') : '';
                                          const title = (m.judulModul || '').toLowerCase();
                                          return name.includes(query) || rawNo.includes(query) || padNo.includes(query) || title.includes(query);
                                        });

                                        if (filtered.length === 0) {
                                          return (
                                            <p className="text-center py-2 text-slate-405 italic text-[10px]">
                                              Tidak ada surat cocok.
                                            </p>
                                          );
                                        }

                                        return filtered.map(m => {
                                          const noStr = m.nomorUrutSurat ? String(m.nomorUrutSurat).padStart(2, '0') : '00';
                                          const disp = m.namaSurat ? `${noStr}. Surat ${m.namaSurat}` : m.judulModul;
                                          const isSelected = m.id === item.modulId;

                                          return (
                                            <div 
                                              key={m.id}
                                              id={`multi-modul-opt-${idx}-${m.id}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateMultiSurahItem(idx, { modulId: m.id });
                                                setActivePreviewSurahIndex(idx);
                                                setOpenMultiSurahComboboxIndex(null);
                                                setMultiSurahSearchQuery('');
                                              }}
                                              className={`p-1.5 rounded text-[11px] font-medium cursor-pointer text-left transition ${
                                                isSelected 
                                                  ? 'bg-emerald-600 text-white font-bold' 
                                                  : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-850 dark:text-slate-200'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <span>{disp}</span>
                                                {m.jumlahAyat && <span className="text-[9px] opacity-75 font-mono">{m.jumlahAyat} Ayat</span>}
                                              </div>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-0.5">AYAT AWAL</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={item.jumlahAyat || 100}
                                    value={item.ayatAwal}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      if (valStr === '') {
                                        updateMultiSurahItem(idx, { ayatAwal: '' });
                                      } else {
                                        const valNum = Number(valStr);
                                        updateMultiSurahItem(idx, { ayatAwal: Math.min(item.jumlahAyat || 100, Math.max(1, valNum)) });
                                      }
                                    }}
                                    className="w-full p-1 border border-slate-150 dark:border-slate-805 rounded text-center font-mono font-bold text-xs bg-white dark:bg-slate-955"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-semibold text-slate-400 uppercase mb-0.5">AYAT AKHIR</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={item.jumlahAyat || 100}
                                    value={item.ayatAkhir}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      if (valStr === '') {
                                        updateMultiSurahItem(idx, { ayatAkhir: '' });
                                      } else {
                                        const valNum = Number(valStr);
                                        updateMultiSurahItem(idx, { ayatAkhir: Math.min(item.jumlahAyat || 100, valNum) });
                                      }
                                    }}
                                    className="w-full p-1 border border-slate-150 dark:border-slate-805 rounded text-center font-mono font-bold text-xs bg-white dark:bg-slate-955"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <button
                      type="button"
                      onClick={addMultiSurahItem}
                      className="w-full py-2 border border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50/15 hover:bg-emerald-50/30 transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Surat Lain</span>
                    </button>
                  </div>
                )}

                {selectedElemenObj?.useJumlahBaris && (
                  <div className="mt-3 pt-3 border-t border-emerald-100/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="block text-[9px] font-bold text-emerald-800 dark:text-emerald-450 uppercase tracking-wider">
                        Rincian Baris yang Disetorkan
                      </span>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isManualBaris}
                          onChange={(e) => setIsManualBaris(e.target.checked)}
                          className="form-checkbox h-3 w-3 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Edit Baris Manual</span>
                      </label>
                    </div>

                    {missingBarisInfo && !isManualBaris && (
                      <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 rounded-lg">
                        <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 leading-tight">
                          {missingBarisInfo}
                        </p>
                      </div>
                    )}

                    {isManualBaris && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Baris Awal</label>
                          <input
                            type="text"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            placeholder="Contoh: 6"
                            value={barisAwal}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setBarisAwal(val === '' ? '' : Number(val));
                            }}
                            className="w-full p-2 border border-slate-205 dark:border-slate-805 rounded bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Baris Akhir</label>
                          <input
                            type="text"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            placeholder="Contoh: 10"
                            value={barisAkhir}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setBarisAkhir(val === '' ? '' : Number(val));
                            }}
                            className="w-full p-2 border border-slate-205 dark:border-slate-805 rounded bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                    <div className={`flex items-center justify-between p-2 rounded-lg border ${!isManualBaris ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'}`}>
                      <div className="text-[10px] text-slate-600 dark:text-slate-350 font-semibold">
                        {!isManualBaris ? 'Total Baris (Otomatis):' : 'Total yang Disetorkan:'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${!isManualBaris ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900' : 'text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800'}`}>
                          {jumlahBaris !== '' ? `${jumlahBaris} Baris` : '- Baris'}
                        </span>
                        {isManualBaris && (barisAwal !== '' || barisAkhir !== '') && (
                          <button
                            type="button"
                            onClick={() => {
                              setBarisAwal('');
                              setBarisAkhir('');
                            }}
                            className="text-[8px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 text-slate-600 px-1.5 py-0.5 rounded font-extrabold"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NON-QURAN CONDITIONAL BOUNDS FLOW */}
            {activeModul?.tipe === TipeModul.NON_AL_QURAN && (
              <div className="p-3.5 bg-indigo-50/10 dark:bg-slate-900/40 rounded-xl border border-indigo-100/20 space-y-3.5 mt-3 text-left">
                <span className="text-[10px] font-extrabold text-indigo-850 dark:text-indigo-400 block uppercase tracking-wider font-mono">MATERI AJAR SELAIN AL-QURAN (IQRO/KITAB)</span>
                
                {/* Custom radio buttons to select: Satu Halaman or Beberapa Halaman */}
                <div className="flex items-center space-x-4 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150/50 dark:border-slate-800/50 shadow-xs">
                  <label className="inline-flex items-center text-xs font-bold text-slate-705 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="rangeModeNonQuran" 
                      checked={isSinglePageNonQuran}
                      onChange={() => setIsSinglePageNonQuran(true)}
                      className="form-radio text-indigo-600 focus:ring-indigo-550 h-3.5 w-3.5 mr-1.5 cursor-pointer accent-indigo-600"
                    />
                    <span>Satu Halaman</span>
                  </label>
                  <label className="inline-flex items-center text-xs font-bold text-slate-705 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="rangeModeNonQuran" 
                      checked={!isSinglePageNonQuran}
                      onChange={() => setIsSinglePageNonQuran(false)}
                      className="form-radio text-indigo-600 focus:ring-indigo-550 h-3.5 w-3.5 mr-1.5 cursor-pointer accent-indigo-600"
                    />
                    <span>Beberapa Halaman</span>
                  </label>
                </div>

                {isSinglePageNonQuran ? (
                  <div className="grid grid-cols-2 gap-3 text-xs text-left">
                    {activeModul.isMultiJilid && (
                      <div>
                        <label className="block text-[9px] font-bold text-indigo-850 dark:text-indigo-300 uppercase tracking-widest text-left">JILID AJAR</label>
                        <input 
                          type="number" 
                          min={1}
                          max={activeModul.jumlahJilid || 6}
                          value={nonQuranJilid}
                          onChange={(e) => setNonQuranJilid(Math.max(1, Number(e.target.value)))}
                          className="w-full p-2 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-bold font-mono text-slate-950 dark:text-white"
                        />
                      </div>
                    )}
                    <div className={activeModul.isMultiJilid ? "" : "col-span-2"}>
                      <label className="block text-[9px] font-bold text-indigo-850 dark:text-indigo-300 uppercase tracking-widest text-left">INPUT HALAMAN</label>
                      <input 
                        type="text" 
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={nonQuranPageSingle === '' ? '' : nonQuranPageSingle}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setNonQuranPageSingle(val === '' ? '' : Number(val));
                        }}
                        placeholder="Contoh: 15"
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-bold font-mono text-slate-950 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 text-xs text-left">
                    {activeModul.isMultiJilid ? (
                      <div>
                        <label className="block text-[9px] font-bold text-indigo-850 dark:text-indigo-300 uppercase tracking-widest text-left truncate">JILID AJAR</label>
                        <input 
                          type="number" 
                          min={1}
                          max={activeModul.jumlahJilid || 6}
                          value={nonQuranJilid}
                          onChange={(e) => setNonQuranJilid(Math.max(1, Number(e.target.value)))}
                          className="w-full p-2 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-bold font-mono text-slate-950 dark:text-white"
                        />
                      </div>
                    ) : null}
                    
                    <div className={activeModul.isMultiJilid ? "col-span-2 grid grid-cols-2 gap-2" : "col-span-3 grid grid-cols-2 gap-3"}>
                      <div>
                        <label className="block text-[9px] font-bold text-indigo-850 dark:text-indigo-300 uppercase tracking-widest text-left truncate">HALAMAN AWAL</label>
                        <input 
                          type="text" 
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={nonQuranPageAwal === '' ? '' : nonQuranPageAwal}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setNonQuranPageAwal(val === '' ? '' : Number(val));
                          }}
                          placeholder="Awal"
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-bold font-mono text-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-indigo-850 dark:text-indigo-300 uppercase tracking-widest text-left truncate">HALAMAN AKHIR</label>
                        <input 
                          type="text" 
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={nonQuranPageAkhir === '' ? '' : nonQuranPageAkhir}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setNonQuranPageAkhir(val === '' ? '' : Number(val));
                          }}
                          placeholder="Akhir"
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-bold font-mono text-slate-950 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedElemenObj?.useJumlahBaris && (
                  <div className="mt-3 pt-3 border-t border-indigo-100/30 space-y-2">
                    <span className="block text-[9px] font-bold text-indigo-850 dark:text-indigo-300 uppercase tracking-wider mb-1">
                      Rincian Baris yang Disetorkan
                    </span>

                    {/* Modul custom page line count suggestion helpers */}
                    {(() => {
                      const helper = getPageLineCountHelper();
                      if (!helper) return null;

                      if (helper.type === 'single') {
                        return (
                          <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-150/40 p-2 rounded-lg flex items-center justify-between gap-1">
                            <div className="text-[10px] text-indigo-900 dark:text-indigo-350 font-medium">
                              Konfigurasi Halaman {helper.page}: <strong className="font-extrabold text-indigo-950 dark:text-white">{helper.count} Baris</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setBarisAwal(1);
                                setBarisAkhir(helper.count);
                              }}
                              className="text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded font-bold cursor-pointer transition flex items-center space-x-0.5"
                            >
                              <span>Set Maks</span>
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-150/40 p-2 rounded-lg space-y-1.5">
                            <span className="block text-[9px] font-bold text-indigo-900 dark:text-indigo-350">
                              Info Baris per Halaman:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {helper.ranges.map((r, rIdx) => {
                                const isCurrentPage = (activeNonQuranPreviewPage !== null && activeNonQuranPreviewPage === r.page) ||
                                  (activeNonQuranPreviewPage === null && rIdx === 0);
                                return (
                                  <button
                                    key={rIdx}
                                    type="button"
                                    onClick={() => {
                                      setBarisAwal(1);
                                      setBarisAkhir(r.count);
                                      setActiveNonQuranPreviewPage(r.page);
                                    }}
                                    className={`text-[9px] p-1 px-1.5 rounded font-semibold transition cursor-pointer border ${
                                      isCurrentPage
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-[1.02]'
                                        : 'bg-white hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-850 border-indigo-100 text-indigo-800 dark:text-indigo-300'
                                    }`}
                                  >
                                    Hlm {r.page} ({r.count} Baris)
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    })()}

                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Baris Awal</label>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="Contoh: 6"
                          value={barisAwal}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setBarisAwal(val === '' ? '' : Number(val));
                          }}
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Baris Akhir</label>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="Contoh: 10"
                          value={barisAkhir}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setBarisAkhir(val === '' ? '' : Number(val));
                          }}
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-slate-950 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20 p-2 rounded-lg border border-indigo-100/30">
                      <div className="text-[10px] text-slate-600 dark:text-slate-350 font-semibold">
                        Total yang Disetorkan:
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                          {jumlahBaris !== '' ? `${jumlahBaris} Baris` : '- Baris'}
                        </span>
                        {(barisAwal !== '' || barisAkhir !== '') && (
                          <button
                            type="button"
                            onClick={() => {
                              setBarisAwal('');
                              setBarisAkhir('');
                            }}
                            className="text-[8px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 text-slate-600 px-1.5 py-0.5 rounded font-extrabold"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selesai button inside Blok A content */}
            <div className="pt-2">
              <button 
                type="button" 
                onClick={() => setIsConfigCollapsed(true)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border text-[10px] font-extrabold uppercase rounded-lg text-slate-705 dark:text-slate-300 transition"
              >
                Selesai Konfigurasi &amp; Tutup Panel
              </button>
            </div>
            
            </div>
          </div>

          </div> {/* Close Left Sidebar column */}

            {/* ========================================================
                BLOK B: AREA BACA & KOREKSI - VIEWER (Right Major Column)
                ======================================================== */}
            <div className="lg:col-span-8 space-y-4 font-sans animate-fade-in">

              {/* VISUAL QURAN TEXT PREVIEW */}
              {activeModul?.tipe === TipeModul.AL_QURAN && (
                <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-emerald-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-850">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block tracking-widest font-mono uppercase flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" />
                        PRATINJAU AYAT
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans italic mt-0.5">Mushaf digital interaktif untuk menyimak &amp; koreksi hafalan santri</span>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0 flex-wrap">
                      {/* Pilihan Mode Tampilan Form Koreksi */}
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-0.5 rounded-xl text-[10px] font-bold flex-wrap">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 px-1.5 font-mono uppercase hidden md:inline">Tampilan Koreksi:</span>
                        <button
                          type="button"
                          onClick={() => handleSetCorrectionFormMode('modal')}
                          className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            correctionFormMode === 'modal'
                              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs font-black ring-1 ring-emerald-500/20'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                          title="Form koreksi muncul sebagai Popup / Modal saat kata/ayat diklik atau diusap"
                        >
                          <span className="text-xs">🪟</span>
                          <span>Popup / Modal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetCorrectionFormMode('inline')}
                          className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            correctionFormMode === 'inline'
                              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs font-black ring-1 ring-emerald-500/20'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                          title="Form koreksi muncul di bawah ayat seperti biasa"
                        >
                          <span className="text-xs">📋</span>
                          <span>Di Bawah Ayat</span>
                        </button>
                        {correctionFormMode === 'modal' && (
                          <button
                            type="button"
                            onClick={() => setIsRangeSelectMode(prev => !prev)}
                            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer border ${
                              isRangeSelectMode
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs font-black'
                                : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                            title="Aktifkan mode 2 klik: klik kata pertama lalu klik kata kedua untuk memilih rentang antar kata sebelum Popup terbuka"
                          >
                            <span>🔗</span>
                            <span>Rentang (2 Klik)</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setGuruQuranZoom(prev => Math.max(80, prev - 10))}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 transition"
                          title="Perkecil Font"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuruQuranZoom(100)}
                          className="px-2 h-7 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 transition"
                          title="Reset ke 100%"
                        >
                          {guruQuranZoom}%
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuruQuranZoom(prev => Math.min(200, prev + 10))}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 transition"
                          title="Perbesar Font"
                        >
                          A+
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-[90px] sm:min-w-[120px]">
                        <input
                          type="range"
                          min="80"
                          max="200"
                          step="10"
                          value={guruQuranZoom}
                          onChange={(e) => setGuruQuranZoom(Number(e.target.value))}
                          className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div ref={quranPreviewContainerRef} className="text-right p-6 md:p-8 bg-[#fdfcf7] dark:bg-slate-950 rounded-2xl border-2 border-[#e6decb] dark:border-slate-800 font-serif max-h-[500px] overflow-y-auto shadow-inner" dir="rtl" title="Klik atau usap antar kata untuk memberi koreksi">
                    {getQuranLivePreviewList().length > 0 ? (
                      <div className="text-justify leading-[2.2] whitespace-normal break-words w-full" style={{ textAlignLast: 'center' }}>
                        {getQuranLivePreviewList().map(v => {
                          const cleanedText = formatArabicFontClean(v.teksArab);
                          const rawWords = cleanedText.split(/\s+/).filter(Boolean);
                          const words: string[] = [];
                          for (const rw of rawWords) {
                            // Cek apakah token ini adalah tanda waqaf Utsmani (combining mark) atau tanda waqaf simbol/teks
                            const isUthmaniWaqaf = /^[\u06D6-\u06DC\u06DF-\u06E8\u08D4-\u08EA\u0610-\u061A]+$/.test(rw);
                            const isTextualWaqaf = /^[\(（]?(?:صلى|قلى|ج|لا|مـ|م|قف|سكت|ۛ)[\)）]?$/.test(rw);

                            if ((isUthmaniWaqaf || isTextualWaqaf) && words.length > 0) {
                              if (isUthmaniWaqaf) {
                                // Tanda waqaf Utsmani adalah non-spacing mark yang harus digabung langsung ke kata tanpa spasi agar ter-render tepat di atas huruf
                                words[words.length - 1] = `${words[words.length - 1]}${rw}`;
                              } else {
                                // Tanda waqaf simbol teks digabung dengan non-breaking space
                                words[words.length - 1] = `${words[words.length - 1]}\u00A0${rw}`;
                              }
                            } else {
                              words.push(rw);
                            }
                          }

                          const wordPrefix = `quran-${(v as any).modulId || 'default'}-${v.nomorAyat}`;
                          return (
                            <span key={`${(v as any).modulId || 'default'}-${v.nomorAyat}`} className="inline">
                              {words.map((word, wordIdx) => {
                                const wordKey = `${wordPrefix}-${wordIdx}`;
                                const isSelected = selectedHighlightKeys.includes(wordKey) || selectedHighlightKey === wordKey;
                                const hasSavedComment = interactiveComments.some(c => c.targetKey === wordKey || c.targetKeys?.includes(wordKey));
                                return (
                                  <span 
                                    key={wordKey}
                                    data-word-prefix={wordPrefix}
                                    data-word-idx={wordIdx}
                                    onMouseDown={(e) => {
                                      if (e.button === 0) {
                                        startWordDrag(e.clientX, e.clientY, false, wordPrefix, words, wordIdx, true);
                                      }
                                    }}
                                    onTouchStart={(e) => {
                                      if (e.touches.length === 1) {
                                        const t = e.touches[0];
                                        startWordDrag(t.clientX, t.clientY, true, wordPrefix, words, wordIdx, true);
                                      }
                                    }}
                                    onClick={(e) => handleWordSelection(wordKey, word, wordIdx, words, { isShift: e.shiftKey, isRtl: true })}
                                    dir="rtl"
                                    style={{ 
                                      fontSize: `${(guruQuranZoom / 100) * 1.85}rem`,
                                      lineHeight: 2.3
                                    }}
                                    className={`font-mushaf font-serif inline-block cursor-pointer transition-all duration-150 rounded-lg mx-[2.5px] px-[4px] py-1 select-none touch-pan-y align-middle ${
                                      isSelected
                                        ? 'bg-yellow-200 text-yellow-950 dark:bg-amber-955 dark:text-yellow-200 ring-1 ring-yellow-450 font-bold scale-102 shadow-sm'
                                        : hasSavedComment
                                          ? 'bg-rose-100 dark:bg-rose-955/40 text-rose-950 dark:text-rose-250 border-b-2 border-rose-500 font-medium scale-[1.01]'
                                          : 'text-slate-900 dark:text-emerald-450 hover:bg-emerald-100/40 dark:hover:bg-slate-800/80'
                                    }`}
                                    title={hasSavedComment ? "Selesai koreksi (Klik atau usap antar kata untuk tambah/edit)" : "Klik kata atau usap antar kata untuk beri catatan koreksi"}
                                  >
                                    {word}
                                  </span>
                                );
                              })}
                              
                              {/* Centered Verse Circle flowing inline, replicating original King Fahd Mushaf layout */}
                              {(() => {
                                const verseKey = `quran-${(v as any).modulId || 'default'}-${v.nomorAyat}-verse`;
                                const isVerseSelected = selectedHighlightKeys.includes(verseKey) || selectedHighlightKey === verseKey;
                                const hasVerseComment = interactiveComments.some(
                                  c => c.targetKey === verseKey || c.targetKeys?.includes(verseKey) || (c.target && c.target.toLowerCase().includes(`ayat ${v.nomorAyat}`))
                                );

                                return (
                                  <span 
                                    onClick={() => handleVerseSelection(v.nomorAyat, words, (v as any).modulId || 'default', v.suratNama || activeModul?.namaSurat)}
                                    className={`inline-flex items-center justify-center select-none font-mushaf font-serif mx-1.5 rounded-full border cursor-pointer transition-all duration-200 w-9 h-9 align-middle text-center shrink-0 shadow-xs relative ${
                                      isVerseSelected
                                        ? 'bg-amber-400 text-amber-950 border-amber-600 dark:bg-amber-500 dark:text-amber-950 font-black shadow-md scale-110 ring-2 ring-amber-400'
                                        : hasVerseComment
                                          ? 'bg-rose-600 text-white border-rose-700 dark:bg-rose-600 dark:border-rose-500 font-black shadow-sm scale-105 ring-2 ring-rose-400/80'
                                          : 'border-[#c5a880] dark:border-amber-600/80 bg-[#fdfcf7] dark:bg-slate-900 text-slate-800 dark:text-emerald-450 font-bold hover:bg-amber-100 hover:border-amber-500 dark:hover:bg-slate-800 hover:scale-105'
                                    }`}
                                    style={{ 
                                      fontSize: `${(guruQuranZoom / 100) * 1.05}rem`,
                                      lineHeight: '1',
                                      transform: 'translateY(-1px)'
                                    }}
                                    title={
                                      hasVerseComment
                                        ? `Ayat ${v.nomorAyat} ada koreksi (Klik untuk lihat/edit)`
                                        : `Klik Nomor Ayat ${v.nomorAyat} untuk tandai Ayat Tersendat / Tidak Lancar`
                                    }
                                  >
                                    <span className={`absolute inset-[1px] rounded-full border border-dashed ${
                                      hasVerseComment ? 'border-white/50' : isVerseSelected ? 'border-amber-800/50' : 'border-[#c5a880]/40 dark:border-amber-600/30'
                                    }`} />
                                    <span className="relative z-10">{toEasternArabicDigits(v.nomorAyat)}</span>
                                  </span>
                                );
                              })()}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 text-center font-mono py-2 italic w-full">Ayat tidak terindeks. Gunakan pratinjau mushaf fisik hafalan.</p>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1 text-left">
                    * Petunjuk: Klik satu **kata** atau **usap antar kata** (untuk koreksi *Idgham/Ikhfa*), atau klik **nomor ayat** untuk menandai ayat tersendat. Di dalam Popup juga tersedia tombol perluas kata tetangga.
                  </p>

                  {/* Non-blocking Floating Bar saat mode Rentang (2 Klik) menunggu kata kedua */}
                  {correctionFormMode === 'modal' && !isCorrectionModalOpen && selectedHighlightText && (
                    <div className="flex items-center justify-between gap-2.5 flex-wrap p-2.5 px-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-300/80 dark:border-amber-800/70 shadow-xs animate-fade-in">
                      <div className="flex items-center gap-2 flex-wrap text-left">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 font-mono">
                          Target Awal:
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-950 dark:bg-amber-900/70 dark:text-amber-100 font-mushaf font-serif text-base font-semibold">
                          {selectedHighlightText}
                        </span>
                        <span className="text-[11px] text-amber-900/80 dark:text-amber-200/80 font-sans">
                          Klik kata kedua di ayat yang sama untuk rentang, atau langsung catat 1 kata ini.
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto shrink-0">
                        <button
                          type="button"
                          onClick={handleCancelQuranCorrection}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCorrectionModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Catat 1 Kata Ini</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Comment input row - Mode Inline (Di Bawah Ayat) */}
                  {correctionFormMode === 'inline' && selectedHighlightText && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 space-y-3 text-left animate-fade-in">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider font-mono">
                          TULIS CATATAN KESALAHAN / PERBAIKAN
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetCorrectionFormMode('modal')}
                            className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/50"
                            title="Alihkan form ke Popup / Modal"
                          >
                            <span>🪟 Ubah ke Popup</span>
                          </button>
                          <span className="text-[10px] font-sans text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200/50">
                            Target Terpilih: <strong className="font-mushaf font-serif text-sm px-1 font-normal">{selectedHighlightText}</strong>
                          </span>
                        </div>
                      </div>

                      {renderQuranCorrectionFormFields()}

                      {/* Summary & Fast Save Action Bar */}
                      <div className="space-y-2.5 bg-slate-50/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                              Koreksi Terpilih:
                            </span>
                            <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-lg shadow-2xs flex items-center gap-1">
                              <span>{selectedErrorCategory}</span>
                              {selectedSubCategory && (
                                <>
                                  <span className="opacity-70">&bull;</span>
                                  <span>{selectedSubCategory}</span>
                                </>
                              )}
                            </span>
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium font-sans">
                              pada <strong className="font-bold text-emerald-700 dark:text-emerald-300">"{selectedHighlightText}"</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 justify-end shrink-0">
                            <button
                              type="button"
                              onClick={handleCancelQuranCorrection}
                              className="px-3.5 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer font-sans border border-slate-200 dark:border-slate-700"
                            >
                              Batal
                            </button>
                            <button
                              id="btn-save-quran-correction"
                              type="button"
                              onClick={handleSaveQuranCorrection}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs uppercase rounded-xl transition cursor-pointer font-sans shadow-md flex items-center justify-center gap-1.5 ring-2 ring-emerald-400/50"
                              title="Simpan koreksi langsung ke sesi mutabaah (catatan bisa dilengkapi di akhir)"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>SIMPAN KOREKSI</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode Popup / Modal Mengambang */}
                  {correctionFormMode === 'modal' && isCorrectionModalOpen && selectedHighlightText && (
                    <div 
                      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) {
                          handleCancelQuranCorrection();
                        }
                      }}
                    >
                      <div 
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white dark:from-slate-850 dark:via-slate-850 dark:to-slate-900 border-b border-emerald-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-bold font-mono tracking-wider text-slate-800 dark:text-slate-100 uppercase">
                                CATAT KESALAHAN / PERBAIKAN
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Target:</span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-mushaf font-serif text-sm font-semibold truncate max-w-[200px] sm:max-w-md" dir="rtl">
                                  {selectedHighlightText}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetCorrectionFormMode('inline')}
                              className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition cursor-pointer"
                              title="Tampilkan di bawah ayat (inline)"
                            >
                              <span>📋</span>
                              <span>Di Bawah Ayat</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelQuranCorrection}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Tutup / Batal (Esc)"
                            >
                              <X className="w-5 h-5 stroke-[2.2]" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-left">
                          {renderModalWordRangeAdjuster()}
                          {renderQuranCorrectionFormFields()}
                        </div>

                        {/* Modal Sticky Footer */}
                        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold hidden sm:inline">Koreksi:</span>
                            <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-lg shadow-2xs flex items-center gap-1 truncate max-w-[220px] sm:max-w-xs">
                              <span>{selectedErrorCategory}</span>
                              {selectedSubCategory && (
                                <>
                                  <span className="opacity-70">&bull;</span>
                                  <span className="truncate">{selectedSubCategory}</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto shrink-0">
                            <button
                              type="button"
                              onClick={handleCancelQuranCorrection}
                              className="px-3.5 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200 dark:border-slate-700"
                            >
                              Batal
                            </button>
                            <button
                              id="btn-save-quran-correction"
                              type="button"
                              onClick={handleSaveQuranCorrection}
                              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs uppercase rounded-xl transition cursor-pointer font-sans shadow-md flex items-center justify-center gap-1.5 ring-2 ring-emerald-400/50"
                              title="Simpan koreksi langsung ke sesi mutabaah"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>SIMPAN KOREKSI</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* List of active comments from current session */}
                  {interactiveComments.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-850 space-y-2 text-left animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">
                          Rincian Koreksi Sesi Ini ({interactiveComments.length})
                        </span>
                        <button
                          type="button"
                          onClick={handleClearAllInteractiveComments}
                          className="text-[8px] font-bold text-rose-500 hover:text-rose-700 uppercase cursor-pointer"
                        >
                          Bersihkan Semua
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(() => {
                          const seenOnceInModal = new Set<string>();
                          const effectiveOnce = selectedElemenObj?.useMasterPenalties && masterPenalties?.oncePerSessionCategories !== undefined
                            ? (masterPenalties.oncePerSessionCategories || [])
                            : (selectedElemenObj?.oncePerSessionCategories || ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']);

                          return interactiveComments.map((item) => (
                          <div key={item.id} className="p-2.5 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 space-y-2 hover:border-emerald-300 dark:hover:border-emerald-800 transition">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-mushaf text-md text-emerald-850 dark:text-emerald-300 bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">{item.target}</span>
                                {item.category && item.category !== 'Lainnya' && (() => {
                                  const effectiveDeductions = selectedElemenObj?.useMasterPenalties && masterPenalties?.rubrikDeductions
                                    ? masterPenalties.rubrikDeductions
                                    : selectedElemenObj?.rubrikDeductions || {};
                                  let deduction = effectiveDeductions[item.category];
                                  const cleanCat = item.category.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                                  const matched = tajwidCategories?.find(tc => 
                                    tc.id === item.category || 
                                    tc.nama === item.category ||
                                    tc.id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCat ||
                                    tc.nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCat
                                  );
                                  if (deduction === undefined && matched) {
                                    deduction = effectiveDeductions[matched.id] || effectiveDeductions[matched.nama];
                                  }
                                  if (deduction === undefined) {
                                    deduction = effectiveDeductions['lainnya'] || effectiveDeductions['Lainnya'] || 2;
                                  }

                                  const canonKey = matched ? matched.id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : cleanCat;
                                  const isOnce = effectiveOnce.some(c => {
                                    const cleanC = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                                    if (cleanC === cleanCat || cleanC === canonKey) return true;
                                    if (matched) {
                                      const mClean = matched.nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                                      if (cleanC === mClean) return true;
                                    }
                                    return false;
                                  });

                                  let isDuplicateOnce = false;
                                  if (isOnce) {
                                    const itemKey = getDeductionTrackingKey(canonKey, item.subcategory);
                                    if (seenOnceInModal.has(itemKey)) {
                                      isDuplicateOnce = true;
                                    } else {
                                      seenOnceInModal.add(itemKey);
                                    }
                                  }

                                  const detail = currentDeductionSummary?.details.find(d => d.commentId === item.id);
                                  const finalDeduction = detail !== undefined ? detail.deduction : deduction;
                                  const isFinalDup = detail !== undefined ? detail.isDuplicate : isDuplicateOnce;
                                  const isJaliy = detail ? detail.categoryType === 'lahn_jaliy' : (item.category?.toLowerCase().includes('jaliy') || item.category?.toLowerCase().includes('dasar'));

                                  return (
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                                      isFinalDup
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        : isJaliy
                                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200/60'
                                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 border-amber-200/40'
                                    }`}>
                                      <span>{item.category}{item.subcategory ? ` - ${item.subcategory}` : ''}</span>
                                      <span className="text-[7.5px] uppercase font-mono px-1 rounded bg-black/5 dark:bg-white/10 font-bold">
                                        {isJaliy ? 'Jaliy' : 'Khafiy'}
                                      </span>
                                      {selectedElemenObj?.useRubrikPenilaian && (
                                        isFinalDup ? (
                                          <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold italic">(0 pt • maks 1x)</span>
                                        ) : (
                                          <span className="font-mono text-rose-600 dark:text-rose-400 font-black">
                                            (-{finalDeduction} pt{isOnce ? ' • maks 1x' : ''})
                                          </span>
                                        )
                                      )}
                                    </span>
                                  );
                                })()}
                                <span className="text-[8px] font-mono font-semibold text-slate-400 uppercase tracking-widest pl-1">{item.info}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteInteractiveComment(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer font-bold"
                                title="Hapus koreksi ini"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                              <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider font-mono">
                                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                  <span>✍️</span>
                                  <span>Catatan / Uraian Koreksi (Diisi di Akhir Sesi):</span>
                                </span>
                                {item.comment ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold lowercase flex items-center gap-0.5">
                                    ✓ tersinkron ke rekap
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal lowercase italic">
                                    bisa dikosongkan jika cukup kategori saja
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                value={item.comment || ''}
                                onChange={(e) => handleUpdateInteractiveComment(item.id, e.target.value)}
                                placeholder="Ketik catatan / perbaikan santri di sini..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition font-sans"
                              />
                            </div>
                          </div>
                        ));
                      })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* NON-QURAN INTERACTIVE PREVIEW */}
            {activeModul?.tipe === TipeModul.NON_AL_QURAN && (() => {
              const pageStart = isSinglePageNonQuran 
                ? (nonQuranPageSingle === '' ? 1 : nonQuranPageSingle) 
                : (nonQuranPageAwal === '' ? 1 : nonQuranPageAwal);
              const pageEnd = isSinglePageNonQuran 
                ? (nonQuranPageSingle === '' ? 1 : nonQuranPageSingle) 
                : (nonQuranPageAkhir === '' ? 1 : nonQuranPageAkhir);

              const resolvedActivePreviewPage = (activeNonQuranPreviewPage !== null && 
                activeNonQuranPreviewPage >= pageStart && 
                activeNonQuranPreviewPage <= pageEnd) 
                  ? activeNonQuranPreviewPage 
                  : pageStart;

              const jilidIndex = nonQuranJilid - 1;
              const pageIdx = resolvedActivePreviewPage - 1;

              const isTextMode = activeModul.tipeMateri === 'teks';
              const pageText = isTextMode 
                ? (activeModul.teksHalamanPerJilid?.[jilidIndex]?.[pageIdx] || activeModul.teksHalaman?.[pageIdx])
                : null;
              
              const activeExplanation = activeModul.penjelasanHalamanPerJilid?.[jilidIndex]?.[pageIdx] || activeModul.penjelasanHalaman?.[pageIdx];

              const imageSrc = !isTextMode 
                ? (activeModul.halamanGambarPerJilid?.[jilidIndex]?.[pageIdx] || activeModul.halamanGambar?.[pageIdx])
                : null;

              const manualText = pageText || (activeModul.isiModulManual 
                ? activeModul.isiModulManual.split('\n\n')[pageIdx % activeModul.isiModulManual.split('\n\n').length]
                : null);

              const isEmbedOrPdf = activeModul.tipeMateri === 'google_doc_slide' || activeModul.tipeMateri === 'pdf';

              return (
                <div className="space-y-4 w-full">
                  {/* NON-QURAN PAGE GRAPHICS PREVIEW or IDENTITY CARD */}
                  {activeModul.tipeMateri === 'hanya_identitas' ? (
                    <div className="p-3.5 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-950/30 rounded-xl max-w-xl mx-auto shadow-xs text-left animate-fade-in w-full">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-sans font-bold text-xs text-slate-900 dark:text-white leading-tight">
                            {activeModul.judulModul}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="inline-block text-[8px] font-extrabold uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded tracking-wider font-mono">
                              Modul Berhak Cipta
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1 font-sans">
                            Bimbingan langsung menggunakan kitab/modul cetak fisik orisinal. Silakan catat perkembangan setoran siswa pada panel di bawah ini.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border text-center text-slate-400 font-mono text-[10px] space-y-4 shadow-sm w-full">
                      {!isEmbedOrPdf && (
                        <>
                          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-850">
                            <span className="text-[8px] font-bold text-slate-400 block text-left uppercase tracking-widest">VISUAL BARIS HALAMAN MODUL</span>
                            <span className="text-[10px] font-sans font-bold text-slate-500 dark:text-slate-400">
                              Jilid {nonQuranJilid} • Halaman Aktif: {resolvedActivePreviewPage}
                            </span>
                          </div>
                          
                          {/* Interactive Button bar tabs */}
                          <div className="py-1 flex items-center justify-center space-x-1.5 flex-wrap gap-y-1.5 animate-fade-in">
                            {Array.from({ length: Math.max(1, pageEnd - pageStart + 1) }).map((_, ipg) => {
                              const pageNum = pageStart + ipg;
                              const isActive = resolvedActivePreviewPage === pageNum;
                              return (
                                <button
                                  key={ipg}
                                  type="button"
                                  onClick={() => {
                                    setActiveNonQuranPreviewPage(pageNum);
                                  }}
                                  className={`px-3 py-1.5 border rounded-lg font-bold font-sans text-[11px] transition duration-200 cursor-pointer flex items-center space-x-1 ${
                                    isActive 
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-[1.02]'
                                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-205 dark:border-slate-800 hover:bg-slate-101 dark:hover:bg-slate-850'
                                  }`}
                                >
                                  <span>Halaman {pageNum}</span>
                                  {isActive && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse ml-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {/* Displaying exactly the selected preview page */}
                      <div className="pt-2 w-full">
                        {isEmbedOrPdf ? (
                          <div className="w-full">
                            {activeModul.tipeMateri === 'pdf' ? (
                              <div className="space-y-4 text-left w-full mx-auto">
                                {activeModul.pdfBase64 ? (
                                  <div className="flex flex-col border border-slate-205 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                                    <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-2 text-xs font-bold text-indigo-850 dark:text-indigo-300 uppercase border-b border-indigo-100 dark:border-indigo-900 flex justify-between items-center">
                                      <span>📖 Modul PDF: {activeModul.pdfFileName || 'Materi'}</span>
                                    </div>
                                    <iframe 
                                      src={activeModul.pdfBase64} 
                                      className="w-full h-[550px] border-0 bg-white" 
                                      title="PDF Viewer" 
                                    />
                                  </div>
                                ) : (
                                  <div className="text-center py-12 text-xs text-slate-400">File PDF belum diunggah.</div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4 text-left w-full mx-auto">
                                {activeModul.googleDocUrl && (
                                  <div className="flex flex-col border border-slate-205 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                                    <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-2 text-xs font-bold text-indigo-850 dark:text-indigo-300 uppercase border-b border-indigo-100 dark:border-indigo-900 flex justify-between items-center">
                                      <span>📝 Google Docs (Catatan Teks)</span>
                                      <a href={activeModul.googleDocUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Buka Tautan Edit ↗</a>
                                    </div>
                                    <iframe 
                                      src={getEmbedUrl(activeModul.googleDocUrl, 'doc')} 
                                      className="w-full h-80 border-0 bg-white" 
                                      title="Google Doc Embed Viewer" 
                                      allow="autoplay"
                                    />
                                  </div>
                                )}
                                {activeModul.googleSlideUrl && (
                                  <div className="flex flex-col border border-slate-205 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                                    <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-2 text-xs font-bold text-indigo-850 dark:text-indigo-300 uppercase border-b border-indigo-100 dark:border-indigo-900 flex justify-between items-center">
                                      <span>📊 Google Slides (Materi Presentasi)</span>
                                      <a href={activeModul.googleSlideUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Buka Tautan Edit ↗</a>
                                    </div>
                                    <iframe 
                                      src={getEmbedUrl(activeModul.googleSlideUrl, 'slide')} 
                                      className="w-full h-80 border-0 bg-white" 
                                      title="Google Slide Embed Viewer" 
                                      allow="autoplay"
                                    />
                                  </div>
                                )}
                                {!activeModul.googleDocUrl && !activeModul.googleSlideUrl && (
                                  <div className="text-center py-12 text-xs text-slate-400">Tautan doc/slide belum diisi.</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-col space-y-4 shadow-xs text-center w-full max-w-3xl mx-auto">
                            {(() => {
                              const activeCover = activeModul.isMultiJilid 
                                ? (activeModul.coverModulPerJilid?.[jilidIndex] || activeModul.coverModul)
                                : (activeModul.coverModul || activeModul.coverModulPerJilid?.[0]);
                              if (!activeCover) return null;
                              return (
                                <div className="flex justify-center mb-1">
                                  <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-xs opacity-25 group-hover:opacity-45 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative w-28 h-36 rounded-2xl overflow-hidden shadow-lg border border-slate-200/60 dark:border-slate-800 transition transform hover:scale-105 duration-300">
                                      <img 
                                        src={activeCover} 
                                        alt="Cover Modul" 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs p-1 text-center text-[8px] text-white font-semibold uppercase tracking-wider">
                                        Sampul {activeModul.isMultiJilid ? `Jilid ${jilidIndex + 1}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="flex items-center justify-between px-1">
                              <button
                                type="button"
                                disabled={resolvedActivePreviewPage <= pageStart}
                                onClick={() => setActiveNonQuranPreviewPage(resolvedActivePreviewPage - 1)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-101 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                              >
                                ← Prev
                              </button>
                              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block font-sans">
                                Halaman {resolvedActivePreviewPage}
                              </span>
                              <button
                                type="button"
                                disabled={resolvedActivePreviewPage >= pageEnd}
                                onClick={() => setActiveNonQuranPreviewPage(resolvedActivePreviewPage + 1)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-101 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 border border-slate-202 dark:border-slate-800 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                              >
                                Next →
                              </button>
                            </div>

                            {imageSrc ? (
                              <ImageAnnotationCanvas imageSrc={imageSrc} pageNumber={resolvedActivePreviewPage} />
                            ) : manualText ? (
                              <div ref={nonQuranPreviewContainerRef} className="p-5 bg-white dark:bg-slate-950 rounded-2xl text-left border border-slate-200 dark:border-slate-800 min-h-[300px] max-h-[450px] overflow-y-auto shadow-inner leading-relaxed">
                                {manualText && manualText.includes('<') && manualText.includes('>') ? (
                                  <div 
                                    className="text-sm text-slate-850 dark:text-slate-150 leading-relaxed font-sans page-html-output whitespace-normal"
                                    dangerouslySetInnerHTML={{ __html: manualText }}
                                  />
                                ) : (
                                  <div className="flex flex-row flex-wrap gap-2.5 justify-start items-center w-full" dir="auto">
                                    {(() => {
                                      const words = manualText.split(/\s+/).filter(Boolean);
                                      const wordPrefix = `nonquran-${resolvedActivePreviewPage}`;
                                      const hasArabic = /[\u0600-\u06FF]/.test(manualText);
                                      return words.map((word, wordIdx) => {
                                        const wordKey = `${wordPrefix}-${wordIdx}`;
                                        const isSelected = selectedHighlightKeys.includes(wordKey) || selectedHighlightKey === wordKey;
                                        const hasSavedComment = interactiveComments.some(c => c.targetKey === wordKey || c.targetKeys?.includes(wordKey));
                                        return (
                                          <span 
                                            key={wordKey}
                                            data-word-prefix={wordPrefix}
                                            data-word-idx={wordIdx}
                                            onMouseDown={(e) => {
                                              if (e.button === 0) {
                                                startWordDrag(e.clientX, e.clientY, false, wordPrefix, words, wordIdx, hasArabic);
                                              }
                                            }}
                                            onTouchStart={(e) => {
                                              if (e.touches.length === 1) {
                                                const t = e.touches[0];
                                                startWordDrag(t.clientX, t.clientY, true, wordPrefix, words, wordIdx, hasArabic);
                                              }
                                            }}
                                            onClick={(e) => handleWordSelection(wordKey, word, wordIdx, words, { isShift: e.shiftKey, isRtl: hasArabic })}
                                            style={{ fontSize: `${(guruQuranZoom / 100) * 1.05}rem`, lineHeight: '1.8' }}
                                            className={`font-semibold cursor-pointer transition rounded px-2 py-0.5 select-none touch-pan-y ${
                                              isSelected
                                                ? 'bg-amber-200 text-amber-955 dark:bg-amber-955 dark:text-amber-200 ring-2 ring-amber-450 font-bold scale-[1.03] shadow-xs'
                                                : hasSavedComment
                                                  ? 'bg-rose-100 dark:bg-rose-955/40 text-rose-900 dark:text-rose-200 border-b-2 border-rose-500 font-bold'
                                                  : 'text-slate-900 dark:text-slate-100 hover:bg-amber-55 dark:hover:bg-slate-800'
                                            }`}
                                            title={hasSavedComment ? "Koreksi aktif (Klik atau usap antar kata untuk edit/tambah)" : "Klik atau usap antar kata untuk beri catatan"}
                                          >
                                            {word}
                                          </span>
                                        );
                                      });
                                    })()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-950 rounded-xl min-h-[300px] border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-1 w-full mx-auto">
                                <span className="text-[11px] font-sans text-slate-500">Gambar/Materi tidak tersedia</span>
                                <span className="text-[9px] text-slate-404 font-sans italic">(Gunakan upload modul jilid atau isi teks manual)</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interactive Line Selector for Non-Quran Modules - Rendered directly below the card */}
                  {(() => {
                    const defaultMax = (() => {
                      if (!activeModul) return 15;
                      const jIdx = activeModul.isMultiJilid ? (Number(nonQuranJilid) - 1) : 0;
                      const pageLineCounts = activeModul.jumlahBarisPerHalamanPerJilid?.[jIdx] || activeModul.jumlahBarisPerHalaman || [];
                      const count = pageLineCounts[pageIdx];
                      return count !== undefined && count !== null && count > 0 ? count : 15;
                    })();

                    const rawStart = barisAwal !== '' ? Number(barisAwal) : null;
                    const rawEnd = barisAkhir !== '' ? Number(barisAkhir) : null;
                    const hasSetoranRange = rawStart !== null || rawEnd !== null;

                    let startLine = 1;
                    let endLine = defaultMax;

                    if (rawStart !== null && rawEnd !== null) {
                      startLine = Math.max(1, Math.min(rawStart, rawEnd));
                      endLine = Math.max(rawStart, rawEnd);
                    } else if (rawStart !== null) {
                      startLine = Math.max(1, rawStart);
                      endLine = Math.max(startLine, defaultMax);
                    } else if (rawEnd !== null) {
                      startLine = 1;
                      endLine = Math.max(1, rawEnd);
                    }

                    // When showOnlySetoranRange is true and range is entered, restrict strictly to [startLine, endLine]
                    const effectiveStart = (hasSetoranRange && showOnlySetoranRange) ? startLine : 1;
                    const effectiveEnd = (hasSetoranRange && showOnlySetoranRange) ? endLine : Math.max(defaultMax, endLine);

                    const lineNumbers: number[] = [];
                    for (let l = effectiveStart; l <= effectiveEnd; l++) {
                      lineNumbers.push(l);
                    }

                    // Check if there are saved comments on lines outside the current visible range
                    const commentsOutsideRange = interactiveComments.filter(c => {
                      if (!c.targetKey?.startsWith(`line-${resolvedActivePreviewPage}-`)) return false;
                      const match = c.targetKey.match(/line-\d+-(\d+)/);
                      if (!match) return false;
                      const lNum = Number(match[1]);
                      return lNum < effectiveStart || lNum > effectiveEnd;
                    });

                    return (
                      <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2.5 w-full max-w-3xl mx-auto shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-900">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-400 block uppercase tracking-wider font-sans">
                              📏 PILIH BARIS YANG SALAH (HALAMAN {resolvedActivePreviewPage})
                            </span>
                            {hasSetoranRange && (
                              <span className="text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <span>Baris {startLine} s/d {endLine}</span>
                                <span className="text-[8px] opacity-75">({endLine - startLine + 1} Baris)</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Pilihan Mode Tampilan Form Koreksi Non-Quran */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-0.5 rounded-xl text-[10px] font-bold flex-wrap">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 px-1.5 font-mono uppercase hidden md:inline">Tampilan Koreksi:</span>
                              <button
                                type="button"
                                onClick={() => handleSetCorrectionFormMode('modal')}
                                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                  correctionFormMode === 'modal'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs font-black ring-1 ring-indigo-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                                title="Form koreksi muncul sebagai Popup / Modal saat nomor baris/kata diklik"
                              >
                                <span className="text-xs">🪟</span>
                                <span>Popup / Modal</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetCorrectionFormMode('inline')}
                                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                  correctionFormMode === 'inline'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs font-black ring-1 ring-indigo-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                                title="Form koreksi muncul di bawah pilihan baris seperti biasa"
                              >
                                <span className="text-xs">📋</span>
                                <span>Di Bawah Baris</span>
                              </button>
                              {correctionFormMode === 'modal' && (
                                <button
                                  type="button"
                                  onClick={() => setIsRangeSelectMode(prev => !prev)}
                                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer border ${
                                    isRangeSelectMode
                                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs font-black'
                                      : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
                                  }`}
                                  title="Aktifkan mode 2 klik untuk memilih rentang antar kata sebelum Popup terbuka"
                                >
                                  <span>🔗</span>
                                  <span>Rentang (2 Klik)</span>
                                </button>
                              )}
                            </div>

                            {hasSetoranRange && (
                              <button
                                type="button"
                                onClick={() => setShowOnlySetoranRange(!showOnlySetoranRange)}
                                className="text-[9px] font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-850 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                                title={showOnlySetoranRange ? "Klik untuk melihat seluruh baris halaman" : "Klik untuk membatasi ke rentang baris yang disetorkan"}
                              >
                                {showOnlySetoranRange 
                                  ? `Tampilkan Semua Baris (1-${Math.max(defaultMax, endLine)})` 
                                  : `Hanya Rentang Setoran (${startLine}-${endLine})`}
                              </button>
                            )}
                          </div>
                        </div>

                        {commentsOutsideRange.length > 0 && (
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                            <span>⚠️ Terdapat {commentsOutsideRange.length} catatan koreksi di luar rentang baris ({effectiveStart}-{effectiveEnd}).</span>
                            <button
                              type="button"
                              onClick={() => setShowOnlySetoranRange(false)}
                              className="underline font-bold hover:text-amber-900 cursor-pointer ml-2"
                            >
                              Tampilkan Semua Baris
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {lineNumbers.map((lineNum) => {
                            const lineKey = `line-${resolvedActivePreviewPage}-${lineNum}`;
                            const isSelected = selectedHighlightKey === lineKey;
                            const hasSavedComment = interactiveComments.some(c => c.targetKey === lineKey || c.targetKeys?.includes(lineKey));
                            return (
                              <button
                                key={lineKey}
                                type="button"
                                onClick={() => {
                                  const lineText = `Baris ${lineNum}`;
                                  if (selectedHighlightKey === lineKey) {
                                    setSelectedHighlightKey('');
                                    setSelectedHighlightText('');
                                    setSelectedHighlightKeys([]);
                                    setRangeStartKey(null);
                                    setRangeEndKey(null);
                                    setIsCorrectionModalOpen(false);
                                    setActiveWordContext(null);
                                    setSelectedErrorCategory('Lainnya');
                                    setSelectedSubCategory(null);
                                    setActiveCommentInput('');
                                  } else {
                                    setSelectedHighlightKey(lineKey);
                                    setSelectedHighlightText(lineText);
                                    setSelectedHighlightKeys([lineKey]);
                                    setRangeStartKey(lineKey);
                                    setRangeEndKey(null);
                                    setActiveWordContext(null);
                                    if (correctionFormMode === 'modal') {
                                      setIsCorrectionModalOpen(true);
                                    }
                                    setSelectedErrorCategory('Lainnya');
                                    setSelectedSubCategory(null);
                                    setActiveCommentInput('');
                                  }
                                }}
                                className={`p-2.5 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer flex flex-col items-center justify-center border ${
                                  isSelected
                                    ? 'bg-amber-200 text-amber-955 dark:bg-amber-955 dark:text-amber-200 border-amber-450 ring-2 ring-amber-400 shadow-sm font-extrabold scale-[1.03]'
                                    : hasSavedComment
                                      ? 'bg-rose-100 hover:bg-rose-150 dark:bg-rose-955/35 dark:hover:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300/60 dark:border-rose-900/50'
                                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 border-slate-200 dark:border-slate-800/80'
                                }`}
                              >
                                <span className="text-[9px] font-sans text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5">L</span>
                                <span className="font-mono text-xs">{lineNum}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Beautiful per-page explanation banner */}
                  {!isEmbedOrPdf && activeModul.tipeMateri !== 'hanya_identitas' && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 text-left space-y-1 w-full max-w-3xl mx-auto">
                      <span className="text-[9px] font-bold text-slate-404 block uppercase tracking-wider font-mono">
                        Uraian / Penjelasan Singkat Halaman {resolvedActivePreviewPage}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-wrap font-medium">
                        {activeExplanation || activeModul.isiModulManual || 'Tidak ada uraian penjelasan khusus untuk halaman ini.'}
                      </p>
                    </div>
                  )}


            {/* Dynamic Comment input row for Non-Quran - Mode Inline (Di Bawah Baris) */}
            {correctionFormMode === 'inline' && selectedHighlightText && (
              <div className="mt-4 pt-4 border-t border-slate-150 dark:border-slate-800 text-left space-y-3 animate-fade-in w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-[10px] font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider font-mono">
                    TULIS CATATAN KOREKSI / PERBAIKAN (NON-QURAN)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetCorrectionFormMode('modal')}
                      className="text-[10px] font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 cursor-pointer bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200/50"
                      title="Alihkan form ke Popup / Modal"
                    >
                      <span>🪟 Ubah ke Popup</span>
                    </button>
                    <span className="text-[10px] font-sans text-amber-700 font-semibold bg-amber-50 dark:bg-amber-955/20 px-2.5 py-1 rounded border border-amber-200/50 flex items-center">
                      {selectedHighlightKey?.startsWith('line-') ? 'Baris Terpilih' : 'Kata Terpilih'}: &nbsp;<strong className="font-sans font-bold text-xs">{selectedHighlightText}</strong>
                    </span>
                  </div>
                </div>

                {renderNonQuranCorrectionFormFields(resolvedActivePreviewPage)}

                {/* Summary & Fast Save Action Bar */}
                <div className="space-y-2.5 bg-slate-50/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                        Koreksi Terpilih:
                      </span>
                      <span className="px-2.5 py-1 bg-indigo-600 text-white font-extrabold text-xs rounded-lg shadow-2xs flex items-center gap-1">
                        <span>{selectedErrorCategory}</span>
                        {selectedSubCategory && (
                          <>
                            <span className="opacity-70">&bull;</span>
                            <span>{selectedSubCategory}</span>
                          </>
                        )}
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium font-sans">
                        pada <strong className="font-bold text-indigo-700 dark:text-indigo-300">"{selectedHighlightText}"</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 justify-end shrink-0">
                      <button
                        type="button"
                        onClick={handleCancelNonQuranCorrection}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer font-sans border border-slate-200 dark:border-slate-700"
                      >
                        Batal
                      </button>
                      <button
                        id="btn-save-nonquran-correction"
                        type="button"
                        onClick={() => handleSaveNonQuranCorrection(resolvedActivePreviewPage)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs uppercase rounded-xl transition shadow-md whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 font-sans ring-2 ring-indigo-400/50"
                        title="Simpan koreksi langsung ke sesi mutabaah (catatan bisa dilengkapi di akhir)"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>SIMPAN KOREKSI</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Non-blocking Floating Bar saat mode Rentang (2 Klik) menunggu kata kedua (Non-Quran) */}
            {correctionFormMode === 'modal' && !isCorrectionModalOpen && selectedHighlightText && (
              <div className="flex items-center justify-between gap-2.5 flex-wrap p-2.5 px-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-300/80 dark:border-amber-800/70 shadow-xs animate-fade-in">
                <div className="flex items-center gap-2 flex-wrap text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 font-mono">
                    Target Awal:
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-950 dark:bg-amber-900/70 dark:text-amber-100 font-sans text-xs font-bold">
                    {selectedHighlightText}
                  </span>
                  <span className="text-[11px] text-amber-900/80 dark:text-amber-200/80 font-sans">
                    Klik kata kedua untuk rentang, atau langsung catat 1 kata ini.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelNonQuranCorrection}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCorrectionModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Catat 1 Kata Ini</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode Popup / Modal Mengambang untuk Non-Quran */}
            {correctionFormMode === 'modal' && isCorrectionModalOpen && selectedHighlightText && (
              <div 
                className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    handleCancelNonQuranCorrection();
                  }
                }}
              >
                <div 
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-indigo-50 via-slate-50 to-white dark:from-slate-850 dark:via-slate-850 dark:to-slate-900 border-b border-indigo-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold font-mono tracking-wider text-slate-800 dark:text-slate-100 uppercase">
                          CATAT KOREKSI / PERBAIKAN
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                            {selectedHighlightKey?.startsWith('line-') ? 'Baris Terpilih:' : 'Target:'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-sans text-xs font-bold truncate max-w-[200px] sm:max-w-md">
                            {selectedHighlightText}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                            (Halaman {resolvedActivePreviewPage})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetCorrectionFormMode('inline')}
                        className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition cursor-pointer"
                        title="Tampilkan di bawah baris (inline)"
                      >
                        <span>📋</span>
                        <span>Di Bawah Baris</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelNonQuranCorrection}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Tutup / Batal (Esc)"
                      >
                        <X className="w-5 h-5 stroke-[2.2]" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-left">
                    {renderModalWordRangeAdjuster()}
                    {renderNonQuranCorrectionFormFields(resolvedActivePreviewPage)}
                  </div>

                  {/* Modal Sticky Footer */}
                  <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold hidden sm:inline">Koreksi:</span>
                      <span className="px-2.5 py-1 bg-indigo-600 text-white font-extrabold text-xs rounded-lg shadow-2xs flex items-center gap-1 truncate max-w-[220px] sm:max-w-xs">
                        <span>{selectedErrorCategory}</span>
                        {selectedSubCategory && (
                          <>
                            <span className="opacity-70">&bull;</span>
                            <span className="truncate">{selectedSubCategory}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto shrink-0">
                      <button
                        type="button"
                        onClick={handleCancelNonQuranCorrection}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        Batal
                      </button>
                      <button
                        id="btn-save-nonquran-correction"
                        type="button"
                        onClick={() => handleSaveNonQuranCorrection(resolvedActivePreviewPage)}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs uppercase rounded-xl transition cursor-pointer font-sans shadow-md flex items-center justify-center gap-1.5 ring-2 ring-indigo-400/50"
                        title="Simpan koreksi langsung ke sesi mutabaah"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>SIMPAN KOREKSI</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

                          {/* List of active comments from current session for Non-Quran */}
                          {interactiveComments.length > 0 && (
                            <div className="pt-4 border-t border-slate-150 dark:border-slate-800 space-y-2.5 text-left animate-fade-in w-full">
                              <div className="flex justify-between items-center flex-wrap gap-2">
                                <div>
                                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 block uppercase tracking-wider font-mono">
                                    KOREKSI INTERAKTIF SESI INI ({interactiveComments.length})
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-sans">
                                    Lengkapi atau edit catatan perbaikan santri pada kolom di setiap bagian koreksi berikut:
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleClearAllInteractiveComments}
                                  className="text-[9px] font-extrabold text-rose-500 hover:text-rose-700 uppercase tracking-widest font-mono cursor-pointer"
                                >
                                  Bersihkan Semua
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {(() => {
                                  const seenOnceInNonQuran = new Set<string>();
                                  const effectiveOnce = selectedElemenObj?.useMasterPenalties && masterPenalties?.oncePerSessionCategories !== undefined
                                    ? (masterPenalties.oncePerSessionCategories || [])
                                    : (selectedElemenObj?.oncePerSessionCategories || ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']);

                                  return interactiveComments.map((item) => {
                                    const isArabicText = /[\u0600-\u06FF]/.test(item.target);

                                    const effectiveDeductions = selectedElemenObj?.useMasterPenalties && masterPenalties?.rubrikDeductions
                                      ? masterPenalties.rubrikDeductions
                                      : selectedElemenObj?.rubrikDeductions || {};
                                    let deduction = item.category ? effectiveDeductions[item.category] : undefined;
                                    const cleanCat = (item.category || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                                    const matched = tajwidCategories?.find(tc => 
                                      tc.id === item.category || 
                                      tc.nama === item.category ||
                                      tc.id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCat ||
                                      tc.nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCat
                                    );
                                    if (deduction === undefined && matched) {
                                      deduction = effectiveDeductions[matched.id] || effectiveDeductions[matched.nama];
                                    }
                                    if (deduction === undefined) {
                                      deduction = effectiveDeductions['lainnya'] || effectiveDeductions['Lainnya'] || 2;
                                    }

                                    const canonKey = matched ? matched.id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : cleanCat;
                                    const isOnce = effectiveOnce.some(c => {
                                      const cleanC = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                                      if (cleanC === cleanCat || cleanC === canonKey) return true;
                                      if (matched) {
                                        const mClean = matched.nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                                        if (cleanC === mClean) return true;
                                      }
                                      return false;
                                    });

                                    let isDuplicateOnce = false;
                                    if (isOnce) {
                                      const itemKey = getDeductionTrackingKey(canonKey, item.subcategory);
                                      if (seenOnceInNonQuran.has(itemKey)) {
                                        isDuplicateOnce = true;
                                      } else {
                                        seenOnceInNonQuran.add(itemKey);
                                      }
                                    }

                                    return (
                                      <div key={item.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition text-left">
                                        <div className="flex items-center justify-between gap-1 flex-wrap">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`${isArabicText ? 'font-mushaf text-md px-2 py-0.5' : 'font-sans font-bold text-xs px-2 py-0.5'} text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-800 shadow-2xs`}>
                                              {item.target}
                                            </span>
                                            {item.category && item.category !== 'Lainnya' && (() => {
                                              const detail = currentDeductionSummary?.details.find(d => d.commentId === item.id);
                                              const finalDeduction = detail !== undefined ? detail.deduction : deduction;
                                              const isFinalDup = detail !== undefined ? detail.isDuplicate : isDuplicateOnce;
                                              const isJaliy = detail ? detail.categoryType === 'lahn_jaliy' : (item.category?.toLowerCase().includes('jaliy') || item.category?.toLowerCase().includes('dasar'));

                                              return (
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                                                  isFinalDup
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                    : isJaliy
                                                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200/60'
                                                      : 'bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-450 border-amber-200/40'
                                                }`}>
                                                  <span>{item.category}{item.subcategory ? ` - ${item.subcategory}` : ''}</span>
                                                  <span className="text-[7.5px] uppercase font-mono px-1 rounded bg-black/5 dark:bg-white/10 font-bold">
                                                    {isJaliy ? 'Jaliy' : 'Khafiy'}
                                                  </span>
                                                  {selectedElemenObj?.useRubrikPenilaian && (
                                                    isFinalDup ? (
                                                      <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold italic">(0 pt • maks 1x)</span>
                                                    ) : (
                                                      <span className="font-mono text-rose-600 dark:text-rose-400 font-black">
                                                        (-{finalDeduction} pt{isOnce ? ' • maks 1x' : ''})
                                                      </span>
                                                    )
                                                  )}
                                                </span>
                                              );
                                            })()}
                                            <span className="text-[8.5px] font-mono font-extrabold text-slate-400 uppercase tracking-wider">{item.info}</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteInteractiveComment(item.id)}
                                            className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition cursor-pointer font-bold"
                                            title="Hapus koreksi ini"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        
                                        {/* Inline text input for editing note directly */}
                                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                                          <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider font-mono">
                                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                              <span>✍️</span>
                                              <span>Catatan / Uraian Koreksi (Diisi di Akhir Sesi):</span>
                                            </span>
                                            {item.comment ? (
                                              <span className="text-emerald-600 dark:text-emerald-400 font-bold lowercase flex items-center gap-0.5">
                                                ✓ tersinkron ke rekap
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 font-normal lowercase italic">
                                                bisa dikosongkan jika cukup kategori saja
                                              </span>
                                            )}
                                          </div>
                                          <input
                                            type="text"
                                            value={item.comment || ''}
                                            onChange={(e) => handleUpdateInteractiveComment(item.id, e.target.value)}
                                            placeholder="Ketik catatan evaluasi / arahan perbaikan untuk santri di sini..."
                                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition font-sans"
                                          />
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

            {/* ========================================================
                BLOK C: PANEL EVALUASI & PENILAIAN (Right Column)
                ======================================================== */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs overflow-hidden transition-all mt-4 text-left">
              {/* Header Toggle */}
              <div 
                onClick={() => setIsEvaluationCollapsed(!isEvaluationCollapsed)}
                className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-855 flex items-center justify-between cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-905 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">✏️</span>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    BLOK C: Panel Penilaian &amp; Catatan
                  </h3>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-all font-bold">
                  {isEvaluationCollapsed ? "▼ BUKA" : "▲ SEMBUNYIKAN"}
                </span>
              </div>

              {/* Collapsed Brief Summary */}
              {isEvaluationCollapsed && (
                <div className="p-4 bg-[#c5a880]/5 border-b border-indigo-50 dark:border-slate-855 text-xs text-slate-600 dark:text-slate-300 space-y-2 animate-fade-in font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Nilai:</span>
                    <strong className="text-[#c5a880] font-extrabold font-mono text-sm">{setoranGrade}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Predikat Kelulusan:</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold font-sans border ${setoranPass ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-rose-50 text-rose-700 border-rose-250'}`}>
                      {setoranPass ? 'LULUS / CAPAIAN TERCATAT' : 'MENGULANG / BUTUH PERTEMUAN ULANG'}
                    </span>
                  </div>
                  {setoranNote && (
                    <p className="text-[10px] text-slate-455 dark:text-slate-405 line-clamp-1 italic">
                      "{setoranNote}"
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEvaluationCollapsed(false)}
                    className="w-full mt-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border text-[10px] font-extrabold uppercase text-slate-705 dark:text-slate-300 rounded-lg text-center"
                  >
                    Buka Input Evaluasi
                  </button>
                </div>
              )}

              {/* Main Content Form Fields */}
              <div className={`p-5 space-y-4 ${isEvaluationCollapsed ? 'hidden' : 'block'}`}>
                {/* Catatan input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">
                    CATATAN EVALUASI (MUTABAAH) *
                  </label>
                  <textarea 
                    rows={4}
                    value={setoranNote}
                    onChange={(e) => setSetoranNote(e.target.value)}
                    required
                    placeholder="Tulis makhraj pelafalan secara detail, atau kesalahan baca yang sering diulang..."
                    className="w-full p-2.5 border border-slate-205 dark:border-slate-800 text-slate-850 dark:text-slate-205 rounded-xl text-xs font-sans placeholder-slate-400 bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Grade and Predicate Selection Grid */}
                <div className="space-y-3">
                  {/* Status Banner Penilaian - Only when Rubrik is active */}
                  {selectedElemenObj?.useRubrikPenilaian && (
                    <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-black uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sistem Penilaian Otomatis Aktif
                          </span>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                            {selectedElemenObj.useMasterPenalties ? 'Sumber: Master Bobot' : 'Sumber: Bobot Khusus Elemen'} • {selectedElemenObj.rumusPenilaian === 'proporsional_baris' ? 'Rumus: Proporsional Baris' : 'Rumus: Absolut'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsPanduanModalOpen(true)}
                            className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1 shadow-xs transition cursor-pointer"
                            title="Buka Pedoman Standar Penilaian Proporsional"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Panduan Bobot Nilai</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200">
                            {isManualGradeOverride ? 'Mode Manual' : 'Mode Otomatis'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Beralih antara mode otomatis dari rubrik atau penyesuaian nilai manual">
                            <input
                              type="checkbox"
                              checked={isManualGradeOverride}
                              onChange={(e) => setIsManualGradeOverride(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 text-[10.5px] text-amber-900 dark:text-amber-200 pt-1 border-t border-amber-200/60 dark:border-amber-900/50 font-medium">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span>Nilai Dasar: <strong>{selectedElemenObj.useMasterPenalties && masterPenalties?.baseScore !== undefined ? masterPenalties.baseScore : (selectedElemenObj.baseScore || 100)}</strong></span>
                          <span>•</span>
                          <span>Koreksi Tercatat: <strong>{interactiveComments.length} catatan</strong></span>
                          {selectedElemenObj.rumusPenilaian === 'proporsional_baris' && currentDeductionSummary && (
                            <>
                              <span>•</span>
                              <span>
                                Baris: <strong>{currentDeductionSummary.actualLines} baris</strong>
                                <span className="text-[9.5px] text-amber-800/80 dark:text-amber-300/80 ml-1">
                                  (Acuan: {currentDeductionSummary.standardLines} baris
                                  {currentDeductionSummary.isClampedMin ? ' • Min 5 baris' : currentDeductionSummary.isClampedMax ? ' • Maks 15 baris' : ''})
                                </span>
                              </span>
                              <span>•</span>
                              <span className="text-rose-700 dark:text-rose-400 font-bold">
                                Jaliy: {currentDeductionSummary.jaliyCount}x (-{currentDeductionSummary.jaliyDeductionTotal} pt)
                              </span>
                              <span>•</span>
                              <span className="text-amber-700 dark:text-amber-400 font-bold">
                                Khafiy: {currentDeductionSummary.khafiyCount}x (-{currentDeductionSummary.khafiyDeductionTotal} pt)
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>Hasil Nilai:</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white dark:bg-emerald-500 font-mono text-xs">
                            {setoranScore !== '' ? setoranScore : 100} ({selectedPredikat || 'Mumtaz'})
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${setoranPass ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                            {setoranPass ? 'Lulus' : 'Belum Lulus'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If Rubrik is Active: 2 columns (Nilai & Predikat). If Nonactive: Only Predikat (Full Width) */}
                  {selectedElemenObj?.useRubrikPenilaian ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Column 1: NILAI */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                            NILAI (ANGKA) *
                          </label>
                          {setoranScore !== '' && isManualGradeOverride && (
                            <button
                              type="button"
                              onClick={() => setSetoranScore('')}
                              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Hapus / Kosongkan Nilai"
                            >
                              <Trash2 className="w-3 h-3" /> Hapus Nilai
                            </button>
                          )}
                        </div>

                        <div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              disabled={!isManualGradeOverride}
                              value={setoranScore}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') {
                                  setSetoranScore('');
                                  return;
                                }
                                let val = Number(raw);
                                if (isNaN(val)) {
                                  setSetoranScore('');
                                  return;
                                }
                                if (val < 0) val = 0;
                                if (val > 100) val = 100;
                                setSetoranScore(val);
                              }}
                              placeholder="0 - 100"
                              className={`w-full p-2.5 pr-14 border rounded-xl text-xs font-extrabold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                !isManualGradeOverride
                                  ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 text-slate-500 cursor-not-allowed'
                                  : 'bg-white dark:bg-slate-950 border-emerald-500 dark:border-emerald-800 text-slate-850 dark:text-slate-150'
                              }`}
                            />
                            {setoranScore !== '' && isManualGradeOverride && (
                              <button
                                type="button"
                                onClick={() => setSetoranScore('')}
                                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded transition cursor-pointer"
                                title="Hapus Nilai"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isManualGradeOverride && (
                              <span className="absolute right-3 top-2.5 text-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase font-black tracking-wide">
                                Otomatis
                              </span>
                            )}
                          </div>

                          {/* Quick presets when manual input is active */}
                          {isManualGradeOverride && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              <span className="text-[9px] text-slate-400">Pilihan:</span>
                              {[100, 95, 90, 85, 80, 75, 70].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setSetoranScore(preset)}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                                    setoranScore === preset
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setSetoranScore('')}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                                title="Kosongkan / Hapus Nilai"
                              >
                                Kosongkan
                              </button>
                            </div>
                          )}

                          <p className="text-[9px] text-slate-400 mt-1">
                            {!isManualGradeOverride 
                              ? 'Dihitung otomatis oleh sistem rubrik kesalahan & bobot.'
                              : 'Ketik nilai angka 0 s.d 100 atau gunakan tombol pilihan cepat.'}
                          </p>
                        </div>
                      </div>

                      {/* Column 2: PREDIKAT */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                            PREDIKAT * <span className="text-emerald-700 dark:text-emerald-400 font-bold">(Dapat Dipilih Guru)</span>
                          </label>
                          <span className="text-[9px] text-slate-400 font-medium">Klik untuk memilih</span>
                        </div>

                        {/* Display Selected Predicate Card */}
                        <div className={`p-2.5 border rounded-xl text-xs font-extrabold flex items-center justify-between min-h-[42px] transition-all shadow-xs ${
                          setoranPass 
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300' 
                            : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-extrabold text-xs sm:text-sm block">
                                {cleanPredikatText(selectedPredikat) || (setoranScore === '' ? '-' : (cleanPredikatText(getMatchedPredicate(setoranScore).predikat) || '-'))}
                              </span>
                              {setoranScore !== '' && (
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                                  Nilai: {setoranScore}/100
                                </span>
                              )}
                            </div>
                          </div>
                          <span 
                            className="text-[9px] uppercase font-black px-2 py-1 rounded-md tracking-wider shadow-xs flex items-center gap-1 text-white" 
                            style={{ backgroundColor: setoranPass ? '#10b981' : '#f43f5e' }}
                          >
                            {setoranPass ? '✓ LULUS' : '✕ ULANG'}
                          </span>
                        </div>

                        {/* Interactive Predicate Selector Chips */}
                        <div className="mt-2 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Pilihan Predikat oleh Guru:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {activePredicates.map((p) => {
                              const isSelected = selectedPredikat.toLowerCase() === p.predikat.toLowerCase();
                              return (
                                <button
                                  key={p.predikat}
                                  type="button"
                                  onClick={() => handleSelectPredikat(p.predikat, p.lulus)}
                                  className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                                    isSelected
                                      ? p.lulus
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                                        : 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400/40'
                                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className={`text-[11px] font-black ${isSelected ? 'text-white' : ''}`}>
                                      {cleanPredikatText(p.predikat)}
                                    </span>
                                    {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                                  </div>
                                  <div className="flex items-center justify-between mt-1 text-[9px]">
                                    <span className={isSelected ? 'text-emerald-100 dark:text-rose-100' : 'text-slate-400'}>
                                      {`${p.minScore}-${p.maxScore}`}
                                    </span>
                                    <span className={`px-1 py-0.2 rounded text-[7.5px] font-extrabold uppercase ${
                                      isSelected 
                                        ? 'bg-white/20 text-white' 
                                        : p.lulus 
                                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                                    }`}>
                                      {p.lulus ? 'Lulus' : 'Ulang'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Non-Rubrik: Clean Single Section for PREDIKAT only */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                          PREDIKAT * <span className="text-emerald-700 dark:text-emerald-400 font-bold">(Dapat Dipilih Guru)</span>
                        </label>
                        <span className="text-[9px] text-slate-400 font-medium">Klik pilihan predikat di bawah</span>
                      </div>

                      {/* Display Selected Predicate Card (Full Width) */}
                      <div className={`p-3 border rounded-xl text-xs font-extrabold flex items-center justify-between min-h-[46px] transition-all shadow-xs ${
                        setoranPass 
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300' 
                          : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div>
                            <span className="font-extrabold text-sm sm:text-base block">
                              {cleanPredikatText(selectedPredikat) || 'Mumtaz'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                              Status evaluasi: {setoranPass ? 'Lulus Target Setoran' : 'Mengulang / Perlu Murojaah'}
                            </span>
                          </div>
                        </div>
                        <span 
                          className="text-[10px] uppercase font-black px-2.5 py-1 rounded-lg tracking-wider shadow-xs flex items-center gap-1 text-white" 
                          style={{ backgroundColor: setoranPass ? '#10b981' : '#f43f5e' }}
                        >
                          {setoranPass ? '✓ LULUS' : '✕ ULANG'}
                        </span>
                      </div>

                      {/* Interactive Predicate Selector Chips */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Pilihan Predikat oleh Guru:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {activePredicates.map((p) => {
                            const isSelected = selectedPredikat.toLowerCase() === p.predikat.toLowerCase();
                            return (
                              <button
                                key={p.predikat}
                                type="button"
                                onClick={() => handleSelectPredikat(p.predikat, p.lulus)}
                                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? p.lulus
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                                      : 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400/40'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className={`text-xs font-black ${isSelected ? 'text-white' : ''}`}>
                                    {cleanPredikatText(p.predikat)}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                                </div>
                                <div className="flex items-center justify-between mt-2 text-[9.5px]">
                                  <span className={isSelected ? 'text-emerald-100 dark:text-rose-100' : 'text-slate-400'}>
                                    {p.lulus ? 'Lulus' : 'Mengulang'}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                    isSelected 
                                      ? 'bg-white/20 text-white' 
                                      : p.lulus 
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                                  }`}>
                                    {p.lulus ? 'Lulus' : 'Ulang'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pass/Fail / Kesimpulan Hasil Kelulusan */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                        KESIMPULAN HASIL KELULUSAN *
                      </label>
                      {isManualKelulusanOverride ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                          Pilihan Manual (Disesuaikan Guru)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                          Otomatis Sistem
                        </span>
                      )}
                    </div>
                    {isManualKelulusanOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualKelulusanOverride(false);
                          const targetPred = activePredicates.find(p => p.predikat.toLowerCase() === (selectedPredikat || '').toLowerCase());
                          const autoPass = targetPred ? targetPred.lulus : true;
                          setKesimpulanHasilKelulusan(autoPass ? 'Lulus' : 'Belum Lulus');
                          setSetoranPass(autoPass);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Kembalikan ke kesimpulan otomatis berdasarkan nilai/predikat"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Kembalikan ke Otomatis</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                    Diawali otomatis dari nilai/predikat, namun Anda tetap dapat mengubah atau memilih status kelulusan di bawah ini secara bebas sesuai pertimbangan guru (misalnya jika santri memperoleh predikat Jayyid tetapi tetap butuh mengulang).
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {/* Option: Lulus */}
                    <button
                      type="button"
                      onClick={() => {
                        setKesimpulanHasilKelulusan('Lulus');
                        setSetoranPass(true);
                        setIsManualKelulusanOverride(true);
                      }}
                      className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all text-center select-none cursor-pointer group ${
                        kesimpulanHasilKelulusan === 'Lulus'
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-300 ring-2 ring-emerald-500 shadow-xs'
                          : 'border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      <div className={`p-2.5 rounded-full mb-3 transition-colors ${
                        kesimpulanHasilKelulusan === 'Lulus'
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-500'
                      }`}>
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-extrabold tracking-wider uppercase">LULUS</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight max-w-[150px]">
                        Target setoran tercapai dengan baik
                      </span>
                      {kesimpulanHasilKelulusan === 'Lulus' && (
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </button>

                    {/* Option: Belum Lulus / Ulang */}
                    <button
                      type="button"
                      onClick={() => {
                        setKesimpulanHasilKelulusan('Belum Lulus');
                        setSetoranPass(false);
                        setIsManualKelulusanOverride(true);
                      }}
                      className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all text-center select-none cursor-pointer group ${
                        kesimpulanHasilKelulusan === 'Belum Lulus'
                          ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-955/20 text-rose-850 dark:text-rose-300 ring-2 ring-rose-500 shadow-xs'
                          : 'border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      <div className={`p-2.5 rounded-full mb-3 transition-colors ${
                        kesimpulanHasilKelulusan === 'Belum Lulus'
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-500'
                      }`}>
                        <RotateCcw className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-extrabold tracking-wider uppercase">BELUM LULUS / ULANG</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight max-w-[170px]">
                        Perlu bimbingan atau diulangi kembali agar lebih mutqin & lancar
                      </span>
                      {kesimpulanHasilKelulusan === 'Belum Lulus' && (
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full p-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold uppercase tracking-widest rounded-xl transition-all text-xs cursor-pointer active:scale-95 text-center shadow-md shadow-emerald-600/10"
                  >
                    💾 Simpan Penilaian Setoran
                  </button>
                </div>
              </div>
            </div>

            </div> {/* Close Right Major Column */}

          </form>

          {/* VISUALISASI STATISTIK KESALAHAN UMUM SISWA */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <span>STATISTIK & POLA KESALAHAN BACAAN SANTRI</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rangkuman analitik historis untuk evaluasi personal dan talaqqi terfokus
                </p>
              </div>
            </div>
            
            <SiswaErrorAnalytics
              siswaId={setoranSiswaId}
              siswaNama={selectedSiswaObj?.namaLengkap || 'Santri'}
              allSetorans={setorans}
              tajwidCategories={tajwidCategories}
              onApplyCategoryToForm={(cat, sub) => {
                handleCategorySelect(cat);
                if (sub) {
                  handleSubCategorySelect(sub, false);
                }
              }}
            />
          </div>
        </div>


          </div>
        )}
        {innerTab === 'riwayat' && (
          <div>
                    <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-905 dark:text-white">Riwayat Setoran Bimbingan</h2>
                {activeSelectedHalaqah?.namaHalaqah && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shadow-xs">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Halaqah: {activeSelectedHalaqah.namaHalaqah}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeSelectedHalaqah?.namaHalaqah 
                  ? `Menampilkan catatan historis capaian dan mutabaah santri halaqah ${activeSelectedHalaqah.namaHalaqah}`
                  : 'Seluruh catatan historis capaian, koreksi status harian, dan mutabaah juz/kitab'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3.5 flex-wrap gap-y-2">
              {/* Unified SIMPAN PDF Button with Dropdown Choice */}
              <div className="relative inline-block text-left">
                <button 
                  type="button"
                  onClick={() => {
                    setIsPdfDropdownOpen(!isPdfDropdownOpen);
                    setIsExcelDropdownOpen(false);
                  }}
                  className="p-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  title="Klik untuk memilih lokasi penyimpanan laporan PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Simpan PDF</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>
                
                {isPdfDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPdfDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ring-1 ring-black/5 z-25 p-1 animate-fade-in text-slate-800 dark:text-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          simulateExport('PDF', getExportFileName());
                          setIsPdfDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-start space-x-2.5 cursor-pointer"
                      >
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-450 shrink-0">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">Unduh ke HP / Perangkat</span>
                          <span className="text-[10px] text-slate-400 block leading-normal pt-0.5">Simpan berkas PDF ke penyimpanan setempat</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          saveToGoogleDrive(getExportFileName(), 'PDF');
                          setIsPdfDropdownOpen(false);
                        }}
                        disabled={!!uploadingToDrive}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-start space-x-2.5 cursor-pointer disabled:opacity-50"
                      >
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">
                            {uploadingToDrive && (uploadingToDrive.startsWith('Rekap_Setoran_Halaqah') || uploadingToDrive.startsWith('Rekap_Setoran_ALL Halaqah')) ? 'Menyimpan...' : 'Simpan ke Google Drive'}
                          </span>
                          <span className="text-[10px] text-slate-400 block leading-normal pt-0.5">Simpan salinan rekap langsung ke Cloud Anda</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Unified SIMPAN EXCEL Button with Dropdown Choice */}
              <div className="relative inline-block text-left">
                <button 
                  type="button"
                  onClick={() => {
                    setIsExcelDropdownOpen(!isExcelDropdownOpen);
                    setIsPdfDropdownOpen(false);
                  }}
                  className="p-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-355 text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer border border-slate-205 dark:border-slate-800"
                  title="Klik untuk memilih lokasi penyimpanan laporan Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Simpan Excel</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>
                
                {isExcelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsExcelDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ring-1 ring-black/5 z-25 p-1 animate-fade-in text-slate-800 dark:text-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          simulateExport('Excel', getExportFileName());
                          setIsExcelDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-start space-x-2.5 cursor-pointer"
                      >
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-450 shrink-0">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">Unduh ke HP / Perangkat</span>
                          <span className="text-[10px] text-slate-400 block leading-normal pt-0.5">Unduh berkas Excel .xlsx ke perangkat setempat</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          saveToGoogleDrive(getExportFileName(), 'Excel');
                          setIsExcelDropdownOpen(false);
                        }}
                        disabled={!!uploadingToDrive}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition flex items-start space-x-2.5 cursor-pointer disabled:opacity-50"
                      >
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">
                            {uploadingToDrive && (uploadingToDrive.startsWith('Rekap_Setoran_Halaqah') || uploadingToDrive.startsWith('Rekap_Setoran_ALL Halaqah')) ? 'Menyimpan...' : 'Simpan ke Google Drive'}
                          </span>
                          <span className="text-[10px] text-slate-400 block leading-normal pt-0.5">Simpan salinan rekap spreadsheet langsung ke Cloud</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Expanded filters options */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cari Siswa</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-405" />
                <input 
                  type="text" 
                  placeholder="Nama / NIS..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 p-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Materi/Modul</label>
              <select 
                value={historyModulFilter}
                onChange={(e) => setHistoryModulFilter(e.target.value)}
                className="w-full p-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                <option value="All">Semua Modul</option>
                {moduls.map(m => <option key={m.id} value={m.id}>{m.namaSurat ? `Surat ${m.namaSurat}` : m.judulModul}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal</label>
              <input 
                type="date" 
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                className="w-full p-1 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs" 
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Elemen Pembelajaran
              </label>
              <select 
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="w-full p-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                <option value="All">Semua Elemen</option>
                {historyAvailableElements.map(elem => (
                  <option key={elem.key} value={elem.nama}>
                    {elem.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* History Records */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850/80 shadow-sm overflow-hidden">
            {/* View Mode Switcher Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850/80 gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  Daftar Catatan Setoran ({filteredHistory.length})
                </span>
                {activeSelectedHalaqah?.namaHalaqah && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                    <BookOpen className="w-3 h-3" />
                    <span>{activeSelectedHalaqah.namaHalaqah}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode('table')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    historyViewMode === 'table'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-450 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryViewMode('grid')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    historyViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-450 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>
            </div>

            {historyViewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-900 text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Tanggal Uji</th>
                      <th className="p-4">Siswa / Santri</th>
                      <th className="p-4">Kelompok Halaqah</th>
                      <th className="p-4">Elemen Capaian</th>
                      <th className="p-4">Materi Setoran</th>
                      <th className="p-4">Predikat</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Detail Catatan</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-900 font-medium">
                    {filteredHistory.map((s) => (
                      <tr key={s.id} className="text-slate-750 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="p-4 text-slate-450 font-mono">{s.tanggalSetoran}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{s.siswaNama}</div>
                          <div className="text-[10px] text-slate-404 font-mono">NIS: {s.siswaNis}</div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-350">{s.halaqahNama}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/60 font-mono w-max">
                              🏷️ {resolveSetoranElemenName(s)}
                            </span>
                            {s.tipeTahfidz && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-55/80 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/60 font-mono w-max uppercase tracking-wider">
                                ⚡ {s.tipeTahfidz}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{s.modulNama}</div>
                          {s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0 ? (
                            <div className="mt-1 space-y-0.5">
                              <div className="text-[8px] font-extrabold bg-slate-100 dark:bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded tracking-wide inline-block uppercase font-mono mb-1">Rincian ({s.banyakSurat} Surat)</div>
                              {s.daftarSuratSetoran.map((item, index) => {
                                const sNo = getSurahNumber(item.suratNama);
                                const correspondingModul = moduls.find(m => m.tipe === TipeModul.AL_QURAN && m.nomorUrutSurat === sNo);
                                const pageRange = getQuranPageRangeString(sNo, Number(item.ayatAwal), Number(item.ayatAkhir), correspondingModul);
                                return (
                                  <div key={index} className="text-[10px] font-mono text-emerald-800 dark:text-emerald-450 font-semibold">
                                    • {item.suratNama} (Ayat {item.ayatAwal}-{item.ayatAkhir}) {pageRange ? `| ${pageRange}` : ''}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <>
                              {s.suratNama && (
                                <div className="text-[10px] text-slate-404 font-mono text-emerald-800 dark:text-emerald-450 font-bold uppercase mt-0.5">
                                  Ayat {s.ayatAwal}-{s.ayatAkhir} {(() => {
                                    const sNo = getSurahNumber(s.suratNama);
                                    const correspondingModul = moduls.find(m => m.tipe === TipeModul.AL_QURAN && m.nomorUrutSurat === sNo);
                                    const pageRange = getQuranPageRangeString(sNo, Number(s.ayatAwal), Number(s.ayatAkhir), correspondingModul);
                                    return pageRange ? `| ${pageRange}` : '';
                                  })()}
                                </div>
                              )}
                              {s.catatanModulLain && (
                                <div className="text-[10px] text-slate-404 font-mono text-indigo-700 dark:text-indigo-400 uppercase font-bold mt-0.5">
                                  {s.catatanModulLain}
                                </div>
                              )}
                              {s.jumlahBaris !== undefined && s.jumlahBaris !== null && (
                                <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase font-extrabold mt-0.5">
                                  Jumlah: {s.jumlahBaris} Baris {s.barisAwal !== undefined && s.barisAkhir !== undefined ? `(${s.barisAwal}-${s.barisAkhir})` : ''}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-650 dark:text-emerald-400 text-center text-sm">{s.nilai}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${s.statusLulus ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450'}`}>
                            {s.statusLulus ? 'LULUS' : 'MENGULANG'}
                          </span>
                        </td>
                        <td className="p-4 min-w-[220px] max-w-[400px]">
                          {renderFullCatatan(s.catatanGuru)}
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button 
                            onClick={() => {
                              setEditingSetoranObj(s);
                              setHistoryPreviewPage(s.nonQuranPageAwal || s.halaman || 1);
                            }}
                            className="p-1 px-1.5 bg-slate-100 hover:bg-slate-205 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 rounded cursor-pointer"
                            title="Edit setoran"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSetoranAction(s.id, s.siswaNama)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-605 rounded cursor-pointer"
                            title="Hapus setoran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-14 text-center text-slate-400 italic">
                          {activeSelectedHalaqah?.namaHalaqah 
                            ? `Tidak ada entri setoran santri untuk halaqah "${activeSelectedHalaqah.namaHalaqah}" yang sesuai dengan kriteria filter.`
                            : 'Tidak ada entri setoran yang sesuai dengan filter pencarian.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                {filteredHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredHistory.map((s) => (
                      <div 
                        key={s.id} 
                        className="relative bg-slate-50/40 dark:bg-slate-900/15 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-3xs hover:shadow-xs text-left"
                      >
                        <div className="space-y-4">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <span className="inline-block text-[9px] font-mono font-extrabold bg-slate-150/80 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                                {s.tanggalSetoran}
                              </span>
                              <h3 className="font-sans font-extrabold text-slate-900 dark:text-white text-sm mt-1.5 leading-snug">
                                {s.siswaNama}
                              </h3>
                              <p className="text-[10px] text-slate-450 font-semibold font-mono">
                                NIS: {s.siswaNis} • {s.halaqahNama}
                              </p>
                              <div className="flex flex-wrap gap-1 pt-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/45 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/60 font-mono">
                                  🏷️ {resolveSetoranElemenName(s)}
                                </span>
                                {s.tipeTahfidz && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-450 border border-emerald-150 dark:border-emerald-900/60 font-mono uppercase">
                                    ⚡ {s.tipeTahfidz}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0 gap-1.5 min-w-[70px] max-w-[130px]">
                              {/* Highly polished auto-scaling score display with no wrapping */}
                              <div className={`px-2.5 py-1.5 min-h-10 min-w-10 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center justify-center border border-emerald-100/65 dark:border-emerald-900 shadow-2xs text-center whitespace-nowrap leading-tight ${
                                s.nilai.length > 3 ? 'text-[11px] px-3' : 'text-sm font-mono font-black'
                              }`} title={s.nilai}>
                                {s.nilai}
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold border tracking-wider uppercase whitespace-nowrap ${
                                s.statusLulus 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' 
                                  : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900'
                              }`}>
                                {s.statusLulus ? 'LULUS' : 'MENGULANG'}
                              </span>
                            </div>
                          </div>

                          {/* Subject / Module Details Content Box */}
                          <div className="bg-white dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-150/70 dark:border-slate-850 shadow-3xs space-y-1.5">
                            <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 font-mono block">
                              Materi Setoran:
                            </span>
                            <div className="font-extrabold text-xs text-slate-800 dark:text-slate-150 leading-relaxed">
                              {s.modulNama}
                            </div>
                            {s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0 ? (
                              <div className="space-y-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                                {s.daftarSuratSetoran.map((item, index) => (
                                  <div key={index} className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <span className="text-emerald-500">•</span>
                                    <span>{item.suratNama} (Ayat {item.ayatAwal}-{item.ayatAkhir})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] font-mono font-extrabold text-slate-500 pt-1">
                                {s.suratNama && (
                                  <div className="text-emerald-800 dark:text-emerald-400">
                                    • Ayat {s.ayatAwal}-{s.ayatAkhir} | {s.tipeTahfidz || s.jenisSetoran}
                                  </div>
                                )}
                                {s.catatanModulLain && (
                                  <div className="text-indigo-700 dark:text-indigo-400 uppercase mt-0.5">
                                    • {s.catatanModulLain}
                                  </div>
                                )}
                                {s.jumlahBaris !== undefined && s.jumlahBaris !== null && (
                                  <div className="text-teal-600 dark:text-teal-400 uppercase mt-0.5">
                                    • {s.jumlahBaris} Baris {s.barisAwal !== undefined && s.barisAkhir !== undefined ? `(${s.barisAwal}-${s.barisAkhir})` : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Notes / Corrections Block */}
                          <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                            <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 font-mono block">
                              Detail Catatan &amp; Koreksi:
                            </span>
                            <div className="pt-0.5">
                              {renderFullCatatan(s.catatanGuru)}
                            </div>
                          </div>
                        </div>

                        {/* Card bottom action controls */}
                        <div className="flex justify-end gap-2 mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-850/50 shrink-0">
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingSetoranObj(s);
                              setHistoryPreviewPage(s.nonQuranPageAwal || s.halaman || 1);
                            }}
                            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Edit setoran"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Ubah</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteSetoranAction(s.id, s.siswaNama)}
                            className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/25 dark:hover:bg-rose-955/40 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Hapus setoran"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 italic text-xs">
                    {activeSelectedHalaqah?.namaHalaqah 
                      ? `Tidak ada entri bimbingan setoran santri untuk halaqah "${activeSelectedHalaqah.namaHalaqah}" dengan filter ini.`
                      : 'Tidak ada entri bimbingan setoran yang terekam dengan filter ini.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


          </div>
        )}
      </div>

      {/* MODAL: EDIT SETORAN & KOREKSI PERKATA (RIWAYAT SETORAN) */}
      {editingSetoranObj && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl text-emerald-700 dark:text-emerald-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>Edit Catatan & Koreksi Setoran</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                      {editingSetoranObj.siswaNama}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    NIS: {editingSetoranObj.siswaNis || '-'} • Halaqah: {editingSetoranObj.halaqahNama || '-'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSetoranObj(null);
                  setIsEditAddingCorrection(false);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body content */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {/* Banner Materi & Sinkronisasi Otomatis */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">
                    Materi: {editingSetoranObj.suratNama || editingSetoranObj.modulNama || "Al-Qur'an"} {editingSetoranObj.ayatAwal !== undefined ? `(Ayat ${editingSetoranObj.ayatAwal} - ${editingSetoranObj.ayatAkhir})` : ''}
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                    Elemen: {resolveSetoranElemenName(editingSetoranObj) || 'Setoran'} • ID: {editingSetoranObj.id}
                  </div>
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-slate-900/70 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sinkron otomatis ke Matriks Capaian Bacaan Ayat</span>
                </div>
              </div>

              {/* Tanggal Setoran */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Setoran
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="date"
                    value={editingSetoranObj.tanggalSetoran || ''}
                    onChange={(e) => setEditingSetoranObj({ ...editingSetoranObj, tanggalSetoran: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {editingSetoranObj.tanggalSetoran && (
                    <span className="text-[11px] font-bold text-slate-500 shrink-0 bg-slate-100 dark:bg-slate-800 px-2.5 py-2 rounded-xl">
                      {getIndonesianDayName(editingSetoranObj.tanggalSetoran)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Ubah tanggal jika sebelumnya keliru memilih hari/tanggal pada saat mencatat setoran santri.
                </p>
              </div>

              {/* Koreksi Perkata (Interactive Comments) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>Catatan Koreksi Perkata / Tajwid</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        {(editingSetoranObj.interactiveComments || []).length} Koreksi
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Koreksi perkata ini yang otomatis memunculkan tanda silang (✗) pada kolom pertemuan Capaian Bacaan Ayat.
                    </p>
                  </div>
                  {!isEditAddingCorrection && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditAddingCorrection(true);
                        setEditNewWord('');
                        setEditNewCategory('');
                        setEditNewSubcategory('');
                        setEditNewComment('');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Koreksi Kata</span>
                    </button>
                  )}
                </div>

                {/* Form Tambah Koreksi Baru */}
                {isEditAddingCorrection && (
                  <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tambah Koreksi Kata Baru</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditAddingCorrection(false)}
                        className="text-[10px] text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
                      >
                        Batal ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Lafaz / Kata Arab (Misal: بِسْمِ)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="بِسْمِ"
                          value={editNewWord}
                          onChange={(e) => setEditNewWord(e.target.value)}
                          className="w-full px-3 py-1.5 text-base font-mushaf rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Kategori Tajwid
                        </label>
                        <select
                          value={editNewCategory}
                          onChange={(e) => {
                            setEditNewCategory(e.target.value);
                            setEditNewSubcategory('');
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="">-- Pilih Kategori --</option>
                          {(tajwidCategories || []).map((cat: any) => (
                            <option key={cat.id || cat.nama} value={cat.nama}>
                              {cat.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Subkategori jika ada */}
                    {editNewCategory && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Subkategori / Huruf (Opsional)
                        </label>
                        {(() => {
                          const selCat = (tajwidCategories || []).find((c: any) => c.nama === editNewCategory);
                          const subList = (selCat as any)?.subcategories || (selCat as any)?.subkategori || [];
                          if (Array.isArray(subList) && subList.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                                {subList.map((sub: any) => {
                                  const subName = typeof sub === 'string' ? sub : (sub.nama || sub.label || '');
                                  const isSel = editNewSubcategory === subName;
                                  return (
                                    <button
                                      key={subName}
                                      type="button"
                                      onClick={() => setEditNewSubcategory(isSel ? '' : subName)}
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                                        isSel
                                          ? 'bg-amber-600 text-white border-amber-600'
                                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                      }`}
                                    >
                                      {subName}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          }
                          return (
                            <input
                              type="text"
                              placeholder="Contoh: Memantulkan huruf / Qalqalah"
                              value={editNewSubcategory}
                              onChange={(e) => setEditNewSubcategory(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            />
                          );
                        })()}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Catatan Kesalahan / Saran Perbaikan
                      </label>
                      <input
                        type="text"
                        placeholder="Misal: Huruf sin terbaca mantul, alirkan sifat shafir..."
                        value={editNewComment}
                        onChange={(e) => setEditNewComment(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditAddingCorrection(false)}
                        className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={!editNewWord.trim()}
                        onClick={() => {
                          if (!editNewWord.trim()) return;
                          const newCommentItem = {
                            id: `com-${Date.now()}`,
                            target: editNewWord.trim(),
                            category: editNewCategory || 'Tajwid',
                            subcategory: editNewSubcategory || '',
                            comment: editNewComment || (editNewCategory ? `Koreksi ${editNewCategory}` : 'Koreksi bacaan'),
                            info: `Koreksi Manual: ${editNewWord.trim()}`
                          };
                          const updatedComments = [...(editingSetoranObj.interactiveComments || []), newCommentItem];
                          setEditingSetoranObj({ ...editingSetoranObj, interactiveComments: updatedComments });
                          setEditNewWord('');
                          setEditNewCategory('');
                          setEditNewSubcategory('');
                          setEditNewComment('');
                          setIsEditAddingCorrection(false);
                        }}
                        className="px-3.5 py-1 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition cursor-pointer"
                      >
                        Tambahkan Koreksi
                      </button>
                    </div>
                  </div>
                )}

                {/* List Koreksi yang ada */}
                {(!editingSetoranObj.interactiveComments || editingSetoranObj.interactiveComments.length === 0) ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 text-center">
                    <p className="text-xs text-slate-400">Tidak ada catatan kesalahan perkata pada setoran ini (bacaan lancar/bersih).</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {editingSetoranObj.interactiveComments.map((com, idx) => (
                      <div
                        key={com.id || idx}
                        className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mushaf text-lg text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                              {com.target}
                            </span>
                            {com.category && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-md">
                                {com.category}
                              </span>
                            )}
                            {com.subcategory && (
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-md">
                                {com.subcategory}
                              </span>
                            )}
                          </div>
                          {com.comment && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 pl-1">
                              {com.comment}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedComments = (editingSetoranObj.interactiveComments || []).filter((_, i) => i !== idx);
                            setEditingSetoranObj({ ...editingSetoranObj, interactiveComments: updatedComments });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition cursor-pointer"
                          title="Hapus koreksi perkata ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catatan Guru (Naratif) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan Evaluasi Guru
                </label>
                <textarea
                  rows={3}
                  value={editingSetoranObj.catatanGuru || ''}
                  onChange={(e) => setEditingSetoranObj({ ...editingSetoranObj, catatanGuru: e.target.value })}
                  placeholder="Tuliskan evaluasi, saran perbaikan, atau apresiasi..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Nilai & Status Kelulusan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nilai / Predikat
                  </label>
                  <input
                    type="text"
                    value={editingSetoranObj.nilai || ''}
                    onChange={(e) => setEditingSetoranObj({ ...editingSetoranObj, nilai: e.target.value })}
                    placeholder="Contoh: Mumtaz / Jayyid / 90"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status Kelulusan
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSetoranObj({ ...editingSetoranObj, statusLulus: true, kesimpulanHasilKelulusan: 'Lulus' })}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        editingSetoranObj.statusLulus
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>LULUS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSetoranObj({ ...editingSetoranObj, statusLulus: false, kesimpulanHasilKelulusan: 'Belum Lulus' })}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        !editingSetoranObj.statusLulus
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>MENGULANG</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingSetoranObj(null);
                  setIsEditAddingCorrection(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSavingEditSetoran}
                onClick={async () => {
                  if (!editingSetoranObj) return;
                  setIsSavingEditSetoran(true);
                  try {
                    await updateSetoran(editingSetoranObj.id, editingSetoranObj);
                    if (addLog) {
                      addLog('Koreksi Setoran', `Memperbarui setoran santri ${editingSetoranObj.siswaNama} (Tanggal: ${editingSetoranObj.tanggalSetoran})`);
                    }
                    setEditingSetoranObj(null);
                    setIsEditAddingCorrection(false);
                  } catch (err) {
                    console.error('Error saving edited setoran:', err);
                  } finally {
                    setIsSavingEditSetoran(false);
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingEditSetoran ? 'Menyimpan...' : 'Simpan Perubahan Setoran'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PANDUAN STANDAR PENILAIAN RESMI */}
      {isPanduanModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Pedoman Standar Penilaian Resmi</h3>
                  <p className="text-[10px] text-slate-500">Panduan asesmen kerapatan kesalahan (Error Density) &amp; kalkulator simulasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPanduanModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
              <StandarPenilaianDokumen isModal={true} onClose={() => setIsPanduanModalOpen(false)} defaultTab="ringkasan" initialElemenId={setoranElemen} />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Setoran */}
      {confirmDeleteSetoran && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Konfirmasi Hapus Setoran
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data catatan setoran untuk santri <strong className="text-slate-800 dark:text-slate-100">"{confirmDeleteSetoran.sname}"</strong>? Data nilai dan riwayat setoran ini akan dihapus dari sistem.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteSetoran(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteSetoran}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                Ya, Hapus Setoran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
