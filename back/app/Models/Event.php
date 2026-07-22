<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
  use HasFactory, SoftDeletes;

  protected $fillable = [
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

  protected $casts = [
    'date_start' => 'datetime',
    'date_end' => 'datetime',
    'notifications' => 'array',
    'repeat' => 'array',
    'guests' => 'array',
  ];

  public function tags()
  {
    return $this->belongsToMany(AdminTag::class, 'tags', 'event_id', 'tag_id');
  }

  public function calendar()
  {
    return $this->belongsTo(Calendar::class);
  }

  public function user()
  {
    return $this->belongsTo(User::class);
  }
}
