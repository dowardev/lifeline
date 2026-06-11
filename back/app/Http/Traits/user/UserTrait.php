<?php

namespace App\Http\Traits\user;

use App\Models\UserVerify;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

trait UserTrait
{
  public function sendVerificationEmail($user_id, $email)
  {
    $token = Str::random(64);

    UserVerify::create([
      'user_id' => $user_id,
      'token' => $token,
    ]);

    try {
      Mail::send('emails.emailVerificationEmail', ['token' => $token], function ($message) use ($email) {
        $message->to($email);
        $message->from(config('mail.from.address', 'noreply@dowar.xyz'), config('mail.from.name', 'LifeLine'));
        $message->subject('Email Verification Mail');
      });
    } catch (\Exception $e) {
      report($e);
    }
  }
}
