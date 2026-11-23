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
// slot content, so the wiring of the "Agregar" menu can be checked.
function ionicStub(name: string): DefineComponent {
  return defineComponent({
    name,
    setup(_props, { slots }): () => VNode {
      return () => h('div', { class: name }, slots.default?.())
    },
  })
}

// The popover carries the state of the menu, so its props are declared.
// It is built inside the mock factory: the factory is hoisted above the
// module scope.
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
    IonPopover: ionicStub('IonPopover'),
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

describe('AccountsPage.vue - the Google Calendar "Agregar" menu', () => {
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

  function googleAgregarButton(wrapper: VueWrapper): VueWrapper {
    const header = wrapper
      .findAllComponents({ name: 'IonListHeader' })
      .find((item) => item.text().includes('Google Calendar'))
    expect(header).toBeTruthy()
    const button = header!.findComponent({ name: 'IonButton' })
    expect(button.exists()).toBe(true)
    return button
  }

  function popoverIsOpen(wrapper: VueWrapper): boolean {
    const found = wrapper.find('.IonPopover')
    expect(found.exists()).toBe(true)
    return found.attributes('is-open') === 'true'
  }

  function popoverItem(wrapper: VueWrapper, text: string): VueWrapper {
    const item = wrapper
      .findAllComponents({ name: 'IonItem' })
      .find((candidate) => candidate.text().includes(text))
    expect(item).toBeTruthy()
    return item!
  }

  test('the Agregar button opens a popover with the two ways in', async (): Promise<void> => {
    const wrapper = mountPage()

    expect(popoverIsOpen(wrapper)).toBe(false)

    await googleAgregarButton(wrapper).trigger('click')
    await flushPromises()

    expect(popoverIsOpen(wrapper)).toBe(true)
    const texts = wrapper.findAllComponents({ name: 'IonItem' }).map((item) => item.text())
    expect(texts.some((text) => text.includes('Google Calendar'))).toBe(true)
    expect(texts.some((text) => text.includes('Calendario por URL (ICS)'))).toBe(true)
  })

  test('choosing the Google account starts the OAuth flow', async (): Promise<void> => {
    const wrapper = mountPage()

    await googleAgregarButton(wrapper).trigger('click')
    await flushPromises()
    await popoverItem(wrapper, 'Google Calendar').trigger('click')
    await flushPromises()

    expect(controllerMock.startGoogleOAuth).toHaveBeenCalledTimes(1)
    expect(popoverIsOpen(wrapper)).toBe(false)
  })

  test('choosing the calendar by ICS URL opens the connection modal with an empty ICS draft', async (): Promise<void> => {
    const wrapper = mountPage()

    await googleAgregarButton(wrapper).trigger('click')
    await flushPromises()
    await popoverItem(wrapper, 'Calendario por URL (ICS)').trigger('click')
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
    expect(popoverIsOpen(wrapper)).toBe(false)
  })

  test('the CalDAV Agregar button still opens a CalDAV draft', async (): Promise<void> => {
    const wrapper = mountPage()

    const header = wrapper
      .findAllComponents({ name: 'IonListHeader' })
      .find((item) => item.text().includes('CalDAV'))
    expect(header).toBeTruthy()
    await header!.findComponent({ name: 'IonButton' }).trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(ConnectionModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('connectionType')).toBe('caldav')
    expect(popoverIsOpen(wrapper)).toBe(false)
  })
})
