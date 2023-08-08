<?php

namespace App\GraphQL\Resolvers\events;

use App\Models\AdminTag;
use App\Models\Calendar;
use App\Models\Event;
use App\Models\Tag;
use Carbon\Carbon;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeleteEventResolver
{
  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    $response = Auth::guard('api')->user();
    if ($response == null) {
      return Error::createLocatedError('Unauthorized');
    }

    $id = $args['id'];
    $event = Event::find($id);
    $event->delete();
  }
}
