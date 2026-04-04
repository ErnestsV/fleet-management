<?php

namespace App\Http\Controllers\Api;

use App\Domain\Geofences\Models\Geofence;
use App\Domain\Geofences\Services\GeofenceService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGeofenceRequest;
use App\Http\Requests\UpdateGeofenceRequest;
use App\Http\Resources\GeofenceResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class GeofenceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Geofence::class);

        $query = Geofence::query()
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->latest();

        return GeofenceResource::collection($query->paginate());
    }

    public function store(StoreGeofenceRequest $request, GeofenceService $service): GeofenceResource
    {
        $this->authorize('create', Geofence::class);

        $payload = [
            ...$request->validated(),
            'company_id' => $request->user()->isSuperAdmin() ? $request->integer('company_id') : $request->user()->company_id,
        ];

        return new GeofenceResource($service->create($payload));
    }

    public function show(Request $request, Geofence $geofence): GeofenceResource
    {
        $this->authorize('view', $geofence);

        return new GeofenceResource($geofence);
    }

    public function update(UpdateGeofenceRequest $request, Geofence $geofence, GeofenceService $service): GeofenceResource
    {
        $this->authorize('update', $geofence);

        return new GeofenceResource($service->update($geofence, [
            ...$request->validated(),
            'company_id' => $geofence->company_id,
        ]));
    }

    public function destroy(Request $request, Geofence $geofence): Response
    {
        $this->authorize('delete', $geofence);

        $geofence->delete();

        return response()->noContent();
    }
}
