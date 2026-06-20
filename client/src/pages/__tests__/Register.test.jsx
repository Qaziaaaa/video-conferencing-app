import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../Register';
import useAuthStore from '../../store/useAuthStore';

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.restoreAllMocks();
  });

  test('renders heading and form elements', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument();
  });

  test('shows link to sign in', () => {
    renderRegister();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  test('submits registration and auto-login successfully', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Registered' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'tok456',
          userId: 'uid2',
          email: 'b@c.com',
          displayName: 'Bob',
        }),
      });
    renderRegister();
    await user.type(screen.getByPlaceholderText('Your name'), 'Bob');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'b@c.com');
    await user.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('tok456');
      expect(useAuthStore.getState().displayName).toBe('Bob');
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise;
    global.fetch = vi.fn().mockReturnValue(new Promise((r) => { resolvePromise = r; }));
    renderRegister();
    await user.type(screen.getByPlaceholderText('Your name'), 'Bob');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'b@c.com');
    await user.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('Creating account…')).toBeInTheDocument();
    expect(screen.getByText('Creating account…').closest('button')).toBeDisabled();
    resolvePromise({
      ok: true,
      json: async () => ({ message: 'Registered' }),
    });
  });

  test('shows error on registration failure', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email already exists' }),
    });
    renderRegister();
    await user.type(screen.getByPlaceholderText('Your name'), 'Bob');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'b@c.com');
    await user.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  test('shows network error on exception', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    renderRegister();
    await user.type(screen.getByPlaceholderText('Your name'), 'Bob');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'b@c.com');
    await user.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Network error. Is the server running?')).toBeInTheDocument();
    });
  });

  test('redirects to login if auto-login fails', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Registered' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Login failed' }),
      });
    renderRegister();
    await user.type(screen.getByPlaceholderText('Your name'), 'Bob');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'b@c.com');
    await user.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    expect(useAuthStore.getState().token).toBeNull();
  });

  test('all inputs are required', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('Your name')).toBeRequired();
    expect(screen.getByPlaceholderText('you@example.com')).toBeRequired();
    expect(screen.getByPlaceholderText('Min. 6 characters')).toBeRequired();
  });

  test('renders branding', () => {
    renderRegister();
    expect(screen.getByText('Meet')).toBeInTheDocument();
  });
});
