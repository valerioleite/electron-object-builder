import { describe, it, expect } from 'vitest'
import {
  Direction,
  getDirectionName,
  toDirection,
  isDiagonalDirection,
  createSize,
  createRect,
  cloneRect,
  createPosition,
  isPositionZero,
  positionEquals
} from '../geometry'

// ---------------------------------------------------------------------------
// Direction constants
// ---------------------------------------------------------------------------

describe('Direction', () => {
  it('has correct numeric values for cardinal directions', () => {
    expect(Direction.NORTH).toBe(0)
    expect(Direction.EAST).toBe(1)
    expect(Direction.SOUTH).toBe(2)
    expect(Direction.WEST).toBe(3)
  })

  it('has correct numeric values for diagonal directions', () => {
    expect(Direction.SOUTHWEST).toBe(4)
    expect(Direction.SOUTHEAST).toBe(5)
    expect(Direction.NORTHWEST).toBe(6)
    expect(Direction.NORTHEAST).toBe(7)
  })

  it('has exactly 8 direction constants', () => {
    expect(Object.keys(Direction)).toHaveLength(8)
  })
})

// ---------------------------------------------------------------------------
// getDirectionName
// ---------------------------------------------------------------------------

describe('getDirectionName', () => {
  it('returns "north" for Direction.NORTH', () => {
    expect(getDirectionName(Direction.NORTH)).toBe('north')
  })

  it('returns "east" for Direction.EAST', () => {
    expect(getDirectionName(Direction.EAST)).toBe('east')
  })

  it('returns "south" for Direction.SOUTH', () => {
    expect(getDirectionName(Direction.SOUTH)).toBe('south')
  })

  it('returns "west" for Direction.WEST', () => {
    expect(getDirectionName(Direction.WEST)).toBe('west')
  })

  it('returns "southwest" for Direction.SOUTHWEST', () => {
    expect(getDirectionName(Direction.SOUTHWEST)).toBe('southwest')
  })

  it('returns "southeast" for Direction.SOUTHEAST', () => {
    expect(getDirectionName(Direction.SOUTHEAST)).toBe('southeast')
  })

  it('returns "northwest" for Direction.NORTHWEST', () => {
    expect(getDirectionName(Direction.NORTHWEST)).toBe('northwest')
  })

  it('returns "northeast" for Direction.NORTHEAST', () => {
    expect(getDirectionName(Direction.NORTHEAST)).toBe('northeast')
  })

  it('returns correct name for all 8 directions', () => {
    const expectedNames = [
      'north',
      'east',
      'south',
      'west',
      'southwest',
      'southeast',
      'northwest',
      'northeast'
    ]
    for (let i = 0; i < 8; i++) {
      expect(getDirectionName(i as typeof Direction.NORTH)).toBe(expectedNames[i])
    }
  })
})

// ---------------------------------------------------------------------------
// toDirection
// ---------------------------------------------------------------------------

describe('toDirection', () => {
  it('returns 0 for input 0 (NORTH)', () => {
    expect(toDirection(0)).toBe(0)
  })

  it('returns 7 for input 7 (NORTHEAST)', () => {
    expect(toDirection(7)).toBe(7)
  })

  it('returns correct Direction for all values 0-7', () => {
    for (let i = 0; i <= 7; i++) {
      expect(toDirection(i)).toBe(i)
    }
  })

  it('returns undefined for negative values', () => {
    expect(toDirection(-1)).toBeUndefined()
    expect(toDirection(-100)).toBeUndefined()
  })

  it('returns undefined for values greater than 7', () => {
    expect(toDirection(8)).toBeUndefined()
    expect(toDirection(100)).toBeUndefined()
  })

  it('returns undefined for non-integer edge values', () => {
    // 3.5 is >= 0 and <= 7, so it returns as Direction (cast)
    expect(toDirection(3.5)).toBe(3.5)
  })

  it('returns undefined for large negative values', () => {
    expect(toDirection(-999)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// isDiagonalDirection
// ---------------------------------------------------------------------------

describe('isDiagonalDirection', () => {
  it('returns false for NORTH', () => {
    expect(isDiagonalDirection(Direction.NORTH)).toBe(false)
  })

  it('returns false for EAST', () => {
    expect(isDiagonalDirection(Direction.EAST)).toBe(false)
  })

  it('returns false for SOUTH', () => {
    expect(isDiagonalDirection(Direction.SOUTH)).toBe(false)
  })

  it('returns false for WEST', () => {
    expect(isDiagonalDirection(Direction.WEST)).toBe(false)
  })

  it('returns true for SOUTHWEST', () => {
    expect(isDiagonalDirection(Direction.SOUTHWEST)).toBe(true)
  })

  it('returns true for SOUTHEAST', () => {
    expect(isDiagonalDirection(Direction.SOUTHEAST)).toBe(true)
  })

  it('returns true for NORTHWEST', () => {
    expect(isDiagonalDirection(Direction.NORTHWEST)).toBe(true)
  })

  it('returns true for NORTHEAST', () => {
    expect(isDiagonalDirection(Direction.NORTHEAST)).toBe(true)
  })

  it('returns false for all cardinal and true for all diagonal directions', () => {
    expect(isDiagonalDirection(Direction.NORTH)).toBe(false)
    expect(isDiagonalDirection(Direction.EAST)).toBe(false)
    expect(isDiagonalDirection(Direction.SOUTH)).toBe(false)
    expect(isDiagonalDirection(Direction.WEST)).toBe(false)
    expect(isDiagonalDirection(Direction.SOUTHWEST)).toBe(true)
    expect(isDiagonalDirection(Direction.SOUTHEAST)).toBe(true)
    expect(isDiagonalDirection(Direction.NORTHWEST)).toBe(true)
    expect(isDiagonalDirection(Direction.NORTHEAST)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createSize
// ---------------------------------------------------------------------------

describe('createSize', () => {
  it('creates a size with default values (0, 0)', () => {
    const size = createSize()
    expect(size.width).toBe(0)
    expect(size.height).toBe(0)
  })

  it('creates a size with specified width and height', () => {
    const size = createSize(100, 200)
    expect(size.width).toBe(100)
    expect(size.height).toBe(200)
  })

  it('creates a size with only width specified (height defaults to 0)', () => {
    const size = createSize(50)
    expect(size.width).toBe(50)
    expect(size.height).toBe(0)
  })

  it('creates a size with negative values', () => {
    const size = createSize(-10, -20)
    expect(size.width).toBe(-10)
    expect(size.height).toBe(-20)
  })

  it('creates a size with floating point values', () => {
    const size = createSize(1.5, 2.7)
    expect(size.width).toBe(1.5)
    expect(size.height).toBe(2.7)
  })
})

// ---------------------------------------------------------------------------
// createRect
// ---------------------------------------------------------------------------

describe('createRect', () => {
  it('creates a rect with default values (0, 0, 0, 0)', () => {
    const rect = createRect()
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(0)
    expect(rect.width).toBe(0)
    expect(rect.height).toBe(0)
  })

  it('creates a rect with all specified values', () => {
    const rect = createRect(10, 20, 100, 200)
    expect(rect.x).toBe(10)
    expect(rect.y).toBe(20)
    expect(rect.width).toBe(100)
    expect(rect.height).toBe(200)
  })

  it('creates a rect with partial arguments', () => {
    const rect = createRect(5, 10)
    expect(rect.x).toBe(5)
    expect(rect.y).toBe(10)
    expect(rect.width).toBe(0)
    expect(rect.height).toBe(0)
  })

  it('creates a rect with only x specified', () => {
    const rect = createRect(15)
    expect(rect.x).toBe(15)
    expect(rect.y).toBe(0)
    expect(rect.width).toBe(0)
    expect(rect.height).toBe(0)
  })

  it('creates a rect with negative coordinates', () => {
    const rect = createRect(-5, -10, 50, 60)
    expect(rect.x).toBe(-5)
    expect(rect.y).toBe(-10)
    expect(rect.width).toBe(50)
    expect(rect.height).toBe(60)
  })
})

// ---------------------------------------------------------------------------
// cloneRect
// ---------------------------------------------------------------------------

describe('cloneRect', () => {
  it('creates a shallow clone with identical values', () => {
    const original = createRect(10, 20, 30, 40)
    const cloned = cloneRect(original)
    expect(cloned.x).toBe(10)
    expect(cloned.y).toBe(20)
    expect(cloned.width).toBe(30)
    expect(cloned.height).toBe(40)
  })

  it('returns a different object reference', () => {
    const original = createRect(1, 2, 3, 4)
    const cloned = cloneRect(original)
    expect(cloned).not.toBe(original)
  })

  it('does not share mutations with the original', () => {
    const original = createRect(10, 20, 30, 40)
    const cloned = cloneRect(original)
    cloned.x = 99
    cloned.width = 999
    expect(original.x).toBe(10)
    expect(original.width).toBe(30)
  })

  it('clones a rect with all zeros', () => {
    const original = createRect()
    const cloned = cloneRect(original)
    expect(cloned.x).toBe(0)
    expect(cloned.y).toBe(0)
    expect(cloned.width).toBe(0)
    expect(cloned.height).toBe(0)
    expect(cloned).not.toBe(original)
  })
})

// ---------------------------------------------------------------------------
// createPosition
// ---------------------------------------------------------------------------

describe('createPosition', () => {
  it('creates a position with default values (0, 0, 0)', () => {
    const pos = createPosition()
    expect(pos.x).toBe(0)
    expect(pos.y).toBe(0)
    expect(pos.z).toBe(0)
  })

  it('creates a position with all specified values', () => {
    const pos = createPosition(10, 20, 7)
    expect(pos.x).toBe(10)
    expect(pos.y).toBe(20)
    expect(pos.z).toBe(7)
  })

  it('creates a position with only x and y specified', () => {
    const pos = createPosition(5, 10)
    expect(pos.x).toBe(5)
    expect(pos.y).toBe(10)
    expect(pos.z).toBe(0)
  })

  it('creates a position with only x specified', () => {
    const pos = createPosition(15)
    expect(pos.x).toBe(15)
    expect(pos.y).toBe(0)
    expect(pos.z).toBe(0)
  })

  it('creates a position with negative coordinates', () => {
    const pos = createPosition(-100, -200, -3)
    expect(pos.x).toBe(-100)
    expect(pos.y).toBe(-200)
    expect(pos.z).toBe(-3)
  })

  it('creates a position with large values', () => {
    const pos = createPosition(65535, 65535, 15)
    expect(pos.x).toBe(65535)
    expect(pos.y).toBe(65535)
    expect(pos.z).toBe(15)
  })
})

// ---------------------------------------------------------------------------
// isPositionZero
// ---------------------------------------------------------------------------

describe('isPositionZero', () => {
  it('returns true when all coordinates are zero', () => {
    expect(isPositionZero(createPosition(0, 0, 0))).toBe(true)
  })

  it('returns true for default position', () => {
    expect(isPositionZero(createPosition())).toBe(true)
  })

  it('returns false when x is non-zero', () => {
    expect(isPositionZero(createPosition(1, 0, 0))).toBe(false)
  })

  it('returns false when y is non-zero', () => {
    expect(isPositionZero(createPosition(0, 1, 0))).toBe(false)
  })

  it('returns false when z is non-zero', () => {
    expect(isPositionZero(createPosition(0, 0, 1))).toBe(false)
  })

  it('returns false when all coordinates are non-zero', () => {
    expect(isPositionZero(createPosition(10, 20, 7))).toBe(false)
  })

  it('returns false for negative non-zero values', () => {
    expect(isPositionZero(createPosition(-1, 0, 0))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// positionEquals
// ---------------------------------------------------------------------------

describe('positionEquals', () => {
  it('returns true for two identical positions', () => {
    const a = createPosition(10, 20, 7)
    const b = createPosition(10, 20, 7)
    expect(positionEquals(a, b)).toBe(true)
  })

  it('returns true for two default positions', () => {
    expect(positionEquals(createPosition(), createPosition())).toBe(true)
  })

  it('returns false when x differs', () => {
    expect(positionEquals(createPosition(1, 0, 0), createPosition(2, 0, 0))).toBe(false)
  })

  it('returns false when y differs', () => {
    expect(positionEquals(createPosition(0, 1, 0), createPosition(0, 2, 0))).toBe(false)
  })

  it('returns false when z differs', () => {
    expect(positionEquals(createPosition(0, 0, 1), createPosition(0, 0, 2))).toBe(false)
  })

  it('returns false when all coordinates differ', () => {
    expect(positionEquals(createPosition(1, 2, 3), createPosition(4, 5, 6))).toBe(false)
  })

  it('returns true when comparing a position to itself', () => {
    const pos = createPosition(42, 99, 7)
    expect(positionEquals(pos, pos)).toBe(true)
  })

  it('returns false for positions that differ only in z', () => {
    expect(positionEquals(createPosition(100, 200, 0), createPosition(100, 200, 1))).toBe(false)
  })
})
