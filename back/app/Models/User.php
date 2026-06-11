<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
  use HasApiTokens, HasFactory, Notifiable;

  /**
   * The attributes that are mass assignable.
   *
   * @var string[]
   */
  protected $fillable = [
    "name",
    "user",
    "email",
  ];

  /**
   * The attributes that should be hidden for serialization.
   *
   * @var array
   */
  protected $hidden = ["password", "remember_token"];

  /**
   * The attributes that should be cast.
   *
   * @var array
   */
  protected $casts = [
    "email_verified_at" => "datetime",
    "is_email_verified" => "boolean",
    "is_admin" => "boolean",
    "is_user_disabled" => "boolean",
  ];

  public function calendars()
  {
    return $this->hasMany(Calendar::class);
  }

  public function events()
  {
    return $this->hasMany(Event::class);
  }

  public function tasks()
  {
    return $this->hasMany(Task::class);
  }

  public function documents()
  {
    return $this->hasMany(Document::class);
  }

  public function notes()
  {
    return $this->hasMany(Note::class);
  }
}
