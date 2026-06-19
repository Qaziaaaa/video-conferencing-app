import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RemovedScreen from '../RemovedScreen';

const renderRemovedScreen = () =>
  render(
    <MemoryRouter initialEntries={['/removed']}>
      <Routes>
        <Route path="/removed" element={<RemovedScreen />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('RemovedScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('renders removed message', () => {
    renderRemovedScreen();
    expect(screen.getByText('You were removed')).toBeInTheDocument();
    expect(screen.getByText(/host has removed you/i)).toBeInTheDocument();
  });

  test('renders go home button', () => {
    renderRemovedScreen();
    expect(screen.getByText('Go home')).toBeInTheDocument();
  });

  test('navigates to home on button click', async () => {
    const user = userEvent.setup();
    renderRemovedScreen();
    await user.click(screen.getByText('Go home'));
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
