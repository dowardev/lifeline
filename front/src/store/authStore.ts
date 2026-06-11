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

  function setAuth(params: { userData: AuthUser; accessToken: string }) {
    user.value = params.userData
    token.value = params.accessToken
    isLogged.value = true
  }

  function setUser(params: { userData: AuthUser }) {
    user.value = params.userData
    isLogged.value = true
  }

  function setToken(params: { accessToken: string }) {
    token.value = params.accessToken
  }

  function clearAuth() {
    user.value = null
    token.value = ''
    isLogged.value = false
  }

  return { user, token, isLogged, setAuth, setUser, setToken, clearAuth }
})
