/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { UserThemeCustomizer } from './UserThemeCustomizer';
import { 
  User, 
  Home, 
  Award, 
  CheckCircle, 
  Download, 
  Eye, 
  EyeOff, 
  Camera, 
  Check, 
  Plus, 
  Sparkles, 
  Lock, 
  Mail, 
  MapPin, 
  Phone,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface SiswaProfileProps {
  siswaId?: string;
  setActiveTab?: (tab: string) => void;
}

export const SiswaProfile: React.FC<SiswaProfileProps> = ({ siswaId: propSiswaId, setActiveTab }) => {
  const { 
    currentSession, 
    siswas, 
    halaqahs, 
    gurus, 
    updateSiswa, 
    addLog
  } = useApp();

  const user = currentSession.user;
  const currentSiswaId = propSiswaId || user?.id || '';

  const mySiswaObj = useMemo(() => {
    return (siswas || []).find(s => s.id === currentSiswaId) || null;
  }, [siswas, currentSiswaId]);

  const myHalaqah = useMemo(() => {
    if (!mySiswaObj?.halaqahId) return null;
    return (halaqahs || []).find(h => h.id === mySiswaObj.halaqahId) || null;
  }, [halaqahs, mySiswaObj]);

  const myGuruObj = useMemo(() => {
    if (!myHalaqah?.guruPembimbingId) return null;
    return (gurus || []).find(g => g.id === myHalaqah.guruPembimbingId) || null;
  }, [gurus, myHalaqah]);

  // PWA detection
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMedia || isIOSStandalone);
  }, []);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    namaLengkap: mySiswaObj?.namaLengkap || '',
    email: mySiswaObj?.email || '',
    nomorHpOrangTua: mySiswaObj?.nomorHpOrangTua || '',
    alamat: mySiswaObj?.alamat || '',
    fotoProfil: mySiswaObj?.fotoProfil || ''
  });

  useEffect(() => {
    if (mySiswaObj) {
      setProfileForm({
        namaLengkap: mySiswaObj.namaLengkap || '',
        email: mySiswaObj.email || '',
        nomorHpOrangTua: mySiswaObj.nomorHpOrangTua || '',
        alamat: mySiswaObj.alamat || '',
        fotoProfil: mySiswaObj.fotoProfil || ''
      });
    }
  }, [mySiswaObj]);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success messages
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);
  const [passwordSavedMsg, setPasswordSavedMsg] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mySiswaObj) return;
    updateSiswa(mySiswaObj.id, profileForm);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 4000);
    addLog('Update Profil', `Siswa ${profileForm.namaLengkap} memperbarui bio profil`);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      alert('Mohon isi semua kolom sandi!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Konfirmasi sandi baru tidak cocok!');
      return;
    }
    setPasswordSavedMsg(true);
    setTimeout(() => setPasswordSavedMsg(false), 4000);
    addLog('Ganti Password', `Siswa ${mySiswaObj?.namaLengkap} memperbarui kata sandi akun`);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        setProfileForm(prev => ({ ...prev, fotoProfil: base64Url }));
        if (mySiswaObj) {
          updateSiswa(mySiswaObj.id, {
            ...profileForm,
            fotoProfil: base64Url
          });
          addLog('Update Foto Profil', `Siswa ${mySiswaObj.namaLengkap} memperbarui foto profil`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-800 to-teal-850 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Profil Santri
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola data diri santri, nomor kontak wali, dan keamanan kata sandi
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview & PWA Card */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850/80 shadow-sm text-center space-y-4 self-start">
          <div className="relative inline-block">
            <Avatar 
              namaLengkap={profileForm.namaLengkap || mySiswaObj?.namaLengkap || 'Santri'} 
              fotoProfil={profileForm.fotoProfil || mySiswaObj?.fotoProfil} 
              className="w-24 h-24 text-3xl font-bold border-4 border-emerald-500/10 mx-auto select-none shadow-md" 
            />
            <label 
              className="absolute bottom-0 right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full cursor-pointer transition shadow-xl"
              title="Ganti Foto Profil"
            >
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {mySiswaObj?.namaLengkap || 'Nama Santri'}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5 font-mono">
              NIS: {mySiswaObj?.nis || '-'}
            </p>
          </div>

          <div className="pt-3 text-left space-y-2.5 text-xs border-t border-slate-100 dark:border-slate-850">
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <Home className="w-4 h-4 mr-2.5 text-emerald-600 shrink-0" />
              <span><strong>Halaqah:</strong> {mySiswaObj?.halaqahNama || myHalaqah?.namaHalaqah || '-'}</span>
            </div>
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <Award className="w-4 h-4 mr-2.5 text-indigo-600 shrink-0" />
              <span><strong>Kelas:</strong> {mySiswaObj?.kelasNama || '-'}</span>
            </div>
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <User className="w-4 h-4 mr-2.5 text-sky-500 shrink-0" />
              <span><strong>Ustadz:</strong> {myGuruObj?.namaLengkap || '-'}</span>
            </div>
          </div>

          {/* PWA Section */}
          <div className="w-full border-t border-slate-100 dark:border-slate-850 pt-4 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-emerald-600" />
                Aplikasi Mandiri (PWA)
              </span>
              {isStandalone ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[9px] rounded-full uppercase">
                  Standalone
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-bold text-[9px] rounded-full uppercase font-semibold">
                  Web Browser
                </span>
              )}
            </div>

            {isStandalone ? (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl space-y-1">
                <p className="font-bold text-[11px] text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Berjalan sebagai Aplikasi
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Anda sudah membuka M-Halaqah sebagai aplikasi mandiri (PWA) yang cepat, bersih tanpa kolom URL, dan hemat memori.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Klik tombol di bawah untuk memasang M-Halaqah sebagai <strong>Aplikasi Standalone</strong> asli tanpa bilah navigasi browser Chrome/Safari.
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Pasang Aplikasi Standalone
                </button>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed font-medium">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">💡 Tips Memasang Aplikasi (PWA):</span>
                  <span>
                    Saat menu <strong>"Tambahkan ke layar beranda"</strong> muncul di browser Anda, pastikan memilih opsi <strong>"Instal"</strong> (bukan hanya "Buat pintasan").
                  </span>
                  <span className="block mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <strong>Instal:</strong> Membuka di jendela mandiri layaknya aplikasi native.<br/>
                    <strong>Pintasan:</strong> Hanya membuat tab baru biasa di browser.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Forms & Security */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* Form Profile */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Edit Data Profil Pribadi
              </h4>
              {profileSavedMsg && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Berhasil disimpan
                </span>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  NAMA LENGKAP (TETAP / DITENTUKAN ADMIN)
                </label>
                <input 
                  type="text" 
                  value={profileForm.namaLengkap} 
                  disabled 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/60 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  EMAIL SANTRI (OPSIONAL)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="email" 
                    value={profileForm.email} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} 
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                    placeholder="santri@halaqah.example (Boleh dikosongkan)" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  NOMOR HP WALI SANTRI *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    value={profileForm.nomorHpOrangTua} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, nomorHpOrangTua: e.target.value }))} 
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono" 
                    placeholder="0800xxxxxxxx"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ALAMAT TINGGAL SANTRI
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea 
                    rows={2} 
                    value={profileForm.alamat} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, alamat: e.target.value }))} 
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                    placeholder="Alamat domisili santri..."
                  />
                </div>
              </div>

              <div className="pt-1">
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Perubahan Profil
                </button>
              </div>
            </form>
          </div>

          {/* Theme Personalizer */}
          <UserThemeCustomizer />

          {/* Change Password */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-850/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Ubah Kata Sandi Akun
              </h4>
              {passwordSavedMsg && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Sandi berhasil diperbarui
                </span>
              )}
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  SANDI LAMA
                </label>
                <div className="relative">
                  <input 
                    type={showOldPassword ? "text" : "password"} 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)} 
                    className="w-full pl-3 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="Masukkan sandi saat ini"
                    required 
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    title={showOldPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4 text-indigo-500" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  SANDI BARU
                </label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="w-full pl-3 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="Masukkan sandi baru"
                    required 
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4 text-indigo-500" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  KONFIRMASI SANDI BARU
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="w-full pl-3 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="Ulangi sandi baru"
                    required 
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-indigo-500" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer transition uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
