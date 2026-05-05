import { create } from 'zustand';

const useMeetingStore = create((set, get) => ({
  // Identity
  meetingId: null,
  localSocketId: null,
  displayName: '',
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

  // Connection/error state
  connectionStatus: 'disconnected',
  mediaError: null,

  // Active screen sharer (socketId or null)
  activeScreenShareSocketId: null,

  // Dominant speaker
  dominantSpeakerSocketId: null,

  // --- Actions ---

  setMeetingId: (id) => set({ meetingId: id }),
  setLocalSocketId: (id) => set({ localSocketId: id }),
  setDisplayName: (name) => set({ displayName: name }),
  setHost: (isHost) => set({ isHost }),

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

  setActiveScreenShare: (socketId) => set({ activeScreenShareSocketId: socketId }),
  setDominantSpeaker: (socketId) => set({ dominantSpeakerSocketId: socketId }),

  // Full reset when leaving a meeting
  reset: () =>
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
    }),
}));

export default useMeetingStore;
