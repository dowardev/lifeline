<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Http\Controllers;

use App\Models\CalendarSource;
use App\Models\ExternalContact;
use App\Models\ExternalEvent;
use App\Models\ExternalTask;
use App\Models\User;
use App\Services\CaldavDiscoveryService;
use App\Services\CalendarSyncService;
use App\Services\GoogleCalendarService;
use App\Support\GuestToken;
use App\Traits\ValidatesPublicUrl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            'type' => ['required', 'string', 'in:'.implode(',', CalendarSource::MANUAL_TYPES)],
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
        $ownerSub = $this->ssoSub($request);
        // LBDS-305 - denormalize the `users.id` matching the SSO sub
        // at creation. The mirror observer reads `user_id` directly
        // (no `users` lookup) to decide whether to create a
        // `calendars` mirror row. Stays NULL for guest sources
        // (`guest:` prefix), which the observer then skips.
        // F2 - try SSO sub first, then fall back to the authenticated
        // request user so a legitimate user is not left without a mirror
        // when the SSO sub lookup misses (e.g. first login before user
        // row exists). Guest sources (no `users` row at all) stay on
        // the documented skip path.
        $ownerUserId = User::where('sso_sub', $ownerSub)->value('id');
        if ($ownerUserId === null && ! str_starts_with($ownerSub, 'guest:')) {
            $requestUser = $request->user();
            if ($requestUser !== null) {
                $ownerUserId = $requestUser->id;
            }
        }
        if ($ownerUserId === null && ! str_starts_with($ownerSub, 'guest:')) {
            Log::warning('LBDS-305 mirror skipped: could not resolve user_id for sso_sub', [
                'sso_sub' => $ownerSub,
            ]);
        }
        $source = new CalendarSource([
            'sso_sub' => $ownerSub,
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
            'user_id' => $ownerUserId,
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
            $storedFlags = [];
            foreach ($stored as $c) {
                if (isset($c['href'])) {
                    $byHref[$c['href']] = $c;
                    $storedFlags[$c['href']] = (bool) ($c['subscribed'] ?? false);
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
            // Only a real subscribed -> unsubscribed transition drops the
            // rows already stored for that collection. Comparing against the
            // previous state (instead of every unsubscribed entry in the
            // payload) keeps the delete off collections the caller is not
            // changing and keeps this update free of destructive writes it
            // was never asked to perform.
            foreach ($source->collections as $collection) {
                $href = $collection['href'] ?? null;
                if ($href === null) {
                    continue;
                }
                $wasSubscribed = $storedFlags[$href] ?? false;
                $nowSubscribed = (bool) ($collection['subscribed'] ?? false);
                if ($wasSubscribed && ! $nowSubscribed) {
                    ExternalEvent::where('calendar_source_id', $source->id)
                        ->where('collection_href', $href)
                        ->delete();
                    ExternalContact::where('calendar_source_id', $source->id)
                        ->where('collection_href', $href)
                        ->delete();
                    ExternalTask::where('calendar_source_id', $source->id)
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
        $this->assertSourceUrlIsPublic($source);
        if (! $source->is_active) {
            return response()->json(['message' => 'La fuente está desactivada.'], 422);
        }
        $request->validate(['collection_href' => 'nullable|string|max:2048']);
        $result = (new CalendarSyncService)->syncSource(
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
        $this->assertSourceUrlIsPublic($source);
        $found = [];
        $failed = [];
        // Kinds whose provider actually answered. Only those may drop stored
        // collections the server no longer lists.
        $refreshedKinds = [];
        try {
            if ($source->type === 'google') {
                $google = new GoogleCalendarService;
                // Each Google API is isolated: a missing OAuth scope (403) or
                // any other API error only marks that kind undiscovered and
                // must never hide the kinds that did answer.
                $fetchers = [
                    'calendar' => fn () => $google->listCalendars($source),
                    'tasks' => fn () => $google->listTaskLists($source),
                    'contacts' => fn () => $google->listContactGroups($source),
                ];
                foreach ($fetchers as $kind => $fetch) {
                    try {
                        $found = array_merge($found, $fetch());
                        $refreshedKinds[] = $kind;
                    } catch (\Exception $e) {
                        $failed[$kind] = mb_substr($e->getMessage(), 0, 200);
                    }
                }
            } elseif ($source->type === 'caldav') {
                $url = decrypt($source->url);
                $password = $source->password !== null ? decrypt($source->password) : null;
                $discovery = (new CaldavDiscoveryService)->discoverAll($url, $source->username, $password);
                $found = $discovery['found'];
                // Only kinds whose sub-discovery actually answered may refresh
                // stored entries. Tasks share the calendar PROPFIND, so they
                // ride on the calendar result.
                if (! ($discovery['failed']['calendar'] ?? false)) {
                    $refreshedKinds[] = 'calendar';
                    $refreshedKinds[] = 'tasks';
                }
                if (! ($discovery['failed']['contacts'] ?? false)) {
                    $refreshedKinds[] = 'contacts';
                }
            } else {
                return response()->json(['message' => 'Tipo de fuente no soportado.'], 422);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'No se pudo descubrir: '.mb_substr($e->getMessage(), 0, 300)], 422);
        }
        if (empty($found)) {
            if ($failed === []) {
                return response()->json(['message' => 'No se encontraron calendarios en el servidor.'], 422);
            }

            return response()->json([
                'message' => 'No se pudo descubrir: '.$this->describeFailures($failed),
                'discovery_errors' => $failed,
            ], 422);
        }
        $stored = $source->collections ?? [];
        $subscribed = [];
        $hidden = [];
        $storedTypes = [];
        foreach ($stored as $item) {
            if (isset($item['href'])) {
                $subscribed[$item['href']] = (bool) ($item['subscribed'] ?? false);
                $hidden[$item['href']] = (bool) ($item['hidden'] ?? false);
                $storedTypes[$item['href']] = $item['type'] ?? 'calendar';
            }
        }
        $merged = [];
        $seenHrefs = [];
        foreach ($found as $c) {
            if (! isset($c['href'])) {
                continue;
            }
            $seenHrefs[$c['href']] = true;
            $type = $c['type'] ?? 'calendar';
            $storedType = $storedTypes[$c['href']] ?? null;
            if (
                $type === 'calendar'
                && ($storedType === 'tasks' || $storedType === 'contacts')
            ) {
                // A server that omits supported-calendar-component-set must
                // not downgrade a stored tasks/contacts collection.
                $type = $storedType;
            }
            $merged[] = [
                'href' => $c['href'],
                'name' => $c['name'] ?? '',
                'type' => $type,
                'subscribed' => $subscribed[$c['href']] ?? false,
                'hidden' => $hidden[$c['href']] ?? false,
            ];
        }
        // A collection is dropped only when its own kind was refreshed and the
        // server stopped listing it. Kinds that failed keep their stored
        // entries so a scope/permission problem cannot erase them.
        foreach ($stored as $item) {
            $href = $item['href'] ?? null;
            if ($href === null || isset($seenHrefs[$href])) {
                continue;
            }
            if (in_array($this->collectionKind($item['type'] ?? 'calendar'), $refreshedKinds, true)) {
                continue;
            }
            $merged[] = $item;
        }
        $source->collections = array_values($merged);
        $source->save();

        return response()->json([
            'collections' => $source->collections,
            'discovery_errors' => $failed,
        ]);
    }

    /**
     * @param  array<string, string>  $failed
     */
    private function describeFailures(array $failed): string
    {
        $labels = ['calendar' => 'Calendarios', 'tasks' => 'Tareas', 'contacts' => 'Contactos'];
        $parts = [];
        foreach ($failed as $kind => $detail) {
            $parts[] = ($labels[$kind] ?? $kind).': '.$detail;
        }

        return implode(' · ', $parts);
    }

    private function collectionKind(string $type): string
    {
        if ($type === 'tasks' || $type === 'contacts') {
            return $type;
        }

        return 'calendar';
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
