<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Controllers;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Http\Request;

class WakaTimeController extends Controller
{
    public function durations(Request $request)
    {
        $request->validate([
            'apiKey' => 'required|string|min:36|max:64',
            'date' => 'required|date_format:Y-m-d',
        ]);

        $client = new Client(['timeout' => 10]);

        try {
            $response = $client->request(
                'GET',
                'https://wakatime.com/api/v1/users/current/durations',
                [
                    'headers' => [
                        'Authorization' => 'Bearer '.$request->apiKey,
                    ],
                    'query' => [
                        'date' => $request->date,
                    ],
                ]
            );

            return response()->json(
                json_decode($response->getBody()->getContents(), true),
                $response->getStatusCode()
            );
        } catch (RequestException $e) {
            $statusCode = $e->getResponse()?->getStatusCode() ?? 502;

            return response()->json([
                'message' => 'WakaTime API request failed',
            ], $statusCode);
        } catch (ConnectException $e) {
            return response()->json([
                'message' => 'Unable to connect to WakaTime API',
            ], 503);
        }
    }
}
