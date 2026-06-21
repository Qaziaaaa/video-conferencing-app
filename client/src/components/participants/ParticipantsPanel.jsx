import React from 'react';
import { X, Users } from 'lucide-react';
import ParticipantRow from './ParticipantRow';
import useMeetingStore from '../../store/useMeetingStore';

const ParticipantsPanel = ({ isOpen, onClose, onKick }) => {
  const { participants, localSocketId, isHost } = useMeetingStore();

  const participantList = Object.values(participants);
  const count = participantList.length;

  const sorted = [...participantList].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  return (
    <div
      className={`
        fixed md:absolute inset-0 md:inset-auto md:top-0 md:right-0 md:h-full md:w-72 z-30
        md:border-l md:border-border md:shadow-2xl
        bg-surface
        flex flex-col transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-white">
            Participants
            <span className="ml-2 text-xs text-text-4 font-normal">({count})</span>
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close participants panel"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-text-3 hover:text-white transition-colors duration-200"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-2 min-h-0">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Users size={28} className="text-text-4" />
            <p className="text-xs text-text-4">No participants yet</p>
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
