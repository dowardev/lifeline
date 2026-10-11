// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-231 - the LBDS-231 outbox processor needs to talk to the LifeLine
 * backend (not the SSO). Before this refactor, every request went through
 * `ssoClient.http`, which is the HTTP client the SSO package configures
 * for the SSO's own `apiBaseUrl`. That ended up producing the wrong final
 * URL for some calls (the user's IndexedDB outbox captured a series of
 * 405s on both POST /events and PUT /events), and the SSO client has no
 * good way for a downstream consumer to override the base URL it picks.
 *
 * This module now talks to the LifeLine backend directly via `fetch`,
 * prepending `VITE_API_URL` to every call, and pulls the bearer token
 * straight from the SSO's token storage. The guest-token flow for the
 * anonymous path is preserved.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8004/api/v1'

const GUEST_ID_KEY = 'lifeline_guest_id'
const GUEST_TOKEN_KEY = 'lifeline_guest_token'

function getGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? '')) {
      id = crypto.randomUUID()
      localStorage.setItem(GUEST_ID_KEY, id)
    }
    return id ?? ''
  } catch {
    return ''
  }
}

function guestHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem(GUEST_TOKEN_KEY)
    if (token) return { 'X-Guest-Id': token }
  } catch {
    // Storage unavailable: fall through to the bootstrap UUID.
  }
  const id = getGuestId()
  return id === '' ? {} : { 'X-Guest-Id': id }
}

let guestTokenRequest: Promise<string | null> | null = null

async function ensureGuestToken(): Promise<string | null> {
  try {
    const stored = localStorage.getItem(GUEST_TOKEN_KEY)
    if (stored) return stored
  } catch {
    // Storage unavailable: fall through to a fresh fetch.
  }
  if (!guestTokenRequest) {
    guestTokenRequest = fetch(
      `${API_BASE_URL}/calendar-sources/guest-token`,
      { method: 'GET', headers: guestHeaders() },
    )
      .then(async (r) => {
        // M-9 (pre-merge review): reset the in-flight promise on every
        // rejection (network or HTTP), not just on a network error. A
        // 401/403 from the guest-token endpoint otherwise leaves a
        // resolved-to-null Promise cached and every subsequent caller
        // gets null until a page reload.
        guestTokenRequest = null
        if (!r.ok) return null
        const data = (await r.json().catch(() => null)) as { token?: string } | null
        if (data && typeof data.token === 'string' && data.token !== '') {
          try {
            localStorage.setItem(GUEST_TOKEN_KEY, data.token)
          } catch {
            // Storage unavailable: use it for this page load only.
          }
          return data.token
        }
        return null
      })
      .catch(() => {
        guestTokenRequest = null
        return null
      })
  }
  return guestTokenRequest
}

/**
 * Reads the bearer token from the SSO client's storage. The SSO client
 * persists it at `@dowardev/sso-client:token` (raw JWT, not JSON-wrapped).
 * We do not need to round-trip through the SSO HTTP layer; we just read
 * the same key the SSO client wrote.
 */
function readAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('@dowardev/sso-client:token')
    if (raw && raw.length > 0) return raw
  } catch {
    // ignore
  }
  return null
}

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = readAccessToken()
  if (token) return { Authorization: `Bearer ${token}` }
  // No session: fall back to guest flow.
  await ensureGuestToken()
  return guestHeaders()
}

async function doFetch(params: {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: unknown
}): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(await authHeaders()),
  }
  if (params.data !== undefined) headers['Content-Type'] = 'application/json'

  const init: RequestInit = {
    method: params.method,
    headers,
  }
  if (params.data !== undefined && params.method !== 'GET') {
    init.body = JSON.stringify(params.data)
  }
  const res = await fetch(buildUrl(params.url), init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // H-5 / H-8 (pre-merge review): surface a structured error so the
    // outbox processor can match on `cause.status` directly instead of
    // running a regex over a body slice (which produced false positives
    // like "unauthorized access to this resource" triggering the
    // auth-error path on a 5xx).
    const err = new Error(
      `Request failed with status code ${res.status}`,
    ) as Error & { cause?: { status: number; body: string } }
    err.cause = { status: res.status, body: text.slice(0, 200) }
    if (res.status === 401 || res.status === 403) {
      try {
        // H-6 (pre-merge review): tell the auth store the session is
        // gone so the UI can prompt for re-login instead of silently
        // parking every subsequent write as `failed`.
        const authMod = await import('@/store/authStore')
        const store = authMod.useAuthStore()
        store.markAuthExpired()
      } catch {
        // store not available yet (e.g., in tests) — no-op
      }
    }
    throw err
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json().catch(() => null)
  }
  return res.text().catch(() => null)
}

export const apiClient = {
  async executeQuery(params: {
    url: string
    params?: Record<string, unknown>
  }): Promise<unknown> {
    const { url, params: queryParams } = params
    if (queryParams && Object.keys(queryParams).length > 0) {
      const qs = new URLSearchParams(
        Object.entries(queryParams).map(([k, v]) => [k, String(v)]),
      ).toString()
      const sep = url.includes('?') ? '&' : '?'
      return doFetch({ url: `${url}${sep}${qs}`, method: 'GET' })
    }
    return doFetch({ url, method: 'GET' })
  },

  async executeMutation(params: {
    url: string
    data?: Record<string, unknown>
    method?: 'POST' | 'PUT'
  }): Promise<unknown> {
    const method = params.method ?? 'POST'
    return doFetch({ url: params.url, method, data: params.data })
  },

  async executeDelete(params: { url: string }): Promise<unknown> {
    return doFetch({ url: params.url, method: 'DELETE' })
  },
}
