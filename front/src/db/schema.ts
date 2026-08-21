// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import Dexie, { type EntityTable } from 'dexie'

export interface EventRecord {
  id?: number
  user_id: number
  title: string
  calendar_id: number
  date_start?: string
  date_end?: string
  notifications?: string
  repeat?: string
  time_zone?: string
  guests?: string
  description?: string
  availability?: string
}

export interface UserRecord {
  id?: number
  name: string
  user_name: string
  email: string
  image_profile?: string
}

export interface UserLoggedRecord {
  id?: number
  user: string
  token: string
}

export interface TokenRecord {
  id?: number
  user_id: number
  name: string
  token: string
}

export interface ConfigRecord {
  name: string
  value: string
}

export interface TaskRecord {
  id?: number
  user_id: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority?: number
  due_date?: string
  subtasks?: string
  order?: number
}

export interface DocumentRecord {
  id?: number
  user_id: number
  title: string
  type: 'note' | 'list' | 'richtext' | 'todo'
  content?: string
  order?: number
}

export interface NoteRecord {
  id?: number
  user_id: number
  document_id?: number
  title: string
  content?: string
  reminder?: string
}

export class LifeLineDB extends Dexie {
  events!: EntityTable<EventRecord, 'id'>
  users!: EntityTable<UserRecord, 'id'>
  usersLogged!: EntityTable<UserLoggedRecord, 'id'>
  tokens!: EntityTable<TokenRecord, 'id'>
  config!: EntityTable<ConfigRecord, 'name'>
  tasks!: EntityTable<TaskRecord, 'id'>
  documents!: EntityTable<DocumentRecord, 'id'>
  notes!: EntityTable<NoteRecord, 'id'>

  constructor() {
    super('LifeLineDB')
    this.version(1).stores({
      events: '++id, user_id, title',
      users: '++id, email',
      usersLogged: '++id, user',
      tokens: '++id, user_id, name',
      config: '++id, name',
      tasks: '++id, user_id, title, status, due_date',
      documents: '++id, user_id, title, type',
      notes: '++id, user_id, document_id, title',
    })
    this.version(2).stores({
      config: 'name',
    })
  }
}
