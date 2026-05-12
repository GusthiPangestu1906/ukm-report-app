import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';
import logoLmb from './assets/Logo LMB.jpg';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "medfo-auth-85df1.firebaseapp.com",
  projectId: "medfo-auth-85df1",
  storageBucket: "medfo-auth-85df1.firebasestorage.app",
  messagingSenderId: "724707856698",
  appId: "1:724707856698:web:a5ca85e03aafe6e3bcc003",
  measurementId: "G-2PB43Y8XXG"
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

// =========================================
// REGEX & CONSTANTS
// =========================================
const REGEX = {
  staffName: /^[a-zA-Z\s'-]+$/,
  ukmPrefix: /^UKM(\s|$)/,
  ukmLowerCase: /(?:^|\s)[a-z]/,
  ukmComma: /,/,
};

const CACHE_KEYS = {
  draftQueue: 'medfo_draft_queue',
  staffName:  'medfo_staff_name',
  historyData: 'medfo_history_cache',
  historyTimestamp: 'medfo_history_ts',
  formState: 'medfo_form_state',
  userRole: 'medfo_user_role' 
};

const HISTORY_CACHE_TTL = 5 * 60 * 1000;
const ADMIN_SECRET = "MDF-1906"; // Passcode Rahasia Khusus Admin

const cache = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } },
  remove: (key) => { try { localStorage.removeItem(key); } catch {} },
};

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); 
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  // State Keamanan Admin
  const [showAdminChallenge, setShowAdminChallenge] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [tempName, setTempName] = useState('');
  const [nameError, setNameError] = useState('');

  const [openDropdown, setOpenDropdown] = useState(null);
  const [bulanOptions, setBulanOptions] = useState([]);
  const [selectedBulan, setSelectedBulan] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [tanggal, setTanggal] = useState('');

  const [currentUkm, setCurrentUkm] = useState('');
  const [ukmError, setUkmError] = useState('');
  const [laporans, setLaporans] = useState([]);
  const [currentFotos, setCurrentFotos] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const [previewImage, setPreviewImage] = useState(null);

  const [historyData, setHistoryData] = useState([]);
  const [submittedUkms, setSubmittedUkms] = useState([]); 
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null, onCancel: null });

  const [completedSteps, setCompletedSteps] = useState({ bulan: false, tanggal: false });

  const scriptURL = 'https://script.google.com/macros/s/AKfycbz1QI1qt1EU_KDwFbhOL9KiDjNLIKAifA3bKSFJwQKuPEhz0W5kX_bDepq-QlT7e2VZ/exec';

  const showAlert  = (title, message, type = 'warning') => setModal({ isOpen: true, title, message, type, onConfirm: closeModal });
  const showConfirm = (title, message, onConfirmCallback) => setModal({ isOpen: true, title, message, type: 'confirm', onConfirm: () => { onConfirmCallback(); closeModal(); }, onCancel: closeModal });
  const closeModal  = () => setModal(prev => ({ ...prev, isOpen: false }));

  // =========================================
  // AUTH FIREBASE & RECOVERY
  // =========================================
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
      });
      return () => unsubscribe();
    } else { setIsAuthLoading(false); }
  }, []);

  useEffect(() => {
    const savedRole = cache.get(CACHE_KEYS.userRole);
    if (savedRole) {
      setUserRole(savedRole);
      if (savedRole === 'admin') {
        setPenanggungJawab('ADMIN MEDFO');
        setIsNameSet(true);
      } else {
        const savedName = cache.get(CACHE_KEYS.staffName);
        if (savedName) {
          setPenanggungJawab(savedName);
          setIsNameSet(true);
        }
      }
    }

    const savedDrafts = cache.get(CACHE_KEYS.draftQueue);
    if (savedDrafts && Array.isArray(savedDrafts) && savedDrafts.length > 0) setLaporans(savedDrafts);

    const savedFormState = cache.get(CACHE_KEYS.formState);
    if (savedFormState) {
      if (savedFormState.selectedBulan) {
        setSelectedBulan(savedFormState.selectedBulan);
        setCompletedSteps(prev => ({ ...prev, bulan: true }));
      }
      if (savedFormState.tanggal) {
        setTanggal(savedFormState.tanggal);
        setCompletedSteps(prev => ({ ...prev, bulan: true, tanggal: true }));
      }
    }
    setIsAppInitialized(true);
  }, []);

  useEffect(() => {
    if (!isAppInitialized || userRole === 'admin') return;
    if (laporans.length > 0) cache.set(CACHE_KEYS.draftQueue, laporans);
    else cache.remove(CACHE_KEYS.draftQueue);
  }, [laporans, isAppInitialized, userRole]);

  useEffect(() => {
    if (!isAppInitialized) return;
    cache.set(CACHE_KEYS.formState, { selectedBulan, tanggal });
  }, [selectedBulan, tanggal, isAppInitialized]);

  useEffect(() => {
    const options = [];
    const namaBulanIndo = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const m = d.getMonth(); const y = d.getFullYear();
      options.push({ value: `${y}-${String(m + 1).padStart(2, '0')}`, label: `${namaBulanIndo[m]} ${y}` });
      d.setMonth(m - 1);
    }
    setBulanOptions(options);
    if (!cache.get(CACHE_KEYS.formState)?.selectedBulan) {
      setSelectedBulan(options[0].value);
      setCompletedSteps(prev => ({ ...prev, bulan: true }));
    }
  }, []);

  useEffect(() => {
    if (!selectedBulan || userRole === 'admin') return;
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
  }, [selectedBulan, userRole]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, provider); }
    catch (error) { if (error.code !== 'auth/popup-closed-by-user') alert("Gagal Login: " + error.message); }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    cache.remove(CACHE_KEYS.userRole);
    cache.remove(CACHE_KEYS.staffName);
    cache.remove(CACHE_KEYS.formState);
    setUserRole(null);
    setIsNameSet(false);
    setPenanggungJawab('');
    setShowAdminChallenge(false);
    setAdminPin('');
  };

  // =========================================
  // SISTEM ROLE & TANTANGAN ADMIN
  // =========================================
  const handleRoleSelect = (role) => {
    setUserRole(role);
    cache.set(CACHE_KEYS.userRole, role);
  };

  const handleAdminVerify = async (e) => {
    e.preventDefault();
    if (!adminPin.trim()) return;

    setIsAdminVerifying(true);
    setAdminError('');

    try {
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'verifyAdmin', 
          passcode: adminPin.trim().toUpperCase() 
        })
      });
      const result = await response.json();

      if (result.status === 'success') {
        setAdminError('');
        handleRoleSelect('admin');
        setPenanggungJawab('ADMIN MEDFO');
        setIsNameSet(true);
      } else {
        setAdminError(result.message || 'Passcode Tidak Valid!');
        setAdminPin('');
      }
    } catch (error) {
      setAdminError('Koneksi terputus. Gagal memverifikasi ke server.');
    } finally {
      setIsAdminVerifying(false);
    }
  };

  const handleSaveName = () => {
    const finalName = tempName.trim();
    if (!finalName) return showAlert("AKSES DITOLAK", "Parameter Nama tidak boleh kosong!", "error");
    if (!REGEX.staffName.test(finalName)) {
      return showAlert("ANOMALI TERDETEKSI", "Parameter Nama mengandung karakter ilegal.\nGunakan abjad standar untuk identitas operasional!", "error");
    }
    const capitalized = finalName.replace(/\b\w/g, l => l.toUpperCase());
    cache.set(CACHE_KEYS.staffName, capitalized);
    setPenanggungJawab(capitalized); 
    setIsNameSet(true);
  };

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
        cache.set(CACHE_KEYS.historyData, result.data);
        cache.set(CACHE_KEYS.historyTimestamp, Date.now());
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
      const cachedHistory = cache.get(CACHE_KEYS.historyData);
      if (cachedHistory) setHistoryData(cachedHistory);
    } finally { setIsLoadingHistory(false); }
  }, []);

  useEffect(() => {
    if (user && userRole && isNameSet) fetchHistory();
  }, [user, userRole, isNameSet, fetchHistory]);

  useEffect(() => {
    if (userRole === 'staff' && tanggal && historyData.length > 0) {
      setSubmittedUkms(historyData.filter(item => item.tanggal === tanggal).map(item => item.ukm));
    } else { setSubmittedUkms([]); }
  }, [tanggal, historyData, userRole]);


  const handleBulanSelect = (val) => {
    setSelectedBulan(val);
    setOpenDropdown(null);
    setCompletedSteps(prev => ({ ...prev, bulan: true }));
    if (userRole === 'staff') {
      setTanggal('');
      setCompletedSteps(prev => ({ ...prev, tanggal: false }));
    }
  };

  const handleTanggalSelect = (val) => {
    setTanggal(val);
    setOpenDropdown(null);
    setCompletedSteps(prev => ({ ...prev, tanggal: true }));
  };

  const isTanggalLocked = !completedSteps.bulan;
  const isEntriLocked   = !completedSteps.tanggal;
  const isAntreanLocked = !completedSteps.tanggal;

  const handleUkmChange = (e) => {
    let value = e.target.value;
    if (REGEX.ukmComma.test(value)) {
      showAlert("INPUT TIDAK VALID", "Sistem mendeteksi tanda koma (,). Masukkan 1 nama UKM per entri.", "error");
      value = value.replace(/,/g, '');
    }
    setCurrentUkm(value);
    if (value.trim() !== '') {
      if (!REGEX.ukmPrefix.test(value.trim())) setUkmError('Format salah: Wajib diawali kata "UKM" (Cth: UKM Tari)');
      else if (REGEX.ukmLowerCase.test(value)) setUkmError('Format salah: Gunakan Huruf Kapital di setiap awal kata');
      else setUkmError('');
    } else { setUkmError(''); }
  };

  const handleTempNameChange = (e) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
    setTempName(sanitized);
    if (sanitized && !REGEX.staffName.test(sanitized)) setNameError('Hanya huruf, spasi, apostrof (\'), dan tanda hubung (-)');
    else setNameError('');
  };

  const handleFileChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const newFiles = Array.from(event.target.files);
    if (currentFotos.length + newFiles.length > 3) {
      showAlert("KUOTA TERLAMPAUI", "Maksimal melampirkan 3 file dokumentasi per entri!", "error");
      event.target.value = ''; return;
    }
    setCurrentFotos([...currentFotos, ...newFiles]);
    event.target.value = '';
  };

  const removeCurrentFoto = (fotoIndex) => setCurrentFotos(currentFotos.filter((_, i) => i !== fotoIndex));

  const compressImage = (file, maxWidth = 1280, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          if (width > height) { if (width > maxWidth) { height = Math.round((height *= maxWidth / width)); width = maxWidth; } }
          else { if (height > maxWidth) { width = Math.round((width *= maxWidth / height)); height = maxWidth; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  };

  const addToDraft = async () => {
    if (ukmError) return showAlert("KESALAHAN FORMAT", "Selesaikan peringatan format Nama UKM sebelum melanjutkan.\n" + ukmError, "error");
    if (!currentUkm.trim()) return showAlert("DATA TIDAK LENGKAP", "Parameter [Nama UKM] berstatus kosong!", "error");
    if (currentFotos.length === 0) return showAlert("DATA TIDAK LENGKAP", "Sistem membutuhkan minimal 1 file gambar bukti dokumentasi!", "error");

    const isDuplicate = laporans.some(l => l.namaUkm.toLowerCase() === currentUkm.trim().toLowerCase());
    if (isDuplicate) return showAlert("DUPLIKAT TERDETEKSI", `Entri "${currentUkm.trim()}" telah ada dalam memori antrean lokal.`, "error");

    setIsLoading(true);
    try {
      const processedFotos = await Promise.all(currentFotos.map(async (f) => {
        const fullBase64Data = await compressImage(f);
        return { name: f.name, data: fullBase64Data };
      }));
      setLaporans(prev => [...prev, { id: Date.now(), namaUkm: currentUkm, fotos: processedFotos }]);
      setCurrentUkm(''); setCurrentFotos([]); setUkmError('');
    } catch (e) {
      showAlert("GAGAL MEMPROSES", "Sistem gagal memproses data gambar.", "error");
    } finally { setIsLoading(false); }
  };

  const removeDraft = (id) => setLaporans(laporans.filter(l => l.id !== id));
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

  const executeSubmission = async (finalLaporanList) => {
    setIsLoading(true);
    setStatus(`MENGUNGGAH PAKET DATA...`);
    let hasError = false;
    const successfulIds = [];
    try {
      for (let i = 0; i < finalLaporanList.length; i++) {
        const item = finalLaporanList[i];
        setProcessingId(item.id);
        setUploadProgress(prev => ({ ...prev, [item.id]: 30 }));
        const amanUkmName = item.namaUkm.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const processedFotos = item.fotos.map((f, index) => ({
          fileName: item.fotos.length > 1 ? `${amanUkmName} (${index + 1}).jpg` : `${amanUkmName}.jpg`,
          mimeType: 'image/jpeg',
          fileBase64: f.data.split(',')[1]
        }));
        setUploadProgress(prev => ({ ...prev, [item.id]: 60 }));
        const payload = {action: 'submitReport', penanggungJawab, tanggal, laporanList: [{ namaUkm: item.namaUkm, files: processedFotos }], userEmail: user?.email || "Unknown" };
        const response = await fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await response.json();
        if (result.status === "success") {
          setUploadProgress(prev => ({ ...prev, [item.id]: 100 }));
          successfulIds.push(item.id);
          await fetchHistory(true);
          await new Promise(res => setTimeout(res, 500));
        } else {
          showAlert("PENGIRIMAN GAGAL", `Gagal mengirim paket: ${item.namaUkm}.\nLog: ${result.message}`, "error");
          setUploadProgress(prev => ({ ...prev, [item.id]: 0 }));
          hasError = true; break;
        }
      }
      if (!hasError) {
        showAlert("PENGIRIMAN BERHASIL", `${finalLaporanList.length} File dokumentasi telah terkirim ke Server Utama.`, "success");
        setLaporans([]);
        setCurrentUkm(''); setCurrentFotos([]); setUkmError('');
        cache.remove(CACHE_KEYS.draftQueue);
      } else {
        setLaporans(prev => prev.filter(draft => !successfulIds.includes(draft.id)));
      }
    } catch (error) {
      showAlert("KONEKSI TERPUTUS", "Koneksi ke Server Utama terputus. Data di memori lokal masih aman.", "error");
      setLaporans(prev => prev.filter(draft => !successfulIds.includes(draft.id)));
    } finally {
      setIsLoading(false); setProcessingId(null); setTimeout(() => setStatus(''), 5000);
    }
  };

  const processSubmission = (finalLaporans) => {
    const deadline = new Date(tanggal);
    deadline.setDate(deadline.getDate() + 2);
    deadline.setHours(0, 0, 0, 0);
    const isLate = new Date().getTime() > deadline.getTime();
    
    if (isLate) {
      showConfirm(
        "KETERLAMBATAN TERDETEKSI 🔴",
        "Laporan ini telah melewati Batas Waktu (Selasa 23:59).\nData akan ditandai 'Terlambat' di Server Utama.\n\nTetap lanjutkan pengiriman?",
        () => executeSubmission(finalLaporans)
      );
    } else executeSubmission(finalLaporans);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tanggal) return showAlert("DATA TIDAK LENGKAP", "Parameter [Tanggal Laporan] wajib didefinisikan!", "error");
    if (currentUkm || currentFotos.length > 0) {
      if (ukmError) return showAlert("KESALAHAN FORMAT", "Mohon perbaiki format Nama UKM.", "error");
      showConfirm("PAKET BELUM DISIMPAN", "Ada data di memori sementara yang belum masuk antrean.\nLakukan Simpan & Kirim Semua?", () => {
        setIsLoading(true);
        Promise.all(currentFotos.map(async (f) => {
          const fullBase64Data = await compressImage(f);
          return { name: f.name, data: fullBase64Data };
        })).then((processedFotos) => {
          const finalLaporans = [...laporans, { id: Date.now(), namaUkm: currentUkm || "Data Tanpa Nama", fotos: processedFotos }];
          setCurrentUkm(''); setCurrentFotos([]); setLaporans(finalLaporans);
          setTimeout(() => { processSubmission(finalLaporans); }, 400);
        });
      }); return;
    }
    if (laporans.length === 0) return showAlert("ANTREAN KOSONG", "Tidak ada data di dalam antrean pengiriman.", "error");
    processSubmission(laporans);
  };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setPreviewImage(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // =========================================
  // RENDER: LAYAR LOADING
  // =========================================
  if (isAuthLoading) {
    return (
      <div className="tech-auth-container tech-bg" style={{ color: '#00f0ff', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '1px' }}>
        MEMUAT KONEKSI AMAN...
      </div>
    );
  }

  // =========================================
  // RENDER: LAYAR 1 - LOGIN GOOGLE
  // =========================================
  if (!user && auth) {
    return (
      <div className="tech-auth-container tech-bg">
        <div className="tech-auth-wrapper">
          <div className="tech-header">
            <img src={logoLmb} alt="LMB PENS Logo" className="tech-logo-img" />
            <h1 className="tech-title">UKM REPORT</h1>
            <p className="tech-subtitle">[ SISTEM PELAPORAN INTERNAL ]</p>
          </div>
          <div className="tech-panel">
            <h2 className="tech-panel-title">OTENTIKASI SERVER</h2>
            <div className="tech-panel-desc" style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px 15px', borderLeft: '3px solid var(--neon-cyan)', borderRadius: '6px', marginBottom: '24px', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
              <div style={{ color: 'var(--neon-green)', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>[ KONEKSI TERENKRIPSI ]</div>
              <div style={{ color: 'var(--text-dim)' }}>&gt; Wajib menggunakan otentikasi identitas untuk masuk ke dalam terminal data.</div>
            </div>
            <button onClick={handleLogin} className="tech-btn-google">
              <div className="tech-google-icon-wrapper">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="tech-google-icon" />
              </div>
              <div className="tech-btn-text-wrapper">
                <span className="tech-btn-main-text">OTENTIKASI DENGAN GOOGLE</span>
                <span className="tech-btn-sub-text">[ INISIASI KONEKSI ]</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // RENDER: LAYAR 2 - PILIH ROLE & PASSCODE ADMIN
  // =========================================
  if (user && !userRole) {
    return (
      <div className="tech-auth-container tech-bg">
        <div className="tech-auth-wrapper">
          <div className="tech-header">
            <img src={logoLmb} alt="LMB PENS Logo" className="tech-logo-img" />
            <h1 className="tech-title">TETAPKAN PERAN</h1>
            <p className="tech-subtitle">[ {user.email} ]</p>
          </div>
          <div className="tech-panel">
            
            {!showAdminChallenge ? (
              <>
                <h2 className="tech-panel-title">PILIH HAK AKSES</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                  <button onClick={() => setShowAdminChallenge(true)} className="tech-btn-action tech-btn-admin">
                    [ 👑 MASUK SEBAGAI ADMIN ]
                  </button>
                  <button onClick={() => handleRoleSelect('staff')} className="tech-btn-action">
                    [ 👤 MASUK SEBAGAI STAF ]
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="tech-panel-title" style={{ color: 'var(--neon-yellow)' }}>TANTANGAN KEAMANAN</h2>
                <p className="tech-panel-desc">Masukkan Passcode Otorisasi Admin.</p>
                <form onSubmit={handleAdminVerify} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value.toUpperCase())}
                    placeholder="PASSCODE..."
                    className="form-input admin-passcode-input"
                    style={{ borderColor: adminError ? 'var(--neon-red)' : 'var(--neon-yellow)', color: 'var(--neon-yellow)' }}
                    autoFocus
                  />
                  {adminError && <div style={{ color: 'var(--neon-red)', fontSize: '11px', fontWeight: 'bold' }}>{adminError}</div>}
                  <button type="submit" disabled={isAdminVerifying} className="tech-btn-action tech-btn-admin">
                    {isAdminVerifying ? 'MEMERIKSA SANDI...' : 'VERIFIKASI'}
                  </button>
                  <button type="button" onClick={() => { setShowAdminChallenge(false); setAdminError(''); }} className="tech-btn-action tech-btn-cancel">BATAL</button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // RENDER: LAYAR 3 - PROFIL (HANYA STAF)
  // =========================================
  if (user && userRole === 'staff' && !isNameSet) {
    return (
      <div className="tech-auth-container tech-bg">
        <div className="tech-auth-wrapper">
          <div className="tech-header">
            <img src={logoLmb} alt="LMB PENS Logo" className="tech-logo-img" />
            <h1 className="tech-title">PROFIL STAF</h1>
            <p className="tech-subtitle">[ STAF TERVERIFIKASI ]</p>
          </div>
          <div className="tech-panel">
            <h2 className="tech-panel-title">HALO, {user.displayName?.split(' ')[0] || 'STAF'}!</h2>
            <div className="tech-panel-desc" style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px 15px', borderLeft: '3px solid var(--neon-cyan)', borderRadius: '6px', marginBottom: '24px', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
              <div style={{ color: 'var(--neon-cyan)', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>[ OTORISASI: LEVEL STAF ]</div>
              <div style={{ color: 'var(--text-dim)' }}>&gt; Tetapkan identitas operasional untuk label penanggung jawab data.</div>
            </div>
            <div className="tech-input-container">
              <span className="tech-input-icon">👤</span>
              <input
                type="text"
                placeholder="PANGGILAN / RESMI (Wajib)"
                className={`tech-input ${nameError ? 'input-error' : ''}`}
                value={tempName}
                onChange={handleTempNameChange}
              />
            </div>
            {nameError && (
              <div className="warning-card warning-card--error" style={{ marginBottom: '16px' }}>
                <span className="warning-card__icon">⚠</span>
                <span className="warning-card__text">{nameError}</span>
              </div>
            )}
            <button onClick={handleSaveName} className="tech-btn-action">
              SIMPAN & MASUK FORM 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // LOGIKA ADMIN: EXTRACT UKM UNIK PER BULAN
  // =========================================
  const getUniqueUkmsForAdmin = () => {
    if (!historyData || historyData.length === 0 || !selectedBulan) return [];
    const filteredByMonth = historyData.filter(item => item.tanggal && item.tanggal.startsWith(selectedBulan));
    const uniqueUkmNames = [...new Set(filteredByMonth.map(item => item.ukm))].sort();
    return uniqueUkmNames;
  };
  const adminUniqueUkms = userRole === 'admin' ? getUniqueUkmsForAdmin() : [];

  // =========================================
  // RENDER: LAYAR 4 - DASHBOARD ADMIN / STAF
  // =========================================
  return (
    <div className="app-wrapper tech-bg">
      <div className={`form-card ${userRole === 'admin' ? 'admin-card' : ''}`}>
        
        {/* HEADER USER */}
        <div className="user-header">
          <div className="user-info">
            <div className={`user-avatar ${userRole === 'admin' ? 'admin' : ''}`}>
              {userRole === 'admin' ? '👑' : <img src={user.photoURL || 'https://via.placeholder.com/42'} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />}
            </div>
            <div className="user-text">
              <span className={`user-name ${userRole === 'admin' ? 'admin' : ''}`}>{penanggungJawab}</span>
              <span className="user-role-label">HAK AKSES: {userRole === 'admin' ? 'KOORDINATOR' : 'ENTRI DATA'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">[ KELUAR ]</button>
        </div>

        <h2 className={`form-title ${userRole === 'admin' ? 'admin-title-text' : ''}`}>
          {userRole === 'admin' ? 'DASHBOARD REKAPITULASI' : 'FORMULIR PELAPORAN'}
        </h2>
        {openDropdown && <div className="custom-select-overlay" onClick={() => setOpenDropdown(null)}></div>}

        {/* ======================================= */}
        {/* VIEW KHUSUS ADMIN                       */}
        {/* ======================================= */}
        {userRole === 'admin' ? (
          <>
            <div className="section-heading admin-heading"><span>📊</span> PARAMETER REKAPITULASI</div>
            <div className="global-section" style={{ borderColor: 'var(--neon-yellow)', boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.03)' }}>
              
              <div className="input-group">
                <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px', color: 'var(--neon-yellow)' }}>
                  Pilih Bulan Pengumpulan:
                </label>
                <div className="custom-select-wrapper">
                  <div
                    className={`custom-select-trigger admin-select ${openDropdown === 'month' ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                    style={{ height: '52px', boxSizing: 'border-box' }}
                  >
                    <div className="custom-select-value">
                      <span>[M]</span><span>{bulanOptions.find(b => b.value === selectedBulan)?.label || '-- Pilih Bulan --'}</span>
                    </div>
                    <span className="chevron-icon">▼</span>
                  </div>
                  {openDropdown === 'month' && (
                    <div className="custom-select-dropdown admin-dropdown">
                      {bulanOptions.map((b, idx) => (
                        <div key={idx} className={`custom-select-item ${selectedBulan === b.value ? 'selected' : ''}`}
                          onClick={() => handleBulanSelect(b.value)}>
                          <span style={{ fontSize: '14px', opacity: selectedBulan === b.value ? 1 : 0.5 }}>{'>'}</span>
                          <span>{b.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', color: 'var(--neon-yellow)', fontFamily: 'var(--font-tech)', fontSize: '12px', marginTop: '10px' }}>
                  MEMINDAI PANGKALAN DATA...
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-tech)', fontSize: '12px', marginTop: '10px' }}>
                  <button onClick={() => fetchHistory(true)} style={{ background:'transparent', border:'1px solid var(--neon-yellow)', color:'var(--neon-yellow)', padding:'6px 12px', borderRadius:'4px', cursor:'pointer', fontSize:'10px' }}>
                    ↻ SEGARKAN DATABASE
                  </button>
                </div>
              )}
            </div>

            <div className="section-heading admin-heading"><span>📂</span> DATA UKM TERKUMPUL</div>
            <div className="global-section" style={{ borderColor: 'var(--neon-yellow)', boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.03)' }}>
              
              <div className="admin-stats-box">
                <div className="admin-stats-number">{adminUniqueUkms.length}</div>
                <div className="admin-stats-label">TOTAL UKM YANG MENGUMPULKAN PADA BULAN INI</div>
              </div>

              {adminUniqueUkms.length === 0 ? (
                <div className="empty-draft" style={{ borderColor: 'rgba(255, 215, 0, 0.2)', color: 'var(--neon-yellow)' }}>
                  [ BELUM ADA DATA PADA BULAN INI ]
                </div>
              ) : (
                <div className="ukm-grid">
                  {adminUniqueUkms.map((ukmName, idx) => (
                    <div className="ukm-badge-card" key={idx}>
                      <div className="ukm-badge-icon">✓</div>
                      <div className="ukm-badge-name" title={ukmName}>{ukmName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ======================================= */
          /* VIEW KHUSUS STAF (FORM PELAPORAN)       */
          /* ======================================= */
          <>
            <div className="section-heading">
              <span className={`step-number ${completedSteps.bulan ? 'step-badge--done' : ''}`}>1</span>
              PARAMETER UTAMA
            </div>
            <div className="global-section">

              <div className="input-group">
                <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Pilih Bulan Laporan:</label>
                <div className="custom-select-wrapper">
                  <div
                    className={`custom-select-trigger ${openDropdown === 'month' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                    onClick={() => !isLoading && setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                    style={{ height: '52px', boxSizing: 'border-box' }}
                  >
                    <div className="custom-select-value">
                      <span>[M]</span><span>{bulanOptions.find(b => b.value === selectedBulan)?.label || '-- Pilih Bulan --'}</span>
                    </div>
                    <span className="chevron-icon">▼</span>
                  </div>
                  {openDropdown === 'month' && (
                    <div className="custom-select-dropdown">
                      {bulanOptions.map((b, idx) => (
                        <div key={idx} className={`custom-select-item ${selectedBulan === b.value ? 'selected' : ''}`}
                          onClick={() => handleBulanSelect(b.value)}>
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
                  {isTanggalLocked && <span className="lock-badge">🔒 Pilih Bulan Dulu</span>}
                </label>

                <div className="custom-select-wrapper" style={{ opacity: isTanggalLocked ? 0.4 : 1, pointerEvents: isTanggalLocked ? 'none' : 'auto', transition: '0.3s' }}>
                  <div
                    className={`custom-select-trigger ${openDropdown === 'date' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                    onClick={() => !isLoading && !isTanggalLocked && setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                    style={{ height: '52px', boxSizing: 'border-box' }}
                  >
                    <div className="custom-select-value">
                      {tanggal ? (() => {
                        const hasReport = submittedUkms.length > 0;
                        return (
                          <>
                            <span>[D]</span>
                            <span>
                              {availableDates.find(d => d.value === tanggal)?.label || tanggal}
                              {hasReport && <span style={{ marginLeft: '8px', color: '#39ff14' }}>[Terisi]</span>}
                            </span>
                          </>
                        );
                      })() : <span className="custom-select-placeholder">-- Menunggu Input --</span>}
                    </div>
                    <span className="chevron-icon">▼</span>
                  </div>
                  {openDropdown === 'date' && (
                    <div className="custom-select-dropdown">
                      {availableDates.length > 0 ? availableDates.map((dateObj, idx) => {
                        const hasReport = historyData.some(h => h.tanggal === dateObj.value);
                        return (
                          <div key={idx} className={`custom-select-item ${tanggal === dateObj.value ? 'selected' : ''}`}
                            onClick={() => handleTanggalSelect(dateObj.value)}>
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
                  <span style={{ fontSize: '12px', color: '#39ff14', fontWeight: 'bold' }}>
                    [ OK ] DITEMUKAN {submittedUkms.length} DATA PADA TANGGAL INI.
                  </span>
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
                  type="text" value={currentUkm} onChange={handleUkmChange} className="form-input"
                  placeholder="Cth: UKM Tari" disabled={isLoading}
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
                  <div className="file-chips-container">
                    {currentFotos.map((foto, index) => {
                      const previewUrl = URL.createObjectURL(foto);
                      return (
                        <div className="file-chip" key={index}>
                          <button type="button" className="tech-file-card" onClick={() => setPreviewImage(previewUrl)} title="Klik untuk lihat gambar">
                            <span className="tech-file-icon">🖼️</span>
                            <span className="tech-file-name">{foto.name}</span>
                          </button>
                          <button type="button" onClick={() => removeCurrentFoto(index)} className="file-chip-remove" disabled={isLoading}>✕</button>
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
        )}
      </div>

      {modal.isOpen && (
        <div className="modal-overlay">
          <div className={`modal-content ${modal.type}`}>
            <div className={`modal-icon ${modal.type}`}>
              {modal.type === 'warning' && '⚠️'} {modal.type === 'success' && '✓'} {modal.type === 'error' && '!'} {modal.type === 'confirm' && '?'}
            </div>
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-message">{modal.message}</p>
            <div className="modal-actions">
              {modal.type === 'confirm' && <button onClick={modal.onCancel} className="modal-btn secondary">BATAL</button>}
              <button onClick={modal.onConfirm} className="modal-btn primary">{modal.type === 'confirm' ? 'KONFIRMASI' : 'MENGERTI'}</button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <button className="image-preview-close" onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}>✕</button>
          <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
            <span className="image-preview-hint">Klik di luar gambar atau tekan ESC untuk menutup</span>
            <img src={previewImage} alt="Full Preview" className="image-preview-img" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;