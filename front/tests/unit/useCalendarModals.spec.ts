import { describe, expect, test } from 'vitest'
import { ref, nextTick } from 'vue'
import { useCalendarModals } from '@/composables/useCalendarModals'

describe('useCalendarModals', () => {
  const isOpenModalAddEvent = ref(false)
  const isOpenModalUpdateEvent = ref(false)
  const clickedDate = ref<Date | null>(null)
  const clickedEndDate = ref<Date | null>(null)
  const selectedEventId = ref(0)

  const {
    openModalAdd,
    openModalUpdate,
    onModalAddDismiss,
    onModalUpdateDismiss,
  } = useCalendarModals({
    isOpenModalAddEvent,
    isOpenModalUpdateEvent,
    clickedDate,
    clickedEndDate,
    selectedEventId,
  })

  test('openModalAdd sets isOpenModalAddEvent to true', () => {
    expect(isOpenModalAddEvent.value).toBe(false)
    openModalAdd()
    expect(isOpenModalAddEvent.value).toBe(true)
  })

  test('openModalAdd is idempotent (can be called twice without error)', () => {
    openModalAdd()
    openModalAdd()
    expect(isOpenModalAddEvent.value).toBe(true)
  })

  test('onModalAddDismiss resets state when open', () => {
    clickedDate.value = new Date('2026-07-21')
    clickedEndDate.value = new Date('2026-07-22')
    isOpenModalAddEvent.value = true

    onModalAddDismiss()

    expect(isOpenModalAddEvent.value).toBe(false)
    expect(clickedDate.value).toBeNull()
    expect(clickedEndDate.value).toBeNull()
  })

  test('onModalAddDismiss is a no-op when modal is already closed', () => {
    isOpenModalAddEvent.value = false
    clickedDate.value = new Date('2026-07-21')

    onModalAddDismiss()

    expect(isOpenModalAddEvent.value).toBe(false)
    expect(clickedDate.value).not.toBeNull()
  })

  test('openModalUpdate sets isOpenModalUpdateEvent with correct id', async () => {
    expect(isOpenModalUpdateEvent.value).toBe(false)

    await openModalUpdate({ id: 42 })

    expect(selectedEventId.value).toBe(42)
    expect(isOpenModalUpdateEvent.value).toBe(true)
  })

  test('openModalUpdate toggles and reopens properly', async () => {
    isOpenModalUpdateEvent.value = true
    selectedEventId.value = 1

    await openModalUpdate({ id: 99 })
    await nextTick()

    expect(selectedEventId.value).toBe(99)
    expect(isOpenModalUpdateEvent.value).toBe(true)
  })

  test('onModalUpdateDismiss resets state', () => {
    isOpenModalUpdateEvent.value = true
    selectedEventId.value = 42

    onModalUpdateDismiss()

    expect(isOpenModalUpdateEvent.value).toBe(false)
    expect(selectedEventId.value).toBe(0)
  })
})
