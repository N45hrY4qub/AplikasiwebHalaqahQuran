/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Network, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  School, 
  Layers, 
  Info, 
  User, 
  Upload, 
  Search, 
  X, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles,
  Link,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  StrukturLembaga, 
  YayasanData, 
  SekolahNode, 
  hasAdminTabPermission,
  getAdminTabLabel
} from '../types';
import {
  DEFAULT_INSTITUTION_NAME,
  DEFAULT_INSTITUTION_ABBR,
  resolveYayasanDisplayName
} from '../utils/brandingHelper';

export const ManageStrukturLembaga: React.FC = () => {
  const { 
    strukturLembaga, 
    saveStrukturLembaga,
    gurus = [],
    siswas = [],
    halaqahs = [],
    currentSession
  } = useApp();

  const user = currentSession.user;
  const canAccessProfil = hasAdminTabPermission(user, 'struktur_lembaga', 'profil') || hasAdminTabPermission(user, 'struktur_lembaga', 'wizard');
  const canAccessUnit = hasAdminTabPermission(user, 'struktur_lembaga', 'unit') || hasAdminTabPermission(user, 'struktur_lembaga', 'wizard');
  const canAccessVisual = hasAdminTabPermission(user, 'struktur_lembaga', 'visual');

  const [activeTab, setActiveTab] = useState<'profil' | 'unit' | 'visual'>(() => {
    if (canAccessProfil) return 'profil';
    if (canAccessUnit) return 'unit';
    if (canAccessVisual) return 'visual';
    return 'profil';
  });

  useEffect(() => {
    if (activeTab === 'profil' && !canAccessProfil) {
      if (canAccessUnit) setActiveTab('unit');
      else if (canAccessVisual) setActiveTab('visual');
    }
  }, [canAccessProfil, canAccessUnit, canAccessVisual, activeTab]);

  // Form State for Profil Yayasan / Lembaga
  const [yayasanForm, setYayasanForm] = useState<YayasanData>(() => ({
    nama: resolveYayasanDisplayName(strukturLembaga.yayasan?.nama),
    singkatan: strukturLembaga.yayasan?.singkatan || DEFAULT_INSTITUTION_ABBR,
    divisi: strukturLembaga.yayasan?.divisi || 'Divisi Pendidikan & Pembinaan Al-Quran',
    logo: strukturLembaga.yayasan?.logo || '',
    alamat: strukturLembaga.yayasan?.alamat || 'Sekretariat Lembaga Pusat',
    email: strukturLembaga.yayasan?.email || 'info@halaqah.example',
    nomorTelepon: strukturLembaga.yayasan?.nomorTelepon || '0800-0000-0000',
    website: strukturLembaga.yayasan?.website || 'https://halaqah.example'
  }));

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state if context changes
  useEffect(() => {
    if (strukturLembaga.yayasan) {
      setYayasanForm({
        nama: resolveYayasanDisplayName(strukturLembaga.yayasan.nama),
        singkatan: strukturLembaga.yayasan.singkatan || DEFAULT_INSTITUTION_ABBR,
        divisi: strukturLembaga.yayasan.divisi || 'Divisi Pendidikan & Pembinaan Al-Quran',
        logo: strukturLembaga.yayasan.logo || '',
        alamat: strukturLembaga.yayasan.alamat || 'Sekretariat Lembaga Pusat',
        email: strukturLembaga.yayasan.email || 'info@halaqah.example',
        nomorTelepon: strukturLembaga.yayasan.nomorTelepon || '0800-0000-0000',
        website: strukturLembaga.yayasan.website || 'https://halaqah.example'
      });
    }
  }, [strukturLembaga.yayasan]);

  // Unit Modal & Form State
  const [unitModalOpen, setUnitModalOpen] = useState<boolean>(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>('');
  const [unitForm, setUnitForm] = useState<Omit<SekolahNode, 'id'>>({
    nama: '',
    namaPimpinan: '',
    email: '',
    nomorHp: '',
    jenisSekolah: 'Hybrid',
    alamat: '',
    statusAktif: true,
    kategoriUnit: 'Non-Formal',
    modelLembaga: 'Rumah Quran',
    jenisStrukturId: 'js-1',
    jenisStrukturNama: 'Non-Formal'
  });

  // Tree View Expand/Collapse States
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'yayasan': true,
    'divisi': true,
    'all_units': true
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {
      yayasan: true,
      divisi: true,
      all_units: true
    };
    (strukturLembaga.sekolahList || []).forEach(s => {
      all[`unit-${s.id}`] = true;
    });
    setExpandedNodes(all);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({
      yayasan: false,
      divisi: false,
      all_units: false
    });
  };

  // Handle Logo Upload via File
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setYayasanForm(prev => ({ ...prev, logo: result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profil Yayasan
  const handleSaveYayasan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: StrukturLembaga = {
        ...strukturLembaga,
        selectedStructure: 'A', // Model A (Yayasan -> Divisi -> Unit/Halaqah)
        yayasan: {
          ...yayasanForm,
          nama: yayasanForm.nama.trim(),
          singkatan: yayasanForm.singkatan.trim(),
          divisi: (yayasanForm.divisi || 'Divisi Pendidikan & Pembinaan Al-Quran').trim()
        }
      };
      await saveStrukturLembaga(updated);
      setSaveSuccessMsg('Profil dan identitas lembaga berhasil disimpan!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Gagal menyimpan identitas lembaga:', err);
      alert('Gagal menyimpan perubahan identitas lembaga.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Modal Tambah Unit
  const handleOpenAddUnit = () => {
    setEditingUnitId(null);
    setUnitForm({
      nama: '',
      namaPimpinan: '',
      email: '',
      nomorHp: '',
      jenisSekolah: 'Hybrid',
      alamat: '',
      statusAktif: true,
      kategoriUnit: 'Non-Formal',
      modelLembaga: 'Rumah Quran',
      jenisStrukturId: 'js-1',
      jenisStrukturNama: 'Non-Formal'
    });
    setUnitModalOpen(true);
  };

  // Open Modal Edit Unit
  const handleOpenEditUnit = (unit: SekolahNode) => {
    setEditingUnitId(unit.id);
    setUnitForm({
      nama: unit.nama,
      namaPimpinan: unit.namaPimpinan || '',
      email: unit.email || '',
      nomorHp: unit.nomorHp || '',
      jenisSekolah: unit.jenisSekolah || 'Hybrid',
      alamat: unit.alamat || '',
      statusAktif: unit.statusAktif ?? true,
      kategoriUnit: 'Non-Formal',
      modelLembaga: unit.modelLembaga || 'Rumah Quran',
      jenisStrukturId: 'js-1',
      jenisStrukturNama: 'Non-Formal'
    });
    setUnitModalOpen(true);
  };

  // Save Unit (Tambah / Edit)
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.nama.trim()) {
      alert('Nama Unit wajib diisi.');
      return;
    }

    try {
      let updatedSekolahList = [...(strukturLembaga.sekolahList || [])];

      if (editingUnitId) {
        // Update
        updatedSekolahList = updatedSekolahList.map(item => {
          if (item.id === editingUnitId) {
            return {
              ...item,
              ...unitForm,
              nama: unitForm.nama.trim(),
              namaPimpinan: unitForm.namaPimpinan.trim(),
              kategoriUnit: 'Non-Formal',
              jenisStrukturNama: 'Non-Formal'
            };
          }
          return item;
        });
      } else {
        // Create new
        const newUnit: SekolahNode = {
          id: `unit-${Date.now()}`,
          ...unitForm,
          nama: unitForm.nama.trim(),
          namaPimpinan: unitForm.namaPimpinan.trim(),
          kategoriUnit: 'Non-Formal',
          jenisStrukturNama: 'Non-Formal'
        };
        updatedSekolahList.push(newUnit);
      }

      const updatedStruktur: StrukturLembaga = {
        ...strukturLembaga,
        selectedStructure: 'A',
        sekolahList: updatedSekolahList
      };

      await saveStrukturLembaga(updatedStruktur);
      setUnitModalOpen(false);
      setSaveSuccessMsg(editingUnitId ? 'Data unit berhasil diperbarui!' : 'Unit binaan baru berhasil ditambahkan!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Gagal menyimpan unit:', err);
      alert('Terjadi kesalahan saat menyimpan data unit.');
    }
  };

  // Delete Unit
  const handleDeleteUnit = async (unitId: string, unitNama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus unit "${unitNama}"?`)) {
      return;
    }

    try {
      const updatedSekolahList = (strukturLembaga.sekolahList || []).filter(s => s.id !== unitId);
      const updatedStruktur: StrukturLembaga = {
        ...strukturLembaga,
        selectedStructure: 'A',
        sekolahList: updatedSekolahList
      };
      await saveStrukturLembaga(updatedStruktur);
      setSaveSuccessMsg(`Unit "${unitNama}" berhasil dihapus.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Gagal menghapus unit:', err);
      alert('Terjadi kesalahan saat menghapus unit.');
    }
  };

  // Toggle Status Aktif Unit
  const handleToggleUnitStatus = async (unit: SekolahNode) => {
    try {
      const updatedSekolahList = (strukturLembaga.sekolahList || []).map(s => {
        if (s.id === unit.id) {
          return { ...s, statusAktif: !s.statusAktif };
        }
        return s;
      });
      const updatedStruktur: StrukturLembaga = {
        ...strukturLembaga,
        selectedStructure: 'A',
        sekolahList: updatedSekolahList
      };
      await saveStrukturLembaga(updatedStruktur);
    } catch (err) {
      console.error('Gagal mengubah status unit:', err);
    }
  };

  // Filtered unit list
  const filteredUnits = useMemo(() => {
    const list = strukturLembaga.sekolahList || [];
    if (!unitSearchQuery.trim()) return list;
    const q = unitSearchQuery.toLowerCase();
    return list.filter(u => 
      u.nama.toLowerCase().includes(q) || 
      (u.namaPimpinan || '').toLowerCase().includes(q) ||
      (u.alamat || '').toLowerCase().includes(q)
    );
  }, [strukturLembaga.sekolahList, unitSearchQuery]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalUnit = (strukturLembaga.sekolahList || []).length;
    const totalHalaqah = halaqahs.length;
    const totalSantri = siswas.length;
    const totalGuru = gurus.length;
    return { totalUnit, totalHalaqah, totalSantri, totalGuru };
  }, [strukturLembaga.sekolahList, halaqahs, siswas, gurus]);

  // Nama Divisi
  const namaDivisi = yayasanForm.divisi || 'Divisi Pendidikan & Pembinaan Al-Quran';

  return (
    <div id="manage-struktur-lembaga-root" className="p-4 sm:p-6 md:p-8 space-y-6">
      
      {/* Title Header with Modern Islamic Theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 tracking-wide">
              ORGANISASI & PROGRAM DAKWAH
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-600" />
            <span>Tata Kelola Lembaga</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Pusat konfigurasi identitas induk yayasan, divisi dakwah, satuan unit bimbingan, serta bagan struktur organisasi halaqah Al-Qur'an.
          </p>
        </div>

        {/* 3 Tabs Direct Navigation Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto shadow-inner">
          {canAccessProfil && (
            <button
              type="button"
              onClick={() => setActiveTab('profil')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'profil' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>{getAdminTabLabel('struktur_lembaga', 'profil', 'Identitas Lembaga')}</span>
            </button>
          )}

          {canAccessUnit && (
            <button
              type="button"
              onClick={() => setActiveTab('unit')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'unit' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-amber-600" />
              <span>{getAdminTabLabel('struktur_lembaga', 'unit', 'Unit & Halaqah')}</span>
              <span className="ml-1 text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full">
                {stats.totalUnit}
              </span>
            </button>
          )}

          {canAccessVisual && (
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'visual' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Network className="h-3.5 w-3.5 text-indigo-600" />
              <span>{getAdminTabLabel('struktur_lembaga', 'visual', 'Bagan Organisasi')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: IDENTITAS & PROFIL LEMBAGA
      ========================================================================= */}
      {activeTab === 'profil' && canAccessProfil && (
        <form onSubmit={handleSaveYayasan} className="space-y-6 max-w-4xl animate-fade-in">
          
          {/* Alur Hierarki Card Info */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 pointer-events-none">
              <Building2 className="w-56 h-56 text-white" />
            </div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Rantai Struktur Lembaga Aktif</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold flex items-center gap-2 flex-wrap text-white">
              <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
                {yayasanForm.nama || DEFAULT_INSTITUTION_NAME}
              </span>
              <span className="text-emerald-400">➔</span>
              <span className="bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-400/30 text-emerald-200">
                {yayasanForm.divisi || 'Divisi Pendidikan & Pembinaan Al-Quran'}
              </span>
              <span className="text-emerald-400">➔</span>
              <span className="bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/30 text-amber-200">
                Unit / Cabang Halaqah Binaan
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">
              Data identitas, divisi, dan logo di bawah ini digunakan secara otomatis pada seluruh kop surat resmi dokumen Berita Acara Assessment, Syahadah/Ijazah, dan lembar laporan lembaga.
            </p>
          </div>

          {/* Form Utama Profil */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
            
            <div className="border-b border-slate-150 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span>1. Identitas Yayasan & Divisi Pelaksana</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nama resmi badan hukum yayasan dan divisi penyelenggara kegiatan bimbingan halaqah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nama Resmi Yayasan / Lembaga Induk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={yayasanForm.nama}
                  onChange={e => setYayasanForm({ ...yayasanForm, nama: e.target.value })}
                  placeholder={`Contoh: ${DEFAULT_INSTITUTION_NAME}`}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Singkatan Lembaga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={yayasanForm.singkatan}
                  onChange={e => setYayasanForm({ ...yayasanForm, singkatan: e.target.value })}
                  placeholder={`Contoh: ${DEFAULT_INSTITUTION_ABBR}`}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium font-mono uppercase"
                />
              </div>

              <div className="md:col-span-12 space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Divisi / Penyelenggara Program <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={yayasanForm.divisi}
                  onChange={e => setYayasanForm({ ...yayasanForm, divisi: e.target.value })}
                  placeholder="Contoh: Divisi Pendidikan & Pembinaan Al-Quran"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
                  Divisi ini menjadi penanggung jawab resmi program pembinaan halaqah santri.
                </span>
              </div>
            </div>

            {/* Logo Section */}
            <div className="border-t border-slate-150 dark:border-slate-800 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Logo Resmi Lembaga</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Logo ditampilkan di kop surat ijazah/syahadah, berita acara ujian, dan header cetak.
                  </p>
                </div>
                {yayasanForm.logo && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Check className="h-3 w-3" /> Logo Terpasang
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Logo Preview */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-850 min-h-[140px] text-center">
                  {yayasanForm.logo ? (
                    <div className="relative group">
                      <img 
                        src={yayasanForm.logo} 
                        alt="Logo Yayasan" 
                        className="h-24 w-24 object-contain rounded-xl p-1 bg-white shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setYayasanForm(prev => ({ ...prev, logo: '' }))}
                        className="mt-2 text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 mx-auto cursor-pointer"
                        title="Hapus Logo"
                      >
                        <Trash2 className="h-3 w-3" /> Hapus Logo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-400">
                      <Building2 className="h-10 w-10 mx-auto stroke-1 text-slate-300 dark:text-slate-600" />
                      <span className="text-[11px] font-semibold block">Belum ada logo</span>
                    </div>
                  )}
                </div>

                {/* Upload & Link Controls */}
                <div className="md:col-span-8 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload File Gambar</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Atau Tempel URL Gambar Online:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={yayasanForm.logo}
                        onChange={e => setYayasanForm({ ...yayasanForm, logo: e.target.value })}
                        placeholder="https://example.com/logo-yayasan.png"
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kontak & Domisili */}
            <div className="border-t border-slate-150 dark:border-slate-800 pt-5 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>3. Kontak & Domisili Sekretariat</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Alamat resmi dan kontak lembaga yang akan tercantum pada berkas administrasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Alamat Lengkap Kantor / Sekretariat
                  </label>
                  <textarea
                    rows={2}
                    value={yayasanForm.alamat}
                    onChange={e => setYayasanForm({ ...yayasanForm, alamat: e.target.value })}
                    placeholder="Alamat kantor sekretariat yayasan..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nomor Telepon / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={yayasanForm.nomorTelepon}
                      onChange={e => setYayasanForm({ ...yayasanForm, nomorTelepon: e.target.value })}
                      placeholder="0800-xxxx-xxxx"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Email Resmi Lembaga
                  </label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={yayasanForm.email}
                      onChange={e => setYayasanForm({ ...yayasanForm, email: e.target.value })}
                      placeholder="info@halaqah.example"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Website Resmi
                  </label>
                  <div className="relative">
                    <Globe className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={yayasanForm.website}
                      onChange={e => setYayasanForm({ ...yayasanForm, website: e.target.value })}
                      placeholder="https://halaqah.example"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-slate-150 dark:border-slate-800 pt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Identitas'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =========================================================================
          TAB 2: SATUAN UNIT & HALAQAH BINAAN
      ========================================================================= */}
      {activeTab === 'unit' && canAccessUnit && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Unit / Markaz Binaan</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.totalUnit} <span className="text-xs font-normal text-slate-500">Lokasi</span>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Halaqah Aktif</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {stats.totalHalaqah} <span className="text-xs font-normal text-slate-500">Grup</span>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Santri Binaan</span>
              <p className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
                {stats.totalSantri} <span className="text-xs font-normal text-slate-500">Santri</span>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Guru / Pembimbing</span>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                {stats.totalGuru} <span className="text-xs font-normal text-slate-500">Asatidzah</span>
              </p>
            </div>
          </div>

          {/* Action Bar & Search */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={unitSearchQuery}
                onChange={e => setUnitSearchQuery(e.target.value)}
                placeholder="Cari nama unit, pimpinan, atau lokasi..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddUnit}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Unit Binaan Baru</span>
            </button>
          </div>

          {/* Unit List Cards */}
          {filteredUnits.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <School className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Belum Ada Unit Binaan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tambahkan unit operasional seperti Markaz Utama, Pondok Santri, atau Cabang Halaqah binaan yayasan.
              </p>
              <button
                type="button"
                onClick={handleOpenAddUnit}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Unit Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUnits.map(unit => {
                // Find halaqahs affiliated with this unit
                const unitHalaqahs = halaqahs.filter(h => h.sekolahId === unit.id);
                const unitSantriCount = siswas.filter(s => s.sekolahId === unit.id || unitHalaqahs.some(h => h.id === s.halaqahId)).length;

                return (
                  <div 
                    key={unit.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">
                            <School className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase px-2 py-0.5 rounded-full font-mono">
                                {unit.jenisSekolah || 'Hybrid'}
                              </span>
                              <span className="text-[9px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                                Non-Formal
                              </span>
                            </div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                              {unit.nama}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleUnitStatus(unit)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                              unit.statusAktif 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="Klik untuk ubah status aktif/nonaktif"
                          >
                            {unit.statusAktif ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </div>
                      </div>

                      {/* Detail Data */}
                      <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {unit.namaPimpinan && (
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>Pimpinan / Koordinator: <strong className="text-slate-800 dark:text-white font-bold">{unit.namaPimpinan}</strong></span>
                          </div>
                        )}
                        {unit.alamat && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight text-slate-500">{unit.alamat}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-[11px] pt-1">
                          {unit.nomorHp && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400" /> {unit.nomorHp}
                            </span>
                          )}
                          {unit.email && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Mail className="h-3 w-3 text-slate-400" /> {unit.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Afiliasi Halaqah Binaan */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Halaqah yang Bernaung ({unitHalaqahs.length} Halaqah • {unitSantriCount} Santri)
                        </span>
                        {unitHalaqahs.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            Belum ada halaqah yang dihubungkan ke unit ini.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {unitHalaqahs.slice(0, 4).map(h => (
                              <span 
                                key={h.id} 
                                className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                              >
                                <BookOpen className="h-3 w-3 text-emerald-600" />
                                <span className="font-semibold">{h.namaHalaqah}</span>
                              </span>
                            ))}
                            {unitHalaqahs.length > 4 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{unitHalaqahs.length - 4} lainnya
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="border-t border-slate-150 dark:border-slate-800 pt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditUnit(unit)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Unit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUnit(unit.id, unit.nama)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        title="Hapus Unit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: BAGAN STRUKTUR ORGANISASI (VISUAL CHART)
      ========================================================================= */}
      {activeTab === 'visual' && canAccessVisual && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-indigo-200 tracking-wider">
                HIERARKI PROGRAM DAKWAH
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Network className="h-5 w-5 text-indigo-600" />
                <span>Pohon Struktur Organisasi Lembaga</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Alur kepengurusan terpusat dari Yayasan ➔ Divisi Dakwah & Sosial ➔ Satuan Unit ➔ Halaqah.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
              >
                ↕ Buka Semua Cabang
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                ⇄ Tutup Semua Cabang
              </button>
            </div>
          </div>

          {/* Org Tree View */}
          <div className="max-w-4xl mx-auto space-y-4 pt-2">
            
            {/* LEVEL 1: YAYASAN INDUK */}
            <div className="space-y-3">
              <div 
                onClick={() => toggleNode('yayasan')}
                className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md cursor-pointer hover:bg-slate-950 transition select-none"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    {yayasanForm.logo ? (
                      <img src={yayasanForm.logo} alt="Logo" className="h-9 w-9 object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      LEMBAGA INDUK (YAYASAN)
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">
                      {yayasanForm.nama || DEFAULT_INSTITUTION_NAME}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {yayasanForm.alamat || 'Sekretariat Lembaga Pusat'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <span className="hidden sm:inline text-xs font-mono font-bold text-slate-300">
                    {stats.totalUnit} Unit • {stats.totalHalaqah} Halaqah
                  </span>
                  {expandedNodes['yayasan'] ? (
                    <ChevronDown className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* LEVEL 2: DIVISI DAKWAH DAN SOSIAL */}
              {expandedNodes['yayasan'] && (
                <div className="pl-4 sm:pl-8 border-l-2 border-emerald-300 dark:border-emerald-800 ml-4 sm:ml-6 space-y-3 animate-fade-in">
                  
                  <div 
                    onClick={() => toggleNode('divisi')}
                    className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                          DIVISI PELAKSANA
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {namaDivisi}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Pengampu Program Halaqah Al-Qur'an & Bimbingan Santri
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700">
                        {stats.totalSantri} Santri Terbina
                      </span>
                      {expandedNodes['divisi'] ? (
                        <ChevronDown className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* LEVEL 3 & 4: SATUAN UNIT & HALAQAH */}
                  {expandedNodes['divisi'] && (
                    <div className="pl-4 sm:pl-8 border-l-2 border-amber-300 dark:border-amber-800 ml-4 sm:ml-6 space-y-3 pt-1 animate-fade-in">
                      
                      {(strukturLembaga.sekolahList || []).length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center text-xs text-slate-500 italic">
                          Belum ada unit binaan. Silakan tambahkan pada tab "Unit & Halaqah".
                        </div>
                      ) : (
                        (strukturLembaga.sekolahList || []).map(unit => {
                          const unitHalaqahs = halaqahs.filter(h => h.sekolahId === unit.id);
                          const isUnitExpanded = !!expandedNodes[`unit-${unit.id}`];

                          return (
                            <div key={unit.id} className="space-y-2">
                              <div 
                                onClick={() => toggleNode(`unit-${unit.id}`)}
                                className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:border-amber-400 shadow-xs transition"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <School className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">
                                        UNIT BINAAN
                                      </span>
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 rounded">
                                        Non-Formal
                                      </span>
                                    </div>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                      {unit.nama}
                                    </h4>
                                    {unit.namaPimpinan && (
                                      <p className="text-[10px] text-slate-500">
                                        Pimpinan: {unit.namaPimpinan}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {unitHalaqahs.length} Halaqah
                                  </span>
                                  {isUnitExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-slate-600" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              {/* LEVEL 4: HALAQAH AKTIF */}
                              {isUnitExpanded && (
                                <div className="pl-4 sm:pl-6 border-l-2 border-indigo-300 dark:border-indigo-800 ml-4 space-y-2 pt-1 animate-fade-in">
                                  {unitHalaqahs.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                                      Belum ada halaqah terdaftar pada unit ini.
                                    </p>
                                  ) : (
                                    unitHalaqahs.map(h => {
                                      const santriCount = siswas.filter(s => s.halaqahId === h.id).length;
                                      return (
                                        <div 
                                          key={h.id}
                                          className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-150 dark:border-indigo-900 rounded-lg p-2.5 flex items-center justify-between text-xs"
                                        >
                                          <div className="flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
                                            <div>
                                              <span className="font-bold text-slate-900 dark:text-white">
                                                {h.namaHalaqah}
                                              </span>
                                              <p className="text-[10px] text-slate-500">
                                                Pembimbing: {h.guruPembimbingNama || (h as any).guruNama || 'Belum Ditentukan'}
                                              </p>
                                            </div>
                                          </div>
                                          <span className="text-[10px] font-bold text-indigo-700 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 font-mono">
                                            {santriCount} Santri
                                          </span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH / EDIT UNIT BINAAN
      ========================================================================= */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-emerald-300" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">
                  {editingUnitId ? 'Edit Data Unit Binaan' : 'Tambah Unit Binaan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUnitModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUnit} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nama Satuan Unit / Markaz <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={unitForm.nama}
                  onChange={e => setUnitForm({ ...unitForm, nama: e.target.value })}
                  placeholder="Contoh: Markaz Halaqah Utama"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Pimpinan / Koordinator Unit
                  </label>
                  <input
                    type="text"
                    value={unitForm.namaPimpinan}
                    onChange={e => setUnitForm({ ...unitForm, namaPimpinan: e.target.value })}
                    placeholder="Nama Ustadz / Koordinator"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Model Pembelajaran
                  </label>
                  <select
                    value={unitForm.jenisSekolah}
                    onChange={e => setUnitForm({ ...unitForm, jenisSekolah: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="Hybrid">Hybrid (Tatap Muka & Online)</option>
                    <option value="Offline">Offline (Tatap Muka Langsung)</option>
                    <option value="Online">Online Penuh</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Alamat / Lokasi Pelaksanaan
                </label>
                <textarea
                  rows={2}
                  value={unitForm.alamat}
                  onChange={e => setUnitForm({ ...unitForm, alamat: e.target.value })}
                  placeholder="Alamat masjid / markaz / lokasi halaqah..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nomor Kontak / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={unitForm.nomorHp}
                    onChange={e => setUnitForm({ ...unitForm, nomorHp: e.target.value })}
                    placeholder="0800-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Email Unit
                  </label>
                  <input
                    type="email"
                    value={unitForm.email}
                    onChange={e => setUnitForm({ ...unitForm, email: e.target.value })}
                    placeholder="unit@halaqah.example"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusAktifCheckbox"
                  checked={unitForm.statusAktif}
                  onChange={e => setUnitForm({ ...unitForm, statusAktif: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="statusAktifCheckbox" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Status Unit Aktif Beroperasi
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="border-t border-slate-150 dark:border-slate-800 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingUnitId ? 'Simpan Perubahan' : 'Tambahkan Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
