<?php

namespace App\Http\Controllers\Api;

use App\Domain\Alerts\Models\Alert;
use App\Domain\Fleet\Services\Dashboard\DashboardQueryFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\AlertIndexRequest;
use App\Http\Resources\AlertResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AlertController extends Controller
{
    public function __construct(
        private readonly DashboardQueryFactory $dashboardQueryFactory,
    ) {
    }

    public function index(AlertIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Alert::class);

        $sort = $request->validated('sort', '-triggered_at');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');

        $query = Alert::query()
            ->with(['vehicle', 'rule'])
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->when(
                $request->boolean('exclude_geofence_exit'),
                fn ($builder) => $builder->where('type', '!=', 'geofence_exit')
            )
            ->when(
                $request->boolean('exclude_informational'),
                fn ($builder) => $builder->whereNotIn('type', array_map(
                    fn ($type) => $type->value,
                    $this->dashboardQueryFactory->informationalAlertTypes(),
                ))
            )
            ->when($request->string('type')->toString(), fn ($builder, $type) => $builder->where('type', $type))
            ->when($request->string('status')->toString(), function ($builder, $status) {
                if ($status === 'active') {
                    $builder->whereNull('resolved_at');
                }

                if ($status === 'resolved') {
                    $builder->whereNotNull('resolved_at');
                }
            })
            ->when($request->integer('vehicle_id'), fn ($builder, $vehicleId) => $builder->where('vehicle_id', $vehicleId))
            ->orderBy($column, $direction);

        return AlertResource::collection($query->paginate($request->integer('per_page', 10)));
    }

    public function resolve(Alert $alert): JsonResponse
    {
        $this->authorize('resolve', $alert);

        if (! $alert->resolved_at) {
            $alert->forceFill(['resolved_at' => now()])->save();
        }

        return response()->json([
            'message' => 'Alert resolved successfully.',
            'data' => (new AlertResource($alert->fresh(['vehicle', 'rule'])))->resolve(),
        ]);
    }
}
