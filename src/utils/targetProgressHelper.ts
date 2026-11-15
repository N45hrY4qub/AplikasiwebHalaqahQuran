/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TipeModul, Setoran, Siswa, Halaqah, Modul, ElemenSetting } from '../types';

export interface SurahItem {
  no: number;
  nama: string;
}

export const SURAH_LIST: SurahItem[] = [
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
  if (sAwal === 'alfatihah' && (sAkhir === 'alkausar' || sAkhir === 'alkautsar')) {
    return true;
  }
  return false;
};

export const getSurahNumber = (surahName: string): number => {
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

export const FALLBACK_SURAH_AYAT_COUNTS: Record<number, number> = {
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

export const getSurahJumlahAyat = (surahNo: number, moduls?: Modul[]): number => {
  if (moduls) {
    const found = moduls.find(m => m.tipe === TipeModul.AL_QURAN && m.nomorUrutSurat === surahNo);
    if (found?.jumlahAyat) return found.jumlahAyat;
  }
  return FALLBACK_SURAH_AYAT_COUNTS[surahNo] || 10;
};

export const getQuranDefaultJuz = (surahNo: number, ayatNo: number = 1): number => {
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

export const getJuzStartInfo = (juz: number) => {
  const starts: Record<number, { surah: number; ayat: number }> = {
    1: { surah: 1, ayat: 1 }, 2: { surah: 2, ayat: 142 }, 3: { surah: 2, ayat: 253 },
    4: { surah: 3, ayat: 93 }, 5: { surah: 4, ayat: 24 }, 6: { surah: 4, ayat: 148 },
    7: { surah: 5, ayat: 82 }, 8: { surah: 6, ayat: 111 }, 9: { surah: 7, ayat: 88 },
    10: { surah: 8, ayat: 41 }, 11: { surah: 9, ayat: 93 }, 12: { surah: 11, ayat: 6 },
    13: { surah: 12, ayat: 53 }, 14: { surah: 15, ayat: 1 }, 15: { surah: 17, ayat: 1 },
    16: { surah: 18, ayat: 75 }, 17: { surah: 21, ayat: 1 }, 18: { surah: 23, ayat: 1 },
    19: { surah: 25, ayat: 21 }, 20: { surah: 27, ayat: 56 }, 21: { surah: 29, ayat: 46 },
    22: { surah: 33, ayat: 31 }, 23: { surah: 36, ayat: 28 }, 24: { surah: 39, ayat: 32 },
    25: { surah: 41, ayat: 47 }, 26: { surah: 46, ayat: 1 }, 27: { surah: 51, ayat: 31 },
    28: { surah: 58, ayat: 1 }, 29: { surah: 67, ayat: 1 }, 30: { surah: 78, ayat: 1 }
  };
  return starts[juz] || { surah: 1, ayat: 1 };
};

export const getJuzEndInfo = (juz: number) => {
  const ends: Record<number, { surah: number; ayat: number }> = {
    1: { surah: 2, ayat: 141 }, 2: { surah: 2, ayat: 252 }, 3: { surah: 3, ayat: 92 },
    4: { surah: 4, ayat: 23 }, 5: { surah: 4, ayat: 147 }, 6: { surah: 5, ayat: 81 },
    7: { surah: 6, ayat: 110 }, 8: { surah: 7, ayat: 87 }, 9: { surah: 8, ayat: 40 },
    10: { surah: 9, ayat: 92 }, 11: { surah: 11, ayat: 5 }, 12: { surah: 12, ayat: 52 },
    13: { surah: 14, ayat: 52 }, 14: { surah: 16, ayat: 128 }, 15: { surah: 18, ayat: 74 },
    16: { surah: 20, ayat: 135 }, 17: { surah: 22, ayat: 78 }, 18: { surah: 25, ayat: 20 },
    19: { surah: 27, ayat: 55 }, 20: { surah: 29, ayat: 45 }, 21: { surah: 33, ayat: 30 },
    22: { surah: 36, ayat: 27 }, 23: { surah: 39, ayat: 31 }, 24: { surah: 41, ayat: 46 },
    25: { surah: 45, ayat: 37 }, 26: { surah: 51, ayat: 30 }, 27: { surah: 57, ayat: 29 },
    28: { surah: 66, ayat: 12 }, 29: { surah: 77, ayat: 50 }, 30: { surah: 114, ayat: 6 }
  };
  return ends[juz] || { surah: 114, ayat: 6 };
};

export const resolveTargetElement = (cfg: any, elemenSettings?: ElemenSetting[]): { id: string; nama: string } => {
  if (!cfg) return { id: '', nama: 'Tahfidz' };
  const qKey = cfg.activeSTQuarter || 'q1';
  const qElemenId = cfg.quarters?.[`${qKey}ElemenId`] || cfg.selectedElemenId || '';
  
  const settings = elemenSettings || [];
  const elemObj = settings.find(e => 
    e.id === qElemenId || 
    e.nama === qElemenId || 
    e.nama?.toLowerCase().trim() === qElemenId?.toLowerCase().trim()
  );

  const nama = elemObj ? elemObj.nama : (cfg.selectedElemenName || (qElemenId ? qElemenId : 'Tahfidz'));
  const id = elemObj ? elemObj.id : (qElemenId || '');
  return { id, nama };
};

export const formatTargetRange = (cfg: any, moduls?: Modul[]): string => {
  if (!cfg) return "Belum ditentukan";
  
  const qKey = cfg.activeSTQuarter || 'q1';
  const qModulType = cfg.quarters?.[`${qKey}ModulType`] || cfg.selectedModulType || 'Al-Quran';
  const qNonQuranId = cfg.quarters?.[`${qKey}NonQuranModulId`] || cfg.selectedNonQuranModulId || '';
  
  if (cfg.targetPeriod === 'tahunan') {
    if (qModulType === 'Al-Quran') {
      if (isPaketFatihahAnnasKausar(cfg)) {
        return 'Surat Al-Fatihah & Surat An-Nas s/d Al-Kausar (8 Surat)';
      }

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
      
      const sNoAwal = getSurahNumber(sAwal);
      const sNoAkhir = getSurahNumber(sAkhir);
      const juzAwal = getQuranDefaultJuz(sNoAwal, aAwal);
      const juzAkhir = getQuranDefaultJuz(sNoAkhir, aAkhir);
      
      const juzRange = juzAwal === juzAkhir ? `Juz ${juzAwal}` : `Juz ${juzAwal} - ${juzAkhir}`;
      
      if (sAwal === sAkhir) {
        return `Surat ${sAwal} (${juzRange})`;
      }
      return `Surat ${sAwal} s/d Surat ${sAkhir} (${juzRange})`;
    } else {
      const selectedModulObj = moduls?.find(m => m.id === qNonQuranId);
      const isSingleJilid = selectedModulObj ? (!selectedModulObj.isMultiJilid || !selectedModulObj.jumlahJilid || selectedModulObj.jumlahJilid <= 1) : false;
      const modulLabel = selectedModulObj ? (selectedModulObj.judulModul || selectedModulObj.namaSurat) : "Selain Al-Quran";
      
      let jAwal = cfg.tahunanJilidAwal || '1';
      let hAwal = cfg.tahunanHalamanAwal || '1';
      let jAkhir = cfg.tahunanJilidAkhir || '1';
      let hAkhir = cfg.tahunanHalamanAkhir || '40';
      
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
          jAwal = firstTarget.jilidAwal || jAwal;
          hAwal = firstTarget.halamanAwal || hAwal;
          jAkhir = lastTarget.jilidAkhir || jAkhir;
          hAkhir = lastTarget.halamanAkhir || hAkhir;
        }
      }
      
      if (isSingleJilid) {
        return `${modulLabel} Halaman ${hAwal} s/d ${hAkhir}`;
      } else {
        return `${modulLabel} Jilid ${jAwal} (Hal ${hAwal}) s/d Jilid ${jAkhir} (Hal ${hAkhir})`;
      }
    }
  }

  // Kuartal / Short Term
  const quarters = cfg.quarters || {};
  const currentQ = quarters[qKey] || {};
  if (qModulType === 'Al-Quran') {
    const sAwal = currentQ[`${qKey}SuratAwal`] || 'Al-Fatihah';
    const sAkhir = currentQ[`${qKey}SuratAkhir`] || 'An-Nas';
    return `Kuartal (${qKey.toUpperCase()}): Surat ${sAwal} s/d ${sAkhir}`;
  } else {
    const selectedModulObj = moduls?.find(m => m.id === qNonQuranId);
    const modulLabel = selectedModulObj ? (selectedModulObj.judulModul || selectedModulObj.namaSurat) : "Selain Al-Quran";
    return `Kuartal (${qKey.toUpperCase()}): ${modulLabel}`;
  }
};

export const getDurasiTargetLabel = (bulanDuration?: number | string): string => {
  const dur = Number(bulanDuration) || 12;
  switch (dur) {
    case 12:
      return "12 Bulan (1 Tahun Penuh)";
    case 10:
      return "10 Bulan (Tahun Ajaran Efektif)";
    case 6:
      return "6 Bulan (1 Semester)";
    case 3:
      return "3 Bulan (1 Kuartal)";
    case 1:
      return "1 Bulan";
    default:
      return `${dur} Bulan`;
  }
};

export const INDONESIAN_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDONESIAN_MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export const calculateTargetDateRange = (cfg: any) => {
  if (!cfg) return null;
  const startDay = Math.min(31, Math.max(1, Number(cfg.startDay) || 1));
  const startMonth = Math.min(12, Math.max(1, Number(cfg.startMonth) || (new Date().getMonth() + 1))); // 1 - 12
  const startYear = Number(cfg.startYear) || new Date().getFullYear();
  const dur = Number(cfg.tahunanBulanDuration) || 12;

  const startDate = new Date(startYear, startMonth - 1, startDay);
  // Tanggal target selesai: bertambah dur bulan, berkurang 1 hari
  const endDate = new Date(startYear, startMonth - 1 + dur, startDay - 1);

  return {
    startDate,
    endDate,
    startDay,
    startMonth,
    startYear,
    durationMonths: dur
  };
};

export const formatTargetPeriod = (cfg: any): string => {
  if (!cfg) return "Belum Diatur";
  const targetPeriod = cfg.targetPeriod || 'tahunan';
  
  if (targetPeriod === 'tahunan') {
    const durLabel = getDurasiTargetLabel(cfg.tahunanBulanDuration);
    if (cfg.startMonth) {
      const monthIdx = Math.min(11, Math.max(0, Number(cfg.startMonth) - 1));
      const mName = INDONESIAN_MONTH_SHORT[monthIdx] || INDONESIAN_MONTH_NAMES[monthIdx];
      const d = cfg.startDay ? `${cfg.startDay} ` : '';
      const y = cfg.startYear ? ` ${cfg.startYear}` : '';
      
      const range = calculateTargetDateRange(cfg);
      if (range && cfg.startDay && cfg.startYear) {
        const endMonthIdx = range.endDate.getMonth();
        const endMName = INDONESIAN_MONTH_SHORT[endMonthIdx] || INDONESIAN_MONTH_NAMES[endMonthIdx];
        const endD = range.endDate.getDate();
        const endY = range.endDate.getFullYear();
        return `${durLabel} • Mulai ${d}${mName}${y} s/d ${endD} ${endMName} ${endY}`;
      }
      return `${durLabel} • Mulai ${d}${mName}${y}`;
    }
    return durLabel;
  }
  
  if (targetPeriod === 'kuartal') {
    const qKey = (cfg.activeSTQuarter || 'q1').toLowerCase();
    const qMap: Record<string, string> = {
      q1: "Kuartal 1 (Bulan 1 - 3)",
      q2: "Kuartal 2 (Bulan 4 - 6)",
      q3: "Kuartal 3 (Bulan 7 - 9)",
      q4: "Kuartal 4 (Bulan 10 - 12)",
    };
    const base = qMap[qKey] || `Kuartal ${qKey.toUpperCase()}`;
    if (cfg.startMonth) {
      const monthIdx = Math.min(11, Math.max(0, Number(cfg.startMonth) - 1));
      const mName = INDONESIAN_MONTH_SHORT[monthIdx] || INDONESIAN_MONTH_NAMES[monthIdx];
      const d = cfg.startDay ? `${cfg.startDay} ` : '';
      const y = cfg.startYear ? ` ${cfg.startYear}` : '';
      return `${base} • Mulai ${d}${mName}${y}`;
    }
    return base;
  }
  return "Tahunan";
};

export const isMatchingStudent = (setoran: Setoran, student: Siswa | { id: string; nis?: string; namaLengkap?: string; nama?: string }): boolean => {
  if (!setoran || !student) return false;
  const sId = setoran.siswaId ? String(setoran.siswaId).trim() : ((setoran as any).santriId ? String((setoran as any).santriId).trim() : '');
  const stId = student.id ? String(student.id).trim() : '';
  if (sId && stId && sId.toLowerCase() === stId.toLowerCase()) return true;

  const sNis = (setoran.siswaNis || (setoran as any).nis ? String(setoran.siswaNis || (setoran as any).nis).trim() : '').toLowerCase();
  const stNis = (student as any).nis ? String((student as any).nis).trim().toLowerCase() : '';
  if (sNis && stNis && sNis === stNis) return true;
  if (sId && stNis && sId.toLowerCase() === stNis) return true;
  if (stId && sNis && stId.toLowerCase() === sNis) return true;

  // Alphanumeric clean match for NIS (e.g. "0042026-A" vs "0042026a" vs "0042026-a")
  const sNisClean = sNis.replace(/[^a-z0-9]/g, '');
  const stNisClean = stNis.replace(/[^a-z0-9]/g, '');
  if (sNisClean && stNisClean && sNisClean === stNisClean) return true;

  const sNama = (setoran.siswaNama || (setoran as any).santriNama || (setoran as any).nama || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  const stNama = ((student as any).namaLengkap || (student as any).nama || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  if (sNama && stNama && (sNama === stNama || sNama.includes(stNama) || stNama.includes(sNama))) return true;

  return false;
};

export const isSetoranLulus = (s: Setoran): boolean => {
  if (!s) return false;
  if (s.statusLulus === true || s.statusLulus === ('true' as any) || (s.statusLulus as any) === 1) return true;
  if (s.kesimpulanHasilKelulusan && typeof s.kesimpulanHasilKelulusan === 'string') {
    const k = s.kesimpulanHasilKelulusan.toLowerCase().trim();
    if (k === 'lulus' || k.includes('lulus') || k.includes('mumtaz') || k.includes('jayyid')) return true;
  }
  return false;
};

export const normalizeElementName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/qiroah/g, 'qiraah')
    .replace(/qiro/g, 'qiraah')
    .replace(/qira/g, 'qiraah')
    .replace(/tahfiz/g, 'tahfidz')
    .replace(/tilaawah/g, 'tilawah');
};

export const isRelatedElem = (elemA: string, elemB: string): boolean => {
  const normA = normalizeElementName(elemA);
  const normB = normalizeElementName(elemB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.startsWith('qiraah') && normB.startsWith('qiraah')) return true;
  if (normA.startsWith('tahfidz') && normB.startsWith('tahfidz')) return true;
  if (normA.startsWith('tilawah') && normB.startsWith('tilawah')) return true;
  return false;
};

export const formatTanggalIndoShort = (tgl?: string): string => {
  if (!tgl) return '';
  const parts = tgl.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    const mName = INDONESIAN_MONTH_SHORT[m] || parts[1];
    return `${d} ${mName} ${y}`;
  }
  return tgl;
};

export const formatSetoranClean = (s: Setoran, targetElemName?: string): string => {
  if (!s) return 'Belum ada capaian tercatat';
  const isQuran = s.tipeModul === TipeModul.AL_QURAN || s.tipeModul === ('Al-Quran' as any) || Boolean(s.suratNama) || Boolean(s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0);
  const elemLabel = s.jenisSetoran || s.tipeTahfidz || "Setoran";

  let contentText = "";
  if (isQuran) {
    if (s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0) {
      contentText = s.daftarSuratSetoran.map(item => `${item.suratNama} (Ayat ${item.ayatAwal}-${item.ayatAkhir})`).join(', ');
    } else if (s.suratNama) {
      contentText = `Surat ${s.suratNama} (Ayat ${s.ayatAwal || 1}-${s.ayatAkhir || 1})`;
    } else {
      contentText = `Al-Qur'an`;
    }
  } else {
    contentText = `${s.modulNama || 'Halaman'} Hal ${s.halaman || s.ayatAkhir || 1}`;
  }

  const dateStr = s.tanggalSetoran ? formatTanggalIndoShort(s.tanggalSetoran) : '';
  
  if (elemLabel) {
    return `${contentText} (${elemLabel}${dateStr ? ` • ${dateStr}` : ''})`;
  }
  return dateStr ? `${contentText} (${dateStr})` : contentText;
};

export const getLatestCapaianNarative = (
  siswaId: string,
  cfg: any,
  setorans: Setoran[],
  elemenSettings?: ElemenSetting[],
  siswaObj?: Siswa
): string => {
  const { id: qElemenId, nama: elementName } = resolveTargetElement(cfg, elemenSettings);

  const studentSetoransAll = (setorans || []).filter(s => {
    if (siswaObj) {
      return isMatchingStudent(s, siswaObj);
    }
    return isMatchingStudent(s, { id: siswaId });
  });

  if (studentSetoransAll.length === 0) {
    return "Belum ada capaian tercatat";
  }

  // Sort newest first by date and id
  const sortedAll = [...studentSetoransAll].sort((a, b) => {
    const dateCmp = (b.tanggalSetoran || '').localeCompare(a.tanggalSetoran || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.id || '').localeCompare(a.id || '');
  });

  const passedSetorans = sortedAll.filter(isSetoranLulus);
  const targetElemName = (elementName || '').toLowerCase().trim();
  const targetElemId = (qElemenId || '').toLowerCase().trim();
  const isQuranTarget = !cfg || cfg.selectedModulType === 'Al-Quran';

  // 1. Try exact match with target element (passed)
  if (passedSetorans.length > 0) {
    const exactMatch = passedSetorans.find(s => {
      const sElemName = (s.jenisSetoran || '').toLowerCase().trim();
      return sElemName === targetElemName || (targetElemId && sElemName === targetElemId);
    });
    if (exactMatch) {
      return formatSetoranClean(exactMatch, targetElemName);
    }

    // 2. Try related element (same category root: qiraah / tahfidz / tilawah)
    const relatedMatch = passedSetorans.find(s => {
      return isRelatedElem(s.jenisSetoran || '', elementName);
    });
    if (relatedMatch) {
      return formatSetoranClean(relatedMatch, targetElemName);
    }

    // 3. Try matching target module type (Quran vs Non-Quran passed)
    const modulTypeMatch = passedSetorans.find(s => {
      const isSQuran = s.tipeModul === TipeModul.AL_QURAN || s.tipeModul === ('Al-Quran' as any) || Boolean(s.suratNama) || Boolean(s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0);
      return isQuranTarget ? isSQuran : !isSQuran;
    });
    if (modulTypeMatch) {
      return formatSetoranClean(modulTypeMatch, targetElemName);
    }

    // 4. Fallback to latest passed setoran of any type
    return formatSetoranClean(passedSetorans[0], targetElemName);
  }

  // 5. Fallback to latest recorded setoran of this student (even if not marked lulus)
  const latestAny = sortedAll[0];
  const formatted = formatSetoranClean(latestAny, targetElemName);
  return isSetoranLulus(latestAny) ? formatted : `${formatted} (Mengulang)`;
};

export const getTargetTextForMonth = (config: any, monthIdx: number, moduls?: Modul[]): string => {
  if (!config) return 'Target Belum Dikonfigurasi';
  const mTarget = config.tahunanMonthlyTargets?.[monthIdx];
  if (!mTarget) return 'Target Belum Dikonfigurasi';

  const isQuran = config.selectedModulType === 'Al-Quran';
  if (isQuran) {
    if (mTarget.catatan) {
      return `📖 ${mTarget.catatan}`;
    }
    if (mTarget.suratAwal && mTarget.suratAwal === mTarget.suratAkhir) {
      return `📖 Surat ${mTarget.suratAwal} (Ayat ${mTarget.ayatAwal || 1}-${mTarget.ayatAkhir || 1})`;
    }
    return `📖 Surat ${mTarget.suratAwal || 'Al-Fatihah'} (${mTarget.ayatAwal || 1}) s/d Surat ${mTarget.suratAkhir || 'An-Nas'} (${mTarget.ayatAkhir || 6})`;
  } else {
    const qNonQuranId = config.selectedNonQuranModulId || '';
    const qModulObj = moduls?.find(m => m.id === qNonQuranId);
    const qIsSingleJilid = qModulObj ? (!qModulObj.isMultiJilid || !qModulObj.jumlahJilid || qModulObj.jumlahJilid <= 1) : false;
    
    if (qIsSingleJilid) {
      return `📚 ${qModulObj?.judulModul || 'Modul'}: Halaman ${mTarget.halamanAwal || 1} s/d ${mTarget.halamanAkhir || 10}`;
    } else {
      return `📚 ${qModulObj?.judulModul || 'Modul'}: Jilid ${mTarget.jilidAwal || 1} (Hal ${mTarget.halamanAwal || 1}) s/d Jilid ${mTarget.jilidAkhir || 1} (Hal ${mTarget.halamanAkhir || 10})`;
    }
  }
};

export const getQuranTargetRange = (cfg: any) => {
  if (!cfg) return null;
  if (isPaketFatihahAnnasKausar(cfg)) {
    return { sAwalNo: 1, aAwal: 1, sAkhirNo: 108, aAkhir: 3 };
  }
  let sAwalNo = 0;
  let aAwal = 1;
  let sAkhirNo = 0;
  let aAkhir = 6;

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
      sAwalNo = getSurahNumber(firstTarget.suratAwal || '');
      aAwal = Number(firstTarget.ayatAwal || 1);
      sAkhirNo = getSurahNumber(lastTarget.suratAkhir || '');
      aAkhir = Number(lastTarget.ayatAkhir || 1);
    }
  }

  if (sAwalNo === 0 || sAkhirNo === 0) {
    if (cfg.tahunanMode === 'juz') {
      const jAwal = Number(cfg.tahunanJuzAwal || 1);
      const jAkhir = Number(cfg.tahunanJuzAkhir || 30);
      const isAsc = jAwal <= jAkhir;
      const sStart = isAsc ? getJuzStartInfo(jAwal) : getJuzStartInfo(jAwal);
      const sEnd = isAsc ? getJuzEndInfo(jAkhir) : getJuzEndInfo(jAkhir);
      sAwalNo = sStart.surah;
      aAwal = sStart.ayat;
      sAkhirNo = sEnd.surah;
      aAkhir = sEnd.ayat;
    } else {
      sAwalNo = getSurahNumber(cfg.tahunanSuratAwal || 'Al-Fatihah');
      aAwal = Number(cfg.tahunanAyatAwal || 1);
      sAkhirNo = getSurahNumber(cfg.tahunanSuratAkhir || 'An-Nas');
      aAkhir = Number(cfg.tahunanAyatAkhir || 6);
    }
  }

  return { sAwalNo, aAwal, sAkhirNo, aAkhir };
};

export const buildVersesSetInRange = (
  sAwalNo: number,
  aAwal: number,
  sAkhirNo: number,
  aAkhir: number,
  currentCfg?: any,
  moduls?: Modul[]
): Set<string> => {
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
    const totalAyat = getSurahJumlahAyat(sNo, moduls);
    let startA = 1;
    let endA = totalAyat;

    if (sNo === sAwalNo) {
      startA = aAwal;
    }
    if (sNo === sAkhirNo) {
      endA = aAkhir;
    }

    if (sAwalNo === sAkhirNo) {
      startA = Math.min(aAwal, aAkhir);
      endA = Math.max(aAwal, aAkhir);
    }

    for (let a = startA; a <= endA; a++) {
      set.add(`${sNo}-${a}`);
    }
  }
  return set;
};

export interface StudentProgressResult {
  siswa: Siswa;
  config: any;
  percent: number;
  isCustom: boolean;
  targetRangeText: string;
  targetPeriodText: string;
  elementName: string;
  latestCapaianText: string;
  setoransCount: number;
  totalPassedSetoransCount?: number;
  targetSetoransCount?: number;
  isCompleted: boolean;
  memorizedCount?: number;
  totalTargetCount?: number;
}

export const calculateStudentProgress = (
  siswa: Siswa,
  halaqah: Halaqah | undefined,
  studentTargets: Record<string, any>,
  generalTargets: any,
  setorans: Setoran[],
  moduls: Modul[],
  elemenSettings: ElemenSetting[]
): StudentProgressResult => {
  const savedTarget = studentTargets[siswa.id];
  const isCustom = !!(savedTarget?.isCustom && savedTarget?.config);
  const config = isCustom ? savedTarget.config : (halaqah?.targetConfig || generalTargets?.config);

  const { id: qElemenId, nama: elementName } = resolveTargetElement(config, elemenSettings);
  const targetRangeText = formatTargetRange(config, moduls);
  const targetPeriodText = formatTargetPeriod(config);
  const latestCapaianText = getLatestCapaianNarative(siswa.id, config, setorans, elemenSettings, siswa);

  const isQuran = !config || config.selectedModulType === 'Al-Quran';
  const isNonQuran = config && config.selectedModulType === 'Selain Al-Quran';

  // All setorans and passed setorans for this student
  const allStudentSetorans = (setorans || []).filter(s => isMatchingStudent(s, siswa));
  const allStudentPassedSetorans = allStudentSetorans.filter(isSetoranLulus);

  // Filter finished setorans matching the target element and subcategory "Baru"
  const finishedSetorans = allStudentPassedSetorans.filter(s => {
    const sElemName = (s.jenisSetoran || '').toLowerCase().trim();
    const targetElemName = elementName.toLowerCase().trim();
    const targetElemId = (qElemenId || '').toLowerCase().trim();
    
    // Direct match or related element match (e.g. 'qiraah surah wajib' vs 'qiraah tambahan')
    const isExactMatch = sElemName === targetElemName || (targetElemId && sElemName === targetElemId);
    const isRelatedMatch = isRelatedElem(s.jenisSetoran || '', elementName);

    const isElemMatch = isExactMatch || isRelatedMatch;
    if (!isElemMatch) return false;

    if (isQuran || s.tipeModul === TipeModul.AL_QURAN || s.tipeModul === ('Al-Quran' as any)) {
      const sSub = (s.tipeTahfidz || '').toLowerCase().trim();
      if (sSub && (sSub.includes('murojaah') || sSub.includes('murajaah') || sSub.includes('ulang'))) {
        return false;
      }
    }

    return true;
  });

  let percent = 0;
  let memorizedCount = 0;
  let totalTargetCount = 0;

  if (isQuran) {
    const memorizedVersesSet = new Set<string>();

    if (isPaketFatihahAnnasKausar(config)) {
      const order = FATIHAH_ANNAS_KAUSAR_ORDER.map(s => s.no);
      let furthestIdx = -1;
      let furthestAyatAkhir = 0;

      finishedSetorans.forEach(s => {
        const isSQuran = s.tipeModul === TipeModul.AL_QURAN || s.tipeModul === ('Al-Quran' as any) || Boolean(s.suratNama) || Boolean(s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0);
        if (isSQuran) {
          const processItem = (sNo: number, ayatAkhir: number) => {
            const idx = order.indexOf(sNo);
            if (idx !== -1) {
              if (idx > furthestIdx) {
                furthestIdx = idx;
                furthestAyatAkhir = ayatAkhir;
              } else if (idx === furthestIdx) {
                furthestAyatAkhir = Math.max(furthestAyatAkhir, ayatAkhir);
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
        for (let i = 0; i < furthestIdx; i++) {
          const sNo = order[i];
          const totalAyat = getSurahJumlahAyat(sNo, moduls);
          for (let a = 1; a <= totalAyat; a++) {
            memorizedVersesSet.add(`${sNo}-${a}`);
          }
        }
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
          const isSQuran = s.tipeModul === TipeModul.AL_QURAN || s.tipeModul === ('Al-Quran' as any) || Boolean(s.suratNama) || Boolean(s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0);
          if (isSQuran) {
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
                } else {
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
            for (let sNo = range.sAwalNo; sNo < furthestSNo; sNo++) {
              const totalAyat = getSurahJumlahAyat(sNo, moduls);
              for (let a = 1; a <= totalAyat; a++) {
                memorizedVersesSet.add(`${sNo}-${a}`);
              }
            }
            for (let a = 1; a <= furthestAyatAkhir; a++) {
              memorizedVersesSet.add(`${furthestSNo}-${a}`);
            }
          } else {
            for (let sNo = range.sAwalNo; sNo > furthestSNo; sNo--) {
              const totalAyat = getSurahJumlahAyat(sNo, moduls);
              for (let a = 1; a <= totalAyat; a++) {
                memorizedVersesSet.add(`${sNo}-${a}`);
              }
            }
            for (let a = 1; a <= furthestAyatAkhir; a++) {
              memorizedVersesSet.add(`${furthestSNo}-${a}`);
            }
          }
        }
      }
    }

    const range = getQuranTargetRange(config);
    if (range) {
      const targetVersesSet = buildVersesSetInRange(range.sAwalNo, range.aAwal, range.sAkhirNo, range.aAkhir, config, moduls);
      totalTargetCount = targetVersesSet.size;
      if (targetVersesSet.size > 0) {
        let intersectionCount = 0;
        targetVersesSet.forEach(v => {
          if (memorizedVersesSet.has(v)) {
            intersectionCount++;
          }
        });
        memorizedCount = intersectionCount;
        percent = Math.min(100, Math.round((intersectionCount / targetVersesSet.size) * 100));
      } else {
        percent = finishedSetorans.length > 0 ? 100 : 0;
      }
    } else {
      percent = finishedSetorans.length > 0 ? 100 : 0;
    }
  } else if (isNonQuran) {
    let startJilid = Number(config.tahunanJilidAwal || 1);
    let startHalaman = Number(config.tahunanHalamanAwal || 1);
    let endJilid = Number(config.tahunanJilidAkhir || 1);
    let endHalaman = Number(config.tahunanHalamanAkhir || 100);

    let maxCompletedJilid = 0;
    let maxCompletedHalaman = 0;

    finishedSetorans.forEach(s => {
      const j = Number(s.jilid || 1);
      const h = Number(s.halaman || s.ayatAkhir || 1);
      if (j > maxCompletedJilid) {
        maxCompletedJilid = j;
        maxCompletedHalaman = h;
      } else if (j === maxCompletedJilid) {
        maxCompletedHalaman = Math.max(maxCompletedHalaman, h);
      }
    });

    const totalTargetUnits = Math.max(1, (endJilid - startJilid) * 100 + (endHalaman - startHalaman + 1));
    const currentUnits = Math.max(0, (maxCompletedJilid - startJilid) * 100 + (maxCompletedHalaman - startHalaman + 1));
    percent = Math.min(100, Math.max(0, Math.round((currentUnits / totalTargetUnits) * 100)));
  }

  const targetSetoransCount = finishedSetorans.length;
  const totalPassedSetoransCount = allStudentPassedSetorans.length;
  const setoransCount = totalPassedSetoransCount > 0 ? totalPassedSetoransCount : targetSetoransCount;

  return {
    siswa,
    config,
    percent,
    isCustom,
    targetRangeText,
    targetPeriodText,
    elementName,
    latestCapaianText,
    setoransCount,
    totalPassedSetoransCount,
    targetSetoransCount,
    isCompleted: percent >= 100,
    memorizedCount,
    totalTargetCount
  };
};

export const checkStudentTargetMetForMonth = (
  siswaId: string,
  monthIdx: number,
  halaqah: Halaqah | undefined,
  studentTargets: Record<string, any>,
  generalTargets: any,
  setorans: Setoran[],
  moduls: Modul[],
  elemenSettings: ElemenSetting[]
): boolean => {
  const savedTarget = studentTargets[siswaId];
  const config = (savedTarget?.isCustom && savedTarget?.config)
    ? savedTarget.config
    : (halaqah?.targetConfig || generalTargets?.config);

  if (!config || config.targetPeriod !== 'tahunan') return false;

  const mTarget = config.tahunanMonthlyTargets?.[monthIdx];
  if (!mTarget) return false;

  const isQuran = config.selectedModulType === 'Al-Quran';
  const { id: qElemenId, nama: elementName } = resolveTargetElement(config, elemenSettings);

  const finishedSetorans = setorans.filter(s => {
    if (!isMatchingStudent(s, { id: siswaId }) || !isSetoranLulus(s)) return false;
    const sElemName = (s.jenisSetoran || '').toLowerCase().trim();
    const targetElemName = elementName.toLowerCase().trim();
    const targetElemId = (qElemenId || '').toLowerCase().trim();
    
    const isExactMatch = sElemName === targetElemName || (targetElemId && sElemName === targetElemId);
    const isRelatedMatch = isRelatedElem(s.jenisSetoran || '', elementName);

    const isElemMatch = isExactMatch || isRelatedMatch;
    if (!isElemMatch) return false;

    if (isQuran || s.tipeModul === TipeModul.AL_QURAN || s.tipeModul === ('Al-Quran' as any)) {
      const sSub = (s.tipeTahfidz || '').toLowerCase().trim();
      if (sSub && (sSub.includes('murojaah') || sSub.includes('murajaah') || sSub.includes('ulang'))) {
        return false;
      }
    }
    return true;
  });

  if (isQuran) {
    const endSurahName = mTarget.suratAkhir || mTarget.suratAwal || '';
    const endSurahNo = getSurahNumber(endSurahName);
    const endAyatNo = Number(mTarget.ayatAkhir || 1);

    if (endSurahNo === 0) return false;

    const checkS = (sNo: number, aAkhir: number) => {
      if (sNo === endSurahNo && aAkhir >= endAyatNo) return true;
      if (isPaketFatihahAnnasKausar(config)) {
        const order = FATIHAH_ANNAS_KAUSAR_ORDER.map(s => s.no);
        const curIdx = order.indexOf(sNo);
        const targetIdx = order.indexOf(endSurahNo);
        if (curIdx > targetIdx && targetIdx !== -1) return true;
        if (curIdx === targetIdx && aAkhir >= endAyatNo) return true;
      } else {
        const range = getQuranTargetRange(config);
        const isAscending = range ? range.sAwalNo <= range.sAkhirNo : true;
        if (isAscending) {
          if (sNo > endSurahNo) return true;
          if (sNo === endSurahNo && aAkhir >= endAyatNo) return true;
        } else {
          if (sNo < endSurahNo && sNo > 0) return true;
          if (sNo === endSurahNo && aAkhir >= endAyatNo) return true;
        }
      }
      return false;
    };

    return finishedSetorans.some(s => {
      if (s.suratNama && checkS(getSurahNumber(s.suratNama), s.ayatAkhir || 1)) return true;
      if (s.daftarSuratSetoran) {
        return s.daftarSuratSetoran.some(sub => checkS(getSurahNumber(sub.suratNama), sub.ayatAkhir || 1));
      }
      return false;
    });
  } else {
    const targetJilid = Number(mTarget.jilidAkhir || mTarget.jilidAwal || 1);
    const targetHalaman = Number(mTarget.halamanAkhir || mTarget.halamanAwal || 1);

    return finishedSetorans.some(s => {
      const sJilid = Number(s.jilid || 1);
      const sHalaman = Number(s.halaman || s.ayatAkhir || 1);
      if (sJilid > targetJilid) return true;
      if (sJilid === targetJilid && sHalaman >= targetHalaman) return true;
      return false;
    });
  }
};

export const getModulSurahNumber = (m: Modul): number => {
  if (!m) return 0;
  if (m.nomorUrutSurat && m.nomorUrutSurat > 0) return m.nomorUrutSurat;
  return getSurahNumber(m.namaSurat || m.judulModul || '');
};

export const filterModulesForElemen = (moduls: Modul[], elem?: ElemenSetting): Modul[] => {
  if (!elem || !Array.isArray(moduls)) return [];

  if (elem.tipeModul === TipeModul.NON_AL_QURAN) {
    if (elem.referensiModulId) {
      const direct = moduls.find(m => m.id === elem.referensiModulId);
      if (direct) return [direct];
    }
    const byElem = moduls.filter(m => m.elemenId === elem.id || m.elemenNama === elem.nama);
    if (byElem.length > 0) return byElem;
    return moduls.filter(m => m.tipe === elem.tipeModul);
  }

  const allQuranModuls = moduls.filter(m => m.tipe === TipeModul.AL_QURAN);
  const byElem = allQuranModuls.filter(m => m.elemenId === elem.id || m.elemenNama === elem.nama);
  const basePool = byElem.length > 0 ? byElem : allQuranModuls;

  if (elem.targetCakupanMateri === 'juz_range') {
    const rawStart = Number(elem.targetJuzStart) || 30;
    const rawEnd = Number(elem.targetJuzEnd) || rawStart;
    const minJuz = Math.max(1, Math.min(30, Math.min(rawStart, rawEnd)));
    const maxJuz = Math.max(1, Math.min(30, Math.max(rawStart, rawEnd)));
    const startSurah = getJuzStartInfo(minJuz).surah;
    const endSurah = getJuzEndInfo(maxJuz).surah;

    const filterByJuzRange = (list: Modul[]) =>
      list.filter(m => {
        const sNo = getModulSurahNumber(m);
        return sNo >= startSurah && sNo <= endSurah;
      });

    const scoped = filterByJuzRange(basePool);
    if (scoped.length > 0 || byElem.length === 0) {
      return scoped;
    }
    return filterByJuzRange(allQuranModuls);
  }

  if (elem.targetCakupanMateri === 'surah_pilihan' && Array.isArray(elem.targetSurahList) && elem.targetSurahList.length > 0) {
    const orderedSurahNos = elem.targetSurahList.map(Number).filter(n => n > 0);
    const allowedSet = new Set(orderedSurahNos);

    const filterAndSortBySurahPilihan = (list: Modul[]) =>
      list
        .filter(m => allowedSet.has(getModulSurahNumber(m)))
        .sort((a, b) => {
          const noA = getModulSurahNumber(a);
          const noB = getModulSurahNumber(b);
          const idxA = orderedSurahNos.indexOf(noA);
          const idxB = orderedSurahNos.indexOf(noB);
          if (idxA !== idxB) return idxA - idxB;
          return noA - noB;
        });

    const scoped = filterAndSortBySurahPilihan(basePool);
    if (scoped.length > 0 || byElem.length === 0) {
      return scoped;
    }
    return filterAndSortBySurahPilihan(allQuranModuls);
  }

  return basePool;
};

export const getElemenModulScopeLabel = (elem?: ElemenSetting, matchedCount?: number): string | null => {
  if (!elem || elem.tipeModul !== TipeModul.AL_QURAN) return null;
  if (elem.targetCakupanMateri === 'juz_range') {
    const rawStart = Number(elem.targetJuzStart) || 30;
    const rawEnd = Number(elem.targetJuzEnd) || rawStart;
    const minJuz = Math.max(1, Math.min(30, Math.min(rawStart, rawEnd)));
    const maxJuz = Math.max(1, Math.min(30, Math.max(rawStart, rawEnd)));
    const juzText = minJuz === maxJuz ? `Juz ${minJuz}` : `Juz ${minJuz} – ${maxJuz}`;
    return matchedCount !== undefined ? `${juzText} (${matchedCount} Surah)` : juzText;
  }
  if (elem.targetCakupanMateri === 'surah_pilihan' && Array.isArray(elem.targetSurahList) && elem.targetSurahList.length > 0) {
    const count = matchedCount !== undefined ? matchedCount : elem.targetSurahList.length;
    return `${count} Surah Pilihan`;
  }
  return null;
};

