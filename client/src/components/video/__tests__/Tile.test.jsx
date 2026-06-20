import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Tile from '../Tile';

describe('Tile', () => {
  test('renders display name', () => {
    render(<Tile participantId="p1" displayName="Alice" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('shows (You) for local tile', () => {
    render(<Tile participantId="p1" displayName="Alice" isLocal={true} />);
    expect(screen.getByText(/you/i)).toBeInTheDocument();
  });

  test('shows avatar when camera is off', () => {
    const { container } = render(<Tile participantId="p1" displayName="Bob" isCameraOff={true} />);
    const initials = screen.queryByText('B');
    expect(initials).toBeTruthy();
  });

  test('shows loading skeleton when isLoading', () => {
    const { container } = render(<Tile participantId="p1" displayName="Alice" isLoading={true} />);
    expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy();
  });

  test('shows screen sharing indicator', () => {
    render(<Tile participantId="p1" displayName="Alice" isScreenSharing={true} />);
    expect(screen.getByText('Presenting')).toBeInTheDocument();
  });

  test('shows dominant speaker border', () => {
    const { container } = render(<Tile participantId="p1" displayName="Alice" isDominantSpeaker={true} />);
    expect(container.firstChild.className).toContain('border-accent');
  });

  test('shows remove button when onKick provided', () => {
    render(<Tile participantId="p1" displayName="Alice" onKick={vi.fn()} />);
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });
});
