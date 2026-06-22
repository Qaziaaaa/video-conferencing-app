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

let capturedOnReact = null;

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

describe('Integration 9.3 — Emoji reaction end-to-end', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useUIStore.getState().reset();
    useChatStore.getState().reset();
    vi.clearAllMocks();
    capturedOnReact = null;
    mockSocket.on.mockReturnThis();
    mockSocket.off.mockReturnThis();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  test('handleReact adds reaction to store', async () => {
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    useMeetingStore.getState().setLocalSocketId('socket-test');
    renderMeetingRoom();
    expect(capturedOnReact).toBeTruthy();

    act(() => {
      capturedOnReact('👍');
    });

    await waitFor(() => {
      const reactions = useMeetingStore.getState().reactions;
      expect(reactions.length).toBeGreaterThan(0);
      expect(reactions[0].emoji).toBe('👍');
      expect(reactions[0].displayName).toBe('Alice');
    });
  });

  test('handleReact emits emoji-reaction socket event with correct payload', async () => {
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
      expect(emojiCall[1]).toMatchObject({
        meetingId: 'm1',
        emoji: '🔥',
        displayName: 'Alice',
      });
    });
  });

  test('multiple reactions accumulate in store', async () => {
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Bob');
    useMeetingStore.getState().setLocalSocketId('socket-test');
    renderMeetingRoom();
    expect(capturedOnReact).toBeTruthy();

    act(() => { capturedOnReact('❤️'); });
    act(() => { capturedOnReact('🎉'); });
    act(() => { capturedOnReact('🔥'); });

    await waitFor(() => {
      const reactions = useMeetingStore.getState().reactions;
      expect(reactions.length).toBe(3);
      expect(reactions[2].emoji).toBe('🔥');
    });
  });
});
