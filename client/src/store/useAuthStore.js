import { create } from 'zustand';

// JWT stored in-memory only (not localStorage) to prevent XSS token theft
const useAuthStore = create((set, get) => ({
  token: null,
  userId: null,
  email: null,
  displayName: null,

  setAuth: (token, userId, email, displayName) =>
    set({ token, userId, email, displayName }),

  clearAuth: () =>
    set({ token: null, userId: null, email: null, displayName: null }),

  // Computed property - call get().isAuthenticated() to check auth status
  isAuthenticated: () => !!get().token,
}));

export default useAuthStore;
