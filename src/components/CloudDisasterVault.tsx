/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Cloud, 
  RefreshCw, 
  Check, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Clock, 
  User, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  RotateCcw, 
  Save, 
  Sparkles,
  Info,
  Calendar,
  Settings2
} from 'lucide-react';
import { 
  CloudVaultSnapshotItem, 
  AutoBackupConfig, 
  getAutoBackupConfig, 
  saveAutoBackupConfig,
  formatBytes,
  parseAndValidateSnapshot
} from '../utils/backupRestoreManager';
import { 
  saveSnapshotToCloudVault, 
  fetchCloudVaultCatalog, 
  deleteSnapshotFromCloudVault, 
  downloadSnapshotFromCloudVault,
  isAutoBackupDue
} from '../utils/cloudVaultManager';
import { getSharedState } from '../lib/firebaseShare';

export const CloudDisasterVault: React.FC = () => {
  const { 
    createSystemSnapshot, 
    restoreSystemSnapshot, 
    systemVersionInfo,
    currentSession
  } = useApp();

  const [catalog, setCatalog] = useState<CloudVaultSnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-backup configuration state
  const [autoConfig, setAutoConfig] = useState<AutoBackupConfig>(() => getAutoBackupConfig());
  const [savedConfigMsg, setSavedConfigMsg] = useState(false);

  // Restore Modal State
  const [selectedSnapshotForRestore, setSelectedSnapshotForRestore] = useState<CloudVaultSnapshotItem | null>(null);
  const [confirmDeleteSnapshot, setConfirmDeleteSnapshot] = useState<CloudVaultSnapshotItem | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState(false);

  // Load catalog on mount
  const loadCatalog = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const items = await fetchCloudVaultCatalog();
      setCatalog(items);
    } catch (e: any) {
      setErrorMsg('Gagal memuat katalog Cloud Vault: ' + (e.message || 'Kesalahan jaringan'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Check and run auto-backup if due
  useEffect(() => {
    if (isAutoBackupDue()) {
      console.log('Menjalankan Auto-Backup otomatis ke Cloud Vault...');
      const { snapshot } = createSystemSnapshot({
        customNotes: 'Pencadangan Otomatis Terjadwal Sistem'
      });
      saveSnapshotToCloudVault(snapshot, 'Pencadangan Otomatis Terjadwal Sistem')
        .then((res) => {
          if (res.success) {
            loadCatalog();
            const updated = getAutoBackupConfig();
            setAutoConfig(updated);
          }
        })
        .catch((err) => console.warn('Auto backup cloud error:', err));
    }
  }, []);

  // Save current system state to Cloud Vault
  const handleSaveToVault = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { snapshot } = createSystemSnapshot({
        customNotes: customNotes.trim() || undefined
      });

      const res = await saveSnapshotToCloudVault(snapshot, customNotes.trim());
      if (res.success && res.item) {
        setSuccessMsg(`Snapshot ${res.item.version} berhasil diamankan ke Cloud Vault!`);
        setCustomNotes('');
        await loadCatalog();
      } else {
        throw new Error(res.error || 'Gagal menyimpan snapshot ke Cloud.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kegagalan saat menghubungkan ke cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  // Download snapshot from Cloud Vault directly to PC
  const handleDownloadFromVault = async (item: CloudVaultSnapshotItem) => {
    const success = await downloadSnapshotFromCloudVault(item.id, item.version);
    if (success) {
      setSuccessMsg(`Berkas snapshot ${item.version} dari Cloud berhasil diunduh ke PC Anda!`);
    } else {
      setErrorMsg('Gagal mengunduh berkas snapshot dari Cloud Vault.');
    }
  };

  // Delete snapshot from Cloud Vault
  const handleDeleteFromVault = (item: CloudVaultSnapshotItem) => {
    setConfirmDeleteSnapshot(item);
  };

  const executeDeleteFromVault = async () => {
    if (!confirmDeleteSnapshot) return;
    const item = confirmDeleteSnapshot;
    setConfirmDeleteSnapshot(null);

    const success = await deleteSnapshotFromCloudVault(item.id);
    if (success) {
      setSuccessMsg(`Snapshot ${item.version} telah dihapus dari Cloud.`);
      await loadCatalog();
    } else {
      setErrorMsg('Gagal menghapus snapshot dari Cloud.');
    }
  };

  // Execute restore from Cloud Snapshot
  const handleExecuteRestoreFromCloud = async () => {
    if (!selectedSnapshotForRestore) return;
    setIsRestoring(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const rawJson = await getSharedState(selectedSnapshotForRestore.id);
      if (!rawJson) {
        throw new Error('Data snapshot tidak ditemukan di cloud.');
      }

      const res = await restoreSystemSnapshot(rawJson, {
        mode: restoreMode,
        keepCurrentAdminSession: true
      });

      if (res.success) {
        setSuccessMsg(`Sistem berhasil dipulihkan dari snapshot cloud versi "${selectedSnapshotForRestore.version}"!`);
        setSelectedSnapshotForRestore(null);
      } else {
        throw new Error(res.message || 'Format cadangan tidak valid.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal memulihkan data dari Cloud.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Save Auto Backup Settings
  const handleSaveAutoConfig = () => {
    saveAutoBackupConfig(autoConfig);
    setSavedConfigMsg(true);
    setTimeout(() => setSavedConfigMsg(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Cloud Vault Header Card */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cloud Disaster Recovery Vault</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  Firestore Compressed Storage
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Penyimpanan snapshot terenkripsi dan terkompresi di Cloud. Berfungsi sebagai brankas cadangan utama jika laptop rusak atau cache terhapus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadCatalog}
              disabled={isLoading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Cloud</span>
            </button>
          </div>
        </div>

        {/* Action: Create New Snapshot to Cloud Vault */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Amankan Snapshot Data Sekarang ke Cloud Vault:</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              Versi Berikutnya: {systemVersionInfo.versionString}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Catatan snapshot (misal: Selesai Ujian Semester / Penambahan 10 Santri)"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
            <button
              type="button"
              onClick={handleSaveToVault}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                isSaving
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengompresi & Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan ke Cloud Vault</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/60 rounded-xl flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-250 dark:border-rose-900/60 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-xs animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Cloud Vault History Table */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Daftar Snapshot di Cloud Vault ({catalog.length})</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Klik "Pulihkan" untuk me-restore sistem langsung dari Cloud tanpa perlu mengunggah file manual.
            </p>
          </div>
        </div>

        {catalog.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-250 dark:border-slate-800 space-y-2">
            <Cloud className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Belum ada snapshot yang tersimpan di Cloud Vault.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Buat snapshot pertama Anda menggunakan tombol "Simpan ke Cloud Vault" di atas untuk proteksi ganda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {catalog.map((item, idx) => (
              <div 
                key={item.id || idx}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/60 dark:hover:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {item.version}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Rev #{item.revision}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WIB
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      "{item.notes}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.exportedBy || 'Administrator Utama'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {item.totalRecords?.toLocaleString()} Rekor Data
                    </span>
                    {item.compressedSize && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-400">
                          {formatBytes(item.compressedSize)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions per item */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSnapshotForRestore(item);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pulihkan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadFromVault(item)}
                    title="Unduh berkas .json ke komputer"
                    className="p-2 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteFromVault(item)}
                    title="Hapus dari Cloud Vault"
                    className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Auto-Backup Scheduler Card */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
            <Settings2 className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-bold">Otomatisasi Pencadangan (Auto-Backup Scheduler)</h4>
          </div>
          {savedConfigMsg && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Pengaturan Tersimpan
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Toggle Enabled */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-white">Aktifkan Auto-Backup Cloud</span>
              <button
                type="button"
                onClick={() => setAutoConfig({ ...autoConfig, enabled: !autoConfig.enabled })}
                className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 flex items-center ${
                  autoConfig.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Saat diaktifkan, aplikasi akan secara senyap membuat snapshot otomatis ke Cloud Vault setiap interval tercapai saat membuka aplikasi.
            </p>
          </div>

          {/* Interval Hours */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-800 dark:text-white block">Frekuensi Pencadangan</span>
            <div className="grid grid-cols-3 gap-2">
              {[12, 24, 48].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setAutoConfig({ ...autoConfig, intervalHours: hours })}
                  className={`py-2 text-center rounded-xl font-bold border transition cursor-pointer ${
                    autoConfig.intervalHours === hours
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Setiap {hours} Jam
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Cadangan otomatis terakhir:{' '}
            <strong>
              {autoConfig.lastBackupAt ? new Date(autoConfig.lastBackupAt).toLocaleString('id-ID') : 'Belum pernah'}
            </strong>
          </span>
          <button
            type="button"
            onClick={handleSaveAutoConfig}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Simpan Jadwal
          </button>
        </div>
      </div>

      {/* 4. Restore Confirmation Modal */}
      {selectedSnapshotForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Pulihkan dari Cloud Vault
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Anda akan memulihkan database dari snapshot versi{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {selectedSnapshotForRestore.version}
                </strong>{' '}
                yang dibuat pada{' '}
                {new Date(selectedSnapshotForRestore.timestamp).toLocaleDateString('id-ID')}.
              </p>
            </div>

            {/* Mode selection */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                Pilih Mode Pemulihan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode('replace')}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                    restoreMode === 'replace'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-800 dark:text-indigo-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🔄 Timpa Menyeluruh</span>
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Sama persis snapshot</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                    restoreMode === 'merge'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-800 dark:text-indigo-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>➕ Gabungkan Data</span>
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Tambah yang belum ada</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSnapshotForRestore(null)}
                disabled={isRestoring}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestoreFromCloud}
                disabled={isRestoring}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memulihkan...</span>
                  </>
                ) : (
                  <span>Ya, Terapkan Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Cloud Snapshot Modal */}
      {confirmDeleteSnapshot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Hapus Snapshot Cloud</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Apakah Anda yakin ingin menghapus cadangan snapshot versi <strong>"{confirmDeleteSnapshot.version}"</strong> dari Cloud Vault? Data arsip versi ini akan terhapus.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteSnapshot(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteFromVault}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
