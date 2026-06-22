import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MeetingRoom from '../MeetingRoom';
import useMeetingStore from '../../store/useMeetingStore';
import useUIStore from '../../store/useUIStore';
import useChatStore from '../../store/useChatStore';

const mockSocket = {
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'socket-test',
};

let capturedOnReact = null;

vi.mock('../../hooks/useWebRTC', () => ({
  useWebRTC: vi.fn(() => ({
    socket: mockSocket,
    replaceVideoTrack: vi.fn(),
    originalCameraTrackRef: { current: null },
  })),
}));

vi.mock('../../hooks/useChat', () => ({ useChat: vi.fn() }));
vi.mock('../../hooks/useParticipants', () => ({ useParticipants: vi.fn() }));
vi.mock('../../hooks/useNotifications', () => ({ useNotifications: vi.fn() }));
vi.mock('../../hooks/useKeyboardShortcuts', () => ({ useKeyboardShortcuts: vi.fn() }));
vi.mock('../../hooks/useScreenShare', () => ({
  useScreenShare: vi.fn(() => ({ startScreenShare: vi.fn(), stopScreenShare: vi.fn() })),
}));
vi.mock('../../hooks/useRecording', () => ({
  useRecording: vi.fn(() => ({ toggleRecording: vi.fn() })),
}));

vi.mock('../../components/layout/MeetingLayout', () => ({
  default: vi.fn(({ onReact }) => {
    capturedOnReact = onReact;
    return <div data-testid="meeting-layout" />;
  }),
}));

function renderMeetingRoom() {
  return render(
    <MemoryRouter initialEntries={['/meeting/m1/room']}>
      <Routes>
        <Route path="/meeting/:meetingId/room" element={<MeetingRoom />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Integration 9.2 — Lobby stream reuse flow', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useUIStore.getState().reset();
    useChatStore.getState().reset();
    vi.clearAllMocks();
    capturedOnReact = null;
    mockSocket.on.mockReturnThis();
    mockSocket.off.mockReturnThis();
  });

  afterEach(() => {
    cleanup();
  });

  test('initMedia reuses active localStream from store (PreJoinLobby -> MeetingRoom)', async () => {
    const videoTrack = { enabled: true, kind: 'video', stop: vi.fn() };
    const audioTrack = { enabled: true, kind: 'audio', stop: vi.fn() };
    const lobbyStream = {
      active: true,
      getVideoTracks: () => [videoTrack],
      getAudioTracks: () => [audioTrack],
      getTracks: () => [videoTrack, audioTrack],
    };

    const getUserMediaMock = vi.fn().mockResolvedValue({
      active: true,
      getVideoTracks: () => [{ kind: 'video', stop: vi.fn() }],
      getAudioTracks: () => [{ kind: 'audio', stop: vi.fn() }],
      getTracks: () => [],
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    });

    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    useMeetingStore.getState().setLocalSocketId('socket-test');
    useMeetingStore.getState().setLocalStream(lobbyStream);

    renderMeetingRoom();

    await waitFor(() => {
      expect(screen.getByTestId('meeting-layout')).toBeInTheDocument();
    });

    const storedStream = useMeetingStore.getState().localStream;
    expect(storedStream).toBe(lobbyStream);
    expect(storedStream.active).toBe(true);
    expect(storedStream.getVideoTracks().length).toBeGreaterThan(0);
  });

  test('handleReact emits emoji-reaction with correct displayName from store', async () => {
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    useMeetingStore.getState().setLocalSocketId('socket-test');
    renderMeetingRoom();
    expect(capturedOnReact).toBeTruthy();

    act(() => {
      capturedOnReact('🔥');
    });

    await waitFor(() => {
      const emojiCall = mockSocket.emit.mock.calls.find(([e]) => e === 'emoji-reaction');
      expect(emojiCall).toBeTruthy();
      expect(emojiCall[1].displayName).toBe('Alice');
    });
  });
});
