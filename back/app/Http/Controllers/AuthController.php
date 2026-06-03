<?php

namespace App\Http\Controllers;

use App\Http\Traits\user\UserTrait;
use App\Models\Images;
use App\Models\User;
use App\Models\UserVerify;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use UserTrait;
    public function signup(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'user' => 'required|string',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string',
        ]);

        if (User::where('user', '=', $request->user)->exists()) {
            return response()->json(['message' => 'The user has already been selected'], 422);
        }
        if (User::where('email', '=', $request->email)->exists()) {
            return response()->json(['message' => 'The email has already been selected'], 422);
        }

        $newUser = new User([
            'name' => $request->name,
            'user' => $request->user,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);
        $newUser->save();

        $this->sendVerificationEmail(user_id: $newUser->id, email: $request->email);

        return response()->json(['state' => true], 201);
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

        if (!$userData) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($userData->is_user_disabled) {
            return response()->json(['message' => 'Disabled user'], 403);
        }

        $credentials = [
            'email' => $userData->email,
            'password' => $password,
        ];

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (!$userData->is_email_verified) {
            return response()->json(['message' => 'Unverified email'], 403);
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
        $response = $request->user();

        $image_source = '';
        if ($response->image_id) {
            $image_source = base64_encode(
                Storage::disk('user_images_profile')->get(
                    Images::find($response->image_id)->name
                )
            );
        }

        $calendars = $response->calendars;
        $events = $response->events;

        $user = [
            'id' => $response->id,
            'name' => $response->name,
            'user_name' => $response->user,
            'email' => $response->email,
            'image_profile' => $image_source,
            'calendars' => $calendars,
            'events' => $events,
            'created_at' => $response->created_at,
            'updated_at' => $response->updated_at,
        ];

        return response()->json(['user' => $user]);
    }
    public function verifyAccount($token)
    {
        $verifyUser = UserVerify::where('token', $token)->first();

        $message = 'Tu correo electronico no puede ser identificado.';

        if (!is_null($verifyUser)) {
            $user = $verifyUser->user;

            if (!$user->is_email_verified) {
                $verifyUser->user->is_email_verified = 1;
                $verifyUser->user->save();
                $message = "Tu correo electronico esta verificado. Ya puedes iniciar sesion.";
            } else {
                $message = "Tu correo electronico ya se encontraba verificado.";
            }
        }

        return $message;
    }
}
