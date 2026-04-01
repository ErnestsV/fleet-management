<?php

namespace App\Console\Commands;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdminCommand extends Command
{
    protected $signature = 'app:create-super-admin';

    protected $description = 'Create a platform super admin user.';

    public function handle(): int
    {
        $name = $this->ask('Name');
        $email = $this->ask('Email');
        $password = $this->secret('Password');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'role' => UserRole::SuperAdmin,
                'password' => Hash::make($password),
                'company_id' => null,
                'is_active' => true,
            ]
        );

        $this->info('Super admin created.');

        return self::SUCCESS;
    }
}
