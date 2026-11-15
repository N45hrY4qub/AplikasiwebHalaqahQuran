/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Copy, 
  Printer, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Target, 
  Sparkles, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  Lightbulb, 
  Info, 
  GraduationCap,
  FileSpreadsheet, 
  Download,
  Eye,
  Calendar,
  Save,
  CheckCheck,
  ExternalLink,
  ArrowRight,
  Scale
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  GuruRppDokumen, 
  RppTemplateAdmin, 
  CapaianPembelajaran, 
  TujuanPembelajaran, 
  BankAktivitasPembelajaran 
} from '../types';
import { StandarPenilaianDokumen } from './StandarPenilaianDokumen';
import { getTeacherHalaqahs } from '../utils/studentAttendanceHelper';

export const getTemplateStepList = (arr?: string[], text?: string): string[] => {
  if (Array.isArray(arr) && arr.length > 0) return arr;
  if (text) {
    return text
      .split('\n')
      .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
};

export const GuruAdministrasiModule: React.FC = () => {
  const {
    currentSession,
    guruRppList,
    createGuruRpp,
    updateGuruRpp,
    deleteGuruRpp,
    rppTemplates,
    capaianPembelajarans,
    tujuanPembelajarans,
    bankAktivitas,
    mataPelajarans,
    halaqahs,
    gurus,
    guruSchedules,
    strukturLembaga
  } = useApp();

  const currentGuruId = currentSession.user?.id || '';
  const currentGuruNama = currentSession.user?.namaLengkap || 'Guru Pengampu';

  // Navigation Tabs: RPP Saya & Kurikulum Lembaga (CP, TP, RPP Standar dalam 1 Tab)
  type ModuleTab = 'my_rpp' | 'admin_kurikulum';
  const [activeModuleTab, setActiveModuleTab] = useState<ModuleTab>('my_rpp');

  // Sub-tabs in Kurikulum Lembaga: Struktur Terpadu, Capaian (CP), Tujuan (TP), Template RPP, Standar Penilaian
  type AdminSubTab = 'terpadu' | 'cp' | 'tp' | 'template' | 'standar_penilaian';
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('terpadu');

  // Filters & Search for RPP Saya
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'final' | 'draft'>('ALL');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState('ALL');

  // CP Admin Filters & Detail
  const [cpSearchQuery, setCpSearchQuery] = useState('');
  const [cpMapelFilter, setCpMapelFilter] = useState('ALL');
  const [selectedCpDetail, setSelectedCpDetail] = useState<CapaianPembelajaran | null>(null);

  // TP Admin Filters & Detail
  const [tpSearchQuery, setTpSearchQuery] = useState('');
  const [tpMapelFilter, setTpMapelFilter] = useState('ALL');
  const [tpCpFilter, setTpCpFilter] = useState('ALL');
  const [selectedTpDetail, setSelectedTpDetail] = useState<TujuanPembelajaran | null>(null);

  // Master RPP Admin Filters & Detail
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateMapelFilter, setTemplateMapelFilter] = useState('ALL');
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<RppTemplateAdmin | null>(null);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRpp, setEditingRpp] = useState<GuruRppDokumen | null>(null);
  const [confirmDeleteRpp, setConfirmDeleteRpp] = useState<{ id: string; judul: string } | null>(null);
  const [editorStep, setEditorStep] = useState<number>(1);

  const [previewRpp, setPreviewRpp] = useState<GuruRppDokumen | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Bank Activity Picker in Editor
  const [isActivityPickerOpen, setIsActivityPickerOpen] = useState<boolean>(false);
  const [activityTargetField, setActivityTargetField] = useState<'pembukaan' | 'inti' | 'penutup'>('pembukaan');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Available Mapel List
  const availableMapels = useMemo(() => {
    if (mataPelajarans && mataPelajarans.length > 0) return mataPelajarans;
    return [
      { id: 'mapel-tajwid', nama: 'Tahsin & Tajwid Al-Qur\'an', kode: 'TJWD' },
      { id: 'mapel-tahfidz', nama: 'Tahfidz & Ziyadah Hafalan', kode: 'THFZ' },
      { id: 'mapel-murojaah', nama: 'Murojaah & Mutqin', kode: 'MRJH' },
      { id: 'mapel-adab', nama: 'Adab & Akhlak Penghafal Al-Qur\'an', kode: 'ADAB' }
    ];
  }, [mataPelajarans]);

  // Current Guru's Halaqah
  const teacherHalaqahs = useMemo(() => {
    return getTeacherHalaqahs(halaqahs, currentSession.user, gurus, guruSchedules);
  }, [halaqahs, currentSession.user, gurus, guruSchedules]);

  // RPPs authored by this Guru
  const myRpps = useMemo(() => {
    return (guruRppList || []).filter(r => r.guruId === currentGuruId);
  }, [guruRppList, currentGuruId]);

  const filteredRpps = useMemo(() => {
    return myRpps.filter(rpp => {
      const matchQuery = 
        rpp.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpp.mataPelajaranNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rpp.kelasAtauHalaqah.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || rpp.status === statusFilter;
      const matchMapel = selectedMapelFilter === 'ALL' || rpp.mataPelajaranId === selectedMapelFilter;
      return matchQuery && matchStatus && matchMapel;
    });
  }, [myRpps, searchQuery, statusFilter, selectedMapelFilter]);

  // Filtered CP Admin
  const filteredAdminCps = useMemo(() => {
    return (capaianPembelajarans || []).filter(cp => {
      const matchMapel = cpMapelFilter === 'ALL' || cp.mataPelajaranId === cpMapelFilter;
      const q = cpSearchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (cp.kodeCP || '').toLowerCase().includes(q) ||
        (cp.mataPelajaranNama || '').toLowerCase().includes(q) ||
        (cp.elemen || '').toLowerCase().includes(q) ||
        (cp.deskripsiCP || cp.deskripsi || '').toLowerCase().includes(q) ||
        (cp.rasional || '').toLowerCase().includes(q) ||
        (cp.fase || '').toLowerCase().includes(q);
      return matchMapel && matchQuery;
    });
  }, [capaianPembelajarans, cpMapelFilter, cpSearchQuery]);

  // Filtered TP Admin
  const filteredAdminTps = useMemo(() => {
    return (tujuanPembelajarans || []).filter(tp => {
      const parentCp = (capaianPembelajarans || []).find(c => c.id === tp.capaianPembelajaranId || c.id === tp.cpId);
      const matchMapel = tpMapelFilter === 'ALL' || (parentCp && parentCp.mataPelajaranId === tpMapelFilter) || tp.mataPelajaranId === tpMapelFilter;
      const matchCp = tpCpFilter === 'ALL' || tp.capaianPembelajaranId === tpCpFilter || tp.cpId === tpCpFilter;
      const q = tpSearchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (tp.kodeTP || '').toLowerCase().includes(q) ||
        (tp.judul || '').toLowerCase().includes(q) ||
        (tp.deskripsi || '').toLowerCase().includes(q) ||
        (tp.mataPelajaranNama || '').toLowerCase().includes(q) ||
        (tp.indikatorKetercapaian || []).some(ind => ind.toLowerCase().includes(q));
      return matchMapel && matchCp && matchQuery;
    });
  }, [tujuanPembelajarans, capaianPembelajarans, tpMapelFilter, tpCpFilter, tpSearchQuery]);

  // Filtered Master RPP Templates Admin
  const filteredAdminTemplates = useMemo(() => {
    return (rppTemplates || []).filter(tpl => {
      const matchMapel = templateMapelFilter === 'ALL' || tpl.mataPelajaranId === templateMapelFilter;
      const q = templateSearchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (tpl.judul || '').toLowerCase().includes(q) ||
        (tpl.mataPelajaranNama || '').toLowerCase().includes(q) ||
        (tpl.fase || '').toLowerCase().includes(q) ||
        (tpl.alokasiWaktu || '').toLowerCase().includes(q) ||
        (tpl.catatanAdmin || '').toLowerCase().includes(q);
      return matchMapel && matchQuery;
    });
  }, [rppTemplates, templateMapelFilter, templateSearchQuery]);

  // ==========================================
  // RPP FORM WIZARD STATE
  // ==========================================
  const [formData, setFormData] = useState<{
    templateRefId?: string;
    judul: string;
    mataPelajaranId: string;
    mataPelajaranNama: string;
    kelasAtauHalaqah: string;
    semester: 'Ganjil' | 'Genap';
    fase: string;
    alokasiWaktu: string;
    pertemuanKe: number;
    tanggalPelaksanaan: string;
    capaianPembelajaranId: string;
    capaianPembelajaranDeskripsi: string;
    tujuanPembelajaranDipilih: Array<{
      tpId: string;
      kodeTP: string;
      judul: string;
      indikator: string[];
    }>;
    kegiatanPembukaan: string[];
    kegiatanInti: string[];
    kegiatanPenutup: string[];
    mediaDanAlat: string[];
    sumberBelajar: string[];
    asesmenMetode: string[];
    refleksiGuru: string;
    status: 'draft' | 'final';
  }>({
    templateRefId: '',
    judul: '',
    mataPelajaranId: '',
    mataPelajaranNama: '',
    kelasAtauHalaqah: '',
    semester: 'Ganjil',
    fase: 'Fase D (Tingkat Menengah / SMP)',
    alokasiWaktu: '2 x 45 Menit (1 Pertemuan)',
    pertemuanKe: 1,
    tanggalPelaksanaan: new Date().toISOString().split('T')[0],
    capaianPembelajaranId: '',
    capaianPembelajaranDeskripsi: '',
    tujuanPembelajaranDipilih: [],
    kegiatanPembukaan: [],
    kegiatanInti: [],
    kegiatanPenutup: [],
    mediaDanAlat: ['Mushaf Al-Qur\'an Standar Madinah', 'Papan Tulis & Spidol'],
    sumberBelajar: ['Buku Panduan Tajwid & Makharijul Huruf'],
    asesmenMetode: ['Asesmen Formatif (Observasi Makhraj)', 'Setoran Praktik Talaqqi'],
    refleksiGuru: '',
    status: 'draft'
  });

  // Open New RPP Wizard
  const handleOpenNewRpp = () => {
    setEditingRpp(null);
    setEditorStep(1);

    const defaultMapel = availableMapels[0];
    const defaultHalaqah = teacherHalaqahs[0]?.namaHalaqah || 'Halaqah Tahfidz';
    const defaultCp = capaianPembelajarans.find(c => c.mataPelajaranId === defaultMapel?.id) || capaianPembelajarans[0];

    // Default TP
    const relatedTps = tujuanPembelajarans.filter(t => (t.capaianPembelajaranId === defaultCp?.id || t.cpId === defaultCp?.id));
    const initialSelectedTps = relatedTps.slice(0, 2).map(t => ({
      tpId: t.id,
      kodeTP: t.kodeTP,
      judul: t.judul,
      indikator: t.indikatorKetercapaian || []
    }));

    // Default Bank activities
    const openActs = bankAktivitas.filter(a => a.kategori === 'pembukaan' || a.kategori === 'pendahuluan').slice(0, 2).map(a => a.deskripsi);
    const intiActs = bankAktivitas.filter(a => a.kategori === 'inti').slice(0, 3).map(a => a.deskripsi);
    const penutupActs = bankAktivitas.filter(a => a.kategori === 'penutup').slice(0, 2).map(a => a.deskripsi);

    setFormData({
      templateRefId: '',
      judul: `RPP ${defaultMapel?.nama || 'Tahsin'}: Pertemuan 1`,
      mataPelajaranId: defaultMapel?.id || '',
      mataPelajaranNama: defaultMapel?.nama || '',
      kelasAtauHalaqah: defaultHalaqah,
      semester: 'Ganjil',
      fase: defaultCp?.fase || 'Fase D (Tingkat Menengah / SMP)',
      alokasiWaktu: '2 x 45 Menit (1 Pertemuan)',
      pertemuanKe: myRpps.length + 1,
      tanggalPelaksanaan: new Date().toISOString().split('T')[0],
      capaianPembelajaranId: defaultCp?.id || '',
      capaianPembelajaranDeskripsi: defaultCp?.deskripsiCP || defaultCp?.deskripsi || '',
      tujuanPembelajaranDipilih: initialSelectedTps,
      kegiatanPembukaan: openActs.length > 0 ? openActs : ['Guru membuka majelis dengan salam, tadarus, dan apersepsi materi.'],
      kegiatanInti: intiActs.length > 0 ? intiActs : ['Guru mendemonstrasikan makhraj secara talaqqi, santri menyimak dan menirukan.'],
      kegiatanPenutup: penutupActs.length > 0 ? penutupActs : ['Refleksi materi, murojaah hafalan mandiri, dan doa Kaffaratul Majelis.'],
      mediaDanAlat: ['Mushaf Al-Qur\'an Standar', 'Papan Tulis & Spidol'],
      sumberBelajar: ['Kitab Matan Tajwid / Modul Halaqah'],
      asesmenMetode: ['Asesmen Formatif (Observasi Praktik Talaqqi)'],
      refleksiGuru: '',
      status: 'draft'
    });
    setIsEditorOpen(true);
  };

  // Open Edit RPP
  const handleOpenEditRpp = (rpp: GuruRppDokumen) => {
    setEditingRpp(rpp);
    setEditorStep(1);
    setFormData({
      templateRefId: rpp.templateRefId || '',
      judul: rpp.judul || rpp.materiPokok || 'Rencana Pembelajaran',
      mataPelajaranId: rpp.mataPelajaranId || '',
      mataPelajaranNama: rpp.mataPelajaranNama,
      kelasAtauHalaqah: rpp.kelasAtauHalaqah || rpp.halaqahNama || rpp.kelasNama || 'Halaqah',
      semester: (rpp.semester === 'Genap' ? 'Genap' : 'Ganjil'),
      fase: rpp.fase || 'Fase D (Tingkat Menengah / SMP)',
      alokasiWaktu: rpp.alokasiWaktu || '2 x 45 Menit',
      pertemuanKe: Number(rpp.pertemuanKe) || 1,
      tanggalPelaksanaan: rpp.tanggalPelaksanaan || new Date().toISOString().split('T')[0],
      capaianPembelajaranId: rpp.capaianPembelajaranId || rpp.cpId || '',
      capaianPembelajaranDeskripsi: rpp.capaianPembelajaranDeskripsi || rpp.cpDeskripsi || '',
      tujuanPembelajaranDipilih: rpp.tujuanPembelajaranDipilih || [],
      kegiatanPembukaan: Array.isArray(rpp.kegiatanPembukaan) ? rpp.kegiatanPembukaan : (rpp.kegiatanPendahuluan ? [rpp.kegiatanPendahuluan] : []),
      kegiatanInti: Array.isArray(rpp.kegiatanInti) ? rpp.kegiatanInti : (rpp.kegiatanInti ? [rpp.kegiatanInti] : []),
      kegiatanPenutup: Array.isArray(rpp.kegiatanPenutup) ? rpp.kegiatanPenutup : (rpp.kegiatanPenutup ? [rpp.kegiatanPenutup] : []),
      mediaDanAlat: Array.isArray(rpp.mediaDanAlat) ? rpp.mediaDanAlat : (rpp.mediaDanSumber ? [rpp.mediaDanSumber] : []),
      sumberBelajar: Array.isArray(rpp.sumberBelajar) ? rpp.sumberBelajar : (rpp.sumberBelajar ? [rpp.sumberBelajar] : []),
      asesmenMetode: Array.isArray(rpp.asesmenMetode) ? rpp.asesmenMetode : (rpp.asesmenRencana ? [rpp.asesmenRencana] : []),
      refleksiGuru: rpp.refleksiGuru || rpp.catatanRefleksiGuru || '',
      status: (rpp.status?.toString().toLowerCase() === 'final' || rpp.status === 'Terlaksana' ? 'final' : 'draft')
    });
    setIsEditorOpen(true);
  };

  // Apply Admin Template into Form
  const handleApplyAdminTemplate = (templateId: string) => {
    const tpl = rppTemplates.find(t => t.id === templateId);
    if (!tpl) return;

    const matchedCp = capaianPembelajarans.find(c => c.id === tpl.capaianPembelajaranId);
    const matchedTps = tujuanPembelajarans
      .filter(t => tpl.tujuanPembelajaranIds?.includes(t.id) || t.capaianPembelajaranId === tpl.capaianPembelajaranId || t.cpId === tpl.capaianPembelajaranId)
      .map(t => ({
        tpId: t.id,
        kodeTP: t.kodeTP,
        judul: t.judul,
        indikator: t.indikatorKetercapaian || []
      }));

    const parsedSumber = Array.isArray(tpl.sumberBelajar)
      ? tpl.sumberBelajar
      : (tpl.sumberBelajar ? [tpl.sumberBelajar] : []);

    setFormData(prev => ({
      ...prev,
      templateRefId: tpl.id,
      judul: tpl.judul,
      mataPelajaranId: tpl.mataPelajaranId || '',
      mataPelajaranNama: tpl.mataPelajaranNama,
      fase: tpl.fase || 'Fase D (Tingkat Menengah / SMP)',
      alokasiWaktu: tpl.alokasiWaktu || tpl.alokasiWaktuDefault || '2 x 45 Menit',
      capaianPembelajaranId: tpl.capaianPembelajaranId || '',
      capaianPembelajaranDeskripsi: matchedCp?.deskripsiCP || matchedCp?.deskripsi || '',
      tujuanPembelajaranDipilih: matchedTps,
      kegiatanPembukaan: getTemplateStepList(tpl.pembukaanDefault, tpl.kegiatanPendahuluan),
      kegiatanInti: getTemplateStepList(tpl.intiDefault, tpl.kegiatanInti),
      kegiatanPenutup: getTemplateStepList(tpl.penutupDefault, tpl.kegiatanPenutup),
      mediaDanAlat: [...(tpl.mediaDanAlat || (tpl.mediaPembelajaran ? [tpl.mediaPembelajaran] : []))],
      sumberBelajar: [...parsedSumber],
      asesmenMetode: [...(tpl.asesmenMetode || (tpl.asesmenPenilaian ? [tpl.asesmenPenilaian] : []))]
    }));
    showToast(`Template "${tpl.judul}" berhasil dimuat ke rancangan RPP Anda!`);
  };

  // Duplicate RPP
  const handleDuplicateRpp = async (rpp: GuruRppDokumen) => {
    const origTitle = rpp.judul || rpp.materiPokok || 'RPP';
    const newTitle = `${origTitle} (Salinan)`;
    await createGuruRpp({
      guruId: currentGuruId,
      guruNama: currentGuruNama,
      templateRefId: rpp.templateRefId,
      judul: newTitle,
      materiPokok: newTitle,
      mataPelajaranId: rpp.mataPelajaranId,
      mataPelajaranNama: rpp.mataPelajaranNama,
      kelasAtauHalaqah: rpp.kelasAtauHalaqah,
      semester: rpp.semester,
      fase: rpp.fase,
      alokasiWaktu: rpp.alokasiWaktu,
      pertemuanKe: (Number(rpp.pertemuanKe) || 1) + 1,
      tanggalPelaksanaan: new Date().toISOString().split('T')[0],
      capaianPembelajaranId: rpp.capaianPembelajaranId,
      capaianPembelajaranDeskripsi: rpp.capaianPembelajaranDeskripsi,
      tujuanPembelajaranDipilih: rpp.tujuanPembelajaranDipilih,
      kegiatanPembukaan: rpp.kegiatanPembukaan,
      kegiatanInti: rpp.kegiatanInti,
      kegiatanPenutup: rpp.kegiatanPenutup,
      mediaDanAlat: rpp.mediaDanAlat,
      sumberBelajar: rpp.sumberBelajar,
      asesmenMetode: rpp.asesmenMetode,
      refleksiGuru: '',
      status: 'draft'
    });
    showToast(`Berhasil menggandakan RPP: "${newTitle}"`);
  };

  // Save RPP (Draft or Final)
  const handleSaveRpp = async (targetStatus: 'draft' | 'final') => {
    if (!formData.judul.trim()) {
      alert('Mohon isi Judul RPP.');
      return;
    }

    const payload = {
      ...formData,
      guruId: currentGuruId,
      guruNama: currentGuruNama,
      status: targetStatus
    };

    if (editingRpp) {
      await updateGuruRpp(editingRpp.id, payload);
      showToast(`RPP "${formData.judul}" berhasil diperbarui.`);
    } else {
      await createGuruRpp(payload);
      showToast(`RPP "${formData.judul}" berhasil disimpan (${targetStatus === 'final' ? 'Final' : 'Draft'}).`);
    }

    setIsEditorOpen(false);
  };

  // Add Item From Bank Aktivitas
  const handlePickActivityFromBank = (act: BankAktivitasPembelajaran) => {
    if (activityTargetField === 'pembukaan') {
      setFormData(prev => ({
        ...prev,
        kegiatanPembukaan: [...prev.kegiatanPembukaan, act.deskripsi]
      }));
    } else if (activityTargetField === 'inti') {
      setFormData(prev => ({
        ...prev,
        kegiatanInti: [...prev.kegiatanInti, act.deskripsi]
      }));
    } else if (activityTargetField === 'penutup') {
      setFormData(prev => ({
        ...prev,
        kegiatanPenutup: [...prev.kegiatanPenutup, act.deskripsi]
      }));
    }
    setIsActivityPickerOpen(false);
    showToast(`Aktivitas "${act.judul}" ditambahkan ke bagian ${activityTargetField}!`);
  };

  // Action: Create RPP pre-configured with a specific CP
  const handleCreateRppFromCp = (cp: CapaianPembelajaran) => {
    handleOpenNewRpp();
    const relatedTps = (tujuanPembelajarans || []).filter(t => (t.capaianPembelajaranId === cp.id || t.cpId === cp.id));
    const initialSelectedTps = relatedTps.slice(0, 3).map(t => ({
      tpId: t.id,
      kodeTP: t.kodeTP,
      judul: t.judul,
      indikator: t.indikatorKetercapaian || []
    }));

    setFormData(prev => ({
      ...prev,
      judul: `RPP: ${cp.mataPelajaranNama} - ${cp.elemen}`,
      mataPelajaranId: cp.mataPelajaranId || prev.mataPelajaranId,
      mataPelajaranNama: cp.mataPelajaranNama,
      fase: cp.fase || prev.fase,
      capaianPembelajaranId: cp.id,
      capaianPembelajaranDeskripsi: cp.deskripsiCP || cp.deskripsi || '',
      tujuanPembelajaranDipilih: initialSelectedTps
    }));
    setIsEditorOpen(true);
    setSelectedCpDetail(null);
    showToast(`Memulai penyusunan RPP dari CP "${cp.elemen}"`);
  };

  // Action: Create RPP pre-configured with a specific TP
  const handleCreateRppFromTp = (tp: TujuanPembelajaran) => {
    handleOpenNewRpp();
    const parentCp = (capaianPembelajarans || []).find(c => c.id === tp.capaianPembelajaranId || c.id === tp.cpId);
    setFormData(prev => ({
      ...prev,
      judul: `RPP: ${tp.judul || 'Pembelajaran'}`,
      mataPelajaranId: parentCp?.mataPelajaranId || tp.mataPelajaranId || prev.mataPelajaranId,
      mataPelajaranNama: parentCp?.mataPelajaranNama || tp.mataPelajaranNama || prev.mataPelajaranNama,
      fase: parentCp?.fase || prev.fase,
      capaianPembelajaranId: parentCp?.id || '',
      capaianPembelajaranDeskripsi: parentCp?.deskripsiCP || parentCp?.deskripsi || '',
      tujuanPembelajaranDipilih: [{
        tpId: tp.id,
        kodeTP: tp.kodeTP,
        judul: tp.judul,
        indikator: tp.indikatorKetercapaian || []
      }]
    }));
    setIsEditorOpen(true);
    setSelectedTpDetail(null);
    showToast(`Memulai penyusunan RPP dari TP "${tp.kodeTP}"`);
  };

  // Action: Use Master Template RPP Admin
  const handleUseTemplate = (tpl: RppTemplateAdmin) => {
    setEditingRpp(null);
    setEditorStep(1);
    handleApplyAdminTemplate(tpl.id);
    setIsEditorOpen(true);
    setSelectedTemplateDetail(null);
  };

  // Trigger Native Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 bg-emerald-500/20 backdrop-blur-md rounded-lg border border-emerald-400/30 text-emerald-300">
                <FileText className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                WORKSPACE ADMINISTRASI PENGAJAR
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-sans">
              Administrasi Mengajar & RPP Guru
            </h1>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Akses Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan Template RPP resmi dari Admin, serta susun Rencana Pelaksanaan Pembelajaran (RPP / Modul Ajar) untuk halaqah Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewRpp}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-emerald-500/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Susun RPP Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => setActiveModuleTab('my_rpp')}
          className={`p-4 rounded-xl border transition text-left cursor-pointer flex items-center gap-3 ${
            activeModuleTab === 'my_rpp'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">RPP Saya</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{myRpps.length} Modul</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveModuleTab('admin_kurikulum');
            setAdminSubTab('cp');
          }}
          className={`p-4 rounded-xl border transition text-left cursor-pointer flex items-center gap-3 ${
            activeModuleTab === 'admin_kurikulum' && adminSubTab === 'cp'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">CP Lembaga</span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {capaianPembelajarans.length} Standar
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveModuleTab('admin_kurikulum');
            setAdminSubTab('tp');
          }}
          className={`p-4 rounded-xl border transition text-left cursor-pointer flex items-center gap-3 ${
            activeModuleTab === 'admin_kurikulum' && adminSubTab === 'tp'
              ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700 ring-2 ring-teal-500/20'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-teal-300 shadow-sm'
          }`}
        >
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">TP Lembaga</span>
            <span className="text-lg font-bold text-teal-700 dark:text-teal-400">
              {tujuanPembelajarans.length} Tujuan
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveModuleTab('admin_kurikulum');
            setAdminSubTab('template');
          }}
          className={`p-4 rounded-xl border transition text-left cursor-pointer flex items-center gap-3 ${
            activeModuleTab === 'admin_kurikulum' && adminSubTab === 'template'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-300 shadow-sm'
          }`}
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">RPP Master Admin</span>
            <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {rppTemplates.length} Template
            </span>
          </div>
        </button>
      </div>

      {/* Main Navigation Tabs: 2 Tabs Only (RPP Saya & Kurikulum Lembaga) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveModuleTab('my_rpp')}
          className={`px-4 sm:px-5 py-3 rounded-t-xl text-xs sm:text-sm font-bold transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer border-b-2 ${
            activeModuleTab === 'my_rpp'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>RPP Guru</span>
          <span className="text-[11px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-mono font-bold">
            {myRpps.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModuleTab('admin_kurikulum')}
          className={`px-4 sm:px-5 py-3 rounded-t-xl text-xs sm:text-sm font-bold transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer border-b-2 ${
            activeModuleTab === 'admin_kurikulum'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>CP-TP-RPP</span>
          <span className="text-[11px] px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full font-mono font-bold">
            {capaianPembelajarans.length + tujuanPembelajarans.length + rppTemplates.length} Standar
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RPP SAYA (PENYUSUNAN GURU) */}
      {/* ========================================================================= */}
      {activeModuleTab === 'my_rpp' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari RPP berdasarkan judul atau mata pelajaran..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

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

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="final">Final / Disetujui</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* RPP Cards Grid */}
          {filteredRpps.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum Ada Dokumen RPP</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Mulai susun Rencana Pelaksanaan Pembelajaran (RPP / Modul Ajar) untuk halaqah Anda dengan memilih template yang telah disiapkan lembaga.
              </p>
              <button
                onClick={handleOpenNewRpp}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat RPP Baru Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRpps.map(rpp => {
                return (
                  <div 
                    key={rpp.id}
                    className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {rpp.mataPelajaranNama}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {rpp.kelasAtauHalaqah}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1.5 leading-snug">
                            {rpp.judul}
                          </h3>
                        </div>

                        <div>
                          {rpp.status === 'final' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Final
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-850 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Pertemuan Ke: <strong>{rpp.pertemuanKe || 1}</strong></span>
                          <span>Semester: <strong>{rpp.semester}</strong></span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-2 italic">
                          CP: "{rpp.capaianPembelajaranDeskripsi || 'Capaian Pembelajaran terdaftar'}"
                        </p>

                        <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <Target className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{rpp.tujuanPembelajaranDipilih?.length || 0} Tujuan Pembelajaran</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewRpp(rpp)}
                          title="Pratinjau & Cetak Resmi"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pratinjau</span>
                        </button>
                        <button
                          onClick={() => handleDuplicateRpp(rpp)}
                          title="Gandakan RPP"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditRpp(rpp)}
                          title="Edit RPP"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteRpp({ id: rpp.id, judul: rpp.judul })}
                          title="Hapus RPP"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KURIKULUM & STANDAR LEMBAGA (CP, TP, & RPP ADMIN DALAM SATU TAB) */}
      {/* ========================================================================= */}
      {activeModuleTab === 'admin_kurikulum' && (
        <div className="space-y-5">
          {/* Header Banner Lembaga */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Bank Administrasi Kurikulum Lembaga
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30">
                    Standar Resmi Admin
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80 leading-relaxed max-w-3xl">
                  Seluruh <strong>Capaian Pembelajaran (CP)</strong>, <strong>Tujuan Pembelajaran (TP & KKTP)</strong>, dan <strong>Master Template RPP</strong> dari manajemen lembaga terintegrasi dalam satu tab ini. Anda dapat meninjau struktur terpadu atau langsung menyusun RPP halaqah dalam 1 klik.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
              <div className="text-center px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 min-w-[70px]">
                <span className="block text-[10px] text-emerald-200">CP</span>
                <span className="font-mono font-bold text-sm">{capaianPembelajarans.length}</span>
              </div>
              <div className="text-center px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 min-w-[70px]">
                <span className="block text-[10px] text-teal-200">TP</span>
                <span className="font-mono font-bold text-sm">{tujuanPembelajarans.length}</span>
              </div>
              <div className="text-center px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 min-w-[70px]">
                <span className="block text-[10px] text-blue-200">Template</span>
                <span className="font-mono font-bold text-sm">{rppTemplates.length}</span>
              </div>
            </div>
          </div>

          {/* Sub-Tabs View Switcher */}
          <div className="bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto p-1">
              <button
                onClick={() => setAdminSubTab('terpadu')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  adminSubTab === 'terpadu'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Struktur Terpadu (CP & TP)</span>
              </button>

              <button
                onClick={() => setAdminSubTab('cp')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  adminSubTab === 'cp'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Capaian Pembelajaran (CP)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  adminSubTab === 'cp' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {filteredAdminCps.length}
                </span>
              </button>

              <button
                onClick={() => setAdminSubTab('tp')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  adminSubTab === 'tp'
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Tujuan Pembelajaran (TP)</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  adminSubTab === 'tp' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {filteredAdminTps.length}
                </span>
              </button>

              <button
                onClick={() => setAdminSubTab('template')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  adminSubTab === 'template'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>RPP Standar Lembaga</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  adminSubTab === 'template' ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {filteredAdminTemplates.length}
                </span>
              </button>

              <button
                onClick={() => setAdminSubTab('standar_penilaian')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  adminSubTab === 'standar_penilaian'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Pedoman Penilaian Proporsional</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Resmi
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUB-VIEW 1: STRUKTUR TERPADU (CP & TP HIERARCHICAL) */}
          {/* ========================================================================= */}
          {adminSubTab === 'terpadu' && (
            <div className="space-y-4">
              {/* Filter Toolbar Terpadu */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari CP, elemen, materi, TP, atau KKTP..."
                      value={cpSearchQuery}
                      onChange={e => {
                        setCpSearchQuery(e.target.value);
                        setTpSearchQuery(e.target.value);
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <select
                    value={cpMapelFilter}
                    onChange={e => {
                      setCpMapelFilter(e.target.value);
                      setTpMapelFilter(e.target.value);
                    }}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Semua Mata Pelajaran</option>
                    {availableMapels.map(m => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredAdminCps.length === 0 ? (
                <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
                  <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada data kurikulum ditemukan</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Coba sesuaikan kata kunci pencarian atau filter mata pelajaran.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAdminCps.map(cp => {
                    const childTps = (tujuanPembelajarans || []).filter(
                      t => t.capaianPembelajaranId === cp.id || t.cpId === cp.id
                    );
                    const matchingTemplates = (rppTemplates || []).filter(
                      tpl => tpl.capaianPembelajaranId === cp.id || (tpl.mataPelajaranId && tpl.mataPelajaranId === cp.mataPelajaranId)
                    );

                    return (
                      <div
                        key={cp.id}
                        className="bg-white dark:bg-slate-950 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                      >
                        {/* CP Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-850">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-850">
                                {cp.kodeCP}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                                {cp.mataPelajaranNama}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Fase: {cp.fase}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base mt-2">
                              Elemen: {cp.elemen}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedCpDetail(cp)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail CP</span>
                            </button>
                            <button
                              onClick={() => handleCreateRppFromCp(cp)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Susun RPP dari CP Ini</span>
                            </button>
                          </div>
                        </div>

                        {/* Deskripsi CP */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                            Deskripsi Capaian Pembelajaran:
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {cp.deskripsiCP || cp.deskripsi}
                          </p>
                          {cp.rasional && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                              💡 Rasional: {cp.rasional}
                            </div>
                          )}
                        </div>

                        {/* Tujuan Pembelajaran Turunan (Nested) */}
                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-teal-600" />
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                Tujuan Pembelajaran (TP) Terhubung
                              </span>
                              <span className="text-[10px] px-2 py-0.2 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-full font-mono font-bold">
                                {childTps.length} TP
                              </span>
                            </div>
                          </div>

                          {childTps.length === 0 ? (
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 italic">
                              Belum ada Tujuan Pembelajaran yang dihubungkan ke CP ini oleh Admin.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {childTps.map(tp => (
                                <div
                                  key={tp.id}
                                  className="p-3 bg-teal-50/40 dark:bg-teal-950/20 rounded-xl border border-teal-200/70 dark:border-teal-900/40 space-y-2 flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="font-mono font-bold text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded border border-teal-200/70">
                                        {tp.kodeTP}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {tp.alokasiWaktuMenit || 90} mnt
                                      </span>
                                    </div>
                                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">
                                      {tp.judul || tp.deskripsi}
                                    </h5>
                                    {tp.indikatorKetercapaian && tp.indikatorKetercapaian.length > 0 && (
                                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                        KKTP: {tp.indikatorKetercapaian.join(' • ')}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-teal-200/40 dark:border-teal-900/30 flex items-center justify-between gap-1 text-[11px]">
                                    <button
                                      onClick={() => setSelectedTpDetail(tp)}
                                      className="text-slate-600 dark:text-slate-400 hover:text-teal-700 font-medium cursor-pointer"
                                    >
                                      Detail TP
                                    </button>
                                    <button
                                      onClick={() => handleCreateRppFromTp(tp)}
                                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Buat RPP dari TP</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Template RPP Terkait (jika ada) */}
                        {matchingTemplates.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-850 space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                Template RPP Standar Terkait:
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {matchingTemplates.slice(0, 2).map(tpl => (
                                <div
                                  key={tpl.id}
                                  className="p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 block">
                                      {tpl.mataPelajaranNama} • {tpl.fase}
                                    </span>
                                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                      {tpl.judul}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleUseTemplate(tpl)}
                                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Gunakan</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 2: CAPAIAN PEMBELAJARAN (CP) */}
          {/* ========================================================================= */}
          {adminSubTab === 'cp' && (
            <div className="space-y-4">
              {/* Filter Toolbar CP */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari kode CP, elemen, materi, fase..."
                      value={cpSearchQuery}
                      onChange={e => setCpSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <select
                    value={cpMapelFilter}
                    onChange={e => setCpMapelFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Semua Mata Pelajaran</option>
                    {availableMapels.map(m => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid CP Admin */}
              {filteredAdminCps.length === 0 ? (
                <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
                  <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada Capaian Pembelajaran (CP)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {cpSearchQuery || cpMapelFilter !== 'ALL'
                      ? 'Coba sesuaikan kata kunci pencarian atau filter mata pelajaran.'
                      : 'Admin belum menginput data Capaian Pembelajaran di menu Kurikulum.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAdminCps.map(cp => {
                    const connectedTps = (tujuanPembelajarans || []).filter(t => t.capaianPembelajaranId === cp.id || t.cpId === cp.id);
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

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Resmi Lembaga
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                              {cp.deskripsiCP || cp.deskripsi}
                            </p>
                            {cp.rasional && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                                💡 Rasional: {cp.rasional}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2 flex-wrap text-xs">
                          <button
                            onClick={() => {
                              setTpMapelFilter(cp.mataPelajaranId || 'ALL');
                              setTpCpFilter(cp.id);
                              setAdminSubTab('tp');
                            }}
                            className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 font-medium transition cursor-pointer"
                          >
                            <Target className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{connectedTps.length} TP Terhubung</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedCpDetail(cp)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail CP</span>
                            </button>
                            <button
                              onClick={() => handleCreateRppFromCp(cp)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Buat RPP</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 3: TUJUAN PEMBELAJARAN (TP) */}
          {/* ========================================================================= */}
          {adminSubTab === 'tp' && (
        <div className="space-y-4">
          <div className="bg-teal-50 dark:bg-teal-950/30 p-4 rounded-xl border border-teal-200 dark:border-teal-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-xs text-teal-950 dark:text-teal-200">
                  Tujuan Pembelajaran (TP) & Kriteria Ketercapaian (KKTP)
                </h3>
                <p className="text-[11px] text-teal-800 dark:text-teal-300/90 mt-0.5 leading-relaxed">
                  Rumusan turunan dari Capaian Pembelajaran yang disiapkan Admin untuk dipilih oleh pengajar saat membuat RPP atau penilaian tahsin & tahfidz.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold px-3 py-1 bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 rounded-lg border border-teal-300 dark:border-teal-800">
                {filteredAdminTps.length} TP Ditemukan
              </span>
            </div>
          </div>

          {/* Filter Toolbar TP */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode TP, judul, indikator, materi..."
                  value={tpSearchQuery}
                  onChange={e => setTpSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={tpMapelFilter}
                onChange={e => setTpMapelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Mata Pelajaran</option>
                {availableMapels.map(m => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>

              <select
                value={tpCpFilter}
                onChange={e => setTpCpFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[220px] truncate"
              >
                <option value="ALL">Semua Rujukan CP</option>
                {capaianPembelajarans.map(c => (
                  <option key={c.id} value={c.id}>{c.kodeCP} - {c.elemen}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid TP Admin */}
          {filteredAdminTps.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
              <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada Tujuan Pembelajaran (TP)</h3>
              <p className="text-xs text-slate-500 mt-1">
                {tpSearchQuery || tpMapelFilter !== 'ALL' || tpCpFilter !== 'ALL'
                  ? 'Coba ubah filter mata pelajaran atau kata kunci pencarian.'
                  : 'Admin belum menginput data Tujuan Pembelajaran di menu Kurikulum.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAdminTps.map(tp => {
                const parentCp = (capaianPembelajarans || []).find(c => c.id === tp.capaianPembelajaranId || c.id === tp.cpId);
                return (
                  <div
                    key={tp.id}
                    className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-teal-300 transition"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-bold text-xs bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-850">
                          {tp.kodeTP}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]">
                          {parentCp ? parentCp.mataPelajaranNama : tp.mataPelajaranNama}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug">
                        {tp.judul || tp.deskripsi}
                      </h4>

                      {tp.deskripsi && tp.judul && tp.deskripsi !== tp.judul && (
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed line-clamp-2">
                          {tp.deskripsi}
                        </p>
                      )}

                      {/* Indikator Ketercapaian */}
                      {tp.indikatorKetercapaian && tp.indikatorKetercapaian.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Indikator Ketercapaian ({tp.indikatorKetercapaian.length}):
                          </span>
                          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                            {tp.indikatorKetercapaian.slice(0, 3).map((ind, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-snug line-clamp-1">{ind}</span>
                              </li>
                            ))}
                            {tp.indikatorKetercapaian.length > 3 && (
                              <li className="text-[10px] text-teal-600 font-semibold pl-5">
                                +{tp.indikatorKetercapaian.length - 3} indikator lainnya
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {tp.alokasiWaktuMenit || 90} Menit
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedTpDetail(tp)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold rounded text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                        <button
                          onClick={() => handleCreateRppFromTp(tp)}
                          className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Buat RPP</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 4: TEMPLATE RPP STANDAR LEMBAGA */}
          {/* ========================================================================= */}
          {adminSubTab === 'template' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-xs text-blue-950 dark:text-blue-200">
                  RPP & Modul Ajar Standar Lembaga (Master Kurikulum)
                </h3>
                <p className="text-[11px] text-blue-800 dark:text-blue-300/90 mt-0.5 leading-relaxed">
                  Rencana pembelajaran terstandarisasi yang dibuat oleh Admin. Anda dapat meninjau rincian lengkapnya atau langsung <strong>menggunakan template ini</strong> untuk disesuaikan dengan halaqah Anda dalam 1 klik.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold px-3 py-1 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-300 dark:border-blue-800">
                {filteredAdminTemplates.length} Template Standar
              </span>
            </div>
          </div>

          {/* Filter Toolbar RPP Admin */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari judul modul, mata pelajaran, fase..."
                  value={templateSearchQuery}
                  onChange={e => setTemplateSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={templateMapelFilter}
                onChange={e => setTemplateMapelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Mata Pelajaran</option>
                {availableMapels.map(m => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid Template RPP Admin */}
          {filteredAdminTemplates.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum Ada Template RPP Admin</h3>
              <p className="text-xs text-slate-500 mt-1">
                {templateSearchQuery || templateMapelFilter !== 'ALL'
                  ? 'Coba sesuaikan kata kunci pencarian atau filter mata pelajaran.'
                  : 'Admin belum membuat Template RPP Master di menu Kurikulum & Modul.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAdminTemplates.map(tpl => {
                const parentCp = (capaianPembelajarans || []).find(c => c.id === tpl.capaianPembelajaranId);
                const openSteps = getTemplateStepList(tpl.pembukaanDefault, tpl.kegiatanPendahuluan);
                const intiSteps = getTemplateStepList(tpl.intiDefault, tpl.kegiatanInti);
                const penutupSteps = getTemplateStepList(tpl.penutupDefault, tpl.kegiatanPenutup);
                return (
                  <div
                    key={tpl.id}
                    className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                              {tpl.mataPelajaranNama}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {tpl.fase}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1.5 leading-snug">
                            {tpl.judul}
                          </h3>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 shrink-0">
                          Standar Resmi
                        </span>
                      </div>

                      <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                        <div>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">Capaian Pembelajaran (CP):</span>
                          <p className="text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-2">
                            {parentCp?.deskripsiCP || parentCp?.deskripsi || 'CP terdaftar di kurikulum'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Pembukaan:</span>
                            <strong className="text-blue-700 dark:text-blue-400">{openSteps.length} Langkah</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Kegiatan Inti:</span>
                            <strong className="text-emerald-700 dark:text-emerald-400">{intiSteps.length} Langkah</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Penutup:</span>
                            <strong className="text-amber-700 dark:text-amber-400">{penutupSteps.length} Langkah</strong>
                          </div>
                        </div>
                      </div>

                      {tpl.catatanAdmin && (
                        <p className="text-[11px] text-slate-500 italic bg-amber-50/60 dark:bg-amber-950/20 p-2 rounded border border-amber-200/50">
                          💡 Catatan Admin: {tpl.catatanAdmin}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-500 text-[11px]">{tpl.alokasiWaktu || '2 x 45 Menit'}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTemplateDetail(tpl)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Rincian RPP</span>
                        </button>
                        <button
                          onClick={() => handleUseTemplate(tpl)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gunakan Template Ini</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 5: PEDOMAN STANDAR PENILAIAN RESMI (SOP) */}
          {/* ========================================================================= */}
          {adminSubTab === 'standar_penilaian' && (
            <StandarPenilaianDokumen />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RPP WIZARD / STEP-BY-STEP EDITOR */}
      {/* ========================================================================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-5xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto flex flex-col justify-between">
            {/* Modal Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      {editingRpp ? 'Edit Rencana Pelaksanaan Pembelajaran (RPP)' : 'Penyusunan RPP / Modul Ajar Baru'}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Langkah {editorStep} dari 4: {
                        editorStep === 1 ? 'Identitas & Template RPP' :
                        editorStep === 2 ? 'Capaian & Tujuan Pembelajaran (CP/TP)' :
                        editorStep === 3 ? 'Langkah-Langkah Kegiatan (Pembukaan, Inti, Penutup)' :
                        'Media, Asesmen & Pengesahan'
                      }
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Progress Bar */}
              <div className="grid grid-cols-4 gap-2 pt-3">
                {[1, 2, 3, 4].map(step => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setEditorStep(step)}
                    className={`h-1.5 rounded-full transition cursor-pointer ${
                      editorStep >= step ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="py-2 text-xs space-y-4 flex-1">
              {/* ------------------------------------------------------------- */}
              {/* STEP 1: IDENTITAS & PILIH TEMPLATE ADMIN */}
              {/* ------------------------------------------------------------- */}
              {editorStep === 1 && (
                <div className="space-y-4">
                  {/* Template Quick Loader */}
                  {rppTemplates.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                          Gunakan Pilihan Template Standar Admin (Opsional):
                        </h4>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                        Memilih template akan otomatis mengisi Capaian, Tujuan, serta rangkaian langkah pembelajaran baku. Anda tetap bisa mengubah dan menyesuaikannya.
                      </p>
                      <div className="flex gap-2">
                        <select
                          onChange={e => {
                            if (e.target.value) handleApplyAdminTemplate(e.target.value);
                          }}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <option value="">-- Pilih Template RPP Tersedia --</option>
                          {rppTemplates.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.judul} ({t.mataPelajaranNama})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Judul RPP / Modul Ajar:
                      </label>
                      <input
                        type="text"
                        value={formData.judul}
                        onChange={e => setFormData(prev => ({ ...prev, judul: e.target.value }))}
                        placeholder="Contoh: RPP Tajwid Makharijul Huruf Pertemuan 1"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Mata Pelajaran:
                        </label>
                        <select
                          value={formData.mataPelajaranId}
                          onChange={e => {
                            const found = availableMapels.find(m => m.id === e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              mataPelajaranId: e.target.value,
                              mataPelajaranNama: found?.nama || prev.mataPelajaranNama
                            }));
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        >
                          {availableMapels.map(m => (
                            <option key={m.id} value={m.id}>{m.nama}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Halaqah / Kelas:
                        </label>
                        <input
                          type="text"
                          value={formData.kelasAtauHalaqah}
                          onChange={e => setFormData(prev => ({ ...prev, kelasAtauHalaqah: e.target.value }))}
                          placeholder="Contoh: Halaqah Abu Bakar / Kelas 7 Wustha"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Semester:
                        </label>
                        <select
                          value={formData.semester}
                          onChange={e => setFormData(prev => ({ ...prev, semester: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        >
                          <option value="Ganjil">Semester Ganjil</option>
                          <option value="Genap">Semester Genap</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Pertemuan Ke-:
                        </label>
                        <input
                          type="number"
                          value={formData.pertemuanKe}
                          onChange={e => setFormData(prev => ({ ...prev, pertemuanKe: Number(e.target.value) }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Alokasi Waktu:
                        </label>
                        <input
                          type="text"
                          value={formData.alokasiWaktu}
                          onChange={e => setFormData(prev => ({ ...prev, alokasiWaktu: e.target.value }))}
                          placeholder="2 x 45 Menit"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 2: CAPAIAN (CP) & TUJUAN PEMBELAJARAN (TP) */}
              {/* ------------------------------------------------------------- */}
              {editorStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pilih Capaian Pembelajaran (CP) Rujukan:
                    </label>
                    <select
                      value={formData.capaianPembelajaranId}
                      onChange={e => {
                        const cpId = e.target.value;
                        const selectedCp = capaianPembelajarans.find(c => c.id === cpId);
                        const relatedTps = tujuanPembelajarans.filter(t => t.capaianPembelajaranId === cpId);
                        setFormData(prev => ({
                          ...prev,
                          capaianPembelajaranId: cpId,
                          capaianPembelajaranDeskripsi: selectedCp?.deskripsiCP || '',
                          tujuanPembelajaranDipilih: relatedTps.map(t => ({
                            tpId: t.id,
                            kodeTP: t.kodeTP,
                            judul: t.judul,
                            indikator: t.indikatorKetercapaian || []
                          }))
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    >
                      {capaianPembelajarans.map(cp => (
                        <option key={cp.id} value={cp.id}>
                          {cp.mataPelajaranNama} - {cp.elemen}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.capaianPembelajaranDeskripsi && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Deskripsi Capaian Pembelajaran:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {formData.capaianPembelajaranDeskripsi}
                      </p>
                    </div>
                  )}

                  {/* Tujuan Pembelajaran Selection */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        Pilih Tujuan Pembelajaran (TP) untuk Pertemuan Ini:
                      </h4>
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        {formData.tujuanPembelajaranDipilih.length} TP Terpilih
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {tujuanPembelajarans
                        .filter(t => !formData.capaianPembelajaranId || t.capaianPembelajaranId === formData.capaianPembelajaranId)
                        .map(tp => {
                          const isSelected = formData.tujuanPembelajaranDipilih.some(item => item.tpId === tp.id);
                          return (
                            <div
                              key={tp.id}
                              onClick={() => {
                                setFormData(prev => {
                                  const exists = prev.tujuanPembelajaranDipilih.some(item => item.tpId === tp.id);
                                  const updated = exists
                                    ? prev.tujuanPembelajaranDipilih.filter(item => item.tpId !== tp.id)
                                    : [...prev.tujuanPembelajaranDipilih, {
                                        tpId: tp.id,
                                        kodeTP: tp.kodeTP,
                                        judul: tp.judul,
                                        indikator: tp.indikatorKetercapaian || []
                                      }];
                                  return { ...prev, tujuanPembelajaranDipilih: updated };
                                });
                              }}
                              className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                                isSelected 
                                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-1.5 py-0.2 rounded">
                                    {tp.kodeTP}
                                  </span>
                                  <h5 className="font-bold text-slate-800 dark:text-slate-200">
                                    {tp.judul}
                                  </h5>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {tp.deskripsi}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 3: LANGKAH-LANGKAH PEMBELAJARAN (PEMBUKAAN, INTI, PENUTUP) */}
              {/* ------------------------------------------------------------- */}
              {editorStep === 3 && (
                <div className="space-y-4">
                  {/* Section 1: Pembukaan */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        1. Kegiatan Pembukaan (Pendahuluan)
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActivityTargetField('pembukaan');
                            setIsActivityPickerOpen(true);
                          }}
                          className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pilih dari Bank</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            kegiatanPembukaan: [...prev.kegiatanPembukaan, '']
                          }))}
                          className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {formData.kegiatanPembukaan.map((act, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                          <input
                            type="text"
                            value={act}
                            onChange={e => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const updated = [...prev.kegiatanPembukaan];
                                updated[idx] = val;
                                return { ...prev, kegiatanPembukaan: updated };
                              });
                            }}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              kegiatanPembukaan: prev.kegiatanPembukaan.filter((_, i) => i !== idx)
                            }))}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Inti */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        2. Kegiatan Inti (Talaqqi, Praktik, Diskusi)
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActivityTargetField('inti');
                            setIsActivityPickerOpen(true);
                          }}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pilih dari Bank</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            kegiatanInti: [...prev.kegiatanInti, '']
                          }))}
                          className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {formData.kegiatanInti.map((act, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                          <input
                            type="text"
                            value={act}
                            onChange={e => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const updated = [...prev.kegiatanInti];
                                updated[idx] = val;
                                return { ...prev, kegiatanInti: updated };
                              });
                            }}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              kegiatanInti: prev.kegiatanInti.filter((_, i) => i !== idx)
                            }))}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Penutup */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        3. Kegiatan Penutup (Refleksi & Doa)
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActivityTargetField('penutup');
                            setIsActivityPickerOpen(true);
                          }}
                          className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pilih dari Bank</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            kegiatanPenutup: [...prev.kegiatanPenutup, '']
                          }))}
                          className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {formData.kegiatanPenutup.map((act, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                          <input
                            type="text"
                            value={act}
                            onChange={e => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const updated = [...prev.kegiatanPenutup];
                                updated[idx] = val;
                                return { ...prev, kegiatanPenutup: updated };
                              });
                            }}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              kegiatanPenutup: prev.kegiatanPenutup.filter((_, i) => i !== idx)
                            }))}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 4: MEDIA, ASESMEN & REFLEKSI */}
              {/* ------------------------------------------------------------- */}
              {editorStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Media & Alat Pembelajaran:
                      </label>
                      <textarea
                        rows={3}
                        value={formData.mediaDanAlat.join('\n')}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          mediaDanAlat: e.target.value.split('\n').filter(Boolean)
                        }))}
                        placeholder="1 baris per item..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Sumber Belajar:
                      </label>
                      <textarea
                        rows={3}
                        value={formData.sumberBelajar.join('\n')}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          sumberBelajar: e.target.value.split('\n').filter(Boolean)
                        }))}
                        placeholder="Kitab rujukan, modul surah..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Metode Asesmen & Penilaian Santri:
                    </label>
                    <textarea
                      rows={2}
                      value={formData.asesmenMetode.join('\n')}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        asesmenMetode: e.target.value.split('\n').filter(Boolean)
                      }))}
                      placeholder="Observasi talaqqi, rubrik tilawah..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan Refleksi Pengajar (Opsional):
                    </label>
                    <textarea
                      rows={2}
                      value={formData.refleksiGuru}
                      onChange={e => setFormData(prev => ({ ...prev, refleksiGuru: e.target.value }))}
                      placeholder="Catatan perkembangan pemahaman santri atau hal yang perlu ditingkatkan..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Navigation */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                {editorStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setEditorStep(prev => prev - 1)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveRpp('draft')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Draft
                </button>

                {editorStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setEditorStep(prev => prev + 1)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lanjut</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveRpp('final')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan & Tetapkan Final</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ACTIVITY PICKER (FROM BANK) */}
      {/* ========================================================================= */}
      {isActivityPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Pilih Aktivitas dari Bank ({activityTargetField.toUpperCase()})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih aktivitas pedagogis untuk disisipkan langsung ke langkah kegiatan RPP
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsActivityPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {bankAktivitas
                .filter(a => a.kategori === activityTargetField)
                .map(act => (
                  <div
                    key={act.id}
                    onClick={() => handlePickActivityFromBank(act)}
                    className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                        {act.judul}
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full font-mono">
                        {act.rekomendasiWaktuMenit} Menit
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {act.deskripsi}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE OFFICIAL RPP VIEW (A4 FORMAT) */}
      {/* ========================================================================= */}
      {previewRpp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-5xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-6 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:m-0">
            {/* Action Bar at Top */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div>
                <span className="text-sm font-bold text-slate-800">
                  Pratinjau Dokumen Cetak RPP / Modul Ajar
                </span>
                <p className="text-xs text-slate-500">
                  Format standar siap cetak atau ekspor ke PDF
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button
                  onClick={() => setPreviewRpp(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE AREA CONTENT */}
            {(() => {
              const pembukaanList = Array.isArray(previewRpp.kegiatanPembukaan)
                ? previewRpp.kegiatanPembukaan
                : (previewRpp.kegiatanPendahuluan ? [previewRpp.kegiatanPendahuluan] : []);

              const intiList = Array.isArray(previewRpp.kegiatanInti)
                ? previewRpp.kegiatanInti
                : (typeof previewRpp.kegiatanInti === 'string' && previewRpp.kegiatanInti ? [previewRpp.kegiatanInti] : []);

              const penutupList = Array.isArray(previewRpp.kegiatanPenutup)
                ? previewRpp.kegiatanPenutup
                : (typeof previewRpp.kegiatanPenutup === 'string' && previewRpp.kegiatanPenutup ? [previewRpp.kegiatanPenutup] : []);

              const mediaList = Array.isArray(previewRpp.mediaDanAlat)
                ? previewRpp.mediaDanAlat
                : (previewRpp.mediaDanSumber ? [previewRpp.mediaDanSumber] : []);

              const sumberList = Array.isArray(previewRpp.sumberBelajar)
                ? previewRpp.sumberBelajar
                : (typeof previewRpp.sumberBelajar === 'string' && previewRpp.sumberBelajar ? [previewRpp.sumberBelajar] : []);

              const asesmenList = Array.isArray(previewRpp.asesmenMetode)
                ? previewRpp.asesmenMetode
                : (previewRpp.asesmenRencana ? [previewRpp.asesmenRencana] : []);

              const namaLembaga = (strukturLembaga as any)?.namaLembaga || strukturLembaga?.yayasan?.nama || 'PONDOK PESANTREN / MADRASAH TAHFIDZUL QUR\'AN';
              const alamatLembaga = (strukturLembaga as any)?.alamatLembaga || strukturLembaga?.yayasan?.alamat || 'Jl. Pendidikan Islam Al-Qur\'an No. 1, Kompleks Halaqah';
              const pimpinanLembaga = (strukturLembaga as any)?.pimpinan || strukturLembaga?.sekolahList?.[0]?.namaPimpinan || 'Dr. H. Ahmad Dahlan, Lc., M.A.';

              return (
                <div className="space-y-6 font-serif leading-relaxed text-sm">
                  {/* Lembaga Header */}
                  <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
                    <h2 className="font-sans font-black text-base sm:text-lg uppercase tracking-wider text-slate-900">
                      {namaLembaga}
                    </h2>
                    <p className="text-xs font-sans text-slate-600">
                      {alamatLembaga}
                    </p>
                    <h3 className="font-sans font-bold text-xs uppercase tracking-widest pt-1 text-emerald-900">
                      RENCANA PELAKSANAAN PEMBELAJARAN (RPP / MODUL AJAR)
                    </h3>
                  </div>

                  {/* Table of Identity */}
                  <table className="w-full text-xs font-sans border-collapse border border-slate-300">
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="p-2 font-bold bg-slate-50 w-1/4">Nama Pengajar</td>
                        <td className="p-2 w-1/4">{previewRpp.guruNama}</td>
                        <td className="p-2 font-bold bg-slate-50 w-1/4">Semester / Pertemuan</td>
                        <td className="p-2 w-1/4">{previewRpp.semester} / Ke-{previewRpp.pertemuanKe || 1}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="p-2 font-bold bg-slate-50">Mata Pelajaran</td>
                        <td className="p-2">{previewRpp.mataPelajaranNama}</td>
                        <td className="p-2 font-bold bg-slate-50">Alokasi Waktu</td>
                        <td className="p-2">{previewRpp.alokasiWaktu}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-slate-50">Halaqah / Fase</td>
                        <td className="p-2">{previewRpp.kelasAtauHalaqah || previewRpp.halaqahNama || 'Halaqah'} ({previewRpp.fase || 'Fase D'})</td>
                        <td className="p-2 font-bold bg-slate-50">Tanggal Pelaksanaan</td>
                        <td className="p-2">{previewRpp.tanggalPelaksanaan || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* I. Capaian Pembelajaran */}
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-bold text-xs uppercase bg-slate-100 p-1.5 border-l-4 border-emerald-700">
                      A. Capaian Pembelajaran (CP)
                    </h4>
                    <p className="text-xs pl-2 text-slate-800">
                      {previewRpp.capaianPembelajaranDeskripsi || previewRpp.cpDeskripsi || 'Sesuai kurikulum baku yang telah ditetapkan.'}
                    </p>
                  </div>

                  {/* II. Tujuan Pembelajaran */}
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-bold text-xs uppercase bg-slate-100 p-1.5 border-l-4 border-emerald-700">
                      B. Tujuan Pembelajaran & Indikator Ketercapaian
                    </h4>
                    <div className="pl-2 space-y-2 text-xs">
                      {previewRpp.tujuanPembelajaranDipilih && previewRpp.tujuanPembelajaranDipilih.length > 0 ? (
                        previewRpp.tujuanPembelajaranDipilih.map((tp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <strong className="block text-slate-900 font-sans">
                              {idx + 1}. [{tp.kodeTP}] {tp.judul}
                            </strong>
                            {tp.indikator && tp.indikator.length > 0 && (
                              <ul className="list-disc pl-5 text-[11px] text-slate-700 space-y-0.5">
                                {tp.indikator.map((ind, i) => (
                                  <li key={i}>{ind}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-600 italic">Tujuan pembelajaran telah diselaraskan dengan capaian pembelajaran materi.</p>
                      )}
                    </div>
                  </div>

                  {/* III. Langkah-Langkah Pembelajaran */}
                  <div className="space-y-2">
                    <h4 className="font-sans font-bold text-xs uppercase bg-slate-100 p-1.5 border-l-4 border-emerald-700">
                      C. Langkah-Langkah Pembelajaran
                    </h4>

                    <div className="pl-2 space-y-3 text-xs">
                      {/* 1. Pembukaan */}
                      <div>
                        <strong className="font-sans text-slate-900 block mb-1">
                          1. Kegiatan Pembukaan (Pendahuluan)
                        </strong>
                        <ul className="list-disc pl-5 text-slate-800 space-y-1">
                          {pembukaanList.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      {/* 2. Inti */}
                      <div>
                        <strong className="font-sans text-slate-900 block mb-1">
                          2. Kegiatan Inti
                        </strong>
                        <ul className="list-disc pl-5 text-slate-800 space-y-1">
                          {intiList.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Penutup */}
                      <div>
                        <strong className="font-sans text-slate-900 block mb-1">
                          3. Kegiatan Penutup
                        </strong>
                        <ul className="list-disc pl-5 text-slate-800 space-y-1">
                          {penutupList.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* IV. Media, Sumber & Asesmen */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <h4 className="font-sans font-bold text-xs uppercase bg-slate-100 p-1.5 border-l-4 border-emerald-700">
                        D. Media & Sumber Belajar
                      </h4>
                      <ul className="list-disc pl-5 text-slate-800 space-y-0.5">
                        {mediaList.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                        {sumberList.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-sans font-bold text-xs uppercase bg-slate-100 p-1.5 border-l-4 border-emerald-700">
                        E. Penilaian (Asesmen)
                      </h4>
                      <ul className="list-disc pl-5 text-slate-800 space-y-0.5">
                        {asesmenList.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* V. Kolom Pengesahan Tanda Tangan */}
                  <div className="pt-8 grid grid-cols-2 text-center text-xs font-sans">
                    <div className="space-y-16">
                      <div>
                        <span>Mengetahui,</span>
                        <strong className="block font-bold">Kepala Madrasah / Pimpinan Lembaga</strong>
                      </div>
                      <div>
                        <strong className="block underline font-bold">
                          {pimpinanLembaga}
                        </strong>
                        <span className="text-[10px] text-slate-500">NIP: 19820512 200801 1 004</span>
                      </div>
                    </div>

                    <div className="space-y-16">
                      <div>
                        <span>Disusun oleh,</span>
                        <strong className="block font-bold">Guru Pengampu Halaqah</strong>
                      </div>
                      <div>
                        <strong className="block underline font-bold">{previewRpp.guruNama}</strong>
                        <span className="text-[10px] text-slate-500">Ustadz Pembimbing Halaqah</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL CAPAIAN PEMBELAJARAN (CP) */}
      {/* ========================================================================= */}
      {selectedCpDetail && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Rincian Capaian Pembelajaran (CP)
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {selectedCpDetail.kodeCP}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedCpDetail.mataPelajaranNama} ({selectedCpDetail.fase})
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCpDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Elemen Kompetensi
                </span>
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {selectedCpDetail.elemen}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Deskripsi Lengkap Capaian Pembelajaran
                </span>
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedCpDetail.deskripsiCP || selectedCpDetail.deskripsi}
                </div>
              </div>

              {selectedCpDetail.rasional && (
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Rasional & Landasan Kurikulum
                  </span>
                  <p className="bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    {selectedCpDetail.rasional}
                  </p>
                </div>
              )}

              {/* Daftar TP Terkait */}
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-2">
                  Tujuan Pembelajaran Terkait ({
                    (tujuanPembelajarans || []).filter(t => t.capaianPembelajaranId === selectedCpDetail.id || t.cpId === selectedCpDetail.id).length
                  })
                </span>
                <div className="space-y-2">
                  {(tujuanPembelajarans || [])
                    .filter(t => t.capaianPembelajaranId === selectedCpDetail.id || t.cpId === selectedCpDetail.id)
                    .map(tp => (
                      <div
                        key={tp.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/70 dark:border-slate-800 flex items-start gap-2"
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[10px] text-emerald-700 dark:text-emerald-400">
                              {tp.kodeTP}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {tp.judul}
                            </span>
                          </div>
                          {tp.deskripsi && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {tp.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  {(tujuanPembelajarans || []).filter(t => t.capaianPembelajaranId === selectedCpDetail.id || t.cpId === selectedCpDetail.id).length === 0 && (
                    <p className="text-slate-400 italic">Belum ada Tujuan Pembelajaran yang dihubungkan ke CP ini oleh Admin.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedCpDetail(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer text-slate-600 dark:text-slate-400"
              >
                Tutup
              </button>
              <button
                onClick={() => handleCreateRppFromCp(selectedCpDetail)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Susun RPP Menggunakan CP Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL TUJUAN PEMBELAJARAN (TP) */}
      {/* ========================================================================= */}
      {selectedTpDetail && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Rincian Tujuan Pembelajaran (TP)
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                      {selectedTpDetail.kodeTP}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Alokasi: {selectedTpDetail.alokasiWaktuMenit || 90} Menit
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTpDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Judul Kompetensi
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedTpDetail.judul}
                </p>
              </div>

              {selectedTpDetail.deskripsi && (
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Deskripsi Tujuan
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedTpDetail.deskripsi}
                  </div>
                </div>
              )}

              {/* Rujukan CP Induk */}
              {(() => {
                const parentCp = (capaianPembelajarans || []).find(
                  c => c.id === selectedTpDetail.capaianPembelajaranId || c.id === selectedTpDetail.cpId
                );
                return (
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[10px] block mb-1">
                      Rujukan Capaian Pembelajaran (CP)
                    </span>
                    {parentCp ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-xs text-emerald-900 dark:text-emerald-200">
                            {parentCp.kodeCP}
                          </span>
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                            {parentCp.elemen}
                          </span>
                          <span className="text-slate-500">({parentCp.mataPelajaranNama})</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300">
                          {parentCp.deskripsiCP || parentCp.deskripsi}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Mata Pelajaran: {selectedTpDetail.mataPelajaranNama || 'Umum'}</span>
                    )}
                  </div>
                );
              })()}

              {/* Indikator Ketercapaian */}
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-2">
                  Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
                </span>
                {selectedTpDetail.indikatorKetercapaian && selectedTpDetail.indikatorKetercapaian.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedTpDetail.indikatorKetercapaian.map((ind, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-start gap-2"
                      >
                        <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-800 dark:text-slate-200">{ind}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Belum ada indikator spesifik yang dirumuskan.</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedTpDetail(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer text-slate-600 dark:text-slate-400"
              >
                Tutup
              </button>
              <button
                onClick={() => handleCreateRppFromTp(selectedTpDetail)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Susun RPP dari TP Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL TEMPLATE RPP ADMIN */}
      {/* ========================================================================= */}
      {selectedTemplateDetail && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Template RPP Standar Lembaga
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {selectedTemplateDetail.mataPelajaranNama}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Fase: {selectedTemplateDetail.fase}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedTemplateDetail.alokasiWaktu || '2 x 45 Menit'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplateDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Judul Modul Pembelajaran
                </span>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {selectedTemplateDetail.judul}
                </h4>
              </div>

                {(() => {
                  const modalOpenSteps = getTemplateStepList(selectedTemplateDetail.pembukaanDefault, selectedTemplateDetail.kegiatanPendahuluan);
                  const modalIntiSteps = getTemplateStepList(selectedTemplateDetail.intiDefault, selectedTemplateDetail.kegiatanInti);
                  const modalPenutupSteps = getTemplateStepList(selectedTemplateDetail.penutupDefault, selectedTemplateDetail.kegiatanPenutup);

                  return (
                    <div className="space-y-3">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                        Rancangan Sintaks Pembelajaran
                      </span>

                      <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900 dark:text-blue-200 text-xs">
                            1. Kegiatan Pembukaan
                          </span>
                          <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                            {modalOpenSteps.length} Langkah
                          </span>
                        </div>
                        <ul className="space-y-1.5 pl-2">
                          {modalOpenSteps.map((step, idx) => (
                            <li key={idx} className="text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <span className="font-bold text-blue-600 shrink-0">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                            2. Kegiatan Inti Pembelajaran
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                            {modalIntiSteps.length} Langkah
                          </span>
                        </div>
                        <ul className="space-y-1.5 pl-2">
                          {modalIntiSteps.map((step, idx) => (
                            <li key={idx} className="text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <span className="font-bold text-emerald-600 shrink-0">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                            3. Kegiatan Penutup & Refleksi
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                            {modalPenutupSteps.length} Langkah
                          </span>
                        </div>
                        <ul className="space-y-1.5 pl-2">
                          {modalPenutupSteps.map((step, idx) => (
                            <li key={idx} className="text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <span className="font-bold text-amber-600 shrink-0">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

              {/* Media & Asesmen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Media & Alat Ajar Default
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {selectedTemplateDetail.mediaDanAlat?.join(', ') || selectedTemplateDetail.mediaPembelajaran || 'Al-Qur\'an Mushaf Utsmani, Buku Prestasi'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Metode Asesmen Default
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {selectedTemplateDetail.asesmenMetode?.join(', ') || selectedTemplateDetail.asesmenPenilaian || 'Tes Lisan Tahsin & Penilaian Formatif Harian'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedTemplateDetail(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer text-slate-600 dark:text-slate-400"
              >
                Tutup
              </button>
              <button
                onClick={() => handleUseTemplate(selectedTemplateDetail)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gunakan Template Ini Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete RPP Modal */}
      {confirmDeleteRpp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Hapus Dokumen RPP</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus RPP <strong>"{confirmDeleteRpp.judul}"</strong>? Dokumen ini akan dihapus secara permanen.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteRpp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteGuruRpp(confirmDeleteRpp.id);
                  setConfirmDeleteRpp(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Ya, Hapus RPP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
