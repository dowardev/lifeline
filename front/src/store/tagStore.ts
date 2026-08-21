// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AdminTagItem {
  id: number
  name: string
}

export const useTagStore = defineStore('tag', () => {
  const adminTags = ref<AdminTagItem[]>([])

  function setAdminTags(params: { tags: AdminTagItem[] }): void {
    adminTags.value = params.tags
  }

  return { adminTags, setAdminTags }
})
