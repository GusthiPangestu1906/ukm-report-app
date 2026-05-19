import React from 'react';

export default function AdminDashboard({
  spreadsheetId,
  folderId,
  driveUrlInput,
  setDriveUrlInput,
  setupLoading,
  handleSystemSetup,
  handleResetToDefault,
  migrationLogs,
  onDeleteMigrationLog
}) {
  return (
    <>
      <div className="section-heading admin-heading"><span>⚙️</span> PENGATURAN TAUTAN DATABASE</div>
      <div className="global-section" style={{ borderColor: 'var(--neon-yellow)', boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.03)', marginBottom: '35px' }}>
        <div className="tech-panel-desc" style={{ textAlign: 'left', marginBottom: '16px', color: 'var(--text-dim)', fontSize: '11px', lineHeight: '2' }}>
          <span style={{color: 'var(--neon-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span className="blink-dot green"></span> [ STATUS: TERHUBUNG KE SPREADSHEET {spreadsheetId ? 'KUSTOM' : 'UTAMA (DEFAULT)'} ]
          </span>
         <div style={{marginTop: '10px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {spreadsheetId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px', minWidth: '100px' }}>📊 SPREADSHEET</span>
                    <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--neon-cyan)', textDecoration: 'none', borderBottom: '1px dashed var(--neon-cyan)', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
                    {spreadsheetId.slice(0, 20)}...{spreadsheetId.slice(-6)} ↗
                    </a>
                </div>
                ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px', minWidth: '100px' }}>📊 SPREADSHEET</span>
                    <span style={{ color: 'var(--neon-cyan)', fontSize: '11px' }}>DEFAULT (bawaan sistem)</span>
                </div>
            )}
            {folderId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px', minWidth: '100px' }}>📁 FOLDER DRIVE</span>
                    <a href={`https://drive.google.com/drive/folders/${folderId}`} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--neon-yellow)', textDecoration: 'none', borderBottom: '1px dashed var(--neon-yellow)', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
                    {folderId.slice(0, 20)}...{folderId.slice(-6)} ↗
                    </a>
                </div>
                ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px', minWidth: '100px' }}>📁 FOLDER DRIVE</span>
                    <span style={{ color: 'var(--neon-yellow)', fontSize: '11px' }}>DEFAULT (bawaan sistem)</span>
                </div>
            )}
        </div>
          Gunakan form di bawah ini untuk <b>memperbarui link G-Drive</b> jika Anda ingin memindahkan atau menautkan sistem ke folder database kepengurusan yang baru.
        </div>

        <form onSubmit={handleSystemSetup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="PASTE LINK FOLDER G-DRIVE BARU DI SINI..."
            className="form-input"
            value={driveUrlInput}
            onChange={(e) => setDriveUrlInput(e.target.value)}
            disabled={setupLoading}
            style={{ borderColor: 'rgba(255, 215, 0, 0.3)', color: 'var(--neon-yellow)', textAlign: 'center' }}
            required
          />
          <button type="submit" disabled={setupLoading} className="tech-btn-action tech-btn-admin">
            {setupLoading ? 'MEMPROSES TAUTAN SERVER...' : '[ PERBARUI LINK G-DRIVE SEKARANG ]'}
          </button>
        </form>

        {spreadsheetId && (
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(255, 215, 0, 0.3)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '12px', fontFamily: 'var(--font-tech)' }}>
              [ OPSI KEMBALI KE DEFAULT ]
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleResetToDefault} className="tech-btn-action" style={{ borderColor: 'var(--border-dim)', color: 'var(--text-dim)', fontSize: '11px', padding: '12px' }}>
                [ ↺ KEMBALI KE SPREADSHEET UTAMA (DEFAULT) ]
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="section-heading admin-heading" style={{ margin: 0 }}><span>📜</span> RIWAYAT INFRASTRUKTUR SISTEM</div>
        {migrationLogs.length > 0 && (
            <button
            onClick={() => onDeleteMigrationLog('all')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,0,60,0.6)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-tech)', letterSpacing: '1px', whiteSpace: 'nowrap' }}
            >
            [ HAPUS SEMUA ]
            </button>
        )}
    </div>

      <div className="global-section" style={{ borderColor: 'var(--neon-yellow)', boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.03)' }}>
        {migrationLogs.length === 0 ? (
          <div className="empty-draft" style={{ borderColor: 'rgba(255, 215, 0, 0.2)', color: 'var(--neon-yellow)' }}>
            [ BELUM ADA RIWAYAT PERUBAHAN DATABASE ]
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }} className="draft-list-section">
            {migrationLogs.map((log, index) => (
              <div key={index} style={{ padding: '16px', background: 'var(--bg-dark)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '8px', textAlign: 'left', transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'var(--neon-yellow)', fontWeight: 'bold', fontFamily: 'var(--font-tech)', fontSize: '13px', letterSpacing: '1px' }}>
                    {log.action}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
                    {log.date}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-main)', fontFamily: 'var(--font-tech)' }}>
                  <span style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '4px 8px', borderRadius: '4px', color: 'var(--neon-yellow)' }}>
                    EKSEKUTOR
                  </span>
                  <span style={{ letterSpacing: '0.5px' }}>{log.actor}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
