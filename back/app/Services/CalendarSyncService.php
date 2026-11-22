<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Services;

use App\Models\CalendarSource;
use App\Models\ExternalContact;
use App\Models\ExternalEvent;
use App\Models\ExternalTask;
use App\Support\ExternalReminderParser;
use App\Traits\ValidatesPublicUrl;
use GuzzleHttp\Client;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Component\VEvent;
use Sabre\VObject\Reader;

class CalendarSyncService
{
    use ValidatesPublicUrl;

    public function syncSource(CalendarSource $source, ?string $onlyHref = null): array
    {
        $stats = ['upserted' => 0, 'pruned' => 0];
        $seen = [];
        $confirmed = [];
        $skipped = [];

        try {
            $url = decrypt($source->url);
            $this->assertSourceUrlIsPublic($source);
            $password = $source->password !== null ? decrypt($source->password) : null;

            // Each collection is isolated: a fetch failure marks that
            // collection unconfirmed (never pruned) without aborting the
            // siblings. pruneUnseen() only touches confirmed collections.
            if ($source->type === 'google') {
                foreach ($this->targetCollections($source, $onlyHref) as $collection) {
                    $href = $collection['href'];
                    try {
                        $seen[$href] = $this->syncKind($source, $collection, $href, $stats);
                        $confirmed[] = $href;
                    } catch (\Exception $e) {
                        $skipped[$href] = $e->getMessage();
                    }
                }
            } elseif ($source->type === 'ics') {
                try {
                    $seen[null] = $this->syncIcs($source, $url, $stats);
                    $confirmed[] = null;
                } catch (\Exception $e) {
                    $skipped['ics'] = $e->getMessage();
                }
            } else {
                foreach ($this->targetCollections($source, $onlyHref) as $collection) {
                    $href = $collection['href'];
                    try {
                        $seen[$href] = $this->syncCaldavKind($source, $url, $source->username, $password, $collection, $href, $stats);
                        $confirmed[] = $href;
                    } catch (\Exception $e) {
                        $skipped[$href] = $e->getMessage();
                    }
                }
            }

            if ($skipped !== [] && $confirmed === []) {
                throw new \RuntimeException('Sync failed: '.implode('; ', $skipped));
            }
            if ($skipped !== []) {
                Log::warning('Calendar sync partially skipped', [
                    'source' => $source->id,
                    'skipped' => $skipped,
                ]);
            }

            $stats['pruned'] = $this->pruneUnseen($source, $seen, $confirmed);
            $stats['pruned'] += $this->pruneUnseenFor(ExternalContact::class, $source, $seen, $confirmed);
            $stats['pruned'] += $this->pruneUnseenFor(ExternalTask::class, $source, $seen, $confirmed);
            $source->last_synced_at = now();
            $source->last_error = null;
            $source->save();
        } catch (\Exception $e) {
            $source->last_error = mb_substr($e->getMessage(), 0, 1000);
            $source->save();

            return ['ok' => false, 'message' => $e->getMessage(), 'stats' => $stats];
        }

        return ['ok' => true, 'stats' => $stats];
    }

    private function subscribedCollections(CalendarSource $source): array
    {
        return array_values(array_filter(
            $source->collections ?? [],
            fn ($c) => ($c['subscribed'] ?? false) && isset($c['href'])
        ));
    }

    private function targetCollections(CalendarSource $source, ?string $onlyHref): array
    {
        $all = $this->subscribedCollections($source);
        if ($onlyHref === null || $onlyHref === '') {
            return $all;
        }

        return array_values(array_filter($all, fn ($c) => $c['href'] === $onlyHref));
    }

    private function syncGoogleCalendar(CalendarSource $source, string $calendarId, array &$stats): array
    {
        $window = $this->window();
        $events = (new GoogleCalendarService)->listEvents(
            $source,
            $calendarId,
            (new \DateTime($window['start']))->format(\DateTimeInterface::RFC3339),
            (new \DateTime($window['end']))->format(\DateTimeInterface::RFC3339)
        );
        $seen = [];
        foreach ($events as $item) {
            $uid = $item['uid'];
            $seen[] = $uid;
            ExternalEvent::updateOrCreate(
                [
                    'calendar_source_id' => $source->id,
                    'collection_href' => $calendarId,
                    'external_uid' => $uid,
                ],
                [
                    'sso_sub' => $source->sso_sub,
                    'title' => $item['title'],
                    'date_start' => $item['start'],
                    'date_end' => $item['end'],
                    'time_zone' => $item['timeZone'],
                    'description' => $item['description'],
                    'reminder_offsets_seconds' => $item['reminders'] ?? [],
                ]
            );
            $stats['upserted']++;
        }

        return $seen;
    }

    private function syncIcs(CalendarSource $source, string $url, array &$stats): array
    {
        $this->assertPublicHttpUrl($url);
        $body = $this->httpClient()->get($url)->getBody()->getContents();
        $vcalendar = Reader::read($body);
        $seen = [];
        foreach ($this->expand($vcalendar) as $event) {
            $uid = $this->instanceUid($event);
            $seen[] = $uid;
            $this->upsert($source, null, $uid, $event, $stats);
        }

        return $seen;
    }

    private function syncCaldavCollection(
        CalendarSource $source,
        string $baseUrl,
        ?string $username,
        ?string $password,
        string $collectionHref,
        array &$stats
    ): array {
        $collectionUrl = $this->absoluteUrl($baseUrl, $collectionHref);
        $this->assertPublicHttpUrl($collectionUrl);
        $window = $this->window();
        $body = '<?xml version="1.0" encoding="utf-8" ?>'
            .'<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">'
            .'<D:prop><D:getetag/><C:calendar-data/></D:prop>'
            .'<C:filter><C:comp-filter name="VCALENDAR">'
            .'<C:comp-filter name="VEVENT">'
            ."<C:time-range start=\"{$window['start']}\" end=\"{$window['end']}\"/>"
            .'</C:comp-filter></C:comp-filter></C:filter>'
            .'</C:calendar-query>';

        $options = [
            'headers' => ['Content-Type' => 'application/xml; charset=utf-8', 'Depth' => '1'],
            'body' => $body,
        ];
        if ($username !== null && $username !== '') {
            $options['auth'] = [$username, (string) $password];
        }
        $xml = (string) $this->httpClient()->request('REPORT', $collectionUrl, $options)->getBody();

        $seen = [];
        foreach ($this->extractCalendarData($xml) as $ics) {
            try {
                $vcalendar = Reader::read($ics);
            } catch (\Exception $e) {
                continue;
            }
            foreach ($this->expand($vcalendar) as $event) {
                $uid = $this->instanceUid($event);
                $seen[] = $uid;
                $this->upsert($source, $collectionHref, $uid, $event, $stats);
            }
        }

        return $seen;
    }

    private function syncKind(CalendarSource $source, array $collection, string $href, array &$stats): array
    {
        $kind = $collection['type'] ?? 'calendar';
        if ($kind === 'tasks') {
            return $this->syncGoogleTasks($source, $href, $stats);
        }
        if ($kind === 'contacts') {
            return $this->syncGoogleContacts($source, $href, $stats);
        }

        return $this->syncGoogleCalendar($source, $href, $stats);
    }

    private function syncCaldavKind(
        CalendarSource $source,
        string $baseUrl,
        ?string $username,
        ?string $password,
        array $collection,
        string $href,
        array &$stats
    ): array {
        $kind = $collection['type'] ?? 'calendar';
        if ($kind === 'tasks') {
            return $this->syncCaldavTasks($source, $baseUrl, $username, $password, $href, $stats);
        }
        if ($kind === 'contacts') {
            return $this->syncCaldavContacts($source, $baseUrl, $username, $password, $href, $stats);
        }

        return $this->syncCaldavCollection($source, $baseUrl, $username, $password, $href, $stats);
    }

    private function syncGoogleTasks(CalendarSource $source, string $href, array &$stats): array
    {
        $items = (new GoogleCalendarService)->listTasks($source, $href);
        $seen = [];
        foreach ($items as $item) {
            $uid = $item['uid'];
            $seen[] = $uid;
            [$dueAt, $dueTimeZone] = $this->dueParts($item['due'] ?? null);
            ExternalTask::updateOrCreate(
                [
                    'calendar_source_id' => $source->id,
                    'collection_href' => $href,
                    'external_uid' => $uid,
                ],
                [
                    'sso_sub' => $source->sso_sub,
                    'title' => $item['title'],
                    'status' => $item['status'],
                    'due_at' => $dueAt,
                    'time_zone' => $dueTimeZone,
                    'description' => $item['notes'],
                    // The Google Tasks API exposes no reminders at all.
                    'reminder_offsets_seconds' => [],
                ]
            );
            $stats['upserted']++;
        }

        return $seen;
    }

    /**
     * Splits a due date into the wall clock to store and the zone it belongs to.
     *
     * `external_tasks.due_at` holds a wall clock, so the zone has to travel
     * with it: without the pair, two tasks due at "09:00" in different zones
     * are the same value. The instant is preserved: a due date at
     * 23:59-03:00 is stored as "23:59" with the zone "-03:00".
     *
     * @return array{0: string|null, 1: string|null}
     */
    private function dueParts(mixed $due): array
    {
        if ($due === null || $due === '') {
            return [null, null];
        }

        try {
            $moment = $due instanceof \DateTimeInterface
                ? Carbon::instance($due)
                : Carbon::parse((string) $due);
        } catch (\Throwable $e) {
            return [null, null];
        }

        $zone = $moment->getTimezone()->getName();
        if ($zone === 'Z' || $zone === '+00:00' || $zone === '-00:00') {
            // Carbon keeps the "Z" of an RFC3339 timestamp as the name of
            // its zone; "UTC" is the name every engine understands.
            $zone = 'UTC';
        }

        return [$moment->format('Y-m-d H:i:s'), $zone];
    }

    private function syncGoogleContacts(CalendarSource $source, string $href, array &$stats): array
    {
        $items = (new GoogleCalendarService)->listContacts($source);
        $seen = [];
        foreach ($items as $item) {
            $uid = $item['uid'];
            $seen[] = $uid;
            ExternalContact::updateOrCreate(
                [
                    'calendar_source_id' => $source->id,
                    'collection_href' => $href,
                    'external_uid' => $uid,
                ],
                [
                    'sso_sub' => $source->sso_sub,
                    'display_name' => $item['displayName'],
                    'email' => $item['email'],
                    'phone' => $item['phone'],
                ]
            );
            $stats['upserted']++;
        }

        return $seen;
    }

    private function syncCaldavTasks(
        CalendarSource $source,
        string $baseUrl,
        ?string $username,
        ?string $password,
        string $collectionHref,
        array &$stats
    ): array {
        $collectionUrl = $this->absoluteUrl($baseUrl, $collectionHref);
        $this->assertPublicHttpUrl($collectionUrl);
        $body = '<?xml version="1.0" encoding="utf-8" ?>'
            .'<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">'
            .'<D:prop><D:getetag/><C:calendar-data/></D:prop>'
            .'<C:filter><C:comp-filter name="VCALENDAR">'
            .'<C:comp-filter name="VTODO"/>'
            .'</C:comp-filter></C:filter>'
            .'</C:calendar-query>';
        $options = [
            'headers' => ['Content-Type' => 'application/xml; charset=utf-8', 'Depth' => '1'],
            'body' => $body,
        ];
        if ($username !== null && $username !== '') {
            $options['auth'] = [$username, (string) $password];
        }
        $xml = (string) $this->httpClient()->request('REPORT', $collectionUrl, $options)->getBody();
        $seen = [];
        foreach ($this->extractCalendarData($xml) as $ics) {
            try {
                $vcalendar = Reader::read($ics);
            } catch (\Exception $e) {
                continue;
            }
            foreach ($vcalendar->VTODO ?? [] as $todo) {
                $uid = trim((string) ($todo->UID ?? ''));
                if ($uid === '') {
                    continue;
                }
                $seen[] = $uid;
                $start = null;
                if (isset($todo->DTSTART)) {
                    try {
                        $start = $todo->DTSTART->getDateTime();
                    } catch (\Exception $e) {
                        $start = null;
                    }
                }
                $due = null;
                if (isset($todo->DUE)) {
                    try {
                        $due = $todo->DUE->getDateTime();
                    } catch (\Exception $e) {
                        $due = null;
                    }
                }
                [$dueAt, $dueTimeZone] = $this->dueParts($due);
                ExternalTask::updateOrCreate(
                    [
                        'calendar_source_id' => $source->id,
                        'collection_href' => $collectionHref,
                        'external_uid' => $uid,
                    ],
                    [
                        'sso_sub' => $source->sso_sub,
                        'title' => trim((string) ($todo->SUMMARY ?? '(sin título)')),
                        'status' => isset($todo->STATUS) ? trim((string) $todo->STATUS) : null,
                        'due_at' => $dueAt,
                        'time_zone' => $dueTimeZone,
                        'description' => isset($todo->DESCRIPTION) ? trim((string) $todo->DESCRIPTION) : null,
                        'reminder_offsets_seconds' => ExternalReminderParser::forVTodo($todo, $start, $due),
                    ]
                );
                $stats['upserted']++;
            }
        }

        return $seen;
    }

    private function syncCaldavContacts(
        CalendarSource $source,
        string $baseUrl,
        ?string $username,
        ?string $password,
        string $collectionHref,
        array &$stats
    ): array {
        $collectionUrl = $this->absoluteUrl($baseUrl, $collectionHref);
        $this->assertPublicHttpUrl($collectionUrl);
        $body = '<?xml version="1.0" encoding="utf-8" ?>'
            .'<C:addressbook-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">'
            .'<D:prop><D:getetag/><C:address-data/></D:prop>'
            .'</C:addressbook-query>';
        $options = [
            'headers' => ['Content-Type' => 'application/xml; charset=utf-8', 'Depth' => '1'],
            'body' => $body,
        ];
        if ($username !== null && $username !== '') {
            $options['auth'] = [$username, (string) $password];
        }
        $xml = (string) $this->httpClient()->request('REPORT', $collectionUrl, $options)->getBody();
        $seen = [];
        foreach ($this->extractAddressData($xml) as $entry) {
            try {
                $parsed = Reader::read($entry['data']);
            } catch (\Exception $e) {
                continue;
            }
            $card = $parsed->VCARD ?? $parsed;
            $uid = trim((string) ($card->UID ?? ''));
            if ($uid === '') {
                // The DAV resource href is the stable server identity for a
                // card that carries no UID; md5($vcard) moved on every edit.
                $uid = md5($entry['href']);
            }
            $seen[] = $uid;
            ExternalContact::updateOrCreate(
                [
                    'calendar_source_id' => $source->id,
                    'collection_href' => $collectionHref,
                    'external_uid' => $uid,
                ],
                [
                    'sso_sub' => $source->sso_sub,
                    'display_name' => trim((string) ($card->FN ?? $uid)),
                    'email' => isset($card->EMAIL) ? trim((string) $card->EMAIL) : null,
                    'phone' => isset($card->TEL) ? trim((string) $card->TEL) : null,
                ]
            );
            $stats['upserted']++;
        }

        return $seen;
    }

    private function extractAddressData(string $xml): array
    {
        $out = [];
        try {
            $doc = new \SimpleXMLElement($xml);
        } catch (\Exception $e) {
            throw new \RuntimeException('Invalid CardDAV multistatus response: '.mb_substr(trim($xml), 0, 200), 0, $e);
        }
        $doc->registerXPathNamespace('d', 'DAV:');
        $doc->registerXPathNamespace('c', 'urn:ietf:params:xml:ns:carddav');
        foreach ($doc->xpath('//d:response') as $response) {
            $response->registerXPathNamespace('d', 'DAV:');
            $response->registerXPathNamespace('c', 'urn:ietf:params:xml:ns:carddav');
            $status = $this->responseStatusCode($response);
            if ($status !== null && $status >= 400) {
                throw new \RuntimeException("CardDAV server returned HTTP {$status} for a resource; the collection cannot be confirmed.");
            }
            $nodes = $response->xpath('.//c:address-data');
            if (! empty($nodes)) {
                $href = trim((string) ($response->xpath('d:href')[0] ?? ''));
                $out[] = ['href' => $href, 'data' => trim((string) $nodes[0])];
            }
        }

        return $out;
    }

    /**
     * The HTTP status a 207 Multi-Status entry reports for its own resource,
     * or null when it declares none. Per-resource errors inside a 207 must
     * fail the fetch: otherwise a denied collection looks like an empty
     * confirmed one and the prune guards wipe its stored rows.
     */
    private function responseStatusCode(\SimpleXMLElement $response): ?int
    {
        $statuses = $response->xpath('d:status');
        if (empty($statuses)) {
            return null;
        }
        if (preg_match('/(\d{3})/', trim((string) $statuses[0]), $m) !== 1) {
            return null;
        }

        return (int) $m[1];
    }

    /**
     * Prune guard shared by contacts/tasks (LBDS-264): only confirmed collections.
     */
    private function pruneUnseenFor(string $model, CalendarSource $source, array $seenByCollection, array $confirmed): int
    {
        $pruned = 0;
        $query = $model::where('calendar_source_id', $source->id);
        foreach ($seenByCollection as $href => $seen) {
            if (! in_array($href, $confirmed, true)) {
                continue;
            }
            $pruned += (clone $query)->where('collection_href', $href)
                ->whereNotIn('external_uid', $seen)->delete();
        }

        return $pruned;
    }

    private function pruneUnseen(CalendarSource $source, array $seenByCollection, array $confirmed): int
    {
        $pruned = 0;
        $query = ExternalEvent::where('calendar_source_id', $source->id);
        if ($source->type === 'ics') {
            if (! in_array(null, $confirmed, true)) {
                return 0;
            }
            $seen = $seenByCollection[null] ?? [];
            $pruned += (clone $query)->whereNull('collection_href')
                ->whereNotIn('external_uid', $seen)->delete();

            return $pruned;
        }
        foreach ($seenByCollection as $href => $seen) {
            if (! in_array($href, $confirmed, true)) {
                continue;
            }
            $pruned += (clone $query)->where('collection_href', $href)
                ->whereNotIn('external_uid', $seen)->delete();
        }

        return $pruned;
    }

    private function upsert(
        CalendarSource $source,
        ?string $collectionHref,
        string $uid,
        VEvent $event,
        array &$stats
    ): void {
        $start = $event->DTSTART ? $event->DTSTART->getDateTime() : null;
        $end = $event->DTEND ? $event->DTEND->getDateTime()
            : ($event->DURATION ? $this->addDuration($start, (string) $event->DURATION) : null);

        ExternalEvent::updateOrCreate(
            [
                'calendar_source_id' => $source->id,
                'collection_href' => $collectionHref,
                'external_uid' => $uid,
            ],
            [
                'sso_sub' => $source->sso_sub,
                'title' => trim((string) ($event->SUMMARY ?? '(sin título)')),
                'date_start' => $start,
                'date_end' => $end,
                'time_zone' => $start ? $start->getTimezone()->getName() : null,
                'description' => isset($event->DESCRIPTION) ? trim((string) $event->DESCRIPTION) : null,
                'reminder_offsets_seconds' => ExternalReminderParser::forVEvent($event, $start, $end),
            ]
        );
        $stats['upserted']++;
    }

    /**
     * @return iterable<VEvent>
     */
    private function expand(VCalendar $vcalendar): iterable
    {
        $window = $this->window();
        try {
            $expanded = $vcalendar->expand(
                new \DateTime($window['start']),
                new \DateTime($window['end'])
            );
        } catch (\Exception $e) {
            $expanded = $vcalendar;
        }
        foreach ($expanded->VEVENT ?? [] as $event) {
            yield $event;
        }
    }

    private function instanceUid(VEvent $event): string
    {
        $uid = (string) ($event->UID ?? '');
        if (isset($event->{'RECURRENCE-ID'})) {
            return $uid.'@'.(string) $event->{'RECURRENCE-ID'};
        }
        if (isset($event->DTSTART)) {
            $dt = $event->DTSTART->getDateTime();
            if ($dt) {
                return $uid.'@'.$dt->format('Ymd\THis');
            }
        }

        return $uid !== '' ? $uid : md5((string) $event->SUMMARY.(string) ($event->DTSTART ?? ''));
    }

    private function window(): array
    {
        return [
            'start' => (new \DateTime('-6 months'))->format('Ymd\THis\Z'),
            'end' => (new \DateTime('+6 months'))->format('Ymd\THis\Z'),
        ];
    }

    private function addDuration(?\DateTimeInterface $start, string $duration): ?\DateTimeInterface
    {
        if (! $start) {
            return null;
        }
        try {
            $end = \DateTime::createFromInterface($start);

            return $end->add(new \DateInterval($duration));
        } catch (\Exception $e) {
            return null;
        }
    }

    private function extractCalendarData(string $xml): array
    {
        $out = [];
        try {
            $doc = new \SimpleXMLElement($xml);
        } catch (\Exception $e) {
            throw new \RuntimeException(
                'Invalid CalDAV multistatus response ('.$e->getMessage().'): '.mb_substr(trim($xml), 0, 200),
                0,
                $e
            );
        }
        $doc->registerXPathNamespace('d', 'DAV:');
        $doc->registerXPathNamespace('c', 'urn:ietf:params:xml:ns:caldav');
        foreach ($doc->xpath('//d:response') as $response) {
            $response->registerXPathNamespace('d', 'DAV:');
            $response->registerXPathNamespace('c', 'urn:ietf:params:xml:ns:caldav');
            $status = $this->responseStatusCode($response);
            if ($status !== null && $status >= 400) {
                throw new \RuntimeException("CalDAV server returned HTTP {$status} for a resource; the collection cannot be confirmed.");
            }
            $nodes = $response->xpath('.//c:calendar-data');
            if (! empty($nodes)) {
                $out[] = trim((string) $nodes[0]);
            }
        }

        return $out;
    }

    private function absoluteUrl(string $base, string $href): string
    {
        if (preg_match('#^https?://#i', $href)) {
            return $href;
        }
        $parts = parse_url($base);
        $origin = ($parts['scheme'] ?? 'https').'://'.($parts['host'] ?? '');
        if (isset($parts['port'])) {
            $origin .= ':'.$parts['port'];
        }
        if (str_starts_with($href, '/')) {
            return $origin.$href;
        }

        return rtrim($base, '/').'/'.$href;
    }

    protected function httpClient(): Client
    {
        return new Client(['timeout' => 30, 'allow_redirects' => ['max' => 3]]);
    }
}
