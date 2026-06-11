import { apiClient } from './apiClient'

export const authService = {
  login(params: { user: string; password: string }) {
    return apiClient.executeMutation({ url: '/auth/login', data: params })
  },

  signup(params: { name: string; user: string; email: string; password: string }) {
    return apiClient.executeMutation({ url: '/auth/signup', data: params })
  },

  logout() {
    return apiClient.executeMutation({ url: '/auth/logout' })
  },

  getUser() {
    return apiClient.executeQuery({ url: '/auth/user' })
  },
}
