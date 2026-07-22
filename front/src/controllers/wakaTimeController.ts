import { wakaTimeService } from '@/services/wakaTimeService'
import { useWakaTimeStore } from '@/store/wakaTimeStore'
import { db } from '@/db'

export class WakaTimeController {
  private get store() {
    return useWakaTimeStore()
  }

  async loadApiKey() {
    const config = await db.config.get('wakatime_api_key')
    if (config) {
      this.store.setApiKey({ key: config.value })
    }
  }

  getApiKey(): string {
    return this.store.wakaTimeApiKey
  }

  async saveApiKey(params: { key: string }) {
    this.store.setApiKey({ key: params.key })
    await db.config.put({ name: 'wakatime_api_key', value: params.key })
  }

  async fetchDurations(params: { date: string; apiKey?: string }) {
    const key = params.apiKey || this.store.wakaTimeApiKey
    if (!key) return
    const response = await wakaTimeService.getDurations({ apiKey: key, date: params.date })
    this.store.setToday({ today: response })
    return response
  }

  async testWakaTimeApiKey(params: { apiKey: string; date?: string }) {
    const date = params.date || new Date().toISOString().substring(0, 10)
    try {
      return await wakaTimeService.getDurations({ apiKey: params.apiKey, date })
    } catch {
      return null
    }
  }

  clearApiKey() {
    this.store.clearApiKey()
    db.config.delete('wakatime_api_key')
  }
}
