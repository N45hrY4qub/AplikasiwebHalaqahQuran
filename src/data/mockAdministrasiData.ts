/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  CapaianPembelajaran, 
  TujuanPembelajaran, 
  BankAktivitasPembelajaran, 
  RppTemplateAdmin, 
  GuruRppDokumen,
  PilotTestingConfig,
  TingkatJenjang 
} from '../types';

export const INITIAL_CAPAIAN_PEMBELAJARAN: CapaianPembelajaran[] = [
  {
    id: 'cp-tajwid-1',
    kodeCP: 'CP-TAJ-01',
    jenjang: TingkatJenjang.SD,
    fase: 'Fase A (Kelas 1-2)',
    mataPelajaranNama: 'Tahsin & Tajwid',
    elemen: 'Makharijul Huruf & Sifat Huruf',
    deskripsi: 'Santri mampu mengenali, melafalkan, dan membedakan tempat-tempat keluarnya huruf hijaiyah (Al-Halq, Al-Lisan, Asy-Syafatain, Al-Khaisyum, Al-Jauf) dengan fasih serta mengidentifikasi sifat-sifat dasar huruf.',
    tahunAjaran: '2025/2026',
    statusAktif: true,
    tanggalDibuat: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'cp-tajwid-2',
    kodeCP: 'CP-TAJ-02',
    jenjang: TingkatJenjang.SMP,
    fase: 'Fase D (Kelas 7-9)',
    mataPelajaranNama: 'Tahsin & Tajwid',
    elemen: 'Hukum Nun Mati, Tanwin & Mim Mati',
    deskripsi: 'Santri memahami kaidah hukum bacaan Nun Sukun/Tanwin (Izhar Halqi, Idgham Bighunnah/Bilaghunnah, Iqlab, Ikhfa Haqiqi) serta Mim Sukun (Ikhfa Syafawi, Idgham Mimi, Izhar Syafawi) dan mampu menerapkannya secara tartil dalam tilawah Al-Qur\'an.',
    tahunAjaran: '2025/2026',
    statusAktif: true,
    tanggalDibuat: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'cp-tahfidz-1',
    kodeCP: 'CP-THF-01',
    jenjang: TingkatJenjang.SMP,
    fase: 'Fase D (Kelas 7-9)',
    mataPelajaranNama: 'Tahfidz Al-Qur\'an',
    elemen: 'Hafalan Juz 30 & Mutqin',
    deskripsi: 'Santri mampu menghafal Surat An-Naba\' hingga An-Nas dengan lancar (mutqin), tartil sesuai kaidah tajwid, membiasakan murojaah harian, serta memahami makna umum ayat-ayat pendek.',
    tahunAjaran: '2025/2026',
    statusAktif: true,
    tanggalDibuat: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'cp-fiqih-1',
    kodeCP: 'CP-FIQ-01',
    jenjang: TingkatJenjang.SMP,
    fase: 'Fase D (Kelas 7-9)',
    mataPelajaranNama: 'Fiqih Ibadah',
    elemen: 'Thaharah & Shalat Fardhu',
    deskripsi: 'Santri memahami rukun, syarat, tata cara bersuci dari najis dan hadas (wudhu, tayamum, mandi wajib) serta mampu mempraktikkan shalat fardhu dan shalat sunnah rawatib dengan tertib dan khusyuk.',
    tahunAjaran: '2025/2026',
    statusAktif: true,
    tanggalDibuat: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'cp-arab-1',
    kodeCP: 'CP-ARB-01',
    jenjang: TingkatJenjang.SMP,
    fase: 'Fase D (Kelas 7-9)',
    mataPelajaranNama: 'Bahasa Arab & Nahwu',
    elemen: 'Pembagian Kata & Kalimat Sempurna (Jumlah Mufidah)',
    deskripsi: 'Santri mampu mengklasifikasikan jenis kata dalam bahasa Arab (Isim, Fi\'il, Huruf), menyusun kalimat sederhana berpola Mubtada\'-Khabar, serta menerjemahkan teks bacaan dasar.',
    tahunAjaran: '2025/2026',
    statusAktif: true,
    tanggalDibuat: '2026-07-01T08:00:00.000Z'
  }
];

export const INITIAL_TUJUAN_PEMBELAJARAN: TujuanPembelajaran[] = [
  {
    id: 'tp-tajwid-1-1',
    cpId: 'cp-tajwid-1',
    kodeTP: 'TP-1.1',
    mataPelajaranNama: 'Tahsin & Tajwid',
    babNama: 'Makharijul Huruf Tenggorokan (Al-Halq)',
    judul: 'Melafalkan 6 Huruf Halqi dengan Tepat',
    deskripsi: 'Melalui metode talaqqi dan musyafahah, santri dapat melafalkan 6 huruf Al-Halq (Hamzah, Ha\', \'Ain, Ha, Ghain, Kha\') sesuai makhraj yang benar tanpa tertukar.',
    indikatorKetercapaian: [
      'Menyebutkan letak makhraj aqshal halq, wasathul halq, dan adnal halq',
      'Membaca contoh ayat yang mengandung huruf halq dengan artikulasi bersih',
      'Mengidentifikasi kesalahan umum saat melafalkan huruf \'Ain dan Hamzah'
    ],
    alokasiWaktu: '2 JP (2 x 40 Menit)',
    urutan: 1,
    statusAktif: true,
    tanggalDibuat: '2026-07-02T08:00:00.000Z'
  },
  {
    id: 'tp-tajwid-1-2',
    cpId: 'cp-tajwid-1',
    kodeTP: 'TP-1.2',
    mataPelajaranNama: 'Tahsin & Tajwid',
    babNama: 'Makharijul Huruf Lidah (Al-Lisan)',
    judul: 'Menerapkan Makhraj Huruf Lidah dan Gigi',
    deskripsi: 'Santri mampu mendemonstrasikan pengucapan huruf lisan (Qaf, Kaf, Jim, Syin, Ya, Dhad, Lam, Nun, Ra, Tha, Dal, Ta, Shad, Zai, Sin, Zha, Dzal, Tsa) dengan akurat.',
    indikatorKetercapaian: [
      'Membedakan bunyi huruf tebal (isti\'la) dan tipis (istifal)',
      'Melafalkan huruf Dhad (ض) dari sisi tepi lidah secara benar',
      'Membaca rangkaian kalimat latihan tanpa cacat fonetik'
    ],
    alokasiWaktu: '4 JP (2 Pertemuan)',
    urutan: 2,
    statusAktif: true,
    tanggalDibuat: '2026-07-02T08:00:00.000Z'
  },
  {
    id: 'tp-tajwid-2-1',
    cpId: 'cp-tajwid-2',
    kodeTP: 'TP-2.1',
    mataPelajaranNama: 'Tahsin & Tajwid',
    babNama: 'Hukum Nun Sukun & Tanwin: Izhar dan Idgham',
    judul: 'Membedakan Cara Membaca Izhar Halqi dan Idgham Bighunnah',
    deskripsi: 'Santri dapat menjelaskan pengertian Izhar dan Idgham serta mempraktikkan bacaan jelas tanpa dengung pada Izhar dan penahanan dengung 2 harakat pada Idgham Bighunnah.',
    indikatorKetercapaian: [
      'Menghafal huruf-huruf Izhar Halqi dan Idgham Bighunnah',
      'Menemukan contoh hukum Izhar dan Idgham dalam Mushaf Surah Al-Baqarah',
      'Mempraktikkan dengung (ghunnah) dengan tempo yang pas (2 harakat)'
    ],
    alokasiWaktu: '2 JP (2 x 40 Menit)',
    urutan: 1,
    statusAktif: true,
    tanggalDibuat: '2026-07-02T08:00:00.000Z'
  },
  {
    id: 'tp-tahfidz-1-1',
    cpId: 'cp-tahfidz-1',
    kodeTP: 'TP-3.1',
    mataPelajaranNama: 'Tahfidz Al-Qur\'an',
    babNama: 'Hafalan Surah An-Naba\' (Ayat 1-20)',
    judul: 'Menghafal Surah An-Naba\' Ayat 1-20 secara Mutqin',
    deskripsi: 'Santri mampu memperdengarkan hafalan Surah An-Naba\' ayat 1 sampai 20 dalam sekali duduk dengan memperhatikan kelancaran, waqaf ibtida, dan kaidah tajwid.',
    indikatorKetercapaian: [
      'Melafalkan ayat 1-20 tanpa keraguan / jeda panjang',
      'Menjaga konsistensi panjang mad thabi\'i pada ujung-ujung ayat',
      'Melakukan tasmi\' berpasangan dengan teman sebangku'
    ],
    alokasiWaktu: '2 JP (Bimbingan Talaqqi & Setoran)',
    urutan: 1,
    statusAktif: true,
    tanggalDibuat: '2026-07-02T08:00:00.000Z'
  },
  {
    id: 'tp-fiqih-1-1',
    cpId: 'cp-fiqih-1',
    kodeTP: 'TP-4.1',
    mataPelajaranNama: 'Fiqih Ibadah',
    babNama: 'Thaharah: Wudhu Sesuai Sunnah',
    judul: 'Mempraktikkan Tata Cara Wudhu Sesuai Sunnah Nabi',
    deskripsi: 'Santri dapat menyebutkan rukun dan sunnah wudhu serta mempraktikkan gerakan berwudhu secara tertib, hemat air, dan membaca doa sebelum & sesudah wudhu.',
    indikatorKetercapaian: [
      'Menyebutkan 6 rukun wudhu secara berurutan',
      'Mendemonstrasikan praktik wudhu langsung di tempat wudhu madrasah',
      'Membaca doa setelah wudhu dengan lancar beserta artinya'
    ],
    alokasiWaktu: '2 JP (Teori & Praktik Lapangan)',
    urutan: 1,
    statusAktif: true,
    tanggalDibuat: '2026-07-02T08:00:00.000Z'
  }
];

export const INITIAL_BANK_AKTIVITAS: BankAktivitasPembelajaran[] = [
  // Pendahuluan
  {
    id: 'act-p-1',
    kategori: 'pendahuluan',
    judul: 'Salam, Pembacaan Doa Pembuka & Murojaah 10 Menit',
    deskripsi: 'Guru membuka majelis dengan salam hangat, membaca doa belajar bersama, dan mengajak santri melantunkan murojaah surah pendek selama 10 menit.',
    metode: 'Klasikal & Pembiasaan',
    alokasiMenitDefault: 10,
    tags: ['Pembiasaan', 'Doa', 'Murojaah']
  },
  {
    id: 'act-p-2',
    kategori: 'pendahuluan',
    judul: 'Apersepsi & Kuis Cepat Review Materi Pertemuan Sebelumnya',
    deskripsi: 'Guru mengulas materi pekan lalu dengan mengajukan 3 pertanyaan pemantik kepada santri secara acak untuk mengukur retensi hafalan/pemahaman.',
    metode: 'Tanya Jawab & Apersepsi',
    alokasiMenitDefault: 10,
    tags: ['Apersepsi', 'Review', 'Diagnostik']
  },
  {
    id: 'act-p-3',
    kategori: 'pendahuluan',
    judul: 'Penyampaian Tujuan Pembelajaran & Motivasi Fadhilah Keilmuan',
    deskripsi: 'Guru menjelaskan kompetensi dan target yang akan dicapai hari ini serta menceritakan fadhilah menuntut ilmu Al-Qur\'an untuk membakar semangat santri.',
    metode: 'Ceramah Interaktif',
    alokasiMenitDefault: 5,
    tags: ['Motivasi', 'Target TP']
  },

  // Inti
  {
    id: 'act-i-1',
    kategori: 'inti',
    judul: 'Metode Talaqqi & Musyafahah (Guru Mencontohkan, Santri Menirukan)',
    deskripsi: 'Guru melafalkan ayat/kaidah dengan suara tartil dan jelas, memperlihatkan bentuk bibir (musyafahah), lalu santri menirukan secara serentak 3-5 kali per baris.',
    metode: 'Talaqqi & Musyafahah',
    alokasiMenitDefault: 30,
    tags: ['Talaqqi', 'Artikulasi', 'Klasikal']
  },
  {
    id: 'act-i-2',
    kategori: 'inti',
    judul: 'Metode Sorogan & Setoran Mandiri Bergantian',
    deskripsi: 'Santri maju satu persatu ke hadapan guru untuk membacakan/memperdengarkan hafalan mandiri, sementara santri lain melakukan murojaah berpasangan.',
    metode: 'Sorogan Mandiri',
    alokasiMenitDefault: 40,
    tags: ['Sorogan', 'Evaluasi Individu', 'Koreksi Langsung']
  },
  {
    id: 'act-i-3',
    kategori: 'inti',
    judul: 'Drill & Praktik Kaidah Makhraj / Tajwid dengan Papan Tulis Interaktif',
    deskripsi: 'Guru menuliskan rumus atau skema kaidah, meminta santri mencari contoh pada mushaf, lalu melatih lidah dengan variasi harakat fathah, kasrah, dhammah, dan sukun.',
    metode: 'Drill & Practice',
    alokasiMenitDefault: 25,
    tags: ['Drill', 'Tajwid', 'Latihan']
  },
  {
    id: 'act-i-4',
    kategori: 'inti',
    judul: 'Diskusi Kelompok Kecil / Murojaah Berpasangan (Peer Learning)',
    deskripsi: 'Santri dibagi berpasangan untuk saling menyimak bacaan, mencatat kekeliruan rekan, dan bergantian membenarkan bacaan sebelum dinilai guru.',
    metode: 'Peer Learning & Diskusi',
    alokasiMenitDefault: 20,
    tags: ['Murojaah Berpasangan', 'Kolaborasi']
  },
  {
    id: 'act-i-5',
    kategori: 'inti',
    judul: 'Simulasi Praktik Ibadah / Peragaan Gerakan Langsung',
    deskripsi: 'Guru memperagakan tata cara pelaksanaan (misal: wudhu/shalat/sujud sahwi), lalu menunjuk santri secara bergantian untuk mempraktikkan di depan kelas.',
    metode: 'Demonstrasi & Simulasi',
    alokasiMenitDefault: 35,
    tags: ['Praktik', 'Demonstrasi', 'Fiqih']
  },

  // Penutup
  {
    id: 'act-cl-1',
    kategori: 'penutup',
    judul: 'Refleksi Santri & Penguatan Simpulan Materi oleh Guru',
    deskripsi: 'Guru meminta 1-2 santri merangkum apa yang telah dipelajari hari ini, memberikan apresiasi atas ketertiban santri, dan memberikan umpan balik umum.',
    metode: 'Refleksi Terbimbing',
    alokasiMenitDefault: 10,
    tags: ['Refleksi', 'Simpulan', 'Penguatan']
  },
  {
    id: 'act-cl-2',
    kategori: 'penutup',
    judul: 'Post-Test Lisan Cepat (3 Pertanyaan Acak)',
    deskripsi: 'Guru mengetes pemahaman akhir secara spontan dengan 3 pertanyaan hukum bacaan / potongan ayat sebelum kelas dibubarkan.',
    metode: 'Asesmen Formatif Cepat',
    alokasiMenitDefault: 5,
    tags: ['Post-Test', 'Evaluasi']
  },
  {
    id: 'act-cl-3',
    kategori: 'penutup',
    judul: 'Pemberian Tugas Rumah / Target Murojaah Mandiri di Asrama',
    deskripsi: 'Guru mencatat target ziyadah/murojaah mandiri untuk disetorkan pada pertemuan berikutnya dan mengingatkan disiplin adab Al-Qur\'an.',
    metode: 'Penugasan Terstruktur',
    alokasiMenitDefault: 5,
    tags: ['PR', 'Target Ziyadah']
  },
  {
    id: 'act-cl-4',
    kategori: 'penutup',
    judul: 'Doa Kafaratul Majelis & Salam Penutup',
    deskripsi: 'Membaca doa penutup majelis (Subhanakallahumma wa bihamdika...) secara khidmat bersama seluruh santri dan bersalaman dengan tertib.',
    metode: 'Doa Penutup',
    alokasiMenitDefault: 5,
    tags: ['Doa', 'Kafaratul Majelis']
  },

  // Media
  {
    id: 'act-m-1',
    kategori: 'media',
    judul: 'Mushaf Al-Qur\'an Rasm Utsmani (Standar Madinah 15 Baris)',
    deskripsi: 'Mushaf standar cetakan Madinah untuk acuan nomor ayat, letak baris, dan penandaan tanda waqaf.',
    tags: ['Mushaf', 'Al-Quran']
  },
  {
    id: 'act-m-2',
    kategori: 'media',
    judul: 'Kitab Matan Tuhfatul Athfal / Al-Jazariyah',
    deskripsi: 'Rujukan bait-bait nadham tajwid klasik para ulama qiraat.',
    tags: ['Kitab', 'Nadham', 'Tajwid']
  },
  {
    id: 'act-m-3',
    kategori: 'media',
    judul: 'Papan Tulis, Spidol Warna & Skema Gambar Anatomi Makhraj',
    deskripsi: 'Media visual diagram pita suara, rongga mulut, dan posisi lidah.',
    tags: ['Papan Tulis', 'Visual']
  },

  // Asesmen
  {
    id: 'act-a-1',
    kategori: 'asesmen',
    judul: 'Observasi Lisan & Formatif Real-Time saat Talaqqi',
    deskripsi: 'Guru mencatat kelancaran, fashohah, dan ketepatan makhraj langsung pada catatan harian saat santri menyetor bacaan.',
    tags: ['Observasi', 'Formatif']
  },
  {
    id: 'act-a-2',
    kategori: 'asesmen',
    judul: 'Rubrik Penilaian Kinerja Praktik Lisan (Skor 0-100)',
    deskripsi: 'Penilaian terstruktur berdasarkan rubrik (Makhraj 40%, Tajwid 40%, Kelancaran & Adab 20%).',
    tags: ['Rubrik', 'Kinerja']
  }
];

export const INITIAL_RPP_TEMPLATES: RppTemplateAdmin[] = [
  {
    id: 'tpl-rpp-1',
    judul: 'RPP Standar 1 Lembar: Pembelajaran Talaqqi & Tahsin Tajwid',
    mataPelajaranNama: 'Tahsin & Tajwid',
    jenjang: 'SD/MI & SMP/MTs',
    fase: 'Fase A (Kelas 1-2)',
    metodeUtama: 'Talaqqi, Musyafahah & Drill Kaidah',
    alokasiWaktu: '2 x 40 Menit (80 Menit)',
    alokasiWaktuDefault: '2 x 40 Menit (80 Menit)',
    capaianPembelajaranId: 'cp-tajwid-1',
    tujuanPembelajaranIds: ['tp-tajwid-1-1'],
    pembukaanDefault: [
      'Guru mengucapkan salam dan membuka majelis dengan basmalah serta doa belajar.',
      'Murojaah klasikal surat pilihan selama 10 menit bersama seluruh santri.',
      'Guru melakukan apersepsi singkat mengenai materi sebelumnya dan menyampaikan tujuan pembelajaran hari ini.'
    ],
    intiDefault: [
      'Guru mendemonstrasikan bacaan ayat/kaidah hukum tajwid dengan makhraj dan mad yang sempurna (musyafahah).',
      'Santri menirukan bacaan guru secara bersama-sama (talaqqi jamā\'ī) sebanyak 3 kali.',
      'Guru memberikan drill latihan lisan per baris dan mengoreksi makhraj santri yang masih kurang tepat.',
      'Santri membaca secara mandiri bergantian (sorogan fardiy) sambil guru memberi catatan perbaikan.'
    ],
    penutupDefault: [
      'Guru dan santri menyimpulkan poin penting hukum bacaan yang dipelajari.',
      'Guru memberikan umpan balik apresiasi dan motivasi murojaah mandiri.',
      'Kelas ditutup dengan doa kafaratul majelis dan salam.'
    ],
    mediaDanAlat: ['Mushaf Al-Qur\'an Standar 15 Baris', 'Papan Tulis & Spidol Warna', 'Skema Gambar Makharijul Huruf'],
    mediaPembelajaran: 'Mushaf Al-Qur\'an Standar 15 Baris, Papan Tulis, Spidol Warna & Skema Makhraj',
    sumberBelajar: ['Modul Tahsin Sistem Halaqah Al-Quran', 'Matan Tuhfatul Athfal', 'Mushaf Madinah Standard'],
    asesmenMetode: ['Asesmen Formatif: Observasi ketepatan makhraj lisan santri', 'Tes sambung bacaan secara acak', 'Keaktifan talaqqi di kelas'],
    asesmenPenilaian: 'Asesmen Formatif: Observasi ketepatan makhraj lisan santri, tes sambung bacaan secara acak, dan keaktifan kelas.',
    catatanAdmin: 'Template percontohan resmi lembaga. Admin & guru dapat menyesuaikan langkah kegiatan dan durasi sesuai kebutuhan halaqah.',
    catatanGuruPreset: 'Perhatikan santri yang masih kesulitan membedakan huruf \'Ain dan Hamzah.',
    statusAktif: true,
    tanggalDibuat: '2026-07-03T08:00:00.000Z'
  },
  {
    id: 'tpl-rpp-2',
    judul: 'RPP Standar 1 Lembar: Bimbingan Tahfidz & Setoran Ziyadah',
    mataPelajaranNama: 'Tahfidz Al-Qur\'an',
    jenjang: 'Semua Jenjang',
    fase: 'Fase D (Kelas 7-9)',
    metodeUtama: 'Tasmi\', Sorogan & Murojaah Berpasangan',
    alokasiWaktu: '2 x 45 Menit (90 Menit)',
    alokasiWaktuDefault: '2 x 45 Menit (90 Menit)',
    capaianPembelajaranId: 'cp-tahfidz-1',
    tujuanPembelajaranIds: ['tp-tahfidz-1-1'],
    pembukaanDefault: [
      'Pembukaan majelis, doa awal belajar dan pembacaan tadarus pembuka 1 lembar.',
      'Presensi santri dan pengecekan target setoran pekanan.',
      'Penjelasan fokus ayat ziyadah baru hari ini.'
    ],
    intiDefault: [
      'Santri melakukan murojaah mandiri dan bimbingan tasmi\' berpasangan dengan teman sebangku (15 menit).',
      'Santri menyetorkan hafalan baru (ziyadah) dan hafalan lama (murojaah) secara giliran di hadapan guru (sorogan).',
      'Guru menyimak, mencatat kesalahan tajwid/kelancaran di aplikasi, dan memberikan bimbingan fashohah langsung.',
      'Santri yang telah menyetor melanjutkan murojaah mandiri dengan target minimal 1 juz per pekan.'
    ],
    penutupDefault: [
      'Evaluasi umum hasil setoran halaqah hari ini oleh ustadz pembimbing.',
      'Pencatatan rekap kemajuan setoran dan pemberian PR ziyadah esok hari.',
      'Doa Khotmil Qur\'an singkat, kafaratul majelis, dan penutup.'
    ],
    mediaDanAlat: ['Mushaf Tahfidz Al-Qur\'an Pojok', 'Lembar Mutaba\'ah Setoran Santri', 'Aplikasi Manajemen Halaqah'],
    mediaPembelajaran: 'Mushaf Tahfidz Al-Qur\'an, Lembar Mutaba\'ah Setoran, Aplikasi Manajemen Halaqah',
    sumberBelajar: ['Mushaf Al-Qur\'an Al-Karim (Majma\' Malik Fahd / Kemenag RI)'],
    asesmenMetode: ['Asesmen Kinerja: Penilaian kelancaran hafalan (0-100)', 'Ketepatan tajwid & makhraj', 'Predikat kelulusan setoran'],
    asesmenPenilaian: 'Asesmen Kinerja: Penilaian kelancaran hafalan (0-100), ketepatan tajwid, waqaf ibtida, dan predikat kelulusan setoran.',
    catatanAdmin: 'Template percontohan resmi halaqah tahfidz. Fokuskan santri pada ketepatan waqaf wal ibtida sebelum menambah ziyadah.',
    catatanGuruPreset: 'Pastikan santri tidak menambah ayat baru sebelum hafalan lama dinyatakan mutqin.',
    statusAktif: true,
    tanggalDibuat: '2026-07-03T08:00:00.000Z'
  },
  {
    id: 'tpl-rpp-3',
    judul: 'RPP Modul Ajar: Fiqih Ibadah & Praktik Thaharah / Shalat',
    mataPelajaranNama: 'Fiqih Ibadah',
    jenjang: 'SMP/MTs & SMA/MA',
    fase: 'Fase D (Kelas 7-9)',
    metodeUtama: 'Demonstrasi, Diskusi Interaktif & Praktik Lapangan',
    alokasiWaktu: '2 x 40 Menit (80 Menit)',
    alokasiWaktuDefault: '2 x 40 Menit (80 Menit)',
    capaianPembelajaranId: 'cp-fiqih-1',
    tujuanPembelajaranIds: ['tp-fiqih-1-1'],
    pembukaanDefault: [
      'Salam pembuka, doa tholabul ilmi, dan apersepsi kasus fiqih kontekstual (misal: bagaimana jika air terbatas saat bepergian).',
      'Guru mengaitkan tema ibadah dengan dalil Al-Qur\'an & As-Sunnah.',
      'Menyampaikan skenario kegiatan praktik hari ini.'
    ],
    intiDefault: [
      'Penjelasan konsep rukun, syarat sah, dan hal-hal yang membatalkan ibadah melalui paparan terstruktur.',
      'Guru mendemonstrasikan gerakan dan bacaan secara langsung di hadapan santri.',
      'Santri dibagi menjadi kelompok kecil untuk mempraktikkan secara bergantian di bawah bimbingan guru.',
      'Tanya jawab dan pembahasan studi kasus fiqih praktis yang sering ditemui santri.'
    ],
    penutupDefault: [
      'Santri membuat kesimpulan poin rukun dan sunnah ibadah yang dipraktikkan.',
      'Guru memberikan konfirmasi kebenaran dan nasehat pentingnya khusyuk dan kebersihan lahir-batin.',
      'Doa penutup majelis dan salam.'
    ],
    mediaDanAlat: ['Kitab Panduan Fiqih Ibadah Praktis', 'Papan Tulis & Spidol', 'Tempat Wudhu & Sajadah'],
    mediaPembelajaran: 'Kitab Fiqih Ibadah, Papan Tulis, Fasilitas Tempat Wudhu / Perlengkapan Shalat',
    sumberBelajar: ['Kitab Safinatun Najah', 'Fiqhul Wadih', 'Matan Abi Syuja\''],
    asesmenMetode: ['Asesmen Praktik: Rubrik ketepatan gerakan dan bacaan', 'Hafalan doa ibadah', 'Uji pemahaman fiqih studi kasus'],
    asesmenPenilaian: 'Asesmen Praktik & Tes Tulis: Rubrik penilaian ketepatan gerakan wudhu/shalat, hafalan bacaan doa, dan tes esai singkat.',
    catatanAdmin: 'Template modul ajar praktik ibadah. Wajib mengutamakan ketertiban praktik langsung oleh santri.',
    catatanGuruPreset: 'Bimbing santri yang masih kurang teliti saat membasuh tumit dan siku ketika berwudhu.',
    statusAktif: true,
    tanggalDibuat: '2026-07-03T08:00:00.000Z'
  }
];

export const INITIAL_GURU_RPP_LIST: GuruRppDokumen[] = [
  {
    id: 'rpp-guru-sample-1',
    guruId: 'gru-1',
    guruNama: 'Ustadz Abdullah Faqih, S.Pd.I',
    tahunAjaran: '2025/2026',
    semester: 'Ganjil',
    mataPelajaranNama: 'Tahsin & Tajwid',
    halaqahId: 'hq-1',
    halaqahNama: 'Halaqah Abu Bakar Ash-Shiddiq',
    kelasNama: 'Kelas 7 SMP',
    jenjang: 'SMP/MTs',
    pertemuanKe: 1,
    tanggalPelaksanaan: '2026-07-10',
    alokasiWaktu: '2 x 40 Menit',
    cpId: 'cp-tajwid-1',
    cpKode: 'CP-TAJ-01',
    cpDeskripsi: 'Santri mampu mengenali, melafalkan, dan membedakan tempat-tempat keluarnya huruf hijaiyah Al-Halq.',
    tpIds: ['tp-tajwid-1-1'],
    tpList: [
      {
        kodeTP: 'TP-1.1',
        judul: 'Melafalkan 6 Huruf Halqi dengan Tepat',
        deskripsi: 'Melalui metode talaqqi dan musyafahah, santri dapat melafalkan 6 huruf Al-Halq (Hamzah, Ha\', \'Ain, Ha, Ghain, Kha\') sesuai makhraj yang benar.'
      }
    ],
    materiPokok: 'Makharijul Huruf Tenggorokan (Al-Halq): Hamzah, Ha\', \'Ain, Ha, Ghain, Kha\'',
    babNama: 'Makharijul Huruf Al-Halq',
    metodePembelajaran: 'Talaqqi, Musyafahah & Drill Per Baris',
    kegiatanPendahuluan: '1. Salam dan doa pembuka majelis Al-Qur\'an bersama seluruh santri.\n2. Murojaah Surat Al-Fatihah dan An-Nas secara tartil (10 Menit).\n3. Apersepsi: Guru menjelaskan pentingnya kejelasan makhraj agar makna ayat tidak berubah.',
    kegiatanInti: '1. Guru melafalkan masing-masing huruf halq dalam keadaan fathah, kasrah, dhammah, dan sukun (ءَ إِ أُ أserver, ع coups).\n2. Santri menirukan bersama-sama (talaqqi) 5 kali putaran.\n3. Santri maju bergiliran membaca contoh kalimat pada modul hal 14-16.\n4. Guru memberikan koreksi fonetik langsung pada perbedaan makhraj huruf Ha tipis (هـ) dan Ha tebal bersih (ح).',
    kegiatanPenutup: '1. Guru menunjuk 2 santri untuk mendemonstrasikan pelafalan huruf \'Ain dan Hamzah.\n2. Kesimpulan ringkas dan pemberian tugas latihan mandiri di asrama.\n3. Ditutup doa kafaratul majelis.',
    mediaDanSumber: 'Mushaf Madinah, Buku Modul Tahsin Jilid 1, Papan Tulis & Skema Rongga Tenggorokan',
    asesmenRencana: 'Observasi lisan individual saat sorogan (Rubrik: Makhraj 50%, Kelancaran 30%, Sikap 20%).',
    status: 'Terlaksana',
    catatanRefleksiGuru: 'Alhamdulillah mayoritas santri (85%) sudah bisa membedakan makhraj huruf Ha dan \'Ain. Ada 2 santri yang masih perlu bimbingan khusus pada makhraj Kha\' agar tidak terlalu tercekik.',
    ketercapaianSantri: 'Mayoritas Tercapai',
    tanggalDibuat: '2026-07-09T10:00:00.000Z',
    updatedAt: '2026-07-10T11:30:00.000Z'
  }
];

export const INITIAL_PILOT_CONFIG: PilotTestingConfig = {
  id: 'pilot_testing_config',
  isGlobalEnabled: false, // Default: fitur hanya terbuka untuk guru yang dipilih (pilot testing)
  whitelistGuruIds: ['gru-1', 'gru-2'], // Default: Ustadz Abdullah & Ustadz Ridwan
  catatanAdmin: 'Fitur Administrasi Guru (CP, TP, RPP) sedang dalam tahap uji coba terbatas (Pilot Project). Hanya guru terpilih yang dapat mengakses menu penyusunan RPP.',
  updatedAt: '2026-07-01T08:00:00.000Z'
};
