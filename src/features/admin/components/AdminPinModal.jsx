import React, { useState, useEffect } from 'react';
import { ADMIN_SECRET } from '../../../utils/constants';

export default function AdminPinModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const expectedPin = (ADMIN_SECRET || '').trim();

    if (!expectedPin) {
      setError('VITE_ADMIN_SECRET belum diatur di file .env!');
      return;
    }

    if (pin.trim() === expectedPin) {
      onSuccess();
      onClose();
    } else {
      setError('PIN Admin tidak sesuai!');
    }
  };

  return (
    <div className="admin-pin-overlay" onClick={onClose}>
      <div className="admin-pin-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-pin-header">
          <div className="admin-icon-box admin-icon-box--violet">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h3 className="admin-panel-title">Verifikasi PIN Admin</h3>
            <p className="admin-panel-desc">Masukkan kode PIN untuk membuka panel admin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="admin-pin-form">
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError('');
            }}
            className="form-input admin-pin-input"
            placeholder="Masukkan PIN Admin"
            autoFocus
          />

          {error && <p className="admin-pin-error">{error}</p>}

          <div className="admin-pin-actions">
            <button type="button" onClick={onClose} className="admin-btn-secondary">
              Batal
            </button>
            <button type="submit" className="admin-btn-primary">
              Masuk Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
