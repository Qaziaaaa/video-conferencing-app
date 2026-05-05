const { v4: uuidv4 } = require('uuid');

/**
 * Generates a human-readable meeting ID in the format: abc-defg-hij
 * Uses the first 10 hex chars of a UUID, converted to lowercase letters a-p.
 */
const generateMeetingId = () => {
  const raw = uuidv4().replace(/-/g, '');
  // Convert hex chars to letters a-p (0→a, 1→b, ..., f→p)
  const letters = raw
    .slice(0, 10)
    .split('')
    .map((c) => String.fromCharCode(97 + parseInt(c, 16)))
    .join('');

  return `${letters.slice(0, 3)}-${letters.slice(3, 7)}-${letters.slice(7, 10)}`;
};

module.exports = { generateMeetingId };
