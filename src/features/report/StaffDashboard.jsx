import React, { useState, useEffect } from 'react';
import spinnerLoading from '../../assets/Spinner Loading.png';
import { getQuickMondayPresets } from '../../utils/helpers';

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
  , penanggungJawab, setPenanggungJawab, publicSpreadsheetUrl
}) {
  const [activeTab, setActiveTab] = useState('form');
  const [isEditingTime, setIsEditingTime] = useState(!tanggal);
  const [isCustomDateMode, setIsCustomDateMode] = useState(false);
  const [expandedDrafts, setExpandedDrafts] = useState({});
  const [openDraftMenuId, setOpenDraftMenuId] = useState(null);
  const [isFormFilesExpanded, setIsFormFilesExpanded] = useState(true);

  const quickPresets = getQuickMondayPresets();
  const isSeninIniActive = (tanggal === quickPresets.seninIni.value);
  const isSeninLaluActive = (tanggal === quickPresets.seninLalu.value);

  const handleQuickPresetClick = (preset) => {
    if (selectedBulan !== preset.monthVal) {
      handleBulanSelect(preset.monthVal);
    }
    handleTanggalSelect(preset.value);
    setIsCustomDateMode(false);
    setIsEditingTime(false);
  };

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
      {/* TAB NAVIGATION (2-SEGMENT SWITCH) */}
      <div className="staff-tabs-wrapper">
        <button 
          onClick={() => setActiveTab('form')}
          className={`staff-tab-button ${activeTab === 'form' ? 'active' : ''}`}
        >
          📝 <span className="hide-on-mobile">FORMULIR </span>INPUT
        </button>
        <button 
          onClick={() => setActiveTab('queue')}
          className={`staff-tab-button ${activeTab === 'queue' ? 'active' : ''}`}
        >
          🚀 ANTREAN<span className="hide-on-mobile"> PENGIRIMAN</span> {laporans.length > 0 && <span className="queue-badge-cool">{laporans.length}</span>}
        </button>
      </div>



      {activeTab === 'form' && (
        <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="section-heading">
        <span className={`step-number ${(!isEditingTime && tanggal) ? 'step-badge--done' : ''}`}>
          {(!isEditingTime && tanggal) ? '✓' : '1'}
        </span>
        PENGATURAN
      </div>
      
      {!isEditingTime && tanggal ? (
        <div className="settings-active-banner">
          <div className="settings-banner-left">
            <div className="settings-badge-row">
              <span className="sender-pill-badge" title="Pengirim Laporan">
                👤 <span className="sender-name">{penanggungJawab || 'Pengirim'}</span>
              </span>
              <span className="date-pill-badge">
                📅 {availableDates.find(d => d.value === tanggal)?.label || tanggal}
              </span>
            </div>
          </div>
          <button type="button" onClick={() => setIsEditingTime(true)} className="btn-change-settings">
            ✏️ UBAH
          </button>
        </div>
      ) : (
      <div className="active-form-section" style={{ animation: 'slideDown 0.3s ease' }}>
        {/* NAMA PENGIRIM (PROFILE CARD) */}
        <div className="input-group">
          <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>
            👤 NAMA PENGIRIM:
          </label>
          <input
            type="text"
            value={penanggungJawab}
            onChange={(e) => setPenanggungJawab(e.target.value)}
            className="form-input"
            placeholder="Nama Anda (Penanggung Jawab)"
            disabled={isLoading}
            style={{ height: '44px', boxSizing: 'border-box', width: '100%' }}
          />
        </div>

        {/* QUICK DATE CHIPS */}
        <div className="input-group">
          <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>
            📅 PILIH TANGGAL REPORTING:
          </label>
          <div className="quick-date-chips-wrapper">
            <button
              type="button"
              className={`quick-date-chip ${isSeninIniActive ? 'active' : ''}`}
              onClick={() => handleQuickPresetClick(quickPresets.seninIni)}
            >
              <span>{quickPresets.seninIni.label}</span>
            </button>
            <button
              type="button"
              className={`quick-date-chip ${isSeninLaluActive ? 'active' : ''}`}
              onClick={() => handleQuickPresetClick(quickPresets.seninLalu)}
            >
              <span>{quickPresets.seninLalu.label}</span>
            </button>
            <button
              type="button"
              className={`quick-date-chip ${isCustomDateMode || (!isSeninIniActive && !isSeninLaluActive) ? 'active' : ''}`}
              onClick={() => setIsCustomDateMode(!isCustomDateMode)}
            >
              <span>Lainnya...</span>
            </button>
          </div>
        </div>
        
        {/* CUSTOM DROPDOWNS (BULAN & TANGGAL SENIN) - Only show if custom mode or custom date active */}
        {(isCustomDateMode || (!isSeninIniActive && !isSeninLaluActive)) && (
          <div className="custom-date-section" style={{ animation: 'fadeIn 0.2s ease', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div className="input-group">
              <label className="form-label">Pilih Bulan Laporan:</label>
              <div className="custom-select-wrapper">
                <div
                  className={`custom-select-trigger ${openDropdown === 'month' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                  onClick={() => !isLoading && setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                  style={{ height: '48px', boxSizing: 'border-box' }}
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
              <label className="form-label">
                Pilih Tanggal (Senin):
                {isTanggalLocked && <span className="lock-badge" style={{ marginLeft: '8px' }}>🔒 Pilih Bulan Dulu</span>}
              </label>
              <div className="custom-select-wrapper" style={{ opacity: isTanggalLocked ? 0.4 : 1, pointerEvents: isTanggalLocked ? 'none' : 'auto', transition: '0.3s' }}>
                <div
                  className={`custom-select-trigger ${openDropdown === 'date' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                  onClick={() => !isLoading && !isTanggalLocked && setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                  style={{ height: '48px', boxSizing: 'border-box' }}
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
          </div>
        )}

        {tanggal && (
          <button
            type="button"
            onClick={() => setIsEditingTime(false)}
            className="btn-save-settings"
          >
            ✓ SIMPAN & SELESAI
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
        {/* NAMA UKM & QUICK SUGGESTION CHIPS */}
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

        {/* LAMPIRAN FOTO KEGIATAN & THUMBNAILS GRID */}
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label">📸 LAMPIRAN FOTO KEGIATAN:</label>
            <span className="photo-quota-badge">
              {currentFotos.length}/3 Foto
            </span>
          </div>

          {currentFotos.length < 3 && (
            <label className="file-dropzone" style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
              <input
                type="file"
                accept="image/jpeg, image/png, image/jpg, image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden-file-input"
                disabled={isLoading}
              />
              <div className="dropzone-inner">
                <div className="dropzone-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <div className="dropzone-text-group">
                  <span className="dropzone-main-text">KLIK / UNGGAH FOTO KEGIATAN</span>
                  <span className="dropzone-subtext">JPG, PNG, WEBP (Maks 10MB per file)</span>
                </div>
              </div>
            </label>
          )}

          {/* INSTANT PHOTO THUMBNAILS GRID */}
          {currentFotos.length > 0 && (
            <div className="photo-thumbnail-grid">
              {currentFotos.map((foto, index) => {
                const previewUrl = URL.createObjectURL(foto);
                const fileSizeFormatted = (foto.size / (1024 * 1024)).toFixed(2) + ' MB';
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
                      <span className="photo-thumbnail-size">{fileSizeFormatted}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCurrentFoto(index)}
                      className="btn-remove-photo-thumbnail"
                      disabled={isLoading}
                      title="Hapus foto ini"
                    >
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

        <button
          type="button"
          onClick={addToDraft}
          className="btn-add-draft-modern"
          disabled={isLoading}
        >
          {!isLoading && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          )}
          <span>{isLoading ? 'MENYIAPKAN DATA...' : 'MASUKKAN KE ANTREAN'}</span>
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
            <span>MENGUNGGAH {currentUploadIndex}/{totalUploads}</span>
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
