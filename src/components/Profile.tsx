/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, StatusAktif } from '../types';
import { Avatar, hasCustomProfilePhoto } from './Avatar';
import { UserThemeCustomizer } from './UserThemeCustomizer';
import { 
  User, 
  Smartphone, 
  Mail, 
  Shield, 
  Settings, 
  Check, 
  Lock, 
  Calendar,
  History,
  Activity,
  FileText,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { 
    currentSession, 
    admins, 
    gurus, 
    siswas, 
    updateAdmin, 
    updateGuru, 
    updateSiswa,
    auditLogs
  } = useApp();

  const user = currentSession.user;

  const activeUserObj = React.useMemo(() => {
    if (!user) return null;
    if (user.role === UserRole.ADMIN) {
      return admins.find(a => a.id === user.id);
    } else if (user.role === UserRole.GURU) {
      return gurus.find(g => g.id === user.id);
    } else if (user.role === UserRole.SISWA) {
      return siswas.find(s => s.id === user.id);
    }
    return null;
  }, [user, admins, gurus, siswas]);

  // Form states
  const [editedName, setEditedName] = useState(user?.namaLengkap || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [editedPhone, setEditedPhone] = useState('');
  
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Edit profile success flag
  const [saveSuccess, setSaveSuccess] = useState(false);

  // PWA detection states
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  React.useEffect(() => {
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMedia || isIOSStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
  }, []);

  // Load complementary phone/specific info depending on role
  React.useEffect(() => {
    if (!user) return;
    if (user.role === UserRole.ADMIN) {
      const activeAdminObj = admins.find(a => a.id === user.id);
      if (activeAdminObj) setEditedPhone(activeAdminObj.nomorHp || '');
    } else if (user.role === UserRole.GURU) {
      const activeGuruObj = gurus.find(g => g.id === user.id);
      if (activeGuruObj) setEditedPhone(activeGuruObj.nomorHp || '');
    } else if (user.role === UserRole.SISWA) {
      const activeSiswaObj = siswas.find(s => s.id === user.id);
      if (activeSiswaObj) setEditedPhone(activeSiswaObj.nomorHpOrangTua || '');
    }
  }, [user?.id, user?.role, admins, gurus, siswas]);

  // Sync state if user updates from Firestore/App context
  React.useEffect(() => {
    if (user) {
      setEditedName(user.namaLengkap);
      setEditedEmail(user.email || '');
    }
  }, [user?.namaLengkap, user?.email]);

  if (!user) return null;

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    if (user.role === UserRole.ADMIN) {
      updateAdmin(user.id, {
        namaLengkap: editedName,
        email: editedEmail,
        nomorHp: editedPhone
      });
    } else if (user.role === UserRole.GURU) {
      updateGuru(user.id, {
        namaLengkap: editedName,
        email: editedEmail,
        nomorHp: editedPhone
      });
    } else if (user.role === UserRole.SISWA) {
      updateSiswa(user.id, {
        namaLengkap: editedName,
        email: editedEmail,
        nomorHpOrangTua: editedPhone
      });
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!newPassword || !confirmPassword) {
      setPasswordError('Sandi baru wajib diisi.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi sandi baru tidak cocok.');
      return;
    }

    // In local layout we save password inside the corresponding structure
    if (user.role === UserRole.ADMIN) {
      updateAdmin(user.id, { password: newPassword });
    } else if (user.role === UserRole.GURU) {
      updateGuru(user.id, { password: newPassword });
    } else if (user.role === UserRole.SISWA) {
      updateSiswa(user.id, { password: newPassword });
    }

    setPasswordSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  // Profile image simulator converter (base64)
  const handleProfileImageSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUri = reader.result as string;
        if (user.role === UserRole.ADMIN) {
          updateAdmin(user.id, { fotoProfil: photoUri });
        } else if (user.role === UserRole.GURU) {
          updateGuru(user.id, { fotoProfil: photoUri });
        } else if (user.role === UserRole.SISWA) {
          updateSiswa(user.id, { fotoProfil: photoUri });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter login activities matching this active user
  const myActivities = auditLogs.filter(log => log.actorNama === user.namaLengkap);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Left side - Card profile details and image simulator */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col items-center">
        <div className="relative group">
          <Avatar 
            namaLengkap={user.namaLengkap} 
            fotoProfil={user.fotoProfil} 
            className="w-24 h-24 text-2xl font-bold"
          />
          <label className="absolute bottom-1 right-1 bg-emerald-600 hover:bg-emerald-700 p-1.5 rounded-full text-white cursor-pointer shadow-md transition">
            <Settings className="w-4 h-4" />
            <input 
              type="file" 
              accept="image/*"
              onChange={handleProfileImageSim}
              className="hidden" 
            />
          </label>
        </div>

        <h3 className="font-bold font-sans text-lg text-slate-800 dark:text-white mt-4">{user.namaLengkap}</h3>
        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 dark:bg-slate-900 dark:text-emerald-450 text-xs font-bold rounded-full mt-1.5 uppercase tracking-wide font-mono">
          {user.role} Member
        </span>

        {hasCustomProfilePhoto(user.fotoProfil) && (
          <button
            type="button"
            onClick={() => {
              if (user.role === UserRole.ADMIN) {
                updateAdmin(user.id, { fotoProfil: '' });
              } else if (user.role === UserRole.GURU) {
                updateGuru(user.id, { fotoProfil: '' });
              } else if (user.role === UserRole.SISWA) {
                updateSiswa(user.id, { fotoProfil: '' });
              }
            }}
            className="mt-3 text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
          >
            Hapus Foto Profil
          </button>
        )}

        {/* Specific information details */}
        <div className="w-full border-t border-slate-100 dark:border-slate-850 mt-6 pt-5 space-y-3 mr-auto text-xs">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
            <Mail className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-705 dark:text-slate-300">{user.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-605 dark:text-slate-400">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-705 dark:text-slate-300">{editedPhone || 'HP Utama belum diatur'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-605 dark:text-slate-400">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-sky-700 dark:text-sky-400">Status Akun: Aktif & Terverifikasi</span>
          </div>
          {currentSession.waktuLogin && (
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Sesi login: {new Date(currentSession.waktuLogin).toLocaleTimeString('id-ID')} WIB</span>
            </div>
          )}
        </div>

        {/* PWA Section */}
        <div className="w-full border-t border-slate-100 dark:border-slate-850 mt-5 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Aplikasi Mandiri (PWA)</span>
            {isStandalone ? (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[9px] rounded-full uppercase">Standalone</span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-bold text-[9px] rounded-full uppercase font-semibold">Web Browser</span>
            )}
          </div>

          {isStandalone ? (
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl space-y-1">
              <p className="font-bold text-[11px] text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Berjalan sebagai Aplikasi
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
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
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Pasang Aplikasi Standalone
              </button>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed font-medium">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">💡 Tips Memasang Aplikasi (PWA):</span>
                <span>
                  Saat menu <strong>"Tambahkan ke layar beranda"</strong> muncul di browser Anda, pastikan memilih opsi <strong>"Instal"</strong> (bukan hanya "Buat pintasan").
                </span>
                <span className="block mt-1 pt-1 border-t border-slate-105 dark:border-slate-800">
                  <strong>Instal:</strong> Membuka di jendela mandiri layaknya aplikasi native.<br/>
                  <strong>Pintasan:</strong> Hanya membuat tab baru biasa di browser.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Middle side - Edit Profile & Ganti Password forms */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Card: Edit profile */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85">
          <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base">Perbarui Informasi Profil</h3>
          <p className="text-xs text-slate-400 mt-0.5">Ubah rincian dasar nama lengkap atau nomor kontak bimbingan Anda</p>

          <form onSubmit={handleProfileSave} className="space-y-4 mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAMA LENGKAP</label>
                <input 
                  type="text" 
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">EMAIL UTAMA</label>
                <input 
                  type="email" 
                  value={editedEmail}
                  disabled={user.id !== 'adm-1'}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className={`mt-1 w-full p-2.5 border border-slate-205 dark:border-slate-800 rounded-lg text-xs ${user.id === 'adm-1' ? 'bg-slate-50' : 'bg-slate-100 disabled:opacity-40'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {user.role === UserRole.SISWA ? 'NOMOR HP ORANG TUA / WALI' : 'NOMOR HP UTAMA'}
              </label>
              <input 
                type="tel" 
                value={editedPhone}
                onChange={(e) => setEditedPhone(e.target.value)}
                placeholder="Contoh: 0812..."
                className="mt-1 w-full p-2.5 bg-slate-54 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
              />
            </div>

            {saveSuccess && (
              <p className="text-xs text-emerald-600 font-bold flex items-center">
                <Check className="w-4 h-4 mr-1 text-emerald-500" /> Profil berhasil diperbarui!
              </p>
            )}

            <button
              type="submit"
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
            >
              Simpan Profil
            </button>
          </form>
        </div>

        {/* Card: Tampilan & Warna Aksen Akun */}
        <UserThemeCustomizer />

        {/* Card: Ganti Password */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85">
          <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base">Ganti Password Keamanan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Amankan login bimbingan dengan sandi yang kuat secara periodik</p>

          <form onSubmit={handlePasswordChange} className="space-y-4 mt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">SANDI LAMA</label>
                <div className="mt-1 relative">
                  <input 
                    type={showOldPassword ? "text" : "password"} 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    title={showOldPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">SANDI BARU</label>
                <div className="mt-1 relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">KONFIRMASI SANDI</label>
                <div className="mt-1 relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {passwordError && (
              <p className="text-xs text-rose-600 font-bold">{passwordError}</p>
            )}

            {passwordSuccess && (
              <p className="text-xs text-emerald-600 font-bold flex items-center">
                <Check className="w-4 h-4 mr-1 text-emerald-500" /> Kata sandi pengaman berhasil diperbarui!
              </p>
            )}

            <button
              type="submit"
              className="py-2 px-5 bg-rose-600 hover:bg-rose-750 text-white rounded-lg text-xs font-bold transition shadow"
            >
              Ganti Sandi Akun
            </button>
          </form>
        </div>

        {/* Audit Log timeline of this SPECIFIC member */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/85">
          <div className="flex items-center space-x-2.5 mb-4">
            <History className="w-5 h-5 text-emerald-600" />
            <h4 className="font-sans font-bold text-slate-900 dark:text-white text-base">Histori Sesi Keanggotaan Anda</h4>
          </div>
          
          <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-1 text-xs">
            {myActivities.map((act) => (
              <div key={act.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-205">{act.action}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{act.rincian}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-medium">
                  {new Date(act.timestamp).toLocaleDateString('id-ID')}
                </span>
              </div>
            ))}
            {myActivities.length === 0 && (
              <p className="text-slate-400 italic text-center py-5">Belum ada rekaman sesi terekam di sistem hari ini.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
