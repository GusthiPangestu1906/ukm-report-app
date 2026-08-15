import React from 'react';

const EntrySection = ({
  isEntriLocked, completedSteps, laporans, currentUkm, handleUkmChange,
  isLoading, ukmError, currentFotos, handleFileChange, removeCurrentFoto,
  setPreviewImage, addToDraft
}) => (
  <>
    <div className="section-heading" style={{ opacity: isEntriLocked ? 0.4 : 1, transition: '0.3s' }}>
      <span className={`step-number ${completedSteps.tanggal && laporans.length > 0 ? 'step-badge--done' : ''}`}>2</span>
      ENTRI DATA
      {isEntriLocked && <span className="lock-badge">🔒 Pilih Tanggal Dulu</span>}
    </div>

    <div className="active-form-section" style={{ opacity: isEntriLocked ? 0.35 : 1, pointerEvents: isEntriLocked ? 'none' : 'auto', transition: '0.3s', filter: isEntriLocked ? 'grayscale(0.5)' : 'none' }}>
      <div className="input-group">
        <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>🏷️ NAMA UKM:</label>
        <div className="ukm-input-container" style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={currentUkm}
            onChange={handleUkmChange}
            className="form-input"
            placeholder="Cth: UKM Tari"
            disabled={isLoading}
            style={{
              height: '48px', boxSizing: 'border-box', width: '100%', paddingRight: ukmError && currentUkm ? '40px' : '16px',
              borderColor: ukmError && currentUkm ? 'var(--neon-red)' : undefined,
              outlineColor: ukmError && currentUkm ? 'var(--neon-red)' : undefined,
              backgroundColor: ukmError && currentUkm ? 'var(--neon-red-dim)' : undefined
            }}
          />
          {ukmError && currentUkm && (
            <span className="ukm-validation-icon error" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label className="form-label">📸 LAMPIRAN FOTO KEGIATAN:</label>
          <span className="photo-quota-badge">{currentFotos.length}/3 Foto</span>
        </div>

        {currentFotos.length < 3 && (
          <label className="file-dropzone" style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
            <input type="file" accept="image/jpeg, image/png, image/jpg, image/webp" multiple onChange={handleFileChange} className="hidden-file-input" disabled={isLoading} />
            <div className="dropzone-inner">
              <div className="dropzone-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <div className="dropzone-text-group">
                <span className="dropzone-main-text">UNGGAH FOTO KEGIATAN</span>
                <span className="dropzone-subtext">JPG, PNG (Maks 10MB per file)</span>
              </div>
            </div>
          </label>
        )}

        {currentFotos.length > 0 && (
          <div className="photo-thumbnail-grid">
            {currentFotos.map((foto, index) => {
              const previewUrl = URL.createObjectURL(foto);
              return (
                <div key={index} className="photo-thumbnail-card">
                  <div className="photo-thumbnail-img-wrapper" onClick={() => setPreviewImage(previewUrl)} title="Klik untuk memperbesar">
                    <img src={previewUrl} alt={foto.name} className="photo-thumbnail-img" />
                    <div className="photo-thumbnail-overlay">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </div>
                  </div>
                  <div className="photo-thumbnail-info">
                    <span className="photo-thumbnail-name" title={foto.name}>{foto.name}</span>
                    <span className="photo-thumbnail-size">{(foto.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <button type="button" onClick={() => removeCurrentFoto(index)} className="btn-remove-photo-thumbnail" disabled={isLoading} title="Hapus foto ini">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button type="button" onClick={addToDraft} className="btn-add-draft-modern" disabled={isLoading}>
        {!isLoading && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        )}
        <span>{isLoading ? 'MENYIAPKAN DATA...' : 'MASUKKAN KE ANTREAN'}</span>
      </button>
    </div>
  </>
);

export default EntrySection;
