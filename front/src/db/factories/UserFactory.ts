// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { getDB } from '@/db'
import type { UserRecord, EventRecord } from '@/db/schema'

export class UserFactory {
  static async fromLocal(params: { userId: number }): Promise<{ user: UserRecord | null; events: EventRecord[] } | null> {
    const { userId } = params
    const db = getDB()
    const user = await db.users.get(userId)
    if (!user) return null
    const events = await db.events.where('user_id').equals(userId).toArray()
    return { user, events }
  }

  static async fromServer(): Promise<unknown> {
    const { authService } = await import('@/services/authService')
    return authService.getUser()
  }

  static async fromBoth(params: { userId: number }): Promise<{ user: UserRecord | null; events: EventRecord[] }> {
    const { userId } = params
    const [local, server] = await Promise.all([
      UserFactory.fromLocal({ userId }).catch(() => ({ user: null as UserRecord | null, events: [] as EventRecord[] })),
      UserFactory.fromServer().catch(() => null),
    ])
    return {
      user: server?.user ?? local?.user ?? null,
      events: server?.events ?? local!.events,
    }
  }
}
