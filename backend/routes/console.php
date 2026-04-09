<?php

use Illuminate\Console\Scheduling\Schedule;

app(Schedule::class)->command('app:check-offline-vehicles')
    ->name('check-offline-vehicles')
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->onOneServer();

app(Schedule::class)->command('app:check-maintenance-schedules')
    ->name('check-maintenance-schedules')
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->onOneServer();

app(Schedule::class)->command('app:check-driver-licenses')
    ->name('check-driver-licenses')
    ->daily()
    ->withoutOverlapping(1440)
    ->onOneServer();

app(Schedule::class)->command('app:ensure-telemetry-partitions')
    ->name('ensure-telemetry-partitions')
    ->daily()
    ->withoutOverlapping(1440)
    ->onOneServer();
