const { generateMeetingId } = require('../meetingId');

describe('generateMeetingId PBT', () => {
  it('generates IDs matching the format /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/ and ensures uniqueness in a batch of 1000', () => {
    const ids = new Set();
    const batchSize = 1000;
    
    for (let i = 0; i < batchSize; i++) {
      const id = generateMeetingId();
      expect(id).toMatch(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
      ids.add(id);
    }
    
    expect(ids.size).toBe(batchSize);
  });
});
