<?php

namespace App\Http\Requests;

use App\Domain\Ai\Support\AiCopilotContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AiCopilotMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'context' => ['required', 'string', Rule::in(AiCopilotContext::values())],
            'message' => ['required', 'string', 'min:2', 'max:1000'],
            'history' => ['sometimes', 'array', 'max:8'],
            'history.*.role' => ['required_with:history', Rule::in(['user', 'assistant'])],
            'history.*.content' => ['required_with:history', 'string', 'min:1', 'max:1500'],
        ];
    }
}
