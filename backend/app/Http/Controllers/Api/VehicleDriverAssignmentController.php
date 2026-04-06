<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Models\VehicleDriverAssignment;
use App\Domain\Fleet\Services\VehicleDriverAssignmentService;
use App\Http\Controllers\Controller;
use App\Http\Requests\EndVehicleDriverAssignmentRequest;
use App\Http\Requests\StoreVehicleDriverAssignmentRequest;
use App\Http\Resources\VehicleDriverAssignmentResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

class VehicleDriverAssignmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', VehicleDriverAssignment::class);

        $query = VehicleDriverAssignment::query()
            ->with(['vehicle', 'driver'])
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->when($request->integer('vehicle_id'), fn ($builder, $vehicleId) => $builder->where('vehicle_id', $vehicleId))
            ->when($request->integer('driver_id'), fn ($builder, $driverId) => $builder->where('driver_id', $driverId))
            ->latest('assigned_from');

        return VehicleDriverAssignmentResource::collection($query->paginate());
    }

    public function store(StoreVehicleDriverAssignmentRequest $request, VehicleDriverAssignmentService $service): VehicleDriverAssignmentResource
    {
        $this->authorize('create', VehicleDriverAssignment::class);

        $vehicle = Vehicle::query()
            ->when(
                ! $request->user()->isSuperAdmin(),
                fn ($query) => $query->where('company_id', $request->user()->company_id)
            )
            ->findOrFail($request->integer('vehicle_id'));
        $driver = Driver::query()
            ->when(
                ! $request->user()->isSuperAdmin(),
                fn ($query) => $query->where('company_id', $request->user()->company_id)
            )
            ->findOrFail($request->integer('driver_id'));

        $assignment = $service->assign($vehicle, $driver, $request->validated());

        Log::channel('audit')->info('Vehicle driver assignment created.', [
            'assignment_id' => $assignment->id,
            'company_id' => $assignment->company_id,
            'vehicle_id' => $assignment->vehicle_id,
            'driver_id' => $assignment->driver_id,
            'assigned_from' => $assignment->assigned_from?->toIso8601String(),
            'assigned_by_user_id' => $request->user()->id,
        ]);

        return new VehicleDriverAssignmentResource($assignment->load(['vehicle', 'driver']));
    }

    public function end(EndVehicleDriverAssignmentRequest $request, VehicleDriverAssignment $vehicleDriverAssignment, VehicleDriverAssignmentService $service): VehicleDriverAssignmentResource
    {
        $this->authorize('update', $vehicleDriverAssignment);

        $assignment = $service->end($vehicleDriverAssignment, $request->string('assigned_until')->toString())->load(['vehicle', 'driver']);

        Log::channel('audit')->info('Vehicle driver assignment ended.', [
            'assignment_id' => $assignment->id,
            'company_id' => $assignment->company_id,
            'vehicle_id' => $assignment->vehicle_id,
            'driver_id' => $assignment->driver_id,
            'assigned_until' => $assignment->assigned_until?->toIso8601String(),
            'ended_by_user_id' => $request->user()->id,
        ]);

        return new VehicleDriverAssignmentResource($assignment);
    }
}
