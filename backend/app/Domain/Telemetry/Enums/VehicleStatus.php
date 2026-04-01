<?php

namespace App\Domain\Telemetry\Enums;

enum VehicleStatus: string
{
    case Moving = 'moving';
    case Idling = 'idling';
    case Stopped = 'stopped';
    case Offline = 'offline';
}
