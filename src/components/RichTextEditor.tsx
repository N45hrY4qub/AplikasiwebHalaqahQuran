import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  RotateCcw,
  Undo2,
  Redo2,
  Eye,
  Edit3,
  Highlighter,
  Palette,
  Sparkles,
  Type,
  ChevronDown
} from 'lucide-react';
import { NonQuranFont } from '../types';
import { RichTextRenderer } from './RichTextRenderer';

export interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  nonQuranFonts?: NonQuranFont[];
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  id = 'rich-text-editor',
  value,
  onChange,
  placeholder = 'Tulis isi pengumuman di sini...',
  minHeight = '180px',
  nonQuranFonts = []
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [selectedFont, setSelectedFont] = useState<string>('Default (Sans)');
  const [selectedSize, setSelectedSize] = useState<string>('Normal');
  const [isFocused, setIsFocused] = useState(false);

  // Sync editor content from props only when not focused or if empty/reset
  useEffect(() => {
    if (editorRef.current && activeTab === 'edit') {
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml && (document.activeElement !== editorRef.current || !value)) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, activeTab]);

  const executeCommand = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, val);
      handleInput();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If empty or just a <br>, send empty string
      if (html === '<br>' || html === '<p><br></p>' || html === '<div><br></div>' || !html.trim()) {
        onChange('');
      } else {
        onChange(html);
      }
    }
  };

  const handleFormatBlock = (tag: string) => {
    executeCommand('formatBlock', `<${tag}>`);
  };

  const handleFontChange = (fontFamily: string, label: string) => {
    executeCommand('fontName', fontFamily);
    setSelectedFont(label);
    setShowFontMenu(false);
  };

  const handleSizeChange = (sizeVal: string, label: string) => {
    // sizeVal is 1-7 for execCommand fontSize
    executeCommand('fontSize', sizeVal);
    setSelectedSize(label);
  };

  const handleApplyColor = (color: string) => {
    executeCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const handleApplyHighlight = (color: string) => {
    executeCommand('hiliteColor', color);
    setShowHighlightPicker(false);
  };

  const defaultFonts = [
    { label: 'Default (Sans-serif)', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { label: 'Serif (Klasik/Resmi)', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
    { label: 'Monospace (Rata/Kode)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
    { label: 'Amiri (Arab/Islami)', value: '"Amiri", "Traditional Arabic", serif' },
    { label: 'Scheherazade (Arab)', value: '"Scheherazade New", "Scheherazade", serif' },
    { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' }
  ];

  // Merge with custom nonQuranFonts if available
  const allFonts = [
    ...defaultFonts,
    ...nonQuranFonts.map(f => ({ label: f.name, value: f.name }))
  ];

  const fontSizes = [
    { label: 'Kecil', value: '2' },
    { label: 'Normal', value: '3' },
    { label: 'Sedang', value: '4' },
    { label: 'Besar', value: '5' },
    { label: 'Ekstra Besar', value: '6' }
  ];

  const textColors = [
    { label: 'Default', value: 'inherit', class: 'bg-slate-700 dark:bg-slate-300' },
    { label: 'Hijau Zamrud', value: '#059669', class: 'bg-emerald-600' },
    { label: 'Biru', value: '#2563eb', class: 'bg-blue-600' },
    { label: 'Merah Penting', value: '#dc2626', class: 'bg-red-600' },
    { label: 'Amber / Emas', value: '#d97706', class: 'bg-amber-600' },
    { label: 'Ungu', value: '#7c3aed', class: 'bg-purple-600' }
  ];

  const highlightColors = [
    { label: 'Tanpa Sorot', value: 'transparent', class: 'border border-slate-300 bg-transparent' },
    { label: 'Kuning', value: '#fef08a', class: 'bg-yellow-200' },
    { label: 'Hijau Muda', value: '#bbf7d0', class: 'bg-green-200' },
    { label: 'Biru Muda', value: '#bfdbfe', class: 'bg-blue-200' },
    { label: 'Merah Muda', value: '#fecaca', class: 'bg-red-200' },
    { label: 'Ungu Muda', value: '#e9d5ff', class: 'bg-purple-200' }
  ];

  return (
    <div className="w-full border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
      {/* Editor Header: Toolbar & Mode Switcher */}
      <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 p-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          {/* Main Formatting Toolbar Buttons */}
          <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
            {/* Font Family Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowFontMenu(!showFontMenu);
                  setShowColorPicker(false);
                  setShowHighlightPicker(false);
                }}
                title="Pilih Jenis Font / Huruf"
                className="flex items-center space-x-1 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition cursor-pointer max-w-[120px] sm:max-w-[140px] truncate"
              >
                <Type className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                <span className="truncate text-[11px] font-medium">{selectedFont}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
              </button>

              {showFontMenu && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 max-h-56 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Jenis Huruf / Font
                  </div>
                  {allFonts.map((f, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleFontChange(f.value, f.label);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer flex items-center justify-between"
                    >
                      <span style={{ fontFamily: f.value }} className="truncate">{f.label}</span>
                      {selectedFont === f.label && <span className="text-emerald-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Selector */}
            <select
              value={selectedSize}
              onChange={(e) => {
                const found = fontSizes.find(fs => fs.label === e.target.value);
                if (found) handleSizeChange(found.value, found.label);
              }}
              title="Ukuran Teks"
              className="px-1.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {fontSizes.map(fs => (
                <option key={fs.value} value={fs.label}>{fs.label}</option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Bold */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('bold');
              }}
              title="Tebal / Bold (Ctrl+B)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('italic');
              }}
              title="Miring / Italic (Ctrl+I)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('underline');
              }}
              title="Garis Bawah / Underline (Ctrl+U)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Underline className="w-4 h-4" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('strikeThrough');
              }}
              title="Coret / Strikethrough"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Alignment: Left */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('justifyLeft');
              }}
              title="Rata Kiri"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            {/* Alignment: Center */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('justifyCenter');
              }}
              title="Rata Tengah"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <AlignCenter className="w-4 h-4" />
            </button>

            {/* Alignment: Right */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('justifyRight');
              }}
              title="Rata Kanan"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <AlignRight className="w-4 h-4" />
            </button>

            {/* Alignment: Justify */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('justifyFull');
              }}
              title="Rata Kanan-Kiri / Justify"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <AlignJustify className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Headings */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatBlock('h3');
              }}
              title="Judul Bagian (H3)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Heading2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatBlock('h4');
              }}
              title="Subjudul (H4)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            {/* Lists */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('insertUnorderedList');
              }}
              title="Daftar Poin (Bullet List)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('insertOrderedList');
              }}
              title="Daftar Angka (Numbered List)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            {/* Quote */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatBlock('blockquote');
              }}
              title="Blok Kutipan / Catatan Khusus"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Text Color Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowHighlightPicker(false);
                  setShowFontMenu(false);
                }}
                title="Warna Teks"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  showColorPicker
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" />
              </button>

              {showColorPicker && (
                <div className="absolute left-0 top-full mt-1.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 flex items-center space-x-1.5">
                  {textColors.map((tc) => (
                    <button
                      key={tc.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleApplyColor(tc.value);
                      }}
                      title={tc.label}
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer shadow-xs"
                    >
                      <span className={`w-4 h-4 rounded-full ${tc.class}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Highlight Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHighlightPicker(!showHighlightPicker);
                  setShowColorPicker(false);
                  setShowFontMenu(false);
                }}
                title="Sorot Latar Teks (Highlighter)"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  showHighlightPicker
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Highlighter className="w-4 h-4" />
              </button>

              {showHighlightPicker && (
                <div className="absolute left-0 top-full mt-1.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 flex items-center space-x-1.5">
                  {highlightColors.map((hc) => (
                    <button
                      key={hc.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleApplyHighlight(hc.value);
                      }}
                      title={hc.label}
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer shadow-xs"
                    >
                      <span className={`w-4 h-4 rounded-full ${hc.class}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Formatting */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('removeFormat');
              }}
              title="Hapus Format Teks"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

            {/* Undo / Redo */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('undo');
              }}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition hidden sm:inline-block cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('redo');
              }}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition hidden sm:inline-block cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Switcher: Tulis vs Pratinjau */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Tulis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Pratinjau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      {activeTab === 'edit' ? (
        <div className="relative">
          <div
            id={id}
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              handleInput();
            }}
            style={{ minHeight }}
            className={`p-4 outline-none text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans focus:ring-0 overflow-y-auto max-h-[360px]
              [&_p]:my-1.5
              [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:my-2
              [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-slate-800 dark:[&_h4]:text-slate-100 [&_h4]:my-1.5
              [&_b]:font-bold [&_strong]:font-bold
              [&_i]:italic [&_em]:italic
              [&_u]:underline [&_u]:decoration-current
              [&_strike]:line-through
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
              [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-emerald-50/60 dark:[&_blockquote]:bg-emerald-950/30 [&_blockquote]:pl-3.5 [&_blockquote]:py-1.5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:my-2`}
          />

          {/* Placeholder indicator when empty */}
          {!value && !isFocused && (
            <div
              onClick={() => editorRef.current?.focus()}
              className="absolute top-4 left-4 text-slate-400 dark:text-slate-500 text-sm pointer-events-none select-none flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 opacity-60" />
              <span>{placeholder}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ minHeight }}
          className="p-4 bg-slate-50/60 dark:bg-slate-900/60 overflow-y-auto max-h-[360px]"
        >
          {value ? (
            <RichTextRenderer content={value} />
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              Belum ada teks yang ditulis untuk pratinjau.
            </div>
          )}
        </div>
      )}

      {/* Helpful shortcut legend bar */}
      <div className="bg-slate-50/80 dark:bg-slate-800/40 px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>Gunakan tombol toolbar untuk memilih font, ukuran, tebal, miring, garis bawah, perataan teks, atau warna.</span>
        <span className="hidden sm:inline">Pintasan: <b>Ctrl+B</b> (Tebal), <b>Ctrl+I</b> (Miring), <b>Ctrl+U</b> (Garis Bawah)</span>
      </div>
    </div>
  );
};
