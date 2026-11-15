/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  ShieldCheck, 
  BookOpen, 
  Calculator, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  ExternalLink, 
  Layers, 
  Edit3, 
  Save, 
  RotateCcw, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  FilePlus2,
  Globe,
  Tag,
  Search,
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SopStandarPenilaianDoc, SopBabItem, UserRole, TipeModul } from '../types';
import jsPDF from 'jspdf';

interface StandarPenilaianDokumenProps {
  isModal?: boolean;
  onClose?: () => void;
  defaultTab?: 'dokumen' | 'simulasi' | 'ringkasan';
  initialElemenId?: string;
}

const toRoman = (num: number): string => {
  const romanMap: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  let n = num;
  for (const [v, r] of romanMap) {
    while (n >= v) {
      res += r;
      n -= v;
    }
  }
  return res || 'I';
};

export const StandarPenilaianDokumen: React.FC<StandarPenilaianDokumenProps> = ({
  isModal = false,
  onClose,
  defaultTab = 'dokumen',
  initialElemenId
}) => {
  const { 
    currentSession,
    masterPenalties, 
    strukturLembaga,
    sopPenilaianDoc,
    saveSopPenilaianDoc,
    resetSopPenilaianDoc,
    saveSopElemenDoc,
    deleteSopElemenDoc,
    elemenSettings
  } = useApp();

  const isAdmin = currentSession.user?.role === UserRole.ADMIN;

  const [activeTab, setActiveTab] = useState<'dokumen' | 'simulasi' | 'ringkasan'>(defaultTab);

  // Active Element selection: 'global' (Master SOP) or specific elemenId
  const [selectedElemenId, setSelectedElemenId] = useState<string>(() => initialElemenId || 'global');
  const [elemenSearchQuery, setElemenSearchQuery] = useState('');

  // Selected Element Object
  const selectedElemen = useMemo(() => {
    if (selectedElemenId === 'global') return null;
    return elemenSettings?.find(e => e.id === selectedElemenId) || null;
  }, [elemenSettings, selectedElemenId]);

  // Check if active element has custom SOP override
  const isElemenCustom = useMemo(() => {
    if (!selectedElemenId || selectedElemenId === 'global') return false;
    return Boolean(sopPenilaianDoc.elementOverrides?.[selectedElemenId]);
  }, [sopPenilaianDoc.elementOverrides, selectedElemenId]);

  // Active Document to display: custom override if present, else global master doc
  const activeDoc = useMemo<SopStandarPenilaianDoc>(() => {
    if (selectedElemenId === 'global' || !selectedElemenId) {
      return sopPenilaianDoc;
    }
    const custom = sopPenilaianDoc.elementOverrides?.[selectedElemenId];
    if (custom) return custom;
    // Default fallback to master doc with annotation
    return {
      ...sopPenilaianDoc,
      elemenId: selectedElemenId,
      elemenNama: selectedElemen?.nama || selectedElemenId
    };
  }, [sopPenilaianDoc, selectedElemenId, selectedElemen]);

  // Edit Mode State for Admin
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SopStandarPenilaianDoc>(() => activeDoc);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    type: 'bab' | 'reset_sop' | 'delete_elemen_sop';
    id?: string;
    title: string;
    message: string;
  } | null>(null);

  // Keep formData in sync if external context updates and not currently editing
  useEffect(() => {
    if (!isEditing) {
      setFormData(activeDoc);
    }
  }, [activeDoc, isEditing]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Chapter Manipulation Handlers
  const handleAddBab = () => {
    const nextIndex = (formData.daftarBab || []).length + 1;
    const newBab: SopBabItem = {
      id: `bab-${Date.now()}`,
      nomorBab: `BAB ${toRoman(nextIndex)}`,
      judul: 'JUDUL BAB BARU',
      isi: 'Tuliskan naskah pedoman atau ketentuan untuk bab ini...',
      tipeKhusus: 'standar'
    };
    setFormData(prev => ({
      ...prev,
      daftarBab: [...(prev.daftarBab || []), newBab]
    }));
  };

  const handleDeleteBab = (id: string, judul: string) => {
    setConfirmDeleteModal({
      type: 'bab',
      id,
      title: judul || 'Bab Ini',
      message: 'Apakah Anda yakin ingin menghapus bab ini dari naskah SOP? Bab dan seluruh teks uraian di dalamnya akan dihapus.'
    });
  };

  const handleConfirmDeleteAction = async () => {
    if (!confirmDeleteModal) return;
    if (confirmDeleteModal.type === 'bab' && confirmDeleteModal.id) {
      setFormData(prev => ({
        ...prev,
        daftarBab: (prev.daftarBab || []).filter(b => b.id !== confirmDeleteModal.id)
      }));
      showFeedback('Bab berhasil dihapus dari draf naskah SOP.');
      setConfirmDeleteModal(null);
    } else if (confirmDeleteModal.type === 'reset_sop') {
      setConfirmDeleteModal(null);
      setIsSaving(true);
      try {
        await resetSopPenilaianDoc();
        setIsEditing(false);
        showFeedback('Naskah SOP Master berhasil dikembalikan ke standar awal bawaan!');
      } catch (err) {
        console.error(err);
        showFeedback('Gagal mereset naskah SOP Master.', 'error');
      } finally {
        setIsSaving(false);
      }
    } else if (confirmDeleteModal.type === 'delete_elemen_sop' && confirmDeleteModal.id) {
      const eId = confirmDeleteModal.id;
      const elemName = selectedElemen?.nama || eId;
      setConfirmDeleteModal(null);
      setIsSaving(true);
      try {
        await deleteSopElemenDoc(eId);
        setIsEditing(false);
        showFeedback(`SOP Khusus untuk elemen "${elemName}" berhasil dihapus. Elemen kini kembali mengikuti SOP Master Global.`);
      } catch (err) {
        console.error(err);
        showFeedback('Gagal menghapus SOP Khusus elemen.', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleMoveBab = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const list = [...(prev.daftarBab || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      
      return {
        ...prev,
        daftarBab: list
      };
    });
  };

  const handleUpdateBabField = (id: string, field: keyof SopBabItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      daftarBab: (prev.daftarBab || []).map(b => {
        if (b.id === id) {
          return { ...b, [field]: value };
        }
        return b;
      })
    }));
  };

  // Start Creating a Custom SOP for Selected Element
  const handleStartCreateCustomSop = () => {
    if (selectedElemenId === 'global') return;
    const elemName = selectedElemen?.nama || selectedElemenId;
    const base = sopPenilaianDoc;
    const newDoc: SopStandarPenilaianDoc = {
      ...base,
      id: `sop_elemen_${selectedElemenId}`,
      elemenId: selectedElemenId,
      elemenNama: elemName,
      nomorSK: `${base.nomorSK || '04/SK-KUR/2026'}/${elemName.toUpperCase().replace(/\s+/g, '-')}`,
      judulUtama: `STANDAR OPERASIONAL PROSEDUR (SOP) PENILAIAN ELEMEN ${elemName.toUpperCase()}`,
      subjudul: `SISTEM PEMBOBOTAN & PEDOMAN EVALUASI ASESMEN ELEMEN ${elemName.toUpperCase()}`,
      pengantar: `Dokumen ini merupakan petunjuk operasional dan standar penilaian khusus yang mengikat untuk Elemen Pembelajaran "${elemName}". Menjadi acuan resmi bagi Asatidz pengampu dalam mengevaluasi hafalan, tilawah, dan capaian santri sesuai kompetensi khas elemen ini.`,
      daftarBab: (base.daftarBab || []).map((b, idx) => ({
        ...b,
        id: `bab-elem-${Date.now()}-${idx}`
      })),
      updatedAt: new Date().toISOString()
    };
    setFormData(newDoc);
    setIsEditing(true);
  };

  // Trigger Delete Custom SOP for Current Element
  const handleDeleteCustomSop = () => {
    if (selectedElemenId === 'global') return;
    const elemName = selectedElemen?.nama || selectedElemenId;
    setConfirmDeleteModal({
      type: 'delete_elemen_sop',
      id: selectedElemenId,
      title: `SOP Khusus ${elemName}`,
      message: `Apakah Anda yakin ingin menghapus SOP Khusus untuk elemen "${elemName}"? Elemen ini akan otomatis kembali menggunakan ketentuan Standar Penilaian Resmi (SOP Master Global).`
    });
  };

  // Handle Save Edited SOP (either Global or Element-specific)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (selectedElemenId === 'global') {
        await saveSopPenilaianDoc(formData);
        setIsEditing(false);
        showFeedback('Naskah Standar Penilaian Resmi (SOP Master Global) berhasil disimpan dan disahkan!');
      } else {
        const elemName = selectedElemen?.nama || selectedElemenId;
        await saveSopElemenDoc(selectedElemenId, {
          ...formData,
          elemenId: selectedElemenId,
          elemenNama: elemName
        });
        setIsEditing(false);
        showFeedback(`Naskah SOP Khusus Elemen "${elemName}" berhasil disimpan dan disahkan!`);
      }
    } catch (err) {
      console.error(err);
      showFeedback('Gagal menyimpan naskah SOP. Silakan coba lagi.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Reset to Defaults (Master SOP)
  const handleResetToDefault = () => {
    setConfirmDeleteModal({
      type: 'reset_sop',
      title: 'Kembalikan SOP Master ke Template Baku Resmi (Bab I - VI)',
      message: 'Apakah Anda yakin ingin mengembalikan seluruh naskah SOP Master Standar Penilaian ke template baku resmi bawaan sistem? Kustomisasi judul bab dan bab tambahan pada SOP Master akan diganti kembali.'
    });
  };

  // Lembaga Info
  const namaLembaga = strukturLembaga?.yayasan?.nama || 'Majelis & Lembaga Tahfidz Al-Qur\'an';
  const alamatLembaga = strukturLembaga?.yayasan?.alamat || 'Pusat Pembinaan & Mutabaah Al-Qur\'an';

  // Config parameters for simulation: adapt to selected element if it has custom settings
  const elemCustomBobot = selectedElemen?.useMasterPenalties === false;
  const stdBarisQuran = (elemCustomBobot && selectedElemen?.standarBarisQuran !== undefined)
    ? selectedElemen.standarBarisQuran
    : (masterPenalties?.standarBarisQuran ?? 15);
  const minBarisQuran = (elemCustomBobot && selectedElemen?.minBarisQuran !== undefined)
    ? selectedElemen.minBarisQuran
    : (masterPenalties?.minBarisQuran ?? 5);
  const maxBarisQuran = (elemCustomBobot && selectedElemen?.maxBarisQuran !== undefined)
    ? selectedElemen.maxBarisQuran
    : (masterPenalties?.maxBarisQuran ?? 15);
  const bobotJaliy = (elemCustomBobot && selectedElemen?.bobotLahnJaliy !== undefined)
    ? selectedElemen.bobotLahnJaliy
    : (masterPenalties?.bobotLahnJaliy ?? 4);
  const bobotKhafiy = (elemCustomBobot && selectedElemen?.bobotLahnKhafiy !== undefined)
    ? selectedElemen.bobotLahnKhafiy
    : (masterPenalties?.bobotLahnKhafiy ?? 2);
  const stdBarisNonQuran = (elemCustomBobot && selectedElemen?.defaultLinesPerPage !== undefined)
    ? selectedElemen.defaultLinesPerPage
    : (masterPenalties?.defaultBarisNonQuran ?? 6);

  // Interactive Simulator State
  const [simJenisModul, setSimJenisModul] = useState<'quran' | 'non_quran'>(() => {
    if (selectedElemen?.tipeModul === TipeModul.NON_AL_QURAN) return 'non_quran';
    return 'quran';
  });
  const [simBaris, setSimBaris] = useState<number | ''>(10);
  const [simJaliyCount, setSimJaliyCount] = useState<number | ''>(1);
  const [simKhafiyCount, setSimKhafiyCount] = useState<number | ''>(2);

  // Simulator Calculations
  const simResult = useMemo(() => {
    const isQuran = simJenisModul === 'quran';
    const stdLines = isQuran ? stdBarisQuran : stdBarisNonQuran;
    const minL = isQuran ? minBarisQuran : Math.max(1, Math.round(stdLines * 0.5));
    const maxL = isQuran ? maxBarisQuran : stdLines;

    const actualLines = (simBaris !== '' && Number(simBaris) > 0) ? Number(simBaris) : stdLines;
    const clampedLines = Math.min(maxL, Math.max(minL, actualLines));
    const isFloorTriggered = actualLines < minL;
    const isCeilTriggered = actualLines > maxL;

    const potongPerJaliy = Number(((stdLines * bobotJaliy) / clampedLines).toFixed(2));
    const potongPerKhafiy = Number(((stdLines * bobotKhafiy) / clampedLines).toFixed(2));

    const jCount = simJaliyCount === '' ? 0 : Number(simJaliyCount);
    const kCount = simKhafiyCount === '' ? 0 : Number(simKhafiyCount);

    const totalJaliyDeduction = Number((jCount * potongPerJaliy).toFixed(2));
    const totalKhafiyDeduction = Number((kCount * potongPerKhafiy).toFixed(2));
    const totalDeduction = Number((totalJaliyDeduction + totalKhafiyDeduction).toFixed(2));

    const finalScore = Math.max(0, Math.round(100 - totalDeduction));

    let predikat = 'Mumtaz';
    let lulus = true;
    if (finalScore >= 95) {
      predikat = 'Mumtaz';
    } else if (finalScore >= 85) {
      predikat = 'Jayyid Jiddan';
    } else if (finalScore >= 75) {
      predikat = 'Jayyid';
    } else if (finalScore >= 60) {
      predikat = 'Maqbul';
    } else {
      predikat = 'Murojaah / Rasib';
      lulus = false;
    }

    return {
      stdLines,
      minL,
      maxL,
      actualLines,
      clampedLines,
      isFloorTriggered,
      isCeilTriggered,
      potongPerJaliy,
      potongPerKhafiy,
      jCount,
      kCount,
      totalJaliyDeduction,
      totalKhafiyDeduction,
      totalDeduction,
      finalScore,
      predikat,
      lulus
    };
  }, [simJenisModul, simBaris, simJaliyCount, simKhafiyCount, stdBarisQuran, minBarisQuran, maxBarisQuran, bobotJaliy, bobotKhafiy, stdBarisNonQuran]);

  // Handle Export / Download PDF (Dynamic loop across activeDoc)
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 18;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          y = 18;
          return true;
        }
        return false;
      };

      // Header Lembaga
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(namaLembaga.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(alamatLembaga, pageWidth / 2, y, { align: 'center' });
      y += 5;
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.6);
      doc.line(14, y, pageWidth - 14, y);
      y += 1.2;
      doc.setLineWidth(0.2);
      doc.line(14, y, pageWidth - 14, y);
      y += 8;

      // Document Title from activeDoc
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text((activeDoc.judulUtama || 'STANDAR OPERASIONAL PROSEDUR (SOP) & PEDOMAN PENILAIAN').toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 5;
      doc.setFontSize(9.5);
      doc.setTextColor(5, 150, 105);
      doc.text((activeDoc.subjudul || 'SISTEM PEMBOBOTAN NILAI PROPORSIONAL (ERROR DENSITY)').toUpperCase(), pageWidth / 2, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y += 8;

      // Metadata info box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 16, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, pageWidth - 28, 16, 'D');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Nomor SK       : ${activeDoc.nomorSK || '04/SK-KUR/2026'}`, 18, y + 5.5);
      const scopeLabel = selectedElemenId === 'global'
        ? 'Seluruh Elemen Halaqah (Master SOP Global)'
        : `Elemen Pembelajaran: ${selectedElemen?.nama || selectedElemenId} (${isElemenCustom ? 'SOP Khusus' : 'SOP Master'})`;
      doc.text(`Berlaku Untuk  : ${scopeLabel}`, 18, y + 11.5);

      doc.text(`Standar Acuan  : ${stdBarisQuran} Baris`, pageWidth / 2 + 10, y + 5.5);
      doc.text(`Rasio Kesalahan: Lahn Jaliy ${bobotJaliy} pt, Khafiy ${bobotKhafiy} pt`, pageWidth / 2 + 10, y + 11.5);
      y += 22;

      // Pengantar
      if (activeDoc.pengantar) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        const pIntro = doc.splitTextToSize(`" ${activeDoc.pengantar} "`, pageWidth - 28);
        checkPageBreak(pIntro.length * 4.2 + 5);
        doc.text(pIntro, 14, y);
        y += pIntro.length * 4.2 + 6;
      }

      // Dynamic Render of Every Chapter in daftarBab
      const chapters = activeDoc.daftarBab || [];
      chapters.forEach((bab, idx) => {
        const titleText = `${bab.nomorBab || `BAB ${toRoman(idx + 1)}`}. ${bab.judul || ''}`.toUpperCase();
        
        checkPageBreak(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(titleText, 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const pLines = doc.splitTextToSize(bab.isi || '', pageWidth - 28);
        checkPageBreak(pLines.length * 4.2 + 4);
        doc.text(pLines, 14, y);
        y += pLines.length * 4.2 + 5;

        // If chapter is simulation table
        if (bab.tipeKhusus === 'tabel_simulasi') {
          checkPageBreak(45);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text('TABEL SIMULASI PEMBOBOTAN ACUAN:', 14, y);
          y += 3.5;

          // Table Header
          doc.setFillColor(15, 23, 42);
          doc.rect(14, y, pageWidth - 28, 6, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7.5);
          doc.text('Jumlah Baris Setoran', 18, y + 4.2);
          doc.text('Lahn Jaliy (Poin/Salah)', 75, y + 4.2);
          doc.text('Lahn Khafiy (Poin/Salah)', 125, y + 4.2);
          doc.text('Status Guardrail', 170, y + 4.2);
          doc.setTextColor(0, 0, 0);
          y += 6;

          const rows = [
            [`${stdBarisQuran} Baris (Standar Penuh)`, `${bobotJaliy}.00 pt`, `${bobotKhafiy}.00 pt`, 'Standar Acuan'],
            ['12 Baris Setoran', `${((stdBarisQuran * bobotJaliy) / 12).toFixed(2)} pt`, `${((stdBarisQuran * bobotKhafiy) / 12).toFixed(2)} pt`, 'Proporsional'],
            ['10 Baris Setoran', `${((stdBarisQuran * bobotJaliy) / 10).toFixed(2)} pt`, `${((stdBarisQuran * bobotKhafiy) / 10).toFixed(2)} pt`, 'Proporsional'],
            [`${minBarisQuran} Baris Setoran`, `${((stdBarisQuran * bobotJaliy) / minBarisQuran).toFixed(2)} pt`, `${((stdBarisQuran * bobotKhafiy) / minBarisQuran).toFixed(2)} pt`, 'Batas Bawah Acuan (Floor)'],
            ['2 Baris Setoran', `${((stdBarisQuran * bobotJaliy) / minBarisQuran).toFixed(2)} pt`, `${((stdBarisQuran * bobotKhafiy) / minBarisQuran).toFixed(2)} pt`, `Terkunci Min (${minBarisQuran} Baris)`],
            [`${maxBarisQuran * 2} Baris Setoran`, `${((stdBarisQuran * bobotJaliy) / maxBarisQuran).toFixed(2)} pt`, `${((stdBarisQuran * bobotKhafiy) / maxBarisQuran).toFixed(2)} pt`, `Terkunci Maks (${maxBarisQuran} Baris)`]
          ];

          rows.forEach((r, rIdx) => {
            if (rIdx % 2 === 1) {
              doc.setFillColor(241, 245, 249);
              doc.rect(14, y, pageWidth - 28, 5, 'F');
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(r[0], 18, y + 3.5);
            doc.text(r[1], 75, y + 3.5);
            doc.text(r[2], 125, y + 3.5);
            doc.text(r[3], 170, y + 3.5);
            y += 5;
          });
          y += 5;
        }
      });

      // Signature Block from activeDoc
      checkPageBreak(38);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`${activeDoc.titiMangsaTempat || 'Ditetapkan secara resmi'}, ${tgl}`, pageWidth - 14, y, { align: 'right' });
      y += 8;

      doc.text(activeDoc.penandatangan1Jabatan || 'Koordinator Tahsin & Mutabaah', 20, y);
      doc.text(activeDoc.penandatangan2Jabatan || 'Mudir / Pimpinan Lembaga', pageWidth - 65, y);
      y += 17;
      doc.setFont('helvetica', 'bold');
      doc.text(`( ${activeDoc.penandatangan1Nama || '................................'} )`, 20, y);
      doc.text(`( ${activeDoc.penandatangan2Nama || '................................'} )`, pageWidth - 65, y);

      // Save PDF with meaningful filename
      const fileSlug = selectedElemenId === 'global' ? 'Master-Global' : (selectedElemen?.nama || selectedElemenId).replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`SOP-Penilaian-${fileSlug}-${namaLembaga.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      window.print();
    }
  };

  // Filtered elements list for quick search
  const filteredElemenList = useMemo(() => {
    if (!elemenSettings) return [];
    if (!elemenSearchQuery.trim()) return elemenSettings;
    const q = elemenSearchQuery.toLowerCase();
    return elemenSettings.filter(e => 
      e.nama.toLowerCase().includes(q) || 
      (e.kompetensi && e.kompetensi.toLowerCase().includes(q))
    );
  }, [elemenSettings, elemenSearchQuery]);

  // Statistics
  const customSopCount = useMemo(() => {
    const overrides = sopPenilaianDoc.elementOverrides || {};
    return Object.keys(overrides).length;
  }, [sopPenilaianDoc.elementOverrides]);

  return (
    <div className={`space-y-6 ${isModal ? 'p-1' : ''}`}>
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg text-xs font-bold transition animate-fade-in ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-600 text-white shadow-emerald-950/20'
            : 'bg-rose-600 text-white shadow-rose-950/20'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner / Document Title Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <Scale className="w-64 h-64 text-emerald-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DOKUMEN STANDAR RESMI AKADEMIK &amp; KURIKULUM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activeDoc.judulUtama || 'Pedoman Pembobotan Nilai Proporsional Mutabaah'}
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              {activeDoc.subjudul || 'Standar Operasional Prosedur (SOP) asesmen hafalan & tilawah berbasis Kerapatan Kesalahan (Error Density).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Admin Edit Toggle Button for Current Active Doc */}
            {isAdmin && !isModal && (
              <button
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                  } else {
                    if (selectedElemenId !== 'global' && !isElemenCustom) {
                      handleStartCreateCustomSop();
                    } else {
                      setFormData(activeDoc);
                      setIsEditing(true);
                    }
                  }
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md ${
                  isEditing
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 border border-emerald-400/40'
                }`}
                title={isEditing ? 'Tutup form pengeditan' : 'Buka form edit untuk mengubah naskah SOP aktif'}
              >
                <Edit3 className="w-4 h-4" />
                <span>
                  {isEditing 
                    ? 'Tutup Mode Edit' 
                    : (selectedElemenId === 'global' ? 'Edit SOP Master Global' : (isElemenCustom ? 'Edit SOP Khusus Elemen' : 'Buat SOP Khusus Elemen'))
                  }
                </span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              title="Unduh dokumen resmi yang sedang aktif dalam format PDF ber-kop surat"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF Resmi</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition cursor-pointer"
              title="Cetak langsung menggunakan printer atau browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-emerald-800/60 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('dokumen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'dokumen'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/5 text-emerald-200 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Naskah Dokumen Resmi (SOP)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('simulasi');
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'simulasi'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/5 text-emerald-200 hover:bg-white/10'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Kalkulator &amp; Simulasi Interaktif</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ringkasan');
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'ringkasan'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/5 text-emerald-200 hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Lembar Ringkasan Cepat (Cheat Sheet)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELECTOR RUJUKAN SOP: MASTER GLOBAL vs ELEMEN PEMBELAJARAN */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Pilih Dokumen SOP Penilaian: Master Global vs Khusus Elemen
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Setiap elemen dapat memiliki naskah SOP khusus sendiri jika terdapat perbedaan standar, atau otomatis mengikuti SOP Master Global jika standar penilaiannya sama.
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px]">
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
              1 Master Global
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {customSopCount} SOP Khusus Aktif
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800">
              {(elemenSettings?.length || 0) - customSopCount} Mengikuti Master
            </span>
          </div>
        </div>

        {/* Quick Search if more than 4 elements */}
        {(elemenSettings?.length || 0) > 4 && (
          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={elemenSearchQuery}
              onChange={(e) => setElemenSearchQuery(e.target.value)}
              placeholder="Cari elemen pembelajaran..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>
        )}

        {/* Element Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {/* Master Global Tab */}
          <button
            type="button"
            onClick={() => {
              if (selectedElemenId !== 'global') {
                setSelectedElemenId('global');
                setIsEditing(false);
              }
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition shrink-0 cursor-pointer border ${
              selectedElemenId === 'global'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md dark:bg-white dark:text-slate-950 dark:border-white'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>SOP Master Global</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              selectedElemenId === 'global'
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
            }`}>
              Default Induk
            </span>
          </button>

          {/* List of Elements */}
          {filteredElemenList.map((elem) => {
            const hasCustom = Boolean(sopPenilaianDoc.elementOverrides?.[elem.id]);
            const isSelected = selectedElemenId === elem.id;

            return (
              <button
                key={elem.id}
                type="button"
                onClick={() => {
                  if (selectedElemenId !== elem.id) {
                    setSelectedElemenId(elem.id);
                    setIsEditing(false);
                  }
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-md dark:bg-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : hasCustom ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{elem.nama}</span>
                {hasCustom ? (
                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold flex items-center gap-1 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}>
                    ✓ Khusus
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-medium ${
                    isSelected
                      ? 'bg-white/10 text-white/90'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    Ikut Master
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current Active Element Context Bar */}
        <div className="pt-2">
          {selectedElemenId === 'global' ? (
            <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Naskah SOP Master (Umum / Global):</strong> Menjadi standar dasar penilaian resmi bagi seluruh elemen halaqah yang belum memiliki SOP khusus.
                </span>
              </div>
              {isAdmin && !isModal && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(sopPenilaianDoc);
                    setIsEditing(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition self-start sm:self-auto shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Edit Naskah Master</span>
                </button>
              )}
            </div>
          ) : isElemenCustom ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>SOP Khusus Aktif untuk "{selectedElemen?.nama}":</strong> Elemen ini memiliki dokumen pedoman penilaian tersendiri (meng-override ketentuan umum Master).
                </span>
              </div>
              {isAdmin && !isModal && !isEditing && (
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(activeDoc);
                      setIsEditing(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit SOP Khusus</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCustomSop}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                    title="Hapus naskah khusus ini agar elemen kembali menggunakan SOP Master Global"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kembali ke Master</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Elemen "{selectedElemen?.nama}" Mengikuti SOP Master Global:</strong> Belum dibuatkan dokumen SOP tersendiri. Ketentuan dan bobot penilaian menggunakan dokumen Master di bawah.
                </span>
              </div>
              {isAdmin && !isModal && !isEditing && (
                <button
                  type="button"
                  onClick={handleStartCreateCustomSop}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm cursor-pointer"
                  title="Salin isi SOP Master untuk membuat dokumen SOP khusus bagi elemen ini"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat SOP Khusus untuk Elemen Ini</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORM PENGEDITAN NASKAH & DAFTAR BAB (KHUSUS ADMIN) */}
      {/* ========================================================================= */}
      {isAdmin && isEditing && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-400/50 dark:border-amber-600/40 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Edit3 className="w-4 h-4" />
                <span>
                  {selectedElemenId === 'global' 
                    ? 'PENGATURAN NASKAH SOP MASTER GLOBAL' 
                    : `PENGATURAN SOP KHUSUS: ELEMEN "${(selectedElemen?.nama || selectedElemenId).toUpperCase()}"`
                  }
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedElemenId === 'global'
                  ? 'Perubahan naskah ini akan berlaku sebagai standar acuan default bagi seluruh elemen pembelajaran.'
                  : `Dokumen ini khusus mengatur standar penilaian untuk elemen "${selectedElemen?.nama}". Anda dapat menyesuaikan pasal, bab, nomor SK, dan rumus.`
                }
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedElemenId === 'global' && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Kembalikan semua naskah dan bab ke template bawaan awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Standar Awal</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setFormData(activeDoc);
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : (selectedElemenId === 'global' ? 'Simpan SOP Master' : 'Simpan SOP Khusus Elemen')}</span>
              </button>
            </div>
          </div>

          {/* Section 1: Identitas & SK */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>📌</span>
              <span>1. Identitas Dokumen &amp; Surat Keputusan (SK)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nomor SK / Ketetapan Resmi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomorSK}
                  onChange={(e) => setFormData({ ...formData, nomorSK: e.target.value })}
                  placeholder="Contoh: 04/SK-KUR/2026"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tempat Pengesahan (Titi Mangsa) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titiMangsaTempat || ''}
                  onChange={(e) => setFormData({ ...formData, titiMangsaTempat: e.target.value })}
                  placeholder="Contoh: Jakarta / Pesantren Pusat"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Judul Dokumen Utama *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judulUtama}
                  onChange={(e) => setFormData({ ...formData, judulUtama: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Subjudul Dokumen *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subjudul}
                  onChange={(e) => setFormData({ ...formData, subjudul: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Narasi Pengantar / Mukaddimah Pengesahan *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.pengantar}
                  onChange={(e) => setFormData({ ...formData, pengantar: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Chapter Management (Daftar Bab) */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>📖</span>
                <span>2. Daftar Bab Dokumen SOP (Total: {formData.daftarBab?.length || 0} Bab)</span>
              </h4>

              <button
                type="button"
                onClick={handleAddBab}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Bab Baru</span>
              </button>
            </div>

            {/* List of Chapters */}
            <div className="space-y-4">
              {(formData.daftarBab || []).map((bab, index) => (
                <div 
                  key={bab.id} 
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 relative group transition hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 flex-1">
                      {/* Nomor Bab Editable */}
                      <input
                        type="text"
                        value={bab.nomorBab}
                        onChange={(e) => handleUpdateBabField(bab.id, 'nomorBab', e.target.value)}
                        placeholder="BAB I"
                        className="w-24 p-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 text-center"
                        title="Nomor urut bab (misal: BAB I, BAB II, dsb.)"
                      />

                      {/* Judul Bab Editable */}
                      <input
                        type="text"
                        required
                        value={bab.judul}
                        onChange={(e) => handleUpdateBabField(bab.id, 'judul', e.target.value)}
                        placeholder="Tuliskan judul bab..."
                        className="flex-1 p-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase"
                        title="Judul Bab yang akan dicetak pada dokumen resmi"
                      />
                    </div>

                    {/* Action buttons: Move Up, Move Down, Delete */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleMoveBab(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Pindah ke atas"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBab(index, 'down')}
                        disabled={index === (formData.daftarBab || []).length - 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Pindah ke bawah"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBab(bab.id, `${bab.nomorBab}: ${bab.judul}`)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Hapus bab ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Isi Teks Bab */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Naskah &amp; Penjelasan Isi Bab
                    </label>
                    <textarea
                      rows={4}
                      value={bab.isi}
                      onChange={(e) => handleUpdateBabField(bab.id, 'isi', e.target.value)}
                      placeholder="Tuliskan naskah pedoman, ketentuan, atau pasal-pasal..."
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Tipe Khusus Penilaian (Opsional) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span className="font-semibold">Format Komponen Visual Tambahan:</span>
                    <select
                      value={bab.tipeKhusus || 'standar'}
                      onChange={(e) => handleUpdateBabField(bab.id, 'tipeKhusus', e.target.value)}
                      className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    >
                      <option value="standar">Hanya Teks Narasi / Pasal Baku</option>
                      <option value="rasio_penalti">Sertakan Kartu Klasifikasi Jaliy vs Khafiy (Rasio 2:1)</option>
                      <option value="formula_guardrail">Sertakan Rumus Matematis &amp; Kartu Guardrail</option>
                      <option value="tabel_simulasi">Sertakan Tabel Matriks Simulasi &amp; Predikat Kelulusan</option>
                    </select>
                  </div>
                </div>
              ))}

              {/* Bottom Add Bab button */}
              <button
                type="button"
                onClick={handleAddBab}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Bab Baru</span>
              </button>
            </div>
          </div>

          {/* Section 3: Pejabat Penandatangan */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>✍️</span>
              <span>3. Pejabat Pengesah &amp; Penandatangan Dokumen</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Pihak 1 (Kiri)</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Jabatan Pihak 1</label>
                  <input
                    type="text"
                    value={formData.penandatangan1Jabatan}
                    onChange={(e) => setFormData({ ...formData, penandatangan1Jabatan: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Lengkap &amp; Gelar Pihak 1</label>
                  <input
                    type="text"
                    value={formData.penandatangan1Nama}
                    onChange={(e) => setFormData({ ...formData, penandatangan1Nama: e.target.value })}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Pihak 2 (Kanan)</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Jabatan Pihak 2</label>
                  <input
                    type="text"
                    value={formData.penandatangan2Jabatan}
                    onChange={(e) => setFormData({ ...formData, penandatangan2Jabatan: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Lengkap &amp; Gelar Pihak 2</label>
                  <input
                    type="text"
                    value={formData.penandatangan2Nama}
                    onChange={(e) => setFormData({ ...formData, penandatangan2Nama: e.target.value })}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setFormData(activeDoc);
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : (selectedElemenId === 'global' ? 'Simpan Naskah SOP Master' : `Simpan SOP Khusus Elemen ${selectedElemen?.nama || selectedElemenId}`)}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DOKUMEN NASKAH RESMI (READ VIEW DARI activeDoc) */}
      {/* ========================================================================= */}
      {activeTab === 'dokumen' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 space-y-8 text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
          {/* Official Letterhead Representation */}
          <div className="border-b-2 border-slate-900 dark:border-slate-600 pb-5 text-center space-y-1">
            <h3 className="font-serif text-lg sm:text-xl font-bold tracking-wide uppercase text-slate-900 dark:text-white">
              {namaLembaga}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              {alamatLembaga}
            </p>
            <div className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 pt-1">
              SURAT KEPUTUSAN KURIKULUM &amp; KETETAPAN ASESMEN: {activeDoc.nomorSK || '04/SK-KUR/2026'}
            </div>
            {selectedElemenId !== 'global' && (
              <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10.5px]">
                ELEMEN PEMBELAJARAN: {(selectedElemen?.nama || selectedElemenId).toUpperCase()} {isElemenCustom ? '(SOP KHUSUS)' : '(MENGIKUTI SOP MASTER)'}
              </div>
            )}
          </div>

          {/* Dokumen Intro */}
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-emerald-600 rounded-r-2xl space-y-2">
              <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-300">
                PENGESAHAN STANDAR PENILAIAN LEMBAGA
              </h4>
              <p className="text-xs text-emerald-900/90 dark:text-emerald-200 leading-relaxed whitespace-pre-line">
                {activeDoc.pengantar}
              </p>
            </div>
          </div>

          {/* Dynamic Chapters Rendering from activeDoc.daftarBab */}
          {(activeDoc.daftarBab || []).map((bab, idx) => (
            <div key={bab.id || idx} className="space-y-3 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono font-bold text-xs shrink-0">
                  {bab.nomorBab || `BAB ${toRoman(idx + 1)}`}
                </span>
                <h4 className="font-bold text-base text-slate-900 dark:text-white uppercase">
                  {bab.judul}
                </h4>
              </div>

              <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {bab.isi}
              </p>

              {/* Tipe Khusus: Rasio Penalti (Lahn Jaliy vs Khafiy Cards) */}
              {bab.tipeKhusus === 'rasio_penalti' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-rose-900 dark:text-rose-200">1. Lahn Jaliy (Fatal / Jelas)</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 rounded-full">Bobot Acuan: {bobotJaliy} pt</span>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                      Kesalahan yang berpotensi merubah makna, merubah struktur kata, tertukar huruf hijaiyah, salah bunyi vokal/harakat, mad asli yang hilang/berlebih, atau tasydid yang gugur.
                    </p>
                    <div className="text-[11px] font-medium text-rose-950 dark:text-rose-200 bg-white/70 dark:bg-rose-950/50 p-2 rounded-xl">
                      <strong>Total Denda Acuan ({stdBarisQuran} Baris):</strong> {stdBarisQuran} × {bobotJaliy} = <strong>{stdBarisQuran * bobotJaliy} Poin</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-amber-900 dark:text-amber-200">2. Lahn Khafiy (Ringan / Tajwid)</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-full">Bobot Acuan: {bobotKhafiy} pt</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Kesalahan yang mengurangi kesempurnaan dan keindahan bacaan sesuai kaidah tajwid, seperti kadar ghunnah/dengung, tebal-tipis huruf (tafkhim/tarqiq), kesempurnaan sifat huruf, qalqalah, dan waqaf/ibtida'.
                    </p>
                    <div className="text-[11px] font-medium text-amber-950 dark:text-amber-200 bg-white/70 dark:bg-amber-950/50 p-2 rounded-xl">
                      <strong>Total Denda Acuan ({stdBarisQuran} Baris):</strong> {stdBarisQuran} × {bobotKhafiy} = <strong>{stdBarisQuran * bobotKhafiy} Poin</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Tipe Khusus: Formula Guardrail Cards */}
              {bab.tipeKhusus === 'formula_guardrail' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 pt-2">
                  <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-emerald-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    Poin Pengurangan per Kesalahan = (Standar Baris Acuan × Bobot Lahn) / Baris Setoran Efektif
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-750">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Batas Bawah (Floor = {minBarisQuran} Baris)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Jika santri menyetor setoran pendek (1 s.d. {minBarisQuran - 1} baris), pembagi baris dikunci minimal <strong>{minBarisQuran} baris</strong>. Sanksi Lahn Jaliy terkunci maksimal <strong>{((stdBarisQuran * bobotJaliy) / minBarisQuran).toFixed(0)} poin</strong> dan Khafiy maksimal <strong>{((stdBarisQuran * bobotKhafiy) / minBarisQuran).toFixed(0)} poin</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-750">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Batas Atas (Ceiling = {maxBarisQuran} Baris)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Jika santri menyetor lebih dari {maxBarisQuran} baris (misal 2 s.d. 5 halaman), pembagi baris dikunci di <strong>{maxBarisQuran} baris</strong> agar setiap Lahn Jaliy tetap terpotong minimal <strong>{bobotJaliy} poin</strong> dan Khafiy minimal <strong>{bobotKhafiy} poin</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tipe Khusus: Tabel Simulasi & Predikat */}
              {bab.tipeKhusus === 'tabel_simulasi' && (
                <div className="space-y-4 pt-2">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-3">Kondisi Setoran</th>
                          <th className="p-3">Baris Efektif</th>
                          <th className="p-3">Lahn Jaliy (Poin/Salah)</th>
                          <th className="p-3">Lahn Khafiy (Poin/Salah)</th>
                          <th className="p-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-3 font-semibold">{stdBarisQuran} Baris (1 Halaman Penuh)</td>
                          <td className="p-3 font-mono">{stdBarisQuran} baris</td>
                          <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{bobotJaliy.toFixed(2)} pt</td>
                          <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{bobotKhafiy.toFixed(2)} pt</td>
                          <td className="p-3 text-slate-500">Standar Acuan Utama</td>
                        </tr>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-3 font-semibold">10 Baris</td>
                          <td className="p-3 font-mono">10 baris</td>
                          <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{((stdBarisQuran * bobotJaliy) / 10).toFixed(2)} pt</td>
                          <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{((stdBarisQuran * bobotKhafiy) / 10).toFixed(2)} pt</td>
                          <td className="p-3 text-slate-500">Proporsional Terbalik</td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-3 font-semibold">{minBarisQuran} Baris</td>
                          <td className="p-3 font-mono">{minBarisQuran} baris</td>
                          <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{((stdBarisQuran * bobotJaliy) / minBarisQuran).toFixed(2)} pt</td>
                          <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{((stdBarisQuran * bobotKhafiy) / minBarisQuran).toFixed(2)} pt</td>
                          <td className="p-3 text-slate-500">Batas Bawah Acuan (Floor)</td>
                        </tr>
                        <tr className="bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                          <td className="p-3 font-semibold text-amber-900 dark:text-amber-300">2 Baris (Setoran Pendek)</td>
                          <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">{minBarisQuran} baris (Terkunci)</td>
                          <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{((stdBarisQuran * bobotJaliy) / minBarisQuran).toFixed(2)} pt</td>
                          <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{((stdBarisQuran * bobotKhafiy) / minBarisQuran).toFixed(2)} pt</td>
                          <td className="p-3 text-amber-800 dark:text-amber-300">Guardrail Floor Aktif (Maks {((stdBarisQuran * bobotJaliy) / minBarisQuran).toFixed(0)} pt)</td>
                        </tr>
                        <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                          <td className="p-3 font-semibold text-indigo-900 dark:text-indigo-300">30 Baris (2 Halaman)</td>
                          <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">{maxBarisQuran} baris (Terkunci)</td>
                          <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{bobotJaliy.toFixed(2)} pt</td>
                          <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{bobotKhafiy.toFixed(2)} pt</td>
                          <td className="p-3 text-indigo-800 dark:text-indigo-300">Guardrail Ceiling Aktif (Min {bobotJaliy} pt)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Predikat Range */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">95 - 100</div>
                      <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">Mumtaz</div>
                      <span className="text-[9px] text-emerald-600 font-semibold">Lulus Istimewa</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                      <div className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase">85 - 94</div>
                      <div className="text-sm font-bold text-teal-900 dark:text-teal-200 mt-0.5">Jayyid Jiddan</div>
                      <span className="text-[9px] text-teal-600 font-semibold">Lulus Sangat Baik</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase">75 - 84</div>
                      <div className="text-sm font-bold text-blue-900 dark:text-blue-200 mt-0.5">Jayyid</div>
                      <span className="text-[9px] text-blue-600 font-semibold">Lulus Baik</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">60 - 74</div>
                      <div className="text-sm font-bold text-amber-900 dark:text-amber-200 mt-0.5">Maqbul</div>
                      <span className="text-[9px] text-amber-600 font-semibold">Lulus Cukup</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase">&lt; 60</div>
                      <div className="text-sm font-bold text-rose-900 dark:text-rose-200 mt-0.5">Murojaah / Rasib</div>
                      <span className="text-[9px] text-rose-600 font-semibold">Belum Lulus (Ulang)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pengesahan Footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-12">
                <p className="text-slate-500">Mengetahui &amp; Mengesahkan,</p>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                    {activeDoc.penandatangan1Jabatan || 'Koordinator Tahsin & Mutabaah'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    ( {activeDoc.penandatangan1Nama || '...........................................'} )
                  </p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="text-slate-500">
                  {activeDoc.titiMangsaTempat || 'Ditetapkan di Lembaga'},
                </p>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                    {activeDoc.penandatangan2Jabatan || 'Mudir / Pimpinan Lembaga'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    ( {activeDoc.penandatangan2Nama || '...........................................'} )
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KALKULATOR & SIMULASI INTERAKTIF */}
      {/* ========================================================================= */}
      {activeTab === 'simulasi' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Simulasi Uji Coba Perhitungan Nilai Real-time</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan kalkulator ini untuk menguji bagaimana formula proporsional menghitung nilai berdasarkan baris yang dibaca santri.
              </p>
            </div>

            {selectedElemen && (
              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold self-start sm:self-auto">
                Elemen: {selectedElemen.nama}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column */}
            <div className="lg:col-span-6 space-y-4 bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Jenis Modul Pembelajaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimJenisModul('quran')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      simJenisModul === 'quran'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>Mushaf Al-Qur'an</span>
                    <span className="text-[10px] opacity-80">({stdBarisQuran} Baris)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimJenisModul('non_quran')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      simJenisModul === 'non_quran'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>Non-Quran (Iqro/Jilid)</span>
                    <span className="text-[10px] opacity-80">({stdBarisNonQuran} Baris)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Jumlah Baris Dibaca Santri
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={simBaris}
                    onChange={(e) => setSimBaris(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">baris</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] text-slate-500">
                  <span>Pilihan Cepat:</span>
                  {[3, 5, 10, 15, 30].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSimBaris(cnt)}
                      className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
                    Lahn Jaliy (Fatal)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={simJaliyCount}
                      onChange={(e) => setSimJaliyCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-2 text-xs font-bold rounded-xl border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300"
                    />
                    <span className="absolute right-3 top-2 text-xs text-rose-500 font-bold">x salah</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                    Lahn Khafiy (Tajwid)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={simKhafiyCount}
                      onChange={(e) => setSimKhafiyCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-900/60 bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300"
                    />
                    <span className="absolute right-3 top-2 text-xs text-amber-500 font-bold">x salah</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Result Output Column */}
            <div className="lg:col-span-6 flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    HASIL SIMULASI ASESMEN
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    simResult.lulus ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {simResult.lulus ? 'Lulus' : 'Wajib Murojaah'}
                  </span>
                </div>

                {/* Score Big Display */}
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-mono font-black text-white">
                    {simResult.finalScore}
                  </span>
                  <div>
                    <span className="text-lg font-bold text-emerald-400 block">
                      {simResult.predikat}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Total Potongan: -{simResult.totalDeduction} Poin
                    </span>
                  </div>
                </div>
              </div>

              {/* Guardrail Status Badge */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Baris Setoran:</span>
                  <span className="font-bold text-white font-mono">{simResult.actualLines} baris</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Baris Efektif Pembagi:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {simResult.clampedLines} baris
                    {simResult.isFloorTriggered && ' (Terkunci Min Floor)'}
                    {simResult.isCeilTriggered && ' (Terkunci Maks Ceiling)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                  <span className="text-rose-300">Potongan per Lahn Jaliy:</span>
                  <span className="font-bold text-rose-400 font-mono">-{simResult.potongPerJaliy} pt / salah</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-300">Potongan per Lahn Khafiy:</span>
                  <span className="font-bold text-amber-400 font-mono">-{simResult.potongPerKhafiy} pt / salah</span>
                </div>
              </div>

              {/* Formula Step-by-step breakdown */}
              <div className="text-[10px] text-slate-400 font-mono leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5">
                <div>Nilai = 100 - ({simResult.jCount} × {simResult.potongPerJaliy} + {simResult.kCount} × {simResult.potongPerKhafiy})</div>
                <div>Nilai = 100 - ({simResult.totalJaliyDeduction} + {simResult.totalKhafiyDeduction}) = <strong>{simResult.finalScore}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LEMBAR RINGKASAN CEPAT (CHEAT SHEET) */}
      {/* ========================================================================= */}
      {activeTab === 'ringkasan' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Lembar Ringkasan Panduan Pengajar (Cheat Sheet)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rujukan cepat untuk para Asatidz saat menyimak setoran di meja halaqah.
              </p>
            </div>

            {selectedElemenId !== 'global' && (
              <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold self-start sm:self-auto">
                Rujukan: Elemen {selectedElemen?.nama || selectedElemenId} ({isElemenCustom ? 'SOP Khusus' : 'SOP Master'})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                <span>📐</span>
                <span>RUMUS UTAMA</span>
              </div>
              <div className="font-mono text-xs font-bold text-indigo-950 dark:text-indigo-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-200/50">
                Poin = ({stdBarisQuran} × Bobot) / Baris
              </div>
              <ul className="text-[11px] text-indigo-900/90 dark:text-indigo-300/90 space-y-1 list-disc list-inside">
                <li>Acuan Standar = {stdBarisQuran} Baris</li>
                <li>Lahn Jaliy = {bobotJaliy} Poin</li>
                <li>Lahn Khafiy = {bobotKhafiy} Poin</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                <span>🛡️</span>
                <span>BATAS AMAN (GUARDRAIL)</span>
              </div>
              <div className="font-mono text-xs font-bold text-amber-950 dark:text-amber-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-200/50">
                Rentang: {minBarisQuran} s.d {maxBarisQuran} Baris
              </div>
              <ul className="text-[11px] text-amber-900/90 dark:text-amber-300/90 space-y-1 list-disc list-inside">
                <li>Setor &lt; {minBarisQuran} baris: dikunci di {minBarisQuran} baris</li>
                <li>Maks potongan Jaliy = {((stdBarisQuran * bobotJaliy) / minBarisQuran).toFixed(0)} pt</li>
                <li>Setor &gt; {maxBarisQuran} baris: dikunci di {maxBarisQuran} baris</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                <span>✨</span>
                <span>MAKS 1X POTONG</span>
              </div>
              <div className="font-mono text-xs font-bold text-emerald-950 dark:text-emerald-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200/50">
                Huruf Hijaiyah Sama = 1x
              </div>
              <ul className="text-[11px] text-emerald-900/90 dark:text-emerald-300/90 space-y-1 list-disc list-inside">
                <li>Kesalahan makhraj huruf yang sama hanya dipotong satu kali per sesi</li>
                <li>Mencegah double-penalty (non-double penalty)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL POPUP */}
      {/* ========================================================================= */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {confirmDeleteModal.type === 'reset_sop' 
                    ? 'Konfirmasi Reset SOP Master' 
                    : confirmDeleteModal.type === 'delete_elemen_sop'
                    ? 'Konfirmasi Hapus SOP Khusus Elemen'
                    : 'Konfirmasi Hapus Bab'
                  }
                </h3>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-1">
                  "{confirmDeleteModal.title}"
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {confirmDeleteModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {confirmDeleteModal.type === 'reset_sop' 
                    ? 'Ya, Reset Standar Master' 
                    : confirmDeleteModal.type === 'delete_elemen_sop'
                    ? 'Ya, Hapus & Kembali ke Master'
                    : 'Ya, Hapus Bab'
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
