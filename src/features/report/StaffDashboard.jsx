import React, { useState, useEffect } from 'react';
import { getQuickMondayPresets } from '../../utils/helpers';
import TabNavigation from './components/TabNavigation';
import SettingsSection from './components/SettingsSection';
import EntrySection from './components/EntrySection';
import QueueSection from './components/QueueSection';

export default function StaffDashboard(props) {
  const {
    tanggal, laporans, processingId, handleBulanSelect, handleTanggalSelect,
    selectedBulan, bulanOptions
  } = props;

  const [activeTab, setActiveTab] = useState('form');
  const [isEditingTime, setIsEditingTime] = useState(!tanggal);
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
    setIsEditingTime(false);
  };

  const toggleDraftExpand = (id) => {
    setExpandedDrafts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    setIsEditingTime(!tanggal);
  }, [tanggal]);

  const uniqueBulanOptions = bulanOptions.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);
  const currentUploadIndex = processingId ? Math.max(1, laporans.findIndex(l => l.id === processingId) + 1) : 1;

  return (
    <>
      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueLength={laporans.length}
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
          setActiveTab={setActiveTab}
          openDraftMenuId={openDraftMenuId}
          setOpenDraftMenuId={setOpenDraftMenuId}
          expandedDrafts={expandedDrafts}
          toggleDraftExpand={toggleDraftExpand}
          currentUploadIndex={currentUploadIndex}
          totalUploads={laporans.length}
        />
      )}
    </>
  );
}
