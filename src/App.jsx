import React, { useState } from 'react';
import './App.css'; // Mengimpor file CSS yang terpisah

function App() {
  // 1. State Global (Info Umum)
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [tanggal, setTanggal] = useState('');
  
  // 2. State Antrean (Keranjang Laporan yang siap dikirim)
  const [laporans, setLaporans] = useState([]);
  
  // 3. State Form Aktif (Yang sedang diisi user saat ini)
  const [currentUkm, setCurrentUkm] = useState('');
  const [currentFotos, setCurrentFotos] = useState([]);
  
  // 4. State Sistem
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scriptURL = 'https://script.google.com/macros/s/AKfycbz1QI1qt1EU_KDwFbhOL9KiDjNLIKAifA3bKSFJwQKuPEhz0W5kX_bDepq-QlT7e2VZ/exec';

  // --- FUNGSI UNTUK FORM AKTIF ---
  const handleFileChange = (event) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const newFiles = Array.from(event.target.files);
    
    if (currentFotos.length + newFiles.length > 3) {
      alert("Maksimal hanya 3 foto per entri ya!");
      event.target.value = ''; 
      return;
    }
    
    setCurrentFotos([...currentFotos, ...newFiles]);
    event.target.value = ''; 
  };

  const removeCurrentFoto = (fotoIndex) => {
    setCurrentFotos(currentFotos.filter((_, i) => i !== fotoIndex));
  };

  // --- FUNGSI DRAFTING (Memasukkan form aktif ke Antrean) ---
  const addToDraft = () => {
    if (!currentUkm.trim()) {
      alert("Nama UKM belum diisi!");
      return;
    }
    if (currentFotos.length === 0) {
      alert("Pilih minimal 1 foto dokumentasi!");
      return;
    }

    // Masukkan ke array antrean
    setLaporans([...laporans, { 
      id: Date.now(), 
      namaUkm: currentUkm, 
      fotos: currentFotos 
    }]);

    // Kosongkan form aktif agar siap untuk UKM berikutnya
    setCurrentUkm('');
    setCurrentFotos([]);
  };

  const removeDraft = (id) => {
    setLaporans(laporans.filter(l => l.id !== id));
  };

  // --- FUNGSI PENGIRIMAN DATA ---
  const processAllFiles = async () => {
    return Promise.all(laporans.map(async (item, tabIndex) => {
      const amanUkmName = item.namaUkm.replace(/[^a-zA-Z0-9 ]/g, "").trim();

      const processedFotos = await Promise.all(item.fotos.map((foto, fotoIndex) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const extension = foto.name.split('.').pop() || 'jpg';
            const customFileName = `${amanUkmName} - Foto ${fotoIndex + 1}.${extension}`;

            resolve({
              fileName: customFileName,
              mimeType: foto.type,
              fileBase64: reader.result.split(',')[1]
            });
          };
          reader.onerror = error => reject(error);
          reader.readAsDataURL(foto);
        });
      }));

      return { namaUkm: item.namaUkm, files: processedFotos };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi pencegahan error
    if (!penanggungJawab || !tanggal) return alert("Penanggung Jawab dan Tanggal wajib diisi di bagian atas!");
    
    // Jika user lupa klik "Simpan ke Daftar" pada form yang sedang ia isi
    if (currentUkm || currentFotos.length > 0) {
      const confirmAdd = window.confirm("Ada data UKM yang sedang kamu ketik tapi belum disimpan ke daftar antrean. Mau disimpan sekalian?");
      if (confirmAdd) {
        addToDraft();
        return; // Hentikan submit sementara agar sistem menyelesaikan update state list
      }
    }

    if (laporans.length === 0) return alert("Belum ada data di Daftar Antrean. Ketik nama UKM, masukkan foto, lalu klik '+ Simpan ke Daftar Laporan' terlebih dahulu!");

    try {
      setIsLoading(true);
      setStatus(`Sedang mengemas dan mengirim ${laporans.length} data laporan...`);

      const laporanListProcessed = await processAllFiles();
      const payload = { penanggungJawab, tanggal, laporanList: laporanListProcessed };

      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.status === "success") {
        setStatus(`Mantap! ${result.message}`);
        // Reset Total
        setLaporans([]);
        setPenanggungJawab('');
        setTanggal('');
        setCurrentUkm('');
        setCurrentFotos([]);
        
        setTimeout(() => setStatus(''), 5000);
      } else {
        setStatus(`Gagal: ${result.message}`);
      }
    } catch (error) {
      alert(error);
      setStatus("Gagal memproses data atau koneksi terputus.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="form-card">
        <h2 className="form-title">Form UKM Report</h2>
        
        <div className="section-heading">
          <span>1</span> Informasi Umum
        </div>
        <div className="global-section">
          <div className="input-group">
            <label className="form-label">Nama Penanggung Jawab:</label>
            <input type="text" value={penanggungJawab} onChange={(e) => setPenanggungJawab(e.target.value)} className="form-input" placeholder="Cth: Budi Santoso" />
          </div>
          
          <div className="input-group">
            <label className="form-label">Tanggal Laporan:</label>
            <input 
              type="date" 
              value={tanggal} 
              onChange={(e) => setTanggal(e.target.value)} 
              onClick={(e) => {
                try { e.target.showPicker(); } catch (err) {}
              }}
              className="form-input" 
            />
          </div>
        </div>

        <div className="section-heading">
          <span>2</span> Tambah Data Baru
        </div>
        
        {/* KOTAK INPUT AKTIF (Hanya 1 ini saja yang mengisi layar) */}
        <div className="active-form-section">
          <div className="input-group">
            <label className="form-label">Nama UKM:</label>
            <input
              type="text"
              value={currentUkm}
              onChange={(e) => setCurrentUkm(e.target.value)}
              className="form-input"
              placeholder="Cth: UKM Sepak Bola, UKM Musik"
            />
          </div>
          
          <div className="input-group">
            <label className="form-label">Hasil Dokumentasi (Maks 3):</label>
            
            {currentFotos.length < 3 && (
              <label className="file-dropzone">
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg, image/webp"
                  multiple 
                  onChange={handleFileChange}
                  className="hidden-input"
                />
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
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="file-chip-name" title="Klik untuk cek foto full">
                          {foto.name}
                        </a>
                      </div>
                      <button type="button" onClick={() => removeCurrentFoto(index)} className="file-chip-remove" title="Hapus foto ini">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button type="button" onClick={addToDraft} className="btn-add-draft">
            + Simpan ke Daftar Laporan
          </button>
        </div>

        <div className="section-heading">
          <span>3</span> Daftar Antrean ({laporans.length})
        </div>

        {/* DAFTAR DRAFT YANG RINGKAS */}
        <div className="draft-list-section">
          {laporans.length === 0 ? (
            <div className="empty-draft">Belum ada data UKM yang ditambahkan ke antrean.</div>
          ) : (
            laporans.map((laporan, index) => (
              <div className="draft-item" key={laporan.id}>
                <div className="draft-info">
                  <span className="draft-title">{index + 1}. {laporan.namaUkm}</span>
                  <span className="draft-subtitle">Terlampir {laporan.fotos.length} file dokumentasi</span>
                </div>
                <button type="button" onClick={() => removeDraft(laporan.id)} className="btn-delete-draft" title="Hapus dari antrean">✕</button>
              </div>
            ))
          )}
        </div>

        {status && (
          <div className={`status-message ${status.includes('Mantap') ? 'success' : 'error'}`}>
            {status}
          </div>
        )}

        <button type="button" onClick={handleSubmit} disabled={isLoading || laporans.length === 0} className="submit-button">
          {isLoading ? 'Memproses...' : `Kirim ${laporans.length} Data Sekaligus 🚀`}
        </button>
      </div>
    </div>
  );
}

export default App;