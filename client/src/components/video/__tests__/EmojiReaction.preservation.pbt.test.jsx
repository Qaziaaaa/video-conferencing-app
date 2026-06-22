/**
 * Task 2.3 — Preservation PBT: Reaction Position Stable When Left Is Pre-Stored
 *
 * Property 2: Preservation
 *
 * PURPOSE: Document the BASELINE behavior that post-fix code must also satisfy.
 * Generate random reaction objects where `left` IS already a stored numeric value.
 * Render EmojiReaction 10 times for each reaction; assert `left` style equals
 * `reaction.left` every render.
 *
 * EXPECTED OUTCOME on UNFIXED code:
 *   The unfixed EmojiReaction ignores `r.left` entirely and always computes
 *   `15 + Math.random() * 70` inline. Even when a reaction has a pre-stored
 *   `left` value, the rendered style will NOT equal `reaction.left`.
 *   → This test FAILS on unfixed code (documents the gap that the fix must close).
 *
 * EXPECTED OUTCOME on FIXED code:
 *   The fixed EmojiReaction reads `r.left` for the style. Since `left` is stored
 *   once at creation time, every render produces the same value.
 *   → This test PASSES on fixed code (preservation confirmed).
 *
 * Validates: Requirements 3.1
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useState } from 'react';
import fc from 'fast-check';
import EmojiReaction from '../EmojiReaction';

// ---------------------------------------------------------------------------
// Store mock — injectable reactions array so each fc.property run can
// supply its own generated reaction.
// ---------------------------------------------------------------------------
let mockReactions = [];

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => selector({ reactions: mockReactions });
  useStore.getState = () => ({ reactions: mockReactions });
  return { default: useStore };
});

// ---------------------------------------------------------------------------
// Wrapper that forces N additional re-renders by incrementing a counter.
// EmojiReaction is a child so any parent state change causes it to re-render.
// ---------------------------------------------------------------------------
function RerenderWrapper({ renderCount, onMount }) {
  const [tick, setTick] = useState(0);

  React.useEffect(() => {
    if (onMount) onMount({ increment: () => setTick((t) => t + 1) });
  }, [onMount]);

  return (
    <div data-tick={tick} data-renderCount={renderCount}>
      <EmojiReaction />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a reaction object that already has `left` stored as a numeric
 * value in the range [15, 85] (the valid animation range used by the component).
 */
const reactionWithStoredLeft = fc.record({
  id: fc.uuid(),
  emoji: fc.constantFrom('👍', '❤️', '😂', '🎉', '🔥', '👏', '😮', '😢'),
  socketId: fc.string({ minLength: 4, maxLength: 20 }),
  displayName: fc.string({ minLength: 1, maxLength: 30 }),
  createdAt: fc.integer({ min: 1_000_000, max: Date.now() }),
  // Pre-stored left value — this is what the FIXED component should read
  left: fc.float({ min: 15, max: 85, noNaN: true }),
});

// ---------------------------------------------------------------------------
// Helper: extract numeric left % from a span's inline style
// ---------------------------------------------------------------------------
function parseLeftPercent(spanEl) {
  const raw = spanEl?.style?.left ?? '';
  return parseFloat(raw);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Preservation PBT — Reaction Position Stable When Left Is Pre-Stored (Task 2.3)', () => {
  afterEach(() => {
    mockReactions = [];
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * Property 2: For any reaction that has a pre-stored `left` value, every
   * render of EmojiReaction should produce a `left` style equal to `reaction.left`.
   *
   * On UNFIXED code this FAILS because the component always calls Math.random()
   * instead of reading r.left — the rendered position will not equal reaction.left.
   *
   * On FIXED code this PASSES because `left: \`${r.left}%\`` is used directly.
   */
  test(
    'Property 2 — left style equals reaction.left across 10 re-renders for any pre-stored left value',
    async () => {
      await fc.assert(
        fc.asyncProperty(reactionWithStoredLeft, async (reaction) => {
          // Inject the generated reaction into the store mock
          mockReactions = [reaction];

          let controls = null;
          const { baseElement, unmount } = render(
            <RerenderWrapper
              renderCount={0}
              onMount={(c) => { controls = c; }}
            />
          );

          // Render 10 times and check left style each time
          for (let renderIndex = 0; renderIndex < 10; renderIndex++) {
            const span = baseElement.querySelector('span.absolute');
            expect(span).toBeTruthy();

            const renderedLeft = parseLeftPercent(span);

            /**
             * ASSERTION: the rendered left percentage must equal the stored
             * reaction.left value (within floating-point precision tolerance).
             *
             * On UNFIXED code: renderedLeft = 15 + Math.random() * 70
             *   → almost certainly != reaction.left → FAILS
             *
             * On FIXED code: renderedLeft = reaction.left → PASSES
             */
            expect(renderedLeft).toBeCloseTo(reaction.left, 5);

            // Force a re-render for the next iteration
            if (renderIndex < 9) {
              await act(async () => {
                controls?.increment();
              });
            }
          }

          unmount();
        }),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    }
  );

  /**
   * **Validates: Requirements 3.1**
   *
   * Supplementary check: for a fixed set of representative left values, confirm
   * stability across 10 renders. This makes the failure mode explicit and readable
   * in the test output alongside the PBT.
   */
  test(
    'Supplementary — left style stable for a fixed set of pre-stored left values (15, 42.5, 85)',
    async () => {
      const representativeLeftValues = [15, 42.5, 85];

      for (const storedLeft of representativeLeftValues) {
        const reaction = {
          id: `test-reaction-${storedLeft}`,
          emoji: '👍',
          socketId: 'socket-test',
          displayName: 'Alice',
          createdAt: Date.now(),
          left: storedLeft,
        };

        mockReactions = [reaction];

        let controls = null;
        const { baseElement, unmount } = render(
          <RerenderWrapper
            renderCount={0}
            onMount={(c) => { controls = c; }}
          />
        );

        for (let renderIndex = 0; renderIndex < 10; renderIndex++) {
          const span = baseElement.querySelector('span.absolute');
          expect(span).toBeTruthy();

          const renderedLeft = parseLeftPercent(span);

          // On unfixed code: Math.random() produces a different value → fails
          // On fixed code: r.left is read directly → always equals storedLeft
          expect(renderedLeft).toBeCloseTo(storedLeft, 5);

          if (renderIndex < 9) {
            await act(async () => {
              controls?.increment();
            });
          }
        }

        unmount();
        mockReactions = [];
      }
    }
  );
});
