<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Controllers;

use App\Models\CalendarSource;
use App\Models\ExternalEvent;
use App\Services\CaldavDiscoveryService;
use App\Services\GoogleCalendarService;
use App\Services\CalendarSyncService;
use App\Support\GuestToken;
use App\Traits\ValidatesPublicUrl;
use Illuminate\Http\Request;

class CalendarSourceController extends Controller
{
    use ValidatesPublicUrl;

    public function index(Request $request)
    {
        $sources = CalendarSource::where('sso_sub', $this->ssoSub($request))
            ->orderBy('id')
            ->get();

        return response()->json([
            'sources' => $sources->map(fn (CalendarSource $s) => $this->present($s)),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string|in:ics,caldav',
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:2048',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:1024',
            'color' => 'nullable|string|max:16',
            'is_active' => 'nullable|boolean',
        ]);

        $this->assertPublicHttpUrl($data['url']);
        $this->assertQuota($request);
        $this->assertNotDuplicate($request, $data);
        $source = new CalendarSource([
            'sso_sub' => $this->ssoSub($request),
            'sso_iss' => null,
            'type' => $data['type'],
            'name' => $data['name'],
            'url' => encrypt($data['url']),
            'username' => $data['username'] ?? null,
            'password' => isset($data['password']) && $data['password'] !== ''
                ? encrypt($data['password'])
                : null,
            'color' => $data['color'] ?? '#3880ff',
            'is_active' => $data['is_active'] ?? true,
        ]);
        $source->save();

        return response()->json(['source' => $this->present($source)], 201);
    }

    public function update(Request $request, $id)
    {
        $source = $this->owned($request, $id);

        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'url' => 'nullable|url|max:2048',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:1024',
            'color' => 'nullable|string|max:16',
            'is_active' => 'nullable|boolean',
            'collections' => 'nullable|array',
            'collections.*.href' => 'required_with:collections|string',
            'collections.*.name' => 'nullable|string|max:255',
            'collections.*.type' => 'nullable|string|max:16',
            'collections.*.subscribed' => 'nullable|boolean',
            'collections.*.hidden' => 'nullable|boolean',
        ]);

        if (array_key_exists('name', $data)) {
            $source->name = $data['name'];
        }
        if (array_key_exists('url', $data) && $data['url'] !== null) {
            $this->assertPublicHttpUrl($data['url']);
            $source->url = encrypt($data['url']);
        }
        if (array_key_exists('username', $data)) {
            $source->username = $data['username'];
        }
        if (array_key_exists('password', $data) && $data['password'] !== null && $data['password'] !== '') {
            $source->password = encrypt($data['password']);
        }
        if (array_key_exists('color', $data) && $data['color'] !== null) {
            $source->color = $data['color'];
        }
        if (array_key_exists('is_active', $data) && $data['is_active'] !== null) {
            $source->is_active = (bool) $data['is_active'];
        }
        if (array_key_exists('collections', $data) && is_array($data['collections'])) {
            $stored = $source->collections ?? [];
            $flags = [];
            foreach ($data['collections'] as $item) {
                if (isset($item['href'])) {
                    $flags[$item['href']] = (bool) ($item['subscribed'] ?? false);
                }
            }
            $byHref = [];
            foreach ($stored as $c) {
                if (isset($c['href'])) {
                    $byHref[$c['href']] = $c;
                }
            }
            foreach ($data['collections'] as $item) {
                if (! isset($item['href'])) {
                    continue;
                }
                $byHref[$item['href']] = array_merge($byHref[$item['href']] ?? [], $item);
            }
            $merged = [];
            foreach ($byHref as $href => $c) {
                $merged[] = [
                    'href' => $href,
                    'name' => $c['name'] ?? '',
                    'type' => $c['type'] ?? 'calendar',
                    'subscribed' => $flags[$href] ?? (bool) ($c['subscribed'] ?? false),
                    'hidden' => array_key_exists('hidden', $c) ? (bool) $c['hidden'] : false,
                ];
            }
            $source->collections = array_values($merged);
            $storedHrefs = array_map(fn ($c) => $c['href'] ?? null, $stored);
            foreach ($source->collections as $collection) {
                $href = $collection['href'] ?? null;
                if ($href !== null && ($collection['subscribed'] ?? true) === false
                    && in_array($href, $storedHrefs, true)
                    && array_key_exists($href, $flags)) {
                    ExternalEvent::where('calendar_source_id', $source->id)
                        ->where('collection_href', $href)
                        ->delete();
                }
            }
        }
        $source->save();

        return response()->json(['source' => $this->present($source)]);
    }

    public function destroy(Request $request, $id)
    {
        $this->owned($request, $id)->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function sync(Request $request, $id)
    {
        $source = $this->owned($request, $id);
        $this->assertPublicHttpUrl(decrypt($source->url));
        if (! $source->is_active) {
            return response()->json(['message' => 'La fuente está desactivada.'], 422);
        }
        $request->validate(['collection_href' => 'nullable|string|max:2048']);
        $result = (new CalendarSyncService())->syncSource(
            $source->fresh(),
            $request->input('collection_href')
        );
        if (! $result['ok']) {
            return response()->json(['message' => $result['message']], 422);
        }

        return response()->json([
            'ok' => true,
            'upserted' => $result['stats']['upserted'],
            'pruned' => $result['stats']['pruned'],
        ]);
    }

    public function guestToken(Request $request)
    {
        // The guest UUID is resolved server-side by the calendar.owner
        // middleware (signed token, encrypted cookie, or fresh UUID). The
        // frontend cannot read response headers through the SSO HttpClient
        // wrapper, so the signed token is also delivered in the body here.
        $owner = (string) ($request->get('calendar_owner') ?? '');
        if (! str_starts_with($owner, 'guest:')) {
            return response()->json(['token' => null]);
        }

        return response()->json(['token' => GuestToken::issue(substr($owner, strlen('guest:')))]);
    }

    public function discover(Request $request, $id)
    {
        $source = $this->owned($request, $id);
        $this->assertPublicHttpUrl(decrypt($source->url));
        try {
            if ($source->type === 'google') {
                $found = (new GoogleCalendarService())->listCalendars($source);
            } elseif ($source->type === 'caldav') {
                $url = decrypt($source->url);
                $password = $source->password !== null ? decrypt($source->password) : null;
                $found = (new CaldavDiscoveryService())->discover($url, $source->username, $password);
            } else {
                return response()->json(['message' => 'Tipo de fuente no soportado.'], 422);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'No se pudo descubrir: ' . mb_substr($e->getMessage(), 0, 300)], 422);
        }
        if (empty($found)) {
            return response()->json(['message' => 'No se encontraron calendarios en el servidor.'], 422);
        }
        $stored = $source->collections ?? [];
        $subscribed = [];
        foreach ($stored as $item) {
            if (isset($item['href'])) {
                $subscribed[$item['href']] = (bool) ($item['subscribed'] ?? false);
            }
        }
        $kept = [];
        foreach ($stored as $item) {
            if (isset($item['href'])) {
                $kept[$item['href']] = (bool) ($item['hidden'] ?? false);
            }
        }
        $merged = array_map(fn (array $c) => [
            'href' => $c['href'],
            'name' => $c['name'],
            'type' => $c['type'],
            'subscribed' => $subscribed[$c['href']] ?? false,
            'hidden' => $kept[$c['href']] ?? false,
        ], $found);
        $source->collections = $merged;
        $source->save();

        return response()->json(['collections' => $merged]);
    }

    private function owned(Request $request, $id): CalendarSource
    {
        $source = CalendarSource::where('id', $id)
            ->where('sso_sub', $this->ssoSub($request))
            ->first();
        if ($source === null) {
            abort(404, 'La conexión pertenece a otra sesión o fue eliminada.');
        }

        return $source;
    }

    private function assertNotDuplicate(Request $request, array $data): void
    {
        $owner = $this->ssoSub($request);
        $url = $this->normalizeUrl($data['url']);
        $username = $data['username'] ?? null;
        $query = CalendarSource::where('sso_sub', $owner)
            ->where('type', $data['type']);
        if ($username === null || $username === '') {
            $query->whereNull('username');
        } else {
            $query->where('username', $username);
        }
        $existing = $query->get();
        foreach ($existing as $source) {
            try {
                $storedUrl = $this->normalizeUrl(decrypt($source->url));
            } catch (\Exception $e) {
                continue;
            }
            if ($storedUrl === $url) {
                abort(422, 'Esta conexión ya existe.');
            }
        }
    }

    private function normalizeUrl(string $url): string
    {
        return strtolower(rtrim(trim($url), '/'));
    }

    private function ssoSub(Request $request): string
    {
        return (string) ($request->get('calendar_owner') ?? $request->get('sso_user_id'));
    }

    private function assertQuota(Request $request): void
    {
        $owner = $this->ssoSub($request);
        if (! str_starts_with($owner, 'guest:')) {
            return;
        }
        $count = CalendarSource::where('sso_sub', $owner)->count();
        if ($count >= 3) {
            abort(422, 'Límite de 3 fuentes en modo invitado. Iniciá sesión para más.');
        }
    }

    private function present(CalendarSource $source): array
    {
        try {
            $url = decrypt($source->url);
        } catch (\Exception $e) {
            $url = '';
        }

        return [
            'id' => $source->id,
            'type' => $source->type,
            'name' => $source->name,
            'url' => $url,
            'username' => $source->username,
            'has_password' => $source->password !== null,
            'color' => $source->color,
            'is_active' => (bool) $source->is_active,
            'last_synced_at' => $source->last_synced_at?->toIso8601String(),
            'last_error' => $source->last_error,
            'collections' => $source->collections ?? [],
        ];
    }
}
