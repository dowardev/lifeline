import { apiClient } from './apiClient'

export const wakaTimeService = {
  getDurations(params: { apiKey: string; date: string }) {
    return apiClient.executeQuery({ url: '/wakatime-durations', params })
  },
}
