import { tagService } from '@/services/tagService'
import { useTagStore } from '@/store/tagStore'

export class TagController {
  private get store() {
    return useTagStore()
  }

  async loadAdminTags() {
    const response = await tagService.getAdminTags()
    this.store.setAdminTags({ tags: response.tags || response || [] })
  }

  async attachTag(params: { eventId: number; tagId: number }) {
    await tagService.attachTag(params)
  }

  async detachTag(params: { eventId: number; tagId: number }) {
    await tagService.detachTag(params)
  }
}
