import React from 'react';
import { Setoran, TipeModul } from '../types';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Award, 
  Sparkles 
} from 'lucide-react';
import { renderArabicEnhancedText } from '../lib/arabicHelper';

interface SiswaDetailSetoranModalProps {
  viewingSetoran: Setoran | null;
  onClose: () => void;
}

export const SiswaDetailSetoranModal: React.FC<SiswaDetailSetoranModalProps> = ({
  viewingSetoran,
  onClose
}) => {
  if (!viewingSetoran) return null;

  const categoryCounts = {
    tajwid: 0,
    makhraj: 0,
    kelancaran: 0,
    lainnya: 0
  };
  viewingSetoran.interactiveComments?.forEach(c => {
    const cat = (c.category || '').toLowerCase();
    if (cat.includes('tajwid')) categoryCounts.tajwid++;
    else if (cat.includes('makhraj') || cat.includes('huruf') || cat.includes('tajwid_makhraj')) categoryCounts.makhraj++;
    else if (cat.includes('lancar') || cat.includes('baca') || cat.includes('tajwid_kelancaran')) categoryCounts.kelancaran++;
    else categoryCounts.lainnya++;
  });

  const hasMistakes = (categoryCounts.tajwid + categoryCounts.makhraj + categoryCounts.kelancaran + categoryCounts.lainnya) > 0;

  // Parse the grade/nilai to avoid overflow
  const parsedNilai = (() => {
    const val = viewingSetoran.nilai || '';
    const match = val.match(/\(([^)]+)\)/);
    if (match) {
      const code = match[1]; // e.g. "A+" or "B+"
      const text = val.replace(/\s*\([^)]+\)/, '').trim(); // e.g. "Jayyid Jiddan"
      return { code, text };
    }
    if (val.length <= 4) {
      return { code: val, text: '' };
    }
    if (val.toLowerCase() === 'perlu ulangan') {
      return { code: '⚠️', text: 'Perlu Ulangan' };
    }
    return { code: val.substring(0, 3).toUpperCase(), text: val };
  })();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl relative border border-slate-100 dark:border-slate-800/80 my-8 flex flex-col max-h-[90vh] text-left animate-fade-in overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm border border-emerald-100/30">
              <BookOpen className="w-6 h-6 stroke-2" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Rincian Lengkap Setoran Saya</h4>
              <div className="flex items-center space-x-2.5 mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{viewingSetoran.tanggalSetoran}</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg text-slate-505 dark:text-slate-400 border border-slate-200/20">ID: {viewingSetoran.id.substring(0, 8)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider ${
              viewingSetoran.statusLulus 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-350 border border-emerald-200/20' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-955/50 dark:text-rose-350 border border-rose-200/20'
            }`}>
              {viewingSetoran.statusLulus ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Lulus</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Remedi</span>
                </>
              )}
            </span>
            <button 
              type="button" 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent hover:border-slate-200/35 dark:hover:border-slate-700/50"
            >
              <X className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Kolom Kiri: Informasi Santri & Pelajaran */}
            <div className="space-y-6">
              
              {/* Card Informasi Santri */}
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Informasi Santri</h5>
                <div className="p-5 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl space-y-4 shadow-xs hover:shadow-sm transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-black text-base uppercase shadow-sm">
                      {viewingSetoran.siswaNama?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white text-base">{viewingSetoran.siswaNama}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">NIS: {viewingSetoran.siswaNis || '-'}</div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Grup Halaqah</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.halaqahNama || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ustadz/Ustadzah Penguji</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.guruNama || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Materi Ajar & Kategori */}
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">Materi Ajar & Kategori</h5>
                <div className="p-5 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl space-y-4 shadow-xs hover:shadow-sm transition-all duration-300 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Modul/Kitab</span>
                    <span className="font-black text-slate-800 dark:text-white text-base block">{viewingSetoran.modulNama}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Elemen Setoran</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.jenisSetoran || 'Setoran'}</span>
                    </div>
                    {viewingSetoran.tipeTahfidz && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kategori</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 block mt-1">{viewingSetoran.tipeTahfidz}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Rincian Ayat/Halaman</span>
                    
                    {viewingSetoran.daftarSuratSetoran && viewingSetoran.daftarSuratSetoran.length > 0 ? (
                      <div className="space-y-2 mt-1">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">Multi-Surat ({viewingSetoran.daftarSuratSetoran.length} surat):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {viewingSetoran.daftarSuratSetoran.map((item, index) => (
                            <span key={index} className="inline-block px-2.5 py-1 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-bold">
                              {item.suratNama}: {item.ayatAwal}-{item.ayatAkhir}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : viewingSetoran.tipeModul === TipeModul.AL_QURAN ? (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-xs shadow-xs">
                          {viewingSetoran.suratNama || 'Surat Tidak Teridentifikasi'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-xl border border-slate-100/50 dark:border-slate-800/50">Ayat {viewingSetoran.ayatAwal} s/d {viewingSetoran.ayatAkhir}</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs shadow-xs">
                          Jilid {viewingSetoran.nonQuranJilid || 1}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                          {viewingSetoran.nonQuranHalamanTunggal ? (
                            `Halaman ${viewingSetoran.halaman || 1}`
                          ) : (
                            `Halaman ${viewingSetoran.nonQuranPageAwal || viewingSetoran.halaman || 1} s/d ${viewingSetoran.nonQuranPageAkhir || viewingSetoran.halaman || 1}`
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nilai / Score Card */}
              <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 p-5 shadow-sm hover:shadow-md ${
                viewingSetoran.statusLulus 
                  ? 'bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white dark:from-emerald-950/10 dark:via-slate-900/30 dark:to-slate-950 border-emerald-500/30 dark:border-emerald-500/15' 
                  : 'bg-gradient-to-br from-rose-50/40 via-amber-50/15 to-white dark:from-rose-950/10 dark:via-slate-900/30 dark:to-slate-950 border-rose-500/30 dark:border-rose-500/15'
              }`}>
                {/* Elegant background glowing design */}
                <div className={`absolute -right-8 -bottom-8 w-36 h-36 rounded-full opacity-10 blur-3xl pointer-events-none ${
                  viewingSetoran.statusLulus ? 'bg-emerald-450 dark:bg-emerald-400' : 'bg-rose-450 dark:bg-rose-400'
                }`}></div>
                <div className="absolute top-2 right-2 flex space-x-1 opacity-15 pointer-events-none">
                  <Award className="w-16 h-16 stroke-1 rotate-12 text-slate-400 dark:text-slate-600" />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 relative z-10">
                  {/* Left Panel: Big circular Score / Grade badge */}
                  <div className="flex items-center space-x-4 text-left">
                    <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shadow-md relative shrink-0 transition-all duration-300 ${
                      viewingSetoran.statusLulus
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-white dark:border-slate-900 text-white'
                        : 'bg-gradient-to-br from-rose-500 to-amber-600 border-white dark:border-slate-900 text-white'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-1.5 right-1.5 animate-pulse" />
                      <span className={`font-sans font-black leading-none tracking-tight ${
                        parsedNilai.code.length > 2 ? 'text-lg' : 'text-3xl'
                      }`}>
                        {parsedNilai.code}
                      </span>
                      <span className="text-[8px] font-bold tracking-widest uppercase opacity-85 mt-1">Nilai</span>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest block px-2.5 py-0.5 rounded-full w-max ${
                        viewingSetoran.statusLulus 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}>
                        {viewingSetoran.statusLulus ? 'LULUS / JAYYID' : 'BELUM LULUS / REMEDI'}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                        {parsedNilai.text ? `${parsedNilai.text} (${parsedNilai.code})` : viewingSetoran.nilai}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Kesimpulan: <span className="font-extrabold text-slate-700 dark:text-slate-300">{viewingSetoran.kesimpulanHasilKelulusan || (viewingSetoran.statusLulus ? 'Lulus Sempurna' : 'Perlu Bimbingan Ulang')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Panel: Mistakes summary capsules */}
                  <div className="flex flex-col gap-1.5 min-w-[160px] bg-white/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 text-left">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Ringkasan Evaluasi</span>
                    {!hasMistakes ? (
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-650 dark:text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>✨ Bacaan Mumtaz</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                        {categoryCounts.makhraj > 0 && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-100/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            <span>{categoryCounts.makhraj} Makhraj</span>
                          </span>
                        )}
                        {categoryCounts.tajwid > 0 && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-100/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                            <span>{categoryCounts.tajwid} Tajwid</span>
                          </span>
                        )}
                        {categoryCounts.kelancaran > 0 && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-100/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                            <span>{categoryCounts.kelancaran} Lancar</span>
                          </span>
                        )}
                        {categoryCounts.lainnya > 0 && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-50 text-slate-750 dark:bg-slate-900/30 dark:text-slate-355 border border-slate-100/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-450 shrink-0"></span>
                            <span>{categoryCounts.lainnya} Lainnya</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Catatan Guru & Koreksi Detail */}
            <div className="space-y-6 text-left">
              
              {/* Card Catatan Guru */}
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2.5">Catatan Guru / Ustadz</h5>
                <div className="p-5 bg-amber-50/15 dark:bg-amber-955/5 border border-amber-200/20 dark:border-amber-950/15 rounded-3xl relative min-h-[110px] shadow-xs hover:shadow-sm transition-all duration-300">
                  <span className="absolute top-2.5 right-4 text-amber-500/20 dark:text-amber-500/10 text-5xl font-serif select-none">“</span>
                  <p className="text-xs text-slate-750 dark:text-slate-300 italic font-medium leading-relaxed whitespace-pre-wrap relative z-10">
                    {viewingSetoran.catatanGuru?.trim() ? <>"{renderArabicEnhancedText(viewingSetoran.catatanGuru)}"</> : 'Tidak ada catatan tertulis khusus.'}
                  </p>
                </div>
              </div>

              {/* Card Koreksi Detail Per Kata / Ayat */}
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2.5">Koreksi Detail Per Kata / Ayat</h5>
                {viewingSetoran.interactiveComments && viewingSetoran.interactiveComments.length > 0 ? (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1.5 scrollbar-thin">
                    {viewingSetoran.interactiveComments.map((item, idx) => (
                      <div key={item.id || idx} className="p-4 border border-amber-200/30 dark:border-slate-800/80 rounded-2xl bg-amber-50/10 dark:bg-slate-900/30 hover:bg-amber-50/20 dark:hover:bg-slate-900/50 transition-all duration-200 flex items-start space-x-4 text-xs shadow-xs">
                        <div className="font-mushaf font-serif text-2xl text-amber-950 dark:text-amber-100 bg-amber-50 dark:bg-amber-950 px-3.5 py-2 rounded-2xl border border-amber-200/50 dark:border-amber-900/50 shadow-inner shrink-0 select-text leading-none flex items-center justify-center min-w-[75px] h-12">
                          {item.target}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                              {item.info}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                            "{item.comment}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-505 italic text-xs px-5 flex flex-col items-center justify-center gap-2 shadow-xs bg-slate-50/20 dark:bg-slate-900/10">
                    <CheckCircle className="w-8 h-8 text-emerald-500/40 stroke-1" />
                    <span>Alhamdulillah, tidak ada koreksi kesalahan tajwid/makhraj detail yang dicatat pada sesi setoran ini.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Buttons */}
        <div className="shrink-0 p-5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 flex justify-end items-center">
          <button 
            type="button" 
            onClick={onClose} 
            className="py-3 px-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-250 font-bold uppercase text-[10px] tracking-wider rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow border border-slate-200/20"
          >
            Tutup Rincian
          </button>
        </div>

      </div>
    </div>
  );
};
