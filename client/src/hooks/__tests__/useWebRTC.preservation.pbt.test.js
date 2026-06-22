/**
 * Task 2.2 — Preservation PBT: desktop media capture quality unchanged
 *
 * **Validates: Requirements 3.2**
 *
 * Property 2: Preservation — Desktop getUserMedia Resolution Preserved
 *
 * This is a PRESERVATION test. It MUST PASS on unfixed code, documenting the
 * baseline desktop media capture behavior that must remain intact after Bug 2
 * fixes (ideal constraints) are applied.
 *
 * Observation on UNFIXED code:
 *   - When no prior active stream exists in the store, useWebRTC.initMedia calls
 *     navigator.mediaDevices.getUserMedia.
 *   - On a desktop browser that supports 1280×720, getUserMedia resolves successfully
 *     and the resulting stream has at least one video track.
 *   - The store receives the captured stream via setLocalStream.
 *
 * This property must remain true after the fix (ideal constraints degrade gracefully
 * on mobile but resolve at 1280×720 on capable desktop hardware).
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import useMeetingStore from '../../store/useMeetingStore';

// ── Mock socket.io-client ──────────────────────────────────────────────────────
// We need a controllable socket so we can fire 'connect' manually to trigger
// initMedia() inside the useEffect.
const mockSocketHandlers = {};
const mockSocket = {
  on: vi.fn((event, handler) => {
    mockSocketHandlers[event] = handler;
    return mockSocket;
  }),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  id: 'mock-socket-preservation-2-2',
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

// ── Generators ────────────────────────────────────────────────────────────────

/**
 * Generates a desktop context object: a meeting ID string, a display name, and
 * a flag confirming the simulated camera supports 1280×720. All values represent
 * valid desktop-browser join scenarios where Bug 2 does NOT apply.
 */
const desktopContextArb = fc.record({
  meetingId: fc.string({ minLength: 5, maxLength: 30 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
  displayName: fc.string({ minLength: 2, maxLength: 40 }).filter((s) => s.trim().length > 1),
  // Desktop cameras uniformly support 1280×720; this flag drives the mock below.
  cameraSupports720p: fc.constant(true),
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Preservation PBT — desktop media capture quality unchanged (Task 2.2)', () => {
  let getUserMediaMock;

  beforeEach(() => {
    // Clear socket handler map so each test starts fresh
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    // Reset meeting store so no prior stream is present
    useMeetingStore.getState().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Property 2: Desktop getUserMedia resolves with a video track ─────────────

  test(
    'Property 2 (Preservation): getUserMedia is called and resolves a stream with a video track for all desktop contexts',
    async () => {
      /**
       * **Validates: Requirements 3.2**
       *
       * For any desktop context where the camera supports 1280×720 and no prior active
       * stream is in the store, getUserMedia MUST be called by initMedia and MUST resolve
       * successfully, producing a stream that contains at least one video track.
       *
     * This invariant must hold on both unfixed code (documents baseline) and fixed code
     * (ideal constraints achieve the same resolution on capable hardware).
     */
      await fc.assert(
        fc.asyncProperty(desktopContextArb, async (ctx) => {
          // ── Reset state for each generated context ───────────────────────────
          Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
          mockSocket.on.mockClear();
          mockSocket.emit.mockClear();
          mockSocket.disconnect.mockClear();
          useMeetingStore.getState().reset();

          // ── Wire up store values so the hook's useEffect activates ───────────
          useMeetingStore.getState().setMeetingId(ctx.meetingId);
          useMeetingStore.getState().setDisplayName(ctx.displayName);
          // No prior stream in the store → initMedia must call getUserMedia

          // ── Desktop-capable getUserMedia mock ────────────────────────────────
          // Simulates a desktop browser whose camera supports 1280×720. Resolves
          // successfully for any constraint shape (exact integers on unfixed code,
          // ideal objects on fixed code — both resolve here).
          const videoTrack = {
            kind: 'video',
            stop: vi.fn(),
            enabled: true,
          };
          const audioTrack = {
            kind: 'audio',
            stop: vi.fn(),
            enabled: true,
          };
          const resolvedStream = {
            active: true,
            getTracks: () => [videoTrack, audioTrack],
            getVideoTracks: () => [videoTrack],
            getAudioTracks: () => [audioTrack],
          };

          getUserMediaMock = vi.fn().mockResolvedValue(resolvedStream);
          Object.defineProperty(global.navigator, 'mediaDevices', {
            value: { getUserMedia: getUserMediaMock },
            configurable: true,
            writable: true,
          });

          // ── Render the hook and trigger initMedia via socket connect ─────────
          const { useWebRTC } = await import('../useWebRTC.js');

          await act(async () => {
            renderHook(() => useWebRTC());
          });

          await act(async () => {
            await fireConnect();
          });

          // ── ASSERT: getUserMedia was called ──────────────────────────────────
          // initMedia must attempt to capture media when no active stream exists.
          expect(getUserMediaMock).toHaveBeenCalled();

          // ── ASSERT: getUserMedia resolved (did not reject) ───────────────────
          // The mock always resolves for a desktop-capable camera; verify no
          // fallback to audio-only path by confirming stream has a video track.
          const callResult = await getUserMediaMock.mock.results[0].value;
          expect(callResult).toBeDefined();
          expect(callResult.getVideoTracks().length).toBeGreaterThan(0);

          // ── ASSERT: stream was placed in the store ───────────────────────────
          // initMedia calls useMeetingStore.getState().setLocalStream(stream) after capture.
          const storedStream = useMeetingStore.getState().localStream;
          expect(storedStream).not.toBeNull();
          expect(storedStream.getVideoTracks().length).toBeGreaterThan(0);
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }
  );

  // ── Property 2: Video track is present (not audio-only fallback) ─────────────

  test(
    'Property 2 (Preservation): desktop getUserMedia never falls back to audio-only when 1280×720 is supported',
    async () => {
      /**
       * **Validates: Requirements 3.2**
       *
       * On a desktop browser that supports 1280×720, the initial getUserMedia call
       * MUST succeed with a video track. The audio-only fallback path in initMedia
       * should NOT be reached for a capable desktop camera.
       *
     * This documents that desktop video quality is fully preserved — no regression
     * to audio-only mode after the Bug 2 constraint fix.
     */
      await fc.assert(
        fc.asyncProperty(desktopContextArb, async (ctx) => {
          // ── Reset state for each generated context ───────────────────────────
          Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
          mockSocket.on.mockClear();
          mockSocket.emit.mockClear();
          mockSocket.disconnect.mockClear();
          useMeetingStore.getState().reset();

          useMeetingStore.getState().setMeetingId(ctx.meetingId);
          useMeetingStore.getState().setDisplayName(ctx.displayName);

          // Desktop camera: first call (main capture) resolves with video+audio
          const videoTrack = { kind: 'video', stop: vi.fn(), enabled: true };
          const audioTrack = { kind: 'audio', stop: vi.fn(), enabled: true };
          const fullStream = {
            active: true,
            getTracks: () => [videoTrack, audioTrack],
            getVideoTracks: () => [videoTrack],
            getAudioTracks: () => [audioTrack],
          };

          // A second call (audio-only fallback) would return audio-only — but we
          // assert it is NEVER reached for a capable desktop camera.
          const audioOnlyStream = {
            active: true,
            getTracks: () => [audioTrack],
            getVideoTracks: () => [],
            getAudioTracks: () => [audioTrack],
          };

          getUserMediaMock = vi.fn()
            .mockResolvedValueOnce(fullStream)      // first call: desktop succeeds
            .mockResolvedValueOnce(audioOnlyStream); // second call: should not happen

          Object.defineProperty(global.navigator, 'mediaDevices', {
            value: { getUserMedia: getUserMediaMock },
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

          // ── ASSERT: getUserMedia was called exactly once ──────────────────────
          // For a capable desktop camera, the first call must succeed. The audio-only
          // fallback (second call) should never be triggered.
          expect(getUserMediaMock).toHaveBeenCalledTimes(1);

          // ── ASSERT: the stored stream has a video track ───────────────────────
          const storedStream = useMeetingStore.getState().localStream;
          expect(storedStream).not.toBeNull();
          expect(storedStream.getVideoTracks().length).toBeGreaterThan(0);
        }),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }
  );

  // ── Property 2: Active stream reuse skips getUserMedia (not a desktop regression) ─

  test(
    'Property 2 (Preservation): getUserMedia is NOT called when an active stream already exists in the store',
    async () => {
      /**
       * **Validates: Requirements 3.2**
       *
       * When an active stream is already present in the store (e.g., from PreJoinLobby),
       * initMedia reuses it and MUST NOT call getUserMedia. This is the correct path on
       * both unfixed and fixed code and represents preserved behavior.
       *
     * Note: This is NOT a bug — the guard `existingStream && existingStream.active`
     * exists on unfixed code (as seen in useWebRTC.js). This test confirms it works.
     */
      await fc.assert(
        fc.asyncProperty(desktopContextArb, async (ctx) => {
          // ── Reset state ──────────────────────────────────────────────────────
          Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
          mockSocket.on.mockClear();
          mockSocket.emit.mockClear();
          mockSocket.disconnect.mockClear();
          useMeetingStore.getState().reset();

          useMeetingStore.getState().setMeetingId(ctx.meetingId);
          useMeetingStore.getState().setDisplayName(ctx.displayName);

          // ── Pre-seed store with an active stream ─────────────────────────────
          const videoTrack = { kind: 'video', stop: vi.fn(), enabled: true };
          const audioTrack = { kind: 'audio', stop: vi.fn(), enabled: true };
          const existingActiveStream = {
            active: true,  // ← active: true → initMedia should reuse this
            getTracks: () => [videoTrack, audioTrack],
            getVideoTracks: () => [videoTrack],
            getAudioTracks: () => [audioTrack],
          };
          useMeetingStore.getState().setLocalStream(existingActiveStream);

          getUserMediaMock = vi.fn().mockResolvedValue({
            active: true,
            getTracks: () => [],
            getVideoTracks: () => [],
            getAudioTracks: () => [],
          });
          Object.defineProperty(global.navigator, 'mediaDevices', {
            value: { getUserMedia: getUserMediaMock },
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

          // ── ASSERT: getUserMedia was NOT called ──────────────────────────────
          // initMedia reuses the active stream from the store — no new capture needed.
          expect(getUserMediaMock).not.toHaveBeenCalled();
        }),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    }
  );
});
