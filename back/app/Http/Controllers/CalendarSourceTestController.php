<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Controllers;

use App\Models\CalendarSource;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Http\Request;
use Sabre\VObject\Reader;

class CalendarSourceTestController extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate([
            // P3 - the test endpoint probes the same kinds a user can
            // actually create, so the validated set is the shared
            // constant instead of a duplicated literal.
            'type' => ['required', 'string', 'in:' . implode(',', CalendarSource::MANUAL_TYPES)],
            'url' => 'required|url|max:2048',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:1024',
        ]);

        $url = $request->input('url');
        $this->assertPublicHttpUrl($url);

        if ($request->input('type') === 'ics') {
            return $this->testIcs($url);
        }

        return $this->testCaldav($url, $request->input('username'), $request->input('password'));
    }

    private function testIcs(string $url)
    {
        try {
            $body = $this->httpClient()->get($url)->getBody()->getContents();
        } catch (RequestException $e) {
            return response()->json(['message' => $this->fetchErrorMessage($e)], 422);
        }

        try {
            $vcalendar = Reader::read($body);
        } catch (\Exception $e) {
            return response()->json(['message' => 'La URL no devolvió un calendario ICS válido.'], 422);
        }

        $count = 0;
        foreach ($vcalendar->VEVENT ?? [] as $event) {
            $count++;
        }

        if ($count === 0) {
            return response()->json(['message' => 'Conexión OK, pero el calendario no tiene eventos.'], 422);
        }

        return response()->json(['ok' => true, 'event_count' => $count]);
    }

    private function testCaldav(string $url, ?string $username, ?string $password)
    {
        $options = [
            'headers' => [
                'Content-Type' => 'application/xml; charset=utf-8',
                'Depth' => '0',
            ],
            'body' => '<?xml version="1.0" encoding="utf-8" ?>'
                . '<D:propfind xmlns:D="DAV:">'
                . '<D:prop><D:displayname/><D:resourcetype/></D:prop>'
                . '</D:propfind>',
        ];
        if ($username !== null && $username !== '') {
            $options['auth'] = [$username, (string) $password];
        }

        try {
            $response = $this->httpClient()->request('PROPFIND', $url, $options);
        } catch (RequestException $e) {
            if ($e->getResponse() && $e->getResponse()->getStatusCode() === 401) {
                return response()->json(['message' => 'Autenticación CalDAV rechazada (401). Revisá usuario y contraseña.'], 422);
            }
            return response()->json(['message' => $this->fetchErrorMessage($e)], 422);
        }

        $status = $response->getStatusCode();
        if ($status < 200 || $status >= 300) {
            return response()->json(['message' => "El servidor CalDAV respondió HTTP {$status}."], 422);
        }

        return response()->json(['ok' => true]);
    }

    private function httpClient(): Client
    {
        return new Client(['timeout' => 15, 'allow_redirects' => ['max' => 3]]);
    }

    private function assertPublicHttpUrl(string $url): void
    {
        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true)) {
            abort(422, 'La URL debe empezar con http:// o https://.');
        }
        $host = strtolower($parts['host'] ?? '');
        if ($host === '' || $host === 'localhost') {
            abort(422, 'La URL no puede apuntar al propio servidor.');
        }
        $ips = array_filter([
            gethostbyname($host),
        ], fn ($ip) => filter_var($ip, FILTER_VALIDATE_IP) !== false);
        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                abort(422, 'La URL no puede apuntar a una red privada.');
            }
        }
    }

    private function fetchErrorMessage(RequestException $e): string
    {
        $status = $e->getResponse() ? $e->getResponse()->getStatusCode() : null;
        if ($status === 404) {
            return 'La URL devolvió 404 (no encontrada).';
        }
        if ($status !== null && $status >= 400) {
            return "La URL devolvió HTTP {$status}.";
        }
        return 'No se pudo alcanzar la URL (timeout o error de red).';
    }
}
