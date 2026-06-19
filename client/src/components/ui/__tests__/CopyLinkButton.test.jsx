import { describe, test, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CopyLinkButton from '../CopyLinkButton';

describe('CopyLinkButton', () => {
  test('renders with copy label', () => {
    render(<CopyLinkButton url="https://example.com/meeting" />);
    expect(screen.getByText('Copy link')).toBeInTheDocument();
  });

  test('shows "Copied!" after clicking', async () => {
    const user = userEvent.setup();
    render(<CopyLinkButton url="https://example.com/meeting" />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});
