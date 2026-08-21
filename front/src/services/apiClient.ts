// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { getSSOClient } from '@/ssoClientAccessor'

export const apiClient = {
  async executeQuery(params: { url: string; params?: Record<string, unknown> }): Promise<unknown> {
    const { url, params: queryParams } = params
    const http = getSSOClient().http
    return http.get(url, { params: queryParams })
  },

  async executeMutation(params: { url: string; data?: Record<string, unknown>; method?: 'POST' | 'PUT' }): Promise<unknown> {
    const { url, data, method = 'POST' } = params
    const http = getSSOClient().http
    if (method === 'PUT') {
      return http.put(url, data)
    }
    return http.post(url, data)
  },

  async executeDelete(params: { url: string }): Promise<unknown> {
    const { url } = params
    const http = getSSOClient().http
    return http.delete(url)
  },
}
