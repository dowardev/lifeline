<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
  use HasFactory;

  protected $fillable = [
    'title',
    'calendar_id',
    'time_start',
    'time_end',
    'reminders',
    'repeats',
    'notes',
    'tags',
    'guest',
    'notes',
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
