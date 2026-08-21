// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { tagService } from '@/services/tagService'
import { useTagStore } from '@/store/tagStore'

export class TagController {
  private get store(): ReturnType<typeof useTagStore> {
    return useTagStore()
  }

  async loadAdminTags(): Promise<void> {
    const response = await tagService.getAdminTags()
    this.store.setAdminTags({ tags: response.tags || response || [] })
  }

  async attachTag(params: { eventId: number; tagId: number }): Promise<void> {
    await tagService.attachTag(params)
  }

  async detachTag(params: { eventId: number; tagId: number }): Promise<void> {
    await tagService.detachTag(params)
  }
}
