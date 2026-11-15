import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { formatHijriDate, getOffsetPreview } from '../utils/hijriDate';
import { Calendar, SlidersHorizontal, ExternalLink, X } from 'lucide-react';

interface IslamicHeaderOrnamentProps {
  className?: string;
  onOpenSettings?: () => void;
}

export const IslamicHeaderOrnament: React.FC<IslamicHeaderOrnamentProps> = ({ 
  className = "",
  onOpenSettings
}) => {
  const { hijriSetting, updateHijriSetting, currentSession } = useApp();
  const isAdmin = currentSession?.user?.role === UserRole.ADMIN;
  
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const activeDateText = formatHijriDate(hijriSetting);
  const currentOffset = hijriSetting?.mode === 'manual' ? null : (hijriSetting?.dayOffset ?? 0);

  const handleSelectOffset = async (offset: number) => {
    setIsUpdating(true);
    try {
      await updateHijriSetting({
        mode: 'auto_offset',
        dayOffset: offset
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div 
        onClick={isAdmin ? () => setIsQuickModalOpen(true) : undefined}
        title={isAdmin ? "Klik untuk mengoreksi / menyesuaikan tanggal Hijriah (Hilal)" : "Kalender Hijriah"}
        className={`relative inline-flex items-center gap-1.5 sm:gap-3 select-none px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500/[0.04] via-amber-500/[0.06] to-emerald-500/[0.08] dark:from-emerald-950/30 dark:via-amber-950/20 dark:to-emerald-900/30 border border-amber-500/25 dark:border-amber-500/30 shadow-[0_1px_8px_-2px_rgba(217,119,6,0.1)] backdrop-blur-sm group hover:border-amber-500/50 transition-all duration-300 max-w-full ${isAdmin ? 'cursor-pointer' : ''} ${className}`}
      >
        {/* Decorative Left End Ornate Finial (Visible on tablet/desktop, subtle on mobile) */}
        <svg className="hidden sm:block w-3.5 sm:w-4 md:w-5 h-5 sm:h-7 text-amber-500/70 dark:text-amber-400/80 shrink-0" viewBox="0 0 20 32" fill="none">
          <path d="M18 4 C10 8, 4 12, 4 16 C4 20, 10 24, 18 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="4" cy="16" r="2" fill="currentColor" />
          <circle cx="12" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
          <circle cx="12" cy="23" r="1.2" fill="currentColor" opacity="0.6" />
        </svg>

        {/* Center Calligraphy & Hijri Pill */}
        <div className="flex flex-col items-center justify-center text-center min-w-0">
          {/* Bismillah Calligraphic Vector Typography */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Micro 8-pointed star left */}
            <svg className="hidden sm:block w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.8 7.2L20.5 5.5L18.8 11.2L24 14L18.8 16.8L20.5 22.5L14.8 20.8L12 26L9.2 20.8L3.5 22.5L5.2 16.8L0 14L5.2 11.2L3.5 5.5L9.2 7.2L12 2Z" />
            </svg>

            <span 
              className="text-[12.5px] sm:text-[15px] md:text-[18px] leading-tight font-serif tracking-normal text-slate-800 dark:text-amber-200 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_8px_rgba(245,158,11,0.25)] font-medium select-none whitespace-nowrap"
              style={{ fontFamily: "'Traditional Arabic', 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', 'Geeza Pro', serif" }}
              dir="rtl"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>

            {/* Micro 8-pointed star right */}
            <svg className="hidden sm:block w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.8 7.2L20.5 5.5L18.8 11.2L24 14L18.8 16.8L20.5 22.5L14.8 20.8L12 26L9.2 20.8L3.5 22.5L5.2 16.8L0 14L5.2 11.2L3.5 5.5L9.2 7.2L12 2Z" />
            </svg>
          </div>

          {/* Dynamic Hijri & Islamic Subtitle with subtle dividers */}
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 max-w-full">
            <div className="h-[1px] w-2 sm:w-5 bg-gradient-to-r from-transparent via-amber-400/60 to-amber-500/80 shrink-0"></div>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-medium tracking-wide text-emerald-700 dark:text-emerald-300/90 font-sans flex items-center gap-1 whitespace-nowrap">
              <span>{activeDateText}</span>
              {isAdmin && (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 dark:text-amber-400 text-[8px] sm:text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 px-1 rounded border border-amber-200 dark:border-amber-800">
                  {hijriSetting?.mode === 'manual' ? 'Manual' : (currentOffset !== 0 ? `${currentOffset! > 0 ? '+' : ''}${currentOffset}h` : 'Ubah')}
                </span>
              )}
            </span>
            <div className="h-[1px] w-2 sm:w-5 bg-gradient-to-l from-transparent via-amber-400/60 to-amber-500/80 shrink-0"></div>
          </div>
        </div>

        {/* Decorative Right End Ornate Finial (Visible on tablet/desktop, subtle on mobile) */}
        <svg className="hidden sm:block w-3.5 sm:w-4 md:w-5 h-5 sm:h-7 text-amber-500/70 dark:text-amber-400/80 shrink-0" viewBox="0 0 20 32" fill="none">
          <path d="M2 4 C10 8, 16 12, 16 16 C16 20, 10 24, 2 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2" fill="currentColor" />
          <circle cx="8" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
          <circle cx="8" cy="23" r="1.2" fill="currentColor" opacity="0.6" />
        </svg>
      </div>

      {/* Quick Access Modal for Admin */}
      {isQuickModalOpen && isAdmin && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsQuickModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900/50 shadow-2xl w-full max-w-md p-5 text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    Koreksi Cepat Kalender Hijriah
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Sesuaikan tanggal Hijriah dengan rukyatul hilal setempat
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsQuickModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Display Preview */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 text-center space-y-1">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider font-mono">
                Tanggal Tampil Saat Ini:
              </span>
              <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">
                {activeDateText}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {getOffsetPreview(0).gregorianDate}
              </p>
            </div>

            {/* Quick Offset Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Pilih Penyesuaian Hilal:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentOffset !== null ? `Offset aktif: ${currentOffset > 0 ? '+' : ''}${currentOffset} hari` : 'Mode Manual'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[-2, -1, 0, 1, 2].map((off) => {
                  const isSelected = hijriSetting?.mode === 'auto_offset' && (hijriSetting.dayOffset ?? 0) === off;
                  const prev = getOffsetPreview(off);
                  return (
                    <button
                      key={off}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleSelectOffset(off)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-700 dark:text-slate-200'
                      }`}
                      title={`Koreksi ${off > 0 ? '+' : ''}${off} hari (${prev.formatted})`}
                    >
                      <span className="text-xs font-extrabold">
                        {off === 0 ? '0' : `${off > 0 ? '+' : ''}${off}h`}
                      </span>
                      <span className={`text-[9px] truncate max-w-full font-mono mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {prev.formatted.split(' ')[0]} {prev.formatted.split(' ')[1]?.slice(0, 3)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                *Contoh: Jika hilal belum terlihat di Indonesia, pilih <strong>-1h</strong> untuk memundurkan 1 hari dari kalender Ummul Qura.
              </p>
            </div>

            {/* Footer with link to full settings */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsQuickModalOpen(false);
                  if (onOpenSettings) {
                    onOpenSettings();
                  }
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Buka Tab "Kalender Hijriah" di Pengaturan</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => setIsQuickModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
