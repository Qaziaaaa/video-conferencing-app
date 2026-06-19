import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantRow from '../ParticipantRow';

const baseParticipant = {
  socketId: 's1',
  displayName: 'Alice',
  isMuted: false,
  isCameraOff: false,
  isHandRaised: false,
  isHost: false,
};

describe('ParticipantRow', () => {
  test('renders display name', () => {
    render(<ParticipantRow participant={baseParticipant} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('shows (You) for current user', () => {
    render(<ParticipantRow participant={baseParticipant} isCurrentUser={true} />);
    expect(screen.getByText(/you/i)).toBeInTheDocument();
  });

  test('shows kick button for host viewing another user', () => {
    const onKick = vi.fn();
    render(
      <ParticipantRow
        participant={baseParticipant}
        isViewerHost={true}
        isCurrentUser={false}
        onKick={onKick}
      />
    );
    expect(screen.getByLabelText(/remove alice/i)).toBeInTheDocument();
  });

  test('no kick button for own row', () => {
    render(
      <ParticipantRow
        participant={baseParticipant}
        isViewerHost={true}
        isCurrentUser={true}
        onKick={vi.fn()}
      />
    );
    expect(screen.queryByLabelText(/remove alice/i)).not.toBeInTheDocument();
  });

  test('no kick button when viewer is not host', () => {
    render(
      <ParticipantRow
        participant={baseParticipant}
        isViewerHost={false}
        isCurrentUser={false}
        onKick={vi.fn()}
      />
    );
    expect(screen.queryByLabelText(/remove alice/i)).not.toBeInTheDocument();
  });

  test('calls onKick with socketId', async () => {
    const onKick = vi.fn();
    const user = userEvent.setup();
    render(
      <ParticipantRow
        participant={baseParticipant}
        isViewerHost={true}
        isCurrentUser={false}
        onKick={onKick}
      />
    );
    await user.click(screen.getByLabelText(/remove alice/i));
    expect(onKick).toHaveBeenCalledWith('s1');
  });
});
