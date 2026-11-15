import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  Check, 
  CheckCircle2,
  FileCode, 
  FileJson,
  AlertTriangle, 
  AlertCircle,
  Clock, 
  User, 
  Tag, 
  Layers, 
  HardDrive, 
  FolderUp, 
  Copy,
  Info,
  ChevronRight,
  Archive,
  ArrowRight,
  RotateCcw,
  Cloud,
  Share2,
  Activity,
  Play,
  Wrench
} from 'lucide-react';
import { CloudDisasterVault } from './CloudDisasterVault';
import { GoogleDriveDisasterSync } from './GoogleDriveDisasterSync';
import { DisasterDiagnosticAudit } from './DisasterDiagnosticAudit';
import { DryRunSimulationModal } from './DryRunSimulationModal';
import { SelectiveBackupModal } from './SelectiveBackupModal';
import { 
  simulateDryRunRestore, 
  recordDRAuditEvent, 
  DryRunSimulationResult 
} from '../utils/disasterDiagnosticManager';
import { 
  parseAndValidateSnapshot, 
  computeDataSignature,
  formatBytes 
} from '../utils/backupRestoreManager';
import { SystemSnapshotData } from '../types';

export const MasterDisasterRecovery: React.FC = () => {
  const { 
    createSystemSnapshot, 
    downloadMasterBackup, 
    restoreSystemSnapshot, 
    systemVersionInfo,
    admins,
    gurus,
    siswas,
    kelases,
    halaqahs,
    moduls,
    setorans,
    murojaahBerpasangans,
    jenisAssessments,
    templateAssessments,
    assessmentRecords,
    pengajuanAssessments,
    syahadahs,
    programs,
    capaianPembelajarans,
    tujuanPembelajarans,
    guruRppList,
    auditLogs,
    currentSession
  } = useApp();

  // Active view: 'backup' | 'restore' | 'cloud_vault' | 'drive_share' | 'diagnostic_audit'
  const [activePanel, setActivePanel] = useState<'backup' | 'restore' | 'cloud_vault' | 'drive_share' | 'diagnostic_audit'>('backup');

  // Modal states for Langkah 3
  const [showSelectiveModal, setShowSelectiveModal] = useState(false);
  const [showDryRunModal, setShowDryRunModal] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunSimulationResult | null>(null);

  // Backup options
  const [customNotes, setCustomNotes] = useState('');
  const [versionBumpType, setVersionBumpType] = useState<'minor' | 'major' | 'custom'>('minor');
  const [customVersionStr, setCustomVersionStr] = useState('');
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [generatedJson, setGeneratedJson] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState('');

  // Restore options
  const [restoreMethod, setRestoreMethod] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedRestoreJson, setPastedRestoreJson] = useState('');
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [keepAdminSession, setKeepAdminSession] = useState(true);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<{
    isValid: boolean;
    error?: string;
    metadata?: any;
    stats?: any;
    data?: any;
  } | null>(null);

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('');
  const [restoreErrorMsg, setRestoreErrorMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Drag & drop state for file upload
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute live change detection vs last backup
  const currentDataset = useMemo(() => ({
    admins, gurus, siswas, kelases, halaqahs, moduls, setorans,
    murojaahBerpasangans, jenisAssessments, templateAssessments,
    assessmentRecords, pengajuanAssessments, syahadahs, programs,
    capaianPembelajarans, tujuanPembelajarans, guruRppList, auditLogs
  }), [
    admins, gurus, siswas, kelases, halaqahs, moduls, setorans,
    murojaahBerpasangans, jenisAssessments, templateAssessments,
    assessmentRecords, pengajuanAssessments, syahadahs, programs,
    capaianPembelajarans, tujuanPembelajarans, guruRppList, auditLogs
  ]);

  const currentSignature = useMemo(() => computeDataSignature(currentDataset), [currentDataset]);
  const hasChangesSinceLastBackup = !systemVersionInfo.lastDataHash || systemVersionInfo.lastDataHash !== currentSignature;

  // Real-time record summary
  const totalEntitiesCount = useMemo(() => {
    return admins.length + gurus.length + siswas.length + kelases.length +
      halaqahs.length + moduls.length +
      setorans.length + murojaahBerpasangans.length + jenisAssessments.length +
      templateAssessments.length + assessmentRecords.length + pengajuanAssessments.length +
      syahadahs.length + programs.length + capaianPembelajarans.length +
      tujuanPembelajarans.length + guruRppList.length;
  }, [
    admins, gurus, siswas, kelases, halaqahs, moduls,
    setorans, murojaahBerpasangans, jenisAssessments, templateAssessments,
    assessmentRecords, pengajuanAssessments, syahadahs, programs,
    capaianPembelajarans, tujuanPembelajarans, guruRppList
  ]);

  // Handle Download Master Backup
  const handleExecuteDownload = () => {
    setBackupSuccessMsg('');
    try {
      const options: any = {
        customNotes: customNotes.trim() || undefined,
        bumpType: versionBumpType === 'major' ? 'major' : 'minor'
      };
      if (versionBumpType === 'custom' && customVersionStr.trim()) {
        options.manualVersion = customVersionStr.trim().startsWith('v') 
          ? customVersionStr.trim() 
          : `v${customVersionStr.trim()}`;
      }

      const { filename, snapshot } = downloadMasterBackup(options);
      setGeneratedJson(JSON.stringify(snapshot, null, 2));
      setBackupSuccessMsg(`Berkas cadangan master "${filename}" berhasil diunduh ke komputer Anda!`);

      // Record to Disaster Recovery Audit Trail
      recordDRAuditEvent({
        action: 'backup_export',
        actionLabel: 'Ekspor Cadangan Master (.json ke PC)',
        actor: currentSession.user?.namaLengkap || 'Administrator Utama',
        version: snapshot.metadata.version,
        status: 'SUCCESS',
        recordCount: totalEntitiesCount,
        details: `Berkas cadangan master diunduh: ${filename}`
      });
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat cadangan: ' + (err.message || 'Kesalahan sistem'));
    }
  };

  // Inspect file on selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsInspecting(true);
    setInspectionResult(null);
    setRestoreSuccessMsg('');
    setRestoreErrorMsg('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseAndValidateSnapshot(text);
        setInspectionResult(result);
        if (!result.isValid) {
          setRestoreErrorMsg(result.error || 'Struktur file JSON tidak dikenali sebagai cadangan sistem.');
        }
      } catch (err: any) {
        setInspectionResult({ isValid: false, error: 'Gagal membaca berkas JSON: ' + err.message });
        setRestoreErrorMsg('Gagal membaca berkas: ' + err.message);
      } finally {
        setIsInspecting(false);
      }
    };
    reader.onerror = () => {
      setIsInspecting(false);
      setRestoreErrorMsg('Gagal membaca berkas dari sistem komputer.');
    };
    reader.readAsText(file);
  };

  // Inspect pasted text
  const handleInspectPastedText = () => {
    if (!pastedRestoreJson.trim()) {
      setInspectionResult(null);
      return;
    }
    setIsInspecting(true);
    setRestoreSuccessMsg('');
    setRestoreErrorMsg('');

    try {
      const result = parseAndValidateSnapshot(pastedRestoreJson);
      setInspectionResult(result);
      if (!result.isValid) {
        setRestoreErrorMsg(result.error || 'Struktur teks JSON tidak valid.');
      }
    } catch (err: any) {
      setInspectionResult({ isValid: false, error: 'Kesalahan sintaks JSON: ' + err.message });
      setRestoreErrorMsg('Format JSON salah: ' + err.message);
    } finally {
      setIsInspecting(false);
    }
  };

  // Run Dry Run Simulation
  const handleRunDryRun = () => {
    if (!inspectionResult || !inspectionResult.isValid || !inspectionResult.data) {
      setRestoreErrorMsg('Pilih atau masukkan data cadangan yang valid terlebih dahulu untuk disimulasikan.');
      return;
    }

    const sim = simulateDryRunRestore(
      inspectionResult.data,
      currentDataset as any,
      restoreMode
    );
    setDryRunResult(sim);
    setShowDryRunModal(true);

    recordDRAuditEvent({
      action: 'dry_run_drill',
      actionLabel: 'Simulasi Pemulihan (Dry Run Drill)',
      actor: currentSession.user?.namaLengkap || 'Administrator Utama',
      version: inspectionResult.data.metadata?.version || 'v1.0',
      status: sim.canProceed ? 'SUCCESS' : 'WARNING',
      recordCount: inspectionResult.stats?.totalRecords || 0,
      details: `Hasil simulasi: ${sim.verdict}. Mode: ${restoreMode}`
    });
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!inspectionResult || !inspectionResult.isValid || !inspectionResult.data) {
      setRestoreErrorMsg('Silakan pilih berkas cadangan yang valid terlebih dahulu.');
      return;
    }

    setShowConfirmModal(false);
    setIsRestoring(true);
    setRestoreSuccessMsg('');
    setRestoreErrorMsg('');

    try {
      const res = await restoreSystemSnapshot(inspectionResult.data, {
        mode: restoreMode,
        keepCurrentAdminSession: keepAdminSession
      });

      if (res.success) {
        setRestoreSuccessMsg(res.message);

        // Record to DR audit log
        recordDRAuditEvent({
          action: 'backup_restore',
          actionLabel: `Pemulihan Master Data (${restoreMode === 'replace' ? 'Timpa Bersih' : 'Gabungkan Data'})`,
          actor: currentSession.user?.namaLengkap || 'Administrator Utama',
          version: inspectionResult.data.metadata?.version || 'v1.0',
          status: 'SUCCESS',
          recordCount: inspectionResult.stats?.totalRecords || 0,
          details: `Pemulihan berhasil diterapkan ke database aktif (${restoreMode})`
        });

        setSelectedFile(null);
        setPastedRestoreJson('');
        setInspectionResult(null);
      } else {
        setRestoreErrorMsg(res.message);
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      setRestoreErrorMsg('Gagal memulihkan sistem: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Disaster Recovery Badge */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-6 rounded-3xl shadow-md border border-slate-800 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold font-mono tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                DISASTER RECOVERY SYSTEM
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Versi: {systemVersionInfo.versionString} (Rev #{systemVersionInfo.revisionCount})
              </span>
            </div>

            <h3 className="text-xl font-bold font-sans text-white tracking-tight">
              Pencadangan & Pemulihan Master Data
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Simpan seluruh rekaman santri, modul, setoran, penilaian, dan pengaturan ke berkas <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">.json</code> di komputer PC Anda secara mandiri untuk proteksi penuh jika aplikasi mengalami kendala atau terhapus.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shrink-0">
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Entitas</p>
              <p className="text-xl font-extrabold text-emerald-400 font-mono">{totalEntitiesCount.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Sinkron</p>
              <p className={`text-xs font-bold ${hasChangesSinceLastBackup ? 'text-amber-400' : 'text-emerald-400'}`}>
                {hasChangesSinceLastBackup ? 'Ada Perubahan Data' : 'Tercadangkan'}
              </p>
            </div>
          </div>
        </div>

        {/* System Details Footer Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Cadangan Terakhir: {systemVersionInfo.lastExportedAt ? new Date(systemVersionInfo.lastExportedAt).toLocaleString('id-ID') : 'Belum pernah diekspor'}</span>
          </div>
          {systemVersionInfo.lastExportedFilename && (
            <div className="flex items-center gap-2">
              <FileJson className="w-3.5 h-3.5 text-emerald-400" />
              <span>File: {systemVersionInfo.lastExportedFilename}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Admin: {systemVersionInfo.lastExportedBy || currentSession.user?.namaLengkap || 'Administrator Utama'}</span>
          </div>
        </div>
      </div>

      {/* 2. Mode Selector: 5-Tab Disaster Recovery Suite */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActivePanel('backup')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePanel === 'backup'
              ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>1. Unduh ke PC</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePanel('restore')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePanel === 'restore'
              ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>2. Pulihkan dari PC</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePanel('cloud_vault')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePanel === 'cloud_vault'
              ? 'bg-white dark:bg-slate-950 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>3. Cloud Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePanel('drive_share')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePanel === 'drive_share'
              ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>4. Drive & Share</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePanel('diagnostic_audit')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer col-span-2 sm:col-span-1 ${
            activePanel === 'diagnostic_audit'
              ? 'bg-white dark:bg-slate-950 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>5. Diagnosa & Audit</span>
        </button>
      </div>

      {/* 3. Panel 1: BACKUP TO PC */}
      {activePanel === 'backup' && (
        <div className="bg-white dark:bg-slate-950 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Simpan Berkas Cadangan ke Komputer (PC)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                File cadangan akan secara otomatis diberi nomor versi dan label tanggal saat diunduh.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono border ${
                hasChangesSinceLastBackup 
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              }`}>
                {hasChangesSinceLastBackup ? '⚠️ Ada Data Baru Belum Dicadangkan' : '✓ Data Telah Tercadangkan'}
              </span>
            </div>
          </div>

          {/* Backup Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Version Option */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                Skema Penomoran Versi Cadangan
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVersionBumpType('minor')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                    versionBumpType === 'minor'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span>Otomatis Minor</span>
                  <span className="text-[10px] font-mono text-slate-400">(v1.0 → v1.1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVersionBumpType('major')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                    versionBumpType === 'major'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span>Versi Mayor</span>
                  <span className="text-[10px] font-mono text-slate-400">(v1.0 → v2.0)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVersionBumpType('custom')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                    versionBumpType === 'custom'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span>Versi Kustom</span>
                  <span className="text-[10px] font-mono text-slate-400">(Input manual)</span>
                </button>
              </div>

              {versionBumpType === 'custom' && (
                <input
                  type="text"
                  placeholder="Contoh: v1.5 atau v2.1-semester-gasal"
                  value={customVersionStr}
                  onChange={(e) => setCustomVersionStr(e.target.value)}
                  className="w-full mt-2 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Notes / Description Option */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                Catatan / Label Cadangan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Cadangan rutin sebelum ujian semester / tambah 5 santri baru"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400">
                Catatan ini akan tersimpan di dalam berkas cadangan untuk mempermudah pengecekan riwayat.
              </p>
            </div>
          </div>

          {/* Breakdown of Current Data to be Backed up */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Rincian Data yang Akan Dicadangkan:</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {totalEntitiesCount} Entitas Total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-[11px]">
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-slate-400 text-[10px]">Santri</p>
                <p className="font-bold text-slate-800 dark:text-white font-mono">{siswas.length} data</p>
              </div>
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-slate-400 text-[10px]">Guru & Halaqah</p>
                <p className="font-bold text-slate-800 dark:text-white font-mono">{gurus.length} / {halaqahs.length} data</p>
              </div>
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-slate-400 text-[10px]">Modul & Halaman</p>
                <p className="font-bold text-slate-800 dark:text-white font-mono">{moduls.length} modul</p>
              </div>
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-slate-400 text-[10px]">Setoran & Mutabaah</p>
                <p className="font-bold text-slate-800 dark:text-white font-mono">{setorans.length} setoran</p>
              </div>
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-slate-400 text-[10px]">Penilaian / Ujian</p>
                <p className="font-bold text-slate-800 dark:text-white font-mono">{assessmentRecords.length} nilai</p>
              </div>
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <p className="text-slate-400 text-[10px]">Syahadah & RPP</p>
                <p className="font-bold text-slate-800 dark:text-white font-mono">{syahadahs.length + guruRppList.length} data</p>
              </div>
            </div>
          </div>

          {/* Action Button: Download Master Backup */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              id="btn-download-master-backup"
              onClick={handleExecuteDownload}
              className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md transition cursor-pointer"
            >
              <Download className="w-5 h-5 mr-1" />
              <span>Unduh Cadangan Master (.json ke PC Sekarang)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSelectiveModal(true)}
              className="w-full sm:w-auto py-3.5 px-5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Cadangan Selektif / Modular...</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const { snapshot } = createSystemSnapshot({
                  customNotes: customNotes.trim() || undefined,
                  bumpType: versionBumpType === 'major' ? 'major' : 'minor'
                });
                const jsonStr = JSON.stringify(snapshot, null, 2);
                setGeneratedJson(jsonStr);
                setShowJsonRaw(!showJsonRaw);
              }}
              className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <FileCode className="w-4 h-4 text-slate-500" />
              <span>{showJsonRaw ? 'Sembunyikan Kode' : 'Lihat / Salin Kode JSON'}</span>
            </button>
          </div>

          {/* Success Banner */}
          {backupSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/60 rounded-2xl flex items-start space-x-3 text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{backupSuccessMsg}</p>
                <p className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">
                  File telah disimpan di folder Downloads Anda. Simpan file ini di Google Drive atau penyimpanan cadangan Anda agar data halaqah 100% aman selamanya.
                </p>
              </div>
            </div>
          )}

          {/* Raw JSON viewer if requested */}
          {showJsonRaw && generatedJson && (
            <div className="space-y-2 pt-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <span>Pratinjau Kode JSON Snapshot Sistem</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedJson);
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedJson ? 'Tersalin!' : 'Salin ke Clipboard'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={generatedJson}
                rows={8}
                onClick={(e) => (e.target as any).select()}
                className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-2xl border border-slate-800 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* 4. Panel 2: RESTORE FROM PC */}
      {activePanel === 'restore' && (
        <div className="bg-white dark:bg-slate-950 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-850">
            <h4 className="text-base font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <FolderUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Pulihkan Sistem dari File Cadangan Komputer</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilih berkas <code className="text-indigo-500 font-mono">.json</code> cadangan yang telah Anda unduh sebelumnya untuk memulihkan seluruh struktur data.
            </p>
          </div>

          {/* Sub Switcher: Upload File or Paste Text */}
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="restoreInputMethod"
                checked={restoreMethod === 'file'}
                onChange={() => setRestoreMethod('file')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Pilih / Seret Berkas .json dari PC</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="restoreInputMethod"
                checked={restoreMethod === 'text'}
                onChange={() => setRestoreMethod('text')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Tempel Teks JSON Mentah</span>
            </label>
          </div>

          {/* Input Method A: File Drag & Drop */}
          {restoreMethod === 'file' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-slate-250 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="p-3.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <FileJson className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : 'Klik untuk memilih berkas .json atau seret ke sini'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedFile ? `Ukuran: ${formatBytes(selectedFile.size)}` : 'Mendukung format cadangan versi terbaru & versi sebelumnya'}
                </p>
              </div>
            </div>
          )}

          {/* Input Method B: Textarea */}
          {restoreMethod === 'text' && (
            <div className="space-y-2">
              <textarea
                value={pastedRestoreJson}
                onChange={(e) => setPastedRestoreJson(e.target.value)}
                onBlur={handleInspectPastedText}
                placeholder='Tempel baris teks JSON cadangan sistem di sini (e.g. {"metadata": {...}, "data": {...}})'
                rows={6}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleInspectPastedText}
                  className="py-1.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                >
                  Periksa Struktur Teks
                </button>
              </div>
            </div>
          )}

          {/* Inspection Result Preview Box */}
          {isInspecting && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center space-x-2 text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Memeriksa integritas dan struktur berkas cadangan...</span>
            </div>
          )}

          {inspectionResult && inspectionResult.isValid && (
            <div className="p-5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-3xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-200/60 dark:border-indigo-900/40">
                <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Berkas Cadangan Terverifikasi & Siap Dipulihkan</span>
                </div>
                <span className="font-mono text-xs font-extrabold px-3 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full">
                  Versi: {inspectionResult.metadata?.version || 'Format Legacy'}
                </span>
              </div>

              {/* Metadata Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Dibuat Pada</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {inspectionResult.metadata?.timestamp ? new Date(inspectionResult.metadata.timestamp).toLocaleString('id-ID') : '-'}
                  </p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Admin Pembuat</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {inspectionResult.metadata?.exportedBy || 'Administrator Utama'}
                  </p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Entitas Data</p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                    {inspectionResult.metadata?.totalRecords || Object.values(inspectionResult.stats || {}).reduce((a: any, b: any) => a + b, 0)} Data
                  </p>
                </div>
              </div>

              {/* Stats pill list */}
              {inspectionResult.stats && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(inspectionResult.stats).map(([k, v]) => (
                    typeof v === 'number' && v > 0 ? (
                      <span key={k} className="px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 text-[10px] font-mono rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                        {k}: <strong>{v}</strong>
                      </span>
                    ) : null
                  ))}
                </div>
              )}

              {/* Restore Options: Mode Selection */}
              <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Pilih Cara Pemulihan Data:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setRestoreMode('replace')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                      restoreMode === 'replace'
                        ? 'border-indigo-600 bg-white dark:bg-slate-900'
                        : 'border-transparent bg-white/50 dark:bg-slate-900/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="text-indigo-600"
                      />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Timpa Menyeluruh (Replace / Bersih)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 pl-6 leading-normal">
                      Direkomendasikan. Mengembalikan sistem persis seperti saat file ini dicadangkan (menghapus data rusak/duplikat).
                    </p>
                  </div>

                  <div
                    onClick={() => setRestoreMode('merge')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                      restoreMode === 'merge'
                        ? 'border-indigo-600 bg-white dark:bg-slate-900'
                        : 'border-transparent bg-white/50 dark:bg-slate-900/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="text-indigo-600"
                      />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Gabungkan Data (Merge)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 pl-6 leading-normal">
                      Menambahkan data dari cadangan ke dalam data yang sudah ada tanpa menghapus data yang baru dibuat.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="keepAdminSession"
                    checked={keepAdminSession}
                    onChange={(e) => setKeepAdminSession(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="keepAdminSession" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    Pertahankan sesi login admin aktif saat ini (tidak akan di-logout setelah pemulihan selesai)
                  </label>
                </div>
              </div>

              {/* Action Trigger Buttons: Dry Run Simulation + Real Execution */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunDryRun}
                  className="w-full sm:w-auto py-3.5 px-5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-2 shrink-0"
                >
                  <Play className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Simulasi Pemulihan (Dry Run)</span>
                </button>

                <button
                  type="button"
                  id="btn-confirm-restore"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isRestoring}
                  className="w-full flex-1 flex items-center justify-center space-x-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Sedang Memulihkan Seluruh Database...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5" />
                      <span>Eksekusi Pemulihan Sistem Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {restoreSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/60 rounded-2xl flex items-start space-x-3 text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{restoreSuccessMsg}</p>
                <p className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px] mt-0.5">
                  Seluruh data santri, guru, modul, setoran, dan pengaturan telah aktif kembali secara instan.
                </p>
              </div>
            </div>
          )}

          {restoreErrorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-250 dark:border-rose-900/60 rounded-2xl flex items-start space-x-3 text-rose-800 dark:text-rose-400 text-xs animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Memulihkan Cadangan</p>
                <p className="text-rose-700/80 dark:text-rose-400/80 text-[11px] mt-0.5">{restoreErrorMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Panel 3: CLOUD DISASTER VAULT (LANGKAH 2) */}
      {activePanel === 'cloud_vault' && <CloudDisasterVault />}

      {/* 5. Panel 4: GOOGLE DRIVE & SMART SHARE (LANGKAH 2) */}
      {activePanel === 'drive_share' && <GoogleDriveDisasterSync />}

      {/* 6. Panel 5: DIAGNOSTIK & AUDIT RECOVERY (LANGKAH 3) */}
      {activePanel === 'diagnostic_audit' && <DisasterDiagnosticAudit />}

      {/* Selective Modular Backup Modal */}
      <SelectiveBackupModal
        isOpen={showSelectiveModal}
        onClose={() => setShowSelectiveModal(false)}
        onSuccessMsg={(msg) => setBackupSuccessMsg(msg)}
      />

      {/* Dry Run Simulation Modal */}
      <DryRunSimulationModal
        isOpen={showDryRunModal}
        onClose={() => setShowDryRunModal(false)}
        simulation={dryRunResult}
        onProceedRestore={() => setShowConfirmModal(true)}
      />

      {/* Confirmation Modal Before Restore */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Pemulihan Database Sistem
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Anda akan memulihkan database dari snapshot versi{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {inspectionResult?.metadata?.version || 'Cadangan'}
                </strong>{' '}
                dengan mode{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {restoreMode === 'replace' ? 'Timpa Menyeluruh' : 'Gabungkan Data'}
                </strong>
                .
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              💡 Pastikan Anda tidak sengaja memulihkan berkas lama yang belum memiliki update terbaru jika tidak diperlukan.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Ya, Pulihkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

