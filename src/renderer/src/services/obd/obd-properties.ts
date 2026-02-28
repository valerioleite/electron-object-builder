/**
 * Generic OBD property reader/writer for V2 and V3 formats.
 * Uses fixed flag values (OBDPropertyFlag) independent of client version.
 *
 * Ported from legacy AS3: otlib/things/ThingSerializer.as
 * (writeProperties/readProperties - the version-agnostic methods)
 */

import { BinaryReader, BinaryWriter } from '../dat/binary-stream'
import type { ThingType } from '../../types'
import { ThingCategory as TC } from '../../types'
import { OBDPropertyFlag as F, OBD_STRING_CHARSET } from './obd-flags'

// ---------------------------------------------------------------------------
// Read generic OBD properties (V2/V3)
// ---------------------------------------------------------------------------

export function readObdProperties(reader: BinaryReader, thing: ThingType): void {
  while (true) {
    const flag = reader.readUint8()
    if (flag === F.LAST_FLAG) return

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
      case F.HOOK_SOUTH:
        thing.isVertical = true
        break
      case F.HOOK_EAST:
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
          thing.marketName = reader.readMultiByte(nameLength, OBD_STRING_CHARSET)
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
      case F.HAS_CHARGES:
        thing.hasCharges = true
        break
      case F.FLOOR_CHANGE:
        thing.floorChange = true
        break
      case F.USABLE:
        thing.usable = true
        break
      default:
        throw new Error(`Unknown OBD property flag 0x${flag.toString(16)}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Write generic OBD properties (V2/V3)
// ---------------------------------------------------------------------------

export function writeObdProperties(writer: BinaryWriter, thing: ThingType): void {
  // Ground/GroundBorder/OnBottom/OnTop are mutually exclusive
  if (thing.isGround) {
    writer.writeUint8(F.GROUND)
    writer.writeUint16(thing.groundSpeed)
  } else if (thing.isGroundBorder) {
    writer.writeUint8(F.GROUND_BORDER)
  } else if (thing.isOnBottom) {
    writer.writeUint8(F.ON_BOTTOM)
  } else if (thing.isOnTop) {
    writer.writeUint8(F.ON_TOP)
  }

  if (thing.isContainer) writer.writeUint8(F.CONTAINER)
  if (thing.stackable) writer.writeUint8(F.STACKABLE)
  if (thing.forceUse) writer.writeUint8(F.FORCE_USE)
  if (thing.multiUse) writer.writeUint8(F.MULTI_USE)

  if (thing.writable) {
    writer.writeUint8(F.WRITABLE)
    writer.writeUint16(thing.maxReadWriteChars)
  }
  if (thing.writableOnce) {
    writer.writeUint8(F.WRITABLE_ONCE)
    writer.writeUint16(thing.maxReadChars)
  }

  if (thing.isFluidContainer) writer.writeUint8(F.FLUID_CONTAINER)
  if (thing.isFluid) writer.writeUint8(F.FLUID)
  if (thing.isUnpassable) writer.writeUint8(F.UNPASSABLE)
  if (thing.isUnmoveable) writer.writeUint8(F.UNMOVEABLE)
  if (thing.blockMissile) writer.writeUint8(F.BLOCK_MISSILE)
  if (thing.blockPathfind) writer.writeUint8(F.BLOCK_PATHFIND)
  if (thing.noMoveAnimation) writer.writeUint8(F.NO_MOVE_ANIMATION)
  if (thing.pickupable) writer.writeUint8(F.PICKUPABLE)
  if (thing.hangable) writer.writeUint8(F.HANGABLE)
  if (thing.isVertical) writer.writeUint8(F.HOOK_SOUTH)
  if (thing.isHorizontal) writer.writeUint8(F.HOOK_EAST)
  if (thing.rotatable) writer.writeUint8(F.ROTATABLE)

  if (thing.hasLight) {
    writer.writeUint8(F.HAS_LIGHT)
    writer.writeUint16(thing.lightLevel)
    writer.writeUint16(thing.lightColor)
  }

  if (thing.dontHide) writer.writeUint8(F.DONT_HIDE)
  if (thing.isTranslucent) writer.writeUint8(F.TRANSLUCENT)

  if (thing.hasOffset) {
    writer.writeUint8(F.HAS_OFFSET)
    writer.writeInt16(thing.offsetX)
    writer.writeInt16(thing.offsetY)
  }

  if (thing.hasElevation) {
    writer.writeUint8(F.HAS_ELEVATION)
    writer.writeUint16(thing.elevation)
  }

  if (thing.isLyingObject) writer.writeUint8(F.LYING_OBJECT)
  if (thing.animateAlways) writer.writeUint8(F.ANIMATE_ALWAYS)

  if (thing.miniMap) {
    writer.writeUint8(F.MINI_MAP)
    writer.writeUint16(thing.miniMapColor)
  }

  if (thing.isLensHelp) {
    writer.writeUint8(F.LENS_HELP)
    writer.writeUint16(thing.lensHelp)
  }

  if (thing.isFullGround) writer.writeUint8(F.FULL_GROUND)
  if (thing.ignoreLook) writer.writeUint8(F.IGNORE_LOOK)

  if (thing.cloth) {
    writer.writeUint8(F.CLOTH)
    writer.writeUint16(thing.clothSlot)
  }

  if (thing.isMarketItem) {
    writer.writeUint8(F.MARKET_ITEM)
    writer.writeUint16(thing.marketCategory)
    writer.writeUint16(thing.marketTradeAs)
    writer.writeUint16(thing.marketShowAs)
    writer.writeUint16(thing.marketName.length)
    writer.writeMultiByte(thing.marketName, OBD_STRING_CHARSET)
    writer.writeUint16(thing.marketRestrictProfession)
    writer.writeUint16(thing.marketRestrictLevel)
  }

  if (thing.hasDefaultAction) {
    writer.writeUint8(F.DEFAULT_ACTION)
    writer.writeUint16(thing.defaultAction)
  }

  if (thing.wrappable) writer.writeUint8(F.WRAPPABLE)
  if (thing.unwrappable) writer.writeUint8(F.UNWRAPPABLE)
  if (thing.topEffect && thing.category === TC.EFFECT) writer.writeUint8(F.TOP_EFFECT)
  if (thing.hasCharges) writer.writeUint8(F.HAS_CHARGES)
  if (thing.floorChange) writer.writeUint8(F.FLOOR_CHANGE)
  if (thing.usable) writer.writeUint8(F.USABLE)

  writer.writeUint8(F.LAST_FLAG)
}

// ---------------------------------------------------------------------------
// Version-specific property selection for OBD V1
// ---------------------------------------------------------------------------

/**
 * Get the version-specific property reader/writer selector for OBD V1.
 * OBD V1 uses the same property format as DAT files for the given client version.
 */
export function getObdV1PropertyVersion(clientVersion: number): number {
  // Version ranges:
  // <= 730: V1, <= 750: V2, <= 772: V3, <= 854: V4, <= 986: V5, else: V6
  if (clientVersion <= 730) return 1
  if (clientVersion <= 750) return 2
  if (clientVersion <= 772) return 3
  if (clientVersion <= 854) return 4
  if (clientVersion <= 986) return 5
  return 6
}

/**
 * Gets the correct DAT-compatible version number for property reader/writer selection.
 * Maps OBD V1 client version ranges to the DAT reader/writer version thresholds.
 */
export function getDatVersionFromClientVersion(clientVersion: number): number {
  if (clientVersion <= 730) return 710
  if (clientVersion <= 750) return 740
  if (clientVersion <= 772) return 755
  if (clientVersion <= 854) return 780
  if (clientVersion <= 986) return 860
  return 1010
}
