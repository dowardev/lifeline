<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        $envPath = base_path('.env');
        $envReadable = is_readable($envPath);
        $envMtime = $envReadable ? filemtime($envPath) : null;
        $envContent = $envReadable ? file_get_contents($envPath) : null;

        $envAppUrl = null;
        if ($envContent !== null) {
            foreach (explode("\n", $envContent) as $line) {
                if (preg_match('/^APP_URL=(.*)$/', trim($line), $m)) {
                    $envAppUrl = $m[1];
                    break;
                }
            }
        }

        $checks = [
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'app_url' => config('app.url'),
            'env_app_url_raw' => $envAppUrl,
            'env_mtime' => $envMtime ? date('c', $envMtime) : null,
            'env_path' => $envPath,
            'db' => 'fail',
            'laravel' => app()->version(),
            'php' => PHP_VERSION,
            'timestamp' => now()->toIso8601String(),
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
