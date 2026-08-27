// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { LifeLineDB } from './schema'
import type { AuthUser } from '@/store/authStore'

let instance: LifeLineDB | null = null

export function getDB(): LifeLineDB {
  if (!instance) {
    instance = new LifeLineDB()
  }
  return instance
}

export const db = getDB()

/**
 * Seeds/refreshes the always-present local profile row in `db.users` so local
 * records (events/tasks/documents/notes) can be anchored to a real `user_id`.
 * Uses the same `id` as the persisted local profile for a stable anchor.
 */
export async function seedLocalUser(params: { user: AuthUser }): Promise<void> {
  const { user } = params
  await db.users.put({
    id: user.id,
    name: user.name,
    user_name: user.user_name,
    email: user.email,
    image_profile: user.image_profile,
  })
}
