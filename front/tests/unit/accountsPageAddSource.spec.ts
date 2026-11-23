import { config, flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import type { DefineComponent, VNode } from 'vue'
import AccountsPage from '@/views/settings/AccountsPage.vue'
import ConnectionModal from '@/components/settings/ConnectionModal.vue'

const { controllerMock } = vi.hoisted(() => ({
  controllerMock: {
    startGoogleOAuth: vi.fn(),
    listSources: vi.fn(),
    testConnection: vi.fn(),
    saveSource: vi.fn(),
    discoverCollections: vi.fn(),
    syncSource: vi.fn(),
    saveCollections: vi.fn(),
    removeSource: vi.fn(),
  },
}))

// The Ionic web components need a whole app shell to boot, which is not what
// this test is about: the page is stubbed with plain elements that keep their
// slot content, so the wiring of the sections can be checked.
function ionicStub(name: string): DefineComponent {
  return defineComponent({
    name,
    setup(_props, { slots }): () => VNode {
      return () => h('div', { class: name }, slots.default?.())
    },
  })
}

vi.mock(
  '@ionic/vue',
  (): Record<string, unknown> => ({
    IonBackButton: ionicStub('IonBackButton'),
    IonButton: ionicStub('IonButton'),
    IonButtons: ionicStub('IonButtons'),
    IonCol: ionicStub('IonCol'),
    IonContent: ionicStub('IonContent'),
    IonGrid: ionicStub('IonGrid'),
    IonHeader: ionicStub('IonHeader'),
    IonIcon: ionicStub('IonIcon'),
    IonItem: ionicStub('IonItem'),
    IonLabel: ionicStub('IonLabel'),
    IonList: ionicStub('IonList'),
    IonListHeader: ionicStub('IonListHeader'),
    IonModal: ionicStub('IonModal'),
    IonPage: ionicStub('IonPage'),
    IonRow: ionicStub('IonRow'),
    IonTitle: ionicStub('IonTitle'),
    IonToolbar: ionicStub('IonToolbar'),
    toastController: { create: vi.fn().mockResolvedValue({ present: vi.fn() }) },
    alertController: { create: vi.fn().mockResolvedValue({ present: vi.fn() }) },
  }),
)

vi.mock(
  '@/controllers/calendarSourceController',
  (): Record<string, unknown> => ({
    // A constructible mock: the page does `new CalendarSourceController()`.
    CalendarSourceController: vi.fn(function (): unknown {
      return controllerMock
    }),
  }),
)

vi.mock('vue-router', async (importOriginal): Promise<Record<string, unknown>> => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRoute: (): unknown => ({ query: {}, path: '/', params: {}, matched: [] }),
    useRouter: (): unknown => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      resolve: (to: unknown): unknown => ({ href: to, path: '/' }),
      currentRoute: { value: { path: '/' } },
    }),
  }
})

config.global.stubs = {
  ConnectionModal: true,
  LocalCalendarsSection: true,
}

describe('AccountsPage.vue - the three kinds of external source', () => {
  beforeEach((): void => {
    vi.clearAllMocks()
    controllerMock.listSources.mockResolvedValue([])
    controllerMock.startGoogleOAuth.mockResolvedValue({
      ok: true,
      url: 'https://accounts.google.com/o/oauth2',
    })
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })
  })

  function mountPage(): VueWrapper {
    return mount(AccountsPage)
  }

  function section(wrapper: VueWrapper, title: string): VueWrapper {
    const header = wrapper
      .findAllComponents({ name: 'IonListHeader' })
      .find((item) => item.text().includes(title))
    expect(header).toBeTruthy()
    return header!
  }

  // The connections of a section are siblings of its header, inside the
  // same list.
  function sectionText(wrapper: VueWrapper, title: string): string {
    const list = section(wrapper, title).element.closest('.IonList')
    expect(list).toBeTruthy()
    return list?.textContent ?? ''
  }

  function agregarButton(wrapper: VueWrapper, title: string): VueWrapper {
    const button = section(wrapper, title).findComponent({ name: 'IonButton' })
    expect(button.exists()).toBe(true)
    return button
  }

  test('the Google Agregar button starts the OAuth flow, with no menu in between', async (): Promise<void> => {
    const wrapper = mountPage()

    await agregarButton(wrapper, 'Google Calendar').trigger('click')
    await flushPromises()

    expect(controllerMock.startGoogleOAuth).toHaveBeenCalledTimes(1)
  })

  test('the ICS section has its own Agregar button that opens an empty ICS draft', async (): Promise<void> => {
    const wrapper = mountPage()

    await agregarButton(wrapper, 'Calendario por URL (ICS)').trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(ConnectionModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('isNew')).toBe(true)
    expect(modal.props('connectionType')).toBe('google')
    const connection = modal.props('connection') as {
      isOAuth: boolean
      serverId: number | null
      name: string
      icsUrl: string
    }
    expect(connection.isOAuth).toBe(false)
    expect(connection.serverId).toBeNull()
    expect(connection.name).toBe('')
    expect(connection.icsUrl).toBe('')
    expect(controllerMock.startGoogleOAuth).not.toHaveBeenCalled()
  })

  test('a saved ICS feed is listed under its own section, not under Google', async (): Promise<void> => {
    controllerMock.listSources.mockResolvedValue([
      { id: 7, type: 'ics', name: 'Feed del equipo', url: 'https://cal.example.com/team.ics', color: '#3880ff' },
    ])
    const wrapper = mountPage()
    await flushPromises()

    const icsSection = sectionText(wrapper, 'Calendario por URL (ICS)')
    expect(icsSection).toContain('Feed del equipo')

    const googleSection = sectionText(wrapper, 'Google Calendar')
    expect(googleSection).not.toContain('Feed del equipo')
  })

  test('a Google account is listed under the Google section', async (): Promise<void> => {
    controllerMock.listSources.mockResolvedValue([
      { id: 8, type: 'google', name: 'Mi Google', url: '', color: '#3880ff' },
    ])
    const wrapper = mountPage()
    await flushPromises()

    expect(sectionText(wrapper, 'Google Calendar')).toContain('Mi Google')
    expect(sectionText(wrapper, 'Calendario por URL (ICS)')).not.toContain('Mi Google')
  })

  test('the CalDAV Agregar button still opens a CalDAV draft', async (): Promise<void> => {
    const wrapper = mountPage()

    await agregarButton(wrapper, 'CalDAV').trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(ConnectionModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('connectionType')).toBe('caldav')
  })
})
