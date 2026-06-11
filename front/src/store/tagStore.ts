import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AdminTagItem {
  id: number
  name: string
}

export const useTagStore = defineStore('tag', () => {
  const adminTags = ref<AdminTagItem[]>([])

  function setAdminTags(params: { tags: AdminTagItem[] }) {
    adminTags.value = params.tags
  }

  return { adminTags, setAdminTags }
})
