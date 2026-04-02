<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Maintenance\Models\MaintenanceSchedule;
use App\Domain\Maintenance\Services\MaintenanceService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaintenanceScheduleRequest;
use App\Http\Requests\UpdateMaintenanceScheduleRequest;
use App\Http\Resources\MaintenanceScheduleResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MaintenanceScheduleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', MaintenanceSchedule::class);

        $query = MaintenanceSchedule::query()
            ->with('vehicle')
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->when($request->integer('vehicle_id'), fn ($builder, $vehicleId) => $builder->where('vehicle_id', $vehicleId))
            ->latest();

        return MaintenanceScheduleResource::collection($query->paginate());
    }

    public function store(StoreMaintenanceScheduleRequest $request, MaintenanceService $service): MaintenanceScheduleResource
    {
        $this->authorize('create', MaintenanceSchedule::class);

        $vehicle = Vehicle::findOrFail($request->integer('vehicle_id'));

        $payload = [
            ...$request->validated(),
            'company_id' => $request->user()->isSuperAdmin()
                ? ($request->input('company_id') ?: $vehicle->company_id)
                : $request->user()->company_id,
        ];

        return new MaintenanceScheduleResource($service->createSchedule($payload)->load('vehicle'));
    }

    public function update(UpdateMaintenanceScheduleRequest $request, MaintenanceSchedule $maintenanceSchedule, MaintenanceService $service): MaintenanceScheduleResource
    {
        $this->authorize('update', $maintenanceSchedule);

        return new MaintenanceScheduleResource($service->updateSchedule($maintenanceSchedule, $request->validated())->load('vehicle'));
    }

    public function destroy(Request $request, MaintenanceSchedule $maintenanceSchedule): Response
    {
        $this->authorize('delete', $maintenanceSchedule);

        $maintenanceSchedule->delete();

        return response()->noContent();
    }

    public function upcoming(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', MaintenanceSchedule::class);

        $query = MaintenanceSchedule::query()
            ->with('vehicle')
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->where('is_active', true)
            ->where(function ($builder) {
                $builder->whereDate('next_due_date', '<=', now()->addDays(30))
                    ->orWhereHas('vehicle.state', function ($stateBuilder) {
                        $stateBuilder
                            ->whereNotNull('odometer_km')
                            ->whereColumn('vehicle_states.odometer_km', '>=', 'maintenance_schedules.next_due_odometer_km');
                    });
            })
            ->orderBy('next_due_date');

        return MaintenanceScheduleResource::collection($query->paginate());
    }
}
