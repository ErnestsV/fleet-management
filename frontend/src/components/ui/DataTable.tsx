import type { ReactNode } from 'react';

type DataTableProps = {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
};

export function DataTable({ children, className = '', tableClassName = '' }: DataTableProps) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200 ${className}`.trim()}>
      <table className={`min-w-full divide-y divide-slate-200 text-sm ${tableClassName}`.trim()}>{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-left text-slate-500">{children}</thead>;
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>;
}
