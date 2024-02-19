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

class CreateEventResolver
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

    $user_id = Auth::guard('api')->user()->id;
    $title = $args['name'];
    $date_start = $args['dateStart'];
    $date_end = $args['dateEnd'];
    $notifications = $args['notifications'];
    $repeat = $args['repeat'];
    $time_zone = $args['timeZone'];
    $description = $args['description'];
    $availability = $args['availability'];
    $guests = $args['guests'];

    $event = null;
    $event = new Event();
    $event->user_id = $user_id;
    $event->title = $title;
    $event->guests = $guests;
    $event->time_zone = $time_zone;
    $event->description = $description;
    $event->availability = $availability;
    $event->date_start = Carbon::createFromFormat(
      'Y-m-d\TH:i:s.u\Z',
      $date_start
    );
    $event->date_end = Carbon::createFromFormat('Y-m-d\TH:i:s.u\Z', $date_end);
    $event->notifications = $notifications;
    $event->repeat = $repeat;
    $event->save();

    $idDB=$event->id;

    return [
      'id' => $idDB,
    ];
  }
}
