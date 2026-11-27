import React from 'react';
import Header from '../../ui/components/Header';
import SettingsSection from './SettingsSection';
import EntrySection from './EntrySection';
import QueueSection from './QueueSection';

export default function DesktopBentoGrid(props) {
  const {
    laporans = [], publicSpreadsheetUrl, openDropdown, setOpenDropdown,
    isEditingTime, setIsEditingTime, quickPresets, isSeninIniActive,
    isSeninLaluActive, isCustomDateMode, setIsCustomDateMode,
    handleQuickPresetClick, uniqueBulanOptions, openDraftMenuId,
    setOpenDraftMenuId, expandedDrafts, toggleDraftExpand,
    currentUploadIndex, onOpenAdmin, adminProfile
  } = props;

  return (
    <div className="bento-page-shell">
      <div className="bento-topbar">
        <Header publicSpreadsheetUrl={publicSpreadsheetUrl} isTopBar={true} onOpenAdmin={onOpenAdmin} adminProfile={adminProfile} />
      </div>

      {openDropdown && (
        <div className="custom-select-overlay" onClick={() => setOpenDropdown(null)}></div>
      )}

      {/* BENTO SETTINGS BAR (FULL WIDTH AT TOP) */}
      <div className="form-card bento-card bento-settings-card">
        <SettingsSection
          {...props}
          isEditingTime={isEditingTime}
          setIsEditingTime={setIsEditingTime}
          quickPresets={quickPresets}
          isSeninIniActive={isSeninIniActive}
          isSeninLaluActive={isSeninLaluActive}
          isCustomDateMode={isCustomDateMode}
          setIsCustomDateMode={setIsCustomDateMode}
          handleQuickPresetClick={handleQuickPresetClick}
          uniqueBulanOptions={uniqueBulanOptions}
        />
      </div>

      <div className="bento-grid-container">
        {/* BENTO 1 (KIRI): ENTRI DATA */}
        <div className="form-card bento-card bento-card--form">
          <EntrySection {...props} />
        </div>

      {/* BENTO 2 (KANAN): ANTREAN PENGIRIMAN */}
      <div className="form-card bento-card bento-card--queue">
        <div className="bento-queue-header">
          <div className="bento-queue-header-left">
            <div className="bento-queue-header-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div>
              <h3 className="bento-queue-title">Antrean Pengiriman</h3>
              <span className="bento-queue-subtitle">
                {laporans.length > 0 ? `${laporans.length} laporan siap dikirim` : 'Belum ada laporan di antrean'}
              </span>
            </div>
          </div>

          <div className="bento-queue-header-right">
            {publicSpreadsheetUrl && (
              <a
                href={publicSpreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sheets-header-btn"
                title="Buka Google Sheets Hasil Laporan"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Spreadsheet</span>
              </a>
            )}
          </div>
        </div>

        <QueueSection
          {...props}
          isDesktop={true}
          setActiveTab={() => {}}
          openDraftMenuId={openDraftMenuId}
          setOpenDraftMenuId={setOpenDraftMenuId}
          expandedDrafts={expandedDrafts}
          toggleDraftExpand={toggleDraftExpand}
          currentUploadIndex={currentUploadIndex}
          totalUploads={laporans.length}
        />
        </div>
      </div>
    </div>
  );
}
