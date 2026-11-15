/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppThemePreset {
  id: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  description: string;
}

export interface InstitutionThemeSettings {
  id: 'theme_settings';
  mode: 'default' | 'logo' | 'preset' | 'custom';
  primaryHex: string;
  secondaryHex?: string;
  presetId?: string;
  extractedLogoColors?: string[];
  lockInstitutionTheme: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserColorThemePreference {
  mode: 'institution' | 'preset' | 'custom';
  primaryHex?: string;
  secondaryHex?: string;
  presetId?: string;
  updatedAt?: string;
}

export const DEFAULT_PRIMARY_HEX = '#059669'; // Emerald 600
export const DEFAULT_SECONDARY_HEX = '#0d9488'; // Teal 600

export const DEFAULT_INSTITUTION_THEME: InstitutionThemeSettings = {
  id: 'theme_settings',
  mode: 'default',
  primaryHex: DEFAULT_PRIMARY_HEX,
  secondaryHex: DEFAULT_SECONDARY_HEX,
  presetId: 'emerald',
  extractedLogoColors: [],
  lockInstitutionTheme: false,
};

export const DEFAULT_USER_COLOR_THEME: UserColorThemePreference = {
  mode: 'institution',
};

export const APP_THEME_PRESETS: AppThemePreset[] = [
  {
    id: 'emerald',
    name: 'Zamrud Klasik',
    primaryHex: '#059669',
    secondaryHex: '#0d9488',
    description: 'Warna standar aplikasi yang sejuk dan menenangkan',
  },
  {
    id: 'nabawi',
    name: 'Hijau Nabawi',
    primaryHex: '#15803d',
    secondaryHex: '#047857',
    description: 'Nuansa hijau tua klasik bernuansa pesantren',
  },
  {
    id: 'ocean',
    name: 'Teal Samudra',
    primaryHex: '#0d9488',
    secondaryHex: '#0891b2',
    description: 'Biru kehijauan modern yang segar dan profesional',
  },
  {
    id: 'sapphire',
    name: 'Biru Safir',
    primaryHex: '#2563eb',
    secondaryHex: '#0284c7',
    description: 'Biru akademis yang bersih dan terpercaya',
  },
  {
    id: 'indigo',
    name: 'Indigo Modern',
    primaryHex: '#4f46e5',
    secondaryHex: '#6366f1',
    description: 'Biru keunguan tegas untuk tampilan kontemporer',
  },
  {
    id: 'royal',
    name: 'Ungu Royal',
    primaryHex: '#7c3aed',
    secondaryHex: '#9333ea',
    description: 'Aksen ungu elegan berkarakter kuat',
  },
  {
    id: 'amber',
    name: 'Emas Klasik',
    primaryHex: '#d97706',
    secondaryHex: '#b45309',
    description: 'Nuansa emas hangat penuh kewibawaan',
  },
  {
    id: 'maroon',
    name: 'Marun Elegan',
    primaryHex: '#be123c',
    secondaryHex: '#9f1239',
    description: 'Merah marun tegas yang berkelas',
  },
  {
    id: 'slate',
    name: 'Slate Profesional',
    primaryHex: '#334155',
    secondaryHex: '#475569',
    description: 'Abu-abu gelap minimalis yang netral',
  },
];

export function normalizeHex(input?: string, fallback: string = DEFAULT_PRIMARY_HEX): string {
  if (!input) return fallback;
  let hex = input.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  return fallback;
}

export function isValidHex(input?: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = normalizeHex(hex).slice(1);
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: s * 100,
    l: l * 100,
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hn = ((h % 360) + 360) % 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hn < 60) {
    r = c;
    g = x;
  } else if (hn < 120) {
    r = x;
    g = c;
  } else if (hn < 180) {
    g = c;
    b = x;
  } else if (hn < 240) {
    g = x;
    b = c;
  } else if (hn < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Ensures a color is dark enough for crisp white text on primary buttons (level 600),
 * while preserving the original hue and saturation as closely as possible.
 */
export function ensureButtonContrastHex(hex: string, minContrast = 3.9): string {
  const normalized = normalizeHex(hex);
  const { r, g, b } = hexToRgb(normalized);
  const { h, s, l } = rgbToHsl(r, g, b);

  let currentL = Math.min(l, 52);
  let candidate = hslToHex(h, s, currentL);

  let guard = 0;
  while (getContrastRatio(candidate, '#ffffff') < minContrast && currentL > 18 && guard < 40) {
    currentL -= 1.5;
    candidate = hslToHex(h, Math.min(100, s * 1.02), currentL);
    guard++;
  }
  return candidate;
}

export type TailwindShadeScale = Record<
  '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950',
  string
>;

/**
 * Generates a full Tailwind 50–950 shade scale from a single hex color.
 * Keeps `600` accessible for white button labels and `400` bright for dark mode text.
 */
export function generateTailwindScale(baseHex: string): TailwindShadeScale {
  const safe600 = ensureButtonContrastHex(baseHex, 4.1);
  const { r, g, b } = hexToRgb(safe600);
  const { h, s, l: l600 } = rgbToHsl(r, g, b);

  // Neutral / low-saturation colors shouldn't be artificially oversaturated
  const isNeutral = s < 15;
  const sat = (multiplier: number, max = 96) =>
    isNeutral ? Math.min(s * multiplier, 25) : Math.max(12, Math.min(max, s * multiplier));

  const shade400L = Math.max(58, Math.min(68, l600 + 22));
  const shade500L = Math.max(44, Math.min(54, l600 + 9));
  const shade700L = Math.max(22, l600 - 8);
  const shade800L = Math.max(16, l600 - 15);
  const shade900L = Math.max(11, l600 - 21);
  const shade950L = Math.max(7, l600 - 27);

  return {
    '50': hslToHex(h, sat(0.85, 85), 96),
    '100': hslToHex(h, sat(0.88, 88), 91),
    '200': hslToHex(h, sat(0.9, 90), 82),
    '300': hslToHex(h, sat(0.92, 92), 71),
    '400': hslToHex(h, sat(0.95, 95), shade400L),
    '500': hslToHex(h, sat(0.98, 96), shade500L),
    '600': safe600,
    '700': hslToHex(h, sat(1.0, 96), shade700L),
    '800': hslToHex(h, sat(0.95, 92), shade800L),
    '900': hslToHex(h, sat(0.9, 88), shade900L),
    '950': hslToHex(h, sat(0.85, 85), shade950L),
  };
}

/**
 * Derives an analogous secondary accent (used for gradient companion `--color-teal-*`).
 */
export function deriveHarmoniousSecondaryHex(primaryHex: string): string {
  const norm = normalizeHex(primaryHex);
  if (norm === DEFAULT_PRIMARY_HEX) return DEFAULT_SECONDARY_HEX;
  const { r, g, b } = hexToRgb(norm);
  const { h, s, l } = rgbToHsl(r, g, b);
  const shiftedHue = (h + 18) % 360;
  return ensureButtonContrastHex(hslToHex(shiftedHue, s, Math.max(30, Math.min(48, l))), 3.8);
}

const SHADE_KEYS: Array<keyof TailwindShadeScale> = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
];

/**
 * Applies the active theme colors globally to Tailwind v4 CSS variables on <html>.
 */
export function applyThemeColorsToDocument(primaryHex?: string, secondaryHex?: string): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const normPrimary = normalizeHex(primaryHex, DEFAULT_PRIMARY_HEX);
  const normSecondary = secondaryHex ? normalizeHex(secondaryHex, DEFAULT_SECONDARY_HEX) : '';

  const isDefault =
    normPrimary === DEFAULT_PRIMARY_HEX &&
    (!normSecondary || normSecondary === DEFAULT_SECONDARY_HEX);

  if (isDefault) {
    SHADE_KEYS.forEach((shade) => {
      root.style.removeProperty(`--color-emerald-${shade}`);
      root.style.removeProperty(`--color-teal-${shade}`);
    });
    root.style.removeProperty('--mh-accent-primary');
    root.style.removeProperty('--mh-accent-secondary');
    return;
  }

  const emeraldScale = generateTailwindScale(normPrimary);
  const companionHex = normSecondary || deriveHarmoniousSecondaryHex(normPrimary);
  const tealScale = generateTailwindScale(companionHex);

  SHADE_KEYS.forEach((shade) => {
    root.style.setProperty(`--color-emerald-${shade}`, emeraldScale[shade]);
    root.style.setProperty(`--color-teal-${shade}`, tealScale[shade]);
  });
  root.style.setProperty('--mh-accent-primary', emeraldScale['600']);
  root.style.setProperty('--mh-accent-secondary', tealScale['600']);
}

/**
 * Resolves which color theme should actually be active for the current user,
 * respecting Admin's "Kunci Warna Lembaga" policy.
 */
export function resolveEffectiveThemeColors(
  institutionTheme?: InstitutionThemeSettings | null,
  userColorTheme?: UserColorThemePreference | null
): {
  primaryHex: string;
  secondaryHex: string;
  source: 'institution_locked' | 'institution_default' | 'user_preset' | 'user_custom';
  label: string;
} {
  const inst = institutionTheme || DEFAULT_INSTITUTION_THEME;
  const instPrimary = normalizeHex(inst.primaryHex, DEFAULT_PRIMARY_HEX);
  const instSecondary = inst.secondaryHex
    ? normalizeHex(inst.secondaryHex, DEFAULT_SECONDARY_HEX)
    : deriveHarmoniousSecondaryHex(instPrimary);

  const instPresetName =
    inst.mode === 'logo'
      ? 'Warna Logo Lembaga'
      : inst.mode === 'preset'
      ? APP_THEME_PRESETS.find((p) => p.id === inst.presetId)?.name || 'Tema Lembaga'
      : inst.mode === 'custom'
      ? 'Warna Kustom Lembaga'
      : 'Zamrud Klasik (Standar)';

  if (inst.lockInstitutionTheme) {
    return {
      primaryHex: instPrimary,
      secondaryHex: instSecondary,
      source: 'institution_locked',
      label: instPresetName,
    };
  }

  if (userColorTheme && userColorTheme.mode === 'preset' && userColorTheme.presetId) {
    const preset = APP_THEME_PRESETS.find((p) => p.id === userColorTheme.presetId);
    if (preset) {
      return {
        primaryHex: preset.primaryHex,
        secondaryHex: preset.secondaryHex,
        source: 'user_preset',
        label: preset.name,
      };
    }
  }

  if (userColorTheme && userColorTheme.mode === 'custom' && isValidHex(userColorTheme.primaryHex)) {
    const pHex = normalizeHex(userColorTheme.primaryHex, instPrimary);
    const sHex = userColorTheme.secondaryHex
      ? normalizeHex(userColorTheme.secondaryHex, deriveHarmoniousSecondaryHex(pHex))
      : deriveHarmoniousSecondaryHex(pHex);
    return {
      primaryHex: pHex,
      secondaryHex: sHex,
      source: 'user_custom',
      label: 'Warna Pribadi Kustom',
    };
  }

  return {
    primaryHex: instPrimary,
    secondaryHex: instSecondary,
    source: 'institution_default',
    label: instPresetName,
  };
}

/**
 * Extracts up to 5 distinct dominant colors from a logo image (Data URL or CORS-friendly URL).
 * Filters out transparent, near-white, near-black, and dull neutral background pixels.
 */
export async function extractDominantColorsFromImage(
  src: string,
  maxColors: number = 5
): Promise<{ colors: string[]; error?: string }> {
  if (!src || typeof window === 'undefined') {
    return { colors: [] };
  }

  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const size = 80;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve({ colors: [], error: 'Browser tidak mendukung pembacaan kanvas gambar.' });
          return;
        }

        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;

        interface Bucket {
          count: number;
          weight: number;
          rSum: number;
          gSum: number;
          bSum: number;
        }

        const vibrantBuckets = new Map<string, Bucket>();
        const fallbackBuckets = new Map<string, Bucket>();

        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 130) continue;

          // Ignore near-white backgrounds
          if (r > 238 && g > 238 && b > 238) continue;

          const { s, l } = rgbToHsl(r, g, b);
          // Ignore very dark near-black or very bright washed-out pixels for primary extraction
          if (l < 10 || l > 92) continue;

          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          if (s >= 18) {
            // Boost slightly more saturated brand pixels over dull borders
            const weight = 1 + (s / 100) * 1.6;
            const prev = vibrantBuckets.get(key) || { count: 0, weight: 0, rSum: 0, gSum: 0, bSum: 0 };
            vibrantBuckets.set(key, {
              count: prev.count + 1,
              weight: prev.weight + weight,
              rSum: prev.rSum + r,
              gSum: prev.gSum + g,
              bSum: prev.bSum + b,
            });
          } else if (l >= 14 && l <= 78) {
            const prev = fallbackBuckets.get(key) || { count: 0, weight: 0, rSum: 0, gSum: 0, bSum: 0 };
            fallbackBuckets.set(key, {
              count: prev.count + 1,
              weight: prev.weight + 1,
              rSum: prev.rSum + r,
              gSum: prev.gSum + g,
              bSum: prev.bSum + b,
            });
          }
        }

        const sourceBuckets = vibrantBuckets.size > 0 ? vibrantBuckets : fallbackBuckets;
        const sorted = Array.from(sourceBuckets.values())
          .map((bucket) => ({
            r: Math.round(bucket.rSum / bucket.count),
            g: Math.round(bucket.gSum / bucket.count),
            b: Math.round(bucket.bSum / bucket.count),
            weight: bucket.weight,
          }))
          .sort((a, b) => b.weight - a.weight);

        const picked: Array<{ r: number; g: number; b: number; hex: string }> = [];
        for (const item of sorted) {
          const isTooClose = picked.some((p) => {
            const dr = p.r - item.r;
            const dg = p.g - item.g;
            const db = p.b - item.b;
            return Math.sqrt(dr * dr + dg * dg + db * db) < 46;
          });
          if (!isTooClose) {
            picked.push({
              ...item,
              hex: rgbToHex(item.r, item.g, item.b),
            });
          }
          if (picked.length >= maxColors) break;
        }

        resolve({
          colors: picked.map((p) => p.hex),
        });
      } catch {
        resolve({
          colors: [],
          error:
            'Logo menggunakan tautan eksternal yang dibatasi izin server (CORS). Gunakan unggah file gambar atau pilih warna secara manual.',
        });
      }
    };

    img.onerror = () => {
      resolve({
        colors: [],
        error: 'Gagal memuat gambar logo untuk mendeteksi warna otomatis.',
      });
    };

    img.src = src;
  });
}
