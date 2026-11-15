import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.error('Error clearing caches/SW:', e);
    }
    window.location.reload();
  };

  private handleBackToStart = () => {
    try {
      localStorage.removeItem('mh_pwa_active_role');
      localStorage.removeItem('mh_session');
      localStorage.removeItem('mh_active_tab');
      localStorage.removeItem('mh_selected_guru_halaqah_id');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error clearing storage in ErrorBoundary:', e);
    }
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Terjadi kesalahan tidak terduga pada sistem tampilan.';

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Sistem Diperbarui / Kendala Sesi</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aplikasi telah mendeteksi pembaruan versi atau terjadi penyesuaian data tampilan. Silakan muat ulang untuk menerapkan versi terbaru secara bersih.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl text-left border border-slate-800 text-[11px] font-mono text-slate-400 max-h-28 overflow-y-auto break-words">
              {errorMessage}
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Coba Pulihkan Tampilan & Lanjutkan Sesi</span>
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Perbarui & Muat Ulang Bersih (Reload)</span>
              </button>

              <button
                onClick={this.handleBackToStart}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700/60"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Halaman Awal (Back to Start)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
