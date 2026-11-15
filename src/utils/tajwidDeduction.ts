// src/utils/tajwidDeduction.ts
// Single source of truth for Tajwid / Makhraj Subcategories, Hijaiyah Resolution, and Deduction Tracking

export interface TajwidSubcategoryItem {
  id: string;
  nama: string;
}

export const DEFAULT_HIJAIYAH_SUBCATS: TajwidSubcategoryItem[] = [
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

// Mapping of letters and transliterated names to canonical Arabic hijaiyah character
export const HIJAIYAH_CANONICAL_CHAR: Record<string, string> = {
  'ا': 'ا', 'alif': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
  'ب': 'ب', 'ba': 'ب',
  'ت': 'ت', 'ta': 'ت', 'ة': 'ت',
  'ث': 'ث', 'tsa': 'ث', 'ts': 'ث',
  'ج': 'ج', 'jim': 'ج',
  'ح': 'ح', 'ha': 'ح', 'haa': 'ح',
  'خ': 'خ', 'kha': 'خ', 'kho': 'خ',
  'د': 'د', 'dal': 'د',
  'ذ': 'ذ', 'dzal': 'ذ', 'dza': 'ذ',
  'ر': 'ر', 'ra': 'ر', 'ro': 'ر',
  'ز': 'ز', 'zai': 'ز', 'za': 'ز',
  'س': 'س', 'sin': 'س',
  'ش': 'ش', 'syin': 'ش', 'syi': 'ش',
  'ص': 'ص', 'shad': 'ص', 'shod': 'ص',
  'ض': 'ض', 'dhad': 'ض', 'dhod': 'ض',
  'ط': 'ط', 'tha': 'ط', 'tho': 'ط',
  'ظ': 'ظ', 'zha': 'ظ', 'zho': 'ظ',
  'ع': 'ع', 'ain': 'ع', "'ain": 'ع',
  'غ': 'غ', 'ghain': 'غ', 'gho': 'غ',
  'ف': 'ف', 'fa': 'ف',
  'ق': 'ق', 'qaf': 'ق', 'qof': 'ق',
  'ك': 'ك', 'kaf': 'ك',
  'ل': 'ل', 'lam': 'ل',
  'م': 'م', 'mim': 'م',
  'ن': 'ن', 'nun': 'ن',
  'و': 'و', 'waw': 'و', 'wau': 'و',
  'ه': 'هـ', 'هـ': 'هـ', 'ha_besar': 'هـ', 'habesar': 'هـ',
  'ء': 'ء', 'hamzah': 'ء', 'hamza': 'ء',
  'ي': 'ي', 'ya': 'ي', 'ى': 'ي'
};

/**
 * Normalizes any hijaiyah input (character, subcategory name, transliterated name)
 * into a canonical object with the Arabic character and formatted display name.
 */
export function resolveHijaiyahLetter(input?: string): { char: string; name: string; id: string } | null {
  if (!input) return null;
  const str = input.trim();

  // Check if string contains Arabic characters
  const arMatch = str.match(/([\u0621-\u064A])/);
  if (arMatch && arMatch[1]) {
    const rawChar = arMatch[1];
    const canonical = HIJAIYAH_CANONICAL_CHAR[rawChar] || rawChar;
    const found = DEFAULT_HIJAIYAH_SUBCATS.find(s => s.nama.startsWith(canonical) || s.id === canonical);
    return {
      char: canonical,
      name: found ? found.nama : `${canonical}`,
      id: found ? found.id : canonical
    };
  }

  // Check if matches Latin transliteration
  const clean = str.toLowerCase().replace(/[^a-z]/g, '');
  if (clean && HIJAIYAH_CANONICAL_CHAR[clean]) {
    const canonical = HIJAIYAH_CANONICAL_CHAR[clean];
    const found = DEFAULT_HIJAIYAH_SUBCATS.find(s => s.nama.startsWith(canonical));
    return {
      char: canonical,
      name: found ? found.nama : canonical,
      id: found ? found.id : clean
    };
  }

  return null;
}

/**
 * Extracts hijaiyah letter from freeform notes or comments like:
 * "Makhraj Huruf (ع ('Ain)): tidak tepat"
 * "salah pada huruf ع"
 * "huruf ain kurang jelas"
 * "(ق)"
 */
export function extractHijaiyahFromText(text?: string): { char: string; name: string; id: string } | null {
  if (!text) return null;

  // 1. Look for patterns inside parentheses like (ع ('Ain)) or (ع) or (ق)
  const parenArMatch = text.match(/\(([\u0621-\u064A])(?:\s*\([^)]+\))?\)/);
  if (parenArMatch && parenArMatch[1]) {
    return resolveHijaiyahLetter(parenArMatch[1]);
  }

  // 2. Look for "huruf [char/name]" e.g. "huruf ع", "huruf ain", "huruf qaf"
  const hurufMatch = text.match(/huruf\s+([\u0621-\u064A]|[a-z']+)/i);
  if (hurufMatch && hurufMatch[1]) {
    const res = resolveHijaiyahLetter(hurufMatch[1]);
    if (res) return res;
  }

  // 3. Look for any standalone Arabic letter
  const standaloneMatch = text.match(/(?:^|\s)([\u0621-\u064A])(?:\s|$)/);
  if (standaloneMatch && standaloneMatch[1]) {
    return resolveHijaiyahLetter(standaloneMatch[1]);
  }

  return null;
}

/**
 * Extracts unique hijaiyah letters present in an Arabic word (ignoring tashkeel/harakat).
 * Used to give teachers instant 1-tap recommendations for letters in the selected word!
 */
export function extractLettersFromArabicWord(word?: string): Array<{ id: string; nama: string; char: string }> {
  if (!word) return [];
  // Strip tashkeel, harakat, tanwin, dagger alif, and Quranic stop marks
  const clean = word.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '').trim();
  const res: Array<{ id: string; nama: string; char: string }> = [];
  const seen = new Set<string>();

  for (const ch of clean) {
    const canonical = HIJAIYAH_CANONICAL_CHAR[ch];
    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      const sub = DEFAULT_HIJAIYAH_SUBCATS.find(s => s.nama.startsWith(canonical));
      if (sub) {
        res.push({ id: sub.id, nama: sub.nama, char: canonical });
      } else {
        res.push({ id: canonical, nama: canonical, char: canonical });
      }
    }
  }

  return res;
}

/**
 * Checks if a category name or ID represents Makhraj or Hijaiyah.
 */
export function isMakhrajOrHijaiyahCategory(catNameOrId?: string): boolean {
  if (!catNameOrId) return false;
  const lower = catNameOrId.toLowerCase();
  return (
    lower.includes('makhraj') ||
    lower.includes('makharij') ||
    lower.includes('hijaiyah') ||
    lower.includes('huruf')
  );
}

/**
 * Retrieves the list of subcategories for a category.
 * If the category has explicit subcategories, returns them.
 * If it's a Makhraj/Huruf category and subcategories are empty/undefined,
 * defaults to the standard 29 Hijaiyah letters.
 */
export function getCategorySubcategoriesList(catObj?: any, catName?: string): TajwidSubcategoryItem[] {
  if (catObj?.subcategories && Array.isArray(catObj.subcategories) && catObj.subcategories.length > 0) {
    return catObj.subcategories;
  }
  const nameLower = (catName || catObj?.nama || '').toLowerCase();
  const idLower = (catObj?.id || '').toLowerCase();
  if (
    isMakhrajOrHijaiyahCategory(nameLower) ||
    isMakhrajOrHijaiyahCategory(idLower)
  ) {
    return DEFAULT_HIJAIYAH_SUBCATS;
  }
  return [];
}

/**
 * Generates a consistent tracking key for deduction calculation.
 * If category has subcategories (or is Makhraj):
 *   Tracking key is specific to that letter or subcategory (e.g. "makhrajhuruf:::hijaiyah_ع").
 *   This ensures:
 *     - 2 mistakes on 'ع' -> counted 1x
 *     - 1 mistake on 'ق' -> counted as 2nd mistake
 *     - repeat on 'ع' or 'ق' -> still 2 mistakes
 * If category does NOT have subcategories (e.g. Idgham Bighunnah):
 *   Tracking key is category-wide ("idghambighunnah:::_general").
 */
export function resolveSubcategoryTrackingKey(params: {
  canonKey: string;
  categoryName?: string;
  subcategory?: string;
  comment?: string;
  target?: string;
  targetKey?: string;
  commentId?: string;
  hasSubcategories?: boolean;
}): { trackingKey: string; resolvedSubcategoryName?: string; isSubcategorySpecific: boolean } {
  const { canonKey, categoryName, subcategory, comment, target, targetKey, commentId, hasSubcategories } = params;

  const isMakhraj = isMakhrajOrHijaiyahCategory(categoryName) || isMakhrajOrHijaiyahCategory(canonKey);
  const treatAsSubcategory = Boolean(hasSubcategories || isMakhraj);

  if (treatAsSubcategory) {
    // 1. Try explicit subcategory
    if (subcategory) {
      const hijaiyah = resolveHijaiyahLetter(subcategory);
      if (hijaiyah) {
        return {
          trackingKey: `${canonKey}:::hijaiyah_${hijaiyah.char}`,
          resolvedSubcategoryName: hijaiyah.name,
          isSubcategorySpecific: true
        };
      }
      const cleanSub = subcategory.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return {
        trackingKey: `${canonKey}:::sub_${cleanSub}`,
        resolvedSubcategoryName: subcategory,
        isSubcategorySpecific: true
      };
    }

    // 2. Try extracting from comment
    if (comment) {
      const hijaiyahFromComment = extractHijaiyahFromText(comment);
      if (hijaiyahFromComment) {
        return {
          trackingKey: `${canonKey}:::hijaiyah_${hijaiyahFromComment.char}`,
          resolvedSubcategoryName: hijaiyahFromComment.name,
          isSubcategorySpecific: true
        };
      }
    }

    // 3. Try extracting from target word
    if (target && isMakhraj) {
      const lettersInWord = extractLettersFromArabicWord(target);
      if (lettersInWord.length === 1) {
        return {
          trackingKey: `${canonKey}:::hijaiyah_${lettersInWord[0].char}`,
          resolvedSubcategoryName: lettersInWord[0].nama,
          isSubcategorySpecific: true
        };
      }
    }

    // 4. Fallback for unclassified subcategory:
    // Do NOT merge distinct errors on different words into a single _general key.
    // Instead, assign a unique item key so each distinct mistake is counted.
    const uniqueItemKey = targetKey || (target ? target.trim() : null) || commentId || 'entry';
    return {
      trackingKey: `${canonKey}:::item_${uniqueItemKey}`,
      resolvedSubcategoryName: undefined,
      isSubcategorySpecific: false
    };
  }

  // Category does not have subcategories: apply standard category-wide deduction limit
  return {
    trackingKey: `${canonKey}:::_general`,
    resolvedSubcategoryName: undefined,
    isSubcategorySpecific: false
  };
}

export interface SetoranCommentItem {
  id: string;
  target?: string;
  targetKey?: string;
  targetKeys?: string[];
  category?: string;
  subcategory?: string;
  comment?: string;
  info?: string;
}

export interface DeductionResultDetail {
  commentId: string;
  category: string;
  resolvedSubcategory?: string;
  categoryType: 'lahn_jaliy' | 'lahn_khafiy';
  baseDeduction: number;
  deduction: number;
  isOnce: boolean;
  isDuplicate: boolean;
  trackingKey: string;
  isSubcategorySpecific: boolean;
}

export interface DeductionCalculationResult {
  totalDeductions: number;
  roundedTotalDeductions: number;
  effectiveLines: number;
  standardLines: number;
  actualLines: number;
  multiplier: number;
  isClampedMin: boolean;
  isClampedMax: boolean;
  jaliyCount: number;
  khafiyCount: number;
  jaliyDeductionTotal: number;
  khafiyDeductionTotal: number;
  details: DeductionResultDetail[];
  chargedKeys: string[];
}

/**
 * Calculates total rubric deductions for a setoran session.
 * Supports:
 * 1. Proportional line-density weighting (Error Density):
 *    Poin pengurangan per kesalahan = (Standar Baris * Bobot Lahn) / Baris Efektif
 *    - Guardrail Al-Qur'an: Min 5 baris (max 12 pt/jaliy, 6 pt/khafiy), Max 15 baris (min 4 pt/jaliy, 2 pt/khafiy)
 *    - Guardrail Non-Qur'an: Min 50% standar baris buku, Max standar baris buku
 * 2. Applies "Maks 1x Potong" per subcategory (huruf hijaiyah) when applicable,
 *    and per category for categories without subcategories.
 */
export function calculateSetoranRubrikDeductions(params: {
  comments: SetoranCommentItem[];
  tajwidCategories?: any[];
  effectiveOnceCategories?: string[];
  effectiveDeductions?: Record<string, number>;
  defaultDeduction?: number;
  rumusPenilaian?: 'absolut' | 'proporsional_baris';
  jumlahBaris?: number | string;
  isQuran?: boolean;
  standarBarisQuran?: number;
  minBarisQuran?: number;
  maxBarisQuran?: number;
  standarBarisModul?: number;
  minBarisModul?: number;
  maxBarisModul?: number;
  bobotLahnJaliy?: number;
  bobotLahnKhafiy?: number;
  bobotKlasifikasi?: Record<string, number>;
}): DeductionCalculationResult {
  const {
    comments,
    tajwidCategories = [],
    effectiveOnceCategories = ['makhraj-huruf', 'Makhraj Huruf', 'dasar-makhraj', 'Makhraj Huruf Dasar'],
    effectiveDeductions = {},
    defaultDeduction = 2,
    rumusPenilaian = 'absolut',
    jumlahBaris,
    isQuran = true,
    standarBarisQuran = 15,
    minBarisQuran = 5,
    maxBarisQuran = 15,
    standarBarisModul = 6,
    minBarisModul,
    maxBarisModul,
    bobotLahnJaliy = 4,
    bobotLahnKhafiy = 2,
    bobotKlasifikasi = {}
  } = params;

  // Proportional line configuration
  const isQuranMode = isQuran !== false;
  const stdLines = isQuranMode ? standarBarisQuran : (standarBarisModul || 6);
  const minL = isQuranMode ? minBarisQuran : (minBarisModul ?? Math.max(1, Math.round(stdLines * 0.5)));
  const maxL = isQuranMode ? maxBarisQuran : (maxBarisModul ?? stdLines);

  const parsedActualLines = (jumlahBaris !== undefined && jumlahBaris !== '' && Number(jumlahBaris) > 0)
    ? Number(jumlahBaris)
    : stdLines;

  const clampedLines = Math.min(maxL, Math.max(minL, parsedActualLines));
  const isClampedMin = parsedActualLines < minL;
  const isClampedMax = parsedActualLines > maxL;
  const multiplier = stdLines / clampedLines;

  let totalRawDeductions = 0;
  let jaliyCount = 0;
  let khafiyCount = 0;
  let jaliyDeductionTotal = 0;
  let khafiyDeductionTotal = 0;

  const chargedOnceCategories = new Set<string>();
  const details: DeductionResultDetail[] = [];

  const findDeductionVal = (catKey?: string): number => {
    if (!catKey) return 0;
    if (effectiveDeductions[catKey] !== undefined && Number(effectiveDeductions[catKey]) > 0) {
      return Number(effectiveDeductions[catKey]);
    }
    const cleanKey = catKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, v] of Object.entries(effectiveDeductions)) {
      if (k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey && Number(v) > 0) {
        return Number(v);
      }
    }
    return 0;
  };

  const isCategoryOnce = (searchKey?: string): { isOnce: boolean; canonKey: string; matchedCat?: any } => {
    if (!searchKey) return { isOnce: false, canonKey: '' };
    const cleanSearch = searchKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = tajwidCategories.find(tc =>
      tc.id === searchKey ||
      tc.nama === searchKey ||
      tc.id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSearch ||
      tc.nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSearch
    );
    const canonKey = matched ? matched.id.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : cleanSearch;
    const isOnce = effectiveOnceCategories.some(c => {
      const cleanC = c.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanC === cleanSearch || cleanC === canonKey) return true;
      if (matched) {
        const matchNamaClean = matched.nama.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanC === matchNamaClean) return true;
      }
      return false;
    });
    return { isOnce, canonKey, matchedCat: matched };
  };

  comments.forEach(comment => {
    const catId = comment.category || 'Lainnya';
    const { isOnce, canonKey, matchedCat } = isCategoryOnce(catId);

    // Determine category type (Lahn Jaliy vs Lahn Khafiy vs custom classification)
    const rawTipe = matchedCat?.tipe || (catId.toLowerCase().includes('jaliy') ? 'lahn_jaliy' : (catId.toLowerCase().includes('khafiy') ? 'lahn_khafiy' : ''));
    const isJaliy = Boolean(
      rawTipe === 'lahn_jaliy' ||
      rawTipe === 'dasar' ||
      catId.toLowerCase().includes('jaliy') ||
      catId.toLowerCase().includes('dasar') ||
      matchedCat?.nama?.toLowerCase().includes('jaliy') ||
      matchedCat?.nama?.toLowerCase().includes('dasar')
    );
    const categoryType: 'lahn_jaliy' | 'lahn_khafiy' = isJaliy ? 'lahn_jaliy' : 'lahn_khafiy';

    // Base deduction lookup
    let baseDeduction = findDeductionVal(catId);
    if (baseDeduction === 0 && matchedCat) {
      baseDeduction = findDeductionVal(matchedCat.id) || findDeductionVal(matchedCat.nama);
    }
    if (baseDeduction === 0) {
      // Check dynamic bobotKlasifikasi first by category type
      const catTypeKey = matchedCat?.tipe;
      if (catTypeKey && bobotKlasifikasi[catTypeKey] !== undefined && Number(bobotKlasifikasi[catTypeKey]) > 0) {
        baseDeduction = Number(bobotKlasifikasi[catTypeKey]);
      } else if (rawTipe && bobotKlasifikasi[rawTipe] !== undefined && Number(bobotKlasifikasi[rawTipe]) > 0) {
        baseDeduction = Number(bobotKlasifikasi[rawTipe]);
      } else {
        baseDeduction = isJaliy ? bobotLahnJaliy : bobotLahnKhafiy;
      }
    }

    // Effective deduction based on formula
    let effectiveItemDeduction = baseDeduction;
    if (rumusPenilaian === 'proporsional_baris') {
      // Poin pengurangan per kesalahan = (Standar Baris * Bobot Lahn) / Baris Efektif
      const rawCalc = (stdLines * baseDeduction) / clampedLines;
      effectiveItemDeduction = Number(rawCalc.toFixed(2));
    }

    const hasSubcategories = Boolean(
      (matchedCat?.subcategories && matchedCat.subcategories.length > 0) ||
      isMakhrajOrHijaiyahCategory(catId) ||
      isMakhrajOrHijaiyahCategory(matchedCat?.nama)
    );

    let isDuplicate = false;
    let trackingKey = `${canonKey || 'lainnya'}:::_general`;
    let resolvedSubcategory = comment.subcategory;

    if (isOnce) {
      const resolution = resolveSubcategoryTrackingKey({
        canonKey,
        categoryName: matchedCat?.nama || catId,
        subcategory: comment.subcategory,
        comment: comment.comment,
        target: comment.target,
        targetKey: comment.targetKey,
        commentId: comment.id,
        hasSubcategories
      });

      trackingKey = resolution.trackingKey;
      if (resolution.resolvedSubcategoryName) {
        resolvedSubcategory = resolution.resolvedSubcategoryName;
      }

      if (chargedOnceCategories.has(trackingKey)) {
        isDuplicate = true;
      } else {
        chargedOnceCategories.add(trackingKey);
      }
    }

    if (!isDuplicate) {
      totalRawDeductions += effectiveItemDeduction;
      if (isJaliy) {
        jaliyCount++;
        jaliyDeductionTotal += effectiveItemDeduction;
      } else {
        khafiyCount++;
        khafiyDeductionTotal += effectiveItemDeduction;
      }
    }

    details.push({
      commentId: comment.id,
      category: catId,
      resolvedSubcategory,
      categoryType,
      baseDeduction,
      deduction: isDuplicate ? 0 : effectiveItemDeduction,
      isOnce,
      isDuplicate,
      trackingKey,
      isSubcategorySpecific: hasSubcategories
    });
  });

  const roundedTotalDeductions = Math.round(totalRawDeductions);

  return {
    totalDeductions: Number(totalRawDeductions.toFixed(2)),
    roundedTotalDeductions,
    effectiveLines: clampedLines,
    standardLines: stdLines,
    actualLines: parsedActualLines,
    multiplier: Number(multiplier.toFixed(2)),
    isClampedMin,
    isClampedMax,
    jaliyCount,
    khafiyCount,
    jaliyDeductionTotal: Number(jaliyDeductionTotal.toFixed(2)),
    khafiyDeductionTotal: Number(khafiyDeductionTotal.toFixed(2)),
    details,
    chargedKeys: Array.from(chargedOnceCategories)
  };
}
