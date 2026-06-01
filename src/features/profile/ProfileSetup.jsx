import React from 'react';

export default function ProfileSetup({ user, logoLmb, tempName, onTempNameChange, nameError, onSaveName }) {
  return (
    <div className="tech-auth-container tech-bg">
      <div className="tech-auth-wrapper">
        <div className="tech-header">
          <img src={logoLmb} alt="LMB PENS Logo" className="tech-logo-img" />
          <h1 className="tech-title">PROFIL STAF</h1>
          <p className="tech-subtitle">[ STAF TERVERIFIKASI ]</p>
        </div>
        <div className="tech-panel">
          <h2 className="tech-panel-title"><span className="blink-dot"></span> HALO, {user.displayName?.split(' ')[0] || 'STAF'}!</h2>
          <div className="tech-panel-desc" style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.5)', padding: '12px 15px', borderLeft: '3px solid var(--neon-cyan)', borderRadius: '6px', marginBottom: '24px', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
            <div style={{ color: 'var(--neon-cyan)', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>[ OTORISASI: LEVEL STAF ]</div>
            <div style={{ color: 'var(--text-dim)' }}>&gt; Tetapkan identitas operasional untuk label penanggung jawab data.</div>
          </div>

          <div className="tech-input-container">
            <span className="tech-input-icon">👤</span>
            <input
              type="text"
              placeholder="PANGGILAN / RESMI (Wajib)"
              className={`tech-input ${nameError ? 'input-error' : ''}`}
              value={tempName}
              onChange={onTempNameChange}
            />
          </div>
          {nameError && (
            <div className="warning-card warning-card--error" style={{ marginBottom: '16px' }}>
              <span className="warning-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
              <span className="warning-card__text">{nameError}</span>
            </div>
          )}
          <button onClick={onSaveName} className="tech-btn-action">
            SIMPAN & MASUK FORM 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
