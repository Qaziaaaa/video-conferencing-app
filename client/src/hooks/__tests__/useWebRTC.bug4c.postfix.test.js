/**
 * Task 6.8 — Bug 4C Post-Fix: dominant speaker setInterval called with 1000 ms
 *
 * **Property 1: Expected Behavior** - Interval Reduced
 *
 * PURPOSE:
 *   Re-run the SAME scenario from task 1.6 but assert FIXED behavior.
 *   After the fix, setInterval is called with 1000 ms (not 500 ms).
 *
 * Fix confirmed:
 *   useWebRTC.js: setInterval(..., 1000) (was 500)
 *   Halves getStats() calls from 8/sec to 4/sec with 4 peers.
 *
 * **Validates: Requirement 2.12**
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMeetingStore from '../../store/useMeetingStore';

// ── Mock socket.io-client ──────────────────────────────────────────────────────
const mockSocketHandlers = {};
const mockSocket = {
  on: vi.fn((event, handler) => {
    mockSocketHandlers[event] = handler;
    return mockSocket;
  }),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'mock-socket-id-bug4c-postfix',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// ── Helper: fire the socket 'connect' event so the hook's useEffect runs ──────
const fireConnect = async () => {
  if (mockSocketHandlers['connect']) {
    await mockSocketHandlers['connect']();
  }
};

describe('Bug 4C Post-Fix — dominant speaker polling at 1000 ms (FIXED)', () => {
  let setIntervalSpy;
  let capturedIntervals;

  beforeEach(() => {
    // Clear handler map so each test gets a fresh set
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    // Reset store to clean state, then configure required values
    useMeetingStore.getState().reset();
    useMeetingStore.getState().setMeetingId('test-meeting-bug4c-postfix');
    useMeetingStore.getState().setDisplayName('Bug4C PostFix User');

    // Spy on setInterval — capture all delay arguments
    capturedIntervals = [];
    setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation((_fn, delay) => {
      capturedIntervals.push(delay);
      return globalThis.setTimeout(() => {}, 99999);
    });

    // Stub getUserMedia so initMedia() doesn't throw
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [],
          getVideoTracks: () => [],
          getAudioTracks: () => [{ kind: 'audio' }],
          active: true,
        }),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    vi.clearAllMocks();
    useMeetingStore.getState().reset();
  });

  test(
    'Property 1 (Fixed) — setInterval is called with 1000 ms delay (NOT 500 ms)',
    async () => {
      /**
       * INVERSE of task 1.6 bug condition test.
       *
       * On FIXED code (task 6.4): setInterval(..., 1000)
       *   - capturedIntervals contains 1000
       *   - capturedIntervals does NOT contain 500
       *
       * With 4 peers: 4 getStats() calls/second (was 8 at 500 ms).
       */
      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      // Trigger the connect event — this is when setInterval is registered
      await act(async () => {
        await fireConnect();
      });

      // Assert: setInterval was called at least once
      expect(setIntervalSpy).toHaveBeenCalled();

      // Assert: 1000 ms interval IS present — the fix has been applied
      const fixedDelay = capturedIntervals.find((d) => d === 1000);
      expect(fixedDelay).toBe(1000);
    }
  );

  test(
    'Property 1b (Fixed) — no setInterval call uses 500 ms — confirms bug is eliminated',
    async () => {
      /**
       * Companion assertion: ensure the 500 ms aggressive interval is gone.
       * This directly inverts task 1.6's second assertion that confirmed
       * "no 1000 ms interval was present on unfixed code".
       */
      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      await act(async () => {
        await fireConnect();
      });

      // Ensure the hook registered at least one interval so this assertion is meaningful
      expect(setIntervalSpy).toHaveBeenCalled();

      // The 500 ms interval must NOT appear after the fix
      const bugDelay = capturedIntervals.find((d) => d === 500);
      expect(bugDelay).toBeUndefined();
    }
  );
});
