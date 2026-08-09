import { useState } from 'react';

export const useAlertDialog = () => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
    onConfirm: null,
  });

  const showAlert = (config) => {
    setDialog({
      isOpen: true,
      title: config.title || 'Confirm',
      message: config.message || '',
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      isDangerous: config.isDangerous || false,
      onConfirm: config.onConfirm || (() => {}),
    });
  };

  const closeAlert = () => {
    setDialog({ ...dialog, isOpen: false });
  };

  const handleConfirm = () => {
    if (dialog.onConfirm) {
      dialog.onConfirm();
    }
    closeAlert();
  };

  return { dialog, showAlert, closeAlert, handleConfirm };
};

export function AlertDialog({ isOpen, title, message, confirmText, cancelText, isDangerous, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          // backdropFilter: 'blur(4px)',
        }}
        onClick={onCancel}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '420px',
          width: '90%',
          zIndex: 1001,
          // animation: 'dialogSlideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ padding: 'var(--spacing-xl)' }}>
          <h3 style={{ margin: '0 0 var(--spacing-md) 0', color: 'var(--color-text)', fontSize: 'var(--font-size-lg)' }}>
            {title}
          </h3>
          <p style={{ margin: '0 0 var(--spacing-lg) 0', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: 'var(--font-size-base)' }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} className="btn btn-secondary btn-sm">
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`btn btn-sm ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
