import { create } from 'zustand';

let notificationIdCounter = 0;

const useUIStore = create((set, get) => ({
  isParticipantsOpen: false,
  isConfirmLeaveOpen: false,
  notifications: [], // [{ id, message, createdAt }]

  toggleParticipants: () =>
    set((state) => ({ isParticipantsOpen: !state.isParticipantsOpen })),

  openParticipants: () => set({ isParticipantsOpen: true }),
  closeParticipants: () => set({ isParticipantsOpen: false }),

  showConfirmLeave: () => set({ isConfirmLeaveOpen: true }),
  hideConfirmLeave: () => set({ isConfirmLeaveOpen: false }),

  addNotification: (message) => {
    const id = `notif-${++notificationIdCounter}`;
    const notification = { id, message, createdAt: Date.now() };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 4000);

    return id;
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  reset: () =>
    set({
      isParticipantsOpen: false,
      isConfirmLeaveOpen: false,
      notifications: [],
    }),
}));

export default useUIStore;
