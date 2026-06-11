import axios, { type AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/authStore'
import router from '@/router'

let client: AxiosInstance | null = null
let isRedirecting = false

function getClient(): AxiosInstance {
  if (client) return client

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8004/api/v1'

  client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !isRedirecting) {
        isRedirecting = true
        const authStore = useAuthStore()
        authStore.clearAuth()
        await router.push('/login')
        isRedirecting = false
      }

      if (!error.response) {
        console.error('[apiClient] Network error - server unreachable')
      }

      return Promise.reject(error)
    },
  )

  return client
}

export const apiClient = {
  async executeQuery(params: { url: string; params?: Record<string, unknown> }): Promise<unknown> {
    const { url, params: queryParams } = params
    const response = await getClient().get(url, { params: queryParams })
    return response.data
  },

  async executeMutation(params: { url: string; data?: Record<string, unknown>; method?: 'POST' | 'PUT' }): Promise<unknown> {
    const { url, data, method = 'POST' } = params
    const response = await getClient().request({ url, data, method })
    return response.data
  },

  async executeDelete(params: { url: string }): Promise<unknown> {
    const { url } = params
    const response = await getClient().delete(url)
    return response.data
  },
}
