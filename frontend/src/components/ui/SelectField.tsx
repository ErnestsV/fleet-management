import { Children, ReactElement, ReactNode, isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type OptionProps = {
  value?: string | number;
  children?: ReactNode;
  disabled?: boolean;
};

type SelectFieldProps = {
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  onChange?: (event: { target: { value: string } }) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  children: ReactNode;
};

function isOptionElement(child: ReactNode): child is ReactElement<OptionProps> {
  return isValidElement<OptionProps>(child) && child.type === 'option';
}

function getOptionLabel(option: ReactElement<OptionProps>) {
  return Children.toArray(option.props.children).join('');
}

export function SelectField({
  id,
  name,
  value,
  onChange,
  onValueChange,
  disabled = false,
  className = '',
  buttonClassName = '',
  children,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(() => Children.toArray(children).filter(isOptionElement), [children]);
  const normalizedValue = Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
  const selectedOption = options.find((option) => String(option.props.value ?? '') === normalizedValue);
  const placeholderOption = options.find((option) => String(option.props.value ?? '') === '');
  const triggerLabel = selectedOption
    ? getOptionLabel(selectedOption)
    : placeholderOption
      ? getOptionLabel(placeholderOption)
        : options[0]
          ? getOptionLabel(options[0])
          : 'Select option';
  const listboxId = `${id ?? name ?? 'select'}-listbox`;
  const selectedIndex = Math.max(0, options.findIndex((option) => String(option.props.value ?? '') === normalizedValue));

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={normalizedValue} /> : null}
      <button
        id={id}
        type="button"
        disabled={disabled}
        className={`flex w-full items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 shadow-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400 ${buttonClassName}`}
        onClick={() => !disabled && setOpen((state) => !state)}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }

          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
      >
        <span className="min-w-0 flex-1 truncate">{triggerLabel}</span>
        <ChevronDown size={18} className={`ml-3 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          tabIndex={-1}
          className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
              return;
            }

            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter' && event.key !== ' ') {
              return;
            }

            event.preventDefault();

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              const direction = event.key === 'ArrowDown' ? 1 : -1;
              let nextIndex = selectedIndex;

              for (let step = 0; step < options.length; step += 1) {
                nextIndex = (nextIndex + direction + options.length) % options.length;
                if (!options[nextIndex]?.props.disabled) {
                  const optionValue = String(options[nextIndex]?.props.value ?? '');
                  onValueChange?.(optionValue);
                  onChange?.({ target: { value: optionValue } });
                  break;
                }
              }
            }

            if (event.key === 'Enter' || event.key === ' ') {
              setOpen(false);
            }
          }}
        >
          {options.map((option) => {
            const optionValue = String(option.props.value ?? '');
            const selected = optionValue === normalizedValue;
            const label = getOptionLabel(option);

            return (
              <button
                key={`${name ?? id ?? 'select'}-${optionValue}-${label}`}
                type="button"
                disabled={option.props.disabled}
                role="option"
                aria-selected={selected}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  option.props.disabled
                    ? 'cursor-not-allowed text-slate-300'
                    : selected
                      ? 'bg-brand-50 text-brand-700'
                      : 'hover:bg-slate-50 text-slate-700'
                }`}
                onClick={() => {
                  if (option.props.disabled) {
                    return;
                  }

                  onValueChange?.(optionValue);
                  onChange?.({ target: { value: optionValue } });
                  setOpen(false);
                }}
              >
                <span className="block break-words whitespace-normal">{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
