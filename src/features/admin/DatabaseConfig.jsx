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
  addMigrationLog,
  showConfirm,
  showAlert,
  isMobile
}) {
  const [activeTab, setActiveTab] = useState('akses');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        const healthResult = result.data || result;
        setHealthData(healthResult);
        if (addMigrationLog) {
          addMigrationLog('DIAGNOSIS SERVER: BERHASIL');
        }
      } else {
        const message = '❌ Sektor inti gagal mengembalikan parameter kesehatan.';
        if (addMigrationLog) {
          addMigrationLog('DIAGNOSIS SERVER: GAGAL');
        }
        if (showAlert) {
          showAlert('GAGAL DIAGNOSIS', message, 'error');
        } else {
          alert(message);
        }
      }
    } catch (err) {
      console.error(err);
      const message = '❌ Diagnosis terhenti. Koneksi serverless terputus.';
      if (addMigrationLog) {
        addMigrationLog('DIAGNOSIS SERVER: GAGAL KONEKSI');
      }
      if (showAlert) {
        showAlert('GAGAL DIAGNOSIS', message, 'error');
      } else {
        alert(message);
      }
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
        if (addMigrationLog) {
          addMigrationLog(targetState ? 'MENUTUP AKSES SISTEM (MAINTENANCE)' : 'MEMBUKA AKSES SISTEM');
        }
        const successTitle = targetState ? 'AKSES SISTEM DIMATIKAN' : 'AKSES SISTEM DINYALAKAN';
        const successMessage = targetState
          ? 'Web staff kini dalam mode maintenance dan akses sementara ditutup.'
          : 'Akses web staff telah dibuka kembali. Staf dapat melanjutkan pengisian laporan.';
        if (showAlert) {
          showAlert(successTitle, successMessage, targetState ? 'error' : 'success');
        } else {
          alert(successMessage);
        }
      } else {
        const errorMessage = result.message || 'Gagal mengubah parameter keamanan server.';
        if (showAlert) {
          showAlert('GAGAL MENGUBAH STATUS SISTEM', errorMessage, 'error');
        } else {
          alert(errorMessage);
        }
      }
    } catch (err) {
      if (showAlert) {
        showAlert('GAGAL MENGUBAH STATUS SISTEM', 'Koneksi server terputus. Silakan coba lagi.', 'error');
      } else {
        alert('Gagal mengubah parameter keamanan server.');
      }
    } finally {
      setMaintLoading(false);
    }
  };

  const confirmToggleMaintenance = () => {
    const targetState = !sysMaintenance;
    const title = targetState ? 'MATIKAN AKSES SISTEM?' : 'NYALAKAN AKSES SISTEM?';
    const message = targetState
      ? 'Jika dilanjutkan, akses web staff akan ditutup sementara untuk maintenance.'
      : 'Jika dilanjutkan, akses web staff akan dibuka kembali dan dapat digunakan lagi.';

    if (showConfirm) {
      showConfirm(title, message, handleToggleMaintenance);
    } else if (window.confirm(`${title}\n\n${message}`)) {
      handleToggleMaintenance();
    }
  };

  const isEngineActive = !!healthData;
  const diagnosisLog = migrationLogs.find(log => log.action.includes('DIAGNOSIS'));

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', maxWidth: '100%' }}>
      
      {/* DROPDOWN MENU ADMIN (PENGGANTI TAB UNTUK HP) */}
      <div className="input-group" style={{ marginBottom: isMobile ? '18px' : '28px', maxWidth: '100%' }}>
        <div className="custom-select-wrapper">
          {isMenuOpen && <div className="custom-select-overlay" onClick={() => setIsMenuOpen(false)}></div>}
          <div
            className={`custom-select-trigger admin-menu-trigger ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ height: isMobile ? '52px' : '54px', boxSizing: 'border-box', position: 'relative', zIndex: isMenuOpen ? 45 : 1, fontSize: isMobile ? '12px' : '13px', cursor: 'pointer' }}
          >
            <div className="custom-select-value">
              <span style={{ fontWeight: 'bold', fontSize: isMobile ? '11px' : '12px' }}>
                {
                  activeTab === 'akses' ? '🚨 KONTROL AKSES' :
                  activeTab === 'diagnosis' ? '🖥️ DIAGNOSIS SERVER' : '⚙️ TAUTAN DATABASE'
                }
              </span>
            </div>
            <span className="chevron-icon">▼</span>
          </div>
          {isMenuOpen && (
            <div className="custom-select-dropdown admin-dropdown-menu" style={{ zIndex: 50, maxHeight: isMobile ? '200px' : '280px' }}>
              <div className={`custom-select-item ${activeTab === 'akses' ? 'selected' : ''}`} onClick={() => { setActiveTab('akses'); setIsMenuOpen(false); }}>
                <span style={{ fontSize: isMobile ? '12px' : '14px', opacity: activeTab === 'akses' ? 1 : 0.5 }}>{'>'}</span>
                <span style={{ fontWeight: 'bold', fontSize: isMobile ? '11px' : '12px' }}>🚨 KONTROL AKSES (KILL SWITCH)</span>
              </div>
              <div className={`custom-select-item ${activeTab === 'diagnosis' ? 'selected' : ''}`} onClick={() => { setActiveTab('diagnosis'); setIsMenuOpen(false); }}>
                <span style={{ fontSize: isMobile ? '12px' : '14px', opacity: activeTab === 'diagnosis' ? 1 : 0.5 }}>{'>'}</span>
                <span style={{ fontWeight: 'bold', fontSize: isMobile ? '11px' : '12px' }}>🖥️ DIAGNOSIS SERVER</span>
              </div>
              <div className={`custom-select-item ${activeTab === 'database' ? 'selected' : ''}`} onClick={() => { setActiveTab('database'); setIsMenuOpen(false); }}>
                <span style={{ fontSize: isMobile ? '12px' : '14px', opacity: activeTab === 'database' ? 1 : 0.5 }}>{'>'}</span>
                <span style={{ fontWeight: 'bold', fontSize: isMobile ? '11px' : '12px' }}>⚙️ TAUTAN DATABASE</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACCESS SYSTEM CONTROLLER (KILL SWITCH VIEW) */}
      {activeTab === 'akses' && (
      <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="active-form-section admin-section-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '14px' : '18px' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: isMobile ? '16px' : '14px', width: '100%', padding: isMobile ? '16px' : '20px', textAlign: 'left', background: sysMaintenance ? 'var(--neon-red-dim)' : 'rgba(16, 185, 129, 0.05)', border: `1px solid ${sysMaintenance ? 'var(--neon-red)' : 'var(--neon-green)'}`, borderRadius: '12px', boxSizing: 'border-box' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className={`admin-status-dot ${sysMaintenance ? 'inactive' : 'active'}`}></span>
                    <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-dim)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Status Sistem</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span style={{ fontSize: isMobile ? '18px' : '20px', color: sysMaintenance ? 'var(--neon-red)' : 'var(--neon-green)', fontWeight: '800', letterSpacing: '-0.5px' }}>{sysMaintenance ? 'Maintenance' : 'Operasional'}</span>
                  </div>
                  {migrationLogs.find(log => log.action.includes('AKSES SISTEM')) && (
                    <div style={{ marginTop: '8px', fontSize: isMobile ? '10px' : '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-tech)', lineHeight: '1.5' }}>
                      Terakhir diubah oleh: <strong style={{ color: 'var(--text-main)' }}>{migrationLogs.find(log => log.action.includes('AKSES SISTEM')).actor}</strong>
                      <br />Pada: {migrationLogs.find(log => log.action.includes('AKSES SISTEM')).date}
                    </div>
                  )}
                </div>
                <div style={{ width: isMobile ? '100%' : 'auto', background: sysMaintenance ? 'var(--neon-red)' : 'var(--neon-green)', padding: '10px 16px', borderRadius: '8px', textAlign: 'center', boxSizing: 'border-box', boxShadow: `0 4px 12px ${sysMaintenance ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                  <span style={{ fontSize: isMobile ? '12px' : '13px', color: '#ffffff', fontWeight: '800', letterSpacing: '0.5px' }}>{sysMaintenance ? 'AKSES DITUTUP' : 'AKSES TERBUKA'}</span>
                </div>
            </div>
          </div>
          <button
            type="button"
            onClick={confirmToggleMaintenance}
            disabled={maintLoading}
            className={`admin-button-toggle ${maintLoading ? 'loading' : ''} ${sysMaintenance ? 'active danger' : 'active'}`}
            style={{
              marginTop: isMobile ? '24px' : '28px',
              padding: isMobile ? '16px' : '20px',
              minHeight: isMobile ? '56px' : '64px',
              fontSize: isMobile ? '14px' : '15px',
              letterSpacing: '1px',
              width: '100%',
              background: maintLoading ? (sysMaintenance ? 'rgba(255, 0, 60, 0.3)' : 'rgba(0, 240, 255, 0.3)') : (sysMaintenance ? 'var(--neon-red)' : 'var(--neon-green)'),
              color: maintLoading ? 'var(--text-dim)' : (sysMaintenance ? '#fff' : '#000'),
              borderColor: maintLoading ? (sysMaintenance ? 'rgba(255, 0, 60, 0.5)' : 'rgba(0, 240, 255, 0.5)') : (sysMaintenance ? 'var(--neon-red)' : 'var(--neon-green)'),
              cursor: maintLoading ? 'not-allowed' : 'pointer',
              opacity: maintLoading ? 0.6 : 1
            }}
          >
            {maintLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                ⏳ MEMPROSES...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {sysMaintenance ? '🔓 BUKA AKSES SISTEM' : '🔒 TUTUP AKSES SISTEM'}
              </span>
            )}
          </button>
        </div>
      </div>)}

      {/* CORE ENGINE DIAGNOSTICS */}
      {activeTab === 'diagnosis' && (
      <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="active-form-section admin-section-card" style={{ margin: 0, padding: isMobile ? '14px' : '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '12px', fontFamily: 'var(--font-tech)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '10px' : '12px', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border-dim)', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '8px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
                <svg width={isMobile ? '14' : '16'} height={isMobile ? '14' : '16'} viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-dim)', fontWeight: '700', whiteSpace: 'nowrap' }}>SPREADSHEET</span>
              </div>
              <span style={{ fontSize: isMobile ? '11px' : '12px', color: healthData?.spreadsheetStatus?.includes('🟢') ? 'var(--neon-green)' : 'var(--text-main)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {healthData ? healthData.spreadsheetStatus : 'UNCHECKED ⚪'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '10px' : '12px', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border-dim)', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '8px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
                <svg width={isMobile ? '14' : '16'} height={isMobile ? '14' : '16'} viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-dim)', fontWeight: '700', whiteSpace: 'nowrap' }}>DRIVE ACCESS</span>
              </div>
              <span style={{ fontSize: isMobile ? '11px' : '12px', color: healthData?.driveStatus?.includes('🟢') ? 'var(--neon-green)' : 'var(--text-main)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {healthData ? healthData.driveStatus : 'UNCHECKED ⚪'}
              </span>
            </div>

            <div style={{ textAlign: 'center', marginTop: isMobile ? '8px' : '10px' }}>
              {healthData && (
                <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-dim)', background: 'var(--bg-dark)', padding: isMobile ? '4px 8px' : '6px 12px', borderRadius: '6px', border: '1px dashed var(--border-dim)', display: 'inline-block' }}>
                  SCAN: {healthData.timestamp} WIB
                </span>
              )}
            </div>
            {diagnosisLog && (
              <div style={{ marginTop: isMobile ? '12px' : '14px', padding: isMobile ? '14px' : '18px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '14px', color: 'var(--text-main)', textAlign: 'left', boxShadow: '0 10px 24px rgba(59, 130, 246, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '12px' : '13px', fontWeight: '800', marginBottom: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#2563eb', display: 'inline-block' }}></span>
                  Riwayat Diagnosis Terakhir
                </div>
                <div style={{ fontSize: isMobile ? '12px' : '13px', lineHeight: '1.6', color: 'var(--text-dim)' }}>
                  <div style={{ marginBottom: '6px' }}><strong>{diagnosisLog.action}</strong></div>
                  <div>oleh <strong>{diagnosisLog.actor}</strong></div>
                  <div>Pada {diagnosisLog.date}</div>
                </div>
              </div>
            )}

          </div>
          
          <button 
            type="button" 
            onClick={handleCheckHealth}
            disabled={healthLoading}
            className={`submit-button ${healthLoading ? 'loading' : ''}`}
            style={{
              marginTop: isMobile ? '20px' : '24px',
              padding: isMobile ? '16px' : '18px',
              minHeight: isMobile ? '52px' : '56px',
              fontSize: isMobile ? '12px' : '13px',
              background: 'transparent',
              color: 'var(--neon-cyan)',
              border: '1px solid var(--neon-cyan)',
              boxShadow: 'none'
            }}
          >
            {healthLoading ? 'SCANNING...' : 'JALANKAN DIAGNOSIS'}
          </button>
        </div>
      </div>)}

      {/* PENGATURAN TAUTAN DATABASE */}
      {activeTab === 'database' && (
      <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="active-form-section admin-section-card" style={{ margin: 0, padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          
          {/* Status Box Modern */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: isMobile ? '16px' : '20px', borderRadius: '16px', background: spreadsheetId ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${spreadsheetId ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
              <span className="admin-status-dot active" style={{ background: spreadsheetId ? '#3b82f6' : 'var(--neon-green)', boxShadow: `0 0 10px ${spreadsheetId ? '#3b82f6' : 'var(--neon-green)'}` }}></span>
              <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: 'bold', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Database</span>
            </div>
            <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800', color: spreadsheetId ? '#3b82f6' : 'var(--neon-green)', letterSpacing: '-0.5px' }}>
              {spreadsheetId ? 'KUSTOM SERVER AKTIF' : 'DEFAULT SERVER AKTIF'}
            </div>
            {migrationLogs.find(log => log.action.includes('TAUTAN') || log.action.includes('DATABASE') || log.action.includes('DEFAULT')) && (
              <div style={{ marginTop: '4px', fontSize: isMobile ? '11px' : '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-tech)', width: '100%' }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  Terakhir diubah oleh: <strong style={{ color: 'var(--text-main)' }}>{migrationLogs.find(log => log.action.includes('TAUTAN') || log.action.includes('DATABASE') || log.action.includes('DEFAULT')).actor}</strong>
                </div>
                <div style={{ marginTop: '2px' }}>Pada {migrationLogs.find(log => log.action.includes('TAUTAN') || log.action.includes('DATABASE') || log.action.includes('DEFAULT')).date}</div>
              </div>
            )}
          </div>

          {/* Collapsible Details Section */}
          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-dim)', borderRadius: '16px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              style={{
                width: '100%',
                padding: isMobile ? '14px' : '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-panel)',
                border: 'none',
                borderBottom: isDetailsOpen ? '1px solid var(--border-dim)' : 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-tech)',
                fontWeight: '700',
                fontSize: isMobile ? '12px' : '13px',
                color: 'var(--text-main)'
              }}
            >
              <span>DETAIL ID TERHUBUNG</span>
              <span style={{ transform: isDetailsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
            </button>
            {isDetailsOpen && (
              <div style={{ padding: isMobile ? '16px' : '20px', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px', animation: 'slideDown 0.3s ease-out' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '4px' : '0' }}>
                  <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-dim)', fontWeight: '700', letterSpacing: '0.5px' }}>SPREADSHEET ID</span>
                  {spreadsheetId ? (
                    <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} target="_blank" rel="noreferrer" style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-main)', textDecoration: 'none', fontWeight: '800', fontFamily: 'var(--font-tech)' }}>
                      {spreadsheetId.slice(0, 8)}...{spreadsheetId.slice(-4)} ↗
                    </a>
                  ) : <span style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-main)', fontWeight: '800', fontFamily: 'var(--font-tech)' }}>DEFAULT_DB</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '4px' : '0' }}>
                  <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-dim)', fontWeight: '700', letterSpacing: '0.5px' }}>FOLDER DRIVE ID</span>
                  {folderId ? (
                    <a href={`https://drive.google.com/drive/folders/${folderId}`} target="_blank" rel="noreferrer" style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-main)', textDecoration: 'none', fontWeight: '800', fontFamily: 'var(--font-tech)' }}>
                      {folderId.slice(0, 8)}...{folderId.slice(-4)} ↗
                    </a>
                  ) : <span style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-main)', fontWeight: '800', fontFamily: 'var(--font-tech)' }}>DEFAULT_DIR</span>}
                </div>
              </div>
            )}
          </div>

          {/* Input Form modern */}
          <form onSubmit={handleSystemSetup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="url"
              placeholder={isMobile ? "Paste Drive folder URL..." : "https://drive.google.com/drive/folders/..."}
              className="form-input"
              style={{ 
                fontSize: isMobile ? '13px' : '14px', 
                padding: isMobile ? '16px' : '18px', 
                borderRadius: '14px',
                border: '2px solid var(--border-dim)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
              value={driveUrlInput}
              onChange={(e) => setDriveUrlInput(e.target.value)}
              disabled={setupLoading}
              required
            />
            <button 
              type="submit" 
              disabled={setupLoading} 
              className={`submit-button ${setupLoading ? 'loading' : ''}`} 
              style={{ 
                padding: isMobile ? '16px' : '18px', 
                minHeight: isMobile ? '54px' : '60px', 
                fontSize: isMobile ? '13px' : '14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
            >
              {setupLoading ? 'MEMPROSES TAUTAN...' : 'PERBARUI TAUTAN GOOGLE DRIVE'}
            </button>
          </form>

          {/* Reset Button (If active) */}
          {spreadsheetId && (
            <button 
              type="button"
              onClick={handleResetToDefault} 
              disabled={setupLoading}
              className="premium-btn-danger"
              style={{ width: '100%', borderRadius: '14px', padding: isMobile ? '16px' : '18px', fontSize: isMobile ? '13px' : '14px' }}
            >
              ⚠ KEMBALI KE DATABASE UTAMA (RESET)
            </button>
          )}
        </div>
      </div>)}

    </div>
  );
}