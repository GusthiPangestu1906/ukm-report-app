import React, { useState } from 'react';
import './App.css';

function App() {
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [tanggal, setTanggal] = useState('');
  
  const [laporans, setLaporans] = useState([]);
  
  const [currentUkm, setCurrentUkm] = useState('');
  const [currentFotos, setCurrentFotos] = useState([]);
  
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [processingId, setProcessingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  // --- STATE CUSTOM MODAL ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning', // warning | success | error | confirm
    onConfirm: null,
    onCancel: null
  });

  const scriptURL = 'https://script.google.com/macros/s/AKfycbz1QI1qt1EU_KDwFbhOL9KiDjNLIKAifA3bKSFJwQKuPEhz0W5kX_bDepq-QlT7e2VZ/exec';

  // --- FUNGSI BANTUAN UNTUK MEMANGGIL MODAL ---
  const showAlert = (title, message, type = 'warning') => {
    setModal({
      isOpen: true, title, message, type,
      onConfirm: closeModal,
      onCancel: null
    });
  };

  const showConfirm = (title, message, onConfirmCallback) => {
    setModal({
      isOpen: true, title, message, type: 'confirm',
      onConfirm: () => {
        onConfirmCallback();
        closeModal();
      },
      onCancel: closeModal
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleUkmChange = (e) => {
    const value = e.target.value;
    if (value.includes(',')) {
      showAlert("Peringatan Validasi", "Mohon masukkan 1 nama UKM saja.\nTidak boleh menggunakan tanda koma (,).");
    }
    setCurrentUkm(value.replace(/,/g, ''));
  };

  const handleFileChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const newFiles = Array.from(event.target.files);
    
    if (currentFotos.length + newFiles.length > 3) {
      showAlert("Batas Kuota", "Maksimal hanya 3 foto dokumentasi per entri UKM!");
      event.target.value = ''; 
      return;
    }
    
    setCurrentFotos([...currentFotos, ...newFiles]);
    event.target.value = ''; 
  };

  const removeCurrentFoto = (fotoIndex) => {
    setCurrentFotos(currentFotos.filter((_, i) => i !== fotoIndex));
  };

  const addToDraft = () => {
    if (!currentUkm.trim()) {
      showAlert("Data Belum Lengkap", "Kolom 'Nama UKM' wajib diisi!");
      return;
    }
    if (currentFotos.length === 0) {
      showAlert("Data Belum Lengkap", "Pilih minimal 1 foto hasil dokumentasi!");
      return;
    }

    setLaporans([...laporans, { 
      id: Date.now(), 
      namaUkm: currentUkm, 
      fotos: currentFotos 
    }]);

    setCurrentUkm('');
    setCurrentFotos([]);
  };

  const removeDraft = (id) => {
    setLaporans(laporans.filter(l => l.id !== id));
  };

  const compressImage = (file, maxWidth = 1280, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height *= maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = Math.round((width *= maxWidth / height));
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const base64String = canvas.toDataURL('image/jpeg', quality);
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processAllFiles = async (laporanListToProcess) => {
    const results = [];
    
    for (let i = 0; i < laporanListToProcess.length; i++) {
      const item = laporanListToProcess[i];
      setProcessingId(item.id);
      
      setUploadProgress(prev => ({ ...prev, [item.id]: 10 }));
      await new Promise(resolve => setTimeout(resolve, 50)); 

      const amanUkmName = item.namaUkm.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      const processedFotos = [];

      for (let f = 0; f < item.fotos.length; f++) {
         const foto = item.fotos[f];
         const compressedBase64 = await compressImage(foto);
         
         processedFotos.push({
            fileName: `${amanUkmName} - Foto ${f + 1}.jpg`,
            mimeType: 'image/jpeg',
            fileBase64: compressedBase64
         });
         
         const progressVal = 10 + Math.floor(((f + 1) / item.fotos.length) * 40);
         setUploadProgress(prev => ({ ...prev, [item.id]: progressVal }));
      }
      results.push({ namaUkm: item.namaUkm, files: processedFotos });
    }
    
    setProcessingId('sending');
    return results;
  };

  // Fungsi Inti untuk mengirim data
  const executeSubmission = async (finalLaporanList) => {
    let progressInterval;
    try {
      setIsLoading(true);

      const laporanListProcessed = await processAllFiles(finalLaporanList);

      setStatus(`Mengirim ${finalLaporanList.length} data ke server... Mohon tunggu.`);

      progressInterval = setInterval(() => {
         setUploadProgress(prev => {
            const nextProgress = { ...prev };
            let allHit90 = true;
            finalLaporanList.forEach(l => {
               if (!nextProgress[l.id]) nextProgress[l.id] = 50;
               if (nextProgress[l.id] < 90) {
                  nextProgress[l.id] += Math.floor(Math.random() * 5) + 1;
                  allHit90 = false;
               }
            });
            if (allHit90) clearInterval(progressInterval);
            return nextProgress;
         });
      }, 500);

      const payload = { penanggungJawab, tanggal, laporanList: laporanListProcessed };
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      clearInterval(progressInterval);

      if (result.status === "success") {
        const finalProgress = {};
        finalLaporanList.forEach(l => finalProgress[l.id] = 100);
        setUploadProgress(finalProgress);

        await new Promise(res => setTimeout(res, 600));

        // Menggunakan Custom Modal Sukses
        showAlert(
          "🎉 BERHASIL!", 
          `${finalLaporanList.length} data laporan UKM telah sukses dikirim ke Google Drive dan direkap di Spreadsheet.`, 
          "success"
        );
        
        setStatus(`Mantap! ${result.message}`);
        setLaporans([]);
        setPenanggungJawab('');
        setTanggal('');
        setCurrentUkm('');
        setCurrentFotos([]);
        setProcessingId(null);
        setUploadProgress({});
        
        setTimeout(() => setStatus(''), 5000);
      } else {
        showAlert("Pengiriman Gagal", result.message, "error");
        setStatus(`Gagal: ${result.message}`);
        setProcessingId(null);
      }
    } catch (error) {
      showAlert("Terjadi Kesalahan Server", "Gagal memproses data atau koneksi terputus. Pastikan internetmu stabil.", "error");
      setStatus("Gagal memproses data.");
      setProcessingId(null);
      clearInterval(progressInterval);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Pengecekan Awal sebelum mengirim
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!penanggungJawab || !tanggal) {
      return showAlert("Informasi Belum Lengkap", "Kolom Penanggung Jawab dan Tanggal wajib diisi di bagian paling atas!");
    }
    
    // Jika ada form yang sedang diketik tapi lupa ditekan tombol simpan
    if (currentUkm || currentFotos.length > 0) {
      showConfirm(
        "Data Belum Disimpan", 
        "Ada data UKM yang sedang kamu ketik tapi belum disimpan ke antrean.\n\nKlik 'Simpan & Kirim' untuk otomatis menyimpannya lalu mengirim semuanya ke server.",
        () => {
           // Jalankan logika penyimpanan secara langsung, lalu kirim
           const newDraft = { id: Date.now(), namaUkm: currentUkm || "Data Tanpa Nama", fotos: currentFotos };
           const finalLaporans = [...laporans, newDraft];
           setCurrentUkm('');
           setCurrentFotos([]);
           setLaporans(finalLaporans);
           // Lanjutkan ke eksekusi pengiriman
           executeSubmission(finalLaporans);
        }
      );
      return; 
    }

    if (laporans.length === 0) {
      return showAlert("Antrean Kosong", "Belum ada data di Daftar Antrean. Ketik nama UKM dan pilih fotonya terlebih dahulu.");
    }

    // Jika semua pengecekan aman, jalankan pengiriman
    executeSubmission(laporans);
  };

  return (
    <div className="app-wrapper">
      <div className="form-card">
        <h2 className="form-title">Form UKM Report</h2>
        
        <div className="section-heading"><span>1</span> Informasi Umum</div>
        <div className="global-section">
          <div className="input-group">
            <label className="form-label">Nama Penanggung Jawab:</label>
            <input type="text" value={penanggungJawab} onChange={(e) => setPenanggungJawab(e.target.value)} className="form-input" placeholder="Cth: Budi Santoso" disabled={isLoading} />
          </div>
          <div className="input-group">
            <label className="form-label">Tanggal Laporan:</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} className="form-input" disabled={isLoading} />
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
              placeholder="Cth: UKM Sepak Bola (Jangan pakai tanda koma)"
              disabled={isLoading}
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
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="file-chip-name" title="Klik untuk cek foto full">{foto.name}</a>
                      </div>
                      <button type="button" onClick={() => removeCurrentFoto(index)} className="file-chip-remove" title="Hapus foto ini" disabled={isLoading}>✕</button>
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
                <div 
                  className={`draft-item ${isProcessing ? 'processing' : ''}`} 
                  key={laporan.id}
                >
                  <div className="draft-info">
                    <span className="draft-title">{index + 1}. {laporan.namaUkm}</span>
                    <span className="draft-subtitle">Terlampir {laporan.fotos.length} file dokumentasi</span>
                    
                    {/* UI PROGRESS BAR */}
                    {isProcessing && (
                      <div className="progress-container">
                        <span className={`draft-status-text ${isSuccess ? 'success' : ''}`}>
                          {isSuccess ? '✓ Berhasil terkirim' : 
                           currentProgress > 50 ? `⏳ Mengunggah ke server... (${currentProgress}%)` : 
                           `⏳ Mengemas file... (${currentProgress}%)`}
                        </span>
                        <div className="progress-bar-bg">
                          <div 
                            className={`progress-bar-fill ${isSuccess ? 'success' : ''}`}
                            style={{ width: `${currentProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => removeDraft(laporan.id)} 
                    className="btn-delete-draft" 
                    title="Hapus dari antrean"
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {status && (
          <div className={`status-message ${status.includes('Mantap') ? 'success' : 'error'}`}>
            {status}
          </div>
        )}

        <button type="button" onClick={handleSubmit} disabled={isLoading || laporans.length === 0} className="submit-button">
          {isLoading ? 'Sedang Memproses...' : `Kirim ${laporans.length} Data Sekaligus 🚀`}
        </button>
      </div>

      {/* --- KOMPONEN CUSTOM MODAL --- */}
      {modal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className={`modal-icon ${modal.type}`}>
              {modal.type === 'warning' && '⚠️'}
              {modal.type === 'success' && '✅'}
              {modal.type === 'error' && '❌'}
              {modal.type === 'confirm' && '❓'}
            </div>
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-message">{modal.message}</p>
            <div className="modal-actions">
              {modal.type === 'confirm' && (
                <button onClick={modal.onCancel} className="modal-btn secondary">Batal</button>
              )}
              <button onClick={modal.onConfirm} className="modal-btn primary">
                {modal.type === 'confirm' ? 'Simpan & Kirim' : 'Mengerti'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;