import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Trash2, 
  Edit3, 
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GuruMurojaahBerpasanganProps {
  setActiveTab: (tab: string) => void;
  myHalaqah: any;
  myStudents: any[];
}

export const GuruMurojaahBerpasangan: React.FC<GuruMurojaahBerpasanganProps> = ({ setActiveTab, myHalaqah, myStudents }) => {
  const { 
    siswas, 
    murojaahBerpasangans, 
    createMurojaahBerpasangan, 
    updateMurojaahBerpasangan, 
    deleteMurojaahBerpasangan
  } = useApp();

  const formatIndonesianDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return dateStr;

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const [murDate, setMurDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [murSiswaId, setMurSiswaId] = useState('');
  const [murPasanganId, setMurPasanganId] = useState('');
  const [murPasanganCustomNama, setMurPasanganCustomNama] = useState('');
  const [murJenis, setMurJenis] = useState('Murojaah Hafalan');
  const [murSuratAwal, setMurSuratAwal] = useState('');
  const [murSuratAkhir, setMurSuratAkhir] = useState('');
  const [murAyatAwal, setMurAyatAwal] = useState('');
  const [murAyatAkhir, setMurAyatAkhir] = useState('');
  const [murCatatan, setMurCatatan] = useState('');
  const [murEditingId, setMurEditingId] = useState<string | null>(null);

  // Search/Filter for Murojaah Berpasangan History
  const [murHistorySearch, setMurHistorySearch] = useState('');
  const [murHistoryDateFilter, setMurHistoryDateFilter] = useState('');

  const resetMurForm = () => {
    setMurSiswaId('');
    setMurPasanganId('');
    setMurPasanganCustomNama('');
    setMurSuratAwal('');
    setMurSuratAkhir('');
    setMurAyatAwal('');
    setMurAyatAkhir('');
    setMurCatatan('');
    setMurEditingId(null);
  };

  const handleMurSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!murSiswaId || !murPasanganId || !murSuratAwal) {
      alert('Harap lengkapi Santri, Pasangan, dan Surat Awal minimal.');
      return;
    }
    const finalPasanganNama = 
      murPasanganId === 'custom' ? murPasanganCustomNama :
      (murPasanganId === 'guru' ? 'GURU' :
      (murPasanganId === 'orangtua' ? 'ORANGTUA' :
      siswas.find(s => s.id === murPasanganId)?.namaLengkap || ''));

    const activeSiswa = siswas.find(s => s.id === murSiswaId);
    const hId = activeSiswa?.halaqahId || myHalaqah?.id || '';
    const hNama = activeSiswa?.halaqahNama || myHalaqah?.namaHalaqah || '';

    const payload = {
      tanggal: murDate,
      siswaId: murSiswaId,
      siswaNama: activeSiswa?.namaLengkap || '',
      pasanganId: murPasanganId,
      pasanganNama: finalPasanganNama,
      jenisMurojaah: murJenis,
      halaqahId: hId,
      halaqahNama: hNama,
      suratAwal: murSuratAwal,
      ayatAwal: murAyatAwal.toString(),
      suratAkhir: murSuratAkhir || murSuratAwal,
      ayatAkhir: murAyatAkhir.toString() || murAyatAwal.toString(),
      catatan: murCatatan,
      statusVerifikasi: 'Disetujui' as const, 
      statusPasangan: 'Dikonfirmasi' as const,
    };

    if (murEditingId) {
      updateMurojaahBerpasangan(murEditingId, payload);
      alert('Murojaah Berpasangan berhasil diperbarui!');
    } else {
      createMurojaahBerpasangan(payload);
      alert('Laporan Murojaah Berpasangan berhasil ditambahkan!');
    }
    resetMurForm();
  };

  const handleMurEdit = (m: any) => {
    setMurEditingId(m.id);
    setMurDate(m.tanggal);
    setMurSiswaId(m.siswaId);
    if (['guru', 'orangtua', 'custom'].includes(m.pasanganId)) {
      setMurPasanganId(m.pasanganId);
      if (m.pasanganId === 'custom') setMurPasanganCustomNama(m.pasanganNama);
    } else {
      setMurPasanganId(m.pasanganId);
    }
    setMurJenis(m.jenisMurojaah || 'Murojaah Hafalan');
    setMurSuratAwal(m.suratAwal || '');
    setMurSuratAkhir(m.suratAkhir || '');
    setMurAyatAwal(m.ayatAwal || '');
    setMurAyatAkhir(m.ayatAkhir || '');
    setMurCatatan(m.catatan || '');
    setActiveTab('guru_murojaah_berpasangan');
  };

  const handleMurDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus laporan murojaah berpasangan ini?')) {
      deleteMurojaahBerpasangan(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Murojaah Berpasangan</h2>
          <p className="text-emerald-100 opacity-90 max-w-2xl">
            Input dan pantau hafalan santri yang disimak oleh santri lain, guru, atau orang tua. 
            Laporan ini akan masuk ke dalam riwayat hafalan santri.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              {murEditingId ? 'Edit Laporan' : 'Input Laporan Baru'}
            </h3>
            
            <form onSubmit={handleMurSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={murDate}
                  onChange={e => setMurDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Santri (Yang Disimak)</label>
                <select
                  required
                  value={murSiswaId}
                  onChange={e => setMurSiswaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                >
                  <option value="">-- Pilih Santri --</option>
                  {myStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.namaLengkap}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pasangan (Yang Menyimak)</label>
                <select
                  required
                  value={murPasanganId}
                  onChange={e => setMurPasanganId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                >
                  <option value="">-- Pilih Pasangan --</option>
                  <optgroup label="Umum">
                    <option value="guru">Guru / Musyrif</option>
                    <option value="orangtua">Orang Tua / Wali</option>
                    <option value="custom">Lainnya (Tulis Manual)</option>
                  </optgroup>
                  <optgroup label="Daftar Santri">
                    {myStudents.filter(s => s.id !== murSiswaId).map(s => (
                      <option key={s.id} value={s.id}>{s.namaLengkap}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {murPasanganId === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Penyimak</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama penyimak..."
                    value={murPasanganCustomNama}
                    onChange={e => setMurPasanganCustomNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jenis Murojaah</label>
                <select
                  required
                  value={murJenis}
                  onChange={e => setMurJenis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                >
                  <option value="Murojaah Hafalan">Murojaah Hafalan</option>
                  <option value="Ziyadah Baru">Ziyadah Baru</option>
                  <option value="Tilawah/Tahsin">Tilawah / Tahsin</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Capaian Surat & Ayat</label>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Surat Awal</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Al-Baqarah"
                      value={murSuratAwal}
                      onChange={e => {
                        setMurSuratAwal(e.target.value);
                        if (!murSuratAkhir) setMurSuratAkhir(e.target.value);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Ayat Awal</label>
                    <input
                      type="number"
                      placeholder="Ayat"
                      value={murAyatAwal}
                      onChange={e => setMurAyatAwal(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Surat Akhir (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: An-Nas"
                      value={murSuratAkhir}
                      onChange={e => setMurSuratAkhir(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Ayat Akhir (Opsional)</label>
                    <input
                      type="number"
                      placeholder="Ayat"
                      value={murAyatAkhir}
                      onChange={e => setMurAyatAkhir(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  value={murCatatan}
                  onChange={e => setMurCatatan(e.target.value)}
                  placeholder="Kualitas hafalan, kelancaran, dsb..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm min-h-[80px]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                >
                  {murEditingId ? 'Simpan Perubahan' : 'Kirim Laporan'}
                </button>
                {murEditingId && (
                  <button
                    type="button"
                    onClick={resetMurForm}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Riwayat Murojaah Berpasangan
              </h3>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari santri..."
                    value={murHistorySearch}
                    onChange={(e) => setMurHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <input
                  type="date"
                  value={murHistoryDateFilter}
                  onChange={(e) => setMurHistoryDateFilter(e.target.value)}
                  className="w-[130px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm shrink-0"
                />
              </div>
            </div>

            <div className="space-y-3">
              {murojaahBerpasangans
                .filter(m => m.halaqahId === myHalaqah?.id || myStudents.some(s => s.id === m.siswaId))
                .filter(m => {
                  const search = murHistorySearch.toLowerCase();
                  const matchesSearch = 
                    m.siswaNama.toLowerCase().includes(search) ||
                    m.pasanganNama.toLowerCase().includes(search) ||
                    (m.suratAwal && m.suratAwal.toLowerCase().includes(search)) ||
                    (m.suratAkhir && m.suratAkhir.toLowerCase().includes(search));
                  
                  const matchesDate = murHistoryDateFilter ? m.tanggal === murHistoryDateFilter : true;
                  
                  return matchesSearch && matchesDate;
                })
                .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                .map(m => (
                  <div 
                    key={m.id}
                    className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700/50 transition shadow-sm"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{formatIndonesianDate(m.tanggal)}</span>
                        {m.statusVerifikasi === 'Disetujui' ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            Disetujui
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                            Menunggu Verifikasi
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Santri</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{m.siswaNama}</span>
                        </div>
                        <span className="text-slate-300 font-bold">→</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Pasangan</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{m.pasanganNama}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                          {m.jenisMurojaah}
                        </span>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {m.suratAwal} {m.ayatAwal} 
                          {m.suratAkhir ? ` - ${m.suratAkhir} ${m.ayatAkhir}` : (m.ayatAkhir !== m.ayatAwal ? ` - ${m.ayatAkhir}` : '')}
                        </span>
                      </div>
                      
                      {m.catatan && (
                        <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 italic mt-2">
                          "{m.catatan}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex md:flex-col gap-2 justify-end items-end shrink-0">
                      {m.statusVerifikasi !== 'Disetujui' && (
                        <button
                          onClick={() => {
                            updateMurojaahBerpasangan(m.id, { statusVerifikasi: 'Disetujui' });
                            alert('Berhasil menyetujui laporan murojaah ini!');
                          }}
                          className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 cursor-pointer text-emerald-800 text-xs font-bold rounded-lg transition text-center w-full"
                        >
                          Setujui
                        </button>
                      )}
                      <button
                        onClick={() => handleMurEdit(m)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 w-full"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleMurDelete(m.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 cursor-pointer text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 w-full"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
                
              {murojaahBerpasangans.filter(m => m.halaqahId === myHalaqah?.id || myStudents.some(s => s.id === m.siswaId)).length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Belum ada riwayat Murojaah Berpasangan untuk santri di halaqah ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
