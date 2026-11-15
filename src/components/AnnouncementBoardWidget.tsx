/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Pengumuman, UserRole, KategoriPengumuman, TargetAudiensPengumuman } from '../types';
import { 
  Megaphone, 
  Pin, 
  Clock, 
  User, 
  CheckCircle2, 
  Eye, 
  Plus, 
  ArrowRight, 
  Calendar, 
  Tag, 
  X, 
  Sparkles,
  AlertCircle,
  FileText,
  Volume2,
  Search,
  Filter
} from 'lucide-react';
import { RichTextRenderer } from './RichTextRenderer';
import { stripHtml } from '../utils/richText';

interface AnnouncementBoardWidgetProps {
  setActiveTab?: (tab: string) => void;
  maxItems?: number;
  showAdminAction?: boolean;
}

export const AnnouncementBoardWidget: React.FC<AnnouncementBoardWidgetProps> = ({
  setActiveTab,
  maxItems = 3,
  showAdminAction = true
}) => {
  const { currentSession, pengumumans, markPengumumanAsRead } = useApp();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Pengumuman | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | KategoriPengumuman>('ALL');
  const [showAllModal, setShowAllModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalFilter, setModalFilter] = useState<'ALL' | KategoriPengumuman>('ALL');

  const user = currentSession.user;
  const userRole = user?.role;
  const userId = user?.id || '';

  // Close modals on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedAnnouncement) {
          setSelectedAnnouncement(null);
        } else if (showAllModal) {
          setShowAllModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnouncement, showAllModal]);

  // Filter announcements for current audience
  const visibleAnnouncements = useMemo(() => {
    return (pengumumans || []).filter(p => {
      if (!p || !p.id) return false;
      if (['ann-1', 'ann-2', 'ann-3'].includes(p.id) || String(p.id).startsWith('dummy-')) return false;
      if (!p.isPublished) return false;
      if (userRole === UserRole.ADMIN) return true;
      if (userRole === UserRole.GURU) return p.targetAudiens === 'ALL' || p.targetAudiens === 'GURU';
      if (userRole === UserRole.SISWA) return p.targetAudiens === 'ALL' || p.targetAudiens === 'SISWA';
      return false;
    }).sort((a, b) => {
      // Pinned first, then newest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [pengumumans, userRole]);

  const filteredAnnouncements = useMemo(() => {
    if (activeFilter === 'ALL') return visibleAnnouncements;
    return visibleAnnouncements.filter(p => p.kategori === activeFilter);
  }, [visibleAnnouncements, activeFilter]);

  const displayedList = useMemo(() => {
    return filteredAnnouncements.slice(0, maxItems);
  }, [filteredAnnouncements, maxItems]);

  const allModalAnnouncements = useMemo(() => {
    return visibleAnnouncements.filter(p => {
      if (modalFilter !== 'ALL' && p.kategori !== modalFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.judul || '').toLowerCase().includes(q);
        const matchContent = (stripHtml(p.konten) || '').toLowerCase().includes(q);
        const matchAuthor = (p.authorNama || '').toLowerCase().includes(q);
        return matchTitle || matchContent || matchAuthor;
      }
      return true;
    });
  }, [visibleAnnouncements, modalFilter, searchQuery]);

  const unreadCount = useMemo(() => {
    if (!userId) return 0;
    return visibleAnnouncements.filter(p => !(p.dibacaOleh || []).includes(userId)).length;
  }, [visibleAnnouncements, userId]);

  const handleOpenDetail = (item: Pengumuman) => {
    setSelectedAnnouncement(item);
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

  if (visibleAnnouncements.length === 0 && userRole !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden mb-6 transition-all duration-200">
      {/* Header Widget */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-sans font-bold text-base text-slate-800 dark:text-white">
                Papan Pengumuman & Informasi
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500 text-white rounded-full leading-none shadow-sm">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Informasi resmi, agenda kegiatan, dan arahan lembaga
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {userRole === UserRole.ADMIN && showAdminAction && setActiveTab && (
            <button
              id="admin-create-announcement-btn"
              onClick={() => setActiveTab('pengumuman')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kelola / Buat</span>
            </button>
          )}

          {/* Tombol Lihat Semua (Buka Pop Up / Jendela untuk Guru & Siswa) */}
          <button
            id="view-all-announcements-btn"
            onClick={() => {
              if (userRole === UserRole.GURU || userRole === UserRole.SISWA || !setActiveTab) {
                setShowAllModal(true);
              } else {
                setActiveTab('pengumuman');
              }
            }}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
            title="Buka jendela seluruh pengumuman lengkap"
          >
            <span>Lihat Semua ({visibleAnnouncements.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body List */}
      {displayedList.length === 0 ? (
        <div className="p-8 text-center text-slate-400 dark:text-slate-500">
          <Volume2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-medium">Belum ada pengumuman yang diterbitkan.</p>
          {userRole === UserRole.ADMIN && setActiveTab && (
            <button
              onClick={() => setActiveTab('pengumuman')}
              className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Pengumuman Perdana</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {displayedList.map(item => {
            const isRead = userId ? (item.dibacaOleh || []).includes(userId) : true;
            const audiens = getAudiensBadge(item.targetAudiens);

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className={`p-4 transition-all duration-150 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                  item.isPinned ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                } ${!isRead ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {item.isPinned && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Pin className="w-3 h-3 fill-amber-600 dark:fill-amber-400" />
                        <span>Sematkan</span>
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getKategoriBadge(item.kategori)}`}>
                      {item.kategori}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${audiens.color}`}>
                      {audiens.label}
                    </span>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" title="Belum dibaca" />
                    )}
                  </div>

                  <h4 className="font-sans font-semibold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {item.judul}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {stripHtml(item.konten)}
                  </p>
                </div>

                <div className="flex items-center md:flex-col md:items-end justify-between text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 gap-1.5">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(item);
                    }}
                    className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Lihat Lengkap</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Jendela Detail Pengumuman Lengkap */}
      {selectedAnnouncement && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {selectedAnnouncement.isPinned && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Pin className="w-3 h-3 fill-amber-600 dark:fill-amber-400" />
                      <span>Disematkan</span>
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getKategoriBadge(selectedAnnouncement.kategori)}`}>
                    {selectedAnnouncement.kategori}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${getAudiensBadge(selectedAnnouncement.targetAudiens).color}`}>
                    {getAudiensBadge(selectedAnnouncement.targetAudiens).label}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-xl text-slate-900 dark:text-white leading-snug">
                  {selectedAnnouncement.judul}
                </h3>
              </div>
              <button
                id="close-announcement-detail-modal"
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tutup Jendela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Author & Date */}
            <div className="py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">
                  {selectedAnnouncement.authorNama ? selectedAnnouncement.authorNama.charAt(0) : 'A'}
                </div>
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedAnnouncement.authorNama}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({selectedAnnouncement.authorRole || 'Admin'})</span>
                </div>
              </div>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(selectedAnnouncement.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </span>
            </div>

            {/* Konten Utama */}
            <div className="py-5 overflow-y-auto leading-relaxed">
              <RichTextRenderer content={selectedAnnouncement.konten} />
            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Telah ditandai sebagai dibaca</span>
              </div>
              <div className="flex items-center space-x-2">
                {visibleAnnouncements.length > 1 && (
                  <button
                    onClick={() => {
                      setSelectedAnnouncement(null);
                      setShowAllModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition cursor-pointer"
                  >
                    Buka Pengumuman Lainnya
                  </button>
                )}
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jendela / Pop Up Seluruh Pengumuman Lengkap (untuk Guru/Dashboard) */}
      {showAllModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowAllModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal Jendela */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">
                    Papan Pengumuman & Informasi Lengkap
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Daftar seluruh siaran resmi dan arahan lembaga untuk Anda ({visibleAnnouncements.length} Pengumuman)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tutup Jendela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="py-3.5 space-y-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul, kata kunci, atau pembuat pengumuman..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Kategori Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {(['ALL', 'DARURAT', 'AKADEMIK', 'LIBUR', 'KEGIATAN', 'PENGINGAT', 'UMUM'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setModalFilter(cat as any)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer text-[11px] ${
                      modalFilter === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              {allModalAnnouncements.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Volume2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-medium">Tidak ada pengumuman yang sesuai kriteria.</p>
                </div>
              ) : (
                allModalAnnouncements.map(item => {
                  const isRead = userId ? (item.dibacaOleh || []).includes(userId) : true;
                  const audiens = getAudiensBadge(item.targetAudiens);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenDetail(item)}
                      className={`pt-2.5 first:pt-0 p-3.5 rounded-xl transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 ${
                        item.isPinned ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      } ${!isRead ? 'border-l-4 !border-l-amber-500' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {item.isPinned && (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Pin className="w-2.5 h-2.5 fill-amber-600 dark:fill-amber-400" />
                              <span>Disematkan</span>
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getKategoriBadge(item.kategori)}`}>
                            {item.kategori}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${audiens.color}`}>
                            {audiens.label}
                          </span>
                          {!isRead && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500 text-white rounded-full">
                              Baru
                            </span>
                          )}
                        </div>

                        <h4 className="font-sans font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                          {item.judul}
                        </h4>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {stripHtml(item.konten)}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </span>
                          <span>•</span>
                          <span>Oleh: {item.authorNama || 'Admin'}</span>
                        </div>
                      </div>

                      <div className="sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item);
                          }}
                          className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Lengkap</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Modal Jendela */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Menampilkan {allModalAnnouncements.length} dari {visibleAnnouncements.length} pengumuman
              </span>
              <button
                onClick={() => setShowAllModal(false)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
