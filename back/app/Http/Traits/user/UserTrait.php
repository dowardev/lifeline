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

    Mail::send('emails.emailVerificationEmail', ['token' => $token], function (
      $message
    ) use ($email) {
      $message->to($email);
      $message->from('norepply@dowar.xyz', 'Gonzalo Ponce(Dowar)');
      $message->subject('Email Verification Mail');
    });
  }
}
