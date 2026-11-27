import React, { useState, useEffect } from 'react';
import { getQuickMondayPresets } from '../../utils/helpers';
import TabNavigation from './components/TabNavigation';
import SettingsSection from './components/SettingsSection';
import EntrySection from './components/EntrySection';
import QueueSection from './components/QueueSection';
import DesktopBentoGrid from './components/DesktopBentoGrid';
import Header from '../ui/components/Header';
import { useIsDesktop } from '../ui/hooks/useMediaQuery';

export default function StaffDashboard(props) {
  const {
    tanggal, laporans = [], processingId, handleBulanSelect, handleTanggalSelect,
    selectedBulan, bulanOptions = [], penanggungJawab, openDropdown, setOpenDropdown,
    publicSpreadsheetUrl, onOpenAdmin, adminProfile
  } = props;

  const isDesktop = useIsDesktop(1024);
  const [activeTab, setActiveTab] = useState('form');
  const [isEditingTime, setIsEditingTime] = useState(!penanggungJawab || !tanggal);
  const [isCustomDateMode, setIsCustomDateMode] = useState(false);
  const [expandedDrafts, setExpandedDrafts] = useState({});
  const [openDraftMenuId, setOpenDraftMenuId] = useState(null);

  const quickPresets = getQuickMondayPresets();
  const isSeninIniActive = (tanggal === quickPresets.seninIni.value);
  const isSeninLaluActive = (tanggal === quickPresets.seninLalu.value);

  const handleQuickPresetClick = (preset) => {
    if (selectedBulan !== preset.monthVal) {
      handleBulanSelect(preset.monthVal);
    }
    handleTanggalSelect(preset.value);
    setIsCustomDateMode(false);
    if (penanggungJawab) {
      setIsEditingTime(false);
    }
  };

  const toggleDraftExpand = (id) => {
    setExpandedDrafts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!penanggungJawab || !tanggal) {
      setIsEditingTime(true);
    }
  }, [penanggungJawab, tanggal]);

  const uniqueBulanOptions = (bulanOptions || []).filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);
  const currentUploadIndex = processingId ? Math.max(1, (laporans || []).findIndex(l => l.id === processingId) + 1) : 1;

  // View untuk Layar Desktop (>= 1024px) - BENTO GRID 2 KARTU BERDAMPINGAN
  if (isDesktop) {
    return (
      <DesktopBentoGrid
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
        openDraftMenuId={openDraftMenuId}
        setOpenDraftMenuId={setOpenDraftMenuId}
        expandedDrafts={expandedDrafts}
        toggleDraftExpand={toggleDraftExpand}
        currentUploadIndex={currentUploadIndex}
      />
    );
  }

  // View untuk Layar Mobile / Tablet (< 1024px)
  // Struktur 100% persis seperti semula tanpa perubahan
  return (
    <div className="form-card">
      <Header publicSpreadsheetUrl={publicSpreadsheetUrl} onOpenAdmin={onOpenAdmin} adminProfile={adminProfile} />

      {openDropdown && (
        <div className="custom-select-overlay" onClick={() => setOpenDropdown(null)}></div>
      )}

      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueLength={laporans ? laporans.length : 0}
      />

      {activeTab === 'form' && (
        <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
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

          <EntrySection {...props} />
        </div>
      )}

      {activeTab === 'queue' && (
        <QueueSection
          {...props}
          isDesktop={false}
          setActiveTab={setActiveTab}
          openDraftMenuId={openDraftMenuId}
          setOpenDraftMenuId={setOpenDraftMenuId}
          expandedDrafts={expandedDrafts}
          toggleDraftExpand={toggleDraftExpand}
          currentUploadIndex={currentUploadIndex}
          totalUploads={laporans ? laporans.length : 0}
        />
      )}
    </div>
  );
}
