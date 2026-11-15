/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Database,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { DryRunSimulationResult } from '../utils/disasterDiagnosticManager';

interface DryRunSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: DryRunSimulationResult | null;
  onProceedRestore?: () => void;
}

export const DryRunSimulationModal: React.FC<DryRunSimulationModalProps> = ({
  isOpen,
  onClose,
  simulation,
  onProceedRestore
}) => {
  if (!isOpen || !simulation) return null;

  const isSafe = simulation.verdict === 'READY';
  const isWarning = simulation.verdict === 'WARNING_OVERWRITE';
  const isBlocked = simulation.verdict === 'INCOMPATIBLE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isSafe ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' :
              isWarning ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
              'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
            }`}>
              {isSafe ? <ShieldCheck className="w-5 h-5" /> : isWarning ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Simulasi Pemulihan Bencana (Dry Run Drill)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Uji kelayakan restorasi tanpa memodifikasi database aktif
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300">
          {/* Verdict Banner */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
            isSafe ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60' :
            isWarning ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60' :
            'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60'
          }`}>
            <div className="shrink-0">
              {isSafe ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : isWarning ? (
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div className="space-y-0.5">
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                isSafe ? 'text-emerald-700 dark:text-emerald-300' :
                isWarning ? 'text-amber-700 dark:text-amber-300' :
                'text-rose-700 dark:text-rose-300'
              }`}>
                {isSafe ? 'HASIL SIMULASI: SIAP DIPULIHKAN (AMAN)' :
                 isWarning ? 'HASIL SIMULASI: PERINGATAN TIMPA DATA' :
                 'HASIL SIMULASI: TIDAK KOMPATIBEL'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Mode Uji: <strong className="uppercase font-mono">{simulation.mode === 'replace' ? 'Timpa Menyeluruh' : 'Gabungkan Data'}</strong> • Versi Cadangan: <strong className="font-mono">{simulation.incomingVersion}</strong>
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Rekor Baru</span>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{simulation.summary.newRecords}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Diperbarui / Timpa</span>
              <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                ~{simulation.summary.updatedRecords}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tidak Berubah</span>
              <span className="text-base font-bold font-mono text-slate-600 dark:text-slate-300">
                {simulation.summary.unchangedRecords}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Akan Dihapus</span>
              <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                -{simulation.summary.deletedRecords}
              </span>
            </div>
          </div>

          {/* Warnings & Conflicts if any */}
          {(simulation.conflicts.length > 0 || simulation.warnings.length > 0) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Catatan Evaluasi Risiko
              </h4>
              <div className="space-y-1.5">
                {simulation.conflicts.map((conf, i) => (
                  <div key={i} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{conf}</span>
                  </div>
                ))}
                {simulation.warnings.map((warn, i) => (
                  <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown Per Collection */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Rincian Perubahan Per Tabel
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-150 dark:divide-slate-800 text-xs">
              {simulation.collectionDiffs.map(diff => (
                <div key={diff.key} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{diff.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({diff.currentCount} data saat ini → {diff.incomingCount} cadangan)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {diff.actionSummary}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Tutup Hasil Simulasi
          </button>

          {onProceedRestore && simulation.canProceed && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedRestore();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>Lanjutkan Pemulihan Riil</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
