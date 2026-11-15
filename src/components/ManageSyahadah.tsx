/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  FileCheck, 
  X, 
  Printer, 
  Sliders, 
  Image as ImageIcon, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Check, 
  Clock, 
  AlertCircle, 
  FileText, 
  Search, 
  QrCode,
  Sparkles,
  Info,
  ExternalLink,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, Syahadah, SyahadahRule, KategoriAssessment, hasAdminTabPermission, getAdminTabLabel } from '../types';

const getGoogleSlidesEmbedUrl = (url: string) => {
  if (!url) return '';
  const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
  }
  return '';
};

export default function ManageSyahadah() {
  const { 
    currentSession, 
    syahadahs = [], 
    syahadahRules = [], 
    assessmentRecords = [], 
    jenisAssessments = [],
    createSyahadah, 
    updateSyahadah, 
    deleteSyahadah, 
    createSyahadahRule, 
    updateSyahadahRule, 
    deleteSyahadahRule,
    siswas = [],
    gurus = [],
    halaqahs = [],
    mataPelajarans = [],
    strukturLembaga,
    syahadahSettings,
    updateSyahadahSettings
  } = useApp();

  const getSiswaGuruHalaqahNama = (siswaId: string) => {
    const siswa = siswas.find(s => s.id === siswaId);
    if (!siswa) return 'Ustadz Pembimbing Halaqah';
    const halaqah = halaqahs.find(h => h.id === siswa.halaqahId);
    return halaqah?.guruPembimbingNama || 'Ustadz Pembimbing Halaqah';
  };

  const role = currentSession.user?.role || UserRole.SISWA;
  const currentUserId = currentSession.user?.id || '';
  const currentUserName = currentSession.user?.namaLengkap || '';

  // Confirmation Delete Modal State
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'syahadah' | 'rule' | 'disposisi';
    id: string;
    title: string;
    desc?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      if (confirmDelete.type === 'syahadah' || confirmDelete.type === 'disposisi') {
        deleteSyahadah(confirmDelete.id);
      } else if (confirmDelete.type === 'rule') {
        deleteSyahadahRule(confirmDelete.id);
      }
      setConfirmDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const canAccessPenerbitan = hasAdminTabPermission(currentSession.user, 'manajemen_syahadah', 'penerbitan');
  const canAccessAturan = hasAdminTabPermission(currentSession.user, 'manajemen_syahadah', 'aturan');

  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    if (canAccessPenerbitan) return 'penerbitan';
    if (canAccessAturan) return 'aturan';
    return 'penerbitan';
  });

  useEffect(() => {
    if (activeSubTab === 'penerbitan' && !canAccessPenerbitan && canAccessAturan) {
      setActiveSubTab('aturan');
    } else if (activeSubTab === 'aturan' && !canAccessAturan && canAccessPenerbitan) {
      setActiveSubTab('penerbitan');
    }
  }, [canAccessPenerbitan, canAccessAturan, activeSubTab]);

  // LIFTED ADMIN PANEL STATES
  const [selectedRule, setSelectedRule] = useState<SyahadahRule | null>(null);
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [selectionModel, setSelectionModel] = useState<'direktorat' | 'langsung_sekolah'>('direktorat');
  const [ruleForm, setRuleForm] = useState<Omit<SyahadahRule, 'id' | 'tanggalDibuat'>>({
    namaSyahadah: '',
    jenisAssessmentId: '',
    namaAssessment: '',
    nilaiMinimal: 85,
    templateType: 'image',
    slidesTemplateUrl: '',
    imageUrl: '',
    fieldPositions: {
      siswaNama: { x: 50, y: 38, fontSize: 28 },
      nomorSertifikat: { x: 50, y: 22, fontSize: 13 },
      predikat: { x: 50, y: 46, fontSize: 18 },
      tanggalTerbit: { x: 50, y: 78, fontSize: 12 },
      namaGuru: { x: 26, y: 72, fontSize: 13 },
      namaPimpinan: { x: 74, y: 72, fontSize: 13 },
      qrCode: { x: 50, y: 60, fontSize: 40 }
    },
    ttdNama: 'Pimpinan Lembaga',
    ttdJabatan: 'Dekan Markaz',
    elemenId: '',
    elemenNama: '',
    yayasanId: '',
    yayasanNama: '',
    direktoratId: '',
    direktoratNama: '',
    sekolahId: '',
    sekolahNama: '',
    jenjangId: '',
    jenjangNama: '',
  });
  const [selectedFieldName, setSelectedFieldName] = useState<string>('siswaNama');
  const [previewAspect, setPreviewAspect] = useState<number>(1.414);

  // LIFTED GURU PANEL STATES
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [guruNotes, setGuruNotes] = useState('');
  const [assignedPredikat, setAssignedPredikat] = useState<'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul'>('Jayyid Jiddan');

  // LIFTED ADMIN PANEL EFFECT
  useEffect(() => {
    if (ruleForm.imageUrl && ruleForm.imageUrl !== 'CLASSIC_FRAME') {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setPreviewAspect(img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = ruleForm.imageUrl;
    } else {
      setPreviewAspect(1.414); // Fallback to classic landscape certificate standard
    }
  }, [ruleForm.imageUrl]);
  
  // LIFTED ADMIN PANEL REF
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for verification search
  const [searchSerial, setSearchSerial] = useState('');
  const [verifiedSyahadah, setVerifiedSyahadah] = useState<Syahadah | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // States for print preview overlay
  const [viewingCertificate, setViewingCertificate] = useState<Syahadah | null>(null);
  const [viewingCertificateAspect, setViewingCertificateAspect] = useState<number>(1.414);

  useEffect(() => {
    if (viewingCertificate?.templateType === 'image' && viewingCertificate?.imageUrl && viewingCertificate.imageUrl !== 'CLASSIC_FRAME') {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setViewingCertificateAspect(img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = viewingCertificate.imageUrl;
    } else {
      setViewingCertificateAspect(1.414); // Fallback to classical frame landscape standard (1.414:1)
    }
  }, [viewingCertificate]);

  // Fallback default tabs per user role
  useEffect(() => {
    if (role === UserRole.GURU) {
      setActiveSubTab('rekomendasi');
    } else if (role === UserRole.SISWA) {
      setActiveSubTab('my-certificates');
    } else {
      setActiveSubTab('penerbitan');
    }
  }, [role]);

  // General helpers for auto predikat based on scores
  const getPredikatLabel = (score: number): 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' => {
    if (score >= 93) return 'Mumtaz';
    if (score >= 85) return 'Jayyid Jiddan';
    if (score >= 75) return 'Jayyid';
    return 'Maqbul';
  };

  const getPredikatColors = (predikat: string) => {
    switch (predikat) {
      case 'Mumtaz': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Jayyid Jiddan': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Jayyid': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // 1. ADMIN SUB-PANELS
  const renderAdminPanel = () => {
    const allElements = (mataPelajarans || []).flatMap((mp) => 
      (mp.elemenList || []).map(elem => ({
        ...elem,
        mataPelajaranNama: mp.nama,
        mataPelajaranId: mp.id,
      }))
    );
    const isStructureA = (strukturLembaga?.selectedStructure || 'A') === 'A';
    const isStructureBOrC = (strukturLembaga?.selectedStructure === 'B' || strukturLembaga?.selectedStructure === 'C');

    // Save Rule handler
    const handleSaveRule = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!ruleForm.namaSyahadah || !ruleForm.jenisAssessmentId) {
        alert('Harap isi Nama Syahadah dan kaitkan dengan Ujian.');
        return;
      }
      
      const assocAssessment = jenisAssessments.find(a => a.id === ruleForm.jenisAssessmentId);
      const ruleData = {
        ...ruleForm,
        namaAssessment: assocAssessment ? assocAssessment.namaAssessment : 'Assessment Terkait'
      };

      if (selectedRule) {
        await updateSyahadahRule(selectedRule.id, ruleData);
      } else {
        await createSyahadahRule({
          ...ruleData,
          tanggalDibuat: new Date().toISOString().slice(0, 10)
        });
      }
      setIsEditingRule(false);
      setSelectedRule(null);
    };

    // Upload background image base64
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setRuleForm(prev => ({
            ...prev,
            imageUrl: loadEvt.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    };

    const loadDefaultBackground = () => {
      // Set to default pre-designed classic frame state
      setRuleForm(prev => ({
        ...prev,
        imageUrl: 'CLASSIC_FRAME'
      }));
    };

    const clearUploadedImage = () => {
      setRuleForm(prev => ({
        ...prev,
        imageUrl: ''
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleFieldPositionChange = (field: string, axis: 'x' | 'y' | 'fontSize', modifier: number) => {
      setRuleForm(prev => {
        const current = prev.fieldPositions?.[field] || { x: 50, y: 50, fontSize: 14 };
        let newVal = (current[axis] || 0) + modifier;
        if (axis === 'x' || axis === 'y') {
          newVal = Math.min(100, Math.max(0, newVal));
        } else {
          newVal = Math.max(6, newVal);
        }
        return {
          ...prev,
          fieldPositions: {
            ...prev.fieldPositions,
            [field]: {
              ...current,
              [axis]: newVal
            }
          }
        };
      });
    };

    // Pending Admin approval filters
    const requestsPendingAdmin = syahadahs.filter(s => s.status === 'Pending_Admin');
    const logsIssued = syahadahs.filter(s => s.status === 'Disetujui' || s.status === 'Ditolak_Admin');

    const handleApproveAdmin = async (syh: Syahadah) => {
      // Find default numbering count to generate certificate sequential serial number
      const currentYear = new Date().getFullYear();
      const approvedThisYear = syahadahs.filter(s => s.status === 'Disetujui' && s.tanggalTerbit.startsWith(String(currentYear))).length;
      const serialCount = String(approvedThisYear + 1).padStart(4, '0');
      const generatedSerial = `SYH/${currentYear}/${serialCount}`;

      await updateSyahadah(syh.id, {
        status: 'Disetujui',
        nomorSertifikat: generatedSerial,
        tanggalTerbit: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
        approverAdminId: currentUserId,
        approverAdminNama: currentUserName,
        qrCodeUrl: `${window.location.origin}/verify-syahadah?id=${syh.id}`
      });
    };

    const handleRejectAdmin = async (syh: Syahadah) => {
      const notes = prompt('Masukkan alasan penolakan/catatan pembatalan untuk Guru & Santri:');
      if (notes === null) return;
      await updateSyahadah(syh.id, {
        status: 'Ditolak_Admin',
        catatanAdmin: notes || 'Berkas assessment belum sesuai kelayakan minimal syahadah.'
      });
    };

    return (
      <div className="space-y-6">
        {/* KONTROL KEBIJAKAN & VISIBILITAS MODUL SYAHADAH OLEH ADMIN */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-5">
          {/* Header & Status Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Kebijakan &amp; Akses Modul Syahadah Lembaga
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Atur apakah menu Syahadah (Ijazah) ditampilkan atau disembunyikan pada akun Guru dan Santri.
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono tracking-wide ${
                syahadahSettings?.isEnabledForGuru || syahadahSettings?.isEnabledForSiswa
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  syahadahSettings?.isEnabledForGuru || syahadahSettings?.isEnabledForSiswa ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`} />
                {syahadahSettings?.isEnabledForGuru && syahadahSettings?.isEnabledForSiswa
                  ? 'ONLINE (GURU & SANTRI)'
                  : syahadahSettings?.isEnabledForGuru
                  ? 'KHUSUS GURU'
                  : syahadahSettings?.isEnabledForSiswa
                  ? 'KHUSUS SANTRI'
                  : 'OFFLINE / HANYA ADMIN'}
              </span>
            </div>
          </div>

          {/* Educational / Policy Guidance Notice */}
          <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
              <p className="font-bold">
                Panduan Kebijakan Lembaga &amp; Efisiensi Sistem:
              </p>
              <p>
                Modul Syahadah dapat diaktifkan jika lembaga memilih untuk menerbitkan dan membagikan e-Syahadah (Ijazah digital) secara online melalui aplikasi kepada akun Guru dan Santri.
              </p>
              <p className="text-amber-800/90 dark:text-amber-300/80">
                Apabila lembaga memilih penyerahan syahadah secara langsung atau fisik (cetak piagam offline dengan tanda tangan dan cap basah resmi), modul ini disarankan <strong>dinonaktifkan</strong> untuk akun Guru dan Santri guna menghemat kuota operasi database (<em>Firestore</em>), menjaga memori perangkat tetap ringan, dan mempercepat aplikasi. Guru dan santri tetap dapat memantau rincian nilai kelulusan melalui menu <strong>Hasil Assessment</strong>.
              </p>
            </div>
          </div>

          {/* Interactive Toggle Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Toggle 1: Guru */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    Akses Menu untuk Guru &amp; Ustadz
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    syahadahSettings?.isEnabledForGuru
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {syahadahSettings?.isEnabledForGuru ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Izinkan guru membuka menu Syahadah untuk mengajukan dan merekomendasikan penerbitan syahadah santri bimbingan.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const nextVal = !syahadahSettings?.isEnabledForGuru;
                  await updateSyahadahSettings({ isEnabledForGuru: nextVal });
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  syahadahSettings?.isEnabledForGuru ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                title={syahadahSettings?.isEnabledForGuru ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    syahadahSettings?.isEnabledForGuru ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Siswa/Santri */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    Akses Menu untuk Siswa &amp; Santri
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    syahadahSettings?.isEnabledForSiswa
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {syahadahSettings?.isEnabledForSiswa ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Izinkan santri dan wali melihat riwayat, mengunduh, atau mencetak e-Syahadah langsung di akun mereka.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const nextVal = !syahadahSettings?.isEnabledForSiswa;
                  await updateSyahadahSettings({ isEnabledForSiswa: nextVal });
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  syahadahSettings?.isEnabledForSiswa ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                title={syahadahSettings?.isEnabledForSiswa ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    syahadahSettings?.isEnabledForSiswa ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Action One-click Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400">
              Perubahan langsung tersimpan ke Cloud dan berlaku otomatis secara real-time ke semua akun.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await updateSyahadahSettings({ isEnabledForGuru: false, isEnabledForSiswa: false });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer active:scale-95"
              >
                Nonaktifkan Keduanya (Hanya Admin)
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateSyahadahSettings({ isEnabledForGuru: true, isEnabledForSiswa: true });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer active:scale-95 shadow-xs"
              >
                Aktifkan untuk Semua (Guru &amp; Santri)
              </button>
            </div>
          </div>
        </div>

        {/* Navigation tabs inside Admin panel */}
        {(canAccessPenerbitan || canAccessAturan) && (
          <div className="flex border-b border-gray-200">
            {canAccessPenerbitan && (
              <button
                onClick={() => { setActiveSubTab('penerbitan'); setIsEditingRule(false); }}
                className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 hover:text-emerald-800 transition cursor-pointer ${
                  activeSubTab === 'penerbitan' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'
                }`}
              >
                {getAdminTabLabel('manajemen_syahadah', 'penerbitan', 'Penerbitan & Persetujuan')} ({requestsPendingAdmin.length})
              </button>
            )}
            {canAccessAturan && (
              <button
                onClick={() => { setActiveSubTab('aturan'); setIsEditingRule(false); }}
                className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 hover:text-emerald-800 transition cursor-pointer ${
                  activeSubTab === 'aturan' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'
                }`}
              >
                {getAdminTabLabel('manajemen_syahadah', 'aturan', 'Aturan Syahadah')} ({syahadahRules.length})
              </button>
            )}
          </div>
        )}

        {!canAccessPenerbitan && !canAccessAturan && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Akses Syahadah Dibatasi</p>
            <p className="text-xs text-slate-500">Anda tidak memiliki izin akses untuk bagian tab ini.</p>
          </div>
        )}

        {activeSubTab === 'penerbitan' && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">Kotak Masuk Persetujuan Syahadah</h4>
                <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                  Berikut adalah berkas rekomendasi Syahadah yang telah disetujui dan ditandatangani oleh Guru Halaqah utama. Harap periksa detail keselarasan nilai dan sanksi kelalaian sebelum mengonfirmasi penerbitan resmi.
                </p>
              </div>
            </div>

            {/* Verification Requests Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Menunggu Validasi Admin</h3>
              {requestsPendingAdmin.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-xs text-gray-400">
                  Belum ada usulan Syahadah masuk yang dikirim oleh Guru Pembimbing.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requestsPendingAdmin.map(syh => {
                    const record = assessmentRecords.find(r => r.id === syh.assessmentRecordId);
                    return (
                      <div key={syh.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              PREFIKS USULAN: {syh.kategori}
                            </span>
                            <h4 className="font-bold text-gray-900 mt-1">{syh.siswaNama} <span className="text-xs text-gray-450 font-normal">({syh.siswaNis})</span></h4>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getPredikatColors(syh.predikat)}`}>
                            Predikat: {syh.predikat}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2.5 rounded-lg text-xs">
                          <div>
                            <span className="text-[10px] text-gray-455 block">Ujian Terkait:</span>
                            <strong className="text-gray-900">{syh.namaAssessment}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-455 block">Nilai Capaian:</span>
                            <strong className="text-indigo-800 text-sm">{syh.nilaiAkhir} / 100</strong>
                          </div>
                          <div className="col-span-2 border-t border-gray-100 pt-2">
                            <span className="text-[10px] text-gray-455 block">Catatan &amp; Rekomendasi Guru ({syh.rekomendatorGuruNama}):</span>
                            <p className="italic text-gray-600 mt-0.5">"{syh.catatanGuru || 'Tidak ada catatan tambahan.'}"</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleRejectAdmin(syh)}
                            className="px-3.5 py-2 text-xs font-bold text-red-650 bg-red-50 hover:bg-red-150 rounded-lg transition"
                          >
                            Tolak Usulan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveAdmin(syh)}
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-900 rounded-lg flex items-center gap-1.5 shadow transition-all"
                          >
                            <FileCheck className="h-4 w-4" /> Setujui &amp; Terbit Syahadah
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Issued Logs */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Riwayat Status Berkas Syahadah</h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="p-4">Tanggal Opsi</th>
                      <th className="p-4">Santri</th>
                      <th className="p-4">Jenis Sertifikasi</th>
                      <th className="p-4 text-center">Score</th>
                      <th className="p-4">No. Seri Resmi</th>
                      <th className="p-4">Status Akhir</th>
                      <th className="p-4 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logsIssued.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-gray-400">
                          Belum ada sejarah berkas yang diproses.
                        </td>
                      </tr>
                    ) : (
                      logsIssued.map(syh => (
                        <tr key={syh.id} className="hover:bg-gray-50/50">
                          <td className="p-4 text-gray-500">{syh.tanggalTerbit || '-'}</td>
                          <td className="p-4">
                            <span className="font-bold text-gray-900 block">{syh.siswaNama}</span>
                            <span className="text-gray-400 text-[10px]">{syh.siswaNis}</span>
                          </td>
                          <td className="p-4 text-gray-700 font-bold">{syh.namaAssessment}</td>
                          <td className="p-4 text-center font-bold text-slate-900">{syh.nilaiAkhir}</td>
                          <td className="p-4 font-mono font-bold text-[11px] text-emerald-800">{syh.nomorSertifikat || 'TANPA_NOMOR'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              syh.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {syh.status === 'Disetujui' ? 'Diterbitkan' : 'Ditolak Admin'}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                            {syh.status === 'Disetujui' && (
                              <button
                                type="button"
                                onClick={() => setViewingCertificate(syh)}
                                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-150 font-bold px-2.5 py-1 rounded inline-flex items-center gap-1.5"
                              >
                                <Printer className="h-3.5 w-3.5" /> Buka Cetak
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDelete({
                                  type: 'syahadah',
                                  id: syh.id,
                                  title: `Sertifikat ${syh.namaAssessment || (syh as any).judulSyahadah || ""}`,
                                  desc: `Penerima: ${syh.siswaNama || (syh as any).namaSiswa || ""} (No. Seri: ${syh.nomorSertifikat || (syh as any).nomorSeri || "-"})`
                                });
                              }}
                              className="text-red-655 hover:bg-red-50 p-1.5 rounded transition inline-block cursor-pointer"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'aturan' && (
          <div className="space-y-6">
            {!isEditingRule ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">Daftar Regulasi &amp; Syarat Kenaikan Kelayakan Syahadah</h3>
                  <button
                    onClick={() => {
                      setRuleForm({
                        namaSyahadah: '',
                        jenisAssessmentId: '',
                        namaAssessment: '',
                        nilaiMinimal: 85,
                        templateType: 'image',
                        slidesTemplateUrl: '',
                        imageUrl: '',
                        fieldPositions: {
                          siswaNama: { x: 50, y: 38, fontSize: 24 },
                          nomorSertifikat: { x: 50, y: 22, fontSize: 13 },
                          predikat: { x: 50, y: 46, fontSize: 16 },
                          tanggalTerbit: { x: 50, y: 78, fontSize: 12 },
                          namaGuru: { x: 26, y: 72, fontSize: 13 },
                          namaPimpinan: { x: 74, y: 72, fontSize: 13 },
                          qrCode: { x: 50, y: 60, fontSize: 40 }
                        },
                        ttdNama: 'Pimpinan Lembaga',
                        ttdJabatan: 'Dekan Markaz',
                        elemenId: '',
                        elemenNama: '',
                        yayasanId: '',
                        yayasanNama: '',
                        direktoratId: '',
                        direktoratNama: '',
                        sekolahId: '',
                        sekolahNama: '',
                        jenjangId: '',
                        jenjangNama: '',
                      });
                      setSelectedRule(null);
                      setSelectionModel('direktorat');
                      setIsEditingRule(true);
                    }}
                    className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all"
                  >
                    <Plus className="h-4 w-4" /> Tambah Aturan Baru
                  </button>
                </div>

                {syahadahRules.length === 0 ? (
                  <div className="bg-white p-12 border border-gray-200 rounded-xl text-center text-xs text-gray-400 space-y-2">
                    <Award className="h-10 w-10 text-gray-300 mx-auto" />
                    <p>Belum ada aturan regulasi Syahadah yang tercantum di sistem. Tambahkan aturan baru untuk menghubungkan hasil kelulusan Ujian dengan penerbitan Syahadah.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {syahadahRules.map(rule => (
                      <div key={rule.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow transition">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="font-extrabold text-sm text-gray-900 block">{rule.namaSyahadah}</h4>
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">
                              Min. {rule.nilaiMinimal}
                            </span>
                          </div>
                          <span className="text-gray-400 text-[11px] block mt-1">Dihubungkan ke: <strong>{rule.namaAssessment}</strong></span>
                          {rule.elemenNama && (
                            <span className="text-gray-450 text-[11px] block mt-1">
                              Elemen: <span className="font-semibold text-gray-700">{rule.elemenNama}</span>
                            </span>
                          )}
                          {rule.yayasanNama && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">
                                {rule.yayasanNama}
                              </span>
                              {rule.direktoratNama && (
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-medium">
                                  {rule.direktoratNama}
                                </span>
                              )}
                              {rule.sekolahNama && (
                                <span className="text-[9px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-mono font-medium border border-pink-100">
                                  {rule.sekolahNama}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500">
                          <span>Template: <strong className="uppercase">{rule.templateType}</strong></span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRule(rule);
                                setRuleForm({
                                  namaSyahadah: rule.namaSyahadah,
                                  jenisAssessmentId: rule.jenisAssessmentId,
                                  namaAssessment: rule.namaAssessment,
                                  nilaiMinimal: rule.nilaiMinimal,
                                  templateType: rule.templateType,
                                  slidesTemplateUrl: rule.slidesTemplateUrl || '',
                                  imageUrl: rule.imageUrl || '',
                                  fieldPositions: rule.fieldPositions || {
                                    siswaNama: { x: 50, y: 38, fontSize: 24 },
                                    nomorSertifikat: { x: 50, y: 22, fontSize: 13 },
                                    predikat: { x: 50, y: 46, fontSize: 16 },
                                    tanggalTerbit: { x: 50, y: 78, fontSize: 12 },
                                    namaGuru: { x: 26, y: 72, fontSize: 13 },
                                    namaPimpinan: { x: 74, y: 72, fontSize: 13 },
                                    qrCode: { x: 50, y: 60, fontSize: 40 }
                                  },
                                  ttdNama: rule.ttdNama || 'Pimpinan Lembaga',
                                  ttdJabatan: rule.ttdJabatan || 'Dekan Markaz',
                                  elemenId: rule.elemenId || '',
                                  elemenNama: rule.elemenNama || '',
                                  yayasanId: rule.yayasanId || '',
                                  yayasanNama: rule.yayasanNama || '',
                                  direktoratId: rule.direktoratId || '',
                                  direktoratNama: rule.direktoratNama || '',
                                  sekolahId: rule.sekolahId || '',
                                  sekolahNama: rule.sekolahNama || '',
                                  jenjangId: rule.jenjangId || '',
                                  jenjangNama: rule.jenjangNama || '',
                                });
                                const initialSelectionModel = rule.direktoratId ? 'direktorat' : 'langsung_sekolah';
                                setSelectionModel(initialSelectionModel);
                                setIsEditingRule(true);
                              }}
                              className="text-gray-600 hover:text-emerald-700 p-1.5 bg-gray-50 hover:bg-emerald-50 rounded"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDelete({
                                  type: 'rule',
                                  id: rule.id,
                                  title: `Regulasi Aturan "${rule.namaSyahadah || (rule as any).judulSyahadah || ""}"`,
                                  desc: `Assessment: ${rule.namaAssessment || (rule as any).kategoriSyahadah || "-"}`
                                });
                              }}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                              title="Hapus Regulasi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE RULE FORM WITH DRAG AND DROP / COORDINATE BUILDER */
              <form onSubmit={handleSaveRule} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-5 w-5 text-emerald-800" />
                    {selectedRule ? 'Edit Desain & Aturan Syahadah' : 'Konfigurasi Pembentukan Aturan Syahadah Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setIsEditingRule(false); setSelectedRule(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Controls column */}
                  <div className="space-y-4 md:col-span-1">
                    <div>
                      <label className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block mb-1">Pilihan Elemen Pendukung</label>
                      <select
                        value={ruleForm.elemenId || ''}
                        onChange={(e) => {
                          const targetElem = allElements.find(elem => elem.id === e.target.value);
                          setRuleForm(prev => ({
                            ...prev,
                            elemenId: e.target.value,
                            elemenNama: targetElem ? `${targetElem.mataPelajaranNama} - ${targetElem.nama}` : ''
                          }));
                        }}
                        className="w-full text-xs border border-emerald-250 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 font-bold bg-emerald-50/10"
                        required
                      >
                        <option value="">-- Pilih Elemen (Mata Pelajaran) --</option>
                        {allElements.map((elem) => (
                          <option key={elem.id} value={elem.id}>
                            [{elem.mataPelajaranNama}] - {elem.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                     <div>
                      <label className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block mb-1">Pilihan Yayasan</label>
                      <select
                        value={ruleForm.yayasanId || ''}
                        onChange={(e) => {
                          const hasValue = e.target.value !== '';
                          setRuleForm(prev => ({
                            ...prev,
                            yayasanId: e.target.value,
                            yayasanNama: hasValue ? (strukturLembaga?.yayasan?.nama || '') : ''
                          }));
                        }}
                        className="w-full text-xs border border-emerald-250 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 font-bold bg-emerald-50/10"
                        required
                      >
                        <option value="">-- Pilih Yayasan --</option>
                        {strukturLembaga?.yayasan?.nama && (
                          <option value="yayasan-master">{strukturLembaga.yayasan.nama}</option>
                        )}
                      </select>
                    </div>

                    {/* PILIHAN JENIS STRUKTUR BAGI YAYASAN SEKTORAL */}
                    {strukturLembaga?.direktoratList && (strukturLembaga.direktoratList).length > 0 && (
                      <div>
                        <label className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block mb-1.5">Jenis Struktur *</label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-emerald-50/20 border border-emerald-100 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectionModel('direktorat');
                              setRuleForm(prev => ({
                                ...prev,
                                direktoratId: '',
                                direktoratNama: '',
                                sekolahId: '',
                                sekolahNama: '',
                                jenjangId: '',
                                jenjangNama: ''
                              }));
                            }}
                            className={`py-1.5 text-[10px] font-bold rounded-md transition duration-155 text-center cursor-pointer ${
                              selectionModel === 'direktorat'
                                ? 'bg-emerald-800 text-white shadow'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Struktur Berjenjang (Via Sektor/Dir)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectionModel('langsung_sekolah');
                              setRuleForm(prev => ({
                                ...prev,
                                direktoratId: '',
                                direktoratNama: '',
                                sekolahId: '',
                                sekolahNama: '',
                                jenjangId: '',
                                jenjangNama: ''
                              }));
                            }}
                            className={`py-1.5 text-[10px] font-bold rounded-md transition duration-155 text-center cursor-pointer ${
                              selectionModel === 'langsung_sekolah'
                                ? 'bg-emerald-800 text-white shadow'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Struktur Langsung (Sekolah/Unit)
                          </button>
                        </div>
                      </div>
                    )}

                    {selectionModel === 'direktorat' && (strukturLembaga?.direktoratList || []).length > 0 ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block">Pilihan Direktorat *</label>
                          {strukturLembaga?.selectedStructure === 'A' && (
                            <span className="text-[8px] text-amber-600 font-extrabold uppercase bg-amber-50 px-1.5 py-0.5 rounded">Model A (Tanpa Sektor)</span>
                          )}
                        </div>
                        <select
                          required
                          value={ruleForm.direktoratId || ''}
                          onChange={(e) => {
                            const targetDir = (strukturLembaga?.direktoratList || []).find(d => d.id === e.target.value);
                            setRuleForm(prev => ({
                              ...prev,
                              direktoratId: e.target.value,
                              direktoratNama: targetDir ? targetDir.nama : '',
                              sekolahId: '',
                              sekolahNama: '',
                              jenjangId: '',
                              jenjangNama: ''
                            }));
                          }}
                          className="w-full text-xs border border-emerald-250 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 font-bold bg-emerald-50/10"
                        >
                          <option value="">-- Pilih Direktorat / Sektor --</option>
                          {(strukturLembaga?.direktoratList || []).map((dir) => (
                            <option key={dir.id} value={dir.id}>{dir.nama}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {selectionModel === 'langsung_sekolah' || ruleForm.direktoratId ? (
                      <div>
                        <label className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block mb-1">Pilihan Unit Sekolah / Lembaga</label>
                        <select
                          value={ruleForm.sekolahId || ''}
                          onChange={(e) => {
                            const targetSch = (strukturLembaga?.sekolahList || []).find(s => s.id === e.target.value);
                            if (targetSch) {
                              const targetDir = targetSch.direktoratId 
                                ? (strukturLembaga?.direktoratList || []).find(d => d.id === targetSch.direktoratId)
                                : null;
                              
                              setRuleForm(prev => ({
                                ...prev,
                                sekolahId: e.target.value,
                                sekolahNama: targetSch.nama,
                                direktoratId: targetSch.direktoratId || prev.direktoratId || '',
                                direktoratNama: targetDir ? targetDir.nama : (targetSch.direktoratId ? prev.direktoratNama : ''),
                                jenjangId: '',
                                jenjangNama: ''
                              }));
                            } else {
                              setRuleForm(prev => ({
                                ...prev,
                                sekolahId: '',
                                sekolahNama: '',
                                jenjangId: '',
                                jenjangNama: ''
                              }));
                            }
                          }}
                          className="w-full text-xs border border-emerald-250 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 font-bold bg-emerald-50/10"
                        >
                          <option value="">-- Pilih Unit Sekolah / Lembaga --</option>
                          {(strukturLembaga?.sekolahList || [])
                            .filter(s => selectionModel === 'langsung_sekolah' || !ruleForm.direktoratId || s.direktoratId === ruleForm.direktoratId)
                            .map((sch) => (
                              <option key={sch.id} value={sch.id}>
                                {sch.direktoratId ? '🌿 ' : '⚡ '}{sch.nama}
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : null}

                     <div>
                       <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Nama Syahadah / Sertifikasi</label>
                      <input
                        type="text"
                        value={ruleForm.namaSyahadah}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, namaSyahadah: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 font-bold"
                        placeholder="Contoh: Syahadah Juz 30, Sertifikat Program Iqra"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Kaitkan ke Sumber Ujian Assessment</label>
                      <select
                        value={ruleForm.jenisAssessmentId}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, jenisAssessmentId: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 font-bold"
                        required
                      >
                        <option value="">-- Pilih Jenis Assessment --</option>
                        {jenisAssessments.map(j => (
                          <option key={j.id} value={j.id}>{j.namaAssessment}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1 italic leading-relaxed">
                        Kelulusan dari jenis assessment di atas akan menjadi syarat utama kelayakan terbit syahadah ini.
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Batas Nilai Minimal Kelulusan (MIN SCORE)</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={ruleForm.nilaiMinimal}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, nilaiMinimal: Number(e.target.value) }))}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 font-bold"
                      />
                    </div>

                    <div className="border-t pt-3">
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Pimpinan Penandatangan (Default)</label>
                      <input
                        type="text"
                        value={ruleForm.ttdNama}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, ttdNama: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600 mb-2"
                        placeholder="Nama Lengkap Penandatangan"
                      />
                      <input
                        type="text"
                        value={ruleForm.ttdJabatan}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, ttdJabatan: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-600"
                        placeholder="Jabatan"
                      />
                    </div>

                    <div className="border-t pt-3">
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Format Desain Utama Aktif</label>
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setRuleForm(prev => ({ ...prev, templateType: 'slides' }))}
                          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border text-center transition ${
                            ruleForm.templateType === 'slides' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-650 hover:bg-gray-50'
                          }`}
                        >
                          Google Slides
                        </button>
                        <button
                          type="button"
                          onClick={() => setRuleForm(prev => ({ ...prev, templateType: 'image' }))}
                          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border text-center transition ${
                            ruleForm.templateType === 'image' ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-650 hover:bg-gray-50'
                          }`}
                        >
                          Template Gambar
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Google Slides Section Card */}
                      <div className={`p-4.5 rounded-xl border transition duration-200 ${
                        ruleForm.templateType === 'slides' ? 'bg-indigo-50/40 border-indigo-300 shadow-sm' : 'bg-slate-50/55 border-gray-200 opacity-80'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sliders className="h-4 w-4 text-indigo-650" />
                          <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">1. Google Slides Setup</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-normal mb-3">
                          Masukkan URL edit atau share Google Slides Anda. Sistem akan memetakan data dengan placeholder dinamis.
                        </p>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-extrabold text-indigo-900 block mb-1">URL Google Slides Template Presentation</label>
                            <input
                              type="text"
                              value={ruleForm.slidesTemplateUrl || ''}
                              onChange={(e) => setRuleForm(prev => ({ ...prev, slidesTemplateUrl: e.target.value }))}
                              className="w-full text-xs border border-indigo-200 rounded-lg p-2 focus:outline-none bg-white font-mono"
                              placeholder="https://docs.google.com/presentation/d/.../edit"
                            />
                          </div>

                          <div className="bg-white p-2.5 border border-indigo-150 rounded-lg">
                            <span className="text-[10px] font-extrabold text-indigo-950 block mb-1">Placeholder Didukung:</span>
                            <ul className="text-[9px] font-mono text-indigo-900 grid grid-cols-2 gap-1 flex-wrap">
                              <li>{"{{NAMA_SISWA}}"}</li>
                              <li>{"{{NIS}}"}</li>
                              <li>{"{{NOMOR_SYAHADAH}}"}</li>
                              <li>{"{{TANGGAL_TERBIT}}"}</li>
                              <li>{"{{PREDIKAT}}"}</li>
                              <li>{"{{QR_CODE}}"}</li>
                              <li>{"{{GURU_HALAQAH}}"}</li>
                              <li>{"{{PIMPINAN_SEKOLAH}}"}</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Template Gambar Section Card */}
                      <div className={`p-4.5 rounded-xl border transition duration-200 ${
                        ruleForm.templateType === 'image' ? 'bg-amber-50/40 border-amber-300 shadow-sm' : 'bg-slate-50/55 border-gray-200 opacity-80'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <ImageIcon className="h-4 w-4 text-amber-700" />
                          <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">2. Template Gambar (JPG/PNG)</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-normal mb-3">
                          Gunakan framework klasik atau unggah layout gambar kustom Anda, lalu posisikan data dinamis.
                        </p>

                         <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold text-gray-550 uppercase">Kustom Background</span>
                            <div className="flex gap-1.5">
                              {ruleForm.imageUrl && ruleForm.imageUrl !== 'CLASSIC_FRAME' && (
                                <button
                                  type="button"
                                  onClick={clearUploadedImage}
                                  className="text-[9px] font-mono font-extrabold text-rose-600 bg-white border border-rose-200 px-2 py-0.5 rounded shadow-sm hover:bg-rose-50"
                                >
                                  Hapus Gambar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={loadDefaultBackground}
                                className="text-[9px] font-mono font-extrabold text-amber-805 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm hover:bg-gray-50"
                              >
                                Pakai Klasik Default
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-center p-3.5 border-2 border-dashed border-gray-300 rounded-xl bg-white relative cursor-pointer hover:bg-amber-50/10 transition-all">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer animate-none z-10"
                              ref={fileInputRef}
                            />
                            <div className="text-center">
                              {ruleForm.imageUrl && ruleForm.imageUrl !== 'CLASSIC_FRAME' ? (
                                <div className="space-y-1">
                                  <div className="h-10 w-16 mx-auto mb-1 border border-amber-250 rounded overflow-hidden bg-gray-50">
                                    <img src={ruleForm.imageUrl} className="h-full w-full object-cover" alt="Sertifikat Thumbnail" />
                                  </div>
                                  <span className="text-[10px] text-amber-700 font-bold block">✓ Gambar Kustom Terunggah</span>
                                  <span className="text-[8px] text-gray-450 block">Klik / seret ulang untuk mengganti</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-5 w-5 text-amber-650 mx-auto mb-1" />
                                  <span className="text-[10px] text-gray-500 block">Klik/Seret file template gambar</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-gray-200/50 pt-3 space-y-2">
                            <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">Penyelarasan Bidang Teks</label>
                            <select
                              value={selectedFieldName}
                              onChange={(e) => setSelectedFieldName(e.target.value)}
                              className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 bg-white focus:outline-none"
                            >
                              <option value="siswaNama">Nama Santri</option>
                              <option value="nomorSertifikat">Nomor Sertifikat</option>
                              <option value="predikat">Predikat Kelulusan</option>
                              <option value="tanggalTerbit">Tanggal Terbitkan</option>
                              <option value="namaGuru">Guru Halaqah</option>
                              <option value="namaPimpinan">Nama Pimpinan / Kiai</option>
                              <option value="qrCode">QR Code Verifikasi</option>
                            </select>

                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                              <div className="border border-gray-250/60 p-2 rounded-lg bg-white space-y-1">
                                <span className="text-[9px] text-gray-450 block font-bold uppercase">Horizontal (X)</span>
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleFieldPositionChange(selectedFieldName, 'x', -1)}
                                    className="h-6 w-6 bg-gray-100 hover:bg-gray-205 rounded flex items-center justify-center font-bold"
                                  >
                                    <ArrowLeft className="h-3 w-3" />
                                  </button>
                                  <span className="font-mono text-xs font-bold w-10">
                                    {(ruleForm.fieldPositions?.[selectedFieldName]?.x ?? 50)}%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleFieldPositionChange(selectedFieldName, 'x', 1)}
                                    className="h-6 w-6 bg-gray-100 hover:bg-gray-205 rounded flex items-center justify-center font-bold"
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="border border-gray-250/60 p-2 rounded-lg bg-white space-y-1">
                                <span className="text-[9px] text-gray-450 block font-bold uppercase">Vertikal (Y)</span>
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleFieldPositionChange(selectedFieldName, 'y', -1)}
                                    className="h-6 w-6 bg-gray-100 hover:bg-gray-205 rounded flex items-center justify-center font-bold"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                  <span className="font-mono text-xs font-bold w-10">
                                    {(ruleForm.fieldPositions?.[selectedFieldName]?.y ?? 50)}%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleFieldPositionChange(selectedFieldName, 'y', 1)}
                                    className="h-6 w-6 bg-gray-100 hover:bg-gray-205 rounded flex items-center justify-center font-bold"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="col-span-2 border border-gray-250/60 p-2 rounded-lg bg-white flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Ukuran Font</span>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <button
                                    type="button"
                                    onClick={() => handleFieldPositionChange(selectedFieldName, 'fontSize', -1)}
                                    className="h-6 w-6 bg-gray-100 hover:bg-gray-205 rounded font-black text-xs"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-xs w-8">
                                    {(ruleForm.fieldPositions?.[selectedFieldName]?.fontSize ?? 14)}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleFieldPositionChange(selectedFieldName, 'fontSize', 1)}
                                    className="h-6 w-6 bg-gray-100 hover:bg-gray-205 rounded font-black text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Canvas visual design mockup */}
                  <div className="md:col-span-2 space-y-2">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Pratinjau Layout Kanvas Sertifikat (1.4:1 Landscape)</span>
                    
                    {ruleForm.templateType === 'slides' ? (
                      <div className="border border-indigo-200 rounded-xl bg-white overflow-hidden aspect-[1.414/1] w-full relative shadow-inner">
                        {ruleForm.slidesTemplateUrl && getGoogleSlidesEmbedUrl(ruleForm.slidesTemplateUrl) ? (
                          <iframe
                            src={getGoogleSlidesEmbedUrl(ruleForm.slidesTemplateUrl)}
                            className="absolute inset-0 w-full h-full border-0"
                            allowFullScreen={true}
                            title="Pratinjau Live Google Slides"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-indigo-105/30 flex flex-col items-center justify-center p-6 text-center space-y-3">
                            <Sliders className="h-10 w-10 text-indigo-500" />
                            <h4 className="font-extrabold text-sm text-indigo-950">Pratinjau Live Google Slides</h4>
                            <p className="text-xs text-gray-500 max-w-xs">
                              Masukkan link Google Slides yang valid di sebelah kiri untuk menampilkan template slide secara langsung di sini.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Custom Image Canvas Visual Layout Rendering */
                      <div 
                        className="border border-amber-300 rounded-xl overflow-hidden w-full bg-slate-150 relative shadow-inner select-none transition-all duration-300"
                        style={{ aspectRatio: `${previewAspect}` }}
                      >
                        
                        {/* Preset default background render if "CLASSIC_FRAME" or empty */}
                        {(!ruleForm.imageUrl || ruleForm.imageUrl === 'CLASSIC_FRAME') ? (
                          <div className="absolute inset-0 bg-stone-50 border-[12px] border-emerald-900 flex flex-col justify-between p-6 md:p-10 font-serif text-center relative">
                            {/* Inner borders ornate line */}
                            <div className="absolute inset-1 border border-amber-600 opacity-60" />
                            <div className="absolute inset-2 border-2 border-emerald-950/25 opacity-40" />

                            <div className="space-y-1">
                              <span className="text-[8px] font-mono tracking-widest text-amber-800 font-bold block">No. Sertifikat: SYH/2026/06/XXXX</span>
                              <h2 className="text-sm md:text-lg font-bold text-center text-emerald-900 tracking-wider">الشَّهَادَةِ التَّقْدِيرِيَّةِ التَّعْلِيمِيَّةِ</h2>
                              <span className="text-[9px] font-sans font-extrabold text-amber-805 tracking-widest uppercase block">SYAHADAH KELULUSAN KHUSUS</span>
                            </div>

                            <div className="my-auto space-y-1.5 text-slate-800 font-sans">
                              <span className="text-[8px] text-gray-500 block">Diberikan secara terhormat kepada:</span>
                              <h3 className="text-[14px] md:text-lg font-black text-emerald-950 border-b border-amber-500/50 inline-block px-4">SURYA DARMA SANTOSA</h3>
                              <p className="text-[8px] font-medium text-gray-600 px-6 max-w-md mx-auto leading-normal">
                                Telah lulus evaluasi secara Istiqamah pada program <span className="font-extrabold text-emerald-900">{ruleForm.namaSyahadah || '[Materi Syahadah]'}</span> dengan predikat <span className="font-bold text-emerald-800">Mumtaz (Sangat Baik)</span>.
                              </p>
                            </div>

                            {/* Signers */}
                            <div className="grid grid-cols-2 text-center font-sans text-[8px] mt-2 border-t pt-2 border-gray-150 relative z-10">
                              <div>
                                <span className="text-gray-400 block">Guru Halaqah</span>
                                <span className="font-bold text-gray-700 block mt-2 text-[9px]">Ust. Pembimbing Halaqah</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">{ruleForm.ttdJabatan || 'Pimpinan'}</span>
                                <span className="font-bold text-emerald-950 block mt-2 text-[9px]">{ruleForm.ttdNama || 'Kiai Pimpinan'}</span>
                              </div>
                            </div>
                            
                            {/* Visual QR Code Placeholder */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-75 opacity-15">
                              <QrCode className="h-28 w-28 text-emerald-900" />
                            </div>
                          </div>
                        ) : (
                          /* Custom uploaded canvas template */
                          <div 
                            className="absolute inset-0 bg-contain bg-center bg-no-repeat bg-white"
                            style={{ backgroundImage: `url("${ruleForm.imageUrl}")` }}
                          >
                            {/* Absolutely layered fields positioning based on coordinate states */}
                            <div 
                              onClick={() => setSelectedFieldName('nomorSertifikat')}
                              className={`absolute cursor-pointer px-1.5 py-0.5 rounded transition whitespace-nowrap inline-block relative ${
                                selectedFieldName === 'nomorSertifikat' ? 'bg-amber-200 border-2 border-amber-500 z-30 font-extrabold' : 'hover:bg-slate-200/50 hover:border hover:border-gray-300'
                              }`}
                              style={{
                                left: `${ruleForm.fieldPositions?.nomorSertifikat?.x ?? 50}%`,
                                top: `${ruleForm.fieldPositions?.nomorSertifikat?.y ?? 20}%`,
                                fontSize: `${ruleForm.fieldPositions?.nomorSertifikat?.fontSize ?? 12}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              SYH/2026/06/0012
                            </div>

                            <div 
                              onClick={() => setSelectedFieldName('siswaNama')}
                              className={`absolute cursor-pointer px-1.5 py-0.5 rounded transition whitespace-nowrap inline-block font-serif ${
                                selectedFieldName === 'siswaNama' ? 'bg-amber-200 border-2 border-amber-500 z-30 font-extrabold' : 'hover:bg-slate-200/50 text-gray-950 font-black'
                              }`}
                              style={{
                                left: `${ruleForm.fieldPositions?.siswaNama?.x ?? 50}%`,
                                top: `${ruleForm.fieldPositions?.siswaNama?.y ?? 38}%`,
                                fontSize: `${ruleForm.fieldPositions?.siswaNama?.fontSize ?? 26}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              SURYA DARMA SANTOSA
                            </div>

                            <div 
                              onClick={() => setSelectedFieldName('predikat')}
                              className={`absolute cursor-pointer px-1.5 py-0.5 rounded transition whitespace-nowrap inline-block uppercase tracking-wider ${
                                selectedFieldName === 'predikat' ? 'bg-amber-200 border-2 border-amber-500 z-30 font-extrabold' : 'hover:bg-slate-200/50 text-emerald-800 font-extrabold'
                              }`}
                              style={{
                                left: `${ruleForm.fieldPositions?.predikat?.x ?? 50}%`,
                                top: `${ruleForm.fieldPositions?.predikat?.y ?? 46}%`,
                                fontSize: `${ruleForm.fieldPositions?.predikat?.fontSize ?? 16}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              MUMTAZ (SANGAT BAIK)
                            </div>

                            <div 
                              onClick={() => setSelectedFieldName('qrCode')}
                              className={`absolute cursor-pointer p-1.5 rounded transition inline-block bg-white border border-gray-150 ${
                                selectedFieldName === 'qrCode' ? 'bg-amber-200 border-2 border-amber-500 z-30' : 'hover:bg-slate-200/50'
                              }`}
                              style={{
                                left: `${ruleForm.fieldPositions?.qrCode?.x ?? 50}%`,
                                top: `${ruleForm.fieldPositions?.qrCode?.y ?? 60}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <QrCode style={{ height: `${ruleForm.fieldPositions?.qrCode?.fontSize ?? 40}px`, width: `${ruleForm.fieldPositions?.qrCode?.fontSize ?? 40}px` }} className="text-slate-900" />
                            </div>

                            <div 
                              onClick={() => setSelectedFieldName('namaGuru')}
                              className={`absolute cursor-pointer px-1.5 py-0.5 rounded transition whitespace-nowrap inline-block ${
                                selectedFieldName === 'namaGuru' ? 'bg-amber-200 border-2 border-amber-500 z-30 font-extrabold' : 'hover:bg-slate-200/50 font-bold text-gray-750'
                              }`}
                              style={{
                                left: `${ruleForm.fieldPositions?.namaGuru?.x ?? 26}%`,
                                top: `${ruleForm.fieldPositions?.namaGuru?.y ?? 72}%`,
                                fontSize: `${ruleForm.fieldPositions?.namaGuru?.fontSize ?? 13}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              Ustadz Pembimbing Halaqah (Sesuai Siswa)
                            </div>

                            <div 
                              onClick={() => setSelectedFieldName('namaPimpinan')}
                              className={`absolute cursor-pointer px-1.5 py-0.5 rounded transition whitespace-nowrap inline-block ${
                                selectedFieldName === 'namaPimpinan' ? 'bg-amber-200 border-2 border-amber-500 z-30 font-extrabold' : 'hover:bg-slate-200/50 font-bold text-emerald-950'
                              }`}
                              style={{
                                left: `${ruleForm.fieldPositions?.namaPimpinan?.x ?? 74}%`,
                                top: `${ruleForm.fieldPositions?.namaPimpinan?.y ?? 72}%`,
                                fontSize: `${ruleForm.fieldPositions?.namaPimpinan?.fontSize ?? 13}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              {ruleForm.ttdNama}
                            </div>

                            <div 
                              onClick={() => setSelectedFieldName('tanggalTerbit')}
                              className={`absolute cursor-pointer px-1.5 py-0.5 rounded transition whitespace-nowrap inline-block ${
                                selectedFieldName === 'tanggalTerbit' ? 'bg-amber-200 border-2 border-amber-500 z-30 font-extrabold' : 'hover:bg-slate-200/50 text-gray-500 italic'
                              }`}
                              style={{
                                left: `${ruleForm.fieldPositions?.tanggalTerbit?.x ?? 50}%`,
                                top: `${ruleForm.fieldPositions?.tanggalTerbit?.y ?? 78}%`,
                                fontSize: `${ruleForm.fieldPositions?.tanggalTerbit?.fontSize ?? 12}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              9 Juni 2026
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsEditingRule(false); setSelectedRule(null); }}
                    className="px-4 py-2 text-xs font-bold border border-gray-205 rounded-xl hover:bg-gray-150 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-950 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Simpan Desain &amp; Aturan
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  };

  // 2. GURU / EVALUATOR SUB-PANELS
  const renderGuruPanel = () => {
    // Retrieve records that passed assessment rules kelulusan minimal but do not have a Syahadah entry yet
    // Filter records with status Lulus/Lulus Bersyarat
    const recordsPassingMin = assessmentRecords.filter(rec => {
      // Find matching rule
      const rule = syahadahRules.find(r => r.jenisAssessmentId === rec.jenisAssessmentId);
      if (!rule) return false;
      const parsedSiswa = siswas.find(s => s.id === rec.siswaId);
      
      // must be Lulus and score must be >= rule's minimal threshold
      const scoreCheck = rec.nilaiAkhir >= rule.nilaiMinimal;
      const statusCheck = rec.statusHasil === 'Lulus' || rec.statusHasil === 'Lulus Bersyarat';
      
      // ensure we don't have an existing certificate for this record
      const hasCertificate = syahadahs.some(s => s.assessmentRecordId === rec.id);
      
      return scoreCheck && statusCheck && !hasCertificate;
    });

    const activeRecommendations = syahadahs.filter(s => s.status && s.status !== 'Disetujui');

    const handleCreateRecommendation = async (state: 'Pending_Admin' | 'Ditunda_Guru' | 'Ditolak_Guru') => {
      if (!selectedRecord) return;
      const rule = syahadahRules.find(r => r.jenisAssessmentId === selectedRecord.jenisAssessmentId);
      if (!rule) return;

      const siswaProfile = siswas.find(s => s.id === selectedRecord.siswaId);

      const payload: Omit<Syahadah, 'id'> = {
        siswaId: selectedRecord.siswaId,
        siswaNama: selectedRecord.siswaNama,
        siswaNis: selectedRecord.siswaNis || (siswaProfile?.nis || 'SANTRI-NIS'),
        assessmentRecordId: selectedRecord.id,
        namaAssessment: selectedRecord.namaAssessment,
        kategori: ruleFormKategori(selectedRecord.kategori),
        nilaiAkhir: selectedRecord.nilaiAkhir,
        predikat: assignedPredikat,
        nomorSertifikat: 'PROPOSAL-SARTIFIKAT',
        tanggalTerbit: '-',
        ttdNama: rule.ttdNama || 'Pimpinan Lembaga',
        ttdJabatan: rule.ttdJabatan || 'Dekan Markaz',
        jeniaAssessmentNama: selectedRecord.namaAssessment, // backward typo matching
        nilaiPertanggungjawaban: selectedRecord.nilaiAkhir, // backward typo matching

        status: state,
        catatanGuru: guruNotes,
        rekomendatorGuruId: currentUserId,
        rekomendatorGuruNama: currentUserName,
        
        ruleId: rule.id,
        templateType: rule.templateType,
        slidesTemplateUrl: rule.slidesTemplateUrl || '',
        imageUrl: rule.imageUrl || '',
        fieldPositions: rule.fieldPositions || {}
      };

      await createSyahadah(payload);
      setSelectedRecord(null);
      setGuruNotes('');
    };

    const ruleFormKategori = (val: string): KategoriAssessment => {
      if (val === 'Tilawah') return KategoriAssessment.TILAWAH;
      return KategoriAssessment.TAHFIDZ;
    };

    return (
      <div className="space-y-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSubTab('rekomendasi')}
            className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 hover:text-emerald-800 transition ${
              activeSubTab === 'rekomendasi' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'
            }`}
          >
            Siswa Layak Syahadah ({recordsPassingMin.length})
          </button>
          <button
            onClick={() => setActiveSubTab('status-rekomendasi')}
            className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 hover:text-emerald-800 transition ${
              activeSubTab === 'status-rekomendasi' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'
            }`}
          >
            Disposisi Saya ({activeRecommendations.length})
          </button>
        </div>

        {activeSubTab === 'rekomendasi' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-705 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-amber-950">Panduan Disposisi Rekomendasi Syahadah</h4>
                <p className="text-xs text-amber-900 leading-normal mt-0.5 font-medium">
                  Siswa di bawah ini telah melampaui skor minimal kelulusan formal. Guru berkewajiban meninjau akhlak keseharian dan disiplin murojaah santri sebelum memberikan rekomendasi sah atau melakukan penundaan sanksi santri.
                </p>
              </div>
            </div>

            {recordsPassingMin.length === 0 ? (
              <div className="bg-white p-12 border rounded-xl text-center text-xs text-gray-400">
                Semua santri yang lulus assessment formal saat ini sudah dibuatkan disposisi.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordsPassingMin.map(rec => {
                  const rule = syahadahRules.find(r => r.jenisAssessmentId === rec.jenisAssessmentId);
                  return (
                    <div key={rec.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900">{rec.siswaNama} <span className="text-xs text-gray-400">({rec.siswaNis || 'N/A'})</span></h4>
                          <span className="text-[10px] text-emerald-800 font-extrabold">Capai Nilai: {rec.nilaiAkhir} / 100</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block uppercase">Syarat Rule</span>
                          <strong className="text-xs text-indigo-900 uppercase">{rule?.namaSyahadah}</strong>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-gray-600">
                        <p><strong>Ujian:</strong> {rec.namaAssessment}</p>
                        <p><strong>Tanggal Ujian:</strong> {rec.tanggalAssessment}</p>
                        <p><strong>Catatan Penguji:</strong> <em>"{rec.catatanGuru || '-'}"</em></p>
                      </div>

                      {/* Disposisi Button Form trigger */}
                      {selectedRecord?.id === rec.id ? (
                        <div className="bg-amber-50/40 p-4 border border-amber-200 rounded-lg space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-extrabold text-amber-905 uppercase block mb-1">Set Predikat Syahadah</label>
                              <select
                                value={assignedPredikat}
                                onChange={(e) => setAssignedPredikat(e.target.value as any)}
                                className="w-full text-xs font-bold border border-amber-200 bg-white rounded p-2 focus:outline-none"
                              >
                                <option value="Mumtaz">Mumtaz (Istimewa)</option>
                                <option value="Jayyid Jiddan">Jayyid Jiddan (Sangat Baik)</option>
                                <option value="Jayyid">Jayyid (Baik)</option>
                                <option value="Maqbul">Maqbul (Cukup)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-extrabold text-amber-905 uppercase block mb-1">Evaluasi Akhlak / Catatan</label>
                              <input
                                type="text"
                                value={guruNotes}
                                onChange={(e) => setGuruNotes(e.target.value)}
                                className="w-full text-xs border border-amber-200 bg-white rounded p-2 focus:outline-none"
                                placeholder="Tulis catatan kelakuan santri..."
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(null)}
                              className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-bold"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateRecommendation('Ditolak_Guru')}
                              className="px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded"
                            >
                              Menolak
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateRecommendation('Ditunda_Guru')}
                              className="px-2.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded"
                            >
                              Menunda
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateRecommendation('Pending_Admin')}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-900 rounded shadow"
                            >
                              Rekomendasikan Resmi
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(rec);
                            setAssignedPredikat(getPredikatLabel(rec.nilaiAkhir));
                            setGuruNotes('');
                          }}
                          className="w-full py-2 bg-emerald-850 hover:bg-emerald-950 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <Sliders className="h-4 w-4" /> Proses Disposisi Kelayakan
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'status-rekomendasi' && (
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Tinjauan Status Usulan Aktif</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-4">Santri</th>
                    <th className="p-4">Sertifikasi</th>
                    <th className="p-4">Skor Akhir</th>
                    <th className="p-4">Predikat Rekomendasi</th>
                    <th className="p-4">Status Otorisasi</th>
                    <th className="p-4">Catatan Anda</th>
                    <th className="p-4 text-right">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeRecommendations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-400">
                        Belum ada data disposisi usulan yang Anda sampaikan.
                      </td>
                    </tr>
                  ) : (
                    activeRecommendations.map(s => (
                      <tr key={s.id} className="hover:bg-gray-55/50">
                        <td className="p-4 font-bold text-gray-900">{s.siswaNama}</td>
                        <td className="p-4 text-gray-600 font-medium">{s.namaAssessment}</td>
                        <td className="p-4 font-bold text-indigo-900">{s.nilaiAkhir}</td>
                        <td className="p-4 font-mono font-bold text-emerald-800">{s.predikat}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            s.status === 'Pending_Admin' ? 'bg-amber-100 text-amber-800' : (
                              s.status === 'Ditunda_Guru' ? 'bg-orange-105 text-orange-900' : 'bg-red-100 text-red-800'
                            )
                          }`}>
                            {s.status === 'Pending_Admin' ? 'Sudah Rekomendasi' : (
                              s.status === 'Ditunda_Guru' ? 'Tertunda' : 'Dibatalkan'
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 italic max-w-xs truncate" title={s.catatanGuru}>{s.catatanGuru || '-'}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDelete({
                                type: 'disposisi',
                                id: s.id,
                                title: `Usulan Disposisi: ${s.siswaNama || (s as any).namaSiswa || ""}`,
                                desc: `Sertifikat: ${s.namaAssessment || (s as any).judulSyahadah || ""}`
                              });
                            }}
                            className="text-red-500 hover:bg-red-50 p-1 rounded transition cursor-pointer font-semibold"
                            title="Tarik Berkas usulan"
                          >
                            Tarik Berkas
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 3. SISWA PANEL
  const renderSiswaPanel = () => {
    const verifiedMySyahadah = syahadahs.filter(s => s.siswaId === currentUserId && s.status === 'Disetujui');

    return (
      <div className="space-y-6">
        <div className="bg-emerald-950 text-white p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          {/* Ornate Islamic geometric graphics background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-teal-900 opacity-90 pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 h-44 w-44 border-8 border-yellow-500/10 rounded-full pointer-events-none" />
          
          <div className="relative z-10 space-y-1">
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest block">RUANG PRESTASI SANTRI</span>
            <h3 className="text-xl md:text-2xl font-serif font-black tracking-wide">Gerbang Unduh Syahadah Saya</h3>
            <p className="text-xs text-emerald-200 block max-w-md leading-relaxed">
              Selamat datang di arsip digital ijazah dan syahadah kelulusan Anda. Semua dokumen tersertifikasi autentik dan terenkripsi menggunakan kode QR verifikator instan.
            </p>
          </div>

          <div className="relative z-10 bg-yellow-500 text-gray-950 px-6 py-4 rounded-xl text-center shadow-lg border border-yellow-405">
            <span className="text-[10px] font-extrabold uppercase block tracking-wider">Koleksi Sertifikat Anda</span>
            <strong className="text-3xl font-black">{verifiedMySyahadah.length} Dokumen</strong>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Syahadah Resmi Terbit</h3>
          {verifiedMySyahadah.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-xs text-gray-400 space-y-2">
              <Award className="h-10 w-10 text-gray-300 mx-auto" />
              <p>Belum ada syahadah kelulusan resmi yang diterbitkan untuk akun Anda.</p>
              <p className="text-[10px] text-gray-500 italic">Hubungi Ustadz Pembimbing setelah Anda dinyatakan "Lulus" Ujian Assessment formal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifiedMySyahadah.map(syh => (
                <div key={syh.id} className="bg-gradient-to-br from-amber-50/40 to-emerald-50/40 border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded">
                        ID: {syh.nomorSertifikat}
                      </span>
                      <span className="text-xs text-gray-400 italic">Diterbitkan: {syh.tanggalTerbit}</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-emerald-950 mt-2 block">{syh.namaAssessment}</h4>
                    <p className="text-xs text-gray-500 leading-normal mt-1 italic">
                      "Predikat Mumtaz dicapai santri melalui ketekunan bimbingan &amp; setoran murni."
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-emerald-100/60 pt-3 mt-4">
                    <span className="text-xs text-emerald-850 font-bold block">Nilai Ujian: {syh.nilaiAkhir}</span>
                    <button
                      type="button"
                      onClick={() => setViewingCertificate(syh)}
                      className="bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Printer className="h-4 w-4" /> Cetak / Unduh PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 4. VERIFIKATOR PUBLIC SEARCH ENGINE
  const renderVerifikatorPanel = () => {
    const handleVerifySearch = (e: React.FormEvent) => {
      e.preventDefault();
      setHasSearched(true);
      if (!searchSerial.trim()) {
        setVerifiedSyahadah(null);
        return;
      }
      
      const found = syahadahs.find(s => 
        s.status === 'Disetujui' && 
        s.nomorSertifikat.toLowerCase().replace(/[^a-z0-9]/g, '') === searchSerial.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      setVerifiedSyahadah(found || null);
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="text-center space-y-2 max-w-md mx-auto">
          <ShieldCheck className="h-10 w-10 text-emerald-700 mx-auto" />
          <h3 className="font-extrabold text-lg text-gray-900">Portal Verifikasi Keaslian Syahadah</h3>
          <p className="text-xs text-gray-500">
            Masukkan Nomor Sertifikat resmi (Contoh: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">SYH/2026/0001</code>) untuk menanyakan legitimasi capaian ijazah santri.
          </p>
        </div>

        <form onSubmit={handleVerifySearch} className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={searchSerial}
            onChange={(e) => setSearchSerial(e.target.value)}
            className="flex-1 text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-emerald-700 font-mono font-bold"
            placeholder="Nomor Registrasi Syahadah"
            required
          />
          <button
            type="submit"
            className="px-5 py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-950 rounded-xl flex items-center gap-1.5 shadow"
          >
            <Search className="h-4 w-4" /> Cari
          </button>
        </form>

        {hasSearched && (
          <div className="max-w-md mx-auto pt-4 border-t border-gray-100">
            {verifiedSyahadah ? (
              <div className="bg-emerald-50 border border-emerald-250 p-5 rounded-2xl text-center space-y-4">
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-emerald-700 font-extrabold" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-900 bg-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    DOKUMEN ASLI &amp; RESMI
                  </span>
                  <h4 className="font-black text-gray-900 mt-2 text-base">{verifiedSyahadah.siswaNama}</h4>
                  <span className="text-xs text-gray-500 font-mono block mt-0.5">NIS Santri: {verifiedSyahadah.siswaNis}</span>
                </div>

                <div className="bg-white/80 border border-emerald-100 rounded-xl p-3.5 text-xs text-left text-gray-700 space-y-1.5">
                  <p><strong>Sertifikasi:</strong> {verifiedSyahadah.namaAssessment}</p>
                  <p><strong>Cetak Seri:</strong> {verifiedSyahadah.nomorSertifikat}</p>
                  <p><strong>Tanggal Terbit:</strong> {verifiedSyahadah.tanggalTerbit}</p>
                  <p><strong>Predikat Kelulusan:</strong> <span className="text-emerald-800 font-extrabold uppercase">{verifiedSyahadah.predikat}</span></p>
                  <p><strong>Pimpinan Dekat:</strong> {verifiedSyahadah.ttdNama}</p>
                </div>

                <p className="text-[10px] text-gray-400 italic leading-relaxed">
                  Data ini dicocokkan otomatis secara terintegrasi dengan database rekam jejak penilaian asatidzah di sistem.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 p-5 rounded-2xl text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
                <div>
                  <h4 className="font-extrabold text-sm text-red-950">Data Tidak Ditemukan / Tidak Valid</h4>
                  <p className="text-xs text-red-800 mt-1">
                    Silakan perbaiki format penulisan nomor sertifikat atau hubungi panitia ujian untuk mendaftarkan dokumen.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // FULLSCREEN HIGH-FIDELITY DIGITAL SYAHADAH PRINT VIEW
  const renderPrintCertificatePaper = (syh: Syahadah) => {
    const handleDoPrint = () => {
      const originalTitle = document.title;
      const sanitizedSiswaNama = (syh.siswaNama || 'Santri').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
      const docNumber = (syh.nomorSertifikat || syh.id || 'Syahadah').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
      document.title = `Syahadah_${sanitizedSiswaNama}_${docNumber}`;

      window.print();

      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    };

    // Preset positions fallbacks if missing
    const pos = syh.fieldPositions || {
      siswaNama: { x: 50, y: 38, fontSize: 28 },
      nomorSertifikat: { x: 50, y: 22, fontSize: 13 },
      predikat: { x: 50, y: 46, fontSize: 18 },
      tanggalTerbit: { x: 50, y: 78, fontSize: 12 },
      namaGuru: { x: 26, y: 72, fontSize: 13 },
      namaPimpinan: { x: 74, y: 72, fontSize: 13 },
      qrCode: { x: 50, y: 60, fontSize: 40 }
    };

    const isCustomImage = syh.templateType === 'image' && syh.imageUrl && syh.imageUrl !== 'CLASSIC_FRAME';

    return (
      <div id="syahadah-certificate-overlay" className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl overflow-hidden relative">
          
          {/* Print controls Toolbar */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> DETAIL DATA IJAZAH AKADEMIK SYAHADAH
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {syh.templateType === 'slides' && syh.slidesTemplateUrl && (
                <>
                  <a
                    href={syh.slidesTemplateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> BUKA DI GOOGLE SLIDES
                  </a>
                  {(() => {
                    const match = syh.slidesTemplateUrl.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
                    if (match && match[1]) {
                      const exportUrl = `https://docs.google.com/presentation/d/${match[1]}/export/pdf`;
                      return (
                        <a
                          href={exportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition"
                        >
                          <Download className="h-3.5 w-3.5" /> UNDUH PDF RESMI
                        </a>
                      );
                    }
                    return null;
                  })()}
                </>
              )}

              {syh.templateType !== 'slides' && (
                <button
                  type="button"
                  onClick={handleDoPrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-lg flex items-center gap-1 shadow-md transition"
                >
                  <Printer className="h-4 w-4" /> PRINT SEKARANG (PDF / KERTAS)
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewingCertificate(null)}
                className="text-gray-300 hover:text-white text-xs border border-white/20 px-3 py-2 rounded-lg hover:bg-white/10 transition"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* THE SYAHADAH PAPER TEMPLATE CANVAS */}
          <div className="p-4 bg-gray-50 flex items-center justify-center">
            
            {syh.templateType === 'slides' ? (
              <div 
                id="syahadah-print-target-canvas"
                className="w-full aspect-[1.414/1] bg-white border border-slate-200 rounded-xl overflow-hidden relative shadow-lg"
              >
                {syh.slidesTemplateUrl && getGoogleSlidesEmbedUrl(syh.slidesTemplateUrl) ? (
                  <iframe
                    src={getGoogleSlidesEmbedUrl(syh.slidesTemplateUrl)}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen={true}
                    title="Syahadah Google Slides"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <Sliders className="h-12 w-12 text-indigo-500" />
                    <h4 className="font-extrabold text-sm text-gray-905">Template Syahadah Google Slides</h4>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Sertifikat kelayakan ini menggunakan format Google Slides. Anda dapat mengunduh versi PDF resmi atau membukanya secara eksternal melalui pintasan di atas.
                    </p>
                  </div>
                )}
              </div>
            ) : isCustomImage ? (
              /* Deep custom absolute canvas over custom image background */
              <div 
                id="syahadah-print-target-canvas"
                className="w-full bg-contain bg-center bg-no-repeat bg-white relative border-[12px] border-emerald-950/20 shadow-lg select-text"
                style={{ 
                  backgroundImage: `url("${syh.imageUrl}")`,
                  aspectRatio: `${viewingCertificateAspect}`
                }}
              >
                <div 
                  className="absolute text-center whitespace-nowrap font-bold"
                  style={{
                    left: `${pos.nomorSertifikat?.x ?? 50}%`,
                    top: `${pos.nomorSertifikat?.y ?? 20}%`,
                    fontSize: `${pos.nomorSertifikat?.fontSize ?? 12}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {syh.nomorSertifikat}
                </div>

                <div 
                  className="absolute text-center whitespace-nowrap font-serif font-black text-gray-950 border-b border-amber-600/50 inline-block px-4"
                  style={{
                    left: `${pos.siswaNama?.x ?? 50}%`,
                    top: `${pos.siswaNama?.y ?? 38}%`,
                    fontSize: `${pos.siswaNama?.fontSize ?? 26}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {syh.siswaNama}
                </div>

                <div 
                  className="absolute text-center whitespace-nowrap font-bold uppercase tracking-wider text-emerald-800"
                  style={{
                    left: `${pos.predikat?.x ?? 50}%`,
                    top: `${pos.predikat?.y ?? 46}%`,
                    fontSize: `${pos.predikat?.fontSize ?? 16}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {syh.predikat} (SANGAT BAIK)
                </div>

                <div 
                  className="absolute p-1 rounded bg-white border border-gray-150 flex items-center justify-center shadow-sm"
                  style={{
                    left: `${pos.qrCode?.x ?? 50}%`,
                    top: `${pos.qrCode?.y ?? 60}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <QrCode style={{ height: `${pos.qrCode?.fontSize ?? 40}px`, width: `${pos.qrCode?.fontSize ?? 40}px` }} className="text-slate-900" />
                </div>

                <div 
                  className="absolute text-center whitespace-nowrap text-gray-800 font-bold"
                  style={{
                    left: `${pos.namaGuru?.x ?? 26}%`,
                    top: `${pos.namaGuru?.y ?? 72}%`,
                    fontSize: `${pos.namaGuru?.fontSize ?? 13}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {getSiswaGuruHalaqahNama(syh.siswaId)}
                </div>

                <div 
                  className="absolute text-center whitespace-nowrap font-serif font-black text-emerald-950"
                  style={{
                    left: `${pos.namaPimpinan?.x ?? 74}%`,
                    top: `${pos.namaPimpinan?.y ?? 72}%`,
                    fontSize: `${pos.namaPimpinan?.fontSize ?? 13}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {syh.ttdNama}
                </div>

                <div 
                  className="absolute text-center whitespace-nowrap text-gray-500 italic font-medium"
                  style={{
                    left: `${pos.tanggalTerbit?.x ?? 50}%`,
                    top: `${pos.tanggalTerbit?.y ?? 78}%`,
                    fontSize: `${pos.tanggalTerbit?.fontSize ?? 12}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  Terbit Tanggal: {syh.tanggalTerbit}
                </div>
              </div>
            ) : (
              /* Modern Islamic standard geometric framework (CLASSIC PRESET) */
              <div 
                id="syahadah-print-target-canvas"
                className="w-full aspect-[1.414/1] bg-amber-50/25 border-[20px] border-emerald-900 flex flex-col justify-between p-12 md:p-14 font-serif text-center relative border-double shadow-lg"
              >
                {/* Visual borders lines */}
                <div className="absolute inset-2 border-2 border-amber-600 opacity-60 pointer-events-none" />
                <div className="absolute inset-4 border border-emerald-950/20 opacity-40 pointer-events-none" />

                <div className="space-y-1 mt-1">
                  <span className="text-[10px] font-mono tracking-widest text-amber-800 font-bold block">No Registrasi: {syh.nomorSertifikat}</span>
                  <h2 className="text-xl md:text-3xl font-bold text-center text-emerald-950 tracking-wide">سَنَدُ الشَّهَادَةِ التَّقْدِيرِيَّةِ التَّعْلِيمِيَّةِ</h2>
                  <span className="text-xs font-sans font-black text-amber-900 tracking-widest uppercase block">SYAHADAH KELULUSAN ASSESSMENT KHUSUS</span>
                </div>

                <div className="my-auto space-y-3 font-sans text-stone-850">
                  <span className="text-xs text-gray-400 block italic">Dengan mengucap syukur kepada Allah SWT, menyatakan bahwa santri:</span>
                  <h3 className="text-lg md:text-2xl font-serif font-black text-emerald-950 border-b-2 border-amber-500 inline-block px-8 py-1 uppercase">
                    {syh.siswaNama}
                  </h3>
                  <p className="text-[10px] text-gray-400 block font-mono">Nomor Induk Santri: {syh.siswaNis}</p>
                  
                  <p className="text-xs font-medium text-gray-700 px-12 max-w-2xl mx-auto leading-relaxed">
                    Telah menyelesaikan evaluasi pengujian materi <span className="font-extrabold text-emerald-850">{syh.namaAssessment}</span> dan dinyatakan mendapat predikat <span className="font-black text-emerald-900 uppercase underline">{syh.predikat} (Sangat Baik)</span> atas ketekunan murni dan capaian standar kelayakan.
                  </p>
                </div>

                {/* Signatories & QR footer block */}
                <div className="grid grid-cols-3 items-center text-center font-sans text-[10px] pt-4 border-t border-gray-150 relative z-10">
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[9px]">Ustadz Halaqah</span>
                    <span className="font-bold text-gray-800 block mt-4 text-xs font-serif italic">{getSiswaGuruHalaqahNama(syh.siswaId)}</span>
                    <div className="w-24 h-0.5 bg-gray-100 mx-auto my-1" />
                    <span className="text-gray-400 block">Sesuai Aplikasi</span>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="p-1 px-1.5 border border-dashed border-gray-250 bg-white rounded flex flex-col items-center">
                      <QrCode className="h-8 w-8 text-emerald-900 mb-0.5" />
                      <span className="text-[8px] font-mono text-gray-400 uppercase font-bold">Verifikator</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[9px]">{syh.ttdJabatan || 'Pimpinan'}</span>
                    <span className="font-serif font-black text-emerald-950 block mt-4 text-xs italic">{syh.ttdNama || 'Pimpinan Lembaga'}</span>
                    <div className="w-24 h-0.5 bg-gray-100 mx-auto my-1" />
                    <span className="text-gray-400 block">Dekan Pengasuh</span>
                  </div>
                </div>

                {/* Date stamp footer */}
                <div className="text-[10px] text-gray-400 font-sans flex items-center justify-between border-t border-gray-50 pt-2">
                  <span>Sistem Informasi Halaqah Santri Modern</span>
                  <span>Terbit: {syh.tanggalTerbit}</span>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Title Header */}
      <div className="border-b border-gray-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sistem Syahadah &amp; Sertifikasi</h1>
            <p className="text-xs text-gray-500">
              Integrasi peninjauan kelayakan kelulusan, disposisi Guru halaqah, persetujuan Admin, dan pencetakan Syahadah Santri.
            </p>
          </div>
        </div>

        {/* Global search entry tab button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('verifikasi')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition ${
              activeSubTab === 'verifikasi' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-650 hover:bg-slate-50'
            }`}
          >
            <Search className="h-4 w-4" /> Verifikasi No. Seri Sertifikat
          </button>
        </div>
      </div>

      {/* Main Roles routing view renders */}
      {activeSubTab === 'verifikasi' ? (
        renderVerifikatorPanel()
      ) : (
        <>
          {role === UserRole.ADMIN && renderAdminPanel()}
          {role === UserRole.GURU && renderGuruPanel()}
          {role === UserRole.SISWA && renderSiswaPanel()}
        </>
      )}

      {/* RENDER THE FULL-SCREEN VIEWING CERTIFICATE IF ACTIVE */}
      {viewingCertificate && renderPrintCertificatePaper(viewingCertificate)}

      {/* Modal Konfirmasi Hapus Data Syahadah / Ijazah */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base text-center">
              Konfirmasi {confirmDelete.type === 'disposisi' ? 'Batalkan Usulan' : 'Hapus Data Syahadah'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
              Apakah Anda yakin ingin {confirmDelete.type === 'disposisi' ? 'membatalkan dan menarik berkas' : 'menghapus secara permanen'} <strong className="text-slate-800 dark:text-slate-200">"{confirmDelete.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
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
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Memproses...' : confirmDelete.type === 'disposisi' ? 'Ya, Tarik Berkas' : 'Ya, Hapus Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
