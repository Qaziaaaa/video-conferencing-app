import React from 'react';
import { Mic, MicOff, Video, VideoOff, Crown, Hand, UserX } from 'lucide-react';

const ParticipantRow = ({ participant, isCurrentUser, isViewerHost, onKick }) => {
  const { displayName, isMuted, isCameraOff, isHandRaised, isHost } = participant;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors duration-200 group mx-2">
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-accent/80">
          {displayName?.[0]?.toUpperCase() || '?'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white truncate">
            {displayName}
            {isCurrentUser && <span className="text-text-4 font-normal"> (You)</span>}
          </span>
          {isHost && (
            <Crown size={11} className="text-warning flex-shrink-0" />
          )}
          {isHandRaised && (
            <Hand size={11} className="text-warning flex-shrink-0" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isMuted
          ? <MicOff size={14} className="text-danger" />
          : <Mic size={14} className="text-text-4" />
        }
        {isCameraOff
          ? <VideoOff size={14} className="text-danger" />
          : <Video size={14} className="text-text-4" />
        }

        {isViewerHost && !isCurrentUser && (
          <button
            onClick={() => onKick?.(participant.socketId)}
            aria-label={`Remove ${displayName} from meeting`}
            className="opacity-0 group-hover:opacity-100 ml-1 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-danger/20 text-danger transition-all duration-200"
          >
            <UserX size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ParticipantRow;
