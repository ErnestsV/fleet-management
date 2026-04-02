<?php

namespace Tests\Feature\Companies;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use App\Notifications\AccountInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompanyInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_company_creation_sends_password_setup_email_to_owner(): void
    {
        Notification::fake();

        $superAdmin = User::factory()->create([
            'role' => UserRole::SuperAdmin,
            'company_id' => null,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->postJson('/api/v1/companies', [
            'name' => 'Acme Logistics',
            'timezone' => 'Europe/Riga',
            'is_active' => true,
            'owner' => [
                'name' => 'Acme Owner',
                'email' => 'owner@acme.test',
                'role' => 'owner',
            ],
        ])->assertCreated();

        $owner = User::query()->where('email', 'owner@acme.test')->firstOrFail();

        Notification::assertSentTo($owner, AccountInvitationNotification::class);
    }
}
