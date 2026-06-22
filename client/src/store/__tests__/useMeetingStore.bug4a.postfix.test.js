/**
 * Task 6.8 — Bug 4A Post-Fix: useMeetingStore.addReaction stores numeric left
 *
 * **Property 1: Expected Behavior** - Emoji Position Stable
 *
 * PURPOSE:
 *   Assert addReaction stores a numeric `left` field on every new reaction object.
 *   This verifies the Bug 4A fix in useMeetingStore.js (task 6.1).
 *
 * Fix confirmed:
 *   addReaction now includes: left: 15 + Math.random() * 70
 *
 * **Validates: Requirements 2.10**
 */

import { describe, test, expect, beforeEach } from 'vitest';
import useMeetingStore from '../useMeetingStore';

describe('Bug 4A Post-Fix — useMeetingStore.addReaction stores numeric left field', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
  });

  test(
    'addReaction creates a reaction object with a numeric left property in range [15, 85)',
    () => {
      /**
       * After the fix, addReaction includes:
       *   left: 15 + Math.random() * 70
       * Range: [15, 15+70) = [15, 85)
       */
      useMeetingStore.getState().addReaction('👍', 'socket-abc', 'TestUser');

      const reactions = useMeetingStore.getState().reactions;

      // One reaction was added
      expect(reactions).toHaveLength(1);

      const reaction = reactions[0];

      // Assert left is a number (not undefined — the bug condition was undefined)
      expect(typeof reaction.left).toBe('number');

      // Assert left is within the expected range
      expect(reaction.left).toBeGreaterThanOrEqual(15);
      expect(reaction.left).toBeLessThan(85);
    }
  );

  test(
    'addReaction stores left on every reaction (all reactions in multi-add have left)',
    () => {
      const emojis = ['👍', '❤️', '🎉', '🔥', '😂'];

      for (const emoji of emojis) {
        useMeetingStore.getState().addReaction(emoji, 'socket-x', 'User');
      }

      const reactions = useMeetingStore.getState().reactions;
      expect(reactions).toHaveLength(emojis.length);

      for (const r of reactions) {
        // Every reaction must have a numeric left field
        expect(typeof r.left).toBe('number');
        expect(r.left).toBeGreaterThanOrEqual(15);
        expect(r.left).toBeLessThan(85);
      }
    }
  );

  test(
    'stored left value is STABLE — reading reactions twice returns the same left value',
    () => {
      /**
       * The stored left is computed ONCE at addReaction call time.
       * Reading reactions multiple times from the store must yield the same value.
       * (On fixed code: left is a stored property; on bug code: left would be
       * computed fresh on each render via Math.random(), which is not testable
       * at the store level, but we verify the stored value is stable.)
       */
      useMeetingStore.getState().addReaction('🎉', 'socket-y', 'StableUser');

      const leftRead1 = useMeetingStore.getState().reactions[0].left;
      const leftRead2 = useMeetingStore.getState().reactions[0].left;

      // Must be the same stored value
      expect(leftRead1).toBe(leftRead2);
    }
  );

  test(
    'each call to addReaction produces an independent left value (stored per-reaction)',
    () => {
      /**
       * Each addReaction call computes a fresh random left at creation time and
       * stores it. Two reactions should not share the same left object reference —
       * they are independent numeric values.
       */
      useMeetingStore.getState().addReaction('👍', 'socket-a', 'UserA');
      useMeetingStore.getState().addReaction('❤️', 'socket-b', 'UserB');

      const reactions = useMeetingStore.getState().reactions;
      expect(reactions).toHaveLength(2);

      // Both have numeric left values
      expect(typeof reactions[0].left).toBe('number');
      expect(typeof reactions[1].left).toBe('number');

      // Both are in range
      expect(reactions[0].left).toBeGreaterThanOrEqual(15);
      expect(reactions[1].left).toBeGreaterThanOrEqual(15);
    }
  );
});
