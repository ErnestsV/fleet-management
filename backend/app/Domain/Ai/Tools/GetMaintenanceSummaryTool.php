<?php

namespace App\Domain\Ai\Tools;

use App\Domain\Ai\Contracts\AiCopilotTool;
use App\Domain\Maintenance\Models\MaintenanceRecord;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class GetMaintenanceSummaryTool implements AiCopilotTool
{
    public function definition(): array
    {
        return [
            'name' => 'get_maintenance_summary',
            'description' => 'Get current maintenance pressure, due and overdue schedules, recent service records, and short-term service cost totals.',
            'parameters' => [
                'type' => 'object',
                'properties' => new \stdClass(),
                'required' => [],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ];
    }

    public function execute(array $arguments, User $user): array
    {
        $today = today();
        $soonCutoff = $today->copy()->addDays(30);
        $schedules = $this->visibleSchedulesQuery($user)
            ->with('vehicle.state')
            ->where('is_active', true)
            ->get();

        $rows = $schedules->map(function (MaintenanceSchedule $schedule) use ($today, $soonCutoff): array {
            $stateOdometer = $schedule->vehicle?->state?->odometer_km;
            $dateStatus = match (true) {
                $schedule->next_due_date === null => null,
                $schedule->next_due_date->lt($today) => 'overdue',
                $schedule->next_due_date->lte($soonCutoff) => 'due_soon',
                default => 'scheduled',
            };
            $odometerStatus = match (true) {
                $schedule->next_due_odometer_km === null || $stateOdometer === null => null,
                $stateOdometer >= $schedule->next_due_odometer_km => 'overdue',
                $stateOdometer >= $schedule->next_due_odometer_km - 500 => 'due_soon',
                default => 'scheduled',
            };

            $status = in_array('overdue', [$dateStatus, $odometerStatus], true)
                ? 'overdue'
                : (in_array('due_soon', [$dateStatus, $odometerStatus], true) ? 'due_soon' : 'scheduled');

            return [
                'schedule_id' => $schedule->id,
                'name' => $schedule->name,
                'vehicle' => $schedule->vehicle ? [
                    'id' => $schedule->vehicle->id,
                    'name' => $schedule->vehicle->name,
                    'plate_number' => $schedule->vehicle->plate_number,
                ] : null,
                'next_due_date' => $schedule->next_due_date?->toDateString(),
                'next_due_odometer_km' => $schedule->next_due_odometer_km,
                'current_odometer_km' => $stateOdometer !== null ? round((float) $stateOdometer, 1) : null,
                'status' => $status,
                'due_by_date' => $dateStatus,
                'due_by_odometer' => $odometerStatus,
            ];
        });

        $recentRecords = $this->visibleRecordsQuery($user)
            ->with('vehicle')
            ->latest('service_date')
            ->limit(6)
            ->get()
            ->map(fn (MaintenanceRecord $record) => [
                'record_id' => $record->id,
                'title' => $record->title,
                'service_date' => $record->service_date?->toDateString(),
                'cost_amount' => $record->cost_amount,
                'currency' => $record->currency,
                'vehicle' => $record->vehicle ? [
                    'id' => $record->vehicle->id,
                    'name' => $record->vehicle->name,
                    'plate_number' => $record->vehicle->plate_number,
                ] : null,
            ])
            ->values()
            ->all();

        $costWindowStart = now()->subDays(30);
        $costSummary = $this->visibleRecordsQuery($user)
            ->where('service_date', '>=', $costWindowStart)
            ->selectRaw('currency, COUNT(*) as record_count, COALESCE(SUM(cost_amount), 0) as total_cost')
            ->groupBy('currency')
            ->get()
            ->map(fn ($row) => [
                'currency' => (string) $row->currency,
                'record_count' => (int) $row->record_count,
                'total_cost' => round((float) $row->total_cost, 2),
            ])
            ->values()
            ->all();

        return [
            'summary' => [
                'active_schedules' => $rows->count(),
                'overdue_schedules' => $rows->where('status', 'overdue')->count(),
                'due_soon_schedules' => $rows->where('status', 'due_soon')->count(),
                'recent_records_30d' => array_sum(array_map(fn (array $row) => $row['record_count'], $costSummary)),
            ],
            'priority_schedules' => $rows
                ->sortBy(fn (array $row) => match ($row['status']) {
                    'overdue' => 0,
                    'due_soon' => 1,
                    default => 2,
                })
                ->take(8)
                ->values()
                ->all(),
            'recent_records' => $recentRecords,
            'costs_last_30d' => $costSummary,
        ];
    }

    private function visibleSchedulesQuery(User $user): Builder
    {
        return MaintenanceSchedule::query()
            ->when(
                ! $user->isSuperAdmin(),
                fn (Builder $query) => $user->company_id === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('company_id', $user->company_id)
            );
    }

    private function visibleRecordsQuery(User $user): Builder
    {
        return MaintenanceRecord::query()
            ->when(
                ! $user->isSuperAdmin(),
                fn (Builder $query) => $user->company_id === null
                    ? $query->whereRaw('1 = 0')
                    : $query->where('company_id', $user->company_id)
            );
    }
}
