import React, { useEffect, useRef } from 'react';
import { PhoneOff, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onConfirm, onCancel }) => {
  const confirmBtnRef = useRef(null);

  // Focus the confirm button when dialog opens (focus trap)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Trap focus within dialog
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-[#111118] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        {/* Close button */}
        <button
          onClick={onCancel}
          aria-label="Cancel"
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
          <PhoneOff size={22} className="text-red-400" />
        </div>

        <h2 id="confirm-dialog-title" className="text-lg font-bold text-white mb-2">
          Leave meeting?
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          You'll be disconnected from the call. Others will remain in the meeting.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            Stay
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-red-600/20 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
