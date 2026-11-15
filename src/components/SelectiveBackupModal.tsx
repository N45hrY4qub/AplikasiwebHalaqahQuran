/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Download, 
  Layers, 
  Users, 
  BookOpen, 
  Award, 
  FileSpreadsheet, 
  ShieldAlert, 
  Cloud,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  DR_MODULE_GROUPS, 
  createSelectiveSnapshot,
  recordDRAuditEvent 
} from '../utils/disasterDiagnosticManager';
import { downloadSnapshotFile, generateSnapshotFilename } from '../utils/backupRestoreManager';
import { saveSnapshotToCloudVault } from '../utils/cloudVaultManager';

interface SelectiveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessMsg?: (msg: string) => void;
}

export const SelectiveBackupModal: React.FC<SelectiveBackupModalProps> = ({
  isOpen,
  onClose,
  onSuccessMsg
}) => {
  const { 
    createSystemSnapshot, 
    currentSession,
    systemVersionInfo 
  } = useApp();

  // Selected module group IDs
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => 
    DR_MODULE_GROUPS.map(g => g.id)
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [saveToCloud, setSaveToCloud] = useState(false);

  if (!isOpen) return null;

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const selectAll = () => {
    setSelectedGroupIds(DR_MODULE_GROUPS.map(g => g.id));
  };

  const deselectAll = () => {
    setSelectedGroupIds([]);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-4 h-4 text-emerald-500" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'Layers': return <Layers className="w-4 h-4 text-amber-500" />;
      case 'Award': return <Award className="w-4 h-4 text-purple-500" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-4 h-4 text-teal-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleExecuteExport = async () => {
    if (selectedGroupIds.length === 0) return;

    setIsProcessing(true);
    try {
      const { snapshot: full } = createSystemSnapshot({
        customNotes: 'Cadangan Selektif Modular'
      });
      const selective = createSelectiveSnapshot(full, selectedGroupIds);

      // Download file to PC
      const filename = `Backup_Tahfidz_MODULAR_${systemVersionInfo.versionString}_${Date.now().toString().slice(-4)}.json`;
      downloadSnapshotFile(selective, filename);

      // Optionally save to cloud vault as well
      if (saveToCloud) {
        await saveSnapshotToCloudVault(
          selective,
          `Pencadangan Selektif (${selectedGroupIds.length} Modul Terpilih)`
        );
      }

      // Record DR audit log
      recordDRAuditEvent({
        action: 'selective_export',
        actionLabel: 'Pencadangan Selektif Modular (.json)',
        actor: currentSession.user?.namaLengkap || 'Administrator Utama',
        version: selective.metadata.version,
        status: 'SUCCESS',
        recordCount: selective.metadata.totalRecords,
        details: `Mengekspor ${selectedGroupIds.length} modul pilihan (${filename})`
      });

      if (onSuccessMsg) {
        onSuccessMsg(`Cadangan selektif berhasil diekspor (${selective.metadata.totalRecords} rekor data tersimpan)!`);
      }
      onClose();
    } catch (e: any) {
      console.error('Selective export error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Pencadangan Selektif / Modular
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pilih modul data tertentu yang ingin Anda arsipkan secara terpisah
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

        {/* Scrollable module checklist */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Modul Terpilih: {selectedGroupIds.length} dari {DR_MODULE_GROUPS.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Pilih Semua
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
              >
                Kosongkan
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {DR_MODULE_GROUPS.map(group => {
              const isSelected = selectedGroupIds.includes(group.id);
              return (
                <div
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(group.iconName)}</div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {group.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {group.description}
                      </p>
                      <span className="text-[9px] font-mono text-slate-400 block pt-0.5">
                        Tabel: {group.collections.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional Cloud Vault Save */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-teal-500" />
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Simpan juga ke Cloud Vault
                </span>
                <span className="text-[10px] text-slate-400">
                  Cadangan modular akan diunggah ke Firestore Cloud Vault
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={saveToCloud}
              onChange={e => setSaveToCloud(e.target.checked)}
              className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={selectedGroupIds.length === 0 || isProcessing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
              selectedGroupIds.length === 0 || isProcessing
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isProcessing ? 'Memproses...' : `Unduh Selektif (${selectedGroupIds.length} Modul)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
