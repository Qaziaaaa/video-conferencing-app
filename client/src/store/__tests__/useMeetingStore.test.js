import { describe, test, expect, beforeEach, vi } from 'vitest';
import useMeetingStore from '../useMeetingStore';

const mockStream = {
  getAudioTracks: () => [{ enabled: true, kind: 'audio' }],
  getVideoTracks: () => [{ enabled: true, kind: 'video' }],
};

describe('useMeetingStore', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
  });

  test('initial state matches schema', () => {
    const s = useMeetingStore.getState();
    expect(s.meetingId).toBeNull();
    expect(s.localSocketId).toBeNull();
    expect(s.displayName).toBe('');
    expect(s.isHost).toBe(false);
    expect(s.localStream).toBeNull();
    expect(s.screenShareStream).toBeNull();
    expect(s.remoteStreams).toEqual({});
    expect(s.connectionStates).toEqual({});
    expect(s.participants).toEqual({});
    expect(s.isMicOn).toBe(true);
    expect(s.isCamOn).toBe(true);
    expect(s.isScreenSharing).toBe(false);
    expect(s.isHandRaised).toBe(false);
    expect(s.isBlurred).toBe(false);
    expect(s.connectionStatus).toBe('disconnected');
    expect(s.mediaError).toBeNull();
    expect(s.activeScreenShareSocketId).toBeNull();
    expect(s.dominantSpeakerSocketId).toBeNull();
  });

  test('setMeetingId', () => {
    useMeetingStore.getState().setMeetingId('abc');
    expect(useMeetingStore.getState().meetingId).toBe('abc');
  });

  test('setLocalSocketId', () => {
    useMeetingStore.getState().setLocalSocketId('sock1');
    expect(useMeetingStore.getState().localSocketId).toBe('sock1');
  });

  test('setDisplayName', () => {
    useMeetingStore.getState().setDisplayName('Alice');
    expect(useMeetingStore.getState().displayName).toBe('Alice');
  });

  test('setHost', () => {
    useMeetingStore.getState().setHost(true);
    expect(useMeetingStore.getState().isHost).toBe(true);
  });

  test('setLocalStream', () => {
    useMeetingStore.getState().setLocalStream(mockStream);
    expect(useMeetingStore.getState().localStream).toBe(mockStream);
  });

  test('setRemoteStream adds stream', () => {
    useMeetingStore.getState().setRemoteStream('s1', mockStream);
    expect(useMeetingStore.getState().remoteStreams.s1).toBe(mockStream);
  });

  test('removeRemoteStream deletes stream', () => {
    useMeetingStore.getState().setRemoteStream('s1', mockStream);
    useMeetingStore.getState().removeRemoteStream('s1');
    expect(useMeetingStore.getState().remoteStreams.s1).toBeUndefined();
  });

  test('setConnectionState', () => {
    useMeetingStore.getState().setConnectionState('s1', 'connected');
    expect(useMeetingStore.getState().connectionStates.s1).toBe('connected');
  });

  test('removeConnectionState', () => {
    useMeetingStore.getState().setConnectionState('s1', 'connected');
    useMeetingStore.getState().removeConnectionState('s1');
    expect(useMeetingStore.getState().connectionStates.s1).toBeUndefined();
  });

  test('upsertParticipant adds new participant', () => {
    useMeetingStore.getState().upsertParticipant('s1', { displayName: 'Alice', isMuted: false });
    expect(useMeetingStore.getState().participants.s1).toBeDefined();
    expect(useMeetingStore.getState().participants.s1.displayName).toBe('Alice');
  });

  test('upsertParticipant merges existing participant', () => {
    useMeetingStore.getState().upsertParticipant('s1', { displayName: 'Alice', isMuted: false });
    useMeetingStore.getState().upsertParticipant('s1', { isMuted: true });
    expect(useMeetingStore.getState().participants.s1.displayName).toBe('Alice');
    expect(useMeetingStore.getState().participants.s1.isMuted).toBe(true);
  });

  test('removeParticipant removes participant', () => {
    useMeetingStore.getState().upsertParticipant('s1', { displayName: 'Alice' });
    useMeetingStore.getState().removeParticipant('s1');
    expect(useMeetingStore.getState().participants.s1).toBeUndefined();
  });

  test('setParticipants from array builds map', () => {
    useMeetingStore.getState().setParticipants([
      { socketId: 's1', displayName: 'Alice' },
      { socketId: 's2', displayName: 'Bob' },
    ]);
    expect(Object.keys(useMeetingStore.getState().participants)).toHaveLength(2);
    expect(useMeetingStore.getState().participants.s1.displayName).toBe('Alice');
  });

  test('toggleMic flips isMicOn', () => {
    expect(useMeetingStore.getState().isMicOn).toBe(true);
    useMeetingStore.getState().toggleMic();
    expect(useMeetingStore.getState().isMicOn).toBe(false);
    useMeetingStore.getState().toggleMic();
    expect(useMeetingStore.getState().isMicOn).toBe(true);
  });

  test('toggleCam flips isCamOn', () => {
    expect(useMeetingStore.getState().isCamOn).toBe(true);
    useMeetingStore.getState().toggleCam();
    expect(useMeetingStore.getState().isCamOn).toBe(false);
  });

  test('toggleHand flips isHandRaised', () => {
    expect(useMeetingStore.getState().isHandRaised).toBe(false);
    useMeetingStore.getState().toggleHand();
    expect(useMeetingStore.getState().isHandRaised).toBe(true);
  });

  test('toggleBlur flips isBlurred', () => {
    expect(useMeetingStore.getState().isBlurred).toBe(false);
    useMeetingStore.getState().toggleBlur();
    expect(useMeetingStore.getState().isBlurred).toBe(true);
  });

  test('setScreenSharing', () => {
    useMeetingStore.getState().setScreenSharing(true);
    expect(useMeetingStore.getState().isScreenSharing).toBe(true);
  });

  test('setConnectionStatus', () => {
    useMeetingStore.getState().setConnectionStatus('connected');
    expect(useMeetingStore.getState().connectionStatus).toBe('connected');
  });

  test('setMediaError', () => {
    useMeetingStore.getState().setMediaError('Camera error');
    expect(useMeetingStore.getState().mediaError).toBe('Camera error');
  });

  test('setActiveScreenShare', () => {
    useMeetingStore.getState().setActiveScreenShare('s1');
    expect(useMeetingStore.getState().activeScreenShareSocketId).toBe('s1');
  });

  test('setDominantSpeaker', () => {
    useMeetingStore.getState().setDominantSpeaker('s1');
    expect(useMeetingStore.getState().dominantSpeakerSocketId).toBe('s1');
  });

  test('reset restores initial state', () => {
    useMeetingStore.getState().setMeetingId('abc');
    useMeetingStore.getState().setHost(true);
    useMeetingStore.getState().setMediaError('err');
    useMeetingStore.getState().reset();
    const s = useMeetingStore.getState();
    expect(s.meetingId).toBeNull();
    expect(s.isHost).toBe(false);
    expect(s.mediaError).toBeNull();
    expect(s.participants).toEqual({});
  });
});
