/**
 * Preservation Unit — Local Stream Muting Invariant
 *
 * Validates: Requirements 3.3
 *
 * Property 9: Preservation — Local Stream Muting
 * For any Tile render where isLocal === true, the code SHALL CONTINUE to pass
 * muted={true} to VideoPlayer to prevent audio feedback.
 *
 * These tests document the baseline (pre-fix) behavior: the existing
 * muted={isLocal} logic in Tile is already correct. Tests MUST PASS on
 * unfixed code.
 */

import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import Tile from '../Tile';

// A minimal mock stream that satisfies the `stream` prop so VideoPlayer renders
const mockStream = { getTracks: () => [] };

describe('Tile — local stream muting invariant (Preservation, Requirements 3.3)', () => {
  test('VideoPlayer receives muted={true} when isLocal is true', () => {
    const { container } = render(
      <Tile
        participantId="local-p1"
        displayName="Me"
        stream={mockStream}
        isLocal={true}
      />
    );

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video.muted).toBe(true);
  });

  test('VideoPlayer receives muted={false} when isLocal is false', () => {
    const { container } = render(
      <Tile
        participantId="remote-p2"
        displayName="Alice"
        stream={mockStream}
        isLocal={false}
      />
    );

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video.muted).toBe(false);
  });

  test('VideoPlayer receives muted={false} when isLocal is omitted (defaults to false)', () => {
    const { container } = render(
      <Tile
        participantId="remote-p3"
        displayName="Bob"
        stream={mockStream}
      />
    );

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video.muted).toBe(false);
  });
});
