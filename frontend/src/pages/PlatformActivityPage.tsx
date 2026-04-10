import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { useAuthStore } from '@/app/store/authStore';
import { usePlatformActivity } from '@/features/platform/usePlatformOperations';

const PAGE_SIZE = 10;

export function PlatformActivityPage() {
  const actor = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePlatformActivity({ page, per_page: PAGE_SIZE }, actor?.role === 'super_admin');
  const isAwaitingActor = actor === null;

  const currentPage = data?.meta?.current_page ?? 1;
  const lastPage = data?.meta?.last_page ?? 1;
  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);

  return (
    <div>
      <PageHeader
        title="Platform Activity"
        description="Paginated history of tenant onboarding and user creation activity visible from the product data model."
      />
      <Panel title="Activity history">
        {isAwaitingActor ? <div className="text-sm text-slate-500">Loading platform activity...</div> : null}
        {isLoading ? <div className="text-sm text-slate-500">Loading platform activity...</div> : null}
        {isError ? <div className="text-sm text-rose-600">Failed to load platform activity.</div> : null}
        {!isAwaitingActor && !isLoading && !isError ? (
          (data?.data.length ?? 0) > 0 ? (
            <>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Headline</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Occurred at</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {(data?.data ?? []).map((item, index) => (
                  <tr key={`${item.type}-${item.headline}-${item.occurred_at}-${index}`}>
                      <td className="px-4 py-3 capitalize text-slate-600">{item.type}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.headline}</td>
                      <td className="px-4 py-3 text-slate-600">{item.description}</td>
                      <td className="px-4 py-3 text-slate-600">{item.occurred_at ? new Date(item.occurred_at).toLocaleString() : 'No data'}</td>
                    </tr>
                  ))}
                </DataTableBody>
              </DataTable>
              {lastPage > 1 ? (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        currentPage === pageNumber
                          ? 'bg-brand-600 text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                    disabled={currentPage === lastPage}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No platform activity recorded.</div>
          )
        ) : null}
      </Panel>
    </div>
  );
}
