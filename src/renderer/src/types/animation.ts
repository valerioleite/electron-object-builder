/**
 * Animation types for OpenTibia frame groups and sprite animation.
 * Ported from legacy AS3: otlib/animation/AnimationMode.as, FrameDuration.as, FrameGroup.as
 * and otlib/things/FrameGroupType.as
 */

import { SPRITE_DEFAULT_SIZE } from './sprites'

// ---------------------------------------------------------------------------
// AnimationMode
// ---------------------------------------------------------------------------

export const AnimationMode = {
  ASYNCHRONOUS: 0,
  SYNCHRONOUS: 1
} as const

export type AnimationMode = (typeof AnimationMode)[keyof typeof AnimationMode]

// ---------------------------------------------------------------------------
// FrameGroupType
// ---------------------------------------------------------------------------

export const FrameGroupType = {
  DEFAULT: 0,
  WALKING: 1
} as const

export type FrameGroupType = (typeof FrameGroupType)[keyof typeof FrameGroupType]

// ---------------------------------------------------------------------------
// FrameDuration
// ---------------------------------------------------------------------------

export interface FrameDuration {
  minimum: number
  maximum: number
}

export function createFrameDuration(minimum = 0, maximum = 0): FrameDuration {
  if (minimum > maximum) {
    throw new Error('The minimum value may not be greater than the maximum value.')
  }
  return { minimum, maximum }
}

export function getFrameDurationValue(fd: FrameDuration): number {
  if (fd.minimum === fd.maximum) {
    return fd.minimum
  }
  return fd.minimum + Math.round(Math.random() * (fd.maximum - fd.minimum))
}

export function frameDurationEquals(a: FrameDuration, b: FrameDuration): boolean {
  return a.minimum === b.minimum && a.maximum === b.maximum
}

export function cloneFrameDuration(fd: FrameDuration): FrameDuration {
  return { minimum: fd.minimum, maximum: fd.maximum }
}

// ---------------------------------------------------------------------------
// FrameGroup
// ---------------------------------------------------------------------------

export interface FrameGroup {
  type: FrameGroupType
  width: number
  height: number
  exactSize: number
  layers: number
  patternX: number
  patternY: number
  patternZ: number
  frames: number
  spriteIndex: number[]
  isAnimation: boolean
  animationMode: AnimationMode
  loopCount: number
  startFrame: number
  frameDurations: FrameDuration[] | null
}

export function createFrameGroup(): FrameGroup {
  return {
    type: FrameGroupType.DEFAULT,
    width: 1,
    height: 1,
    exactSize: SPRITE_DEFAULT_SIZE,
    layers: 1,
    patternX: 1,
    patternY: 1,
    patternZ: 1,
    frames: 1,
    spriteIndex: [],
    isAnimation: false,
    animationMode: AnimationMode.ASYNCHRONOUS,
    loopCount: 0,
    startFrame: 0,
    frameDurations: null
  }
}

export function cloneFrameGroup(fg: FrameGroup): FrameGroup {
  const group = createFrameGroup()
  group.type = fg.type
  group.width = fg.width
  group.height = fg.height
  group.layers = fg.layers
  group.frames = fg.frames
  group.patternX = fg.patternX
  group.patternY = fg.patternY
  group.patternZ = fg.patternZ
  group.exactSize = fg.exactSize

  group.spriteIndex = fg.spriteIndex.slice()

  group.animationMode = fg.animationMode
  group.loopCount = fg.loopCount
  group.startFrame = fg.startFrame

  if (fg.frames > 1 && fg.frameDurations) {
    group.isAnimation = true
    group.frameDurations = fg.frameDurations.map(cloneFrameDuration)
  }

  return group
}

export function getFrameGroupTotalSprites(fg: FrameGroup): number {
  return fg.width * fg.height * fg.patternX * fg.patternY * fg.patternZ * fg.frames * fg.layers
}

export function getFrameGroupTotalTextures(fg: FrameGroup): number {
  return fg.patternX * fg.patternY * fg.patternZ * fg.frames * fg.layers
}

/** Total columns in a sprite sheet: patternZ * patternX * layers */
export function getFrameGroupTotalX(fg: FrameGroup): number {
  return fg.patternZ * fg.patternX * fg.layers
}

/** Total rows in a sprite sheet: frames * patternY */
export function getFrameGroupTotalY(fg: FrameGroup): number {
  return fg.frames * fg.patternY
}

/**
 * Computes the flat index into spriteIndex[] for a given sprite position.
 * This is the core indexing formula used by the binary readers/writers.
 */
export function getFrameGroupSpriteIndex(
  fg: FrameGroup,
  w: number,
  h: number,
  layer: number,
  patternX: number,
  patternY: number,
  patternZ: number,
  frame: number
): number {
  return (
    ((((((frame % fg.frames) * fg.patternZ + patternZ) * fg.patternY + patternY) * fg.patternX +
      patternX) *
      fg.layers +
      layer) *
      fg.height +
      h) *
      fg.width +
    w
  )
}

/**
 * Computes the texture index for a given layer/pattern/frame combination.
 * Used when compositing sprite sheets.
 */
export function getFrameGroupTextureIndex(
  fg: FrameGroup,
  layer: number,
  patternX: number,
  patternY: number,
  patternZ: number,
  frame: number
): number {
  return (
    ((((frame % fg.frames) * fg.patternZ + patternZ) * fg.patternY + patternY) * fg.patternX +
      patternX) *
      fg.layers +
    layer
  )
}

/** Pixel dimensions of a sprite sheet for this frame group. */
export function getFrameGroupSpriteSheetSize(fg: FrameGroup): { width: number; height: number } {
  return {
    width: fg.patternZ * fg.patternX * fg.layers * fg.width * SPRITE_DEFAULT_SIZE,
    height: fg.frames * fg.patternY * fg.height * SPRITE_DEFAULT_SIZE
  }
}

/** Creates an outfit frame group with 4 directions. */
export function makeOutfitFrameGroup(duration: number): FrameGroup {
  const fg = createFrameGroup()
  fg.patternX = 4
  fg.frames = 1
  fg.isAnimation = false
  fg.frameDurations = [createFrameDuration(duration, duration)]
  fg.spriteIndex = new Array(getFrameGroupTotalSprites(fg)).fill(0)
  return fg
}
