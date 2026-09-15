<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Traits;

use GuzzleHttp\Exception\RequestException;

trait ValidatesPublicUrl
{
    /**
     * Validate that a URL is a public HTTP/HTTPS URL (no localhost, no private IPs).
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException 422 if validation fails
     */
    protected function assertPublicHttpUrl(string $url): void
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