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

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref('')
  const isLogged = ref(false)

  function setAuth(params: { userData: AuthUser; accessToken: string }): void {
    user.value = params.userData
    token.value = params.accessToken
    isLogged.value = true
  }

  function setUser(params: { userData: AuthUser }): void {
    user.value = params.userData
    isLogged.value = true
  }

  function setToken(params: { accessToken: string }): void {
    token.value = params.accessToken
  }

  function clearAuth(): void {
    user.value = null
    token.value = ''
    isLogged.value = false
  }

  function setFromSso(params: { id: number; name: string; user: string; email: string }): void {
    user.value = {
      id: params.id,
      name: params.name,
      user_name: params.user,
      email: params.email,
    }
    isLogged.value = true
  }

  return { user, token, isLogged, setAuth, setUser, setToken, clearAuth, setFromSso }
})
