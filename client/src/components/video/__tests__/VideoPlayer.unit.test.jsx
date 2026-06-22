/**
 * VideoPlayer Unit Tests — Task 7.1
 *
 * Validates: Requirements 2.1, 2.2, 2.5
 *
 * Covers:
 *   1. Video element uses willChange: 'transform' for GPU promotion hint
 *   2. Video element does NOT use transform: 'translateZ(0)' (no forced stacking context)
 *   3. Video element does NOT have an isolation style property
 *   4. muted prop is accepted and applied correctly
 *   5. muted defaults to false (remote tile behaviour)
 */

import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import VideoPlayer from '../VideoPlayer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render VideoPlayer and return the <video> element. */
function renderVideo(props = {}) {
  const { container } = render(<VideoPlayer stream={null} {...props} />);
  return container.querySelector('video');
}

// ---------------------------------------------------------------------------
// Style tests — Requirements 2.1, 2.2
// ---------------------------------------------------------------------------

describe('VideoPlayer — GPU promotion style (Requirements 2.1, 2.2)', () => {
  test('video element has willChange: "transform" style', () => {
    const video = renderVideo();
    expect(video.style.willChange).toBe('transform');
  });

  test('video element does NOT have transform: translateZ(0)', () => {
    const video = renderVideo();
    // translateZ(0) forces an unconditional CSS stacking context which breaks
    // z-ordering with portaled emoji overlays.
    expect(video.style.transform).not.toBe('translateZ(0)');
  });

  test('video element has no transform style at all', () => {
    // After the fix, no inline transform should be set on the video element.
    const video = renderVideo();
    expect(video.style.transform).toBeFalsy();
  });

  test('video element does NOT have isolation style property', () => {
    // isolation: isolate would create a competing stacking context; it must
    // not appear on the video element itself.
    const video = renderVideo();
    expect(video.style.isolation).toBeFalsy();
    expect(video.style.isolation).not.toBe('isolate');
  });
});

// ---------------------------------------------------------------------------
// muted prop tests — Requirement 2.5
// ---------------------------------------------------------------------------

describe('VideoPlayer — muted prop (Requirement 2.5)', () => {
  test('defaults muted to false when no muted prop is provided (remote tile default)', () => {
    const video = renderVideo();
    expect(video.muted).toBe(false);
  });

  test('muted={false} explicitly keeps video unmuted', () => {
    const video = renderVideo({ muted: false });
    expect(video.muted).toBe(false);
  });

  test('muted={true} mutes the video element (local self-view tile)', () => {
    const video = renderVideo({ muted: true });
    expect(video.muted).toBe(true);
  });

  test('muted state is independent of stream being null', () => {
    // Even with no stream, the muted attribute reflects the prop.
    const mutedVideo = renderVideo({ stream: null, muted: true });
    const liveVideo = renderVideo({ stream: null, muted: false });
    expect(mutedVideo.muted).toBe(true);
    expect(liveVideo.muted).toBe(false);
  });

  test('muted state is independent of stream being a mock MediaStream', () => {
    const mockStream = { getTracks: () => [], getAudioTracks: () => [], getVideoTracks: () => [], active: true };
    const mutedVideo = renderVideo({ stream: mockStream, muted: true });
    const liveVideo = renderVideo({ stream: mockStream, muted: false });
    expect(mutedVideo.muted).toBe(true);
    expect(liveVideo.muted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Baseline rendering tests — sanity checks
// ---------------------------------------------------------------------------

describe('VideoPlayer — baseline rendering', () => {
  test('renders a <video> element', () => {
    const video = renderVideo();
    expect(video).toBeInTheDocument();
  });

  test('video has autoPlay attribute', () => {
    const video = renderVideo();
    expect(video.autoplay).toBe(true);
  });

  test('video has playsInline attribute', () => {
    const video = renderVideo();
    // playsInline maps to the 'playsinline' attribute in the DOM
    expect(video.hasAttribute('playsinline')).toBe(true);
  });

  test('accepts a custom className that is applied to the video element', () => {
    const { container } = render(<VideoPlayer stream={null} className="my-custom-class" />);
    const video = container.querySelector('video');
    expect(video.classList.contains('my-custom-class')).toBe(true);
  });

  test('sets srcObject to the provided stream', () => {
    const stream = { getTracks: () => [], active: true };
    const { container } = render(<VideoPlayer stream={stream} />);
    const video = container.querySelector('video');
    expect(video.srcObject).toBe(stream);
  });

  test('handles null stream without throwing', () => {
    expect(() => renderVideo({ stream: null })).not.toThrow();
  });
});
