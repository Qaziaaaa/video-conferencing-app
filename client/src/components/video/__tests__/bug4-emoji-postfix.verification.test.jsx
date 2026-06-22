/**
 * Task 6.8 — Bug 4A/4F Post-Fix: EmojiReaction renders r.left stably + aria-live
 *
 * **Property 1: Expected Behavior** - Emoji Position Stable, Aria-Live Present
 *
 * PURPOSE:
 *   (A) Assert EmojiReaction renders r.left style value identically across two
 *       forced re-renders (inverse of task 1.5 bug condition).
 *   (F) Assert EmojiReaction portal contains an element with aria-live="polite".
 *
 * Fixes confirmed:
 *   - EmojiReaction.jsx: reads r.left (not Math.random()) → stable position
 *   - EmojiReaction.jsx: has aria-live="polite" sr-only region
 *
 * **Validates: Requirements 2.10, 2.15**
 */

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import React, { useState } from 'react';
import EmojiReaction from '../EmojiReaction';

// ---------------------------------------------------------------------------
// Store mock — inject reactions with a pre-stored left value (the fixed shape).
// ---------------------------------------------------------------------------
let mockReactions = [];

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => selector({ reactions: mockReactions });
  useStore.getState = () => ({ reactions: mockReactions });
  return { default: useStore };
});

// ---------------------------------------------------------------------------
// Wrapper that allows forcing re-renders (same as task 1.5 exploration test).
// ---------------------------------------------------------------------------
function RerenderWrapper({ onRef }) {
  const [tick, setTick] = useState(0);

  React.useEffect(() => {
    if (onRef) onRef(() => setTick((t) => t + 1));
  }, [onRef]);

  return (
    <div data-tick={tick}>
      <EmojiReaction />
    </div>
  );
}

/** Extract the numeric left percentage from a span's inline style. */
function parseLeftPercent(span) {
  return parseFloat(span.style.left ?? '');
}

// ===========================================================================
// Section A — r.left is rendered identically across two forced re-renders
// Validates: Requirement 2.10
// ===========================================================================

describe('Bug 4A Post-Fix — EmojiReaction renders r.left identically across re-renders', () => {
  afterEach(() => {
    mockReactions = [];
    cleanup();
  });

  test(
    'Property 1 (Fixed) — left style is IDENTICAL across render 1 and render 2 for same reaction',
    async () => {
      /**
       * INVERSE of task 1.5 bug condition test.
       *
       * Bug condition (unfixed): two renders of the same reaction produced
       * different left values (Math.random() called in render body).
       *
       * Expected behavior (fixed): EmojiReaction reads r.left which is a stable
       * stored value — both renders produce the same percentage.
       *
       * We run 10 pairs; ALL should show left_1 === left_2.
       */
      const STORED_LEFT = 42.5;

      mockReactions = [
        {
          id: 'reaction-postfix-4a',
          emoji: '🎉',
          socketId: 'socket-test',
          displayName: 'FixedUser',
          createdAt: Date.now(),
          left: STORED_LEFT,
        },
      ];

      let differentCount = 0;
      const attempts = 10;

      for (let i = 0; i < attempts; i++) {
        let forceRerender;
        const { baseElement, unmount } = render(
          <RerenderWrapper onRef={(fn) => { forceRerender = fn; }} />
        );

        // Render 1: capture left after initial mount
        const spanAfterRender1 = baseElement.querySelector('span.absolute');
        expect(spanAfterRender1).toBeTruthy();
        const left1 = parseLeftPercent(spanAfterRender1);

        // Render 2: force a re-render via dummy state change
        await act(async () => {
          forceRerender?.();
        });

        const spanAfterRender2 = baseElement.querySelector('span.absolute');
        expect(spanAfterRender2).toBeTruthy();
        const left2 = parseLeftPercent(spanAfterRender2);

        if (left1 !== left2) differentCount++;

        unmount();
      }

      /**
       * Post-fix expectation: differentCount === 0.
       * Both renders read r.left = 42.5 — no position drift.
       * (Contrast with bug: ≥ 15/20 pairs differed.)
       */
      expect(differentCount).toBe(0);
    }
  );

  test(
    'Post-fix — left style equals the stored r.left value on first render',
    () => {
      const STORED_LEFT = 67.3;

      mockReactions = [
        {
          id: 'reaction-check-left',
          emoji: '👍',
          socketId: 'socket-check',
          displayName: 'CheckUser',
          createdAt: Date.now(),
          left: STORED_LEFT,
        },
      ];

      const { baseElement } = render(<EmojiReaction />);
      const span = baseElement.querySelector('span.absolute');
      expect(span).toBeTruthy();

      expect(parseLeftPercent(span)).toBeCloseTo(STORED_LEFT, 5);
    }
  );

  test(
    'Post-fix — reaction with left=15 (boundary min) renders at exactly 15%',
    () => {
      mockReactions = [
        {
          id: 'reaction-min',
          emoji: '😂',
          socketId: 'socket-min',
          displayName: 'MinUser',
          createdAt: Date.now(),
          left: 15,
        },
      ];

      const { baseElement } = render(<EmojiReaction />);
      const span = baseElement.querySelector('span.absolute');
      expect(span).toBeTruthy();
      expect(parseLeftPercent(span)).toBeCloseTo(15, 5);
    }
  );

  test(
    'Post-fix — reaction with left=84 (near boundary max) renders at exactly 84%',
    () => {
      mockReactions = [
        {
          id: 'reaction-max',
          emoji: '🔥',
          socketId: 'socket-max',
          displayName: 'MaxUser',
          createdAt: Date.now(),
          left: 84,
        },
      ];

      const { baseElement } = render(<EmojiReaction />);
      const span = baseElement.querySelector('span.absolute');
      expect(span).toBeTruthy();
      expect(parseLeftPercent(span)).toBeCloseTo(84, 5);
    }
  );
});

// ===========================================================================
// Section F — EmojiReaction portal contains aria-live="polite" region
// Validates: Requirement 2.15
// ===========================================================================

describe('Bug 4F Post-Fix — EmojiReaction portal contains aria-live="polite" region', () => {
  afterEach(() => {
    mockReactions = [];
    cleanup();
  });

  test(
    'Portal contains a div with aria-live="polite" when reactions are present',
    () => {
      mockReactions = [
        {
          id: 'reaction-aria',
          emoji: '❤️',
          socketId: 'socket-aria',
          displayName: 'AriaUser',
          createdAt: Date.now(),
          left: 50,
        },
      ];

      const { baseElement } = render(<EmojiReaction />);

      const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');
      expect(ariaLiveEl).not.toBeNull();
      expect(ariaLiveEl.getAttribute('aria-live')).toBe('polite');
    }
  );

  test(
    'aria-live region text matches the most recent (last) reaction announcement',
    () => {
      const latestReaction = {
        id: 'reaction-latest',
        emoji: '🎉',
        socketId: 'socket-latest',
        displayName: 'LatestUser',
        createdAt: Date.now(),
        left: 35,
      };

      mockReactions = [
        {
          id: 'reaction-old',
          emoji: '👍',
          socketId: 'socket-old',
          displayName: 'OldUser',
          createdAt: Date.now() - 1000,
          left: 20,
        },
        latestReaction,
      ];

      const { baseElement } = render(<EmojiReaction />);

      const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');
      expect(ariaLiveEl).not.toBeNull();

      const expectedText = `${latestReaction.displayName} reacted with ${latestReaction.emoji}`;
      expect(ariaLiveEl.textContent).toBe(expectedText);
    }
  );

  test(
    'aria-live region has aria-atomic="false" for progressive announcement',
    () => {
      mockReactions = [
        {
          id: 'reaction-atomic',
          emoji: '🔥',
          socketId: 'socket-atomic',
          displayName: 'AtomicUser',
          createdAt: Date.now(),
          left: 60,
        },
      ];

      const { baseElement } = render(<EmojiReaction />);

      const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');
      expect(ariaLiveEl).not.toBeNull();
      expect(ariaLiveEl.getAttribute('aria-atomic')).toBe('false');
    }
  );

  test(
    'Single-reaction array: aria-live announces the only reaction',
    () => {
      mockReactions = [
        {
          id: 'solo',
          emoji: '😮',
          socketId: 'socket-x',
          displayName: 'Grace',
          createdAt: Date.now(),
          left: 45,
        },
      ];

      const { baseElement } = render(<EmojiReaction />);

      const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');
      expect(ariaLiveEl).not.toBeNull();
      expect(ariaLiveEl.textContent).toBe('Grace reacted with 😮');
    }
  );
});
