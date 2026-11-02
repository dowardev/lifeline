<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Services\GoogleCalendarService;
use Tests\TestCase;

/**
 * The consent screen must request every scope the sync actually uses: the
 * calendar list, Google Tasks (task lists) and the People connections used as
 * the contacts address book. Requesting only the calendar scope makes the
 * Tasks API answer 403, which used to break the whole discovery.
 */
class GoogleCalendarScopesTest extends TestCase
{
    public function test_authorize_url_requests_every_collection_scope(): void
    {
        config([
            'services.google_calendar.client_id' => 'client-id',
            'services.google_calendar.redirect_uri' => 'https://app.example.com/auth/callback',
        ]);

        $url = (new GoogleCalendarService)->authorizeUrl('state-token');
        $query = [];
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        $scopes = explode(' ', (string) ($query['scope'] ?? ''));

        $this->assertContains('https://www.googleapis.com/auth/calendar.readonly', $scopes);
        $this->assertContains('https://www.googleapis.com/auth/tasks.readonly', $scopes);
        $this->assertContains('https://www.googleapis.com/auth/contacts.readonly', $scopes);
        $this->assertCount(3, $scopes);
        $this->assertSame('state-token', $query['state']);
        $this->assertSame('code', $query['response_type']);
    }
}
