<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
  use HasFactory;

  protected $fillable = [
    'title',
    'time_start',
    'time_end',
    'reminders',
    'repeats',
    'calendar',
    'notes',
    'tags',
    'tasks',
    'khanban',
  ];
}
