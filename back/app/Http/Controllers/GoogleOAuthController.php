<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Controllers;

use App\Models\CalendarSource;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;

class GoogleOAuthController extends Controller
{
    public function start(Request $request, GoogleCalendarService $google)
    {
        $sub = (string) ($request->get('calendar_owner') ?? $request->get('sso_user_id'));
        if ($sub === '') {
            return response()->json(['message' => 'Sin sesión'], 401);
        }
        $state = encrypt(json_encode([
            'sub' => $sub,
            'exp' => now()->addMinutes(10)->timestamp,
        ]));

        return response()->json(['url' => $google->authorizeUrl($state)]);
    }

    public function callback(Request $request, GoogleCalendarService $google)
    {
        $front = (string) config('services.google_calendar.frontend_return');

        try {
            $state = json_decode(decrypt($request->input('state', '')), true);
        } catch (\Exception $e) {
            $state = null;
        }
        if (! is_array($state) || ($state['exp'] ?? 0) < now()->timestamp || ($state['sub'] ?? '') === '') {
            return redirect()->to($front . '&error=invalid_state');
        }

        if ($request->filled('error')) {
            return redirect()->to($front . '&error=denied');
        }

        try {
            $tokens = $google->exchangeCode((string) $request->input('code', ''));
        } catch (\Exception $e) {
            return redirect()->to($front . '&error=exchange_failed');
        }
        if (! isset($tokens['access_token'])) {
            return redirect()->to($front . '&error=exchange_failed');
        }

        $source = CalendarSource::where('sso_sub', $state['sub'])
            ->where('type', 'google')
            ->first() ?? new CalendarSource([
                'sso_sub' => $state['sub'],
                'type' => 'google',
            ]);
        $source->name = $source->name ?: 'Google Calendar';
        $source->url = encrypt('google-oauth');
        $source->password = encrypt($tokens['access_token']);
        if (isset($tokens['refresh_token'])) {
            $source->refresh_token = encrypt($tokens['refresh_token']);
        }
        $source->token_expires_at = now()->addSeconds((int) ($tokens['expires_in'] ?? 3600) - 60);
        $source->is_active = true;
        $source->last_error = null;
        $source->save();

        return redirect()->to($front . '&connected=' . $source->id);
    }
}
