<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Middleware;

use App\Models\CalendarSource;
use App\Models\ExternalEvent;
use Closure;
use Dowardev\SsoServer\Middleware\SsoAuthMiddleware;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ResolveCalendarOwner
{
    public const COOKIE = 'lifeline_guest';

    public function __construct(
        private readonly SsoAuthMiddleware $ssoAuth,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            $probe = $this->ssoAuth->handle($request, fn () => response()->json(['__passthrough' => true]));
            if ($probe->getStatusCode() !== 200) {
                return $probe;
            }
            $sub = (string) $request->get('sso_user_id');
            if ($sub === '') {
                return response()->json(['message' => 'Sin sesión'], 401);
            }
            $request->merge(['calendar_owner' => $sub]);
            $this->adoptGuestSources($request, $sub);

            return $next($request);
        }

        $guestId = (string) $request->header('X-Guest-Id', '');
        if (! self::isValidUuid($guestId)) {
            $guestId = (string) $request->cookie(self::COOKIE, '');
        }
        if (! self::isValidUuid($guestId)) {
            $guestId = (string) Str::uuid();
        }
        $request->merge(['calendar_owner' => 'guest:' . $guestId]);

        /** @var Response $response */
        $response = $next($request);
        if (method_exists($response, 'withCookie')) {
            $response = $response->withCookie(cookie(
                self::COOKIE,
                $guestId,
                60 * 24 * 365,
                null,
                null,
                $request->isSecure(),
                true,
                false,
                'Lax'
            ));
        }

        return $response;
    }

    private static function isValidUuid(string $value): bool
    {
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value);
    }

    private function adoptGuestSources(Request $request, string $sub): void
    {
        $guestId = (string) $request->header('X-Guest-Id', '');
        if (! self::isValidUuid($guestId)) {
            $guestId = (string) $request->cookie(self::COOKIE, '');
        }
        if (! self::isValidUuid($guestId)) {
            return;
        }
        $guestOwner = 'guest:' . $guestId;
        CalendarSource::where('sso_sub', $guestOwner)->update(['sso_sub' => $sub]);
        ExternalEvent::where('sso_sub', $guestOwner)->update(['sso_sub' => $sub]);
        \Illuminate\Support\Facades\Cookie::queue(\Illuminate\Support\Facades\Cookie::forget(self::COOKIE));
    }
}
