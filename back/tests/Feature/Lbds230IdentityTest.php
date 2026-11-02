<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Http\Controllers\CalendarSourceController;
use App\Http\Middleware\ResolveCalendarOwner;
use App\Http\Middleware\ResolveSsoUser;
use App\Models\CalendarSource;
use App\Models\User;
use App\Support\GuestToken;
use Dowardev\SsoServer\Client\SsoServerClient;
use Dowardev\SsoServer\Http\SsoHttpClient;
use Dowardev\SsoServer\Types\SsoUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Identity remodel on SSO sub + HMAC guest token (LBDS-230, incl. finding #3).
 */
class Lbds230IdentityTest extends TestCase
{
    use RefreshDatabase;

    private function guestMiddleware(): ResolveCalendarOwner
    {
        return (new \ReflectionClass(ResolveCalendarOwner::class))->newInstanceWithoutConstructor();
    }

    private function ssoMiddleware(?SsoUser $profile): ResolveSsoUser
    {
        $client = new class($profile) extends SsoServerClient
        {
            public function __construct(private readonly ?SsoUser $profile) {}

            public function getUser(): ?SsoUser
            {
                return $this->profile;
            }
        };
        $http = new class extends SsoHttpClient
        {
            public function __construct() {}

            public function get(string $path, string $bearerToken): ?array
            {
                return [];
            }
        };

        return new ResolveSsoUser($client, $http);
    }

    private function seedVictim(string $guestUuid): void
    {
        CalendarSource::create([
            'sso_sub' => 'guest:'.$guestUuid,
            'type' => 'caldav',
            'name' => 'Victim',
            'url' => 'https://cal.example.com/dav',
        ]);
    }

    public function test_guest_token_round_trip(): void
    {
        $uuid = (string) Str::uuid();

        $this->assertSame($uuid, GuestToken::verify(GuestToken::issue($uuid)));
        $this->assertNull(GuestToken::verify($uuid));
        $this->assertNull(GuestToken::verify('not-a-token'));
        $this->assertNull(GuestToken::verify($uuid.'.deadbeef'));
    }

    public function test_forged_raw_uuid_header_does_not_resolve_victim(): void
    {
        $victim = '11111111-2222-4333-8444-555555555555';
        $this->seedVictim($victim);

        $request = Request::create('/v1/sources', 'GET', [], [], [], [
            'HTTP_X-GUEST-ID' => $victim,
        ]);
        $request->setLaravelSession(app('session.store'));

        $owner = null;
        $response = $this->guestMiddleware()->handle($request, function ($req) use (&$owner) {
            $owner = $req->get('calendar_owner');

            return response()->json(['ok' => true]);
        });

        $this->assertNotSame('guest:'.$victim, $owner);
        $this->assertSame(1, CalendarSource::where('sso_sub', 'guest:'.$victim)->count());
        $token = $response->headers->get(GuestToken::TOKEN_HEADER);
        $this->assertSame($owner, 'guest:'.GuestToken::verify((string) $token));
    }

    public function test_signed_header_resolves_same_guest(): void
    {
        $uuid = '11111111-2222-4333-8444-555555555555';

        $request = Request::create('/v1/sources', 'GET', [], [], [], [
            'HTTP_X-GUEST-ID' => GuestToken::issue($uuid),
        ]);
        $request->setLaravelSession(app('session.store'));

        $owner = null;
        $this->guestMiddleware()->handle($request, function ($req) use (&$owner) {
            $owner = $req->get('calendar_owner');

            return response()->json(['ok' => true]);
        });

        $this->assertSame('guest:'.$uuid, $owner);
    }

    public function test_advanced_account_without_email_is_auto_provisioned(): void
    {
        $request = Request::create('/v1/events', 'GET');
        $request->merge(['sso_user_id' => 'sso-sub-advanced-1']);

        $response = $this->ssoMiddleware(null)->handle($request, fn () => response()->json(['ok' => true]));

        $this->assertSame(200, $response->getStatusCode());
        $user = User::where('sso_sub', 'sso-sub-advanced-1')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email);
    }

    public function test_pre_remodel_row_is_adopted_by_email(): void
    {
        $legacy = User::factory()->create(['email' => 'basic@example.com']);
        $legacy->forceFill(['sso_sub' => null, 'is_email_verified' => true])->save();

        $request = Request::create('/v1/events', 'GET');
        $request->merge(['sso_user_id' => 'sso-sub-basic-9']);
        $middleware = $this->ssoMiddleware(new SsoUser(
            id: 'sso-sub-basic-9',
            name: 'Basic',
            email: 'basic@example.com',
            userName: 'basic',
        ));

        $response = $middleware->handle($request, fn () => response()->json(['ok' => true]));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(1, User::where('email', 'basic@example.com')->count());
        $this->assertSame('sso-sub-basic-9', $legacy->fresh()->sso_sub);
    }

    public function test_unverified_legacy_email_is_not_adopted(): void
    {
        $unverified = User::factory()->create(['email' => 'claimed@example.com']);
        $unverified->forceFill(['sso_sub' => null])->save();

        $request = Request::create('/v1/events', 'GET');
        $request->merge(['sso_user_id' => 'sso-sub-claimed-1']);
        $middleware = $this->ssoMiddleware(new SsoUser(
            id: 'sso-sub-claimed-1',
            name: 'Claimed',
            email: 'claimed@example.com',
            userName: 'claimed',
        ));

        $response = $middleware->handle($request, fn () => response()->json(['ok' => true]));

        $this->assertSame(200, $response->getStatusCode());
        // No takeover: the legacy row keeps its address without sso_sub, and
        // the login gets a fresh row with null contact fields.
        $this->assertNull(User::where('email', 'claimed@example.com')->first()->sso_sub);
        $fresh = User::where('sso_sub', 'sso-sub-claimed-1')->first();
        $this->assertNotNull($fresh);
        $this->assertNull($fresh->email);
    }

    public function test_sequential_double_provision_stays_single_row(): void
    {
        // Sequential idempotency only: two provisions of the same sub through
        // the same code path must stay a single row. This does not exercise
        // the concurrent unique-violation window (not reproducible in-process).
        foreach (['sso-sub-race-1', 'sso-sub-race-1'] as $sub) {
            $request = Request::create('/v1/events', 'GET');
            $request->merge(['sso_user_id' => $sub]);
            $response = $this->ssoMiddleware(null)->handle($request, fn () => response()->json(['ok' => true]));
            $this->assertSame(200, $response->getStatusCode());
        }

        $this->assertSame(1, User::where('sso_sub', 'sso-sub-race-1')->count());
    }

    public function test_guest_token_endpoint_issues_verifiable_token(): void
    {
        $uuid = '11111111-2222-4333-8444-555555555555';
        $controller = new CalendarSourceController;

        $guest = Request::create('/v1/calendar-sources/guest-token', 'GET');
        $guest->merge(['calendar_owner' => 'guest:'.$uuid]);
        $token = $controller->guestToken($guest)->getData(true)['token'];
        $this->assertSame($uuid, GuestToken::verify($token));

        $authed = Request::create('/v1/calendar-sources/guest-token', 'GET');
        $authed->merge(['calendar_owner' => 'sso-sub-advanced-1']);
        $this->assertNull($controller->guestToken($authed)->getData(true)['token']);
    }
}
