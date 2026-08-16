# Feature Folder Hierarchy & Architecture

Folder ini mengelompokkan fungsionalitas utama `App.jsx` berdasarkan arsitektur fitur modular.

## Sub-Folder Fitur Utama (`src/features/`)

- `auth/` - Layar login otentikasi Email & Password kredensial khusus, hook `useAuth`, dan styling antarmuka login.
- `report/` - Komponen entri data laporan UKM, pengaturan periode/tanggal, antrean draf, serta hook manajemen formulir (`useReportForm`, `useDateSettings`, `useReportHistory`).
- `ui/` - Komponen UI global terpusat termasuk `UploadProgressModal` (modal notifikasi progress pengunggahan), `Modal` umum, `ImagePreviewOverlay`, dan sistem styling terdekomposisi.
- `role/` - Pemilihan peran pengguna dan verifikasi hak akses.
- `profile/` - Pengelolaan profil staf dan identitas pengirim laporan.
- `admin/` - Pengelolaan infrastruktur database dan audit log admin.
- `history/` - Modul fetch dan pemeliharaan cache riwayat laporan UKM.

## Utilitas Bersama (`src/utils/`)

- `cache.js` - Wrapper `localStorage` untuk manajemen cache dan persistensi sesi pengguna.
- `regex.js` - Aturan validasi pola string input.
- `constants.js` - Konstanta global dan identifikasi sistem.
- `helpers.js` - Helper pemrosesan tanggal Senin, penentuan opsi bulan, dan utilitas pendukung.

