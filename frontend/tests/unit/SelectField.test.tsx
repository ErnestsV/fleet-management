import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectField } from '@/components/ui/SelectField';

describe('SelectField', () => {
  it('renders a safe fallback label when no options are provided', () => {
    render(<SelectField value=""> </SelectField>);

    expect(screen.getByRole('button')).toHaveTextContent('Select option');
  });

  it('opens options and emits value changes', () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();

    render(
      <SelectField id="vehicle-status" value="" onValueChange={onValueChange} onChange={onChange}>
        <option value="">All statuses</option>
        <option value="moving">Moving</option>
      </SelectField>,
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('option', { name: 'Moving' }));

    expect(onValueChange).toHaveBeenCalledWith('moving');
    expect(onChange).toHaveBeenCalledWith({ target: { value: 'moving' } });
  });

  it('exposes listbox semantics when opened', () => {
    render(
      <SelectField id="alert-type" value="">
        <option value="">All types</option>
        <option value="speeding">Speeding</option>
      </SelectField>,
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
