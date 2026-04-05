import { useId } from 'react';
import { X } from 'lucide-react';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder,
  id,
  name,
  autoComplete,
  className = '',
  inputClassName = '',
}: SearchFieldProps) {
  const generatedId = useId();
  const normalizedFieldName = placeholder.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const inputId = id ?? `search-field-${generatedId}`;
  const inputName = name ?? (normalizedFieldName || `search_field_${generatedId}`);

  return (
    <div className={`relative ${className}`.trim()}>
      <input
        id={inputId}
        name={inputName}
        autoComplete={autoComplete}
        className={`h-[46px] w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-900 placeholder:text-slate-400 ${inputClassName}`.trim()}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={`Clear ${placeholder.toLowerCase()}`}
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
