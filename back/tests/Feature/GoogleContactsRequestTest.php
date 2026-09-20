<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace Tests\Feature;

use App\Services\GoogleCalendarService;
use Tests\TestCase;

/**
 * The People API request shape is easy to get subtly wrong and the errors are
 * misleading, so both mistakes are locked here:
 *
 *  - `people/me` needs the `profile` scope (never requested) -> use
 *    `people/me/connections`.
 *  - Sending `resourceName` as a query parameter makes the API reject
 *    `pageSize` with "Cannot bind query parameter".
 */
class GoogleContactsRequestTest extends TestCase
{
    public function testContactsAreRequestedFromTheMeConnectionsPath(): void
    {
        $url = GoogleCalendarService::PEOPLE_CONNECTIONS_URL;

        $this->assertSame('https://people.googleapis.com/v1/people/me/connections', $url);
        $this->assertStringEndsWith('/people/me/connections', $url);
        $this->assertStringNotContainsString('/people/connections', $url);
    }

    public function testContactsQueryCarriesNoResourceNameParameter(): void
    {
        $query = GoogleCalendarService::contactsQuery();

        $this->assertArrayNotHasKey('resourceName', $query);
        $this->assertSame(1000, $query['pageSize']);
        $this->assertSame('names,emailAddresses,phoneNumbers', $query['personFields']);
        $this->assertArrayNotHasKey('pageToken', $query);
    }

    public function testContactsQueryPaginatesWithAPageToken(): void
    {
        $query = GoogleCalendarService::contactsQuery('next-page');

        $this->assertSame('next-page', $query['pageToken']);
        $this->assertArrayNotHasKey('resourceName', $query);
    }
}
