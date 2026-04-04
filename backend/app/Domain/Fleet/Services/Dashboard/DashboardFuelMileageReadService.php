<?php

namespace App\Domain\Fleet\Services\Dashboard;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardFuelMileageReadService
{
    public function __construct(
        private readonly DashboardQueryFactory $queryFactory,
    ) {
    }

    public function buildMileageAndFuelMetrics(
        ?int $companyId,
        User $user,
        Carbon $today,
        Carbon $yesterday,
        Carbon $windowStart,
        float $estimatedTankCapacityLiters,
        float $expectedFuelConsumptionPer100Km,
    ): array {
        $windowEnd = $today->copy()->endOfDay();

        $dailyTelemetryRows = DB::query()
            ->fromSub(
                $this->queryFactory->telemetryQuery($companyId, $user)
                    ->selectRaw("DATE(occurred_at) as day")
                    ->selectRaw('vehicle_id')
                    ->selectRaw('odometer_km')
                    ->selectRaw('fuel_level')
                    ->selectRaw('LAG(fuel_level) OVER (PARTITION BY DATE(occurred_at), vehicle_id ORDER BY occurred_at) as previous_fuel_level')
                    ->whereBetween('occurred_at', [$windowStart->copy()->startOfDay(), $windowEnd])
                    ->whereNotNull('odometer_km')
                    ->whereNotNull('fuel_level'),
                'daily_telemetry'
            )
            ->selectRaw('day')
            ->selectRaw('vehicle_id')
            ->selectRaw('COUNT(*) as sample_count')
            ->selectRaw('AVG(fuel_level) as avg_fuel_level_pct')
            ->selectRaw('MAX(odometer_km) - MIN(odometer_km) as distance_km')
            ->selectRaw('SUM(CASE WHEN previous_fuel_level IS NOT NULL AND fuel_level < previous_fuel_level THEN previous_fuel_level - fuel_level ELSE 0 END) as fuel_drop_pct')
            ->groupBy('day', 'vehicle_id')
            ->get()
            ->groupBy('day');

        $distanceToday = $this->sumSampledDistanceForDay($dailyTelemetryRows, $today);
        $distanceYesterday = $this->sumSampledDistanceForDay($dailyTelemetryRows, $yesterday);
        $distancePreviousDay = $this->sumSampledDistanceForDay($dailyTelemetryRows, $yesterday->copy()->subDay());

        $fuelTrend = collect(range(0, 6))
            ->map(fn (int $offset) => $windowStart->copy()->addDays($offset))
            ->map(function (Carbon $day) use ($dailyTelemetryRows, $estimatedTankCapacityLiters) {
                $dayRows = collect($dailyTelemetryRows->get($day->toDateString(), []))
                    ->filter(fn ($row) => (int) $row->sample_count >= 2)
                    ->values();

                if ($dayRows->isEmpty()) {
                    return [
                        'day' => $day->toDateString(),
                        'avg_fuel_level_pct' => null,
                        'distance_km' => null,
                        'estimated_fuel_used_l' => null,
                        'estimated_consumption_l_per_100km' => null,
                    ];
                }

                $avgFuelLevelPct = (float) ($dayRows->avg('avg_fuel_level_pct') ?? 0);
                $totalDistanceKm = (float) $dayRows->sum(fn ($row) => max(0, (float) $row->distance_km));
                $totalFuelUsedLiters = (float) $dayRows->sum(
                    fn ($row) => (((float) $row->fuel_drop_pct) / 100) * $estimatedTankCapacityLiters
                );

                return [
                    'day' => $day->toDateString(),
                    'avg_fuel_level_pct' => round($avgFuelLevelPct, 1),
                    'distance_km' => round($totalDistanceKm, 1),
                    'estimated_fuel_used_l' => round($totalFuelUsedLiters, 1),
                    'estimated_consumption_l_per_100km' => $totalDistanceKm > 0
                        ? round(($totalFuelUsedLiters / $totalDistanceKm) * 100, 1)
                        : null,
                ];
            })
            ->values();

        $fuelYesterday = $fuelTrend->firstWhere('day', $yesterday->toDateString());
        $fuelPreviousDay = $fuelTrend->firstWhere('day', $yesterday->copy()->subDay()->toDateString());

        return [
            'distance_today_km' => round($distanceToday, 1),
            'mileage' => [
                'yesterday_distance_km' => round($distanceYesterday, 1),
                'previous_distance_km' => round($distancePreviousDay, 1),
                'delta_pct' => $distancePreviousDay > 0
                    ? round((($distanceYesterday - $distancePreviousDay) / $distancePreviousDay) * 100, 1)
                    : null,
            ],
            'fuel' => [
                'trend' => $fuelTrend,
                'estimated_fuel_used_yesterday_l' => $fuelYesterday['estimated_fuel_used_l'] ?? null,
                'estimated_fuel_used_previous_day_l' => $fuelPreviousDay['estimated_fuel_used_l'] ?? null,
                'estimated_avg_consumption_yesterday_l_per_100km' => $fuelYesterday['estimated_consumption_l_per_100km'] ?? null,
                'estimated_avg_consumption_previous_day_l_per_100km' => $fuelPreviousDay['estimated_consumption_l_per_100km'] ?? null,
                'average_fuel_level_yesterday_pct' => $fuelYesterday['avg_fuel_level_pct'] ?? null,
                'expected_consumption_l_per_100km' => $expectedFuelConsumptionPer100Km,
                'delta_used_pct' => ($fuelPreviousDay['estimated_fuel_used_l'] ?? 0) > 0 && ($fuelYesterday['estimated_fuel_used_l'] ?? null) !== null
                    ? round((((float) $fuelYesterday['estimated_fuel_used_l'] - (float) $fuelPreviousDay['estimated_fuel_used_l']) / (float) $fuelPreviousDay['estimated_fuel_used_l']) * 100, 1)
                    : null,
            ],
        ];
    }

    private function sumSampledDistanceForDay($dailyTelemetryRows, Carbon $day): float
    {
        return (float) collect($dailyTelemetryRows->get($day->toDateString(), []))
            ->filter(fn ($row) => (int) $row->sample_count >= 2)
            ->sum(fn ($row) => max(0, (float) $row->distance_km));
    }
}
