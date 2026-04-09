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

    public function canAccessFleetData(): bool
    {
        return in_array($this, [self::Owner, self::Admin, self::Dispatcher, self::Viewer], true);
    }

    public function canManageFleetData(): bool
    {
        return in_array($this, [self::Owner, self::Admin, self::Dispatcher], true);
    }

    public function canManageUsers(): bool
    {
        return in_array($this, [self::Owner, self::Admin], true);
    }
}
