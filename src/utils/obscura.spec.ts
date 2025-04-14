import { test, expect, describe } from 'vitest'
import {
  generatePasswords,
  validatePasswordOptions,
  type PasswordOptions,
} from '@/utils/obscura.ts'

describe('Test obscura utility', () => {
  const defaultOptions: PasswordOptions = {
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeDigits: true,
    includeSymbols: true,
    excludeSimilarCharacters: false,
    noDuplicateCharacters: false,
    noSequentialCharacters: false,
    beginWithLetter: false,
    quantity: 1,
  }

  // Test validation function separately
  describe('validatePasswordOptions', () => {
    test('should validate valid options', () => {
      const validation = validatePasswordOptions(defaultOptions)
      expect(validation.valid).toBe(true)
      expect(validation.message).toBe('')
    })

    test('should reject when no character types are selected', () => {
      const options = {
        ...defaultOptions,
        includeLowercase: false,
        includeUppercase: false,
        includeDigits: false,
        includeSymbols: false,
      }

      const validation = validatePasswordOptions(options)
      expect(validation.valid).toBe(false)
      expect(validation.message).toBe('At least one character type must be selected.')
    })

    test('should reject when pool is too small for unique characters', () => {
      const options = {
        ...defaultOptions,
        includeLowercase: false,
        includeUppercase: false,
        includeSymbols: false,
        includeDigits: true, // Only digits (10 characters)
        noDuplicateCharacters: true,
        length: 12, // More than available digits
      }

      const validation = validatePasswordOptions(options)
      expect(validation.valid).toBe(false)
      expect(validation.message).toContain(
        'Cannot generate a password of 12 characters without duplicates',
      )
    })

    test('should reject when beginWithLetter is true but no letter types are enabled', () => {
      const options = {
        ...defaultOptions,
        includeLowercase: false,
        includeUppercase: false,
        beginWithLetter: true,
      }

      const validation = validatePasswordOptions(options)
      expect(validation.valid).toBe(false)
      expect(validation.message).toBe(
        'To start with a letter, either uppercase or lowercase letters must be enabled.',
      )
    })
  })

  // Test edge cases for quantity parameter
  test('should generate no passwords when quantity is 0', () => {
    const options = { ...defaultOptions, quantity: 0 }
    const passwords = generatePasswords(options)
    expect(passwords).toHaveLength(0)
  })

  test('should generate a large number of passwords', () => {
    const options = { ...defaultOptions, quantity: 20 }
    const passwords = generatePasswords(options)
    expect(passwords).toHaveLength(20)
    passwords.forEach((password) => {
      expect(password.length).toBe(16)
    })
  })

  // Test with extreme but valid length values
  test('should handle minimum valid length', () => {
    const options = { ...defaultOptions, length: 12 }
    const passwords = generatePasswords(options)
    expect(passwords[0].length).toBe(12)
  })

  test('should handle maximum valid length', () => {
    const options = { ...defaultOptions, length: 64 }
    const passwords = generatePasswords(options)
    expect(passwords[0].length).toBe(64)
  })

  // Test with custom character combinations
  test('should generate passwords with only lowercase and digits', () => {
    const options = {
      ...defaultOptions,
      includeUppercase: false,
      includeSymbols: false,
    }
    const passwords = generatePasswords(options)
    expect(passwords[0]).toMatch(/^[a-z0-9]+$/)
  })

  test('should generate passwords with only uppercase and symbols', () => {
    const options = {
      ...defaultOptions,
      includeLowercase: false,
      includeDigits: false,
    }
    const passwords = generatePasswords(options)
    expect(passwords[0]).toMatch(/^[A-Z!"#$%&'()*+,\-./:;<=>?@[\]^_{|}~`]+$/)
  })

  // Complex combinations test
  test('should handle complex combination with limited character set', () => {
    const options = {
      ...defaultOptions,
      includeUppercase: false,
      includeSymbols: false,
      excludeSimilarCharacters: true,
      noDuplicateCharacters: true,
      length: 20,
    }
    const passwords = generatePasswords(options)

    // Should not contain uppercase or symbols
    expect(passwords[0]).not.toMatch(/[A-Z!"#$%&'()*+,\-./:;<=>?@[\]^_{|}~`]/)

    // Should not contain similar characters
    expect(passwords[0]).not.toMatch(/[il1Lo0O]/)

    // Should not have duplicates
    const uniqueChars = new Set(passwords[0]).size
    expect(uniqueChars).toBe(passwords[0].length)
  })

  // Test error case for very small pool with no duplicates
  test('should handle edge case with limited pool size but sufficient for length', () => {
    const options = {
      ...defaultOptions,
      includeLowercase: false,
      includeUppercase: false,
      includeSymbols: false,
      noDuplicateCharacters: true,
      length: 10, // Only 10 digits available, just enough
    }
    const passwords = generatePasswords(options)
    expect(passwords[0].length).toBe(10)
    expect(passwords[0]).toMatch(/^[0-9]+$/)

    // All digits should be used exactly once
    const digitCounts = new Array(10).fill(0)
    for (const char of passwords[0]) {
      digitCounts[parseInt(char)]++
    }
    expect(digitCounts.every((count) => count === 1)).toBe(true)
  })

  // Test the beginWithLetter option
  test('should generate passwords that begin with a letter when specified', () => {
    const options = {
      ...defaultOptions,
      beginWithLetter: true,
    }
    const passwords = generatePasswords(options)
    expect(passwords[0].charAt(0)).toMatch(/[a-zA-Z]/)
  })

  // Test the noSequentialCharacters option
  test('should generate passwords without sequential characters when specified', () => {
    const options = {
      ...defaultOptions,
      noSequentialCharacters: true,
      length: 20,
    }
    const passwords = generatePasswords(options)

    // Check that there are no sequential characters (3 in a row)
    for (let i = 0; i < passwords[0].length - 2; i++) {
      const a = passwords[0].charCodeAt(i)
      const b = passwords[0].charCodeAt(i + 1)
      const c = passwords[0].charCodeAt(i + 2)
      expect((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1)).toBe(false)
    }
  })

  // Test for expected errors with updated error messages
  test('should throw error when no character types are selected', () => {
    const options = {
      ...defaultOptions,
      includeLowercase: false,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
    }

    expect(() => generatePasswords(options)).toThrow(
      'At least one character type must be selected.',
    )
  })

  test('should throw error when beginWithLetter is true but no letter types are enabled', () => {
    const options = {
      ...defaultOptions,
      includeLowercase: false,
      includeUppercase: false,
      beginWithLetter: true,
    }

    expect(() => generatePasswords(options)).toThrow(
      'To start with a letter, either uppercase or lowercase letters must be enabled.',
    )
  })

  test('should throw error when pool is too small for unique characters', () => {
    const options = {
      ...defaultOptions,
      includeLowercase: false,
      includeUppercase: false,
      includeSymbols: false,
      noDuplicateCharacters: true,
      length: 12, // More than the 10 available digits
    }

    expect(() => generatePasswords(options)).toThrow(
      'Cannot generate a password of 12 characters without duplicates',
    )
  })

  // Test the minimum length override behavior
  test('should enforce minimum length of 8 characters', () => {
    const options = {
      ...defaultOptions,
      length: 3, // Try to set length below the minimum
    }

    const passwords = generatePasswords(options)
    expect(passwords[0].length).toBe(8) // Should be adjusted to the minimum
  })
})
