import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MeetingLayout from '../MeetingLayout';
import useUIStore from '../../../store/useUIStore';

vi.mock('../../video/VideoGrid', () => ({
  default: () => <div data-testid="video-grid">VideoGrid</div>,
}));

vi.mock('../../controls/ControlBar', () => ({
  default: () => <div data-testid="control-bar">ControlBar</div>,
}));

vi.mock('../../chat/ChatPanel', () => ({
  default: () => <div data-testid="chat-panel">ChatPanel</div>,
}));

vi.mock('../../participants/ParticipantsPanel', () => ({
  default: () => <div data-testid="participants-panel">ParticipantsPanel</div>,
}));

vi.mock('../../notifications/NotificationStack', () => ({
  default: () => <div data-testid="notification-stack">NotificationStack</div>,
}));

vi.mock('../../ui/ConfirmDialog', () => ({
  default: () => <div data-testid="confirm-dialog">ConfirmDialog</div>,
}));

vi.mock('../../waiting/AdmissionPanel', () => ({
  default: () => <div data-testid="admission-panel">AdmissionPanel</div>,
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

describe('MeetingLayout beta banner (Task 7.9)', () => {

  test('renders the banner when isBannerVisible is true', () => {
    useUIStore.setState({ isBannerVisible: true });
    render(<MeetingLayout {...defaultProps} />);
    expect(screen.getByText(/beta/i)).toBeInTheDocument();
  });

  test('does NOT render the banner when isBannerVisible is false', () => {
    useUIStore.setState({ isBannerVisible: false });
    render(<MeetingLayout {...defaultProps} />);
    expect(screen.queryByText(/beta/i)).not.toBeInTheDocument();
  });

  test('banner has a dismiss button with aria-label Dismiss beta banner', () => {
    useUIStore.setState({ isBannerVisible: true });
    render(<MeetingLayout {...defaultProps} />);
    expect(screen.getByLabelText('Dismiss beta banner')).toBeInTheDocument();
  });

  test('clicking dismiss button hides the banner', async () => {
    const user = userEvent.setup();
    useUIStore.setState({ isBannerVisible: true });
    render(<MeetingLayout {...defaultProps} />);
    expect(screen.getByText(/beta/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText('Dismiss beta banner'));
    expect(screen.queryByText(/beta/i)).not.toBeInTheDocument();
  });
});
