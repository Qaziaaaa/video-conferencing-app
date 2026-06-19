import React from 'react';
import VideoGrid from '../video/VideoGrid';
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
  onLeave,
  onKickParticipant,
}) => {
  const { isChatOpen, toggleChat, unreadCount } = useChatStore();
  const { isParticipantsOpen, toggleParticipants, isConfirmLeaveOpen, showConfirmLeave, hideConfirmLeave } = useUIStore();
  const { isMicOn, isCamOn, isHandRaised, isScreenSharing, participants, meetingId, mediaError } = useMeetingStore();

  const participantCount = Object.keys(participants).length;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0f0f2a,transparent_60%)] pointer-events-none" />

      {/* Media error banner */}
      {mediaError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-red-600/90 backdrop-blur-xl border border-red-400/30 rounded-2xl shadow-2xl max-w-md">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-medium text-white">{mediaError}</p>
        </div>
      )}

      {/* Admission panel (host only, when participants are waiting) */}
      <AdmissionPanel socket={socket} />

      {/* Main area: video grid + side panels */}
      <div className="flex-1 relative min-h-0">
        {/* Video grid */}
        <div className={`h-full transition-all duration-300 ${isChatOpen || isParticipantsOpen ? 'mr-80' : ''}`}>
          <div className="h-full p-3">
            <VideoGrid onKickParticipant={onKickParticipant} />
          </div>
        </div>

        {/* Chat panel — slides in from right */}
        <ChatPanel
          socket={socket}
          isOpen={isChatOpen}
          onClose={toggleChat}
        />

        {/* Participants panel — slides in from right (behind chat) */}
        {!isChatOpen && (
          <ParticipantsPanel
            isOpen={isParticipantsOpen}
            onClose={toggleParticipants}
            onKick={onKickParticipant}
          />
        )}
      </div>

      {/* Control bar */}
      <div className="relative z-10 flex-shrink-0">
        <ControlBar
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          isHandRaised={isHandRaised}
          isScreenSharing={isScreenSharing}
          isChatOpen={isChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          unreadChatCount={unreadCount}
          participantCount={participantCount}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onToggleHand={onToggleHand}
          onToggleScreenShare={onToggleScreenShare}
          onToggleChat={toggleChat}
          onToggleParticipants={toggleParticipants}
          onLeave={showConfirmLeave}
        />
      </div>

      {/* Notification stack */}
      <NotificationStack />

      {/* Leave confirmation dialog */}
      <ConfirmDialog
        isOpen={isConfirmLeaveOpen}
        onConfirm={onLeave}
        onCancel={hideConfirmLeave}
      />
    </div>
  );
};

export default MeetingLayout;
