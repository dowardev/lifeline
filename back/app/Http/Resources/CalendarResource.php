<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalendarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // LBDS-305 - the `source` block is the bridge between the picker
        // row and the external calendar. The frontend reads `type` to
        // render the kind badge (Google / CalDAV / Suscripción) and
        // `username` to disambiguate two accounts with the same
        // calendar name. The block is null for legacy local rows.
        // F4 - drop the `relationLoaded` guard so the resource never
        // returns `source: null` when `source_id` is set. Laravel will
        // lazy-load the relation if it wasn't eager-loaded, guaranteeing
        // a consistent payload regardless of the caller.
        $source = null;
        if ($this->source_id !== null && $this->source) {
            $source = [
                'id' => $this->source->id,
                'type' => $this->source->type,
                'name' => $this->source->name,
                'color' => $this->source->color,
                'username' => $this->source->username,
            ];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'default' => (bool) $this->default,
            // LBDS-305 - null for local rows; non-null for mirrors. The
            // frontend uses this to group rows and to know whether the
            // row came from a `calendar_sources` lifecycle event.
            'source_id' => $this->source_id,
            'source' => $source,
            // LBDS-305 - ISO 8601 when the source was disconnected, null
            // otherwise. The frontend surfaces a "Fuente desconectada"
            // label for archived rows and keeps them out of the picker's
            // selectable set.
            'archived_at' => $this->archived_at?->toIso8601String(),
            // LBDS-305 - single source of truth for "the picker should
            // offer this row". Mirrors this from `archived_at IS NULL`
            // so the frontend does not have to repeat the check.
            'selectable' => $this->archived_at === null,
        ];
    }
}
