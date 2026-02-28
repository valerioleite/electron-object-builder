import {
  AnimationMode,
  FrameGroupType,
  createFrameDuration,
  getFrameDurationValue,
  frameDurationEquals,
  cloneFrameDuration,
  createFrameGroup,
  cloneFrameGroup,
  getFrameGroupTotalSprites,
  getFrameGroupTotalTextures,
  getFrameGroupTotalX,
  getFrameGroupTotalY,
  getFrameGroupSpriteIndex,
  getFrameGroupTextureIndex,
  getFrameGroupSpriteSheetSize,
  makeOutfitFrameGroup
} from '../animation'
import { SPRITE_DEFAULT_SIZE } from '../sprites'

// ---------------------------------------------------------------------------
// AnimationMode
// ---------------------------------------------------------------------------

describe('AnimationMode', () => {
  it('ASYNCHRONOUS is 0', () => {
    expect(AnimationMode.ASYNCHRONOUS).toBe(0)
  })

  it('SYNCHRONOUS is 1', () => {
    expect(AnimationMode.SYNCHRONOUS).toBe(1)
  })

  it('has exactly 2 values', () => {
    const keys = Object.keys(AnimationMode)
    expect(keys).toHaveLength(2)
    expect(keys).toContain('ASYNCHRONOUS')
    expect(keys).toContain('SYNCHRONOUS')
  })

  it('values are distinct', () => {
    expect(AnimationMode.ASYNCHRONOUS).not.toBe(AnimationMode.SYNCHRONOUS)
  })
})

// ---------------------------------------------------------------------------
// FrameGroupType
// ---------------------------------------------------------------------------

describe('FrameGroupType', () => {
  it('DEFAULT is 0', () => {
    expect(FrameGroupType.DEFAULT).toBe(0)
  })

  it('WALKING is 1', () => {
    expect(FrameGroupType.WALKING).toBe(1)
  })

  it('has exactly 2 values', () => {
    const keys = Object.keys(FrameGroupType)
    expect(keys).toHaveLength(2)
    expect(keys).toContain('DEFAULT')
    expect(keys).toContain('WALKING')
  })

  it('values are distinct', () => {
    expect(FrameGroupType.DEFAULT).not.toBe(FrameGroupType.WALKING)
  })
})

// ---------------------------------------------------------------------------
// FrameDuration - createFrameDuration
// ---------------------------------------------------------------------------

describe('createFrameDuration', () => {
  it('creates with default values (0, 0)', () => {
    const fd = createFrameDuration()
    expect(fd.minimum).toBe(0)
    expect(fd.maximum).toBe(0)
  })

  it('creates with specified minimum and maximum', () => {
    const fd = createFrameDuration(100, 200)
    expect(fd.minimum).toBe(100)
    expect(fd.maximum).toBe(200)
  })

  it('allows minimum equal to maximum', () => {
    const fd = createFrameDuration(150, 150)
    expect(fd.minimum).toBe(150)
    expect(fd.maximum).toBe(150)
  })

  it('throws when minimum is greater than maximum', () => {
    expect(() => createFrameDuration(200, 100)).toThrow(
      'The minimum value may not be greater than the maximum value.'
    )
  })

  it('allows zero values', () => {
    const fd = createFrameDuration(0, 0)
    expect(fd.minimum).toBe(0)
    expect(fd.maximum).toBe(0)
  })

  it('allows large values', () => {
    const fd = createFrameDuration(10000, 50000)
    expect(fd.minimum).toBe(10000)
    expect(fd.maximum).toBe(50000)
  })

  it('allows minimum = 0 with maximum specified', () => {
    const fd = createFrameDuration(0, 500)
    expect(fd.minimum).toBe(0)
    expect(fd.maximum).toBe(500)
  })

  it('throws when only minimum provided and it is positive (max defaults to 0)', () => {
    expect(() => createFrameDuration(100)).toThrow(
      'The minimum value may not be greater than the maximum value.'
    )
  })

  it('allows only minimum = 0 (maximum defaults to 0)', () => {
    const fd = createFrameDuration(0)
    expect(fd.minimum).toBe(0)
    expect(fd.maximum).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// FrameDuration - getFrameDurationValue
// ---------------------------------------------------------------------------

describe('getFrameDurationValue', () => {
  it('returns the exact value when minimum equals maximum', () => {
    const fd = createFrameDuration(300, 300)
    expect(getFrameDurationValue(fd)).toBe(300)
  })

  it('returns zero when both are zero', () => {
    const fd = createFrameDuration(0, 0)
    expect(getFrameDurationValue(fd)).toBe(0)
  })

  it('returns a value within range when minimum differs from maximum', () => {
    const fd = createFrameDuration(100, 200)
    for (let i = 0; i < 50; i++) {
      const value = getFrameDurationValue(fd)
      expect(value).toBeGreaterThanOrEqual(100)
      expect(value).toBeLessThanOrEqual(200)
    }
  })

  it('returns a rounded integer value', () => {
    const fd = createFrameDuration(10, 20)
    for (let i = 0; i < 50; i++) {
      const value = getFrameDurationValue(fd)
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('returns exact minimum when range is zero', () => {
    const fd = createFrameDuration(42, 42)
    expect(getFrameDurationValue(fd)).toBe(42)
  })

  it('can return boundary values (min and max)', () => {
    const fd = createFrameDuration(0, 1)
    const results = new Set<number>()
    for (let i = 0; i < 200; i++) {
      results.add(getFrameDurationValue(fd))
    }
    expect(results.has(0)).toBe(true)
    expect(results.has(1)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// FrameDuration - frameDurationEquals
// ---------------------------------------------------------------------------

describe('frameDurationEquals', () => {
  it('returns true for identical durations', () => {
    const a = createFrameDuration(100, 200)
    const b = createFrameDuration(100, 200)
    expect(frameDurationEquals(a, b)).toBe(true)
  })

  it('returns true for same reference', () => {
    const a = createFrameDuration(50, 100)
    expect(frameDurationEquals(a, a)).toBe(true)
  })

  it('returns false when minimums differ', () => {
    const a = createFrameDuration(100, 200)
    const b = createFrameDuration(101, 200)
    expect(frameDurationEquals(a, b)).toBe(false)
  })

  it('returns false when maximums differ', () => {
    const a = createFrameDuration(100, 200)
    const b = createFrameDuration(100, 201)
    expect(frameDurationEquals(a, b)).toBe(false)
  })

  it('returns false when both differ', () => {
    const a = createFrameDuration(100, 200)
    const b = createFrameDuration(50, 300)
    expect(frameDurationEquals(a, b)).toBe(false)
  })

  it('returns true for both zero', () => {
    const a = createFrameDuration(0, 0)
    const b = createFrameDuration(0, 0)
    expect(frameDurationEquals(a, b)).toBe(true)
  })

  it('is symmetric', () => {
    const a = createFrameDuration(10, 20)
    const b = createFrameDuration(30, 40)
    expect(frameDurationEquals(a, b)).toBe(frameDurationEquals(b, a))
  })
})

// ---------------------------------------------------------------------------
// FrameDuration - cloneFrameDuration
// ---------------------------------------------------------------------------

describe('cloneFrameDuration', () => {
  it('creates a copy with same values', () => {
    const original = createFrameDuration(150, 300)
    const clone = cloneFrameDuration(original)
    expect(clone.minimum).toBe(150)
    expect(clone.maximum).toBe(300)
  })

  it('returns a different object reference', () => {
    const original = createFrameDuration(100, 200)
    const clone = cloneFrameDuration(original)
    expect(clone).not.toBe(original)
  })

  it('clone is independent from original (mutating clone does not affect original)', () => {
    const original = createFrameDuration(100, 200)
    const clone = cloneFrameDuration(original)
    clone.minimum = 999
    clone.maximum = 999
    expect(original.minimum).toBe(100)
    expect(original.maximum).toBe(200)
  })

  it('mutating original does not affect clone', () => {
    const original = createFrameDuration(100, 200)
    const clone = cloneFrameDuration(original)
    original.minimum = 999
    original.maximum = 999
    expect(clone.minimum).toBe(100)
    expect(clone.maximum).toBe(200)
  })

  it('clone equals original via frameDurationEquals', () => {
    const original = createFrameDuration(50, 100)
    const clone = cloneFrameDuration(original)
    expect(frameDurationEquals(original, clone)).toBe(true)
  })

  it('handles zero values', () => {
    const original = createFrameDuration(0, 0)
    const clone = cloneFrameDuration(original)
    expect(clone.minimum).toBe(0)
    expect(clone.maximum).toBe(0)
    expect(clone).not.toBe(original)
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - createFrameGroup
// ---------------------------------------------------------------------------

describe('createFrameGroup', () => {
  it('creates a frame group with correct default values', () => {
    const fg = createFrameGroup()
    expect(fg.type).toBe(FrameGroupType.DEFAULT)
    expect(fg.width).toBe(1)
    expect(fg.height).toBe(1)
    expect(fg.exactSize).toBe(SPRITE_DEFAULT_SIZE)
    expect(fg.layers).toBe(1)
    expect(fg.patternX).toBe(1)
    expect(fg.patternY).toBe(1)
    expect(fg.patternZ).toBe(1)
    expect(fg.frames).toBe(1)
    expect(fg.spriteIndex).toEqual([])
    expect(fg.isAnimation).toBe(false)
    expect(fg.animationMode).toBe(AnimationMode.ASYNCHRONOUS)
    expect(fg.loopCount).toBe(0)
    expect(fg.startFrame).toBe(0)
    expect(fg.frameDurations).toBeNull()
  })

  it('creates independent instances', () => {
    const fg1 = createFrameGroup()
    const fg2 = createFrameGroup()
    expect(fg1).not.toBe(fg2)
    fg1.width = 5
    expect(fg2.width).toBe(1)
  })

  it('spriteIndex is a new empty array each time', () => {
    const fg1 = createFrameGroup()
    const fg2 = createFrameGroup()
    expect(fg1.spriteIndex).not.toBe(fg2.spriteIndex)
    fg1.spriteIndex.push(42)
    expect(fg2.spriteIndex).toHaveLength(0)
  })

  it('exactSize matches SPRITE_DEFAULT_SIZE (32)', () => {
    const fg = createFrameGroup()
    expect(fg.exactSize).toBe(32)
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - cloneFrameGroup
// ---------------------------------------------------------------------------

describe('cloneFrameGroup', () => {
  it('clones all scalar properties', () => {
    const original = createFrameGroup()
    original.type = FrameGroupType.WALKING
    original.width = 2
    original.height = 3
    original.exactSize = 64
    original.layers = 2
    original.patternX = 4
    original.patternY = 2
    original.patternZ = 2
    original.frames = 5
    original.animationMode = AnimationMode.SYNCHRONOUS
    original.loopCount = 3
    original.startFrame = 1

    const clone = cloneFrameGroup(original)
    expect(clone.type).toBe(FrameGroupType.WALKING)
    expect(clone.width).toBe(2)
    expect(clone.height).toBe(3)
    expect(clone.exactSize).toBe(64)
    expect(clone.layers).toBe(2)
    expect(clone.patternX).toBe(4)
    expect(clone.patternY).toBe(2)
    expect(clone.patternZ).toBe(2)
    expect(clone.frames).toBe(5)
    expect(clone.animationMode).toBe(AnimationMode.SYNCHRONOUS)
    expect(clone.loopCount).toBe(3)
    expect(clone.startFrame).toBe(1)
  })

  it('creates a deep copy of spriteIndex', () => {
    const original = createFrameGroup()
    original.spriteIndex = [10, 20, 30]

    const clone = cloneFrameGroup(original)
    expect(clone.spriteIndex).toEqual([10, 20, 30])
    expect(clone.spriteIndex).not.toBe(original.spriteIndex)

    clone.spriteIndex[0] = 999
    expect(original.spriteIndex[0]).toBe(10)
  })

  it('clones frameDurations when frames > 1 and durations exist', () => {
    const original = createFrameGroup()
    original.frames = 3
    original.isAnimation = true
    original.frameDurations = [
      createFrameDuration(100, 200),
      createFrameDuration(150, 250),
      createFrameDuration(200, 300)
    ]

    const clone = cloneFrameGroup(original)
    expect(clone.isAnimation).toBe(true)
    expect(clone.frameDurations).not.toBeNull()
    expect(clone.frameDurations).toHaveLength(3)
    expect(clone.frameDurations![0].minimum).toBe(100)
    expect(clone.frameDurations![0].maximum).toBe(200)
    expect(clone.frameDurations![1].minimum).toBe(150)
    expect(clone.frameDurations![1].maximum).toBe(250)
    expect(clone.frameDurations![2].minimum).toBe(200)
    expect(clone.frameDurations![2].maximum).toBe(300)
  })

  it('frameDurations clone is independent from original (deep clone)', () => {
    const original = createFrameGroup()
    original.frames = 2
    original.frameDurations = [createFrameDuration(100, 200), createFrameDuration(300, 400)]

    const clone = cloneFrameGroup(original)

    // Different array reference
    expect(clone.frameDurations).not.toBe(original.frameDurations)
    // Different element references
    expect(clone.frameDurations![0]).not.toBe(original.frameDurations[0])
    expect(clone.frameDurations![1]).not.toBe(original.frameDurations[1])

    // Mutating original does not affect clone
    original.frameDurations[0].minimum = 999
    expect(clone.frameDurations![0].minimum).toBe(100)

    // Mutating clone does not affect original
    clone.frameDurations![1].maximum = 888
    expect(original.frameDurations[1].maximum).toBe(400)
  })

  it('does not clone frameDurations when frames is 1 (even if durations exist)', () => {
    const original = createFrameGroup()
    original.frames = 1
    original.frameDurations = [createFrameDuration(100, 200)]

    const clone = cloneFrameGroup(original)
    expect(clone.isAnimation).toBe(false)
    expect(clone.frameDurations).toBeNull()
  })

  it('does not clone frameDurations when they are null (even if frames > 1)', () => {
    const original = createFrameGroup()
    original.frames = 3
    original.frameDurations = null

    const clone = cloneFrameGroup(original)
    expect(clone.isAnimation).toBe(false)
    expect(clone.frameDurations).toBeNull()
  })

  it('returns a new object reference', () => {
    const original = createFrameGroup()
    const clone = cloneFrameGroup(original)
    expect(clone).not.toBe(original)
  })

  it('clones a default frame group correctly', () => {
    const original = createFrameGroup()
    const clone = cloneFrameGroup(original)
    expect(clone.type).toBe(FrameGroupType.DEFAULT)
    expect(clone.width).toBe(1)
    expect(clone.height).toBe(1)
    expect(clone.spriteIndex).toEqual([])
    expect(clone.isAnimation).toBe(false)
    expect(clone.frameDurations).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - getFrameGroupTotalSprites
// ---------------------------------------------------------------------------

describe('getFrameGroupTotalSprites', () => {
  it('returns 1 for default frame group (1*1*1*1*1*1*1)', () => {
    const fg = createFrameGroup()
    expect(getFrameGroupTotalSprites(fg)).toBe(1)
  })

  it('computes correctly for multi-tile (2x2)', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 2
    expect(getFrameGroupTotalSprites(fg)).toBe(4)
  })

  it('computes correctly for outfit with 4 directions', () => {
    const fg = createFrameGroup()
    fg.patternX = 4
    expect(getFrameGroupTotalSprites(fg)).toBe(4)
  })

  it('computes correctly for animated sprite', () => {
    const fg = createFrameGroup()
    fg.frames = 5
    expect(getFrameGroupTotalSprites(fg)).toBe(5)
  })

  it('computes correctly with all dimensions set', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 3
    fg.patternX = 4
    fg.patternY = 2
    fg.patternZ = 2
    fg.frames = 5
    fg.layers = 2
    // 2 * 3 * 4 * 2 * 2 * 5 * 2 = 960
    expect(getFrameGroupTotalSprites(fg)).toBe(960)
  })

  it('computes correctly with layers', () => {
    const fg = createFrameGroup()
    fg.layers = 3
    expect(getFrameGroupTotalSprites(fg)).toBe(3)
  })

  it('computes correctly for outfit with 4 directions and 2 layers (blend)', () => {
    const fg = createFrameGroup()
    fg.patternX = 4
    fg.layers = 2
    expect(getFrameGroupTotalSprites(fg)).toBe(8)
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - getFrameGroupTotalTextures
// ---------------------------------------------------------------------------

describe('getFrameGroupTotalTextures', () => {
  it('returns 1 for default frame group', () => {
    const fg = createFrameGroup()
    expect(getFrameGroupTotalTextures(fg)).toBe(1)
  })

  it('excludes width and height from computation', () => {
    const fg = createFrameGroup()
    fg.width = 3
    fg.height = 4
    expect(getFrameGroupTotalTextures(fg)).toBe(1)
  })

  it('computes correctly with patterns, frames, and layers', () => {
    const fg = createFrameGroup()
    fg.patternX = 4
    fg.patternY = 2
    fg.patternZ = 2
    fg.frames = 3
    fg.layers = 2
    // 4 * 2 * 2 * 3 * 2 = 96
    expect(getFrameGroupTotalTextures(fg)).toBe(96)
  })

  it('computes correctly with only patternX', () => {
    const fg = createFrameGroup()
    fg.patternX = 4
    expect(getFrameGroupTotalTextures(fg)).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - getFrameGroupTotalX
// ---------------------------------------------------------------------------

describe('getFrameGroupTotalX', () => {
  it('returns 1 for default frame group', () => {
    const fg = createFrameGroup()
    expect(getFrameGroupTotalX(fg)).toBe(1)
  })

  it('computes patternZ * patternX * layers', () => {
    const fg = createFrameGroup()
    fg.patternZ = 2
    fg.patternX = 4
    fg.layers = 3
    expect(getFrameGroupTotalX(fg)).toBe(24)
  })

  it('ignores width, height, patternY, frames', () => {
    const fg = createFrameGroup()
    fg.width = 5
    fg.height = 5
    fg.patternY = 10
    fg.frames = 20
    expect(getFrameGroupTotalX(fg)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - getFrameGroupTotalY
// ---------------------------------------------------------------------------

describe('getFrameGroupTotalY', () => {
  it('returns 1 for default frame group', () => {
    const fg = createFrameGroup()
    expect(getFrameGroupTotalY(fg)).toBe(1)
  })

  it('computes frames * patternY', () => {
    const fg = createFrameGroup()
    fg.frames = 5
    fg.patternY = 3
    expect(getFrameGroupTotalY(fg)).toBe(15)
  })

  it('ignores width, height, patternX, patternZ, layers', () => {
    const fg = createFrameGroup()
    fg.width = 5
    fg.height = 5
    fg.patternX = 10
    fg.patternZ = 3
    fg.layers = 4
    expect(getFrameGroupTotalY(fg)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - getFrameGroupSpriteIndex
// ---------------------------------------------------------------------------

describe('getFrameGroupSpriteIndex', () => {
  it('returns 0 for all-zero params on default frame group', () => {
    const fg = createFrameGroup()
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 0)).toBe(0)
  })

  it('computes correct index for width offset', () => {
    const fg = createFrameGroup()
    fg.width = 2
    expect(getFrameGroupSpriteIndex(fg, 1, 0, 0, 0, 0, 0, 0)).toBe(1)
  })

  it('computes correct index for height offset', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 2
    // h=1 -> ...* height + h = ...* 2 + 1, then * width + w = 2*1 + 0 = 2
    expect(getFrameGroupSpriteIndex(fg, 0, 1, 0, 0, 0, 0, 0)).toBe(2)
  })

  it('computes correct index for a 2x2 tile at all positions', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 2
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 0)).toBe(0)
    expect(getFrameGroupSpriteIndex(fg, 1, 0, 0, 0, 0, 0, 0)).toBe(1)
    expect(getFrameGroupSpriteIndex(fg, 0, 1, 0, 0, 0, 0, 0)).toBe(2)
    expect(getFrameGroupSpriteIndex(fg, 1, 1, 0, 0, 0, 0, 0)).toBe(3)
  })

  it('computes correct index with patternX (directions)', () => {
    const fg = createFrameGroup()
    fg.patternX = 4
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 0)).toBe(0)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 1, 0, 0, 0)).toBe(1)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 2, 0, 0, 0)).toBe(2)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 3, 0, 0, 0)).toBe(3)
  })

  it('computes correct index with frame offset', () => {
    const fg = createFrameGroup()
    fg.frames = 3
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 0)).toBe(0)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 1)).toBe(1)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 2)).toBe(2)
  })

  it('wraps frame with modulo', () => {
    const fg = createFrameGroup()
    fg.frames = 3
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 3)).toBe(
      getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 0)
    )
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 5)).toBe(
      getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 2)
    )
  })

  it('correctly interleaves layers', () => {
    const fg = createFrameGroup()
    fg.layers = 2
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 0)).toBe(0)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 1, 0, 0, 0, 0)).toBe(1)
  })

  it('produces unique indices for all positions in a complex group', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 2
    fg.layers = 2
    fg.patternX = 4
    fg.patternY = 1
    fg.patternZ = 1
    fg.frames = 3

    const total = getFrameGroupTotalSprites(fg)
    const indices = new Set<number>()

    for (let frame = 0; frame < fg.frames; frame++) {
      for (let pz = 0; pz < fg.patternZ; pz++) {
        for (let py = 0; py < fg.patternY; py++) {
          for (let px = 0; px < fg.patternX; px++) {
            for (let l = 0; l < fg.layers; l++) {
              for (let h = 0; h < fg.height; h++) {
                for (let w = 0; w < fg.width; w++) {
                  indices.add(getFrameGroupSpriteIndex(fg, w, h, l, px, py, pz, frame))
                }
              }
            }
          }
        }
      }
    }

    expect(indices.size).toBe(total)
    for (const idx of indices) {
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(total)
    }
  })

  it('computes correct index for complex layout with directions and layers', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 2
    fg.layers = 2
    fg.patternX = 4

    // Each patternX step accounts for layers*height*width = 2*2*2 = 8 sprites
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 0, 0, 0, 0)).toBe(0)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 1, 0, 0, 0)).toBe(8)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 2, 0, 0, 0)).toBe(16)
    expect(getFrameGroupSpriteIndex(fg, 0, 0, 0, 3, 0, 0, 0)).toBe(24)
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - getFrameGroupTextureIndex
// ---------------------------------------------------------------------------

describe('getFrameGroupTextureIndex', () => {
  it('returns 0 for all-zero params on default frame group', () => {
    const fg = createFrameGroup()
    expect(getFrameGroupTextureIndex(fg, 0, 0, 0, 0, 0)).toBe(0)
  })

  it('computes correct index for layer offset', () => {
    const fg = createFrameGroup()
    fg.layers = 3
    expect(getFrameGroupTextureIndex(fg, 2, 0, 0, 0, 0)).toBe(2)
  })

  it('computes correct index for patternX', () => {
    const fg = createFrameGroup()
    fg.patternX = 4
    expect(getFrameGroupTextureIndex(fg, 0, 0, 0, 0, 0)).toBe(0)
    expect(getFrameGroupTextureIndex(fg, 0, 1, 0, 0, 0)).toBe(1)
    expect(getFrameGroupTextureIndex(fg, 0, 2, 0, 0, 0)).toBe(2)
    expect(getFrameGroupTextureIndex(fg, 0, 3, 0, 0, 0)).toBe(3)
  })

  it('computes correct index for frame', () => {
    const fg = createFrameGroup()
    fg.frames = 5
    expect(getFrameGroupTextureIndex(fg, 0, 0, 0, 0, 3)).toBe(3)
  })

  it('wraps frame with modulo', () => {
    const fg = createFrameGroup()
    fg.frames = 3
    expect(getFrameGroupTextureIndex(fg, 0, 0, 0, 0, 5)).toBe(
      getFrameGroupTextureIndex(fg, 0, 0, 0, 0, 2)
    )
  })

  it('interleaves layers correctly', () => {
    const fg = createFrameGroup()
    fg.layers = 2
    expect(getFrameGroupTextureIndex(fg, 0, 0, 0, 0, 0)).toBe(0)
    expect(getFrameGroupTextureIndex(fg, 1, 0, 0, 0, 0)).toBe(1)
  })

  it('produces unique indices for all combinations in a complex group', () => {
    const fg = createFrameGroup()
    fg.patternX = 4
    fg.patternY = 2
    fg.patternZ = 2
    fg.frames = 3
    fg.layers = 2

    const total = getFrameGroupTotalTextures(fg)
    const indices = new Set<number>()

    for (let frame = 0; frame < fg.frames; frame++) {
      for (let pz = 0; pz < fg.patternZ; pz++) {
        for (let py = 0; py < fg.patternY; py++) {
          for (let px = 0; px < fg.patternX; px++) {
            for (let l = 0; l < fg.layers; l++) {
              indices.add(getFrameGroupTextureIndex(fg, l, px, py, pz, frame))
            }
          }
        }
      }
    }

    expect(indices.size).toBe(total)
  })

  it('computes correctly with all params non-zero', () => {
    const fg = createFrameGroup()
    fg.patternX = 4
    fg.patternY = 2
    fg.patternZ = 2
    fg.frames = 3
    fg.layers = 2

    // layer=1, pX=2, pY=1, pZ=1, frame=2
    // = ((((2%3)*2+1)*2+1)*4+2)*2+1
    // = (((4+1)*2+1)*4+2)*2+1
    // = ((10+1)*4+2)*2+1
    // = (44+2)*2+1
    // = 92+1 = 93
    expect(getFrameGroupTextureIndex(fg, 1, 2, 1, 1, 2)).toBe(93)
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - getFrameGroupSpriteSheetSize
// ---------------------------------------------------------------------------

describe('getFrameGroupSpriteSheetSize', () => {
  it('returns 32x32 for default frame group', () => {
    const fg = createFrameGroup()
    const size = getFrameGroupSpriteSheetSize(fg)
    expect(size.width).toBe(SPRITE_DEFAULT_SIZE)
    expect(size.height).toBe(SPRITE_DEFAULT_SIZE)
  })

  it('scales width by patternZ * patternX * layers * width', () => {
    const fg = createFrameGroup()
    fg.patternZ = 2
    fg.patternX = 4
    fg.layers = 2
    fg.width = 2
    const size = getFrameGroupSpriteSheetSize(fg)
    expect(size.width).toBe(2 * 4 * 2 * 2 * SPRITE_DEFAULT_SIZE)
  })

  it('scales height by frames * patternY * height', () => {
    const fg = createFrameGroup()
    fg.frames = 5
    fg.patternY = 3
    fg.height = 2
    const size = getFrameGroupSpriteSheetSize(fg)
    expect(size.height).toBe(5 * 3 * 2 * SPRITE_DEFAULT_SIZE)
  })

  it('computes correctly for a 2x2 outfit with 4 directions and 3 frames', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 2
    fg.patternX = 4
    fg.frames = 3
    const size = getFrameGroupSpriteSheetSize(fg)
    expect(size.width).toBe(256) // 1*4*1*2*32
    expect(size.height).toBe(192) // 3*1*2*32
  })

  it('uses SPRITE_DEFAULT_SIZE (32) as the sprite tile size', () => {
    const fg = createFrameGroup()
    const size = getFrameGroupSpriteSheetSize(fg)
    expect(size.width).toBe(1 * 1 * 1 * 1 * SPRITE_DEFAULT_SIZE)
    expect(size.height).toBe(1 * 1 * 1 * SPRITE_DEFAULT_SIZE)
  })

  it('computes correctly for complex group with all dimensions', () => {
    const fg = createFrameGroup()
    fg.patternZ = 2
    fg.patternX = 4
    fg.patternY = 2
    fg.layers = 2
    fg.width = 2
    fg.height = 3
    fg.frames = 5
    const size = getFrameGroupSpriteSheetSize(fg)
    expect(size.width).toBe(2 * 4 * 2 * 2 * 32) // 1024
    expect(size.height).toBe(5 * 2 * 3 * 32) // 960
  })
})

// ---------------------------------------------------------------------------
// FrameGroup - makeOutfitFrameGroup
// ---------------------------------------------------------------------------

describe('makeOutfitFrameGroup', () => {
  it('creates a frame group with 4 directions (patternX = 4)', () => {
    const fg = makeOutfitFrameGroup(300)
    expect(fg.patternX).toBe(4)
  })

  it('has 1 frame', () => {
    const fg = makeOutfitFrameGroup(300)
    expect(fg.frames).toBe(1)
  })

  it('is not an animation', () => {
    const fg = makeOutfitFrameGroup(300)
    expect(fg.isAnimation).toBe(false)
  })

  it('creates frameDurations with the specified duration', () => {
    const fg = makeOutfitFrameGroup(300)
    expect(fg.frameDurations).not.toBeNull()
    expect(fg.frameDurations).toHaveLength(1)
    expect(fg.frameDurations![0].minimum).toBe(300)
    expect(fg.frameDurations![0].maximum).toBe(300)
  })

  it('creates spriteIndex filled with zeros of the correct length', () => {
    const fg = makeOutfitFrameGroup(300)
    expect(fg.spriteIndex).toHaveLength(4)
    expect(fg.spriteIndex.every((idx) => idx === 0)).toBe(true)
  })

  it('spriteIndex length matches getFrameGroupTotalSprites', () => {
    const fg = makeOutfitFrameGroup(500)
    expect(fg.spriteIndex.length).toBe(getFrameGroupTotalSprites(fg))
  })

  it('has default values for other properties', () => {
    const fg = makeOutfitFrameGroup(200)
    expect(fg.type).toBe(FrameGroupType.DEFAULT)
    expect(fg.width).toBe(1)
    expect(fg.height).toBe(1)
    expect(fg.exactSize).toBe(SPRITE_DEFAULT_SIZE)
    expect(fg.layers).toBe(1)
    expect(fg.patternY).toBe(1)
    expect(fg.patternZ).toBe(1)
    expect(fg.animationMode).toBe(AnimationMode.ASYNCHRONOUS)
    expect(fg.loopCount).toBe(0)
    expect(fg.startFrame).toBe(0)
  })

  it('works with zero duration', () => {
    const fg = makeOutfitFrameGroup(0)
    expect(fg.frameDurations![0].minimum).toBe(0)
    expect(fg.frameDurations![0].maximum).toBe(0)
  })

  it('works with large duration', () => {
    const fg = makeOutfitFrameGroup(10000)
    expect(fg.frameDurations![0].minimum).toBe(10000)
    expect(fg.frameDurations![0].maximum).toBe(10000)
  })

  it('each call creates a new independent instance', () => {
    const fg1 = makeOutfitFrameGroup(300)
    const fg2 = makeOutfitFrameGroup(300)
    expect(fg1).not.toBe(fg2)
    expect(fg1.spriteIndex).not.toBe(fg2.spriteIndex)
    expect(fg1.frameDurations).not.toBe(fg2.frameDurations)

    fg1.spriteIndex[0] = 999
    expect(fg2.spriteIndex[0]).toBe(0)
  })

  it('has sprite sheet size of 128x32', () => {
    const fg = makeOutfitFrameGroup(300)
    const size = getFrameGroupSpriteSheetSize(fg)
    expect(size.width).toBe(128) // 1*4*1*1*32
    expect(size.height).toBe(32) // 1*1*1*32
  })
})

// ---------------------------------------------------------------------------
// Integration / Cross-function tests
// ---------------------------------------------------------------------------

describe('Integration', () => {
  it('totalTextures * width * height equals totalSprites', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 3
    fg.patternX = 4
    fg.patternY = 2
    fg.patternZ = 2
    fg.frames = 3
    fg.layers = 2

    expect(getFrameGroupTotalTextures(fg) * fg.width * fg.height).toBe(
      getFrameGroupTotalSprites(fg)
    )
  })

  it('sprite sheet size is consistent with totalX and totalY', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 2
    fg.patternX = 4
    fg.patternY = 2
    fg.frames = 3
    fg.layers = 2

    const sheetSize = getFrameGroupSpriteSheetSize(fg)
    const totalX = getFrameGroupTotalX(fg)
    const totalY = getFrameGroupTotalY(fg)

    expect(sheetSize.width).toBe(totalX * fg.width * SPRITE_DEFAULT_SIZE)
    expect(sheetSize.height).toBe(totalY * fg.height * SPRITE_DEFAULT_SIZE)
  })

  it('cloneFrameGroup produces a FrameGroup with same computed values', () => {
    const original = createFrameGroup()
    original.width = 2
    original.height = 2
    original.patternX = 4
    original.patternY = 2
    original.patternZ = 2
    original.frames = 3
    original.layers = 2
    original.spriteIndex = new Array(getFrameGroupTotalSprites(original)).fill(0)
    original.frameDurations = Array.from({ length: 3 }, () => createFrameDuration(100, 200))

    const clone = cloneFrameGroup(original)

    expect(getFrameGroupTotalSprites(clone)).toBe(getFrameGroupTotalSprites(original))
    expect(getFrameGroupTotalTextures(clone)).toBe(getFrameGroupTotalTextures(original))
    expect(getFrameGroupTotalX(clone)).toBe(getFrameGroupTotalX(original))
    expect(getFrameGroupTotalY(clone)).toBe(getFrameGroupTotalY(original))
    expect(getFrameGroupSpriteSheetSize(clone)).toEqual(getFrameGroupSpriteSheetSize(original))
  })

  it('sprite index and texture index produce valid non-negative unique values', () => {
    const fg = createFrameGroup()
    fg.width = 2
    fg.height = 2
    fg.patternX = 4
    fg.patternY = 2
    fg.patternZ = 2
    fg.frames = 3
    fg.layers = 2

    const totalSprites = getFrameGroupTotalSprites(fg)
    const totalTextures = getFrameGroupTotalTextures(fg)

    const spriteIndices = new Set<number>()
    const textureIndices = new Set<number>()

    for (let frame = 0; frame < fg.frames; frame++) {
      for (let pz = 0; pz < fg.patternZ; pz++) {
        for (let py = 0; py < fg.patternY; py++) {
          for (let px = 0; px < fg.patternX; px++) {
            for (let layer = 0; layer < fg.layers; layer++) {
              const ti = getFrameGroupTextureIndex(fg, layer, px, py, pz, frame)
              expect(ti).toBeGreaterThanOrEqual(0)
              expect(ti).toBeLessThan(totalTextures)
              textureIndices.add(ti)

              for (let h = 0; h < fg.height; h++) {
                for (let w = 0; w < fg.width; w++) {
                  const si = getFrameGroupSpriteIndex(fg, w, h, layer, px, py, pz, frame)
                  expect(si).toBeGreaterThanOrEqual(0)
                  expect(si).toBeLessThan(totalSprites)
                  spriteIndices.add(si)
                }
              }
            }
          }
        }
      }
    }

    // All indices should be unique (one-to-one mapping)
    expect(spriteIndices.size).toBe(totalSprites)
    expect(textureIndices.size).toBe(totalTextures)
  })

  it('makeOutfitFrameGroup spriteIndex length matches totalSprites', () => {
    const fg = makeOutfitFrameGroup(300)
    expect(getFrameGroupTotalSprites(fg)).toBe(fg.spriteIndex.length)
  })

  it('cloneFrameDuration preserves equality', () => {
    const original = createFrameDuration(123, 456)
    const clone = cloneFrameDuration(original)
    expect(frameDurationEquals(original, clone)).toBe(true)
    expect(getFrameDurationValue(createFrameDuration(42, 42))).toBe(42)
  })

  it('default frame group has consistent computed dimensions', () => {
    const fg = createFrameGroup()
    expect(getFrameGroupTotalSprites(fg)).toBe(1)
    expect(getFrameGroupTotalTextures(fg)).toBe(1)
    expect(getFrameGroupTotalX(fg)).toBe(1)
    expect(getFrameGroupTotalY(fg)).toBe(1)
    expect(getFrameGroupSpriteSheetSize(fg)).toEqual({
      width: SPRITE_DEFAULT_SIZE,
      height: SPRITE_DEFAULT_SIZE
    })
  })
})
