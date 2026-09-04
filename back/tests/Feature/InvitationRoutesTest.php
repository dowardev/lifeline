<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace Tests\Feature;

use App\Models\User;
use Dowardev\SsoServer\Client\SsoServerClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

// The app middleware ResolveSsoUser still type-hints the legacy TuOrg\... name;
// alias it to the shipped Dowardev\... class so the container can type-check
// the mocked client.
if (! class_exists('TuOrg\SsoServer\Client\SsoServerClient')) {
    class_alias(SsoServerClient::class, 'TuOrg\SsoServer\Client\SsoServerClient');
}

/**
 * Route-level guards for guest invitations (LBDS-220):
 *  - event endpoints require SSO auth (no anonymous access),
 *  - no public `/invitations` route exists at all,
 *  - the guest list is capped at 50 entries (422 beyond that).
 *
 * Auth is exercised through the real sso.auth/sso.user middleware stack with a
 * mocked SsoServerClient so no external SSO service is needed.
 */
class InvitationRoutesTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsSsoUser(User $user): void
    {
        $ssoUser = new \Dowardev\SsoServer\Types\SsoUser((string) $user->id);
        $sso = Mockery::mock(SsoServerClient::class);
        $sso->shouldReceive('authenticateRequest')->andReturn($ssoUser);
        $sso->shouldReceive('getId')->andReturn((string) $user->id);
        $sso->shouldReceive('getUser')->andReturn($ssoUser);
        $this->app->instance(SsoServerClient::class, $sso);
        // ResolveSsoUser type-hints a legacy TuOrg\... class name; bind the same
        // mock under that literal name so the container can resolve it.
        $this->app->instance('TuOrg\\SsoServer\\Client\\SsoServerClient', $sso);
    }

    private function makeUser(): User
    {
        $user = new User;
        $user->forceFill([
            'name' => 'Test User',
            'user' => 'testuser',
            'email' => 'owner@example.com',
            'password' => bcrypt('secret'),
        ])->save();

        return $user;
    }

    public function testUnauthenticatedEventCreationIsRejected(): void
    {
        $response = $this->postJson('/api/v1/events', [
            'name' => 'X',
            'dateStart' => '2026-09-02 10:00:00',
            'dateEnd' => '2026-09-02 11:00:00',
            'timeZone' => 'UTC',
            'availability' => 'busy',
        ]);

        $response->assertStatus(401);
    }

    public function testNoPublicInvitationsRouteExists(): void
    {
        $this->assertFalse(\Illuminate\Support\Facades\Route::has('invitations.store'));

        $this->postJson('/api/v1/invitations', [])->assertStatus(404);
        $this->postJson('/api/invitations', [])->assertStatus(404);
    }

    public function testMoreThanFiftyGuestsIsRejectedOnCreate(): void
    {
        $user = $this->makeUser();
        $this->actingAsSsoUser($user);

        $guests = [];
        for ($i = 1; $i <= 51; $i++) {
            $guests[] = "guest{$i}@example.com";
        }

        $response = $this->withHeaders(['Authorization' => 'Bearer fake-token'])
            ->postJson('/api/v1/events', [
                'name' => 'X',
                'dateStart' => '2026-09-02 10:00:00',
                'dateEnd' => '2026-09-02 11:00:00',
                'timeZone' => 'UTC',
                'availability' => 'busy',
                'guests' => $guests,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guests']);
    }

    public function testFiftyGuestsIsAcceptedOnCreate(): void
    {
        $user = $this->makeUser();
        $this->actingAsSsoUser($user);

        $guests = [];
        for ($i = 1; $i <= 50; $i++) {
            $guests[] = "guest{$i}@example.com";
        }

        $response = $this->withHeaders(['Authorization' => 'Bearer fake-token'])
            ->postJson('/api/v1/events', [
                'name' => 'X',
                'dateStart' => '2026-09-02 10:00:00',
                'dateEnd' => '2026-09-02 11:00:00',
                'timeZone' => 'UTC',
                'availability' => 'busy',
                'guests' => $guests,
            ]);

        $response->assertStatus(201);
    }
}
