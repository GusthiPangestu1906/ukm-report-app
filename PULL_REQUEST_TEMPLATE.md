## 🛡️ Security Checklist
- [x] **No Hardcoded Secrets**: Tidak ada kredensial sensitif atau data rahasia yang terekspos dalam kode sumber.
- [x] **Strict Input Validation**: Validasi nama UKM terintegrasi langsung dengan database resmi untuk mencegah data anomali atau salah ketik masuk ke antrean dan database server.
- [x] **Client-Side Sanitization**: Input nama UKM dibersihkan secara otomatis dari karakter ilegal (seperti koma) dan dinormalisasi ke nama resmi berawalan "UKM".

## 🚀 Quality Checklist
- [x] **Master UKM Database**: Menyediakan database master 29 UKM resmi yang dikelompokkan ke dalam 3 kategori standar: **Penalaran**, **Seni**, dan **Olahraga**.
- [x] **Smart Autocomplete (No Clutter)**: Menggantikan dropdown bawaan browser yang penuh dengan autocomplete cerdas yang hanya muncul saat pengguna mengetik kata kunci yang cocok (maksimal 4-5 opsi relevan).
- [x] **Real-Time Verification Feedback**: Menampilkan indikator centang hijau dan badge status `✓ Terverifikasi: [Nama UKM] [Kategori]` saat nama UKM valid terdeteksi.
- [x] **Flexible Keyword Matching**: Mendukung pencarian dan verifikasi fleksibel berbasis nama resmi, prefiks "UKM", serta alias umum (contoh: `soft` ➔ `UKM Softdev`, `robot` ➔ `UKM Roboholic`, `tar` ➔ `UKM Tari`).
- [x] **Queue Protection**: Mencegah penambahan laporan ke antrean jika nama UKM tidak terdaftar dalam database sistem.

---

## 📝 Deskripsi Perubahan

### 1. 🗄️ Database Master UKM (`src/data/ukmData.js`)
- Membuat file master data yang mencakup **29 UKM & Komunitas** resmi dengan standarisasi nama berawalan "UKM".
- Mengelompokkan seluruh UKM ke dalam 3 kategori utama:
  - **Olahraga (11 UKM)**: *UKM Badminton, UKM Basket, UKM Futsal, UKM Karate, UKM Panahan, UKM Pencak Silat, UKM Silat Perisai Diri, UKM Silat PSHT, UKM Taekwondo, UKM Tenis Meja, UKM Voli.*
  - **Seni (6 UKM)**: *UKM Cinemascope, UKM ENT, UKM Janaka, UKM Musik, UKM PSM, UKM Tari.*
  - **Penalaran (12 UKM)**: *UKM Dirgantara, UKM E-TRANS, UKM E2C, UKM Frens, UKM Gamespace, UKM Mahetala, UKM MHE, UKM Roboholic, UKM Softdev, UKM SRE PENS, UKM Tekkes, UKM USI.*
- Menyediakan helper fungsi:
  - `findUkm(input)`: Pencarian case-insensitive dengan dukungan pembersihan prefiks dan pencocokan alias.
  - `searchUkms(query, limit)`: Pencarian cerdas untuk kebutuhan rekomendasi autocomplete.
  - `isValidUkm(input)` & `normalizeUkmName(input)`: Validasi dan standarisasi nama UKM.

### 2. ⚡ Dynamic Autocomplete UI (`src/features/report/components/EntrySection.jsx`, `src/features/report/styles/form-entry.css`)
- Menghapus native `<datalist>` browser yang sebelumnya menampilkan seluruh 30 opsi secara berlebihan saat input diklik.
- Mengimplementasikan custom floating dropdown autocomplete (`.ukm-suggestions-dropdown`) yang muncul dinamis saat pengguna mengetik kata kunci.
- Setiap item saran menampilkan nama UKM tebal dan badge kategori berwarna ungu lembut.
- Memasang penanganan interaksi klik (`onMouseDown` prevent-default dan delayed blur) agar pemilihan opsi berjalan instan dan mulus di perangkat desktop maupun mobile.
- Menambahkan visual status verifikasi langsung di bawah input formulir.

### 3. 🔒 Form Validation Layer (`src/features/report/hooks/useReportForm.js`)
- Mengintegrasikan pengecekan `findUkm()` pada fungsi `addToDraft`.
- Menampilkan pesan error spesifik dan peringatan modal jika pengguna mencoba memasukkan nama UKM yang tidak terdaftar.
- Menormalisasi nama UKM ke format kapitalisasi dan penamaan resmi saat dimasukkan ke dalam antrean draft.

---

**Branch:** `feat/upload-progress-modal`  
**Status:** Local Tested & Ready for Merge.
