import React from 'react';
import {
  Mic, MicOff,
  Video, VideoOff,
  MonitorUp, MonitorOff,
  Hand,
  MessageSquare,
  Users,
  PhoneOff,
  Wand2,
  Circle,
  Lock,
  Unlock,
  Pin,
} from 'lucide-react';
import ReactionPicker from './ReactionPicker';

const ControlButton = ({
  onClick,
  ariaLabel,
  active = true,
  danger = false,
  toggled = false,
  badge = null,
  children,
  className = '',
}) => {
  let style = 'bg-white/8 hover:bg-white/14 text-white';
  if (danger) {
    style = 'bg-danger hover:bg-[#dc2626] text-white shadow-lg shadow-danger/25';
  } else if (toggled) {
    style = 'bg-accent-soft text-accent hover:bg-accent/20';
  } else if (!active) {
    style = 'bg-danger-soft hover:bg-danger/30 text-danger';
  }

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base ${style} ${className}`}
    >
      {children}
      {badge !== null && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-[scaleIn_0.15s_ease-out]">
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
  isBlurred,
  isRecording,
  isChatOpen,
  isParticipantsOpen,
  unreadChatCount,
  participantCount,
  isRoomLocked,
  isHost,
  onToggleMic,
  onToggleCam,
  onToggleHand,
  onToggleScreenShare,
  onToggleBlur,
  onToggleRecording,
  onToggleChat,
  onToggleParticipants,
  onReact,
  onToggleLock,
  onLeave,
}) => {
  return (
    <div className="flex items-center justify-start md:justify-center gap-1.5 px-4 py-3 bg-surface/80 backdrop-blur-xl border-t border-border overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] rounded-xl border border-white/[0.03] shrink-0">
        <ControlButton
          onClick={onToggleMic}
          ariaLabel={isMicOn ? 'Mute microphone (M)' : 'Unmute microphone (M)'}
          active={isMicOn}
        >
          {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        </ControlButton>

        <ControlButton
          onClick={onToggleCam}
          ariaLabel={isCamOn ? 'Turn off camera (V)' : 'Turn on camera (V)'}
          active={isCamOn}
        >
          {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
        </ControlButton>

        <div className="w-px h-6 bg-white/[0.04] mx-0.5" />

        <ControlButton
          onClick={onToggleScreenShare}
          ariaLabel={isScreenSharing ? 'Stop presenting' : 'Present screen'}
          active={!isScreenSharing}
          toggled={isScreenSharing}
        >
          {isScreenSharing ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
        </ControlButton>

        <ControlButton
          onClick={onToggleHand}
          ariaLabel={isHandRaised ? 'Lower hand (H)' : 'Raise hand (H)'}
          active={!isHandRaised}
          toggled={isHandRaised}
          className={isHandRaised ? 'bg-warning-soft text-warning hover:bg-warning/20' : ''}
        >
          <Hand size={18} />
        </ControlButton>

        <ControlButton
          onClick={onToggleBlur}
          ariaLabel={isBlurred ? 'Disable background blur' : 'Enable background blur'}
          active={!isBlurred}
          toggled={isBlurred}
          className={isBlurred ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] hover:bg-[#8b5cf6]/30' : ''}
        >
          <Wand2 size={18} />
        </ControlButton>

        <ControlButton
          onClick={onToggleRecording}
          ariaLabel={isRecording ? 'Stop recording' : 'Start recording'}
          active={!isRecording}
          className={isRecording ? 'bg-danger-soft text-danger hover:bg-danger/30' : ''}
        >
          <Circle size={18} className={isRecording ? 'animate-[pulseRecording_1.5s_ease-in-out_infinite]' : ''} />
        </ControlButton>

        <div className="w-px h-6 bg-white/[0.04] mx-0.5" />

        <ReactionPicker onReact={onReact} />
      </div>

      <div className="w-3" />

      <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] rounded-xl border border-white/[0.03]">
        <ControlButton
          onClick={onToggleChat}
          ariaLabel={isChatOpen ? 'Close chat' : 'Open chat'}
          active={true}
          toggled={isChatOpen}
          badge={unreadChatCount}
        >
          <MessageSquare size={18} />
        </ControlButton>

        <ControlButton
          onClick={onToggleParticipants}
          ariaLabel={isParticipantsOpen ? 'Close participants' : `Show participants (${participantCount})`}
          active={true}
          toggled={isParticipantsOpen}
          badge={participantCount}
        >
          <Users size={18} />
        </ControlButton>

        {isHost && (
          <ControlButton
            onClick={onToggleLock}
            ariaLabel={isRoomLocked ? 'Unlock meeting' : 'Lock meeting'}
            active={true}
            toggled={isRoomLocked}
            className={isRoomLocked ? 'bg-warning-soft text-warning hover:bg-warning/20' : ''}
          >
            {isRoomLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </ControlButton>
        )}
      </div>

      <div className="w-3" />

      <ControlButton
        onClick={onLeave}
        ariaLabel="Leave meeting"
        danger={true}
      >
        <PhoneOff size={18} />
      </ControlButton>
    </div>
  );
};

export default ControlBar;
