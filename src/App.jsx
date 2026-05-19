import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';

import logoLmb from './assets/Logo LMB.jpg';
import { CACHE_KEYS, cache } from './utils/cache';
import { REGEX } from './utils/regex';
import { HISTORY_CACHE_TTL, ADMIN_SECRET } from './utils/constants';
import { extractFolderId, getMonthOptions } from './utils/helpers';

import AuthScreen from './features/auth/AuthScreen';
import RoleSelection from './features/role/RoleSelection';
import ProfileSetup from './features/profile/ProfileSetup';
import AdminDashboard from './features/admin/AdminDashboard';
import StaffDashboard from './features/report/StaffDashboard';
import Modal from './features/ui/Modal';
import ImagePreviewOverlay from './features/ui/ImagePreviewOverlay';

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

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); 
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  // --- STATE INFRASTRUKTUR / DATABASE ---
  const [folderId, setFolderId] = useState(localStorage.getItem('medfo_folder_id') || '');
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('medfo_spreadsheet_id') || '');

  // Logika Riwayat Infrastruktur (Audit Log)
  const [migrationLogs, setMigrationLogs] = useState(() => JSON.parse(localStorage.getItem('medfo_migration_logs') || '[]'));

  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medfo_current_position') || 'null'); } catch { return null; }
  });

  // State Keamanan Admin
  const [showAdminChallenge, setShowAdminChallenge] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

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

  // URL Backend
  const scriptURL = import.meta.env.VITE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbz1QI1qt1EU_KDwFbhOL9KiDjNLIKAifA3bKSFJwQKuPEhz0W5kX_bDepq-QlT7e2VZ/exec';

  const showAlert  = (title, message, type = 'warning') => setModal({ isOpen: true, title, message, type, onConfirm: closeModal });
  const showConfirm = (title, message, onConfirmCallback) => setModal({ isOpen: true, title, message, type: 'confirm', onConfirm: () => { onConfirmCallback(); closeModal(); }, onCancel: closeModal });
  const closeModal  = () => setModal(prev => ({ ...prev, isOpen: false }));

  // =========================================
  // FUNGSI AUTO-MIGRASI PROTOKOL & LOGGING
  // =========================================
  const extractFolderId = (url) => {
    const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const addMigrationLog = (actionName) => {
    const newLog = {
      date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      actor: user?.email || user?.displayName || 'ADMIN UTAMA',
      action: actionName
    };
    const updatedLogs = [newLog, ...migrationLogs];
    localStorage.setItem('medfo_migration_logs', JSON.stringify(updatedLogs));
    setMigrationLogs(updatedLogs);
  };

  // Taruh setelah fungsi addMigrationLog
  const handleDeleteMigrationLog = (index) => {
    const isAll = index === 'all';
    showConfirm(
      isAll ? "HAPUS SEMUA RIWAYAT" : "HAPUS RIWAYAT",
      isAll ? "Yakin ingin menghapus semua riwayat infrastruktur?" : "Yakin ingin menghapus riwayat infrastruktur ini?",
      () => {
        const updatedLogs = isAll ? [] : migrationLogs.filter((_, i) => i !== index);
        localStorage.setItem('medfo_migration_logs', JSON.stringify(updatedLogs));
        setMigrationLogs(updatedLogs);
      }
    );
  };

  const handleSystemSetup = async (e) => {
    e.preventDefault();
    const extractedId = extractFolderId(driveUrlInput);
    
    if (!extractedId) {
      return showAlert("FORMAT URL SALAH", "Pastikan Anda memasukkan URL folder Google Drive yang valid.", "error");
    }

    const confirmMessage = "Sistem akan menautkan (dan memigrasikan) data ke Folder Drive yang baru. Lanjutkan?";

    showConfirm("KONFIRMASI TAUTAN BARU", confirmMessage, async () => {
      setSetupLoading(true);
      try {
        const response = await fetch(scriptURL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'initSystem',
            folderId: extractedId,
            oldSpreadsheetId: spreadsheetId // Jika kosong, backend akan clone dari database default
          })
        });
        const result = await response.json();

        if (result.status === 'success') {
          // Simpan ID yang baru
          localStorage.setItem('medfo_folder_id', extractedId);
          localStorage.setItem('medfo_spreadsheet_id', result.spreadsheetId);
          setFolderId(extractedId);
          setSpreadsheetId(result.spreadsheetId);
          
          // Set current position locally (timestamped) so UI dapat menampilkan posisi aktif
          try {
            const pos = { folderId: extractedId, spreadsheetId: result.spreadsheetId, setAt: new Date().toISOString() };
            localStorage.setItem('medfo_current_position', JSON.stringify(pos));
            setCurrentPosition(pos);
          } catch (e) { /* ignore */ }

          setDriveUrlInput('');
          showAlert("TAUTAN BERHASIL", result.message || "Database berhasil ditautkan.", "success");
          
          // Tambahkan ke Log
          addMigrationLog(spreadsheetId ? 'MEMPERBARUI TAUTAN KE FOLDER BARU' : 'INISIASI TAUTAN PERTAMA KALI');
          
          fetchHistory(true); 
        } else {
          showAlert("GAGAL MEMPROSES", result.message || "Gagal menghubungi server Google Drive.", "error");
        }
      } catch (err) {
        showAlert("KONEKSI TERPUTUS", "Gagal menghubungi Server Google Apps Script.", "error");
      } finally {
        setSetupLoading(false);
      }
    });
  };

  const handleResetToDefault = () => {
    showConfirm("KEMBALI KE DATABASE UTAMA", "Sistem akan memutuskan tautan dari folder saat ini dan kembali menggunakan Spreadsheet Utama (Default) bawaan sistem. Lanjutkan?", () => {
      // Kosongkan ID saat ini (agar fallback ke Default script)
      localStorage.removeItem('medfo_folder_id');
      localStorage.removeItem('medfo_spreadsheet_id');
      setFolderId('');
      setSpreadsheetId('');

      addMigrationLog('KEMBALI MENGGUNAKAN DATABASE UTAMA (DEFAULT)');
      showAlert("RESTORASI BERHASIL", "Sistem kini beroperasi menggunakan Database Utama bawaan.", "success");
      fetchHistory(true);
    });
  };

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
      if (savedFormState.selectedBulan) { setSelectedBulan(savedFormState.selectedBulan); setCompletedSteps(prev => ({ ...prev, bulan: true })); }
      if (savedFormState.tanggal) { setTanggal(savedFormState.tanggal); setCompletedSteps(prev => ({ ...prev, bulan: true, tanggal: true })); }
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
    const options = getMonthOptions();
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

    // MASTER KEY ADMIN 1: Selalu bisa masuk tanpa koneksi server
    if (adminPin.trim().toUpperCase() === ADMIN_SECRET) {
      setAdminError('');
      handleRoleSelect('admin');
      setPenanggungJawab('ADMIN MEDFO');
      setIsNameSet(true);
      return;
    }

    setIsAdminVerifying(true);
    setAdminError('');

    try {
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'verifyAdmin', 
          passcode: adminPin.trim().toUpperCase(),
          spreadsheetId: spreadsheetId // Opsional, backend akan pakai default jika kosong
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

  // Hanya Staf yang perlu menarik history untuk form validasi hariannya
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
      const url = spreadsheetId ? `${scriptURL}?spreadsheetId=${spreadsheetId}` : scriptURL;
      const response = await fetch(url);
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
  }, [scriptURL, spreadsheetId]);

  useEffect(() => {
    // Admin tidak perlu menarik history UKM lagi, cukup Staf
    if (user && userRole === 'staff' && isNameSet) fetchHistory();
  }, [user, userRole, isNameSet, fetchHistory]);

  // Jika Admin, tarik seluruh history untuk kebutuhan manajemen
  useEffect(() => {
    if (user && userRole === 'admin') fetchHistory(true);
  }, [user, userRole, fetchHistory]);

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
        const payload = { 
          action: 'submitReport', 
          penanggungJawab, 
          tanggal, 
          laporanList: [{ namaUkm: item.namaUkm, files: processedFotos }], 
          userEmail: user?.email || "Unknown",
          folderId: folderId,
          spreadsheetId: spreadsheetId
        };
        const response = await fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await response.json();
        if (result.status === "success") {
          setUploadProgress(prev => ({ ...prev, [item.id]: 100 }));
          successfulIds.push(item.id);
          await fetchHistory(true);
          await new Promise(res => setTimeout(res, 500));
        } else if (result.message && result.message.startsWith('MAINTENANCE:')) {
          showAlert("⚠ SISTEM MAINTENANCE", "Admin sedang melakukan pemeliharaan database. Harap tunggu beberapa saat dan coba lagi.", "warning");
          setUploadProgress(prev => ({ ...prev, [item.id]: 0 }));
          hasError = true; break;
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

  // =========================================
  // ADMIN ACTION: HAPUS RIWAYAT
  // =========================================
  const handleDeleteHistoryRecord = async (record) => {
    if (!record) return;
    const buildIdentifier = () => {
      if (record.id) return { recordId: record.id };
      // fallback composite key
      return { ukm: record.ukm, tanggal: record.tanggal, userEmail: record.userEmail || record.penanggungJawab || record.actor };
    };

    showConfirm("HAPUS RIWAYAT", `Anda akan menghapus entri riwayat untuk [${record.ukm || 'UNKNOWN'}] pada tanggal ${record.tanggal || 'UNKNOWN'}. Lanjutkan?`, async () => {
      try {
        const payload = { action: 'deleteHistory', spreadsheetId: spreadsheetId, identifier: buildIdentifier() };
        const response = await fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await response.json();
        if (result.status === 'success') {
          await fetchHistory(true);
          showAlert('BERHASIL', result.message || 'Entri riwayat berhasil dihapus.', 'success');
        } else {
          showAlert('GAGAL', result.message || 'Server gagal memproses permintaan hapus.', 'error');
        }
      } catch (e) {
        console.error('Hapus riwayat error', e);
        showAlert('KONEKSI TERPUTUS', 'Gagal menghubungi server untuk menghapus riwayat.', 'error');
      }
    });
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
      <div className="tech-auth-container tech-bg">
        <div style={{ color: 'var(--neon-cyan)', fontSize: '16px', fontFamily: 'var(--font-tech)', letterSpacing: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <span className="blink-dot" style={{ width: '12px', height: '12px' }}></span>
          [ MEMUAT KONEKSI AMAN... ]
        </div>
      </div>
    );
  }

  // =========================================
  // RENDER: LAYAR 1 - LOGIN GOOGLE
  // =========================================
  if (!user && auth) {
    return <AuthScreen logoLmb={logoLmb} onLogin={handleLogin} />;
  }

  // =========================================
  // RENDER: LAYAR 2 - PILIH ROLE & PASSCODE ADMIN
  // =========================================
  if (user && !userRole) {
    return (
      <RoleSelection
        user={user}
        logoLmb={logoLmb}
        showAdminChallenge={showAdminChallenge}
        onShowAdminChallenge={() => setShowAdminChallenge(true)}
        onRoleSelect={handleRoleSelect}
        adminPin={adminPin}
        onAdminPinChange={setAdminPin}
        adminError={adminError}
        isAdminVerifying={isAdminVerifying}
        onAdminVerify={handleAdminVerify}
        onCancelAdminChallenge={() => { setShowAdminChallenge(false); setAdminError(''); }}
      />
    );
  }

  // =========================================
  // RENDER: LAYAR 3 - PROFIL (HANYA STAF)
  // =========================================
  if (user && userRole === 'staff' && !isNameSet) {
    return (
      <ProfileSetup
        user={user}
        logoLmb={logoLmb}
        tempName={tempName}
        onTempNameChange={handleTempNameChange}
        nameError={nameError}
        onSaveName={handleSaveName}
      />
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
          {userRole === 'admin' ? 'DASHBOARD INFRASTRUKTUR' : 'FORMULIR PELAPORAN'}
        </h2>
        {openDropdown && <div className="custom-select-overlay" onClick={() => setOpenDropdown(null)}></div>}

        {userRole === 'admin' ? (
          <AdminDashboard
            spreadsheetId={spreadsheetId}
            folderId={folderId}
            driveUrlInput={driveUrlInput}
            setDriveUrlInput={setDriveUrlInput}
            setupLoading={setupLoading}
            handleSystemSetup={handleSystemSetup}
            handleResetToDefault={handleResetToDefault}
            migrationLogs={migrationLogs}
            onDeleteMigrationLog={handleDeleteMigrationLog}
          />
        ) : (
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
          />
        )}
      </div>

      <Modal modal={modal} />
      <ImagePreviewOverlay previewImage={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

export default App;