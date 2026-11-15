/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Share2, 
  RefreshCw, 
  Check, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Upload, 
  Download, 
  HardDrive, 
  FileJson, 
  AlertTriangle, 
  Clock, 
  Link as LinkIcon,
  ShieldCheck,
  RotateCcw,
  Layers,
  Sparkles,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderCheck,
  Search,
  X,
  Edit3,
  ChevronRight,
  ArrowUp,
  CornerDownRight,
  Plus
} from 'lucide-react';
import { 
  getGoogleAccessToken, 
  signInWithGoogleWorkspace 
} from './GoogleWorkspace';
import { 
  uploadSnapshotToGoogleDrive, 
  listGoogleDriveBackups, 
  fetchGoogleDriveBackupContent, 
  GoogleDriveBackupFile,
  GoogleDriveFolder,
  GoogleDriveBackupTargetFolder,
  getDefaultDriveBackupFolder,
  setDefaultDriveBackupFolder,
  listGoogleDriveFolders,
  createGoogleDriveFolder
} from '../utils/googleDriveBackupManager';
import { 
  parseAndValidateSnapshot, 
  formatBytes 
} from '../utils/backupRestoreManager';
import { saveSharedState } from '../lib/firebaseShare';
import { UserRole } from '../types';

interface BreadcrumbItem {
  id: string; // 'root' or Google Drive folder ID
  name: string;
}

export const GoogleDriveDisasterSync: React.FC = () => {
  const { 
    createSystemSnapshot, 
    restoreSystemSnapshot, 
    systemVersionInfo 
  } = useApp();

  // Google Token state
  const [googleToken, setGoogleToken] = useState<string | null>(() => getGoogleAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Target Folder state
  const [targetFolder, setTargetFolder] = useState<GoogleDriveBackupTargetFolder | null>(() => getDefaultDriveBackupFolder());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [selectedFolderForUpload, setSelectedFolderForUpload] = useState<GoogleDriveBackupTargetFolder>(() => {
    return getDefaultDriveBackupFolder() || { id: 'root', name: 'Drive Saya (Root)', fullPath: 'Drive Saya' };
  });
  const [setAsDefaultFolder, setSetAsDefaultFolder] = useState(true);

  // Folder Explorer navigation state
  const [navPath, setNavPath] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'Drive Saya' }
  ]);
  const currentOpenFolder = navPath[navPath.length - 1];

  const [currentFolderChildren, setCurrentFolderChildren] = useState<GoogleDriveFolder[]>([]);
  const [isLoadingFolderContents, setIsLoadingFolderContents] = useState(false);

  // All folders cache (for global search mode)
  const [allFoldersList, setAllFoldersList] = useState<GoogleDriveFolder[]>([]);
  const [isLoadingAllFolders, setIsLoadingAllFolders] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  // New Folder Creation state
  const [showCreateFolderInput, setShowCreateFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [createFolderError, setCreateFolderError] = useState('');

  // Drive backups list state
  const [driveFiles, setDriveFiles] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveSuccessMsg, setDriveSuccessMsg] = useState('');
  const [driveErrorMsg, setDriveErrorMsg] = useState('');

  // Restore from Drive state
  const [selectedDriveFile, setSelectedDriveFile] = useState<GoogleDriveBackupFile | null>(null);
  const [driveRestoreMode, setDriveRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoringDrive, setIsRestoringDrive] = useState(false);

  // Share Link state
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);
  const [generatedShareLink, setGeneratedShareLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareErrorMsg, setShareErrorMsg] = useState('');

  // Load drive backups
  const loadDriveBackups = async (tokenToUse?: string) => {
    const token = tokenToUse || googleToken;
    if (!token) return;

    setIsLoadingDrive(true);
    setDriveErrorMsg('');
    try {
      const files = await listGoogleDriveBackups(token);
      setDriveFiles(files);
    } catch (e: any) {
      setDriveErrorMsg('Gagal memuat berkas Google Drive: ' + (e.message || 'Koneksi error'));
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Load subfolders for a specific parent folder in explorer
  const loadSubfoldersFor = async (parentId: string, tokenToUse?: string) => {
    const token = tokenToUse || googleToken;
    if (!token) return;

    setIsLoadingFolderContents(true);
    try {
      const list = await listGoogleDriveFolders(token, parentId);
      setCurrentFolderChildren(list);
    } catch (e) {
      console.error('Error fetching subfolders:', e);
      setCurrentFolderChildren([]);
    } finally {
      setIsLoadingFolderContents(false);
    }
  };

  // Load all folders in Drive for global search
  const loadAllFoldersForSearch = async (tokenToUse?: string) => {
    const token = tokenToUse || googleToken;
    if (!token) return;

    setIsLoadingAllFolders(true);
    try {
      const list = await listGoogleDriveFolders(token, 'all');
      setAllFoldersList(list);
    } catch (e) {
      console.error('Error fetching all folders for search:', e);
    } finally {
      setIsLoadingAllFolders(false);
    }
  };

  useEffect(() => {
    const token = getGoogleAccessToken();
    setGoogleToken(token);
    if (token) {
      loadDriveBackups(token);
    }
  }, []);

  // Connect Google Workspace
  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    setDriveErrorMsg('');
    try {
      await signInWithGoogleWorkspace(UserRole.ADMIN);
      const token = getGoogleAccessToken();
      setGoogleToken(token);
      if (token) {
        setDriveSuccessMsg('Berhasil terhubung ke akun Google Workspace Admin!');
        await loadDriveBackups(token);
      }
    } catch (e: any) {
      setDriveErrorMsg('Gagal menghubungkan Google Drive: ' + (e.message || 'Otorisasi dibatalkan'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Open the folder selection & upload modal
  const handleOpenUploadFlow = async () => {
    let token = googleToken;
    if (!token) {
      setIsAuthenticating(true);
      setDriveErrorMsg('');
      try {
        await signInWithGoogleWorkspace(UserRole.ADMIN);
        token = getGoogleAccessToken();
        setGoogleToken(token);
        if (!token) throw new Error('Token otorisasi Google tidak ditemukan.');
      } catch (err: any) {
        setDriveErrorMsg('Gagal menghubungkan Google Drive: ' + (err.message || 'Dibatalkan'));
        setIsAuthenticating(false);
        return;
      } finally {
        setIsAuthenticating(false);
      }
    }

    const current = targetFolder || { id: 'root', name: 'Drive Saya (Root)', fullPath: 'Drive Saya' };
    setSelectedFolderForUpload(current);
    setSetAsDefaultFolder(true);
    setCreateFolderError('');
    setShowCreateFolderInput(false);
    setFolderSearchQuery('');
    setNavPath([{ id: 'root', name: 'Drive Saya' }]);
    setIsFolderModalOpen(true);

    if (token) {
      loadSubfoldersFor('root', token);
      loadAllFoldersForSearch(token);
    }
  };

  // Navigate deeper: open a folder
  const handleOpenFolder = (folder: { id: string; name: string }) => {
    const updatedPath = [...navPath, { id: folder.id, name: folder.name }];
    setNavPath(updatedPath);
    setFolderSearchQuery('');
    setShowCreateFolderInput(false);
    setCreateFolderError('');

    // Pre-select this opened folder as candidate target
    const fullPathStr = updatedPath.map(p => p.name).join(' > ');
    setSelectedFolderForUpload({
      id: folder.id,
      name: folder.name,
      fullPath: fullPathStr
    });

    if (googleToken) {
      loadSubfoldersFor(folder.id, googleToken);
    }
  };

  // Navigate breadcrumb click
  const handleNavigateBreadcrumb = (index: number) => {
    if (index === navPath.length - 1) return; // already here
    const updatedPath = navPath.slice(0, index + 1);
    setNavPath(updatedPath);
    setFolderSearchQuery('');
    setShowCreateFolderInput(false);

    const folder = updatedPath[updatedPath.length - 1];
    const fullPathStr = updatedPath.map(p => p.name).join(' > ');
    setSelectedFolderForUpload({
      id: folder.id,
      name: folder.id === 'root' ? 'Drive Saya (Root)' : folder.name,
      fullPath: fullPathStr
    });

    if (googleToken) {
      loadSubfoldersFor(folder.id, googleToken);
    }
  };

  // Navigate up one folder
  const handleNavigateUp = () => {
    if (navPath.length <= 1) return;
    handleNavigateBreadcrumb(navPath.length - 2);
  };

  // Select the current open folder as backup target
  const handleSelectCurrentOpenFolderAsTarget = () => {
    const fullPathStr = navPath.map(p => p.name).join(' > ');
    setSelectedFolderForUpload({
      id: currentOpenFolder.id,
      name: currentOpenFolder.id === 'root' ? 'Drive Saya (Root)' : currentOpenFolder.name,
      fullPath: fullPathStr
    });
  };

  // Create a new folder inside currently opened folder
  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleToken || !newFolderName.trim()) return;

    setIsCreatingFolder(true);
    setCreateFolderError('');
    try {
      const parentIdToUse = currentOpenFolder.id;
      const res = await createGoogleDriveFolder(googleToken, newFolderName.trim(), parentIdToUse);
      if (res.success && res.folder) {
        // Refresh children of current folder
        await loadSubfoldersFor(parentIdToUse, googleToken);
        // Also refresh global search list
        loadAllFoldersForSearch(googleToken);

        // Select the newly created folder as the target
        const fullPathStr = [...navPath.map(p => p.name), res.folder.name].join(' > ');
        setSelectedFolderForUpload({
          id: res.folder.id,
          name: res.folder.name,
          fullPath: fullPathStr
        });

        setNewFolderName('');
        setShowCreateFolderInput(false);
      } else {
        throw new Error(res.error || 'Gagal membuat folder baru.');
      }
    } catch (err: any) {
      setCreateFolderError(err.message || 'Gagal membuat folder di Google Drive.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Upload Master Snapshot to Google Drive (Confirmed)
  const handleConfirmUpload = async () => {
    if (!googleToken) return;

    setIsUploadingToDrive(true);
    setDriveSuccessMsg('');
    setDriveErrorMsg('');
    setIsFolderModalOpen(false);

    try {
      const folderLabel = selectedFolderForUpload.id === 'root' 
        ? 'Drive Saya (Root)' 
        : selectedFolderForUpload.name;

      const { snapshot } = createSystemSnapshot({
        customNotes: `Pencadangan Google Drive Mandiri Admin ke folder: ${folderLabel}`
      });

      const res = await uploadSnapshotToGoogleDrive(
        snapshot, 
        googleToken, 
        selectedFolderForUpload.id, 
        selectedFolderForUpload.name
      );

      if (res.success) {
        // Save as default if requested
        if (setAsDefaultFolder) {
          setDefaultDriveBackupFolder(selectedFolderForUpload);
          setTargetFolder(selectedFolderForUpload);
        }

        const folderNotice = selectedFolderForUpload.id === 'root'
          ? 'folder utama "Drive Saya"'
          : `folder "${selectedFolderForUpload.name}"`;

        setDriveSuccessMsg(`Berkas "${res.filename}" berhasil diunggah ke Google Drive di dalam ${folderNotice}!`);
        await loadDriveBackups(googleToken);
      } else {
        throw new Error(res.error || 'Gagal mengunggah berkas.');
      }
    } catch (err: any) {
      setDriveErrorMsg(err.message || 'Terjadi kendala saat mengunggah ke Google Drive.');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Execute restore from Google Drive file
  const handleExecuteRestoreFromDrive = async () => {
    if (!selectedDriveFile || !googleToken) return;

    setIsRestoringDrive(true);
    setDriveErrorMsg('');
    setDriveSuccessMsg('');
    try {
      const fileContent = await fetchGoogleDriveBackupContent(selectedDriveFile.id, googleToken);
      const inspection = parseAndValidateSnapshot(fileContent);

      if (!inspection.isValid) {
        throw new Error('Berkas cadangan Google Drive tidak valid atau rusak.');
      }

      const res = await restoreSystemSnapshot(fileContent, {
        mode: driveRestoreMode,
        keepCurrentAdminSession: true
      });

      if (res.success) {
        setDriveSuccessMsg(`Sistem berhasil dipulihkan dari berkas Google Drive "${selectedDriveFile.name}"!`);
        setSelectedDriveFile(null);
      } else {
        throw new Error(res.message || 'Gagal menerapkan cadangan.');
      }
    } catch (e: any) {
      setDriveErrorMsg(e.message || 'Gagal memulihkan cadangan dari Google Drive.');
    } finally {
      setIsRestoringDrive(false);
    }
  };

  // Generate Instant Share Portal Link
  const handleGenerateShareLink = async () => {
    setIsGeneratingShareLink(true);
    setShareErrorMsg('');
    setGeneratedShareLink('');
    try {
      const { snapshot } = createSystemSnapshot({
        customNotes: 'Snapshot Berbagi Portal Instan'
      });

      const jsonStr = JSON.stringify(snapshot);
      const shareId = await saveSharedState(jsonStr);

      if (!shareId) {
        throw new Error('Gagal mengunggah paket database ke cloud.');
      }

      const cleanOrigin = window.location.origin;
      const cleanPath = window.location.pathname;
      const fullShareUrl = `${cleanOrigin}${cleanPath}?share_id=${shareId}`;

      setGeneratedShareLink(fullShareUrl);
    } catch (err: any) {
      setShareErrorMsg(err.message || 'Gagal membuat tautan berbagi portal.');
    } finally {
      setIsGeneratingShareLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedShareLink) return;
    navigator.clipboard.writeText(generatedShareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Filtered search results across all folders
  const searchResults = useMemo(() => {
    if (!folderSearchQuery.trim()) return [];
    const q = folderSearchQuery.toLowerCase();
    return allFoldersList.filter(f => f.name.toLowerCase().includes(q));
  }, [allFoldersList, folderSearchQuery]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* 1. Google Drive Section */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Google Drive Disaster Recovery
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simpan dan pulihkan snapshot database lengkap langsung ke cloud storage Google Drive lembaga Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {!googleToken ? (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isAuthenticating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Hubungkan Google Drive</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  loadDriveBackups();
                  loadSubfoldersFor(currentOpenFolder.id);
                  loadAllFoldersForSearch();
                }}
                disabled={isLoadingDrive}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Segarkan data dari Google Drive"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                <span>Segarkan Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Action card if connected */}
        {googleToken && (
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Unggah Snapshot Master Terbaru ke Google Drive
                </p>
                <p className="text-[11px] text-slate-400">
                  File akan disimpan dengan nama otomatis: <code className="text-blue-600 dark:text-blue-400 font-mono">Backup_Tahfidz_{systemVersionInfo.versionString}_[Tanggal].json</code>
                </p>

                {/* Target Folder Badge & Switch Button */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Folder Penyimpanan:
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-900/60 shadow-2xs">
                    <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{targetFolder?.name || 'Drive Saya (Root)'}</span>
                    <span className="text-[9px] uppercase px-1 py-0.2 bg-blue-200/60 dark:bg-blue-900/60 rounded text-blue-800 dark:text-blue-200 font-bold">
                      Default
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenUploadFlow}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Buka / Ubah Folder Tujuan</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenUploadFlow}
                disabled={isUploadingToDrive}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                  isUploadingToDrive
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                }`}
              >
                {isUploadingToDrive ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengunggah ke Drive...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Unggah ke Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {driveSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/60 rounded-xl flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{driveSuccessMsg}</span>
          </div>
        )}

        {driveErrorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-250 dark:border-rose-900/60 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-xs animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{driveErrorMsg}</span>
          </div>
        )}

        {/* Drive Backups List */}
        {googleToken && (
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-blue-600" />
              <span>Daftar Berkas Cadangan di Google Drive ({driveFiles.length})</span>
            </h5>

            {driveFiles.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                Belum ada berkas cadangan Tahfidz ditemukan di Google Drive Anda.
              </p>
            ) : (
              <div className="space-y-2">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/50 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white font-mono truncate">
                        {file.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {file.createdTime ? new Date(file.createdTime).toLocaleString('id-ID') : 'Tanggal tidak tersedia'}
                        </span>
                        {file.size && <span>• {formatBytes(parseInt(file.size, 10))}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedDriveFile(file)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Pulihkan</span>
                      </button>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                          title="Buka di Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Instant Smart Share Portal Link */}
      <div className="bg-gradient-to-br from-emerald-900/10 via-white to-teal-900/5 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950 p-6 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 text-emerald-700 dark:text-emerald-400">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Tautan Berbagi Portal Instan (Smart Share Link)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bagikan rancangan portal bimbingan lengkap kepada ustadz atau santri lain secara instan tanpa perlu kirim berkas manual.
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-150 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          💡 <strong>Bagaimana cara kerjanya?</strong> Ketika penerima membuka link yang Anda buat, aplikasi akan menampilkan tinjauan rincian akun, modul, dan setoran dengan opsi <em>"Timpa Bersih"</em> atau <em>"Gabungkan Data"</em> sebelum menerapkan ke perangkat mereka.
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleGenerateShareLink}
            disabled={isGeneratingShareLink}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
              isGeneratingShareLink
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
          >
            {isGeneratingShareLink ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengemas & Mengunggah Portal...</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                <span>Buat Tautan Berbagi Cerdas</span>
              </>
            )}
          </button>
        </div>

        {/* Share Link Output */}
        {generatedShareLink && (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-2 animate-fade-in">
            <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Tautan Berhasil Dibuat (Siap Dikirim)</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={generatedShareLink}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 select-all"
                onClick={(e) => (e.target as any).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Tautan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {shareErrorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-250 dark:border-rose-900/60 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-xs animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{shareErrorMsg}</span>
          </div>
        )}
      </div>

      {/* MODAL 1: BROWSE, OPEN FOLDER & UPLOAD TO GOOGLE DRIVE */}
      {isFolderModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsFolderModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
                    Jelajah &amp; Pilih Folder Google Drive
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Buka folder, buat subfolder baru, dan pilih lokasi penyimpanan backup
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breadcrumb Navigation Bar */}
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 scrollbar-thin">
                {navPath.map((item, idx) => {
                  const isLast = idx === navPath.length - 1;
                  return (
                    <React.Fragment key={item.id + idx}>
                      {idx > 0 && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleNavigateBreadcrumb(idx)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                          isLast
                            ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-850'
                        }`}
                      >
                        {idx === 0 ? <HardDrive className="w-3 h-3 shrink-0" /> : <Folder className="w-3 h-3 shrink-0" />}
                        <span>{item.name}</span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {navPath.length > 1 && (
                <button
                  type="button"
                  onClick={handleNavigateUp}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Kembali ke folder sebelumnya"
                >
                  <ArrowUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Naik 1 Folder</span>
                </button>
              )}
            </div>

            {/* Active Folder Actions Bar */}
            <div className="p-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider block">
                    Folder Terbuka Saat Ini:
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate block">
                    {currentOpenFolder.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedFolderForUpload.id !== currentOpenFolder.id ? (
                  <button
                    type="button"
                    onClick={handleSelectCurrentOpenFolderAsTarget}
                    className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pilih Folder Ini</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Target Terpilih</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFolderInput(!showCreateFolderInput);
                    setNewFolderName('Cadangan M-Halaqah');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Folder Baru di Sini</span>
                </button>
              </div>
            </div>

            {/* Inline Create Subfolder Form */}
            {showCreateFolderInput && (
              <form 
                onSubmit={handleCreateNewFolder} 
                className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-2.5 animate-fade-in shrink-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                    <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Buat Folder Baru di dalam <strong>"{currentOpenFolder.name}"</strong>:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCreateFolderInput(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Contoh: Cadangan M-Halaqah"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isCreatingFolder || !newFolderName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isCreatingFolder ? 'Membuat...' : 'Buat Folder'}
                  </button>
                </div>

                {createFolderError && (
                  <p className="text-[10px] text-rose-600 font-semibold">{createFolderError}</p>
                )}
              </form>
            )}

            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input 
                type="text"
                value={folderSearchQuery}
                onChange={(e) => setFolderSearchQuery(e.target.value)}
                placeholder="Cari nama folder di Google Drive..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Folders Explorer Area */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[160px] max-h-[260px] pr-1">
              {/* If Searching */}
              {folderSearchQuery.trim() ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Hasil Pencarian untuk "{folderSearchQuery}":
                  </span>
                  {searchResults.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic">
                      Tidak ada folder yang cocok dengan pencarian "{folderSearchQuery}".
                    </div>
                  ) : (
                    searchResults.map((f) => {
                      const isSelected = selectedFolderForUpload.id === f.id;
                      return (
                        <div
                          key={f.id}
                          className={`p-2.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div 
                            onClick={() => setSelectedFolderForUpload({ id: f.id, name: f.name })}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              <Folder className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs truncate block">{f.name}</span>
                              {f.modifiedTime && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  Diubah: {new Date(f.modifiedTime).toLocaleDateString('id-ID')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedFolderForUpload({ id: f.id, name: f.name })}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isSelected ? 'Terpilih' : 'Pilih'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenFolder(f)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                              title="Buka dan lihat isi folder ini"
                            >
                              <span>Buka</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                /* Normal Explorer View */
                <>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Subfolder di dalam "{currentOpenFolder.name}" ({currentFolderChildren.length}):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Klik <strong>"Buka"</strong> untuk melihat isinya
                    </span>
                  </div>

                  {isLoadingFolderContents ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Membuka folder &amp; memuat subfolder...</span>
                    </div>
                  ) : currentFolderChildren.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
                      <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        Folder "{currentOpenFolder.name}" belum memiliki subfolder.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Anda dapat langsung memilih folder ini sebagai lokasi penyimpanan backup, atau klik <strong>"+ Buat Folder Baru di Sini"</strong> di atas.
                      </p>
                    </div>
                  ) : (
                    currentFolderChildren.map((f) => {
                      const isSelected = selectedFolderForUpload.id === f.id;
                      return (
                        <div
                          key={f.id}
                          className={`p-2.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div 
                            onClick={() => setSelectedFolderForUpload({ 
                              id: f.id, 
                              name: f.name,
                              fullPath: [...navPath.map(p => p.name), f.name].join(' > ')
                            })}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              <Folder className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs truncate block">{f.name}</span>
                              {f.modifiedTime && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  Diubah: {new Date(f.modifiedTime).toLocaleDateString('id-ID')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedFolderForUpload({ 
                                id: f.id, 
                                name: f.name,
                                fullPath: [...navPath.map(p => p.name), f.name].join(' > ')
                              })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isSelected ? 'Terpilih' : 'Pilih'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenFolder(f)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                              title="Buka dan lihat isi folder ini"
                            >
                              <span>Buka</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>

            {/* Checkbox: Save as Default */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-1.5">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Lokasi Simpan Terpilih:
                </span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs font-mono truncate">
                  {selectedFolderForUpload.fullPath || selectedFolderForUpload.name}
                </span>
              </div>

              <label className="flex items-start space-x-2.5 cursor-pointer pt-0.5">
                <input 
                  type="checkbox"
                  checked={setAsDefaultFolder}
                  onChange={(e) => setSetAsDefaultFolder(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Jadikan folder ini sebagai lokasi penyimpanan default
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Pengunggahan berikutnya akan otomatis tersimpan ke folder ini, namun Anda tetap dapat membuka dan mengubahnya kapan saja.
                  </span>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploadingToDrive}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isUploadingToDrive ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah ke Folder Ini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESTORE FROM GOOGLE DRIVE CONFIRMATION */}
      {selectedDriveFile && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedDriveFile(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
                  Konfirmasi Pemulihan Cadangan
                </h4>
                <p className="text-[11px] text-slate-400">
                  Pulihkan database dari Google Drive
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <p className="font-bold text-slate-800 dark:text-white font-mono break-all">
                {selectedDriveFile.name}
              </p>
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <p>Waktu: {selectedDriveFile.createdTime ? new Date(selectedDriveFile.createdTime).toLocaleString('id-ID') : '-'}</p>
                {selectedDriveFile.size && <p>Ukuran: {formatBytes(parseInt(selectedDriveFile.size, 10))}</p>}
              </div>
            </div>

            {/* Mode selection */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                Pilih Mode Pemulihan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDriveRestoreMode('replace')}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                    driveRestoreMode === 'replace'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🔄 Timpa Menyeluruh</span>
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Sama persis berkas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDriveRestoreMode('merge')}
                  className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                    driveRestoreMode === 'merge'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-300 font-bold'
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
                onClick={() => setSelectedDriveFile(null)}
                disabled={isRestoringDrive}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestoreFromDrive}
                disabled={isRestoringDrive}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isRestoringDrive ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memulihkan...</span>
                  </>
                ) : (
                  <span>Ya, Pulihkan Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
