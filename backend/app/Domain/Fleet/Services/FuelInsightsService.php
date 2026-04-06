<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class FuelInsightsService
{
    public function paginated(User $user, array $filters = []): array
    {
        $query = $this->applyFilters($this->baseQuery($user), $filters);
        $summary = $this->buildSummary(clone $query);
        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);

        $paginator = $query
            ->orderByRaw($this->severitySortExpression())
            ->orderByDesc('triggered_at')
            ->paginate($perPage);

        $paginator->setCollection(
            $paginator->getCollection()->map(fn (Alert $alert) => $this->mapRow($alert))
        );

        return [
            'summary' => $summary,
            'paginator' => $paginator,
        ];
    }

    public function dashboardSummary(User $user): array
    {
        return $this->buildSummary(
            $this->baseQuery($user)->whereNull('alerts.resolved_at')
        );
    }

    private function baseQuery(User $user): Builder
    {
        return Alert::query()
            ->with(['vehicle', 'resolvedBy'])
            ->whereIn('alerts.type', $this->fuelTypeValues())
            ->when(
                ! $user->isSuperAdmin(),
                fn (Builder $query) => $query->where('alerts.company_id', $user->company_id)
            );
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $type = (string) ($filters['type'] ?? '');
        $status = (string) ($filters['status'] ?? '');

        if ($search !== '') {
            $searchPattern = '%'.$this->escapeLike($search).'%';

            $query->whereHas('vehicle', function (Builder $vehicleQuery) use ($searchPattern): void {
                $vehicleQuery->where('name', 'like', $searchPattern)
                    ->orWhere('plate_number', 'like', $searchPattern)
                    ->orWhere('make', 'like', $searchPattern)
                    ->orWhere('model', 'like', $searchPattern)
                    ->orWhere('device_identifier', 'like', $searchPattern);
            });
        }

        if ($type !== '') {
            $query->where('alerts.type', $type);
        }

        if ($status === 'active') {
            $query->whereNull('alerts.resolved_at');
        }

        if ($status === 'resolved') {
            $query->whereNotNull('alerts.resolved_at');
        }

        return $query;
    }

    private function buildSummary(Builder $query): array
    {
        $countByType = (clone $query)
            ->selectRaw('alerts.type, COUNT(*) as aggregate_count')
            ->groupBy('alerts.type')
            ->pluck('aggregate_count', 'type');

        $suspiciousVehicles = (clone $query)
            ->whereNull('alerts.resolved_at')
            ->join('vehicles', 'vehicles.id', '=', 'alerts.vehicle_id')
            ->selectRaw('alerts.vehicle_id')
            ->selectRaw('vehicles.plate_number')
            ->selectRaw('vehicles.name')
            ->selectRaw('COUNT(*) as anomaly_count')
            ->selectRaw('MAX(alerts.triggered_at) as latest_triggered_at')
            ->selectRaw("SUM(CASE WHEN alerts.severity = 'high' THEN 3 WHEN alerts.severity = 'medium' THEN 2 ELSE 1 END) as severity_score")
            ->whereNotNull('alerts.vehicle_id')
            ->groupBy('alerts.vehicle_id', 'vehicles.plate_number', 'vehicles.name')
            ->orderByDesc('severity_score')
            ->orderByDesc('latest_triggered_at')
            ->limit(10)
            ->get()
            ->map(fn (object $row) => [
                'vehicle_id' => (int) $row->vehicle_id,
                'plate_number' => $row->plate_number,
                'name' => $row->name,
                'anomaly_count' => (int) $row->anomaly_count,
                'latest_triggered_at' => $row->latest_triggered_at,
            ])
            ->values();

        return [
            'total_anomalies' => (clone $query)->count(),
            'active_anomalies' => (clone $query)->whereNull('alerts.resolved_at')->count(),
            'resolved_anomalies' => (clone $query)->whereNotNull('alerts.resolved_at')->count(),
            'affected_vehicles' => (clone $query)->whereNotNull('alerts.vehicle_id')->distinct()->count('alerts.vehicle_id'),
            'unexpected_drop_count' => (int) ($countByType[AlertType::UnexpectedFuelDrop->value] ?? 0),
            'possible_theft_count' => (int) ($countByType[AlertType::PossibleFuelTheft->value] ?? 0),
            'refuel_without_trip_count' => (int) ($countByType[AlertType::RefuelWithoutTrip->value] ?? 0),
            'abnormal_consumption_count' => (int) ($countByType[AlertType::AbnormalFuelConsumption->value] ?? 0),
            'suspicious_vehicles' => $suspiciousVehicles,
            'thresholds' => [
                'unexpected_drop_pct' => (float) config('fleet.fuel_unexpected_drop_pct', 8),
                'possible_theft_drop_pct' => (float) config('fleet.fuel_possible_theft_drop_pct', 12),
                'refuel_increase_pct' => (float) config('fleet.fuel_refuel_increase_pct', 10),
                'abnormal_consumption_multiplier' => (float) config('fleet.fuel_abnormal_consumption_multiplier', 1.8),
            ],
        ];
    }

    private function mapRow(Alert $alert): array
    {
        return [
            'id' => $alert->id,
            'type' => $alert->type?->value,
            'severity' => $alert->severity,
            'message' => $alert->message,
            'triggered_at' => $alert->triggered_at?->toIso8601String(),
            'resolved_at' => $alert->resolved_at?->toIso8601String(),
            'resolved_by_user_id' => $alert->resolved_by_user_id,
            'resolved_by' => $alert->resolvedBy ? [
                'id' => $alert->resolvedBy->id,
                'name' => $alert->resolvedBy->name,
                'email' => $alert->resolvedBy->email,
            ] : null,
            'status' => $alert->resolved_at ? 'resolved' : 'active',
            'vehicle' => $alert->vehicle ? [
                'id' => $alert->vehicle->id,
                'name' => $alert->vehicle->name,
                'plate_number' => $alert->vehicle->plate_number,
            ] : null,
            'fuel_delta_pct' => $this->floatContextValue($alert, 'fuel_delta_pct'),
            'distance_delta_km' => $this->floatContextValue($alert, 'distance_delta_km'),
            'previous_fuel_level' => $this->floatContextValue($alert, 'previous_fuel_level'),
            'current_fuel_level' => $this->floatContextValue($alert, 'current_fuel_level'),
            'estimated_fuel_used_l' => $this->floatContextValue($alert, 'estimated_fuel_used_l'),
            'estimated_consumption_l_per_100km' => $this->floatContextValue($alert, 'estimated_consumption_l_per_100km'),
            'time_delta_minutes' => $this->floatContextValue($alert, 'time_delta_minutes'),
        ];
    }

    private function floatContextValue(Alert $alert, string $key): ?float
    {
        $value = data_get($alert->context, $key);

        return is_numeric($value) ? (float) $value : null;
    }

    /**
     * @return list<string>
     */
    private function fuelTypeValues(): array
    {
        return array_map(
            fn (AlertType $type) => $type->value,
            AlertType::fuelTypes(),
        );
    }

    private function severitySortExpression(): string
    {
        return "CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END";
    }

    private function escapeLike(string $value): string
    {
        return addcslashes($value, '\\%_');
    }
}
