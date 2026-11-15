// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-231 - offline rows carry two shapes of id.
 *
 * A row that the server owns has a numeric id; a row created while
 * offline carries a tempId string ('tmp-<uuid>') until the reconciler
 * replaces it with the server id. FullCalendar also hands ids back as
 * strings, so the same row can be referenced as `42` and as `'42'`.
 *
 * Every id comparison must therefore be type insensitive, and no id may
 * be coerced through parseInt: `parseInt('tmp-abc', 10)` is NaN, and a
 * NaN id never matches any row, which leaves the update modal with no
 * event to render.
 */

/** True when both values point at the same row, ignoring the type. */
export function sameEntityId(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

/**
 * Normalizes an id coming from the UI layer without coercing it.
 * The raw value is returned so a tempId survives as a tempId.
 */
export function resolveEntityId(rawId: string | number): string | number {
  return rawId;
}

/**
 * True when the id belongs to a row the server already owns.
 *
 * The session state must NOT take part in this decision: a row created
 * online keeps its server id even when the session expires (or was never
 * established), and the mutation still has to be queued so it reaches the
 * server once the session is back. Treating "no session" as "local only"
 * silently dropped every offline edit: the change showed up in the UI and
 * was never sent.
 *
 * Only a row without a server id (a tempId from an offline create) is
 * local-only.
 */
export function isServerOwnedId(id: string | number | null | undefined): boolean {
  if (id === null || id === undefined) return false;
  if (typeof id === 'number') return Number.isFinite(id) && id >= 0;
  return /^\d+$/.test(id.trim());
}
