/**
 * EmojiReaction Unit Tests — Task 7.2
 *
 * Validates: Requirements 2.1, 2.2, 2.10, 2.15
 *
 * Covers:
 *   1. Portal wrapper has zIndex: '9999' and NO willChange or isolation style properties
 *   2. Renders each reaction's left style from r.left, not from a Math.random() call
 *   3. Contains an element with aria-live="polite"
 */

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import React, { useState } from 'react';

import EmojiReaction from '../EmojiReaction';

// ---------------------------------------------------------------------------
// Store mock — injectable reactions so each test can control what renders.
// ---------------------------------------------------------------------------
let mockReactions = [];

vi.mock('../../../store/useMeetingStore', () => {
  const useStore = (selector) => selector({ reactions: mockReactions });
  useStore.getState = () => ({ reactions: mockReactions });
  return { default: useStore };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid reaction object. */
function makeReaction(overrides = {}) {
  return {
    id: `reaction-${Math.random().toString(36).slice(2, 8)}`,
    emoji: '🎉',
    socketId: 'socket-test',
    displayName: 'TestUser',
    createdAt: Date.now(),
    left: 42,
    ...overrides,
  };
}

/**
 * Find the direct portal wrapper — the outermost element rendered into
 * document.body by createPortal. It is the fixed overlay div that carries
 * the zIndex style.
 *
 * EmojiReaction renders:
 *   createPortal(
 *     <div className="fixed inset-0 pointer-events-none overflow-hidden"
 *          style={{ zIndex: 9999 }}>
 *       ...
 *     </div>,
 *     document.body
 *   )
 *
 * When @testing-library renders into baseElement (document.body), the portal
 * div is a direct child of document.body, outside the default container div.
 * We identify it by its fixed/overflow-hidden className.
 */
function findPortalWrapper(baseElement) {
  // Prefer the element with the zIndex style set directly on it.
  // It will be a child of document.body added by createPortal.
  return baseElement.querySelector('.fixed.overflow-hidden');
}

/** Extract numeric left % from a <span> inline style. */
function parseLeftPercent(span) {
  return parseFloat(span?.style?.left ?? '');
}

// ---------------------------------------------------------------------------
// Re-render wrapper — forces EmojiReaction to re-render via parent state tick.
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

// ---------------------------------------------------------------------------
// Cleanup after every test
// ---------------------------------------------------------------------------
afterEach(() => {
  mockReactions = [];
  cleanup();
});

// ===========================================================================
// Section 1 — Portal wrapper style: zIndex 9999, no willChange, no isolation
// Validates: Requirements 2.1, 2.2
// ===========================================================================

describe('EmojiReaction — portal wrapper style (Requirements 2.1, 2.2)', () => {
  test('portal wrapper has zIndex "9999"', () => {
    mockReactions = [makeReaction()];
    const { baseElement } = render(<EmojiReaction />);

    const wrapper = findPortalWrapper(baseElement);
    expect(wrapper).not.toBeNull();

    // jsdom represents numeric 9999 as the string '9999'
    expect(wrapper.style.zIndex).toBe('9999');
  });

  test('portal wrapper does NOT have willChange style property', () => {
    mockReactions = [makeReaction()];
    const { baseElement } = render(<EmojiReaction />);

    const wrapper = findPortalWrapper(baseElement);
    expect(wrapper).not.toBeNull();

    // willChange: 'transform' used to create a competing compositor layer (Bug 1).
    // After the fix the property must be absent.
    expect(wrapper.style.willChange).toBeFalsy();
    expect(wrapper.style.willChange).not.toBe('transform');
  });

  test('portal wrapper does NOT have isolation style property', () => {
    mockReactions = [makeReaction()];
    const { baseElement } = render(<EmojiReaction />);

    const wrapper = findPortalWrapper(baseElement);
    expect(wrapper).not.toBeNull();

    // isolation: 'isolate' used to create a competing stacking context (Bug 1).
    // After the fix the property must be absent.
    expect(wrapper.style.isolation).toBeFalsy();
    expect(wrapper.style.isolation).not.toBe('isolate');
  });

  test('portal wrapper has ONLY zIndex set — no competing compositor styles', () => {
    // Consolidates the two assertions above in a single readable test.
    mockReactions = [makeReaction()];
    const { baseElement } = render(<EmojiReaction />);

    const wrapper = findPortalWrapper(baseElement);
    expect(wrapper).not.toBeNull();

    expect(wrapper.style.zIndex).toBe('9999');
    expect(wrapper.style.willChange).toBeFalsy();
    expect(wrapper.style.isolation).toBeFalsy();
  });

  test('portal wrapper zIndex is still 9999 when multiple reactions are present', () => {
    mockReactions = [
      makeReaction({ id: '1', left: 20 }),
      makeReaction({ id: '2', left: 50 }),
      makeReaction({ id: '3', left: 75 }),
    ];
    const { baseElement } = render(<EmojiReaction />);

    const wrapper = findPortalWrapper(baseElement);
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.zIndex).toBe('9999');
    expect(wrapper.style.willChange).toBeFalsy();
    expect(wrapper.style.isolation).toBeFalsy();
  });
});

// ===========================================================================
// Section 2 — Reaction left style comes from r.left (not Math.random())
// Validates: Requirement 2.10
// ===========================================================================

describe('EmojiReaction — left style reads r.left, not Math.random() (Requirement 2.10)', () => {
  test('span left style equals the stored r.left value', () => {
    const STORED_LEFT = 42;
    mockReactions = [makeReaction({ left: STORED_LEFT })];

    const { baseElement } = render(<EmojiReaction />);
    const span = baseElement.querySelector('span.absolute');

    expect(span).not.toBeNull();
    expect(parseLeftPercent(span)).toBeCloseTo(STORED_LEFT, 5);
  });

  test('left style equals r.left for a boundary-min value (15)', () => {
    mockReactions = [makeReaction({ left: 15 })];

    const { baseElement } = render(<EmojiReaction />);
    const span = baseElement.querySelector('span.absolute');

    expect(span).not.toBeNull();
    expect(parseLeftPercent(span)).toBeCloseTo(15, 5);
  });

  test('left style equals r.left for a boundary-max value (85)', () => {
    mockReactions = [makeReaction({ left: 85 })];

    const { baseElement } = render(<EmojiReaction />);
    const span = baseElement.querySelector('span.absolute');

    expect(span).not.toBeNull();
    expect(parseLeftPercent(span)).toBeCloseTo(85, 5);
  });

  test('left style equals r.left for a fractional value (37.8)', () => {
    mockReactions = [makeReaction({ left: 37.8 })];

    const { baseElement } = render(<EmojiReaction />);
    const span = baseElement.querySelector('span.absolute');

    expect(span).not.toBeNull();
    expect(parseLeftPercent(span)).toBeCloseTo(37.8, 5);
  });

  test('each span in a multi-reaction render gets its own r.left value', () => {
    const reactions = [
      makeReaction({ id: 'r1', left: 20 }),
      makeReaction({ id: 'r2', left: 55 }),
      makeReaction({ id: 'r3', left: 80 }),
    ];
    mockReactions = reactions;

    const { baseElement } = render(<EmojiReaction />);
    const spans = baseElement.querySelectorAll('span.absolute');

    expect(spans).toHaveLength(3);
    spans.forEach((span, i) => {
      expect(parseLeftPercent(span)).toBeCloseTo(reactions[i].left, 5);
    });
  });

  test('left style is IDENTICAL across two forced re-renders (no Math.random() drift)', async () => {
    const STORED_LEFT = 67.3;
    mockReactions = [makeReaction({ left: STORED_LEFT })];

    let forceRerender;
    const { baseElement } = render(
      <RerenderWrapper onRef={(fn) => { forceRerender = fn; }} />
    );

    // Capture left after initial render
    const spanRender1 = baseElement.querySelector('span.absolute');
    expect(spanRender1).not.toBeNull();
    const left1 = parseLeftPercent(spanRender1);

    // Force a re-render via parent state change
    await act(async () => { forceRerender(); });

    const spanRender2 = baseElement.querySelector('span.absolute');
    expect(spanRender2).not.toBeNull();
    const left2 = parseLeftPercent(spanRender2);

    // Both renders must produce the same left value — proof that Math.random()
    // is NOT called in the render body.
    expect(left1).toBeCloseTo(STORED_LEFT, 5);
    expect(left2).toBeCloseTo(STORED_LEFT, 5);
    expect(left1).toBeCloseTo(left2, 5);
  });

  test('left style stays stable across five forced re-renders', async () => {
    const STORED_LEFT = 33.0;
    mockReactions = [makeReaction({ left: STORED_LEFT })];

    let forceRerender;
    const { baseElement } = render(
      <RerenderWrapper onRef={(fn) => { forceRerender = fn; }} />
    );

    for (let i = 0; i < 5; i++) {
      const span = baseElement.querySelector('span.absolute');
      expect(span).not.toBeNull();
      expect(parseLeftPercent(span)).toBeCloseTo(STORED_LEFT, 5);

      if (i < 4) {
        await act(async () => { forceRerender(); });
      }
    }
  });
});

// ===========================================================================
// Section 3 — aria-live="polite" region present
// Validates: Requirement 2.15
// ===========================================================================

describe('EmojiReaction — aria-live region (Requirement 2.15)', () => {
  test('contains an element with aria-live="polite"', () => {
    mockReactions = [makeReaction()];

    const { baseElement } = render(<EmojiReaction />);
    const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');

    expect(ariaLiveEl).not.toBeNull();
    expect(ariaLiveEl.getAttribute('aria-live')).toBe('polite');
  });

  test('aria-live region has aria-atomic="false"', () => {
    mockReactions = [makeReaction()];

    const { baseElement } = render(<EmojiReaction />);
    const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');

    expect(ariaLiveEl).not.toBeNull();
    expect(ariaLiveEl.getAttribute('aria-atomic')).toBe('false');
  });

  test('aria-live region text announces the most recent reaction', () => {
    const latest = makeReaction({ id: 'latest', emoji: '🔥', displayName: 'Alice' });
    mockReactions = [
      makeReaction({ id: 'older', emoji: '👍', displayName: 'Bob' }),
      latest,
    ];

    const { baseElement } = render(<EmojiReaction />);
    const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');

    expect(ariaLiveEl).not.toBeNull();
    expect(ariaLiveEl.textContent).toBe('Alice reacted with 🔥');
  });

  test('aria-live region announces single-reaction array correctly', () => {
    mockReactions = [makeReaction({ emoji: '😮', displayName: 'Grace' })];

    const { baseElement } = render(<EmojiReaction />);
    const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');

    expect(ariaLiveEl).not.toBeNull();
    expect(ariaLiveEl.textContent).toBe('Grace reacted with 😮');
  });

  test('aria-live region is visually hidden (has sr-only class)', () => {
    mockReactions = [makeReaction()];

    const { baseElement } = render(<EmojiReaction />);
    const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');

    expect(ariaLiveEl).not.toBeNull();
    expect(ariaLiveEl.classList.contains('sr-only')).toBe(true);
  });

  test('aria-live text is empty string when reactions array is empty', () => {
    // When reactions.length === 0 the component returns null early, so the
    // portal is not rendered. Verify this graceful early exit.
    mockReactions = [];

    const { baseElement } = render(<EmojiReaction />);
    // No portal rendered — no aria-live element in the DOM.
    const ariaLiveEl = baseElement.querySelector('[aria-live="polite"]');
    expect(ariaLiveEl).toBeNull();
  });
});

// ===========================================================================
// Section 4 — Baseline rendering sanity checks
// ===========================================================================

describe('EmojiReaction — baseline rendering', () => {
  test('returns null (nothing rendered) when reactions array is empty', () => {
    mockReactions = [];

    const { baseElement } = render(<EmojiReaction />);

    // No portal wrapper and no spans
    expect(findPortalWrapper(baseElement)).toBeNull();
    expect(baseElement.querySelectorAll('span.absolute')).toHaveLength(0);
  });

  test('renders one span per reaction', () => {
    mockReactions = [
      makeReaction({ id: 'a' }),
      makeReaction({ id: 'b' }),
      makeReaction({ id: 'c' }),
    ];

    const { baseElement } = render(<EmojiReaction />);
    expect(baseElement.querySelectorAll('span.absolute')).toHaveLength(3);
  });

  test('each span displays the correct emoji', () => {
    const emojis = ['👍', '❤️', '🎉'];
    mockReactions = emojis.map((emoji, i) => makeReaction({ id: `r${i}`, emoji }));

    const { baseElement } = render(<EmojiReaction />);
    const spans = baseElement.querySelectorAll('span.absolute');

    spans.forEach((span, i) => {
      expect(span.textContent).toBe(emojis[i]);
    });
  });

  test('span has floatUp animation style', () => {
    mockReactions = [makeReaction()];

    const { baseElement } = render(<EmojiReaction />);
    const span = baseElement.querySelector('span.absolute');

    expect(span).not.toBeNull();
    expect(span.style.animation).toContain('floatUp');
  });
});
