import { describe, test, expect, beforeEach } from 'vitest';
import useAuthStore from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  test('initial state has null values', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.email).toBeNull();
    expect(state.displayName).toBeNull();
  });

  test('setAuth sets all fields', () => {
    useAuthStore.getState().setAuth('tok123', 'uid1', 'a@b.com', 'Alice');
    const state = useAuthStore.getState();
    expect(state.token).toBe('tok123');
    expect(state.userId).toBe('uid1');
    expect(state.email).toBe('a@b.com');
    expect(state.displayName).toBe('Alice');
  });

  test('clearAuth resets all fields to null', () => {
    useAuthStore.getState().setAuth('tok123', 'uid1', 'a@b.com', 'Alice');
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.email).toBeNull();
    expect(state.displayName).toBeNull();
  });

  test('isAuthenticated returns false when no token', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  test('isAuthenticated returns true when token exists', () => {
    useAuthStore.getState().setAuth('tok', 'uid', 'e@m.com', 'Bob');
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });
});
