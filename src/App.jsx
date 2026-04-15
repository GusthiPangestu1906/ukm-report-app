import React, { useState } from 'react';

// --- CSS STYLE TERINTEGRASI DENGAN PENERAPAN LAW OF UX ---
const themeStyles = `
  :root {
    --bg-wrapper: #f8fafc;
    --bg-card: #ffffff;
    --text-title: #1e3a8a; /* Biru lebih gelap untuk kontras membaca (Jakob's Law) */
    --bg-global: #f1f5f9;
    --text-label: #334155;
    --border-input: #cbd5e1;
    --bg-input: #ffffff;
    --text-input: #0f172a;
    --focus-ring: rgba(30, 58, 138, 0.15);
    --tab-border: #cbd5e1;
    --tab-bg: #ffffff;
    --tab-text: #64748b;
    --tab-active-bg: #1e3a8a;
    --tab-active-shadow: rgba(30, 58, 138, 0.25);
    --bg-dynamic: #f8fafc;
    --btn-submit: #1e3a8a;
    --btn-submit-hover: #172554;
    --btn-submit-shadow: rgba(30, 58, 138, 0.3);
    --card-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    --add-btn-border: #1e3a8a;
    --add-btn-text: #1e3a8a;
    --delete-bg: rgba(239, 68, 68, 0.15);
  }

  html, body, #root {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-height: 100vh !important;
    background-color: var(--bg-wrapper) !important;
    color: var(--text-input) !important;
  }

  .app-wrapper {
    background-color: var(--bg-wrapper);
    min-height: 100vh;
    width: 100%;
    padding: 40px 20px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .form-card {
    width: 100%;
    max-width: 650px;
    background-color: var(--bg-card);
    padding: 40px;
    border-radius: 20px;
    box-shadow: var(--card-shadow);
  }

  .form-title {
    text-align: center;
    color: var(--text-title);
    margin-top: 0;
    margin-bottom: 35px;
    font-size: 26px;
    font-weight: 800;
  }

  /* MILLER'S & HICK'S LAW: Chunking & Langkah Jelas */
  .section-heading {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-title);
    margin-bottom: 12px;
    margin-left: 5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .section-heading span {
    background-color: var(--text-title);
    color: white;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 13px;
  }

  .global-section {
    background-color: var(--bg-global);
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 35px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    border: 1px solid var(--border-input);
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-label {
    font-weight: 600;
    color: var(--text-label);
    font-size: 14px;
  }

  /* FITTS'S LAW: Ukuran Input Diperbesar (Touch Target Lebih Baik) */
  .form-input {
    width: 100%;
    padding: 14px 18px; /* Diperbesar agar mudah di tap */
    border: 1.5px solid var(--border-input);
    border-radius: 12px;
    background-color: var(--bg-input);
    font-size: 15px;
    transition: all 0.2s ease;
    box-sizing: border-box;
    color: var(--text-input);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--text-title);
    box-shadow: 0 0 0 4px var(--focus-ring);
  }

  /* --- PERBAIKAN KHUSUS UNTUK INPUT TANGGAL (DATE PICKER) --- */
  .form-input[type="date"] {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    cursor: pointer; /* Memberikan indikasi bahwa ini bisa diklik seluruh areanya */
    position: relative;
  }

  /* Memperbesar target klik pada ikon kalender bawaan browser */
  .form-input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    padding: 5px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  
  .form-input[type="date"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }

  .form-input[type="file"] {
    padding: 10px 16px;
    cursor: pointer;
  }
  
  /* JAKOB'S LAW: Desain tombol upload standar dan mudah dikenali */
  .form-input[type="file"]::file-selector-button {
    background-color: var(--bg-global);
    color: var(--text-label);
    border: 1px solid var(--border-input);
    padding: 8px 16px;
    border-radius: 8px;
    margin-right: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .form-input[type="file"]::file-selector-button:hover {
    background-color: #e2e8f0;
  }

  .tab-container {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  /* FITTS'S LAW: Tombol Tab Lebih Lebar */
  .tab-button {
    padding: 12px 20px; /* Target klik diperbesar */
    border-radius: 30px;
    border: 1.5px solid var(--tab-border);
    background-color: var(--tab-bg);
    color: var(--tab-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .tab-button:hover {
    border-color: var(--text-label);
  }

  .tab-button.active {
    background-color: var(--tab-active-bg);
    color: #ffffff;
    border-color: var(--tab-active-bg);
    box-shadow: 0 4px 12px var(--tab-active-shadow);
  }

  .tab-button.add-btn {
    border: 1.5px dashed var(--add-btn-border);
    color: var(--add-btn-text);
    background-color: transparent;
  }

  .tab-button.add-btn:hover {
    background-color: var(--focus-ring);
  }

  /* FITTS'S LAW: Tombol Silang 'X' Jauh Lebih Besar agar tidak meleset */
  .tab-delete {
    color: #ef4444;
    margin-left: 6px;
    font-weight: bold;
    font-size: 14px; /* Diperbesar */
    width: 24px;     /* Area sentuh spesifik */
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .tab-button.active .tab-delete {
    color: #fca5a5;
  }

  .tab-delete:hover {
    background-color: var(--delete-bg);
    color: #ef4444;
  }

  .tab-button.active .tab-delete:hover {
    background-color: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  .dynamic-section {
    padding: 24px;
    border: 1.5px solid var(--border-input);
    border-radius: 16px;
    background-color: var(--bg-dynamic);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .file-status {
    color: #10b981;
    font-size: 13px;
    font-weight: 600;
    margin-top: 8px;
    display: inline-block;
  }

  .status-message {
    margin-top: 25px;
    padding: 16px;
    border-radius: 12px;
    text-align: center;
    font-weight: 600;
  }

  .status-message.success {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .status-message.error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  /* FITTS'S LAW: Tombol Submit di bawah, lebar penuh, mudah dijangkau jempol */
  .submit-button {
    width: 100%;
    padding: 18px; /* Lebih tebal */
    background-color: var(--btn-submit);
    color: white;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    font-weight: 700;
    font-size: 16px;
    margin-top: 30px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px var(--btn-submit-shadow);
  }

  .submit-button:hover:not(:disabled) {
    background-color: var(--btn-submit-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px var(--btn-submit-shadow);
  }

  .submit-button:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 0 2px 10px var(--btn-submit-shadow);
  }

  .submit-button:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.7;
  }
`;

function App() {
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [laporans, setLaporans] = useState([{ id: Date.now(), namaUkm: '', foto: null }]);
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // URL API Kamu
  const scriptURL = 'https://script.google.com/macros/s/AKfycbz1QI1qt1EU_KDwFbhOL9KiDjNLIKAifA3bKSFJwQKuPEhz0W5kX_bDepq-QlT7e2VZ/exec';

  const addTab = () => {
    setLaporans([...laporans, { id: Date.now(), namaUkm: '', foto: null }]);
    setActiveTab(laporans.length);
  };

  const removeTab = (index, e) => {
    e.stopPropagation(); 
    if (laporans.length === 1) return alert("Minimal harus ada 1 laporan!");
    const newData = laporans.filter((_, i) => i !== index);
    setLaporans(newData);
    setActiveTab(newData.length - 1);
  };

  const handleLaporanChange = (index, field, value) => {
    const newData = [...laporans];
    newData[index][field] = value;
    setLaporans(newData);
  };

  const processAllFiles = async () => {
    return Promise.all(laporans.map((item) => {
      return new Promise((resolve, reject) => {
        if (!item.foto) reject(`Foto pada laporan "${item.namaUkm || `Data ke-${activeTab+1}`}" belum diisi!`);
        const reader = new FileReader();
        reader.onload = () => resolve({
          namaUkm: item.namaUkm,
          fileName: item.foto.name,
          mimeType: item.foto.type,
          fileBase64: reader.result.split(',')[1]
        });
        reader.onerror = error => reject(error);
        reader.readAsDataURL(item.foto);
      });
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!penanggungJawab || !tanggal) return alert("Penanggung Jawab dan Tanggal wajib diisi!");
    if (laporans.some(l => !l.namaUkm)) return alert("Ada Nama UKM yang belum diisi!");

    try {
      setIsLoading(true);
      setStatus('Sedang memproses file dan mengirim data...');

      const laporanListProcessed = await processAllFiles();
      const payload = { penanggungJawab, tanggal, laporanList: laporanListProcessed };

      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.status === "success") {
        setStatus(`Mantap! ${result.message}`);
        setLaporans([{ id: Date.now(), namaUkm: '', foto: null }]);
        setActiveTab(0);
        setPenanggungJawab('');
        setTanggal('');
        
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
    <>
      <style>{themeStyles}</style>

      <div className="app-wrapper">
        <div className="form-card">
          <h2 className="form-title">Form Laporan UKM Harian</h2>
          
          {/* HICK'S & MILLER'S LAW: Pengelompokan & Penanda Langkah 1 */}
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
                /* MENAMBAHKAN AUTO-OPEN KALENDER KETIKA DIKLIK DI MANA SAJA */
                onClick={(e) => {
                  try {
                    e.target.showPicker();
                  } catch (err) {
                    // Fallback tenang jika browser lama tidak mendukung showPicker
                  }
                }}
                className="form-input" 
              />
            </div>
          </div>

          {/* HICK'S & MILLER'S LAW: Pengelompokan & Penanda Langkah 2 */}
          <div className="section-heading">
            <span>2</span> Detail Laporan
          </div>
          
          <div className="tab-container">
            {laporans.map((laporan, index) => (
              <button
                key={laporan.id}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`tab-button ${activeTab === index ? 'active' : ''}`}
              >
                Data {index + 1}
                {laporans.length > 1 && (
                  <span onClick={(e) => removeTab(index, e)} className="tab-delete" title="Hapus Tab">✕</span>
                )}
              </button>
            ))}
            <button type="button" onClick={addTab} className="tab-button add-btn">
              + Tambah UKM
            </button>
          </div>

          <div className="dynamic-section">
            <div className="input-group">
              <label className="form-label">Nama UKM (Data ke-{activeTab + 1}):</label>
              <input
                type="text"
                value={laporans[activeTab].namaUkm}
                onChange={(e) => handleLaporanChange(activeTab, 'namaUkm', e.target.value)}
                className="form-input"
                placeholder="Cth: UKM Tari"
              />
            </div>
            <div className="input-group">
              <label className="form-label">Foto Dokumentasi:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleLaporanChange(activeTab, 'foto', e.target.files[0])}
                className="form-input"
              />
              {laporans[activeTab].foto && <div className="file-status">✓ File dipilih: {laporans[activeTab].foto.name}</div>}
            </div>
          </div>

          {status && (
            <div className={`status-message ${status.includes('Mantap') ? 'success' : 'error'}`}>
              {status}
            </div>
          )}

          <button type="button" onClick={handleSubmit} disabled={isLoading} className="submit-button">
            {isLoading ? 'Memproses...' : `Kirim ${laporans.length} Data Sekaligus 🚀`}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;