import React from 'react';

const LogoutModal = ({ show, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onCancel} className="modal-close-btn" style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="modal-icon confirm">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </div>
        <h3 className="modal-title">KONFIRMASI KELUAR</h3>
        <p className="modal-message">Apakah Anda yakin ingin keluar dari akun Google saat ini?</p>
        <div className="modal-actions" style={{ gap: '10px' }}>
          <button onClick={onConfirm} className="modal-btn primary" style={{ width: '100%', padding: '12px' }}>
            YA, KELUAR
          </button>
          <button onClick={onCancel} className="modal-btn secondary" style={{ width: '100%', padding: '12px' }}>
            BATAL
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
