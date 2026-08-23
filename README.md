# 📊 UKM Report App — Medfo PENS

Aplikasi web modern berbasis **React & Vite** untuk pelaporan, pengelolaan, dan dokumentasi berkala kegiatan Unit Kegiatan Mahasiswa (UKM) & Komunitas secara terintegrasi dengan Google Spreadsheet dan Google Drive Storage.

---

## ✨ Fitur Utama

- **🔐 Autentikasi Fleksibel & Aman**:
  - Login menggunakan Akun Google (Google OAuth) atau Email/Password.
  - Role-based authorization untuk staf dan admin.
  - UI Card elegan dengan animasi *conic-gradient* dan efek ambient glow.
- **🏷️ Database Master UKM Terstandarisasi**:
  - Memuat **29 UKM & Komunitas** resmi yang terbagi dalam 3 kategori standar (**Penalaran**, **Seni**, dan **Olahraga**).
  - *Smart Autocomplete* dinamis saat mengetik kata kunci (tanpa dropdown penuh yang mengganggu).
  - Dukungan pencocokan alias/variasi nama & prefiks standar *"UKM"*.
  - Indikator status verifikasi real-time (`✓ Terverifikasi`).
- **📅 Pengaturan Waktu & Preset Cerdas**:
  - Pilihan pelaporan otomatis berbasis hari Senin (Senin Ini, Senin Lalu, dan Tanggal Kustom).
  - Sinkronisasi bulan pelaporan otomatis.
- **📸 Manajemen Lampiran Foto Kegiatan**:
  - Unggah hingga 3 foto kegiatan per UKM dengan validasi ukuran berkas (maksimal 10MB).
  - Preview thumbnail interaktif dan modal zoom gambar resolusi penuh.
- **📦 Antrean Laporan (Draft Queue) & Unggah Masal**:
  - Penyimpanan antrean lokal (*offline-safe* via Cache Storage).
  - Modal progres unggah multi-tahap dengan indikator persentase real-time.
  - Penanganan error granular per-laporan tanpa kehilangan data antrean lainnya.
- **📱 Navigasi & Bantuan Cepat**:
  - Hamburger menu interaktif dengan tautan langsung **Buka Spreadsheet** dan kontak **WhatsApp Admin**.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: Modular Vanilla CSS (Design Tokens, Scoped Feature Styles, Glassmorphism, Micro-animations)
- **State Management & Logic**: React Custom Hooks (`useAuth`, `useReportForm`, `useDateSettings`, `useReportHistory`, `useModal`)
- **Backend API & Database**: Google Apps Script (GAS) Web App + Google Sheets
- **Storage**: Google Drive API (Penyimpanan Berkas Foto)
- **Deployment**: Firebase Hosting & Firebase Authentication

---

## 📁 Struktur Direktori

```text
ukm-report/
├── public/                 # Favicon dan aset statis
├── src/
│   ├── assets/             # Logo Medfo, spinner, dan aset visual
│   ├── data/               # Master database UKM (ukmData.js)
│   ├── features/           # Modular Feature-based Architecture
│   │   ├── auth/           # Login screen, auth hooks, dan style
│   │   ├── report/         # Form input, antrean, tab navigation, hooks
│   │   └── ui/             # Header, modal, progress overlay, preview
│   ├── services/           # Integrasi API (reportApi, authApi)
│   ├── utils/              # Helper tanggal, cache manager, regex, konstanta
│   ├── App.jsx             # Root layout & orkestrasi hook
│   └── main.jsx            # Entry point aplikasi
├── firebase.json           # Konfigurasi Firebase Hosting
└── vite.config.js          # Konfigurasi Vite bundler
```

---

## 🚀 Memulai (Local Development)

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan)
- [npm](https://www.npmjs.com/) atau yarn

### 2. Instalasi
```bash
# Clone repositori
git clone https://github.com/GusthiPangestu1906/ukm-report-app.git

# Masuk ke direktori proyek
cd ukm-report-app

# Instal dependensi
npm install
```

### 3. Konfigurasi Environment Variable
Buat file `.env` di root direktori dan sesuaikan variabel berikut:
```env
VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_ADMIN_SECRET=YOUR_ADMIN_SECRET_KEY
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi akan berjalan pada `http://localhost:5173`.

### 5. Build Produksi
```bash
npm run build
```

---

## 📜 Lisensi & Kontribusi
Dikembangkan untuk kebutuhan internal organisasi dan koordinasi pelaporan Medfo PENS. Untuk pelaporan isu atau masukan fitur, silakan buat *Issue* atau hubungi admin melalui kontak yang tertera di menu aplikasi.
