<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\AssignRequestId::class);
        $middleware->alias([
            'active.account' => \App\Http\Middleware\EnsureActiveAccount::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (\Throwable $exception, Request $request): void {
            if (! $request->is('api/*')) {
                return;
            }

            Log::error('API request failed.', [
                'request_id' => $request->attributes->get('request_id'),
                'path' => $request->path(),
                'method' => $request->method(),
                'status' => $exception instanceof HttpExceptionInterface
                    ? $exception->getStatusCode()
                    : Response::HTTP_INTERNAL_SERVER_ERROR,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
                'user_id' => optional($request->user())->id,
            ]);
        });

        $exceptions->render(function (\Throwable $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $requestId = $request->attributes->get('request_id');

            if ($exception instanceof ValidationException) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $exception->errors(),
                    'request_id' => $requestId,
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if ($exception instanceof AuthenticationException) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'request_id' => $requestId,
                ], Response::HTTP_UNAUTHORIZED);
            }

            $status = $exception instanceof HttpExceptionInterface
                ? $exception->getStatusCode()
                : Response::HTTP_INTERNAL_SERVER_ERROR;

            return response()->json([
                'message' => $status === Response::HTTP_INTERNAL_SERVER_ERROR
                    ? 'Server error.'
                    : $exception->getMessage(),
                'request_id' => $requestId,
            ], $status);
        });
    })->create();
