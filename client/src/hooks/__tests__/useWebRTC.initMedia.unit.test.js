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
  id: 'mock-socket-id',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

const fireConnect = async () => {
  if (mockSocketHandlers['connect']) {
    await mockSocketHandlers['connect']();
  }
};

function createMockStream(tracks = []) {
  return {
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter(t => t.kind === 'video'),
    getAudioTracks: () => tracks.filter(t => t.kind === 'audio'),
    active: true,
  };
}

describe('useWebRTC.initMedia unit tests (Task 7.4)', () => {
  beforeEach(() => {
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    useMeetingStore.getState().reset();

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    useMeetingStore.getState().reset();
  });

  const renderHookAndConnect = async () => {
    const mod = await import('../useWebRTC.js');
    await act(async () => {
      renderHook(() => mod.useWebRTC());
    });
    await act(async () => {
      await fireConnect();
    });
  };

  test('calls getUserMedia with ideal width/height constraints when no existing stream in store', async () => {
    const stream = createMockStream([
      { kind: 'video', enabled: true, stop: vi.fn() },
      { kind: 'audio', enabled: true, stop: vi.fn() },
    ]);
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(stream);

    useMeetingStore.getState().setMeetingId('test-room');
    useMeetingStore.getState().setDisplayName('TestUser');

    await renderHookAndConnect();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    const constraints = navigator.mediaDevices.getUserMedia.mock.calls[0][0];
    expect(constraints.video.width).toEqual({ ideal: 1280 });
    expect(constraints.video.height).toEqual({ ideal: 720 });
    expect(typeof constraints.video.width).toBe('object');
    expect(typeof constraints.video.height).toBe('object');
  });

  test('calls getUserMedia with facingMode: user in the video constraints', async () => {
    const stream = createMockStream([
      { kind: 'video', enabled: true, stop: vi.fn() },
      { kind: 'audio', enabled: true, stop: vi.fn() },
    ]);
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(stream);

    useMeetingStore.getState().setMeetingId('test-room');
    useMeetingStore.getState().setDisplayName('TestUser');

    await renderHookAndConnect();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    const constraints = navigator.mediaDevices.getUserMedia.mock.calls[0][0];
    expect(constraints.video.facingMode).toBe('user');
  });

  test('does NOT call getUserMedia when localStream.active === true in the store', async () => {
    const existingStream = createMockStream([
      { kind: 'video', enabled: true, stop: vi.fn() },
    ]);
    useMeetingStore.getState().setLocalStream(existingStream);
    useMeetingStore.getState().setMeetingId('test-room');
    useMeetingStore.getState().setDisplayName('TestUser');

    await renderHookAndConnect();

    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  test('calls getUserMedia when existing stream is not active', async () => {
    const inactiveStream = { ...createMockStream(), active: false, getTracks: () => [] };
    useMeetingStore.getState().setLocalStream(inactiveStream);
    useMeetingStore.getState().setMeetingId('test-room');
    useMeetingStore.getState().setDisplayName('TestUser');

    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(
      createMockStream([{ kind: 'video', enabled: true, stop: vi.fn() }])
    );

    await renderHookAndConnect();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  test('falls back to audio-only when getUserMedia fails with NotReadableError', async () => {
    const notReadableError = new Error('Could not start video source');
    notReadableError.name = 'NotReadableError';

    const audioOnlyStream = createMockStream([
      { kind: 'audio', enabled: true, stop: vi.fn() },
    ]);

    navigator.mediaDevices.getUserMedia = vi.fn()
      .mockRejectedValueOnce(notReadableError)
      .mockResolvedValue(audioOnlyStream);

    useMeetingStore.getState().setMeetingId('test-room');
    useMeetingStore.getState().setDisplayName('TestUser');

    await renderHookAndConnect();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    const firstCall = navigator.mediaDevices.getUserMedia.mock.calls[0][0];
    expect(firstCall.video).toBeTruthy();
    const secondCall = navigator.mediaDevices.getUserMedia.mock.calls[1][0];
    expect(secondCall.video).toBeFalsy();
    expect(secondCall.audio).toBe(true);
  });

  test('stores video track for screen share restore', async () => {
    const videoTrack = { kind: 'video', enabled: true, stop: vi.fn() };
    const stream = createMockStream([videoTrack, { kind: 'audio', enabled: true, stop: vi.fn() }]);
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(stream);

    useMeetingStore.getState().setMeetingId('test-room');
    useMeetingStore.getState().setDisplayName('TestUser');

    await renderHookAndConnect();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });
});
