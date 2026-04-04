<?php

namespace App\Http\Controllers\Api;

use App\Domain\Alerts\Models\Alert;
use App\Http\Controllers\Controller;
use App\Http\Requests\AlertIndexRequest;
use App\Http\Resources\AlertResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AlertController extends Controller
{
    public function index(AlertIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Alert::class);

        $sort = $request->validated('sort', '-triggered_at');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');

        $query = Alert::query()
            ->with(['vehicle', 'rule'])
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
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
}
