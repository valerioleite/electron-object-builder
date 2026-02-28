import { describe, it, expect, beforeAll } from 'vitest'
import {
  buildSpriteSheet,
  buildColoredSpriteSheet,
  extractFrame,
  frameToImageData,
  drawCheckerboard
} from '../sprite-composer'
import type { SpritePixelProvider } from '../sprite-composer'
import { createFrameGroup, type FrameGroup, FrameGroupType } from '../../../types/animation'
import { SPRITE_DEFAULT_SIZE, SPRITE_DEFAULT_DATA_SIZE } from '../../../types/sprites'
import { createOutfitData } from '../outfit-data'

// Polyfill ImageData for jsdom (not available natively)
beforeAll(() => {
  if (typeof globalThis.ImageData === 'undefined') {
    ;(globalThis as Record<string, unknown>).ImageData = class ImageData {
      data: Uint8ClampedArray
      width: number
      height: number
      constructor(data: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
        if (typeof data === 'number') {
          this.width = data
          this.height = widthOrHeight!
          this.data = new Uint8ClampedArray(this.width * this.height * 4)
        } else {
          this.data = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data)
          this.width = widthOrHeight!
          this.height = height ?? (data.length / 4 / widthOrHeight!)
        }
      }
    }
  }
})

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Create a solid-color sprite (32x32) in ARGB format */
function makeSolidSprite(a: number, r: number, g: number, b: number): Uint8Array {
  const pixels = new Uint8Array(SPRITE_DEFAULT_DATA_SIZE)
  for (let i = 0; i < SPRITE_DEFAULT_DATA_SIZE; i += 4) {
    pixels[i] = a
    pixels[i + 1] = r
    pixels[i + 2] = g
    pixels[i + 3] = b
  }
  return pixels
}

/** Create a provider that returns the same sprite for every index */
function makeConstantProvider(sprite: Uint8Array | null): SpritePixelProvider {
  return () => sprite
}

/** Create a provider that maps sprite array index to a specific sprite */
function makeIndexedProvider(sprites: (Uint8Array | null)[]): SpritePixelProvider {
  return (idx) => sprites[idx] ?? null
}

/** Create a frame group with specific dimensions */
function makeFg(overrides: Partial<FrameGroup> = {}): FrameGroup {
  const fg = createFrameGroup()
  return { ...fg, ...overrides }
}

// ---------------------------------------------------------------------------
// buildSpriteSheet
// ---------------------------------------------------------------------------

describe('buildSpriteSheet', () => {
  it('returns empty sheet for zero-size frame group', () => {
    const fg = makeFg({ width: 0, height: 0 })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(null))
    expect(sheet.width).toBe(0)
    expect(sheet.height).toBe(0)
    expect(sheet.pixels.length).toBe(0)
    expect(sheet.textureIndex.length).toBe(0)
  })

  it('builds single-sprite sheet (1x1, 1 layer, 1 pattern, 1 frame)', () => {
    const sprite = makeSolidSprite(0xff, 0xaa, 0xbb, 0xcc)
    const fg = makeFg({ spriteIndex: [1] })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(sprite))

    expect(sheet.width).toBe(SPRITE_DEFAULT_SIZE)
    expect(sheet.height).toBe(SPRITE_DEFAULT_SIZE)
    expect(sheet.pixels.length).toBe(SPRITE_DEFAULT_SIZE * SPRITE_DEFAULT_SIZE * 4)
    expect(sheet.textureIndex.length).toBe(1)
    expect(sheet.textureIndex[0]).toEqual({
      x: 0,
      y: 0,
      width: SPRITE_DEFAULT_SIZE,
      height: SPRITE_DEFAULT_SIZE
    })

    // Verify pixel content
    expect(sheet.pixels[0]).toBe(0xff) // A
    expect(sheet.pixels[1]).toBe(0xaa) // R
    expect(sheet.pixels[2]).toBe(0xbb) // G
    expect(sheet.pixels[3]).toBe(0xcc) // B
  })

  it('handles null sprites (transparent)', () => {
    const fg = makeFg({ spriteIndex: [0] })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(null))

    expect(sheet.width).toBe(SPRITE_DEFAULT_SIZE)
    expect(sheet.height).toBe(SPRITE_DEFAULT_SIZE)
    // All pixels should be 0 (transparent)
    expect(sheet.pixels.every((b) => b === 0)).toBe(true)
  })

  it('builds multi-tile sprite sheet (2x2)', () => {
    const sprites = [
      makeSolidSprite(0xff, 0xff, 0x00, 0x00), // index 0
      makeSolidSprite(0xff, 0x00, 0xff, 0x00), // index 1
      makeSolidSprite(0xff, 0x00, 0x00, 0xff), // index 2
      makeSolidSprite(0xff, 0xff, 0xff, 0x00) // index 3
    ]
    const fg = makeFg({
      width: 2,
      height: 2,
      spriteIndex: [0, 1, 2, 3]
    })
    const sheet = buildSpriteSheet(fg, makeIndexedProvider(sprites))

    expect(sheet.width).toBe(2 * SPRITE_DEFAULT_SIZE)
    expect(sheet.height).toBe(2 * SPRITE_DEFAULT_SIZE)
    expect(sheet.textureIndex.length).toBe(1)
  })

  it('builds sheet with patterns (4 directions)', () => {
    const sprite = makeSolidSprite(0xff, 0x80, 0x80, 0x80)
    const fg = makeFg({
      patternX: 4,
      spriteIndex: [1, 2, 3, 4]
    })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(sprite))

    // totalX = patternZ * patternX * layers = 1 * 4 * 1 = 4
    // sheet width = 4 * 1 * 32 = 128
    expect(sheet.width).toBe(4 * SPRITE_DEFAULT_SIZE)
    expect(sheet.height).toBe(SPRITE_DEFAULT_SIZE)
    expect(sheet.textureIndex.length).toBe(4)
  })

  it('builds sheet with multiple frames', () => {
    const sprite = makeSolidSprite(0xff, 0x40, 0x40, 0x40)
    const fg = makeFg({
      frames: 3,
      spriteIndex: [1, 2, 3]
    })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(sprite))

    // totalY = frames * patternY = 3 * 1 = 3
    // sheet height = 3 * 1 * 32 = 96
    expect(sheet.width).toBe(SPRITE_DEFAULT_SIZE)
    expect(sheet.height).toBe(3 * SPRITE_DEFAULT_SIZE)
    expect(sheet.textureIndex.length).toBe(3)
  })

  it('builds sheet with 2 layers', () => {
    const sprite = makeSolidSprite(0xff, 0xcc, 0xcc, 0xcc)
    const fg = makeFg({
      layers: 2,
      spriteIndex: [1, 2]
    })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(sprite))

    // totalX = patternZ * patternX * layers = 1 * 1 * 2 = 2
    expect(sheet.width).toBe(2 * SPRITE_DEFAULT_SIZE)
    expect(sheet.height).toBe(SPRITE_DEFAULT_SIZE)
    expect(sheet.textureIndex.length).toBe(2)
  })

  it('applies background color', () => {
    const fg = makeFg({ spriteIndex: [0] })
    // ARGB: fully opaque magenta 0xFFFF00FF
    const sheet = buildSpriteSheet(fg, makeConstantProvider(null), 0xffff00ff)

    expect(sheet.pixels[0]).toBe(0xff) // A
    expect(sheet.pixels[1]).toBe(0xff) // R
    expect(sheet.pixels[2]).toBe(0x00) // G
    expect(sheet.pixels[3]).toBe(0xff) // B
  })

  it('builds complex layout (2x2 tiles, 4 patterns, 2 layers, 3 frames)', () => {
    const sprite = makeSolidSprite(0xff, 0x50, 0x50, 0x50)
    const totalSprites = 2 * 2 * 4 * 1 * 1 * 2 * 3 // w*h*patX*patY*patZ*layers*frames = 96
    const fg = makeFg({
      width: 2,
      height: 2,
      patternX: 4,
      layers: 2,
      frames: 3,
      spriteIndex: new Array(totalSprites).fill(1)
    })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(sprite))

    // totalX = 1 * 4 * 2 = 8, totalY = 3 * 1 = 3
    // width = 8 * 2 * 32 = 512, height = 3 * 2 * 32 = 192
    expect(sheet.width).toBe(8 * 2 * SPRITE_DEFAULT_SIZE)
    expect(sheet.height).toBe(3 * 2 * SPRITE_DEFAULT_SIZE)
    expect(sheet.textureIndex.length).toBe(4 * 1 * 1 * 2 * 3) // patX*patY*patZ*layers*frames = 24
  })
})

// ---------------------------------------------------------------------------
// buildColoredSpriteSheet
// ---------------------------------------------------------------------------

describe('buildColoredSpriteSheet', () => {
  it('returns normal sheet when layers < 2', () => {
    const sprite = makeSolidSprite(0xff, 0x80, 0x80, 0x80)
    const fg = makeFg({ layers: 1, spriteIndex: [1] })
    const outfit = createOutfitData(10, 20, 30, 40)
    const sheet = buildColoredSpriteSheet(fg, makeConstantProvider(sprite), outfit)

    expect(sheet.width).toBe(SPRITE_DEFAULT_SIZE)
    expect(sheet.height).toBe(SPRITE_DEFAULT_SIZE)
    // Should just be the normal sprite (no colorization)
    expect(sheet.pixels[1]).toBe(0x80) // R
  })

  it('produces flattened output for 2-layer outfit', () => {
    // Gray layer (layer 0): solid gray
    const gray = makeSolidSprite(0xff, 0x80, 0x80, 0x80)
    // Blend layer (layer 1): solid blue (feet region)
    const blend = makeSolidSprite(0xff, 0x00, 0x00, 0xff)
    const sprites = [gray, blend]

    const fg = makeFg({
      layers: 2,
      patternX: 4,
      patternY: 1,
      type: FrameGroupType.DEFAULT,
      spriteIndex: new Array(8).fill(0).map((_, i) => i)
    })

    const outfit = createOutfitData(10, 20, 30, 40)
    const sheet = buildColoredSpriteSheet(fg, makeIndexedProvider(sprites), outfit)

    // Output should be flattened: patternZ * patternX * pixelsWidth
    expect(sheet.width).toBe(4 * SPRITE_DEFAULT_SIZE) // 4 directions
    expect(sheet.height).toBe(SPRITE_DEFAULT_SIZE) // 1 frame
    // Texture index should have patternX entries (no layers dimension)
    expect(sheet.textureIndex.length).toBe(4)
  })

  it('handles empty sprite sheet for zero-size', () => {
    const fg = makeFg({ width: 0, layers: 2, spriteIndex: [] })
    const outfit = createOutfitData()
    const sheet = buildColoredSpriteSheet(fg, makeConstantProvider(null), outfit)
    expect(sheet.width).toBe(0)
    expect(sheet.height).toBe(0)
  })

  it('applies addon layers when addon bitmask is set', () => {
    const gray = makeSolidSprite(0xff, 0x80, 0x80, 0x80)
    const blend = makeSolidSprite(0xff, 0x00, 0x00, 0xff)
    const sprites = [gray, blend, gray, blend] // patternY=0 and patternY=1

    const fg = makeFg({
      layers: 2,
      patternY: 2, // base + addon1
      spriteIndex: new Array(4).fill(0).map((_, i) => i)
    })

    // With addon 1 enabled
    const outfit = createOutfitData(10, 20, 30, 40, 1)
    const sheet = buildColoredSpriteSheet(fg, makeIndexedProvider(sprites), outfit)
    expect(sheet.width).toBeGreaterThan(0)
    expect(sheet.height).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// extractFrame
// ---------------------------------------------------------------------------

describe('extractFrame', () => {
  it('returns empty frame for empty sheet', () => {
    const sheet = { pixels: new Uint8Array(0), width: 0, height: 0, textureIndex: [] }
    const fg = makeFg()
    const frame = extractFrame(sheet, fg)
    expect(frame.width).toBe(0)
    expect(frame.height).toBe(0)
  })

  it('extracts single frame from 1x1 sheet', () => {
    const sprite = makeSolidSprite(0xff, 0xaa, 0xbb, 0xcc)
    const fg = makeFg({ spriteIndex: [1] })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(sprite))

    const frame = extractFrame(sheet, fg)
    expect(frame.width).toBe(SPRITE_DEFAULT_SIZE)
    expect(frame.height).toBe(SPRITE_DEFAULT_SIZE)
    expect(frame.pixels[0]).toBe(0xff) // A
    expect(frame.pixels[1]).toBe(0xaa) // R
  })

  it('extracts specific direction (patternX)', () => {
    // Create 4 different sprites for 4 directions
    const sprites = [
      makeSolidSprite(0xff, 0x10, 0x00, 0x00),
      makeSolidSprite(0xff, 0x20, 0x00, 0x00),
      makeSolidSprite(0xff, 0x30, 0x00, 0x00),
      makeSolidSprite(0xff, 0x40, 0x00, 0x00)
    ]
    const fg = makeFg({
      patternX: 4,
      spriteIndex: [0, 1, 2, 3]
    })
    const sheet = buildSpriteSheet(fg, makeIndexedProvider(sprites))

    // Extract south (patternX=2)
    const frame = extractFrame(sheet, fg, { patternX: 2 })
    expect(frame.pixels[1]).toBe(0x30) // R channel of south sprite
  })

  it('extracts specific frame index', () => {
    const sprites = [
      makeSolidSprite(0xff, 0xaa, 0x00, 0x00), // frame 0
      makeSolidSprite(0xff, 0xbb, 0x00, 0x00)  // frame 1
    ]
    const fg = makeFg({
      frames: 2,
      spriteIndex: [0, 1]
    })
    const sheet = buildSpriteSheet(fg, makeIndexedProvider(sprites))

    const f0 = extractFrame(sheet, fg, { frame: 0 })
    expect(f0.pixels[1]).toBe(0xaa)

    const f1 = extractFrame(sheet, fg, { frame: 1 })
    expect(f1.pixels[1]).toBe(0xbb)
  })

  it('wraps pattern indices with modulo', () => {
    const sprite = makeSolidSprite(0xff, 0xdd, 0x00, 0x00)
    const fg = makeFg({ spriteIndex: [1] })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(sprite))

    // patternX=5 with fg.patternX=1 should wrap to 0
    const frame = extractFrame(sheet, fg, { patternX: 5 })
    expect(frame.pixels[1]).toBe(0xdd)
  })

  it('extracts from 2x2 tile sheet', () => {
    const sprites = [
      makeSolidSprite(0xff, 0x11, 0x00, 0x00),
      makeSolidSprite(0xff, 0x22, 0x00, 0x00),
      makeSolidSprite(0xff, 0x33, 0x00, 0x00),
      makeSolidSprite(0xff, 0x44, 0x00, 0x00)
    ]
    const fg = makeFg({
      width: 2,
      height: 2,
      spriteIndex: [0, 1, 2, 3]
    })
    const sheet = buildSpriteSheet(fg, makeIndexedProvider(sprites))

    const frame = extractFrame(sheet, fg)
    expect(frame.width).toBe(2 * SPRITE_DEFAULT_SIZE)
    expect(frame.height).toBe(2 * SPRITE_DEFAULT_SIZE)
  })

  it('limits layers when drawBlendLayer is false', () => {
    const gray = makeSolidSprite(0xff, 0x80, 0x80, 0x80)
    const blend = makeSolidSprite(0xff, 0xff, 0x00, 0x00)
    const fg = makeFg({
      layers: 2,
      spriteIndex: [0, 1]
    })
    const sheet = buildSpriteSheet(fg, makeIndexedProvider([gray, blend]))

    // Without blend layer - should only render layer 0
    const frame = extractFrame(sheet, fg, { drawBlendLayer: false })
    expect(frame.pixels[1]).toBe(0x80) // gray layer

    // With blend layer - should composite both
    const frameBlend = extractFrame(sheet, fg, { drawBlendLayer: true })
    // After compositing, the pixel should show red from blend layer
    expect(frameBlend.pixels[1]).toBe(0xff) // red from blend (opaque overwrite)
  })
})

// ---------------------------------------------------------------------------
// frameToImageData
// ---------------------------------------------------------------------------

describe('frameToImageData', () => {
  it('returns null for empty frame', () => {
    expect(frameToImageData({ pixels: new Uint8Array(0), width: 0, height: 0 })).toBeNull()
  })

  it('converts ARGB to RGBA ImageData', () => {
    const sprite = makeSolidSprite(0xff, 0xaa, 0xbb, 0xcc)
    const fg = makeFg({ spriteIndex: [1] })
    const sheet = buildSpriteSheet(fg, makeConstantProvider(sprite))
    const frame = extractFrame(sheet, fg)
    const imageData = frameToImageData(frame)

    expect(imageData).not.toBeNull()
    expect(imageData!.width).toBe(SPRITE_DEFAULT_SIZE)
    expect(imageData!.height).toBe(SPRITE_DEFAULT_SIZE)

    // ARGB -> RGBA: A=0xFF, R=0xAA, G=0xBB, B=0xCC
    expect(imageData!.data[0]).toBe(0xaa) // R
    expect(imageData!.data[1]).toBe(0xbb) // G
    expect(imageData!.data[2]).toBe(0xcc) // B
    expect(imageData!.data[3]).toBe(0xff) // A
  })
})

// ---------------------------------------------------------------------------
// drawCheckerboard
// ---------------------------------------------------------------------------

describe('drawCheckerboard', () => {
  it('is a function that accepts canvas context', () => {
    expect(typeof drawCheckerboard).toBe('function')
  })

  // Note: Canvas rendering tests are limited in jsdom/vitest
  // The function signature and basic call should not throw
  it('does not throw with null context', () => {
    // Create a mock context
    const ctx = {
      fillStyle: '',
      fillRect: () => {}
    } as unknown as CanvasRenderingContext2D

    expect(() => drawCheckerboard(ctx, 64, 64, 8)).not.toThrow()
  })
})
