const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = `!"#$%&'()*+,-./:;<=>?@[]^_{|}~\``
const SIMILAR = 'il1Lo0O'

export interface PasswordOptions {
  length: number
  includeLowercase: boolean
  includeUppercase: boolean
  includeDigits: boolean
  includeSymbols: boolean
  excludeSimilarCharacters: boolean
  noDuplicateCharacters: boolean
  noSequentialCharacters: boolean
  beginWithLetter: boolean
  quantity: number
}

/**
 * Creates a character pool based on the provided password options.
 * @param options - The password generation options.
 * @returns A string containing all characters that can be used for password generation.
 */
function getCharacterPool(options: PasswordOptions): string {
  let pool = ''
  if (options.includeLowercase) pool += LOWERCASE
  if (options.includeUppercase) pool += UPPERCASE
  if (options.includeDigits) pool += DIGITS
  if (options.includeSymbols) pool += SYMBOLS
  if (options.excludeSimilarCharacters) {
    pool = pool
      .split('')
      .filter((c) => !SIMILAR.includes(c))
      .join('')
  }
  return pool
}

/**
 * Checks if a password contains sequential characters.
 * Sequential characters are three consecutive characters that form an ascending
 * or descending sequence (e.g., "abc", "321").
 *
 * @param password - The password string to check for sequential characters
 * @returns {boolean} True if sequential characters are found, false otherwise
 */
function hasSequentialCharacters(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    const a = password.charCodeAt(i)
    const b = password.charCodeAt(i + 1)
    const c = password.charCodeAt(i + 2)
    if ((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1)) {
      return true
    }
  }
  return false
}

/**
 * Gets a random character from the provided character pool.
 * Uses cryptographically secure random number generation.
 * @param {string} pool - The pool of characters to select from
 * @returns {string} A randomly selected character from the pool
 */
function getRandomChar(pool: string): string {
  const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % pool.length
  return pool.charAt(randomIndex)
}

/**
 * Generates a random password based on the provided options.
 *
 * The function creates a password that conforms to all specified options:
 * - Uses appropriate character types (lowercase, uppercase, digits, symbols)
 * - Can start with a letter if specified
 * - Avoids similar-looking characters if specified
 * - Ensures no duplicate characters if specified
 * - Prevents sequential characters if specified
 *
 * @param {PasswordOptions} options - Configuration options for password generation
 * @returns {string} A randomly generated password matching the specified criteria
 * @throws {Error} If no character types are selected
 * @throws {Error} If unique characters are required but the pool is too small
 * @throws {Error} If begin-with-letter is required but no letter types are enabled
 * @throws {Error} If a password meeting all criteria cannot be generated after multiple attempts
 */
function generatePassword(options: PasswordOptions): string {
  const pool: string = getCharacterPool(options)
  if (pool.length === 0) {
    throw new Error('At least one character type must be selected.')
  }

  // Check that the requested length is compatible with the "noDuplicateCharacters" option
  if (options.noDuplicateCharacters && options.length > pool.length) {
    throw new Error(
      `Cannot generate a password of ${options.length} characters without duplicates using only ${pool.length} available characters.`,
    )
  }

  // Create separate pools for the first letter if needed
  let firstCharPool = pool
  if (options.beginWithLetter) {
    firstCharPool = ''
    if (options.includeLowercase) firstCharPool += LOWERCASE
    if (options.includeUppercase) firstCharPool += UPPERCASE
    if (options.excludeSimilarCharacters) {
      firstCharPool = firstCharPool
        .split('')
        .filter((c) => !SIMILAR.includes(c))
        .join('')
    }
    if (firstCharPool.length === 0) {
      throw new Error(
        'To start with a letter, either uppercase or lowercase letters must be enabled.',
      )
    }
  }

  // Generate password
  let attempts = 0
  const maxAttempts = 100 //Avoid an infinite loop

  while (attempts < maxAttempts) {
    attempts++
    const result: string[] = []
    const usedChars = new Set<string>()

    // Generate the first character
    const firstChar = getRandomChar(firstCharPool)
    result.push(firstChar)
    if (options.noDuplicateCharacters) {
      usedChars.add(firstChar)
    }

    // Generate the rest of the characters
    for (let i = 1; i < options.length; i++) {
      let nextChar: string
      let maxTries = 50 // Avoid an infinite loop to find a unique character

      do {
        nextChar = getRandomChar(pool)
        maxTries--
      } while (options.noDuplicateCharacters && usedChars.has(nextChar) && maxTries > 0)

      // If you can't find a unique character, start over.
      if (options.noDuplicateCharacters && usedChars.has(nextChar)) {
        break
      }

      result.push(nextChar)
      if (options.noDuplicateCharacters) {
        usedChars.add(nextChar)
      }
    }

    // Check that we have the correct length
    if (result.length < options.length) {
      continue //Retry if the password is too short
    }

    const password = result.join('')

    // Check character sequences if necessary
    if (options.noSequentialCharacters && hasSequentialCharacters(password)) {
      continue // Restart if sequences are detected
    }

    return password
  }

  throw new Error('Unable to generate a password that meets all criteria after multiple attempts.')
}

/**
 * Generates multiple passwords based on the provided options.
 *
 * This function creates an array of passwords that match the specified criteria.
 * The password length is constrained between 12 and 64 characters for security
 * and practicality, regardless of the input length.
 *
 * @param {PasswordOptions} options - Configuration options for password generation
 * @returns {string[]} An array of generated passwords
 * @throws {Error} If password generation fails (inherited from generatePassword)
 */
export function generatePasswords(options: PasswordOptions): string[] {
  // Ensure length is between 8 and 64 (as per specifications)
  const safeLength = Math.max(8, Math.min(options.length, 64))
  const passwords: string[] = []

  for (let i = 0; i < options.quantity; i++) {
    passwords.push(generatePassword({ ...options, length: safeLength }))
  }
  return passwords
}
