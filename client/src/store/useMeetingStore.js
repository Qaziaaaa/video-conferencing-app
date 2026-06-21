import { create } from 'zustand';

const SESSION_KEY = 'meetspace_session';

const loadSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveSession = (data) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable
  }
};

const persisted = loadSession();

const useMeetingStore = create((set, get) => ({
  // Identity
  meetingId: persisted.meetingId || null,
  localSocketId: null,
  displayName: persisted.displayName || '',
  isHost: false,

  // Media streams
  localStream: null,
  screenShareStream: null,
  remoteStreams: {},        // socketId -> MediaStream
  connectionStates: {},    // socketId -> 'connecting' | 'connected' | 'failed'

  // Participant metadata (synced via socket events)
  // socketId -> { socketId, displayName, isMuted, isCameraOff, isHandRaised, isScreenSharing, isHost }
  participants: {},

  // Local media state
  isMicOn: true,
  isCamOn: true,
  isScreenSharing: false,
  isHandRaised: false,
  isBlurred: false,

  // Connection/error state
  connectionStatus: 'disconnected',
  mediaError: null,

  // Active screen sharer (socketId or null)
  activeScreenShareSocketId: null,

  // Dominant speaker
  dominantSpeakerSocketId: null,

  // Screen share version bump — forces video elements to refresh on replaceTrack
  screenShareVersion: 0,

  // Recording
  isRecording: false,
  recordingError: null,

  // Pinned participant
  pinnedSocketId: null,

  // Active emoji reactions (array of { id, emoji, socketId, displayName, createdAt })
  reactions: [],

  // Room lock state
  isRoomLocked: false,

  // Meeting password requirement
  passwordRequired: false,

  // --- Actions ---

  setMeetingId: (id) => {
    set({ meetingId: id });
    saveSession({ ...loadSession(), meetingId: id });
  },
  setLocalSocketId: (id) => set({ localSocketId: id }),
  setDisplayName: (name) => {
    set({ displayName: name });
    saveSession({ ...loadSession(), displayName: name });
  },
  setHost: (isHost) => set({ isHost }),
  setIsRecording: (val) => set({ isRecording: val }),
  setRecordingError: (err) => set({ recordingError: err }),

  setLocalStream: (stream) => set({ localStream: stream }),
  setScreenShareStream: (stream) => set({ screenShareStream: stream }),

  setRemoteStream: (socketId, stream) =>
    set((state) => ({
      remoteStreams: { ...state.remoteStreams, [socketId]: stream },
    })),

  removeRemoteStream: (socketId) =>
    set((state) => {
      const newStreams = { ...state.remoteStreams };
      delete newStreams[socketId];
      return { remoteStreams: newStreams };
    }),

  setConnectionState: (socketId, connectionState) =>
    set((state) => ({
      connectionStates: { ...state.connectionStates, [socketId]: connectionState },
    })),

  removeConnectionState: (socketId) =>
    set((state) => {
      const newStates = { ...state.connectionStates };
      delete newStates[socketId];
      return { connectionStates: newStates };
    }),

  upsertParticipant: (socketId, meta) =>
    set((state) => ({
      participants: { ...state.participants, [socketId]: { ...state.participants[socketId], ...meta } },
    })),

  removeParticipant: (socketId) =>
    set((state) => {
      const newParticipants = { ...state.participants };
      delete newParticipants[socketId];
      return { participants: newParticipants };
    }),

  setParticipants: (participantsArray) => {
    const map = {};
    participantsArray.forEach((p) => { map[p.socketId] = p; });
    set({ participants: map });
  },

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setMediaError: (error) => set({ mediaError: error }),

  toggleMic: () => {
    const { localStream, isMicOn } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    set({ isMicOn: !isMicOn });
  },

  toggleCam: () => {
    const { localStream, isCamOn } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCamOn;
      });
    }
    set({ isCamOn: !isCamOn });
  },

  setScreenSharing: (active) => set({ isScreenSharing: active }),
  toggleHand: () => set((state) => ({ isHandRaised: !state.isHandRaised })),
  toggleBlur: () => set((state) => ({ isBlurred: !state.isBlurred })),

  setActiveScreenShare: (socketId) =>
    set((state) => ({ activeScreenShareSocketId: socketId, screenShareVersion: state.screenShareVersion + 1 })),
  setDominantSpeaker: (socketId) => set({ dominantSpeakerSocketId: socketId }),

  setPinnedParticipant: (socketId) => set({ pinnedSocketId: socketId }),
  clearPinnedParticipant: () => set({ pinnedSocketId: null }),

  addReaction: (emoji, socketId, displayName) => {
    const id = `reaction-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const reaction = { id, emoji, socketId, displayName, createdAt: Date.now() };
    set((state) => ({ reactions: [...state.reactions, reaction] }));
    // Auto-remove after 2s
    setTimeout(() => {
      set((state) => ({
        reactions: state.reactions.filter((r) => r.id !== id),
      }));
    }, 2000);
  },

  setRoomLocked: (locked) => set({ isRoomLocked: locked }),
  setPasswordRequired: (required) => set({ passwordRequired: required }),

  // Full reset when leaving a meeting
  reset: () => {
    sessionStorage.removeItem(SESSION_KEY);
    set({
      meetingId: null,
      localSocketId: null,
      displayName: '',
      isHost: false,
      localStream: null,
      screenShareStream: null,
      remoteStreams: {},
      connectionStates: {},
      participants: {},
      isMicOn: true,
      isCamOn: true,
      isScreenSharing: false,
      isHandRaised: false,
      connectionStatus: 'disconnected',
      mediaError: null,
      activeScreenShareSocketId: null,
      dominantSpeakerSocketId: null,
      isBlurred: false,
      isRecording: false,
      recordingError: null,
      pinnedSocketId: null,
      reactions: [],
      isRoomLocked: false,
      passwordRequired: false,
    });
  },
}));

export default useMeetingStore;
