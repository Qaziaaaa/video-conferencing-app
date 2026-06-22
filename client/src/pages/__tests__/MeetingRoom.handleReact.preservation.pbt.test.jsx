/**
 * Task 2.5 — Preservation PBT: handleReact always uses current displayName
 *
 * Property 2: Preservation — Correct DisplayName Emitted on React
 *
 * PURPOSE:
 *   Document the stale-closure bug in `handleReact` BEFORE the fix is applied.
 *
 *   `handleReact` in MeetingRoom closes over `displayName` from the render scope
 *   via `useCallback([meetingId, displayName])`. If `displayName` changes in the
 *   Zustand store between renders but React batches the callback recreation,
 *   the emitted `emoji-reaction` socket event carries the STALE captured value
 *   instead of the current store value.
 *
 * METHODOLOGY:
 *   1. Render MeetingRoom with an initial displayName set in the store.
 *   2. Capture the `onReact` callback passed to the MeetingLayout mock.
 *   3. Update displayName in the store WITHOUT triggering a re-render of
 *      MeetingRoom (simulate a batched/skipped render cycle by directly calling
 *      setDisplayName on the store and NOT waiting for React to reconcile).
 *   4. Call the captured (stale) `onReact` callback.
 *   5. Assert the `displayName` in the emitted `emoji-reaction` socket event
 *      equals `useMeetingStore.getState().displayName` AT THE TIME OF THE CALL.
 *
 * EXPECTED OUTCOME ON UNFIXED CODE:
 *   The callback was created with the OLD displayName. The emitted event carries
 *   the OLD value. The assertion fails → counterexample is recorded (stale closure
 *   confirmed).
 *
 * EXPECTED OUTCOME ON FIXED CODE:
 *   `handleReact` calls `useMeetingStore.getState()` at invocation time.
 *   The emitted displayName always equals the current store value.
 *   → Test PASSES.
 *
 * Validates: Requirements 3.10
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import React from 'react';
import fc from 'fast-check';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MeetingRoom from '../MeetingRoom';
import useMeetingStore from '../../store/useMeetingStore';
import useUIStore from '../../store/useUIStore';
import useChatStore from '../../store/useChatStore';

// ---------------------------------------------------------------------------
// Socket mock — records every emit call so we can inspect emitted events.
// ---------------------------------------------------------------------------
const mockSocket = {
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'socket-id-test',
};

// ---------------------------------------------------------------------------
// MeetingLayout mock — captures the `onReact` prop so the test can call it
// directly, simulating the user clicking a reaction button.
// ---------------------------------------------------------------------------
let capturedOnReact = null;

vi.mock('../../components/layout/MeetingLayout', () => ({
  default: vi.fn(({ onReact }) => {
    // Store onReact in the module-level variable so tests can access it.
    capturedOnReact = onReact;
    return <div data-testid="meeting-layout-mock" />;
  }),
}));

// ---------------------------------------------------------------------------
// Hook mocks — minimal stubs so MeetingRoom renders without real network/media.
// ---------------------------------------------------------------------------
vi.mock('../../hooks/useWebRTC', () => ({
  useWebRTC: vi.fn(() => ({
    socket: mockSocket,
    replaceVideoTrack: vi.fn(),
    originalCameraTrackRef: { current: null },
  })),
}));

vi.mock('../../hooks/useChat', () => ({ useChat: vi.fn() }));
vi.mock('../../hooks/useParticipants', () => ({ useParticipants: vi.fn() }));
vi.mock('../../hooks/useNotifications', () => ({ useNotifications: vi.fn() }));
vi.mock('../../hooks/useKeyboardShortcuts', () => ({ useKeyboardShortcuts: vi.fn() }));
vi.mock('../../hooks/useScreenShare', () => ({
  useScreenShare: vi.fn(() => ({ startScreenShare: vi.fn(), stopScreenShare: vi.fn() })),
}));
vi.mock('../../hooks/useRecording', () => ({
  useRecording: vi.fn(() => ({ toggleRecording: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------
function renderMeetingRoom() {
  return render(
    <MemoryRouter initialEntries={['/meeting/m1/room']}>
      <Routes>
        <Route path="/meeting/:meetingId/room" element={<MeetingRoom />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a sequence of 2–5 distinct non-empty display names.
 * The sequence simulates a user changing their display name multiple times
 * during a meeting before sending a reaction.
 */
const displayNameSequence = fc.array(
  fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
  { minLength: 2, maxLength: 5 }
);

/**
 * Generates a single emoji string to pass to handleReact.
 */
const emojiArb = fc.constantFrom('👍', '❤️', '😂', '🎉', '🔥', '👏', '😮', '😢');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Preservation PBT — handleReact always uses current displayName (Task 2.5)', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useUIStore.getState().reset();
    useChatStore.getState().reset();
    vi.clearAllMocks();
    capturedOnReact = null;

    // Re-apply the socket mock after clearAllMocks resets call state
    mockSocket.on.mockReturnThis();
    mockSocket.off.mockReturnThis();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Validates: Requirements 3.10**
   *
   * Property 2: For any sequence of displayName values set in the store,
   * calling `handleReact` MUST emit an `emoji-reaction` event with
   * `displayName === useMeetingStore.getState().displayName` at call time.
   *
   * EXPECTED OUTCOME ON UNFIXED CODE:
   *   The `handleReact` useCallback closes over the displayName at render time.
   *   After the store is updated without a re-render, the callback still holds the
   *   OLD value. The assertion will FAIL — this is the expected bug documentation.
   *
   * EXPECTED OUTCOME ON FIXED CODE:
   *   `handleReact` reads `useMeetingStore.getState().displayName` at call time.
   *   The emitted value always matches the current store → PASSES.
   */
  test(
    'Property 2 — emitted displayName always equals useMeetingStore.getState().displayName at call time',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          displayNameSequence,
          emojiArb,
          async (nameSequence, emoji) => {
            // ── Step 1: Set up initial store state with the FIRST name in the sequence ──
            const initialName = nameSequence[0];
            useMeetingStore.getState().setMeetingId('m1');
            useMeetingStore.getState().setDisplayName(initialName);

            // ── Step 2: Render MeetingRoom — this creates handleReact closing over initialName ──
            renderMeetingRoom();

            // Confirm the layout rendered and onReact was captured
            expect(capturedOnReact, 'MeetingLayout must render and expose onReact').toBeTruthy();

            // Capture the STALE callback (created with initialName)
            const staleCallback = capturedOnReact;

            // ── Step 3: Update displayName through the remaining names WITHOUT
            //            re-rendering MeetingRoom (simulate batched render skip).
            //            We call setDisplayName directly on the store to change the
            //            store value, then immediately call the stale callback.
            // ──────────────────────────────────────────────────────────────────

            // Iterate through subsequent names in the sequence
            for (let i = 1; i < nameSequence.length; i++) {
              const updatedName = nameSequence[i];

              // Update the store directly (does NOT trigger the component to re-render
              // synchronously in the test environment — simulates the batched scenario)
              act(() => {
                useMeetingStore.getState().setDisplayName(updatedName);
              });

              // Read the CURRENT store value — this is the ground truth
              const currentStoreDisplayName = useMeetingStore.getState().displayName;

              // Reset emit mock to isolate this iteration
              mockSocket.emit.mockClear();

              // ── Step 4: Call the STALE handleReact callback ──────────────────
              act(() => {
                staleCallback(emoji);
              });

              // ── Step 5: Assert the emitted displayName matches the store value ──
              const emojiReactionCall = mockSocket.emit.mock.calls.find(
                ([event]) => event === 'emoji-reaction'
              );

              // The event must have been emitted
              expect(
                emojiReactionCall,
                `Expected 'emoji-reaction' to be emitted after calling handleReact`
              ).toBeTruthy();

              const emittedPayload = emojiReactionCall[1];

              /**
               * CORE ASSERTION:
               *
               * The emitted displayName must equal the CURRENT store value.
               *
               * On UNFIXED code:
               *   emittedPayload.displayName = initialName (stale closure)
               *   currentStoreDisplayName    = updatedName
               *   → FAILS when initialName !== updatedName (i.e., almost always)
               *
               * On FIXED code:
               *   emittedPayload.displayName = useMeetingStore.getState().displayName
               *   = currentStoreDisplayName
               *   → PASSES
               */
              expect(emittedPayload.displayName).toBe(currentStoreDisplayName);
            }

            cleanup();
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    }
  );

  /**
   * **Validates: Requirements 3.10**
   *
   * Supplementary spot-check with a concrete sequence: Alice → Bob → Carol.
   * This makes the failure mode explicit and readable alongside the PBT output.
   *
   * On UNFIXED code: 'emoji-reaction' emits displayName='Alice' even when store
   * has 'Bob' or 'Carol' → FAILS with a concrete counterexample.
   *
   * On FIXED code: emits the current store value at each call → PASSES.
   */
  test(
    'Supplementary — concrete sequence Alice → Bob → Carol: emitted name always matches store',
    async () => {
      const sequence = ['Alice', 'Bob', 'Carol'];

      // Render with initial name
      useMeetingStore.getState().setMeetingId('m1');
      useMeetingStore.getState().setDisplayName(sequence[0]);

      renderMeetingRoom();
      expect(capturedOnReact).toBeTruthy();

      const staleCallback = capturedOnReact;

      for (let i = 1; i < sequence.length; i++) {
        const updatedName = sequence[i];

        act(() => {
          useMeetingStore.getState().setDisplayName(updatedName);
        });

        const currentStoreDisplayName = useMeetingStore.getState().displayName;
        mockSocket.emit.mockClear();

        act(() => {
          staleCallback('👍');
        });

        const emojiReactionCall = mockSocket.emit.mock.calls.find(
          ([event]) => event === 'emoji-reaction'
        );

        expect(emojiReactionCall).toBeTruthy();
        const emittedPayload = emojiReactionCall[1];

        // On UNFIXED code: emittedPayload.displayName = 'Alice' (stale) → FAILS
        // On FIXED code:   emittedPayload.displayName = updatedName → PASSES
        expect(emittedPayload.displayName).toBe(currentStoreDisplayName);
      }
    }
  );
});
