// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient'

export const wakaTimeService = {
  getDurations(params: { apiKey: string; date: string }): Promise<unknown> {
    return apiClient.executeQuery({ url: '/wakatime-durations', params })
  },
}
