<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminTag extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function tags()
    {
        return $this->hasMany(Tag::class, 'tag_id');
    }
}
