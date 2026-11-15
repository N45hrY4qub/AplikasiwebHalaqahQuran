import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Siswa, Setoran, Halaqah, Guru, TipeModul, StatusAktif, UserRole, isElemenAvailableForHalaqah } from '../types';
import { getGoogleAccessToken, signInWithGoogleWorkspace } from './GoogleWorkspace';
import { SiswaDetailSetoranModal } from './SiswaDetailSetoranModal';
import { 
  renderArabicEnhancedText, 
  toEasternArabicDigits, 
  formatArabicFontClean, 
  getEmbedUrl 
} from './SiswaWorkspace';
import { 
  BookOpen, 
  Filter, 
  Eye, 
  X, 
  Printer, 
  Cloud, 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  History, 
  FileText, 
  Users, 
  ShieldAlert, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';

interface SiswaMutabaahProps {
  subTab?: string;
  setActiveTab?: (tab: string) => void;
  siswaId: string;
  mySiswaObj?: Siswa;
  myHalaqah?: Halaqah;
  myGuruObj?: Guru;
  mySetorans: Setoran[];
  attendanceList: any[];
  attendancePercentage: number;
  hadirCount: number;
  izinCount: number;
  sakitCount: number;
  alphaCount: number;
}

export const SiswaMutabaah: React.FC<SiswaMutabaahProps> = ({
  subTab,
  setActiveTab,
  siswaId,
  mySiswaObj,
  myHalaqah,
  myGuruObj,
  mySetorans,
  attendanceList,
  attendancePercentage,
  hadirCount,
  izinCount,
  sakitCount,
  alphaCount
}) => {
  const {
    moduls,
    elemenSettings,
    murojaahBerpasangans,
    siswas,
    createMurojaahBerpasangan,
    updateMurojaahBerpasangan,
    deleteMurojaahBerpasangan
  } = useApp();

  // Internal tab state: 'riwayat' | 'laporan' | 'murojaah'
  const getInitialTab = (): 'riwayat' | 'laporan' | 'murojaah' => {
    if (subTab === 'siswa_reports') return 'laporan';
    if (subTab === 'siswa_murojaah_berpasangan' || subTab === 'murojaah_berpasangan') return 'murojaah';
    return 'riwayat';
  };

  const [activeTab, setActiveTabState] = useState<'riwayat' | 'laporan' | 'murojaah'>(getInitialTab);

  useEffect(() => {
    if (subTab === 'siswa_reports') setActiveTabState('laporan');
    else if (subTab === 'siswa_murojaah_berpasangan' || subTab === 'murojaah_berpasangan') setActiveTabState('murojaah');
    else if (subTab === 'siswa_riwayat') setActiveTabState('riwayat');
  }, [subTab]);

  // ----------------------------------------------------
  // TAB 1: RIWAYAT SETORAN STATES & FILTERS
  // ----------------------------------------------------
  const [riwayatViewLayout, setRiwayatViewLayout] = useState<'tabel' | 'grid'>('tabel');
  const [historyMonth, setHistoryMonth] = useState('All');
  const [historyModul, setHistoryModul] = useState('All');
  const [historyElemen, setHistoryElemen] = useState('All');
  const [viewingSetoran, setViewingSetoran] = useState<Setoran | null>(null);
  const [selectedSetoranForModal, setSelectedSetoranForModal] = useState<Setoran | null>(null);
  const [studentPreviewPage, setStudentPreviewPage] = useState<number | null>(null);

  const handleCorrectionClick = (s: Setoran) => {
    setSelectedSetoranForModal(s);
    setStudentPreviewPage(s.nonQuranPageAwal || s.halaman || 1);
  };

  const filteredHistory = mySetorans.filter(item => {
    if (historyMonth !== 'All') {
      const monthPart = item.tanggalSetoran.split('-')[1];
      if (monthPart !== historyMonth) return false;
    }
    if (historyModul !== 'All' && item.modulId !== historyModul) {
      return false;
    }
    if (historyElemen !== 'All' && item.jenisSetoran !== historyElemen) {
      return false;
    }
    return true;
  });

  // ----------------------------------------------------
  // TAB 2: LAPORAN & GOOGLE DRIVE STATES
  // ----------------------------------------------------
  const [driveAuthPrompt, setDriveAuthPrompt] = useState<{ fileName: string, type: 'PDF' | 'Excel' } | null>(null);
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);
  const [driveFolders, setDriveFolders] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<Array<{ id: string, name: string }>>([{ id: 'root', name: 'Drive Saya' }]);
  const [isFetchingFolders, setIsFetchingFolders] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [customFileName, setCustomFileName] = useState('');
  const [driveSaveItem, setDriveSaveItem] = useState<{ blob: Blob, mimeType: string, extension: string, defaultName: string } | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleConnectDriveAndSave = async (fileName: string, type: 'PDF' | 'Excel') => {
    try {
      const token = await signInWithGoogleWorkspace(UserRole.SISWA);
      if (token) {
        setDriveAuthPrompt(null);
        setTimeout(() => {
          saveToGoogleDrive(fileName, type);
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghubungkan Google Drive: ' + err.message);
    }
  };

  const saveToGoogleDrive = async (fileName: string, type: 'PDF' | 'Excel') => {
    const token = getGoogleAccessToken();
    if (!token) {
      setDriveAuthPrompt({ fileName, type });
      return;
    }
    
    setUploadingToDrive(fileName);
    try {
      let fileBlob: Blob;
      const mimeType = 'application/pdf';
      const extension = 'pdf';
      
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(5, 150, 105);
      doc.setFont('Helvetica', 'bold');
      doc.text('LAPORAN AKADEMIK BIMBINGAN', 14, 20);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('Helvetica', 'normal');
      doc.text(`PESERTA HALAQAH ${(myHalaqah?.namaHalaqah || '[NAMA HALAQAH]').toUpperCase()}`, 14, 25);
      
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(1);
      doc.line(14, 28, 196, 28);
      
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 34, 182, 32, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(14, 34, 182, 32, 'D');
      
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.setFont('Helvetica', 'bold');
      doc.text('DETAIL PERKEMBANGAN SANTRI', 18, 40);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Nama Lengkap: ${mySiswaObj?.namaLengkap || '-'}`, 18, 46);
      doc.text(`Nomor Induk Santri (NIS): ${mySiswaObj?.nis || '-'}`, 18, 52);
      doc.text(`Kelas: ${mySiswaObj?.kelasNama || '-'}`, 18, 58);
      
      doc.text(`Kelompok Halaqah: ${myHalaqah?.namaHalaqah || '-'}`, 110, 46);
      doc.text(`Ustadz Pembina: ${myHalaqah?.guruPembimbingNama || '-'}`, 110, 52);
      doc.text(`Rerata Kehadiran: ${attendancePercentage || '0'}%`, 110, 58);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('1. REKAPITULASI CAPAIAN SETORAN', 14, 76);
      
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 82, 182, 8, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('Tanggal', 16, 87);
      doc.text('Materi / Surat', 40, 87);
      doc.text('Elemen', 90, 87);
      doc.text('Evaluasi Guru', 115, 87);
      doc.text('Nilai', 170, 87);
      doc.text('Status', 184, 87);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      let y = 96;
      mySetorans.forEach((s) => {
        doc.text(s.tanggalSetoran || '-', 16, y);
        const matName = `${s.modulNama || ''} ${s.suratNama ? `(${s.suratNama})` : ''}`;
        doc.text(matName.length > 28 ? matName.substring(0, 26) + '..' : matName, 40, y);
        doc.text(s.jenisSetoran || '-', 90, y);
        const cat = s.catatanGuru || '-';
        doc.text(cat.length > 30 ? cat.substring(0, 28) + '..' : cat, 115, y);
        doc.text(s.nilai || '-', 170, y);
        doc.text(s.statusLulus ? 'LULUS' : 'REMEDI', 184, y);
        
        y += 8;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });

      fileBlob = doc.output('blob');

      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      setCustomFileName(`${fileName}_${new Date().toISOString().slice(0, 10)}`);
      setDriveSaveItem({
        blob: fileBlob,
        mimeType: mimeType,
        extension: extension,
        defaultName: fileName
      });

      setIsFetchingFolders(true);
      const q = `'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=100&orderBy=name`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDriveFolders(data.files || []);
      }
      setIsFetchingFolders(false);
    } catch (err: any) {
      console.error(err);
      alert('Kesalahan saat menyiapkan file: ' + err.message);
    } finally {
      setUploadingToDrive(null);
    }
  };

  const handleNavigateDriveFolder = async (folderId: string, folderName?: string) => {
    const token = getGoogleAccessToken();
    if (!token) return;

    setIsFetchingFolders(true);
    try {
      const q = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=100&orderBy=name`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDriveFolders(data.files || []);
        setCurrentFolderId(folderId);

        if (folderName) {
          const existingIdx = folderPath.findIndex(p => p.id === folderId);
          if (existingIdx !== -1) {
            setFolderPath(folderPath.slice(0, existingIdx + 1));
          } else {
            setFolderPath([...folderPath, { id: folderId, name: folderName }]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingFolders(false);
    }
  };

  const handleCreateDriveFolder = async () => {
    if (!newFolderName.trim()) return;
    const token = getGoogleAccessToken();
    if (!token) return;

    setIsCreatingFolder(true);
    try {
      const metadata = {
        name: newFolderName.trim(),
        mimeType: 'application/vnd.google-apps.folder',
        parents: [currentFolderId]
      };
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });
      if (res.ok) {
        const created = await res.json();
        setDriveFolders(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setNewFolderName('');
        setShowNewFolderInput(false);
      }
    } catch (err: any) {
      alert('Gagal membuat folder: ' + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleExecuteSaveToDrive = async () => {
    if (!driveSaveItem) return;
    const token = getGoogleAccessToken();
    if (!token) return;

    try {
      setUploadingToDrive(driveSaveItem.defaultName);
      const metadata = {
        name: `${customFileName || driveSaveItem.defaultName}.${driveSaveItem.extension}`,
        parents: [currentFolderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', driveSaveItem.blob);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });

      if (res.ok) {
        alert('File berhasil disimpan ke Google Drive Anda!');
        setDriveSaveItem(null);
      } else {
        const errorData = await res.json();
        alert('Gagal mengunggah file ke Google Drive: ' + (errorData.error?.message || 'Error tidak diketahui'));
      }
    } catch (err: any) {
      alert('Kesalahan saat mengunggah: ' + err.message);
    } finally {
      setUploadingToDrive(null);
    }
  };

  // ----------------------------------------------------
  // TAB 3: MUROJAAH BERPASANGAN STATES
  // ----------------------------------------------------
  const [stuMurDate, setStuMurDate] = useState(new Date().toISOString().split('T')[0]);
  const [stuMurPasanganId, setStuMurPasanganId] = useState('');
  const [stuMurPasanganCustomNama, setStuMurPasanganCustomNama] = useState('');
  const [stuMurJenis, setStuMurJenis] = useState('Murojaah Hafalan');
  const [stuMurSuratAwal, setStuMurSuratAwal] = useState('');
  const [stuMurSuratAkhir, setStuMurSuratAkhir] = useState('');
  const [stuMurAyatAwal, setStuMurAyatAwal] = useState('');
  const [stuMurAyatAkhir, setStuMurAyatAkhir] = useState('');
  const [stuMurCatatan, setStuMurCatatan] = useState('');
  const [stuMurSearch, setStuMurSearch] = useState('');
  const [stuMurDateFilter, setStuMurDateFilter] = useState('');

  return (
    <div className="space-y-6">
      
      {/* Header with Navigation Pills */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            <span>Mutabaah Santri</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Pusat pemantauan evaluasi setoran, rekapitulasi perkembangan akademik, dan murojaah berpasangan
          </p>
        </div>

        {/* Unified Subtab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl select-none shrink-0 self-start md:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTabState('riwayat');
              if (setActiveTab) setActiveTab('siswa_mutabaah');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'riwayat'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Riwayat Setoran</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              {mySetorans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabState('laporan');
              if (setActiveTab) setActiveTab('siswa_mutabaah');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'laporan'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Laporan Perkembangan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabState('murojaah');
              if (setActiveTab) setActiveTab('siswa_mutabaah');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'murojaah'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Murojaah Berpasangan</span>
          </button>
        </div>
      </div>

      {/* ====================================================
          TAB 1: RIWAYAT SETORAN
          ==================================================== */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b dark:border-slate-800/80 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daftar Riwayat Setoran & Evaluasi</h3>
              <p className="text-xs text-slate-400">Semua entri setoran hafalan &amp; pelajaran yang telah dievaluasi oleh Ustadz</p>
            </div>
            
            {/* View Layout Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl self-start sm:self-auto shadow-inner select-none">
              <button 
                type="button"
                onClick={() => setRiwayatViewLayout('tabel')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  riwayatViewLayout === 'tabel' 
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs' 
                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200'
                }`}
                title="Tampilkan data dalam bentuk Tabel Komparatif"
              >
                <span>📋</span>
                <span>Tabel</span>
              </button>
              <button 
                type="button"
                onClick={() => setRiwayatViewLayout('grid')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  riwayatViewLayout === 'grid' 
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs' 
                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200'
                }`}
                title="Tampilkan data dalam bentuk Card / Grid"
              >
                <span>📦</span>
                <span>Grid</span>
              </button>
            </div>
          </div>

          {/* Filtering row */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Filter data:</span>
            </div>

            <select 
              value={historyMonth} 
              onChange={(e) => setHistoryMonth(e.target.value)}
              className="p-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="All">Semua Bulan</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select 
              value={historyModul} 
              onChange={(e) => setHistoryModul(e.target.value)}
              className="p-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold max-w-[180px]"
            >
              <option value="All">Semua Modul</option>
              {moduls.map(m => (
                <option key={m.id} value={m.id}>{m.judulModul || m.namaSurat}</option>
              ))}
            </select>

            <select 
              value={historyElemen} 
              onChange={(e) => setHistoryElemen(e.target.value)}
              className="p-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="All">Semua Elemen</option>
              {(elemenSettings || [])
                .filter(ele => isElemenAvailableForHalaqah(ele, myHalaqah))
                .map(ele => (
                  <option key={ele.id} value={ele.nama}>{ele.nama}</option>
                ))}
            </select>
          </div>

          {/* Table or Grid */}
          {riwayatViewLayout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHistory.map((s, idx) => (
                <div 
                  key={s.id || idx} 
                  className={`bg-white dark:bg-slate-950 rounded-2xl border ${
                    s.statusLulus 
                      ? 'border-emerald-100 dark:border-emerald-950/40 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800' 
                      : 'border-rose-100 dark:border-rose-950/40 shadow-xs hover:border-rose-300 dark:hover:border-rose-800'
                  } p-5 flex flex-col justify-between transition duration-200 hover:shadow-md relative overflow-hidden`}
                >
                  <div className="absolute top-4 right-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold shadow-2xs border ${
                      s.statusLulus 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50' 
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border-rose-200/50'
                    }`}>
                      {s.statusLulus ? 'LULUS' : 'MENGULANG'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase tracking-wider mb-2">
                      <span>{s.tanggalSetoran}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-450">{s.jenisSetoran || 'Tahfidz'}</span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight mb-1">
                      {s.modulNama}
                    </h3>
                    
                    {s.suratNama && (
                      <p className="text-xs text-slate-450 mb-2">
                        Surah {s.suratNama}
                      </p>
                    )}

                    <div className="inline-block bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-4 font-mono">
                      {s.suratNama ? (
                        <span>Ayat {s.ayatAwal} s/d {s.ayatAkhir}</span>
                      ) : (
                        <span>{s.catatanModulLain || 'Evaluasi Sesi'}</span>
                      )}
                    </div>

                    {/* Catatan Ustadz */}
                    <div className="border-t border-slate-100 dark:border-slate-850/80 pt-3.5 mt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#c5a880] dark:text-amber-500/80 mb-1.5 flex items-center space-x-1">
                        <span>💬</span>
                        <span>Catatan Ustadz</span>
                      </p>
                      
                      <div 
                        onClick={() => {
                          const hasModul = s.modulId || (s.daftarSuratSetoran && s.daftarSuratSetoran[0]?.modulId);
                          if (hasModul) handleCorrectionClick(s);
                        }}
                        className={`text-xs p-3 rounded-xl italic leading-relaxed transition ${
                          (s.modulId || (s.daftarSuratSetoran && s.daftarSuratSetoran[0]?.modulId))
                            ? 'bg-emerald-55/40 dark:bg-emerald-950/15 text-slate-700 dark:text-slate-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/30 cursor-pointer hover:text-emerald-850 dark:hover:text-emerald-300 border border-transparent hover:border-emerald-250/30 group' 
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-500/80'
                        }`}
                        title={(s.modulId || (s.daftarSuratSetoran && s.daftarSuratSetoran[0]?.modulId)) ? "Klik catatan ini untuk langsung membuka & mempelajari ayat/halaman yang dikoreksi ini!" : undefined}
                      >
                        <span className="block whitespace-pre-wrap">{s.catatanGuru ? <>"{renderArabicEnhancedText(s.catatanGuru)}"</> : '"Bagus / Pertahankan kemajuannya!"'}</span>
                        {(s.modulId || (s.daftarSuratSetoran && s.daftarSuratSetoran[0]?.modulId)) && (
                          <div className="mt-2 text-[9.5px] text-emerald-700 dark:text-emerald-400 font-sans font-extrabold tracking-wider flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <span>🔍 BUKA LETAK KOREKSI</span>
                            <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Card */}
                  <div className="border-t border-slate-100 dark:border-slate-850/80 pt-3 mt-4 flex items-center justify-between select-none font-medium">
                    <button
                      type="button"
                      onClick={() => setViewingSetoran(s)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-450 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/40 rounded-lg text-[10.5px] font-bold cursor-pointer transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian Lengkap</span>
                    </button>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10.5px] font-semibold text-slate-400">Nilai:</span>
                      <span className="font-mono font-black text-sm text-emerald-650 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-100/20">{s.nilai}</span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredHistory.length === 0 && (
                <div className="col-span-full bg-white dark:bg-slate-950/35 p-16 rounded-2xl text-center border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 italic">
                  Tidak ditemukan entri riwayat setoran yang cocok dengan filter Anda.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b dark:border-slate-800">
                      <th className="p-4">Tanggal Setoran</th>
                      <th className="p-4">Jenis &amp; Elemen</th>
                      <th className="p-4">Target / Unit</th>
                      <th className="p-4">Keterangan / Detil</th>
                      <th className="p-4">Catatan Ustadz (Klik Koreksi)</th>
                      <th className="p-4">Nilai</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-900 font-medium">
                    {filteredHistory.map((s, idx) => {
                      const hasModul = s.modulId || (s.daftarSuratSetoran && s.daftarSuratSetoran[0]?.modulId);
                      return (
                        <tr key={s.id || idx} className="text-slate-700 dark:text-slate-350 hover:bg-slate-50/40 dark:hover:bg-slate-900/30">
                          <td className="p-4 font-mono font-bold text-slate-500">{s.tanggalSetoran}</td>
                          <td className="p-4">
                            <span className="font-bold text-slate-900 dark:text-white block">{s.jenisSetoran || 'Tahfidz'}</span>
                            {s.tipeTahfidz && <span className="text-[10.5px] text-slate-405 font-normal">{s.tipeTahfidz}</span>}
                          </td>
                          <td className="p-4">
                            <span className="font-bold block">{s.modulNama}</span>
                            {s.suratNama && <span className="text-[10px] text-slate-405 font-normal">{s.suratNama}</span>}
                          </td>
                          <td className="p-4">
                            {s.suratNama ? (
                              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">Ayat {s.ayatAwal} s/d {s.ayatAkhir}</span>
                            ) : (
                              <span className="text-slate-400">{s.catatanModulLain || 'Lainnya'}</span>
                            )}
                          </td>
                          <td 
                            onClick={() => {
                              if (hasModul) handleCorrectionClick(s);
                            }}
                            className={`p-4 text-slate-655 dark:text-slate-300 italic font-medium transition ${
                              hasModul 
                                ? 'cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-slate-900/40 hover:text-emerald-750 dark:hover:text-emerald-400 group/catatan'
                                : ''
                            }`}
                            title={hasModul ? "Klik catatan ini untuk langsung membuka & mempelajari ayat/halaman yang dikoreksi ini!" : undefined}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="block whitespace-pre-wrap break-words leading-relaxed text-slate-700 dark:text-slate-300">
                                {s.catatanGuru ? <>"{renderArabicEnhancedText(s.catatanGuru)}"</> : '"Bagus / Pertahankan!"'}
                              </span>
                              {hasModul && (
                                <span className="shrink-0 inline-flex items-center space-x-1 text-[9px] bg-emerald-550/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-450 px-2 py-0.5 rounded-md font-sans font-extrabold tracking-wider border border-emerald-500/20 opacity-90 sm:opacity-0 group-hover/catatan:opacity-100 transition-opacity whitespace-nowrap shadow-2xs">
                                  <span>🔍 KOREKSI</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-bold font-mono text-emerald-650">{s.nilai}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${s.statusLulus ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-200' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 border border-rose-200'}`}>
                              {s.statusLulus ? 'LULUS' : 'MENGULANG'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingSetoran(s)}
                              className="p-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold transition cursor-pointer"
                              title="Lihat Rincian Lengkap Setoran"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400 italic">
                          Tidak ditemukan entri riwayat setoran yang cocok dengan filter Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          TAB 2: LAPORAN PERKEMBANGAN
          ==================================================== */}
      {activeTab === 'laporan' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laporan Perkembangan Santri Mandiri</h3>
              <p className="text-xs text-slate-400">Cetak atau simpan kemajuan rekap setoran mutabaah dan absensi santri asuhan</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePrint}
                className="p-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Cetak / Unduh PDF</span>
              </button>
              
              <button 
                onClick={() => saveToGoogleDrive('Laporan_Akademik_Santri', 'PDF')}
                disabled={!!uploadingToDrive}
                className="p-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Cloud className="w-4 h-4 text-white" />
                <span>{uploadingToDrive === 'Laporan_Akademik_Santri' ? 'Menyimpan...' : 'Simpan ke Google Drive'}</span>
              </button>
            </div>
          </div>

          {/* MAIN DOCUMENT WRAPPER FOR PRINT PREVIEW */}
          <div id="mh-report-print-document" className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm space-y-6 print:p-0 print:border-none">
            
            {/* Print Header */}
            <div className="text-center border-b pb-5">
              <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">LAPORAN AKADEMIK BIMBINGAN</h1>
              <p className="text-xs text-slate-400 font-mono tracking-wider uppercase mt-1">PESERTA HALAQAH {myHalaqah?.namaHalaqah?.toUpperCase() || '[NAMA HALAQAH]'}</p>
              <div className="mt-2.5 h-1 w-24 bg-emerald-600 mx-auto rounded" />
            </div>

            {/* Print Bio detail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border">
                <p><strong>NAMA LENGKAP:</strong> {mySiswaObj?.namaLengkap}</p>
                <p><strong>NOMOR INDUK SANTRI (NIS):</strong> {mySiswaObj?.nis}</p>
                <p><strong>KELAS:</strong> {mySiswaObj?.kelasNama}</p>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border">
                <p><strong>KELOMPOK HALAQAH:</strong> {myHalaqah?.namaHalaqah}</p>
                <p><strong>USTADZ PEMBINA:</strong> {myHalaqah?.guruPembimbingNama || myGuruObj?.namaLengkap || '-'}</p>
                <p><strong>RERATA TINGKAT KEHADIRAN:</strong> {attendancePercentage}%</p>
              </div>
            </div>

            {/* Summary 1: Setoran Summary */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-805 dark:text-white border-b pb-2">1. REKAPITULASI CAPAIAN SETORAN</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-[11px] text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-450 font-bold border-b">
                      <th className="p-2.5">Tanggal</th>
                      <th className="p-2.5">Materi Modul / Surat</th>
                      <th className="p-2.5">Elemen</th>
                      <th className="p-2.5">Catatan Evaluasi Guru</th>
                      <th className="p-2.5">Nilai</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    {mySetorans.map((s, idx) => (
                      <tr key={idx} className="text-slate-700 dark:text-slate-300 font-medium">
                        <td className="p-2.5 font-mono">{s.tanggalSetoran}</td>
                        <td className="p-2.5 font-bold">{s.modulNama} {s.suratNama ? `(${s.suratNama})` : ''}</td>
                        <td className="p-2.5">{s.jenisSetoran}</td>
                        <td className="p-2.5 italic whitespace-pre-wrap">{s.catatanGuru ? <>"{renderArabicEnhancedText(s.catatanGuru)}"</> : '""'}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-650">{s.nilai}</td>
                        <td className="p-2.5 text-center font-bold text-[10px]">
                          {s.statusLulus ? 'LULUS' : 'REMEDI'}
                        </td>
                      </tr>
                    ))}
                    {mySetorans.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">Belum ada riwayat setoran terdokumentasi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary 2: Attendance Summary */}
            <div className="space-y-3 pt-4 border-t border-dashed">
              <h3 className="font-extrabold text-sm text-slate-805 dark:text-white border-b pb-2">2. REKAPITULASI KEHADIRAN HALAQAH</h3>
              
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-emerald-50 dark:bg-slate-900/40 rounded-xl border">
                  <span className="text-xl font-bold text-emerald-800 dark:text-emerald-450 block font-mono">{hadirCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Hadir</span>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-slate-900/40 rounded-xl border">
                  <span className="text-xl font-bold text-indigo-805 dark:text-indigo-400 block font-mono">{izinCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Izin</span>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-slate-900/40 rounded-xl border">
                  <span className="text-xl font-bold text-amber-550 block font-mono">{sakitCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Sakit</span>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-slate-900/40 rounded-xl border">
                  <span className="text-xl font-bold text-rose-600 block font-mono">{alphaCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Alpha</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================
          TAB 3: MUROJAAH BERPASANGAN
          ==================================================== */}
      {activeTab === 'murojaah' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden transition-all">
            <h3 className="text-xl font-bold tracking-tight">Murojaah Berpasangan</h3>
            <p className="text-xs text-purple-100 mt-1">Laporkan kegiatan murojaah Anda dengan rekan halaqah atau konfirmasi laporan yang diberikan rekan Anda.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Input */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                <span>➕</span>
                <span>Laporkan Murojaah</span>
              </h4>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!stuMurPasanganId) {
                  alert('Pilih pasangan murojaah Anda terlebih dahulu!');
                  return;
                }

                if (!mySiswaObj) {
                  alert('Data diri Anda tidak valid!');
                  return;
                }

                let finalPasanganNama = '';
                let defaultStatusPasangan: 'Belum Dikonfirmasi' | 'Dikonfirmasi' = 'Belum Dikonfirmasi';

                if (stuMurPasanganId === 'guru') {
                  finalPasanganNama = 'Guru';
                  defaultStatusPasangan = 'Dikonfirmasi';
                } else if (stuMurPasanganId === 'orangtua') {
                  finalPasanganNama = 'Orangtua';
                  defaultStatusPasangan = 'Dikonfirmasi';
                } else if (stuMurPasanganId === 'custom') {
                  if (!stuMurPasanganCustomNama.trim()) {
                    alert('Nama pasangan murojaah harus diisi!');
                    return;
                  }
                  finalPasanganNama = stuMurPasanganCustomNama.trim();
                  defaultStatusPasangan = 'Dikonfirmasi';
                } else {
                  const partner = (siswas || []).find(s => s.id === stuMurPasanganId);
                  if (!partner) {
                    alert('Data pasangan tidak ditemukan!');
                    return;
                  }
                  finalPasanganNama = partner.namaLengkap;
                }

                const payload = {
                  tanggal: stuMurDate,
                  siswaId: mySiswaObj.id,
                  siswaNama: mySiswaObj.namaLengkap,
                  halaqahId: mySiswaObj.halaqahId,
                  halaqahNama: myHalaqah?.namaHalaqah || '',
                  pasanganId: stuMurPasanganId,
                  pasanganNama: finalPasanganNama,
                  jenisMurojaah: stuMurJenis,
                  suratAwal: stuMurSuratAwal,
                  suratAkhir: stuMurSuratAkhir,
                  ayatAwal: stuMurAyatAwal,
                  ayatAkhir: stuMurAyatAkhir,
                  catatan: stuMurCatatan,
                  statusVerifikasi: 'Belum Diverifikasi' as const,
                  statusPasangan: defaultStatusPasangan,
                };

                createMurojaahBerpasangan(payload);

                if (['guru', 'orangtua', 'custom'].includes(stuMurPasanganId)) {
                  alert(`Laporan murojaah berpasangan dengan ${finalPasanganNama} berhasil disimpan!`);
                } else {
                  alert(`Laporan berhasil dikirim! Silakan minta ${finalPasanganNama} untuk membuka akunnya dan melakukan konfirmasi.`);
                }
                
                setStuMurPasanganId('');
                setStuMurPasanganCustomNama('');
                setStuMurSuratAwal('');
                setStuMurSuratAkhir('');
                setStuMurAyatAwal('');
                setStuMurAyatAkhir('');
                setStuMurCatatan('');
              }} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={stuMurDate}
                    onChange={(e) => setStuMurDate(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Pasangan Murojaah</label>
                  <select
                    required
                    value={stuMurPasanganId}
                    onChange={(e) => {
                      setStuMurPasanganId(e.target.value);
                      if (e.target.value !== 'custom') {
                        setStuMurPasanganCustomNama('');
                      }
                    }}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">-- Hubungkan Pasangan --</option>
                    <optgroup label="Teman Halaqah">
                      {(siswas || [])
                        .filter(s => s.halaqahId === mySiswaObj?.halaqahId && s.id !== mySiswaObj?.id && s.status === StatusAktif.AKTIF)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.namaLengkap}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Lainnya">
                      <option value="guru">Guru</option>
                      <option value="orangtua">Orangtua</option>
                      <option value="custom">Tidak ada dalam daftar</option>
                    </optgroup>
                  </select>
                </div>

                {stuMurPasanganId === 'custom' && (
                  <div className="animate-fade-in">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Pasangan Murojaah</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama pasangan..."
                      value={stuMurPasanganCustomNama}
                      onChange={(e) => setStuMurPasanganCustomNama(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jenis Murojaah</label>
                  <select
                    required
                    value={stuMurJenis}
                    onChange={(e) => setStuMurJenis(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Murojaah Hafalan">Murojaah Hafalan</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest font-mono">Kemajuan Surat &amp; Ayat</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Surat Awal</label>
                      <input
                        type="text"
                        placeholder="Misal: An-Naba"
                        value={stuMurSuratAwal}
                        onChange={(e) => setStuMurSuratAwal(e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ayat Awal</label>
                      <input
                        type="text"
                        placeholder="Misal: 1"
                        value={stuMurAyatAwal}
                        onChange={(e) => setStuMurAyatAwal(e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Surat Akhir</label>
                      <input
                        type="text"
                        placeholder="Misal: An-Naba"
                        value={stuMurSuratAkhir}
                        onChange={(e) => setStuMurSuratAkhir(e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ayat Akhir</label>
                      <input
                        type="text"
                        placeholder="Misal: 40"
                        value={stuMurAyatAkhir}
                        onChange={(e) => setStuMurAyatAkhir(e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Catatan Tambahan</label>
                  <textarea
                    placeholder="Beri detail kepada pasangan atau ustadz..."
                    value={stuMurCatatan}
                    onChange={(e) => setStuMurCatatan(e.target.value)}
                    className="w-full p-2 h-16 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full p-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  Kirim Lapor Murojaah
                </button>
              </form>
            </div>

            {/* List Murojaah & Pending Actions list */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                <span>🔄</span>
                <span>Alur Historis &amp; Persetujuan Mitra</span>
              </h4>

              {/* Advanced search bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cari Ayat/Surat</label>
                  <input
                    type="text"
                    placeholder="Contoh: An-Naba..."
                    value={stuMurSearch}
                    onChange={(e) => setStuMurSearch(e.target.value)}
                    className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Filter Tanggal</label>
                  <input
                    type="date"
                    value={stuMurDateFilter}
                    onChange={(e) => setStuMurDateFilter(e.target.value)}
                    className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Map list */}
              {(() => {
                const logs = (murojaahBerpasangans || [])
                  .filter(m => {
                    const isRelated = m.siswaId === siswaId || m.pasanganId === siswaId;
                    if (!isRelated) return false;

                    if (stuMurSearch) {
                      const q = stuMurSearch.toLowerCase();
                      const matchSurat = (m.suratAwal || '').toLowerCase().includes(q) || (m.suratAkhir || '').toLowerCase().includes(q);
                      const matchNama = m.siswaNama.toLowerCase().includes(q) || m.pasanganNama.toLowerCase().includes(q);
                      if (!matchSurat && !matchNama) return false;
                    }

                    if (stuMurDateFilter && m.tanggal !== stuMurDateFilter) return false;
                    return true;
                  })
                  .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

                if (logs.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium font-sans">
                      Belum ada history murojaah berpasangan yang dilaporkan.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3.5">
                    {logs.map(m => {
                      const isMeReader = m.siswaId === siswaId;
                      const isPendingMyConfirm = m.pasanganId === siswaId && m.statusPasangan === 'Belum Dikonfirmasi';
                      
                      const capaianText = [
                        m.suratAwal ? `QS. ${m.suratAwal}` : '',
                        m.ayatAwal ? `Ayat ${m.ayatAwal}` : '',
                        m.suratAkhir ? `s.d ${m.suratAwal === m.suratAkhir ? '' : 'QS. '}${m.suratAkhir}` : '',
                        m.ayatAkhir ? `Ayat ${m.ayatAkhir}` : '',
                      ].filter(Boolean).join(' ');

                      return (
                        <div key={m.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase block">
                                📅 {m.tanggal}
                              </span>
                              <div className="flex items-center space-x-1.5 mt-1">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                  isMeReader 
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450'
                                }`}>
                                  {isMeReader ? 'Saya Membaca' : 'Saya Menyimak'}
                                </span>
                                <span className="text-slate-300 dark:text-slate-700 font-mono">|</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                                  Mitra: {isMeReader ? m.pasanganNama : m.siswaNama}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end space-y-1">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                m.statusPasangan === 'Dikonfirmasi'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-445'
                                  : m.statusPasangan === 'Ditolak'
                                    ? 'bg-red-500/10 text-red-600'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-445'
                              }`}>
                                Mitra: {m.statusPasangan}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                m.statusVerifikasi === 'Disetujui'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-445'
                                  : m.statusVerifikasi === 'Perlu Perbaikan'
                                    ? 'bg-red-500/10 text-red-600'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-445'
                              }`}>
                                Ustadz: {m.statusVerifikasi}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                            <span className="inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                              {m.jenisMurojaah}
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 break-words">{capaianText || 'Tidak ada capaian tercatat'}</p>
                            {m.catatan && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100/60 dark:border-slate-800/60 break-words whitespace-pre-wrap">
                                "{renderArabicEnhancedText(m.catatan)}"
                              </div>
                            )}
                            {m.catatanGuru && (
                              <div className="mt-1.5 p-2 border border-amber-500/20 bg-amber-500/10 rounded-lg text-[10.5px] text-amber-700 dark:text-amber-400 font-sans whitespace-pre-wrap leading-relaxed break-words">
                                <strong className="text-amber-800 dark:text-amber-300">Koreksi Ustadz:</strong> {renderArabicEnhancedText(m.catatanGuru)}
                              </div>
                            )}
                          </div>

                          {isPendingMyConfirm && (
                            <div className="flex items-center space-x-2 pt-1 border-t border-dashed border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] font-semibold text-[#a855f7] animate-pulse">Konfirmasi murojaah?</span>
                              <div className="flex items-center space-x-1.5 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateMurojaahBerpasangan(m.id, { statusPasangan: 'Dikonfirmasi' });
                                    alert('Anda telah menyetujui/mengonfirmasi laporan murojaah dari mitra Anda!');
                                  }}
                                  className="p-1 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[9px] rounded-lg cursor-pointer"
                                >
                                  Terima
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Yakin ingin menolak laporan ini?')) {
                                      updateMurojaahBerpasangan(m.id, { statusPasangan: 'Ditolak' });
                                      alert('Anda menolak konfirmasi Murojaah Berpasangan ini.');
                                    }
                                  }}
                                  className="p-1 px-3 bg-[#ffe4e6] text-rose-600 border border-slate-200 dark:border-slate-800 hover:bg-rose-500/10 font-bold uppercase tracking-wider text-[9px] rounded-lg cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </div>
                            </div>
                          )}

                          {isMeReader && m.statusVerifikasi !== 'Disetujui' && (
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Yakin ingin menarik/menghapus laporan murojaah berpasangan Anda?')) {
                                    deleteMurojaahBerpasangan(m.id);
                                    alert('Laporan Anda berhasil dibatalkan/dihapus.');
                                  }
                                }}
                                className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                              >
                                Tarik Laporan Murojaah
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: RINCIAN LENGKAP SETORAN
          ==================================================== */}
      <SiswaDetailSetoranModal
        viewingSetoran={viewingSetoran}
        onClose={() => setViewingSetoran(null)}
      />

      {/* ====================================================
          MODAL: PRATINJAU KOREKSI PER AYAT / KATA (FLOATING DIALOG)
          ==================================================== */}
      {selectedSetoranForModal && (() => {
        const s = selectedSetoranForModal;
        const targetModul = moduls.find(m => m.id === s.modulId);
        
        return (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-start justify-center p-4 overflow-y-auto animate-fade-in"
            onClick={() => setSelectedSetoranForModal(null)}
          >
            <div 
              className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-150 dark:border-slate-850 flex flex-col max-h-[85vh] relative overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-850/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c5a880] dark:text-amber-500/80 block mb-0.5">
                    Pratinjau Koreksi Setoran
                  </span>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                    {s.modulNama}
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedSetoranForModal(null)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 select-text">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-150/80 dark:border-slate-850/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Hari / Tanggal</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-bold">{s.tanggalSetoran}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Jenis Kegiatan</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-bold">{s.jenisSetoran || 'Tahfidz'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Nilai Kelulusan</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-amber-500 text-[11px]">⭐️</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-bold font-mono text-xs">{s.nilai}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Status Hasil</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-extrabold border ${
                      s.statusLulus 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-450' 
                        : 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-450'
                    }`}>
                      {s.statusLulus ? 'LULUS' : 'MENGULANG'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-250/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#c5a880] dark:text-amber-500/80 flex items-center space-x-1">
                    <span>💬</span>
                    <span>Catatan Evaluasi Guru / Ustadz</span>
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed whitespace-pre-wrap">
                    {s.catatanGuru ? <>"{renderArabicEnhancedText(s.catatanGuru)}"</> : '"Bagus / Pertahankan!"'}
                  </p>
                </div>

                {/* Core correction target */}
                <div className="border-t border-slate-100 dark:border-slate-850 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block mb-3">
                    🎯 Potongan Materi yang Dikoreksi
                  </span>

                  {!targetModul ? (
                    <div className="text-center py-6 text-slate-450 dark:text-slate-500 text-xs bg-slate-50 dark:bg-slate-900 border border-dashed rounded-xl">
                      Penjelasan naskah materi lengkap tidak tersedia secara offline atau modul belum didaftarkan di sistem.
                    </div>
                  ) : targetModul.tipe === TipeModul.AL_QURAN ? (() => {
                    const start = s.ayatAwal || 1;
                    const end = s.ayatAkhir || 1;
                    const filteredAyat = targetModul.isiAyat?.filter(
                      a => a.nomorAyat >= start && a.nomorAyat <= end
                    ) || [];

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border dark:border-slate-800">
                          <span>Surah {targetModul.namaSurat}</span>
                          <span className="font-mono">Ayat {start} s/d {end}</span>
                        </div>

                        <div 
                          className="text-right p-6 rounded-2xl font-serif border border-[#eae2cc] dark:border-slate-800 select-text bg-[#faf6eb] dark:bg-[#0b1329]"
                          dir="rtl"
                        >
                          {targetModul.nomorUrutSurat !== 1 && targetModul.nomorUrutSurat !== 9 && start <= 1 && (
                            <p className="font-mushaf font-serif text-2xl font-normal leading-normal mb-6 text-center text-[#2c2415] dark:text-slate-100">
                              {formatArabicFontClean('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')}
                            </p>
                          )}

                          <div className="text-justify leading-[2.2] whitespace-normal break-words w-full" style={{ textAlignLast: 'center' }}>
                            {filteredAyat.map((ayat, ayIdx) => {
                              const cleanedText = formatArabicFontClean(ayat.teksArab);
                              const rawWords = cleanedText.split(/\s+/).filter(Boolean);
                              const words: string[] = [];
                              for (const rw of rawWords) {
                                if (/^[\u06D6-\u06DC\u06DF-\u06E8\u08D4-\u08EA\u0610-\u061A]+$/.test(rw) && words.length > 0) {
                                  words[words.length - 1] = `${words[words.length - 1]} ${rw}`;
                                } else {
                                  words.push(rw);
                                }
                              }
                              return (
                                <span key={ayIdx} className="inline select-text">
                                  <span className="font-mushaf font-serif text-2.5xl leading-loose select-text text-[#2c2415] dark:text-slate-100 align-middle">
                                    {words.map((word, wordIdx) => {
                                      const wordKey = `quran-${targetModul.id}-${ayat.nomorAyat}-${wordIdx}`;
                                      const wordKeyAlternative = `quran-default-${ayat.nomorAyat}-${wordIdx}`;
                                      const matchingComment = s.interactiveComments?.find(
                                        c => c.targetKey === wordKey || c.targetKey === wordKeyAlternative || c.targetKeys?.includes(wordKey) || c.targetKeys?.includes(wordKeyAlternative)
                                      );

                                      if (matchingComment) {
                                        return (
                                          <span 
                                            key={wordIdx}
                                            className="font-mushaf font-serif inline-block rounded-lg mx-[2px] px-[4px] py-0.5 select-text align-middle bg-yellow-200 text-yellow-950 dark:bg-amber-955 dark:text-yellow-250 ring-2 ring-yellow-450 font-bold scale-[1.02] shadow-xs relative group cursor-help transition-all duration-150"
                                            title={`Koreksi: ${matchingComment.comment}`}
                                          >
                                            {word}
                                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg text-center font-sans z-50 font-normal normal-case leading-snug">
                                              {matchingComment.comment}
                                            </span>
                                          </span>
                                        );
                                      }

                                      return (
                                        <span 
                                          key={wordIdx} 
                                          className="inline-block mx-[2px] px-[2px] select-text font-normal text-[#2c2415] dark:text-slate-100"
                                        >
                                          {word}
                                        </span>
                                      );
                                    })}
                                  </span>
                                  {(() => {
                                    const verseKey = `quran-${targetModul.id}-${ayat.nomorAyat}-verse`;
                                    const verseKeyAlternative = `quran-default-${ayat.nomorAyat}-verse`;
                                    const matchingVerseComment = s.interactiveComments?.find(
                                      c => c.targetKey === verseKey || c.targetKey === verseKeyAlternative || c.targetKeys?.includes(verseKey) || c.targetKeys?.includes(verseKeyAlternative) || (c.target && c.target.toLowerCase().includes(`ayat ${ayat.nomorAyat}`))
                                    );

                                    return (
                                      <span 
                                        className={`inline-flex items-center justify-center select-none font-mushaf font-serif mx-1.5 rounded-full border transition-all w-8 h-8 align-middle text-center shrink-0 shadow-xs relative text-xs ${
                                          matchingVerseComment
                                            ? 'bg-rose-500 text-white border-rose-600 font-extrabold ring-2 ring-rose-300 dark:ring-rose-900 cursor-help'
                                            : 'border-[#c5a880] bg-[#fdfcf7] dark:bg-slate-900 text-slate-800 dark:text-emerald-450 font-bold'
                                        }`}
                                        title={matchingVerseComment ? `Catatan Ayat ${ayat.nomorAyat}: ${matchingVerseComment.comment}` : `Nomor Ayat ${ayat.nomorAyat}`}
                                      >
                                        <span className={`absolute inset-[1px] rounded-full border border-dashed ${matchingVerseComment ? 'border-white/50' : 'border-[#c5a880]/30'}`} />
                                        <span className="relative z-10">{toEasternArabicDigits(ayat.nomorAyat)}</span>
                                      </span>
                                    );
                                  })()}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {s.interactiveComments && s.interactiveComments.length > 0 && (
                          <div className="pt-2 animate-fade-in text-left">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-2">
                              ⚠️ Rincian Koreksi Per Kata ({s.interactiveComments.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                              {s.interactiveComments.map((item, idx) => (
                                <div key={item.id || idx} className="p-2.5 border border-amber-200/40 dark:border-slate-800/80 rounded-xl bg-amber-50/25 dark:bg-slate-900/40 flex items-start space-x-2 text-xs">
                                  <span className="font-mushaf font-serif text-lg text-yellow-950 dark:text-yellow-250 bg-yellow-100 dark:bg-amber-955 px-2 py-0.5 rounded-lg border border-yellow-300/40 shrink-0 select-text leading-tight">{item.target}</span>
                                  <div className="space-y-0.5 min-w-0">
                                    <span className="text-[8px] font-mono font-extrabold text-[#c5a880] dark:text-amber-500/85 uppercase tracking-wider">{item.info}</span>
                                    <p className="text-slate-750 dark:text-slate-350 italic font-medium mt-0.5 leading-snug">"{item.comment}"</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })() : (() => {
                    const jilidIndex = (s.nonQuranJilid || 1) - 1;
                    const startPage = s.nonQuranPageAwal || s.halaman || 1;
                    const endPage = s.nonQuranPageAkhir || s.halaman || 1;
                    const curStudentPage = (studentPreviewPage !== null && studentPreviewPage >= startPage && studentPreviewPage <= endPage) ? studentPreviewPage : startPage;
                    const isTextMode = targetModul.tipeMateri === 'teks';
                    const pageText = isTextMode 
                      ? (targetModul.teksHalamanPerJilid?.[jilidIndex]?.[curStudentPage - 1] || targetModul.teksHalaman?.[curStudentPage - 1])
                      : null;
                    const activeExplanation = targetModul.penjelasanHalamanPerJilid?.[jilidIndex]?.[curStudentPage - 1] || targetModul.penjelasanHalaman?.[curStudentPage - 1];
                    const activeCover = targetModul.isMultiJilid 
                      ? (targetModul.coverModulPerJilid?.[jilidIndex] || targetModul.coverModul)
                      : (targetModul.coverModul || targetModul.coverModulPerJilid?.[0]);

                    return (
                      targetModul.tipeMateri === 'hanya_identitas' ? (
                        <div className="p-5 border border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/5 rounded-2xl space-y-4 text-slate-800 dark:text-slate-100 max-w-xl mx-auto shadow-sm animate-fade-in text-left">
                          <div className="text-center space-y-2">
                            {activeCover ? (
                              <div className="flex justify-center mb-2">
                                <div className="w-24 h-32 rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-800">
                                  <img 
                                    src={activeCover} 
                                    alt="Cover Modul" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex p-3 bg-amber-100/60 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full">
                                <ShieldAlert className="w-8 h-8" />
                              </div>
                            )}
                            <h4 className="font-sans font-bold text-base text-slate-900 dark:text-white leading-snug">
                              {targetModul.judulModul}
                            </h4>
                            <span className="inline-block text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full tracking-wider font-mono">
                              Modul Berhak Cipta (Hanya Identitas)
                            </span>
                          </div>

                          <div className="p-3 bg-amber-50/20 dark:bg-amber-950/10 rounded-xl border border-dashed border-amber-200 dark:border-amber-900/40 text-center">
                            <p className="text-[10px] text-amber-905 dark:text-amber-400 font-semibold leading-relaxed">
                              💡 Gunakan kitab/modul cetak fisik orisinal untuk bimbingan langsung dengan guru Halaqah Anda.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border dark:border-slate-800">
                            <span>Modul Ajar: {targetModul.judulModul}</span>
                            <span className="font-mono">
                              {targetModul.isMultiJilid ? `Jilid ${jilidIndex + 1}, ` : ''} Halaman {curStudentPage}
                            </span>
                          </div>

                          {startPage !== endPage && (
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850">
                              <button
                                type="button"
                                disabled={curStudentPage <= startPage}
                                onClick={() => setStudentPreviewPage(curStudentPage - 1)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-850 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                              >
                                ← Halaman Sebelum
                              </button>
                              <span className="text-[10px] font-mono font-bold text-slate-500">
                                Halaman {curStudentPage} dari {endPage}
                              </span>
                              <button
                                type="button"
                                disabled={curStudentPage >= endPage}
                                onClick={() => setStudentPreviewPage(curStudentPage + 1)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-850 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                              >
                                Halaman Lanjut →
                              </button>
                            </div>
                          )}

                          {targetModul.tipeMateri === 'google_doc_slide' ? (
                            <div className="space-y-3">
                              {targetModul.googleDocUrl && (
                                <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                                  <div className="bg-indigo-50/40 p-2 text-xs font-bold text-indigo-850 uppercase border-b border-indigo-100 flex justify-between items-center">
                                    <span>📝 Google Docs</span>
                                    <a href={targetModul.googleDocUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline">Edit ↗</a>
                                  </div>
                                  <iframe 
                                    src={getEmbedUrl(targetModul.googleDocUrl, 'doc')} 
                                    className="w-full h-80 border-0" 
                                    title="Google Doc Link Embed" 
                                    allow="autoplay"
                                  />
                                </div>
                              )}
                              {targetModul.googleSlideUrl && (
                                <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                                  <div className="bg-indigo-50/40 p-2 text-xs font-bold text-indigo-850 uppercase border-b border-indigo-100 flex justify-between items-center">
                                    <span>📊 Google Slides</span>
                                    <a href={targetModul.googleSlideUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline">Edit ↗</a>
                                  </div>
                                  <iframe 
                                    src={getEmbedUrl(targetModul.googleSlideUrl, 'slide')} 
                                    className="w-full h-80 border-0" 
                                    title="Google Slide Link Embed" 
                                    allow="autoplay"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <p className="text-[10px] font-bold text-slate-404 mb-1.5 uppercase tracking-wider font-mono">NASKAH MATERI</p>
                              <div className="text-xs text-slate-805 dark:text-slate-200 leading-relaxed select-text font-sans">
                                {pageText && pageText.includes('<') && pageText.includes('>') ? (
                                  <div dangerouslySetInnerHTML={{ __html: pageText }} />
                                ) : (
                                  <div className="whitespace-pre-wrap">{pageText || targetModul.isiModulManual || '(Tidak ada naskah teks tertulis)'}</div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-850 text-left">
                            <span className="text-[9px] font-bold text-[#c5a880] dark:text-amber-500 uppercase tracking-wider block font-mono">
                              📒 Uraian / Catatan Materi Halaman {curStudentPage}
                            </span>
                            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-sans mt-1">
                              {activeExplanation || targetModul.isiModulManual || 'Tidak ada detail penjelasan tambahan.'}
                            </p>
                          </div>
                        </div>
                      )
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-850/85 flex justify-end bg-slate-50/40 dark:bg-slate-900/10">
                <button 
                  type="button" 
                  onClick={() => setSelectedSetoranForModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Selesai Membaca &amp; Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====================================================
          MODAL: DRIVE AUTH PROMPT
          ==================================================== */}
      {driveAuthPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 text-left my-8">
            <button 
              type="button" 
              onClick={() => setDriveAuthPrompt(null)} 
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Koneksi Google Drive</h4>
                <p className="text-[9px] text-slate-400 font-mono">PILIHAN PENYIMPANAN LAPORAN</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                Akun Google Workspace Anda belum terhubung di sesi ini. Silakan hubungkan akun Google Anda untuk menyimpan file rekap ke folder Google Drive secara otomatis, atau langsung unduh file ke perangkat lokal Anda.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-900 text-[11px] text-slate-500 font-mono">
                <span className="font-bold block text-slate-600 dark:text-slate-400 mb-0.5">Nama File:</span>
                <span className="truncate block text-emerald-600 dark:text-emerald-400">{driveAuthPrompt.fileName}.{driveAuthPrompt.type === 'Excel' ? 'xlsx' : 'pdf'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => handleConnectDriveAndSave(driveAuthPrompt.fileName, driveAuthPrompt.type)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>Hubungkan Google Drive</span>
              </button>
              <button
                type="button"
                onClick={() => setDriveAuthPrompt(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: DRIVE FOLDER PICKER & FILE SAVE DIALOG
          ==================================================== */}
      {driveSaveItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-150 dark:border-slate-800 text-left my-8 flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Simpan File ke Google Drive</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Pilih lokasi folder penyimpanan di Drive Anda</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setDriveSaveItem(null)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Breadcrumb Path */}
            <div className="flex items-center space-x-1.5 py-3 text-xs overflow-x-auto shrink-0 border-b border-slate-50 dark:border-slate-900">
              {folderPath.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => handleNavigateDriveFolder(item.id, item.name)}
                    className={`font-semibold hover:underline shrink-0 cursor-pointer ${
                      index === folderPath.length - 1 
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                        : 'text-slate-500'
                    }`}
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Folder List Body */}
            <div className="flex-1 overflow-y-auto py-3 space-y-1 min-h-[160px] max-h-[260px] border-b border-slate-50 dark:border-slate-900">
              {isFetchingFolders ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memuat daftar folder Drive...</span>
                </div>
              ) : driveFolders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  Folder ini kosong (tidak ada subfolder). File akan disimpan di sini.
                </div>
              ) : (
                driveFolders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => handleNavigateDriveFolder(folder.id, folder.name)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer text-xs group transition"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{folder.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))
              )}
            </div>

            {/* Folder creation toggle & input */}
            <div className="pt-3 shrink-0 space-y-3">
              {showNewFolderInput ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Nama Folder Baru..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 p-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={isCreatingFolder || !newFolderName.trim()}
                    onClick={handleCreateDriveFolder}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingFolder ? 'Membuat...' : 'Buat'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewFolderInput(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewFolderInput(true)}
                  className="inline-flex items-center space-x-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Buat Folder Baru di Sini</span>
                </button>
              )}

              {/* Custom File Name Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Nama File yang Akan Disimpan:
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    className="flex-1 p-2 text-xs border border-slate-200 dark:border-slate-800 rounded-l-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="p-2 bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-800 rounded-r-xl text-xs font-mono text-slate-500">
                    .{driveSaveItem.extension}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setDriveSaveItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!!uploadingToDrive}
                onClick={handleExecuteSaveToDrive}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>{uploadingToDrive ? 'Mengunggah...' : 'Simpan Sekarang'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
