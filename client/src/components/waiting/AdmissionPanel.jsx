import React from 'react';
import { UserCheck, UserX, Users } from 'lucide-react';
import useMeetingStore from '../../store/useMeetingStore';

const AdmissionPanel = ({ socket }) => {
  const { participants, meetingId, isHost } = useMeetingStore();

  const waitingParticipants = Object.values(participants).filter((p) => p.isWaiting);

  if (!isHost || waitingParticipants.length === 0) return null;

  const handleAdmit = (targetSocketId) => {
    if (!socket || !meetingId) return;
    socket.emit('admit-participant', { meetingId, targetSocketId });
    useMeetingStore.getState().upsertParticipant(targetSocketId, { isWaiting: false });
  };

  const handleDeny = (targetSocketId) => {
    if (!socket || !meetingId) return;
    socket.emit('deny-participant', { meetingId, targetSocketId });
    useMeetingStore.getState().removeParticipant(targetSocketId);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-80 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-warning-soft/50">
        <Users size={14} className="text-warning" />
        <span className="text-sm font-semibold text-warning">
          {waitingParticipants.length} waiting to join
        </span>
      </div>

      <div className="max-h-48 overflow-y-auto custom-scrollbar">
        {waitingParticipants.map((p) => (
          <div
            key={p.socketId}
            className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
          >
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0 border border-border">
              <span className="text-xs font-bold text-text-2">
                {p.displayName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>

            <span className="flex-1 text-sm text-white truncate">{p.displayName}</span>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleDeny(p.socketId)}
                aria-label={`Deny ${p.displayName}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger-soft hover:bg-danger/30 text-danger transition-all duration-200"
              >
                <UserX size={14} />
              </button>
              <button
                onClick={() => handleAdmit(p.socketId)}
                aria-label={`Admit ${p.displayName}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-success-soft hover:bg-success/30 text-success transition-all duration-200"
              >
                <UserCheck size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdmissionPanel;
