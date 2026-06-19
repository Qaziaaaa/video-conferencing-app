const fc = require('fast-check');
const { validateChatMessage } = require('../chatValidation');

describe('validateChatMessage PBT', () => {
  it('returns error for strings of length > 1000', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1001, maxLength: 5000 }), (text) => {
        expect(validateChatMessage(text)).toBe('Message exceeds 1000 character limit');
      })
    );
  });

  it('returns valid (null) for valid strings of length 1-1000', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }).filter((s) => s.trim().length > 0),
        (text) => {
          expect(validateChatMessage(text)).toBeNull();
        }
      )
    );
  });

  it('returns error for empty or whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 100 }).filter((s) => s.trim().length === 0),
        (text) => {
          expect(validateChatMessage(text)).toBe('Message cannot be empty');
        }
      )
    );
  });
});
