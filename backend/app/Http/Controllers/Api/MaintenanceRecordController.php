<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Maintenance\Models\MaintenanceRecord;
use App\Domain\Maintenance\Services\MaintenanceService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaintenanceRecordRequest;
use App\Http\Requests\UpdateMaintenanceRecordRequest;
use App\Http\Resources\MaintenanceRecordResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MaintenanceRecordController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', MaintenanceRecord::class);

        $query = MaintenanceRecord::query()
            ->with('vehicle')
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->when($request->integer('vehicle_id'), fn ($builder, $vehicleId) => $builder->where('vehicle_id', $vehicleId))
            ->latest('service_date');

        return MaintenanceRecordResource::collection($query->paginate());
    }

    public function store(StoreMaintenanceRecordRequest $request, MaintenanceService $service): MaintenanceRecordResource
    {
        $this->authorize('create', MaintenanceRecord::class);

        $vehicle = Vehicle::findOrFail($request->integer('vehicle_id'));

        $payload = [
            ...$request->validated(),
            'company_id' => $request->user()->isSuperAdmin()
                ? ($request->input('company_id') ?: $vehicle->company_id)
                : $request->user()->company_id,
        ];

        return new MaintenanceRecordResource($service->createRecord($payload)->load('vehicle'));
    }

    public function update(UpdateMaintenanceRecordRequest $request, MaintenanceRecord $maintenanceRecord, MaintenanceService $service): MaintenanceRecordResource
    {
        $this->authorize('update', $maintenanceRecord);

        return new MaintenanceRecordResource($service->updateRecord($maintenanceRecord, $request->validated())->load('vehicle'));
    }

    public function destroy(Request $request, MaintenanceRecord $maintenanceRecord): Response
    {
        $this->authorize('delete', $maintenanceRecord);

        $maintenanceRecord->delete();

        return response()->noContent();
    }
}
