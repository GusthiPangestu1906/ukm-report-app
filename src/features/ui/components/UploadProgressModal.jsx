import React from 'react';

const UploadProgressModal = ({
  isLoading,
  laporans = [],
  processingId,
  uploadProgress = {},
  currentUploadIndex = 1,
  totalUploads = 1
}) => {
  if (!isLoading) return null;

  const activeUkm = laporans.find(l => l.id === processingId) || laporans[currentUploadIndex - 1];
  const activeProgress = activeUkm ? (uploadProgress[activeUkm.id] || 0) : 0;
  const safeTotal = Math.max(1, totalUploads);

  // Hitung persentase total
  const overallPercent = Math.min(
    100,
    Math.round(((Math.max(0, currentUploadIndex - 1) + (activeProgress / 100)) / safeTotal) * 100)
  );

  return (
    <div className="upload-modal-overlay">
      <div className="upload-modal-card">
        {/* Modal Header */}
        <div className="upload-modal-header">
          <div className="upload-modal-icon-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <h3 className="upload-modal-title">PROSES UNGGAH</h3>
        </div>

        {/* Info Counter & UKM Aktif */}
        <div className="upload-modal-info-row">
          <div className="upload-modal-ukm-counter">
            {currentUploadIndex} dari {totalUploads} UKM
          </div>
          {activeUkm && (
            <div className="upload-modal-ukm-name">
              {activeUkm.namaUkm}
            </div>
          )}
        </div>

        {/* Progress Bar Utama & Persentase */}
        <div className="upload-modal-progress-section">
          <div className="upload-modal-bar-bg">
            <div className="upload-modal-bar-fill" style={{ width: `${overallPercent}%` }}>
              <span className="upload-modal-shimmer"></span>
            </div>
          </div>
          <span className="upload-modal-badge">{overallPercent}%</span>
        </div>

        {/* Daftar UKM Ringkas */}
        {laporans.length > 0 && (
          <div className="upload-modal-ukm-list">
            {laporans.map((lap) => {
              const p = uploadProgress[lap.id] || 0;
              const isDone = p === 100;
              const isCurrent = lap.id === processingId;
              return (
                <div key={lap.id} className={`upload-modal-ukm-item ${isDone ? 'done' : isCurrent ? 'active' : 'pending'}`}>
                  <span className="ukm-item-icon">
                    {isDone ? '✓' : isCurrent ? '🔄' : '⏳'}
                  </span>
                  <span className="ukm-item-name">{lap.namaUkm}</span>
                  <span className="ukm-item-status">
                    {isDone ? 'Terkirim' : isCurrent ? `${p}%` : 'Menunggu'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadProgressModal;
