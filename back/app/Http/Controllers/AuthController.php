<?php

namespace App\Http\Controllers;

use App\Http\Resources\CalendarResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use TuOrg\SsoServer\Facades\SsoAuth;

class AuthController extends Controller
{
    public function logout(Request $request): JsonResponse
    {
        $state = false;

        if (SsoAuth::isAuthenticated()) {
            SsoAuth::logout();
            $state = true;
        }

        return response()->json(['state' => $state]);
    }

    public function user(Request $request): JsonResponse
    {
        $response = $request->user()->load(['calendars', 'events']);

        return response()->json([
            'user' => new UserResource($response),
            'calendars' => CalendarResource::collection($response->calendars),
            'events' => EventResource::collection($response->events),
        ]);
    }
}
