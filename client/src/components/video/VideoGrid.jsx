import React from 'react';
import Tile from './Tile';
import useMeetingStore from '../../store/useMeetingStore';

export const getGridLayout = (count) => {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  return { cols: 4, rows: 2 };
};

const colsClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2',
  4: 'grid-cols-2',
};

const sidebarParticipants = (list, excludeId) =>
  list.filter((id) => id !== excludeId);

const VideoGrid = ({ onKickParticipant }) => {
  const {
    localSocketId,
    displayName,
    localStream,
    screenShareStream,
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
    screenShareVersion,
  } = useMeetingStore();

  const allParticipantIds = Object.keys(participants);
  const totalCount = allParticipantIds.length || 1;

  if (activeScreenShareSocketId) {
    const sharerParticipant = participants[activeScreenShareSocketId];
    const isLocalSharer = activeScreenShareSocketId === localSocketId;

    const sidebarIds = sidebarParticipants(allParticipantIds, activeScreenShareSocketId);

    return (
      <div className="flex h-full gap-3">
        <div className="flex-1 relative min-w-0">
          <Tile
            participantId={activeScreenShareSocketId}
            displayName={sharerParticipant?.displayName || 'Unknown'}
            stream={isLocalSharer ? screenShareStream : remoteStreams[activeScreenShareSocketId]}
            isLocal={isLocalSharer}
            isHost={sharerParticipant?.isHost || false}
            isMuted={sharerParticipant?.isMuted || false}
            isCameraOff={false}
            isHandRaised={sharerParticipant?.isHandRaised || false}
            isDominantSpeaker={false}
            isScreenSharing={true}
            isLoading={false}
            version={screenShareVersion}
          />

          {isLocalSharer && (
            <div className="absolute bottom-4 right-4 w-44 h-28 rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl bg-surface z-10 animate-[pipIn_0.25s_ease-out]">
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
                version={screenShareVersion}
              />
            </div>
          )}
        </div>

        {sidebarIds.length > 0 && (
          <div className="flex flex-col gap-2 w-52 flex-shrink-0 overflow-y-auto custom-scrollbar pr-0.5">
            {sidebarIds.map((id) => {
              const p = participants[id];
              const isLocalTile = id === localSocketId;
              return (
                <div key={id} className="flex-shrink-0 h-28">
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
                    isLoading={!isLocalTile && connectionStates[id] === 'connecting'}
                    onKick={isHost && !isLocalTile ? () => onKickParticipant?.(id) : undefined}
                    version={screenShareVersion}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const { cols } = getGridLayout(totalCount);

  return (
    <div className={`grid ${colsClass[cols] || 'grid-cols-2'} gap-3 h-full auto-rows-fr`}>
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
            version={screenShareVersion}
          />
        );
      })}

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
          version={screenShareVersion}
        />
      )}
    </div>
  );
};

export default VideoGrid;
