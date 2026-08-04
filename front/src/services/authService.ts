import { apiClient } from './apiClient'

export const authService = {
  logout(): Promise<unknown> {
    return apiClient.executeMutation({ url: '/auth/logout' })
  },

  getUser(): Promise<unknown> {
    return apiClient.executeQuery({ url: '/auth/user' })
  },
}
