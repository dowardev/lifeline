<?php

namespace Database\Seeders;

use App\Models\Calendar;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name' => config('app.admin_name'),
            'user' => 'admin',
            'email' => config('app.admin_email'),
            'is_email_verified' => true,
            'is_admin' => true,
            'password' => Hash::make(config('app.admin_password')),
        ]);

        $adminUser = User::where('email', config('app.admin_email'))->first();

        Calendar::create([
            'name' => 'Personal',
            'user_id' => $adminUser->id,
            'default' => true,
        ]);
    }
}
