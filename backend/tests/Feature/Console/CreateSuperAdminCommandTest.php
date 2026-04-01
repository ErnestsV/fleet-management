<?php

namespace Tests\Feature\Console;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateSuperAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_creates_super_admin(): void
    {
        $this->artisan('app:create-super-admin')
            ->expectsQuestion('Name', 'Platform Root')
            ->expectsQuestion('Email', 'root@example.com')
            ->expectsQuestion('Password', 'password')
            ->expectsOutput('Super admin created.')
            ->assertSuccessful();

        $this->assertDatabaseHas('users', [
            'email' => 'root@example.com',
            'role' => 'super_admin',
        ]);
    }
}
