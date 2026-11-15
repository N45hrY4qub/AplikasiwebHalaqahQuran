/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Lock, 
  LogOut, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  RotateCcw, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  User,
  Info
} from 'lucide-react';
import { getOperationalStatus, getWIBTime } from '../utils/operationalHours';
import { useApp } from '../context/AppContext';

interface LockScreenOverlayProps {
  onLogout: () => void;
  userNama: string;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({ onLogout, userNama }) => {
  const [currentWib, setCurrentWib] = useState(() => getWIBTime().formattedTime);
  const [showAllSetorans, setShowAllSetorans] = useState(false);
  const statusInfo = getOperationalStatus();
  const { currentSession, setorans } = useApp();

  const siswaId = currentSession.user?.id || '';

  const mySetorans = setorans
    .filter(s => s.siswaId === siswaId || (currentSession.user?.email && s.siswaNis === currentSession.user.email.split('@')[0]))
    .sort((a, b) => {
      if (a.tanggalSetoran !== b.tanggalSetoran) {
        return b.tanggalSetoran.localeCompare(a.tanggalSetoran);
      }
      const tsA = parseInt(a.id.replace('set-', '')) || 0;
      const tsB = parseInt(b.id.replace('set-', '')) || 0;
      return tsB - tsA;
    });

  const displayedSetorans = showAllSetorans ? mySetorans : mySetorans.slice(0, 4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWib(getWIBTime().formattedTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderLockCatatan = (catatan: string) => {
    if (!catatan || catatan.trim() === '') {
      return (
        <span className="text-slate-500 italic text-[11px] block py-0.5">
          Tidak ada catatan evaluasi khusus dari Guru pembimbing.
        </span>
      );
    }

    const lines = catatan.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return (
        <span className="text-slate-500 italic text-[11px] block py-0.5">
          Tidak ada catatan evaluasi khusus dari Guru pembimbing.
        </span>
      );
    }

    // Pattern for automated correction notes: [Koreksi "WORD" [Category] di Surah X Ayat Y]: Note
    const koreksiRegex = /^\[Koreksi\s+"([^"]+)"(?:\s+\[([^\]]+)\])?(?:\s+di\s+([^\]]+))?\]:?\s*(.*)$/;

    return (
      <div className="space-y-2 text-left mt-1">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '');
          const match = cleanLine.match(koreksiRegex);

          if (match) {
            const [, arabicWord, category, location, note] = match;
            return (
              <div 
                key={idx} 
                className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 sm:p-3 space-y-1.5 shadow-2xs transition-all hover:border-slate-700/80"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Arabic word badge */}
                    <span 
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 font-['Amiri',serif] font-bold text-sm tracking-wide shadow-xs" 
                      dir="rtl"
                    >
                      {arabicWord}
                    </span>
                    {category && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-800/50 text-indigo-300 text-[10px] font-bold font-mono uppercase tracking-wider">
                        {category}
                      </span>
                    )}
                  </div>
                  {location && (
                    <span className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-1">
                      <span>📍</span>
                      <span>{location}</span>
                    </span>
                  )}
                </div>
                {note && (
                  <div className="text-xs text-slate-200 font-medium pl-2 border-l-2 border-emerald-500/50 leading-relaxed pt-0.5">
                    {note}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2 leading-relaxed text-xs">
              <span className="text-emerald-400 font-bold shrink-0 select-none mt-0.5">•</span>
              <span className="text-slate-200 font-medium break-words text-left">{cleanLine}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto font-sans selection:bg-emerald-500 selection:text-white py-6 md:py-12 custom-scrollbar">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/25 via-slate-950 to-slate-950 z-0 pointer-events-none" />
      
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px] z-0 pointer-events-none" />

      {/* Main card container */}
      <div className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-5 sm:p-8 shadow-2xl z-10 text-center flex flex-col items-center my-auto">
        
        {/* Animated Lock Icon & Status Header */}
        <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 border border-slate-750 text-rose-400 shadow-xl mb-4 sm:mb-5">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
          <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-500 border-2 border-slate-900 text-[10px] font-black text-white shadow-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>OFFLINE</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
          Akses Akun Siswa Ditutup
        </h2>

        {/* Greeting with student name */}
        <p className="text-xs sm:text-sm text-slate-400 font-medium mb-5 flex items-center justify-center gap-1.5 flex-wrap">
          <span>Assalamu'alaikum,</span>
          <strong className="text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-800/40 font-mono">
            {userNama}
          </strong>
        </p>

        {/* Operational Hours Description Box */}
        <div className="w-full bg-slate-950/60 rounded-2xl p-4 sm:p-5 border border-slate-800/80 mb-5 text-left space-y-3 shadow-inner">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Akun Siswa dibuka untuk akses live data setiap hari pukul{' '}
              <strong className="text-emerald-300 font-bold font-mono">
                {statusInfo.openTimeStr} s.d. {statusInfo.closeTimeStr} WIB
              </strong>.
            </p>
          </div>
          
          <div className="border-t border-slate-850/80 my-1" />
          
          <div className="text-[11px] sm:text-xs text-slate-400 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Di luar jam operasional, Anda tetap dapat meninjau capaian setoran terakhir dan memanfaatkan waktu untuk murojaah hafalan secara mandiri di rumah.
            </span>
          </div>
        </div>

        {/* Key Time & Schedule Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-5 text-left">
          {/* Realtime Clock Card */}
          <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                Waktu WIB Saat Ini
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="tabular-nums tracking-wider">{currentWib}</span>
              </span>
            </div>
            <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400 font-bold">
              WIB
            </div>
          </div>

          {/* Next Schedule Card */}
          <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                Jadwal Buka Berikutnya
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusInfo.nextOpenText}</span>
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </div>
        </div>

        {/* Latest Submissions & Achievements Section */}
        {mySetorans.length > 0 && (
          <div className="w-full text-left border-t border-slate-800/80 pt-5 mb-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black text-indigo-300 uppercase tracking-widest font-mono flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Capaian &amp; Riwayat Setoran Terakhir</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-[10px]">
                  {mySetorans.length}
                </span>
              </span>

              {mySetorans.length > 4 && (
                <button
                  onClick={() => setShowAllSetorans(prev => !prev)}
                  className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 cursor-pointer font-mono"
                >
                  <span>{showAllSetorans ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${mySetorans.length})`}</span>
                  {showAllSetorans ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Scrollable Container with Custom Dark Scrollbar */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
              {displayedSetorans.map((s) => (
                <div 
                  key={s.id} 
                  className={`p-4 rounded-2xl border transition-all text-left space-y-3 shadow-md ${
                    s.statusLulus 
                      ? 'border-emerald-900/50 bg-emerald-950/15 hover:border-emerald-700/60' 
                      : 'border-rose-900/40 bg-rose-950/15 hover:border-rose-700/50'
                  }`}
                >
                  {/* Card Top Row: Date on Left, Status & Score on Right */}
                  <div className="flex items-center justify-between text-xs gap-3 flex-wrap border-b border-slate-850/80 pb-2.5">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono font-semibold text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.tanggalSetoran}</span>
                    </div>

                    {/* Right Badges: Status + Nilai / Predikat */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Chip */}
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border flex items-center gap-1.5 shadow-xs ${
                        s.statusLulus 
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' 
                          : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                      }`}>
                        {s.statusLulus ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <RotateCcw className="w-3 h-3 text-rose-400 shrink-0" />
                        )}
                        <span>{s.statusLulus ? 'LULUS' : 'MENGULANG'}</span>
                      </span>

                      {/* Score Chip (Clean, adaptive width, no fixed overflow box) */}
                      {s.nilai && (
                        <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-750 text-amber-300 font-mono font-bold text-[10px] flex items-center gap-1 shadow-xs whitespace-nowrap">
                          <Award className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{s.nilai}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Material Name & Details */}
                  <div className="bg-slate-950/60 rounded-xl p-3 sm:p-3.5 border border-slate-850/90 space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                        <span>📖</span>
                        <span>Materi Setoran:</span>
                      </span>
                      {s.guruNama && (
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Ustadz/ah: <strong className="text-slate-200">{s.guruNama}</strong></span>
                        </span>
                      )}
                    </div>

                    <div className="font-black text-sm text-white">
                      {s.modulNama || 'Tahfidz Al-Qur\'an'}
                    </div>

                    {/* Multi-Surah List */}
                    {s.daftarSuratSetoran && s.daftarSuratSetoran.length > 0 ? (
                      <div className="space-y-1 pt-1 border-t border-slate-900">
                        {s.daftarSuratSetoran.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs font-mono text-emerald-300 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{item.suratNama} (Ayat {item.ayatAwal}-{item.ayatAkhir})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {s.suratNama && (
                          <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Surat {s.suratNama}</span>
                            {s.ayatAwal && (
                              <span className="text-slate-400">(Ayat {s.ayatAwal}-{s.ayatAkhir})</span>
                            )}
                          </span>
                        )}

                        {/* Setoran Type Tag (Baru / Murojaah) */}
                        {(s.tipeTahfidz || s.jenisSetoran) && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400 font-bold">
                            {s.tipeTahfidz || s.jenisSetoran}
                          </span>
                        )}

                        {s.nonQuranJilid !== undefined && (
                          <span className="text-xs font-mono text-indigo-300 font-semibold">
                            Jilid {s.nonQuranJilid} Hal {s.nonQuranPageAwal}-{s.nonQuranPageAkhir}
                          </span>
                        )}

                        {s.catatanModulLain && (
                          <span className="text-xs font-mono text-indigo-300 font-semibold">
                            {s.catatanModulLain}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Teacher's Correction & Feedback */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <span>Detail Catatan &amp; Koreksi Guru:</span>
                    </span>
                    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-850/80 leading-relaxed shadow-xs">
                      {renderLockCatatan(s.catatanGuru)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-bold transition-all duration-200 shadow-md hover:shadow-slate-950/70 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Keluar Akun</span>
          </button>

          <div
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 text-emerald-300 rounded-xl border border-emerald-800/50 text-xs font-bold shadow-md"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Selamat Murojaah Mandiri</span>
          </div>
        </div>

      </div>
    </div>
  );
};
