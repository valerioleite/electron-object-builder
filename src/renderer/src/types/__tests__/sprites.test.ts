import { describe, it, expect } from 'vitest'
import {
  SPRITE_DEFAULT_SIZE,
  SPRITE_DEFAULT_DATA_SIZE,
  SPRITE_DEFAULT_VALUE,
  createSpriteData,
  cloneSpriteData,
  isSpriteDataEmpty
} from '../sprites'

// ---------------------------------------------------------------------------
// Sprite Constants
// ---------------------------------------------------------------------------

describe('Sprite Constants', () => {
  it('SPRITE_DEFAULT_SIZE is 32', () => {
    expect(SPRITE_DEFAULT_SIZE).toBe(32)
  })

  it('SPRITE_DEFAULT_DATA_SIZE is 4096 (32 * 32 * 4)', () => {
    expect(SPRITE_DEFAULT_DATA_SIZE).toBe(4096)
    expect(SPRITE_DEFAULT_DATA_SIZE).toBe(32 * 32 * 4)
  })

  it('SPRITE_DEFAULT_VALUE is "32x32"', () => {
    expect(SPRITE_DEFAULT_VALUE).toBe('32x32')
  })
})

// ---------------------------------------------------------------------------
// createSpriteData
// ---------------------------------------------------------------------------

describe('createSpriteData', () => {
  it('creates sprite data with default id=0 and fills transparent magenta', () => {
    const sd = createSpriteData()
    expect(sd.id).toBe(0)
    expect(sd.pixels).not.toBeNull()
    expect(sd.pixels!.length).toBe(SPRITE_DEFAULT_DATA_SIZE)
  })

  it('creates sprite data with specified id', () => {
    const sd = createSpriteData(42)
    expect(sd.id).toBe(42)
    expect(sd.pixels).not.toBeNull()
  })

  it('fills pixels with transparent magenta (0xFFFF00FF ARGB) when no pixels provided', () => {
    const sd = createSpriteData()
    const pixels = sd.pixels!
    // Check the first pixel: A=0xFF, R=0xFF, G=0x00, B=0xFF
    expect(pixels[0]).toBe(0xff) // Alpha
    expect(pixels[1]).toBe(0xff) // Red
    expect(pixels[2]).toBe(0x00) // Green
    expect(pixels[3]).toBe(0xff) // Blue
  })

  it('fills every pixel with the magenta pattern', () => {
    const sd = createSpriteData()
    const pixels = sd.pixels!
    for (let i = 0; i < SPRITE_DEFAULT_DATA_SIZE; i += 4) {
      expect(pixels[i]).toBe(0xff) // Alpha
      expect(pixels[i + 1]).toBe(0xff) // Red
      expect(pixels[i + 2]).toBe(0x00) // Green
      expect(pixels[i + 3]).toBe(0xff) // Blue
    }
  })

  it('uses provided pixels directly without filling magenta', () => {
    const customPixels = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80])
    const sd = createSpriteData(5, customPixels)
    expect(sd.id).toBe(5)
    expect(sd.pixels).toBe(customPixels) // Same reference
    expect(sd.pixels![0]).toBe(10)
    expect(sd.pixels![7]).toBe(80)
  })

  it('stores the exact same Uint8Array reference when pixels are provided', () => {
    const customPixels = new Uint8Array(4096)
    const sd = createSpriteData(1, customPixels)
    expect(sd.pixels).toBe(customPixels)
  })

  it('creates pixels of exactly SPRITE_DEFAULT_DATA_SIZE length when null', () => {
    const sd = createSpriteData(0, null)
    expect(sd.pixels).not.toBeNull()
    expect(sd.pixels!.length).toBe(4096)
  })

  it('default pixels (null) create a 4096-byte array with 1024 magenta pixels', () => {
    const sd = createSpriteData()
    const pixelCount = sd.pixels!.length / 4
    expect(pixelCount).toBe(1024) // 32 * 32
  })
})

// ---------------------------------------------------------------------------
// cloneSpriteData
// ---------------------------------------------------------------------------

describe('cloneSpriteData', () => {
  it('clones sprite data with the same id', () => {
    const original = createSpriteData(42)
    const cloned = cloneSpriteData(original)
    expect(cloned.id).toBe(42)
  })

  it('returns a different object reference', () => {
    const original = createSpriteData(1)
    const cloned = cloneSpriteData(original)
    expect(cloned).not.toBe(original)
  })

  it('creates a new Uint8Array for pixels (deep copy)', () => {
    const original = createSpriteData(1)
    const cloned = cloneSpriteData(original)
    expect(cloned.pixels).not.toBe(original.pixels)
    expect(cloned.pixels).toEqual(original.pixels)
  })

  it('does not share pixel mutations with the original', () => {
    const original = createSpriteData(1)
    const cloned = cloneSpriteData(original)
    cloned.pixels![0] = 0x00
    expect(original.pixels![0]).toBe(0xff) // Still magenta alpha
  })

  it('returns null pixels when original has null pixels', () => {
    const original = { id: 5, pixels: null }
    const cloned = cloneSpriteData(original)
    expect(cloned.id).toBe(5)
    expect(cloned.pixels).toBeNull()
  })

  it('preserves pixel data in the clone', () => {
    const customPixels = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
    const original = createSpriteData(10, customPixels)
    const cloned = cloneSpriteData(original)
    expect(cloned.pixels!.length).toBe(8)
    expect(cloned.pixels![0]).toBe(1)
    expect(cloned.pixels![7]).toBe(8)
  })

  it('clones sprite with custom pixels of non-standard length', () => {
    const customPixels = new Uint8Array(100)
    customPixels[50] = 0xab
    const original = createSpriteData(99, customPixels)
    const cloned = cloneSpriteData(original)
    expect(cloned.pixels!.length).toBe(100)
    expect(cloned.pixels![50]).toBe(0xab)
    expect(cloned.pixels).not.toBe(original.pixels)
  })
})

// ---------------------------------------------------------------------------
// isSpriteDataEmpty
// ---------------------------------------------------------------------------

describe('isSpriteDataEmpty', () => {
  it('returns true when pixels is null', () => {
    const sd = { id: 1, pixels: null }
    expect(isSpriteDataEmpty(sd)).toBe(true)
  })

  it('returns true when pixels is an empty Uint8Array', () => {
    const sd = { id: 1, pixels: new Uint8Array(0) }
    expect(isSpriteDataEmpty(sd)).toBe(true)
  })

  it('returns false when pixels has data', () => {
    const sd = createSpriteData(1)
    expect(isSpriteDataEmpty(sd)).toBe(false)
  })

  it('returns false when pixels has even a single byte', () => {
    const sd = { id: 1, pixels: new Uint8Array([0xff]) }
    expect(isSpriteDataEmpty(sd)).toBe(false)
  })

  it('returns false for default sprite data (has magenta pixels)', () => {
    const sd = createSpriteData()
    expect(isSpriteDataEmpty(sd)).toBe(false)
  })

  it('returns false for sprite with custom non-empty pixels', () => {
    const sd = createSpriteData(5, new Uint8Array([0, 0, 0, 0]))
    expect(isSpriteDataEmpty(sd)).toBe(false)
  })

  it('returns true for manually constructed sprite with null pixels', () => {
    expect(isSpriteDataEmpty({ id: 0, pixels: null })).toBe(true)
  })

  it('returns true for manually constructed sprite with zero-length array', () => {
    expect(isSpriteDataEmpty({ id: 100, pixels: new Uint8Array([]) })).toBe(true)
  })
})
