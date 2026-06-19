import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MeetingNotFound from '../MeetingNotFound';

const renderMeetingNotFound = () =>
  render(
    <MemoryRouter initialEntries={['/meeting-not-found']}>
      <Routes>
        <Route path="/meeting-not-found" element={<MeetingNotFound />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('MeetingNotFound', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('renders not found message', () => {
    renderMeetingNotFound();
    expect(screen.getByText('Meeting not found')).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist or may have ended/i)).toBeInTheDocument();
  });

  test('renders go home button', () => {
    renderMeetingNotFound();
    expect(screen.getByText('Go home')).toBeInTheDocument();
  });

  test('navigates to home on button click', async () => {
    const user = userEvent.setup();
    renderMeetingNotFound();
    await user.click(screen.getByText('Go home'));
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
