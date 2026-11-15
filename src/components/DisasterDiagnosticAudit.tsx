/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Wrench, 
  FileText, 
  Download, 
  Play, 
  Check, 
  X, 
  Search, 
  Filter, 
  Info, 
  ChevronRight, 
  Layers, 
  Users, 
  BookOpen, 
  Award, 
  FileSpreadsheet, 
  Trash2, 
  ArrowRight,
  Database,
  Activity,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';
import { 
  runDatabaseHealthCheck, 
  repairDatabaseAnomalies, 
  getDRAuditEvents, 
  recordDRAuditEvent, 
  downloadDRAuditReport,
  DatabaseHealthResult,
  DiagnosticIssue,
  DRAuditEvent
} from '../utils/disasterDiagnosticManager';

export const DisasterDiagnosticAudit: React.FC = () => {
  const { 
    admins, 
    gurus, 
    siswas, 
    kelases, 
    halaqahs, 
    moduls, 
    setorans, 
    murojaahBerpasangans,
    assessmentRecords, 
    syahadahs, 
    programs,
    guruRppList,
    auditLogs,
    currentSession,
    restoreSystemSnapshot,
    createSystemSnapshot,
    addLog
  } = useApp();

  // Active subtab inside diagnostic: 'health' | 'audit'
  const [activeTab, setActiveTab] = useState<'health' | 'audit'>('health');

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSuccessResult, setRepairSuccessResult] = useState<{ count: number; actions: string[] } | null>(null);

  // Diagnostic result state
  const [healthResult, setHealthResult] = useState<DatabaseHealthResult>(() => {
    return runDatabaseHealthCheck({
      admins,
      gurus,
      siswas,
      kelases,
      halaqahs,
      moduls,
      setorans,
      assessmentRecords,
      syahadahs
    });
  });

  // DR Audit trail state
  const [drAuditLogs, setDrAuditLogs] = useState<DRAuditEvent[]>(() => getDRAuditEvents());
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Re-run scan manually
  const handleRunHealthScan = () => {
    setIsScanning(true);
    setRepairSuccessResult(null);
    setTimeout(() => {
      const res = runDatabaseHealthCheck({
        admins,
        gurus,
        siswas,
        kelases,
        halaqahs,
        moduls,
        setorans,
        assessmentRecords,
        syahadahs
      });
      setHealthResult(res);
      setIsScanning(false);
    }, 450);
  };

  // Run auto-repair
  const handleAutoRepair = () => {
    if (healthResult.issues.length === 0) return;

    setIsRepairing(true);
    setTimeout(() => {
      const { snapshot: currentSnapshot } = createSystemSnapshot({
        customNotes: 'Pra-Perbaikan Diagnostik Sistem'
      });
      const repairOutcome = repairDatabaseAnomalies(
        currentSnapshot.data,
        currentSession.user?.namaLengkap || 'Administrator Utama'
      );

      // Apply repaired data back to system via restoreSystemSnapshot in replace mode
      restoreSystemSnapshot(
        {
          metadata: {
            ...currentSnapshot.metadata,
            version: `${currentSnapshot.metadata.version}-REPAIRED`,
            notes: `Auto-repair dijalankan: ${repairOutcome.actionsTaken.join('; ')}`,
            timestamp: new Date().toISOString()
          },
          data: repairOutcome.repairedData
        },
        { mode: 'replace' }
      );

      // Record to DR audit trail
      recordDRAuditEvent({
        action: 'auto_repair',
        actionLabel: 'Perbaikan Anomali Database Otomatis',
        actor: currentSession.user?.namaLengkap || 'Administrator Utama',
        version: currentSnapshot.metadata.version,
        status: 'SUCCESS',
        recordCount: repairOutcome.repairedCount,
        details: repairOutcome.actionsTaken.join(' | ')
      });

      // Refresh log
      setDrAuditLogs(getDRAuditEvents());

      // Update repair outcome
      setRepairSuccessResult({
        count: repairOutcome.repairedCount,
        actions: repairOutcome.actionsTaken
      });

      // Re-scan
      const refreshed = runDatabaseHealthCheck(repairOutcome.repairedData);
      setHealthResult(refreshed);
      setIsRepairing(false);
    }, 600);
  };

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return drAuditLogs.filter(item => {
      const matchFilter = auditFilter === 'all' || item.action === auditFilter;
      const searchLower = auditSearch.toLowerCase();
      const matchSearch = !auditSearch || 
        item.actionLabel.toLowerCase().includes(searchLower) ||
        item.details.toLowerCase().includes(searchLower) ||
        item.actor.toLowerCase().includes(searchLower) ||
        item.version.toLowerCase().includes(searchLower);
      return matchFilter && matchSearch;
    });
  }, [drAuditLogs, auditFilter, auditSearch]);

  const scoreColor = useMemo(() => {
    if (healthResult.score >= 95) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (healthResult.score >= 80) return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
    if (healthResult.score >= 60) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  }, [healthResult.score]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Subtab Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'health'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Pemeriksa Kesehatan Relasi (Health Check)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('audit');
              setDrAuditLogs(getDRAuditEvents());
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Jejak Audit Pemulihan (DR Audit Trail)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300">
              {drAuditLogs.length}
            </span>
          </button>
        </div>

        {activeTab === 'health' && (
          <button
            type="button"
            onClick={handleRunHealthScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Pindai Ulang Database</span>
          </button>
        )}

        {activeTab === 'audit' && (
          <button
            type="button"
            onClick={() => downloadDRAuditReport(drAuditLogs)}
            disabled={drAuditLogs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Laporan Audit (.txt)</span>
          </button>
        )}
      </div>

      {/* VIEW 1: HEALTH SCANNER & DIAGNOSTIC */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* Main Score Banner */}
          <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Langkah 3: Diagnostik Database & Simulasi
                  </span>
                  <span className="text-xs text-slate-400">
                    Dipindai: {new Date(healthResult.timestamp).toLocaleTimeString('id-ID')} WIB
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Status Integritas & Kesehatan Relasional Database
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mesin diagnostik menganalisis konsistensi relasi foreign-key antar santri, halaqah, pembina guru, rekor setoran harian, dan sertifikat syahadah untuk menjamin proses restore bebas konflik.
                </p>
              </div>

              {/* Score Gauge Circle */}
              <div className="flex items-center gap-4 shrink-0 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-bold ${scoreColor}`}>
                  <span className="text-2xl font-mono tracking-tighter">{healthResult.score}%</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Skor</span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-200">
                    Kondisi: {' '}
                    <span className={
                      healthResult.status === 'optimal' ? 'text-emerald-400 font-extrabold' :
                      healthResult.status === 'good' ? 'text-blue-400 font-extrabold' :
                      healthResult.status === 'warning' ? 'text-amber-400 font-extrabold' : 'text-rose-400 font-extrabold'
                    }>
                      {healthResult.status === 'optimal' ? 'Sangat Sehat (Optimal)' :
                       healthResult.status === 'good' ? 'Baik (Siap Digunakan)' :
                       healthResult.status === 'warning' ? 'Perlu Perhatian' : 'Kritis (Perlu Perbaikan)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Total Rekor: <strong className="text-slate-200 font-mono">{healthResult.totalRecords.toLocaleString()}</strong> data
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Anomali Terdeteksi: <strong className={`font-mono ${healthResult.issues.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{healthResult.issues.length}</strong> kasus
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Repair Notification if Auto-Repair was executed */}
          {repairSuccessResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl animate-fade-in space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Perbaikan Otomatis Selesai ({repairSuccessResult.count} Perubahan Diterapkan)</span>
              </div>
              <ul className="text-[11px] text-emerald-700 dark:text-emerald-300 space-y-1 list-disc list-inside pl-1">
                {repairSuccessResult.actions.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Scanned Collections Summary Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Cakupan Pemindaian Koleksi Data ({healthResult.scannedCollections.length} Tabel)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {healthResult.scannedCollections.map(item => (
                <div 
                  key={item.key}
                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-1 shadow-xs"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {item.name}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-100">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                      TERVERIFIKASI
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues Section or All Clean Message */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Temuan Diagnostik & Rekomendasi ({healthResult.issues.length})</span>
              </h4>

              {healthResult.issues.some(i => i.repairable) && (
                <button
                  type="button"
                  onClick={handleAutoRepair}
                  disabled={isRepairing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                  <span>{isRepairing ? 'Sedang Memperbaiki...' : 'Perbaiki Otomatis Semua Anomali'}</span>
                </button>
              )}
            </div>

            {healthResult.issues.length === 0 ? (
              <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Semua Relasi Database Utuh & Sempurna!
                  </h5>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Tidak ditemukan santri yatim, relasi halaqah terputus, rekor setoran invalid, ataupun duplikasi ID primer. Berkas cadangan Anda aman 100% untuk direplikasi ke perangkat lain.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {healthResult.issues.map(issue => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      issue.severity === 'critical'
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                        : issue.severity === 'warning'
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        issue.severity === 'critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300' :
                        issue.severity === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300' :
                        'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {issue.severity === 'critical' ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {issue.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            issue.severity === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                            issue.severity === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Tabel: {issue.collection} ({issue.affectedIds.length} item)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {issue.description}
                        </p>
                        {issue.repairAction && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 pt-0.5">
                            <Wrench className="w-3 h-3" />
                            <span>Solusi Otomatis: {issue.repairAction}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {issue.repairable && (
                      <button
                        type="button"
                        onClick={handleAutoRepair}
                        disabled={isRepairing}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition shrink-0 cursor-pointer shadow-2xs"
                      >
                        Perbaiki Kasus Ini
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DR AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari log peristiwa, versi, atau operator..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Jenis Operasi ({drAuditLogs.length})</option>
                <option value="backup_export">Ekspor Cadangan PC</option>
                <option value="backup_restore">Pemulihan Sistem (PC)</option>
                <option value="cloud_save">Unggah Cloud Vault</option>
                <option value="cloud_restore">Pulihkan dari Cloud</option>
                <option value="drive_upload">Sinkronisasi Google Drive</option>
                <option value="auto_repair">Perbaikan Otomatis</option>
                <option value="dry_run_drill">Simulasi Dry Run</option>
                <option value="selective_export">Ekspor Modular</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
              Menampilkan {filteredAuditLogs.length} dari {drAuditLogs.length} log
            </div>
          </div>

          {/* Audit Timeline */}
          {filteredAuditLogs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Belum ada log operasi bencana yang sesuai filter.
              </p>
              <p className="text-[11px] text-slate-400">
                Setiap kali Anda mengekspor data, memulihkan cadangan, atau melakukan auto-repair, catatan audit otomatis terekam di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                        log.status === 'WARNING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {log.actionLabel}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Versi: {log.version}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.recordCount} Rekor
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {log.details}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        Operator: <strong className="text-slate-600 dark:text-slate-300">{log.actor}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(log.timestamp).toLocaleString('id-ID')} WIB
                      </span>
                      {log.checksum && (
                        <span className="font-mono text-slate-400 hidden sm:inline">
                          Hash: {log.checksum}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
