<?php

namespace Tests\Feature\Users;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompanyUserCreationPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_viewer_cannot_create_users(): void
    {
        $viewer = User::factory()->create(['role' => UserRole::Viewer]);
        Sanctum::actingAs($viewer);

        $this->postJson('/api/v1/users', [
            'name' => 'Blocked User',
            'email' => 'blocked@example.com',
            'role' => 'viewer',
        ])->assertForbidden();
    }
}
