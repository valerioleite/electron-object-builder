/**
 * Geometry types for OpenTibia.
 * Ported from legacy AS3: otlib/geom/Direction.as, Size.as, Rect.as, Position.as
 */

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

export const Direction = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3,
  SOUTHWEST: 4,
  SOUTHEAST: 5,
  NORTHWEST: 6,
  NORTHEAST: 7
} as const

export type Direction = (typeof Direction)[keyof typeof Direction]

const directionNames: Record<Direction, string> = {
  [Direction.NORTH]: 'north',
  [Direction.EAST]: 'east',
  [Direction.SOUTH]: 'south',
  [Direction.WEST]: 'west',
  [Direction.SOUTHWEST]: 'southwest',
  [Direction.SOUTHEAST]: 'southeast',
  [Direction.NORTHWEST]: 'northwest',
  [Direction.NORTHEAST]: 'northeast'
}

export function getDirectionName(direction: Direction): string {
  return directionNames[direction]
}

export function toDirection(value: number): Direction | undefined {
  if (value >= 0 && value <= 7) return value as Direction
  return undefined
}

export function isDiagonalDirection(direction: Direction): boolean {
  return (
    direction === Direction.SOUTHWEST ||
    direction === Direction.SOUTHEAST ||
    direction === Direction.NORTHWEST ||
    direction === Direction.NORTHEAST
  )
}

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export interface Size {
  width: number
  height: number
}

export function createSize(width = 0, height = 0): Size {
  return { width, height }
}

// ---------------------------------------------------------------------------
// Rect
// ---------------------------------------------------------------------------

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function createRect(x = 0, y = 0, width = 0, height = 0): Rect {
  return { x, y, width, height }
}

export function cloneRect(rect: Rect): Rect {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

export interface Position {
  x: number
  y: number
  z: number
}

export function createPosition(x = 0, y = 0, z = 0): Position {
  return { x, y, z }
}

export function isPositionZero(pos: Position): boolean {
  return pos.x === 0 && pos.y === 0 && pos.z === 0
}

export function positionEquals(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z
}
