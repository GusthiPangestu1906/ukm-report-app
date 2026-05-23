import React, { useState, useEffect } from 'react';

export default function DatabaseConfig({
  spreadsheetId,
  folderId,
  driveUrlInput,
  setDriveUrlInput,
  setupLoading,
  handleSystemSetup,
  handleResetToDefault,
  migrationLogs,
  onDeleteMigrationLog,
  isMobile
}) {
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [sysMaintenance, setSysMaintenance] = useState(false);
  const [maintLoading, setMaintLoading] = useState(false);

  // Tarik status real-time gerbang maintenance dari Google serverless engine
  useEffect(() => {
    const checkServerMaintenance = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}?spreadsheetId=${spreadsheetId}`);
        const result = await res.json();
        if (result.hasOwnProperty('isMaintenanceActive')) {
          setSysMaintenance(result.isMaintenanceActive);
        }
      } catch (err) {
        console.error("Gagal sinkronisasi parameter pertahanan awal:", err);
      }
    };
    checkServerMaintenance();
  }, [spreadsheetId]);

  const handleCheckHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'checkSystemHealth',
          folderId: folderId,
          spreadsheetId: spreadsheetId,
          actor: 'COMMANDER'
        })
      });
      const result = await response.json();
      if (result.status === 'success' || result.data) {
        setHealthData(result.data || result);
      } else {
        alert('❌ Sektor inti gagal mengembalikan parameter kesehatan.');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Diagnosis terhenti. Koneksi serverless terputus.');
    } finally {
      setHealthLoading(false);
    }
  };

  // PEMICU KILL SWITCH
  const handleToggleMaintenance = async () => {
    const targetState = !sysMaintenance;
    setMaintLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggleMaintenance',
          maintenanceStatus: targetState,
          spreadsheetId: spreadsheetId,
          actor: 'COMMANDER'
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setSysMaintenance(targetState);
        alert(targetState ? '🚨 KILL SWITCH AKTIF: Web staff resmi di-lockdown!' : '🟢 SERVER OPEN: Akses pengisian laporan dibuka kembali.');
      }
    } catch (err) {
      alert('Gagal mengubah parameter keamanan server.');
    } finally {
      setMaintLoading(false);
    }
  };

  const isEngineActive = !!healthData;

  return (
    <div className="tab-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ACCESS SYSTEM CONTROLLER (KILL SWITCH VIEW) */}
      <div>
        <div className="section-heading admin-heading" style={{ marginBottom: '16px', textAlign: 'left', color: sysMaintenance ? '#ff003c' : 'var(--neon-green)', fontSize: isMobile ? '12px' : '14px' }}>
          <span>🚨</span> ACCESS SYSTEM CONTROLLER
        </div>
        <div className="global-section" style={{ borderColor: sysMaintenance ? '#ff003c' : 'rgba(255,255,255,0.08)', margin: 0, padding: isMobile ? '16px 12px' : '20px', background: sysMaintenance ? 'rgba(255,0,60,0.02)' : 'none' }}>
          <div className="tech-panel-desc" style={{ textAlign: 'left', marginBottom: '16px', color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.8' }}>
            Status Gerbang Server: {sysMaintenance ? <b style={{color: '#ff003c'}}>[ STATUS: MAINTENANCE - DITUTUP 🔒 ]</b> : <b style={{color: 'var(--neon-green)'}}>[ STATUS: OPERASIONAL - DIBUKA 🔓 ]</b>}
            <p style={{margin: '8px 0 0 0'}}>Gunakan tombol di bawah ini untuk mematikan sistem kiriman web staff secara instan jika dalam masa pemeliharaan kepengurusan.</p>
          </div>
          <button
            type="button"
            onClick={handleToggleMaintenance}
            disabled={maintLoading}
            style={{
              width: '100%',
              padding: '12px',
              fontFamily: 'var(--font-tech)',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: sysMaintenance ? 'transparent' : 'rgba(255, 0, 60, 0.08)',
              border: '1px solid #ff003c',
              color: '#ff003c',
              borderRadius: '4px',
              boxShadow: sysMaintenance ? 'none' : '0 0 10px rgba(255, 0, 60, 0.15)',
              transition: 'all 0.25s ease'
            }}
          >
            {maintLoading ? 'MEMPROSES OTORISASI...' : sysMaintenance ? '[ 🔓 NYALAKAN KEMBALI AKSES WEB STAFF ]' : '[ 🔒 MATIKAN AKSES SISTEM WEB / MAINTENANCE ]'}
          </button>
        </div>
      </div>

      {/* PENGATURAN TAUTAN DATABASE */}
      <div>
        <div className="section-heading admin-heading" style={{ marginBottom: '16px', textAlign: 'left', fontSize: isMobile ? '12px' : '14px' }}>
          <span>⚙️</span> PENGATURAN TAUTAN DATABASE
        </div>
        <div className="global-section" style={{ borderColor: 'var(--neon-yellow)', boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.03)', margin: 0, padding: isMobile ? '16px 12px' : '20px' }}>
          <div className="tech-panel-desc" style={{ textAlign: 'left', marginBottom: '16px', color: 'var(--text-dim)', fontSize: '11px', lineHeight: '2' }}>
            <span style={{color: 'var(--neon-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px'}}>
              <span className="blink-dot green"></span> [ STATUS: TERHUBUNG KE SPREADSHEET {spreadsheetId ? 'KUSTOM' : 'UTAMA (DEFAULT)'} ]
            </span>
            <div style={{marginTop: '10px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '4px' : '10px' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '11px', minWidth: '100px' }}>📊 SPREADSHEET</span>
                {spreadsheetId ? (
                  <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} target="_blank" rel="noreferrer"
                     style={{ color: 'var(--neon-cyan)', textDecoration: 'none', borderBottom: '1px dashed var(--neon-cyan)', fontSize: '11px', fontFamily: 'var(--font-tech)', wordBreak: 'break-all' }}>
                    {spreadsheetId.slice(0, isMobile ? 8 : 15)}...{spreadsheetId.slice(-6)} ↗
                  </a>
                ) : (
                  <span style={{ color: 'var(--neon-cyan)', fontSize: '11px' }}>DEFAULT</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '4px' : '10px' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '11px', minWidth: '100px' }}>📁 FOLDER DRIVE</span>
                {folderId ? (
                  <a href={`https://drive.google.com/drive/folders/${folderId}`} target="_blank" rel="noreferrer"
                     style={{ color: 'var(--neon-yellow)', textDecoration: 'none', borderBottom: '1px dashed var(--neon-yellow)', fontSize: '11px', fontFamily: 'var(--font-tech)', wordBreak: 'break-all' }}>
                    {folderId.slice(0, isMobile ? 8 : 15)}...{folderId.slice(-6)} ↗
                  </a>
                ) : (
                  <span style={{ color: 'var(--neon-yellow)', fontSize: '11px' }}>DEFAULT</span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSystemSetup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="PASTE LINK FOLDER G-DRIVE BARU DI SINI..."
              className="form-input"
              value={driveUrlInput}
              onChange={(e) => setDriveUrlInput(e.target.value)}
              disabled={setupLoading}
              style={{ borderColor: 'rgba(255, 215, 0, 0.15)', color: 'var(--neon-yellow)', textAlign: 'center', fontSize: '11px' }}
              required
            />
            <button type="submit" disabled={setupLoading} className="tech-btn-action tech-btn-admin" style={{ padding: '12px', fontSize: '11px' }}>
              {setupLoading ? 'MEMPROSES TAUTAN SERVER...' : '[ PERBARUI LINK G-DRIVE SEKARANG ]'}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(255, 215, 0, 0.15)' }}>
            <button 
              type="button"
              onClick={handleResetToDefault} 
              disabled={setupLoading}
              className="tech-btn-action" 
              style={{ background: 'rgba(255, 215, 0, 0.01)', border: '1px solid rgba(255, 215, 0, 0.2)', color: 'var(--neon-yellow)', fontSize: '11px', fontFamily: 'var(--font-tech)', padding: '12px', width: '100%' }}
            >
              [ ↺ EMERGENCY RESET: KEMBALI KE DATABASE UTAMA ]
            </button>
          </div>
        </div>
      </div>

      {/* CORE ENGINE DIAGNOSTICS */}
      <div>
        <div className="section-heading admin-heading" style={{ marginBottom: '16px', textAlign: 'left', fontSize: isMobile ? '12px' : '14px' }}>
          <span>🖥️</span> CORE ENGINE DIAGNOSTICS
        </div>
        <div className="global-section" style={{ borderColor: 'var(--neon-yellow)', boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.03)', margin: 0, padding: isMobile ? '16px 12px' : '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'var(--font-tech)', fontSize: '11px', textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '6px', gap: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>MAIN SPREADSHEET DATA LINK:</span>
              <span style={{ color: healthData?.spreadsheetStatus?.includes('🟢') ? 'var(--neon-green)' : 'inherit', fontWeight: 'bold' }}>
                {healthData ? healthData.spreadsheetStatus : 'UNCHECKED ⚪'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '6px', gap: '10px' }}>
              <span style={{ color: 'var(--text-dim)' }}>GOOGLE DRIVE STORAGE ACCESS:</span>
              <span style={{ color: healthData?.driveStatus?.includes('🟢') ? 'var(--neon-green)' : 'inherit', fontWeight: 'bold' }}>
                {healthData ? healthData.driveStatus : 'UNCHECKED ⚪'}
              </span>
            </div>
            {healthData && (
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textAlign: 'right', marginTop: '4px' }}>
                TIMESTAMP SCAN: {healthData.timestamp} WIB
              </div>
            )}
          </div>
          
          <button 
            type="button" 
            onClick={handleCheckHealth}
            disabled={healthLoading}
            className="tech-btn-action" 
            style={{ 
              background: isEngineActive ? 'var(--neon-yellow)' : 'rgba(255, 215, 0, 0.01)',
              border: '1px solid var(--neon-yellow)', 
              color: isEngineActive ? 'var(--bg-dark)' : 'var(--neon-yellow)', 
              fontWeight: isEngineActive ? 'bold' : 'normal',
              fontSize: '11px', 
              fontFamily: 'var(--font-tech)',
              padding: '12px',
              width: '100%',
              boxShadow: isEngineActive ? '0 0 15px rgba(255, 215, 0, 0.4)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            {healthLoading ? 'SCANNING SECURE SOCKET LINE...' : '[ JALANKAN DIAGNOSIS SISTEM SEKARANG ]'}
          </button>
        </div>
      </div>

      {/* RIWAYAT INFRASTRUKTUR SISTEM (DATABASE SYNC) */}
      <div>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '16px', gap: isMobile ? '12px' : '0px' }}>
          <div className="section-heading admin-heading" style={{ margin: 0, fontSize: isMobile ? '12px' : '14px' }}>
            <span>📜</span> RIWAYAT SISTEM (DATABASE SYNC)
          </div>
          {migrationLogs.length > 0 && (
            <button
              onClick={() => onDeleteMigrationLog('all')}
              style={{ background: 'rgba(255, 0, 60, 0.03)', border: '1px solid rgba(255, 0, 60, 0.3)', color: 'rgba(255, 30, 80, 0.9)', fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-tech)', padding: isMobile ? '6px 12px' : '2px 8px', borderRadius: '4px', width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }}
            >
              [ 🔥 RESET / HAPUS ALL LOGS ]
            </button>
          )}
        </div>

        <div className="global-section" style={{ borderColor: 'var(--neon-yellow)', boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.03)', margin: 0, padding: isMobile ? '12px' : '20px' }}>
          {migrationLogs.length === 0 ? (
            <div className="empty-draft" style={{ borderColor: 'rgba(255, 215, 0, 0.2)', color: 'var(--neon-yellow)', fontSize: '11px' }}>
              [ BELUM ADA RIWAYAT PERUBAHAN DATABASE DI SPREADSHEET ]
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '6px' }} className="draft-list-section">
              {migrationLogs.map((log, index) => (
                <div key={index} style={{ padding: isMobile ? '12px' : '16px', background: 'var(--bg-dark)', border: '1px solid rgba(255, 215, 0, 0.15)', borderRadius: '8px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--neon-yellow)', fontWeight: 'bold', fontFamily: 'var(--font-tech)', fontSize: '12px', letterSpacing: '1px' }}>
                      {log.action}
                    </span>
                    {log.details && (
                      <span style={{ color: 'var(--text-main)', fontSize: '11px', fontFamily: 'sans-serif', marginTop: '4px', display: 'block', opacity: 0.85 }}>
                        {log.details}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontFamily: 'var(--font-tech)', marginTop: '4px' }}>
                      {log.date}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-main)', fontFamily: 'var(--font-tech)' }}>
                    <span style={{ background: 'rgba(255, 215, 0, 0.05)', padding: '2px 6px', border: '1px solid rgba(255,215,0,0.1)', borderRadius: '4px', color: 'var(--neon-yellow)', fontSize: '9px' }}>
                      EKSEKUTOR
                    </span>
                    <span style={{ letterSpacing: '0.5px', fontSize: '10px', wordBreak: 'break-all' }}>{log.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}