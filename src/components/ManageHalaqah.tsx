/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusAktif } from '../types';
import { Avatar } from './Avatar';
import {
  Plus, 
  Trash2, 
  Edit3, 
  Users, 
  UserPlus,
  Calendar,
  Search,
  Sparkles,
  Link,
  CheckCircle2,
  X,
  School,
  UserCheck
} from 'lucide-react';

export const ManageHalaqah: React.FC = () => {
  const { 
    gurus, 
    siswas, 
    halaqahs,
    createHalaqah,
    updateHalaqah,
    deleteHalaqah,
    updateSiswa,
    strukturLembaga
  } = useApp();

  // Modal control triggers
  const [isHalaqahModalOpen, setIsHalaqahModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Edit trackers
  const [editingHalaqahId, setEditingHalaqahId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nama: string } | null>(null);

  // Filters & Search
  const [filterSekolahId, setFilterSekolahId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection method toggle in modal
  const [halaqahSelectionModel, setHalaqahSelectionModel] = useState<'direktorat' | 'langsung_sekolah'>('direktorat');

  // Halaqah form values
  const [halaqahForm, setHalaqForm] = useState({
    namaHalaqah: '',
    guruPembimbingId: '',
    guruPembimbingNama: '',
    kapasitasPeserta: 10,
    keterangan: '',
    hariKegiatan: '',
    waktuKegiatan: '',
    status: StatusAktif.AKTIF,
    warnaIdentitas: '#10B981',
    fotoHalaqah: '',
    sekolahId: '',
    jenjangId: '',
    direktoratId: '',
    sourceType: 'foundation' as 'foundation' | 'private_halaqah'
  });

  // Assign Student Modal local states
  const [assignHalaqahId, setAssignHalaqahId] = useState('');
  const [assignStudentSearch, setAssignStudentSearch] = useState('');
  const [onlySchoolStudents, setOnlySchoolStudents] = useState(true);

  // All foundation halaqahs
  const foundationHalaqahs = useMemo(() => {
    return halaqahs.filter(h => h.sourceType !== 'private_halaqah');
  }, [halaqahs]);

  // Filtered halaqahs for display
  const displayedHalaqahs = useMemo(() => {
    return foundationHalaqahs.filter(h => {
      if (filterSekolahId !== 'all' && h.sekolahId !== filterSekolahId) return false;
      if (filterStatus !== 'all' && h.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = h.namaHalaqah.toLowerCase().includes(query);
        const matchGuru = (h.guruPembimbingNama || '').toLowerCase().includes(query);
        const matchSekolah = (h.sekolahNama || '').toLowerCase().includes(query);
        if (!matchName && !matchGuru && !matchSekolah) return false;
      }
      return true;
    });
  }, [foundationHalaqahs, filterSekolahId, filterStatus, searchQuery]);

  // Overall Statistics
  const totalSantriFoundation = useMemo(() => {
    const halaqahIds = new Set(foundationHalaqahs.map(h => h.id));
    return siswas.filter(s => s.halaqahId && halaqahIds.has(s.halaqahId)).length;
  }, [foundationHalaqahs, siswas]);

  const santriTanpaHalaqahCount = useMemo(() => {
    return siswas.filter(s => !s.halaqahId && s.status === StatusAktif.AKTIF).length;
  }, [siswas]);

  // Setup Halaqah Modal Dialog for editing or creating
  const openHalaqahModal = (hId: string | null = null) => {
    if (hId) {
      setEditingHalaqahId(hId);
      const hObj = halaqahs.find(h => h.id === hId);
      if (hObj) {
        const schObj = hObj.sekolahId ? (strukturLembaga.sekolahList || []).find(s => s.id === hObj.sekolahId) : null;
        const initialDirektoratId = hObj.direktoratId || schObj?.direktoratId || '';

        setHalaqahSelectionModel(initialDirektoratId ? 'direktorat' : 'langsung_sekolah');

        setHalaqForm({
          namaHalaqah: hObj.namaHalaqah,
          guruPembimbingId: hObj.guruPembimbingId || '',
          guruPembimbingNama: hObj.guruPembimbingNama || '',
          kapasitasPeserta: hObj.kapasitasPeserta || 10,
          keterangan: hObj.keterangan || '',
          hariKegiatan: hObj.hariKegiatan || '',
          waktuKegiatan: hObj.waktuKegiatan || '',
          status: hObj.status || StatusAktif.AKTIF,
          warnaIdentitas: hObj.warnaIdentitas || '#10B981',
          fotoHalaqah: hObj.fotoHalaqah || '',
          sekolahId: hObj.sekolahId || '',
          jenjangId: hObj.jenjangId || hObj.id || '',
          direktoratId: initialDirektoratId,
          sourceType: 'foundation'
        });
      }
    } else {
      setEditingHalaqahId(null);
      const defaultSchool = strukturLembaga.sekolahList?.[0];
      setHalaqahSelectionModel(defaultSchool?.direktoratId ? 'direktorat' : 'langsung_sekolah');
      setHalaqForm({
        namaHalaqah: '',
        guruPembimbingId: gurus[0]?.id || '',
        guruPembimbingNama: gurus[0]?.namaLengkap || '',
        kapasitasPeserta: 10,
        keterangan: '',
        hariKegiatan: 'Senin - Jumat',
        waktuKegiatan: '16:00 - 17:30 WIB',
        status: StatusAktif.AKTIF,
        warnaIdentitas: getRandomWarnaPreset(),
        fotoHalaqah: '',
        sekolahId: defaultSchool?.id || '',
        jenjangId: '',
        direktoratId: defaultSchool?.direktoratId || '',
        sourceType: 'foundation'
      });
    }
    setIsHalaqahModalOpen(true);
  };

  const triggerHalaqahImageUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHalaqForm(prev => ({
          ...prev,
          fotoHalaqah: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHalaqahSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!halaqahForm.namaHalaqah.trim()) return;

    const gObj = gurus.find(g => g.id === halaqahForm.guruPembimbingId);
    const resolvedGuruNama = gObj?.namaLengkap || halaqahForm.guruPembimbingNama || 'Belum Ditugasi';
    const schObj = halaqahForm.sekolahId ? (strukturLembaga.sekolahList || []).find(s => s.id === halaqahForm.sekolahId) : null;
    const dirObj = halaqahForm.direktoratId ? (strukturLembaga.direktoratList || []).find(d => d.id === halaqahForm.direktoratId) : null;
    
    if (editingHalaqahId) {
      updateHalaqah(editingHalaqahId, {
        namaHalaqah: halaqahForm.namaHalaqah,
        guruPembimbingId: halaqahForm.guruPembimbingId,
        guruPembimbingNama: resolvedGuruNama,
        kapasitasPeserta: Math.max(1, Number(halaqahForm.kapasitasPeserta)),
        keterangan: halaqahForm.keterangan,
        hariKegiatan: halaqahForm.hariKegiatan,
        waktuKegiatan: halaqahForm.waktuKegiatan,
        status: halaqahForm.status,
        warnaIdentitas: halaqahForm.warnaIdentitas,
        fotoHalaqah: halaqahForm.fotoHalaqah,
        sekolahId: halaqahForm.sekolahId,
        jenjangId: halaqahForm.jenjangId || editingHalaqahId,
        sekolahNama: schObj ? schObj.nama : '',
        jenjangNama: halaqahForm.namaHalaqah,
        direktoratId: halaqahForm.direktoratId || schObj?.direktoratId || '',
        direktoratNama: dirObj ? dirObj.nama : '',
        sourceType: 'foundation'
      });
    } else {
      createHalaqah({
        namaHalaqah: halaqahForm.namaHalaqah,
        guruPembimbingId: halaqahForm.guruPembimbingId,
        guruPembimbingNama: resolvedGuruNama,
        kapasitasPeserta: Math.max(1, Number(halaqahForm.kapasitasPeserta)),
        keterangan: halaqahForm.keterangan,
        hariKegiatan: halaqahForm.hariKegiatan,
        waktuKegiatan: halaqahForm.waktuKegiatan,
        status: halaqahForm.status,
        warnaIdentitas: halaqahForm.warnaIdentitas,
        fotoHalaqah: halaqahForm.fotoHalaqah,
        sekolahId: halaqahForm.sekolahId,
        jenjangId: halaqahForm.jenjangId,
        sekolahNama: schObj ? schObj.nama : '',
        jenjangNama: halaqahForm.namaHalaqah,
        direktoratId: halaqahForm.direktoratId || schObj?.direktoratId || '',
        direktoratNama: dirObj ? dirObj.nama : '',
        sourceType: 'foundation'
      });
    }
    setIsHalaqahModalOpen(false);
  };

  // Setup Delete Halaqah
  const handleDeleteHalaqah = (hId: string, nama: string) => {
    setConfirmDelete({ id: hId, nama });
  };

  const executeDeleteHalaqah = () => {
    if (!confirmDelete) return;
    deleteHalaqah(confirmDelete.id);
    setConfirmDelete(null);
  };

  // Roster grouping assignment
  const openAssignModal = (studentId: string = '', halId: string = '') => {
    setAssignHalaqahId(halId || foundationHalaqahs[0]?.id || '');
    setAssignStudentSearch('');
    setOnlySchoolStudents(true);
    setIsAssignModalOpen(true);
  };

  const colorPresets = [
    '#10B981', // emerald
    '#3B82F6', // blue
    '#EC4899', // pink
    '#F59E0B', // amber
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#14B8A6'  // teal
  ];

  function getRandomWarnaPreset() {
    return colorPresets[Math.floor(Math.random() * colorPresets.length)];
  }

  return (
    <div className="space-y-6">
      
      {/* Upper Title elements */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
              Manajemen Halaqah Lembaga
            </h2>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              {foundationHalaqahs.length} Halaqah
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola rincian bimbingan tahfidz, penugasan ustadz, dan pemetaan santri naungan unit lembaga
          </p>
        </div>

        {/* Buttons trigger */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            id="btn-add-halaqah"
            onClick={() => openHalaqahModal()}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Halaqah Baru
          </button>

          <button
            id="btn-assign-siswa-halaqah"
            onClick={() => openAssignModal()}
            className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition active:scale-95"
          >
            <UserPlus className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Kelompokkan Santri
          </button>
        </div>
      </div>

      {/* Auto-Sync Notice Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/40 border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
            <Link className="h-4 w-4" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 text-xs">
            <strong className="text-emerald-800 dark:text-emerald-300">Sinkronisasi Otomatis Aktif:</strong> Semua nama halaqah dan pembimbing yang dibuat pada menu <strong>LEMBAGA &gt; Pengurusan Unit (DATA HALAQAH)</strong> otomatis tampil dan terkelola secara langsung di halaman ini.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Tersinkron
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Halaqah</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{foundationHalaqahs.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Santri Terbina</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{totalSantriFoundation}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Belum Ada Halaqah</p>
            <p className="text-lg font-black text-amber-600">{santriTanpaHalaqahCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Satuan Unit / Markaz</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{(strukturLembaga.sekolahList || []).length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama halaqah atau pembimbing..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1.5 py-1"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Satuan Unit / Markaz Filter */}
          <select
            value={filterSekolahId}
            onChange={(e) => setFilterSekolahId(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">Semua Satuan Unit / Markaz ({foundationHalaqahs.length})</option>
            {(strukturLembaga.sekolahList || []).map(s => {
              const count = foundationHalaqahs.filter(h => h.sekolahId === s.id).length;
              return (
                <option key={s.id} value={s.id}>{s.nama} ({count})</option>
              );
            })}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value={StatusAktif.AKTIF}>Aktif</option>
            <option value={StatusAktif.NON_AKTIF}>Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* Grid Content List */}
      {displayedHalaqahs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Halaqah yang Sesuai</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Halaqah dapat dibuat melalui tombol "Tambah Halaqah Baru" atau otomatis didaftarkan melalui menu LEMBAGA &gt; Pengurusan Unit (DATA HALAQAH).
          </p>
          <button
            onClick={() => openHalaqahModal()}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Halaqah Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedHalaqahs.map((halaqah) => {
            const hStudents = siswas.filter(s => s.halaqahId === halaqah.id);
            const fillRatio = (hStudents.length / (halaqah.kapasitasPeserta || 10)) * 100;
            const isFull = hStudents.length >= (halaqah.kapasitasPeserta || 10);
            const linkedSchool = (strukturLembaga.sekolahList || []).find(s => s.id === halaqah.sekolahId);

            return (
              <div 
                key={halaqah.id} 
                className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden relative"
              >
                {/* Visual identity stripe */}
                <div className="h-2 w-full" style={{ backgroundColor: halaqah.warnaIdentitas || '#10B981' }} />
                
                {/* Content area */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Title and stats */}
                  <div className="space-y-1">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse mb-2">
                      <Avatar 
                        namaLengkap={halaqah.namaHalaqah} 
                        fotoProfil={halaqah.fotoHalaqah} 
                        className="w-11 h-11 text-xs font-bold shrink-0 border border-slate-100 dark:border-slate-800 rounded-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-sans font-bold text-slate-900 dark:text-white text-sm md:text-base truncate block" title={halaqah.namaHalaqah}>
                            {halaqah.namaHalaqah}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                            halaqah.status === StatusAktif.AKTIF 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350' 
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                          }`}>
                            {halaqah.status}
                          </span>
                        </div>

                        {/* Unit Affiliation Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {linkedSchool ? (
                            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-bold">
                              <School className="w-3 h-3 text-indigo-600" />
                              {linkedSchool.nama}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md font-bold">
                              Lembaga Umum
                            </span>
                          )}

                          {/* Jadwal Hari Pembelajaran Badge */}
                          {halaqah.hariKegiatan && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-semibold truncate max-w-full">
                              <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                              {halaqah.hariKegiatan}
                              {halaqah.waktuKegiatan && <span className="opacity-75">({halaqah.waktuKegiatan})</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                      {halaqah.keterangan || `Kelompok halaqah binaan resmi ${linkedSchool?.nama || 'Lembaga'}.`}
                    </p>
                  </div>

                  {/* Advisor */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">USTADZ/AH PEMBIMBING</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {halaqah.guruPembimbingNama || gurus.find(g => g.id === halaqah.guruPembimbingId)?.namaLengkap || 'Belum Ditugasi'}
                    </span>
                  </div>

                  {/* Roster counts progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Kapasitas Santri:</span>
                      <span className={`font-mono font-bold ${isFull ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {hStudents.length} / {halaqah.kapasitasPeserta || 10} Santri
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min(100, fillRatio)}%`,
                          backgroundColor: halaqah.warnaIdentitas || '#10B981'
                        }}
                      />
                    </div>
                  </div>

                  {/* Student list summary names */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">ANGGOTA AKTIF ({hStudents.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {hStudents.slice(0, 4).map(st => (
                        <span key={st.id} className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                          {st.namaLengkap.split(' ')[0]}
                        </span>
                      ))}
                      {hStudents.length > 4 && (
                        <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-slate-900 dark:text-emerald-400 rounded text-[10px] font-bold">
                          +{hStudents.length - 4} santri
                        </span>
                      )}
                      {hStudents.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">Belum ada anggota. Klik "+ Anggota"</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card controls */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => openAssignModal('', halaqah.id)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Anggota
                  </button>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openHalaqahModal(halaqah.id)}
                      className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 rounded shadow-xs cursor-pointer transition"
                      title="Edit Halaqah"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHalaqah(halaqah.id, halaqah.namaHalaqah)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-white dark:hover:bg-slate-800 rounded shadow-xs cursor-pointer transition"
                      title="Hapus Halaqah"
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

      {/* ==========================================
          MODAL DIALOG: EDIT & CREATE HALAQAH
         ========================================== */}
      {isHalaqahModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl relative border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up my-auto">
            {/* Header */}
            <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
                  {editingHalaqahId ? 'Edit Info Halaqah Lembaga' : 'Tambah Halaqah Baru'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Data otomatis terhubung dengan menu LEMBAGA &gt; Unit &amp; Halaqah
                </p>
              </div>
                <button
                  onClick={() => setIsHalaqahModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleHalaqahSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                {/* Photo & Color identity */}
                <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Avatar 
                    namaLengkap={halaqahForm.namaHalaqah || 'Halaqah'} 
                    fotoProfil={halaqahForm.fotoHalaqah} 
                    className="w-12 h-12 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-xl shrink-0"
                  />
                  <div className="text-xs space-y-1 flex-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Logo / Foto Halaqah</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={triggerHalaqahImageUploadSim}
                        className="text-[10px] text-slate-400 block w-full outline-hidden"
                      />
                      {halaqahForm.fotoHalaqah && (
                        <button
                          type="button"
                          onClick={() => setHalaqForm(prev => ({ ...prev, fotoHalaqah: '' }))}
                          className="text-[10px] text-rose-600 hover:underline font-bold shrink-0"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nama halaqah */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    NAMA HALAQAH *
                  </label>
                  <input
                    type="text"
                    required
                    value={halaqahForm.namaHalaqah}
                    onChange={(e) => setHalaqForm(prev => ({ ...prev, namaHalaqah: e.target.value }))}
                    placeholder="Contoh: Halaqah Salman Al-Farisi"
                    className="mt-1 w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
                  />
                </div>

                {/* Advisor Select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    USTADZ / PEMBIMBING HALAQAH *
                  </label>
                  <select
                    value={halaqahForm.guruPembimbingId}
                    onChange={(e) => {
                      const selectedG = gurus.find(g => g.id === e.target.value);
                      setHalaqForm(prev => ({ 
                        ...prev, 
                        guruPembimbingId: e.target.value,
                        guruPembimbingNama: selectedG ? selectedG.namaLengkap : prev.guruPembimbingNama
                      }));
                    }}
                    className="mt-1 w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="">-- Pilih Ustadz Pembimbing --</option>
                    {gurus.map(g => (
                      <option key={g.id} value={g.id}>{g.namaLengkap} ({g.jabatan || 'Guru'})</option>
                    ))}
                  </select>
                </div>

                {/* Satuan Unit / Markaz */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    SATUAN UNIT / MARKAZ *
                  </label>
                  <select
                    required
                    value={halaqahForm.sekolahId}
                    onChange={(e) => setHalaqForm(prev => ({ ...prev, sekolahId: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="">-- Pilih Satuan Unit / Markaz --</option>
                    {(strukturLembaga.sekolahList || []).map(s => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                </div>

                {/* Capacity & Color presets */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">KAPASITAS MAKS</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={halaqahForm.kapasitasPeserta}
                      onChange={(e) => setHalaqForm(prev => ({ ...prev, kapasitasPeserta: Number(e.target.value) }))}
                      className="mt-1 w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">WARNA IDENTITAS</label>
                    <div className="flex items-center mt-1.5 space-x-1.5">
                      <input 
                        type="color" 
                        value={halaqahForm.warnaIdentitas} 
                        onChange={(e) => setHalaqForm(prev => ({ ...prev, warnaIdentitas: e.target.value }))}
                        className="w-8 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-medium">{halaqahForm.warnaIdentitas}</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">STATUS KEGIATAN</label>
                  <select
                    value={halaqahForm.status}
                    onChange={(e) => setHalaqForm(prev => ({ ...prev, status: e.target.value as StatusAktif }))}
                    className="mt-1 w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value={StatusAktif.AKTIF}>Aktif</option>
                    <option value={StatusAktif.NON_AKTIF}>Non-Aktif</option>
                  </select>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsHalaqahModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
                  >
                    {editingHalaqahId ? 'Simpan Perubahan' : 'Buat Halaqah Baru'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* ==========================================
          MODAL DIALOG: KELOMPOKKAN SANTRI
         ========================================== */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up my-auto">
            {/* Header */}
            <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Kelompokkan Santri ke Halaqah
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih kelompok halaqah tujuan, lalu tempatkan atau pindahkan santri
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              {/* Select target halaqah */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  1. PILIH HALAQAH TUJUAN *
                </label>
                <select
                  value={assignHalaqahId}
                  onChange={(e) => setAssignHalaqahId(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                >
                  <option value="">-- Pilih Halaqah Tujuan --</option>
                  {foundationHalaqahs.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.namaHalaqah} {h.sekolahNama ? `• Unit: ${h.sekolahNama}` : ''} (Pembimbing: {h.guruPembimbingNama || 'Belum Ditugasi'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Students roster */}
              {(() => {
                const targetHalaqah = foundationHalaqahs.find(h => h.id === assignHalaqahId);
                const assignedStudents = siswas.filter(s => s.halaqahId === assignHalaqahId);

                if (!assignHalaqahId || !targetHalaqah) {
                  return (
                    <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-dashed rounded-xl text-center text-xs text-slate-400">
                      Silakan pilih Halaqah Tujuan di atas untuk melihat dan mengelola daftar santri.
                    </div>
                  );
                }

                // Filtered students for assignment
                const candidateSiswas = siswas.filter(s => {
                  if (onlySchoolStudents && targetHalaqah.sekolahId) {
                    if (s.sekolahId && s.sekolahId !== targetHalaqah.sekolahId && s.halaqahId !== assignHalaqahId) {
                      return false;
                    }
                  }
                  if (assignStudentSearch.trim()) {
                    const q = assignStudentSearch.toLowerCase();
                    const matchName = s.namaLengkap.toLowerCase().includes(q);
                    const matchNis = (s.nis || '').toLowerCase().includes(q);
                    if (!matchName && !matchNis) return false;
                  }
                  return true;
                });

                return (
                  <div className="space-y-3">
                    {/* Halaqah Info Box */}
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-200">{targetHalaqah.namaHalaqah}</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          {targetHalaqah.sekolahNama || 'Lembaga'} • Pembimbing: {targetHalaqah.guruPembimbingNama}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">
                          {assignedStudents.length} / {targetHalaqah.kapasitasPeserta || 10}
                        </span>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Kapasitas</p>
                      </div>
                    </div>

                    {/* Filter and Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={assignStudentSearch}
                          onChange={(e) => setAssignStudentSearch(e.target.value)}
                          placeholder="Cari santri berdasarkan nama / NIS..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>

                      {targetHalaqah.sekolahId && (
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={onlySchoolStudents}
                            onChange={(e) => setOnlySchoolStudents(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          Khusus Unit {targetHalaqah.sekolahNama || 'Ini'}
                        </label>
                      )}
                    </div>

                    {/* Student List */}
                    <div className="max-h-[300px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1.5 scrollbar-thin">
                      {candidateSiswas.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          Tidak ditemukan santri yang sesuai kriteria pencarian.
                        </div>
                      ) : (
                        candidateSiswas.map(student => {
                          const isAlreadyInThisHalaqah = student.halaqahId === assignHalaqahId;
                          const hasOtherHalaqah = Boolean(student.halaqahId && student.halaqahId !== assignHalaqahId);
                          const originalHalaqahNama = student.halaqahNama;

                          return (
                            <div 
                              key={student.id} 
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                                isAlreadyInThisHalaqah 
                                  ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' 
                                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                              }`}
                            >
                              <div className="min-w-0 flex-1 mr-2">
                                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  <span className="truncate">{student.namaLengkap}</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-normal shrink-0">NIS: {student.nis}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {isAlreadyInThisHalaqah ? (
                                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                                      ✓ Aktif di Halaqah Ini
                                    </span>
                                  ) : hasOtherHalaqah ? (
                                    <span className="text-[9px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 truncate">
                                      Terdaftar di: <strong>{originalHalaqahNama || 'Halaqah Lain'}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold px-1.5 py-0.5 rounded">
                                      Belum Memiliki Halaqah
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isAlreadyInThisHalaqah ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateSiswa(student.id, { halaqahId: '', halaqahNama: '' });
                                    }}
                                    className="px-2.5 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg border border-rose-200 cursor-pointer"
                                    title="Keluarkan dari kelompok halaqah ini"
                                  >
                                    Keluarkan
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateSiswa(student.id, {
                                        halaqahId: assignHalaqahId,
                                        halaqahNama: targetHalaqah.namaHalaqah,
                                        jenjangId: targetHalaqah.jenjangId || targetHalaqah.id,
                                        sekolahId: student.sekolahId || targetHalaqah.sekolahId || ''
                                      });
                                    }}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer shadow-xs ${
                                      hasOtherHalaqah
                                        ? 'bg-amber-500 border-amber-400 hover:bg-amber-600 text-white'
                                        : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700 text-white'
                                    }`}
                                    title={hasOtherHalaqah ? "Pindahkan ke halaqah ini" : "Daftarkan ke halaqah ini"}
                                  >
                                    {hasOtherHalaqah ? 'Pindahkan' : 'Tempatkan'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition active:scale-95 shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up my-auto">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus kelompok halaqah <strong>{confirmDelete.nama}</strong>? Tindakan ini akan menghapus halaqah dari sistem dan pengurusan unit lembaga.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteHalaqah}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
