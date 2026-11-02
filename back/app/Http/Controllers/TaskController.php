<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Http\Controllers;

use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Support\ReminderOffsets;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $request->input('per_page', 50);

        $tasks = Task::where('user_id', $request->user()->id)
            ->orderBy('order')
            ->paginate($perPage);

        return TaskResource::collection($tasks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,in_progress,completed',
            'priority' => 'nullable|integer',
            'due_date' => 'nullable|date',
            'subtasks' => 'nullable|json',
            'order' => 'nullable|integer',
            'notifications' => 'nullable|array',
            'notifications.*' => 'string',
            'id_reminders' => 'nullable|array',
            'id_reminders.*' => 'integer',
        ]);
        $task = new Task($request->only(['title', 'description', 'status', 'priority', 'due_date', 'subtasks', 'order', 'notifications', 'id_reminders']));
        if ($request->notifications !== null) {
            $task->notifications = ReminderOffsets::normalize($request->notifications ?? []);
        }
        $task->user_id = $request->user()->id;
        $task->save();

        return response()->json(['task' => new TaskResource($task)], 201);
    }

    public function update(Request $request, $id)
    {
        $task = Task::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,in_progress,completed',
            'priority' => 'nullable|integer',
            'due_date' => 'nullable|date',
            'subtasks' => 'nullable|json',
            'order' => 'nullable|integer',
            'notifications' => 'nullable|array',
            'notifications.*' => 'string',
            'id_reminders' => 'nullable|array',
            'id_reminders.*' => 'integer',
        ]);
        $task->update($request->only(['title', 'description', 'status', 'priority', 'due_date', 'subtasks', 'order', 'notifications', 'id_reminders']));
        if ($request->has('notifications') && $request->notifications !== null) {
            $task->notifications = ReminderOffsets::normalize($request->notifications ?? []);
            $task->save();
        }

        return response()->json(['task' => new TaskResource($task)]);
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $task->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
