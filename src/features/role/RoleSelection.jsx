import React from 'react';

export default function RoleSelection({
  user,
  logoLmb,
  showAdminChallenge,
  onShowAdminChallenge,
  onRoleSelect,
  adminPin,
  onAdminPinChange,
  adminError,
  isAdminVerifying,
  onAdminVerify,
  onCancelAdminChallenge
}) {
  return (
    <div className="tech-auth-container tech-bg">
      <div className="tech-auth-wrapper">
        <div className="tech-header">
          <img src={logoLmb} alt="LMB PENS Logo" className="tech-logo-img" />
          <h1 className="tech-title">TETAPKAN PERAN</h1>
          <p className="tech-subtitle">[ {user.email} ]</p>
        </div>
        <div className="tech-panel">
          {!showAdminChallenge ? (
            <>
              <h2 className="tech-panel-title"><span className="blink-dot"></span> PILIH HAK AKSES</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                <button onClick={onShowAdminChallenge} className="tech-btn-action tech-btn-admin">
                  [ 👑 MASUK SEBAGAI ADMIN ]
                </button>
                <button onClick={() => onRoleSelect('staff')} className="tech-btn-action">
                  [ 👤 MASUK SEBAGAI STAF ]
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="tech-panel-title" style={{ color: 'var(--neon-yellow)' }}><span className="blink-dot yellow"></span> TANTANGAN KEAMANAN</h2>
              <p className="tech-panel-desc">Masukkan Passcode Otorisasi Admin.</p>
              <form onSubmit={onAdminVerify} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => onAdminPinChange(e.target.value.toUpperCase())}
                  placeholder="PASSCODE..."
                  className="form-input admin-passcode-input"
                  style={{ borderColor: adminError ? 'var(--neon-red)' : 'rgba(255, 215, 0, 0.4)', color: 'var(--neon-yellow)' }}
                  autoFocus
                />
                {adminError && <div style={{ color: 'var(--neon-red)', fontSize: '11px', fontWeight: 'bold' }}>{adminError}</div>}
                <button type="submit" disabled={isAdminVerifying} className="tech-btn-action tech-btn-admin">
                  {isAdminVerifying ? 'MEMERIKSA SANDI...' : 'VERIFIKASI'}
                </button>
                <button type="button" onClick={onCancelAdminChallenge} className="tech-btn-action tech-btn-cancel">BATAL</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
