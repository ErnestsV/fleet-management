<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Trips\Models\Trip;
use App\Domain\Fleet\Services\VehicleService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Resources\VehicleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Vehicle::class);
        $request->validate([
            'search' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['moving', 'idling', 'stopped', 'offline', 'unknown'])],
            'distance_bucket' => ['nullable', 'string', Rule::in(['none', '1_50', '50_200', '200_plus'])],
        ]);
        $perPage = min(max((int) $request->integer('per_page', 10), 1), 100);
        $recentDistanceSubquery = Trip::query()
            ->selectRaw('vehicle_id, ROUND(SUM(distance_km), 1) as recent_distance_km')
            ->where('start_time', '>=', now()->subDays(7))
            ->when(
                ! $request->user()->isSuperAdmin(),
                fn ($query) => $query->where('company_id', $request->user()->company_id)
            )
            ->groupBy('vehicle_id');

        $query = Vehicle::query()
            ->leftJoinSub($recentDistanceSubquery, 'recent_trip_distance', function ($join) {
                $join->on('recent_trip_distance.vehicle_id', '=', 'vehicles.id');
            })
            ->select('vehicles.*')
            ->selectRaw('COALESCE(recent_trip_distance.recent_distance_km, 0) as recent_distance_km')
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
            ->when($request->string('status')->toString(), function ($builder, string $status) {
                if ($status === 'unknown') {
                    $builder->where(function ($inner) {
                        $inner->whereDoesntHave('state')
                            ->orWhereHas('state', fn ($stateQuery) => $stateQuery->whereNull('status'));
                    });

                    return;
                }

                $builder->whereHas('state', fn ($stateQuery) => $stateQuery->where('status', $status));
            })
            ->when($request->string('distance_bucket')->toString(), function ($builder, string $distanceBucket) {
                if ($distanceBucket === 'none') {
                    $builder->whereRaw('COALESCE(recent_trip_distance.recent_distance_km, 0) = 0');

                    return;
                }

                if ($distanceBucket === '1_50') {
                    $builder->whereRaw('COALESCE(recent_trip_distance.recent_distance_km, 0) > 0')
                        ->whereRaw('COALESCE(recent_trip_distance.recent_distance_km, 0) < 50');

                    return;
                }

                if ($distanceBucket === '50_200') {
                    $builder->whereRaw('COALESCE(recent_trip_distance.recent_distance_km, 0) >= 50')
                        ->whereRaw('COALESCE(recent_trip_distance.recent_distance_km, 0) < 200');

                    return;
                }

                $builder->whereRaw('COALESCE(recent_trip_distance.recent_distance_km, 0) >= 200');
            })
            ->when($request->filled('is_active'), fn ($builder) => $builder->where('is_active', $request->boolean('is_active')))
            ->latest('vehicles.created_at');

        return VehicleResource::collection($query->paginate($perPage));
    }

    public function store(StoreVehicleRequest $request, VehicleService $service): JsonResponse
    {
        $this->authorize('create', Vehicle::class);

        $result = $service->create($request->user(), $request->validated());

        return response()->json([
            'data' => (new VehicleResource($result->vehicle))->resolve(),
            'provisioning_token' => $result->plainToken,
        ], Response::HTTP_CREATED);
    }

    public function show(Request $request, Vehicle $vehicle): VehicleResource
    {
        $this->authorize('view', $vehicle);

        return new VehicleResource($vehicle->load(['state', 'assignments.driver', 'activeDeviceToken']));
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

    public function rotateDeviceToken(Request $request, Vehicle $vehicle, VehicleService $service): JsonResponse
    {
        $this->authorize('update', $vehicle);

        $result = $service->rotateDeviceToken($vehicle);

        Log::channel('audit')->info('Vehicle device token rotated.', [
            'vehicle_id' => $vehicle->id,
            'company_id' => $vehicle->company_id,
            'rotated_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'data' => (new VehicleResource($result->vehicle))->resolve(),
            'provisioning_token' => $result->plainToken,
        ]);
    }
}
