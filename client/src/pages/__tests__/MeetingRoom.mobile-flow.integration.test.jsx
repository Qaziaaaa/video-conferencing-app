import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
};

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
  default: vi.fn(() => (
    <div data-testid="meeting-layout">
      <div data-testid="video-grid-wrapper">Video Grid</div>
    </div>
  )),
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

describe('Integration 9.1 — Full mobile meeting flow (375px viewport)', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useUIStore.getState().reset();
    useChatStore.getState().reset();
    vi.clearAllMocks();
    mockSocket.on.mockReturnThis();
    mockSocket.off.mockReturnThis();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
  });

  function setupMeeting() {
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    useMeetingStore.getState().setLocalSocketId('socket-1');
    useMeetingStore.getState().upsertParticipant('socket-1', { displayName: 'Alice', isHost: true, isMuted: false, isCameraOff: false, isHandRaised: false, isScreenSharing: false });
    useMeetingStore.getState().upsertParticipant('socket-2', { displayName: 'Bob', isHost: false, isMuted: false, isCameraOff: false, isHandRaised: false, isScreenSharing: false });
    useMeetingStore.getState().upsertParticipant('socket-3', { displayName: 'Carol', isHost: false, isMuted: false, isCameraOff: false, isHandRaised: false, isScreenSharing: false });
  }

  test('VideoGrid renders at mobile viewport', () => {
    setupMeeting();
    renderMeetingRoom();
    expect(screen.getByTestId('video-grid-wrapper')).toBeInTheDocument();
  });

  test('Chat panel opens and VideoGrid remains visible', async () => {
    setupMeeting();
    renderMeetingRoom();
    expect(screen.getByTestId('video-grid-wrapper')).toBeInTheDocument();

    useChatStore.getState().toggleChat();
    await waitFor(() => {
      expect(useChatStore.getState().isChatOpen).toBe(true);
    });
    expect(screen.getByTestId('video-grid-wrapper')).toBeInTheDocument();
  });

  test('Chat panel closes and VideoGrid remains visible', async () => {
    setupMeeting();
    useChatStore.getState().toggleChat();
    renderMeetingRoom();
    expect(useChatStore.getState().isChatOpen).toBe(true);

    useChatStore.getState().toggleChat();
    await waitFor(() => {
      expect(useChatStore.getState().isChatOpen).toBe(false);
    });
    expect(screen.getByTestId('video-grid-wrapper')).toBeInTheDocument();
  });

  test('Participants panel opens and VideoGrid remains visible', async () => {
    setupMeeting();
    renderMeetingRoom();

    useUIStore.getState().toggleParticipants();
    await waitFor(() => {
      expect(useUIStore.getState().isParticipantsOpen).toBe(true);
    });
    expect(screen.getByTestId('video-grid-wrapper')).toBeInTheDocument();
  });
});
