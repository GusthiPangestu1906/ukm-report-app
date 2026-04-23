import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';

// KUNCI RAHASIA FIREBASE MEDFO
const firebaseConfig = {
  apiKey: "AIzaSyDGbcjk4lmZg3OU9h65aSifBE8VGF5hwUc",
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
      if (error.code !== 'auth/popup-closed-by-user') {
        alert("Gagal Login: " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
  };

  const getValidMondays = () => {
    const mondays = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 1) { 
        const isPast = date.setHours(0,0,0,0) < now.setHours(0,0,0,0);
        if (!isPast) {
           const d = String(date.getDate()).padStart(2, '0');
           const m = String(date.getMonth() + 1).padStart(2, '0');
           mondays.push({ value: `${date.getFullYear()}-${m}-${d}`, label: `Senin, ${d}/${m}/${date.getFullYear()}` });
        }
      }
      date.setDate(date.getDate() + 1);
    }
    if (mondays.length === 0) {
       const nextMonthDate = new Date(year, month + 1, 1);
       while (nextMonthDate.getDay() !== 1) nextMonthDate.setDate(nextMonthDate.getDate() + 1);
       const d = String(nextMonthDate.getDate()).padStart(2, '0');
       const m = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
       mondays.push({ value: `${nextMonthDate.getFullYear()}-${m}-${d}`, label: `Senin, ${d}/${m}/${nextMonthDate.getFullYear()}` });
    }
    return mondays;
  };

  const [availableDates, setAvailableDates] = useState([]);
  useEffect(() => { setAvailableDates(getValidMondays()); }, []);

  // State untuk Data Form
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null); // Untuk Dropdown Tanggal
  
  const [tanggal, setTanggal] = useState('');
  const [laporans, setLaporans] = useState([]);
  const [currentUkm, setCurrentUkm] = useState('');
  const [currentFotos, setCurrentFotos] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null, onCancel: null });
  const scriptURL = 'https://script.google.com/macros/s/AKfycbz1QI1qt1EU_KDwFbhOL9KiDjNLIKAifA3bKSFJwQKuPEhz0W5kX_bDepq-QlT7e2VZ/exec';

  const showAlert = (title, message, type = 'warning') => setModal({ isOpen: true, title, message, type, onConfirm: closeModal });
  const showConfirm = (title, message, onConfirmCallback) => setModal({ isOpen: true, title, message, type: 'confirm', onConfirm: () => { onConfirmCallback(); closeModal(); }, onCancel: closeModal });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  // Regex untuk input nama (menolak angka)
  const handleNameChange = (e) => {
    const value = e.target.value.replace(/[0-9]/g, ''); // Menghapus semua karakter angka
    setPenanggungJawab(value);
  };

  const handleUkmChange = (e) => {
    const value = e.target.value;
    if (value.includes(',')) showAlert("Peringatan Validasi", "Mohon masukkan 1 nama UKM saja.\nTidak boleh menggunakan tanda koma (,).");
    setCurrentUkm(value.replace(/,/g, ''));
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
    if (!currentUkm.trim()) return showAlert("Data Belum Lengkap", "Kolom 'Nama UKM' wajib diisi!");
    if (currentFotos.length === 0) return showAlert("Data Belum Lengkap", "Pilih minimal 1 foto hasil dokumentasi!");
    const isDuplicate = laporans.some(laporan => laporan.namaUkm.toLowerCase() === currentUkm.trim().toLowerCase());
    if (isDuplicate) return showAlert("Duplikat Terdeteksi", `UKM "${currentUkm.trim()}" sudah ada di dalam antrean.`, "error");

    setLaporans([...laporans, { id: Date.now(), namaUkm: currentUkm, fotos: currentFotos }]);
    setCurrentUkm(''); setCurrentFotos([]);
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

  const processAllFiles = async (laporanListToProcess) => {
    const results = [];
    for (let i = 0; i < laporanListToProcess.length; i++) {
      const item = laporanListToProcess[i];
      setProcessingId(item.id); setUploadProgress(prev => ({ ...prev, [item.id]: 10 }));
      await new Promise(resolve => setTimeout(resolve, 50)); 
      const amanUkmName = item.namaUkm.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      const processedFotos = [];
      for (let f = 0; f < item.fotos.length; f++) {
         const compressedBase64 = await compressImage(item.fotos[f]);
         processedFotos.push({ fileName: `${amanUkmName} - Foto ${f + 1}.jpg`, mimeType: 'image/jpeg', fileBase64: compressedBase64 });
         setUploadProgress(prev => ({ ...prev, [item.id]: 10 + Math.floor(((f + 1) / item.fotos.length) * 40) }));
      }
      results.push({ namaUkm: item.namaUkm, files: processedFotos });
    }
    setProcessingId('sending'); return results;
  };

  const executeSubmission = async (finalLaporanList) => {
    let progressInterval;
    try {
      setIsLoading(true);
      const laporanListProcessed = await processAllFiles(finalLaporanList);
      setStatus(`Mengirim ${finalLaporanList.length} data ke server...`);

      progressInterval = setInterval(() => {
         setUploadProgress(prev => {
            const nextProgress = { ...prev }; let allHit90 = true;
            finalLaporanList.forEach(l => {
               if (!nextProgress[l.id]) nextProgress[l.id] = 50;
               if (nextProgress[l.id] < 90) { nextProgress[l.id] += Math.floor(Math.random() * 5) + 1; allHit90 = false; }
            });
            if (allHit90) clearInterval(progressInterval);
            return nextProgress;
         });
      }, 500);

      const payload = { penanggungJawab, tanggal, laporanList: laporanListProcessed, userEmail: user?.email || "Unknown" };
      const response = await fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) });
      const result = await response.json();

      clearInterval(progressInterval);

      if (result.status === "success") {
        const finalProgress = {}; finalLaporanList.forEach(l => finalProgress[l.id] = 100);
        setUploadProgress(finalProgress); await new Promise(res => setTimeout(res, 600));

        showAlert("🎉 BERHASIL!", `${finalLaporanList.length} data laporan UKM telah sukses dikirim.`, "success");
        setStatus(`Mantap! ${result.message}`); setLaporans([]); setPenanggungJawab(''); setTanggal(''); setCurrentUkm(''); setCurrentFotos([]); setProcessingId(null); setUploadProgress({});
        setTimeout(() => setStatus(''), 5000);
      } else {
        showAlert("Pengiriman Gagal", result.message, "error"); setStatus(`Gagal: ${result.message}`); setProcessingId(null);
      }
    } catch (error) {
      showAlert("Terjadi Kesalahan Server", "Gagal memproses data atau koneksi terputus.", "error"); setStatus("Gagal memproses data."); setProcessingId(null); clearInterval(progressInterval);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!penanggungJawab.trim() || !tanggal) return showAlert("Informasi Belum Lengkap", "Kolom Penanggung Jawab dan Tanggal wajib diisi!");

    if (currentUkm || currentFotos.length > 0) {
      showConfirm("Data Belum Disimpan", "Ada data UKM yang sedang diketik tapi belum disimpan ke antrean.\n\nKlik 'Simpan & Kirim' untuk otomatis menyimpannya lalu mengirim semuanya.", () => {
           const newDraft = { id: Date.now(), namaUkm: currentUkm || "Data Tanpa Nama", fotos: currentFotos };
           const finalLaporans = [...laporans, newDraft];
           setCurrentUkm(''); setCurrentFotos([]); setLaporans(finalLaporans); executeSubmission(finalLaporans);
      }); return; 
    }
    if (laporans.length === 0) return showAlert("Antrean Kosong", "Belum ada data di Daftar Antrean.");
    executeSubmission(laporans);
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
                <span className="user-email">{user.email}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">Keluar</button>
          </div>
        )}

        <h2 className="form-title">Form UKM Report</h2>
        
        {/* Latar Belakang Transparan untuk menutup dropdown custom tanggal */}
        {openDropdown && <div className="custom-select-overlay" onClick={() => setOpenDropdown(null)}></div>}

        <div className="section-heading"><span>1</span> Informasi Umum</div>
        <div className="global-section">
          
          {/* INPUT BEBAS NAMA (HANYA HURUF) */}
          <div className="input-group">
            <label className="form-label">Nama Penanggung Jawab (Staff Medfo):</label>
            <input 
              type="text" 
              value={penanggungJawab} 
              onChange={handleNameChange} 
              className="form-input" 
              placeholder="Cth: Mila" 
              disabled={isLoading} 
              style={{ height: '52px', boxSizing: 'border-box' }}
            />
          </div>

          {/* CUSTOM UI: DROPDOWN TANGGAL */}
          <div className="input-group">
            <label className="form-label">Tanggal Laporan:</label>
            <div className="custom-select-wrapper">
              <div 
                className={`custom-select-trigger ${openDropdown === 'date' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                onClick={() => !isLoading && setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                style={{ height: '52px', boxSizing: 'border-box' }}
              >
                <div className="custom-select-value">
                  {tanggal ? (
                    <><span>📅</span> <span>{availableDates.find(d => d.value === tanggal)?.label || tanggal}</span></>
                  ) : (
                    <span className="custom-select-placeholder">-- Pilih Hari Senin --</span>
                  )}
                </div>
                <span className="chevron-icon">▼</span>
              </div>

              {openDropdown === 'date' && (
                <div className="custom-select-dropdown">
                  {availableDates.map((dateObj, idx) => (
                    <div 
                      key={idx} 
                      className={`custom-select-item ${tanggal === dateObj.value ? 'selected' : ''}`}
                      onClick={() => { setTanggal(dateObj.value); setOpenDropdown(null); }}
                    >
                      <span style={{ fontSize: '18px', opacity: tanggal === dateObj.value ? 1 : 0.7 }}>📅</span>
                      <span>{dateObj.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="section-heading"><span>2</span> Tambah Data Baru</div>
        <div className="active-form-section">
          <div className="input-group">
            <label className="form-label">Nama UKM:</label>
            <input 
              type="text" 
              value={currentUkm} 
              onChange={handleUkmChange} 
              className="form-input" 
              placeholder="Cth: UKM Sepak Bola" 
              disabled={isLoading} 
              style={{ height: '52px', boxSizing: 'border-box' }}
            />
          </div>
          
          <div className="input-group">
            <label className="form-label">Hasil Dokumentasi (Maks 3):</label>
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