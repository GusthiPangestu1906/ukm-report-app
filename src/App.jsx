import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';

// KUNCI RAHASIA FIREBASE MEDFO (100% AMAN, HANYA BACA DARI .ENV)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "medfo-auth-85df1.firebaseapp.com",
  projectId: "medfo-auth-85df1",
  storageBucket: "medfo-auth-85df1.firebasestorage.app",
  messagingSenderId: "724707856698",
  appId: "1:724707856698:web:a5ca85e03aafe6e3bcc003",
  measurementId: "G-2PB43Y8XXG"
};

// Inisialisasi Firebase
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

  // --- STATE UNTUK KALENDER & BULAN ---
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [bulanOptions, setBulanOptions] = useState([]);
  const [selectedBulan, setSelectedBulan] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [tanggal, setTanggal] = useState('');

  // Generate daftar 2 Bulan terakhir (Bulan ini & Bulan lalu)
  useEffect(() => {
    const options = [];
    const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const d = new Date();
    
    for(let i = 0; i < 2; i++) { // <--- UBAH JADI 2 DI SINI
      const m = d.getMonth();
      const y = d.getFullYear();
      const val = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${namaBulanIndo[m]} ${y}`;
      options.push({ value: val, label: label });
      d.setMonth(m - 1); 
    }
    
    setBulanOptions(options);
    setSelectedBulan(options[0].value); 
  }, []);

  // Generate Hari Senin berdasarkan Bulan yang dipilih
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
    setTanggal(''); 
  }, [selectedBulan]);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsAuthLoading(false); 
    }
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') alert("Gagal Login: " + error.message);
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
  };

  // State Form Utama
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [nameError, setNameError] = useState(''); 
  const [currentUkm, setCurrentUkm] = useState('');
  const [ukmError, setUkmError] = useState(''); 
  const [laporans, setLaporans] = useState([]);
  const [currentFotos, setCurrentFotos] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const [historyData, setHistoryData] = useState([]);
  const [submittedUkms, setSubmittedUkms] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null, onCancel: null });
  
  const scriptURL = 'https://script.google.com/macros/s/AKfycbz1QI1qt1EU_KDwFbhOL9KiDjNLIKAifA3bKSFJwQKuPEhz0W5kX_bDepq-QlT7e2VZ/exec';

  const showAlert = (title, message, type = 'warning') => setModal({ isOpen: true, title, message, type, onConfirm: closeModal });
  const showConfirm = (title, message, onConfirmCallback) => setModal({ isOpen: true, title, message, type: 'confirm', onConfirm: () => { onConfirmCallback(); closeModal(); }, onCancel: closeModal });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  // Sinkronisasi data riwayat awal
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(scriptURL);
        const result = await response.json();
        if (result.status === "success") setHistoryData(result.data);
      } catch (error) {
        console.error("Gagal menarik data riwayat:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  // Update riwayat ketika Tanggal berubah
  useEffect(() => {
    if (tanggal && historyData.length > 0) {
      const ukmsForDate = historyData.filter(item => item.tanggal === tanggal).map(item => item.ukm);
      setSubmittedUkms(ukmsForDate);
    } else {
      setSubmittedUkms([]);
    }
  }, [tanggal, historyData]);

  // Otomatis mengisi nama dari akun Google
  useEffect(() => {
    if (user && !penanggungJawab) {
      setPenanggungJawab(user.displayName || user.email.split('@')[0]);
    }
  }, [user]);

  const handleNameChange = (e) => {
    const value = e.target.value.replace(/[0-9]/g, '');
    setPenanggungJawab(value);
    if (value.trim() !== '' && /(?:^|\s)[a-z]/.test(value)) setNameError('Setiap awal kata wajib menggunakan huruf kapital (Contoh: Budi Santoso)');
    else setNameError('');
  };

  const handleUkmChange = (e) => {
    let value = e.target.value;
    if (value.includes(',')) {
      showAlert("Peringatan Validasi", "Mohon masukkan 1 nama UKM saja.\nTidak boleh menggunakan tanda koma (,).");
      value = value.replace(/,/g, '');
    }
    setCurrentUkm(value);
    if (value.trim() !== '') {
      if (!/^UKM(\s|$)/.test(value.trim())) setUkmError('Wajib diawali dengan kata "UKM" (Contoh: UKM Tari)');
      else if (/(?:^|\s)[a-z]/.test(value)) setUkmError('Setiap awal kata wajib menggunakan huruf kapital (Contoh: UKM Tari)');
      else setUkmError('');
    } else setUkmError('');
  };

  const handleFileChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const newFiles = Array.from(event.target.files);
    if (currentFotos.length + newFiles.length > 3) {
      showAlert("Batas Kuota", "Maksimal hanya 3 foto dokumentasi per entri UKM!");
      event.target.value = ''; return;
    }
    setCurrentFotos([...currentFotos, ...newFiles]);
    event.target.value = ''; 
  };

  const removeCurrentFoto = (fotoIndex) => setCurrentFotos(currentFotos.filter((_, i) => i !== fotoIndex));

  const addToDraft = () => {
    if (ukmError) return showAlert("Format Penulisan Salah", "Mohon perbaiki penulisan Nama UKM terlebih dahulu.\n" + ukmError, "error");
    if (!currentUkm.trim()) return showAlert("Data Belum Lengkap", "Kolom 'Nama UKM' wajib diisi!");
    if (currentFotos.length === 0) return showAlert("Data Belum Lengkap", "Pilih minimal 1 foto hasil dokumentasi!");
    
    const isDuplicate = laporans.some(laporan => laporan.namaUkm.toLowerCase() === currentUkm.trim().toLowerCase());
    if (isDuplicate) return showAlert("Duplikat Terdeteksi", `UKM "${currentUkm.trim()}" sudah ada di dalam antrean.`, "error");

    setLaporans([...laporans, { id: Date.now(), namaUkm: currentUkm, fotos: currentFotos }]);
    setCurrentUkm(''); setCurrentFotos([]); setUkmError('');
  };

  const removeDraft = (id) => setLaporans(laporans.filter(l => l.id !== id));

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
          const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  };

  const executeSubmission = async (finalLaporanList) => {
    setIsLoading(true);
    setStatus(`Memulai pengiriman ${finalLaporanList.length} antrean...`);
    let hasError = false;
    const successfulIds = []; 

    try {
      for (let i = 0; i < finalLaporanList.length; i++) {
        const item = finalLaporanList[i];
        setProcessingId(item.id);
        setStatus(`Mengirim data ${i + 1} dari ${finalLaporanList.length}...`);
        setUploadProgress(prev => ({ ...prev, [item.id]: 10 }));

        const amanUkmName = item.namaUkm.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const processedFotos = [];
        for (let f = 0; f < item.fotos.length; f++) {
           const compressedBase64 = await compressImage(item.fotos[f]);
           processedFotos.push({ 
              fileName: item.fotos.length > 1 ? `${amanUkmName} (${f + 1}).jpg` : `${amanUkmName}.jpg`, 
              mimeType: 'image/jpeg', 
              fileBase64: compressedBase64 
           });
           setUploadProgress(prev => ({ ...prev, [item.id]: 10 + Math.floor(((f + 1) / item.fotos.length) * 40) }));
        }

        setUploadProgress(prev => ({ ...prev, [item.id]: 60 }));

        const payload = { 
          penanggungJawab, 
          tanggal, 
          laporanList: [{ namaUkm: item.namaUkm, files: processedFotos }],
          userEmail: user?.email || "Unknown" 
        };

        const response = await fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await response.json();

        if (result.status === "success") {
          setUploadProgress(prev => ({ ...prev, [item.id]: 100 }));
          successfulIds.push(item.id);
          
          // Refresh background data secara diam-diam agar tanda centang update
          try {
            const historyResp = await fetch(scriptURL);
            const historyResult = await historyResp.json();
            if (historyResult.status === "success") setHistoryData(historyResult.data);
          } catch(e) {}

          await new Promise(res => setTimeout(res, 500)); 
        } else {
          showAlert("Pengiriman Gagal", `Gagal mengirim data UKM: ${item.namaUkm}.\nAlasan: ${result.message}`, "error");
          setUploadProgress(prev => ({ ...prev, [item.id]: 0 }));
          hasError = true;
          break; 
        }
      }

      if (!hasError) {
        showAlert("🎉 BERHASIL!", `Semua ${finalLaporanList.length} data laporan UKM telah sukses dikirim ke Server.`, "success");
        setLaporans([]); 
        setCurrentUkm(''); setCurrentFotos([]); setUkmError('');
      } else {
        setLaporans(prev => prev.filter(draft => !successfulIds.includes(draft.id)));
      }

    } catch (error) {
      showAlert("Terjadi Kesalahan Koneksi", "Koneksi internet terputus atau server sibuk saat memproses data.\nAntrean yang belum terkirim masih aman di keranjang, silakan coba kirim ulang.", "error");
      setLaporans(prev => prev.filter(draft => !successfulIds.includes(draft.id)));
    } finally {
      setIsLoading(false);
      setProcessingId(null);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const checkKeterlambatan = (tanggalLaporan) => {
    if (!tanggalLaporan) return false;
    const waktuSubmit = new Date();
    const deadline = new Date(tanggalLaporan);
    deadline.setDate(deadline.getDate() + 2); // Batas hari Selasa 23:59
    deadline.setHours(0, 0, 0, 0);
    return waktuSubmit.getTime() > deadline.getTime();
  };

  const processSubmission = (finalLaporans) => {
    const isLate = checkKeterlambatan(tanggal);
    if (isLate) {
      showConfirm(
        "Peringatan Keterlambatan 🔴",
        "Laporan ini telah melewati batas waktu yang ditentukan (Selasa jam 23:59).\n\nData akan tetap terkirim, namun akan dicatat dengan status 'Terlambat' di dalam sistem Google Sheets.\n\nApakah Anda yakin ingin melanjutkan?",
        () => executeSubmission(finalLaporans)
      );
    } else {
      executeSubmission(finalLaporans);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nameError) return showAlert("Format Penulisan Salah", "Mohon perbaiki penulisan Nama Penanggung Jawab.\nPastikan setiap awal kata menggunakan huruf kapital.", "error");
    if (!penanggungJawab.trim() || !tanggal) return showAlert("Informasi Belum Lengkap", "Kolom Penanggung Jawab dan Tanggal wajib diisi!");

    if (currentUkm || currentFotos.length > 0) {
      if (ukmError) return showAlert("Format Penulisan Salah", "Mohon perbaiki penulisan Nama UKM sebelum melanjutkan.", "error");
      showConfirm("Data Belum Disimpan", "Ada data UKM yang sedang diketik tapi belum disimpan ke antrean.\n\nKlik 'Simpan & Kirim' untuk otomatis menyimpannya lalu mengirim semuanya.", () => {
           const newDraft = { id: Date.now(), namaUkm: currentUkm || "Data Tanpa Nama", fotos: currentFotos };
           const finalLaporans = [...laporans, newDraft];
           setCurrentUkm(''); setCurrentFotos([]); setLaporans(finalLaporans);
           setTimeout(() => { processSubmission(finalLaporans); }, 400);
      }); return; 
    }
    
    if (laporans.length === 0) return showAlert("Antrean Kosong", "Belum ada data di Daftar Antrean.");
    processSubmission(laporans);
  };

  if (isAuthLoading) return <div className="app-wrapper"><div className="form-title">Memuat Keamanan...</div></div>;

  if (!user && auth) {
    return (
      <div className="app-wrapper login-wrapper">
        <div className="form-card login-card">
          <div className="login-logo">🛡️</div>
          <h2 className="form-title">Portal Laporan MEDFO</h2>
          <p className="login-subtitle">
            Akses ke sistem pengiriman arsip ini dibatasi.<br/>
            Silakan verifikasi identitas Anda menggunakan akun Google.
          </p>
          <button onClick={handleLogin} className="btn-google-login">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
            Login dengan Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="form-card">
        {user && (
          <div className="user-header">
            <div className="user-info">
              <img src={user.photoURL || 'https://via.placeholder.com/36'} alt="Profile" className="user-avatar" />
              <div className="user-text">
                <span className="user-name">{user.displayName || "Pengguna MEDFO"}</span>
                <span className="user-email">Staf Terverifikasi ({user.email})</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">Keluar</button>
          </div>
        )}

        <h2 className="form-title">Form UKM Report</h2>
        {openDropdown && <div className="custom-select-overlay" onClick={() => setOpenDropdown(null)}></div>}

        <div className="section-heading"><span>1</span> Informasi Umum</div>
        <div className="global-section">
          
          <div className="input-group">
            <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Nama Penanggung Jawab (Staff Medfo):</label>
            <input 
              type="text" value={penanggungJawab} onChange={handleNameChange} className="form-input" placeholder="Cth: Mila" disabled={isLoading} 
              style={{ height: '52px', boxSizing: 'border-box', borderColor: nameError ? '#ef4444' : undefined, outlineColor: nameError ? '#ef4444' : undefined, backgroundColor: nameError ? '#fef2f2' : undefined }}
            />
            {nameError && (
              <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.4', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span><span>{nameError}</span>
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Bulan Laporan:</label>
            <div className="custom-select-wrapper">
              <div 
                className={`custom-select-trigger ${openDropdown === 'month' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                onClick={() => !isLoading && setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                style={{ height: '52px', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
              >
                <div className="custom-select-value">
                  <span>🗓️</span> <span>{bulanOptions.find(b => b.value === selectedBulan)?.label || '-- Pilih Bulan --'}</span>
                </div>
                <span className="chevron-icon">▼</span>
              </div>
              {openDropdown === 'month' && (
                <div className="custom-select-dropdown">
                  {bulanOptions.map((b, idx) => (
                    <div key={idx} className={`custom-select-item ${selectedBulan === b.value ? 'selected' : ''}`} onClick={() => { setSelectedBulan(b.value); setOpenDropdown(null); }}>
                      <span style={{ fontSize: '18px', opacity: selectedBulan === b.value ? 1 : 0.7 }}>🗓️</span><span>{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Tanggal Laporan (Hari Senin):</label>
            <div className="custom-select-wrapper">
              <div 
                className={`custom-select-trigger ${openDropdown === 'date' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                onClick={() => !isLoading && setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                style={{ height: '52px', boxSizing: 'border-box' }}
              >
                <div className="custom-select-value">
                  {tanggal ? (() => {
                    const hasReport = historyData.some(h => h.tanggal === tanggal);
                    return (
                      <>
                        <span>📅</span> 
                        <span>
                          {availableDates.find(d => d.value === tanggal)?.label || tanggal} 
                          {hasReport && <span style={{ marginLeft: '6px' }}>✅</span>}
                        </span>
                      </>
                    );
                  })() : (
                    <span className="custom-select-placeholder">-- Pilih Hari Senin --</span>
                  )}
                </div>
                <span className="chevron-icon">▼</span>
              </div>
              
              {/* DROPDOWN TANGGAL DENGAN TANDA CENTANG ✅ */}
              {openDropdown === 'date' && (
                <div className="custom-select-dropdown">
                  {availableDates.length > 0 ? availableDates.map((dateObj, idx) => {
                    // Cek apakah di database sudah ada data untuk tanggal ini
                    const hasReport = historyData.some(h => h.tanggal === dateObj.value);
                    return (
                    <div key={idx} className={`custom-select-item ${tanggal === dateObj.value ? 'selected' : ''}`} onClick={() => { setTanggal(dateObj.value); setOpenDropdown(null); }}>
                      <span style={{ fontSize: '18px', opacity: tanggal === dateObj.value ? 1 : 0.7 }}>📅</span>
                      <span>
                        {dateObj.label} 
                        {hasReport && <span style={{ marginLeft: '6px' }}>✅</span>}
                      </span>
                    </div>
                  )}) : (
                    <div className="custom-select-item" style={{justifyContent: 'center', color: '#94a3b8', cursor: 'default'}}>Tidak ada hari Senin di bulan ini</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Versi Super Bersih untuk Informasi Bawah (Hanya Teks Singkat) */}
          <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            {!tanggal ? (
              <span style={{ fontSize: '13px', color: '#64748b' }}>Pilih tanggal untuk melihat status laporan.</span>
            ) : isLoadingHistory ? (
              <span style={{ fontSize: '13px', color: '#64748b' }}>⏳ Memuat...</span>
            ) : submittedUkms.length > 0 ? (
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                ✅ Sudah ada {submittedUkms.length} laporan UKM yang masuk di tanggal ini.
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: '#64748b' }}>Belum ada laporan di tanggal ini. Kamu yang pertama! 🚀</span>
            )}
          </div>

        </div>

        <div className="section-heading"><span>2</span> Tambah Data Baru</div>
        <div className="active-form-section">
          <div className="input-group">
            <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Nama UKM:</label>
            <input 
              type="text" value={currentUkm} onChange={handleUkmChange} className="form-input" placeholder="Cth: UKM Tari" disabled={isLoading} 
              style={{ height: '52px', boxSizing: 'border-box', borderColor: ukmError ? '#ef4444' : undefined, outlineColor: ukmError ? '#ef4444' : undefined, backgroundColor: ukmError ? '#fef2f2' : undefined }}
            />
            {ukmError && (
              <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.4', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span><span>{ukmError}</span>
              </div>
            )}
          </div>
          
          <div className="input-group">
            <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Hasil Dokumentasi (Maks 3):</label>
            {currentFotos.length < 3 && (
              <label className="file-dropzone" style={{opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto'}}>
                <input type="file" accept="image/jpeg, image/png, image/jpg, image/webp" multiple onChange={handleFileChange} className="hidden-input" disabled={isLoading} />
                <span className="dropzone-icon">📁</span>
                <span className="dropzone-text">Tap di sini untuk pilih foto</span>
                <span className="dropzone-subtext">Tahan/Select foto di Galeri untuk pilih banyak</span>
              </label>
            )}

            {currentFotos.length > 0 && (
              <div className="file-chips-container">
                {currentFotos.map((foto, index) => {
                  const previewUrl = URL.createObjectURL(foto);
                  return (
                    <div className="file-chip" key={index}>
                      <div className="file-chip-info">
                        <img src={previewUrl} alt="preview" className="file-chip-thumbnail" />
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="file-chip-name">{foto.name}</a>
                      </div>
                      <button type="button" onClick={() => removeCurrentFoto(index)} className="file-chip-remove" disabled={isLoading}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button type="button" onClick={addToDraft} className="btn-add-draft" disabled={isLoading}>+ Simpan ke Daftar Laporan</button>
        </div>

        <div className="section-heading"><span>3</span> Daftar Antrean ({laporans.length})</div>
        <div className="draft-list-section">
          {laporans.length === 0 ? (
            <div className="empty-draft">Belum ada data UKM yang ditambahkan ke antrean.</div>
          ) : (
             laporans.map((laporan, index) => {
              const currentProgress = uploadProgress[laporan.id] || 0;
              const isProcessing = processingId === laporan.id || currentProgress > 0;
              const isSuccess = currentProgress === 100;
              return (
                <div className={`draft-item ${isProcessing ? 'processing' : ''}`} key={laporan.id}>
                  <div className="draft-info">
                    <span className="draft-title">{index + 1}. {laporan.namaUkm}</span>
                    <span className="draft-subtitle">Terlampir {laporan.fotos.length} file dokumentasi</span>
                    {isProcessing && (
                      <div className="progress-container">
                        <span className={`draft-status-text ${isSuccess ? 'success' : ''}`}>
                          {isSuccess ? '✓ Berhasil terkirim' : currentProgress > 50 ? `⏳ Mengunggah ke server... (${currentProgress}%)` : `⏳ Mengemas file... (${currentProgress}%)`}
                        </span>
                        <div className="progress-bar-bg"><div className={`progress-bar-fill ${isSuccess ? 'success' : ''}`} style={{ width: `${currentProgress}%` }}></div></div>
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
          {isLoading ? 'Sedang Memproses...' : `Kirim ${laporans.length} Data Sekaligus 🚀`}
        </button>
      </div>

      {modal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className={`modal-icon ${modal.type}`}>
              {modal.type === 'warning' && '⚠️'} {modal.type === 'success' && '✅'} {modal.type === 'error' && '❌'} {modal.type === 'confirm' && '❓'}
            </div>
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-message">{modal.message}</p>
            <div className="modal-actions">
              {modal.type === 'confirm' && <button onClick={modal.onCancel} className="modal-btn secondary">Batal</button>}
              <button onClick={modal.onConfirm} className="modal-btn primary">{modal.type === 'confirm' ? 'Simpan & Kirim' : 'Mengerti'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;