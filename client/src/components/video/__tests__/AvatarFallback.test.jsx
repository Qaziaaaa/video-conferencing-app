import { describe, test, expect } from 'vitest';
import { getInitials } from '../AvatarFallback.jsx';

describe('AvatarFallback - getInitials', () => {
  test('extracts initial from single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  test('extracts initials from two names', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  test('extracts initials from names with extra spaces', () => {
    expect(getInitials('   Jane   Smith   ')).toBe('JS');
  });

  test('extracts first and last initial for multi-word names', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });

  test('returns ? for empty string or only spaces', () => {
    expect(getInitials('   ')).toBe('?');
    expect(getInitials('')).toBe('?');
  });
});
