import type { ReactNode } from 'react';

export function Panel({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
