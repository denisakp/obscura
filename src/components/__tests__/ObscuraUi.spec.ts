import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import ObscuraUi from '@/components/ObscuraUi.vue'

// Mock the generatePasswords function
vi.mock("@/utils/obscura", () => ({
  generatePasswords: vi.fn().mockImplementation((options) => {
    return Array(options.quantity).fill(0).map((_, i) => `password-${i+1}`)
  })
}));

describe('ObscuraUi component tests', () => {

  it('renders properly', () => {
    const wrapper = mount(ObscuraUi, {})
    expect(wrapper.text()).toContain('Obscura')
  })
})
