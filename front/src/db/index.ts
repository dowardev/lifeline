import { LifeLineDB } from './schema'

let instance: LifeLineDB | null = null

export function getDB(): LifeLineDB {
  if (!instance) {
    instance = new LifeLineDB()
  }
  return instance
}

export const db = getDB()
