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
  isBlurred = false,
  isDominantSpeaker = false,
  isScreenSharing = false,
  isLoading = false,
  onKick,
  version = 0,
}) => {
  const showVideo = !isCameraOff && stream;

  return (
    <div
      className={`
        relative w-full h-full rounded-xl overflow-hidden bg-surface
        border transition-all duration-300 isolate
        ${isDominantSpeaker
          ? 'border-accent shadow-[0_0_20px_rgba(99,102,241,0.2)]'
          : 'border-border hover:border-white/10'
        }
      `}
    >
      {isLoading && <SkeletonTile />}

      {!isLoading && (
        <>
          {showVideo ? (
            <VideoPlayer
              stream={stream}
              muted={isLocal}
              version={version}
              className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? 'blur-lg scale-110' : ''}`}
            />
          ) : (
            <AvatarFallback displayName={displayName} size="lg" />
          )}
        </>
      )}

      {isScreenSharing && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 bg-success/90 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <MonitorUp size={10} />
          <span>Presenting</span>
        </div>
      )}

      {isHandRaised && (
        <div className="absolute top-2 right-2 z-10 w-7 h-7 bg-warning/90 rounded-full flex items-center justify-center shadow-lg animate-[scaleIn_0.2s_ease-out]">
          <Hand size={12} className="text-white" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-3 py-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {isMuted && (
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-danger/80">
                <MicOff size={9} className="text-white" />
              </div>
            )}
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[11px] font-semibold text-white truncate drop-shadow-sm">
                {displayName}
              </span>
              {isLocal && (
                <span className="text-[10px] text-white/50">(You)</span>
              )}
              {isHost && (
                <Crown size={9} className="text-warning flex-shrink-0" />
              )}
            </div>
          </div>

          {onKick && (
            <button
              onClick={onKick}
              className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium text-danger hover:text-white hover:bg-danger rounded-md transition-all border border-danger/30 hover:border-danger/50"
              aria-label={`Remove ${displayName}`}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tile;
