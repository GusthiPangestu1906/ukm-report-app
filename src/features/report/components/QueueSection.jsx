import React, { useState, useEffect, useRef } from 'react';

const ITEMS_PER_SLIDE = 3;

const QueueSection = ({
  isAntreanLocked, laporans, processingId, tanggal,
  availableDates, openDraftMenuId, setOpenDraftMenuId, handleEditDraft,
  setActiveTab, removeDraft, toggleDraftExpand, expandedDrafts, setPreviewImage,
  handleSubmit, isLoading, currentUploadIndex, totalUploads, isDesktop = false
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const prevLengthRef = useRef(laporans.length);

  const totalSlides = Math.max(1, Math.ceil(laporans.length / ITEMS_PER_SLIDE));

  // Clamp slide if items are deleted
  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(Math.max(0, totalSlides - 1));
    }
  }, [totalSlides, currentSlide]);

  // Jump to newest slide when a new item is added
  useEffect(() => {
    if (isDesktop && laporans.length > prevLengthRef.current) {
      setCurrentSlide(Math.max(0, Math.ceil(laporans.length / ITEMS_PER_SLIDE) - 1));
    }
    prevLengthRef.current = laporans.length;
  }, [laporans.length, isDesktop]);

  // Follow active item during upload
  useEffect(() => {
    if (isDesktop && processingId) {
      const idx = laporans.findIndex(item => item.id === processingId);
      if (idx !== -1) {
        setCurrentSlide(Math.floor(idx / ITEMS_PER_SLIDE));
      }
    }
  }, [processingId, laporans, isDesktop]);

  const startIndex = isDesktop ? currentSlide * ITEMS_PER_SLIDE : 0;
  const visibleLaporans = isDesktop
    ? laporans.slice(startIndex, startIndex + ITEMS_PER_SLIDE)
    : laporans;

  return (
  <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
    {!isDesktop && (
      <div className="section-heading" style={{ opacity: isAntreanLocked ? 0.4 : 1, transition: '0.3s' }}>
        <span className={`step-number ${laporans.length > 0 ? 'step-badge--done' : ''}`}>3</span>
        ANTREAN PENGIRIMAN ({laporans.length})
        {isAntreanLocked && <span className="lock-badge">🔒 Pilih Tanggal Dulu</span>}
      </div>
    )}

    {isDesktop && isAntreanLocked && (
      <div className="bento-lock-alert">
        <span>🔒</span>
        <span>Pilih Tanggal & Nama Pengirim di formulir kiri untuk mengaktifkan antrean</span>
      </div>
    )}

    <div className="draft-list-wrapper" style={{ opacity: isAntreanLocked ? 0.35 : 1, pointerEvents: isAntreanLocked ? 'none' : 'auto', transition: '0.3s', filter: isAntreanLocked ? 'grayscale(0.5)' : 'none', padding: '16px' }}>
      <div className="draft-list-section" key={isDesktop ? `slide-${currentSlide}` : 'mobile-list'} style={isDesktop ? { animation: 'fadeIn 0.2s ease' } : undefined}>
        {laporans.length === 0 ? (
          isDesktop ? (
            <div className="bento-empty-queue">
              <div className="bento-empty-icon">📥</div>
              <div className="bento-empty-title">Antrean Masih Kosong</div>
              <p className="bento-empty-desc">
                Isi formulir pelaporan di sebelah kiri, lalu klik <strong>"MASUKKAN KE ANTREAN"</strong>. Laporan yang ditambahkan akan muncul di sini dan siap dikirim.
              </p>
            </div>
          ) : (
            <div className="empty-draft">[ ANTREAN KOSONG ]</div>
          )
        ) : (
          visibleLaporans.map((laporan, index) => {
            const globalIndex = startIndex + index;
            const isProcessing = processingId === laporan.id;
            return (
              <div className={`draft-item ${isProcessing ? 'processing' : ''}`} key={laporan.id}>
                <div className="draft-item-header">
                  <div className="draft-title-container">
                    <div className="draft-title-main">
                      <span className="draft-number">#{globalIndex + 1}</span>
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
                </div>
              </div>
            );
          })
        )}
      </div>

      {isDesktop && totalSlides > 1 && (
        <div className="bento-queue-pagination">
          <button
            type="button"
            className="bento-slide-btn"
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            title="Slide sebelumnya"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div className="bento-slide-dots">
            {Array.from({ length: totalSlides }, (_, idx) => (
              <button
                key={idx}
                type="button"
                className={`bento-slide-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                title={`Slide ${idx + 1}`}
              />
            ))}
            <span className="bento-slide-counter">{currentSlide + 1} / {totalSlides}</span>
          </div>

          <button
            type="button"
            className="bento-slide-btn"
            onClick={() => setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1))}
            disabled={currentSlide === totalSlides - 1}
            title="Slide berikutnya"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      )}

      <button type="button" onClick={handleSubmit} disabled={isLoading || laporans.length === 0} className={`submit-button ${isLoading ? 'loading' : ''}`}>
        {isLoading ? <span>MENGUNGGAH {currentUploadIndex}/{totalUploads}</span> : `JALANKAN PENGUNGGAHAN (${laporans.length})`}
      </button>
    </div>
  </div>
  );
};

export default QueueSection;
