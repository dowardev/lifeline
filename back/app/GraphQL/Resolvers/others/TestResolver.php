<?php

namespace App\GraphQL\Resolvers\others;

use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use App\Http\Traits\user\UserTrait;

class TestResolver
{
  use UserTrait;

  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    // return $this->sendVerificationEmail(param2: 2, param1: 1);
  }
}
