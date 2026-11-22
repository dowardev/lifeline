// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'

export interface AuthUser {
  id: number
  name: string
  user_name: string
  email: string
  image_profile?: string
}

const LOCAL_USER_STORAGE_KEY = 'lifeline_local_user'
const LOCAL_DISPLAY_NAME = 'Usuario local'
const TOKEN_DEDICATED_KEY = 'auth_cached_token'

function generateLocalId(): number {
  // Positive integer id for the local profile. Unique per client and persisted,
  // so it stays stable across reloads without needing the server.
  const rand = crypto.getRandomValues(new Uint32Array(1))[0]
  return (rand % 0x7fffffff) + 1
}

function loadStoredLocalUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (typeof parsed?.id !== 'number' || !parsed?.name) return null
    return parsed
  } catch {
    return null
  }
}

function persistLocalUser(params: { user: AuthUser }): void {
  try {
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(params.user))
  } catch (error) {
    console.warn('[authStore] failed to persist local user', error)
  }
}

/**
 * LBDS-231 - persists the SSO bearer token so a relaunch without network
 * still lands on a logged-in session. The token is also kept in
 * `db.tokens` so it follows the same offline-first guarantees as every
 * other piece of user state. Logout wipes both copies.
 */
async function persistToken(params: { userId: number; token: string }): Promise<void> {
  const { userId, token } = params
  if (!token) return
  try {
    await db.tokens.put({ user_id: userId, name: 'sso', token })
  } catch (error) {
    console.warn('[authStore] failed to persist token', error)
  }
  try {
    localStorage.setItem(TOKEN_DEDICATED_KEY, token)
  } catch {
    // ignore storage failures
  }
}

async function loadCachedToken(): Promise<{ userId: number; token: string } | null> {
  try {
    const fromDb = await db.tokens.where('name').equals('sso').last()
    if (fromDb?.token) {
      return { userId: fromDb.user_id, token: fromDb.token }
    }
  } catch {
    // fall through to localStorage
  }
  try {
    const raw = localStorage.getItem(TOKEN_DEDICATED_KEY)
    if (raw) return { userId: 0, token: raw }
  } catch {
    // ignore
  }
  return null
}

async function clearCachedToken(): Promise<void> {
  try {
    await db.tokens.where('name').equals('sso').delete()
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(TOKEN_DEDICATED_KEY)
  } catch {
    // ignore
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const localUser = ref<AuthUser | null>(loadStoredLocalUser())
  const token = ref('')
  const isLogged = ref(false)
  // The app is always usable. `isAnonymous` means "no cloud/SSO session", and a
  // local profile is always materialized rather than leaving a null dead-end.
  const isAnonymous = ref(true)

  function ensureLocalUser(): AuthUser {
    if (!localUser.value) {
      const id = generateLocalId()
      const created: AuthUser = {
        id,
        name: LOCAL_DISPLAY_NAME,
        user_name: `local_${id}`,
        email: '',
        image_profile: '',
      }
      localUser.value = created
      persistLocalUser({ user: created })
    }
    // While anonymous, the effective user IS the local profile.
    if (isAnonymous.value) {
      user.value = localUser.value
    }
    return localUser.value
  }

  function setLocalUser(params: { userData: AuthUser }): void {
    localUser.value = params.userData
    persistLocalUser({ user: params.userData })
    if (isAnonymous.value) {
      user.value = params.userData
    }
  }

  function clearLocalUser(): void {
    localUser.value = null
    user.value = null
    isAnonymous.value = true
    isLogged.value = false
    token.value = ''
    try {
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY)
    } catch {
      // ignore storage failures
    }
    void clearCachedToken()
  }

  function setAuth(params: { userData: AuthUser; accessToken: string }): void {
    user.value = params.userData
    token.value = params.accessToken
    isLogged.value = true
    isAnonymous.value = false
    void persistToken({ userId: params.userData.id, token: params.accessToken })
  }

  function setUser(params: { userData: AuthUser }): void {
    user.value = params.userData
    isLogged.value = true
    isAnonymous.value = false
  }

  function setToken(params: { accessToken: string }): void {
    token.value = params.accessToken
    // Persist under the active user; ensureLocalUser guarantees one exists.
    const userId = user.value?.id ?? ensureLocalUser().id
    void persistToken({ userId, token: params.accessToken })
  }

  function clearAuth(): void {
    token.value = ''
    isLogged.value = false
    isAnonymous.value = true
    // Reset to a usable anonymous state (never a null dead-end).
    ensureLocalUser()
    void clearCachedToken()
  }

  function setFromSso(params: { id: number; name: string; user: string; email: string }): void {
    const next: AuthUser = {
      id: params.id,
      name: params.name,
      user_name: params.user,
      email: params.email,
    }
    user.value = next
    isLogged.value = true
    isAnonymous.value = false
    // Persist the local profile mirror so offline reads still anchor to a
    // known id (the controllers stamp this id into Dexie rows they create
    // while the server is unreachable).
    persistLocalUser({ user: next })
  }

  /**
   * LBDS-231 - hydrates the cached SSO token from Dexie / localStorage on
   * app launch. Does NOT touch the SSO client itself: that layer owns its
   * own storage and will pick up the same token once the SSO SDK
   * initializes. Returning `false` means "no cached session, stay
   * anonymous"; callers must NOT throw on `false` - anonymous is a valid
   * state.
   */
  async function restoreCachedAuth(): Promise<boolean> {
    const cached = await loadCachedToken()
    if (!cached) return false
    if (!cached.token) return false
    token.value = cached.token
    isLogged.value = true
    isAnonymous.value = false
    if (cached.userId > 0) {
      user.value = {
        id: cached.userId,
        name: user.value?.name ?? '',
        user_name: user.value?.user_name ?? '',
        email: user.value?.email ?? '',
        image_profile: user.value?.image_profile,
      }
    }
    return true
  }

  return {
    user,
    localUser,
    token,
    isLogged,
    isAnonymous,
    ensureLocalUser,
    setLocalUser,
    clearLocalUser,
    setAuth,
    setUser,
    setToken,
    clearAuth,
    setFromSso,
    restoreCachedAuth,
    markAuthExpired: (): void => {
      // H-6 (pre-merge review): the apiClient flips this when it sees
      // a 401/403 from a real call. The UI can watch the flag and prompt
      // the user to re-login. The session itself is cleared by the
      // explicit `clearAuth` call from the login screen, not here.
      if (isLogged.value) {
        isLogged.value = false
        isAnonymous.value = true
      }
    },
  }
})
