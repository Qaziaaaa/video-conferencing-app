import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useParticipants } from '../useParticipants';
import useMeetingStore from '../../store/useMeetingStore';

const createMockSocket = () => ({
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
});

describe('useParticipants', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
  });

  test('subscribes to all 6 participant events', () => {
    const socket = createMockSocket();
    renderHook(() => useParticipants(socket));
    expect(socket.on).toHaveBeenCalledWith('participant-media-state', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('raise-hand', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('lower-hand', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('screen-share-started', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('screen-share-stopped', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('host-changed', expect.any(Function));
  });

  test('unsubscribes all on unmount', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useParticipants(socket));
    unmount();
    expect(socket.off).toHaveBeenCalledTimes(6);
  });

  test('participant-media-state updates store', () => {
    const socket = createMockSocket();
    const spy = vi.spyOn(useMeetingStore.getState(), 'upsertParticipant');
    renderHook(() => useParticipants(socket));

    const handler = socket.on.mock.calls.find(([e]) => e === 'participant-media-state')?.[1];
    handler({ socketId: 's1', isMuted: true, isCameraOff: false });
    expect(spy).toHaveBeenCalledWith('s1', { isMuted: true, isCameraOff: false });
  });

  test('raise-hand updates store', () => {
    const socket = createMockSocket();
    const spy = vi.spyOn(useMeetingStore.getState(), 'upsertParticipant');
    renderHook(() => useParticipants(socket));

    const handler = socket.on.mock.calls.find(([e]) => e === 'raise-hand')?.[1];
    handler({ socketId: 's1' });
    expect(spy).toHaveBeenCalledWith('s1', { isHandRaised: true });
  });

  test('lower-hand updates store', () => {
    const socket = createMockSocket();
    const spy = vi.spyOn(useMeetingStore.getState(), 'upsertParticipant');
    renderHook(() => useParticipants(socket));

    const handler = socket.on.mock.calls.find(([e]) => e === 'lower-hand')?.[1];
    handler({ socketId: 's1' });
    expect(spy).toHaveBeenCalledWith('s1', { isHandRaised: false });
  });

  test('screen-share-started updates store and activeScreenShare', () => {
    const socket = createMockSocket();
    const upsertSpy = vi.spyOn(useMeetingStore.getState(), 'upsertParticipant');
    const activeSpy = vi.spyOn(useMeetingStore.getState(), 'setActiveScreenShare');
    renderHook(() => useParticipants(socket));

    const handler = socket.on.mock.calls.find(([e]) => e === 'screen-share-started')?.[1];
    handler({ socketId: 's1' });
    expect(upsertSpy).toHaveBeenCalledWith('s1', { isScreenSharing: true });
    expect(activeSpy).toHaveBeenCalledWith('s1');
  });

  test('screen-share-stopped updates store and clears activeScreenShare', () => {
    const socket = createMockSocket();
    const upsertSpy = vi.spyOn(useMeetingStore.getState(), 'upsertParticipant');
    const activeSpy = vi.spyOn(useMeetingStore.getState(), 'setActiveScreenShare');
    renderHook(() => useParticipants(socket));

    const handler = socket.on.mock.calls.find(([e]) => e === 'screen-share-stopped')?.[1];
    handler({ socketId: 's1' });
    expect(upsertSpy).toHaveBeenCalledWith('s1', { isScreenSharing: false });
    expect(activeSpy).toHaveBeenCalledWith(null);
  });

  test('host-changed updates all participants and local host', () => {
    const socket = createMockSocket();
    useMeetingStore.getState().upsertParticipant('s1', { displayName: 'A' });
    useMeetingStore.getState().upsertParticipant('s2', { displayName: 'B' });
    useMeetingStore.getState().setLocalSocketId('s2');
    const spy = vi.spyOn(useMeetingStore.getState(), 'upsertParticipant');
    const setHostSpy = vi.spyOn(useMeetingStore.getState(), 'setHost');
    renderHook(() => useParticipants(socket));

    const handler = socket.on.mock.calls.find(([e]) => e === 'host-changed')?.[1];
    handler({ newHostSocketId: 's2' });

    expect(spy).toHaveBeenCalledWith('s1', { isHost: false });
    expect(spy).toHaveBeenCalledWith('s2', { isHost: true });
    expect(setHostSpy).toHaveBeenCalledWith(true);
  });
});
