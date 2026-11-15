/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Flame, 
  Layers, 
  Lightbulb, 
  Volume2, 
  Activity,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Setoran, TajwidCategory } from '../types';

interface SiswaErrorAnalyticsProps {
  siswaId: string;
  siswaNama?: string;
  allSetorans: Setoran[];
  tajwidCategories?: TajwidCategory[];
  onApplyCategoryToForm?: (category: string, subcategory?: string) => void;
}

interface ParsedErrorItem {
  setoranId: string;
  date: string;
  modulNama: string;
  category: string;
  subcategory?: string;
  comment: string;
  passed: boolean;
}

interface CategoryStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
  subcategories: { [subName: string]: number };
}

interface SubcategoryStat {
  name: string;
  category: string;
  count: number;
  arabicGlyph?: string;
}

// Map common Hijaiyah letters with arabic glyph and articulation tip
const HIJAIYAH_DATA: { [key: string]: { glyph: string; makhrajGroup: string; tip: string } } = {
  'ط (Tha)': { glyph: 'ط', makhrajGroup: 'Ujung Lidah & Pangkal Gigi Seri Atas (Isti\'la & Ithbaq)', tip: 'Tebalkan suara dengan mengangkat pangkal dan merapatkan tengah lidah ke langit-langit (Ithbaq). Jangan tertukar dengan huruf ت.' },
  'Tha': { glyph: 'ط', makhrajGroup: 'Ujung Lidah & Pangkal Gigi Seri Atas (Isti\'la & Ithbaq)', tip: 'Tebalkan suara dengan mengangkat pangkal dan merapatkan tengah lidah ke langit-langit (Ithbaq).' },
  'ظ (Zha)': { glyph: 'ظ', makhrajGroup: 'Ujung Lidah & Ujung Gigi Seri Atas (Isti\'la & Ithbaq)', tip: 'Keluarkan sedikit ujung lidah menyentuh gigi seri atas, bunyikan tebal berdesir tanpa terputus.' },
  'Zha': { glyph: 'ظ', makhrajGroup: 'Ujung Lidah & Ujung Gigi Seri Atas (Isti\'la & Ithbaq)', tip: 'Keluarkan sedikit ujung lidah menyentuh gigi seri atas, bunyikan tebal berdesir.' },
  'ع (\'Ain)': { glyph: 'ع', makhrajGroup: 'Tengah Tenggorokan (Wasathul Halq)', tip: 'Tekan sedikit pita suara di tengah tenggorokan secara fasih dan bersih tanpa tertahan hidung.' },
  'ع': { glyph: 'ع', makhrajGroup: 'Tengah Tenggorokan (Wasathul Halq)', tip: 'Tekan sedikit pita suara di tengah tenggorokan secara fasih dan bersih.' },
  'Ain': { glyph: 'ع', makhrajGroup: 'Tengah Tenggorokan (Wasathul Halq)', tip: 'Tekan pita suara di tengah tenggorokan secara fasih tanpa dengung hidung.' },
  'غ (Ghain)': { glyph: 'غ', makhrajGroup: 'Ujung Tenggorokan (Adnal Halq)', tip: 'Getarkan ujung tenggorokan dengan suara tebal mengalir (Rikhwah & Isti\'la).' },
  'Ghain': { glyph: 'غ', makhrajGroup: 'Ujung Tenggorokan (Adnal Halq)', tip: 'Getarkan ujung tenggorokan dengan suara tebal mengalir.' },
  'ص (Shad)': { glyph: 'ص', makhrajGroup: 'Ujung Lidah & Gigi Seri Bawah (Shafir & Isti\'la)', tip: 'Desirkan nafas kuat dan tebalkan suara. Jangan biarkan bibir membulat berlebihan.' },
  'Shad': { glyph: 'ص', makhrajGroup: 'Ujung Lidah & Gigi Seri Bawah (Shafir & Isti\'la)', tip: 'Desirkan nafas kuat dan tebalkan suara (Ithbaq).' },
  'ض (Dhad)': { glyph: 'ض', makhrajGroup: 'Tepi Lidah & Gigi Geraham Atas (Istithalah)', tip: 'Rapatkan salah satu / kedua sisi tepi lidah ke geraham atas dengan memanjangkan makhraj.' },
  'Dhad': { glyph: 'ض', makhrajGroup: 'Tepi Lidah & Gigi Geraham Atas (Istithalah)', tip: 'Rapatkan tepi lidah ke geraham atas dengan memanjangkan makhraj (Istithalah).' },
  'ح (Ha)': { glyph: 'ح', makhrajGroup: 'Tengah Tenggorokan (Wasathul Halq)', tip: 'Keluarkan hembusan nafas bersih dan halus dari tengah tenggorokan tanpa gesekan kasar.' },
  'Ha': { glyph: 'ح', makhrajGroup: 'Tengah Tenggorokan (Wasathul Halq)', tip: 'Keluarkan hembusan nafas bersih dan halus dari tengah tenggorokan.' },
  'خ (Kha)': { glyph: 'خ', makhrajGroup: 'Ujung Tenggorokan (Adnal Halq)', tip: 'Bunyikan getaran tebal serak di ujung tenggorokan yang dekat dengan rongga mulut.' },
  'Kha': { glyph: 'خ', makhrajGroup: 'Ujung Tenggorokan (Adnal Halq)', tip: 'Bunyikan getaran tebal serak di ujung tenggorokan.' },
  'ق (Qaf)': { glyph: 'ق', makhrajGroup: 'Pangkal Lidah Paling Belakang (Aqshal Lisan)', tip: 'Pangkal lidah menempel ke langit-langit lunak (daging), bunyikan tebal dan pantulkan (Qalqalah) saat sukun.' },
  'Qaf': { glyph: 'ق', makhrajGroup: 'Pangkal Lidah Paling Belakang (Aqshal Lisan)', tip: 'Pangkal lidah menempel ke langit-langit lunak, bunyikan tebal dan mantap.' },
  'ك (Kaf)': { glyph: 'ك', makhrajGroup: 'Pangkal Lidah Sedikit ke Depan (Aqshal Lisan)', tip: 'Pangkal lidah menempel ke langit-langit keras, hembuskan desis nafas tipis (Hams) saat sukun.' },
  'ذ (Dzal)': { glyph: 'ذ', makhrajGroup: 'Ujung Lidah & Gigi Seri Atas (Istifal)', tip: 'Keluarkan sedikit ujung lidah menyentuh gigi seri atas, bunyikan tipis berdesir halus.' },
  'Dzal': { glyph: 'ذ', makhrajGroup: 'Ujung Lidah & Gigi Seri Atas (Istifal)', tip: 'Keluarkan sedikit ujung lidah menyentuh gigi seri atas, bunyikan tipis.' },
  'ث (Tsa)': { glyph: 'ث', makhrajGroup: 'Ujung Lidah & Gigi Seri Atas (Hams & Istifal)', tip: 'Ujung lidah menempel ringan pada gigi seri atas dengan hembusan nafas lembut.' },
  'Tsa': { glyph: 'ث', makhrajGroup: 'Ujung Lidah & Gigi Seri Atas (Hams & Istifal)', tip: 'Ujung lidah menempel ringan pada gigi seri atas dengan hembusan nafas lembut.' },
  'ز (Zai)': { glyph: 'ز', makhrajGroup: 'Ujung Lidah & Gigi Seri Bawah (Shafir & Jahr)', tip: 'Bunyikan dengung getar lebah yang jernih tanpa hembusan nafas kuat.' },
  'س (Sin)': { glyph: 'س', makhrajGroup: 'Ujung Lidah & Gigi Seri Bawah (Shafir & Hams)', tip: 'Bunyikan desis tajam dan tipis (Tarqiq) tanpa menebalkan suara.' },
  'ش (Syin)': { glyph: 'ش', makhrajGroup: 'Tengah Lidah & Langit-langit Keras (Tafasy-syi)', tip: 'Sebarkan hembusan angin deras di dalam seluruh rongga mulut.' },
  'ج (Jim)': { glyph: 'ج', makhrajGroup: 'Tengah Lidah & Langit-langit Keras (Syiddah)', tip: 'Rapatkan tengah lidah ke langit-langit sehingga tertahan suara dan nafas (Syiddah & Jahr).' },
  'ر (Ra)': { glyph: 'ر', makhrajGroup: 'Ujung Lidah & Gusi Atas (Takrir)', tip: 'Getarkan ujung lidah secukupnya (maksimal 1-2 getaran halus), jangan berlebihan.' },
  'ء (Hamzah)': { glyph: 'ء', makhrajGroup: 'Pangkal Tenggorokan (Aqshal Halq)', tip: 'Bunyikan vokal jelas dan tegas tanpa ditahan di hidung atau mengambang.' },
  'ه (Ha\')': { glyph: 'ه', makhrajGroup: 'Pangkal Tenggorokan (Aqshal Halq)', tip: 'Keluarkan nafas lembut dari pangkal tenggorokan terdalam.' }
};

const CATEGORY_COLORS = [
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#10b981', // emerald
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ef4444', // red
  '#f97316', // orange
  '#14b8a6', // teal
  '#84cc16'  // lime
];

export const SiswaErrorAnalytics: React.FC<SiswaErrorAnalyticsProps> = ({
  siswaId,
  siswaNama = 'Santri',
  allSetorans,
  tajwidCategories = [],
  onApplyCategoryToForm
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'recent5' | 'recent10'>('all');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
  const [isExpandedTips, setIsExpandedTips] = useState<boolean>(true);
  const [showRecentList, setShowRecentList] = useState<boolean>(true);

  // 1. Filter student setoran records
  const studentSetorans = useMemo(() => {
    if (!siswaId) return [];
    const filtered = allSetorans
      .filter(s => s.siswaId === siswaId)
      .sort((a, b) => new Date(b.tanggalSetoran || 0).getTime() - new Date(a.tanggalSetoran || 0).getTime());

    if (filterPeriod === 'recent5') return filtered.slice(0, 5);
    if (filterPeriod === 'recent10') return filtered.slice(0, 10);
    return filtered;
  }, [siswaId, allSetorans, filterPeriod]);

  // 2. Parse all error items from both interactiveComments and catatanGuru
  const parsedErrors: ParsedErrorItem[] = useMemo(() => {
    if (!studentSetorans.length) return [];
    const results: ParsedErrorItem[] = [];

    studentSetorans.forEach(setoran => {
      // Branch A: Structured interactive comments
      if (setoran.interactiveComments && Array.isArray(setoran.interactiveComments) && setoran.interactiveComments.length > 0) {
        setoran.interactiveComments.forEach(comm => {
          if (comm.category || comm.comment) {
            results.push({
              setoranId: setoran.id,
              date: setoran.tanggalSetoran,
              modulNama: setoran.modulNama || 'Setoran',
              category: comm.category || 'Catatan Tajwid',
              subcategory: comm.subcategory || undefined,
              comment: comm.comment || comm.info || 'Koreksi bacaan',
              passed: !!setoran.statusLulus
            });
          }
        });
      }

      // Branch B: Free text / formatted lines inside catatanGuru
      if (setoran.catatanGuru && typeof setoran.catatanGuru === 'string') {
        const rawNote = setoran.catatanGuru.trim();
        if (rawNote) {
          // Split multi-line or bulleted notes
          const lines = rawNote.split(/\n+|•|\*|\d+\.\s+/).map(l => l.trim()).filter(Boolean);
          
          lines.forEach(line => {
            // Check if already captured in interactiveComments to avoid strict duplication
            const isAlreadyCaptured = setoran.interactiveComments?.some(ic => ic.comment && line.includes(ic.comment));
            if (isAlreadyCaptured) return;

            let extractedCat = '';
            let extractedSub = '';
            let commentText = line;

            // Pattern 1: [Category (Subcategory)]: Note or [Category - Subcategory]: Note
            const bracketMatch = line.match(/^\[([^\]]+)\]\s*:\s*(.+)$/);
            if (bracketMatch) {
              const header = bracketMatch[1].trim();
              commentText = bracketMatch[2].trim();
              
              // Check sub inside brackets like "Makhraj Huruf (ط (Tha))" or "Makhraj Huruf - ط"
              const subParenMatch = header.match(/^(.+?)\s*\(([^)]+)\)$/);
              const subDashMatch = header.match(/^(.+?)\s*-\s*(.+)$/);
              if (subParenMatch) {
                extractedCat = subParenMatch[1].trim();
                extractedSub = subParenMatch[2].trim();
              } else if (subDashMatch) {
                extractedCat = subDashMatch[1].trim();
                extractedSub = subDashMatch[2].trim();
              } else {
                extractedCat = header;
              }
            } else {
              // Pattern 2: Category (Subcategory): Note
              const parenMatch = line.match(/^([A-Za-z\s'’]+)\s*\(([^)]+)\)\s*:\s*(.+)$/);
              if (parenMatch) {
                extractedCat = parenMatch[1].trim();
                extractedSub = parenMatch[2].trim();
                commentText = parenMatch[3].trim();
              }
            }

            // Pattern 3: Keyword heuristic classification if not bracketed
            if (!extractedCat) {
              const lower = line.toLowerCase();
              if (lower.includes('makhraj') || lower.includes('makharijul') || lower.includes('huruf')) {
                extractedCat = 'Makhraj Huruf';
              } else if (lower.includes('mad ') || lower.includes('panjang') || lower.includes('thobi') || lower.includes('jaiz') || lower.includes('wajib')) {
                extractedCat = 'Mad / Panjang-Pendek';
              } else if (lower.includes('ghunnah') || lower.includes('dengung')) {
                extractedCat = 'Ghunnah / Dengung';
              } else if (lower.includes('ikhfa') || lower.includes('idgham') || lower.includes('iqlab') || lower.includes('izhar') || lower.includes('nun mati') || lower.includes('tanwin')) {
                extractedCat = 'Hukum Nun Sukun / Tanwin';
              } else if (lower.includes('qalqalah') || lower.includes('pantul')) {
                extractedCat = 'Qalqalah';
              } else if (lower.includes('waqaf') || lower.includes('ibtida') || lower.includes('nafas') || lower.includes('berhenti')) {
                extractedCat = 'Waqaf & Ibtida\'';
              } else if (lower.includes('lancar') || lower.includes('lupa') || lower.includes('tersendat') || lower.includes('ulang')) {
                extractedCat = 'Kelancaran & Hafalan';
              } else if (lower.includes('harokat') || lower.includes('baris') || lower.includes('fathah') || lower.includes('kasrah') || lower.includes('dhammah')) {
                extractedCat = 'Harokat / Tanda Baca';
              } else {
                extractedCat = 'Catatan Umum / Bimbingan';
              }
            }

            // Detect Hijaiyah letter mentioned in text if subcategory is empty
            if (!extractedSub) {
              for (const [subKey] of Object.entries(HIJAIYAH_DATA)) {
                // Check if letter name or glyph appears in text
                const cleanKey = subKey.replace(/[()]/g, '');
                const parts = cleanKey.split(/\s+/);
                for (const part of parts) {
                  if (part.length >= 2 && line.toLowerCase().includes(part.toLowerCase())) {
                    extractedSub = subKey;
                    break;
                  }
                  if (part.length === 1 && line.includes(part)) {
                    extractedSub = subKey;
                    break;
                  }
                }
                if (extractedSub) break;
              }
            }

            results.push({
              setoranId: setoran.id,
              date: setoran.tanggalSetoran,
              modulNama: setoran.modulNama || 'Setoran',
              category: extractedCat,
              subcategory: extractedSub || undefined,
              comment: commentText,
              passed: !!setoran.statusLulus
            });
          });
        }
      }
    });

    return results;
  }, [studentSetorans]);

  // 3. Aggregate Category Statistics
  const categoryStats: CategoryStat[] = useMemo(() => {
    if (!parsedErrors.length) return [];
    const map: { [cat: string]: { count: number; subcategories: { [sub: string]: number } } } = {};

    parsedErrors.forEach(err => {
      const cat = err.category || 'Lainnya';
      if (!map[cat]) {
        map[cat] = { count: 0, subcategories: {} };
      }
      map[cat].count += 1;
      if (err.subcategory) {
        map[cat].subcategories[err.subcategory] = (map[cat].subcategories[err.subcategory] || 0) + 1;
      }
    });

    const total = parsedErrors.length;
    return Object.entries(map)
      .map(([name, data], idx) => ({
        name,
        count: data.count,
        percentage: Math.round((data.count / total) * 100),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        subcategories: data.subcategories
      }))
      .sort((a, b) => b.count - a.count);
  }, [parsedErrors]);

  // 4. Aggregate Subcategory / Letter Statistics
  const subCategoryStats: SubcategoryStat[] = useMemo(() => {
    if (!parsedErrors.length) return [];
    const map: { [sub: string]: { category: string; count: number } } = {};

    parsedErrors.forEach(err => {
      if (err.subcategory) {
        const sub = err.subcategory;
        if (!map[sub]) {
          map[sub] = { category: err.category, count: 0 };
        }
        map[sub].count += 1;
      }
    });

    return Object.entries(map)
      .map(([name, data]) => {
        const hijData = HIJAIYAH_DATA[name];
        return {
          name,
          category: data.category,
          count: data.count,
          arabicGlyph: hijData ? hijData.glyph : undefined
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [parsedErrors]);

  // 5. Intelligent Personal Guidance Engine (Actionable Tips for Guru)
  const personalGuidance = useMemo(() => {
    if (!parsedErrors.length || !categoryStats.length) return null;

    const topCategory = categoryStats[0];
    const topSubcategory = subCategoryStats[0];
    const passRate = studentSetorans.length > 0 
      ? Math.round((studentSetorans.filter(s => s.statusLulus).length / studentSetorans.length) * 100) 
      : 100;

    const insights: Array<{ title: string; desc: string; type: 'urgent' | 'warning' | 'info' | 'positive' }> = [];

    // Rule 1: Specific Hijaiyah Letter Weakness
    if (topSubcategory && topSubcategory.count >= 2) {
      const hij = HIJAIYAH_DATA[topSubcategory.name];
      insights.push({
        title: `Prioritas Makhraj: Huruf ${topSubcategory.name} (${topSubcategory.count}x keliru)`,
        desc: hij 
          ? `Santri sering mengalami ketidaktepatan pada huruf ${topSubcategory.name} [${hij.makhrajGroup}]. Saran: ${hij.tip}`
          : `Santri sering terdeteksi keliru pada subkategori ${topSubcategory.name}. Berikan porsi latihan talaqqi 3 menit pada bagian ini sebelum setoran materi baru.`,
        type: 'urgent'
      });
    }

    // Rule 2: Dominant Category Recommendation
    if (topCategory) {
      const lower = topCategory.name.toLowerCase();
      if (lower.includes('makhraj') || lower.includes('huruf')) {
        insights.push({
          title: `Fokus Utama: Pelafalan & Karakteristik Huruf (${topCategory.count} catatan)`,
          desc: 'Koreksi terbanyak santri berada pada Makharijul Huruf. Disarankan guru memberikan contoh suara langsung (talaqqi) di depan santri dengan artikulasi bibir dan rongga mulut yang jelas.',
          type: 'warning'
        });
      } else if (lower.includes('mad') || lower.includes('panjang')) {
        insights.push({
          title: `Fokus Utama: Konsistensi Kadar Mad (${topCategory.count} catatan)`,
          desc: 'Santri cenderung terburu-buru sehingga kadar panjang 2 harakat (Mad Thobi\'i) terpotong atau sebaliknya dipanjangkan berlebihan. Latih ketukan jari stabil saat membaca.',
          type: 'warning'
        });
      } else if (lower.includes('ghunnah') || lower.includes('dengung') || lower.includes('nun')) {
        insights.push({
          title: `Fokus Utama: Kesempurnaan Ghunnah & Dengung (${topCategory.count} catatan)`,
          desc: 'Tahan tempo dengung (Ghunnah) selama 2 harakat penuh pada nun/mim bertasydid serta hukum ikhfa/idgham bighunnah.',
          type: 'info'
        });
      } else if (lower.includes('kelancaran') || lower.includes('hafalan')) {
        insights.push({
          title: `Fokus Utama: Penguatan Sambung Ayat / Mutabaah (${topCategory.count} catatan)`,
          desc: 'Hafalan santri masih sering ragu di awal ayat atau pergantian kalimat. Anjurkan murojaah mandiri minimal 3x putaran sebelum menyetorkan ke guru.',
          type: 'info'
        });
      }
    }

    // Rule 3: Pass rate appreciation or reinforcement
    if (passRate >= 80) {
      insights.push({
        title: `Tren Positif: Kelulusan ${passRate}%`,
        desc: 'Secara umum performa capaian santri sangat baik dan konsisten memenuhi standar kelulusan materi.',
        type: 'positive'
      });
    } else {
      insights.push({
        title: `Tingkat Kelulusan: ${passRate}%`,
        desc: 'Santri memerlukan bimbingan remedial intensif pada ayat/halaman yang belum lulus sebelum diizinkan melangkah ke halaman berikutnya.',
        type: 'warning'
      });
    }

    return {
      topCategory,
      topSubcategory,
      passRate,
      insights
    };
  }, [parsedErrors, categoryStats, subCategoryStats, studentSetorans]);

  // Filtered recent error items
  const displayRecentErrors = useMemo(() => {
    if (!selectedFilterCategory) return parsedErrors.slice(0, 6);
    return parsedErrors.filter(e => e.category === selectedFilterCategory || e.subcategory === selectedFilterCategory).slice(0, 6);
  }, [parsedErrors, selectedFilterCategory]);

  // If no student is selected
  if (!siswaId) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <BarChart3 className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Statistik & Analisis Kesalahan Siswa
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Silakan pilih santri pada form di atas untuk melihat rangkuman kesalahan yang sering terjadi, huruf hijaiyah yang perlu dilatih, dan saran bimbingan personal.
        </p>
      </div>
    );
  }

  // If student selected but no error history found
  if (parsedErrors.length === 0) {
    return (
      <div className="bg-emerald-50/50 dark:bg-slate-900/60 border border-emerald-200 dark:border-emerald-900/40 p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Analisis Kesalahan: <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{siswaNama}</span>
              </h4>
              <p className="text-[10px] text-slate-500">Total {studentSetorans.length} riwayat setoran tercatat</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-300 dark:border-emerald-800">
            Catatan Bersih ✨
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-950/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-950">
          Belum ada catatan kesalahan khusus atau koreksi berulang yang terdata untuk santri ini. Setiap catatan evaluasi yang disimpan oleh guru akan otomatis dianalisis dan dirangkum di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs transition-all">
      
      {/* ----------------------------------------------------
          1. HEADER & PERIOD FILTER
          ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-indigo-600 text-white rounded-xl shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Analisis Kesalahan Umum: <span className="text-indigo-600 dark:text-indigo-400">{siswaNama}</span>
              </h3>
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md border border-indigo-200 dark:border-indigo-800">
                {parsedErrors.length} Temuan Koreksi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rangkuman pola kesalahan bacaan untuk membantu guru memberikan bimbingan personal & terarah
            </p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterPeriod('all')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filterPeriod === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Semua ({studentSetorans.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('recent10')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filterPeriod === 'recent10'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            10 Terakhir
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('recent5')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filterPeriod === 'recent5'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            5 Terakhir
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          2. KEY METRIC SUMMARY CARDS (4 CARDS)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Setoran */}
        <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Setoran Masuk</span>
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {studentSetorans.length} <span className="text-xs font-semibold text-slate-500">Sesi</span>
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {personalGuidance?.passRate}% Kelulusan
          </p>
        </div>

        {/* Card 2: Total Kesalahan */}
        <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Koreksi</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400">
            {parsedErrors.length} <span className="text-xs font-semibold text-slate-500">Catatan</span>
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            Rata-rata {(parsedErrors.length / Math.max(1, studentSetorans.length)).toFixed(1)} / sesi
          </p>
        </div>

        {/* Card 3: Top Category */}
        <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Kategori Dominan</span>
            <Layers className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate" title={categoryStats[0]?.name || '-'}>
            {categoryStats[0]?.name || '-'}
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
            {categoryStats[0]?.count || 0}x ({categoryStats[0]?.percentage || 0}%)
          </p>
        </div>

        {/* Card 4: Top Huruf / Subcategory */}
        <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Huruf Sering Keliru</span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 truncate flex items-center gap-1.5" title={subCategoryStats[0]?.name || '-'}>
            {subCategoryStats[0]?.arabicGlyph && (
              <span className="text-base font-serif font-black">{subCategoryStats[0].arabicGlyph}</span>
            )}
            <span>{subCategoryStats[0]?.name || 'Belum spesifik'}</span>
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            {subCategoryStats[0] ? `${subCategoryStats[0].count}x tercatat salah` : 'Data huruf merata'}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------
          3. MAIN VISUALIZATION: BAR CHART & HIJAIYAH HEATMAP
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT / TOP: Category Breakdown Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-850/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Distribusi Kategori Kesalahan</span>
            </span>
            {selectedFilterCategory && (
              <button
                type="button"
                onClick={() => setSelectedFilterCategory(null)}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Reset Filter</span>
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryStats}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  width={130}
                  tickFormatter={(val: string) => val.length > 18 ? val.substring(0, 16) + '…' : val}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as CategoryStat;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg space-y-1 border border-slate-700">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-amber-300 font-semibold">{data.count} Kali Keliru ({data.percentage}%)</p>
                          {Object.keys(data.subcategories).length > 0 && (
                            <div className="pt-1 border-t border-slate-700 text-[10px] text-slate-300">
                              <span className="font-semibold block mb-0.5">Rincian Huruf/Sub:</span>
                              {Object.entries(data.subcategories).slice(0, 4).map(([sName, sCount]) => (
                                <span key={sName} className="inline-block mr-2 text-indigo-200">
                                  {sName}: {sCount}x
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[0, 6, 6, 0]}
                  onClick={(data: any) => {
                    if (data && data.name) {
                      setSelectedFilterCategory(selectedFilterCategory === data.name ? null : data.name);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={selectedFilterCategory === entry.name ? '#4f46e5' : entry.color}
                      opacity={selectedFilterCategory && selectedFilterCategory !== entry.name ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Category Badges with quick-action click */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
            {categoryStats.map((cat) => {
              const isSelected = selectedFilterCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedFilterCategory(isSelected ? null : cat.name)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-400'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {cat.count}x
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT / TOP: Hijaiyah Letter Weakness Map (5 cols) */}
        <div className="lg:col-span-5 bg-indigo-50/50 dark:bg-slate-850/70 p-4 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <span>🔤</span>
              <span>Peta Huruf Hijaiyah & Subkategori</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {subCategoryStats.length} Huruf/Sub
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Huruf-huruf di bawah terdeteksi paling sering dikoreksi pada riwayat setoran santri ini.
          </p>

          {subCategoryStats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-indigo-100 dark:border-indigo-950">
              {subCategoryStats.map(sub => {
                const isSelected = selectedFilterCategory === sub.name;
                const isHighError = sub.count >= 3;
                return (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => {
                      setSelectedFilterCategory(isSelected ? null : sub.name);
                      if (onApplyCategoryToForm) {
                        onApplyCategoryToForm(sub.category, sub.name);
                      }
                    }}
                    title={`${sub.name}: ${sub.count}x keliru. Klik untuk filter catatan atau pasang ke form.`}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-400 scale-105'
                        : isHighError
                          ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {sub.arabicGlyph && (
                      <span className="text-base font-serif font-black">{sub.arabicGlyph}</span>
                    )}
                    <span>{sub.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected
                        ? 'bg-indigo-800 text-white'
                        : isHighError
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {sub.count}x
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
              Belum ada data huruf hijaiyah spesifik. Gunakan subkategori huruf saat mengisi catatan.
            </div>
          )}

          {/* Quick Tip Pill */}
          {subCategoryStats[0] && HIJAIYAH_DATA[subCategoryStats[0].name] && (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 space-y-0.5">
              <span className="font-extrabold flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-600" />
                <span>Tips Makhraj Huruf {subCategoryStats[0].name}:</span>
              </span>
              <p className="leading-snug text-slate-700 dark:text-slate-300">
                {HIJAIYAH_DATA[subCategoryStats[0].name].tip}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          4. SMART PERSONAL GUIDANCE BOX (INSIGHT FOR TEACHER)
          ---------------------------------------------------- */}
      {personalGuidance && (
        <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-emerald-50/70 dark:from-slate-850 dark:via-slate-850 dark:to-slate-850 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200 font-mono">
                Rekomendasi Bimbingan Personal Ustadz / Ustadzah
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsExpandedTips(!isExpandedTips)}
              className="text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
            >
              <span>{isExpandedTips ? 'Sembunyikan' : 'Buka Rekomendasi'}</span>
              {isExpandedTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isExpandedTips && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 animate-fade-in">
              {personalGuidance.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    insight.type === 'urgent'
                      ? 'bg-rose-50/90 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200'
                      : insight.type === 'warning'
                        ? 'bg-amber-50/90 border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200'
                        : insight.type === 'positive'
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-200'
                          : 'bg-indigo-50/90 border-indigo-200 text-indigo-950 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-200'
                  }`}
                >
                  <p className="font-extrabold flex items-center gap-1.5">
                    <span>
                      {insight.type === 'urgent' ? '⚠️' : insight.type === 'warning' ? '🎯' : insight.type === 'positive' ? '🌟' : '💡'}
                    </span>
                    <span>{insight.title}</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {insight.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          5. RECENT CORRECTION LOG (ACCORDION / DETAIL)
          ---------------------------------------------------- */}
      <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowRecentList(!showRecentList)}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Catatan Koreksi Terakhir {selectedFilterCategory ? `(Filter: ${selectedFilterCategory})` : ''} ({displayRecentErrors.length})
            </span>
            {showRecentList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          
          {selectedFilterCategory && (
            <button
              type="button"
              onClick={() => setSelectedFilterCategory(null)}
              className="text-[10px] text-slate-500 hover:text-rose-600 cursor-pointer font-semibold"
            >
              Hapus Filter Kategori ✕
            </button>
          )}
        </div>

        {showRecentList && (
          <div className="space-y-2 animate-fade-in">
            {displayRecentErrors.length > 0 ? (
              displayRecentErrors.map((err, index) => (
                <div 
                  key={`${err.setoranId}-${index}`}
                  className="p-3 bg-slate-50 dark:bg-slate-850/80 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {err.modulNama}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md border border-amber-200 dark:border-amber-800">
                        {err.category}
                      </span>
                      {err.subcategory && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold rounded-md">
                          {err.subcategory}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        📅 {err.date || '-'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pl-1 border-l-2 border-amber-400">
                      "{err.comment}"
                    </p>
                  </div>

                  {onApplyCategoryToForm && (
                    <button
                      type="button"
                      onClick={() => onApplyCategoryToForm(err.category, err.subcategory)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 self-end sm:self-auto cursor-pointer transition-all hover:scale-102 flex items-center gap-1 shrink-0"
                    >
                      <span>Pakai Kategori</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-slate-400 text-xs">
                Tidak ada catatan pada filter ini.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
