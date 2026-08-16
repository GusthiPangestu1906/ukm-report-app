import React, { useState } from 'react';

export default function AuthScreen({
  logoLmb,
  isGoogleLoading,
  user,
  onLogin
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Silakan isi email dan password.');
      return;
    }

    const result = await onLogin(email, password);
    if (result && !result.success) {
      setErrorMessage(result.message || 'Email atau Password yang Anda masukkan salah!');
    }
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
            Otentikasi Akun
          </div>
          <div className="minimal-info-text">
            Silakan masuk menggunakan akun yang diberikan oleh PJ UKM-REPORT.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-container">
          <div className="auth-field-group">
            <label className="auth-field-label">EMAIL</label>
            <div className="auth-input-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-input-icon">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                placeholder="masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isGoogleLoading}
                className="auth-input-control"
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-field-label">PASSWORD</label>
            <div className="auth-input-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isGoogleLoading}
                className="auth-input-control"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-toggle-eye"
                tabIndex="-1"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="auth-error-alert">
              ⚠️ {errorMessage}
            </div>
          )}

          <button type="submit" className="auth-btn-submit" disabled={isGoogleLoading}>
            {isGoogleLoading ? 'MEMPROSES...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
