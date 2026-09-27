// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, test } from 'vitest'
import es from '@/plugins/i18n/languages/es'
import en from '@/plugins/i18n/languages/en'
import ExternalContactDetailComponent from '@/components/contacts/ExternalContactDetailComponent.vue'
import type { ExternalContact } from '@/services/externalContactService'

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'en',
  messages: { es, en },
})

function mountDetail(contact: ExternalContact): ReturnType<typeof mount> {
  return mount(ExternalContactDetailComponent, {
    props: { contact },
    global: { plugins: [i18n] },
  })
}

const sampleContact: ExternalContact = {
  key: 'ext-contact-7',
  id: 7,
  displayName: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '+34 600 123 456',
  sourceName: 'Google Contacts',
}

describe('ExternalContactDetailComponent (LBDS-271)', () => {
  test('mounts and shows the contact name', () => {
    const wrapper = mountDetail(sampleContact)
    expect(wrapper.text()).toContain('Juan Pérez')
  })

  test('shows the email when present', () => {
    const wrapper = mountDetail(sampleContact)
    expect(wrapper.text()).toContain('juan@example.com')
  })

  test('shows the phone when present', () => {
    const wrapper = mountDetail(sampleContact)
    expect(wrapper.text()).toContain('+34 600 123 456')
  })

  test('shows the source name', () => {
    const wrapper = mountDetail(sampleContact)
    expect(wrapper.text()).toContain('Google Contacts')
  })

  test('always renders the read-only banner', () => {
    const wrapper = mountDetail(sampleContact)
    expect(wrapper.text()).toContain('Solo lectura')
  })

  test('falls back to "sin titulo" when the display name is empty', () => {
    const wrapper = mountDetail({ ...sampleContact, displayName: '' })
    expect(wrapper.text()).toContain('sin titulo')
  })

  test('shows the no-email / no-phone placeholders when missing', () => {
    const wrapper = mountDetail({
      ...sampleContact,
      email: '',
      phone: '',
    })
    expect(wrapper.text()).toContain('Sin correo')
    expect(wrapper.text()).toContain('Sin teléfono')
  })
})