import React, { useState, useEffect } from 'react';
import './App.css';

// Assets
import logoMedfo from './assets/Medfo.png';
import spinnerLoading from './assets/Spinner Loading.png';

// Components
import AuthScreen from './features/auth/AuthScreen';
import StaffDashboard from './features/report/StaffDashboard';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminPinModal from './features/admin/components/AdminPinModal';
import Modal from './features/ui/Modal';
import ImagePreviewOverlay from './features/ui/ImagePreviewOverlay';
import UploadProgressModal from './features/ui/components/UploadProgressModal';

// Hooks (Business Logic Layer)
import { useAuth } from './features/auth/hooks/useAuth';
import { useDateSettings } from './features/report/hooks/useDateSettings';
import { useReportHistory } from './features/report/hooks/useReportHistory';
import { useReportForm } from './features/report/hooks/useReportForm';
import { useModal } from './features/ui/hooks/useModal';
const DEFAULT_ADMIN_PROFILE = {
  name: 'Gusthi',
  phone: '0823-3401-5531'
};

function App() {
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('ukm_admin_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name && parsed?.phone) return parsed;
      }
    } catch { /* ignore */ }
    return DEFAULT_ADMIN_PROFILE;
  });

  const handleSaveAdminProfile = (nextProfile) => {
    const cleaned = {
      name: (nextProfile?.name || '').trim() || DEFAULT_ADMIN_PROFILE.name,
      phone: (nextProfile?.phone || '').trim() || DEFAULT_ADMIN_PROFILE.phone
    };
    setAdminProfile(cleaned);
    try {
      localStorage.setItem('ukm_admin_profile', JSON.stringify(cleaned));
    } catch { /* ignore */ }
  };

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

  // Sync global admin profile from Google Sheets config when fetched
  useEffect(() => {
    const cfg = historySettings.appConfig;
    if (cfg && (cfg.adminName || cfg.adminPhone)) {
      handleSaveAdminProfile({
        name: cfg.adminName || adminProfile.name,
        phone: cfg.adminPhone || adminProfile.phone
      });
    }
  }, [historySettings.appConfig]);

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
        logoMedfo={logoMedfo}
        spinnerLoading={spinnerLoading}
        isGoogleLoading={isGoogleLoading}
        onLogin={handleLogin}
        onLogout={handleLogoutClick}
      />
    );
  }

  return (
    <div className="app-wrapper">
      {isAdminMode ? (
        <AdminDashboard
          historyData={historySettings.historyData}
          publicSpreadsheetUrl={historySettings.publicSpreadsheetUrl}
          appConfig={historySettings.appConfig}
          adminProfile={adminProfile}
          onSaveAdminProfile={handleSaveAdminProfile}
          onRefreshHistory={() => historySettings.fetchHistory(true)}
          onBackToStaff={() => setIsAdminMode(false)}
          showAlert={showAlert}
        />
      ) : (
        <StaffDashboard
          {...dateSettings}
          {...reportForm}
          {...historySettings}
          publicSpreadsheetUrl={historySettings.publicSpreadsheetUrl}
          adminProfile={adminProfile}
          penanggungJawab={penanggungJawab}
          setPenanggungJawab={handlePenanggungChange}
          onLogout={handleLogoutClick}
          onOpenAdmin={() => setShowAdminPinModal(true)}
          addToDraft={() =>
            reportForm.addToDraft(
              dateSettings.selectedBulan,
              dateSettings.availableDates,
              historySettings.submittedUkms
            )
          }
        />
      )}

      {/* Global Overlays */}
      <AdminPinModal
        isOpen={showAdminPinModal}
        onClose={() => setShowAdminPinModal(false)}
        onSuccess={() => setIsAdminMode(true)}
      />

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
