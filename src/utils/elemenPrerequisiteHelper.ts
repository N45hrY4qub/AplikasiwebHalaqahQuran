/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Siswa, ElemenSetting, Setoran, Halaqah, Modul, TipeModul } from '../types';
import { isMatchingStudent, isSetoranLulus, calculateStudentProgress, getSurahNumber } from './targetProgressHelper';

export interface ElemenAccessStatus {
  elemenId: string;
  elemenNama: string;
  tipeModul: TipeModul;
  isBerjenjang: boolean;
  jenjangLevel: number;
  isUnlocked: boolean;
  isAccessible: boolean; // Alias for isUnlocked
  status: 'unlocked_free' | 'unlocked_initial' | 'unlocked_prerequisite_met' | 'unlocked_teacher_override' | 'locked_prerequisite_missing';
  badgeLabel: string;
  badgeClass: string;
  reason: string;
  isOverridden: boolean;
  hasTeacherOverride: boolean; // Alias for isOverridden
  overrideNote?: { tanggal: string; guruNama?: string; catatan?: string };
  missingPrerequisites: Array<{ id: string; nama: string; reason: string }>;
  completedPrerequisites: Array<{ id: string; nama: string }>;
}

export interface StudentLearningStage {
  currentStageName: string;
  currentStageLevel: number;
  currentLevel: number; // Alias for currentStageLevel
  currentStageElemen?: ElemenSetting;
  allBerjenjang: ElemenSetting[];
  hasOverrides: boolean;
  hasAkselerasi: boolean; // Alias for hasOverrides
  stages: ElemenAccessStatus[];
  unlockedCount: number;
  totalBerjenjangCount: number;
  passedElemIds?: string[];
}

/**
 * Checks if a specific prerequisite element has been completed by the student
 */
export const isPrerequisiteElemenCompleted = (
  preElem: ElemenSetting,
  student: Siswa,
  setorans: Setoran[],
  studentTargets?: Record<string, any>,
  halaqahs?: Halaqah[],
  moduls?: Modul[],
  allElemenSettings?: ElemenSetting[]
): { isCompleted: boolean; reason: string; passedCount: number } => {
  if (!student) {
    return { isCompleted: false, reason: 'Data santri belum dipilih', passedCount: 0 };
  }

  const studentSetorans = (setorans || []).filter(s => isMatchingStudent(s, student));
  
  // Filter passed submissions matching preElem
  const passedSetoransForElem = studentSetorans.filter(s => {
    if (!isSetoranLulus(s)) return false;
    const sElemId = (s as any).elemenId;
    const sElemName = (s.jenisSetoran || '').toLowerCase().trim();
    const targetElemName = preElem.nama.toLowerCase().trim();
    const targetElemId = preElem.id.toLowerCase().trim();
    if (sElemId && (sElemId === preElem.id || sElemId === preElem.nama)) return true;
    return sElemName === targetElemName || sElemName === targetElemId;
  });

  const passedCount = passedSetoransForElem.length;

  // 1. If prerequisite element has specific target surah list (e.g. 8 Surah Pilihan: Al-Fatihah, An-Nas s/d Al-Kautsar)
  if (preElem.targetCakupanMateri === 'surah_pilihan' && Array.isArray(preElem.targetSurahList) && preElem.targetSurahList.length > 0) {
    const completedSurahNos = new Set<number>();
    passedSetoransForElem.forEach(s => {
      const anyS = s as any;
      const sNo = anyS.surat || anyS.suratAwal || getSurahNumber(anyS.namaSurat || anyS.suratNama || '');
      if (sNo && preElem.targetSurahList!.includes(sNo)) {
        completedSurahNos.add(sNo);
      }
      if (anyS.suratAkhir && preElem.targetSurahList!.includes(anyS.suratAkhir)) {
        completedSurahNos.add(anyS.suratAkhir);
      }
      if (Array.isArray(s.daftarSuratSetoran)) {
        s.daftarSuratSetoran.forEach(sub => {
          const subNo = getSurahNumber(sub.suratNama || '');
          if (subNo && preElem.targetSurahList!.includes(subNo)) {
            completedSurahNos.add(subNo);
          }
        });
      }
    });

    const totalRequired = preElem.targetSurahList.length;
    const completedCount = completedSurahNos.size;
    if (completedCount >= totalRequired) {
      return { isCompleted: true, reason: `Tuntas seluruh ${totalRequired} surah wajib`, passedCount };
    }
    return { isCompleted: false, reason: `Baru ${completedCount}/${totalRequired} surah wajib tuntas`, passedCount };
  }

  // 2. If prerequisite check mode is minimal_setoran or ada_setoran
  if (preElem.syaratBuka === 'minimal_setoran' || preElem.syaratBuka === 'ada_setoran') {
    const required = preElem.minimalSetoranLulus || 1;
    if (passedCount >= required) {
      return { isCompleted: true, reason: `Menyelesaikan ${passedCount}/${required} setoran lulus`, passedCount };
    }
    return { isCompleted: false, reason: `Baru ${passedCount}/${required} setoran lulus`, passedCount };
  }

  // 2. Check if student target for this prerequisite element is 100% completed
  if (studentTargets && halaqahs) {
    const sHalaqah = halaqahs.find(h => h.id === student.halaqahId);
    const progress = calculateStudentProgress(
      student,
      sHalaqah,
      studentTargets,
      null,
      setorans,
      moduls || [],
      allElemenSettings || [preElem]
    );

    // If progress is 100% or completed
    if (progress.isCompleted || progress.percent >= 100) {
      return { isCompleted: true, reason: `Target tuntas (${progress.percent}%)`, passedCount };
    }
  }

  // 3. Default fallback: at least 1 passed submission on this element
  if (passedCount > 0) {
    return { isCompleted: true, reason: `Telah lulus setoran (${passedCount}x)`, passedCount };
  }

  return { isCompleted: false, reason: 'Belum ada setoran lulus pada elemen ini', passedCount: 0 };
};

/**
 * Flexible evaluator for whether an element is unlocked for a given student.
 * Supports both signatures:
 *   (student, elemen, allElemenSettings, setorans, ...)
 *   (elemen, student, setorans, allElemenSettings, ...)
 */
export const checkStudentElemenAccess = (
  arg1: any,
  arg2: any,
  arg3?: any,
  arg4?: any,
  studentTargets?: Record<string, any>,
  halaqahs?: Halaqah[],
  moduls?: Modul[]
): ElemenAccessStatus => {
  let student: Siswa | undefined;
  let elemen: ElemenSetting | undefined;
  let allElemenSettings: ElemenSetting[] = [];
  let setorans: Setoran[] = [];

  // Determine which argument is student vs elemen
  if (arg1 && typeof arg1 === 'object' && ('jenisSetoranList' in arg1 || 'tipeModul' in arg1)) {
    // arg1 is ElemenSetting, arg2 is Siswa
    elemen = arg1 as ElemenSetting;
    student = arg2 as Siswa | undefined;
    if (Array.isArray(arg3)) {
      if (arg3.length > 0 && ('tanggalSetoran' in arg3[0] || 'siswaId' in arg3[0])) {
        setorans = arg3;
        allElemenSettings = Array.isArray(arg4) ? arg4 : [];
      } else {
        allElemenSettings = arg3;
        setorans = Array.isArray(arg4) ? arg4 : [];
      }
    }
  } else {
    // arg1 is Siswa, arg2 is ElemenSetting
    student = arg1 as Siswa | undefined;
    elemen = arg2 as ElemenSetting | undefined;
    if (Array.isArray(arg3)) {
      if (arg3.length > 0 && ('tanggalSetoran' in arg3[0] || 'siswaId' in arg3[0])) {
        setorans = arg3;
        allElemenSettings = Array.isArray(arg4) ? arg4 : [];
      } else {
        allElemenSettings = arg3;
        setorans = Array.isArray(arg4) ? arg4 : [];
      }
    }
  }

  if (!elemen) {
    return {
      elemenId: '',
      elemenNama: '',
      tipeModul: TipeModul.AL_QURAN,
      isBerjenjang: false,
      jenjangLevel: 1,
      isUnlocked: true,
      isAccessible: true,
      status: 'unlocked_free',
      badgeLabel: 'Bebas',
      badgeClass: 'bg-slate-100 text-slate-600',
      reason: 'Elemen tidak didefinisikan',
      isOverridden: false,
      hasTeacherOverride: false,
      missingPrerequisites: [],
      completedPrerequisites: []
    };
  }

  const isBerjenjang = !!elemen.isBerjenjang;
  const jenjangLevel = elemen.jenjangLevel || 1;
  const isOverridden = !!(student?.unlockedElemenIds && student.unlockedElemenIds.includes(elemen.id));
  const overrideNote = student?.elemenAkselerasiNotes ? student.elemenAkselerasiNotes[elemen.id] : undefined;

  // 1. Non-berjenjang elements are completely open and parallel
  if (!isBerjenjang) {
    return {
      elemenId: elemen.id,
      elemenNama: elemen.nama,
      tipeModul: elemen.tipeModul,
      isBerjenjang: false,
      jenjangLevel,
      isUnlocked: true,
      isAccessible: true,
      status: 'unlocked_free',
      badgeLabel: 'Bebas / Paralel',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      reason: 'Dapat dipelajari bebas bersamaan dengan elemen lainnya',
      isOverridden: false,
      hasTeacherOverride: false,
      missingPrerequisites: [],
      completedPrerequisites: []
    };
  }

  // 2. Teacher override / Akselerasi Mandiri
  if (isOverridden) {
    return {
      elemenId: elemen.id,
      elemenNama: elemen.nama,
      tipeModul: elemen.tipeModul,
      isBerjenjang: true,
      jenjangLevel,
      isUnlocked: true,
      isAccessible: true,
      status: 'unlocked_teacher_override',
      badgeLabel: 'Akselerasi Guru',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
      reason: overrideNote?.catatan 
        ? `Dispensasi Guru: "${overrideNote.catatan}" (${overrideNote.guruNama || 'Ustadz'})`
        : 'Diizinkan langsung oleh Guru Pembimbing (Akselerasi)',
      isOverridden: true,
      hasTeacherOverride: true,
      overrideNote,
      missingPrerequisites: [],
      completedPrerequisites: []
    };
  }

  // 3. Level 1 or elements with no prerequisites
  const prereqIds = elemen.prerequisiteElemenIds || [];
  if (prereqIds.length === 0 || jenjangLevel <= 1) {
    return {
      elemenId: elemen.id,
      elemenNama: elemen.nama,
      tipeModul: elemen.tipeModul,
      isBerjenjang: true,
      jenjangLevel,
      isUnlocked: true,
      isAccessible: true,
      status: 'unlocked_initial',
      badgeLabel: `Level ${jenjangLevel} (Awal)`,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700',
      reason: 'Tahap awal perjenjangan terbuka',
      isOverridden: false,
      hasTeacherOverride: false,
      missingPrerequisites: [],
      completedPrerequisites: []
    };
  }

  // 4. If student is not selected yet, treat as unlocked preview
  if (!student) {
    return {
      elemenId: elemen.id,
      elemenNama: elemen.nama,
      tipeModul: elemen.tipeModul,
      isBerjenjang: true,
      jenjangLevel,
      isUnlocked: true,
      isAccessible: true,
      status: 'unlocked_free',
      badgeLabel: `Level ${jenjangLevel}`,
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      reason: 'Pilih santri untuk memeriksa prasyarat',
      isOverridden: false,
      hasTeacherOverride: false,
      missingPrerequisites: [],
      completedPrerequisites: []
    };
  }

  // 5. Evaluate all prerequisites
  const missingPrerequisites: Array<{ id: string; nama: string; reason: string }> = [];
  const completedPrerequisites: Array<{ id: string; nama: string }> = [];

  prereqIds.forEach(pId => {
    const pElem = allElemenSettings.find(e => e.id === pId);
    if (!pElem) return;

    const result = isPrerequisiteElemenCompleted(
      pElem,
      student!,
      setorans,
      studentTargets,
      halaqahs,
      moduls,
      allElemenSettings
    );

    if (result.isCompleted) {
      completedPrerequisites.push({ id: pElem.id, nama: pElem.nama });
    } else {
      missingPrerequisites.push({ id: pElem.id, nama: pElem.nama, reason: result.reason });
    }
  });

  const allMet = missingPrerequisites.length === 0;

  if (allMet) {
    return {
      elemenId: elemen.id,
      elemenNama: elemen.nama,
      tipeModul: elemen.tipeModul,
      isBerjenjang: true,
      jenjangLevel,
      isUnlocked: true,
      isAccessible: true,
      status: 'unlocked_prerequisite_met',
      badgeLabel: `Level ${jenjangLevel} (Terbuka)`,
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-700',
      reason: `Prasyarat ${completedPrerequisites.map(p => p.nama).join(', ')} telah terpenuhi`,
      isOverridden: false,
      hasTeacherOverride: false,
      missingPrerequisites: [],
      completedPrerequisites
    };
  }

  return {
    elemenId: elemen.id,
    elemenNama: elemen.nama,
    tipeModul: elemen.tipeModul,
    isBerjenjang: true,
    jenjangLevel,
    isUnlocked: false,
    isAccessible: false,
    status: 'locked_prerequisite_missing',
    badgeLabel: `Level ${jenjangLevel} (Terkunci)`,
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    reason: `Terkunci: Wajib menyelesaikan ${missingPrerequisites.map(m => m.nama).join(', ')} terlebih dahulu`,
    isOverridden: false,
    hasTeacherOverride: false,
    missingPrerequisites,
    completedPrerequisites
  };
};

/**
 * Helper to match a setoran to an element in elemList
 */
export const matchSetoranToElemen = (s: Setoran, elemList: ElemenSetting[]): ElemenSetting | undefined => {
  if (!s || !elemList || elemList.length === 0) return undefined;

  const sElemId = (s as any).elemenId?.trim().toLowerCase();
  const sElemNama = (s as any).elemenNama?.trim().toLowerCase();
  const sJenis = (s.jenisSetoran || '').trim().toLowerCase();
  const sTipeTahfidz = ((s as any).tipeTahfidz || '').trim().toLowerCase();
  const sModulNama = (s.modulNama || '').trim().toLowerCase();
  const sCatatan = `${(s as any).catatan || ''} ${(s as any).keterangan || ''}`.trim().toLowerCase();

  // 1. Direct ID match
  if (sElemId) {
    const match = elemList.find(e => e.id.toLowerCase() === sElemId);
    if (match) return match;
  }

  // 2. Direct nama match
  if (sElemNama) {
    const match = elemList.find(e => e.nama.toLowerCase() === sElemNama || e.id.toLowerCase() === sElemNama);
    if (match) return match;
  }

  // 3. Match by jenisSetoran or tipeTahfidz exactly equal to element nama
  if (sJenis) {
    const match = elemList.find(e => e.nama.toLowerCase() === sJenis || e.id.toLowerCase() === sJenis);
    if (match) return match;
  }
  if (sTipeTahfidz) {
    const match = elemList.find(e => e.nama.toLowerCase() === sTipeTahfidz || e.id.toLowerCase() === sTipeTahfidz);
    if (match) return match;
  }

  // 4. Element whose jenisSetoranList contains sJenis or sTipeTahfidz
  const byList = elemList.filter(e => {
    const list = (e.jenisSetoranList || []).map(j => j.toLowerCase().trim());
    return (sJenis && list.includes(sJenis)) || (sTipeTahfidz && list.includes(sTipeTahfidz));
  });
  if (byList.length > 0) {
    const exact = byList.find(e => 
      (sJenis && e.nama.toLowerCase() === sJenis) || (sTipeTahfidz && e.nama.toLowerCase() === sTipeTahfidz)
    );
    if (exact) return exact;
    return byList[0];
  }

  // 5. Keyword search in setoran fields (e.g. 'Tasmi'', 'Wajib', etc.)
  const fullText = `${sJenis} ${sTipeTahfidz} ${sElemNama || ''} ${sModulNama} ${sCatatan}`;
  for (const elem of elemList) {
    const elemLower = elem.nama.toLowerCase().trim();
    if (elemLower.length >= 3 && fullText.includes(elemLower)) {
      return elem;
    }
  }

  return undefined;
};

/**
 * Returns the full progression roadmap for a student across all elements.
 * Flexible signature supports:
 *   (student, allElemenSettings, setorans, ...)
 *   (student, setorans, allElemenSettings, ...)
 */
export const getStudentLearningStage = (
  student: Siswa,
  arg2: any,
  arg3: any,
  studentTargets?: Record<string, any>,
  halaqahs?: Halaqah[],
  moduls?: Modul[]
): StudentLearningStage => {
  let allElemenSettings: ElemenSetting[] = [];
  let setorans: Setoran[] = [];

  if (Array.isArray(arg2)) {
    if (arg2.length > 0 && ('tanggalSetoran' in arg2[0] || 'siswaId' in arg2[0])) {
      setorans = arg2 as Setoran[];
      allElemenSettings = Array.isArray(arg3) ? (arg3 as ElemenSetting[]) : [];
    } else {
      allElemenSettings = arg2 as ElemenSetting[];
      setorans = Array.isArray(arg3) ? (arg3 as Setoran[]) : [];
    }
  }

  // Filter berjenjang elements
  const allBerjenjang = [...allElemenSettings]
    .filter(e => e.isBerjenjang)
    .sort((a, b) => (a.jenjangLevel || 1) - (b.jenjangLevel || 1));

  // Sort all elements: berjenjang first by level ascending, then non-berjenjang
  const sortedElemen = [...allElemenSettings].sort((a, b) => {
    if (a.isBerjenjang && !b.isBerjenjang) return -1;
    if (!a.isBerjenjang && b.isBerjenjang) return 1;
    if (a.isBerjenjang && b.isBerjenjang) {
      return (a.jenjangLevel || 1) - (b.jenjangLevel || 1);
    }
    return a.nama.localeCompare(b.nama);
  });

  const stages = sortedElemen.map(elem => 
    checkStudentElemenAccess(student, elem, allElemenSettings, setorans, studentTargets, halaqahs, moduls)
  );

  const berjenjangStages = stages.filter(s => s.isBerjenjang);
  const unlockedBerjenjang = berjenjangStages.filter(s => s.isUnlocked);

  const studentSetorans = (setorans || [])
    .filter(s => isMatchingStudent(s, student))
    .sort((a, b) => (b.tanggalSetoran || '').localeCompare(a.tanggalSetoran || ''));

  // Identify student's active element from setoran history
  let activeElemFromSetoran: ElemenSetting | undefined = undefined;
  let highestLevelElemFromSetoran: ElemenSetting | undefined = undefined;

  for (const s of studentSetorans) {
    const matchedBerjenjang = matchSetoranToElemen(s, allBerjenjang);
    if (matchedBerjenjang) {
      if (!activeElemFromSetoran) {
        activeElemFromSetoran = matchedBerjenjang;
      }
      if (!highestLevelElemFromSetoran || (matchedBerjenjang.jenjangLevel || 1) > (highestLevelElemFromSetoran.jenjangLevel || 1)) {
        highestLevelElemFromSetoran = matchedBerjenjang;
      }
    }
  }

  // Determine current active reached element (prioritize highest reached stage)
  const currentReachedElem = highestLevelElemFromSetoran || activeElemFromSetoran;

  let currentStageName = 'Tahap Awal';
  let currentStageLevel = 1;
  let currentStageElemen: ElemenSetting | undefined = allBerjenjang.length > 0 ? allBerjenjang[0] : undefined;

  if (currentReachedElem) {
    currentStageElemen = currentReachedElem;
    currentStageLevel = currentReachedElem.jenjangLevel || 1;
    currentStageName = currentReachedElem.nama;
  } else if (unlockedBerjenjang.length > 0) {
    const highest = unlockedBerjenjang[unlockedBerjenjang.length - 1];
    currentStageName = highest.elemenNama;
    currentStageLevel = highest.jenjangLevel;
    currentStageElemen = allElemenSettings.find(e => e.id === highest.elemenId);
  } else if (allBerjenjang.length > 0) {
    currentStageName = allBerjenjang[0].nama;
    currentStageLevel = allBerjenjang[0].jenjangLevel || 1;
    currentStageElemen = allBerjenjang[0];
  }

  // Update stages list so that reached levels are unlocked
  const resolvedStages = stages.map(st => {
    if (st.isBerjenjang && st.jenjangLevel <= currentStageLevel) {
      return {
        ...st,
        isUnlocked: true,
        isAccessible: true,
        status: st.jenjangLevel < currentStageLevel ? ('unlocked_prerequisite_met' as const) : st.status
      };
    }
    return st;
  });

  const passedElemIds = allBerjenjang
    .filter(e => {
      if (currentStageElemen && e.id === currentStageElemen.id) return false;
      const isLowerLevel = (e.jenjangLevel || 1) < currentStageLevel;
      const hasPassedSetoran = studentSetorans.some(s => isSetoranLulus(s) && matchSetoranToElemen(s, [e])?.id === e.id);
      return isLowerLevel || hasPassedSetoran;
    })
    .map(e => e.id);

  const hasOverrides = resolvedStages.some(s => s.isOverridden);

  return {
    currentStageName,
    currentStageLevel,
    currentLevel: currentStageLevel,
    currentStageElemen,
    allBerjenjang,
    hasOverrides,
    hasAkselerasi: hasOverrides,
    stages: resolvedStages,
    unlockedCount: resolvedStages.filter(s => s.isUnlocked).length,
    totalBerjenjangCount: berjenjangStages.length,
    passedElemIds
  };
};
