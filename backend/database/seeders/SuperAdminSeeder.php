<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@fleetos.test'],
            [
                'name' => 'Platform Super Admin',
                'company_id' => null,
                'role' => UserRole::SuperAdmin,
                'timezone' => 'Europe/Riga',
                'is_active' => true,
                'password' => Hash::make('password'),
            ]
        );
    }
}
