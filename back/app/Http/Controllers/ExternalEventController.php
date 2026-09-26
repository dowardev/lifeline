<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Controllers;

use App\Models\ExternalContact;
use App\Models\ExternalEvent;
use App\Models\ExternalTask;
use App\Models\CalendarSource;
use App\Support\ReminderOffsets;
use Illuminate\Http\Request;

class ExternalEventController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:2000',
        ]);

        $owner = (string) ($request->get('calendar_owner') ?? $request->get('sso_user_id'));
        $query = ExternalEvent::where('sso_sub', $owner)
            ->with('source:id,name,color')
            ->orderBy('date_start');
        $this->excludeHiddenCollections($query, $owner);

        if ($request->filled('from')) {
            $query->where(function ($q) use ($request) {
                $q->whereNull('date_end')
                    ->orWhere('date_end', '>=', $request->input('from'));
            });
        }
        if ($request->filled('to')) {
            $query->where(function ($q) use ($request) {
                $q->whereNull('date_start')
                    ->orWhere('date_start', '<=', $request->input('to'));
            });
        }

        $events = $query->limit((int) $request->input('limit', 500))->get();

        return response()->json([
            'events' => $events->map(fn (ExternalEvent $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'date_start' => $e->date_start?->toIso8601String(),
                'date_end' => $e->date_end?->toIso8601String(),
                'time_zone' => $e->time_zone,
                'description' => $e->description,
                'source_name' => $e->source?->name,
                'source_color' => $e->source?->color ?? '#3880ff',
                'reminder_offsets_seconds' => $e->reminder_offsets_seconds ?? [],
                'reminders' => ReminderOffsets::codesForSeconds($e->reminder_offsets_seconds ?? []),
            ]),
        ]);
    }

    public function contacts(Request $request)
    {
        $request->validate(['limit' => 'nullable|integer|min:1|max:2000']);
        $owner = (string) ($request->get('calendar_owner') ?? $request->get('sso_user_id'));
        $query = ExternalContact::where('sso_sub', $owner)
            ->with('source:id,name,color')
            ->orderBy('display_name');
        $this->excludeHiddenCollections($query, $owner);
        $contacts = $query
            ->limit((int) $request->input('limit', 500))
            ->get();

        return response()->json([
            'contacts' => $contacts->map(fn (ExternalContact $c) => [
                'id' => $c->id,
                'display_name' => $c->display_name,
                'email' => $c->email,
                'phone' => $c->phone,
                'source_name' => $c->source?->name,
            ]),
        ]);
    }

    public function tasks(Request $request)
    {
        $request->validate(['limit' => 'nullable|integer|min:1|max:2000']);
        $owner = (string) ($request->get('calendar_owner') ?? $request->get('sso_user_id'));
        $query = ExternalTask::where('sso_sub', $owner)
            ->with('source:id,name,color')
            ->orderBy('due_at');
        $this->excludeHiddenCollections($query, $owner);
        $tasks = $query
            ->limit((int) $request->input('limit', 500))
            ->get();

        return response()->json([
            'tasks' => $tasks->map(fn (ExternalTask $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'status' => $item->status,
                'due_at' => $item->due_at?->toIso8601String(),
                'description' => $item->description,
                'source_name' => $item->source?->name,
                'reminder_offsets_seconds' => $item->reminder_offsets_seconds ?? [],
                'reminders' => ReminderOffsets::codesForSeconds($item->reminder_offsets_seconds ?? []),
            ]),
        ]);
    }

    /**
     * Collections flagged `hidden` on their source must vanish from every
     * external listing (events, contacts, tasks), not only from the calendar.
     */
    private function excludeHiddenCollections(\Illuminate\Database\Eloquent\Builder $query, string $owner): void
    {
        $hiddenBySource = [];
        foreach (CalendarSource::where('sso_sub', $owner)->get(['id', 'collections']) as $src) {
            foreach ($src->collections ?? [] as $collection) {
                if (($collection['hidden'] ?? false) && isset($collection['href'])) {
                    $hiddenBySource[$src->id][] = $collection['href'];
                }
            }
        }
        if (! empty($hiddenBySource)) {
            $query->where(function ($q) use ($hiddenBySource) {
                foreach ($hiddenBySource as $sourceId => $hrefs) {
                    $q->where(function ($qq) use ($sourceId, $hrefs) {
                        $qq->where('calendar_source_id', '!=', $sourceId)
                            ->orWhereNull('collection_href')
                            ->orWhereNotIn('collection_href', $hrefs);
                    });
                }
            });
        }
    }
}