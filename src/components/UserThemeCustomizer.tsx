/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Lock,
  Check,
  Building2,
  Sparkles,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  APP_THEME_PRESETS,
  UserColorThemePreference,
  deriveHarmoniousSecondaryHex,
  generateTailwindScale,
  getContrastRatio,
  isValidHex,
  normalizeHex
} from '../utils/themeColorEngine';

export const UserThemeCustomizer: React.FC = () => {
  const {
    institutionTheme,
    activeUserColorTheme,
    updateCurrentUserColorTheme,
    effectiveThemeColors,
    strukturLembaga
  } = useApp();

  const isLockedByAdmin = Boolean(institutionTheme?.lockInstitutionTheme);
  const currentMode: UserColorThemePreference['mode'] = activeUserColorTheme?.mode || 'institution';

  const [selectedTab, setSelectedTab] = useState<'institution' | 'preset' | 'custom'>(currentMode);
  const [customHexInput, setCustomHexInput] = useState<string>(
    activeUserColorTheme?.primaryHex && isValidHex(activeUserColorTheme.primaryHex)
      ? normalizeHex(activeUserColorTheme.primaryHex)
      : normalizeHex(effectiveThemeColors.primaryHex)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const mode = activeUserColorTheme?.mode || 'institution';
    setSelectedTab(mode);
    if (mode === 'custom' && activeUserColorTheme?.primaryHex && isValidHex(activeUserColorTheme.primaryHex)) {
      setCustomHexInput(normalizeHex(activeUserColorTheme.primaryHex));
    }
  }, [activeUserColorTheme?.mode, activeUserColorTheme?.primaryHex, activeUserColorTheme?.presetId]);

  const showNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => {
      setSavedNotice((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleSelectInstitution = async () => {
    if (isLockedByAdmin || isSaving) return;
    setSelectedTab('institution');
    setIsSaving(true);
    try {
      await updateCurrentUserColorTheme({ mode: 'institution' });
      showNotice('Mengikuti warna identitas lembaga dan tersinkron ke akun.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPreset = async (presetId: string, primaryHex: string, secondaryHex: string) => {
    if (isLockedByAdmin || isSaving) return;
    setSelectedTab('preset');
    setIsSaving(true);
    try {
      await updateCurrentUserColorTheme({
        mode: 'preset',
        presetId,
        primaryHex,
        secondaryHex
      });
      const presetName = APP_THEME_PRESETS.find((p) => p.id === presetId)?.name || 'Palet Pilihan';
      showNotice(`Warna "${presetName}" diterapkan dan tersimpan di akun Anda.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLockedByAdmin || isSaving) return;
    if (!isValidHex(customHexInput)) return;

    const normalizedPrimary = normalizeHex(customHexInput);
    const derivedSecondary = deriveHarmoniousSecondaryHex(normalizedPrimary);
    setIsSaving(true);
    try {
      await updateCurrentUserColorTheme({
        mode: 'custom',
        primaryHex: normalizedPrimary,
        secondaryHex: derivedSecondary
      });
      showNotice('Warna aksen kustom berhasil diterapkan dan tersimpan ke akun Anda.');
    } finally {
      setIsSaving(false);
    }
  };

  const institutionName = strukturLembaga?.yayasan?.singkatan || strukturLembaga?.yayasan?.nama || 'Lembaga';
  const instPrimary = normalizeHex(institutionTheme?.primaryHex);
  const instSecondary = institutionTheme?.secondaryHex
    ? normalizeHex(institutionTheme.secondaryHex)
    : deriveHarmoniousSecondaryHex(instPrimary);

  const validCustomHex = isValidHex(customHexInput) ? normalizeHex(customHexInput) : instPrimary;
  const customPreviewScale = generateTailwindScale(validCustomHex);
  const customContrastWithWhite = getContrastRatio(customPreviewScale['600'], '#ffffff');
  const needsDarkAdjustment = getContrastRatio(validCustomHex, '#ffffff') < 4.1;

  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-800/85 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
              Tampilan &amp; Warna Aksen Akun
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sesuaikan warna aksen utama aplikasi untuk akun Anda · Tersinkron otomatis lintas perangkat
            </p>
          </div>
        </div>

        {/* Active theme indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
            style={{ backgroundColor: effectiveThemeColors.primaryHex }}
          />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
            {effectiveThemeColors.label}
          </span>
        </div>
      </div>

      {/* Save notice */}
      {savedNotice && (
        <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Case 1: Locked by Admin */}
      {isLockedByAdmin ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Kunci Warna Lembaga Sedang Aktif
              </p>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Admin lembaga menerapkan kebijakan penyeragaman tampilan sehingga seluruh akun mengikuti warna resmi <strong>{institutionName}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center -space-x-1.5">
                <span
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 shadow-xs"
                  style={{ backgroundColor: instPrimary }}
                  title={`Aksen Utama: ${instPrimary}`}
                />
                <span
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 shadow-xs"
                  style={{ backgroundColor: instSecondary }}
                  title={`Aksen Pendamping: ${instSecondary}`}
                />
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px]">
                  {effectiveThemeColors.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">{instPrimary}</span>
              </div>
            </div>

            {currentMode !== 'institution' && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                Preferensi pribadi Anda tetap tersimpan
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Case 2: User Customization Unlocked */
        <div className="space-y-4">
          {/* Mode selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSelectInstitution}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                selectedTab === 'institution'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs"
                style={{ backgroundColor: instPrimary }}
              >
                <Building2 className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                  Ikuti Lembaga
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  Bawaan {institutionName}
                </span>
              </div>
              {currentMode === 'institution' && (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
              )}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => setSelectedTab('preset')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                selectedTab === 'preset'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                  Palet Pilihan
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  {APP_THEME_PRESETS.length} tema siap pakai
                </span>
              </div>
              {currentMode === 'preset' && (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
              )}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => setSelectedTab('custom')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                selectedTab === 'custom'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                  Warna Bebas
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  Pilih kode Hex sendiri
                </span>
              </div>
              {currentMode === 'custom' && (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
              )}
            </button>
          </div>

          {/* Panel A: Institution Info */}
          {selectedTab === 'institution' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-1.5 shrink-0">
                  <span
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-xs"
                    style={{ backgroundColor: instPrimary }}
                  />
                  <span
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-xs"
                    style={{ backgroundColor: instSecondary }}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Mengikuti Warna Lembaga ({institutionName})
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Jika Admin memperbarui tema lembaga atau logo yayasan, tampilan akun Anda ikut menyesuaikan otomatis.
                  </p>
                </div>
              </div>
              {currentMode !== 'institution' && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSelectInstitution}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Gunakan Warna Lembaga
                </button>
              )}
            </div>
          )}

          {/* Panel B: Presets Grid */}
          {selectedTab === 'preset' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {APP_THEME_PRESETS.map((preset) => {
                const isSelected =
                  currentMode === 'preset' && activeUserColorTheme?.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSelectPreset(preset.id, preset.primaryHex, preset.secondaryHex)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl shrink-0 shadow-xs flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${preset.primaryHex}, ${preset.secondaryHex})`
                      }}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        {preset.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Panel C: Custom Hex Picker */}
          {selectedTab === 'custom' && (
            <form
              onSubmit={handleSaveCustom}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Pilih Warna
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={validCustomHex}
                      onChange={(e) => setCustomHexInput(e.target.value)}
                      className="w-11 h-10 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                      aria-label="Pemilih warna aksen pribadi"
                    />
                    <input
                      type="text"
                      value={customHexInput}
                      onChange={(e) => setCustomHexInput(e.target.value)}
                      placeholder="#059669"
                      maxLength={7}
                      className="w-28 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white uppercase"
                    />
                  </div>
                </div>

                {/* Live Mini Preview */}
                <div className="flex-1 space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Pratinjau Aksen Tombol &amp; Lencana
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: customPreviewScale['600'] }}
                    >
                      Tombol Utama
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                      style={{
                        backgroundColor: customPreviewScale['50'],
                        color: customPreviewScale['700'],
                        borderColor: customPreviewScale['200']
                      }}
                    >
                      Lencana Aksen
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Kontras {customContrastWithWhite.toFixed(1)}:1
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !isValidHex(customHexInput)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Terapkan Warna Kustom'}</span>
                </button>
              </div>

              {needsDarkAdjustment && isValidHex(customHexInput) && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Catatan keterbacaan: warna pilihan Anda sangat cerah, sehingga sistem otomatis menyesuaikan kepekatan tombol utama menjadi <span className="font-mono font-bold">{customPreviewScale['600']}</span> agar teks putih tetap jelas terbaca.
                </p>
              )}

              {!isValidHex(customHexInput) && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  Masukkan kode warna Hex yang valid (contoh: #059669 atau #1d4ed8).
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};
