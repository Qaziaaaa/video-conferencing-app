import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import VideoGrid from '../VideoGrid';
import useMeetingStore from '../../../store/useMeetingStore';

function makeStoreMock(participantCount) {
  const ids = Array.from({ length: participantCount }, (_, i) => `socket-${i + 1}`);
  const participants = Object.fromEntries(
    ids.map((id) => [
      id,
      {
        displayName: `User${id}`,
        isHost: id === 'socket-1',
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        isScreenSharing: false,
      },
    ])
  );

  return {
    localSocketId: 'socket-1',
    displayName: 'User1',
    localStream: null,
    screenShareStream: null,
    remoteStreams: {},
    participants,
    connectionStates: {},
    isHost: true,
    isMicOn: true,
    isCamOn: true,
    isHandRaised: false,
    isBlurred: false,
    activeScreenShareSocketId: null,
    dominantSpeakerSocketId: null,
    screenShareVersion: 0,
    reactions: [],
  };
}

let _currentState = makeStoreMock(6);

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => {
    if (selector) return selector(_currentState);
    return _currentState;
  };
  useStore.getState = () => _currentState;
  return { default: useStore };
});

describe('Integration 9.6 — 6-participant meeting desktop layout', () => {
  beforeEach(() => {
    _currentState = makeStoreMock(6);
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  });

  afterEach(() => {
    cleanup();
  });

  test('grid container has sm:grid-cols-3 class for 6 participants', () => {
    const { container } = render(<VideoGrid />);
    const gridDiv = container.querySelector('div[class*="grid-cols-"]');
    expect(gridDiv).toBeInTheDocument();
    expect(gridDiv.className).toContain('sm:grid-cols-3');
  });

  test('grid-cols-1 base class is present for mobile-first rendering', () => {
    const { container } = render(<VideoGrid />);
    const gridDiv = container.querySelector('div[class*="grid-cols-"]');
    expect(gridDiv.className).toContain('grid-cols-1');
  });

  test('colsClass maps correctly for 6 participants (layout cols=3)', () => {
    const { container } = render(<VideoGrid />);
    const gridDiv = container.querySelector('div[class*="grid-cols-"]');
    const classes = gridDiv.className.split(/\s+/);
    const hasSmGridCols3 = classes.some((cls) => cls === 'sm:grid-cols-3');
    expect(hasSmGridCols3).toBe(true);
  });

  test('grid container has touch-action: pan-y', () => {
    const { container } = render(<VideoGrid />);
    const gridDiv = container.querySelector('div[class*="grid-cols-"]');
    expect(gridDiv.style.touchAction).toBe('pan-y');
  });
});
