<?php

namespace App\Domain\Ai\Contracts;

use App\Models\User;

interface AiCopilotTool
{
    public function definition(): array;

    public function execute(array $arguments, User $user): array;
}
