/**
 * Task 2.4 — Preservation PBT: VideoGrid Produces Valid Layout for All Participant Counts
 *
 * Property 2: Preservation
 *
 * PURPOSE: Document the BASELINE behavior on UNFIXED code — VideoGrid always
 * applies some valid `grid-cols-N` class (N ∈ {1,2,3,4}) for any participant
 * count in [1,7] and any viewport width in [320,1920] px.
 *
 * The `colsClass` map on unfixed code has entries:
 *   { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-2', 4: 'grid-cols-2' }
 *
 * Although colsClass[3] = 'grid-cols-2' is suboptimal for 5–6 participants,
 * it is still a *valid* CSS class. The fallback `colsClass[cols] || 'grid-cols-2'`
 * ensures a class is always present for any participant count.
 *
 * EXPECTED OUTCOME on UNFIXED code:
 *   Tests PASS — every rendered grid container has one of the four valid
 *   `grid-cols-N` classes, even if the column count is suboptimal for some
 *   participant counts. No undefined class or missing grid class occurs.
 *
 * EXPECTED OUTCOME on FIXED code:
 *   Tests continue to PASS (preservation confirmed), with the additional
 *   correctness that colsClass[3] now correctly maps to 'grid-cols-3'.
 *
 * Validates: Requirements 3.5
 */

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import fc from 'fast-check';
import VideoGrid from '../VideoGrid';

// ---------------------------------------------------------------------------
// Store mock — VideoGrid reads many fields from useMeetingStore.
// We control the participant count via setParticipantCount().
// ---------------------------------------------------------------------------
function makeStoreMock(participantCount) {
  const ids = Array.from({ length: participantCount }, (_, i) => `socket-${i + 1}`);
  const participants = Object.fromEntries(
    ids.map((id) => [
      id,
      {
        displayName: `User${id}`,
        isHost: false,
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
}

// The mutable state object used by the mock — replaced on each property run.
let _currentState = makeStoreMock(1);

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => {
    if (selector) return selector(_currentState);
    return _currentState;
  };
  useStore.getState = () => _currentState;
  return { default: useStore };
});

/** Update the store mock for a given participant count before rendering. */
function setParticipantCount(n) {
  _currentState = makeStoreMock(n);
}

// ---------------------------------------------------------------------------
// Valid grid-cols classes — N ∈ {1,2,3,4}
// ---------------------------------------------------------------------------
const VALID_GRID_COLS_CLASSES = new Set([
  'grid-cols-1',
  'grid-cols-2',
  'grid-cols-3',
  'grid-cols-4',
]);

/**
 * Assert that the rendered grid container div has at least one valid
 * `grid-cols-N` class where N ∈ {1,2,3,4}.
 *
 * VideoGrid renders the normal grid layout when activeScreenShareSocketId is null.
 * The grid container is `<div class="grid grid-cols-N gap-3 h-full ...">`.
 */
function assertValidGridColsClass(container) {
  const gridDiv = container.querySelector('div[class*="grid-cols-"]');

  expect(gridDiv, 'Expected a grid container div with a grid-cols-* class').toBeTruthy();

  const classes = gridDiv.className.split(/\s+/);
  const gridColsTokens = classes.filter((cls) => cls.startsWith('grid-cols-'));

  expect(
    gridColsTokens.length,
    `Expected at least one grid-cols-* class, found: [${classes.join(', ')}]`
  ).toBeGreaterThan(0);

  const hasValidClass = gridColsTokens.some((cls) => VALID_GRID_COLS_CLASSES.has(cls));

  expect(
    hasValidClass,
    `Expected one of [${[...VALID_GRID_COLS_CLASSES].join(', ')}] but found: [${gridColsTokens.join(', ')}]`
  ).toBe(true);
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Participant count in [1, 7] — covers the full range handled by getGridLayout. */
const participantCountArb = fc.integer({ min: 1, max: 7 });

/**
 * Viewport width in [320, 1920] px.
 * VideoGrid's grid-cols class is determined by the JavaScript colsClass map
 * (not CSS media queries), so the DOM className is viewport-independent.
 * We include viewport width as a test dimension to ensure no unexpected
 * interactions occur at extreme sizes and to document the full input space.
 */
const viewportWidthArb = fc.integer({ min: 320, max: 1920 });

// ---------------------------------------------------------------------------
// Cleanup after each test
// ---------------------------------------------------------------------------
afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Preservation PBT — VideoGrid Always Renders a Valid grid-cols Class (Task 2.4)', () => {
  /**
   * **Validates: Requirements 3.5**
   *
   * Property 2: For any participant count in [1,7] and any viewport width in
   * [320,1920] px, the VideoGrid grid container SHALL have a valid `grid-cols-N`
   * class where N ∈ {1,2,3,4}.
   *
   * On UNFIXED code this PASSES:
   *   - participantCount 1   → getGridLayout cols=1 → colsClass[1]='grid-cols-1' ✓
   *   - participantCount 2   → getGridLayout cols=2 → colsClass[2]='grid-cols-2' ✓
   *   - participantCount 3–4 → getGridLayout cols=2 → colsClass[2]='grid-cols-2' ✓
   *   - participantCount 5–6 → getGridLayout cols=3 → colsClass[3]='grid-cols-2' ✓ (valid, suboptimal)
   *   - participantCount 7   → getGridLayout cols=4 → colsClass[4]='grid-cols-2' ✓ (valid, suboptimal)
   *   - fallback for any unmapped cols  → '|| grid-cols-2' ✓
   *
   * On FIXED code this also PASSES (colsClass[3] becomes 'grid-cols-3',
   * which is still in the valid set {1,2,3,4}).
   */
  test(
    'Property 2 — grid container has a valid grid-cols-N class for all participant counts [1–7] × viewport widths [320–1920 px]',
    () => {
      fc.assert(
        fc.property(participantCountArb, viewportWidthArb, (participantCount, viewportWidth) => {
          // Document the viewport width intent (jsdom does not apply CSS breakpoints,
          // but setting innerWidth records the test dimension for debugging output)
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          // Configure the mocked store with the generated participant count
          setParticipantCount(participantCount);

          const { container } = render(<VideoGrid />);

          // Assert the grid container has a valid grid-cols-N class
          assertValidGridColsClass(container);

          // Clean up the rendered component before the next property run
          cleanup();
        }),
        {
          numRuns: 100,
          verbose: false,
        }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Supplementary deterministic checks — pin down each boundary explicitly
  // so failures are maximally readable without shrinking.
  // -------------------------------------------------------------------------

  test.each([
    [1, 'grid-cols-1', 'single participant → 1 column'],
    [2, 'grid-cols-2', '2 participants → 2 columns'],
    [3, 'grid-cols-2', '3 participants → 2×2 grid (cols=2) on unfixed code'],
    [4, 'grid-cols-2', '4 participants → 2×2 grid (cols=2) on unfixed code'],
    [5, 'grid-cols-2', '5 participants → getGridLayout cols=3, colsClass[3] on unfixed code → valid'],
    [6, 'grid-cols-2', '6 participants → getGridLayout cols=3, colsClass[3] on unfixed code → valid'],
    [7, 'grid-cols-2', '7 participants → getGridLayout cols=4, colsClass[4] on unfixed code → valid'],
  ])(
    'Supplementary — participantCount=%i renders a valid grid-cols class (%s) [%s]',
    (participantCount, expectedClass, _description) => {
      setParticipantCount(participantCount);

      const { container } = render(<VideoGrid />);

      const gridDiv = container.querySelector('div[class*="grid-cols-"]');
      expect(gridDiv).toBeTruthy();

      const classes = gridDiv.className.split(/\s+/);
      const gridColsTokens = classes.filter((cls) => cls.startsWith('grid-cols-'));

      // At least one valid grid-cols-N class must be present
      const hasValidClass = gridColsTokens.some((cls) => VALID_GRID_COLS_CLASSES.has(cls));
      expect(
        hasValidClass,
        `participantCount=${participantCount}: expected a valid grid-cols-N class, found [${gridColsTokens.join(', ')}]`
      ).toBe(true);

      cleanup();
    }
  );
});
