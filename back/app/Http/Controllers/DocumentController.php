<?php

namespace App\Http\Controllers;

use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $request->input('per_page', 50);

        $documents = Document::where('user_id', $request->user()->id)
            ->orderBy('order')
            ->paginate($perPage);

        return DocumentResource::collection($documents);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'nullable|in:note,list,richtext,todo',
            'content' => 'nullable|json',
            'order' => 'nullable|integer',
        ]);
        $document = new Document($request->only(['title', 'type', 'content', 'order']));
        $document->user_id = $request->user()->id;
        $document->save();

        return response()->json(['document' => new DocumentResource($document)], 201);
    }

    public function update(Request $request, $id)
    {
        $document = Document::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $request->validate([
            'title' => 'nullable|string|max:255',
            'type' => 'nullable|in:note,list,richtext,todo',
            'content' => 'nullable|json',
            'order' => 'nullable|integer',
        ]);
        $document->update($request->only(['title', 'type', 'content', 'order']));

        return response()->json(['document' => new DocumentResource($document)]);
    }

    public function destroy(Request $request, $id)
    {
        $document = Document::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $document->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
