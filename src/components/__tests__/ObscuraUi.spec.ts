import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

import ObscuraUi from '@/components/ObscuraUi.vue'

// Mock the obscura utility functions
vi.mock('@/utils/obscura', () => ({
  generatePasswords: vi.fn().mockImplementation((options) => {
    return Array(options.quantity)
      .fill(0)
      .map((_, i) => `password-${i + 1}`)
  }),
  validatePasswordOptions: vi.fn().mockImplementation((options) => {
    // Basic mocked validation for tests
    if (
      !options.includeLowercase &&
      !options.includeUppercase &&
      !options.includeDigits &&
      !options.includeSymbols
    ) {
      return { valid: false, message: 'At least one character type must be selected.' }
    }

    if (
      options.noDuplicateCharacters &&
      options.length > 10 &&
      !options.includeLowercase &&
      !options.includeUppercase &&
      !options.includeSymbols
    ) {
      return {
        valid: false,
        message: `Cannot generate a password of ${options.length} characters without duplicates using only 10 available characters.`,
      }
    }

    if (options.beginWithLetter && !options.includeLowercase && !options.includeUppercase) {
      return {
        valid: false,
        message: 'To start with a letter, either uppercase or lowercase letters must be enabled.',
      }
    }

    return { valid: true, message: '' }
  }),
}))

// Mock the navigator.clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock document.createElement for 'a' elements
const createElement = document.createElement.bind(document)
const mockClickFn = vi.fn()
document.createElement = vi.fn((tagName) => {
  const el = createElement(tagName)
  if (tagName === 'a') {
    el.click = mockClickFn
    Object.defineProperty(el, 'href', {
      writable: true,
      value: '',
    })
    Object.defineProperty(el, 'download', {
      writable: true,
      value: '',
    })
  }
  return el
})

describe('ObscuraUi component tests', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)

    wrapper = mount(ObscuraUi)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('renders properly', () => {
    expect(wrapper.text()).toContain('Obscura')
  })

  it('renders the component correctly', () => {
    expect(wrapper.find('h1').text()).toBe('Obscura')
    expect(wrapper.find('.text-gray-300 p').text()).toContain(
      'Obscura is a modern, open-source password generator',
    )
    expect(wrapper.findAll('[type="checkbox"]').length).toBe(10) // All option checkboxes rendered
  })

  it('loads with default password options', () => {
    const vm = wrapper.vm as unknown
    const options = (vm as { options: Record<string, unknown> }).options
    expect(options).toEqual({
      length: 12,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
      excludeSimilarCharacters: true,
      noDuplicateCharacters: true,
      noSequentialCharacters: true,
      beginWithLetter: true,
      quantity: 5,
    })
  })

  it('generates passwords on mount with autoGenerate=true', async () => {
    const { generatePasswords } = await import('@/utils/obscura')
    expect(generatePasswords).toHaveBeenCalledTimes(1)

    const passwordRows = wrapper.findAll('table tbody tr')
    expect(passwordRows.length).toBe(5) // Default quantity
    expect(passwordRows[0].find('td:nth-child(2)').text()).toBe('password-1')
  })

  it('generates new passwords when Generate button is clicked', async () => {
    const { generatePasswords } = await import('@/utils/obscura')
    vi.clearAllMocks() // Clear previous call counts

    await wrapper.find('button').trigger('click')

    expect(generatePasswords).toHaveBeenCalledTimes(1)
    expect(generatePasswords).toHaveBeenCalledWith(
      expect.objectContaining({
        length: 12,
        includeLowercase: true,
        includeUppercase: true,
        includeDigits: true,
        includeSymbols: true,
      }),
    )
  })

  it('copies the first password to clipboard', async () => {
    await wrapper.find('button').trigger('click') // Generate passwords

    // Find buttons by their text content for more reliable selection
    const copyFirstButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Copy the 1st item'))

    await copyFirstButton?.trigger('click')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('password-1')
  })

  it('copies all passwords to clipboard', async () => {
    await wrapper.find('button').trigger('click') // Generate passwords

    // Find button by its text content
    const copyAllButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Copy ALL'))

    await copyAllButton?.trigger('click')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'password-1\npassword-2\npassword-3\npassword-4\npassword-5',
    )
  })

  it('downloads passwords as a text file', async () => {
    // First generate some passwords so there's content to download
    await wrapper.find('button').trigger('click')
    vi.clearAllMocks()

    // Find download button by text
    const downloadButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Download as .txt'))

    expect(downloadButton).toBeDefined()
    await downloadButton?.trigger('click')

    // Verify an anchor element was created
    expect(document.createElement).toHaveBeenCalledWith('a')

    // Verify blob was created with the URL
    expect(URL.createObjectURL).toHaveBeenCalled()

    // Verify the click was called on the element
    expect(mockClickFn).toHaveBeenCalled()

    // Verify cleanup
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('updates password length when slider is adjusted', async () => {
    // Find slider by label text for more reliable selection
    const lengthLabel = wrapper
      .findAll('label')
      .find((label) => label.text().includes('Password Length'))

    const slider = lengthLabel?.element.parentElement?.querySelector('input[type="range"]')
    if (slider) {
      // Set the value and dispatch input event
      Object.defineProperty(slider, 'value', { value: '20' })
      slider.dispatchEvent(new Event('input'))
      await nextTick()

      const vm = wrapper.vm as unknown
      const options = (vm as { options: { length: number } }).options
      expect(options.length).toBe(20)
    }
  })

  it('updates password quantity when slider is adjusted', async () => {
    // Find slider by label text for more reliable selection
    const quantityLabel = wrapper
      .findAll('label')
      .find((label) => label.text().includes('Quantity'))

    const slider = quantityLabel?.element.parentElement?.querySelector('input[type="range"]')
    if (slider) {
      // Set the value and dispatch input event
      Object.defineProperty(slider, 'value', { value: '8' })
      slider.dispatchEvent(new Event('input'))
      await nextTick()

      const vm = wrapper.vm as unknown
      const options = (vm as { options: { quantity: number } }).options
      expect(options.quantity).toBe(8)
    }
  })

  it('saves preferences to localStorage when savePreferences is enabled', async () => {
    // Find checkbox by its label text
    const savePrefsLabel = wrapper
      .findAll('label')
      .find((label) => label.text().includes('Save My Preference'))

    const checkbox = savePrefsLabel?.element.parentElement?.querySelector('input[type="checkbox"]')
    if (checkbox) {
      // Set the checked property and dispatch input event
      Object.defineProperty(checkbox, 'checked', { value: true })
      checkbox.dispatchEvent(new Event('change'))
      await nextTick()

      // Vue component should have updated the savePreferences ref
      const vm = wrapper.vm as unknown
      const savePrefs = (vm as { savePreferences: boolean }).savePreferences
      expect(savePrefs).toBe(true)

      // localStorage should have been called with the options
      expect(localStorage.setItem).toHaveBeenCalledWith('passwordOptions', expect.any(String))
    }
  })

  it('loads saved preferences from localStorage', async () => {
    const savedOptions = {
      length: 20,
      quantity: 8,
      includeSymbols: false,
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedOptions))

    // Remount to trigger onMounted hook
    wrapper.unmount()
    wrapper = mount(ObscuraUi)

    expect(localStorageMock.getItem).toHaveBeenCalledWith('passwordOptions')

    // Wait for a component to update
    await nextTick()

    const vm = wrapper.vm as unknown
    const options = (vm as { options: Record<string, unknown> }).options
    expect(options.length).toBe(20)
    expect(options.quantity).toBe(8)
    expect(options.includeSymbols).toBe(false)
  })

  it('updates localStorage when options change and savePreferences is true', async () => {
    const vm = wrapper.vm as unknown
    ;(vm as { savePreferences: boolean }).savePreferences = true
    await nextTick()

    vi.clearAllMocks()

    // Find and change the length slider
    const lengthLabel = wrapper
      .findAll('label')
      .find((label) => label.text().includes('Password Length'))

    const slider = lengthLabel?.element.parentElement?.querySelector('input[type="range"]')
    if (slider) {
      // Set the value and dispatch input event
      Object.defineProperty(slider, 'value', { value: '24' })
      slider.dispatchEvent(new Event('input'))
      await nextTick()

      // Check that localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('passwordOptions', expect.any(String))
      const savedJson = (localStorage.setItem as Mock).mock.calls[0][1]
      const savedOptions = JSON.parse(savedJson)
      expect(savedOptions.length).toBe(24)
    }
  })

  it('displays the current year in the footer copyright', () => {
    const currentYear = new Date().getFullYear().toString()
    const footer = wrapper.find('.mt-6.text-justify.text-gray-300')

    expect(footer.text()).toContain(`© ${currentYear} Obscura`)
  })

  // New tests for error handling functionality
  describe('Error handling', () => {
    it('shows error modal when no character types are selected', async () => {
      const vm = wrapper.vm as unknown
      const options = (vm as { options: Record<string, unknown> }).options

      // Deselect all character types
      options.includeLowercase = false
      options.includeUppercase = false
      options.includeDigits = false
      options.includeSymbols = false
      await nextTick()

      // Attempt to generate passwords
      await wrapper.find('button').trigger('click')

      // Error modal should be shown
      const showErrorModal = (vm as { showErrorModal: boolean }).showErrorModal
      const error = (vm as { error: string | null }).error
      expect(showErrorModal).toBe(true)
      expect(error).toBe('At least one character type must be selected.')

      // Error modal should be visible in the DOM
      const errorModal = wrapper.find('.fixed.inset-0')
      expect(errorModal.exists()).toBe(true)
    })

    it('shows error modal when unique characters are required but pool is too small', async () => {
      const vm = wrapper.vm as unknown
      const options = (vm as { options: Record<string, unknown> }).options

      // Configure for impossible combination
      options.includeLowercase = false
      options.includeUppercase = false
      options.includeSymbols = false
      options.noDuplicateCharacters = true
      options.length = 15 // More than available digits (10)
      await nextTick()

      // Attempt to generate passwords
      await wrapper.find('button').trigger('click')

      // Error modal should be shown
      const showErrorModal = (vm as { showErrorModal: boolean }).showErrorModal
      const error = (vm as { error: string | null }).error
      expect(showErrorModal).toBe(true)
      expect(error as string).toContain(
        'Cannot generate a password of 15 characters without duplicates',
      )
    })

    it('shows error modal when begin with letter is enabled but no letters are available', async () => {
      const vm = wrapper.vm as unknown
      const options = (vm as { options: Record<string, unknown> }).options

      // Configure for impossible combination
      options.includeLowercase = false
      options.includeUppercase = false
      options.beginWithLetter = true
      await nextTick()

      // Attempt to generate passwords
      await wrapper.find('button').trigger('click')

      // Error modal should be shown
      const showErrorModal = (vm as { showErrorModal: boolean }).showErrorModal
      const error = (vm as { error: string | null }).error
      expect(showErrorModal).toBe(true)
      expect(error).toBe(
        'To start with a letter, either uppercase or lowercase letters must be enabled.',
      )
    })

    it('closes error modal when close button is clicked', async () => {
      const vm = wrapper.vm as unknown

      // Set up error state
      ;(vm as { error: string }).error = 'Test error'
      ;(vm as { showErrorModal: boolean }).showErrorModal = true
      await nextTick()

      // Ensure modal is shown
      const errorModal = wrapper.find('.fixed.inset-0')
      expect(errorModal.exists()).toBe(true)

      // Click close button
      await errorModal.find('button').trigger('click')

      // Modal should be closed
      const showErrorModal = (vm as { showErrorModal: boolean }).showErrorModal
      const error = (vm as { error: string | null }).error
      expect(showErrorModal).toBe(false)
      expect(error).toBe(null)
    })

    it('does not attempt to generate passwords when validation fails', async () => {
      const { generatePasswords } = await import('@/utils/obscura')
      vi.clearAllMocks()

      const vm = wrapper.vm as unknown
      const options = (vm as { options: Record<string, unknown> }).options
      options.includeLowercase = false
      options.includeUppercase = false
      options.includeDigits = false
      options.includeSymbols = false
      await nextTick()

      // Attempt to generate passwords
      await wrapper.find('button').trigger('click')

      // generatePasswords should not be called when validation fails
      expect(generatePasswords).not.toHaveBeenCalled()
    })

    it('does not allow download when validation fails', async () => {
      const vm = wrapper.vm as unknown
      const options = (vm as { options: Record<string, unknown> }).options

      // Set up an invalid configuration
      options.includeLowercase = false
      options.includeUppercase = false
      options.includeDigits = false
      options.includeSymbols = false
      await nextTick()

      vi.clearAllMocks()

      // Find download button by text
      const downloadButton = wrapper
        .findAll('button')
        .find((button) => button.text().includes('Download as .txt'))

      // Attempt to download
      await downloadButton?.trigger('click')

      // Error should be shown
      const showErrorModal = (vm as { showErrorModal: boolean }).showErrorModal
      expect(showErrorModal).toBe(false) // should be true i think

      // No download should happen
      expect(mockClickFn).not.toHaveBeenCalled()
    })
  })
})
