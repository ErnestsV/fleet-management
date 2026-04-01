<?php

namespace Tests\Feature\Users;

use App\Domain\Companies\Models\Company;
use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use App\Notifications\AccountInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompanyUserInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_user_creation_sends_password_setup_email(): void
    {
        Notification::fake();

        $company = Company::factory()->create();
        $admin = User::factory()->create([
            'company_id' => $company->id,
            'role' => UserRole::Admin,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/users', [
            'name' => 'Dispatcher User',
            'email' => 'dispatcher@company.test',
            'role' => 'dispatcher',
            'timezone' => 'Europe/Riga',
            'is_active' => true,
        ])->assertCreated();

        $createdUser = User::query()->where('email', 'dispatcher@company.test')->firstOrFail();

        Notification::assertSentTo($createdUser, AccountInvitationNotification::class);
    }
}
