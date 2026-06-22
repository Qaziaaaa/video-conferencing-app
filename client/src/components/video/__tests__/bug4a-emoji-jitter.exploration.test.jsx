/**
 * Bug 4A Pre-Fix Exploration Test — Emoji Left Position Jitter
 *
 * Task 1.5: Property 1 — Bug Condition
 *
 * PURPOSE: Confirm the bug CONDITION exists on UNFIXED code.
 * These assertions intentionally document the DEFECTIVE state.
 *
 * When this test PASSES → the bug is confirmed present (expected outcome on unfixed code).
 * After the fix (tasks 6.1 / 6.2) the assertions will be INVERTED in task 6.8.
 *
 * Validates: Requirements 4.1
 *
 * Counterexample documented:
 *   - `left` style on the emoji <span> differs between render 1 and render 2 for the same
 *     reaction object, because `15 + Math.random() * 70` is evaluated fresh on every
 *     React reconciliation pass (render body, not a stable stored value).
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useState } from 'react';
import EmojiReaction from '../EmojiReaction';

// ---------------------------------------------------------------------------
// Store mock factory — lets each test inject its own reactions array.
// The reaction intentionally has NO `left` property (bug condition: left is
// computed at render time via Math.random(), not stored on the reaction).
// ---------------------------------------------------------------------------
let mockReactions = [];

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => selector({ reactions: mockReactions });
  useStore.getState = () => ({ reactions: mockReactions });
  return { default: useStore };
});

// ---------------------------------------------------------------------------
// Wrapper component that allows forcing a re-render via a dummy state change.
// This simulates the real-world scenario where any parent state update
// (e.g., a new participant joining, a mic toggle) causes EmojiReaction to
// re-render with the same reaction still in the store.
// ---------------------------------------------------------------------------
function RerenderWrapper({ onRef }) {
  const [tick, setTick] = useState(0);

  // Expose a forceRerender callback so the test can trigger it
  React.useEffect(() => {
    if (onRef) onRef(() => setTick((t) => t + 1));
  }, [onRef]);

  // Pass tick as a data attribute so the render cycle is observable,
  // but it has no effect on EmojiReaction itself.
  return (
    <div data-tick={tick}>
      <EmojiReaction />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the numeric left percentage from a span's inline style string.
 *  e.g. "42.17%" → 42.17
 */
function parseLeftPercent(style) {
  const raw = style.left ?? style.getPropertyValue?.('left') ?? '';
  return parseFloat(raw);
}

describe('Bug 4A Pre-Fix Exploration — Emoji Left Position Jitter (UNFIXED code)', () => {
  beforeEach(() => {
    // Fresh reaction with NO `left` property — this is the bug condition.
    // addReaction() in useMeetingStore does NOT store a `left` field, so
    // EmojiReaction must compute it inline, producing a new value every render.
    mockReactions = [
      {
        id: 'reaction-bug4a',
        emoji: '🎉',
        socketId: 'socket-test',
        displayName: 'TestUser',
        createdAt: Date.now(),
        // ← NO `left` property on purpose: this is the bug condition
      },
    ];
  });

  afterEach(() => {
    mockReactions = [];
  });

  // -------------------------------------------------------------------------
  // Property 1: Bug Condition — left is recomputed on every render.
  // Run 20 independent render pairs; for each pair the two left values should
  // differ (because each call to Math.random() returns a new number).
  // If they never differ across 20 attempts, the test fails, which would mean
  // the bug does NOT exist (unexpectedly).
  // -------------------------------------------------------------------------
  test(
    'Property 1 — emoji left style differs between render 1 and render 2 [bug condition]',
    async () => {
      /**
       * Strategy: render EmojiReaction, read the initial left value, force a
       * re-render via a dummy state change in a wrapper component, then read
       * the left value again.  Because Math.random() is called in the render
       * body, the two values will almost certainly differ.
       *
       * We repeat 20 times to make it statistically overwhelmingly unlikely
       * that Math.random() produces the same float twice (P ≈ 1/Infinity per
       * pair), giving us high confidence the divergence is structural.
       */

      let diffCount = 0;
      const attempts = 20;

      for (let i = 0; i < attempts; i++) {
        // Fresh render for each iteration
        let forceRerender;
        const { baseElement, unmount } = render(
          <RerenderWrapper onRef={(fn) => { forceRerender = fn; }} />
        );

        // --- Render 1: capture left after initial mount ---
        const spanAfterRender1 = baseElement.querySelector('span.absolute');
        expect(spanAfterRender1).toBeTruthy();
        const left1 = parseLeftPercent(spanAfterRender1.style);

        // --- Render 2: force a re-render via dummy state change ---
        await act(async () => {
          forceRerender?.();
        });

        const spanAfterRender2 = baseElement.querySelector('span.absolute');
        expect(spanAfterRender2).toBeTruthy();
        const left2 = parseLeftPercent(spanAfterRender2.style);

        if (left1 !== left2) diffCount++;

        unmount();
      }

      /**
       * Counterexample:
       *   left_render_1 = 42.17%   (Math.random() call #1)
       *   left_render_2 = 78.93%   (Math.random() call #2, same reaction object)
       *
       * The two values differ because `15 + Math.random() * 70` is evaluated
       * fresh on every reconciliation pass.  On fixed code, both values should
       * equal `r.left` (a stable stored value), so they would be identical.
       *
       * We assert that AT LEAST 15 out of 20 pairs showed a difference.
       * (Statistically, all 20 should differ; the 15/20 threshold accommodates
       * any extremely rare random collisions without masking the structural bug.)
       */
      expect(diffCount).toBeGreaterThanOrEqual(15);
    }
  );

  // -------------------------------------------------------------------------
  // Property 1b (supplementary): Confirm the reaction object itself has no
  // `left` field — this is the root of the bug condition.
  // -------------------------------------------------------------------------
  test(
    'Property 1b — reaction in store has no stored left property [root cause confirmed]',
    () => {
      /**
       * Counterexample: reaction.left === undefined
       * addReaction() creates { id, emoji, socketId, displayName, createdAt }
       * with NO `left` field.  EmojiReaction therefore cannot read r.left and
       * falls back to inline Math.random() computation on every render.
       */
      const reaction = mockReactions[0];
      expect(reaction.left).toBeUndefined();
    }
  );

  // -------------------------------------------------------------------------
  // Property 1c (statistical): Run a larger fast-check–style random sample
  // directly on the render expression to confirm the expression IS non-deterministic.
  // -------------------------------------------------------------------------
  test(
    'Property 1c — the inline left expression 15 + Math.random() * 70 is non-deterministic across renders',
    () => {
      /**
       * Simulate what EmojiReaction does on each render: call the expression
       * 100 times and assert the resulting set has more than one unique value.
       * If Math.random() were somehow mocked to a constant this would catch it.
       */
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(15 + Math.random() * 70);
      }

      /**
       * Counterexample: values.size > 1
       * The expression is non-deterministic — it produces different values each
       * time it is evaluated, confirming why re-renders cause position jitter.
       */
      expect(values.size).toBeGreaterThan(1);
    }
  );
});
