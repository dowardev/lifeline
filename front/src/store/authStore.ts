// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AuthUser {
  id: number
  name: string
  user_name: string
  email: string
  image_profile?: string
}

const LOCAL_USER_STORAGE_KEY = 'lifeline_local_user'
const LOCAL_DISPLAY_NAME = 'Usuario local'

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
  }

  function setAuth(params: { userData: AuthUser; accessToken: string }): void {
    user.value = params.userData
    token.value = params.accessToken
    isLogged.value = true
    isAnonymous.value = false
  }

  function setUser(params: { userData: AuthUser }): void {
    user.value = params.userData
    isLogged.value = true
    isAnonymous.value = false
  }

  function setToken(params: { accessToken: string }): void {
    token.value = params.accessToken
  }

  function clearAuth(): void {
    token.value = ''
    isLogged.value = false
    isAnonymous.value = true
    // Reset to a usable anonymous state (never a null dead-end).
    ensureLocalUser()
  }

  function setFromSso(params: { id: number; name: string; user: string; email: string }): void {
    user.value = {
      id: params.id,
      name: params.name,
      user_name: params.user,
      email: params.email,
    }
    isLogged.value = true
    isAnonymous.value = false
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
  }
})
