/**
 * Thing types for OpenTibia object management.
 * Ported from legacy AS3: otlib/things/ThingType.as, ThingData.as, ThingCategory.as
 */

import {
  AnimationMode,
  type FrameDuration,
  type FrameGroup,
  FrameGroupType,
  cloneFrameGroup,
  createFrameDuration,
  createFrameGroup,
  getFrameGroupTotalSprites,
  makeOutfitFrameGroup
} from './animation'
import { type SpriteData, cloneSpriteData } from './sprites'

// ---------------------------------------------------------------------------
// ThingCategory
// ---------------------------------------------------------------------------

export const ThingCategory = {
  ITEM: 'item',
  OUTFIT: 'outfit',
  EFFECT: 'effect',
  MISSILE: 'missile'
} as const

export type ThingCategory = (typeof ThingCategory)[keyof typeof ThingCategory]

/** Numeric values used in binary formats (DAT). */
export const ThingCategoryValue: Record<ThingCategory, number> = {
  [ThingCategory.ITEM]: 1,
  [ThingCategory.OUTFIT]: 2,
  [ThingCategory.EFFECT]: 3,
  [ThingCategory.MISSILE]: 4
} as const

const categoryByValue = new Map<number, ThingCategory>([
  [1, ThingCategory.ITEM],
  [2, ThingCategory.OUTFIT],
  [3, ThingCategory.EFFECT],
  [4, ThingCategory.MISSILE]
])

export function isValidThingCategory(category: string): category is ThingCategory {
  return (
    category === ThingCategory.ITEM ||
    category === ThingCategory.OUTFIT ||
    category === ThingCategory.EFFECT ||
    category === ThingCategory.MISSILE
  )
}

export function getThingCategoryByValue(value: number): ThingCategory | null {
  return categoryByValue.get(value) ?? null
}

export function getThingCategoryValue(category: ThingCategory): number {
  return ThingCategoryValue[category]
}

// ---------------------------------------------------------------------------
// ThingType
// ---------------------------------------------------------------------------

export interface ThingType {
  id: number
  category: ThingCategory
  name: string

  // Physical / behavior flags
  isGround: boolean
  groundSpeed: number
  isGroundBorder: boolean
  isOnBottom: boolean
  isOnTop: boolean
  isContainer: boolean
  stackable: boolean
  forceUse: boolean
  multiUse: boolean
  hasCharges: boolean
  writable: boolean
  writableOnce: boolean
  maxReadWriteChars: number
  maxReadChars: number
  isFluidContainer: boolean
  isFluid: boolean
  isUnpassable: boolean
  isUnmoveable: boolean
  blockMissile: boolean
  blockPathfind: boolean
  noMoveAnimation: boolean
  pickupable: boolean
  hangable: boolean

  // Display flags
  isVertical: boolean
  isHorizontal: boolean
  rotatable: boolean
  hasLight: boolean
  lightLevel: number
  lightColor: number
  dontHide: boolean
  isTranslucent: boolean
  floorChange: boolean

  // Offset
  hasOffset: boolean
  offsetX: number
  offsetY: number

  // Bones (directional offsets, indexed by Direction)
  hasBones: boolean
  bonesOffsetX: number[]
  bonesOffsetY: number[]

  // Elevation
  hasElevation: boolean
  elevation: number

  // Behavior
  isLyingObject: boolean
  animateAlways: boolean
  miniMap: boolean
  miniMapColor: number
  isLensHelp: boolean
  lensHelp: number
  isFullGround: boolean
  ignoreLook: boolean

  // Cloth
  cloth: boolean
  clothSlot: number

  // Market
  isMarketItem: boolean
  marketName: string
  marketCategory: number
  marketTradeAs: number
  marketShowAs: number
  marketRestrictProfession: number
  marketRestrictLevel: number

  // Default action
  hasDefaultAction: boolean
  defaultAction: number

  // Miscellaneous
  wrappable: boolean
  unwrappable: boolean
  topEffect: boolean
  usable: boolean

  // Frame groups (indexed by FrameGroupType)
  frameGroups: (FrameGroup | undefined)[]
}

export function createThingType(): ThingType {
  return {
    id: 0,
    category: ThingCategory.ITEM,
    name: '',

    isGround: false,
    groundSpeed: 0,
    isGroundBorder: false,
    isOnBottom: false,
    isOnTop: false,
    isContainer: false,
    stackable: false,
    forceUse: false,
    multiUse: false,
    hasCharges: false,
    writable: false,
    writableOnce: false,
    maxReadWriteChars: 0,
    maxReadChars: 0,
    isFluidContainer: false,
    isFluid: false,
    isUnpassable: false,
    isUnmoveable: false,
    blockMissile: false,
    blockPathfind: false,
    noMoveAnimation: false,
    pickupable: false,
    hangable: false,

    isVertical: false,
    isHorizontal: false,
    rotatable: false,
    hasLight: false,
    lightLevel: 0,
    lightColor: 0,
    dontHide: false,
    isTranslucent: false,
    floorChange: false,

    hasOffset: false,
    offsetX: 0,
    offsetY: 0,

    hasBones: false,
    bonesOffsetX: [0, 0, 0, 0, 0, 0, 0, 0],
    bonesOffsetY: [0, 0, 0, 0, 0, 0, 0, 0],

    hasElevation: false,
    elevation: 0,

    isLyingObject: false,
    animateAlways: false,
    miniMap: false,
    miniMapColor: 0,
    isLensHelp: false,
    lensHelp: 0,
    isFullGround: false,
    ignoreLook: false,

    cloth: false,
    clothSlot: 0,

    isMarketItem: false,
    marketName: '',
    marketCategory: 0,
    marketTradeAs: 0,
    marketShowAs: 0,
    marketRestrictProfession: 0,
    marketRestrictLevel: 0,

    hasDefaultAction: false,
    defaultAction: 0,

    wrappable: false,
    unwrappable: false,
    topEffect: false,
    usable: false,

    frameGroups: []
  }
}

export function getThingFrameGroup(thing: ThingType, groupType: FrameGroupType): FrameGroup | undefined {
  return thing.frameGroups[groupType]
}

export function setThingFrameGroup(
  thing: ThingType,
  groupType: FrameGroupType,
  frameGroup: FrameGroup
): void {
  frameGroup.type = groupType
  thing.frameGroups[groupType] = frameGroup
}

/** Copies all property flags from source to target (not id, category, name, or frameGroups). */
export function copyThingProperties(source: ThingType, target: ThingType): void {
  target.isGround = source.isGround
  target.groundSpeed = source.groundSpeed
  target.isGroundBorder = source.isGroundBorder
  target.isOnBottom = source.isOnBottom
  target.isOnTop = source.isOnTop
  target.isContainer = source.isContainer
  target.stackable = source.stackable
  target.forceUse = source.forceUse
  target.multiUse = source.multiUse
  target.hasCharges = source.hasCharges
  target.writable = source.writable
  target.writableOnce = source.writableOnce
  target.maxReadWriteChars = source.maxReadWriteChars
  target.maxReadChars = source.maxReadChars
  target.isFluidContainer = source.isFluidContainer
  target.isFluid = source.isFluid
  target.isUnpassable = source.isUnpassable
  target.isUnmoveable = source.isUnmoveable
  target.blockMissile = source.blockMissile
  target.blockPathfind = source.blockPathfind
  target.noMoveAnimation = source.noMoveAnimation
  target.pickupable = source.pickupable
  target.hangable = source.hangable
  target.isVertical = source.isVertical
  target.isHorizontal = source.isHorizontal
  target.rotatable = source.rotatable
  target.hasLight = source.hasLight
  target.lightLevel = source.lightLevel
  target.lightColor = source.lightColor
  target.dontHide = source.dontHide
  target.isTranslucent = source.isTranslucent
  target.floorChange = source.floorChange
  target.hasOffset = source.hasOffset
  target.offsetX = source.offsetX
  target.offsetY = source.offsetY
  target.hasBones = source.hasBones
  target.bonesOffsetX = source.bonesOffsetX.slice()
  target.bonesOffsetY = source.bonesOffsetY.slice()
  target.hasElevation = source.hasElevation
  target.elevation = source.elevation
  target.isLyingObject = source.isLyingObject
  target.animateAlways = source.animateAlways
  target.miniMap = source.miniMap
  target.miniMapColor = source.miniMapColor
  target.isLensHelp = source.isLensHelp
  target.lensHelp = source.lensHelp
  target.isFullGround = source.isFullGround
  target.ignoreLook = source.ignoreLook
  target.cloth = source.cloth
  target.clothSlot = source.clothSlot
  target.isMarketItem = source.isMarketItem
  target.marketName = source.marketName
  target.marketCategory = source.marketCategory
  target.marketTradeAs = source.marketTradeAs
  target.marketShowAs = source.marketShowAs
  target.marketRestrictProfession = source.marketRestrictProfession
  target.marketRestrictLevel = source.marketRestrictLevel
  target.hasDefaultAction = source.hasDefaultAction
  target.defaultAction = source.defaultAction
  target.wrappable = source.wrappable
  target.unwrappable = source.unwrappable
  target.topEffect = source.topEffect
  target.usable = source.usable
}

export function cloneThingType(thing: ThingType): ThingType {
  const clone = createThingType()
  clone.id = thing.id
  clone.category = thing.category
  clone.name = thing.name
  copyThingProperties(thing, clone)

  clone.frameGroups = []
  for (
    let groupType: number = FrameGroupType.DEFAULT;
    groupType <= FrameGroupType.WALKING;
    groupType++
  ) {
    const group = thing.frameGroups[groupType]
    if (group) {
      setThingFrameGroup(clone, groupType as FrameGroupType, cloneFrameGroup(group))
    }
  }

  return clone
}

/** Copies frame group structure (patterns/animation) from source, clearing sprite indices to 0. */
export function copyThingPatterns(source: ThingType, target: ThingType): void {
  target.frameGroups = []
  for (
    let groupType: number = FrameGroupType.DEFAULT;
    groupType <= FrameGroupType.WALKING;
    groupType++
  ) {
    const sourceGroup = source.frameGroups[groupType]
    if (sourceGroup) {
      const cloned = cloneFrameGroup(sourceGroup)
      cloned.spriteIndex = cloned.spriteIndex.map(() => 0)
      setThingFrameGroup(target, groupType as FrameGroupType, cloned)
    }
  }
}

/** Returns all sprite indices from all frame groups as a flat array. */
export function getThingSpriteIndices(thing: ThingType): number[] {
  const result: number[] = []
  for (const group of thing.frameGroups) {
    if (group?.spriteIndex) {
      result.push(...group.spriteIndex)
    }
  }
  return result
}

/** Checks if this ThingType has no sprites (all sprite indices are 0). */
export function isThingTypeEmpty(thing: ThingType): boolean {
  const frameGroup = thing.frameGroups[FrameGroupType.DEFAULT]
  if (frameGroup?.spriteIndex) {
    for (const idx of frameGroup.spriteIndex) {
      if (idx !== 0) return false
    }
  }
  return true
}

/**
 * Factory method to create a new ThingType with proper defaults for the given category.
 * Outfits get 4-direction frame groups; missiles get 3x3 patterns.
 */
export function createThing(
  id: number,
  category: ThingCategory,
  useFrameGroups: boolean,
  duration: number
): ThingType {
  if (!isValidThingCategory(category)) {
    throw new Error(`Invalid category: ${category}`)
  }

  const thing = createThingType()
  thing.category = category
  thing.id = id

  if (category === ThingCategory.OUTFIT) {
    const maxGroup = useFrameGroups ? FrameGroupType.WALKING : FrameGroupType.DEFAULT
    for (let groupType = FrameGroupType.DEFAULT; groupType <= maxGroup; groupType++) {
      const group = makeOutfitFrameGroup(duration)
      group.type = groupType as FrameGroupType
      setThingFrameGroup(thing, groupType as FrameGroupType, group)
    }
  } else {
    const group = createFrameGroup()
    if (category === ThingCategory.MISSILE) {
      group.patternX = 3
      group.patternY = 3
    }
    group.spriteIndex = new Array(getFrameGroupTotalSprites(group)).fill(0)
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)
  }

  return thing
}

/**
 * Splits a single default frame group into idle (DEFAULT) + walking (WALKING) groups.
 * Used when converting from non-frame-group format to frame-group format for outfits.
 */
export function addThingFrameGroupState(
  thing: ThingType,
  improvedAnimations: boolean,
  duration: number
): void {
  const normal = thing.frameGroups[FrameGroupType.DEFAULT]
  if (!normal || normal.frames < 3) return

  // Idle: first frame only
  const idle = cloneFrameGroup(normal)
  idle.frames = 1
  const idleSprites = getFrameGroupTotalSprites(idle)
  idle.spriteIndex = normal.spriteIndex.slice(0, idleSprites)
  idle.isAnimation = false
  idle.frameDurations = null
  idle.animationMode = AnimationMode.ASYNCHRONOUS
  idle.loopCount = 0
  idle.startFrame = 0

  // Walking: remaining frames
  const walking = cloneFrameGroup(normal)
  walking.frames = normal.frames - 1
  walking.spriteIndex = normal.spriteIndex.slice(
    idleSprites,
    idleSprites + getFrameGroupTotalSprites(walking)
  )
  walking.isAnimation = walking.frames > 1
  walking.frameDurations = new Array<FrameDuration>(walking.frames)
  walking.animationMode = AnimationMode.ASYNCHRONOUS
  walking.loopCount = 0
  walking.startFrame = 0

  for (let frameId = 0; frameId < walking.frames; frameId++) {
    if (improvedAnimations && normal.frameDurations?.[frameId]) {
      walking.frameDurations[frameId] = { ...normal.frameDurations[frameId] }
    } else {
      walking.frameDurations[frameId] = createFrameDuration(duration, duration)
    }
  }

  setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)
  setThingFrameGroup(thing, FrameGroupType.WALKING, walking)
}

/**
 * Merges idle (DEFAULT) + walking (WALKING) frame groups back into a single DEFAULT group.
 * Used when converting from frame-group format back to non-frame-group format for outfits.
 * Ported from legacy ThingType.removeFrameGroupState().
 */
export function removeThingFrameGroupState(
  thing: ThingType,
  duration: number,
  removeMounts: boolean
): void {
  const idle = thing.frameGroups[FrameGroupType.DEFAULT]
  const walking = thing.frameGroups[FrameGroupType.WALKING]
  if (!idle && !walking) return

  // Remove mounts by reducing patternZ to 1
  if (removeMounts) {
    if (idle) idle.patternZ = 1
    if (walking) walking.patternZ = 1
  }

  // Create new single group from idle template
  const normal = idle ? cloneFrameGroup(idle) : createFrameGroup()
  normal.frames = 3

  // Sprites per single frame (using potentially reduced patternZ)
  const spritesPerFrame =
    normal.width * normal.height * normal.layers * normal.patternX * normal.patternY * normal.patternZ

  const newSpriteIndex: number[] = []

  // Frame 1: idle sprites (first frame)
  if (idle) {
    for (let i = 0; i < spritesPerFrame; i++) {
      newSpriteIndex.push(idle.spriteIndex[i] ?? 0)
    }
  } else {
    for (let i = 0; i < spritesPerFrame; i++) newSpriteIndex.push(0)
  }

  // Frame 2: walking first frame
  if (walking) {
    for (let i = 0; i < spritesPerFrame; i++) {
      newSpriteIndex.push(walking.spriteIndex[i] ?? 0)
    }
  } else {
    for (let i = 0; i < spritesPerFrame; i++) newSpriteIndex.push(0)
  }

  // Frame 3: walking 5th frame if available, else 2nd, else 1st again
  if (walking) {
    const walkingLength = walking.spriteIndex.length
    if (walkingLength > spritesPerFrame * 4) {
      // 5th frame (index 4)
      for (let i = spritesPerFrame * 4; i < spritesPerFrame * 4 + spritesPerFrame; i++) {
        newSpriteIndex.push(walking.spriteIndex[i] ?? 0)
      }
    } else if (walkingLength > spritesPerFrame) {
      // 2nd frame (index 1)
      for (let i = spritesPerFrame; i < spritesPerFrame + spritesPerFrame; i++) {
        newSpriteIndex.push(walking.spriteIndex[i] ?? 0)
      }
    } else {
      // 1st frame again
      for (let i = 0; i < spritesPerFrame; i++) {
        newSpriteIndex.push(walking.spriteIndex[i] ?? 0)
      }
    }
  } else {
    for (let i = 0; i < spritesPerFrame; i++) newSpriteIndex.push(0)
  }

  normal.spriteIndex = newSpriteIndex
  normal.isAnimation = true
  normal.animationMode = AnimationMode.ASYNCHRONOUS
  normal.loopCount = 0
  normal.startFrame = 0

  // Set uniform durations for all 3 frames
  normal.frameDurations = [
    createFrameDuration(duration, duration),
    createFrameDuration(duration, duration),
    createFrameDuration(duration, duration)
  ]

  // Reset frame groups to single DEFAULT
  thing.frameGroups = []
  setThingFrameGroup(thing, FrameGroupType.DEFAULT, normal)
}

// ---------------------------------------------------------------------------
// ThingData
// ---------------------------------------------------------------------------

export interface ThingData {
  obdVersion: number
  clientVersion: number
  thing: ThingType
  /** Sprites indexed by FrameGroupType -> SpriteData[] */
  sprites: Map<FrameGroupType, SpriteData[]>
  xmlAttributes: Record<string, string> | null
}

export function createThingData(
  obdVersion: number,
  clientVersion: number,
  thing: ThingType,
  sprites: Map<FrameGroupType, SpriteData[]>
): ThingData {
  return {
    obdVersion,
    clientVersion,
    thing,
    sprites,
    xmlAttributes: null
  }
}

/** Deep-clone a ThingData (thing + sprites + xmlAttributes). */
export function cloneThingData(data: ThingData): ThingData {
  const clonedSprites = new Map<FrameGroupType, SpriteData[]>()
  for (const [groupType, sprites] of data.sprites) {
    clonedSprites.set(
      groupType,
      sprites.map((s) => cloneSpriteData(s))
    )
  }
  return {
    obdVersion: data.obdVersion,
    clientVersion: data.clientVersion,
    thing: cloneThingType(data.thing),
    sprites: clonedSprites,
    xmlAttributes: data.xmlAttributes ? { ...data.xmlAttributes } : null
  }
}
