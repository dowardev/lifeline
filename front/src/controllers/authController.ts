import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/db'

export class AuthController {
  private get store(): ReturnType<typeof useAuthStore> {
    return useAuthStore()
  }

  async login(params: { user: string; password: string }): Promise<any> {
    const { user, password } = params
    const response = await authService.login({ user, password })
    this.store.setAuth({
      userData: { id: response.user.id, name: '', user_name: '', email: '' },
      accessToken: response.auth.access_token,
    })
    await db.usersLogged.put({ user, token: response.auth.access_token })
    try {
      await this.loadUser()
    } catch {
      // Offline — user data will be populated from local cache next time
    }
    return response
  }

  async signup(params: { name: string; user: string; email: string; password: string }): Promise<any> {
    const response = await authService.signup(params)
    return response
  }

  async logout(): Promise<void> {
    try {
      await authService.logout()
    } finally {
      this.store.clearAuth()
    }
  }

  async loadUser(_params?: any): Promise<any> {
    const response = await authService.getUser()
    this.store.setUser({ userData: response.user })
    return response
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
