// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

export interface ConnectionCollection {
  href: string
  name: string
  type: string
  subscribed: boolean
  hidden: boolean
  syncing: boolean
}

export interface GoogleConnection {
  id: string
  serverId: number | null
  isOAuth: boolean
  name: string
  icsUrl: string
  color: string
  testing: boolean
  saving: boolean
  syncing: boolean
  discovering: boolean
  collections: ConnectionCollection[]
  testOk: boolean | null
  testResult: string | null
  errorDetail: string | null
}

export interface CaldavConnection {
  id: string
  serverId: number | null
  name: string
  url: string
  username: string
  password: string
  color: string
  testing: boolean
  saving: boolean
  syncing: boolean
  discovering: boolean
  collections: ConnectionCollection[]
  testOk: boolean | null
  testResult: string | null
  errorDetail: string | null
}
