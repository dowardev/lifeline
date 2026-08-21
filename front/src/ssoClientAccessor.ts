// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { SSOClient } from '@tu-org/sso-client'

let ssoClient: SSOClient | null = null

export function setSSOClient(client: SSOClient): void {
  ssoClient = client
}

export function getSSOClient(): SSOClient {
  if (!ssoClient) {
    throw new Error('SSOClient no inicializado. Llama a setSSOClient primero.')
  }
  return ssoClient
}
