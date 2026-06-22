/**
 * Task 1.2 — Bug 2 pre-fix exploration: rigid getUserMedia constraints
 *
 * **Validates: Requirements 2.1, 2.3**
 *
 * Property 1: Bug Condition — Mobile getUserMedia Exact Constraints
 *
 * This is a BUG CONDITION EXPLORATION test.
 * The test PASSES when the bug exists (unfixed code uses exact integer constraints).
 * It will need to be inverted after the fix is applied.
 *
 * Counterexample documented:
 *   getUserMedia({ video: { width: 1280, height: 720 } }) → OverconstrainedError on mobile
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMeetingStore from '../../store/useMeetingStore';

// ── Mock socket.io-client ──────────────────────────────────────────────────────
// We need a socket mock that lets us manually trigger the 'connect' event so
// that initMedia() runs inside the useEffect.
const mockSocketHandlers = {};
const mockSocket = {
  on: vi.fn((event, handler) => {
    mockSocketHandlers[event] = handler;
    return mockSocket;
  }),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'mock-socket-id',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// ── Helper: fire the socket 'connect' event ────────────────────────────────────
const fireConnect = async () => {
  if (mockSocketHandlers['connect']) {
    await mockSocketHandlers['connect']();
  }
};

describe('Bug 2 pre-fix exploration — rigid getUserMedia constraints', () => {
  let getUserMediaMock;

  beforeEach(() => {
    // Clear handler map so each test gets a fresh set
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    // Reset store state
    useMeetingStore.getState().reset();
    // Set required store values so the hook's useEffect activates
    useMeetingStore.getState().setMeetingId('test-meeting-123');
    useMeetingStore.getState().setDisplayName('Test User');

    // Default getUserMedia mock — rejects with OverconstrainedError for rigid constraints
    getUserMediaMock = vi.fn((constraints) => {
      const videoConstraints = constraints?.video;
      const isExactInteger =
        videoConstraints &&
        typeof videoConstraints.width === 'number' &&
        typeof videoConstraints.height === 'number';

      if (isExactInteger) {
        const err = new Error('OverconstrainedError: Constraints could not be satisfied');
        err.name = 'OverconstrainedError';
        return Promise.reject(err);
      }
      // Allow non-rigid constraints to succeed
      return Promise.resolve({
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [{ kind: 'audio' }],
        active: true,
      });
    });

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test(
    'Property 1 (Bug Condition): initMedia calls getUserMedia with exact integer width/height — OverconstrainedError on mobile',
    async () => {
      // Dynamically import the hook AFTER mocks are set up
      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      // Trigger the connect event so initMedia() runs
      await act(async () => {
        await fireConnect();
      });

      // ── ASSERT: getUserMedia was called (pre-fix: bug condition confirmed)  ──
      // NOTE: the secondary assertions about exact integer constraints have been
      // moved to the post-fix inverse describe block (task 4.5) which now asserts
      // ideal objects instead. The pre-fix code is now fixed, so we only verify
      // that getUserMedia IS called on the fresh-capture path.
      expect(getUserMediaMock).toHaveBeenCalled();

      // Counterexample documented: these exact constraints cause OverconstrainedError on mobile
      // getUserMedia({ audio: true, video: { width: 1280, height: 720 } }) → OverconstrainedError
    }
  );

  test(
    'Property 1 (Bug Condition): getUserMedia rejects OverconstrainedError for exact { width: 1280, height: 720 } — confirms mobile failure path',
    async () => {
      // This test documents the counterexample directly:
      // on mobile, the exact constraint call throws OverconstrainedError
      let caughtError = null;
      try {
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 },
        });
      } catch (err) {
        caughtError = err;
      }

      // Confirms bug: exact integer constraints are rejected
      expect(caughtError).not.toBeNull();
      expect(caughtError.name).toBe('OverconstrainedError');
    }
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// Task 1.3 — Bug 2 pre-fix exploration: stream reuse race condition
//
// **Validates: Requirements 2.3**
//
// Property 1: Bug Condition — Inactive Stream Re-request
//
// This is a BUG CONDITION EXPLORATION test.
// The test PASSES when the bug exists (unfixed code re-requests getUserMedia
// even when an inactive/stopped stream is in the store).
//
// Counterexample documented:
//   - PreJoinLobby stops the lobby stream before useWebRTC reads it
//   - existingStream.active === false → falls through to getUserMedia
//   - getUserMedia is called with rigid { width: 1280, height: 720 } constraints
//   - On iOS/Android this causes OverconstrainedError or NotAllowedError
// ══════════════════════════════════════════════════════════════════════════════

describe('Bug 2 pre-fix exploration — stream reuse race condition (inactive stream)', () => {
  let getUserMediaMock;

  beforeEach(() => {
    // Clear handler map so each test gets a fresh set
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    // Reset store state
    useMeetingStore.getState().reset();
    useMeetingStore.getState().setMeetingId('test-meeting-456');
    useMeetingStore.getState().setDisplayName('Race Condition User');

    // getUserMedia resolves with a minimal stream (we only care it IS called)
    getUserMediaMock = vi.fn().mockResolvedValue({
      getTracks: () => [],
      getVideoTracks: () => [],
      getAudioTracks: () => [{ kind: 'audio' }],
      active: true,
    });

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test(
    'Property 1 (Bug Condition): initMedia calls getUserMedia when localStream.active === false — confirms race condition path',
    async () => {
      // ── ARRANGE: put an INACTIVE stream into the store ─────────────────────
      // This simulates the race condition where PreJoinLobby's cleanup effect
      // stopped all tracks before useWebRTC.initMedia ran. The stream object
      // still exists in the store, but active === false.
      const stoppedStream = {
        active: false, // <-- key: this is the stopped/stale stream
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [],
      };
      useMeetingStore.getState().setLocalStream(stoppedStream);

      // Dynamically import the hook AFTER mocks are set up
      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      // Trigger the connect event so initMedia() runs
      await act(async () => {
        await fireConnect();
      });

      // ── ASSERT: getUserMedia WAS called despite a stream existing in the store
      // Bug condition: the guard `existingStream && existingStream.active` is falsy
      // for an inactive stream, so the code falls through to getUserMedia.
      expect(getUserMediaMock).toHaveBeenCalled();

      // Counterexample:
      //   store.localStream = { active: false, ... }   (stopped lobby stream)
      //   → initMedia guard: existingStream.active is false → falls through
      //   → getUserMedia called again (pre-fix: with rigid constraints; post-fix: with ideal)
      //   NOTE: post-fix constraint-shape assertions live in the task 4.5 describe blocks below.
    }
  );

  test(
    'Property 1 (Bug Condition): initMedia calls getUserMedia when no stream is in the store — baseline confirms fallback path exists',
    async () => {
      // ── ARRANGE: store has NO stream (null) ──────────────────────────────────
      // Ensure localStream is null — the guard `existingStream && existingStream.active`
      // is falsy for null, same code path as inactive stream.
      // (store was reset in beforeEach, so localStream is already null)
      expect(useMeetingStore.getState().localStream).toBeNull();

      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      await act(async () => {
        await fireConnect();
      });

      // getUserMedia must be called when no prior stream exists
      expect(getUserMediaMock).toHaveBeenCalled();

      // Counterexample note: this is the same fallback path triggered by inactive stream —
      // the bug is that an inactive stream in the store is treated identically to no stream,
      // forcing a fresh getUserMedia with rigid constraints on every race-condition occurrence.
    }
  );
});


// ══════════════════════════════════════════════════════════════════════════════
// Task 4.5 — Bug 2 post-fix verification: ideal constraints + stream reuse
//
// **Validates: Requirements 2.3, 2.4**
//
// Property 1: Expected Behavior — Mobile getUserMedia Uses Ideal Constraints
// and Reuses Stream
//
// These are POST-FIX inverse assertions.
// They assert the CORRECTED behavior and MUST PASS on the fixed code.
//
// The fix applied:
//   1. useWebRTC.initMedia now calls getUserMedia with ideal constraints:
//      { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
//   2. useWebRTC.initMedia now skips getUserMedia when localStream.active === true
// ══════════════════════════════════════════════════════════════════════════════

describe('Bug 2 post-fix verification — ideal getUserMedia constraints', () => {
  let getUserMediaMock;

  beforeEach(() => {
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    useMeetingStore.getState().reset();
    useMeetingStore.getState().setMeetingId('postfix-meeting-123');
    useMeetingStore.getState().setDisplayName('Fixed User');

    // getUserMedia resolves successfully — it no longer throws OverconstrainedError
    // because the fixed code uses ideal constraints that degrade gracefully
    getUserMediaMock = vi.fn().mockResolvedValue({
      getTracks: () => [],
      getVideoTracks: () => [{ kind: 'video', stop: vi.fn() }],
      getAudioTracks: () => [{ kind: 'audio', stop: vi.fn() }],
      active: true,
    });

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test(
    'Property 1 (Expected Behavior): initMedia calls getUserMedia with ideal constraints — { facingMode, width: {ideal}, height: {ideal} }',
    async () => {
      // ── ARRANGE: no prior stream in store (fresh capture path) ──────────────
      expect(useMeetingStore.getState().localStream).toBeNull();

      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      await act(async () => {
        await fireConnect();
      });

      // ── ASSERT: getUserMedia WAS called (no existing stream to reuse) ───────
      expect(getUserMediaMock).toHaveBeenCalled();

      const callArgs = getUserMediaMock.mock.calls[0][0];

      // Post-fix: video.width and video.height must be {ideal: N} objects, not integers
      expect(typeof callArgs.video.width).toBe('object');
      expect(callArgs.video.width).toEqual({ ideal: 1280 });

      expect(typeof callArgs.video.height).toBe('object');
      expect(callArgs.video.height).toEqual({ ideal: 720 });

      // Post-fix: facingMode is set for mobile front-camera selection
      expect(callArgs.video.facingMode).toBe('user');

      // Post-fix: audio must still be requested
      expect(callArgs.audio).toBe(true);

      // Full constraint shape assertion
      expect(callArgs).toEqual({
        audio: true,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    }
  );

  test(
    'Property 1 (Expected Behavior): ideal constraints do not throw OverconstrainedError — mobile capture succeeds',
    async () => {
      // Mock a "mobile browser" that rejects exact integers but accepts ideal constraints
      const mobileFriendlyGetUserMedia = vi.fn((constraints) => {
        const videoConstraints = constraints?.video;
        const isExactInteger =
          videoConstraints &&
          typeof videoConstraints.width === 'number' &&
          typeof videoConstraints.height === 'number';

        if (isExactInteger) {
          const err = new Error('OverconstrainedError');
          err.name = 'OverconstrainedError';
          return Promise.reject(err);
        }
        // Ideal constraints succeed on mobile
        return Promise.resolve({
          getTracks: () => [],
          getVideoTracks: () => [{ kind: 'video', stop: vi.fn() }],
          getAudioTracks: () => [{ kind: 'audio', stop: vi.fn() }],
          active: true,
        });
      });

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: { getUserMedia: mobileFriendlyGetUserMedia },
        configurable: true,
        writable: true,
      });

      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      await act(async () => {
        await fireConnect();
      });

      // Post-fix: getUserMedia was called and succeeded (no OverconstrainedError)
      expect(mobileFriendlyGetUserMedia).toHaveBeenCalled();

      // The store should have a stream (not a media error) because ideal constraints succeeded
      const mediaError = useMeetingStore.getState().mediaError;
      // No constraint error — either no error or only a non-constraint error
      if (mediaError) {
        expect(mediaError).not.toContain('Overconstrained');
      }
    }
  );
});

describe('Bug 2 post-fix verification — active stream reuse (no redundant getUserMedia)', () => {
  let getUserMediaMock;

  beforeEach(() => {
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    useMeetingStore.getState().reset();
    useMeetingStore.getState().setMeetingId('postfix-meeting-456');
    useMeetingStore.getState().setDisplayName('Stream Reuse User');

    getUserMediaMock = vi.fn().mockResolvedValue({
      getTracks: () => [],
      getVideoTracks: () => [{ kind: 'video', stop: vi.fn() }],
      getAudioTracks: () => [{ kind: 'audio', stop: vi.fn() }],
      active: true,
    });

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test(
    'Property 1 (Expected Behavior): initMedia does NOT call getUserMedia when localStream.active === true in the store',
    async () => {
      // ── ARRANGE: put an ACTIVE stream into the store ─────────────────────
      // This simulates the normal PreJoinLobby → MeetingRoom handoff where
      // the lobby stream was captured and is still active.
      const activeStream = {
        active: true, // <-- key: stream is still alive
        getTracks: () => [{ kind: 'video', stop: vi.fn() }, { kind: 'audio', stop: vi.fn() }],
        getVideoTracks: () => [{ kind: 'video', stop: vi.fn() }],
        getAudioTracks: () => [{ kind: 'audio', stop: vi.fn() }],
      };
      useMeetingStore.getState().setLocalStream(activeStream);

      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      await act(async () => {
        await fireConnect();
      });

      // ── ASSERT: getUserMedia was NOT called — active stream was reused ──────
      // Post-fix: the guard `existingStream && existingStream.active` is truthy
      // so initMedia returns early without calling getUserMedia
      expect(getUserMediaMock).not.toHaveBeenCalled();
    }
  );

  test(
    'Property 1 (Expected Behavior): initMedia DOES call getUserMedia when localStream is null — fresh capture path unaffected',
    async () => {
      // ── ARRANGE: no stream in store (null) ────────────────────────────────
      expect(useMeetingStore.getState().localStream).toBeNull();

      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      await act(async () => {
        await fireConnect();
      });

      // getUserMedia must still be called when there is no existing stream
      expect(getUserMediaMock).toHaveBeenCalled();

      // And it uses ideal constraints (combining both assertions)
      const callArgs = getUserMediaMock.mock.calls[0][0];
      expect(callArgs.video).toEqual({
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      });
    }
  );

  test(
    'Property 1 (Expected Behavior): initMedia DOES call getUserMedia when localStream.active === false — inactive stream not reused',
    async () => {
      // ── ARRANGE: put an INACTIVE stream into the store ────────────────────
      // This simulates a stopped/stale stream — getUserMedia must still be called
      // in this case (stream is unusable, needs fresh capture)
      const stoppedStream = {
        active: false,
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [],
      };
      useMeetingStore.getState().setLocalStream(stoppedStream);

      const { useWebRTC } = await import('../useWebRTC.js');

      await act(async () => {
        renderHook(() => useWebRTC());
      });

      await act(async () => {
        await fireConnect();
      });

      // getUserMedia must be called — inactive stream is not reusable
      expect(getUserMediaMock).toHaveBeenCalled();

      // Post-fix: it uses ideal constraints this time
      const callArgs = getUserMediaMock.mock.calls[0][0];
      expect(callArgs.video).toEqual({
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      });
    }
  );
});
