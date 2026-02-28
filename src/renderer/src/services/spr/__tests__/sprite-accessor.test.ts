import { describe, it, expect } from 'vitest'
import { SpriteAccessor } from '../sprite-accessor'
import { writeSpr } from '../spr-writer'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePixels(fill: number, size = 16): Uint8Array {
  const data = new Uint8Array(size)
  data.fill(fill)
  return data
}

function makeSprBuffer(
  sprites: Map<number, Uint8Array>,
  extended = false,
  signature = 0x12345678,
  spriteCount?: number
): ArrayBuffer {
  const count = spriteCount ?? Math.max(0, ...sprites.keys())
  return writeSpr({ signature, spriteCount: count, sprites }, extended)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SpriteAccessor', () => {
  describe('constructor', () => {
    it('reads signature from buffer', () => {
      const sprites = new Map<number, Uint8Array>([[1, makePixels(0xaa)]])
      const buffer = makeSprBuffer(sprites, false, 0xabcdef01)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.signature).toBe(0xabcdef01)
    })

    it('reads sprite count (non-extended)', () => {
      const sprites = new Map<number, Uint8Array>([
        [1, makePixels(0xaa)],
        [2, makePixels(0xbb)],
        [3, makePixels(0xcc)]
      ])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 3)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.spriteCount).toBe(3)
    })

    it('reads sprite count (extended)', () => {
      const sprites = new Map<number, Uint8Array>([
        [1, makePixels(0xaa)],
        [2, makePixels(0xbb)]
      ])
      const buffer = makeSprBuffer(sprites, true, 0x12345678, 2)
      const accessor = new SpriteAccessor(buffer, true)
      expect(accessor.spriteCount).toBe(2)
    })
  })

  describe('has', () => {
    it('returns true for non-empty sprite', () => {
      const sprites = new Map<number, Uint8Array>([[1, makePixels(0xaa)]])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 2)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.has(1)).toBe(true)
    })

    it('returns false for empty sprite slot', () => {
      const sprites = new Map<number, Uint8Array>([[1, makePixels(0xaa)]])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 2)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.has(2)).toBe(false)
    })

    it('returns false for out-of-range id', () => {
      const sprites = new Map<number, Uint8Array>([[1, makePixels(0xaa)]])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 1)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.has(0)).toBe(false)
      expect(accessor.has(99)).toBe(false)
    })
  })

  describe('get', () => {
    it('returns compressed pixels for non-empty sprite', () => {
      const pixels = makePixels(0xaa)
      const sprites = new Map<number, Uint8Array>([[1, pixels]])
      const buffer = makeSprBuffer(sprites, false)
      const accessor = new SpriteAccessor(buffer, false)
      const result = accessor.get(1)
      expect(result).toBeDefined()
      expect(result).toEqual(pixels)
    })

    it('returns undefined for empty sprite slot', () => {
      const sprites = new Map<number, Uint8Array>([[1, makePixels(0xaa)]])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 2)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.get(2)).toBeUndefined()
    })

    it('returns undefined for out-of-range id', () => {
      const sprites = new Map<number, Uint8Array>([[1, makePixels(0xaa)]])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 1)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.get(0)).toBeUndefined()
      expect(accessor.get(99)).toBeUndefined()
    })

    it('extracts multiple sprites correctly', () => {
      const px1 = makePixels(0xaa)
      const px2 = makePixels(0xbb)
      const sprites = new Map<number, Uint8Array>([
        [1, px1],
        [2, px2]
      ])
      const buffer = makeSprBuffer(sprites, false)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.get(1)).toEqual(px1)
      expect(accessor.get(2)).toEqual(px2)
    })
  })

  describe('getNonEmptyCount', () => {
    it('returns count of non-empty sprites', () => {
      const sprites = new Map<number, Uint8Array>([
        [1, makePixels(0xaa)],
        [3, makePixels(0xcc)]
      ])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 5)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.getNonEmptyCount()).toBe(2)
    })

    it('returns 0 for all empty sprites', () => {
      const sprites = new Map<number, Uint8Array>()
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 3)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.getNonEmptyCount()).toBe(0)
    })
  })

  describe('ids', () => {
    it('yields non-empty sprite IDs', () => {
      const sprites = new Map<number, Uint8Array>([
        [1, makePixels(0xaa)],
        [3, makePixels(0xcc)]
      ])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 4)
      const accessor = new SpriteAccessor(buffer, false)
      expect([...accessor.ids()]).toEqual([1, 3])
    })

    it('yields nothing for empty buffer', () => {
      const sprites = new Map<number, Uint8Array>()
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 3)
      const accessor = new SpriteAccessor(buffer, false)
      expect([...accessor.ids()]).toEqual([])
    })
  })

  describe('extractAll', () => {
    it('returns Map with all non-empty sprites', () => {
      const px1 = makePixels(0xaa)
      const px2 = makePixels(0xcc)
      const sprites = new Map<number, Uint8Array>([
        [1, px1],
        [3, px2]
      ])
      const buffer = makeSprBuffer(sprites, false, 0x12345678, 4)
      const accessor = new SpriteAccessor(buffer, false)
      const all = accessor.extractAll()
      expect(all.size).toBe(2)
      expect(all.get(1)).toEqual(px1)
      expect(all.get(3)).toEqual(px2)
    })
  })

  describe('getBufferSize', () => {
    it('returns byte length of buffer', () => {
      const sprites = new Map<number, Uint8Array>([[1, makePixels(0xaa)]])
      const buffer = makeSprBuffer(sprites, false)
      const accessor = new SpriteAccessor(buffer, false)
      expect(accessor.getBufferSize()).toBe(buffer.byteLength)
    })
  })

  describe('dispose', () => {
    it('releases buffer and addresses', () => {
      const sprites = new Map<number, Uint8Array>([[1, makePixels(0xaa)]])
      const buffer = makeSprBuffer(sprites, false)
      const accessor = new SpriteAccessor(buffer, false)
      accessor.dispose()
      expect(accessor.get(1)).toBeUndefined()
      expect(accessor.has(1)).toBe(false)
      expect(accessor.getBufferSize()).toBe(0)
      expect(accessor.getNonEmptyCount()).toBe(0)
      expect([...accessor.ids()]).toEqual([])
    })
  })

  describe('extended format', () => {
    it('handles extended sprites correctly', () => {
      const px = makePixels(0xdd)
      const sprites = new Map<number, Uint8Array>([[1, px]])
      const buffer = makeSprBuffer(sprites, true)
      const accessor = new SpriteAccessor(buffer, true)
      expect(accessor.spriteCount).toBe(1)
      expect(accessor.get(1)).toEqual(px)
    })
  })
})
