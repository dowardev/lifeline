// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

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
