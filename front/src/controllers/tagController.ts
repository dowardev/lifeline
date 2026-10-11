// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { tagService } from '@/services/tagService'
import { useTagStore } from '@/store/tagStore'
import {
  createRepository,
  type RepositoryHooks,
} from '@/db/repository'
import { useOutboxProcessor } from '@/db/outboxProcessor'
import type { AdminTagItem } from '@/store/tagStore'

/**
 * LBDS-231 - TagController is mostly a read-only cache of admin-defined
 * tags (the user can attach them to events but cannot create new ones
 * from the app). The list lives in Dexie so the tag picker works offline;
 * `attachTag`/`detachTag` stay as direct service calls because they are
 * nested mutations under an event id, not a top-level CRUD.
 */

interface ServerAdminTagDto {
  id: number
  name: string
}

function buildHooks(): RepositoryHooks<AdminTagItem> {
  const store = (): ReturnType<typeof useTagStore> => useTagStore()
  return {
    setItems: ({ items }): void => store().setAdminTags({ tags: items }),
    addItem: ({ item }): void => {
      const current = store().adminTags
      if (!current.some((t) => t.id === item.id)) {
        store().setAdminTags({ tags: [...current, item] })
      }
    },
    patchItem: ({ id, patch }): void => {
      const current = store().adminTags.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      )
      store().setAdminTags({ tags: current })
    },
    removeItem: ({ id }): void => {
      store().setAdminTags({
        tags: store().adminTags.filter((t) => t.id !== id),
      })
    },
  }
}

let repositorySingleton: ReturnType<
  typeof createRepository<ServerAdminTagDto, AdminTagItem>
> | null = null

function getRepository(): ReturnType<
  typeof createRepository<ServerAdminTagDto, AdminTagItem>
> {
  if (!repositorySingleton) {
    repositorySingleton = createRepository<ServerAdminTagDto, AdminTagItem>({
      tableName: 'adminTags',
      urlBase: '/admin-tags',
      service: {
        async list(): Promise<ServerAdminTagDto[]> {
          const response = (await tagService.getAdminTags()) as
            | { tags: ServerAdminTagDto[] }
            | ServerAdminTagDto[]
          return Array.isArray(response)
            ? response
            : Array.isArray(response?.tags)
              ? response.tags
              : []
        },
      },
      fromServer: ({ server }) => ({ ...server }),
      hooks: buildHooks(),
    })
  }
  return repositorySingleton
}

export class TagController {
  private get store(): ReturnType<typeof useTagStore> {
    return useTagStore()
  }

  /** Mounts the outbox processor on the root component. */
  useSync(): void {
    useOutboxProcessor()
  }

  async loadAdminTags(): Promise<void> {
    await getRepository().fetchAll()
  }

  /** Direct mutation - nested under an event id, not a top-level CRUD. */
  async attachTag(params: { eventId: number; tagId: number }): Promise<void> {
    await tagService.attachTag(params)
  }

  /** Direct mutation - nested under an event id, not a top-level CRUD. */
  async detachTag(params: { eventId: number; tagId: number }): Promise<void> {
    await tagService.detachTag(params)
  }
}
