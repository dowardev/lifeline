import { apiClient } from './apiClient'

export const tagService = {
  getAdminTags(): Promise<unknown> {
    return apiClient.executeQuery({ url: '/admin-tags' })
  },

  attachTag(params: { eventId: number; tagId: number }): Promise<unknown> {
    return apiClient.executeMutation({ url: `/events/${params.eventId}/tags`, data: { tag_id: params.tagId } })
  },

  detachTag(params: { eventId: number; tagId: number }): Promise<unknown> {
    return apiClient.executeDelete({ url: `/events/${params.eventId}/tags/${params.tagId}` })
  },
}
