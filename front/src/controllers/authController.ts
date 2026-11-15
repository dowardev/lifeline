// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/store/authStore'
import { getSSOClient } from '@/ssoClientAccessor'

export interface CurrentUserView {
  userName: string
  name: string
  imageProfile: string
}

function toCurrentUserView(params: { user: AuthUser | null }): CurrentUserView {
  const { user } = params
  if (!user) return { userName: '', name: '', imageProfile: '' }
  return {
    userName: user.user_name || '',
    name: user.name || '',
    imageProfile: user.image_profile || '',
  }
}

/**
 * Always-available backend. Manages the local anonymous profile so the app is
 * usable with no SSO client at all.
 */
class LocalAuthController {
  private get store(): ReturnType<typeof useAuthStore> {
    return useAuthStore()
  }

  ensureLocalUser(): AuthUser {
    return this.store.ensureLocalUser()
  }

  isAnonymous(): boolean {
    return this.store.isAnonymous
  }

  getCurrentUser(): CurrentUserView {
    return toCurrentUserView({ user: this.store.user })
  }
}

/**
 * Optional backend resolved through the SSO client. All its operations may fail
 * (or throw) when SSO is not configured/unreachable; the facade degrades to local.
 */
class SsoAuthController {
  private get store(): ReturnType<typeof useAuthStore> {
    return useAuthStore()
  }

  async loadUser(): Promise<any> {
    const ssoClient = getSSOClient()
    if (!ssoClient.isAuthenticated) {
      throw new Error('No autenticado')
    }
    const ssoUser = await ssoClient.getUser()
    if (!ssoUser) {
      throw new Error('No se pudo obtener usuario del SSO')
    }
    this.store.setFromSso({
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

  getCurrentUser(): CurrentUserView {
    return toCurrentUserView({ user: this.store.user })
  }
}

/**
 * Public facade. Always seeds a usable local identity, then optionally (and
 * non-fatally) upgrades to an SSO-authenticated session when one is available.
 */
export class AuthController {
  private get store(): ReturnType<typeof useAuthStore> {
    return useAuthStore()
  }

  private local = new LocalAuthController()
  private sso = new SsoAuthController()

  async loadUser(_params?: any): Promise<any> {
    // Always materialize the local anonymous identity first. Never throws.
    this.local.ensureLocalUser()
    // LBDS-231 - try the cached SSO token before contacting the server so
    // a relaunch with no network still lands on a logged-in session.
    const cached = await this.store.restoreCachedAuth()
    if (cached) {
      // We have a cached token; attempt to refresh from SSO. If it fails
      // (offline, expired) we keep the cached session - the SSO layer will
      // surface a 401 on the first request that needs fresh validation,
      // and the outbox processor keeps that op queued for the next flush.
      try {
        return await this.restoreSession()
      } catch {
        return null
      }
    }
    try {
      return await this.restoreSession()
    } catch {
      // SSO unavailable / unauthenticated → anonymous local mode.
      return null
    }
  }

  /**
   * A working session means the queued mutations can be replayed again.
   * Rows parked in `failed` (an expired token parked them) go back to
   * `pending`, otherwise the offline changes made while the session was
   * broken never reach the server.
   */
  private async restoreSession(): Promise<any> {
    const user = await this.sso.loadUser()
    const outbox = await import('@/db/outbox')
    const revived = await outbox.reviveAllFailed()
    if (revived > 0) {
      const processor = await import('@/db/outboxProcessor')
      void processor.flush()
    }
    return user
  }

  async logout(): Promise<void> {
    try {
      await this.sso.logout()
    } catch {
      // No SSO session wired up; nothing remote to tear down.
    }
    // Return to a usable anonymous state. Local data stays (no destructive wipe).
    this.store.clearAuth()
  }

  isLoggedIn(): boolean {
    return this.store.isLogged
  }

  isAnonymous(): boolean {
    return this.local.isAnonymous()
  }

  ensureLocalUser(): AuthUser {
    return this.local.ensureLocalUser()
  }

  getCurrentUser(): CurrentUserView {
    return toCurrentUserView({ user: this.store.user })
  }
}
