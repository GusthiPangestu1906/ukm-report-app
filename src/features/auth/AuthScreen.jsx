import React, { useState } from 'react';

export default function AuthScreen({
  logoLmb,
  spinnerLoading,
  isGoogleLoading,
  user,
  onLogin,
  showAdminChallenge,
  onShowAdminChallenge,
  onRoleSelect,
  adminPin,
  onAdminPinChange,
  adminError,
  isAdminVerifying,
  onAdminVerify,
  onCancelAdminChallenge,
  onLogout
}) {
  const [activeRole, setActiveRole] = useState('staff');
  const [showPin, setShowPin] = useState(false);

  const handleMainAction = () => {
    if (user) {
      if (activeRole === 'staff') onRoleSelect('staff');
      else onShowAdminChallenge();
    } else {
        onLogin(activeRole);
    }
  };

  return (
    <div className="minimal-auth-container">
      <div className="minimal-auth-wrapper">
        <img src={logoLmb} alt="LMB PENS Logo" className="minimal-logo-img" />
        <h1 className="minimal-title">UKM Report</h1>
        <p className="minimal-subtitle">Sistem Pelaporan Internal</p>

        {showAdminChallenge ? (
          <form onSubmit={onAdminVerify} className="minimal-admin-challenge">
            <div className="minimal-input-group">
              <div className="minimal-input-wrapper">
                <input
                  type={showPin ? "text" : "password"}
                  placeholder={adminPin ? "" : "PASSCODE"}
                  className={`minimal-input ${adminError ? 'minimal-input--error' : ''}`}
                  value={adminPin}
                  onChange={(e) => onAdminPinChange(e.target.value)}
                  disabled={isAdminVerifying}
                  autoFocus
                />
                <button 
                  type="button" 
                  className="minimal-btn-eye"
                  onClick={() => setShowPin(!showPin)}
                  title={showPin ? "Sembunyikan Passcode" : "Tampilkan Passcode"}
                >
                  {showPin ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              {adminError && <p className="minimal-error-message">{adminError}</p>}
              
              <div className="minimal-hint-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span><strong>Petunjuk:</strong> Passcode bisa diminta dari Admin Utama atau dapat dilihat melalui dokumen sistem.</span>
              </div>
            </div>

            <button type="submit" className="minimal-btn-primary" disabled={isAdminVerifying}>
              {isAdminVerifying ? 'Memverifikasi...' : 'Verifikasi Akses'}
            </button>
            <button type="button" onClick={onCancelAdminChallenge} className="minimal-btn-secondary">
              Kembali
            </button>
          </form>
        ) : (
          <>
            <div className="minimal-info-box">
              <div className="minimal-info-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Otentikasi Aman
              </div>
              <div className="minimal-info-text">
                {user 
                  ? `Halo ${user.displayName ? user.displayName.split(' ')[0] : user.email}, sesi Anda masih aktif. Silakan pilih hak akses.` 
                  : 'Pilih peran dan masuk menggunakan kredensial Google Anda.'}
              </div>
            </div>

            <div className="minimal-role-toggle" data-active={activeRole}>
              <div className="minimal-toggle-pill"></div>
              <button 
                className={`minimal-toggle-btn ${activeRole === 'staff' ? 'active' : ''}`}
                onClick={() => setActiveRole('staff')}
              >
                Staf Entri
              </button>
              <button 
                className={`minimal-toggle-btn ${activeRole === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveRole('admin')}
              >
                Koordinator
              </button>
            </div>

            <button onClick={handleMainAction} className="minimal-btn-google" disabled={isGoogleLoading}>
              {isGoogleLoading ? (
                <img src={spinnerLoading} alt="Loading..." className="minimal-spinner-icon" />
              ) : (
                !user && <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="minimal-google-icon" />
              )}
              <span className="minimal-btn-text">
                {isGoogleLoading ? 'Memproses...' : (user ? 'Lanjutkan Masuk' : 'Masuk dengan Google')}
              </span>
            </button>

            {user && (
              <button onClick={onLogout} className="minimal-btn-link minimal-mt-4">
                Keluar dari Formulir
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
