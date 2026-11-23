<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Models\CalendarSource;
use App\Models\ExternalContact;
use App\Models\ExternalEvent;
use App\Models\ExternalTask;
use App\Support\ExternalUidHash;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * LBDS-269 / R13 — the unique key of the external tables did not fit MySQL 8.
 *
 * `unique(calendar_source_id, collection_href(1024), external_uid(512))` needs
 * about 6144 bytes, above the 3072-byte InnoDB limit of MySQL 8.
 */
class Lbds269IndexPortabilityTest extends TestCase
{
    use RefreshDatabase;

    private const OWNER = 'test:sub';

    /**
     * @var array<string, array{class: string, old: string, new: string}>
     */
    private const TABLES = [
        'external_events' => [
            'class' => ExternalEvent::class,
            'old' => 'ext_events_source_uid_unique',
            'new' => 'ext_events_source_uidhash_unique',
        ],
        'external_tasks' => [
            'class' => ExternalTask::class,
            'old' => 'ext_tasks_source_uid_unique',
            'new' => 'ext_tasks_source_uidhash_unique',
        ],
        'external_contacts' => [
            'class' => ExternalContact::class,
            'old' => 'ext_contacts_source_uid_unique',
            'new' => 'ext_contacts_source_uidhash_unique',
        ],
    ];

    private function makeSource(): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => self::OWNER,
            'type' => 'caldav',
            'name' => 'Work',
            'url' => encrypt('https://cal.example.com/remote.php/dav'),
        ])->save();

        return $source;
    }

    public function test_identity_hash_is_filled_on_save(): void
    {
        $source = $this->makeSource();

        $task = ExternalTask::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => '/calendars/user/tasks/',
            'external_uid' => 'task-1',
            'title' => 'Task',
        ]);

        $this->assertSame(
            ExternalUidHash::for('/calendars/user/tasks/', 'task-1'),
            $task->uid_hash
        );
    }

    public function test_rows_without_a_collection_keep_a_null_hash(): void
    {
        $source = $this->makeSource();

        $task = ExternalTask::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => null,
            'external_uid' => 'task-1',
            'title' => 'Task',
        ]);

        $this->assertNull($task->uid_hash);
    }

    public function test_the_same_identity_cannot_be_stored_twice(): void
    {
        $source = $this->makeSource();
        $attributes = [
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => '/calendars/user/tasks/',
            'external_uid' => 'task-1',
            'title' => 'Task',
        ];
        ExternalTask::create($attributes);

        $this->expectException(QueryException::class);
        ExternalTask::create($attributes);
    }

    public function test_rows_without_a_collection_may_repeat(): void
    {
        $source = $this->makeSource();
        $attributes = [
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => null,
            'external_uid' => 'task-1',
            'title' => 'Task',
        ];
        ExternalTask::create($attributes);
        ExternalTask::create($attributes);

        // The old composite index never treated two NULL hrefs as equal, and
        // the hash keeps that: a NULL hash never collides either.
        $this->assertSame(2, ExternalTask::where('external_uid', 'task-1')->count());
    }

    #[DataProvider('tables')]
    public function test_the_unique_key_stays_inside_the_mysql8_limit(string $table, string $old, string $new): void
    {
        $indexes = Schema::getIndexes($table);
        $unique = null;
        foreach ($indexes as $index) {
            if ($index['name'] === $new) {
                $unique = $index;
            }
            $this->assertNotSame($old, $index['name'], 'The over-long index is still there.');
        }

        $this->assertNotNull($unique, 'The portable unique index is missing.');
        $this->assertTrue($unique['unique']);
        $this->assertSame(['calendar_source_id', 'uid_hash'], $unique['columns']);

        // utf8mb4 costs 4 bytes per character: an 8-byte bigint plus a
        // 64-character hash is 264 bytes, well inside the 3072-byte limit.
        $bytes = 8 + (64 * 4);
        $this->assertLessThanOrEqual(3072, $bytes);
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: string}>
     */
    public static function tables(): array
    {
        return [
            'events' => ['external_events', 'ext_events_source_uid_unique', 'ext_events_source_uidhash_unique'],
            'tasks' => ['external_tasks', 'ext_tasks_source_uid_unique', 'ext_tasks_source_uidhash_unique'],
            'contacts' => ['external_contacts', 'ext_contacts_source_uid_unique', 'ext_contacts_source_uidhash_unique'],
        ];
    }

    public function test_the_wide_index_is_replaced_on_an_existing_database(): void
    {
        $source = $this->makeSource();
        ExternalTask::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => '/calendars/user/tasks/',
            'external_uid' => 'task-1',
            'title' => 'Task',
        ]);

        // The shape a database created before this change has.
        Schema::table('external_tasks', function (Blueprint $table) {
            $table->unique(['calendar_source_id', 'collection_href', 'external_uid'], 'ext_tasks_source_uid_unique');
        });
        $this->assertTrue(Schema::hasIndex('external_tasks', 'ext_tasks_source_uid_unique'));

        $migration = require database_path('migrations/2026_11_22_000002_add_uid_hash_to_external_tables.php');
        $migration->up();

        $this->assertFalse(Schema::hasIndex('external_tasks', 'ext_tasks_source_uid_unique'));
        $this->assertTrue(Schema::hasIndex('external_tasks', 'ext_tasks_source_uidhash_unique'));
    }

    public function test_legacy_rows_get_their_hash_backfilled(): void
    {
        $source = $this->makeSource();
        // A row written before the migration: the hash is missing.
        DB::table('external_tasks')->insert([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => '/calendars/user/tasks/',
            'external_uid' => 'task-legacy',
            'title' => 'Task',
            'uid_hash' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_11_22_000002_add_uid_hash_to_external_tables.php');
        $migration->up();

        $this->assertSame(
            ExternalUidHash::for('/calendars/user/tasks/', 'task-legacy'),
            DB::table('external_tasks')->where('external_uid', 'task-legacy')->value('uid_hash')
        );
    }
}
