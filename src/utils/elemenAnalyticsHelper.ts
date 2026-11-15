/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ElemenSetting, Setoran, Siswa, TipeModul } from '../types';
import { matchSetoranToElemen, getStudentLearningStage } from './elemenPrerequisiteHelper';
import {
  SURAH_LIST,
  getSurahNumber,
  getJuzStartInfo,
  getJuzEndInfo,
  isMatchingStudent,
  isSetoranLulus
} from './targetProgressHelper';

export interface MaterialAttemptDetail {
  tanggal: string;
  isLulus: boolean;
  nilai?: string;
}

export interface MaterialCompletionItem {
  key: string;
  namaMateri: string;
  surahNo?: number;
  status: 'tuntas' | 'belum_tuntas' | 'belum_disetor';
  totalAttempts: number;
  attemptsToComplete: number; // Setoran ke-berapa siswa pertama kali lulus (0 jika belum tuntas)
  mengulangBeforePass: number;
  mengulangCount: number;
  extraSessionsAfterPass: number;
  firstDateRaw?: string;
  firstDateFormatted?: string;
  completedDateRaw?: string;
  completedDateFormatted?: string;
  lastDateRaw?: string;
  lastDateFormatted?: string;
}

export interface ElemenLearningSummary {
  elemenId: string;
  elemenNama: string;
  elemenSetting?: ElemenSetting;
  isBerjenjang: boolean;
  jenjangLevel?: number;
  isTuntas: boolean;
  statusLabel: 'Tuntas' | 'Sedang Berjalan';
  masaBelajarHari: number;
  startDateRaw: string;
  startDateFormatted: string;
  endDateRaw: string;
  endDateFormatted: string;
  lastSetoranDateRaw: string;
  lastSetoranDateFormatted: string;
  totalSesi: number;
  totalLulus: number;
  tuntasMateriCount: number;
  belumTuntasMateriCount: number;
  belumDisetorMateriCount: number;
  totalMateriCount: number;
  hasFixedTargetScope: boolean;
  materials: MaterialCompletionItem[];
}

const parseYMD = (str?: string): Date | null => {
  if (!str) return null;
  const clean = str.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const formatDateShort = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const d = parseYMD(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatYMD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSurahDisplayName = (surahNo: number, fallbackName?: string): string => {
  const found = SURAH_LIST.find(s => s.no === surahNo);
  if (found) return `Surah ${found.nama}`;
  if (fallbackName) {
    return fallbackName.toLowerCase().startsWith('surah') || fallbackName.toLowerCase().startsWith('surat')
      ? fallbackName
      : `Surah ${fallbackName}`;
  }
  return `Surah #${surahNo}`;
};

interface ExtractedMaterial {
  key: string;
  namaMateri: string;
  surahNo?: number;
}

const extractMaterialsFromSetoran = (s: Setoran, elem?: ElemenSetting): ExtractedMaterial[] => {
  const isQuran =
    elem?.tipeModul === TipeModul.AL_QURAN ||
    s.tipeModul === TipeModul.AL_QURAN ||
    (s.tipeModul as string) === 'Al-Quran' ||
    Boolean(s.suratNama) ||
    Boolean(s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0);

  if (isQuran) {
    const items: ExtractedMaterial[] = [];
    const seenKeys = new Set<string>();

    const pushSurah = (rawName?: string, rawNo?: number) => {
      const cleanedName = (rawName || '').trim();
      const sNo = rawNo && rawNo > 0 ? rawNo : getSurahNumber(cleanedName);
      if (sNo > 0) {
        const key = `surah-${sNo}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          items.push({
            key,
            namaMateri: getSurahDisplayName(sNo, cleanedName),
            surahNo: sNo
          });
        }
      } else if (cleanedName) {
        const key = `surah-name-${cleanedName.toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          items.push({
            key,
            namaMateri: getSurahDisplayName(0, cleanedName)
          });
        }
      }
    };

    if (Array.isArray(s.daftarSuratSetoran) && s.daftarSuratSetoran.length > 0) {
      s.daftarSuratSetoran.forEach(sub => pushSurah(sub.suratNama));
    }
    if (s.suratNama) {
      pushSurah(s.suratNama, (s as any).surat || (s as any).suratAwal);
    } else if ((s as any).namaSurat) {
      pushSurah((s as any).namaSurat, (s as any).surat);
    } else if (s.surahMulai || s.surahSelesai) {
      const startNo = getSurahNumber(s.surahMulai || '');
      const endNo = getSurahNumber(s.surahSelesai || '');
      if (startNo > 0 && endNo > 0) {
        const minS = Math.min(startNo, endNo);
        const maxS = Math.max(startNo, endNo);
        for (let n = minS; n <= maxS; n++) {
          pushSurah(undefined, n);
        }
      } else {
        if (s.surahMulai) pushSurah(s.surahMulai);
        if (s.surahSelesai) pushSurah(s.surahSelesai);
      }
    }

    if (items.length === 0) {
      const fallback = s.modulNama || elem?.nama || 'Materi Al-Qur\'an';
      items.push({
        key: `misc-${fallback.toLowerCase()}`,
        namaMateri: fallback
      });
    }

    return items;
  }

  // Non Al-Qur'an (Iqro / Kitab / Modul Buku)
  const modulBase = (s.modulNama || elem?.nama || 'Materi').trim();
  const jilidVal = s.nonQuranJilid ?? s.jilid ?? s.jilidNonQuran;
  const jilidStr = jilidVal !== undefined && jilidVal !== '' ? ` Jilid ${jilidVal}` : '';
  const pageStart = s.nonQuranPageAwal ?? s.halaman ?? s.halamanNonQuran;
  const pageEnd = s.nonQuranPageAkhir;

  if (pageStart !== undefined && pageStart !== null && Number(pageStart) > 0) {
    const startNum = Number(pageStart);
    const endNum = pageEnd !== undefined && pageEnd !== null && Number(pageEnd) >= startNum ? Number(pageEnd) : startNum;
    if (endNum - startNum > 0 && endNum - startNum <= 25) {
      const items: ExtractedMaterial[] = [];
      for (let p = startNum; p <= endNum; p++) {
        items.push({
          key: `nonquran-${modulBase.toLowerCase()}-${jilidVal ?? '0'}-hal-${p}`,
          namaMateri: `${modulBase}${jilidStr} · Hal. ${p}`
        });
      }
      return items;
    }
    const pageLabel = endNum > startNum ? `${startNum}–${endNum}` : `${startNum}`;
    return [
      {
        key: `nonquran-${modulBase.toLowerCase()}-${jilidVal ?? '0'}-hal-${pageLabel}`,
        namaMateri: `${modulBase}${jilidStr} · Hal. ${pageLabel}`
      }
    ];
  }

  if (s.babNonQuran) {
    return [
      {
        key: `nonquran-${modulBase.toLowerCase()}-${jilidVal ?? '0'}-bab-${s.babNonQuran.toLowerCase()}`,
        namaMateri: `${modulBase}${jilidStr} · ${s.babNonQuran}`
      }
    ];
  }

  return [
    {
      key: `nonquran-${modulBase.toLowerCase()}-${jilidVal ?? '0'}`,
      namaMateri: `${modulBase}${jilidStr}`
    }
  ];
};

const getExpectedScopeMaterials = (elem?: ElemenSetting): ExtractedMaterial[] => {
  if (!elem) return [];

  if (
    elem.tipeModul === TipeModul.AL_QURAN &&
    elem.targetCakupanMateri === 'surah_pilihan' &&
    Array.isArray(elem.targetSurahList) &&
    elem.targetSurahList.length > 0
  ) {
    const uniqueOrdered: number[] = [];
    elem.targetSurahList.forEach(rawNo => {
      const n = Number(rawNo);
      if (n > 0 && !uniqueOrdered.includes(n)) {
        uniqueOrdered.push(n);
      }
    });
    return uniqueOrdered.map(sNo => ({
      key: `surah-${sNo}`,
      namaMateri: getSurahDisplayName(sNo),
      surahNo: sNo
    }));
  }

  if (elem.tipeModul === TipeModul.AL_QURAN && elem.targetCakupanMateri === 'juz_range' && elem.targetJuzStart) {
    const rawStart = Number(elem.targetJuzStart) || 30;
    const rawEnd = Number(elem.targetJuzEnd) || rawStart;
    const minJuz = Math.max(1, Math.min(30, Math.min(rawStart, rawEnd)));
    const maxJuz = Math.max(1, Math.min(30, Math.max(rawStart, rawEnd)));
    const startSurah = getJuzStartInfo(minJuz).surah;
    const endSurah = getJuzEndInfo(maxJuz).surah;
    const items: ExtractedMaterial[] = [];
    for (let sNo = startSurah; sNo <= endSurah; sNo++) {
      items.push({
        key: `surah-${sNo}`,
        namaMateri: getSurahDisplayName(sNo),
        surahNo: sNo
      });
    }
    return items;
  }

  if (
    elem.tipeModul === TipeModul.NON_AL_QURAN &&
    elem.targetCakupanMateri === 'halaman_range' &&
    elem.targetHalamanStart &&
    elem.targetHalamanEnd &&
    elem.targetHalamanEnd >= elem.targetHalamanStart &&
    elem.targetHalamanEnd - elem.targetHalamanStart <= 100
  ) {
    const items: ExtractedMaterial[] = [];
    const baseName = elem.nama;
    for (let p = elem.targetHalamanStart; p <= elem.targetHalamanEnd; p++) {
      items.push({
        key: `nonquran-target-hal-${p}`,
        namaMateri: `${baseName} · Hal. ${p}`
      });
    }
    return items;
  }

  return [];
};

export const buildStudentElemenAnalytics = (
  student: Siswa,
  allSetorans: Setoran[],
  elemenSettings: ElemenSetting[],
  today: Date = new Date()
): ElemenLearningSummary[] => {
  const studentSetorans = (allSetorans || [])
    .filter(s => isMatchingStudent(s, student))
    .slice()
    .sort((a, b) => {
      const dateCmp = (a.tanggalSetoran || '').localeCompare(b.tanggalSetoran || '');
      if (dateCmp !== 0) return dateCmp;
      return (a.id || '').localeCompare(b.id || '');
    });

  if (studentSetorans.length === 0) return [];

  const learningStage = getStudentLearningStage(student, studentSetorans, elemenSettings);
  const passedElemIdSet = new Set<string>(learningStage.passedElemIds || []);

  // Bucket setorans per element
  const bucketMap = new Map<
    string,
    {
      elemenId: string;
      elemenNama: string;
      elemenSetting?: ElemenSetting;
      setorans: Setoran[];
    }
  >();

  studentSetorans.forEach(s => {
    const matchedElem = matchSetoranToElemen(s, elemenSettings || []);
    const key = matchedElem
      ? `elem::${matchedElem.id}`
      : `unmatched::${(s.jenisSetoran || s.tipeTahfidz || s.modulNama || 'Umum').trim().toLowerCase()}`;

    if (!bucketMap.has(key)) {
      bucketMap.set(key, {
        elemenId: matchedElem?.id || key,
        elemenNama: matchedElem?.nama || s.jenisSetoran || s.tipeTahfidz || s.modulNama || 'Setoran Umum',
        elemenSetting: matchedElem,
        setorans: []
      });
    }
    bucketMap.get(key)!.setorans.push(s);
  });

  const summaries: ElemenLearningSummary[] = [];

  bucketMap.forEach(bucket => {
    const elem = bucket.elemenSetting;
    const elemSetorans = bucket.setorans;
    const totalSesi = elemSetorans.length;
    const totalLulus = elemSetorans.filter(isSetoranLulus).length;

    // Group chronological attempts by material key
    const materialAttemptsMap = new Map<
      string,
      {
        meta: ExtractedMaterial;
        attempts: MaterialAttemptDetail[];
      }
    >();

    elemSetorans.forEach(s => {
      const passed = isSetoranLulus(s);
      const tgl = (s.tanggalSetoran || '').split('T')[0];
      const extracted = extractMaterialsFromSetoran(s, elem);

      extracted.forEach(mat => {
        if (!materialAttemptsMap.has(mat.key)) {
          materialAttemptsMap.set(mat.key, {
            meta: mat,
            attempts: []
          });
        }
        materialAttemptsMap.get(mat.key)!.attempts.push({
          tanggal: tgl,
          isLulus: passed,
          nilai: s.nilai
        });
      });
    });

    const buildMaterialResult = (meta: ExtractedMaterial, attempts: MaterialAttemptDetail[]): MaterialCompletionItem => {
      if (attempts.length === 0) {
        return {
          key: meta.key,
          namaMateri: meta.namaMateri,
          surahNo: meta.surahNo,
          status: 'belum_disetor',
          totalAttempts: 0,
          attemptsToComplete: 0,
          mengulangBeforePass: 0,
          mengulangCount: 0,
          extraSessionsAfterPass: 0
        };
      }

      const firstPassIndex = attempts.findIndex(a => a.isLulus);
      const firstDateRaw = attempts[0]?.tanggal || '';
      const lastDateRaw = attempts[attempts.length - 1]?.tanggal || '';

      if (firstPassIndex !== -1) {
        const attemptsToComplete = firstPassIndex + 1;
        const mengulangBeforePass = attempts.slice(0, firstPassIndex).filter(a => !a.isLulus).length;
        const extraSessionsAfterPass = attempts.length - attemptsToComplete;
        const completedDateRaw = attempts[firstPassIndex]?.tanggal || lastDateRaw;

        return {
          key: meta.key,
          namaMateri: meta.namaMateri,
          surahNo: meta.surahNo,
          status: 'tuntas',
          totalAttempts: attempts.length,
          attemptsToComplete,
          mengulangBeforePass,
          mengulangCount: attempts.filter(a => !a.isLulus).length,
          extraSessionsAfterPass,
          firstDateRaw,
          firstDateFormatted: formatDateShort(firstDateRaw),
          completedDateRaw,
          completedDateFormatted: formatDateShort(completedDateRaw),
          lastDateRaw,
          lastDateFormatted: formatDateShort(lastDateRaw)
        };
      }

      return {
        key: meta.key,
        namaMateri: meta.namaMateri,
        surahNo: meta.surahNo,
        status: 'belum_tuntas',
        totalAttempts: attempts.length,
        attemptsToComplete: 0,
        mengulangBeforePass: attempts.length,
        mengulangCount: attempts.length,
        extraSessionsAfterPass: 0,
        firstDateRaw,
        firstDateFormatted: formatDateShort(firstDateRaw),
        lastDateRaw,
        lastDateFormatted: formatDateShort(lastDateRaw)
      };
    };

    const expectedMaterials = getExpectedScopeMaterials(elem);
    const hasFixedTargetScope = expectedMaterials.length > 0;
    const materials: MaterialCompletionItem[] = [];
    const includedKeys = new Set<string>();

    if (hasFixedTargetScope) {
      // First include all expected target materials in configured order (including "Belum Disetor")
      expectedMaterials.forEach(expMat => {
        // Handle non-Quran halaman matching fallback by page number
        let entry = materialAttemptsMap.get(expMat.key);
        if (!entry && elem?.tipeModul === TipeModul.NON_AL_QURAN && expMat.key.startsWith('nonquran-target-hal-')) {
          const targetPageSuffix = expMat.key.replace('nonquran-target-hal-', '');
          for (const [mKey, mVal] of materialAttemptsMap.entries()) {
            if (mKey.endsWith(`-hal-${targetPageSuffix}`)) {
              entry = mVal;
              includedKeys.add(mKey);
              break;
            }
          }
        }
        includedKeys.add(expMat.key);
        materials.push(buildMaterialResult(entry ? entry.meta : expMat, entry ? entry.attempts : []));
      });

      // Then append any extra submitted materials outside the configured list so no history is lost
      materialAttemptsMap.forEach((mVal, mKey) => {
        if (!includedKeys.has(mKey)) {
          materials.push(buildMaterialResult(mVal.meta, mVal.attempts));
        }
      });
    } else {
      materialAttemptsMap.forEach(mVal => {
        materials.push(buildMaterialResult(mVal.meta, mVal.attempts));
      });
    }

    const tuntasMateriCount = materials.filter(m => m.status === 'tuntas').length;
    const belumTuntasMateriCount = materials.filter(m => m.status === 'belum_tuntas').length;
    const belumDisetorMateriCount = materials.filter(m => m.status === 'belum_disetor').length;

    // Determine whether this element is Tuntas
    let isTuntas = false;
    let completionDateRaw = '';

    if (hasFixedTargetScope) {
      const targetKeys = new Set(expectedMaterials.map(m => m.key));
      const targetResults = materials.filter(m => targetKeys.has(m.key) || m.status !== 'belum_disetor');
      const requiredResults = materials.filter((_, idx) => idx < expectedMaterials.length);
      isTuntas = requiredResults.length > 0 && requiredResults.every(r => r.status === 'tuntas');
      if (isTuntas) {
        completionDateRaw = requiredResults.reduce((latest, r) => {
          const d = r.completedDateRaw || '';
          return !latest || (d && d > latest) ? d : latest;
        }, '');
      } else if (targetResults.length === 0) {
        isTuntas = false;
      }
    } else if (elem && (elem.syaratBuka === 'minimal_setoran' || elem.syaratBuka === 'ada_setoran')) {
      const req = elem.minimalSetoranLulus || 1;
      const passedList = elemSetorans.filter(isSetoranLulus);
      isTuntas = passedList.length >= req;
      if (isTuntas && passedList[req - 1]?.tanggalSetoran) {
        completionDateRaw = (passedList[req - 1].tanggalSetoran || '').split('T')[0];
      }
    } else if (elem && passedElemIdSet.has(elem.id)) {
      isTuntas = true;
      const passedList = elemSetorans.filter(isSetoranLulus);
      completionDateRaw = (passedList[passedList.length - 1]?.tanggalSetoran || elemSetorans[elemSetorans.length - 1]?.tanggalSetoran || '').split('T')[0];
    }

    const startDateRaw = (elemSetorans.find(s => s.tanggalSetoran)?.tanggalSetoran || '').split('T')[0];
    const lastSetoranDateRaw = (elemSetorans[elemSetorans.length - 1]?.tanggalSetoran || startDateRaw).split('T')[0];
    const todayRaw = formatYMD(today);

    const endDateRaw = isTuntas
      ? (completionDateRaw || lastSetoranDateRaw)
      : (lastSetoranDateRaw > todayRaw ? lastSetoranDateRaw : todayRaw);

    const startParsed = parseYMD(startDateRaw);
    const endParsed = parseYMD(endDateRaw);
    let diffDays = 0;
    if (startParsed && endParsed) {
      diffDays = Math.max(0, Math.round((endParsed.getTime() - startParsed.getTime()) / (1000 * 60 * 60 * 24)));
    }
    const masaBelajarHari = startParsed ? Math.max(1, diffDays) : 1;

    summaries.push({
      elemenId: bucket.elemenId,
      elemenNama: bucket.elemenNama,
      elemenSetting: elem,
      isBerjenjang: Boolean(elem?.isBerjenjang),
      jenjangLevel: elem?.jenjangLevel,
      isTuntas,
      statusLabel: isTuntas ? 'Tuntas' : 'Sedang Berjalan',
      masaBelajarHari,
      startDateRaw,
      startDateFormatted: formatDateShort(startDateRaw),
      endDateRaw,
      endDateFormatted: formatDateShort(endDateRaw),
      lastSetoranDateRaw,
      lastSetoranDateFormatted: formatDateShort(lastSetoranDateRaw),
      totalSesi,
      totalLulus,
      tuntasMateriCount,
      belumTuntasMateriCount,
      belumDisetorMateriCount,
      totalMateriCount: materials.length,
      hasFixedTargetScope,
      materials
    });
  });

  // Sort: Berjenjang by jenjangLevel ascending first, then non-berjenjang by earliest startDate
  return summaries.sort((a, b) => {
    if (a.isBerjenjang && !b.isBerjenjang) return -1;
    if (!a.isBerjenjang && b.isBerjenjang) return 1;
    if (a.isBerjenjang && b.isBerjenjang) {
      const lvlDiff = (a.jenjangLevel || 1) - (b.jenjangLevel || 1);
      if (lvlDiff !== 0) return lvlDiff;
    }
    return (a.startDateRaw || '').localeCompare(b.startDateRaw || '');
  });
};
