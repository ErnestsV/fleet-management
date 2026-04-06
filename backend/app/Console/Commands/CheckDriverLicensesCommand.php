<?php

namespace App\Console\Commands;

use App\Domain\Alerts\Enums\AlertType;
use App\Domain\Alerts\Models\Alert;
use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Fleet\Models\Driver;
use Illuminate\Console\Command;

class CheckDriverLicensesCommand extends Command
{
    protected $signature = 'app:check-driver-licenses';

    protected $description = 'Raise alerts for drivers with expired licenses.';

    public function handle(AlertEvaluationService $service): int
    {
        $staleAlertDriverIds = Alert::query()
            ->where('type', AlertType::DriverLicenseExpired)
            ->whereNull('resolved_at')
            ->cursor()
            ->pluck('context.driver_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        Driver::withTrashed()
            ->where(function ($query) use ($staleAlertDriverIds) {
                $query->where(function ($driverQuery) {
                    $driverQuery
                        ->where('is_active', true)
                        ->whereNotNull('license_expires_at');
                });

                if ($staleAlertDriverIds->isNotEmpty()) {
                    $query->orWhereIn('id', $staleAlertDriverIds->all());
                }
            })
            ->chunkById(200, function ($drivers) use ($service): void {
                $drivers->each(fn (Driver $driver) => $service->evaluateDriverLicense($driver));
            });

        $this->info('Driver license check complete.');

        return self::SUCCESS;
    }
}
