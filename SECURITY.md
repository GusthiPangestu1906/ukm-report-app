# 🛡️ Kebijakan Keamanan (Security Policy)

Kami memprioritaskan keamanan dan privasi data pelaporan UKM pada aplikasi **UKM Report App**. Dokumen ini menjelaskan kebijakan dukungan versi, panduan pelaporan celah keamanan (vulnerability), dan praktik keamanan yang diterapkan pada repositori ini.

---

## 📦 Versi yang Didukung (Supported Versions)

Pembaruan keamanan dan perbaikan celah secara aktif dirilis untuk versi branch utama (`main` / `production`).

| Versi / Branch | Status Dukungan |
| :--- | :--- |
| `main` (Latest) | :white_check_mark: Didukung aktif |
| `feat/*` (Development) | :white_check_mark: Dalam peninjauan berkala |
| `< 1.0.0` (Legacy Releases) | :x: Tidak didukung |

---

## 🚨 Pelaporan Celah Keamanan (Reporting a Vulnerability)

Jika Anda menemukan potensi kerentanan keamanan atau kelemahan sistem dalam aplikasi ini, **jangan laporkan melalui *public issue tracker* terbuka.**

Harap laporkan secara privat melalui salah satu kontak berikut:

- **WhatsApp Admin / Pengembang**: `+62 823-3401-5531` (Gusthi Pangestu)
- **Email**: Hubungi kontak pengembang yang terdaftar pada profil GitHub [@GusthiPangestu1906](https://github.com/GusthiPangestu1906)

### Informasi yang Disarankan dalam Laporan:
1. Deskripsi singkat mengenai celah atau kerentanan yang ditemukan.
2. Langkah-langkah untuk mereproduksi masalah (*Proof of Concept* / skenario).
3. Potensi dampak terhadap data atau pengguna aplikasi.
4. Rekomendasi perbaikan (jika ada).

Tim akan merespons laporan Anda dalam waktu maksimal **1x24 jam** dan memberikan pembaruan status perbaikan secara transparan.

---

## 🔒 Praktik Keamanan yang Diterapkan

1. **Pemisahan Kredensial & Secrets**:
   - Tidak ada token rahasia, API key privat, atau kredensial database yang di-commit langsung ke repositori Git.
   - Variabel konfigurasi lingkungan dikelola secara ketat melalui `.env` dan sistem *environment secret* pada platform deployment.
2. **Validasi & Sanitasi Input Ketat**:
   - Input nama UKM divalidasi langsung terhadap database master terverifikasi sebelum diproses ke antrean dan database server.
   - Karakter berbahaya dan format yang tidak valid dibersihkan secara otomatis di sisi klien.
3. **Keamanan Unggah Berkas (File Upload)**:
   - Pembatasan tipe berkas secara eksplisit hanya untuk format gambar (`image/jpeg`, `image/png`, `image/jpg`, `image/webp`).
   - Pembatasan kuota maksimal (maks 3 berkas per entri) dan batas ukuran berkas (maks 10MB per file) guna mencegah serangan *Denial of Service* (DoS) berbasis memori atau *storage abuse*.
4. **Proteksi Tautan Eksternal**:
   - Seluruh tautan ke domain eksternal (Google Sheets, WhatsApp, dsb.) menggunakan atribut `rel="noopener noreferrer"` dan protokol terenkripsi `HTTPS`.
