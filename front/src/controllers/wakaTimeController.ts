// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { wakaTimeService } from '@/services/wakaTimeService'
import { useWakaTimeStore } from '@/store/wakaTimeStore'
import { db } from '@/db'

export class WakaTimeController {
  private get store(): ReturnType<typeof useWakaTimeStore> {
    return useWakaTimeStore()
  }

  async loadApiKey(): Promise<void> {
    const config = await db.config.get('wakatime_api_key')
    if (config) {
      this.store.setApiKey({ key: config.value })
    }
  }

  getApiKey(): string {
    return this.store.wakaTimeApiKey
  }

  async saveApiKey(params: { key: string }): Promise<void> {
    this.store.setApiKey({ key: params.key })
    await db.config.put({ name: 'wakatime_api_key', value: params.key })
  }

  async fetchDurations(params: { date: string; apiKey?: string }): Promise<unknown> {
    const key = params.apiKey || this.store.wakaTimeApiKey
    if (!key) return undefined
    const response = await wakaTimeService.getDurations({ apiKey: key, date: params.date })
    this.store.setToday({ today: response })
    return response
  }

  async testWakaTimeApiKey(params: { apiKey: string; date?: string }): Promise<unknown> {
    const date = params.date || new Date().toISOString().substring(0, 10)
    try {
      return await wakaTimeService.getDurations({ apiKey: params.apiKey, date })
    } catch {
      return null
    }
  }

  clearApiKey(): void {
    this.store.clearApiKey()
    db.config.delete('wakatime_api_key')
  }
}
