import { HijriCalendarSetting, DEFAULT_HIJRI_SETTING } from '../types';

export const HIJRI_MONTH_NAMES = [
  'Muharram',
  'Safar',
  "Rabi'ul Awwal",
  "Rabi'ul Akhir",
  'Jumadil Ula',
  'Jumadil Akhir',
  'Rajab',
  "Sya'ban",
  'Ramadhan',
  'Syawwal',
  "Dzulqa'dah",
  'Dzulhijjah'
];

/**
 * Robust calculation of Hijri date numbers (day, month 1-12, year)
 * Avoids browser-specific ICU locale bugs on Android where months fall back to Gregorian (e.g. "April")
 */
export function getHijriDateNumbers(date: Date): { day: number; month: number; year: number } {
  // 1. Try Umm al-Qura with numeric components (locale en-u-ca-islamic-umalqura-nu-latn)
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '', 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && year >= 1400 && year <= 1600) {
      return { day, month, year };
    }
  } catch {}

  // 2. Try standard Islamic calendar
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '', 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && year >= 1400 && year <= 1600) {
      return { day, month, year };
    }
  } catch {}

  // 3. Fallback to astronomical Kuwaiti calculation
  return calculateKuwaitiHijri(date);
}

/**
 * Astronomical Kuwaiti Algorithm fallback for Hijri date calculation
 */
function calculateKuwaitiHijri(date: Date): { day: number; month: number; year: number } {
  let day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();
  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }
  let a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  if (y < 1583) b = 0;
  if (y === 1582) {
    if (m > 10) b = -10;
    if (m === 10) {
      b = 0;
      if (day > 4) b = -10;
    }
  }
  let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  b = 0;
  if (jd > 2299160) {
    a = Math.floor((jd - 1867216.25) / 36524.25);
    b = jd + 1 + a - Math.floor(a / 4);
  } else {
    b = jd;
  }
  let bb = b + 1524;
  let cc = Math.floor((bb - 122.1) / 365.25);
  let dd = Math.floor(365.25 * cc);
  let ee = Math.floor((bb - dd) / 30.6001);
  day = (bb - dd) - Math.floor(30.6001 * ee);
  month = ee - 1;
  if (ee > 13) {
    cc += 1;
    month = ee - 13;
  }
  year = cc - 4716;

  let iyear = 10631 / 30;
  let epochastro = 1948084;
  let shift1 = 8.01 / 60;

  let z = jd - epochastro;
  let cyc = Math.floor(z / 10631);
  z = z - 10631 * cyc;
  let j = Math.floor((z - shift1) / iyear);
  let iy = 30 * cyc + j;
  z = z - Math.floor(j * iyear + shift1);
  let im = Math.floor((z + 28.5001) / 29.5);
  if (im === 13) im = 12;
  let id = z - Math.floor(29.5001 * im - 29);

  return { 
    day: Math.max(1, Math.min(30, id)), 
    month: Math.max(1, Math.min(12, im)), 
    year: iy 
  };
}

/**
 * Format date to Indonesian Hijri / Islamic calendar string with custom setting/offset
 */
export const formatHijriDate = (setting?: HijriCalendarSetting | null): string => {
  const currentSetting = setting || DEFAULT_HIJRI_SETTING;

  if (currentSetting.mode === 'manual' && currentSetting.customText && currentSetting.customText.trim()) {
    return currentSetting.customText.trim();
  }

  const offset = currentSetting.dayOffset || 0;
  const targetDate = new Date();
  if (offset !== 0) {
    targetDate.setDate(targetDate.getDate() + offset);
  }

  const { day, month, year } = getHijriDateNumbers(targetDate);
  const monthName = HIJRI_MONTH_NAMES[month - 1] || "Rabi'ul Akhir";

  return `${day} ${monthName} ${year} H`;
};

/**
 * Get preview details for a specific day offset
 */
export const getOffsetPreview = (offsetDays: number): { formatted: string; gregorianDate: string } => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + offsetDays);

  const masehiFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const { day, month, year } = getHijriDateNumbers(targetDate);
  const monthName = HIJRI_MONTH_NAMES[month - 1] || "Rabi'ul Akhir";
  const formatted = `${day} ${monthName} ${year} H`;

  return {
    formatted,
    gregorianDate: masehiFormatter.format(targetDate)
  };
};
