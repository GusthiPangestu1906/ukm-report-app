import React from 'react';

const QueueSection = ({
  isAntreanLocked, laporans, uploadProgress, processingId, tanggal,
  availableDates, openDraftMenuId, setOpenDraftMenuId, handleEditDraft,
  setActiveTab, removeDraft, toggleDraftExpand, expandedDrafts, setPreviewImage,
  handleSubmit, isLoading, currentUploadIndex, totalUploads
}) => (
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
                  <div className="draft-title-container">
                    <div className="draft-title-main">
                      <span className="draft-number">#{index + 1}</span>
                      <span className="draft-title">{laporan.namaUkm}</span>
                    </div>
                    <div className="draft-item-info-row">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {tanggal ? (availableDates.find(d => d.value === tanggal)?.label || tanggal) : 'Menunggu Tanggal'}
                    </div>
                  </div>
                  <div className="draft-menu-container">
                    <button type="button" className={`btn-kebab-menu ${openDraftMenuId === laporan.id ? 'active' : ''}`} onClick={() => setOpenDraftMenuId(openDraftMenuId === laporan.id ? null : laporan.id)}>
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
                    <button type="button" onClick={() => toggleDraftExpand(laporan.id)} className={`draft-dropdown-trigger ${expandedDrafts[laporan.id] ? 'active' : ''}`}>
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
        {isLoading ? <span>MENGUNGGAH {currentUploadIndex}/{totalUploads}</span> : `JALANKAN PENGUNGGAHAN (${laporans.length})`}
      </button>
    </div>
  </div>
);

export default QueueSection;
