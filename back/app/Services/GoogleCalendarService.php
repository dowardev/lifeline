<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Services;

use App\Models\CalendarSource;
use App\Support\ExternalReminderParser;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    /**
     * Calendar default reminders already fetched during this sync run, keyed
     * by calendar id. A miss is cached as [] too, so a failing calendarList
     * call is made at most once per calendar per run.
     *
     * @var array<string, int[]>
     */
    private array $calendarDefaultReminders = [];

    /**
     * Read-only scopes for every collection kind this service syncs: the
     * calendar list/events, Google Tasks, and the People connections used as
     * the contacts address book. A missing scope makes the matching Google
     * API fail with 403, so all three must be requested up front.
     */
    public const SCOPES = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/tasks.readonly',
        'https://www.googleapis.com/auth/contacts.readonly',
    ];

    public const SCOPE = self::SCOPES[0];

    /**
     * The People API lists contacts under `people/me/connections`. The
     * `people/me` endpoint alone needs the `profile` scope, which this app
     * never requests, and `resourceName` must NOT be sent as a query
     * parameter (it makes the API reject `pageSize`).
     */
    public const PEOPLE_CONNECTIONS_URL = 'https://people.googleapis.com/v1/people/me/connections';

    /**
     * @return array<string, string|int>
     */
    public static function contactsQuery(?string $pageToken = null): array
    {
        $query = [
            'pageSize' => 1000,
            'personFields' => 'names,emailAddresses,phoneNumbers',
        ];
        if ($pageToken !== null) {
            $query['pageToken'] = $pageToken;
        }

        return $query;
    }

    /**
     * Performs a Google API GET and turns transport/API failures into a short,
     * actionable error. A disabled API or a scope the account never granted is
     * reported as such instead of a raw JSON blob, and it always propagates so
     * the caller can mark that collection kind unconfirmed (never pruned).
     */
    private function getJson(string $url, array $options, string $label): array
    {
        try {
            $response = $this->httpClient()->get($url, $options);
        } catch (GuzzleException $e) {
            throw $this->apiFailure($label, $e);
        }

        $data = json_decode((string) $response->getBody(), true);
        if (! is_array($data)) {
            // An unparseable body must leave the collection unconfirmed,
            // never look like a confirmed empty success.
            throw new \RuntimeException('Google devolvió una respuesta no válida para ' . $label . '.');
        }

        return $data;
    }

    private function apiFailure(string $label, GuzzleException $e): \RuntimeException
    {
        if ($e instanceof ClientException) {
            $body = json_decode((string) $e->getResponse()->getBody(), true);
            $detail = $body['error']['message'] ?? null;
            if (is_string($detail) && $detail !== '') {
                if (str_contains($detail, 'has not been used in project') || str_contains($detail, 'is disabled')) {
                    $project = null;
                    if (preg_match('/project (\d+)/', $detail, $m) === 1) {
                        $project = $m[1];
                    }
                    $where = $project === null ? 'el proyecto de Google Cloud' : "el proyecto {$project}";
                    $activation = $this->trustedActivationUrl($body);

                    return new \RuntimeException(
                        "la API de Google para {$label} no está habilitada en {$where}."
                        . ($activation === null ? '' : " Habilitala en {$activation}"),
                        0,
                        $e
                    );
                }
                if (str_contains($detail, 'insufficient authentication scopes')) {
                    return new \RuntimeException(
                        "la cuenta no otorgó permiso para {$label}: reconectá la cuenta.",
                        0,
                        $e
                    );
                }

                return new \RuntimeException(
                    "Google rechazó {$label}: " . mb_substr($detail, 0, 160),
                    0,
                    $e
                );
            }
        }

        return new \RuntimeException('No se pudo consultar ' . $label . ' en Google.', 0, $e);
    }

    /**
     * Google embeds the console link that enables the disabled API. It is only
     * surfaced when it really is an https google.com URL, so a hostile or
     * unexpected payload can never turn this message into a redirect.
     */
    private function trustedActivationUrl(array $body): ?string
    {
        $url = $body['error']['details'][0]['metadata']['activationUrl'] ?? null;
        if (! is_string($url) || $url === '') {
            return null;
        }

        return preg_match('#^https://[a-z0-9.-]+\.google\.com/[^\s]*$#i', $url) === 1 ? $url : null;
    }

    public function authorizeUrl(string $state): string
    {
        $query = http_build_query([
            'client_id' => config('services.google_calendar.client_id'),
            'redirect_uri' => config('services.google_calendar.redirect_uri'),
            'response_type' => 'code',
            'scope' => implode(' ', self::SCOPES),
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
        $data = $this->getJson(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            ['headers' => ['Authorization' => "Bearer {$token}"]],
            'los calendarios'
        );

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
     * @return array<int, array{href: string, name: string, type: string}>
     */
    public function listTaskLists(CalendarSource $source): array
    {
        $token = $this->accessToken($source);
        $data = $this->getJson(
            'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
            ['headers' => ['Authorization' => "Bearer {$token}"]],
            'las listas de tareas'
        );
        $out = [];
        foreach ($data['items'] ?? [] as $item) {
            if (! isset($item['id'])) {
                continue;
            }
            $out[] = [
                'href' => 'tasks:' . (string) $item['id'],
                'name' => (string) ($item['title'] ?? $item['id']),
                'type' => 'tasks',
            ];
        }

        return $out;
    }

    /**
     * @return array<int, array{href: string, name: string, type: string}>
     */
    public function listContactGroups(CalendarSource $source): array
    {
        // The People API has no listable "collections" equivalent, so there is
        // a single virtual address book. Probe the connections endpoint here so
        // a disabled API or a missing scope is reported at discovery time
        // instead of silently showing up as an empty address book. The probe
        // must hit `people/me/connections`: `people/me` alone requires the
        // `profile` scope, which this app never asks for.
        $this->getJson(
            self::PEOPLE_CONNECTIONS_URL,
            [
                'headers' => ['Authorization' => 'Bearer ' . $this->accessToken($source)],
                'query' => ['pageSize' => 1, 'personFields' => 'names'],
            ],
            'los contactos'
        );

        return [['href' => 'people:connections', 'name' => 'Google Contacts', 'type' => 'contacts']];
    }

    /**
     * @return array<int, array{uid: string, title: string, status: ?string, due: ?string, notes: ?string}>
     */
    public function listTasks(CalendarSource $source, string $taskListId): array
    {
        $listId = str_starts_with($taskListId, 'tasks:') ? substr($taskListId, 6) : $taskListId;
        $token = $this->accessToken($source);
        $out = [];
        $pageToken = null;
        do {
            $query = ['maxResults' => 100, 'showCompleted' => 'true'];
            if ($pageToken !== null) {
                $query['pageToken'] = $pageToken;
            }
            $data = $this->getJson(
                'https://tasks.googleapis.com/tasks/v1/lists/' . rawurlencode($listId) . '/tasks',
                ['headers' => ['Authorization' => "Bearer {$token}"], 'query' => $query],
                'las tareas'
            );
            foreach ($data['items'] ?? [] as $item) {
                if (! isset($item['id'])) {
                    continue;
                }
                $out[] = [
                    'uid' => (string) $item['id'],
                    'title' => (string) ($item['title'] ?? '(sin título)'),
                    'status' => isset($item['status']) ? (string) $item['status'] : null,
                    'due' => isset($item['due']) ? (string) $item['due'] : null,
                    'notes' => isset($item['notes']) ? (string) $item['notes'] : null,
                ];
            }
            $pageToken = $data['nextPageToken'] ?? null;
        } while ($pageToken !== null && $pageToken !== '');

        return $out;
    }

    /**
     * @return array<int, array{uid: string, displayName: string, email: ?string, phone: ?string}>
     */
    public function listContacts(CalendarSource $source): array
    {
        $token = $this->accessToken($source);
        $out = [];
        $pageToken = null;
        do {
            $query = self::contactsQuery($pageToken);
            $data = $this->getJson(
                self::PEOPLE_CONNECTIONS_URL,
                [
                    'headers' => ['Authorization' => "Bearer {$token}"],
                    'query' => $query,
                ],
                'los contactos'
            );
            foreach ($data['connections'] ?? [] as $person) {
                $uid = (string) ($person['resourceName'] ?? '');
                if ($uid === '') {
                    continue;
                }
                $out[] = [
                    'uid' => $uid,
                    'displayName' => (string) ($person['names'][0]['displayName'] ?? $uid),
                    'email' => isset($person['emailAddresses'][0]['value']) ? (string) $person['emailAddresses'][0]['value'] : null,
                    'phone' => isset($person['phoneNumbers'][0]['value']) ? (string) $person['phoneNumbers'][0]['value'] : null,
                ];
            }
            $pageToken = $data['nextPageToken'] ?? null;
        } while ($pageToken !== null && $pageToken !== '');

        return $out;
    }

    /**
     * @return array<int, array{uid: string, title: string, start: ?string, end: ?string, description: ?string, timeZone: ?string}>
     */
    public function listEvents(CalendarSource $source, string $calendarId, string $timeMin, string $timeMax): array
    {
        $token = $this->accessToken($source);
        $data = $this->getJson(
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
            ],
            'los eventos'
        );

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
                'reminders' => $this->reminderOffsets($item['reminders'] ?? null, $source, $calendarId),
            ];
        }

        return $out;
    }

    /**
     * Google expresses reminders as minutes before the start. Only `popup`
     * overrides can become a local notification. When an event relies on the
     * calendar defaults (`useDefault` true, no usable popup overrides), the
     * defaults are read from the calendarList endpoint so the reminder the
     * user sees in Google Calendar also reaches this app. Descending, capped
     * to the offsets closest to the anchor, like the ICS path.
     *
     * @return int[]
     */
    private function reminderOffsets(mixed $reminders, CalendarSource $source, string $calendarId): array
    {
        if (! is_array($reminders)) {
            return [];
        }

        $seconds = $this->popupSeconds($reminders['overrides'] ?? null);

        $useDefault = ($reminders['useDefault'] ?? false) === true;
        if ($useDefault && $seconds === []) {
            $seconds = $this->calendarDefaultOffsetSeconds($source, $calendarId);
        }

        return $this->finalizeOffsets($seconds);
    }

    /**
     * @return int[]
     */
    private function popupSeconds(mixed $overrides): array
    {
        if (! is_array($overrides)) {
            return [];
        }

        $seconds = [];
        foreach ($overrides as $override) {
            if (! is_array($override) || ($override['method'] ?? null) !== 'popup') {
                continue;
            }
            if (! is_numeric($override['minutes'] ?? null)) {
                continue;
            }
            $seconds[] = (int) $override['minutes'] * 60;
        }

        return $seconds;
    }

    /**
     * The calendar's `defaultReminders` as seconds before start. A failure is
     * logged and contributes nothing: a broken defaults call must never fail
     * the sync. The result (including a failure) is cached per calendar for
     * the lifetime of this service instance.
     *
     * @return int[]
     */
    private function calendarDefaultOffsetSeconds(CalendarSource $source, string $calendarId): array
    {
        if (array_key_exists($calendarId, $this->calendarDefaultReminders)) {
            return $this->calendarDefaultReminders[$calendarId];
        }

        $this->calendarDefaultReminders[$calendarId] = [];
        try {
            $data = $this->getJson(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList/' . rawurlencode($calendarId),
                ['headers' => ['Authorization' => 'Bearer ' . $this->accessToken($source)]],
                'los recordatorios predeterminados del calendario'
            );
            $this->calendarDefaultReminders[$calendarId] = $this->popupSeconds($data['defaultReminders'] ?? null);
        } catch (\Throwable $e) {
            Log::warning('Google calendar default reminders could not be read', [
                'calendar' => $calendarId,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->calendarDefaultReminders[$calendarId];
    }

    /**
     * Dedupe, keep the ten offsets closest to the anchor (smallest absolute
     * distance to 0), then store descending.
     *
     * @param  int[]  $seconds
     * @return int[]
     */
    private function finalizeOffsets(array $seconds): array
    {
        $seconds = array_values(array_unique($seconds));

        usort($seconds, static fn ($a, $b) => abs($a) <=> abs($b));
        $seconds = array_slice($seconds, 0, ExternalReminderParser::MAX_OFFSETS);

        rsort($seconds);

        return $seconds;
    }

    protected function httpClient(): Client
    {
        return new Client(['timeout' => 20]);
    }
}
