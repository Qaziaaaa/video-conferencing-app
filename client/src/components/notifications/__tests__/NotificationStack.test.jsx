import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationStack from '../NotificationStack.jsx';
import useUIStore from '../../../store/useUIStore';

describe('NotificationStack', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
    vi.useFakeTimers();
  });

  test('add notification renders toast, auto-dismiss removes it after 4s, multiple stack', () => {
    render(<NotificationStack />);

    // Initially empty
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      useUIStore.getState().addNotification('First notification');
    });

    expect(screen.getByText('First notification')).toBeInTheDocument();

    act(() => {
      useUIStore.getState().addNotification('Second notification');
    });

    expect(screen.getByText('First notification')).toBeInTheDocument();
    expect(screen.getByText('Second notification')).toBeInTheDocument();

    // Fast-forward 4 seconds
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // They should be gone
    expect(screen.queryByText('First notification')).toBeNull();
    expect(screen.queryByText('Second notification')).toBeNull();
  });
});
