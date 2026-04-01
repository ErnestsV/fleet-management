<?php

namespace App\Http\Controllers\Api;

use App\Domain\Telemetry\Models\VehicleState;
use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleStateResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehicleStateController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', VehicleState::class);

        $query = VehicleState::query()
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id));

        return VehicleStateResource::collection($query->paginate());
    }
}
