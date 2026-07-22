import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface WakaTimeToday {
  time?: string
}

export const useWakaTimeStore = defineStore('wakaTime', () => {
  const wakaTimeApiKey = ref('')
  const today = ref<WakaTimeToday>({})

  function setApiKey(params: { key: string }) {
    wakaTimeApiKey.value = params.key
  }

  function setToday(params: { today: WakaTimeToday }) {
    today.value = params.today
  }

  function clearApiKey() {
    wakaTimeApiKey.value = ''
    today.value = {}
  }

  return { wakaTimeApiKey, today, setApiKey, setToday, clearApiKey }
})
