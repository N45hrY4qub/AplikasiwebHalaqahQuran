/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MataPelajaran, SubElemen } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Search, 
  BookOpen, 
  Layers, 
  AlertCircle, 
  PlusCircle, 
  ToggleLeft,
  ToggleRight,
  Target
} from 'lucide-react';

export const ManageMataPelajaran: React.FC = () => {
  const { 
    mataPelajarans, 
    createMataPelajaran, 
    updateMataPelajaran, 
    deleteMataPelajaran,
    elemenSettings,
    addLog 
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');

  // Confirmation Delete modal state
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nama: string } | null>(null);
  const [confirmDeleteDraftElem, setConfirmDeleteDraftElem] = useState<{ id: string; nama: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [statusAktif, setStatusAktif] = useState(true);
  const [elements, setElements] = useState<SubElemen[]>([]);

  // Element form sub-state
  const [newElementName, setNewElementName] = useState('');
  const [newElementDesc, setNewElementDesc] = useState('');

  // Element editing sub-state
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editElemName, setEditElemName] = useState('');
  const [editElemDesc, setEditElemDesc] = useState('');

  // Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper to retrieve configured target duration & module scope from elemenSettings
  const getElemenTargetInfo = (elem: SubElemen) => {
    const matched = (elemenSettings || []).find(
      e => e.nama.trim().toLowerCase() === elem.nama.trim().toLowerCase() ||
           e.id.trim().toLowerCase() === elem.id.trim().toLowerCase()
    );
    if (!matched) return null;
    const parts: string[] = [];
    if (matched.targetDurasiBulan) {
      parts.push(`${matched.targetDurasiBulan} Bulan`);
    }
    if (matched.targetCakupanMateri === 'surah_pilihan' && matched.targetSurahList?.length) {
      parts.push(`${matched.targetSurahList.length} Surah Pilihan`);
    } else if (matched.targetCakupanMateri === 'juz_range' && matched.targetJuzStart && matched.targetJuzEnd) {
      parts.push(`Juz ${matched.targetJuzStart}${matched.targetJuzEnd !== matched.targetJuzStart ? `-${matched.targetJuzEnd}` : ''}`);
    } else if (matched.targetCakupanMateri === 'halaman_range' && matched.targetHalamanStart && matched.targetHalamanEnd) {
      parts.push(`Hal ${matched.targetHalamanStart}-${matched.targetHalamanEnd}`);
    }
    return {
      matched,
      label: parts.length > 0 ? parts.join(' • ') : null
    };
  };

  // Filtered Subject List
  const filteredMapels = mataPelajarans.filter(mapel => {
    const matchesSearch = mapel.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (mapel.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'aktif') return matchesSearch && mapel.statusAktif;
    if (filterStatus === 'nonaktif') return matchesSearch && !mapel.statusAktif;
    return matchesSearch;
  });

  // Open form for adding
  const handleAddClick = () => {
    setEditingId(null);
    setNama('');
    setDeskripsi('');
    setStatusAktif(true);
    setElements([]);
    setNewElementName('');
    setNewElementDesc('');
    setEditingElementId(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEditClick = (mapel: MataPelajaran) => {
    setEditingId(mapel.id);
    setNama(mapel.nama);
    setDeskripsi(mapel.deskripsi || '');
    setStatusAktif(mapel.statusAktif);
    setElements([...mapel.elemenList]);
    setNewElementName('');
    setNewElementDesc('');
    setEditingElementId(null);
    setIsFormOpen(true);
  };

  // Toggle active status directly
  const handleToggleStatus = async (mapel: MataPelajaran) => {
    try {
      await updateMataPelajaran(mapel.id, { statusAktif: !mapel.statusAktif });
      triggerToast(`Mata Pelajaran "${mapel.nama}" berhasil ${!mapel.statusAktif ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (e) {
      triggerToast('Gagal merubah status aktif.', 'error');
    }
  };

  // Delete Subject Trigger
  const handleDeleteMapel = (id: string, namaMapel: string) => {
    setConfirmDelete({ id, nama: namaMapel });
  };

  const executeDeleteMapel = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await deleteMataPelajaran(confirmDelete.id);
      triggerToast(`Mata Pelajaran "${confirmDelete.nama}" berhasil dihapus.`);
      setConfirmDelete(null);
    } catch (e) {
      triggerToast('Gagal menghapus Mata Pelajaran.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sub-Element list manipulation within Form
  const handleAddElementToDraft = () => {
    if (!newElementName.trim()) {
      triggerToast('Nama Elemen tidak boleh kosong.', 'error');
      return;
    }
    const newId = `sub-elem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newElem: SubElemen = {
      id: newId,
      nama: newElementName.trim(),
      deskripsi: newElementDesc.trim() || undefined,
      statusAktif: true
    };
    setElements([...elements, newElem]);
    setNewElementName('');
    setNewElementDesc('');
    triggerToast('Elemen berhasil ditambahkan ke daftar.');
  };

  const handleRemoveElementFromDraft = (id: string, namaElem: string) => {
    setConfirmDeleteDraftElem({ id, nama: namaElem });
  };

  const executeDeleteDraftElem = () => {
    if (!confirmDeleteDraftElem) return;
    const { id } = confirmDeleteDraftElem;
    if (editingElementId === id) {
      setEditingElementId(null);
    }
    setElements(elements.filter(e => e.id !== id));
    setConfirmDeleteDraftElem(null);
    triggerToast('Elemen berhasil dihapus dari daftar.');
  };

  const handleToggleElementInDraft = (id: string) => {
    setElements(elements.map(e => e.id === id ? { ...e, statusAktif: !e.statusAktif } : e));
  };

  const handleStartEditElement = (elem: SubElemen) => {
    setEditingElementId(elem.id);
    setEditElemName(elem.nama);
    setEditElemDesc(elem.deskripsi || '');
  };

  const handleSaveEditElement = (id: string) => {
    if (!editElemName.trim()) {
      triggerToast('Nama Elemen tidak boleh kosong.', 'error');
      return;
    }
    setElements(elements.map(e => e.id === id ? { 
      ...e, 
      nama: editElemName.trim(), 
      deskripsi: editElemDesc.trim() || undefined 
    } : e));
    setEditingElementId(null);
    setEditElemName('');
    setEditElemDesc('');
    triggerToast('Elemen berhasil diperbarui.');
  };

  const handleCancelEditElement = () => {
    setEditingElementId(null);
    setEditElemName('');
    setEditElemDesc('');
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      triggerToast('Nama Mata Pelajaran harus diisi.', 'error');
      return;
    }

    try {
      if (editingId) {
        // Edit flow
        await updateMataPelajaran(editingId, {
          nama: nama.trim(),
          deskripsi: deskripsi.trim() || undefined,
          statusAktif,
          elemenList: elements
        });
        triggerToast('Mata Pelajaran berhasil diperbarui.');
      } else {
        // Create flow
        await createMataPelajaran({
          nama: nama.trim(),
          deskripsi: deskripsi.trim() || undefined,
          statusAktif,
          elemenList: elements
        });
        triggerToast('Mata Pelajaran baru berhasil ditambahkan.');
      }
      setIsFormOpen(false);
    } catch (error) {
      triggerToast('Gagal menyimpan perubahan.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div id="toast-matapelajaran" className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-xl shadow-lg border text-xs font-semibold uppercase tracking-wider animate-bounce ${toastType === 'success' ? 'bg-emerald-50 border-emerald-250 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-300'}`}>
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-sans font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-emerald-600 dark:text-emerald-450" />
            Konfigurasi Mata Pelajaran & Elemen
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-sans text-xs mt-1">
            Persiapkan mata pelajaran kurikulum dan detail komponen elemen untuk kelancaran assessment serta evaluasi setoran harian santri.
          </p>
        </div>
        <button
          id="btn-tambah-mapel"
          onClick={handleAddClick}
          className="flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-emerald-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Mata Pelajaran
        </button>
      </div>

      {/* Subject list controls */}
      {!isFormOpen && (
        <div className="space-y-4">
          {/* Filtering and search row */}
          <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="search-mapel"
                type="text"
                placeholder="Cari Mata Pelajaran atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white placeholder-slate-450 focus:outline-none"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['semua', 'aktif', 'nonaktif'] as const).map((status) => (
                <button
                  id={`filter-status-${status}`}
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                    filterStatus === status
                      ? 'bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300'
                      : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-white border border-transparent'
                  }`}
                >
                  {status === 'semua' ? 'Semua' : status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid list of Subject Cards */}
          {filteredMapels.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-sans text-xs">Tidak ditemukan mata pelajaran yang cocok dengan filter pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMapels.map((mapel) => (
                <div 
                  id={`card-mapel-${mapel.id}`}
                  key={mapel.id} 
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group ${
                    mapel.statusAktif 
                      ? 'border-slate-150 dark:border-slate-800 hover:border-emerald-250 dark:hover:border-emerald-900/60' 
                      : 'border-slate-100 dark:border-slate-900 opacity-75'
                  }`}
                >
                  {/* Active ribbon */}
                  <div className={`absolute top-0 right-0 h-1.5 w-full ${mapel.statusAktif ? 'bg-emerald-500' : 'bg-slate-450 dark:bg-slate-800'}`} />

                  {/* Upper info Section */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                          {mapel.nama}
                          <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            mapel.statusAktif 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450' 
                              : 'bg-slate-105 text-slate-550 dark:bg-slate-800'
                          }`}>
                            {mapel.statusAktif ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </h3>
                        {mapel.deskripsi && (
                          <p className="text-slate-500 dark:text-slate-400 font-sans text-xs mt-1.5 line-clamp-2">
                            {mapel.deskripsi}
                          </p>
                        )}
                      </div>

                      {/* Header controls */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          id={`btn-toggle-status-${mapel.id}`}
                          onClick={() => handleToggleStatus(mapel)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            mapel.statusAktif 
                              ? 'text-emerald-650 hover:bg-emerald-50 dark:text-emerald-450 dark:hover:bg-emerald-950/40' 
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                          }`}
                          title={mapel.statusAktif ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'}
                        >
                          {mapel.statusAktif ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        </button>
                        <button
                          id={`btn-edit-${mapel.id}`}
                          onClick={() => handleEditClick(mapel)}
                          className="p-1.5 text-slate-450 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Ubah Mata Pelajaran"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-${mapel.id}`}
                          onClick={() => handleDeleteMapel(mapel.id, mapel.nama)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="Hapus Mata Pelajaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Nesting Elements visualizer */}
                    <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center">
                        <Layers className="w-3.5 h-3.5 mr-1" />
                        Elemen ({mapel.elemenList.length})
                      </h4>

                      {mapel.elemenList.length === 0 ? (
                        <p className="text-[11px] font-sans text-slate-400 dark:text-slate-500 italic">Mata pelajaran ini belum memiliki elemen pendukung.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {mapel.elemenList.map((elem) => {
                            const targetInfo = getElemenTargetInfo(elem);
                            return (
                              <div
                                id={`tag-elem-${elem.id}`}
                                key={elem.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-sans font-medium transition-colors ${
                                  elem.statusAktif 
                                    ? 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950/60 dark:border-slate-850 dark:text-slate-300' 
                                    : 'bg-slate-100/50 border-slate-200 text-slate-400 line-through dark:bg-slate-900/40 dark:border-slate-900 dark:text-slate-600'
                                }`}
                                title={elem.deskripsi ? `Elemen: ${elem.nama} (${elem.deskripsi})` : `Elemen: ${elem.nama}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${elem.statusAktif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span>{elem.nama}</span>
                                {targetInfo?.label && (
                                  <span className="inline-flex items-center text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/50 px-1.5 py-0.2 rounded-md">
                                    <Target className="w-2.5 h-2.5 mr-0.5 inline-block text-teal-600 dark:text-teal-400" />
                                    {targetInfo.label}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Datestamps Footer */}
                  <div className="mt-4 border-t border-slate-100 dark:border-slate-800/50 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>ID: {mapel.id}</span>
                    <span>Dibuat: {new Date(mapel.tanggalDibuat).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Dialog Panel (for Create and Update actions) */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-md overflow-hidden animate-slide-in">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
            <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-white flex items-center">
              <BookOpen className="w-4 h-4 mr-1.5 text-emerald-500" />
              {editingId ? 'Ubah Konfigurasi Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h3>
            <button
              id="btn-close-form"
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body layout */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Basic Details */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-450 border-b border-slate-100 dark:border-slate-800 pb-2">Detail Utama</h4>
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="mapel-nama" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Mata Pelajaran <span className="text-rose-500">*</span></label>
                  <input
                    id="mapel-nama"
                    type="text"
                    required
                    placeholder="Contoh: Al-Qur'an, Kitab Kuning, dll."
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="mapel-deskripsi" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Deskripsi / Penjelasan</label>
                  <textarea
                    id="mapel-deskripsi"
                    rows={4}
                    placeholder="Tuliskan tujuan pembelajaran mata pelajaran ini secara ringkas..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-650 dark:text-slate-300">Status Aktif</label>
                    <span className="text-[10px] text-slate-450">Memungkinkan pendidik menilai mata pelajaran ini.</span>
                  </div>
                  <button
                    id="form-toggle-status"
                    type="button"
                    onClick={() => setStatusAktif(!statusAktif)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      statusAktif 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-slate-400'
                    }`}
                  >
                    {statusAktif ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>
              </div>

              {/* Right Column: Elemen Management */}
              <div className="lg:col-span-7 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-150 dark:border-slate-800 lg:pt-0 lg:pl-6">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-450 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Struktur Elemen Pendukung ({elements.length})
                </h4>

                {/* Add Sub Element Panel */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tambah Elemen Baru ke Daftar</span>
                    <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Target tuntas &amp; cakupan materi terintegrasi
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      id="form-elem-nama"
                      type="text"
                      placeholder="Nama Elemen (misal: Tahfidz, Tilawah)"
                      value={newElementName}
                      onChange={(e) => setNewElementName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                    <input
                      id="form-elem-deskripsi"
                      type="text"
                      placeholder="Keterangan singkat"
                      value={newElementDesc}
                      onChange={(e) => setNewElementDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <button
                    id="btn-add-elem-draft"
                    type="button"
                    onClick={handleAddElementToDraft}
                    className="flex items-center justify-center px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer w-full"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    Masukkan ke Daftar Elemen
                  </button>
                  <p className="text-[10px] text-slate-400 leading-tight pt-1">
                    💡 <em>Catatan:</em> Rincian <strong>Target Durasi Tuntas</strong> dan <strong>Cakupan Modul Pembelajaran (Surah Pilihan / Rentang Juz)</strong> dapat dikonfigurasi penuh pada menu <strong>Mutabaah &gt; Konfigurasi Elemen &amp; jenis setoran</strong>.
                  </p>
                </div>

                {/* Draft list of elements */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {elements.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <Layers className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                      <p className="font-sans text-[11px]">Silakan masukkan minimal satu Elemen untuk melengkapi Mata Pelajaran ini.</p>
                    </div>
                  ) : (
                    elements.map((elem, idx) => {
                      const targetInfo = getElemenTargetInfo(elem);
                      return (
                      <div 
                        id={`draft-elem-${elem.id}`}
                        key={elem.id} 
                        className={`flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl animate-scale-in transition-all ${
                          editingElementId === elem.id ? 'ring-1 ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10 border-emerald-450' : ''
                        }`}
                      >
                        {editingElementId === elem.id ? (
                          <div className="flex-1 flex flex-col sm:flex-row gap-2 mr-3">
                            <span className="font-mono text-[10px] font-bold text-slate-400 self-center hidden sm:inline">#{(idx + 1).toString().padStart(2, '0')}</span>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                id={`edit-elem-nama-${elem.id}`}
                                type="text"
                                value={editElemName}
                                onChange={(e) => setEditElemName(e.target.value)}
                                placeholder="Nama Elemen (misal: Tahfidz)"
                                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-sans text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <input
                                id={`edit-elem-desc-${elem.id}`}
                                type="text"
                                value={editElemDesc}
                                onChange={(e) => setEditElemDesc(e.target.value)}
                                placeholder="Keterangan singkat"
                                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-sans text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-[10px] font-bold text-slate-400">#{(idx + 1).toString().padStart(2, '0')}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-sans text-xs font-semibold ${elem.statusAktif ? 'text-slate-800 dark:text-white' : 'text-slate-400 line-through dark:text-slate-600'}`}>{elem.nama}</span>
                                {targetInfo?.label && (
                                  <span className="inline-flex items-center text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/50 px-1.5 py-0.2 rounded-md">
                                    <Target className="w-2.5 h-2.5 mr-0.5 inline-block text-teal-600 dark:text-teal-400" />
                                    {targetInfo.label}
                                  </span>
                                )}
                              </div>
                              {elem.deskripsi && (
                                <p className="text-[10px] text-slate-450 leading-none mt-1">{elem.deskripsi}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Item Draft Interactions */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {editingElementId === elem.id ? (
                            <>
                              <button
                                id={`draft-elem-save-${elem.id}`}
                                type="button"
                                onClick={() => handleSaveEditElement(elem.id)}
                                className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/45 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer text-[10px] flex items-center font-bold uppercase tracking-wider"
                                title="Simpan Perubahan"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Simpan
                              </button>
                              <button
                                id={`draft-elem-cancel-${elem.id}`}
                                type="button"
                                onClick={handleCancelEditElement}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 rounded-lg transition-colors cursor-pointer text-[10px] uppercase font-bold tracking-wider"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                id={`draft-elem-edit-${elem.id}`}
                                type="button"
                                onClick={() => handleStartEditElement(elem)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Ubah Elemen"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                id={`draft-elem-toggle-${elem.id}`}
                                type="button"
                                onClick={() => handleToggleElementInDraft(elem.id)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  elem.statusAktif 
                                    ? 'text-emerald-650 hover:bg-emerald-50 dark:text-emerald-450 dark:hover:bg-emerald-950/30' 
                                    : 'text-slate-400 hover:bg-slate-150'
                                }`}
                                title={elem.statusAktif ? 'Set Nonaktif' : 'Set Aktif'}
                              >
                                {elem.statusAktif ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                              </button>
                              <button
                                id={`draft-elem-delete-${elem.id}`}
                                type="button"
                                onClick={() => handleRemoveElementFromDraft(elem.id, elem.nama)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                                title="Hapus Dari Daftar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-end space-x-3">
            <button
              id="form-btn-batal"
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="form-btn-simpan"
              type="submit"
              className="flex items-center justify-center px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      )}

      {/* Modal Konfirmasi Hapus Mata Pelajaran */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base text-center">
              Konfirmasi Hapus Mata Pelajaran
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
              Apakah Anda yakin ingin menghapus Mata Pelajaran <strong className="text-slate-800 dark:text-slate-200">"{confirmDelete.nama}"</strong> beserta seluruh elemen dan kurikulum terkait? Tindakan ini tidak dapat dibatalkan.
            </p>
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
                onClick={executeDeleteMapel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Draft Sub-Element Modal */}
      {confirmDeleteDraftElem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Hapus Sub-Elemen Pembelajaran</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus sub-elemen <strong>"{confirmDeleteDraftElem.nama}"</strong> dari rancangan mata pelajaran ini?
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteDraftElem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteDraftElem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
