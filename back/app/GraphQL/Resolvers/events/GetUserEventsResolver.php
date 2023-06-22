<?php

namespace App\GraphQL\Resolvers\events;

use App\Models\Event;
use Carbon\Carbon;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

class GetUserEventsResolver
{
  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    $user = Auth::guard('api')->user();
    if ($user == null) {
      return Error::createLocatedError('Unauthorized');
    }

    $eventsData = Event::all();
    foreach ($eventsData as $event => $value) {
      $value->date_start = Carbon::createFromFormat(
        'Y-m-d H:i:s',
        $value->date_start
      )->format('Y-m-d\TH:i:s.u\Z');

      $value->date_end = Carbon::createFromFormat(
        'Y-m-d H:i:s',
        $value->date_end
      )->format('Y-m-d\TH:i:s.u\Z');
    }

    return ['events' => $eventsData];
  }
}
