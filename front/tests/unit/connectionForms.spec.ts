import { config, mount } from '@vue/test-utils'
import { IonicVue, IonInput } from '@ionic/vue'
import GoogleOAuthForm from '@/components/settings/forms/GoogleOAuthForm.vue'
import CaldavForm from '@/components/settings/forms/CaldavForm.vue'
import ConnectionModal from '@/components/settings/ConnectionModal.vue'
import { describe, expect, test } from 'vitest'

// The connection modal relies on the globally registered Ionic components
// (the app does `app.use(IonicVue)`), so the test needs them too.
config.global.plugins = [IonicVue]

describe('GoogleOAuthForm.vue', () => {
  test('emits update:connection with new object when name input changes', async () => {
    const originalConnection = {
      id: 'test-id-1',
      serverId: 42,
      isOAuth: true,
      name: 'Original Name',
      icsUrl: 'https://example.com/calendar.ics',
      color: '#ff0000',
      testing: false,
      saving: false,
      syncing: false,
      discovering: false,
      collections: [],
      testOk: null,
      testResult: null,
      errorDetail: null,
    }

    const wrapper = mount(GoogleOAuthForm, {
      props: { connection: originalConnection, disabled: false },
    })

    await wrapper.vm.updateField({ field: 'name', value: 'New Name' })

    const updateEvents = wrapper.emitted('update:connection')
    expect(updateEvents).toBeTruthy()
    expect(updateEvents!.length).toBe(1)

    const emittedConnection = updateEvents![0][0] as typeof originalConnection
    expect(emittedConnection.name).toBe('New Name')
    expect(emittedConnection.id).toBe(originalConnection.id)
    expect(emittedConnection.serverId).toBe(originalConnection.serverId)
    expect(emittedConnection.isOAuth).toBe(originalConnection.isOAuth)
    expect(emittedConnection.icsUrl).toBe(originalConnection.icsUrl)
    expect(emittedConnection.color).toBe(originalConnection.color)
    expect(emittedConnection).not.toBe(originalConnection)
  })

  test('emits update:connection with new object when color input changes', async () => {
    const originalConnection = {
      id: 'test-id-2',
      serverId: null,
      isOAuth: false,
      name: 'Test Calendar',
      icsUrl: 'https://example.com/calendar.ics',
      color: '#00ff00',
      testing: false,
      saving: false,
      syncing: false,
      discovering: false,
      collections: [],
      testOk: null,
      testResult: null,
      errorDetail: null,
    }

    const wrapper = mount(GoogleOAuthForm, {
      props: { connection: originalConnection, disabled: false },
    })

    await wrapper.vm.updateField({ field: 'color', value: '#0000ff' })

    const updateEvents = wrapper.emitted('update:connection')
    expect(updateEvents).toBeTruthy()
    expect(updateEvents!.length).toBe(1)

    const emittedConnection = updateEvents![0][0] as typeof originalConnection
    expect(emittedConnection.color).toBe('#0000ff')
    expect(emittedConnection.name).toBe(originalConnection.name)
    expect(emittedConnection).not.toBe(originalConnection)
  })

  test('does not mutate the original props object', async () => {
    const originalConnection = {
      id: 'test-id-3',
      serverId: 1,
      isOAuth: true,
      name: 'Original',
      icsUrl: 'https://example.com/calendar.ics',
      color: '#123456',
      testing: false,
      saving: false,
      syncing: false,
      discovering: false,
      collections: [],
      testOk: null,
      testResult: null,
      errorDetail: null,
    }

    const wrapper = mount(GoogleOAuthForm, {
      props: { connection: originalConnection, disabled: false },
    })

    await wrapper.vm.updateField({ field: 'name', value: 'Mutated Name' })

    expect(originalConnection.name).toBe('Original')
  })
})

describe('CaldavForm.vue', () => {
  test('emits update:connection with new object when name input changes', async () => {
    const originalConnection = {
      id: 'caldav-id-1',
      serverId: 10,
      name: 'Original CalDAV',
      url: 'https://caldav.example.com/dav',
      username: 'user',
      password: 'pass',
      color: '#aaaaaa',
      testing: false,
      saving: false,
      syncing: false,
      discovering: false,
      collections: [],
      testOk: null,
      testResult: null,
      errorDetail: null,
    }

    const wrapper = mount(CaldavForm, {
      props: { connection: originalConnection, disabled: false },
    })

    await wrapper.vm.updateField({ field: 'name', value: 'New CalDAV Name' })

    const updateEvents = wrapper.emitted('update:connection')
    expect(updateEvents).toBeTruthy()
    expect(updateEvents!.length).toBe(1)

    const emittedConnection = updateEvents![0][0] as typeof originalConnection
    expect(emittedConnection.name).toBe('New CalDAV Name')
    expect(emittedConnection.id).toBe(originalConnection.id)
    expect(emittedConnection.serverId).toBe(originalConnection.serverId)
    expect(emittedConnection.url).toBe(originalConnection.url)
    expect(emittedConnection.username).toBe(originalConnection.username)
    expect(emittedConnection.password).toBe(originalConnection.password)
    expect(emittedConnection.color).toBe(originalConnection.color)
    expect(emittedConnection).not.toBe(originalConnection)
  })

  test('emits update:connection with new object when url input changes', async () => {
    const originalConnection = {
      id: 'caldav-id-2',
      serverId: null,
      name: 'Test CalDAV',
      url: 'https://old.example.com/dav',
      username: 'user',
      password: 'pass',
      color: '#bbbbbb',
      testing: false,
      saving: false,
      syncing: false,
      discovering: false,
      collections: [],
      testOk: null,
      testResult: null,
      errorDetail: null,
    }

    const wrapper = mount(CaldavForm, {
      props: { connection: originalConnection, disabled: false },
    })

    await wrapper.vm.updateField({ field: 'url', value: 'https://new.example.com/dav' })

    const updateEvents = wrapper.emitted('update:connection')
    expect(updateEvents).toBeTruthy()
    expect(updateEvents!.length).toBe(1)

    const emittedConnection = updateEvents![0][0] as typeof originalConnection
    expect(emittedConnection.url).toBe('https://new.example.com/dav')
    expect(emittedConnection.name).toBe(originalConnection.name)
    expect(emittedConnection).not.toBe(originalConnection)
  })

  test('does not mutate the original props object', async () => {
    const originalConnection = {
      id: 'caldav-id-3',
      serverId: 5,
      name: 'Original CalDAV',
      url: 'https://caldav.example.com/dav',
      username: 'originalUser',
      password: 'originalPass',
      color: '#abcdef',
      testing: false,
      saving: false,
      syncing: false,
      discovering: false,
      collections: [],
      testOk: null,
      testResult: null,
      errorDetail: null,
    }

    const wrapper = mount(CaldavForm, {
      props: { connection: originalConnection, disabled: false },
    })

    await wrapper.vm.updateField({ field: 'name', value: 'Mutated CalDAV Name' })

    expect(originalConnection.name).toBe('Original CalDAV')
  })
})
describe('ConnectionModal.vue', () => {
  test('re-emits the connection update that comes from the form', async () => {
    const connection = {
      id: 'modal-id-1',
      serverId: 42,
      isOAuth: true,
      name: 'Original Name',
      icsUrl: 'https://example.com/calendar.ics',
      color: '#ff0000',
      testing: false,
      saving: false,
      syncing: false,
      discovering: false,
      collections: [],
      testOk: null,
      testResult: null,
      errorDetail: null,
    }

    const wrapper = mount(ConnectionModal, {
      props: {
        title: 'Test connection',
        connection,
        connectionType: 'google',
        formDisabled: false,
        isNew: false,
      },
    })

    // The form inside the modal owns the inputs. The input is picked by
    // position and emits through the component: a hydrated Ionic input
    // does not keep its props in the DOM, and `@ion-input` is a component
    // emit, not a DOM listener.
    const inputs = wrapper.findAllComponents(IonInput)
    expect(inputs.length).toBeGreaterThan(0)
    await inputs[0].vm.$emit('ionInput', { detail: { value: 'Typed in the modal' } })

    const emitted = wrapper.emitted('update:connection')
    expect(emitted).toBeTruthy()
    expect(emitted!.length).toBe(1)
    expect((emitted![0][0] as typeof connection).name).toBe('Typed in the modal')
    // The prop of the modal is never mutated.
    expect(connection.name).toBe('Original Name')
  })
})
