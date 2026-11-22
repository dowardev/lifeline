import { config, flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import type { DefineComponent, VNode } from 'vue'
import AccountsPage from '@/views/settings/AccountsPage.vue'
import ConnectionModal from '@/components/settings/ConnectionModal.vue'

const { createMock, controllerMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
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
    actionSheetController: { create: (...args: unknown[]): unknown => createMock(...args) },
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
      resolve: (to: unknown): unknown => ({ href: to, path: '/', matched: [] }),
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

  function sheetWithRole(role: string): { present: ReturnType<typeof vi.fn>; onDidDismiss: ReturnType<typeof vi.fn> } {
    return {
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: vi.fn().mockResolvedValue({ role }),
    }
  }

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

  test('the Agregar button offers the Google account and the calendar by ICS URL', async (): Promise<void> => {
    const sheet = sheetWithRole('cancel')
    createMock.mockResolvedValue(sheet)
    const wrapper = mountPage()

    await googleAgregarButton(wrapper).trigger('click')
    await flushPromises()

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(sheet.present).toHaveBeenCalledTimes(1)
    const options = createMock.mock.calls[0][0] as { buttons: { text: string }[] }
    const texts = options.buttons.map((button) => button.text)
    expect(texts).toContain('Google Calendar')
    expect(texts).toContain('Calendario por URL (ICS)')
  })

  test('choosing the calendar by ICS URL opens the connection modal with an empty ICS draft', async (): Promise<void> => {
    createMock.mockResolvedValue(sheetWithRole('ics'))
    const wrapper = mountPage()

    await googleAgregarButton(wrapper).trigger('click')
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
  })

  test('choosing the Google account starts the OAuth flow', async (): Promise<void> => {
    createMock.mockResolvedValue(sheetWithRole('google'))
    const wrapper = mountPage()

    await googleAgregarButton(wrapper).trigger('click')
    await flushPromises()

    expect(controllerMock.startGoogleOAuth).toHaveBeenCalledTimes(1)
  })
})
