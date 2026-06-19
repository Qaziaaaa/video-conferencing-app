import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '../ChatInput';

describe('ChatInput', () => {
  test('renders textarea and send button', () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText(/send a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  test('send button disabled when text is empty', () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  test('send button enabled when text is present', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/send a message/i);
    await user.type(textarea, 'hello');
    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled();
  });

  test('calls onSend with trimmed text on button click', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/send a message/i);
    await user.type(textarea, '  hello  ');
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(onSend).toHaveBeenCalledWith('hello');
  });

  test('clears input after sending', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/send a message/i);
    await user.type(textarea, 'hello');
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(textarea).toHaveValue('');
  });

  test('sends on Enter key', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/send a message/i);
    await user.type(textarea, 'hello{Enter}');
    expect(onSend).toHaveBeenCalledWith('hello');
  });

  test('does not send on Shift+Enter', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/send a message/i);
    await user.type(textarea, 'hello{Shift>}{Enter}{/Shift}');
    expect(onSend).not.toHaveBeenCalled();
  });

  test('does not send empty text', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  test('disabled state prevents typing and sending', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} disabled />);
    expect(screen.getByPlaceholderText(/send a message/i)).toBeDisabled();
  });

  test('shows error when message exceeds max length', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/send a message/i);
    fireEvent.change(textarea, { target: { value: 'a'.repeat(1001) } });
    expect(screen.getByText(/message too long/i)).toBeInTheDocument();
  });

  test('does not send when message exceeds max length', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/send a message/i);
    fireEvent.change(textarea, { target: { value: 'a'.repeat(1001) } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(onSend).not.toHaveBeenCalled();
  });
});
