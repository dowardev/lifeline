// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { SSOClient } from '@tu-org/sso-client'

let ssoClient: SSOClient | null = null

export function setSSOClient(client: SSOClient): void {
  ssoClient = client
}

/**
 * Non-throwing accessor used by the anonymous/degraded path. Returns null when
 * the SSO client has not been wired up, so callers can decide to fall back to
 * local-only mode instead of crashing.
 */
export function getSSOClientOrNull(): SSOClient | null {
  return ssoClient
}

export function isSSOAvailable(): boolean {
  return ssoClient !== null
}

export function getSSOClient(): SSOClient {
  if (!ssoClient) {
    throw new Error('SSOClient no inicializado. Llama a setSSOClient primero.')
  }
  return ssoClient
}
