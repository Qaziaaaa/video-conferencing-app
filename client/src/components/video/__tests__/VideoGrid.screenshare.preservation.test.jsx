/**
 * Task 2.8 — Preservation Unit: Screen Share Layout Unaffected
 *
 * Validates: Requirements 3.8
 *
 * Property 2: Preservation — Screen Share Layout
 * WHEN a screen share is active THEN the system SHALL CONTINUE TO show the
 * main screen share tile and sidebar participant tiles using the existing
 * layout logic.
 *
 * This test documents baseline behavior on UNFIXED code. The screen share
 * layout in VideoGrid is not directly touched by any of the four bug fixes,
 * so these tests MUST PASS both before and after the fixes.
 *
 * EXPECTED OUTCOME on UNFIXED code: Tests PASS (baseline confirmed).
 * EXPECTED OUTCOME on FIXED code:   Tests continue to PASS (preservation confirmed).
 */

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import VideoGrid from '../VideoGrid';

// ---------------------------------------------------------------------------
// Minimal mock stream
// ---------------------------------------------------------------------------
const mockStream = {
  getTracks: () => [],
  getAudioTracks: () => [],
  getVideoTracks: () => [],
  active: true,
};

// ---------------------------------------------------------------------------
// Store mock factory
// ---------------------------------------------------------------------------

/**
 * Build a store state where `activeScreenShareSocketId` is set, triggering the
 * screen-share layout branch in VideoGrid.
 *
 * @param {object} opts
 * @param {string[]} opts.allIds          All participant socket IDs (must include sharerId)
 * @param {string}   opts.sharerId        The socket ID that is sharing their screen
 * @param {string}   opts.localSocketId   The local participant's socket ID
 */
function makeScreenShareState({
  allIds,
  sharerId,
  localSocketId,
}) {
  const participants = Object.fromEntries(
    allIds.map((id) => [
      id,
      {
        socketId: id,
        displayName: `User-${id}`,
        isHost: id === localSocketId,
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        isScreenSharing: id === sharerId,
      },
    ])
  );

  // Remote streams for every participant except the local one
  const remoteStreams = Object.fromEntries(
    allIds
      .filter((id) => id !== localSocketId)
      .map((id) => [id, mockStream])
  );

  return {
    localSocketId,
    displayName: `User-${localSocketId}`,
    localStream: mockStream,
    screenShareStream: mockStream,       // active screen share stream
    remoteStreams,
    participants,
    connectionStates: {},
    isHost: true,
    isMicOn: true,
    isCamOn: true,
    isHandRaised: false,
    isBlurred: false,
    activeScreenShareSocketId: sharerId, // <-- triggers screen-share branch
    dominantSpeakerSocketId: null,
    screenShareVersion: 1,
    reactions: [],
  };
}

// ---------------------------------------------------------------------------
// Module-level mock state (mutated before each test / render)
// ---------------------------------------------------------------------------
let _currentState = makeScreenShareState({
  allIds: ['socket-1', 'socket-2'],
  sharerId: 'socket-2',
  localSocketId: 'socket-1',
});

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => {
    if (selector) return selector(_currentState);
    return _currentState;
  };
  useStore.getState = () => _currentState;
  return { default: useStore };
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Helper — count Tile "name" spans by looking for the display-name text nodes
// rendered by Tile's bottom label area.
// ---------------------------------------------------------------------------

/** Return all participant name labels rendered inside the component. */
function getNameLabels(container) {
  return Array.from(container.querySelectorAll('span')).filter(
    (el) => el.className.includes('font-semibold') && el.className.includes('text-white')
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Preservation Unit — Screen Share Layout Unaffected (Task 2.8, Requirements 3.8)', () => {
  // -----------------------------------------------------------------------
  // 1. Main tile renders when a remote participant is sharing
  // -----------------------------------------------------------------------
  test('renders the screen-share flex layout (not the normal grid) when a screen share is active', () => {
    _currentState = makeScreenShareState({
      allIds: ['socket-1', 'socket-2'],
      sharerId: 'socket-2',
      localSocketId: 'socket-1',
    });

    const { container } = render(<VideoGrid />);

    // The screen-share branch renders a flex container; the normal grid branch
    // renders a div with `grid` class.  Assert flex, not grid.
    const flexWrapper = container.querySelector('div.flex');
    expect(flexWrapper, 'Expected a flex wrapper for screen-share layout').toBeTruthy();

    // The normal grid must NOT be the root container in this mode
    const gridDiv = container.querySelector('div.grid');
    expect(gridDiv, 'Grid div should not be the layout root when screen share is active').toBeNull();
  });

  // -----------------------------------------------------------------------
  // 2. Main share tile is rendered with isScreenSharing=true
  // -----------------------------------------------------------------------
  test('renders the main (full-size) screen share tile for the active sharer', () => {
    _currentState = makeScreenShareState({
      allIds: ['socket-1', 'socket-2'],
      sharerId: 'socket-2',
      localSocketId: 'socket-1',
    });

    const { container } = render(<VideoGrid />);

    // The "Presenting" badge is only rendered in Tile when isScreenSharing=true
    const presentingBadge = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent.trim() === 'Presenting'
    );
    expect(presentingBadge, 'Expected a "Presenting" badge on the main screen-share tile').toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 3. Sidebar participants render for everyone except the sharer
  // -----------------------------------------------------------------------
  test('sidebar renders one tile per non-sharer participant when screen share is active', () => {
    // 4 participants: socket-1 (local), socket-2 (sharer), socket-3, socket-4
    _currentState = makeScreenShareState({
      allIds: ['socket-1', 'socket-2', 'socket-3', 'socket-4'],
      sharerId: 'socket-2',
      localSocketId: 'socket-1',
    });

    const { container } = render(<VideoGrid />);

    // The sidebar container holds the non-sharer tiles.
    // It is the second child of the flex wrapper and has overflow-x-auto class.
    const sidebarContainer = container.querySelector('div[class*="overflow-x-auto"]');
    expect(sidebarContainer, 'Expected a sidebar container').toBeTruthy();

    // There should be 3 sidebar tiles: socket-1, socket-3, socket-4
    // (socket-2 is the sharer and goes into the main tile)
    const sidebarTileWrappers = sidebarContainer.querySelectorAll(':scope > div');
    expect(sidebarTileWrappers.length).toBe(3);
  });

  // -----------------------------------------------------------------------
  // 4. Local participant appears in the sidebar (not excluded) when not sharing
  // -----------------------------------------------------------------------
  test('local participant tile appears in sidebar when they are not the sharer', () => {
    _currentState = makeScreenShareState({
      allIds: ['socket-1', 'socket-2', 'socket-3'],
      sharerId: 'socket-2',
      localSocketId: 'socket-1',
    });

    const { container } = render(<VideoGrid />);

    // Find all "(You)" labels — only the local tile renders this
    const youLabels = Array.from(container.querySelectorAll('span')).filter(
      (el) => el.textContent.trim() === '(You)'
    );
    // The local user appears exactly once (in the sidebar)
    expect(youLabels.length).toBe(1);
  });

  // -----------------------------------------------------------------------
  // 5. When local participant is the sharer, PiP self-view is rendered
  // -----------------------------------------------------------------------
  test('renders a PiP self-view tile when the local participant is sharing their screen', () => {
    _currentState = makeScreenShareState({
      allIds: ['socket-1', 'socket-2'],
      sharerId: 'socket-1',          // local is the sharer
      localSocketId: 'socket-1',
    });

    const { container } = render(<VideoGrid />);

    // When isLocalSharer is true, a PiP tile is rendered inside an
    // absolutely-positioned div containing the local camera feed.
    // It is marked with animate-[pipIn_0.25s_ease-out] class.
    const pipContainer = container.querySelector('div[class*="pipIn"]');
    expect(pipContainer, 'Expected a PiP container when local participant is sharing').toBeTruthy();

    // The PiP tile should have the "(You)" label since isLocal=true
    const youLabels = Array.from(container.querySelectorAll('span')).filter(
      (el) => el.textContent.trim() === '(You)'
    );
    expect(youLabels.length).toBeGreaterThanOrEqual(1);
  });

  // -----------------------------------------------------------------------
  // 6. No sidebar renders when the sharer is the only other participant
  // -----------------------------------------------------------------------
  test('sidebar is not rendered when there are no non-sharer participants', () => {
    // Only two participants: local (socket-1) and sharer (socket-2).
    // The sharer is excluded from the sidebar list, leaving only socket-1.
    // The sidebar DOES render with the local participant.
    // But if sharer == local (only 1 participant), sidebar should be empty / absent.
    _currentState = makeScreenShareState({
      allIds: ['socket-1'],           // only the local sharer
      sharerId: 'socket-1',
      localSocketId: 'socket-1',
    });

    const { container } = render(<VideoGrid />);

    // sidebarIds would be empty (only participant is the sharer)
    // The sidebar div is conditionally rendered: {sidebarIds.length > 0 && ...}
    const sidebarContainer = container.querySelector('div[class*="overflow-x-auto"]');
    expect(sidebarContainer, 'Sidebar should not render when there are no sidebar participants').toBeNull();
  });

  // -----------------------------------------------------------------------
  // 7. Correct sharer display name is shown on the main tile
  // -----------------------------------------------------------------------
  test('main screen share tile shows the sharer display name', () => {
    _currentState = makeScreenShareState({
      allIds: ['socket-1', 'socket-2'],
      sharerId: 'socket-2',
      localSocketId: 'socket-1',
    });

    const { container } = render(<VideoGrid />);

    // The sharer's name label should appear in the DOM
    const nameSpans = getNameLabels(container);
    const sharerNameSpan = nameSpans.find((el) => el.textContent.includes('User-socket-2'));
    expect(sharerNameSpan, 'Expected sharer name "User-socket-2" on the main tile').toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 8. Layout is stable across multiple participant counts (2–5 participants)
  // -----------------------------------------------------------------------
  test.each([
    [2, 'socket-2', 1],   // 2 participants, 1 sidebar tile
    [3, 'socket-2', 2],   // 3 participants, 2 sidebar tiles
    [4, 'socket-2', 3],   // 4 participants, 3 sidebar tiles
    [5, 'socket-2', 4],   // 5 participants, 4 sidebar tiles
  ])(
    'renders correct sidebar count (%i total, sharer=%s → %i sidebar tiles)',
    (totalCount, sharerId, expectedSidebarCount) => {
      const allIds = Array.from({ length: totalCount }, (_, i) => `socket-${i + 1}`);
      _currentState = makeScreenShareState({
        allIds,
        sharerId,
        localSocketId: 'socket-1',
      });

      const { container } = render(<VideoGrid />);

      const sidebarContainer = container.querySelector('div[class*="overflow-x-auto"]');
      expect(sidebarContainer, 'Expected a sidebar container').toBeTruthy();

      const sidebarTileWrappers = sidebarContainer.querySelectorAll(':scope > div');
      expect(sidebarTileWrappers.length).toBe(expectedSidebarCount);

      cleanup();
    }
  );
});
