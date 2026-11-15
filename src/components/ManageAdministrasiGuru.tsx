/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Target, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  Copy, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  ToggleLeft,
  ToggleRight,
  ListOrdered,
  Lightbulb,
  FileText,
  Clock,
  Tag,
  Save,
  X,
  Scale
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  CapaianPembelajaran, 
  TujuanPembelajaran, 
  BankAktivitasPembelajaran, 
  RppTemplateAdmin,
  PilotTestingConfig
} from '../types';
import { StandarPenilaianDokumen } from './StandarPenilaianDokumen';

type AdminTab = 'cp' | 'tp' | 'bank_aktivitas' | 'template_rpp' | 'standar_penilaian' | 'pilot_testing';

export const ManageAdministrasiGuru: React.FC = () => {
  const {
    capaianPembelajarans,
    createCapaianPembelajaran,
    updateCapaianPembelajaran,
    deleteCapaianPembelajaran,
    tujuanPembelajarans,
    createTujuanPembelajaran,
    updateTujuanPembelajaran,
    deleteTujuanPembelajaran,
    bankAktivitas,
    createBankAktivitas,
    updateBankAktivitas,
    deleteBankAktivitas,
    rppTemplates,
    createRppTemplate,
    updateRppTemplate,
    deleteRppTemplate,
    pilotTestingConfig,
    savePilotTestingConfig,
    mataPelajarans,
    gurus,
    halaqahs
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('cp');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState('ALL');

  // Modal States
  const [isCpModalOpen, setIsCpModalOpen] = useState(false);
  const [editingCp, setEditingCp] = useState<CapaianPembelajaran | null>(null);

  const [isTpModalOpen, setIsTpModalOpen] = useState(false);
  const [editingTp, setEditingTp] = useState<TujuanPembelajaran | null>(null);

  const [isActModalOpen, setIsActModalOpen] = useState(false);
  const [editingAct, setEditingAct] = useState<BankAktivitasPembelajaran | null>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RppTemplateAdmin | null>(null);

  // Custom Delete Confirmation Modal State
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'CP' | 'TP' | 'BankAktivitas' | 'RppTemplate';
    id: string;
    title: string;
    desc?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      if (confirmDelete.type === 'CP') {
        deleteCapaianPembelajaran(confirmDelete.id);
        showFeedback(`Capaian Pembelajaran "${confirmDelete.title}" berhasil dihapus.`);
      } else if (confirmDelete.type === 'TP') {
        deleteTujuanPembelajaran(confirmDelete.id);
        showFeedback(`Tujuan Pembelajaran "${confirmDelete.title}" berhasil dihapus.`);
      } else if (confirmDelete.type === 'BankAktivitas') {
        deleteBankAktivitas(confirmDelete.id);
        showFeedback(`Aktivitas "${confirmDelete.title}" berhasil dihapus.`);
      } else if (confirmDelete.type === 'RppTemplate') {
        deleteRppTemplate(confirmDelete.id);
        showFeedback(`Template RPP "${confirmDelete.title}" berhasil dihapus.`);
      }
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Pilot Config Temporary State
  const [pilotState, setPilotState] = useState<PilotTestingConfig>(() => pilotTestingConfig);
  const [pilotSearch, setPilotSearch] = useState('');
  const [isSavingPilot, setIsSavingPilot] = useState(false);

  // Sync pilotState if context changes
  React.useEffect(() => {
    setPilotState(pilotTestingConfig);
  }, [pilotTestingConfig]);

  const showFeedback = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Mapel List for selector
  const availableMapels = useMemo(() => {
    if (mataPelajarans && mataPelajarans.length > 0) {
      return mataPelajarans;
    }
    return [
      { id: 'mapel-tajwid', nama: 'Tahsin & Tajwid Al-Qur\'an', kode: 'TJWD' },
      { id: 'mapel-tahfidz', nama: 'Tahfidz & Ziyadah Hafalan', kode: 'THFZ' },
      { id: 'mapel-murojaah', nama: 'Murojaah & Mutqin', kode: 'MRJH' },
      { id: 'mapel-adab', nama: 'Adab & Akhlak Penghafal Al-Qur\'an', kode: 'ADAB' }
    ];
  }, [mataPelajarans]);

  // ==========================================
  // CP FORM STATE & HANDLERS
  // ==========================================
  const [cpFormData, setCpFormData] = useState({
    mataPelajaranId: '',
    mataPelajaranNama: '',
    fase: 'Fase D (Tingkat Menengah/SMP/Wustha)',
    jenjang: 'Pondok Pesantren / Madrasah',
    elemen: 'Tajwid & Makharijul Huruf',
    kodeCP: '',
    deskripsiCP: '',
    rasional: '',
    statusAktif: true
  });

  const openAddCp = () => {
    setEditingCp(null);
    const defaultMapel = availableMapels[0];
    setCpFormData({
      mataPelajaranId: defaultMapel?.id || '',
      mataPelajaranNama: defaultMapel?.nama || '',
      fase: 'Fase D (Tingkat Menengah/SMP/Wustha)',
      jenjang: 'Pondok Pesantren / Madrasah',
      elemen: 'Makharijul & Sifatul Huruf',
      kodeCP: `CP-${((defaultMapel as any)?.kode || 'MPL')}-${Date.now().toString().slice(-3)}`,
      deskripsiCP: '',
      rasional: '',
      statusAktif: true
    });
    setIsCpModalOpen(true);
  };

  const openEditCp = (cp: CapaianPembelajaran) => {
    setEditingCp(cp);
    setCpFormData({
      mataPelajaranId: cp.mataPelajaranId || '',
      mataPelajaranNama: cp.mataPelajaranNama,
      fase: cp.fase || 'Fase D (Tingkat Menengah/SMP/Wustha)',
      jenjang: cp.jenjang,
      elemen: cp.elemen,
      kodeCP: cp.kodeCP,
      deskripsiCP: cp.deskripsiCP || cp.deskripsi || '',
      rasional: cp.rasional || '',
      statusAktif: cp.statusAktif
    });
    setIsCpModalOpen(true);
  };

  const handleSaveCp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpFormData.deskripsiCP.trim()) {
      alert('Mohon lengkapi Deskripsi Capaian Pembelajaran.');
      return;
    }

    const mapelObj = availableMapels.find(m => m.id === cpFormData.mataPelajaranId);
    const mapelName = mapelObj?.nama || cpFormData.mataPelajaranNama || 'Mata Pelajaran';
    const finalKodeCP = cpFormData.kodeCP?.trim() || editingCp?.kodeCP || `CP-${(mapelName || 'MPL').replace(/\s+/g, '').slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    if (editingCp) {
      await updateCapaianPembelajaran(editingCp.id, {
        ...cpFormData,
        kodeCP: finalKodeCP,
        deskripsi: cpFormData.deskripsiCP,
        mataPelajaranNama: mapelName
      });
      showFeedback('Capaian Pembelajaran (CP) berhasil diperbarui.');
    } else {
      await createCapaianPembelajaran({
        ...cpFormData,
        kodeCP: finalKodeCP,
        deskripsi: cpFormData.deskripsiCP,
        mataPelajaranNama: mapelName
      });
      showFeedback('Capaian Pembelajaran (CP) baru berhasil ditambahkan.');
    }
    setIsCpModalOpen(false);
  };

  // ==========================================
  // TP FORM STATE & HANDLERS
  // ==========================================
  const [tpFormData, setTpFormData] = useState({
    capaianPembelajaranId: '',
    mataPelajaranId: '',
    mataPelajaranNama: '',
    kodeTP: '',
    judul: '',
    deskripsi: '',
    alokasiWaktuMenit: 90,
    indikatorKetercapaian: [''],
    urutan: 1,
    statusAktif: true
  });

  const openAddTp = () => {
    setEditingTp(null);
    const defaultCp = capaianPembelajarans[0];
    setTpFormData({
      capaianPembelajaranId: defaultCp?.id || '',
      mataPelajaranId: defaultCp?.mataPelajaranId || availableMapels[0]?.id || '',
      mataPelajaranNama: defaultCp?.mataPelajaranNama || availableMapels[0]?.nama || '',
      kodeTP: `TP-${Date.now().toString().slice(-4)}`,
      judul: '',
      deskripsi: '',
      alokasiWaktuMenit: 90,
      indikatorKetercapaian: ['Peserta didik mampu melafalkan dengan tepat'],
      urutan: tujuanPembelajarans.length + 1,
      statusAktif: true
    });
    setIsTpModalOpen(true);
  };

  const openEditTp = (tp: TujuanPembelajaran) => {
    setEditingTp(tp);
    const tpText = tp.deskripsi || tp.judul || '';
    setTpFormData({
      capaianPembelajaranId: tp.capaianPembelajaranId || (tp as any).cpId || '',
      mataPelajaranId: tp.mataPelajaranId,
      mataPelajaranNama: tp.mataPelajaranNama,
      kodeTP: tp.kodeTP,
      judul: tpText,
      deskripsi: tpText,
      alokasiWaktuMenit: tp.alokasiWaktuMenit || 90,
      indikatorKetercapaian: tp.indikatorKetercapaian && tp.indikatorKetercapaian.length > 0 
        ? [...tp.indikatorKetercapaian] 
        : [''],
      urutan: tp.urutan || 1,
      statusAktif: tp.statusAktif
    });
    setIsTpModalOpen(true);
  };

  const handleSaveTp = async (e: React.FormEvent) => {
    e.preventDefault();
    const tpText = tpFormData.deskripsi.trim() || tpFormData.judul.trim();
    if (!tpFormData.capaianPembelajaranId || !tpText) {
      alert('Pilih Capaian Pembelajaran (CP) induk dan isi Tujuan Pembelajaran.');
      return;
    }

    const filteredIndikator = tpFormData.indikatorKetercapaian.filter(i => i.trim().length > 0);
    const selectedCp = capaianPembelajarans.find(c => c.id === tpFormData.capaianPembelajaranId);

    const autoKodeTP = tpFormData.kodeTP?.trim() || editingTp?.kodeTP || `TP-${Date.now().toString().slice(-4)}`;
    const payload = {
      ...tpFormData,
      judul: tpText,
      deskripsi: tpText,
      kodeTP: autoKodeTP,
      alokasiWaktuMenit: tpFormData.alokasiWaktuMenit || 90,
      mataPelajaranId: selectedCp?.mataPelajaranId || tpFormData.mataPelajaranId,
      mataPelajaranNama: selectedCp?.mataPelajaranNama || tpFormData.mataPelajaranNama,
      indikatorKetercapaian: filteredIndikator.length > 0 ? filteredIndikator : ['Ketercapaian materi dengan baik']
    };

    if (editingTp) {
      await updateTujuanPembelajaran(editingTp.id, payload);
      showFeedback('Tujuan Pembelajaran (TP) berhasil diperbarui.');
    } else {
      await createTujuanPembelajaran(payload);
      showFeedback('Tujuan Pembelajaran (TP) baru berhasil ditambahkan.');
    }
    setIsTpModalOpen(false);
  };

  // ==========================================
  // BANK AKTIVITAS FORM STATE & HANDLERS
  // ==========================================
  const [actFormData, setActFormData] = useState<{
    kategori: 'pembukaan' | 'pendahuluan' | 'inti' | 'penutup' | 'media' | 'asesmen';
    judul: string;
    deskripsi: string;
    rekomendasiWaktuMenit: number;
    tags: string;
  }>({
    kategori: 'pembukaan',
    judul: '',
    deskripsi: '',
    rekomendasiWaktuMenit: 10,
    tags: 'Talaqqi, Apersepsi'
  });

  const openAddAct = (defaultCategory: 'pembukaan' | 'inti' | 'penutup' = 'pembukaan') => {
    setEditingAct(null);
    setActFormData({
      kategori: defaultCategory,
      judul: '',
      deskripsi: '',
      rekomendasiWaktuMenit: defaultCategory === 'pembukaan' ? 10 : (defaultCategory === 'inti' ? 60 : 15),
      tags: defaultCategory === 'pembukaan' ? 'Apersepsi, Tilawah' : (defaultCategory === 'inti' ? 'Talaqqi, Demonstrasi' : 'Refleksi, Doa')
    });
    setIsActModalOpen(true);
  };

  const openEditAct = (act: BankAktivitasPembelajaran) => {
    setEditingAct(act);
    setActFormData({
      kategori: act.kategori,
      judul: act.judul,
      deskripsi: act.deskripsi,
      rekomendasiWaktuMenit: act.rekomendasiWaktuMenit || act.alokasiMenitDefault || 15,
      tags: act.tags?.join(', ') || ''
    });
    setIsActModalOpen(true);
  };

  const handleSaveAct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actFormData.judul.trim() || !actFormData.deskripsi.trim()) {
      alert('Mohon lengkapi judul dan rincian langkah kegiatan.');
      return;
    }

    const tagsArray = actFormData.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingAct) {
      await updateBankAktivitas(editingAct.id, {
        kategori: actFormData.kategori,
        judul: actFormData.judul,
        deskripsi: actFormData.deskripsi,
        rekomendasiWaktuMenit: Number(actFormData.rekomendasiWaktuMenit),
        tags: tagsArray
      });
      showFeedback('Aktivitas pembelajaran berhasil diperbarui.');
    } else {
      await createBankAktivitas({
        kategori: actFormData.kategori,
        judul: actFormData.judul,
        deskripsi: actFormData.deskripsi,
        rekomendasiWaktuMenit: Number(actFormData.rekomendasiWaktuMenit),
        tags: tagsArray
      });
      showFeedback('Aktivitas baru berhasil ditambahkan ke Bank Langkah Pembelajaran.');
    }
    setIsActModalOpen(false);
  };

  // ==========================================
  // TEMPLATE RPP ADMIN FORM STATE & HANDLERS
  // ==========================================
  const [tplFormData, setTplFormData] = useState<{
    judul: string;
    mataPelajaranId: string;
    mataPelajaranNama: string;
    jenjang: string;
    fase: string;
    alokasiWaktu: string;
    capaianPembelajaranId: string;
    tujuanPembelajaranIds: string[];
    pembukaanDefault: string[];
    intiDefault: string[];
    penutupDefault: string[];
    mediaDanAlat: string[];
    sumberBelajar: string[];
    asesmenMetode: string[];
    catatanAdmin: string;
  }>({
    judul: '',
    mataPelajaranId: '',
    mataPelajaranNama: '',
    jenjang: 'Pondok Pesantren / Madrasah',
    fase: 'Fase D (SMP/MTs/Wustha)',
    alokasiWaktu: '2 x 45 Menit (1 Pertemuan)',
    capaianPembelajaranId: '',
    tujuanPembelajaranIds: [],
    pembukaanDefault: [],
    intiDefault: [],
    penutupDefault: [],
    mediaDanAlat: ['Mushaf Al-Qur\'an Standar Madinah', 'Papan Tulis & Spidol', 'Pointer / Laser'],
    sumberBelajar: ['Kitab Matan Jazariyah', 'Buku Panduan Tahsin & Makharijul Huruf'],
    asesmenMetode: ['Asesmen Diagnostik (Pre-test Tilawah)', 'Asesmen Formatif (Observasi Makhraj & Talaqqi Mandiri)', 'Asesmen Sumatif (Ujian Setoran Hafalan & Praktik Tajwid)'],
    catatanAdmin: ''
  });

  const openAddTemplate = () => {
    setEditingTemplate(null);
    const defaultCp = capaianPembelajarans[0];
    const relatedTps = tujuanPembelajarans.filter(t => t.capaianPembelajaranId === defaultCp?.id);
    
    // Auto pick some default activities from bank
    const defaultOpen = bankAktivitas.filter(a => a.kategori === 'pembukaan').slice(0, 2).map(a => a.deskripsi);
    const defaultInti = bankAktivitas.filter(a => a.kategori === 'inti').slice(0, 3).map(a => a.deskripsi);
    const defaultPenutup = bankAktivitas.filter(a => a.kategori === 'penutup').slice(0, 2).map(a => a.deskripsi);

    setTplFormData({
      judul: 'Template Standar: ' + (defaultCp?.elemen || 'Pembelajaran Tahsin'),
      mataPelajaranId: defaultCp?.mataPelajaranId || availableMapels[0]?.id || '',
      mataPelajaranNama: defaultCp?.mataPelajaranNama || availableMapels[0]?.nama || '',
      jenjang: 'Pondok Pesantren / Madrasah',
      fase: defaultCp?.fase || 'Fase D (SMP/MTs/Wustha)',
      alokasiWaktu: '2 x 45 Menit (1 Pertemuan)',
      capaianPembelajaranId: defaultCp?.id || '',
      tujuanPembelajaranIds: relatedTps.map(t => t.id),
      pembukaanDefault: defaultOpen.length > 0 ? defaultOpen : ['Guru membuka majelis dengan salam, tadarus, dan apersepsi materi lalu.'],
      intiDefault: defaultInti.length > 0 ? defaultInti : ['Guru mencontohkan bacaan makhraj (Talaqqi), santri menyimak lalu menirukan bersama dan individu.'],
      penutupDefault: defaultPenutup.length > 0 ? defaultPenutup : ['Guru dan santri menyimpulkan faedah tajwid, membaca doa Kaffaratul Majelis.'],
      mediaDanAlat: ['Mushaf Al-Qur\'an Standar Madinah', 'Papan Tulis & Spidol'],
      sumberBelajar: ['Kitab Matan Jazariyah / Tuhfatul Athfal'],
      asesmenMetode: ['Observasi Praktik Talaqqi Langsung', 'Rubrik Ketepatan Makhraj Huruf'],
      catatanAdmin: 'Guru diperbolehkan memodifikasi durasi dan aktivitas sesuai kondisi halaqah masing-masing.'
    });
    setIsTemplateModalOpen(true);
  };

  const openEditTemplate = (tpl: RppTemplateAdmin) => {
    setEditingTemplate(tpl);
    const parsedSumber = Array.isArray(tpl.sumberBelajar)
      ? tpl.sumberBelajar
      : (tpl.sumberBelajar ? [tpl.sumberBelajar] : []);

    const parsedOpen = (Array.isArray(tpl.pembukaanDefault) && tpl.pembukaanDefault.length > 0)
      ? tpl.pembukaanDefault
      : (tpl.kegiatanPendahuluan ? tpl.kegiatanPendahuluan.split('\n').map(s => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean) : []);
    const parsedInti = (Array.isArray(tpl.intiDefault) && tpl.intiDefault.length > 0)
      ? tpl.intiDefault
      : (tpl.kegiatanInti ? tpl.kegiatanInti.split('\n').map(s => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean) : []);
    const parsedPenutup = (Array.isArray(tpl.penutupDefault) && tpl.penutupDefault.length > 0)
      ? tpl.penutupDefault
      : (tpl.kegiatanPenutup ? tpl.kegiatanPenutup.split('\n').map(s => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean) : []);

    setTplFormData({
      judul: tpl.judul,
      mataPelajaranId: tpl.mataPelajaranId || '',
      mataPelajaranNama: tpl.mataPelajaranNama,
      jenjang: tpl.jenjang || 'Pondok Pesantren / Madrasah',
      fase: tpl.fase || 'Fase D (SMP/MTs/Wustha)',
      alokasiWaktu: tpl.alokasiWaktu || tpl.alokasiWaktuDefault || '2 x 45 Menit (1 Pertemuan)',
      capaianPembelajaranId: tpl.capaianPembelajaranId || '',
      tujuanPembelajaranIds: tpl.tujuanPembelajaranIds || [],
      pembukaanDefault: parsedOpen,
      intiDefault: parsedInti,
      penutupDefault: parsedPenutup,
      mediaDanAlat: tpl.mediaDanAlat || (tpl.mediaPembelajaran ? [tpl.mediaPembelajaran] : []),
      sumberBelajar: parsedSumber,
      asesmenMetode: tpl.asesmenMetode || (tpl.asesmenPenilaian ? [tpl.asesmenPenilaian] : []),
      catatanAdmin: tpl.catatanAdmin || tpl.catatanGuruPreset || ''
    });
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplFormData.judul.trim() || !tplFormData.capaianPembelajaranId) {
      alert('Mohon isi Judul Template dan pilih Capaian Pembelajaran (CP).');
      return;
    }

    const selectedCp = capaianPembelajarans.find(c => c.id === tplFormData.capaianPembelajaranId);
    const payload = {
      ...tplFormData,
      mataPelajaranId: selectedCp?.mataPelajaranId || tplFormData.mataPelajaranId,
      mataPelajaranNama: selectedCp?.mataPelajaranNama || tplFormData.mataPelajaranNama,
      statusAktif: true
    };

    if (editingTemplate) {
      await updateRppTemplate(editingTemplate.id, payload);
      showFeedback('Template RPP Admin berhasil diperbarui.');
    } else {
      await createRppTemplate(payload);
      showFeedback('Template RPP Admin baru berhasil dibuat.');
    }
    setIsTemplateModalOpen(false);
  };

  // Pilot Testing Save
  const handleSavePilotConfig = async () => {
    setIsSavingPilot(true);
    try {
      await savePilotTestingConfig(pilotState);
      showFeedback('Pengaturan Uji Coba Administrasi Guru berhasil disimpan!');
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan konfigurasi uji coba.');
    } finally {
      setIsSavingPilot(false);
    }
  };

  const toggleGuruWhitelist = (guruId: string) => {
    setPilotState(prev => {
      const current = prev.whitelistGuruIds || [];
      const exists = current.includes(guruId);
      const updated = exists ? current.filter(id => id !== guruId) : [...current, guruId];
      return { ...prev, whitelistGuruIds: updated };
    });
  };

  const handleSelectAllGurus = () => {
    const allIds = (gurus || []).map(g => g.id);
    setPilotState(prev => ({ ...prev, whitelistGuruIds: allIds }));
  };

  const handleDeselectAllGurus = () => {
    setPilotState(prev => ({ ...prev, whitelistGuruIds: [] }));
  };

  // Filtered lists
  const filteredCps = useMemo(() => {
    return capaianPembelajarans.filter(cp => {
      const matchesSearch = 
        (cp.kodeCP || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cp.deskripsiCP || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cp.elemen || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cp.mataPelajaranNama || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMapel = selectedMapelFilter === 'ALL' || cp.mataPelajaranId === selectedMapelFilter;
      return matchesSearch && matchesMapel;
    });
  }, [capaianPembelajarans, searchQuery, selectedMapelFilter]);

  const filteredTps = useMemo(() => {
    return tujuanPembelajarans.filter(tp => {
      const matchesSearch = 
        tp.kodeTP.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tp.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tp.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tp.mataPelajaranNama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMapel = selectedMapelFilter === 'ALL' || tp.mataPelajaranId === selectedMapelFilter;
      return matchesSearch && matchesMapel;
    });
  }, [tujuanPembelajarans, searchQuery, selectedMapelFilter]);

  const filteredActs = useMemo(() => {
    return bankAktivitas.filter(act => {
      return (
        act.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [bankAktivitas, searchQuery]);

  const filteredTemplates = useMemo(() => {
    return rppTemplates.filter(tpl => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = !q ||
        (tpl.judul || '').toLowerCase().includes(q) ||
        (tpl.mataPelajaranNama || '').toLowerCase().includes(q) ||
        (tpl.fase || '').toLowerCase().includes(q) ||
        (tpl.catatanAdmin || '').toLowerCase().includes(q);

      const selectedMapelObj = mataPelajarans.find(m => m.id === selectedMapelFilter);
      const matchesMapel = 
        selectedMapelFilter === 'ALL' || 
        tpl.mataPelajaranId === selectedMapelFilter ||
        (selectedMapelObj && (tpl.mataPelajaranNama || '').toLowerCase() === selectedMapelObj.nama.toLowerCase());

      return matchesSearch && matchesMapel;
    });
  }, [rppTemplates, searchQuery, selectedMapelFilter, mataPelajarans]);

  const filteredGurusForPilot = useMemo(() => {
    return (gurus || []).filter(g => {
      return (
        g.namaLengkap.toLowerCase().includes(pilotSearch.toLowerCase()) ||
        (g.email && g.email.toLowerCase().includes(pilotSearch.toLowerCase())) ||
        (g.nip && g.nip.toLowerCase().includes(pilotSearch.toLowerCase()))
      );
    });
  }, [gurus, pilotSearch]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Feedback Toast */}
      {saveSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 bg-emerald-500/20 backdrop-blur-md rounded-lg border border-emerald-400/30 text-emerald-300">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                ADMINISTRASI AKADEMIK & KURIKULUM
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-sans">
              Standarisasi Administrasi Guru (CP, TP & RPP)
            </h1>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Kelola Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Bank Aktivitas, serta Template RPP resmi. Konfigurasi pula akun guru mana yang diberikan akses uji coba awal sebelum perilisan menyeluruh.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pilot_testing')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                activeTab === 'pilot_testing'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Akses Uji Coba Guru ({pilotTestingConfig.isGlobalEnabled ? 'Semua' : `${pilotTestingConfig.whitelistGuruIds?.length || 0} Guru`})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('cp')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'cp'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Capaian Pembelajaran (CP)</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded-full font-mono font-bold">
            {capaianPembelajarans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tp')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'tp'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>2. Tujuan Pembelajaran (TP)</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded-full font-mono font-bold">
            {tujuanPembelajarans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bank_aktivitas')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'bank_aktivitas'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>3. Bank Langkah Pembelajaran</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded-full font-mono font-bold">
            {bankAktivitas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('template_rpp')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'template_rpp'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>4. Template RPP / Modul Ajar</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded-full font-mono font-bold">
            {rppTemplates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('standar_penilaian')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'standar_penilaian'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>5. Standar Penilaian Resmi (SOP)</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full font-mono font-bold">
            Resmi
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pilot_testing')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'pilot_testing'
              ? 'border-amber-500 text-amber-800 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>6. Pengaturan Uji Coba Guru</span>
          {pilotTestingConfig.isGlobalEnabled ? (
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-mono font-bold">
              Global
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded font-mono font-bold">
              {pilotTestingConfig.whitelistGuruIds?.length || 0} Guru
            </span>
          )}
        </button>
      </div>

      {/* Action & Filter Toolbar for Tabs 1-4 */}
      {activeTab !== 'pilot_testing' && activeTab !== 'standar_penilaian' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode, judul, atau kata kunci..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab !== 'bank_aktivitas' && (
              <select
                value={selectedMapelFilter}
                onChange={e => setSelectedMapelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Mata Pelajaran</option>
                {availableMapels.map(m => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'cp' && (
              <button
                onClick={openAddCp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah CP</span>
              </button>
            )}
            {activeTab === 'tp' && (
              <button
                onClick={openAddTp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah TP</span>
              </button>
            )}
            {activeTab === 'bank_aktivitas' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openAddAct('pembukaan')}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Pembukaan</span>
                </button>
                <button
                  onClick={() => openAddAct('inti')}
                  className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Inti</span>
                </button>
                <button
                  onClick={() => openAddAct('penutup')}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>+ Penutup</span>
                </button>
              </div>
            )}
            {activeTab === 'template_rpp' && (
              <button
                onClick={openAddTemplate}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Template RPP</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CAPAIAN PEMBELAJARAN (CP) */}
      {/* ========================================================================= */}
      {activeTab === 'cp' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Menampilkan {filteredCps.length} Capaian Pembelajaran standar</span>
            <span className="italic">Disusun oleh Admin / Koordinator Kurikulum</span>
          </div>

          {filteredCps.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum ada Capaian Pembelajaran (CP)</h3>
              <p className="text-xs text-slate-500 mt-1">Tambahkan CP pertama untuk menjadi rujukan perumusan Tujuan Pembelajaran (TP).</p>
              <button
                onClick={openAddCp}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Capaian Pembelajaran</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCps.map(cp => {
                const connectedTps = tujuanPembelajarans.filter(t => t.capaianPembelajaranId === cp.id);
                return (
                  <div 
                    key={cp.id}
                    className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-850">
                              {cp.kodeCP}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                              {cp.mataPelajaranNama}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {cp.fase}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-2">
                            Elemen: {cp.elemen}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditCp(cp)}
                            title="Edit CP"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDelete({
                                type: 'CP',
                                id: cp.id,
                                title: `${cp.elemen} - ${cp.mataPelajaranNama}`,
                                desc: cp.deskripsiCP
                              });
                            }}
                            title="Hapus CP"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {cp.deskripsiCP}
                        </p>
                        {cp.rasional && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                            💡 Rasional: {cp.rasional}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Target className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{connectedTps.length} Tujuan Pembelajaran Terhubung</span>
                      </span>
                      <button
                        onClick={() => {
                          setSelectedMapelFilter(cp.mataPelajaranId);
                          setActiveTab('tp');
                        }}
                        className="text-emerald-600 hover:underline font-semibold cursor-pointer text-xs"
                      >
                        Lihat TP &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TUJUAN PEMBELAJARAN (TP) */}
      {/* ========================================================================= */}
      {activeTab === 'tp' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Menampilkan {filteredTps.length} Tujuan Pembelajaran</span>
            <span className="italic">Turunan dari Capaian Pembelajaran (CP)</span>
          </div>

          {filteredTps.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
              <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum ada Tujuan Pembelajaran (TP)</h3>
              <p className="text-xs text-slate-500 mt-1">Buat TP yang dapat dipilih oleh guru saat menyusun RPP / Modul Ajar.</p>
              <button
                onClick={openAddTp}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tujuan Pembelajaran</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTps.map(tp => {
                const parentCp = capaianPembelajarans.find(c => c.id === tp.capaianPembelajaranId);
                return (
                  <div 
                    key={tp.id}
                    className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-bold text-xs bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-850">
                          {tp.kodeTP}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditTp(tp)}
                            title="Edit TP"
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDelete({
                                type: 'TP',
                                id: tp.id,
                                title: `[${tp.kodeTP}] ${tp.judul || tp.deskripsi}`,
                                desc: tp.deskripsi
                              });
                            }}
                            title="Hapus TP"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug">
                        {tp.judul || tp.deskripsi}
                      </h4>

                      {tp.deskripsi && tp.judul && tp.deskripsi !== tp.judul && (
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                          {tp.deskripsi}
                        </p>
                      )}

                      {/* Indikator Ketercapaian */}
                      {tp.indikatorKetercapaian && tp.indikatorKetercapaian.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Indikator Ketercapaian:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                            {tp.indikatorKetercapaian.map((ind, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-snug">{ind}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[280px]">CP: <strong className="text-slate-600 dark:text-slate-300">{parentCp ? `${parentCp.mataPelajaranNama} - ${parentCp.elemen}` : '-'}</strong></span>
                      <span className="flex items-center gap-1 font-mono shrink-0">
                        <Clock className="w-3 h-3" />
                        {tp.alokasiWaktuMenit || 90} Menit
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BANK AKTIVITAS & LANGKAH PEMBELAJARAN */}
      {/* ========================================================================= */}
      {activeTab === 'bank_aktivitas' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
              <strong className="block font-bold">Tentang Bank Langkah Pembelajaran</strong>
              <span>
                Koleksi aktivitas standar yang disiapkan Admin agar guru dapat langsung <strong>memilih opsi langkah pembelajaran</strong> (Pembukaan, Inti, Penutup) dengan 1-klik saat membuat RPP, tanpa perlu mengetik ulang dari awal.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Pembukaan */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                    Aktivitas Pembukaan
                  </h3>
                </div>
                <button
                  onClick={() => openAddAct('pembukaan')}
                  className="p-1 text-blue-700 dark:text-blue-300 hover:bg-blue-200/50 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {filteredActs.filter(a => a.kategori === 'pembukaan').map(act => (
                  <div 
                    key={act.id}
                    className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {act.judul}
                      </h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditAct(act)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete({
                              type: 'BankAktivitas',
                              id: act.id,
                              title: act.judul,
                              desc: act.deskripsi
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Hapus Aktivitas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {act.deskripsi}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{act.rekomendasiWaktuMenit} Menit</span>
                      {act.tags && act.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {act.tags.map((t, idx) => (
                            <span key={idx} className="bg-slate-100 dark:bg-slate-900 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Inti */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                    Aktivitas Kegiatan Inti
                  </h3>
                </div>
                <button
                  onClick={() => openAddAct('inti')}
                  className="p-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {filteredActs.filter(a => a.kategori === 'inti').map(act => (
                  <div 
                    key={act.id}
                    className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {act.judul}
                      </h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditAct(act)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete({
                              type: 'BankAktivitas',
                              id: act.id,
                              title: act.judul,
                              desc: act.deskripsi
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Hapus Aktivitas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {act.deskripsi}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{act.rekomendasiWaktuMenit} Menit</span>
                      {act.tags && act.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {act.tags.map((t, idx) => (
                            <span key={idx} className="bg-slate-100 dark:bg-slate-900 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Penutup */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Aktivitas Penutup
                  </h3>
                </div>
                <button
                  onClick={() => openAddAct('penutup')}
                  className="p-1 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {filteredActs.filter(a => a.kategori === 'penutup').map(act => (
                  <div 
                    key={act.id}
                    className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-300 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {act.judul}
                      </h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditAct(act)}
                          className="p-1 text-slate-400 hover:text-amber-600 rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete({
                              type: 'BankAktivitas',
                              id: act.id,
                              title: act.judul,
                              desc: act.deskripsi
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Hapus Aktivitas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {act.deskripsi}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{act.rekomendasiWaktuMenit} Menit</span>
                      {act.tags && act.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {act.tags.map((t, idx) => (
                            <span key={idx} className="bg-slate-100 dark:bg-slate-900 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TEMPLATE RPP / MODUL AJAR ADMIN */}
      {/* ========================================================================= */}
      {activeTab === 'template_rpp' && (
        <div className="space-y-4">
          {/* Banner Informasi Sinkronisasi Template ke Akun Guru */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-blue-950 dark:text-blue-200">
                Pusat RPP & Modul Ajar Standar Lembaga (Master Kurikulum)
              </p>
              <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                Seluruh template RPP yang tercatat di sini otomatis dapat diakses oleh para pengajar melalui menu <strong>ADMINISTRASI & RPP &gt; CP-TP-RPP &gt; Tab &quot;RPP Standar Lembaga&quot;</strong> dengan lencana <em>Standar Resmi</em>. Anda dapat bebas <strong>mengedit</strong> rincian langkahnya, <strong>menghapus</strong> jika tidak digunakan, atau <strong>membuat template baru</strong> sesuai kurikulum resmi lembaga Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Tersedia {filteredTemplates.length} Template RPP Standar Lembaga</span>
            <span className="italic">Dapat disalin dan disesuaikan langsung oleh Guru</span>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum ada Template RPP Admin</h3>
              <p className="text-xs text-slate-500 mt-1">Buat template RPP master agar memudahkan para pengajar menyusun administrasi kelas.</p>
              <button
                onClick={openAddTemplate}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Template RPP Master</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(tpl => {
                const parentCp = capaianPembelajarans.find(c => c.id === tpl.capaianPembelajaranId);
                const openCount = (Array.isArray(tpl.pembukaanDefault) && tpl.pembukaanDefault.length > 0)
                  ? tpl.pembukaanDefault.length
                  : (tpl.kegiatanPendahuluan ? tpl.kegiatanPendahuluan.split('\n').filter(s => s.trim().length > 0).length : 0);
                const intiCount = (Array.isArray(tpl.intiDefault) && tpl.intiDefault.length > 0)
                  ? tpl.intiDefault.length
                  : (tpl.kegiatanInti ? tpl.kegiatanInti.split('\n').filter(s => s.trim().length > 0).length : 0);
                const penutupCount = (Array.isArray(tpl.penutupDefault) && tpl.penutupDefault.length > 0)
                  ? tpl.penutupDefault.length
                  : (tpl.kegiatanPenutup ? tpl.kegiatanPenutup.split('\n').filter(s => s.trim().length > 0).length : 0);

                return (
                  <div 
                    key={tpl.id}
                    className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              {tpl.mataPelajaranNama}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {tpl.fase}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1.5">
                            {tpl.judul}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditTemplate(tpl)}
                            title="Edit Template RPP"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDelete({
                                type: 'RppTemplate',
                                id: tpl.id,
                                title: tpl.judul,
                                desc: `Mata Pelajaran: ${tpl.mataPelajaranNama || '-'}`
                              });
                            }}
                            title="Hapus Template"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                        <div>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">Capaian Pembelajaran (CP):</span>
                          <p className="text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-2">
                            {parentCp?.deskripsiCP || parentCp?.deskripsi || 'CP belum terhubung'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Pembukaan:</span>
                            <strong className="text-blue-700 dark:text-blue-400">{openCount} Aktivitas</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Kegiatan Inti:</span>
                            <strong className="text-emerald-700 dark:text-emerald-400">{intiCount} Aktivitas</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Penutup:</span>
                            <strong className="text-amber-700 dark:text-amber-400">{penutupCount} Aktivitas</strong>
                          </div>
                        </div>
                      </div>

                      {tpl.catatanAdmin && (
                        <p className="text-[11px] text-slate-500 italic">
                          Catatan: {tpl.catatanAdmin}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono">{tpl.alokasiWaktu}</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Siap Digunakan Guru
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STANDAR PENILAIAN RESMI (SOP & ERROR DENSITY) */}
      {/* ========================================================================= */}
      {activeTab === 'standar_penilaian' && (
        <StandarPenilaianDokumen />
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PENGATURAN UJI COBA GURU (PILOT TESTING CONFIG) */}
      {/* ========================================================================= */}
      {activeTab === 'pilot_testing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-base font-bold font-sans">
                  Pengaturan Visibilitas & Uji Coba Terbatas (Pilot Testing)
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Fitur Administrasi Guru & Penyusunan RPP saat ini dapat dibatasi hanya untuk akun-akun guru terpilih sebagai tahap evaluasi dan penyempurnaan, sebelum diaktifkan untuk seluruh pengajar di lembaga.
              </p>
            </div>

            {/* Mode Switch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Pilot Whitelist */}
              <div 
                onClick={() => setPilotState(prev => ({ ...prev, isGlobalEnabled: false }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                  !pilotState.isGlobalEnabled
                    ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 ${!pilotState.isGlobalEnabled ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-850 text-slate-500'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      Mode Uji Coba Terbatas (Whitelist)
                    </h4>
                    {!pilotState.isGlobalEnabled && (
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Menu "Administrasi & RPP" <strong>hanya muncul</strong> pada akun guru yang dicentang di tabel whitelist di bawah. Guru lain tidak akan melihat menu ini.
                  </p>
                </div>
              </div>

              {/* Option B: Global Enable */}
              <div 
                onClick={() => setPilotState(prev => ({ ...prev, isGlobalEnabled: true }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                  pilotState.isGlobalEnabled
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 ${pilotState.isGlobalEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-850 text-slate-500'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      Rilis Untuk Seluruh Guru (Global)
                    </h4>
                    {pilotState.isGlobalEnabled && (
                      <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Menu "Administrasi & RPP" akan <strong>langsung tampil untuk semua guru</strong> di sidebar akun masing-masing.
                  </p>
                </div>
              </div>
            </div>

            {/* Whitelist Selection Table */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                    Daftar Guru Peserta Uji Coba ({pilotState.whitelistGuruIds?.length || 0} Terpilih)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Centang guru yang ditunjuk untuk mencoba fitur penyusunan RPP.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllGurus}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllGurus}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Batal Semua
                  </button>
                </div>
              </div>

              {/* Search Bar for Guru */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama ustadz/ustadzah atau NIP..."
                  value={pilotSearch}
                  onChange={e => setPilotSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Guru List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 max-h-96 overflow-y-auto">
                {filteredGurusForPilot.map(guru => {
                  const isChecked = (pilotState.whitelistGuruIds || []).includes(guru.id);
                  const guruHalaqah = (halaqahs || []).find(h => h.guruPembimbingId === guru.id);
                  
                  return (
                    <div
                      key={guru.id}
                      onClick={() => toggleGuruWhitelist(guru.id)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                        isChecked 
                          ? 'bg-amber-50/50 dark:bg-amber-950/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {guru.namaLengkap}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>NIP: {guru.nip || '-'}</span>
                            <span>&bull;</span>
                            <span>Halaqah: {guruHalaqah?.namaHalaqah || 'Belum ditugaskan'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isChecked ? (
                          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
                            ✓ Terdaftar Uji Coba
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Pilot Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSavePilotConfig}
                  disabled={isSavingPilot}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md hover:shadow-emerald-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPilot ? 'Menyimpan...' : 'Simpan Pengaturan Uji Coba'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORM CP */}
      {/* ========================================================================= */}
      {isCpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    {editingCp ? 'Edit Capaian Pembelajaran (CP)' : 'Tambah Capaian Pembelajaran (CP)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standar capaian kompetensi fase yang ditargetkan dalam kurikulum pembelajaran
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCp} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mata Pelajaran:
                  </label>
                  <select
                    value={cpFormData.mataPelajaranId}
                    onChange={e => {
                      const found = availableMapels.find(m => m.id === e.target.value);
                      setCpFormData(prev => ({
                        ...prev,
                        mataPelajaranId: e.target.value,
                        mataPelajaranNama: found?.nama || prev.mataPelajaranNama
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    {availableMapels.map(m => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Fase Kurikulum:
                  </label>
                  <input
                    type="text"
                    value={cpFormData.fase}
                    onChange={e => setCpFormData(prev => ({ ...prev, fase: e.target.value }))}
                    placeholder="Contoh: Fase D (Tingkat Menengah/SMP/Wustha) atau Tingkat Awwal"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Elemen Pembelajaran:
                  </label>
                  <input
                    type="text"
                    value={cpFormData.elemen}
                    onChange={e => setCpFormData(prev => ({ ...prev, elemen: e.target.value }))}
                    placeholder="Contoh: Makharijul & Sifatul Huruf / Tilawah / Tahfidz Ziyadah"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jenjang / Satuan Pendidikan:
                  </label>
                  <input
                    type="text"
                    value={cpFormData.jenjang}
                    onChange={e => setCpFormData(prev => ({ ...prev, jenjang: e.target.value }))}
                    placeholder="Contoh: Pondok Pesantren / Madrasah / Halaqah Al-Qur'an"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi Capaian Pembelajaran (CP):
                </label>
                <textarea
                  rows={5}
                  value={cpFormData.deskripsiCP}
                  onChange={e => setCpFormData(prev => ({ ...prev, deskripsiCP: e.target.value }))}
                  placeholder="Tuliskan rumusan capaian kompetensi fase yang diharapkan dikuasai oleh santri secara menyeluruh..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rasional & Catatan Penting (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={cpFormData.rasional}
                  onChange={e => setCpFormData(prev => ({ ...prev, rasional: e.target.value }))}
                  placeholder="Latar belakang pentingnya capaian ini, atau rujukan kurikulum bagi ustadz/ustadzah..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCpModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition shadow-md shadow-emerald-600/20"
                >
                  Simpan CP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FORM TP */}
      {/* ========================================================================= */}
      {isTpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    {editingTp ? 'Edit Tujuan Pembelajaran (TP)' : 'Tambah Tujuan Pembelajaran (TP)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perumusan tujuan instruksional spesifik turunan dari Capaian Pembelajaran (CP)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsTpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTp} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Capaian Pembelajaran (CP) Induk:
                </label>
                <select
                  value={tpFormData.capaianPembelajaranId}
                  onChange={e => setTpFormData(prev => ({ ...prev, capaianPembelajaranId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  required
                >
                  {capaianPembelajarans.map(cp => (
                    <option key={cp.id} value={cp.id}>
                      {cp.mataPelajaranNama} - {cp.elemen}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tujuan Pembelajaran:
                </label>
                <textarea
                  rows={4}
                  value={tpFormData.deskripsi}
                  onChange={e => {
                    const val = e.target.value;
                    setTpFormData(prev => ({ ...prev, deskripsi: val, judul: val }));
                  }}
                  placeholder="Rumusan kompetensi spesifik yang diharapkan dikuasai santri secara bertahap..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Indikator Ketercapaian Inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Indikator Ketercapaian Tujuan Pembelajaran:
                  </label>
                  <button
                    type="button"
                    onClick={() => setTpFormData(prev => ({
                      ...prev,
                      indikatorKetercapaian: [...prev.indikatorKetercapaian, '']
                    }))}
                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-900 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Indikator</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {tpFormData.indikatorKetercapaian.map((ind, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ind}
                        onChange={e => {
                          const val = e.target.value;
                          setTpFormData(prev => {
                            const updated = [...prev.indikatorKetercapaian];
                            updated[idx] = val;
                            return { ...prev, indikatorKetercapaian: updated };
                          });
                        }}
                        placeholder={`Indikator keberhasilan ${idx + 1}...`}
                        className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                      {tpFormData.indikatorKetercapaian.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTpFormData(prev => ({
                              ...prev,
                              indikatorKetercapaian: prev.indikatorKetercapaian.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Hapus Indikator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTpModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition shadow-md shadow-emerald-600/20"
                >
                  Simpan TP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FORM BANK AKTIVITAS */}
      {/* ========================================================================= */}
      {isActModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    {editingAct ? 'Edit Aktivitas Pembelajaran' : 'Tambah Aktivitas Pembelajaran'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Koleksi kegiatan pedagogis standar yang dapat dipilih guru ke dalam modul ajar
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsActModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAct} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kategori Bagian Pembelajaran:
                  </label>
                  <select
                    value={actFormData.kategori}
                    onChange={e => setActFormData(prev => ({ ...prev, kategori: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  >
                    <option value="pembukaan">1. Kegiatan Pembukaan (Apersepsi, Motivasi & Doa)</option>
                    <option value="inti">2. Kegiatan Inti (Talaqqi, Drill, Diskusi & Praktik)</option>
                    <option value="penutup">3. Kegiatan Penutup (Refleksi, Penguatan & Doa)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rekomendasi Durasi (Menit):
                  </label>
                  <input
                    type="number"
                    value={actFormData.rekomendasiWaktuMenit}
                    onChange={e => setActFormData(prev => ({ ...prev, rekomendasiWaktuMenit: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    placeholder="Contoh: 15"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul / Label Aktivitas:
                </label>
                <input
                  type="text"
                  value={actFormData.judul}
                  onChange={e => setActFormData(prev => ({ ...prev, judul: e.target.value }))}
                  placeholder="Contoh: Talaqqi Mandiri & Simakan Teman Sebaya (Peer Checking)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Langkah-Langkah & Deskripsi Kegiatan:
                </label>
                <textarea
                  rows={5}
                  value={actFormData.deskripsi}
                  onChange={e => setActFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  placeholder="Tuliskan petunjuk teknis operasional yang jelas mengenai apa yang dilakukan oleh guru dan santri..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Label / Tags (Pisah dengan koma):
                </label>
                <input
                  type="text"
                  value={actFormData.tags}
                  onChange={e => setActFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Contoh: Talaqqi, Makharij, Peer Checking, Murojaah"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsActModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition shadow-md shadow-emerald-600/20"
                >
                  Simpan Aktivitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FORM TEMPLATE RPP ADMIN */}
      {/* ========================================================================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-5xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    {editingTemplate ? 'Edit Template RPP / Modul Ajar Admin' : 'Buat Template RPP / Modul Ajar Master'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cetak biru modul ajar kurikulum standar yang dapat langsung disalin dan diadaptasi oleh ustadz pengampu
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Template RPP:
                </label>
                <input
                  type="text"
                  value={tplFormData.judul}
                  onChange={e => setTplFormData(prev => ({ ...prev, judul: e.target.value }))}
                  placeholder="Contoh: RPP Standar Talaqqi & Makharijul Huruf Halqi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Capaian Pembelajaran (CP) Terkait:
                  </label>
                  <select
                    value={tplFormData.capaianPembelajaranId}
                    onChange={e => {
                      const cpId = e.target.value;
                      const selectedCp = capaianPembelajarans.find(c => c.id === cpId);
                      const relatedTps = tujuanPembelajarans.filter(t => t.capaianPembelajaranId === cpId);
                      setTplFormData(prev => ({
                        ...prev,
                        capaianPembelajaranId: cpId,
                        mataPelajaranId: selectedCp?.mataPelajaranId || prev.mataPelajaranId,
                        mataPelajaranNama: selectedCp?.mataPelajaranNama || prev.mataPelajaranNama,
                        tujuanPembelajaranIds: relatedTps.map(t => t.id)
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    required
                  >
                    {capaianPembelajarans.map(cp => (
                      <option key={cp.id} value={cp.id}>
                        {cp.mataPelajaranNama} - {cp.elemen}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Alokasi Waktu:
                  </label>
                  <input
                    type="text"
                    value={tplFormData.alokasiWaktu}
                    onChange={e => setTplFormData(prev => ({ ...prev, alokasiWaktu: e.target.value }))}
                    placeholder="Contoh: 2 x 45 Menit (1 Pertemuan)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Langkah Pembelajaran Default */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    Pilihan Langkah Pembelajaran Standar Template:
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Dapat disesuaikan langsung oleh guru saat menyusun RPP
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Pembukaan */}
                  <div className="bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <span className="font-bold text-blue-800 dark:text-blue-300 text-xs sm:text-sm">
                          1. Kegiatan Pembukaan (Apersepsi, Motivasi & Doa)
                        </span>
                        <span className="text-[11px] text-blue-600/80 dark:text-blue-400 font-medium ml-1">
                          ({tplFormData.pembukaanDefault.length} Poin)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTplFormData(prev => ({
                          ...prev,
                          pembukaanDefault: [...prev.pembukaanDefault, '']
                        }))}
                        className="text-blue-700 dark:text-blue-400 bg-white dark:bg-blue-900/60 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        + Poin Baru
                      </button>
                    </div>
                    <div className="space-y-2">
                      {tplFormData.pembukaanDefault.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 w-5 shrink-0 text-center">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={item}
                            onChange={e => {
                              const val = e.target.value;
                              setTplFormData(prev => {
                                const updated = [...prev.pembukaanDefault];
                                updated[idx] = val;
                                return { ...prev, pembukaanDefault: updated };
                              });
                            }}
                            placeholder={`Tuliskan rincian langkah kegiatan pembukaan ke-${idx + 1}...`}
                            className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setTplFormData(prev => ({
                              ...prev,
                              pembukaanDefault: prev.pembukaanDefault.filter((_, i) => i !== idx)
                            }))}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer shrink-0"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {tplFormData.pembukaanDefault.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-2">Belum ada poin pembukaan. Klik "+ Poin Baru" di atas untuk menambahkan.</p>
                      )}
                    </div>
                  </div>

                  {/* Inti */}
                  <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                          2. Kegiatan Inti (Talaqqi, Tahsin, Setoran & Murojaah)
                        </span>
                        <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400 font-medium ml-1">
                          ({tplFormData.intiDefault.length} Poin)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTplFormData(prev => ({
                          ...prev,
                          intiDefault: [...prev.intiDefault, '']
                        }))}
                        className="text-emerald-700 dark:text-emerald-400 bg-white dark:bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        + Poin Baru
                      </button>
                    </div>
                    <div className="space-y-2">
                      {tplFormData.intiDefault.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 w-5 shrink-0 text-center">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={item}
                            onChange={e => {
                              const val = e.target.value;
                              setTplFormData(prev => {
                                const updated = [...prev.intiDefault];
                                updated[idx] = val;
                                return { ...prev, intiDefault: updated };
                              });
                            }}
                            placeholder={`Tuliskan rincian langkah kegiatan inti ke-${idx + 1}...`}
                            className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setTplFormData(prev => ({
                              ...prev,
                              intiDefault: prev.intiDefault.filter((_, i) => i !== idx)
                            }))}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer shrink-0"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {tplFormData.intiDefault.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-2">Belum ada poin inti. Klik "+ Poin Baru" di atas untuk menambahkan.</p>
                      )}
                    </div>
                  </div>

                  {/* Penutup */}
                  <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                        <span className="font-bold text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                          3. Kegiatan Penutup (Evaluasi, Kesimpulan, Refleksi & Doa)
                        </span>
                        <span className="text-[11px] text-amber-600/80 dark:text-amber-400 font-medium ml-1">
                          ({tplFormData.penutupDefault.length} Poin)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTplFormData(prev => ({
                          ...prev,
                          penutupDefault: [...prev.penutupDefault, '']
                        }))}
                        className="text-amber-700 dark:text-amber-400 bg-white dark:bg-amber-900/60 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900 font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        + Poin Baru
                      </button>
                    </div>
                    <div className="space-y-2">
                      {tplFormData.penutupDefault.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 w-5 shrink-0 text-center">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={item}
                            onChange={e => {
                              const val = e.target.value;
                              setTplFormData(prev => {
                                const updated = [...prev.penutupDefault];
                                updated[idx] = val;
                                return { ...prev, penutupDefault: updated };
                              });
                            }}
                            placeholder={`Tuliskan rincian langkah kegiatan penutup ke-${idx + 1}...`}
                            className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setTplFormData(prev => ({
                              ...prev,
                              penutupDefault: prev.penutupDefault.filter((_, i) => i !== idx)
                            }))}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer shrink-0"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {tplFormData.penutupDefault.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-2">Belum ada poin penutup. Klik "+ Poin Baru" di atas untuk menambahkan.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Penggunaan Template untuk Guru:
                </label>
                <input
                  type="text"
                  value={tplFormData.catatanAdmin}
                  onChange={e => setTplFormData(prev => ({ ...prev, catatanAdmin: e.target.value }))}
                  placeholder="Petunjuk khusus bagi ustadz pengampu halaqah..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition shadow-md shadow-emerald-600/20"
                >
                  Simpan Template RPP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Data Administrasi Guru */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base text-center">
              Konfirmasi Hapus {confirmDelete.type === 'CP' ? 'Capaian Pembelajaran (CP)' : confirmDelete.type === 'TP' ? 'Tujuan Pembelajaran (TP)' : confirmDelete.type === 'BankAktivitas' ? 'Bank Aktivitas' : 'Template RPP'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
              Apakah Anda yakin ingin menghapus data <strong className="text-slate-800 dark:text-slate-200">"{confirmDelete.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            {confirmDelete.desc && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1 text-center line-clamp-2">
                {confirmDelete.desc}
              </p>
            )}
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
