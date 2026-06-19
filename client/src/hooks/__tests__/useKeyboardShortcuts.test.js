import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import useMeetingStore from '../../store/useMeetingStore';
import useUIStore from '../../store/useUIStore';

const createMockSocket = () => ({ emit: vi.fn() });

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useUIStore.getState().reset();
  });

  test('press M toggles mic', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useKeyboardShortcuts(socket));
    expect(useMeetingStore.getState().isMicOn).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    });
    expect(useMeetingStore.getState().isMicOn).toBe(false);
    act(() => { unmount(); });
  });

  test('press V toggles cam', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useKeyboardShortcuts(socket));
    useMeetingStore.getState().setMeetingId('room1');
    expect(useMeetingStore.getState().isCamOn).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }));
    });
    expect(useMeetingStore.getState().isCamOn).toBe(false);
    act(() => { unmount(); });
  });

  test('press H toggles hand', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useKeyboardShortcuts(socket));
    useMeetingStore.getState().setDisplayName('Alice');
    expect(useMeetingStore.getState().isHandRaised).toBe(false);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
    });
    expect(useMeetingStore.getState().isHandRaised).toBe(true);
    act(() => { unmount(); });
  });

  test('press Escape shows confirm leave', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useKeyboardShortcuts(socket));
    expect(useUIStore.getState().isConfirmLeaveOpen).toBe(false);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(useUIStore.getState().isConfirmLeaveOpen).toBe(true);
    act(() => { unmount(); });
  });

  test('shortcuts ignored when focused on input', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useKeyboardShortcuts(socket));
    const input = document.body.appendChild(document.createElement('input'));
    input.focus();
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    });
    expect(useMeetingStore.getState().isMicOn).toBe(true);
    document.body.removeChild(input);
    act(() => { unmount(); });
  });

  test('shortcuts ignored when focused on textarea', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useKeyboardShortcuts(socket));
    const textarea = document.body.appendChild(document.createElement('textarea'));
    textarea.focus();
    act(() => {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    });
    expect(useMeetingStore.getState().isMicOn).toBe(true);
    document.body.removeChild(textarea);
    act(() => { unmount(); });
  });

  test('listener removed on unmount', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useKeyboardShortcuts(socket));
    act(() => { unmount(); });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    });
    expect(useMeetingStore.getState().isMicOn).toBe(true);
  });
});
