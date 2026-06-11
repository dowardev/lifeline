import { useThemeStore } from '@/store/themeStore'
import { db } from '@/db'

export class ThemeController {
  private get store() {
    return useThemeStore()
  }

  async loadTheme() {
    const config = await db.config.get('theme')
    if (config) {
      this.store.setTheme({ theme: { selected: config.value } })
      this.applyTheme({ theme: config.value })
    }
  }

  async setTheme(params: { theme: string }) {
    this.store.setTheme({ theme: { selected: params.theme } })
    this.applyTheme({ theme: params.theme })
    await db.config.put({ name: 'theme', value: params.theme })
  }

  getTheme(): string {
    return this.store.theme.selected
  }

  applyTheme(params: { theme: string }) {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(params.theme)
  }
}
