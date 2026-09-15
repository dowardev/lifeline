<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Dowardev\SsoServer\Client\SsoServerClient;
use Dowardev\SsoServer\Http\SsoHttpClient;

class ResolveSsoUser
{
    public function __construct(
        private readonly SsoServerClient $ssoClient,
        private readonly SsoHttpClient $ssoHttp,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // The SSO package authenticates the bearer token and merges the OIDC
        // `sub` claim as `sso_user_id`: stable, immutable, always present.
        $ssoSub = (string) $request->get('sso_user_id');

        if ($ssoSub === '') {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $user = User::where('sso_sub', $ssoSub)->first();

        if (! $user) {
            // Enrich attributes when the profile is available (basic
            // accounts). Advanced-encryption accounts carry no profile and
            // that must not block provisioning: the row is created anyway.
            $ssoUser = $this->ssoClient->getUser();

            $email = $ssoUser->email ?? null;
            $name = $ssoUser->name ?? null;
            $userName = $ssoUser->userName ?? null;

            if (! is_string($email) || $email === '') {
                $profile = $this->fetchSsoProfile($request);
                if (is_string($profile['email'] ?? null) && $profile['email'] !== '') {
                    $email = $profile['email'];
                    $name = $name ?? ($profile['name'] ?? null);
                    $userName = $userName ?? ($profile['user'] ?? null);
                }
            }

            // Adopt a pre-remodel row matched by email instead of duplicating
            // it — but only when that row's email was verified. Stamping an
            // sso_sub onto an unverified address would hand the SSO identity
            // someone else's data on a mere email match. Unverified matches
            // are left orphaned (greenfield: no real data) and the login gets
            // a fresh row with null contact fields.
            // The whole provisioning is retried on unique violations so two
            // concurrent first-logins cannot 500 (R3).
            try {
                if (is_string($email) && $email !== '') {
                    $legacy = User::where('email', $email)->first();
                    if ($legacy && (bool) $legacy->is_email_verified) {
                        $legacy->forceFill(['sso_sub' => $ssoSub])->save();
                        $user = $legacy;
                    }
                }

                if (! $user) {
                    // A fresh row takes the SSO-claimed address only when no
                    // row holds it: no clash with an unverified legacy address
                    // and no takeover by mere email match.
                    $emailForRow = null;
                    if (is_string($email) && $email !== ''
                        && ! User::where('email', $email)->exists()) {
                        $emailForRow = $email;
                    }
                    $handleForRow = null;
                    if (is_string($userName) && $userName !== ''
                        && ! User::where('user', $userName)->exists()) {
                        $handleForRow = $userName;
                    }
                    $user = User::create([
                        'sso_sub' => $ssoSub,
                        'name' => $name,
                        'user' => $handleForRow,
                        'email' => $emailForRow,
                        'password' => bcrypt(Str::random(32)),
                    ]);
                }
            } catch (\Illuminate\Database\QueryException $e) {
                // Same-sub double login: the winner row is already there.
                $user = User::where('sso_sub', $ssoSub)->first();
                if (! $user) {
                    // Cross-sub clash on email/user: fall back to a contactless
                    // row for this sub instead of 500ing.
                    try {
                        $user = User::create([
                            'sso_sub' => $ssoSub,
                            'name' => $name,
                            'user' => null,
                            'email' => null,
                            'password' => bcrypt(Str::random(32)),
                        ]);
                    } catch (\Illuminate\Database\QueryException $e) {
                        $user = User::where('sso_sub', $ssoSub)->firstOrFail();
                    }
                }
            }
        }

        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $next($request);
    }

    private function fetchSsoProfile(Request $request): array
    {
        // Network/SSO failures degrade to provisioning with nulls; programming
        // errors (TypeError and friends) must fail loudly instead.
        try {
            $token = (string) $request->bearerToken();
            if ($token === '') {
                return [];
            }
            return $this->ssoHttp->get('/me', $token) ?? [];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('SSO profile fallback failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

}
