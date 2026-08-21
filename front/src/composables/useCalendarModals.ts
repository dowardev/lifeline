// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { nextTick } from 'vue'
import type { Ref } from 'vue'

export function useCalendarModals(params: {
  isOpenModalAddEvent: Ref<boolean>
  isOpenModalUpdateEvent: Ref<boolean>
  clickedDate: Ref<Date | null>
  clickedEndDate: Ref<Date | null>
  selectedEventId: Ref<number>
}): {
  openModalAdd: (params?: { event: unknown }) => void
  openModalUpdate: (params: { id: number }) => Promise<void>
  onModalAddDismiss: () => void
  onModalUpdateDismiss: () => void
} {
  const { isOpenModalAddEvent, isOpenModalUpdateEvent, clickedDate, clickedEndDate, selectedEventId } = params

  function openModalAdd(params?: { event: unknown }): void {
    void params
    isOpenModalAddEvent.value = true
  }

  async function openModalUpdate(params: { id: number }): Promise<void> {
    const { id } = params
    if (isOpenModalUpdateEvent.value) {
      isOpenModalUpdateEvent.value = false
      await nextTick()
    }
    selectedEventId.value = id
    isOpenModalUpdateEvent.value = true
  }

  function onModalAddDismiss(): void {
    if (!isOpenModalAddEvent.value) return
    isOpenModalAddEvent.value = false
    clickedDate.value = null
    clickedEndDate.value = null
  }

  function onModalUpdateDismiss(): void {
    isOpenModalUpdateEvent.value = false
    selectedEventId.value = 0
  }

  return { openModalAdd, openModalUpdate, onModalAddDismiss, onModalUpdateDismiss }
}
