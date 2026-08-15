import React from 'react';
import logoMedfo from '../../../assets/Medfo.png';

const Header = ({ publicSpreadsheetUrl }) => (
  <div className="card-top-header" style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(217, 70, 239, 0.12)',
    gap: '12px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img
        src={logoMedfo}
        alt="Medfo Logo"
        style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '10px', filter: 'drop-shadow(0 4px 10px rgba(217, 70, 239, 0.25))' }}
      />
      <div>
        <h2 className="form-title" style={{ margin: 0, textAlign: 'left', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#1e1b4b' }}>
          Formulir Pelaporan
        </h2>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Laporan Kegiatan UKM</span>
      </div>
    </div>

    {publicSpreadsheetUrl && (
      <a
        href={publicSpreadsheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="sheets-header-btn"
        title="Buka Data Spreadsheet Laporan (Google Sheets)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#059669',
          fontWeight: '700',
          fontSize: '12px',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
      >
        <span>Spreadsheet</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    )}
  </div>
);

export default Header;
