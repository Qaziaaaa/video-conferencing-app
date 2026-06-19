import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import VideoPlayer from '../VideoPlayer';

describe('VideoPlayer', () => {
  test('renders video element', () => {
    const { container } = render(<VideoPlayer stream={null} />);
    expect(container.querySelector('video')).toBeInTheDocument();
  });

  test('sets muted attribute', () => {
    const { container } = render(<VideoPlayer stream={null} muted={true} />);
    expect(container.querySelector('video').muted).toBe(true);
  });

  test('does not mute by default', () => {
    const { container } = render(<VideoPlayer stream={null} />);
    expect(container.querySelector('video').muted).toBe(false);
  });

  test('sets srcObject when stream provided', () => {
    const stream = {};
    const { container } = render(<VideoPlayer stream={stream} />);
    expect(container.querySelector('video').srcObject).toBe(stream);
  });

  test('handles null stream without error', () => {
    const { container } = render(<VideoPlayer stream={null} />);
    expect(container.querySelector('video').srcObject).toBeUndefined();
  });
});
