import { useEffect } from 'react';
import useUIStore from '../store/useUIStore';

/**
 * useNotifications — re-exports addNotification from UIStore for convenience.
 * Auto-dismiss is handled inside useUIStore.addNotification (4s timeout).
 */
export const useNotifications = () => {
  const { addNotification, removeNotification, notifications } = useUIStore();

  return { addNotification, removeNotification, notifications };
};
