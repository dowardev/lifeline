<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = ['event_id', 'tag_id'];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function adminTag()
    {
        return $this->belongsTo(AdminTag::class, 'tag_id');
    }
}
