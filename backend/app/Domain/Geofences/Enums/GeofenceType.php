<?php

namespace App\Domain\Geofences\Enums;

enum GeofenceType: string
{
    case Circle = 'circle';
    case Polygon = 'polygon';
}
