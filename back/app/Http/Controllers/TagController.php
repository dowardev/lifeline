<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Http\Controllers;

use App\Models\AdminTag;
use App\Models\Event;
use App\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function adminTags(Request $request)
    {
        $tags = AdminTag::all();

        return response()->json(['tags' => $tags]);
    }

    public function attachTag(Request $request, $eventId)
    {
        $event = Event::where('id', $eventId)->where('user_id', $request->user()->id)->firstOrFail();
        $request->validate(['tag_id' => 'required|exists:admin_tags,id']);
        $tag = Tag::firstOrCreate([
            'event_id' => $event->id,
            'tag_id' => $request->tag_id,
        ]);

        return response()->json(['tag' => $tag], 201);
    }

    public function detachTag(Request $request, $eventId, $tagId)
    {
        $event = Event::where('id', $eventId)->where('user_id', $request->user()->id)->firstOrFail();
        Tag::where('event_id', $event->id)->where('tag_id', $tagId)->delete();

        return response()->json(['message' => 'Detached']);
    }
}
