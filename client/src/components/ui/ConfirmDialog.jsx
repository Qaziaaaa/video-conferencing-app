import React, { useEffect, useRef } from 'react';
import { PhoneOff, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onConfirm, onCancel }) => {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-[scaleIn_0.15s_ease-out]">
        <button
          onClick={onCancel}
          aria-label="Cancel"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-text-3 hover:text-white transition-colors duration-200"
        >
          <X size={15} />
        </button>

        <div className="w-12 h-12 bg-danger-soft rounded-xl flex items-center justify-center mb-4">
          <PhoneOff size={20} className="text-danger" />
        </div>

        <h2 id="confirm-dialog-title" className="text-base font-semibold text-white mb-1">
          Leave meeting?
        </h2>
        <p className="text-sm text-text-3 mb-6 leading-relaxed">
          Others will remain in the meeting.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-border-2 rounded-xl text-sm font-medium text-text-2 hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Stay
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-danger hover:bg-[#dc2626] rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-lg shadow-danger/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
