import React from 'react';

const SettingsSection = ({
  isEditingTime, setIsEditingTime, tanggal, penanggungJawab, setPenanggungJawab,
  availableDates, isLoading, quickPresets, isSeninIniActive, isSeninLaluActive,
  isCustomDateMode, setIsCustomDateMode, handleQuickPresetClick,
  openDropdown, setOpenDropdown, uniqueBulanOptions, selectedBulan,
  handleBulanSelect, isTanggalLocked, handleTanggalSelect
}) => (
  <>
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
            <span className="sender-pill-badge" title="Pengirim Laporan" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span className="sender-name">{penanggungJawab || 'Pengirim'}</span>
            </span>
            <span className="date-pill-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>{availableDates.find(d => d.value === tanggal)?.label || tanggal}</span>
            </span>
          </div>
        </div>
        <button type="button" onClick={() => setIsEditingTime(true)} className="btn-change-settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>UBAH</span>
        </button>
      </div>
    ) : (
      <div className="active-form-section" style={{ animation: 'slideDown 0.3s ease' }}>
        <div className="input-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>NAMA PENGIRIM:</span>
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

        <div className="input-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>PILIH TANGGAL REPORTING:</span>
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
                        <span>{availableDates.find(d => d.value === tanggal)?.label || tanggal}</span>
                      </>
                    ) : (
                      <span className="custom-select-placeholder">-- Menunggu Input --</span>
                    )}
                  </div>
                  <span className="chevron-icon">▼</span>
                </div>
                {openDropdown === 'date' && (
                  <div className="custom-select-dropdown">
                    {availableDates.length > 0 ? availableDates.map((dateObj, idx) => (
                      <div key={idx} className={`custom-select-item ${tanggal === dateObj.value ? 'selected' : ''}`} onClick={() => handleTanggalSelect(dateObj.value)}>
                        <span style={{ fontSize: '14px', opacity: tanggal === dateObj.value ? 1 : 0.5 }}>{'>'}</span>
                        <span>{dateObj.label}</span>
                      </div>
                    )) : (
                      <div className="custom-select-item" style={{ justifyContent: 'center', color: '#4b5563', cursor: 'default' }}>TIDAK ADA DATA</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tanggal && (
          <button type="button" onClick={() => setIsEditingTime(false)} className="btn-save-settings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>SIMPAN & SELESAI</span>
          </button>
        )}
      </div>
    )}
  </>
);

export default SettingsSection;
