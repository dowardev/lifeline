<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Calendar;
use Illuminate\Support\Facades\Auth;

class CalendarController extends Controller
{
    public function getCalendars(Request $request)
    {
        $user = Auth::guard('api')->user();
        if ($user == null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $calendars = Calendar::where('user_id', $user->id)
            ->select('id', 'name', 'default')
            ->get();

        return response()->json(['calendars' => $calendars]);
    }
}
