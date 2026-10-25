<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Middleware;

use App\Models\CalendarSource;
use App\Models\ExternalContact;
use App\Models\ExternalEvent;
use App\Models\ExternalTask;
use App\Models\User;
use App\Support\GuestToken;
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

        // The X-Guest-Id header is accepted only when it carries a
        // server-issued HMAC signature (see GuestToken). A raw UUID in the
        // header is untrusted and never resolves to another guest's data.
        $guestId = GuestToken::verify((string) $request->header(GuestToken::HEADER, ''))
            ?? $this->cookieGuestId($request)
            ?? (string) Str::uuid();
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
        if ($response instanceof Response) {
            $response->headers->set(GuestToken::TOKEN_HEADER, GuestToken::issue($guestId));
        }

        return $response;
    }

    private function cookieGuestId(Request $request): ?string
    {
        $cookie = (string) $request->cookie(self::COOKIE, '');
        if (! self::isValidUuid($cookie)) {
            return null;
        }

        return $cookie;
    }

    private static function isValidUuid(string $value): bool
    {
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value);
    }

    private function adoptGuestSources(Request $request, string $sub): void
    {
        $guestId = GuestToken::verify((string) $request->header(GuestToken::HEADER, ''))
            ?? $this->cookieGuestId($request);
        if ($guestId === null) {
            return;
        }
        $guestOwner = 'guest:' . $guestId;

        // LBDS-305 - the guest's sources become the user's sources, and
        // they were created without a `user_id` (a guest has no `users`
        // row, so the mirror could not be created for them). Link them
        // now so the observer creates the picker row.
        //
        // The save is per model (not a mass `update()`) so the
        // `CalendarSource` observer fires. The `users` row may not
        // exist yet; when it does, `ResolveSsoUser` links the sources.
        $userId = User::where('sso_sub', $sub)->value('id');
        foreach (CalendarSource::where('sso_sub', $guestOwner)->get() as $source) {
            $source->sso_sub = $sub;
            if ($userId !== null) {
                $source->user_id = $userId;
            }
            $source->save();
        }

        ExternalEvent::where('sso_sub', $guestOwner)->update(['sso_sub' => $sub]);
        ExternalContact::where('sso_sub', $guestOwner)->update(['sso_sub' => $sub]);
        ExternalTask::where('sso_sub', $guestOwner)->update(['sso_sub' => $sub]);
        \Illuminate\Support\Facades\Cookie::queue(\Illuminate\Support\Facades\Cookie::forget(self::COOKIE));
    }
}
