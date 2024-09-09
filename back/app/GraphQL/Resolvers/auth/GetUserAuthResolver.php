<?php

namespace App\GraphQL\Resolvers\auth;

use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Auth;
use Exception;
use App\Models\Images;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use GraphQL\Error\Error;

class GetUserAuthResolver
{
  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    try {
      $response = Auth::guard("api")->user();
      if ($response == null) {
        return Error::createLocatedError("Unauthorized");
      }

      $image_source = "";
      if ($response->image_id) {
        $image_source = base64_encode(
          Storage::disk("user_images_profile")->get(
            Images::find($response->image_id)->name
          )
        );
      }

      $user_id = Auth::user()->id;

      $calendars = User::find($user_id)->calendars;
      $events = User::find($user_id)->events;

      $user = [
        "id" => $response->id,
        "name" => $response->name,
        "user_name" => $response->user,
        "email" => $response->email,
        "image_profile" => $image_source,
        "calendars" => $calendars,
        "events" => $events,
        "created_at" => $response->created_at,
        "updated_at" => $response->updated_at,
      ];

      return [
        "user" => $user,
      ];
    } catch (Exception $e) {
      throw new Exception($e->getMessage());
    }
  }
}
