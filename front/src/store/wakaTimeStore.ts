// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface WakaTimeToday {
  time?: string
}

export const useWakaTimeStore = defineStore('wakaTime', () => {
  const wakaTimeApiKey = ref('')
  const today = ref<WakaTimeToday>({})

  function setApiKey(params: { key: string }): void {
    wakaTimeApiKey.value = params.key
  }

  function setToday(params: { today: WakaTimeToday }): void {
    today.value = params.today
  }

  function clearApiKey(): void {
    wakaTimeApiKey.value = ''
    today.value = {}
  }

  return { wakaTimeApiKey, today, setApiKey, setToday, clearApiKey }
})
