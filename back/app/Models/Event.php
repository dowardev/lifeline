<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
  use HasFactory;

  protected $fillable = [
    'user_id',
    'title',
    'calendar_id',
    'date_start',
    'date_end',
    'notifications',
    'repeat',
    'time_zone',
    'guests',
    'description',
    'availability',
  ];

  public function tags()
  {
    return $this->belongsToMany(AdminTag::class, 'tags', 'event_id', 'tag_id');
  }

  public function calendar()
  {
    return $this->belongsTo(Calendar::class);
  }
}
