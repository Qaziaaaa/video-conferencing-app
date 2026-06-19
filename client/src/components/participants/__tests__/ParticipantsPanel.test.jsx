import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParticipantsPanel from '../ParticipantsPanel';
import useMeetingStore from '../../../store/useMeetingStore';

const addParticipant = (overrides) => {
  const p = {
    socketId: `s-${Date.now()}-${Math.random()}`,
    displayName: 'User',
    isMuted: false,
    isCameraOff: false,
    isHandRaised: false,
    isHost: false,
    ...overrides,
  };
  useMeetingStore.getState().upsertParticipant(p.socketId, p);
  return p;
};

describe('ParticipantsPanel', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
  });

  test('renders empty state when no participants', () => {
    render(<ParticipantsPanel isOpen={true} onClose={vi.fn()} onKick={vi.fn()} />);
    expect(screen.getByText(/no participants yet/i)).toBeInTheDocument();
  });

  test('renders participant count', () => {
    addParticipant({ displayName: 'Alice' });
    addParticipant({ displayName: 'Bob' });
    render(<ParticipantsPanel isOpen={true} onClose={vi.fn()} onKick={vi.fn()} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  test('renders sorted participants (host first, then alphabetical)', () => {
    addParticipant({ socketId: 's1', displayName: 'Charlie', isHost: false });
    addParticipant({ socketId: 's2', displayName: 'Alice', isHost: true });
    addParticipant({ socketId: 's3', displayName: 'Bob', isHost: false });
    render(<ParticipantsPanel isOpen={true} onClose={vi.fn()} onKick={vi.fn()} />);
    const names = screen.getAllByText(/Alice|Bob|Charlie/);
    expect(names[0]).toHaveTextContent('Alice');
  });

  test('hidden when isOpen is false', () => {
    const { container } = render(<ParticipantsPanel isOpen={false} onClose={vi.fn()} onKick={vi.fn()} />);
    expect(container.querySelector('[class*="translate-x-full"]')).toBeTruthy();
  });
});
