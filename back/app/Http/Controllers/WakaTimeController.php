<?php

namespace App\Http\Controllers;

use DateTime;
use Illuminate\Http\Request;
use GuzzleHttp\Client;

class WakaTimeController extends Controller
{
  public function durations(Request $request)
  {
    $api_key = $request->apiKey;
    /* $today = (new DateTime())->format('Y-m-d'); */
    $date = $request->date;

    $client = new Client();
    $response = $client->request(
      'GET',
      'https://wakatime.com/api/v1/users/current/durations',
      [
        'query' => [
          'api_key' => $api_key,
          'date' => $date,
        ],
      ]
    );

    $statusCode = $response->getStatusCode();
    $content = $response->getBody()->getContents();
    return response()->json(json_decode($content, true), $statusCode);
  }
}
