<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->title,
            'dateStart' => $this->date_start?->toIso8601String(),
            'dateEnd' => $this->date_end?->toIso8601String(),
            'timeZone' => $this->time_zone,
            'availability' => $this->availability,
            'notifications' => $this->notifications,
            'repeat' => $this->repeat,
            'guests' => $this->guests,
            'description' => $this->description,
            'calendar_id' => $this->calendar_id,
        ];
    }
}
