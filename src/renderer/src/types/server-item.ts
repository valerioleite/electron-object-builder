/**
 * Server item types for OpenTibia OTB/XML handling.
 * Ported from legacy AS3: otlib/items/ServerItem.as, ServerItemFlag.as,
 * ServerItemType.as, ServerItemGroup.as, ServerItemAttribute.as,
 * TileStackOrder.as, ItemAttribute.as
 */

// ---------------------------------------------------------------------------
// ServerItemType
// ---------------------------------------------------------------------------

export const ServerItemType = {
  NONE: 0,
  GROUND: 1,
  CONTAINER: 2,
  FLUID: 3,
  SPLASH: 4,
  DEPRECATED: 5
} as const

export type ServerItemType = (typeof ServerItemType)[keyof typeof ServerItemType]

// ---------------------------------------------------------------------------
// ServerItemGroup
// ---------------------------------------------------------------------------

export const ServerItemGroup = {
  NONE: 0,
  GROUND: 1,
  CONTAINER: 2,
  WEAPON: 3,
  AMMUNITION: 4,
  ARMOR: 5,
  CHANGES: 6,
  TELEPORT: 7,
  MAGIC_FIELD: 8,
  WRITABLE: 9,
  KEY: 10,
  SPLASH: 11,
  FLUID: 12,
  DOOR: 13,
  DEPRECATED: 14
} as const

export type ServerItemGroup = (typeof ServerItemGroup)[keyof typeof ServerItemGroup]

// ---------------------------------------------------------------------------
// TileStackOrder
// ---------------------------------------------------------------------------

export const TileStackOrder = {
  NONE: 0,
  BORDER: 1,
  BOTTOM: 2,
  TOP: 3
} as const

export type TileStackOrder = (typeof TileStackOrder)[keyof typeof TileStackOrder]

// ---------------------------------------------------------------------------
// ServerItemFlag (bit flags for OTB format)
// ---------------------------------------------------------------------------

export const ServerItemFlag = {
  NONE: 0,
  UNPASSABLE: 1 << 0,
  BLOCK_MISSILES: 1 << 1,
  BLOCK_PATHFINDER: 1 << 2,
  HAS_ELEVATION: 1 << 3,
  MULTI_USE: 1 << 4,
  PICKUPABLE: 1 << 5,
  MOVABLE: 1 << 6,
  STACKABLE: 1 << 7,
  FLOOR_CHANGE_DOWN: 1 << 8,
  FLOOR_CHANGE_NORTH: 1 << 9,
  FLOOR_CHANGE_EAST: 1 << 10,
  FLOOR_CHANGE_SOUTH: 1 << 11,
  FLOOR_CHANGE_WEST: 1 << 12,
  STACK_ORDER: 1 << 13,
  READABLE: 1 << 14,
  ROTATABLE: 1 << 15,
  HANGABLE: 1 << 16,
  HOOK_EAST: 1 << 17,
  HOOK_SOUTH: 1 << 18,
  CAN_NOT_DECAY: 1 << 19,
  ALLOW_DISTANCE_READ: 1 << 20,
  UNUSED: 1 << 21,
  CLIENT_CHARGES: 1 << 22,
  IGNORE_LOOK: 1 << 23,
  IS_ANIMATION: 1 << 24,
  FULL_GROUND: 1 << 25,
  FORCE_USE: 1 << 26
} as const

// ---------------------------------------------------------------------------
// ServerItemAttribute (OTB binary attribute IDs)
// ---------------------------------------------------------------------------

export const ServerItemAttribute = {
  SERVER_ID: 0x10,
  CLIENT_ID: 0x11,
  NAME: 0x12,
  GROUND_SPEED: 0x14,
  SPRITE_HASH: 0x20,
  MINIMAP_COLOR: 0x21,
  MAX_READ_WRITE_CHARS: 0x22,
  MAX_READ_CHARS: 0x23,
  LIGHT: 0x2a,
  STACK_ORDER: 0x2b,
  TRADE_AS: 0x2d
} as const

// ---------------------------------------------------------------------------
// XmlAttributeValue (supports nested attributes from items.xml)
// ---------------------------------------------------------------------------

/**
 * Value stored in ServerItem.xmlAttributes.
 * Simple attributes are strings, nested attributes are string records.
 * Nested records may include a '_parentValue' key for Canary-style parent values.
 */
export type XmlAttributeValue = string | Record<string, string>

// ---------------------------------------------------------------------------
// ServerItem
// ---------------------------------------------------------------------------

export interface ServerItem {
  id: number
  clientId: number
  previousClientId: number
  type: ServerItemType
  stackOrder: TileStackOrder
  hasStackOrder: boolean
  name: string
  spriteHash: Uint8Array | null
  spriteAssigned: boolean
  isCustomCreated: boolean

  // OTB flags
  unpassable: boolean
  blockMissiles: boolean
  blockPathfinder: boolean
  hasElevation: boolean
  forceUse: boolean
  multiUse: boolean
  pickupable: boolean
  movable: boolean
  stackable: boolean
  readable: boolean
  rotatable: boolean
  hangable: boolean
  hookSouth: boolean
  hookEast: boolean
  hasCharges: boolean
  ignoreLook: boolean
  allowDistanceRead: boolean
  isAnimation: boolean
  fullGround: boolean

  // Numeric attributes
  groundSpeed: number
  lightLevel: number
  lightColor: number
  maxReadChars: number
  maxReadWriteChars: number
  minimapColor: number
  tradeAs: number

  // XML attributes from items.xml (name, article, plural, nested attributes, etc.)
  xmlAttributes: Record<string, XmlAttributeValue> | null
}

export function createServerItem(): ServerItem {
  return {
    id: 0,
    clientId: 0,
    previousClientId: 0,
    type: ServerItemType.NONE,
    stackOrder: TileStackOrder.NONE,
    hasStackOrder: false,
    name: '',
    spriteHash: null,
    spriteAssigned: false,
    isCustomCreated: false,

    unpassable: false,
    blockMissiles: false,
    blockPathfinder: false,
    hasElevation: false,
    forceUse: false,
    multiUse: false,
    pickupable: false,
    movable: true,
    stackable: false,
    readable: false,
    rotatable: false,
    hangable: false,
    hookSouth: false,
    hookEast: false,
    hasCharges: false,
    ignoreLook: false,
    allowDistanceRead: false,
    isAnimation: false,
    fullGround: false,

    groundSpeed: 0,
    lightLevel: 0,
    lightColor: 0,
    maxReadChars: 0,
    maxReadWriteChars: 0,
    minimapColor: 0,
    tradeAs: 0,

    xmlAttributes: null
  }
}

export function cloneServerItem(item: ServerItem): ServerItem {
  return {
    ...item,
    spriteHash: item.spriteHash ? new Uint8Array(item.spriteHash) : null,
    xmlAttributes: item.xmlAttributes ? cloneXmlAttributes(item.xmlAttributes) : null
  }
}

function cloneXmlAttributes(
  attrs: Record<string, XmlAttributeValue>
): Record<string, XmlAttributeValue> {
  const result: Record<string, XmlAttributeValue> = {}
  for (const [key, value] of Object.entries(attrs)) {
    result[key] = typeof value === 'string' ? value : { ...value }
  }
  return result
}

export function getServerItemFlags(item: ServerItem): number {
  let flags = 0
  if (item.unpassable) flags |= ServerItemFlag.UNPASSABLE
  if (item.blockMissiles) flags |= ServerItemFlag.BLOCK_MISSILES
  if (item.blockPathfinder) flags |= ServerItemFlag.BLOCK_PATHFINDER
  if (item.hasElevation) flags |= ServerItemFlag.HAS_ELEVATION
  if (item.forceUse) flags |= ServerItemFlag.FORCE_USE
  if (item.multiUse) flags |= ServerItemFlag.MULTI_USE
  if (item.pickupable) flags |= ServerItemFlag.PICKUPABLE
  if (item.movable) flags |= ServerItemFlag.MOVABLE
  if (item.stackable) flags |= ServerItemFlag.STACKABLE
  if (item.hasStackOrder) flags |= ServerItemFlag.STACK_ORDER
  if (item.readable) flags |= ServerItemFlag.READABLE
  if (item.rotatable) flags |= ServerItemFlag.ROTATABLE
  if (item.hangable) flags |= ServerItemFlag.HANGABLE
  if (item.hookSouth) flags |= ServerItemFlag.HOOK_SOUTH
  if (item.hookEast) flags |= ServerItemFlag.HOOK_EAST
  if (item.hasCharges) flags |= ServerItemFlag.CLIENT_CHARGES
  if (item.ignoreLook) flags |= ServerItemFlag.IGNORE_LOOK
  if (item.allowDistanceRead) flags |= ServerItemFlag.ALLOW_DISTANCE_READ
  if (item.isAnimation) flags |= ServerItemFlag.IS_ANIMATION
  if (item.fullGround) flags |= ServerItemFlag.FULL_GROUND
  return flags
}

export function setServerItemFlags(item: ServerItem, flags: number): void {
  item.unpassable = (flags & ServerItemFlag.UNPASSABLE) !== 0
  item.blockMissiles = (flags & ServerItemFlag.BLOCK_MISSILES) !== 0
  item.blockPathfinder = (flags & ServerItemFlag.BLOCK_PATHFINDER) !== 0
  item.hasElevation = (flags & ServerItemFlag.HAS_ELEVATION) !== 0
  item.forceUse = (flags & ServerItemFlag.FORCE_USE) !== 0
  item.multiUse = (flags & ServerItemFlag.MULTI_USE) !== 0
  item.pickupable = (flags & ServerItemFlag.PICKUPABLE) !== 0
  item.movable = (flags & ServerItemFlag.MOVABLE) !== 0
  item.stackable = (flags & ServerItemFlag.STACKABLE) !== 0
  item.hasStackOrder = (flags & ServerItemFlag.STACK_ORDER) !== 0
  item.readable = (flags & ServerItemFlag.READABLE) !== 0
  item.rotatable = (flags & ServerItemFlag.ROTATABLE) !== 0
  item.hangable = (flags & ServerItemFlag.HANGABLE) !== 0
  item.hookSouth = (flags & ServerItemFlag.HOOK_SOUTH) !== 0
  item.hookEast = (flags & ServerItemFlag.HOOK_EAST) !== 0
  item.hasCharges = (flags & ServerItemFlag.CLIENT_CHARGES) !== 0
  item.ignoreLook = (flags & ServerItemFlag.IGNORE_LOOK) !== 0
  item.allowDistanceRead = (flags & ServerItemFlag.ALLOW_DISTANCE_READ) !== 0
  item.isAnimation = (flags & ServerItemFlag.IS_ANIMATION) !== 0
  item.fullGround = (flags & ServerItemFlag.FULL_GROUND) !== 0
}

export function getServerItemGroup(type: ServerItemType): ServerItemGroup {
  switch (type) {
    case ServerItemType.GROUND:
      return ServerItemGroup.GROUND
    case ServerItemType.CONTAINER:
      return ServerItemGroup.CONTAINER
    case ServerItemType.FLUID:
      return ServerItemGroup.FLUID
    case ServerItemType.SPLASH:
      return ServerItemGroup.SPLASH
    case ServerItemType.DEPRECATED:
      return ServerItemGroup.DEPRECATED
    default:
      return ServerItemGroup.NONE
  }
}

// ---------------------------------------------------------------------------
// ItemAttribute (attribute definition schema from TFS XML configs)
// ---------------------------------------------------------------------------

export interface ItemAttribute {
  key: string
  type: 'string' | 'number' | 'boolean' | 'mixed'
  category: string
  placement: string | null
  order: number
  values: string[] | null
  attributes: ItemAttribute[] | null
}

export function createItemAttribute(
  key = '',
  type: ItemAttribute['type'] = 'string',
  category = 'General',
  values: string[] | null = null,
  placement: string | null = null,
  order = Number.MAX_SAFE_INTEGER
): ItemAttribute {
  return { key, type, category, placement, order, values, attributes: null }
}

export function cloneItemAttribute(attr: ItemAttribute): ItemAttribute {
  return {
    ...attr,
    values: attr.values ? attr.values.slice() : null,
    attributes: attr.attributes ? attr.attributes.map(cloneItemAttribute) : null
  }
}

// ---------------------------------------------------------------------------
// XML attribute helpers (for items.xml integration)
// ---------------------------------------------------------------------------

export function getXmlAttribute(item: ServerItem, key: string): XmlAttributeValue | undefined {
  return item.xmlAttributes?.[key]
}

export function getXmlAttributeString(item: ServerItem, key: string): string | null {
  const val = item.xmlAttributes?.[key]
  if (typeof val === 'string') return val
  return null
}

export function setXmlAttribute(item: ServerItem, key: string, value: XmlAttributeValue): void {
  if (!item.xmlAttributes) item.xmlAttributes = {}
  item.xmlAttributes[key] = value
}

export function hasXmlData(item: ServerItem): boolean {
  if (!item.xmlAttributes) return false
  return Object.keys(item.xmlAttributes).length > 0
}
