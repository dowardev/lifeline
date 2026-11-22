import { describe, expect, test, vi, beforeEach } from 'vitest'
import { actionSheetController } from '@ionic/vue'
import { useAddSourceSheet } from '@/composables/useAddSourceSheet'

// The sheet is the only entry point of the Google Calendar section, so the
// two ways in (a Google account and a calendar by its ICS URL) have to be
// offered here.
describe('useAddSourceSheet', () => {
  beforeEach((): void => {
    vi.restoreAllMocks()
  })

  function sheetWithRole(role: string): { onDidDismiss: ReturnType<typeof vi.fn> } {
    return { onDidDismiss: vi.fn().mockResolvedValue({ role }) }
  }

  test('offers the Google account and the calendar by ICS URL', async (): Promise<void> => {
    const create = vi
      .spyOn(actionSheetController, 'create')
      .mockResolvedValue(sheetWithRole('cancel') as never)

    const { open } = useAddSourceSheet({ options: { onGoogle: vi.fn(), onIcs: vi.fn() } })
    await open()

    expect(create).toHaveBeenCalledTimes(1)
    const options = create.mock.calls[0][0] as { buttons: { text: string }[] }
    const texts = options.buttons.map((button) => button.text)
    expect(texts).toContain('Google Calendar')
    expect(texts).toContain('Calendario por URL (ICS)')
  })

  test('the Google option starts the OAuth flow', async (): Promise<void> => {
    vi.spyOn(actionSheetController, 'create').mockResolvedValue(sheetWithRole('google') as never)
    const onGoogle = vi.fn()
    const onIcs = vi.fn()

    const { open } = useAddSourceSheet({ options: { onGoogle, onIcs } })
    await open()

    expect(onGoogle).toHaveBeenCalledTimes(1)
    expect(onIcs).not.toHaveBeenCalled()
  })

  test('the ICS option starts the ICS-by-URL creation', async (): Promise<void> => {
    vi.spyOn(actionSheetController, 'create').mockResolvedValue(sheetWithRole('ics') as never)
    const onGoogle = vi.fn()
    const onIcs = vi.fn()

    const { open } = useAddSourceSheet({ options: { onGoogle, onIcs } })
    await open()

    expect(onIcs).toHaveBeenCalledTimes(1)
    expect(onGoogle).not.toHaveBeenCalled()
  })

  test('cancelling does nothing', async (): Promise<void> => {
    vi.spyOn(actionSheetController, 'create').mockResolvedValue(sheetWithRole('cancel') as never)
    const onGoogle = vi.fn()
    const onIcs = vi.fn()

    const { open } = useAddSourceSheet({ options: { onGoogle, onIcs } })
    await open()

    expect(onGoogle).not.toHaveBeenCalled()
    expect(onIcs).not.toHaveBeenCalled()
  })
})
