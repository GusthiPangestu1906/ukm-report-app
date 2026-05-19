import React from 'react';

export default function Modal({ modal }) {
  if (!modal || !modal.isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${modal.type}`}>
        <div className={`modal-icon ${modal.type}`}>
          {modal.type === 'warning' && '⚠️'}
          {modal.type === 'success' && '✓'}
          {modal.type === 'error' && '!'}
          {modal.type === 'confirm' && '?'}
        </div>
        <h3 className="modal-title">{modal.title}</h3>
        <p className="modal-message">{modal.message}</p>
        <div className="modal-actions">
          {modal.type === 'confirm' && (
            <button onClick={modal.onCancel} className="modal-btn secondary">BATAL</button>
          )}
          <button onClick={modal.onConfirm} className="modal-btn primary">
            {modal.type === 'confirm' ? 'KONFIRMASI' : 'MENGERTI'}
          </button>
        </div>
      </div>
    </div>
  );
}
