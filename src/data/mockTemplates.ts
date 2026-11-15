/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  UserRole, 
  JenisKelamin, 
  StatusAktif, 
  TingkatJenjang, 
  Admin, 
  Guru, 
  Siswa, 
  Kelas, 
  Halaqah, 
  Modul, 
  TipeModul, 
  Setoran, 
  AuditLog,
  JenisSetoran,
  TipeTahfidz
} from '../types';

export const SURAH_PRESETS = [
  { nomor: 101, nama: 'Al-Qari\'ah', ayat: 11, arti: 'Hari Kiamat' },
  { nomor: 93, nama: 'Ad-Dhuha', ayat: 11, arti: 'Waktu Dhuha' },
  { nomor: 67, nama: 'Al-Mulk', ayat: 30, arti: 'Kerajaan' },
  { nomor: 114, nama: 'An-Nas', ayat: 6, arti: 'Manusia' },
  { nomor: 113, nama: 'Al-Falaq', ayat: 5, arti: 'Waktu Subuh' },
  { nomor: 112, nama: 'Al-Ikhlas', ayat: 4, arti: 'Keesaan Allah' },
  { nomor: 110, nama: 'An-Nashr', ayat: 3, arti: 'Pertolongan' },
  { nomor: 108, nama: 'Al-Kautsar', ayat: 3, arti: 'Nikmat yang Banyak' },
  { nomor: 107, nama: 'Al-Ma\'un', ayat: 7, arti: 'Barang yang Berguna' },
];

export const MOCK_AYAT_PRESETS: Record<number, Array<{ nomorAyat: number; teksArab: string; terjemahan: string; juz?: number; halaman?: number; baris?: number }>> = {
  112: [
    { nomorAyat: 1, teksArab: 'قُلْ هُوَ اللَّهُ أَحَدٌ', terjemahan: 'Katakanlah (Muhammad), "Dialah Allah, Yang Maha Esa', juz: 30, halaman: 604, baris: 3 },
    { nomorAyat: 2, teksArab: 'اللَّهُ الصَّمَدُ', terjemahan: 'Allah tempat meminta segala sesuatu', juz: 30, halaman: 604, baris: 4 },
    { nomorAyat: 3, teksArab: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', terjemahan: 'Dia tidak beranak dan tidak pula diperanakkan', juz: 30, halaman: 604, baris: 4 },
    { nomorAyat: 4, teksArab: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', terjemahan: 'Dan tidak ada sesuatu yang setara dengan Dia."', juz: 30, halaman: 604, baris: 5 },
  ],
  114: [
    { nomorAyat: 1, teksArab: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', terjemahan: 'Katakanlah, "Aku berlindung kepada Tuhannya manusia', juz: 30, halaman: 604, baris: 13 },
    { nomorAyat: 2, teksArab: 'مَلِكِ النَّاسِ', terjemahan: 'Raja manusia', juz: 30, halaman: 604, baris: 13 },
    { nomorAyat: 3, teksArab: 'إِلَٰهِ النَّاسِ', terjemahan: 'Sembahan manusia', juz: 30, halaman: 604, baris: 14 },
    { nomorAyat: 4, teksArab: 'من شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', terjemahan: 'dari kejahatan (bisikan) setan yang biasa bersembunyi', juz: 30, halaman: 604, baris: 14 },
    { nomorAyat: 5, teksArab: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', terjemahan: 'yang membisikkan (kejahatan) ke dalam dada manusia', juz: 30, halaman: 604, baris: 15 },
    { nomorAyat: 6, teksArab: 'مِنَ الْجِنَّةِ وَالنَّاسِ', terjemahan: 'dari (golongan) jin dan manusia."', juz: 30, halaman: 604, baris: 15 },
  ],
  113: [
    { nomorAyat: 1, teksArab: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', terjemahan: 'Katakanlah, "Aku berlindung kepada Tuhan yang menguasai subuh (fajar)', juz: 30, halaman: 604, baris: 8 },
    { nomorAyat: 2, teksArab: 'مِن شَرِّ مَا خَلَقَ', terjemahan: 'dari kejahatan makhluk yang Dia ciptakan', juz: 30, halaman: 604, baris: 8 },
    { nomorAyat: 3, teksArab: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', terjemahan: 'dan dari kejahatan malam apabila telah gelap gulita', juz: 30, halaman: 604, baris: 9 },
    { nomorAyat: 4, teksArab: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', terjemahan: 'dan dari kejahatan (perempuan-perempuan) penyihir yang meniup pada buhul-buhul (talinya)', juz: 30, halaman: 604, baris: 10 },
    { nomorAyat: 5, teksArab: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', terjemahan: 'dan dari kejahatan orang yang dengki apabila dia dengki."', juz: 30, halaman: 604, baris: 10 },
  ]
};

export const INITIAL_ADMINS: Admin[] = [
  {
    id: 'adm-1',
    namaLengkap: 'Administrator Utama',
    email: 'admin@sistem.id',
    password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
    nomorHp: '0800-0000-0000',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-01-01',
    adminRole: 'SUPER_ADMIN',
    jabatan: 'Super Admin Sistem',
    permissions: ['dashboard', 'gurus', 'siswas', 'kelashalaqah', 'setorans', 'matapelajaran_elemen', 'moduls', 'manajemen_assessment', 'program_keilmuan', 'manajemen_syahadah', 'struktur_lembaga', 'guru_halaqah_pribadi', 'admins', 'system']
  },
  {
    id: 'adm-2',
    namaLengkap: 'Admin Akademik (Demo)',
    email: 'akademik@halaqah.example',
    nomorHp: '0800-0000-0002',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-02-15',
    adminRole: 'SUB_ADMIN',
    jabatan: 'Admin Staff SDM & Akademik',
    permissions: ['dashboard', 'pengguna', 'kelashalaqah', 'setorans', 'kurikulum_modul', 'program_keilmuan', 'manajemen_syahadah', 'struktur_lembaga', 'gurus', 'siswas', 'guru_halaqah_pribadi', 'matapelajaran_elemen', 'moduls', 'manajemen_assessment'],
    adminTabPermissions: {
      pengguna: ['guru', 'siswa'],
      kelashalaqah: ['lembaga', 'presensi', 'jadwal'],
      kurikulum_modul: ['matapelajaran', 'modul', 'administrasi', 'assessment'],
      struktur_lembaga: ['wizard', 'visual'],
      manajemen_syahadah: ['penerbitan', 'aturan'],
      setorans: ['riwayat', 'pengaturan', 'tajwid']
    }
  }
];

export const INITIAL_GURUS: Guru[] = [
  {
    id: 'gru-koordinator',
    namaLengkap: 'Koordinator Halaqah',
    jabatan: 'Koordinator Tahfidz Utama',
    email: 'koordinator@halaqah.example',
    nomorHp: '0800-0000-0001',
    jenisKelamin: JenisKelamin.LAKI_LAKI,
    alamat: 'Kantor Pusat Lembaga',
    fotoProfil: '',
    halaqahBimbinganId: 'hal-1',
    halaqahBimbinganNama: 'Halaqah Abu Bakar As-Siddiq',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-01-10',
    peranGuru: ['Guru Halaqah', 'Penguji Assessment', 'Koordinator Penguji'],
    kompetensiGuru: ['Tahfidz', 'Tilawah', 'Iqra', 'Tajwid', 'Kitab', 'Bahasa Arab', 'Program Khusus']
  },
  {
    id: 'gru-1',
    namaLengkap: 'Ustadz Muhammad Rayhan, Lc',
    jabatan: 'Koordinator Tahfidz',
    email: 'guru1@halaqah.example',
    nomorHp: '0800-0000-0011',
    jenisKelamin: JenisKelamin.LAKI_LAKI,
    alamat: 'Asrama Guru Blok A',
    fotoProfil: '',
    halaqahBimbinganId: 'hal-1',
    halaqahBimbinganNama: 'Halaqah Abu Bakar As-Siddiq',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-01-10',
    peranGuru: ['Guru Halaqah', 'Penguji Assessment'],
    kompetensiGuru: ['Tahfidz', 'Tajwid', 'Iqra']
  },
  {
    id: 'gru-2',
    namaLengkap: 'Ustadzah Fatimah Azzahra, S.Ag',
    jabatan: 'Guru Tahfidz Akhwat',
    email: 'guru2@halaqah.example',
    nomorHp: '0800-0000-0012',
    jenisKelamin: JenisKelamin.PEREMPUAN,
    alamat: 'Asrama Guru Putri Blok B',
    fotoProfil: '',
    halaqahBimbinganId: 'hal-2',
    halaqahBimbinganNama: 'Halaqah Khadijah Al-Kubra',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-01-12',
    peranGuru: ['Guru Halaqah', 'Penguji Assessment'],
    kompetensiGuru: ['Tilawah', 'Iqra', 'Tajwid']
  },
  {
    id: 'gru-3',
    namaLengkap: 'Ustadz Wildan Abdurahman, S.E.I',
    jabatan: 'Guru Tilawah',
    email: 'guru3@halaqah.example',
    nomorHp: '0800-0000-0013',
    jenisKelamin: JenisKelamin.LAKI_LAKI,
    alamat: 'Asrama Guru Blok C',
    fotoProfil: '',
    halaqahBimbinganId: 'hal-3',
    halaqahBimbinganNama: 'Halaqah Ali bin Abi Thalib',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-02-01',
    peranGuru: ['Guru Halaqah'],
    kompetensiGuru: ['Tilawah', 'Bahasa Arab', 'Kitab']
  }
];

export const INITIAL_KELAS: Kelas[] = [
  {
    id: 'cls-1',
    namaKelas: 'Kelas 7A - Unggulan',
    jenjang: TingkatJenjang.SMP,
    tahunAjaran: '2025/2026',
    waliKelasId: 'gru-1',
    waliKelasNama: 'Ustadz Muhammad Rayhan, Lc'
  },
  {
    id: 'cls-2',
    namaKelas: 'Kelas 8B - Reguler',
    jenjang: TingkatJenjang.SMP,
    tahunAjaran: '2025/2026',
    waliKelasId: 'gru-3',
    waliKelasNama: 'Ustadz Wildan Abdurahman, S.E.I'
  },
  {
    id: 'cls-3',
    namaKelas: 'Kelas 10 - Takhassus',
    jenjang: TingkatJenjang.SMA,
    tahunAjaran: '2025/2026',
    waliKelasId: 'gru-2',
    waliKelasNama: 'Ustadzah Fatimah Azzahra, S.Ag'
  }
];

export const INITIAL_HALAQAH: Halaqah[] = [
  {
    id: 'hal-1',
    namaHalaqah: 'Halaqah Abu Bakar As-Siddiq',
    guruPembimbingId: 'gru-koordinator',
    guruPembimbingNama: 'Koordinator Halaqah',
    kapasitasPeserta: 10,
    keterangan: 'Fokus pada setoran tahfidz Juz 28, 29, dan 30.',
    status: StatusAktif.AKTIF,
    warnaIdentitas: '#10B981', // emerald-500
    hariKegiatan: 'Kamis dan Jumat',
    waktuKegiatan: '07:30 - 09:00 WIB',
    targetConfigEnabled: true,
    targetConfig: {
      selectedModulType: 'Al-Quran',
      selectedNonQuranModulId: '',
      selectedElemenName: 'Tahfidz',
      targetPeriod: 'tahunan',
      tahunanMode: 'paket_pemula',
      isPaketFatihahAnnasKausar: true,
      tahunanJuzAwal: '30',
      tahunanJuzAkhir: '30',
      tahunanSuratAwal: 'Al-Fatihah',
      tahunanAyatAwal: '1',
      tahunanSuratAkhir: 'An-Nas',
      tahunanAyatAkhir: '6',
      tahunanBulanDuration: 12,
      tahunanMonthlyTargets: {
        0: { bulan: 1, suratAwal: 'Al-Fatihah', ayatAwal: 1, suratAkhir: 'An-Nas', ayatAkhir: 6, catatan: 'Al-Fatihah & An-Nas' },
        1: { bulan: 2, suratAwal: 'Al-Falaq', ayatAwal: 1, suratAkhir: 'Al-Falaq', ayatAkhir: 5, catatan: 'Surat Al-Falaq' },
        2: { bulan: 3, suratAwal: 'Al-Ikhlas', ayatAwal: 1, suratAkhir: 'Al-Ikhlas', ayatAkhir: 4, catatan: 'Surat Al-Ikhlas' },
        3: { bulan: 4, suratAwal: 'Al-Lahab', ayatAwal: 1, suratAkhir: 'Al-Lahab', ayatAkhir: 5, catatan: 'Surat Al-Lahab' },
        4: { bulan: 5, suratAwal: 'An-Nasr', ayatAwal: 1, suratAkhir: 'An-Nasr', ayatAkhir: 3, catatan: 'Surat An-Nasr' },
        5: { bulan: 6, suratAwal: 'Al-Kafirun', ayatAwal: 1, suratAkhir: 'Al-Kafirun', ayatAkhir: 6, catatan: 'Surat Al-Kafirun' },
        6: { bulan: 7, suratAwal: 'Al-Kausar', ayatAwal: 1, suratAkhir: 'Al-Kausar', ayatAkhir: 3, catatan: 'Surat Al-Kausar' },
      }
    },
    targetConfigText: {
      pekanan: 'Sesuai Target Bulanan (Urutan: Al-Fatihah ➔ An-Nas s/d Al-Kausar)',
      bulanan: 'Bulan 1: Al-Fatihah & An-Nas',
      kuartal: '',
      semester: '',
      tahunan: 'Tahunan: [Tahfidz: Surat Al-Fatihah & Surat An-Nas s/d Al-Kausar (8 Surat)]'
    }
  },
  {
    id: 'hal-2',
    namaHalaqah: 'Halaqah Khadijah Al-Kubra',
    guruPembimbingId: 'gru-2',
    guruPembimbingNama: 'Ustadzah Fatimah Azzahra, S.Ag',
    kapasitasPeserta: 8,
    keterangan: 'Khusus santri akhwat tahakhuss Juz 30 & Juz 1.',
    status: StatusAktif.AKTIF,
    warnaIdentitas: '#EC4899', // pink-500
    hariKegiatan: 'Senin - Kamis',
    waktuKegiatan: '08:00 - 09:30 WIB',
  },
  {
    id: 'hal-3',
    namaHalaqah: 'Halaqah Ali bin Abi Thalib',
    guruPembimbingId: 'gru-1',
    guruPembimbingNama: 'Ustadz Muhammad Rayhan, Lc',
    kapasitasPeserta: 12,
    keterangan: 'Kelompok mutawasith - perbaikan tajwid tilawah (Tahsin) & Murojaah.',
    status: StatusAktif.AKTIF,
    warnaIdentitas: '#3B82F6', // blue-500
    hariKegiatan: 'Selasa & Kamis',
    waktuKegiatan: '16:00 - 17:30 WIB',
  },
  {
    id: 'hal-4',
    namaHalaqah: 'Halaqah Umar bin Khattab',
    guruPembimbingId: 'gru-koordinator',
    guruPembimbingNama: 'Koordinator Halaqah',
    kapasitasPeserta: 10,
    keterangan: 'Kelompok bimbingan lanjutan tahfidz Juz 1 - 5.',
    status: StatusAktif.AKTIF,
    warnaIdentitas: '#D97706', // amber-600
    hariKegiatan: 'Senin, Rabu Dan Jumat',
    waktuKegiatan: '19:30 - 21:00 WIB',
  },
  {
    id: 'hal-5',
    namaHalaqah: 'Halaqah Utsman bin Affan',
    guruPembimbingId: 'gru-1',
    guruPembimbingNama: 'Ustadz Muhammad Rayhan, Lc',
    kapasitasPeserta: 12,
    keterangan: 'Fokus pada setoran tahfidz Juz 29-30 untuk santri ula.',
    status: StatusAktif.AKTIF,
    warnaIdentitas: '#8B5CF6', // purple-500
  }
];

export const INITIAL_SISWAS: Siswa[] = [
  {
    id: 'sis-1',
    nis: '202600126-C',
    namaLengkap: 'Ziyad Al-Fatih',
    kelasId: 'cls-1',
    kelasNama: 'Kelas 7A - Unggulan',
    halaqahId: 'hal-1',
    halaqahNama: 'Halaqah Abu Bakar As-Siddiq',
    email: 'siswa1@halaqah.example',
    nomorHpOrangTua: '0800-0000-0101',
    jenisKelamin: JenisKelamin.LAKI_LAKI,
    tanggalLahir: '2012-05-14',
    alamat: 'Asrama Santri Putra 1',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-01-15'
  },
  {
    id: 'sis-2',
    nis: '202600226-C',
    namaLengkap: 'Aisyah Humaira',
    kelasId: 'cls-3',
    kelasNama: 'Kelas 10 - Takhassus',
    halaqahId: 'hal-2',
    halaqahNama: 'Halaqah Khadijah Al-Kubra',
    email: 'siswa2@halaqah.example',
    nomorHpOrangTua: '0800-0000-0102',
    jenisKelamin: JenisKelamin.PEREMPUAN,
    tanggalLahir: '2010-09-22',
    alamat: 'Asrama Santri Putri 1',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-01-16'
  },
  {
    id: 'sis-3',
    nis: '001KS-A',
    namaLengkap: 'Raihan Ramadhan',
    kelasId: 'cls-2',
    kelasNama: 'Kelas 8B - Reguler',
    halaqahId: 'hal-4',
    halaqahNama: 'Halaqah Umar bin Khattab',
    email: 'siswa3@halaqah.example',
    nomorHpOrangTua: '0800-0000-0103',
    jenisKelamin: JenisKelamin.LAKI_LAKI,
    tanggalLahir: '2011-03-05',
    alamat: 'Asrama Santri Putra 2',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-02-05'
  },
  {
    id: 'sis-4',
    nis: '001KS-B',
    namaLengkap: 'Fatih Al-Muntazar',
    kelasId: 'cls-1',
    kelasNama: 'Kelas 7A - Unggulan',
    halaqahId: 'hal-1',
    halaqahNama: 'Halaqah Abu Bakar As-Siddiq',
    email: 'siswa4@halaqah.example',
    nomorHpOrangTua: '0800-0000-0104',
    jenisKelamin: JenisKelamin.LAKI_LAKI,
    tanggalLahir: '2012-08-25',
    alamat: 'Asrama Santri Putra 3',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-01-18'
  },
  {
    id: 'sis-5',
    nis: '0012026-A',
    namaLengkap: 'Zahra Kamila',
    kelasId: 'cls-3',
    kelasNama: 'Kelas 10 - Takhassus',
    halaqahId: 'hal-2',
    halaqahNama: 'Halaqah Khadijah Al-Kubra',
    email: 'siswa5@halaqah.example',
    nomorHpOrangTua: '0800-0000-0105',
    jenisKelamin: JenisKelamin.PEREMPUAN,
    tanggalLahir: '2010-12-01',
    alamat: 'Asrama Santri Putri 2',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-01-20'
  },
  {
    id: 'sis-6',
    nis: '0022026-A',
    namaLengkap: 'Ahmad Rafiqi',
    kelasId: 'cls-2',
    kelasNama: 'Kelas 8B - Reguler',
    halaqahId: 'hal-5',
    halaqahNama: 'Halaqah Utsman bin Affan',
    email: 'siswa6@halaqah.example',
    nomorHpOrangTua: '0800-0000-0106',
    jenisKelamin: JenisKelamin.LAKI_LAKI,
    tanggalLahir: '2011-06-15',
    alamat: 'Asrama Santri Putra 4',
    fotoProfil: '',
    status: StatusAktif.AKTIF,
    tanggalDibuat: '2026-02-15'
  }
];

export const INITIAL_MODULS: Modul[] = [
  {
    id: 'mod-1',
    tipe: TipeModul.AL_QURAN,
    namaSurat: 'Al-Ikhlas',
    nomorUrutSurat: 112,
    jumlahAyat: 4,
    rujukanMushaf: "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris)",
    isiAyat: MOCK_AYAT_PRESETS[112]
  },
  {
    id: 'mod-2',
    tipe: TipeModul.AL_QURAN,
    namaSurat: 'Al-Falaq',
    nomorUrutSurat: 113,
    jumlahAyat: 5,
    rujukanMushaf: "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris)",
    isiAyat: MOCK_AYAT_PRESETS[113]
  },
  {
    id: 'mod-3',
    tipe: TipeModul.AL_QURAN,
    namaSurat: 'An-Nas',
    nomorUrutSurat: 114,
    jumlahAyat: 6,
    rujukanMushaf: "Mushaf Madinah (Majma' Malik Fahd - Standar 15 Baris)",
    isiAyat: MOCK_AYAT_PRESETS[114]
  },
  {
    id: 'mod-4',
    tipe: TipeModul.NON_AL_QURAN,
    judulModul: 'Hadits Arbain An-Nawawi v1',
    kategoriModul: 'Hadits',
    halamanGambar: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400'
    ],
    thumbnailHalaman: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=100'
    ],
    isiModulManual: 'Hadits 1: Innamal A\'malu bin Niyyat.\nHadits 2: Ma\'na al-Islam, al-Iman, wa al-Ihsan.\nHadits 3: Arkan al-Islam.'
  },
  {
    id: 'mod-5',
    tipe: TipeModul.NON_AL_QURAN,
    judulModul: 'Kitab Al-Adab Al-Mufrad (Ringkasan)',
    kategoriModul: 'Adab & Akhlak',
    halamanGambar: [
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400'
    ],
    thumbnailHalaman: [
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=100'
    ],
    isiModulManual: 'Bab 1: Berbakti kepada orang tua (Birrul Walidain).\nBab 2: Menyambung tali silaturahim.\nBab 3: Berbuat baik kepada tetangga.'
  }
];

export const INITIAL_SETORANS: Setoran[] = [
  {
    id: 'set-1',
    siswaId: 'sis-1',
    siswaNama: 'Ziyad Al-Fatih',
    siswaNis: '202607001',
    halaqahId: 'hal-1',
    halaqahNama: 'Halaqah Abu Bakar As-Siddiq',
    guruId: 'gru-1',
    guruNama: 'Ustadz Muhammad Rayhan, Lc',
    modulId: 'mod-1',
    modulNama: 'Al-Ikhlas',
    tipeModul: TipeModul.AL_QURAN,
    jenisSetoran: JenisSetoran.TAHFIDZ,
    tipeTahfidz: TipeTahfidz.BARU,
    suratNama: 'Al-Ikhlas',
    ayatAwal: 1,
    ayatAkhir: 4,
    catatanGuru: 'Hafalan sangat lancar, makharijul huruf tepat. Pertahankan!',
    nilai: 'Mumtaz (A+)',
    statusLulus: true,
    tanggalSetoran: '2026-05-25'
  },
  {
    id: 'set-2',
    siswaId: 'sis-1',
    siswaNama: 'Ziyad Al-Fatih',
    siswaNis: '202607001',
    halaqahId: 'hal-1',
    halaqahNama: 'Halaqah Abu Bakar As-Siddiq',
    guruId: 'gru-1',
    guruNama: 'Ustadz Muhammad Rayhan, Lc',
    modulId: 'mod-2',
    modulNama: 'Al-Falaq',
    tipeModul: TipeModul.AL_QURAN,
    jenisSetoran: JenisSetoran.TILAWAH,
    suratNama: 'Al-Falaq',
    ayatAwal: 1,
    ayatAkhir: 5,
    catatanGuru: 'Hati-hati dengan panjang-pendek (Mad) di akhir ayat.',
    nilai: 'Jayyid Jiddan (B+)',
    statusLulus: true,
    tanggalSetoran: '2026-05-26'
  },
  {
    id: 'set-3',
    siswaId: 'sis-2',
    siswaNama: 'Aisyah Humaira',
    siswaNis: '202607002',
    halaqahId: 'hal-2',
    halaqahNama: 'Halaqah Khadijah Al-Kubra',
    guruId: 'gru-2',
    guruNama: 'Ustadzah Fatimah Azzahra, S.Ag',
    modulId: 'mod-3',
    modulNama: 'An-Nas',
    tipeModul: TipeModul.AL_QURAN,
    jenisSetoran: JenisSetoran.TAHFIDZ,
    tipeTahfidz: TipeTahfidz.MUROJAAH,
    suratNama: 'An-Nas',
    ayatAwal: 1,
    ayatAkhir: 6,
    catatanGuru: 'Murojaah lancar tanpa hambatan, tajwid sempurna.',
    nilai: 'Mumtaz (A+)',
    statusLulus: true,
    tanggalSetoran: '2026-05-25'
  },
  {
    id: 'set-4',
    siswaId: 'sis-3',
    siswaNama: 'Raihan Ramadhan',
    siswaNis: '202608003',
    halaqahId: 'hal-3',
    halaqahNama: 'Halaqah Ali bin Abi Thalib',
    guruId: 'gru-3',
    guruNama: 'Ustadz Wildan Abdurahman, S.E.I',
    modulId: 'mod-4',
    modulNama: 'Hadits Arbain An-Nawawi v1',
    tipeModul: TipeModul.NON_AL_QURAN,
    halaman: 1,
    catatanGuru: 'Sangat baik dalam menguraikan kandungan Hadits 1, namun ada satu kalimat hadits yang terlupakan.',
    nilai: 'Jayyid (B)',
    statusLulus: false, // Perlu setoran lagi untuk halaman ini
    tanggalSetoran: '2026-05-27'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-28T10:00:00Z',
    actorNama: 'Administrator Utama',
    actorRole: UserRole.ADMIN,
    action: 'Login Berhasil',
    rincian: 'Admin masuk ke dashboard sistem'
  },
  {
    id: 'log-2',
    timestamp: '2026-05-28T10:15:22Z',
    actorNama: 'Administrator Utama',
    actorRole: UserRole.ADMIN,
    action: 'Menambah Data Siswa',
    rincian: 'Menambahkan siswa baru Ziyad Al-Fatih (NIS: 202607001)'
  },
  {
    id: 'log-3',
    timestamp: '2026-05-28T11:45:10Z',
    actorNama: 'Ustadz Muhammad Rayhan, Lc',
    actorRole: UserRole.GURU,
    action: 'Input Setoran Baru',
    rincian: 'Menginput setoran siswa Ziyad Al-Fatih untuk surat Al-Ikhlas (Ayat 1-4)'
  }
];

// Identifiers for Demo / Dummy Preset Data
export const DEMO_SISWA_IDS = ['sis-1', 'sis-2', 'sis-3', 'sis-4', 'sis-5', 'sis-6'];
// Note: gru-koordinator is the initial coordinator teacher preset
export const DEMO_GURU_IDS = ['gru-1', 'gru-2', 'gru-3'];
// Note: adm-1 is the initial bootstrap Super Admin account (admin@sistem.id), customizable by the user!
export const DEMO_ADMIN_IDS = ['adm-2'];
export const DEMO_HALAQAH_IDS = ['hal-1', 'hal-2', 'hal-3', 'hal-4', 'hal-5'];
export const DEMO_KELAS_IDS = ['cls-1', 'cls-2', 'cls-3'];

export const isDemoUser = (id: string | undefined | null): boolean => {
  if (!id) return false;
  return DEMO_SISWA_IDS.includes(id) || DEMO_GURU_IDS.includes(id) || DEMO_ADMIN_IDS.includes(id);
};

