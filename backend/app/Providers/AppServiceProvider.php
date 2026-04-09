<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $user, string $token): string {
            $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url', 'http://localhost')), '/');
            $email = urlencode((string) $user->getEmailForPasswordReset());

            return "{$frontendUrl}/reset-password?token={$token}&email={$email}";
        });

        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip()),
        ]);

        RateLimiter::for('forgot-password', fn (Request $request) => [
            Limit::perMinute(3)->by('forgot-password:'.$request->ip()),
        ]);

        RateLimiter::for('reset-password', fn (Request $request) => [
            Limit::perMinute(5)->by('reset-password:'.$request->ip()),
        ]);

        RateLimiter::for('telemetry', fn (Request $request) => [
            Limit::perMinute(max((int) config('fleet.telemetry_token_rate_limit_per_minute', 120), 1))
                ->by('telemetry-token:'.($request->bearerToken() ?: 'missing-token')),
            Limit::perMinute(max((int) config('fleet.telemetry_ip_rate_limit_per_minute', 600), 1))
                ->by('telemetry-ip:'.$request->ip()),
        ]);

        RateLimiter::for('api-read', fn (Request $request) => [
            Limit::perMinute(120)->by('api-read:'.($request->user()?->id ?? $request->ip())),
        ]);

        RateLimiter::for('api-mutate', fn (Request $request) => [
            Limit::perMinute(30)->by('api-mutate:'.($request->user()?->id ?? $request->ip())),
        ]);

        RateLimiter::for('ai-copilot', fn (Request $request) => [
            Limit::perMinute(12)->by('ai-copilot:'.($request->user()?->id ?? $request->ip())),
        ]);

        Queue::failing(function (JobFailed $event): void {
            Log::channel('operations')->error('Queued job failed.', [
                'connection' => $event->connectionName,
                'queue' => $event->job->getQueue(),
                'job_id' => $event->job->getJobId(),
                'job_name' => $event->job->resolveName(),
                'exception' => $event->exception::class,
                'message' => $event->exception->getMessage(),
            ]);
        });
    }
}
