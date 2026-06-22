import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import VideoGrid from '../VideoGrid';

function makeStoreMock(reactions = []) {
  const mockStream = {
    active: true,
    getTracks: () => [vi.fn()],
    getVideoTracks: () => [vi.fn()],
    getAudioTracks: () => [],
  };

  return {
    localSocketId: 'socket-1',
    displayName: 'Alice',
    localStream: mockStream,
    screenShareStream: mockStream,
    remoteStreams: {},
    participants: {
      'socket-1': { displayName: 'Alice', isHost: true, isMuted: false, isCameraOff: false, isHandRaised: false, isScreenSharing: true },
      'socket-2': { displayName: 'Bob', isHost: false, isMuted: false, isCameraOff: false, isHandRaised: false, isScreenSharing: false },
    },
    connectionStates: {},
    isHost: true,
    isMicOn: true,
    isCamOn: true,
    isHandRaised: false,
    isBlurred: false,
    activeScreenShareSocketId: 'socket-1',
    dominantSpeakerSocketId: null,
    screenShareVersion: 1,
    reactions,
  };
}

let _currentState = makeStoreMock();

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => {
    if (selector) return selector(_currentState);
    return _currentState;
  };
  useStore.getState = () => _currentState;
  return { default: useStore };
});

const fireReaction = { id: 'r1', emoji: '🔥', socketId: 'socket-2', displayName: 'Bob', createdAt: 1000, left: 42 };
const partyReaction = { id: 'r2', emoji: '🎉', socketId: 'socket-2', displayName: 'Bob', createdAt: 2000, left: 55 };

describe('Integration 9.5 — Screen share with emoji overlay', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  test('screen share layout renders main tile and sidebar', () => {
    _currentState = makeStoreMock();
    const { container } = render(<VideoGrid />);
    const mainArea = container.querySelector('.flex.flex-col.md\\:flex-row');
    expect(mainArea).toBeInTheDocument();
    const sidebar = container.querySelector('.flex.md\\:flex-col.gap-2');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar.children.length).toBe(1);
  });

  test('emoji reaction renders in document.body when reactions are present during screen share', () => {
    _currentState = makeStoreMock([fireReaction]);
    render(<VideoGrid />);
    const emojiSpans = document.body.querySelectorAll('span.absolute');
    expect(emojiSpans.length).toBeGreaterThan(0);
    expect(emojiSpans[0].textContent).toBe('🔥');
  });

  test('aria-live region announces reaction during screen share', () => {
    _currentState = makeStoreMock([partyReaction]);
    render(<VideoGrid />);
    const ariaLive = document.body.querySelector('[aria-live="polite"]');
    expect(ariaLive).not.toBeNull();
    expect(ariaLive.textContent).toBe('Bob reacted with 🎉');
  });
});
