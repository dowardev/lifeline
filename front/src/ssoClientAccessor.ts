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
