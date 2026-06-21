import React from 'react';
import VideoGrid from '../video/VideoGrid';
import EmojiReaction from '../video/EmojiReaction';
import ControlBar from '../controls/ControlBar';
import ChatPanel from '../chat/ChatPanel';
import ParticipantsPanel from '../participants/ParticipantsPanel';
import NotificationStack from '../notifications/NotificationStack';
import ConfirmDialog from '../ui/ConfirmDialog';
import AdmissionPanel from '../waiting/AdmissionPanel';
import useChatStore from '../../store/useChatStore';
import useUIStore from '../../store/useUIStore';
import useMeetingStore from '../../store/useMeetingStore';

const MeetingLayout = ({
  socket,
  onToggleMic,
  onToggleCam,
  onToggleHand,
  onToggleScreenShare,
  onToggleRecording,
  onReact,
  onToggleLock,
  onLeave,
  onKickParticipant,
}) => {
  const { isChatOpen, toggleChat, unreadCount } = useChatStore();
  const { isParticipantsOpen, toggleParticipants, isConfirmLeaveOpen, showConfirmLeave, hideConfirmLeave } = useUIStore();
  const { isMicOn, isCamOn, isHandRaised, isScreenSharing, isRecording, isRoomLocked, isHost, participants, meetingId, mediaError } = useMeetingStore();

  const participantCount = Object.keys(participants).length;

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden relative bg-base">
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-accent/10 border-b border-accent/20 text-[11px] text-accent font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        Beta — max 4 participants. Feedback? <a href="#" className="underline underline-offset-2 hover:text-white transition-colors">Let us know</a>
      </div>
      {mediaError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-danger/90 backdrop-blur-xl border border-danger/30 rounded-xl shadow-2xl max-w-md animate-[fadeIn_0.2s_ease-out]">
          <p className="text-sm font-medium text-white">{mediaError}</p>
        </div>
      )}

      <AdmissionPanel socket={socket} />

      <div className="flex-1 relative min-h-0">
        <div className={`h-full transition-all duration-300 ease-out ${(isChatOpen || isParticipantsOpen) ? 'md:mr-80' : ''}`}>
          <div className="h-full p-2 sm:p-3">
            <VideoGrid onKickParticipant={onKickParticipant} />
          </div>
        </div>

        <EmojiReaction />

        <ChatPanel
          socket={socket}
          isOpen={isChatOpen}
          onClose={toggleChat}
        />

        {!isChatOpen && (
          <ParticipantsPanel
            isOpen={isParticipantsOpen}
            onClose={toggleParticipants}
            onKick={onKickParticipant}
          />
        )}
      </div>

      <div className="relative z-10 flex-shrink-0">
        <ControlBar
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          isHandRaised={isHandRaised}
          isScreenSharing={isScreenSharing}
          isRecording={isRecording}
          isChatOpen={isChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          isRoomLocked={isRoomLocked}
          isHost={isHost}
          unreadChatCount={unreadCount}
          participantCount={participantCount}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onToggleHand={onToggleHand}
          onToggleScreenShare={onToggleScreenShare}
          onToggleRecording={onToggleRecording}
          onToggleChat={toggleChat}
          onToggleParticipants={toggleParticipants}
          onReact={onReact}
          onToggleLock={onToggleLock}
          onLeave={showConfirmLeave}
        />
      </div>

      <NotificationStack />

      <ConfirmDialog
        isOpen={isConfirmLeaveOpen}
        onConfirm={onLeave}
        onCancel={hideConfirmLeave}
      />
    </div>
  );
};

export default MeetingLayout;
