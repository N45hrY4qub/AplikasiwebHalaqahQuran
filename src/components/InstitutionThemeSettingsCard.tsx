/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Lock,
  Unlock,
  RefreshCw,
  Check,
  CheckCircle2,
  RotateCcw,
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  APP_THEME_PRESETS,
  DEFAULT_INSTITUTION_THEME,
  DEFAULT_PRIMARY_HEX,
  DEFAULT_SECONDARY_HEX,
  InstitutionThemeSettings,
  extractDominantColorsFromImage,
  deriveHarmoniousSecondaryHex,
  generateTailwindScale,
  getContrastRatio,
  isValidHex,
  normalizeHex
} from '../utils/themeColorEngine';

export const InstitutionThemeSettingsCard: React.FC = () => {
  const {
    strukturLembaga,
    pwaSettings,
    institutionTheme,
    saveInstitutionTheme
  } = useApp();

  const yayasanLogo = (strukturLembaga?.yayasan?.logo || '').trim();
  const pwaIcon = (pwaSettings?.appIcon || '').trim();

  const [logoSourceType, setLogoSourceType] = useState<'yayasan' | 'pwa'>(() =>
    yayasanLogo ? 'yayasan' : pwaIcon ? 'pwa' : 'yayasan'
  );

  const activeLogoSrc =
    logoSourceType === 'pwa' && pwaIcon
      ? pwaIcon
      : yayasanLogo || pwaIcon || '';

  const [themeForm, setThemeForm] = useState<InstitutionThemeSettings>(() => ({
    ...DEFAULT_INSTITUTION_THEME,
    ...(institutionTheme || {}),
  }));
  const [customThemeHex, setCustomThemeHex] = useState<string>(
    normalizeHex(institutionTheme?.primaryHex, DEFAULT_PRIMARY_HEX)
  );
  const [extractedLogoColors, setExtractedLogoColors] = useState<string[]>(
    institutionTheme?.extractedLogoColors || []
  );
  const [isExtractingLogoColors, setIsExtractingLogoColors] = useState<boolean>(false);
  const [logoExtractError, setLogoExtractError] = useState<string | null>(null);
  const [isSavingTheme, setIsSavingTheme] = useState<boolean>(false);
  const [themeSaveMsg, setThemeSaveMsg] = useState<string | null>(null);
  const [themeErrorMsg, setThemeErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (yayasanLogo && logoSourceType !== 'yayasan' && !pwaIcon) {
      setLogoSourceType('yayasan');
    }
  }, [yayasanLogo, pwaIcon, logoSourceType]);

  useEffect(() => {
    if (institutionTheme) {
      setThemeForm({
        ...DEFAULT_INSTITUTION_THEME,
        ...institutionTheme,
      });
      setCustomThemeHex(normalizeHex(institutionTheme.primaryHex, DEFAULT_PRIMARY_HEX));
      if (institutionTheme.extractedLogoColors && institutionTheme.extractedLogoColors.length > 0) {
        setExtractedLogoColors(institutionTheme.extractedLogoColors);
      }
    }
  }, [institutionTheme]);

  // Extract dominant brand colors automatically when the active logo source changes
  useEffect(() => {
    let cancelled = false;
    if (!activeLogoSrc) {
      setExtractedLogoColors([]);
      setLogoExtractError(null);
      return;
    }

    setIsExtractingLogoColors(true);
    setLogoExtractError(null);

    extractDominantColorsFromImage(activeLogoSrc, 5).then(({ colors, error }) => {
      if (cancelled) return;
      setIsExtractingLogoColors(false);
      setLogoExtractError(error || null);
      if (colors.length > 0) {
        setExtractedLogoColors(colors);
        setThemeForm((prev) => ({
          ...prev,
          extractedLogoColors: colors,
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeLogoSrc]);

  const handleReExtractLogoColors = async () => {
    if (!activeLogoSrc) return;
    setIsExtractingLogoColors(true);
    setLogoExtractError(null);
    const { colors, error } = await extractDominantColorsFromImage(activeLogoSrc, 5);
    setIsExtractingLogoColors(false);
    setLogoExtractError(error || null);
    if (colors.length > 0) {
      setExtractedLogoColors(colors);
      setThemeForm((prev) => ({
        ...prev,
        extractedLogoColors: colors,
      }));
    }
  };

  const buildThemePayload = (): InstitutionThemeSettings => {
    const primary =
      themeForm.mode === 'default'
        ? DEFAULT_PRIMARY_HEX
        : themeForm.mode === 'custom' && isValidHex(customThemeHex)
        ? normalizeHex(customThemeHex)
        : normalizeHex(themeForm.primaryHex, DEFAULT_PRIMARY_HEX);

    const secondary =
      themeForm.mode === 'default'
        ? DEFAULT_SECONDARY_HEX
        : themeForm.mode === 'preset' && themeForm.secondaryHex
        ? normalizeHex(themeForm.secondaryHex)
        : deriveHarmoniousSecondaryHex(primary);

    return {
      ...themeForm,
      id: 'theme_settings',
      primaryHex: primary,
      secondaryHex: secondary,
      extractedLogoColors,
    };
  };

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    setThemeSaveMsg(null);
    setThemeErrorMsg(null);
    try {
      const payload = buildThemePayload();
      await saveInstitutionTheme(payload);
      setThemeForm(payload);
      setThemeSaveMsg(
        payload.lockInstitutionTheme
          ? 'Tema & warna lembaga disimpan dan dikunci untuk seluruh akun!'
          : 'Tema & warna identitas aplikasi berhasil disimpan dan disinkronkan!'
      );
      setTimeout(() => setThemeSaveMsg(null), 4500);
    } catch (err) {
      console.error('Gagal menyimpan pengaturan warna lembaga:', err);
      setThemeErrorMsg('Gagal menyimpan pengaturan warna lembaga. Silakan coba lagi.');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const previewPrimary =
    themeForm.mode === 'default'
      ? DEFAULT_PRIMARY_HEX
      : themeForm.mode === 'custom' && isValidHex(customThemeHex)
      ? normalizeHex(customThemeHex)
      : normalizeHex(themeForm.primaryHex, DEFAULT_PRIMARY_HEX);

  const previewSecondary =
    themeForm.mode === 'default'
      ? DEFAULT_SECONDARY_HEX
      : themeForm.mode === 'preset' && themeForm.secondaryHex
      ? normalizeHex(themeForm.secondaryHex)
      : deriveHarmoniousSecondaryHex(previewPrimary);

  const previewScale = generateTailwindScale(previewPrimary);
  const previewContrast = getContrastRatio(previewScale['600'], '#ffffff');
  const institutionName =
    strukturLembaga?.yayasan?.nama ||
    strukturLembaga?.yayasan?.singkatan ||
    'Lembaga';

  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/35 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">
              Tema &amp; Warna Identitas Aplikasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sesuaikan warna aksen utama aplikasi dari palet Logo Yayasan ({institutionName}), pilihan preset, atau warna bebas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
          <span
            className="w-4 h-4 rounded-md border border-black/10 shrink-0"
            style={{ backgroundColor: previewScale['600'] }}
          />
          <span className="font-bold uppercase">{previewScale['600']}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
            {themeForm.lockInstitutionTheme ? 'Terkunci' : 'Bebas per Akun'}
          </span>
        </div>
      </div>

      {/* Feedback Notifications */}
      {themeSaveMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{themeSaveMsg}</span>
        </div>
      )}

      {themeErrorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 px-4 py-3 rounded-xl text-xs font-semibold">
          {themeErrorMsg}
        </div>
      )}

      {/* Source Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          {
            id: 'default' as const,
            title: 'Standar Aplikasi',
            desc: 'Zamrud klasik bawaan',
            color: DEFAULT_PRIMARY_HEX,
          },
          {
            id: 'logo' as const,
            title: 'Warna Logo',
            desc:
              extractedLogoColors.length > 0
                ? `${extractedLogoColors.length} warna terdeteksi`
                : 'Ekstrak dari logo lembaga',
            color: extractedLogoColors[0] || previewPrimary,
          },
          {
            id: 'preset' as const,
            title: 'Palet Pilihan',
            desc: `${APP_THEME_PRESETS.length} tema siap pakai`,
            color:
              APP_THEME_PRESETS.find((p) => p.id === themeForm.presetId)?.primaryHex ||
              APP_THEME_PRESETS[3].primaryHex,
          },
          {
            id: 'custom' as const,
            title: 'Warna Kustom',
            desc: 'Pilih kode Hex bebas',
            color: isValidHex(customThemeHex) ? normalizeHex(customThemeHex) : previewPrimary,
          },
        ].map((opt) => {
          const active = themeForm.mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (opt.id === 'default') {
                  setThemeForm((prev) => ({
                    ...prev,
                    mode: 'default',
                    primaryHex: DEFAULT_PRIMARY_HEX,
                    secondaryHex: DEFAULT_SECONDARY_HEX,
                    presetId: 'emerald',
                  }));
                } else if (opt.id === 'logo') {
                  const picked = extractedLogoColors[0] || previewPrimary;
                  setThemeForm((prev) => ({
                    ...prev,
                    mode: 'logo',
                    primaryHex: picked,
                    secondaryHex: deriveHarmoniousSecondaryHex(picked),
                  }));
                } else if (opt.id === 'preset') {
                  const preset =
                    APP_THEME_PRESETS.find((p) => p.id === themeForm.presetId) ||
                    APP_THEME_PRESETS[0];
                  setThemeForm((prev) => ({
                    ...prev,
                    mode: 'preset',
                    presetId: preset.id,
                    primaryHex: preset.primaryHex,
                    secondaryHex: preset.secondaryHex,
                  }));
                } else {
                  setThemeForm((prev) => ({
                    ...prev,
                    mode: 'custom',
                    primaryHex: isValidHex(customThemeHex)
                      ? normalizeHex(customThemeHex)
                      : prev.primaryHex,
                  }));
                }
              }}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 min-h-[56px] ${
                active
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span
                className="w-7 h-7 rounded-lg shrink-0 border border-black/10 shadow-xs"
                style={{ backgroundColor: opt.color }}
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  {opt.title}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {opt.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel: Warna Logo Yayasan */}
      {themeForm.mode === 'logo' && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {activeLogoSrc ? (
                <img
                  src={activeLogoSrc}
                  alt="Logo Sumber Warna"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  Palet Dominan dari {logoSourceType === 'pwa' && pwaIcon ? 'Ikon Aplikasi (PWA)' : 'Logo Yayasan'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Klik salah satu warna hasil pembacaan otomatis dari logo yang terpasang di menu Lembaga.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {yayasanLogo && pwaIcon && yayasanLogo !== pwaIcon && (
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLogoSourceType('yayasan')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      logoSourceType === 'yayasan'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Logo Lembaga
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoSourceType('pwa')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      logoSourceType === 'pwa'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Ikon PWA
                  </button>
                </div>
              )}

              {activeLogoSrc && (
                <button
                  type="button"
                  disabled={isExtractingLogoColors}
                  onClick={handleReExtractLogoColors}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isExtractingLogoColors ? 'animate-spin' : ''}`} />
                  <span>Deteksi Ulang</span>
                </button>
              )}
            </div>
          </div>

          {!activeLogoSrc ? (
            <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Logo yayasan belum diunggah. Silakan unggah logo di menu <strong>Lembaga &gt; Identitas Lembaga</strong>, atau pilih <strong>Palet Pilihan</strong> / <strong>Warna Kustom</strong>.
              </span>
            </div>
          ) : isExtractingLogoColors ? (
            <p className="text-xs text-slate-500">Menganalisis komposisi warna logo...</p>
          ) : logoExtractError ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-lg">
              {logoExtractError}
            </p>
          ) : extractedLogoColors.length === 0 ? (
            <p className="text-xs text-slate-500">
              Tidak ditemukan warna non-netral dominan pada logo. Anda dapat memilih Palet Pilihan atau Warna Kustom.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              {extractedLogoColors.map((hex, index) => {
                const selected = normalizeHex(themeForm.primaryHex) === normalizeHex(hex);
                return (
                  <button
                    key={`${hex}-${index}`}
                    type="button"
                    onClick={() =>
                      setThemeForm((prev) => ({
                        ...prev,
                        mode: 'logo',
                        primaryHex: hex,
                        secondaryHex: deriveHarmoniousSecondaryHex(hex),
                      }))
                    }
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition cursor-pointer min-h-[42px] ${
                      selected
                        ? 'bg-white dark:bg-slate-950 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-lg border border-black/10 flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: hex }}
                    >
                      {selected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200 uppercase">
                      {hex}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Panel: Preset Palettes */}
      {themeForm.mode === 'preset' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          {APP_THEME_PRESETS.map((preset) => {
            const selected = themeForm.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  setThemeForm((prev) => ({
                    ...prev,
                    mode: 'preset',
                    presetId: preset.id,
                    primaryHex: preset.primaryHex,
                    secondaryHex: preset.secondaryHex,
                  }))
                }
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  selected
                    ? 'bg-white dark:bg-slate-950 border-emerald-500 ring-1 ring-emerald-500/40 shadow-xs'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span
                  className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white shadow-xs"
                  style={{
                    background: `linear-gradient(135deg, ${preset.primaryHex}, ${preset.secondaryHex})`,
                  }}
                >
                  {selected && <Check className="h-4 w-4 stroke-[2.5]" />}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                    {preset.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    {preset.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Panel: Custom Color */}
      {themeForm.mode === 'custom' && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={isValidHex(customThemeHex) ? normalizeHex(customThemeHex) : DEFAULT_PRIMARY_HEX}
              onChange={(e) => {
                const hex = normalizeHex(e.target.value);
                setCustomThemeHex(hex);
                setThemeForm((prev) => ({
                  ...prev,
                  mode: 'custom',
                  primaryHex: hex,
                  secondaryHex: deriveHarmoniousSecondaryHex(hex),
                }));
              }}
              className="w-11 h-10 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 cursor-pointer"
              aria-label="Pemilih warna kustom lembaga"
            />
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">
                Kode Warna Hex
              </label>
              <input
                type="text"
                maxLength={7}
                value={customThemeHex}
                onChange={(e) => {
                  const raw = e.target.value;
                  setCustomThemeHex(raw);
                  if (isValidHex(raw)) {
                    const hex = normalizeHex(raw);
                    setThemeForm((prev) => ({
                      ...prev,
                      mode: 'custom',
                      primaryHex: hex,
                      secondaryHex: deriveHarmoniousSecondaryHex(hex),
                    }));
                  }
                }}
                placeholder="#059669"
                className="mt-0.5 w-28 px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums font-bold uppercase text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Skala gradasi aksen terang hingga gelap dan kontras teks putih disesuaikan otomatis untuk kenyamanan baca.
          </p>
        </div>
      )}

      {/* Policy Toggle: Kunci Warna Lembaga */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 border ${
              themeForm.lockInstitutionTheme
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            {themeForm.lockInstitutionTheme ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
              Kunci Warna Lembaga
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
              {themeForm.lockInstitutionTheme
                ? 'Aktif: Seluruh akun Admin, Guru, dan Santri wajib menggunakan warna aksen lembaga ini (opsi ubah warna di profil dikunci).'
                : 'Nonaktif: Warna lembaga menjadi warna bawaan, namun setiap akun tetap dapat memilih warna kesukaan di halaman Profil.'}
            </span>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={themeForm.lockInstitutionTheme}
          onClick={() =>
            setThemeForm((prev) => ({
              ...prev,
              lockInstitutionTheme: !prev.lockInstitutionTheme,
            }))
          }
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            themeForm.lockInstitutionTheme
              ? 'bg-emerald-600'
              : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
              themeForm.lockInstitutionTheme ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Preview & Action Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Pratinjau:
          </span>
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs whitespace-nowrap"
            style={{
              background: `linear-gradient(135deg, ${previewScale['600']}, ${previewSecondary})`,
            }}
          >
            Tombol Aksen
          </span>
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap"
            style={{
              backgroundColor: previewScale['50'],
              color: previewScale['700'],
              borderColor: previewScale['200'],
            }}
          >
            Menu Aktif
          </span>
          <span className="text-[11px] font-mono tabular-nums text-slate-400">
            Kontras {previewContrast.toFixed(1)}:1
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {themeForm.mode !== 'default' && (
            <button
              type="button"
              onClick={() => {
                setThemeForm((prev) => ({
                  ...prev,
                  mode: 'default',
                  primaryHex: DEFAULT_PRIMARY_HEX,
                  secondaryHex: DEFAULT_SECONDARY_HEX,
                  presetId: 'emerald',
                }));
                setCustomThemeHex(DEFAULT_PRIMARY_HEX);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Standar</span>
            </button>
          )}
          <button
            type="button"
            disabled={isSavingTheme}
            onClick={handleSaveTheme}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Check className="h-4 w-4" />
            <span>{isSavingTheme ? 'Menyimpan...' : 'Simpan Pengaturan Warna'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
