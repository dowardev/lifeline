import { shallowMount } from '@vue/test-utils'
import HomePage from '@/views/home/HomePage.vue'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@/js/WakaTimeController', () => ({
  WakaTimeController: class {
    loadWakaTimeApiKey = vi.fn().mockResolvedValue(undefined)
    getWakaTimeApiKey = vi.fn().mockResolvedValue('')
    getWakaTimeApiKeyLocal = vi.fn().mockResolvedValue('')
  }
}))

describe('HomePage.vue', () => {
  test('mounts without errors', () => {
    const wrapper = shallowMount(HomePage)
    expect(wrapper.exists()).toBe(true)
  })
})