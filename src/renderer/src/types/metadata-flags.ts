/**
 * Metadata flag constants for each client version range.
 * These define the byte values used in the DAT binary format to identify each ThingType property.
 * Ported from legacy AS3: otlib/things/MetadataFlags1-6.as
 */

/** Common terminator flag for all versions */
export const LAST_FLAG = 0xff

// ---------------------------------------------------------------------------
// MetadataFlags1 - Client versions 7.10 - 7.30
// ---------------------------------------------------------------------------

export const MetadataFlags1 = {
  GROUND: 0x00,
  ON_BOTTOM: 0x01,
  ON_TOP: 0x02,
  CONTAINER: 0x03,
  STACKABLE: 0x04,
  MULTI_USE: 0x05,
  FORCE_USE: 0x06,
  WRITABLE: 0x07,
  WRITABLE_ONCE: 0x08,
  FLUID_CONTAINER: 0x09,
  FLUID: 0x0a,
  UNPASSABLE: 0x0b,
  UNMOVEABLE: 0x0c,
  BLOCK_MISSILE: 0x0d,
  BLOCK_PATHFINDER: 0x0e,
  PICKUPABLE: 0x0f,
  HAS_LIGHT: 0x10,
  FLOOR_CHANGE: 0x11,
  FULL_GROUND: 0x12,
  HAS_ELEVATION: 0x13,
  HAS_OFFSET: 0x14,
  MINI_MAP: 0x16,
  ROTATABLE: 0x17,
  LYING_OBJECT: 0x18,
  ANIMATE_ALWAYS: 0x19,
  LENS_HELP: 0x1a,
  WRAPPABLE: 0x24,
  UNWRAPPABLE: 0x25,
  TOP_EFFECT: 0x26,
  LAST_FLAG
} as const

// ---------------------------------------------------------------------------
// MetadataFlags2 - Client versions 7.40 - 7.50
// ---------------------------------------------------------------------------

export const MetadataFlags2 = {
  GROUND: 0x00,
  ON_BOTTOM: 0x01,
  ON_TOP: 0x02,
  CONTAINER: 0x03,
  STACKABLE: 0x04,
  MULTI_USE: 0x05,
  FORCE_USE: 0x06,
  WRITABLE: 0x07,
  WRITABLE_ONCE: 0x08,
  FLUID_CONTAINER: 0x09,
  FLUID: 0x0a,
  UNPASSABLE: 0x0b,
  UNMOVEABLE: 0x0c,
  BLOCK_MISSILE: 0x0d,
  BLOCK_PATHFINDER: 0x0e,
  PICKUPABLE: 0x0f,
  HAS_LIGHT: 0x10,
  FLOOR_CHANGE: 0x11,
  FULL_GROUND: 0x12,
  HAS_ELEVATION: 0x13,
  HAS_OFFSET: 0x14,
  MINI_MAP: 0x16,
  ROTATABLE: 0x17,
  LYING_OBJECT: 0x18,
  HANGABLE: 0x19,
  VERTICAL: 0x1a,
  HORIZONTAL: 0x1b,
  ANIMATE_ALWAYS: 0x1c,
  LENS_HELP: 0x1d,
  WRAPPABLE: 0x24,
  UNWRAPPABLE: 0x25,
  TOP_EFFECT: 0x26,
  LAST_FLAG
} as const

// ---------------------------------------------------------------------------
// MetadataFlags3 - Client versions 7.55 - 7.72
// ---------------------------------------------------------------------------

export const MetadataFlags3 = {
  GROUND: 0x00,
  GROUND_BORDER: 0x01,
  ON_BOTTOM: 0x02,
  ON_TOP: 0x03,
  CONTAINER: 0x04,
  STACKABLE: 0x05,
  FORCE_USE: 0x06,
  MULTI_USE: 0x07,
  WRITABLE: 0x08,
  WRITABLE_ONCE: 0x09,
  FLUID_CONTAINER: 0x0a,
  FLUID: 0x0b,
  UNPASSABLE: 0x0c,
  UNMOVEABLE: 0x0d,
  BLOCK_MISSILE: 0x0e,
  BLOCK_PATHFINDER: 0x0f,
  PICKUPABLE: 0x10,
  HANGABLE: 0x11,
  VERTICAL: 0x12,
  HORIZONTAL: 0x13,
  ROTATABLE: 0x14,
  HAS_LIGHT: 0x15,
  FLOOR_CHANGE: 0x17,
  HAS_OFFSET: 0x18,
  HAS_ELEVATION: 0x19,
  LYING_OBJECT: 0x1a,
  ANIMATE_ALWAYS: 0x1b,
  MINI_MAP: 0x1c,
  LENS_HELP: 0x1d,
  FULL_GROUND: 0x1e,
  LAST_FLAG
} as const

// ---------------------------------------------------------------------------
// MetadataFlags4 - Client versions 7.80 - 8.54
// ---------------------------------------------------------------------------

export const MetadataFlags4 = {
  GROUND: 0x00,
  GROUND_BORDER: 0x01,
  ON_BOTTOM: 0x02,
  ON_TOP: 0x03,
  CONTAINER: 0x04,
  STACKABLE: 0x05,
  FORCE_USE: 0x06,
  MULTI_USE: 0x07,
  HAS_CHARGES: 0x08,
  WRITABLE: 0x09,
  WRITABLE_ONCE: 0x0a,
  FLUID_CONTAINER: 0x0b,
  FLUID: 0x0c,
  UNPASSABLE: 0x0d,
  UNMOVEABLE: 0x0e,
  BLOCK_MISSILE: 0x0f,
  BLOCK_PATHFIND: 0x10,
  PICKUPABLE: 0x11,
  HANGABLE: 0x12,
  VERTICAL: 0x13,
  HORIZONTAL: 0x14,
  ROTATABLE: 0x15,
  HAS_LIGHT: 0x16,
  DONT_HIDE: 0x17,
  FLOOR_CHANGE: 0x18,
  HAS_OFFSET: 0x19,
  HAS_ELEVATION: 0x1a,
  LYING_OBJECT: 0x1b,
  ANIMATE_ALWAYS: 0x1c,
  MINI_MAP: 0x1d,
  LENS_HELP: 0x1e,
  FULL_GROUND: 0x1f,
  IGNORE_LOOK: 0x20,
  WRAPPABLE: 0x24,
  UNWRAPPABLE: 0x25,
  HAS_BONES: 0x27,
  LAST_FLAG
} as const

// ---------------------------------------------------------------------------
// MetadataFlags5 - Client versions 8.60 - 9.86
// ---------------------------------------------------------------------------

export const MetadataFlags5 = {
  GROUND: 0x00,
  GROUND_BORDER: 0x01,
  ON_BOTTOM: 0x02,
  ON_TOP: 0x03,
  CONTAINER: 0x04,
  STACKABLE: 0x05,
  FORCE_USE: 0x06,
  MULTI_USE: 0x07,
  WRITABLE: 0x08,
  WRITABLE_ONCE: 0x09,
  FLUID_CONTAINER: 0x0a,
  FLUID: 0x0b,
  UNPASSABLE: 0x0c,
  UNMOVEABLE: 0x0d,
  BLOCK_MISSILE: 0x0e,
  BLOCK_PATHFIND: 0x0f,
  PICKUPABLE: 0x10,
  HANGABLE: 0x11,
  VERTICAL: 0x12,
  HORIZONTAL: 0x13,
  ROTATABLE: 0x14,
  HAS_LIGHT: 0x15,
  DONT_HIDE: 0x16,
  TRANSLUCENT: 0x17,
  HAS_OFFSET: 0x18,
  HAS_ELEVATION: 0x19,
  LYING_OBJECT: 0x1a,
  ANIMATE_ALWAYS: 0x1b,
  MINI_MAP: 0x1c,
  LENS_HELP: 0x1d,
  FULL_GROUND: 0x1e,
  IGNORE_LOOK: 0x1f,
  CLOTH: 0x20,
  MARKET_ITEM: 0x21,
  HAS_BONES: 0x27,
  LAST_FLAG,
  STRING_CHARSET: 'iso-8859-1'
} as const

// ---------------------------------------------------------------------------
// MetadataFlags6 - Client versions 10.10 - 10.56+
// ---------------------------------------------------------------------------

export const MetadataFlags6 = {
  GROUND: 0x00,
  GROUND_BORDER: 0x01,
  ON_BOTTOM: 0x02,
  ON_TOP: 0x03,
  CONTAINER: 0x04,
  STACKABLE: 0x05,
  FORCE_USE: 0x06,
  MULTI_USE: 0x07,
  WRITABLE: 0x08,
  WRITABLE_ONCE: 0x09,
  FLUID_CONTAINER: 0x0a,
  FLUID: 0x0b,
  UNPASSABLE: 0x0c,
  UNMOVEABLE: 0x0d,
  BLOCK_MISSILE: 0x0e,
  BLOCK_PATHFIND: 0x0f,
  NO_MOVE_ANIMATION: 0x10,
  PICKUPABLE: 0x11,
  HANGABLE: 0x12,
  VERTICAL: 0x13,
  HORIZONTAL: 0x14,
  ROTATABLE: 0x15,
  HAS_LIGHT: 0x16,
  DONT_HIDE: 0x17,
  TRANSLUCENT: 0x18,
  HAS_OFFSET: 0x19,
  HAS_ELEVATION: 0x1a,
  LYING_OBJECT: 0x1b,
  ANIMATE_ALWAYS: 0x1c,
  MINI_MAP: 0x1d,
  LENS_HELP: 0x1e,
  FULL_GROUND: 0x1f,
  IGNORE_LOOK: 0x20,
  CLOTH: 0x21,
  MARKET_ITEM: 0x22,
  DEFAULT_ACTION: 0x23,
  WRAPPABLE: 0x24,
  UNWRAPPABLE: 0x25,
  TOP_EFFECT: 0x26,
  HAS_BONES: 0x27,
  USABLE: 0xfe,
  LAST_FLAG,
  STRING_CHARSET: 'iso-8859-1'
} as const

// ---------------------------------------------------------------------------
// MetadataFlags type union
// ---------------------------------------------------------------------------

export type MetadataFlags =
  | typeof MetadataFlags1
  | typeof MetadataFlags2
  | typeof MetadataFlags3
  | typeof MetadataFlags4
  | typeof MetadataFlags5
  | typeof MetadataFlags6

/**
 * Returns the appropriate MetadataFlags for a given client version.
 * Version ranges: 710-730=F1, 740-750=F2, 755-772=F3, 780-854=F4, 860-986=F5, 1010+=F6
 */
export function getMetadataFlagsForVersion(version: number): MetadataFlags {
  if (version < 740) return MetadataFlags1
  if (version < 755) return MetadataFlags2
  if (version < 780) return MetadataFlags3
  if (version < 860) return MetadataFlags4
  if (version < 1010) return MetadataFlags5
  return MetadataFlags6
}
