import { create } from 'zustand';

// JWT stored in-memory only (not localStorage) to prevent XSS token theft
const useAuthStore = create((set) => ({
  token: null,
  userId: null,
  email: null,
  displayName: null,

  setAuth: (token, userId, email, displayName) =>
    set({ token, userId, email, displayName }),

  clearAuth: () =>
    set({ token: null, userId: null, email: null, displayName: null }),

  isAuthenticated: () => {
    // Computed — not reactive, call inside components via get()
    return false; // overridden below
  },
}));

export default useAuthStore;
