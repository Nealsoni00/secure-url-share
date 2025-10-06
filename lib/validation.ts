/**
 * Validates that a name is legitimate and not fake/incomplete
 * Rejects common fake names like "test", "fake", single characters, etc.
 */
export function validateRealName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' }
  }

  const trimmedName = name.trim()

  // Must be at least 2 characters
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Please enter your full name (at least 2 characters)' }
  }

  // Must be at most 100 characters
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Name is too long (maximum 100 characters)' }
  }

  // Convert to lowercase for checking against fake names
  const lowerName = trimmedName.toLowerCase()

  // List of common fake/test names
  const fakeNames = [
    'test',
    'fake',
    'asdf',
    'qwerty',
    'admin',
    'user',
    'guest',
    'anonymous',
    'anon',
    'none',
    'n/a',
    'na',
    'xxx',
    'aaa',
    'bbb',
    'sample',
    'example',
    'demo',
    'placeholder',
    'name',
    'your name',
    'firstname',
    'lastname',
    'full name',
    'enter name',
    'abc',
    '123',
    'testing',
    'temp',
    'temporary',
    'foobar',
    'foo',
    'bar'
  ]

  if (fakeNames.includes(lowerName)) {
    return { valid: false, error: 'Please enter your real full name' }
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return { valid: false, error: 'Name must contain at least one letter' }
  }

  // Should have at least one space (first + last name)
  if (!trimmedName.includes(' ')) {
    return { valid: false, error: 'Please enter your full name (first and last name)' }
  }

  // Check if it's just single letters (like "a b")
  const words = trimmedName.split(/\s+/)
  if (words.every(word => word.length === 1)) {
    return { valid: false, error: 'Please enter your full name' }
  }

  // Must have at least 2 words with at least 2 characters each
  const validWords = words.filter(word => word.length >= 2)
  if (validWords.length < 2) {
    return { valid: false, error: 'Please enter your full name (first and last name)' }
  }

  return { valid: true }
}
