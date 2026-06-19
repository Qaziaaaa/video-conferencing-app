const validateChatMessage = (text) => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return 'Message cannot be empty';
  }
  if (text.length > 1000) {
    return 'Message exceeds 1000 character limit';
  }
  return null;
};

module.exports = { validateChatMessage };
