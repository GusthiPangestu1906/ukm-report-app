import { useState, useEffect } from 'react';
import { CACHE_KEYS, cache } from '../../../utils/cache';
import { REGEX } from '../../../utils/regex';
import { reportApi } from '../../../services/api';

export const useReportForm = (isAppInitialized, tanggal, penanggungJawab, fetchHistory, showAlert, showConfirm) => {
  const [currentUkm, setCurrentUkm] = useState('');
  const [ukmError, setUkmError] = useState('');
  const [laporans, setLaporans] = useState([]);
  const [currentFotos, setCurrentFotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStageText, setUploadStageText] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!isAppInitialized) return;
    const savedDrafts = cache.get(CACHE_KEYS.draftQueue);
    if (savedDrafts && Array.isArray(savedDrafts) && savedDrafts.length > 0) {
      setLaporans(savedDrafts);
    }
  }, [isAppInitialized]);

  useEffect(() => {
    if (!isAppInitialized) return;
    if (laporans.length > 0) cache.set(CACHE_KEYS.draftQueue, laporans);
    else cache.remove(CACHE_KEYS.draftQueue);
  }, [laporans, isAppInitialized]);

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

  const addToDraft = async (selectedBulan, availableDates, submittedUkms) => {
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

      for (let laporan of laporans) {
        setProcessingId(laporan.id);
        setUploadProgress(prev => ({ ...prev, [laporan.id]: 8 }));
        setUploadStageText(prev => ({ ...prev, [laporan.id]: 'Mempersiapkan berkas...' }));

        let currentP = 8;
        const progressInterval = setInterval(() => {
          if (currentP < 90) {
            const step = Math.floor(Math.random() * 8) + 4;
            currentP = Math.min(92, currentP + step);

            let stage = 'Mengompresi & membaca foto...';
            if (currentP > 30 && currentP <= 65) {
              stage = 'Mengirim data laporan ke database...';
            } else if (currentP > 65) {
              stage = 'Menyimpan & memverifikasi respons server...';
            }

            setUploadProgress(prev => ({ ...prev, [laporan.id]: currentP }));
            setUploadStageText(prev => ({ ...prev, [laporan.id]: stage }));
          }
        }, 180);

        try {
          const payload = {
            tanggal,
            ukm: laporan.namaUkm,
            penanggungJawab: penanggungJawab.trim(),
            fotos: laporan.fotos.map(f => ({ name: f.name, data: f.data }))
          };

          const result = await reportApi.submitReport(payload);
          clearInterval(progressInterval);

          if (result.status === 'success') {
            setUploadProgress(prev => ({ ...prev, [laporan.id]: 100 }));
            setUploadStageText(prev => ({ ...prev, [laporan.id]: 'Laporan Berhasil Terkirim!' }));
            await new Promise(res => setTimeout(res, 400));
            successCount++;
          } else {
            setUploadProgress(prev => ({ ...prev, [laporan.id]: 0 }));
            setUploadStageText(prev => ({ ...prev, [laporan.id]: 'Gagal Mengunggah' }));
            failCount++;
          }
        } catch (err) {
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [laporan.id]: 0 }));
          setUploadStageText(prev => ({ ...prev, [laporan.id]: 'Gagal (Koneksi Terputus)' }));
          failCount++;
        }
      }

      setProcessingId(null);
      setIsLoading(false);
      if (successCount > 0) fetchHistory(true);

      if (failCount === 0) {
        showAlert("PENGIRIMAN BERHASIL", `Seluruh ${successCount} laporan UKM berhasil terkirim ke server!`, "success");
        setLaporans([]);
        setUploadProgress({});
        setUploadStageText({});
      } else {
        showAlert("SEBAGIAN GAGAL", `${successCount} berhasil terkirim, ${failCount} gagal. Silakan coba lagi untuk data yang tersisa.`, "warning");
        setLaporans(prev => prev.filter(l => (uploadProgress[l.id] || 0) !== 100));
      }
    });
  };

  const removeDraft = (idToRemove) => {
    setLaporans((prev) => prev.filter(laporan => laporan.id !== idToRemove));
  };

  return {
    currentUkm, ukmError, laporans, currentFotos, isLoading, processingId, uploadProgress, uploadStageText,
    previewImage, setPreviewImage, handleUkmChange, handleFileChange, removeCurrentFoto,
    addToDraft, handleEditDraft, handleSubmit, removeDraft
  };
};
