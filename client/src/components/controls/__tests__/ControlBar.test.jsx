import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ControlBar from '../ControlBar';

const defaultProps = {
  isMicOn: true,
  isCamOn: true,
  isHandRaised: false,
  isScreenSharing: false,
  isBlurred: false,
  isChatOpen: false,
  isParticipantsOpen: false,
  unreadChatCount: 0,
  participantCount: 3,
  onToggleMic: vi.fn(),
  onToggleCam: vi.fn(),
  onToggleHand: vi.fn(),
  onToggleScreenShare: vi.fn(),
  onToggleBlur: vi.fn(),
  onToggleChat: vi.fn(),
  onToggleParticipants: vi.fn(),
  onLeave: vi.fn(),
};

describe('ControlBar', () => {
  test('renders all control buttons', () => {
    render(<ControlBar {...defaultProps} />);
    expect(screen.getByLabelText(/mute microphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/turn off camera/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/present screen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/raise hand/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enable background blur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/open chat/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/show participants/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/leave meeting/i)).toBeInTheDocument();
  });

  test('calls onToggleMic when mic button clicked', async () => {
    const onToggleMic = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} onToggleMic={onToggleMic} />);
    await user.click(screen.getByLabelText(/mute microphone/i));
    expect(onToggleMic).toHaveBeenCalledOnce();
  });

  test('calls onToggleCam when camera button clicked', async () => {
    const onToggleCam = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} onToggleCam={onToggleCam} />);
    await user.click(screen.getByLabelText(/turn off camera/i));
    expect(onToggleCam).toHaveBeenCalledOnce();
  });

  test('calls onToggleHand when hand button clicked', async () => {
    const onToggleHand = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} onToggleHand={onToggleHand} />);
    await user.click(screen.getByLabelText(/raise hand/i));
    expect(onToggleHand).toHaveBeenCalledOnce();
  });

  test('calls onLeave when leave button clicked', async () => {
    const onLeave = vi.fn();
    const user = userEvent.setup();
    render(<ControlBar {...defaultProps} onLeave={onLeave} />);
    await user.click(screen.getByLabelText(/leave meeting/i));
    expect(onLeave).toHaveBeenCalledOnce();
  });

  test('shows unread badge when unreadChatCount > 0', () => {
    render(<ControlBar {...defaultProps} unreadChatCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('shows participant count badge', () => {
    render(<ControlBar {...defaultProps} participantCount={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('shows 99+ for large unread count', () => {
    render(<ControlBar {...defaultProps} unreadChatCount={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  test('shows active state styles when mic is off', () => {
    render(<ControlBar {...defaultProps} isMicOn={false} />);
    expect(screen.getByLabelText(/unmute microphone/i)).toBeInTheDocument();
  });

  test('shows stop screen sharing when sharing', () => {
    render(<ControlBar {...defaultProps} isScreenSharing={true} />);
    expect(screen.getByLabelText(/stop presenting/i)).toBeInTheDocument();
  });

  test('shows lower hand when hand is raised', () => {
    render(<ControlBar {...defaultProps} isHandRaised={true} />);
    expect(screen.getByLabelText(/lower hand/i)).toBeInTheDocument();
  });

  test('shows close chat when chat is open', () => {
    render(<ControlBar {...defaultProps} isChatOpen={true} />);
    expect(screen.getByLabelText(/close chat/i)).toBeInTheDocument();
  });

  describe('tap target sizes (Task 7.6)', () => {
    const tapTargetClasses = ['w-11', 'h-11', 'min-w-[44px]', 'min-h-[44px]'];

    test.each([
      ['mic', /mute microphone/i],
      ['camera', /turn off camera/i],
      ['screen share', /present screen/i],
      ['hand', /raise hand/i],
      ['blur', /enable background blur/i],
      ['chat', /open chat/i],
      ['participants', /show participants/i],
      ['leave', /leave meeting/i],
    ])('%s button has 44px touch target classes', (_, label) => {
      render(<ControlBar {...defaultProps} />);
      const btn = screen.getByLabelText(label);
      tapTargetClasses.forEach((cls) => {
        expect(btn.className).toContain(cls);
      });
    });
  });
});
