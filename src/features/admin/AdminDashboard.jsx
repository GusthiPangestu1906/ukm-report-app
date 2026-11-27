import React, { useState, useMemo, useEffect } from 'react';
import logoMedfo from '../../assets/Medfo.png';
import { reportApi } from '../../services/api';

const CONTACT_PHONE = '6282334015531';
const CONTACT_DISPLAY = '0823-3401-5531';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatMonthLabel = (yyyyMm) => {
  const [year, month] = yyyyMm.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_ID[idx] || month} ${year}`;
};

export default function AdminDashboard({
  historyData = [],
  publicSpreadsheetUrl = '',
  appConfig = null,
  adminProfile = { name: 'Gusthi', phone: '0823-3401-5531' },
  onSaveAdminProfile,
  onRefreshHistory,
  onBackToStaff,
  showAlert
}) {
  // Profil Admin
  const [adminName, setAdminName] = useState(adminProfile.name || 'Gusthi');
  const [adminPhone, setAdminPhone] = useState(adminProfile.phone || '0823-3401-5531');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Pengaturan Drive & Sheet
  const [driveUrl, setDriveUrl] = useState(appConfig?.driveFolderId || '');
  const [sheetUrl, setSheetUrl] = useState(appConfig?.publicSpreadsheetId || publicSpreadsheetUrl || '');
  const [isSavingTargets, setIsSavingTargets] = useState(false);

  useEffect(() => {
    if (appConfig?.driveFolderId && !driveUrl) {
      setDriveUrl(appConfig.driveFolderId);
    }
    if (appConfig?.publicSpreadsheetId && !sheetUrl) {
      setSheetUrl(appConfig.publicSpreadsheetId);
    }
  }, [appConfig]);

  // Filter bulan untuk Download Rekap
  const availableMonths = useMemo(() => {
    const set = new Set();
    (historyData || []).forEach((item) => {
      if (item.tanggal && String(item.tanggal).length >= 7) {
        set.add(String(item.tanggal).slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [historyData]);

  const [selectedMonth, setSelectedMonth] = useState(() => availableMonths[0] || 'ALL');

  const filteredReports = useMemo(() => {
    if (selectedMonth === 'ALL') return historyData;
    return (historyData || []).filter((item) => String(item.tanggal || '').startsWith(selectedMonth));
  }, [historyData, selectedMonth]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const nextName = adminName.trim() || 'Admin';
    const nextPhone = adminPhone.trim() || CONTACT_DISPLAY;
    setIsSavingProfile(true);
    try {
      const res = await reportApi.updateConfig({ adminName: nextName, adminPhone: nextPhone });
      if (res?.status !== 'success') {
        throw new Error(res?.message || 'Gagal menyimpan profil admin ke Google Sheets');
      }
      setAdminName(nextName);
      setAdminPhone(nextPhone);
      onSaveAdminProfile?.({ name: nextName, phone: nextPhone });
      onRefreshHistory?.();
      showAlert?.(
        'PROFIL TERSIMPAN',
        `Kontak admin "${nextName} · ${nextPhone}" sekarang tersimpan di Google Sheets & aktif untuk semua user.`,
        'success'
      );
    } catch (err) {
      showAlert?.('GAGAL MENYIMPAN', err.message || 'Pastikan Google Apps Script sudah diperbarui.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    setIsSavingTargets(true);
    try {
      const res = await reportApi.updateConfig({
        driveFolderId: driveUrl.trim(),
        publicSpreadsheetId: sheetUrl.trim()
      });
      if (res?.status !== 'success') {
        throw new Error(res?.message || 'Gagal menyimpan pengaturan Drive & Spreadsheet');
      }
      onRefreshHistory?.();
      showAlert?.(
        'PENGATURAN TERSIMPAN',
        'Link Folder Google Drive & Spreadsheet Publik berhasil diperbarui di tab Pengaturan.',
        'success'
      );
    } catch (err) {
      showAlert?.('GAGAL MENYIMPAN', err.message || 'Pastikan Google Apps Script sudah diperbarui.', 'error');
    } finally {
      setIsSavingTargets(false);
    }
  };

  const handleDownloadCsv = () => {
    if (filteredReports.length === 0) {
      showAlert?.('DATA KOSONG', 'Belum ada data laporan pada periode yang dipilih.', 'warning');
      return;
    }

    const periodLabel = selectedMonth === 'ALL'
      ? 'Semua_Bulan'
      : formatMonthLabel(selectedMonth).replace(/\s+/g, '_');

    const headers = ['Tanggal Laporan', 'Status Laporan', 'Penanggung Jawab', 'Nama UKM', 'Link Foto 1', 'Link Foto 2', 'Link Foto 3'];
    const rows = filteredReports.map((r) => {
      const fotos = Array.isArray(r.fotoUrls) ? r.fotoUrls : [];
      return [
        r.tanggal || '',
        r.statusLaporan || '',
        r.penanggungJawab || '',
        r.ukm || '',
        fotos[0] || '',
        fotos[1] || '',
        fotos[2] || ''
      ];
    });

    // Gunakan pemisah titik koma (;) tanpa newline di dalam sel agar tinggi baris Excel tetap rapat
    const formatCsvCell = (cell) => {
      const text = String(cell ?? '').replace(/[\r\n]+/g, ' ').trim();
      if (/[;"]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const csvContent = '\uFEFF' + [headers, ...rows]
      .map((row) => row.map(formatCsvCell).join(';'))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_UKM_${periodLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page-shell">
      {/* 1. TOP NAVBAR */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src={logoMedfo} alt="Medfo Logo" className="header-logo" />
          <div>
            <div className="admin-title-row">
              <h1 className="admin-title">Admin Control Center</h1>
              <span className="admin-mode-pill">Mode Admin</span>
            </div>
            <p className="admin-subtitle">Profil Admin, Download Rekap & Pengaturan Drive/Sheet</p>
          </div>
        </div>

        <button type="button" onClick={onBackToStaff} className="admin-back-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Kembali ke Form</span>
        </button>
      </header>

      {/* 2. KARTU ATAS: PROFIL ADMIN */}
      <section className="form-card admin-card admin-profile-card">
        <div className="section-heading">
          <span>1</span>
          PROFIL ADMIN
        </div>

        <form onSubmit={handleSaveProfile} className="admin-profile-form">
          <div className="input-group">
            <label className="form-label">Nama Admin</label>
            <input
              type="text"
              className="form-input"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Nama Admin"
            />
          </div>
          <div className="input-group">
            <label className="form-label">No. HP / WhatsApp Admin</label>
            <input
              type="tel"
              className="form-input"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="Cth: 0823-3401-5531"
            />
          </div>
          <button type="submit" disabled={isSavingProfile} className="admin-btn-primary">
            {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      </section>

      {/* 3. GRID 2 KARTU SEJAJAR: DOWNLOAD EXCEL & PENGATURAN DRIVE/SHEET */}
      <div className="admin-grid-two">
        {/* KIRI: DOWNLOAD REKAP EXCEL */}
        <section className="form-card admin-card admin-panel">
          <div className="admin-panel-body">
            <div className="admin-panel-head">
              <div className="admin-icon-box admin-icon-box--green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                </svg>
              </div>
              <div>
                <h2 className="admin-panel-title">Download Rekap Excel</h2>
                <p className="admin-panel-desc">Unduh laporan per bulan siap buka di Excel</p>
              </div>
            </div>

            <div className="input-group">
              <label className="form-label">Pilih Bulan Laporan</label>
              <select
                className="form-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
                <option value="ALL">Semua Bulan</option>
              </select>
            </div>

            <div className="admin-stat-strip">
              <span className="admin-stat-label">Data tersedia di periode ini</span>
              <span className="admin-stat-badge">{filteredReports.length} Laporan</span>
            </div>
          </div>

          <button type="button" onClick={handleDownloadCsv} className="admin-btn-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download Spreadsheet (.csv)</span>
          </button>
        </section>

        {/* KANAN: PENGATURAN DRIVE & SHEET */}
        <section className="form-card admin-card admin-panel">
          <form onSubmit={handleSaveTargets} className="admin-panel-form">
            <div className="admin-panel-body">
              <div className="admin-panel-head">
                <div className="admin-icon-box admin-icon-box--violet">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="admin-panel-title">Pengaturan Drive & Sheet</h2>
                  <p className="admin-panel-desc">Ubah tujuan penyimpanan foto & sheet publik</p>
                </div>
              </div>

              <div className="input-group">
                <label className="form-label">Link / ID Folder Google Drive</label>
                <input
                  type="text"
                  className="form-input"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="Paste link folder Google Drive..."
                />
              </div>

              <div className="input-group">
                <label className="form-label">Link / ID Spreadsheet Publik</label>
                <input
                  type="text"
                  className="form-input"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="Paste link Google Spreadsheet..."
                />
              </div>
            </div>

            <button type="submit" disabled={isSavingTargets} className="admin-btn-primary">
              {isSavingTargets ? 'Menyimpan...' : 'Simpan Perubahan Tujuan'}
            </button>
          </form>
        </section>
      </div>

      {/* 4. FOOTER BANTUAN DEVELOPER */}
      <footer className="admin-footer">
        <div>
          <p className="admin-footer-title">Butuh bantuan teknis atau ada error?</p>
          <p className="admin-footer-desc">Hubungi developer aplikasi secara langsung</p>
        </div>
        <a
          href={`https://wa.me/${CONTACT_PHONE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-dev-wa-btn"
        >
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#25D366" />
            <path d="M22.8 9.2C21.1 7.5 18.8 6.5 16.3 6.5C11.1 6.5 6.9 10.7 6.9 15.9C6.9 17.6 7.4 19.3 8.2 20.7L6.8 25.5L11.7 24.1C13.1 24.9 14.7 25.3 16.3 25.3C21.5 25.3 25.7 21.1 25.7 15.9C25.7 13.3 24.7 11 22.8 9.2ZM16.3 23.7C14.9 23.7 13.5 23.3 12.3 22.6L12 22.4L9 23.3L9.9 20.4L9.7 20.1C8.9 18.8 8.5 17.4 8.5 15.9C8.5 11.6 12 8.1 16.3 8.1C18.4 8.1 20.3 8.9 21.8 10.4C23.2 11.8 24.1 13.8 24.1 15.9C24.1 20.2 20.6 23.7 16.3 23.7Z" fill="white" />
          </svg>
          <span>Bantuan Dev: Gusthi · {CONTACT_DISPLAY}</span>
        </a>
      </footer>
    </div>
  );
}
