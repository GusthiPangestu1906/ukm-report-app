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
          <button type="button" onClick={() => setIsEditingTime(false)} className="btn-save-settings">
            ✓ SIMPAN & SELESAI
          </button>
        )}
      </div>
    )}
  </>
);

export default SettingsSection;
