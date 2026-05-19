import React from 'react';

export default function AuthScreen({ logoLmb, onLogin }) {
  return (
    <div className="tech-auth-container tech-bg">
      <div className="tech-auth-wrapper">
        <div className="tech-header">
          <img src={logoLmb} alt="LMB PENS Logo" className="tech-logo-img" />
          <h1 className="tech-title">UKM REPORT</h1>
          <p className="tech-subtitle">[ SISTEM PELAPORAN INTERNAL ]</p>
        </div>
        <div className="tech-panel">
          <h2 className="tech-panel-title"><span className="blink-dot"></span> OTENTIKASI SERVER</h2>
          <div className="tech-panel-desc" style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.5)', padding: '12px 15px', borderLeft: '3px solid var(--neon-cyan)', borderRadius: '6px', marginBottom: '24px', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
            <div style={{ color: 'var(--neon-green)', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>[ KONEKSI TERENKRIPSI ]</div>
            <div style={{ color: 'var(--text-dim)' }}>&gt; Wajib menggunakan otentikasi identitas untuk masuk ke dalam terminal data.</div>
          </div>
          <button onClick={onLogin} className="tech-btn-google">
            <div className="tech-google-icon-wrapper">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="tech-google-icon" />
            </div>
            <div className="tech-btn-text-wrapper">
              <span className="tech-btn-main-text">OTENTIKASI DENGAN GOOGLE</span>
              <span className="tech-btn-sub-text">[ INISIASI KONEKSI ]</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
