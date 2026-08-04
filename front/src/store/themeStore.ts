import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ThemeState {
  selected: string
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeState>({ selected: 'light' })

  function setTheme(params: { theme: ThemeState }): void {
    theme.value = params.theme
  }

  return { theme, setTheme }
})
