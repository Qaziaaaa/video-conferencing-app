import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WaitingRoom from '../WaitingRoom';
import useMeetingStore from '../../store/useMeetingStore';

const waitingSocketRef = { current: null };

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    const handlers = {};
    const mockSocket = {
      on: vi.fn((event, handler) => {
        handlers[event] = handler;
        return mockSocket;
      }),
      emit: vi.fn(),
      disconnect: vi.fn(),
      getHandler: (event) => handlers[event],
    };
    waitingSocketRef.current = mockSocket;
    return mockSocket;
  }),
}));

const renderWaitingRoom = (meetingId = 'm1') =>
  render(
    <MemoryRouter initialEntries={[`/waiting/${meetingId}`]}>
      <Routes>
        <Route path="/waiting/:meetingId" element={<WaitingRoom />} />
        <Route path="/meeting/:meetingId/room" element={<div>Room Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('WaitingRoom', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    vi.clearAllMocks();
  });

  test('renders waiting message', () => {
    renderWaitingRoom();
    expect(screen.getByText('Waiting to be admitted')).toBeInTheDocument();
    expect(screen.getByText(/The host will let you in soon/i)).toBeInTheDocument();
  });

  test('displays meeting ID', () => {
    renderWaitingRoom('abc-456');
    expect(screen.getByText('abc-456')).toBeInTheDocument();
  });

  test('connects socket and emits join-room on connect', async () => {
    useMeetingStore.getState().setDisplayName('Bob');
    renderWaitingRoom('m1');
    const socket = waitingSocketRef.current;
    await act(() => { socket.getHandler('connect')(); });
    expect(socket.emit).toHaveBeenCalledWith('join-room', {
      meetingId: 'm1',
      displayName: 'Bob',
    });
  });

  test('uses Guest as displayName fallback', async () => {
    renderWaitingRoom('m1');
    const socket = waitingSocketRef.current;
    await act(() => { socket.getHandler('connect')(); });
    expect(socket.emit).toHaveBeenCalledWith('join-room', {
      meetingId: 'm1',
      displayName: 'Guest',
    });
  });

  test('navigates to room on admitted event', async () => {
    renderWaitingRoom('m1');
    const socket = waitingSocketRef.current;
    await act(() => { socket.getHandler('admitted')(); });
    await waitFor(() => {
      expect(screen.getByText('Room Page')).toBeInTheDocument();
    });
  });

  test('shows denied screen on denied event', async () => {
    renderWaitingRoom('m1');
    const socket = waitingSocketRef.current;
    await act(() => { socket.getHandler('denied')(); });
    expect(screen.getByText('Request denied')).toBeInTheDocument();
    expect(screen.getByText(/host has declined/i)).toBeInTheDocument();
  });

  test('disconnects socket on denied', async () => {
    renderWaitingRoom('m1');
    const socket = waitingSocketRef.current;
    await act(() => { socket.getHandler('denied')(); });
    expect(socket.disconnect).toHaveBeenCalled();
  });

  test('disconnects socket on admitted', async () => {
    renderWaitingRoom('m1');
    const socket = waitingSocketRef.current;
    await act(() => { socket.getHandler('admitted')(); });
    expect(socket.disconnect).toHaveBeenCalled();
  });

  test('denied screen has go home button', async () => {
    renderWaitingRoom('m1');
    const socket = waitingSocketRef.current;
    await act(() => { socket.getHandler('denied')(); });
    expect(screen.getByText('Go home')).toBeInTheDocument();
  });

  test('go home navigates to home from denied screen', async () => {
    const user = userEvent.setup();
    renderWaitingRoom('m1');
    const socket = waitingSocketRef.current;
    await act(() => { socket.getHandler('denied')(); });
    await user.click(screen.getByText('Go home'));
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
