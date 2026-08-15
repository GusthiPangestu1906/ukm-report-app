import { useState, useCallback } from 'react';

export const useModal = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: null,
    onCancel: null
  });

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = useCallback((title, message, type = 'warning') => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: closeModal
    });
  }, [closeModal]);

  const showConfirm = useCallback((title, message, onConfirmCallback) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirmCallback();
        closeModal();
      },
      onCancel: closeModal
    });
  }, [closeModal]);

  return {
    modal,
    showAlert,
    showConfirm,
    closeModal
  };
};
