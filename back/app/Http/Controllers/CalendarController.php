<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CalendarController extends Controller
{
  public function getCalendars(Request $request)
  {
    $calendars = DB::table('calendars')
      ->select('id', 'name')
      ->get();

    return response()->json($calendars, 200);
  }
}
