# AplikasiHalaqah
Sistem Informasi Manajemen & Monitoring Halaqah Al-Quran
# Sistem Informasi Halaqah Al-Qur'an (Web App)

Aplikasi berbasis web untuk memantau kegiatan halaqah Al-Qur'an, setoran hafalan (tahfidz), bacaan (tilawah), absensi, kurikulum & modul, syahadah, serta administrasi lembaga pendidikan Al-Qur'an.

---

## Cara Menggunakan Aplikasi Ini (Untuk Lembaga / Pengguna Baru)

### 1. Salin Template ke Akun GitHub Anda
1. Klik tombol hijau **Use this template** di pojok kanan atas halaman repositori ini, lalu pilih **Create a new repository**.
2. Isi nama repositori baru Anda (misalnya `AplikasiHalaqahLembaga`), atur visibilitas sesuai kebutuhan, lalu klik **Create repository**.

### 2. Impor ke Google AI Studio
1. Buka [Google AI Studio](https://google.com) dan masuk menggunakan akun Google Anda.
2. Pilih opsi untuk membuat atau mengimpor aplikasi dari **GitHub**, lalu pilih repositori yang baru saja Anda buat.
3. Tunggu hingga proses instalasi dependensi (`npm install`) dan kompilasi selesai, hingga jendela pratinjau (*Preview*) aplikasi terbuka.

### 3. Login Pertama Kali ke Konsol Administrator
Setelah aplikasi terbuka pada jendela pratinjau, gunakan kredensial bawaan berikut untuk masuk sebagai Administrator utama:
* **Email:** `admin@sistem.id`
* **Password:** `admin123`

> **Penting:** Segera ubah kata sandi bawaan atau buat akun Administrator baru menggunakan email resmi pengelola lembaga Anda melalui menu **Pengguna** setelah berhasil masuk agar akses sistem tetap aman.

### 4. Hubungkan Proyek Firebase Sendiri (Untuk Penyimpanan Data Permanen)
Agar data santri, guru, dan administrasi lembaga Anda tersimpan secara mandiri di database milik sendiri:
1. Buka [Firebase Console](https://google.com) dan klik **Add project** (Buat proyek baru).
2. Daftarkan aplikasi web baru (**Web App `</>`**) pada proyek tersebut untuk mendapatkan kode konfigurasi `firebaseConfig` (`apiKey`, `projectId`, `appId`, dll.).
3. Aktifkan layanan **Authentication** (metode **Email/Password**) dan **Cloud Firestore** pada menu **Build** di Firebase Console (aturan keamanan dapat mengacu pada file `firestore.rules`).
4. Pada aplikasi web yang sedang berjalan, klik tombol **Firebase** di pojok kanan atas halaman Admin, lalu tempelkan kode JSON konfigurasi SDK Firebase Anda (atau salin file `firebase-applet-config.example.json` menjadi `firebase-applet-config.json` jika dijalankan secara lokal).

### 5. Penyesuaian Identitas Lembaga & Fitur Tambahan
* Buka menu **Lembaga** dan **Pengaturan** di bilah samping kiri halaman Admin untuk mengganti nama lembaga, logo, serta informasi institusi Anda.
* Jika diperlukan, salin file `.env.example` menjadi `.env` untuk menambahkan `GEMINI_API_KEY` atau kredensial video conference (`VITE_JAAS_*`).
