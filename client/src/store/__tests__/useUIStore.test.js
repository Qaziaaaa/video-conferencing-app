import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import useUIStore from '../useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('initial state', () => {
    const s = useUIStore.getState();
    expect(s.isParticipantsOpen).toBe(false);
    expect(s.isConfirmLeaveOpen).toBe(false);
    expect(s.notifications).toEqual([]);
  });

  test('toggleParticipants flips', () => {
    useUIStore.getState().toggleParticipants();
    expect(useUIStore.getState().isParticipantsOpen).toBe(true);
    useUIStore.getState().toggleParticipants();
    expect(useUIStore.getState().isParticipantsOpen).toBe(false);
  });

  test('openParticipants sets true', () => {
    useUIStore.getState().openParticipants();
    expect(useUIStore.getState().isParticipantsOpen).toBe(true);
  });

  test('closeParticipants sets false', () => {
    useUIStore.getState().openParticipants();
    useUIStore.getState().closeParticipants();
    expect(useUIStore.getState().isParticipantsOpen).toBe(false);
  });

  test('showConfirmLeave / hideConfirmLeave', () => {
    useUIStore.getState().showConfirmLeave();
    expect(useUIStore.getState().isConfirmLeaveOpen).toBe(true);
    useUIStore.getState().hideConfirmLeave();
    expect(useUIStore.getState().isConfirmLeaveOpen).toBe(false);
  });

  test('addNotification adds and returns id', () => {
    const id = useUIStore.getState().addNotification('Test message');
    expect(id).toMatch(/^notif-/);
    expect(useUIStore.getState().notifications).toHaveLength(1);
    expect(useUIStore.getState().notifications[0].message).toBe('Test message');
  });

  test('addNotification auto-removes after 4 seconds', () => {
    useUIStore.getState().addNotification('Auto dismiss');
    expect(useUIStore.getState().notifications).toHaveLength(1);
    vi.advanceTimersByTime(4000);
    expect(useUIStore.getState().notifications).toHaveLength(0);
  });

  test('multiple notifications stack and dismiss independently', () => {
    useUIStore.getState().addNotification('First');
    useUIStore.getState().addNotification('Second');
    expect(useUIStore.getState().notifications).toHaveLength(2);

    vi.advanceTimersByTime(4000);
    expect(useUIStore.getState().notifications).toHaveLength(0);
  });

  test('removeNotification removes by id', () => {
    const id = useUIStore.getState().addNotification('Remove me');
    useUIStore.getState().addNotification('Keep me');
    expect(useUIStore.getState().notifications).toHaveLength(2);

    useUIStore.getState().removeNotification(id);
    expect(useUIStore.getState().notifications).toHaveLength(1);
    expect(useUIStore.getState().notifications[0].message).toBe('Keep me');
  });

  test('reset restores all defaults', () => {
    useUIStore.getState().showConfirmLeave();
    useUIStore.getState().openParticipants();
    useUIStore.getState().addNotification('N');
    useUIStore.getState().reset();
    const s = useUIStore.getState();
    expect(s.isConfirmLeaveOpen).toBe(false);
    expect(s.isParticipantsOpen).toBe(false);
    expect(s.notifications).toEqual([]);
  });
});
