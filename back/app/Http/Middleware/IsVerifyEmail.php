<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsVerifyEmail
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->user() || ! $request->user()->is_email_verified) {
            return response()->json(['message' => 'Email verification required'], 403);
        }

        return $next($request);
    }
}
