import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { useAuthStore } from '@/app/store/authStore';
import { usePlatformFailedJobs } from '@/features/platform/usePlatformOperations';

const PAGE_SIZE = 10;

export function PlatformFailedJobsPage() {
  const actor = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePlatformFailedJobs({ page, per_page: PAGE_SIZE }, actor?.role === 'super_admin');

  const currentPage = data?.meta?.current_page ?? 1;
  const lastPage = data?.meta?.last_page ?? 1;
  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);

  return (
    <div>
      <PageHeader
        title="Failed Jobs"
        description="Paginated history of recent queued job failures visible from the application failure table."
      />
      <Panel title="Failed job history">
        {isLoading ? <div className="text-sm text-slate-500">Loading failed jobs...</div> : null}
        {isError ? <div className="text-sm text-rose-600">Failed to load failed jobs.</div> : null}
        {!isLoading && !isError ? (
          (data?.data.length ?? 0) > 0 ? (
            <>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-4 py-3">Job</th>
                    <th className="px-4 py-3">Queue</th>
                    <th className="px-4 py-3">Exception</th>
                    <th className="px-4 py-3">Failed at</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {(data?.data ?? []).map((job) => (
                    <tr key={job.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{job.job_name}</td>
                      <td className="px-4 py-3 text-slate-600">{job.queue}</td>
                      <td className="px-4 py-3 text-slate-600">{job.exception}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(job.failed_at).toLocaleString()}</td>
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
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No failed jobs recorded.</div>
          )
        ) : null}
      </Panel>
    </div>
  );
}
