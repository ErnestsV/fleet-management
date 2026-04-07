<?php

namespace App\Domain\Ai\Services;

use App\Models\User;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class AiCopilotService
{
    private const MAX_TOOL_ROUNDS = 3;

    public function __construct(
        private readonly AiToolRegistry $toolRegistry,
    ) {
    }

    public function respond(User $user, string $context, string $message, array $history = []): array
    {
        $apiKey = (string) config('services.openai.api_key');

        if ($apiKey === '') {
            return [
                'message' => 'AI copilot is not configured yet. Add OPENAI_API_KEY to enable it.',
                'meta' => [
                    'configured' => false,
                    'model' => config('services.openai.model'),
                    'context' => $context,
                ],
            ];
        }

        $conversation = [
            ...$this->buildConversationHistory($history),
            $this->messageItem('user', $message),
        ];

        $response = null;

        try {
            for ($round = 0; $round < self::MAX_TOOL_ROUNDS; $round++) {
                $response = $this->sendResponseRequest($conversation, $context);
                $toolOutputs = $this->buildToolOutputs($response, $user, $context);

                if ($toolOutputs === []) {
                    return [
                        'message' => $this->extractOutputText($response),
                        'meta' => [
                            'configured' => true,
                            'model' => (string) config('services.openai.model'),
                            'tool_calls' => $this->toolCallCount($response),
                            'context' => $context,
                        ],
                    ];
                }

                $conversation = [
                    ...$conversation,
                    ...Arr::get($response, 'output', []),
                    ...$toolOutputs,
                ];
            }
        } catch (RequestException $exception) {
            Log::channel('operations')->warning('AI copilot request failed.', [
                'user_id' => $user->id,
                'company_id' => $user->company_id,
                'status' => $exception->response?->status(),
                'message' => $exception->getMessage(),
            ]);

            return [
                'message' => 'The AI copilot is temporarily unavailable. Please try again in a moment.',
                'meta' => [
                    'configured' => true,
                    'model' => (string) config('services.openai.model'),
                    'context' => $context,
                ],
            ];
        } catch (Throwable $exception) {
            Log::channel('operations')->error('AI copilot execution failed.', [
                'user_id' => $user->id,
                'company_id' => $user->company_id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return [
                'message' => 'The AI copilot could not complete that request safely. Please rephrase and try again.',
                'meta' => [
                    'configured' => true,
                    'model' => (string) config('services.openai.model'),
                    'context' => $context,
                ],
            ];
        }

        Log::channel('operations')->warning('AI copilot exhausted tool rounds.', [
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'model' => (string) config('services.openai.model'),
        ]);

        return [
            'message' => $response ? $this->extractOutputText($response) : 'The AI copilot could not finish that answer. Please try again.',
            'meta' => [
                'configured' => true,
                'model' => (string) config('services.openai.model'),
                'context' => $context,
            ],
        ];
    }

    private function sendResponseRequest(array $input, string $context): array
    {
        $timeoutSeconds = max(1, (int) config('services.openai.timeout', 25));

        $response = Http::withToken((string) config('services.openai.api_key'))
            ->baseUrl(rtrim((string) config('services.openai.base_url'), '/'))
            ->timeout($timeoutSeconds)
            ->acceptJson()
            ->post('/responses', [
                'model' => (string) config('services.openai.model'),
                'store' => false,
                'instructions' => $this->instructions($context),
                'input' => $input,
                'tools' => $this->toolRegistry->definitions($context),
            ])
            ->throw()
            ->json();

        if (! is_array($response)) {
            throw new RuntimeException('Unexpected OpenAI response payload.');
        }

        return $response;
    }

    private function buildConversationHistory(array $history): array
    {
        return collect($history)
            ->take(-8)
            ->map(fn (array $item) => $this->messageItem(
                role: (string) ($item['role'] ?? 'user'),
                content: (string) ($item['content'] ?? ''),
            ))
            ->filter(fn (array $item) => trim((string) data_get($item, 'content.0.text', '')) !== '')
            ->values()
            ->all();
    }

    private function messageItem(string $role, string $content): array
    {
        $contentType = $role === 'assistant' ? 'output_text' : 'input_text';

        return [
            'role' => $role,
            'content' => [
                [
                    'type' => $contentType,
                    'text' => trim($content),
                ],
            ],
        ];
    }

    private function instructions(string $context): string
    {
        $pageContextInstruction = match ($context) {
            \App\Domain\Ai\Support\AiCopilotContext::DASHBOARD => 'The user is on the operations dashboard. Focus on fleet-wide KPIs, risk, alerts, and prioritization.',
            \App\Domain\Ai\Support\AiCopilotContext::DRIVER_INSIGHTS => 'The user is on the driver insights page. Focus on score interpretation, coaching candidates, leaders, and trends.',
            \App\Domain\Ai\Support\AiCopilotContext::FUEL_INSIGHTS => 'The user is on the fuel insights page. Focus on anomaly types, suspicious vehicles, thresholds, and follow-up signals.',
            \App\Domain\Ai\Support\AiCopilotContext::TELEMETRY_HEALTH => 'The user is on the telemetry health page. Focus on freshness, missing data, device health, and urgent telemetry follow-up.',
            \App\Domain\Ai\Support\AiCopilotContext::GEOFENCE_ANALYTICS => 'The user is on the geofence analytics page. Focus on entries, exits, visits, dwell time, and active locations.',
            default => 'Stay within the current analytics context.',
        };

        return implode("\n", [
            'You are FleetOS Copilot, a read-only fleet analytics assistant.',
            $pageContextInstruction,
            'Only answer using facts grounded in tool outputs from this request.',
            'If the request is outside the current page analytics scope, say so briefly and redirect to supported questions for this page.',
            'Never invent counts, rankings, reasons, or dates.',
            'Do not provide legal, compliance, or mechanical advice beyond the supplied analytics data.',
            'Keep responses concise, operational, and specific.',
            'When useful, prioritize top risks, changes, and follow-up actions.',
        ]);
    }

    private function buildToolOutputs(array $response, User $user, string $context): array
    {
        $toolOutputs = [];

        foreach (Arr::get($response, 'output', []) as $item) {
            if (($item['type'] ?? null) !== 'function_call') {
                continue;
            }

            $name = (string) ($item['name'] ?? '');
            $arguments = json_decode((string) ($item['arguments'] ?? '{}'), true);

            if (! is_array($arguments)) {
                $arguments = [];
            }

            $result = $this->toolRegistry->tool($name, $context)->execute($arguments, $user);

            $toolOutputs[] = [
                'type' => 'function_call_output',
                'call_id' => $item['call_id'] ?? null,
                'output' => json_encode($result, JSON_THROW_ON_ERROR),
            ];
        }

        return $toolOutputs;
    }

    private function extractOutputText(array $response): string
    {
        $outputText = trim((string) Arr::get($response, 'output_text', ''));

        if ($outputText !== '') {
            return $outputText;
        }

        foreach (Arr::get($response, 'output', []) as $item) {
            foreach (($item['content'] ?? []) as $content) {
                if (($content['type'] ?? null) === 'output_text' && trim((string) ($content['text'] ?? '')) !== '') {
                    return trim((string) $content['text']);
                }
            }
        }

        return 'I could not generate a grounded answer for that request.';
    }

    private function toolCallCount(array $response): int
    {
        return collect(Arr::get($response, 'output', []))
            ->filter(fn (array $item) => ($item['type'] ?? null) === 'function_call')
            ->count();
    }
}
