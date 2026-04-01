<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Vehicle;
use App\Domain\Trips\Models\Trip;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripFilterRequest;
use App\Http\Resources\TripResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TripController extends Controller
{
    public function index(StoreTripFilterRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Trip::class);

        $query = Trip::query()
            ->with('vehicle')
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->when($request->integer('vehicle_id'), fn ($builder, $vehicleId) => $builder->where('vehicle_id', $vehicleId))
            ->when($request->string('date_from')->toString(), fn ($builder, $dateFrom) => $builder->whereDate('start_time', '>=', $dateFrom))
            ->when($request->string('date_to')->toString(), fn ($builder, $dateTo) => $builder->whereDate('start_time', '<=', $dateTo))
            ->latest('start_time');

        return TripResource::collection($query->paginate());
    }

    public function show(Request $request, Trip $trip): TripResource
    {
        $this->authorize('view', $trip);

        return new TripResource($trip->load('vehicle'));
    }

    public function vehicleHistory(StoreTripFilterRequest $request, Vehicle $vehicle): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Trip::class);
        $this->authorize('view', $vehicle);

        $query = Trip::query()
            ->with('vehicle')
            ->where('vehicle_id', $vehicle->id)
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->latest('start_time');

        return TripResource::collection($query->paginate());
    }
}
