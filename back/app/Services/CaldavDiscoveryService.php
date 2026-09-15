<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class CaldavDiscoveryService
{
    public function discover(string $url, ?string $username, ?string $password): array
    {
        $client = new Client(['timeout' => 15, 'allow_redirects' => ['max' => 3]]);
        $auth = ($username !== null && $username !== '') ? [$username, (string) $password] : null;

        $principal = $this->findPrincipal($client, $url, $auth) ?? $url;
        $home = $this->findHomeSet($client, $principal, $auth) ?? $url;

        return $this->listCollections($client, $home, $auth);
    }

    private function propfind(Client $client, string $url, string $body, string $depth, ?array $auth): ?string
    {
        $options = [
            'headers' => ['Content-Type' => 'application/xml; charset=utf-8', 'Depth' => $depth],
            'body' => $body,
        ];
        if ($auth !== null) {
            $options['auth'] = $auth;
        }
        try {
            $response = $client->request('PROPFIND', $url, $options);
        } catch (RequestException $e) {
            return null;
        }
        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return null;
        }
        return (string) $response->getBody();
    }

    private function findPrincipal(Client $client, string $url, ?array $auth): ?string
    {
        $xml = $this->propfind($client, $url,
            '<?xml version="1.0" encoding="utf-8" ?>'
            . '<D:propfind xmlns:D="DAV:"><D:prop><D:current-user-principal/></D:prop></D:propfind>',
            '0', $auth);
        if ($xml === null) {
            return null;
        }
        $href = $this->firstHref($xml, 'current-user-principal');
        return $href !== null ? $this->absoluteUrl($url, $href) : null;
    }

    private function findHomeSet(Client $client, string $principalUrl, ?array $auth): ?string
    {
        $xml = $this->propfind($client, $principalUrl,
            '<?xml version="1.0" encoding="utf-8" ?>'
            . '<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">'
            . '<D:prop><C:calendar-home-set/></D:prop></D:propfind>',
            '0', $auth);
        if ($xml === null) {
            return null;
        }
        $href = $this->firstHref($xml, 'calendar-home-set');
        return $href !== null ? $this->absoluteUrl($principalUrl, $href) : null;
    }

    private function listCollections(Client $client, string $homeUrl, ?array $auth): array
    {
        $xml = $this->propfind($client, $homeUrl,
            '<?xml version="1.0" encoding="utf-8" ?>'
            . '<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">'
            . '<D:prop><D:displayname/><D:resourcetype/>'
            . '<C:supported-calendar-component-set/></D:prop></D:propfind>',
            '1', $auth);
        if ($xml === null) {
            return [];
        }

        $collections = [];
        $doc = $this->parseXml($xml);
        if ($doc === null) {
            return [];
        }
        $doc->registerXPathNamespace('d', 'DAV:');
        $doc->registerXPathNamespace('c', 'urn:ietf:params:xml:ns:caldav');
        foreach ($doc->xpath('//d:response') as $response) {
            $response->registerXPathNamespace('d', 'DAV:');
            $response->registerXPathNamespace('c', 'urn:ietf:params:xml:ns:caldav');
            $href = trim((string) ($response->xpath('d:href')[0] ?? ''));
            if ($href === '') {
                continue;
            }
            $isCalendar = count($response->xpath(
                './/d:resourcetype/c:calendar'
            )) > 0;
            if (! $isCalendar) {
                continue;
            }
            $name = trim((string) ($response->xpath('.//d:displayname')[0] ?? ''));
            $comps = [];
            foreach ($response->xpath('.//c:supported-calendar-component-set/c:comp') as $comp) {
                $attrs = $comp->attributes();
                if (isset($attrs['name'])) {
                    $comps[] = strtoupper((string) $attrs['name']);
                }
            }
            $type = 'calendar';
            if (! in_array('VEVENT', $comps, true) && in_array('VTODO', $comps, true)) {
                $type = 'tasks';
            }
            $collections[] = [
                'href' => $href,
                'name' => $name !== '' ? $name : basename(rtrim($href, '/')),
                'type' => $type,
            ];
        }

        return $collections;
    }

    private function firstHref(string $xml, string $prop): ?string
    {
        $doc = $this->parseXml($xml);
        if ($doc === null) {
            return null;
        }
        $doc->registerXPathNamespace('d', 'DAV:');
        $nodes = $doc->xpath("//*[local-name()='{$prop}']/d:href");
        if (empty($nodes)) {
            return null;
        }
        $href = trim((string) $nodes[0]);
        return $href !== '' ? $href : null;
    }

    private function parseXml(string $xml): ?\SimpleXMLElement
    {
        try {
            $doc = new \SimpleXMLElement($xml);
            return $doc;
        } catch (\Exception $e) {
            return null;
        }
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
}
