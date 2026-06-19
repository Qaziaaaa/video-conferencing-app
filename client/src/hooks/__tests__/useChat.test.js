import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChat } from '../useChat';
import useChatStore from '../../store/useChatStore';
import useMeetingStore from '../../store/useMeetingStore';

const createMockSocket = () => ({
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  emit: vi.fn(),
});

describe('useChat', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
    useChatStore.getState().reset();
  });

  test('subscribes to chat-message event on mount', () => {
    const socket = createMockSocket();
    renderHook(() => useChat(socket));
    expect(socket.on).toHaveBeenCalledWith('chat-message', expect.any(Function));
  });

  test('unsubscribes on unmount', () => {
    const socket = createMockSocket();
    const { unmount } = renderHook(() => useChat(socket));
    unmount();
    expect(socket.off).toHaveBeenCalledWith('chat-message', expect.any(Function));
  });

  test('addMessage called when chat-message received', () => {
    const socket = createMockSocket();
    const addMessageSpy = vi.spyOn(useChatStore.getState(), 'addMessage');
    renderHook(() => useChat(socket));

    const handler = socket.on.mock.calls.find(([e]) => e === 'chat-message')?.[1];
    const msg = { _id: '1', senderName: 'Alice', text: 'Hi' };
    handler(msg);
    expect(addMessageSpy).toHaveBeenCalledWith(msg);
  });

  test('sendMessage emits chat-message', () => {
    const socket = createMockSocket();
    useMeetingStore.getState().setMeetingId('abc');
    useMeetingStore.getState().setDisplayName('Alice');

    const { result } = renderHook(() => useChat(socket));
    result.current.sendMessage('Hello');

    expect(socket.emit).toHaveBeenCalledWith('chat-message', {
      meetingId: 'abc',
      senderName: 'Alice',
      text: 'Hello',
      timestamp: expect.any(String),
    });
  });

  test('sendMessage no-op without socket', () => {
    const { result } = renderHook(() => useChat(null));
    result.current.sendMessage('Hello');
  });

  test('sendMessage no-op with empty text', () => {
    const socket = createMockSocket();
    useMeetingStore.getState().setMeetingId('abc');

    const { result } = renderHook(() => useChat(socket));
    result.current.sendMessage('   ');
    expect(socket.emit).not.toHaveBeenCalled();
  });

  test('sendMessage no-op with text exceeding 1000 chars', () => {
    const socket = createMockSocket();
    useMeetingStore.getState().setMeetingId('abc');

    const { result } = renderHook(() => useChat(socket));
    result.current.sendMessage('x'.repeat(1001));
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
