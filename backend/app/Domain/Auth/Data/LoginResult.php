<?php

namespace App\Domain\Auth\Data;

use App\Models\User;

readonly class LoginResult
{
    public function __construct(
        public User $user,
        public string $token,
    ) {
    }
}
