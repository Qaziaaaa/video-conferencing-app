import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdmissionPanel from '../AdmissionPanel';
import useMeetingStore from '../../../store/useMeetingStore';

const createMockSocket = () => ({ emit: vi.fn() });

const addParticipant = (overrides) => {
  const p = {
    socketId: `s-${Date.now()}-${Math.random()}`,
    displayName: 'Alice',
    isWaiting: true,
    ...overrides,
  };
  useMeetingStore.getState().upsertParticipant(p.socketId, p);
  return p;
};

describe('AdmissionPanel', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useMeetingStore.getState().setMeetingId('room1');
    useMeetingStore.getState().setHost(true);
  });

  test('renders nothing when no waiting participants', () => {
    const { container } = render(<AdmissionPanel socket={createMockSocket()} />);
    expect(container.innerHTML).toBe('');
  });

  test('renders waiting count with participants', () => {
    addParticipant({ displayName: 'Bob' });
    render(<AdmissionPanel socket={createMockSocket()} />);
    expect(screen.getByText(/1 waiting to join/i)).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  test('renders nothing when not host', () => {
    useMeetingStore.getState().setHost(false);
    addParticipant({ displayName: 'Bob' });
    const { container } = render(<AdmissionPanel socket={createMockSocket()} />);
    expect(container.innerHTML).toBe('');
  });

  test('calls socket.emit on admit', async () => {
    const socket = createMockSocket();
    const p = addParticipant({ displayName: 'Charlie' });
    useMeetingStore.getState().setMeetingId('room1');
    const user = userEvent.setup();
    render(<AdmissionPanel socket={socket} />);
    await user.click(screen.getByLabelText(/admit charlie/i));
    expect(socket.emit).toHaveBeenCalledWith('admit-participant', {
      meetingId: 'room1',
      targetSocketId: p.socketId,
    });
  });

  test('calls socket.emit on deny', async () => {
    const socket = createMockSocket();
    addParticipant({ displayName: 'Dave' });
    useMeetingStore.getState().setMeetingId('room1');
    const user = userEvent.setup();
    render(<AdmissionPanel socket={socket} />);
    await user.click(screen.getByLabelText(/deny dave/i));
    expect(socket.emit).toHaveBeenCalledWith('deny-participant', {
      meetingId: 'room1',
      targetSocketId: expect.any(String),
    });
  });
});
