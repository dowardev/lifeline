<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Http\Middleware\ResolveCalendarOwner;
use App\Models\CalendarSource;
use App\Services\CalendarSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * OAuth Google sources keep the sentinel `google-oauth` in their url column
 * instead of a user-supplied URL. The SSRF guard must skip those sources, or
 * every refresh/sync dies with "La URL debe empezar con http:// o https://"
 * before any Google API is reached.
 */
class GoogleOAuthSourceSyncTest extends TestCase
{
    use RefreshDatabase;

    private const OWNER = 'test:sub';

    private function makeGoogleSource(): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => self::OWNER,
            'type' => 'google',
            'name' => 'Google Calendar',
            'url' => encrypt('google-oauth'),
            'password' => encrypt('fake-access-token'),
            'is_active' => true,
            'collections' => [],
        ])->save();

        return $source;
    }

    private function makeCaldavSource(string $url): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => self::OWNER,
            'type' => 'caldav',
            'name' => 'Local',
            'url' => encrypt($url),
            'is_active' => true,
            'collections' => [],
        ])->save();

        return $source;
    }

    public function test_sync_service_accepts_the_o_auth_sentinel_url(): void
    {
        $source = $this->makeGoogleSource();

        // No subscribed collections, so no Google API is called: this asserts
        // the guard alone, without touching the network.
        $result = (new CalendarSyncService)->syncSource($source);

        $this->assertTrue($result['ok'], 'sync should not fail on the sentinel url: '.json_encode($result));
        $this->assertNull($source->fresh()->last_error);
    }

    public function test_sync_endpoint_accepts_the_o_auth_sentinel_url(): void
    {
        $source = $this->makeGoogleSource();

        $response = $this->withoutMiddleware(ResolveCalendarOwner::class)->postJson(
            '/api/v1/calendar-sources/'.$source->id.'/sync?calendar_owner='.self::OWNER,
            []
        );

        $response->assertOk();
        $response->assertJsonPath('ok', true);
    }

    public function test_ssrf_guard_still_rejects_non_http_urls_for_user_supplied_sources(): void
    {
        $source = $this->makeCaldavSource('ftp://internal.example.com/dav');

        $result = (new CalendarSyncService)->syncSource($source);

        $this->assertFalse($result['ok']);
        $this->assertStringContainsString('http://', (string) $result['message']);
    }

    public function test_sync_endpoint_still_rejects_non_http_urls_for_user_supplied_sources(): void
    {
        $source = $this->makeCaldavSource('ftp://internal.example.com/dav');

        $response = $this->withoutMiddleware(ResolveCalendarOwner::class)->postJson(
            '/api/v1/calendar-sources/'.$source->id.'/sync?calendar_owner='.self::OWNER,
            []
        );

        $response->assertStatus(422);
    }
}
