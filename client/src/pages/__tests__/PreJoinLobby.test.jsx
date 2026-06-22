import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PreJoinLobby from '../PreJoinLobby';
import useMeetingStore from '../../store/useMeetingStore';
import useAuthStore from '../../store/useAuthStore';

const renderPreJoinLobby = (meetingId = 'm1') =>
  render(
    <MemoryRouter initialEntries={[`/meeting/${meetingId}`]}>
      <Routes>
        <Route path="/meeting/:meetingId" element={<PreJoinLobby />} />
        <Route path="/meeting-not-found" element={<div>Meeting Not Found Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/meeting/:meetingId/room" element={<div>Room Page</div>} />
      </Routes>
    </MemoryRouter>
  );

const createMockStream = () => {
  const videoTrack = { enabled: true, kind: 'video', stop: vi.fn() };
  const audioTrack = { enabled: true, kind: 'audio', stop: vi.fn() };
  return {
    getVideoTracks: () => [videoTrack],
    getAudioTracks: () => [audioTrack],
    getTracks: () => [videoTrack, audioTrack],
    active: true,
  };
};

describe('PreJoinLobby', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useAuthStore.getState().clearAuth();
    vi.restoreAllMocks();
    // Default: mock getUserMedia to succeed
    const mockStream = createMockStream();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      configurable: true,
      writable: true,
    });
  });

  test('shows loading spinner while validating meeting', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    const { container } = renderPreJoinLobby();
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeTruthy();
  });

  test('redirects to meeting-not-found on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 404 });
    renderPreJoinLobby();
    await waitFor(() => {
      expect(screen.getByText('Meeting Not Found Page')).toBeInTheDocument();
    });
  });

  test('sets meeting valid when fetch succeeds', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    renderPreJoinLobby();
    await waitFor(() => {
      expect(screen.getByText('Ready to join?')).toBeInTheDocument();
    });
  });

  test('sets meeting valid when fetch throws (offline mode)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    renderPreJoinLobby();
    await waitFor(() => {
      expect(screen.getByText('Ready to join?')).toBeInTheDocument();
    });
  });

  test('renders meeting ID', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    renderPreJoinLobby('abc-123');
    await waitFor(() => {
      expect(screen.getByText('abc-123')).toBeInTheDocument();
    });
  });

  test('shows camera preview when media is available', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    await user.click(screen.getByText('Start camera'));
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });
  });

  test('shows media error when camera access denied', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    const deniedError = new Error('Permission denied');
    deniedError.name = 'NotAllowedError';
    navigator.mediaDevices.getUserMedia = vi.fn()
      .mockRejectedValueOnce(deniedError)
      .mockResolvedValue(createMockStream());
    renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    await user.click(screen.getByText('Start camera'));
    await waitFor(() => {
      expect(screen.getByText(/Camera and microphone access denied/i)).toBeInTheDocument();
    });
  });

  test('shows media error when no device found', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    const notFoundError = new Error('Not found');
    notFoundError.name = 'NotFoundError';
    navigator.mediaDevices.getUserMedia = vi.fn()
      .mockRejectedValueOnce(notFoundError)
      .mockResolvedValue(createMockStream());
    renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    await user.click(screen.getByText('Start camera'));
    await waitFor(() => {
      expect(screen.getByText(/No camera or microphone found/i)).toBeInTheDocument();
    });
  });

  test('toggles microphone on button click', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    await user.click(screen.getByText('Start camera'));
    await waitFor(() => screen.getByLabelText('Mute microphone'));
    const micBtn = screen.getByLabelText('Mute microphone');
    await user.click(micBtn);
    expect(screen.getByLabelText('Unmute microphone')).toBeInTheDocument();
  });

  test('toggles camera on button click', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    await user.click(screen.getByText('Start camera'));
    await waitFor(() => screen.getByLabelText('Turn off camera'));
    const camBtn = screen.getByLabelText('Turn off camera');
    await user.click(camBtn);
    expect(screen.getByLabelText('Turn on camera')).toBeInTheDocument();
  });

  test('shows character count for display name', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    const input = screen.getByPlaceholderText('Enter your display name');
    await user.type(input, 'Alice');
    expect(screen.getByText(/5\/50/)).toBeInTheDocument();
  });

  test('join button is disabled when name is empty', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    expect(screen.getByText('Join now')).toBeDisabled();
  });

  test('join button is enabled when name is valid', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    useAuthStore.getState().setAuth('tok', 'uid', 'e@m.com', 'Alice');
    renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    const input = screen.getByPlaceholderText('Enter your display name');
    await user.clear(input);
    await user.type(input, 'Alice');
    const joinBtn = screen.getByText('Join now');
    expect(joinBtn).toBeEnabled();
  });

  test('join with auth navigates to room', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    useAuthStore.getState().setAuth('tok', 'uid', 'e@m.com', 'Alice');
    renderPreJoinLobby('m1');
    await waitFor(() => screen.getByText('Ready to join?'));
    const input = screen.getByPlaceholderText('Enter your display name');
    await user.clear(input);
    await user.type(input, 'Alice');
    await user.click(screen.getByText('Join now'));
    await waitFor(() => {
      expect(useMeetingStore.getState().meetingId).toBe('m1');
      expect(useMeetingStore.getState().displayName).toBe('Alice');
    });
  });

  test('join without auth navigates to login with redirect', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    renderPreJoinLobby('m1');
    await waitFor(() => screen.getByText('Ready to join?'));
    const input = screen.getByPlaceholderText('Enter your display name');
    await user.clear(input);
    await user.type(input, 'Guest');
    await user.click(screen.getByText('Join now'));
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });



  test('entering name with Enter triggers join', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    useAuthStore.getState().setAuth('tok', 'uid', 'e@m.com', 'Alice');
    renderPreJoinLobby('m1');
    await waitFor(() => screen.getByText('Ready to join?'));
    const input = screen.getByPlaceholderText('Enter your display name');
    await user.clear(input);
    await user.type(input, 'Alice{Enter}');
    await waitFor(() => {
      expect(useMeetingStore.getState().meetingId).toBe('m1');
    });
  });

  test('sets local stream in store on join', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    useAuthStore.getState().setAuth('tok', 'uid', 'e@m.com', 'Alice');
    renderPreJoinLobby('m1');
    await waitFor(() => screen.getByText('Ready to join?'));
    await user.click(screen.getByText('Start camera'));
    await waitFor(() => screen.getByLabelText('Mute microphone'));
    const input = screen.getByPlaceholderText('Enter your display name');
    await user.clear(input);
    await user.type(input, 'Alice');
    await user.click(screen.getByText('Join now'));
    await waitFor(() => {
      expect(useMeetingStore.getState().localStream).toBeTruthy();
    });
  });

  test('stops preview tracks on unmount', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    const mockStream = createMockStream();
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);
    const { unmount } = renderPreJoinLobby();
    await waitFor(() => screen.getByText('Ready to join?'));
    await user.click(screen.getByText('Start camera'));
    await waitFor(() => screen.getByLabelText('Mute microphone'));
    unmount();
    expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
    expect(mockStream.getTracks()[1].stop).toHaveBeenCalled();
  });

  test('does NOT stop stream tracks on unmount after joining (streamRef null-out fix)', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) });
    const mockStream = createMockStream();
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);
    useAuthStore.getState().setAuth('tok', 'uid', 'e@m.com', 'Alice');
    const { unmount } = renderPreJoinLobby('m1');
    await waitFor(() => screen.getByText('Ready to join?'));
    await user.click(screen.getByText('Start camera'));
    await waitFor(() => screen.getByLabelText('Mute microphone'));
    const input = screen.getByPlaceholderText('Enter your display name');
    await user.clear(input);
    await user.type(input, 'Alice');
    await user.click(screen.getByText('Join now'));
    await waitFor(() => {
      expect(useMeetingStore.getState().meetingId).toBe('m1');
    });
    unmount();
    expect(mockStream.getTracks()[0].stop).not.toHaveBeenCalled();
    expect(mockStream.getTracks()[1].stop).not.toHaveBeenCalled();
  });
});
