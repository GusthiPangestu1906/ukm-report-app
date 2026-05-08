import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';
import logoLmb from './assets/logo-lmb.jpg';

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

  // --- STATE PROFIL & LOCAL STORAGE ---
  const [penanggungJawab, setPenanggungJawab] = useState(localStorage.getItem('medfo_staff_name') || '');
  const [isNameSet, setIsNameSet] = useState(!!localStorage.getItem('medfo_staff_name'));
  const [tempName, setTempName] = useState('');

  // --- STATE KALENDER & BULAN ---
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [bulanOptions, setBulanOptions] = useState([]);
  const [selectedBulan, setSelectedBulan] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [tanggal, setTanggal] = useState('');

  // Generate 2 Bulan terakhir
  useEffect(() => {
    const options = [];
    const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const d = new Date();
    
    for(let i = 0; i < 2; i++) { 
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

  // Generate Hari Senin
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
    localStorage.removeItem('medfo_staff_name');
    setIsNameSet(false);
    setPenanggungJawab('');
  };

  const handleSaveName = () => {
    const finalName = tempName.trim();
    if (!finalName) return showAlert("AKSES DITOLAK", "Parameter Nama tidak boleh kosong!", "error");
    
    // Auto Kapital di awal kata
    const capitalized = finalName.replace(/\b\w/g, l => l.toUpperCase());
    
    localStorage.setItem('medfo_staff_name', capitalized);
    setPenanggungJawab(capitalized);
    setIsNameSet(true);
  };

  // State Form Utama
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

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(scriptURL);
        const result = await response.json();
        if (result.status === "success") setHistoryData(result.data);
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    if (user && isNameSet) fetchHistory();
  }, [user, isNameSet]);

  useEffect(() => {
    if (tanggal && historyData.length > 0) {
      const ukmsForDate = historyData.filter(item => item.tanggal === tanggal).map(item => item.ukm);
      setSubmittedUkms(ukmsForDate);
    } else {
      setSubmittedUkms([]);
    }
  }, [tanggal, historyData]);

  const handleUkmChange = (e) => {
    let value = e.target.value;
    if (value.includes(',')) {
      showAlert("INPUT TIDAK VALID", "Sistem mendeteksi tanda koma (,). Masukkan 1 nama UKM per entri.");
      value = value.replace(/,/g, '');
    }
    setCurrentUkm(value);
    if (value.trim() !== '') {
      if (!/^UKM(\s|$)/.test(value.trim())) setUkmError('Format salah: Wajib diawali kata "UKM" (Cth: UKM Tari)');
      else if (/(?:^|\s)[a-z]/.test(value)) setUkmError('Format salah: Gunakan Huruf Kapital di setiap awal kata');
      else setUkmError('');
    } else setUkmError('');
  };

  const handleFileChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const newFiles = Array.from(event.target.files);
    if (currentFotos.length + newFiles.length > 3) {
      showAlert("KUOTA TERLAMPAUI", "Maksimal melampirkan 3 file dokumentasi per entri!");
      event.target.value = ''; return;
    }
    setCurrentFotos([...currentFotos, ...newFiles]);
    event.target.value = ''; 
  };

  const removeCurrentFoto = (fotoIndex) => setCurrentFotos(currentFotos.filter((_, i) => i !== fotoIndex));

  const addToDraft = () => {
    if (ukmError) return showAlert("KESALAHAN FORMAT", "Selesaikan peringatan format Nama UKM sebelum melanjutkan.\n" + ukmError, "error");
    if (!currentUkm.trim()) return showAlert("DATA TIDAK LENGKAP", "Parameter [Nama UKM] berstatus kosong!");
    if (currentFotos.length === 0) return showAlert("DATA TIDAK LENGKAP", "Sistem membutuhkan minimal 1 file gambar bukti dokumentasi!");
    
    const isDuplicate = laporans.some(laporan => laporan.namaUkm.toLowerCase() === currentUkm.trim().toLowerCase());
    if (isDuplicate) return showAlert("DUPLIKAT TERDETEKSI", `Entri "${currentUkm.trim()}" telah ada dalam memori antrean lokal.`, "error");

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
    setStatus(`MENGUNGGAH PAKET DATA...`);
    let hasError = false;
    const successfulIds = []; 

    try {
      for (let i = 0; i < finalLaporanList.length; i++) {
        const item = finalLaporanList[i];
        setProcessingId(item.id);
        setUploadProgress(prev => ({ ...prev, [item.id]: 10 }));

        const amanUkmName = item.namaUkm.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const processedFotos = [];
        for (let f = 0; f < item.fotos.length; f++) {
           const compressedBase64 = await compressImage(item.fotos[f]);
           processedFotos.push({ fileName: item.fotos.length > 1 ? `${amanUkmName} (${f + 1}).jpg` : `${amanUkmName}.jpg`, mimeType: 'image/jpeg', fileBase64: compressedBase64 });
           setUploadProgress(prev => ({ ...prev, [item.id]: 10 + Math.floor(((f + 1) / item.fotos.length) * 40) }));
        }
        setUploadProgress(prev => ({ ...prev, [item.id]: 60 }));

        const payload = { penanggungJawab, tanggal, laporanList: [{ namaUkm: item.namaUkm, files: processedFotos }], userEmail: user?.email || "Unknown" };
        const response = await fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await response.json();

        if (result.status === "success") {
          setUploadProgress(prev => ({ ...prev, [item.id]: 100 }));
          successfulIds.push(item.id);
          try {
            const historyResp = await fetch(scriptURL);
            const historyResult = await historyResp.json();
            if (historyResult.status === "success") setHistoryData(historyResult.data);
          } catch(e) {}
          await new Promise(res => setTimeout(res, 500)); 
        } else {
          showAlert("PENGIRIMAN GAGAL", `Gagal mengirim paket: ${item.namaUkm}.\nLog: ${result.message}`, "error");
          setUploadProgress(prev => ({ ...prev, [item.id]: 0 }));
          hasError = true; break; 
        }
      }

      if (!hasError) {
        showAlert("PENGIRIMAN BERHASIL", `${finalLaporanList.length} File dokumentasi telah terkirim ke Server Utama.`, "success");
        setLaporans([]); setCurrentUkm(''); setCurrentFotos([]); setUkmError('');
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
    const isLate = checkKeterlambatan(tanggal);
    if (isLate) {
      showConfirm(
        "KETERLAMBATAN TERDETEKSI 🔴",
        "Laporan ini telah melewati Batas Waktu (Selasa 23:59).\nData akan ditandai 'Terlambat' di Server Utama.\n\nTetap lanjutkan pengiriman?",
        () => executeSubmission(finalLaporans)
      );
    } else executeSubmission(finalLaporans);
  };

  const checkKeterlambatan = (tanggalLaporan) => {
    if (!tanggalLaporan) return false;
    const deadline = new Date(tanggalLaporan);
    deadline.setDate(deadline.getDate() + 2); 
    deadline.setHours(0, 0, 0, 0);
    return new Date().getTime() > deadline.getTime();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tanggal) return showAlert("DATA TIDAK LENGKAP", "Parameter [Tanggal Laporan] wajib didefinisikan!");

    if (currentUkm || currentFotos.length > 0) {
      if (ukmError) return showAlert("KESALAHAN FORMAT", "Mohon perbaiki format Nama UKM.", "error");
      showConfirm("PAKET BELUM DISIMPAN", "Ada data di memori sementara yang belum masuk antrean.\nLakukan Simpan & Kirim Semua?", () => {
           const finalLaporans = [...laporans, { id: Date.now(), namaUkm: currentUkm || "Data Tanpa Nama", fotos: currentFotos }];
           setCurrentUkm(''); setCurrentFotos([]); setLaporans(finalLaporans);
           setTimeout(() => { processSubmission(finalLaporans); }, 400);
      }); return; 
    }
    if (laporans.length === 0) return showAlert("ANTREAN KOSONG", "Tidak ada data di dalam antrean pengiriman.");
    processSubmission(laporans);
  };

  // Tampilan Loading
  if (isAuthLoading) {
    return (
      <div className="tech-auth-container tech-bg" style={{color:'#00f0ff', fontSize:'14px', fontFamily:'monospace', letterSpacing:'1px'}}>
        MEMUAT KONEKSI AMAN...
      </div>
    );
  }

  // LAYAR 1: LOGIN PORTAL (TECH-NOIR)
  if (!user && auth) {
    return (
      <div className="tech-auth-container tech-bg">
        <div className="tech-auth-wrapper">
          <div className="tech-header">
            <img src={logoLmb} alt="LMB PENS Logo" className="tech-logo-img" />
            <h1 className="tech-title">UKM REPORT</h1>
            <p className="tech-subtitle">[ AKSES KHUSUS STAFF MEDFO ]</p>
          </div>
         <div className="tech-panel">
            <h2 className="tech-panel-title">SISTEM PELAPORAN</h2>
            
            {/* --- KOTAK TERMINAL BARU --- */}
            <div className="tech-panel-desc" style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px 15px', borderLeft: '3px solid var(--neon-cyan)', borderRadius: '6px', marginBottom: '24px', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
              <div style={{ color: 'var(--neon-green)', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>[ STATUS: TERENKRIPSI & AMAN ]</div>
              <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>&gt; Modul sinkronisasi arsip aktif.</div>
              <div style={{ color: 'var(--neon-red)' }}>&gt; Akses ketat: Hanya staf terotorisasi.</div>
            </div>
            {/* --------------------------- */}

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

  // LAYAR 2: LENGKAPI PROFIL STAF (TECH-NOIR)
  if (user && !isNameSet) {
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
            
            {/* --- KOTAK TERMINAL BARU --- */}
            <div className="tech-panel-desc" style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px 15px', borderLeft: '3px solid var(--neon-cyan)', borderRadius: '6px', marginBottom: '24px', fontSize: '11px', fontFamily: 'var(--font-tech)' }}>
              <div style={{ color: 'var(--neon-cyan)', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>[ OTENTIKASI TAHAP 1: OK ]</div>
              <div style={{ color: 'var(--text-dim)' }}>&gt; Tetapkan identitas operasional untuk label penanggung jawab data.</div>
            </div>
            {/* --------------------------- */}

            <div className="tech-input-container">
              <span className="tech-input-icon">👤</span>
              <input 
                type="text" 
                placeholder="PANGGILAN / RESMI (Wajib)" 
                className="tech-input"
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
              />
            </div>
            <button onClick={handleSaveName} className="tech-btn-action">
              SIMPAN & OTORISASI PELAPORAN 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LAYAR 3: FORM UTAMA (FULL TECH-NOIR)
  return (
    <div className="app-wrapper tech-bg">
      <div className="form-card">
        {user && (
          <div className="user-header">
            <div className="user-info">
              <img src={user.photoURL || 'https://via.placeholder.com/36'} alt="Profile" className="user-avatar" />
              <div className="user-text">
                <span className="user-name">{penanggungJawab}</span>
                <span className="user-email">SESI AKTIF: {user.email}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">[ KELUAR ]</button>
          </div>
        )}

        <h2 className="form-title">FORMULIR PELAPORAN</h2>
        {openDropdown && <div className="custom-select-overlay" onClick={() => setOpenDropdown(null)}></div>}

        <div className="section-heading"><span>1</span> PARAMETER UTAMA</div>
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
                  <span>[M]</span> <span>{bulanOptions.find(b => b.value === selectedBulan)?.label || '-- Pilih Bulan --'}</span>
                </div>
                <span className="chevron-icon">▼</span>
              </div>
              {openDropdown === 'month' && (
                <div className="custom-select-dropdown">
                  {bulanOptions.map((b, idx) => (
                    <div key={idx} className={`custom-select-item ${selectedBulan === b.value ? 'selected' : ''}`} onClick={() => { setSelectedBulan(b.value); setOpenDropdown(null); }}>
                      <span style={{ fontSize: '14px', opacity: selectedBulan === b.value ? 1 : 0.5 }}>{'>'}</span><span>{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Pilih Tanggal (Senin):</label>
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
                        <span>[D]</span> 
                        <span>
                          {availableDates.find(d => d.value === tanggal)?.label || tanggal} 
                          {hasReport && <span style={{ marginLeft: '8px', color: '#39ff14' }}>[Terisi]</span>}
                        </span>
                      </>
                    );
                  })() : (
                    <span className="custom-select-placeholder">-- Menunggu Input --</span>
                  )}
                </div>
                <span className="chevron-icon">▼</span>
              </div>
              
              {openDropdown === 'date' && (
                <div className="custom-select-dropdown">
                  {availableDates.length > 0 ? availableDates.map((dateObj, idx) => {
                    const hasReport = historyData.some(h => h.tanggal === dateObj.value);
                    return (
                    <div key={idx} className={`custom-select-item ${tanggal === dateObj.value ? 'selected' : ''}`} onClick={() => { setTanggal(dateObj.value); setOpenDropdown(null); }}>
                      <span style={{ fontSize: '14px', opacity: tanggal === dateObj.value ? 1 : 0.5 }}>{'>'}</span>
                      <span>
                        {dateObj.label} 
                        {hasReport && <span style={{ marginLeft: '8px', color: '#39ff14' }}>[Terisi]</span>}
                      </span>
                    </div>
                  )}) : (
                    <div className="custom-select-item" style={{justifyContent: 'center', color: '#4b5563', cursor: 'default'}}>TIDAK ADA DATA</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'rgba(0,240,255,0.05)', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.2)', textAlign: 'center', fontFamily: 'var(--font-tech)' }}>
            {!tanggal ? (
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>PILIH TANGGAL</span>
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

        <div className="section-heading"><span>2</span> ENTRI DATA</div>
        <div className="active-form-section">
          <div className="input-group">
            <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Nama UKM:</label>
            <input 
              type="text" value={currentUkm} onChange={handleUkmChange} className="form-input" placeholder="Cth: UKM Tari" disabled={isLoading} 
              style={{ height: '52px', boxSizing: 'border-box', borderColor: ukmError ? 'var(--neon-red)' : undefined, outlineColor: ukmError ? 'var(--neon-red)' : undefined, backgroundColor: ukmError ? 'rgba(255,0,60,0.1)' : undefined }}
            />
            {ukmError && (
              <div style={{ color: 'var(--neon-red)', backgroundColor: 'rgba(255,0,60,0.1)', border: '1px solid var(--neon-red)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', marginTop: '6px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'var(--font-tech)' }}>
                <span>[ERROR]</span><span>{ukmError}</span>
              </div>
            )}
          </div>
          
          <div className="input-group">
            <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>Lampiran File (Maks: 3):</label>
            {currentFotos.length < 3 && (
              <label className="file-dropzone" style={{opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto'}}>
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
                      <div className="file-chip-info">
                        <img src={previewUrl} alt="preview" className="file-chip-thumbnail" />
                        <span className="file-chip-name">{foto.name}</span>
                      </div>
                      <button type="button" onClick={() => removeCurrentFoto(index)} className="file-chip-remove" disabled={isLoading}>X</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button type="button" onClick={addToDraft} className="btn-add-draft" disabled={isLoading}>+ MASUKKAN KE ANTREAN</button>
        </div>

        <div className="section-heading"><span>3</span> ANTREAN PENGIRIMAN ({laporans.length})</div>
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
                    <span className="draft-subtitle">Lampiran: {laporan.fotos.length} file foto</span>
                    {isProcessing && (
                      <div className="progress-container">
                        <span className={`draft-status-text ${isSuccess ? 'success' : ''}`}>
                          {isSuccess ? '[ SELESAI ] Data Terkirim' : currentProgress > 50 ? `> MENGUNGGAH DATA (${currentProgress}%)` : `> MEMADATKAN FILE (${currentProgress}%)`}
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
          {isLoading ? 'MENGIRIMKAN...' : `JALANKAN PENGUNGGAHAN (${laporans.length})`}
        </button>
      </div>

      {modal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
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
    </div>
  );
}

export default App;