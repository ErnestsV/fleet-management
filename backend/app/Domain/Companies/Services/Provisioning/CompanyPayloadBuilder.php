<?php

namespace App\Domain\Companies\Services\Provisioning;

use App\Domain\Companies\Models\Company;
use Illuminate\Support\Str;

class CompanyPayloadBuilder
{
    private function normalizeSettings(?array $settings, ?Company $company = null): array
    {
        /** @var array<string, mixed>|null $companySettings */
        $companySettings = $company?->getAttribute('settings');

        $baseSettings = is_array($companySettings) ? $companySettings : [];
        $incomingSettings = is_array($settings) ? $settings : [];
        $incomingThreshold = $incomingSettings['speed_alert_threshold_kmh'] ?? null;

        return [
            ...$baseSettings,
            ...$incomingSettings,
            'speed_alert_threshold_kmh' => (float) (
                $incomingThreshold
                ?? $company?->speedAlertThresholdKmh()
                ?? config('fleet.speed_alert_threshold_kmh', 90)
            ),
        ];
    }

    public function buildCreatePayload(array $companyData): array
    {
        return [
            ...$companyData,
            'settings' => $this->normalizeSettings($companyData['settings'] ?? null),
            'slug' => $companyData['slug'] ?? Str::slug($companyData['name']).'-'.Str::lower(Str::random(5)),
        ];
    }

    public function buildUpdatePayload(Company $company, array $data): array
    {
        return [
            'name' => $data['name'],
            'slug' => $data['slug'] ?? $company->slug,
            'timezone' => $data['timezone'] ?? $company->timezone,
            'settings' => $this->normalizeSettings($data['settings'] ?? null, $company),
            'is_active' => $data['is_active'] ?? $company->is_active,
        ];
    }
}
