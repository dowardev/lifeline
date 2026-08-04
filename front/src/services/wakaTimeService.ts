import { apiClient } from './apiClient'

export const wakaTimeService = {
  getDurations(params: { apiKey: string; date: string }): Promise<unknown> {
    return apiClient.executeQuery({ url: '/wakatime-durations', params })
  },
}
