/**
 * Task 1.6 — Bug 4C pre-fix exploration: dominant speaker polling at 500 ms
 *
 * **Validates: Requirements 4.3**
 *
 * Property 1: Bug Condition — Stats Interval Too Aggressive
 *
 * This is a BUG CONDITION EXPLORATION test.
 * The test PASSES when the bug exists (unfixed code calls setInterval with 500 ms).
 * It will need to be inverted after the fix is applied (task 6.8 asserts 1000 ms).
 *
 * Counterexample documented:
 *   setInterval is called with 500 ms — with 4 peers this produces
 *   8 getStats() calls/second, causing unnecessary CPU and battery overhead on mobile.
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
  id: 'mock-socket-id-bug4c',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// ── Helper: fire the socket 'connect' event so the hook's useEffect runs ───────
const fireConnect = async () => {
  if (mockSocketHandlers['connect']) {
    await mockSocketHandlers['connect']();
  }
};

describe('Bug 4C pre-fix exploration — dominant speaker polling at 500 ms', () => {
  let setIntervalSpy;
  let capturedIntervals;

  beforeEach(() => {
    // Clear handler map so each test gets a fresh set
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    // Reset store state
    useMeetingStore.getState().reset();
    // Set required store values so the hook's useEffect activates
    useMeetingStore.getState().setMeetingId('test-meeting-bug4c');
    useMeetingStore.getState().setDisplayName('Bug4C User');

    // Spy on setInterval — capture all delay arguments actually passed
    capturedIntervals = [];
    setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation((fn, delay, ...args) => {
      capturedIntervals.push(delay);
      // Return a real-looking timer id; the cleanup calls clearInterval on it
      return globalThis.setTimeout(() => {}, 99999);
    });

    // Stub getUserMedia so initMedia() doesn't blow up
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
  });

  test(
    'Property 1 (Post-Fix): setInterval is called with 1000 ms delay — confirms dominant speaker polling interval was reduced from 500ms',
    async () => {
      // Dynamically import the hook AFTER mocks are set up so the vi.mock
      // interception is in place before the module is evaluated.
      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      // Trigger the connect event — this is when the useEffect body runs and
      // setInterval is registered for dominant speaker stats polling.
      await act(async () => {
        await fireConnect();
      });

      // ── ASSERT: setInterval was called at least once ────────────────────────
      expect(setIntervalSpy).toHaveBeenCalled();

      // ── ASSERT: the dominant speaker interval uses 1000 ms ──────────────────
      // Fix confirmed: interval was reduced from 500ms to 1000ms.
      const fixedIntervalDelay = capturedIntervals.find((delay) => delay === 1000);
      expect(fixedIntervalDelay).toBe(1000);

      // ── ASSERT: no interval uses the old 500ms buggy delay ──────────────────
      const oldBuggyDelay = capturedIntervals.find((delay) => delay === 500);
      expect(oldBuggyDelay).toBeUndefined();
    }
  );
});
