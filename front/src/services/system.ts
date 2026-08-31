// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import type { TimeZoneGroup, TimeZoneOption } from '@/utils/interfaces'

export const FALLBACK_TIME_ZONES: string[] = [
  'UTC',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Bogota',
  'America/Lima',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Lisbon',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export function getTimeZoneNames(): string[] {
  if (typeof (Intl as any).supportedValuesOf === 'function') {
    try {
      const zones = (Intl as any).supportedValuesOf('timeZone')
      if (Array.isArray(zones) && zones.length > 0) return zones
    } catch {
      // fall through to the fallback list
    }
  }
  return FALLBACK_TIME_ZONES
}

// Lazily computed and cached offsets (one Intl call per zone, ever)
const timeZoneLabelCache = new Map<string, string>()

function computeTimeZoneLabel(name: string): string {
  let offset = ''
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: name,
      timeZoneName: 'longOffset',
    } as Intl.DateTimeFormatOptions).formatToParts(new Date())
    offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
  } catch {
    // invalid zone: fall back to the plain name
  }
  return offset ? `${offset} · ${name}` : name
}

export function getTimeZoneLabel(name: string): string {
  const cached = timeZoneLabelCache.get(name)
  if (cached) return cached
  const label = computeTimeZoneLabel(name)
  timeZoneLabelCache.set(name, label)
  return label
}

// Real geographic regions used by the IANA identifiers
const REGIONS: string[] = [
  'Africa',
  'America',
  'Antarctica',
  'Arctic',
  'Asia',
  'Atlantic',
  'Australia',
  'Europe',
  'Indian',
  'Pacific',
]

// Group zones by region; drop pseudo/offset zones (Etc/* and bare abbreviations
// like UTC/GMT) which are not real regions — they are still reachable through the search.
export function groupTimeZones(zones: string[]): TimeZoneGroup[] {
  const regional = zones.filter(
    (name) => name.includes('/') && REGIONS.includes(name.split('/')[0]),
  )
  const map = new Map<string, string[]>()
  for (const name of regional) {
    const key = name.split('/')[0]
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(name)
  }
  return Array.from(map.entries())
    .map(([header, names]) => ({ header, zones: names.sort() }))
    .sort((a, b) => a.header.localeCompare(b.header))
}

export function getAllTimeZones(): TimeZoneOption[] {
  return getTimeZoneNames().map((name) => ({ name, label: getTimeZoneLabel(name) }))
}

export function getAllTimeZonesNames(): { names: string[] } {
  return { names: getTimeZoneNames() }
}

export async function copyToClipboard(params: { text: string }): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(params.text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = params.text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}

export default {
  getAllTimeZones,
  getAllTimeZonesNames,
  getTimeZoneLabel,
  getTimeZoneNames,
  groupTimeZones,
  copyToClipboard,
}