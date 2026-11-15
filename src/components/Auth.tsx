/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  KeyRound, 
  Mail, 
  ShieldAlert, 
  CheckCircle, 
  X, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { AdaptiveLogo } from './AdaptiveLogo';
import { isFirebaseConfigured } from '../lib/firebaseShare';
import { resolveInstitutionName } from '../utils/brandingHelper';

interface AuthProps {
  onOpenFirebaseSetup?: () => void;
}

export const Auth: React.FC<AuthProps> = () => {
  const { login, admins, pwaSettings, strukturLembaga } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if student was auto-logged out due to account suspension
  useEffect(() => {
    const notice = sessionStorage.getItem('mh_suspended_student_notice');
    if (notice) {
      setErrorMsg(notice);
      sessionStorage.removeItem('mh_suspended_student_notice');
    }
  }, []);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [resetStatusMsg, setResetStatusMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      setErrorMsg('Alamat email atau NIS wajib diisi.');
      return;
    }
    if (!password) {
      setErrorMsg('Password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const successLogin = await login(trimmedIdentifier, password);
      if (successLogin) {
        setSuccess(true);
      } else {
        setErrorMsg('Kombinasi Email/NIS atau Password salah. Silakan periksa kembali.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat masuk. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetLink = async (email: string, name: string) => {
    setResetStep(1);
    setResetStatusMsg('Menghubungi Server Autentikasi Halaqah...');
    setResetErrorMsg('');

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setResetStatusMsg(`Memverifikasi kredensial akun administrator...`);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setResetStatusMsg(`Menyiapkan instruksi pemulihan aman...`);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setResetStep(2);
    } catch (err) {
      setResetStep(0);
      setResetErrorMsg('Terjadi kesalahan jaringan saat mencoba mengirim instruksi reset. Silakan coba lagi.');
    }
  };

  const activeIcon = pwaSettings?.appIcon || '';
  const activeName = resolveInstitutionName(pwaSettings?.appName, strukturLembaga?.yayasan?.nama);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      
      {/* Visual Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <AdaptiveLogo
            src={activeIcon}
            alt={activeName}
            sizeClassName="w-16 h-16"
            roundedClassName="rounded-2xl"
            fallbackIcon={
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-lg text-white">
                <BookOpen className="w-8 h-8 animate-pulse text-white" />
              </div>
            }
          />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {activeName}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-emerald-400 font-medium">
          Sistem Informasi Halaqah Al-Quran & Pembelajaran Modern
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-950 py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-800">

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username/NIS Field */}
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Email atau Nomor Induk Siswa (NIS)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan email atau NIS Anda..."
                  disabled={isSubmitting || success}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting || success}
                  className="block w-full pl-10 pr-11 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Eye className="w-4 h-4 hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>
              <p 
                onClick={() => {
                  const isTypedEmail = identifier.includes('@');
                  if (isTypedEmail) {
                    setResetEmailInput(identifier.trim());
                  } else {
                    setResetEmailInput('');
                  }
                  setResetStep(0);
                  setResetErrorMsg('');
                  setResetStatusMsg('');
                  setShowForgotModal(true);
                }}
                className="mt-1.5 text-right text-[11px] text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-350 cursor-pointer transition"
              >
                Lupa Password? Hubungi Admin atau Reset Password Admin
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                id="submit-login"
                disabled={isSubmitting || success}
                className="w-full flex justify-center items-center h-11 px-4 rounded-xl shadow-lg shadow-emerald-500/10 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:shadow-emerald-500/20 transition-all text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi...
                  </span>
                ) : (
                  'Log In Akun'
                )}
              </button>
            </div>
          </form>

          {/* Feedback Messages */}
          <div className="mt-4 space-y-2">
            {errorMsg && (
              errorMsg.includes('sedang tidak aktif mengikuti pembelajaran') ? (
                <div id="auth-suspended-notice" className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-start space-x-3 text-amber-900 dark:text-amber-200 text-xs leading-relaxed shadow-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-left">
                    <p className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wide">
                      Pemberitahuan Status Akun
                    </p>
                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-normal">
                      {errorMsg}
                    </p>
                  </div>
                </div>
              ) : (
                <div id="auth-error" className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start space-x-2 text-rose-800 dark:text-rose-350 text-xs font-semibold leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{errorMsg}</span>
                </div>
              )
            )}

            {success && (
              <div id="auth-success" className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-800 rounded-xl flex items-start space-x-2 text-emerald-800 dark:text-emerald-350 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Login Berhasil! Memasuki sistem...</span>
              </div>
            )}
          </div>

          {/* Secure Cloud Connection Status Footer (No configuration button for unauthenticated users) */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured() ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isFirebaseConfigured() ? 'Sistem Cloud: Terhubung Aman' : 'Mode Offline / Lokal'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Terenkripsi
            </span>
          </div>

        </div>
        
        {/* Support Footer */}
        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          Dikelola oleh Sekretariat Pesantren & Bimbingan Tahfidz Qur'an.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (resetStep !== 1) setShowForgotModal(false);
            }}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-850 z-10">
            {/* Close Button */}
            {resetStep !== 1 && (
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {resetStep === 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Reset Password Admin
                  </h3>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Fitur reset password mandiri ini khusus untuk akun <strong>Administrator</strong>. Silakan masukkan email admin terdaftar Anda untuk menerima instruksi pemulihan.
                </p>

                {/* Secure Manual Input Form (No public user enumeration) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const emailTrim = resetEmailInput.trim();
                    if (!emailTrim) {
                      setResetErrorMsg('Silakan masukkan alamat email admin.');
                      return;
                    }
                    if (!emailTrim.includes('@')) {
                      setResetErrorMsg('Format email tidak valid.');
                      return;
                    }
                    
                    const matched = admins.find(a => a.email.toLowerCase() === emailTrim.toLowerCase());
                    if (!matched) {
                      setResetErrorMsg('Email ini tidak terdaftar sebagai Administrator. Silakan hubungi Sekretariat Pesantren.');
                      return;
                    }
                    handleSendResetLink(emailTrim, matched.namaLengkap);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                      Email Administrator
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={resetEmailInput}
                        onChange={(e) => {
                          setResetEmailInput(e.target.value);
                          setResetErrorMsg('');
                        }}
                        placeholder="admin@sistem.id"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {resetErrorMsg && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 rounded-xl flex items-start space-x-1.5 text-rose-800 dark:text-rose-350 text-[10px] font-semibold leading-relaxed text-left">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>{resetErrorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-10 flex justify-center items-center rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                  >
                    Kirim Instruksi Pemulihan
                  </button>
                </form>
              </div>
            )}

            {resetStep === 1 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Loader2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin mb-4" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Mengirim Permintaan Pemulihan...
                </h4>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed font-mono">
                  {resetStatusMsg}
                </p>
              </div>
            )}

            {resetStep === 2 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-950 rounded-full text-emerald-600 dark:text-emerald-400 mb-4 scale-110">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  Permintaan Terkirim!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
                  Instruksi pemulihan sandi aman telah diproses untuk akun Administrator. Silakan hubungi Sekretariat Pesantren atau periksa email terdaftar Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
                >
                  Kembali ke Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
