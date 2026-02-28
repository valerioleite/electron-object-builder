/**
 * OBD generic property flags - used by OBD V2 and V3 formats.
 * These form a superset of all DAT MetadataFlags versions, with fixed values
 * independent of client version.
 *
 * Ported from legacy AS3: otlib/things/ThingSerializer.as (writeProperties/readProperties)
 */

export const OBDPropertyFlag = {
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
  HOOK_SOUTH: 0x13, // maps to isVertical
  HOOK_EAST: 0x14, // maps to isHorizontal
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

  // Extended flags (higher range)
  HAS_CHARGES: 0xfc,
  FLOOR_CHANGE: 0xfd,
  USABLE: 0xfe,

  LAST_FLAG: 0xff
} as const

/** Charset for market name strings in OBD format. */
export const OBD_STRING_CHARSET = 'iso-8859-1'
