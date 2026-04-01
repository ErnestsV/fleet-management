<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Fleet\Services\VehicleService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Resources\VehicleResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class VehicleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Vehicle::class);

        $query = Vehicle::query()
            ->with(['state', 'assignments.driver'])
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->when($request->string('search')->toString(), function ($builder, $search) {
                $builder->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('plate_number', 'like', "%{$search}%")
                        ->orWhere('make', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('is_active'), fn ($builder) => $builder->where('is_active', $request->boolean('is_active')))
            ->latest();

        return VehicleResource::collection($query->paginate());
    }

    public function store(StoreVehicleRequest $request, VehicleService $service): VehicleResource
    {
        $this->authorize('create', Vehicle::class);

        $vehicle = $service->create($request->user(), $request->validated());

        return new VehicleResource($vehicle);
    }

    public function show(Request $request, Vehicle $vehicle): VehicleResource
    {
        $this->authorize('view', $vehicle);

        return new VehicleResource($vehicle->load(['state', 'assignments.driver']));
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle, VehicleService $service): VehicleResource
    {
        return new VehicleResource($service->update($vehicle, $request->validated()));
    }

    public function destroy(Vehicle $vehicle, VehicleService $service): Response
    {
        $this->authorize('delete', $vehicle);
        $service->deactivate($vehicle);

        return response()->noContent();
    }
}
