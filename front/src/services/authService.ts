import { apiClient } from './apiClient'

export const authService = {
  logout() {
    return apiClient.executeMutation({ url: '/auth/logout' })
  },

  getUser() {
    return apiClient.executeQuery({ url: '/auth/user' })
  },
}
