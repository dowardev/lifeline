<?php

namespace App\GraphQL\Resolvers\events;

use App\Models\Calendar;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;

class GetCalendarsResolver
{
  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    $calendars = DB::table('calendars')
      ->select('id', 'name')
      ->get()[0];

    return [
      'calendars' => [
        [
          'id' => $calendars->id,
          'name' => $calendars->name,
        ],
      ],
    ];
  }
}
