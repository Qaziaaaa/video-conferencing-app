import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import useUIStore from '../../store/useUIStore';

const createMockSocket = () => {
  const handlers = {};
  return {
    on: vi.fn((evt, fn) => { handlers[evt] = fn; }),
    off: vi.fn(),
    getHandler: (evt) => handlers[evt],
  };
};

describe('useNotifications', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  test('subscribes to user-joined, user-left, raise-hand', () => {
    const socket = createMockSocket();
    renderHook(() => useNotifications(socket));
    expect(socket.on).toHaveBeenCalledWith('user-joined', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('user-left', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('raise-hand', expect.any(Function));
  });

  test('unsubscribes all on unmount', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useNotifications(socket));
    unmount();
    expect(socket.off).toHaveBeenCalledTimes(3);
  });

  test('user-joined triggers addNotification', () => {
    const socket = createMockSocket();
    renderHook(() => useNotifications(socket));

    socket.getHandler('user-joined')({ displayName: 'Alice' });
    const notifs = useUIStore.getState().notifications;
    expect(notifs.some((n) => n.message === 'Alice joined the meeting')).toBe(true);
  });

  test('user-left triggers addNotification', () => {
    const socket = createMockSocket();
    renderHook(() => useNotifications(socket));

    socket.getHandler('user-left')({ displayName: 'Bob' });
    const notifs = useUIStore.getState().notifications;
    expect(notifs.some((n) => n.message === 'Bob left the meeting')).toBe(true);
  });

  test('raise-hand triggers addNotification', () => {
    const socket = createMockSocket();
    renderHook(() => useNotifications(socket));

    socket.getHandler('raise-hand')({ displayName: 'Charlie' });
    const notifs = useUIStore.getState().notifications;
    expect(notifs.some((n) => n.message === '✋ Charlie raised their hand')).toBe(true);
  });

  test('no notification if displayName missing', () => {
    const socket = createMockSocket();
    renderHook(() => useNotifications(socket));

    socket.getHandler('user-joined')({});
    expect(useUIStore.getState().notifications).toHaveLength(0);
  });

  test('no-op when socket is null', () => {
    renderHook(() => useNotifications(null));
  });
});
