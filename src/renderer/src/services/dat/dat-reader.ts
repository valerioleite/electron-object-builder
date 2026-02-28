/**
 * DAT file reader - reads OpenTibia metadata (DAT) binary files.
 * Ported from legacy AS3: otlib/things/MetadataReader.as, MetadataReader1-6.as,
 * otlib/things/ThingTypeStorage.as (load logic)
 *
 * Supports client versions 7.10 through 10.56+ (MetadataFlags 1-6).
 */

import { BinaryReader } from './binary-stream'
import {
  type ThingType,
  type ThingCategory,
  ThingCategory as TC,
  createThingType,
  setThingFrameGroup,
  type FrameGroup,
  type FrameDuration,
  type AnimationMode,
  createFrameGroup,
  createFrameDuration,
  getFrameGroupTotalSprites,
  type ClientFeatures,
  Direction,
  MetadataFlags1,
  MetadataFlags2,
  MetadataFlags3,
  MetadataFlags4,
  MetadataFlags5,
  MetadataFlags6,
  LAST_FLAG,
  SPRITE_DEFAULT_SIZE,
  SPRITE_DEFAULT_DATA_SIZE
} from '../../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** DAT file header byte offsets */
const HEADER_SIGNATURE = 0
const HEADER_ITEMS_COUNT = 4
const HEADER_OUTFITS_COUNT = 6
const HEADER_EFFECTS_COUNT = 8
const HEADER_MISSILES_COUNT = 10
const HEADER_SIZE = 12

/** Minimum IDs per category (OpenTibia protocol) */
const MIN_ITEM_ID = 100
const MIN_OUTFIT_ID = 1
const MIN_EFFECT_ID = 1
const MIN_MISSILE_ID = 1

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DatReadResult {
  signature: number
  maxItemId: number
  maxOutfitId: number
  maxEffectId: number
  maxMissileId: number
  items: ThingType[]
  outfits: ThingType[]
  effects: ThingType[]
  missiles: ThingType[]
}

export type DefaultDurationFn = (category: ThingCategory) => number

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Reads a DAT binary file and returns all parsed thing types.
 *
 * @param buffer - Raw DAT file bytes
 * @param version - Client version number (e.g. 710, 860, 1056)
 * @param features - Client feature flags
 * @param getDefaultDuration - Callback returning default animation duration (ms) per category
 */
export function readDat(
  buffer: ArrayBuffer,
  version: number,
  features: ClientFeatures,
  getDefaultDuration: DefaultDurationFn
): DatReadResult {
  const reader = new BinaryReader(buffer)

  // Read header
  reader.position = HEADER_SIGNATURE
  const signature = reader.readUint32()

  reader.position = HEADER_ITEMS_COUNT
  const maxItemId = reader.readUint16()

  reader.position = HEADER_OUTFITS_COUNT
  const maxOutfitId = reader.readUint16()

  reader.position = HEADER_EFFECTS_COUNT
  const maxEffectId = reader.readUint16()

  reader.position = HEADER_MISSILES_COUNT
  const maxMissileId = reader.readUint16()

  // Position after header for sequential reading
  reader.position = HEADER_SIZE

  const readProps = getPropertyReader(version)
  const hasPatternZ = version >= 755

  // Read items (100 to maxItemId)
  const items: ThingType[] = []
  for (let id = MIN_ITEM_ID; id <= maxItemId; id++) {
    const thing = createThingType()
    thing.id = id
    thing.category = TC.ITEM
    readProps(reader, thing)
    readTexturePatterns(reader, thing, features, getDefaultDuration, hasPatternZ)
    items.push(thing)
  }

  // Read outfits (1 to maxOutfitId)
  const outfits: ThingType[] = []
  for (let id = MIN_OUTFIT_ID; id <= maxOutfitId; id++) {
    const thing = createThingType()
    thing.id = id
    thing.category = TC.OUTFIT
    readProps(reader, thing)
    readTexturePatterns(reader, thing, features, getDefaultDuration, hasPatternZ)
    outfits.push(thing)
  }

  // Read effects (1 to maxEffectId)
  const effects: ThingType[] = []
  for (let id = MIN_EFFECT_ID; id <= maxEffectId; id++) {
    const thing = createThingType()
    thing.id = id
    thing.category = TC.EFFECT
    readProps(reader, thing)
    readTexturePatterns(reader, thing, features, getDefaultDuration, hasPatternZ)
    effects.push(thing)
  }

  // Read missiles (1 to maxMissileId)
  const missiles: ThingType[] = []
  for (let id = MIN_MISSILE_ID; id <= maxMissileId; id++) {
    const thing = createThingType()
    thing.id = id
    thing.category = TC.MISSILE
    readProps(reader, thing)
    readTexturePatterns(reader, thing, features, getDefaultDuration, hasPatternZ)
    missiles.push(thing)
  }

  return {
    signature,
    maxItemId,
    maxOutfitId,
    maxEffectId,
    maxMissileId,
    items,
    outfits,
    effects,
    missiles
  }
}

// ---------------------------------------------------------------------------
// Texture patterns (shared across all versions)
// ---------------------------------------------------------------------------

function readTexturePatterns(
  reader: BinaryReader,
  thing: ThingType,
  features: ClientFeatures,
  getDefaultDuration: DefaultDurationFn,
  hasPatternZ: boolean
): void {
  const extended = features.extended
  const improvedAnimations = features.improvedAnimations
  const useFrameGroups = features.frameGroups

  let groupCount = 1
  if (useFrameGroups && thing.category === TC.OUTFIT) {
    groupCount = reader.readUint8()
  }

  for (let groupType = 0; groupType < groupCount; groupType++) {
    if (useFrameGroups && thing.category === TC.OUTFIT) {
      reader.readUint8() // group type byte (consumed but not used)
    }

    const frameGroup: FrameGroup = createFrameGroup()
    frameGroup.width = reader.readUint8()
    frameGroup.height = reader.readUint8()

    if (frameGroup.width > 1 || frameGroup.height > 1) {
      frameGroup.exactSize = reader.readUint8()
    } else {
      frameGroup.exactSize = SPRITE_DEFAULT_SIZE
    }

    frameGroup.layers = reader.readUint8()
    frameGroup.patternX = reader.readUint8()
    frameGroup.patternY = reader.readUint8()
    frameGroup.patternZ = hasPatternZ ? reader.readUint8() : 1
    frameGroup.frames = reader.readUint8()

    if (frameGroup.frames > 1) {
      frameGroup.isAnimation = true
      frameGroup.frameDurations = new Array<FrameDuration>(frameGroup.frames)

      if (improvedAnimations) {
        frameGroup.animationMode = reader.readUint8() as AnimationMode
        frameGroup.loopCount = reader.readInt32()
        frameGroup.startFrame = reader.readInt8()

        for (let i = 0; i < frameGroup.frames; i++) {
          const minimum = reader.readUint32()
          const maximum = reader.readUint32()
          frameGroup.frameDurations[i] = createFrameDuration(minimum, maximum)
        }
      } else {
        const duration = getDefaultDuration(thing.category)
        for (let i = 0; i < frameGroup.frames; i++) {
          frameGroup.frameDurations[i] = createFrameDuration(duration, duration)
        }
      }
    }

    const totalSprites = getFrameGroupTotalSprites(frameGroup)
    if (totalSprites > SPRITE_DEFAULT_DATA_SIZE) {
      throw new Error(`A thing type has more than ${SPRITE_DEFAULT_DATA_SIZE} sprites.`)
    }

    frameGroup.spriteIndex = new Array<number>(totalSprites)
    for (let i = 0; i < totalSprites; i++) {
      frameGroup.spriteIndex[i] = extended ? reader.readUint32() : reader.readUint16()
    }

    setThingFrameGroup(thing, groupType as 0 | 1, frameGroup)
  }
}

// ---------------------------------------------------------------------------
// Version selector
// ---------------------------------------------------------------------------

export type ReadPropertiesFn = (reader: BinaryReader, thing: ThingType) => void

export function getPropertyReader(version: number): ReadPropertiesFn {
  if (version < 740) return readPropertiesV1
  if (version < 755) return readPropertiesV2
  if (version < 780) return readPropertiesV3
  if (version < 860) return readPropertiesV4
  if (version < 1010) return readPropertiesV5
  return readPropertiesV6
}

// ---------------------------------------------------------------------------
// Version 1: Clients 7.10 - 7.30
// ---------------------------------------------------------------------------

function readPropertiesV1(reader: BinaryReader, thing: ThingType): void {
  const F = MetadataFlags1
  let flag = 0

  while (flag < LAST_FLAG) {
    const previousFlag = flag
    flag = reader.readUint8()
    if (flag === LAST_FLAG) return

    switch (flag) {
      case F.GROUND:
        thing.isGround = true
        thing.groundSpeed = reader.readUint16()
        break
      case F.ON_BOTTOM:
        thing.isOnBottom = true
        break
      case F.ON_TOP:
        thing.isOnTop = true
        break
      case F.CONTAINER:
        thing.isContainer = true
        break
      case F.STACKABLE:
        thing.stackable = true
        break
      case F.MULTI_USE:
        thing.multiUse = true
        break
      case F.FORCE_USE:
        thing.forceUse = true
        break
      case F.WRITABLE:
        thing.writable = true
        thing.maxReadWriteChars = reader.readUint16()
        break
      case F.WRITABLE_ONCE:
        thing.writableOnce = true
        thing.maxReadChars = reader.readUint16()
        break
      case F.FLUID_CONTAINER:
        thing.isFluidContainer = true
        break
      case F.FLUID:
        thing.isFluid = true
        break
      case F.UNPASSABLE:
        thing.isUnpassable = true
        break
      case F.UNMOVEABLE:
        thing.isUnmoveable = true
        break
      case F.BLOCK_MISSILE:
        thing.blockMissile = true
        break
      case F.BLOCK_PATHFINDER:
        thing.blockPathfind = true
        break
      case F.PICKUPABLE:
        thing.pickupable = true
        break
      case F.HAS_LIGHT:
        thing.hasLight = true
        thing.lightLevel = reader.readUint16()
        thing.lightColor = reader.readUint16()
        break
      case F.FLOOR_CHANGE:
        thing.floorChange = true
        break
      case F.FULL_GROUND:
        thing.isFullGround = true
        break
      case F.HAS_ELEVATION:
        thing.hasElevation = true
        thing.elevation = reader.readUint16()
        break
      case F.HAS_OFFSET:
        thing.hasOffset = true
        thing.offsetX = 8
        thing.offsetY = 8
        break
      case F.MINI_MAP:
        thing.miniMap = true
        thing.miniMapColor = reader.readUint16()
        break
      case F.ROTATABLE:
        thing.rotatable = true
        break
      case F.LYING_OBJECT:
        thing.isLyingObject = true
        break
      case F.ANIMATE_ALWAYS:
        thing.animateAlways = true
        break
      case F.LENS_HELP:
        thing.isLensHelp = true
        thing.lensHelp = reader.readUint16()
        break
      case F.WRAPPABLE:
        thing.wrappable = true
        break
      case F.UNWRAPPABLE:
        thing.unwrappable = true
        break
      case F.TOP_EFFECT:
        thing.topEffect = true
        break
      default:
        throw new Error(
          `Unknown flag 0x${flag.toString(16)} (previous: 0x${previousFlag.toString(16)}) ` +
            `for ${thing.category} id ${thing.id}`
        )
    }
  }
}

// ---------------------------------------------------------------------------
// Version 2: Clients 7.40 - 7.50
// ---------------------------------------------------------------------------

function readPropertiesV2(reader: BinaryReader, thing: ThingType): void {
  const F = MetadataFlags2
  let flag = 0

  while (flag < LAST_FLAG) {
    const previousFlag = flag
    flag = reader.readUint8()
    if (flag === LAST_FLAG) return

    switch (flag) {
      case F.GROUND:
        thing.isGround = true
        thing.groundSpeed = reader.readUint16()
        break
      case F.ON_BOTTOM:
        thing.isOnBottom = true
        break
      case F.ON_TOP:
        thing.isOnTop = true
        break
      case F.CONTAINER:
        thing.isContainer = true
        break
      case F.STACKABLE:
        thing.stackable = true
        break
      case F.MULTI_USE:
        thing.multiUse = true
        break
      case F.FORCE_USE:
        thing.forceUse = true
        break
      case F.WRITABLE:
        thing.writable = true
        thing.maxReadWriteChars = reader.readUint16()
        break
      case F.WRITABLE_ONCE:
        thing.writableOnce = true
        thing.maxReadChars = reader.readUint16()
        break
      case F.FLUID_CONTAINER:
        thing.isFluidContainer = true
        break
      case F.FLUID:
        thing.isFluid = true
        break
      case F.UNPASSABLE:
        thing.isUnpassable = true
        break
      case F.UNMOVEABLE:
        thing.isUnmoveable = true
        break
      case F.BLOCK_MISSILE:
        thing.blockMissile = true
        break
      case F.BLOCK_PATHFINDER:
        thing.blockPathfind = true
        break
      case F.PICKUPABLE:
        thing.pickupable = true
        break
      case F.HAS_LIGHT:
        thing.hasLight = true
        thing.lightLevel = reader.readUint16()
        thing.lightColor = reader.readUint16()
        break
      case F.FLOOR_CHANGE:
        thing.floorChange = true
        break
      case F.FULL_GROUND:
        thing.isFullGround = true
        break
      case F.HAS_ELEVATION:
        thing.hasElevation = true
        thing.elevation = reader.readUint16()
        break
      case F.HAS_OFFSET:
        thing.hasOffset = true
        thing.offsetX = 8
        thing.offsetY = 8
        break
      case F.MINI_MAP:
        thing.miniMap = true
        thing.miniMapColor = reader.readUint16()
        break
      case F.ROTATABLE:
        thing.rotatable = true
        break
      case F.LYING_OBJECT:
        thing.isLyingObject = true
        break
      case F.HANGABLE:
        thing.hangable = true
        break
      case F.VERTICAL:
        thing.isVertical = true
        break
      case F.HORIZONTAL:
        thing.isHorizontal = true
        break
      case F.ANIMATE_ALWAYS:
        thing.animateAlways = true
        break
      case F.LENS_HELP:
        thing.isLensHelp = true
        thing.lensHelp = reader.readUint16()
        break
      case F.WRAPPABLE:
        thing.wrappable = true
        break
      case F.UNWRAPPABLE:
        thing.unwrappable = true
        break
      case F.TOP_EFFECT:
        thing.topEffect = true
        break
      default:
        throw new Error(
          `Unknown flag 0x${flag.toString(16)} (previous: 0x${previousFlag.toString(16)}) ` +
            `for ${thing.category} id ${thing.id}`
        )
    }
  }
}

// ---------------------------------------------------------------------------
// Version 3: Clients 7.55 - 7.72
// ---------------------------------------------------------------------------

function readPropertiesV3(reader: BinaryReader, thing: ThingType): void {
  const F = MetadataFlags3
  let flag = 0

  while (flag < LAST_FLAG) {
    const previousFlag = flag
    flag = reader.readUint8()
    if (flag === LAST_FLAG) return

    switch (flag) {
      case F.GROUND:
        thing.isGround = true
        thing.groundSpeed = reader.readUint16()
        break
      case F.GROUND_BORDER:
        thing.isGroundBorder = true
        break
      case F.ON_BOTTOM:
        thing.isOnBottom = true
        break
      case F.ON_TOP:
        thing.isOnTop = true
        break
      case F.CONTAINER:
        thing.isContainer = true
        break
      case F.STACKABLE:
        thing.stackable = true
        break
      case F.MULTI_USE:
        thing.multiUse = true
        break
      case F.FORCE_USE:
        thing.forceUse = true
        break
      case F.WRITABLE:
        thing.writable = true
        thing.maxReadWriteChars = reader.readUint16()
        break
      case F.WRITABLE_ONCE:
        thing.writableOnce = true
        thing.maxReadChars = reader.readUint16()
        break
      case F.FLUID_CONTAINER:
        thing.isFluidContainer = true
        break
      case F.FLUID:
        thing.isFluid = true
        break
      case F.UNPASSABLE:
        thing.isUnpassable = true
        break
      case F.UNMOVEABLE:
        thing.isUnmoveable = true
        break
      case F.BLOCK_MISSILE:
        thing.blockMissile = true
        break
      case F.BLOCK_PATHFINDER:
        thing.blockPathfind = true
        break
      case F.PICKUPABLE:
        thing.pickupable = true
        break
      case F.HANGABLE:
        thing.hangable = true
        break
      case F.VERTICAL:
        thing.isVertical = true
        break
      case F.HORIZONTAL:
        thing.isHorizontal = true
        break
      case F.ROTATABLE:
        thing.rotatable = true
        break
      case F.HAS_LIGHT:
        thing.hasLight = true
        thing.lightLevel = reader.readUint16()
        thing.lightColor = reader.readUint16()
        break
      case F.FLOOR_CHANGE:
        thing.floorChange = true
        break
      case F.HAS_OFFSET:
        thing.hasOffset = true
        thing.offsetX = reader.readInt16()
        thing.offsetY = reader.readInt16()
        break
      case F.HAS_ELEVATION:
        thing.hasElevation = true
        thing.elevation = reader.readUint16()
        break
      case F.LYING_OBJECT:
        thing.isLyingObject = true
        break
      case F.ANIMATE_ALWAYS:
        thing.animateAlways = true
        break
      case F.MINI_MAP:
        thing.miniMap = true
        thing.miniMapColor = reader.readUint16()
        break
      case F.LENS_HELP:
        thing.isLensHelp = true
        thing.lensHelp = reader.readUint16()
        break
      case F.FULL_GROUND:
        thing.isFullGround = true
        break
      default:
        throw new Error(
          `Unknown flag 0x${flag.toString(16)} (previous: 0x${previousFlag.toString(16)}) ` +
            `for ${thing.category} id ${thing.id}`
        )
    }
  }
}

// ---------------------------------------------------------------------------
// Version 4: Clients 7.80 - 8.54
// ---------------------------------------------------------------------------

function readPropertiesV4(reader: BinaryReader, thing: ThingType): void {
  const F = MetadataFlags4
  let flag = 0

  while (flag < LAST_FLAG) {
    const previousFlag = flag
    flag = reader.readUint8()
    if (flag === LAST_FLAG) return

    switch (flag) {
      case F.GROUND:
        thing.isGround = true
        thing.groundSpeed = reader.readUint16()
        break
      case F.GROUND_BORDER:
        thing.isGroundBorder = true
        break
      case F.ON_BOTTOM:
        thing.isOnBottom = true
        break
      case F.ON_TOP:
        thing.isOnTop = true
        break
      case F.CONTAINER:
        thing.isContainer = true
        break
      case F.STACKABLE:
        thing.stackable = true
        break
      case F.FORCE_USE:
        thing.forceUse = true
        break
      case F.MULTI_USE:
        thing.multiUse = true
        break
      case F.HAS_CHARGES:
        thing.hasCharges = true
        break
      case F.WRITABLE:
        thing.writable = true
        thing.maxReadWriteChars = reader.readUint16()
        break
      case F.WRITABLE_ONCE:
        thing.writableOnce = true
        thing.maxReadChars = reader.readUint16()
        break
      case F.FLUID_CONTAINER:
        thing.isFluidContainer = true
        break
      case F.FLUID:
        thing.isFluid = true
        break
      case F.UNPASSABLE:
        thing.isUnpassable = true
        break
      case F.UNMOVEABLE:
        thing.isUnmoveable = true
        break
      case F.BLOCK_MISSILE:
        thing.blockMissile = true
        break
      case F.BLOCK_PATHFIND:
        thing.blockPathfind = true
        break
      case F.PICKUPABLE:
        thing.pickupable = true
        break
      case F.HANGABLE:
        thing.hangable = true
        break
      case F.VERTICAL:
        thing.isVertical = true
        break
      case F.HORIZONTAL:
        thing.isHorizontal = true
        break
      case F.ROTATABLE:
        thing.rotatable = true
        break
      case F.HAS_LIGHT:
        thing.hasLight = true
        thing.lightLevel = reader.readUint16()
        thing.lightColor = reader.readUint16()
        break
      case F.DONT_HIDE:
        thing.dontHide = true
        break
      case F.FLOOR_CHANGE:
        thing.floorChange = true
        break
      case F.HAS_OFFSET:
        thing.hasOffset = true
        thing.offsetX = reader.readInt16()
        thing.offsetY = reader.readInt16()
        break
      case F.HAS_ELEVATION:
        thing.hasElevation = true
        thing.elevation = reader.readUint16()
        break
      case F.LYING_OBJECT:
        thing.isLyingObject = true
        break
      case F.ANIMATE_ALWAYS:
        thing.animateAlways = true
        break
      case F.MINI_MAP:
        thing.miniMap = true
        thing.miniMapColor = reader.readUint16()
        break
      case F.LENS_HELP:
        thing.isLensHelp = true
        thing.lensHelp = reader.readUint16()
        break
      case F.FULL_GROUND:
        thing.isFullGround = true
        break
      case F.IGNORE_LOOK:
        thing.ignoreLook = true
        break
      case F.WRAPPABLE:
        thing.wrappable = true
        break
      case F.UNWRAPPABLE:
        thing.unwrappable = true
        break
      case F.HAS_BONES:
        thing.hasBones = true
        thing.bonesOffsetX[Direction.NORTH] = reader.readInt16()
        thing.bonesOffsetY[Direction.NORTH] = reader.readInt16()
        thing.bonesOffsetX[Direction.SOUTH] = reader.readInt16()
        thing.bonesOffsetY[Direction.SOUTH] = reader.readInt16()
        thing.bonesOffsetX[Direction.EAST] = reader.readInt16()
        thing.bonesOffsetY[Direction.EAST] = reader.readInt16()
        thing.bonesOffsetX[Direction.WEST] = reader.readInt16()
        thing.bonesOffsetY[Direction.WEST] = reader.readInt16()
        break
      default:
        throw new Error(
          `Unknown flag 0x${flag.toString(16)} (previous: 0x${previousFlag.toString(16)}) ` +
            `for ${thing.category} id ${thing.id}`
        )
    }
  }
}

// ---------------------------------------------------------------------------
// Version 5: Clients 8.60 - 9.86
// ---------------------------------------------------------------------------

function readPropertiesV5(reader: BinaryReader, thing: ThingType): void {
  const F = MetadataFlags5
  let flag = 0

  while (flag < LAST_FLAG) {
    const previousFlag = flag
    flag = reader.readUint8()
    if (flag === LAST_FLAG) return

    switch (flag) {
      case F.GROUND:
        thing.isGround = true
        thing.groundSpeed = reader.readUint16()
        break
      case F.GROUND_BORDER:
        thing.isGroundBorder = true
        break
      case F.ON_BOTTOM:
        thing.isOnBottom = true
        break
      case F.ON_TOP:
        thing.isOnTop = true
        break
      case F.CONTAINER:
        thing.isContainer = true
        break
      case F.STACKABLE:
        thing.stackable = true
        break
      case F.FORCE_USE:
        thing.forceUse = true
        break
      case F.MULTI_USE:
        thing.multiUse = true
        break
      case F.WRITABLE:
        thing.writable = true
        thing.maxReadWriteChars = reader.readUint16()
        break
      case F.WRITABLE_ONCE:
        thing.writableOnce = true
        thing.maxReadChars = reader.readUint16()
        break
      case F.FLUID_CONTAINER:
        thing.isFluidContainer = true
        break
      case F.FLUID:
        thing.isFluid = true
        break
      case F.UNPASSABLE:
        thing.isUnpassable = true
        break
      case F.UNMOVEABLE:
        thing.isUnmoveable = true
        break
      case F.BLOCK_MISSILE:
        thing.blockMissile = true
        break
      case F.BLOCK_PATHFIND:
        thing.blockPathfind = true
        break
      case F.PICKUPABLE:
        thing.pickupable = true
        break
      case F.HANGABLE:
        thing.hangable = true
        break
      case F.VERTICAL:
        thing.isVertical = true
        break
      case F.HORIZONTAL:
        thing.isHorizontal = true
        break
      case F.ROTATABLE:
        thing.rotatable = true
        break
      case F.HAS_LIGHT:
        thing.hasLight = true
        thing.lightLevel = reader.readUint16()
        thing.lightColor = reader.readUint16()
        break
      case F.DONT_HIDE:
        thing.dontHide = true
        break
      case F.TRANSLUCENT:
        thing.isTranslucent = true
        break
      case F.HAS_OFFSET:
        thing.hasOffset = true
        thing.offsetX = reader.readInt16()
        thing.offsetY = reader.readInt16()
        break
      case F.HAS_ELEVATION:
        thing.hasElevation = true
        thing.elevation = reader.readUint16()
        break
      case F.LYING_OBJECT:
        thing.isLyingObject = true
        break
      case F.ANIMATE_ALWAYS:
        thing.animateAlways = true
        break
      case F.MINI_MAP:
        thing.miniMap = true
        thing.miniMapColor = reader.readUint16()
        break
      case F.LENS_HELP:
        thing.isLensHelp = true
        thing.lensHelp = reader.readUint16()
        break
      case F.FULL_GROUND:
        thing.isFullGround = true
        break
      case F.IGNORE_LOOK:
        thing.ignoreLook = true
        break
      case F.CLOTH:
        thing.cloth = true
        thing.clothSlot = reader.readUint16()
        break
      case F.MARKET_ITEM:
        thing.isMarketItem = true
        thing.marketCategory = reader.readUint16()
        thing.marketTradeAs = reader.readUint16()
        thing.marketShowAs = reader.readUint16()
        {
          const nameLength = reader.readUint16()
          thing.marketName = reader.readMultiByte(nameLength, MetadataFlags5.STRING_CHARSET)
        }
        thing.marketRestrictProfession = reader.readUint16()
        thing.marketRestrictLevel = reader.readUint16()
        break
      case F.HAS_BONES:
        thing.hasBones = true
        thing.bonesOffsetX[Direction.NORTH] = reader.readInt16()
        thing.bonesOffsetY[Direction.NORTH] = reader.readInt16()
        thing.bonesOffsetX[Direction.SOUTH] = reader.readInt16()
        thing.bonesOffsetY[Direction.SOUTH] = reader.readInt16()
        thing.bonesOffsetX[Direction.EAST] = reader.readInt16()
        thing.bonesOffsetY[Direction.EAST] = reader.readInt16()
        thing.bonesOffsetX[Direction.WEST] = reader.readInt16()
        thing.bonesOffsetY[Direction.WEST] = reader.readInt16()
        break
      default:
        throw new Error(
          `Unknown flag 0x${flag.toString(16)} (previous: 0x${previousFlag.toString(16)}) ` +
            `for ${thing.category} id ${thing.id}`
        )
    }
  }
}

// ---------------------------------------------------------------------------
// Version 6: Clients 10.10 - 10.56+
// ---------------------------------------------------------------------------

function readPropertiesV6(reader: BinaryReader, thing: ThingType): void {
  const F = MetadataFlags6
  let flag = 0

  while (flag < LAST_FLAG) {
    const previousFlag = flag
    flag = reader.readUint8()
    if (flag === LAST_FLAG) return

    switch (flag) {
      case F.GROUND:
        thing.isGround = true
        thing.groundSpeed = reader.readUint16()
        break
      case F.GROUND_BORDER:
        thing.isGroundBorder = true
        break
      case F.ON_BOTTOM:
        thing.isOnBottom = true
        break
      case F.ON_TOP:
        thing.isOnTop = true
        break
      case F.CONTAINER:
        thing.isContainer = true
        break
      case F.STACKABLE:
        thing.stackable = true
        break
      case F.FORCE_USE:
        thing.forceUse = true
        break
      case F.MULTI_USE:
        thing.multiUse = true
        break
      case F.WRITABLE:
        thing.writable = true
        thing.maxReadWriteChars = reader.readUint16()
        break
      case F.WRITABLE_ONCE:
        thing.writableOnce = true
        thing.maxReadChars = reader.readUint16()
        break
      case F.FLUID_CONTAINER:
        thing.isFluidContainer = true
        break
      case F.FLUID:
        thing.isFluid = true
        break
      case F.UNPASSABLE:
        thing.isUnpassable = true
        break
      case F.UNMOVEABLE:
        thing.isUnmoveable = true
        break
      case F.BLOCK_MISSILE:
        thing.blockMissile = true
        break
      case F.BLOCK_PATHFIND:
        thing.blockPathfind = true
        break
      case F.NO_MOVE_ANIMATION:
        thing.noMoveAnimation = true
        break
      case F.PICKUPABLE:
        thing.pickupable = true
        break
      case F.HANGABLE:
        thing.hangable = true
        break
      case F.VERTICAL:
        thing.isVertical = true
        break
      case F.HORIZONTAL:
        thing.isHorizontal = true
        break
      case F.ROTATABLE:
        thing.rotatable = true
        break
      case F.HAS_LIGHT:
        thing.hasLight = true
        thing.lightLevel = reader.readUint16()
        thing.lightColor = reader.readUint16()
        break
      case F.DONT_HIDE:
        thing.dontHide = true
        break
      case F.TRANSLUCENT:
        thing.isTranslucent = true
        break
      case F.HAS_OFFSET:
        thing.hasOffset = true
        thing.offsetX = reader.readInt16()
        thing.offsetY = reader.readInt16()
        break
      case F.HAS_ELEVATION:
        thing.hasElevation = true
        thing.elevation = reader.readUint16()
        break
      case F.LYING_OBJECT:
        thing.isLyingObject = true
        break
      case F.ANIMATE_ALWAYS:
        thing.animateAlways = true
        break
      case F.MINI_MAP:
        thing.miniMap = true
        thing.miniMapColor = reader.readUint16()
        break
      case F.LENS_HELP:
        thing.isLensHelp = true
        thing.lensHelp = reader.readUint16()
        break
      case F.FULL_GROUND:
        thing.isFullGround = true
        break
      case F.IGNORE_LOOK:
        thing.ignoreLook = true
        break
      case F.CLOTH:
        thing.cloth = true
        thing.clothSlot = reader.readUint16()
        break
      case F.MARKET_ITEM:
        thing.isMarketItem = true
        thing.marketCategory = reader.readUint16()
        thing.marketTradeAs = reader.readUint16()
        thing.marketShowAs = reader.readUint16()
        {
          const nameLength = reader.readUint16()
          thing.marketName = reader.readMultiByte(nameLength, MetadataFlags6.STRING_CHARSET)
        }
        thing.marketRestrictProfession = reader.readUint16()
        thing.marketRestrictLevel = reader.readUint16()
        break
      case F.DEFAULT_ACTION:
        thing.hasDefaultAction = true
        thing.defaultAction = reader.readUint16()
        break
      case F.WRAPPABLE:
        thing.wrappable = true
        break
      case F.UNWRAPPABLE:
        thing.unwrappable = true
        break
      case F.TOP_EFFECT:
        thing.topEffect = true
        break
      case F.USABLE:
        thing.usable = true
        break
      case F.HAS_BONES:
        thing.hasBones = true
        thing.bonesOffsetX[Direction.NORTH] = reader.readInt16()
        thing.bonesOffsetY[Direction.NORTH] = reader.readInt16()
        thing.bonesOffsetX[Direction.SOUTH] = reader.readInt16()
        thing.bonesOffsetY[Direction.SOUTH] = reader.readInt16()
        thing.bonesOffsetX[Direction.EAST] = reader.readInt16()
        thing.bonesOffsetY[Direction.EAST] = reader.readInt16()
        thing.bonesOffsetX[Direction.WEST] = reader.readInt16()
        thing.bonesOffsetY[Direction.WEST] = reader.readInt16()
        break
      default:
        throw new Error(
          `Unknown flag 0x${flag.toString(16)} (previous: 0x${previousFlag.toString(16)}) ` +
            `for ${thing.category} id ${thing.id}`
        )
    }
  }
}
