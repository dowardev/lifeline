<?php

namespace App\GraphQL\Resolvers\auth;

use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Auth;
use Exception;
use App\Models\Images;
use Illuminate\Support\Facades\Storage;

class GetUserAuthResolver
{
  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    try {
      $response = Auth::guard('api')->user();
      if ($response == null) {
        throw new Exception('Unauthorized');
      }

      // $image_source = '';
      // if ($response->image_id) {
      //   $image_source = base64_encode(
      //     Storage::disk('user_images_profile')->get(
      //       Images::find($response->image_id)->name
      //     )
      //   );
      // }

      $user = [
        'id' => $response->name,
        'name' => $response->name,
        // 'image_source' => $image_source,
      ];

      return [
        'user' => $user,
      ];
    } catch (Exception $e) {
      throw new Exception($e->getMessage());
    }
  }
}
