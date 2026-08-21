// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { LifeLineDB } from './schema'

let instance: LifeLineDB | null = null

export function getDB(): LifeLineDB {
  if (!instance) {
    instance = new LifeLineDB()
  }
  return instance
}

export const db = getDB()
