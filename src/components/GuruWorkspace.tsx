/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { getGoogleAccessToken, signInWithGoogleWorkspace } from './GoogleWorkspace';
import { Cloud, Save, Folder, FolderPlus, FolderOpen, Database } from 'lucide-react';
import { getQuranPageRangeString, getQuranPageNumber } from '../lib/quranPageHelper';
import { getElemenLineCountForPage, calculateTotalLinesForRange } from '../utils/lineCalculation';
import { calculateSetoranRubrikDeductions } from '../utils/tajwidDeduction';
import { getTeacherHalaqahs, normalizeHalaqahKey } from '../utils/studentAttendanceHelper';
import { 
  UserRole, 
  StatusAktif, 
  TipeModul, 
  JenisKelamin, 
  Setoran, 
  Siswa, 
  Guru, 
  Halaqah,
  KategoriKesalahanPageRule,
  ElemenSetting,
  TajwidCategory,
  isElemenAvailableForHalaqah 
} from '../types';
import { Avatar } from './Avatar';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XSquare, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Eye, 
  TrendingUp, 
  BarChart3, 
  ChevronRight, 
  ChevronDown,
  Award, 
  Edit2, 
  Trash2, 
  BookOpen, 
  CheckCircle2, 
  Bell, 
  User, 
  Key, 
  Clock, 
  Check, 
  X, 
  BookMarked,
  HelpCircle,
  FileSpreadsheet,
  Settings,
  Plus,
  LayoutGrid,
  Table,
  PenTool,
  Eraser,
  Sparkles,
  Maximize2,
  Minimize2,
  Home,
  ShieldAlert,
  MessageSquare,
  Phone,
  Camera,
  RefreshCw,
  UserCheck,
  UserX,
  CalendarDays,
  RotateCcw,
  Target,
  Sliders
} from 'lucide-react';
import { AnnouncementBoardWidget } from './AnnouncementBoardWidget';
import { SiswaErrorAnalytics } from './SiswaErrorAnalytics';
import { GuruMurojaahBerpasangan } from "./GuruMurojaahBerpasangan";
import { GuruAbsensi } from "./GuruAbsensi";
import { GuruMutabaah } from "./GuruMutabaah";
import { GuruSiswaHalaqah } from "./GuruSiswaHalaqah";
import { GuruDashboard } from "./GuruDashboard";
import { ImageAnnotationCanvas } from "./ImageAnnotationCanvas";

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

const getEffectiveTipeKesalahan = (
  elemObj: ElemenSetting | undefined,
  activePage: number,
  activeJilid: number = 1
): { tipe: 'lahn_jaliy' | 'lahn_khafiy' | 'dasar' | 'tajwid' | 'all' | 'none'; activeRule?: KategoriKesalahanPageRule } => {
  if (!elemObj) return { tipe: 'all' };

  if ((elemObj.usePageRules || elemObj.tipeKesalahan === 'page_based') && elemObj.pageRules && elemObj.pageRules.length > 0) {
    const matched = elemObj.pageRules.find(rule => {
      const jMatch = !rule.jilidAwal || (activeJilid >= rule.jilidAwal && activeJilid <= (rule.jilidAkhir || rule.jilidAwal));
      const pMatch = activePage >= rule.startPage && activePage <= rule.endPage;
      return jMatch && pMatch;
    });

    if (matched) {
      return { tipe: matched.tipeKesalahan, activeRule: matched };
    }
  }

  const fallback = elemObj.tipeKesalahan === 'page_based' ? 'all' : (elemObj.tipeKesalahan || 'all');
  return { tipe: fallback };
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
      : isKhafiyRule
        ? safeCats.filter(c => c && (c.tipe === 'lahn_khafiy' || c.tipe === 'tajwid' || !c.tipe))
        : safeCats.filter(c => c && (c.tipe === configuredTipe || (c.tipe || '').toLowerCase() === (configuredTipe as string).toLowerCase()));

  return { filteredCategories: cats, configuredTipe, activeRule };
};

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

export const FATIHAH_ANNAS_KAUSAR_ORDER = [
  { no: 1, nama: 'Al-Fatihah', ayatCount: 7 },
  { no: 114, nama: 'An-Nas', ayatCount: 6 },
  { no: 113, nama: 'Al-Falaq', ayatCount: 5 },
  { no: 112, nama: 'Al-Ikhlas', ayatCount: 4 },
  { no: 111, nama: 'Al-Lahab', ayatCount: 5 },
  { no: 110, nama: 'An-Nasr', ayatCount: 3 },
  { no: 109, nama: 'Al-Kafirun', ayatCount: 6 },
  { no: 108, nama: 'Al-Kausar', ayatCount: 3 },
];

export const isPaketFatihahAnnasKausar = (cfg: any): boolean => {
  if (!cfg) return false;
  if (cfg.tahunanMode === 'paket_pemula') return true;
  if (cfg.customQuranOrder === 'fatihah_then_nas_to_kausar') return true;
  if (cfg.isPaketFatihahAnnasKausar) return true;
  const sAwal = (cfg.tahunanSuratAwal || cfg.tahunanMonthlyTargets?.[0]?.suratAwal || '').toLowerCase().replace(/[^a-z]/g, '');
  const sAkhir = (cfg.tahunanSuratAkhir || '').toLowerCase().replace(/[^a-z]/g, '');
  const m1Awal = (cfg.tahunanMonthlyTargets?.[1]?.suratAwal || '').toLowerCase().replace(/[^a-z]/g, '');
  const m0Akhir = (cfg.tahunanMonthlyTargets?.[0]?.suratAkhir || '').toLowerCase().replace(/[^a-z]/g, '');
  
  if (sAwal === 'alfatihah' && (sAkhir === 'alkausar' || m1Awal === 'annas' || m0Akhir === 'annas')) {
    return true;
  }
  return false;
};

// Help helper for format Arabic Font Clean
const formatArabicFontClean = (text: string): string => {
  if (!text) return '';
  return text.replace(/[\s\r\n\u200B\u200C\u200D\u200E\u200F]+$/, '').trim();
};

const toEasternArabicDigits = (num: number): string => {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => digits[parseInt(d)] || d).join('');
};

const SearchableSurahSelect = ({
  value,
  onChange,
  className = ""
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredSurahs = SURAH_LIST.filter(s =>
    s.nama.toLowerCase().includes(search.toLowerCase()) ||
    s.no.toString().includes(search)
  );

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search, isOpen]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const activeEl = containerRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredSurahs.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSurahs[highlightedIndex]) {
        onChange(filteredSurahs[highlightedIndex].nama);
        setIsOpen(false);
        setSearch("");
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block w-full text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-left font-medium ${className}`}
      >
        <span className="truncate">{value || "Pilih Surat..."}</span>
        <span className="text-slate-400 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="p-1.5 border-b border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900 flex items-center gap-1">
            <span className="text-[10px]">🔍</span>
            <input
              type="text"
              placeholder="Cari surat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[11px] p-0 text-slate-800 dark:text-white"
              autoFocus
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-[10px] text-slate-400 hover:text-slate-600">×</button>
            )}
          </div>
          <div ref={containerRef} className="overflow-y-auto flex-1 max-h-48 py-1">
            {filteredSurahs.length > 0 ? (
              filteredSurahs.map((s, idx) => (
                <button
                  key={s.no}
                  type="button"
                  onClick={() => {
                    onChange(s.nama);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] transition ${
                    highlightedIndex === idx
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : value === s.nama
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {s.no}. {s.nama}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-center text-slate-400 text-[10px]">Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchableJilidSelect = ({
  value,
  onChange,
  className = ""
}: {
  value: string | number;
  onChange: (val: string) => void;
  className?: string;
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const options = [1, 2, 3, 4, 5, 6];
  const filtered = options.filter(j =>
    `jilid ${j}`.includes(search.toLowerCase()) ||
    j.toString().includes(search)
  );

  return (
    <div className="relative inline-block w-full text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-left font-medium ${className}`}
      >
        <span className="truncate">{value ? `Jilid ${value}` : "Pilih Jilid..."}</span>
        <span className="text-slate-400 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="p-1.5 border-b border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900 flex items-center gap-1">
            <span className="text-[10px]">🔍</span>
            <input
              type="text"
              placeholder="Cari jilid..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[11px] p-0 text-slate-800 dark:text-white"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 max-h-48 py-1">
            {filtered.length > 0 ? (
              filtered.map(j => (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    onChange(j.toString());
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 text-[11px] transition ${
                    Number(value) === j ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Jilid {j}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-center text-slate-400 text-[10px]">Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchableModulSelect = ({
  modules,
  value,
  onChange,
  className = ""
}: {
  modules: any[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = modules.filter(m =>
    (m.judulModul || m.namaSurat || m.kategoriModul || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedModObj = modules.find(m => m.id === value);
  const displayName = selectedModObj ? (selectedModObj.judulModul || selectedModObj.namaSurat) : "Pilih Modul...";

  return (
    <div className="relative inline-block w-full text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-left font-medium ${className}`}
      >
        <span className="truncate">{displayName}</span>
        <span className="text-slate-400 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="p-1.5 border-b border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900 flex items-center gap-1">
            <span className="text-[10px]">🔍</span>
            <input
              type="text"
              placeholder="Cari modul..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[11px] p-0 text-slate-800 dark:text-white"
              autoFocus
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-[10px] text-slate-400 hover:text-slate-600">×</button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 max-h-48 py-1">
            {filtered.length > 0 ? (
              filtered.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onChange(m.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-105 dark:hover:bg-slate-900 text-[11px] transition ${
                    value === m.id ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {m.judulModul || m.namaSurat} ({m.kategoriModul || m.tipe})
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-center text-slate-400 text-[10px]">Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface EditSetoranModalProps {
  editingSetoranObj: Setoran;
  setEditingSetoranObj: (s: Setoran | null) => void;
  moduls: any[];
  elemenSettings: any[];
  historyPreviewPage: number | null;
  setHistoryPreviewPage: (p: number | null) => void;
  handleSaveEditSetoran: (e: React.FormEvent) => void;
}

const EditSetoranModal: React.FC<EditSetoranModalProps> = ({
  editingSetoranObj,
  setEditingSetoranObj,
  moduls,
  elemenSettings,
  historyPreviewPage,
  setHistoryPreviewPage,
  handleSaveEditSetoran,
}) => {
  const isVisualNonQuran = editingSetoranObj.tipeModul === TipeModul.NON_AL_QURAN;
  const matchedModul = isVisualNonQuran ? moduls.find(m => m.id === editingSetoranObj.modulId) : null;
  const isTextMode = matchedModul?.tipeMateri === 'teks';

  const startPage = editingSetoranObj.nonQuranPageAwal || editingSetoranObj.halaman || 1;
  const endPage = editingSetoranObj.nonQuranPageAkhir || editingSetoranObj.halaman || 1;
  const curHistoryPage = (historyPreviewPage !== null && historyPreviewPage >= startPage && historyPreviewPage <= endPage) ? historyPreviewPage : startPage;

  const jilidIndex = (editingSetoranObj.nonQuranJilid || 1) - 1;
  const pageIdx = curHistoryPage - 1;
  const historyImageSrc = matchedModul && !isTextMode 
    ? (matchedModul.halamanGambarPerJilid?.[jilidIndex]?.[pageIdx] || matchedModul.halamanGambar?.[pageIdx]) 
    : null;

  const hasVisualCanvas = !!historyImageSrc;

  const currentNilai = editingSetoranObj.nilai || '';
  let score: number | '' = '';
  if (currentNilai) {
    const match = String(currentNilai).match(/^(\d+)/);
    if (match) {
      score = Number(match[1]);
    } else {
      if (currentNilai.toLowerCase().includes('mumtaz')) score = 95;
      else if (currentNilai.toLowerCase().includes('jayyid jiddan')) score = 85;
      else if (currentNilai.toLowerCase().includes('jayyid')) score = 75;
      else if (currentNilai.toLowerCase().includes('maqbul')) score = 65;
      else if (currentNilai.toLowerCase().includes('rasib') || currentNilai.toLowerCase().includes('murojaah')) score = 50;
    }
  }

  const matchedElemen = elemenSettings.find(e => 
    e.id === editingSetoranObj?.jenisSetoran?.toLowerCase() || 
    e.nama?.toLowerCase() === editingSetoranObj?.jenisSetoran?.toLowerCase()
  );

  const getMatchedPredicateForEditing = (s: number | '') => {
    if (s === '') {
      return { predikat: '-', lulus: false };
    }
    const numericScore = typeof s === 'number' ? s : (Number(s) || 0);
    const predicates = matchedElemen?.rubrikPredikat || [
      { minScore: 95, maxScore: 100, predikat: 'Mumtaz', lulus: true },
      { minScore: 85, maxScore: 94, predikat: 'Jayyid Jiddan', lulus: true },
      { minScore: 75, maxScore: 84, predikat: 'Jayyid', lulus: true },
      { minScore: 60, maxScore: 74, predikat: 'Maqbul', lulus: true },
      { minScore: 0, maxScore: 59, predikat: 'Murojaah / Rasib', lulus: false },
    ];
    return predicates.find(p => numericScore >= p.minScore && numericScore <= p.maxScore) || {
      predikat: numericScore >= 60 ? 'Maqbul' : 'Murojaah / Rasib',
      lulus: numericScore >= 60
    };
  };

  const matched = getMatchedPredicateForEditing(score);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className={`bg-white dark:bg-slate-950 rounded-2xl w-full p-5 shadow-2xl relative border border-slate-150 dark:border-slate-800 flex flex-col justify-between my-8 text-xs font-semibold ${
        hasVisualCanvas ? 'max-w-4xl' : 'max-w-sm'
      }`}>
        
        <div className="flex items-center justify-between mb-3 border-b pb-2 shrink-0">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            {hasVisualCanvas ? 'Detail & Evaluasi Visual Setoran' : 'Edit Penilaian Setoran'}
          </h4>
          <button type="button" onClick={() => setEditingSetoranObj(null)} className="p-1 hover:bg-slate-101 dark:hover:bg-slate-900 rounded-lg">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className={`grid grid-cols-1 ${hasVisualCanvas ? 'md:grid-cols-12' : ''} gap-5 overflow-y-auto max-h-[75vh] p-1`}>
          {hasVisualCanvas && (
            <div className="md:col-span-7 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center space-y-3">
              <div className="flex items-center justify-between w-full px-1">
                <button
                  type="button"
                  disabled={curHistoryPage <= startPage}
                  onClick={() => setHistoryPreviewPage(curHistoryPage - 1)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block font-sans">
                  Halaman {curHistoryPage} ({matchedModul?.judulModul})
                </span>
                <button
                  type="button"
                  disabled={curHistoryPage >= endPage}
                  onClick={() => setHistoryPreviewPage(curHistoryPage + 1)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
              
              <div className="w-full">
                <ImageAnnotationCanvas 
                  imageSrc={historyImageSrc || ''} 
                  pageNumber={curHistoryPage} 
                  readOnly={true} 
                  readOnlyStrokes={editingSetoranObj.canvasStrokesKeys}
                  readOnlyPins={editingSetoranObj.canvasPinsKeys}
                />
              </div>
            </div>
          )}

          <div className={`${hasVisualCanvas ? 'md:col-span-5' : ''} flex flex-col justify-between`}>
            <form onSubmit={handleSaveEditSetoran} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">NAMA SISWA / SANTRI</label>
                <input 
                  type="text" 
                  value={editingSetoranObj.siswaNama || ''} 
                  disabled 
                  className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 text-slate-400 cursor-not-allowed font-bold" 
                />
              </div>

              <div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">NILAI</label>
                      {score !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSetoranObj({
                              ...editingSetoranObj,
                              nilai: '',
                              statusLulus: false
                            });
                          }}
                          className="text-[9px] text-rose-500 hover:underline font-bold"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        min={0}
                        max={100}
                        value={score}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          if (rawVal === '') {
                            setEditingSetoranObj({
                              ...editingSetoranObj,
                              nilai: '',
                              statusLulus: false
                            });
                            return;
                          }
                          let newScore = Number(rawVal);
                          if (isNaN(newScore)) {
                            setEditingSetoranObj({
                              ...editingSetoranObj,
                              nilai: '',
                              statusLulus: false
                            });
                            return;
                          }
                          if (newScore < 0) newScore = 0;
                          if (newScore > 100) newScore = 100;
                          const pred = getMatchedPredicateForEditing(newScore);
                          setEditingSetoranObj({
                            ...editingSetoranObj,
                            nilai: `${newScore} (${pred.predikat})`,
                            statusLulus: pred.lulus
                          });
                        }}
                        className="w-full p-2 pr-7 border rounded bg-white dark:bg-slate-900 font-extrabold text-xs"
                      />
                      {score !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSetoranObj({
                              ...editingSetoranObj,
                              nilai: '',
                              statusLulus: false
                            });
                          }}
                          className="absolute right-2 top-2 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">PREDIKAT</label>
                    <div className={`p-2 border rounded font-extrabold text-xs min-h-[34px] flex items-center justify-between ${
                      editingSetoranObj.statusLulus
                        ? 'bg-emerald-50/40 border-emerald-150/40 text-emerald-800 dark:text-emerald-400' 
                        : 'bg-rose-50/40 border-rose-150/40 text-rose-800 dark:text-rose-400'
                    }`}>
                      <span>{matched.predikat}</span>
                      <span className="text-[7px] uppercase font-black px-1.5 py-0.5 rounded tracking-wider text-white" style={{ backgroundColor: editingSetoranObj.statusLulus ? '#10b981' : '#f43f5e' }}>
                        {editingSetoranObj.statusLulus ? 'LULUS' : 'MENGULANG'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">STATUS EVALUASI KELULUSAN</label>
                <div className="flex items-center space-x-3 mt-1.5">
                  <label className="inline-flex items-center text-xs text-slate-705 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="editEvaluate" 
                      checked={!!editingSetoranObj.statusLulus}
                      onChange={() => setEditingSetoranObj({ ...editingSetoranObj, statusLulus: true })}
                      className="mr-1 text-emerald-600 focus:ring-0 whitespace-nowrap" 
                    />
                    Lulus
                  </label>
                  <label className="inline-flex items-center text-xs text-slate-705 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="editEvaluate" 
                      checked={!editingSetoranObj.statusLulus}
                      onChange={() => setEditingSetoranObj({ ...editingSetoranObj, statusLulus: false })}
                      className="mr-1 text-rose-500 focus:ring-0 whitespace-nowrap" 
                    />
                    Ulangi
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">CATATAN MUTABAAH GURU</label>
                <textarea 
                  rows={3} 
                  value={editingSetoranObj.catatanGuru || ''}
                  onChange={(e) => setEditingSetoranObj({ ...editingSetoranObj, catatanGuru: e.target.value })}
                  className="w-full p-2 border rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white" 
                />
              </div>

              <div className="pt-2 flex space-x-2.5 justify-end">
                <button 
                  type="button" 
                  onClick={() => setEditingSetoranObj(null)} 
                  className="p-1 px-4 bg-slate-50 dark:bg-slate-900 dark:text-slate-450 rounded text-slate-500 text-[10px] font-bold uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="p-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

interface GuruWorkspaceProps {
  subTab: string;
  setActiveTab?: (tab: string) => void;
}

interface AttendanceEntry {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  siswaNama: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  catatan: string;
}

const DEFAULT_EMPTY_HALAQAH: Halaqah = {
  id: "",
  namaHalaqah: "Halaqah Bimbingan",
  guruPembimbingId: "",
  guruPembimbingNama: "",
  kapasitasPeserta: 10,
  keterangan: "",
  status: StatusAktif.AKTIF,
  warnaIdentitas: "#10B981"
};

export const GuruWorkspace: React.FC<GuruWorkspaceProps> = ({ subTab, setActiveTab }) => {
  const { 
    currentSession, 
    selectedGuruHalaqahId,
    setSelectedGuruHalaqahId,
    gurus, 
    siswas, 
    halaqahs, 
    kelases, 
    setorans, 
    moduls, 
    elemenSettings,
    masterPenalties,
    tajwidCategories,
    createSetoran,
    updateSetoran,
    deleteSetoran,
    addLog,
    updateGuru,
    updateHalaqah,
    generalTargets: dbGeneralTargets,
    saveGeneralTargets,
    studentTargets: dbStudentTargets,
    saveStudentTargets,
    guruAttendance,
    saveGuruAttendance,
    studentAttendance,
    saveStudentAttendance,
    guruSchedules,
    murojaahBerpasangans,
    createMurojaahBerpasangan,
    updateMurojaahBerpasangan,
    deleteMurojaahBerpasangan,
    whiteboardCanvas,
    whiteboardPins,
    saveWhiteboardCanvas,
    saveWhiteboardPins,
    quranLinesConfig,
    backupDatabase
  } = useApp();

  // Shadowed localStorage instance linking to persistent central Cloud Firestore backend
  const localStorage = {
    getItem: (key: string): string | null => {
      if (key === 'mh_student_attendance' || key === 'mh_guru_attendance') {
        return (studentAttendance && studentAttendance.length > 0) ? JSON.stringify(studentAttendance) : null;
      }
      if (key === 'mh_student_targets') {
        return (dbStudentTargets && Object.keys(dbStudentTargets).length > 0) ? JSON.stringify(dbStudentTargets) : null;
      }
      if (key === 'mh_general_targets') {
        return (dbGeneralTargets && Object.keys(dbGeneralTargets).length > 0) ? JSON.stringify(dbGeneralTargets) : null;
      }
      return null;
    },
    setItem: (key: string, value: string) => {
      try {
        const parsed = JSON.parse(value);
        if (key === 'mh_student_attendance' || key === 'mh_guru_attendance') saveStudentAttendance(parsed);
        if (key === 'mh_student_targets') saveStudentTargets(parsed);
        if (key === 'mh_general_targets') saveGeneralTargets(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const myUser = currentSession.user;
  const teacherId = myUser?.id || '';
  
  // Find current teacher object
  const myGuruObj = gurus.find(g => g.id === teacherId);
  // Find current teacher's bimbingan halaqah list (there can be multiple!)
  const myHalaqahs = useMemo(() => {
    return getTeacherHalaqahs(halaqahs, myUser, gurus, guruSchedules, siswas);
  }, [halaqahs, myUser, gurus, guruSchedules, siswas]);

  const selectedHalaqahId = selectedGuruHalaqahId || '';
  const setSelectedHalaqahId = (id: string) => {
    setSelectedGuruHalaqahId(id);
  };

  // Keep selectedGuruHalaqahId stable and never forcibly overwrite to myHalaqahs[0]
  useEffect(() => {
    // If selected halaqah was set, ensure it is recorded in local storage
    if (selectedGuruHalaqahId) {
      try {
        localStorage.setItem('mh_selected_guru_halaqah_id', selectedGuruHalaqahId);
        if (teacherId) {
          localStorage.setItem(`mh_selected_guru_halaqah_id_${teacherId}`, selectedGuruHalaqahId);
        }
      } catch {}
    }
  }, [selectedGuruHalaqahId, teacherId]);

  const myHalaqah = useMemo(() => {
    if (selectedHalaqahId) {
      const found = halaqahs.find(h => 
        h.id === selectedHalaqahId || 
        h.namaHalaqah === selectedHalaqahId ||
        normalizeHalaqahKey(h.namaHalaqah) === normalizeHalaqahKey(selectedHalaqahId)
      );
      if (found) return found;

      const foundInMine = myHalaqahs.find(h => 
        h.id === selectedHalaqahId || 
        h.namaHalaqah === selectedHalaqahId ||
        normalizeHalaqahKey(h.namaHalaqah) === normalizeHalaqahKey(selectedHalaqahId)
      );
      if (foundInMine) return foundInMine;
    }
    return myHalaqahs[0] || halaqahs.find(h => h.guruPembimbingId === teacherId) || DEFAULT_EMPTY_HALAQAH;
  }, [selectedHalaqahId, myHalaqahs, halaqahs, teacherId]);

  // Elemen Pembelajaran filtered by active halaqah scope (considers active input halaqah or teacher active halaqah)
  const availableElemenSettings = useMemo(() => {
    if (!elemenSettings || elemenSettings.length === 0) return [];
    const activeTargetHalaqah = (selectedGuruHalaqahId ? halaqahs.find(h => h.id === selectedGuruHalaqahId) : null) || myHalaqah;
    const filtered = elemenSettings.filter(elem => isElemenAvailableForHalaqah(elem, activeTargetHalaqah));
    return filtered.length > 0 ? filtered : elemenSettings;
  }, [elemenSettings, selectedGuruHalaqahId, myHalaqah, halaqahs]);

  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);
  const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);

  const formatTargetRange = (cfg: any) => {
    if (!cfg) return "Belum ditentukan";
    
    // Self-contained inline helper to get surah number
    const getLocalSurahNo = (surahName: string): number => {
      if (!surahName) return 1;
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
      return idx !== -1 ? idx + 1 : 1;
    };

    // Self-contained inline helper to get Juz
    const getLocalJuz = (surahNo: number, ayatNo: number): number => {
      const LOCAL_JUZ_STARTS = [
        { juz: 30, surah: 78, ayat: 1 },
        { juz: 29, surah: 67, ayat: 1 },
        { juz: 28, surah: 58, ayat: 1 },
        { juz: 27, surah: 51, ayat: 31 },
        { juz: 26, surah: 46, ayat: 1 },
        { juz: 25, surah: 41, ayat: 47 },
        { juz: 24, surah: 39, ayat: 32 },
        { juz: 23, surah: 36, ayat: 28 },
        { juz: 22, surah: 33, ayat: 31 },
        { juz: 21, surah: 29, ayat: 46 },
        { juz: 20, surah: 27, ayat: 56 },
        { juz: 19, surah: 25, ayat: 21 },
        { juz: 18, surah: 23, ayat: 1 },
        { juz: 17, surah: 21, ayat: 1 },
        { juz: 16, surah: 18, ayat: 75 },
        { juz: 15, surah: 17, ayat: 1 },
        { juz: 14, surah: 15, ayat: 1 },
        { juz: 13, surah: 12, ayat: 53 },
        { juz: 12, surah: 11, ayat: 6 },
        { juz: 11, surah: 9, ayat: 93 },
        { juz: 10, surah: 8, ayat: 41 },
        { juz: 9, surah: 7, ayat: 88 },
        { juz: 8, surah: 6, ayat: 111 },
        { juz: 7, surah: 5, ayat: 82 },
        { juz: 6, surah: 4, ayat: 148 },
        { juz: 5, surah: 4, ayat: 24 },
        { juz: 4, surah: 3, ayat: 93 },
        { juz: 3, surah: 2, ayat: 253 },
        { juz: 2, surah: 2, ayat: 142 },
        { juz: 1, surah: 1, ayat: 1 }
      ];
      for (const start of LOCAL_JUZ_STARTS) {
        if (surahNo > start.surah) return start.juz;
        if (surahNo === start.surah && ayatNo >= start.ayat) return start.juz;
      }
      return 1;
    };

    const qKey = cfg.activeSTQuarter || 'q1';
    const qModulType = cfg.quarters?.[`${qKey}ModulType`] || cfg.selectedModulType || 'Al-Quran';
    const qNonQuranId = cfg.quarters?.[`${qKey}NonQuranModulId`] || cfg.selectedNonQuranModulId || '';
    
    if (cfg.targetPeriod === 'tahunan') {
      if (qModulType === 'Al-Quran') {
        if (isPaketFatihahAnnasKausar(cfg)) {
          return 'Surat Al-Fatihah & Surat An-Nas s/d Al-Kausar (Urutan: Al-Fatihah ➔ An-Nas s/d Al-Kausar - 8 Surat / 39 Ayat)';
        }

        // Try to get dynamic range from monthly targets first
        let sAwal = cfg.tahunanSuratAwal || 'Al-Fatihah';
        let aAwal = Number(cfg.tahunanAyatAwal || 1);
        let sAkhir = cfg.tahunanSuratAkhir || 'An-Nas';
        let aAkhir = Number(cfg.tahunanAyatAkhir || 6);
        
        if (cfg.tahunanMonthlyTargets) {
          const monthlyTargets = cfg.tahunanMonthlyTargets;
          const duration = cfg.tahunanBulanDuration || 12;
          let firstTarget: any = null;
          let lastTarget: any = null;
          
          for (let i = 0; i < duration; i++) {
            if (monthlyTargets[i] && typeof monthlyTargets[i] === 'object') {
              if (!firstTarget) firstTarget = monthlyTargets[i];
              lastTarget = monthlyTargets[i];
            }
          }
          
          if (firstTarget && lastTarget) {
            sAwal = firstTarget.suratAwal || sAwal;
            aAwal = Number(firstTarget.ayatAwal || 1);
            sAkhir = lastTarget.suratAkhir || sAkhir;
            aAkhir = Number(lastTarget.ayatAkhir || 1);
          }
        }
        
        const sNoAwal = getLocalSurahNo(sAwal);
        const sNoAkhir = getLocalSurahNo(sAkhir);
        const juzAwal = getLocalJuz(sNoAwal, aAwal);
        const juzAkhir = getLocalJuz(sNoAkhir, aAkhir);
        
        const juzRange = juzAwal === juzAkhir ? `Juz ${juzAwal}` : `Juz ${juzAwal} sampai Juz ${juzAkhir}`;
        
        return `Surat ${sAwal} Ayat ${aAwal} sampai Surat ${sAkhir} Ayat ${aAkhir} (${juzRange})`;
      } else {
        const selectedModulObj = moduls.find((m: any) => m.id === qNonQuranId);
        const isSingleJilid = selectedModulObj ? (!selectedModulObj.isMultiJilid || !selectedModulObj.jumlahJilid || selectedModulObj.jumlahJilid <= 1) : false;
        const modulLabel = selectedModulObj ? (selectedModulObj.judulModul || selectedModulObj.namaSurat) : "Selain Al-Quran";
        
        let jAwal = cfg.tahunanJilidAwal || '1';
        let hAwal = cfg.tahunanHalamanAwal || '1';
        let jAkhir = cfg.tahunanJilidAkhir || '1';
        let hAkhir = cfg.tahunanHalamanAkhir || '10';

        if (cfg.tahunanMonthlyTargets) {
          const monthlyTargets = cfg.tahunanMonthlyTargets;
          const duration = cfg.tahunanBulanDuration || 12;
          let firstTarget: any = null;
          let lastTarget: any = null;
          
          for (let i = 0; i < duration; i++) {
            if (monthlyTargets[i] && typeof monthlyTargets[i] === 'object') {
              if (!firstTarget) firstTarget = monthlyTargets[i];
              lastTarget = monthlyTargets[i];
            }
          }
          
          if (firstTarget && lastTarget) {
            jAwal = firstTarget.jilidAwal !== undefined && firstTarget.jilidAwal !== '' ? firstTarget.jilidAwal : jAwal;
            hAwal = firstTarget.halamanAwal !== undefined && firstTarget.halamanAwal !== '' ? firstTarget.halamanAwal : hAwal;
            jAkhir = lastTarget.jilidAkhir !== undefined && lastTarget.jidAkhir !== '' ? lastTarget.jilidAkhir : jAkhir;
            hAkhir = lastTarget.halamanAkhir !== undefined && lastTarget.halamanAkhir !== '' ? lastTarget.halamanAkhir : hAkhir;
          }
        }

        if (isSingleJilid) {
          return `${modulLabel} Halaman ${hAwal} sampai Halaman ${hAkhir}`;
        } else {
          return `Jilid ${jAwal} Halaman ${hAwal} sampai Jilid ${jAkhir} Halaman ${hAkhir}`;
        }
      }
    } else {
      const qName = qKey.toUpperCase();
      if (qModulType === 'Al-Quran') {
        const sAwal = cfg.quarters?.[`${qKey}SuratAwal`] || '-';
        const aAwal = Number(cfg.quarters?.[`${qKey}AyatAwal`] || 1);
        const sAkhir = cfg.quarters?.[`${qKey}SuratAkhir`] || '-';
        const aAkhir = Number(cfg.quarters?.[`${qKey}AyatAkhir`] || 1);
        
        const sNoAwal = getLocalSurahNo(sAwal);
        const sNoAkhir = getLocalSurahNo(sAkhir);
        const juzAwal = getLocalJuz(sNoAwal, aAwal);
        const juzAkhir = getLocalJuz(sNoAkhir, aAkhir);
        const juzRange = sAwal !== '-' && sAkhir !== '-' ? (juzAwal === juzAkhir ? ` (${juzAwal})` : ` (${juzAwal} - ${juzAkhir})`) : '';
        
        return `Kuartal ${qName}: Surat ${sAwal} Ayat ${aAwal} sampai Surat ${sAkhir} Ayat ${aAkhir}${juzRange}`;
      } else {
        const selectedModulObj = moduls.find((m: any) => m.id === qNonQuranId);
        const isSingleJilid = selectedModulObj ? (!selectedModulObj.isMultiJilid || !selectedModulObj.jumlahJilid || selectedModulObj.jumlahJilid <= 1) : false;
        const modulLabel = selectedModulObj ? (selectedModulObj.judulModul || selectedModulObj.namaSurat) : "Selain Al-Quran";
        if (isSingleJilid) {
          return `Kuartal ${qName}: ${modulLabel} Halaman ${cfg.quarters?.[`${qKey}HalamanAwal`] || 1} sampai Halaman ${cfg.quarters?.[`${qKey}HalamanAkhir`] || 10}`;
        } else {
          return `Kuartal ${qName}: Jilid ${cfg.quarters?.[`${qKey}JilidAwal`] || 1} Halaman ${cfg.quarters?.[`${qKey}HalamanAwal`] || 1} sampai Jilid ${cfg.quarters?.[`${qKey}JilidAkhir`] || 1} Halaman ${cfg.quarters?.[`${qKey}HalamanAkhir`] || 10}`;
        }
      }
    }
  };

  const formatTargetPeriod = (cfg: any) => {
    if (!cfg) return "Belum diatur";
    if (cfg.targetPeriod === 'tahunan' || !cfg.targetPeriod) {
      const dur = Number(cfg.tahunanBulanDuration || 12);
      if (dur === 12) return "12 Bulan (1 Tahun Penuh)";
      if (dur === 10) return "10 Bulan (Tahun Ajaran Efektif)";
      if (dur === 6) return "6 Bulan (1 Semester)";
      if (dur === 3) return "3 Bulan (1 Kuartal)";
      if (dur === 1) return "1 Bulan";
      return `${dur} Bulan`;
    } else {
      const qKey = (cfg.activeSTQuarter || 'q1').toLowerCase();
      const qMap: Record<string, string> = {
        q1: "Kuartal 1 (Bulan 1 - 3)",
        q2: "Kuartal 2 (Bulan 4 - 6)",
        q3: "Kuartal 3 (Bulan 7 - 9)",
        q4: "Kuartal 4 (Bulan 10 - 12)",
      };
      return qMap[qKey] || `Kuartal ${qKey.toUpperCase()}`;
    }
  };

  const resolveTargetElement = (cfg: any) => {
    if (!cfg) return { id: '', nama: 'Tahfidz' };
    const targetPeriod = cfg.targetPeriod || 'tahunan';
    const qKey = cfg.activeSTQuarter || 'q1';
    const qElemenId = targetPeriod === 'tahunan'
      ? (cfg.selectedElemenId || cfg.quarters?.[`${qKey}ElemenId`] || '')
      : (cfg.quarters?.[`${qKey}ElemenId`] || cfg.selectedElemenId || '');

    const elemObj = elemenSettings.find((e: any) => 
      e.id === qElemenId || 
      e.nama === qElemenId || 
      e.nama?.toLowerCase().trim() === qElemenId?.toLowerCase().trim()
    );

    const nama = elemObj ? elemObj.nama : (cfg.selectedElemenName || (qElemenId ? qElemenId : 'Tahfidz'));
    const id = elemObj ? elemObj.id : (qElemenId || '');
    return { id, nama };
  };

  const getLatestCapaianNarative = (p: any, cfg: any) => {
    const { id: qElemenId, nama: elementName } = resolveTargetElement(cfg);

    const finishedSetorans = setorans.filter(s => {
      if (s.siswaId !== p.siswa.id || !s.statusLulus) return false;

      // 1. Match configured target element name (case-insensitive) or element ID
      const sElemName = (s.jenisSetoran || '').toLowerCase().trim();
      const targetElemName = elementName.toLowerCase().trim();
      const targetElemId = (qElemenId || '').toLowerCase().trim();
      const isElemMatch = sElemName === targetElemName || (targetElemId && sElemName === targetElemId);
      if (!isElemMatch) return false;

      // 2. Match sub-category "Baru" (contains "baru", e.g., "Baru" or "Hafalan Baru")
      if (cfg?.selectedModulType === 'Al-Quran' || s.tipeModul === TipeModul.AL_QURAN) {
        const sSub = (s.tipeTahfidz || '').toLowerCase().trim();
        const isBaru = !sSub || sSub === 'baru' || sSub === 'hafalan baru' || sSub.includes('baru');
        if (!isBaru) return false;
      }

      return true;
    });

    const sortedSetorans = [...finishedSetorans].sort((a, b) => b.tanggalSetoran.localeCompare(a.tanggalSetoran));
    const latestSetoran = sortedSetorans[0];
    
    if (!latestSetoran) {
      return "Belum ada capaian tercatat";
    }

    if (latestSetoran.tipeModul === TipeModul.AL_QURAN || latestSetoran.suratNama || (latestSetoran.daftarSuratSetoran && latestSetoran.daftarSuratSetoran.length > 0)) {
      const setoranType = latestSetoran.jenisSetoran || latestSetoran.tipeTahfidz || elementName || "Hafalan";
      if (latestSetoran.daftarSuratSetoran && latestSetoran.daftarSuratSetoran.length > 0) {
        const items = latestSetoran.daftarSuratSetoran.map(item => `${item.suratNama} Ayat ${item.ayatAwal}-${item.ayatAkhir}`);
        return `${setoranType}: ${items.join(', ')}`;
      } else if (latestSetoran.suratNama) {
        return `${setoranType}: Surat ${latestSetoran.suratNama} Ayat ${latestSetoran.ayatAwal || 1} sampai ${latestSetoran.ayatAkhir || 1}`;
      }
    } else {
      return `${latestSetoran.modulNama || elementName} Halaman ${latestSetoran.halaman || 1}`;
    }
    return "Belum ada capaian tercatat";
  };
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(`hide_welcome_banner_v2_${teacherId}`) !== 'true';
    } catch {
      return true;
    }
  });

  // ----------------------------------------------------
  // LOCAL STATES
  // ----------------------------------------------------
  const [attendance, setAttendance] = useState<AttendanceEntry[]>(() => {
    const saved = localStorage.getItem('mh_student_attendance') || localStorage.getItem('mh_guru_attendance');
    if (saved) return JSON.parse(saved);
    
    // Seed some initial attendance data for realistic starting rekap
    const seed: AttendanceEntry[] = [];
    const dates = [
      '2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30',
      '2026-04-10', '2026-04-15', '2026-04-20', '2026-04-25',
      '2026-03-05', '2026-03-12', '2026-03-24',
      '2026-01-15', '2026-01-20', '2026-02-10', '2026-02-22',
      '2025-10-12', '2025-10-25', '2025-11-14', '2025-11-28', '2025-12-10'
    ];
    
    // Seed and loop active students
    if (myHalaqah) {
      const myStudentsList = siswas.filter(s => s.halaqahId === myHalaqah.id);
      dates.forEach(d => {
        myStudentsList.forEach(s => {
          // Mostly Hadir, some sick/permission
          const rand = Math.random();
          let status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' = 'Hadir';
          let catatan = '';
          if (rand < 0.05) {
            status = 'Izin';
            catatan = 'Acara Keluarga';
          } else if (rand < 0.10) {
            status = 'Sakit';
            catatan = 'Demam';
          } else if (rand < 0.12) {
            status = 'Alpha';
          }
          seed.push({
            id: `att-${d}-${s.id}`,
            tanggal: d,
            siswaId: s.id,
            siswaNama: s.namaLengkap,
            status,
            catatan
          });
        });
      });
    }
    return seed;
  });

  // Synced from central Cloud Firestore state real-time changes
  useEffect(() => {
    if (studentAttendance && studentAttendance.length > 0) {
      setAttendance(studentAttendance);
    }
  }, [studentAttendance]);



  // General Notification Setting Local states
  const [notifSound, setNotifSound] = useState(true);
  const [notifReport, setNotifReport] = useState(true);

  // Password edit simulator
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Local Database Export States
  const [exportSuccess, setExportSuccess] = useState('');
  const [exportError, setExportError] = useState('');

  // ----------------------------------------------------
  // STUDENTS OF THIS HALAQAH
  // ----------------------------------------------------
  const myStudents = useMemo(() => {
    if (!myHalaqah) return [];
    const halKey = normalizeHalaqahKey(myHalaqah.namaHalaqah);
    return siswas.filter(s => {
      const matchHalaqah = s.halaqahId === myHalaqah.id || 
        (s.halaqahNama && halKey && normalizeHalaqahKey(s.halaqahNama) === halKey);
      return matchHalaqah && s.status === StatusAktif.AKTIF;
    });
  }, [myHalaqah, siswas]);

  const myStudentsAll = useMemo(() => {
    if (!myHalaqah) return [];
    const halKey = normalizeHalaqahKey(myHalaqah.namaHalaqah);
    return siswas.filter(s => {
      const matchHalaqah = s.halaqahId === myHalaqah.id || 
        (s.halaqahNama && halKey && normalizeHalaqahKey(s.halaqahNama) === halKey);
      return matchHalaqah && s.status !== StatusAktif.NON_AKTIF && (s.status as string) !== 'Nonaktif' && (s.status as string) !== 'nonaktif' && (s as any).statusAktif !== false;
    });
  }, [myHalaqah, siswas]);

  // Interactive Target States (Pekanan, Bulanan, Kuartalan, Semesteran, Tahunan)
  const [studentTargets, setStudentTargets] = useState<Record<string, {
    siswaId: string;
    pekanan: string;
    bulanan: string;
    kuartal: string;
    semester: string;
    tahunan: string;
    pekananSelesai: boolean;
    bulananSelesai: boolean;
    kuartalSelesai: boolean;
    semesterSelesai: boolean;
    tahunanSelesai: boolean;
    pekananUmumSelesai?: boolean;
    bulananUmumSelesai?: boolean;
    kuartalUmumSelesai?: boolean;
    semesterUmumSelesai?: boolean;
    tahunanUmumSelesai?: boolean;
    isCustom?: boolean;
    config?: any;
  }>>(() => {
    const saved = localStorage.getItem('mh_student_targets');
    return saved ? JSON.parse(saved) : {};
  });

  // General Targets (Target Umum) applying to all students in this halaqah
  const [generalTargets, setGeneralTargets] = useState<{
    pekanan: string;
    bulanan: string;
    kuartal: string;
    semester: string;
    tahunan: string;
    config?: any;
  }>(() => {
    const saved = localStorage.getItem('mh_general_targets');
    return saved ? JSON.parse(saved) : {
      pekanan: "Target Hafalan Baru: Minimal 1 halaman / 10 ayat per pekan",
      bulanan: "Ujian Murojaah Bulanan: Sabqi & Manzil kelulusan 1 juz berjalan",
      kuartal: "Menyelesaikan Penilaian Kuartalan Teori Tajwid & Makhorijul Huruf",
      semester: "Ujian Tasmi' Ghab Sekali Duduk 1 Juz Penuh di depan Komite",
      tahunan: "Kelulusan Munaqosyah Akbar & Wisuda Khatam Juz 30 / Juz 29",
    };
  });

  // Keep local targets dynamically synchronized from persistent Cloud Firestore real-time snapshots
  useEffect(() => {
    if (dbStudentTargets && Object.keys(dbStudentTargets).length > 0) {
      setStudentTargets(dbStudentTargets);
    }
  }, [dbStudentTargets]);

  useEffect(() => {
    if (dbGeneralTargets && Object.keys(dbGeneralTargets).length > 0) {
      setGeneralTargets(dbGeneralTargets);
    }
  }, [dbGeneralTargets]);

  // Buffer state to keep general and individual target values in-memory while editing, avoiding Firestore writes on typing
  const [editTargetSiswaId, setEditTargetSiswaId] = useState<string>('');
  const [tempGeneral, setTempGeneral] = useState<{
    pekanan: string;
    bulanan: string;
    kuartal: string;
    semester: string;
    tahunan: string;
    config?: any;
  } | null>(null);

  const [tempTarget, setTempTarget] = useState<{
    siswaId: string;
    pekanan: string;
    bulanan: string;
    kuartal: string;
    semester: string;
    tahunan: string;
    pekananSelesai: boolean;
    bulananSelesai: boolean;
    kuartalSelesai: boolean;
    semesterSelesai: boolean;
    tahunanSelesai: boolean;
    pekananUmumSelesai?: boolean;
    bulananUmumSelesai?: boolean;
    kuartalUmumSelesai?: boolean;
    semesterUmumSelesai?: boolean;
    tahunanUmumSelesai?: boolean;
    isCustom?: boolean;
    config?: any;
  } | null>(null);

  const [isStudentPeriodLocked, setIsStudentPeriodLocked] = useState<boolean>(true);
  const [isGeneralPeriodLocked, setIsGeneralPeriodLocked] = useState<boolean>(true);
  const [isGeneralModulLocked, setIsGeneralModulLocked] = useState<boolean>(true);
  const [isStudentModulLocked, setIsStudentModulLocked] = useState<boolean>(true);

  useEffect(() => {
    setIsStudentPeriodLocked(true);
    setIsStudentModulLocked(true);
  }, [editTargetSiswaId]);

  const activeHalaqahGeneralTargets = useMemo(() => {
    if (myHalaqah && myHalaqah.targetConfig) {
      return {
        pekanan: myHalaqah.targetConfigText?.pekanan || '',
        bulanan: myHalaqah.targetConfigText?.bulanan || '',
        kuartal: myHalaqah.targetConfigText?.kuartal || '',
        semester: myHalaqah.targetConfigText?.semester || '',
        tahunan: myHalaqah.targetConfigText?.tahunan || '',
        config: myHalaqah.targetConfig,
      };
    }
    return generalTargets;
  }, [myHalaqah, generalTargets]);

  // Synchronize draft states when base values update or when active halaqah changes
  useEffect(() => {
    if (activeHalaqahGeneralTargets) {
      setTempGeneral(activeHalaqahGeneralTargets);
    }
  }, [myHalaqah?.id, activeHalaqahGeneralTargets]);

  const initShortTermQuarters = () => {
    const q: any = {};
    [1, 2, 3, 4].forEach(num => {
      q[`q${num}`] = {
        hariAwalBelajar: '',
        pekanEfektif: 8,
        pertemuanPerPekan: 3,
        targets: Array.from({ length: 8 }).reduce((acc: any, _, idx) => {
          acc[idx] = {
            pekanan: '',
            harian: Array.from({ length: 3 }).map(() => '')
          };
          return acc;
        }, {})
      };
    });
    return q;
  };

  const formatIndonesianDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return dateStr;

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];

    return `${dayName}, ${day} ${monthName} ${year}`;
  };

  const initTargetConfig = () => {
    return {
      selectedModulType: 'Al-Quran',
      selectedNonQuranModulId: '',
      tahunanMode: 'juz',
      tahunanJuzAwal: '1',
      tahunanJuzAkhir: '30',
      tahunanSuratAwal: 'Al-Fatihah',
      tahunanAyatAwal: '1',
      tahunanSuratAkhir: 'An-Nas',
      tahunanAyatAkhir: '6',
      tahunanJilidAwal: '1',
      tahunanJilidAkhir: '6',
      tahunanHalamanAwal: '1',
      tahunanHalamanAkhir: '40',
      tahunanBulanDuration: 12,
      tahunanMonthlyTargets: {},
      semesters: {
        s1SuratAwal: 'Al-Fatihah', s1AyatAwal: '1', s1SuratAkhir: 'Yasin', s1AyatAkhir: '83',
        s1JilidAwal: '1', s1JilidAkhir: '3', s1HalamanAwal: '1', s1HalamanAkhir: '40',
        s2SuratAwal: 'As-Saffat', s2AyatAwal: '1', s2SuratAkhir: 'An-Nas', s2AyatAkhir: '6',
        s2JilidAwal: '4', s2JilidAkhir: '6', s2HalamanAwal: '1', s2HalamanAkhir: '40',
      },
      quarters: {
        q1SuratAwal: 'Al-Fatihah', q1AyatAwal: '1', q1SuratAkhir: 'Al-Baqarah', q1AyatAkhir: '141',
        q1JilidAwal: '1', q1JilidAkhir: '1', q1HalamanAwal: '1', q1HalamanAkhir: '30',
        q2SuratAwal: 'Al-Baqarah', q2AyatAwal: '142', q2SuratAkhir: 'Ali \'Imran', q2AyatAkhir: '200',
        q2JilidAwal: '2', q2JilidAkhir: '2', q2HalamanAwal: '1', q2HalamanAkhir: '30',
        q3SuratAwal: 'An-Nisa\'', q3AyatAwal: '1', q3SuratAkhir: 'Al-Ma\'idah', q3AyatAkhir: '120',
        q3JilidAwal: '3', q3JilidAkhir: '3', q3HalamanAwal: '1', q3HalamanAkhir: '30',
        q4SuratAwal: 'Al-An\'am', q4AyatAwal: '1', q4SuratAkhir: 'An-Nas', q4AyatAkhir: '6',
        q4JilidAwal: '4', q4JilidAkhir: '4', q4HalamanAwal: '1', q4HalamanAkhir: '30',
      },
      shortTermMode: 'pekanan',
      activeSTQuarter: 'q1',
      activeSTWeek: 0,
      shortTermQuarters: initShortTermQuarters(),
      pekananSuratAwal: 'Al-Fatihah', pekananAyatAwal: '1', pekananSuratAkhir: 'Al-Baqarah', pekananAyatAkhir: '10',
      pekananJilidAwal: '1', pekananJilidAkhir: '1', pekananHalamanAwal: '1', pekananHalamanAkhir: '5',
      harianSuratAwal: 'Al-Fatihah', harianAyatAwal: '1', harianSuratAkhir: 'Al-Fatihah', harianAyatAkhir: '7',
      harianJilidAwal: '1', harianJilidAkhir: '1', harianHalamanAwal: '1', harianHalamanAkhir: '1',
    };
  };

  const [activeConfig, setActiveConfig] = useState<any>(() => {
    return generalTargets?.config || initTargetConfig();
  });

  useEffect(() => {
    if (tempGeneral) {
      if (tempGeneral.config) {
        setActiveConfig(tempGeneral.config);
      } else {
        setActiveConfig(initTargetConfig());
      }
    }
  }, [tempGeneral]);

  const compileTargetStrings = (cfg: any) => {
    let pekanan = "";
    let bulanan = "";
    let kuartal = "";
    let semester = "";
    let tahunan = "";

    if (!cfg) {
      return { pekanan, bulanan, kuartal, semester, tahunan };
    }

    const q = cfg.quarters || {};

    if (cfg.targetPeriod === 'tahunan') {
      const qModulType = cfg.selectedModulType || cfg.quarters?.q1ModulType || 'Al-Quran';
      const qNonQuranId = cfg.selectedNonQuranModulId || cfg.quarters?.q1NonQuranModulId || '';
      const { nama: elementName } = resolveTargetElement(cfg);
      const elemPrefix = elementName ? `${elementName}: ` : '';
      
      const formattedRange = formatTargetRange(cfg);
      tahunan = `Tahunan: [${elemPrefix}${formattedRange}]`;
      kuartal = "";

      pekanan = isPaketFatihahAnnasKausar(cfg) 
        ? "Sesuai Target Bulanan (Urutan: Al-Fatihah ➔ An-Nas s/d Al-Kausar)" 
        : "Sesuai Target Bulanan";
      const monthlyTargets = cfg.tahunanMonthlyTargets || {};
      const duration = cfg.tahunanBulanDuration || 12;
      const items = [];
      const selectedModulObj = moduls.find(m => m.id === qNonQuranId);
      const isSingleJilid = selectedModulObj ? (!selectedModulObj.isMultiJilid || !selectedModulObj.jumlahJilid || selectedModulObj.jumlahJilid <= 1) : false;
      const modulLabel = selectedModulObj ? (selectedModulObj.judulModul || selectedModulObj.namaSurat) : "Selain Al-Quran";

      for (let i = 0; i < duration; i++) {
        const mTarget = monthlyTargets[i];
        if (mTarget) {
          if (typeof mTarget === 'object' && mTarget !== null) {
            if (qModulType === 'Al-Quran') {
              if (mTarget.catatan) {
                items.push(`B${i+1}: [${mTarget.catatan}]`);
              } else if (mTarget.suratAwal === mTarget.suratAkhir) {
                items.push(`B${i+1}: [${mTarget.suratAwal} ${mTarget.ayatAwal || 1}-${mTarget.ayatAkhir || 1}]`);
              } else {
                items.push(`B${i+1}: [${elemPrefix}${mTarget.suratAwal || 'Al-Fatihah'} ${mTarget.ayatAwal || 1} - ${mTarget.suratAkhir || 'Al-Baqarah'} ${mTarget.ayatAkhir || 10}]`);
              }
            } else {
              if (isSingleJilid) {
                items.push(`B${i+1}: [${elemPrefix}${modulLabel} Hal ${mTarget.halamanAwal || 1} - Hal ${mTarget.halamanAkhir || 10}]`);
              } else {
                items.push(`B${i+1}: [${elemPrefix}Jilid ${mTarget.jilidAwal || 1} Hal ${mTarget.halamanAwal || 1} - Jilid ${mTarget.jilidAkhir || 1} Hal ${mTarget.halamanAkhir || 1}]`);
              }
            }
          } else {
            items.push(`B${i+1}: ${mTarget}`);
          }
        }
      }
      bulanan = items.length > 0 ? items.join(' | ') : "Belum diatur";

    } else {
      // Per Kuartal
      tahunan = "";
      const qStrings = ['q1', 'q2', 'q3', 'q4'].map((qKey) => {
        const qModulType = cfg.quarters?.[`${qKey}ModulType`] || cfg.selectedModulType || 'Al-Quran';
        const qNonQuranId = cfg.quarters?.[`${qKey}NonQuranModulId`] || cfg.selectedNonQuranModulId || '';
        const qElemenId = cfg.quarters?.[`${qKey}ElemenId`] || cfg.selectedElemenId || '';
        const elemObj = elemenSettings.find(e => 
          e.id === qElemenId || 
          e.nama === qElemenId || 
          e.nama?.toLowerCase().trim() === qElemenId?.toLowerCase().trim()
        );
        const elemName = elemObj ? elemObj.nama : (cfg.selectedElemenName || (qElemenId ? qElemenId : ''));
        const elemPrefix = elemName ? `${elemName}: ` : '';

        if (qModulType === 'Al-Quran') {
          return `[${elemPrefix}${q[`${qKey}SuratAwal`] || '-'} ${q[`${qKey}AyatAwal`] || 1} - ${q[`${qKey}SuratAkhir`] || '-'} ${q[`${qKey}AyatAkhir`] || 1}]`;
        } else {
          const selectedModulObj = moduls.find(m => m.id === qNonQuranId);
          const isSingleJilid = selectedModulObj ? (!selectedModulObj.isMultiJilid || !selectedModulObj.jumlahJilid || selectedModulObj.jumlahJilid <= 1) : false;
          const modulLabel = selectedModulObj ? (selectedModulObj.judulModul || selectedModulObj.namaSurat) : "Selain Al-Quran";
          if (isSingleJilid) {
            return `[${elemPrefix}${modulLabel} Hal ${q[`${qKey}HalamanAwal`] || 1} - Hal ${q[`${qKey}HalamanAkhir`] || 10}]`;
          } else {
            return `[${elemPrefix}Jilid ${q[`${qKey}JilidAwal`] || 1} Hal ${q[`${qKey}HalamanAwal`] || 1} - Jilid ${q[`${qKey}JilidAkhir`] || 1} Hal ${q[`${qKey}HalamanAkhir`] || 1}]`;
          }
        }
      });
      kuartal = `K1: ${qStrings[0]} | K2: ${qStrings[1]} | K3: ${qStrings[2]} | K4: ${qStrings[3]}`;

      const stq = cfg.shortTermQuarters || {};
      const activeQKey = cfg.activeSTQuarter || 'q1';
      const activeWIdx = cfg.activeSTWeek || 0;
      const activeQData = stq[activeQKey] || {
        hariAwalBelajar: '',
        pekanEfektif: 8,
        pertemuanPerPekan: 3,
        targets: {}
      };
      const activeWData = activeQData.targets?.[activeWIdx] || { pekanan: '', harian: [] };

      pekanan = activeWData.pekanan || "-";
      
      const harianArr = activeWData.harian || [];
      if (harianArr.length > 0) {
        bulanan = harianArr.map((h: string, i: number) => `P${i+1}: ${h || '-'}`).join(' | ');
      } else {
        bulanan = "-";
      }
    }

    return { pekanan, bulanan, kuartal, semester, tahunan };
  };

  // Sync individual student targets draft when active target student changes
  useEffect(() => {
    if (editTargetSiswaId) {
      const activeVal = studentTargets[editTargetSiswaId] || {
        siswaId: editTargetSiswaId,
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
      setTempTarget(prev => {
        // Only overwrite if the selected student ID changed, or if there are no unsaved changes (draft is identical to saved data)
        if (!prev || prev.siswaId !== editTargetSiswaId || JSON.stringify(prev) === JSON.stringify(studentTargets[editTargetSiswaId] || {})) {
          return activeVal;
        }
        return prev;
      });
    } else {
      setTempTarget(null);
    }
  }, [editTargetSiswaId, studentTargets]);

  // Sub Tab target manager controls (General vs Specific Targets)
  const [manageTargetType, setManageTargetType] = useState<'umum' | 'khusus'>('umum');

  // Helper to lazily initialize a student's targets on-demand
  const ensureStudentTarget = (obj: any, id: string) => {
    if (!obj[id]) {
      obj[id] = {
        siswaId: id,
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
    }
  };

  // Unified status-toggle handler with on-demand initialization to prevent page-load default write cycles
  const handleToggleTargetStatus = (siswaId: string, field: string) => {
    const updated = { ...studentTargets };
    ensureStudentTarget(updated, siswaId);
    updated[siswaId][field] = !updated[siswaId][field];
    setStudentTargets(updated);
    saveStudentTargets(updated); // Explicit Firestore Save!
    localStorage.setItem('mh_student_targets', JSON.stringify(updated));
  };

  // Target workspace tabs & view states
  const [activeTargetTab, setActiveTargetTab] = useState<'progress' | 'manage'>('progress');
  const [targetDisplayView, setTargetDisplayView] = useState<'grid' | 'table'>('grid');
  const [evalMonthIdx, setEvalMonthIdx] = useState<number>(11); // Default to Month 12 (index 11)

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

  // Build full config object based on current target form
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
        const startJ = getJuzStart(Number(targetFormJuzAwal) || 30);
        const endJ = getJuzEnd(Number(targetFormJuzAkhir) || 30);
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
      }
    };

    return newCfg;
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

      setTargetFormNonQuranModulId(existingCfg.selectedNonQuranModulId || '');
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
    } else {
      const defaultAlquranElem = availableElemenSettings.find(e => e.tipeModul === TipeModul.AL_QURAN);
      setTargetFormElemenId(defaultAlquranElem?.id || availableElemenSettings[0]?.id || '');
      setTargetFormModulType('Al-Quran');
      setTargetFormNonQuranModulId('');
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

      setTargetFormNonQuranModulId(cfgToLoad.selectedNonQuranModulId || '');
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
    } else {
      const defaultAlquranElem = availableElemenSettings.find(e => e.tipeModul === TipeModul.AL_QURAN);
      setTargetFormElemenId(defaultAlquranElem?.id || availableElemenSettings[0]?.id || '');
      setTargetFormModulType('Al-Quran');
      setTargetFormNonQuranModulId('');
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
    if (confirm(`Apakah Anda yakin ingin menyamakan target SEMUA santri di halaqah ${myHalaqah.namaHalaqah} agar mengikuti target halaqah?`)) {
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
      addLog('Reset Semua Target Santri', `Guru menyamakan seluruh target santri halaqah ${myHalaqah.namaHalaqah} ke target halaqah`);
      alert('Berhasil menyamakan seluruh target santri ke target halaqah!');
    }
  };

  // Auto set evalMonthIdx based on target duration (tahunanBulanDuration) set by the teacher
  useEffect(() => {
    if (activeTargetTab === 'progress') {
      const config = myHalaqah?.targetConfig || generalTargets?.config;
      if (config) {
        const duration = config.tahunanBulanDuration || 12;
        setEvalMonthIdx(duration - 1);
      }
    }
  }, [activeTargetTab, myHalaqah?.targetConfig, generalTargets?.config]);

  // Auto pick student for editor if not selected or from another halaqah
  useEffect(() => {
    if (myStudents.length > 0) {
      if (!editTargetSiswaId || !myStudents.some(s => s.id === editTargetSiswaId)) {
        setEditTargetSiswaId(myStudents[0].id);
      }
    } else {
      setEditTargetSiswaId('');
    }
  }, [myStudents]);

  
  const [rekapTimeframe, setRekapTimeframe] = useState<'harian' | 'pekanan' | 'bulanan' | 'kuartal' | 'semester' | 'tahunan'>('bulanan');
  const getRekapFilteredEntries = (timeframe: string) => {
    // simplified version for dashboard export
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = todayStr;
    const { studentAttendance } = useApp();
    const att = studentAttendance || [];
    
    if (timeframe === 'harian') {
      return att.filter(entry => entry.tanggal === targetDate);
    }
    const maxDateInAttendance = att.reduce((max, entry) => {
      return entry.tanggal > max ? entry.tanggal : max;
    }, targetDate);
    
    const maxDate = new Date(maxDateInAttendance);
    const result = att.filter(entry => {
      const entryDate = new Date(entry.tanggal);
      const diffTime = Math.abs(maxDate.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeframe === 'pekanan') return diffDays <= 7;
      if (timeframe === 'bulanan') return diffDays <= 30;
      if (timeframe === 'kuartal') return diffDays <= 90;
      if (timeframe === 'semester') return diffDays <= 180;
      if (timeframe === 'tahunan') return diffDays <= 365;
      return true;
    });
    return result;
  };

  // Filter lists for Dashboard & General lists
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterClass, setFilterClass] = useState('All');
  const [filterHalaqah, setFilterHalaqah] = useState('All');

  // Sync filters and input halaqah targets automatically when active halaqah changes
  useEffect(() => {
    if (myHalaqah) {
      setFilterHalaqah(myHalaqah.id);
      setSetoranHalaqahId(myHalaqah.id);
    }
  }, [myHalaqah]);

  // GURU PROFILE EDIT
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

  const [profileForm, setProfileForm] = useState({
    namaLengkap: myGuruObj?.namaLengkap || '',
    jabatan: myGuruObj?.jabatan || '',
    nomorHp: myGuruObj?.nomorHp || '',
    jenisKelamin: myGuruObj?.jenisKelamin || JenisKelamin.LAKI_LAKI,
    alamat: myGuruObj?.alamat || '',
    fotoProfil: myGuruObj?.fotoProfil || ''
  });

  useEffect(() => {
    if (myGuruObj) {
      setProfileForm({
        namaLengkap: myGuruObj.namaLengkap || '',
        jabatan: myGuruObj.jabatan || '',
        nomorHp: myGuruObj.nomorHp || '',
        jenisKelamin: myGuruObj.jenisKelamin || JenisKelamin.LAKI_LAKI,
        alamat: myGuruObj.alamat || '',
        fotoProfil: myGuruObj.fotoProfil || ''
      });
    }
  }, [myGuruObj]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myGuruObj) return;
    updateGuru(myGuruObj.id, profileForm);
    alert('Profil Anda berhasil diperbarui!');
  };

  // Profile foto handler helper
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        setProfileForm(prev => ({ ...prev, fotoProfil: base64Url }));
        if (myGuruObj) {
          updateGuru(myGuruObj.id, {
            ...profileForm,
            fotoProfil: base64Url
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ----------------------------------------------------
  // EXPORTS & GOOGLE DRIVE INTEGRATION
  // ----------------------------------------------------
  const handleExportDatabaseState = () => {
    setExportSuccess('');
    setExportError('');
    try {
      const dataStr = backupDatabase();
      if (!dataStr) {
        throw new Error('Data cadangan kosong atau tidak ditemukan.');
      }
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `halaqah_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportSuccess('Database lokal berhasil diekspor sebagai file JSON!');
      if (addLog) {
        addLog('Ekspor Database Lokal', 'Guru melakukan ekspor manual database lokal (.json)');
      }
    } catch (err: any) {
      console.error('Gagal mengekspor database:', err);
      setExportError(err.message || 'Terjadi kesalahan saat mengekspor database.');
    }
  };

  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);

  // Drive Save Modal State
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

  // ----------------------------------------------------
  // STUDENT WORKSPACE SELECTION & MODAL
  // ----------------------------------------------------
  const [selectedSiswaProfile, setSelectedSiswaProfile] = useState<Siswa | null>(null);

  // ----------------------------------------------------
  // INPUT SETORAN WORKFLOW STATES
  // ----------------------------------------------------
  const [setoranDate, setSetoranDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [setoranHalaqahId, setSetoranHalaqahId] = useState(myHalaqah?.id || '');
  const [setoranSiswaId, setSetoranSiswaId] = useState('');
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

  const activeModul = moduls.find(m => m.id === setoranModulId);

  const getPageLineCountHelper = () => {
    if (!selectedElemenObj?.useJumlahBaris && !activeModul?.useJumlahBarisPerHalaman) return null;
    
    const jIdx = activeModul?.isMultiJilid ? (Number(nonQuranJilid) - 1) : 0;
    
    if (isSinglePageNonQuran) {
      const pageNum = Number(nonQuranPageSingle) || 1;
      const count = getElemenLineCountForPage(selectedElemenObj, activeModul, pageNum, jIdx, quranLinesConfig);
      return count > 0 ? { type: 'single', page: pageNum, count } : null;
    } else {
      const startPg = (Number(nonQuranPageAwal) || 1);
      const endPg = (Number(nonQuranPageAkhir) || 1);
      const ranges: { page: number; count: number }[] = [];
      for (let p = startPg; p <= endPg; p++) {
        const count = getElemenLineCountForPage(selectedElemenObj, activeModul, p, jIdx, quranLinesConfig);
        if (count > 0) {
          ranges.push({ page: p, count });
        }
      }
      return ranges.length > 0 ? { type: 'range', ranges } : null;
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
      const qModules = moduls.filter(m => m.tipe === TipeModul.AL_QURAN);
      if (qModules.length > 0) {
        const existingMainId = setoranModulId || qModules[0].id;
        const mainMod = qModules.find(m => m.id === existingMainId) || qModules[0];
        const initialSuratAkhir = mainMod.jumlahAyat && mainMod.jumlahAyat <= 15 
          ? mainMod.jumlahAyat 
          : Math.min(mainMod.jumlahAyat || 10, 5);

        setMultiSurahsList([
          {
            id: '1',
            modulId: mainMod.id,
            suratNama: mainMod.namaSurat || '',
            ayatAwal: quranAyatAwal || 1,
            ayatAkhir: quranAyatAkhir || initialSuratAkhir,
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
    const qModules = moduls.filter(m => m.tipe === TipeModul.AL_QURAN);
    if (qModules.length === 0) return;
    const defaultMod = qModules[0];
    const lastItem = multiSurahsList.length > 0 ? multiSurahsList[multiSurahsList.length - 1] : null;
    const refModul = lastItem ? (moduls.find(m => m.id === lastItem.modulId) || defaultMod) : defaultMod;
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
    const qModules = moduls.filter(m => m.tipe === TipeModul.AL_QURAN);
    if (qModules.length === 0) return;
    const defaultMod = qModules[0];
    
    setBanyakSuratSubmit(newCount);
    if (newCount > multiSurahsList.length) {
      const diff = newCount - multiSurahsList.length;
      const lastItem = multiSurahsList.length > 0 ? multiSurahsList[multiSurahsList.length - 1] : null;
      const refModul = lastItem ? (moduls.find(m => m.id === lastItem.modulId) || defaultMod) : defaultMod;
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
  const [selectedErrorCategory, setSelectedErrorCategory] = useState<string>('Lainnya');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showSetoranCategoryPicker, setShowSetoranCategoryPicker] = useState<boolean>(false);
  const [activeCommentInput, setActiveCommentInput] = useState('');

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

  const normalizeSubKey = (sub?: string): string => {
    if (!sub) return '';
    return sub.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
  };

  const getDeductionTrackingKey = (canonCategoryKey: string, subcategory?: string): string => {
    const subNorm = normalizeSubKey(subcategory);
    if (subNorm) {
      return `${canonCategoryKey}:::${subNorm}`;
    }
    return `${canonCategoryKey}:::_general`;
  };

  const handleCategorySelect = (catName: string, subcategoriesCount = 0) => {
    setSelectedErrorCategory(catName);
    setSelectedSubCategory(null);
    setActiveCommentInput(`${catName}: `);
    if (subcategoriesCount === 0) {
      setShowSetoranCategoryPicker(false);
    }
  };

  const handleSubCategorySelect = (subName: string, autoClose = true) => {
    setSelectedSubCategory(subName);
    setActiveCommentInput(prev => {
      const currentCat = selectedErrorCategory || 'Koreksi';
      if (!prev || prev.trim() === '' || prev.includes(':')) {
        return `${currentCat} (${subName}): `;
      }
      return `${currentCat} (${subName}): ${prev}`;
    });
    setShowSetoranCategoryPicker(false);
  };

  const handleClearSubCategory = () => {
    setSelectedSubCategory(null);
    setActiveCommentInput(`${selectedErrorCategory}: `);
  };
  const [interactiveComments, setInteractiveComments] = useState<Array<{ id: string; target: string; targetKey?: string; targetKeys?: string[]; category?: string; subcategory?: string; comment: string; info: string }>>([]);
  const [guruQuranZoom, setGuruQuranZoom] = useState(110);

  const handleWordSelection = (
    wordKey: string, 
    wordText: string, 
    wordIdx: number, 
    allWords: string[]
  ) => {
    const lastDashIdx = wordKey.lastIndexOf('-');
    const containerPrefix = wordKey.substring(0, lastDashIdx);

    if (rangeStartKey === wordKey && !rangeEndKey) {
      setRangeStartKey(null);
      setRangeEndKey(null);
      setSelectedHighlightKeys([]);
      setSelectedHighlightKey('');
      setSelectedHighlightText('');
      setActiveCommentInput('');
      setSelectedErrorCategory('Lainnya');
      setSelectedSubCategory(null);
      return;
    }

    const existingStartPrefix = rangeStartKey ? rangeStartKey.substring(0, rangeStartKey.lastIndexOf('-')) : '';

    if (!rangeStartKey || rangeEndKey || existingStartPrefix !== containerPrefix) {
      setRangeStartKey(wordKey);
      setRangeEndKey(null);
      setSelectedHighlightKeys([wordKey]);
      setSelectedHighlightKey(wordKey);
      setSelectedHighlightText(wordText);
      setActiveCommentInput('');
      setSelectedErrorCategory('Lainnya');
      setSelectedSubCategory(null);
    } else {
      const startIdx = parseInt(rangeStartKey.split('-').pop() || '0', 10);
      const endIdx = wordIdx;

      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);

      const keysRange: string[] = [];
      const textRange: string[] = [];

      for (let i = minIdx; i <= maxIdx; i++) {
        keysRange.push(`${containerPrefix}-${i}`);
        textRange.push(allWords[i]);
      }

      setRangeEndKey(wordKey);
      setSelectedHighlightKeys(keysRange);
      setSelectedHighlightKey(wordKey);
      setSelectedHighlightText(textRange.join(' '));
      setActiveCommentInput('');
      setSelectedErrorCategory('Lainnya');
      setSelectedSubCategory(null);
    }
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
        
        // Sinkronisasi Modul
        let matchedModul = null;
        if (prev.modulId) {
          matchedModul = moduls.find(m => m.id === prev.modulId);
          if (matchedModul) {
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
        }
      } else {
        // Jika tidak ada riwayat setoran sebelumnya, inisialisasi modul dan target default yang kompatibel dengan elemen saat ini
        const currentElemObj = elemenSettings.find(e => e.id === setoranElemen);
        if (currentElemObj) {
          let compatibleModuls: typeof moduls = [];
          if (currentElemObj.tipeModul === TipeModul.NON_AL_QURAN && currentElemObj.referensiModulId) {
            compatibleModuls = moduls.filter(m => m.id === currentElemObj.referensiModulId);
          }
          if (compatibleModuls.length === 0) {
            const byElem = moduls.filter(m => m.elemenId === currentElemObj.id || m.elemenNama === currentElemObj.nama);
            compatibleModuls = byElem.length > 0 ? byElem : moduls.filter(m => m.tipe === currentElemObj.tipeModul);
          }
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
        <span className="inline-block font-extrabold bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 py-1 px-2.5 rounded-lg text-[10px] tracking-wide uppercase font-sans">
          [LULUS]
        </span>
      );
    } else if (norm === 'belum lulus' || norm === 'belum lulus / ulang' || norm === 'ulang') {
      return (
        <span className="inline-block font-extrabold bg-rose-50 dark:bg-rose-955/25 text-rose-700 dark:text-rose-400 border border-rose-250/60 py-1 px-2.5 rounded-lg text-[10px] tracking-wide uppercase font-sans">
          [BELUM LULUS / ULANG]
        </span>
      );
    } else if (norm === 'perlu perbaikan') {
      return (
        <span className="inline-block font-extrabold bg-amber-50 dark:bg-amber-955/25 text-amber-700 dark:text-amber-450 border border-amber-250/60 py-1 px-2.5 rounded-lg text-[10px] tracking-wide uppercase font-sans">
          [PERLU PERBAIKAN]
        </span>
      );
    } else if (norm === 'mengulang') {
      return (
        <span className="inline-block font-extrabold bg-orange-50 dark:bg-orange-955/25 text-orange-700 dark:text-orange-400 border border-orange-250/60 py-1 px-2.5 rounded-lg text-[10px] tracking-wide uppercase font-sans">
          [MENGULANG]
        </span>
      );
    } else {
      return (
        <span className="inline-block font-extrabold bg-slate-50 dark:bg-slate-900 border border-slate-200 py-1 px-2.5 rounded-lg text-[10px] tracking-wide uppercase font-sans font-mono">
          [{status.toUpperCase()}]
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
      <div className="space-y-2 mt-2">
        <ul className="space-y-2">
          {displayLines.map((line, idx) => {
            const isBullet = line.startsWith('•');
            const content = isBullet ? line.substring(1).trim() : line;
            return (
              <li key={idx} className="flex items-start gap-2 text-slate-705 dark:text-slate-300">
                <span className="text-indigo-500 font-extrabold shrink-0 mt-0.5 select-none">•</span>
                <span className="leading-relaxed font-semibold text-[11px] font-sans text-left">{content}</span>
              </li>
            );
          })}
        </ul>
        {hasMore && (
          <div className="text-left">
            <button
              type="button"
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-all mt-1 uppercase tracking-wider font-sans focus:outline-none bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-md"
            >
              {isNotesExpanded ? 'Sembunyikan Catatan' : `Lihat Selengkapnya (${rawLines.length - 3} koreksi lagi)`}
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
              <span className="text-slate-700 dark:text-slate-300 font-semibold break-words text-left">{cleanLine}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const prevSetoranObj = getSiswaCapaianSebelumnya(setoranSiswaId, setoranElemen);

  // Filter modules lists
  const selectedSiswaObj = siswas.find(s => s.id === setoranSiswaId);
  const selectedElemenObj = elemenSettings.find(e => e.id === setoranElemen);

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

  // Automated Rubric Calculation logic based on errors and lines
  useEffect(() => {
    if (selectedElemenObj?.useRubrikPenilaian && !isManualGradeOverride) {
      const isCustomOverride = selectedElemenObj.useMasterPenalties === false;
      const baseScore = isCustomOverride
        ? (selectedElemenObj.baseScore !== undefined ? selectedElemenObj.baseScore : 100)
        : (masterPenalties?.baseScore !== undefined ? masterPenalties.baseScore : 100);

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

      const findDeductionVal = (searchKey?: string): number => {
        if (!searchKey) return 0;
        if (effectiveDeductions[searchKey] !== undefined && Number(effectiveDeductions[searchKey]) > 0) {
          return Number(effectiveDeductions[searchKey]);
        }
        const cleanSearch = searchKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const [k, v] of Object.entries(effectiveDeductions)) {
          const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanK === cleanSearch && Number(v) > 0) {
            return Number(v);
          }
        }
        return 0;
      };

      const isOnceCategory = (searchKey?: string): { isOnce: boolean; canonKey: string } => {
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
        return { isOnce, canonKey };
      };

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

      const deductionSummary = calculateSetoranRubrikDeductions({
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
        defaultDeduction: findDeductionVal('lainnya') || findDeductionVal('Lainnya') || 2
      });
      const totalDeductions = deductionSummary.totalDeductions;

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
  }, [selectedElemenObj, masterPenalties, interactiveComments, jumlahBaris, tajwidCategories, isManualGradeOverride, activePredicates, isManualKelulusanOverride]);

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

  const matchedModules = useMemo(() => {
    if (!selectedElemenObj) return [];
    if (selectedElemenObj.tipeModul === TipeModul.NON_AL_QURAN && selectedElemenObj.referensiModulId) {
      const direct = moduls.find(m => m.id === selectedElemenObj.referensiModulId);
      if (direct) return [direct];
    }
    const byElem = moduls.filter(m => m.elemenId === selectedElemenObj.id || m.elemenNama === selectedElemenObj.nama);
    if (byElem.length > 0) return byElem;
    return moduls.filter(m => m.tipe === selectedElemenObj.tipeModul);
  }, [selectedElemenObj, moduls]);

  // Automatically pick first compatible module when sub elements toggle
  useEffect(() => {
    if (isRestoringFromPrevRef.current) return;
    if (matchedModules.length > 0) {
      const isCurrentlyCompatible = matchedModules.some(m => m.id === setoranModulId);
      if (!isCurrentlyCompatible) {
        setSetoranModulId(matchedModules[0].id);
      }
    }
  }, [setoranElemen]);

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
        nonQuranHalamanTunggal: isSinglePageNonQuran
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

  // Apply filters on setorans of this teacher or their group
  const isAuthorizedSetoran = (s: Setoran) => {
    // If Admin, they see all. If Guru, they see either their own setoran inputs OR any student in their Halaqah!
    return s.guruId === teacherId || (myHalaqah && s.halaqahId === myHalaqah.id);
  };

  const filteredHistory = setorans.filter(s => {
    if (!isAuthorizedSetoran(s)) return false;

    // Filter strictly by selected halaqah
    if (selectedHalaqahId && s.halaqahId !== selectedHalaqahId) {
      return false;
    }

    // Search query matched with student nama or NIS
    if (historySearch && !s.siswaNama.toLowerCase().includes(historySearch.toLowerCase()) && !s.siswaNis.includes(historySearch)) {
      return false;
    }
    if (historyModulFilter !== 'All' && s.modulId !== historyModulFilter) {
      return false;
    }
    if (historyDateFilter && s.tanggalSetoran !== historyDateFilter) {
      return false;
    }
    if (historyTypeFilter !== 'All') {
      const matchType = s.jenisSetoran || '';
      if (matchType.toLowerCase() !== historyTypeFilter.toLowerCase()) return false;
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

  const handleSaveEditSetoran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetoranObj) return;

    updateSetoran(editingSetoranObj.id, editingSetoranObj);
    alert('Penilaian setoran berhasil diperbarui!');
    setEditingSetoranObj(null);
  };

  const handleDeleteSetoranAction = (id: string, sname: string) => {
    deleteSetoran(id);
    addLog('Hapus Setoran', `Guru menghapus setoran siswa: ${sname}`);
  };

  // ----------------------------------------------------
  // TARGET & PROGRESS SISWA DATA METRICS & HELPERS
  // ----------------------------------------------------
  const getSurahNumber = (surahName: string): number => {
    if (!surahName) return 0;
    let cleaned = surahName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleaned.startsWith('surat')) {
      cleaned = cleaned.slice(5);
    } else if (cleaned.startsWith('surah')) {
      cleaned = cleaned.slice(5);
    }
    const foundIndex = SURAH_LIST.findIndex(s => {
      let sCleaned = s.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sCleaned.startsWith('surat')) {
        sCleaned = sCleaned.slice(5);
      } else if (sCleaned.startsWith('surah')) {
        sCleaned = sCleaned.slice(5);
      }
      return sCleaned === cleaned;
    });
    return foundIndex !== -1 ? foundIndex + 1 : 0;
  };

  const getQuranDefaultJuz = (surahNo: number, ayatNo: number = 1): number => {
    if (!surahNo || surahNo <= 0) return 30;
    const JUZ_STARTS = [
      { juz: 30, surah: 78, ayat: 1 },
      { juz: 29, surah: 67, ayat: 1 },
      { juz: 28, surah: 58, ayat: 1 },
      { juz: 27, surah: 51, ayat: 31 },
      { juz: 26, surah: 46, ayat: 1 },
      { juz: 25, surah: 41, ayat: 47 },
      { juz: 24, surah: 39, ayat: 32 },
      { juz: 23, surah: 36, ayat: 28 },
      { juz: 22, surah: 33, ayat: 31 },
      { juz: 21, surah: 29, ayat: 46 },
      { juz: 20, surah: 27, ayat: 56 },
      { juz: 19, surah: 25, ayat: 21 },
      { juz: 18, surah: 23, ayat: 1 },
      { juz: 17, surah: 21, ayat: 1 },
      { juz: 16, surah: 18, ayat: 75 },
      { juz: 15, surah: 17, ayat: 1 },
      { juz: 14, surah: 15, ayat: 1 },
      { juz: 13, surah: 12, ayat: 53 },
      { juz: 12, surah: 11, ayat: 6 },
      { juz: 11, surah: 9, ayat: 93 },
      { juz: 10, surah: 8, ayat: 41 },
      { juz: 9, surah: 7, ayat: 88 },
      { juz: 8, surah: 6, ayat: 111 },
      { juz: 7, surah: 5, ayat: 82 },
      { juz: 6, surah: 4, ayat: 148 },
      { juz: 5, surah: 4, ayat: 24 },
      { juz: 4, surah: 3, ayat: 93 },
      { juz: 3, surah: 2, ayat: 253 },
      { juz: 2, surah: 2, ayat: 142 },
      { juz: 1, surah: 1, ayat: 1 }
    ];
    for (const start of JUZ_STARTS) {
      if (surahNo > start.surah) return start.juz;
      if (surahNo === start.surah && ayatNo >= start.ayat) return start.juz;
    }
    return 1;
  };

  const checkStudentTargetMetForMonth = (siswaId: string, monthIdx: number): boolean => {
    const student = myStudents.find(s => s.id === siswaId);
    if (!student) return false;

    const savedTarget = studentTargets[siswaId];
    const config = (savedTarget?.isCustom && savedTarget?.config)
      ? savedTarget.config
      : (myHalaqah?.targetConfig || generalTargets?.config);

    if (!config || config.targetPeriod !== 'tahunan') return false;

    let targetMonthIdx = monthIdx;

    // Timeline-aware adjustment for custom start date
    const genConfig = myHalaqah?.targetConfig || generalTargets?.config;
    const genStartDateStr = genConfig?.shortTermQuarters?.q1?.hariAwalBelajar || '';
    const studentStartDateStr = config?.shortTermQuarters?.q1?.hariAwalBelajar || '';

    if (genStartDateStr && studentStartDateStr && genStartDateStr !== studentStartDateStr) {
      const genStart = new Date(genStartDateStr);
      const studentStart = new Date(studentStartDateStr);
      if (!isNaN(genStart.getTime()) && !isNaN(studentStart.getTime())) {
        // Calculate the target calendar date for this global evaluation month
        const evalDate = new Date(genStart);
        evalDate.setMonth(evalDate.getMonth() + monthIdx);

        // Calculate student's elapsed months as of evalDate
        const yearsDiff = evalDate.getFullYear() - studentStart.getFullYear();
        const monthsDiff = evalDate.getMonth() - studentStart.getMonth();
        let elapsedMonths = yearsDiff * 12 + monthsDiff;
        if (evalDate.getDate() < studentStart.getDate()) {
          elapsedMonths--;
        }

        if (elapsedMonths < 0) {
          // Student hasn't started yet at this evaluation date
          return false;
        }
        targetMonthIdx = elapsedMonths;
      }
    }

    const duration = config.tahunanBulanDuration || 12;
    if (targetMonthIdx >= duration) {
      targetMonthIdx = duration - 1;
    }

    const isQuran = config.selectedModulType === 'Al-Quran';
    const isNonQuran = config.selectedModulType === 'Selain Al-Quran';

    const studentSetorans = setorans.filter(s => s.siswaId === siswaId && s.statusLulus);
    if (studentSetorans.length === 0) return false;

    const mTarget = config.tahunanMonthlyTargets?.[targetMonthIdx];
    if (!mTarget) return false;

    if (isQuran) {
      const endSurah = mTarget.suratAkhir || '';
      const endAyat = Number(mTarget.ayatAkhir || 1);
      const endSurahNo = getSurahNumber(endSurah);
      if (endSurahNo === 0) return false;

      if (isPaketFatihahAnnasKausar(config)) {
        const order = [1, 114, 113, 112, 111, 110, 109, 108];
        const targetIdx = order.indexOf(endSurahNo);
        for (const s of studentSetorans) {
          if (s.tipeModul === TipeModul.AL_QURAN) {
            const checkS = (sNo: number, aAkhir: number) => {
              const sIdx = order.indexOf(sNo);
              if (sIdx !== -1 && targetIdx !== -1) {
                if (sIdx > targetIdx) return true;
                if (sIdx === targetIdx && aAkhir >= endAyat) return true;
              }
              return false;
            };
            if (s.suratNama && checkS(getSurahNumber(s.suratNama), s.ayatAkhir || 0)) return true;
            if (s.daftarSuratSetoran) {
              for (const sub of s.daftarSuratSetoran) {
                if (checkS(getSurahNumber(sub.suratNama), sub.ayatAkhir || 0)) return true;
              }
            }
          }
        }
        return false;
      }

      for (const s of studentSetorans) {
        if (s.tipeModul === TipeModul.AL_QURAN) {
          if (s.suratNama) {
            const sNo = getSurahNumber(s.suratNama);
            if (sNo > endSurahNo) return true;
            if (sNo === endSurahNo && (s.ayatAkhir || 0) >= endAyat) return true;
          }
          if (s.daftarSuratSetoran) {
            for (const sub of s.daftarSuratSetoran) {
              const sNo = getSurahNumber(sub.suratNama);
              if (sNo > endSurahNo) return true;
              if (sNo === endSurahNo && (sub.ayatAkhir || 0) >= endAyat) return true;
            }
          }
        }
      }
      return false;
    } else if (isNonQuran) {
      const qNonQuranId = config.selectedNonQuranModulId || '';
      const qModulObj = moduls.find(m => m.id === qNonQuranId);
      const qIsSingleJilid = qModulObj ? (!qModulObj.isMultiJilid || !qModulObj.jumlahJilid || qModulObj.jumlahJilid <= 1) : false;

      if (qIsSingleJilid) {
        const endHalaman = Number(mTarget.halamanAkhir || config.tahunanHalamanAkhir || 100);
        for (const s of studentSetorans) {
          if (s.tipeModul === TipeModul.NON_AL_QURAN) {
            const sPage = s.nonQuranPageAkhir || s.halaman || 1;
            if (sPage >= endHalaman) return true;
          }
        }
        return false;
      } else {
        const endJilid = Number(mTarget.jilidAkhir || config.tahunanJilidAkhir || 1);
        const endHalaman = Number(mTarget.halamanAkhir || config.tahunanHalamanAkhir || 40);

        const parseJilidNo = (modulName: string, nonQuranJilid?: number): number => {
          if (nonQuranJilid) return nonQuranJilid;
          if (!modulName) return 1;
          const m = modulName.match(/(?:Jilid|Iqro|Iqra)\s*(\d+)/i);
          return m ? Number(m[1]) : 1;
        };

        for (const s of studentSetorans) {
          if (s.tipeModul === TipeModul.NON_AL_QURAN) {
            const sJilid = parseJilidNo(s.modulNama, s.nonQuranJilid);
            const sPage = s.nonQuranPageAkhir || s.halaman || 1;
            if (sJilid > endJilid) return true;
            if (sJilid === endJilid && sPage >= endHalaman) return true;
          }
        }
        return false;
      }
    }

    return false;
  };

  const checkQuranTargetMet = (config: any, level: string, studentSetorans: Setoran[]): boolean => {
    if (!config || config.selectedModulType !== 'Al-Quran') return false;
    const lunasQuran = studentSetorans.filter(s => s.statusLulus && s.tipeModul === TipeModul.AL_QURAN);
    if (lunasQuran.length === 0) return false;

    let useJuzMode = false;
    let endJuz = 30;
    let endSurah = '';
    let endAyat = 1;

    if (level === 'tahunan') {
      let customEnd: any = null;
      if (config.tahunanMonthlyTargets) {
        const monthlyTargets = config.tahunanMonthlyTargets;
        const duration = config.tahunanBulanDuration || 12;
        for (let i = 0; i < duration; i++) {
          if (monthlyTargets[i] && typeof monthlyTargets[i] === 'object' && monthlyTargets[i].suratAkhir) {
            customEnd = monthlyTargets[i];
          }
        }
      }

      if (customEnd) {
        endSurah = customEnd.suratAkhir;
        endAyat = Number(customEnd.ayatAkhir || 1);
        useJuzMode = false;
      } else if (config.tahunanMode === 'juz') {
        useJuzMode = true;
        endJuz = Number(config.tahunanJuzAkhir || 30);
      } else {
        endSurah = config.tahunanSuratAkhir || '';
        endAyat = Number(config.tahunanAyatAkhir || 1);
      }
    } else if (level === 'semester1' && config.semesters) {
      endSurah = config.semesters.s1SuratAkhir || '';
      endAyat = Number(config.semesters.s1AyatAkhir || 1);
    } else if (level === 'semester2' && config.semesters) {
      endSurah = config.semesters.s2SuratAkhir || '';
      endAyat = Number(config.semesters.s2AyatAkhir || 1);
    } else if (level === 'q1' && config.quarters) {
      endSurah = config.quarters.q1SuratAkhir || '';
      endAyat = Number(config.quarters.q1AyatAkhir || 1);
    } else if (level === 'q2' && config.quarters) {
      endSurah = config.quarters.q2SuratAkhir || '';
      endAyat = Number(config.quarters.q2AyatAkhir || 1);
    } else if (level === 'q3' && config.quarters) {
      endSurah = config.quarters.q3SuratAkhir || '';
      endAyat = Number(config.quarters.q3AyatAkhir || 1);
    } else if (level === 'q4' && config.quarters) {
      endSurah = config.quarters.q4SuratAkhir || '';
      endAyat = Number(config.quarters.q4AyatAkhir || 1);
    } else if (level === 'pekanan') {
      endSurah = config.pekananSuratAkhir || '';
      endAyat = Number(config.pekananAyatAkhir || 1);
    } else if (level === 'harian') {
      endSurah = config.harianSuratAkhir || '';
      endAyat = Number(config.harianAyatAkhir || 1);
    }

    if (useJuzMode) {
      let maxJuzFound = 0;
      lunasQuran.forEach(s => {
        if (s.suratNama) {
          const sNo = getSurahNumber(s.suratNama);
          const juz = getQuranDefaultJuz(sNo, s.ayatAkhir || 1);
          if (juz > maxJuzFound) maxJuzFound = juz;
        }
        if (s.daftarSuratSetoran) {
          s.daftarSuratSetoran.forEach(sub => {
            const sNo = getSurahNumber(sub.suratNama);
            const juz = getQuranDefaultJuz(sNo, sub.ayatAkhir || 1);
            if (juz > maxJuzFound) maxJuzFound = juz;
          });
        }
      });
      return maxJuzFound >= endJuz;
    }

    const endSurahNo = getSurahNumber(endSurah);
    if (endSurahNo === 0) return false;

    if (isPaketFatihahAnnasKausar(config)) {
      const order = [1, 114, 113, 112, 111, 110, 109, 108];
      const targetIdx = order.indexOf(endSurahNo);
      for (const s of lunasQuran) {
        const checkS = (sNo: number, aAkhir: number) => {
          const sIdx = order.indexOf(sNo);
          if (sIdx !== -1 && targetIdx !== -1) {
            if (sIdx > targetIdx) return true;
            if (sIdx === targetIdx && aAkhir >= endAyat) return true;
          }
          return false;
        };
        if (s.suratNama && checkS(getSurahNumber(s.suratNama), s.ayatAkhir || 0)) return true;
        if (s.daftarSuratSetoran) {
          for (const sub of s.daftarSuratSetoran) {
            if (checkS(getSurahNumber(sub.suratNama), sub.ayatAkhir || 0)) return true;
          }
        }
      }
      return false;
    }

    for (const s of lunasQuran) {
      if (s.suratNama) {
        const sNo = getSurahNumber(s.suratNama);
        if (sNo > endSurahNo) return true;
        if (sNo === endSurahNo && (s.ayatAkhir || 0) >= endAyat) return true;
      }
      if (s.daftarSuratSetoran) {
        for (const sub of s.daftarSuratSetoran) {
          const sNo = getSurahNumber(sub.suratNama);
          if (sNo > endSurahNo) return true;
          if (sNo === endSurahNo && (sub.ayatAkhir || 0) >= endAyat) return true;
        }
      }
    }
    return false;
  };

  const checkNonQuranTargetMet = (config: any, level: string, studentSetorans: Setoran[]): boolean => {
    if (!config || config.selectedModulType !== 'Selain Al-Quran') return false;
    const lunasNonQuran = studentSetorans.filter(s => s.statusLulus && s.tipeModul === TipeModul.NON_AL_QURAN);
    if (lunasNonQuran.length === 0) return false;

    let endJilid = 1;
    let endHalaman = 1;

    if (level === 'tahunan') {
      endJilid = Number(config.tahunanJilidAkhir || 1);
      endHalaman = 100;
    } else if (level === 'semester1' && config.semesters) {
      endJilid = Number(config.semesters.s1JilidAkhir || 1);
      endHalaman = Number(config.semesters.s1HalamanAkhir || 1);
    } else if (level === 'semester2' && config.semesters) {
      endJilid = Number(config.semesters.s2JilidAkhir || 1);
      endHalaman = Number(config.semesters.s2HalamanAkhir || 1);
    } else if (level === 'q1' && config.quarters) {
      endJilid = Number(config.quarters.q1JilidAkhir || 1);
      endHalaman = Number(config.quarters.q1HalamanAkhir || 1);
    } else if (level === 'q2' && config.quarters) {
      endJilid = Number(config.quarters.q2JilidAkhir || 1);
      endHalaman = Number(config.quarters.q2HalamanAkhir || 1);
    } else if (level === 'q3' && config.quarters) {
      endJilid = Number(config.quarters.q3JilidAkhir || 1);
      endHalaman = Number(config.quarters.q3HalamanAkhir || 1);
    } else if (level === 'q4' && config.quarters) {
      endJilid = Number(config.quarters.q4JilidAkhir || 1);
      endHalaman = Number(config.quarters.q4HalamanAkhir || 1);
    } else if (level === 'pekanan') {
      endJilid = Number(config.pekananJilidAkhir || 1);
      endHalaman = Number(config.pekananHalamanAkhir || 1);
    } else if (level === 'harian') {
      endJilid = Number(config.harianJilidAkhir || 1);
      endHalaman = Number(config.harianHalamanAkhir || 1);
    }

    const parseJilidNo = (modulName: string, nonQuranJilid?: number): number => {
      if (nonQuranJilid) return nonQuranJilid;
      if (!modulName) return 1;
      const m = modulName.match(/(?:Jilid|Iqro|Iqra)\s*(\d+)/i);
      return m ? Number(m[1]) : 1;
    };

    for (const s of lunasNonQuran) {
      const sJilid = parseJilidNo(s.modulNama, s.nonQuranJilid);
      const sPage = s.nonQuranPageAkhir || s.halaman || 1;
      if (sJilid > endJilid) return true;
      if (sJilid === endJilid && sPage >= endHalaman) return true;
    }
    return false;
  };

  const isSameCalendarWeek = (dateStr1: string, dateStr2: string) => {
    if (!dateStr1 || !dateStr2) return false;
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    
    const day1 = d1.getDay();
    const diff1 = d1.getDate() - day1 + (day1 === 0 ? -6 : 1);
    const mon1 = new Date(d1.setDate(diff1));
    mon1.setHours(0, 0, 0, 0);
    
    const day2 = d2.getDay();
    const diff2 = d2.getDate() - day2 + (day2 === 0 ? -6 : 1);
    const mon2 = new Date(d2.setDate(diff2));
    mon2.setHours(0, 0, 0, 0);
    
    return mon1.getTime() === mon2.getTime();
  };

  const getJuzStart = (juz: number) => {
    const starts: Record<number, { surah: number, ayat: number }> = {
      1: { surah: 1, ayat: 1 },
      2: { surah: 2, ayat: 142 },
      3: { surah: 2, ayat: 253 },
      4: { surah: 3, ayat: 93 },
      5: { surah: 4, ayat: 24 },
      6: { surah: 4, ayat: 148 },
      7: { surah: 5, ayat: 82 },
      8: { surah: 6, ayat: 111 },
      9: { surah: 7, ayat: 88 },
      10: { surah: 8, ayat: 41 },
      11: { surah: 9, ayat: 93 },
      12: { surah: 11, ayat: 1 },
      13: { surah: 12, ayat: 53 },
      14: { surah: 15, ayat: 1 },
      15: { surah: 17, ayat: 1 },
      16: { surah: 18, ayat: 75 },
      17: { surah: 21, ayat: 1 },
      18: { surah: 23, ayat: 1 },
      19: { surah: 25, ayat: 21 },
      20: { surah: 27, ayat: 56 },
      21: { surah: 29, ayat: 46 },
      22: { surah: 33, ayat: 31 },
      23: { surah: 36, ayat: 28 },
      24: { surah: 39, ayat: 32 },
      25: { surah: 41, ayat: 47 },
      26: { surah: 46, ayat: 1 },
      27: { surah: 51, ayat: 31 },
      28: { surah: 58, ayat: 1 },
      29: { surah: 67, ayat: 1 },
      30: { surah: 78, ayat: 1 }
    };
    return starts[juz] || { surah: 78, ayat: 1 };
  };

  const getJuzEnd = (juz: number) => {
    const ends: Record<number, { surah: number, ayat: number }> = {
      1: { surah: 2, ayat: 141 },
      2: { surah: 2, ayat: 252 },
      3: { surah: 3, ayat: 92 },
      4: { surah: 4, ayat: 23 },
      5: { surah: 4, ayat: 147 },
      6: { surah: 5, ayat: 81 },
      7: { surah: 6, ayat: 110 },
      8: { surah: 7, ayat: 87 },
      9: { surah: 8, ayat: 40 },
      10: { surah: 9, ayat: 92 },
      11: { surah: 10, ayat: 109 },
      12: { surah: 12, ayat: 52 },
      13: { surah: 14, ayat: 52 },
      14: { surah: 16, ayat: 128 },
      15: { surah: 18, ayat: 74 },
      16: { surah: 20, ayat: 135 },
      17: { surah: 22, ayat: 78 },
      18: { surah: 25, ayat: 20 },
      19: { surah: 27, ayat: 55 },
      20: { surah: 29, ayat: 45 },
      21: { surah: 33, ayat: 30 },
      22: { surah: 36, ayat: 27 },
      23: { surah: 39, ayat: 31 },
      24: { surah: 41, ayat: 46 },
      25: { surah: 45, ayat: 37 },
      26: { surah: 51, ayat: 30 },
      27: { surah: 57, ayat: 29 },
      28: { surah: 66, ayat: 12 },
      29: { surah: 77, ayat: 50 },
      30: { surah: 114, ayat: 6 }
    };
    return ends[juz] || { surah: 114, ayat: 6 };
  };

  const getSurahJumlahAyat = (surahNo: number): number => {
    const found = moduls.find(m => m.tipe === TipeModul.AL_QURAN && m.nomorUrutSurat === surahNo);
    if (found?.jumlahAyat) return found.jumlahAyat;
    const fallbackAyats: Record<number, number> = {
      1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
      11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
      21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
      31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
      41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
      51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
      61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
      71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
      81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
      91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
      101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
      111: 5, 112: 4, 113: 5, 114: 6
    };
    return fallbackAyats[surahNo] || 10;
  };

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

  const studentProgressMetrics = targetStudents.map(siswa => {
    const savedTarget = studentTargets[siswa.id];
    const studentHalaqah = halaqahs.find(h => h.id === siswa.halaqahId) || myHalaqah;
    const config = (savedTarget?.isCustom && savedTarget?.config)
      ? savedTarget.config
      : (studentHalaqah?.targetConfig || generalTargets?.config);
    const isTargetEnabled = !!(studentHalaqah && studentHalaqah.targetConfigEnabled === true);
    const isQuran = config?.selectedModulType === 'Al-Quran';
    const isNonQuran = config?.selectedModulType === 'Selain Al-Quran';

    const { id: qElemenId, nama: elementName } = resolveTargetElement(config);

    // We calculate completion based on total setoran entries with status "Lulus"
    // and matching the target element and category "Baru" (case-insensitive) for Quran
    const finishedSetorans = setorans.filter(s => {
      if (s.siswaId !== siswa.id || !s.statusLulus) return false;

      // 1. Match configured target element name (case-insensitive) or element ID
      const sElemName = (s.jenisSetoran || '').toLowerCase().trim();
      const targetElemName = elementName.toLowerCase().trim();
      const targetElemId = (qElemenId || '').toLowerCase().trim();
      const isElemMatch = sElemName === targetElemName || (targetElemId && sElemName === targetElemId);
      if (!isElemMatch) return false;

      // 2. If Al-Quran, match sub-category "Baru" (contains "baru", e.g., "Baru" or "Hafalan Baru")
      if (isQuran || s.tipeModul === TipeModul.AL_QURAN) {
        const sSub = (s.tipeTahfidz || '').toLowerCase().trim();
        const isBaru = !sSub || sSub === 'baru' || sSub === 'hafalan baru' || sSub.includes('baru');
        if (!isBaru) return false;
      }

      return true;
    });

    let completedCount = 0;
    finishedSetorans.forEach(s => {
      if (s.tipeModul === TipeModul.AL_QURAN && s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0) {
        completedCount += s.daftarSuratSetoran.length;
      } else {
        completedCount += 1;
      }
    });

    // Check automatic achievements
    const autoTahunan = isQuran 
      ? checkQuranTargetMet(config, 'tahunan', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'tahunan', finishedSetorans) : false);

    const autoSemester1 = isQuran
      ? checkQuranTargetMet(config, 'semester1', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'semester1', finishedSetorans) : false);

    const autoSemester2 = isQuran
      ? checkQuranTargetMet(config, 'semester2', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'semester2', finishedSetorans) : false);

    const autoQ1 = isQuran
      ? checkQuranTargetMet(config, 'q1', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'q1', finishedSetorans) : false);
    const autoQ2 = isQuran
      ? checkQuranTargetMet(config, 'q2', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'q2', finishedSetorans) : false);
    const autoQ3 = isQuran
      ? checkQuranTargetMet(config, 'q3', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'q3', finishedSetorans) : false);
    const autoQ4 = isQuran
      ? checkQuranTargetMet(config, 'q4', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'q4', finishedSetorans) : false);

    const autoPekanan = isQuran
      ? checkQuranTargetMet(config, 'pekanan', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'pekanan', finishedSetorans) : false);

    const autoHarian = isQuran
      ? checkQuranTargetMet(config, 'harian', finishedSetorans)
      : (isNonQuran ? checkNonQuranTargetMet(config, 'harian', finishedSetorans) : false);

    // Auto-detection of daily & weekly completion based on sectoran entries for current filterDate
    const hasSetoranToday = finishedSetorans.some(s => s.tanggalSetoran === filterDate);
    const hasSetoranThisWeek = finishedSetorans.some(s => isSameCalendarWeek(s.tanggalSetoran, filterDate));

    // Completely automatic! No manual check required.
    const harianDone = autoHarian || hasSetoranToday;
    const pekananDone = autoPekanan || hasSetoranThisWeek;
    const tahunanDone = autoTahunan;

    // Helper to extract target start/end surahs and ayats
    const getQuranTargetRange = (cfg: any) => {
      let sAwalNo = 0;
      let aAwal = 1;
      let sAkhirNo = 0;
      let aAkhir = 1;

      if (!cfg) return null;

      if (isPaketFatihahAnnasKausar(cfg)) {
        return { sAwalNo: 1, aAwal: 1, sAkhirNo: 108, aAkhir: 3 };
      }

      if (cfg.tahunanMonthlyTargets) {
        const monthlyTargets = cfg.tahunanMonthlyTargets;
        const duration = cfg.tahunanBulanDuration || 12;
        let firstTarget: any = null;
        let lastTarget: any = null;
        for (let i = 0; i < duration; i++) {
          if (monthlyTargets[i] && typeof monthlyTargets[i] === 'object') {
            if (monthlyTargets[i].suratAwal || monthlyTargets[i].suratAkhir) {
              if (!firstTarget) firstTarget = monthlyTargets[i];
              lastTarget = monthlyTargets[i];
            }
          }
        }
        if (firstTarget && lastTarget) {
          sAwalNo = getSurahNumber(firstTarget.suratAwal || '');
          aAwal = Number(firstTarget.ayatAwal || 1);
          sAkhirNo = getSurahNumber(lastTarget.suratAkhir || '');
          aAkhir = Number(lastTarget.ayatAkhir || 1);
        }
      }

      if (sAwalNo === 0) {
        if (cfg.tahunanMode === 'juz') {
          const startJuz = Number(cfg.tahunanJuzAwal || 30);
          const endJuz = Number(cfg.tahunanJuzAkhir || 30);
          const startJ = getJuzStart(startJuz);
          const endJ = getJuzEnd(endJuz);
          sAwalNo = startJ.surah;
          aAwal = startJ.ayat;
          sAkhirNo = endJ.surah;
          aAkhir = endJ.ayat;
        } else {
          sAwalNo = getSurahNumber(cfg.tahunanSuratAwal || '');
          aAwal = Number(cfg.tahunanAyatAwal || 1);
          sAkhirNo = getSurahNumber(cfg.tahunanSuratAkhir || '');
          aAkhir = Number(cfg.tahunanAyatAkhir || 1);
        }
      }

      return { sAwalNo, aAwal, sAkhirNo, aAkhir };
    };

    // Helper to build a Set of "{surahNo}-{ayatNo}" keys in target range
    const buildVersesSetInRange = (sAwalNo: number, aAwal: number, sAkhirNo: number, aAkhir: number, currentCfg?: any) => {
      const set = new Set<string>();
      if (currentCfg && isPaketFatihahAnnasKausar(currentCfg)) {
        FATIHAH_ANNAS_KAUSAR_ORDER.forEach(s => {
          for (let a = 1; a <= s.ayatCount; a++) {
            set.add(`${s.no}-${a}`);
          }
        });
        return set;
      }

      if (sAwalNo === 0 || sAkhirNo === 0) return set;

      const startS = Math.min(sAwalNo, sAkhirNo);
      const endS = Math.max(sAwalNo, sAkhirNo);

      for (let sNo = startS; sNo <= endS; sNo++) {
        const totalAyat = getSurahJumlahAyat(sNo);
        
        let startA = 1;
        let endA = totalAyat;

        if (sNo === sAwalNo) {
          startA = sAwalNo <= sAkhirNo ? aAwal : aAkhir;
        }
        if (sNo === sAkhirNo) {
          endA = sAwalNo <= sAkhirNo ? aAkhir : aAwal;
        }

        for (let a = startA; a <= endA; a++) {
          set.add(`${sNo}-${a}`);
        }
      }
      return set;
    };

    const memorizedVersesSet = new Set<string>();
    
    // First, populate explicitly recorded verses
    finishedSetorans.forEach(s => {
      if (s.tipeModul === TipeModul.AL_QURAN) {
        if (s.suratNama) {
          const sNo = getSurahNumber(s.suratNama);
          const startA = s.ayatAwal || 1;
          const endA = s.ayatAkhir || 1;
          for (let a = startA; a <= endA; a++) {
            memorizedVersesSet.add(`${sNo}-${a}`);
          }
        }
        if (s.daftarSuratSetoran) {
          s.daftarSuratSetoran.forEach(sub => {
            const sNo = getSurahNumber(sub.suratNama);
            const startA = sub.ayatAwal || 1;
            const endA = sub.ayatAkhir || 1;
            for (let a = startA; a <= endA; a++) {
              memorizedVersesSet.add(`${sNo}-${a}`);
            }
          });
        }
      }
    });

    // Expand memorized verses if the student has reached a further surah in the target range
    if (isQuran) {
      if (isPaketFatihahAnnasKausar(config)) {
        const order = [1, 114, 113, 112, 111, 110, 109, 108];
        let furthestIdx = -1;
        let furthestAyatAkhir = 0;

        finishedSetorans.forEach(s => {
          if (s.tipeModul === TipeModul.AL_QURAN) {
            const processItem = (sNo: number, aEnd: number) => {
              const idx = order.indexOf(sNo);
              if (idx !== -1) {
                if (idx > furthestIdx) {
                  furthestIdx = idx;
                  furthestAyatAkhir = aEnd;
                } else if (idx === furthestIdx) {
                  furthestAyatAkhir = Math.max(furthestAyatAkhir, aEnd);
                }
              }
            };
            if (s.suratNama) {
              processItem(getSurahNumber(s.suratNama), s.ayatAkhir || 1);
            }
            if (s.daftarSuratSetoran) {
              s.daftarSuratSetoran.forEach(sub => {
                processItem(getSurahNumber(sub.suratNama), sub.ayatAkhir || 1);
              });
            }
          }
        });

        if (furthestIdx >= 0) {
          // Preceding surahs in sequence are fully completed
          for (let i = 0; i < furthestIdx; i++) {
            const sNo = order[i];
            const totalAyat = getSurahJumlahAyat(sNo);
            for (let a = 1; a <= totalAyat; a++) {
              memorizedVersesSet.add(`${sNo}-${a}`);
            }
          }
          // For the furthest reached surah, everything up to furthestAyatAkhir
          const sNo = order[furthestIdx];
          for (let a = 1; a <= furthestAyatAkhir; a++) {
            memorizedVersesSet.add(`${sNo}-${a}`);
          }
        }
      } else {
        const range = getQuranTargetRange(config);
        if (range && range.sAwalNo !== 0 && range.sAkhirNo !== 0) {
          const isAscending = range.sAwalNo <= range.sAkhirNo;
          let furthestSNo = 0;
          let furthestAyatAkhir = 0;

          finishedSetorans.forEach(s => {
            if (s.tipeModul === TipeModul.AL_QURAN) {
              const processSNo = (sNo: number, aAwal: number, aAkhir: number) => {
                if (sNo === 0) return;
                const inRange = isAscending 
                  ? (sNo >= range.sAwalNo && sNo <= range.sAkhirNo)
                  : (sNo >= range.sAkhirNo && sNo <= range.sAwalNo);
                
                if (inRange) {
                  if (furthestSNo === 0) {
                    furthestSNo = sNo;
                    furthestAyatAkhir = aAkhir;
                  } else if (isAscending) {
                    if (sNo > furthestSNo) {
                      furthestSNo = sNo;
                      furthestAyatAkhir = aAkhir;
                    } else if (sNo === furthestSNo) {
                      furthestAyatAkhir = Math.max(furthestAyatAkhir, aAkhir);
                    }
                  } else { // descending
                    if (sNo < furthestSNo) {
                      furthestSNo = sNo;
                      furthestAyatAkhir = aAkhir;
                    } else if (sNo === furthestSNo) {
                      furthestAyatAkhir = Math.max(furthestAyatAkhir, aAkhir);
                    }
                  }
                }
              };

              if (s.suratNama) {
                processSNo(getSurahNumber(s.suratNama), s.ayatAwal || 1, s.ayatAkhir || 1);
              }
              if (s.daftarSuratSetoran) {
                s.daftarSuratSetoran.forEach(sub => {
                  processSNo(getSurahNumber(sub.suratNama), sub.ayatAwal || 1, sub.ayatAkhir || 1);
                });
              }
            }
          });

          if (furthestSNo > 0) {
            if (isAscending) {
              // Preceding surahs are fully completed
              for (let sNo = range.sAwalNo; sNo < furthestSNo; sNo++) {
                const totalAyat = getSurahJumlahAyat(sNo);
                for (let a = 1; a <= totalAyat; a++) {
                  memorizedVersesSet.add(`${sNo}-${a}`);
                }
              }
              // For the furthest surah, everything up to furthestAyatAkhir is completed
              for (let a = 1; a <= furthestAyatAkhir; a++) {
                memorizedVersesSet.add(`${furthestSNo}-${a}`);
              }
            } else {
              // Preceding surahs are fully completed (descending path: from range.sAwalNo down to furthestSNo + 1)
              for (let sNo = range.sAwalNo; sNo > furthestSNo; sNo--) {
                const totalAyat = getSurahJumlahAyat(sNo);
                for (let a = 1; a <= totalAyat; a++) {
                  memorizedVersesSet.add(`${sNo}-${a}`);
                }
              }
              // For the furthest surah, everything up to furthestAyatAkhir
              for (let a = 1; a <= furthestAyatAkhir; a++) {
                memorizedVersesSet.add(`${furthestSNo}-${a}`);
              }
            }
          }
        }
      }
    }

    // Calculate percentage based on simplified 2-tier target structure
    let percent = 0;
    if (config?.targetPeriod === 'tahunan') {
      if (isQuran) {
        const range = getQuranTargetRange(config);
        if (range) {
          const targetVersesSet = buildVersesSetInRange(range.sAwalNo, range.aAwal, range.sAkhirNo, range.aAkhir, config);
          if (targetVersesSet.size > 0) {
            let intersectionCount = 0;
            targetVersesSet.forEach(v => {
              if (memorizedVersesSet.has(v)) {
                intersectionCount++;
              }
            });
            percent = Math.round((intersectionCount / targetVersesSet.size) * 100);
          } else {
            percent = tahunanDone ? 100 : 0;
          }
        } else {
          percent = tahunanDone ? 100 : 0;
        }
      } else if (isNonQuran) {
        // Calculate non-Quran percentage based on completed pages/segments in jilid
        let startJilid = 1;
        let startHalaman = 1;
        let endJilid = Number(config.tahunanJilidAkhir || 1);
        let endHalaman = 100;

        if (config.tahunanMonthlyTargets) {
          const monthlyTargets = config.tahunanMonthlyTargets;
          const duration = config.tahunanBulanDuration || 12;
          let firstTarget: any = null;
          let lastTarget: any = null;
          for (let i = 0; i < duration; i++) {
            if (monthlyTargets[i] && typeof monthlyTargets[i] === 'object') {
              if (!firstTarget) firstTarget = monthlyTargets[i];
              lastTarget = monthlyTargets[i];
            }
          }
          if (firstTarget && lastTarget) {
            startJilid = Number(firstTarget.jilidAwal || config.tahunanJilidAwal || 1);
            startHalaman = Number(firstTarget.halamanAwal || config.tahunanHalamanAwal || 1);
            endJilid = Number(lastTarget.jilidAkhir || config.tahunanJilidAkhir || (config.tahunanNonQuranModulId ? (moduls.find(m => m.id === config.tahunanNonQuranModulId)?.jumlahJilid || 1) : 1));
            endHalaman = Number(lastTarget.halamanAkhir || config.tahunanHalamanAkhir || 100);
          } else {
            startJilid = Number(config.tahunanJilidAwal || 1);
            startHalaman = Number(config.tahunanHalamanAwal || 1);
            endJilid = Number(config.tahunanJilidAkhir || 1);
            endHalaman = Number(config.tahunanHalamanAkhir || 100);
          }
        } else {
          startJilid = Number(config.tahunanJilidAwal || 1);
          startHalaman = Number(config.tahunanHalamanAwal || 1);
          endJilid = Number(config.tahunanJilidAkhir || 1);
          endHalaman = Number(config.tahunanHalamanAkhir || 100);
        }

        const targetPagesSet = new Set<string>();
        for (let j = startJilid; j <= endJilid; j++) {
          let minPage = 1;
          let maxPage = 100;
          if (j === startJilid) minPage = startHalaman;
          if (j === endJilid) maxPage = endHalaman;
          for (let p = minPage; p <= maxPage; p++) {
            targetPagesSet.add(`${j}-${p}`);
          }
        }

        const memorizedPagesSet = new Set<string>();
        finishedSetorans.forEach(s => {
          if (s.tipeModul === TipeModul.NON_AL_QURAN) {
            const sJilid = s.nonQuranJilid || 1;
            const sPageAwal = s.nonQuranPageAwal || s.halaman || 1;
            const sPageAkhir = s.nonQuranPageAkhir || s.halaman || sPageAwal;
            for (let p = sPageAwal; p <= sPageAkhir; p++) {
              memorizedPagesSet.add(`${sJilid}-${p}`);
            }
          }
        });

        if (targetPagesSet.size > 0) {
          let intersectionCount = 0;
          targetPagesSet.forEach(p => {
            if (memorizedPagesSet.has(p)) {
              intersectionCount++;
            }
          });
          percent = Math.round((intersectionCount / targetPagesSet.size) * 100);
        } else {
          percent = tahunanDone ? 100 : 0;
        }
      } else {
        percent = tahunanDone ? 100 : 0;
      }
    } else {
      const mode = config?.shortTermMode || 'keduanya';
      if (mode === 'harian') {
        percent = harianDone ? 100 : 0;
      } else if (mode === 'pekanan') {
        percent = pekananDone ? 100 : 0;
      } else { // keduanya
        let count = 0;
        if (harianDone) count++;
        if (pekananDone) count++;
        percent = Math.round((count / 2) * 100);
      }
    }

    // Fallback if no target is configured at all
    if (!config && !savedTarget) {
      if (completedCount > 0) {
        percent = Math.min(100, Math.round((completedCount / 5) * 100));
      } else {
        percent = 15;
      }
    }

    // Finished of presets - support listing individual surah items from array
    const completedSurahsList: string[] = [];
    finishedSetorans.forEach(f => {
      if (f.tipeModul === TipeModul.AL_QURAN) {
        if (f.suratNama) {
          completedSurahsList.push(f.suratNama);
        }
        if (f.daftarSuratSetoran) {
          f.daftarSuratSetoran.forEach(item => {
            if (item.suratNama) {
              completedSurahsList.push(item.suratNama);
            }
          });
        }
      }
    });
    const uniqueSurahs = Array.from(new Set(completedSurahsList || []));

    // Non-Quran
    const completedModuls = finishedSetorans
      .filter(f => f.tipeModul === TipeModul.NON_AL_QURAN)
      .map(f => f.modulNama);
    const uniqueModuls = Array.from(new Set(completedModuls || []));

    return {
      siswa,
      percent,
      surahDone: uniqueSurahs.length > 0 ? uniqueSurahs : ['An-Nas'],
      surahPending: ['Ad-Dhuha', 'Al-Mulk'].filter(n => !uniqueSurahs.includes(n)),
      modulDone: uniqueModuls.length > 0 ? uniqueModuls : ['Iqro Jilid 5'],
      modulPending: ['Hadits Pilihan'].filter(n => !uniqueModuls.includes(n)),
      harianDone,
      pekananDone,
      tahunanDone,
      isCustom: !!savedTarget?.isCustom,
      isTargetEnabled
    };
  });

  const monthlyEvaluationMetrics = useMemo(() => {
    let totalTargeted = 0;
    const reached: typeof studentProgressMetrics = [];
    const missed: typeof studentProgressMetrics = [];

    studentProgressMetrics.forEach(p => {
      const savedTarget = studentTargets[p.siswa.id];
      const config = (savedTarget?.isCustom && savedTarget?.config)
        ? savedTarget.config
        : (myHalaqah?.targetConfig || generalTargets?.config);

      if (!config || config.targetPeriod !== 'tahunan') {
        return;
      }

      totalTargeted++;
      const isMet = checkStudentTargetMetForMonth(p.siswa.id, evalMonthIdx);
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
  }, [studentProgressMetrics, evalMonthIdx, studentTargets, myHalaqah, generalTargets, setorans]);

  const getTargetTextForMonth = (config: any, monthIdx: number) => {
    if (!config) return 'Target Belum Dikonfigurasi';
    const mTarget = config.tahunanMonthlyTargets?.[monthIdx];
    if (!mTarget) return 'Target Belum Dikonfigurasi';

    const isQuran = config.selectedModulType === 'Al-Quran';
    if (isQuran) {
      if (mTarget.catatan) {
        return `📖 ${mTarget.catatan}`;
      }
      if (mTarget.suratAwal && mTarget.suratAwal === mTarget.suratAkhir) {
        return `📖 Surah ${mTarget.suratAwal} (Ayat ${mTarget.ayatAwal || 1}-${mTarget.ayatAkhir || 1})`;
      }
      return `📖 Surat ${mTarget.suratAwal || 'Al-Fatihah'} (Ayat ${mTarget.ayatAwal || 1}) s/d Surat ${mTarget.suratAkhir || 'Al-Baqarah'} (Ayat ${mTarget.ayatAkhir || 10})`;
    } else {
      const qNonQuranId = config.selectedNonQuranModulId || '';
      const qModulObj = moduls.find(m => m.id === qNonQuranId);
      const qIsSingleJilid = qModulObj ? (!qModulObj.isMultiJilid || !qModulObj.jumlahJilid || qModulObj.jumlahJilid <= 1) : false;
      
      if (qIsSingleJilid) {
        return `📚 ${qModulObj?.judulModul || 'Modul'}: Halaman ${mTarget.halamanAwal || 1} s/d Halaman ${mTarget.halamanAkhir || 10}`;
      } else {
        return `📚 ${qModulObj?.judulModul || 'Modul'}: Jilid ${mTarget.jilidAwal || 1} (Hal ${mTarget.halamanAwal || 1}) s/d Jilid ${mTarget.jilidAkhir || 1} (Hal ${mTarget.halamanAkhir || 10})`;
      }
    }
  };

  // ----------------------------------------------------
  // DATA SISWA HALAQAH GENERAL VIEW & FILTERS
  // ----------------------------------------------------
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaClassFilter, setSiswaClassFilter] = useState('All');
  const [siswaAchievementFilter, setSiswaAchievementFilter] = useState('All');

  const filteredHalaqahSiswa = myStudentsAll.filter(siswa => {
    if (siswaSearch && !siswa.namaLengkap.toLowerCase().includes(siswaSearch.toLowerCase()) && !siswa.nis.includes(siswaSearch)) {
      return false;
    }
    if (siswaClassFilter !== 'All' && siswa.kelasId !== siswaClassFilter) {
      return false;
    }
    // Filter achievement based on mock rules
    if (siswaAchievementFilter !== 'All') {
      const isHigh = studentProgressMetrics.find(m => m.siswa.id === siswa.id)?.percent || 0;
      if (siswaAchievementFilter === 'tinggi' && isHigh < 60) return false;
      if (siswaAchievementFilter === 'rendah' && isHigh >= 60) return false;
    }
    return true;
  });

  // ----------------------------------------------------
  // NOTIF DETAILS & ATTENTION REQUIRED
  // ----------------------------------------------------
  // Inactive notifications (>3 days of no setoran)
  const activeSiswaNeedAttention = myStudents.filter(s => {
    const sSets = setorans.filter(set => set.siswaId === s.id);
    if (sSets.length === 0) return true;
    
    const lastSet = sSets[0];
    const msDiff = Date.now() - new Date(lastSet.tanggalSetoran).getTime();
    const daysDiff = msDiff / (1000 * 60 * 60 * 24);
    return daysDiff > 3; // Trigger alert
  });

  // Today stats (Setorans entered for today)
  const todayStr = new Date().toISOString().split('T')[0];
  const setorToday = setorans.filter(s => s.tanggalSetoran === todayStr);
  const myStudentsSetorToday = setorToday.filter(s => myStudents.some(ms => ms.id === s.siswaId)).length;

  // Present today calculated from attendance state register
  const todayAtList = attendance.filter(a => a.tanggal === todayStr);
  const totalHalaqahHadirToday = todayAtList.filter(a => a.status === 'Hadir' && myStudents.some(ms => ms.id === a.siswaId)).length;

  // Finished achievements (statusLulus count of this Halaqah)
  const totalCapaianLulus = setorans.filter(s => s.statusLulus && myStudents.some(ms => ms.id === s.siswaId)).length;

  // ----------------------------------------------------
  // REAL EXPORTS & GOOGLE DRIVE INTEGRATION ENGINE
  // ----------------------------------------------------
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
      return `${s.modulNama} (${s.catatanModulLain})`;
    }
    return s.modulNama;
  };

  const getExportFileName = (): string => {
    let rangeText = historyDateFilter ? historyDateFilter : 'Semua_Periode';

    const guruObj = myGuruObj || (currentSession.user?.role === UserRole.GURU ? currentSession.user : null);
    const rawName = currentSession.user?.namaLengkap || guruObj?.namaLengkap || '';
    const isPerempuan = ((guruObj as any)?.jenisKelamin || (currentSession.user as any)?.jenisKelamin) === 'Perempuan' || ((guruObj as any)?.jenisKelamin || (currentSession.user as any)?.jenisKelamin) === JenisKelamin.PEREMPUAN;
    const title = isPerempuan ? 'Ustadzah' : 'Ustadz';
    const cleanName = rawName.replace(/^(ustadzah|ustadz|ust\.)\s+/i, '').trim();

    const teacherSuffix = cleanName ? `_${title} ${cleanName}` : '';

    return `Rekap_Setoran_${rangeText}${teacherSuffix}`;
  };

  const generateRekapSetoranPDF = (doc: jsPDF) => {
    doc.setFontSize(18);
    doc.setTextColor(15, 118, 110);
    doc.text('REKAP INTEGRAL SETORAN HALAQAH', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const displayHalaqahName = myHalaqah?.namaHalaqah || '-';
    doc.text(`Halaqah: ${displayHalaqahName} | Guru: ${currentSession.user?.namaLengkap || myGuruObj?.namaLengkap || '-'}`, 14, 26);
    doc.text(`Status Harian / Mutabaah | Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);
    
    doc.setDrawColor(148, 163, 184);
    doc.line(14, 36, 196, 36);

    // Measure maximum text widths
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    
    let maxTglW = doc.getTextWidth('Tanggal');
    let maxNamaW = doc.getTextWidth('Nama Santri');
    let maxMateriW = doc.getTextWidth('Materi Setoran');
    let maxNilaiW = doc.getTextWidth('Nilai');
    let maxStatusW = doc.getTextWidth('Status');
    
    filteredHistory.forEach(s => {
      const tglW = doc.getTextWidth(s.tanggalSetoran || '');
      if (tglW > maxTglW) maxTglW = tglW;
      
      const nameW = doc.getTextWidth(s.siswaNama || '');
      if (nameW > maxNamaW) maxNamaW = nameW;
      
      const formattedMateri = formatSetoranMateriDetail(s);
      const matW = doc.getTextWidth(formattedMateri);
      if (matW > maxMateriW) maxMateriW = matW;
      
      const nilW = doc.getTextWidth(s.nilai || '');
      if (nilW > maxNilaiW) maxNilaiW = nilW;
      
      const statText = s.statusLulus ? 'LULUS' : 'MENGULANG';
      const statW = doc.getTextWidth(statText);
      if (statW > maxStatusW) maxStatusW = statW;
    });
    
    const pad = 4;
    maxTglW += pad;
    maxNamaW += pad;
    maxMateriW += pad;
    maxNilaiW += pad;
    maxStatusW += pad;

    let wTgl = Math.max(maxTglW, 22);
    let wStatus = Math.max(maxStatusW, 25);
    
    let remWidth = 182 - wTgl - wStatus;
    
    let totalFlexibleReqWidth = maxNamaW + maxMateriW + maxNilaiW;
    let wNama = Math.round(remWidth * (maxNamaW / totalFlexibleReqWidth));
    let wMateri = Math.round(remWidth * (maxMateriW / totalFlexibleReqWidth));
    let wNilai = Math.round(remWidth * (maxNilaiW / totalFlexibleReqWidth));
    
    if (wNama < 35) wNama = 35;
    if (wNilai < 30) wNilai = 30;
    if (wMateri < 35) wMateri = 35;
    
    let currentTotal = wTgl + wStatus + wNama + wMateri + wNilai;
    if (currentTotal !== 182) {
      const diff = 182 - currentTotal;
      wMateri += diff;
    }

    const xTgl = 14;
    const xNama = xTgl + wTgl;
    const xMateri = xNama + wNama;
    const xNilai = xMateri + wMateri;
    const xStatus = xNilai + wNilai;

    const drawHeader = (headerY: number) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, headerY, 182, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('Tgl', xTgl + 1, headerY + 5.5);
      doc.text('Nama', xNama + 1.5, headerY + 5.5);
      doc.text('Materi Setoran', xMateri + 1.5, headerY + 5.5);
      doc.text('Nilai', xNilai + 1.5, headerY + 5.5);
      doc.text('Status', xStatus + 1, headerY + 5.5);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
    };

    let y = 44;
    drawHeader(y);
    y += 11;

    filteredHistory.forEach((s) => {
      const linesTgl = doc.splitTextToSize(s.tanggalSetoran || '', wTgl - 2);
      const linesNama = doc.splitTextToSize(s.siswaNama || '', wNama - 3);
      const linesMateri = doc.splitTextToSize(formatSetoranMateriDetail(s), wMateri - 3);
      const linesNilai = doc.splitTextToSize(s.nilai || '', wNilai - 3);
      const linesStatus = doc.splitTextToSize(s.statusLulus ? 'LULUS' : 'MENGULANG', wStatus - 2);

      const numLines = Math.max(linesTgl.length, linesNama.length, linesMateri.length, linesNilai.length, linesStatus.length);
      const rowHeight = numLines * 5 + 3;

      if (y + rowHeight > 280) {
        doc.addPage();
        y = 20;
        drawHeader(y);
        y += 11;
      }

      linesTgl.forEach((line, idx) => {
        doc.text(line, xTgl + 1, y + idx * 5 + 4);
      });
      linesNama.forEach((line, idx) => {
        doc.text(line, xNama + 1.5, y + idx * 5 + 4);
      });
      linesMateri.forEach((line, idx) => {
        doc.text(line, xMateri + 1.5, y + idx * 5 + 4);
      });
      linesNilai.forEach((line, idx) => {
        doc.text(line, xNilai + 1.5, y + idx * 5 + 4);
      });
      linesStatus.forEach((line, idx) => {
        doc.text(line, xStatus + 1, y + idx * 5 + 4);
      });

      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + rowHeight, 196, y + rowHeight);

      y += rowHeight;
    });
  };

  const exportToExcel = (name: string) => {
    setDownloading('Excel');
    try {
      let worksheetData: any[] = [];
      
      if (name.startsWith('Data_Siswa_Halaqah')) {
        worksheetData = filteredHalaqahSiswa.map((siswa, index) => {
          const progress = studentProgressMetrics.find(m => m.siswa.id === siswa.id)?.percent || 0;
          return {
            'No': index + 1,
            'Nama Lengkap': siswa.namaLengkap,
            'NIS': siswa.nis,
            'Kelas': siswa.kelasNama || '-',
            'Jenis Kelamin': siswa.jenisKelamin === JenisKelamin.LAKI_LAKI ? 'Laki-laki' : 'Perempuan',
            'Status': siswa.status,
            'Capaian Hafalan (%)': `${progress}%`
          };
        });
      } else if (name.startsWith('Rekap_Absensi')) {
        const studentIds = myStudents.map(s => s.id);
        const filteredEntries = getRekapFilteredEntries(rekapTimeframe).filter(e => studentIds.includes(e.siswaId));
        
        worksheetData = myStudents.map((siswa, index) => {
          const sEntries = filteredEntries.filter(e => e.siswaId === siswa.id);
          const total = sEntries.length;
          const hadir = sEntries.filter(e => e.status === 'Hadir').length;
          const izin = sEntries.filter(e => e.status === 'Izin').length;
          const sakit = sEntries.filter(e => e.status === 'Sakit').length;
          const alpha = sEntries.filter(e => e.status === 'Alpha').length;
          const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
          
          return {
            'No': index + 1,
            'Nama Santri': siswa.namaLengkap,
            'NIS': siswa.nis,
            'Total Pertemuan': total,
            'Hadir': hadir,
            'Izin': izin,
            'Sakit': sakit,
            'Alpha': alpha,
            'Persentase Kehadiran (%)': `${rate}%`
          };
        });
      } else if (name.startsWith('Rekap_Setoran_Halaqah') || name.startsWith('Rekap_Setoran_ALL Halaqah')) {
        worksheetData = filteredHistory.map((s, index) => ({
          'No': index + 1,
          'Tanggal': s.tanggalSetoran,
          'Nama Santri': s.siswaNama,
          'Materi Setoran / Juz / Surah': formatSetoranMateriDetail(s),
          'Nilai': s.nilai,
          'Status': s.statusLulus ? 'Lulus' : 'Mengulang'
        }));
      } else {
        worksheetData = [{ 'Status': 'No Data' }];
      }

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Data');
      
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const xlsxBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(xlsxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      addLog(`Export Excel`, `Mengekspor data ${name} ke Excel`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat mengekspor ke Excel: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const exportToPDF = (name: string) => {
    setDownloading('PDF');
    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal');
      
      if (name === 'Laporan_Halaqah') {
        doc.setFontSize(18);
        doc.setTextColor(15, 118, 110); // Teal
        doc.text('LAPORAN PERKEMBANGAN HALAQAH', 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Halaqah: ${myHalaqah?.namaHalaqah || '-'} | Guru: ${currentSession.user?.namaLengkap || myGuruObj?.namaLengkap || '-'}`, 14, 26);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);
        
        // Divider
        doc.setDrawColor(148, 163, 184);
        doc.line(14, 36, 196, 36);
        
        // Summary Stats block
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Ringkasan Informasi:', 14, 46);
        
        const studentIds = myStudents.map(s => s.id);
        const filteredEntries = getRekapFilteredEntries(rekapTimeframe).filter(e => studentIds.includes(e.siswaId));
        let totalRate = 0;
        myStudents.forEach(siswa => {
          const sEntries = filteredEntries.filter(e => e.siswaId === siswa.id);
          const total = sEntries.length;
          const hadir = sEntries.filter(e => e.status === 'Hadir').length;
          const rate = total > 0 ? Math.round((hadir / total) * 105) : 100;
          totalRate += Math.min(100, rate);
        });
        const listStatsAverageRate = myStudents.length > 0 ? Math.round(totalRate / myStudents.length) : 100;
        
        doc.setFontSize(10);
        doc.text(`• Total Santri Aktif: ${myStudents.length} Santri`, 18, 52);
        doc.text(`• Rerata Kehadiran Halaqah: ${listStatsAverageRate}%`, 18, 58);
        
        // Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(14, 66, 182, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('No', 16, 71.5);
        doc.text('Nama Santri', 26, 71.5);
        doc.text('NIS', 90, 71.5);
        doc.text('Kelas', 125, 71.5);
        doc.text('Hafalan (%)', 155, 71.5);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        let y = 80;
        filteredHalaqahSiswa.forEach((siswa, index) => {
          const progress = studentProgressMetrics.find(m => m.siswa.id === siswa.id)?.percent || 0;
          doc.text((index + 1).toString(), 16, y);
          doc.text(siswa.namaLengkap, 26, y);
          doc.text(siswa.nis, 90, y);
          doc.text(siswa.kelasNama || '-', 125, y);
          doc.text(`${progress}%`, 155, y);
          y += 8;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        
      } else if (name.startsWith('Rekap_Setoran_Halaqah') || name.startsWith('Rekap_Setoran_ALL Halaqah')) {
        generateRekapSetoranPDF(doc);
      } else if (name === 'Target_Perkembangan_Santri') {
        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text('RAPOR TARGET & PROGRES SANTRI', 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Halaqah: ${myHalaqah?.namaHalaqah || '-'} | Guru: ${currentSession.user?.namaLengkap || myGuruObj?.namaLengkap || '-'}`, 14, 26);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);
        
        doc.setDrawColor(148, 163, 184);
        doc.line(14, 36, 196, 36);
        
        // Table Header
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
      }

      doc.save(`${name}.pdf`);
      addLog(`Export PDF`, `Mengekspor data ${name} ke PDF`);
    } catch (error: any) {
      console.error(error);
      alert('Terjadi kesalahan saat mengekspor ke PDF: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const simulateExport = (type: 'PDF' | 'Excel', name: string) => {
    if (type === 'Excel') {
      exportToExcel(name);
    } else {
      exportToPDF(name);
    }
  };

  const handleConnectDriveAndSave = async (fileName: string, type: 'PDF' | 'Excel') => {
    try {
      const token = await signInWithGoogleWorkspace(UserRole.GURU);
      if (token) {
        setDriveAuthPrompt(null);
        // Small delay to allow the popup to close cleanly
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
      let mimeType = '';
      let extension = '';
      
      if (type === 'Excel') {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        let worksheetData: any[] = [];
        
        if (fileName.startsWith('Data_Siswa_Halaqah')) {
          worksheetData = filteredHalaqahSiswa.map((siswa, index) => {
            const progress = studentProgressMetrics.find(m => m.siswa.id === siswa.id)?.percent || 0;
            return {
              'No': index + 1,
              'Nama Lengkap': siswa.namaLengkap,
              'NIS': siswa.nis,
              'Kelas': siswa.kelasNama || '-',
              'Jenis Kelamin': siswa.jenisKelamin === JenisKelamin.LAKI_LAKI ? 'Laki-laki' : 'Perempuan',
              'Status': siswa.status,
              'Capaian Hafalan (%)': `${progress}%`
            };
          });
        } else if (fileName.startsWith('Rekap_Absensi')) {
          const studentIds = myStudents.map(s => s.id);
          const filteredEntries = getRekapFilteredEntries(rekapTimeframe).filter(e => studentIds.includes(e.siswaId));
          
          worksheetData = myStudents.map((siswa, index) => {
            const sEntries = filteredEntries.filter(e => e.siswaId === siswa.id);
            const total = sEntries.length;
            const hadir = sEntries.filter(e => e.status === 'Hadir').length;
            const izin = sEntries.filter(e => e.status === 'Izin').length;
            const sakit = sEntries.filter(e => e.status === 'Sakit').length;
            const alpha = sEntries.filter(e => e.status === 'Alpha').length;
            const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
            
            return {
              'No': index + 1,
              'Nama Santri': siswa.namaLengkap,
              'NIS': siswa.nis,
              'Total Pertemuan': total,
              'Hadir': hadir,
              'Izin': izin,
              'Sakit': sakit,
              'Alpha': alpha,
              'Persentase Kehadiran (%)': `${rate}%`
            };
          });
        } else if (fileName.startsWith('Rekap_Setoran_Halaqah') || fileName.startsWith('Rekap_Setoran_ALL Halaqah')) {
          worksheetData = filteredHistory.map((s, index) => ({
            'No': index + 1,
            'Tanggal': s.tanggalSetoran,
            'Nama Santri': s.siswaNama,
            'Materi Setoran / Juz / Surah': formatSetoranMateriDetail(s),
            'Nilai': s.nilai,
            'Status': s.statusLulus ? 'Lulus' : 'Mengulang'
          }));
        } else if (fileName.startsWith('Target_Perkembangan_Santri')) {
          worksheetData = studentProgressMetrics.map((p, index) => ({
            'No': index + 1,
            'Nama Santri': p.siswa.namaLengkap,
            'NIS': p.siswa.nis,
            'Kelas': p.siswa.kelasNama || '-',
            'Target Capaian Hafalan (%)': `${p.percent}% Selesai`
          }));
        } else {
          worksheetData = [{ 'Status': 'No Data' }];
        }
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Data');
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        fileBlob = new Blob([wbout], { type: mimeType });
        
      } else {
        mimeType = 'application/pdf';
        extension = 'pdf';
        const doc = new jsPDF();
        doc.setFont('Helvetica', 'normal');
        
        if (fileName === 'Laporan_Halaqah') {
          doc.setFontSize(18);
          doc.setTextColor(15, 118, 110);
          doc.text('LAPORAN PERKEMBANGAN HALAQAH', 14, 20);
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`Halaqah: ${myHalaqah?.namaHalaqah || '-'} | Guru: ${currentSession.user?.namaLengkap || myGuruObj?.namaLengkap || '-'}`, 14, 26);
          doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);
          doc.setDrawColor(148, 163, 184);
          doc.line(14, 36, 196, 36);
          
          doc.setFontSize(12);
          doc.setTextColor(30, 41, 59);
          doc.text('Ringkasan Informasi:', 14, 46);
          
          const studentIds = myStudents.map(s => s.id);
          const filteredEntries = getRekapFilteredEntries(rekapTimeframe).filter(e => studentIds.includes(e.siswaId));
          let totalRate = 0;
          myStudents.forEach(siswa => {
            const sEntries = filteredEntries.filter(e => e.siswaId === siswa.id);
            const total = sEntries.length;
            const hadir = sEntries.filter(e => e.status === 'Hadir').length;
            const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
            totalRate += rate;
          });
          const listStatsAverageRate = myStudents.length > 0 ? Math.round(totalRate / myStudents.length) : 100;
          
          doc.setFontSize(10);
          doc.text(`• Total Santri Aktif: ${myStudents.length} Santri`, 18, 52);
          doc.text(`• Rerata Kehadiran Halaqah: ${listStatsAverageRate}%`, 18, 58);
          
          doc.setFillColor(241, 245, 249);
          doc.rect(14, 66, 182, 8, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(51, 65, 85);
          doc.text('No', 16, 71.5);
          doc.text('Nama Santri', 26, 71.5);
          doc.text('NIS', 90, 71.5);
          doc.text('Kelas', 125, 71.5);
          doc.text('Hafalan (%)', 155, 71.5);
          
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          let y = 80;
          filteredHalaqahSiswa.forEach((siswa, index) => {
            const progress = studentProgressMetrics.find(m => m.siswa.id === siswa.id)?.percent || 0;
            doc.text((index + 1).toString(), 16, y);
            doc.text(siswa.namaLengkap, 26, y);
            doc.text(siswa.nis, 90, y);
            doc.text(siswa.kelasNama || '-', 125, y);
            doc.text(`${progress}%`, 155, y);
            y += 8;
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
          });
          
        } else if (fileName.startsWith('Rekap_Setoran_Halaqah') || fileName.startsWith('Rekap_Setoran_ALL Halaqah')) {
          generateRekapSetoranPDF(doc);
          
        } else if (fileName === 'Target_Perkembangan_Santri') {
          doc.setFontSize(18);
          doc.setTextColor(79, 70, 229);
          doc.text('RAPOR TARGET & PROGRES SANTRI', 14, 20);
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`Halaqah: ${myHalaqah?.namaHalaqah || '-'} | Guru: ${currentSession.user?.namaLengkap || myGuruObj?.namaLengkap || '-'}`, 14, 26);
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
        }
        
        fileBlob = doc.output('blob');
      }

      // Instead of direct saving, open the Folder & Filename Selector Modal
      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      setCustomFileName(fileName);
      setDriveSaveItem({
        blob: fileBlob,
        mimeType: mimeType,
        extension: extension,
        defaultName: fileName
      });
      // Fetch initial folders at root
      // We can trigger folder fetch using a helper
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
      // Refresh folder list
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

      // Parent constraint: if currentFolderId is not 'root', specify parents array
      const parents = currentFolderId && currentFolderId !== 'root' ? [currentFolderId] : undefined;

      // Step 1: Create File Metadata in Drive
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: finalName,
          mimeType: driveSaveItem.mimeType,
          description: `Disimpan dari Portal HalaqahMonitor oleh Guru`,
          ...(parents && { parents })
        })
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Gagal membuat metadata file di Google Drive');
      }

      const fileData = await createRes.json();
      const fileId = fileData.id;

      // Step 2: Upload File Content (PATCH method)
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
      addLog('Google Drive Save', `Menyimpan file ${finalName} ke Google Drive di folder ${folderName}`);
      setDriveSaveItem(null); // close modal
    } catch (err: any) {
      console.error(err);
      alert('Kesalahan saat menyimpan ke Google Drive: ' + err.message);
    } finally {
      setUploadingToDrive(null);
    }
  };

  // Change Password logic
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      alert('Lengkapi seluruh kolom password!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Konfirmasi password baru tidak cocok!');
      return;
    }
    addLog('Ganti Password', `Guru memperbarui kata sandi akun`);
    alert('Kata sandi Anda berhasil diubah!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // ----------------------------------------------------
  // RENDER SECTIONS
  // ----------------------------------------------------
  if (!myUser) return null;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      
      {/* ----------------------------------------------------
          SUB-TAB: GURU DASHBOARD
          ---------------------------------------------------- */}
      {(subTab === 'dashboard' || subTab === 'guru_dashboard') && (
        <GuruDashboard
          myHalaqah={myHalaqah}
          myStudents={myStudents}
          myStudentsAll={myStudentsAll}
          myGuruObj={myGuruObj}
          myUser={myUser}
          updateHalaqah={updateHalaqah}
          addLog={addLog}
          setActiveTab={setActiveTab}
          attendance={attendance}
        />
      )}

      {/* ----------------------------------------------------
          SUB-TAB: GURU DATA SISWA HALAQAH
          ---------------------------------------------------- */}
      {subTab === 'guru_siswas' && (
        <GuruSiswaHalaqah
          myHalaqah={myHalaqah}
          myStudents={myStudents}
          myStudentsAll={myStudentsAll}
          myUser={myUser}
          myGuruObj={myGuruObj}
          formatIndonesianDate={formatIndonesianDate}
          addLog={addLog}
          setActiveTab={setActiveTab}
          studentProgressMetrics={studentProgressMetrics}
          setSelectedSiswaProfile={setSelectedSiswaProfile}
        />
      )}

      {/* ----------------------------------------------------
          SUB-TAB: GURU MUTABAAH (INPUT & RIWAYAT SETORAN)
          ---------------------------------------------------- */}
      {(subTab === 'guru_mutabaah' || subTab === 'guru_input_setoran' || subTab === 'guru_riwayat_setoran' || subTab === 'guru_capaian_bacaan') && (
        <GuruMutabaah
          myHalaqah={myHalaqah}
          myStudents={myStudents}
          myUser={myUser}
          myGuruObj={myGuruObj}
          formatIndonesianDate={formatIndonesianDate}
          addLog={addLog}
          getElemenLineCountForPage={getElemenLineCountForPage}
          initialInnerTab={subTab === 'guru_capaian_bacaan' ? 'capaian_bacaan' : undefined}
        />
      )}

      {/* ====================================================
          SUB-TAB: GURU MUROJAAH BERPASANGAN
          ==================================================== */}
      {subTab === 'guru_murojaah_berpasangan' && (
        <GuruMurojaahBerpasangan 
          setActiveTab={setActiveTab}
          myHalaqah={myHalaqah}
          myStudents={myStudents}
        />
      )}

      {/* ----------------------------------------------------
          SUB-TAB: GURU ABSENSI HALAQAH
          ---------------------------------------------------- */}
      {subTab === 'guru_absensi' && (
        <GuruAbsensi 
          myHalaqah={myHalaqah}
          myStudents={myStudents}
          myUser={myUser}
          myGuruObj={myGuruObj}
          formatIndonesianDate={formatIndonesianDate}
          addLog={addLog}
        />
      )}
    </div>
  );
};
