export function AccessDenied({ title = 'Access denied' }: { title?: string }) {
  return (
    <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-panel">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-amber-900/80">Your current role does not have access to this area.</p>
    </div>
  );
}
