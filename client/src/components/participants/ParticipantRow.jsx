import React from 'react';
import { Mic, MicOff, Video, VideoOff, Crown, Hand, UserX } from 'lucide-react';

const ParticipantRow = ({ participant, isCurrentUser, isViewerHost, onKick }) => {
  const { displayName, isMuted, isCameraOff, isHandRaised, isHost } = participant;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
      {/* Avatar initial */}
      <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-blue-300">
          {displayName?.[0]?.toUpperCase() || '?'}
        </span>
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white truncate">
            {displayName}
            {isCurrentUser && <span className="text-slate-500 font-normal"> (You)</span>}
          </span>
          {isHost && (
            <Crown size={11} className="text-amber-400 flex-shrink-0" />
          )}
          {isHandRaised && (
            <Hand size={11} className="text-amber-400 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Status icons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isMuted
          ? <MicOff size={14} className="text-red-400" />
          : <Mic size={14} className="text-slate-500" />
        }
        {isCameraOff
          ? <VideoOff size={14} className="text-red-400" />
          : <Video size={14} className="text-slate-500" />
        }

        {/* Kick button — only visible to host, not for self */}
        {isViewerHost && !isCurrentUser && (
          <button
            onClick={() => onKick?.(participant.socketId)}
            aria-label={`Remove ${displayName} from meeting`}
            className="opacity-0 group-hover:opacity-100 ml-1 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-all"
          >
            <UserX size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ParticipantRow;
