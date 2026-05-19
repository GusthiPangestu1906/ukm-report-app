# Feature Folder Hierarchy

Folder ini mengelompokkan fungsionalitas utama `App.jsx` berdasarkan fitur.

- `auth/` - komponen dan utilitas otentikasi Google/Firebase
- `role/` - pemilihan peran pengguna dan verifikasi admin
- `profile/` - proses pengisian profil staf
- `report/` - logika entri laporan, antrean draf, dan pengiriman
- `admin/` - pengelolaan infrastruktur database dan audit log admin
- `history/` - fetch dan cache riwayat laporan
- `ui/` - komponen UI umum seperti modal, loading, dan layar kondisi

Utility bersama berada di `src/utils/`:
- `cache.js` - wrapper localStorage untuk kunci cache aplikasi
- `regex.js` - aturan validasi input
- `constants.js` - konstanta global sistem
- `helpers.js` - helper fungsi umum seperti pemrosesan bulan dan ekstraksi ID folder
