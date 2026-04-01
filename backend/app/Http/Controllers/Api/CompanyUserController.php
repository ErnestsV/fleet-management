<?php

namespace App\Http\Controllers\Api;

use App\Domain\Fleet\Services\CompanyUserService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompanyUserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()
            ->when(! $request->user()->isSuperAdmin(), fn ($builder) => $builder->where('company_id', $request->user()->company_id))
            ->latest();

        return UserResource::collection($query->paginate());
    }

    public function store(StoreUserRequest $request, CompanyUserService $service): UserResource
    {
        return new UserResource($service->create($request->user(), $request->validated()));
    }

    public function update(UpdateUserRequest $request, User $user, CompanyUserService $service): UserResource
    {
        $this->authorize('update', $user);

        return new UserResource($service->update($request->user(), $user, $request->validated()));
    }
}
