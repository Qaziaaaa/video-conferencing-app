import { create } from 'zustand';

const STORAGE_KEY = 'freemeet_auth';

const loadPersisted = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const persist = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const clearPersisted = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

const persisted = loadPersisted();

const useAuthStore = create((set, get) => ({
  token: persisted?.token || null,
  userId: persisted?.userId || null,
  email: persisted?.email || null,
  displayName: persisted?.displayName || null,

  setAuth: (token, userId, email, displayName) => {
    const data = { token, userId, email, displayName };
    persist(data);
    set(data);
  },

  clearAuth: () => {
    clearPersisted();
    set({ token: null, userId: null, email: null, displayName: null });
  },

  isAuthenticated: () => !!get().token,
}));

export default useAuthStore;
