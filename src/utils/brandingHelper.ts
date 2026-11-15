import type { PwaSettings, RekapPresensiPdfTemplate, StrukturLembaga } from '../types';

export const DEFAULT_INSTITUTION_NAME = 'Sistem Halaqah Al-Quran';
export const DEFAULT_INSTITUTION_ABBR = 'SHAQ';

export function isLegacyInstitutionBranding(val?: string | null): boolean {
  if (!val) return false;
  const lower = val.toLowerCase();
  return (
    lower.includes('yadin') ||
    lower.includes('ydin') ||
    lower.includes('imam nawawi') ||
    lower.includes('imam an-nawawi') ||
    lower.includes('imamnawawi') ||
    lower.includes('imamannawawi') ||
    lower.includes('binaummah') ||
    lower.includes('unisma')
  );
}

export function isLegacyPersonalData(val?: string | null): boolean {
  if (!val) return false;
  const lower = val.toLowerCase();
  return (
    lower.includes('yaqub') ||
    lower.includes('maunday') ||
    lower.includes('benyaqub') ||
    lower.includes('floresy') ||
    lower.includes('nasrul mustofa') ||
    lower.includes('kemal muhammad') ||
    lower.includes('raya gardu') ||
    lower.includes('ciapus') ||
    lower.includes('08528076') ||
    lower.includes('majelisimam')
  );
}

export function resolveInstitutionName(
  pwaAppName?: string | null,
  yayasanNama?: string | null
): string {
  const cleanPwa = (pwaAppName || '').trim();
  if (
    cleanPwa &&
    cleanPwa.toLowerCase() !== 'halaqah' &&
    !isLegacyInstitutionBranding(cleanPwa)
  ) {
    return cleanPwa;
  }
  const cleanYayasan = (yayasanNama || '').trim();
  if (cleanYayasan && !isLegacyInstitutionBranding(cleanYayasan)) {
    return cleanYayasan;
  }
  return DEFAULT_INSTITUTION_NAME;
}

export function resolveYayasanDisplayName(yayasanNama?: string | null): string {
  const clean = (yayasanNama || '').trim();
  if (clean && !isLegacyInstitutionBranding(clean)) {
    return clean;
  }
  return DEFAULT_INSTITUTION_NAME;
}

export function sanitizePwaSettings(
  raw?: Partial<PwaSettings> | null,
  yayasanNama?: string | null
): PwaSettings {
  const resolvedYayasan = resolveYayasanDisplayName(yayasanNama);
  const resolvedName = resolveInstitutionName(raw?.appName, yayasanNama);

  const rawBaYayasan = (raw?.baNamaYayasan || '').trim();
  const baNamaYayasan =
    rawBaYayasan && !isLegacyInstitutionBranding(rawBaYayasan)
      ? rawBaYayasan
      : resolvedYayasan.toUpperCase();

  const rawBaAlamat = (raw?.baAlamatKontak || '').trim();
  const baAlamatKontak =
    rawBaAlamat && !isLegacyPersonalData(rawBaAlamat) && !isLegacyInstitutionBranding(rawBaAlamat)
      ? rawBaAlamat
      : `Sekretariat ${resolvedYayasan}`;

  const rawTtd1 = (raw?.baTtd1Nama || '').trim();
  const baTtd1Nama =
    rawTtd1 && !isLegacyPersonalData(rawTtd1) ? rawTtd1 : 'Penguji Assessment';

  const rawTtd1Sub = (raw?.baTtd1Sub || '').trim();
  const baTtd1Sub =
    rawTtd1Sub && !isLegacyPersonalData(rawTtd1Sub) ? rawTtd1Sub : '';

  const rawTtd2 = (raw?.baTtd2Nama || '').trim();
  const baTtd2Nama =
    rawTtd2 && !isLegacyPersonalData(rawTtd2) ? rawTtd2 : 'Koordinator Bidang';

  return {
    id: raw?.id || 'pwa_settings',
    adminName: raw?.adminName || 'Aplikasi Admin',
    guruName: raw?.guruName || 'Aplikasi Guru',
    siswaName: raw?.siswaName || 'Aplikasi Siswa/Santri',
    appName: resolvedName,
    appIcon: raw?.appIcon || '',
    baNamaYayasan,
    baNamaPanitia: raw?.baNamaPanitia || 'PANITIA ASSESSMENT & EVALUASI AKADEMIK SANTRI',
    baAlamatKontak,
    baTtd1Jabatan: raw?.baTtd1Jabatan || 'PENGUJI',
    baTtd1Nama,
    baTtd1Sub,
    baTtd2Jabatan: raw?.baTtd2Jabatan || 'KOORDINATOR BIDANG',
    baTtd2Nama,
    baTtd2Sub: raw?.baTtd2Sub || ''
  };
}

export function sanitizeStrukturLembaga(raw: StrukturLembaga): StrukturLembaga {
  const y = raw.yayasan || ({} as any);
  const isLegacyY =
    isLegacyInstitutionBranding(y.nama) ||
    isLegacyInstitutionBranding(y.singkatan) ||
    isLegacyPersonalData(y.alamat) ||
    isLegacyPersonalData(y.email) ||
    isLegacyInstitutionBranding(y.website);

  return {
    ...raw,
    yayasan: {
      ...y,
      nama: isLegacyInstitutionBranding(y.nama) ? DEFAULT_INSTITUTION_NAME : (y.nama || DEFAULT_INSTITUTION_NAME),
      singkatan: isLegacyInstitutionBranding(y.singkatan) ? DEFAULT_INSTITUTION_ABBR : (y.singkatan || DEFAULT_INSTITUTION_ABBR),
      divisi: isLegacyY && isLegacyInstitutionBranding(y.divisi)
        ? 'Divisi Pendidikan & Pembinaan Al-Quran'
        : (y.divisi || 'Divisi Pendidikan & Pembinaan Al-Quran'),
      alamat: isLegacyPersonalData(y.alamat) || isLegacyInstitutionBranding(y.alamat)
        ? 'Sekretariat Lembaga Pusat'
        : (y.alamat || 'Sekretariat Lembaga Pusat'),
      email: isLegacyPersonalData(y.email) || isLegacyInstitutionBranding(y.email)
        ? 'info@halaqah.example'
        : (y.email || 'info@halaqah.example'),
      nomorTelepon: y.nomorTelepon === '0812-3456-7890' ? '0800-0000-0000' : (y.nomorTelepon || '0800-0000-0000'),
      website: isLegacyInstitutionBranding(y.website)
        ? 'https://halaqah.example'
        : (y.website || 'https://halaqah.example'),
    },
    direktoratList: (raw.direktoratList || []).map(d => ({
      ...d,
      namaDirektur: d.namaDirektur === 'KH. Abdurrahman Wahid' ? 'Direktur Pendidikan' : d.namaDirektur,
      email: isLegacyInstitutionBranding(d.email) ? 'direktorat@halaqah.example' : d.email,
      nomorHp: d.nomorHp === '081234567890' ? '0800-0000-0001' : d.nomorHp
    })),
    regionalList: (raw.regionalList || []).map(r => ({
      ...r,
      email: isLegacyInstitutionBranding(r.email) ? 'regional@halaqah.example' : r.email,
      nomorHp: r.nomorHp === '085678901234' ? '0800-0000-0002' : r.nomorHp
    })),
    sekolahList: (raw.sekolahList || []).map(s => ({
      ...s,
      namaPimpinan: s.namaPimpinan === 'Kiai Maimun Zubair' ? 'Kepala Unit Pendidikan' : s.namaPimpinan,
      email: isLegacyInstitutionBranding(s.email) ? 'unit@halaqah.example' : s.email,
      nomorHp: (s.nomorHp === '08111222333' || s.nomorHp === '081299998888') ? '0800-0000-0003' : s.nomorHp,
      alamat: (s.alamat?.includes('Tebuireng') || s.alamat?.includes('Wonosawahan')) ? 'Alamat Unit Lembaga' : s.alamat
    })),
    jenjangList: (raw.jenjangList || []).map(j => ({
      ...j,
      email: isLegacyInstitutionBranding(j.email) ? 'jenjang@halaqah.example' : j.email,
      nomorHp: (j.nomorHp === '08222333444' || j.nomorHp === '08333444555' || j.nomorHp === '081299998888') ? '0800-0000-0004' : j.nomorHp
    }))
  };
}

export function sanitizeRekapPresensiTemplate(
  raw: RekapPresensiPdfTemplate,
  yayasanNama?: string | null
): RekapPresensiPdfTemplate {
  const instUpper = resolveYayasanDisplayName(yayasanNama).toUpperCase();
  return {
    ...raw,
    headerBadgeText: isLegacyInstitutionBranding(raw.headerBadgeText)
      ? 'DIVISI PEMBINAAN AL-QURAN'
      : (raw.headerBadgeText || 'DIVISI PEMBINAAN AL-QURAN'),
    documentTitle: isLegacyInstitutionBranding(raw.documentTitle)
      ? `REKAP PRESENSI ${instUpper}`
      : (raw.documentTitle || `REKAP PRESENSI ${instUpper}`),
    locationText: isLegacyInstitutionBranding(raw.locationText)
      ? 'KANTOR PUSAT'
      : (raw.locationText || 'KANTOR PUSAT'),
    footerSocialText: isLegacyInstitutionBranding(raw.footerSocialText) || isLegacyPersonalData(raw.footerSocialText)
      ? 'Portal Manajemen Halaqah Al-Quran'
      : (raw.footerSocialText || 'Portal Manajemen Halaqah Al-Quran'),
    penanggungjawabNama: isLegacyPersonalData(raw.penanggungjawabNama)
      ? 'Koordinator Halaqah'
      : (raw.penanggungjawabNama || 'Koordinator Halaqah')
  };
}
