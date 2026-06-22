import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import MeetingLayoutRaw from '../MeetingLayout.jsx?raw';
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

describe('MeetingLayout safe-area insets (Task 7.12)', () => {
  beforeEach(() => {
    useUIStore.setState({ isBannerVisible: true });
  });

  test('source has paddingBottom: env(safe-area-inset-bottom) on ControlBar wrapper', () => {
    expect(MeetingLayoutRaw).toContain("paddingBottom: 'env(safe-area-inset-bottom)'");
  });

  test('source has paddingTop: env(safe-area-inset-top) on beta banner', () => {
    expect(MeetingLayoutRaw).toContain("paddingTop: 'env(safe-area-inset-top)'");
  });
});
