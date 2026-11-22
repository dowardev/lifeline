// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient'

/** One entry of the WakaTime `/users/current/durations` payload. */
export interface WakaTimeDuration {
  time: number
  duration: number
  project?: string
  language?: string
}

/**
 * Response of the WakaTime durations endpoint. The backend proxies the
 * upstream payload verbatim, so the total is read from `total_seconds`.
 */
export interface WakaTimeDurationsResponse {
  total_seconds?: number
  data?: WakaTimeDuration[]
}

export const wakaTimeService = {
  getDurations(params: { apiKey: string; date: string }): Promise<WakaTimeDurationsResponse> {
    return apiClient.executeQuery({
      url: '/wakatime-durations',
      params,
    }) as Promise<WakaTimeDurationsResponse>
  },
}
