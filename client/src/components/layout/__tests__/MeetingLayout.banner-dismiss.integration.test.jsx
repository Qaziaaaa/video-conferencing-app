import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MeetingLayout from '../MeetingLayout';
import useChatStore from '../../../store/useChatStore';
import useUIStore from '../../../store/useUIStore';
import useMeetingStore from '../../../store/useMeetingStore';

vi.mock('../../video/VideoGrid', () => ({
  default: () => <div data-testid="video-grid" />,
}));
vi.mock('../../controls/ControlBar', () => ({
  default: () => <div data-testid="control-bar" />,
}));
vi.mock('../../chat/ChatPanel', () => ({
  default: () => <div data-testid="chat-panel" />,
}));
vi.mock('../../participants/ParticipantsPanel', () => ({
  default: () => <div data-testid="participants-panel" />,
}));
vi.mock('../../notifications/NotificationStack', () => ({
  default: () => null,
}));
vi.mock('../../ui/ConfirmDialog', () => ({
  default: () => null,
}));
vi.mock('../../waiting/AdmissionPanel', () => ({
  default: () => null,
}));

const defaultProps = {
  socket: null,
  onToggleMic: vi.fn(),
  onToggleCam: vi.fn(),
  onToggleHand: vi.fn(),
  onToggleScreenShare: vi.fn(),
  onToggleRecording: vi.fn(),
  onReact: vi.fn(),
  onToggleLock: vi.fn(),
  onLeave: vi.fn(),
  onKickParticipant: vi.fn(),
};

describe('Integration 9.4 — Beta banner dismiss', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
    useMeetingStore.getState().reset();
    useChatStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
  });

  test('banner is visible by default', () => {
    render(<MeetingLayout {...defaultProps} />);
    expect(screen.getByText(/Beta/)).toBeInTheDocument();
    expect(screen.getByLabelText('Dismiss beta banner')).toBeInTheDocument();
  });

  test('dismiss button hides the banner', async () => {
    const user = userEvent.setup();
    render(<MeetingLayout {...defaultProps} />);
    expect(screen.getByText(/Beta/)).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss beta banner'));

    expect(screen.queryByText(/Beta/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Dismiss beta banner')).not.toBeInTheDocument();
  });

  test('layout does not break after banner dismissal', async () => {
    const user = userEvent.setup();
    const { container } = render(<MeetingLayout {...defaultProps} />);
    expect(screen.getByText(/Beta/)).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss beta banner'));

    const layout = container.querySelector('.flex.flex-col.h-screen');
    expect(layout).toBeInTheDocument();
    expect(screen.getByTestId('control-bar')).toBeInTheDocument();
    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
  });

  test('dismiss persists across renders (store state)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MeetingLayout {...defaultProps} />);
    expect(screen.getByText(/Beta/)).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss beta banner'));

    rerender(<MeetingLayout {...defaultProps} />);
    expect(screen.queryByText(/Beta/)).not.toBeInTheDocument();
  });
});
