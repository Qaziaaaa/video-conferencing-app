import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import useAuthStore from '../../store/useAuthStore';

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.restoreAllMocks();
  });

  test('renders heading and form elements', () => {
    renderLogin();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  test('shows link to register', () => {
    renderLogin();
    expect(screen.getByText('Create one')).toBeInTheDocument();
  });

  test('submits login form successfully', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'tok123',
        userId: 'uid1',
        email: 'a@b.com',
        displayName: 'Alice',
      }),
    });
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
    await user.click(screen.getByText('Sign in'));
    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('tok123');
      expect(useAuthStore.getState().displayName).toBe('Alice');
    });
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise;
    global.fetch = vi.fn().mockReturnValue(new Promise((r) => { resolvePromise = r; }));
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
    await user.click(screen.getByText('Sign in'));
    expect(screen.getByText('Signing in…')).toBeInTheDocument();
    expect(screen.getByText('Signing in…').closest('button')).toBeDisabled();
    resolvePromise({
      ok: true,
      json: async () => ({ token: 't', userId: 'u', email: 'e', displayName: 'n' }),
    });
  });

  test('shows error on failed login', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
    await user.click(screen.getByText('Sign in'));
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('shows network error on exception', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password');
    await user.click(screen.getByText('Sign in'));
    await waitFor(() => {
      expect(screen.getByText('Network error. Is the server running?')).toBeInTheDocument();
    });
  });

  test('email input is required', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('you@example.com')).toBeRequired();
  });

  test('password input is required', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Enter your password')).toBeRequired();
  });

  test('renders logo and branding', () => {
    renderLogin();
    expect(screen.getByText('Meet')).toBeInTheDocument();
  });
});
