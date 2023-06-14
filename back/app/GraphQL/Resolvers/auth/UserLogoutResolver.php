<?php namespace App\GraphQL\Resolvers\auth;

use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Auth;

class UserLogoutResolver
{
  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    try {
      $state = false;
      if (Auth::guard('api')->check()) {
        Auth::guard('api')
          ->user()
          ->token()
          ->revoke();

        $state = true;
      }
      return [
        'state' => $state,
      ];
    } catch (\Throwable $error) {
      $errorPool = app(\Nuwave\Lighthouse\Execution\ErrorPool::class);
      $errorPool->record($error);
    }
  }
}
