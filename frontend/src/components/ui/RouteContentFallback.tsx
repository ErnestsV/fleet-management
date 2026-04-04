export function RouteContentFallback() {
  return (
    <div className="p-6">
      <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="text-sm font-medium text-slate-700">Loading page</div>
        <div className="mt-2 text-sm text-slate-500">Preparing the next screen.</div>
      </div>
    </div>
  );
}
