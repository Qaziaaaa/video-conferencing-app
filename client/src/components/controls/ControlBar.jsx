import React from 'react';
import {
  Mic, MicOff,
  Video, VideoOff,
  MonitorUp, MonitorOff,
  Hand,
  MessageSquare,
  Users,
  PhoneOff,
} from 'lucide-react';

const ControlButton = ({
  onClick,
  ariaLabel,
  active = true,
  danger = false,
  badge = null,
  children,
  className = '',
}) => {
  const base = 'relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]';
  const activeStyle = active
    ? 'bg-white/10 hover:bg-white/20 text-white'
    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400';
  const dangerStyle = 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30';

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${base} ${danger ? dangerStyle : activeStyle} ${className}`}
    >
      {children}
      {badge !== null && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

const ControlBar = ({
  isMicOn,
  isCamOn,
  isHandRaised,
  isScreenSharing,
  isChatOpen,
  isParticipantsOpen,
  unreadChatCount,
  participantCount,
  onToggleMic,
  onToggleCam,
  onToggleHand,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onLeave,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0d0d14]/90 backdrop-blur-xl border-t border-white/5">
      {/* Mic */}
      <ControlButton
        onClick={onToggleMic}
        ariaLabel={isMicOn ? 'Mute microphone (M)' : 'Unmute microphone (M)'}
        active={isMicOn}
      >
        {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
      </ControlButton>

      {/* Camera */}
      <ControlButton
        onClick={onToggleCam}
        ariaLabel={isCamOn ? 'Turn off camera (V)' : 'Turn on camera (V)'}
        active={isCamOn}
      >
        {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
      </ControlButton>

      {/* Screen Share */}
      <ControlButton
        onClick={onToggleScreenShare}
        ariaLabel={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
        active={!isScreenSharing}
        className={isScreenSharing ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/40' : ''}
      >
        {isScreenSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
      </ControlButton>

      {/* Raise Hand */}
      <ControlButton
        onClick={onToggleHand}
        ariaLabel={isHandRaised ? 'Lower hand (H)' : 'Raise hand (H)'}
        active={!isHandRaised}
        className={isHandRaised ? 'bg-amber-500/30 text-amber-400 hover:bg-amber-500/40' : ''}
      >
        <Hand size={20} />
      </ControlButton>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-1" />

      {/* Chat */}
      <ControlButton
        onClick={onToggleChat}
        ariaLabel={isChatOpen ? 'Close chat' : 'Open chat'}
        active={true}
        badge={unreadChatCount}
        className={isChatOpen ? 'bg-blue-600/20 text-blue-400' : ''}
      >
        <MessageSquare size={20} />
      </ControlButton>

      {/* Participants */}
      <ControlButton
        onClick={onToggleParticipants}
        ariaLabel={isParticipantsOpen ? 'Close participants' : `Show participants (${participantCount})`}
        active={true}
        badge={participantCount}
        className={isParticipantsOpen ? 'bg-blue-600/20 text-blue-400' : ''}
      >
        <Users size={20} />
      </ControlButton>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-1" />

      {/* Leave */}
      <ControlButton
        onClick={onLeave}
        ariaLabel="Leave meeting (Escape)"
        danger={true}
      >
        <PhoneOff size={20} />
      </ControlButton>
    </div>
  );
};

export default ControlBar;
