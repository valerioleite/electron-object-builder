/**
 * OTB synchronization service.
 * Synchronizes flags and attributes between ThingType (tibia.dat) and ServerItem (items.otb).
 *
 * This is the single source of truth for all flag mappings between DAT properties
 * and OTB properties. Mirrors ItemEditor behavior.
 *
 * Ported from legacy AS3: otlib/items/OtbSync.as
 */

import {
  type ThingType,
  type ServerItem,
  createServerItem,
  FrameGroupType,
  ServerItemType,
  TileStackOrder
} from '../../types'
import { type SpritePixelProvider, computeSpriteHash } from './sprite-hash'

/**
 * Updates a ServerItem's flags and attributes from a ThingType.
 * Call this when "Reload Attributes" is used.
 *
 * This mirrors ItemEditor's ReloadItem behavior.
 * NOTE: Type is NOT synced by default - only flags.
 *
 * @param serverItem The server item to update
 * @param thingType The thing type with current flag values
 * @param syncType If true, also sync type. Use for new items only.
 * @param clientVersion The client version (e.g. 860, 1098). Used for flag filtering.
 * @param getCompressedPixels Function to retrieve compressed sprite pixels by ID (optional)
 * @param transparent Whether sprites use transparency mode (for hash computation)
 */
export function syncFromThingType(
  serverItem: ServerItem,
  thingType: ThingType,
  syncType = false,
  clientVersion = 0,
  getCompressedPixels?: SpritePixelProvider,
  transparent = false
): void {
  // ---- TYPE (only sync when creating new items) ----
  if (syncType) {
    if (thingType.isGround) {
      serverItem.type = ServerItemType.GROUND
    } else if (thingType.isContainer) {
      serverItem.type = ServerItemType.CONTAINER
    } else if (thingType.isFluidContainer) {
      serverItem.type = ServerItemType.FLUID
    } else if (thingType.isFluid) {
      serverItem.type = ServerItemType.SPLASH
    } else {
      serverItem.type = ServerItemType.NONE
    }
  }

  // ---- SPRITE HASH (ItemEditor parity) ----
  if (getCompressedPixels && serverItem.type !== ServerItemType.DEPRECATED) {
    serverItem.spriteHash = computeSpriteHash(thingType, getCompressedPixels, transparent)
    serverItem.spriteAssigned = true
  }

  // ---- FLAGS (boolean properties stored as bits in OTB) ----
  serverItem.unpassable = thingType.isUnpassable
  serverItem.blockMissiles = thingType.blockMissile
  serverItem.blockPathfinder = thingType.blockPathfind
  serverItem.hasElevation = thingType.hasElevation
  serverItem.multiUse = thingType.multiUse
  serverItem.pickupable = thingType.pickupable
  serverItem.movable = !thingType.isUnmoveable // Note: inverted!
  serverItem.stackable = thingType.stackable
  serverItem.readable =
    thingType.writable ||
    thingType.writableOnce ||
    (thingType.isLensHelp && thingType.lensHelp === 1112)
  serverItem.rotatable = thingType.rotatable
  serverItem.hangable = thingType.hangable
  serverItem.hookSouth = thingType.isVertical
  serverItem.hookEast = thingType.isHorizontal
  serverItem.ignoreLook = thingType.ignoreLook
  serverItem.allowDistanceRead = false // Not stored in DAT

  // ---- VERSION-SPECIFIC FLAG FILTERING (ItemEditor Parity) ----

  // ForceUse and FullGround: ItemEditor ignores these for versions < 10.10.
  // clientVersion 1010 means 10.10
  if (clientVersion >= 1010) {
    serverItem.forceUse = thingType.forceUse
    serverItem.fullGround = thingType.isFullGround
  } else {
    serverItem.forceUse = false
    serverItem.fullGround = false
  }

  // HasCharges: ItemEditor ignores this in ALL plugins. Always false.
  serverItem.hasCharges = false

  // IsAnimation: Based on frames > 1, NOT the AnimateAlways flag.
  const group = thingType.frameGroups[FrameGroupType.DEFAULT]
  serverItem.isAnimation = group != null && group.frames > 1

  // ---- ATTRIBUTES (additional data with values) ----

  // Light
  serverItem.lightLevel = thingType.lightLevel
  serverItem.lightColor = thingType.lightColor

  // Ground speed (only for ground items)
  if (thingType.isGround) {
    serverItem.groundSpeed = thingType.groundSpeed
  }

  // Minimap color
  serverItem.minimapColor = thingType.miniMapColor

  // Readable chars
  serverItem.maxReadWriteChars = thingType.writable ? thingType.maxReadWriteChars : 0
  serverItem.maxReadChars = thingType.writableOnce ? thingType.maxReadChars : 0

  // Stack order (tile rendering order)
  if (thingType.isGroundBorder) {
    serverItem.stackOrder = TileStackOrder.BORDER
    serverItem.hasStackOrder = true
  } else if (thingType.isOnBottom) {
    serverItem.stackOrder = TileStackOrder.BOTTOM
    serverItem.hasStackOrder = true
  } else if (thingType.isOnTop) {
    serverItem.stackOrder = TileStackOrder.TOP
    serverItem.hasStackOrder = true
  } else {
    serverItem.stackOrder = TileStackOrder.NONE
    serverItem.hasStackOrder = false
  }

  // Name (ItemEditor maps marketName -> OTB name attribute)
  if (thingType.marketName && thingType.marketName.length > 0) {
    serverItem.name = thingType.marketName
  }

  // Trade As
  if (thingType.marketTradeAs !== 0) {
    serverItem.tradeAs = thingType.marketTradeAs
  }
}

/**
 * Creates a new ServerItem from a ThingType.
 * Used when creating missing items in OTB.
 * For new items, type IS synced from ThingType.
 *
 * @param thingType The thing type to create from
 * @param serverId The server ID to assign
 * @param clientVersion The client version for flag filtering
 * @param getCompressedPixels Function to retrieve compressed sprite pixels by ID (optional)
 * @param transparent Whether sprites use transparency mode
 * @returns A new ServerItem with synced flags and type
 */
export function createFromThingType(
  thingType: ThingType,
  serverId: number,
  clientVersion = 0,
  getCompressedPixels?: SpritePixelProvider,
  transparent = false
): ServerItem {
  const item = createServerItem()
  item.id = serverId
  item.clientId = thingType.id

  // For NEW items, sync type too
  syncFromThingType(item, thingType, true, clientVersion, getCompressedPixels, transparent)

  return item
}

/**
 * Checks if a ServerItem's flags match a ThingType's flags.
 * Only checks boolean flags (not value attributes like lightLevel).
 * Used to determine if an item needs reloading.
 *
 * @param serverItem The server item
 * @param thingType The thing type
 * @returns true if all flags match
 */
export function flagsMatch(serverItem: ServerItem, thingType: ThingType): boolean {
  // Type check
  let expectedType: number = ServerItemType.NONE
  if (thingType.isGround) expectedType = ServerItemType.GROUND
  else if (thingType.isContainer) expectedType = ServerItemType.CONTAINER
  else if (thingType.isFluidContainer) expectedType = ServerItemType.FLUID
  else if (thingType.isFluid) expectedType = ServerItemType.SPLASH

  if (serverItem.type !== expectedType) return false

  // Flag checks - matching syncFromThingType logic
  if (serverItem.unpassable !== thingType.isUnpassable) return false
  if (serverItem.blockMissiles !== thingType.blockMissile) return false
  if (serverItem.blockPathfinder !== thingType.blockPathfind) return false
  if (serverItem.hasElevation !== thingType.hasElevation) return false
  if (serverItem.multiUse !== thingType.multiUse) return false
  if (serverItem.pickupable !== thingType.pickupable) return false
  if (serverItem.movable !== !thingType.isUnmoveable) return false
  if (serverItem.stackable !== thingType.stackable) return false

  const expectedReadable =
    thingType.writable ||
    thingType.writableOnce ||
    (thingType.isLensHelp && thingType.lensHelp === 1112)
  if (serverItem.readable !== expectedReadable) return false

  // Check read char lengths if readable
  if (thingType.writable && serverItem.maxReadWriteChars !== thingType.maxReadWriteChars)
    return false
  if (thingType.writableOnce && serverItem.maxReadChars !== thingType.maxReadChars) return false

  if (serverItem.rotatable !== thingType.rotatable) return false
  if (serverItem.hangable !== thingType.hangable) return false
  if (serverItem.hookEast !== thingType.isHorizontal) return false
  if (serverItem.hookSouth !== thingType.isVertical) return false
  if (serverItem.ignoreLook !== thingType.ignoreLook) return false

  // HasCharges is always false in OTB
  if (serverItem.hasCharges !== false) return false

  // IsAnimation derived from frames > 1
  const group = thingType.frameGroups[FrameGroupType.DEFAULT]
  const expectedAnim = group != null && group.frames > 1
  if (serverItem.isAnimation !== expectedAnim) return false

  // Stack order
  const expectedHasStackOrder =
    thingType.isGroundBorder || thingType.isOnBottom || thingType.isOnTop
  if (serverItem.hasStackOrder !== expectedHasStackOrder) return false

  return true
}
