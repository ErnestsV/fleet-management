<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes([
    'middleware' => ['auth:sanctum', 'active.account'],
]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('company.{companyId}', function (User $user, int $companyId): bool {
    return ! $user->isSuperAdmin()
        && $user->company_id === $companyId;
});
