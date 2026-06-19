import React from 'react';
import Tile from './Tile';
import useMeetingStore from '../../store/useMeetingStore';

/**
 * Returns CSS grid column count based on participant count.
 * Layout algorithm from design doc:
 *   1  → 1 col
 *   2  → 2 cols
 *   3–4 → 2 cols
 *   5–6 → 3 cols
 *   7–8 → 4 cols
 */
export const getGridLayout = (count) => {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  return { cols: 4, rows: 2 };
};

// Responsive grid: always 1 col on mobile, scale up on sm+
const colsClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2',
  4: 'grid-cols-1 sm:grid-cols-2',
};

const VideoGrid = ({ onKickParticipant }) => {
  const {
    localSocketId,
    displayName,
    localStream,
    remoteStreams,
    participants,
    connectionStates,
    isHost,
    isMicOn,
    isCamOn,
    isHandRaised,
    isBlurred,
    activeScreenShareSocketId,
    dominantSpeakerSocketId,
  } = useMeetingStore();

  const allParticipantIds = Object.keys(participants);
  const totalCount = allParticipantIds.length || 1;

  // Screen share layout: presenter tile large, others in sidebar strip
  if (activeScreenShareSocketId) {
    const sharerParticipant = participants[activeScreenShareSocketId];
    const otherIds = allParticipantIds.filter((id) => id !== activeScreenShareSocketId);

    return (
      <div className="flex flex-col h-full gap-2">
        {/* Large presenter tile */}
        <div className="flex-1 min-h-0">
          <Tile
            participantId={activeScreenShareSocketId}
            displayName={sharerParticipant?.displayName || 'Unknown'}
            stream={
              activeScreenShareSocketId === localSocketId
                ? localStream
                : remoteStreams[activeScreenShareSocketId]
            }
            isLocal={activeScreenShareSocketId === localSocketId}
            isHost={sharerParticipant?.isHost || false}
            isMuted={sharerParticipant?.isMuted || false}
            isCameraOff={false}
            isHandRaised={sharerParticipant?.isHandRaised || false}
            isDominantSpeaker={false}
            isScreenSharing={true}
            isLoading={false}
          />
        </div>

        {/* Sidebar strip of other participants */}
        {otherIds.length > 0 && (
          <div className="flex gap-2 h-24 sm:h-28 overflow-x-auto flex-shrink-0 pb-1">
            {otherIds.map((id) => {
              const p = participants[id];
              const isLocalTile = id === localSocketId;
              return (
                <div key={id} className="flex-shrink-0 w-44 h-full">
                  <Tile
                    participantId={id}
                    displayName={isLocalTile ? displayName : p?.displayName || 'Unknown'}
                    stream={isLocalTile ? localStream : remoteStreams[id]}
                    isLocal={isLocalTile}
                    isHost={p?.isHost || false}
                    isMuted={isLocalTile ? !isMicOn : p?.isMuted || false}
                    isCameraOff={isLocalTile ? !isCamOn : p?.isCameraOff || false}
                    isHandRaised={isLocalTile ? isHandRaised : p?.isHandRaised || false}
                    isBlurred={isLocalTile ? isBlurred : false}
                    isDominantSpeaker={id === dominantSpeakerSocketId}
                    isScreenSharing={false}
                    isLoading={connectionStates[id] === 'connecting'}
                    onKick={isHost && !isLocalTile ? () => onKickParticipant?.(id) : undefined}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Normal grid layout
  const { cols } = getGridLayout(totalCount);

  return (
    <div className={`grid ${colsClass[cols] || 'grid-cols-2'} gap-2 h-full auto-rows-fr`}>
      {allParticipantIds.map((id) => {
        const p = participants[id];
        const isLocalTile = id === localSocketId;

        return (
          <Tile
            key={id}
            participantId={id}
            displayName={isLocalTile ? displayName : p?.displayName || 'Unknown'}
            stream={isLocalTile ? localStream : remoteStreams[id]}
            isLocal={isLocalTile}
            isHost={p?.isHost || false}
            isMuted={isLocalTile ? !isMicOn : p?.isMuted || false}
            isCameraOff={isLocalTile ? !isCamOn : p?.isCameraOff || false}
            isHandRaised={isLocalTile ? isHandRaised : p?.isHandRaised || false}
            isBlurred={isLocalTile ? isBlurred : false}
            isDominantSpeaker={id === dominantSpeakerSocketId}
            isScreenSharing={p?.isScreenSharing || false}
            isLoading={!isLocalTile && connectionStates[id] === 'connecting'}
            onKick={isHost && !isLocalTile ? () => onKickParticipant?.(id) : undefined}
          />
        );
      })}

      {/* Show local tile if not yet in participants map */}
      {!allParticipantIds.includes(localSocketId) && localSocketId && (
        <Tile
          participantId={localSocketId}
          displayName={displayName}
          stream={localStream}
          isLocal={true}
          isHost={isHost}
          isMuted={!isMicOn}
          isCameraOff={!isCamOn}
          isHandRaised={isHandRaised}
          isBlurred={isBlurred}
          isDominantSpeaker={false}
          isScreenSharing={false}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default VideoGrid;
