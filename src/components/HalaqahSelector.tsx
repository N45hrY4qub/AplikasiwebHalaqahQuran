import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Halaqah } from '../types';
import { 
  BookOpen, 
  Users, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle, 
  LogOut, 
  Clock 
} from 'lucide-react';
import { AdaptiveLogo } from './AdaptiveLogo';
import { getTeacherHalaqahs, normalizeHalaqahKey } from '../utils/studentAttendanceHelper';
import { resolveInstitutionName } from '../utils/brandingHelper';

interface HalaqahSelectorProps {
  onSelect: (halaqahId: string) => void;
}

export const HalaqahSelector: React.FC<HalaqahSelectorProps> = ({ onSelect }) => {
  const { currentSession, halaqahs, siswas, logout, setSelectedGuruHalaqahId, strukturLembaga, pwaSettings, gurus, guruSchedules } = useApp();
  
  const user = currentSession.user;
  const teacherId = user?.id || '';
  const myHalaqahs = React.useMemo(() => {
    return getTeacherHalaqahs(halaqahs, user, gurus, guruSchedules, siswas, strukturLembaga);
  }, [halaqahs, user, gurus, guruSchedules, siswas, strukturLembaga]);
  const activeIcon = pwaSettings?.appIcon || '';

  // 1. Determine title/greeting based on Gender
  const isPerempuan = (user as any)?.jenisKelamin === 'Perempuan';
  const panggilan = isPerempuan ? 'Ustadzah' : 'Ustadz';
  
  // Clean short name to show in title
  const cleanName = user?.namaLengkap
    ? user.namaLengkap.replace(/^(Ustadz|Ustadzah|Ust\.|Ust)\s+/i, '')
    : 'Guru';

  // 2. Last used halaqah logic
  const lastUsedKey = `mh_last_used_halaqah_${teacherId}`;
  const [lastUsedId, setLastUsedId] = useState<string | null>(() => {
    return user ? localStorage.getItem(lastUsedKey) : null;
  });
  
  const lastUsedHalaqah = myHalaqahs.find(h => h.id === lastUsedId);
  // Default to false so user is immediately presented with all halaqah choices rather than stuck on last-used
  const [showLastUsedView, setShowLastUsedView] = useState<boolean>(false);

  if (!user) return null;

  // 3. Draft/Unsaved Check logic (Check local storage for real drafts)
  const hasUnsavedWork = (halaqahId: string) => {
    const realDraftSetoran = localStorage.getItem(`mh_draft_setoran_active_${halaqahId}`) === 'true';
    const realDraftAbsensi = localStorage.getItem(`mh_draft_absensi_active_${halaqahId}`) === 'true';
    const realDraftMurojaah = localStorage.getItem(`mh_draft_murojaah_active_${halaqahId}`) === 'true';

    return realDraftSetoran || realDraftAbsensi || realDraftMurojaah;
  };

  const getUnsavedLabels = (halaqahId: string) => {
    const list: string[] = [];
    const realDraftSetoran = localStorage.getItem(`mh_draft_setoran_active_${halaqahId}`) === 'true';
    const realDraftAbsensi = localStorage.getItem(`mh_draft_absensi_active_${halaqahId}`) === 'true';
    const realDraftMurojaah = localStorage.getItem(`mh_draft_murojaah_active_${halaqahId}`) === 'true';
    
    if (realDraftSetoran) list.push('Setoran');
    if (realDraftAbsensi) list.push('Absensi');
    if (realDraftMurojaah) list.push('Murojaah');

    return list;
  };

  const handleSelectHalaqah = (id: string) => {
    localStorage.setItem(lastUsedKey, id);
    if (teacherId) {
      localStorage.setItem(`mh_selected_guru_halaqah_id_${teacherId}`, id);
    }
    localStorage.setItem('mh_selected_guru_halaqah_id', id);
    setSelectedGuruHalaqahId(id);
    onSelect(id);
  };

  const handleUseLastHalaqah = () => {
    if (lastUsedHalaqah) {
      handleSelectHalaqah(lastUsedHalaqah.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Immersive background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-950/15 via-slate-950 to-slate-950 z-0 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] z-0 pointer-events-none" />

      {/* Top clean header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <AdaptiveLogo
            src={activeIcon}
            alt="Logo Halaqah"
            sizeClassName="w-10 h-10"
            roundedClassName="rounded-xl"
            fallbackIcon={
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            }
          />
          <div>
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase block">
              Aplikasi Monitoring Halaqah
            </span>
            <span className="text-xs text-slate-300 font-medium font-sans">
              Halaqah {panggilan} {cleanName}
            </span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="flex items-center gap-2 p-2 px-3 text-xs font-bold font-sans text-rose-450 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 rounded-xl transition cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          
          {/* VIEW 1: Last used halaqah display */}
          {showLastUsedView && lastUsedHalaqah && (
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-8 shadow-2xl text-center space-y-8 animate-scale-up">
              
              {/* Decorative light effect & Adaptive Logo Frame */}
              <div className="mx-auto flex justify-center">
                <AdaptiveLogo
                  src={strukturLembaga?.yayasan?.logo || activeIcon}
                  alt="Logo Yayasan"
                  sizeClassName="w-24 h-24"
                  roundedClassName="rounded-3xl"
                  fallbackIcon={
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-950 border border-slate-800/90 shadow-2xl flex items-center justify-center relative overflow-hidden">
                      <span className="relative z-10 text-4xl">🕌</span>
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 animate-pulse" />
                    </div>
                  }
                />
              </div>

              {/* Greeting */}
              <div className="space-y-3">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Ahlan wa Sahlan</p>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
                  {panggilan} {cleanName}
                </h1>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  Selamat datang kembali. Semoga Allah memberkahi tugas dan dakwah yang {panggilan} emban hari ini.
                </p>
              </div>

              {/* Last Used Halaqah Display Box */}
              <div className="max-w-md mx-auto p-5 bg-gradient-to-b from-slate-950/80 to-slate-950/50 rounded-2xl border border-emerald-555/20 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 rounded-bl-xl border-l border-b border-emerald-500/25 font-bold uppercase">
                  Terakhir Digunakan
                </div>
                
                <div className="text-left space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Halaqah bimbingan aktif terakhir:</span>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: lastUsedHalaqah.warnaIdentitas || '#10B981' }} 
                    />
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {lastUsedHalaqah.namaHalaqah}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{siswas.filter(s => s.halaqahId === lastUsedHalaqah.id).length} Peserta</span>
                    </span>
                    {hasUnsavedWork(lastUsedHalaqah.id) && (
                      <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Ada Draft</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Decision Buttons */}
              <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleUseLastHalaqah}
                  className="flex-1 p-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-2xl transition cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2 group shadow-xl shadow-emerald-900/10"
                >
                  <span>Lanjutkan</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowLastUsedView(false)}
                  className="shrink-0 p-4 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-2xl transition font-bold text-sm cursor-pointer active:scale-95"
                >
                  Pilih Halaqah Lain
                </button>
              </div>

            </div>
          )}

          {/* VIEW 2: Selection representing list of Halaqah */}
          {(!showLastUsedView || !lastUsedHalaqah) && (
            <div className="space-y-8 animate-fade-in">
              {/* Main greeting */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>Mulai Bimbingan Sesi Ini</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  Ahlan wa Sahlan, {panggilan} {cleanName}
                </h1>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  Semoga Allah memberikan kemudahan, keikhlasan, dan keberkahan dalam mengajarkan Al-Qur'an hari ini. Silakan pilih halaqah yang akan {panggilan} bimbing.
                </p>
              </div>

              {/* Grid of cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myHalaqahs.map((halaqah) => {
                  const halKey = normalizeHalaqahKey(halaqah.namaHalaqah);
                  const studentCount = siswas.filter(s => 
                    s.halaqahId === halaqah.id || 
                    (s.halaqahNama && halKey && normalizeHalaqahKey(s.halaqahNama) === halKey)
                  ).length;
                  const unsaved = hasUnsavedWork(halaqah.id);
                  const labels = getUnsavedLabels(halaqah.id);

                  return (
                    <div 
                      key={halaqah.id}
                      onClick={() => handleSelectHalaqah(halaqah.id)}
                      className="group relative bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                    >
                      {/* Left color border accent */}
                      <div 
                        className="absolute inset-y-0 left-0 w-1.5 transition-all group-hover:w-2" 
                        style={{ backgroundColor: halaqah.warnaIdentitas || '#10B981' }}
                      />

                      {/* Content block */}
                      <div className="pl-2 space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors tracking-wide pr-4">
                            {halaqah.namaHalaqah}
                          </h3>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 max-w-xs font-sans leading-relaxed min-h-[32px]">
                          {halaqah.keterangan || 'Grup halaqah bimbingan santri aktif.'}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-xs">
                          <span className="flex items-center gap-1.5 text-slate-300 font-mono">
                            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{studentCount} Santri</span>
                          </span>

                          <span className="flex items-center gap-1 text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Pilih</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* Warning/Unsaved alert indicators */}
                      {unsaved && (
                        <div className="absolute top-4 right-4 animate-pulse">
                          <div className="flex items-center gap-1.5 p-1 px-2.5 bg-amber-500/15 border border-amber-500/25 rounded-full text-[9px] font-extrabold font-mono tracking-widest text-amber-400 uppercase">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Unsaved ({labels.join('/')})</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {myHalaqahs.length === 0 && (
                  <div className="col-span-full bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4">
                    <p className="text-sm">Tidak ditemukan grup halaqah bimbingan aktif untuk akun Anda.</p>
                    <p className="text-xs text-slate-500">Hubungi Administrator untuk mendaftarkan bimbingan Anda.</p>
                  </div>
                )}
              </div>
              
              {/* Optional footer info on last-used if available */}
              {lastUsedHalaqah && (
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setShowLastUsedView(true)}
                    className="text-xs font-semibold text-slate-450 hover:text-emerald-400 transition underline decoration-dashed underline-offset-4"
                  >
                    Kembali ke layar ringkasan sesi terakhir
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer metadata line */}
      <footer className="w-full text-center py-4 text-xs font-medium text-slate-500 tracking-wide shrink-0">
        Aplikasi Monitoring Halaqah • {resolveInstitutionName(pwaSettings?.appName, strukturLembaga?.yayasan?.nama)}
      </footer>
    </div>
  );
};
