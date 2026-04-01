import { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
};

export function CheckboxField({ label, className = '', checked, ...props }: CheckboxFieldProps) {
  return (
    <label className={`flex items-center gap-3 text-sm text-slate-600 ${className}`}>
      <span className="relative flex h-5 w-5 items-center justify-center">
        <input {...props} type="checkbox" checked={checked} className="peer sr-only" />
        <span className="h-5 w-5 rounded-md border border-slate-300 bg-white transition peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300" />
        <Check size={14} className="pointer-events-none absolute text-white opacity-0 transition peer-checked:opacity-100" />
      </span>
      <span>{label}</span>
    </label>
  );
}
