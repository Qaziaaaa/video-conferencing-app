/**
 * Task 2.6 — Preservation PBT: Aria-Live Always Reflects Latest Reaction
 *
 * Property 2: Preservation — Aria-Live Text Accuracy
 *
 * PURPOSE: Document the MISSING accessibility feature on UNFIXED code.
 * Generate random reaction arrays with varying last reactions.
 * Render EmojiReaction with each array; assert the aria-live region text
 * matches the most recent reaction (last item in the array).
 *
 * OBSERVATION on UNFIXED code:
 *   EmojiReaction has NO aria-live region at all. The component renders only
 *   animated <span> elements and a <style> block — no element with
 *   aria-live="polite" exists in the output.
 *   → This test FAILS on unfixed code (documents missing accessibility gap).
 *
 * EXPECTED OUTCOME on FIXED code (task 6.7):
 *   A visually-hidden <div aria-live="polite"> is added inside the portal.
 *   Its text content equals:
 *     `${reactions[reactions.length-1].displayName} reacted with ${reactions[reactions.length-1].emoji}`
 *   → This test PASSES on fixed code (preservation confirmed).
 *
 * **Validates: Requirements 3.1**
 */

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import fc from 'fast-check';
import EmojiReaction from '../EmojiReaction';

// ---------------------------------------------------------------------------
// Store mock — injectable reactions array so each fc.property run can
// supply its own generated reaction array.
// ---------------------------------------------------------------------------
let mockReactions = [];

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => selector({ reactions: mockReactions });
  useStore.getState = () => ({ reactions: mockReactions });
  return { default: useStore };
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A single reaction object — matches the shape produced by addReaction(). */
const reactionArbitrary = fc.record({
  id: fc.uuid(),
  emoji: fc.constantFrom('👍', '❤️', '😂', '🎉', '🔥', '👏', '😮', '😢'),
  socketId: fc.string({ minLength: 4, maxLength: 20 }),
  displayName: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
  createdAt: fc.integer({ min: 1_000_000, max: Date.now() }),
});

/**
 * An array of 1–6 reactions (non-empty so EmojiReaction does not early-return null).
 * The LAST element is the "most recent" reaction whose text must appear in aria-live.
 */
const reactionsArrayArbitrary = fc.array(reactionArbitrary, { minLength: 1, maxLength: 6 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the expected aria-live announcement text for a given reaction.
 * Matches the format defined in design.md / task 6.7:
 *   `${displayName} reacted with ${emoji}`
 */
function expectedAnnouncementText(reaction) {
  return `${reaction.displayName} reacted with ${reaction.emoji}`;
}

/**
 * Find the aria-live region inside the rendered output.
 * On unfixed code this will be null — no aria-live element exists.
 */
function findAriaLiveRegion(baseElement) {
  return baseElement.querySelector('[aria-live="polite"]');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Preservation PBT — Aria-Live Always Reflects Latest Reaction (Task 2.6)', () => {
  afterEach(() => {
    mockReactions = [];
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * Property 2: For any non-empty reactions array, the EmojiReaction component
   * MUST render an element with aria-live="polite" whose text content describes
   * the most recent (last) reaction.
   *
   * On UNFIXED code:
   *   - No aria-live element exists at all → findAriaLiveRegion() returns null
   *   - The first assertion (expect(ariaLiveEl).not.toBeNull()) FAILS immediately
   *   - This documents the missing accessibility feature
   *
   * On FIXED code (task 6.7):
   *   - A <div aria-live="polite" className="sr-only"> is present in the portal
   *   - Its text content equals the announcement for the last reaction
   *   - All assertions PASS
   */
  test(
    'Property 2 — aria-live region exists and announces the most recent reaction [FAILS on unfixed code]',
    () => {
      fc.assert(
        fc.property(reactionsArrayArbitrary, (reactions) => {
          // Inject the generated reactions array into the store mock
          mockReactions = reactions;

          const { baseElement, unmount } = render(<EmojiReaction />);

          // --- Assertion 1: aria-live region must exist ---
          // COUNTEREXAMPLE on unfixed code:
          //   reactions = [{ emoji: '👍', displayName: 'Alice', ... }]
          //   No element with aria-live="polite" is present in the DOM.
          //   → null is returned → this assertion FAILS → test FAILS (expected)
          const ariaLiveEl = findAriaLiveRegion(baseElement);
          expect(ariaLiveEl).not.toBeNull();

          // --- Assertion 2: aria-live region must contain the latest reaction text ---
          // (Only reached on fixed code where Assertion 1 passes)
          const latestReaction = reactions[reactions.length - 1];
          const expected = expectedAnnouncementText(latestReaction);
          expect(ariaLiveEl.textContent).toBe(expected);

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
   * Supplementary deterministic check: verify aria-live text with fixed
   * representative inputs so the failure mode is immediately readable.
   *
   * On UNFIXED code: fails at the aria-live element presence check.
   * On FIXED code: passes with exact text content match.
   */
  test(
    'Supplementary — aria-live text matches last reaction for fixed representative inputs',
    () => {
      const representativeArrays = [
        // Single reaction
        [{ id: '1', emoji: '👍', socketId: 'abc', displayName: 'Alice', createdAt: 1000 }],
        // Multiple reactions — only the last matters
        [
          { id: '1', emoji: '❤️', socketId: 'abc', displayName: 'Bob', createdAt: 1000 },
          { id: '2', emoji: '🎉', socketId: 'def', displayName: 'Carol', createdAt: 2000 },
          { id: '3', emoji: '🔥', socketId: 'ghi', displayName: 'Dave', createdAt: 3000 },
        ],
        // Two reactions — last wins
        [
          { id: '1', emoji: '😂', socketId: 'abc', displayName: 'Eve', createdAt: 1000 },
          { id: '2', emoji: '👏', socketId: 'def', displayName: 'Frank', createdAt: 2000 },
        ],
      ];

      for (const reactions of representativeArrays) {
        mockReactions = reactions;

        const { baseElement, unmount } = render(<EmojiReaction />);

        const ariaLiveEl = findAriaLiveRegion(baseElement);

        // On UNFIXED code: ariaLiveEl is null — documents the missing feature
        expect(ariaLiveEl).not.toBeNull();

        const latestReaction = reactions[reactions.length - 1];
        expect(ariaLiveEl.textContent).toBe(expectedAnnouncementText(latestReaction));

        unmount();
        mockReactions = [];
      }
    }
  );

  /**
   * **Validates: Requirements 3.1**
   *
   * Edge case: when the reactions array has only one item, that single reaction
   * IS the most recent reaction. The aria-live region must announce it.
   */
  test(
    'Supplementary — single-reaction array: aria-live announces the only reaction',
    () => {
      const singleReaction = {
        id: 'solo',
        emoji: '😮',
        socketId: 'socket-x',
        displayName: 'Grace',
        createdAt: Date.now(),
      };

      mockReactions = [singleReaction];

      const { baseElement, unmount } = render(<EmojiReaction />);

      const ariaLiveEl = findAriaLiveRegion(baseElement);

      // On UNFIXED code: no aria-live element → fails here
      expect(ariaLiveEl).not.toBeNull();
      expect(ariaLiveEl.textContent).toBe('Grace reacted with 😮');

      unmount();
    }
  );
});
