// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, expect, test, vi, beforeEach } from 'vitest'

/**
 * Mirrors the two envelope shapes the SSO client can produce: a raw body
 * (`{ contacts: [...] }`) or a wrapped body (`{ data: { contacts: [...] } }`).
 * The reader must handle both, the same way `externalTaskService` does.
 */
const state = vi.hoisted(() => ({
  envelope: 'raw' as 'raw' | 'wrapped',
  apiContacts: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    executeQuery: vi.fn(async (params: { url: string }) => {
      if (params.url === '/external-contacts') {
        if (state.envelope === 'wrapped') {
          return { data: { contacts: state.apiContacts } }
        }
        return { contacts: state.apiContacts }
      }
      return {}
    }),
  },
}))

import { externalContactService } from '@/services/externalContactService'

beforeEach(() => {
  state.envelope = 'raw'
  state.apiContacts = []
})

describe('externalContactService.listExternalContacts (LBDS-271)', () => {
  test('maps display_name / email / phone / source_name and namespaces the key', async () => {
    state.apiContacts = [
      {
        id: 7,
        display_name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+34 600 123 456',
        source_name: 'Google Contacts',
      },
    ]

    const contacts = await externalContactService.listExternalContacts()
    expect(contacts).toHaveLength(1)
    expect(contacts[0]).toEqual({
      key: 'ext-contact-7',
      id: 7,
      displayName: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+34 600 123 456',
      sourceName: 'Google Contacts',
    })
  })

  test('replaces missing fields with empty strings so the UI never has to guard each one', async () => {
    state.apiContacts = [{ id: 9 }]

    const contacts = await externalContactService.listExternalContacts()
    expect(contacts[0]).toEqual({
      key: 'ext-contact-9',
      id: 9,
      displayName: '',
      email: '',
      phone: '',
      sourceName: '',
    })
  })

  test('accepts the wrapped `{ data: { contacts } }` envelope the SSO client may return', async () => {
    state.envelope = 'wrapped'
    state.apiContacts = [{ id: 1, display_name: 'A', email: 'a@x' }]

    const contacts = await externalContactService.listExternalContacts()
    expect(contacts).toHaveLength(1)
    expect(contacts[0].key).toBe('ext-contact-1')
  })

  test('returns an empty list when the server sends no contacts', async () => {
    state.apiContacts = []
    const contacts = await externalContactService.listExternalContacts()
    expect(contacts).toEqual([])
  })

  test('returns an empty list when the contacts field is malformed (not an array)', async () => {
    state.apiContacts = 'not an array' as unknown as Array<Record<string, unknown>>
    const contacts = await externalContactService.listExternalContacts()
    expect(contacts).toEqual([])
  })
})