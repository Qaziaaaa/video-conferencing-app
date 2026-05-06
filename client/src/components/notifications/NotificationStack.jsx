import React from 'react';
import useUIStore from '../../store/useUIStore';

const NotificationStack = () => {
  const { notifications, removeNotification } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-24 left-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="flex items-center gap-3 px-4 py-2.5 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl text-sm text-white pointer-events-auto animate-[slideInLeft_0.2s_ease-out]"
          style={{ maxWidth: '280px' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
          <span className="text-slate-200 text-xs leading-snug">{notif.message}</span>
          <button
            onClick={() => removeNotification(notif.id)}
            aria-label="Dismiss notification"
            className="ml-auto flex-shrink-0 text-slate-500 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationStack;
