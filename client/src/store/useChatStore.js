import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  messages: [],
  unreadCount: 0,
  isChatOpen: false,

  addMessage: (msg) =>
    set((state) => {
      const newMessages = [...state.messages, msg];
      const newUnread = state.isChatOpen ? state.unreadCount : state.unreadCount + 1;
      return { messages: newMessages, unreadCount: newUnread };
    }),

  setMessages: (msgs) => set({ messages: msgs }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  clearUnread: () => set({ unreadCount: 0 }),

  toggleChat: () =>
    set((state) => ({
      isChatOpen: !state.isChatOpen,
      unreadCount: !state.isChatOpen ? 0 : state.unreadCount, // clear on open
    })),

  openChat: () => set({ isChatOpen: true, unreadCount: 0 }),
  closeChat: () => set({ isChatOpen: false }),

  reset: () => set({ messages: [], unreadCount: 0, isChatOpen: false }),
}));

export default useChatStore;
