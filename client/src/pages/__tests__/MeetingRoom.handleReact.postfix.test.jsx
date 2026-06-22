/**
 * Task 6.8 — Bug 4D Post-Fix: handleReact emits current store displayName at call time
 *
 * **Property 1: Expected Behavior** - DisplayName Current
 *
 * PURPOSE:
 *   Re-run the SAME scenario from task 2.5 (stale closure preservation PBT)
 *   but assert FIXED behavior: handleReact always emits the current store
 *   displayName, not a stale closed-over value.
 *
 * Fix confirmed:
 *   MeetingRoom.jsx: handleReact reads useMeetingStore.getState() at call time.
 *   useCallback deps = [] — no closed-over render values.
 *
 * **Validates: Requirements 2.13**
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MeetingRoom from '../MeetingRoom';
import useMeetingStore from '../../store/useMeetingStore';
import useUIStore from '../../store/useUIStore';
import useChatStore from '../../store/useChatStore';

// ---------------------------------------------------------------------------
// Socket mock — records every emit call.
// ---------------------------------------------------------------------------
const mockSocket = {
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'socket-id-postfix-test',
};

// ---------------------------------------------------------------------------
// MeetingLayout mock — captures the onReact prop for direct invocation.
// ---------------------------------------------------------------------------
let capturedOnReact = null;

vi.mock('../../components/layout/MeetingLayout', () => ({
  default: vi.fn(({ onReact }) => {
    capturedOnReact = onReact;
    return <div data-testid="meeting-layout-mock" />;
  }),
}));

// ---------------------------------------------------------------------------
// Hook mocks — minimal stubs so MeetingRoom renders without network/media.
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
// Tests
// ---------------------------------------------------------------------------

describe('Bug 4D Post-Fix — handleReact emits current store displayName at call time', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useUIStore.getState().reset();
    useChatStore.getState().reset();
    vi.clearAllMocks();
    capturedOnReact = null;

    // Re-apply return values after clearAllMocks
    mockSocket.on.mockReturnThis();
    mockSocket.off.mockReturnThis();
  });

  afterEach(() => {
    cleanup();
  });

  test(
    'Property 1 (Fixed) — emitted displayName equals useMeetingStore.getState().displayName at call time',
    () => {
      /**
       * VERIFIES the fix from task 6.5.
       *
       * Bug condition (unfixed): handleReact closed over displayName from render scope.
       *   When the store updated displayName without a re-render, the callback still
       *   held the OLD value and emitted a stale name.
       *
       * Fixed behavior: handleReact calls useMeetingStore.getState() at invocation time.
       *   Even a "stale" callback (created with initialName) reads the current store
       *   value when called → emitted displayName is always current.
       *
       * Test strategy (mirrors task 2.5 preservation PBT):
       *   1. Render MeetingRoom with initialName → handleReact is created.
       *   2. Capture the callback (simulates a "stale" reference from before name change).
       *   3. Update displayName in the store directly (bypasses React re-render batching).
       *   4. Call the captured callback.
       *   5. Assert emitted displayName === current store value (updatedName).
       */
      const initialName = 'InitialUser';
      const updatedName = 'UpdatedUser';

      useMeetingStore.getState().setMeetingId('m1');
      useMeetingStore.getState().setDisplayName(initialName);

      renderMeetingRoom();
      expect(capturedOnReact).toBeTruthy();

      // Capture the callback — on UNFIXED code this would be "stale" (bound to initialName)
      const callback = capturedOnReact;

      // Update displayName in the store WITHOUT triggering re-render
      act(() => {
        useMeetingStore.getState().setDisplayName(updatedName);
      });

      const currentStoreDisplayName = useMeetingStore.getState().displayName;
      expect(currentStoreDisplayName).toBe(updatedName);

      mockSocket.emit.mockClear();

      // Call the callback
      act(() => {
        callback('👍');
      });

      const emojiEmitCall = mockSocket.emit.mock.calls.find(
        ([event]) => event === 'emoji-reaction'
      );

      expect(emojiEmitCall).toBeTruthy();
      const payload = emojiEmitCall[1];

      /**
       * CORE ASSERTION:
       *
       * On UNFIXED code:
       *   payload.displayName = 'InitialUser' (stale closure) → FAILS
       *
       * On FIXED code:
       *   payload.displayName = useMeetingStore.getState().displayName = 'UpdatedUser'
       *   → PASSES
       */
      expect(payload.displayName).toBe(updatedName);
    }
  );

  test(
    'Concrete sequence — Alice → Bob → Carol: emitted name always matches current store',
    () => {
      /**
       * Supplementary spot-check mirroring task 2.5's concrete sequence test.
       * Three name updates; each time the callback is called, it must emit the
       * current name (not the stale initial name).
       */
      const sequence = ['Alice', 'Bob', 'Carol'];

      useMeetingStore.getState().setMeetingId('m1');
      useMeetingStore.getState().setDisplayName(sequence[0]);

      renderMeetingRoom();
      expect(capturedOnReact).toBeTruthy();

      const callback = capturedOnReact;

      for (let i = 1; i < sequence.length; i++) {
        const updatedName = sequence[i];

        // Update store
        act(() => {
          useMeetingStore.getState().setDisplayName(updatedName);
        });

        const currentName = useMeetingStore.getState().displayName;
        mockSocket.emit.mockClear();

        act(() => {
          callback('❤️');
        });

        const emojiEmitCall = mockSocket.emit.mock.calls.find(
          ([event]) => event === 'emoji-reaction'
        );

        expect(emojiEmitCall).toBeTruthy();

        // Fixed: emits current store name; bug: would emit 'Alice' every time
        expect(emojiEmitCall[1].displayName).toBe(currentName);
      }
    }
  );

  test(
    'handleReact emits an emoji-reaction event with the emoji passed as argument',
    () => {
      /**
       * Supplementary: verify the basic emission shape is correct —
       * the emoji argument is forwarded in the event payload.
       */
      useMeetingStore.getState().setMeetingId('m1');
      useMeetingStore.getState().setDisplayName('EmojiTester');

      renderMeetingRoom();
      expect(capturedOnReact).toBeTruthy();

      mockSocket.emit.mockClear();

      act(() => {
        capturedOnReact('🎉');
      });

      const emojiEmitCall = mockSocket.emit.mock.calls.find(
        ([event]) => event === 'emoji-reaction'
      );

      expect(emojiEmitCall).toBeTruthy();
      expect(emojiEmitCall[1].emoji).toBe('🎉');
      expect(emojiEmitCall[1].meetingId).toBe('m1');
    }
  );
});
