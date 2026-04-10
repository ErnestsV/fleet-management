<?php

namespace App\Domain\Platform\Services;

use App\Domain\Companies\Models\Company;
use App\Domain\Platform\Models\PlatformJobStatus;
use App\Domain\Platform\Support\PlatformJobCatalog;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformOperationsReadService
{
    private const SUMMARY_RECENT_LIMIT = 10;

    public function summary(): array
    {
        $now = now();
        $jobDefinitions = PlatformJobCatalog::definitions();
        $jobStatuses = PlatformJobStatus::query()->get()->keyBy('job_key');

        $pendingJobs = DB::table('jobs')->count();
        $reservedJobs = DB::table('jobs')->whereNotNull('reserved_at')->count();
        $failedJobs24h = DB::table('failed_jobs')
            ->where('failed_at', '>=', $now->copy()->subDay())
            ->count();

        $schedulerStatus = $this->schedulerStatus($jobStatuses->get('scheduler-heartbeat'));

        return [
            'overview' => [
                'total_companies' => Company::query()->count(),
                'active_companies' => Company::query()->where('is_active', true)->count(),
                'inactive_companies' => Company::query()->where('is_active', false)->count(),
                'active_users' => User::query()->where('is_active', true)->count(),
                'pending_jobs' => $pendingJobs,
                'reserved_jobs' => $reservedJobs,
                'failed_jobs_24h' => $failedJobs24h,
                'scheduler_status' => $schedulerStatus['status'],
                'scheduler_last_seen_at' => $schedulerStatus['last_seen_at'],
            ],
            'scheduled_tasks' => collect($jobDefinitions)
                ->map(function (array $definition, string $jobKey) use ($jobStatuses, $now): array {
                    $status = $jobStatuses->get($jobKey);
                    $computedStatus = $this->taskStatus($status, $definition['expected_interval_minutes'], $now);

                    return [
                        'job_key' => $jobKey,
                        'label' => $definition['label'],
                        'frequency' => $definition['frequency'],
                        'status' => $computedStatus,
                        'last_started_at' => $status?->last_started_at?->toIso8601String(),
                        'last_finished_at' => $status?->last_finished_at?->toIso8601String(),
                        'last_succeeded_at' => $status?->last_succeeded_at?->toIso8601String(),
                        'last_failed_at' => $status?->last_failed_at?->toIso8601String(),
                        'last_runtime_ms' => $status?->last_runtime_ms,
                        'last_error' => $status?->last_error,
                    ];
                })
                ->sortBy(fn (array $task) => match ($task['status']) {
                    'failed' => 0,
                    'stale' => 1,
                    'pending' => 2,
                    'unknown' => 3,
                    default => 4,
                })
                ->values()
                ->all(),
            'queue_health' => $this->queueHealth($now),
            'recent_failed_jobs' => $this->recentFailedJobs(self::SUMMARY_RECENT_LIMIT),
            'recent_activity' => $this->recentActivity(self::SUMMARY_RECENT_LIMIT),
        ];
    }

    public function failedJobsPaginated(int $perPage = 10): LengthAwarePaginator
    {
        $safePerPage = max(1, min($perPage, 100));

        return DB::table('failed_jobs')
            ->latest('failed_at')
            ->paginate($safePerPage)
            ->through(function ($row): array {
                $payload = json_decode((string) $row->payload, true);
                $jobName = data_get($payload, 'displayName')
                    ?? data_get($payload, 'job')
                    ?? 'Queued job';

                return [
                    'id' => (int) $row->id,
                    'queue' => (string) $row->queue,
                    'job_name' => (string) $jobName,
                    'exception' => $this->exceptionSummary((string) $row->exception),
                    'failed_at' => (string) $row->failed_at,
                ];
            });
    }

    public function recentActivityPaginated(int $page = 1, int $perPage = 10): LengthAwarePaginator
    {
        $safePage = max(1, $page);
        $safePerPage = max(1, min($perPage, 100));
        return $this->recentActivityQuery()
            ->paginate($safePerPage, ['*'], 'page', $safePage)
            ->through(fn ($row): array => $this->mapActivityRow($row));
    }

    private function schedulerStatus(?PlatformJobStatus $heartbeat): array
    {
        return [
            'status' => $this->taskStatus($heartbeat, 1, now()),
            'last_seen_at' => $heartbeat?->last_succeeded_at?->toIso8601String(),
        ];
    }

    private function taskStatus(?PlatformJobStatus $status, ?int $expectedIntervalMinutes, $now): string
    {
        if ($status === null) {
            return 'unknown';
        }

        if ($status->status === 'failed') {
            return 'failed';
        }

        if ($status->status === 'pending') {
            return 'pending';
        }

        if ($expectedIntervalMinutes !== null && $status->last_succeeded_at !== null) {
            $staleAfterMinutes = max($expectedIntervalMinutes * 3, 5);

            if ($status->last_succeeded_at->lt($now->copy()->subMinutes($staleAfterMinutes))) {
                return 'stale';
            }
        }

        return $status->status ?: 'unknown';
    }

    private function queueHealth($now): array
    {
        $pendingRows = DB::table('jobs')
            ->selectRaw('queue, COUNT(*) as pending_jobs')
            ->selectRaw('SUM(CASE WHEN reserved_at IS NOT NULL THEN 1 ELSE 0 END) as reserved_jobs')
            ->selectRaw('MIN(created_at) as oldest_created_at')
            ->groupBy('queue')
            ->get()
            ->keyBy('queue');

        $failedRows = DB::table('failed_jobs')
            ->selectRaw('queue, COUNT(*) as failed_jobs_24h')
            ->where('failed_at', '>=', $now->copy()->subDay())
            ->groupBy('queue')
            ->get()
            ->keyBy('queue');

        return collect($pendingRows->keys()->merge($failedRows->keys())->unique()->values())
            ->map(function (string $queue) use ($pendingRows, $failedRows, $now): array {
                $pending = $pendingRows->get($queue);
                $failed = $failedRows->get($queue);
                $oldestCreatedAt = isset($pending?->oldest_created_at) ? (int) $pending->oldest_created_at : null;

                return [
                    'queue' => $queue,
                    'pending_jobs' => (int) ($pending?->pending_jobs ?? 0),
                    'reserved_jobs' => (int) ($pending?->reserved_jobs ?? 0),
                    'failed_jobs_24h' => (int) ($failed?->failed_jobs_24h ?? 0),
                    'oldest_pending_age_minutes' => $oldestCreatedAt !== null
                        ? $now->diffInMinutes($now->copy()->setTimestamp($oldestCreatedAt))
                        : null,
                ];
            })
            ->sortByDesc(fn (array $row) => [$row['pending_jobs'], $row['failed_jobs_24h']])
            ->values()
            ->all();
    }

    private function recentFailedJobs(int $limit): array
    {
        return DB::table('failed_jobs')
            ->latest('failed_at')
            ->limit($limit)
            ->get()
            ->map(function ($row): array {
                $payload = json_decode((string) $row->payload, true);
                $jobName = data_get($payload, 'displayName')
                    ?? data_get($payload, 'job')
                    ?? 'Queued job';

                return [
                    'id' => (int) $row->id,
                    'queue' => (string) $row->queue,
                    'job_name' => (string) $jobName,
                    'exception' => $this->exceptionSummary((string) $row->exception),
                    'failed_at' => (string) $row->failed_at,
                ];
            })
            ->all();
    }

    private function recentActivity(int $limit): array
    {
        return $this->recentActivityQuery()
            ->limit($limit)
            ->get()
            ->map(fn ($row): array => $this->mapActivityRow($row))
            ->values()
            ->all();
    }

    private function recentActivityQuery()
    {
        $companyActivity = Company::query()
            ->selectRaw("'company' as type")
            ->selectRaw('name as headline')
            ->selectRaw('NULL as role')
            ->selectRaw('NULL as company_name')
            ->selectRaw('is_active')
            ->selectRaw('created_at as occurred_at');

        $userActivity = User::query()
            ->leftJoin('companies', 'companies.id', '=', 'users.company_id')
            ->selectRaw("'user' as type")
            ->selectRaw('users.name as headline')
            ->selectRaw('users.role as role')
            ->selectRaw('companies.name as company_name')
            ->selectRaw('NULL as is_active')
            ->selectRaw('users.created_at as occurred_at');

        return DB::query()
            ->fromSub($companyActivity->unionAll($userActivity), 'platform_activity')
            ->orderByDesc('occurred_at');
    }

    private function mapActivityRow(object $row): array
    {
        return [
            'type' => (string) $row->type,
            'headline' => (string) $row->headline,
            'description' => $row->type === 'company'
                ? ((bool) $row->is_active ? 'Company is active.' : 'Company is currently inactive.')
                : sprintf(
                    '%s user for %s.',
                    str((string) ($row->role ?? 'platform'))->replace('_', ' ')->title()->toString(),
                    $row->company_name ?: 'the platform'
                ),
            'occurred_at' => $row->occurred_at ? (string) $row->occurred_at : null,
        ];
    }

    private function exceptionSummary(string $exception): string
    {
        $firstLine = Str::of($exception)->before("\n")->trim()->toString();

        return $firstLine !== '' ? $firstLine : 'Job failure';
    }
}
