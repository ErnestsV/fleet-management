type ShowMoreButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function ShowMoreButton({ label, onClick, className = '' }: ShowMoreButtonProps) {
  return (
    <button
      type="button"
      className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${className}`.trim()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
