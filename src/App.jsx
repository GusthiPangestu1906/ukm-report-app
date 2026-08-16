import React, { useState, useEffect } from 'react';
import './App.css';

// Assets
import logoLmb from './assets/Logo LMB.jpg';
import spinnerLoading from './assets/Spinner Loading.png';

// Components
import AuthScreen from './features/auth/AuthScreen';
import StaffDashboard from './features/report/StaffDashboard';
import Modal from './features/ui/Modal';
import ImagePreviewOverlay from './features/ui/ImagePreviewOverlay';
import Header from './features/ui/components/Header';
import UploadProgressModal from './features/ui/components/UploadProgressModal';

// Hooks (Business Logic Layer)
import { useAuth } from './features/auth/hooks/useAuth';
import { useDateSettings } from './features/report/hooks/useDateSettings';
import { useReportHistory } from './features/report/hooks/useReportHistory';
import { useReportForm } from './features/report/hooks/useReportForm';
import { useModal } from './features/ui/hooks/useModal';

function App() {
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);

  // 1. UI & Modal Hook
  const { modal, showAlert, showConfirm, closeModal } = useModal();

  // 2. Auth Hook (Identity & Access)
  const {
    user, isAuthLoading, userRole, isGoogleLoading, penanggungJawab,
    handleLogin, executeLogout, handlePenanggungChange
  } = useAuth();

  // Global Initialization
  useEffect(() => {
    setIsAppInitialized(true);
  }, []);

  // 3. Date Settings Hook (Time Logic)
  const dateSettings = useDateSettings(isAppInitialized);

  // 4. History Hook (Data Persistence)
  const historySettings = useReportHistory(user);

  // 5. Report Form Hook (Main Business Logic)
  const reportForm = useReportForm(
    isAppInitialized,
    dateSettings.tanggal,
    penanggungJawab,
    historySettings.fetchHistory,
    showAlert,
    showConfirm
  );

  // Cross-Hook Synchronization: Update Submitted UKMs when date or history changes
  useEffect(() => {
    historySettings.updateSubmittedUkms(dateSettings.tanggal);
  }, [dateSettings.tanggal, historySettings.historyData, historySettings.updateSubmittedUkms]);

  const handleLogoutClick = () => {
    if (reportForm.laporans.length > 0) {
      showConfirm(
        "PERINGATAN ANTREAN",
        "Anda masih memiliki data laporan yang belum terkirim di dalam antrean. Jika Anda keluar, data ini akan hilang.",
        () => setShowLogoutPrompt(true)
      );
    } else {
      setShowLogoutPrompt(true);
    }
  };

  // Global Key Events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        reportForm.setPreviewImage(null);
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportForm, closeModal]);

  // View Logic
  if (isAuthLoading) return null;

  if (!user || (user && !userRole)) {
    return (
      <AuthScreen
        user={user}
        logoLmb={logoLmb}
        spinnerLoading={spinnerLoading}
        isGoogleLoading={isGoogleLoading}
        onLogin={handleLogin}
        onLogout={handleLogoutClick}
      />
    );
  }

  return (
    <div className="app-wrapper">
      <div className="form-card">
        <Header publicSpreadsheetUrl={historySettings.publicSpreadsheetUrl} />

        {/* Date Dropdown Overlay */}
        {dateSettings.openDropdown && (
          <div className="custom-select-overlay" onClick={() => dateSettings.setOpenDropdown(null)}></div>
        )}

        <StaffDashboard
          {...dateSettings}
          {...reportForm}
          {...historySettings}
          penanggungJawab={penanggungJawab}
          setPenanggungJawab={handlePenanggungChange}
          addToDraft={() =>
            reportForm.addToDraft(
              dateSettings.selectedBulan,
              dateSettings.availableDates,
              historySettings.submittedUkms
            )
          }
        />
      </div>

      {/* Global Overlays */}
      <Modal modal={modal} />

      <UploadProgressModal
        isLoading={reportForm.isLoading}
        laporans={reportForm.laporans}
        processingId={reportForm.processingId}
        uploadProgress={reportForm.uploadProgress}
        currentUploadIndex={reportForm.processingId ? Math.max(1, reportForm.laporans.findIndex(l => l.id === reportForm.processingId) + 1) : 1}
        totalUploads={reportForm.laporans.length}
      />

      <ImagePreviewOverlay
        previewImage={reportForm.previewImage}
        onClose={() => reportForm.setPreviewImage(null)}
      />
    </div>
  );
}

export default App;
