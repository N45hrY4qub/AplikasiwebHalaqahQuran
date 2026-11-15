import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { applySwUpdate, subscribeToSwUpdate } from '../lib/swUpdateManager';

export const SwUpdateToast: React.FC = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSwUpdate((worker) => {
      if (worker) {
        setWaitingWorker((prev) => {
          // If a brand new waiting worker arrives, re-open the prompt
          if (prev !== worker) {
            setIsDismissed(false);
          }
          return worker;
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleUpdateNow = () => {
    if (isUpdating) return;
    setIsUpdating(true);
    applySwUpdate(waitingWorker);
  };

  const handleLater = () => {
    setIsDismissed(true);
  };

  const isVisible = Boolean(waitingWorker) && !isDismissed;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="sw-update-toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] z-[70] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 p-4 font-sans"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    Versi Baru Tersedia
                  </h4>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                    Update
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLater}
                  disabled={isUpdating}
                  aria-label="Tutup notifikasi pembaruan"
                  className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Pembaruan aplikasi siap diterapkan. Muat ulang untuk menikmati fitur dan perbaikan terbaru tanpa kehilangan alur kerja Anda.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleLater}
                  disabled={isUpdating}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  Nanti
                </button>
                <button
                  type="button"
                  onClick={handleUpdateNow}
                  disabled={isUpdating}
                  className="flex-[1.35] py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span>{isUpdating ? 'Memperbarui...' : 'Perbarui Sekarang'}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
