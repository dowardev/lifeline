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
const GUEST_TOKEN_KEY = 'lifeline_guest_token';

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
  try {
    const token = localStorage.getItem(GUEST_TOKEN_KEY);
    if (token) return { 'X-Guest-Id': token };
  } catch {
    // Storage unavailable: fall through to the bootstrap UUID.
  }
  const id = getGuestId();
  return id === '' ? {} : { 'X-Guest-Id': id };
}

let guestTokenRequest: Promise<string | null> | null = null;

/**
 * Fetches the HMAC-signed guest token once per page load (cached in
 * localStorage afterwards). The SSO HttpClient wrapper strips response
 * headers, so the token travels in the body of a dedicated endpoint instead
 * of relying on the `X-Guest-Token` response header.
 */
async function ensureGuestToken(params: { http: any }): Promise<string | null> {
  const { http } = params;
  try {
    const stored = localStorage.getItem(GUEST_TOKEN_KEY);
    if (stored) return stored;
  } catch {
    // Storage unavailable: fall through to a fresh fetch.
  }
  if (!guestTokenRequest) {
    guestTokenRequest = http
      .get('/calendar-sources/guest-token', { headers: guestHeaders() })
      .then((response: unknown) => {
        const token = (response as { token?: unknown } | null)?.token;
        if (typeof token === 'string' && token !== '') {
          try {
            localStorage.setItem(GUEST_TOKEN_KEY, token);
          } catch {
            // Storage unavailable: use it for this page load only.
          }
          return token;
        }
        return null;
      })
      .catch(() => {
        guestTokenRequest = null;
        return null;
      });
  }
  return guestTokenRequest;
}

async function withGuestToken(params: {
  http: any;
  run: (headers: Record<string, string>) => Promise<unknown>;
}): Promise<unknown> {
  const { http, run } = params;
  await ensureGuestToken({ http });
  return run(guestHeaders());
}

export const apiClient = {
  async executeQuery(params: { url: string; params?: Record<string, unknown> }): Promise<unknown> {
    const { url, params: queryParams } = params;
    const http = requireHttp();
    return withGuestToken({
      http,
      run: (headers) => http.get(url, { params: queryParams, headers }),
    });
  },

  async executeMutation(params: {
    url: string;
    data?: Record<string, unknown>;
    method?: 'POST' | 'PUT';
  }): Promise<unknown> {
    const { url, data, method = 'POST' } = params;
    const http = requireHttp();
    if (method === 'PUT') {
      return withGuestToken({
        http,
        run: (headers) => http.put(url, data, { headers }),
      });
    }
    return withGuestToken({
      http,
      run: (headers) => http.post(url, data, { headers }),
    });
  },

  async executeDelete(params: { url: string }): Promise<unknown> {
    const { url } = params;
    const http = requireHttp();
    return withGuestToken({
      http,
      run: (headers) => http.delete(url, { headers }),
    });
  },
};
