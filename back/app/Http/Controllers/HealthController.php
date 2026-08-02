<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        $checks = [
            'app_env'    => config('app.env'),
            'app_debug'  => config('app.debug'),
            'app_url'    => config('app.url'),
            'db'         => 'fail',
            'laravel'    => app()->version(),
            'php'        => PHP_VERSION,
            'timestamp'  => now()->toIso8601String(),
        ];

        try {
            DB::connection()->getPdo();
            $checks['db'] = 'ok';
        } catch (Throwable $e) {
            $checks['db'] = 'fail';
            $checks['db_error'] = $e->getMessage();
        }

        $expectedProduction = $checks['app_env'] === 'production' && $checks['app_debug'] === false;
        $healthy = $expectedProduction && $checks['db'] === 'ok';

        return response()->json($checks, $healthy ? 200 : 503);
    }
}
