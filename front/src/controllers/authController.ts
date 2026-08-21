// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { useAuthStore } from '@/store/authStore'
import { getSSOClient } from '@/ssoClientAccessor'

export class AuthController {
  private get store(): ReturnType<typeof useAuthStore> {
    return useAuthStore()
  }

  async loadUser(_params?: any): Promise<any> {
    const ssoClient = getSSOClient()
    if (!ssoClient.isAuthenticated) {
      throw new Error('No autenticado')
    }
    const ssoUser = await ssoClient.getUser()
    if (!ssoUser) {
      throw new Error('No se pudo obtener usuario del SSO')
    }
    const authStore = this.store
    authStore.setFromSso({
      id: Number(ssoUser.id),
      name: ssoUser.name || '',
      user: ssoUser.user || '',
      email: ssoUser.email || '',
    })
    return ssoUser
  }

  async logout(): Promise<void> {
    const ssoClient = getSSOClient()
    await ssoClient.logout()
    this.store.clearAuth()
  }

  isLoggedIn(): boolean {
    return this.store.isLogged
  }

  getCurrentUser(): { userName: string; name: string; imageProfile: string } {
    const u = this.store.user
    if (!u) return { userName: '', name: '', imageProfile: '' }
    return {
      userName: u.user_name || '',
      name: u.name || '',
      imageProfile: u.image_profile || '',
    }
  }
}
