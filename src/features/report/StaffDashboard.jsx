import React from 'react';

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
  handleSubmit
}) {
  return (
    <>
      <div className="section-heading">
         <span className="step-number step-badge--done">1</span>
            PENGATURAN WAKTU
        </div>
        <div className="active-form-section">
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
                {selectedBulan ? <span>{bulanOptions.find(b => b.value === selectedBulan)?.label || selectedBulan}</span> : <span className="custom-select-placeholder">-- Menunggu Input --</span>}
              </div>
              <span className="chevron-icon">▼</span>
            </div>
            {openDropdown === 'month' && (
              <div className="custom-select-dropdown">
                {bulanOptions.map((b, idx) => (
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
                      {submittedUkms.length > 0 && <span style={{ marginLeft: '8px', color: '#39ff14' }}>[Terisi]</span>}
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
                  const hasReport = historyData.some(h => h.tanggal === dateObj.value);
                  return (
                    <div key={idx} className={`custom-select-item ${tanggal === dateObj.value ? 'selected' : ''}`} onClick={() => handleTanggalSelect(dateObj.value)}>
                      <span style={{ fontSize: '14px', opacity: tanggal === dateObj.value ? 1 : 0.5 }}>{'>'}</span>
                      <span>
                        {dateObj.label}
                        {hasReport && <span style={{ marginLeft: '8px', color: '#39ff14' }}>[Terisi]</span>}
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

        <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'rgba(0,240,255,0.05)', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.2)', textAlign: 'center', fontFamily: 'var(--font-tech)' }}>
          {!tanggal ? (
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>PILIH TANGGAL UNTUK MELANJUTKAN</span>
          ) : isLoadingHistory ? (
            <span style={{ fontSize: '12px', color: '#00f0ff' }}>MEMINDAI DATABASE...</span>
          ) : submittedUkms.length > 0 ? (
            <span style={{ fontSize: '12px', color: '#39ff14', fontWeight: 'bold' }}>[ OK ] DITEMUKAN {submittedUkms.length} DATA PADA TANGGAL INI.</span>
          ) : (
            <span style={{ fontSize: '12px', color: '#00f0ff' }}>[ KOSONG ] BELUM ADA DATA PADA TANGGAL INI.</span>
          )}
        </div>
      </div>

      <div className="section-heading" style={{ opacity: isEntriLocked ? 0.4 : 1, transition: '0.3s' }}>
        <span className={`step-number ${completedSteps.tanggal && laporans.length > 0 ? 'step-badge--done' : ''}`}>2</span>
        ENTRI DATA
        {isEntriLocked && <span className="lock-badge">🔒 Pilih Tanggal Dulu</span>}
      </div>

      <div className="active-form-section" style={{ opacity: isEntriLocked ? 0.35 : 1, pointerEvents: isEntriLocked ? 'none' : 'auto', transition: '0.3s', filter: isEntriLocked ? 'grayscale(0.5)' : 'none' }}>
        <div className="input-group">
          <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Nama UKM:</label>
          <input
            type="text"
            value={currentUkm}
            onChange={handleUkmChange}
            className="form-input"
            placeholder="Cth: UKM Tari"
            disabled={isLoading}
            style={{
              height: '52px', boxSizing: 'border-box',
              borderColor: ukmError ? 'var(--neon-red)' : undefined,
              outlineColor: ukmError ? 'var(--neon-red)' : undefined,
              backgroundColor: ukmError ? 'rgba(255,0,60,0.08)' : undefined
            }}
          />
          {ukmError && (
            <div className="warning-card warning-card--error">
              <span className="warning-card__icon">!</span>
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
            <div className="file-chips-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '12px' }}>
              {currentFotos.map((foto, index) => {
                const previewUrl = URL.createObjectURL(foto);
                return (
                  /* SUNTIKAN STYLE PADA FILE CHIP AGAR SEJAJAR */
                  <div className="file-chip" key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                    
                    <button 
                      type="button" 
                      className="tech-file-card" 
                      onClick={() => setPreviewImage(previewUrl)} 
                      title="Klik untuk lihat gambar"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', height: '42px', boxSizing: 'border-box', overflow: 'hidden' }}
                    >
                      <span className="tech-file-icon">🖼️</span>
                      <span className="tech-file-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '11px', textAlign: 'left' }}>
                        {foto.name}
                      </span>
                    </button>
                    
                    {/* TOMBOL SILANG SAKTI (DIPRESISIKAN DIMENSINYA) */}
                    <button 
                      type="button" 
                      onClick={() => removeCurrentFoto(index)} 
                      className="file-chip-remove" 
                      disabled={isLoading}
                      style={{
                        background: 'rgba(255, 0, 60, 0.1)',
                        border: '1px solid #ff003c',
                        borderRadius: '4px',
                        color: '#ff003c',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '42px',   // Mengunci lebar agar kotak sempurna sejajar card file
                        height: '42px',  // Mengunci tinggi sejajar card file
                        fontSize: '14px',
                        fontWeight: 'bold',
                        flexShrink: 0,   // Mencegah tombol gepeng saat nama file terlalu panjang
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.target.style.background = '#ff003c'; e.target.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'rgba(255, 0, 60, 0.1)'; e.target.style.color = '#ff003c'; }}
                    >
                      ✕
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button type="button" onClick={addToDraft} className="btn-add-draft" disabled={isLoading}>
          {isLoading ? 'MENYIAPKAN DATA...' : '+ MASUKKAN KE ANTREAN'}
        </button>
      </div>

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
                  <div className="draft-info">
                    <span className="draft-title">[{index + 1}] {laporan.namaUkm}</span>
                    <div className="draft-file-list">
                      {laporan.fotos.map((f, idx) => (
                        <button key={idx} type="button" className="tech-file-card" onClick={() => setPreviewImage(f.data)} title="Klik untuk lihat gambar">
                          <span className="tech-file-icon">🖼️</span>
                          <span>FILE_{idx + 1}</span>
                        </button>
                      ))}
                    </div>
                    <span className="draft-subtitle">Lampiran: {laporan.fotos.length} file foto tersimpan</span>
                    {isProcessing && (
                      <div className="progress-container">
                        <span className={`draft-status-text ${isSuccess ? 'success' : ''}`}>
                          {isSuccess ? '[ SELESAI ] Data Terkirim' : `> MENGUNGGAH DATA KONEKSI (${currentProgress}%)`}
                        </span>
                        <div className="progress-bar-bg">
                          <div className={`progress-bar-fill ${isSuccess ? 'success' : ''}`} style={{ width: `${currentProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => removeDraft(laporan.id)} className="btn-delete-draft" disabled={isLoading}>✕</button>
                </div>
              );
            })
          )}
        </div>

        <button type="button" onClick={handleSubmit} disabled={isLoading || laporans.length === 0} className="submit-button">
          {isLoading ? 'MENGIRIMKAN...' : `JALANKAN PENGUNGGAHAN (${laporans.length})`}
        </button>
      </div>
    </>
  );
}
