<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Services;

use App\Models\CalendarSource;
use App\Models\ExternalEvent;
use App\Traits\ValidatesPublicUrl;
use GuzzleHttp\Client;
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

        try {
            $url = decrypt($source->url);
            $this->assertPublicHttpUrl($url);
            $password = $source->password !== null ? decrypt($source->password) : null;

            if ($source->type === 'google') {
                foreach ($this->targetCollections($source, $onlyHref) as $collection) {
                    $href = $collection['href'];
                    $seen[$href] = $this->syncGoogleCalendar($source, $href, $stats);
                }
            } elseif ($source->type === 'ics') {
                $seen[null] = $this->syncIcs($source, $url, $stats);
            } else {
                foreach ($this->targetCollections($source, $onlyHref) as $collection) {
                    $href = $collection['href'];
                    $seen[$href] = $this->syncCaldavCollection(
                        $source, $url, $source->username, $password, $href, $stats
                    );
                }
            }

            $stats['pruned'] = $this->pruneUnseen($source, $seen);
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
        $events = (new GoogleCalendarService())->listEvents(
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
            . '<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">'
            . '<D:prop><D:getetag/><C:calendar-data/></D:prop>'
            . '<C:filter><C:comp-filter name="VCALENDAR">'
            . '<C:comp-filter name="VEVENT">'
            . "<C:time-range start=\"{$window['start']}\" end=\"{$window['end']}\"/>"
            . '</C:comp-filter></C:comp-filter></C:filter>'
            . '</C:calendar-query>';

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

    private function pruneUnseen(CalendarSource $source, array $seenByCollection): int
    {
        $pruned = 0;
        $query = ExternalEvent::where('calendar_source_id', $source->id);
        if ($source->type === 'ics') {
            $seen = $seenByCollection[null] ?? [];
            $pruned += (clone $query)->whereNull('collection_href')
                ->whereNotIn('external_uid', $seen)->delete();
            return $pruned;
        }
        foreach ($seenByCollection as $href => $seen) {
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
            return $uid . '@' . (string) $event->{'RECURRENCE-ID'};
        }
        if (isset($event->DTSTART)) {
            $dt = $event->DTSTART->getDateTime();
            if ($dt) {
                return $uid . '@' . $dt->format('Ymd\THis');
            }
        }

        return $uid !== '' ? $uid : md5((string) $event->SUMMARY . (string) ($event->DTSTART ?? ''));
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
            return [];
        }
        $doc->registerXPathNamespace('d', 'DAV:');
        $doc->registerXPathNamespace('c', 'urn:ietf:params:xml:ns:caldav');
        foreach ($doc->xpath('//d:response') as $response) {
            $response->registerXPathNamespace('d', 'DAV:');
            $response->registerXPathNamespace('c', 'urn:ietf:params:xml:ns:caldav');
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
        $origin = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');
        if (isset($parts['port'])) {
            $origin .= ':' . $parts['port'];
        }
        if (str_starts_with($href, '/')) {
            return $origin . $href;
        }

        return rtrim($base, '/') . '/' . $href;
    }

    private function httpClient(): Client
    {
        return new Client(['timeout' => 30, 'allow_redirects' => ['max' => 3]]);
    }
}
