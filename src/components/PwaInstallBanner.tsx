import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, ArrowUp, Sparkles, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Detect if already in standalone mode
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      return isStandaloneMedia || isIOSStandalone;
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);

    // 2. Detect iOS device
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    const ios = checkIOS();
    setIsIOS(ios);

    // 3. Handle beforeinstallprompt event for Chromium browsers (Desktop & Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredPrompt = e as BeforeInstallPromptEvent;

      // Dispatch event to notify other components that installation is ready
      window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));

      // Check if user dismissed it recently
      const dismissedUntil = localStorage.getItem('pwa_install_dismissed_until');
      const now = Date.now();
      
      if (!standalone && (!dismissedUntil || now > parseInt(dismissedUntil, 10))) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Support manual trigger from other components
    const handleManualTrigger = () => {
      if (isIOS) {
        setShowIosModal(true);
      } else {
        const promptEvent = (window as any).deferredPrompt || deferredPrompt;
        if (promptEvent) {
          promptEvent.prompt().then(() => {
            return promptEvent.userChoice;
          }).then((choiceResult: any) => {
            console.log(`[PWA] User response: ${choiceResult.outcome}`);
            if (choiceResult.outcome === 'accepted') {
              setDeferredPrompt(null);
              (window as any).deferredPrompt = null;
              setShowBanner(false);
              setInstalledSuccess(true);
              setTimeout(() => setInstalledSuccess(false), 5000);
            }
          }).catch((err: any) => {
            console.error('[PWA] Error prompt:', err);
          });
        } else {
          // If no prompt capture, toggle banner to show instructions or inform
          setShowBanner(true);
        }
      }
    };

    window.addEventListener('trigger-pwa-install', handleManualTrigger);

    // 4. Handle iOS display banner manually (since iOS doesn't support beforeinstallprompt)
    if (ios && !standalone) {
      const dismissedUntil = localStorage.getItem('pwa_install_dismissed_until');
      const now = Date.now();
      if (!dismissedUntil || now > parseInt(dismissedUntil, 10)) {
        // Slightly delay the display on load for smoother UX
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    // 5. Detect if already installed successfully
    const handleAppInstalled = () => {
      console.log('[PWA] Application successfully installed!');
      setInstalledSuccess(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-pwa-install', handleManualTrigger);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, open custom step-by-step guidance modal
      setShowIosModal(true);
      return;
    }

    if (!deferredPrompt) {
      // If prompt event is not captured, try to alert user or provide context
      alert("Aplikasi ini sudah terpasang atau browser Anda belum sepenuhnya mendukung instalasi otomatis.");
      return;
    }

    // Show the browser install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User choice outcome: ${outcome}`);

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Cooldown 3 days (3 * 24 * 60 * 60 * 1000 ms) before prompting again
    const cooldown = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_install_dismissed_until', cooldown.toString());
  };

  // If already standalone or banner should not be shown, render nothing
  if ((isStandalone && !installedSuccess) || (!showBanner && !showIosModal && !installedSuccess)) {
    return null;
  }

  return (
    <>
      {/* 1. Success Toast after Installation */}
      {installedSuccess && (
        <div id="pwa-success-toast" className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl shadow-xl p-4 flex items-center space-x-3.5 z-50 animate-bounce">
          <div className="p-2 bg-white/20 rounded-xl">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold font-sans">Aplikasi Terpasang!</h4>
            <p className="text-[10px] opacity-90 leading-relaxed font-semibold">Halaqah kini siap digunakan dengan akses instan langsung dari layar utama perangkat Anda.</p>
          </div>
        </div>
      )}

      {/* 2. Floating Install App Banner */}
      {showBanner && (
        <div id="pwa-install-banner" className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-5 z-50 flex flex-col space-y-4 animate-fade-in font-sans">
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-md shadow-amber-500/10 shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-sans font-black text-slate-900 dark:text-white text-sm">Pasang Aplikasi Halaqah</h4>
                  <span className="text-[8px] bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">PWA</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mt-0.5">
                  Akses bimbingan Al-Qur'an dan setoran hafalan lebih cepat, stabil, serta mendukung offline langsung dari layar beranda Anda.
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 text-center text-xs font-bold rounded-xl border border-slate-105 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-350 transition cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 text-center text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Pasang Sekarang
            </button>
          </div>
        </div>
      )}

      {/* 3. iOS Custom Step-by-Step Modal */}
      {showIosModal && (
        <div id="pwa-ios-modal" className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-amber-100 dark:border-amber-900/30 flex flex-col space-y-5 animate-fade-in font-sans">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Download className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-slate-950 dark:text-white text-sm">Instalasi di Apple iOS</h3>
                  <span className="text-[8px] bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">Safari Browser</span>
                </div>
              </div>
              <button 
                onClick={() => setShowIosModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11.5px] text-slate-600 dark:text-slate-350 leading-relaxed space-y-4 font-semibold">
              <p>
                Browser Safari di iOS tidak mengizinkan pengunduhan otomatis sekali klik. Silakan ikuti panduan manual mudah ini untuk memasangnya:
              </p>

              <div className="space-y-3.5 pt-1">
                <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="p-1.5 bg-white dark:bg-slate-950 text-amber-500 border border-slate-100 dark:border-slate-800 rounded-lg shrink-0">
                    <Share className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-850 dark:text-slate-200">1. Tekan Tombol Bagikan (Share)</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Buka panel menu bawah Safari lalu cari ikon persegi dengan panah ke atas.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="p-1.5 bg-white dark:bg-slate-950 text-amber-500 border border-slate-100 dark:border-slate-800 rounded-lg shrink-0">
                    <PlusSquare className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-850 dark:text-slate-200">2. Pilih 'Tambahkan ke Layar Utama'</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Gulir ke bawah dan ketuk pilihan <strong>"Add to Home Screen"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20 text-[10px] text-amber-800 dark:text-amber-450 flex items-start gap-2 leading-relaxed">
                <ArrowUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                <span>Setelah ditambahkan, logo <strong>Halaqah</strong> akan terpasang di layar utama iPhone/iPad Anda dan siap dijalankan kapan saja secara mandiri!</span>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={() => {
                  setShowIosModal(false);
                  handleDismiss();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold text-center transition cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
