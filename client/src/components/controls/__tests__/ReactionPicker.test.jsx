import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReactionPicker from '../ReactionPicker';

describe('ReactionPicker (Task 7.7)', () => {
  test('renders trigger button with smile icon', () => {
    render(<ReactionPicker onReact={vi.fn()} />);
    expect(screen.getByLabelText('Send reaction')).toBeInTheDocument();
  });

  test('shows emoji popup on trigger click', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker onReact={vi.fn()} />);
    await user.click(screen.getByLabelText('Send reaction'));
    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  test('calls onReact with emoji when an emoji is clicked', async () => {
    const onReact = vi.fn();
    const user = userEvent.setup();
    render(<ReactionPicker onReact={onReact} />);
    await user.click(screen.getByLabelText('Send reaction'));
    await user.click(screen.getByText('👍'));
    expect(onReact).toHaveBeenCalledWith('👍');
  });

  test('closes popup after selecting an emoji', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker onReact={vi.fn()} />);
    await user.click(screen.getByLabelText('Send reaction'));
    expect(screen.getByText('👍')).toBeInTheDocument();
    await user.click(screen.getByText('😂'));
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
  });

  test('popup renders with left-0 positioning (mobile)', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker onReact={vi.fn()} />);
    await user.click(screen.getByLabelText('Send reaction'));
    const popup = await screen.findByText('👍').then(el => el.closest('div.absolute'));
    expect(popup.className).toContain('left-0');
  });

  test('popup renders with bottom-full positioning', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker onReact={vi.fn()} />);
    await user.click(screen.getByLabelText('Send reaction'));
    const popup = await screen.findByText('👍').then(el => el.closest('div.absolute'));
    expect(popup.className).toContain('bottom-full');
  });
});
