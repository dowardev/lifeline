<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\User::factory()->create([
            'name' => config('app.admin_name'),
            'user' => 'admin',
            'email' => config('app.admin_email'),
            'is_email_verified' => true,
            'is_admin' => true,
            'password' => Hash::make(config('app.admin_password')),
        ]);

        $adminUser = \App\Models\User::where('email', config('app.admin_email'))->first();

        \App\Models\Calendar::create([
            'name' => 'Personal',
            'user_id' => $adminUser->id,
            'default' => true,
        ]);
    }
}
