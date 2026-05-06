import React from 'react';
import { X, Users } from 'lucide-react';
import ParticipantRow from './ParticipantRow';
import useMeetingStore from '../../store/useMeetingStore';

const ParticipantsPanel = ({ isOpen, onClose, onKick }) => {
  const { participants, localSocketId, isHost } = useMeetingStore();

  const participantList = Object.values(participants);
  const count = participantList.length;

  // Sort: host first, then alphabetical
  const sorted = [...participantList].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  return (
    <div
      className={`
        absolute top-0 right-0 h-full w-72 bg-[#0d0d14] border-l border-white/5
        flex flex-col transition-transform duration-300 ease-in-out z-20
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            Participants
            <span className="ml-2 text-xs text-slate-500 font-normal">({count})</span>
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close participants panel"
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Users size={28} className="text-slate-500" />
            <p className="text-xs text-slate-500">No participants yet</p>
          </div>
        ) : (
          sorted.map((participant) => (
            <ParticipantRow
              key={participant.socketId}
              participant={participant}
              isCurrentUser={participant.socketId === localSocketId}
              isViewerHost={isHost}
              onKick={onKick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ParticipantsPanel;
