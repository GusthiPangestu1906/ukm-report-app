﻿﻿﻿import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';

import logoLmb from './assets/Logo LMB.jpg';
import logoMedfo from './assets/medfo.png';
import spinnerLoading from './assets/spinner loading.png';
import { CACHE_KEYS, cache } from './utils/cache';
import { REGEX } from './utils/regex';
import { HISTORY_CACHE_TTL, ADMIN_SECRET } from './utils/constants';
import { extractFolderId, getMonthOptions } from './utils/helpers';

import AuthScreen from './features/auth/AuthScreen';
import RoleSelection from './features/role/RoleSelection';
import AdminDashboard from './features/admin/AdminDashboard';
import StaffDashboard from './features/report/StaffDashboard';
import Modal from './features/ui/Modal';
import ImagePreviewOverlay from './features/ui/ImagePreviewOverlay';

const base64ToFile = (base64, filename) => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
  const scriptURL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbx5YBwntBuQQ0SFy5Zv2-3Mt4-K46HAx45z9kWWTiYy5Bjz5TlAhzOESh2QUv7pTDWiDQ/exec';

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

  const handleRemoveQueueItem = (idToRemove) => {
    setLaporans((prevLaporans) => prevLaporans.filter(laporan => laporan.id !== idToRemove));
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
        setPenanggungJawab('ADMIN UTAMA');
      } else {
        const savedName = cache.get(CACHE_KEYS.staffName);
        if (savedName) {
          setPenanggungJawab(savedName);
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

  const handleLogin = async (selectedRole) => {
    setIsGoogleLoading(true);
    try { 
      const result = await signInWithPopup(auth, provider);
      setUser(result.user); // Hindari jeda flicker dengan set manual
      if (selectedRole === 'staff') {
        const defaultName = result.user.displayName || result.user.email.split('@')[0];
        const capitalized = defaultName.replace(/\b\w/g, l => l.toUpperCase());
        cache.set(CACHE_KEYS.staffName, capitalized);
        setPenanggungJawab(capitalized);
        handleRoleSelect('staff');
      } else if (selectedRole === 'admin') {
        setShowAdminChallenge(true);
      }
    }
    catch (error) { if (error.code !== 'auth/popup-closed-by-user') alert("Gagal Login: " + error.message); }
    finally { setIsGoogleLoading(false); }
  };

  const handleLogoutClick = () => {
    if (userRole === 'staff' && laporans.length > 0) {
      showConfirm(
        "PERINGATAN ANTREAN",
        "Anda masih memiliki data laporan yang belum terkirim di dalam antrean. Jika Anda keluar, data ini akan hilang.\n\nYakin ingin melanjutkan keluar?",
        () => setShowLogoutPrompt(true)
      );
    } else {
      setShowLogoutPrompt(true);
    }
  };

  const executeLogout = async (fullSignOut) => {
    if (fullSignOut && auth) {
      await signOut(auth);
      setUser(null);
    }
    cache.remove(CACHE_KEYS.userRole);
    cache.remove(CACHE_KEYS.staffName);
    cache.remove(CACHE_KEYS.formState);
    setUserRole(null);
    setPenanggungJawab('');
    setShowAdminChallenge(false);
    setAdminPin('');
    setShowLogoutPrompt(false);
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

    const setAdminAccess = () => {
      if (!user) setUser({ email: 'admin@sistem.lokal', displayName: 'Admin Utama' });
      setAdminError('');
      handleRoleSelect('admin');
      const adminName = user?.displayName ? user.displayName.toUpperCase() : 'ADMIN UTAMA';
      setPenanggungJawab(adminName);
    };

    // MASTER KEY ADMIN 1: Selalu bisa masuk tanpa koneksi server
    if (adminPin.trim().toUpperCase() === ADMIN_SECRET) {
      setAdminAccess();
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
        setAdminAccess();
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
    if (user && userRole === 'staff') fetchHistory();
  }, [user, userRole, fetchHistory]);

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
  const isAntreanLocked = !completedSteps.tanggal && laporans.length === 0;

  const handleUkmChange = (e) => {
    let value = e.target.value;
    if (REGEX.ukmComma.test(value)) {
      showAlert("INPUT TIDAK VALID", "Sistem mendeteksi tanda koma (,). Masukkan 1 nama UKM per entri.", "error");
      value = value.replace(/,/g, '');
    }

    // AUTO-CORRECTION: Kapitalisasi Otomatis
    let words = value.split(' ');
    if (words[0] && words[0].toLowerCase() === 'ukm') {
      words[0] = 'UKM'; // Paksa kata pertama jadi UKM
    }
    words = words.map((word, index) => {
      if (index === 0 && word === 'UKM') return word;
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    });
    value = words.join(' ');

    setCurrentUkm(value);
    
    if (value !== '') {
      if (!value.startsWith('UKM')) {
        setUkmError('Format salah: Wajib diawali persis dengan kata "UKM" (Kapital)');
      } else if (!/^UKM\s/.test(value)) {
        setUkmError('Format salah: Tambahkan spasi setelah kata "UKM" (Cth: UKM Tari)');
      } else if (value.trim().length <= 4) {
        setUkmError('Nama spesifik UKM tidak boleh kosong');
      } else {
        const words = value.trim().split(' ');
        const hasLowerCaseStart = words.slice(1).some(word => word.length > 0 && !/^[A-Z0-9]/.test(word));
        if (hasLowerCaseStart) {
          setUkmError('Format salah: Awalan setiap kata wajib menggunakan Huruf Kapital');
        } else {
          setUkmError(''); // Valid!
        }
      }
    } else {
      setUkmError('');
    }
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
    if (!penanggungJawab || !penanggungJawab.trim()) return showAlert("DATA TIDAK LENGKAP", "Nama Pengirim wajib diisi sebelum menyimpan atau mengunggah.", "error");
    if (ukmError) return showAlert("KESALAHAN FORMAT", "Selesaikan peringatan Nama UKM sebelum melanjutkan.\n" + ukmError, "error");
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
      setLaporans(prev => [...prev, { id: Date.now(), namaUkm: currentUkm, fotos: processedFotos, penanggungJawab }]);
      setCurrentUkm(''); setCurrentFotos([]); setUkmError('');
    } catch (e) {
      showAlert("GAGAL MEMPROSES", "Sistem gagal memproses data gambar.", "error");
    } finally { setIsLoading(false); }
  };

  const removeDraft = (id) => setLaporans(laporans.filter(l => l.id !== id));

  const handleEditDraft = (id, onSuccess) => {
    const performEdit = () => {
      const draftToEdit = laporans.find(l => l.id === id);
      if (!draftToEdit) return;
      const files = draftToEdit.fotos.map(f => base64ToFile(f.data, f.name));
      setCurrentUkm(draftToEdit.namaUkm);
      if (draftToEdit.penanggungJawab) setPenanggungJawab(draftToEdit.penanggungJawab);
      setCurrentFotos(files);
      setUkmError('');
      setLaporans(prev => prev.filter(l => l.id !== id));
      if (onSuccess) onSuccess();
    };

    if (currentUkm || currentFotos.length > 0) {
      showConfirm("TIMPA FORMULIR?", "Ada data yang belum selesai diisi di formulir. Yakin ingin membuang isian tersebut dan mengedit data dari antrean?", performEdit);
    } else {
      performEdit();
    }
  };

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
          penanggungJawab: item.penanggungJawab || penanggungJawab,
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
    if (currentFotos.length > 0 && (!penanggungJawab || !penanggungJawab.trim())) {
      return showAlert("DATA TIDAK LENGKAP", "Nama Pengirim wajib diisi sebelum unggah.", "error");
    }
    if (currentUkm || currentFotos.length > 0) {
      if (ukmError) return showAlert("KESALAHAN FORMAT", "Mohon perbaiki format Nama UKM.", "error");
      showConfirm("PAKET BELUM DISIMPAN", "Ada data di memori sementara yang belum masuk antrean.\nLakukan Simpan & Kirim Semua?", () => {
        setIsLoading(true);
        Promise.all(currentFotos.map(async (f) => {
          const fullBase64Data = await compressImage(f);
          return { name: f.name, data: fullBase64Data };
        })).then((processedFotos) => {
          const finalLaporans = [...laporans, { id: Date.now(), namaUkm: currentUkm, fotos: processedFotos, penanggungJawab }];
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
  // RENDER: LAYAR 1 & 2 - AUTHENTICATION & ROLE SELECTION
  // =========================================
  if (!user || (user && !userRole)) {
    return (
      <AuthScreen
        user={user}
        logoLmb={logoLmb}
        spinnerLoading={spinnerLoading}
        isGoogleLoading={isGoogleLoading}
        onLogin={handleLogin}
        showAdminChallenge={showAdminChallenge}
        onShowAdminChallenge={() => setShowAdminChallenge(true)}
        onRoleSelect={handleRoleSelect}
        adminPin={adminPin}
        onAdminPinChange={setAdminPin}
        adminError={adminError}
        isAdminVerifying={isAdminVerifying}
        onAdminVerify={handleAdminVerify}
        onCancelAdminChallenge={() => { setShowAdminChallenge(false); setAdminError(''); }}
        onLogout={handleLogoutClick}
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
    <div className="app-wrapper">
      <div className="form-card">
        
        {/* HEADER USER */}
        <div className="user-header">
          <div className="user-info">
            <div className="user-avatar">
              <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(penanggungJawab || 'A')}&background=f3e8ff&color=7e22ce`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
            </div>
            <div className="user-text">
              <span className="user-name">{penanggungJawab}</span>
              <span className="user-role-label">{userRole === 'admin' ? 'HAK AKSES: KOORDINATOR' : 'HAK AKSES: ENTRI DATA'}</span>
            </div>
          </div>
          <button onClick={handleLogoutClick} className="btn-logout">[ KELUAR ]</button>
        </div>

        <h2 className="form-title">{userRole === 'admin' ? 'DASHBOARD ADMIN' : 'FORMULIR PELAPORAN'}</h2>
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
            addMigrationLog={addMigrationLog}
            showConfirm={showConfirm}
            showAlert={showAlert}
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
            handleEditDraft={handleEditDraft}
            removeDraft={(idToRemove) => {
              setLaporans((prev) => prev.filter(laporan => laporan.id !== idToRemove));
            }}
            penanggungJawab={penanggungJawab}
            setPenanggungJawab={handlePenanggungChange}
          />
        )}
      </div>

      <Modal modal={modal} />
      {showLogoutPrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon confirm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <h3 className="modal-title">PILIHAN KELUAR</h3>
            <p className="modal-message">Silakan pilih metode keluar sesi yang Anda inginkan:</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => executeLogout(true)} className="modal-btn primary" style={{ width: '100%', padding: '14px' }}>
                KELUAR & GANTI AKUN GOOGLE
              </button>
              <button onClick={() => executeLogout(false)} className="modal-btn" style={{ width: '100%', padding: '14px', backgroundColor: '#f3e8ff', color: '#9333ea', fontWeight: 'bold' }}>
                HANYA GANTI PERAN (TETAP LOGIN)
              </button>
              <button onClick={() => setShowLogoutPrompt(false)} className="modal-btn secondary" style={{ width: '100%', padding: '14px' }}>
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