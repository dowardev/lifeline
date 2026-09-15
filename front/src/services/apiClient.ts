// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { getSSOClientOrNull } from '@/ssoClientAccessor';

/**
 * Resolves the HTTP layer from the SSO client when available. When SSO is
 * absent (anonymous/degraded mode), throws a controlled error so the
 * server-first controllers can fall back to the local Dexie store.
 */
function requireHttp(): any {
  const ssoClient = getSSOClientOrNull();
  if (!ssoClient || !ssoClient.http) {
    throw new Error('SSO no disponible: funcionando en modo local');
  }
  return ssoClient.http;
}

const GUEST_ID_KEY = 'lifeline_guest_id';

function getGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? '')) {
      id = crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id ?? '';
  } catch {
    return '';
  }
}

function guestHeaders(): Record<string, string> {
  const id = getGuestId();
  return id === '' ? {} : { 'X-Guest-Id': id };
}

export const apiClient = {
  async executeQuery(params: { url: string; params?: Record<string, unknown> }): Promise<unknown> {
    const { url, params: queryParams } = params;
    const http = requireHttp();
    return http.get(url, { params: queryParams, headers: guestHeaders() });
  },

  async executeMutation(params: {
    url: string;
    data?: Record<string, unknown>;
    method?: 'POST' | 'PUT';
  }): Promise<unknown> {
    const { url, data, method = 'POST' } = params;
    const http = requireHttp();
    if (method === 'PUT') {
      return http.put(url, data, { headers: guestHeaders() });
    }
    return http.post(url, data, { headers: guestHeaders() });
  },

  async executeDelete(params: { url: string }): Promise<unknown> {
    const { url } = params;
    const http = requireHttp();
    return http.delete(url, { headers: guestHeaders() });
  },
};
