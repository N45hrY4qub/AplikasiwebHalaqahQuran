/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  ArrowLeft,
  BookOpen, 
  Calendar, 
  Check, 
  CheckCircle2, 
  ChevronRight, 
  Clipboard, 
  ClipboardCheck, 
  ClipboardList, 
  FileCheck, 
  FileSignature, 
  FileText, 
  FileCode,
  GraduationCap, 
  HelpCircle, 
  Info, 
  Edit3,
  Plus, 
  Printer, 
  RotateCcw, 
  RefreshCw,
  Search, 
  Sparkles, 
  Trash2, 
  User, 
  UserCheck, 
  Users, 
  AlertCircle, 
  FileBadge, 
  TrendingUp,
  Dice5,
  Sliders,
  Shuffle,
  Volume2,
  UploadCloud,
  Globe,
  Tag,
  Layers,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Shield,
  ShieldAlert,
  Lock,
  X,
  Filter,
  ListChecks,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  UserRole, 
  KategoriAssessment, 
  StatusAktif, 
  JenisAssessment, 
  TemplateAssessment, 
  AssessmentRecord, 
  KoreksiLiveItem,
  Syahadah,
  TipeModul
} from '../types';
import { getCategorySubcategoriesList, isMakhrajOrHijaiyahCategory } from '../utils/tajwidDeduction';
import { getTeacherHalaqahs, normalizeHalaqahKey } from '../utils/studentAttendanceHelper';
import {
  DEFAULT_INSTITUTION_NAME,
  isLegacyPersonalData,
  isLegacyInstitutionBranding,
  resolveYayasanDisplayName
} from '../utils/brandingHelper';

// ==========================================
// QURAN SPECIAL DATA HELPER CONSTANTS
// ==========================================

export const QURAN_SURAHS = [
  { no: 1, nama: "Al-Fatihah", ayat: 7 },
  { no: 2, nama: "Al-Baqarah", ayat: 286 },
  { no: 3, nama: "Ali 'Imran", ayat: 200 },
  { no: 4, nama: "An-Nisa'", ayat: 176 },
  { no: 5, nama: "Al-Ma'idah", ayat: 120 },
  { no: 6, nama: "Al-An'am", ayat: 165 },
  { no: 7, nama: "Al-A'raf", ayat: 206 },
  { no: 8, nama: "Al-Anfal", ayat: 75 },
  { no: 9, nama: "At-Taubah", ayat: 129 },
  { no: 10, nama: "Yunus", ayat: 109 },
  { no: 11, nama: "Hud", ayat: 123 },
  { no: 12, nama: "Yusuf", ayat: 111 },
  { no: 13, nama: "Ar-Ra'd", ayat: 43 },
  { no: 14, nama: "Ibrahim", ayat: 52 },
  { no: 15, nama: "Al-Hijr", ayat: 99 },
  { no: 16, nama: "An-Nahl", ayat: 128 },
  { no: 17, nama: "Al-Isra'", ayat: 111 },
  { no: 18, nama: "Al-Kahf", ayat: 110 },
  { no: 19, nama: "Maryam", ayat: 98 },
  { no: 20, nama: "Taha", ayat: 135 },
  { no: 21, nama: "Al-Anbiya'", ayat: 112 },
  { no: 22, nama: "Al-Hajj", ayat: 78 },
  { no: 23, nama: "Al-Mu'minun", ayat: 118 },
  { no: 24, nama: "An-Nur", ayat: 64 },
  { no: 25, nama: "Al-Furqan", ayat: 77 },
  { no: 26, nama: "Asy-Syu'ara'", ayat: 227 },
  { no: 27, nama: "An-Naml", ayat: 93 },
  { no: 28, nama: "Al-Qasas", ayat: 88 },
  { no: 29, nama: "Al-'Ankabut", ayat: 69 },
  { no: 30, nama: "Ar-Rum", ayat: 60 },
  { no: 31, nama: "Luqman", ayat: 34 },
  { no: 32, nama: "As-Sajdah", ayat: 30 },
  { no: 33, nama: "Al-Ahzab", ayat: 73 },
  { no: 34, nama: "Saba'", ayat: 54 },
  { no: 35, nama: "Fatir", ayat: 45 },
  { no: 36, nama: "Yasin", ayat: 83 },
  { no: 37, nama: "As-Saffat", ayat: 182 },
  { no: 38, nama: "Sad", ayat: 88 },
  { no: 39, nama: "Az-Zumar", ayat: 75 },
  { no: 40, nama: "Ghafir", ayat: 85 },
  { no: 41, nama: "Fussilat", ayat: 54 },
  { no: 42, nama: "Asy-Syura", ayat: 53 },
  { no: 43, nama: "Az-Zukhruf", ayat: 89 },
  { no: 44, nama: "Ad-Dukhan", ayat: 59 },
  { no: 45, nama: "Al-Jasiyah", ayat: 37 },
  { no: 46, nama: "Al-Ahqaf", ayat: 35 },
  { no: 47, nama: "Muhammad", ayat: 38 },
  { no: 48, nama: "Al-Fath", ayat: 29 },
  { no: 49, nama: "Al-Hujurat", ayat: 18 },
  { no: 50, nama: "Qaf", ayat: 45 },
  { no: 51, nama: "Az-Zariyat", ayat: 60 },
  { no: 52, nama: "At-Tur", ayat: 49 },
  { no: 53, nama: "An-Najm", ayat: 62 },
  { no: 54, nama: "Al-Qamar", ayat: 55 },
  { no: 55, nama: "Ar-Rahman", ayat: 78 },
  { no: 56, nama: "Al-Waqi'ah", ayat: 96 },
  { no: 57, nama: "Al-Hadid", ayat: 29 },
  { no: 58, nama: "Al-Mujadilah", ayat: 22 },
  { no: 59, nama: "Al-Hasyr", ayat: 24 },
  { no: 60, nama: "Al-Mumtahanah", ayat: 13 },
  { no: 61, nama: "As-Saff", ayat: 14 },
  { no: 62, nama: "Al-Jumu'ah", ayat: 11 },
  { no: 63, nama: "Al-Munafiqun", ayat: 11 },
  { no: 64, nama: "At-Taghabun", ayat: 18 },
  { no: 65, text: "At-Talaq", nama: "At-Talaq", ayat: 12 },
  { no: 66, nama: "At-Tahrim", ayat: 12 },
  { no: 67, nama: "Al-Mulk", ayat: 30 },
  { no: 68, nama: "Al-Qalam", ayat: 52 },
  { no: 69, nama: "Al-Haqqah", ayat: 52 },
  { no: 70, nama: "Al-Ma'arij", ayat: 44 },
  { no: 71, nama: "Nuh", ayat: 28 },
  { no: 72, nama: "Al-Jinn", ayat: 28 },
  { no: 73, nama: "Al-Muzzammil", ayat: 20 },
  { no: 74, nama: "Al-Muddassir", ayat: 56 },
  { no: 75, nama: "Al-Qiyamah", ayat: 40 },
  { no: 76, nama: "Al-Insan", ayat: 31 },
  { no: 77, nama: "Al-Mursalat", ayat: 50 },
  { no: 78, nama: "An-Naba'", ayat: 40 },
  { no: 79, nama: "An-Nazi'at", ayat: 46 },
  { no: 80, nama: "'Abasa", ayat: 42 },
  { no: 81, nama: "At-Takwir", ayat: 29 },
  { no: 82, nama: "Al-Infitar", ayat: 19 },
  { no: 83, nama: "Al-Mutaffifin", ayat: 36 },
  { no: 84, nama: "Al-Insyiqaq", ayat: 25 },
  { no: 85, nama: "Al-Buruj", ayat: 22 },
  { no: 86, nama: "At-Tariq", ayat: 17 },
  { no: 87, nama: "Al-A'la", ayat: 19 },
  { no: 88, nama: "Al-Ghasyiyah", ayat: 26 },
  { no: 89, nama: "Al-Fajr", ayat: 30 },
  { no: 90, nama: "Al-Balad", ayat: 20 },
  { no: 91, nama: "Asy-Syams", ayat: 15 },
  { no: 92, nama: "Al-Lail", ayat: 21 },
  { no: 93, nama: "Ad-Duha", ayat: 11 },
  { no: 94, nama: "Asy-Syarh", ayat: 8 },
  { no: 95, nama: "At-Tin", ayat: 8 },
  { no: 96, nama: "Al-'Alaq", ayat: 19 },
  { no: 97, nama: "Al-Qadr", ayat: 5 },
  { no: 98, nama: "Al-Bayyinah", ayat: 8 },
  { no: 99, nama: "Al-Zalzalah", ayat: 8 },
  { no: 100, nama: "Al-'Adiyat", ayat: 11 },
  { no: 101, nama: "Al-Qari'ah", ayat: 11 },
  { no: 102, nama: "At-Takasur", ayat: 8 },
  { no: 103, nama: "Al-'Asr", ayat: 3 },
  { no: 104, nama: "Al-Humazah", ayat: 9 },
  { no: 105, nama: "Al-Fil", ayat: 5 },
  { no: 106, nama: "Quraisy", ayat: 4 },
  { no: 107, nama: "Al-Ma'un", ayat: 7 },
  { no: 108, nama: "Al-Kausar", ayat: 3 },
  { no: 109, nama: "Al-Kafirun", ayat: 6 },
  { no: 110, nama: "An-Nasr", ayat: 3 },
  { no: 111, nama: "Al-Lahab", ayat: 5 },
  { no: 112, nama: "Al-Ikhlas", ayat: 4 },
  { no: 113, nama: "Al-Falaq", ayat: 5 },
  { no: 114, nama: "An-Nas", ayat: 6 }
];

export interface MultiSurahPreset {
  id: string;
  nama: string;
  deskripsi: string;
  badge?: string;
  surahs: string[];
}

export const MULTI_SURAH_PRESETS: MultiSurahPreset[] = [
  {
    id: 'qiraah-wajib',
    nama: 'Paket Qiraah-Wajib',
    deskripsi: 'Al-Fatihah, Al-Kausar, Al-Kafirun, An-Nasr, Al-Lahab, Al-Ikhlas, Al-Falaq, An-Nas',
    badge: 'Qiraah-Wajib (8 Surat)',
    surahs: ['Al-Fatihah', 'Al-Kausar', 'Al-Kafirun', 'An-Nasr', 'Al-Lahab', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas']
  },
  {
    id: 'al-qul',
    nama: 'Trio Al-Qul',
    deskripsi: 'Al-Ikhlas, Al-Falaq, An-Nas (Surat Perlindungan / Mu\'awwidzatain)',
    badge: '3 Surat',
    surahs: ['Al-Ikhlas', 'Al-Falaq', 'An-Nas']
  },
  {
    id: 'surat-pendek-10',
    nama: '10 Surat Pendek Terakhir',
    deskripsi: 'Al-Fil, Quraisy, Al-Ma\'un, Al-Kausar, Al-Kafirun, An-Nasr, Al-Lahab, Al-Ikhlas, Al-Falaq, An-Nas',
    badge: '10 Surat Terakhir',
    surahs: ['Al-Fil', 'Quraisy', "Al-Ma'un", 'Al-Kausar', 'Al-Kafirun', 'An-Nasr', 'Al-Lahab', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas']
  },
  {
    id: 'fadhilah-pilihan',
    nama: 'Surat Pilihan & Fadhilah',
    deskripsi: 'Al-Fatihah, Al-Kahf, As-Sajdah, Yasin, Ar-Rahman, Al-Waqi\'ah, Al-Mulk, Al-Insan',
    badge: '8 Surat Pilihan',
    surahs: ['Al-Fatihah', 'Al-Kahf', 'As-Sajdah', 'Yasin', 'Ar-Rahman', "Al-Waqi'ah", 'Al-Mulk', 'Al-Insan']
  },
  {
    id: 'juz-30-full',
    nama: 'Juz 30 Lengkap',
    deskripsi: 'Seluruh 37 surat dalam Juz 30 (An-Naba\' s/d An-Nas)',
    badge: '37 Surat (Juz 30)',
    surahs: QURAN_SURAHS.slice(77).map(s => s.nama)
  }
];

export const SAMBUNG_AYAT_PRESETS = [
  { surah: "An-Naba'", ayat: 1, text: "عَمَّ يَتَسَاءَلُونَ", next: "عَنِ النَّبَإِ الْعَظِيمِ" },
  { surah: "An-Naba'", ayat: 31, text: "إِنَّ لِلْمُتَّقِينَ مَفَازًا", next: "حَدَائِقَ وَأَعْنَابًا" },
  { surah: "An-Nazi'at", ayat: 1, text: "وَالنَّازِعَاتِ غَرْقًا", next: "وَالنَّاشِطَاتِ نَشْطًا" },
  { surah: "Abasa", ayat: 1, text: "عَبَسَ وَتَوَلَّىٰ", next: "أَنْ جَاءَهُ الْأَعْمَىٰ" },
  { surah: "At-Takwir", ayat: 1, text: "إِذَا الشَّمْسُ كُوِّرَتْ", next: "وَإِذَا النُّجُومُ انْكَدَرَتْ" },
  { surah: "Al-Infitar", ayat: 1, text: "إِذَا السَّمَاءُ انْفَطَرَتْ", next: "وَإِذَا الْكَوَاكِبُ انْتَثَرَتْ" },
  { surah: "Al-Mutaffifin", ayat: 1, text: "وَيْلٌ لِلْمُطَفِّفِينَ", next: "الَّذِينَ إِذَا اکْتَالُوا عَلَى النَّاسِ يَسْتَوْفُونَ" },
  { surah: "Al-Buruj", ayat: 1, text: "وَالسَّمَاءِ ذَاتِ الْبُرُوجِ", next: "وَالْيَوْمِ الْمَوْعُودِ" },
  { surah: "At-Tariq", ayat: 1, text: "وَالسَّمَاءِ وَالطَّارِقِ", next: "وَمَا أَدْرَاكَ مَا الطَّارِقُ" },
  { surah: "Al-A'la", ayat: 1, text: "سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى", next: "الَّذِي خَلَقَ فَسَوَّىٰ" },
  { surah: "Al-Ghasyiyah", ayat: 1, text: "هَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ", next: "وُجُوهٌ يَوْمَئِذٍ خَاشِعَةٌ" },
  { surah: "Al-Fajr", ayat: 1, text: "وَالْفَجْرِ ۝ وَلَيَالٍ عَشْرٍ", next: "وَالشَّفْعِ وَالْوَتْرِ" },
  { surah: "Ad-Duha", ayat: 1, text: "وَالضُّحَىٰ ۝ وَاللَّيْلِ إِذَا سَجَىٰ", next: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ" },
  { surah: "Al-Mulk", ayat: 1, text: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ", next: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ" },
  { surah: "Al-Kahf", ayat: 1, text: "الْحَمْدُ لِلَّهِ الَّذِي أَنْزَلَ عَلَى عَبْدِهِ الْكِتَابَ", next: "قَيِّمًا لِيُنْذِرَ بَأْسًا شَدِيدًا" },
  { surah: "Yasin", ayat: 1, text: "يس ۝ وَالْقُرْآنِ الْحَكِيمِ", next: "إِنَّكَ لَمِنَ الْمُرْسَلِينَ" }
];

// ==========================================
// CENTRALIZED VIEW EXPORTS & HELPER UTILITIES
// ==========================================

export const getGoogleDocsEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('docs.google.com/document')) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/document/d/${match[1]}/preview`;
    }
  }
  return '';
};

export const toEasternArabicDigits = (num: number): string => {
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/\d/g, (digit) => easternDigits[parseInt(digit, 10)]);
};

export const formatArabicFontClean = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u06DF]/g, '') // Remove small high rounded zero symbol that displays as a black dot/circle on mobile
    .replace(/[\s\r\n\u200B\u200C\u200D\u200E\u200F]+$/, '')
    .trim();
};

export const paginateText = (text: string, charsPerPage: number = 800): string[] => {
  if (!text) return [''];
  const pages: string[] = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= charsPerPage) {
      pages.push(remaining);
      break;
    }
    let sliceIdx = charsPerPage;
    const lastSpace = remaining.lastIndexOf(' ', charsPerPage);
    if (lastSpace > charsPerPage * 0.6) {
      sliceIdx = lastSpace;
    }
    pages.push(remaining.substring(0, sliceIdx));
    remaining = remaining.substring(sliceIdx).trim();
  }
  return pages.length > 0 ? pages : [''];
};

export const resolveAssessmentPlaceholders = (
  text: string | undefined,
  rec: {
    tanggalAssessment?: string;
    siswaNama?: string;
    siswaNis?: string;
    siswaId?: string;
    halaqahNama?: string;
    namaAssessment?: string;
    ketuaPengujiNama?: string;
    guruNama?: string;
  } | null | undefined,
  primaryDoc?: {
    namaYayasan?: string;
    ttd1Nama?: string;
  } | null,
  siswas?: any[]
): string => {
  if (!text) return '';
  const d = rec?.tanggalAssessment ? new Date(rec.tanggalAssessment) : new Date();
  const hariStr = d.toLocaleDateString('id-ID', { weekday: 'long' });
  const tglStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const bulanStr = d.toLocaleDateString('id-ID', { month: 'long' });
  const tahunStr = d.getFullYear().toString();
  const tempatStr = primaryDoc?.namaYayasan || DEFAULT_INSTITUTION_NAME;
  const pengujiStr = rec?.ketuaPengujiNama || rec?.guruNama || primaryDoc?.ttd1Nama || 'Penguji Assessment';
  const matchedSiswa = siswas?.find((s: any) => s.id === rec?.siswaId || s.namaLengkap?.toLowerCase() === rec?.siswaNama?.toLowerCase());
  const nisStr = rec?.siswaNis || matchedSiswa?.nis || (rec?.siswaId && !rec?.siswaId.startsWith('sis-') ? rec.siswaId : (matchedSiswa?.nis || rec?.siswaId || '-'));

  return text
    .replace(/\[HARI\]/g, hariStr)
    .replace(/\[TANGGAL\]/g, tglStr)
    .replace(/\[BULAN\]/g, bulanStr)
    .replace(/\[TAHUN\]/g, tahunStr)
    .replace(/\[NAMA_SANTRI\]/g, rec?.siswaNama || 'Santri')
    .replace(/\[NIS\]/g, nisStr)
    .replace(/\[HALAQAH\]/g, rec?.halaqahNama || 'Umum')
    .replace(/\[MATERI\]/g, rec?.namaAssessment || 'Ujian Assessment')
    .replace(/\[TEMPAT\]/g, tempatStr)
    .replace(/\[PENGUJI\]/g, pengujiStr);
};

export const SURAH_SPECIAL_VERSES_PRESETS: Record<string, Array<{ nomorAyat: number; teksArab: string }>> = {
  'Al-Lahab': [
    { nomorAyat: 1, teksArab: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ' },
    { nomorAyat: 2, teksArab: 'مَا أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ' },
    { nomorAyat: 3, teksArab: 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ' },
    { nomorAyat: 4, teksArab: 'وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ' },
    { nomorAyat: 5, teksArab: 'فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍۭ' }
  ],
  'An-Nasr': [
    { nomorAyat: 1, teksArab: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ' },
    { nomorAyat: 2, teksArab: 'وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا' },
    { nomorAyat: 3, teksArab: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا' }
  ],
  'Al-Kafirun': [
    { nomorAyat: 1, teksArab: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ' },
    { nomorAyat: 2, teksArab: 'لَا أَعْبُدُ مَا تَعْبُدُونَ' },
    { nomorAyat: 3, teksArab: 'وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ' },
    { nomorAyat: 4, teksArab: 'وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ' },
    { nomorAyat: 5, teksArab: 'وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ' },
    { nomorAyat: 6, teksArab: 'لَكُمْ دِينُكُمْ وَلِيَ دِينِ' }
  ],
  'Al-Kautsar': [
    { nomorAyat: 1, teksArab: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ' },
    { nomorAyat: 2, teksArab: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ' },
    { nomorAyat: 3, teksArab: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ' }
  ],
  'Al-Ma\'un': [
    { nomorAyat: 1, teksArab: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ' },
    { nomorAyat: 2, teksArab: 'فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ' },
    { nomorAyat: 3, teksArab: 'وَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ' },
    { nomorAyat: 4, teksArab: 'فَوَيْلٌ لِّلْمُصَلِّينَ' },
    { nomorAyat: 5, teksArab: 'الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ' },
    { nomorAyat: 6, teksArab: 'الَّذِينَ هُمْ يُرَاءُونَ' },
    { nomorAyat: 7, teksArab: 'وَيَمْنَعُونَ الْمَاعُونَ' }
  ],
  'Quraisy': [
    { nomorAyat: 1, teksArab: 'لِإِيلَافِ قُرَيْشٍ' },
    { nomorAyat: 2, teksArab: 'إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ' },
    { nomorAyat: 3, teksArab: 'فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ' },
    { nomorAyat: 4, teksArab: 'الَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ' }
  ],
  'Al-Fil': [
    { nomorAyat: 1, teksArab: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ' },
    { nomorAyat: 2, teksArab: 'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ' },
    { nomorAyat: 3, teksArab: 'وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ' },
    { nomorAyat: 4, teksArab: 'تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ' },
    { nomorAyat: 5, teksArab: 'فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ' }
  ],
  'Al-Falaq': [
    { nomorAyat: 1, teksArab: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ' },
    { nomorAyat: 2, teksArab: 'مِن شَرِّ مَا خَلَقَ' },
    { nomorAyat: 3, teksArab: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ' },
    { nomorAyat: 4, teksArab: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ' },
    { nomorAyat: 5, teksArab: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ' }
  ],
  'An-Nas': [
    { nomorAyat: 1, teksArab: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ' },
    { nomorAyat: 2, teksArab: 'مَلِكِ النَّاسِ' },
    { nomorAyat: 3, teksArab: 'إِلَٰهِ النَّاسِ' },
    { nomorAyat: 4, teksArab: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ' },
    { nomorAyat: 5, teksArab: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ' },
    { nomorAyat: 6, teksArab: 'مِنَ الْجِنَّةِ وَالنَّاسِ' }
  ],
  'Al-Asr': [
    { nomorAyat: 1, teksArab: 'وَالْعَصْرِ' },
    { nomorAyat: 2, teksArab: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ' },
    { nomorAyat: 3, teksArab: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ' }
  ],
  'Al-Mulk': [
    { nomorAyat: 1, teksArab: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ' },
    { nomorAyat: 2, teksArab: 'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ' },
    { nomorAyat: 3, teksArab: 'ٱلَّذِى خَلَقَ سَبْعَ سَمَٰوَٰتٍ طِبَاقًا مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَٰنِ مِن تَفَٰوُتٍ فَٱرْجِعِ ٱلْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ' },
    { nomorAyat: 4, teksArab: 'ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ' },
    { nomorAyat: 5, teksArab: 'وَلَقَدْ زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا بِمَصَٰبِيحَ وَجَعَلْنَٰهَا رُجُومًا لِّلطَّلَبَةِ وَالشَّيَٰطِينِ وَأَعْتَدْنَا لَهُمْ عَذَابَ ٱلسَّعِيرِ' },
    { nomorAyat: 6, teksArab: 'وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ وَبِئْسَ ٱلْمَصِيرُ' },
    { nomorAyat: 7, teksArab: 'إِذَآ أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِىَ تَفُورُ' },
    { nomorAyat: 8, teksArab: 'تَكَادُ تَمَيَّزُ مِنَ ٱلْغَيْظِ كُلَّمَآ أُلْقِىَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَآ أَلَمْ يَأْتِكُمْ نَذِيرٌ' },
    { nomorAyat: 9, teksArab: 'قَالُوا بَلَىٰ قَدْ جَآءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ ٱللَّهُ مِن شَىْءٍ إِنْ أَنتُمْ إِلَّا فِى ضَلَٰلٍ كَبِيرٍ' },
    { nomorAyat: 10, teksArab: 'وَقَالُوا لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِىٓ أَصْحَٰبِ ٱلسَّعِيرِ' },
    { nomorAyat: 11, teksArab: 'فَٱعْتَرَفُوا بِذَنۢبِهِمْ فَسُحْقًا لِّأَصْحَٰبِ ٱلسَّعِيرِ' },
    { nomorAyat: 12, teksArab: 'إِنَّ ٱلَّذِينَ يَخْشَوْنَ رَبَّهُم بِٱلْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ' }
  ],
  "An-Naba'": [
    { nomorAyat: 1, teksArab: 'عَمَّ يَتَسَآءَلُونَ' },
    { nomorAyat: 2, teksArab: 'عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ' },
    { nomorAyat: 3, teksArab: 'ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ' },
    { nomorAyat: 4, teksArab: 'كَلَّا سَيَعْلَمُونَ' },
    { nomorAyat: 5, teksArab: 'ثُمَّ كَلَّا سَيَعْلَمُونَ' },
    { nomorAyat: 6, teksArab: 'أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَٰدًا' },
    { nomorAyat: 7, teksArab: 'وَٱلْجِبَالَ أَوْتَادًا' },
    { nomorAyat: 8, teksArab: 'وَخَلَقْنَٰكُمْ أَزْوَٰجًا' },
    { nomorAyat: 9, teksArab: 'وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا' },
    { nomorAyat: 10, teksArab: 'وَجَعَلْنَا ٱلَّيْلَ لِبَاسًا' }
  ],
  'Al-Fatihah': [
    { nomorAyat: 1, teksArab: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
    { nomorAyat: 2, teksArab: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { nomorAyat: 3, teksArab: 'مَٰلِكِ يَوْمِ ٱلدِّينِ' },
    { nomorAyat: 4, teksArab: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { nomorAyat: 5, teksArab: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
    { nomorAyat: 6, teksArab: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ' },
    { nomorAyat: 7, teksArab: 'غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' }
  ],
  'Al-Ikhlas': [
    { nomorAyat: 1, teksArab: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ' },
    { nomorAyat: 2, teksArab: 'ٱللَّهُ ٱلصَّمَدُ' },
    { nomorAyat: 3, teksArab: 'لَمْ يَلِدْ وَلَمْ يُولَدْ' },
    { nomorAyat: 4, teksArab: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ' }
  ]
};

export const TAJWID_PRESET_SUBCATEGORIES: Record<string, Array<{ id: string; nama: string }>> = {
  'idgham bighunnah': [
    { id: 'waw', nama: 'و (Waw)' },
    { id: 'ya', nama: 'ي (Ya)' },
    { id: 'nun', nama: 'ن (Nun)' },
    { id: 'mim', nama: 'م (Mim)' }
  ],
  'idgham bilaghunnah': [
    { id: 'lam', nama: 'ل (Lam)' },
    { id: 'ra', nama: 'ر (Ra)' }
  ],
  'iqlab': [
    { id: 'ba', nama: 'ب (Ba)' }
  ],
  'ikhfa': [
    { id: 'ta', nama: 'ت (Ta)' },
    { id: 'tsa', nama: 'ث (Tsa)' },
    { id: 'jim', nama: 'ج (Jim)' },
    { id: 'dal', nama: 'د (Dal)' },
    { id: 'dzal', nama: 'ذ (Dzal)' },
    { id: 'zai', nama: 'ز (Zai)' },
    { id: 'sin', nama: 'س (Sin)' },
    { id: 'syin', nama: 'ش (Syin)' },
    { id: 'shad', nama: 'ص (Shad)' },
    { id: 'dhad', nama: 'ض (Dhad)' },
    { id: 'tha', nama: 'ط (Tha)' },
    { id: 'zha', nama: 'ظ (Zha)' },
    { id: 'fa', nama: 'ف (Fa)' },
    { id: 'qaf', nama: 'ق (Qaf)' },
    { id: 'kaf', nama: 'ك (Kaf)' }
  ],
  'ikhfa haqiqi': [
    { id: 'ta', nama: 'ت (Ta)' },
    { id: 'tsa', nama: 'ث (Tsa)' },
    { id: 'jim', nama: 'ج (Jim)' },
    { id: 'dal', nama: 'د (Dal)' },
    { id: 'dzal', nama: 'ذ (Dzal)' },
    { id: 'zai', nama: 'ز (Zai)' },
    { id: 'sin', nama: 'س (Sin)' },
    { id: 'syin', nama: 'ش (Syin)' },
    { id: 'shad', nama: 'ص (Shad)' },
    { id: 'dhad', nama: 'ض (Dhad)' },
    { id: 'tha', nama: 'ط (Tha)' },
    { id: 'zha', nama: 'ظ (Zha)' },
    { id: 'fa', nama: 'ف (Fa)' },
    { id: 'qaf', nama: 'ق (Qaf)' },
    { id: 'kaf', nama: 'ك (Kaf)' }
  ],
  'izhar halqi': [
    { id: 'hamzah', nama: 'ء (Hamzah)' },
    { id: 'ha', nama: 'هـ (Ha)' },
    { id: 'ain', nama: 'ع (\'Ain)' },
    { id: 'ghain', nama: 'غ (Ghain)' },
    { id: 'ha_pedas', nama: 'ح (Ha)' },
    { id: 'kha', nama: 'خ (Kha)' }
  ],
  'izhar': [
    { id: 'hamzah', nama: 'ء (Hamzah)' },
    { id: 'ha', nama: 'هـ (Ha)' },
    { id: 'ain', nama: 'ع (\'Ain)' },
    { id: 'ghain', nama: 'غ (Ghain)' },
    { id: 'ha_pedas', nama: 'ح (Ha)' },
    { id: 'kha', nama: 'خ (Kha)' }
  ],
  'qalqalah': [
    { id: 'qaf', nama: 'ق (Qaf)' },
    { id: 'tha', nama: 'ط (Tha)' },
    { id: 'ba', nama: 'ب (Ba)' },
    { id: 'jim', nama: 'ج (Jim)' },
    { id: 'dal', nama: 'د (Dal)' }
  ],
  'ghunnah': [
    { id: 'mim_tasydid', nama: 'Mim Bertasydid (مّ)' },
    { id: 'nun_tasydid', nama: 'Nun Bertasydid (نّ)' }
  ],
  'mad': [
    { id: 'mad_thabii', nama: 'Mad Thabi\'i (2 Harakat)' },
    { id: 'mad_wajib', nama: 'Mad Wajib Muttashil (4-5 Harakat)' },
    { id: 'mad_jaiz', nama: 'Mad Jaiz Munfashil (4-5 Harakat)' },
    { id: 'mad_arid', nama: 'Mad \'Aridh Lissukun' },
    { id: 'mad_lazim', nama: 'Mad Lazim (6 Harakat)' }
  ],
  'mad thabi\'i': [
    { id: 'alif', nama: 'Alif didahului Fathah' },
    { id: 'ya', nama: 'Ya Sukun didahului Kasrah' },
    { id: 'waw', nama: 'Waw Sukun didahului Dhammah' }
  ],
  'salah harakat': [
    { id: 'fathah', nama: 'Fathah' },
    { id: 'kasrah', nama: 'Kasrah' },
    { id: 'dhammah', nama: 'Dhammah' },
    { id: 'tanwin', nama: 'Tanwin' },
    { id: 'sukun', nama: 'Sukun' },
    { id: 'tasydid', nama: 'Tasydid' }
  ],
  'ayat tersendat': [
    { id: 'tersendat', nama: 'Tersendat / Terhenti' },
    { id: 'salah_sambung', nama: 'Salah Sambung Ayat' },
    { id: 'terbata', nama: 'Terbata-bata' },
    { id: 'terulang', nama: 'Pengulangan Kata / Ayat' }
  ],
  'ayat tersendat / tidak lancar': [
    { id: 'tersendat', nama: 'Tersendat / Terhenti' },
    { id: 'salah_sambung', nama: 'Salah Sambung Ayat' },
    { id: 'terbata', nama: 'Terbata-bata' },
    { id: 'terulang', nama: 'Pengulangan Kata / Ayat' }
  ],
  'kelancaran': [
    { id: 'tersendat', nama: 'Tersendat / Terhenti' },
    { id: 'salah_sambung', nama: 'Salah Sambung Ayat' },
    { id: 'terbata', nama: 'Terbata-bata' },
    { id: 'terulang', nama: 'Pengulangan Kata / Ayat' }
  ],
  'lupa hafalan': [
    { id: 'lupa_total', nama: 'Lupa Total (Butuh Bimbingan)' },
    { id: 'kata_terlewat', nama: 'Ada Kata yang Terlewat' },
    { id: 'tertukar_ayat', nama: 'Tertukar dengan Ayat Lain' },
    { id: 'salah_urutan', nama: 'Salah Urutan Ayat' }
  ]
};

export const getSurahVerses = (surahName: string, totalAyat: number, moduls: any[]) => {
  if (!surahName) return [];
  const normalize = (str: string) => (str || '').toLowerCase().replace(/['"’`-]/g, '').replace(/^surah\s+|^surat\s+/, '').trim();
  const searchName = normalize(surahName);
  const targetTotal = totalAyat || 10;

  // 1. Search in moduls
  // Prioritize EXACT match on namaSurat first to prevent partial matches like "An-Nas" matching "An-Nasr"
  let matchedMod = moduls?.find(m => 
    (m.tipe === 'Al-Quran' || m.tipe === 'AL_QURAN' || m.tipe === TipeModul.AL_QURAN) && 
    (m.namaSurat && normalize(m.namaSurat) === searchName)
  );

  // Fallback to word-boundary match on judulModul if exact match fails
  if (!matchedMod) {
    matchedMod = moduls?.find(m => 
      (m.tipe === 'Al-Quran' || m.tipe === 'AL_QURAN' || m.tipe === TipeModul.AL_QURAN) && 
      (
        (m.judulModul && new RegExp(`\\b${searchName}\\b`, 'i').test(normalize(m.judulModul))) ||
        (m.namaSurat && new RegExp(`\\b${searchName}\\b`, 'i').test(normalize(m.namaSurat)))
      )
    );
  }

  if (matchedMod && (matchedMod.isiAyat?.length > 0 || matchedMod.ayatList?.length > 0)) {
    const list = matchedMod.isiAyat || matchedMod.ayatList;
    if (list.length >= targetTotal) {
      return list.slice(0, targetTotal);
    }
    if (list.length > 0) return list;
  }

  // 2. Search in SURAH_SPECIAL_VERSES_PRESETS
  let baseVerses: Array<{ nomorAyat: number; teksArab: string }> = [];
  for (const [presetKey, presetVerses] of Object.entries(SURAH_SPECIAL_VERSES_PRESETS)) {
    if (normalize(presetKey) === searchName) {
      baseVerses = [...presetVerses];
      break;
    }
  }

  const result = [...baseVerses];
  if (result.length >= targetTotal) {
    return result.slice(0, targetTotal);
  }

  const samplePhrases = [
    'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ',
    'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا',
    'إِنَّ ٱلَّذِينَ يَخْشَوْنَ رَبَّهُم بِٱلْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ',
    'وَأَسِرُّوا۟ قَوْلَكُمْ أَوِ ٱجْهَرُوا۟ بِهِۦٓ إِنَّهُۥ عَلِيمٌۢ بِذَاتِ ٱلصُّدُورِ',
    'أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ ٱللَّطِيفُ ٱلْخَبِيرُ',
    'هُوَ ٱلَّذِى جَعَلَ لَكُمُ ٱلْأَرْضَ ذَلُولًا فَٱمْشُوا۟ فِى مَنَاكِبِهَا وَكُلُوا۟ مِن رِّزْقِهِۦ',
    'ءَأَمِنتُم مَّن فِى ٱلسَّمَآءِ أَن يَخْسِفَ بِكُمُ ٱلْأَرْضَ فَإِذَا هِىَ تَمُورُ',
    'أَمْ أَمِنتُم مَّن فِى ٱلسَّمَآءِ أَن يُرْسِلَ عَلَيْكُمْ حَاصِبًا فَسَتَعْلَمُونَ كَيْفَ نَذِيرِ',
    'وَلَقَدْ كَذَّبَ ٱلَّذِينَ مِن قَبْلِهِمْ فَكَيْفَ كَانَ نَكِيرِ',
    'أَوَلَمْ يَرَوْا۟ إِلَى ٱلطَّيْرِ فَوْقَهُمْ صَٰٓفَّٰتٍ وَيَقْبِضْنَ مَا يُمْسِكُهُنَّ إِلَّا ٱلرَّحْمَٰنُ'
  ];

  for (let i = result.length + 1; i <= targetTotal; i++) {
    result.push({
      nomorAyat: i,
      teksArab: samplePhrases[(i - 1) % samplePhrases.length]
    });
  }

  return result;
};

export const mapErrorCategoryToRubrikCriterion = (
  categoryName: string,
  rubrikList: any[],
  tajwidCategoriesList?: any[],
  klasifikasiTypesList?: any[]
) => {
  if (!rubrikList || rubrikList.length === 0) return null;
  const rawCat = (categoryName || '').trim();
  const catLower = rawCat.toLowerCase();

  // Extract base category without parentheses (e.g., "Pelafalan huruf (ت)" -> "Pelafalan huruf")
  const baseCategory = rawCat.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();

  // Find corresponding tajwid category in master list to get its classification type (tipe)
  const matchedTajwidCat = tajwidCategoriesList?.find(
    tc => tc.nama?.toLowerCase() === catLower ||
          tc.nama?.toLowerCase() === baseCategory ||
          tc.id === rawCat ||
          catLower.startsWith(tc.nama?.toLowerCase() || '___')
  );
  const errorTipe = matchedTajwidCat?.tipe?.toLowerCase();

  // Helper to resolve a categoryId or category name into all matching names/IDs
  const getCatAliases = (cIdOrName: string): string[] => {
    const list = [cIdOrName.toLowerCase()];
    if (tajwidCategoriesList && tajwidCategoriesList.length > 0) {
      const found = tajwidCategoriesList.find(
        tc => tc.id === cIdOrName || tc.nama?.toLowerCase() === cIdOrName.toLowerCase()
      );
      if (found) {
        if (found.id) list.push(found.id.toLowerCase());
        if (found.nama) list.push(found.nama.toLowerCase());
      }
    }
    if (klasifikasiTypesList && klasifikasiTypesList.length > 0) {
      const foundType = klasifikasiTypesList.find(
        kt => kt.id === cIdOrName || kt.nama?.toLowerCase() === cIdOrName.toLowerCase()
      );
      if (foundType) {
        if (foundType.id) list.push(foundType.id.toLowerCase());
        if (foundType.nama) list.push(foundType.nama.toLowerCase());
      }
    }
    return list;
  };

  // 0. Primary Match: Check if rubric's categoryIds directly contain or correspond to this classification type or specific category
  const rubricWithCatMatch = rubrikList.find(r => {
    if (!r.categoryIds || !Array.isArray(r.categoryIds)) return false;
    return r.categoryIds.some((cid: string) => {
      const cidLower = (cid || '').toLowerCase();
      // Skip general / non-error rubric criteria (misal: adab, kerapihan, sikap)
      if (cidLower === 'kriteria_umum' || cidLower === 'umum' || cidLower === 'non_kesalahan') {
        return false;
      }
      // Check if error's classification type directly matches this rubric's cid
      if (errorTipe && (cidLower === errorTipe || (cidLower === 'lahn_jaliy' && errorTipe === 'dasar') || (cidLower === 'dasar' && errorTipe === 'lahn_jaliy'))) {
        return true;
      }
      const aliases = getCatAliases(cid);
      if (errorTipe && aliases.includes(errorTipe)) {
        return true;
      }
      return aliases.some(alias => 
        alias === catLower ||
        alias === baseCategory ||
        catLower.startsWith(alias) ||
        baseCategory === alias
      );
    });
  });
  if (rubricWithCatMatch) return rubricWithCatMatch;

  // 1. Direct or partial match on rubric criterion name (kriteria / namaKriteria), excluding purely general criteria
  const directMatch = rubrikList.find(r => {
    const isPurelyUmum = (r.categoryIds || []).length > 0 && (r.categoryIds || []).every((c: string) => c === 'kriteria_umum' || c === 'umum');
    if (isPurelyUmum) return false;
    const k = (r.kriteria || r.namaKriteria || '').toLowerCase();
    return k === catLower || k === baseCategory || k.includes(baseCategory) || baseCategory.includes(k);
  });
  if (directMatch) return directMatch;

  // 2. Intelligent Tajwid / Khafiy rules (Hukum tajwid, nun sukun, mim sukun, idgham, ikhfa, mad, dll)
  // MUST precede broad letter checks so "Pelafalan huruf" vs "Hukum nun sukun/tanwin (idgham bighunnah)" are differentiated
  const isKhafiyOrTajwid = 
    baseCategory.includes('nun') ||
    baseCategory.includes('tanwin') ||
    baseCategory.includes('mim') ||
    baseCategory.includes('idgham') ||
    baseCategory.includes('ikhfa') ||
    baseCategory.includes('izhar') ||
    baseCategory.includes('iqlab') ||
    baseCategory.includes('mad') ||
    baseCategory.includes('ghunnah') ||
    baseCategory.includes('sifat') ||
    baseCategory.includes('khafiy') ||
    baseCategory.includes('tajwid') ||
    catLower.includes('nun sukun') ||
    catLower.includes('tanwin') ||
    catLower.includes('idgham') ||
    catLower.includes('ikhfa') ||
    catLower.includes('iqlab') ||
    catLower.includes('ghunnah') ||
    catLower.includes('khafiy');

  if (isKhafiyOrTajwid) {
    const matched = rubrikList.find(r => {
      const k = (r.kriteria || r.namaKriteria || '').toLowerCase();
      return k.includes('khafiy') || k.includes('tajwid');
    });
    if (matched) return matched;
  }

  // 3. Jaliy / Fashohah / Makhraj rules (Lahn Jaliy: makhraj, pelafalan huruf, salah huruf, harakat tertukar, dll)
  const isJaliy = 
    baseCategory.includes('jaliy') ||
    baseCategory.includes('makhraj') ||
    baseCategory.includes('pelafalan') ||
    baseCategory.includes('salah huruf') ||
    baseCategory.includes('harakat') ||
    catLower.includes('jaliy') ||
    catLower.includes('makhraj') ||
    catLower.includes('pelafalan');

  if (isJaliy) {
    const matched = rubrikList.find(r => {
      const k = (r.kriteria || r.namaKriteria || '').toLowerCase();
      return k.includes('jaliy') || k.includes('makhraj') || k.includes('fashohah');
    });
    if (matched) return matched;
  }

  // 4. Kelancaran / Waqaf Ibtida rules
  const isKelancaran = 
    baseCategory.includes('lancar') ||
    baseCategory.includes('kelancaran') ||
    baseCategory.includes('sendat') ||
    baseCategory.includes('lupa') ||
    baseCategory.includes('hafalan') ||
    baseCategory.includes('ayat') ||
    baseCategory.includes('waqaf') ||
    baseCategory.includes('ibtida') ||
    catLower.includes('lancar') ||
    catLower.includes('sendat') ||
    catLower.includes('lupa');

  if (isKelancaran) {
    const matched = rubrikList.find(r => {
      const k = (r.kriteria || r.namaKriteria || '').toLowerCase();
      return k.includes('lancar') || k.includes('kelancaran') || k.includes('hafal');
    });
    if (matched) return matched;
  }

  // 5. Generic 'huruf' check only if not matched as Khafiy
  if (baseCategory.includes('huruf') || catLower.includes('huruf')) {
    const matched = rubrikList.find(r => {
      const k = (r.kriteria || r.namaKriteria || '').toLowerCase();
      return k.includes('jaliy') || k.includes('makhraj') || k.includes('huruf');
    });
    if (matched) return matched;
  }

  // Fallback to the first rubric item
  return rubrikList[0];
};

export function ManageAssessment() {
  const { 
    jenisAssessments, 
    createJenisAssessment, 
    updateJenisAssessment, 
    deleteJenisAssessment,
    templateAssessments,
    createTemplateAssessment,
    updateTemplateAssessment,
    deleteTemplateAssessment,
    elemenSettings,
    mataPelajarans = [],
    moduls = [],
    tajwidCategories = [],
    klasifikasiKesalahanTypes = [],
    pwaSettings,
    updatePwaSettings,
    docTemplates: globalDocTemplates,
    updateDocTemplates,
    strukturLembaga,
    addLog
  } = useApp();

  const resolvedInstName = resolveYayasanDisplayName(strukturLembaga?.yayasan?.nama);
  const resolvedInstUpper = resolvedInstName.toUpperCase();
  const resolvedAlamatFallback = `Sekretariat ${resolvedInstName}`;

  const [activeTab, setActiveTab] = useState<'jenis' | 'template' | 'dokumen'>('jenis');

  // Berita Acara & Document Templates states
  // Confirmation Delete Modal State
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'jenis' | 'template' | 'doc' | 'reset_doc_templates';
    id: string;
    title: string;
    desc?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      if (confirmDelete.type === 'jenis') {
        deleteJenisAssessment(confirmDelete.id);
      } else if (confirmDelete.type === 'template') {
        deleteTemplateAssessment(confirmDelete.id);
      } else if (confirmDelete.type === 'doc') {
        const filtered = docTemplates.filter(d => d.id !== confirmDelete.id);
        setDocTemplates(filtered);
        if (activeDocId === confirmDelete.id) {
          setActiveDocId(filtered[0]?.id || '');
        }
        setBaSuccessMsg('Template dokumen berhasil dihapus.');
        setTimeout(() => setBaSuccessMsg(''), 4000);
      } else if (confirmDelete.type === 'reset_doc_templates') {
        setDocTemplates(defaultDocTemplates);
        setActiveDocId(defaultDocTemplates[0].id);
        if (updateDocTemplates) {
          await updateDocTemplates(defaultDocTemplates);
        } else {
          localStorage.setItem('mh_doc_templates', JSON.stringify(defaultDocTemplates));
        }
        setBaSuccessMsg('Seluruh template dokumen berhasil dikembalikan ke standar awal!');
        setTimeout(() => setBaSuccessMsg(''), 4000);
      }
      setConfirmDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultDocTemplates = useMemo(() => [
    {
      id: 'doc-ba-default',
      judulDokumen: 'Berita Acara Assessment Kelulusan Santri',
      peruntukan: 'BERITA ACARA ASSESSMENT',
      namaYayasan: (pwaSettings?.baNamaYayasan && !isLegacyInstitutionBranding(pwaSettings.baNamaYayasan)) ? pwaSettings.baNamaYayasan : resolvedInstUpper,
      namaPanitia: pwaSettings?.baNamaPanitia || 'PANITIA ASSESSMENT & EVALUASI AKADEMIK SANTRI',
      alamatKontak: (pwaSettings?.baAlamatKontak && !isLegacyPersonalData(pwaSettings.baAlamatKontak)) ? pwaSettings.baAlamatKontak : resolvedAlamatFallback,
      ttd1Jabatan: pwaSettings?.baTtd1Jabatan || 'PENGUJI',
      ttd1Nama: (pwaSettings?.baTtd1Nama && !isLegacyPersonalData(pwaSettings.baTtd1Nama)) ? pwaSettings.baTtd1Nama : 'Penguji Assessment',
      ttd1Sub: '',
      ttd2Jabatan: pwaSettings?.baTtd2Jabatan || 'KOORDINATOR BIDANG',
      ttd2Nama: (pwaSettings?.baTtd2Nama && !isLegacyPersonalData(pwaSettings.baTtd2Nama)) ? pwaSettings.baTtd2Nama : 'Koordinator Bidang',
      ttd2Sub: '',
      nomorFormat: 'BA/ASS/2026/07/004',
      teksPengantar: 'Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT] oleh Tim Dewan Penguji terhadap santri di bawah ini dengan hasil rekapitulasi penilaian sebagai berikut:',
      teksPenutup: 'Demikian berita acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
      catatanKaki: 'Dokumen ini diterbitkan secara sah oleh Panitia Assessment Santri.',
      isDefault: true
    },
    {
      id: 'doc-transkrip-default',
      judulDokumen: 'Lembar Rincian Evaluasi & Transkrip Nilai Assessment',
      peruntukan: 'LEMBAR PENILAIAN & TRANSKRIP',
      namaYayasan: (pwaSettings?.baNamaYayasan && !isLegacyInstitutionBranding(pwaSettings.baNamaYayasan)) ? pwaSettings.baNamaYayasan : resolvedInstUpper,
      namaPanitia: 'TIM EVALUASI DAN PENILAIAN AKADEMIK SANTRI',
      alamatKontak: (pwaSettings?.baAlamatKontak && !isLegacyPersonalData(pwaSettings.baAlamatKontak)) ? pwaSettings.baAlamatKontak : resolvedAlamatFallback,
      ttd1Jabatan: 'PENGUJI',
      ttd1Nama: (pwaSettings?.baTtd1Nama && !isLegacyPersonalData(pwaSettings.baTtd1Nama)) ? pwaSettings.baTtd1Nama : 'Penguji Assessment',
      ttd1Sub: '',
      ttd2Jabatan: 'KOORDINATOR BIDANG',
      ttd2Nama: (pwaSettings?.baTtd2Nama && !isLegacyPersonalData(pwaSettings.baTtd2Nama)) ? pwaSettings.baTtd2Nama : 'Koordinator Bidang',
      ttd2Sub: '',
      nomorFormat: 'TRK/EVAL/2026/07/012',
      teksPengantar: 'Berikut adalah rincian transkrip penilaian evaluasi pembelajaran santri berdasarkan kriteria rubrik:',
      teksPenutup: 'Demikian rincian evaluasi hasil ujian assessment ini untuk dijadikan acuan pembelajaran.',
      catatanKaki: 'Rincian nilai mencakup evaluasi tajwid, fashohah, dan kelancaran hafalan.',
      isDefault: true
    },
    {
      id: 'doc-sertifikat-default',
      judulDokumen: 'Sertifikat Kelulusan Ujian & Syahadah Assessment',
      peruntukan: 'SERTIFIKAT KELULUSAN',
      namaYayasan: (pwaSettings?.baNamaYayasan && !isLegacyInstitutionBranding(pwaSettings.baNamaYayasan)) ? pwaSettings.baNamaYayasan : resolvedInstUpper,
      namaPanitia: 'PANITIA SYAHADAH & KELULUSAN UJIAN TAHFIDZ',
      alamatKontak: (pwaSettings?.baAlamatKontak && !isLegacyPersonalData(pwaSettings.baAlamatKontak)) ? pwaSettings.baAlamatKontak : resolvedAlamatFallback,
      ttd1Jabatan: 'PENGUJI',
      ttd1Nama: (pwaSettings?.baTtd1Nama && !isLegacyPersonalData(pwaSettings.baTtd1Nama)) ? pwaSettings.baTtd1Nama : 'Penguji Assessment',
      ttd1Sub: '',
      ttd2Jabatan: 'KOORDINATOR BIDANG',
      ttd2Nama: (pwaSettings?.baTtd2Nama && !isLegacyPersonalData(pwaSettings.baTtd2Nama)) ? pwaSettings.baTtd2Nama : 'Koordinator Bidang',
      ttd2Sub: '',
      nomorFormat: 'SRT/LULUS/2026/07/088',
      teksPengantar: 'Diberikan kepada santri atas keberhasilan menyelesaikan seluruh tahapan ujian assessment dengan predikat kelulusan:',
      teksPenutup: 'Semoga ilmu yang diperoleh mendatangkan keberkahan dan dapat terus diamalkan.',
      catatanKaki: 'Diberikan kepada santri yang dinyatakan LULUS Mumtaz pada Ujian Assessment.',
      isDefault: true
    }
  ], [pwaSettings, resolvedInstUpper, resolvedAlamatFallback]);

  const sanitizeTemplateSignatures = (tmpl: any) => {
    if (!tmpl) return tmpl;
    const t1 = (tmpl.ttd1Jabatan || '').toLowerCase();
    const t2 = (tmpl.ttd2Jabatan || '').toLowerCase();
    const isOldTtd1 = !tmpl.ttd1Jabatan || 
      t1.includes('penguji assessment') || 
      t1.includes('guru penguji') || 
      t1.includes('ketua tim penguji') || 
      t1.includes('ketua penguji');
    const isOldTtd2 = !tmpl.ttd2Jabatan || 
      t2.includes('pimpinan pesantren') || 
      t2.includes('pengasuh') || 
      t2.includes('koordinator madrasah') || 
      t2.includes('kepala bagian kurikulum');
    const safeNamaYayasan = (tmpl.namaYayasan && !isLegacyInstitutionBranding(tmpl.namaYayasan)) ? tmpl.namaYayasan : resolvedInstUpper;
    const safeAlamatKontak = (tmpl.alamatKontak && !isLegacyPersonalData(tmpl.alamatKontak)) ? tmpl.alamatKontak : resolvedAlamatFallback;
    const safeTtd1Nama = (tmpl.ttd1Nama && !isLegacyPersonalData(tmpl.ttd1Nama) && !tmpl.ttd1Nama.toLowerCase().includes('asatidzah')) ? tmpl.ttd1Nama : 'Penguji Assessment';
    const safeTtd2Nama = (tmpl.ttd2Nama && !isLegacyPersonalData(tmpl.ttd2Nama)) ? tmpl.ttd2Nama : 'Koordinator Bidang';

    return {
      ...tmpl,
      namaYayasan: safeNamaYayasan,
      alamatKontak: safeAlamatKontak,
      ttd1Jabatan: isOldTtd1 ? 'PENGUJI' : tmpl.ttd1Jabatan,
      ttd1Nama: safeTtd1Nama,
      ttd1Sub: '',
      ttd2Jabatan: isOldTtd2 ? 'KOORDINATOR BIDANG' : tmpl.ttd2Jabatan,
      ttd2Nama: safeTtd2Nama,
      ttd2Sub: ''
    };
  };

  const [docTemplates, setDocTemplates] = useState<any[]>(() => {
    if (globalDocTemplates && globalDocTemplates.length > 0) {
      return globalDocTemplates.map(sanitizeTemplateSignatures);
    }
    try {
      const saved = localStorage.getItem('mh_doc_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeTemplateSignatures);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaultDocTemplates;
  });

  // Sync when globalDocTemplates changes from Firestore
  React.useEffect(() => {
    if (globalDocTemplates && globalDocTemplates.length > 0) {
      setDocTemplates(globalDocTemplates.map(sanitizeTemplateSignatures));
    }
  }, [globalDocTemplates]);

  const [activeDocId, setActiveDocId] = useState<string>(docTemplates[0]?.id || 'doc-ba-default');
  const [docDisplayMode, setDocDisplayMode] = useState<'tab' | 'stacked'>('tab');

  const [isSavingBa, setIsSavingBa] = useState(false);
  const [baSuccessMsg, setBaSuccessMsg] = useState('');
  const [baErrorMsg, setBaErrorMsg] = useState('');

  // Persist docTemplates to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('mh_doc_templates', JSON.stringify(docTemplates));
    } catch (e) {
      console.error(e);
    }
  }, [docTemplates]);

  // Keep primary Berita Acara doc in sync with pwaSettings
  React.useEffect(() => {
    if (pwaSettings && docTemplates.length > 0) {
      const primaryBA = docTemplates.find(d => d.peruntukan === 'BERITA ACARA ASSESSMENT') || docTemplates[0];
      if (primaryBA) {
        setDocTemplates(prev => prev.map(d => d.id === primaryBA.id ? {
          ...d,
          namaYayasan: (pwaSettings.baNamaYayasan && !isLegacyInstitutionBranding(pwaSettings.baNamaYayasan)) ? pwaSettings.baNamaYayasan : d.namaYayasan,
          namaPanitia: pwaSettings.baNamaPanitia || d.namaPanitia,
          alamatKontak: (pwaSettings.baAlamatKontak && !isLegacyPersonalData(pwaSettings.baAlamatKontak)) ? pwaSettings.baAlamatKontak : d.alamatKontak,
          ttd1Jabatan: (pwaSettings.baTtd1Jabatan && pwaSettings.baTtd1Jabatan !== 'Ketua Tim Penguji / Penguji Utama' && pwaSettings.baTtd1Jabatan !== 'Ketua Tim Penguji') ? pwaSettings.baTtd1Jabatan : (d.ttd1Jabatan || 'PENGUJI'),
          ttd1Nama: (pwaSettings.baTtd1Nama && !isLegacyPersonalData(pwaSettings.baTtd1Nama)) ? pwaSettings.baTtd1Nama : ((pwaSettings.baTtd1Sub && !isLegacyPersonalData(pwaSettings.baTtd1Sub) && pwaSettings.baTtd1Sub !== 'Asatidzah Penguji' && pwaSettings.baTtd1Sub !== 'Penguji Assessment') ? pwaSettings.baTtd1Sub : (d.ttd1Nama || 'Penguji Assessment')),
          ttd1Sub: '',
          ttd2Jabatan: (pwaSettings.baTtd2Jabatan && pwaSettings.baTtd2Jabatan !== 'Koordinator Madrasah / Pengasuh' && pwaSettings.baTtd2Jabatan !== 'Pimpinan Pesantren') ? pwaSettings.baTtd2Jabatan : (d.ttd2Jabatan || 'KOORDINATOR BIDANG'),
          ttd2Nama: (pwaSettings.baTtd2Nama && !isLegacyPersonalData(pwaSettings.baTtd2Nama)) ? pwaSettings.baTtd2Nama : (d.ttd2Nama || 'Koordinator Bidang'),
          ttd2Sub: (pwaSettings.baTtd2Sub && pwaSettings.baTtd2Sub !== 'Pimpinan Pesantren') ? pwaSettings.baTtd2Sub : '',
        } : d));
      }
    }
  }, [pwaSettings]);

  const updateDocField = (docId: string, field: string, val: any) => {
    setDocTemplates(prev => prev.map(d => d.id === docId ? { ...d, [field]: val } : d));
  };

  const handleAddDocTemplate = () => {
    const newId = `doc-custom-${Date.now()}`;
    const newDoc = {
      id: newId,
      judulDokumen: 'Dokumen Assessment Baru',
      peruntukan: 'SURAT KETERANGAN EVALUASI',
      namaYayasan: docTemplates[0]?.namaYayasan || resolvedInstUpper,
      namaPanitia: 'PANITIA EVALUASI AKADEMIK SANTRI',
      alamatKontak: docTemplates[0]?.alamatKontak || resolvedAlamatFallback,
      ttd1Jabatan: 'PENGUJI',
      ttd1Nama: docTemplates[0]?.ttd1Nama || 'Penguji Assessment',
      ttd1Sub: '',
      ttd2Jabatan: 'KOORDINATOR BIDANG',
      ttd2Nama: docTemplates[0]?.ttd2Nama || 'Koordinator Bidang',
      ttd2Sub: '',
      nomorFormat: `SK/ASS/${new Date().getFullYear()}/001`,
      teksPengantar: 'Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT] oleh Tim Dewan Penguji terhadap santri di bawah ini dengan hasil rekapitulasi penilaian sebagai berikut:',
      teksPenutup: 'Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.',
      catatanKaki: 'Dokumen rujukan evaluasi resmi.',
      isDefault: false
    };
    setDocTemplates(prev => [...prev, newDoc]);
    setActiveDocId(newId);
    setBaSuccessMsg('Template dokumen baru berhasil ditambahkan!');
    setTimeout(() => setBaSuccessMsg(''), 4000);
  };

  const handleDeleteDocTemplate = (docId: string) => {
    if (docTemplates.length <= 1) {
      alert('Tidak dapat menghapus dokumen terakhir.');
      return;
    }
    const target = docTemplates.find(d => d.id === docId);
    setConfirmDelete({
      type: 'doc',
      id: docId,
      title: target?.judulDokumen || 'Dokumen Berita Acara',
      desc: `Format: ${target?.nomorFormat || '-'}`
    });
  };

  const handleDuplicateDocTemplate = (docId: string) => {
    const target = docTemplates.find(d => d.id === docId);
    if (!target) return;
    const newId = `doc-copy-${Date.now()}`;
    const copy = {
      ...target,
      id: newId,
      judulDokumen: `${target.judulDokumen} (Salinan)`,
      isDefault: false
    };
    setDocTemplates(prev => [...prev, copy]);
    setActiveDocId(newId);
    setBaSuccessMsg(`Berhasil menduplikat template "${target.judulDokumen}"`);
    setTimeout(() => setBaSuccessMsg(''), 4000);
  };

  const handleSaveAllDocTemplates = async () => {
    setBaSuccessMsg('');
    setBaErrorMsg('');
    setIsSavingBa(true);
    try {
      if (updateDocTemplates) {
        await updateDocTemplates(docTemplates);
      } else {
        localStorage.setItem('mh_doc_templates', JSON.stringify(docTemplates));
      }
      const primaryBA = docTemplates.find(d => d.peruntukan === 'BERITA ACARA ASSESSMENT') || docTemplates[0];
      if (primaryBA && updatePwaSettings) {
        const ttd1NamaClean = (primaryBA.ttd1Nama || primaryBA.ttd1Sub || '').trim();
        await updatePwaSettings({
          baNamaYayasan: (primaryBA.namaYayasan || '').trim(),
          baNamaPanitia: (primaryBA.namaPanitia || '').trim(),
          baAlamatKontak: (primaryBA.alamatKontak || '').trim(),
          baTtd1Jabatan: (primaryBA.ttd1Jabatan || '').trim(),
          baTtd1Nama: ttd1NamaClean,
          baTtd1Sub: ttd1NamaClean,
          baTtd2Jabatan: (primaryBA.ttd2Jabatan || '').trim(),
          baTtd2Nama: (primaryBA.ttd2Nama || '').trim(),
          baTtd2Sub: ''
        });
      }
      setBaSuccessMsg('Seluruh konfigurasi template dokumen & penanda peruntukan berhasil disimpan!');
      if (addLog) {
        addLog('Update Template Dokumen', `Memperbarui ${docTemplates.length} template dokumen assessment.`);
      }
    } catch (err: any) {
      console.error(err);
      setBaErrorMsg(err.message || 'Gagal menyimpan template dokumen.');
    } finally {
      setIsSavingBa(false);
    }
  };

  const handleResetDocTemplates = () => {
    setConfirmDelete({
      type: 'reset_doc_templates',
      id: 'reset_all',
      title: 'Reset Seluruh Template Dokumen ke Standar Bawaan',
      desc: 'Apakah Anda yakin ingin menyetel ulang seluruh template dokumen ke standar bawaan sistem? Perubahan kustomisasi judul, nomor format, dan tanda tangan akan dikembalikan ke pengaturan awal.'
    });
  };

  // Form State for Jenis Assessment
  const [showJenisForm, setShowJenisForm] = useState(false);
  const [editingJenis, setEditingJenis] = useState<JenisAssessment | null>(null);
  const [jenisForm, setJenisForm] = useState({
    kategori: KategoriAssessment.TAHFIDZ,
    elemen: '',
    namaAssessment: '',
    deskripsi: '',
    statusAktif: StatusAktif.AKTIF,
    
    // Custom integrations
    pelajaranId: '',
    pelajaranNama: '',
    modulId: '',
    modulNama: '',
    
    // Quran specs
    sumberAssessment: 'internal' as 'internal' | 'eksternal',
    modulInternalOption: 'AL_QURAN' as 'AL_QURAN' | 'IQRA' | 'KITAB' | 'LAINNYA',
    
    // External integration fields
    eksternalTipe: 'text' as 'upload' | 'text' | 'link',
    eksternalText: '',
    eksternalFileBase64: '',
    eksternalFileName: '',
    eksternalFileType: '',
    eksternalFileSize: 0,
    eksternalLink: '',

    quranJuz: '',
    quranSurat: '',
    quranRentangSuratStart: '',
    quranRentangSuratEnd: '',
    quranRentangAyatStart: 1,
    quranRentangAyatEnd: 10,
    quranRentangHalamanStart: 1,
    quranRentangHalamanEnd: 604,
    quranHalamanUjianOption: 'guru' as 'guru' | 'acak' | 'kombinasi',
    quranHalamanUjianCount: 3,
    quranMetodeTahfidz: 'Sambung Ayat',
    quranTahfidzRentangSuratStart: '',
    quranTahfidzRentangSuratEnd: '',
    quranTahfidzRentangJuzStart: '',
    quranTahfidzRentangJuzEnd: '',
    quranTahfidzJumlahSoal: 10,
    quranSuratMode: 'semua' as 'semua' | 'single' | 'rentang' | 'kustom',
    quranSelectedSurahs: [] as string[]
  });

  // States for Multi-Surah / Custom Surah Picker
  const [multiSurahSearch, setMultiSurahSearch] = useState('');
  const [showSurahCatalog, setShowSurahCatalog] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState('');
  const [quickSelectedSurah, setQuickSelectedSurah] = useState('');

  // Helper functions for Multi-Surah Selection
  const handleToggleSurah = (surahNama: string) => {
    setJenisForm(prev => {
      const currentList = prev.quranSelectedSurahs || [];
      const exists = currentList.includes(surahNama);
      const newList = exists 
        ? currentList.filter(s => s !== surahNama)
        : [...currentList, surahNama];
      return {
        ...prev,
        quranSelectedSurahs: newList,
        quranSuratMode: 'kustom'
      };
    });
  };

  const handleAddSurah = (surahNama: string) => {
    if (!surahNama) return;
    setJenisForm(prev => {
      const currentList = prev.quranSelectedSurahs || [];
      if (currentList.includes(surahNama)) return prev;
      return {
        ...prev,
        quranSelectedSurahs: [...currentList, surahNama],
        quranSuratMode: 'kustom'
      };
    });
    setQuickSelectedSurah('');
  };

  const handleRemoveSurah = (surahNama: string) => {
    setJenisForm(prev => ({
      ...prev,
      quranSelectedSurahs: (prev.quranSelectedSurahs || []).filter(s => s !== surahNama)
    }));
  };

  const handleApplyPreset = (presetSurahs: string[]) => {
    setJenisForm(prev => ({
      ...prev,
      quranSelectedSurahs: [...presetSurahs],
      quranSuratMode: 'kustom'
    }));
  };

  const handleSortSurahsByMushaf = () => {
    setJenisForm(prev => {
      const currentList = prev.quranSelectedSurahs || [];
      const sorted = [...currentList].sort((a, b) => {
        const noA = QURAN_SURAHS.find(s => s.nama === a)?.no || 999;
        const noB = QURAN_SURAHS.find(s => s.nama === b)?.no || 999;
        return noA - noB;
      });
      return { ...prev, quranSelectedSurahs: sorted };
    });
  };

  const handleClearSelectedSurahs = () => {
    setJenisForm(prev => ({
      ...prev,
      quranSelectedSurahs: []
    }));
  };

  const selectedSurahsDetail = useMemo(() => {
    const list = jenisForm.quranSelectedSurahs || [];
    return list.map(nama => {
      const found = QURAN_SURAHS.find(s => s.nama === nama);
      return {
        nama,
        no: found?.no || 0,
        ayat: found?.ayat || 0
      };
    });
  }, [jenisForm.quranSelectedSurahs]);

  const totalAyatSelected = useMemo(() => {
    return selectedSurahsDetail.reduce((sum, item) => sum + item.ayat, 0);
  }, [selectedSurahsDetail]);

  const mapElemenToKategori = (elemenNama: string): KategoriAssessment => {
    const name = (elemenNama || '').toLowerCase();
    if (name.includes('tahfidz') || name.includes('hafalan')) return KategoriAssessment.TAHFIDZ;
    if (name.includes('tilawah') || name.includes('bacaan')) return KategoriAssessment.TILAWAH;
    if (name.includes('iqra') || name.includes('iqro')) return KategoriAssessment.IQRA;
    if (name.includes('kitab') || name.includes('hadits') || name.includes('hadis') || name.includes('fiqih') || name.includes('nahwu')) return KategoriAssessment.KITAB;
    return KategoriAssessment.PROGRAM;
  };

  // Form State for Template Assessment
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateAssessment | null>(null);
  const [templateForm, setTemplateForm] = useState({
    namaTemplate: '',
    jenisAssessmentId: '',
    jenisAssessmentIds: [] as string[],
    petunjukPelaksanaan: '',
    petunjukPerJenis: {} as Record<string, string>,
    rubrik: [] as { kriteria: string; bobotPersen: number; poinPengurangan?: number; categoryIds?: string[]; oncePerSessionCategories?: string[] }[],
    syaratMinScore: 80,
    statusAktif: StatusAktif.AKTIF,
    modePenilaian: 'Langsung' as 'Langsung' | 'PenguranganKesalahan',
    oncePerSessionCategories: ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar'] as string[]
  });

  const isTemplateCategoryOnce = (catId: string, catNama: string): boolean => {
    const normId = catId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normNama = catNama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return (templateForm.oncePerSessionCategories || []).some(c => {
      const norm = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm === normId || norm === normNama;
    });
  };

  const toggleTemplateCategoryOnce = (catId: string, catNama: string) => {
    const isCurrentlyOnce = isTemplateCategoryOnce(catId, catNama);
    const normId = catId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normNama = catNama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (isCurrentlyOnce) {
      setTemplateForm(prev => ({
        ...prev,
        oncePerSessionCategories: (prev.oncePerSessionCategories || []).filter(c => {
          const norm = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          return norm !== normId && norm !== normNama;
        })
      }));
    } else {
      setTemplateForm(prev => ({
        ...prev,
        oncePerSessionCategories: [...(prev.oncePerSessionCategories || []), catId, catNama]
      }));
    }
  };

  const [jenisFilterCategory, setJenisFilterCategory] = useState<string>('ALL');
  const [jenisFilterSearch, setJenisFilterSearch] = useState<string>('');
  const [activePetunjukJenisTab, setActivePetunjukJenisTab] = useState<string>('');

  const toggleTemplateJenisId = (id: string) => {
    setTemplateForm(prev => {
      const exists = prev.jenisAssessmentIds.includes(id);
      const updatedIds = exists 
        ? prev.jenisAssessmentIds.filter(x => x !== id) 
        : [...prev.jenisAssessmentIds, id];
      if (!activePetunjukJenisTab && updatedIds.length > 0) {
        setActivePetunjukJenisTab(updatedIds[0]);
      }
      return {
        ...prev,
        jenisAssessmentIds: updatedIds,
        jenisAssessmentId: updatedIds[0] || ''
      };
    });
  };

  const selectAllJenisIds = () => {
    const ids = jenisAssessments.map(j => j.id);
    setTemplateForm(prev => ({
      ...prev,
      jenisAssessmentIds: ids,
      jenisAssessmentId: ids[0] || ''
    }));
    if (ids.length > 0) setActivePetunjukJenisTab(ids[0]);
  };

  const deselectAllJenisIds = () => {
    setTemplateForm(prev => ({
      ...prev,
      jenisAssessmentIds: [],
      jenisAssessmentId: ''
    }));
    setActivePetunjukJenisTab('');
  };

  const handlePetunjukPerJenisChange = (jenisId: string, text: string) => {
    setTemplateForm(prev => {
      const updated = { ...(prev.petunjukPerJenis || {}) };
      if (!text) {
        delete updated[jenisId];
      } else {
        updated[jenisId] = text;
      }
      return { ...prev, petunjukPerJenis: updated };
    });
  };

  const [newRubrikItem, setNewRubrikItem] = useState<{ kriteria: string; bobotPersen: number; poinPengurangan: number; categoryIds: string[] }>({
    kriteria: '',
    bobotPersen: 25,
    poinPengurangan: 5,
    categoryIds: []
  });
  const [editingRubrikIndex, setEditingRubrikIndex] = useState<number | null>(null);
  const [editRubrikItem, setEditRubrikItem] = useState<{
    kriteria: string;
    bobotPersen: number;
    poinPengurangan: number;
    categoryIds: string[];
  }>({
    kriteria: '',
    bobotPersen: 25,
    poinPengurangan: 5,
    categoryIds: []
  });

  // Daftar Tipe Klasifikasi Kesalahan (dari Mutabaah > Kategori Kesalahan) + Kriteria Umum (Non-Kesalahan)
  const availableClassificationOptions = useMemo(() => {
    const list: Array<{ id: string; nama: string; labelSingkat?: string; isUmum?: boolean; deskripsi?: string }> = [];

    // 1. Tipe Klasifikasi Kesalahan dari menu Mutabaah > Kategori Kesalahan
    (klasifikasiKesalahanTypes || []).forEach(t => {
      list.push({
        id: t.id,
        nama: t.nama,
        labelSingkat: t.labelSingkat,
        deskripsi: t.deskripsi,
        isUmum: false
      });
    });

    // 2. Kriteria Penilaian yang tidak terkait Kategori Kesalahan (misal aspek umum non-teknis)
    list.push({
      id: 'kriteria_umum',
      nama: 'Kriteria Umum (Non-Kesalahan)',
      labelSingkat: 'Umum',
      deskripsi: 'Kriteria penilaian mandiri yang tidak terhubung dengan pencatatan kesalahan bacaan mutabaah',
      isUmum: true
    });

    return list;
  }, [klasifikasiKesalahanTypes]);

  const getClassificationOrCategoryMeta = (catId: string) => {
    if (catId === 'kriteria_umum' || catId === 'umum') {
      return {
        id: 'kriteria_umum',
        nama: 'Kriteria Umum',
        labelSingkat: 'Non-Kesalahan',
        isUmum: true,
        bgColor: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
      };
    }
    const matchType = (klasifikasiKesalahanTypes || []).find(
      t => t.id === catId || t.nama?.toLowerCase() === catId.toLowerCase()
    );
    if (matchType) {
      const isJaliy = matchType.id === 'lahn_jaliy';
      const isKhafiy = matchType.id === 'lahn_khafiy';
      return {
        id: matchType.id,
        nama: matchType.nama,
        labelSingkat: matchType.labelSingkat || 'Klasifikasi',
        isUmum: false,
        bgColor: isJaliy 
          ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          : isKhafiy 
            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
      };
    }
    const matchCat = (tajwidCategories || []).find(
      c => c.id === catId || c.nama?.toLowerCase() === catId.toLowerCase()
    );
    if (matchCat) {
      const isDasar = (matchCat.tipe || 'tajwid') === 'dasar' || matchCat.tipe === 'lahn_jaliy';
      return {
        id: matchCat.id,
        nama: matchCat.nama,
        labelSingkat: isDasar ? 'Dasar' : 'Tajwid',
        isUmum: false,
        bgColor: isDasar
          ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
      };
    }
    return {
      id: catId,
      nama: catId,
      labelSingkat: 'Klasifikasi',
      isUmum: false,
      bgColor: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
    };
  };

  const [currentExternalPreviewPage, setCurrentExternalPreviewPage] = useState(0);

  const handleExternalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name;
    const fileType = file.type || file.name.split('.').pop() || '';
    const fileSize = file.size;

    if (file.name.endsWith('.txt')) {
      reader.onload = (event) => {
        setJenisForm(prev => ({
          ...prev,
          eksternalFileName: fileName,
          eksternalFileType: fileType,
          eksternalFileSize: fileSize,
          eksternalText: (event.target?.result as string) || '',
          eksternalFileBase64: '',
        }));
        setCurrentExternalPreviewPage(0);
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        setJenisForm(prev => ({
          ...prev,
          eksternalFileName: fileName,
          eksternalFileType: fileType,
          eksternalFileSize: fileSize,
          eksternalFileBase64: (event.target?.result as string) || '',
        }));
        setCurrentExternalPreviewPage(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveJenisItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisForm.namaAssessment || !jenisForm.elemen) return;

    const payloadJenis: any = {
      ...jenisForm,
      elemenId: jenisForm.elemen,
      elemenNama: jenisForm.elemen,
      statusAktif: jenisForm.statusAktif === StatusAktif.AKTIF
    };

    if (editingJenis) {
      updateJenisAssessment(editingJenis.id, payloadJenis);
    } else {
      createJenisAssessment(payloadJenis);
    }
    setShowJenisForm(false);
    setEditingJenis(null);
    setJenisForm({
      kategori: KategoriAssessment.TAHFIDZ,
      elemen: '',
      namaAssessment: '',
      deskripsi: '',
      statusAktif: StatusAktif.AKTIF,
      pelajaranId: '',
      pelajaranNama: '',
      modulId: '',
      modulNama: '',
      sumberAssessment: 'internal',
      modulInternalOption: 'AL_QURAN',
      eksternalTipe: 'text',
      eksternalText: '',
      eksternalFileBase64: '',
      eksternalFileName: '',
      eksternalFileType: '',
      eksternalFileSize: 0,
      eksternalLink: '',
      quranJuz: '',
      quranSurat: '',
      quranRentangSuratStart: '',
      quranRentangSuratEnd: '',
      quranRentangAyatStart: 1,
      quranRentangAyatEnd: 10,
      quranRentangHalamanStart: 1,
      quranRentangHalamanEnd: 604,
      quranHalamanUjianOption: 'guru',
      quranHalamanUjianCount: 3,
      quranMetodeTahfidz: 'Sambung Ayat',
      quranTahfidzRentangSuratStart: '',
      quranTahfidzRentangSuratEnd: '',
      quranTahfidzRentangJuzStart: '',
      quranTahfidzRentangJuzEnd: '',
      quranTahfidzJumlahSoal: 10,
      quranSuratMode: 'semua',
      quranSelectedSurahs: []
    });
  };

  const handleSaveTemplateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.namaTemplate) return;

    const selectedIds = templateForm.jenisAssessmentIds.length > 0 
      ? templateForm.jenisAssessmentIds 
      : (templateForm.jenisAssessmentId ? [templateForm.jenisAssessmentId] : []);

    if (selectedIds.length === 0) {
      alert('Pilih minimal satu Jenis Assessment yang terhubung dengan rubrik penilaian ini.');
      return;
    }

    // Check sum of rubrik bobot
    const totalBobot = templateForm.rubrik.reduce((sum, item) => sum + item.bobotPersen, 0);
    if (totalBobot !== 100 && templateForm.rubrik.length > 0) {
      alert(`Format bobot rubrik penilaian tidak valid. Total bobot saat ini ${totalBobot}%, harus tepat 100%.`);
      return;
    }

    const selectedJenisList = jenisAssessments.filter(j => selectedIds.includes(j.id));
    const selectedJenis = selectedJenisList[0] || jenisAssessments.find(j => j.id === selectedIds[0]);
    const namaJenisAssessments = selectedJenisList.map(j => j.namaAssessment);

    // Copy Quran parameters to the TemplateAssessment level for robust accessibility
    const templatePayload: any = {
      ...templateForm,
      jenisAssessmentId: selectedIds[0],
      jenisAssessmentIds: selectedIds,
      namaJenisAssessment: selectedJenis ? selectedJenis.namaAssessment : '',
      namaJenisAssessments,
      petunjukPelaksanaan: templateForm.petunjukPelaksanaan || '',
      petunjukPerJenis: templateForm.petunjukPerJenis || {},
      rubrikPenilaian: templateForm.rubrik,
      rubrikNilai: templateForm.rubrik,
      rubrik: templateForm.rubrik,
      syaratKelulusan: {
        nilaiMinimal: templateForm.syaratMinScore || 80,
        tanpaKesalahanFatal: false,
        rekomendasiLayakHarus: true
      },
      sumberAssessment: selectedJenis?.sumberAssessment || 'internal',
      modulInternalOption: selectedJenis?.modulInternalOption || 'AL_QURAN',
      quranJuz: selectedJenis?.quranJuz || '',
      quranSurat: selectedJenis?.quranSurat || '',
      quranRentangSuratStart: selectedJenis?.quranRentangSuratStart || '',
      quranRentangSuratEnd: selectedJenis?.quranRentangSuratEnd || '',
      quranRentangAyatStart: selectedJenis?.quranRentangAyatStart !== undefined ? selectedJenis?.quranRentangAyatStart : 1,
      quranRentangAyatEnd: selectedJenis?.quranRentangAyatEnd !== undefined ? selectedJenis?.quranRentangAyatEnd : 10,
      quranRentangHalamanStart: selectedJenis?.quranRentangHalamanStart !== undefined ? selectedJenis?.quranRentangHalamanStart : 1,
      quranRentangHalamanEnd: selectedJenis?.quranRentangHalamanEnd !== undefined ? selectedJenis?.quranRentangHalamanEnd : 604,
      quranHalamanUjianOption: selectedJenis?.quranHalamanUjianOption || 'guru',
      quranHalamanUjianCount: selectedJenis?.quranHalamanUjianCount !== undefined ? selectedJenis?.quranHalamanUjianCount : 3,
      quranMetodeTahfidz: selectedJenis?.quranMetodeTahfidz || 'Sambung Ayat',
      quranTahfidzRentangSuratStart: selectedJenis?.quranTahfidzRentangSuratStart || '',
      quranTahfidzRentangSuratEnd: selectedJenis?.quranTahfidzRentangSuratEnd || '',
      quranTahfidzRentangJuzStart: selectedJenis?.quranTahfidzRentangJuzStart || '',
      quranTahfidzRentangJuzEnd: selectedJenis?.quranTahfidzRentangJuzEnd || '',
      quranTahfidzJumlahSoal: selectedJenis?.quranTahfidzJumlahSoal !== undefined ? selectedJenis?.quranTahfidzJumlahSoal : 10,
      quranSuratMode: selectedJenis?.quranSuratMode || (selectedJenis?.quranSelectedSurahs && selectedJenis.quranSelectedSurahs.length > 0 ? 'kustom' : 'semua'),
      quranSelectedSurahs: selectedJenis?.quranSelectedSurahs || [],
      oncePerSessionCategories: templateForm.oncePerSessionCategories || [],
      modePenilaian: templateForm.modePenilaian || 'Langsung'
    };

    if (editingTemplate) {
      updateTemplateAssessment(editingTemplate.id, templatePayload);
    } else {
      createTemplateAssessment(templatePayload);
    }
    setShowTemplateForm(false);
    setEditingTemplate(null);
    setEditingRubrikIndex(null);
    setTemplateForm({
      namaTemplate: '',
      jenisAssessmentId: '',
      jenisAssessmentIds: [],
      petunjukPelaksanaan: '',
      petunjukPerJenis: {},
      rubrik: [],
      syaratMinScore: 80,
      statusAktif: StatusAktif.AKTIF,
      modePenilaian: 'Langsung',
      oncePerSessionCategories: ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']
    });
  };

  const addRubrikRow = () => {
    if (!newRubrikItem.kriteria) return;
    setTemplateForm(prev => ({
      ...prev,
      rubrik: [...prev.rubrik, { 
        kriteria: newRubrikItem.kriteria, 
        bobotPersen: Number(newRubrikItem.bobotPersen),
        poinPengurangan: prev.modePenilaian === 'PenguranganKesalahan' ? Number(newRubrikItem.poinPengurangan !== undefined ? newRubrikItem.poinPengurangan : 5) : undefined,
        categoryIds: [...(newRubrikItem.categoryIds || [])]
      }]
    }));
    setNewRubrikItem({ kriteria: '', bobotPersen: 25, poinPengurangan: 5, categoryIds: [] });
  };

  const startEditRubrik = (index: number) => {
    const item = templateForm.rubrik[index];
    if (!item) return;
    setEditingRubrikIndex(index);
    setEditRubrikItem({
      kriteria: item.kriteria || '',
      bobotPersen: item.bobotPersen || 0,
      poinPengurangan: item.poinPengurangan !== undefined ? item.poinPengurangan : 5,
      categoryIds: [...(item.categoryIds || [])]
    });
  };

  const saveEditRubrik = (index: number) => {
    if (!editRubrikItem.kriteria.trim()) {
      alert('Nama kriteria tidak boleh kosong.');
      return;
    }
    if (editRubrikItem.bobotPersen <= 0) {
      alert('Bobot persen harus lebih besar dari 0%.');
      return;
    }

    setTemplateForm(prev => ({
      ...prev,
      rubrik: prev.rubrik.map((r, i) => {
        if (i !== index) return r;
        return {
          ...r,
          kriteria: editRubrikItem.kriteria.trim(),
          bobotPersen: Number(editRubrikItem.bobotPersen),
          poinPengurangan: prev.modePenilaian === 'PenguranganKesalahan' 
            ? Number(editRubrikItem.poinPengurangan !== undefined ? editRubrikItem.poinPengurangan : 5) 
            : undefined,
          categoryIds: [...(editRubrikItem.categoryIds || [])]
        };
      })
    }));

    setEditingRubrikIndex(null);
  };

  const cancelEditRubrik = () => {
    setEditingRubrikIndex(null);
  };

  const removeRubrikRow = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      rubrik: prev.rubrik.filter((_, i) => i !== index)
    }));
    if (editingRubrikIndex === index) {
      setEditingRubrikIndex(null);
    } else if (editingRubrikIndex !== null && editingRubrikIndex > index) {
      setEditingRubrikIndex(editingRubrikIndex - 1);
    }
  };

  return (
    <div id="manage-assessment-section" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Assessment</h1>
          <p className="text-sm text-gray-500">Konfigurasi jenis pengujian formal, template rubrik, kriteria kelulusan, & syahadah.</p>
        </div>
        
        {/* Tab switchers */}
        <div className="bg-gray-100 p-1 rounded-lg flex flex-wrap gap-1 self-start">
          <button
            onClick={() => { setActiveTab('jenis'); setShowJenisForm(false); setShowTemplateForm(false); }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'jenis' 
                ? 'bg-white text-emerald-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kategori & Jenis Assessment
          </button>
          <button
            onClick={() => { setActiveTab('template'); setShowJenisForm(false); setShowTemplateForm(false); }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'template' 
                ? 'bg-white text-emerald-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Template Rubrik & Kelulusan
          </button>
          <button
            onClick={() => { setActiveTab('dokumen'); setShowJenisForm(false); setShowTemplateForm(false); }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'dokumen' 
                ? 'bg-white text-emerald-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Template Dokumen &amp; BA
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'jenis' && (
          <motion.div
            key="jenis-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header toolbar for Jenis */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
                Daftar Jenis Assessment
              </h2>
              {!showJenisForm && (
                <button
                  onClick={() => {
                    const firstMapel = mataPelajarans.find(mp => mp.statusAktif !== false) || mataPelajarans[0];
                    const firstElemName = firstMapel?.elemenList?.find(e => e.statusAktif !== false)?.nama || firstMapel?.elemenList?.[0]?.nama || '';
                    
                    // Find matching module if any
                    const matchedES = elemenSettings?.find(es => es.nama.toLowerCase() === firstElemName.toLowerCase());
                    let defaultModulId = '';
                    let defaultModulNama = '';
                    
                    const isAlQuran = matchedES 
                      ? (matchedES.tipeModul === TipeModul.AL_QURAN)
                      : (firstElemName.toLowerCase().includes('tahfidz') || firstElemName.toLowerCase().includes('tilawah') || firstElemName.toLowerCase().includes('quran'));

                    if (isAlQuran) {
                      defaultModulId = 'Al-Quran';
                      defaultModulNama = "Al-Qur'an";
                    } else if (matchedES) {
                      const linked = moduls.filter(m => {
                        if (matchedES.referensiModulId) {
                          return m.id === matchedES.referensiModulId;
                        }
                        return m.tipe === TipeModul.NON_AL_QURAN;
                      });
                      if (linked.length > 0) {
                        defaultModulId = linked[0].id;
                        defaultModulNama = linked[0].namaSurat ? `Surat ${linked[0].namaSurat}` : (linked[0].judulModul || '');
                      }
                    } else {
                      const linked = moduls.filter(m => m.tipe === TipeModul.NON_AL_QURAN);
                      if (linked.length > 0) {
                        defaultModulId = linked[0].id;
                        defaultModulNama = linked[0].judulModul || '';
                      }
                    }

                    setEditingJenis(null);
                    setJenisForm({
                      kategori: mapElemenToKategori(firstElemName),
                      elemen: firstElemName,
                      namaAssessment: '',
                      deskripsi: '',
                      statusAktif: StatusAktif.AKTIF,
                      pelajaranId: firstMapel?.id || '',
                      pelajaranNama: firstMapel?.nama || '',
                      modulId: defaultModulId,
                      modulNama: defaultModulNama,
                      sumberAssessment: 'internal',
                      modulInternalOption: isAlQuran ? 'AL_QURAN' : 'NON_AL_QURAN' as any,
                      eksternalTipe: 'text',
                      eksternalText: '',
                      eksternalFileBase64: '',
                      eksternalFileName: '',
                      eksternalFileType: '',
                      eksternalFileSize: 0,
                      eksternalLink: '',
                      quranJuz: '',
                      quranSurat: '',
                      quranRentangSuratStart: '',
                      quranRentangSuratEnd: '',
                      quranRentangAyatStart: 1,
                      quranRentangAyatEnd: 10,
                      quranRentangHalamanStart: 1,
                      quranRentangHalamanEnd: 604,
                      quranHalamanUjianOption: 'guru',
                      quranHalamanUjianCount: 3,
                      quranMetodeTahfidz: 'Sambung Ayat',
                      quranTahfidzRentangSuratStart: '',
                      quranTahfidzRentangSuratEnd: '',
                      quranTahfidzRentangJuzStart: '',
                      quranTahfidzRentangJuzEnd: '',
                      quranTahfidzJumlahSoal: 10,
                      quranSuratMode: 'semua',
                      quranSelectedSurahs: []
                    });
                    setShowJenisForm(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4" /> Tambah Jenis Assessment
                </button>
              )}
            </div>

            {/* Form Jenis Assessment */}
            {showJenisForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5"
              >
                <form onSubmit={handleSaveJenisItem} className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-950">
                    {editingJenis ? 'Edit Jenis Assessment' : 'Tambah Jenis Assessment Pembelajaran Baru'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-750 mb-1">Pelajaran</label>
                      <select
                        value={jenisForm.pelajaranId}
                        onChange={(e) => {
                          const targetId = e.target.value;
                          const selectedMapel = mataPelajarans.find(mp => mp.id === targetId);
                          const chosenPelajaranName = selectedMapel?.nama || '';
                          const firstElemen = selectedMapel?.elemenList?.find(elem => elem.statusAktif !== false)?.nama || selectedMapel?.elemenList?.[0]?.nama || '';
                          
                          // Look up corresponding module
                          const matchedES = elemenSettings?.find(es => es.nama.toLowerCase() === firstElemen.toLowerCase());
                          let defModId = '';
                          let defModNama = '';
                          
                          const isAlQuran = matchedES 
                            ? (matchedES.tipeModul === TipeModul.AL_QURAN)
                            : (firstElemen.toLowerCase().includes('tahfidz') || firstElemen.toLowerCase().includes('tilawah') || firstElemen.toLowerCase().includes('quran'));

                          if (isAlQuran) {
                            defModId = 'Al-Quran';
                            defModNama = "Al-Qur'an";
                          } else if (matchedES) {
                            const linked = moduls.filter(m => {
                              if (matchedES.referensiModulId) {
                                return m.id === matchedES.referensiModulId;
                              }
                              return m.tipe === TipeModul.NON_AL_QURAN;
                            });
                            if (linked.length > 0) {
                              defModId = linked[0].id;
                              defModNama = linked[0].namaSurat ? `Surat ${linked[0].namaSurat}` : (linked[0].judulModul || '');
                            }
                          } else {
                            const linked = moduls.filter(m => m.tipe === TipeModul.NON_AL_QURAN);
                            if (linked.length > 0) {
                              defModId = linked[0].id;
                              defModNama = linked[0].judulModul || '';
                            }
                          }

                          setJenisForm(prev => ({
                            ...prev,
                            pelajaranId: targetId,
                            pelajaranNama: chosenPelajaranName,
                            elemen: firstElemen,
                            kategori: mapElemenToKategori(firstElemen),
                            modulId: defModId,
                            modulNama: defModNama,
                            modulInternalOption: isAlQuran ? 'AL_QURAN' : 'NON_AL_QURAN' as any,
                          }));
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                        required
                      >
                        <option value="">-- Pilih Mata Pelajaran --</option>
                        {mataPelajarans.filter(mp => mp.statusAktif !== false).map(mp => (
                          <option key={mp.id} value={mp.id}>{mp.nama}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-750 mb-1">Elemen</label>
                      <select
                        value={jenisForm.elemen}
                        onChange={(e) => {
                          const chosenElemen = e.target.value;
                          
                          // Look up corresponding module
                          const matchedES = elemenSettings?.find(es => es.nama.toLowerCase() === chosenElemen.toLowerCase());
                          let defModId = '';
                          let defModNama = '';
                          
                          const isAlQuran = matchedES 
                            ? (matchedES.tipeModul === TipeModul.AL_QURAN)
                            : (chosenElemen.toLowerCase().includes('tahfidz') || chosenElemen.toLowerCase().includes('tilawah') || chosenElemen.toLowerCase().includes('quran'));

                          if (isAlQuran) {
                            defModId = 'Al-Quran';
                            defModNama = "Al-Qur'an";
                          } else if (matchedES) {
                            const linked = moduls.filter(m => {
                              if (matchedES.referensiModulId) {
                                return m.id === matchedES.referensiModulId;
                              }
                              return m.tipe === TipeModul.NON_AL_QURAN;
                            });
                            if (linked.length > 0) {
                              defModId = linked[0].id;
                              defModNama = linked[0].namaSurat ? `Surat ${linked[0].namaSurat}` : (linked[0].judulModul || '');
                            }
                          } else {
                            const linked = moduls.filter(m => m.tipe === TipeModul.NON_AL_QURAN);
                            if (linked.length > 0) {
                              defModId = linked[0].id;
                              defModNama = linked[0].judulModul || '';
                            }
                          }

                          setJenisForm(prev => ({ 
                            ...prev, 
                            elemen: chosenElemen,
                            kategori: mapElemenToKategori(chosenElemen),
                            modulId: defModId,
                            modulNama: defModNama,
                            modulInternalOption: isAlQuran ? 'AL_QURAN' : 'NON_AL_QURAN' as any,
                          }));
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                        required
                      >
                        <option value="">-- Pilih Elemen --</option>
                        {(() => {
                          const currentPelajaran = mataPelajarans.find(mp => mp.id === jenisForm.pelajaranId);
                          const elements = currentPelajaran?.elemenList || [];
                          return elements.filter(el => el.statusAktif !== false).map(el => (
                            <option key={el.id} value={el.nama}>{el.nama}</option>
                          ));
                        })()}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-750 mb-1">Modul Terkait</label>
                      <select
                        value={jenisForm.modulId}
                        onChange={(e) => {
                          const targetId = e.target.value;
                          let dispName = '';
                          if (targetId === 'Al-Quran') {
                            dispName = "Al-Qur'an";
                          } else {
                            const matchedMod = moduls.find(m => m.id === targetId);
                            dispName = matchedMod ? (matchedMod.namaSurat ? `Surat ${matchedMod.namaSurat}` : (matchedMod.judulModul || '')) : '';
                          }
                          setJenisForm(prev => ({
                            ...prev,
                            modulId: targetId,
                            modulNama: dispName
                          }));
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium font-semibold text-emerald-900"
                      >
                        <option value="">-- Semua Modul --</option>
                        {(() => {
                          const currentElemenName = jenisForm.elemen;
                          const matchedES = elemenSettings?.find(es => es.nama.toLowerCase() === currentElemenName.toLowerCase());
                          
                          const isAlQuran = matchedES 
                            ? (matchedES.tipeModul === TipeModul.AL_QURAN)
                            : (currentElemenName.toLowerCase().includes('tahfidz') || currentElemenName.toLowerCase().includes('tilawah') || currentElemenName.toLowerCase().includes('quran'));

                          if (isAlQuran) {
                            return (
                              <option value="Al-Quran">Al-Qur'an</option>
                            );
                          }

                          const filtered = moduls.filter(m => {
                            if (matchedES) {
                              if (matchedES.referensiModulId) {
                                return m.id === matchedES.referensiModulId;
                              }
                              return m.tipe === TipeModul.NON_AL_QURAN;
                            } else {
                              return m.tipe === TipeModul.NON_AL_QURAN;
                            }
                          });

                          return filtered.map(m => {
                            const dispName = m.namaSurat ? `Surat ${m.namaSurat}` : (m.judulModul || m.id);
                            return (
                              <option key={m.id} value={m.id}>{dispName}</option>
                            );
                          });
                        })()}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-750 mb-1">Nama Assessment / Ujian</label>
                      <input
                        type="text"
                        placeholder="Misal: Ujian Kenaikan Jilid 3, Tasmi juz 30"
                        value={jenisForm.namaAssessment}
                        onChange={(e) => setJenisForm(prev => ({ ...prev, namaAssessment: e.target.value }))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi & Tujuan Ujian</label>
                    <textarea
                      placeholder="Tulis ringkasan singkat cakupan materi utama yang diujikan..."
                      rows={2}
                      value={jenisForm.deskripsi}
                      onChange={(e) => setJenisForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* QURAN INTERNAL OPTIONS FORM */}
                  <div className="border border-emerald-100 bg-white/75 p-4 rounded-xl space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-50 pb-2">
                      <BookOpen className="h-4 w-4 text-emerald-600 animate-pulse" />
                      Sumber Assessment & Integrasi Modul
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-750 mb-1">Sumber Ujian</label>
                        <div className="flex items-center gap-4 mt-1.5">
                          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium">
                            <input
                              type="radio"
                              name="sumberAssessment"
                              checked={jenisForm.sumberAssessment === 'internal'}
                              onChange={() => setJenisForm(prev => ({ ...prev, sumberAssessment: 'internal' }))}
                              className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                            />
                            ✓ Modul Internal Aplikasi
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium">
                            <input
                              type="radio"
                              name="sumberAssessment"
                              checked={jenisForm.sumberAssessment === 'eksternal'}
                              onChange={() => setJenisForm(prev => ({ ...prev, sumberAssessment: 'eksternal' }))}
                              className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                            />
                            Eksternal / Bebas
                          </label>
                        </div>
                      </div>

                      {jenisForm.sumberAssessment === 'internal' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Spesifik Modul Internal</label>
                          <select
                            value={jenisForm.modulInternalOption}
                            onChange={(e) => setJenisForm(prev => ({ ...prev, modulInternalOption: e.target.value as any }))}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-semibold text-emerald-900"
                          >
                            <option value="AL_QURAN">Al-Qur'an (Juz, Surat, Ayat, Hal)</option>
                            <option value="IQRA">Iqra (Jilid 1 - 6)</option>
                            <option value="KITAB">Kitab Kuning & Syarah</option>
                            <option value="LAINNYA">Materi Lainnya</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* EXTERNAL INTEGRATION OPTIONS UI */}
                    {jenisForm.sumberAssessment === 'eksternal' && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-150 pb-2">
                          <div className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-indigo-600" />
                            Aset & Integrasi Dokumen Ujian Eksternal
                          </div>
                          
                          {/* Selector for input style */}
                          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
                            {(['upload', 'text', 'link'] as const).map(mode => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setJenisForm(prev => ({ ...prev, eksternalTipe: mode }))}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${jenisForm.eksternalTipe === mode ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                {mode === 'upload' ? '📑 File Upload' : mode === 'text' ? '✍️ Teks Manual' : '🔗 Google Docs'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Upload file UI */}
                        {jenisForm.eksternalTipe === 'upload' && (
                          <div className="space-y-3">
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Upload Dokumen Ujian (PDF, Word, ODT, TXT)</label>
                            
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-white hover:bg-slate-50/55 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                  <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
                                  <p className="text-xs text-slate-700 font-semibold mb-1">
                                    Klik atau seret file Anda ke sini
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    Mendukung PDF, Word (.doc, .docx), ODT, atau TXT (Multi-halaman)
                                  </p>
                                </div>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept=".pdf,.doc,.docx,.odt,.txt" 
                                  onChange={handleExternalFileChange}
                                />
                              </label>
                            </div>

                            {jenisForm.eksternalFileName && (
                              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                                  <div className="text-left overflow-hidden">
                                    <p className="text-xs font-bold text-emerald-900 truncate">{jenisForm.eksternalFileName}</p>
                                    <p className="text-[10px] text-slate-450 font-semibold text-slate-500">
                                      {jenisForm.eksternalFileType || 'Dokumen'} • {(jenisForm.eksternalFileSize / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setJenisForm(prev => ({
                                    ...prev,
                                    eksternalFileName: '',
                                    eksternalFileType: '',
                                    eksternalFileSize: 0,
                                    eksternalFileBase64: '',
                                    eksternalText: ''
                                  }))}
                                  className="text-[10px] uppercase font-bold text-red-500 hover:text-red-750 shrink-0 px-2"
                                >
                                  Hapus
                                </button>
                              </div>
                            )}

                            {/* Option to also paste text accompanying the docx/odt binary file for direct preview editing */}
                            {jenisForm.eksternalFileName && !jenisForm.eksternalFileName.endsWith('.txt') && !jenisForm.eksternalFileName.endsWith('.pdf') && (
                              <div className="bg-indigo-50/45 border border-indigo-100 rounded-lg p-3 space-y-2">
                                <span className="text-[10px] font-bold text-indigo-800 uppercase block">✍️ Salinan Isi Teks (Opsional untuk Pratinjau Detil):</span>
                                <textarea
                                  placeholder="Ketik atau tempel isi dokumen Word/ODT Anda di sini agar guru penguji dapat langsung membacanya saat proses penilaian..."
                                  rows={3}
                                  value={jenisForm.eksternalText}
                                  onChange={(e) => setJenisForm(prev => ({ ...prev, eksternalText: e.target.value }))}
                                  className="w-full bg-white border border-indigo-200/70 p-2 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Paste text manually UI */}
                        {jenisForm.eksternalTipe === 'text' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Input Teks Materi Dokumen Ujian</label>
                              <span className="text-[9px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                                Tip: Ketik <code className="font-mono bg-slate-200 px-1 rounded">---</code> di baris baru untuk membagi halaman
                              </span>
                            </div>
                            <textarea
                              placeholder="Ketik atau tempel naskah bacaan, soal-soal, atau instruksi materi ujian di sini secara langsung..."
                              rows={5}
                              value={jenisForm.eksternalText}
                              onChange={(e) => setJenisForm(prev => ({ ...prev, eksternalText: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                            />
                          </div>
                        )}

                        {/* Google Docs link UI */}
                        {jenisForm.eksternalTipe === 'link' && (
                          <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Link Dokumen Google Docs Resmi</label>
                            <input 
                              type="url"
                              placeholder="https://docs.google.com/document/d/1_abc123/edit?usp=sharing"
                              value={jenisForm.eksternalLink}
                              onChange={(e) => setJenisForm(prev => ({ ...prev, eksternalLink: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold text-indigo-950"
                            />
                            <p className="text-[10px] text-slate-400 leading-normal">
                              ✓ Pastikan pengaturan berbagi Google Docs Anda diatur ke <strong>"Siapa saja yang memiliki link dapat melihat"</strong> agar pratinjau dapat dimuat dengan lancar.
                            </p>
                          </div>
                        )}

                        {/* Live document preview inside the Form */}
                        <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-inner flex flex-col">
                          <div className="bg-slate-100/85 border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-700 flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-indigo-600" />
                              Pratinjau Dokumen Aktif
                            </span>
                          </div>

                          <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[220px]">
                            {/* Rendering based on type and content */}
                            {(() => {
                              if (jenisForm.eksternalTipe === 'link' && jenisForm.eksternalLink) {
                                const embedUrl = getGoogleDocsEmbedUrl(jenisForm.eksternalLink);
                                if (embedUrl) {
                                  return (
                                    <div className="w-full">
                                      <iframe 
                                        src={embedUrl}
                                        className="w-full h-80 border-0 rounded-lg shadow bg-white"
                                        title="Google Docs Document Preview"
                                      />
                                      <div className="text-center mt-2">
                                        <a 
                                          href={jenisForm.eksternalLink} 
                                          target="_blank" 
                                          rel="noreferrer referrer" 
                                          className="text-[10px] text-indigo-600 hover:underline font-bold"
                                        >
                                          ↗ Buka di Tab Baru
                                        </a>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="text-center p-6 text-slate-400 bg-white border border-slate-200 rounded-xl w-full">
                                      <Globe className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                      <p className="text-xs font-semibold text-slate-600">Google Docs Link Terdeteksi</p>
                                      <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">Link yang diberikan bukan link Google Docs standar yang valid, kami merekomendasikan format link dokumen Google Docs resmi.</p>
                                      <a href={jenisForm.eksternalLink} target="_blank" rel="noreferrer referrer" className="mt-3.5 text-xs text-indigo-600 font-bold hover:underline inline-block">Buka Link Eksternal ↗</a>
                                    </div>
                                  );
                                }
                              }

                              if (jenisForm.eksternalTipe === 'upload' && jenisForm.eksternalFileBase64 && jenisForm.eksternalFileName?.endsWith('.pdf')) {
                                return (
                                  <div className="w-full">
                                    <iframe 
                                      src={jenisForm.eksternalFileBase64}
                                      className="w-full h-80 border border-slate-200 rounded-lg shadow-inner bg-white"
                                      title="PDF Document Preview"
                                    />
                                    <div className="text-center mt-2 text-[10px] text-slate-400 font-semibold">
                                      Dokumen PDF • Multi-Halaman Aktif
                                    </div>
                                  </div>
                                );
                              }

                              // Text or custom upload plain text or Word parsed text preview
                              const combinedText = jenisForm.eksternalText || '';
                              const pages = paginateText(combinedText);
                              const totalPages = pages.length;
                              const safePageIdx = Math.min(Math.max(0, currentExternalPreviewPage), totalPages - 1);
                              const activePageText = pages[safePageIdx] || '';

                              return (
                                <div className="w-full space-y-3">
                                  {/* Multi-page sheet simulation */}
                                  <div className="bg-white rounded-xl border border-slate-200 shadow p-6 min-h-[220px] relative font-serif text-slate-800 text-xs text-left leading-relaxed whitespace-pre-wrap">
                                    {/* Page watermarks / indicator */}
                                    <div className="absolute top-3 right-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none select-none">
                                      Halaman {safePageIdx + 1}
                                    </div>
                                    
                                    {activePageText}
                                  </div>

                                  {/* Multi-page controller */}
                                  {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-3 bg-white border border-slate-200 p-2 rounded-lg max-w-xs mx-auto shadow-sm">
                                      <button
                                        type="button"
                                        disabled={safePageIdx === 0}
                                        onClick={() => setCurrentExternalPreviewPage(p => Math.max(0, p - 1))}
                                        className="text-xs font-bold text-slate-600 disabled:opacity-30 p-1"
                                      >
                                        ◀ Prev
                                      </button>
                                      <span className="text-[10px] text-slate-500 font-bold">
                                        Halaman {safePageIdx + 1} / {totalPages}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={safePageIdx === totalPages - 1}
                                        onClick={() => setCurrentExternalPreviewPage(p => Math.min(totalPages - 1, p + 1))}
                                        className="text-xs font-bold text-slate-600 disabled:opacity-30 p-1"
                                      >
                                        Next ▶
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                      </div>
                    )}

                    {jenisForm.sumberAssessment === 'internal' && jenisForm.modulInternalOption === 'AL_QURAN' && (
                      <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 space-y-4 mt-2 shadow-xs">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            <span>Parameter Khusus Al-Qur'an (Kategori Tilawah / Tahfidz)</span>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Kurikulum & Modul Qur'ani
                          </span>
                        </div>

                        {/* Cakupan & Pemilihan Surat Mode Selector */}
                        <div className="space-y-2 bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-xs">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                              Cakupan & Pemilihan Surat:
                            </label>
                            <span className="text-[10px] text-gray-500 font-medium">
                              Mode: <strong className="text-emerald-700 capitalize">{jenisForm.quranSuratMode || 'semua'}</strong>
                            </span>
                          </div>

                          {/* Mode Tabs */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-gray-100/80 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setJenisForm(prev => ({ ...prev, quranSuratMode: 'semua' }))}
                              className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all text-center ${
                                jenisForm.quranSuratMode === 'semua'
                                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                              }`}
                            >
                              Semua Surat
                            </button>
                            <button
                              type="button"
                              onClick={() => setJenisForm(prev => ({ ...prev, quranSuratMode: 'single' }))}
                              className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all text-center ${
                                jenisForm.quranSuratMode === 'single'
                                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                              }`}
                            >
                              Satu Surat Saja
                            </button>
                            <button
                              type="button"
                              onClick={() => setJenisForm(prev => ({ ...prev, quranSuratMode: 'rentang' }))}
                              className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all text-center ${
                                jenisForm.quranSuratMode === 'rentang'
                                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                              }`}
                            >
                              Rentang Berurutan
                            </button>
                            <button
                              type="button"
                              onClick={() => setJenisForm(prev => ({ ...prev, quranSuratMode: 'kustom' }))}
                              className={`py-1.5 px-2 text-xs rounded-md transition-all text-center relative ${
                                jenisForm.quranSuratMode === 'kustom'
                                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 font-semibold'
                              }`}
                            >
                              <span>Beberapa Surat (Kustom)</span>
                              <span className="ml-1 text-[9px] bg-amber-400 text-amber-950 font-extrabold px-1 rounded">
                                Wajib
                              </span>
                            </button>
                          </div>

                          {/* Mode: SEMUA */}
                          {jenisForm.quranSuratMode === 'semua' && (
                            <div className="p-2.5 bg-gray-50 border border-gray-200/70 rounded-lg text-xs text-gray-600 flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span>Penguji dapat memilih dan menguji <strong>seluruh 114 surat</strong> Al-Qur'an secara bebas saat ujian berlangsung.</span>
                            </div>
                          )}

                          {/* Mode: SINGLE */}
                          {jenisForm.quranSuratMode === 'single' && (
                            <div className="p-2.5 bg-gray-50 border border-gray-200/70 rounded-lg space-y-1.5">
                              <label className="block text-[10px] uppercase font-bold text-gray-600">Pilih 1 Surat Tertentu:</label>
                              <select
                                value={jenisForm.quranSurat}
                                onChange={(e) => setJenisForm(prev => ({ ...prev, quranSurat: e.target.value }))}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-medium text-emerald-950 focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="">-- Pilih Surat --</option>
                                {QURAN_SURAHS.map(s => (
                                  <option key={s.no} value={s.nama}>Surat ke-{s.no}: {s.nama} ({s.ayat} ayat)</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Mode: RENTANG */}
                          {jenisForm.quranSuratMode === 'rentang' && (
                            <div className="p-2.5 bg-gray-50 border border-gray-200/70 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[9px] text-gray-500 font-bold block uppercase mb-1">Dari Surat (Awal):</label>
                                <select
                                  value={jenisForm.quranRentangSuratStart}
                                  onChange={(e) => setJenisForm(prev => ({ ...prev, quranRentangSuratStart: e.target.value }))}
                                  className="w-full bg-white border border-gray-300 text-xs rounded-lg p-1.5 font-medium text-emerald-950"
                                >
                                  <option value="">-- Pilih Surat Awal --</option>
                                  {QURAN_SURAHS.map(s => (
                                    <option key={s.no} value={s.nama}>#{s.no} {s.nama} ({s.ayat} ayat)</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-500 font-bold block uppercase mb-1">Hingga Surat (Akhir):</label>
                                <select
                                  value={jenisForm.quranRentangSuratEnd}
                                  onChange={(e) => setJenisForm(prev => ({ ...prev, quranRentangSuratEnd: e.target.value }))}
                                  className="w-full bg-white border border-gray-300 text-xs rounded-lg p-1.5 font-medium text-emerald-950"
                                >
                                  <option value="">-- Pilih Surat Akhir --</option>
                                  {QURAN_SURAHS.map(s => (
                                    <option key={s.no} value={s.nama}>#{s.no} {s.nama} ({s.ayat} ayat)</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Mode: KUSTOM / MULTI SURAH (Fitur Utama yang Diminta User) */}
                          {jenisForm.quranSuratMode === 'kustom' && (
                            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-emerald-200/60 pb-2">
                                <div>
                                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                    <ListChecks className="h-4 w-4 text-emerald-600" />
                                    <span>Pilihan Beberapa Surat Tidak Berurut (Multi-Surah Kustom)</span>
                                  </div>
                                  <p className="text-[10px] text-emerald-800 mt-0.5">
                                    Akomodasi modul kurikulum tidak berurut seperti <strong>Elemen Qiraah-Wajib</strong>.
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full inline-block">
                                    {selectedSurahsDetail.length} Surat Terpilih
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-medium ml-1.5">
                                    ({totalAyatSelected} Total Ayat)
                                  </span>
                                </div>
                              </div>

                              {/* 1-Click Preset Shortcuts */}
                              <div>
                                <label className="block text-[9px] font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                                  ⚡ Preset Cepat 1-Klik (Rekomendasi Modul):
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {MULTI_SURAH_PRESETS.map(preset => {
                                    const isMatch = preset.surahs.length === (jenisForm.quranSelectedSurahs?.length || 0) &&
                                      preset.surahs.every(s => (jenisForm.quranSelectedSurahs || []).includes(s));
                                    return (
                                      <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset.surahs)}
                                        title={preset.deskripsi}
                                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1.5 ${
                                          isMatch
                                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                            : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100/70 hover:border-emerald-400'
                                        }`}
                                      >
                                        <span>{preset.nama}</span>
                                        <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                          isMatch ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                          {preset.surahs.length}
                                        </span>
                                      </button>
                                    );
                                  })}
                                  <button
                                    type="button"
                                    onClick={handleClearSelectedSurahs}
                                    className="text-xs px-2 py-1 rounded-lg border border-gray-300 bg-white text-gray-500 hover:text-red-600 hover:border-red-300 transition-all ml-auto"
                                    title="Kosongkan pilihan surat"
                                  >
                                    Bersihkan
                                  </button>
                                </div>
                              </div>

                              {/* Search & Add or Open 114 Catalog */}
                              <div className="bg-white p-2.5 rounded-lg border border-emerald-200/90 flex flex-col sm:flex-row gap-2 items-center">
                                <div className="w-full sm:flex-1 flex items-center gap-1.5">
                                  <select
                                    value={quickSelectedSurah}
                                    onChange={(e) => setQuickSelectedSurah(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-1.5 text-xs text-slate-800 font-medium"
                                  >
                                    <option value="">-- Pilih Surat dari Daftar 114 --</option>
                                    {QURAN_SURAHS.map(s => {
                                      const isAlready = (jenisForm.quranSelectedSurahs || []).includes(s.nama);
                                      return (
                                        <option key={s.no} value={s.nama} disabled={isAlready}>
                                          {isAlready ? '✓ ' : ''}Surat ke-{s.no}: {s.nama} ({s.ayat} ayat) {isAlready ? '(Sudah dipilih)' : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={!quickSelectedSurah}
                                    onClick={() => handleAddSurah(quickSelectedSurah)}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Tambah</span>
                                  </button>
                                </div>

                                <div className="w-full sm:w-auto flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setShowSurahCatalog(prev => !prev)}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                                      showSurahCatalog
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    }`}
                                  >
                                    <ListChecks className="h-3.5 w-3.5" />
                                    <span>{showSurahCatalog ? 'Tutup Katalog 114' : '📋 Katalog 114 Checklist'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Expandable 114 Surat Checklist Grid */}
                              {showSurahCatalog && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2.5 shadow-sm"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className="relative w-full max-w-xs">
                                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-gray-400" />
                                        <input
                                          type="text"
                                          placeholder="Cari nomor atau nama surat..."
                                          value={catalogFilter}
                                          onChange={(e) => setCatalogFilter(e.target.value)}
                                          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-2.5 py-1 text-xs"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const juz30Surahs = QURAN_SURAHS.slice(77).map(s => s.nama);
                                          setJenisForm(prev => ({
                                            ...prev,
                                            quranSelectedSurahs: Array.from(new Set([...(prev.quranSelectedSurahs || []), ...juz30Surahs]))
                                          }));
                                        }}
                                        className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2 py-1 rounded"
                                      >
                                        + Pilih Semua Juz 30
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleSortSurahsByMushaf}
                                        className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-2 py-1 rounded"
                                      >
                                        Urutkan Mushaf
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShowSurahCatalog(false)}
                                        className="text-[10px] text-gray-400 hover:text-gray-700 px-1 py-1"
                                      >
                                        Tutup ✕
                                      </button>
                                    </div>
                                  </div>

                                  {/* Grid of 114 Surahs */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1">
                                    {QURAN_SURAHS.filter(s => {
                                      if (!catalogFilter.trim()) return true;
                                      const term = catalogFilter.toLowerCase();
                                      return s.nama.toLowerCase().includes(term) || String(s.no).includes(term);
                                    }).map(s => {
                                      const isSelected = (jenisForm.quranSelectedSurahs || []).includes(s.nama);
                                      return (
                                        <button
                                          key={s.no}
                                          type="button"
                                          onClick={() => handleToggleSurah(s.nama)}
                                          className={`p-1.5 text-left rounded-lg border text-xs flex items-center justify-between transition-all ${
                                            isSelected
                                              ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-bold'
                                              : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-200'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="text-[10px] text-gray-400 font-mono w-5">#{s.no}</span>
                                            <span className="truncate">{s.nama}</span>
                                          </div>
                                          <span className="text-[9px] text-gray-400 font-medium ml-1 flex-shrink-0">
                                            {s.ayat}a
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}

                              {/* Selected Surahs Badge List */}
                              <div className="space-y-1.5 bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                    Daftar Surat Terpilih ({selectedSurahsDetail.length}):
                                  </span>
                                  {selectedSurahsDetail.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={handleSortSurahsByMushaf}
                                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                                    >
                                      Urutkan Sesuai Mushaf (1 s/d 114)
                                    </button>
                                  )}
                                </div>

                                {selectedSurahsDetail.length === 0 ? (
                                  <div className="text-center p-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                                    Belum ada surat yang dipilih. Silakan klik salah satu tombol <strong>Preset Cepat</strong> di atas (misalnya <span className="text-emerald-700 font-bold">Paket Qiraah-Wajib</span>), atau pilih dari dropdown.
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-0.5">
                                    {selectedSurahsDetail.map((surah, idx) => (
                                      <div
                                        key={surah.nama + idx}
                                        className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs group"
                                      >
                                        <span className="text-[9px] bg-emerald-200/60 text-emerald-800 font-mono px-1 rounded">
                                          #{surah.no}
                                        </span>
                                        <span>{surah.nama}</span>
                                        <span className="text-[9.5px] text-emerald-600 font-normal">
                                          ({surah.ayat} ayat)
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSurah(surah.nama)}
                                          className="text-emerald-500 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition-colors ml-0.5"
                                          title={`Hapus ${surah.nama}`}
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tilawah parameters: Juz & Halaman */}
                        <div className="space-y-2.5">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                            Format & Batasan Tilawah (Bacaan Al-Qur'an):
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Juz Tertentu (Opsional)</label>
                              <input
                                type="text"
                                placeholder="Misal: Juz 30, Juz 15"
                                value={jenisForm.quranJuz}
                                onChange={(e) => setJenisForm(prev => ({ ...prev, quranJuz: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs text-center font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Pemilihan Halaman Ujian</label>
                              <select
                                value={jenisForm.quranHalamanUjianOption}
                                onChange={(e) => setJenisForm(prev => ({ ...prev, quranHalamanUjianOption: e.target.value as any }))}
                                className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-bold text-amber-900"
                              >
                                <option value="guru">○ Ditentukan Guru</option>
                                <option value="acak">○ Acak Otomatis</option>
                                <option value="kombinasi">○ Kombinasi</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                            <div className="bg-white border border-gray-150 p-2.5 rounded-lg grid grid-cols-2 gap-2 shadow-inner">
                              <span className="col-span-2 text-[9px] font-bold text-emerald-905 uppercase flex justify-between">
                                <span>Ayat & Halaman:</span>
                                {jenisForm.quranHalamanUjianOption !== 'guru' && <span className="text-amber-800">Uji: {jenisForm.quranHalamanUjianCount} Halaman</span>}
                              </span>
                              
                              <div>
                                <label className="text-[8px] text-gray-400 font-bold block uppercase">Rentang Ayat</label>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="Ayat 1"
                                    value={jenisForm.quranRentangAyatStart || ''}
                                    onChange={(e) => setJenisForm(prev => ({ ...prev, quranRentangAyatStart: Number(e.target.value) }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded text-center text-xs p-1"
                                  />
                                  <span className="text-gray-300">-</span>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="Akhir"
                                    value={jenisForm.quranRentangAyatEnd || ''}
                                    onChange={(e) => setJenisForm(prev => ({ ...prev, quranRentangAyatEnd: Number(e.target.value) }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded text-center text-xs p-1"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[8px] text-gray-400 font-bold block uppercase">Rentang Halaman</label>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <input
                                    type="number"
                                    min="1"
                                    max="604"
                                    placeholder="Hal 1"
                                    value={jenisForm.quranRentangHalamanStart || ''}
                                    onChange={(e) => setJenisForm(prev => ({ ...prev, quranRentangHalamanStart: Number(e.target.value) }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded text-center text-xs p-1"
                                  />
                                  <span className="text-gray-300">-</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="604"
                                    placeholder="604"
                                    value={jenisForm.quranRentangHalamanEnd || ''}
                                    onChange={(e) => setJenisForm(prev => ({ ...prev, quranRentangHalamanEnd: Number(e.target.value) }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded text-center text-xs p-1"
                                  />
                                </div>
                              </div>
                            </div>

                            {jenisForm.quranHalamanUjianOption !== 'guru' && (
                              <div className="bg-white border border-gray-150 p-2.5 rounded-lg flex flex-col justify-center shadow-inner">
                                <span className="text-[9px] font-bold text-amber-900 uppercase mb-1">Jumlah Halaman Uji:</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={jenisForm.quranHalamanUjianCount}
                                    onChange={(e) => setJenisForm(prev => ({ ...prev, quranHalamanUjianCount: Number(e.target.value) }))}
                                    className="w-16 bg-gray-50 border border-gray-300 rounded text-center text-xs font-bold p-1"
                                  />
                                  <span className="text-xs text-gray-500">Halaman diacak otomatis</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tahfidz parameters */}
                        <div className="space-y-2.5 border-t border-emerald-100/50 pt-2.5">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                            Format & Metode Tahfidz (Hafalan Al-Qur'an):
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Metode Pelaksanaan Tahfidz</label>
                              <select
                                value={jenisForm.quranMetodeTahfidz}
                                onChange={(e) => setJenisForm(prev => ({ ...prev, quranMetodeTahfidz: e.target.value }))}
                                className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-bold text-emerald-950"
                              >
                                <option value="Sambung Ayat">○ Sambung Ayat</option>
                                <option value="Sambung Surat">○ Sambung Surat</option>
                                <option value="Tasmi'">○ Tasmi' (Hafalan Utuh)</option>
                                <option value="Setor Hafalan Lengkap">○ Setor Hafalan Lengkap</option>
                                <option value="Acak Otomatis">○ Acak Otomatis (Sistem)</option>
                                <option value="Gabungan">○ Gabungan / Mix</option>
                              </select>
                            </div>

                            {jenisForm.quranMetodeTahfidz === 'Acak Otomatis' && (
                              <div>
                                <label className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Jumlah Soal Acak (Total)</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={jenisForm.quranTahfidzJumlahSoal}
                                  onChange={(e) => setJenisForm(prev => ({ ...prev, quranTahfidzJumlahSoal: Number(e.target.value) }))}
                                  className="w-20 bg-white border border-gray-250 rounded font-bold text-center text-xs p-1.5 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            )}
                          </div>

                          {(jenisForm.quranMetodeTahfidz === 'Acak Otomatis' || jenisForm.quranMetodeTahfidz === 'Gabungan') && (
                            <div className="bg-white/90 p-2.5 rounded-lg border border-gray-200 space-y-2.5 shadow-sm">
                              <span className="text-[9.5px] font-bold text-emerald-900 uppercase block">Batasan Cakupan Soal Acak:</span>
                              
                              {jenisForm.quranSuratMode === 'kustom' && jenisForm.quranSelectedSurahs && jenisForm.quranSelectedSurahs.length > 0 ? (
                                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                                  <span>
                                    ✓ Soal acak akan otomatis diambil dari <strong>{jenisForm.quranSelectedSurahs.length} Surat Terpilih</strong> di atas (Qiraah-Wajib / Pilihan).
                                  </span>
                                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                                    Aktif
                                  </span>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="text-[8px] font-bold uppercase text-gray-400">Rentang Surat</label>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <select
                                        value={jenisForm.quranTahfidzRentangSuratStart}
                                        onChange={(e) => setJenisForm(prev => ({ ...prev, quranTahfidzRentangSuratStart: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 text-[11px] rounded p-1"
                                      >
                                        <option value="">Awal...</option>
                                        {QURAN_SURAHS.map(s => (
                                          <option key={s.no} value={s.nama}>{s.nama}</option>
                                        ))}
                                      </select>
                                      <span className="text-gray-300">s/d</span>
                                      <select
                                        value={jenisForm.quranTahfidzRentangSuratEnd}
                                        onChange={(e) => setJenisForm(prev => ({ ...prev, quranTahfidzRentangSuratEnd: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 text-[11px] rounded p-1"
                                      >
                                        <option value="">Akhir...</option>
                                        {QURAN_SURAHS.map(s => (
                                          <option key={s.no} value={s.nama}>{s.nama}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[8px] font-bold uppercase text-gray-400">Rentang Juz</label>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <input
                                        type="text"
                                        placeholder="Juz 28"
                                        value={jenisForm.quranTahfidzRentangJuzStart}
                                        onChange={(e) => setJenisForm(prev => ({ ...prev, quranTahfidzRentangJuzStart: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 text-xs text-center rounded p-1 font-bold"
                                      />
                                      <span className="text-gray-300">s/d</span>
                                      <input
                                        type="text"
                                        placeholder="Juz 30"
                                        value={jenisForm.quranTahfidzRentangJuzEnd}
                                        onChange={(e) => setJenisForm(prev => ({ ...prev, quranTahfidzRentangJuzEnd: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 text-xs text-center rounded p-1 font-bold"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Status Aktif:</span>
                      <button
                        type="button"
                        onClick={() => setJenisForm(prev => ({ ...prev, statusAktif: prev.statusAktif === StatusAktif.AKTIF ? StatusAktif.NON_AKTIF : StatusAktif.AKTIF }))}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          jenisForm.statusAktif === StatusAktif.AKTIF 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {jenisForm.statusAktif === StatusAktif.AKTIF ? 'Aktif' : 'Non-Aktif'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowJenisForm(false); setEditingJenis(null); }}
                        className="text-xs text-gray-600 hover:text-gray-900 border border-gray-200 bg-white px-4 py-2 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-semibold px-4 py-2 rounded-lg"
                      >
                        Simpan Jenis Assessment
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* List of Kategori & Jenis Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jenisAssessments.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                  <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-sm">Belum ada Jenis Assessment</p>
                  <p className="text-xs text-gray-400 mt-1">Buat jenis ujian kualifikasi baru dengan tombol di atas.</p>
                </div>
              ) : (
                jenisAssessments.map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {item.pelajaranNama || item.kategori || 'Pelajaran'}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${(item.statusAktif === StatusAktif.AKTIF || item.statusAktif === true || (item.statusAktif as any) === 'Aktif') ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">{item.namaAssessment}</h3>
                      <p className="text-xs text-slate-700 font-medium mt-1">Elemen: <span className="text-emerald-700 font-semibold">{item.elemen}</span></p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Modul: <span className="text-indigo-600 font-semibold">{item.modulNama || 'Semua Modul'}</span></p>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-2">{item.deskripsi || 'Tidak ada deskripsi.'}</p>
                    </div>
                    
                    <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-4">
                      <button
                        onClick={() => {
                          const matchedMapel = mataPelajarans.find(mp => mp.id === item.pelajaranId) || 
                                               mataPelajarans.find(mp => mp.elemenList.some(e => e.nama.toLowerCase() === (item.elemen || '').toLowerCase())) || 
                                               mataPelajarans[0];
                          const defaultPelajaranId = matchedMapel?.id || '';
                          const defaultPelajaranNama = matchedMapel?.nama || '';

                          setEditingJenis(item);
                          setJenisForm({
                            kategori: item.kategori,
                            elemen: item.elemen || '',
                            namaAssessment: item.namaAssessment,
                            deskripsi: item.deskripsi || '',
                            statusAktif: (item.statusAktif === true || item.statusAktif === StatusAktif.AKTIF || (item.statusAktif as any) === 'Aktif') ? StatusAktif.AKTIF : StatusAktif.NON_AKTIF,
                            pelajaranId: item.pelajaranId || defaultPelajaranId,
                            pelajaranNama: item.pelajaranNama || defaultPelajaranNama,
                            modulId: item.modulId || '',
                            modulNama: item.modulNama || '',
                            sumberAssessment: item.sumberAssessment || 'internal',
                            modulInternalOption: item.modulInternalOption || 'AL_QURAN',
                            eksternalTipe: item.eksternalTipe || 'text',
                            eksternalText: item.eksternalText || '',
                            eksternalFileBase64: item.eksternalFileBase64 || '',
                            eksternalFileName: item.eksternalFileName || '',
                            eksternalFileType: item.eksternalFileType || '',
                            eksternalFileSize: item.eksternalFileSize || 0,
                            eksternalLink: item.eksternalLink || '',
                            quranJuz: item.quranJuz || '',
                            quranSurat: item.quranSurat || '',
                            quranRentangSuratStart: item.quranRentangSuratStart || '',
                            quranRentangSuratEnd: item.quranRentangSuratEnd || '',
                            quranRentangAyatStart: item.quranRentangAyatStart !== undefined ? item.quranRentangAyatStart : 1,
                            quranRentangAyatEnd: item.quranRentangAyatEnd !== undefined ? item.quranRentangAyatEnd : 10,
                            quranRentangHalamanStart: item.quranRentangHalamanStart !== undefined ? item.quranRentangHalamanStart : 1,
                            quranRentangHalamanEnd: item.quranRentangHalamanEnd !== undefined ? item.quranRentangHalamanEnd : 604,
                            quranHalamanUjianOption: item.quranHalamanUjianOption || 'guru',
                            quranHalamanUjianCount: item.quranHalamanUjianCount !== undefined ? item.quranHalamanUjianCount : 3,
                            quranMetodeTahfidz: item.quranMetodeTahfidz || 'Sambung Ayat',
                            quranTahfidzRentangSuratStart: item.quranTahfidzRentangSuratStart || '',
                            quranTahfidzRentangSuratEnd: item.quranTahfidzRentangSuratEnd || '',
                            quranTahfidzRentangJuzStart: item.quranTahfidzRentangJuzStart || '',
                            quranTahfidzRentangJuzEnd: item.quranTahfidzRentangJuzEnd || '',
                            quranTahfidzJumlahSoal: item.quranTahfidzJumlahSoal !== undefined ? item.quranTahfidzJumlahSoal : 10,
                            quranSuratMode: item.quranSuratMode || ((item.quranSelectedSurahs && item.quranSelectedSurahs.length > 0) ? 'kustom' : (item.quranRentangSuratStart && item.quranRentangSuratEnd) ? 'rentang' : item.quranSurat ? 'single' : 'semua'),
                            quranSelectedSurahs: item.quranSelectedSurahs || []
                          });
                          setShowJenisForm(true);
                        }}
                        className="text-[11px] text-gray-600 hover:text-emerald-700 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <span className="text-gray-200">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete({
                            type: 'jenis',
                            id: item.id,
                            title: item.namaAssessment,
                            desc: item.deskripsi
                          });
                        }}
                        className="text-[11px] text-red-500 hover:text-red-700 transition-colors font-medium cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'template' && (
          <motion.div
            key="template-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header toolbar for Template */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                Daftar Template Rubrik Kelulusan
              </h2>
              {!showTemplateForm && (
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({
                      namaTemplate: '',
                      jenisAssessmentId: '',
                      jenisAssessmentIds: [],
                      petunjukPelaksanaan: '',
                      petunjukPerJenis: {},
                      rubrik: [
                        { kriteria: 'Tajwid & Makhraj', bobotPersen: 35 },
                        { kriteria: 'Kelancaran Hafalan', bobotPersen: 40 },
                        { kriteria: 'Fashohah & Irama', bobotPersen: 15 },
                        { kriteria: 'Adab & Tartil', bobotPersen: 10 }
                      ],
                      syaratMinScore: 80,
                      statusAktif: StatusAktif.AKTIF,
                      modePenilaian: 'Langsung',
                      oncePerSessionCategories: ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']
                    });
                    setShowTemplateForm(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4" /> Buat Template Baru
                </button>
              )}
            </div>

            {/* Template Form */}
            {showTemplateForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5"
              >
                <form onSubmit={handleSaveTemplateItem} className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-950">
                    {editingTemplate ? 'Edit Template Evaluasi' : 'Desain Template Rubrik Penilaian Baru'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Nama Template Evaluasi</label>
                      <input
                        type="text"
                        placeholder="Misal: Standar Penilaian Tasmi' 1/4 Juz 29, Rubrik Ujian Iqra"
                        value={templateForm.namaTemplate}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, namaTemplate: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                        required
                      />
                    </div>

                    {/* Multi-Select Jenis Assessment Connection */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            Hubungkan Ke Kategori & Jenis Assessment Terkait <span className="text-rose-500">*</span>
                          </label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Satu rubrik dapat digunakan untuk beberapa Jenis Assessment sekaligus (misal: Tasmi' 1/4 Pertama s.d. Keempat, 1/2 Juz, & 1 Juz).
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800">
                            {templateForm.jenisAssessmentIds.length} Terpilih
                          </span>
                          <button
                            type="button"
                            onClick={selectAllJenisIds}
                            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            Pilih Semua
                          </button>
                          <button
                            type="button"
                            onClick={deselectAllJenisIds}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Search & Filter bar for Jenis Assessment */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Cari Jenis Assessment..."
                          value={jenisFilterSearch}
                          onChange={(e) => setJenisFilterSearch(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 flex-1"
                        />
                        <select
                          value={jenisFilterCategory}
                          onChange={(e) => setJenisFilterCategory(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="ALL">Semua Kategori</option>
                          <option value={KategoriAssessment.TAHFIDZ}>Tahfidz</option>
                          <option value={KategoriAssessment.TILAWAH}>Tilawah</option>
                          <option value={KategoriAssessment.IQRA}>Iqra / Tahsin</option>
                          <option value={KategoriAssessment.KITAB}>Kitab / Munaqasyah</option>
                          <option value={KategoriAssessment.PROGRAM}>Program / Lainnya</option>
                        </select>
                      </div>

                      {/* Multi-Select Badges Grid */}
                      <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-1 border border-slate-200 dark:border-slate-700/80 rounded-lg bg-white dark:bg-slate-900">
                        {jenisAssessments
                          .filter(j => {
                            const matchesCategory = jenisFilterCategory === 'ALL' || j.kategori === jenisFilterCategory;
                            const matchesSearch = !jenisFilterSearch || j.namaAssessment.toLowerCase().includes(jenisFilterSearch.toLowerCase()) || (j.elemen && j.elemen.toLowerCase().includes(jenisFilterSearch.toLowerCase()));
                            return matchesCategory && matchesSearch;
                          })
                          .map(j => {
                            const isChecked = templateForm.jenisAssessmentIds.includes(j.id);
                            return (
                              <div
                                key={j.id}
                                onClick={() => toggleTemplateJenisId(j.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all select-none ${
                                  isChecked
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold shadow-xs'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by div onClick
                                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                                />
                                <div className="truncate">
                                  <span className="block truncate">{j.namaAssessment}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">[{j.kategori}]</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Petunjuk / Prosedur Pembacaan Bagi Penguji (Utama / Default)
                        </label>
                        <textarea
                          placeholder="Tulis petunjuk pelaksanaan umum, tata tertib, dan instruksi bagi guru penguji..."
                          rows={3}
                          value={templateForm.petunjukPelaksanaan}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, petunjukPelaksanaan: e.target.value }))}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                        />
                      </div>

                      {/* Optional Custom Petunjuk per Jenis Assessment */}
                      {templateForm.jenisAssessmentIds.length > 0 && (
                        <div className="border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                              Petunjuk / Prosedur Pembacaan Spesifik Per Jenis Assessment (Opsional)
                            </label>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold">
                              {Object.keys(templateForm.petunjukPerJenis || {}).length} Kustomisasi
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Tulis petunjuk khusus untuk Jenis Assessment tertentu jika prosedur pembacaannya berbeda (misal rentang surat/juz).
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {jenisAssessments
                              .filter(j => templateForm.jenisAssessmentIds.includes(j.id))
                              .map(j => {
                                const hasCustom = !!(templateForm.petunjukPerJenis && templateForm.petunjukPerJenis[j.id]);
                                const isActive = activePetunjukJenisTab === j.id;
                                return (
                                  <button
                                    key={j.id}
                                    type="button"
                                    onClick={() => setActivePetunjukJenisTab(j.id)}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                                      isActive
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : hasCustom
                                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>{j.namaAssessment}</span>
                                    {hasCustom && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                                  </button>
                                );
                              })}
                          </div>

                          {activePetunjukJenisTab && templateForm.jenisAssessmentIds.includes(activePetunjukJenisTab) && (
                            <div className="mt-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                                <span>
                                  Petunjuk Khusus:{' '}
                                  {jenisAssessments.find(j => j.id === activePetunjukJenisTab)?.namaAssessment}
                                </span>
                                {templateForm.petunjukPerJenis?.[activePetunjukJenisTab] && (
                                  <button
                                    type="button"
                                    onClick={() => handlePetunjukPerJenisChange(activePetunjukJenisTab, '')}
                                    className="text-rose-600 hover:underline text-[10px]"
                                  >
                                    Hapus (Gunakan Default)
                                  </button>
                                )}
                              </div>
                              <textarea
                                placeholder={`Tulis petunjuk khusus untuk ${jenisAssessments.find(j => j.id === activePetunjukJenisTab)?.namaAssessment}...`}
                                rows={2}
                                value={templateForm.petunjukPerJenis?.[activePetunjukJenisTab] || ''}
                                onChange={(e) => handlePetunjukPerJenisChange(activePetunjukJenisTab, e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Syarat Nilai Minimal Kelulusan (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={templateForm.syaratMinScore}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, syaratMinScore: Number(e.target.value) }))}
                          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-xs w-32 focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                          required
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Sistem Mode Penilaian</label>
                        <select
                          value={templateForm.modePenilaian || 'Langsung'}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, modePenilaian: e.target.value as 'Langsung' | 'PenguranganKesalahan' }))}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                        >
                          <option value="Langsung">Mode Nilai Langsung (Manual)</option>
                          <option value="PenguranganKesalahan">Mode Pengurangan Kesalahan (Otomatis)</option>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {templateForm.modePenilaian === 'PenguranganKesalahan' 
                            ? 'Nilai dihitung: Bobot - (Kesalahan × Poin Pengurangan)' 
                            : 'Nilai per kriteria diinput langsung oleh guru secara manual (0-100).'}
                        </p>
                      </div>
                    </div>

                    {/* Rubrik Penilaian Builder */}
                    <div className="border border-emerald-100 bg-white dark:bg-slate-900 rounded-xl p-4 space-y-4">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          Pembobotan Rubrik Penilaian (Total Bobot Harus 100%)
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 hidden sm:inline-block">
                          Terintegrasi Kategori Kesalahan Setoran
                        </span>
                      </h4>

                      {/* Added Rubrik List */}
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {templateForm.rubrik.length === 0 ? (
                          <div className="p-3 text-center text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
                            Belum ada kriteria. Masukkan nama kriteria, bobot, dan hubungkan kategori kesalahan di bawah ini.
                          </div>
                        ) : (
                          templateForm.rubrik.map((row, idx) => (
                            <div key={idx} className="flex flex-col text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-2.5 rounded-lg space-y-2">
                              {editingRubrikIndex === idx ? (
                                /* ===================== INLINE EDIT MODE ===================== */
                                <div className="space-y-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/80 p-3 rounded-lg animate-fade-in text-left">
                                  <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800/60">
                                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                      <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                      Edit Kriteria #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => saveEditRubrik(idx)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                                        title="Simpan Perubahan Kriteria"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Simpan</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelEditRubrik}
                                        className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                                        title="Batal Edit"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Batal</span>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                    <div className="sm:col-span-8">
                                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                                        Nama Kriteria Evaluasi
                                      </label>
                                      <input
                                        type="text"
                                        value={editRubrikItem.kriteria}
                                        onChange={(e) => setEditRubrikItem(prev => ({ ...prev, kriteria: e.target.value }))}
                                        placeholder="Nama kriteria..."
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white"
                                        autoFocus
                                      />
                                    </div>
                                    <div className="sm:col-span-4">
                                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                                        Bobot Persentase (%)
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="1"
                                          max="100"
                                          value={editRubrikItem.bobotPersen}
                                          onChange={(e) => setEditRubrikItem(prev => ({ ...prev, bobotPersen: Number(e.target.value) }))}
                                          className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-center font-bold focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                        />
                                        <span className="text-xs font-bold text-slate-500">%</span>
                                      </div>
                                    </div>
                                  </div>

                                  {templateForm.modePenilaian === 'PenguranganKesalahan' && (
                                    <div className="flex items-center gap-2 bg-amber-100/70 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-300 dark:border-amber-800/60">
                                      <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 whitespace-nowrap">
                                        Poin Pengurangan per Kesalahan:
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={editRubrikItem.poinPengurangan}
                                        onChange={(e) => setEditRubrikItem(prev => ({ ...prev, poinPengurangan: Number(e.target.value) }))}
                                        className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md p-1 text-center w-16 text-xs font-bold text-amber-950 dark:text-amber-200 focus:ring-1 focus:ring-amber-500"
                                      />
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400">poin / kesalahan</span>
                                    </div>
                                  )}

                                  {/* Connected Categories/Classifications for Edit Mode */}
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wider">
                                        <Tag className="w-2.5 h-2.5 text-indigo-500" />
                                        Tipe Klasifikasi Terhubung:
                                      </label>
                                      {editRubrikItem.categoryIds.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setEditRubrikItem(prev => ({ ...prev, categoryIds: [] }))}
                                          className="text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                        >
                                          Hapus Semua Terpilih ({editRubrikItem.categoryIds.length})
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                      {availableClassificationOptions.map((opt) => {
                                        const isSelected = editRubrikItem.categoryIds.includes(opt.id) || (opt.id === 'kriteria_umum' && editRubrikItem.categoryIds.includes('umum'));
                                        const isJaliy = opt.id === 'lahn_jaliy';
                                        const isKhafiy = opt.id === 'lahn_khafiy';
                                        const isUmum = opt.isUmum;

                                        return (
                                          <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                              setEditRubrikItem(prev => {
                                                const currentIds = prev.categoryIds || [];
                                                const exists = currentIds.includes(opt.id) || (opt.id === 'kriteria_umum' && currentIds.includes('umum'));
                                                let updated;
                                                if (exists) {
                                                  updated = currentIds.filter(id => id !== opt.id && id !== 'umum' && id !== 'kriteria_umum');
                                                } else {
                                                  if (isUmum) {
                                                    updated = ['kriteria_umum'];
                                                  } else {
                                                    updated = [...currentIds.filter(id => id !== 'kriteria_umum' && id !== 'umum'), opt.id];
                                                  }
                                                }
                                                return { ...prev, categoryIds: updated };
                                              });
                                            }}
                                            className={`px-2 py-0.5 rounded text-[9.5px] font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                              isSelected
                                                ? isUmum
                                                  ? 'bg-slate-800 text-white border-slate-900 shadow-xs dark:bg-slate-700 dark:border-slate-600'
                                                  : isJaliy
                                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                    : isKhafiy
                                                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                                      : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : isUmum
                                                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                  : isJaliy
                                                    ? 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                                                    : isKhafiy
                                                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
                                                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                                            }`}
                                            title={opt.deskripsi || opt.nama}
                                          >
                                            <span>{isSelected ? '✓ ' : '+ '}{opt.nama}</span>
                                            <span className={`text-[7.5px] uppercase px-1 py-0.1 rounded font-mono ${
                                              isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}>
                                              {opt.labelSingkat || (isUmum ? 'Umum' : 'Tipe')}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                                      Pilihan tipe klasifikasi sesuai menu Mutabaah &gt; Kategori Kesalahan. Pilih Kriteria Umum untuk penilaian non-kesalahan.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                /* ===================== NORMAL VIEW MODE ===================== */
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-800 dark:text-gray-100 text-xs">{row.kriteria}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded text-[11px]">
                                        Bobot: {row.bobotPersen}%
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => startEditRubrik(idx)}
                                        className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 p-1 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition cursor-pointer"
                                        title="Edit Kriteria Rubrik"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeRubrikRow(idx)}
                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition cursor-pointer"
                                        title="Hapus Kriteria"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {templateForm.modePenilaian === 'PenguranganKesalahan' && row.poinPengurangan !== undefined && (
                                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50 w-max">
                                      <span>Poin Pengurangan: <strong>{row.poinPengurangan} poin / kesalahan</strong></span>
                                    </div>
                                  )}

                                  {/* Connected Categories/Classifications for this row */}
                                  <div className="pt-1.5 border-t border-gray-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                      <Tag className="w-2.5 h-2.5 text-indigo-500" />
                                      Klasifikasi Terhubung:
                                    </span>
                                    {row.categoryIds && row.categoryIds.length > 0 ? (
                                      row.categoryIds.map(catId => {
                                        const meta = getClassificationOrCategoryMeta(catId);
                                        const isOnce = isTemplateCategoryOnce(catId, meta.nama);
                                        return (
                                          <span
                                            key={catId}
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                                              meta.isUmum
                                                ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                                                : meta.bgColor
                                            }`}
                                          >
                                            <span>{meta.isUmum ? '📌 ' : '✓ '}{meta.nama}</span>
                                            {meta.labelSingkat && (
                                              <span className="text-[7.5px] px-1 py-0.1 bg-black/10 dark:bg-white/10 rounded font-mono uppercase">
                                                {meta.labelSingkat}
                                              </span>
                                            )}
                                            {isOnce && (
                                              <span className="text-[7.5px] px-1 py-0.2 bg-amber-500 text-white rounded font-black uppercase">
                                                1x Potong
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setTemplateForm(prev => ({
                                                  ...prev,
                                                  rubrik: prev.rubrik.map((r, i) => i === idx ? {
                                                    ...r,
                                                    categoryIds: (r.categoryIds || []).filter(c => c !== catId)
                                                  } : r)
                                                }));
                                              }}
                                              className="hover:text-red-500 ml-0.5 font-bold cursor-pointer"
                                              title="Hapus keterhubungan"
                                            >
                                              ×
                                            </button>
                                          </span>
                                        );
                                      })
                                    ) : (
                                      <span className="text-[9px] text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        Belum terhubung ke tipe klasifikasi
                                      </span>
                                    )}

                                    {/* Dropdown/Quick selector to add more classification/category to this row */}
                                    {availableClassificationOptions.length > 0 && (
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          const selectedId = e.target.value;
                                          if (!selectedId) return;
                                          setTemplateForm(prev => ({
                                            ...prev,
                                            rubrik: prev.rubrik.map((r, i) => {
                                              if (i !== idx) return r;
                                              const current = r.categoryIds || [];
                                              if (selectedId === 'kriteria_umum') {
                                                return { ...r, categoryIds: ['kriteria_umum'] };
                                              }
                                              const filtered = current.filter(c => c !== 'kriteria_umum' && c !== 'umum');
                                              return {
                                                ...r,
                                                categoryIds: Array.from(new Set([...filtered, selectedId]))
                                              };
                                            })
                                          }));
                                        }}
                                        className="text-[9px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 cursor-pointer ml-auto"
                                      >
                                        <option value="">+ Hubungkan Kategori</option>
                                        {availableClassificationOptions.map(opt => {
                                          const isAlreadyAdded = (row.categoryIds || []).includes(opt.id) || (opt.id === 'kriteria_umum' && (row.categoryIds || []).includes('umum'));
                                          if (isAlreadyAdded) return null;
                                          return (
                                            <option key={opt.id} value={opt.id}>
                                              {opt.isUmum ? '📌 ' : '🏷️ '}{opt.nama} {opt.labelSingkat ? `(${opt.labelSingkat})` : ''}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add New Criteria Form */}
                      <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Nama kriteria (misal: Lahn Jaliy, Makhraj, Kelancaran)..."
                            value={newRubrikItem.kriteria}
                            onChange={(e) => setNewRubrikItem(prev => ({ ...prev, kriteria: e.target.value }))}
                            className="sm:col-span-8 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 dark:text-white"
                          />
                          <div className="sm:col-span-4 flex items-center gap-1.5">
                            <input
                              type="number"
                              placeholder="%"
                              min="1"
                              max="100"
                              value={newRubrikItem.bobotPersen}
                              onChange={(e) => setNewRubrikItem(prev => ({ ...prev, bobotPersen: Number(e.target.value) }))}
                              className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-2 text-xs text-center font-bold focus:ring-1 focus:ring-emerald-500 w-20 dark:text-white"
                            />
                            <span className="text-xs font-bold text-gray-500">% Bobot</span>
                          </div>
                        </div>

                        {templateForm.modePenilaian === 'PenguranganKesalahan' && (
                          <div className="flex items-center gap-2 bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
                            <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 whitespace-nowrap">Poin Pengurangan per Kesalahan:</label>
                            <input
                              type="number"
                              placeholder="5"
                              min="0"
                              value={newRubrikItem.poinPengurangan !== undefined ? newRubrikItem.poinPengurangan : 5}
                              onChange={(e) => setNewRubrikItem(prev => ({ ...prev, poinPengurangan: Number(e.target.value) }))}
                              className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md p-1 text-center w-16 text-xs font-bold text-amber-950 dark:text-amber-200 focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">poin / kesalahan</span>
                          </div>
                        )}

                        {/* Classification Selector Box */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wider">
                              <Tag className="w-3 h-3 text-indigo-500" />
                              Pilih Tipe Klasifikasi Kesalahan / Kriteria:
                            </label>
                            {newRubrikItem.categoryIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setNewRubrikItem(prev => ({ ...prev, categoryIds: [] }))}
                                className="text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                              >
                                Clear Selection ({newRubrikItem.categoryIds.length})
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                            {availableClassificationOptions.map((opt) => {
                              const isSelected = newRubrikItem.categoryIds.includes(opt.id) || (opt.id === 'kriteria_umum' && newRubrikItem.categoryIds.includes('umum'));
                              const isJaliy = opt.id === 'lahn_jaliy';
                              const isKhafiy = opt.id === 'lahn_khafiy';
                              const isUmum = opt.isUmum;

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setNewRubrikItem(prev => {
                                      const currentIds = prev.categoryIds || [];
                                      const exists = currentIds.includes(opt.id) || (opt.id === 'kriteria_umum' && currentIds.includes('umum'));
                                      let updated;
                                      if (exists) {
                                        updated = currentIds.filter(id => id !== opt.id && id !== 'umum' && id !== 'kriteria_umum');
                                      } else {
                                        if (isUmum) {
                                          updated = ['kriteria_umum'];
                                        } else {
                                          updated = [...currentIds.filter(id => id !== 'kriteria_umum' && id !== 'umum'), opt.id];
                                        }
                                      }
                                      return { 
                                        ...prev, 
                                        categoryIds: updated,
                                        kriteria: !prev.kriteria.trim() ? (isUmum ? 'Kriteria Umum' : opt.nama) : prev.kriteria
                                      };
                                    });
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                    isSelected
                                      ? isUmum
                                        ? 'bg-slate-800 text-white border-slate-900 shadow-xs dark:bg-slate-700 dark:border-slate-600'
                                        : isJaliy
                                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                          : isKhafiy
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                            : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : isUmum
                                        ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                        : isJaliy
                                          ? 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                                          : isKhafiy
                                            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
                                            : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                                  }`}
                                  title={opt.deskripsi || opt.nama}
                                >
                                  <span>{isSelected ? '✓ ' : '+ '}{opt.nama}</span>
                                  <span className={`text-[8px] uppercase px-1 py-0.2 rounded font-mono ${
                                    isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {opt.labelSingkat || (isUmum ? 'Umum' : 'Tipe')}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[9.5px] text-slate-400 dark:text-slate-500 italic px-1">
                            Pilihan tipe klasifikasi diambil dari menu Mutabaah &gt; Kategori Kesalahan. Pilih Kriteria Umum untuk penilaian non-kesalahan.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={addRubrikRow}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Kriteria Ke Rubrik
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/75 dark:bg-emerald-950/50 p-2.5 rounded-lg font-bold border border-emerald-200/50 dark:border-emerald-800/50">
                        <span>Total Bobot saat ini:</span>
                        <span className={templateForm.rubrik.reduce((sum, item) => sum + item.bobotPersen, 0) === 100 ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-rose-600 dark:text-rose-400 font-extrabold'}>
                          {templateForm.rubrik.reduce((sum, item) => sum + item.bobotPersen, 0)} %
                        </span>
                      </div>
                    </div>

                    {/* ATURAN PEMOTONGAN KESALAHAN (SEPERTI MASTER BOBOT MUTABAAH) */}
                    <div className="border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 rounded-xl p-4 space-y-4">
                      {/* Informative Banner for 1x Per Session */}
                      <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-left">
                        <span className="text-xl shrink-0 leading-none mt-0.5">✨</span>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                              Aturan Pemotongan: Kategori yang Hanya Dihitung Satu Kali Kesalahan
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                              {templateForm.oncePerSessionCategories.length > 0 
                                ? `${Math.round(templateForm.oncePerSessionCategories.length / 2)} kategori aktif (Maks 1x)` 
                                : 'Semua tiap kesalahan'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                            Kategori yang diaktifkan sebagai <strong>&quot;Maks 1x Potong&quot;</strong> hanya akan mengurangi nilai / dihitung satu kali kesalahan dalam satu sesi ujian, meskipun santri melakukan kesalahan berulang pada kategori tersebut (misalnya <em>Makhraj Huruf</em>). Kategori bertanda <strong>&quot;Tiap Kesalahan&quot;</strong> akan dipotong setiap kali kesalahan dicatat.
                          </p>
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setTemplateForm(prev => ({
                                ...prev,
                                oncePerSessionCategories: ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']
                              }))}
                              className="text-[10px] font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                            >
                              Pilih Standar (Hanya Makhraj)
                            </button>
                            <span className="text-amber-400">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                const all: string[] = [];
                                (tajwidCategories || []).forEach(tc => {
                                  all.push(tc.id, tc.nama);
                                });
                                setTemplateForm(prev => ({ ...prev, oncePerSessionCategories: all }));
                              }}
                              className="text-[10px] font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                            >
                              Semua Kategori 1x
                            </button>
                            <span className="text-amber-400">•</span>
                            <button
                              type="button"
                              onClick={() => setTemplateForm(prev => ({ ...prev, oncePerSessionCategories: [] }))}
                              className="text-[10px] font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                            >
                              Reset Semua ke Tiap Kesalahan
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Category Grid for 1x Toggle */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Kebijakan Pemotongan per Kategori Kesalahan Terhubung
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Total Kategori: {(tajwidCategories || []).length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 max-h-56 overflow-y-auto">
                          {(tajwidCategories || []).map(cat => {
                            const isOnce = isTemplateCategoryOnce(cat.id, cat.nama);
                            const subList = getCategorySubcategoriesList(cat, cat.nama);
                            const hasSubs = subList && subList.length > 0;
                            const isMakhraj = isMakhrajOrHijaiyahCategory(cat.nama) || isMakhrajOrHijaiyahCategory(cat.id);

                            return (
                              <div
                                key={cat.id}
                                className={`p-2.5 rounded-lg border transition flex flex-col justify-between gap-1.5 ${
                                  isOnce
                                    ? 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800/60'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                                      {cat.nama}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[9px] px-1 py-0.2 rounded font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                        {cat.tipe || 'tajwid'}
                                      </span>
                                      {hasSubs && (
                                        <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                                          🔤 {subList.length} {isMakhraj ? 'Huruf' : 'Sub'}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => toggleTemplateCategoryOnce(cat.id, cat.nama)}
                                    className={`px-2 py-1 rounded text-[9.5px] font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer ${
                                      isOnce
                                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                    title={
                                      isOnce
                                        ? hasSubs
                                          ? 'Kategori ini hanya memotong poin maks 1 kali per huruf/subkategori unik'
                                          : 'Kategori ini hanya memotong poin 1 kali per sesi ujian'
                                        : 'Klik untuk mengubah menjadi pemotongan 1 kali per sesi'
                                    }
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOnce ? 'bg-white' : 'bg-slate-400'}`} />
                                    <span>{isOnce ? (hasSubs ? (isMakhraj ? 'Maks 1x per Huruf' : 'Maks 1x per Sub') : 'Maks 1x Potong') : 'Tiap Kesalahan'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-emerald-100">
                    <button
                      type="button"
                      onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }}
                      className="text-xs text-gray-600 hover:text-gray-900 border border-gray-200 bg-white px-4 py-2 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-semibold px-4 py-2 rounded-lg"
                    >
                      Simpan Template Rubrik
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* List of Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templateAssessments.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                  <ClipboardCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-sm">Belum ada Template Assessment</p>
                  <p className="text-xs text-gray-400 mt-1">Buat template kriteria penilaian baru dengan klik tombol di atas.</p>
                </div>
              ) : (
                templateAssessments.map(item => {
                  const connectedIds = item.jenisAssessmentIds && item.jenisAssessmentIds.length > 0
                    ? item.jenisAssessmentIds
                    : (item.jenisAssessmentId ? [item.jenisAssessmentId] : []);
                  const connectedJenisList = jenisAssessments.filter(j => connectedIds.includes(j.id));
                  const customPetunjukCount = item.petunjukPerJenis ? Object.keys(item.petunjukPerJenis).length : 0;

                  return (
                    <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-3 gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{item.namaTemplate}</h3>
                          <div className="flex flex-wrap gap-1.5 items-center mt-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Terhubung Ke:</span>
                            {connectedJenisList.length > 0 ? (
                              connectedJenisList.map(j => (
                                <span key={j.id} className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                                  {j.namaAssessment} ({j.kategori})
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold">Umum / Program</span>
                            )}

                            {customPetunjukCount > 0 && (
                              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-800 flex items-center gap-1">
                                📝 {customPetunjukCount} Petunjuk Khusus
                              </span>
                            )}

                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              item.modePenilaian === 'PenguranganKesalahan' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {item.modePenilaian === 'PenguranganKesalahan' ? 'Mode Kelalaian/Deduction' : 'Mode Nilai Langsung'}
                            </span>

                            {item.oncePerSessionCategories && item.oncePerSessionCategories.length > 0 && (
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                                <span>{Math.round(item.oncePerSessionCategories.length / 2)} Kategori Maks 1x</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded shrink-0">
                          Min: {item.syaratMinScore || 80}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Cakupan Rubrik Penilaian:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.rubrik.map((r, i) => (
                              <div key={i} className="text-[11px] font-medium bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800 px-2.5 py-1 rounded-lg flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold">{r.kriteria || r.namaKriteria}</span>
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">({r.bobotPersen}%)</span>
                                  {item.modePenilaian === 'PenguranganKesalahan' && r.poinPengurangan !== undefined && (
                                    <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 rounded px-1 ml-0.5">-{r.poinPengurangan}</span>
                                  )}
                                </div>
                                {r.categoryIds && r.categoryIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {r.categoryIds.map(catId => {
                                      const meta = getClassificationOrCategoryMeta(catId);
                                      return (
                                        <span key={catId} className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border ${
                                          meta.isUmum
                                            ? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                                            : meta.bgColor
                                        }`}>
                                          {meta.isUmum ? '📌 ' : '🏷️ '}{meta.nama} {meta.labelSingkat ? `(${meta.labelSingkat})` : ''}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {item.petunjukPelaksanaan && (
                          <div className="text-xs text-gray-500 max-h-16 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-100">
                            <strong>Instruksi penguji:</strong> {item.petunjukPelaksanaan}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplate(item);
                            const connectedIds = item.jenisAssessmentIds && item.jenisAssessmentIds.length > 0 
                              ? item.jenisAssessmentIds 
                              : (item.jenisAssessmentId ? [item.jenisAssessmentId] : []);

                            setTemplateForm({
                              namaTemplate: item.namaTemplate,
                              jenisAssessmentId: item.jenisAssessmentId || connectedIds[0] || '',
                              jenisAssessmentIds: connectedIds,
                              petunjukPelaksanaan: item.petunjukPelaksanaan || '',
                              petunjukPerJenis: item.petunjukPerJenis || {},
                              rubrik: (item.rubrik || []).map(r => ({
                                kriteria: r.kriteria || r.namaKriteria || '',
                                bobotPersen: r.bobotPersen || 0,
                                poinPengurangan: r.poinPengurangan,
                                categoryIds: r.categoryIds || []
                              })),
                              syaratMinScore: item.syaratMinScore || 80,
                              statusAktif: (item.statusAktif === true || item.statusAktif === StatusAktif.AKTIF || (item.statusAktif as any) === 'Aktif') ? StatusAktif.AKTIF : StatusAktif.NON_AKTIF,
                              modePenilaian: item.modePenilaian || 'Langsung',
                              oncePerSessionCategories: item.oncePerSessionCategories || ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar']
                            });
                            if (connectedIds.length > 0) {
                              setActivePetunjukJenisTab(connectedIds[0]);
                            }
                            setShowTemplateForm(true);
                          }}
                          className="text-[11px] text-gray-600 hover:text-emerald-700 transition-colors font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDelete({
                              type: 'template',
                              id: item.id,
                              title: item.namaTemplate,
                              desc: `Target: ${(item as any).targetMateri || item.namaJenisAssessment || '-'}`
                            });
                          }}
                          className="text-[11px] text-red-500 hover:text-red-700 transition-colors font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'dokumen' && (
          <motion.div
            key="dokumen-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Manajemen Template Dokumen &amp; Berita Acara
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Kelola dokumen resmi assessment. Setiap dokumen memiliki bagiannya sendiri beserta <strong className="text-emerald-700 dark:text-emerald-400">Penanda Peruntukan Dokumen</strong> (misal: Berita Acara, Transkrip, Sertifikat).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDocDisplayMode('tab')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${docDisplayMode === 'tab' ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'}`}
                  >
                    Tampilan Tab
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocDisplayMode('stacked')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${docDisplayMode === 'stacked' ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'}`}
                  >
                    Semua Bagian
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddDocTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Template
                </button>
              </div>
            </div>

            {/* Alert Messages */}
            {baSuccessMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  {baSuccessMsg}
                </div>
              </div>
            )}
            {baErrorMsg && (
              <div className="p-4 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                {baErrorMsg}
              </div>
            )}

            {/* Document Selection Tabs Grid (When in 'tab' mode) */}
            {docDisplayMode === 'tab' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {docTemplates.map(doc => {
                  const isActive = doc.id === activeDocId;
                  const getBadgeStyle = (pStr: string) => {
                    const norm = (pStr || '').toUpperCase();
                    if (norm.includes('BERITA ACARA')) return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300';
                    if (norm.includes('TRANSKRIP') || norm.includes('PENILAIAN')) return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300';
                    if (norm.includes('SERTIFIKAT') || norm.includes('SYAHADAH')) return 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300';
                    return 'bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300';
                  };

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                        isActive
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getBadgeStyle(doc.peruntukan)}`}>
                            🏷️ {doc.peruntukan || 'BERITA ACARA ASSESSMENT'}
                          </span>
                          {doc.isDefault && (
                            <span className="text-[9px] font-semibold text-gray-400 dark:text-slate-500 uppercase">
                              Standard
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 line-clamp-1">
                          {doc.judulDokumen}
                        </h3>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">
                          Format: {doc.nomorFormat || 'BA/ASS/2026/01'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800/80 pt-2 text-[10px]">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          {isActive ? '● Sedang Diedit' : 'Klik untuk Pilih'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDuplicateDocTemplate(doc.id); }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-500 hover:text-emerald-700"
                            title="Duplikat Template"
                          >
                            <Clipboard className="w-3.5 h-3.5" />
                          </button>
                          {docTemplates.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteDocTemplate(doc.id); }}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded text-red-500 hover:text-red-700"
                              title="Hapus Template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Render Document Editor + Preview Block(s) */}
            {docTemplates
              .filter(d => docDisplayMode === 'stacked' || d.id === activeDocId)
              .map(doc => {
                const getBadgeStyle = (pStr: string) => {
                  const norm = (pStr || '').toUpperCase();
                  if (norm.includes('BERITA ACARA')) return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300';
                  if (norm.includes('TRANSKRIP') || norm.includes('PENILAIAN')) return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300';
                  if (norm.includes('SERTIFIKAT') || norm.includes('SYAHADAH')) return 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300';
                  return 'bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300';
                };

                return (
                  <div key={doc.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-6">
                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-150 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${getBadgeStyle(doc.peruntukan)}`}>
                            🏷️ PERUNTUKAN DOKUMEN: {doc.peruntukan || 'BERITA ACARA ASSESSMENT'}
                          </span>
                          {doc.isDefault && (
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              Template Utama
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                          {doc.judulDokumen}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDuplicateDocTemplate(doc.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Clipboard className="w-3.5 h-3.5" /> Duplikat
                        </button>
                        {docTemplates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocTemplate(doc.id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Editor Form */}
                      <div className="lg:col-span-7 space-y-5">
                        {/* Block 1: Identification & Peruntukan Label */}
                        <div className="bg-gray-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-150 dark:border-slate-800 space-y-3">
                          <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                            1. Identitas &amp; Penanda Peruntukan Dokumen
                          </span>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                Judul Dokumen Official *
                              </label>
                              <input
                                type="text"
                                value={doc.judulDokumen}
                                onChange={(e) => updateDocField(doc.id, 'judulDokumen', e.target.value)}
                                placeholder="Misal: Berita Acara Assessment Kelulusan Santri"
                                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-slate-100"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                  Penanda Peruntukan Dokumen *
                                </label>
                                <select
                                  value={['BERITA ACARA ASSESSMENT', 'LEMBAR PENILAIAN & TRANSKRIP', 'SERTIFIKAT KELULUSAN', 'SURAT KETERANGAN EVALUASI', 'FORMULIR REMEDIAL / REVISI'].includes(doc.peruntukan) ? doc.peruntukan : 'KUSTOM'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val !== 'KUSTOM') {
                                      updateDocField(doc.id, 'peruntukan', val);
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-slate-100"
                                >
                                  <option value="BERITA ACARA ASSESSMENT">BERITA ACARA ASSESSMENT</option>
                                  <option value="LEMBAR PENILAIAN & TRANSKRIP">LEMBAR PENILAIAN &amp; TRANSKRIP</option>
                                  <option value="SERTIFIKAT KELULUSAN">SERTIFIKAT KELULUSAN</option>
                                  <option value="SURAT KETERANGAN EVALUASI">SURAT KETERANGAN EVALUASI</option>
                                  <option value="FORMULIR REMEDIAL / REVISI">FORMULIR REMEDIAL / REVISI</option>
                                  <option value="KUSTOM">-- KUSTOM (Ketik Sendiri) --</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                  Format Nomor Dokumen
                                </label>
                                <input
                                  type="text"
                                  value={doc.nomorFormat || ''}
                                  onChange={(e) => updateDocField(doc.id, 'nomorFormat', e.target.value)}
                                  placeholder="BA/ASS/2026/07/004"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            {/* If custom peruntukan */}
                            {!['BERITA ACARA ASSESSMENT', 'LEMBAR PENILAIAN & TRANSKRIP', 'SERTIFIKAT KELULUSAN', 'SURAT KETERANGAN EVALUASI', 'FORMULIR REMEDIAL / REVISI'].includes(doc.peruntukan) && (
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                  Teks Custom Penanda Peruntukan Dokumen
                                </label>
                                <input
                                  type="text"
                                  value={doc.peruntukan}
                                  onChange={(e) => updateDocField(doc.id, 'peruntukan', e.target.value.toUpperCase())}
                                  placeholder="Misal: SURAT REKOMENDASI BEASISWA"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Block 2: Kop Surat */}
                        <div className="bg-gray-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-150 dark:border-slate-800 space-y-3">
                          <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                            2. Konfigurasi Header &amp; Kop Surat
                          </span>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">Header Nama Yayasan / Instansi</label>
                              <input
                                type="text"
                                value={doc.namaYayasan}
                                onChange={(e) => updateDocField(doc.id, 'namaYayasan', e.target.value)}
                                placeholder="YAYASAN PONDOK PESANTREN INTEGRASI MODERN"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">Sub-header Panitia / Lembaga</label>
                                <input
                                  type="text"
                                  value={doc.namaPanitia}
                                  onChange={(e) => updateDocField(doc.id, 'namaPanitia', e.target.value)}
                                  placeholder="PANITIA ASSESSMENT & EVALUASI AKADEMIK"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">Alamat Kontak / Detail Footer Kop</label>
                                <input
                                  type="text"
                                  value={doc.alamatKontak}
                                  onChange={(e) => updateDocField(doc.id, 'alamatKontak', e.target.value)}
                                  placeholder="Jl. Raya Tahfidz Terpadu No. 12 • Telp: (031) 998822"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Block 3: Teks Isi & Kalimat Pengantar Berita Acara */}
                        <div className="bg-gray-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-150 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                              3. Teks Isi &amp; Kalimat Pengantar Berita Acara
                            </span>
                            <span className="text-[9px] text-gray-500 dark:text-slate-400 font-medium">
                              Kalimat Pembuka &amp; Penutup Otomatis
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[9px] font-bold text-gray-600 dark:text-slate-300 uppercase block">
                                  Kalimat Pengantar Pembuka Berita Acara
                                </label>
                                <span className="text-[8.5px] text-gray-400 dark:text-slate-500">
                                  Gunakan placeholder di bawah untuk nilai dinamis
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                value={doc.teksPengantar !== undefined ? doc.teksPengantar : 'Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT] oleh Tim Dewan Penguji terhadap santri di bawah ini dengan hasil rekapitulasi penilaian sebagai berikut:'}
                                onChange={(e) => updateDocField(doc.id, 'teksPengantar', e.target.value)}
                                placeholder="Contoh: Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT]..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-normal text-gray-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />

                              {/* Placeholders helper chip bar */}
                              <div className="mt-2 p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg space-y-1.5">
                                <span className="text-[8.5px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                                  Sisipkan Tag Variabel Dinamis (Klik untuk menyisipkan):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { tag: '[HARI]', label: 'Hari Ujian' },
                                    { tag: '[TANGGAL]', label: 'Tanggal Lengkap' },
                                    { tag: '[BULAN]', label: 'Bulan' },
                                    { tag: '[TAHUN]', label: 'Tahun' },
                                    { tag: '[NAMA_SANTRI]', label: 'Nama Santri' },
                                    { tag: '[NIS]', label: 'NIS Santri' },
                                    { tag: '[HALAQAH]', label: 'Halaqah' },
                                    { tag: '[MATERI]', label: 'Materi Uji' },
                                    { tag: '[TEMPAT]', label: 'Tempat / Instansi' },
                                    { tag: '[PENGUJI]', label: 'Penguji' }
                                  ].map((ph) => (
                                    <button
                                      key={ph.tag}
                                      type="button"
                                      onClick={() => {
                                        const currentVal = doc.teksPengantar !== undefined 
                                          ? doc.teksPengantar 
                                          : 'Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT] oleh Tim Dewan Penguji terhadap santri di bawah ini dengan hasil rekapitulasi penilaian sebagai berikut:';
                                        updateDocField(doc.id, 'teksPengantar', currentVal ? `${currentVal} ${ph.tag}` : ph.tag);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 rounded text-[9.5px] font-mono font-bold transition cursor-pointer"
                                      title={`Sisipkan ${ph.tag} (${ph.label})`}
                                    >
                                      <span>{ph.tag}</span>
                                      <span className="text-[8px] text-gray-400 dark:text-slate-500 font-sans font-normal">({ph.label})</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-gray-600 dark:text-slate-300 uppercase block mb-1">
                                Kalimat Penutup Berita Acara (Sebelum Tanda Tangan)
                              </label>
                              <input
                                type="text"
                                value={doc.teksPenutup !== undefined ? doc.teksPenutup : 'Demikian berita acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.'}
                                onChange={(e) => updateDocField(doc.id, 'teksPenutup', e.target.value)}
                                placeholder="Contoh: Demikian berita acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-normal text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <p className="text-[8.5px] text-gray-400 dark:text-slate-500 mt-1">
                                Dicetak tepat di atas blok tanda tangan penguji dan koordinator bidang.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Block 4: Signatories */}
                        <div className="bg-gray-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-150 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                              4. Pengaturan Pihak Penandatangan (Signatories)
                            </span>
                            <span className="text-[9px] text-gray-500 dark:text-slate-400 font-medium">
                              Format Resmi: Jabatan &amp; Nama Penanda Tangan
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800 space-y-2">
                              <span className="text-[9px] font-extrabold text-gray-700 dark:text-slate-300 uppercase block">Tanda Tangan 1 (Kiri): Penguji</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8.5px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">Jabatan (Atas)</label>
                                  <input
                                    type="text"
                                    value={doc.ttd1Jabatan || ''}
                                    onChange={(e) => updateDocField(doc.id, 'ttd1Jabatan', e.target.value)}
                                    placeholder="Contoh: PENGUJI"
                                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8.5px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">Nama Penanda Tangan (Bawah)</label>
                                  <input
                                    type="text"
                                    value={doc.ttd1Nama !== undefined ? doc.ttd1Nama : (doc.ttd1Sub || '')}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateDocField(doc.id, 'ttd1Nama', val);
                                      updateDocField(doc.id, 'ttd1Sub', val);
                                    }}
                                    placeholder="Contoh: Ustadz Ahmad, S.Pd"
                                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800 space-y-2">
                              <span className="text-[9px] font-extrabold text-gray-700 dark:text-slate-300 uppercase block">Tanda Tangan 2 (Kanan): Koordinator Bidang</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8.5px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">Jabatan (Atas)</label>
                                  <input
                                    type="text"
                                    value={doc.ttd2Jabatan || ''}
                                    onChange={(e) => updateDocField(doc.id, 'ttd2Jabatan', e.target.value)}
                                    placeholder="Contoh: KOORDINATOR BIDANG"
                                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8.5px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">Nama Penanda Tangan (Bawah)</label>
                                  <input
                                    type="text"
                                    value={doc.ttd2Nama || ''}
                                    onChange={(e) => {
                                      updateDocField(doc.id, 'ttd2Nama', e.target.value);
                                      updateDocField(doc.id, 'ttd2Sub', '');
                                    }}
                                    placeholder="Contoh: Koordinator Bidang"
                                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">Catatan Kaki / Keterangan Tambahan</label>
                              <input
                                type="text"
                                value={doc.catatanKaki || ''}
                                onChange={(e) => updateDocField(doc.id, 'catatanKaki', e.target.value)}
                                placeholder="Dokumen ini diterbitkan secara sah oleh Panitia Assessment Santri."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Print Preview */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-150 dark:border-slate-800">
                          <span className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 tracking-wider uppercase block mb-3">
                            Live Preview Dokumen (Kertas A4 Official)
                          </span>

                          <div className="p-5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md text-left space-y-4 select-none overflow-hidden rounded-lg relative">
                            {/* Header Tag Badge */}
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                              <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getBadgeStyle(doc.peruntukan)}`}>
                                🏷️ {doc.peruntukan || 'BERITA ACARA ASSESSMENT'}
                              </span>
                              <span className="text-[8px] font-mono font-bold text-gray-400 dark:text-slate-500">
                                PRINT PREVIEW
                              </span>
                            </div>

                            {/* Kop */}
                            <div className="text-center space-y-0.5 border-b-2 border-gray-800 dark:border-slate-400 pb-2.5">
                              <h2 className="text-[9.5px] font-extrabold tracking-wide text-gray-900 dark:text-slate-100 uppercase leading-snug">
                                {doc.namaYayasan || resolvedInstUpper}
                              </h2>
                              <h3 className="text-[8px] font-bold text-gray-800 dark:text-slate-300 uppercase leading-snug">
                                {doc.namaPanitia || 'PANITIA ASSESSMENT & EVALUASI AKADEMIK SANTRI'}
                              </h3>
                              <p className="text-[6px] text-gray-500 dark:text-slate-400 uppercase tracking-widest leading-snug">
                                {doc.alamatKontak || resolvedAlamatFallback}
                              </p>
                            </div>

                            {/* Title & Format */}
                            <div className="text-center space-y-0.5">
                              <h4 className="text-[8.5px] font-extrabold tracking-wider text-gray-900 dark:text-slate-100 uppercase border-b border-gray-300 dark:border-slate-700 inline-block pb-0.5">
                                {doc.judulDokumen || 'BERITA ACARA ASSESSMENT'}
                              </h4>
                              <p className="text-[6px] font-mono text-gray-400 dark:text-slate-500">
                                Nomor: {doc.nomorFormat || 'BA/ASS/2026/07/001'}
                              </p>
                            </div>

                            {/* Body Preview matching peruntukan */}
                            <div className="space-y-1.5 text-[6px] text-gray-600 dark:text-slate-300 leading-relaxed font-sans">
                              {doc.peruntukan.includes('BERITA ACARA') && (
                                <>
                                  <p className="leading-relaxed">
                                    {resolveAssessmentPlaceholders(
                                      doc.teksPengantar || 'Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT] oleh Tim Dewan Penguji terhadap santri di bawah ini dengan hasil rekapitulasi penilaian sebagai berikut:',
                                      {
                                        tanggalAssessment: '2026-07-22',
                                        siswaNama: 'Ahmad Fauzan (Sample)',
                                        halaqahNama: 'Sabtu Pagi (Sample)',
                                        namaAssessment: 'Juz 30 & Tajwid',
                                        ketuaPengujiNama: doc.ttd1Nama || 'Penguji Assessment'
                                      },
                                      doc
                                    )}
                                  </p>
                                  <div className="p-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-center">
                                    <span className="font-mono text-[5.5px] text-emerald-800 dark:text-emerald-400 font-bold">[ Rekapitulasi Nilai Akhir &amp; Keputusan Kelulusan ]</span>
                                  </div>
                                  {doc.teksPenutup && (
                                    <p className="text-[5.5px] text-gray-500 italic mt-1 leading-snug">
                                      {resolveAssessmentPlaceholders(
                                        doc.teksPenutup,
                                        {
                                          tanggalAssessment: '2026-07-22',
                                          siswaNama: 'Ahmad Fauzan (Sample)',
                                          halaqahNama: 'Sabtu Pagi (Sample)',
                                          namaAssessment: 'Juz 30 & Tajwid',
                                          ketuaPengujiNama: doc.ttd1Nama || 'Penguji Assessment'
                                        },
                                        doc
                                      )}
                                    </p>
                                  )}
                                </>
                              )}

                              {doc.peruntukan.includes('TRANSKRIP') && (
                                <>
                                  <p className="leading-relaxed">
                                    {resolveAssessmentPlaceholders(
                                      doc.teksPengantar || 'Berikut adalah rincian transkrip penilaian evaluasi pembelajaran santri berdasarkan kriteria rubrik:',
                                      {
                                        tanggalAssessment: '2026-07-22',
                                        siswaNama: 'Ahmad Fauzan (Sample)',
                                        halaqahNama: 'Sabtu Pagi (Sample)',
                                        namaAssessment: 'Juz 30 & Tajwid',
                                        ketuaPengujiNama: doc.ttd1Nama || 'Penguji Assessment'
                                      },
                                      doc
                                    )}
                                  </p>
                                  <div className="p-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded space-y-1">
                                    <div className="flex justify-between font-bold text-indigo-900 dark:text-indigo-300">
                                      <span>Makhraj &amp; Tajwid: 95</span>
                                      <span>Kelancaran: 90</span>
                                      <span>Fashohah: 92</span>
                                    </div>
                                    <div className="text-center text-[5.5px] text-indigo-700 dark:text-indigo-400 font-extrabold">Total Skor Akhir: 92.3 (Mumtaz)</div>
                                  </div>
                                  {doc.teksPenutup && (
                                    <p className="text-[5.5px] text-gray-500 italic mt-1 leading-snug">
                                      {resolveAssessmentPlaceholders(
                                        doc.teksPenutup,
                                        {
                                          tanggalAssessment: '2026-07-22',
                                          siswaNama: 'Ahmad Fauzan (Sample)',
                                          halaqahNama: 'Sabtu Pagi (Sample)',
                                          namaAssessment: 'Juz 30 & Tajwid',
                                          ketuaPengujiNama: doc.ttd1Nama || 'Penguji Assessment'
                                        },
                                        doc
                                      )}
                                    </p>
                                  )}
                                </>
                              )}

                              {doc.peruntukan.includes('SERTIFIKAT') && (
                                <div className="p-2 border-2 border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 rounded text-center space-y-1">
                                  <p className="text-[6.5px] font-serif font-bold text-amber-900 dark:text-amber-300">DIBERIKAN KEPADA SANTRI SEBAGAI TANDA KELULUSAN</p>
                                  <div className="text-[8px] font-extrabold text-gray-900 dark:text-slate-100">SANTRI TAHFIDZ UNGGULAN</div>
                                  <p className="text-[5.5px] text-amber-800 dark:text-amber-400">
                                    {resolveAssessmentPlaceholders(
                                      doc.teksPengantar || 'Dinyatakan LULUS Ujian Assessment Tahfidz dengan Predikat Mumtaz.',
                                      {
                                        tanggalAssessment: '2026-07-22',
                                        siswaNama: 'Ahmad Fauzan (Sample)',
                                        halaqahNama: 'Sabtu Pagi (Sample)',
                                        namaAssessment: 'Juz 30 & Tajwid',
                                        ketuaPengujiNama: doc.ttd1Nama || 'Penguji Assessment'
                                      },
                                      doc
                                    )}
                                  </p>
                                  {doc.teksPenutup && (
                                    <p className="text-[5px] text-amber-900/70 italic mt-0.5">
                                      {doc.teksPenutup}
                                    </p>
                                  )}
                                </div>
                              )}

                              {!doc.peruntukan.includes('BERITA ACARA') && !doc.peruntukan.includes('TRANSKRIP') && !doc.peruntukan.includes('SERTIFIKAT') && (
                                <>
                                  <p className="leading-relaxed">
                                    {resolveAssessmentPlaceholders(
                                      doc.teksPengantar || 'Dokumen ini menerangkan hasil evaluasi resmi santri berdasarkan ketentuan kurikulum dan keputusan tim pembimbing.',
                                      {
                                        tanggalAssessment: '2026-07-22',
                                        siswaNama: 'Ahmad Fauzan (Sample)',
                                        halaqahNama: 'Sabtu Pagi (Sample)',
                                        namaAssessment: 'Juz 30 & Tajwid',
                                        ketuaPengujiNama: doc.ttd1Nama || 'Penguji Assessment'
                                      },
                                      doc
                                    )}
                                  </p>
                                  {doc.teksPenutup && (
                                    <p className="text-[5.5px] text-gray-500 italic mt-1 leading-snug">
                                      {doc.teksPenutup}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-gray-200 dark:border-slate-800 text-center">
                              {/* Kolom 1: Penguji */}
                              <div className="flex flex-col justify-between items-center h-full min-h-[50px] space-y-1">
                                <p className="text-[5.5px] text-gray-500 dark:text-slate-400 uppercase font-extrabold tracking-wider leading-tight">
                                  {doc.ttd1Jabatan && !doc.ttd1Jabatan.toLowerCase().includes('penguji assessment') ? doc.ttd1Jabatan : 'PENGUJI'}
                                </p>
                                <div className="h-6 w-full flex items-center justify-center">
                                  {/* Ruang tanda tangan bersih tanpa teks pengganggu */}
                                </div>
                                <div className="w-full">
                                  <div className="w-20 h-px bg-gray-400 dark:bg-slate-600 mx-auto my-0.5" />
                                  <p className="text-[5.5px] font-bold text-gray-800 dark:text-slate-200 leading-tight">
                                    {doc.ttd1Nama && !doc.ttd1Nama.toLowerCase().includes('penguji') && !doc.ttd1Nama.toLowerCase().includes('asatidzah') && !isLegacyPersonalData(doc.ttd1Nama) ? doc.ttd1Nama : 'Penguji Assessment'}
                                  </p>
                                </div>
                              </div>

                              {/* Kolom 2: Koordinator */}
                              <div className="flex flex-col justify-between items-center h-full min-h-[50px] space-y-1">
                                <p className="text-[5.5px] text-gray-500 dark:text-slate-400 uppercase font-extrabold tracking-wider leading-tight">
                                  {doc.ttd2Jabatan && !doc.ttd2Jabatan.toLowerCase().includes('pimpinan pesantren') ? doc.ttd2Jabatan : 'KOORDINATOR BIDANG'}
                                </p>
                                <div className="h-6 w-full flex items-center justify-center">
                                  {/* Ruang tanda tangan bersih tanpa teks pengganggu */}
                                </div>
                                <div className="w-full">
                                  <div className="w-20 h-px bg-gray-400 dark:bg-slate-600 mx-auto my-0.5" />
                                  <p className="text-[5.5px] font-bold text-gray-800 dark:text-slate-200 leading-tight">
                                    {doc.ttd2Nama && !doc.ttd2Nama.toLowerCase().includes('pimpinan') && !doc.ttd2Nama.toLowerCase().includes('pengasuh') && !isLegacyPersonalData(doc.ttd2Nama) ? doc.ttd2Nama : 'Koordinator Bidang'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {doc.catatanKaki && (
                              <p className="text-[5px] text-gray-400 dark:text-slate-500 italic text-center pt-1 border-t border-dashed border-gray-150 dark:border-slate-800">
                                * {doc.catatanKaki}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Global Save / Reset Action Controls */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-slate-800 justify-end">
              <button
                type="button"
                onClick={handleResetDocTemplates}
                disabled={isSavingBa}
                className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Reset Seluruh Template ke Bawaan
              </button>

              <button
                type="button"
                onClick={handleSaveAllDocTemplates}
                disabled={isSavingBa}
                className="flex items-center justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingBa ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan Seluruh Template...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5 text-emerald-200" /> Simpan Seluruh Konfigurasi Template Dokumen
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Delete Modal Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {confirmDelete.type === 'reset_doc_templates'
                    ? 'Konfirmasi Reset Template Dokumen'
                    : confirmDelete.type === 'doc'
                    ? 'Konfirmasi Hapus Template Dokumen'
                    : confirmDelete.type === 'jenis'
                    ? 'Konfirmasi Hapus Jenis Assessment'
                    : 'Konfirmasi Hapus Template Assessment'}
                </h3>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-1">
                  "{confirmDelete.title}"
                </p>
                {confirmDelete.desc && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {confirmDelete.desc}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 italic">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeleting
                    ? 'Menghapus...'
                    : confirmDelete.type === 'reset_doc_templates'
                    ? 'Ya, Reset Standar'
                    : 'Ya, Hapus'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// EXECUTIVE & GRADING FLOW FOR GURUS
// ==========================================

export function PelaksanaanAssessment() {
  const { 
    siswas, 
    halaqahs, 
    gurus,
    jenisAssessments, 
    templateAssessments, 
    assessmentRecords, 
    createAssessmentRecord, 
    deleteAssessmentRecord,
    createSyahadah,
    syahadahs,
    currentSession,
    updateSiswa,
    pengajuanAssessments,
    createPengajuanAssessment,
    updatePengajuanAssessment,
    deletePengajuanAssessment,
    pwaSettings,
    docTemplates,
    selectedGuruHalaqahId,
    setSelectedGuruHalaqahId,
    guruSchedules = [],
    strukturLembaga,
    moduls = [],
    tajwidCategories = [],
    klasifikasiKesalahanTypes = []
  } = useApp();

  const primaryDocBA = useMemo(() => {
    return docTemplates?.find((d: any) => d.peruntukan === 'BERITA ACARA ASSESSMENT') || docTemplates?.[0];
  }, [docTemplates]);

  const resolvedInstNameBA1 = resolveYayasanDisplayName(strukturLembaga?.yayasan?.nama);
  const baNamaYayasan = (primaryDocBA?.namaYayasan && !isLegacyInstitutionBranding(primaryDocBA.namaYayasan))
    ? primaryDocBA.namaYayasan
    : ((pwaSettings?.baNamaYayasan && !isLegacyInstitutionBranding(pwaSettings.baNamaYayasan)) ? pwaSettings.baNamaYayasan : resolvedInstNameBA1.toUpperCase());
  const baNamaPanitia = primaryDocBA?.namaPanitia || pwaSettings?.baNamaPanitia || 'PANITIA ASSESSMENT & EVALUASI AKADEMIK SANTRI';
  const baAlamatKontak = (primaryDocBA?.alamatKontak && !isLegacyPersonalData(primaryDocBA.alamatKontak))
    ? primaryDocBA.alamatKontak
    : ((pwaSettings?.baAlamatKontak && !isLegacyPersonalData(pwaSettings.baAlamatKontak)) ? pwaSettings.baAlamatKontak : `Sekretariat ${resolvedInstNameBA1}`);
  const baJudulDokumen = primaryDocBA?.judulDokumen || 'BERITA ACARA ASSESSMENT & PENILAIAN HASIL UJIAN';

  const baTtd1Jabatan = primaryDocBA?.ttd1Jabatan || pwaSettings?.baTtd1Jabatan || 'PENGUJI';
  const baTtd1Nama = (primaryDocBA?.ttd1Nama && !isLegacyPersonalData(primaryDocBA.ttd1Nama))
    ? primaryDocBA.ttd1Nama
    : ((pwaSettings?.baTtd1Nama && !isLegacyPersonalData(pwaSettings.baTtd1Nama)) ? pwaSettings.baTtd1Nama : 'Penguji Assessment');
  const baTtd1Sub = baTtd1Nama;
  const baTtd2Jabatan = primaryDocBA?.ttd2Jabatan || pwaSettings?.baTtd2Jabatan || 'KOORDINATOR BIDANG';
  const baTtd2Nama = (primaryDocBA?.ttd2Nama && !isLegacyPersonalData(primaryDocBA.ttd2Nama))
    ? primaryDocBA.ttd2Nama
    : ((pwaSettings?.baTtd2Nama && !isLegacyPersonalData(pwaSettings.baTtd2Nama)) ? pwaSettings.baTtd2Nama : 'Koordinator Bidang');
  const baTtd2Sub = '';

  const [searchQuery, setSearchQuery] = useState('');
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [currentGradingPreviewPage, setCurrentGradingPreviewPage] = useState(0);
  const [viewingBeritaAcara, setViewingBeritaAcara] = useState<AssessmentRecord | null>(null);

  const handlePrintBeritaAcara = (rec: AssessmentRecord | null) => {
    if (!rec) {
      document.body.classList.add('is-printing-document');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('is-printing-document');
      }, 1000);
      return;
    }
    const originalTitle = document.title;
    const sanitizedSiswaNama = (rec.siswaNama || 'Santri').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    const docNumber = rec.id?.slice(0, 8).toUpperCase() || 'BA';
    document.title = `Berita_Acara_Assessment_${sanitizedSiswaNama}_${docNumber}`;

    document.body.classList.add('is-printing-document');
    window.print();

    setTimeout(() => {
      document.title = originalTitle;
      document.body.classList.remove('is-printing-document');
    }, 1000);
  };
  
  // New Proposal & Tab workflow states
  const [activeSubView, setActiveSubView] = useState<'pelaksanaan' | 'pengajuan'>('pelaksanaan');
  const [activePengajuan, setActivePengajuan] = useState<any | null>(null);
  const [isSubmittingPengajuan, setIsSubmittingPengajuan] = useState(false);
  const [filterMode, setFilterMode] = useState<'assigned' | 'all'>('assigned');
  
  // Proposal Form input states
  const [proposalStudentId, setProposalStudentId] = useState('');
  const [proposalJenisId, setProposalJenisId] = useState('');
  const [proposalTemplateId, setProposalTemplateId] = useState('');
  const [proposalTarget, setProposalTarget] = useState('Juz 30');
  const [proposalPengujiId, setProposalPengujiId] = useState('');
  const [proposalCatatan, setProposalCatatan] = useState('');

  // Grading target variables
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateAssessment | null>(null);
  const [selectedJenisId, setSelectedJenisId] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [catatanRekomendasi, setCatatanRekomendasi] = useState('');
  
  // Certificate issue configs
  const [shouldIssueSyahadah, setShouldIssueSyahadah] = useState(false);
  const [certificateNo, setCertificateNo] = useState('');

  // TEAM AND EXAMINER SYSTEM LOCAL STATES
  const [modelPengujian, setModelPengujian] = useState<'Tunggal' | 'Ganda' | 'Tim'>('Tunggal');
  const [selectedKetuaId, setSelectedKetuaId] = useState<string>('');
  const [selectedAnggotaIds, setSelectedAnggotaIds] = useState<string[]>([]);
  const [nilaiPenguji1, setNilaiPenguji1] = useState<number>(100);
  const [nilaiPenguji2, setNilaiPenguji2] = useState<number>(100);
  const [nilaiAkhirMethod, setNilaiAkhirMethod] = useState<'Rerata' | 'Ketua' | 'Musyawarah'>('Rerata');
  const [manualFinalScore, setManualFinalScore] = useState<number>(100);
  
  // Per examiner inputs for team-based examinations (key: guruId)
  const [nilaiPerPenguji, setNilaiPerPenguji] = useState<Record<string, number>>({});
  const [catatanPerPenguji, setCatatanPerPenguji] = useState<Record<string, string>>({});

  // Al-Qur'an specific local state variables
  const [siswaSelectedHalaman, setSiswaSelectedHalaman] = useState<number[]>([]);
  const [halamanInputSatu, setHalamanInputSatu] = useState<string>('');
  const [cuesTested, setCuesTested] = useState<string[]>([]);
  
  // Custom interactive simulator state
  const [tahfidzAcakQuestions, setTahfidzAcakQuestions] = useState<Array<{
    id: number;
    surah: string;
    ayat: number;
    prompt: string;
    keyAnswer?: string;
    rating?: 'lancar' | 'lupa' | 'salah';
  }>>([]);

  // Live Exam Interactive Mushaf states
  const [activeExamSurah, setActiveExamSurah] = useState<{ nama: string; no: number; ayat: number } | null>(null);
  const [examQuranZoom, setExamQuranZoom] = useState<number>(100);
  const [examQuranSelections, setExamQuranSelections] = useState<Array<{
    key: string;
    text: string;
    ayat: number;
    wIdx: number;
    isVerse: boolean;
  }>>([]);
  const selectedExamHighlightKeys = useMemo(() => examQuranSelections.map(s => s.key), [examQuranSelections]);
  const selectedExamHighlightTexts = useMemo(() => examQuranSelections.map(s => s.text), [examQuranSelections]);
  const [selectedExamCategory, setSelectedExamCategory] = useState<string>('Makhraj Huruf');
  const [selectedExamSubCategory, setSelectedExamSubCategory] = useState<string>('');
  const [showExamCategoryPicker, setShowExamCategoryPicker] = useState<boolean>(false);
  const [examCatatanText, setExamCatatanText] = useState<string>('');
  const [examSaveFeedback, setExamSaveFeedback] = useState<string>('');
  const [examInteractiveComments, setExamInteractiveComments] = useState<Array<{
    id: string;
    siswaId?: string;
    siswaNama?: string;
    siswaNis?: string;
    surahNama: string;
    target: string;
    targetKey: string;
    category: string;
    rubrikKriteria: string;
    comment: string;
    timestamp?: string;
  }>>([]);
  // Koreksi live sesi santri aktif saat ini (eksklusif per sesi santri yang diuji)
  const activeStudentComments = useMemo(() => {
    if (!selectedStudent) return [];
    return examInteractiveComments.filter(c => !c.siswaId || c.siswaId === selectedStudent.id);
  }, [examInteractiveComments, selectedStudent]);

  // Helper to resolve subcategories for any given category
  const resolveSubcategories = (catName: string, existingSubs?: any[]) => {
    if (existingSubs && existingSubs.length > 0) return existingSubs;
    const lw = (catName || '').toLowerCase().trim();
    for (const [key, subs] of Object.entries(TAJWID_PRESET_SUBCATEGORIES)) {
      if (lw.includes(key) || key.includes(lw)) {
        return subs;
      }
    }
    if (lw.includes('makhraj') || lw.includes('huruf')) {
      return [
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
        { id: 'ain', nama: 'ع (\'Ain)' },
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
    }
    return undefined;
  };

  // Dynamic error categories derived from Admin's Template Rubrik (Kategori Kesalahan Terhubung) - Clean text without emoji symbols
  const availableExamCategories = useMemo(() => {
    const categories: Array<{ name: string; color: string; subcategories?: any[] }> = [];
    const addedNames = new Set<string>();

    const getColor = (name: string, index: number) => {
      const n = name.toLowerCase();
      if (n.includes('makhraj') || n.includes('jaliy') || n.includes('salah huruf')) {
        return 'border-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:border-rose-800 text-rose-900 dark:text-rose-200';
      }
      if (n.includes('tajwid') || n.includes('khafiy') || n.includes('mad') || n.includes('ghunnah') || n.includes('idgham') || n.includes('ikhfa') || n.includes('sifat') || n.includes('izhar') || n.includes('iqlab')) {
        return 'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:border-amber-800 text-amber-900 dark:text-amber-200';
      }
      if (n.includes('harakat') || n.includes('sendat') || n.includes('waqaf') || n.includes('ibtida')) {
        return 'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:border-orange-800 text-orange-900 dark:text-orange-200';
      }
      if (n.includes('hafalan') || n.includes('lupa') || n.includes('terbaca')) {
        return 'border-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:border-purple-800 text-purple-900 dark:text-purple-200';
      }
      const palette = [
        'border-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:border-rose-800 text-rose-900 dark:text-rose-200',
        'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:border-amber-800 text-amber-900 dark:text-amber-200',
        'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:border-orange-800 text-orange-900 dark:text-orange-200',
        'border-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:border-purple-800 text-purple-900 dark:text-purple-200',
        'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
      ];
      return palette[index % palette.length];
    };

    if (selectedTemplate && selectedTemplate.rubrik && selectedTemplate.rubrik.length > 0) {
      selectedTemplate.rubrik.forEach((rub) => {
        if (rub.categoryIds && rub.categoryIds.length > 0) {
          rub.categoryIds.forEach((catId) => {
            if (catId === 'kriteria_umum' || catId === 'umum' || catId === 'non_kesalahan') return;

            const isKlasifikasi = (klasifikasiKesalahanTypes || []).some(
              k => k.id === catId || k.nama?.toLowerCase() === catId.toLowerCase()
            );
            if (isKlasifikasi) {
              const matchedCats = (tajwidCategories || []).filter(
                c => c.tipe === catId || (catId === 'lahn_jaliy' && c.tipe === 'dasar')
              );
              matchedCats.forEach(c => {
                const cName = c.nama;
                if (cName && !addedNames.has(cName.toLowerCase())) {
                  addedNames.add(cName.toLowerCase());
                  categories.push({
                    name: cName,
                    color: getColor(cName, categories.length),
                    subcategories: resolveSubcategories(cName, c.subcategories)
                  });
                }
              });
              return;
            }

            const foundCat = tajwidCategories.find(c => c.id === catId || c.nama === catId);
            const catName = foundCat ? foundCat.nama : catId;
            if (catName && !addedNames.has(catName.toLowerCase())) {
              addedNames.add(catName.toLowerCase());
              categories.push({
                name: catName,
                color: getColor(catName, categories.length),
                subcategories: resolveSubcategories(catName, foundCat?.subcategories)
              });
            }
          });
        }
      });
    }

    // Fallback if no categoryIds are linked in the template: use tajwidCategories or default list
    if (categories.length === 0) {
      if (tajwidCategories && tajwidCategories.length > 0) {
        tajwidCategories.forEach((cat) => {
          if (!addedNames.has(cat.nama.toLowerCase())) {
            addedNames.add(cat.nama.toLowerCase());
            categories.push({
              name: cat.nama,
              color: getColor(cat.nama, categories.length),
              subcategories: resolveSubcategories(cat.nama, cat.subcategories)
            });
          }
        });
      } else {
        const defaultCats = [
          'Makhraj Huruf',
          'Idgham Bighunnah',
          'Idgham Bilaghunnah',
          'Ikhfa Haqiqi',
          'Izhar Halqi',
          'Iqlab',
          'Qalqalah',
          'Ghunnah',
          'Mad Thabi\'i',
          'Salah Harakat',
          'Ayat Tersendat',
          'Lupa Hafalan'
        ];
        defaultCats.forEach((catName) => {
          if (!addedNames.has(catName.toLowerCase())) {
            addedNames.add(catName.toLowerCase());
            categories.push({
              name: catName,
              color: getColor(catName, categories.length),
              subcategories: resolveSubcategories(catName)
            });
          }
        });
      }
    }

    // Always append Catatan Khusus
    if (!addedNames.has('catatan khusus')) {
      categories.push({
        name: 'Catatan Khusus',
        color: 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200'
      });
    }

    return categories;
  }, [selectedTemplate, tajwidCategories]);

  useEffect(() => {
    if (availableExamCategories.length > 0) {
      const exists = availableExamCategories.some(c => c.name === selectedExamCategory);
      if (!exists) {
        setSelectedExamCategory(availableExamCategories[0].name);
        setSelectedExamSubCategory('');
      }
    }
  }, [availableExamCategories, selectedExamCategory]);

  // Multi-word and cross-verse selection handlers for Interactive Quran Preview
  const handleToggleExamWord = (surahName: string, ayatNum: number, wordIndex: number, wordText: string) => {
    const wordKey = `exam-quran-${surahName}-${ayatNum}-${wordIndex}`;
    setExamQuranSelections(prev => {
      const exists = prev.some(it => it.key === wordKey);
      let next: Array<{ key: string; text: string; ayat: number; wIdx: number; isVerse: boolean }>;
      if (exists) {
        next = prev.filter(it => it.key !== wordKey);
      } else {
        const filtered = prev.filter(it => !it.key.endsWith('-general'));
        next = [...filtered, { key: wordKey, text: wordText, ayat: ayatNum, wIdx: wordIndex, isVerse: false }];
      }
      // Chronological sort by Ayat then WordIndex to ensure authentic Quranic order (e.g. "لهبٍ وتب")
      next.sort((a, b) => {
        if (a.ayat !== b.ayat) return a.ayat - b.ayat;
        return a.wIdx - b.wIdx;
      });
      if (next.length === 0) {
        setShowExamCategoryPicker(false);
        setSelectedExamSubCategory('');
      }
      return next;
    });
    setExamCatatanText('');
    setSelectedExamSubCategory('');
  };

  const handleToggleExamVerse = (surahName: string, ayatNum: number) => {
    const verseKey = `exam-quran-${surahName}-${ayatNum}-verse`;
    setExamQuranSelections(prev => {
      const exists = prev.some(it => it.key === verseKey);
      let next: Array<{ key: string; text: string; ayat: number; wIdx: number; isVerse: boolean }>;
      if (exists) {
        next = prev.filter(it => it.key !== verseKey);
      } else {
        const filtered = prev.filter(it => !it.key.endsWith('-general'));
        next = [...filtered, { key: verseKey, text: `Ayat ${ayatNum}`, ayat: ayatNum, wIdx: -1, isVerse: true }];
      }
      next.sort((a, b) => {
        if (a.ayat !== b.ayat) return a.ayat - b.ayat;
        return a.wIdx - b.wIdx;
      });
      if (next.length === 0) {
        setShowExamCategoryPicker(false);
        setSelectedExamSubCategory('');
      }
      return next;
    });
    setExamCatatanText('');
    setSelectedExamSubCategory('');
  };

  const handleSelectGeneralSurah = (surahName: string) => {
    setExamQuranSelections([
      {
        key: `exam-quran-${surahName}-general`,
        text: `Surah ${surahName} (Umum)`,
        ayat: 0,
        wIdx: -1,
        isVerse: false
      }
    ]);
  };

  const clearExamSelection = () => {
    setExamQuranSelections([]);
    setShowExamCategoryPicker(false);
    setSelectedExamSubCategory('');
    setExamCatatanText('');
  };

  const currentTargetDisplay = useMemo(() => {
    if (examQuranSelections.length === 0) {
      return activeExamSurah ? `Surah ${activeExamSurah.nama} (Umum)` : 'Umum';
    }
    const isOnlyVerses = examQuranSelections.every(k => k.isVerse);
    if (isOnlyVerses) {
      const ayatNums = examQuranSelections.map(k => k.ayat);
      return `Surah ${activeExamSurah?.nama || ''} Ayat ${ayatNums.join(', ')}`;
    }
    // Multi-word span
    return `"${selectedExamHighlightTexts.join(' ')}" (Surah ${activeExamSurah?.nama || ''})`;
  }, [examQuranSelections, selectedExamHighlightTexts, activeExamSurah]);

  // Promosi integration
  const [isNaikJuz, setIsNaikJuz] = useState(false);
  const [isNaikLevel, setIsNaikLevel] = useState(false);
  const [isLayakMunaqasyah, setIsLayakMunaqasyah] = useState(false);
  
  const [targetJuzNaik, setTargetJuzNaik] = useState('Juz 30');
  const [targetLevelNaik, setTargetLevelNaik] = useState('Iqra Jilid 4');

  // Auto computations
  const effectiveJenisId = selectedJenisId || activePengajuan?.jenisAssessmentId || selectedTemplate?.jenisAssessmentIds?.[0] || selectedTemplate?.jenisAssessmentId || '';
  const activeCorrelatedJenis = selectedTemplate 
    ? (jenisAssessments.find(j => j.id === effectiveJenisId) || jenisAssessments.find(j => (selectedTemplate.jenisAssessmentIds || [selectedTemplate.jenisAssessmentId]).includes(j.id)) || null)
    : null;

  // ========================================================
  // ROLE DETECTION & EXAM PROCTORING CONFIGURATION
  // ========================================================
  const currentRole = currentSession.user?.role;
  const isGuru = currentRole === UserRole.GURU;
  const isAdmin = currentRole === UserRole.ADMIN;
  const isSiswa = currentRole === UserRole.SISWA;

  // Proteksi Sistem & Integritas Ujian (Wajib Layar Penuh) HANYA untuk Siswa/Santri.
  // Akun Guru / Penguji / Penilai / Admin bebas dari restriksi ini karena Guru bertindak sebagai penilai tugas santri.
  const requireFullscreen = isSiswa;

  // ========================================================
  // FULLSCREEN API INTEGRATION & EXAM PROCTORING HANDLERS
  // ========================================================
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);

  const enterFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).mozRequestFullScreen) {
        await (docEl as any).mozRequestFullScreen();
      } else if ((docEl as any).msRequestFullscreen) {
        await (docEl as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setHasEnteredFullscreen(true);
      setShowFullscreenWarning(false);
    } catch (err) {
      console.warn('Fullscreen request failed or restricted:', err);
      // Ensure test unlocks even if browser iframe limits direct Fullscreen API
      setIsFullscreen(true);
      setHasEnteredFullscreen(true);
      setShowFullscreenWarning(false);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  };

  // Fullscreen change detection listener (hanya untuk siswa/santri jika requireFullscreen aktif)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      // Detect if user exits fullscreen during active exam session (hanya untuk siswa/santri)
      if (requireFullscreen && showGradingModal && hasEnteredFullscreen && !isCurrentlyFullscreen) {
        setFullscreenExitCount(prev => prev + 1);
        setShowFullscreenWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [showGradingModal, hasEnteredFullscreen, requireFullscreen]);
  const minimalPassingScore = selectedTemplate ? (selectedTemplate.syaratMinScore || 80) : 80;
  const effectivePetunjuk = (selectedTemplate?.petunjukPerJenis && effectiveJenisId && selectedTemplate.petunjukPerJenis[effectiveJenisId])
    || selectedTemplate?.petunjukPelaksanaan
    || 'Harap pilih salah satu template kriteria penilaian di atas.';

  const isInternalQuranExam = selectedTemplate && (
    (activeCorrelatedJenis?.sumberAssessment === 'internal' && activeCorrelatedJenis?.modulInternalOption === 'AL_QURAN') ||
    selectedTemplate.namaTemplate.toLowerCase().includes("qur'an") ||
    selectedTemplate.namaTemplate.toLowerCase().includes('tahfidz') ||
    selectedTemplate.namaTemplate.toLowerCase().includes('tilawah') ||
    selectedTemplate.namaTemplate.toLowerCase().includes('juz') ||
    selectedTemplate.namaTemplate.toLowerCase().includes('tasmi') ||
    activeCorrelatedJenis?.kategori === KategoriAssessment.TAHFIDZ ||
    activeCorrelatedJenis?.kategori === KategoriAssessment.TILAWAH
  );

  const multiSuratStart = activeCorrelatedJenis?.quranRentangSuratStart || activeCorrelatedJenis?.quranTahfidzRentangSuratStart || selectedTemplate?.quranRentangSuratStart || selectedTemplate?.quranTahfidzRentangSuratStart || '';
  const multiSuratEnd = activeCorrelatedJenis?.quranRentangSuratEnd || activeCorrelatedJenis?.quranTahfidzRentangSuratEnd || selectedTemplate?.quranRentangSuratEnd || selectedTemplate?.quranTahfidzRentangSuratEnd || '';
  const singleSurat = activeCorrelatedJenis?.quranSurat || selectedTemplate?.quranSurat || '';
  const customSurahNames: string[] = activeCorrelatedJenis?.quranSelectedSurahs || selectedTemplate?.quranSelectedSurahs || [];
  const quranMode = activeCorrelatedJenis?.quranSuratMode || selectedTemplate?.quranSuratMode || ((customSurahNames.length > 0) ? 'kustom' : (multiSuratStart && multiSuratEnd) ? 'rentang' : singleSurat ? 'single' : 'semua');

  const activeSurahList = useMemo(() => {
    const normalize = (str: string) => str.toLowerCase().replace(/['"’`-]/g, '').trim();

    // 1. Kustom / Multi-Surah Terpilih (e.g. Qiraah-Wajib tidak berurut)
    if ((quranMode === 'kustom' || customSurahNames.length > 0) && customSurahNames.length > 0) {
      const list: typeof QURAN_SURAHS = [];
      customSurahNames.forEach(name => {
        const found = QURAN_SURAHS.find(s => normalize(s.nama) === normalize(name));
        if (found && !list.some(item => item.no === found.no)) {
          list.push(found);
        }
      });
      if (list.length > 0) return list;
    }

    // 2. Rentang Berurutan (Start s/d End)
    if (multiSuratStart && multiSuratEnd && quranMode !== 'single') {
      const s1 = QURAN_SURAHS.find(s => normalize(s.nama) === normalize(multiSuratStart));
      const s2 = QURAN_SURAHS.find(s => normalize(s.nama) === normalize(multiSuratEnd));
      if (s1 && s2) {
        const minNo = Math.min(s1.no, s2.no);
        const maxNo = Math.max(s1.no, s2.no);
        return QURAN_SURAHS.filter(s => s.no >= minNo && s.no <= maxNo);
      }
    }

    // 3. Single Surat
    if (singleSurat) {
      const found = QURAN_SURAHS.find(s => normalize(s.nama) === normalize(singleSurat));
      if (found) return [found];
    }

    return [];
  }, [multiSuratStart, multiSuratEnd, singleSurat, customSurahNames, quranMode]);

  const templateKategori = activeCorrelatedJenis?.kategori || '';
  
  const filteredExaminers = gurus.filter(g => {
    // Must contain 'Penguji Assessment' role
    const hasRole = g.peranGuru && g.peranGuru.includes('Penguji Assessment');
    if (!hasRole) return false;
    
    // Competency filter based on category
    if (templateKategori === KategoriAssessment.TAHFIDZ) {
      return g.kompetensiGuru && g.kompetensiGuru.includes('Tahfidz');
    }
    if (templateKategori === KategoriAssessment.TILAWAH) {
      return g.kompetensiGuru && g.kompetensiGuru.includes('Tilawah');
    }
    
    return true;
  });

  const handleMistakeChange = (kriteria: string, valStr: string, bobot: number, poinPengurangan: number) => {
    const cleanStr = valStr.replace(/[^0-9]/g, '');
    const val = cleanStr === '' ? 0 : Math.max(0, parseInt(cleanStr, 10));
    
    setMistakes(prev => ({
      ...prev,
      [kriteria]: val
    }));
    
    // Nilai terisi otomatis mulai dari 100 untuk semua Kriteria berkurang otomatis berdasarkan koreksi
    const rawScore = bobot > 0 
      ? ((bobot - (val * poinPengurangan)) / bobot) * 100 
      : Math.max(0, 100 - (val * poinPengurangan));
    const boundedScore = Math.max(0, Math.min(100, rawScore));
    // Bulatkan ke atas menjadi kelipatan 0.5 (contoh 83.33 -> 83.5)
    const roundedScore = Math.ceil(boundedScore * 2) / 2;
    
    setScores(prevScores => ({
      ...prevScores,
      [kriteria]: roundedScore
    }));
  };

  const handleManualScoreBlur = (kriteria: string, val: any) => {
    let num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (isNaN(num)) num = 100;
    const bounded = Math.max(0, Math.min(100, num));
    // Bulatkan ke atas ke kelipatan 0.5 jika ada desimal (misal 83.33 -> 83.5)
    const rounded = Math.ceil(bounded * 2) / 2;
    setScores(prev => ({ ...prev, [kriteria]: rounded }));
  };

  const applyExamQuranError = (
    surahNama: string,
    targetLabel: string,
    targetKey: string,
    categoryName: string,
    commentText: string
  ) => {
    const currentStudentId = selectedStudent?.id || 'umum';
    const currentStudentNama = selectedStudent?.namaLengkap || 'Peserta Ujian';
    const currentStudentNis = selectedStudent?.nis || '';
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (!selectedTemplate || !selectedTemplate.rubrik || selectedTemplate.rubrik.length === 0) {
      const newComment = {
        id: `err-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
        siswaId: currentStudentId,
        siswaNama: currentStudentNama,
        siswaNis: currentStudentNis,
        surahNama,
        target: targetLabel,
        targetKey,
        category: categoryName,
        rubrikKriteria: 'Umum',
        comment: commentText,
        timestamp: timeNow
      };
      setExamInteractiveComments(prev => [...prev, newComment]);
      setCuesTested(prev => [...prev, `[${currentStudentNama}] ${surahNama} (${targetLabel}): ${commentText}`]);
      return;
    }

    const rubrikList: any[] = (selectedTemplate as any).rubrikNilai || (selectedTemplate as any).rubrik || [];
    let targetRubrik = mapErrorCategoryToRubrikCriterion(categoryName, rubrikList, tajwidCategories, klasifikasiKesalahanTypes);
    if (!targetRubrik) {
      targetRubrik = rubrikList[0];
    }

    const kriteria = targetRubrik?.kriteria || targetRubrik?.namaKriteria || 'Tajwid & Makhraj';

    // Cek apakah kategori ini diatur sebagai "Maks 1x Potong per Sesi Ujian"
    const templateOnceCategories: string[] = selectedTemplate?.oncePerSessionCategories || (targetRubrik as any)?.oncePerSessionCategories || [];
    const isCategoryOncePolicy = (searchCat: string): boolean => {
      if (!templateOnceCategories || templateOnceCategories.length === 0) return false;
      const cleanSearch = searchCat.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return templateOnceCategories.some(c => {
        const cleanC = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanC === cleanSearch || cleanSearch.includes(cleanC) || cleanC.includes(cleanSearch);
      });
    };

    const isOncePolicy = isCategoryOncePolicy(categoryName);
    const existingCommentsForStudent = examInteractiveComments.filter(c => 
      !c.siswaId || (selectedStudent && c.siswaId === selectedStudent.id)
    );

    // Cek apakah kategori ini sudah pernah dikenakan pemotongan pada santri aktif saat ini
    let isAlreadyCharged = false;
    if (isOncePolicy) {
      isAlreadyCharged = existingCommentsForStudent.some(c => {
        if (!c.category) return false;
        const sameCategory = c.category.trim().toLowerCase() === categoryName.trim().toLowerCase();
        if (!sameCategory) return false;

        const isMakhraj = isMakhrajOrHijaiyahCategory(categoryName);
        if (isMakhraj) {
          // Jika makhraj / huruf hijaiyah, potong 1x per huruf/target yang sama
          return c.target === targetLabel || c.comment === commentText || c.targetKey === targetKey || c.category === categoryName;
        }
        return true;
      });
    }

    const currentMistakeCount = mistakes[kriteria] !== undefined ? mistakes[kriteria] : 0;
    const basePoinDeduction = targetRubrik?.poinPengurangan !== undefined ? targetRubrik.poinPengurangan : ((targetRubrik as any)?.poinPengurangan !== undefined ? (targetRubrik as any).poinPengurangan : 5);

    if (!isAlreadyCharged) {
      // Increment mistake and recalculate rubric score jika belum pernah dipotong
      const newMistakeCount = currentMistakeCount + 1;
      handleMistakeChange(kriteria, newMistakeCount.toString(), targetRubrik?.bobotPersen || 30, basePoinDeduction);
      if (isOncePolicy) {
        setExamSaveFeedback(`Koreksi "${categoryName}" dicatat (-${basePoinDeduction} pt, aturan Maks 1x Potong sesi aktif).`);
      }
    } else {
      setExamSaveFeedback(`Catatan "${categoryName}" tercatat (kebijakan Maks 1x: poin tidak dipotong ulang karena sudah pernah tercatat pada sesi ini).`);
    }

    const newComment = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
      siswaId: currentStudentId,
      siswaNama: currentStudentNama,
      siswaNis: currentStudentNis,
      surahNama,
      target: targetLabel,
      targetKey,
      category: categoryName,
      rubrikKriteria: kriteria,
      comment: commentText,
      timestamp: timeNow,
      isDuplicateCharge: isAlreadyCharged,
      isOnceCategory: isOncePolicy
    };
    setExamInteractiveComments(prev => [...prev, newComment]);

    const summaryStr = `[${currentStudentNama}] Surah ${surahNama} (${targetLabel}) - ${categoryName}: ${commentText}`;
    if (!cuesTested.includes(summaryStr)) {
      setCuesTested(prev => [...prev, summaryStr]);
    }
  };

  const removeExamQuranError = (commentId: string) => {
    const item = examInteractiveComments.find(c => c.id === commentId);
    if (item && selectedTemplate) {
      // Hanya kurangi kesalahan di rubrik aktif jika komentar milik santri yang sedang aktif diuji
      if (!item.siswaId || (selectedStudent && item.siswaId === selectedStudent.id)) {
        const kriteria = item.rubrikKriteria;
        const targetRubrik = selectedTemplate.rubrik.find(r => r.kriteria === kriteria);
        if (targetRubrik) {
          const currentMistakeCount = mistakes[kriteria] !== undefined ? mistakes[kriteria] : 0;
          const basePoinDeduction = targetRubrik.poinPengurangan !== undefined ? targetRubrik.poinPengurangan : 5;

          if ((item as any).isDuplicateCharge) {
            // Komentar ini tidak menyebabkan potongan nilai saat dicatat, tidak perlu ubah skor
          } else {
            const isOncePolicy = (item as any).isOnceCategory;
            const otherSameCat = examInteractiveComments.filter(c =>
              c.id !== commentId &&
              (!c.siswaId || (selectedStudent && c.siswaId === selectedStudent.id)) &&
              c.category === item.category
            );
            if (isOncePolicy && otherSameCat.length > 0) {
              // Masih ada catatan lain pada kategori 1x ini, alihkan charged status ke catatan berikutnya
              const nextCharged = otherSameCat[0];
              (nextCharged as any).isDuplicateCharge = false;
            } else {
              const newMistakeCount = Math.max(0, currentMistakeCount - 1);
              handleMistakeChange(kriteria, newMistakeCount.toString(), targetRubrik.bobotPersen, basePoinDeduction);
            }
          }
        }
      }
    }
    setExamInteractiveComments(prev => prev.filter(c => c.id !== commentId));
  };

  const [confirmDeleteLiveNotes, setConfirmDeleteLiveNotes] = useState<{
    id: string;
    title: string;
    desc?: string;
  } | null>(null);

  const removeStudentQuranErrors = (targetSiswaId?: string, targetSiswaNama?: string) => {
    const sNama = targetSiswaNama || selectedStudent?.namaLengkap || 'Santri';
    const sId = targetSiswaId || selectedStudent?.id || 'umum';
    setConfirmDeleteLiveNotes({
      id: sId,
      title: `Reset Koreksi Live (${sNama})`,
      desc: `Apakah Anda yakin ingin menghapus seluruh catatan koreksi live untuk ${sNama}? Catatan kesalahan dan rubrik nilai santri ini pada sesi ini akan disetel ulang.`
    });
  };

  const executeDeleteLiveNotes = () => {
    if (!confirmDeleteLiveNotes) return;
    if (selectedTemplate) {
      const rubrikList: any[] = (selectedTemplate as any).rubrikNilai || (selectedTemplate as any).rubrik || [];
      const resetMistakes: Record<string, number> = {};
      const resetScores: Record<string, number> = {};
      rubrikList.forEach(r => {
        const k = r.namaKriteria || r.kriteria;
        resetMistakes[k] = 0;
        resetScores[k] = 100;
      });
      setMistakes(resetMistakes);
      setScores(resetScores);
    }
    setExamInteractiveComments([]);
    setExamQuranSelections([]);
    setExamCatatanText('');
    setConfirmDeleteLiveNotes(null);
  };

  const calculateFinalWeightedScore = () => {
    if (modelPengujian === 'Tunggal') {
      if (!selectedTemplate) return 0;
      let total = 0;
      selectedTemplate.rubrik.forEach(rub => {
        const criteriaScore = scores[rub.kriteria] !== undefined ? scores[rub.kriteria] : (scores[(rub as any).namaKriteria] !== undefined ? scores[(rub as any).namaKriteria] : 100);
        total += (criteriaScore * rub.bobotPersen) / 100;
      });
      return Math.round(total * 10) / 10;
    } else if (modelPengujian === 'Ganda') {
      if (nilaiAkhirMethod === 'Rerata') {
        return Math.round(((nilaiPenguji1 + nilaiPenguji2) / 2) * 10) / 10;
      } else if (nilaiAkhirMethod === 'Ketua') {
        return nilaiPenguji1;
      } else {
        return manualFinalScore;
      }
    } else { // Tim
      if (nilaiAkhirMethod === 'Rerata') {
        const allScorers = [selectedKetuaId, ...selectedAnggotaIds].filter(Boolean);
        if (allScorers.length === 0) return 0;
        const sum = allScorers.reduce((acc, gid) => acc + (nilaiPerPenguji[gid] !== undefined ? nilaiPerPenguji[gid] : 100), 0);
        return Math.round((sum / allScorers.length) * 10) / 10;
      } else if (nilaiAkhirMethod === 'Ketua') {
        return selectedKetuaId ? (nilaiPerPenguji[selectedKetuaId] !== undefined ? nilaiPerPenguji[selectedKetuaId] : 100) : 100;
      } else {
        return manualFinalScore;
      }
    }
  };

  const finalScore = calculateFinalWeightedScore();
  const isCandidatePassed = finalScore >= minimalPassingScore;

  // Handler pergantian santri: bersihkan total riwayat koreksi sesi sebelumnya
  const handleSelectStudentForExam = (newStudent: any | null) => {
    if (!newStudent) {
      setSelectedStudent(null);
      setExamInteractiveComments([]);
      setExamQuranSelections([]);
      setExamCatatanText('');
      setExamSaveFeedback('');
      setShowExamCategoryPicker(false);
      setSelectedExamSubCategory('');
      setCuesTested([]);
      setTahfidzAcakQuestions([]);
      setSiswaSelectedHalaman([]);
      setHalamanInputSatu('');
      setCatatanRekomendasi('');
      return;
    }

    // Set santri baru dan bersihkan total seluruh live corrections & seleksi dari santri sebelumnya
    setSelectedStudent(newStudent);
    setExamInteractiveComments([]);
    setExamQuranSelections([]);
    setExamCatatanText('');
    setExamSaveFeedback('');
    setShowExamCategoryPicker(false);
    setSelectedExamSubCategory('');
    setCuesTested([]);
    setTahfidzAcakQuestions([]);
    setSiswaSelectedHalaman([]);
    setHalamanInputSatu('');
    setCatatanRekomendasi('');

    const currentJuzStr = String(newStudent.currentJuz || (newStudent as any).juz || '30');
    const cleanJuzNum = parseInt(currentJuzStr.replace(/\D/g, '')) || 30;
    const proposedNextJuzNum = cleanJuzNum < 30 ? cleanJuzNum + 1 : 30;
    setTargetJuzNaik(`Juz ${proposedNextJuzNum}`);

    const currentLvlStr = String((newStudent as any).currentLevel || (newStudent as any).jilid || 'Jilid 3');
    setTargetLevelNaik(currentLvlStr);

    // Setel ulang rubrik nilai dan kesalahan santri ke awal (100 / 0)
    if (selectedTemplate) {
      const initialScores: Record<string, number> = {};
      const initialMistakes: Record<string, number> = {};
      const tplRubrik = (selectedTemplate as any).rubrikNilai || (selectedTemplate as any).rubrik || [];
      tplRubrik.forEach((r: any) => {
        const kriteriaKey = r.namaKriteria || r.kriteria || 'Kriteria';
        initialScores[kriteriaKey] = 100;
        if (r.kriteria) initialScores[r.kriteria] = 100;
        if (r.namaKriteria) initialScores[r.namaKriteria] = 100;
        if (selectedTemplate.modePenilaian === 'PenguranganKesalahan') {
          initialMistakes[kriteriaKey] = 0;
          if (r.kriteria) initialMistakes[r.kriteria] = 0;
          if (r.namaKriteria) initialMistakes[r.namaKriteria] = 0;
        }
      });
      setScores(initialScores);
      setMistakes(initialMistakes);
    } else {
      setScores({});
      setMistakes({});
    }
  };

  // Handler pengulangan penilaian untuk santri yang sama (reset total sesi aktif)
  const handleResetOrRepeatExam = () => {
    if (!selectedStudent) return;
    
    // Reset sesi koreksi live dan nilai santri saat mengulang penilaian
    setExamInteractiveComments([]);
    setExamQuranSelections([]);
    setExamCatatanText('');
    setShowExamCategoryPicker(false);
    setSelectedExamSubCategory('');
    setCuesTested([]);
    setTahfidzAcakQuestions([]);
    setSiswaSelectedHalaman([]);
    setHalamanInputSatu('');
    setCatatanRekomendasi('');
    setShouldIssueSyahadah(false);

    if (selectedTemplate) {
      const initialScores: Record<string, number> = {};
      const initialMistakes: Record<string, number> = {};
      const tplRubrik = (selectedTemplate as any).rubrikNilai || (selectedTemplate as any).rubrik || [];
      tplRubrik.forEach((r: any) => {
        const kriteriaKey = r.namaKriteria || r.kriteria || 'Kriteria';
        initialScores[kriteriaKey] = 100;
        if (r.kriteria) initialScores[r.kriteria] = 100;
        if (r.namaKriteria) initialScores[r.namaKriteria] = 100;
        if (selectedTemplate.modePenilaian === 'PenguranganKesalahan') {
          initialMistakes[kriteriaKey] = 0;
          if (r.kriteria) initialMistakes[r.kriteria] = 0;
          if (r.namaKriteria) initialMistakes[r.namaKriteria] = 0;
        }
      });
      setScores(initialScores);
      setMistakes(initialMistakes);
    } else {
      setScores({});
      setMistakes({});
    }

    setExamSaveFeedback(`Sesi ujian santri "${selectedStudent.namaLengkap}" berhasil diulang dan dibersihkan dari awal.`);
    setTimeout(() => setExamSaveFeedback(''), 4000);
  };

  const handleStartExam = (student: any) => {
    setSelectedStudent(student);
    setSelectedTemplate(null);
    setScores({});
    setMistakes({});
    setCatatanRekomendasi('');
    setShouldIssueSyahadah(false);
    
    // Reset Team-examiner states
    setModelPengujian('Tunggal');
    setSelectedKetuaId('');
    setSelectedAnggotaIds([]);
    setNilaiPenguji1(100);
    setNilaiPenguji2(100);
    setNilaiAkhirMethod('Rerata');
    setManualFinalScore(100);
    setNilaiPerPenguji({});
    setCatatanPerPenguji({});

    // Reset Quran states & Live interactive correction session
    setExamInteractiveComments([]);
    setExamQuranSelections([]);
    setExamCatatanText('');
    setExamSaveFeedback('');
    setShowExamCategoryPicker(false);
    setSelectedExamSubCategory('');
    setSiswaSelectedHalaman([]);
    setHalamanInputSatu('');
    setCuesTested([]);
    setTahfidzAcakQuestions([]);
    setIsNaikJuz(false);
    setIsNaikLevel(false);
    setIsLayakMunaqasyah(false);

    // Initialise promotion defaults based on current student data
    if (student) {
      const currentJuzStr = student.currentJuz || (student as any).juz || '30';
      const cleanJuzNum = parseInt(currentJuzStr.replace(/\D/g, '')) || 30;
      const proposedNextJuzNum = cleanJuzNum < 30 ? cleanJuzNum + 1 : 30;
      setTargetJuzNaik(`Juz ${proposedNextJuzNum}`);

      const currentLvlStr = (student as any).currentLevel || (student as any).jilid || 'Jilid 3';
      setTargetLevelNaik(currentLvlStr);
    }
    
    // Generate standard serial reference
    const timestamp = Date.now().toString().slice(-6);
    setCertificateNo(`SYH/MH/${new Date().getFullYear()}/${timestamp}`);

    // Pick first available template as default
    if (templateAssessments.length > 0) {
      const defaultTpl = templateAssessments[0];
      setSelectedTemplate(defaultTpl);
      const connectedIds = defaultTpl.jenisAssessmentIds || (defaultTpl.jenisAssessmentId ? [defaultTpl.jenisAssessmentId] : []);
      setSelectedJenisId(connectedIds[0] || '');
      const initialScores: Record<string, number> = {};
      const initialMistakes: Record<string, number> = {};
      defaultTpl.rubrik.forEach(r => { 
        initialScores[r.kriteria] = 100;
        if ((r as any).namaKriteria) initialScores[(r as any).namaKriteria] = 100;
        if (defaultTpl.modePenilaian === 'PenguranganKesalahan') {
          initialMistakes[r.kriteria] = 0;
          if ((r as any).namaKriteria) initialMistakes[(r as any).namaKriteria] = 0;
        }
      });
      setScores(initialScores);
      setMistakes(initialMistakes);
      if (defaultTpl.modelPengujian) {
        setModelPengujian(defaultTpl.modelPengujian);
      }
    }
    setShowGradingModal(true);
  };

  const handleTemplateSelectionChanges = (tplId: string) => {
    const found = templateAssessments.find(t => t.id === tplId);
    if (!found) return;
    setSelectedTemplate(found);
    const connectedIds = found.jenisAssessmentIds || (found.jenisAssessmentId ? [found.jenisAssessmentId] : []);
    if (!selectedJenisId || !connectedIds.includes(selectedJenisId)) {
      setSelectedJenisId(connectedIds[0] || '');
    }
    const initialScores: Record<string, number> = {};
    const initialMistakes: Record<string, number> = {};
    found.rubrik.forEach(r => { 
      initialScores[r.kriteria] = 100;
      if ((r as any).namaKriteria) initialScores[(r as any).namaKriteria] = 100;
      if (found.modePenilaian === 'PenguranganKesalahan') {
        initialMistakes[r.kriteria] = 0;
        if ((r as any).namaKriteria) initialMistakes[(r as any).namaKriteria] = 0;
      }
    });
    setScores(initialScores);
    setMistakes(initialMistakes);
    
    if (found.modelPengujian) {
      setModelPengujian(found.modelPengujian);
    } else {
      // Intelligent auto-detection of pengujian model fallback
      const nameLw = found.namaTemplate.toLowerCase();
      if (nameLw.includes('munaqasyah') || nameLw.includes('syahadah') || nameLw.includes('wisuda')) {
        setModelPengujian('Tim');
      } else if (nameLw.includes('tasmi') || nameLw.includes('tahfidz')) {
        setModelPengujian('Ganda');
      } else {
        setModelPengujian('Tunggal');
      }
    }
  };

  const handleSaveGradesAndSyahadahSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Harap pilih santri yang akan diuji terlebih dahulu!');
      return;
    }
    if (!selectedTemplate) {
      alert('Harap pilih template kriteria ujian terlebih dahulu!');
      return;
    }

    const teacherName = currentSession.user ? currentSession.user.namaLengkap : 'Ustadz Muhammad';
    const teacherId = currentSession.user ? currentSession.user.id : 'gru-1';

    // 1. Save Assessment Record
    const passingMinScore = (selectedTemplate as any).syaratMinScore || (selectedTemplate as any).passingGrade || 75;
    const rubrikList = selectedTemplate.rubrikNilai || (selectedTemplate as any).rubrik || [];
    const rubrikResultMapped = rubrikList.map((r: any) => ({
      namaKriteria: r.namaKriteria || r.kriteria || 'Kriteria',
      bobotPersen: r.bobotPersen || 0,
      nilaiInput: scores[r.namaKriteria || r.kriteria] || 0,
      jumlahKesalahan: selectedTemplate.modePenilaian === 'PenguranganKesalahan' ? (mistakes[r.namaKriteria || r.kriteria] ?? 0) : undefined,
      poinPengurangan: selectedTemplate.modePenilaian === 'PenguranganKesalahan' ? (r.poinPengurangan ?? 5) : undefined
    }));

    // Status mapping based on percentage passes
    let statusText: 'Lulus' | 'Lulus Bersyarat' | 'Perlu Perbaikan' | 'Mengulang' | 'Belum Lulus' = 'Mengulang';
    if (finalScore >= passingMinScore) {
      statusText = 'Lulus';
    } else if (finalScore >= passingMinScore - 7) {
      statusText = 'Lulus Bersyarat';
    } else if (finalScore >= 55) {
      statusText = 'Perlu Perbaikan';
    } else {
      statusText = 'Mengulang';
    }

    // Catatan koreksi live dari sesi santri aktif saat ini untuk disimpan ke riwayat assessment santri
    const studentLiveCorrections = examInteractiveComments
      .filter(c => !c.siswaId || (selectedStudent && c.siswaId === selectedStudent.id))
      .map(c => ({
        id: c.id,
        surahNama: c.surahNama,
        target: c.target,
        targetKey: c.targetKey || '',
        category: c.category,
        rubrikKriteria: c.rubrikKriteria || '',
        comment: c.comment,
        timestamp: c.timestamp || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }));

    const recPayload: Omit<AssessmentRecord, 'id'> = {
      templateId: selectedTemplate.id,
      jenisAssessmentId: activeCorrelatedJenis?.id || selectedTemplate.jenisAssessmentId || selectedJenisId || 'jns-1',
      namaAssessment: activeCorrelatedJenis ? activeCorrelatedJenis.namaAssessment : selectedTemplate.namaTemplate,
      kategori: activeCorrelatedJenis?.kategori || selectedTemplate.kategori || ('Tahfidz Al-Quran' as any),
      elemenId: selectedTemplate.elemenId || '',
      elemenNama: selectedTemplate.elemenNama || '',
      siswaId: selectedStudent.id,
      siswaNama: selectedStudent.namaLengkap,
      siswaNis: selectedStudent.nis || '',
      halaqahId: selectedStudent.halaqahId || '',
      halaqahNama: selectedStudent.halaqahNama || '',
      guruId: teacherId,
      guruNama: teacherName,
      tanggalAssessment: new Date().toISOString().split('T')[0],
      rubrikNilaiInput: rubrikResultMapped,
      kesalahanFatal: examInteractiveComments.some(c => (!c.siswaId || (selectedStudent && c.siswaId === selectedStudent.id)) && (c.category?.toLowerCase().includes('jaliy') || c.category?.toLowerCase().includes('makhraj'))),
      catatanGuru: catatanRekomendasi,
      rekomendasiLayak: isLayakMunaqasyah ? 'Layak Syahadah' : (finalScore >= passingMinScore ? 'Layak' : 'Belum Layak'),
      nilaiAkhir: finalScore,
      statusHasil: statusText,
      tanggalDibuat: new Date().toISOString(),
      modePenilaian: selectedTemplate.modePenilaian || 'Langsung',
      
      // team / examiners additions
      modelPengujian,
      ketuaPengujiId: modelPengujian !== ('Tunggal' as any) ? selectedKetuaId : undefined,
      ketuaPengujiNama: modelPengujian !== ('Tunggal' as any) ? (gurus.find(g => g.id === selectedKetuaId)?.namaLengkap || '') : undefined,
      anggotaPengujiIds: modelPengujian === 'Tim' ? selectedAnggotaIds : undefined,
      anggotaPengujiNamas: modelPengujian === 'Tim' ? selectedAnggotaIds.map(id => gurus.find(g => g.id === id)?.namaLengkap || '').filter(Boolean) : undefined,
      nilaiPenguji1: modelPengujian === 'Ganda' ? nilaiPenguji1 : undefined,
      nilaiPenguji2: modelPengujian === 'Ganda' ? nilaiPenguji2 : undefined,
      nilaiAkhirMethod,
      nilaiPerPenguji: modelPengujian === 'Tim' ? nilaiPerPenguji : undefined,
      catatanPerPenguji: modelPengujian === 'Tim' ? catatanPerPenguji : undefined,

      // Quran actual logs
      quranHalamanTerpilih: siswaSelectedHalaman,
      quranCuesTested: cuesTested.length > 0 ? cuesTested : (tahfidzAcakQuestions.map(q => `${q.surah} Ayat ${q.ayat} (${q.rating || 'Belum Dinilai'})`)),
      quranMetodeTahfidzTested: activeCorrelatedJenis?.quranMetodeTahfidz || 'Sambung Ayat',
      
      // Integration outputs
      isKenaikanJuz: isNaikJuz,
      isKenaikanLevel: isNaikLevel,
      isMunaqasyahEligible: isLayakMunaqasyah,
      kenaikanJuzKeterangan: isNaikJuz ? `Naik ke ${targetJuzNaik}` : '',

      // Riwayat Koreksi Live Sesi Ini untuk akun siswa/santri
      riwayatKoreksiLive: studentLiveCorrections,
      catatanKoreksiLive: studentLiveCorrections
    };

    const newRecordId = await createAssessmentRecord(recPayload);

    // 2. Issue Certificate if ticked and student passed
    if (shouldIssueSyahadah && finalScore >= passingMinScore) {
      const syhPayload = {
        assessmentRecordId: newRecordId,
        nomorSertifikat: certificateNo,
        siswaId: selectedStudent.id,
        siswaNama: selectedStudent.namaLengkap,
        siswaNis: selectedStudent.nis || '',
        kategori: activeCorrelatedJenis?.kategori || selectedTemplate.kategori || ('Tahfidz Al-Quran' as any),
        jenisAssessmentId: selectedTemplate.jenisAssessmentId,
        jeniaAssessmentNama: activeCorrelatedJenis ? activeCorrelatedJenis.namaAssessment : selectedTemplate.namaTemplate,
        namaAssessment: activeCorrelatedJenis ? activeCorrelatedJenis.namaAssessment : selectedTemplate.namaTemplate,
        nilaiAkhir: finalScore,
        nilaiPertanggungjawaban: finalScore,
        tanggalTerbit: new Date().toISOString().split('T')[0],
        keabsahanOtoritasKiai: 'Pimpinan Lembaga',
        isTelahDiserahkan: true,
        guruId: teacherId,
        guruNama: teacherName,
        statusHasil: statusText
      };
      await createSyahadah(syhPayload as any);
    }

    // 3. PERSIST THE INTEGRATION PROMOS DIRECTLY TO THE DATABASE (updateSiswa) ON EXAM PASS!
    if (finalScore >= passingMinScore) {
      const studentUpdates: Record<string, any> = {};
      
      if (isNaikJuz) {
        studentUpdates.currentJuz = targetJuzNaik;
        studentUpdates.juz = targetJuzNaik; // legacy field synchronization
      }
      if (isNaikLevel) {
        studentUpdates.currentLevel = targetLevelNaik;
        studentUpdates.jilid = targetLevelNaik; // legacy field synchronization
      }
      if (isLayakMunaqasyah) {
        studentUpdates.eligibleForMunaqasyah = true;
      }

      if (Object.keys(studentUpdates).length > 0) {
        await updateSiswa(selectedStudent.id, studentUpdates);
      }
    }

    if (activePengajuan) {
      await updatePengajuanAssessment(activePengajuan.id, {
        status: 'Selesai',
        nilaiAkhir: finalScore,
        statusHasil: statusText,
        catatanPenguji: catatanRekomendasi
      });
      setActivePengajuan(null);
    }

    // Bersihkan sesi live koreksi setelah ujian selesai disimpan
    setExamInteractiveComments([]);
    setExamQuranSelections([]);
    setExamCatatanText('');
    setExamSaveFeedback('');
    setShowExamCategoryPicker(false);
    setSelectedExamSubCategory('');

    setShowGradingModal(false);
  };

  // Filter students & pending exams
  const teacherId = currentSession.user?.id || '';

  // Find all halaqah groups led by this teacher
  const myHalaqahs = getTeacherHalaqahs(
    halaqahs,
    currentSession.user,
    gurus,
    guruSchedules,
    siswas,
    strukturLembaga
  );
  const myHalaqahIds = myHalaqahs.map(h => h.id);
  const activeHalaqahId = selectedGuruHalaqahId || (currentSession.user as any)?.halaqahId || myHalaqahs[0]?.id || '';
  const activeHalaqahObj = halaqahs.find(
    h =>
      h.id === activeHalaqahId ||
      h.namaHalaqah === activeHalaqahId ||
      (activeHalaqahId ? normalizeHalaqahKey(h.namaHalaqah) === normalizeHalaqahKey(activeHalaqahId) : false)
  );
  const activeHalaqahDisplayName = activeHalaqahObj?.namaHalaqah || activeHalaqahId || 'Semua Halaqah';

  // Helper to match any student/record against the selected Halaqah (by ID, name, or student fallback)
  const matchesSelectedHalaqah = (halaqahIdVal?: string, halaqahNamaVal?: string, siswaIdVal?: string) => {
    if (!isGuru) return true;
    const studentObj = siswaIdVal ? siswas.find(s => s.id === siswaIdVal) : undefined;
    const effectiveHalaqahId = halaqahIdVal || studentObj?.halaqahId || '';
    const effectiveHalaqahNama = halaqahNamaVal || studentObj?.halaqahNama || '';

    if (activeHalaqahId) {
      if (effectiveHalaqahId && (effectiveHalaqahId === activeHalaqahId || (activeHalaqahObj && effectiveHalaqahId === activeHalaqahObj.id))) {
        return true;
      }
      const targetNameNorm = normalizeHalaqahKey(activeHalaqahObj?.namaHalaqah || activeHalaqahId);
      if (targetNameNorm && effectiveHalaqahNama && normalizeHalaqahKey(effectiveHalaqahNama) === targetNameNorm) {
        return true;
      }
      if (targetNameNorm && effectiveHalaqahId && normalizeHalaqahKey(effectiveHalaqahId) === targetNameNorm) {
        return true;
      }
      return false;
    }

    if (myHalaqahIds.length > 0) {
      if (effectiveHalaqahId && myHalaqahIds.includes(effectiveHalaqahId)) return true;
      const myNameNorms = new Set(myHalaqahs.map(h => normalizeHalaqahKey(h.namaHalaqah)).filter(Boolean));
      if (effectiveHalaqahNama && myNameNorms.has(normalizeHalaqahKey(effectiveHalaqahNama))) return true;
      return false;
    }
    return true;
  };

  // Filter students belonging to the active / selected halaqah group for Guru
  const activeHalaqahStudents = siswas.filter(s => matchesSelectedHalaqah(s.halaqahId, s.halaqahNama, s.id));

  // Candidate students for the dropdown "1. Pilih Santri yang Akan Diuji"
  const candidateStudentsForExam = (() => {
    const list = [...activeHalaqahStudents];
    if (selectedStudent && !list.some(s => s.id === selectedStudent.id)) {
      list.push(selectedStudent);
    }
    return list;
  })();

  // Filter students based on searchQuery for main list view
  const relevantStudents = activeHalaqahStudents.filter(s => {
    if (searchQuery) {
      return s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (s.nis && s.nis.includes(searchQuery));
    }
    return true;
  });

  // Get active pending pengajuan assigned to current guru
  const myPendingPengajuans = (pengajuanAssessments || []).filter(p => 
    p.pengujiGuruId === teacherId && p.status === 'Pending'
  );

  // Filter pending proposals based on search query
  const relevantPendingPengajuans = myPendingPengajuans.filter(p => {
    if (searchQuery) {
      return p.siswaNama.toLowerCase().includes(searchQuery.toLowerCase()) || 
             p.siswaNis.includes(searchQuery);
    }
    return true;
  });

  // Filter Laporan Pelaksanaan Ujian Terkini by selected Halaqah & searchQuery, sorted newest first
  const filteredAssessmentRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assessmentRecords
      .filter(rec => {
        if (!matchesSelectedHalaqah(rec.halaqahId, rec.halaqahNama, rec.siswaId)) {
          return false;
        }
        if (q) {
          const namaMatch = (rec.siswaNama || '').toLowerCase().includes(q);
          const nisMatch = (rec.siswaNis || '').toLowerCase().includes(q);
          const assesMatch = (rec.namaAssessment || (rec as any).namaTemplate || '').toLowerCase().includes(q);
          const halaqahMatch = (rec.halaqahNama || '').toLowerCase().includes(q);
          return namaMatch || nisMatch || assesMatch || halaqahMatch;
        }
        return true;
      })
      .slice()
      .sort((a, b) => {
        const dateA = a.tanggalAssessment || a.tanggalDibuat || '';
        const dateB = b.tanggalAssessment || b.tanggalDibuat || '';
        return dateB.localeCompare(dateA);
      });
  }, [assessmentRecords, isGuru, activeHalaqahId, activeHalaqahObj, myHalaqahIds, myHalaqahs, siswas, searchQuery]);

  // Helper to start exam from a pending proposal
  const handleStartExamFromPengajuan = (p: any) => {
    const student = siswas.find(s => s.id === p.siswaId);
    if (!student) {
      alert('Data santri tidak ditemukan!');
      return;
    }

    // Reset everything
    setSelectedStudent(student);
    setSelectedJenisId(p.jenisAssessmentId || '');
    setScores({});
    setMistakes({});
    setCatatanRekomendasi('');
    setShouldIssueSyahadah(false);
    
    // Reset Team-examiner states
    setModelPengujian('Tunggal');
    setSelectedKetuaId('');
    setSelectedAnggotaIds([]);
    setNilaiPenguji1(100);
    setNilaiPenguji2(100);
    setNilaiAkhirMethod('Rerata');
    setManualFinalScore(100);
    setNilaiPerPenguji({});
    setCatatanPerPenguji({});

    // Reset Quran states & Live interactive correction session
    setExamInteractiveComments([]);
    setExamQuranSelections([]);
    setExamCatatanText('');
    setExamSaveFeedback('');
    setShowExamCategoryPicker(false);
    setSelectedExamSubCategory('');
    setSiswaSelectedHalaman([]);
    setHalamanInputSatu('');
    setCuesTested([]);
    setTahfidzAcakQuestions([]);
    setIsNaikJuz(false);
    setIsNaikLevel(false);
    setIsLayakMunaqasyah(false);

    // Set Active Pengajuan
    setActivePengajuan(p);

    // Load template
    const tpl = templateAssessments.find(t => t.id === p.templateAssessmentId) || templateAssessments[0];
    if (tpl) {
      setSelectedTemplate(tpl);
      const initialScores: Record<string, number> = {};
      const initialMistakes: Record<string, number> = {};
      const tplRubrik = (tpl as any).rubrikNilai || (tpl as any).rubrik || [];
      tplRubrik.forEach((r: any) => { 
        const kriteriaKey = r.namaKriteria || r.kriteria || 'Kriteria';
        initialScores[kriteriaKey] = 100;
        if (r.kriteria) initialScores[r.kriteria] = 100;
        if (r.namaKriteria) initialScores[r.namaKriteria] = 100;
        if (tpl.modePenilaian === 'PenguranganKesalahan') {
          initialMistakes[kriteriaKey] = 0;
          if (r.kriteria) initialMistakes[r.kriteria] = 0;
          if (r.namaKriteria) initialMistakes[r.namaKriteria] = 0;
        }
      });
      setScores(initialScores);
      setMistakes(initialMistakes);
    }

    // Set Target
    if (p.targetJuzAtauJilid.toLowerCase().includes('juz')) {
      setIsNaikJuz(true);
      setTargetJuzNaik(p.targetJuzAtauJilid);
    } else {
      setIsNaikLevel(true);
      setTargetLevelNaik(p.targetJuzAtauJilid);
    }

    // Generate standard serial reference
    const timestamp = Date.now().toString().slice(-6);
    setCertificateNo(`SYH/MH/${new Date().getFullYear()}/${timestamp}`);

    setShowGradingModal(true);
  };

  // List of students that this teacher can propose exams for (from their selected halaqah)
  const myStudentsForProposal = isGuru 
    ? siswas.filter(s => matchesSelectedHalaqah(s.halaqahId, s.halaqahNama, s.id) && s.status === StatusAktif.AKTIF)
    : siswas.filter(s => s.status === StatusAktif.AKTIF);

  // List of other teachers with examiner role
  const availablePengujis = gurus.filter(g => g.peranGuru?.includes('Penguji Assessment'));

  // Handle Proposal Submission
  const handleCreateProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = siswas.find(s => s.id === proposalStudentId);
    const jAs = jenisAssessments.find(j => j.id === proposalJenisId);
    const tAs = templateAssessments.find(t => t.id === proposalTemplateId);
    const penguji = gurus.find(g => g.id === proposalPengujiId) || (proposalPengujiId === currentSession.user?.id ? currentSession.user : null);

    if (!student || !jAs || !tAs || !penguji) {
      alert('Mohon lengkapi semua isian formulir pengajuan!');
      return;
    }

    const payload: Omit<any, 'id'> = {
      siswaId: student.id,
      siswaNama: student.namaLengkap,
      siswaNis: student.nis || '',
      halaqahId: student.halaqahId || '',
      halaqahNama: student.halaqahNama || '',
      targetJuzAtauJilid: proposalTarget || 'Juz 30',
      jenisAssessmentId: jAs.id,
      jenisAssessmentNama: jAs.namaAssessment,
      templateAssessmentId: tAs.id,
      templateAssessmentNama: tAs.namaTemplate,
      pengajuGuruId: currentSession.user?.id || 'gru-1',
      pengajuGuruNama: currentSession.user?.namaLengkap || 'Ustadz',
      pengujiGuruId: penguji.id,
      pengujiGuruNama: penguji.namaLengkap,
      tanggalPengajuan: new Date().toISOString().split('T')[0],
      status: 'Pending',
      catatanGuru: proposalCatatan
    };

    await createPengajuanAssessment(payload);
    alert(`Berhasil mengajukan assessment ujian untuk ${student.namaLengkap}!`);
    
    // Reset states
    setProposalCatatan('');
    setIsSubmittingPengajuan(false);
  };

  return (
    <div id="pelaksanaan-assessment-section" className="space-y-6">
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pelaksanaan Assessment (Ujian)</h1>
        <p className="text-sm text-gray-500">Evaluasi murid, input nilai rubrik proporsional, periksa kriteria kelulusan otomatis, dan cetak Syahadah formal.</p>
      </div>

      {/* Teacher Workspace Navigation Tabs */}
      {isGuru && (
        <div className="flex gap-2 border-b border-gray-200 pb-1.5">
          <button
            onClick={() => setActiveSubView('pelaksanaan')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${activeSubView === 'pelaksanaan' ? 'text-emerald-700 font-extrabold border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <ClipboardCheck className="h-4 w-4" /> Pelaksanaan Ujian (Assigned)
          </button>
          <button
            onClick={() => { 
              setActiveSubView('pengajuan'); 
              if (myStudentsForProposal.length > 0 && !proposalStudentId) {
                setProposalStudentId(myStudentsForProposal[0].id);
              }
              if (jenisAssessments.length > 0 && !proposalJenisId) {
                setProposalJenisId(jenisAssessments[0].id);
                const matching = templateAssessments.filter(t => (t.jenisAssessmentIds && t.jenisAssessmentIds.includes(jenisAssessments[0].id)) || t.jenisAssessmentId === jenisAssessments[0].id);
                if (matching.length > 0) {
                  setProposalTemplateId(matching[0].id);
                }
              }
              if (!proposalPengujiId) {
                setProposalPengujiId(currentSession.user?.id || '');
              }
            }}
            className={`pb-2.5 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${activeSubView === 'pengajuan' ? 'text-emerald-700 font-extrabold border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Plus className="h-4 w-4" /> Daftar & Pengajuan Ujian
          </button>
        </div>
      )}

      {activeSubView === 'pelaksanaan' && !showGradingModal && (
        <>
          {/* Toolbar / Searchbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama santri / NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setActivePengajuan(null);
                  if (relevantStudents.length > 0 && !selectedStudent) {
                    handleStartExam(relevantStudents[0]);
                  } else if (siswas.length > 0 && !selectedStudent) {
                    handleStartExam(siswas[0]);
                  } else if (selectedStudent) {
                    handleStartExam(selectedStudent);
                  } else {
                    setShowGradingModal(true);
                  }
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
              >
                <GraduationCap className="h-4 w-4 text-emerald-200" />
                <span>Buka Lembar Assessment Baru</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
              <Info className="h-4 w-4 text-emerald-600" />
              <span>Sistem secara otomatis menghitung nilai rata-rata tertimbang berdasarkan bobot rubrik.</span>
            </div>
          </div>

          {/* Examiner Toggle for assigned exams vs manual selection */}
          {isGuru && (
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setFilterMode('assigned')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'assigned' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tugas Uji Ditugaskan ke Saya ({relevantPendingPengajuans.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Daftar Santri Halaqah Saya ({relevantStudents.length})
              </button>
            </div>
          )}

          {/* Student List for Assessment execution */}
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            {isGuru && filterMode === 'assigned' ? 'Daftar Tugas Ujian Anda' : 'Pilih Santri yang Diuji'}
          </h2>

          {isGuru && filterMode === 'assigned' ? (
            /* RENDER ASSIGNED PENDING EXAMS */
            relevantPendingPengajuans.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-slate-500 text-xs">
                <ClipboardCheck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold">Tidak ada tugas ujian yang ditugaskan kepada Anda saat ini.</p>
                <p className="text-[11px] text-slate-400 mt-1">Gunakan tombol "Daftar Santri Halaqah Saya" untuk menguji secara mandiri atau ajukan ujian di tab sebelah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relevantPendingPengajuans.map(p => {
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm">
                            {p.siswaNama.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">{p.siswaNama}</h3>
                            <p className="text-[11px] text-gray-400">NIS: {p.siswaNis || 'N/A'} • {p.halaqahNama}</p>
                          </div>
                        </div>

                        <div className="bg-emerald-50/50 border border-emerald-50 p-2.5 rounded-lg text-[11px] space-y-1 mb-4">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Ujian:</span>
                            <span className="text-emerald-950 font-bold">{p.templateAssessmentNama}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Target:</span>
                            <span className="text-emerald-950 font-bold bg-emerald-100/60 px-1.5 py-0.2 rounded">{p.targetJuzAtauJilid}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Pengaju:</span>
                            <span className="text-emerald-950 font-semibold">{p.pengajuGuruNama}</span>
                          </div>
                          {p.catatanGuru && (
                            <div className="border-t border-emerald-100/50 pt-1 mt-1 text-slate-500 italic">
                              "{p.catatanGuru}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{p.tanggalPengajuan}</span>
                        <button
                          type="button"
                          onClick={() => handleStartExamFromPengajuan(p)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <GraduationCap className="h-4 w-4" /> Uji Sekarang
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* RENDER STANDARD STUDENT CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relevantStudents.map(student => {
                const studentExams = assessmentRecords.filter(r => r.siswaId === student.id);
                const passedExams = studentExams.filter(r => (r.statusHasil || r.statusKelulusan || '').includes('Lulus'));
                
                return (
                  <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm">
                          {(student.namaLengkap || 'ST').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{student.namaLengkap}</h3>
                          <p className="text-[11px] text-gray-400">NIS: {student.nis || 'N/A'} • {student.halaqahNama || 'Umum'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-lg text-xs font-semibold text-gray-600 mb-4 mb-auto">
                        <div className="text-center border-r border-gray-200">
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Total Ujian</span>
                          <span className="text-gray-900 font-bold">{studentExams.length} Kali</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Lulus</span>
                          <span className="text-emerald-700 font-bold">{passedExams.length} Sertifikat</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-4 flex justify-between items-center">
                      <span className="text-[11px] text-gray-400 italic">Target: Jilid / Juz</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePengajuan(null); // Direct exam doesn't belong to any proposal
                          handleStartExam(student);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <GraduationCap className="h-4 w-4" /> Uji Sekarang
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeSubView === 'pengajuan' && (
        /* TAB 2: ACTIVE PROPOSALS & REGISTRATION OF EXAMS */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Manajemen Pengajuan Assessment</h2>
              <p className="text-xs text-slate-400">Guru pendamping dapat mengajukan santri-santrinya yang telah tuntas target untuk diuji oleh penguji resmi.</p>
            </div>
            {!isSubmittingPengajuan && (
              <button
                onClick={() => setIsSubmittingPengajuan(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-4 w-4" /> Ajukan Ujian Baru
              </button>
            )}
          </div>

          {isSubmittingPengajuan && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 border border-emerald-100 rounded-xl space-y-4 shadow-sm"
            >
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-50 pb-2">Formulir Pengajuan Assessment Baru</h3>
              <form onSubmit={handleCreateProposalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Santri Bimbingan</label>
                    <select
                      value={proposalStudentId}
                      onChange={(e) => setProposalStudentId(e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      required
                    >
                      <option value="">-- Pilih Santri --</option>
                      {myStudentsForProposal.map(s => (
                        <option key={s.id} value={s.id}>{s.namaLengkap} ({s.nis || 'N/A'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Jenis Assessment</label>
                    <select
                      value={proposalJenisId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProposalJenisId(val);
                        const matching = templateAssessments.filter(t => (t.jenisAssessmentIds && t.jenisAssessmentIds.includes(val)) || t.jenisAssessmentId === val);
                        if (matching.length > 0) {
                          setProposalTemplateId(matching[0].id);
                        }
                      }}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      required
                    >
                      <option value="">-- Pilih Jenis --</option>
                      {jenisAssessments.map(j => (
                        <option key={j.id} value={j.id}>{j.namaAssessment} ({j.kategori})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Template Penilaian</label>
                    <select
                      value={proposalTemplateId}
                      onChange={(e) => setProposalTemplateId(e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      required
                    >
                      <option value="">-- Pilih Template --</option>
                      {templateAssessments.filter(t => (t.jenisAssessmentIds && t.jenisAssessmentIds.includes(proposalJenisId)) || t.jenisAssessmentId === proposalJenisId).map(t => (
                        <option key={t.id} value={t.id}>{t.namaTemplate}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Target Juz / Level Jilid</label>
                    <input
                      type="text"
                      placeholder="Contoh: Juz 30, Juz 1, Jilid 4, Al-Quran"
                      value={proposalTarget}
                      onChange={(e) => setProposalTarget(e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Penguji Assessment</label>
                    <select
                      value={proposalPengujiId}
                      onChange={(e) => setProposalPengujiId(e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      required
                    >
                      <option value="">-- Pilih Penguji --</option>
                      <option value={currentSession.user?.id || 'gru-1'}>Uji Sendiri (Saya Sendiri)</option>
                      {availablePengujis.filter(g => g.id !== currentSession.user?.id).map(g => (
                        <option key={g.id} value={g.id}>{g.namaLengkap}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Catatan Kesiapan Santri</label>
                    <input
                      type="text"
                      placeholder="Keterangan kesiapan santri (opsional)"
                      value={proposalCatatan}
                      onChange={(e) => setProposalCatatan(e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSubmittingPengajuan(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-bold rounded-lg transition-colors"
                  >
                    Kirim Pengajuan
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* HISTORICAL PROPOSALS LIST */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50/50 border-b border-gray-100 p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histori Pengajuan Ujian</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Santri</th>
                    <th className="p-4">Target / Ujian</th>
                    <th className="p-4">Pengaju</th>
                    <th className="p-4">Penguji</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Hasil</th>
                    <th className="p-4 text-right">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {(pengajuanAssessments || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs italic">
                        Belum ada data pengajuan assessment yang didaftarkan.
                      </td>
                    </tr>
                  ) : (
                    (pengajuanAssessments || []).map(p => {
                      const isMyProposal = p.pengajuGuruId === currentSession.user?.id;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/55 transition-colors">
                          <td className="p-4 font-semibold text-slate-600 whitespace-nowrap">{p.tanggalPengajuan}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{p.siswaNama}</span>
                            <span className="text-[10px] text-slate-400 block">{p.halaqahNama || 'Umum'}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] block w-fit mb-0.5">{p.targetJuzAtauJilid}</span>
                            <span className="text-slate-500 block text-[11px] font-medium">{p.templateAssessmentNama}</span>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{p.pengajuGuruNama}</td>
                          <td className="p-4 text-slate-600 font-semibold whitespace-nowrap">
                            {p.pengujiGuruId === currentSession.user?.id ? (
                              <span className="bg-emerald-55 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">Anda (Penguji)</span>
                            ) : (
                              p.pengujiGuruNama || p.guruNama || '-'
                            )}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${p.status === 'Pending' ? 'bg-amber-100 text-amber-800' : p.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            {p.status === 'Selesai' ? (
                              <div>
                                <span className="font-bold text-slate-950 block text-[11px]">Nilai: {p.nilaiAkhir || 'N/A'}</span>
                                <span className="text-[10px] text-emerald-600 font-bold">{p.statusHasil || p.statusKelulusan || '-'}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            {p.status === 'Pending' && isMyProposal && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus/membatalkan pengajuan ujian untuk ${p.siswaNama}?`)) {
                                    deletePengajuanAssessment(p.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Batalkan Pengajuan"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* History of recent assessments done */}
      {!showGradingModal && (
        <>
          <div className="mt-10 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">Laporan Pelaksanaan Ujian Terkini</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rekam jejak dan berita acara hasil pelaksanaan ujian santri
            {isGuru && activeHalaqahId ? (
              <> · Halaqah <span className="font-semibold text-emerald-700 dark:text-emerald-400">{activeHalaqahDisplayName}</span></>
            ) : null}
            {' · '}
            <span className="font-mono tabular-nums font-semibold">{filteredAssessmentRecords.length} laporan</span>
          </p>
        </div>
        {isGuru && myHalaqahs.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="laporan-halaqah-switch" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Halaqah:
            </label>
            <select
              id="laporan-halaqah-switch"
              value={activeHalaqahObj?.id || activeHalaqahId}
              onChange={(e) => setSelectedGuruHalaqahId(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {myHalaqahs.map(h => (
                <option key={h.id} value={h.id}>
                  {h.namaHalaqah}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 uppercase font-bold border-b border-gray-100 dark:border-slate-800">
            <tr>
              <th className="p-3.5 whitespace-nowrap w-28">Tanggal</th>
              <th className="p-3.5 whitespace-nowrap min-w-[140px]">Santri / Halaqah</th>
              <th className="p-3.5 whitespace-nowrap min-w-[160px]">Ujian & Template</th>
              <th className="p-3.5 text-center whitespace-nowrap w-24">Nilai Akhir</th>
              <th className="p-3.5 whitespace-nowrap w-32">Kelulusan</th>
              <th className="p-3.5 text-right whitespace-nowrap w-36">Opsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
            {filteredAssessmentRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">
                  {searchQuery.trim()
                    ? `Tidak ditemukan laporan pelaksanaan ujian untuk "${searchQuery.trim()}"${isGuru && activeHalaqahId ? ` di Halaqah ${activeHalaqahDisplayName}` : ''}.`
                    : isGuru && activeHalaqahId
                    ? `Belum ada rekam jejak pelaksanaan ujian santri untuk Halaqah ${activeHalaqahDisplayName}.`
                    : 'Belum ada rekam jejak pelaksanaan ujian santri.'}
                </td>
              </tr>
            ) : (
              filteredAssessmentRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-medium font-mono tabular-nums text-gray-600 dark:text-slate-300 whitespace-nowrap">
                    {rec.tanggalAssessment || (rec as any).tanggalInput || '-'}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-gray-900 dark:text-slate-100">{rec.siswaNama || 'Santri'}</div>
                    <div className="text-[11px] text-gray-400 dark:text-slate-500">
                      {rec.halaqahNama || siswas.find(s => s.id === rec.siswaId)?.halaqahNama || 'Umum'}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-emerald-800 dark:text-emerald-400">{rec.namaAssessment || (rec as any).namaTemplate || 'Assessment'}</div>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400">{(rec as any).namaTemplate || rec.namaAssessment || '-'}</div>
                  </td>
                  <td className="p-3.5 text-center text-sm font-extrabold font-mono tabular-nums text-emerald-950 dark:text-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 whitespace-nowrap rounded-md">
                    {rec.nilaiAkhir ?? '-'}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      (rec.statusHasil || (rec as any).statusKelulusan || '').includes('Lulus') 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : ((rec.statusHasil || (rec as any).statusKelulusan) === 'Perlu Perbaikan' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300')
                    }`}>
                      {rec.statusHasil || (rec as any).statusKelulusan || '-'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setViewingBeritaAcara(rec)}
                      className="text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 transition-all px-2.5 py-1 rounded-lg inline-flex items-center gap-1 font-bold text-[11px]"
                      title="Lihat Berita Acara Resmi"
                    >
                      <FileText className="h-3.5 w-3.5" /> Berita Acara
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus arsip penilaian ujian ini?')) {
                          deleteAssessmentRecord(rec.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 inline-flex items-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </>
      )}

      {activeSubView === 'pelaksanaan' && showGradingModal && (
        /* Interactive Page Form for entry */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl w-full border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0 my-2"
        >
          {/* Header with Back button */}
          <div className="bg-emerald-800 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  exitFullscreen();
                  setHasEnteredFullscreen(false);
                  setShowFullscreenWarning(false);
                  setFullscreenExitCount(0);
                  setExamInteractiveComments([]);
                  setExamQuranSelections([]);
                  setExamCatatanText('');
                  setShowExamCategoryPicker(false);
                  setSelectedExamSubCategory('');
                  setShowGradingModal(false);
                  setActivePengajuan(null);
                }}
                className="bg-emerald-700/90 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-emerald-600/60 shadow-sm shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Daftar Santri</span>
              </button>
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl flex items-center gap-2 text-white">
                  <GraduationCap className="h-6 w-6 text-emerald-300" />
                  Lembar Penilaian & Ujian Santri
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {selectedStudent ? (
                    <>Santri Aktif: <strong className="text-white">{selectedStudent.namaLengkap}</strong> • NIS: {selectedStudent.nis || 'N/A'} • Halaqah: {selectedStudent.halaqahNama || 'Umum'}</>
                  ) : (
                    'Silakan pilih santri yang diuji & template kriteria ujian pada formulir di bawah.'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
              {isFullscreen ? (
                <button
                  type="button"
                  onClick={exitFullscreen}
                  className="bg-emerald-700/90 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/50 text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Keluar dari Layar Penuh"
                >
                  <Minimize className="h-4 w-4 text-emerald-300" />
                  <span>Keluar Layar Penuh</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enterFullscreen}
                  className={`${
                    requireFullscreen
                      ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold shadow-md transform hover:scale-105'
                      : 'bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold border border-emerald-500/60 shadow-xs'
                  } text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer`}
                  title={requireFullscreen ? "Masuk Mode Layar Penuh (Wajib Siswa)" : "Mode Layar Penuh (Opsional untuk Memperluas Tampilan Lembar Ujian)"}
                >
                  <Maximize className={`h-4 w-4 ${requireFullscreen ? 'text-amber-950' : 'text-emerald-200'}`} />
                  <span>{requireFullscreen ? 'Masuk Layar Penuh' : 'Layar Penuh (Opsional)'}</span>
                </button>
              )}
              {activePengajuan && (
                <span className="bg-emerald-700/80 text-emerald-100 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-xl font-semibold self-start md:self-center">
                  📌 Berasal dari Pengajuan Ujian
                </span>
              )}
            </div>
          </div>

          <form noValidate onSubmit={handleSaveGradesAndSyahadahSubmit} className="p-5 sm:p-7 space-y-6">
            {/* Top Controls: 1. Pilih Santri yang Diuji, 2. Pilih Template Kriteria Ujian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-600" />
                    1. Pilih Santri yang Akan Diuji <span className="text-rose-500">*</span>
                  </label>
                  {selectedStudent && (
                    <button
                      type="button"
                      onClick={handleResetOrRepeatExam}
                      className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:bg-amber-100"
                      title="Ulangi penilaian santri ini dari awal (membersihkan seluruh catatan koreksi live & nilai ujian)"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Ulangi Penilaian Santri Ini</span>
                    </button>
                  )}
                </div>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    const st = siswas.find(s => s.id === e.target.value) || null;
                    handleSelectStudentForExam(st);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Santri --</option>
                  {candidateStudentsForExam.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.namaLengkap} {s.nis ? `(NIS: ${s.nis})` : ''}
                    </option>
                  ))}
                </select>
                {selectedStudent && (
                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-2">
                    <span className="bg-emerald-100/80 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 px-2.5 py-0.5 rounded-md">
                      📖 Level: {selectedStudent.currentLevel || selectedStudent.jilid || 'Jilid 3'}
                    </span>
                    <span className="bg-amber-100/80 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-md">
                      📗 Juz: {selectedStudent.currentJuz || selectedStudent.juz || 'Juz 30'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  2. Pilih Template Kriteria Ujian <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => handleTemplateSelectionChanges(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Template Penjurian --</option>
                  {templateAssessments.map(t => (
                    <option key={t.id} value={t.id}>{t.namaTemplate} (Min: {t.syaratMinScore})</option>
                  ))}
                </select>

                {/* Sub-Selector if template connects to multiple Jenis Assessment */}
                {selectedTemplate && (selectedTemplate.jenisAssessmentIds?.length ?? 0) > 1 && (
                  <div className="mt-2.5 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-emerald-600" />
                      Jenis Assessment Spesifik:
                    </label>
                    <select
                      value={effectiveJenisId}
                      onChange={(e) => setSelectedJenisId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {jenisAssessments
                        .filter(j => (selectedTemplate.jenisAssessmentIds || []).includes(j.id))
                        .map(j => (
                          <option key={j.id} value={j.id}>
                            {j.namaAssessment} ({j.kategori})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="mt-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 p-2.5 rounded-xl text-xs text-emerald-950 dark:text-emerald-300 font-medium space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" /> Petunjuk Pelaksanaan:
                    </strong>
                    {selectedTemplate?.petunjukPerJenis?.[effectiveJenisId] && (
                      <span className="text-[9px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                        ✨ Petunjuk Khusus Jenis Terpilih
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{effectivePetunjuk}</p>
                </div>
              </div>
            </div>

            {/* FULLSCREEN GATEWAY / GUARD BEFORE EXAM QUESTIONS & MATERIALS (HANYA AKTIF UNTUK SISWA/SANTRI) */}
            {selectedTemplate && requireFullscreen && !hasEnteredFullscreen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 text-center space-y-5 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden"
              >
                <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Maximize className="w-8 h-8 animate-pulse" />
                </div>
                <div className="max-w-xl mx-auto space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Proteksi Sistem & Integritas Ujian (Full-Screen Required)
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Wajib Masuk Mode Layar Penuh
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    Untuk menjaga fokus, ketertiban, dan integritas evaluasi assessment santri, seluruh naskah materi soal, lembar mushaf interaktif, dan simulasi pengujian wajib diakses dalam mode Layar Penuh.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={enterFullscreen}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black px-8 py-3.5 rounded-2xl text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Maximize className="w-5 h-5" />
                    <span>Masuk Layar Penuh & Tampilkan Soal</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium pt-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sistem akan mendeteksi dan memberi peringatan proctoring otomatis jika keluar dari mode layar penuh.</span>
                </div>
              </motion.div>
            )}

            {/* INFORMASI MODE PENILAI LANGSUNG UNTUK GURU / PENGUJI (AKSES TERBUKA TANPA PEMBATASAN LAYAR PENUH) */}
            {selectedTemplate && !requireFullscreen && (
              <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block text-[12.5px] text-emerald-950 dark:text-emerald-100">
                      Mode Penguji / Penilai (Akses Langsung Terbuka)
                    </span>
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                      Sebagai Penguji/Guru yang mengevaluasi santri, seluruh materi soal, mushaf, dan rubrik penilaian terbuka langsung tanpa kewajiban layar penuh.
                    </span>
                  </div>
                </div>
                {!isFullscreen && (
                  <button
                    type="button"
                    onClick={enterFullscreen}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 hover:bg-emerald-100/60 border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-2xs cursor-pointer"
                    title="Perluas tampilan ke layar penuh jika membutuhkan ruang penilaian yang lebih luas"
                  >
                    <Maximize className="h-3.5 w-3.5" />
                    <span>Perluas Layar Penuh (Opsional)</span>
                  </button>
                )}
              </div>
            )}

            {/* EXAM QUESTIONS, SIMULATORS & GRADING RUBRIC: TERBUKA LANGSUNG UNTUK GURU, ATAU SETELAH FULLSCREEN JIKA SISWA */}
            {selectedTemplate && (!requireFullscreen || hasEnteredFullscreen) && (
              <>
              {/* EXTERNAL PRATINJAU NASKAH DALAM MODAL PENILAIAN */}
              {selectedTemplate && activeCorrelatedJenis?.sumberAssessment === 'eksternal' && (
                <div className="bg-indigo-55/35 border border-indigo-100 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2">
                    <span className="text-xs font-bold text-indigo-950 uppercase flex items-center gap-1.5 leading-none">
                      <FileText className="h-4 w-4 text-indigo-600 animate-pulse" />
                      Materi / Naskah Dokumen Ujian Eksternal
                    </span>
                    {activeCorrelatedJenis.eksternalTipe === 'link' && activeCorrelatedJenis.eksternalLink && (
                      <a 
                        href={activeCorrelatedJenis.eksternalLink} 
                        target="_blank" 
                        rel="noreferrer referrer" 
                        className="text-[10px] text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 px-2 py-0.5 rounded font-bold"
                      >
                        Buka Link Asli ↗
                      </a>
                    )}
                  </div>

                  {activeCorrelatedJenis.eksternalFileName && (
                    <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-bold">📂 File Terlampir:</span>
                      <span className="text-indigo-950 font-bold max-w-xs truncate">{activeCorrelatedJenis.eksternalFileName}</span>
                      <span className="text-slate-400 font-medium">({activeCorrelatedJenis.eksternalFileType || 'Dokumen'} • {activeCorrelatedJenis.eksternalFileSize ? `${(activeCorrelatedJenis.eksternalFileSize / 1024).toFixed(1)} KB` : 'N/A'})</span>
                    </div>
                  )}

                  {/* Document preview container */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm min-h-[140px] flex flex-col justify-between">
                    {(() => {
                      // Google Docs integration
                      if (activeCorrelatedJenis.eksternalTipe === 'link' && activeCorrelatedJenis.eksternalLink) {
                        const embedUrl = getGoogleDocsEmbedUrl(activeCorrelatedJenis.eksternalLink);
                        if (embedUrl) {
                          return (
                            <iframe 
                              src={embedUrl}
                              className="w-full h-80 border rounded bg-white shadow-inner"
                              title="Google Docs Grading Preview"
                            />
                          );
                        } else {
                          return (
                            <div className="text-center py-4 text-slate-500">
                              <p className="text-xs font-semibold">Tautan Dokumen Eksternal Terhubung:</p>
                              <a 
                                href={activeCorrelatedJenis.eksternalLink} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs text-indigo-600 font-bold hover:underline inline-block mt-1 text-center truncate max-w-md"
                              >
                                {activeCorrelatedJenis.eksternalLink} ↗
                              </a>
                            </div>
                          );
                        }
                      }

                      // PDF File Upload Embed
                      if (activeCorrelatedJenis.eksternalTipe === 'upload' && activeCorrelatedJenis.eksternalFileBase64 && activeCorrelatedJenis.eksternalFileName?.endsWith('.pdf')) {
                        return (
                          <iframe 
                            src={activeCorrelatedJenis.eksternalFileBase64}
                            className="w-full h-80 border rounded bg-white shadow"
                            title="PDF Grading Preview"
                          />
                        );
                      }

                      // Fallback text (either native text input or transcript provided for Docx/Odt)
                      const docText = activeCorrelatedJenis.eksternalText || '';
                      if (!docText) {
                        return (
                          <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                            [Tidak ada naskah teks yang diinputkan untuk dokumen ini. Silakan lihat file asli lampiran di atas]
                          </div>
                        );
                      }

                      const pages = paginateText(docText);
                      const totalPages = pages.length;
                      const activePg = Math.min(Math.max(0, currentGradingPreviewPage), totalPages - 1);
                      const pageContent = pages[activePg] || '';

                      return (
                        <div className="space-y-3">
                          <div className="font-serif text-slate-800 text-xs text-left leading-relaxed whitespace-pre-wrap p-2 min-h-[120px] relative">
                            <span className="absolute top-0 right-0 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                              Hal {activePg + 1}
                            </span>
                            {pageContent}
                          </div>

                          {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 border-t border-slate-100 pt-2.5">
                              <button
                                type="button"
                                disabled={activePg === 0}
                                onClick={() => setCurrentGradingPreviewPage(p => Math.max(0, p - 1))}
                                className="text-xs font-bold text-slate-600 disabled:opacity-30 px-2 py-1 bg-slate-50 border border-slate-200 rounded"
                              >
                                ◀ Prev
                              </button>
                              <span className="text-[10px] text-slate-505 font-bold">
                                Halaman {activePg + 1} / {totalPages}
                              </span>
                              <button
                                type="button"
                                disabled={activePg === totalPages - 1}
                                onClick={() => setCurrentGradingPreviewPage(p => Math.min(totalPages - 1, p + 1))}
                                className="text-xs font-bold text-slate-600 disabled:opacity-30 px-2 py-1 bg-slate-50 border border-slate-200 rounded"
                              >
                                Next ▶
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Mode & Tim Penguji Section */}
              {selectedTemplate && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-205 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Mode & Tim Penguji</span>
                    <div className="flex gap-1">
                      {(['Tunggal', 'Ganda', 'Tim'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setModelPengujian(mode);
                            // Set intelligent defaults if changing mode
                            if (mode !== 'Tunggal' && !selectedKetuaId) {
                              const firstExp = filteredExaminers[0];
                              if (firstExp) setSelectedKetuaId(firstExp.id);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${modelPengujian === mode ? 'bg-emerald-810 bg-emerald-800 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          Penguji {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Examiner Penunjukan fields (Only shown when mode !== 'Tunggal') */}
                  {modelPengujian !== ('Tunggal' as any) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-widest mb-1">Ketua Penguji / Penguji Utama</label>
                        <select
                          value={selectedKetuaId}
                          onChange={(e) => {
                            setSelectedKetuaId(e.target.value);
                            // Ensure it's not in anggota list too
                            setSelectedAnggotaIds(prev => prev.filter(a => a !== e.target.value));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                          required={modelPengujian !== ('Tunggal' as any)}
                        >
                          <option value="">-- Pilih Ketua Penguji --</option>
                          {filteredExaminers.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.namaLengkap} ({ex.kompetensiGuru?.join(', ')})</option>
                          ))}
                        </select>
                        <span className="text-[9px] text-slate-400 mt-1 block leading-tight">
                          *Menampilkan guru ber-peran <strong>Penguji Assessment</strong> {templateKategori ? `dengan kompetensi <strong>${templateKategori}</strong>` : ''}
                        </span>
                      </div>

                      {modelPengujian === 'Tim' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-widest mb-1">Anggota Tim Penguji (Multi-Pilih)</label>
                          <div className="border border-slate-200 rounded-lg p-2 max-h-[110px] overflow-y-auto space-y-1 bg-slate-50">
                            {filteredExaminers.filter(ex => ex.id !== selectedKetuaId).map(ex => {
                              const isSelected = selectedAnggotaIds.includes(ex.id);
                              return (
                                <label key={ex.id} className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedAnggotaIds(selectedAnggotaIds.filter(id => id !== ex.id));
                                      } else {
                                        setSelectedAnggotaIds([...selectedAnggotaIds, ex.id]);
                                      }
                                    }}
                                    className="accent-emerald-600 rounded"
                                  />
                                  <span>{ex.namaLengkap}</span>
                                </label>
                              );
                            })}
                            {filteredExaminers.filter(ex => ex.id !== selectedKetuaId).length === 0 && (
                              <span className="text-[10px] text-slate-400 italic">Tidak ada guru penguji lainnya</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grading panel based on model */}
                  {modelPengujian === 'Ganda' && (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3 shadow-sm">
                      <h5 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b pb-1.5">Input Penilaian Penguji Ganda</h5>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Nilai Penguji 1 (Ketua)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={nilaiPenguji1}
                            onChange={(e) => setNilaiPenguji1(Number(e.target.value))}
                            onBlur={(e) => {
                              const num = parseFloat(e.target.value) || 0;
                              setNilaiPenguji1(Math.ceil(Math.max(0, Math.min(100, num)) * 2) / 2);
                            }}
                            className="bg-slate-50 border border-slate-200 p-2 w-full text-center font-extrabold rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Nilai Penguji 2</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={nilaiPenguji2}
                            onChange={(e) => setNilaiPenguji2(Number(e.target.value))}
                            onBlur={(e) => {
                              const num = parseFloat(e.target.value) || 0;
                              setNilaiPenguji2(Math.ceil(Math.max(0, Math.min(100, num)) * 2) / 2);
                            }}
                            className="bg-slate-50 border border-slate-200 p-2 w-full text-center font-extrabold rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Keputusan Nilai Akhir</label>
                          <select
                            value={nilaiAkhirMethod}
                            onChange={(e) => setNilaiAkhirMethod(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Rerata">Rata-rata Seluruh Penguji</option>
                            <option value="Ketua">Gunakan Nilai Penguji 1 (Ketua)</option>
                            <option value="Musyawarah">Musyawarah Tim Penguji (Input Manual)</option>
                          </select>
                        </div>
                        {nilaiAkhirMethod === 'Musyawarah' && (
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">Skor Hasil Musyawarah</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={manualFinalScore}
                              onChange={(e) => setManualFinalScore(Number(e.target.value))}
                              onBlur={(e) => {
                                const num = parseFloat(e.target.value) || 0;
                                setManualFinalScore(Math.ceil(Math.max(0, Math.min(100, num)) * 2) / 2);
                              }}
                              className="bg-emerald-50/50 border border-emerald-200 p-1.5 w-full text-center font-black rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {modelPengujian === 'Tim' && (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3 shadow-sm">
                      <h5 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b pb-1.5">Input Penilaian Tim Penguji</h5>
                      
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {[selectedKetuaId, ...selectedAnggotaIds].filter(Boolean).map((gid, index) => {
                          const gx = gurus.find(g => g.id === gid);
                          if (!gx) return null;
                          const isKetua = gid === selectedKetuaId;
                          return (
                            <div key={gid} className={`p-2 rounded-lg border ${isKetua ? 'border-emerald-250 bg-emerald-55 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/40'}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-slate-800">
                                  {gx.namaLengkap} <span className="text-[10px] font-medium text-slate-500">({isKetua ? 'Ketua' : `Anggota ${index}`})</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-400">Skor:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    value={nilaiPerPenguji[gid] !== undefined ? nilaiPerPenguji[gid] : 100}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setNilaiPerPenguji(prev => ({ ...prev, [gid]: val }));
                                    }}
                                    onBlur={(e) => {
                                      const num = parseFloat(e.target.value) || 0;
                                      const rounded = Math.ceil(Math.max(0, Math.min(100, num)) * 2) / 2;
                                      setNilaiPerPenguji(prev => ({ ...prev, [gid]: rounded }));
                                    }}
                                    className="bg-white border border-slate-250 w-12 p-0.5 text-center font-bold rounded text-xs focus:ring-1 focus:ring-emerald-500"
                                    required
                                  />
                                </div>
                              </div>
                              <input
                                type="text"
                                placeholder={`Catatan evaluasi khusus dari ${isKetua ? 'Ketua' : `Anggota ${index}`}...`}
                                value={catatanPerPenguji[gid] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCatatanPerPenguji(prev => ({ ...prev, [gid]: val }));
                                }}
                                className="w-full bg-white border border-slate-150 rounded p-1 text-[10px]"
                              />
                            </div>
                          );
                        })}
                        {[selectedKetuaId, ...selectedAnggotaIds].filter(Boolean).length === 0 && (
                          <div className="text-center py-4 text-slate-405 text-xs italic">
                            Harap pilih Ketua Penguji terlebih dahulu di atas
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-widest mb-1">Keputusan Nilai Akhir</label>
                          <select
                            value={nilaiAkhirMethod}
                            onChange={(e) => setNilaiAkhirMethod(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-505"
                          >
                            <option value="Rerata">Rata-rata Seluruh Penguji</option>
                            <option value="Ketua">Gunakan Nilai Ketua Penguji</option>
                            <option value="Musyawarah">Musyawarah Tim Penguji (Input Manual)</option>
                          </select>
                        </div>
                        {nilaiAkhirMethod === 'Musyawarah' && (
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">Skor Hasil Musyawarah</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={manualFinalScore}
                              onChange={(e) => setManualFinalScore(Number(e.target.value))}
                              onBlur={(e) => {
                                const num = parseFloat(e.target.value) || 0;
                                setManualFinalScore(Math.ceil(Math.max(0, Math.min(100, num)) * 2) / 2);
                              }}
                              className="bg-emerald-50/50 border border-emerald-200 p-1.5 w-full text-center font-black rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

               {/* Rubric Score Enters (Only shown for Single Examiner mode) */}
              {selectedTemplate && modelPengujian === 'Tunggal' && (
                <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Input Nilai Per Kriteria Uji:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {((selectedTemplate as any).rubrikNilai || (selectedTemplate as any).rubrik || []).map((rub: any, idx: number) => {
                      const rubName = rub.namaKriteria || rub.kriteria || `Kriteria ${idx + 1}`;
                      const isDeductionMode = selectedTemplate.modePenilaian === 'PenguranganKesalahan';
                      const mistakeVal = mistakes[rubName] !== undefined ? mistakes[rubName] : 0;
                      const basePoinDeduction = rub.poinPengurangan !== undefined ? rub.poinPengurangan : 5;
                      const calculatedPoin = Math.max(0, (rub.bobotPersen || 0) - (mistakeVal * basePoinDeduction));
                      return (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between gap-2.5">
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{rubName}</span>
                            <div className="flex flex-wrap gap-1.5 items-center mt-1">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">Bobot {rub.bobotPersen}%</span>
                              {isDeductionMode && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">-{basePoinDeduction} per kesalahan</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-50 pt-2.5 mt-1">
                            {isDeductionMode ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Salah:</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="0"
                                    value={mistakeVal}
                                    onChange={(e) => handleMistakeChange(rubName, e.target.value, rub.bobotPersen || 0, basePoinDeduction)}
                                    className="bg-rose-50/50 text-rose-700 border border-rose-100 p-1 text-center w-12 font-extrabold rounded text-xs focus:ring-1 focus:ring-rose-500 focus:bg-white"
                                    required
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">kali</span>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  <p className="text-[9px] text-slate-400 font-bold leading-none mb-1">NILAI AKHIR</p>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="any"
                                      value={scores[rubName] !== undefined ? scores[rubName] : 100}
                                      onChange={(e) => setScores(prev => ({ ...prev, [rubName]: Number(e.target.value) }))}
                                      onBlur={(e) => handleManualScoreBlur(rubName, e.target.value)}
                                      className="bg-gray-50 text-slate-900 border border-gray-200 p-1 text-center w-16 font-extrabold rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                                    />
                                    <span className="text-[10px] text-gray-400 font-normal leading-none">/ 100</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Input Nilai:</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    placeholder="Nilai"
                                    value={scores[rubName] !== undefined ? scores[rubName] : 100}
                                    onChange={(e) => setScores(prev => ({ ...prev, [rubName]: Number(e.target.value) }))}
                                    onBlur={(e) => handleManualScoreBlur(rubName, e.target.value)}
                                    className="bg-gray-50 text-slate-900 border border-gray-200 p-1 text-center w-14 font-extrabold rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                                    required
                                  />
                                  <span className="text-xs text-slate-400 font-bold">/100</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* General Calculations Dashboard */}
              {selectedTemplate && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div>
                    <span className="text-xs text-slate-500 block font-semibold">Kriteria Penilaian: <strong className="text-emerald-700">Min. {minimalPassingScore}</strong></span>
                    <div className="text-xs text-slate-700 mt-1">
                      Kalkulasi Nilai Akhir: <strong className="text-sm font-extrabold text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">{finalScore}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCandidatePassed ? (
                      <span className="bg-emerald-100 text-emerald-850 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Lulus (Sesuai Kriteria)
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                        Belum Lulus
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* INTERACTIVE AL-QUR'AN LIVE TESTING CONSOLE */}
              {isInternalQuranExam && (
                <div className="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-4 space-y-4 shadow-inner">
                  <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                    <BookOpen className="h-5 w-5 text-emerald-700 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">CONSOLE ASSESSMENT AL-QUR'AN LIVE</h4>
                      <p className="text-[10px] text-emerald-800">
                        Cakupan Target: <strong>{activeCorrelatedJenis?.quranJuz ? `Juz ${activeCorrelatedJenis.quranJuz}` : 'Semua Juz/Umum'}</strong> • {
                          multiSuratStart && multiSuratEnd 
                            ? `Rentang Surat: Surah ${multiSuratStart} s/d Surah ${multiSuratEnd}`
                            : activeCorrelatedJenis?.quranSurat 
                              ? `Surat ${activeCorrelatedJenis.quranSurat}` 
                              : 'Semua Surat'
                        }
                      </p>
                    </div>
                  </div>

                  {/* RENTANG SURAT (MULTI SURAT) CONSOLE */}
                  <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-4 rounded-xl space-y-3.5 shadow-md border border-emerald-700/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-emerald-300" />
                          <h5 className="text-xs font-black uppercase tracking-wider text-emerald-100">
                            {quranMode === 'kustom' || customSurahNames.length > 0
                              ? 'DAFTAR BEBERAPA SURAT UJIAN (MULTI-SURAT KUSTOM / QIRAAH-WAJIB)'
                              : 'RENTANG SURAT (MULTI SURAT) UJIAN'}
                          </h5>
                          {activeSurahList.length > 0 && (
                            <span className="bg-emerald-700 text-emerald-100 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/50">
                              {activeSurahList.length} Surat Target
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-200 mt-1 font-medium">
                          {quranMode === 'kustom' || customSurahNames.length > 0 ? (
                            <>
                              Ditetapkan Admin: <span className="font-extrabold text-white bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-600">Paket Kustom ({activeSurahList.length} Surat)</span>:{' '}
                              <span className="text-emerald-100 italic">{activeSurahList.map(s => s.nama).join(', ')}</span>
                            </>
                          ) : multiSuratStart && multiSuratEnd ? (
                            <>
                              Ditetapkan Admin: <span className="font-extrabold text-white bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-600">DARI: Surah {multiSuratStart}</span> ➔ <span className="font-extrabold text-white bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-600">HINGGA: Surah {multiSuratEnd}</span>
                            </>
                          ) : singleSurat ? (
                            <>Ditetapkan Admin: <span className="font-extrabold text-white bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-600">Surah {singleSurat}</span></>
                          ) : (
                            'Ditetapkan Admin: Semua Surat Al-Qur\'an (Umum)'
                          )}
                        </p>
                      </div>

                      {activeSurahList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const allSurahNames = activeSurahList.map(s => `Surah ${s.nama}`).join(', ');
                            const text = `Uji Paket Multi Surat (${activeSurahList.length} Surat): ${allSurahNames} - Lulus Pengujian`;
                            if (!cuesTested.includes(text)) {
                              setCuesTested(prev => [...prev, text]);
                            }
                          }}
                          className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg shadow transition-colors flex items-center gap-1 shrink-0 self-start sm:self-center"
                        >
                          <span>✓ Tandai Semua Surat Diuji</span>
                        </button>
                      )}
                    </div>

                    {/* Grid of Surahs in Range */}
                    {activeSurahList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {activeSurahList.map((surah) => {
                          const isMarked = cuesTested.some(c => new RegExp(`Surah ${surah.nama}\\b`, 'i').test(c));
                          return (
                            <div
                              key={surah.no}
                              className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                                isMarked 
                                  ? 'bg-emerald-800/90 border-emerald-300 text-white shadow-md ring-1 ring-emerald-400' 
                                  : 'bg-emerald-950/70 border-emerald-700/80 text-emerald-100 hover:border-emerald-500'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[9px] font-black uppercase bg-emerald-700/90 text-emerald-100 px-2 py-0.5 rounded">
                                    Surat ke-{surah.no}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-300">
                                    {surah.ayat} Ayat
                                  </span>
                                </div>
                                <div className="font-black text-sm text-white flex items-center justify-between mt-1">
                                  <span>Surah {surah.nama}</span>
                                  {isMarked && (
                                    <span className="text-[10px] bg-emerald-400 text-emerald-950 font-black px-1.5 py-0.5 rounded-full">
                                      ✓ Diuji
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-emerald-700/60 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveExamSurah({ nama: surah.nama, no: surah.no, ayat: surah.ayat });
                                    const text = `Surah ${surah.nama} (Surat ke-${surah.no}, ${surah.ayat} Ayat) - Ujian Surah Aktif`;
                                    if (!cuesTested.includes(text)) {
                                      setCuesTested(prev => [...prev, text]);
                                    }
                                    setTimeout(() => {
                                      document.getElementById("live-mushaf-exam-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }, 100);
                                  }}
                                  className={`w-full text-[10px] font-bold py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1 ${
                                    activeExamSurah?.nama === surah.nama
                                      ? 'bg-amber-400 text-amber-950 hover:bg-amber-300 ring-2 ring-amber-500 font-extrabold shadow-md'
                                      : isMarked
                                        ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'
                                        : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                  }`}
                                >
                                  {activeExamSurah?.nama === surah.nama
                                    ? '📖 Pratinjau Aktif (Uji Surah)'
                                    : isMarked
                                      ? '✓ Diuji (Klik Pratinjau)'
                                      : '+ Uji Surah Ini'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-xs text-emerald-200 bg-emerald-950/40 rounded-lg border border-emerald-800 font-medium">
                        Admin belum menentukan batasan Rentang Surat (Multi Surat) spesifik pada Jenis/Template Assessment ini.
                      </div>
                    )}
                  </div>

                  {/* Tilawah (Reading) Section */}
                  {selectedTemplate?.namaTemplate.toLowerCase().includes('tilawah') || activeCorrelatedJenis?.kategori === KategoriAssessment.TILAWAH ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 uppercase tracking-wider pb-1 border-b border-gray-100">
                        <span>A) Ujian Tilawah (Metode: {activeCorrelatedJenis?.quranHalamanUjianOption === 'guru' ? 'Ditentukan Guru' : activeCorrelatedJenis?.quranHalamanUjianOption === 'acak' ? 'Acak Otomatis' : 'Kombinasi'})</span>
                        <span className="text-emerald-700">Min: {activeCorrelatedJenis?.quranHalamanUjianCount || 3} Halaman</span>
                      </div>

                      {/* Config-driven selection */}
                      {(activeCorrelatedJenis?.quranHalamanUjianOption === 'guru' || activeCorrelatedJenis?.quranHalamanUjianOption === 'kombinasi') && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="604"
                            placeholder="Ketik Halaman (1-604)"
                            value={halamanInputSatu}
                            onChange={(e) => setHalamanInputSatu(e.target.value)}
                            className="bg-white border border-gray-200 p-1.5 text-xs w-36 rounded-lg text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const pg = parseInt(halamanInputSatu);
                              if (pg >= 1 && pg <= 604 && !siswaSelectedHalaman.includes(pg)) {
                                setSiswaSelectedHalaman(prev => [...prev, pg].sort((a,b)=>a-b));
                                setHalamanInputSatu('');
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            + Tambah Halaman
                          </button>
                        </div>
                      )}

                      {/* Dice randomizer button */}
                      {(activeCorrelatedJenis?.quranHalamanUjianOption === 'acak' || activeCorrelatedJenis?.quranHalamanUjianOption === 'kombinasi') && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const targetCount = activeCorrelatedJenis?.quranHalamanUjianCount || 3;
                              const minP = activeCorrelatedJenis?.quranRentangHalamanStart || 1;
                              const maxP = activeCorrelatedJenis?.quranRentangHalamanEnd || 604;
                              const temp: number[] = [];
                              
                              // Generate unique pages in range
                              const rangeSize = maxP - minP + 1;
                              const iterations = Math.min(targetCount, rangeSize);
                              
                              while (temp.length < iterations) {
                                const r = Math.floor(Math.random() * rangeSize) + minP;
                                if (!temp.includes(r)) {
                                  temp.push(r);
                                }
                              }
                              setSiswaSelectedHalaman(temp.sort((a,b)=>a-b));
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <Dice5 className="h-4 w-4 animate-spin" />
                            🎲 Acak {activeCorrelatedJenis?.quranHalamanUjianCount || 3} Halaman Otomatis (Sistem)
                          </button>
                        </div>
                      )}

                      {/* Display Selected Pages with calculated Juz information */}
                      {siswaSelectedHalaman.length > 0 && (
                        <div className="bg-white/80 p-3 rounded-xl border border-gray-150 space-y-2">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Daftar Lembar Halaman di Uji:</div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {siswaSelectedHalaman.map((page, idx) => {
                              // Standard estimation of Juz based on 20 pages per juz starting page 2
                              let juzNum = 1;
                              if (page > 1) {
                                juzNum = page >= 582 ? 30 : Math.min(30, Math.floor((page - 2) / 20) + 1);
                              }
                              return (
                                <span key={idx} className="bg-emerald-50 text-emerald-950 font-bold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                  <span>Hal {page} (Juz {juzNum})</span>
                                  <button
                                    type="button"
                                    onClick={() => setSiswaSelectedHalaman(prev => prev.filter(p => p !== page))}
                                    className="text-emerald-700 hover:text-red-500 font-extrabold ml-1 w-3 h-3 flex items-center justify-center rounded-full hover:bg-red-50"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Tahfidz (Hafalan) Section */}
                  {selectedTemplate?.namaTemplate.toLowerCase().includes('tahfidz') || activeCorrelatedJenis?.kategori === KategoriAssessment.TAHFIDZ || selectedTemplate?.namaTemplate.toLowerCase().includes('tasmi') ? (
                    <div className="space-y-3.5 border-t border-emerald-100/50 pt-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 uppercase tracking-wider pb-1 border-b border-gray-100">
                        <span>B) Ujian Tahfidz (Metode: {activeCorrelatedJenis?.quranMetodeTahfidz || 'Sambung Ayat'})</span>
                        {activeCorrelatedJenis?.quranMetodeTahfidz === 'Acak Otomatis' && <span className="text-emerald-700">{activeCorrelatedJenis?.quranTahfidzJumlahSoal || 10} Soal</span>}
                      </div>

                      {/* 1. Sambung Ayat Preset Console */}
                      {(activeCorrelatedJenis?.quranMetodeTahfidz === 'Sambung Ayat' || activeCorrelatedJenis?.quranMetodeTahfidz === 'Gabungan' || !activeCorrelatedJenis?.quranMetodeTahfidz) && (
                        <div className="space-y-2">
                          <span className="text-[10px] text-gray-500 font-bold block">Simulator Soal Sambung Ayat:</span>
                          <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {SAMBUNG_AYAT_PRESETS.map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  const text = `Uji Sambung Ayat: ${p.surah} Ayat ${p.ayat} -> Potongan Cembung: "${p.text}". Target Menyambung: "${p.next}"`;
                                  if (!cuesTested.includes(text)) {
                                    setCuesTested(prev => [...prev, text]);
                                  }
                                }}
                                className="text-[10px] text-left p-1.5 rounded border border-gray-250 bg-white hover:bg-emerald-50 hover:border-emerald-250 font-sans truncate"
                              >
                                {p.surah} Ayat {p.ayat}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const p = SAMBUNG_AYAT_PRESETS[Math.floor(Math.random() * SAMBUNG_AYAT_PRESETS.length)];
                                const text = `Uji Sambung Ayat: ${p.surah} Ayat ${p.ayat} -> Potongan Cembung: "${p.text}". Target Menyambung: "${p.next}"`;
                                setCuesTested(prev => [...prev, text]);
                              }}
                              className="text-[9.5px] bg-slate-100 hover:bg-emerald-100 border border-gray-200 text-gray-700 hover:text-emerald-900 font-extrabold px-2.5 py-1 rounded"
                            >
                              🎲 Acak Soal Instan
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. Sambung Surat Console */}
                      {activeCorrelatedJenis?.quranMetodeTahfidz === 'Sambung Surat' && (
                        <div className="space-y-2 bg-white/70 p-2.5 rounded-lg border border-gray-200">
                          <span className="text-[10px] text-gray-500 font-bold block">Aturan Sambung Surat:</span>
                          <div className="text-xs text-gray-800 leading-relaxed font-sans">
                            Siswa diminta membacakan satu surat lengkap (e.g., Al-Infitar), guru menghentikan pembacaan di tengah ayat, dan meminta siswa menyambung ke surat berikutnya (e.g., Al-Mutaffifin).
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const rIndex = Math.floor(Math.random() * (QURAN_SURAHS.length - 2)) + 77; // Juz 30 range suras
                              const s1 = QURAN_SURAHS[rIndex].nama;
                              const s2 = QURAN_SURAHS[rIndex + 1].nama;
                              const ranAyat = Math.floor(Math.random()*QURAN_SURAHS[rIndex].ayat) + 1;
                              const promptText = `Uji Sambung Surat: Membaca Surat ${s1} Ayat ${ranAyat}, lalu disambung ke awal Surat ${s2}`;
                              if (!cuesTested.includes(promptText)) {
                                setCuesTested(prev => [...prev, promptText]);
                              }
                            }}
                            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded transition-colors"
                          >
                            🎯 Acak Titik Berhenti & Sambung Surat
                          </button>
                        </div>
                      )}

                      {/* 3. Automatic Random Questionnaire Simulator */}
                      {activeCorrelatedJenis?.quranMetodeTahfidz === 'Acak Otomatis' && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Aksi Soal Acak Tahfidz ({activeCorrelatedJenis?.quranTahfidzJumlahSoal || 10} Soal):</span>
                            <button
                              type="button"
                              onClick={() => {
                                const count = activeCorrelatedJenis?.quranTahfidzJumlahSoal || 10;
                                const questionsList: Array<{
                                  id: number;
                                  surah: string;
                                  ayat: number;
                                  prompt: string;
                                  keyAnswer?: string;
                                  rating?: 'lancar' | 'lupa' | 'salah';
                                }> = [];

                                for (let i = 1; i <= count; i++) {
                                  // Pick random surah from activeSurahList if configured, otherwise QURAN_SURAHS
                                  const surahPool = activeSurahList.length > 0 ? activeSurahList : QURAN_SURAHS;
                                  const randomSurahObj = surahPool[Math.floor(Math.random() * surahPool.length)];
                                  const randomAyatNum = Math.floor(Math.random() * randomSurahObj.ayat) + 1;
                                  
                                  const matchingPreset = SAMBUNG_AYAT_PRESETS.find(p => p.surah === randomSurahObj.nama);
                                  
                                  questionsList.push({
                                    id: i,
                                    surah: randomSurahObj.nama,
                                    ayat: randomAyatNum,
                                    prompt: matchingPreset ? `Bacakan lanjutan potongan ayat berikut: "${matchingPreset.text}" ...` : `Lanjutkan hafalan Surat ${randomSurahObj.nama} mulai dari Ayat ${randomAyatNum}`,
                                    keyAnswer: matchingPreset ? matchingPreset.next : undefined,
                                    rating: 'lancar'
                                  });
                                }
                                setTahfidzAcakQuestions(questionsList);
                              }}
                              className="text-[9.5px] bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded font-extrabold flex items-center gap-1"
                            >
                              <Shuffle className="h-3.5 w-3.5" />
                              Generate Lembar {activeCorrelatedJenis?.quranTahfidzJumlahSoal || 10} Soal Acak
                            </button>
                          </div>

                          {tahfidzAcakQuestions.length > 0 && (
                            <div className="bg-white rounded-xl p-3 border border-gray-150 space-y-2.5 shadow-sm max-h-48 overflow-y-auto">
                              {tahfidzAcakQuestions.map((q, idx) => (
                                <div key={q.id} className="text-xs bg-gray-50/50 p-2 rounded-lg border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                  <div className="space-y-0.5 max-w-[70%]">
                                    <div className="font-extrabold text-gray-900">Soal {q.id}: {q.surah} Ayat {q.ayat}</div>
                                    <div className="text-[11px] text-gray-600 font-sans italic">{q.prompt}</div>
                                    {q.keyAnswer && <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1 py-0.5 rounded inline-block mt-1 font-sans">Kunci: {q.keyAnswer}</div>}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTahfidzAcakQuestions(prev => prev.map(item => item.id === q.id ? { ...item, rating: 'lancar' } : item));
                                      }}
                                      className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${q.rating === 'lancar' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-gray-500 border-gray-250 hover:bg-slate-50'}`}
                                    >
                                      🟢 Lancar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTahfidzAcakQuestions(prev => prev.map(item => item.id === q.id ? { ...item, rating: 'lupa' } : item));
                                      }}
                                      className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${q.rating === 'lupa' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-gray-500 border-gray-250 hover:bg-slate-50'}`}
                                    >
                                      🟡 Lupa
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTahfidzAcakQuestions(prev => prev.map(item => item.id === q.id ? { ...item, rating: 'salah' } : item));
                                      }}
                                      className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${q.rating === 'salah' ? 'bg-red-100 text-red-850 border-red-350' : 'bg-white text-gray-500 border-gray-250 hover:bg-slate-50'}`}
                                    >
                                      🔴 Salah
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* Suggestion & Grade Application */}
                              <div className="flex items-center justify-between border-t border-gray-100 pt-2 bg-emerald-50/40 p-2 rounded-lg mt-2">
                                <div className="text-[10px] font-extrabold text-emerald-950">
                                  Rata-Rata Sukses: <span className="text-sm font-black text-emerald-700">
                                    {Math.round(
                                      (tahfidzAcakQuestions.filter(q=>q.rating==='lancar').length * 100 +
                                       tahfidzAcakQuestions.filter(q=>q.rating==='lupa').length * 60 +
                                       tahfidzAcakQuestions.filter(q=>q.rating==='salah').length * 20) /
                                       tahfidzAcakQuestions.length
                                    )} / 100
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Calculate computed score
                                    const lancarC = tahfidzAcakQuestions.filter(q=>q.rating==='lancar').length;
                                    const lupaC = tahfidzAcakQuestions.filter(q=>q.rating==='lupa').length;
                                    const salahC = tahfidzAcakQuestions.filter(q=>q.rating==='salah').length;
                                    const totalS = lancarC * 100 + lupaC * 60 + salahC * 20;
                                    const grade = Math.round(totalS / tahfidzAcakQuestions.length);

                                    // Apply to first or relevant Hafalan/Kelancaran rubric
                                    if (selectedTemplate) {
                                      const updatedScores = { ...scores };
                                      const tplRubrik = (selectedTemplate as any).rubrikNilai || (selectedTemplate as any).rubrik || [];
                                      tplRubrik.forEach((rubObj: any) => {
                                        const cName = rubObj.namaKriteria || rubObj.kriteria || '';
                                        if (cName.toLowerCase().includes('hafal') || cName.toLowerCase().includes('lancar') || cName.toLowerCase().includes('baca')) {
                                          updatedScores[cName] = grade;
                                        }
                                      });
                                      setScores(updatedScores);
                                    }
                                  }}
                                  className="text-[9.5px] bg-emerald-705 border border-emerald-300 text-emerald-800 font-bold px-2.5 py-1 rounded hover:bg-emerald-100"
                                >
                                  🎯 Terapkan ke Rubrik Kelancaran
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Display tested log references */}
                      {cuesTested.length > 0 && (
                        <div className="bg-white/90 p-2 rounded-lg border border-gray-200 space-y-1 max-h-24 overflow-y-auto">
                          <span className="text-[9px] font-extrabold text-gray-500 uppercase block">Log Soal Diujikan ({cuesTested.length}):</span>
                          {cuesTested.map((cue, cIdx) => (
                            <div key={cIdx} className="text-[10px] text-gray-700 font-sans truncate flex justify-between border-b border-gray-50 pb-0.5">
                              <span>• {cue.split('->')[0]}</span>
                              <button
                                type="button"
                                onClick={() => setCuesTested(prev => prev.filter((_,idx)=>idx!==cIdx))}
                                className="text-red-500 hover:text-red-700 w-3 h-3 flex items-center justify-center font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* INDEPENDENT SEPARATED BLOCK: PRATINJAU SURAH INTERAKTIF LIVE */}
              {activeExamSurah && (
                <div id="live-mushaf-exam-preview" className="p-5 sm:p-7 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md space-y-4 text-left relative" dir="ltr">
                  {/* Header matching Input Setoran */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-850">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block tracking-widest font-mono uppercase flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                        PRATINJAU SURAH INTERAKTIF LIVE
                        <span className="font-sans font-black text-amber-900 dark:text-amber-300 ml-1 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md">
                          SURAH {activeExamSurah.nama.toUpperCase()}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans italic mt-1">
                        Surat ke-{activeExamSurah.no} • {activeExamSurah.ayat} Ayat • Mushaf digital interaktif untuk menyimak &amp; mencatat koreksi hafalan santri
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center shrink-0 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-1 rounded-xl shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setExamQuranZoom(prev => Math.max(80, prev - 10))}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 transition cursor-pointer"
                          title="Perkecil Font"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamQuranZoom(100)}
                          className="px-2 h-7 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 transition cursor-pointer"
                          title="Reset ke 100%"
                        >
                          {examQuranZoom}%
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamQuranZoom(prev => Math.min(200, prev + 10))}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 transition cursor-pointer"
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
                          value={examQuranZoom}
                          onChange={(e) => setExamQuranZoom(Number(e.target.value))}
                          className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                          title="Geser Ukuran Huruf"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveExamSurah(null)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                      >
                        ✕ Tutup Pratinjau
                      </button>
                    </div>
                  </div>

                  {/* Spacious Mushaf Display Container matching Input Setoran */}
                  <div 
                    className="text-right p-6 sm:p-8 md:p-10 bg-[#fdfcf7] dark:bg-slate-950 rounded-2xl border-2 border-[#e6decb] dark:border-slate-800 font-serif max-h-[550px] overflow-y-auto shadow-inner" 
                    dir="rtl" 
                    title="Klik kata/huruf untuk memberi koreksi"
                  >
                    {activeExamSurah.no !== 9 && activeExamSurah.no !== 1 && (
                      <div className="text-center pb-6 pt-1" dir="rtl">
                        <p 
                          className="font-mushaf font-serif text-slate-800 dark:text-emerald-400 font-normal select-none"
                          style={{ fontSize: `${(examQuranZoom / 100) * 1.85}rem`, lineHeight: '2.4' }}
                        >
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </p>
                      </div>
                    )}

                    {(() => {
                      const verses = getSurahVerses(activeExamSurah.nama, activeExamSurah.ayat, moduls);
                      return verses.length > 0 ? (
                        <div className="text-justify leading-[2.5] sm:leading-[2.7] whitespace-normal break-words w-full" style={{ textAlignLast: 'center' }}>
                          {verses.map((v: any) => {
                            const rawWords = formatArabicFontClean(v.teksArab || '').split(/\s+/).filter(Boolean);
                            const words: string[] = [];
                            for (const rw of rawWords) {
                              if (/^[\u06D6-\u06DC\u06DF-\u06E8\u08D4-\u08EA\u0610-\u061A]+$/.test(rw) && words.length > 0) {
                                words[words.length - 1] = `${words[words.length - 1]} ${rw}`;
                              } else {
                                words.push(rw);
                              }
                            }
                            const verseKey = `exam-quran-${activeExamSurah.nama}-${v.nomorAyat}-verse`;
                            const isVerseSelected = selectedExamHighlightKeys.includes(verseKey);
                            const currentStudentComments = selectedStudent 
                              ? examInteractiveComments.filter(c => !c.siswaId || c.siswaId === selectedStudent.id)
                              : examInteractiveComments;
                            const hasVerseComment = currentStudentComments.some(c => c.targetKey === verseKey || (c.targetKey && c.targetKey.split(',').includes(verseKey)) || new RegExp(`Ayat ${v.nomorAyat}\\b`).test(c.target));

                            return (
                              <span key={v.nomorAyat} className="inline">
                                {words.map((word: string, wordIdx: number) => {
                                  const wordKey = `exam-quran-${activeExamSurah.nama}-${v.nomorAyat}-${wordIdx}`;
                                  const isWordSelected = selectedExamHighlightKeys.includes(wordKey);
                                  const hasWordComment = currentStudentComments.some(c => c.targetKey === wordKey || (c.targetKey && c.targetKey.split(',').includes(wordKey)));

                                  return (
                                    <span
                                      key={wordIdx}
                                      onClick={() => handleToggleExamWord(activeExamSurah.nama, v.nomorAyat, wordIdx, word)}
                                      style={{ fontSize: `${(examQuranZoom / 100) * 1.85}rem` }}
                                      className={`font-mushaf font-serif inline-block cursor-pointer transition-all duration-150 rounded-lg mx-[2px] px-[3px] py-0.5 select-none align-middle ${
                                        isWordSelected
                                          ? 'bg-amber-300 text-amber-950 dark:bg-amber-500 dark:text-amber-950 ring-2 ring-amber-600 font-bold scale-105 shadow-sm'
                                          : hasWordComment
                                            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-b-2 border-rose-500 font-medium scale-[1.01]'
                                            : 'text-slate-900 dark:text-emerald-400 hover:bg-emerald-100/40 dark:hover:bg-slate-800/80'
                                      }`}
                                      title={hasWordComment ? 'Kata ini memiliki catatan koreksi' : 'Klik kata ini untuk beri koreksi'}
                                    >
                                      {word}
                                    </span>
                                  );
                                })}

                                {/* Verse Circle Badge */}
                                <span
                                  onClick={() => handleToggleExamVerse(activeExamSurah.nama, v.nomorAyat)}
                                  className={`inline-flex items-center justify-center select-none font-mushaf font-serif mx-1.5 rounded-full border cursor-pointer transition-all duration-200 w-9 h-9 align-middle text-center shrink-0 shadow-xs relative ${
                                    isVerseSelected
                                      ? 'bg-amber-400 text-amber-950 border-amber-600 dark:bg-amber-500 dark:text-amber-950 font-black shadow-md scale-110 ring-2 ring-amber-400'
                                      : hasVerseComment
                                        ? 'bg-rose-600 text-white border-rose-700 dark:bg-rose-600 dark:border-rose-500 font-black shadow-sm scale-105 ring-2 ring-rose-400/80'
                                        : 'border-[#c5a880] dark:border-amber-600/80 bg-[#fdfcf7] dark:bg-slate-900 text-slate-800 dark:text-emerald-400 font-bold hover:bg-amber-100 hover:border-amber-500 dark:hover:bg-slate-800 hover:scale-105'
                                  }`}
                                  style={{ 
                                    fontSize: `${(examQuranZoom / 100) * 1.05}rem`,
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
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 text-center font-mono py-2 italic w-full">Teks ayat surah tidak ditemukan. Silakan cek database modul.</p>
                      );
                    })()}
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1 text-left">
                    * Petunjuk: Klik salah satu **kata** untuk koreksi tajwid/huruf, atau klik **nomor ayat (simbol lingkaran)** untuk menandai **ayat tersendat / tidak lancar**.
                  </p>

                  {/* Dynamic Correction Panel placed below the Mushaf */}
                  {selectedExamHighlightKeys.length > 0 ? (
                    <div className="mt-3 p-3.5 sm:p-4 bg-amber-50/90 dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl space-y-3 shadow-xs text-left animate-fade-in" dir="ltr">
                      {/* Header: Target & Cancel */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-2xs">
                            PANEL KOREKSI
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            📍 Target: <span className="bg-amber-200 dark:bg-amber-800/60 text-amber-950 dark:text-amber-200 px-2 py-0.5 rounded font-extrabold">{selectedExamHighlightTexts.join(' ')}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={clearExamSelection}
                          className="text-[10px] bg-white dark:bg-slate-800 text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded font-bold cursor-pointer transition"
                        >
                          ✕ Batal Pilih Target
                        </button>
                      </div>

                      {/* Detailed Form (Category picker & custom notes) */}
                      <div className="pt-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400">Kategori Kesalahan:</span>
                            <button
                              type="button"
                              onClick={() => setShowExamCategoryPicker(!showExamCategoryPicker)}
                              className="px-2.5 py-1 bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-slate-700 font-bold text-xs rounded-lg shadow-2xs hover:bg-amber-50 flex items-center gap-1 cursor-pointer"
                            >
                              <span>{selectedExamSubCategory ? `${selectedExamCategory} (${selectedExamSubCategory})` : selectedExamCategory}</span>
                              <span className="text-[10px]">▾</span>
                            </button>
                          </div>
                        </div>

                        {/* Category Picker dropdown if toggled */}
                        {showExamCategoryPicker && (
                          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-300 dark:border-slate-700 space-y-2 animate-fade-in shadow-xs">
                            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
                              {availableExamCategories.map(cat => (
                                <button
                                  key={cat.name}
                                  type="button"
                                  onClick={() => {
                                    setSelectedExamCategory(cat.name);
                                    setSelectedExamSubCategory('');
                                    if (!cat.subcategories || cat.subcategories.length === 0) {
                                      setShowExamCategoryPicker(false);
                                    }
                                  }}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                    selectedExamCategory === cat.name
                                      ? 'ring-2 ring-amber-500 bg-amber-500 text-amber-950 border-amber-600 font-extrabold'
                                      : cat.color
                                  }`}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>

                            {/* Subcategories if any */}
                            {(() => {
                              const currentCatObj = availableExamCategories.find(c => c.name === selectedExamCategory);
                              if (!currentCatObj || !currentCatObj.subcategories || currentCatObj.subcategories.length === 0) return null;
                              return (
                                <div className="p-2 bg-emerald-50 dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Pilih Huruf / Subkategori:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {currentCatObj.subcategories.map(sub => (
                                      <button
                                        key={sub.id || sub.nama}
                                        type="button"
                                        onClick={() => {
                                          setSelectedExamSubCategory(sub.nama);
                                          setShowExamCategoryPicker(false);
                                        }}
                                        className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                                          selectedExamSubCategory === sub.nama
                                            ? 'bg-emerald-600 text-white font-bold'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                        }`}
                                      >
                                        {sub.nama}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Custom Note input + Save */}
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <input
                            type="text"
                            value={examCatatanText}
                            onChange={(e) => setExamCatatanText(e.target.value)}
                            placeholder={`Tulis catatan detail koreksi ${selectedExamSubCategory ? `${selectedExamCategory} (${selectedExamSubCategory})` : selectedExamCategory}... (opsional)`}
                            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const joinedText = selectedExamHighlightTexts.join(' ');
                              const targetLabel = joinedText ? (selectedExamHighlightKeys.length === 1 && selectedExamHighlightKeys[0].endsWith('verse') ? joinedText : `Bagian "${joinedText}" (Surah ${activeExamSurah.nama})`) : `Surah ${activeExamSurah.nama} (Umum)`;
                              const targetKey = selectedExamHighlightKeys.join(',') || `exam-quran-${activeExamSurah.nama}-general`;
                              const catLabel = selectedExamSubCategory ? `${selectedExamCategory} (${selectedExamSubCategory})` : selectedExamCategory;
                              const note = examCatatanText.trim() || `Koreksi ${catLabel} pada ${targetLabel}`;
                              applyExamQuranError(
                                activeExamSurah.nama,
                                targetLabel,
                                targetKey,
                                catLabel,
                                note
                              );
                              setExamSaveFeedback(`✓ Koreksi ${catLabel} berhasil disimpan!`);
                              clearExamSelection();
                              setTimeout(() => setExamSaveFeedback(''), 3000);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <span>💾</span>
                            <span>SIMPAN KOREKSI</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Clean unselected state: Button to add general surah note if desired */
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-left">
                      <button
                        type="button"
                        onClick={() => handleSelectGeneralSurah(activeExamSurah.nama)}
                        className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>✏️</span>
                        <span>+ Catat Koreksi Umum Surah {activeExamSurah.nama}</span>
                      </button>
                    </div>
                  )}

                  {/* Notification Toast Feedback */}
                  {examSaveFeedback && (
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold rounded-lg text-center animate-fade-in shadow-xs">
                      {examSaveFeedback}
                    </div>
                  )}

                  {/* Active Logged Corrections List for Current Exam Session */}
                  {activeStudentComments.length > 0 && (
                    <div className="mt-3 p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 text-left shadow-2xs" dir="ltr">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg">
                              <ClipboardCheck className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                              Daftar Koreksi Live Sesi Ini ({activeStudentComments.length} Catatan)
                            </span>
                            {selectedStudent && (
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {selectedStudent.namaLengkap}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Catatan koreksi live khusus untuk sesi santri yang sedang aktif diuji saat ini.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">
                            ✓ Terhubung ke Rubrik Penilaian
                          </span>
                          <button
                            type="button"
                            onClick={() => removeStudentQuranErrors(selectedStudent?.id, selectedStudent?.namaLengkap)}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:underline cursor-pointer bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1 shadow-2xs transition-all"
                            title="Reset seluruh catatan koreksi live sesi santri ini"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Reset Koreksi Sesi Ini</span>
                          </button>
                        </div>
                      </div>

                      {/* Daftar Koreksi Sesi Santri Ini */}
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {activeStudentComments.map((item) => (
                          <div 
                            key={item.id} 
                            className="p-2.5 bg-slate-50/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2 text-xs shadow-2xs hover:border-emerald-300 transition-colors"
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                                  {item.target}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200">
                                  {item.category}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Rubrik: {item.rubrikKriteria} (+1 Kesalahan)
                                </span>
                                {item.timestamp && (
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {item.timestamp}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                                {item.comment}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeExamQuranError(item.id)}
                              className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors shrink-0 cursor-pointer"
                              title="Hapus Koreksi Ini & Kembalikan Poin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Evaluasi & Rekomendasi Guru Penguji</label>
                <textarea
                  placeholder="Misal: Tajwid sangat matang, kelancaran di juz 30 dipertahankan dengan murojaah berkala."
                  rows={2}
                  value={catatanRekomendasi}
                  onChange={(e) => setCatatanRekomendasi(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* INTEGRASI OUTCOMES & PROMOSI */}
              {selectedTemplate && (
                <div className="border border-amber-250 bg-amber-50/20 p-4 rounded-xl space-y-3.5">
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-widest flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
                    <TrendingUp className="h-4 w-4 text-amber-700 animate-pulse" />
                    INTEGRASI & PROMOSI AKADEMIK (DIUPDATE LIVE JIKA LULUS)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Naik Juz */}
                    <div className="bg-white border border-gray-200 p-2.5 rounded-lg flex flex-col justify-between shadow-sm">
                      <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={isNaikJuz}
                          onChange={(e) => setIsNaikJuz(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-200 text-emerald-600 focus:ring-emerald-500"
                        />
                        Kenaikan Level Juz?
                      </label>
                      {isNaikJuz && (
                        <div className="mt-2.5">
                          <label className="block text-[8px] uppercase font-black text-gray-500 mb-0.5">Naik Ke Target Juz</label>
                          <select
                            value={targetJuzNaik}
                            onChange={(e) => setTargetJuzNaik(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-[11px] font-bold"
                          >
                            {Array.from({ length: 30 }, (_, i) => `Juz ${i + 1}`).map(j => (
                              <option key={j} value={j}>{j}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Naik Level / Jilid */}
                    <div className="bg-white border border-gray-205 p-2.5 rounded-lg flex flex-col justify-between shadow-sm">
                      <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={isNaikLevel}
                          onChange={(e) => setIsNaikLevel(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-200 text-emerald-600 focus:ring-emerald-500"
                        />
                        Kenaikan Jilid/Tingkat?
                      </label>
                      {isNaikLevel && (
                        <div className="mt-2.5">
                          <label className="block text-[8px] uppercase font-black text-gray-500 mb-0.5">Naik Ke Jilid/Level</label>
                          <select
                            value={targetLevelNaik}
                            onChange={(e) => setTargetLevelNaik(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-202 rounded p-1 text-[11px] font-bold"
                          >
                            <option value="Jilid 1">Iqra Jilid 1</option>
                            <option value="Jilid 2">Iqra Jilid 2</option>
                            <option value="Jilid 3">Iqra Jilid 3</option>
                            <option value="Jilid 4">Iqra Jilid 4</option>
                            <option value="Jilid 5">Iqra Jilid 5</option>
                            <option value="Jilid 6">Iqra Jilid 6</option>
                            <option value="Level Al-Quran">Level Al-Qur'an Utama</option>
                            <option value="Level Munaqasyah">Level Munaqasyah Wisuda</option>
                            <option value="Khatam">Khatam & Lulus Program</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Munaqasyah Layak */}
                    <div className="bg-white border border-gray-205 p-2.5 rounded-lg flex items-center justify-start shadow-sm">
                      <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={isLayakMunaqasyah}
                          onChange={(e) => setIsLayakMunaqasyah(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-200 text-emerald-600 focus:ring-emerald-500"
                        />
                        Rekomendasi Munaqasyah?
                      </label>
                    </div>
                  </div>
                  {isLayakMunaqasyah && (
                    <div className="text-[10px] text-amber-900 leading-relaxed font-semibold bg-amber-100/30 p-2 rounded border border-amber-200 flex items-center gap-1.5 mt-2">
                       ★ Murid akan ditandai berstatus **"Layak Munaqasyah / Wisuda"** di database. Mereka memenuhi prasyarat ujian kelulusan akhir Lembaga.
                    </div>
                  )}
                </div>
              )}

              {/* Syahadah issuance */}
              {isCandidatePassed && !!(selectedStudent?.yayasanId || selectedStudent?.sekolahId || selectedStudent?.direktoratId || selectedStudent?.regionalId) && (
                <div className="bg-emerald-50/75 border border-emerald-200 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      Terbitkan Dokumen Syahadah (Sertifikat Kelulusan Resmi)
                    </span>
                    <input
                      type="checkbox"
                      checked={shouldIssueSyahadah}
                      onChange={(e) => setShouldIssueSyahadah(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  {shouldIssueSyahadah && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3"
                    >
                      <div>
                        <span className="block text-[10px] text-gray-500 font-bold mb-1">Nomor Registrasi Sertifikat Syahadah</span>
                        <input
                          type="text"
                          value={certificateNo}
                          onChange={(e) => setCertificateNo(e.target.value)}
                          className="bg-white border border-emerald-200 text-xs text-gray-800 p-2 rounded-lg w-full font-semibold focus:ring-1 focus:ring-emerald-500"
                          placeholder="SYH/MH/..."
                          required
                        />
                      </div>
                      <div className="text-[11px] text-emerald-900 leading-relaxed font-medium bg-emerald-100/50 p-2 rounded-lg flex items-center">
                        Secara otomatis murid yang lulus dapat melihat sertifikat eksklusif ini di dashboard "Hasil Assessment" masing-masing dengan opsi cetak.
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    exitFullscreen();
                    setHasEnteredFullscreen(false);
                    setShowFullscreenWarning(false);
                    setFullscreenExitCount(0);
                    setExamInteractiveComments([]);
                    setExamQuranSelections([]);
                    setExamCatatanText('');
                    setShowExamCategoryPicker(false);
                    setSelectedExamSubCategory('');
                    setShowGradingModal(false);
                    setActivePengajuan(null);
                  }}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold px-5 py-2.5 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Kembali ke Daftar Santri
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Simpan & Rilis Hasil Ujian
                </button>
              </div>
              </>
            )}
            </form>
          </motion.div>
      )}

      {/* FULLSCREEN EXIT INTEGRITY WARNING MODAL (PROCTORING ALERT - HANYA UNTUK SISWA/SANTRI) */}
      <AnimatePresence>
        {requireFullscreen && showFullscreenWarning && !isFullscreen && hasEnteredFullscreen && showGradingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 text-rose-600 flex items-center justify-center shadow-inner">
                <ShieldAlert className="w-9 h-9 animate-bounce" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 px-3 py-1 rounded-full inline-block">
                  Deteksi Integritas Ujian (Proctoring)
                </span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  Keluar dari Mode Layar Penuh!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Sistem mendeteksi Anda telah meninggalkan mode layar penuh ({fullscreenExitCount}x terdeteksi). Mohon segera masuk kembali ke mode layar penuh untuk melanjutkan pelaksanaan assessment santri.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={enterFullscreen}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 transition-all cursor-pointer transform hover:scale-[1.02]"
                >
                  <Maximize className="w-4 h-4" />
                  <span>Kembali ke Mode Layar Penuh</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN BEAUTIFUL BERITA ACARA OVERLAY */}
      {viewingBeritaAcara && (
        <div id="berita-acara-overlay-admin" className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="my-auto bg-white shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden relative">
            
            {/* Header controls toolbar */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-250">
                <FileText className="h-5 w-5 text-emerald-400" /> DOKUMEN RESMI BERITA ACARA ASSESSMENT (UJIAN)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintBeritaAcara(viewingBeritaAcara)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow transition-all animate-bounce"
                >
                  <Printer className="h-4 w-4" /> Cetak (Print / PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBeritaAcara(null)}
                  className="text-gray-300 hover:text-white text-xs border border-white/20 px-3 py-2 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* THE BERITA ACARA PAPER */}
            <div id="mh-report-print-document" className="mh-print-paper p-4 sm:p-8 md:p-12 border-4 sm:border-[12px] border-slate-100 bg-white relative font-sans text-left space-y-6 select-text overflow-hidden">
              <div className="text-center space-y-1.5 border-b-2 border-slate-950 pb-4">
                <h2 className="text-base font-extrabold tracking-widest text-slate-950 uppercase">
                  {baNamaYayasan}
                </h2>
                <h3 className="text-sm font-bold text-slate-800 uppercase">
                  {baNamaPanitia}
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  {baAlamatKontak}
                </p>
              </div>

              <div className="text-center py-2">
                <h4 className="text-sm font-black text-slate-950 underline tracking-widest uppercase mb-1">
                  {baJudulDokumen}
                </h4>
                <p className="text-[10px] text-slate-500">
                  Nomor Dokumen: BA-ASM/{viewingBeritaAcara.id?.slice(0, 8).toUpperCase() || 'BA'}/{new Date().getFullYear()}
                </p>
              </div>

              <div className="text-xs space-y-3.5 text-slate-800">
                <p className="leading-relaxed">
                  {resolveAssessmentPlaceholders(
                    primaryDocBA?.teksPengantar || 'Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT] oleh Tim Dewan Penguji terhadap santri di bawah ini dengan hasil rekapitulasi penilaian sebagai berikut:',
                    viewingBeritaAcara,
                    primaryDocBA
                  )}
                </p>

                {/* Identity table */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <span className="text-[10px] text-slate-450 font-bold uppercase block">Nama Santri</span>
                    <strong className="text-xs text-slate-950">{viewingBeritaAcara.siswaNama}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 font-bold uppercase block">Halaqah Asal</span>
                    <strong className="text-xs text-slate-950">{viewingBeritaAcara.halaqahNama || 'Umum'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">NIS</span>
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {viewingBeritaAcara.siswaNis || siswas.find(s => s.id === viewingBeritaAcara.siswaId || s.namaLengkap?.toLowerCase() === viewingBeritaAcara.siswaNama?.toLowerCase())?.nis || viewingBeritaAcara.siswaId || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 font-bold uppercase block">Materi Uji Assessment</span>
                    <strong className="text-xs text-emerald-900">{viewingBeritaAcara.namaAssessment}</strong>
                  </div>
                </div>

                <p className="leading-relaxed">
                  Berdasarkan penilaian komprehensif, diperoleh rincian skor evaluasi kualitatif dan kualitatif sebagai berikut:
                </p>

                {/* Scores breakdown depending on model */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[10px] text-slate-600 uppercase tracking-wider flex justify-between">
                    <span>Metodologi Penilaian ({viewingBeritaAcara.modelPengujian || 'Tunggal'})</span>
                    <span>Nilai Hasil</span>
                  </div>
                  
                  {viewingBeritaAcara.modelPengujian === 'Ganda' && (
                    <div className="p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Penilaian Penguji 1 (Ketua):</span>
                        <strong className="font-mono">{viewingBeritaAcara.nilaiPenguji1 || 80}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Penilaian Penguji 2:</span>
                        <strong className="font-mono">{viewingBeritaAcara.nilaiPenguji2 || 80}</strong>
                      </div>
                      <div className="flex justify-between border-t pt-1.5">
                        <span className="font-bold">Keputusan Nilai Akhir ({viewingBeritaAcara.nilaiAkhirMethod === 'Rerata' ? 'Rata-rata' : viewingBeritaAcara.nilaiAkhirMethod}):</span>
                        <strong className="bg-emerald-50 text-emerald-950 font-black px-1.5 py-0.5 rounded border border-emerald-200">{viewingBeritaAcara.nilaiAkhir}</strong>
                      </div>
                    </div>
                  )}

                  {viewingBeritaAcara.modelPengujian === 'Tim' && (
                    <div className="p-3 space-y-3 text-[11px]">
                      <div className="space-y-1.5">
                        <span className="font-semibold block text-[10px] text-slate-400 uppercase tracking-widest">Rincian Penilaian Anggota Dewan Penguji:</span>
                        {Object.entries(viewingBeritaAcara.nilaiPerPenguji || {}).map(([gid, val]) => {
                          const name = gurus.find(g => g.id === gid)?.namaLengkap || 'Ustadz Penguji';
                          const cat = viewingBeritaAcara.catatanPerPenguji?.[gid] || 'Memberikan dedikasi ujian penuh.';
                          return (
                            <div key={gid} className="bg-slate-50 border border-slate-150 p-2 rounded">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span>{name}</span>
                                <span className="font-mono text-emerald-800">{val}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic mt-0.5">&quot;{cat}&quot;</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between border-t pt-1.5 font-bold text-xs">
                        <span>Keputusan Nilai Akhir ({viewingBeritaAcara.nilaiAkhirMethod || 'Rerata'}):</span>
                        <strong className="bg-emerald-50 text-emerald-950 font-black px-1.5 py-0.5 rounded border border-emerald-200">{viewingBeritaAcara.nilaiAkhir}</strong>
                      </div>
                    </div>
                  )}

                  {(!viewingBeritaAcara.modelPengujian || viewingBeritaAcara.modelPengujian === 'Tunggal') && (
                    <div className="p-3 space-y-2 text-xs">
                      {viewingBeritaAcara.rubrikNilaiInput && viewingBeritaAcara.rubrikNilaiInput.map((r, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{r.namaKriteria || (r as any).kriteria || `Kriteria ${i + 1}`} (Kriteria Uji):</span>
                          <strong className="font-mono">{r.nilaiInput ?? (r as any).nilai ?? 0} / 100</strong>
                        </div>
                      ))}
                      <div className="flex justify-between border-t pt-1.5">
                        <span className="font-bold">Nilai Rata-rata Akhir (Tunggal):</span>
                        <strong className="bg-emerald-50 text-emerald-950 font-black px-1.5 py-0.5 rounded border border-emerald-200">{viewingBeritaAcara.nilaiAkhir}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Keputusan &amp; Status Kelulusan</span>
                  <span className={`px-2.5 py-1 rounded inline-block text-xs font-black uppercase ${
                    (viewingBeritaAcara.statusHasil || (viewingBeritaAcara as any).statusKelulusan || '').includes('Lulus') 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}>
                    Dinyatakan {viewingBeritaAcara.statusHasil || (viewingBeritaAcara as any).statusKelulusan || 'Lulus'}
                  </span>
                </div>

                <div className="space-y-1 bg-amber-50/20 border border-amber-200/50 p-2.5 rounded-lg">
                  <span className="block text-[10px] text-amber-800 font-bold uppercase">Rekomendasi Utama / Catatan Khusus Guru Penguji</span>
                  <p className="text-[11px] text-slate-700 italic leading-snug">&quot;{viewingBeritaAcara.rekomendasiLayak || 'Diharapkan untuk terus giat murojaah, menyempurnakan tajwid dan kelancaran harian.'}&quot;</p>
                </div>

                {primaryDocBA?.teksPenutup && (
                  <p className="leading-relaxed text-xs text-slate-700 italic pt-1">
                    {resolveAssessmentPlaceholders(
                      primaryDocBA.teksPenutup,
                      viewingBeritaAcara,
                      primaryDocBA
                    )}
                  </p>
                )}
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-slate-200 text-center">
                <div className="flex flex-col justify-between items-center min-h-[96px] sm:min-h-[110px] w-full px-1">
                  <div className="min-h-[26px] sm:min-h-[30px] flex items-center justify-center w-full">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-extrabold tracking-wider leading-tight text-center">
                      {baTtd1Jabatan || 'PENGUJI'}
                    </p>
                  </div>
                  <div className="h-10 sm:h-12 flex items-end justify-center w-full">
                    {/* Ruang tanda tangan */}
                  </div>
                  <div className="w-full max-w-[120px] sm:max-w-[176px] border-b border-slate-400 mx-auto my-1.5" />
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight truncate max-w-full px-0.5">
                    {viewingBeritaAcara.ketuaPengujiNama || viewingBeritaAcara.guruNama || baTtd1Nama || 'Penguji Assessment'}
                  </p>
                </div>

                <div className="flex flex-col justify-between items-center min-h-[96px] sm:min-h-[110px] w-full px-1">
                  <div className="min-h-[26px] sm:min-h-[30px] flex items-center justify-center w-full">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-extrabold tracking-wider leading-tight text-center">
                      {baTtd2Jabatan || 'KOORDINATOR BIDANG'}
                    </p>
                  </div>
                  <div className="h-10 sm:h-12 flex items-end justify-center w-full">
                    {/* Ruang tanda tangan */}
                  </div>
                  <div className="w-full max-w-[120px] sm:max-w-[176px] border-b border-slate-400 mx-auto my-1.5" />
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight truncate max-w-full px-0.5">
                    {baTtd2Nama || 'Koordinator Bidang'}
                  </p>
                </div>
              </div>

              <div className="text-[9px] text-slate-450 pt-3 border-t border-slate-150 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5">
                <span>Tanggal Terbit Berita Acara: {viewingBeritaAcara.tanggalAssessment}</span>
                <span>Dokumen Autentik Terenkripsi Terintegrasi</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Live Notes Modal Dialog */}
      {confirmDeleteLiveNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Konfirmasi Hapus Koreksi Live
                </h3>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-1">
                  "{confirmDeleteLiveNotes.title}"
                </p>
                {confirmDeleteLiveNotes.desc && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {confirmDeleteLiveNotes.desc}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 italic">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setConfirmDeleteLiveNotes(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteLiveNotes}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// STUDENT PERSONAL STATS & BEAUTIFUL SYAHADAH PRINT VIEW
// ==========================================

export function HasilAssessment() {
  const { 
    currentSession, 
    assessmentRecords, 
    syahadahs,
    gurus,
    pwaSettings,
    docTemplates,
    strukturLembaga,
    siswas = []
  } = useApp();

  const primaryDocBA = useMemo(() => {
    return docTemplates?.find((d: any) => d.peruntukan === 'BERITA ACARA ASSESSMENT') || docTemplates?.[0];
  }, [docTemplates]);

  const resolvedInstNameBA2 = resolveYayasanDisplayName(strukturLembaga?.yayasan?.nama);
  const baNamaYayasan = (primaryDocBA?.namaYayasan && !isLegacyInstitutionBranding(primaryDocBA.namaYayasan))
    ? primaryDocBA.namaYayasan
    : ((pwaSettings?.baNamaYayasan && !isLegacyInstitutionBranding(pwaSettings.baNamaYayasan)) ? pwaSettings.baNamaYayasan : resolvedInstNameBA2.toUpperCase());
  const baNamaPanitia = primaryDocBA?.namaPanitia || pwaSettings?.baNamaPanitia || 'PANITIA ASSESSMENT & EVALUASI AKADEMIK SANTRI';
  const baAlamatKontak = (primaryDocBA?.alamatKontak && !isLegacyPersonalData(primaryDocBA.alamatKontak))
    ? primaryDocBA.alamatKontak
    : ((pwaSettings?.baAlamatKontak && !isLegacyPersonalData(pwaSettings.baAlamatKontak)) ? pwaSettings.baAlamatKontak : `Sekretariat ${resolvedInstNameBA2}`);
  const baJudulDokumen = primaryDocBA?.judulDokumen || 'BERITA ACARA ASSESSMENT & PENILAIAN HASIL UJIAN';

  const baTtd1Jabatan = primaryDocBA?.ttd1Jabatan || pwaSettings?.baTtd1Jabatan || 'PENGUJI';
  const baTtd1Nama = (primaryDocBA?.ttd1Nama && !isLegacyPersonalData(primaryDocBA.ttd1Nama))
    ? primaryDocBA.ttd1Nama
    : ((pwaSettings?.baTtd1Nama && !isLegacyPersonalData(pwaSettings.baTtd1Nama)) ? pwaSettings.baTtd1Nama : 'Penguji Assessment');
  const baTtd1Sub = baTtd1Nama;
  const baTtd2Jabatan = primaryDocBA?.ttd2Jabatan || pwaSettings?.baTtd2Jabatan || 'KOORDINATOR BIDANG';
  const baTtd2Nama = (primaryDocBA?.ttd2Nama && !isLegacyPersonalData(primaryDocBA.ttd2Nama))
    ? primaryDocBA.ttd2Nama
    : ((pwaSettings?.baTtd2Nama && !isLegacyPersonalData(pwaSettings.baTtd2Nama)) ? pwaSettings.baTtd2Nama : 'Koordinator Bidang');
  const baTtd2Sub = '';

  const [viewingSyahadah, setViewingSyahadah] = useState<Syahadah | null>(null);
  const [viewingBeritaAcara, setViewingBeritaAcara] = useState<AssessmentRecord | null>(null);
  const [viewingKoreksiRecord, setViewingKoreksiRecord] = useState<AssessmentRecord | null>(null);
  const [koreksiSearchQuery, setKoreksiSearchQuery] = useState<string>('');
  const [koreksiCategoryFilter, setKoreksiCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (viewingKoreksiRecord) {
      document.body.classList.add('modal-koreksi-open');
    } else {
      document.body.classList.remove('modal-koreksi-open');
    }
    return () => {
      document.body.classList.remove('modal-koreksi-open');
    };
  }, [viewingKoreksiRecord]);

  const getRecordCorrections = (rec: AssessmentRecord): KoreksiLiveItem[] => {
    if (rec.riwayatKoreksiLive && rec.riwayatKoreksiLive.length > 0) {
      return rec.riwayatKoreksiLive;
    }
    if (rec.catatanKoreksiLive && rec.catatanKoreksiLive.length > 0) {
      return rec.catatanKoreksiLive;
    }
    // Fallback: parse from quranCuesTested if available
    if (rec.quranCuesTested && rec.quranCuesTested.length > 0) {
      return rec.quranCuesTested.map((str, idx) => {
        const match = str.match(/Surah ([^()]+) \(([^)]+)\) - ([^:]+): (.*)/);
        if (match) {
          return {
            id: `legacy-${idx}`,
            surahNama: match[1].trim(),
            target: match[2].trim(),
            category: match[3].trim(),
            rubrikKriteria: '',
            comment: match[4].trim(),
            timestamp: '-'
          };
        }
        return {
          id: `legacy-${idx}`,
          surahNama: 'Al-Quran',
          target: 'Catatan Sesi Ujian',
          category: 'Koreksi Live',
          rubrikKriteria: '',
          comment: str,
          timestamp: '-'
        };
      });
    }
    return [];
  };

  const handlePrintKoreksiLive = (rec: AssessmentRecord | null) => {
    if (!rec) return;
    const originalTitle = document.title;
    const sanitizedSiswaNama = (rec.siswaNama || myName || 'Santri').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    const docName = (rec.namaAssessment || 'Ujian').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    document.title = `Riwayat_Koreksi_${sanitizedSiswaNama}_${docName}`;

    document.body.classList.add('is-printing-document');
    document.body.classList.add('is-printing-koreksi');
    window.print();

    setTimeout(() => {
      document.title = originalTitle;
      document.body.classList.remove('is-printing-document');
      document.body.classList.remove('is-printing-koreksi');
    }, 1000);
  };

  if (!currentSession.user) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
        Profil user tidak valid. Harap login kembali.
      </div>
    );
  }

  const myUserId = currentSession.user.id;
  const myName = currentSession.user.namaLengkap;

  // Filter & sort his/her records newest first
  const myRecords = useMemo(() => {
    return assessmentRecords
      .filter(r => r.siswaId === myUserId)
      .slice()
      .sort((a, b) => {
        const dateA = a.tanggalAssessment || a.tanggalDibuat || '';
        const dateB = b.tanggalAssessment || b.tanggalDibuat || '';
        return dateB.localeCompare(dateA);
      });
  }, [assessmentRecords, myUserId]);
  const myCertificates = syahadahs.filter(s => s.siswaId === myUserId);

  const totalTaken = myRecords.length;
  const totalPassed = myRecords.filter(r => (r.statusHasil || (r as any).statusKelulusan || '').includes('Lulus')).length;

  const handlePrintCertificateWindow = (syh?: Syahadah | null) => {
    const targetSyh = syh || viewingSyahadah;
    const originalTitle = document.title;
    const sanitizedSiswaNama = (targetSyh?.siswaNama || myName || 'Santri').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    const certNo = (targetSyh?.nomorSertifikat || 'Syahadah').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    document.title = `Syahadah_${sanitizedSiswaNama}_${certNo}`;

    document.body.classList.add('is-printing-document');
    window.print();

    setTimeout(() => {
      document.title = originalTitle;
      document.body.classList.remove('is-printing-document');
    }, 1000);
  };

  const handlePrintBeritaAcara = (rec: AssessmentRecord | null) => {
    if (!rec) {
      document.body.classList.add('is-printing-document');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('is-printing-document');
      }, 1000);
      return;
    }
    const originalTitle = document.title;
    const sanitizedSiswaNama = (rec.siswaNama || 'Santri').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    const docNumber = rec.id?.slice(0, 8).toUpperCase() || 'BA';
    document.title = `Berita_Acara_Assessment_${sanitizedSiswaNama}_${docNumber}`;

    document.body.classList.add('is-printing-document');
    window.print();

    setTimeout(() => {
      document.title = originalTitle;
      document.body.classList.remove('is-printing-document');
    }, 1000);
  };

  return (
    <div id="hasil-assessment-section" className="space-y-6">
      <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hasil Assessment & Syahadah</h1>
          <p className="text-sm text-gray-500">Melihat rekap pencapaian kelulusan ujian formal Anda serta mencetak sertifikat digital.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800 border border-emerald-100 flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-600 animate-pulse" />
          <span>Selamat! Anda telah mengoleksi {myCertificates.length} Syahadah Kelulusan.</span>
        </div>
      </div>

      {/* Quick summaries widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Ujian Diikuti</span>
            <span className="text-2xl font-extrabold text-gray-900">{totalTaken} Kali</span>
          </div>
          <div className="h-10 w-10 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Kelayakan Syahadah</span>
            <span className="text-2xl font-extrabold text-emerald-700">{myCertificates.length} Sertifikat</span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Rata-rata Nilai</span>
            <span className="text-2xl font-extrabold text-indigo-700">
              {myRecords.length > 0 
                ? Math.round((myRecords.reduce((sum, r) => sum + r.nilaiAkhir, 0) / myRecords.length) * 10) / 10 
                : '0.0'
              }
            </span>
          </div>
          <div className="h-10 w-10 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Grid of issued Certificate / Syahadah */}
      {myCertificates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-spin" />
            Sertifikat Syahadah Digital Anda (Siap Cetak)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCertificates.map(syh => (
              <div key={syh.id} className="bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-amber-250 opacity-10 rounded-bl-full pointer-events-none" />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      RESMI (OTORISATIF)
                    </span>
                    <span className="text-[11px] text-gray-400 italic">No: {syh.nomorSertifikat}</span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-sm leading-tight">{syh.jeniaAssessmentNama}</h3>
                  <p className="text-xs text-gray-500 mt-1">Diterbitkan pada: <strong>{syh.tanggalTerbit}</strong></p>
                  <p className="text-xs text-emerald-800 font-bold mt-1.5 flex items-center gap-1">
                    Nilai Mumtaz: {syh.nilaiPertanggungjawaban}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingSyahadah(syh)}
                  className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Printer className="h-4 w-4" /> Buka Cetak
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">
            Arsip Rekap Nilai Ujian Formal
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums font-semibold">
            {myRecords.length} ujian
          </span>
        </div>

        {/* Mobile / HP View: Complete stacked cards showing every field & action without horizontal clipping */}
        <div className="md:hidden space-y-3">
          {myRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center text-gray-400 text-xs font-medium">
              Belum ada rekam jejak ujian formal yang terekam pada akun Anda.
            </div>
          ) : (
            myRecords.map(rec => {
              const liveCorrections = getRecordCorrections(rec);
              const statusText = rec.statusHasil || (rec as any).statusKelulusan || '-';
              const statusBadgeClass = statusText.includes('Lulus')
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : statusText === 'Perlu Perbaikan'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300';

              return (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
                >
                  {/* Top Row: Exam Name + Date vs Final Score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-emerald-950 dark:text-emerald-300 text-sm leading-snug">
                        {rec.namaAssessment || (rec as any).namaTemplate || 'Assessment'}
                      </h3>
                      <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                        {rec.tanggalAssessment || (rec as any).tanggalInput || '-'}
                      </p>
                    </div>
                    <div className="shrink-0 text-center bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-lg px-3 py-1.5">
                      <span className="block text-[9px] font-bold text-indigo-500 dark:text-indigo-300 uppercase tracking-wider leading-none">
                        Skor Akhir
                      </span>
                      <span className="block text-base font-black font-mono tabular-nums text-indigo-900 dark:text-indigo-200 leading-tight mt-0.5">
                        {rec.nilaiAkhir ?? '-'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Details Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Otoritas Penguji
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 block mt-0.5 truncate">
                        {rec.guruNama || (rec as any).pengujiGuruNama || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Status Hasil
                      </span>
                      <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClass}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Arsip Rekomendasi / Catatan
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 text-xs italic block mt-0.5 leading-relaxed">
                        {rec.rekomendasiLayak || 'Tidak ada catatan khusus.'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    {liveCorrections.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingKoreksiRecord(rec);
                          setKoreksiSearchQuery('');
                          setKoreksiCategoryFilter('all');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer whitespace-nowrap"
                        title="Lihat rincian lengkap Riwayat Koreksi Penilaian Live sesi ini"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Koreksi ({liveCorrections.length})</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Nihil koreksi live</span>
                    )}

                    <button
                      type="button"
                      onClick={() => setViewingBeritaAcara(rec)}
                      className="text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 transition-all px-3 py-2 rounded-lg inline-flex items-center gap-1.5 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800/60 cursor-pointer whitespace-nowrap ml-auto"
                      title="Lihat Berita Acara Resmi"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>Berita Acara</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet Table View with horizontal-scroll safety */}
        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 uppercase font-bold border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="p-4 whitespace-nowrap">Tanggal Pelaksanaan</th>
                <th className="p-4 whitespace-nowrap">Ujian Assessment</th>
                <th className="p-4 text-center whitespace-nowrap">Skor Akhir</th>
                <th className="p-4 whitespace-nowrap">Otoritas Penguji</th>
                <th className="p-4 whitespace-nowrap">Status Hasil</th>
                <th className="p-4 whitespace-nowrap">Riwayat Koreksi Live</th>
                <th className="p-4 whitespace-nowrap">Arsip Rekomendasi / Catatan</th>
                <th className="p-4 text-right whitespace-nowrap">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                    Belum ada rekam jejak ujian formal yang terekam pada akun Anda.
                  </td>
                </tr>
              ) : (
                myRecords.map(rec => {
                  const liveCorrections = getRecordCorrections(rec);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-semibold font-mono tabular-nums text-gray-500 dark:text-slate-300 whitespace-nowrap">
                        {rec.tanggalAssessment || (rec as any).tanggalInput || '-'}
                      </td>
                      <td className="p-4 font-extrabold text-emerald-950 dark:text-emerald-300">
                        {rec.namaAssessment || (rec as any).namaTemplate || 'Assessment'}
                      </td>
                      <td className="p-4 text-center font-black font-mono tabular-nums text-sm text-indigo-900 dark:text-indigo-200 bg-indigo-50/25 dark:bg-indigo-950/25 whitespace-nowrap">
                        {rec.nilaiAkhir ?? '-'}
                      </td>
                      <td className="p-4 font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {rec.guruNama || (rec as any).pengujiGuruNama || '-'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (rec.statusHasil || (rec as any).statusKelulusan || '').includes('Lulus') 
                            ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : ((rec.statusHasil || (rec as any).statusKelulusan) === 'Perlu Perbaikan' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300')
                        }`}>
                          {rec.statusHasil || (rec as any).statusKelulusan || '-'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {liveCorrections.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingKoreksiRecord(rec);
                              setKoreksiSearchQuery('');
                              setKoreksiCategoryFilter('all');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors shadow-2xs group cursor-pointer"
                            title="Buka rincian lengkap Riwayat Koreksi Penilaian Live sesi ini"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                            <span>{liveCorrections.length} Koreksi Live</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Nihil koreksi</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 dark:text-slate-400 text-xs italic leading-tight max-w-xs truncate" title={rec.rekomendasiLayak}>
                        {rec.rekomendasiLayak || 'Tidak ada catatan khusus.'}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {liveCorrections.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingKoreksiRecord(rec);
                                setKoreksiSearchQuery('');
                                setKoreksiCategoryFilter('all');
                              }}
                              className="text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 transition-all px-2.5 py-1 rounded inline-flex items-center gap-1 font-bold text-[10px] border border-amber-200 shadow-2xs cursor-pointer"
                              title="Lihat Riwayat Koreksi Penilaian Live"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5 text-amber-600" /> Koreksi ({liveCorrections.length})
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewingBeritaAcara(rec)}
                            className="text-emerald-700 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 transition-all px-2.5 py-1 rounded inline-flex items-center gap-1 font-bold text-[10px] border border-emerald-200 shadow-2xs cursor-pointer"
                            title="Lihat Berita Acara Resmi"
                          >
                            <FileText className="h-3.5 w-3.5" /> Berita Acara
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL SCREEN BEAUTIFUL SYAHADAH CERTIFICATE OVERLAY */}
      {viewingSyahadah && (
        <div id="syahadah-certificate-paper" className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="my-auto bg-white shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden relative">
            
            {/* Header controls toolbar which hides in print mode */}
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-250">
                <FileBadge className="h-5 w-5" /> PREVIEW DOKUMEN CETAK SYAHADAH RESMI
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintCertificateWindow(viewingSyahadah)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-950 text-xs font-extrabold px-4 py-2 rounded-lg flex items-center gap-1 shadow transition-all"
                >
                  <Printer className="h-4 w-4" /> Cetak Sekarang (Print / PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSyahadah(null)}
                  className="text-gray-300 hover:text-white text-xs border border-white/20 px-3 py-2 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* THE AWESOME ISLAMIC GEOMETRIC EMBellished SYAHADAH CERTIFICATE */}
            <div id="mh-report-print-document" className="mh-print-paper p-8 md:p-12 border-[16px] border-emerald-900 bg-amber-50/20 relative font-sans text-center space-y-6 select-text overflow-hidden">
              
              {/* Islamic ornate frame background inside borders */}
              <div className="absolute inset-2 border-2 border-amber-600 opacity-40 pointer-events-none" />
              <div className="absolute inset-4 border border-emerald-950 opacity-20 pointer-events-none" />
              
              <div className="space-y-2">
                <div className="mx-auto h-16 w-16 text-emerald-800 flex items-center justify-center">
                  <Award className="h-14 w-14 text-emerald-800" />
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-extrabold tracking-wide text-emerald-950">
                  سَنَدُ الشَّهَادَةِ التَّقْدِيرِيَّةِ
                </h1>
                <p className="text-lg md:text-xl font-bold tracking-tight text-amber-900">
                  SYAHADAH KELULUSAN AKADEMIK
                </p>
                <p className="text-[11px] text-gray-400 font-bold border-b border-gray-200 pb-3 mx-20">
                  No. Registrasi: {viewingSyahadah.nomorSertifikat}
                </p>
              </div>

              <div className="space-y-4 text-emerald-950">
                <p className="text-xs italic leading-relaxed text-gray-600">
                  Dengan memanjatkan puji dan syukur kehadirat Allah Subhanahu wa Ta&apos;ala, Pondok Pesantren &amp; Halaqah Modern menyatakan secara resmi bahwa santri yang tercantum di bawah ini:
                </p>

                <div className="py-2">
                  <h3 className="text-xl md:text-2xl font-extrabold tracking-wide text-emerald-950 uppercase border-b-2 border-amber-500 inline-block px-6">
                    {viewingSyahadah.siswaNama}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2">Identitas Unik ID Santri: {viewingSyahadah.siswaId}</p>
                </div>

                <p className="text-xs font-semibold leading-relaxed px-5 text-gray-700">
                  Telah dinyatakan <span className="text-emerald-800 font-extrabold uppercase">LULUS SEUTUHNYA</span> dengan predikat <span className="font-extrabold text-emerald-800">MUMTAZ (SANGAT BAIK)</span> dalam evaluasi formal:
                </p>

                <div className="bg-emerald-50/50 border border-emerald-100/75 py-3.5 px-6 rounded-xl inline-block">
                  <span className="text-xs text-gray-450 block uppercase tracking-wider font-bold">Materi / Elemen Capaian</span>
                  <strong className="text-base font-extrabold text-emerald-950">{viewingSyahadah.jeniaAssessmentNama}</strong>
                  <span className="text-xs text-emerald-850 font-bold block mt-1">Nilai Kelulusan: {viewingSyahadah.nilaiPertanggungjawaban} / 100</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 max-w-lg mx-auto leading-relaxed">
                Syahadah kelulusan ini diterbitkan sebagai pengakuan formal atas kegigihan, kesiplinan, dan capaian hafalan/bacaan yang bersangkutan, serta memberikan hak penuh untuk melanjutkan ke tahapan jenjang mutqin berikutnya.
              </p>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Halaqah Otoritas Pengajar</p>
                  <div className="h-12 flex items-end justify-center">
                    <span className="font-serif italic text-sm text-gray-700">Otoritas Penguji Sesuai Sistem</span>
                  </div>
                  <div className="w-32 h-0.5 bg-gray-200 mx-auto my-1" />
                  <p className="text-xs font-bold text-gray-800">Asatidzah Penguji Utama</p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Otoritas Pimpinan / Kiai</p>
                  <div className="h-12 flex items-end justify-center">
                    <span className="font-serif italic text-emerald-900 font-bold">Pimpinan Lembaga</span>
                  </div>
                  <div className="w-32 h-0.5 bg-gray-200 mx-auto my-1" />
                  <p className="text-xs font-bold text-gray-800">Dekan &amp; Pengasuh Halaqah</p>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span>Tanggal Terbit: {viewingSyahadah.tanggalTerbit}</span>
                <span>Sistem Evaluasi Terpadu Modern</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN BEAUTIFUL BERITA ACARA OVERLAY */}
      {viewingBeritaAcara && (
        <div id="berita-acara-overlay" className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="my-auto bg-white shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden relative">
            
            {/* Header controls toolbar */}
            <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-250">
                <FileText className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>DOKUMEN RESMI BERITA ACARA ASSESSMENT (UJIAN)</span>
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handlePrintBeritaAcara(viewingBeritaAcara)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all whitespace-nowrap cursor-pointer"
                >
                  <Printer className="h-4 w-4 shrink-0" /> Cetak (Print / PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBeritaAcara(null)}
                  className="text-gray-300 hover:text-white text-xs border border-white/20 px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* THE BERITA ACARA PAPER */}
            <div id="mh-report-print-document" className="mh-print-paper p-4 sm:p-8 md:p-12 border-4 sm:border-[12px] border-slate-100 bg-white relative font-sans text-left space-y-6 select-text overflow-hidden">
              <div className="text-center space-y-1.5 border-b-2 border-slate-950 pb-4">
                <h2 className="text-base font-extrabold tracking-widest text-slate-950 uppercase">
                  {baNamaYayasan}
                </h2>
                <h3 className="text-sm font-bold text-slate-800 uppercase">
                  {baNamaPanitia}
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  {baAlamatKontak}
                </p>
              </div>

              <div className="text-center py-2">
                <h4 className="text-sm font-black text-slate-950 underline tracking-widest uppercase mb-1">
                  {baJudulDokumen}
                </h4>
                <p className="text-[10px] text-slate-500">
                  Nomor Dokumen: BA-ASM/{viewingBeritaAcara.id?.slice(0, 8).toUpperCase() || 'BA'}/{new Date().getFullYear()}
                </p>
              </div>

              <div className="text-xs space-y-3.5 text-slate-800">
                <p className="leading-relaxed">
                  {resolveAssessmentPlaceholders(
                    primaryDocBA?.teksPengantar || 'Pada hari ini [HARI], tanggal [TANGGAL], telah dilaksanakan Ujian Assessment kelulusan santri bertempat di [TEMPAT] oleh Tim Dewan Penguji terhadap santri di bawah ini dengan hasil rekapitulasi penilaian sebagai berikut:',
                    viewingBeritaAcara,
                    primaryDocBA
                  )}
                </p>

                {/* Identity table */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <span className="text-[10px] text-slate-450 font-bold uppercase block">Nama Santri</span>
                    <strong className="text-xs text-slate-950">{viewingBeritaAcara.siswaNama}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 font-bold uppercase block">Halaqah Asal</span>
                    <strong className="text-xs text-slate-950">{viewingBeritaAcara.halaqahNama || 'Umum'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">NIS</span>
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {viewingBeritaAcara.siswaNis || siswas.find(s => s.id === viewingBeritaAcara.siswaId || s.namaLengkap?.toLowerCase() === viewingBeritaAcara.siswaNama?.toLowerCase())?.nis || viewingBeritaAcara.siswaId || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 font-bold uppercase block">Materi Uji Assessment</span>
                    <strong className="text-xs text-emerald-900">{viewingBeritaAcara.namaAssessment}</strong>
                  </div>
                </div>

                <p className="leading-relaxed">
                  Berdasarkan penilaian komprehensif, diperoleh rincian skor evaluasi kualitatif dan kualitatif sebagai berikut:
                </p>

                {/* Scores breakdown depending on model */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[10px] text-slate-600 uppercase tracking-wider flex justify-between">
                    <span>Metodologi Penilaian ({viewingBeritaAcara.modelPengujian || 'Tunggal'})</span>
                    <span>Nilai Hasil</span>
                  </div>
                  
                  {viewingBeritaAcara.modelPengujian === 'Ganda' && (
                    <div className="p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Penilaian Penguji 1 (Ketua):</span>
                        <strong className="font-mono">{viewingBeritaAcara.nilaiPenguji1 || 80}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Penilaian Penguji 2:</span>
                        <strong className="font-mono">{viewingBeritaAcara.nilaiPenguji2 || 80}</strong>
                      </div>
                      <div className="flex justify-between border-t pt-1.5">
                        <span className="font-bold">Keputusan Nilai Akhir ({viewingBeritaAcara.nilaiAkhirMethod === 'Rerata' ? 'Rata-rata' : viewingBeritaAcara.nilaiAkhirMethod}):</span>
                        <strong className="bg-emerald-50 text-emerald-950 font-black px-1.5 py-0.5 rounded border border-emerald-200">{viewingBeritaAcara.nilaiAkhir}</strong>
                      </div>
                    </div>
                  )}

                  {viewingBeritaAcara.modelPengujian === 'Tim' && (
                    <div className="p-3 space-y-3 text-[11px]">
                      <div className="space-y-1.5">
                        <span className="font-semibold block text-[10px] text-slate-400 uppercase tracking-widest">Rincian Penilaian Anggota Dewan Penguji:</span>
                        {Object.entries(viewingBeritaAcara.nilaiPerPenguji || {}).map(([gid, val]) => {
                          const name = gurus.find(g => g.id === gid)?.namaLengkap || 'Ustadz Penguji';
                          const cat = viewingBeritaAcara.catatanPerPenguji?.[gid] || 'Memberikan dedikasi ujian penuh.';
                          return (
                            <div key={gid} className="bg-slate-50 border border-slate-150 p-2 rounded">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span>{name}</span>
                                <span className="font-mono text-emerald-800">{val}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic mt-0.5">&quot;{cat}&quot;</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between border-t pt-1.5 font-bold text-xs">
                        <span>Keputusan Nilai Akhir ({viewingBeritaAcara.nilaiAkhirMethod || 'Rerata'}):</span>
                        <strong className="bg-emerald-50 text-emerald-950 font-black px-1.5 py-0.5 rounded border border-emerald-200">{viewingBeritaAcara.nilaiAkhir}</strong>
                      </div>
                    </div>
                  )}

                  {(!viewingBeritaAcara.modelPengujian || viewingBeritaAcara.modelPengujian === 'Tunggal') && (
                    <div className="p-3 space-y-2 text-xs">
                      {viewingBeritaAcara.rubrikNilaiInput && viewingBeritaAcara.rubrikNilaiInput.map((r, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{r.namaKriteria || (r as any).kriteria || `Kriteria ${i + 1}`} (Kriteria Uji):</span>
                          <strong className="font-mono">{r.nilaiInput ?? (r as any).nilai ?? 0} / 100</strong>
                        </div>
                      ))}
                      <div className="flex justify-between border-t pt-1.5">
                        <span className="font-bold">Nilai Rata-rata Akhir (Tunggal):</span>
                        <strong className="bg-emerald-50 text-emerald-950 font-black px-1.5 py-0.5 rounded border border-emerald-200">{viewingBeritaAcara.nilaiAkhir}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Keputusan &amp; Status Kelulusan</span>
                  <span className={`px-2.5 py-1 rounded inline-block text-xs font-black uppercase ${
                    (viewingBeritaAcara.statusHasil || (viewingBeritaAcara as any).statusKelulusan || '').includes('Lulus') 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}>
                    Dinyatakan {viewingBeritaAcara.statusHasil || (viewingBeritaAcara as any).statusKelulusan || 'Lulus'}
                  </span>
                </div>

                <div className="space-y-1 bg-amber-50/20 border border-amber-200/50 p-2.5 rounded-lg">
                  <span className="block text-[10px] text-amber-800 font-bold uppercase">Rekomendasi Utama / Catatan Khusus Guru Penguji</span>
                  <p className="text-[11px] text-slate-700 italic leading-snug">&quot;{viewingBeritaAcara.rekomendasiLayak || 'Diharapkan untuk terus giat murojaah, menyempurnakan tajwid dan kelancaran harian.'}&quot;</p>
                </div>

                {primaryDocBA?.teksPenutup && (
                  <p className="leading-relaxed text-xs text-slate-700 italic pt-1">
                    {resolveAssessmentPlaceholders(
                      primaryDocBA.teksPenutup,
                      viewingBeritaAcara,
                      primaryDocBA
                    )}
                  </p>
                )}
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-slate-200 text-center">
                <div className="flex flex-col justify-between items-center min-h-[96px] sm:min-h-[110px] w-full px-1">
                  <div className="min-h-[26px] sm:min-h-[30px] flex items-center justify-center w-full">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-extrabold tracking-wider leading-tight text-center">
                      {baTtd1Jabatan || 'PENGUJI'}
                    </p>
                  </div>
                  <div className="h-10 sm:h-12 flex items-end justify-center w-full">
                    {/* Ruang tanda tangan */}
                  </div>
                  <div className="w-full max-w-[120px] sm:max-w-[176px] border-b border-slate-400 mx-auto my-1.5" />
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight truncate max-w-full px-0.5">
                    {viewingBeritaAcara.ketuaPengujiNama || viewingBeritaAcara.guruNama || baTtd1Nama || 'Penguji Assessment'}
                  </p>
                </div>

                <div className="flex flex-col justify-between items-center min-h-[96px] sm:min-h-[110px] w-full px-1">
                  <div className="min-h-[26px] sm:min-h-[30px] flex items-center justify-center w-full">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-extrabold tracking-wider leading-tight text-center">
                      {baTtd2Jabatan || 'KOORDINATOR BIDANG'}
                    </p>
                  </div>
                  <div className="h-10 sm:h-12 flex items-end justify-center w-full">
                    {/* Ruang tanda tangan */}
                  </div>
                  <div className="w-full max-w-[120px] sm:max-w-[176px] border-b border-slate-400 mx-auto my-1.5" />
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight truncate max-w-full px-0.5">
                    {baTtd2Nama || 'Koordinator Bidang'}
                  </p>
                </div>
              </div>

              <div className="text-[9px] text-slate-450 pt-3 border-t border-slate-150 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5">
                <span>Tanggal Terbit Berita Acara: {viewingBeritaAcara.tanggalAssessment}</span>
                <span>Dokumen Autentik Terenkripsi Terintegrasi</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LENGKAP RIWAYAT KOREKSI PENILAIAN LIVE UNTUK SANTRI */}
      {viewingKoreksiRecord && typeof document !== 'undefined' && createPortal(
        (() => {
          const corrections = getRecordCorrections(viewingKoreksiRecord);
          const categories = Array.from(new Set(corrections.map(c => c.category).filter(Boolean)));
          
          const filteredCorrections = corrections.filter(item => {
            const matchesCat = koreksiCategoryFilter === 'all' || item.category === koreksiCategoryFilter;
            const query = koreksiSearchQuery.toLowerCase().trim();
            const matchesQuery = !query || 
              (item.target || '').toLowerCase().includes(query) ||
              (item.surahNama || '').toLowerCase().includes(query) ||
              (item.comment || '').toLowerCase().includes(query) ||
              (item.category || '').toLowerCase().includes(query) ||
              (item.rubrikKriteria || '').toLowerCase().includes(query);
            return matchesCat && matchesQuery;
          });

          return (
            <div id="riwayat-koreksi-modal" className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:block print:overflow-visible print:w-full">
              <div className="my-auto bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-150 relative print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full print:overflow-visible print:m-0 print:p-0 print:static">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/30">
                        Riwayat Koreksi Penilaian Sesi Ujian
                      </span>
                      <span className="text-[10px] text-amber-200/80 font-mono">
                        {viewingKoreksiRecord.tanggalAssessment}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-1 leading-tight">
                      {viewingKoreksiRecord.namaAssessment}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handlePrintKoreksiLive(viewingKoreksiRecord)}
                    className="bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    title="Cetak Catatan Koreksi"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Cetak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingKoreksiRecord(null)}
                    className="text-amber-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Tutup"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable container & info strip */}
              <div id="koreksi-print-document" className="p-5 sm:p-6 space-y-4 print:p-0 print:space-y-4 print:static print:overflow-visible print:w-full">
                {/* Official Print Header (Visible on printout / PDF) */}
                <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
                  <h2 className="text-sm font-extrabold tracking-wider text-slate-950 uppercase">
                    {baNamaYayasan || resolvedInstNameBA2.toUpperCase()}
                  </h2>
                  <h3 className="text-xs font-bold text-slate-800 uppercase">
                    RIWAYAT LENGKAP KOREKSI &amp; EVALUASI SESI ASSESSMENT
                  </h3>
                  <p className="text-[10px] text-slate-600 font-semibold uppercase">
                    Materi: {viewingKoreksiRecord.namaAssessment} • Tanggal: {viewingKoreksiRecord.tanggalAssessment}
                  </p>
                </div>

                {/* Meta summary card */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:bg-white print:border-slate-300 print:mb-4 print:break-inside-avoid">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Santri / Peserta</span>
                    <strong className="text-slate-900 font-extrabold truncate block">{viewingKoreksiRecord.siswaNama}</strong>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      NIS: {viewingKoreksiRecord.siswaNis || siswas.find(s => s.id === viewingKoreksiRecord.siswaId || s.namaLengkap?.toLowerCase() === viewingKoreksiRecord.siswaNama?.toLowerCase())?.nis || viewingKoreksiRecord.siswaId || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Guru Penguji</span>
                    <strong className="text-slate-900 truncate block">
                      {viewingKoreksiRecord.ketuaPengujiNama || viewingKoreksiRecord.guruNama || 'Ustadz Penguji'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Nilai &amp; Status</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-sm font-black text-indigo-900">{viewingKoreksiRecord.nilaiAkhir}</strong>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        (viewingKoreksiRecord.statusHasil || '').includes('Lulus')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {viewingKoreksiRecord.statusHasil || 'Selesai'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Catatan</span>
                    <strong className="text-amber-900 font-extrabold">{corrections.length} Koreksi Live</strong>
                  </div>
                </div>

                {/* Filter and Search Bar (Hidden during print) */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between print:hidden">
                  <div className="relative flex-1">
                    <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={koreksiSearchQuery}
                      onChange={(e) => setKoreksiSearchQuery(e.target.value)}
                      placeholder="Cari target ayat, surah, kategori, atau catatan..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                    />
                  </div>

                  {categories.length > 0 && (
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setKoreksiCategoryFilter('all')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                          koreksiCategoryFilter === 'all'
                            ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Semua ({corrections.length})
                      </button>
                      {categories.map(cat => {
                        const countInCat = corrections.filter(c => c.category === cat).length;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setKoreksiCategoryFilter(cat)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                              koreksiCategoryFilter === cat
                                ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {cat} ({countInCat})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* List of corrections - Fully expanded on print */}
                <div className="koreksi-list-scroll space-y-2.5 max-h-[420px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible print:pr-0 print:h-auto print:space-y-3">
                  {filteredCorrections.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-150 text-gray-500 text-xs">
                      {corrections.length === 0 ? (
                        <div className="space-y-1">
                          <p className="font-bold text-gray-700">Tidak ada catatan koreksi live pada ujian ini.</p>
                          <p className="text-[11px] text-gray-400">Alhamdulillah, santri menyelesaikan ujian dengan sangat baik tanpa catatan kesalahan tajwid/makhraj yang signifikan.</p>
                        </div>
                      ) : (
                        <p>Tidak ditemukan koreksi yang cocok dengan filter pencarian.</p>
                      )}
                    </div>
                  ) : (
                    filteredCorrections.map((item, idx) => {
                      const isLahnJaliy = item.category?.toLowerCase().includes('jaliy') || item.category?.toLowerCase().includes('makhraj');
                      const isLahnKhafiy = item.category?.toLowerCase().includes('khafiy') || item.category?.toLowerCase().includes('sifat');
                      
                      return (
                        <div
                          key={item.id || idx}
                          className="koreksi-item-card p-3.5 bg-white rounded-xl border border-gray-200 hover:border-amber-300 shadow-2xs transition-all space-y-2 text-left print:break-inside-avoid print:shadow-none print:border-slate-300 print:mb-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                                {item.surahNama ? `Surah ${item.surahNama}` : 'Al-Quran'}
                              </span>
                              <strong className="text-xs font-bold text-emerald-950">
                                {item.target}
                              </strong>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isLahnJaliy
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : isLahnKhafiy
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}>
                                {item.category}
                              </span>

                              {item.rubrikKriteria && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                  Rubrik: {item.rubrikKriteria}
                                </span>
                              )}

                              {item.timestamp && item.timestamp !== '-' && (
                                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                  {item.timestamp}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Detail Guru Comment */}
                          <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Catatan Koreksi Dewan Penguji:
                            </span>
                            <p className="text-slate-800 font-medium italic leading-relaxed">
                              &quot;{item.comment}&quot;
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Motivational footer note for student */}
                <div className="bg-emerald-50 border border-emerald-200/70 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 print:break-inside-avoid print:bg-emerald-50/60 print:border-emerald-300 print:mt-4">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">Arahan Belajar &amp; Murojaah Mandiri:</span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Jadikan setiap catatan koreksi live di atas sebagai bahan evaluasi utama saat talaqqi bersama guru halaqah atau murojaah harian agar bacaan Al-Qur&apos;an semakin fasih, tartil, dan mutqin.
                    </p>
                  </div>
                </div>

              </div>

              {/* Bottom Actions toolbar */}
              <div className="bg-gray-50 border-t border-gray-150 p-3.5 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setViewingBeritaAcara(viewingKoreksiRecord);
                    setViewingKoreksiRecord(null);
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>Buka Berita Acara Resmi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingKoreksiRecord(null)}
                  className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold px-4 py-1.5 rounded-lg border border-gray-300 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        );
      })(),
      document.body
    )}
    </div>
  );
}
