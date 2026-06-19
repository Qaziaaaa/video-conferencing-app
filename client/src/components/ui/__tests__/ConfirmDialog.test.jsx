import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(<ConfirmDialog isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  test('renders dialog when isOpen is true', () => {
    render(<ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/leave meeting/i)).toBeInTheDocument();
  });

  test('calls onConfirm when Leave button clicked', async () => {
    const onConfirm = vi.fn();
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<ConfirmDialog isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.click(screen.getByText('Leave'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  test('calls onCancel when Stay button clicked', async () => {
    const onCancel = vi.fn();
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByText('Stay'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  test('calls onCancel when backdrop clicked', async () => {
    const onCancel = vi.fn();
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole('dialog').querySelector('[class*="inset-0 bg-black"]'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('calls onCancel on Escape key', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });
});
