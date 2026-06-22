import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMeetingStore from '../../store/useMeetingStore';

const mockSocketHandlers = {};
const mockSocket = {
  on: vi.fn((event, handler) => {
    mockSocketHandlers[event] = handler;
    return mockSocket;
  }),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'mock-socket-desktop-capture',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

const fireConnect = async () => {
  if (mockSocketHandlers['connect']) {
    const handler = mockSocketHandlers['connect'];
    await handler();
  }
};

function makeDesktopStream(width, height) {
  const videoTrack = {
    kind: 'video',
    stop: vi.fn(),
    enabled: true,
    getSettings: () => ({ width, height }),
  };
  const audioTrack = { kind: 'audio', stop: vi.fn(), enabled: true };
  return {
    active: true,
    getTracks: () => [videoTrack, audioTrack],
    getVideoTracks: () => [videoTrack],
    getAudioTracks: () => [audioTrack],
  };
}

describe('Integration 9.7 — Desktop media capture quality regression', () => {
  let getUserMediaMock;

  beforeEach(() => {
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    useMeetingStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('initMedia calls getUserMedia with ideal constraints when no prior stream', async () => {
    const stream = makeDesktopStream(1280, 720);
    getUserMediaMock = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    });

    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');

    const { useWebRTC } = await import('../useWebRTC.js');

    await act(async () => {
      renderHook(() => useWebRTC());
    });

    await act(async () => {
      await fireConnect();
    });

    expect(getUserMediaMock).toHaveBeenCalled();

    const constraints = getUserMediaMock.mock.calls[0][0];
    expect(constraints.video.width).toEqual({ ideal: 1280 });
    expect(constraints.video.height).toEqual({ ideal: 720 });
    expect(constraints.video.facingMode).toBe('user');
    expect(constraints.audio).toBe(true);
  });

  test('initMedia resolves stream with video track at 1280x720 on capable hardware', async () => {
    const stream = makeDesktopStream(1280, 720);
    getUserMediaMock = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    });

    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');

    const { useWebRTC } = await import('../useWebRTC.js');

    await act(async () => {
      renderHook(() => useWebRTC());
    });

    await act(async () => {
      await fireConnect();
    });

    const storedStream = useMeetingStore.getState().localStream;
    expect(storedStream).not.toBeNull();
    const videoTracks = storedStream.getVideoTracks();
    expect(videoTracks.length).toBeGreaterThan(0);

    const settings = videoTracks[0].getSettings();
    expect(settings.width).toBe(1280);
    expect(settings.height).toBe(720);
  });

  test('initMedia does NOT call getUserMedia when active stream is already in store', async () => {
    const stream = makeDesktopStream(1280, 720);
    getUserMediaMock = vi.fn().mockResolvedValue(makeDesktopStream(640, 480));
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    });

    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    useMeetingStore.getState().setLocalStream(stream);

    const { useWebRTC } = await import('../useWebRTC.js');

    await act(async () => {
      renderHook(() => useWebRTC());
    });

    await act(async () => {
      await fireConnect();
    });

    expect(getUserMediaMock).not.toHaveBeenCalled();

    const storedStream = useMeetingStore.getState().localStream;
    expect(storedStream).toBe(stream);
    expect(storedStream.active).toBe(true);
  });
});
