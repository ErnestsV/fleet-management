import { useEffect, useState } from 'react';
import type { DashboardSummary } from '@/types/domain';

const DASHBOARD_ATTENTION_PAGE_SIZE = 3;
const FLEET_STATUS_PER_PAGE = 10;

export type DashboardReadinessItem = {
  label: string;
  count: number;
  tone: 'amber' | 'slate' | 'sky' | 'rose';
};

export type DashboardFuelChartMode = 'chart' | 'single-day' | 'empty';

export function useDashboardViewModel(data: DashboardSummary | undefined) {
  const [visibleAttentionCount, setVisibleAttentionCount] = useState(DASHBOARD_ATTENTION_PAGE_SIZE);
  const [fleetStatusPage, setFleetStatusPage] = useState(1);
  const fuel = data?.fuel;
  const fleet = data?.fleet ?? [];

  const stats = [
    { label: 'Total vehicles', value: String(data?.total_vehicles ?? 0), hint: 'Across selected scope' },
    { label: 'Moving now', value: String(data?.moving_vehicles ?? 0), hint: 'Live state materialized' },
    { label: 'Idling', value: String(data?.idling_vehicles ?? 0), hint: 'Threshold-aware' },
    { label: 'Active alerts', value: String(data?.active_alerts ?? 0), hint: 'Requires operator action, excluding geofence exits' },
  ];

  const fuelTrendSamples = fuel?.trend?.filter((entry) => (
    entry.estimated_consumption_l_per_100km != null || entry.estimated_fuel_used_l != null
  )) ?? [];
  const fuelTrendData = fuel?.trend ?? [];
  const fuelChartMode: DashboardFuelChartMode = fuelTrendSamples.length >= 2
    ? 'chart'
    : fuelTrendSamples.length === 1
      ? 'single-day'
      : 'empty';

  const vehiclesWithoutDriver = fleet.filter((vehicle) => !vehicle.driver);
  const vehiclesWithoutTelemetry = fleet.filter((vehicle) => !vehicle.last_event_at);
  const vehiclesWithUnknownStatus = fleet.filter((vehicle) => !vehicle.status || vehicle.status === 'unknown');
  const lowFuelVehicles = fleet.filter((vehicle) => typeof vehicle.fuel_level === 'number' && vehicle.fuel_level <= 20);

  const readinessItems: DashboardReadinessItem[] = [
    { label: 'Without driver', count: vehiclesWithoutDriver.length, tone: 'amber' },
    { label: 'Without telemetry', count: vehiclesWithoutTelemetry.length, tone: 'slate' },
    { label: 'Unknown status', count: vehiclesWithUnknownStatus.length, tone: 'sky' },
    { label: 'Low fuel', count: lowFuelVehicles.length, tone: 'rose' },
  ];

  const attentionVehicles = Array.from(new Map(
    [
      ...lowFuelVehicles,
      ...vehiclesWithoutTelemetry,
      ...vehiclesWithoutDriver,
      ...vehiclesWithUnknownStatus,
    ].map((vehicle) => [vehicle.id, vehicle]),
  ).values());

  const totalFleetCount = Math.max(fleet.length, 1);
  const statusPriority: Record<string, number> = {
    moving: 0,
    idling: 1,
    stopped: 2,
    offline: 3,
    unknown: 4,
  };

  const sortedFleet = [...fleet].sort((left, right) => {
    const leftStatus = left.status ?? 'unknown';
    const rightStatus = right.status ?? 'unknown';
    const byStatus = (statusPriority[leftStatus] ?? 99) - (statusPriority[rightStatus] ?? 99);

    if (byStatus !== 0) {
      return byStatus;
    }

    const leftLastEvent = left.last_event_at ? new Date(left.last_event_at).getTime() : 0;
    const rightLastEvent = right.last_event_at ? new Date(right.last_event_at).getTime() : 0;

    return rightLastEvent - leftLastEvent;
  });

  const fleetStatusLastPage = Math.max(1, Math.ceil(sortedFleet.length / FLEET_STATUS_PER_PAGE));
  const currentFleetStatusPage = Math.min(Math.max(1, fleetStatusPage), fleetStatusLastPage);
  const fleetStatusRows = sortedFleet.slice(
    (currentFleetStatusPage - 1) * FLEET_STATUS_PER_PAGE,
    currentFleetStatusPage * FLEET_STATUS_PER_PAGE,
  );
  const fleetStatusPageNumbers = Array.from({ length: fleetStatusLastPage }, (_, index) => index + 1);

  useEffect(() => {
    setFleetStatusPage((current) => Math.min(Math.max(1, current), fleetStatusLastPage));
  }, [fleetStatusLastPage]);

  return {
    stats,
    fuelTrendData,
    fuelTrendSamples,
    fuelChartMode,
    readinessItems,
    attentionVehicles,
    totalFleetCount,
    visibleAttentionCount,
    setVisibleAttentionCount,
    attentionPageSize: DASHBOARD_ATTENTION_PAGE_SIZE,
    sortedFleet,
    fleetStatusLastPage,
    currentFleetStatusPage,
    fleetStatusRows,
    fleetStatusPageNumbers,
    setFleetStatusPage,
  };
}
