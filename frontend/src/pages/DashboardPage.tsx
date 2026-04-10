import { PageHeader } from '@/components/ui/PageHeader';
import { ActivityChartsPanels } from '@/features/dashboard/components/ActivityPanels';
import { DashboardHeroStats } from '@/features/dashboard/components/DashboardHeroStats';
import { FleetStatusTablePanel } from '@/features/dashboard/components/FleetStatusTablePanel';
import { FleetRiskOverviewPanel, GeofenceAnalyticsPanel, OperationalGapsPanel, FuelAnomaliesPanel, TelemetryHealthPanel } from '@/features/dashboard/components/OperationsPanels';
import { DrivingBehaviourPanel, FleetEfficiencyPanel, FleetUtilizationPanel } from '@/features/dashboard/components/PerformancePanels';
import { FuelPanel, MileagePanel, WorkingTimePanel } from '@/features/dashboard/components/ResourcePanels';
import { useDashboardSummary } from '@/features/dashboard/useDashboardSummary';
import { useDashboardViewModel } from '@/features/dashboard/useDashboardViewModel';

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardSummary();
  const viewModel = useDashboardViewModel(data);

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        description="A richer operational overview with efficiency, behaviour, mileage, working time, map context, and live fleet analytics."
      />
      <DashboardHeroStats stats={viewModel.stats} />

      {isLoading ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading dashboard...</div> : null}
      {isError ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Failed to load dashboard data.</div> : null}
      {!isLoading && !isError && !data ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No dashboard data is available yet.</div> : null}

      {!isLoading && !isError && data ? (
        <>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <FleetEfficiencyPanel data={data.fleet_efficiency} />
            <DrivingBehaviourPanel data={data.driving_behaviour} />
          </div>

          <div className="mt-6">
            <FleetUtilizationPanel data={data.fleet_utilization} />
          </div>

          <div className="mt-6">
            <FleetRiskOverviewPanel data={data.fleet_risk} />
          </div>

          <div className="mt-6">
            <OperationalGapsPanel
              readinessItems={viewModel.readinessItems}
              totalFleetCount={viewModel.totalFleetCount}
              attentionVehicles={viewModel.attentionVehicles}
              visibleAttentionCount={viewModel.visibleAttentionCount}
              attentionPageSize={viewModel.attentionPageSize}
              onShowMore={() => viewModel.setVisibleAttentionCount((current) => current + viewModel.attentionPageSize)}
            />
          </div>

          <div className="mt-6">
            <TelemetryHealthPanel data={data.telemetry_health} />
          </div>

          <div className="mt-6">
            <GeofenceAnalyticsPanel data={data.geofence_analytics} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <MileagePanel data={data.mileage} />
            <WorkingTimePanel data={data.working_time} />
          </div>

          <div className="mt-6">
            <FuelPanel
              fuel={data.fuel}
              fuelTrendData={viewModel.fuelTrendData}
              fuelTrendSamples={viewModel.fuelTrendSamples}
              fuelChartMode={viewModel.fuelChartMode}
            />
          </div>

          <div className="mt-6">
            <FuelAnomaliesPanel data={data.fuel_anomalies} />
          </div>

          <ActivityChartsPanels
            alertsByType={data.alerts_by_type}
            tripsOverTime={data.trips_over_time}
            distanceByVehicle={data.distance_by_vehicle}
          />

          <div className="mt-6">
            <FleetStatusTablePanel
              rows={viewModel.fleetStatusRows}
              freshnessThresholds={data.telemetry_health.thresholds}
              lastPage={viewModel.fleetStatusLastPage}
              currentPage={viewModel.currentFleetStatusPage}
              pageNumbers={viewModel.fleetStatusPageNumbers}
              onPrevious={() => viewModel.setFleetStatusPage(Math.max(1, viewModel.currentFleetStatusPage - 1))}
              onNext={() => viewModel.setFleetStatusPage(Math.min(viewModel.fleetStatusLastPage, viewModel.currentFleetStatusPage + 1))}
              onPageSelect={viewModel.setFleetStatusPage}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
