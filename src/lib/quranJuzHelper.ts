// Helper to map and resolve accurate Quran Juz for any Surah and Verse (Ayat)
export interface JuzStartMarker {
  juz: number;
  surah: number;
  ayat: number;
}

export const QURAN_JUZ_STARTS: JuzStartMarker[] = [
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

export function getQuranDefaultJuz(surahNo: number, ayatNo: number = 1): number {
  if (!surahNo || surahNo <= 0) return 30;
  
  for (const start of QURAN_JUZ_STARTS) {
    if (surahNo > start.surah) {
      return start.juz;
    }
    if (surahNo === start.surah && ayatNo >= start.ayat) {
      return start.juz;
    }
  }

  return 1;
}
