import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import SkeletonTile from '../SkeletonTile';

describe('SkeletonTile', () => {
  test('renders without crashing', () => {
    const { container } = render(<SkeletonTile />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders with expected structure', () => {
    const { container } = render(<SkeletonTile />);
    const el = container.firstChild;
    expect(el.className).toContain('rounded-2xl');
    expect(el.className).toContain('bg-[#111118]');
  });
});
