<?php

namespace App\Http\Controllers;

use App\Http\Resources\CalendarResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\UserResource;
use App\Http\Traits\user\UserTrait;
use App\Models\User;
use App\Models\UserVerify;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    use UserTrait;
    public function signup(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'user' => 'required|string|unique:users,user',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:8',
        ]);

        return DB::transaction(function () use ($request) {
            $newUser = new User([
                'name' => $request->name,
                'user' => $request->user,
                'email' => $request->email,
            ]);
            $newUser->password = bcrypt($request->password);
            $newUser->save();

            $this->sendVerificationEmail(user_id: $newUser->id, email: $request->email);

            return response()->json(['state' => true], 201);
        });
    }
    public function login(Request $request)
    {
        $request->validate([
            'user' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = $request->user;
        $password = $request->password;

        $userData = User::where('user', '=', $user)
            ->orWhere('email', '=', $user)
            ->first();

        if (!$userData || $userData->is_user_disabled || !Auth::attempt(['email' => $userData?->email, 'password' => $password])) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!$userData->is_email_verified) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $userData->createToken('Personal Access Token')->accessToken;

        return response()->json([
            'auth' => [
                'access_token' => $token,
                'token_type' => 'Bearer',
            ],
            'user' => [
                'id' => $userData->id,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $state = false;
        if (Auth::guard('api')->check()) {
            Auth::guard('api')->user()->token()->revoke();
            $state = true;
        }
        return response()->json(['state' => $state]);
    }

    public function user(Request $request)
    {
        $response = $request->user()->load(['calendars', 'events']);

        return response()->json([
            'user' => new UserResource($response),
            'calendars' => CalendarResource::collection($response->calendars),
            'events' => EventResource::collection($response->events),
        ]);
    }
    public function verifyAccount($token)
    {
        return DB::transaction(function () use ($token) {
            $verifyUser = UserVerify::where('token', $token)->first();

            $message = 'Tu correo electronico no puede ser identificado.';

            if (!is_null($verifyUser)) {
                $user = $verifyUser->user;

                if (!$user->is_email_verified) {
                    $user->is_email_verified = 1;
                    $user->save();
                    $verifyUser->delete();
                    $message = "Tu correo electronico esta verificado. Ya puedes iniciar sesion.";
                } else {
                    $message = "Tu correo electronico ya se encontraba verificado.";
                }
            }

            return response()->json(['message' => $message]);
        });
    }
}
