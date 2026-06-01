import React, { useState, useEffect } from 'react';
import spinnerLoading from '../../assets/spinner loading.png';

export default function StaffDashboard({
  openDropdown,
  setOpenDropdown,
  bulanOptions,
  selectedBulan,
  availableDates,
  tanggal,
  submittedUkms,
  isTanggalLocked,
  isEntriLocked,
  isAntreanLocked,
  completedSteps,
  isLoading,
  isLoadingHistory,
  currentUkm,
  currentFotos,
  ukmError,
  laporans,
  uploadProgress,
  processingId,
  historyData,
  setPreviewImage,
  handleBulanSelect,
  handleTanggalSelect,
  handleUkmChange,
  handleFileChange,
  removeCurrentFoto,
  addToDraft,
  removeDraft,
  handleSubmit,
  handleEditDraft
  , penanggungJawab, setPenanggungJawab
}) {
  const [activeTab, setActiveTab] = useState('form');
  const [isEditingTime, setIsEditingTime] = useState(!tanggal);
  const [expandedDrafts, setExpandedDrafts] = useState({});
  const [openDraftMenuId, setOpenDraftMenuId] = useState(null);
  const [isFormFilesExpanded, setIsFormFilesExpanded] = useState(true);

  const currentUploadIndex = processingId ? Math.max(1, laporans.findIndex(l => l.id === processingId) + 1) : 1;
  const totalUploads = laporans.length;

  const uniqueBulanOptions = bulanOptions.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);

  const toggleDraftExpand = (id) => {
    setExpandedDrafts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Otomatis ciutkan pengaturan waktu ketika tanggal berhasil dipilih
  useEffect(() => {
    if (tanggal) {
      setIsEditingTime(false);
    } else {
      setIsEditingTime(true);
    }
  }, [tanggal]);

  return (
    <>
      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: 'var(--bg-dark)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-dim)' }}>
        <button 
          onClick={() => setActiveTab('form')}
          className="tab-button-custom"
          style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: '0.2s', backgroundColor: activeTab === 'form' ? '#ffffff' : 'transparent', color: activeTab === 'form' ? 'var(--neon-cyan)' : 'var(--text-dim)', boxShadow: activeTab === 'form' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', fontFamily: 'var(--font-tech)', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          📝 <span className="hide-on-mobile">FORMULIR </span>INPUT
        </button>
        <button 
          onClick={() => setActiveTab('queue')}
          className="tab-button-custom"
          style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: '0.2s', backgroundColor: activeTab === 'queue' ? '#ffffff' : 'transparent', color: activeTab === 'queue' ? 'var(--neon-cyan)' : 'var(--text-dim)', boxShadow: activeTab === 'queue' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', fontFamily: 'var(--font-tech)', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          🚀 ANTREAN<span className="hide-on-mobile"> PENGIRIMAN</span> {laporans.length > 0 && <span className="queue-badge-cool">{laporans.length}</span>}
        </button>
      </div>

      {activeTab === 'form' && (
        <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="section-heading">
        <span className="step-number step-badge--done">1</span>
        PENGATURAN
      </div>
      
      {!isEditingTime && tanggal ? (
        <div className="active-form-section" style={{ padding: '16px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-tech)' }}>WAKTU PELAPORAN AKTIF:</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neon-cyan)', fontFamily: 'var(--font-tech)' }}>
              {availableDates.find(d => d.value === tanggal)?.label || tanggal}
            </span>
          </div>
          <button type="button" onClick={() => setIsEditingTime(true)} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-dim)', color: 'var(--neon-cyan)', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-tech)', fontSize: '12px', fontWeight: 'bold', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            UBAH
          </button>
        </div>
      ) : (
      <div className="active-form-section" style={{ animation: 'slideDown 0.3s ease' }}>
        {/* Nama Pengirim dipindahkan ke sini (Pengaturan Waktu) */}
        <div className="input-group" style={{ marginTop: '12px' }}>
          <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>
            Nama Pengirim:
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={penanggungJawab}
              onChange={(e) => setPenanggungJawab(e.target.value)}
              className="form-input"
              placeholder="Nama Anda (Penanggung Jawab)"
              disabled={isLoading}
              style={{ height: '48px', boxSizing: 'border-box', width: '100%' }}
            />
          </div>
        </div>
        
        <div className="input-group">
          <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>
            Pilih Bulan Laporan:
          </label>
          <div className="custom-select-wrapper">
            <div
              className={`custom-select-trigger ${openDropdown === 'month' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
              onClick={() => !isLoading && setOpenDropdown(openDropdown === 'month' ? null : 'month')}
              style={{ height: '52px', boxSizing: 'border-box' }}
            >
              <div className="custom-select-value">
                {selectedBulan ? <span>{uniqueBulanOptions.find(b => b.value === selectedBulan)?.label || selectedBulan}</span> : <span className="custom-select-placeholder">-- Menunggu Input --</span>}
              </div>
              <span className="chevron-icon">▼</span>
            </div>
            {openDropdown === 'month' && (
              <div className="custom-select-dropdown">
                {uniqueBulanOptions.map((b, idx) => (
                  <div key={idx} className={`custom-select-item ${selectedBulan === b.value ? 'selected' : ''}`} onClick={() => handleBulanSelect(b.value)}>
                    <span style={{ fontSize: '14px', opacity: selectedBulan === b.value ? 1 : 0.5 }}>{'>'}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="input-group">
          <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>
            Pilih Tanggal (Senin):
            {isTanggalLocked && <span className="lock-badge" style={{ marginLeft: '8px' }}>🔒 Pilih Bulan Dulu</span>}
          </label>
          <div className="custom-select-wrapper" style={{ opacity: isTanggalLocked ? 0.4 : 1, pointerEvents: isTanggalLocked ? 'none' : 'auto', transition: '0.3s' }}>
            <div
              className={`custom-select-trigger ${openDropdown === 'date' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
              onClick={() => !isLoading && !isTanggalLocked && setOpenDropdown(openDropdown === 'date' ? null : 'date')}
              style={{ height: '52px', boxSizing: 'border-box' }}
            >
              <div className="custom-select-value">
                {tanggal ? (
                  <>
                    <span>[D]</span>
                    <span>
                      {availableDates.find(d => d.value === tanggal)?.label || tanggal}
                    </span>
                  </>
                ) : (
                  <span className="custom-select-placeholder">-- Menunggu Input --</span>
                )}
              </div>
              <span className="chevron-icon">▼</span>
            </div>
            {openDropdown === 'date' && (
              <div className="custom-select-dropdown">
                {availableDates.length > 0 ? availableDates.map((dateObj, idx) => {
                  return (
                    <div key={idx} className={`custom-select-item ${tanggal === dateObj.value ? 'selected' : ''}`} onClick={() => handleTanggalSelect(dateObj.value)}>
                      <span style={{ fontSize: '14px', opacity: tanggal === dateObj.value ? 1 : 0.5 }}>{'>'}</span>
                      <span>
                        {dateObj.label}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="custom-select-item" style={{ justifyContent: 'center', color: '#4b5563', cursor: 'default' }}>TIDAK ADA DATA</div>
                )}
              </div>
            )}
          </div>
        </div>

        {tanggal && (
          <button type="button" onClick={() => setIsEditingTime(false)} style={{ marginTop: '12px', padding: '12px', fontSize: '12px', width: '100%', background: 'transparent', border: '1px dashed var(--neon-cyan)', color: 'var(--neon-cyan)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'var(--font-tech)' }}>
            SIMPAN WAKTU
          </button>
        )}
      </div>
      )}

      <div className="section-heading" style={{ opacity: isEntriLocked ? 0.4 : 1, transition: '0.3s' }}>
        <span className={`step-number ${completedSteps.tanggal && laporans.length > 0 ? 'step-badge--done' : ''}`}>2</span>
        ENTRI DATA
        {isEntriLocked && <span className="lock-badge">🔒 Pilih Tanggal Dulu</span>}
      </div>

      <div className="active-form-section" style={{ opacity: isEntriLocked ? 0.35 : 1, pointerEvents: isEntriLocked ? 'none' : 'auto', transition: '0.3s', filter: isEntriLocked ? 'grayscale(0.5)' : 'none' }}>
        <div className="input-group">
          <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Nama UKM:</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={currentUkm}
              onChange={handleUkmChange}
              className="form-input"
              placeholder="Cth: UKM Tari"
              disabled={isLoading}
              style={{
                height: '52px', boxSizing: 'border-box', width: '100%', paddingRight: '40px',
                borderColor: ukmError && currentUkm ? 'var(--neon-red)' : (currentUkm && !ukmError ? 'var(--neon-green)' : undefined),
                outlineColor: ukmError && currentUkm ? 'var(--neon-red)' : (currentUkm && !ukmError ? 'var(--neon-green)' : undefined),
                backgroundColor: ukmError && currentUkm ? 'var(--neon-red-dim)' : (currentUkm && !ukmError ? 'rgba(16, 185, 129, 0.05)' : undefined)
              }}
            />
            {currentUkm && (
              <span style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                color: ukmError ? 'var(--neon-red)' : 'var(--neon-green)'
              }}>
                {ukmError ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </span>
            )}
          </div>
          {ukmError && (
            <div className="warning-card warning-card--error" style={{ textAlign: 'left', marginTop: '8px' }}>
              <span className="warning-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
              <span className="warning-card__text">{ukmError}</span>
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Lampiran File (Maks: 3):</label>
          {currentFotos.length < 3 && (
            <label className="file-dropzone" style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
              <input type="file" accept="image/jpeg, image/png, image/jpg, image/webp" multiple onChange={handleFileChange} className="hidden-input" disabled={isLoading} />
              <span className="dropzone-icon">📁</span>
              <span className="dropzone-text">[ KLIK/TAP UNTUK MENGUNGGAH ]</span>
              <span className="dropzone-subtext">MENDUKUNG FORMAT: JPG/PNG/WEBP</span>
            </label>
          )}

          {currentFotos.length > 0 && (
            <div className="draft-dropdown-wrapper" style={{ marginTop: '12px' }}>
              <button 
                type="button" 
                onClick={() => setIsFormFilesExpanded(!isFormFilesExpanded)} 
                className={`draft-dropdown-trigger ${isFormFilesExpanded ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <span>{currentFotos.length} Lampiran<span className="hide-on-mobile"> File Diunggah</span></span>
                </div>
                <span className="toggle-chevron">▼</span>
              </button>
              
              {isFormFilesExpanded && (
                <div className="draft-dropdown-content">
                  {currentFotos.map((foto, index) => {
                    const previewUrl = URL.createObjectURL(foto);
                    return (
                      <div key={index} className="draft-dropdown-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px', cursor: 'default' }}>
                        <div 
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }}
                          onClick={() => setPreviewImage(previewUrl)}
                          title="Klik untuk lihat gambar"
                        >
                          <span className="tech-file-icon">🖼️</span>
                          <span className="tech-file-name" style={{ fontSize: '12px', fontFamily: 'var(--font-tech)' }}>{foto.name}</span>
                        </div>
                        <button type="button" onClick={() => removeCurrentFoto(index)} className="btn-delete-file" disabled={isLoading} title="Hapus File">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <button type="button" onClick={addToDraft} className="btn-add-draft" disabled={isLoading}>
          {isLoading ? 'MENYIAPKAN DATA...' : '+ MASUKKAN KE ANTREAN'}
        </button>
      </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="section-heading" style={{ opacity: isAntreanLocked ? 0.4 : 1, transition: '0.3s' }}>
            <span className={`step-number ${laporans.length > 0 ? 'step-badge--done' : ''}`}>3</span>
            ANTREAN PENGIRIMAN ({laporans.length})
            {isAntreanLocked && <span className="lock-badge">🔒 Pilih Tanggal Dulu</span>}
          </div>

          <div className="draft-list-wrapper" style={{ opacity: isAntreanLocked ? 0.35 : 1, pointerEvents: isAntreanLocked ? 'none' : 'auto', transition: '0.3s', filter: isAntreanLocked ? 'grayscale(0.5)' : 'none', padding: '16px' }}>
        <div className="draft-list-section">
          {laporans.length === 0 ? (
            <div className="empty-draft">[ ANTREAN KOSONG ]</div>
          ) : (
            laporans.map((laporan, index) => {
              const currentProgress = uploadProgress[laporan.id] || 0;
              const isProcessing = processingId === laporan.id || currentProgress > 0;
              const isSuccess = currentProgress === 100;
              return (
                <div className={`draft-item ${isProcessing ? 'processing' : ''}`} key={laporan.id}>
                      <div className="draft-item-header">
                        <div className="draft-title-wrapper" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', overflow: 'hidden' }}>
                            <span className="draft-number">#{index + 1}</span>
                            <span className="draft-title">{laporan.namaUkm}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-tech)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            {tanggal ? (availableDates.find(d => d.value === tanggal)?.label || tanggal) : 'Menunggu Tanggal'}
                          </div>
                        </div>
                        <div className="draft-menu-container">
                          <button 
                            type="button" 
                            className={`btn-kebab-menu ${openDraftMenuId === laporan.id ? 'active' : ''}`}
                            onClick={() => setOpenDraftMenuId(openDraftMenuId === laporan.id ? null : laporan.id)}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                          </button>
                          {openDraftMenuId === laporan.id && (
                            <>
                              <div className="draft-menu-overlay" onClick={() => setOpenDraftMenuId(null)}></div>
                              <div className="draft-dropdown-menu">
                                  <button type="button" className="draft-menu-item edit" onClick={() => { handleEditDraft(laporan.id, () => setActiveTab('form')); setOpenDraftMenuId(null); }} disabled={isLoading}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    Edit Laporan
                                  </button>
                                <button type="button" className="draft-menu-item delete" onClick={() => { removeDraft(laporan.id); setOpenDraftMenuId(null); }} disabled={isLoading}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  Hapus dari Antrean
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="draft-info">
                        <div className="draft-dropdown-wrapper">
                          <button 
                            type="button" 
                            onClick={() => toggleDraftExpand(laporan.id)} 
                            className={`draft-dropdown-trigger ${expandedDrafts[laporan.id] ? 'active' : ''}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                          <span>{laporan.fotos.length} Lampiran<span className="hide-on-mobile"> Foto Tersimpan</span></span>
                            </div>
                            <span className="toggle-chevron">▼</span>
                          </button>
                          {expandedDrafts[laporan.id] && (
                            <div className="draft-dropdown-content">
                              {laporan.fotos.map((f, idx) => (
                                <button key={idx} type="button" className="draft-dropdown-item" onClick={() => setPreviewImage(f.data)} title="Klik untuk lihat gambar">
                                  <span className="tech-file-icon">🖼️</span>
                                  <span className="tech-file-name">{f.name || `FILE_${idx + 1}`}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                    {isProcessing && (
                      <div className="progress-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span className={`draft-status-text ${isSuccess ? 'success' : ''}`}>
                            {isSuccess ? 'TERKIRIM' : `MENGUNGGAH... ${currentProgress}%`}
                          </span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className={`progress-bar-fill ${isSuccess ? 'success' : ''}`} style={{ width: `${currentProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button type="button" onClick={handleSubmit} disabled={isLoading || laporans.length === 0} className={`submit-button ${isLoading ? 'loading' : ''}`}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <img src={spinnerLoading} alt="Loading" style={{ width: '18px', height: '18px', animation: 'spinLoading 1s linear infinite' }} />
              <span>MENGUNGGAH {currentUploadIndex}/{totalUploads}</span>
            </div>
          ) : (
            `JALANKAN PENGUNGGAHAN (${laporans.length})`
          )}
        </button>
      </div>
        </div>
      )}
    </>
  );
}
