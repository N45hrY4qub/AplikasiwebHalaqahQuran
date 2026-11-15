/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Plus, 
  Edit, 
  Trash, 
  Eye, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  FileText, 
  BookOpenCheck,
  FileAudio,
  FileCheck,
  Trophy,
  UserCheck,
  ArrowLeft,
  XCircle,
  Play,
  Square,
  Volume2,
  Settings,
  Share2,
  Calendar,
  AlertCircle,
  Activity,
  Mic,
  Sliders,
  Check,
  Download,
  Printer,
  Bell,
  Sparkles,
  CheckCheck,
  Filter,
  X,
  RotateCcw,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Maximize,
  Minimize,
  Lock,
  Unlock,
  Copy,
  CopyCheck,
  AlertTriangle,
  HelpCircle,
  Info,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronsDownUp,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  UserRole, 
  ProgramKeilmuan, 
  ProgramBab, 
  ProgramMateri, 
  ProgramLatihan, 
  ProgramAsesmenKognitifQuestion, 
  ProgramAsesmenKognitifSetting, 
  ProgramAsesmenPraktikSetting, 
  ProgramEnrollment,
  TipeModul 
} from '../types';
import jsPDF from 'jspdf';
import { CustomAudioPlayer } from './CustomAudioPlayer';
import { MateriPraktikSubmission } from './MateriPraktikSubmission';

export const DEFAULT_ASPEK_LIST = [
  'Makharijul Huruf',
  'Sifatul Huruf',
  'Hukum Tajwid',
  'Kelancaran',
  'Kefasihan',
  'Pemahaman Materi'
];

export const DEFAULT_PETUNJUK_KEJUJURAN = "Kerjakan soal-soal evaluasi berikut dengan penuh kejujuran dan rasa tanggung jawab. Ingatlah bahwa kejujuran adalah cermin integritas seorang penuntut ilmu dan Allah Ta'ala senantiasa mengawasi setiap langkah kita. Evaluasi ini bertujuan untuk mengukur tingkat pemahaman serta penguasaan materi yang telah dipelajari secara murni.";

export const ProgramKeilmuanSystem: React.FC = () => {
  const { 
    currentSession, 
    programs, createProgram, updateProgram, deleteProgram,
    programBabs, createProgramBab, updateProgramBab, deleteProgramBab,
    programMateris, createProgramMateri, updateProgramMateri, deleteProgramMateri,
    programLatihans, createProgramLatihan, updateProgramLatihan, deleteProgramLatihan,
    programAsesmens, createProgramAsesmen, updateProgramAsesmen, deleteProgramAsesmen,
    programAsesmenSettings, saveProgramAsesmenSetting,
    programPraktikSettings, saveProgramPraktikSetting,
    programEnrollments, createProgramEnrollment, updateProgramEnrollment, deleteProgramEnrollment,
    siswas,
    halaqahs,
    moduls,
    addLog
  } = useApp();

  const user = currentSession.user;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isGuru = user?.role === UserRole.GURU;
  const isSiswa = user?.role === UserRole.SISWA;

  // Active view management
  const [activeSubTab, setActiveSubTab] = useState<string>(
    isAdmin ? 'program-list' : (isGuru ? 'guru-list' : 'siswa-dashboard')
  );

  // States for Reading Notification Center (Guru / Admin)
  const [showReadingNotifPanel, setShowReadingNotifPanel] = useState<boolean>(true);
  const [readingNotifFilter, setReadingNotifFilter] = useState<'all' | 'unread' | 'today'>('all');

  // States for Admin
  const [selectedProgram, setSelectedProgram] = useState<ProgramKeilmuan | null>(null);
  const [selectedBab, setSelectedBab] = useState<ProgramBab | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create_program' | 'edit_program' | 'create_bab' | 'edit_bab' | 'create_materi' | 'edit_materi' | 'create_latihan' | 'edit_latihan' | 'create_asesmen' | 'edit_asesmen' | 'edit_asesmen_setting' | 'enroll_student' | 'grad_cert' | 'create_praktik' | 'edit_praktik'>('create_program');

  // Accordion Expand/Collapse State for Admin Curriculum View
  const [collapsedBabs, setCollapsedBabs] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Confirmation Delete Modal State
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'program' | 'enrollment' | 'bab' | 'materi' | 'asesmen';
    id: string;
    title: string;
    desc?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      if (confirmDelete.type === 'program') {
        deleteProgram(confirmDelete.id);
      } else if (confirmDelete.type === 'enrollment') {
        deleteProgramEnrollment(confirmDelete.id);
      } else if (confirmDelete.type === 'bab') {
        deleteProgramBab(confirmDelete.id);
      } else if (confirmDelete.type === 'materi') {
        deleteProgramMateri(confirmDelete.id);
      } else if (confirmDelete.type === 'asesmen') {
        deleteProgramAsesmen(confirmDelete.id);
      }
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleBabCollapse = (babId: string) => {
    setCollapsedBabs(prev => ({
      ...prev,
      [babId]: !prev[babId]
    }));
  };

  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const expandAllBabs = (babs: ProgramBab[]) => {
    setCollapsedBabs({});
    setCollapsedSections({});
  };

  const collapseAllBabs = (babs: ProgramBab[]) => {
    const nextCollapsed: Record<string, boolean> = {};
    babs.forEach(b => {
      nextCollapsed[b.id] = true;
    });
    setCollapsedBabs(nextCollapsed);
  };

  // New Custom Aspect States
  const [customAspectInput, setCustomAspectInput] = useState('');

  const getTaskAspects = (mId: string | undefined, pId: string) => {
    if (mId) {
      const materi = programMateris.find(m => m.id === mId);
      if (materi?.aspekPenilaianSelected && materi.aspekPenilaianSelected.length > 0) {
        return materi.aspekPenilaianSelected;
      }
    }
    const program = programs.find(p => p.id === pId);
    if (program?.aspekPenilaianList && program.aspekPenilaianList.length > 0) {
      return program.aspekPenilaianList;
    }
    return DEFAULT_ASPEK_LIST;
  };

  // Form States
  const [progForm, setProgForm] = useState<Omit<ProgramKeilmuan, 'id' | 'tanggalDibuat'>>({
    nama: '', kategori: 'Tajwid Dasar', deskripsi: '', tujuan: '', sasaran: '',
    kkm: 75, bertahap: true, latihan: true, asesmenPraktik: true, remedial: true, ujianAkhir: true, sertifikat: true, status: 'Aktif',
    tipeMateri: 'Cetak', modulId: '',
    aspekPenilaianList: [...DEFAULT_ASPEK_LIST],
    cetakInfo: { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' },
    antiCheatEnabled: true,
    maxViolations: 3,
    requireFullscreen: true,
    blockCopyPaste: true,
    petunjukKejujuran: DEFAULT_PETUNJUK_KEJUJURAN
  });

  const [babForm, setBabForm] = useState<Omit<ProgramBab, 'id'>>({
    programId: '', judul: '', tujuanPembelajaran: '', indikator: '', estimasiWaktu: '2 Jam', urutan: 1
  });

  const [materiForm, setMateriForm] = useState<Omit<ProgramMateri, 'id'>>({
    babId: '', programId: '', judul: '', tipe: 'Cetak', modulId: '',
    cetakInfo: { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' },
    isPraktik: false, praktikPetunjuk: '',
    aspekPenilaianSelected: [],
    urutan: 1
  });

  const [latihanForm, setLatihanForm] = useState<Omit<ProgramLatihan, 'id'>>({
    babId: '', programId: '', tipe: 'pilihan_ganda', pertanyaan: '', opsi: ['', '', '', ''], jawabanBenar: '', urutan: 1
  });

  const [asesmenForm, setAsesmenForm] = useState<Omit<ProgramAsesmenKognitifQuestion, 'id'>>({
    babId: '', programId: '', tipe: 'pilihan_ganda', pertanyaan: '', opsi: ['', '', '', ''], jawabanBenar: '', bobot: 10, urutan: 1
  });

  const [asesmenSettingForm, setAsesmenSettingForm] = useState<ProgramAsesmenKognitifSetting>({
    id: '',
    programId: '',
    babId: '',
    jumlahSoal: 5,
    durasi: 15,
    acakSoal: true,
    acakJawaban: false,
    bobotNilai: 50,
    antiCheatEnabled: true,
    maxViolations: 3,
    requireFullscreen: true,
    blockCopyPaste: true,
    petunjukKejujuran: DEFAULT_PETUNJUK_KEJUJURAN
  });

  const [enrollForm, setEnrollForm] = useState({ siswaId: '', programId: '' });

  const [editingMateriId, setEditingMateriId] = useState<string | null>(null);
  const [editingLatihanId, setEditingLatihanId] = useState<string | null>(null);
  const [editingAsesmenId, setEditingAsesmenId] = useState<string | null>(null);

  // CBT / Student Test State with Anti-Cheat Proctoring
  const [activeExam, setActiveExam] = useState<{
    babId: string;
    questions: ProgramAsesmenKognitifQuestion[];
    settings: ProgramAsesmenKognitifSetting;
    answers: Record<string, string>;
    timeLeft: number;
    isRunning: boolean;
    cheatLogs: Array<{
      type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste_attempt' | 'devtools_attempt';
      message: string;
      timestamp: string;
      timestampIso: string;
    }>;
    violationCount: number;
    maxViolations: number;
    antiCheatEnabled: boolean;
    requireFullscreen: boolean;
    blockCopyPaste: boolean;
    petunjukKejujuran: string;
    warningModal: {
      open: boolean;
      type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste_attempt' | 'devtools_attempt';
      message: string;
      count: number;
      max: number;
      isMaxReached: boolean;
    } | null;
  } | null>(null);

  // Practice Audio Recording States (for student practice assessments)
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [simulatedVolume, setSimulatedVolume] = useState<number[]>([]);
  const [simulatedTimer, setSimulatedTimer] = useState(0);
  const recTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);

  // Guru grading states
  const [gradingEnrollmentId, setGradingEnrollmentId] = useState<string | null>(null);
  const gradingEnrollment = React.useMemo(() => {
    if (!gradingEnrollmentId) return null;
    return programEnrollments.find(e => e.id === gradingEnrollmentId) || null;
  }, [programEnrollments, gradingEnrollmentId]);

  const setGradingEnrollment = React.useCallback((val: any) => {
    if (typeof val === 'function') {
      const current = programEnrollments.find(e => e.id === gradingEnrollmentId) || null;
      const res = val(current);
      setGradingEnrollmentId(res ? res.id : null);
    } else {
      setGradingEnrollmentId(val ? val.id : null);
    }
  }, [programEnrollments, gradingEnrollmentId]);
  const [gradingBabId, setGradingBabId] = useState<string>('');
  const [gradingMateriId, setGradingMateriId] = useState<string>('');
  const [gradingRubric, setGradingRubric] = useState<Record<string, any>>({
    catatan: ''
  });
  const [reviewingBabId, setReviewingBabId] = useState<string>('');
  const [reviewingSiswaBabId, setReviewingSiswaBabId] = useState<string>('');
  const [tempCorrections, setTempCorrections] = useState<Record<string, 'correct' | 'incorrect'>>({});

  // Certificate printing state
  const [certEnrollment, setCertEnrollment] = useState<ProgramEnrollment | null>(null);

  // Pre-calculated variables for Siswa Study Interface (to avoid IIFEs inside JSX)
  const studyEnroll = (selectedProgram && user) 
    ? programEnrollments.find(e => e.programId === selectedProgram.id && e.siswaId === user.id) 
    : null;
  const studyBabProgress = (studyEnroll && selectedBab) 
    ? studyEnroll.babProgress[selectedBab.id] || { completedMateriIds: [], LulusBab: false, kognitifStatus: 'Belum Mengikuti', kognitifScore: undefined, praktikStatus: 'Belum Mengikuti' } 
    : null;
  
  const studyTheoryMateris = selectedBab 
    ? programMateris.filter(m => m.babId === selectedBab.id && !m.isPraktik) 
    : [];
  const studyCompletedMateriIds = studyBabProgress?.completedMateriIds || [];
  const studyUnreadMateris = studyTheoryMateris.filter(m => !studyCompletedMateriIds.includes(m.id));
  const studyIsAllRead = studyUnreadMateris.length === 0;

  const studyHasTakenKognitif = studyBabProgress?.kognitifScore !== undefined;
  const studyKognitifScore = studyBabProgress?.kognitifScore;
  const studyIsKognitifPassed = studyBabProgress?.kognitifStatus === 'Lulus';

  const studyPraktikMateris = selectedBab 
    ? programMateris.filter(m => m.babId === selectedBab.id && m.isPraktik) 
    : [];

  // Quick states for active content
  const activeSiswaEnrollments = programEnrollments.filter(e => e.siswaId === user?.id);

  const selectedModulForAdd = moduls.find(m => m.id === progForm.modulId);
  const isAddIdentitasModul = !!(selectedModulForAdd && selectedModulForAdd.tipe !== TipeModul.AL_QURAN && selectedModulForAdd.tipeMateri === 'hanya_identitas');

  const selectedModulForEdit = moduls.find(m => m.id === selectedProgram?.modulId);
  const isEditIdentitasModul = !!(selectedModulForEdit && selectedModulForEdit.tipe !== TipeModul.AL_QURAN && selectedModulForEdit.tipeMateri === 'hanya_identitas');

  // Handle countdown timer for active Exam
  useEffect(() => {
    if (activeExam && activeExam.isRunning) {
      if (activeExam.timeLeft <= 0) {
        handleFinishExam(false);
      } else {
        const timer = setTimeout(() => {
          setActiveExam(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeExam]);

  // Anti-Cheat & Proctoring Listeners
  useEffect(() => {
    if (!activeExam || !activeExam.isRunning || !activeExam.antiCheatEnabled) return;

    let lastViolationTime = 0;

    const triggerViolation = (type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste_attempt' | 'devtools_attempt', message: string) => {
      const now = Date.now();
      if (now - lastViolationTime < 1500) return; // Debounce rapid duplicate events
      lastViolationTime = now;

      setActiveExam(prev => {
        if (!prev || !prev.isRunning) return null;
        const newCount = (prev.violationCount || 0) + 1;
        const newLogs = [
          ...(prev.cheatLogs || []),
          {
            type,
            message,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timestampIso: new Date().toISOString()
          }
        ];

        const isMaxReached = newCount >= prev.maxViolations;

        return {
          ...prev,
          violationCount: newCount,
          cheatLogs: newLogs,
          warningModal: {
            open: true,
            type,
            message,
            count: newCount,
            max: prev.maxViolations,
            isMaxReached
          }
        };
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('tab_switch', 'Membuka tab lain atau meminimalkan browser ujian');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('tab_switch', 'Kehilangan fokus layar ujian (berpindah ke aplikasi / jendela lain)');
    };

    const handleFullscreenChange = () => {
      if (activeExam.requireFullscreen && !document.fullscreenElement) {
        triggerViolation('fullscreen_exit', 'Keluar dari mode layar penuh (Fullscreen)');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (activeExam.blockCopyPaste) {
        e.preventDefault();
        triggerViolation('copy_paste_attempt', 'Mencoba klik kanan (Context Menu)');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (activeExam.blockCopyPaste) {
        e.preventDefault();
        triggerViolation('copy_paste_attempt', 'Mencoba menyalin (Copy) teks lembar ujian');
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      if (activeExam.blockCopyPaste) {
        e.preventDefault();
        triggerViolation('copy_paste_attempt', 'Mencoba memotong (Cut) teks');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (activeExam.blockCopyPaste) {
        e.preventDefault();
        triggerViolation('copy_paste_attempt', 'Mencoba menempel (Paste) teks');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Devtools block
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        ((e.ctrlKey || e.metaKey) && ['u', 'U'].includes(e.key))
      ) {
        e.preventDefault();
        triggerViolation('devtools_attempt', 'Mencoba membuka inspect element / developer tools');
        return;
      }

      if (activeExam.blockCopyPaste) {
        const target = e.target as HTMLElement;
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

        // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A outside inputs, and block copy everywhere
        if ((e.ctrlKey || e.metaKey) && ['c', 'C', 'x', 'X', 'v', 'V'].includes(e.key)) {
          if (!isInput || ['c', 'C', 'x', 'X'].includes(e.key)) {
            e.preventDefault();
            triggerViolation('copy_paste_attempt', 'Mencoba pintasan keyboard salin-tempel');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeExam?.isRunning, activeExam?.antiCheatEnabled, activeExam?.requireFullscreen, activeExam?.blockCopyPaste, activeExam?.maxViolations]);

  // Handle active countdown wave for recording
  useEffect(() => {
    if (recordingState === 'recording') {
      recTimerRef.current = setInterval(() => {
        setSimulatedTimer(prev => prev + 1);
        setSimulatedVolume(prev => [...prev.slice(-30), Math.floor(Math.random() * 60) + 15]);
      }, 100);
    } else {
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
      }
    }
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, [recordingState]);

  // Monitor general recording timer limit (120s / 2 minutes)
  useEffect(() => {
    if (recordingState === 'recording' && simulatedTimer >= 1200) {
      handleStopRecording();
      alert("⏱️ Batas waktu rekaman maksimal 2 menit telah tercapai. Rekaman otomatis disimpan untuk dikirim.");
    }
  }, [simulatedTimer, recordingState]);

  const getRemainingDays = (isoString?: string) => {
    if (!isoString) return 7;
    const submittedDate = new Date(isoString);
    const expiryDate = new Date(submittedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const diffTime = expiryDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // SWR revalidation helper
  const getEnrollmentForSiswa = (programId: string) => {
    return programEnrollments.find(e => e.programId === programId && e.siswaId === user?.id);
  };

  // Reading Notifications Aggregation for Guru / Admin
  const readingNotifications = React.useMemo(() => {
    const list: Array<{
      id: string;
      enrollmentId: string;
      siswaId: string;
      siswaNama: string;
      siswaNis: string;
      halaqahNama?: string;
      programId: string;
      programNama: string;
      babId: string;
      babJudul: string;
      babUrutan?: number;
      materiId: string;
      materiJudul: string;
      materiTipe?: string;
      timestamp: string;
      timestampIso: string;
      readByGuru?: boolean;
    }> = [];

    programEnrollments.forEach(enroll => {
      Object.entries(enroll.babProgress || {}).forEach(([babId, bProg]: [string, any]) => {
        const bab = programBabs.find(b => b.id === babId);
        const babJudul = bab?.judul || `Bab ${bab?.urutan || ''}`;
        const babUrutan = bab?.urutan;

        if (bProg.readingCompletedDetails) {
          Object.entries(bProg.readingCompletedDetails).forEach(([materiId, detail]: [string, any]) => {
            const materi = programMateris.find(m => m.id === materiId);
            list.push({
              id: `${enroll.id}_${babId}_${materiId}`,
              enrollmentId: enroll.id,
              siswaId: enroll.siswaId,
              siswaNama: enroll.siswaNama,
              siswaNis: enroll.siswaNis,
              halaqahNama: enroll.halaqahNama,
              programId: enroll.programId,
              programNama: enroll.programNama,
              babId,
              babJudul: detail.babJudul || babJudul,
              babUrutan,
              materiId,
              materiJudul: detail.materiJudul || materi?.judul || 'Materi Teori',
              materiTipe: materi?.tipe,
              timestamp: detail.completedAtFormatted || bProg.readingTimes?.[materiId] || '',
              timestampIso: detail.completedAtIso || '',
              readByGuru: !!detail.readByGuru
            });
          });
        } else if (bProg.completedMateriIds && bProg.completedMateriIds.length > 0) {
          bProg.completedMateriIds.forEach((materiId: string) => {
            const materi = programMateris.find(m => m.id === materiId);
            if (materi && !materi.isPraktik) {
              const timeStr = bProg.readingTimes?.[materiId] || '';
              list.push({
                id: `${enroll.id}_${babId}_${materiId}`,
                enrollmentId: enroll.id,
                siswaId: enroll.siswaId,
                siswaNama: enroll.siswaNama,
                siswaNis: enroll.siswaNis,
                halaqahNama: enroll.halaqahNama,
                programId: enroll.programId,
                programNama: enroll.programNama,
                babId,
                babJudul,
                babUrutan,
                materiId,
                materiJudul: materi.judul,
                materiTipe: materi.tipe,
                timestamp: timeStr,
                timestampIso: '',
                readByGuru: false
              });
            }
          });
        }
      });
    });

    return list.sort((a, b) => {
      if (a.timestampIso && b.timestampIso) {
        return new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime();
      }
      return 0;
    });
  }, [programEnrollments, programBabs, programMateris]);

  const handleMarkReadingAsRead = async (notifItem: typeof readingNotifications[0]) => {
    const enroll = programEnrollments.find(e => e.id === notifItem.enrollmentId);
    if (!enroll) return;

    const bProg = enroll.babProgress?.[notifItem.babId];
    if (!bProg) return;

    const updatedDetails = { ...(bProg.readingCompletedDetails || {}) };
    if (updatedDetails[notifItem.materiId]) {
      updatedDetails[notifItem.materiId] = {
        ...updatedDetails[notifItem.materiId],
        readByGuru: true
      };
    } else {
      updatedDetails[notifItem.materiId] = {
        materiId: notifItem.materiId,
        materiJudul: notifItem.materiJudul,
        babId: notifItem.babId,
        babJudul: notifItem.babJudul,
        completedAtIso: notifItem.timestampIso || new Date().toISOString(),
        completedAtFormatted: notifItem.timestamp,
        readByGuru: true
      };
    }

    const updatedBabProgress = {
      ...enroll.babProgress,
      [notifItem.babId]: {
        ...bProg,
        readingCompletedDetails: updatedDetails
      }
    };

    const updatedLastReading = (enroll.lastReadingUpdate && enroll.lastReadingUpdate.materiId === notifItem.materiId)
      ? { ...enroll.lastReadingUpdate, readByGuru: true }
      : enroll.lastReadingUpdate;

    await updateProgramEnrollment(enroll.id, {
      babProgress: updatedBabProgress,
      lastReadingUpdate: updatedLastReading
    });
  };

  const handleMarkAllReadingsAsRead = async () => {
    const unreadList = readingNotifications.filter(n => !n.readByGuru);
    for (const notif of unreadList) {
      await handleMarkReadingAsRead(notif);
    }
  };

  // Safe numeric average helper
  const calcProgress = (enroll: ProgramEnrollment) => {
    const progBabsList = programBabs.filter(b => b.programId === enroll.programId);
    if (progBabsList.length === 0) return 0;
    let completedBabs = 0;
    progBabsList.forEach(b => {
      if (enroll.babProgress[b.id]?.lulusBab) completedBabs++;
    });
    return Math.round((completedBabs / progBabsList.length) * 100);
  };

  // Intelligent Auto-Grading Engine for CBT (Isian & Esay)
  const isAnswerCorrectAutomatically = (q: ProgramAsesmenKognitifQuestion, ans: any): boolean => {
    if (ans === undefined || ans === null) return false;
    const studentAns = String(ans).trim();
    if (!studentAns) return false;

    // 1. Pilihan Ganda & Benar-Salah (Exact Case-Insensitive Matching)
    if (q.tipe === 'pilihan_ganda' || q.tipe === 'benar_salah') {
      return String(ans).toLowerCase().trim() === String(q.jawabanBenar).toLowerCase().trim();
    }

    // 2. Isian Rumpang (Multi-Option Splitting & Normalization Matching)
    if (q.tipe === 'rumpang') {
      const cleanStudent = studentAns.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
      const possibleAnswers = String(q.jawabanBenar)
        .split(/[,/;]/)
        .map(a => a.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim());
      
      return possibleAnswers.some(ansOpt => ansOpt === cleanStudent || cleanStudent.includes(ansOpt) || ansOpt.includes(cleanStudent));
    }

    // 3. Esay (Intelligent Keyword & Key Phrase Match with Stop-Words Filter)
    if (q.tipe === 'esai') {
      if (studentAns.length < 4) return false;
      const cleanStudent = studentAns.toLowerCase();
      
      // Extrapolate list of important terms (excluding standard Indonesian connectors)
      const stopWords = ['yang', 'untuk', 'dengan', 'dalam', 'pada', 'dari', 'adalah', 'bahwa', 'atau', 'bisa', 'akan', 'telah', 'sudah', 'kami', 'saya', 'mereka', 'kita', 'dan', 'ini', 'itu', 'dia', 'ia'];
      const modelKeywords = String(q.jawabanBenar)
        .toLowerCase()
        .split(/[\s,.;/]+/)
        .map(w => w.replace(/[^\w]/g, ""))
        .filter(w => w.length > 3)
        .filter(w => !stopWords.includes(w));

      if (modelKeywords.length === 0) {
        return studentAns.length >= 8; // Fallback
      }

      const matchedKeywords = modelKeywords.filter(keyword => cleanStudent.includes(keyword));
      const matchRatio = matchedKeywords.length / modelKeywords.length;

      // Correct if student hits at least 1 keyword for short targets, or at least 30% of keywords
      return matchedKeywords.length >= Math.min(2, modelKeywords.length) || matchRatio >= 0.3;
    }

    return false;
  };

  // CBT Exam Logic with Anti-Cheat
  const handleStartExam = (babId: string, programId: string) => {
    const theoryMateris = programMateris.filter(m => m.babId === babId && !m.isPraktik);
    const enroll = programEnrollments.find(e => e.programId === programId && e.siswaId === user?.id);
    const bProgress = enroll?.babProgress[babId] || { completedMateriIds: [] };
    const allRead = theoryMateris.every(m => bProgress.completedMateriIds?.includes(m.id));

    if (!allRead) {
      alert("⚠️ Anda belum menyelesaikan semua materi teori di bab ini. Silakan baca dan klik 'Tandai Selesai Membaca' pada semua materi terlebih dahulu.");
      return;
    }

    const currentProgram = programs.find(p => p.id === programId) || selectedProgram;
    const questions = programAsesmens.filter(q => q.babId === babId);
    const setting = programAsesmenSettings.find(s => s.babId === babId) || {
      id: `${programId}_${babId}`,
      programId,
      babId,
      jumlahSoal: 5,
      durasi: 15,
      acakSoal: true,
      acakJawaban: false,
      bobotNilai: 50,
      antiCheatEnabled: currentProgram?.antiCheatEnabled !== false,
      maxViolations: currentProgram?.maxViolations || 3,
      requireFullscreen: currentProgram?.requireFullscreen !== false,
      blockCopyPaste: currentProgram?.blockCopyPaste !== false,
      petunjukKejujuran: currentProgram?.petunjukKejujuran || DEFAULT_PETUNJUK_KEJUJURAN
    };

    // Determine final anti-cheat values
    const isAntiCheatOn = setting.antiCheatEnabled !== undefined ? setting.antiCheatEnabled : (currentProgram?.antiCheatEnabled !== false);
    const maxVio = setting.maxViolations || currentProgram?.maxViolations || 3;
    const reqFullscreen = setting.requireFullscreen !== undefined ? setting.requireFullscreen : (currentProgram?.requireFullscreen !== false);
    const blockCP = setting.blockCopyPaste !== undefined ? setting.blockCopyPaste : (currentProgram?.blockCopyPaste !== false);
    const petunjuk = setting.petunjukKejujuran || currentProgram?.petunjukKejujuran || DEFAULT_PETUNJUK_KEJUJURAN;

    // Slice and randomize questions if set
    let finalQuestions = [...questions];
    if (setting.acakSoal) {
      finalQuestions.sort(() => Math.random() - 0.5);
    }
    finalQuestions = finalQuestions.slice(0, setting.jumlahSoal);

    if (reqFullscreen && isAntiCheatOn) {
      try {
        if (document.documentElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen request pending/blocked:', err);
          });
        }
      } catch (e) {
        console.warn('Fullscreen not supported or blocked in iframe context', e);
      }
    }

    setActiveExam({
      babId,
      questions: finalQuestions,
      settings: setting,
      answers: {},
      timeLeft: setting.durasi * 60,
      isRunning: true,
      cheatLogs: [],
      violationCount: 0,
      maxViolations: maxVio,
      antiCheatEnabled: isAntiCheatOn,
      requireFullscreen: reqFullscreen,
      blockCopyPaste: blockCP,
      petunjukKejujuran: petunjuk,
      warningModal: null
    });
    setActiveSubTab('siswa-cbt');
  };

  const handleFinishExam = async (isAutoSubmittedDueToCheat = false) => {
    if (!activeExam) return;

    // Exit fullscreen if active
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        document.exitFullscreen().catch(() => {});
      } catch (e) {}
    }

    const currentProgram = programs.find(p => p.id === selectedProgram?.id) || selectedProgram;
    const enroll = programEnrollments.find(e => e.programId === currentProgram?.id && e.siswaId === user?.id);
    if (!enroll) return;

    let correctCount = 0;
    activeExam.questions.forEach(q => {
      const ans = activeExam.answers[q.id];
      if (isAnswerCorrectAutomatically(q, ans)) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / (activeExam.questions.length || 1)) * 100);
    // If auto-submitted due to cheat, score can still be calculated but status marked as not passed
    const score = calculatedScore;
    const passing = !isAutoSubmittedDueToCheat && score >= (currentProgram?.kkm || 75);

    const updatedBabProgress = { ...(enroll.babProgress || {}) };
    const currentBabProg = updatedBabProgress[activeExam.babId] || {
      completedMateriIds: [], latihanCompleted: false, lulusBab: false
    };

    const isLulus = passing && (!currentProgram?.asesmenPraktik || currentBabProg.praktikStatus === 'Lulus');

    updatedBabProgress[activeExam.babId] = {
      ...currentBabProg,
      kognitifScore: score,
      kognitifStatus: isAutoSubmittedDueToCheat ? 'Belum Lulus' : (passing ? 'Lulus' : 'Belum Lulus'),
      kognitifAttempts: (currentBabProg.kognitifAttempts || 0) + 1,
      kognitifAnswers: activeExam.answers,
      kognitifQuestions: activeExam.questions,
      kognitifManualCorrections: {},
      cheatLogs: activeExam.cheatLogs || [],
      violationCount: activeExam.violationCount || 0,
      autoSubmittedDueToCheat: isAutoSubmittedDueToCheat,
      lulusBab: isLulus
    };

    // Calculate dynamic enrollment progress
    const babsList = programBabs.filter(b => b.programId === enroll.programId);
    const totalBabsCount = babsList.length;
    let completedCount = 0;
    babsList.forEach(b => {
      const status = b.id === activeExam.babId ? isLulus : (updatedBabProgress[b.id]?.lulusBab || false);
      if (status) completedCount++;
    });
    const percent = totalBabsCount > 0 ? Math.round((completedCount / totalBabsCount) * 100) : 0;

    const isLulusProgram = percent === 100;

    await updateProgramEnrollment(enroll.id, {
      babProgress: updatedBabProgress,
      progressPercent: percent,
      lulusProgram: isLulusProgram,
      ujianAkhirStatus: isLulusProgram ? 'Belum Mengikuti' : enroll.ujianAkhirStatus
    });

    if (isAutoSubmittedDueToCheat) {
      addLog('Pelanggaran Ujian Kognitif (Auto-Submit)', `Siswa ${user?.namaLengkap} ujian CBT bab dikumpulkan otomatis karena terdeteksi ${activeExam.violationCount} kali pelanggaran integritas (pindah tab/keluar layar).`);
      alert(`⚠️ UJIAN DIKUMPULKAN OTOMATIS: Anda telah mencapai batas maksimal (${activeExam.maxViolations}x) peringatan pelanggaran integritas (berpindah tab / aplikasi / keluar mode layar penuh). Lembar ujian Anda telah otomatis dikumpulkan dan catatan pelanggaran dicatat ke sistem Guru.`);
    } else {
      addLog('Selesai Ujian Kognitif', `Siswa ${user?.namaLengkap} menyelesaikan ujian CBT Bab. Skor: ${score}% (${passing ? 'LULUS' : 'REMEDIAL'}). Pelanggaran tercatat: ${activeExam.violationCount || 0}`);
      alert(`Ujian selesai! Anda mendapatkan skor ${score}%. Status: ${passing ? 'Lulus Kriteria' : 'Belum Memenuhi KKM (Remedial)'}`);
    }

    const currentBab = programBabs.find(b => b.id === activeExam.babId);
    if (currentBab) {
      setSelectedBab(currentBab);
    }
    setActiveExam(null);
    setActiveSubTab('siswa-study');
  };

  const handleSaveCBTCorrections = async (targetEnrollment: ProgramEnrollment, babId: string) => {
    const bProgress = targetEnrollment.babProgress[babId];
    if (!bProgress || !bProgress.kognitifQuestions) return;

    let correctCount = 0;
    bProgress.kognitifQuestions.forEach(q => {
      const override = tempCorrections[q.id];
      if (override === 'correct') {
        correctCount++;
      } else if (override === 'incorrect') {
        // do not count
      } else {
        const ans = bProgress.kognitifAnswers?.[q.id];
        if (isAnswerCorrectAutomatically(q, ans)) {
          correctCount++;
        }
      }
    });

    const score = Math.round((correctCount / bProgress.kognitifQuestions.length) * 100);
    const passing = score >= (selectedProgram?.kkm || 75);

    const updatedBabProgress = { ...(targetEnrollment.babProgress || {}) };
    const currentBabProg = updatedBabProgress[babId];

    const isLulus = passing && (!selectedProgram?.asesmenPraktik || currentBabProg.praktikStatus === 'Lulus');

    updatedBabProgress[babId] = {
      ...currentBabProg,
      kognitifScore: score,
      kognitifStatus: passing ? 'Lulus' : 'Belum Lulus',
      kognitifManualCorrections: tempCorrections,
      lulusBab: isLulus
    };

    const babsList = programBabs.filter(b => b.programId === targetEnrollment.programId);
    const totalBabsCount = babsList.length;
    let completedCount = 0;
    babsList.forEach(b => {
      const status = b.id === babId ? isLulus : (updatedBabProgress[b.id]?.lulusBab || false);
      if (status) completedCount++;
    });
    const percent = Math.round((completedCount / totalBabsCount) * 100);

    const isLulusProgram = percent === 100;

    await updateProgramEnrollment(targetEnrollment.id, {
      babProgress: updatedBabProgress,
      progressPercent: percent,
      lulusProgram: isLulusProgram,
      ujianAkhirStatus: isLulusProgram ? 'Belum Mengikuti' : targetEnrollment.ujianAkhirStatus
    });

    setGradingEnrollment(prev => {
      if (!prev) return null;
      return {
        ...prev,
        babProgress: updatedBabProgress,
        progressPercent: percent,
        lulusProgram: isLulusProgram
      };
    });

    addLog('Koreksi CBT Guru', `Ustadz melakukan koreksi manual ujian CBT Bab untuk siswa ${targetEnrollment.siswaNama}. Skor baru: ${score}% (${passing ? 'LULUS' : 'REMEDIAL'})`);
    alert(`Hasil ujian CBT berhasil dikoreksi! Skor baru: ${score}% (${passing ? 'Lulus' : 'Belum Lulus'})`);
    setReviewingBabId('');
    setActiveSubTab('guru-enrollment-detail');
  };

  // Student Recording Simulated/Real Web MediaRecorder Logic
  const handleStartRecording = async () => {
    setAudioBlobUrl(null);
    setSimulatedVolume([20, 25, 10, 5, 20]);
    setSimulatedTimer(0);
    setRecordingState('recording');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecRef.current = recorder;
        recChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(recChunksRef.current, { type: 'audio/wav' });
          const url = URL.createObjectURL(audioBlob);
          setAudioBlobUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
      } else {
        console.warn("Media Recording API not supported or blocked inside this iframe. Falling back to beautifully simulated audio waves.");
      }
    } catch (e) {
      console.warn("Microphone access denied or error:", e);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    setRecordingState('preview');
  };

  const handleSubmitAudioTask = async (babId: string) => {
    const enroll = programEnrollments.find(e => e.programId === selectedProgram?.id && e.siswaId === user?.id);
    if (!enroll) return;

    let finalAudioSrc = "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/001001.mp3"; // Beautiful fallback Quran recitation (Al-Fatihah)

    if (audioBlobUrl) {
      try {
        const response = await fetch(audioBlobUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onloadend = () => {
            finalAudioSrc = reader.result as string;
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn("Failed to convert audio blob to base64, using fallback URL.", err);
      }
    }

    const updatedBabProgress = { ...(enroll.babProgress || {}) };
    const currentBabProg = updatedBabProgress[babId] || {
      completedMateriIds: [], latihanCompleted: false, lulusBab: false
    };

    updatedBabProgress[babId] = {
      ...currentBabProg,
      praktikStatus: 'Perlu Penilaian',
      praktikFileName: `tugas_praktik_${user?.namaLengkap?.toLowerCase().replace(/\s+/g, '_')}_bab.wav`,
      praktikFileBase64: finalAudioSrc,
      praktikFileType: 'audio',
      praktikSubmittedAtIso: new Date().toISOString()
    };

    await updateProgramEnrollment(enroll.id, {
      babProgress: updatedBabProgress
    });

    addLog('Kirim Tugas Praktik', `Siswa ${user?.namaLengkap} mengunggah tugas audio praktik untuk Bab`);
    alert("Berhasil mengunggah tugas audio! Tugas Anda sekarang berstatus 'Perlu Penilaian' oleh Guru Pembimbing.");
    setRecordingState('idle');
    setAudioBlobUrl(null);
  };

  // Guru grading save logic
  const handleSaveGuruGrade = async () => {
    if (!gradingEnrollment) return;

    const updatedBabProgress = { ...(gradingEnrollment.babProgress || {}) };
    const currentBabProg = updatedBabProgress[gradingBabId] || {
      completedMateriIds: [], latihanCompleted: false, lulusBab: false
    };

    const pgm = programs.find(p => p.id === gradingEnrollment.programId);
    const kkm = pgm?.kkm || 75;

    // Get the dynamic aspects for this task
    const activeAspects = getTaskAspects(gradingMateriId || undefined, gradingEnrollment.programId);

    // Validate that all aspect scores are provided (not empty or NaN)
    const emptyAspects = activeAspects.filter(aspect => {
      const val = gradingRubric[aspect];
      return val === '' || val === undefined || val === null || isNaN(Number(val));
    });

    if (emptyAspects.length > 0) {
      alert(`Mohon lengkapi semua nilai aspek penilaian rubrik (${emptyAspects.join(', ')}) sebelum menyimpan nilai.`);
      return;
    }

    // Sum scores of active aspects
    let sum = 0;
    const scoresDetail: Record<string, number> = {};
    activeAspects.forEach(aspect => {
      const score = Number(gradingRubric[aspect]);
      sum += score;
      scoresDetail[aspect] = score;
    });

    const finalScore = activeAspects.length > 0 ? Math.round(sum / activeAspects.length) : 80;
    const isLulusCurrentTask = finalScore >= kkm;

    if (gradingMateriId) {
      // Materi-level grading
      const currentMateriProg = currentBabProg.materiPraktikProgress || {};
      const targetMateri = currentMateriProg[gradingMateriId] || {};
      
      currentMateriProg[gradingMateriId] = {
        ...targetMateri,
        status: isLulusCurrentTask ? 'Lulus' : 'Belum Lulus',
        nilai: finalScore,
        catatan: gradingRubric.catatan,
        nilaiDetail: scoresDetail as any
      };
      
      currentBabProg.materiPraktikProgress = currentMateriProg;

      // Re-evaluate overall Bab's praktikStatus based on all required tasks
      const babMateriTasks = programMateris.filter(m => m.babId === gradingBabId && m.isPraktik);
      let overallStatus = 'Lulus';
      let hasPending = false;
      let hasRemedial = false;
      let hasNotSubmitted = false;
      let totalMateriScores = 0;
      let gradedMateriCount = 0;

      babMateriTasks.forEach(task => {
        const mProg = currentMateriProg[task.id];
        if (!mProg) {
          hasNotSubmitted = true;
        } else {
          if (mProg.status === 'Perlu Penilaian') {
            hasPending = true;
          } else if (mProg.status === 'Belum Lulus') {
            hasRemedial = true;
          }
          if (mProg.nilai !== undefined) {
            totalMateriScores += mProg.nilai;
            gradedMateriCount++;
          }
        }
      });

      if (hasPending) {
        overallStatus = 'Perlu Penilaian';
      } else if (hasRemedial) {
        overallStatus = 'Belum Lulus';
      } else if (hasNotSubmitted) {
        overallStatus = 'Belum Mengikuti';
      }

      const averageScore = gradedMateriCount > 0 ? Math.round(totalMateriScores / gradedMateriCount) : undefined;

      currentBabProg.praktikStatus = overallStatus as 'Belum Lulus' | 'Lulus' | 'Belum Mengikuti' | 'Perlu Penilaian';
      if (averageScore !== undefined) {
        currentBabProg.praktikScore = averageScore;
      }

      const isLulusKognitif = currentBabProg.kognitifStatus === 'Lulus' || !pgm?.latihan;
      const isLulusBab = overallStatus === 'Lulus' && isLulusKognitif;
      currentBabProg.lulusBab = isLulusBab;

      updatedBabProgress[gradingBabId] = currentBabProg;

    } else {
      // General Bab-level grading
      const isLulusKognitif = currentBabProg.kognitifStatus === 'Lulus' || !pgm?.latihan;
      const isLulusBab = isLulusCurrentTask && isLulusKognitif;

      updatedBabProgress[gradingBabId] = {
        ...currentBabProg,
        praktikScore: finalScore,
        praktikStatus: isLulusCurrentTask ? 'Lulus' : 'Belum Lulus',
        praktikCatatan: gradingRubric.catatan,
        praktikNilaiDetail: scoresDetail as any,
        lulusBab: isLulusBab
      };
    }

    // Recalculate whole enrollment progress
    const babsList = programBabs.filter(b => b.programId === gradingEnrollment.programId);
    const totalBabs = babsList.length;
    let completedCount = 0;
    babsList.forEach(b => {
      const status = updatedBabProgress[b.id]?.lulusBab || false;
      if (status) completedCount++;
    });
    const percent = Math.round((completedCount / totalBabs) * 100);

    const isGraduate = percent === 100;

    await updateProgramEnrollment(gradingEnrollment.id, {
      babProgress: updatedBabProgress,
      progressPercent: percent,
      lulusProgram: isGraduate,
      ujianAkhirStatus: isGraduate ? 'Lulus' : gradingEnrollment.ujianAkhirStatus
    });

    const mTitle = gradingMateriId ? `materi "${programMateris.find(m => m.id === gradingMateriId)?.judul}"` : `Bab`;
    addLog('Penilaian Praktik Guru', `Ustadz menilai tugas praktik ${gradingEnrollment.siswaNama} untuk ${mTitle}. Skor: ${finalScore}% (${isLulusCurrentTask ? 'LULUS' : 'REMEDIAL'})`);
    alert(`Nilai berhasil disimpan! Skor tugas ini adalah ${finalScore}. Status: ${isLulusCurrentTask ? 'Lulus' : 'Belum Memenuhi KKM'}`);
    
    // Refresh and return to student enrollment detail
    const prog = programs.find(p => p.id === gradingEnrollment.programId);
    if (prog) {
      setSelectedProgram(prog);
    }
    setGradingMateriId('');
    setGradingBabId('');
    setActiveSubTab('guru-enrollment-detail');
  };

  // Issue Certificate & generate certificate details
  const handleIssueCertificate = async (enroll: ProgramEnrollment) => {
    const certNo = `SYAHADAH/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const certDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    await updateProgramEnrollment(enroll.id, {
      sertifikatTerbit: true,
      sertifikatNo: certNo,
      sertifikatTanggal: certDate
    });

    addLog('Penerbitan Syahadah', `Sertifikat/Syahadah resmi diterbitkan untuk ${enroll.siswaNama} dengan nomor registrasi ${certNo}`);
    alert(`Syahadah resmi berhasil diterbitkan untuk ${enroll.siswaNama}! Nomor Registrasi: ${certNo}`);
  };

  // Open modal wrapper
  const openModal = (type: typeof modalType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCreateProgramAction = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProgram(progForm);
    setIsModalOpen(false);
    setProgForm({
      nama: '', kategori: 'Tajwid Dasar', deskripsi: '', tujuan: '', sasaran: '',
      kkm: 75, bertahap: true, latihan: true, asesmenPraktik: true, remedial: true, ujianAkhir: true, sertifikat: true, status: 'Aktif',
      tipeMateri: 'Cetak', modulId: '',
      aspekPenilaianList: [...DEFAULT_ASPEK_LIST],
      cetakInfo: { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' }
    });
  };

  const handleUpdateProgramAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    await updateProgram(selectedProgram.id, selectedProgram);
    setIsModalOpen(false);
  };

  const handleCreateBabAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    await createProgramBab({
      ...babForm,
      programId: selectedProgram.id
    });
    setIsModalOpen(false);
    setBabForm({ programId: '', judul: '', tujuanPembelajaran: '', indikator: '', estimasiWaktu: '2 Jam', urutan: 1 });
  };

  const handleMateriSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !selectedBab) return;

    const finalCetakInfo = {
      ...(selectedProgram.cetakInfo || { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' }),
      bab: materiForm.cetakInfo?.bab || '',
      halaman: materiForm.cetakInfo?.halaman || '',
    };

    const targetAspekSelected = (modalType === 'create_praktik' || modalType === 'edit_praktik')
      ? (materiForm.aspekPenilaianSelected && materiForm.aspekPenilaianSelected.length > 0 
          ? materiForm.aspekPenilaianSelected 
          : (selectedProgram.aspekPenilaianList && selectedProgram.aspekPenilaianList.length > 0 
              ? [...selectedProgram.aspekPenilaianList] 
              : [...DEFAULT_ASPEK_LIST]))
      : [];

    if ((modalType === 'edit_materi' || modalType === 'edit_praktik') && editingMateriId) {
      await updateProgramMateri(editingMateriId, {
        judul: materiForm.judul,
        cetakInfo: finalCetakInfo,
        isPraktik: modalType === 'edit_praktik' ? true : (materiForm.isPraktik || false),
        praktikPetunjuk: materiForm.praktikPetunjuk || '',
        aspekPenilaianSelected: targetAspekSelected
      });
    } else {
      const isPrk = modalType === 'create_praktik' || materiForm.isPraktik;
      await createProgramMateri({
        babId: selectedBab.id,
        programId: selectedProgram.id,
        judul: materiForm.judul,
        tipe: isPrk ? 'Audio' : (selectedProgram.tipeMateri || 'Cetak'),
        modulId: selectedProgram.modulId || '',
        cetakInfo: finalCetakInfo,
        urutan: 1,
        isPraktik: isPrk || false,
        praktikPetunjuk: materiForm.praktikPetunjuk || '',
        aspekPenilaianSelected: targetAspekSelected
      });
    }
    setIsModalOpen(false);
    setEditingMateriId(null);
    setMateriForm({
      babId: '', programId: '', judul: '', tipe: 'Cetak', modulId: '',
      cetakInfo: { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' },
      isPraktik: false, praktikPetunjuk: '',
      aspekPenilaianSelected: []
    });
  };

  const handleStartEditMateri = (materi: ProgramMateri) => {
    setEditingMateriId(materi.id);
    setMateriForm({
      babId: materi.babId,
      programId: materi.programId,
      judul: materi.judul,
      tipe: materi.tipe,
      modulId: materi.modulId || '',
      cetakInfo: materi.cetakInfo || { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' },
      isPraktik: materi.isPraktik || false,
      praktikPetunjuk: materi.praktikPetunjuk || '',
      aspekPenilaianSelected: materi.aspekPenilaianSelected || []
    });
    setModalType('edit_materi');
    setIsModalOpen(true);
  };

  const handleStartEditPraktik = (materi: ProgramMateri) => {
    setEditingMateriId(materi.id);
    setMateriForm({
      babId: materi.babId,
      programId: materi.programId,
      judul: materi.judul,
      tipe: materi.tipe,
      modulId: materi.modulId || '',
      cetakInfo: materi.cetakInfo || { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' },
      isPraktik: true,
      praktikPetunjuk: materi.praktikPetunjuk || '',
      aspekPenilaianSelected: materi.aspekPenilaianSelected || []
    });
    setModalType('edit_praktik');
    setIsModalOpen(true);
  };

  const handleStartEditLatihan = (latihan: ProgramLatihan) => {
    setEditingLatihanId(latihan.id);
    setLatihanForm({
      babId: latihan.babId,
      programId: latihan.programId,
      tipe: latihan.tipe,
      pertanyaan: latihan.pertanyaan,
      opsi: latihan.opsi || ['', '', '', ''],
      jawabanBenar: latihan.jawabanBenar,
      urutan: latihan.urutan
    });
    setModalType('edit_latihan');
    setIsModalOpen(true);
  };

  const handleStartEditAsesmen = (asesmen: ProgramAsesmenKognitifQuestion) => {
    setEditingAsesmenId(asesmen.id);
    setAsesmenForm({
      babId: asesmen.babId,
      programId: asesmen.programId,
      tipe: asesmen.tipe,
      pertanyaan: asesmen.pertanyaan,
      opsi: asesmen.opsi || ['', '', '', ''],
      jawabanBenar: asesmen.jawabanBenar,
      bobot: asesmen.bobot || 10,
      urutan: asesmen.urutan
    });
    setModalType('edit_asesmen');
    setIsModalOpen(true);
  };

  const handleLatihanSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !selectedBab) return;

    if (modalType === 'edit_latihan' && editingLatihanId) {
      await updateProgramLatihan(editingLatihanId, {
        ...latihanForm
      });
    } else {
      await createProgramLatihan({
        ...latihanForm,
        babId: selectedBab.id,
        programId: selectedProgram.id
      });
    }
    setIsModalOpen(false);
    setEditingLatihanId(null);
  };

  const handleAsesmenSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !selectedBab) return;

    let finalForm = { ...asesmenForm };
    if (finalForm.tipe === 'rumpang' || finalForm.tipe === 'esai') {
      finalForm.opsi = [];
    } else if (finalForm.tipe === 'benar_salah') {
      finalForm.opsi = ['Benar', 'Salah'];
    }

    if (modalType === 'edit_asesmen' && editingAsesmenId) {
      await updateProgramAsesmen(editingAsesmenId, {
        ...finalForm
      });
    } else {
      await createProgramAsesmen({
        ...finalForm,
        babId: selectedBab.id,
        programId: selectedProgram.id
      });
    }
    setIsModalOpen(false);
    setEditingAsesmenId(null);
  };

  const handleSaveAsesmenSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !selectedBab) return;

    const existing = programAsesmenSettings.find(s => s.babId === selectedBab.id);
    await saveProgramAsesmenSetting({
      id: existing?.id || `setting-${selectedBab.id}`,
      babId: selectedBab.id,
      programId: selectedProgram.id,
      durasi: asesmenSettingForm.durasi || 15,
      jumlahSoal: asesmenSettingForm.jumlahSoal || 5,
      acakSoal: asesmenSettingForm.acakSoal !== false,
      acakJawaban: asesmenSettingForm.acakJawaban === true,
      bobotNilai: asesmenSettingForm.bobotNilai || 50,
      antiCheatEnabled: asesmenSettingForm.antiCheatEnabled !== false,
      maxViolations: asesmenSettingForm.maxViolations || 3,
      requireFullscreen: asesmenSettingForm.requireFullscreen !== false,
      blockCopyPaste: asesmenSettingForm.blockCopyPaste !== false,
      petunjukKejujuran: asesmenSettingForm.petunjukKejujuran || DEFAULT_PETUNJUK_KEJUJURAN
    });

    setIsModalOpen(false);
    alert('Pengaturan CBT dan Proteksi Anti-Curang berhasil disimpan!');
  };

  const handleEnrollStudentAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const siswaObj = siswas.find(s => s.id === enrollForm.siswaId);
    const progObj = programs.find(p => p.id === enrollForm.programId);
    if (!siswaObj || !progObj) return;

    await createProgramEnrollment({
      programId: progObj.id,
      programNama: progObj.nama,
      siswaId: siswaObj.id,
      siswaNama: siswaObj.namaLengkap,
      siswaNis: siswaObj.nis || '000000',
      halaqahId: siswaObj.halaqahId || 'default',
      halaqahNama: siswaObj.halaqahNama || 'Halaqah Umum',
      status: 'Peserta Aktif',
      tanggalDaftar: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      progressPercent: 0,
      babProgress: {},
      lulusProgram: false,
      sertifikatTerbit: false
    });
    setIsModalOpen(false);
    setEnrollForm({ siswaId: '', programId: '' });
  };

  // Safe Print / PDF Download Helper
  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6" id="program-keilmuan-lms">
      
      {/* Header Panel */}
      <header className="mb-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-white/10 rounded-xl border border-white/20 shadow-inner">
            <GraduationCap className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Sistem Program Keilmuan</h1>
            <p className="text-xs text-emerald-100 font-medium mt-1">Learning Management System (LMS) Ponpes Terintegrasi</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => openModal('create_program')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Program
            </button>
            <button
              onClick={() => openModal('enroll_student')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" /> Daftarkan Siswa
            </button>
          </div>
        )}
      </header>

      {/* ADMIN WORKSPACE VIEWS */}
      {isAdmin && (
        <>
          {activeSubTab === 'program-list' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {programs.map(prog => {
                  const numBabs = programBabs.filter(b => b.programId === prog.id).length;
                  const numStudents = programEnrollments.filter(e => e.programId === prog.id).length;
                  return (
                    <div key={prog.id} className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 hover:scale-[1.01]">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{prog.kategori}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            prog.status === 'Aktif' ? 'bg-emerald-100 text-emerald-850' : 'bg-slate-100 text-slate-500'
                          }`}>{prog.status}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{prog.nama}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">{prog.deskripsi}</p>
                        
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-4">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            <span>{numBabs} Bab</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{numStudents} Peserta</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProgram(prog);
                            setActiveSubTab('program-detail');
                          }}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Kelola Bab & Materi
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProgram(prog);
                            setProgForm(prog);
                            openModal('edit_program');
                          }}
                          className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 rounded-xl transition"
                          title="Ubah Program"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete({
                              type: 'program',
                              id: prog.id,
                              title: `Program "${prog.nama}"`,
                              desc: `Deskripsi: ${prog.deskripsi || '-'}`
                            });
                          }}
                          className="p-2 border border-rose-100 dark:border-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/10 text-rose-500 rounded-xl transition cursor-pointer"
                          title="Hapus Program"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Enrollments tracking */}
              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-4">Daftar Pendaftaran Aktif</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-450">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase tracking-widest text-[9px] font-mono font-bold text-slate-450 border-b border-slate-150 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Siswa</th>
                        <th className="px-4 py-3">Program</th>
                        <th className="px-4 py-3">Tanggal Daftar</th>
                        <th className="px-4 py-3">Progress</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {programEnrollments.map(enroll => (
                        <tr key={enroll.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                            <div>{enroll.siswaNama}</div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">NIS: {enroll.siswaNis}</span>
                          </td>
                          <td className="px-4 py-3">{enroll.programNama}</td>
                          <td className="px-4 py-3">{enroll.tanggalDaftar}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600">{enroll.progressPercent}%</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-850 text-[10px] font-semibold">{enroll.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDelete({
                                  type: 'enrollment',
                                  id: enroll.id,
                                  title: `Pendaftaran Santri: ${enroll.siswaNama}`,
                                  desc: `Program: ${enroll.programNama} (NIS: ${enroll.siswaNis})`
                                });
                              }}
                              className="text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                            >
                              Keluarkan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Program Detail View (Admin) */}
          {activeSubTab === 'program-detail' && selectedProgram && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setActiveSubTab('program-list')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Program
                </button>
                <button
                  onClick={() => openModal('create_bab')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tambah Bab Baru
                </button>
              </div>

              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">{selectedProgram.nama}</h2>
                <p className="text-xs text-slate-450 leading-relaxed max-w-3xl">{selectedProgram.deskripsi}</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Daftar Bab Kurikulum</span>
                      <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full lowercase">
                        {programBabs.filter(b => b.programId === selectedProgram.id).length} bab
                      </span>
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => expandAllBabs(programBabs.filter(b => b.programId === selectedProgram.id))}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Buka semua bab dan seluruh rincian bagian"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5 text-emerald-600" /> Buka Semua
                    </button>
                    <button
                      onClick={() => collapseAllBabs(programBabs.filter(b => b.programId === selectedProgram.id))}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Tutup semua bab kurikulum"
                    >
                      <ChevronsDownUp className="w-3.5 h-3.5 text-slate-500" /> Tutup Semua
                    </button>
                  </div>
                </div>
                
                {programBabs.filter(b => b.programId === selectedProgram.id).map(bab => {
                  const bMateris = programMateris.filter(m => m.babId === bab.id);
                  const standardMateris = programMateris.filter(m => m.babId === bab.id && !m.isPraktik);
                  const praktikMateris = programMateris.filter(m => m.babId === bab.id && m.isPraktik);
                  const bLatihans = programLatihans.filter(l => l.babId === bab.id);
                  const bAsesmens = programAsesmens.filter(a => a.babId === bab.id);

                  const isBabCollapsed = !!collapsedBabs[bab.id];
                  const isMateriCollapsed = !!collapsedSections[`${bab.id}_materi`];
                  const isAsesmenCollapsed = !!collapsedSections[`${bab.id}_asesmen`];
                  const isPraktikCollapsed = !!collapsedSections[`${bab.id}_praktik`];

                  return (
                    <div key={bab.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 overflow-hidden shadow-xs transition-all">
                      {/* Header Bab (Expand / Collapse Trigger) */}
                      <div 
                        onClick={() => toggleBabCollapse(bab.id)}
                        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-150 dark:border-slate-850 cursor-pointer select-none hover:bg-slate-100/70 dark:hover:bg-slate-900/70 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            {bab.urutan}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                                BAB {bab.urutan}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                {bab.judul}
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="text-[11px] text-slate-400">
                                Estimasi: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{bab.estimasiWaktu}</strong>
                              </span>
                              <span className="text-slate-300 dark:text-slate-750">•</span>
                              <span className="text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.2 rounded-md border border-emerald-150 dark:border-emerald-900/40">
                                📚 {standardMateris.length} Materi
                              </span>
                              <span className="text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.2 rounded-md border border-indigo-150 dark:border-indigo-900/40">
                                📝 {bAsesmens.length} Soal CBT
                              </span>
                              <span className="text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 px-2 py-0.2 rounded-md border border-amber-150 dark:border-amber-900/40">
                                🎙️ {praktikMateris.length} Praktik
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBab(bab);
                              setMateriForm({
                                babId: bab.id,
                                programId: selectedProgram.id,
                                judul: '',
                                tipe: selectedProgram.tipeMateri || 'Cetak',
                                modulId: selectedProgram.modulId || '',
                                cetakInfo: { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' },
                                urutan: standardMateris.length + 1
                              });
                              setEditingMateriId(null);
                              openModal('create_materi');
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Materi
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete({
                                type: 'bab',
                                id: bab.id,
                                title: `Bab: "${bab.judul}"`,
                                desc: (bab as any).deskripsi || bab.tujuanPembelajaran
                              });
                            }}
                            className="p-1.5 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Bab"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>

                          <div 
                            className="p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform"
                            title={isBabCollapsed ? "Buka Bab" : "Tutup Bab"}
                          >
                            {isBabCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Isi Detail Bab (Collapsible) */}
                      {!isBabCollapsed && (
                        <div className="p-5 sm:p-6 space-y-6 bg-white dark:bg-slate-950">
                          {/* Section 1: Materi Pembelajaran (Collapsible Section) */}
                          <div className="bg-slate-50/70 dark:bg-slate-900/30 rounded-2xl border border-slate-150 dark:border-slate-800/60 overflow-hidden transition-all shadow-2xs">
                            {/* Section 1 Header */}
                            <div 
                              onClick={() => toggleSectionCollapse(`${bab.id}_materi`)}
                              className="p-4 flex flex-wrap justify-between items-center gap-3 cursor-pointer select-none bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 border-b border-slate-100 dark:border-slate-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-black tracking-wide uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>Materi Pembelajaran</span>
                                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.2 rounded-full lowercase">
                                      {standardMateris.length} materi
                                    </span>
                                  </h5>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    Materi teori, teks, PDF, audio atau referensi kitab cetak
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBab(bab);
                                    setMateriForm({
                                      babId: bab.id,
                                      programId: selectedProgram.id,
                                      judul: '',
                                      tipe: selectedProgram.tipeMateri || 'Cetak',
                                      modulId: selectedProgram.modulId || '',
                                      cetakInfo: { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' },
                                      urutan: standardMateris.length + 1
                                    });
                                    setEditingMateriId(null);
                                    openModal('create_materi');
                                  }}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Tambah Materi
                                </button>
                                
                                <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                  {isMateriCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Section 1 Content */}
                            {!isMateriCollapsed && (
                              <div className="p-4 sm:p-5">
                                {standardMateris.length === 0 ? (
                                  <div className="p-6 rounded-xl bg-white dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                    <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                    <p className="text-xs text-slate-400 font-medium">Belum ada materi pembelajaran pada bab ini.</p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {standardMateris.map((m, idx) => (
                                      <div key={m.id} className="p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex justify-between items-start gap-3 shadow-2xs hover:border-emerald-200 dark:hover:border-emerald-800/40 transition-all">
                                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            {idx + 1}
                                          </span>
                                          <div className="min-w-0 flex-1 space-y-1">
                                            <div className="font-bold text-slate-850 dark:text-slate-100 leading-snug break-words">
                                              {m.judul}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                {m.tipe}
                                              </span>
                                              {m.cetakInfo?.namaBuku && (
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                  📖 {m.cetakInfo.namaBuku}
                                                </span>
                                              )}
                                              {m.cetakInfo?.bab && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                  ({m.cetakInfo.bab}{m.cetakInfo.halaman ? ` • Hal. ${m.cetakInfo.halaman}` : ''})
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0 pt-0.5">
                                          <button 
                                            onClick={() => {
                                              setSelectedBab(bab);
                                              handleStartEditMateri(m);
                                            }} 
                                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer" 
                                            title="Ubah Materi"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setConfirmDelete({
                                                type: 'materi',
                                                id: m.id,
                                                title: `Materi: "${m.judul}"`,
                                                desc: (m as any).ringkasan || "Materi Pembelajaran"
                                              });
                                            }} 
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer" 
                                            title="Hapus Materi"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Section 2: Soal Ujian Kognitif (CBT) (Collapsible Section) */}
                          <div className="bg-slate-50/70 dark:bg-slate-900/30 rounded-2xl border border-slate-150 dark:border-slate-800/60 overflow-hidden transition-all shadow-2xs">
                            {/* Section 2 Header */}
                            <div 
                              onClick={() => toggleSectionCollapse(`${bab.id}_asesmen`)}
                              className="p-4 flex flex-wrap justify-between items-center gap-3 cursor-pointer select-none bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 border-b border-slate-100 dark:border-slate-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                                  <Sliders className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-black tracking-wide uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>Soal Ujian Kognitif (CBT)</span>
                                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.2 rounded-full lowercase">
                                      {bAsesmens.length} butir soal
                                    </span>
                                  </h5>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    Evaluasi pilihan ganda, benar-salah, rumpang, atau esai
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBab(bab);
                                    setAsesmenForm({ babId: bab.id, programId: selectedProgram.id, tipe: 'pilihan_ganda', pertanyaan: '', opsi: ['', '', '', ''], jawabanBenar: '', bobot: 10, urutan: bAsesmens.length + 1 });
                                    setEditingAsesmenId(null);
                                    openModal('create_asesmen');
                                  }}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Tambah Soal
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBab(bab);
                                    const existing = programAsesmenSettings.find(s => s.babId === bab.id);
                                    setAsesmenSettingForm(existing || {
                                      id: `${selectedProgram.id}_${bab.id}`,
                                      programId: selectedProgram.id,
                                      babId: bab.id,
                                      jumlahSoal: Math.max(1, bAsesmens.length || 5),
                                      durasi: 15,
                                      acakSoal: true,
                                      acakJawaban: false,
                                      bobotNilai: 50,
                                      antiCheatEnabled: selectedProgram.antiCheatEnabled !== false,
                                      maxViolations: selectedProgram.maxViolations || 3,
                                      requireFullscreen: selectedProgram.requireFullscreen !== false,
                                      blockCopyPaste: selectedProgram.blockCopyPaste !== false,
                                      petunjukKejujuran: selectedProgram.petunjukKejujuran || DEFAULT_PETUNJUK_KEJUJURAN
                                    });
                                    openModal('edit_asesmen_setting');
                                  }}
                                  className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-250 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="Pengaturan CBT, Durasi, Acak Soal & Anti-Curang"
                                >
                                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Atur CBT & Proteksi
                                </button>
                                
                                <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                  {isAsesmenCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Section 2 Content */}
                            {!isAsesmenCollapsed && (
                              <div className="p-4 sm:p-5">
                                {bAsesmens.length === 0 ? (
                                  <div className="p-6 rounded-xl bg-white dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                    <Sliders className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                    <p className="text-xs text-slate-400 font-medium">Belum ada butir soal ujian kognitif pada bab ini.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2.5">
                                    {bAsesmens.map((a, idx) => (
                                      <div key={a.id} className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex justify-between items-start gap-3 shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                          <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                            {idx + 1}
                                          </span>
                                          <div className="flex-1 space-y-2 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                {a.tipe === 'benar_salah' ? 'Benar-Salah' : a.tipe === 'rumpang' ? 'Isian Rumpang' : a.tipe === 'esai' ? 'Esay' : 'Pilihan Ganda'}
                                              </span>
                                              {a.bobot !== undefined && (
                                                <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded">
                                                  Bobot: {a.bobot}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-slate-850 dark:text-slate-200 font-semibold text-xs leading-relaxed break-words">
                                              {a.pertanyaan}
                                            </p>
                                            <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-100 dark:border-slate-850">
                                              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-md font-bold uppercase">
                                                Kunci Jawaban: {Array.isArray(a.jawabanBenar) ? a.jawabanBenar.join(', ') : a.jawabanBenar}
                                              </span>
                                              {a.tipe === 'pilihan_ganda' && a.opsi && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                  ({a.opsi.filter(Boolean).length} opsi pilihan)
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex gap-1 shrink-0 pt-0.5">
                                          <button 
                                            onClick={() => {
                                              setSelectedBab(bab);
                                              handleStartEditAsesmen(a);
                                            }} 
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer" 
                                            title="Ubah Soal"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setConfirmDelete({
                                                type: 'asesmen',
                                                id: a.id,
                                                title: `Soal Ujian: "${a.pertanyaan}"`,
                                                desc: `Tipe: ${a.tipe}`
                                              });
                                            }} 
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer" 
                                            title="Hapus Soal"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Section 3: Tugas Praktik Audio (Collapsible Section) */}
                          <div className="bg-slate-50/70 dark:bg-slate-900/30 rounded-2xl border border-slate-150 dark:border-slate-800/60 overflow-hidden transition-all shadow-2xs">
                            {/* Section 3 Header */}
                            <div 
                              onClick={() => toggleSectionCollapse(`${bab.id}_praktik`)}
                              className="p-4 flex flex-wrap justify-between items-center gap-3 cursor-pointer select-none bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 border-b border-slate-100 dark:border-slate-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                                  <Mic className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-black tracking-wide uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>Tugas Praktik Audio (Setoran Lisan)</span>
                                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.2 rounded-full lowercase">
                                      {praktikMateris.length} tugas praktik
                                    </span>
                                  </h5>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    Setoran rekaman bacaan/suara santri untuk dinilai asatidz
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBab(bab);
                                    setMateriForm({
                                      babId: bab.id,
                                      programId: selectedProgram.id,
                                      judul: '',
                                      tipe: 'Audio',
                                      modulId: selectedProgram.modulId || '',
                                      cetakInfo: { namaBuku: '', penulis: '', penerbit: '', tahunTerbit: '2026', edisi: 'Cetakan ke-1', bab: '', halaman: '', catatan: '' },
                                      urutan: praktikMateris.length + 1,
                                      isPraktik: true,
                                      praktikPetunjuk: ''
                                    });
                                    setEditingMateriId(null);
                                    openModal('create_praktik');
                                  }}
                                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Tambah Tugas Praktik
                                </button>
                                
                                <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                  {isPraktikCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Section 3 Content */}
                            {!isPraktikCollapsed && (
                              <div className="p-4 sm:p-5">
                                {praktikMateris.length === 0 ? (
                                  <div className="p-6 rounded-xl bg-white dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                    <Mic className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                    <p className="text-xs text-slate-400 font-medium">Belum ada tugas praktik audio pada bab ini.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2.5">
                                    {praktikMateris.map((m, idx) => (
                                      <div key={m.id} className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex justify-between items-start gap-3 shadow-2xs hover:border-amber-200 dark:hover:border-amber-800/40 transition-all">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                          <span className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                            {idx + 1}
                                          </span>
                                          <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="font-bold text-slate-850 dark:text-slate-100 text-xs leading-snug">
                                              {m.judul}
                                            </div>
                                            {m.praktikPetunjuk && (
                                              <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30 leading-relaxed font-normal">
                                                <span className="font-semibold text-amber-800 dark:text-amber-300">Instruksi Santri: </span>
                                                "{m.praktikPetunjuk}"
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0 pt-0.5">
                                          <button 
                                            onClick={() => {
                                              setSelectedBab(bab);
                                              handleStartEditPraktik(m);
                                            }} 
                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer" 
                                            title="Ubah Tugas Praktik"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setConfirmDelete({
                                                type: 'materi',
                                                id: m.id,
                                                title: `Tugas Praktik: "${m.judul}"`,
                                                desc: (m as any).ringkasan || "Tugas Praktik"
                                              });
                                            }} 
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer" 
                                            title="Hapus Tugas Praktik"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* GURU WORKSPACE VIEWS */}
      {isGuru && (
        <div className="space-y-6">
          {activeSubTab === 'guru-list' && (
            <div className="space-y-6">
              {/* NOTIFIKASI BACAAN SISWA / PEMBERITAHUAN SELESAI MEMBACA */}
              <div className="bg-white dark:bg-slate-950 p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-100/80 dark:border-emerald-950/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center relative shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                      <Bell className="w-5 h-5" />
                      {readingNotifications.filter(n => !n.readByGuru).length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow animate-pulse">
                          {readingNotifications.filter(n => !n.readByGuru).length}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Pemberitahuan Bacaan Materi Siswa</h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                          {readingNotifications.filter(n => !n.readByGuru).length} Baru
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Notifikasi otomatis ketika santri/siswa mengklik <strong>"Tandai Selesai Membaca"</strong> pada modul teori.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <button
                        type="button"
                        onClick={() => setReadingNotifFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition ${readingNotifFilter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900'}`}
                      >
                        Semua ({readingNotifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingNotifFilter('unread')}
                        className={`px-2.5 py-1 rounded-lg transition ${readingNotifFilter === 'unread' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'hover:text-slate-900'}`}
                      >
                        Belum Dilihat ({readingNotifications.filter(n => !n.readByGuru).length})
                      </button>
                    </div>

                    {readingNotifications.filter(n => !n.readByGuru).length > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllReadingsAsRead}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                        title="Tandai semua notifikasi telah dilihat"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tandai Dilihat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stream of reading notification items */}
                {(() => {
                  const filtered = readingNotifications.filter(n => {
                    if (readingNotifFilter === 'unread') return !n.readByGuru;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        <BookOpenCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700 opacity-60" />
                        <p>Belum ada aktivitas bacaan baru dari siswa.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {filtered.slice(0, 10).map(notif => {
                        const prog = programs.find(p => p.id === notif.programId);
                        const enroll = programEnrollments.find(e => e.id === notif.enrollmentId);

                        return (
                          <div
                            key={notif.id}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                              !notif.readByGuru
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/90 dark:border-emerald-800/70 shadow-xs'
                                : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-150/70 dark:border-slate-800/50 opacity-85'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                  !notif.readByGuru 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                  <BookOpenCheck className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">{notif.siswaNama}</span>
                                    <span className="text-[10px] text-slate-400">({notif.siswaNis})</span>
                                    {!notif.readByGuru && (
                                      <span className="text-[8.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.2 rounded uppercase tracking-wider">
                                        Baru Selesai
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-slate-750 dark:text-slate-200 line-clamp-1">
                                    📖 {notif.materiJudul}
                                  </p>
                                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                    {notif.programNama} &bull; {notif.babJudul}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium block">
                                  {notif.timestamp}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Selesai Membaca Modul Teori
                              </span>

                              <div className="flex items-center gap-1.5">
                                {!notif.readByGuru && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkReadingAsRead(notif)}
                                    className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                                    title="Tandai sudah diperiksa"
                                  >
                                    Sudah Dilihat
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (enroll) {
                                      handleMarkReadingAsRead(notif);
                                      setGradingEnrollment(enroll);
                                      setSelectedProgram(prog || null);
                                      setActiveSubTab('guru-enrollment-detail');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition shadow-xs flex items-center gap-1"
                                >
                                  <span>Lihat Siswa</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* TABLE PENILAIAN PROGRESS SISWA */}
              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Daftar Penilaian Progress Program Siswa</h2>
                  <span className="text-xs text-slate-400 font-medium">{programEnrollments.length} Siswa Terdaftar</span>
                </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-450">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase tracking-widest text-[9px] font-mono font-bold text-slate-450 border-b border-slate-150 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Siswa</th>
                      <th className="px-4 py-3">Program Keilmuan</th>
                      <th className="px-4 py-3">Progress & Bacaan</th>
                      <th className="px-4 py-3">Ujian Akhir</th>
                      <th className="px-4 py-3">Status Sertifikat</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {programEnrollments.map(enroll => {
                      const prog = programs.find(p => p.id === enroll.programId);
                      const progTheoryMateris = programMateris.filter(m => m.programId === enroll.programId && !m.isPraktik);
                      const totalTheoryCount = progTheoryMateris.length;
                      const completedReadingCount = Object.values(enroll.babProgress || {}).reduce((acc: number, b: any) => acc + (b.completedMateriIds?.length || 0), 0);

                      return (
                        <tr key={enroll.id}>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{enroll.siswaNama}</span>
                              <div className="text-[10px] text-slate-400">NIS: {enroll.siswaNis}</div>
                              {enroll.lastReadingUpdate && (
                                <div className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded w-max mt-1 border border-emerald-200/60 dark:border-emerald-900/40" title={`Selesai membaca: ${enroll.lastReadingUpdate.materiJudul} (${enroll.lastReadingUpdate.timestamp})`}>
                                  <BookOpenCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="max-w-[160px] truncate">Dibaca: {enroll.lastReadingUpdate.materiJudul}</span>
                                </div>
                              )}
                              {Object.values(enroll.babProgress || {}).some((b: any) => b.praktikStatus === 'Perlu Penilaian') && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded w-max mt-1 animate-pulse border border-amber-100 dark:border-amber-900/40">
                                  🎙️ Setoran Audio Perlu Dinilai
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{enroll.programNama}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${enroll.progressPercent}%` }} />
                                </div>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{enroll.progressPercent}%</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-emerald-600" />
                                <span>Bacaan: <strong className="text-slate-700 dark:text-slate-200">{completedReadingCount}/{totalTheoryCount}</strong> Teori</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold">{enroll.ujianAkhirStatus || 'Belum Mengikuti'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {enroll.sertifikatTerbit ? (
                              <span className="inline-block text-[10px] text-emerald-600 font-bold">Terbit: {enroll.sertifikatNo}</span>
                            ) : (
                              <span className="inline-block text-[10px] text-slate-400 italic">Belum Diterbitkan</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setGradingEnrollment(enroll);
                                setSelectedProgram(prog || null);
                                setActiveSubTab('guru-enrollment-detail');
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Periksa Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {/* Guru Enrollment Detail Grading Panel */}
          {activeSubTab === 'guru-enrollment-detail' && (() => {
            const currentProgram = selectedProgram || (gradingEnrollment ? programs.find(p => p.id === gradingEnrollment.programId) : null);
            if (!gradingEnrollment || !currentProgram) {
              return (
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center py-10 space-y-3">
                  <p className="text-xs text-slate-500">Data siswa tidak ditemukan atau telah diperbarui.</p>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('guru-list')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Siswa
                  </button>
                </div>
              );
            }

            return (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setGradingEnrollment(null);
                    setActiveSubTab('guru-list');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
              </div>

              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-black text-slate-900 dark:text-white">{gradingEnrollment.siswaNama}</h2>
                <p className="text-xs text-slate-500 mt-1">Mengikuti Program: <strong className="text-slate-700 dark:text-slate-300">{gradingEnrollment.programNama}</strong></p>
                
                {gradingEnrollment.lulusProgram && (
                  <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-xs font-semibold flex justify-between items-center gap-4">
                    <span>Siswa telah menyelesaikan semua Bab program ini! Anda dapat menerbitkan Syahadah resmi sekarang.</span>
                    {!gradingEnrollment.sertifikatTerbit ? (
                      <button
                        onClick={() => handleIssueCertificate(gradingEnrollment)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shrink-0 shadow"
                      >
                        Terbitkan Syahadah
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setCertEnrollment(gradingEnrollment);
                          setActiveSubTab('siswa-syahadah');
                        }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold shrink-0 shadow flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> Lihat Syahadah
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress per Bab */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Kemajuan Bab Kurikulum</h3>
                
                {programBabs.filter(b => b.programId === currentProgram.id).map(bab => {
                  const bProgress = gradingEnrollment.babProgress[bab.id] || {
                    completedMateriIds: [], latihanCompleted: false, lulusBab: false
                  };

                  return (
                    <div key={bab.id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded tracking-wider uppercase">Bab {bab.urutan}</span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{bab.judul}</h4>
                          
                          <div className="flex gap-4 mt-2 text-[11px] text-slate-450 dark:text-slate-400 font-medium flex-wrap">
                            <span>Materi: {bProgress.completedMateriIds?.length || 0} Terbaca</span>
                            <span>
                              Ujian Teori: <strong className="text-slate-700 dark:text-slate-300">{bProgress.kognitifScore !== undefined ? `${bProgress.kognitifScore}%` : '-'}</strong>
                              {bProgress.kognitifStatus && (
                                <span className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${bProgress.kognitifStatus === 'Lulus' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {bProgress.kognitifStatus}
                                </span>
                              )}
                              {(bProgress as any).violationCount !== undefined && (bProgress as any).violationCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-0.5" title={`${(bProgress as any).violationCount}x terdeteksi pindah tab`}>
                                  <ShieldAlert className="w-2.5 h-2.5" /> {(bProgress as any).violationCount}x Peringatan
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Kognitif CBT Review Action */}
                          {bProgress.kognitifScore !== undefined && bProgress.kognitifQuestions && bProgress.kognitifQuestions.length > 0 && (
                            <button
                              onClick={() => {
                                setReviewingBabId(bab.id);
                                setTempCorrections(bProgress.kognitifManualCorrections || {});
                                setActiveSubTab('guru-cbt-review');
                              }}
                              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/50 cursor-pointer"
                            >
                              🔍 Periksa Ujian CBT
                            </button>
                          )}

                          <div className="text-right">
                            <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Status Praktik</div>
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold mt-1 ${
                              bProgress.praktikStatus === 'Perlu Penilaian' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                              bProgress.praktikStatus === 'Lulus' ? 'bg-emerald-100 text-emerald-850' : 'bg-slate-100 text-slate-500'
                            }`}>{bProgress.praktikStatus || 'Belum Mengikuti'}</span>
                          </div>

                          {bProgress.praktikStatus === 'Perlu Penilaian' && (
                            <button
                              onClick={() => {
                                setGradingBabId(bab.id);
                                const activeAspects = getTaskAspects(undefined, gradingEnrollment.programId);
                                setGradingRubric({
                                  ...activeAspects.reduce((acc, asp) => ({ ...acc, [asp]: 80 }), {}),
                                  catatan: ''
                                });
                                setActiveSubTab('guru-rubric-grading');
                              }}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-xs shadow-md"
                            >
                              Nilai Praktik
                            </button>
                          )}
                        </div>
                      </div>

                      {/* List of completed/pending reading material status */}
                      <div className="pt-3 border-t border-slate-50 dark:border-slate-900/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Rincian Pembelajaran & Bacaan Siswa</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {bProgress.completedMateriIds?.length || 0}/{programMateris.filter(m => m.babId === bab.id && !m.isPraktik).length} Modul Teori Selesai
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {programMateris.filter(m => m.babId === bab.id).map(m => {
                            const isRead = bProgress.completedMateriIds?.includes(m.id);
                            const readTime = bProgress.readingTimes?.[m.id];
                            const mPraktik = bProgress.materiPraktikProgress?.[m.id];
                            const pStatus = mPraktik?.status || (m.isPraktik ? 'Belum Mengikuti' : null);

                            return (
                              <div 
                                key={m.id} 
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border gap-3 ${
                                  isRead && !m.isPraktik
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/60'
                                    : m.isPraktik 
                                      ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.01] border-amber-200/60 dark:border-amber-950/50' 
                                      : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100/50 dark:border-slate-800/40'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRead ? 'bg-emerald-500 shadow-xs' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{m.judul}</p>
                                      {m.isPraktik ? (
                                        <span className="text-[8px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.2 rounded font-black uppercase">Praktik Audio</span>
                                      ) : (
                                        <span className="text-[8px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.2 rounded font-bold uppercase">Teori</span>
                                      )}
                                    </div>
                                    {isRead && readTime && (
                                      <p className="text-[9px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
                                        <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> Selesai Dibaca: {readTime}
                                      </p>
                                    )}
                                    {!isRead && !m.isPraktik && (
                                      <p className="text-[9px] text-slate-400 italic mt-0.5">Belum dibaca oleh siswa</p>
                                    )}
                                    {pStatus && (
                                      <div className="flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] text-slate-400 font-semibold">Tugas:</span>
                                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                            pStatus === 'Lulus' ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                            pStatus === 'Perlu Penilaian' ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse' :
                                            pStatus === 'Belum Lulus' ? 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' :
                                            'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                          }`}>
                                            {pStatus === 'Belum Mengikuti' ? 'Belum Dikirim' : pStatus}
                                          </span>
                                        </div>
                                        {pStatus === 'Perlu Penilaian' && ((mPraktik as any)?.submittedAtIso || mPraktik?.submittedAt) && (() => {
                                          const submittedDate = new Date((mPraktik as any)?.submittedAtIso || mPraktik?.submittedAt || '');
                                          const expiryDate = new Date(submittedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                                          const diffTime = expiryDate.getTime() - new Date().getTime();
                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                          const isExp = diffDays <= 0;
                                          return isExp ? (
                                            <span className="text-[8px] font-extrabold text-rose-605 uppercase tracking-widest leading-none">
                                              ⚠️ File Kedaluwarsa
                                            </span>
                                          ) : (
                                            <span className={`text-[8.5px] font-extrabold uppercase tracking-wide leading-none ${diffDays <= 2 ? 'text-rose-600 animate-bounce' : 'text-amber-600 dark:text-amber-400'}`}>
                                              ⏱️ Sisa: {diffDays} Hari
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  {m.isPraktik && pStatus && pStatus !== 'Belum Mengikuti' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGradingBabId(bab.id);
                                        setGradingMateriId(m.id);
                                        const activeAspects = getTaskAspects(m.id, gradingEnrollment.programId);
                                        setGradingRubric(mPraktik?.nilaiDetail ? {
                                          ...mPraktik.nilaiDetail,
                                          catatan: mPraktik.catatan || ''
                                        } : {
                                          ...activeAspects.reduce((acc, asp) => ({ ...acc, [asp]: 80 }), {}),
                                          catatan: ''
                                        });
                                        setActiveSubTab('guru-rubric-grading');
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                                        pStatus === 'Perlu Penilaian' 
                                          ? 'bg-amber-500 text-white hover:bg-amber-400 animate-pulse' 
                                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700'
                                      }`}
                                    >
                                      {pStatus === 'Perlu Penilaian' ? 'Nilai Setoran' : `Koreksi (${mPraktik?.nilai || 0}%)`}
                                    </button>
                                  )}
                                  <span className={`shrink-0 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                    isRead 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                      : 'bg-slate-100 text-slate-400 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                                  }`}>
                                    {isRead ? '✓ Selesai' : 'Belum'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DEDICATED AUDIT LOG / RIWAYAT BACAAN SISWA */}
              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpenCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log Notifikasi & Riwayat Bacaan Mandiri Siswa</h3>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                    Total: {Object.values(gradingEnrollment.babProgress || {}).reduce((acc: number, b: any) => acc + (b.completedMateriIds?.length || 0), 0)} Modul Selesai
                  </span>
                </div>

                {(() => {
                  const completedList: Array<{
                    materiJudul: string;
                    babJudul: string;
                    babUrutan: number;
                    timestamp: string;
                  }> = [];

                  Object.entries(gradingEnrollment.babProgress || {}).forEach(([babId, bProg]: [string, any]) => {
                    const bab = programBabs.find(b => b.id === babId);
                    const completedIds = bProg.completedMateriIds || [];
                    completedIds.forEach((mId: string) => {
                      const m = programMateris.find(mat => mat.id === mId);
                      if (m && !m.isPraktik) {
                        completedList.push({
                          materiJudul: m.judul,
                          babJudul: bab?.judul || `Bab ${bab?.urutan || ''}`,
                          babUrutan: bab?.urutan || 1,
                          timestamp: bProg.readingTimes?.[mId] || 'Waktu tercatat'
                        });
                      }
                    });
                  });

                  if (completedList.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic py-4">Siswa belum menandai materi teori manapun sebagai selesai dibaca.</p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {completedList.map((item, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                              ✓
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.materiJudul}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Bab {item.babUrutan}: {item.babJudul}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold shrink-0 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                            {item.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
            );
          })()}

          {/* Guru Rubric Grading Form */}
          {activeSubTab === 'guru-rubric-grading' && gradingEnrollment && gradingBabId && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 space-y-6 animate-fade-in">
              {(() => {
                const bProgress = gradingEnrollment.babProgress[gradingBabId];
                let title = "Lembar Penilaian Rubrik Asesmen Praktik Bab";
                let audioSrc = bProgress?.praktikFileBase64 || "";
                let fileName = bProgress?.praktikFileName || "tugas_praktik_bab.wav";
                let isLink = bProgress?.praktikFileType === 'link';

                // Scan fallback: if the Bab-level audio is not set, find the first submitted audio from materiPraktikProgress
                if (!audioSrc && bProgress?.materiPraktikProgress) {
                  const mProgressEntries = Object.entries(bProgress.materiPraktikProgress);
                  const foundEntry = mProgressEntries.find(([_, mProg]: any) => mProg && mProg.fileBase64);
                  if (foundEntry) {
                    const [foundMateriId, foundMProg]: [string, any] = foundEntry;
                    audioSrc = foundMProg.fileBase64;
                    fileName = foundMProg.fileName || "tugas_praktik_materi.wav";
                    isLink = foundMProg.fileType === 'link';
                    
                    // Auto-set the gradingMateriId if we are grading the Bab but it has specific materi tasks
                    if (!gradingMateriId) {
                      setTimeout(() => setGradingMateriId(foundMateriId), 10);
                    }
                  }
                }

                // If still empty, use default reliable fallback audio
                if (!audioSrc) {
                  audioSrc = "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/001001.mp3";
                  fileName = "tugas_praktik_default.mp3";
                }

                if (gradingMateriId) {
                  const m = programMateris.find(mat => mat.id === gradingMateriId);
                  if (m) {
                    title = `Lembar Penilaian Rubrik: ${m.judul}`;
                  }
                  const mProgress = bProgress?.materiPraktikProgress?.[gradingMateriId];
                  audioSrc = mProgress?.fileBase64 || "";
                  fileName = mProgress?.fileName || 'tugas_praktik_materi.wav';
                  isLink = mProgress?.fileType === 'link';
                }

                const submittedAtIso = gradingMateriId 
                  ? (bProgress?.materiPraktikProgress?.[gradingMateriId] as any)?.submittedAtIso 
                  : (bProgress as any)?.praktikSubmittedAtIso;
                
                const remainingDays = getRemainingDays(submittedAtIso);
                const isExpired = !!(submittedAtIso && remainingDays <= 0);

                return (
                  <>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2>
                    
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tugas Setoran Siswa:</span>
                      {isExpired ? (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-1.5">
                          <p className="text-xs font-black flex items-center gap-1.5 text-rose-700 dark:text-rose-400">⚠️ File Audio Telah Dihapus (Kedaluwarsa)</p>
                          <p className="text-[11px] leading-relaxed">
                            Maaf Ustadz/Ustadzah, file audio tugas ini telah <strong>melebihi batas penyimpanan 7 hari</strong> sehingga dihapus otomatis dari server demi menghemat storage. Anda masih dapat mengisi penilaian rubrik di bawah ini berdasarkan setoran langsung (Tatap Muka/Halaqah), atau meminta santri mengunggah rekaman baru.
                          </p>
                        </div>
                      ) : (
                        <>
                          {submittedAtIso && (
                            <div className={`p-2.5 rounded-xl text-[10px] font-extrabold flex items-center gap-2 border mb-2 ${
                              remainingDays <= 2 
                                ? 'bg-rose-50/90 text-rose-800 border-rose-150 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/60' 
                                : 'bg-amber-50/90 text-amber-800 border-amber-150 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/60'
                            }`}>
                              <span>⏱️ SISA WAKTU PENYIMPANAN:</span>
                              <span>Audio ini akan otomatis dihapus dalam <strong className="underline decoration-wavy">{remainingDays} Hari Lagi</strong>. Harap segera periksa dan beri nilai.</span>
                            </div>
                          )}
                          {isLink ? (
                            <div className="p-4 bg-amber-50/20 dark:bg-slate-900 border border-amber-100/50 dark:border-slate-800 rounded-2xl flex flex-col items-start gap-2.5">
                              <p className="text-xs text-slate-650 dark:text-slate-350 font-semibold">Siswa menyetor dalam bentuk tautan luar (Google Drive / Cloud):</p>
                              <a 
                                href={audioSrc} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition"
                              >
                                🔗 Buka Tautan Tugas Setoran Siswa
                              </a>
                            </div>
                          ) : (
                            <CustomAudioPlayer 
                              src={audioSrc} 
                              fileName={fileName} 
                            />
                          )}
                        </>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="space-y-4">
                {(() => {
                  const activeAspects = getTaskAspects(gradingMateriId || undefined, gradingEnrollment.programId);
                  const pgm = programs.find(p => p.id === gradingEnrollment.programId);
                  const currentKkm = pgm?.kkm || 75;

                  // Real-time calculation
                  const validScores = activeAspects
                    .map(asp => gradingRubric[asp])
                    .filter(v => v !== '' && v !== undefined && v !== null && !isNaN(Number(v)))
                    .map(v => Number(v));

                  const avgScore = validScores.length > 0 
                    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                    : null;
                  
                  const isPassing = avgScore !== null ? avgScore >= currentKkm : null;

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Isi Nilai Aspek (Skala 0 - 100)
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Hapus atau ubah angka sesuai hasil penilaian setoran santri.
                          </p>
                        </div>
                        
                        {/* Quick Action Toolbar: Clear all, Fill KKM, Fill 100 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const clearedAspects = activeAspects.reduce((acc, asp) => ({ ...acc, [asp]: '' }), {});
                              setGradingRubric(p => ({ ...p, ...clearedAspects }));
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Hapus / Kosongkan semua isian nilai angka"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Kosongkan Semua</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const kkmAspects = activeAspects.reduce((acc, asp) => ({ ...acc, [asp]: currentKkm }), {});
                              setGradingRubric(p => ({ ...p, ...kkmAspects }));
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title={`Isi semua nilai dengan batas KKM (${currentKkm})`}
                          >
                            <span>⚡ Isi KKM ({currentKkm})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const maxAspects = activeAspects.reduce((acc, asp) => ({ ...acc, [asp]: 100 }), {});
                              setGradingRubric(p => ({ ...p, ...maxAspects }));
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Isi semua nilai dengan skor maksimal 100"
                          >
                            <span>⚡ Isi 100</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Score Preview Bar */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">Nilai Rata-rata:</span>
                          <strong className="text-slate-800 dark:text-slate-200 text-sm font-black">
                            {avgScore !== null ? `${avgScore}%` : '-'}
                          </strong>
                          <span className="text-slate-400 text-[11px]">(KKM: {currentKkm}%)</span>
                        </div>
                        <div>
                          {avgScore !== null ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPassing ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                            }`}>
                              {isPassing ? '✓ Memenuhi KKM' : '✕ Belum Memenuhi KKM'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Nilai belum diisi</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {activeAspects.map((aspect, index) => {
                          const rawVal = gradingRubric[aspect];
                          const hasVal = rawVal !== '' && rawVal !== undefined && rawVal !== null;
                          const displayVal = hasVal ? rawVal : '';

                          return (
                            <div key={aspect} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-2xs">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {index + 1}. {aspect}
                                </label>
                                {hasVal && (
                                  <button
                                    type="button"
                                    onClick={() => setGradingRubric(p => ({ ...p, [aspect]: '' }))}
                                    className="text-[10px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-0.5 cursor-pointer"
                                    title={`Hapus nilai ${aspect}`}
                                  >
                                    <X className="w-3 h-3" /> Hapus
                                  </button>
                                )}
                              </div>
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Masukkan nilai 0 - 100..."
                                  value={displayVal}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === '') {
                                      setGradingRubric(p => ({ ...p, [aspect]: '' }));
                                    } else {
                                      const num = Number(val);
                                      if (!isNaN(num)) {
                                        setGradingRubric(p => ({ ...p, [aspect]: Math.min(100, Math.max(0, num)) }));
                                      }
                                    }
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 pr-10 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white font-mono font-bold"
                                />
                                {hasVal && (
                                  <button
                                    type="button"
                                    onClick={() => setGradingRubric(p => ({ ...p, [aspect]: '' }))}
                                    className="absolute right-2.5 p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Kosongkan angka"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Catatan Bimbingan / Feedback Guru</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Perbaiki dengung Idgham Bighunnah Anda, tahan sedikit lebih lama..."
                    value={gradingRubric.catatan || ''}
                    onChange={e => setGradingRubric(p => ({ ...p, catatan: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('guru-enrollment-detail')}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveGuruGrade}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Simpan & Kirim Nilai
                </button>
              </div>
            </div>
          )}

          {/* Guru CBT Exam Manual Review and Correction Panel */}
          {activeSubTab === 'guru-cbt-review' && gradingEnrollment && reviewingBabId && (
            (() => {
              const bab = programBabs.find(b => b.id === reviewingBabId);
              const bProgress = gradingEnrollment.babProgress[reviewingBabId];
              if (!bab || !bProgress || !bProgress.kognitifQuestions) return null;

              return (
                <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        setReviewingBabId('');
                        setActiveSubTab('guru-enrollment-detail');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali ke Detail Siswa
                    </button>
                    <span className="text-xs text-slate-400 font-mono">Status Koreksi Manual</span>
                  </div>

                  <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-sm">
                    <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded tracking-wider uppercase">Pemeriksaan Jawaban CBT</span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">{gradingEnrollment.siswaNama}</h2>
                    <p className="text-xs text-slate-500">Hasil Ujian Teori Bab: <strong className="text-slate-700 dark:text-slate-300">{bab.judul}</strong> (Batas KKM Kelulusan: {selectedProgram.kkm || 75}%)</p>
                    
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/40 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      💡 <strong>Sistem Penilaian Otomatis & Guru Korektor:</strong><br />
                      Pilihan Ganda dan Benar-Salah dinilai otomatis oleh sistem. Untuk tipe <strong>Isian Rumpang</strong> dan <strong>Esay</strong>, Anda dapat mengevaluasi jawaban siswa secara manual di bawah ini dengan menandai tombol <strong>Benar (✓)</strong> atau <strong>Salah (✗)</strong> untuk mengoreksi jawaban siswa. Skor total akan otomatis dikalkulasi ulang saat Anda menyimpan.
                    </div>

                    {/* Anti-Cheat Audit & Proctoring Log Card for Guru */}
                    <div className="p-4 rounded-xl border space-y-2 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Laporan Audit Integritas & Sensor Anti-Curang</h4>
                        </div>
                        {(bProgress as any).violationCount ? (
                          <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-[10px] font-black rounded-full uppercase border border-rose-200">
                            ⚠️ {(bProgress as any).violationCount}x Peringatan Terdeteksi
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-black rounded-full uppercase border border-emerald-200">
                            ✓ Bersih (0 Pelanggaran)
                          </span>
                        )}
                      </div>

                      {(bProgress as any).cheatLogs && (bProgress as any).cheatLogs.length > 0 ? (
                        <div className="space-y-1.5 pt-2">
                          <p className="text-[11px] text-slate-500 font-medium">Log riwayat aktivitas siswa yang terdeteksi selama ujian:</p>
                          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                            {(bProgress as any).cheatLogs.map((log: any, logIdx: number) => (
                              <div key={log.id || logIdx} className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-850 text-[11px] flex justify-between items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-rose-50 text-rose-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                                    {logIdx + 1}
                                  </span>
                                  <span className="font-semibold text-slate-750 dark:text-slate-250">{log.reason}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.timestamp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic pt-1">
                          Tidak ada catatan perpindahan tab, pergantian aplikasi, atau aktivitas mencurigakan saat siswa mengerjakan ujian ini.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Daftar Pertanyaan & Jawaban Siswa</h3>

                    {bProgress.kognitifQuestions.map((q, idx) => {
                      const ans = bProgress.kognitifAnswers?.[q.id] || '';
                      
                      // Auto-grading status
                      let autoPassed = false;
                      if (q.tipe === 'rumpang') {
                        autoPassed = ans && String(ans).trim().toLowerCase() === String(q.jawabanBenar).trim().toLowerCase();
                      } else if (q.tipe === 'esai') {
                        autoPassed = ans && String(ans).trim().length >= 4;
                      } else {
                        autoPassed = ans && ans === q.jawabanBenar;
                      }

                      // Manual override state
                      const currentOverride = tempCorrections[q.id];
                      const isMarkedCorrect = currentOverride === 'correct' || (!currentOverride && autoPassed);
                      const isMarkedIncorrect = currentOverride === 'incorrect' || (!currentOverride && !autoPassed);

                      return (
                        <div key={q.id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-450 px-2 py-0.5 rounded tracking-wider uppercase">
                                  {q.tipe === 'benar_salah' ? 'Benar-Salah' : q.tipe === 'rumpang' ? 'Isian Rumpang' : q.tipe === 'esai' ? 'Esay' : 'Pilihan Ganda'}
                                </span>
                                <span className="text-xs text-slate-400 font-bold">No. {idx + 1}</span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-2">{q.pertanyaan}</h4>
                            </div>
                            
                            <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">Bobot: {q.bobot || 10}</span>
                          </div>

                          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-850 text-xs space-y-2">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Jawaban Siswa:</span>
                              <p className="text-slate-850 dark:text-slate-200 font-mono bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 mt-1 font-bold">
                                {ans ? ans : <em className="text-slate-400 font-normal">Tidak diisi / kosong</em>}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4 flex-wrap">
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Jawaban Benar / Rubrik Acuan:</span>
                                <p className="text-emerald-700 dark:text-emerald-400 font-semibold mt-1">✓ {q.jawabanBenar as string}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider mr-1">Status Penilaian:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempCorrections(p => ({ ...p, [q.id]: 'correct' }));
                                  }}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition ${
                                    isMarkedCorrect 
                                      ? 'bg-emerald-600 text-white shadow-sm' 
                                      : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/20'
                                  }`}
                                >
                                  ✓ Benar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempCorrections(p => ({ ...p, [q.id]: 'incorrect' }));
                                  }}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition ${
                                    isMarkedIncorrect 
                                      ? 'bg-rose-600 text-white shadow-sm' 
                                      : 'bg-slate-100 text-slate-500 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/20'
                                  }`}
                                >
                                  ✗ Salah
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Estimasi Skor Baru</span>
                      <div className="flex items-baseline gap-1 mt-1 justify-center sm:justify-start">
                        {(() => {
                          let correctCount = 0;
                          bProgress.kognitifQuestions.forEach(q => {
                            const override = tempCorrections[q.id];
                            if (override === 'correct') {
                              correctCount++;
                            } else if (override === 'incorrect') {
                              // wrong
                            } else {
                              const ans = bProgress.kognitifAnswers?.[q.id];
                              if (q.tipe === 'rumpang') {
                                if (ans && String(ans).trim().toLowerCase() === String(q.jawabanBenar).trim().toLowerCase()) {
                                  correctCount++;
                                }
                              } else if (q.tipe === 'esai') {
                                if (ans && String(ans).trim().length >= 4) {
                                  correctCount++;
                                }
                              } else {
                                if (ans && ans === q.jawabanBenar) {
                                  correctCount++;
                                }
                              }
                            }
                          });
                          const newScore = Math.round((correctCount / bProgress.kognitifQuestions.length) * 100);
                          const isPass = newScore >= (selectedProgram.kkm || 75);
                          return (
                            <>
                              <strong className="text-xl font-black text-indigo-600 dark:text-indigo-400">{newScore}%</strong>
                              <span className="text-xs text-slate-400">/ KKM: {selectedProgram.kkm || 75}%</span>
                              <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider inline-block ${
                                isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {isPass ? 'Lulus' : 'Belum Lulus'}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReviewingBabId('');
                          setActiveSubTab('guru-enrollment-detail');
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleSaveCBTCorrections(gradingEnrollment, reviewingBabId)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                      >
                        Simpan Penilaian Ujian
                      </button>
                    </div>
                  </div>
                </div>
              );
            })())}
        </div>
      )}

      {/* SISWA WORKSPACE VIEWS */}
      {isSiswa && (
        <div className="space-y-6">
          {activeSubTab === 'siswa-dashboard' && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Program Keilmuan Yang Diikuti</h2>
              
              {activeSiswaEnrollments.length === 0 ? (
                <div className="bg-white dark:bg-slate-950 p-12 text-center rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
                  <BookOpenCheck className="w-12 h-12 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">Anda belum terdaftar di program keilmuan manapun.</p>
                  <p className="text-xs text-slate-400">Silakan hubungi Administrator Ponpes untuk didaftarkan ke Program Tajwid Dasar atau program lainnya.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeSiswaEnrollments.map(enroll => {
                    const prog = programs.find(p => p.id === enroll.programId);
                    if (!prog) return null;
                    return (
                      <div key={enroll.id} className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded uppercase tracking-wider">{prog.kategori}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">Aktif</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{enroll.programNama}</h3>
                          <p className="text-xs text-slate-500 mb-4">{prog.deskripsi}</p>
                          
                          <div className="mb-4">
                            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              <span>Kemajuan Belajar</span>
                              <span>{enroll.progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full">
                              <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${enroll.progressPercent}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProgram(prog);
                              setActiveSubTab('siswa-program-detail');
                            }}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                          >
                            Masuk Kelas LMS
                          </button>
                          
                          {enroll.sertifikatTerbit && (
                            <button
                              onClick={() => {
                                setCertEnrollment(enroll);
                                setActiveSubTab('siswa-syahadah');
                              }}
                              className="px-4 py-2.5 bg-teal-50 text-teal-800 rounded-xl text-xs font-bold hover:bg-teal-100 shadow-sm border border-teal-100 flex items-center gap-1"
                            >
                              <Award className="w-4 h-4 text-teal-600" /> Lihat Syahadah
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Student Program Detail View */}
          {activeSubTab === 'siswa-program-detail' && selectedProgram && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setActiveSubTab('siswa-dashboard')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Kelas
                </button>
              </div>

              {/* Sequential learning / locked babs logic */}
              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-black text-slate-900 dark:text-white">{selectedProgram.nama}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedProgram.deskripsi}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Materi & Penilaian per Bab</h3>
                
                {programBabs.filter(b => b.programId === selectedProgram.id).map((bab, index) => {
                  const enroll = getEnrollmentForSiswa(selectedProgram.id);
                  const bProgress = enroll?.babProgress[bab.id] || {
                    completedMateriIds: [], latihanCompleted: false, lulusBab: false
                  };

                  // Sequential learning check: lock if bertahap and previous is not passed (except first)
                  const prevBab = programBabs.find(b => b.programId === selectedProgram.id && b.urutan === bab.urutan - 1);
                  const isLocked = selectedProgram.bertahap && index > 0 && prevBab && !enroll?.babProgress[prevBab.id]?.lulusBab;

                  return (
                    <div key={bab.id} className={`bg-white dark:bg-slate-950 rounded-2xl border ${
                      isLocked ? 'border-slate-150 bg-slate-50/20' : 'border-slate-100'
                    } p-5`}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">BAB {bab.urutan}</span>
                            {bProgress.lulusBab && (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Lulus Bab
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{bab.judul}</h4>
                          <p className="text-xs text-slate-500 mt-1">{bab.tujuanPembelajaran}</p>
                        </div>

                        {!isLocked ? (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setSelectedBab(bab);
                                setActiveSubTab('siswa-study');
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                            >
                              <BookOpen className="w-4 h-4" /> Mulai Belajar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                            <Clock className="w-4 h-4" /> Terkunci (Selesaikan Bab Sebelumnya)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student Study Interface */}
          {activeSubTab === 'siswa-study' && selectedBab && selectedProgram && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setActiveSubTab('siswa-program-detail')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Keluar Kelas Bab
                </button>
              </div>

              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded tracking-wider uppercase">Bab {selectedBab.urutan}</span>
                <h2 className="text-base font-black text-slate-900 dark:text-white mt-2">{selectedBab.judul}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-semibold text-slate-600 dark:text-slate-450 bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <p>🎯 Tujuan: {selectedBab.tujuanPembelajaran}</p>
                  <p>🔍 Indikator: {selectedBab.indikator}</p>
                </div>
              </div>

              {/* Materials segment */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Buku & Modul Ajar (Teori):</h3>
                
                {studyTheoryMateris.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">Belum ada modul teori untuk Bab ini.</p>
                ) : (
                  studyTheoryMateris.map(m => (
                    <div key={m.id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">{m.judul}</h4>
                          <span className="inline-block mt-1 text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{m.tipe}</span>
                        </div>
                      </div>

                      {m.tipe === 'Cetak' && m.cetakInfo && (
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs space-y-2">
                          <p>📖 Buku: <strong>{m.cetakInfo.namaBuku}</strong> (Penulis: {m.cetakInfo.penulis})</p>
                          <p>📍 Referensi: {m.cetakInfo.bab} - {m.cetakInfo.halaman}</p>
                          {m.cetakInfo.catatan && (
                            <div className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-[11px] text-slate-500">
                              <strong>💡 Catatan Guru:</strong> {m.cetakInfo.catatan}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Student reading action / completion badge */}
                      {(() => {
                        const enroll = getEnrollmentForSiswa(selectedProgram.id);
                        const currentBab = enroll?.babProgress[selectedBab.id] || {
                          completedMateriIds: [], latihanCompleted: false, lulusBab: false
                        };
                        const alreadyRead = currentBab.completedMateriIds?.includes(m.id);
                        const readTime = (currentBab as any)?.readingTimes?.[m.id];

                        return (
                          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/60">
                            {alreadyRead ? (
                              <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold shadow-xs">
                                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                                  <span className="font-bold">Materi Telah Selesai Dibaca</span>
                                  {readTime && (
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                                      ({readTime})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!enroll) return;
                                  const updatedProgress = { ...enroll.babProgress };
                                  const now = new Date();
                                  const timestamp = now.toLocaleString('id-ID', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  });
                                  const isoString = now.toISOString();
                                  const currentReadingTimes = (currentBab as any)?.readingTimes || {};
                                  const currentDetails = (currentBab as any)?.readingCompletedDetails || {};

                                  updatedProgress[selectedBab.id] = {
                                    ...currentBab,
                                    completedMateriIds: [...(currentBab.completedMateriIds || []), m.id],
                                    readingTimes: {
                                      ...currentReadingTimes,
                                      [m.id]: timestamp
                                    },
                                    readingCompletedDetails: {
                                      ...currentDetails,
                                      [m.id]: {
                                        materiId: m.id,
                                        materiJudul: m.judul,
                                        babId: selectedBab.id,
                                        babJudul: selectedBab.judul,
                                        completedAtIso: isoString,
                                        completedAtFormatted: timestamp,
                                        readByGuru: false
                                      }
                                    }
                                  } as any;

                                  const lastUpdate = {
                                    materiId: m.id,
                                    materiJudul: m.judul,
                                    babId: selectedBab.id,
                                    babJudul: selectedBab.judul,
                                    siswaId: user?.id || '',
                                    siswaNama: user?.namaLengkap || (user as any)?.username || 'Siswa',
                                    siswaNis: (user as any)?.nis || enroll.siswaNis || '',
                                    timestamp: timestamp,
                                    timestampIso: isoString,
                                    readByGuru: false
                                  };

                                  await updateProgramEnrollment(enroll.id, {
                                    babProgress: updatedProgress,
                                    lastReadingUpdate: lastUpdate
                                  });

                                  addLog('Materi Selesai Dibaca', `Siswa ${user?.namaLengkap || (user as any)?.username} menyelesaikan membaca materi "${m.judul}" di Bab "${selectedBab.judul}"`);
                                  alert(`✅ Alhamdulillah! Anda telah menandai materi "${m.judul}" selesai dibaca. Guru pembimbing telah menerima pemberitahuan.`);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <BookOpenCheck className="w-4 h-4 shrink-0" />
                                <span>Tandai Selesai Membaca</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>

              {/* Practical audio section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 font-sans">
                  <Mic className="w-4 h-4 text-amber-500" /> Pengumpulan Tugas Audio / Rekaman Setoran
                </h3>
                
                {!studyIsKognitifPassed ? (
                  <div className="bg-slate-50 dark:bg-slate-900/45 p-6 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-4 shadow-sm border-l-4 border-l-amber-500/50">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-lg shrink-0">🔒</div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        Tugas Praktik Audio Terkunci
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed">
                        <strong>Alur Pembelajaran Keilmuan:</strong> Silakan ikuti dan selesaikan <strong>Penilaian Kognitif (Ujian Teori)</strong> terlebih dahulu di bawah dengan nilai kelulusan minimal KKM (<strong>{selectedProgram.kkm || 75}%</strong>). Setelah Anda dinyatakan lulus kognitif, barulah pengumpulan tugas praktik (psychomotor) akan terbuka otomatis.
                      </p>
                    </div>
                  </div>
                ) : studyPraktikMateris.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">Belum ada tugas praktik audio untuk Bab ini.</p>
                ) : (
                  studyPraktikMateris.map(m => (
                    <div key={m.id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-amber-100 dark:border-slate-850 shadow-sm border-l-4 border-l-amber-500 space-y-4 animate-fade-in">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-slate-850 dark:text-white">{m.judul}</h4>
                          <span className="inline-block mt-1 text-[9px] font-bold bg-amber-50 text-amber-750 px-2.5 py-0.5 rounded-full uppercase">Praktik Setoran</span>
                        </div>
                      </div>

                      {studyEnroll && (
                        <MateriPraktikSubmission
                          materi={m}
                          babId={selectedBab.id}
                          enroll={studyEnroll}
                          userId={user?.id || ''}
                          userNama={user?.namaLengkap || (user as any)?.username || ''}
                          updateEnrollment={updateProgramEnrollment}
                          addLog={addLog}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Asesmen Kognitif / CBT Exam segment */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Penilaian Kognitif (Ujian Teori):</h3>
                
                {(() => {
                  const enroll = getEnrollmentForSiswa(selectedProgram.id);
                  const bProgress = enroll?.babProgress[selectedBab.id] || {
                    completedMateriIds: [], lulusBab: false
                  };
                  const kkm = selectedProgram.kkm || 75;

                  const theoryMateris = programMateris.filter(m => m.babId === selectedBab.id && !m.isPraktik);
                  const completedMateriIds = bProgress.completedMateriIds || [];
                  const unreadMateris = theoryMateris.filter(m => !completedMateriIds.includes(m.id));
                  const isAllRead = unreadMateris.length === 0;

                  if (!isAllRead) {
                    return (
                      <div className="bg-slate-50 dark:bg-slate-900/45 p-6 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-4 shadow-sm border-l-4 border-l-amber-500/50">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-lg shrink-0">🔒</div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                            Penilaian Kognitif Terkunci
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed">
                            <strong>Alur Pembelajaran Keilmuan:</strong> Silakan baca seluruh modul teori di bab ini terlebih dahulu. Setelah Anda menandai semua materi teori selesai dibaca (klik tombol "Tandai Selesai Membaca" di atas), ujian kognitif (CBT) ini akan terbuka secara otomatis.
                          </p>
                          <div className="mt-3 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modul yang Belum Selesai Dibaca ({unreadMateris.length}):</p>
                            <div className="flex flex-col gap-1 mt-1">
                              {unreadMateris.map(m => (
                                <div key={m.id} className="flex items-center gap-2 text-xs text-slate-650 dark:text-slate-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  <span className="font-semibold">{m.judul}</span>
                                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-500 dark:text-slate-400 font-mono uppercase shrink-0">{m.tipe}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const hasTaken = (bProgress as any).kognitifScore !== undefined;
                  const score = (bProgress as any).kognitifScore;
                  const isPassed = (bProgress as any).kognitifStatus === 'Lulus';

                  const babSetting = programAsesmenSettings.find(s => s.babId === selectedBab.id);
                  const isAntiCheat = babSetting?.antiCheatEnabled !== undefined ? babSetting.antiCheatEnabled : (selectedProgram.antiCheatEnabled !== false);
                  const maxWarns = babSetting?.maxViolations || selectedProgram.maxViolations || 3;
                  const reqFull = babSetting?.requireFullscreen !== undefined ? babSetting.requireFullscreen : (selectedProgram.requireFullscreen !== false);
                  const blkCopy = babSetting?.blockCopyPaste !== undefined ? babSetting.blockCopyPaste : (selectedProgram.blockCopyPaste !== false);
                  const petunjukText = babSetting?.petunjukKejujuran || selectedProgram.petunjukKejujuran || DEFAULT_PETUNJUK_KEJUJURAN;

                  return (
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                      {/* Anjuran Kejujuran & Tata Tertib Ujian Card */}
                      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 space-y-2.5">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Anjuran & Tata Tertib Integritas Ujian:</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-white/80 dark:bg-slate-900/60 p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/40 font-medium">
                          "{petunjukText}"
                        </p>
                        {isAntiCheat && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
                              <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" /> Sensor Perpindahan Layar Aktif (Maks {maxWarns}x Peringatan)
                            </span>
                            {reqFull && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
                                <Maximize className="w-3 h-3 text-indigo-600 shrink-0" /> Wajib Layar Penuh (Fullscreen)
                              </span>
                            )}
                            {blkCopy && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
                                <Lock className="w-3 h-3 text-rose-600 shrink-0" /> Proteksi Salin-Tempel & Klik Kanan
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Ujian CBT Akhir Bab</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Ujian online kognitif terkomputerisasi. Batas KKM kelulusan: <strong>{kkm}%</strong></p>
                          {hasTaken && (
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/60 inline-flex items-center gap-3">
                              <div className="text-left">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Skor Anda</span>
                                <p className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{score}%</p>
                              </div>
                              <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800" />
                              <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Hasil Evaluasi</span>
                                <div className="mt-0.5">
                                  {isPassed ? (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-emerald-100/40">Lulus</span>
                                  ) : (
                                    <span className="text-[10px] bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-rose-100/40">Remedial (Belum Lulus)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {!hasTaken ? (
                            <button
                              onClick={() => handleStartExam(selectedBab.id, selectedProgram.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                            >
                              Mulai Ujian CBT
                            </button>
                          ) : !isPassed ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingSiswaBabId(p => p === selectedBab.id ? '' : selectedBab.id);
                                }}
                                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-350 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-800 cursor-pointer"
                              >
                                {reviewingSiswaBabId === selectedBab.id ? 'Sembunyikan' : '🔍 Tinjau Jawaban Anda'}
                              </button>
                              <button
                                onClick={() => handleStartExam(selectedBab.id, selectedProgram.id)}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1"
                              >
                                🔄 Kerjakan Ulang Ujian (Remedial)
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingSiswaBabId(p => p === selectedBab.id ? '' : selectedBab.id);
                                }}
                                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-350 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-800 cursor-pointer"
                              >
                                {reviewingSiswaBabId === selectedBab.id ? 'Sembunyikan' : '🔍 Tinjau Jawaban Anda'}
                              </button>
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-100/40">
                                <CheckCircle className="w-4 h-4" /> Anda Telah Lulus Ujian!
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inline student CBT past answers review panel */}
                      {reviewingSiswaBabId === selectedBab.id && hasTaken && (bProgress as any).kognitifQuestions && (
                        <div className="mt-4 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3.5 animate-fade-in">
                          <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                            <span>📝</span> Hasil Peninjauan Lembar Jawaban Anda:
                          </h5>
                          <div className="space-y-2.5">
                            {(bProgress as any).kognitifQuestions.map((q: any, idx: number) => {
                              const ans = (bProgress as any).kognitifAnswers?.[q.id] || '';
                              const isCorrect = isAnswerCorrectAutomatically(q, ans);
                              const isOverridden = (bProgress as any).kognitifManualCorrections?.[q.id];
                              const isMarkedCorrect = isOverridden === 'correct' || (!isOverridden && isCorrect);

                              return (
                                <div key={q.id} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 space-y-2">
                                  <div className="flex justify-between items-start gap-4">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      <span className="text-slate-400 font-mono mr-1.5">{idx + 1}.</span>
                                      {q.pertanyaan}
                                    </p>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${
                                      isMarkedCorrect 
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                    }`}>
                                      {isMarkedCorrect ? '✓ Benar' : '✗ Salah'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-850">
                                    <p className="text-slate-500">Jawaban Anda: <strong className="text-slate-750 dark:text-slate-200 font-mono bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-slate-100/40">{ans || '(Tidak dijawab)'}</strong></p>
                                    <p className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                      <span>Jawaban Benar:</span>
                                      <span className="font-mono bg-emerald-50/50 dark:bg-emerald-950/10 px-1 py-0.5 rounded border border-emerald-100/20">{q.jawabanBenar as string}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {!isPassed && hasTaken && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          ⚠️ Nilai Anda ({score}%) masih di bawah batas KKM ({kkm}%). Silakan pelajari materi kembali dan klik tombol di atas untuk melakukan ujian ulang.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Asesmen Praktik / Recorder Task segment */}
              {selectedProgram.asesmenPraktik && (() => {
                const enroll = getEnrollmentForSiswa(selectedProgram.id);
                const bProgress = enroll?.babProgress[selectedBab.id] || {
                  completedMateriIds: [], latihanCompleted: false, lulusBab: false
                };
                const isPassed = bProgress.kognitifStatus === 'Lulus';
                const kkm = selectedProgram.kkm || 75;

                if (!isPassed) {
                  return (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Penilaian Praktik (Uji Setoran Audio/Tatap Muka):</h3>
                      <div className="bg-slate-50 dark:bg-slate-900/45 p-6 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-4 shadow-sm border-l-4 border-l-amber-500/50">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-lg shrink-0">🔒</div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Setoran Audio Terkunci</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed">
                            <strong>Alur Pembelajaran Keilmuan:</strong> Silakan ikuti dan selesaikan <strong>Penilaian Kognitif (Ujian Teori)</strong> terlebih dahulu di atas dengan nilai kelulusan minimal KKM (<strong>{kkm}%</strong>). Setelah Anda dinyatakan lulus kognitif, barulah pengumpulan tugas setoran lisan ini terbuka otomatis.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                const remainingDays = getRemainingDays((bProgress as any)?.praktikSubmittedAtIso);
                const isAudioExpired = !!((bProgress as any)?.praktikSubmittedAtIso && remainingDays <= 0);

                return (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Penilaian Praktik (Uji Setoran Audio/Tatap Muka):</h3>
                    
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                      {bProgress.praktikStatus === 'Perlu Penilaian' && (
                        <div className="space-y-3 bg-amber-50/20 dark:bg-slate-900 p-4.5 rounded-2xl border border-dashed border-amber-200 dark:border-slate-800">
                          <span className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest block mb-1">📂 Setoran Bab Anda Sedang Diperiksa</span>
                          
                          {isAudioExpired ? (
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border border-rose-200/50 dark:border-rose-900/40 rounded-xl space-y-1.5">
                              <p className="text-xs font-black flex items-center gap-1.5 text-rose-700 dark:text-rose-450">⚠️ File Audio Kedaluwarsa</p>
                              <p className="text-[11px] leading-relaxed">
                                Maaf, file audio setoran ini telah <strong>melebihi batas waktu 7 hari</strong> sehingga dibersihkan otomatis demi menjaga kapasitas storage server. Silakan lakukan perekaman ulang di bawah ini.
                              </p>
                            </div>
                          ) : (
                            <>
                              {(bProgress as any)?.praktikSubmittedAtIso && (
                                <div className={`p-2.5 rounded-xl text-[10px] font-extrabold flex items-center gap-2 border ${
                                  remainingDays <= 2 
                                    ? 'bg-rose-50/90 text-rose-800 border-rose-150 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/60' 
                                    : 'bg-amber-50/90 text-amber-800 border-amber-150 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/60'
                                }`}>
                                  <span>⏱️ SISA PENYIMPANAN:</span>
                                  <span>Audio dihapus dalam <strong>{remainingDays} Hari Lagi</strong>. Segera minta ustadz menilai.</span>
                                </div>
                              )}
                              <CustomAudioPlayer 
                                src={bProgress.praktikFileBase64 || "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/001001.mp3"} 
                                fileName={bProgress.praktikFileName || 'tugas_praktik_bab.wav'} 
                              />
                            </>
                          )}
                        </div>
                      )}
                      
                      {bProgress.praktikStatus === 'Lulus' && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                          <p className="text-xs font-bold flex items-center gap-1">✓ Setoran Anda Dinyatakan Lulus!</p>
                          <p className="text-[11px]">Nilai Kelayakan: <strong className="text-emerald-950 dark:text-white text-xs">{bProgress.praktikScore || (bProgress as any)?.nilaiAkhir || 100} / 100</strong></p>
                          <p className="text-[10px] text-slate-500 italic">" File audio telah dibersihkan otomatis setelah dinilai demi efisiensi storage. Nilai Anda tetap aman selamanya. "</p>
                        </div>
                      )}

                      {/* Display recorder form if not submitted, remedial, or expired before grading */}
                      {(bProgress.praktikStatus === 'Belum Mengikuti' || bProgress.praktikStatus === 'Belum Lulus' || (bProgress.praktikStatus === 'Perlu Penilaian' && isAudioExpired)) && (
                        <div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Pengumpulan Tugas Audio / Rekaman Setoran</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Rekam suara Anda mempraktikkan hukum tajwid/makhraj bab ini menggunakan mikrofon laptop lalu submit ke Guru Pembimbing Anda.</p>
                          </div>

                          {/* Interactive Voice recorder interface */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-4 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Alat Perekam Suara Terintegrasi</span>
                              {recordingState === 'recording' && (
                                <span className="flex items-center gap-1.5 text-xs text-red-500 font-bold animate-pulse">
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Sedang Merekam ({Math.floor(simulatedTimer / 10)}s / 120s)
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col items-center justify-center py-6 space-y-3">
                              <div className="flex items-center justify-center gap-1 h-8">
                                {recordingState === 'recording' && simulatedVolume.map((vol, i) => (
                                  <div key={i} className="bg-red-500 rounded h-full w-1 transition-all" style={{ height: `${vol}%` }} />
                                ))}
                              </div>

                              <div className="flex gap-2">
                                {recordingState === 'idle' && (
                                  <button
                                    onClick={handleStartRecording}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Mic className="w-4 h-4" /> Mulai Rekam
                                  </button>
                                )}
                                {recordingState === 'recording' && (
                                  <button
                                    onClick={handleStopRecording}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Square className="w-4 h-4" /> Stop & Simpan
                                  </button>
                                )}
                                {recordingState === 'preview' && (
                                  <>
                                    <button
                                      onClick={handleStartRecording}
                                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                                    >
                                      Rekam Ulang
                                    </button>
                                    <button
                                      onClick={() => handleSubmitAudioTask(selectedBab.id)}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                                    >
                                      Kirim ke Ustadz
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Student CBT Exam Taking Screen */}
          {activeSubTab === 'siswa-cbt' && activeExam && (
            <div className={`max-w-2xl mx-auto bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 space-y-6 ${
              activeExam.blockCopyPaste ? 'select-none' : ''
            }`}>
              {/* Header Ujian & Proctoring Status */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Lembar Jawaban Ujian CBT</h2>
                    {activeExam.antiCheatEnabled && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-600" /> Mode Proteksi Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Jawab semua pertanyaan dengan jujur dan teliti.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Fullscreen Button */}
                  {activeExam.requireFullscreen && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen();
                          }
                        } catch (e) {
                          console.warn(e);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Pastikan Layar Penuh"
                    >
                      <Maximize className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[10px]">Layar Penuh</span>
                    </button>
                  )}

                  {/* Violation Tracker Badge */}
                  {activeExam.antiCheatEnabled && (
                    <div className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1 border ${
                      activeExam.violationCount > 0 
                        ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50 animate-pulse' 
                        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                    }`}>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Peringatan: {activeExam.violationCount}/{activeExam.maxViolations}</span>
                    </div>
                  )}

                  <div className="px-3.5 py-1.5 bg-rose-50 text-rose-800 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shrink-0">
                    <Clock className="w-4 h-4" /> 
                    <span>{Math.floor(activeExam.timeLeft / 60)}m {activeExam.timeLeft % 60}s</span>
                  </div>
                </div>
              </div>

              {/* Anjuran Kejujuran Banner */}
              {activeExam.petunjukKejujuran && (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">Anjuran Integritas Ujian:</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                      "{activeExam.petunjukKejujuran}"
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {activeExam.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900/35 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{idx + 1}. {q.pertanyaan}</p>
                    
                    {/* Pilihan Ganda */}
                    {(q.tipe === 'pilihan_ganda' || !q.tipe) && q.opsi && q.opsi.length > 0 && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {q.opsi.map(opt => {
                          const isSelected = activeExam.answers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setActiveExam(p => {
                                  if (!p) return null;
                                  return { ...p, answers: { ...p.answers, [q.id]: opt } };
                                });
                              }}
                              className={`w-full px-4 py-2.5 text-left text-xs font-semibold rounded-xl border transition cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-400 font-bold' 
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Benar - Salah */}
                    {q.tipe === 'benar_salah' && (
                      <div className="grid grid-cols-2 gap-3">
                        {['Benar', 'Salah'].map(opt => {
                          const isSelected = activeExam.answers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setActiveExam(p => {
                                  if (!p) return null;
                                  return { ...p, answers: { ...p.answers, [q.id]: opt } };
                                });
                              }}
                              className={`px-4 py-3 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-400' 
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Isian Rumpang */}
                    {q.tipe === 'rumpang' && (
                      <div>
                        <input
                          type="text"
                          placeholder="Ketik jawaban singkat melengkapi bagian yang rumpang..."
                          value={activeExam.answers[q.id] || ''}
                          onChange={e => {
                            setActiveExam(p => {
                              if (!p) return null;
                              return { ...p, answers: { ...p.answers, [q.id]: e.target.value } };
                            });
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Esay */}
                    {q.tipe === 'esai' && (
                      <div>
                        <textarea
                          placeholder="Tuliskan jawaban essay Anda secara lengkap dan detail di sini..."
                          value={activeExam.answers[q.id] || ''}
                          onChange={e => {
                            setActiveExam(p => {
                              if (!p) return null;
                              return { ...p, answers: { ...p.answers, [q.id]: e.target.value } };
                            });
                          }}
                          rows={4}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleFinishExam()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Selesaikan & Kumpulkan Jawaban
              </button>

              {/* Anti-Cheat Violation Modal Overlay */}
              {activeExam.warningModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className={`max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border-2 text-center space-y-4 ${
                    activeExam.warningModal.isMaxReached 
                      ? 'border-rose-500' 
                      : 'border-amber-500'
                  }`}>
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                      activeExam.warningModal.isMaxReached
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 animate-bounce'
                    }`}>
                      {activeExam.warningModal.isMaxReached ? (
                        <AlertTriangle className="w-8 h-8" />
                      ) : (
                        <ShieldAlert className="w-8 h-8" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        activeExam.warningModal.isMaxReached
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {activeExam.warningModal.isMaxReached
                          ? 'Batas Pelanggaran Terlampaui'
                          : `Peringatan Ke-${activeExam.warningModal.count} dari ${activeExam.maxViolations}`}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {activeExam.warningModal.isMaxReached
                          ? 'Ujian Dihentikan Otomatis'
                          : 'Peringatan Sistem Anti-Curang!'}
                      </h3>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
                      <p className="text-slate-500 dark:text-slate-400">
                        Aktivitas Terdeteksi: <strong className="text-slate-800 dark:text-slate-200">{activeExam.warningModal.message}</strong>
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {activeExam.warningModal.isMaxReached
                        ? `Anda telah berpindah tab / layar sebanyak ${activeExam.maxViolations} kali. Demi menjaga integritas dan keadilan penilaian, ujian Anda otomatis dikumpulkan sekarang.`
                        : `Dilarang membuka tab browser lain, berpindah aplikasi, atau meminimize layar selama ujian. Jika pelanggaran mencapai ${activeExam.maxViolations} kali, ujian Anda akan otomatis dikumpulkan oleh sistem.`}
                    </p>

                    {activeExam.warningModal.isMaxReached ? (
                      <button
                        type="button"
                        onClick={() => handleFinishExam(true)}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer"
                      >
                        Kumpulkan Lembar Jawaban Sekarang
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveExam(p => p ? ({ ...p, warningModal: null }) : null);
                          if (activeExam.requireFullscreen && !document.fullscreenElement) {
                            try {
                              document.documentElement.requestFullscreen().catch(() => {});
                            } catch (e) {
                              console.warn(e);
                            }
                          }
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer"
                      >
                        Saya Mengerti & Kembali Mengerjakan
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gorgeous Arabesque-styled Syahadah Certificate Viewer (Siswa & Guru) */}
          {activeSubTab === 'siswa-syahadah' && certEnrollment && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center print:hidden">
                <button
                  onClick={() => setActiveSubTab(isGuru ? 'guru-enrollment-detail' : 'siswa-dashboard')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrintCertificate}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Cetak Syahadah
                  </button>
                </div>
              </div>

              {/* Certificate Canvas */}
              <div className="bg-[#FAF7F0] text-amber-950 p-8 md:p-12 rounded-3xl shadow-2xl border-[12px] border-double border-amber-600/70 font-serif relative overflow-hidden" id="syahadah-print-container">
                {/* Vintage Watermark background elements */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                  <Award className="w-[300px] h-[300px]" />
                </div>

                <div className="text-center relative z-10 space-y-6">
                  {/* Bismillah Islamic calligraphy */}
                  <div className="text-xl md:text-2xl font-bold tracking-widest text-emerald-800 font-mono">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-widest text-emerald-900 uppercase">SYAHADAH IJAZAH</h1>
                    <p className="text-xs tracking-widest font-sans font-bold text-slate-500">NOMOR REGISTRASI: {certEnrollment.sertifikatNo}</p>
                  </div>

                  <p className="text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
                    Dewan Penguji Yayasan Pendidikan Pesantren Al-Qur'an dengan ini memberikan persaksian dan kelulusan ijazah kepada:
                  </p>

                  <div className="py-2 border-y border-amber-600/30 max-w-md mx-auto">
                    <h2 className="text-lg md:text-xl font-bold tracking-wide text-emerald-950 uppercase">{certEnrollment.siswaNama}</h2>
                    <p className="text-[11px] tracking-widest font-sans font-semibold text-slate-500 mt-1">NIS: {certEnrollment.siswaNis}</p>
                  </div>

                  <p className="text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
                    Telah menyelesaikan seluruh rangkaian ujian dan lulus dengan predikat memuaskan pada program pembelajaran terpadu:
                  </p>

                  <h3 className="text-base md:text-lg font-black text-emerald-900 tracking-wide uppercase italic">{certEnrollment.programNama}</h3>

                  <p className="text-xs leading-relaxed max-w-md mx-auto italic text-slate-500">
                    "Semoga Allah senantiasa melimpahkan taufik, hidayah, dan keberkahan ilmu kepada pemegang syahadah ini agar dapat mengamalkannya demi kemaslahatan umat."
                  </p>

                  {/* Footer metadata & signature lines */}
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-amber-650/20 max-w-2xl mx-auto text-xs font-sans text-slate-600">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Ditetapkan Pada</p>
                      <p className="font-bold text-slate-800 mt-1">{certEnrollment.sertifikatTanggal || new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Kepala Direktorat Halaqah</p>
                      <div className="h-10 mt-2 flex items-end justify-center">
                        <span className="font-bold text-slate-900 border-b border-slate-300 pb-0.5 px-4 font-serif">KH. Ahmad Rasyid, Lc, M.Ag</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN EDIT / CREATE MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 dark:border-slate-850 animate-fade-in my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-sans font-black text-slate-950 dark:text-white text-base">
                {modalType === 'create_program' ? 'Tambah Program Baru' :
                 modalType === 'edit_program' ? 'Ubah Program Keilmuan' :
                 modalType === 'create_bab' ? 'Tambah Bab Baru' :
                 modalType === 'create_materi' ? 'Tambah Materi' :
                 modalType === 'edit_materi' ? 'Ubah Materi' :
                 modalType === 'create_praktik' ? 'Tambah Tugas Praktik Audio' :
                 modalType === 'edit_praktik' ? 'Ubah Tugas Praktik Audio' :
                 modalType === 'create_latihan' ? 'Tambah Soal Latihan' :
                 modalType === 'edit_latihan' ? 'Ubah Soal Latihan' :
                 modalType === 'create_asesmen' ? 'Tambah Soal Ujian Kognitif' :
                 modalType === 'edit_asesmen' ? 'Ubah Soal Ujian Kognitif' :
                 modalType === 'edit_asesmen_setting' ? 'Pengaturan CBT & Proteksi Anti-Curang' :
                 modalType === 'enroll_student' ? 'Daftarkan Siswa Baru' : ''}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Forms */}
            {modalType === 'create_program' && (
              <form onSubmit={handleCreateProgramAction} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-650 dark:text-slate-350 mb-1">Nama Program *</label>
                  <input
                    type="text" required
                    placeholder="Contoh: Tajwid Dasar / Ulumul Qur'an"
                    value={progForm.nama}
                    onChange={e => setProgForm(p => ({ ...p, nama: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-650 mb-1">Kategori Program</label>
                  <select
                    value={progForm.kategori}
                    onChange={e => setProgForm(p => ({ ...p, kategori: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-950"
                  >
                    <option value="Tajwid Dasar">Tajwid Dasar</option>
                    <option value="Tajwid Lanjutan">Tajwid Lanjutan</option>
                    <option value="Ulumul Qur'an">Ulumul Qur'an</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-650 mb-1">Deskripsi Singkat</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Program ini mempelajari kaidah bacaan dasar Al-Qur'an..."
                    value={progForm.deskripsi}
                    onChange={e => setProgForm(p => ({ ...p, deskripsi: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-650 mb-1">KKM Kelulusan (0-100)</label>
                    <input
                      type="number" min="0" max="100"
                      value={progForm.kkm}
                      onChange={e => setProgForm(p => ({ ...p, kkm: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-650 mb-1">Sasaran Siswa</label>
                    <input
                      type="text"
                      placeholder="Siswa Umum / Halaqah Dasar"
                      value={progForm.sasaran}
                      onChange={e => setProgForm(p => ({ ...p, sasaran: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-3 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Konfigurasi Referensi Materi Utama</h4>
                  
                  <div>
                    <label className="block text-slate-650 mb-1">Tipe Materi Pembelajaran *</label>
                    <select
                      value={progForm.tipeMateri || 'Cetak'}
                      onChange={e => setProgForm(p => ({ ...p, tipeMateri: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-950 font-bold"
                    >
                      <option value="Cetak">Buku Cetak / Referensi Manual</option>
                      <option value="Modul">Modul Digital (Aplikasi)</option>
                    </select>
                  </div>

                  {((progForm.tipeMateri === 'Cetak' || !progForm.tipeMateri) || isAddIdentitasModul) && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase">
                        {isAddIdentitasModul ? 'Informasi Buku Cetak Referensi (Sesuai Identitas Modul):' : 'Informasi Buku Cetak Referensi:'}
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Nama Buku *</label>
                          <input
                            type="text" required={progForm.tipeMateri === 'Cetak' || !progForm.tipeMateri || isAddIdentitasModul}
                            placeholder="Tajwid Lengkap"
                            value={isAddIdentitasModul ? (selectedModulForAdd?.judulModul || '') : (progForm.cetakInfo?.namaBuku || '')}
                            disabled={isAddIdentitasModul}
                            onChange={e => setProgForm(p => ({
                              ...p, cetakInfo: { ...(p.cetakInfo || {} as any), namaBuku: e.target.value }
                            }))}
                            className={`w-full bg-white border border-slate-200 rounded p-1.5 ${isAddIdentitasModul ? 'opacity-75 cursor-not-allowed bg-slate-100 font-bold text-slate-700' : ''}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Penulis</label>
                          <input
                            type="text"
                            placeholder="Ahmad Sunarto"
                            value={isAddIdentitasModul ? (selectedModulForAdd?.penulisModul || '') : (progForm.cetakInfo?.penulis || '')}
                            disabled={isAddIdentitasModul}
                            onChange={e => setProgForm(p => ({
                              ...p, cetakInfo: { ...(p.cetakInfo || {} as any), penulis: e.target.value }
                            }))}
                            className={`w-full bg-white border border-slate-200 rounded p-1.5 ${isAddIdentitasModul ? 'opacity-75 cursor-not-allowed bg-slate-100 font-bold text-slate-700' : ''}`}
                          />
                        </div>
                      </div>



                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Catatan Khusus Santri</label>
                        <input
                          type="text"
                          placeholder="Fokuskan latihan membaca lafadz..."
                          value={progForm.cetakInfo?.catatan || ''}
                          onChange={e => setProgForm(p => ({
                            ...p, cetakInfo: { ...(p.cetakInfo || {} as any), catatan: e.target.value }
                          }))}
                          className="w-full bg-white border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  )}

                  {progForm.tipeMateri === 'Modul' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase">Pilih Modul Digital (Aplikasi):</span>
                      <div>
                        <select
                          required={progForm.tipeMateri === 'Modul'}
                          value={progForm.modulId || ''}
                          onChange={e => {
                            const mId = e.target.value;
                            const m = moduls.find(mod => mod.id === mId);
                            setProgForm(p => {
                              const updated = { ...p, modulId: mId };
                              if (m && m.tipe !== TipeModul.AL_QURAN && m.tipeMateri === 'hanya_identitas') {
                                updated.cetakInfo = {
                                  ...updated.cetakInfo,
                                  namaBuku: m.judulModul || '',
                                  penulis: m.penulisModul || '',
                                  penerbit: m.penerbitModul || '',
                                  tahunTerbit: m.tahunTerbit || '2026',
                                  edisi: updated.cetakInfo?.edisi || 'Cetakan ke-1',
                                  bab: updated.cetakInfo?.bab || '',
                                  halaman: updated.cetakInfo?.halaman || '',
                                  catatan: updated.cetakInfo?.catatan || ''
                                };
                              } else {
                                updated.cetakInfo = {
                                  ...updated.cetakInfo,
                                  namaBuku: '',
                                  penulis: '',
                                  penerbit: '',
                                  tahunTerbit: '2026',
                                  edisi: 'Cetakan ke-1',
                                  bab: '',
                                  halaman: '',
                                  catatan: ''
                                };
                              }
                              return updated;
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-950 font-bold"
                        >
                          <option value="">-- Pilih Modul dari Aplikasi --</option>
                          {moduls.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.tipe === 'Al-Quran' ? `Al-Qur'an: Surah ${m.namaSurat}` : `Modul: ${m.judulModul}`}
                            </option>
                          ))}
                        </select>
                        {moduls.length === 0 && (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold">Belum ada modul yang diupload oleh admin. Silakan upload modul di halaman modul terlebih dahulu.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-150">
                  <label className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                    <input
                      type="checkbox"
                      checked={progForm.asesmenPraktik}
                      onChange={e => setProgForm(p => ({ ...p, asesmenPraktik: e.target.checked }))}
                      className="rounded text-emerald-650"
                    />
                    <span>Adakan Tugas Praktik Audio (Setoran Lisan)</span>
                  </label>

                  {progForm.asesmenPraktik && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">DAFTAR ASPEK YANG DINILAI:</span>
                      
                      <div className="flex flex-wrap gap-2">
                        {(progForm.aspekPenilaianList || DEFAULT_ASPEK_LIST).map((asp) => (
                          <div key={asp} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                            <span className="text-[11px] text-slate-850 dark:text-slate-250 font-semibold">{asp}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = progForm.aspekPenilaianList || [...DEFAULT_ASPEK_LIST];
                                setProgForm(p => ({
                                  ...p,
                                  aspekPenilaianList: currentList.filter(x => x !== asp)
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-black ml-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tambah aspek baru..."
                          value={customAspectInput}
                          onChange={e => setCustomAspectInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-normal"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!customAspectInput.trim()) return;
                            const currentList = progForm.aspekPenilaianList || [...DEFAULT_ASPEK_LIST];
                            if (currentList.includes(customAspectInput.trim())) return;
                            setProgForm(p => ({
                              ...p,
                              aspekPenilaianList: [...currentList, customAspectInput.trim()]
                            }));
                            setCustomAspectInput('');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={progForm.bertahap}
                      onChange={e => setProgForm(p => ({ ...p, bertahap: e.target.checked }))}
                    />
                    <span>Belajar Bertahap (Sequential)</span>
                  </label>
                </div>

                {/* Anti-Cheat & CBT Default Protection Settings */}
                <div className="border-t border-slate-150 pt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Proteksi Ujian CBT & Anti-Curang (Default)</h4>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={progForm.antiCheatEnabled !== false}
                        onChange={e => setProgForm(p => ({ ...p, antiCheatEnabled: e.target.checked }))}
                        className="rounded text-emerald-600"
                      />
                      <span>Aktifkan Mode Anti-Curang (Client Proctoring)</span>
                    </label>

                    {progForm.antiCheatEnabled !== false && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-600 font-bold mb-1">Maksimal Peringatan Pindah Tab</label>
                            <input
                              type="number" min={1} max={10}
                              value={progForm.maxViolations || 3}
                              onChange={e => setProgForm(p => ({ ...p, maxViolations: Number(e.target.value) || 3 }))}
                              className="w-full bg-white border border-slate-200 rounded p-1.5 font-bold text-slate-900"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Ujian auto-submit jika melebihi batas ini.</p>
                          </div>
                          <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-1.5 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={progForm.requireFullscreen !== false}
                                onChange={e => setProgForm(p => ({ ...p, requireFullscreen: e.target.checked }))}
                              />
                              <span>Wajib Layar Penuh (Fullscreen)</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={progForm.blockCopyPaste !== false}
                                onChange={e => setProgForm(p => ({ ...p, blockCopyPaste: e.target.checked }))}
                              />
                              <span>Blokir Copy-Paste & Klik Kanan</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-600 font-bold mb-1">Teks Anjuran Kejujuran (Tampil di Akun Santri)</label>
                          <textarea
                            rows={2}
                            value={progForm.petunjukKejujuran || DEFAULT_PETUNJUK_KEJUJURAN}
                            onChange={e => setProgForm(p => ({ ...p, petunjukKejujuran: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">Simpan Program</button>
                </div>
              </form>
            )}

            {modalType === 'edit_program' && selectedProgram && (
              <form onSubmit={handleUpdateProgramAction} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-650 mb-1">Nama Program *</label>
                  <input
                    type="text" required
                    value={selectedProgram.nama}
                    onChange={e => setSelectedProgram(p => p ? { ...p, nama: e.target.value } : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-650 mb-1">Deskripsi Singkat</label>
                  <textarea
                    rows={3}
                    value={selectedProgram.deskripsi}
                    onChange={e => setSelectedProgram(p => p ? { ...p, deskripsi: e.target.value } : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-650 mb-1">Status Keaktifan</label>
                    <select
                      value={selectedProgram.status}
                      onChange={e => setSelectedProgram(p => p ? { ...p, status: e.target.value as any } : null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-950"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                      <option value="Diarsipkan">Diarsipkan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-650 mb-1">KKM Kelulusan</label>
                    <input
                      type="number"
                      value={selectedProgram.kkm}
                      onChange={e => setSelectedProgram(p => p ? { ...p, kkm: Number(e.target.value) } : null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-3 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Konfigurasi Referensi Materi Utama</h4>
                  
                  <div>
                    <label className="block text-slate-650 mb-1">Tipe Materi Pembelajaran *</label>
                    <select
                      value={selectedProgram.tipeMateri || 'Cetak'}
                      onChange={e => setSelectedProgram(p => p ? ({ ...p, tipeMateri: e.target.value as any }) : null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-950 font-bold"
                    >
                      <option value="Cetak">Buku Cetak / Referensi Manual</option>
                      <option value="Modul">Modul Digital (Aplikasi)</option>
                    </select>
                  </div>

                  {((selectedProgram.tipeMateri === 'Cetak' || !selectedProgram.tipeMateri) || isEditIdentitasModul) && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase">
                        {isEditIdentitasModul ? 'Informasi Buku Cetak Referensi (Sesuai Identitas Modul):' : 'Informasi Buku Cetak Referensi:'}
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Nama Buku *</label>
                          <input
                            type="text" required={selectedProgram.tipeMateri === 'Cetak' || !selectedProgram.tipeMateri || isEditIdentitasModul}
                            placeholder="Tajwid Lengkap"
                            value={isEditIdentitasModul ? (selectedModulForEdit?.judulModul || '') : (selectedProgram.cetakInfo?.namaBuku || '')}
                            disabled={isEditIdentitasModul}
                            onChange={e => setSelectedProgram(p => p ? ({
                              ...p, cetakInfo: { ...(p.cetakInfo || {} as any), namaBuku: e.target.value }
                            }) : null)}
                            className={`w-full bg-white border border-slate-200 rounded p-1.5 ${isEditIdentitasModul ? 'opacity-75 cursor-not-allowed bg-slate-100 font-bold text-slate-700' : ''}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Penulis</label>
                          <input
                            type="text"
                            placeholder="Ahmad Sunarto"
                            value={isEditIdentitasModul ? (selectedModulForEdit?.penulisModul || '') : (selectedProgram.cetakInfo?.penulis || '')}
                            disabled={isEditIdentitasModul}
                            onChange={e => setSelectedProgram(p => p ? ({
                              ...p, cetakInfo: { ...(p.cetakInfo || {} as any), penulis: e.target.value }
                            }) : null)}
                            className={`w-full bg-white border border-slate-200 rounded p-1.5 ${isEditIdentitasModul ? 'opacity-75 cursor-not-allowed bg-slate-100 font-bold text-slate-700' : ''}`}
                          />
                        </div>
                      </div>



                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Catatan Khusus Santri</label>
                        <input
                          type="text"
                          placeholder="Fokuskan latihan membaca lafadz..."
                          value={selectedProgram.cetakInfo?.catatan || ''}
                          onChange={e => setSelectedProgram(p => p ? ({
                            ...p, cetakInfo: { ...(p.cetakInfo || {} as any), catatan: e.target.value }
                          }) : null)}
                          className="w-full bg-white border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  )}

                  {selectedProgram.tipeMateri === 'Modul' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase">Pilih Modul Digital (Aplikasi):</span>
                      <div>
                        <select
                          required={selectedProgram.tipeMateri === 'Modul'}
                          value={selectedProgram.modulId || ''}
                          onChange={e => {
                            const mId = e.target.value;
                            const m = moduls.find(mod => mod.id === mId);
                            setSelectedProgram(p => {
                              if (!p) return null;
                              const updated = { ...p, modulId: mId };
                              if (m && m.tipe !== TipeModul.AL_QURAN && m.tipeMateri === 'hanya_identitas') {
                                updated.cetakInfo = {
                                  ...updated.cetakInfo,
                                  namaBuku: m.judulModul || '',
                                  penulis: m.penulisModul || '',
                                  penerbit: m.penerbitModul || '',
                                  tahunTerbit: m.tahunTerbit || '2026',
                                  edisi: updated.cetakInfo?.edisi || 'Cetakan ke-1',
                                  bab: updated.cetakInfo?.bab || '',
                                  halaman: updated.cetakInfo?.halaman || '',
                                  catatan: updated.cetakInfo?.catatan || ''
                                };
                              } else {
                                updated.cetakInfo = {
                                  ...updated.cetakInfo,
                                  namaBuku: '',
                                  penulis: '',
                                  penerbit: '',
                                  tahunTerbit: '2026',
                                  edisi: 'Cetakan ke-1',
                                  bab: '',
                                  halaman: '',
                                  catatan: ''
                                };
                              }
                              return updated;
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-950 font-bold"
                        >
                          <option value="">-- Pilih Modul dari Aplikasi --</option>
                          {moduls.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.tipe === 'Al-Quran' ? `Al-Qur'an: Surah ${m.namaSurat}` : `Modul: ${m.judulModul}`}
                            </option>
                          ))}
                        </select>
                        {moduls.length === 0 && (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold">Belum ada modul yang diupload oleh admin. Silakan upload modul di halaman modul terlebih dahulu.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-150">
                  <label className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedProgram.asesmenPraktik}
                      onChange={e => setSelectedProgram(p => p ? { ...p, asesmenPraktik: e.target.checked } : null)}
                      className="rounded text-emerald-650"
                    />
                    <span>Adakan Tugas Praktik Audio (Setoran Lisan)</span>
                  </label>

                  {selectedProgram.asesmenPraktik && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">DAFTAR ASPEK YANG DINILAI:</span>
                      
                      <div className="flex flex-wrap gap-2">
                        {(selectedProgram.aspekPenilaianList || DEFAULT_ASPEK_LIST).map((asp) => (
                          <div key={asp} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                            <span className="text-[11px] text-slate-850 dark:text-slate-250 font-semibold">{asp}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = selectedProgram.aspekPenilaianList || [...DEFAULT_ASPEK_LIST];
                                setSelectedProgram(p => p ? {
                                  ...p,
                                  aspekPenilaianList: currentList.filter(x => x !== asp)
                                } : null);
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-black ml-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tambah aspek baru..."
                          value={customAspectInput}
                          onChange={e => setCustomAspectInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-normal"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!customAspectInput.trim()) return;
                            const currentList = selectedProgram.aspekPenilaianList || [...DEFAULT_ASPEK_LIST];
                            if (currentList.includes(customAspectInput.trim())) return;
                            setSelectedProgram(p => p ? {
                              ...p,
                              aspekPenilaianList: [...currentList, customAspectInput.trim()]
                            } : null);
                            setCustomAspectInput('');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Anti-Cheat & CBT Default Protection Settings for Edit Program */}
                <div className="border-t border-slate-150 pt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Proteksi Ujian CBT & Anti-Curang (Default Program)</h4>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedProgram.antiCheatEnabled !== false}
                        onChange={e => setSelectedProgram(p => p ? ({ ...p, antiCheatEnabled: e.target.checked }) : null)}
                        className="rounded text-emerald-600"
                      />
                      <span>Aktifkan Mode Anti-Curang (Client Proctoring)</span>
                    </label>

                    {selectedProgram.antiCheatEnabled !== false && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-600 font-bold mb-1">Maksimal Peringatan Pindah Tab</label>
                            <input
                              type="number" min={1} max={10}
                              value={selectedProgram.maxViolations || 3}
                              onChange={e => setSelectedProgram(p => p ? ({ ...p, maxViolations: Number(e.target.value) || 3 }) : null)}
                              className="w-full bg-white border border-slate-200 rounded p-1.5 font-bold text-slate-900"
                            />
                            <p className="text-[9px] text-slate-400 mt-0.5">Ujian auto-submit jika melebihi batas ini.</p>
                          </div>
                          <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-1.5 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={selectedProgram.requireFullscreen !== false}
                                onChange={e => setSelectedProgram(p => p ? ({ ...p, requireFullscreen: e.target.checked }) : null)}
                              />
                              <span>Wajib Layar Penuh (Fullscreen)</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={selectedProgram.blockCopyPaste !== false}
                                onChange={e => setSelectedProgram(p => p ? ({ ...p, blockCopyPaste: e.target.checked }) : null)}
                              />
                              <span>Blokir Copy-Paste & Klik Kanan</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-600 font-bold mb-1">Teks Anjuran Kejujuran (Tampil di Akun Santri)</label>
                          <textarea
                            rows={2}
                            value={selectedProgram.petunjukKejujuran || DEFAULT_PETUNJUK_KEJUJURAN}
                            onChange={e => setSelectedProgram(p => p ? ({ ...p, petunjukKejujuran: e.target.value }) : null)}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl">Update Program</button>
                </div>
              </form>
            )}

            {modalType === 'create_bab' && selectedProgram && (
              <form onSubmit={handleCreateBabAction} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-650 mb-1">Judul Bab *</label>
                  <input
                    type="text" required
                    placeholder="Contoh: Makhraj Syafawi"
                    value={babForm.judul}
                    onChange={e => setBabForm(p => ({ ...p, judul: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-650 mb-1">Tujuan Pembelajaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Santri mampu melafalkan huruf Ba, Mim, Fa..."
                    value={babForm.tujuanPembelajaran}
                    onChange={e => setBabForm(p => ({ ...p, tujuanPembelajaran: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-650 mb-1">Estimasi Waktu</label>
                    <input
                      type="text"
                      placeholder="Contoh: 2 Jam / 3 Pekan"
                      value={babForm.estimasiWaktu}
                      onChange={e => setBabForm(p => ({ ...p, estimasiWaktu: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-650 mb-1">Nomor Urutan</label>
                    <input
                      type="number"
                      value={babForm.urutan}
                      onChange={e => setBabForm(p => ({ ...p, urutan: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">Buat Bab</button>
                </div>
              </form>
            )}

            {(modalType === 'create_materi' || modalType === 'edit_materi' || modalType === 'create_praktik' || modalType === 'edit_praktik') && selectedBab && (
              <form onSubmit={handleMateriSubmitAction} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-650 dark:text-slate-350 mb-1">
                    {(modalType === 'create_praktik' || modalType === 'edit_praktik') ? 'Judul Tugas Praktik *' : 'Judul Materi Pembelajaran *'}
                  </label>
                  <input
                    type="text" required
                    placeholder={(modalType === 'create_praktik' || modalType === 'edit_praktik') ? "Contoh: Setoran Hafalan QS Al-Mulk ayat 1-5" : "Contoh: Pembagian Hukum Nun Mati"}
                    value={materiForm.judul}
                    onChange={e => setMateriForm(p => ({ ...p, judul: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                  />
                </div>

                {!(modalType === 'create_praktik' || modalType === 'edit_praktik') && selectedProgram && selectedProgram.tipeMateri !== 'Modul' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-650 dark:text-slate-350 mb-1">Bab Referensi Buku *</label>
                      <input
                        type="text" required
                        placeholder="Contoh: Bab III"
                        value={materiForm.cetakInfo?.bab || ''}
                        onChange={e => setMateriForm(p => ({
                          ...p,
                          cetakInfo: { ...(p.cetakInfo || {} as any), bab: e.target.value }
                        }))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-650 dark:text-slate-350 mb-1">Halaman Buku *</label>
                      <input
                        type="text" required
                        placeholder="Contoh: Hal. 45-50"
                        value={materiForm.cetakInfo?.halaman || ''}
                        onChange={e => setMateriForm(p => ({
                          ...p,
                          cetakInfo: { ...(p.cetakInfo || {} as any), halaman: e.target.value }
                        }))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                      />
                    </div>
                  </div>
                )}

                {!(modalType === 'create_praktik' || modalType === 'edit_praktik') && selectedProgram && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-2">
                    <span className="text-[9px] font-bold text-emerald-850 dark:text-emerald-400 uppercase tracking-wider block">Konfigurasi Referensi Otomatis</span>
                    <p className="text-[11px] text-emerald-950 dark:text-emerald-300">
                      Tipe Materi: <strong>{selectedProgram.tipeMateri === 'Modul' ? 'Modul Digital (Aplikasi)' : 'Buku Cetak / Referensi Manual'}</strong>
                    </p>
                    {selectedProgram.tipeMateri === 'Modul' ? (
                      (() => {
                        const targetModul = moduls.find(mod => mod.id === selectedProgram.modulId);
                        return (
                          <p className="text-[11px] text-slate-700 dark:text-slate-300">
                            Terhubung ke Modul: <strong className="text-emerald-800 dark:text-emerald-400">{targetModul ? (targetModul.namaSurat ? `Surat ${targetModul.namaSurat}` : targetModul.judulModul) : 'Tidak ditemukan'}</strong>
                          </p>
                        );
                      })()
                    ) : (
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                        <p>Buku Referensi: <strong className="text-emerald-850 dark:text-emerald-400">{selectedProgram.cetakInfo?.namaBuku || '-'}</strong></p>
                        <p>Penulis: <span>{selectedProgram.cetakInfo?.penulis || '-'}</span></p>
                        <p>Bab/Halaman (Default Program): <span>{selectedProgram.cetakInfo?.bab || '-'} / {selectedProgram.cetakInfo?.halaman || '-'}</span></p>
                      </div>
                    )}
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-normal mt-1 italic">
                      * Informasi referensi di atas terhubung pada tingkat Program Keilmuan utama.
                    </span>
                  </div>
                )}

                {(modalType === 'create_praktik' || modalType === 'edit_praktik') && (
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-650 dark:text-slate-350 font-bold">Petunjuk Tugas Praktik / Instruksi Rekaman *</label>
                      <textarea
                        required
                        placeholder="Contoh: Silakan rekam atau unggah audio Anda ketika membaca lafadz Isti'adzah dan Basmalah dengan tartil."
                        value={materiForm.praktikPetunjuk || ''}
                        onChange={e => setMateriForm(p => ({ ...p, praktikPetunjuk: e.target.value }))}
                        rows={3}
                        className="w-full text-xs font-normal bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                      />
                    </div>

                    <div className="space-y-2 pt-3 border-t border-amber-200/30">
                      <label className="block text-[10px] text-slate-650 dark:text-slate-350 font-bold uppercase tracking-wider">
                        Pilih Aspek Penilaian Tugas ini *
                      </label>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 italic font-normal">
                        Siswa akan dinilai berdasarkan aspek-aspek yang dicentang di bawah ini.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        {(selectedProgram?.aspekPenilaianList && selectedProgram.aspekPenilaianList.length > 0 
                          ? selectedProgram.aspekPenilaianList 
                          : DEFAULT_ASPEK_LIST
                        ).map((asp) => {
                          const currentSelected = materiForm.aspekPenilaianSelected || (modalType === 'create_praktik' 
                            ? (selectedProgram?.aspekPenilaianList && selectedProgram.aspekPenilaianList.length > 0 
                                ? [...selectedProgram.aspekPenilaianList] 
                                : [...DEFAULT_ASPEK_LIST]) 
                            : []);
                          const isChecked = currentSelected.includes(asp);
                          
                          return (
                            <label key={asp} className="flex items-center gap-2 bg-white dark:bg-slate-900/60 p-2.5 border border-slate-200/50 dark:border-slate-800 rounded-lg cursor-pointer hover:border-amber-300 dark:hover:border-slate-750 transition shadow-sm">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  let newList = [...currentSelected];
                                  if (e.target.checked) {
                                    if (!newList.includes(asp)) newList.push(asp);
                                  } else {
                                    newList = newList.filter(x => x !== asp);
                                  }
                                  setMateriForm(p => ({ ...p, aspekPenilaianSelected: newList }));
                                }}
                                className="rounded text-emerald-650 focus:ring-emerald-500"
                              />
                              <span className="text-[11px] text-slate-750 dark:text-slate-350 font-semibold">{asp}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">
                    {(modalType === 'edit_materi' || modalType === 'edit_praktik') ? 'Simpan Perubahan' : 
                     (modalType === 'create_praktik') ? 'Tambahkan Tugas Praktik' : 'Tambahkan Materi'}
                  </button>
                </div>
              </form>
            )}

            {(modalType === 'create_latihan' || modalType === 'edit_latihan') && selectedBab && (
              <form onSubmit={handleLatihanSubmitAction} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-650 dark:text-slate-350 mb-1">Pertanyaan Soal Latihan *</label>
                  <input
                    type="text" required
                    placeholder="Contoh: Apabila Nun Sukun bertemu huruf Ba, hukumnya adalah..."
                    value={latihanForm.pertanyaan}
                    onChange={e => setLatihanForm(p => ({ ...p, pertanyaan: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                  />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase">Opsi Pilihan (Isi Semua):</span>
                  
                  {latihanForm.opsi?.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <span className="font-mono text-slate-400">Opsi {String.fromCharCode(65 + oIdx)}:</span>
                      <input
                        type="text" required
                        value={opt}
                        onChange={e => {
                          const updatedOpts = [...(latihanForm.opsi || [])];
                          updatedOpts[oIdx] = e.target.value;
                          setLatihanForm(p => ({ ...p, opsi: updatedOpts }));
                        }}
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1.5 text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-slate-650 dark:text-slate-350 mb-1">Jawaban Benar (Ketik persis sama dengan salah satu opsi) *</label>
                  <input
                    type="text" required
                    placeholder="Harus sama persis dengan salah satu opsi di atas"
                    value={latihanForm.jawabanBenar as string}
                    onChange={e => setLatihanForm(p => ({ ...p, jawabanBenar: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">
                    {modalType === 'edit_latihan' ? 'Simpan Perubahan' : 'Tambahkan Soal'}
                  </button>
                </div>
              </form>
            )}

            {(modalType === 'create_asesmen' || modalType === 'edit_asesmen') && selectedBab && (
              <form onSubmit={handleAsesmenSubmitAction} className="space-y-4 text-xs font-semibold">
                {/* Jenis Soal (Tickbox styled buttons) */}
                <div>
                  <label className="block text-slate-650 dark:text-slate-350 mb-2">Jenis Soal / Tipe Pertanyaan *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'pilihan_ganda', label: 'Pilihan Ganda' },
                      { key: 'benar_salah', label: 'Benar - Salah' },
                      { key: 'rumpang', label: 'Isian: Rumpang / Isian Singkat' },
                      { key: 'esai', label: 'Esay / Uraian Bebas' },
                    ].map((t) => {
                      const isSelected = (asesmenForm.tipe || 'pilihan_ganda') === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => {
                            let initialOpsi: string[] = [];
                            let initialJawaban = '';
                            if (t.key === 'pilihan_ganda') {
                              initialOpsi = ['', '', '', ''];
                            } else if (t.key === 'benar_salah') {
                              initialOpsi = ['Benar', 'Salah'];
                              initialJawaban = 'Benar';
                            }
                            setAsesmenForm(p => ({
                              ...p,
                              tipe: t.key as any,
                              opsi: initialOpsi,
                              jawabanBenar: initialJawaban
                            }));
                          }}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                          </div>
                          <span className="text-[11px] leading-tight">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-650 dark:text-slate-350 mb-1">Pertanyaan Ujian CBT *</label>
                  <input
                    type="text" required
                    placeholder={
                      asesmenForm.tipe === 'rumpang' 
                        ? "Contoh: Apabila Nun Sukun bertemu huruf Ba, maka hukumnya disebut [blank]..." 
                        : "Pertanyaan evaluasi kognitif..."
                    }
                    value={asesmenForm.pertanyaan}
                    onChange={e => setAsesmenForm(p => ({ ...p, pertanyaan: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                  />
                </div>

                {/* Conditional Options Field */}
                {(asesmenForm.tipe === 'pilihan_ganda' || !asesmenForm.tipe) && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase">Opsi Pilihan:</span>
                    {asesmenForm.opsi?.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2 items-center">
                        <span className="font-mono text-slate-400">{String.fromCharCode(65 + oIdx)}:</span>
                        <input
                          type="text" required
                          value={opt}
                          onChange={e => {
                            const updatedOpts = [...(asesmenForm.opsi || [])];
                            updatedOpts[oIdx] = e.target.value;
                            setAsesmenForm(p => ({ ...p, opsi: updatedOpts }));
                          }}
                          className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1.5 text-slate-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {asesmenForm.tipe === 'benar_salah' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold uppercase">Info Benar-Salah</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Siswa akan diberikan pilihan "Benar" dan "Salah" secara otomatis.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-650 dark:text-slate-350 mb-1">Jawaban Benar *</label>
                    {asesmenForm.tipe === 'benar_salah' ? (
                      <select
                        required
                        value={asesmenForm.jawabanBenar as string || 'Benar'}
                        onChange={e => setAsesmenForm(p => ({ ...p, jawabanBenar: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                      >
                        <option value="Benar">Benar</option>
                        <option value="Salah">Salah</option>
                      </select>
                    ) : asesmenForm.tipe === 'esai' ? (
                      <textarea
                        required
                        placeholder="Contoh: Kunci jawaban acuan atau rubrik penilaian guru"
                        value={asesmenForm.jawabanBenar as string}
                        onChange={e => setAsesmenForm(p => ({ ...p, jawabanBenar: e.target.value }))}
                        rows={1}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5 h-[38px] resize-none"
                      />
                    ) : (
                      <input
                        type="text" required
                        placeholder={
                          asesmenForm.tipe === 'rumpang'
                            ? "Ketik kata kunci jawaban benar"
                            : "Ketik persis salah satu opsi di atas"
                        }
                        value={asesmenForm.jawabanBenar as string}
                        onChange={e => setAsesmenForm(p => ({ ...p, jawabanBenar: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-650 dark:text-slate-350 mb-1">Bobot Nilai *</label>
                    <input
                      type="number" required min={1} max={100}
                      value={asesmenForm.bobot}
                      onChange={e => setAsesmenForm(p => ({ ...p, bobot: Number(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">
                    {modalType === 'edit_asesmen' ? 'Simpan Perubahan' : 'Tambahkan Soal'}
                  </button>
                </div>
              </form>
            )}

            {modalType === 'enroll_student' && (
              <form onSubmit={handleEnrollStudentAction} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-650 mb-1">Pilih Siswa *</label>
                  <select
                    required
                    value={enrollForm.siswaId}
                    onChange={e => setEnrollForm(p => ({ ...p, siswaId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-950"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {siswas.map(s => (
                      <option key={s.id} value={s.id}>{s.namaLengkap} (NIS: {s.nis})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-650 mb-1">Pilih Program Keilmuan *</label>
                  <select
                    required
                    value={enrollForm.programId}
                    onChange={e => setEnrollForm(p => ({ ...p, programId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-950"
                  >
                    <option value="">-- Pilih Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">Daftarkan Siswa</button>
                </div>
              </form>
            )}

            {modalType === 'edit_asesmen_setting' && selectedBab && (
              <form onSubmit={handleSaveAsesmenSetting} className="space-y-4 text-xs font-semibold">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Pengaturan CBT Bab: {selectedBab.judul}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Konfigurasi durasi ujian, batas soal, sistem acak, serta proteksi sensor anti-curang khusus bab ini.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-650 dark:text-slate-350 mb-1">Durasi Pengerjaan (Menit) *</label>
                    <input
                      type="number" min={1} max={180} required
                      value={asesmenSettingForm.durasi || 15}
                      onChange={e => setAsesmenSettingForm(p => ({ ...p, durasi: Number(e.target.value) || 15 }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-650 dark:text-slate-350 mb-1">Jumlah Soal yang Dikeluarkan</label>
                    <input
                      type="number" min={1} max={100}
                      value={asesmenSettingForm.jumlahSoal || 5}
                      onChange={e => setAsesmenSettingForm(p => ({ ...p, jumlahSoal: Number(e.target.value) || 5 }))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-2.5 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={asesmenSettingForm.acakSoal !== false}
                      onChange={e => setAsesmenSettingForm(p => ({ ...p, acakSoal: e.target.checked }))}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-[11px] text-slate-800 dark:text-slate-200">Acak Urutan Soal (Shuffle)</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={asesmenSettingForm.acakJawaban === true}
                      onChange={e => setAsesmenSettingForm(p => ({ ...p, acakJawaban: e.target.checked }))}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-[11px] text-slate-800 dark:text-slate-200">Acak Opsi Pilihan Jawaban</span>
                  </label>
                </div>

                {/* Anti-Cheat Proctoring Settings */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 dark:text-white text-xs">Proteksi Anti-Curang (Proctoring)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={asesmenSettingForm.antiCheatEnabled !== false}
                        onChange={e => setAsesmenSettingForm(p => ({ ...p, antiCheatEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {asesmenSettingForm.antiCheatEnabled !== false && (
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1">Maksimal Peringatan Pindah Tab</label>
                          <input
                            type="number" min={1} max={10}
                            value={asesmenSettingForm.maxViolations || 3}
                            onChange={e => setAsesmenSettingForm(p => ({ ...p, maxViolations: Number(e.target.value) || 3 }))}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded p-1.5 font-bold"
                          />
                          <p className="text-[9px] text-slate-400 mt-0.5">Ujian auto-submit jika pelanggaran melebihi angka ini.</p>
                        </div>
                        <div className="space-y-2 pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={asesmenSettingForm.requireFullscreen !== false}
                              onChange={e => setAsesmenSettingForm(p => ({ ...p, requireFullscreen: e.target.checked }))}
                            />
                            <span>Wajib Layar Penuh (Fullscreen)</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={asesmenSettingForm.blockCopyPaste !== false}
                              onChange={e => setAsesmenSettingForm(p => ({ ...p, blockCopyPaste: e.target.checked }))}
                            />
                            <span>Blokir Copy-Paste & Klik Kanan</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1">Teks Anjuran Kejujuran (Tampil di Akun Santri)</label>
                        <textarea
                          rows={3}
                          value={asesmenSettingForm.petunjukKejujuran || DEFAULT_PETUNJUK_KEJUJURAN}
                          onChange={e => setAsesmenSettingForm(p => ({ ...p, petunjukKejujuran: e.target.value }))}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 text-xs leading-relaxed"
                        />
                        <p className="text-[9px] text-slate-400 mt-1 italic">Pesan ini akan ditampilkan kepada santri sebelum dan saat pengerjaan ujian.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">Simpan Pengaturan CBT</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Data Program Keilmuan */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base text-center">
              Konfirmasi {confirmDelete.type === 'enrollment' ? 'Keluarkan Santri' : 'Hapus Data Program'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
              Apakah Anda yakin ingin {confirmDelete.type === 'enrollment' ? 'mengeluarkan santri dari program' : 'menghapus secara permanen'} <strong className="text-slate-800 dark:text-slate-200">"{confirmDelete.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            {confirmDelete.desc && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1 text-center line-clamp-2">
                {confirmDelete.desc}
              </p>
            )}
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Memproses...' : confirmDelete.type === 'enrollment' ? 'Ya, Keluarkan' : 'Ya, Hapus Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
