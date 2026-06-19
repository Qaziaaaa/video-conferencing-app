import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessage from '../ChatMessage';

const baseMessage = {
  senderName: 'Alice',
  text: 'Hello world',
  timestamp: new Date('2025-01-01T12:00:00').toISOString(),
};

describe('ChatMessage', () => {
  test('renders message text', () => {
    render(<ChatMessage message={baseMessage} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  test('shows sender name for others', () => {
    render(<ChatMessage message={baseMessage} isOwn={false} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('shows "You" for own messages', () => {
    render(<ChatMessage message={baseMessage} isOwn={true} />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  test('renders timestamp', () => {
    render(<ChatMessage message={baseMessage} />);
    expect(screen.getByText(/12:00/i)).toBeInTheDocument();
  });

  test('renders with different alignment for own vs other', () => {
    const { rerender } = render(<ChatMessage message={baseMessage} isOwn={true} />);
    expect(screen.getByText('Hello world').closest('[class*="rounded-tr-sm"]')).toBeInTheDocument();
    rerender(<ChatMessage message={baseMessage} isOwn={false} />);
    expect(screen.getByText('Hello world').closest('[class*="rounded-tl-sm"]')).toBeInTheDocument();
  });
});
