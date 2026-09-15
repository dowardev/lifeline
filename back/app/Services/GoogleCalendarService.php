<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Services;

use App\Models\CalendarSource;
use GuzzleHttp\Client;

class GoogleCalendarService
{
    public const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

    public function authorizeUrl(string $state): string
    {
        $query = http_build_query([
            'client_id' => config('services.google_calendar.client_id'),
            'redirect_uri' => config('services.google_calendar.redirect_uri'),
            'response_type' => 'code',
            'scope' => self::SCOPE,
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ]);

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . $query;
    }

    public function exchangeCode(string $code): array
    {
        $response = $this->httpClient()->post('https://oauth2.googleapis.com/token', [
            'form_params' => [
                'client_id' => config('services.google_calendar.client_id'),
                'client_secret' => config('services.google_calendar.client_secret'),
                'redirect_uri' => config('services.google_calendar.redirect_uri'),
                'grant_type' => 'authorization_code',
                'code' => $code,
            ],
        ]);

        return json_decode((string) $response->getBody(), true) ?? [];
    }

    public function refreshToken(CalendarSource $source): string
    {
        if ($source->refresh_token === null) {
            throw new \RuntimeException('La fuente Google no tiene refresh token.');
        }
        $response = $this->httpClient()->post('https://oauth2.googleapis.com/token', [
            'form_params' => [
                'client_id' => config('services.google_calendar.client_id'),
                'client_secret' => config('services.google_calendar.client_secret'),
                'grant_type' => 'refresh_token',
                'refresh_token' => decrypt($source->refresh_token),
            ],
        ]);
        $data = json_decode((string) $response->getBody(), true) ?? [];
        if (! isset($data['access_token'])) {
            throw new \RuntimeException('Google no devolvió access token al refrescar.');
        }
        $source->password = encrypt($data['access_token']);
        $source->token_expires_at = now()->addSeconds((int) ($data['expires_in'] ?? 3600) - 60);
        $source->save();

        return $data['access_token'];
    }

    public function accessToken(CalendarSource $source): string
    {
        $source = $source->fresh();
        if (
            $source->password !== null
            && $source->token_expires_at !== null
            && $source->token_expires_at->isFuture()
        ) {
            return decrypt($source->password);
        }

        return $this->refreshToken($source);
    }

    /**
     * @return array<int, array{href: string, name: string, type: string}>
     */
    public function listCalendars(CalendarSource $source): array
    {
        $token = $this->accessToken($source);
        $response = $this->httpClient()->get('https://www.googleapis.com/calendar/v3/users/me/calendarList', [
            'headers' => ['Authorization' => "Bearer {$token}"],
        ]);
        $data = json_decode((string) $response->getBody(), true) ?? [];

        $out = [];
        foreach ($data['items'] ?? [] as $item) {
            if (! isset($item['id'])) {
                continue;
            }
            $out[] = [
                'href' => (string) $item['id'],
                'name' => (string) ($item['summaryOverride'] ?? $item['summary'] ?? $item['id']),
                'type' => 'calendar',
            ];
        }

        return $out;
    }

    /**
     * @return array<int, array{uid: string, title: string, start: ?string, end: ?string, description: ?string, timeZone: ?string}>
     */
    public function listEvents(CalendarSource $source, string $calendarId, string $timeMin, string $timeMax): array
    {
        $token = $this->accessToken($source);
        $response = $this->httpClient()->get(
            'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode($calendarId) . '/events',
            [
                'headers' => ['Authorization' => "Bearer {$token}"],
                'query' => [
                    'timeMin' => $timeMin,
                    'timeMax' => $timeMax,
                    'singleEvents' => 'true',
                    'orderBy' => 'startTime',
                    'maxResults' => 250,
                ],
            ]
        );
        $data = json_decode((string) $response->getBody(), true) ?? [];

        $out = [];
        foreach ($data['items'] ?? [] as $item) {
            if (($item['status'] ?? '') === 'cancelled' || ! isset($item['id'])) {
                continue;
            }
            $start = $item['start']['dateTime'] ?? $item['start']['date'] ?? null;
            $end = $item['end']['dateTime'] ?? $item['end']['date'] ?? null;
            $recurring = isset($item['recurringEventId']);
            $out[] = [
                'uid' => $recurring
                    ? ((string) ($item['recurringEventId'] ?? $item['id'])) . '@' . (string) ($item['id'])
                    : (string) $item['id'],
                'title' => (string) ($item['summary'] ?? '(sin título)'),
                'start' => $start,
                'end' => $end,
                'description' => isset($item['description']) ? (string) $item['description'] : null,
                'timeZone' => isset($item['start']['timeZone']) ? (string) $item['start']['timeZone'] : null,
            ];
        }

        return $out;
    }

    private function httpClient(): Client
    {
        return new Client(['timeout' => 20]);
    }
}
