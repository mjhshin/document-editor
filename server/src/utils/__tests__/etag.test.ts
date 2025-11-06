import { generateETag, validateETag } from '../etag'

describe('generateETag', () => {
  it('should generate consistent ETag for same inputs', () => {
    const content = 'Hello world'
    const version = 1
    const updatedAt = new Date('2024-01-01T00:00:00Z')

    const etag1 = generateETag(content, version, updatedAt)
    const etag2 = generateETag(content, version, updatedAt)

    expect(etag1).toBe(etag2)
  })

  it('should generate different ETags for different content', () => {
    const version = 1
    const updatedAt = new Date('2024-01-01T00:00:00Z')

    const etag1 = generateETag('content 1', version, updatedAt)
    const etag2 = generateETag('content 2', version, updatedAt)

    expect(etag1).not.toBe(etag2)
  })

  it('should generate different ETags for different versions', () => {
    const content = 'Hello world'
    const updatedAt = new Date('2024-01-01T00:00:00Z')

    const etag1 = generateETag(content, 1, updatedAt)
    const etag2 = generateETag(content, 2, updatedAt)

    expect(etag1).not.toBe(etag2)
  })

  it('should generate different ETags for different timestamps', () => {
    const content = 'Hello world'
    const version = 1

    const etag1 = generateETag(content, version, new Date('2024-01-01T00:00:00Z'))
    const etag2 = generateETag(content, version, new Date('2024-01-02T00:00:00Z'))

    expect(etag1).not.toBe(etag2)
  })
})

describe('validateETag', () => {
  it('should return true for matching ETags', () => {
    const etag = 'abc123def456'
    const result = validateETag(etag, etag)
    expect(result).toBe(true)
  })

  it('should return false for non-matching ETags', () => {
    const etag1 = 'abc123def456'
    const etag2 = 'xyz789uvw012'
    const result = validateETag(etag1, etag2)
    expect(result).toBe(false)
  })

  it('should be case-sensitive', () => {
    const etag1 = 'abc123'
    const etag2 = 'ABC123'
    const result = validateETag(etag1, etag2)
    expect(result).toBe(false)
  })
})

