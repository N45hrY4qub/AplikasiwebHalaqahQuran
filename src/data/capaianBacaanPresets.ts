import { CapaianBacaanAyatConfig } from '../types';

export interface SuratMeta {
  nomor: number;
  nama: string;
  namaArab: string;
  jumlahAyat: number;
}

export const DAFTAR_114_SURAT: SuratMeta[] = [
  { nomor: 1, nama: 'Al-Fatihah', namaArab: 'الفاتحة', jumlahAyat: 7 },
  { nomor: 2, nama: 'Al-Baqarah', namaArab: 'البقرة', jumlahAyat: 286 },
  { nomor: 3, nama: 'Ali \'Imran', namaArab: 'آل عمران', jumlahAyat: 200 },
  { nomor: 4, nama: 'An-Nisa\'', namaArab: 'النساء', jumlahAyat: 176 },
  { nomor: 5, nama: 'Al-Ma\'idah', namaArab: 'المائدة', jumlahAyat: 120 },
  { nomor: 6, nama: 'Al-An\'am', namaArab: 'الأنعام', jumlahAyat: 165 },
  { nomor: 7, nama: 'Al-A\'raf', namaArab: 'الأعراف', jumlahAyat: 206 },
  { nomor: 8, nama: 'Al-Anfal', namaArab: 'الأنفال', jumlahAyat: 75 },
  { nomor: 9, nama: 'At-Taubah', namaArab: 'التوبة', jumlahAyat: 129 },
  { nomor: 10, nama: 'Yunus', namaArab: 'يونس', jumlahAyat: 109 },
  { nomor: 11, nama: 'Hud', namaArab: 'هود', jumlahAyat: 123 },
  { nomor: 12, nama: 'Yusuf', namaArab: 'يوسف', jumlahAyat: 111 },
  { nomor: 13, nama: 'Ar-Ra\'d', namaArab: 'الرعد', jumlahAyat: 43 },
  { nomor: 14, nama: 'Ibrahim', namaArab: 'إبراهيم', jumlahAyat: 52 },
  { nomor: 15, nama: 'Al-Hijr', namaArab: 'الحجر', jumlahAyat: 99 },
  { nomor: 16, nama: 'An-Nahl', namaArab: 'النحل', jumlahAyat: 128 },
  { nomor: 17, nama: 'Al-Isra\'', namaArab: 'الإسراء', jumlahAyat: 111 },
  { nomor: 18, nama: 'Al-Kahf', namaArab: 'الكهف', jumlahAyat: 110 },
  { nomor: 19, nama: 'Maryam', namaArab: 'مريم', jumlahAyat: 98 },
  { nomor: 20, nama: 'Thaha', namaArab: 'طه', jumlahAyat: 135 },
  { nomor: 21, nama: 'Al-Anbiya\'', namaArab: 'الأنبياء', jumlahAyat: 112 },
  { nomor: 22, nama: 'Al-Hajj', namaArab: 'الحج', jumlahAyat: 78 },
  { nomor: 23, nama: 'Al-Mu\'minun', namaArab: 'المؤمنون', jumlahAyat: 118 },
  { nomor: 24, nama: 'An-Nur', namaArab: 'النور', jumlahAyat: 64 },
  { nomor: 25, nama: 'Al-Furqan', namaArab: 'الفرقان', jumlahAyat: 77 },
  { nomor: 26, nama: 'Asy-Syu\'ara\'', namaArab: 'الشعراء', jumlahAyat: 227 },
  { nomor: 27, nama: 'An-Naml', namaArab: 'النمل', jumlahAyat: 93 },
  { nomor: 28, nama: 'Al-Qashash', namaArab: 'القصص', jumlahAyat: 88 },
  { nomor: 29, nama: 'Al-\'Ankabut', namaArab: 'العنكبوت', jumlahAyat: 69 },
  { nomor: 30, nama: 'Ar-Rum', namaArab: 'الروم', jumlahAyat: 60 },
  { nomor: 31, nama: 'Luqman', namaArab: 'لقمان', jumlahAyat: 34 },
  { nomor: 32, nama: 'As-Sajdah', namaArab: 'السجدة', jumlahAyat: 30 },
  { nomor: 33, nama: 'Al-Ahzab', namaArab: 'الأحزاب', jumlahAyat: 73 },
  { nomor: 34, nama: 'Saba\'', namaArab: 'سبأ', jumlahAyat: 54 },
  { nomor: 35, nama: 'Fathir', namaArab: 'فاطر', jumlahAyat: 45 },
  { nomor: 36, nama: 'Yasin', namaArab: 'يس', jumlahAyat: 83 },
  { nomor: 37, nama: 'Ash-Shaffat', namaArab: 'الصافات', jumlahAyat: 182 },
  { nomor: 38, nama: 'Shad', namaArab: 'ص', jumlahAyat: 88 },
  { nomor: 39, nama: 'Az-Zumar', namaArab: 'الزمر', jumlahAyat: 75 },
  { nomor: 40, nama: 'Ghafir', namaArab: 'غافر', jumlahAyat: 85 },
  { nomor: 41, nama: 'Fushshilat', namaArab: 'فصلت', jumlahAyat: 54 },
  { nomor: 42, nama: 'Asy-Syura', namaArab: 'الشورى', jumlahAyat: 53 },
  { nomor: 43, nama: 'Az-Zukhruf', namaArab: 'الزخرف', jumlahAyat: 89 },
  { nomor: 44, nama: 'Ad-Dukhan', namaArab: 'الدخان', jumlahAyat: 59 },
  { nomor: 45, nama: 'Al-Jatsiyah', namaArab: 'الجاثية', jumlahAyat: 37 },
  { nomor: 46, nama: 'Al-Ahqaf', namaArab: 'الأحقاف', jumlahAyat: 35 },
  { nomor: 47, nama: 'Muhammad', namaArab: 'محمد', jumlahAyat: 38 },
  { nomor: 48, nama: 'Al-Fath', namaArab: 'الفتح', jumlahAyat: 29 },
  { nomor: 49, nama: 'Al-Hujurat', namaArab: 'الحجرات', jumlahAyat: 18 },
  { nomor: 50, nama: 'Qaf', namaArab: 'ق', jumlahAyat: 45 },
  { nomor: 51, nama: 'Adz-Dzariyat', namaArab: 'الذاريات', jumlahAyat: 60 },
  { nomor: 52, nama: 'Ath-Thur', namaArab: 'الطور', jumlahAyat: 49 },
  { nomor: 53, nama: 'An-Najm', namaArab: 'النجم', jumlahAyat: 62 },
  { nomor: 54, nama: 'Al-Qamar', namaArab: 'القمر', jumlahAyat: 55 },
  { nomor: 55, nama: 'Ar-Rahman', namaArab: 'الرحمن', jumlahAyat: 78 },
  { nomor: 56, nama: 'Al-Waqi\'ah', namaArab: 'الواقعة', jumlahAyat: 96 },
  { nomor: 57, nama: 'Al-Hadid', namaArab: 'الحديد', jumlahAyat: 29 },
  { nomor: 58, nama: 'Al-Mujadilah', namaArab: 'المجادلة', jumlahAyat: 22 },
  { nomor: 59, nama: 'Al-Hasyr', namaArab: 'الحشر', jumlahAyat: 24 },
  { nomor: 60, nama: 'Al-Mumtahanah', namaArab: 'الممتحنة', jumlahAyat: 13 },
  { nomor: 61, nama: 'Ash-Shaff', namaArab: 'الصف', jumlahAyat: 14 },
  { nomor: 62, nama: 'Al-Jumu\'ah', namaArab: 'الجمعة', jumlahAyat: 11 },
  { nomor: 63, nama: 'Al-Munafiqun', namaArab: 'المنافقون', jumlahAyat: 11 },
  { nomor: 64, nama: 'At-Taghabun', namaArab: 'التغابن', jumlahAyat: 18 },
  { nomor: 65, nama: 'Ath-Thalaq', namaArab: 'الطلاق', jumlahAyat: 12 },
  { nomor: 66, nama: 'At-Tahrim', namaArab: 'التحريم', jumlahAyat: 12 },
  { nomor: 67, nama: 'Al-Mulk', namaArab: 'الملك', jumlahAyat: 30 },
  { nomor: 68, nama: 'Al-Qalam', namaArab: 'القلم', jumlahAyat: 52 },
  { nomor: 69, nama: 'Al-Haqqah', namaArab: 'الحاقة', jumlahAyat: 52 },
  { nomor: 70, nama: 'Al-Ma\'arij', namaArab: 'المعارج', jumlahAyat: 44 },
  { nomor: 71, nama: 'Nuh', namaArab: 'نوح', jumlahAyat: 28 },
  { nomor: 72, nama: 'Al-Jinn', namaArab: 'الجن', jumlahAyat: 28 },
  { nomor: 73, nama: 'Al-Muzzammil', namaArab: 'المزمل', jumlahAyat: 20 },
  { nomor: 74, nama: 'Al-Muddatstsir', namaArab: 'المدثر', jumlahAyat: 56 },
  { nomor: 75, nama: 'Al-Qiyamah', namaArab: 'القيامة', jumlahAyat: 40 },
  { nomor: 76, nama: 'Al-Insan', namaArab: 'الإنسان', jumlahAyat: 31 },
  { nomor: 77, nama: 'Al-Mursalat', namaArab: 'المرسلات', jumlahAyat: 50 },
  { nomor: 78, nama: 'An-Naba\'', namaArab: 'النبأ', jumlahAyat: 40 },
  { nomor: 79, nama: 'An-Nazi\'at', namaArab: 'النازعات', jumlahAyat: 46 },
  { nomor: 80, nama: '\'Abasa', namaArab: 'عبس', jumlahAyat: 42 },
  { nomor: 81, nama: 'At-Takwir', namaArab: 'التكوير', jumlahAyat: 29 },
  { nomor: 82, nama: 'Al-Infithar', namaArab: 'الانفطار', jumlahAyat: 19 },
  { nomor: 83, nama: 'Al-Muthaffifin', namaArab: 'المطففين', jumlahAyat: 36 },
  { nomor: 84, nama: 'Al-Insyiqaq', namaArab: 'الانشقاق', jumlahAyat: 25 },
  { nomor: 85, nama: 'Al-Buruj', namaArab: 'البروج', jumlahAyat: 22 },
  { nomor: 86, nama: 'Ath-Thariq', namaArab: 'الطارق', jumlahAyat: 17 },
  { nomor: 87, nama: 'Al-A\'la', namaArab: 'الأعلى', jumlahAyat: 19 },
  { nomor: 88, nama: 'Al-Ghasyiyah', namaArab: 'الغاشية', jumlahAyat: 26 },
  { nomor: 89, nama: 'Al-Fajr', namaArab: 'الفجر', jumlahAyat: 30 },
  { nomor: 90, nama: 'Al-Balad', namaArab: 'البلد', jumlahAyat: 20 },
  { nomor: 91, nama: 'Asy-Syams', namaArab: 'الشمس', jumlahAyat: 15 },
  { nomor: 92, nama: 'Al-Lail', namaArab: 'الليل', jumlahAyat: 21 },
  { nomor: 93, nama: 'Adh-Dhuha', namaArab: 'الضحى', jumlahAyat: 11 },
  { nomor: 94, nama: 'Asy-Syarh', namaArab: 'الشرح', jumlahAyat: 8 },
  { nomor: 95, nama: 'At-Tin', namaArab: 'التين', jumlahAyat: 8 },
  { nomor: 96, nama: 'Al-\'Alaq', namaArab: 'العلق', jumlahAyat: 19 },
  { nomor: 97, nama: 'Al-Qadr', namaArab: 'القدر', jumlahAyat: 5 },
  { nomor: 98, nama: 'Al-Bayyinah', namaArab: 'البينة', jumlahAyat: 8 },
  { nomor: 99, nama: 'Az-Zalzalah', namaArab: 'الزلزلة', jumlahAyat: 8 },
  { nomor: 100, nama: 'Al-\'Adiyat', namaArab: 'العاديات', jumlahAyat: 11 },
  { nomor: 101, nama: 'Al-Qari\'ah', namaArab: 'القارعة', jumlahAyat: 11 },
  { nomor: 102, nama: 'At-Takatsur', namaArab: 'التكاثر', jumlahAyat: 8 },
  { nomor: 103, nama: 'Al-\'Ashr', namaArab: 'العصر', jumlahAyat: 3 },
  { nomor: 104, nama: 'Al-Humazah', namaArab: 'الهمزة', jumlahAyat: 9 },
  { nomor: 105, nama: 'Al-Fil', namaArab: 'الفيل', jumlahAyat: 5 },
  { nomor: 106, nama: 'Quraisy', namaArab: 'قريش', jumlahAyat: 4 },
  { nomor: 107, nama: 'Al-Ma\'un', namaArab: 'الماعون', jumlahAyat: 7 },
  { nomor: 108, nama: 'Al-Kautsar', namaArab: 'الكوثر', jumlahAyat: 3 },
  { nomor: 109, nama: 'Al-Kafirun', namaArab: 'الكافرون', jumlahAyat: 6 },
  { nomor: 110, nama: 'An-Nashr', namaArab: 'النصر', jumlahAyat: 3 },
  { nomor: 111, nama: 'Al-Lahab', namaArab: 'اللهب', jumlahAyat: 5 },
  { nomor: 112, nama: 'Al-Ikhlas', namaArab: 'الإخلاص', jumlahAyat: 4 },
  { nomor: 113, nama: 'Al-Falaq', namaArab: 'الفلق', jumlahAyat: 5 },
  { nomor: 114, nama: 'An-Nas', namaArab: 'الناس', jumlahAyat: 6 }
];

export const DEFAULT_PRESET_CAPAIAN_BACAAN: CapaianBacaanAyatConfig[] = [
  // Surah Al-Fatihah Ayat 1
  {
    id: 'cfg-1-1',
    suratNomor: 1,
    suratNama: 'Al-Fatihah',
    nomorAyat: 1,
    teksArab: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    targets: [
      { id: 't-1-1-1', kataLafaz: 'بِسْمِ', kataUrut: 1, unsur: 'س (sin)', target: 'Tidak memantulkan huruf sin (س) sukun dan mengalirkan sifat hams & shafir.', kategoriKesalahanNama: 'Sifat Huruf', subKategoriKesalahanNama: 'Memantulkan huruf' },
      { id: 't-1-1-2', kataLafaz: 'بِسْمِ', kataUrut: 1, unsur: 'م (mim)', target: 'Tidak melafalkan mim (م) kasrah dengan dengung.', kategoriKesalahanNama: 'Ghunnah Musyaddadah', subKategoriKesalahanNama: 'Mim' },
      { id: 't-1-1-3', kataLafaz: 'اللَّهِ', kataUrut: 2, unsur: 'هـ (ha)', target: 'Melafalkan ha (هـ) pada lafdzul jalalah dari pangkal tenggorokan tanpa memudar.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'هـ (Ha)' },
      { id: 't-1-1-4', kataLafaz: 'الرَّحْمَٰنِ', kataUrut: 3, unsur: 'ر (ra)', target: 'Menebalkan ra (ر) tasydid (tafkhim) tanpa getaran (takrir) berlebihan.', kategoriKesalahanNama: 'Tafkhim', subKategoriKesalahanNama: 'Ra' },
      { id: 't-1-1-5', kataLafaz: 'الرَّحِيمِ', kataUrut: 4, unsur: 'ح (ha)', target: 'Tidak melafalkan ha (ح) seperti kha (خ) atau ha (هـ), dan mengalirkan nafas hams.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ح (Ha)' }
    ],
    keterangan: 'Basmalah Al-Fatihah'
  },
  // Surah Al-Fatihah Ayat 2 (Sesuai Screenshot User)
  {
    id: 'cfg-1-2',
    suratNomor: 1,
    suratNama: 'Al-Fatihah',
    nomorAyat: 2,
    teksArab: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    targets: [
      { id: 't-1-2-1', kataLafaz: 'الْحَمْدُ', kataUrut: 1, unsur: 'ل (lam)', target: 'Tidak memantulkan huruf lam (ل) sukun.', kategoriKesalahanNama: 'Sifat Huruf', subKategoriKesalahanNama: 'Memantulkan huruf' },
      { id: 't-1-2-2', kataLafaz: 'رَبِّ', kataUrut: 3, unsur: 'ب (ba)', target: 'Tidak melafalkan huruf ba (ب) dengan dengung.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ب (Ba)' },
      { id: 't-1-2-3', kataLafaz: 'لِلَّهِ', kataUrut: 2, unsur: 'ل (lam)', target: 'Tidak melafalkan huruf lam (ل) kasrah dengan dengung.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ل (Lam)' },
      { id: 't-1-2-4', kataLafaz: 'الْحَمْدُ', kataUrut: 1, unsur: 'ح (ha)', target: 'Tidak melafalkan huruf ha (ح) seperti kha (خ) atau ha (هـ).', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ح (Ha)' },
      { id: 't-1-2-5', kataLafaz: 'لِلَّهِ', kataUrut: 2, unsur: 'هـ (ha)', target: 'Tidak melafalkan huruf ha (هـ) seperti ha (ح).', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'هـ (Ha)' },
      { id: 't-1-2-6', kataLafaz: 'الْعَالَمِينَ', kataUrut: 4, unsur: 'ع (ain)', target: 'Tidak melafalkan huruf ‘ain (ع) seperti hamzah (ء).', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ع (\'Ain)' }
    ],
    keterangan: 'Ayat 2 Surah Al-Fatihah (Contoh Standar Screenshot)'
  },
  // Surah Al-Fatihah Ayat 3
  {
    id: 'cfg-1-3',
    suratNomor: 1,
    suratNama: 'Al-Fatihah',
    nomorAyat: 3,
    teksArab: 'الرَّحْمَٰنِ الرَّحِيمِ',
    targets: [
      { id: 't-1-3-1', kataLafaz: 'الرَّحْمَٰنِ', kataUrut: 1, unsur: 'ر (ra)', target: 'Menebalkan ra (ر) tasydid tanpa getaran berlebihan.', kategoriKesalahanNama: 'Tafkhim', subKategoriKesalahanNama: 'Ra' },
      { id: 't-1-3-2', kataLafaz: 'الرَّحْمَٰنِ', kataUrut: 1, unsur: 'ح (ha)', target: 'Menjelaskan hams dan rakhawah huruf ha (ح) sukun di tengah tenggorokan.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ح (Ha)' },
      { id: 't-1-3-3', kataLafaz: 'الرَّحْمَٰنِ', kataUrut: 1, unsur: 'م (mad)', target: 'Memanjangkan mad thabi\'i 2 harakat pada Ar-Rahman secara tepat.', kategoriKesalahanNama: 'Keliru Mad Asli (Pendek/Panjang)', subKategoriKesalahanNama: 'Mad Asli' },
      { id: 't-1-3-4', kataLafaz: 'الرَّحِيمِ', kataUrut: 2, unsur: 'م (mim)', target: 'Menutup bibir dengan sempurna pada mim sukun sukun waqaf tanpa dengung berlebih.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'م (Mim)' }
    ],
    keterangan: 'Ayat 3 Surah Al-Fatihah'
  },
  // Surah Al-Fatihah Ayat 4
  {
    id: 'cfg-1-4',
    suratNomor: 1,
    suratNama: 'Al-Fatihah',
    nomorAyat: 4,
    teksArab: 'مَالِكِ يَوْمِ الدِّينِ',
    targets: [
      { id: 't-1-4-1', kataLafaz: 'مَالِكِ', kataUrut: 1, unsur: 'م (mad)', target: 'Memanjangkan mad thabi\'i pada mim (مَا) tepat 2 harakat.', kategoriKesalahanNama: 'Keliru Mad Asli (Pendek/Panjang)', subKategoriKesalahanNama: 'Mad Asli' },
      { id: 't-1-4-2', kataLafaz: 'مَالِكِ', kataUrut: 1, unsur: 'ك (kaf)', target: 'Menjelaskan kasrah pada kaf (كِ) tanpa dengung dan tanpa hams berlebihan saat berharakat.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ك (Kaf)' },
      { id: 't-1-4-3', kataLafaz: 'يَوْمِ', kataUrut: 2, unsur: 'و (wawu)', target: 'Membaca wawu layyin pada يَوْمِ secara lembut tanpa tersendat atau memantul.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'و (Waw)' },
      { id: 't-1-4-4', kataLafaz: 'الدِّينِ', kataUrut: 3, unsur: 'د (dal)', target: 'Mentasydidkan dal (الدِّينِ) tanpa mendengung dan tanpa desis.', kategoriKesalahanNama: 'Tasydid Hilang / Bertambah', subKategoriKesalahanNama: 'Tasydid' }
    ],
    keterangan: 'Ayat 4 Surah Al-Fatihah'
  },
  // Surah Al-Fatihah Ayat 5
  {
    id: 'cfg-1-5',
    suratNomor: 1,
    suratNama: 'Al-Fatihah',
    nomorAyat: 5,
    teksArab: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    targets: [
      { id: 't-1-5-1', kataLafaz: 'إِيَّاكَ', kataUrut: 1, unsur: 'ي (ya)', target: 'Menekan ya tasydid (nabr lembut) pada إِيَّاكَ tanpa memutus suara.', kategoriKesalahanNama: 'Tasydid Hilang / Bertambah', subKategoriKesalahanNama: 'Tasydid' },
      { id: 't-1-5-2', kataLafaz: 'نَعْبُدُ', kataUrut: 2, unsur: 'ع (ain)', target: 'Menjelaskan makhraj ‘ain (ع) sukun dari tengah tenggorokan pada نَعْبُدُ tanpa pantulan.', kategoriKesalahanNama: 'Sifat Huruf', subKategoriKesalahanNama: 'Memantulkan huruf' },
      { id: 't-1-5-3', kataLafaz: 'نَعْبُدُ', kataUrut: 2, unsur: 'د (dal)', target: 'Menjelaskan dhammah pada dal (نَعْبُدُ) tanpa condong ke bunyi wawu sukun.', kategoriKesalahanNama: 'Salah Harakat / Bunyi Vokal', subKategoriKesalahanNama: 'Harakat' },
      { id: 't-1-5-4', kataLafaz: 'نَسْتَعِينُ', kataUrut: 4, unsur: 'س (sin)', target: 'Mengalirkan nafas hams dan shafir pada sin sukun di نَسْتَعِينُ.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'س (Sin)' }
    ],
    keterangan: 'Ayat 5 Surah Al-Fatihah'
  },
  // Surah Al-Fatihah Ayat 6
  {
    id: 'cfg-1-6',
    suratNomor: 1,
    suratNama: 'Al-Fatihah',
    nomorAyat: 6,
    teksArab: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    targets: [
      { id: 't-1-6-1', kataLafaz: 'اهْدِنَا', kataUrut: 1, unsur: 'هـ (ha)', target: 'Mengalirkan nafas pada ha (هـ) sukun di اهْدِنَا dari pangkal tenggorokan.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'هـ (Ha)' },
      { id: 't-1-6-2', kataLafaz: 'الصِّرَاطَ', kataUrut: 2, unsur: 'ص (shad)', target: 'Menebalkan shad kasrah (الصِّـ) dengan ithbaq & isti\'la tanpa mendengung.', kategoriKesalahanNama: 'Tafkhim', subKategoriKesalahanNama: 'ص (Shad)' },
      { id: 't-1-6-3', kataLafaz: 'الصِّرَاطَ', kataUrut: 2, unsur: 'ط (tha)', target: 'Menebalkan tha fathah (ـرَاطَ) tingkat tafkhim tinggi tanpa monyong berlebih.', kategoriKesalahanNama: 'Tafkhim', subKategoriKesalahanNama: 'ط (Tha)' },
      { id: 't-1-6-4', kataLafaz: 'الْمُسْتَقِيمَ', kataUrut: 3, unsur: 'ق (qaf)', target: 'Menjaga ketebalan qaf kasrah (الْمُسْتَقِيمَ) secara proporsional tanpa memantul.', kategoriKesalahanNama: 'Sifat Huruf', subKategoriKesalahanNama: 'Memantulkan huruf' }
    ],
    keterangan: 'Ayat 6 Surah Al-Fatihah'
  },
  // Surah Al-Fatihah Ayat 7
  {
    id: 'cfg-1-7',
    suratNomor: 1,
    suratNama: 'Al-Fatihah',
    nomorAyat: 7,
    teksArab: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    targets: [
      { id: 't-1-7-1', kataLafaz: 'الَّذِينَ', kataUrut: 2, unsur: 'ذ (dzal)', target: 'Mengeluarkan ujung lidah pada dzal (الَّذِينَ) tanpa berdesis seperti zay.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ذ (Dzal)' },
      { id: 't-1-7-2', kataLafaz: 'أَنْعَمْتَ', kataUrut: 3, unsur: 'ن (nun)', target: 'Melafalkan izhar halqi pada أَنْعَمْتَ tanpa dengung dan tanpa saktah/pantulan.', kategoriKesalahanNama: 'Izhar Halqi', subKategoriKesalahanNama: 'Nun' },
      { id: 't-1-7-3', kataLafaz: 'غَيْرِ', kataUrut: 5, unsur: 'غ (ghain)', target: 'Mengalirkan suara ghain (غَيْرِ / الْمَغْـ) dengan isti\'la & rakhawah tanpa memantul.', kategoriKesalahanNama: 'Sifat Huruf', subKategoriKesalahanNama: 'Memantulkan huruf' },
      { id: 't-1-7-4', kataLafaz: 'الْمَغْضُوبِ', kataUrut: 6, unsur: 'ض (dhad)', target: 'Menjelaskan makhraj tepi lidah dan sifat istithalah pada dhad sukun di الْمَغْضُوبِ.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ض (Dhad)' },
      { id: 't-1-7-5', kataLafaz: 'عَلَيْهِمْ', kataUrut: 4, unsur: 'م (mim)', target: 'Izhar syafawi pada عَلَيْهِمْ غَيْرِ dan عَلَيْهِمْ وَلَا tanpa dengung.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'م (Mim)' },
      { id: 't-1-7-6', kataLafaz: 'الضَّالِّينَ', kataUrut: 9, unsur: 'ل (mad)', target: 'Memanjangkan Mad Lazim Kalimi Mutsaqqal 6 harakat penuh pada الضَّالِّينَ disertai tasydid lam.', kategoriKesalahanNama: 'Mad Wajib Muttashil', subKategoriKesalahanNama: 'Mad Lazim' }
    ],
    keterangan: 'Ayat 7 Surah Al-Fatihah'
  },
  // Surah Al-Ikhlas Ayat 1-4
  {
    id: 'cfg-112-1',
    suratNomor: 112,
    suratNama: 'Al-Ikhlas',
    nomorAyat: 1,
    teksArab: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    targets: [
      { id: 't-112-1-1', kataLafaz: 'قُلْ', kataUrut: 1, unsur: 'ق (qaf)', target: 'Menjelaskan tebal qaf (قُلْ) dari pangkal lidah terdalam tanpa tertukar kaf.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ق (Qaf)' },
      { id: 't-112-1-2', kataLafaz: 'قُلْ', kataUrut: 1, unsur: 'ل (lam)', target: 'Tidak memantulkan lam sukun pada قُلْ.', kategoriKesalahanNama: 'Sifat Huruf', subKategoriKesalahanNama: 'Memantulkan huruf' },
      { id: 't-112-1-3', kataLafaz: 'أَحَدٌ', kataUrut: 4, unsur: 'ح (ha)', target: 'Menjelaskan ha murni (أَحَدٌ) dari tengah tenggorokan tanpa desah kha.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ح (Ha)' },
      { id: 't-112-1-4', kataLafaz: 'أَحَدٌ', kataUrut: 4, unsur: 'د (dal)', target: 'Qalqalah kubra jelas pada dal sukun waqaf tanpa dengung.', kategoriKesalahanNama: 'Qalqalah Kubra', subKategoriKesalahanNama: 'Dal' }
    ],
    keterangan: 'Surah Al-Ikhlas Ayat 1'
  },
  {
    id: 'cfg-112-2',
    suratNomor: 112,
    suratNama: 'Al-Ikhlas',
    nomorAyat: 2,
    teksArab: 'اللَّهُ الصَّمَدُ',
    targets: [
      { id: 't-112-2-1', kataLafaz: 'الصَّمَدُ', kataUrut: 2, unsur: 'ص (shad)', target: 'Menebalkan shad tasydid (الصَّـ) dengan ithbaq dan shafir.', kategoriKesalahanNama: 'Tafkhim', subKategoriKesalahanNama: 'ص (Shad)' },
      { id: 't-112-2-2', kataLafaz: 'الصَّمَدُ', kataUrut: 2, unsur: 'د (dal)', target: 'Qalqalah kubra pada dal sukun waqaf.', kategoriKesalahanNama: 'Qalqalah Kubra', subKategoriKesalahanNama: 'Dal' }
    ],
    keterangan: 'Surah Al-Ikhlas Ayat 2'
  },
  {
    id: 'cfg-112-3',
    suratNomor: 112,
    suratNama: 'Al-Ikhlas',
    nomorAyat: 3,
    teksArab: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
    targets: [
      { id: 't-112-3-1', kataLafaz: 'لَمْ', kataUrut: 1, unsur: 'م (mim)', target: 'Izhar syafawi pada لَمْ يَلِدْ tanpa dengung.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'م (Mim)' },
      { id: 't-112-3-2', kataLafaz: 'يَلِدْ', kataUrut: 2, unsur: 'د (dal)', target: 'Qalqalah sughra pada dal sukun di tengah kalimat (يَلِدْ وَلَمْ).', kategoriKesalahanNama: 'Qalqalah Sughra', subKategoriKesalahanNama: 'Dal' },
      { id: 't-112-3-3', kataLafaz: 'يُولَدْ', kataUrut: 4, unsur: 'د (dal)', target: 'Qalqalah kubra pada dal sukun di akhir waqaf (يُولَدْ).', kategoriKesalahanNama: 'Qalqalah Kubra', subKategoriKesalahanNama: 'Dal' }
    ],
    keterangan: 'Surah Al-Ikhlas Ayat 3'
  },
  {
    id: 'cfg-112-4',
    suratNomor: 112,
    suratNama: 'Al-Ikhlas',
    nomorAyat: 4,
    teksArab: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    targets: [
      { id: 't-112-4-1', kataLafaz: 'يَكُن', kataUrut: 2, unsur: 'ن (nun) / ل (lam)', target: 'Idgham bilaghunnah pada يَكُن لَّهُ tanpa dengung.', kategoriKesalahanNama: 'Idgham Bilaghunnah', subKategoriKesalahanNama: 'Nun' },
      { id: 't-112-4-2', kataLafaz: 'كُفُوًا', kataUrut: 4, unsur: 'ف (fa)', target: 'Menjelaskan dhammah pada fa (كُفُوًا) dan tidak membaca sukun (bukan kufuwan).', kategoriKesalahanNama: 'Salah Harakat / Bunyi Vokal', subKategoriKesalahanNama: 'Harakat' },
      { id: 't-112-4-3', kataLafaz: 'أَحَدٌ', kataUrut: 5, unsur: 'ء (hamzah) / ح (ha)', target: 'Membedakan hamzah dan ha pada أَحَدٌ serta qalqalah kubra dal.', kategoriKesalahanNama: 'Makhraj & Sifat Huruf', subKategoriKesalahanNama: 'ح (Ha)' }
    ],
    keterangan: 'Surah Al-Ikhlas Ayat 4'
  }
];
