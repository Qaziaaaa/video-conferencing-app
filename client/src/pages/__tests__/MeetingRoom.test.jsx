import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const mockUseScreenShare = { startScreenShare: vi.fn(), stopScreenShare: vi.fn() };

vi.mock('../../hooks/useWebRTC', () => ({
  useWebRTC: vi.fn(() => ({
    socket: mockSocket,
    replaceVideoTrack: vi.fn(),
    originalCameraTrackRef: { current: null },
  })),
}));

vi.mock('../../hooks/useChat', () => ({
  useChat: vi.fn(),
}));

vi.mock('../../hooks/useParticipants', () => ({
  useParticipants: vi.fn(),
}));

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('../../hooks/useScreenShare', () => ({
  useScreenShare: vi.fn(() => mockUseScreenShare),
}));

vi.mock('../../components/layout/MeetingLayout', () => ({
  default: vi.fn(({ onToggleMic, onToggleCam, onToggleHand, onToggleScreenShare, onLeave, onKickParticipant, socket }) => (
    <div data-testid="meeting-layout">
      <button onClick={onToggleMic} data-testid="toggle-mic">Toggle Mic</button>
      <button onClick={onToggleCam} data-testid="toggle-cam">Toggle Cam</button>
      <button onClick={onToggleHand} data-testid="toggle-hand">Toggle Hand</button>
      <button onClick={onToggleScreenShare} data-testid="toggle-screen">Toggle Screen</button>
      <button onClick={onLeave} data-testid="leave">Leave</button>
      <button onClick={() => onKickParticipant('target1')} data-testid="kick">Kick</button>
      <span data-testid="socket-present">{socket ? 'yes' : 'no'}</span>
    </div>
  )),
}));

const renderMeetingRoom = (meetingId = 'm1') =>
  render(
    <MemoryRouter initialEntries={[`/meeting/${meetingId}/room`]}>
      <Routes>
        <Route path="/meeting/:meetingId/room" element={<MeetingRoom />} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('MeetingRoom', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useUIStore.getState().reset();
    useChatStore.getState().reset();
    vi.clearAllMocks();
  });

  test('renders MeetingLayout when meetingId is set', () => {
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    renderMeetingRoom();
    expect(screen.getByTestId('meeting-layout')).toBeInTheDocument();
  });

  test('passes socket to layout', () => {
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    renderMeetingRoom();
    expect(screen.getByTestId('socket-present').textContent).toBe('yes');
  });

  test('redirects to home when meetingId is null', async () => {
    renderMeetingRoom();
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  test('returns null if meetingId is falsy before redirect', async () => {
    renderMeetingRoom();
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  test('handleToggleMic emits participant-media-state', async () => {
    const user = userEvent.setup();
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    // Start with mic on
    useMeetingStore.getState().toggleMic(); // toggles to off
    useMeetingStore.getState().toggleMic(); // back to on
    renderMeetingRoom();
    await user.click(screen.getByTestId('toggle-mic'));
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('participant-media-state', {
        meetingId: 'm1',
        isMuted: true,
        isCameraOff: false,
      });
    });
  });

  test('handleToggleCam emits participant-media-state', async () => {
    const user = userEvent.setup();
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    renderMeetingRoom();
    await user.click(screen.getByTestId('toggle-cam'));
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('participant-media-state', {
        meetingId: 'm1',
        isMuted: false,
        isCameraOff: true,
      });
    });
  });

  test('handleToggleHand raises hand via socket', async () => {
    const user = userEvent.setup();
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    renderMeetingRoom();
    await user.click(screen.getByTestId('toggle-hand'));
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('raise-hand', {
        meetingId: 'm1',
        displayName: 'Alice',
      });
    });
  });

  test('handleToggleHand lowers hand when already raised', async () => {
    const user = userEvent.setup();
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    useMeetingStore.getState().toggleHand();
    renderMeetingRoom();
    await user.click(screen.getByTestId('toggle-hand'));
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('lower-hand', {
        meetingId: 'm1',
      });
    });
  });

  test('handleToggleScreenShare starts screen share', async () => {
    const user = userEvent.setup();
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    renderMeetingRoom();
    await user.click(screen.getByTestId('toggle-screen'));
    expect(mockUseScreenShare.startScreenShare).toHaveBeenCalled();
  });

  test('handleToggleScreenShare stops screen share', async () => {
    const user = userEvent.setup();
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    useMeetingStore.getState().setScreenSharing(true);
    renderMeetingRoom();
    await user.click(screen.getByTestId('toggle-screen'));
    expect(mockUseScreenShare.stopScreenShare).toHaveBeenCalled();
  });

  test('handleKickParticipant emits kick-participant', async () => {
    const user = userEvent.setup();
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    renderMeetingRoom();
    await user.click(screen.getByTestId('kick'));
    expect(mockSocket.emit).toHaveBeenCalledWith('kick-participant', {
      meetingId: 'm1',
      targetSocketId: 'target1',
    });
  });

  test('handleLeave emits leave-room, disconnects socket, resets stores, navigates home', async () => {
    const user = userEvent.setup();
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    useUIStore.getState().showConfirmLeave();
    renderMeetingRoom();
    await user.click(screen.getByTestId('leave'));
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-room', { meetingId: 'm1' });
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(useMeetingStore.getState().meetingId).toBeNull();
      expect(useUIStore.getState().isConfirmLeaveOpen).toBe(false);
    });
  });

  test('calls useChat with socket', async () => {
    const { useChat } = await import('../../hooks/useChat');
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    renderMeetingRoom();
    expect(useChat).toHaveBeenCalledWith(mockSocket);
  });

  test('calls useParticipants with socket', async () => {
    const { useParticipants } = await import('../../hooks/useParticipants');
    useMeetingStore.getState().setMeetingId('m1');
    useMeetingStore.getState().setDisplayName('Alice');
    renderMeetingRoom();
    expect(useParticipants).toHaveBeenCalledWith(mockSocket);
  });
});
