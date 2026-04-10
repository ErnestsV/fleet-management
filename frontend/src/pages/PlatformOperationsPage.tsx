import { Building2, Clock3, ShieldAlert, UserRound, Workflow } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePlatformOperations } from '@/features/platform/usePlatformOperations';
import { useAuthStore } from '@/app/store/authStore';
import { useNavigate } from 'react-router-dom';

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'No data';
  }

  return new Date(value).toLocaleString();
}

export function PlatformOperationsPage() {
  const actor = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePlatformOperations(actor?.role === 'super_admin');
  const summary = data?.data;

  const cards = [
    {
      label: 'Active companies',
      value: summary?.overview.active_companies ?? 0,
      detail: `${summary?.overview.total_companies ?? 0} total tenants`,
      icon: Building2,
    },
    {
      label: 'Active users',
      value: summary?.overview.active_users ?? 0,
      detail: `${summary?.overview.inactive_companies ?? 0} inactive companies`,
      icon: UserRound,
    },
    {
      label: 'Pending jobs',
      value: summary?.overview.pending_jobs ?? 0,
      detail: `${summary?.overview.reserved_jobs ?? 0} reserved right now`,
      icon: Workflow,
    },
    {
      label: 'Failed jobs 24h',
      value: summary?.overview.failed_jobs_24h ?? 0,
      detail: `Scheduler: ${summary?.overview.scheduler_status?.replace(/_/g, ' ') ?? 'unknown'}`,
      icon: ShieldAlert,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Platform Operations"
        description="Super admin overview of tenant growth, scheduled task health, queue backlog, and recent product-level platform activity."
      />

      {isLoading ? <div className="text-sm text-slate-500">Loading platform operations...</div> : null}
      {isError ? <div className="text-sm text-rose-600">Failed to load platform operations.</div> : null}

      {summary ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, detail, icon: Icon }) => (
              <Panel key={label} title={label}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-3xl font-bold text-slate-950">{value}</div>
                    <div className="mt-2 text-sm text-slate-500">{detail}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-500">
                    <Icon size={18} />
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
            <Panel title="Scheduled tasks" description="Application-owned recurring tasks tracked from the scheduler and command execution layer.">
              <div className="space-y-3">
                {summary.scheduled_tasks.map((task) => (
                  <div key={task.job_key} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{task.label}</div>
                        <div className="mt-1 text-sm text-slate-500">{task.frequency}</div>
                      </div>
                      <StatusBadge value={task.status} />
                    </div>
                    <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <div>
                        <div className="text-slate-400">Last success</div>
                        <div className="mt-1">{formatDateTime(task.last_succeeded_at)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Last runtime</div>
                        <div className="mt-1">{task.last_runtime_ms !== null ? `${task.last_runtime_ms} ms` : 'No data'}</div>
                      </div>
                    </div>
                    {task.last_error ? (
                      <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {task.last_error}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>

            <div className="space-y-6">
              <Panel title="Queue health" description="Queued work visible from the application job tables.">
                <div className="space-y-3">
                  {summary.queue_health.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No queued work is currently visible.</div>
                  ) : summary.queue_health.map((queue) => (
                    <div key={queue.queue} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-slate-900">{queue.queue}</div>
                        <div className="text-sm text-slate-500">{queue.pending_jobs} pending</div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-slate-400">Reserved</div>
                          <div className="mt-1 font-medium text-slate-700">{queue.reserved_jobs}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Failed 24h</div>
                          <div className="mt-1 font-medium text-slate-700">{queue.failed_jobs_24h}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Oldest</div>
                          <div className="mt-1 font-medium text-slate-700">
                            {queue.oldest_pending_age_minutes !== null ? `${queue.oldest_pending_age_minutes} min` : 'None'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Recent failed jobs"
                description="Latest background job failures visible from the queue failure table."
                actions={(
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => navigate('/platform-operations/failed-jobs')}
                  >
                    View all
                  </button>
                )}
              >
                <div className="space-y-3">
                  {summary.recent_failed_jobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No failed jobs recorded recently.</div>
                  ) : summary.recent_failed_jobs.map((job) => (
                    <div key={job.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{job.job_name}</div>
                          <div className="mt-1 text-sm text-slate-500">{job.queue}</div>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          <Clock3 size={12} />
                          {formatDateTime(job.failed_at)}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">{job.exception}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          <Panel
            title="Recent platform activity"
            description="Recent tenant onboarding and user creation activity visible inside the product data model."
            actions={(
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => navigate('/platform-operations/activity')}
              >
                View all
              </button>
            )}
          >
            {summary.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {summary.recent_activity.map((item) => (
                  <div key={`${item.type}-${item.headline}-${item.occurred_at ?? 'no-date'}`} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                    <div>
                      <div className="font-semibold text-slate-900">{item.headline}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                    </div>
                    <div className="text-sm text-slate-400">{formatDateTime(item.occurred_at)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No recent platform activity is available yet.</div>
            )}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
