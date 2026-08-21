<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


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
