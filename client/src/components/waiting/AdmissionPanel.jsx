import React from 'react';
import { UserCheck, UserX, Users } from 'lucide-react';
import useMeetingStore from '../../store/useMeetingStore';

const AdmissionPanel = ({ socket }) => {
  const { participants, meetingId, isHost } = useMeetingStore();

  // Find participants who are waiting (isWaiting flag set by useWebRTC)
  const waitingParticipants = Object.values(participants).filter((p) => p.isWaiting);

  if (!isHost || waitingParticipants.length === 0) return null;

  const handleAdmit = (targetSocketId) => {
    if (!socket || !meetingId) return;
    socket.emit('admit-participant', { meetingId, targetSocketId });
    // Remove from waiting state locally
    useMeetingStore.getState().upsertParticipant(targetSocketId, { isWaiting: false });
  };

  const handleDeny = (targetSocketId) => {
    if (!socket || !meetingId) return;
    socket.emit('deny-participant', { meetingId, targetSocketId });
    // Remove from participants locally
    useMeetingStore.getState().removeParticipant(targetSocketId);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-80 bg-[#111118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-amber-500/5">
        <Users size={14} className="text-amber-400" />
        <span className="text-sm font-semibold text-amber-300">
          {waitingParticipants.length} waiting to join
        </span>
      </div>

      {/* Waiting list */}
      <div className="max-h-48 overflow-y-auto">
        {waitingParticipants.map((p) => (
          <div
            key={p.socketId}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-300">
                {p.displayName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>

            {/* Name */}
            <span className="flex-1 text-sm text-white truncate">{p.displayName}</span>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleDeny(p.socketId)}
                aria-label={`Deny ${p.displayName}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
              >
                <UserX size={14} />
              </button>
              <button
                onClick={() => handleAdmit(p.socketId)}
                aria-label={`Admit ${p.displayName}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-all"
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
