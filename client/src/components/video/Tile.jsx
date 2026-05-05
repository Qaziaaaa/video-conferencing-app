import React from 'react';
import { Mic, MicOff, Hand, Crown, MonitorUp } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import AvatarFallback from './AvatarFallback';
import SkeletonTile from '../ui/SkeletonTile';

const Tile = ({
  participantId,
  displayName = 'Unknown',
  stream = null,
  isLocal = false,
  isHost = false,
  isMuted = false,
  isCameraOff = false,
  isHandRaised = false,
  isDominantSpeaker = false,
  isScreenSharing = false,
  isLoading = false,
  onKick,
}) => {
  const showVideo = !isCameraOff && stream;

  return (
    <div
      className={`
        relative w-full h-full rounded-2xl overflow-hidden bg-[#111118]
        border-2 transition-all duration-300
        ${isDominantSpeaker
          ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
          : 'border-white/5 hover:border-white/10'
        }
      `}
    >
      {/* Loading skeleton */}
      {isLoading && <SkeletonTile />}

      {/* Video or Avatar */}
      {!isLoading && (
        <>
          {showVideo ? (
            <VideoPlayer stream={stream} muted={isLocal} className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback displayName={displayName} size="lg" />
          )}
        </>
      )}

      {/* Screen sharing indicator */}
      {isScreenSharing && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
          <MonitorUp size={10} />
          <span>Sharing</span>
        </div>
      )}

      {/* Bottom overlay: name + status icons */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Mute icon */}
          <div className={`flex-shrink-0 p-1 rounded-full ${isMuted ? 'bg-red-500/80' : 'bg-black/40'}`}>
            {isMuted
              ? <MicOff size={10} className="text-white" />
              : <Mic size={10} className="text-white/70" />
            }
          </div>

          {/* Display name */}
          <span className="text-[11px] font-semibold text-white truncate">
            {isLocal ? `${displayName} (You)` : displayName}
          </span>

          {/* Host badge */}
          {isHost && (
            <Crown size={10} className="text-amber-400 flex-shrink-0" />
          )}
        </div>

        {/* Right side: hand raised + kick button */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isHandRaised && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/80 rounded-full">
              <Hand size={10} className="text-white" />
            </div>
          )}

          {onKick && (
            <button
              onClick={onKick}
              className="px-2 py-0.5 text-[10px] font-bold text-red-400 hover:text-white hover:bg-red-600 rounded-full transition-all border border-red-500/30 hover:border-red-600"
              aria-label={`Remove ${displayName} from meeting`}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Hand raised overlay on tile */}
      {isHandRaised && (
        <div className="absolute top-3 right-3 w-8 h-8 bg-amber-500/90 rounded-full flex items-center justify-center shadow-lg">
          <Hand size={14} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default Tile;
