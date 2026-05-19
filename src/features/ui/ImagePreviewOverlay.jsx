import React from 'react';

export default function ImagePreviewOverlay({ previewImage, onClose }) {
  if (!previewImage) return null;

  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <button className="image-preview-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
      <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
        <span className="image-preview-hint">Klik di luar gambar atau tekan ESC untuk menutup</span>
        <img src={previewImage} alt="Full Preview" className="image-preview-img" />
      </div>
    </div>
  );
}
