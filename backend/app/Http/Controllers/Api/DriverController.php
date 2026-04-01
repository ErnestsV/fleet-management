<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Models\Driver;
use App\Domain\Fleet\Services\DriverService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDriverRequest;
use App\Http\Requests\UpdateDriverRequest;
use App\Http\Resources\DriverResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class DriverController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Driver::class);

        $query = Driver::query()
            ->with(['assignments.vehicle'])
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->when($request->string('search')->toString(), function ($builder, $search) {
                $builder->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('license_number', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('is_active'), fn ($builder) => $builder->where('is_active', $request->boolean('is_active')))
            ->latest();

        return DriverResource::collection($query->paginate());
    }

    public function store(StoreDriverRequest $request, DriverService $service): DriverResource
    {
        $this->authorize('create', Driver::class);

        $driver = $service->create($request->user(), $request->validated());

        return new DriverResource($driver);
    }

    public function show(Request $request, Driver $driver): DriverResource
    {
        $this->authorize('view', $driver);

        return new DriverResource($driver->load(['assignments.vehicle']));
    }

    public function update(UpdateDriverRequest $request, Driver $driver, DriverService $service): DriverResource
    {
        return new DriverResource($service->update($driver, $request->validated()));
    }

    public function destroy(Driver $driver, DriverService $service): Response
    {
        $this->authorize('delete', $driver);
        $service->deactivate($driver);

        return response()->noContent();
    }
}
