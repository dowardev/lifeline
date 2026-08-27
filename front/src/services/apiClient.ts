// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { getSSOClientOrNull } from '@/ssoClientAccessor'

/**
 * Resolves the HTTP layer from the SSO client when available. When SSO is
 * absent (anonymous/degraded mode), throws a controlled error so the
 * server-first controllers can fall back to the local Dexie store.
 */
function requireHttp(): any {
  const ssoClient = getSSOClientOrNull()
  if (!ssoClient || !ssoClient.http) {
    throw new Error('SSO no disponible: funcionando en modo local')
  }
  return ssoClient.http
}

export const apiClient = {
  async executeQuery(params: { url: string; params?: Record<string, unknown> }): Promise<unknown> {
    const { url, params: queryParams } = params
    const http = requireHttp()
    return http.get(url, { params: queryParams })
  },

  async executeMutation(params: { url: string; data?: Record<string, unknown>; method?: 'POST' | 'PUT' }): Promise<unknown> {
    const { url, data, method = 'POST' } = params
    const http = requireHttp()
    if (method === 'PUT') {
      return http.put(url, data)
    }
    return http.post(url, data)
  },

  async executeDelete(params: { url: string }): Promise<unknown> {
    const { url } = params
    const http = requireHttp()
    return http.delete(url)
  },
}
