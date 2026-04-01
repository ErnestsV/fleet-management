<?php

namespace App\Domain\Shared\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Owner = 'owner';
    case Admin = 'admin';
    case Dispatcher = 'dispatcher';
    case Viewer = 'viewer';

    public function label(): string
    {
        return str($this->value)->replace('_', ' ')->title()->toString();
    }

    public function canManageUsers(): bool
    {
        return in_array($this, [self::SuperAdmin, self::Owner, self::Admin], true);
    }
}
