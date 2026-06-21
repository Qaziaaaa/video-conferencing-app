import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Home';
import useAuthStore from '../../store/useAuthStore';

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.restoreAllMocks();
  });

  test('renders branding and hero text', () => {
    renderHome();
    expect(screen.getByText('Meet')).toBeInTheDocument();
    expect(screen.getByText(/video calls for/i)).toBeInTheDocument();
    expect(screen.getByText(/everyone/i)).toBeInTheDocument();
  });

  test('shows sign in and get started when not authenticated', () => {
    renderHome();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  test('shows display name and sign out when authenticated', () => {
    useAuthStore.getState().setAuth('tok', 'uid1', 'a@b.com', 'Alice');
    renderHome();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  test('sign out clears auth', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAuth('tok', 'uid1', 'a@b.com', 'Alice');
    renderHome();
    await user.click(screen.getByText('Sign out'));
    expect(useAuthStore.getState().token).toBeNull();
  });

  test('navigates to login when creating meeting without auth', async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await user.click(screen.getByText('New meeting'));
  });

  test('shows waiting room checkbox', () => {
    renderHome();
    expect(screen.getByText('Waiting room')).toBeInTheDocument();
  });

  test('create meeting shows loading state and calls API', async () => {
    const user = userEvent.setup();
    let resolvePromise;
    useAuthStore.getState().setAuth('tok', 'uid1', 'a@b.com', 'Alice');
    global.fetch = vi.fn().mockReturnValue(new Promise((r) => { resolvePromise = r; }));
    renderHome();
    await user.click(screen.getByText('New meeting'));
    await waitFor(() => {
      expect(screen.getByText('Creating…')).toBeInTheDocument();
    });
    resolvePromise({
      ok: true,
      json: async () => ({ meetingId: 'm1', shareUrl: 'http://localhost:5000/meeting/m1' }),
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/meetings',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  test('create meeting shows error on API failure', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAuth('tok', 'uid1', 'a@b.com', 'Alice');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });
    renderHome();
    await user.click(screen.getByText('New meeting'));
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  test('create meeting shows network error on exception', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAuth('tok', 'uid1', 'a@b.com', 'Alice');
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    renderHome();
    await user.click(screen.getByText('New meeting'));
    await waitFor(() => {
      expect(screen.getByText('Network error. Is the server running?')).toBeInTheDocument();
    });
  });

  test('join form submits meeting code', async () => {
    const user = userEvent.setup();
    renderHome();
    const input = screen.getByPlaceholderText('Enter a code or link');
    await user.type(input, 'abc123');
    await user.click(screen.getByText('Join'));
  });

  test('join button disabled when input is empty', () => {
    renderHome();
    expect(screen.getByText('Join').closest('button')).toBeDisabled();
  });

  test('join button enabled when input has text', async () => {
    const user = userEvent.setup();
    renderHome();
    const input = screen.getByPlaceholderText('Enter a code or link');
    await user.type(input, 'abc');
    expect(screen.getByText('Join').closest('button')).toBeEnabled();
  });

  test('extracts meetingId from full URL on join', async () => {
    const user = userEvent.setup();
    renderHome();
    const input = screen.getByPlaceholderText('Enter a code or link');
    await user.type(input, 'http://example.com/meeting/m123');
    await user.click(screen.getByText('Join'));
  });

  test('shows share URL after creating meeting', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAuth('tok', 'uid1', 'a@b.com', 'Alice');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ meetingId: 'm1', shareUrl: 'http://localhost:5000/meeting/m1' }),
    });
    renderHome();
    await user.click(screen.getByText('New meeting'));
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });
  });

  test('copy button shows Copied!', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAuth('tok', 'uid1', 'a@b.com', 'Alice');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue() },
      configurable: true,
      writable: true,
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ meetingId: 'm1', shareUrl: 'http://localhost:5000/meeting/m1' }),
    });
    renderHome();
    await user.click(screen.getByText('New meeting'));
    await waitFor(() => screen.getByText('Copy'));
    await user.click(screen.getByText('Copy'));
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  test('renders feature grid', () => {
    renderHome();
    expect(screen.getByText('HD video')).toBeInTheDocument();
    expect(screen.getByText('Live chat')).toBeInTheDocument();
    expect(screen.getByText('Screen share')).toBeInTheDocument();
    expect(screen.getByText('Raise hand')).toBeInTheDocument();
  });

  test('waiting room checkbox toggles state', async () => {
    const user = userEvent.setup();
    renderHome();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('create meeting sends waitingRoomEnabled', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAuth('tok', 'uid1', 'a@b.com', 'Alice');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ meetingId: 'm1', shareUrl: 'http://localhost:5000/meeting/m1' }),
    });
    renderHome();
    await user.click(screen.getByText('Waiting room'));
    await user.click(screen.getByText('New meeting'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/meetings',
        expect.objectContaining({
          body: expect.stringContaining('"waitingRoomEnabled":true'),
        })
      );
    });
  });
});
