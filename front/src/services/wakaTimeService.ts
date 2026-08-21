// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient'

export const wakaTimeService = {
  getDurations(params: { apiKey: string; date: string }): Promise<unknown> {
    return apiClient.executeQuery({ url: '/wakatime-durations', params })
  },
}
