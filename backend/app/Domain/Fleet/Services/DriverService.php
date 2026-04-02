<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Alerts\Services\AlertEvaluationService;
use App\Domain\Fleet\Models\Driver;
use App\Models\User;

class DriverService
{
    public function __construct(
        private readonly AlertEvaluationService $alertEvaluationService,
    ) {
    }

    public function create(User $actor, array $data): Driver
    {
        $companyId = $actor->isSuperAdmin()
            ? $data['company_id']
            : $actor->company_id;

        $driver = Driver::create([
            ...$data,
            'company_id' => $companyId,
        ]);

        $this->alertEvaluationService->evaluateDriverLicense($driver);

        return $driver;
    }

    public function update(Driver $driver, array $data): Driver
    {
        $driver->update($data);

        $this->alertEvaluationService->evaluateDriverLicense($driver);

        return $driver->refresh();
    }

    public function deactivate(Driver $driver): void
    {
        $this->alertEvaluationService->resolveDriverLicenseAlerts($driver);
        $driver->update(['is_active' => false]);
        $driver->delete();
    }
}
