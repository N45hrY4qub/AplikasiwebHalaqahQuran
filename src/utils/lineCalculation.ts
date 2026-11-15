import { ElemenSetting, Modul, TipeModul, QuranLinesConfig } from '../types';

export const DEFAULT_FALLBACK_QURAN_LINES: QuranLinesConfig = {
  defaultLinesPerPage: 15,
  customPageLines: [
    { page: 1, lines: 7 },
    { page: 2, lines: 7 }
  ]
};

/**
 * Gets the configured line count for a specific page of a module / element.
 * Prioritizes:
 * 1. Element custom override exceptions (if useCustomLinesConfig is true)
 * 2. Element custom default lines (if useCustomLinesConfig is true)
 * 3. Module level:
 *    - For Al-Quran: Central QuranLinesConfig (default 15 lines, pages 1 & 2 = 7 lines)
 *    - For Non-Quran: Module custom exceptions (customPageLines) & defaultLinesPerPage
 * 4. Global standard default (15 lines)
 */
export function getElemenLineCountForPage(
  elemen: ElemenSetting | undefined,
  modul: Modul | undefined,
  pageNumber: number,
  jilidIndex: number = 0,
  quranConfig?: QuranLinesConfig
): number {
  const safePage = Math.max(1, pageNumber);
  const jilidNum = jilidIndex + 1;

  // 1. Check if Element has custom lines override active
  if (elemen?.useCustomLinesConfig) {
    if (elemen.customPageLines && elemen.customPageLines.length > 0) {
      const exception = elemen.customPageLines.find(
        ex => ex.page === safePage && (ex.jilid === undefined || ex.jilid === jilidNum)
      );
      if (exception && exception.lines > 0) {
        return exception.lines;
      }
    }
    if (elemen.defaultLinesPerPage && elemen.defaultLinesPerPage > 0) {
      return elemen.defaultLinesPerPage;
    }
  }

  const isQuran = modul?.tipe === TipeModul.AL_QURAN || (!modul && elemen?.tipeModul === TipeModul.AL_QURAN);

  // 2. Al-Quran Mushaf centralized line configuration
  if (isQuran) {
    const qConfig = quranConfig || DEFAULT_FALLBACK_QURAN_LINES;
    if (qConfig.customPageLines && qConfig.customPageLines.length > 0) {
      const exception = qConfig.customPageLines.find(ex => ex.page === safePage);
      if (exception && exception.lines > 0) {
        return exception.lines;
      }
    }
    return qConfig.defaultLinesPerPage || 15;
  }

  // 3. Modul Non-Quran configuration
  if (modul) {
    // 3a. Module customPageLines exceptions
    if (modul.customPageLines && modul.customPageLines.length > 0) {
      const exception = modul.customPageLines.find(
        ex => ex.page === safePage && (ex.jilid === undefined || ex.jilid === jilidNum)
      );
      if (exception && exception.lines > 0) {
        return exception.lines;
      }
    }

    // 3b. Module per-page array mapping (legacy/granular)
    const pageIndex = safePage - 1;
    const arrayCount = modul.isMultiJilid
      ? modul.jumlahBarisPerHalamanPerJilid?.[jilidIndex]?.[pageIndex]
      : modul.jumlahBarisPerHalaman?.[pageIndex];

    if (arrayCount !== undefined && arrayCount !== null && arrayCount > 0) {
      return arrayCount;
    }

    // 3c. Module default lines per page
    if (modul.defaultLinesPerPage && modul.defaultLinesPerPage > 0) {
      return modul.defaultLinesPerPage;
    }
  }

  return 15;
}

/**
 * Calculates the total number of lines across a continuous range of pages.
 */
export function calculateTotalLinesForRange(
  elemen: ElemenSetting | undefined,
  modul: Modul | undefined,
  pageStart: number,
  pageEnd: number,
  jilidIndex: number = 0,
  quranConfig?: QuranLinesConfig
): number {
  const start = Math.min(pageStart, pageEnd);
  const end = Math.max(pageStart, pageEnd);
  let total = 0;
  for (let p = start; p <= end; p++) {
    total += getElemenLineCountForPage(elemen, modul, p, jilidIndex, quranConfig);
  }
  return total;
}

/**
 * Returns a human-readable description of how line counts are derived for this element/modul.
 */
export function getLineConfigurationInfo(
  elemen: ElemenSetting | undefined,
  modul: Modul | undefined,
  quranConfig?: QuranLinesConfig
): {
  source: 'elemen_override' | 'modul_inherited' | 'default_system';
  defaultLines: number;
  exceptionsCount: number;
  description: string;
} {
  if (elemen?.useCustomLinesConfig) {
    const defaultLines = elemen.defaultLinesPerPage || 15;
    const exceptionsCount = elemen.customPageLines?.length || 0;
    return {
      source: 'elemen_override',
      defaultLines,
      exceptionsCount,
      description: `Kustomisasi Elemen: ${defaultLines} baris/hlm (${exceptionsCount} pengecualian halaman)`
    };
  }

  const isQuran = modul?.tipe === TipeModul.AL_QURAN || (!modul && elemen?.tipeModul === TipeModul.AL_QURAN);

  if (isQuran) {
    const qConfig = quranConfig || DEFAULT_FALLBACK_QURAN_LINES;
    const defaultLines = qConfig.defaultLinesPerPage || 15;
    const exceptionsCount = qConfig.customPageLines?.length || 0;
    return {
      source: 'modul_inherited',
      defaultLines,
      exceptionsCount,
      description: `Mewarisi Mushaf Al-Qur'an: ${defaultLines} baris/hlm (${exceptionsCount} pengecualian halaman)`
    };
  }

  if (modul) {
    const defaultLines = modul.defaultLinesPerPage || 15;
    const exceptionsCount = (modul.customPageLines?.length || 0) + 
      (modul.jumlahBarisPerHalaman?.filter(c => c !== null && c !== undefined && c !== defaultLines).length || 0);
    return {
      source: 'modul_inherited',
      defaultLines,
      exceptionsCount,
      description: `Mewarisi Modul (${modul.judulModul || modul.namaSurat || 'Modul'}): ${defaultLines} baris/hlm (${exceptionsCount} pengecualian)`
    };
  }

  return {
    source: 'default_system',
    defaultLines: 15,
    exceptionsCount: 0,
    description: 'Standar Sistem: 15 baris/halaman'
  };
}
