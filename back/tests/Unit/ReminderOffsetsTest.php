<?php

namespace Tests\Unit;

use App\Support\ReminderOffsets;
use Illuminate\Foundation\Testing\TestCase;
use Tests\CreatesApplication;

class ReminderOffsetsTest extends TestCase
{
    use CreatesApplication;

    public function testCanonicalHasElevenCodesInTableOrder(): void
    {
        $this->assertSame([
            'at_time', '5m', '10m', '15m', '30m', '1h', '2h', '1d', '2d', '1w', '1mo',
        ], ReminderOffsets::CANONICAL);
    }

    public function testLegacyMapCoversEveryUnambiguousLegacyCode(): void
    {
        $this->assertSame(ReminderOffsets::LEGACY, [
            'just' => 'at_time',
            '5mb' => '5m',
            '10mb' => '10m',
            '15mb' => '15m',
            '30mb' => '30m',
            '1hb' => '1h',
            '2hb' => '2h',
            '1db' => '1d',
            '2db' => '2d',
            '1wb' => '1w',
            '1mtb' => '1mo',
            '1mb' => '1mo',
        ]);
    }

    public function testNormalizeMapsLegacyToCanonicalWithAtTimeFirstClass(): void
    {
        $this->assertSame(['at_time'], ReminderOffsets::normalize(['just']));
        $this->assertSame(['5m', '1mo'], ReminderOffsets::normalize(['5mb', '1mtb', '1mb']));
    }

    public function testNormalizeDropsUnknownAndEmptyCodesWithWarning(): void
    {
        $this->assertSame(['at_time'], ReminderOffsets::normalize(['1smn', '', 'just', 'nonsense']));
    }

    public function testNormalizeCollapsesDuplicates(): void
    {
        $this->assertSame(['5m', '1h'], ReminderOffsets::normalize(['5m', '5m', '5mb', '1h', '1h']));
    }

    public function testNormalizeOrdersOutputByCanonicalTableOrder(): void
    {
        $this->assertSame(['at_time', '5m', '1w', '1mo'], ReminderOffsets::normalize(['1mo', 'at_time', '1w', '5m']));
        $this->assertSame(['at_time', '5m', '2h', '1mo'], ReminderOffsets::normalize(['5mb', '2hb', '1mtb', 'just']));
    }

    public function testIsValidOnlyAcceptsCanonicalCodes(): void
    {
        $this->assertTrue(ReminderOffsets::isValid('at_time'));
        $this->assertTrue(ReminderOffsets::isValid('1mo'));
        $this->assertFalse(ReminderOffsets::isValid('just'));
        $this->assertFalse(ReminderOffsets::isValid('1smn'));
        $this->assertFalse(ReminderOffsets::isValid(''));
    }

    public function testCodeForSecondsMapsEveryFixedOffset(): void
    {
        $this->assertSame('at_time', ReminderOffsets::codeForSeconds(0));
        $this->assertSame('5m', ReminderOffsets::codeForSeconds(300));
        $this->assertSame('10m', ReminderOffsets::codeForSeconds(600));
        $this->assertSame('15m', ReminderOffsets::codeForSeconds(900));
        $this->assertSame('30m', ReminderOffsets::codeForSeconds(1800));
        $this->assertSame('1h', ReminderOffsets::codeForSeconds(3600));
        $this->assertSame('2h', ReminderOffsets::codeForSeconds(7200));
        $this->assertSame('1d', ReminderOffsets::codeForSeconds(86400));
        $this->assertSame('2d', ReminderOffsets::codeForSeconds(172800));
        $this->assertSame('1w', ReminderOffsets::codeForSeconds(604800));
    }

    public function testCodeForSecondsNeverDerivesMonthOrNonCanonicalOffsets(): void
    {
        // 1mo has no fixed second count: a real month varies in length.
        $this->assertNull(ReminderOffsets::codeForSeconds(2592000));
        $this->assertNull(ReminderOffsets::codeForSeconds(2700));
        $this->assertNull(ReminderOffsets::codeForSeconds(-5400));
    }

    public function testCodesForSecondsDropsUnknownDedupesAndOrders(): void
    {
        $this->assertSame(
            ['15m', '1h'],
            ReminderOffsets::codesForSeconds([3600, 900, 2700, 900, '3600'])
        );
        $this->assertSame(
            ['at_time', '5m', '1w'],
            ReminderOffsets::codesForSeconds([604800, 0, 300])
        );
    }

    public function testCodesForSecondsIgnoresNonNumericValues(): void
    {
        $this->assertSame([], ReminderOffsets::codesForSeconds(['nonsense', '', null, ['x']]));
    }
}