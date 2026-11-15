/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Pengumuman, 
  UserRole, 
  TargetAudiensPengumuman, 
  KategoriPengumuman 
} from '../types';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Users, 
  Calendar, 
  Eye, 
  X, 
  Check, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  Send,
  Volume2,
  Info,
  Radio
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { RichTextRenderer } from './RichTextRenderer';
import { stripHtml } from '../utils/richText';

interface ManagePengumumanProps {
  setActiveTab?: (tab: string) => void;
}

export const ManagePengumuman: React.FC<ManagePengumumanProps> = ({ setActiveTab }) => {
  const { 
    currentSession, 
    pengumumans, 
    createPengumuman, 
    updatePengumuman, 
    deletePengumuman,
    markPengumumanAsRead 
  } = useApp();

  const user = currentSession.user;
  const isAdmin = user?.role === UserRole.ADMIN;
  const userId = user?.id || '';
  const userRole = user?.role;

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<'ALL' | KategoriPengumuman>('ALL');
  const [selectedTarget, setSelectedTarget] = useState<'ALL' | TargetAudiensPengumuman>('ALL');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pengumuman | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Pengumuman | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    judul: string;
    konten: string;
    targetAudiens: TargetAudiensPengumuman;
    kategori: KategoriPengumuman;
    isPinned: boolean;
    isPublished: boolean;
    tanggalMulai: string;
    tanggalBerakhir: string;
  }>({
    judul: '',
    konten: '',
    targetAudiens: 'ALL',
    kategori: 'UMUM',
    isPinned: false,
    isPublished: true,
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalBerakhir: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean non-dummy announcements list
  const realPengumumans = useMemo(() => {
    return (pengumumans || []).filter(item => item && item.id && !['ann-1', 'ann-2', 'ann-3'].includes(item.id) && !String(item.id).startsWith('dummy-'));
  }, [pengumumans]);

  // Filtered List based on Role & search
  const visibleList = useMemo(() => {
    return realPengumumans.filter(item => {
      // Role visibility check
      if (!isAdmin) {
        if (!item.isPublished) return false;
        if (userRole === UserRole.GURU && item.targetAudiens !== 'ALL' && item.targetAudiens !== 'GURU') return false;
        if (userRole === UserRole.SISWA && item.targetAudiens !== 'ALL' && item.targetAudiens !== 'SISWA') return false;
      }

      // Search match
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesJudul = item.judul.toLowerCase().includes(term);
        const matchesKonten = stripHtml(item.konten).toLowerCase().includes(term);
        const matchesAuthor = item.authorNama?.toLowerCase().includes(term);
        if (!matchesJudul && !matchesKonten && !matchesAuthor) return false;
      }

      // Kategori filter
      if (selectedKategori !== 'ALL' && item.kategori !== selectedKategori) {
        return false;
      }

      // Target filter (Admin only)
      if (isAdmin && selectedTarget !== 'ALL' && item.targetAudiens !== selectedTarget) {
        return false;
      }

      // Pinned only
      if (showPinnedOnly && !item.isPinned) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Pinned first, then newest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [realPengumumans, isAdmin, userRole, searchTerm, selectedKategori, selectedTarget, showPinnedOnly]);

  // Statistics
  const stats = useMemo(() => {
    const total = realPengumumans.length;
    const forAll = realPengumumans.filter(p => p.targetAudiens === 'ALL').length;
    const forGuru = realPengumumans.filter(p => p.targetAudiens === 'GURU').length;
    const forSiswa = realPengumumans.filter(p => p.targetAudiens === 'SISWA').length;
    const pinned = realPengumumans.filter(p => p.isPinned).length;
    const unread = userId 
      ? visibleList.filter(p => !(p.dibacaOleh || []).includes(userId)).length 
      : 0;

    return { total, forAll, forGuru, forSiswa, pinned, unread };
  }, [realPengumumans, visibleList, userId]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      judul: '',
      konten: '',
      targetAudiens: 'ALL',
      kategori: 'UMUM',
      isPinned: false,
      isPublished: true,
      tanggalMulai: new Date().toISOString().split('T')[0],
      tanggalBerakhir: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Pengumuman) => {
    setEditingItem(item);
    setFormData({
      judul: item.judul,
      konten: item.konten,
      targetAudiens: item.targetAudiens,
      kategori: item.kategori,
      isPinned: item.isPinned,
      isPublished: item.isPublished,
      tanggalMulai: item.tanggalMulai || new Date().toISOString().split('T')[0],
      tanggalBerakhir: item.tanggalBerakhir || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim()) {
      setFormError('Judul pengumuman wajib diisi');
      return;
    }
    if (!formData.konten.trim()) {
      setFormError('Isi pesan / konten pengumuman wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        await updatePengumuman(editingItem.id, {
          judul: formData.judul.trim(),
          konten: formData.konten.trim(),
          targetAudiens: formData.targetAudiens,
          kategori: formData.kategori,
          isPinned: formData.isPinned,
          isPublished: formData.isPublished,
          tanggalMulai: formData.tanggalMulai,
          tanggalBerakhir: formData.tanggalBerakhir
        });
      } else {
        await createPengumuman({
          judul: formData.judul.trim(),
          konten: formData.konten.trim(),
          targetAudiens: formData.targetAudiens,
          kategori: formData.kategori,
          isPinned: formData.isPinned,
          isPublished: formData.isPublished,
          tanggalMulai: formData.tanggalMulai,
          tanggalBerakhir: formData.tanggalBerakhir,
          authorId: user?.id || 'admin',
          authorNama: (user as any)?.namaLengkap || (user as any)?.nama || 'Administrator',
          authorRole: 'Admin',
          dibacaOleh: []
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan pengumuman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePengumuman(id);
      setIsDeletingId(null);
      if (selectedDetail?.id === id) {
        setSelectedDetail(null);
      }
    } catch (e) {
      console.error('Gagal menghapus pengumuman:', e);
    }
  };

  const handleOpenDetail = (item: Pengumuman) => {
    setSelectedDetail(item);
    if (userId) {
      markPengumumanAsRead(item.id, userId);
    }
  };

  const getKategoriBadge = (kategori: KategoriPengumuman) => {
    switch (kategori) {
      case 'DARURAT':
      case 'URGENT':
        return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'AKADEMIK':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'PENGINGAT':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'LIBUR':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'KEGIATAN':
      case 'AGENDA':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'UMUM':
      case 'INFO_UMUM':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getAudiensBadge = (target: TargetAudiensPengumuman) => {
    switch (target) {
      case 'ALL':
        return { label: 'Semua (Guru & Santri)', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800' };
      case 'GURU':
        return { label: 'Khusus Asatidz / Guru', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
      case 'SISWA':
        return { label: 'Khusus Santri', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
              <Megaphone className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-sans font-bold text-2xl md:text-3xl text-white tracking-tight">
                  Papan Pengumuman
                </h1>
                {stats.unread > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full shadow-sm">
                    {stats.unread} Baru
                  </span>
                )}
              </div>
              <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
                {isAdmin 
                  ? 'Siarkan informasi, maklumat akademik, edaran libur, dan agenda kegiatan langsung ke dashboard Guru & Santri.'
                  : 'Pusat informasi resmi, agenda kegiatan, pengingat akademik, dan arahan lembaga halaqah.'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              id="btn-open-create-announcement"
              onClick={handleOpenCreate}
              className="inline-flex items-center space-x-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/30 transition-all cursor-pointer transform hover:-translate-y-0.5 flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Pengumuman Baru</span>
            </button>
          )}
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold block">Total Pengumuman</span>
            <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold block">Untuk Semua</span>
            <span className="text-xl font-bold font-mono text-white">{stats.forAll}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold block">Khusus Asatidz</span>
            <span className="text-xl font-bold font-mono text-white">{stats.forGuru}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold block">Khusus Santri</span>
            <span className="text-xl font-bold font-mono text-white">{stats.forSiswa}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-announcements-input"
            type="text"
            placeholder="Cari pengumuman berdasarkan judul, isi, atau penulis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Kategori Filter */}
          <select
            id="filter-kategori-select"
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="UMUM">Umum</option>
            <option value="AKADEMIK">Akademik</option>
            <option value="KEGIATAN">Kegiatan</option>
            <option value="PENGINGAT">Pengingat</option>
            <option value="LIBUR">Libur</option>
            <option value="DARURAT">Darurat</option>
          </select>

          {/* Target Audiens Filter (Admin Only) */}
          {isAdmin && (
            <select
              id="filter-target-select"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Audiens</option>
              <option value="GURU">Khusus Guru</option>
              <option value="SISWA">Khusus Siswa</option>
            </select>
          )}

          {/* Pinned Toggle */}
          <button
            id="toggle-pinned-filter-btn"
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showPinnedOnly
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${showPinnedOnly ? 'fill-amber-600' : ''}`} />
            <span>Disematkan</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      {visibleList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Volume2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          {stats.total === 0 ? (
            <>
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Belum Ada Pengumuman Diterbitkan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {isAdmin 
                  ? 'Saat ini belum ada pengumuman atau siaran maklumat yang dibuat. Klik tombol "Buat Pengumuman Baru" untuk menerbitkan pengumuman perdana.'
                  : 'Saat ini belum ada pengumuman resmi yang disiarkan oleh pengurus halaqah.'}
              </p>
              {isAdmin && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Pengumuman Perdana</span>
                </button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Tidak ada pengumuman yang sesuai
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Coba ubah kata kunci pencarian atau reset filter kategori untuk melihat pengumuman lainnya.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedKategori('ALL');
                  setSelectedTarget('ALL');
                  setShowPinnedOnly(false);
                }}
                className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleList.map(item => {
            const isRead = userId ? (item.dibacaOleh || []).includes(userId) : true;
            const audiens = getAudiensBadge(item.targetAudiens);

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between hover:shadow-md cursor-pointer relative group ${
                  item.isPinned 
                    ? 'border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/20 to-transparent dark:from-amber-950/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.isPinned && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Pin className="w-3 h-3 fill-amber-600 dark:fill-amber-400" />
                          <span>Disematkan</span>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getKategoriBadge(item.kategori)}`}>
                        {item.kategori}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${audiens.color}`}>
                        {audiens.label}
                      </span>
                      {!item.isPublished && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Draf
                        </span>
                      )}
                    </div>

                    {!isRead && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full flex-shrink-0 animate-pulse">
                        Baru
                      </span>
                    )}
                  </div>

                  <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                    {item.judul}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {stripHtml(item.konten)}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[9px] font-bold">
                      {item.authorNama ? item.authorNama.charAt(0) : 'A'}
                    </div>
                    <span className="text-[11px] truncate max-w-[120px] font-medium text-slate-700 dark:text-slate-300">
                      {item.authorNama || 'Admin'}
                    </span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {isAdmin && (
                    <div 
                      className="flex items-center space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Pengumuman"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsDeletingId(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat / Edit Pengumuman */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Judul Pengumuman <span className="text-red-500">*</span>
                </label>
                <input
                  id="announcement-title-input"
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Ujian Tasmi' & Libur Idul Fitri"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Target & Kategori Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Target Audiens <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="announcement-target-select"
                    value={formData.targetAudiens}
                    onChange={(e) => setFormData({ ...formData, targetAudiens: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Semua (Guru & Santri)</option>
                    <option value="GURU">Khusus Guru / Asatidz</option>
                    <option value="SISWA">Khusus Santri / Siswa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="announcement-kategori-select"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UMUM">Umum</option>
                    <option value="AKADEMIK">Akademik & Ujian</option>
                    <option value="KEGIATAN">Agenda & Kegiatan</option>
                    <option value="PENGINGAT">Pengingat & Deadline</option>
                    <option value="LIBUR">Informasi Libur</option>
                    <option value="DARURAT">Penting / Darurat</option>
                  </select>
                </div>
              </div>

              {/* Konten dengan Rich Text Formatting */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Isi Pesan / Maklumat <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  id="announcement-content-input"
                  value={formData.konten}
                  onChange={(val) => setFormData({ ...formData, konten: val })}
                  placeholder="Tuliskan isi pengumuman secara rinci. Gunakan toolbar untuk format tebal, miring, garis bawah, perataan teks, dll..."
                  minHeight="180px"
                />
              </div>

              {/* Options: Pin & Published */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    id="checkbox-is-pinned"
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Sematkan di Teratas (Pinned)</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Pengumuman ini akan selalu muncul di posisi paling atas dashboard.</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <input
                    id="checkbox-is-published"
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Publikasikan Langsung</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Bila tidak dicentang, pengumuman tersimpan sebagai Draf dan belum tampil di Guru/Santri.</p>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="submit-announcement-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Siarkan Pengumuman'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Pengumuman */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {selectedDetail.isPinned && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Pin className="w-3 h-3 fill-amber-600 dark:fill-amber-400" />
                      <span>Disematkan</span>
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getKategoriBadge(selectedDetail.kategori)}`}>
                    {selectedDetail.kategori}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${getAudiensBadge(selectedDetail.targetAudiens).color}`}>
                    {getAudiensBadge(selectedDetail.targetAudiens).label}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white leading-tight">
                  {selectedDetail.judul}
                </h3>
              </div>
              <button
                id="close-announcement-detail-view"
                onClick={() => setSelectedDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author info */}
            <div className="py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                  {selectedDetail.authorNama ? selectedDetail.authorNama.charAt(0) : 'A'}
                </div>
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedDetail.authorNama || 'Administrator'}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({selectedDetail.authorRole || 'Admin'})</span>
                </div>
              </div>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(selectedDetail.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </span>
            </div>

            {/* Full text / Formatted content */}
            <div className="py-4">
              <RichTextRenderer content={selectedDetail.konten} />
            </div>

            {/* Read status summary for Admin */}
            {isAdmin && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-500 dark:text-slate-400 mb-3 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Statistik Keterbacaan:</span>
                <span>Telah dibaca oleh <strong>{(selectedDetail.dibacaOleh || []).length}</strong> pengguna.</span>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {isAdmin ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const itemToEdit = selectedDetail;
                      setSelectedDetail(null);
                      handleOpenEdit(itemToEdit);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setIsDeletingId(selectedDetail.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-xs font-semibold text-red-600 dark:text-red-300 rounded-lg transition"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sudah ditandai dibaca</span>
                </div>
              )}

              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Dialog */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">
              Hapus Pengumuman Ini?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Pengumuman yang dihapus tidak dapat dipulihkan kembali dan akan hilang dari dashboard pengguna.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(isDeletingId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
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
