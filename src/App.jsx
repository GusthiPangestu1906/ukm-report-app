import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';

import logoLmb from './assets/Logo LMB.jpg';
import logoMedfo from './assets/Medfo.png';
import spinnerLoading from './assets/Spinner Loading.png';
import { CACHE_KEYS, cache } from './utils/cache';
import { REGEX } from './utils/regex';
import { HISTORY_CACHE_TTL } from './utils/constants';
import { getMonthOptions } from './utils/helpers';

import AuthScreen from './features/auth/AuthScreen';
import StaffDashboard from './features/report/StaffDashboard';
import Modal from './features/ui/Modal';
import ImagePreviewOverlay from './features/ui/ImagePreviewOverlay';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app, auth, provider;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
} catch (e) {
  console.warn("Firebase error:", e);
}

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); 
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [penanggungJawab, setPenanggungJawab] = useState('');

  const handlePenanggungChange = (value) => {
    setPenanggungJawab(value);
    try { cache.set(CACHE_KEYS.staffName, value); } catch (e) { /* ignore */ }
  };

  const [openDropdown, setOpenDropdown] = useState(null);
  const [bulanOptions, setBulanOptions] = useState([]);
  const [selectedBulan, setSelectedBulan] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [tanggal, setTanggal] = useState('');

  const [currentUkm, setCurrentUkm] = useState('');
  const [ukmError, setUkmError] = useState('');
  const [laporans, setLaporans] = useState([]);
  const [currentFotos, setCurrentFotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const [previewImage, setPreviewImage] = useState(null);

  const [historyData, setHistoryData] = useState([]);
  const [submittedUkms, setSubmittedUkms] = useState([]); 
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null, onCancel: null });

  const [completedSteps, setCompletedSteps] = useState({ bulan: false, tanggal: false });

  // URL Backend Apps Script
  const scriptURL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbx5YBwntBuQQ0SFy5Zv2-3Mt4-K46HAx45z9kWWTiYy5Bjz5TlAhzOESh2QUv7pTDWiDQ/exec';

  const showAlert  = (title, message, type = 'warning') => setModal({ isOpen: true, title, message, type, onConfirm: closeModal });
  const showConfirm = (title, message, onConfirmCallback) => setModal({ isOpen: true, title, message, type: 'confirm', onConfirm: () => { onConfirmCallback(); closeModal(); }, onCancel: closeModal });
  const closeModal  = () => setModal(prev => ({ ...prev, isOpen: false }));

  // =========================================
  // AUTH FIREBASE
  // =========================================
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
        if (currentUser) {
          setUserRole('staff');
          const defaultName = currentUser.displayName || currentUser.email.split('@')[0];
          const capitalized = defaultName.replace(/\b\w/g, l => l.toUpperCase());
          setPenanggungJawab(cache.get(CACHE_KEYS.staffName) || capitalized);
        }
      });
      return () => unsubscribe();
    } else { setIsAuthLoading(false); }
  }, []);

  useEffect(() => {
    const savedName = cache.get(CACHE_KEYS.staffName);
    if (savedName) setPenanggungJawab(savedName);

    const savedDrafts = cache.get(CACHE_KEYS.draftQueue);
    if (savedDrafts && Array.isArray(savedDrafts) && savedDrafts.length > 0) setLaporans(savedDrafts);

    const savedFormState = cache.get(CACHE_KEYS.formState);
    if (savedFormState) {
      if (savedFormState.selectedBulan) { setSelectedBulan(savedFormState.selectedBulan); setCompletedSteps(prev => ({ ...prev, bulan: true })); }
      if (savedFormState.tanggal) { setTanggal(savedFormState.tanggal); setCompletedSteps(prev => ({ ...prev, bulan: true, tanggal: true })); }
    }
    setIsAppInitialized(true);
  }, []);

  useEffect(() => {
    if (!isAppInitialized) return;
    if (laporans.length > 0) cache.set(CACHE_KEYS.draftQueue, laporans);
    else cache.remove(CACHE_KEYS.draftQueue);
  }, [laporans, isAppInitialized]);

  useEffect(() => {
    if (!isAppInitialized) return;
    cache.set(CACHE_KEYS.formState, { selectedBulan, tanggal });
  }, [selectedBulan, tanggal, isAppInitialized]);

  useEffect(() => {
    const options = getMonthOptions();
    setBulanOptions(options);
    if (!cache.get(CACHE_KEYS.formState)?.selectedBulan) {
      setSelectedBulan(options[0].value);
      setCompletedSteps(prev => ({ ...prev, bulan: true }));
    }
  }, []);

  useEffect(() => {
    if (!selectedBulan) return;
    const mondays = [];
    const [year, month] = selectedBulan.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      if (date.getDay() === 1) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        mondays.push({ value: `${date.getFullYear()}-${m}-${d}`, label: `Senin, ${d}/${m}/${date.getFullYear()}` });
      }
      date.setDate(date.getDate() + 1);
    }
    setAvailableDates(mondays);
    const savedFormState = cache.get(CACHE_KEYS.formState);
    if (!savedFormState?.tanggal) setTanggal('');
  }, [selectedBulan]);

  const handleLogin = async () => {
    setIsGoogleLoading(true);
    try { 
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setUserRole('staff');
      const defaultName = result.user.displayName || result.user.email.split('@')[0];
      const capitalized = defaultName.replace(/\b\w/g, l => l.toUpperCase());
      cache.set(CACHE_KEYS.staffName, capitalized);
      setPenanggungJawab(capitalized);
    }
    catch (error) { if (error.code !== 'auth/popup-closed-by-user') alert("Gagal Login: " + error.message); }
    finally { setIsGoogleLoading(false); }
  };

  const handleLogoutClick = () => {
    if (laporans.length > 0) {
      showConfirm(
        "PERINGATAN ANTREAN",
        "Anda masih memiliki data laporan yang belum terkirim di dalam antrean. Jika Anda keluar, data ini akan hilang.\n\nYakin ingin melanjutkan keluar?",
        () => setShowLogoutPrompt(true)
      );
    } else {
      setShowLogoutPrompt(true);
    }
  };

  const executeLogout = async () => {
    if (auth) {
      await signOut(auth);
      setUser(null);
    }
    cache.remove(CACHE_KEYS.userRole);
    cache.remove(CACHE_KEYS.staffName);
    cache.remove(CACHE_KEYS.formState);
    setUserRole(null);
    setPenanggungJawab('');
    setShowLogoutPrompt(false);
  };

  const [publicSpreadsheetUrl, setPublicSpreadsheetUrl] = useState('');

  const fetchHistory = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedHistory = cache.get(CACHE_KEYS.historyData);
      const cachedTs = cache.get(CACHE_KEYS.historyTimestamp);
      if (cachedHistory && cachedTs && (Date.now() - cachedTs) < HISTORY_CACHE_TTL) {
        setHistoryData(cachedHistory);
        return;
      }
    }
    setIsLoadingHistory(true);
    try {
      const response = await fetch(scriptURL);
      const result = await response.json();
      if (result.status === "success") {
        setHistoryData(result.data);
        if (result.publicSpreadsheetUrl) setPublicSpreadsheetUrl(result.publicSpreadsheetUrl);
        cache.set(CACHE_KEYS.historyData, result.data);
        cache.set(CACHE_KEYS.historyTimestamp, Date.now());
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
      const cachedHistory = cache.get(CACHE_KEYS.historyData);
      if (cachedHistory) setHistoryData(cachedHistory);
    } finally { setIsLoadingHistory(false); }
  }, [scriptURL]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  useEffect(() => {
    if (tanggal && historyData.length > 0) {
      setSubmittedUkms(historyData.filter(item => item.tanggal === tanggal).map(item => item.ukm));
    } else { setSubmittedUkms([]); }
  }, [tanggal, historyData]);

  const handleBulanSelect = (val) => {
    setSelectedBulan(val);
    setOpenDropdown(null);
    setCompletedSteps(prev => ({ ...prev, bulan: true }));
    setTanggal('');
    setCompletedSteps(prev => ({ ...prev, tanggal: false }));
  };

  const handleTanggalSelect = (val) => {
    setTanggal(val);
    setOpenDropdown(null);
    setCompletedSteps(prev => ({ ...prev, tanggal: true }));
  };

  const isTanggalLocked = !completedSteps.bulan;
  const isEntriLocked   = !completedSteps.tanggal;
  const isAntreanLocked = !completedSteps.tanggal && laporans.length === 0;

  const handleUkmChange = (e) => {
    let value = e.target.value;
    if (REGEX.ukmComma.test(value)) {
      value = value.replace(/,/g, '');
      setUkmError('Karakter Koma ( , ) tidak diperbolehkan!');
    } else {
      setUkmError('');
    }
    setCurrentUkm(value);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remainingQuota = 3 - currentFotos.length;
    if (remainingQuota <= 0) {
      showAlert("KUOTA PENUH", "Maksimal lampiran adalah 3 file per UKM.", "warning");
      return;
    }

    const newFiles = files.slice(0, remainingQuota);

    const validFiles = newFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        showAlert("UKURAN FILE BESAR", `File "${file.name}" melebihi 10MB. Harap gunakan file lebih kecil.`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setCurrentFotos(prev => [...prev, ...validFiles]);
    }
    e.target.value = null;
  };

  const removeCurrentFoto = (indexToRemove) => {
    setCurrentFotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const addToDraft = async () => {
    if (!selectedBulan) return showAlert("LENGKAPI FORMULIR", "Silakan pilih bulan laporan terlebih dahulu.", "warning");
    if (!tanggal) return showAlert("LENGKAPI FORMULIR", "Silakan pilih tanggal Senin terlebih dahulu.", "warning");
    if (!currentUkm.trim()) return showAlert("LENGKAPI FORMULIR", "Silakan isi nama UKM terlebih dahulu.", "warning");
    if (ukmError) return showAlert("INPUT TIDAK VALID", "Perbaiki input Nama UKM (tidak boleh mengandung koma).", "error");

    const ukmCleaned = currentUkm.trim();

    if (submittedUkms.some(u => u.toLowerCase() === ukmCleaned.toLowerCase())) {
      return showAlert("DUPLIKASI DATA", `UKM "${ukmCleaned}" sudah pernah dilaporkan pada tanggal ${availableDates.find(d => d.value === tanggal)?.label || tanggal}.`, "error");
    }

    if (laporans.some(item => item.namaUkm.toLowerCase() === ukmCleaned.toLowerCase())) {
      return showAlert("ANTREAN SAMA", `UKM "${ukmCleaned}" sudah ada di dalam antrean pengiriman saat ini.`, "warning");
    }

    if (currentFotos.length === 0) return showAlert("FOTO DIBUTUHKAN", "Wajib melampirkan minimal 1 foto kegiatan untuk UKM ini.", "warning");

    setIsLoading(true);

    try {
      const convertedFotos = await Promise.all(
        currentFotos.map(async (file) => ({
          name: file.name,
          data: await fileToBase64(file)
        }))
      );

      const newEntry = {
        id: Date.now() + Math.random().toString(36).substr(2, 4),
        namaUkm: ukmCleaned,
        fotos: convertedFotos
      };

      setLaporans(prev => [...prev, newEntry]);
      setCurrentUkm('');
      setCurrentFotos([]);
    } catch (err) {
      showAlert("GAGAL MEMBACA FOTO", "Terjadi kesalahan saat memproses gambar. Coba lagi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDraft = (idToEdit, onSuccessCallback) => {
    const draft = laporans.find(l => l.id === idToEdit);
    if (!draft) return;

    showConfirm("EDIT LAPORAN", `Edit laporan "${draft.namaUkm}"? Data di formulir saat ini akan digantikan oleh draft ini.`, () => {
      setCurrentUkm(draft.namaUkm);
      
      const recreatedFiles = draft.fotos.map((foto, idx) => {
        const arr = foto.data.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new File([u8arr], foto.name || `FOTO_${idx + 1}.jpg`, { type: mime });
      });

      setCurrentFotos(recreatedFiles);
      setLaporans(prev => prev.filter(l => l.id !== idToEdit));
      if (onSuccessCallback) onSuccessCallback();
    });
  };

  const handleSubmit = async () => {
    if (laporans.length === 0) return showAlert("ANTREAN KOSONG", "Tidak ada data laporan di dalam antrean untuk dikirim.", "warning");
    if (!penanggungJawab.trim()) return showAlert("LENGKAPI DATA", "Nama pengirim (penanggung jawab) wajib diisi.", "warning");

    showConfirm("KONFIRMASI PENGIRIMAN", `Yakin ingin mengirimkan total ${laporans.length} laporan UKM ke database server?`, async () => {
      setIsLoading(true);
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < laporans.length; i++) {
        const laporan = laporans[i];
        setProcessingId(laporan.id);
        setUploadProgress(prev => ({ ...prev, [laporan.id]: 10 }));

        try {
          const payload = {
            tanggal: tanggal,
            ukm: laporan.namaUkm,
            penanggungJawab: penanggungJawab.trim(),
            fotos: laporan.fotos.map(f => ({ name: f.name, data: f.data }))
          };

          setUploadProgress(prev => ({ ...prev, [laporan.id]: 40 }));

          const response = await fetch(scriptURL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            redirect: 'follow'
          });

          setUploadProgress(prev => ({ ...prev, [laporan.id]: 80 }));
          const result = await response.json();

          if (result.status === 'success') {
            setUploadProgress(prev => ({ ...prev, [laporan.id]: 100 }));
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Gagal upload ${laporan.namaUkm}:`, err);
          failCount++;
        }
      }

      setProcessingId(null);
      setIsLoading(false);

      if (successCount > 0) {
        fetchHistory(true);
      }

      if (failCount === 0) {
        showAlert("PENGIRIMAN BERHASIL", `Seluruh ${successCount} laporan UKM berhasil terkirim ke server!`, "success");
        setLaporans([]);
        setUploadProgress({});
      } else {
        showAlert("SEBAGIAN GAGAL", `${successCount} berhasil terkirim, ${failCount} gagal. Silakan coba lagi untuk data yang tersisa.`, "warning");
        setLaporans(prev => prev.filter(l => (uploadProgress[l.id] || 0) !== 100));
      }
    });
  };

  // Esc Key Event listener untuk Modal/Overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPreviewImage(null);
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // RENDER: LAYAR LOADING
  if (isAuthLoading) {
    return (
      <div className="tech-auth-container tech-bg" style={{ backgroundColor: '#fff', backgroundImage: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <img
            src={spinnerLoading}
            alt="Loading spinner"
            className="loading-spinner"
            style={{ width: '120px', maxWidth: '80%', objectFit: 'contain' }}
          />
        </div>
      </div>
    );
  }

  // RENDER: LAYAR AUTHENTICATION
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

  // RENDER: DASHBOARD STAF
  return (
    <div className="app-wrapper">
      <div className="form-card">
        {/* FRESH MEDFO BRANDED TOP HEADER */}
        <div className="card-top-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(217, 70, 239, 0.12)',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={logoMedfo} 
              alt="Medfo Logo" 
              style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '10px', filter: 'drop-shadow(0 4px 10px rgba(217, 70, 239, 0.25))' }}
            />
            <div>
              <h2 className="form-title" style={{ margin: 0, textAlign: 'left', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#1e1b4b' }}>
                Formulir Pelaporan
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Sistem Laporan Kegiatan UKM</span>
            </div>
          </div>

          {publicSpreadsheetUrl && (
            <a
              href={publicSpreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sheets-header-btn"
              title="Buka Data Spreadsheet Laporan (Google Sheets)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#059669',
                fontWeight: '700',
                fontSize: '12px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Spreadsheet</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          )}
        </div>
        {openDropdown && <div className="custom-select-overlay" onClick={() => setOpenDropdown(null)}></div>}

        <StaffDashboard
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          bulanOptions={bulanOptions}
          selectedBulan={selectedBulan}
          availableDates={availableDates}
          tanggal={tanggal}
          submittedUkms={submittedUkms}
          isTanggalLocked={isTanggalLocked}
          isEntriLocked={isEntriLocked}
          isAntreanLocked={isAntreanLocked}
          completedSteps={completedSteps}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          currentUkm={currentUkm}
          currentFotos={currentFotos}
          ukmError={ukmError}
          laporans={laporans}
          uploadProgress={uploadProgress}
          processingId={processingId}
          historyData={historyData}
          setPreviewImage={setPreviewImage}
          handleBulanSelect={handleBulanSelect}
          handleTanggalSelect={handleTanggalSelect}
          handleUkmChange={handleUkmChange}
          handleFileChange={handleFileChange}
          removeCurrentFoto={removeCurrentFoto}
          addToDraft={addToDraft}
          handleSubmit={handleSubmit}
          handleEditDraft={handleEditDraft}
          removeDraft={(idToRemove) => {
            setLaporans((prev) => prev.filter(laporan => laporan.id !== idToRemove));
          }}
          penanggungJawab={penanggungJawab}
          setPenanggungJawab={handlePenanggungChange}
          publicSpreadsheetUrl={publicSpreadsheetUrl}
        />
      </div>

      <Modal modal={modal} />
      {showLogoutPrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setShowLogoutPrompt(false)} className="modal-close-btn" style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="modal-icon confirm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <h3 className="modal-title">KONFIRMASI KELUAR</h3>
            <p className="modal-message">Apakah Anda yakin ingin keluar dari akun Google saat ini?</p>
            <div className="modal-actions" style={{ gap: '10px' }}>
              <button onClick={executeLogout} className="modal-btn primary" style={{ width: '100%', padding: '12px' }}>
                YA, KELUAR
              </button>
              <button onClick={() => setShowLogoutPrompt(false)} className="modal-btn secondary" style={{ width: '100%', padding: '12px' }}>
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}
      <ImagePreviewOverlay previewImage={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

export default App;