<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Artisan;

app(Schedule::class)->command('app:check-offline-vehicles')->everyFiveMinutes();
app(Schedule::class)->command('app:check-maintenance-schedules')->everyFiveMinutes();
