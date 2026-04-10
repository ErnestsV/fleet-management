<?php

namespace App\Domain\Realtime\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanyFleetUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  list<string>  $topics
     */
    public function __construct(
        public readonly int $companyId,
        public readonly array $topics,
        public readonly string $reason,
        public readonly ?int $vehicleId = null,
    ) {
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("company.{$this->companyId}");
    }

    public function broadcastAs(): string
    {
        return 'fleet.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'company_id' => $this->companyId,
            'vehicle_id' => $this->vehicleId,
            'reason' => $this->reason,
            'topics' => $this->topics,
            'broadcasted_at' => now()->toIso8601String(),
        ];
    }
}
