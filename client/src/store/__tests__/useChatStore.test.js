import { describe, test, expect, beforeEach } from 'vitest';
import useChatStore from '../useChatStore';

const msg1 = { _id: '1', senderName: 'Alice', text: 'Hi', timestamp: new Date().toISOString() };
const msg2 = { _id: '2', senderName: 'Bob', text: 'Hey', timestamp: new Date().toISOString() };

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  test('initial state', () => {
    const s = useChatStore.getState();
    expect(s.messages).toEqual([]);
    expect(s.unreadCount).toBe(0);
    expect(s.isChatOpen).toBe(false);
  });

  test('addMessage appends when chat is closed and increments unread', () => {
    useChatStore.getState().addMessage(msg1);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().unreadCount).toBe(1);
  });

  test('addMessage does not increment unread when chat is open', () => {
    useChatStore.getState().toggleChat();
    useChatStore.getState().addMessage(msg1);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().unreadCount).toBe(0);
  });

  test('addMessage appends multiple messages', () => {
    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().addMessage(msg2);
    expect(useChatStore.getState().messages).toHaveLength(2);
    expect(useChatStore.getState().messages[0].text).toBe('Hi');
    expect(useChatStore.getState().messages[1].text).toBe('Hey');
  });

  test('setMessages replaces all messages', () => {
    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().setMessages([msg2]);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].text).toBe('Hey');
  });

  test('clearUnread resets unread count', () => {
    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().addMessage(msg2);
    useChatStore.getState().clearUnread();
    expect(useChatStore.getState().unreadCount).toBe(0);
  });

  test('toggleChat flips isChatOpen and clears unread when opening', () => {
    expect(useChatStore.getState().isChatOpen).toBe(false);
    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().toggleChat();
    expect(useChatStore.getState().isChatOpen).toBe(true);
    expect(useChatStore.getState().unreadCount).toBe(0);
  });

  test('toggleChat preserves unread count when closing', () => {
    useChatStore.getState().addMessage(msg1);
    expect(useChatStore.getState().unreadCount).toBe(1);
    useChatStore.getState().toggleChat();
    expect(useChatStore.getState().isChatOpen).toBe(true);
    expect(useChatStore.getState().unreadCount).toBe(0);
    useChatStore.getState().toggleChat();
    expect(useChatStore.getState().isChatOpen).toBe(false);
    expect(useChatStore.getState().unreadCount).toBe(0);
  });

  test('openChat sets open and clears unread', () => {
    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().openChat();
    expect(useChatStore.getState().isChatOpen).toBe(true);
    expect(useChatStore.getState().unreadCount).toBe(0);
  });

  test('closeChat sets isChatOpen false', () => {
    useChatStore.getState().toggleChat();
    useChatStore.getState().closeChat();
    expect(useChatStore.getState().isChatOpen).toBe(false);
  });

  test('reset restores initial state', () => {
    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().toggleChat();
    useChatStore.getState().reset();
    const s = useChatStore.getState();
    expect(s.messages).toEqual([]);
    expect(s.unreadCount).toBe(0);
    expect(s.isChatOpen).toBe(false);
  });
});
