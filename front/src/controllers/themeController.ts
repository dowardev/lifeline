// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { useThemeStore } from '@/store/themeStore'
import { db } from '@/db'

const THEME_MIGRATIONS: Record<string, string> = {
  gruvbox: 'catppuccin-macchiato-maroon',
  nord: 'catppuccin-latte-maroon',
  cherry: 'catppuccin-macchiato-maroon',
}

export class ThemeController {
  private get store(): ReturnType<typeof useThemeStore> {
    return useThemeStore()
  }

  async loadTheme(): Promise<void> {
    const config = await db.config.get('theme')
    if (config) {
      const migrated = THEME_MIGRATIONS[config.value] || config.value
      if (migrated !== config.value) {
        await db.config.put({ name: 'theme', value: migrated })
      }
      this.store.setTheme({ theme: { selected: migrated } })
      this.applyTheme({ theme: migrated })
    }
  }

  async setTheme(params: { theme: string }): Promise<void> {
    this.store.setTheme({ theme: { selected: params.theme } })
    this.applyTheme({ theme: params.theme })
    await db.config.put({ name: 'theme', value: params.theme })
  }

  getTheme(): string {
    return this.store.theme.selected
  }

  applyTheme(params: { theme: string }): void {
    const { theme } = params
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    document.body.classList.remove('dark', 'catppuccin-latte-maroon', 'catppuccin-macchiato-maroon')

    if (theme === 'catppuccin-latte-maroon' || theme === 'catppuccin-macchiato-maroon') {
      document.body.classList.add(theme)
    } else {
      const isDark = theme === 'dark' || (theme === 'auto' && prefersDark)
      document.body.classList.toggle('dark', isDark)
    }
  }

  setupThemeListener(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
      const theme = this.getTheme()
      if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.body.classList.toggle('dark', isDark)
      }
    })
  }
}
