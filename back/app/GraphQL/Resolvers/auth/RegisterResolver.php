<?php

namespace App\GraphQL\Resolvers\auth;

use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use App\Models\User;
use Illuminate\Support\Str;
use App\Models\UserVerify;
use Illuminate\Support\Facades\Mail;
use Exception;
use App\Http\Traits\user\UserTrait;

class RegisterResolver
{
  use UserTrait;

  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    $name = $args['name'];
    $user = $args['user'];
    $email = $args['email'];
    $password = $args['password'];

    if ($name == '' || $name == 'null') {
      throw new Exception('Name is required');
    }
    if ($user == '' || $user == 'null') {
      throw new Exception('User is required');
    }
    if ($email == '' || $email == 'null') {
      throw new Exception('Email is required');
    }
    if ($password == '' || $password == 'null') {
      throw new Exception('Password is required');
    }
    if (count(User::where('user', '=', $user)->get())) {
      throw new Exception('The user has already been selected');
    }
    if (count(User::where('email', '=', $email)->get())) {
      throw new Exception('The email has already been selected');
    }

    $newUser = new User([
      'name' => $name,
      'user' => $user,
      'email' => $email,
      'password' => bcrypt($args['password']),
    ]);
    $newUser->save();

    $this->sendVerificationEmail(user_id: $newUser->id, email: $email);
  }
}
