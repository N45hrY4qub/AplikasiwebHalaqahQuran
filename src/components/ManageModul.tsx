/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RichTextEditor } from './RichTextEditor';
import { TipeModul, Modul, AyatModul, CustomPageLine, UserRole } from '../types';
import { getQuranDefaultJuz } from '../lib/quranJuzHelper';
import { getQuranDefaultPage } from '../lib/quranPageHelper';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { getGoogleAccessToken, signInWithGoogleWorkspace } from './GoogleWorkspace';
import { resolveYayasanDisplayName } from '../utils/brandingHelper';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Edit3,
  Layers, 
  Check, 
  Eye, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle, 
  UploadCloud, 
  Languages, 
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Type,
  FileImage,
  Sparkles,
  File,
  FileCode,
  ShieldAlert,
  ListOrdered,
  AlignLeft,
  Table,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowDown,
  Download,
  FileJson,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  FolderUp,
  HardDriveDownload,
  RefreshCw,
  Bookmark,
  Cloud,
  Folder,
  FolderPlus,
  FolderOpen,
  Users,
  FileSpreadsheet,
  Save
} from 'lucide-react';
import { NonQuranFont } from '../types';

const SURAH_LIST = [
  { no: 1, nama: "Al-Fatihah" },
  { no: 2, nama: "Al-Baqarah" },
  { no: 3, nama: "Ali 'Imran" },
  { no: 4, nama: "An-Nisa'" },
  { no: 5, nama: "Al-Ma'idah" },
  { no: 6, nama: "Al-An'am" },
  { no: 7, nama: "Al-A'raf" },
  { no: 8, nama: "Al-Anfal" },
  { no: 9, nama: "At-Taubah" },
  { no: 10, nama: "Yunus" },
  { no: 11, nama: "Hud" },
  { no: 12, nama: "Yusuf" },
  { no: 13, nama: "Ar-Ra'd" },
  { no: 14, nama: "Ibrahim" },
  { no: 15, nama: "Al-Hijr" },
  { no: 16, nama: "An-Nahl" },
  { no: 17, nama: "Al-Isra'" },
  { no: 18, nama: "Al-Kahf" },
  { no: 19, nama: "Maryam" },
  { no: 20, nama: "Taha" },
  { no: 21, nama: "Al-Anbiya'" },
  { no: 22, nama: "Al-Hajj" },
  { no: 23, nama: "Al-Mu'minun" },
  { no: 24, nama: "An-Nur" },
  { no: 25, nama: "Al-Furqan" },
  { no: 26, nama: "Asy-Syu'ara'" },
  { no: 27, nama: "An-Naml" },
  { no: 28, nama: "Al-Qasas" },
  { no: 29, nama: "Al-'Ankabut" },
  { no: 30, nama: "Ar-Rum" },
  { no: 31, nama: "Luqman" },
  { no: 32, nama: "As-Sajdah" },
  { no: 33, nama: "Al-Ahzab" },
  { no: 34, nama: "Saba'" },
  { no: 35, nama: "Fatir" },
  { no: 36, nama: "Yasin" },
  { no: 37, nama: "As-Saffat" },
  { no: 38, nama: "Sad" },
  { no: 39, nama: "Az-Zumar" },
  { no: 40, nama: "Ghafir" },
  { no: 41, nama: "Fussilat" },
  { no: 42, nama: "Asy-Syura" },
  { no: 43, nama: "Az-Zukhruf" },
  { no: 44, nama: "Ad-Dukhan" },
  { no: 45, nama: "Al-Jasiyah" },
  { no: 46, nama: "Al-Ahqaf" },
  { no: 47, nama: "Muhammad" },
  { no: 48, nama: "Al-Fath" },
  { no: 49, nama: "Al-Hujurat" },
  { no: 50, nama: "Qaf" },
  { no: 51, nama: "Adz-Dzariyat" },
  { no: 52, nama: "At-Tur" },
  { no: 53, nama: "An-Najm" },
  { no: 54, nama: "Al-Qamar" },
  { no: 55, nama: "Ar-Rahman" },
  { no: 56, nama: "Al-Waqi'ah" },
  { no: 57, nama: "Al-Hadid" },
  { no: 58, nama: "Al-Mujadilah" },
  { no: 59, nama: "Al-Hasyr" },
  { no: 60, nama: "Al-Mumtahanah" },
  { no: 61, nama: "As-Saff" },
  { no: 62, nama: "Al-Jumu'ah" },
  { no: 63, nama: "Al-Munafiqun" },
  { no: 64, nama: "At-Taghabun" },
  { no: 65, nama: "At-Talaq" },
  { no: 66, nama: "At-Tahrim" },
  { no: 67, nama: "Al-Mulk" },
  { no: 68, nama: "Al-Qalam" },
  { no: 69, nama: "Al-Haqqah" },
  { no: 70, nama: "Al-Ma'arij" },
  { no: 71, nama: "Nuh" },
  { no: 72, nama: "Al-Jinn" },
  { no: 73, nama: "Al-Muzzammil" },
  { no: 74, nama: "Al-Mudassir" },
  { no: 75, nama: "Al-Qiyamah" },
  { no: 76, nama: "Al-Insan" },
  { no: 77, nama: "Al-Mursalat" },
  { no: 78, nama: "An-Naba'" },
  { no: 79, nama: "An-Nazi'at" },
  { no: 80, nama: "'Abasa" },
  { no: 81, nama: "At-Takwir" },
  { no: 82, nama: "Al-Infitar" },
  { no: 83, nama: "Al-Mutaffifin" },
  { no: 84, nama: "Al-Insyiqaq" },
  { no: 85, nama: "Al-Buruj" },
  { no: 86, nama: "At-Tariq" },
  { no: 87, nama: "Al-A'la" },
  { no: 88, nama: "Al-Ghasyiyah" },
  { no: 89, nama: "Al-Fajr" },
  { no: 90, nama: "Al-Balad" },
  { no: 91, nama: "Asy-Syams" },
  { no: 92, nama: "Al-Lail" },
  { no: 93, nama: "Ad-Duha" },
  { no: 94, nama: "Asy-Syarh" },
  { no: 95, nama: "At-Tin" },
  { no: 96, nama: "Al-'Alaq" },
  { no: 97, nama: "Al-Qadr" },
  { no: 98, nama: "Al-Bayyinah" },
  { no: 99, nama: "Az-Zalzalah" },
  { no: 100, nama: "Al-'Adiyat" },
  { no: 101, nama: "Al-Qari'ah" },
  { no: 102, nama: "At-Takasur" },
  { no: 103, nama: "Al-'Asr" },
  { no: 104, nama: "Al-Humazah" },
  { no: 105, nama: "Al-Fil" },
  { no: 106, nama: "Quraisy" },
  { no: 107, nama: "Al-Ma'un" },
  { no: 108, nama: "Al-Kausar" },
  { no: 109, nama: "Al-Kafirun" },
  { no: 110, nama: "An-Nasr" },
  { no: 111, nama: "Al-Lahab" },
  { no: 112, nama: "Al-Ikhlas" },
  { no: 113, nama: "Al-Falaq" },
  { no: 114, nama: "An-Nas" }
];

const convertToArabicNumerals = (num: number): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map(digit => {
      const charCode = digit.charCodeAt(0);
      if (charCode >= 48 && charCode <= 57) {
        return arabicDigits[charCode - 48];
      }
      return digit;
    })
    .join('');
};

const formatArabicFontClean = (text: string): string => {
  if (!text) return '';
  // Let's trim whitespace and any invisible control characters like \r, \u200F (RLM), \u200E (LRM)
  return text.replace(/[\s\r\n\u200B\u200C\u200D\u200E\u200F]+$/, '').trim();
};

const GOOGLE_FONTS_PRESETS = {
  arab: [
    { name: 'Amiri Quran', desc: 'Font resmi Al-Quran Rasm Utsmani dengan harakat & tanda waqaf lengkap' },
    { name: 'Amiri', desc: 'Sangat cocok untuk hadits dan teks klasik Arab (Naskh)' },
    { name: 'Noto Naskh Arabic', desc: 'Font modern standar Google, sangat jelas dibaca' },
    { name: 'Cairo', desc: 'Sans-serif Arab modern, tebal & gagah untuk judul/heading' },
    { name: 'Tajawal', desc: 'Sangat ramping, elegan, ramah di media baca digital' },
    { name: 'Scheherazade New', desc: 'Rancangan tradisional yang anggun, baik untuk bacaan panjang' },
    { name: 'Lateef', desc: 'Indah, bergaya tulisan sambung/kursif halus' },
    { name: 'Almarai', desc: 'Sempurna untuk nuansa formal korporat atau buku pelajaran' },
    { name: 'El Messiri', desc: 'Menawan dengan sentuhan semi-kufik artistik' },
    { name: 'Reem Kufi', desc: 'Tipografi gaya kufik modern yang kaku namun berestetika' },
    { name: 'Aref Ruqaa', desc: 'Karya seni kaligrafi gaya Ruqah klasik' }
  ],
  latin: [
    { name: 'Inter', desc: 'Sangat serbaguna, bersih, minimalis ultra-modern' },
    { name: 'Roboto', desc: 'Populer untuk interface Android, tingkat kejelasan sangat tinggi' },
    { name: 'Poppins', desc: 'Geometris bulat, berjiwa muda dan trendi' },
    { name: 'Montserrat', desc: 'Elegan, bertenaga, sangat pas untuk aksen visual' },
    { name: 'Playfair Display', desc: 'Sangat anggun dengan kontras serif megah, cocok untuk bab utama' },
    { name: 'Lora', desc: 'Serif kontemporer, empuk di mata untuk membaca teks panjang' },
    { name: 'Merriweather', desc: 'Format serif kokoh, dirancang khusus keterbacaan tinggi di layar' },
    { name: 'Oswald', desc: 'Gaya ramping tegak lurus, memberikan kesan kokoh' },
    { name: 'Raleway', desc: 'Sains-serif artistik dengan lengkungan tipis berkelas' },
    { name: 'Open Sans', desc: 'Nyaman di mata, netral, ramah penggunaan harian' }
  ]
};

function getGoogleDocPreviewUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/document/d/${match[1]}/preview?headers=false`;
  }
  return '';
}

function getGoogleSlidePreviewUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
  }
  return '';
}

export const ManageModul: React.FC = () => {
  const { 
    currentSession, 
    moduls, 
    createModul, 
    updateModul, 
    deleteModul,
    typography,
    saveTypography,
    modulCategories,
    saveModulCategories,
    quranLinesConfig,
    saveQuranLinesConfig,
    nonQuranFonts,
    saveNonQuranFonts,
    strukturLembaga
  } = useApp();

  const user = currentSession.user;
  const isWritable = user?.role === 'Admin';

  // Filters
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'All' | TipeModul>('All');
  const [searchModulQuery, setSearchModulQuery] = useState('');
  const [editingModulId, setEditingModulId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  // Quran Mushaf Line Configuration Modal States
  const [isQuranLinesModalOpen, setIsQuranLinesModalOpen] = useState(false);
  const [quranModalDefaultLines, setQuranModalDefaultLines] = useState<number | ''>(15);
  const [quranModalCustomLines, setQuranModalCustomLines] = useState<CustomPageLine[]>([]);
  const [newQuranExPage, setNewQuranExPage] = useState<number | ''>('');
  const [newQuranExLines, setNewQuranExLines] = useState<number | ''>('');

  // Backup & Restore Quran Modules Modal States
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    version?: string;
    exportDateFormatted?: string;
    summary: {
      totalSurah: number;
      totalAyat: number;
      surahList: { no: number; nama: string; ayatCount: number }[];
    };
    newSurahs: { no: number; nama: string; ayatCount: number }[];
    existingSurahs: { no: number; nama: string; ayatCount: number; currentAyatCount: number }[];
    modulsToRestore: Omit<Modul, 'id'>[];
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ current: number; total: number; currentSurah: string } | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('');
  const fileInputRestoreRef = useRef<HTMLInputElement>(null);
  const [restoreSourceTab, setRestoreSourceTab] = useState<'local' | 'drive'>('local');
  const [restoreFileInfo, setRestoreFileInfo] = useState<{ name: string; size?: number; source: 'local' | 'drive' } | null>(null);
  const [isDriveRestoreLoading, setIsDriveRestoreLoading] = useState(false);
  const [driveJsonFiles, setDriveJsonFiles] = useState<Array<{ id: string; name: string; size?: string; modifiedTime?: string; mimeType?: string }>>([]);
  const [driveRestoreSearchTerm, setDriveRestoreSearchTerm] = useState('');
  const [driveRestoreCurrentFolder, setDriveRestoreCurrentFolder] = useState<string>('root');
  const [driveRestoreFolderPath, setDriveRestoreFolderPath] = useState<Array<{ id: string; name: string }>>([{ id: 'root', name: 'Drive Saya' }]);
  const [driveRestoreSubFolders, setDriveRestoreSubFolders] = useState<Array<{ id: string; name: string }>>([]);

  // Unduh Ke Perangkat & Simpan ke Google Drive States for Modul Al-Qur'an
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const [isDriveDropdownOpen, setIsDriveDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);
  const [driveAuthPrompt, setDriveAuthPrompt] = useState<{ fileName: string; type: 'JSON' | 'Excel' | 'PDF' } | null>(null);
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

  // Sync Quran Lines Modal from context whenever opened or updated
  useEffect(() => {
    setQuranModalDefaultLines(quranLinesConfig?.defaultLinesPerPage || 15);
    setQuranModalCustomLines(quranLinesConfig?.customPageLines || [
      { page: 1, lines: 7 },
      { page: 2, lines: 7 }
    ]);
  }, [quranLinesConfig, isQuranLinesModalOpen]);

  // Selected preview modular
  const [previewModul, setPreviewModul] = useState<Modul | null>(null);
  const [previewPageIdx, setPreviewPageIdx] = useState(0); // for slides
  const [previewJilidIdx, setPreviewJilidIdx] = useState(0); // for jilid (volume)
  const [previewJuzFilter, setPreviewJuzFilter] = useState<'All' | number>('All');

  useEffect(() => {
    setPreviewJuzFilter('All');
  }, [previewModul]);

  // Creater state modal
  const [isNewModulOpen, setIsNewModulOpen] = useState(false);
  const [newModulTipe, setNewModulTipe] = useState<TipeModul>(TipeModul.AL_QURAN);

  // Track last active/edited module ID for smart scroll-restoration
  const [lastActiveModulId, setLastActiveModulId] = useState<string | null>(null);
  const [highlightedModulId, setHighlightedModulId] = useState<string | null>(null);
  const navigateNextAfterSaveRef = React.useRef(false);

  // Auto-scroll to last active/edited module when returning to module list
  useEffect(() => {
    if (!isNewModulOpen && lastActiveModulId) {
      const scrollToModulCard = () => {
        const element = document.getElementById(`modul-card-${lastActiveModulId}`);
        const container = document.getElementById('pustaka-materi-scroll-container');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const elemRect = element.getBoundingClientRect();
            const offset = (elemRect.top - containerRect.top) - (container.clientHeight / 2) + (element.clientHeight / 2);
            container.scrollBy({ top: offset, behavior: 'smooth' });
          }
        }
      };

      const timer1 = setTimeout(scrollToModulCard, 80);
      const timer2 = setTimeout(scrollToModulCard, 300);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isNewModulOpen, lastActiveModulId]);

  // Flash highlight effect timeout
  useEffect(() => {
    if (highlightedModulId) {
      const timer = setTimeout(() => {
        setHighlightedModulId(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightedModulId]);

  // Typography Configurator backed by AppContext
  const selectedFontPreset = typography.selectedFontPreset;
  const customFont = typography.customFont;
  const ornamentStyle = typography.ornamentStyle;
  const applyFontGlobally = typography.applyFontGlobally;

  const setSelectedFontPreset = (val: string) => {
    saveTypography({ selectedFontPreset: val });
  };
  const setCustomFont = (val: any) => {
    saveTypography({ customFont: val });
  };
  const setOrnamentStyle = (val: 'bracket' | 'flower' | 'square' | 'circle') => {
    saveTypography({ ornamentStyle: val });
  };
  const setApplyFontGlobally = (val: boolean) => {
    saveTypography({ applyFontGlobally: val });
  };

  // Rujukan Mushaf preset options
  const MUSHAF_PRESETS = [
    "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris Rasm Utsmani)",
    "Mushaf Standar Indonesia (Kemenag RI - Rasm Usmani)",
    "Mushaf Bahriyyah / Sudani (14 / 16 Baris)",
    "Mushaf Pojok Menara Kudus (18 Baris)",
    "Mushaf Bombay / Sub-benua India",
    "Kustom / Rujukan Lainnya..."
  ];

  // Form states for Quran creation
  const [quranForm, setQuranForm] = useState({
    namaSurat: '',
    nomorUrutSurat: '',
    jumlahAyat: 4,
    rawAyatArabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ\nاللَّهُ الصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ'
  });

  // State for search surah by number or name in modal
  const [surahSearchQuery, setSurahSearchQuery] = useState('');
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);
  const [detectedExistingModul, setDetectedExistingModul] = useState<Modul | null>(null);
  const surahDropdownRef = useRef<HTMLDivElement>(null);

  // Close surah dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (surahDropdownRef.current && !surahDropdownRef.current.contains(e.target as Node)) {
        setIsSurahDropdownOpen(false);
      }
    };
    if (isSurahDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSurahDropdownOpen]);

  // Filter surahs by number or name (fuzzy / smart search)
  const filteredSurahList = useMemo(() => {
    if (!surahSearchQuery.trim()) return SURAH_LIST;
    const q = surahSearchQuery.trim().toLowerCase();
    const cleanQ = q.replace(/['`\-_\s]/g, '');

    // Smart shortcut keywords
    if (cleanQ === 'juz30' || cleanQ === '30juz') {
      return SURAH_LIST.filter(s => s.no >= 78 && s.no <= 114);
    }
    if (cleanQ === 'juz29' || cleanQ === '29juz') {
      return SURAH_LIST.filter(s => s.no >= 67 && s.no <= 77);
    }
    if (cleanQ === 'juz1' || cleanQ === '1juz') {
      return SURAH_LIST.filter(s => s.no === 1 || s.no === 2);
    }

    return SURAH_LIST.filter(s => {
      // 1. Direct number match
      if (s.no.toString() === q || s.no.toString().startsWith(q)) return true;
      // 2. Name search with substring or cleaned characters
      const nameLower = s.nama.toLowerCase();
      if (nameLower.includes(q)) return true;
      const cleanName = nameLower.replace(/['`\-_\s]/g, '');
      if (cleanName.includes(cleanQ)) return true;
      return false;
    });
  }, [surahSearchQuery]);

  const [quranRujukanMushaf, setQuranRujukanMushaf] = useState<string>("Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris Rasm Utsmani)");
  const [customRujukanInput, setCustomRujukanInput] = useState<string>('');
  const [quranTranslations, setQuranTranslations] = useState<string[]>([]);
  const [quranJuzs, setQuranJuzs] = useState<number[]>([]);
  const [quranPages, setQuranPages] = useState<number[]>([]);
  const [quranLines, setQuranLines] = useState<(number | '')[]>([]);
  const [quranEndLines, setQuranEndLines] = useState<(number | '')[]>([]);
  const [translationInputMethod, setTranslationInputMethod] = useState<'single' | 'table' | 'bulk'>('single');

  // Bulk Juz range assigner states
  const [bulkJuzStart, setBulkJuzStart] = useState<string>('1');
  const [bulkJuzEnd, setBulkJuzEnd] = useState<string>('');
  const [bulkJuzValue, setBulkJuzValue] = useState<number>(30);

  // Bulk Page range assigner states
  const [bulkPageStart, setBulkPageStart] = useState<string>('1');
  const [bulkPageEnd, setBulkPageEnd] = useState<string>('');
  const [bulkPageValue, setBulkPageValue] = useState<number>(1);

  // Bulk Line range assigner states
  const [bulkLineStart, setBulkLineStart] = useState<string>('1');
  const [bulkLineEnd, setBulkLineEnd] = useState<string>('');
  const [bulkLineValue, setBulkLineValue] = useState<number>(1);
  const [bulkLineEndValue, setBulkLineEndValue] = useState<number>(15);
  const [bulkLineMode, setBulkLineMode] = useState<'sequential' | 'fixed' | 'range' | 'full_page' | 'clear'>('sequential');
  const [filterVerseLineStatus, setFilterVerseLineStatus] = useState<'all' | 'configured' | 'pending'>('all');

  // Auto assign sequential lines (1, 2, 3...) per page
  const handleAutoAssignLines = () => {
    const lines = quranForm.rawAyatArabic.split('\n');
    const newLines: (number | '')[] = [];
    const newEndLines: (number | '')[] = [];
    let currentLineOnPage = 1;
    let lastPage = quranPages[0] || 1;

    for (let i = 0; i < lines.length; i++) {
      const page = quranPages[i] || 1;
      if (i > 0 && page !== lastPage) {
        currentLineOnPage = 1;
        lastPage = page;
      }
      newLines.push(currentLineOnPage);
      newEndLines.push('');
      currentLineOnPage++;
    }
    setQuranLines(newLines);
    setQuranEndLines(newEndLines);
  };

  // Reset/Kosongkan baris semua ayat
  const handleClearAllLines = () => {
    const totalLines = quranForm.rawAyatArabic.split('\n').length;
    setQuranLines(Array(totalLines).fill(''));
    setQuranEndLines(Array(totalLines).fill(''));
  };

  // Set 1 Halaman Penuh (1 s/d 15 baris) for specified range or all
  const handleSetFullPageForRange = (startIdx: number, endIdx: number) => {
    const totalLines = quranForm.rawAyatArabic.split('\n').length;
    const s = Math.max(0, startIdx);
    const e = Math.min(totalLines - 1, endIdx);
    setQuranLines(prev => {
      const copy = [...prev];
      for (let i = s; i <= e; i++) {
        copy[i] = 1;
      }
      return copy;
    });
    setQuranEndLines(prev => {
      const copy = [...prev];
      for (let i = s; i <= e; i++) {
        copy[i] = 15;
      }
      return copy;
    });
  };

  // Apply bulk lines
  const handleApplyBulkLines = () => {
    const startNum = Number(bulkLineStart) || 1;
    const totalLines = quranForm.rawAyatArabic.split('\n').length;
    const endNum = Number(bulkLineEnd) || totalLines;
    if (startNum < 1 || endNum < startNum || startNum > totalLines) {
      alert(`Rentang ayat tidak valid. Harus antara 1 s/d ${totalLines}`);
      return;
    }
    setQuranLines(prev => {
      const copy = [...prev];
      let lineCounter = bulkLineValue;
      for (let i = startNum - 1; i < Math.min(endNum, totalLines); i++) {
        if (bulkLineMode === 'sequential') {
          copy[i] = lineCounter;
          lineCounter++;
        } else if (bulkLineMode === 'full_page') {
          copy[i] = 1;
        } else if (bulkLineMode === 'clear') {
          copy[i] = '';
        } else {
          copy[i] = bulkLineValue;
        }
      }
      return copy;
    });

    setQuranEndLines(prev => {
      const copy = [...prev];
      for (let i = startNum - 1; i < Math.min(endNum, totalLines); i++) {
        if (bulkLineMode === 'full_page') {
          copy[i] = 15;
        } else if (bulkLineMode === 'range') {
          copy[i] = bulkLineEndValue;
        } else {
          copy[i] = '';
        }
      }
      return copy;
    });
  };

  // Helper tracking verse configuration status for Quran
  const verseLineEntries = React.useMemo(() => {
    const lines = quranForm.rawAyatArabic.split('\n');
    return lines.map((text, idx) => {
      const rawStart = quranLines[idx];
      const isConfigured = rawStart !== undefined && rawStart !== '' && !isNaN(Number(rawStart));
      const startLine = isConfigured ? Number(rawStart) : null;
      const rawEnd = quranEndLines[idx];
      const hasEnd = rawEnd !== undefined && rawEnd !== '' && !isNaN(Number(rawEnd));
      const endLine = hasEnd ? Number(rawEnd) : null;
      const isMulti = startLine !== null && endLine !== null && endLine > startLine;
      const spanCount = isMulti ? (endLine - startLine + 1) : (startLine !== null ? 1 : 0);
      return {
        idx,
        text,
        isConfigured,
        startLine,
        endLine,
        isMulti,
        spanCount
      };
    });
  }, [quranForm.rawAyatArabic, quranLines, quranEndLines]);

  const totalVersesCount = verseLineEntries.length;
  const configuredVersesCount = verseLineEntries.filter(v => v.isConfigured).length;
  const pendingVersesCount = totalVersesCount - configuredVersesCount;
  const percentConfigured = totalVersesCount > 0 ? Math.round((configuredVersesCount / totalVersesCount) * 100) : 0;
  const firstPendingVerse = verseLineEntries.find(v => !v.isConfigured);

  const displayedVerseEntries = verseLineEntries.filter(v => {
    if (filterVerseLineStatus === 'configured') return v.isConfigured;
    if (filterVerseLineStatus === 'pending') return !v.isConfigured;
    return true;
  });

  const handleJumpToFirstPendingVerse = () => {
    const target = verseLineEntries.find(v => !v.isConfigured);
    if (target) {
      if (filterVerseLineStatus === 'configured') {
        setFilterVerseLineStatus('all');
      }
      setTimeout(() => {
        const rowEl = document.getElementById(`verse-row-${target.idx}`) || document.getElementById(`verse-card-${target.idx}`);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const inp = rowEl.querySelector('input[type="number"]') as HTMLInputElement | null;
          if (inp) inp.focus();
        }
      }, 80);
    }
  };

  // Sync translations & juz & pages & lines with rawAyatArabic lines
  useEffect(() => {
    const lines = quranForm.rawAyatArabic.split('\n');
    const sNo = Number(quranForm.nomorUrutSurat) || 112; // Al-Ikhlas as default fallback
    
    setQuranTranslations(prev => {
      const next = [...prev];
      if (next.length < lines.length) {
        for (let i = next.length; i < lines.length; i++) {
          next.push('');
        }
      } else if (next.length > lines.length) {
        next.splice(lines.length);
      }
      return next;
    });

    setQuranJuzs(prev => {
      const next = [...prev];
      if (next.length < lines.length) {
        for (let i = next.length; i < lines.length; i++) {
          next.push(getQuranDefaultJuz(sNo, i + 1));
        }
      } else if (next.length > lines.length) {
        next.splice(lines.length);
      }
      return next;
    });

    setQuranPages(prev => {
      const next = [...prev];
      if (next.length < lines.length) {
        for (let i = next.length; i < lines.length; i++) {
          next.push(getQuranDefaultPage(sNo, i + 1));
        }
      } else if (next.length > lines.length) {
        next.splice(lines.length);
      }
      return next;
    });

    setQuranLines(prev => {
      const next = [...prev];
      if (next.length < lines.length) {
        for (let i = next.length; i < lines.length; i++) {
          next.push('');
        }
      } else if (next.length > lines.length) {
        next.splice(lines.length);
      }
      return next;
    });

    setQuranEndLines(prev => {
      const next = [...prev];
      if (next.length < lines.length) {
        for (let i = next.length; i < lines.length; i++) {
          next.push('');
        }
      } else if (next.length > lines.length) {
        next.splice(lines.length);
      }
      return next;
    });
  }, [quranForm.rawAyatArabic, quranForm.nomorUrutSurat]);

  // Modul Categories list backed by AppContext
  const categories = modulCategories;
  const setCategories = (cats: string[] | ((prev: string[]) => string[])) => {
    if (typeof cats === 'function') {
      saveModulCategories(cats(modulCategories));
    } else {
      saveModulCategories(cats);
    }
  };

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showManageCategories, setShowManageCategories] = useState(false);

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert('Kategori ini sudah terdaftar.');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    setNewCategoryInput('');
    setNonQuranForm(prev => ({ ...prev, kategoriModul: trimmed }));
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      alert('Harus menyisakan minimal satu kategori aktif.');
      return;
    }
    if (confirm(`Hapus kategori "${catToRemove}"? Modul lama dengan kategori ini tidak akan terhapus, tetapi pilihan ini akan dihapus dari daftar opsi.`)) {
      const updated = categories.filter(c => c !== catToRemove);
      setCategories(updated);
      if (nonQuranForm.kategoriModul === catToRemove) {
        setNonQuranForm(prev => ({ ...prev, kategoriModul: updated[0] || '' }));
      }
    }
  };

  // Form states for Non-Quran multi-jilid creation
  const [nonQuranForm, setNonQuranForm] = useState({
    judulModul: '',
    kategoriModul: 'Hadits',
    isiManual: 'Uraian bab ajar...',
    googleDocUrl: '',
    googleSlideUrl: '',
    penulisModul: '',
    penerbitModul: '',
    tahunTerbit: '',
    deskripsiIdentitas: ''
  });
  const [tipeMateri, setTipeMateri] = useState<'gambar' | 'teks' | 'google_doc_slide' | 'pdf' | 'hanya_identitas'>('gambar');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');
  const [formIsMultiJilid, setFormIsMultiJilid] = useState(false);
  const [formJumlahJilid, setFormJumlahJilid] = useState(2);
  const [formHalamanPerJilid, setFormHalamanPerJilid] = useState<number[]>([3, 3]);
  const [formHalamanGambarPerJilid, setFormHalamanGambarPerJilid] = useState<string[][]>([['', '', ''], ['', '', '']]);
  const [formPenjelasanHalamanPerJilid, setFormPenjelasanHalamanPerJilid] = useState<string[][]>([['', '', ''], ['', '', '']]);
  const [formTeksHalamanPerJilid, setFormTeksHalamanPerJilid] = useState<string[][]>([['', '', ''], ['', '', '']]);
  const [useJumlahBarisPerHalaman, setUseJumlahBarisPerHalaman] = useState(false);
  const [formDefaultLinesPerPage, setFormDefaultLinesPerPage] = useState<number | ''>(15);
  const [formCustomPageLines, setFormCustomPageLines] = useState<CustomPageLine[]>([]);
  const [newNonQuranExPage, setNewNonQuranExPage] = useState<number | ''>('');
  const [newNonQuranExLines, setNewNonQuranExLines] = useState<number | ''>('');
  const [newNonQuranExJilid, setNewNonQuranExJilid] = useState<number | ''>('');
  const [formJumlahBarisPerHalamanPerJilid, setFormJumlahBarisPerHalamanPerJilid] = useState<(number | null)[][]>([[null, null, null], [null, null, null]]);
  const [activeSetupJilidIdx, setActiveSetupJilidIdx] = useState(0);
  const [formCoverModul, setFormCoverModul] = useState<string>('');
  const [formCoverModulPerJilid, setFormCoverModulPerJilid] = useState<string[]>([]);

  const [formError, setFormError] = useState('');
  const [formAuthors, setFormAuthors] = useState<string[]>(['']);

  // Font synchronization is handled globally and reactively by App.tsx (custom-mushaf-font-sheet)
  // to avoid style sheet overwrites, layout reflow, and preview screen flickering.

  // Sync settings helper has been migrated to use real-time Firestore database inside AppContext.tsx
  useEffect(() => {
    // Left empty since saving is handled in setters directly
  }, [selectedFontPreset, customFont, ornamentStyle, applyFontGlobally, categories]);

  // Handle local font upload
  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Ukuran font terlalu besar (maksimal 1.5MB untuk menjamin kinerja yang lancar). Silakan unggah file font TTF/WOFF/WOFF2 yang lebih ringkas.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        setCustomFont({
          name: 'MajmaMalikFahd',
          url: base64Url,
          fileName: file.name
        });
        alert(`Berhasil mengunggah & menyinkronkan font "${file.name}" secara permanen ke seluruh pengguna!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearCustomFont = () => {
    setCustomFont(null);
  };

  const handleNonQuranFontUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'arab' | 'latin') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran font kustom Anda terlalu besar (maksimal 2MB).");
      return;
    }

    const rawName = file.name.split('.')[0];
    const defaultName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/[-_]/g, ' ');
    const fontName = prompt(`Masukkan nama tampilan untuk Font ${type === 'arab' ? 'Arab' : 'Latin'} ini:`, defaultName);
    
    if (!fontName || fontName.trim() === '') {
      alert('Nama font diperlukan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        const newFont = {
          id: 'nq-font-' + Date.now(),
          name: fontName.trim(),
          url: base64Url,
          fileName: file.name,
          type
        };
        const updated = [...(nonQuranFonts || []), newFont];
        await saveNonQuranFonts(updated);
        alert(`Berhasil mengunggah font kustom "${fontName}"!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveNonQuranFont = async (id: string) => {
    if (confirm('Hapus font kustom ini?')) {
      const updated = (nonQuranFonts || []).filter(f => f.id !== id);
      await saveNonQuranFonts(updated);
    }
  };

  const [showGoogleFontModal, setShowGoogleFontModal] = useState<'arab' | 'latin' | null>(null);
  const [customGoogleFontInput, setCustomGoogleFontInput] = useState('');
  const [searchGoogleFontQuery, setSearchGoogleFontQuery] = useState('');

  const handleAddGoogleFont = async (name: string, type: 'arab' | 'latin') => {
    if (!name || name.trim() === '') {
      alert('Nama font tidak boleh kosong.');
      return;
    }
    const cleanName = name.trim();
    
    // Check if food already exists
    const exists = (nonQuranFonts || []).some(
      (f) => f.name.toLowerCase() === cleanName.toLowerCase() && f.type === type
    );
    if (exists) {
      alert(`Font "${cleanName}" sudah terdaftar.`);
      return;
    }

    const newFont: NonQuranFont = {
      id: 'g-font-' + Date.now(),
      name: cleanName,
      type,
      url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName)}&display=swap`,
      fileName: cleanName,
      isGoogleFont: true
    };
    const updated = [...(nonQuranFonts || []), newFont];
    await saveNonQuranFonts(updated);
    alert(`Berhasil menambahkan Google Font "${cleanName}"!`);
  };

  // Convert number to customized bracket ornament
  const formatVerseNumber = (num: number, style: 'bracket' | 'flower' | 'square' | 'circle') => {
    switch (style) {
      case 'bracket':
        return `﴿${num}﴾`;
      case 'flower':
        return `${convertToArabicNumerals(num)}۝`;
      case 'square':
        return `[${num}]`;
      case 'circle':
        return `(${num})`;
      default:
        return `﴿${num}﴾`;
    }
  };

  // Handler for Multi-jilid setup changes
  const handleJumlahJilidChange = (val: number) => {
    const count = Math.max(1, Math.min(10, val));
    setFormJumlahJilid(count);
    
    // adjust formHalamanPerJilid list
    setFormHalamanPerJilid(prev => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) {
          copy.push(3); // default 3 pages
        }
      } else if (copy.length > count) {
        copy.splice(count);
      }
      return copy;
    });

    // adjust formHalamanGambarPerJilid list
    setFormHalamanGambarPerJilid(prev => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) {
          copy.push(['', '', '']);
        }
      } else if (copy.length > count) {
        copy.splice(count);
      }
      return copy;
    });

    // adjust formPenjelasanHalamanPerJilid list
    setFormPenjelasanHalamanPerJilid(prev => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) {
          copy.push(['', '', '']);
        }
      } else if (copy.length > count) {
        copy.splice(count);
      }
      return copy;
    });

    // adjust formTeksHalamanPerJilid list
    setFormTeksHalamanPerJilid(prev => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) {
          copy.push(['', '', '']);
        }
      } else if (copy.length > count) {
        copy.splice(count);
      }
      return copy;
    });

    // adjust formCoverModulPerJilid list
    setFormCoverModulPerJilid(prev => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) {
          copy.push('');
        }
      } else if (copy.length > count) {
        copy.splice(count);
      }
      return copy;
    });

    // adjust formJumlahBarisPerHalamanPerJilid list
    setFormJumlahBarisPerHalamanPerJilid(prev => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) {
          copy.push([null, null, null]);
        }
      } else if (copy.length > count) {
        copy.splice(count);
      }
      return copy;
    });

    if (activeSetupJilidIdx >= count) {
      setActiveSetupJilidIdx(count - 1);
    }
  };

  const handlePageCountChange = (jilidIdx: number, pageCount: number) => {
    const count = Math.max(1, Math.min(150, pageCount));
    
    // Adjust page count
    setFormHalamanPerJilid(prev => {
      const copy = [...prev];
      copy[jilidIdx] = count;
      return copy;
    });

    // Adjust specific image array mapping
    setFormHalamanGambarPerJilid(prev => {
      const copy = [...prev];
      const jStrList = copy[jilidIdx] ? [...copy[jilidIdx]] : [];
      if (jStrList.length < count) {
        while (jStrList.length < count) {
          jStrList.push('');
        }
      } else if (jStrList.length > count) {
        jStrList.splice(count);
      }
      copy[jilidIdx] = jStrList;
      return copy;
    });

    // Adjust specific explanation array mapping
    setFormPenjelasanHalamanPerJilid(prev => {
      const copy = [...prev];
      const jStrList = copy[jilidIdx] ? [...copy[jilidIdx]] : [];
      if (jStrList.length < count) {
        while (jStrList.length < count) {
          jStrList.push('');
        }
      } else if (jStrList.length > count) {
        jStrList.splice(count);
      }
      copy[jilidIdx] = jStrList;
      return copy;
    });

    // Adjust specific text content array mapping
    setFormTeksHalamanPerJilid(prev => {
      const copy = [...prev];
      const jStrList = copy[jilidIdx] ? [...copy[jilidIdx]] : [];
      if (jStrList.length < count) {
        while (jStrList.length < count) {
          jStrList.push('');
        }
      } else if (jStrList.length > count) {
        jStrList.splice(count);
      }
      copy[jilidIdx] = jStrList;
      return copy;
    });

    // Adjust specific line count array mapping
    setFormJumlahBarisPerHalamanPerJilid(prev => {
      const copy = [...prev];
      const jList = copy[jilidIdx] ? [...copy[jilidIdx]] : [];
      if (jList.length < count) {
        while (jList.length < count) {
          jList.push(null);
        }
      } else if (jList.length > count) {
        jList.splice(count);
      }
      copy[jilidIdx] = jList;
      return copy;
    });
  };

  const uuidPageImageUpload = (jilidIdx: number, pageIdx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalBase64 = e.target?.result as string;
      
      const img = new Image();
      img.src = originalBase64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 700;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.55);
          
          setFormHalamanGambarPerJilid(prev => {
            const copy = prev.map((arr, jIdx) => {
              if (jIdx !== jilidIdx) return arr;
              const newArr = [...arr];
              newArr[pageIdx] = compressedBase64;
              return newArr;
            });
            return copy;
          });
        } else {
          // Fallback if canvas context cannot be initialized
          setFormHalamanGambarPerJilid(prev => {
            const copy = prev.map((arr, jIdx) => {
              if (jIdx !== jilidIdx) return arr;
              const newArr = [...arr];
              newArr[pageIdx] = originalBase64;
              return newArr;
            });
            return copy;
          });
        }
      };

      img.onerror = () => {
        // Fallback on loading error
        setFormHalamanGambarPerJilid(prev => {
          const copy = prev.map((arr, jIdx) => {
            if (jIdx !== jilidIdx) return arr;
            const newArr = [...arr];
            newArr[pageIdx] = originalBase64;
            return newArr;
          });
          return copy;
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePageImg = (jilidIdx: number, pageIdx: number) => {
    setFormHalamanGambarPerJilid(prev => {
      const copy = prev.map((arr, jIdx) => {
        if (jIdx !== jilidIdx) return arr;
        const newArr = [...arr];
        newArr[pageIdx] = '';
        return newArr;
      });
      return copy;
    });
  };

  const handleOpenEditModul = (modul: Modul) => {
    setDetectedExistingModul(null);
    setEditingModulId(modul.id);
    setLastActiveModulId(modul.id);
    setHighlightedModulId(modul.id);
    setPreviewModul(modul);
    setNewModulTipe(modul.tipe);
    
    if (modul.tipe === TipeModul.AL_QURAN) {
      setQuranForm({
        namaSurat: modul.namaSurat || '',
        nomorUrutSurat: modul.nomorUrutSurat?.toString() || '',
        jumlahAyat: modul.jumlahAyat || 4,
        rawAyatArabic: modul.isiAyat?.map(a => a.teksArab).join('\n') || ''
      });
      const ruj = modul.rujukanMushaf || "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris Rasm Utsmani)";
      if (MUSHAF_PRESETS.includes(ruj)) {
        setQuranRujukanMushaf(ruj);
        setCustomRujukanInput('');
      } else {
        setQuranRujukanMushaf("Kustom / Rujukan Lainnya...");
        setCustomRujukanInput(ruj);
      }
      setQuranTranslations(modul.isiAyat?.map(a => a.terjemahan || '') || []);
      setQuranJuzs(modul.isiAyat?.map(a => a.juz || getQuranDefaultJuz(Number(modul.nomorUrutSurat), a.nomorAyat)) || []);
      setQuranPages(modul.isiAyat?.map(a => a.halaman || getQuranDefaultPage(Number(modul.nomorUrutSurat), a.nomorAyat)) || []);
      setQuranLines(modul.isiAyat?.map(a => (typeof a.baris === 'number' ? a.baris : '')) || []);
      setQuranEndLines(modul.isiAyat?.map(a => (typeof a.barisAkhir === 'number' ? a.barisAkhir : '')) || []);
      setFilterVerseLineStatus('all');
    } else {
      setNonQuranForm({
        judulModul: modul.judulModul || '',
        kategoriModul: modul.kategoriModul || 'Hadits',
        isiManual: modul.isiModulManual || '',
        googleDocUrl: modul.googleDocUrl || '',
        googleSlideUrl: modul.googleSlideUrl || '',
        penulisModul: modul.penulisModul || '',
        penerbitModul: modul.penerbitModul || '',
        tahunTerbit: modul.tahunTerbit || '',
        deskripsiIdentitas: modul.deskripsiIdentitas || ''
      });
      const authors = modul.penulisModul
        ? modul.penulisModul.split(';').map(a => a.trim()).filter(Boolean)
        : [];
      setFormAuthors(authors.length > 0 ? authors : ['']);
      setTipeMateri(modul.tipeMateri || 'gambar');
      setPdfFileName(modul.pdfFileName || '');
      setPdfBase64(modul.pdfBase64 || '');
      setFormIsMultiJilid(modul.isMultiJilid || false);
      setFormJumlahJilid(modul.jumlahJilid || 1);
      const pageCounts = modul.halamanPerJilid || [3];
      setFormHalamanPerJilid(pageCounts);
      setFormHalamanGambarPerJilid(modul.halamanGambarPerJilid || pageCounts.map(c => Array(c).fill('')));
      setFormPenjelasanHalamanPerJilid(modul.penjelasanHalamanPerJilid || pageCounts.map(c => Array(c).fill('')));
      setFormTeksHalamanPerJilid(modul.teksHalamanPerJilid || pageCounts.map(c => Array(c).fill('')));
      setFormCoverModul(modul.coverModul || '');
      setFormCoverModulPerJilid(modul.coverModulPerJilid || Array(modul.jumlahJilid || 1).fill(''));
      setUseJumlahBarisPerHalaman(modul.useJumlahBarisPerHalaman || false);
      setFormDefaultLinesPerPage(modul.defaultLinesPerPage ?? 15);
      setFormCustomPageLines(modul.customPageLines || []);
      setFormJumlahBarisPerHalamanPerJilid(modul.isMultiJilid 
        ? (modul.jumlahBarisPerHalamanPerJilid || pageCounts.map(c => Array(c).fill(null)))
        : [modul.jumlahBarisPerHalaman || Array(pageCounts[0] || 3).fill(null)]);
      setActiveSetupJilidIdx(0);
    }
    setFormError('');
    setIsNewModulOpen(true);
  };

  const handleCancelOrBack = () => {
    if (editingModulId) {
      setLastActiveModulId(editingModulId);
      setHighlightedModulId(editingModulId);
      const currentMod = moduls.find(m => m.id === editingModulId);
      if (currentMod) {
        setPreviewModul(currentMod);
        if (currentMod.tipe === TipeModul.AL_QURAN && activeCategoryFilter === TipeModul.NON_AL_QURAN) {
          setActiveCategoryFilter(TipeModul.AL_QURAN);
        }
      }
    }
    navigateNextAfterSaveRef.current = false;
    setIsNewModulOpen(false);
    setEditingModulId(null);
    setDetectedExistingModul(null);
  };

  // Handle surah selection from dropdown or manual number input
  const handleSelectSurah = (s: { no: number; nama: string }) => {
    // Check if this surah already exists in moduls
    const existingModul = moduls.find(
      m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === s.no
    );

    if (existingModul && existingModul.isiAyat && existingModul.isiAyat.length > 0) {
      // 1. Load existing verses, translations, juz, pages, lines, and mushaf reference
      setQuranForm({
        namaSurat: s.nama,
        nomorUrutSurat: s.no.toString(),
        jumlahAyat: existingModul.jumlahAyat || existingModul.isiAyat.length,
        rawAyatArabic: existingModul.isiAyat.map(a => a.teksArab).join('\n')
      });

      const ruj = existingModul.rujukanMushaf || "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris Rasm Utsmani)";
      if (MUSHAF_PRESETS.includes(ruj)) {
        setQuranRujukanMushaf(ruj);
        setCustomRujukanInput('');
      } else {
        setQuranRujukanMushaf("Kustom / Rujukan Lainnya...");
        setCustomRujukanInput(ruj);
      }

      setQuranTranslations(existingModul.isiAyat.map(a => a.terjemahan || ''));
      setQuranJuzs(existingModul.isiAyat.map(a => a.juz || getQuranDefaultJuz(s.no, a.nomorAyat)));
      setQuranPages(existingModul.isiAyat.map(a => a.halaman || getQuranDefaultPage(s.no, a.nomorAyat)));
      setQuranLines(existingModul.isiAyat.map(a => (typeof a.baris === 'number' ? a.baris : '')));
      setQuranEndLines(existingModul.isiAyat.map(a => (typeof a.barisAkhir === 'number' ? a.barisAkhir : '')));
      setFilterVerseLineStatus('all');

      // 2. Set detected existing module
      setDetectedExistingModul(existingModul);
    } else {
      // Surah has not been inputted or has no verses saved yet
      setQuranForm(prev => ({
        ...prev,
        namaSurat: s.nama,
        nomorUrutSurat: s.no.toString(),
        rawAyatArabic: ''
      }));
      setQuranTranslations([]);
      setQuranJuzs([]);
      setQuranPages([]);
      setQuranLines([]);
      setQuranEndLines([]);
      setDetectedExistingModul(null);
    }

    setSurahSearchQuery('');
    setIsSurahDropdownOpen(false);
  };

  // ====================================================
  // EXPORT & CADANGAN KURIKULUM AL-QUR'AN HELPERS
  // ====================================================

  // 1. Generate JSON Backup Data
  const generateQuranBackupData = () => {
    const quranModuls = moduls
      .filter(m => m.tipe === TipeModul.AL_QURAN)
      .sort((a, b) => (Number(a.nomorUrutSurat) || 0) - (Number(b.nomorUrutSurat) || 0));

    if (quranModuls.length === 0) {
      alert("Belum ada data modul Al-Qur'an yang tersimpan.");
      return null;
    }

    const totalAyat = quranModuls.reduce((acc, m) => acc + (m.isiAyat?.length || m.jumlahAyat || 0), 0);
    const surahList = quranModuls.map(m => ({
      no: Number(m.nomorUrutSurat) || 0,
      nama: m.namaSurat || '',
      ayatCount: m.isiAyat?.length || m.jumlahAyat || 0
    }));

    const cleanModuls = quranModuls.map(m => {
      const { id, ...rest } = m;
      return rest;
    });

    const backupPayload = {
      version: '1.0',
      app: 'Aplikasi Halaqah Quran',
      exportDate: new Date().toISOString(),
      exportDateFormatted: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: 'AL_QURAN_MODULES',
      summary: {
        totalSurah: quranModuls.length,
        totalAyat,
        surahList
      },
      moduls: cleanModuls
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `cadangan-modul-quran-${dateStr}`;
    return { blob, fileName, count: quranModuls.length, totalAyat };
  };

  // 2. Generate Excel (.xlsx) Workbook (Pilihan A: Multi-Sheet dengan Detail Teks Ayat)
  const generateQuranExcelWorkbook = () => {
    const quranModuls = moduls
      .filter(m => m.tipe === TipeModul.AL_QURAN)
      .sort((a, b) => (Number(a.nomorUrutSurat) || 0) - (Number(b.nomorUrutSurat) || 0));

    if (quranModuls.length === 0) {
      alert("Belum ada data modul Al-Qur'an yang tersimpan.");
      return null;
    }

    const totalAyat = quranModuls.reduce((acc, m) => acc + (m.isiAyat?.length || m.jumlahAyat || 0), 0);
    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const institutionTitle = resolveYayasanDisplayName(strukturLembaga?.yayasan?.nama).toUpperCase();
    // ==========================================
    // SHEET 1: REKAPITULASI KATALOG DAFTAR SURAT
    // ==========================================
    const rowsSheet1: any[][] = [
      [institutionTitle],
      ['DAFTAR REKAPITULASI KURIKULUM MODUL AL-QUR\'AN 30 JUZ'],
      [`Tanggal Ekspor: ${dateFormatted}`],
      [`Total Surat Terdaftar: ${quranModuls.length} Surat | Total Ayat: ${totalAyat} Ayat`],
      [],
      [
        'No.',
        'Nomor Surat',
        'Nama Surat',
        'Arti Surat / Terjemahan',
        'Golongan Surat',
        'Jumlah Ayat',
        'Juz Mulai',
        'Juz Selesai',
        'Halaman Mulai',
        'Halaman Selesai',
        'Standar Baris',
        'Rujukan Mushaf',
        'Status Modul'
      ]
    ];

    quranModuls.forEach((m, idx) => {
      const sNo = Number(m.nomorUrutSurat) || idx + 1;
      const tempatTurun = (m as any).tempatTurun || ([1, 2, 3, 4, 5, 8, 9, 22, 24, 33, 47, 48, 49, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98, 110].includes(sNo) ? 'Madaniyah' : 'Makkiyah');
      const ayatCount = m.isiAyat?.length || m.jumlahAyat || 0;
      const firstAyat = m.isiAyat?.[0];
      const lastAyat = m.isiAyat?.[m.isiAyat.length - 1];
      const juzAwal = firstAyat?.juz || getQuranDefaultJuz(sNo, 1);
      const juzAkhir = lastAyat?.juz || getQuranDefaultJuz(sNo, ayatCount || 1);
      const halAwal = firstAyat?.halaman || getQuranDefaultPage(sNo, 1);
      const halAkhir = lastAyat?.halaman || getQuranDefaultPage(sNo, ayatCount || 1);
      const namaSurat = m.namaSurat || SURAH_LIST.find(s => s.no === sNo)?.nama || `Surat No. ${sNo}`;
      const arti = m.deskripsiIdentitas || (m as any).artiSurat || '-';
      const rujukan = m.rujukanMushaf || "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris Rasm Utsmani)";

      rowsSheet1.push([
        idx + 1,
        sNo,
        namaSurat,
        arti,
        tempatTurun,
        ayatCount,
        juzAwal,
        juzAkhir,
        halAwal,
        halAkhir,
        m.defaultLinesPerPage ? `${m.defaultLinesPerPage} Baris` : '15 Baris',
        rujukan,
        'Aktif Terdaftar'
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(rowsSheet1);
    ws1['!cols'] = [
      { wch: 6 },  // No
      { wch: 14 }, // Nomor Surat
      { wch: 22 }, // Nama Surat
      { wch: 30 }, // Arti Surat
      { wch: 16 }, // Golongan
      { wch: 14 }, // Jumlah Ayat
      { wch: 12 }, // Juz Mulai
      { wch: 12 }, // Juz Selesai
      { wch: 14 }, // Halaman Mulai
      { wch: 14 }, // Halaman Selesai
      { wch: 16 }, // Standar Baris
      { wch: 45 }, // Rujukan Mushaf
      { wch: 16 }  // Status Modul
    ];

    // ==========================================
    // SHEET 2: DETAIL SELURUH TEKS AYAT & TERJEMAHAN
    // ==========================================
    const rowsSheet2: any[][] = [
      [institutionTitle],
      ['DETAIL TEKS AYAT, TERJEMAHAN & TATA LETAK MUSHAF AL-QUR\'AN 30 JUZ'],
      [`Tanggal Ekspor: ${dateFormatted}`],
      [`Total Ayat: ${totalAyat} Ayat dari ${quranModuls.length} Surat Terdaftar`],
      [],
      [
        'Nomor Surat',
        'Nama Surat',
        'Nomor Ayat',
        'Teks Arab',
        'Terjemahan / Arti',
        'Juz',
        'Halaman Mushaf',
        'Baris Mulai',
        'Baris Selesai'
      ]
    ];

    quranModuls.forEach((m, sIdx) => {
      const sNo = Number(m.nomorUrutSurat) || sIdx + 1;
      const namaSurat = m.namaSurat || SURAH_LIST.find(s => s.no === sNo)?.nama || `Surat No. ${sNo}`;

      if (m.isiAyat && m.isiAyat.length > 0) {
        m.isiAyat.forEach((ay, aIdx) => {
          const ayNo = ay.nomorAyat || aIdx + 1;
          const defaultJuz = getQuranDefaultJuz(sNo, ayNo);
          const defaultHal = getQuranDefaultPage(sNo, ayNo);
          const barisAwal = ay.baris !== undefined && ay.baris !== null ? ay.baris : ((ay as any).barisMulai || '');
          const barisAkhir = ay.barisAkhir !== undefined && ay.barisAkhir !== null ? ay.barisAkhir : ((ay as any).barisSelesai || '');

          rowsSheet2.push([
            sNo,
            namaSurat,
            ayNo,
            ay.teksArab || '',
            ay.terjemahan || '',
            ay.juz || defaultJuz,
            ay.halaman || defaultHal,
            barisAwal,
            barisAkhir
          ]);
        });
      } else if ((m as any).rawAyatArabic && (m as any).rawAyatArabic.trim()) {
        const lines = (m as any).rawAyatArabic.trim().split('\n');
        lines.forEach((lineText: string, aIdx: number) => {
          const ayNo = aIdx + 1;
          const defaultJuz = getQuranDefaultJuz(sNo, ayNo);
          const defaultHal = getQuranDefaultPage(sNo, ayNo);

          rowsSheet2.push([
            sNo,
            namaSurat,
            ayNo,
            lineText,
            '',
            defaultJuz,
            defaultHal,
            '',
            ''
          ]);
        });
      } else {
        const totalA = m.jumlahAyat || 0;
        for (let i = 1; i <= totalA; i++) {
          rowsSheet2.push([
            sNo,
            namaSurat,
            i,
            '',
            '',
            getQuranDefaultJuz(sNo, i),
            getQuranDefaultPage(sNo, i),
            '',
            ''
          ]);
        }
      }
    });

    const ws2 = XLSX.utils.aoa_to_sheet(rowsSheet2);
    ws2['!cols'] = [
      { wch: 14 }, // Nomor Surat
      { wch: 22 }, // Nama Surat
      { wch: 12 }, // Nomor Ayat
      { wch: 55 }, // Teks Arab
      { wch: 50 }, // Terjemahan / Arti
      { wch: 8 },  // Juz
      { wch: 16 }, // Halaman Mushaf
      { wch: 14 }, // Baris Mulai
      { wch: 14 }  // Baris Selesai
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Daftar Surat');
    XLSX.utils.book_append_sheet(wb, ws2, 'Detail Teks Ayat');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `cadangan-lengkap-kurikulum-quran-${dateStr}`;
    return { blob, fileName, count: quranModuls.length, wb };
  };

  // 3. Generate PDF (.pdf) Document
  const generateQuranPDFDocument = () => {
    const quranModuls = moduls
      .filter(m => m.tipe === TipeModul.AL_QURAN)
      .sort((a, b) => (Number(a.nomorUrutSurat) || 0) - (Number(b.nomorUrutSurat) || 0));

    if (quranModuls.length === 0) {
      alert("Belum ada data modul Al-Qur'an yang tersimpan.");
      return null;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 18;

    const institutionTitle = resolveYayasanDisplayName(strukturLembaga?.yayasan?.nama);
    // Header Kop
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(institutionTitle.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text('KURIKULUM & MODUL PEMBELAJARAN AL-QUR\'AN 30 JUZ', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const totalAyat = quranModuls.reduce((acc, m) => acc + (m.isiAyat?.length || m.jumlahAyat || 0), 0);
    doc.text(`Dicetak pada: ${dateFormatted} • Total: ${quranModuls.length} Surat Terdaftar (${totalAyat} Ayat)`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    // Separator line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 7;

    // Table Header
    const drawTableHeader = (y: number) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('NO', 16, y + 5);
      doc.text('SURAT', 26, y + 5);
      doc.text('ARTI / ASMA', 66, y + 5);
      doc.text('GOLONGAN', 108, y + 5);
      doc.text('AYAT', 134, y + 5);
      doc.text('JUZ', 150, y + 5);
      doc.text('HALAMAN', 168, y + 5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 7, pageWidth - 14, y + 7);
    };

    drawTableHeader(currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    quranModuls.forEach((m, idx) => {
      if (currentY > pageHeight - 18) {
        doc.addPage();
        currentY = 18;
        drawTableHeader(currentY);
        currentY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY - 3.5, pageWidth - 28, 5.5, 'F');
      }

      const sNo = Number(m.nomorUrutSurat) || idx + 1;
      const tempatTurun = [1, 2, 3, 4, 5, 8, 9, 22, 24, 33, 47, 48, 49, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98, 110].includes(sNo) ? 'Madaniyah' : 'Makkiyah';
      const ayatCount = m.isiAyat?.length || m.jumlahAyat || 0;
      const firstAyat = m.isiAyat?.[0];
      const lastAyat = m.isiAyat?.[m.isiAyat.length - 1];
      const juzAwal = firstAyat?.juz || getQuranDefaultJuz(sNo, 1);
      const juzAkhir = lastAyat?.juz || getQuranDefaultJuz(sNo, ayatCount || 1);
      const halAwal = firstAyat?.halaman || getQuranDefaultPage(sNo, 1);
      const halAkhir = lastAyat?.halaman || getQuranDefaultPage(sNo, ayatCount || 1);
      const namaSurat = m.namaSurat || SURAH_LIST.find(s => s.no === sNo)?.nama || `Surat No. ${sNo}`;
      const arti = m.deskripsiIdentitas || (m as any).artiSurat || '-';
      const truncatedArti = arti.length > 24 ? arti.substring(0, 22) + '...' : arti;
      const juzStr = juzAwal === juzAkhir ? `Juz ${juzAwal}` : `Juz ${juzAwal}-${juzAkhir}`;
      const halStr = halAwal === halAkhir ? `Hal ${halAwal}` : `Hal ${halAwal}-${halAkhir}`;

      doc.setTextColor(51, 65, 85);
      doc.text(String(sNo), 16, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(namaSurat, 26, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(truncatedArti, 66, currentY);
      doc.text(tempatTurun, 108, currentY);
      doc.text(`${ayatCount} Ayat`, 134, currentY);
      doc.text(juzStr, 150, currentY);
      doc.text(halStr, 168, currentY);

      currentY += 5.5;
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Halaman ${i} dari ${totalPages} • Modul Kurikulum Al-Qur'an ${institutionTitle}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `kurikulum-modul-quran-${dateStr}`;
    const blob = doc.output('blob');
    return { blob, fileName, count: quranModuls.length, doc };
  };

  // 4. Download Handler to Local Device (JSON, Excel, PDF)
  const handleDownloadQuranToDevice = (type: 'JSON' | 'Excel' | 'PDF') => {
    setIsExporting(true);
    try {
      if (type === 'JSON') {
        const result = generateQuranBackupData();
        if (!result) return;
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${result.fileName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (type === 'Excel') {
        const result = generateQuranExcelWorkbook();
        if (!result) return;
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${result.fileName}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (type === 'PDF') {
        const result = generateQuranPDFDocument();
        if (!result) return;
        result.doc.save(`${result.fileName}.pdf`);
      }
    } catch (err: any) {
      console.error('Error saat mengunduh berkas:', err);
      alert('Gagal mengunduh berkas: ' + (err?.message || 'Error'));
    } finally {
      setIsExporting(false);
    }
  };

  // 5. Connect Google Workspace and Save Handler
  const handleConnectDriveAndSave = async (fileName: string, type: 'JSON' | 'Excel' | 'PDF') => {
    try {
      const token = await signInWithGoogleWorkspace(currentSession?.user?.role || UserRole.ADMIN);
      if (token) {
        setDriveAuthPrompt(null);
        setTimeout(() => {
          saveQuranToGoogleDrive(type);
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Gagal menghubungkan Google Drive: ' + (err?.message || 'Error'));
      }
    }
  };

  // 6. Save Quran Data directly to Google Drive
  const saveQuranToGoogleDrive = async (type: 'JSON' | 'Excel' | 'PDF') => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const defaultName = type === 'JSON'
      ? `cadangan-modul-quran-${dateStr}`
      : type === 'Excel'
      ? `rekapitulasi-kurikulum-quran-${dateStr}`
      : `kurikulum-modul-quran-${dateStr}`;

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

      if (type === 'JSON') {
        const res = generateQuranBackupData();
        if (!res) return;
        fileBlob = res.blob;
        mimeType = 'application/json';
        extension = 'json';
      } else if (type === 'Excel') {
        const res = generateQuranExcelWorkbook();
        if (!res) return;
        fileBlob = res.blob;
        mimeType = 'application/vnd.google-apps.spreadsheet';
        extension = 'xlsx';
      } else {
        const res = generateQuranPDFDocument();
        if (!res) return;
        fileBlob = res.blob;
        mimeType = 'application/pdf';
        extension = 'pdf';
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

  // 7. Google Drive Folder Navigation Handlers
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

  const fetchSharedDrives = async () => {
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsFetchingSharedDrives(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/drives?pageSize=100', {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const newToken = await signInWithGoogleWorkspace(currentSession?.user?.role || UserRole.ADMIN);
      if (newToken) {
        fetchDriveFolders(currentFolderId || 'root', activeSharedDriveId || undefined);
        fetchSharedDrives();
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Gagal menghubungkan ulang akun Google: ' + (err?.message || 'Error'));
      }
    }
  };

  // 8. Execute Upload to Selected Google Drive Folder
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
        : `${driveSaveItem.defaultName}.${driveSaveItem.extension}`;

      const parents = currentFolderId && currentFolderId !== 'root' && currentFolderId !== 'shared_root' ? [currentFolderId] : undefined;

      // Case 1: Excel Conversion (.xlsx to native Google Sheet or XLSX)
      if (driveSaveItem.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const sheetName = finalName.replace(/\.xlsx$/i, '');
        const boundary = '-------HalaqahDriveMultipartSheet' + Date.now();
        const metadata = {
          name: sheetName,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          description: `Disimpan dari Kurikulum Modul Al-Qur'an oleh Admin`,
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

        // Fallback: 2-step direct Excel upload
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
              description: `Disimpan dari Kurikulum Modul Al-Qur'an oleh Admin`,
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

      // Case 2: JSON or PDF Upload
      const boundary = '-------HalaqahDriveMultipart' + Date.now();
      const metadata = {
        name: finalName,
        mimeType: driveSaveItem.mimeType,
        description: `Disimpan dari Kurikulum Modul Al-Qur'an oleh Admin`,
        ...(parents && { parents })
      };

      const multipartBody = new Blob([
        `--${boundary}\r\n`,
        'Content-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        `\r\n--${boundary}\r\n`,
        `Content-Type: ${driveSaveItem.mimeType}\r\n\r\n`,
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
        throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali.');
      }

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Gagal mengunggah berkas ke Google Drive');
      }

      alert(`Sukses! Berkas "${finalName}" berhasil disimpan ke Google Drive.`);
      setDriveSaveItem(null);
    } catch (err: any) {
      console.error('Error uploading to Google Drive:', err);
      alert('Gagal menyimpan file ke Google Drive: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setUploadingToDrive(null);
    }
  };

  // ====================================================
  // PARSE & RESTORE (LOCAL FILE & GOOGLE DRIVE)
  // ====================================================

  const processJsonContentForRestore = (text: string, fileName: string, fileSize?: number, source: 'local' | 'drive' = 'local') => {
    try {
      setRestoreError('');
      setRestoreSuccessMsg('');
      const parsed = JSON.parse(text);

      let list: any[] = [];
      let exportDateFormatted = '';
      let version = '1.0';

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.moduls)) {
        list = parsed.moduls;
        exportDateFormatted = parsed.exportDateFormatted || parsed.exportDate || '';
        version = parsed.version || '1.0';
      } else {
        throw new Error('Format berkas tidak sesuai. Berkas harus berupa format cadangan JSON resmi modul pembelajaran Al-Qur\'an.');
      }

      const quranList: Omit<Modul, 'id'>[] = list
        .filter(m => m && (m.tipe === TipeModul.AL_QURAN || (!m.tipe && (m.namaSurat || m.nomorUrutSurat))))
        .map(m => ({
          tipe: TipeModul.AL_QURAN,
          nomorUrutSurat: Number(m.nomorUrutSurat) || 0,
          namaSurat: (m.namaSurat || '').trim(),
          jumlahAyat: m.isiAyat?.length || m.jumlahAyat || 0,
          rujukanMushaf: m.rujukanMushaf || "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris Rasm Utsmani)",
          isiAyat: (m.isiAyat || []).map((a: any, aIdx: number) => ({
            nomorAyat: Number(a.nomorAyat) || aIdx + 1,
            teksArab: a.teksArab || '...',
            terjemahan: a.terjemahan || `Terjemahan ayat ke-${aIdx + 1}`,
            juz: Number(a.juz) || getQuranDefaultJuz(Number(m.nomorUrutSurat), aIdx + 1),
            halaman: Number(a.halaman) || getQuranDefaultPage(Number(m.nomorUrutSurat), aIdx + 1),
            baris: typeof a.baris === 'number' ? a.baris : undefined,
            barisAkhir: typeof a.barisAkhir === 'number' ? a.barisAkhir : undefined
          }))
        }));

      if (quranList.length === 0) {
        throw new Error('Tidak ditemukan data modul Al-Qur\'an yang valid di dalam berkas ini.');
      }

      quranList.sort((a, b) => (Number(a.nomorUrutSurat) || 0) - (Number(b.nomorUrutSurat) || 0));

      const totalAyat = quranList.reduce((acc, m) => acc + (m.isiAyat?.length || m.jumlahAyat || 0), 0);
      const surahList = quranList.map(m => ({
        no: Number(m.nomorUrutSurat),
        nama: m.namaSurat || `Surat No. ${m.nomorUrutSurat}`,
        ayatCount: m.isiAyat?.length || m.jumlahAyat || 0
      }));

      const existingQuranModuls = moduls.filter(m => m.tipe === TipeModul.AL_QURAN);
      const newSurahs: { no: number; nama: string; ayatCount: number }[] = [];
      const existingSurahs: { no: number; nama: string; ayatCount: number; currentAyatCount: number }[] = [];

      surahList.forEach(s => {
        const match = existingQuranModuls.find(ex => Number(ex.nomorUrutSurat) === s.no);
        if (match) {
          existingSurahs.push({
            ...s,
            currentAyatCount: match.isiAyat?.length || match.jumlahAyat || 0
          });
        } else {
          newSurahs.push(s);
        }
      });

      setRestoreFileInfo({
        name: fileName,
        size: fileSize,
        source
      });

      setRestorePreview({
        version,
        exportDateFormatted,
        summary: {
          totalSurah: quranList.length,
          totalAyat,
          surahList
        },
        newSurahs,
        existingSurahs,
        modulsToRestore: quranList
      });
    } catch (err: any) {
      setRestoreError(err.message || 'Gagal membaca berkas cadangan. Pastikan format berkas JSON valid.');
      setRestorePreview(null);
    }
  };

  // Parse and preview restore file from Excel (.xlsx/.xls) workbook (Pilihan A)
  const processExcelContentForRestore = (
    data: ArrayBuffer,
    fileName: string,
    fileSize?: number,
    source: 'local' | 'drive' = 'local'
  ) => {
    try {
      setRestoreError('');
      const workbook = XLSX.read(data, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja.');
      }

      // 1. Identify Sheets:
      // Try finding Sheet 1: 'Daftar Surat' / 'Kurikulum' / 'Rekap' or the first sheet
      const sheet1Name = workbook.SheetNames.find(n => 
        n.toLowerCase().includes('surat') || 
        n.toLowerCase().includes('kurikulum') || 
        n.toLowerCase().includes('rekap')
      ) || workbook.SheetNames[0];

      // Try finding Sheet 2: 'Detail Teks Ayat' / 'Ayat' or the second sheet
      const sheet2Name = workbook.SheetNames.find(n => 
        (n.toLowerCase().includes('ayat') || n.toLowerCase().includes('detail')) && n !== sheet1Name
      ) || (workbook.SheetNames.length > 1 ? workbook.SheetNames[1] : null);

      const ws1 = workbook.Sheets[sheet1Name];
      const sheet1Rows: any[][] = XLSX.utils.sheet_to_json(ws1, { header: 1 });

      let headerRowIdx = -1;
      for (let i = 0; i < Math.min(sheet1Rows.length, 12); i++) {
        const row = sheet1Rows[i] || [];
        if (row.some((cell: any) => {
          const s = String(cell).toLowerCase();
          return s.includes('nomor surat') || s.includes('nama surat');
        })) {
          headerRowIdx = i;
          break;
        }
      }

      if (headerRowIdx === -1) {
        throw new Error('Format tabel Excel tidak sesuai. Judul kolom "Nomor Surat" atau "Nama Surat" tidak ditemukan di lembar kerja.');
      }

      const headerCols: string[] = (sheet1Rows[headerRowIdx] || []).map((c: any) => String(c).trim().toLowerCase());
      const colIdxNoSurat = headerCols.findIndex(c => c.includes('nomor surat'));
      const colIdxNamaSurat = headerCols.findIndex(c => c.includes('nama surat'));
      const colIdxArti = headerCols.findIndex(c => c.includes('arti') || c.includes('terjemahan'));
      const colIdxGolongan = headerCols.findIndex(c => c.includes('golongan'));
      const colIdxJumlahAyat = headerCols.findIndex(c => c.includes('jumlah ayat'));
      const colIdxRujukan = headerCols.findIndex(c => c.includes('rujukan'));
      const colIdxStandarBaris = headerCols.findIndex(c => c.includes('baris'));

      // Parse Sheet 2 (Detail Ayat) if present
      const surahVersesMap = new Map<number, AyatModul[]>();
      if (sheet2Name && workbook.Sheets[sheet2Name]) {
        const ws2 = workbook.Sheets[sheet2Name];
        const sheet2Rows: any[][] = XLSX.utils.sheet_to_json(ws2, { header: 1 });
        let headerRow2Idx = -1;
        for (let i = 0; i < Math.min(sheet2Rows.length, 12); i++) {
          const row = sheet2Rows[i] || [];
          if (row.some((cell: any) => {
            const s = String(cell).toLowerCase();
            return s.includes('nomor ayat') || s.includes('teks arab') || (s.includes('ayat') && s.includes('nomor'));
          })) {
            headerRow2Idx = i;
            break;
          }
        }

        if (headerRow2Idx !== -1) {
          const header2Cols: string[] = (sheet2Rows[headerRow2Idx] || []).map((c: any) => String(c).trim().toLowerCase());
          const c2NoSurat = header2Cols.findIndex(c => c.includes('nomor surat'));
          const c2NoAyat = header2Cols.findIndex(c => c.includes('nomor ayat') || c.includes('ayat'));
          const c2TeksArab = header2Cols.findIndex(c => c.includes('teks arab') || c.includes('arab'));
          const c2Terjemahan = header2Cols.findIndex(c => c.includes('terjemahan') || c.includes('arti'));
          const c2Juz = header2Cols.findIndex(c => c.includes('juz'));
          const c2Halaman = header2Cols.findIndex(c => c.includes('halaman'));
          const c2BarisMulai = header2Cols.findIndex(c => c.includes('baris mulai') || c.includes('baris awal') || c === 'baris');
          const c2BarisSelesai = header2Cols.findIndex(c => c.includes('baris selesai') || c.includes('baris akhir'));

          for (let i = headerRow2Idx + 1; i < sheet2Rows.length; i++) {
            const row = sheet2Rows[i];
            if (!row || row.length === 0) continue;
            const sNo = c2NoSurat !== -1 ? Number(row[c2NoSurat]) : NaN;
            if (!sNo || isNaN(sNo)) continue;

            const ayNo = c2NoAyat !== -1 && Number(row[c2NoAyat]) ? Number(row[c2NoAyat]) : 1;
            const teksArab = c2TeksArab !== -1 && row[c2TeksArab] ? String(row[c2TeksArab]).trim() : '';
            const terjemahan = c2Terjemahan !== -1 && row[c2Terjemahan] ? String(row[c2Terjemahan]).trim() : '';
            const juz = c2Juz !== -1 && Number(row[c2Juz]) ? Number(row[c2Juz]) : getQuranDefaultJuz(sNo, ayNo);
            const halaman = c2Halaman !== -1 && Number(row[c2Halaman]) ? Number(row[c2Halaman]) : getQuranDefaultPage(sNo, ayNo);
            const barisMulai = c2BarisMulai !== -1 && row[c2BarisMulai] !== undefined && row[c2BarisMulai] !== '' && !isNaN(Number(row[c2BarisMulai])) ? Number(row[c2BarisMulai]) : undefined;
            const barisSelesai = c2BarisSelesai !== -1 && row[c2BarisSelesai] !== undefined && row[c2BarisSelesai] !== '' && !isNaN(Number(row[c2BarisSelesai])) ? Number(row[c2BarisSelesai]) : undefined;

            const ayatItem: AyatModul = {
              nomorAyat: ayNo,
              teksArab,
              terjemahan: terjemahan || undefined,
              juz,
              halaman,
              baris: barisMulai,
              barisAkhir: barisSelesai
            };

            if (!surahVersesMap.has(sNo)) {
              surahVersesMap.set(sNo, []);
            }
            surahVersesMap.get(sNo)!.push(ayatItem);
          }
        }
      }

      // Build Modul array
      const parsedQuranModuls: Modul[] = [];
      for (let i = headerRowIdx + 1; i < sheet1Rows.length; i++) {
        const row = sheet1Rows[i];
        if (!row || row.length === 0) continue;
        const sNo = colIdxNoSurat !== -1 ? Number(row[colIdxNoSurat]) : NaN;
        if (!sNo || isNaN(sNo) || sNo < 1 || sNo > 114) continue;

        const defaultSurah = SURAH_LIST.find(s => s.no === sNo);
        const namaSurat = colIdxNamaSurat !== -1 && row[colIdxNamaSurat] ? String(row[colIdxNamaSurat]).trim() : (defaultSurah?.nama || `Surat No. ${sNo}`);
        const arti = colIdxArti !== -1 && row[colIdxArti] ? String(row[colIdxArti]).trim() : '';
        const golongan = colIdxGolongan !== -1 && row[colIdxGolongan] ? String(row[colIdxGolongan]).trim() : ([1, 2, 3, 4, 5, 8, 9, 22, 24, 33, 47, 48, 49, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98, 110].includes(sNo) ? 'Madaniyah' : 'Makkiyah');
        const defaultLinesStr = colIdxStandarBaris !== -1 && row[colIdxStandarBaris] ? String(row[colIdxStandarBaris]) : '';
        const defaultLinesMatch = defaultLinesStr.match(/\d+/);
        const defaultLines = defaultLinesMatch ? Number(defaultLinesMatch[0]) : 15;
        const rujukan = colIdxRujukan !== -1 && row[colIdxRujukan] ? String(row[colIdxRujukan]).trim() : "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris Rasm Utsmani)";

        const verses = surahVersesMap.get(sNo) || [];
        const rawAyatArabic = verses.map(v => v.teksArab).filter(Boolean).join('\n');
        const jumlahAyat = verses.length > 0 ? verses.length : (colIdxJumlahAyat !== -1 && Number(row[colIdxJumlahAyat]) ? Number(row[colIdxJumlahAyat]) : 0);

        const newModul: Modul = {
          id: `quran_surah_${sNo}`,
          judulModul: `Surat ${namaSurat}`,
          tipe: TipeModul.AL_QURAN,
          nomorUrutSurat: sNo,
          namaSurat,
          jumlahAyat,
          rujukanMushaf: rujukan,
          isiAyat: verses
        };
        (newModul as any).deskripsiIdentitas = arti;
        (newModul as any).tempatTurun = golongan;
        (newModul as any).defaultLinesPerPage = defaultLines;
        (newModul as any).rawAyatArabic = rawAyatArabic;
        (newModul as any).konten = `Modul Pembelajaran Al-Qur'an Surat ${namaSurat}`;
        parsedQuranModuls.push(newModul);
      }

      if (parsedQuranModuls.length === 0) {
        throw new Error('Tidak ada data surat yang berhasil dibaca dari berkas Excel. Pastikan berkas memiliki nomor dan nama surat.');
      }

      const surahList = parsedQuranModuls.map(m => ({
        no: Number(m.nomorUrutSurat),
        nama: m.namaSurat || `Surat No. ${m.nomorUrutSurat}`,
        ayatCount: m.isiAyat?.length || m.jumlahAyat || 0
      }));

      const existingQuranModuls = moduls.filter(m => m.tipe === TipeModul.AL_QURAN);
      const newSurahs: { no: number; nama: string; ayatCount: number }[] = [];
      const existingSurahs: { no: number; nama: string; ayatCount: number; currentAyatCount: number }[] = [];

      surahList.forEach(s => {
        const match = existingQuranModuls.find(ex => Number(ex.nomorUrutSurat) === s.no);
        if (match) {
          existingSurahs.push({
            ...s,
            currentAyatCount: match.isiAyat?.length || match.jumlahAyat || 0
          });
        } else {
          newSurahs.push(s);
        }
      });

      const totalAyat = parsedQuranModuls.reduce((acc, m) => acc + (m.isiAyat?.length || m.jumlahAyat || 0), 0);

      setRestoreFileInfo({
        name: fileName,
        size: fileSize,
        source
      });

      setRestorePreview({
        version: 'Excel Workbook (Pilihan A: Multi-Sheet Lengkap)',
        exportDateFormatted: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        summary: {
          totalSurah: parsedQuranModuls.length,
          totalAyat,
          surahList
        },
        newSurahs,
        existingSurahs,
        modulsToRestore: parsedQuranModuls
      });
    } catch (err: any) {
      console.error(err);
      setRestoreError(err.message || 'Gagal membaca berkas Excel.');
      setRestorePreview(null);
    }
  };

  // Parse and preview restore file from local device (supports JSON and Excel .xlsx/.xls)
  const handleFileSelectForRestore = (file: File) => {
    setRestoreFile(file);
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        processExcelContentForRestore(buffer, file.name, file.size, 'local');
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        processJsonContentForRestore(text, file.name, file.size, 'local');
      };
      reader.readAsText(file);
    }
  };

  // Fetch JSON and Excel (.xlsx) files & folders from Google Drive for restore
  const fetchDriveJsonFilesAndFolders = async (parentId: string = 'root') => {
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsDriveRestoreLoading(true);
    try {
      const folderQ = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const folderUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQ)}&fields=files(id,name)&pageSize=50&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;

      const filesQ = `'${parentId}' in parents and (name contains '.json' or name contains '.xlsx' or name contains '.xls' or mimeType = 'application/json' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') and trashed = false`;
      const filesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(filesQ)}&fields=files(id,name,size,modifiedTime,mimeType)&pageSize=50&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;

      const [folderRes, filesRes] = await Promise.all([
        fetch(folderUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(filesUrl, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (folderRes.ok) {
        const folderData = await folderRes.json();
        setDriveRestoreSubFolders(folderData.files || []);
      }
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setDriveJsonFiles(filesData.files || []);
      }
    } catch (err) {
      console.warn('Gagal memuat berkas Drive:', err);
    } finally {
      setIsDriveRestoreLoading(false);
    }
  };

  // Search JSON and Excel files in Google Drive for restore
  const handleSearchDriveJson = async (term: string) => {
    setDriveRestoreSearchTerm(term);
    if (!term.trim() || term.trim().length < 2) {
      fetchDriveJsonFilesAndFolders(driveRestoreCurrentFolder);
      return;
    }
    const token = getGoogleAccessToken();
    if (!token) return;
    setIsDriveRestoreLoading(true);
    try {
      const cleanTerm = term.replace(/'/g, "\\'");
      const q = `name contains '${cleanTerm}' and (name contains '.json' or name contains '.xlsx' or name contains '.xls' or mimeType = 'application/json' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,size,modifiedTime,mimeType)&pageSize=30&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDriveJsonFiles(data.files || []);
        setDriveRestoreSubFolders([]);
      }
    } catch (err) {
      console.warn('Gagal mencari berkas di Drive:', err);
    } finally {
      setIsDriveRestoreLoading(false);
    }
  };

  // Select a JSON or Excel file from Google Drive to restore
  const handleSelectDriveFileForRestore = async (driveFile: { id: string; name: string; size?: string; mimeType?: string }) => {
    const token = getGoogleAccessToken();
    if (!token) {
      alert('Sesi Google Drive telah berakhir atau belum terhubung. Silakan hubungkan kembali.');
      return;
    }
    setIsDriveRestoreLoading(true);
    setRestoreError('');
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media&supportsAllDrives=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('mh_google_access_token');
        localStorage.removeItem('mh_google_access_token_expiry');
        throw new Error('Sesi Google Drive telah berakhir (401 Unauthorized). Silakan hubungkan kembali akun Google Anda.');
      }
      if (!res.ok) {
        throw new Error('Gagal mengunduh berkas cadangan dari Google Drive.');
      }

      const isExcel = driveFile.name.toLowerCase().endsWith('.xlsx') || 
                      driveFile.name.toLowerCase().endsWith('.xls') || 
                      (driveFile.mimeType && driveFile.mimeType.includes('spreadsheet'));

      if (isExcel) {
        const buffer = await res.arrayBuffer();
        processExcelContentForRestore(buffer, driveFile.name, driveFile.size ? Number(driveFile.size) : undefined, 'drive');
      } else {
        const text = await res.text();
        processJsonContentForRestore(text, driveFile.name, driveFile.size ? Number(driveFile.size) : undefined, 'drive');
      }
    } catch (err: any) {
      console.error(err);
      setRestoreError(err.message || 'Gagal membaca berkas cadangan dari Google Drive.');
      setRestorePreview(null);
    } finally {
      setIsDriveRestoreLoading(false);
    }
  };

  const handleOpenRestoreFolder = (folder: { id: string; name: string }) => {
    setDriveRestoreCurrentFolder(folder.id);
    setDriveRestoreFolderPath(prev => [...prev, folder]);
    setDriveRestoreSearchTerm('');
    fetchDriveJsonFilesAndFolders(folder.id);
  };

  const handleStepBackRestoreFolder = (folderId: string, idx: number) => {
    setDriveRestoreFolderPath(prev => prev.slice(0, idx + 1));
    setDriveRestoreCurrentFolder(folderId);
    setDriveRestoreSearchTerm('');
    fetchDriveJsonFilesAndFolders(folderId);
  };

  const handleConnectDriveForRestore = async () => {
    try {
      const token = await signInWithGoogleWorkspace(currentSession?.user?.role || UserRole.ADMIN);
      if (token) {
        fetchDriveJsonFilesAndFolders('root');
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Gagal menghubungkan Google Drive: ' + (err?.message || 'Error'));
      }
    }
  };

  // Execute restore to database
  const handleExecuteRestore = async () => {
    if (!restorePreview || restorePreview.modulsToRestore.length === 0) return;
    setIsRestoring(true);
    setRestoreError('');

    try {
      const { modulsToRestore } = restorePreview;
      const existingQuranModuls = moduls.filter(m => m.tipe === TipeModul.AL_QURAN);

      // If replace mode, delete old Al-Quran modules that aren't in restore list
      if (restoreMode === 'replace') {
        for (const oldM of existingQuranModuls) {
          const willBeOverwritten = modulsToRestore.some(m => Number(m.nomorUrutSurat) === Number(oldM.nomorUrutSurat));
          if (!willBeOverwritten) {
            await deleteModul(oldM.id);
          }
        }
      }

      // Sequential restore with progress
      const total = modulsToRestore.length;
      for (let i = 0; i < total; i++) {
        const item = modulsToRestore[i];
        setRestoreProgress({
          current: i + 1,
          total,
          currentSurah: item.namaSurat || `Surat No. ${item.nomorUrutSurat}`
        });

        const existing = existingQuranModuls.find(m => Number(m.nomorUrutSurat) === Number(item.nomorUrutSurat));
        if (existing) {
          await updateModul(existing.id, item);
        } else {
          await createModul(item);
        }
      }

      setRestoreSuccessMsg(`Alhamdulillah! Berhasil memulihkan ${total} modul surat Al-Qur'an (${restorePreview.summary.totalAyat} ayat) ke dalam sistem.`);
      setTimeout(() => {
        setIsRestoreModalOpen(false);
        setRestorePreview(null);
        setRestoreFile(null);
        setRestoreProgress(null);
        setIsRestoring(false);
      }, 1600);
    } catch (err: any) {
      setRestoreError(err.message || 'Terjadi kendala saat memulihkan data ke database.');
      setIsRestoring(false);
    }
  };

  // Handle new modul submission
  const handleCreateModulSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (newModulTipe === TipeModul.AL_QURAN) {
      if (!quranForm.namaSurat.trim() || !quranForm.nomorUrutSurat) {
        setFormError('Nama Surat dan nomor urut wajib diisi.');
        return;
      }

      const finalRujukan = quranRujukanMushaf === "Kustom / Rujukan Lainnya..."
        ? (customRujukanInput.trim() || "Mushaf Kustom")
        : quranRujukanMushaf;

      const lineVerses = quranForm.rawAyatArabic.trim().split('\n');
      const formattedVerses: AyatModul[] = lineVerses.map((text, idx) => {
        const startLineRaw = quranLines[idx];
        const hasStartLine = startLineRaw !== undefined && startLineRaw !== '' && !isNaN(Number(startLineRaw));
        const startLine = hasStartLine ? Number(startLineRaw) : undefined;

        const endLineRaw = quranEndLines[idx];
        const hasEndLine = endLineRaw !== undefined && endLineRaw !== '' && !isNaN(Number(endLineRaw));
        const endLine = hasEndLine ? Number(endLineRaw) : undefined;

        const v: AyatModul = {
          nomorAyat: idx + 1,
          teksArab: text.trim() || '...',
          terjemahan: quranTranslations[idx]?.trim() || `Terjemahan ayat ke-${idx + 1}`,
          juz: quranJuzs[idx] || getQuranDefaultJuz(Number(quranForm.nomorUrutSurat), idx + 1),
          halaman: quranPages[idx] || getQuranDefaultPage(Number(quranForm.nomorUrutSurat), idx + 1)
        };

        if (startLine !== undefined) {
          v.baris = startLine;
          if (endLine !== undefined && endLine > startLine) {
            v.barisAkhir = endLine;
          }
        }

        return v;
      });

      const payload = {
        tipe: TipeModul.AL_QURAN,
        namaSurat: quranForm.namaSurat.trim(),
        nomorUrutSurat: Number(quranForm.nomorUrutSurat),
        jumlahAyat: formattedVerses.length,
        rujukanMushaf: finalRujukan,
        isiAyat: formattedVerses
      };

      if (editingModulId) {
        setLastActiveModulId(editingModulId);
        setHighlightedModulId(editingModulId);
        updateModul(editingModulId, payload);
        const updatedModulObj = { id: editingModulId, ...payload } as any;
        setPreviewModul(updatedModulObj);
        if (activeCategoryFilter === TipeModul.NON_AL_QURAN) {
          setActiveCategoryFilter(TipeModul.AL_QURAN);
        }

        // Check if user clicked "Simpan & Lanjut ke Surah Berikutnya"
        if (navigateNextAfterSaveRef.current) {
          navigateNextAfterSaveRef.current = false;
          const currNo = Number(payload.nomorUrutSurat || quranForm.nomorUrutSurat);
          const nextModul = moduls.find(m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === currNo + 1);
          if (nextModul) {
            handleOpenEditModul(nextModul);
            return;
          }
        }
      } else {
        // If a module for this surah already exists, update it instead of creating a duplicate
        const existingDuplicate = moduls.find(
          m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === Number(quranForm.nomorUrutSurat)
        );
        if (existingDuplicate) {
          setLastActiveModulId(existingDuplicate.id);
          setHighlightedModulId(existingDuplicate.id);
          updateModul(existingDuplicate.id, payload);
          setPreviewModul({ id: existingDuplicate.id, ...payload } as any);
        } else {
          createModul(payload);
        }
      }
    } else {
      if (!nonQuranForm.judulModul.trim()) {
        setFormError('Judul Modul wajib diisi.');
        return;
      }

      let payload: any = {
        tipe: TipeModul.NON_AL_QURAN,
        judulModul: nonQuranForm.judulModul.trim(),
        kategoriModul: nonQuranForm.kategoriModul,
        isiModulManual: nonQuranForm.isiManual,
        tipeMateri: tipeMateri,
        googleDocUrl: nonQuranForm.googleDocUrl || '',
        googleSlideUrl: nonQuranForm.googleSlideUrl || '',
        pdfBase64: pdfBase64 || '',
        pdfFileName: pdfFileName || '',
        penulisModul: nonQuranForm.penulisModul?.trim() || '',
        penerbitModul: nonQuranForm.penerbitModul?.trim() || '',
        tahunTerbit: nonQuranForm.tahunTerbit?.trim() || '',
        deskripsiIdentitas: nonQuranForm.deskripsiIdentitas?.trim() || ''
      };

      if (formIsMultiJilid) {
        const finalImagesPerJilid = formHalamanGambarPerJilid.map((jilidArr, jKey) => {
          const pageMax = formHalamanPerJilid[jKey] || 3;
          const adjusted = [];
          for (let p = 0; p < pageMax; p++) {
            adjusted.push(jilidArr[p] || '');
          }
          return adjusted;
        });

        const finalPenjelasanPerJilid = formPenjelasanHalamanPerJilid.map((jilidArr, jKey) => {
          const pageMax = formHalamanPerJilid[jKey] || 3;
          const adjusted = [];
          for (let p = 0; p < pageMax; p++) {
            adjusted.push(jilidArr[p] || '');
          }
          return adjusted;
        });

        const finalTeksPerJilid = formTeksHalamanPerJilid.map((jilidArr, jKey) => {
          const pageMax = formHalamanPerJilid[jKey] || 3;
          const adjusted = [];
          for (let p = 0; p < pageMax; p++) {
            adjusted.push(jilidArr[p] || '');
          }
          return adjusted;
        });

        const finalJumlahBarisPerJilid = formHalamanPerJilid.map((pageMax, jKey) => {
          const currentJilid = jKey + 1;
          const adjusted = [];
          for (let p = 0; p < (pageMax || 3); p++) {
            const pageNum = p + 1;
            if (useJumlahBarisPerHalaman) {
              const exception = formCustomPageLines.find(
                ex => ex.page === pageNum && (ex.jilid === undefined || ex.jilid === currentJilid)
              );
              adjusted.push(exception ? exception.lines : (Number(formDefaultLinesPerPage) || 15));
            } else {
              adjusted.push(null);
            }
          }
          return adjusted;
        });

        const flatComp = finalImagesPerJilid[0] || [];
        const flatPenjelasan = finalPenjelasanPerJilid[0] || [];
        const flatTeks = finalTeksPerJilid[0] || [];
        const flatJumlahBaris = finalJumlahBarisPerJilid[0] || [];

        payload = {
          ...payload,
          isMultiJilid: true,
          jumlahJilid: formJumlahJilid,
          coverModulPerJilid: formCoverModulPerJilid,
          coverModul: formCoverModulPerJilid[0] || '',
          halamanPerJilid: formHalamanPerJilid,
          halamanGambarPerJilid: finalImagesPerJilid,
          halamanGambar: flatComp,
          thumbnailHalaman: flatComp,
          penjelasanHalamanPerJilid: finalPenjelasanPerJilid,
          penjelasanHalaman: flatPenjelasan,
          teksHalamanPerJilid: finalTeksPerJilid,
          teksHalaman: flatTeks,
          useJumlahBarisPerHalaman: useJumlahBarisPerHalaman,
          defaultLinesPerPage: Number(formDefaultLinesPerPage) || 15,
          customPageLines: formCustomPageLines,
          jumlahBarisPerHalamanPerJilid: finalJumlahBarisPerJilid,
          jumlahBarisPerHalaman: flatJumlahBaris,
        };
      } else {
        const pageCount = formHalamanPerJilid[0] || 3;
        
        const singleJilidImages = [];
        for (let p = 0; p < pageCount; p++) {
          singleJilidImages.push(formHalamanGambarPerJilid[0]?.[p] || '');
        }

        const singleJilidPenjelasan = [];
        for (let p = 0; p < pageCount; p++) {
          singleJilidPenjelasan.push(formPenjelasanHalamanPerJilid[0]?.[p] || '');
        }

        const singleJilidTeks = [];
        for (let p = 0; p < pageCount; p++) {
          singleJilidTeks.push(formTeksHalamanPerJilid[0]?.[p] || '');
        }

        const singleJilidJumlahBaris = [];
        for (let p = 0; p < pageCount; p++) {
          const pageNum = p + 1;
          if (useJumlahBarisPerHalaman) {
            const exception = formCustomPageLines.find(
              ex => ex.page === pageNum && (ex.jilid === undefined || ex.jilid === 1)
            );
            singleJilidJumlahBaris.push(exception ? exception.lines : (Number(formDefaultLinesPerPage) || 15));
          } else {
            singleJilidJumlahBaris.push(null);
          }
        }

        payload = {
          ...payload,
          isMultiJilid: false,
          jumlahJilid: 1,
          coverModul: formCoverModul,
          coverModulPerJilid: [formCoverModul],
          halamanPerJilid: [pageCount],
          halamanGambarPerJilid: [singleJilidImages],
          halamanGambar: singleJilidImages,
          thumbnailHalaman: singleJilidImages,
          penjelasanHalamanPerJilid: [singleJilidPenjelasan],
          penjelasanHalaman: singleJilidPenjelasan,
          teksHalamanPerJilid: [singleJilidTeks],
          teksHalaman: singleJilidTeks,
          useJumlahBarisPerHalaman: useJumlahBarisPerHalaman,
          defaultLinesPerPage: Number(formDefaultLinesPerPage) || 15,
          customPageLines: formCustomPageLines,
          jumlahBarisPerHalamanPerJilid: [singleJilidJumlahBaris],
          jumlahBarisPerHalaman: singleJilidJumlahBaris,
        };
      }

      if (editingModulId) {
        setLastActiveModulId(editingModulId);
        setHighlightedModulId(editingModulId);
        updateModul(editingModulId, payload);
        const updatedModulObj = { id: editingModulId, ...payload } as any;
        setPreviewModul(updatedModulObj);
      } else {
        createModul(payload);
      }
    }

    navigateNextAfterSaveRef.current = false;
    setIsNewModulOpen(false);
    setEditingModulId(null);
    setDetectedExistingModul(null);
  };

  // Simulated Word file extraction docx
  const handleWordFileSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (newModulTipe === TipeModul.AL_QURAN) {
        setQuranForm(prev => ({
          ...prev,
          rawAyatArabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ'
        }));
        alert(`Berkas "${file.name}" berhasil diunggah! Sistem otomatis mem-parsing 6 ayat Arab Al-Fatihah.`);
      } else {
        setNonQuranForm(prev => ({
          ...prev,
          judulModul: file.name.replace(/\.[^/.]+$/, ""),
          isiManual: 'Uraian bab ajar di-parsing otomatis dari file Word Anda:\n- Bab Utama Adab Belajar\n- Dalil dan Hadits Keutamaan Menuntut Ilmu\n- Ringkasan Tanya Jawab'
        }));
        alert(`Materi dari berkas "${file.name}" berhasil diekstrak otomatis!`);
      }
    }
  };

  const handleDeleteModul = (id: string) => {
    deleteModul(id);
    if (previewModul?.id === id) setPreviewModul(null);
  };

  const handleAutoFormatVerseNumbers = () => {
    const lines = quranForm.rawAyatArabic.split('\n');
    const formattedLines = lines.map((line, idx) => {
      const cleaned = line
        .replace(/[\u06DD\u20DD\s]*[\u0660-\u0669\u06F0-\u06F90-9⓪①②③④⑤⑥⑦⑧⑨]+/g, '')
        .replace(/\u06DD/g, '')
        .replace(/[\(\)\[\]\{\}﴿﴾]/g, '')
        .trim();
      if (!cleaned) return '';
      const arabDigit = convertToArabicNumerals(idx + 1);
      return `${cleaned} ${arabDigit}۝`;
    });
    setQuranForm(prev => ({
      ...prev,
      rawAyatArabic: formattedLines.join('\n')
    }));
  };

  // Filter and Sort modul list
  const filteredModuls = moduls.filter(m => {
    const matchCategory = activeCategoryFilter === 'All' || m.tipe === activeCategoryFilter;
    const itemTitle = (m.namaSurat || m.judulModul || '').toLowerCase();
    const matchSearch = itemTitle.includes(searchModulQuery.toLowerCase()) || (m.kategoriModul || '').toLowerCase().includes(searchModulQuery.toLowerCase());
    return matchCategory && matchSearch;
  }).sort((a, b) => {
    if (a.tipe === TipeModul.AL_QURAN && b.tipe === TipeModul.AL_QURAN) {
      return (a.nomorUrutSurat || 0) - (b.nomorUrutSurat || 0);
    }
    if (a.tipe !== b.tipe) {
      return a.tipe === TipeModul.AL_QURAN ? -1 : 1;
    }
    const nameA = a.judulModul || '';
    const nameB = b.judulModul || '';
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-6">
      {!isNewModulOpen && (
        <>
          {/* Title block */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-white">Modul & Materi Pembelajaran</h2>
          <p className="text-xs text-slate-400">Pustaka rujukan setoran bimbingan Al-Quran dan kurikulum tajwid, adab, hadits</p>
        </div>

        {isWritable && (
          <div className="flex items-center space-x-2">
            <button
              id="btn-add-modul"
              onClick={() => {
                setQuranForm({
                  namaSurat: '',
                  nomorUrutSurat: '',
                  jumlahAyat: 4,
                  rawAyatArabic: ''
                });
                setQuranTranslations([]);
                setQuranJuzs([]);
                setQuranPages([]);
                setQuranLines([]);
                setQuranEndLines([]);
                setFilterVerseLineStatus('all');
                setNonQuranForm({
                  judulModul: '',
                  kategoriModul: categories[0] || 'Hadits',
                  isiManual: 'Uraian bab...',
                  googleDocUrl: '',
                  googleSlideUrl: '',
                  penulisModul: '',
                  penerbitModul: '',
                  tahunTerbit: '',
                  deskripsiIdentitas: ''
                });
                setFormAuthors(['']);
                setTipeMateri('gambar');
                setPdfFileName('');
                setPdfBase64('');
                setFormIsMultiJilid(false);
                setFormJumlahJilid(2);
                setFormHalamanPerJilid([3, 3]);
                setFormHalamanGambarPerJilid([['', '', ''], ['', '', '']]);
                setFormPenjelasanHalamanPerJilid([['', '', ''], ['', '', '']]);
                setFormTeksHalamanPerJilid([['', '', ''], ['', '', '']]);
                setFormCoverModul('');
                setFormCoverModulPerJilid(['', '']);
                setUseJumlahBarisPerHalaman(false);
                setFormDefaultLinesPerPage(15);
                setFormCustomPageLines([]);
                setActiveSetupJilidIdx(0);
                setFormError('');
                setDetectedExistingModul(null);
                setEditingModulId(null);
                setNewModulTipe(activeCategoryFilter === TipeModul.NON_AL_QURAN ? TipeModul.NON_AL_QURAN : TipeModul.AL_QURAN);
                setIsNewModulOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Buat Modul Baru
            </button>
            {activeCategoryFilter === TipeModul.AL_QURAN && (
              <button
                onClick={() => setIsQuranLinesModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95 gap-1.5"
                title="Konfigurasi standar jumlah baris Mushaf Al-Qur'an 30 Juz"
              >
                <BookOpen className="w-4 h-4" />
                <span>Konfigurasi Baris Mushaf</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Category & Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="search-modul-input"
            type="text"
            placeholder="Cari nama surat, judul modul..."
            value={searchModulQuery}
            onChange={(e) => setSearchModulQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Category triggers */}
        <div className="md:col-span-2 flex space-x-2">
          {(['All', TipeModul.AL_QURAN, TipeModul.NON_AL_QURAN] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveCategoryFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategoryFilter === f
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 hover:bg-slate-100 text-slate-650 dark:text-slate-400'
              }`}
            >
              {f === TipeModul.AL_QURAN && <Sparkles className="w-3 h-3" />}
              {f === TipeModul.NON_AL_QURAN && <FileText className="w-3 h-3" />}
              <span>{f === 'All' ? 'Semua Kategori' : f}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dedicated Quran Modules Backup & Restore Card */}
      {activeCategoryFilter === TipeModul.AL_QURAN && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-emerald-950/10 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0 shadow-xs">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
                  Pencadangan &amp; Pemulihan Data Modul Al-Qur'an
                </h3>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  {moduls.filter(m => m.tipe === TipeModul.AL_QURAN).length} Surat Tersimpan
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Simpan seluruh konfigurasi teks ayat, terjemahan, juz, dan baris mushaf ke dalam berkas cadangan (JSON, Excel, PDF) di perangkat Anda atau langsung ke Google Drive, serta pulihkan data dari berkas cadangan tanpa perlu menginput ulang satu per satu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
            {/* Dropdown Unduh ke Perangkat (Card) */}
            <div className="relative inline-block text-left">
              <button
                id="btn-export-unduh-perangkat-card"
                type="button"
                onClick={() => {
                  setIsDownloadDropdownOpen(!isDownloadDropdownOpen);
                  setIsDriveDropdownOpen(false);
                }}
                disabled={isExporting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
                title="Unduh berkas kurikulum modul Al-Qur'an ke perangkat lokal (JSON, Excel, PDF)"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Mengekspor...' : 'Unduh ke Perangkat'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isDownloadDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDownloadDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-fade-in text-left">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Pilihan Format Unduh ke Perangkat
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDownloadDropdownOpen(false);
                        handleDownloadQuranToDevice('JSON');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Format Cadangan JSON (.json)</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Cadangan Resmi Modul Al-Qur'an</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDownloadDropdownOpen(false);
                        handleDownloadQuranToDevice('Excel');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Format EXCEL (.xlsx)</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Buku Kerja 2 Sheet (Daftar Surat &amp; Detail Ayat)</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDownloadDropdownOpen(false);
                        handleDownloadQuranToDevice('PDF');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Format Dokumen PDF (.pdf)</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Silabus Kurikulum &amp; Modul Resmi</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Dropdown Simpan ke Drive (Card) */}
            <div className="relative inline-block text-left">
              <button
                id="btn-export-simpan-drive-card"
                type="button"
                onClick={() => {
                  setIsDriveDropdownOpen(!isDriveDropdownOpen);
                  setIsDownloadDropdownOpen(false);
                }}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
                title="Simpan berkas modul Al-Qur'an langsung ke Google Drive (JSON, Spreadsheet, PDF)"
              >
                <Cloud className="w-4 h-4" />
                <span>{uploadingToDrive ? 'Menyiapkan...' : 'Simpan ke Drive'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isDriveDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDriveDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-fade-in text-left">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Pilihan Format Simpan ke Drive
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDriveDropdownOpen(false);
                        saveQuranToGoogleDrive('JSON');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan Cadangan JSON (.json)</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Cadangan Resmi Modul ke Google Drive</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDriveDropdownOpen(false);
                        saveQuranToGoogleDrive('Excel');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan EXCEL (.xlsx) ke Drive</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Buku Kerja 2 Sheet (Daftar Surat &amp; Detail Ayat)</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDriveDropdownOpen(false);
                        saveQuranToGoogleDrive('PDF');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs block">Simpan Dokumen PDF ke Drive</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Dokumen Kurikulum Al-Qur'an</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setRestoreFile(null);
                setRestoreFileInfo(null);
                setRestorePreview(null);
                setRestoreError('');
                setRestoreSuccessMsg('');
                setRestoreSourceTab('local');
                setDriveRestoreSearchTerm('');
                setIsRestoreModalOpen(true);
              }}
              className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-2"
              title="Pulihkan data modul Al-Qur'an dari berkas JSON (Lokal atau Google Drive)"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Pulihkan Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Conditional Font & Line Settings Card only for Al-Quran Category */}
      {activeCategoryFilter === TipeModul.AL_QURAN && (
        <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/30 dark:from-slate-900/60 dark:to-slate-900/10 p-5 rounded-2xl border border-amber-200/50 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1 px-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                PENATA TIPOGRAFI
              </span>
              <span className="p-1 px-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-extrabold uppercase font-mono">
                Majma Malik Fahd
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
              Konfigurator Font &amp; Ornamen Kurung Angka Resmi (Khusus Modul Al-Quran)
            </h3>
            <p className="text-xs text-slate-500">
              Unggah file font resmi Mushaf Malik Fahd (.ttf) atau pilih preset modern khusus untuk modul pembelajaran Al-Quran. Catatan kaki &amp; kurung angka disesuaikan otomatis!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-amber-200/30">
            {/* Font preset selector */}
            {!customFont && (
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mb-1">Preset Huruf</span>
                <select
                  value={selectedFontPreset}
                  onChange={(e) => {
                    setSelectedFontPreset(e.target.value);
                  }}
                  className="p-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                >
                  <option value="System">Bawaan Browser / Kotak Input (Sama &amp; Sesuai)</option>
                  <option value="Amiri">Amiri (Klasik Malik Fahd Style)</option>
                  <option value="Noto Naskh Arabic">Noto Naskh Arabic (Crisp Modern)</option>
                  <option value="Lateef">Lateef (Elegance)</option>
                  <option value="Reem Kufi">Reem Kufi (Kufic Bold)</option>
                  <option value="Scheherazade New">Scheherazade New (Traditional)</option>
                </select>
              </div>
            )}

            {/* Custom Font File upload button */}
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mb-1">Font Unggahan Sendiri</span>
              {customFont ? (
                <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1.5 rounded-lg text-xs text-emerald-800 dark:text-emerald-350">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono max-w-[120px] truncate" title={customFont.fileName}>{customFont.fileName}</span>
                  <button 
                    onClick={handleClearCustomFont}
                    className="p-0.5 hover:bg-emerald-100 rounded text-rose-600 font-bold cursor-pointer"
                    title="Ganti font ke preset"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center space-x-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-850 dark:bg-amber-950 dark:hover:bg-amber-900 rounded-lg text-xs font-bold cursor-pointer transition">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload .TTF Font</span>
                  <input
                    type="file"
                    accept=".ttf,.woff,.woff2,.otf"
                    onChange={handleFontUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Quick Link to Quran Lines Config */}
            <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-amber-200/40">
              <div className="flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">
                  Standar Baris Mushaf: <strong>{quranLinesConfig?.defaultLinesPerPage || 15} baris/hlm</strong> ({quranLinesConfig?.customPageLines?.length || 2} pengecualian)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuranLinesModalOpen(true)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer shadow-xs"
              >
                Atur Baris Mushaf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Font Settings Card only for Selain Al-Quran Category */}
      {activeCategoryFilter === TipeModul.NON_AL_QURAN && (
        <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/30 dark:from-slate-900/60 dark:to-slate-900/10 p-5 rounded-2xl border border-indigo-200/50 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1 px-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                PENATA TIPOGRAFI MANUSKRIP
              </span>
              <span className="p-1 px-2 bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 rounded-full text-[10px] font-bold uppercase font-mono">
                Multifont Support
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
              Konfigurator Font Modul selain Al-Quran (Font Arab &amp; Latin)
            </h3>
            <p className="text-xs text-slate-500">
              Unggah beberapa file font Arab atau Latin kustom yang akan terdaftar secara dinamis pada Toolbar Editor Teks manual saat Anda mengarang modul ajar hadits, adab, maupun fiqih.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-indigo-200/30 text-xs text-slate-800 dark:text-slate-100">
            {/* Arabic Fonts Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Font Arab ({nonQuranFonts?.filter(f => f.type === 'arab').length || 0})</span>
                <div className="flex items-center space-x-1 shrink-0">
                  {/* Option 1: Upload (File) */}
                  <label className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-650 text-white rounded text-[9px] font-bold uppercase cursor-pointer transition shadow-sm flex items-center space-x-0.5" title="Unggah file font .ttf kustom">
                    <UploadCloud className="w-2.5 h-2.5" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      accept=".ttf,.woff,.woff2,.otf" 
                      onChange={(e) => handleNonQuranFontUpload(e, 'arab')}
                      className="hidden" 
                    />
                  </label>
                  {/* Option 2: Google Fonts */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchGoogleFontQuery('');
                      setCustomGoogleFontInput('');
                      setShowGoogleFontModal('arab');
                    }}
                    className="p-1 px-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-650 text-white rounded text-[9px] font-bold uppercase cursor-pointer transition shadow-sm flex items-center space-x-0.5"
                    title="Cari dari Google Fonts yang terkenal"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Google Fonts</span>
                  </button>
                </div>
              </div>

              <div className="max-h-[75px] overflow-y-auto space-y-1 bg-white/70 dark:bg-slate-950/50 p-1.5 rounded-lg border border-slate-150 dark:border-slate-850">
                {(!nonQuranFonts || nonQuranFonts.filter(f => f.type === 'arab').length === 0) ? (
                  <span className="text-[10px] text-slate-400 italic block text-center py-1">Belum ada font Arab kustom. Preset Amiri &amp; Noto Naskh tetap tersedia.</span>
                ) : (
                  nonQuranFonts.filter(f => f.type === 'arab').map(font => (
                    <div key={font.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-1 px-2 rounded-md border border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="font-semibold truncate max-w-[120px]" title={font.name} style={{ fontFamily: font.name }}>{font.name}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveNonQuranFont(font.id)}
                        className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-0.5 rounded cursor-pointer shrink-0"
                        title="Hapus font"
                      >
                        <Trash2 className="w-3 nav-icon text-rose-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Latin Fonts Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Font Latin ({nonQuranFonts?.filter(f => f.type === 'latin').length || 0})</span>
                <div className="flex items-center space-x-1 shrink-0">
                  {/* Option 1: Upload (File) */}
                  <label className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-650 text-white rounded text-[9px] font-bold uppercase cursor-pointer transition shadow-sm flex items-center space-x-0.5" title="Unggah file font .ttf kustom">
                    <UploadCloud className="w-2.5 h-2.5" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      accept=".ttf,.woff,.woff2,.otf" 
                      onChange={(e) => handleNonQuranFontUpload(e, 'latin')}
                      className="hidden" 
                    />
                  </label>
                  {/* Option 2: Google Fonts */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchGoogleFontQuery('');
                      setCustomGoogleFontInput('');
                      setShowGoogleFontModal('latin');
                    }}
                    className="p-1 px-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-750 dark:hover:bg-purple-700 text-white rounded text-[9px] font-bold uppercase cursor-pointer transition shadow-sm flex items-center space-x-0.5"
                    title="Cari dari Google Fonts yang terkenal"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Google Fonts</span>
                  </button>
                </div>
              </div>

              <div className="max-h-[75px] overflow-y-auto space-y-1 bg-white/70 dark:bg-slate-950/50 p-1.5 rounded-lg border border-slate-150 dark:border-slate-850">
                {(!nonQuranFonts || nonQuranFonts.filter(f => f.type === 'latin').length === 0) ? (
                  <span className="text-[10px] text-slate-400 italic block text-center py-1">Belum ada font Latin kustom. Preset Inter, Georgia, Verdana dsb. tetap tersedia.</span>
                ) : (
                  nonQuranFonts.filter(f => f.type === 'latin').map(font => (
                    <div key={font.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-1 px-2 rounded-md border border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="font-semibold truncate max-w-[120px]" title={font.name} style={{ fontFamily: font.name }}>{font.name}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveNonQuranFont(font.id)}
                        className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-0.5 rounded cursor-pointer shrink-0"
                        title="Hapus font"
                      >
                        <Trash2 className="w-3 nav-icon text-rose-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split List Panel Left & Preview Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left materials list cards */}
        <div className="lg:col-span-2 space-y-3.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pustaka Materi ({filteredModuls.length})</h3>
          
          <div id="pustaka-materi-scroll-container" className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
            {filteredModuls.map((modul) => {
              const isSelected = previewModul?.id === modul.id;
              const isHighlighted = highlightedModulId === modul.id;
              const isQuran = modul.tipe === TipeModul.AL_QURAN;

              return (
                <div
                  key={modul.id}
                  id={`modul-card-${modul.id}`}
                  onClick={() => {
                    setPreviewModul(modul);
                    setLastActiveModulId(modul.id);
                    setPreviewPageIdx(0);
                    setPreviewJilidIdx(0);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-xs dark:bg-emerald-950/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800'
                  } ${
                    isHighlighted 
                      ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950 shadow-md animate-pulse' 
                      : ''
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    {!isQuran && (modul.coverModul || (modul.coverModulPerJilid && modul.coverModulPerJilid[0])) && (
                      <div className="w-12 h-16 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 overflow-hidden shrink-0 shadow-xs mt-1">
                        <img 
                          src={modul.coverModul || (modul.coverModulPerJilid && modul.coverModulPerJilid[0])} 
                          alt="Cover Thumbnail" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isQuran 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-350' 
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-350'
                        }`}>
                          {modul.tipe}
                        </span>
                        {isWritable && (
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEditModul(modul)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                              title="Edit materi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setConfirmDelete({ 
                                  id: modul.id, 
                                  name: modul.tipe === TipeModul.AL_QURAN ? `Surat ${modul.namaSurat}` : modul.judulModul || 'Materi' 
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Hapus materi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-850 dark:text-white mt-2 leading-snug truncate">
                        {isQuran ? `Surat ${modul.namaSurat}` : modul.judulModul}
                      </h4>

                      {/* Quran Baris Configuration Status */}
                      {isQuran && (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {(() => {
                            const configuredCount = modul.isiAyat?.filter(a => typeof a.baris === 'number').length || 0;
                            const totalCount = modul.isiAyat?.length || modul.jumlahAyat || 0;
                            if (totalCount === 0) return null;
                            if (configuredCount === totalCount) {
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Baris Lengkap ({configuredCount}/{totalCount})
                                </span>
                              );
                            }
                            if (configuredCount > 0) {
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                                  <Clock className="w-2.5 h-2.5 text-amber-600" /> Baris Sebagian ({configuredCount}/{totalCount})
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                                <Clock className="w-2.5 h-2.5 text-slate-400" /> Baris Belum Diatur
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      {/* Multi-Jilid Badges */}
                      {!isQuran && modul.isMultiJilid && (
                        <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 font-mono font-bold uppercase">
                          Multijilid ({modul.jumlahJilid} Jilid)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>
                      {isQuran 
                        ? `Nomor Surat urut: ${modul.nomorUrutSurat}` 
                        : `Kategori: ${modul.kategoriModul}`
                      }
                    </span>
                    <span className="font-mono text-emerald-650 dark:text-emerald-450 font-bold">
                      {isQuran 
                        ? `${modul.jumlahAyat} Ayat` 
                        : modul.isMultiJilid
                        ? `${modul.halamanPerJilid?.reduce((a, b) => a + b, 0)} Total Halaman`
                        : `${modul.halamanPerJilid?.[0] || modul.halamanGambar?.length || 1} Halaman`
                      }
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredModuls.length === 0 && (
              <div className="text-center py-14 bg-white dark:bg-slate-950 rounded-2xl border text-slate-400 italic border-dashed">
                Pustaka modul rujukan kosong.
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Panel showing Quran verses beautifully or Multi jilid slides */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-205 dark:border-slate-800/80 shadow-sm flex flex-col min-h-[460px]">
          {previewModul ? (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              
              {/* Header Title preview */}
              <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                    Preview: {previewModul.namaSurat ? `Surat ${previewModul.namaSurat}` : previewModul.judulModul}
                  </h3>
                  <p className="text-[11px] text-slate-405">{previewModul.tipe} Kurikulum Pembelajaran</p>
                </div>
                <span className="text-slate-400 text-[10px] font-normal italic">
                  Pratinjau Guru
                </span>
                <div className="flex items-center space-x-2">
                  {/* Applied Font indicator */}
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-450 rounded font-mono font-bold">
                    Font: {customFont ? 'Custom Malik Fahd' : selectedFontPreset}
                  </span>
                  <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-900 py-1 px-2.5 text-slate-650 rounded font-semibold">
                    {previewModul.id}
                  </span>
                </div>
              </div>

              {/* Render content appropriately */}
              {previewModul.tipe === TipeModul.AL_QURAN ? (
                (() => {
                const getJuz = (a: any) => a.juz || getQuranDefaultJuz(Number(previewModul.nomorUrutSurat), a.nomorAyat);
                const uniqueJuzs = Array.from(new Set(previewModul.isiAyat?.map(a => getJuz(a)) || [])).sort((a: any, b: any) => (a > b ? 1 : -1));
                const filteredAyat = previewModul.isiAyat?.filter(a => previewJuzFilter === 'All' || getJuz(a) === previewJuzFilter) || [];
                
                return (
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    {/* Juz Filter Selector */}
                    {uniqueJuzs.length > 0 && (
                      <div className="bg-slate-55 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center gap-1.5 shrink-0 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1.5">
                          Filter Juz:
                        </span>
                        
                        <button
                          onClick={() => setPreviewJuzFilter('All')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            previewJuzFilter === 'All'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                          }`}
                        >
                          Semua ({previewModul.isiAyat?.length || 0})
                        </button>

                        {uniqueJuzs.map(j => {
                          const count = previewModul.isiAyat?.filter(a => getJuz(a) === j).length || 0;
                          return (
                            <button
                              key={j}
                              onClick={() => setPreviewJuzFilter(j)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                                previewJuzFilter === j
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850'
                              }`}
                            >
                              <span>Juz {j}</span>
                              <span className={`text-[8.5px] px-1 rounded ${
                                previewJuzFilter === j 
                                  ? 'bg-emerald-700 text-emerald-100' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Verses viewport container */}
                    <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] py-1 px-1">
                      {filteredAyat.map((ayat, index) => (
                        <div 
                          key={index} 
                          className="p-4 bg-slate-55 bg-opacity-50 dark:bg-slate-900/40 border border-slate-150/40 dark:border-slate-800/80 rounded-2xl flex flex-col items-stretch justify-between gap-3 shadow-xs relative"
                        >
                          {/* Juz & Page Indicator Tags */}
                          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                            <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/30 dark:border-emerald-900 text-emerald-700 dark:text-emerald-450 shadow-3xs">
                              Juz {getJuz(ayat)}
                            </span>
                            <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-100/30 dark:border-teal-900 text-teal-700 dark:text-teal-400 shadow-3xs">
                              Halaman {ayat.halaman || getQuranDefaultPage(Number(previewModul.nomorUrutSurat), ayat.nomorAyat)}
                            </span>
                            {typeof ayat.baris === 'number' ? (
                              <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-100/30 dark:border-amber-900 text-amber-700 dark:text-amber-400 shadow-3xs">
                                {ayat.barisAkhir && ayat.barisAkhir > ayat.baris
                                  ? `Baris ${ayat.baris} - ${ayat.barisAkhir} (${ayat.barisAkhir - ayat.baris + 1} Baris${ayat.barisAkhir - ayat.baris + 1 === 15 ? ' • 1 Hlm Penuh' : ''})`
                                  : `Baris ${ayat.baris}`}
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-3xs">
                                Baris Belum Diatur
                              </span>
                            )}
                          </div>

                          {/* Arabic RTL display applying Custom Mushaf Font nested in Guru-style card */}
                          <div className="text-right select-text pt-2">
                            <div 
                              className="inline-flex flex-row-reverse items-center justify-center gap-2.5 border rounded-xl p-3 px-4 shadow-xs transition duration-150 border-emerald-100 bg-white dark:border-slate-850 dark:bg-slate-950/20"
                            >
                              <p className="font-mushaf font-serif text-3xl font-normal leading-loose tracking-wide text-slate-900 dark:text-white" dir="rtl">
                                {formatArabicFontClean(ayat.teksArab)}
                              </p>
                              <span 
                                className="font-mushaf font-serif text-3xl font-normal text-emerald-600 dark:text-emerald-400 select-none cursor-pointer inline-flex items-center justify-center px-1"
                                title={`Nomor Ayat ${ayat.nomorAyat}`}
                              >
                                {convertToArabicNumerals(ayat.nomorAyat)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Translation preview label */}
                          <p className="text-left text-xs text-slate-400 italic pt-1.5 border-t border-slate-150/40 dark:border-slate-800 block">
                            • {ayat.terjemahan || `Terjemahan ayat ke-${ayat.nomorAyat}`}
                          </p>
                        </div>
                      ))}
                      
                      {filteredAyat.length === 0 && (
                        <div className="text-center text-xs text-slate-400 italic py-10">
                          Tidak ada ayat yang cocok untuk filter terpilih.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
              ) : (
                /* Non Al-Quran Slide browser with support for multi-jilid and visual uploading sheets */
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  {previewModul.tipeMateri === 'hanya_identitas' ? (
                    <div className="p-5 border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 rounded-2xl space-y-4 text-slate-800 dark:text-slate-100 max-w-sm mx-auto shadow-sm">
                      <div className="text-center space-y-2">
                        <div className="inline-flex p-3 bg-amber-100/60 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full">
                          <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h4 className="font-sans font-bold text-base text-slate-900 dark:text-white leading-snug">
                          {previewModul.judulModul}
                        </h4>
                        <span className="inline-block text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full tracking-wider font-mono">
                          Hak Cipta Dilindungi
                        </span>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-3.5">
                        {previewModul.penulisModul && (
                          <div className="flex items-start space-x-3 text-xs">
                            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider w-16 shrink-0 mt-0.5">Penulis:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex flex-col gap-1">
                              {previewModul.penulisModul.split(';').map(p => p.trim()).filter(Boolean).map((author, index) => (
                                <span key={index} className="block">{author}</span>
                              ))}
                            </span>
                          </div>
                        )}
                        {previewModul.penerbitModul && (
                          <div className="flex items-start space-x-3 text-xs">
                            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider w-16 shrink-0 mt-0.5">Penerbit:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{previewModul.penerbitModul}</span>
                          </div>
                        )}
                        {previewModul.tahunTerbit && (
                          <div className="flex items-start space-x-3 text-xs">
                            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider w-16 shrink-0 mt-0.5">Terbit:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{previewModul.tahunTerbit}</span>
                          </div>
                        )}
                        {previewModul.deskripsiIdentitas && (
                          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3.5 space-y-1">
                            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Deskripsi &amp; Cakupan Bab:</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium">
                              {previewModul.deskripsiIdentitas}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/65 pt-3.5 text-center">
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 italic leading-relaxed">
                          *Materi buku/modul ini tidak diunggah demi mematuhi hak kekayaan intelektual penulis/penerbit. Bimbingan dilakukan menggunakan kitab cetak fisik masing-masing.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Selector for active Jilid if multi-jilid is verified */}
                      {previewModul.isMultiJilid && (
                        <div className="p-1 px-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between gap-2 overflow-x-auto">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Pilih Jilid:
                          </span>
                          <div className="flex space-x-1.5">
                            {Array.from({ length: previewModul.jumlahJilid || 1 }).map((_, jKey) => (
                              <button
                                key={jKey}
                                onClick={() => {
                                  setPreviewJilidIdx(jKey);
                                  setPreviewPageIdx(0);
                                }}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                                  previewJilidIdx === jKey
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-650 dark:bg-slate-950 dark:border-slate-800'
                                }`}
                              >
                                Jilid {jKey + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Slider or image display with high-fidelity mockup */}
                      <div className="space-y-4">
                        {/* Retrieve active image path or base64 text */}
                        {(() => {
                          const maxPages = previewModul.isMultiJilid 
                            ? (previewModul.halamanPerJilid?.[previewJilidIdx] || 1)
                            : (previewModul.halamanPerJilid?.[0] || previewModul.halamanGambar?.length || 1);

                          const isTextMode = previewModul.tipeMateri === 'teks';

                          const activeImage = !isTextMode
                            ? (previewModul.isMultiJilid
                              ? previewModul.halamanGambarPerJilid?.[previewJilidIdx]?.[previewPageIdx]
                              : previewModul.halamanGambar?.[previewPageIdx])
                            : undefined;

                          const activeTextContent = isTextMode
                            ? (previewModul.isMultiJilid
                              ? previewModul.teksHalamanPerJilid?.[previewJilidIdx]?.[previewPageIdx]
                              : previewModul.teksHalaman?.[previewPageIdx])
                            : undefined;

                          const activeExplanation = previewModul.isMultiJilid
                            ? previewModul.penjelasanHalamanPerJilid?.[previewJilidIdx]?.[previewPageIdx]
                            : previewModul.penjelasanHalaman?.[previewPageIdx];

                          const activeLineCount = previewModul.useJumlahBarisPerHalaman 
                            ? (previewModul.isMultiJilid
                              ? previewModul.jumlahBarisPerHalamanPerJilid?.[previewJilidIdx]?.[previewPageIdx]
                              : previewModul.jumlahBarisPerHalaman?.[previewPageIdx])
                            : null;

                          const isCustomImageSet = activeImage && activeImage.length > 0;

                          return (
                            <div className="space-y-3">
                              {/* Page viewer mockup box */}
                              <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 max-w-sm mx-auto shadow-md">
                                
                                {isTextMode ? (
                                  /* High fidelity representation of a Text page */
                                  <div className="bg-amber-50/40 dark:bg-slate-900 p-6 flex flex-col justify-between h-52 text-slate-805 dark:text-slate-100 overflow-y-auto font-sans">
                                    <div className="flex justify-between items-center text-[10px] text-amber-900/60 font-bold uppercase tracking-widest font-mono">
                                      <span>{previewModul.kategoriModul || 'ADAB & SYARIAT'}</span>
                                      <span>{previewModul.isMultiJilid ? `Jilid ${previewJilidIdx + 1}` : 'Tunggal'}</span>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center my-3 px-2">
                                      <p className="text-xs text-slate-905 dark:text-slate-100 font-medium leading-relaxed text-center whitespace-pre-wrap">
                                        {activeTextContent || '(Tidak ada teks halaman)'}
                                      </p>
                                    </div>
                                    <div className="flex justify-center text-xs font-bold font-mushaf text-amber-805">
                                      ﴿{previewPageIdx + 1}﴾
                                    </div>
                                  </div>
                                ) : isCustomImageSet ? (
                                  /* Standard uploaded custom page rendering */
                                  <div className="flex flex-col bg-slate-950">
                                    <img 
                                      src={activeImage} 
                                      alt={`Jilid ${previewJilidIdx + 1} Halaman ${previewPageIdx + 1}`}
                                      className="w-full h-52 object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="p-2 py-1.5 bg-slate-900 border-t border-slate-800 text-center text-[10px] text-slate-400 font-mono">
                                      Halaman Gambar Berhasil Diunggah Oleh Guru
                                    </div>
                                  </div>
                                ) : (
                                  /* High fidelity illustrative study booklet view with dynamic font style */
                                  <div className="bg-amber-50/45 dark:bg-slate-900 p-6 flex flex-col justify-between h-52 text-slate-805 dark:text-slate-100 font-serif">
                                    <div className="flex justify-between items-center text-[10px] text-amber-900/60 font-bold uppercase tracking-widest font-mono">
                                      <span>{previewModul.kategoriModul || 'ADAB & SYARIAT'}</span>
                                      <span>{previewModul.isMultiJilid ? `Jilid ${previewJilidIdx + 1}` : 'Tunggal'}</span>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-1.5 px-2">
                                      {/* Calligraphic geometric emblem */}
                                      <div className="p-1 px-2 border border-dashed border-amber-300 rounded font-sans uppercase font-bold text-[8px] text-amber-800 tracking-wider">
                                        HADITS RIWAYAT SHAHIH
                                      </div>
                                      <h5 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                                        {previewModul.judulModul}
                                      </h5>
                                      <p className={`text-center leading-relaxed text-xs text-slate-650 max-h-20 overflow-hidden text-ellipsis ${applyFontGlobally ? 'font-mushaf' : 'font-sans'}`}>
                                        {previewModul.isiModulManual || 'Uraian bab di-parsing secara otomatis.'}
                                      </p>
                                    </div>

                                    <div className="flex justify-center text-sm font-bold font-mushaf text-amber-805">
                                      {/* Ornament formatted around book number */}
                                      ﴿{previewPageIdx + 1}﴾
                                    </div>
                                  </div>
                                )}

                                {/* Sticky label indicating current slide indexes */}
                                <div className="absolute bottom-2 right-2 flex items-center space-x-1.5">
                                  {activeLineCount !== undefined && activeLineCount !== null && (
                                    <div className="bg-indigo-600/90 text-white text-[9px] px-2 py-0.5 rounded-full font-sans font-bold tracking-wider">
                                      {activeLineCount} Baris
                                    </div>
                                  )}
                                  <div className="bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">
                                    HALAMAN {previewPageIdx + 1} / {maxPages}
                                  </div>
                                </div>
                              </div>

                              {/* Manual text overview below slider */}
                              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <span className="text-[9px] font-bold text-slate-405 block uppercase tracking-wider font-mono">
                                  URAIAN MATERI / PENJELASAN HALAMAN {previewPageIdx + 1}
                                </span>
                                <p className="text-xs text-slate-650 dark:text-slate-350 mt-1 leading-relaxed whitespace-pre-wrap font-sans">
                                  {activeExplanation || previewModul.isiModulManual || 'Tidak ada uraian penjelasan khusus untuk halaman ini.'}
                                </p>
                              </div>

                              {/* Image Thumbnail list navigator */}
                              <div className="flex items-center justify-center space-x-2 pt-1">
                                <button
                                  disabled={previewPageIdx === 0}
                                  onClick={() => setPreviewPageIdx(prev => prev - 1)}
                                  className="p-1 hover:bg-slate-100 pr-1.5 border border-slate-200 rounded disabled:opacity-40"
                                >
                                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                                </button>
                                <div className="flex space-x-1.5 flex-wrap justify-center max-w-[200px]">
                                  {Array.from({ length: maxPages }).map((_, idx) => (
                                    <span 
                                      key={idx}
                                      onClick={() => setPreviewPageIdx(idx)}
                                      className={`w-2.5 h-2.5 rounded-full cursor-pointer transition ${
                                        previewPageIdx === idx ? 'bg-emerald-600 scale-110' : 'bg-slate-300 dark:bg-slate-700'
                                      }`}
                                      title={`Buka Halaman ${idx + 1}`}
                                    />
                                  ))}
                                </div>
                                <button
                                  disabled={previewPageIdx === (maxPages - 1)}
                                  onClick={() => setPreviewPageIdx(prev => prev + 1)}
                                  className="p-1 hover:bg-slate-100 pl-1.5 border border-slate-200 rounded disabled:opacity-40"
                                >
                                  <ChevronRight className="w-4 h-4 text-slate-600" />
                                </button>
                              </div>

                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-slate-400">
              <BookOpen className="w-14 h-14 text-emerald-500/30 mb-2 animate-pulse" />
              <p className="font-bold font-sans text-sm">Pratinjau Materi Rujukan</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">Pilih salah satu judul surat atau modul ajar kurikulum di panel kiri untuk membuka isi ayat atau jilid panduan.</p>
            </div>
          )}
        </div>

      </div>
      </>
    )}


      {/* ==========================================
          HALAMAN DEDIKASI: BUAT & EDIT MODUL PEMBELAJARAN
         ========================================== */}
      {isNewModulOpen && (
        <div className="space-y-6 animate-fade-in pb-16">
          {/* Top Sticky Header */}
          <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-950/95">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelOrBack}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Kembali ke Daftar Modul"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Kembali</span>
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-sans text-slate-800 dark:text-white">
                    {editingModulId ? 'Edit Modul Pembelajaran' : 'Buat Modul Pembelajaran Baru'}
                  </h2>
                  {editingModulId && (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                      Mode Edit
                    </span>
                  )}

                  {/* Navigasi Cepat Antar Surah Sebelumnya & Berikutnya */}
                  {editingModulId && newModulTipe === TipeModul.AL_QURAN && (
                    (() => {
                      const currNo = Number(quranForm.nomorUrutSurat);
                      const prevModul = moduls.find(m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === currNo - 1);
                      const nextModul = moduls.find(m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === currNo + 1);
                      if (!prevModul && !nextModul) return null;
                      return (
                        <div className="flex items-center gap-1.5 ml-1">
                          {prevModul && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModul(prevModul)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title={`Beralih ke Surah Sebelumnya: No. ${prevModul.nomorUrutSurat} ${prevModul.namaSurat}`}
                            >
                              <ChevronLeft className="w-3 h-3" />
                              <span className="hidden sm:inline">Sebelumnya: {prevModul.namaSurat}</span>
                              <span className="sm:hidden">No. {prevModul.nomorUrutSurat}</span>
                            </button>
                          )}
                          {nextModul && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModul(nextModul)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title={`Beralih ke Surah Berikutnya: No. ${nextModul.nomorUrutSurat} ${nextModul.namaSurat}`}
                            >
                              <span className="hidden sm:inline">Berikutnya: {nextModul.namaSurat}</span>
                              <span className="sm:hidden">No. {nextModul.nomorUrutSurat}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {newModulTipe === TipeModul.AL_QURAN 
                    ? 'Konfigurasi teks ayat Al-Qur\'an, rujukan standar mushaf, tajwid, dan nomor baris' 
                    : 'Pustaka acuan materi selain Al-Qur\'an (kitab, hadits, modul berjilid, dan dokumen panduan)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!editingModulId && newModulTipe === TipeModul.AL_QURAN && (
                <button
                  type="button"
                  onClick={() => {
                    setRestoreFile(null);
                    setRestorePreview(null);
                    setRestoreError('');
                    setRestoreSuccessMsg('');
                    setIsRestoreModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                  title="Import kurikulum Al-Qur'an dari berkas cadangan (.json)"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline">Import Cadangan</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelOrBack}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateNextAfterSaveRef.current = false;
                  const formElem = document.getElementById('modul-editor-form') as HTMLFormElement;
                  if (formElem) formElem.requestSubmit();
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                title={editingModulId ? 'Simpan perubahan dan kembali ke baris surah di daftar' : 'Simpan modul'}
              >
                <Check className="w-4 h-4" />
                <span>{editingModulId ? 'Simpan Perubahan' : 'Buat Modul Rujukan'}</span>
              </button>
              {editingModulId && newModulTipe === TipeModul.AL_QURAN && (() => {
                const currNo = Number(quranForm.nomorUrutSurat);
                const nextModul = moduls.find(m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === currNo + 1);
                if (!nextModul) return null;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      navigateNextAfterSaveRef.current = true;
                      const formElem = document.getElementById('modul-editor-form') as HTMLFormElement;
                      if (formElem) formElem.requestSubmit();
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                    title={`Simpan perubahan dan langsung lanjut edit Surah berikutnya: No. ${nextModul.nomorUrutSurat} ${nextModul.namaSurat}`}
                  >
                    <span>Simpan &amp; Lanjut No. {nextModul.nomorUrutSurat}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Selector category */}
          {!editingModulId && (
            activeCategoryFilter === TipeModul.AL_QURAN ? (
              <div className="flex items-center gap-2">
                <div className="py-2.5 px-4 bg-emerald-600 border border-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>Modul Al-Quran (Surat & Ayat)</span>
                </div>
              </div>
            ) : activeCategoryFilter === TipeModul.NON_AL_QURAN ? (
              <div className="flex items-center gap-2">
                <div className="py-2.5 px-4 bg-emerald-600 border border-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm">
                  <Layers className="w-4 h-4" />
                  <span>Materi Selain Al-Quran</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <button
                  type="button"
                  onClick={() => setNewModulTipe(TipeModul.AL_QURAN)}
                  className={`py-3 px-4 border rounded-2xl text-xs font-bold text-center transition flex items-center justify-center gap-2 cursor-pointer ${
                    newModulTipe === TipeModul.AL_QURAN 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                      : 'bg-white text-slate-650 dark:bg-slate-950 dark:border-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Modul Al-Quran (Surat & Ayat)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewModulTipe(TipeModul.NON_AL_QURAN)}
                  className={`py-3 px-4 border rounded-2xl text-xs font-bold text-center transition flex items-center justify-center gap-2 cursor-pointer ${
                    newModulTipe === TipeModul.NON_AL_QURAN 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                      : 'bg-white text-slate-650 dark:bg-slate-950 dark:border-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Materi Selain Al-Quran</span>
                </button>
              </div>
            )
          )}

          {/* Dedicated Full-Page Form Container */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7">
            <form 
              id="modul-editor-form"
              onSubmit={handleCreateModulSubmit} 
              className="space-y-6"
            >
              {newModulTipe === TipeModul.AL_QURAN ? (
                /* Quranic Form panels */
                <>
                  {/* Alert Banner: When surah has already been created previously */}
                  {detectedExistingModul && !editingModulId && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                              Surat {detectedExistingModul.namaSurat} (No. {detectedExistingModul.nomorUrutSurat}) Sudah Pernah Diinput Sebelumnya!
                            </h4>
                            <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-extrabold">
                              {detectedExistingModul.isiAyat?.length || detectedExistingModul.jumlahAyat || 0} Ayat Tersimpan
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                            Seluruh ayat arab, terjemahan, juz, halaman mushaf, dan nomor baris telah dimuat otomatis agar Anda tidak perlu mengetik ulang. Anda dapat langsung mengeditnya, atau beralih ke <strong>Mode Edit Modul</strong> untuk memperbarui data modul yang sudah ada.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingModulId(detectedExistingModul.id);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Beralih ke Mode Edit Modul</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuranForm(prev => ({
                              ...prev,
                              rawAyatArabic: ''
                            }));
                            setQuranTranslations([]);
                            setQuranJuzs([]);
                            setQuranPages([]);
                            setQuranLines([]);
                            setQuranEndLines([]);
                            setDetectedExistingModul(null);
                          }}
                          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                          title="Kosongkan kolom ayat jika ingin input ayat secara baru"
                        >
                          Kosongkan Ayat
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Top Grid: Surat Info, Rujukan Mushaf, & Arabic Verses */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Column: Identitas Surat & Rujukan Mushaf */}
                    <div className="lg:col-span-5 space-y-3.5 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      {/* PILIH SURAT (114 SURAT) DENGAN PENCARIAN NOMOR & NAMA SURAT */}
                      <div className="relative" ref={surahDropdownRef}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            PILIH SURAT (114 SURAT) *
                          </label>
                          {(() => {
                            const cur = SURAH_LIST.find(s => s.no === Number(quranForm.nomorUrutSurat)) || 
                              (quranForm.namaSurat ? SURAH_LIST.find(s => s.nama.toLowerCase().replace(/['`\-_\s]/g, '') === quranForm.namaSurat.toLowerCase().replace(/['`\-_\s]/g, '')) : null);
                            return cur ? (
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                No. {cur.no}: {cur.nama}
                              </span>
                            ) : null;
                          })()}
                        </div>

                        {/* Searchable input box */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <input
                            type="text"
                            value={surahSearchQuery}
                            onChange={(e) => {
                              setSurahSearchQuery(e.target.value);
                              if (!isSurahDropdownOpen) setIsSurahDropdownOpen(true);
                            }}
                            onFocus={() => setIsSurahDropdownOpen(true)}
                            placeholder={(() => {
                              const cur = SURAH_LIST.find(s => s.no === Number(quranForm.nomorUrutSurat));
                              return cur 
                                ? `Terpilih: No. ${cur.no} - ${cur.nama} (Ketik nomor / nama untuk cari...)` 
                                : "Ketik nomor surat (misal: 1, 78, 114) atau nama surat (misal: Yasin, Al-Mulk)...";
                            })()}
                            className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-white"
                          />
                          {surahSearchQuery ? (
                            <button
                              type="button"
                              onClick={() => setSurahSearchQuery('')}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Bersihkan pencarian"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsSurahDropdownOpen(!isSurahDropdownOpen)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Buka daftar surat"
                            >
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSurahDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Interactive Dropdown List */}
                        {isSurahDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in text-xs">
                            {/* Quick Shortcut Chips */}
                            <div className="p-2 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold uppercase mr-0.5">Cepat:</span>
                              <button
                                type="button"
                                onClick={() => setSurahSearchQuery('Juz 30')}
                                className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                              >
                                Juz 30 (78 - 114)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSurahSearchQuery('36')}
                                className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                              >
                                36 (Yasin)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSurahSearchQuery('67')}
                                className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                              >
                                67 (Al-Mulk)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSurahSearchQuery('1')}
                                className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                              >
                                1 (Al-Fatihah)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSurahSearchQuery('')}
                                className="text-[10px] text-slate-400 hover:text-slate-600 ml-auto px-1.5 py-0.5 font-bold cursor-pointer"
                              >
                                Semua (114)
                              </button>
                            </div>

                            {/* Surah List items */}
                            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
                              {filteredSurahList.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-xs">
                                  Tidak ditemukan surat dengan kata kunci "{surahSearchQuery}"
                                </div>
                              ) : (
                                filteredSurahList.map(s => {
                                  const isSelected = Number(quranForm.nomorUrutSurat) === s.no;
                                  const existing = moduls.find(m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === s.no);
                                  const verseCount = existing?.isiAyat?.length || existing?.jumlahAyat || 0;

                                  return (
                                    <button
                                      key={s.no}
                                      type="button"
                                      onClick={() => handleSelectSurah(s)}
                                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={`inline-flex items-center justify-center text-[10px] font-mono font-bold w-6 h-6 rounded-md shrink-0 ${
                                          isSelected
                                            ? 'bg-emerald-600 text-white'
                                            : existing
                                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}>
                                          {s.no}
                                        </span>
                                        <span className="font-semibold text-xs truncate">Surah {s.nama}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        {existing ? (
                                          <span className="text-[9.5px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                                            <span>{verseCount} Ayat</span>
                                          </span>
                                        ) : (
                                          <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                            Belum ada
                                          </span>
                                        )}
                                        {isSelected && (
                                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-bold shrink-0">
                                            (Aktif)
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>

                            {/* Dropdown Footer */}
                            <div className="p-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Menampilkan {filteredSurahList.length} dari 114 surat</span>
                              <button
                                type="button"
                                onClick={() => setIsSurahDropdownOpen(false)}
                                className="text-emerald-600 hover:underline font-bold cursor-pointer"
                              >
                                Tutup
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 mt-1">
                          Cari nomor surat (1-114) atau ketik namanya untuk mengisi otomatis formulir di bawah.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAMA SURAT *</label>
                          <input
                            type="text"
                            required
                            value={quranForm.namaSurat}
                            onChange={(e) => setQuranForm(prev => ({ ...prev, namaSurat: e.target.value }))}
                            placeholder="Contoh: An-Naba"
                            className="mt-1 w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">NOMOR URUT *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="114"
                            value={quranForm.nomorUrutSurat}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matched = SURAH_LIST.find(s => s.no === Number(val));
                              if (matched) {
                                handleSelectSurah(matched);
                              } else {
                                setQuranForm(prev => ({ 
                                  ...prev, 
                                  nomorUrutSurat: val 
                                }));
                                setDetectedExistingModul(null);
                              }
                            }}
                            placeholder="Contoh: 78"
                            className="mt-1 w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* RUJUKAN MUSHAF */}
                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> RUJUKAN MUSHAF AL-QUR'AN *
                        </label>
                        <select
                          value={quranRujukanMushaf}
                          onChange={(e) => setQuranRujukanMushaf(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-white"
                        >
                          {MUSHAF_PRESETS.map((preset, pIdx) => (
                            <option key={pIdx} value={preset}>
                              {preset}
                            </option>
                          ))}
                        </select>

                        {quranRujukanMushaf === "Kustom / Rujukan Lainnya..." && (
                          <div className="mt-2 animate-fade-in">
                            <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                              NAMA RUJUKAN MUSHAF KUSTOM
                            </label>
                            <input
                              type="text"
                              value={customRujukanInput}
                              onChange={(e) => setCustomRujukanInput(e.target.value)}
                              placeholder="Misal: Mushaf Standar Menara Kudus, Mushaf Beirut..."
                              className="mt-1 w-full p-2 bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                          Standar mushaf rujukan untuk sinkronisasi halaman dan penomoran baris ayat (misal: Majma' Malik Fahd Madinah).
                        </p>
                      </div>

                      {/* Simulated DOCX parser upload slot */}
                      <div className="p-2.5 bg-indigo-50/50 dark:bg-slate-900 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-indigo-750 dark:text-indigo-400 font-bold block uppercase tracking-wider">DOCX / File Word Parser</span>
                          <p className="text-[9.5px] text-slate-400 leading-snug">Ekstrak teks ayat secara otomatis dari file.</p>
                        </div>
                        <label className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer shrink-0 transition">
                          Upload Word
                          <input 
                            type="file" 
                            accept=".docx,.doc,.txt" 
                            onChange={handleWordFileSim} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    {/* Right Column: Arabic Verses Textarea & Auto-format */}
                    <div className="lg:col-span-7 space-y-2 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            AYAT ARAB (Satu ayat per baris) *
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {detectedExistingModul && (
                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Dimuat dari Modul Tersimpan</span>
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                              {quranForm.rawAyatArabic.split('\n').filter(l => l.trim()).length} Ayat Terdeteksi
                            </span>
                          </div>
                        </div>
                        <textarea
                          required
                          value={quranForm.rawAyatArabic}
                          onChange={(e) => setQuranForm(prev => ({ ...prev, rawAyatArabic: e.target.value }))}
                          placeholder="Tulis ayat arab dipisahkan enter..."
                          className="w-full h-44 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-serif text-right font-mushaf focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-loose"
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-400">
                          Gunakan tombol <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[9px]">Enter</kbd> untuk memisahkan setiap ayat
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAutoAssignLines}
                            title="Urutkan nomor baris 1, 2, 3... per halaman secara otomatis"
                            className="inline-flex items-center px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/45 dark:hover:bg-teal-950/65 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800 rounded text-[10.5px] font-bold transition cursor-pointer"
                          >
                            <ListOrdered className="w-3 h-3 mr-1" /> Hitung Baris Otomatis
                          </button>
                          <button
                            type="button"
                            onClick={handleAutoFormatVerseNumbers}
                            className="inline-flex items-center px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:hover:bg-amber-950/65 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800 rounded text-[10.5px] font-bold transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 mr-1" /> Auto-Format Nomor (۝)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Grid: 3 Mass Batch Configuration Cards (Juz, Halaman, Baris) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Card 1: Pembagian Juz */}
                    <div className="bg-emerald-50/30 dark:bg-slate-900/50 p-3.5 rounded-xl border border-emerald-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center pb-1.5 border-b border-emerald-100/60 dark:border-slate-800">
                        <label className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" /> PEMBAGIAN JUZ
                        </label>
                      </div>

                      <div className="space-y-2">
                        {/* Atur Cepat Semua */}
                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-850">
                          <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Set Semua Ayat:</span>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={bulkJuzValue}
                              onChange={(e) => setBulkJuzValue(Number(e.target.value))}
                              className="flex-1 p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-semibold text-slate-800 dark:text-white"
                            >
                              {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                <option key={j} value={j}>Juz {j}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const totalLines = quranForm.rawAyatArabic.split('\n').length;
                                setQuranJuzs(Array(totalLines).fill(bulkJuzValue));
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] transition shrink-0"
                            >
                              Semua
                            </button>
                          </div>
                        </div>

                        {/* Rentang Ayat */}
                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-850 space-y-1.5">
                          <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block">Bagi Rentang Ayat:</span>
                          <div className="flex items-center gap-1 text-[10.5px]">
                            <span className="text-slate-400">Ayat</span>
                            <input
                              type="number"
                              value={bulkJuzStart}
                              onChange={(e) => setBulkJuzStart(e.target.value)}
                              placeholder="1"
                              className="w-11 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                              type="number"
                              value={bulkJuzEnd}
                              onChange={(e) => setBulkJuzEnd(e.target.value)}
                              placeholder={quranForm.rawAyatArabic.split('\n').length.toString()}
                              className="w-11 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs"
                            />
                            <select
                              value={bulkJuzValue}
                              onChange={(e) => setBulkJuzValue(Number(e.target.value))}
                              className="p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-[10px]"
                            >
                              {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                <option key={j} value={j}>Juz {j}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const startNum = Number(bulkJuzStart) || 1;
                                const totalLines = quranForm.rawAyatArabic.split('\n').length;
                                const endNum = Number(bulkJuzEnd) || totalLines;
                                if (startNum < 1 || endNum < startNum || startNum > totalLines) {
                                  alert(`Rentang ayat tidak valid. Harus antara 1 s/d ${totalLines}`);
                                  return;
                                }
                                setQuranJuzs(prev => {
                                  const copy = [...prev];
                                  for (let i = startNum - 1; i < Math.min(endNum, totalLines); i++) {
                                    copy[i] = bulkJuzValue;
                                  }
                                  return copy;
                                });
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[9.5px] transition ml-auto"
                            >
                              Terapkan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Halaman Mushaf Rujukan */}
                    <div className="bg-teal-50/30 dark:bg-slate-900/50 p-3.5 rounded-xl border border-teal-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center pb-1.5 border-b border-teal-100/60 dark:border-slate-800">
                        <label className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-600" /> HALAMAN MUSHAF
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const totalLines = quranForm.rawAyatArabic.split('\n').length;
                            const sNo = Number(quranForm.nomorUrutSurat) || 1;
                            const calculated = Array.from({ length: totalLines }, (_, i) => getQuranDefaultPage(sNo, i + 1));
                            setQuranPages(calculated);
                          }}
                          className="text-[9px] bg-teal-600 hover:bg-teal-700 text-white font-bold px-1.5 py-0.5 rounded transition"
                        >
                          Auto Sync
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Atur Cepat Semua */}
                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-850">
                          <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Set Semua ke Hal:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="604"
                              value={bulkPageValue}
                              onChange={(e) => setBulkPageValue(Math.max(1, Math.min(604, Number(e.target.value) || 1)))}
                              className="flex-1 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded text-center text-xs font-semibold text-slate-800 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const totalLines = quranForm.rawAyatArabic.split('\n').length;
                                setQuranPages(Array(totalLines).fill(bulkPageValue));
                              }}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded text-[10px] transition shrink-0"
                            >
                              Semua
                            </button>
                          </div>
                        </div>

                        {/* Rentang Halaman */}
                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-850 space-y-1.5">
                          <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block">Bagi Rentang Halaman:</span>
                          <div className="flex items-center gap-1 text-[10.5px]">
                            <span className="text-slate-400">Ayat</span>
                            <input
                              type="number"
                              value={bulkPageStart}
                              onChange={(e) => setBulkPageStart(e.target.value)}
                              placeholder="1"
                              className="w-11 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                              type="number"
                              value={bulkPageEnd}
                              onChange={(e) => setBulkPageEnd(e.target.value)}
                              placeholder={quranForm.rawAyatArabic.split('\n').length.toString()}
                              className="w-11 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs"
                            />
                            <span className="text-slate-400">Hal</span>
                            <input
                              type="number"
                              min="1"
                              max="604"
                              value={bulkPageValue}
                              onChange={(e) => setBulkPageValue(Math.max(1, Math.min(604, Number(e.target.value) || 1)))}
                              className="w-11 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const startNum = Number(bulkPageStart) || 1;
                                const totalLines = quranForm.rawAyatArabic.split('\n').length;
                                const endNum = Number(bulkPageEnd) || totalLines;
                                if (startNum < 1 || endNum < startNum || startNum > totalLines) {
                                  alert(`Rentang ayat tidak valid. Harus antara 1 s/d ${totalLines}`);
                                  return;
                                }
                                setQuranPages(prev => {
                                  const copy = [...prev];
                                  for (let i = startNum - 1; i < Math.min(endNum, totalLines); i++) {
                                    copy[i] = bulkPageValue;
                                  }
                                  return copy;
                                });
                              }}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded text-[9.5px] transition ml-auto"
                            >
                              Terapkan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Penentuan Baris Ayat pada Mushaf (1 atau Lebih Baris) */}
                    <div className="bg-amber-50/30 dark:bg-slate-900/50 p-3.5 rounded-xl border border-amber-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center pb-1.5 border-b border-amber-100/60 dark:border-slate-800">
                        <label className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                          <ListOrdered className="w-3 h-3 text-amber-600" /> BARIS AYAT MUSHAF
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleAutoAssignLines}
                            title="Urutkan baris 1, 2, 3.. per halaman secara otomatis"
                            className="text-[9px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-1.5 py-0.5 rounded transition"
                          >
                            Urut 1..N
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const total = quranForm.rawAyatArabic.split('\n').length;
                              handleSetFullPageForRange(0, total - 1);
                            }}
                            title="Set semua ayat menjadi 1 Halaman Penuh (Baris 1 s/d 15)"
                            className="text-[9px] bg-amber-700 hover:bg-amber-800 text-white font-bold px-1.5 py-0.5 rounded transition"
                          >
                            Penuh 1-15
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAllLines}
                            title="Kosongkan/Reset nomor baris semua ayat agar dapat diatur bertahap"
                            className="text-[9px] bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded transition border border-rose-200 dark:border-rose-900"
                          >
                            Reset / Kosongkan
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Atur Cepat Semua */}
                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-850">
                          <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Set Semua ke Baris:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={bulkLineValue}
                              onChange={(e) => setBulkLineValue(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                              className="flex-1 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs font-semibold text-slate-800 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const totalLines = quranForm.rawAyatArabic.split('\n').length;
                                setQuranLines(Array(totalLines).fill(bulkLineValue));
                                setQuranEndLines(Array(totalLines).fill(''));
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px] transition shrink-0"
                            >
                              Semua
                            </button>
                          </div>
                        </div>

                        {/* Rentang Baris */}
                        <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-850 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">Bagi Rentang Baris:</span>
                            <select
                              value={bulkLineMode}
                              onChange={(e) => setBulkLineMode(e.target.value as any)}
                              className="text-[9.5px] font-semibold bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 text-slate-700 dark:text-slate-300"
                            >
                              <option value="sequential">Urut (1, 2, 3..)</option>
                              <option value="fixed">Nilai Tetap (1 Baris)</option>
                              <option value="range">Multi-Baris (Mulai s/d Selesai)</option>
                              <option value="full_page">1 Halaman Penuh (1 - 15 Baris)</option>
                              <option value="clear">Kosongkan Baris Rentang Ini</option>
                            </select>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1 text-[10.5px]">
                            <span className="text-slate-400">Ayat</span>
                            <input
                              type="number"
                              value={bulkLineStart}
                              onChange={(e) => setBulkLineStart(e.target.value)}
                              placeholder="1"
                              className="w-10 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs font-semibold"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                              type="number"
                              value={bulkLineEnd}
                              onChange={(e) => setBulkLineEnd(e.target.value)}
                              placeholder={quranForm.rawAyatArabic.split('\n').length.toString()}
                              className="w-10 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs font-semibold"
                            />

                            {bulkLineMode === 'range' ? (
                              <>
                                <span className="text-slate-400">Baris</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="30"
                                  value={bulkLineValue}
                                  onChange={(e) => setBulkLineValue(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                                  className="w-9 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs font-semibold"
                                  title="Baris Mulai"
                                />
                                <span className="text-slate-400">s/d</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="30"
                                  value={bulkLineEndValue}
                                  onChange={(e) => setBulkLineEndValue(Math.max(1, Math.min(30, Number(e.target.value) || 15)))}
                                  className="w-9 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs font-semibold"
                                  title="Baris Selesai"
                                />
                              </>
                            ) : bulkLineMode === 'full_page' ? (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold px-1">
                                (1 s/d 15)
                              </span>
                            ) : bulkLineMode === 'clear' ? (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold px-1">
                                (Kosongkan)
                              </span>
                            ) : (
                              <>
                                <span className="text-slate-400">Mulai</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="30"
                                  value={bulkLineValue}
                                  onChange={(e) => setBulkLineValue(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                                  className="w-10 p-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded text-center text-xs font-semibold"
                                />
                              </>
                            )}

                            <button
                              type="button"
                              onClick={handleApplyBulkLines}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[9.5px] transition ml-auto"
                            >
                              Terapkan
                            </button>
                          </div>
                        </div>

                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-tight">
                          💡 Modul tetap dapat disimpan walau belum semua ayat ditentukan letak barisnya. Ayat yang belum diatur akan diberi tanda penanda kuning agar dapat dilanjutkan kemudian.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section: Translation & Verse Details with 3 Modes */}
                  <div className="space-y-3 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Languages className="w-4 h-4 text-emerald-600" />
                        RINCIAN & TERJEMAHAN TIAP AYAT ({totalVersesCount} Ayat)
                      </label>
                      <span className="text-[10px] text-slate-400 italic">Rujukan: {quranRujukanMushaf}</span>
                    </div>

                    {/* Verses Configuration Status & Progress Bar */}
                    <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                            Status Baris:
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {configuredVersesCount} Sudah Diatur
                          </span>
                          {pendingVersesCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {pendingVersesCount} Belum Diatur
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Lengkap 100%
                            </span>
                          )}
                        </div>

                        {firstPendingVerse && (
                          <button
                            type="button"
                            onClick={handleJumpToFirstPendingVerse}
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs cursor-pointer"
                            title="Loncat ke ayat pertama yang belum diatur barisnya"
                          >
                            <span>Lanjut Atur Ayat {firstPendingVerse.idx + 1}</span>
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Progress Bar Visualizer */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span>Progres: {configuredVersesCount} dari {totalVersesCount} ayat ({percentConfigured}%)</span>
                          <span>{pendingVersesCount > 0 ? `${pendingVersesCount} ayat dapat diatur bertahap (bisa disimpan sekarang)` : 'Semua nomor baris ayat telah ditentukan'}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${percentConfigured}%` }}
                          />
                        </div>
                      </div>

                      {/* Filter Buttons for easy navigation */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tampilkan:</span>
                        <button
                          type="button"
                          onClick={() => setFilterVerseLineStatus('all')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                            filterVerseLineStatus === 'all'
                              ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400'
                          }`}
                        >
                          Semua ({totalVersesCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterVerseLineStatus('configured')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            filterVerseLineStatus === 'configured'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" /> Sudah Diatur ({configuredVersesCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterVerseLineStatus('pending')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            filterVerseLineStatus === 'pending'
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" /> Belum Diatur ({pendingVersesCount})
                        </button>
                      </div>
                    </div>

                    {/* Method Selector Tabs: Satuan, Tabel, Salin-Tempel */}
                    <div className="flex gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setTranslationInputMethod('single')}
                        className={`flex-1 py-1.5 rounded transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                          translationInputMethod === 'single'
                            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" /> Satuan (Kartu Per-Ayat)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTranslationInputMethod('table')}
                        className={`flex-1 py-1.5 rounded transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                          translationInputMethod === 'table'
                            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <Table className="w-3.5 h-3.5" /> Tabel Matriks (Semua Ayat)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTranslationInputMethod('bulk')}
                        className={`flex-1 py-1.5 rounded transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                          translationInputMethod === 'bulk'
                            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" /> Salin-Tempel (Masal)
                      </button>
                    </div>

                    {/* Content based on selected tab */}
                    {translationInputMethod === 'bulk' ? (
                      <div className="space-y-2 animate-fade-in">
                        <textarea
                          value={quranTranslations.join('\n')}
                          onChange={(e) => {
                            const lines = e.target.value.split('\n');
                            const arabicLinesCount = quranForm.rawAyatArabic.split('\n').length;
                            setQuranTranslations(prev => {
                              const next = [...prev];
                              for (let i = 0; i < arabicLinesCount; i++) {
                                next[i] = lines[i] !== undefined ? lines[i] : '';
                              }
                              return next.slice(0, arabicLinesCount);
                            });
                          }}
                          placeholder={`Posisikan terjemahan Anda di sini, satu baris untuk satu ayat secara berurutan. Contoh:\nDengan menyebut nama Allah yang Maha Pengasih...\nSegala puji bagi Allah Tuhan Semesta Alam...\nAr-Rahmaan Ar-Rahiim...`}
                          className="w-full h-48 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                        />
                        <p className="text-[10px] text-slate-400 leading-snug">
                          * Baris ke-1 dipetakan ke Ayat 1, baris ke-2 ke Ayat 2, dst. Anda dapat berpindah ke tab <b>"Satuan"</b> atau <b>"Tabel Matriks"</b> untuk menyesuaikan baris mulai &amp; selesai (multi-baris) dan halaman.
                        </p>
                      </div>
                    ) : translationInputMethod === 'table' ? (
                      <div className="overflow-x-auto max-h-[340px] rounded-lg border border-slate-200 dark:border-slate-800 animate-fade-in">
                        <table className="w-full text-left text-xs bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
                          <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                            <tr>
                              <th className="py-2 px-2 text-center w-10">Ayat</th>
                              <th className="py-2 px-2 text-center w-24">Status Baris</th>
                              <th className="py-2 px-1 text-center w-14">Juz</th>
                              <th className="py-2 px-1 text-center w-14">Hal</th>
                              <th className="py-2 px-1 text-center w-16">Baris Mulai</th>
                              <th className="py-2 px-1 text-center w-16">s/d Baris</th>
                              <th className="py-2 px-2 text-center w-28">Cakupan Baris</th>
                              <th className="py-2 px-2 text-center w-24">Aksi Cepat</th>
                              <th className="py-2 px-3 text-right">Teks Arab</th>
                              <th className="py-2 px-3">Terjemahan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                            {displayedVerseEntries.map((entry) => {
                              const { idx, text: line, isConfigured, startLine, endLine, isMulti, spanCount } = entry;

                              return (
                                <tr 
                                  key={idx} 
                                  id={`verse-row-${idx}`}
                                  className={`transition ${!isConfigured ? 'bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40 dark:hover:bg-amber-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-900/50'}`}
                                >
                                  <td className="py-2 px-2 text-center font-bold text-emerald-600">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {isConfigured ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Diatur
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
                                        <Clock className="w-2.5 h-2.5 text-amber-600" /> Belum Diatur
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-1 text-center">
                                    <select
                                      value={quranJuzs[idx] || getQuranDefaultJuz(Number(quranForm.nomorUrutSurat), idx + 1)}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setQuranJuzs(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      className="p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center"
                                    >
                                      {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                        <option key={j} value={j}>{j}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2 px-1 text-center">
                                    <input
                                      type="number"
                                      min="1"
                                      max="604"
                                      value={quranPages[idx] || getQuranDefaultPage(Number(quranForm.nomorUrutSurat), idx + 1)}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setQuranPages(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      className="w-13 p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-bold text-center text-slate-700 dark:text-slate-300"
                                    />
                                  </td>
                                  <td className="py-2 px-1 text-center">
                                    <input
                                      type="number"
                                      min="1"
                                      max="30"
                                      value={quranLines[idx] !== undefined && quranLines[idx] !== '' ? quranLines[idx] : ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? '' : Number(e.target.value);
                                        setQuranLines(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      placeholder="-"
                                      className={`w-12 p-1 rounded text-[11px] font-bold text-center ${
                                        !isConfigured
                                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                                          : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                                      }`}
                                      title={isConfigured ? `Baris ${startLine}` : 'Baris belum ditentukan'}
                                    />
                                  </td>
                                  <td className="py-2 px-1 text-center">
                                    <input
                                      type="number"
                                      min="1"
                                      max="30"
                                      value={quranEndLines[idx] !== undefined ? quranEndLines[idx] : ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? '' : Number(e.target.value);
                                        setQuranEndLines(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      placeholder="-"
                                      className="w-12 p-1 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/60 rounded text-[11px] font-bold text-center text-amber-800 dark:text-amber-300"
                                      title="Baris Selesai jika ayat mencakup > 1 baris"
                                    />
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {isConfigured ? (
                                      isMulti ? (
                                        <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 whitespace-nowrap">
                                          Baris {startLine}-{endLine} ({spanCount} baris{spanCount === 15 ? ' • 1 Hlm Penuh' : ''})
                                        </span>
                                      ) : (
                                        <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                                          Baris {startLine} (1 baris)
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 whitespace-nowrap">
                                        Belum Ditentukan
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-1 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuranLines(prev => { const c = [...prev]; c[idx] = 1; return c; });
                                          setQuranEndLines(prev => { const c = [...prev]; c[idx] = 15; return c; });
                                        }}
                                        title="Set ayat ini 1 Halaman Penuh (Baris 1 s/d 15)"
                                        className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[9px] font-bold whitespace-nowrap transition"
                                      >
                                        1-15
                                      </button>
                                      {isConfigured && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuranLines(prev => { const c = [...prev]; c[idx] = ''; return c; });
                                            setQuranEndLines(prev => { const c = [...prev]; c[idx] = ''; return c; });
                                          }}
                                          title="Kosongkan nomor baris (atur nanti)"
                                          className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 rounded text-[9px] font-bold transition border border-rose-200 dark:border-rose-900"
                                        >
                                          Kosongkan
                                        </button>
                                      )}
                                      {isMulti && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuranEndLines(prev => { const c = [...prev]; c[idx] = ''; return c; });
                                          }}
                                          title="Reset ke 1 Baris"
                                          className="px-1 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold transition"
                                        >
                                          1 Baris
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 font-serif text-right font-mushaf text-slate-800 dark:text-slate-200 text-sm max-w-[180px] truncate" dir="rtl">
                                    {line.trim() || '(Kosong)'}
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="text"
                                      value={quranTranslations[idx] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setQuranTranslations(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      placeholder={`Terjemahan ayat ke-${idx + 1}`}
                                      className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                  </td>
                                </tr>
                              );
                            })}

                            {displayedVerseEntries.length === 0 && (
                              <tr>
                                <td colSpan={10} className="py-6 text-center text-slate-400 italic">
                                  Tidak ada ayat yang sesuai dengan filter "{filterVerseLineStatus === 'configured' ? 'Sudah Diatur' : 'Belum Diatur'}".
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Single Card View per verse */
                      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 animate-fade-in">
                        {displayedVerseEntries.map((entry) => {
                          const { idx, text: line, isConfigured, startLine, endLine, isMulti, spanCount } = entry;
                          const hasContent = line.trim().length > 0;
                          const displayText = hasContent 
                            ? (line.length > 35 ? line.substring(0, 35) + "..." : line)
                            : `(Kosong)`;

                          return (
                            <div 
                              key={idx} 
                              id={`verse-card-${idx}`}
                              className={`flex flex-col gap-2 p-3 rounded-lg border shadow-xs transition ${
                                !isConfigured 
                                  ? 'bg-amber-50/20 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/60' 
                                  : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-850'
                              }`}
                            >
                              <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded text-[11px]">
                                    Ayat {idx + 1}
                                  </span>

                                  {isConfigured ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Baris Diatur
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                                      <Clock className="w-2.5 h-2.5 text-amber-600" /> Baris Belum Diatur
                                    </span>
                                  )}

                                  {/* Juz */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Juz:</span>
                                    <select
                                      value={quranJuzs[idx] || getQuranDefaultJuz(Number(quranForm.nomorUrutSurat), idx + 1)}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setQuranJuzs(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      className="p-0.5 px-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none"
                                    >
                                      {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                        <option key={j} value={j}>{j}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Halaman */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hal:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="604"
                                      value={quranPages[idx] || getQuranDefaultPage(Number(quranForm.nomorUrutSurat), idx + 1)}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setQuranPages(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      className="w-13 p-0.5 px-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center focus:outline-none"
                                    />
                                  </div>

                                  {/* Baris Mulai */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Baris:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="30"
                                      value={quranLines[idx] !== undefined && quranLines[idx] !== '' ? quranLines[idx] : ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? '' : Number(e.target.value);
                                        setQuranLines(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      placeholder="-"
                                      className={`w-11 p-0.5 px-1 rounded text-[11px] font-bold text-center focus:outline-none ${
                                        !isConfigured
                                          ? 'bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                                          : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                                      }`}
                                      title={isConfigured ? `Baris ${startLine}` : 'Baris belum ditentukan'}
                                    />
                                  </div>

                                  {/* Baris Selesai */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase">s/d:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="30"
                                      value={quranEndLines[idx] !== undefined ? quranEndLines[idx] : ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? '' : Number(e.target.value);
                                        setQuranEndLines(prev => {
                                          const copy = [...prev];
                                          copy[idx] = val;
                                          return copy;
                                        });
                                      }}
                                      placeholder="-"
                                      className="w-11 p-0.5 px-1 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/70 dark:border-amber-800/70 rounded text-[11px] font-bold text-amber-800 dark:text-amber-300 text-center focus:outline-none"
                                      title="Baris Selesai jika ayat mencakup > 1 baris"
                                    />
                                  </div>

                                  {/* Quick Buttons & Status */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQuranLines(prev => { const c = [...prev]; c[idx] = 1; return c; });
                                        setQuranEndLines(prev => { const c = [...prev]; c[idx] = 15; return c; });
                                      }}
                                      title="Set 1 Halaman Penuh (Baris 1 s/d 15)"
                                      className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[9.5px] font-bold transition"
                                    >
                                      1-15 (Penuh)
                                    </button>
                                    {isConfigured && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuranLines(prev => { const c = [...prev]; c[idx] = ''; return c; });
                                          setQuranEndLines(prev => { const c = [...prev]; c[idx] = ''; return c; });
                                        }}
                                        title="Kosongkan nomor baris ayat ini (atur nanti)"
                                        className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 rounded text-[9.5px] font-bold transition border border-rose-200 dark:border-rose-900"
                                      >
                                        Kosongkan
                                      </button>
                                    )}
                                    {isMulti && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuranEndLines(prev => { const c = [...prev]; c[idx] = ''; return c; });
                                        }}
                                        title="Kembalikan ke 1 Baris"
                                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9.5px] font-bold transition"
                                      >
                                        1 Baris
                                      </button>
                                    )}
                                    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                                      isConfigured 
                                        ? (isMulti ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800')
                                        : 'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                                    }`}>
                                      {isConfigured ? (isMulti ? `${spanCount} Baris${spanCount === 15 ? ' • 1 Hlm Penuh' : ''}` : '1 Baris') : 'Belum Diatur'}
                                    </span>
                                  </div>
                                </div>

                                <span className="font-serif text-slate-600 dark:text-slate-300 text-right truncate max-w-[240px] font-mushaf text-sm" dir="rtl">
                                  {displayText}
                                </span>
                              </div>

                              <input
                                type="text"
                                value={quranTranslations[idx] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQuranTranslations(prev => {
                                    const copy = [...prev];
                                    copy[idx] = val;
                                    return copy;
                                  });
                                }}
                                placeholder={`Terjemahan ayat ke-${idx + 1}...`}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>
                          );
                        })}

                        {displayedVerseEntries.length === 0 && (
                          <div className="py-6 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed">
                            Tidak ada ayat yang sesuai dengan filter "{filterVerseLineStatus === 'configured' ? 'Sudah Diatur' : 'Belum Diatur'}".
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* non-Quran Form panels supporting dynamic Multi Jilid & Image Upload counts */
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">JUDUL MODUL AJAR *</label>
                    <input
                      type="text"
                      required
                      value={nonQuranForm.judulModul}
                      onChange={(e) => setNonQuranForm(prev => ({ ...prev, judulModul: e.target.value }))}
                      placeholder="Contoh: Kitab Adabul Alim Wal Muta'allim"
                      className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">KATEGORI MODUL</label>
                        <button
                          type="button"
                          onClick={() => setShowManageCategories(!showManageCategories)}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          {showManageCategories ? "Tutup" : "Kelola"}
                        </button>
                      </div>
                      <select
                        value={nonQuranForm.kategoriModul}
                        onChange={(e) => setNonQuranForm(prev => ({ ...prev, kategoriModul: e.target.value }))}
                        className="mt-1 w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Jilid Mode selector (Satu jilid atau banyak Jilid) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">TIPE PENJILIDAN</label>
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFormIsMultiJilid(false);
                            setFormHalamanPerJilid([3]);
                            setFormHalamanGambarPerJilid([['', '', '']]);
                            setActiveSetupJilidIdx(0);
                          }}
                          className={`py-2 px-1 text-[10px] font-bold text-center border rounded-lg cursor-pointer ${
                            !formIsMultiJilid 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-slate-900' 
                              : 'bg-white text-slate-650 border-slate-200 dark:bg-slate-950 dark:border-slate-800'
                          }`}
                        >
                          Satu Jilid
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormIsMultiJilid(true);
                            setFormJumlahJilid(2);
                            setFormHalamanPerJilid([3, 3]);
                            setFormHalamanGambarPerJilid([['', '', ''], ['', '', '']]);
                            setActiveSetupJilidIdx(0);
                          }}
                          className={`py-2 px-1 text-[10px] font-bold text-center border rounded-lg cursor-pointer ${
                            formIsMultiJilid 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-slate-900' 
                              : 'bg-white text-slate-650 border-slate-200 dark:bg-slate-950 dark:border-slate-800'
                          }`}
                        >
                          Banyak Jilid
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bentuk Materi (Gambar vs Teks vs Google Docs/Slides vs PDF vs Hanya Identitas) */}
                  <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">BENTUK MATERI</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTipeMateri('gambar');
                        }}
                        className={`py-2 px-1 text-[11px] font-bold text-center border rounded-lg cursor-pointer flex items-center justify-center space-x-1 transition-all duration-150 ${
                          tipeMateri === 'gambar' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-slate-900 dark:border-emerald-500' 
                            : 'bg-white text-slate-650 border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50/50'
                        }`}
                      >
                        <FileImage className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-sans">Gambar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipeMateri('teks');
                        }}
                        className={`py-2 px-1 text-[11px] font-bold text-center border rounded-lg cursor-pointer flex items-center justify-center space-x-1 transition-all duration-150 ${
                          tipeMateri === 'teks' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-slate-900 dark:border-emerald-500' 
                            : 'bg-white text-slate-650 border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50/50'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-sans">Teks</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipeMateri('google_doc_slide');
                        }}
                        className={`py-2 px-1 text-[11px] font-bold text-center border rounded-lg cursor-pointer flex items-center justify-center space-x-1 transition-all duration-150 ${
                          tipeMateri === 'google_doc_slide' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-slate-900 dark:border-emerald-500' 
                            : 'bg-white text-slate-650 border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50/50'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-sans">GDocs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipeMateri('pdf');
                        }}
                        className={`py-2 px-1 text-[11px] font-bold text-center border rounded-lg cursor-pointer flex items-center justify-center space-x-1 transition-all duration-150 ${
                          tipeMateri === 'pdf' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-slate-900 dark:border-emerald-500' 
                            : 'bg-white text-slate-650 border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50/50'
                        }`}
                      >
                        <File className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-sans">PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipeMateri('hanya_identitas');
                        }}
                        className={`py-2 px-1 text-[11px] font-bold text-center border rounded-lg cursor-pointer flex items-center justify-center space-x-1 transition-all duration-150 ${
                          tipeMateri === 'hanya_identitas' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-slate-900 dark:border-emerald-500' 
                            : 'bg-white text-slate-650 border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-50/50'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-650 dark:text-amber-400" />
                        <span className="font-sans">Identitas</span>
                      </button>
                    </div>
                  </div>

                  {/* Google Doc & Slide URLs Input Fields for 'google_doc_slide' */}
                  {tipeMateri === 'google_doc_slide' && (
                    <div className="space-y-3.5 border border-indigo-100 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/10 p-4 rounded-xl mt-3">
                      <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-400">
                        <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        <span className="text-xs font-bold leading-none">Pengaturan Tautan Google Docs / Slides</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            📝 Tautan Google Docs (Catatan Teks / Kurikulum)
                          </label>
                          <input
                            type="url"
                            value={nonQuranForm.googleDocUrl}
                            onChange={(e) => setNonQuranForm(prev => ({ ...prev, googleDocUrl: e.target.value }))}
                            placeholder="Contoh: https://docs.google.com/document/d/.../edit"
                            className="mt-1.5 w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-1 leading-snug">
                            Pastikan akses link diatur ke <b>Siapa saja yang memiliki link</b> (Minimal Viewer).
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            📊 Tautan Google Slides (Materi Presentasi)
                          </label>
                          <input
                            type="url"
                            value={nonQuranForm.googleSlideUrl}
                            onChange={(e) => setNonQuranForm(prev => ({ ...prev, googleSlideUrl: e.target.value }))}
                            placeholder="Contoh: https://docs.google.com/presentation/d/.../edit"
                            className="mt-1.5 w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-1 leading-snug">
                            Pastikan akses link diatur ke <b>Siapa saja yang memiliki link</b> (Minimal Viewer).
                          </p>
                        </div>
                      </div>

                      {/* Live Previews for Google Docs/Slides */}
                      {(getGoogleDocPreviewUrl(nonQuranForm.googleDocUrl) || getGoogleSlidePreviewUrl(nonQuranForm.googleSlideUrl)) && (
                        <div className="mt-4 p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-lg space-y-2.5">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Pratinjau Dokumen Google (Halaman Awal)
                          </span>
                          <p className="text-[9px] text-slate-400 leading-snug">
                            Jika pratinjau tampil kosong atau meminta login, pastikan akses link dokumen di Google Drive Anda telah diatur ke <b>"Siapa saja yang memiliki link"</b> agar siswa dapat membacanya.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {getGoogleDocPreviewUrl(nonQuranForm.googleDocUrl) && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">📄 Google Docs Preview</span>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 h-52 relative">
                                  <iframe 
                                    src={getGoogleDocPreviewUrl(nonQuranForm.googleDocUrl)} 
                                    className="w-full h-full" 
                                    title="Google Docs Preview"
                                  />
                                </div>
                              </div>
                            )}
                            {getGoogleSlidePreviewUrl(nonQuranForm.googleSlideUrl) && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">📊 Google Slides Preview</span>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 h-52 relative">
                                  <iframe 
                                    src={getGoogleSlidePreviewUrl(nonQuranForm.googleSlideUrl)} 
                                    className="w-full h-full" 
                                    title="Google Slides Preview"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PDF Upload and Preview Area */}
                  {tipeMateri === 'pdf' && (
                    <div className="space-y-4 border border-indigo-100 dark:border-indigo-950 bg-indigo-50/10 dark:bg-indigo-950/5 p-4 rounded-xl mt-3">
                      <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-400">
                        <UploadCloud className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        <span className="text-xs font-bold leading-none">Upload File Modul PDF</span>
                      </div>

                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-xl p-5 text-center bg-white dark:bg-slate-950 relative hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <input 
                            type="file" 
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("Ukuran file PDF terlalu besar (maksimal 2MB untuk menjamin kinerja dan penyimpanan cloud yang optimal).");
                                  return;
                                }
                                setPdfFileName(file.name);
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setPdfBase64(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="space-y-2">
                            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-350">
                              {pdfFileName ? `File Terpilih: ${pdfFileName}` : "Pilih atau Seret File PDF ke Sini"}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Format file: PDF (Maksimal 2MB)
                            </p>
                          </div>
                        </div>

                        {pdfBase64 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">📖 Pratinjau Dokumen PDF</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPdfFileName('');
                                  setPdfBase64('');
                                }}
                                className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                              >
                                Hapus File PDF
                              </button>
                            </div>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 h-80 relative">
                              <iframe 
                                src={pdfBase64} 
                                className="w-full h-full" 
                                title="PDF Document Preview"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Copyright / Hanya Identitas fields */}
                  {tipeMateri === 'hanya_identitas' && (
                    <div className="space-y-4 border border-amber-100 dark:border-amber-950/60 bg-amber-50/10 dark:bg-amber-950/5 p-4 rounded-xl mt-3">
                      <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold leading-none">Identitas Kitab / Modul Berhak Cipta</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Gunakan tipe ini jika modul yang Anda ajarkan memiliki hak cipta yang tidak boleh disebarluaskan atau diunggah gambarnya dalam aplikasi. Guru Halaqah nanti cukup memasukkan nomor halaman capaian dan catatan bimbingan saja saat input setoran harian.
                      </p>
                    </div>
                  )}

                  {/* Penulis / Mushannif Section - Consistently available for all non-Quran materials and wide layout */}
                  <div className="space-y-4 border border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10 p-4 rounded-xl mt-3.5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                      <label className="block text-[10px] font-extrabold text-slate-650 dark:text-slate-300 uppercase tracking-wider">
                        ✍️ Penulis / Mushannif / Penyusun
                      </label>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                        Tulis gelar menggunakan koma (contoh: Abu Ya'la Kurnaedi, Lc). Gunakan tombol dibawah jika ada lebih dari 1 penulis.
                      </span>
                    </div>
                    
                    <div className="space-y-2 max-w-full">
                      {formAuthors.map((author, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-2 rounded-lg min-w-[28px] text-center">
                            {idx + 1}
                          </div>
                          <input
                            type="text"
                            value={author}
                            onChange={(e) => {
                              const updated = [...formAuthors];
                              updated[idx] = e.target.value;
                              setFormAuthors(updated);
                              const joined = updated.map(a => a.trim()).filter(Boolean).join('; ');
                              setNonQuranForm(prev => ({ ...prev, penulisModul: joined }));
                            }}
                            placeholder={idx === 0 ? "Contoh: Abu Ya'la Kurnaedi, Lc (Penulis Utama)" : "Contoh: Syaikh Muhammad bin Shalih Al-Utsaimin (Penulis Tambahan)"}
                            className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                          {formAuthors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formAuthors.filter((_, i) => i !== idx);
                                setFormAuthors(updated);
                                const joined = updated.map(a => a.trim()).filter(Boolean).join('; ');
                                setNonQuranForm(prev => ({ ...prev, penulisModul: joined }));
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                              title="Hapus Penulis"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormAuthors([...formAuthors, ''])}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center space-x-1.5 pt-1 px-1 transition-colors"
                      >
                        <span className="text-sm leading-none">+</span>
                        <span>Tambah Penulis Tambahan (Mushannif Lainnya)</span>
                      </button>
                    </div>

                    {/* Other Metadata in a 2-Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          🏢 Penerbit / Penerjemah
                        </label>
                        <input
                          type="text"
                          value={nonQuranForm.penerbitModul || ''}
                          onChange={(e) => setNonQuranForm(prev => ({ ...prev, penerbitModul: e.target.value }))}
                          placeholder="Penerbit Darul Haq / Muassasah"
                          className="mt-1.5 w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none animate-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          📅 Tahun Terbit / Cetakan
                        </label>
                        <input
                          type="text"
                          value={nonQuranForm.tahunTerbit || ''}
                          onChange={(e) => setNonQuranForm(prev => ({ ...prev, tahunTerbit: e.target.value }))}
                          placeholder="1445 H / Cetakan Ke-3"
                          className="mt-1.5 w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none animate-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        📚 Total Halaman &amp; Deskripsi Cakupan Bab
                      </label>
                      <textarea
                        rows={2}
                        value={nonQuranForm.deskripsiIdentitas || ''}
                        onChange={(e) => setNonQuranForm(prev => ({ ...prev, deskripsiIdentitas: e.target.value }))}
                        placeholder="Terdiri dari 150 halaman. Cakupan bahasan Aqidah Thahawiyah bab iman, syafa'at, dan sifat-sifat Allah..."
                        className="mt-1.5 w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none animate-none"
                      />
                    </div>

                    {/* ==========================================
                        COVER UPLOAD COMPONENT FOR MODULE IDENTITAS
                        ========================================== */}
                    <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-900 pt-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="p-1 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono">
                          🎨 DESAIN SAMPUL
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans">
                          Cover / Sampul Modul Pembelajaran
                        </h4>
                      </div>

                      {!formIsMultiJilid ? (
                        <div className="flex items-center space-x-4">
                          <div className="relative w-24 h-32 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-850 flex flex-col items-center justify-center overflow-hidden shrink-0 group shadow-inner">
                            {formCoverModul ? (
                              <>
                                <img src={formCoverModul} alt="Cover Modul" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setFormCoverModul('')}
                                  className="absolute inset-0 bg-rose-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center text-white text-[10px] font-black cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mb-1 text-rose-300" />
                                  Hapus Cover
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-2 text-slate-400 dark:text-slate-600">
                                <BookOpen className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                <span className="text-[8px] font-semibold block leading-tight">Belum Ada Sampul</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Unggah Sampul Utama (Single Jilid)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setFormCoverModul(event.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="block w-full text-xs text-slate-500
                                file:mr-3 file:py-1.5 file:px-3
                                file:rounded-xl file:border-0
                                file:text-[10px] file:font-black
                                file:bg-emerald-50 file:text-emerald-700
                                hover:file:bg-emerald-100
                                dark:file:bg-emerald-950/20 dark:file:text-emerald-400 cursor-pointer"
                            />
                            <p className="text-[9px] text-slate-400 leading-normal">
                              Rekomendasi rasio portrait (3:4 atau 2:3). Gambar ini akan ditampilkan di pustaka guru dan siswa.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Modul ini diset sebagai <strong className="text-slate-700 dark:text-slate-300">Multijilid ({formJumlahJilid} Jilid)</strong>. Silakan unggah cover untuk masing-masing jilid di bawah ini agar rapi secara visual:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {Array.from({ length: formJumlahJilid }).map((_, jIdx) => {
                              const jilidCover = formCoverModulPerJilid[jIdx] || '';
                              return (
                                <div key={jIdx} className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-150 dark:border-slate-900 flex flex-col items-center space-y-2">
                                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 font-mono uppercase tracking-wider">
                                    Sampul Jilid {jIdx + 1}
                                  </span>
                                  <div className="relative w-20 h-28 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center overflow-hidden group shadow-sm">
                                    {jilidCover ? (
                                      <>
                                        <img src={jilidCover} alt={`Cover Jilid ${jIdx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setFormCoverModulPerJilid(prev => {
                                              const copy = [...prev];
                                              copy[jIdx] = '';
                                              return copy;
                                            });
                                          }}
                                          className="absolute inset-0 bg-rose-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mb-1 text-rose-300" />
                                          Hapus
                                        </button>
                                      </>
                                    ) : (
                                      <div className="text-center p-1 text-slate-400 dark:text-slate-600">
                                        <BookOpen className="w-5 h-5 mx-auto mb-1 opacity-40" />
                                        <span className="text-[8px] block">No Cover</span>
                                      </div>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          setFormCoverModulPerJilid(prev => {
                                            const copy = [...prev];
                                            while (copy.length <= jIdx) copy.push('');
                                            copy[jIdx] = event.target?.result as string;
                                            return copy;
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="block w-full text-[9px] text-slate-400
                                      file:mr-0 file:py-1 file:px-2 file:w-full
                                      file:rounded-lg file:border-0
                                      file:text-[8px] file:font-bold
                                      file:bg-slate-100 file:text-slate-700
                                      hover:file:bg-slate-200
                                      dark:file:bg-slate-800 dark:file:text-slate-300 cursor-pointer"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {showManageCategories && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 mt-2 animate-fade-in text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-750 dark:text-slate-350 uppercase tracking-wider">
                          Daftar Kategori Tersedia ({categories.length})
                        </span>
                      </div>
                      
                      {/* Flex list of current categories with tag representation & trash bin */}
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <div 
                            key={cat} 
                            className="inline-flex items-center space-x-1 pl-2.5 pr-1 py-1 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800/80 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-350"
                          >
                            <span>{cat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-full transition hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                              title={`Hapus kategori "${cat}"`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add new category form */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Nama Kategori Baru... (misal: Tajwid, Adab)"
                          value={newCategoryInput}
                          onChange={(e) => setNewCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCategory();
                            }
                          }}
                          className="flex-1 p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Multi-Jilid controls: How many volumes? */}
                  {formIsMultiJilid && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest">JUMLAH JILID / VOLUME *</label>
                          <p className="text-[10px] text-slate-400">Tentukan total jilid modul (maksimal 10)</p>
                        </div>
                        <input
                          type="number"
                          min="2"
                          max="10"
                          value={formJumlahJilid}
                          onChange={(e) => handleJumlahJilidChange(Number(e.target.value))}
                          className="w-16 p-2 text-center border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500 dark:bg-slate-950"
                        />
                      </div>
                    </div>
                  )}
                                          {/* Custom Page Counts, Image Uploads / Text contents, and Uraian per page */}
                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-950 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-900 pb-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Atur Konten &amp; Penjelasan Halaman</span>
                        <p className="text-[9px] text-slate-405">Tentukan materi &amp; keterangan per halaman di bawah ini</p>
                      </div>
                      
                      {formIsMultiJilid && (
                        <div className="flex space-x-1.5 overflow-x-auto max-w-[2400px]">
                          {Array.from({ length: formJumlahJilid }).map((_, jKey) => (
                            <button
                              key={jKey}
                              type="button"
                              onClick={() => {
                                setActiveSetupJilidIdx(jKey);
                              }}
                              className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer ${
                                activeSetupJilidIdx === jKey
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-50 text-slate-650 dark:bg-slate-900'
                              }`}
                            >
                              Jilid {jKey + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-1">
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          JUMLAH HALAMAN {formIsMultiJilid ? `JILID ${activeSetupJilidIdx + 1}` : 'TUNGGAL'} *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="150"
                          value={formHalamanPerJilid[activeSetupJilidIdx] || 3}
                          onChange={(e) => handlePageCountChange(activeSetupJilidIdx, Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-950"
                        />
                      </div>
                      <div className="flex items-end text-[9px] text-slate-405 pb-2">
                        <span>
                          {tipeMateri === 'gambar' 
                            ? 'Upload gambar scan materi asli untuk setiap slot halaman di bawah ini.' 
                            : 'Ketik isi naskah pelajaran untuk setiap halaman di bawah ini.'}
                        </span>
                      </div>
                    </div>

                    {/* Checkbox to enable line counts per page */}
                    <div className="space-y-3 bg-indigo-50/30 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="useJumlahBarisPerHalaman"
                            checked={useJumlahBarisPerHalaman}
                            onChange={(e) => setUseJumlahBarisPerHalaman(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="useJumlahBarisPerHalaman" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                            Tentukan Jumlah Baris untuk Setiap Halaman
                          </label>
                        </div>
                        {useJumlahBarisPerHalaman && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                            Auto Rubrik Terhubung
                          </span>
                        )}
                      </div>

                      {/* Konfigurasi Jumlah Baris per Halaman */}
                      {useJumlahBarisPerHalaman && (
                        <div className="space-y-3 pt-2 border-t border-indigo-100/60 dark:border-indigo-900/40 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              Konfigurasi Jumlah Baris per Halaman
                            </span>
                            <span className="text-[9.5px] text-slate-500">Otomatis terhubung ke Sistem Penilaian Otomatis</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                              <label className="block text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                                Default Baris per Halaman *
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={formDefaultLinesPerPage}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFormDefaultLinesPerPage(val === '' ? '' : Number(val));
                                  }}
                                  className="w-20 p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-slate-500 font-medium">baris / halaman</span>
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1">
                                Standar umum seluruh halaman di modul ini.
                              </span>
                            </div>

                            <div className="p-2 bg-indigo-50/40 dark:bg-indigo-950/30 rounded border border-indigo-100 dark:border-indigo-900/40 text-[10.5px] text-slate-600 dark:text-slate-400 flex flex-col justify-center">
                              <span>💡 Seluruh halaman akan otomatis dihitung <strong>{formDefaultLinesPerPage || 15} baris</strong>, kecuali halaman yang ditambahkan pada daftar pengecualian khusus di bawah.</span>
                            </div>
                          </div>

                          {/* Pengecualian Baris Halaman Khusus */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Pengecualian Baris Halaman Khusus ({formCustomPageLines.length})
                              </label>
                              <span className="text-[9px] text-slate-400 italic">
                                Khusus halaman dengan jumlah baris berbeda (misal halaman judul/puisi)
                              </span>
                            </div>

                            {/* Input Form Tambah Pengecualian */}
                            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] font-bold text-slate-500">Halaman:</span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Hal"
                                  value={newNonQuranExPage}
                                  onChange={(e) => setNewNonQuranExPage(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-16 p-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] font-bold text-slate-500">Baris:</span>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Baris"
                                  value={newNonQuranExLines}
                                  onChange={(e) => setNewNonQuranExLines(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-16 p-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              {formIsMultiJilid && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-[10px] font-bold text-slate-500">Jilid:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="Semua"
                                    value={newNonQuranExJilid}
                                    onChange={(e) => setNewNonQuranExJilid(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-16 p-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                                  />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (newNonQuranExPage === '' || Number(newNonQuranExPage) < 1) {
                                    alert('Nomor halaman wajib diisi.');
                                    return;
                                  }
                                  if (newNonQuranExLines === '' || Number(newNonQuranExLines) < 1) {
                                    alert('Jumlah baris wajib diisi.');
                                    return;
                                  }
                                  const pageNum = Number(newNonQuranExPage);
                                  const linesNum = Number(newNonQuranExLines);
                                  const jilidNum = newNonQuranExJilid === '' ? undefined : Number(newNonQuranExJilid);

                                  setFormCustomPageLines(prev => {
                                    const filtered = prev.filter(
                                      x => !(x.page === pageNum && x.jilid === jilidNum)
                                    );
                                    return [...filtered, { page: pageNum, lines: linesNum, jilid: jilidNum }].sort((a, b) => a.page - b.page);
                                  });
                                  setNewNonQuranExPage('');
                                  setNewNonQuranExLines('');
                                }}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition cursor-pointer ml-auto"
                              >
                                + Tambah Pengecualian
                              </button>
                            </div>

                            {/* Exception list table/chips */}
                            {formCustomPageLines.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                                {formCustomPageLines.map((ex, exIdx) => (
                                  <div
                                    key={exIdx}
                                    className="flex items-center justify-between p-1.5 px-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                                  >
                                    <span className="text-slate-700 dark:text-slate-200 truncate">
                                      Hal {ex.page}{ex.jilid ? ` (Jld ${ex.jilid})` : ''}: <strong className="text-indigo-600 dark:text-indigo-400">{ex.lines} baris</strong>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormCustomPageLines(prev => prev.filter((_, i) => i !== exIdx));
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-rose-500 transition cursor-pointer ml-1"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">
                                Belum ada pengecualian. Seluruh halaman modul ini akan menggunakan {formDefaultLinesPerPage || 15} baris.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image uploads or Text inputs slot grids */}
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-2">
                      <span className="block text-[9px] font-bold text-slate-405 uppercase tracking-wide">
                        KONTEN PER HALAMAN JILID INI ({formHalamanPerJilid[activeSetupJilidIdx] || 0})
                      </span>
                      <div className="grid grid-cols-1 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                        {Array.from({ length: formHalamanPerJilid[activeSetupJilidIdx] || 3 }).map((_, pKey) => {
                          const activeImg = formHalamanGambarPerJilid[activeSetupJilidIdx]?.[pKey] || '';
                          const activePenjelasan = formPenjelasanHalamanPerJilid[activeSetupJilidIdx]?.[pKey] || '';
                          const activeTeks = formTeksHalamanPerJilid[activeSetupJilidIdx]?.[pKey] || '';
                          const hasImg = activeImg.length > 0;

                          return (
                            <div 
                              key={pKey}
                              className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono bg-indigo-100 dark:bg-indigo-950/70 font-bold text-indigo-750 dark:text-indigo-300 p-1 px-2 rounded text-[10px]">
                                    Halaman {pKey + 1}
                                  </span>
                                  {tipeMateri === 'gambar' && (
                                    <span className="text-[10px] text-slate-400">
                                      {hasImg ? '✓ Gambar diupload' : '⚠ Belum diupload'}
                                    </span>
                                  )}
                                </div>

                                {tipeMateri === 'gambar' && (
                                  <div className="flex items-center space-x-1 shrink-0">
                                    {hasImg ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePageImg(activeSetupJilidIdx, pKey)}
                                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded cursor-pointer"
                                        title="Hapus gambar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <label className="p-1 px-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-[9px] font-bold text-slate-650 dark:text-slate-300 cursor-pointer transition">
                                        Upload Gambar
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              uuidPageImageUpload(activeSetupJilidIdx, pKey, file);
                                            }
                                          }}
                                          className="hidden"
                                        />
                                      </label>
                                    )}
                                  </div>
                                )}
                              </div>

                              {tipeMateri === 'gambar' && hasImg && (
                                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                                  <img 
                                    src={activeImg} 
                                    alt={`Preview Halaman ${pKey + 1}`} 
                                    className="w-full h-full object-contain" 
                                  />
                                </div>
                              )}

                              {tipeMateri === 'teks' && (
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-550 uppercase tracking-wider">TEKS UTAMA HALAMAN *</label>
                                  <RichTextEditor
                                    value={activeTeks}
                                    onChange={(val) => {
                                      setFormTeksHalamanPerJilid(prev => {
                                        const copy = [...prev];
                                        if (!copy[activeSetupJilidIdx]) copy[activeSetupJilidIdx] = [];
                                        copy[activeSetupJilidIdx][pKey] = val;
                                        return copy;
                                      });
                                    }}
                                    nonQuranFonts={nonQuranFonts || []}
                                  />
                                </div>
                              )}

                              {/* Per page explanation: "Dan URAIAN MATERI/PENJELASAN SINGKAT buatkan per halaman" */}
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">URAIAN MATERI / PENJELASAN SINGKAT HALAMAN INI</label>
                                <input
                                  type="text"
                                  value={activePenjelasan}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFormPenjelasanHalamanPerJilid(prev => {
                                      const copy = [...prev];
                                      if (!copy[activeSetupJilidIdx]) copy[activeSetupJilidIdx] = [];
                                      copy[activeSetupJilidIdx][pKey] = val;
                                      return copy;
                                    });
                                  }}
                                  placeholder="Ketik rincian pelajaran / penjelasan singkat khusus untuk halaman ini..."
                                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    </div>
                </>
              )}

              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg">
                  {formError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCancelOrBack}
                  className="px-4 py-2.5 hover:bg-slate-200 bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Batal &amp; Kembali ke Daftar Modul</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    onClick={() => {
                      navigateNextAfterSaveRef.current = false;
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingModulId ? 'Simpan Perubahan Modul' : 'Buat Modul Rujukan'}</span>
                  </button>
                  {editingModulId && newModulTipe === TipeModul.AL_QURAN && (() => {
                    const currNo = Number(quranForm.nomorUrutSurat);
                    const nextModul = moduls.find(m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === currNo + 1);
                    if (!nextModul) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          navigateNextAfterSaveRef.current = true;
                          const formElem = document.getElementById('modul-editor-form') as HTMLFormElement;
                          if (formElem) formElem.requestSubmit();
                        }}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
                        title={`Simpan perubahan dan langsung lanjut edit Surah berikutnya: No. ${nextModul.nomorUrutSurat} ${nextModul.namaSurat}`}
                      >
                        <span>Simpan &amp; Lanjut No. {nextModul.nomorUrutSurat}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })()}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus modul/rujukan <strong>{confirmDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteModul(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Google Fonts Search & Discovery Modal */}
      {showGoogleFontModal && (() => {
        const type = showGoogleFontModal;
        const presets = type === 'arab' ? GOOGLE_FONTS_PRESETS.arab : GOOGLE_FONTS_PRESETS.latin;
        
        // Filter presets by search
        const filteredPresets = presets.filter(p => 
          p.name.toLowerCase().includes(searchGoogleFontQuery.toLowerCase()) ||
          p.desc.toLowerCase().includes(searchGoogleFontQuery.toLowerCase())
        );

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
            <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-905 my-auto flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900">
                <div className="flex items-center space-x-2">
                  <span className="p-1 px-2.5 bg-indigo-100 dark:bg-indigo-950/65 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                    {type === 'arab' ? 'Google Fonts Arab' : 'Google Fonts Latin'}
                  </span>
                  <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                    Eksplorasi &amp; Tambah Google Font
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowGoogleFontModal(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-explanation */}
              <div className="my-3 text-xs text-slate-500 leading-relaxed bg-indigo-50/40 dark:bg-slate-900/50 p-3 rounded-xl border border-indigo-150/50 dark:border-slate-900 flex flex-col gap-1">
                <p>
                  Sistem akan menghubungkan dan mengimpor file font langsung dari CDN resmi <strong>Google Fonts</strong> secara dinamis saat Anda menulis atau membuka naskah ajar.
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                  ★ Opsi 1: Klik salah satu preset populer di bawah, atau Opsi 2: Ketik nama font kustom di kolom pencarian lalu usulkan.
                </p>
              </div>

              {/* Search input with custom submission option */}
              <div className="space-y-3 mb-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Cari Preset atau Masukkan Nama Font Kustom Google</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder={type === 'arab' ? 'Cari preset... contoh: Amiri, Cairo, Kufam, dll' : 'Cari preset... contoh: Inter, Poppins, Roboto, dll'}
                        value={searchGoogleFontQuery}
                        onChange={(e) => {
                          setSearchGoogleFontQuery(e.target.value);
                          setCustomGoogleFontInput(e.target.value);
                        }}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-indigo-505 focus:outline-none"
                      />
                    </div>
                    {/* Submission button if search is not a preset but user wishes to register it anyways */}
                    {customGoogleFontInput.trim() && (
                      <button
                        type="button"
                        onClick={async () => {
                          await handleAddGoogleFont(customGoogleFontInput, type);
                          setShowGoogleFontModal(null);
                        }}
                        className="px-4 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambahkan "{customGoogleFontInput.trim()}"</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Discovery Area scrollable */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px]">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Daftar Preset Google Fonts Populer ({filteredPresets.length})</span>
                
                {filteredPresets.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 italic text-xs">
                    <p>Preset font tidak ditemukan untuk pencarian "{searchGoogleFontQuery}".</p>
                    <p className="text-[10px] text-indigo-500 mt-1">Anda bisa memasukkan nama lengkapnya dan menekan tombol "Tambahkan" di samping kanan kolom cari!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {filteredPresets.map(font => {
                      const isAdded = (nonQuranFonts || []).some(
                        f => f.name.toLowerCase() === font.name.toLowerCase() && f.type === type
                      );
                      // Let's load the font dynamically so they can see the layout perfectly!
                      const styleId = `fonts-modal-preview-${font.name.replace(/\s+/g, '-')}`;
                      if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
                        const link = document.createElement('link');
                        link.id = styleId;
                        link.rel = 'stylesheet';
                        link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}&display=swap`;
                        document.head.appendChild(link);
                      }
                      
                      return (
                        <div 
                          key={font.name}
                          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between h-28 ${
                            isAdded 
                              ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/25 dark:border-emerald-900 opacity-80' 
                              : 'bg-slate-50/50 hover:bg-slate-100/50 border-slate-150/60 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-slate-900/80 hover:scale-[1.01]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{font.name}</span>
                              {isAdded && (
                                <span className="p-0.5 px-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-350 text-[8px] font-extrabold rounded-full uppercase">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-450 mt-0.5 line-clamp-2 leading-relaxed">{font.desc}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-2">
                            {/* Live preview */}
                            <span 
                              className="text-xs truncate max-w-[140px] text-indigo-650 dark:text-indigo-400"
                              style={{ fontFamily: font.name }}
                            >
                              {type === 'arab' ? 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ' : 'The quick brown fox jumps'}
                            </span>

                            {!isAdded && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleAddGoogleFont(font.name, type);
                                  setShowGoogleFontModal(null);
                                }}
                                className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-755 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold uppercase transition"
                              >
                                Tambahkan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-900 mt-4">
                <button
                  type="button"
                  onClick={() => setShowGoogleFontModal(null)}
                  className="px-4 py-2 hover:bg-slate-100 bg-slate-50 border border-slate-150 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Tutup Penjelajah Font
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Konfigurasi Baris Mushaf Al-Qur'an (30 Juz) */}
      {isQuranLinesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-900 animate-scale-up my-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                    Konfigurasi Baris Mushaf Al-Qur'an
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Standar 30 Juz &amp; Penilaian Otomatis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuranLinesModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                📖 Standar Mushaf Rasm Utsmani:
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Mushaf Madinah / Standar Indonesia (Kemenag) secara umum terdiri dari <strong>15 baris per halaman</strong>, dengan pengecualian <strong>Halaman 1 (Al-Fatihah)</strong> dan <strong>Halaman 2 (Awal Al-Baqarah)</strong> yang masing-masing terdiri dari <strong>7 baris</strong>.
              </p>
            </div>

            {/* Default Lines Configuration */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Default Baris per Halaman *
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quranModalDefaultLines}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuranModalDefaultLines(val === '' ? '' : Number(val));
                  }}
                  className="w-24 p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-sm font-bold text-center text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-500 font-medium">baris / halaman (Standar umum: 15)</span>
              </div>
            </div>

            {/* Exceptions Section */}
            <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Pengecualian Baris Halaman Khusus ({quranModalCustomLines.length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setQuranModalDefaultLines(15);
                    setQuranModalCustomLines([
                      { page: 1, lines: 7 },
                      { page: 2, lines: 7 }
                    ]);
                  }}
                  className="text-[10px] text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Reset ke Standar Madinah (Hal 1 &amp; 2 = 7 baris)
                </button>
              </div>

              {/* Add Exception Inputs */}
              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold text-slate-500">Halaman:</span>
                  <input
                    type="number"
                    min="1"
                    max="604"
                    placeholder="1-604"
                    value={newQuranExPage}
                    onChange={(e) => setNewQuranExPage(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold text-slate-500">Baris:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Baris"
                    value={newQuranExLines}
                    onChange={(e) => setNewQuranExLines(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (newQuranExPage === '' || Number(newQuranExPage) < 1) {
                      alert('Nomor halaman wajib diisi.');
                      return;
                    }
                    if (newQuranExLines === '' || Number(newQuranExLines) < 1) {
                      alert('Jumlah baris wajib diisi.');
                      return;
                    }
                    const pageNum = Number(newQuranExPage);
                    const linesNum = Number(newQuranExLines);

                    setQuranModalCustomLines(prev => {
                      const filtered = prev.filter(x => x.page !== pageNum);
                      return [...filtered, { page: pageNum, lines: linesNum }].sort((a, b) => a.page - b.page);
                    });
                    setNewQuranExPage('');
                    setNewQuranExLines('');
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition cursor-pointer ml-auto shadow-xs"
                >
                  + Tambah Pengecualian
                </button>
              </div>

              {/* Exception Badges List */}
              {quranModalCustomLines.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {quranModalCustomLines.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="flex items-center justify-between p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-xs"
                    >
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        Hal {ex.page}: <strong className="text-amber-700 dark:text-amber-400">{ex.lines} baris</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQuranModalCustomLines(prev => prev.filter((_, i) => i !== exIdx));
                        }}
                        className="p-0.5 text-slate-400 hover:text-rose-500 transition cursor-pointer ml-1"
                        title="Hapus pengecualian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center py-2">
                  Belum ada pengecualian. Seluruh 604 halaman mushaf akan dihitung {quranModalDefaultLines || 15} baris.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-900">
              <button
                type="button"
                onClick={() => setIsQuranLinesModalOpen(false)}
                className="px-4 py-2 hover:bg-slate-100 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  saveQuranLinesConfig({
                    defaultLinesPerPage: Number(quranModalDefaultLines) || 15,
                    customPageLines: quranModalCustomLines.sort((a, b) => a.page - b.page)
                  });
                  setIsQuranLinesModalOpen(false);
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
              >
                Simpan Konfigurasi Mushaf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DIALOG: PULIHKAN / IMPORT CADANGAN MODUL AL-QUR'AN
         ========================================================= */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                    Pulihkan / Import Data Modul Al-Qur'an
                  </h3>
                  <p className="text-xs text-slate-400">
                    Muat kurikulum surat &amp; ayat dari berkas cadangan (.json atau .xlsx)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isRestoring) return;
                  setIsRestoreModalOpen(false);
                }}
                disabled={isRestoring}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-4">
              {/* Source Tab Selector (when not in preview mode) */}
              {!restorePreview && (
                <div className="flex border-b border-slate-200 dark:border-slate-800 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreSourceTab('local');
                      setRestoreError('');
                    }}
                    className={`flex-1 py-2.5 px-4 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
                      restoreSourceTab === 'local'
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <HardDriveDownload className="w-4 h-4" />
                    <span>Perangkat Lokal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreSourceTab('drive');
                      setRestoreError('');
                      if (getGoogleAccessToken()) {
                        fetchDriveJsonFilesAndFolders(driveRestoreCurrentFolder || 'root');
                      }
                    }}
                    className={`flex-1 py-2.5 px-4 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
                      restoreSourceTab === 'drive'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Google Drive</span>
                  </button>
                </div>
              )}

              {/* File upload zone or Drive selector */}
              {!restorePreview ? (
                <div>
                  {restoreSourceTab === 'local' ? (
                    <div
                      onClick={() => fileInputRestoreRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedFile = e.dataTransfer.files[0];
                        if (droppedFile) {
                          handleFileSelectForRestore(droppedFile);
                        }
                      }}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/60 dark:bg-slate-900/40 group"
                    >
                      <input
                        ref={fileInputRestoreRef}
                        type="file"
                        accept=".json,application/json,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelectForRestore(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Klik untuk memilih berkas cadangan <span className="text-emerald-600 font-extrabold">.json</span> atau <span className="text-amber-600 font-extrabold">.xlsx (Excel)</span> atau seret ke sini
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                        Mendukung berkas cadangan resmi <strong>JSON (.json)</strong> dan Buku Kerja <strong>Excel (.xlsx) 2 Sheet</strong> (Daftar Surat &amp; Detail Teks Ayat).
                      </p>
                    </div>
                  ) : (
                    /* Google Drive Restore Browser */
                    <div className="space-y-3">
                      {!getGoogleAccessToken() ? (
                        <div className="border border-dashed border-blue-200 dark:border-blue-800/80 rounded-2xl p-8 text-center bg-blue-50/40 dark:bg-blue-950/20">
                          <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center mb-3">
                            <Cloud className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Google Drive Belum Terhubung
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                            Hubungkan akun Google Drive Anda untuk memilih berkas cadangan modul Al-Qur'an (.json atau .xlsx) langsung dari cloud tanpa mengunduhnya ke perangkat terlebih dahulu.
                          </p>
                          <button
                            type="button"
                            onClick={handleConnectDriveForRestore}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                          >
                            <Cloud className="w-4 h-4" />
                            <span>Hubungkan Akun Google Drive</span>
                          </button>
                        </div>
                      ) : (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
                          {/* Search bar & Refresh */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Cari berkas cadangan .json atau .xlsx di Google Drive..."
                                value={driveRestoreSearchTerm}
                                onChange={(e) => handleSearchDriveJson(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                              />
                              {driveRestoreSearchTerm && (
                                <button
                                  type="button"
                                  onClick={() => handleSearchDriveJson('')}
                                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => fetchDriveJsonFilesAndFolders(driveRestoreCurrentFolder)}
                              disabled={isDriveRestoreLoading}
                              title="Segarkan daftar berkas Google Drive"
                              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${isDriveRestoreLoading ? 'animate-spin text-blue-600' : ''}`} />
                            </button>
                          </div>

                          {/* Breadcrumbs */}
                          {!driveRestoreSearchTerm && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap pb-1 border-b border-slate-200/60 dark:border-slate-800">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi:</span>
                              {driveRestoreFolderPath.map((item, idx) => (
                                <React.Fragment key={item.id + idx}>
                                  <button
                                    type="button"
                                    onClick={() => handleStepBackRestoreFolder(item.id, idx)}
                                    className={`hover:text-blue-600 hover:underline font-medium transition cursor-pointer ${
                                      idx === driveRestoreFolderPath.length - 1 ? 'font-bold text-slate-800 dark:text-slate-200' : ''
                                    }`}
                                  >
                                    {item.name}
                                  </button>
                                  {idx < driveRestoreFolderPath.length - 1 && (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          )}

                          {/* File / Folder List */}
                          <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                            {isDriveRestoreLoading ? (
                              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                                <span>Menghubungi Google Drive...</span>
                              </div>
                            ) : (
                              <>
                                {/* Subfolders */}
                                {!driveRestoreSearchTerm && driveRestoreSubFolders.length > 0 && (
                                  <div className="space-y-1 mb-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                      Folder ({driveRestoreSubFolders.length})
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {driveRestoreSubFolders.map(folder => (
                                        <button
                                          key={folder.id}
                                          type="button"
                                          onClick={() => handleOpenRestoreFolder(folder)}
                                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-left transition cursor-pointer group"
                                        >
                                          <Folder className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition" />
                                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                            {folder.name}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Backup Files (JSON & Excel) */}
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                    Berkas Cadangan JSON &amp; Excel ({driveJsonFiles.length})
                                  </div>
                                  {driveJsonFiles.length === 0 ? (
                                    <div className="py-6 text-center text-slate-400 text-xs">
                                      <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-1" />
                                      <p className="font-semibold text-slate-600 dark:text-slate-400">Tidak ada berkas .json atau .xlsx ditemukan</p>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        Pastikan Anda telah menyimpan cadangan ke Google Drive atau cari berkas di folder lain.
                                      </p>
                                    </div>
                                  ) : (
                                    driveJsonFiles.map(file => {
                                      const isExcelFile = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') || file.mimeType?.includes('spreadsheet');
                                      return (
                                        <div
                                          key={file.id}
                                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition gap-2"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`p-1.5 rounded-lg shrink-0 ${
                                              isExcelFile
                                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                                            }`}>
                                              {isExcelFile ? (
                                                <FileSpreadsheet className="w-4 h-4" />
                                              ) : (
                                                <FileCode className="w-4 h-4" />
                                              )}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={file.name}>
                                                {file.name}
                                              </p>
                                              <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                                <span className={`font-bold px-1 rounded text-[9px] ${
                                                  isExcelFile
                                                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                                                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                                }`}>
                                                  {isExcelFile ? 'Excel .xlsx' : 'JSON .json'}
                                                </span>
                                                {file.size && (
                                                  <span>{(Number(file.size) / 1024).toFixed(1)} KB</span>
                                                )}
                                                {file.modifiedTime && (
                                                  <span>
                                                    • {new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric'
                                                    })}
                                                  </span>
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleSelectDriveFileForRestore(file)}
                                            disabled={isDriveRestoreLoading}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                                          >
                                            Pilih &amp; Muat
                                          </button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {restoreError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-start gap-2 mt-3 animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{restoreError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Restore Preview & Configuration */
                <div className="space-y-4">
                  {/* File & Backup Info Card */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        (restoreFileInfo?.name || restoreFile?.name || '').toLowerCase().endsWith('.xlsx') || (restoreFileInfo?.name || restoreFile?.name || '').toLowerCase().endsWith('.xls')
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                      }`}>
                        {(restoreFileInfo?.name || restoreFile?.name || '').toLowerCase().endsWith('.xlsx') || (restoreFileInfo?.name || restoreFile?.name || '').toLowerCase().endsWith('.xls') ? (
                          <FileSpreadsheet className="w-5 h-5" />
                        ) : (
                          <FileJson className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {restoreFileInfo?.name || restoreFile?.name}
                          </p>
                          {restoreFileInfo?.source === 'drive' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <Cloud className="w-3 h-3" /> Google Drive
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <HardDriveDownload className="w-3 h-3" /> Perangkat Lokal
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            (restoreFileInfo?.name || restoreFile?.name || '').toLowerCase().endsWith('.xlsx') || (restoreFileInfo?.name || restoreFile?.name || '').toLowerCase().endsWith('.xls')
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {(restoreFileInfo?.name || restoreFile?.name || '').toLowerCase().endsWith('.xlsx') || (restoreFileInfo?.name || restoreFile?.name || '').toLowerCase().endsWith('.xls') ? 'Format Excel 2-Sheet' : 'Format JSON'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {restorePreview.exportDateFormatted
                            ? `Dibuat pada: ${restorePreview.exportDateFormatted}`
                            : `Ukuran: ${(((restoreFileInfo?.size ?? restoreFile?.size) || 0) / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => {
                        setRestorePreview(null);
                        setRestoreFile(null);
                        setRestoreFileInfo(null);
                        setRestoreError('');
                        if (fileInputRestoreRef.current) fileInputRestoreRef.current.value = '';
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Ganti Berkas
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">TOTAL SURAT</span>
                      <span className="text-lg font-extrabold text-emerald-800 dark:text-emerald-200">
                        {restorePreview.summary.totalSurah}
                      </span>
                    </div>
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-center">
                      <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold block">TOTAL AYAT</span>
                      <span className="text-lg font-extrabold text-teal-800 dark:text-teal-200">
                        {restorePreview.summary.totalAyat}
                      </span>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold block">SURAT BARU</span>
                      <span className="text-lg font-extrabold text-blue-800 dark:text-blue-200">
                        {restorePreview.newSurahs.length}
                      </span>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">DIPERBARUI</span>
                      <span className="text-lg font-extrabold text-amber-800 dark:text-amber-200">
                        {restorePreview.existingSurahs.length}
                      </span>
                    </div>
                  </div>

                  {/* Mode Restore Selector */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      PILIH METODE PEMULIHAN
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div
                        onClick={() => !isRestoring && setRestoreMode('merge')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          restoreMode === 'merge'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-slate-800 dark:text-slate-100 ring-1 ring-emerald-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        } ${isRestoring ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'merge'}
                            onChange={() => setRestoreMode('merge')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Gabung &amp; Perbarui (Merge)
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 pl-5 leading-relaxed">
                          Surat yang sudah ada akan diperbarui ayatnya, surat baru akan ditambahkan. Modul lain tidak dihapus. <strong>(Direkomendasikan)</strong>
                        </p>
                      </div>

                      <div
                        onClick={() => !isRestoring && setRestoreMode('replace')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          restoreMode === 'replace'
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-slate-800 dark:text-slate-100 ring-1 ring-rose-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        } ${isRestoring ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'replace'}
                            onChange={() => setRestoreMode('replace')}
                            className="text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Timpa Bersih (Full Replace)
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 pl-5 leading-relaxed">
                          Mengganti seluruh modul Al-Qur'an lama dengan data yang ada pada berkas cadangan ini.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Surah List Preview Accordion / Chips */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>DAFTAR SURAT DALAM BERKAS ({restorePreview.summary.totalSurah} SURAT)</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 scrollbar-thin">
                      {restorePreview.summary.surahList.map((s, idx) => {
                        const isExisting = restorePreview.existingSurahs.some(ex => ex.no === s.no);
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium border ${
                              isExisting
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            <span className="font-bold font-mono">No. {s.no}</span>
                            <span>{s.nama}</span>
                            <span className="opacity-75 text-[9.5px]">({s.ayatCount} ayat)</span>
                            <span className={`text-[9px] px-1 rounded font-bold ${
                              isExisting ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200' : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                            }`}>
                              {isExisting ? 'Update' : 'Baru'}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress bar when restoring */}
                  {isRestoring && restoreProgress && (
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-200">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                          Memulihkan: {restoreProgress.currentSurah}...
                        </span>
                        <span>
                          {restoreProgress.current} dari {restoreProgress.total} Surat
                        </span>
                      </div>
                      <div className="w-full bg-sky-200 dark:bg-sky-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-600 h-full transition-all duration-300"
                          style={{
                            width: `${(restoreProgress.current / restoreProgress.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {restoreSuccessMsg && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{restoreSuccessMsg}</span>
                    </div>
                  )}

                  {/* Error Message */}
                  {restoreError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-start gap-2 animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{restoreError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setRestorePreview(null);
                  setRestoreFile(null);
                  setRestoreFileInfo(null);
                  setRestoreSourceTab('local');
                  setRestoreError('');
                }}
                className="px-4 py-2 hover:bg-slate-100 bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition disabled:opacity-50"
              >
                Batal
              </button>

              {restorePreview && (
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={handleExecuteRestore}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memproses Pemulihan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Konfirmasi &amp; Pulihkan {restorePreview.summary.totalSurah} Surat</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: DRIVE AUTH PROMPT (JIKA BELUM LOGIN GOOGLE)
          ==================================================== */}
      {driveAuthPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Cloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Hubungkan Google Workspace
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Untuk menyimpan berkas kurikulum modul Al-Qur'an langsung ke Google Drive Anda, sistem memerlukan izin akses integrasi Google Drive.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleConnectDriveAndSave(driveAuthPrompt.fileName, driveAuthPrompt.type)}
                className="flex items-center justify-center gap-2.5 w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition duration-150 cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-emerald-100" />
                <span>Hubungkan Google &amp; Simpan ke Drive</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadQuranToDevice(driveAuthPrompt.type);
                  setDriveAuthPrompt(null);
                }}
                className="flex items-center justify-center gap-2.5 w-full p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/80 transition duration-150 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Unduh File ke Perangkat Lokal</span>
              </button>

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
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-lg">
                  <Cloud className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Simpan ke Google Drive</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Tentukan folder &amp; letak berkas disimpan</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  type="button" 
                  onClick={handleReauthDrive} 
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title="Hubungkan ulang atau perbarui token akun Google Anda"
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
              <label className="text-[10px] font-bold text-slate-400 block">Nama Berkas</label>
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
                        Jika akun Google Workspace Anda memiliki Drive Bersama, pastikan email telah ditambahkan sebagai anggota, atau simpan berkas melalui tab <strong>"Drive Saya"</strong>.
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
                        Berkas akan langsung disimpan di folder ini (<strong>{folderPath[folderPath.length - 1]?.name}</strong>). Anda juga dapat membuat folder baru di atas.
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
                className="p-2.5 px-4 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeUploadToDrive}
                disabled={!!uploadingToDrive || isCreatingFolder || (driveLocationTab === 'shared_drives' && !activeSharedDriveId)}
                className="p-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-wider uppercase text-[10px] rounded-xl cursor-pointer disabled:opacity-50 select-none shadow-xs flex items-center gap-1.5"
                title={driveLocationTab === 'shared_drives' && !activeSharedDriveId ? 'Silakan pilih salah satu Drive Bersama terlebih dahulu' : 'Simpan berkas ke lokasi terpilih'}
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
