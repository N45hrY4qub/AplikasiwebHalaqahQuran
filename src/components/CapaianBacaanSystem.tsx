import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  UserCheck, 
  Info, 
  ChevronRight,
  ChevronLeft, 
  Calendar,
  Layers,
  Tag,
  Check,
  X,
  Shield,
  HelpCircle,
  Cloud,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  ListOrdered,
  ArrowRight,
  CheckCircle,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  CapaianBacaanAyatConfig, 
  CapaianBacaanTargetItem, 
  CapaianBacaanSesiPertemuan,
  UserRole,
  isAdminUtama,
  TipeModul,
  ElemenSetting,
  StatusAktif,
  Setoran
} from '../types';
import { renderArabicEnhancedText } from '../lib/arabicHelper';
import { DAFTAR_114_SURAT, DEFAULT_PRESET_CAPAIAN_BACAAN, SuratMeta } from '../data/capaianBacaanPresets';
import { getTeacherHalaqahs } from '../utils/studentAttendanceHelper';

const formatArabicFontClean = (text: string): string => {
  if (!text) return '';
  // Menjaga tanda waqaf (صلى, قلى, ج, لا, مـ, ۛ dll.), harakat, dan sukun tetap utuh sesuai mushaf Al-Quran
  return text.replace(/[\s\r\n\u200B\u200C\u200D\u200E\u200F]+$/, '').trim();
};

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

export interface CapaianBacaanSystemProps {
  initialHalaqahId?: string;
  initialSiswaId?: string;
  onSiswaChange?: (siswaId: string) => void;
}

export function CapaianBacaanSystem({ 
  initialHalaqahId,
  initialSiswaId,
  onSiswaChange
}: CapaianBacaanSystemProps = {}) {
  const {
    currentSession,
    siswas = [],
    gurus = [],
    halaqahs = [],
    elemenSettings = [],
    capaianBacaanConfigs = [],
    saveCapaianBacaanConfig,
    deleteCapaianBacaanConfig,
    reorderCapaianBacaanConfigs,
    capaianBacaanSesiList = [],
    saveCapaianBacaanSesi,
    updateCapaianBacaanSesiNama,
    deleteCapaianBacaanSesi,
    capaianBacaanTrialSettings,
    updateCapaianBacaanTrialSettings,
    seedCapaianBacaanPresets,
    syncCapaianBacaanConfigsToFirestore,
    typography,
    moduls = [],
    setorans = [],
    tajwidCategories = [],
    guruSchedules = [],
    selectedGuruHalaqahId,
    setSelectedGuruHalaqahId
  } = useApp();

  const user = currentSession.user;
  const isSuperAdmin = isAdminUtama(user);
  const isAdmin = user?.role === UserRole.ADMIN || isSuperAdmin;
  const isGuru = user?.role === UserRole.GURU;

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);

  const handleManualCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      const ok = await syncCapaianBacaanConfigsToFirestore();
      if (ok) {
        setCloudSyncSuccess(true);
        setTimeout(() => setCloudSyncSuccess(false), 3000);
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Font Mushaf Al-Quran disinkronkan secara global oleh App.tsx (.font-mushaf)
  // sesuai yang diatur pada Kurikulum & Modul > Modul Pembelajaran > Al-Quran.

  // Helper mencari teks ayat resmi dari Modul Pembelajaran Al-Quran
  const getAyatTextFromModul = (suratNo: number, ayatNo: number): string | null => {
    const quranModul = moduls.find(m => m.tipe === TipeModul.AL_QURAN && Number(m.nomorUrutSurat) === Number(suratNo));
    if (quranModul && quranModul.isiAyat) {
      const match = quranModul.isiAyat.find(a => a.nomorAyat === Number(ayatNo));
      if (match && match.teksArab) return match.teksArab;
    }
    return null;
  };

  // Daftar halaqah yang diampu oleh guru (jika guru) atau semua halaqah lembaga (jika admin)
  const myGuruHalaqahs = useMemo(() => {
    if (isGuru) {
      return getTeacherHalaqahs(halaqahs, user, gurus, guruSchedules);
    }
    return halaqahs;
  }, [isGuru, halaqahs, user, gurus, guruSchedules]);

  // State pemilihan kelompok halaqah
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>(() => {
    if (initialHalaqahId) return initialHalaqahId;
    if (isGuru) {
      if (selectedGuruHalaqahId && myGuruHalaqahs.some(h => h.id === selectedGuruHalaqahId)) {
        return selectedGuruHalaqahId;
      }
      return myGuruHalaqahs[0]?.id || '';
    }
    return 'all';
  });

  // Sinkronisasi otomatis dengan initialHalaqahId atau selectedGuruHalaqahId
  useEffect(() => {
    if (initialHalaqahId) {
      setSelectedHalaqahId(initialHalaqahId);
    } else if (isGuru && selectedGuruHalaqahId && myGuruHalaqahs.some(h => h.id === selectedGuruHalaqahId)) {
      setSelectedHalaqahId(selectedGuruHalaqahId);
    }
  }, [initialHalaqahId, selectedGuruHalaqahId, isGuru, myGuruHalaqahs]);

  const currentHalaqahObj = useMemo(() => {
    const targetId = isGuru
      ? (selectedHalaqahId || selectedGuruHalaqahId || myGuruHalaqahs[0]?.id)
      : selectedHalaqahId;
    return halaqahs.find(h => h.id === targetId);
  }, [isGuru, selectedHalaqahId, selectedGuruHalaqahId, myGuruHalaqahs, halaqahs]);

  // Santri yang relevan sesuai peran user dan halaqah yang dipilih guru
  const availableSiswas = useMemo(() => {
    if (isGuru) {
      const activeHalaqahId = selectedHalaqahId || selectedGuruHalaqahId || myGuruHalaqahs[0]?.id;
      if (!activeHalaqahId) return [];

      const filtered = siswas.filter(s => s.halaqahId === activeHalaqahId);
      const activeOnly = filtered.filter(s => s.status === StatusAktif.AKTIF || !s.status || (s.status as any) === 'aktif');
      const list = activeOnly.length > 0 ? activeOnly : filtered;
      return [...list].sort((a, b) => (a.namaLengkap || '').localeCompare(b.namaLengkap || ''));
    }

    // Jika Admin
    if (selectedHalaqahId && selectedHalaqahId !== 'all') {
      const filtered = siswas.filter(s => s.halaqahId === selectedHalaqahId);
      const activeOnly = filtered.filter(s => s.status === StatusAktif.AKTIF || !s.status || (s.status as any) === 'aktif');
      const list = activeOnly.length > 0 ? activeOnly : filtered;
      return [...list].sort((a, b) => (a.namaLengkap || '').localeCompare(b.namaLengkap || ''));
    }

    const activeOnly = siswas.filter(s => s.status === StatusAktif.AKTIF || !s.status || (s.status as any) === 'aktif');
    const list = activeOnly.length > 0 ? activeOnly : siswas;
    return [...list].sort((a, b) => (a.namaLengkap || '').localeCompare(b.namaLengkap || ''));
  }, [siswas, isGuru, selectedHalaqahId, selectedGuruHalaqahId, myGuruHalaqahs]);

  const normLatin = (s?: string) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Daftar nama dan ID elemen yang diaktifkan oleh admin
  const rawEnabledNames = useMemo(() => {
    const fromProps = capaianBacaanTrialSettings?.enabledElemenNames || [];
    const fromItems = (capaianBacaanTrialSettings?.selectedElemenItems || []).map(i => i.nama);
    return Array.from(new Set([...fromProps, ...fromItems].filter(Boolean))).map(normLatin);
  }, [capaianBacaanTrialSettings?.enabledElemenNames, capaianBacaanTrialSettings?.selectedElemenItems]);

  const rawEnabledIds = useMemo(() => {
    const fromIds = capaianBacaanTrialSettings?.enabledElemenIds || [];
    const fromItems = (capaianBacaanTrialSettings?.selectedElemenItems || []).map(i => i.id);
    return Array.from(new Set([...fromIds, ...fromItems].filter(Boolean)));
  }, [capaianBacaanTrialSettings?.enabledElemenIds, capaianBacaanTrialSettings?.selectedElemenItems]);

  // Objek elemen pembelajaran yang terpilih (mencocokkan baik ID maupun nama agar konsisten di semua akun guru)
  const selectedElemenList = useMemo(() => {
    // 1. Cocokkan dari elemenSettings yang aktif
    const matched = elemenSettings.filter(e => {
      if (rawEnabledIds.includes(e.id)) return true;
      const eNamaClean = normLatin(e.nama);
      if (eNamaClean && rawEnabledNames.includes(eNamaClean)) return true;
      if (rawEnabledIds.some(id => normLatin(id) === eNamaClean || eNamaClean.includes(normLatin(id)) || normLatin(id).includes(eNamaClean))) return true;
      return false;
    });

    if (matched.length > 0) return matched;

    // 2. Fallback: jika elemenSettings lokal belum siap tetapi selectedElemenItems ada di trial settings
    if (capaianBacaanTrialSettings?.selectedElemenItems && capaianBacaanTrialSettings.selectedElemenItems.length > 0) {
      return capaianBacaanTrialSettings.selectedElemenItems.map(item => ({
        id: item.id,
        nama: item.nama,
        tipeModul: TipeModul.AL_QURAN,
        jenisSetoranList: ['Baru', 'Murojaah']
      } as ElemenSetting));
    }

    // 3. Fallback: jika rawEnabledIds ada tapi belum ada objeknya di elemenSettings lokal
    if (rawEnabledIds.length > 0) {
      return rawEnabledIds.map(id => {
        const found = elemenSettings.find(e => e.id === id);
        if (found) return found;
        const nameGuess = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return {
          id,
          nama: nameGuess,
          tipeModul: TipeModul.AL_QURAN,
          jenisSetoranList: ['Baru', 'Murojaah']
        } as ElemenSetting;
      });
    }

    return [];
  }, [elemenSettings, rawEnabledIds, rawEnabledNames, capaianBacaanTrialSettings?.selectedElemenItems]);

  // Daftar ID elemen terpilih untuk Capaian Bacaan Ayat
  const validSelectedElemenIds = useMemo(() => {
    return selectedElemenList.map(e => e.id);
  }, [selectedElemenList]);

  // Filter elemen untuk tampilan Matriks (bisa 'all' atau ID elemen tertentu)
  const [selectedFilterElemenId, setSelectedFilterElemenId] = useState<string>('all');

  // Tabs: 'matriks' | 'master_target' | 'elemen_settings'
  const [activeTab, setActiveTab] = useState<'matriks' | 'master_target' | 'elemen_settings'>('matriks');
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Khusus akun guru (non-admin), tab Master Target Ayat ditiadakan dan dialihkan ke matriks
  useEffect(() => {
    if (!isAdmin && activeTab === 'master_target') {
      setActiveTab('matriks');
    }
  }, [isAdmin, activeTab]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      tabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const storageKeySiswa = useMemo(() => {
    return `capaian_bacaan_last_siswa_id_${user?.id || 'default'}`;
  }, [user?.id]);

  // Filter States for Matriks
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(() => {
    if (initialSiswaId) return initialSiswaId;
    try {
      const saved = localStorage.getItem(`capaian_bacaan_last_siswa_id_${user?.id || 'default'}`);
      if (saved) return saved;
    } catch (e) {}
    return availableSiswas[0]?.id || '';
  });

  // Handler pemilihan santri dengan penyimpanan ke localStorage & callback ke parent
  const handleSelectSiswa = useCallback((siswaId: string) => {
    setSelectedSiswaId(siswaId);
    if (siswaId) {
      try {
        localStorage.setItem(storageKeySiswa, siswaId);
      } catch (e) {}
    }
    if (onSiswaChange) {
      onSiswaChange(siswaId);
    }
  }, [storageKeySiswa, onSiswaChange]);

  // Sinkronisasi dengan initialSiswaId jika dikirimkan oleh komponen pembungkus/induk
  useEffect(() => {
    if (initialSiswaId && availableSiswas.some(s => s.id === initialSiswaId) && selectedSiswaId !== initialSiswaId) {
      setSelectedSiswaId(initialSiswaId);
      try {
        localStorage.setItem(storageKeySiswa, initialSiswaId);
      } catch (e) {}
    }
  }, [initialSiswaId, availableSiswas, selectedSiswaId, storageKeySiswa]);

  // Otomatis sinkronisasi siswa terpilih saat daftar santri halaqah berubah
  useEffect(() => {
    if (availableSiswas.length > 0) {
      let savedId = '';
      try {
        savedId = localStorage.getItem(storageKeySiswa) || '';
      } catch (e) {}

      // 1. Jika selectedSiswaId saat ini masih valid di daftar santri halaqah, PERTAHANKAN (jangan ubah kembali ke urutan pertama!)
      if (selectedSiswaId && availableSiswas.some(s => s.id === selectedSiswaId)) {
        return;
      }

      // 2. Jika initialSiswaId disediakan dan ada di daftar santri, gunakan
      if (initialSiswaId && availableSiswas.some(s => s.id === initialSiswaId)) {
        setSelectedSiswaId(initialSiswaId);
        return;
      }

      // 3. Jika ada ID santri terakhir yang tersimpan di localStorage dan ada dalam daftar halaqah ini, gunakan itu
      if (savedId && availableSiswas.some(s => s.id === savedId)) {
        setSelectedSiswaId(savedId);
        return;
      }

      // 4. Jika tidak ada yang cocok, gunakan santri urutan pertama
      const fallbackId = availableSiswas[0].id;
      setSelectedSiswaId(fallbackId);
      try {
        localStorage.setItem(storageKeySiswa, fallbackId);
      } catch (e) {}
      if (onSiswaChange) {
        onSiswaChange(fallbackId);
      }
    } else {
      setSelectedSiswaId('');
    }
  }, [availableSiswas, selectedSiswaId, initialSiswaId, storageKeySiswa, onSiswaChange]);

  // Selected student object (terfilter ketat sesuai santri halaqah)
  const activeSiswa = useMemo(() => {
    if (!availableSiswas || availableSiswas.length === 0) return null;
    return availableSiswas.find(s => s.id === selectedSiswaId) || availableSiswas[0] || null;
  }, [availableSiswas, selectedSiswaId]);

  // Helper pemeriksa apakah suatu setoran atau sesi berasal dari Elemen Pembelajaran yang dipilih admin
  const isMatchingSelectedElemen = useCallback((item: {
    elemenId?: string;
    elemenNama?: string;
    jenisSetoran?: string;
    tipeTahfidz?: string;
  }): boolean => {
    // Jika admin belum memilih elemen sama sekali di Tab Elemen
    if (validSelectedElemenIds.length === 0) return false;

    const elId = (item.elemenId || '').trim();
    // 1. Cocokkan ID elemen secara langsung
    if (elId && validSelectedElemenIds.includes(elId)) return true;

    const norm = (s?: string) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const itemCandidates = [
      norm(item.elemenNama),
      norm(item.jenisSetoran),
      norm(item.tipeTahfidz)
    ].filter(Boolean);

    if (itemCandidates.length === 0) return false;

    // 2. Cocokkan nama atau jenis setoran dengan daftar elemen aktif yang dipilih admin
    return selectedElemenList.some(el => {
      const elIdClean = norm(el.id);
      const elNamaClean = norm(el.nama);
      const jenisCleanList = (el.jenisSetoranList || []).map(norm);

      return itemCandidates.some(c => {
        if (c === elIdClean || c === elNamaClean) return true;
        if (elNamaClean && (c.includes(elNamaClean) || elNamaClean.includes(c))) return true;
        if (jenisCleanList.includes(c)) return true;
        return false;
      });
    });
  }, [validSelectedElemenIds, selectedElemenList]);

  // Daftar surat yang ada di riwayat setoran & instrumen capaian untuk santri aktif
  // Khusus HANYA memperhitungkan setoran/sesi yang elemen pembelajarannya diaktifkan oleh admin
  const studentSurahHistoryList = useMemo(() => {
    if (!activeSiswa) return [];

    const norm = (str?: string) => (str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const map = new Map<number, {
      nomor: number;
      nama: string;
      namaArab: string;
      jumlahAyat: number;
      setoranCount: number;
      sesiCount: number;
      latestTanggal: string;
      hasConfigs: boolean;
    }>();

    // 1. Dari capaianBacaanSesiList (Hanya yang elemennya sesuai penetapan admin)
    (capaianBacaanSesiList || []).forEach(sesi => {
      if (sesi.siswaId !== activeSiswa.id) return;
      if (!isMatchingSelectedElemen(sesi)) return;
      const sMeta = DAFTAR_114_SURAT.find(s => s.nomor === sesi.suratNomor);
      if (!sMeta) return;

      const existing = map.get(sMeta.nomor) || {
        nomor: sMeta.nomor,
        nama: sMeta.nama,
        namaArab: sMeta.namaArab,
        jumlahAyat: sMeta.jumlahAyat,
        setoranCount: 0,
        sesiCount: 0,
        latestTanggal: '',
        hasConfigs: capaianBacaanConfigs.some(c => c.suratNomor === sMeta.nomor)
      };

      existing.sesiCount += 1;
      if (sesi.tanggal && (!existing.latestTanggal || sesi.tanggal > existing.latestTanggal)) {
        existing.latestTanggal = sesi.tanggal;
      }
      map.set(sMeta.nomor, existing);
    });

    // 2. Dari riwayat setorans santri (Hanya yang elemennya sesuai penetapan admin)
    (setorans || []).forEach(setoran => {
      if (setoran.siswaId !== activeSiswa.id) return;
      if (!isMatchingSelectedElemen(setoran)) return;

      const candidateNames: string[] = [];
      if (setoran.suratNama) candidateNames.push(setoran.suratNama);
      if (setoran.modulNama) candidateNames.push(setoran.modulNama);
      if (setoran.daftarSuratSetoran && Array.isArray(setoran.daftarSuratSetoran)) {
        setoran.daftarSuratSetoran.forEach(d => {
          if (d.suratNama) candidateNames.push(d.suratNama);
        });
      }

      candidateNames.forEach(rawName => {
        const clean = norm(rawName);
        if (!clean) return;
        const matched = DAFTAR_114_SURAT.find(d => {
          const dClean = norm(d.nama);
          return dClean === clean || clean.includes(dClean) || (clean.length > 3 && dClean.includes(clean));
        });

        if (matched) {
          const existing = map.get(matched.nomor) || {
            nomor: matched.nomor,
            nama: matched.nama,
            namaArab: matched.namaArab,
            jumlahAyat: matched.jumlahAyat,
            setoranCount: 0,
            sesiCount: 0,
            latestTanggal: '',
            hasConfigs: capaianBacaanConfigs.some(c => c.suratNomor === matched.nomor)
          };

          existing.setoranCount += 1;
          const tgl = setoran.tanggalSetoran || '';
          if (tgl && (!existing.latestTanggal || tgl > existing.latestTanggal)) {
            existing.latestTanggal = tgl;
          }
          map.set(matched.nomor, existing);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.latestTanggal && b.latestTanggal && a.latestTanggal !== b.latestTanggal) {
        return b.latestTanggal.localeCompare(a.latestTanggal);
      }
      return (b.setoranCount + b.sesiCount) - (a.setoranCount + a.sesiCount);
    });
  }, [activeSiswa, capaianBacaanSesiList, setorans, capaianBacaanConfigs, isMatchingSelectedElemen]);

  const [selectedSuratNomor, setSelectedSuratNomor] = useState<number>(1);

  // Deteksi jika santri memiliki setoran pada surah yang dipilih saat ini, NAMUN pada elemen yang BUKAN dipilih admin (misal 'Tasmi'')
  const otherElemenSetoransForSurat = useMemo(() => {
    if (!activeSiswa) return [];
    const surahMeta = DAFTAR_114_SURAT.find(s => s.nomor === selectedSuratNomor);
    const surahNameClean = (surahMeta?.nama || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    return (setorans || []).filter(s => {
      if (s.siswaId !== activeSiswa.id) return false;
      const sSuratClean = (s.suratNama || s.modulNama || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const isSurahMatch = sSuratClean.includes(surahNameClean) ||
        (s.daftarSuratSetoran && s.daftarSuratSetoran.some(d => (d.suratNama || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '').includes(surahNameClean)));
      if (!isSurahMatch) return false;

      // Setoran ini untuk surah ini, tapi BUKAN berasal dari elemen capaian yang dipilih admin
      return !isMatchingSelectedElemen(s);
    });
  }, [activeSiswa, selectedSuratNomor, setorans, isMatchingSelectedElemen]);

  // Daftar nama elemen yang ditemukan pada setoran santri untuk surah ini (yang bukan dipilih admin)
  const otherElemenNamesText = useMemo(() => {
    const names = new Set<string>();
    otherElemenSetoransForSurat.forEach(s => {
      if (s.jenisSetoran) names.add(s.jenisSetoran);
      if (s.elemenNama) names.add(s.elemenNama);
      if (s.tipeTahfidz) names.add(s.tipeTahfidz);
    });
    return Array.from(names).join(', ') || 'Elemen Lain';
  }, [otherElemenSetoransForSurat]);

  // Daftar nama elemen pembelajaran yang diaktifkan oleh admin
  const activeElemenNamesText = useMemo(() => {
    if (selectedElemenList.length === 0) return 'Belum ada elemen yang dipilih admin';
    return selectedElemenList.map(e => e.nama).join(', ');
  }, [selectedElemenList]);

  // Otomatis arahkan surat terpilih saat santri berganti:
  // Jika santri memiliki riwayat setoran pada surat tertentu dan surat saat ini belum pernah disetor,
  // sistem langsung mengarahkan tampilan ke surat riwayat setoran santri tersebut (misal Surah Al-Ikhlas).
  const prevSiswaForSuratSwitchRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeSiswa) return;

    if (prevSiswaForSuratSwitchRef.current !== activeSiswa.id) {
      prevSiswaForSuratSwitchRef.current = activeSiswa.id;

      if (studentSurahHistoryList.length > 0) {
        const isCurrentInHistory = studentSurahHistoryList.some(s => s.nomor === selectedSuratNomor);
        if (!isCurrentInHistory) {
          // Beralih ke surat riwayat setoran santri teratas (terbaru)
          setSelectedSuratNomor(studentSurahHistoryList[0].nomor);
        }
      }
    }
  }, [activeSiswa?.id, studentSurahHistoryList, selectedSuratNomor]);

  const [suratFilterMode, setSuratFilterMode] = useState<'santri' | 'wajib' | 'target' | 'semua'>('santri');
  const [searchSiswaQuery, setSearchSiswaQuery] = useState<string>('');

  // Daftar Nomor Surat Wajib / Inti (Al-Fatihah, Surat-surat Pilihan & Juz Amma)
  const SURAT_WAJIB_NOMORS = useMemo(() => [
    1, 18, 36, 55, 56, 67, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114
  ], []);

  const filteredSuratList = useMemo(() => {
    if (suratFilterMode === 'santri') {
      const list = studentSurahHistoryList
        .map(h => DAFTAR_114_SURAT.find(s => s.nomor === h.nomor))
        .filter((s): s is SuratMeta => !!s);
      if (list.length > 0) return list;
      return DAFTAR_114_SURAT.filter(s => SURAT_WAJIB_NOMORS.includes(s.nomor));
    }
    if (suratFilterMode === 'wajib') {
      return DAFTAR_114_SURAT.filter(s => SURAT_WAJIB_NOMORS.includes(s.nomor));
    }
    if (suratFilterMode === 'target') {
      return DAFTAR_114_SURAT.filter(s => capaianBacaanConfigs.some(c => c.suratNomor === s.nomor));
    }
    return DAFTAR_114_SURAT;
  }, [suratFilterMode, studentSurahHistoryList, capaianBacaanConfigs, SURAT_WAJIB_NOMORS]);

  // Master Target form states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [configSuratNomor, setConfigSuratNomor] = useState<number>(1);
  const [configNomorAyat, setConfigNomorAyat] = useState<number>(1);
  const [configTeksArab, setConfigTeksArab] = useState<string>('');
  const [configTargets, setConfigTargets] = useState<CapaianBacaanTargetItem[]>([
    { id: 't-new-1', unsur: 'ل (lam)', target: 'Tidak memantulkan huruf lam (ل) sukun.' }
  ]);
  const [configKeterangan, setConfigKeterangan] = useState<string>('');

  // Tab 2: Master Target Ayat States
  const [selectedTab2SuratNomor, setSelectedTab2SuratNomor] = useState<number | 'all'>(selectedSuratNomor);
  const [searchTab2Query, setSearchTab2Query] = useState<string>('');
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // Reorder Modal State
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderDraftList, setReorderDraftList] = useState<CapaianBacaanAyatConfig[]>([]);
  const [reorderSuratNomor, setReorderSuratNomor] = useState<number>(1);

  // Preset Loading Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetTargetOption, setPresetTargetOption] = useState<'surat_ini' | 'al_fatihah' | 'al_ikhlas' | 'semua'>('surat_ini');

  // Add/Edit Session Modal states
  const [isSesiModalOpen, setIsSesiModalOpen] = useState(false);
  const [editingSesiId, setEditingSesiId] = useState<string | null>(null);
  const [sesiSiswaId, setSesiSiswaId] = useState<string>('');
  const [sesiSuratNomor, setSesiSuratNomor] = useState<number>(1);
  const [sesiNomorAyat, setSesiNomorAyat] = useState<number>(1);
  const [sesiKeNumber, setSesiKeNumber] = useState<number>(1);
  const [sesiNama, setSesiNama] = useState<string>('P1');
  const [sesiTanggal, setSesiTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sesiGuruId, setSesiGuruId] = useState<string>(user?.id || gurus[0]?.id || '');
  const [sesiElemenId, setSesiElemenId] = useState<string>('');
  const [sesiCatatanTarget, setSesiCatatanTarget] = useState<Record<string, boolean>>({});
  const [sesiCatatanTambahan, setSesiCatatanTambahan] = useState<string>('');



  // Selected Surah Meta
  const activeSurat = useMemo(() => {
    return DAFTAR_114_SURAT.find(s => s.nomor === selectedSuratNomor) || DAFTAR_114_SURAT[0];
  }, [selectedSuratNomor]);

  // Configurations for current selected Surah
  const configsForSurah = useMemo(() => {
    return capaianBacaanConfigs
      .filter(c => c.suratNomor === selectedSuratNomor)
      .sort((a, b) => a.nomorAyat - b.nomorAyat);
  }, [capaianBacaanConfigs, selectedSuratNomor]);

  // Helper normalisasi teks Arab (buang harakat, tashkeel, tanwin, tatweel) untuk perbandingan perkata
  const normalizeArabic = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/ـ/g, '')
      .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '')
      .trim()
      .toLowerCase();
  };

  const normalizeLatin = (s?: string) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Helper pemeriksa apakah dua kata Arab cocok (mempertimbangkan partikel waw / fa)
  const isWordsMatching = (w1?: string, w2?: string): boolean => {
    if (!w1 || !w2) return false;
    const clean1 = normalizeArabic(w1);
    const clean2 = normalizeArabic(w2);
    if (!clean1 || !clean2) return false;
    if (clean1 === clean2) return true;
    if (clean1 === 'و' + clean2 || clean2 === 'و' + clean1) return true;
    if (clean1 === 'ف' + clean2 || clean2 === 'ف' + clean1) return true;
    // Jika kata identik atau hampir identik (panjang selisih max 1 huruf misal alif/lam awal)
    if ((clean1.includes(clean2) || clean2.includes(clean1)) && Math.abs(clean1.length - clean2.length) <= 1) {
      return true;
    }
    return false;
  };

  // Helper pemeriksa apakah subkategori/huruf koreksi cocok secara spesifik dengan target
  const isSubcategoryOrLetterMatching = (
    commentSub: string,
    tgtSub: string,
    tgtUnsur: string,
    tgtDesc: string
  ): boolean => {
    if (!commentSub) return true;

    // 1. Ambil karakter huruf Arab dari commentSub (misal 'ص', 'ط', 'هـ', 'ع', 'ق', dst.)
    const arabicLettersComment: string[] = commentSub.match(/[\u0621-\u064A]/g) || [];
    if (arabicLettersComment.length > 0) {
      // Ambil karakter huruf Arab dari target (unsur, subkategori, atau uraian target)
      const targetCombined = `${tgtSub} ${tgtUnsur} ${tgtDesc}`;
      const arabicLettersTarget: string[] = targetCombined.match(/[\u0621-\u064A]/g) || [];
      
      // Jika target memiliki huruf Arab spesifik, WAJIB ada huruf Arab yang cocok
      if (arabicLettersTarget.length > 0) {
        return arabicLettersComment.some(cLetter => arabicLettersTarget.includes(cLetter));
      }
      return false;
    }

    // 2. Jika tidak ada huruf Arab, cocokkan teks istilah Latin (misal 'Memantulkan huruf', 'Ghunnah', 'Mad')
    const cleanComment = normalizeLatin(commentSub);
    const cleanSub = normalizeLatin(tgtSub);
    const cleanUnsur = normalizeLatin(tgtUnsur);
    const cleanDesc = normalizeLatin(tgtDesc);

    if (cleanSub && (cleanSub.includes(cleanComment) || cleanComment.includes(cleanSub))) return true;
    if (cleanUnsur && (cleanUnsur.includes(cleanComment) || cleanComment.includes(cleanUnsur))) return true;
    if (cleanDesc && cleanDesc.includes(cleanComment)) return true;

    return false;
  };

  // Deteksi otomatis target catatan kesalahan berdasarkan riwayat setoran siswa terkini
  const detectTargetsFromSetorans = (
    studentId: string,
    suratNo: number,
    ayatNo: number,
    targetList: CapaianBacaanTargetItem[],
    specificSetoran?: Setoran
  ): {
    autoChecked: Record<string, boolean>;
    detectionDetails: Record<string, { category: string; subcategory?: string; targetText?: string; date?: string; note?: string }>;
  } => {
    const autoChecked: Record<string, boolean> = {};
    const detectionDetails: Record<string, { category: string; subcategory?: string; targetText?: string; date?: string; note?: string }> = {};

    if (!studentId || !targetList || targetList.length === 0) {
      return { autoChecked, detectionDetails };
    }

    const surahMeta = DAFTAR_114_SURAT.find(s => s.nomor === suratNo);
    const surahNameClean = normalizeLatin(surahMeta?.nama);

    // Ambil setoran yang akan diperiksa: jika specificSetoran disediakan, periksa HANYA setoran tersebut
    let targetSetorans: Setoran[] = [];
    if (specificSetoran) {
      targetSetorans = [specificSetoran];
    } else {
      targetSetorans = (setorans || []).filter(s => {
        if (s.siswaId !== studentId) return false;
        if (!isMatchingSelectedElemen(s)) return false;
        const sSuratClean = normalizeLatin(s.suratNama || s.modulNama);
        const matchSurah = sSuratClean.includes(surahNameClean) ||
          (s.daftarSuratSetoran && s.daftarSuratSetoran.some(d => normalizeLatin(d.suratNama).includes(surahNameClean)));
        
        if (!matchSurah) return false;

        if (s.ayatAwal !== undefined && s.ayatAkhir !== undefined) {
          if (ayatNo < s.ayatAwal || ayatNo > s.ayatAkhir) return false;
        }
        return true;
      });
    }

    for (const setoran of targetSetorans) {
      // Pastikan setoran ini mencakup ayat yang sedang diuji
      if (setoran.ayatAwal !== undefined && setoran.ayatAkhir !== undefined) {
        if (ayatNo < setoran.ayatAwal || ayatNo > setoran.ayatAkhir) {
          continue;
        }
      }

      const comments = setoran.interactiveComments || [];

      // 1. Periksa interactiveComments (Koreksi terstruktur langsung per kata dan ayat)
      for (const comment of comments) {
        let commentAyat: number | null = null;
        if (comment.targetKey) {
          const m = comment.targetKey.match(/quran-(?:\d+)-(\d+)-/);
          if (m) {
            commentAyat = Number(m[1]);
          } else {
            const mFallback = comment.targetKey.match(/quran-.*-(\d+)-/);
            if (mFallback) commentAyat = Number(mFallback[1]);
          }
        }
        if (commentAyat === null && comment.info) {
          const m = comment.info.match(/Ayat\s*(\d+)/i);
          if (m) commentAyat = Number(m[1]);
        }

        // PENTING: Jika nomor ayat pada komentar spesifik dan bukan ayat yang sedang diuji, lewati!
        if (commentAyat !== null && commentAyat !== ayatNo) {
          continue;
        }

        // Jika nomor ayat tidak dapat ditentukan, dan setoran mencakup rentang multi-ayat (>1 ayat),
        // jangan sembarangan mencocokkan kecuali komentar secara eksplisit menyebut nomor ayat
        if (commentAyat === null && setoran.ayatAwal !== undefined && setoran.ayatAkhir !== undefined && setoran.ayatAwal !== setoran.ayatAkhir) {
          continue;
        }

        const commentWord = comment.target;
        const commentCat = comment.category || '';
        const commentSub = comment.subcategory || '';

        for (const tgt of targetList) {
          // Pengecekan perkata: kata target harus benar-benar cocok dengan kata yang dikoreksi
          if (tgt.kataLafaz && commentWord) {
            if (!isWordsMatching(tgt.kataLafaz, commentWord)) {
              continue; // Berbeda kata, jangan cocokkan!
            }
          }

          let isMatch = false;

          if (commentSub) {
            // Jika komentar memiliki subkategori/huruf spesifik (seperti 'ص' atau 'ط'):
            // WAJIB cocok huruf/subkategorinya, TIDAK BOLEH fallback ke kategori umum!
            isMatch = isSubcategoryOrLetterMatching(
              commentSub,
              tgt.subKategoriKesalahanNama || '',
              tgt.unsur || '',
              tgt.target || ''
            );
          } else if (commentCat) {
            // Hanya jika komentar tidak memiliki subkategori sama sekali, baru gunakan kategori
            const commentCatClean = normalizeLatin(commentCat);
            const tgtCatClean = normalizeLatin(tgt.kategoriKesalahanNama);
            if (tgtCatClean && (tgtCatClean === commentCatClean || tgtCatClean.includes(commentCatClean) || commentCatClean.includes(tgtCatClean))) {
              isMatch = true;
            }
          }

          if (isMatch) {
            autoChecked[tgt.id] = true;
            detectionDetails[tgt.id] = {
              category: comment.category || '',
              subcategory: comment.subcategory,
              targetText: comment.target,
              date: setoran.tanggalSetoran,
              note: comment.comment
            };
          }
        }
      }

      // 2. Periksa catatanGuru per baris (khusus baris koreksi terstruktur atau catatan manual spesifik)
      if (setoran.catatanGuru) {
        const lines = setoran.catatanGuru.split('\n').map(l => l.trim()).filter(Boolean);
        const koreksiLineRegex = /\[Koreksi\s+(?:Rentang\s+)?"([^"]+)"(?:\s+\[([^\]]+)\])?\s+di\s+([^\]]+)\](?::\s*(.*))?/i;

        for (const line of lines) {
          const match = line.match(koreksiLineRegex);
          if (match) {
            const rawTargetWord = match[1];
            const rawCatSub = match[2] || '';
            const rawInfo = match[3] || '';
            const rawNote = match[4] || '';

            // Ekstrak ayat dari baris koreksi
            const infoAyatMatch = rawInfo.match(/Ayat\s*(\d+)/i);
            const lineAyat = infoAyatMatch ? Number(infoAyatMatch[1]) : null;

            // Jika baris koreksi memiliki nomor ayat dan tidak sama dengan ayat yang sedang diuji, lewati!
            if (lineAyat !== null && lineAyat !== ayatNo) {
              continue;
            }
            if (lineAyat === null && setoran.ayatAwal !== undefined && setoran.ayatAkhir !== undefined && setoran.ayatAwal !== setoran.ayatAkhir) {
              continue;
            }

            // Pisahkan category dan subcategory jika rawCatSub berbentuk "Category - Subcategory" (misal "Pelafalan huruf - ص")
            let lineCat = rawCatSub;
            let lineSub = '';
            if (rawCatSub.includes('-')) {
              const parts = rawCatSub.split('-');
              lineCat = parts[0].trim();
              lineSub = parts.slice(1).join('-').trim();
            }

            for (const tgt of targetList) {
              if (tgt.kataLafaz && rawTargetWord) {
                if (!isWordsMatching(tgt.kataLafaz, rawTargetWord)) {
                  continue; // Berbeda kata
                }
              }

              let isMatch = false;

              if (lineSub) {
                // Ada subkategori/huruf spesifik (seperti 'ص' atau 'ط'): WAJIB COCOK HURUF
                isMatch = isSubcategoryOrLetterMatching(
                  lineSub,
                  tgt.subKategoriKesalahanNama || '',
                  tgt.unsur || '',
                  tgt.target || ''
                );
              } else if (rawCatSub) {
                // Cek apakah rawCatSub sendiri mengandung huruf/subkategori target
                const isLetterMatch = isSubcategoryOrLetterMatching(
                  rawCatSub,
                  tgt.subKategoriKesalahanNama || '',
                  tgt.unsur || '',
                  tgt.target || ''
                );
                if (isLetterMatch) {
                  isMatch = true;
                } else {
                  // Cek apakah kategori cocok (HANYA jika target tidak mensyaratkan huruf Arab tertentu)
                  const lineCatClean = normalizeLatin(lineCat);
                  const tgtCatClean = normalizeLatin(tgt.kategoriKesalahanNama);
                  const targetHasSpecificArabicLetter = `${tgt.unsur} ${tgt.subKategoriKesalahanNama}`.match(/[\u0621-\u064A]/g) || [];
                  if (targetHasSpecificArabicLetter.length === 0 && tgtCatClean && lineCatClean && (tgtCatClean === lineCatClean || lineCatClean.includes(tgtCatClean))) {
                    isMatch = true;
                  }
                }
              } else {
                isMatch = true;
              }

              if (isMatch) {
                autoChecked[tgt.id] = true;
                if (!detectionDetails[tgt.id]) {
                  detectionDetails[tgt.id] = {
                    category: tgt.kategoriKesalahanNama || '',
                    subcategory: tgt.subKategoriKesalahanNama,
                    targetText: rawTargetWord,
                    date: setoran.tanggalSetoran,
                    note: rawNote || line
                  };
                }
              }
            }
          } else {
            // Baris catatan bebas: hanya cocokkan jika baris secara eksplisit menyebut nomor ayat ini DAN kata target
            const lineAyatMatch = line.match(/Ayat\s*(\d+)/i);
            if (lineAyatMatch && Number(lineAyatMatch[1]) !== ayatNo) {
              continue;
            }

            for (const tgt of targetList) {
              if (!tgt.kataLafaz) continue;
              const wordClean = normalizeArabic(tgt.kataLafaz);
              const lineClean = normalizeArabic(line);
              
              // Kata target harus benar-benar ada di dalam baris catatan guru
              if (wordClean && lineClean.includes(wordClean)) {
                const tgtSubClean = normalizeLatin(tgt.subKategoriKesalahanNama);
                const tgtUnsurClean = normalizeLatin(tgt.unsur);
                const lineLatin = normalizeLatin(line);

                if ((tgtSubClean && lineLatin.includes(tgtSubClean)) || (tgtUnsurClean && lineLatin.includes(tgtUnsurClean))) {
                  autoChecked[tgt.id] = true;
                  if (!detectionDetails[tgt.id]) {
                    detectionDetails[tgt.id] = {
                      category: tgt.kategoriKesalahanNama || '',
                      subcategory: tgt.subKategoriKesalahanNama,
                      date: setoran.tanggalSetoran,
                      note: line
                    };
                  }
                }
              }
            }
          }
        }
      }
    }

    return { autoChecked, detectionDetails };
  };

  // Sessions for current student and Surah (difilter per elemen jika difilter, plus otomatis disinkronkan dengan riwayat setoran siswa)
  const sessionsForStudentAndSurah = useMemo(() => {
    if (!activeSiswa) return [];

    // 1. Ambil sesi tersimpan eksplisit di capaianBacaanSesiList (hanya elemen yang dipilih admin)
    const explicitList = capaianBacaanSesiList
      .filter(s => {
        if (s.siswaId !== activeSiswa.id || s.suratNomor !== selectedSuratNomor) return false;
        if (!isMatchingSelectedElemen(s)) return false;
        if (selectedFilterElemenId !== 'all') {
          return s.elemenId === selectedFilterElemenId;
        }
        return true;
      });

    // 2. Ambil riwayat setoran siswa untuk surah ini (hanya elemen yang dipilih admin)
    const surahMeta = DAFTAR_114_SURAT.find(s => s.nomor === selectedSuratNomor);
    const surahNameClean = normalizeLatin(surahMeta?.nama);

    const relevantSetorans = (setorans || []).filter(s => {
      if (s.siswaId !== activeSiswa.id) return false;
      if (!isMatchingSelectedElemen(s)) return false;
      if (selectedFilterElemenId !== 'all' && s.elemenId && s.elemenId !== selectedFilterElemenId) return false;
      const sSuratClean = normalizeLatin(s.suratNama || s.modulNama);
      return sSuratClean.includes(surahNameClean) ||
        (s.daftarSuratSetoran && s.daftarSuratSetoran.some(d => normalizeLatin(d.suratNama).includes(surahNameClean)));
    }).sort((a, b) => {
      if (a.tanggalSetoran !== b.tanggalSetoran) {
        return a.tanggalSetoran.localeCompare(b.tanggalSetoran);
      }
      return a.id.localeCompare(b.id);
    });

    const combined = [...explicitList];

    // 3. Sinkronisasikan kolom P1, P2... berdasarkan urutan setoran santri
    relevantSetorans.forEach((setoran, idx) => {
      const pIndex = idx + 1;
      const comments = setoran.interactiveComments || [];

      configsForSurah.forEach(cfg => {
        const ayatNo = cfg.nomorAyat;
        const existing = combined.find(s => s.nomorAyat === ayatNo && s.sesiKe === pIndex);

        const isTestedAyat = (setoran.ayatAwal !== undefined && setoran.ayatAkhir !== undefined && ayatNo >= setoran.ayatAwal && ayatNo <= setoran.ayatAkhir) ||
          (setoran.ayatAwal === undefined && ayatNo === 1) ||
          comments.length > 0;

        if (isTestedAyat) {
          const { autoChecked } = detectTargetsFromSetorans(
            activeSiswa.id,
            selectedSuratNomor,
            ayatNo,
            cfg.targets,
            setoran
          );

          if (!existing) {
            combined.push({
              id: `cb-sesi-sync-${setoran.id}-${ayatNo}-${pIndex}`,
              siswaId: activeSiswa.id,
              suratNomor: selectedSuratNomor,
              nomorAyat: ayatNo,
              sesiKe: pIndex,
              namaSesi: `P${pIndex}`,
              tanggal: setoran.tanggalSetoran || new Date().toISOString().split('T')[0],
              guruId: setoran.guruId || '',
              guruNama: setoran.guruNama || 'Ustadz Pembimbing',
              elemenId: setoran.elemenId || '',
              elemenNama: setoran.jenisSetoran || '',
              catatanTarget: autoChecked,
              catatanTambahan: setoran.catatanGuru || ''
            });
          } else if (existing.id.startsWith('cb-sesi-sync-')) {
            existing.catatanTarget = autoChecked;
            existing.catatanTambahan = setoran.catatanGuru || '';
          }
        }
      });
    });

    return combined.sort((a, b) => a.sesiKe - b.sesiKe);
  }, [capaianBacaanSesiList, activeSiswa, selectedSuratNomor, selectedFilterElemenId, setorans, configsForSurah, isMatchingSelectedElemen]);

  // Distinct session columns for this student and surah (e.g. P1, P2, P3...)
  const distinctSessionColumns = useMemo(() => {
    const map = new Map<number, CapaianBacaanSesiPertemuan>();
    sessionsForStudentAndSurah.forEach(s => {
      if (!map.has(s.sesiKe) || (s.namaSesi && !map.get(s.sesiKe)?.namaSesi)) {
        map.set(s.sesiKe, s);
      }
    });
    return Array.from(map.entries())
      .map(([sesiKe, sample]) => ({
        sesiKe,
        sample,
        namaSesi: sample.namaSesi || `P${sesiKe}`
      }))
      .sort((a, b) => a.sesiKe - b.sesiKe);
  }, [sessionsForStudentAndSurah]);

  // Filtered Siswa list for dropdown
  const filteredSiswas = useMemo(() => {
    if (!searchSiswaQuery.trim()) return siswas;
    const q = searchSiswaQuery.toLowerCase();
    return siswas.filter(s => 
      s.namaLengkap.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      (s.halaqahNama && s.halaqahNama.toLowerCase().includes(q))
    );
  }, [siswas, searchSiswaQuery]);

  // Auto-detection tracking info from student setoran records
  const [autoDetectionInfo, setAutoDetectionInfo] = useState<Record<string, { category: string; subcategory?: string; targetText?: string; date?: string; note?: string }>>({});

  // Handle open add session modal
  const handleOpenAddSession = (ayatNo?: number) => {
    if (!isGuru || !activeSiswa) return;
    const targetAyat = ayatNo || configsForSurah[0]?.nomorAyat || 1;
    
    // Auto-increment session number for this ayat
    const existingForAyat = capaianBacaanSesiList.filter(
      s => s.siswaId === activeSiswa.id && s.suratNomor === selectedSuratNomor && s.nomorAyat === targetAyat
    );
    const nextSesiKe = existingForAyat.length > 0 
      ? Math.max(...existingForAyat.map(s => s.sesiKe)) + 1 
      : (distinctSessionColumns.length > 0 ? Math.max(...distinctSessionColumns.map(d => d.sesiKe)) + 1 : 1);

    // Ambil butir target ayat untuk deteksi otomatis koreksi setoran
    const targetConfig = configsForSurah.find(c => c.nomorAyat === targetAyat) || configsForSurah[0];
    const targets = targetConfig?.targets || [];
    const { autoChecked, detectionDetails } = detectTargetsFromSetorans(
      activeSiswa.id,
      selectedSuratNomor,
      targetAyat,
      targets
    );

    setEditingSesiId(null);
    setSesiSiswaId(activeSiswa.id);
    setSesiSuratNomor(selectedSuratNomor);
    setSesiNomorAyat(targetAyat);
    setSesiKeNumber(nextSesiKe);
    const defaultElemId = (selectedFilterElemenId !== 'all' ? selectedFilterElemenId : '') || (selectedElemenList[0]?.id || elemenSettings[0]?.id || '');
    setSesiElemenId(defaultElemId);
    setSesiNama(`P${nextSesiKe}`);
    setSesiTanggal(new Date().toISOString().split('T')[0]);
    setSesiGuruId(user?.id || gurus[0]?.id || '');
    setSesiCatatanTarget(autoChecked);
    setAutoDetectionInfo(detectionDetails);
    setSesiCatatanTambahan('');
    setIsSesiModalOpen(true);
  };

  // Handle edit session
  const handleOpenEditSession = (sesi: CapaianBacaanSesiPertemuan) => {
    if (!isGuru) return;
    setEditingSesiId(sesi.id);
    setSesiSiswaId(sesi.siswaId);
    setSesiSuratNomor(sesi.suratNomor);
    setSesiNomorAyat(sesi.nomorAyat);
    setSesiKeNumber(sesi.sesiKe);
    setSesiNama(sesi.namaSesi || `P${sesi.sesiKe}`);
    setSesiTanggal(sesi.tanggal);
    setSesiGuruId(sesi.guruId);
    setSesiElemenId(sesi.elemenId || (selectedElemenList[0]?.id || elemenSettings[0]?.id || ''));
    setSesiCatatanTarget({ ...(sesi.catatanTarget || {}) });
    setSesiCatatanTambahan(sesi.catatanTambahan || '');
    setIsSesiModalOpen(true);
  };

  // Save session
  const handleSaveSesi = () => {
    if (!sesiSiswaId) {
      alert('Pilih siswa terlebih dahulu.');
      return;
    }
    const targetGuru = gurus.find(g => g.id === sesiGuruId);
    const guruNama = targetGuru ? targetGuru.namaLengkap : (user?.namaLengkap || 'Ustadz Pembimbing');
    const targetElem = elemenSettings.find(e => e.id === sesiElemenId);

    const payload: CapaianBacaanSesiPertemuan = {
      id: editingSesiId || `cb-sesi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      siswaId: sesiSiswaId,
      suratNomor: sesiSuratNomor,
      nomorAyat: sesiNomorAyat,
      sesiKe: Number(sesiKeNumber),
      namaSesi: sesiNama.trim() || `P${sesiKeNumber}`,
      tanggal: sesiTanggal,
      guruId: sesiGuruId,
      guruNama,
      elemenId: sesiElemenId || targetElem?.id || '',
      elemenNama: targetElem?.nama || '',
      catatanTarget: sesiCatatanTarget,
      catatanTambahan: sesiCatatanTambahan.trim()
    };

    saveCapaianBacaanSesi(payload);
    setIsSesiModalOpen(false);
  };

  // Handle Save Master Target Config
  const handleSaveConfig = () => {
    if (!configTeksArab.trim()) {
      alert('Lafaz teks Arab ayat wajib diisi.');
      return;
    }
    if (configTargets.length === 0) {
      alert('Minimal masukkan 1 butir target capaian.');
      return;
    }

    const surahMeta = DAFTAR_114_SURAT.find(s => s.nomor === configSuratNomor);
    const payload: CapaianBacaanAyatConfig = {
      id: editingConfigId || `cfg-${configSuratNomor}-${configNomorAyat}-${Date.now().toString().slice(-4)}`,
      suratNomor: configSuratNomor,
      suratNama: surahMeta ? surahMeta.nama : `Surat ${configSuratNomor}`,
      nomorAyat: Number(configNomorAyat),
      teksArab: configTeksArab.trim(),
      targets: configTargets,
      keterangan: configKeterangan.trim()
    };

    saveCapaianBacaanConfig(payload);
    setIsConfigModalOpen(false);
  };

  // Geser Urutan Ayat Naik / Turun langsung dari kartu ayat
  const handleShiftAyatOrder = async (cfg: CapaianBacaanAyatConfig, direction: 'up' | 'down') => {
    const surahConfigs = capaianBacaanConfigs
      .filter(c => c.suratNomor === cfg.suratNomor)
      .sort((a, b) => a.nomorAyat - b.nomorAyat);

    const index = surahConfigs.findIndex(c => c.id === cfg.id);
    if (index < 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= surahConfigs.length) return;

    const itemA = surahConfigs[index];
    const itemB = surahConfigs[targetIndex];

    const tempNomor = itemA.nomorAyat;
    const nomorB = itemB.nomorAyat;
    const newNomorA = nomorB !== tempNomor ? nomorB : (direction === 'up' ? tempNomor - 1 : tempNomor + 1);
    const newNomorB = tempNomor;

    const updatedA = { ...itemA, nomorAyat: newNomorA };
    const updatedB = { ...itemB, nomorAyat: newNomorB };

    const nextList = capaianBacaanConfigs.map(c => {
      if (c.id === updatedA.id) return updatedA;
      if (c.id === updatedB.id) return updatedB;
      return c;
    });

    await reorderCapaianBacaanConfigs(nextList);
    setReorderSuccessMsg(`Urutan Surah ${cfg.suratNama} Ayat ${cfg.nomorAyat} berhasil digeser ke ${direction === 'up' ? 'atas' : 'bawah'}. Tersimpan ke Cloud!`);
    setTimeout(() => setReorderSuccessMsg(null), 3000);
  };

  // Rapikan nomor urut secara berurutan (1, 2, 3...) untuk surah yang dipilih
  const handleAutoRenumberSequential = async (suratNomor: number) => {
    const surahMeta = DAFTAR_114_SURAT.find(s => s.nomor === suratNomor);
    const surahConfigs = capaianBacaanConfigs
      .filter(c => c.suratNomor === suratNomor)
      .sort((a, b) => a.nomorAyat - b.nomorAyat);

    if (surahConfigs.length === 0) return;

    if (!confirm(`Rapikan nomor urut untuk Surah ${surahMeta?.nama || suratNomor}? Sebanyak ${surahConfigs.length} ayat yang ada akan diberi nomor urut 1 sampai ${surahConfigs.length} berurutan sesuai urutan saat ini.`)) {
      return;
    }

    const renumberedSurahConfigs = surahConfigs.map((c, idx) => ({
      ...c,
      nomorAyat: idx + 1
    }));

    const nextList = capaianBacaanConfigs.map(c => {
      if (c.suratNomor === suratNomor) {
        const found = renumberedSurahConfigs.find(rc => rc.id === c.id);
        return found || c;
      }
      return c;
    });

    await reorderCapaianBacaanConfigs(nextList);
    setReorderSuccessMsg(`Nomor urut Surah ${surahMeta?.nama} berhasil dirapikan berurutan (1-${surahConfigs.length}). Tersinkron ke Cloud!`);
    setTimeout(() => setReorderSuccessMsg(null), 3500);
  };

  // Buka Modal Susun Ulang Urutan Ayat
  const handleOpenReorderModal = (suratNomor: number) => {
    const list = capaianBacaanConfigs
      .filter(c => c.suratNomor === suratNomor)
      .sort((a, b) => a.nomorAyat - b.nomorAyat);
    setReorderSuratNomor(suratNomor);
    setReorderDraftList([...list]);
    setIsReorderModalOpen(true);
  };

  // Simpan Susunan dari Modal Susun Ulang
  const handleSaveReorderModal = async () => {
    const nextList = capaianBacaanConfigs.map(c => {
      if (c.suratNomor === reorderSuratNomor) {
        const found = reorderDraftList.find(d => d.id === c.id);
        return found || c;
      }
      return c;
    });

    await reorderCapaianBacaanConfigs(nextList);
    setIsReorderModalOpen(false);
    const surahMeta = DAFTAR_114_SURAT.find(s => s.nomor === reorderSuratNomor);
    setReorderSuccessMsg(`Susunan baru ayat Surah ${surahMeta?.nama} berhasil disimpan ke Cloud Database!`);
    setTimeout(() => setReorderSuccessMsg(null), 3500);
  };

  // Konfirmasi Muat Preset Bawaan (dengan pilihan cakupan)
  const handleConfirmLoadPreset = async () => {
    let targetNo: number | undefined = undefined;
    if (presetTargetOption === 'al_fatihah') targetNo = 1;
    else if (presetTargetOption === 'al_ikhlas') targetNo = 112;
    else if (presetTargetOption === 'surat_ini') {
      const activeNo = selectedTab2SuratNomor === 'all' ? selectedSuratNomor : selectedTab2SuratNomor;
      targetNo = (activeNo === 1 || activeNo === 112) ? activeNo : undefined;
    }
    await seedCapaianBacaanPresets(targetNo);
    setIsPresetModalOpen(false);
    const surahLabel = targetNo === 1 ? 'Surah Al-Fatihah (Ayat 1-7)' : targetNo === 112 ? 'Surah Al-Ikhlas (Ayat 1-4)' : 'Al-Fatihah & Al-Ikhlas';
    setReorderSuccessMsg(`Preset standar ${surahLabel} berhasil dimuat ke Cloud Database.`);
    setTimeout(() => setReorderSuccessMsg(null), 3500);
  };

  // Daftar nomor surat yang memiliki konfigurasi target capaian
  const configuredSurahNomors = useMemo(() => {
    return Array.from(new Set(capaianBacaanConfigs.map(c => c.suratNomor))).sort((a, b) => a - b);
  }, [capaianBacaanConfigs]);

  const activeTab2SurahNo = selectedTab2SuratNomor === 'all' ? selectedSuratNomor : selectedTab2SuratNomor;
  const activeTab2SurahMeta = DAFTAR_114_SURAT.find(s => s.nomor === activeTab2SurahNo) || DAFTAR_114_SURAT[0];

  // Daftar konfigurasi yang ditampilkan di Tab 2 sesuai filter surat & pencarian
  const displayedTab2Configs = useMemo(() => {
    let list = capaianBacaanConfigs;
    if (selectedTab2SuratNomor !== 'all') {
      list = list.filter(c => c.suratNomor === selectedTab2SuratNomor);
    }
    if (searchTab2Query.trim()) {
      const q = searchTab2Query.toLowerCase().trim();
      list = list.filter(c => 
        c.suratNama.toLowerCase().includes(q) ||
        String(c.nomorAyat).includes(q) ||
        (c.teksArab && c.teksArab.includes(q)) ||
        (c.keterangan && c.keterangan.toLowerCase().includes(q)) ||
        c.targets.some(t => t.target.toLowerCase().includes(q) || t.unsur.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      if (a.suratNomor !== b.suratNomor) return a.suratNomor - b.suratNomor;
      return a.nomorAyat - b.nomorAyat;
    });
  }, [capaianBacaanConfigs, selectedTab2SuratNomor, searchTab2Query]);

  // Quick Print View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left w-full max-w-full overflow-x-hidden">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full max-w-full">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-300">
              Instrumen Capaian Bacaan Ayat
            </h2>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-slate-700 shadow-2xs inline-flex items-center gap-1.5 max-w-full" title="Font disinkronkan langsung dari Kurikulum & Modul > Modul Pembelajaran > Al-Quran">
              <span className="shrink-0">Font Mushaf:</span>
              <strong className="text-emerald-950 dark:text-emerald-200 font-black truncate max-w-[150px] sm:max-w-xs">
                {typography?.customFont ? (typography.customFont.fileName || 'Custom Malik Fahd') : (typography?.selectedFontPreset || 'Amiri Quran')}
              </strong>
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Pencatatan rekam jejak capaian kualitas talaqqi santri per lafaz dan per ayat (misal pelafalan lam sukun, dengung ba, pembedaan ha/kha, dll.) dari pertemuan ke pertemuan (P1, P2, P3...) secara independen.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Cetak Lembar Capaian</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher - Horizontal Scrollable Contained Pill Bar (Dipertahankan Horizontal dari Kiri ke Kanan) */}
      <div className="relative w-full max-w-full pb-1">
        <div className="w-full bg-slate-100/80 dark:bg-slate-900/70 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            {/* Tombol Geser Kiri (Navigasi cepat di layar HP) */}
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              title="Geser Tab ke Kiri"
              aria-label="Geser Tab ke Kiri"
              className="flex sm:hidden p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Horizontal scroll container with contained padding */}
            <div 
              ref={tabsScrollRef}
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap touch-pan-x px-1 py-0.5 flex-1"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  setActiveTab('matriks');
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                }}
                className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'matriks'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">Matriks Capaian Santri</span>
                <span className="inline sm:hidden">Matriks Capaian</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    setActiveTab('master_target');
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                  }}
                  className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'master_target'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline">Master Target Ayat</span>
                  <span className="inline sm:hidden">Master Target</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'master_target' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {capaianBacaanConfigs.length}
                  </span>
                </button>
              )}

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    setActiveTab('elemen_settings');
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                  }}
                  className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'elemen_settings'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline">Elemen Pembelajaran</span>
                  <span className="inline sm:hidden">Elemen</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'elemen_settings' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {validSelectedElemenIds.length}
                  </span>
                </button>
              )}


            </div>

            {/* Tombol Geser Kanan (Navigasi cepat di layar HP) */}
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              title="Geser Tab ke Kanan"
              aria-label="Geser Tab ke Kanan"
              className="flex sm:hidden p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs shrink-0 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Petunjuk indikator geser horizontal pada perangkat HP */}
        <div className="flex items-center justify-between pt-1 px-1.5 text-[10px] text-slate-400 dark:text-slate-500 sm:hidden">
          <span className="flex items-center gap-1 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tab tersusun horizontal (geser kiri / kanan) ➔
          </span>
        </div>
      </div>

      {/* ========================================================
          TAB 1: MATRIKS CAPAIAN SANTRI (SESUAI SCREENSHOT USER)
         ======================================================== */}
      {activeTab === 'matriks' && (
        <div className="space-y-4">
          {/* Banner Informasi Elemen Pembelajaran Capaian Bacaan */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Elemen Pembelajaran Capaian:
                  </span>
                  {selectedElemenList.length === 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-full">
                      Belum Ditentukan
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      ({selectedElemenList.length} Elemen Terhubung)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  {selectedElemenList.length > 0 ? (
                    selectedElemenList.map((el) => (
                      <span
                        key={el.id}
                        className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-black text-emerald-850 dark:text-emerald-200 shadow-2xs flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{el.nama}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {isSuperAdmin ? 'Pilih elemen di tab "Elemen Pembelajaran"' : 'Belum ada elemen yang diaktifkan oleh admin'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Sesi jika admin memilih lebih dari 1 elemen */}
            {selectedElemenList.length > 1 && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <label className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                  Filter Sesi:
                </label>
                <select
                  value={selectedFilterElemenId}
                  onChange={(e) => setSelectedFilterElemenId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Elemen ({selectedElemenList.length})</option>
                  {selectedElemenList.map((el) => (
                    <option key={el.id} value={el.id}>{el.nama}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              {/* Filter Santri */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Pilih Santri / Siswa:</span>
                  {isGuru && currentHalaqahObj?.namaHalaqah && (
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Halaqah: {currentHalaqahObj.namaHalaqah}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={selectedSiswaId}
                    onChange={(e) => handleSelectSiswa(e.target.value)}
                    disabled={availableSiswas.length === 0}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {availableSiswas.length === 0 ? (
                      <option value="">-- Belum ada santri di halaqah ini --</option>
                    ) : (
                      availableSiswas.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.namaLengkap} {s.nis ? `(NIS: ${s.nis})` : ''} {!isGuru && s.halaqahNama ? `• ${s.halaqahNama}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Quick Pills: Surat pada Riwayat Santri */}
                {activeSiswa && studentSurahHistoryList.length > 0 && (
                  <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Surat Santri ({studentSurahHistoryList.length}):</span>
                    </span>
                    <div className="flex flex-wrap gap-1 items-center">
                      {studentSurahHistoryList.map(st => {
                        const isCurrent = st.nomor === selectedSuratNomor;
                        return (
                          <button
                            key={st.nomor}
                            type="button"
                            onClick={() => setSelectedSuratNomor(st.nomor)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                            }`}
                            title={`Buka Surah ${st.nama} (${st.setoranCount || st.sesiCount} sesi tercatat)`}
                          >
                            <span>{st.nama}</span>
                            <span className={`text-[9px] px-1 rounded-full ${isCurrent ? 'bg-white/25 text-white' : 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'}`}>
                              {st.setoranCount || st.sesiCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {activeSiswa && studentSurahHistoryList.length === 0 && (
                  <div className="pt-1 text-[10px] text-slate-400 italic">
                    Santri ini belum memiliki riwayat setoran di sistem.
                  </div>
                )}
              </div>

              {/* Filter Surat */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>Pilih Surat:</span>
                  </label>
                  {/* Mode Selector: Riwayat Santri | Wajib | Bertarget | Semua */}
                  <div className="flex items-center gap-1 text-[10px] flex-wrap">
                    {studentSurahHistoryList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSuratFilterMode('santri')}
                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition flex items-center gap-1 ${
                          suratFilterMode === 'santri'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                        }`}
                        title="Hanya surat yang ada di riwayat setoran santri ini"
                      >
                        <span>★ Riwayat Santri ({studentSurahHistoryList.length})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSuratFilterMode('wajib')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                        suratFilterMode === 'wajib'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                      title="Surat Wajib / Inti Halaqah & Juz 'Amma"
                    >
                      Wajib
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuratFilterMode('target')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                        suratFilterMode === 'target'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                      title="Hanya surat yang memiliki standar target bacaan"
                    >
                      Bertarget
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuratFilterMode('semua')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                        suratFilterMode === 'semua'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                      title="Semua 114 Surat Al-Qur'an"
                    >
                      Semua (114)
                    </button>
                  </div>
                </div>

                <select
                  value={selectedSuratNomor}
                  onChange={(e) => setSelectedSuratNomor(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {filteredSuratList.map((s) => {
                    const hasConfig = capaianBacaanConfigs.some(c => c.suratNomor === s.nomor);
                    const isWajib = SURAT_WAJIB_NOMORS.includes(s.nomor);
                    const studentRec = studentSurahHistoryList.find(st => st.nomor === s.nomor);
                    const sesiNum = studentRec ? (studentRec.sesiCount || studentRec.setoranCount) : 0;
                    return (
                      <option key={s.nomor} value={s.nomor}>
                        {s.nomor}. {s.nama} ({s.namaArab}) - {s.jumlahAyat} Ayat
                        {studentRec ? ` [✓ Ada Riwayat Santri: ${sesiNum} Sesi]` : ''}
                        {hasConfig && !studentRec ? ' ★ (Ada Target Standar)' : ''}
                        {isWajib && suratFilterMode === 'semua' ? ' • Wajib' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Table Container - Exact Match to Screenshot */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 print:p-0 print:border-none print:shadow-none">
            {/* Header Document */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>a. Surah {activeSurat.nama}</span>
                  <span className="font-mushaf font-serif text-2xl font-normal text-emerald-800 dark:text-emerald-300" dir="rtl">
                    ({activeSurat.namaArab})
                  </span>
                  {studentSurahHistoryList.some(s => s.nomor === activeSurat.nomor) ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Ada Riwayat Setoran Santri</span>
                    </span>
                  ) : otherElemenSetoransForSurat.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                      <span>Bukan Elemen Pilihan Admin ({otherElemenNamesText})</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Belum Ada Setoran Santri
                    </span>
                  )}
                </h3>
                {activeSiswa ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Santri: <strong className="text-slate-800 dark:text-slate-200">{activeSiswa.namaLengkap}</strong> {activeSiswa.nis ? `(NIS: ${activeSiswa.nis})` : ''} • Halaqah: <strong>{activeSiswa.halaqahNama || currentHalaqahObj?.namaHalaqah || '-'}</strong>
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                    Belum ada santri yang dipilih atau terdaftar di halaqah ini.
                  </p>
                )}
              </div>

              {distinctSessionColumns.length > 0 && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  Total Tercatat: <strong>{distinctSessionColumns.length} Pertemuan</strong>
                </div>
              )}
            </div>

            {/* Contextual Notice: Jika santri belum ada setoran sama sekali di surah ini (dan bukan karena mismatch elemen) */}
            {activeSiswa && !studentSurahHistoryList.some(s => s.nomor === activeSurat.nomor) && otherElemenSetoransForSurat.length === 0 && (
              <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Santri <strong>{activeSiswa.namaLengkap}</strong> belum memiliki riwayat setoran untuk <strong>Surah {activeSurat.nama}</strong>.
                  </span>
                </div>
                {studentSurahHistoryList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSuratNomor(studentSurahHistoryList[0].nomor)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <span>Buka Surah {studentSurahHistoryList[0].nama} ({studentSurahHistoryList[0].setoranCount || studentSurahHistoryList[0].sesiCount} Sesi)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {!activeSiswa ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum Ada Santri di Halaqah Ini
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Kelompok halaqah ini belum memiliki santri aktif. Silakan pilih kelompok halaqah lain atau tambahkan data santri terlebih dahulu.
                </p>
              </div>
            ) : otherElemenSetoransForSurat.length > 0 && sessionsForStudentAndSurah.length === 0 ? (
              // KETIKA ELEMEN BUKAN YANG DIPILIH OLEH ADMIN:
              // SURAH INI TIDAK DITAMPILKAN KARENA ELEMENNYA BUKAN YANG DIPILIH OLEH ADMIN
              <div className="text-center py-12 px-6 border-2 border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto shadow-xs border border-amber-200 dark:border-amber-800">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div className="max-w-xl mx-auto space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200">
                    Elemen Pembelajaran Tidak Sesuai Pilihan Admin
                  </span>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Surah {activeSurat.nama} ({activeSurat.namaArab}) Tidak Ditampilkan
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Siswa/santri <strong>{activeSiswa.namaLengkap}</strong> menyetorkan Surah {activeSurat.nama} pada elemen{' '}
                    <strong className="text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                      {otherElemenNamesText}
                    </strong>
                    , sedangkan elemen pembelajaran yang diaktifkan oleh admin pada menu{' '}
                    <em>Mutabaah &gt; Capaian Bacaan Ayat &gt; Elemen Pembelajaran</em> adalah{' '}
                    <strong className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                      {activeElemenNamesText}
                    </strong>.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sesuai kebijakan kurikulum, capaian bacaan ayat hanya memetakan riwayat yang elemennya telah dipilih dan disahkan oleh admin.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {studentSurahHistoryList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedSuratNomor(studentSurahHistoryList[0].nomor)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Buka Surah {studentSurahHistoryList[0].nama} (Sesuai Elemen Admin)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('elemen_settings')}
                      className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-2"
                    >
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Kelola Elemen Pembelajaran</span>
                    </button>
                  )}
                </div>
              </div>
            ) : configsForSurah.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum Ada Standar Target Ayat untuk Surah {activeSurat.nama}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Anda dapat menambahkan target indikator pelafalan huruf per ayat, atau muat preset bawaan untuk Surah Al-Fatihah.
                </p>
                {activeSurat.nomor === 1 && (
                  <button
                    type="button"
                    onClick={() => seedCapaianBacaanPresets(1)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Muat Preset Lengkap Surah Al-Fatihah (Ayat 1-7)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-emerald-900/40 dark:border-emerald-800/60">
                <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                  {/* Table Headers matching the exact green table in the screenshot */}
                  <thead>
                    <tr className="bg-[#a3cb98] dark:bg-emerald-900 text-slate-900 dark:text-white font-bold border-b border-emerald-900/40">
                      <th className="py-2.5 px-3 border-r border-emerald-900/30 text-center w-12 font-bold">
                        No
                      </th>
                      <th className="py-2.5 px-4 border-r border-emerald-900/30 text-center w-36 font-bold">
                        Lafaz (Perkata)
                      </th>
                      <th className="py-2.5 px-4 border-r border-emerald-900/30 font-bold">
                        Target Capaian &amp; Pemetaan Tajwid
                      </th>
                      <th 
                        colSpan={Math.max(distinctSessionColumns.length, 5)} 
                        className="py-1 px-2 text-center border-b border-emerald-900/30 font-bold"
                      >
                        Status Capaian
                      </th>
                    </tr>
                    <tr className="bg-[#b7d7ae] dark:bg-emerald-950 text-slate-900 dark:text-emerald-200 text-[11px] font-bold border-b border-emerald-900/40">
                      <th colSpan={3} className="border-r border-emerald-900/30"></th>
                      {/* Render P1, P2, P3, P4, P5... columns */}
                      {Array.from({ length: Math.max(distinctSessionColumns.length, 5) }).map((_, idx) => {
                        const colSesi = distinctSessionColumns[idx];
                        const labelSesi = colSesi ? colSesi.namaSesi : `P${idx + 1}`;
                        return (
                          <th 
                            key={idx} 
                            className="py-1.5 px-2 text-center border-r border-emerald-900/30 last:border-r-0 min-w-[50px] cursor-default"
                            title={colSesi?.sample ? `${colSesi.sample.namaSesi} • Elemen: ${colSesi.sample.elemenNama || '-'} • Tanggal: ${colSesi.sample.tanggal} • Guru: ${colSesi.sample.guruNama}` : `Pertemuan ${idx + 1}`}
                          >
                            <span className="truncate block font-mono font-bold text-xs">{labelSesi}</span>
                            {colSesi?.sample?.elemenNama && (
                              <span className="text-[8px] font-bold text-emerald-950 dark:text-emerald-100 block truncate max-w-[55px] mx-auto opacity-75">
                                {colSesi.sample.elemenNama}
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {configsForSurah.map((cfg, cfgIdx) => {
                      return (
                        <React.Fragment key={cfg.id}>
                          {cfg.targets.map((tgt, tgtIdx) => {
                            const isFirstTarget = tgtIdx === 0;
                            return (
                              <tr 
                                key={tgt.id}
                                className={`border-b border-slate-200 dark:border-slate-800 hover:bg-emerald-50/30 dark:hover:bg-slate-800/40 transition ${
                                  tgtIdx === cfg.targets.length - 1 ? 'border-b-2 border-slate-300 dark:border-slate-700' : ''
                                }`}
                              >
                                {/* Column No (Spans across all targets of this Ayah) */}
                                {isFirstTarget && (
                                  <td 
                                    rowSpan={cfg.targets.length} 
                                    className="py-3 px-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-700 dark:text-slate-300 align-middle bg-slate-50/50 dark:bg-slate-900/50"
                                  >
                                    {cfg.nomorAyat}
                                  </td>
                                )}

                                {/* Column Lafaz Perkata */}
                                <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 text-center align-middle bg-slate-50/30 dark:bg-slate-900/30">
                                  <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-white dark:bg-slate-950 shadow-2xs w-full max-w-[140px] mx-auto">
                                    <p className="font-mushaf font-serif text-2xl font-normal leading-normal text-slate-900 dark:text-emerald-100 select-text" dir="rtl">
                                      {formatArabicFontClean(tgt.kataLafaz || cfg.teksArab)}
                                    </p>
                                  </div>
                                </td>

                                {/* Column Target (Unsur : Uraian Target & Pemetaan Tajwid) */}
                                <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-start gap-2">
                                      <span className="font-bold text-emerald-800 dark:text-emerald-300 shrink-0 text-xs w-16">
                                        {renderArabicEnhancedText(tgt.unsur)} :
                                      </span>
                                      <span className="text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                                        {renderArabicEnhancedText(tgt.target)}
                                      </span>
                                    </div>
                                    {(tgt.subKategoriKesalahanNama || tgt.kategoriKesalahanNama) && (
                                      <div className="flex items-center gap-1.5 pl-0 sm:pl-[72px] flex-wrap">
                                        <span 
                                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 shadow-2xs"
                                          title={`Pemetaan Tajwid: ${tgt.subKategoriKesalahanNama || ''} [${tgt.kategoriKesalahanNama || ''}]`}
                                        >
                                          <span>{renderArabicEnhancedText(tgt.subKategoriKesalahanNama || tgt.kategoriKesalahanNama)}</span>
                                          {tgt.kategoriKesalahanNama && tgt.subKategoriKesalahanNama && (
                                            <span className="opacity-75 font-normal">[{tgt.kategoriKesalahanNama}]</span>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Column Status Capaian P1, P2, P3, P4, P5... */}
                                {Array.from({ length: Math.max(distinctSessionColumns.length, 5) }).map((_, colIdx) => {
                                  const colSesi = distinctSessionColumns[colIdx];
                                  if (!colSesi) {
                                    return (
                                      <td 
                                        key={colIdx} 
                                        className="py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 bg-slate-50/20 dark:bg-slate-950/20"
                                      >
                                        <span className="text-slate-300 dark:text-slate-700">-</span>
                                      </td>
                                    );
                                  }

                                  // Find if there is a session record for this specific student, ayah, and session number
                                  const sesiRecord = sessionsForStudentAndSurah.find(
                                    s => s.nomorAyat === cfg.nomorAyat && s.sesiKe === colSesi.sesiKe
                                  );

                                  const hasErrorRecord = sesiRecord?.catatanTarget?.[tgt.id] === true;
                                  const isTested = sesiRecord !== undefined;

                                  return (
                                    <td 
                                      key={colIdx} 
                                      className="py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 cursor-default"
                                      title={
                                        isTested 
                                          ? hasErrorRecord 
                                            ? `Ada Catatan Koreksi pada ${colSesi.namaSesi} (${sesiRecord.tanggal}). Untuk mengubah atau mengoreksi, buka menu Riwayat Setoran.` 
                                            : `Bersih / Lulus Target pada ${colSesi.namaSesi} (${sesiRecord.tanggal})`
                                          : `Belum disetorkan di ${colSesi.namaSesi}`
                                      }
                                    >
                                      {isTested ? (
                                        hasErrorRecord ? (
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-black text-xs shadow-xs" title="Ada Catatan Kesalahan">
                                            ✗
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-black text-xs shadow-xs" title="Tercapai / Bersih">
                                            ✓
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legend / Keterangan Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-300">Keterangan:</span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">✓</span>
                  <span>Target Bersih / Tercapai</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px]">✗</span>
                  <span>Terdapat Catatan Kesalahan</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">-</span>
                  <span>Belum Diujikan / Disetorkan</span>
                </span>
              </div>

              <div className="text-[10px] italic text-slate-400">
                Klik pada kolom atau sel pertemuan (P1, P2...) untuk melihat/mengedit catatan capaian.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: MASTER TARGET AYAT (KONFIGURASI INDIKATOR BAKU)
         ======================================================== */}
      {isAdmin && activeTab === 'master_target' && (
        <div className="space-y-4 animate-fade-in">
          {/* Toast Notification */}
          {reorderSuccessMsg && (
            <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                <span>{reorderSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setReorderSuccessMsg(null)}
                className="text-emerald-100 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Top Master Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Daftar Standar Target Capaian per Surat & Ayat
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>Real-Time Cloud Synced ({capaianBacaanConfigs.length} Ayat)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kelola indikator hukum tajwid standar dan susun ulang urutan ayat Al-Qur'an secara fleksibel tanpa takut kehilangan data.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
              <button
                type="button"
                onClick={handleManualCloudSync}
                disabled={isCloudSyncing}
                title="Sinkronkan susunan target ayat saat ini ke Cloud Firestore agar tampil persis sama di semua PC & akun guru"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border ${
                  cloudSyncSuccess
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-emerald-600' : cloudSyncSuccess ? 'text-white' : 'text-slate-500'}`} />
                <span>{cloudSyncSuccess ? 'Tersinkronkan!' : isCloudSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const activeNo = selectedTab2SuratNomor === 'all' ? selectedSuratNomor : selectedTab2SuratNomor;
                  if (activeNo === 1) setPresetTargetOption('al_fatihah');
                  else if (activeNo === 112) setPresetTargetOption('al_ikhlas');
                  else setPresetTargetOption('semua');
                  setIsPresetModalOpen(true);
                }}
                className="px-3 py-2 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Buka opsi pemuatan preset bawaan per-surat atau lengkap"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Muat Preset Bawaan...</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetSuratNo = selectedTab2SuratNomor === 'all' ? selectedSuratNomor : selectedTab2SuratNomor;
                  const existingForThis = capaianBacaanConfigs.filter(c => c.suratNomor === targetSuratNo);
                  const nextNomor = existingForThis.length > 0 ? Math.max(...existingForThis.map(c => c.nomorAyat)) + 1 : 1;
                  setEditingConfigId(null);
                  setConfigSuratNomor(targetSuratNo);
                  setConfigNomorAyat(nextNomor);
                  setConfigTeksArab('');
                  setConfigTargets([
                    { id: `t-${Date.now()}-1`, unsur: 'ل (lam)', target: 'Tidak memantulkan huruf lam (ل) sukun.' }
                  ]);
                  setConfigKeterangan('');
                  setIsConfigModalOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Target Ayat Baru</span>
              </button>
            </div>
          </div>

          {/* Surah Filter & Search Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Surah Pills / Filter */}
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
                  <span>Pilih Surat:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedTab2SuratNomor('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    selectedTab2SuratNomor === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Semua Surat ({capaianBacaanConfigs.length})
                </button>

                {configuredSurahNomors.map((sNo) => {
                  const sMeta = DAFTAR_114_SURAT.find(s => s.nomor === sNo);
                  const countForSurat = capaianBacaanConfigs.filter(c => c.suratNomor === sNo).length;
                  const isSelected = selectedTab2SuratNomor === sNo;
                  return (
                    <button
                      key={sNo}
                      type="button"
                      onClick={() => setSelectedTab2SuratNomor(sNo)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{sMeta?.nama || `Surat ${sNo}`}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {countForSurat}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Surah Dropdown selector for all 114 Surahs */}
              <div className="w-full sm:w-auto flex items-center gap-2">
                <select
                  value={selectedTab2SuratNomor}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTab2SuratNomor(val === 'all' ? 'all' : Number(val));
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 cursor-pointer w-full sm:w-56"
                >
                  <option value="all">-- Tampilkan Semua Surat ({capaianBacaanConfigs.length} Ayat) --</option>
                  {DAFTAR_114_SURAT.map((s) => {
                    const count = capaianBacaanConfigs.filter(c => c.suratNomor === s.nomor).length;
                    return (
                      <option key={s.nomor} value={s.nomor}>
                        {s.nomor}. {s.nama} ({s.namaArab}) {count > 0 ? `• [${count} Target]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Sub-bar: Search and Active Surah Tools */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Search Box */}
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari lafaz ayat, hukum, kata..."
                  value={searchTab2Query}
                  onChange={(e) => setSearchTab2Query(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              {/* Tools khusus untuk Surah yang sedang dipilih */}
              {selectedTab2SuratNomor !== 'all' && (
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden md:inline">
                    Surah {activeTab2SurahMeta.nama} ({displayedTab2Configs.length} Ayat):
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenReorderModal(activeTab2SurahNo)}
                    disabled={displayedTab2Configs.length === 0}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                    title="Buka panel penyusunan urutan dan penomoran ayat"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Susun Ulang Urutan Ayat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAutoRenumberSequential(activeTab2SurahNo)}
                    disabled={displayedTab2Configs.length === 0}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                    title="Nomori ulang ayat secara berurutan (1, 2, 3...) sesuai urutan saat ini"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rapikan Nomor Urut (1, 2, 3...)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* List of configured surah ayat */}
          {displayedTab2Configs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {selectedTab2SuratNomor === 'all'
                    ? 'Belum Ada Standar Target Ayat yang Dikonfigurasi'
                    : `Belum Ada Target Ayat untuk Surah ${activeTab2SurahMeta.nama}`}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  {selectedTab2SuratNomor === 'all'
                    ? 'Tambahkan butir target capaian ayat baru atau muat preset bawaan untuk memulai.'
                    : `Surah ${activeTab2SurahMeta.nama} belum memiliki target indikator. Anda dapat menyusun ayat baru secara manual atau memuat preset bawaan jika tersedia.`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const targetSuratNo = selectedTab2SuratNomor === 'all' ? 1 : selectedTab2SuratNomor;
                    setEditingConfigId(null);
                    setConfigSuratNomor(targetSuratNo);
                    setConfigNomorAyat(1);
                    setConfigTeksArab('');
                    setConfigTargets([
                      { id: `t-${Date.now()}-1`, unsur: 'ل (lam)', target: 'Tidak memantulkan huruf lam (ل) sukun.' }
                    ]);
                    setConfigKeterangan('');
                    setIsConfigModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Target Ayat Baru</span>
                </button>

                {(selectedTab2SuratNomor === 1 || selectedTab2SuratNomor === 112 || selectedTab2SuratNomor === 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTab2SuratNomor === 1) setPresetTargetOption('al_fatihah');
                      else if (selectedTab2SuratNomor === 112) setPresetTargetOption('al_ikhlas');
                      else setPresetTargetOption('semua');
                      setIsPresetModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Muat Preset Standar Bawaan</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedTab2Configs.map((cfg) => (
                <div 
                  key={cfg.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                        {cfg.nomorAyat}
                      </span>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          Surah {cfg.suratNama} : Ayat {cfg.nomorAyat}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Surat Ke-{cfg.suratNomor}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Geser Naik */}
                      <button
                        type="button"
                        onClick={() => handleShiftAyatOrder(cfg, 'up')}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Geser urutan ayat ke atas (tukar dengan ayat sebelumnya)"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Geser Turun */}
                      <button
                        type="button"
                        onClick={() => handleShiftAyatOrder(cfg, 'down')}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Geser urutan ayat ke bawah (tukar dengan ayat berikutnya)"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Target */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingConfigId(cfg.id);
                          setConfigSuratNomor(cfg.suratNomor);
                          setConfigNomorAyat(cfg.nomorAyat);
                          setConfigTeksArab(cfg.teksArab);
                          setConfigTargets([...cfg.targets]);
                          setConfigKeterangan(cfg.keterangan || '');
                          setIsConfigModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Target Ayat & Nomor Ayat"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Hapus Target */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus standar target Surah ${cfg.suratNama} Ayat ${cfg.nomorAyat}?`)) {
                            deleteCapaianBacaanConfig(cfg.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Hapus Target Ayat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Arab text */}
                  <div className="text-right select-text pt-1">
                    <div className="inline-flex flex-row-reverse items-center justify-center gap-2.5 border rounded-xl p-3 px-4 shadow-xs transition duration-150 border-emerald-100 bg-white dark:border-slate-850 dark:bg-slate-950/20 w-full">
                      <p className="font-mushaf font-serif text-3xl font-normal leading-loose tracking-wide text-slate-900 dark:text-white" dir="rtl">
                        {formatArabicFontClean(cfg.teksArab)}
                      </p>
                      <span 
                        className="font-mushaf font-serif text-3xl font-normal text-emerald-600 dark:text-emerald-400 select-none cursor-pointer inline-flex items-center justify-center px-1 shrink-0"
                        title={`Nomor Ayat ${cfg.nomorAyat}`}
                      >
                        {convertToArabicNumerals(cfg.nomorAyat)}
                      </span>
                    </div>
                  </div>

                  {/* Target checklist items dengan pemetaan Kategori & Sub Kategori Kesalahan */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Butir Target Capaian ({cfg.targets.length}):
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        Pemetaan Kategori Tajwid
                      </span>
                    </div>
                    {cfg.targets.map((tgt, i) => (
                      <div 
                        key={tgt.id || i} 
                        className="text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          {tgt.kataLafaz && (
                            <span className="font-mushaf font-serif text-lg font-normal text-emerald-950 dark:text-emerald-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shrink-0" dir="rtl">
                              {tgt.kataLafaz}
                            </span>
                          )}
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 font-mono text-[11.5px] min-w-[58px]">
                            {tgt.unsur} :
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 text-[11.5px] leading-relaxed">
                            {tgt.target}
                          </span>
                        </div>

                        {/* Display Kategori / Sub Kategori Kesalahan Tajwid */}
                        <div className="shrink-0 flex items-center gap-1.5 self-start sm:self-center pl-7 sm:pl-0">
                          {tgt.subKategoriKesalahanNama || tgt.kategoriKesalahanNama ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {tgt.subKategoriKesalahanNama && (
                                <span 
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 shadow-2xs"
                                  title={`Sub Kategori: ${tgt.subKategoriKesalahanNama}`}
                                >
                                  {tgt.subKategoriKesalahanNama}
                                </span>
                              )}
                              {tgt.kategoriKesalahanNama && (
                                <span 
                                  className="text-[10px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700"
                                  title={`Kategori: ${tgt.kategoriKesalahanNama}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  <span>{tgt.kategoriKesalahanNama}</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic bg-slate-100 dark:bg-slate-700/40 px-2 py-0.5 rounded-md">
                              Belum dipetakan
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: PENETAPAN ELEMEN PEMBELAJARAN
         ======================================================== */}
      {activeTab === 'elemen_settings' && isSuperAdmin && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>Penetapan Elemen Pembelajaran untuk Capaian Bacaan Ayat</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    {validSelectedElemenIds.length} dari {elemenSettings.length} Elemen Terpilih
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Pilih elemen pembelajaran (bersumber dari tab <em>Konfigurasi Elemen &amp; jenis setoran</em>) yang berhak menggunakan instrumen capaian bacaan ayat ini. Misalnya elemen <strong>Qiraah Tambahan</strong>, <strong>Qiroah</strong>, atau <strong>Tilawah</strong>. Anda dapat memilih lebih dari satu elemen.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = elemenSettings.map(e => e.id);
                    const allNames = elemenSettings.map(e => e.nama);
                    const allItems = elemenSettings.map(e => ({ id: e.id, nama: e.nama }));
                    updateCapaianBacaanTrialSettings({
                      enabledElemenIds: allIds,
                      enabledElemenNames: allNames,
                      selectedElemenItems: allItems
                    });
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Pilih Semua Elemen ({elemenSettings.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bacaanElems = elemenSettings
                      .filter(e => e.kompetensi === 'Bacaan' || e.nama.toLowerCase().includes('qir') || e.nama.toLowerCase().includes('baca'));
                    const targetElems = bacaanElems.length > 0 ? bacaanElems : elemenSettings.slice(0, 1);
                    updateCapaianBacaanTrialSettings({
                      enabledElemenIds: targetElems.map(e => e.id),
                      enabledElemenNames: targetElems.map(e => e.nama),
                      selectedElemenItems: targetElems.map(e => ({ id: e.id, nama: e.nama }))
                    });
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
                  title="Pilih otomatis elemen bertipe bacaan/qiroah"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hanya Elemen Bacaan / Qiroah</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCapaianBacaanTrialSettings({
                      enabledElemenIds: [],
                      enabledElemenNames: [],
                      selectedElemenItems: []
                    });
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-rose-200 dark:border-rose-800"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Kosongkan</span>
                </button>
              </div>
            </div>

            {/* Petunjuk Penggunaan */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                <p className="font-bold">
                  Keterangan Hubungan Elemen &amp; Capaian Bacaan Ayat
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                  Fitur ini memastikan instrumen Capaian Bacaan Ayat <strong>hanya diperuntukkan bagi elemen yang Anda tentukan</strong> di sini. Saat ustadz pembimbing mencatat capaian talaqqi santri per pertemuan (P1, P2, P3...), sesi setoran akan ditandai dengan elemen yang dipilih. Anda dapat menambah atau mengubah master nama elemen baru kapan saja di tab <strong>Konfigurasi Elemen &amp; jenis setoran</strong>.
                </p>
              </div>
            </div>

            {/* Elemen Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {elemenSettings.map((elem) => {
                const isSelected = selectedElemenList.some(e => e.id === elem.id || normLatin(e.nama) === normLatin(elem.nama));
                return (
                  <div
                    key={elem.id}
                    onClick={() => {
                      const nextList = isSelected
                        ? selectedElemenList.filter(e => e.id !== elem.id && normLatin(e.nama) !== normLatin(elem.nama))
                        : [...selectedElemenList, elem];
                      const nextIds = nextList.map(e => e.id);
                      const nextNames = nextList.map(e => e.nama);
                      const nextItems = nextList.map(e => ({ id: e.id, nama: e.nama }));
                      updateCapaianBacaanTrialSettings({
                        enabledElemenIds: nextIds,
                        enabledElemenNames: nextNames,
                        selectedElemenItems: nextItems
                      });
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-black block text-slate-900 dark:text-slate-100">
                            {elem.nama}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {elem.id}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          elem.tipeModul === TipeModul.AL_QURAN
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300'
                        }`}>
                          {elem.tipeModul === TipeModul.AL_QURAN ? 'Al-Qur\'an' : 'Selain Al-Qur\'an'}
                        </span>
                        {elem.kompetensi && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {elem.kompetensi}
                          </span>
                        )}
                      </div>

                      {/* Jenis Setoran */}
                      {elem.jenisSetoranList && elem.jenisSetoranList.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                            Sub-Jenis Setoran:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {elem.jenisSetoranList.map((js, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded text-[9px] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
                              >
                                {js}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {isSelected ? '✓ Aktif untuk Capaian Bacaan' : 'Tidak Digunakan'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {elemenSettings.length === 0 && (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada elemen pembelajaran di sistem. Buka tab Konfigurasi Elemen &amp; jenis setoran untuk menambahkan elemen.
                </p>
              </div>
            )}
          </div>
        </div>
      )}



      {/* ========================================================
          MODAL: TAMBAH / EDIT STANDAR TARGET AYAT
         ======================================================== */}
      {isConfigModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {editingConfigId ? 'Edit Standar Target Ayat' : 'Tambah Standar Target Ayat Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Surat</label>
                  <select
                    value={configSuratNomor}
                    onChange={(e) => {
                      const nextSurat = Number(e.target.value);
                      setConfigSuratNomor(nextSurat);
                      if (!editingConfigId) {
                        const txt = getAyatTextFromModul(nextSurat, configNomorAyat);
                        if (txt) setConfigTeksArab(txt);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold mt-1"
                  >
                    {DAFTAR_114_SURAT.map((s) => (
                      <option key={s.nomor} value={s.nomor}>
                        {s.nomor}. {s.nama} ({s.jumlahAyat} Ayat)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Ayat</label>
                  <input
                    type="number"
                    min="1"
                    max="286"
                    value={configNomorAyat}
                    onChange={(e) => {
                      const nextAyat = Number(e.target.value);
                      setConfigNomorAyat(nextAyat);
                      if (!editingConfigId) {
                        const txt = getAyatTextFromModul(configSuratNomor, nextAyat);
                        if (txt) setConfigTeksArab(txt);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold mt-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Teks Arab Ayat (Lafaz &amp; Tanda Waqaf)
                  </label>
                  {(() => {
                    const modulAyatText = getAyatTextFromModul(configSuratNomor, configNomorAyat);
                    if (modulAyatText && modulAyatText !== configTeksArab) {
                      return (
                        <button
                          type="button"
                          onClick={() => setConfigTeksArab(modulAyatText)}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800"
                          title="Tarik teks arab lengkap dengan harakat dan tanda waqaf dari Modul Pembelajaran Al-Qur'an"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Ambil dari Modul Al-Qur'an</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={configTeksArab}
                  onChange={(e) => setConfigTeksArab(e.target.value)}
                  placeholder="الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-2xl font-mushaf font-serif font-normal text-right mt-1 leading-loose focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />

                {configTeksArab.trim() && (
                  <div className="mt-2 text-right select-text">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Pratinjau Font Mushaf ({typography?.customFont ? (typography.customFont.fileName || 'Custom Malik Fahd') : (typography?.selectedFontPreset || 'Amiri Quran')}):
                    </span>
                    <div className="inline-flex flex-row-reverse items-center justify-center gap-2.5 border rounded-xl p-3 px-4 shadow-xs transition duration-150 border-emerald-100 bg-white dark:border-slate-850 dark:bg-slate-950/20 w-full">
                      <p className="font-mushaf font-serif text-3xl font-normal leading-loose tracking-wide text-slate-900 dark:text-white" dir="rtl">
                        {formatArabicFontClean(configTeksArab)}
                      </p>
                      <span className="font-mushaf font-serif text-3xl font-normal text-emerald-600 dark:text-emerald-400 select-none cursor-pointer inline-flex items-center justify-center px-1 shrink-0">
                        {convertToArabicNumerals(Number(configNomorAyat) || 1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Target items list */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Butir Target Pelafalan &amp; Pemetaan Kesalahan ({configTargets.length}):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setConfigTargets(prev => [
                        ...prev,
                        { id: `t-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, unsur: '', target: '', kategoriKesalahanNama: '', subKategoriKesalahanNama: '' }
                      ]);
                    }}
                    className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    + Tambah Butir
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {configTargets.map((tgt, idx) => {
                    const selectedCat = tajwidCategories.find(c => c.nama === tgt.kategoriKesalahanNama || c.id === tgt.kategoriKesalahanId);
                    const subList = selectedCat?.subcategories || [];
                    const wordsInAyat = configTeksArab.trim().split(/\s+/).filter(Boolean);

                    return (
                      <div key={tgt.id || idx} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        {/* Lafaz Kata (Perkata) - Selection from verse + input */}
                        <div className="space-y-1 bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                          <div className="flex items-center justify-between">
                            <label className="text-[9.5px] font-bold text-emerald-800 dark:text-emerald-400 uppercase flex items-center gap-1">
                              <span>Lafaz Kata (Perkata):</span>
                            </label>
                            {tgt.kataLafaz && (
                              <span className="font-mushaf font-serif text-lg text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700" dir="rtl">
                                {tgt.kataLafaz}
                              </span>
                            )}
                          </div>

                          {wordsInAyat.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[9px] text-slate-400">Pilih dari ayat:</span>
                              {wordsInAyat.map((w, wIdx) => {
                                const isSelected = tgt.kataLafaz === w;
                                return (
                                  <button
                                    key={wIdx}
                                    type="button"
                                    onClick={() => {
                                      setConfigTargets(prev => prev.map((item, i) => i === idx ? {
                                        ...item,
                                        kataLafaz: w,
                                        kataUrut: wIdx + 1
                                      } : item));
                                    }}
                                    className={`font-mushaf font-serif text-sm px-2 py-0.5 rounded-md border transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-bold'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                                    }`}
                                    dir="rtl"
                                  >
                                    {w}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <input
                            type="text"
                            placeholder="Atau ketik lafaz kata Arab (misal: بِسْمِ)"
                            dir="rtl"
                            value={tgt.kataLafaz || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfigTargets(prev => prev.map((item, i) => i === idx ? { ...item, kataLafaz: val } : item));
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-base font-mushaf font-serif text-right text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Huruf / Unsur (misal: س (sin))"
                            value={tgt.unsur}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfigTargets(prev => prev.map((item, i) => i === idx ? { ...item, unsur: val } : item));
                            }}
                            className="w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold shrink-0"
                          />
                          <input
                            type="text"
                            placeholder="Uraian target capaian (misal: Tidak memantulkan huruf sin sukun)"
                            value={tgt.target}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfigTargets(prev => prev.map((item, i) => i === idx ? { ...item, target: val } : item));
                            }}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setConfigTargets(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                            title="Hapus butir target"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Hubungkan dengan Kategori / Sub Kategori Kesalahan Tajwid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/70 text-left">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                              Kategori Kesalahan:
                            </label>
                            <select
                              value={tgt.kategoriKesalahanNama || ''}
                              onChange={(e) => {
                                const catNama = e.target.value;
                                const catObj = tajwidCategories.find(c => c.nama === catNama);
                                setConfigTargets(prev => prev.map((item, i) => i === idx ? {
                                  ...item,
                                  kategoriKesalahanNama: catNama,
                                  kategoriKesalahanId: catObj?.id || '',
                                  subKategoriKesalahanNama: ''
                                } : item));
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                            >
                              <option value="">-- Pilih Kategori --</option>
                              {tajwidCategories.map(c => (
                                <option key={c.id} value={c.nama}>{c.nama}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                              Sub Kategori:
                            </label>
                            {subList.length > 0 ? (
                              <select
                                value={tgt.subKategoriKesalahanNama || ''}
                                onChange={(e) => {
                                  const subVal = e.target.value;
                                  setConfigTargets(prev => prev.map((item, i) => i === idx ? {
                                    ...item,
                                    subKategoriKesalahanNama: subVal
                                  } : item));
                                }}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                              >
                                <option value="">-- Pilih Sub Kategori --</option>
                                {subList.map((sc: any) => (
                                  <option key={sc.id || sc.nama} value={sc.nama}>{sc.nama}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Sub Kategori (opsional)"
                                value={tgt.subKategoriKesalahanNama || ''}
                                onChange={(e) => {
                                  const subVal = e.target.value;
                                  setConfigTargets(prev => prev.map((item, i) => i === idx ? {
                                    ...item,
                                    subKategoriKesalahanNama: subVal
                                  } : item));
                                }}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-[11px]"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan / Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Catatan standar (opsional)"
                  value={configKeterangan}
                  onChange={(e) => setConfigKeterangan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Simpan Target Ayat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual session creation disabled in favor of Mutabaah Riwayat Setoran */}
      {false && isSesiModalOpen && isGuru && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {editingSesiId ? 'Edit Catatan Sesi Pertemuan' : 'Catat Sesi Pertemuan Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Santri: <strong>{activeSiswa?.namaLengkap}</strong> • Surah {activeSurat.nama} Ayat {sesiNomorAyat}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSesiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Label / Nama Sesi Pertemuan</label>
                  <input
                    type="text"
                    value={sesiNama}
                    onChange={(e) => setSesiNama(e.target.value)}
                    placeholder="misal: P1 atau P1 (Talaqqi Awal)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Pertemuan</label>
                  <input
                    type="date"
                    value={sesiTanggal}
                    onChange={(e) => setSesiTanggal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold mt-1"
                  />
                </div>
              </div>

              {/* Guru Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Guru / Ustadz Pembimbing</label>
                <select
                  value={sesiGuruId}
                  onChange={(e) => setSesiGuruId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold mt-1"
                >
                  {gurus.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.namaLengkap} ({g.jabatan || 'Guru'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Elemen Pembelajaran Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Elemen Pembelajaran Setoran:</span>
                  <span className="text-[9px] text-emerald-600 font-bold">
                    {selectedElemenList.length > 0 ? `${selectedElemenList.length} elemen diizinkan admin` : 'Semua elemen'}
                  </span>
                </label>
                <select
                  value={sesiElemenId}
                  onChange={(e) => setSesiElemenId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold mt-1 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {selectedElemenList.length > 0 ? (
                    selectedElemenList.map((el) => (
                      <option key={el.id} value={el.id}>
                        {el.nama} ({el.tipeModul === TipeModul.AL_QURAN ? "Al-Qur'an" : 'Selain Al-Qur\'an'})
                      </option>
                    ))
                  ) : (
                    elemenSettings.map((el) => (
                      <option key={el.id} value={el.id}>
                        {el.nama}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Checkbox of targets for this Ayat */}
              {(() => {
                const targetConfig = configsForSurah.find(c => c.nomorAyat === sesiNomorAyat) || configsForSurah[0];
                if (!targetConfig) return null;
                return (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Preview Ayat dengan Font Mushaf Resmi */}
                    <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/30 dark:from-slate-950 dark:to-slate-900 p-3.5 rounded-xl border border-emerald-200/80 dark:border-slate-800 text-right space-y-1.5">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-100/80 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Lafaz Ayat ke-{targetConfig.nomorAyat} ({activeSurat.nama})
                        </span>
                        <span className="text-[9.5px] font-mono text-slate-400">
                          {typography?.customFont ? (typography.customFont.fileName || 'Custom Malik Fahd') : (typography?.selectedFontPreset || 'Amiri Quran')}
                        </span>
                      </div>
                      <div className="inline-flex flex-row-reverse items-center justify-center gap-2.5 border rounded-xl p-3 px-4 shadow-xs transition duration-150 border-emerald-100 bg-white dark:border-slate-850 dark:bg-slate-950/20 w-full">
                        <p className="font-mushaf font-serif text-3xl font-normal leading-loose tracking-wide text-slate-900 dark:text-white select-text" dir="rtl">
                          {formatArabicFontClean(targetConfig.teksArab)}
                        </p>
                        <span className="font-mushaf font-serif text-3xl font-normal text-emerald-600 dark:text-emerald-400 select-none cursor-pointer inline-flex items-center justify-center px-1 shrink-0">
                          {convertToArabicNumerals(targetConfig.nomorAyat)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        Catatan Pada Target Ayat Ini (Centang jika Ada Catatan / Kesalahan):
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const targetSetoran = (sessionsForStudentAndSurah || []).find(s => s.sesiKe === sesiKeNumber && s.id.startsWith('cb-sesi-sync-'))
                              ? (setorans || []).find(st => st.id === sessionsForStudentAndSurah.find(s => s.sesiKe === sesiKeNumber)?.id.split('-')[4])
                              : undefined;
                            const { autoChecked, detectionDetails } = detectTargetsFromSetorans(
                              sesiSiswaId,
                              sesiSuratNomor,
                              targetConfig.nomorAyat,
                              targetConfig.targets,
                              targetSetoran
                            );
                            setSesiCatatanTarget(prev => ({ ...prev, ...autoChecked }));
                            setAutoDetectionInfo(prev => ({ ...prev, ...detectionDetails }));
                          }}
                          className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Pindai ulang catatan dan koreksi kesalahan dari setoran santri pada ayat ini"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Sinkronkan dari Setoran</span>
                        </button>
                        <span className="text-[10px] text-slate-400">
                          Default: Bersih (✓)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      {targetConfig.targets.map((tgt) => {
                        const hasError = sesiCatatanTarget[tgt.id] === true;
                        const detected = autoDetectionInfo[tgt.id];
                        return (
                          <div 
                            key={tgt.id}
                            onClick={() => {
                              setSesiCatatanTarget(prev => ({
                                ...prev,
                                [tgt.id]: !hasError
                              }));
                            }}
                            className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                              hasError 
                                ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 text-rose-950 dark:text-rose-200 shadow-2xs' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={hasError}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {tgt.kataLafaz && (
                                    <span className="font-mushaf font-serif text-lg font-normal px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs" dir="rtl">
                                      {tgt.kataLafaz}
                                    </span>
                                  )}
                                  <span className="font-bold text-xs">
                                    {tgt.unsur ? `${tgt.unsur} : ` : ''}{tgt.target}
                                  </span>
                                </div>
                                {(tgt.subKategoriKesalahanNama || tgt.kategoriKesalahanNama) && (
                                  <span className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 shrink-0">
                                    <span>{tgt.subKategoriKesalahanNama || tgt.kategoriKesalahanNama}</span>
                                  </span>
                                )}
                              </div>

                              {hasError && detected && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.8 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                  <span className="text-amber-600 dark:text-amber-400">⚡ Otomatis terdeteksi dari Setoran:</span>
                                  <span>{detected.subcategory || detected.category}{detected.targetText ? ` pada "${detected.targetText}"` : ''}</span>
                                  {detected.date && <span className="opacity-75 font-normal font-mono">({detected.date})</span>}
                                </div>
                              )}

                              <span className="text-[10px] mt-0.5 block opacity-75">
                                {hasError ? '⚠️ Terdapat catatan kesalahan pada poin ini' : '✓ Bersih / Lulus target pada pertemuan ini'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Catatan Tambahan Ustadz</label>
                <input
                  type="text"
                  placeholder="misal: Masih perlu dilatih di rumah saat waqaf"
                  value={sesiCatatanTambahan}
                  onChange={(e) => setSesiCatatanTambahan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              {editingSesiId ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Hapus sesi pertemuan ini?')) {
                      deleteCapaianBacaanSesi(editingSesiId);
                      setIsSesiModalOpen(false);
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Hapus Sesi
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSesiModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSesi}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Simpan Sesi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Susun Ulang Urutan & Nomor Ayat */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-emerald-600" />
                  <span>Susun Ulang Urutan Ayat - Surah {DAFTAR_114_SURAT.find(s => s.nomor === reorderSuratNomor)?.nama}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Geser urutan dengan tombol panah atau sesuaikan nomor ayat secara langsung.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Toolbar: Rapikan Nomor Urut Otomatis */}
            <div className="flex items-center justify-between gap-2 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shrink-0">
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Total {reorderDraftList.length} Ayat.</span> Ingin urutkan nomor otomatis 1, 2, 3...?
              </div>
              <button
                type="button"
                onClick={() => {
                  setReorderDraftList(prev => prev.map((item, idx) => ({
                    ...item,
                    nomorAyat: idx + 1
                  })));
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Urutkan 1..{reorderDraftList.length}</span>
              </button>
            </div>

            {/* List of Ayat Cards with Up/Down & Editable Number */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {reorderDraftList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada ayat untuk disusun ulang.
                </div>
              ) : (
                reorderDraftList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Ayat:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.nomorAyat}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            setReorderDraftList(prev => prev.map((it, i) => i === idx ? { ...it, nomorAyat: val } : it));
                          }}
                          className="w-14 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-center text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="flex-1 min-w-0 text-right pr-2">
                        <p className="font-mushaf font-serif text-lg text-slate-800 dark:text-slate-200 truncate" dir="rtl">
                          {formatArabicFontClean(item.teksArab)}
                        </p>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.targets.length} Target Indikator
                        </span>
                      </div>
                    </div>

                    {/* Up / Down Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          if (idx === 0) return;
                          setReorderDraftList(prev => {
                            const copy = [...prev];
                            const temp = copy[idx];
                            copy[idx] = copy[idx - 1];
                            copy[idx - 1] = temp;
                            return copy;
                          });
                        }}
                        className="p-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                        title="Geser ke atas"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === reorderDraftList.length - 1}
                        onClick={() => {
                          if (idx === reorderDraftList.length - 1) return;
                          setReorderDraftList(prev => {
                            const copy = [...prev];
                            const temp = copy[idx];
                            copy[idx] = copy[idx + 1];
                            copy[idx + 1] = temp;
                            return copy;
                          });
                        }}
                        className="p-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                        title="Geser ke bawah"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveReorderModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Simpan &amp; Terapkan Susunan Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilihan Muat Preset Standar Bawaan */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Muat Preset Standar Target Ayat</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih cakupan surah yang ingin dimuat preset bawaannya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Preset yang Ingin Dimuat:</label>

              {(selectedTab2SuratNomor === 112 || (selectedTab2SuratNomor === 'all' && selectedSuratNomor === 112)) && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                  <input
                    type="radio"
                    name="presetScope"
                    checked={presetTargetOption === 'al_ikhlas'}
                    onChange={() => setPresetTargetOption('al_ikhlas')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Hanya Surah Al-Ikhlas (Ayat 1-4)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Memuat 4 ayat standar Surah Al-Ikhlas saja tanpa menyentuh surah lain.
                    </p>
                  </div>
                </label>
              )}

              {(selectedTab2SuratNomor === 1 || (selectedTab2SuratNomor === 'all' && selectedSuratNomor === 1)) && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                  <input
                    type="radio"
                    name="presetScope"
                    checked={presetTargetOption === 'al_fatihah'}
                    onChange={() => setPresetTargetOption('al_fatihah')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Hanya Surah Al-Fatihah (Ayat 1-7)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Memuat 7 ayat standar Surah Al-Fatihah saja tanpa menyentuh surah lain.
                    </p>
                  </div>
                </label>
              )}

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <input
                  type="radio"
                  name="presetScope"
                  checked={presetTargetOption === 'semua'}
                  onChange={() => setPresetTargetOption('semua')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Semua Preset Bawaan (Al-Fatihah &amp; Al-Ikhlas)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Memuat lengkap seluruh preset standar (11 ayat total).
                  </p>
                </div>
              </label>
            </div>

            {/* Warning Note */}
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong>Catatan:</strong> Memuat preset akan memasukkan kembali butir ayat standar bawaan ke Cloud Database. Ayat yang sebelumnya dihapus pada surah tersebut akan kembali termuat.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLoadPreset}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ya, Muat Preset Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
