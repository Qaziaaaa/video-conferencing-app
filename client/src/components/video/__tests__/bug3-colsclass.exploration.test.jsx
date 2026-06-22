/**
 * Bug 3 Pre-Fix Exploration Test — colsClass Map for 3-Column Layouts
 *
 * Task 1.4: Property 1 — Bug Condition
 *
 * PURPOSE: Confirm the colsClass misconfiguration bug EXISTS on UNFIXED code.
 * These assertions intentionally document the DEFECTIVE state.
 *
 * When this test PASSES → the bug is confirmed present (expected outcome on unfixed code).
 * After the fix (task 5.4) the assertion will be INVERTED: colsClass[3] === 'grid-cols-3'.
 *
 * Validates: Requirements 3.3
 *
 * Counterexample documented:
 *   - colsClass[3] === 'grid-cols-2'
 *     For 5–6 participants, getGridLayout returns cols:3 but the colsClass map maps key 3
 *     to 'grid-cols-2', producing only 2 columns instead of the required 3.
 *     This causes 5–6 participant layouts to be broken on VideoGrid.
 *
 * ─────────────────────────────────────────────────────────────
 * Task 5.5: Property 1 — Expected Behavior (Post-Fix Assertions)
 *
 * PURPOSE: Confirm Bug 3 layout fixes are applied by re-running the SAME scenarios
 * from task 1.4 and asserting the INVERSE (correct) behavior.
 *
 * EXPECTED OUTCOME: All tests PASS (confirms Bug 3 fixes are in place).
 *
 * Validates: Requirements 2.6, 2.8, 2.9
 * ─────────────────────────────────────────────────────────────
 */

import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import VideoGrid, { getGridLayout } from '../VideoGrid';
import ControlBar from '../../controls/ControlBar';

// ---------------------------------------------------------------------------
// Store mock — VideoGrid reads many fields from useMeetingStore
// ---------------------------------------------------------------------------
function makeStoreMock(participantCount) {
  // Build fake participant IDs
  const ids = Array.from({ length: participantCount }, (_, i) => `socket-${i + 1}`);
  const participants = Object.fromEntries(
    ids.map((id) => [id, { displayName: `User${id}`, isHost: false, isMuted: false, isCameraOff: false, isHandRaised: false }])
  );

  const storeState = {
    localSocketId: 'socket-1',
    displayName: 'User1',
    localStream: null,
    screenShareStream: null,
    remoteStreams: {},
    participants,
    connectionStates: {},
    isHost: false,
    isMicOn: true,
    isCamOn: true,
    isHandRaised: false,
    isBlurred: false,
    activeScreenShareSocketId: null,
    dominantSpeakerSocketId: null,
    screenShareVersion: 0,
    reactions: [],
  };

  return storeState;
}

vi.mock('../../../store/useMeetingStore', () => {
  let currentState = makeStoreMock(5);

  const useStore = (selector) => {
    if (selector) return selector(currentState);
    return currentState;
  };
  useStore.getState = () => currentState;
  useStore.__setParticipantCount = (n) => {
    currentState = makeStoreMock(n);
  };

  return { default: useStore };
});

// ---------------------------------------------------------------------------
// Helper — resolve the useMeetingStore mock after vi.mock hoisting
// ---------------------------------------------------------------------------
async function getStoreMock() {
  const mod = await import('../../../store/useMeetingStore');
  return mod.default;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Bug 3 Pre-Fix Exploration — colsClass Misconfiguration (FIXED code)', () => {
  // -------------------------------------------------------------------------
  // Property 1: getGridLayout returns cols:3 for 5-participant meetings.
  // -------------------------------------------------------------------------
  test(
    'Property 1a — getGridLayout returns cols:3 for 5-6 participants [layout intent]',
    () => {
      const layout5 = getGridLayout(5);
      const layout6 = getGridLayout(6);

      expect(layout5.cols).toBe(3);
      expect(layout6.cols).toBe(3);
    }
  );

  // -------------------------------------------------------------------------
  // Property 1b (post-fix): 5 participants renders sm:grid-cols-3 (not grid-cols-2)
  // -------------------------------------------------------------------------
  test(
    'Property 1b — VideoGrid with 5 participants renders sm:grid-cols-3 [FIXED — colsClass[3] === "grid-cols-3"]',
    async () => {
      const storeMock = await getStoreMock();
      storeMock.__setParticipantCount(5);

      const { container } = render(<VideoGrid />);

      const gridDiv = container.querySelector('div[class*="grid"]');
      expect(gridDiv).toBeTruthy();

      // Post-fix: responsive class contains sm:grid-cols-3, mobile fallback is grid-cols-1
      expect(gridDiv.className).toContain('sm:grid-cols-3');
      expect(gridDiv.className).toContain('grid-cols-1');
      // Bug condition no longer present
      expect(gridDiv.className).not.toContain('grid-cols-2');
    }
  );

  // -------------------------------------------------------------------------
  // Property 1c (post-fix): 6 participants renders sm:grid-cols-3
  // -------------------------------------------------------------------------
  test(
    'Property 1c — VideoGrid with 6 participants renders sm:grid-cols-3 [FIXED — colsClass[3] === "grid-cols-3"]',
    async () => {
      const storeMock = await getStoreMock();
      storeMock.__setParticipantCount(6);

      const { container } = render(<VideoGrid />);

      const gridDiv = container.querySelector('div[class*="grid"]');
      expect(gridDiv).toBeTruthy();

      expect(gridDiv.className).toContain('sm:grid-cols-3');
      expect(gridDiv.className).toContain('grid-cols-1');
      expect(gridDiv.className).not.toContain('grid-cols-2');
    }
  );

  // -------------------------------------------------------------------------
  // Property 1d: Verify 1–2 participant layouts still work
  // -------------------------------------------------------------------------
  test(
    'Property 1d — getGridLayout for 1–2 participants returns cols 1–2',
    () => {
      expect(getGridLayout(1).cols).toBe(1);
      expect(getGridLayout(2).cols).toBe(2);
    }
  );
});

// =============================================================================
// Task 5.5 — Post-Fix Verification: Bug 3 Layout Fixes Applied
//
// PURPOSE: Confirm that Bug 3 fixes are in place by asserting the INVERSE of
// the bug conditions documented in the Pre-Fix Exploration block above.
//
// Fixes applied (task 5.4):
//   - colsClass[3] changed from 'grid-cols-2' to 'grid-cols-3'
//   - Grid container uses mobile-first: 'grid-cols-1 sm:grid-cols-3' for 5-6 participants
//   - Grid container has style touchAction: 'pan-y'
//
// Validates: Requirements 2.6, 2.8, 2.9
// =============================================================================

describe('Bug 3 Post-Fix Verification — colsClass and Mobile Layout (FIXED code)', () => {
  // -------------------------------------------------------------------------
  // Property 1a (inverse): colsClass[3] is now 'grid-cols-3'
  // -------------------------------------------------------------------------
  test(
    'Property 1a (post-fix) — getGridLayout returns cols:3 for 5-6 participants (unchanged)',
    () => {
      expect(getGridLayout(5).cols).toBe(3);
      expect(getGridLayout(6).cols).toBe(3);
    }
  );

  test(
    'Property 1b (post-fix) — VideoGrid with 5 participants renders sm:grid-cols-3 [FIXED]',
    async () => {
      const storeMock = await getStoreMock();
      storeMock.__setParticipantCount(5);

      const { container } = render(<VideoGrid />);

      const gridDiv = container.querySelector('div[class*="grid"]');
      expect(gridDiv).toBeTruthy();

      // Post-fix: responsive class contains sm:grid-cols-3
      expect(gridDiv.className).toContain('sm:grid-cols-3');
      // Post-fix: mobile fallback is grid-cols-1
      expect(gridDiv.className).toContain('grid-cols-1');
    }
  );

  test(
    'Property 1c (post-fix) — VideoGrid with 6 participants renders sm:grid-cols-3 [FIXED]',
    async () => {
      const storeMock = await getStoreMock();
      storeMock.__setParticipantCount(6);

      const { container } = render(<VideoGrid />);

      const gridDiv = container.querySelector('div[class*="grid"]');
      expect(gridDiv).toBeTruthy();

      expect(gridDiv.className).toContain('sm:grid-cols-3');
      expect(gridDiv.className).toContain('grid-cols-1');
    }
  );

  test(
    'Property 1d (post-fix) — VideoGrid grid container has touch-action: pan-y [FIXED]',
    async () => {
      const storeMock = await getStoreMock();
      storeMock.__setParticipantCount(2);

      const { container } = render(<VideoGrid />);

      const gridDiv = container.querySelector('div[class*="grid"]');
      expect(gridDiv).toBeTruthy();

      // Post-fix: touchAction pan-y is applied via inline style
      expect(gridDiv.style.touchAction).toBe('pan-y');
    }
  );

  test(
    'Property 1e (post-fix) — 1–2 participant desktop layouts still use grid-cols-1 / sm:grid-cols-2 [PRESERVED]',
    async () => {
      const storeMock = await getStoreMock();

      storeMock.__setParticipantCount(1);
      const { container: c1 } = render(<VideoGrid />);
      const grid1 = c1.querySelector('div[class*="grid"]');
      expect(grid1.className).toContain('grid-cols-1');

      storeMock.__setParticipantCount(2);
      const { container: c2 } = render(<VideoGrid />);
      const grid2 = c2.querySelector('div[class*="grid"]');
      expect(grid2.className).toContain('sm:grid-cols-2');
    }
  );
});
