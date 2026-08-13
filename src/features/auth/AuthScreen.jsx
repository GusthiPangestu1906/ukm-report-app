import React from 'react';

export default function AuthScreen({
  logoLmb,
  spinnerLoading,
  isGoogleLoading,
  user,
  onLogin,
  onLogout
}) {
  const handleMainAction = () => {
    onLogin('staff');
  };

  return (
    <div className="minimal-auth-container">
      <div className="minimal-auth-wrapper">
        <img src={logoLmb} alt="LMB PENS Logo" className="minimal-logo-img" />
        <h1 className="minimal-title">UKM Report</h1>
        <p className="minimal-subtitle">Sistem Pelaporan Internal</p>

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
              ? `Halo ${user.displayName ? user.displayName.split(' ')[0] : user.email}, sesi Anda masih aktif.` 
              : 'Silakan masuk menggunakan kredensial Google Anda.'}
          </div>
        </div>

        <button onClick={handleMainAction} className="minimal-btn-google" disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <img src={spinnerLoading} alt="Loading..." className="minimal-spinner-icon" />
          ) : (
            !user && <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="minimal-google-icon" />
          )}
          <span className="minimal-btn-text">
            {isGoogleLoading ? 'Memproses...' : (user ? 'Masuk ke Formulir' : 'Masuk dengan Google')}
          </span>
        </button>

        {user && (
          <button onClick={onLogout} className="minimal-btn-link minimal-mt-4">
            Keluar dari Sesi
          </button>
        )}
      </div>
    </div>
  );
}
