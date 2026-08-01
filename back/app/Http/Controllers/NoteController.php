<?php

namespace App\Http\Controllers;

use App\Http\Resources\NoteResource;
use App\Models\Document;
use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $request->input('per_page', 50);

        $notes = Note::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return NoteResource::collection($notes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'document_id' => 'nullable|integer|exists:documents,id',
            'reminder' => 'nullable|date',
        ]);

        if ($request->document_id) {
            $document = Document::where('id', $request->document_id)
                ->where('user_id', $request->user()->id)
                ->first();
            if (! $document) {
                return response()->json(['message' => 'Document not found'], 404);
            }
        }

        $note = new Note($request->only(['title', 'content', 'document_id', 'reminder']));
        $note->user_id = $request->user()->id;
        $note->save();

        return response()->json(['note' => new NoteResource($note)], 201);
    }

    public function update(Request $request, $id)
    {
        $note = Note::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'document_id' => 'nullable|integer|exists:documents,id',
            'reminder' => 'nullable|date',
        ]);

        if ($request->document_id) {
            $document = Document::where('id', $request->document_id)
                ->where('user_id', $request->user()->id)
                ->first();
            if (! $document) {
                return response()->json(['message' => 'Document not found'], 404);
            }
        }

        $note->update($request->only(['title', 'content', 'document_id', 'reminder']));

        return response()->json(['note' => new NoteResource($note)]);
    }

    public function destroy(Request $request, $id)
    {
        $note = Note::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $note->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
