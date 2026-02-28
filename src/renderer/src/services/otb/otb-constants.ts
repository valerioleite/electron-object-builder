/**
 * Constants for the OTB (Open Tibia Binary) file format.
 * Ported from legacy AS3: otlib/items/SpecialChar.as, RootAttribute.as
 */

// ---------------------------------------------------------------------------
// Binary Tree special characters
// ---------------------------------------------------------------------------

export const SpecialChar = {
  NODE_START: 0xfe,
  NODE_END: 0xff,
  ESCAPE_CHAR: 0xfd
} as const

// ---------------------------------------------------------------------------
// Root node attribute types
// ---------------------------------------------------------------------------

export const RootAttribute = {
  VERSION: 0x01
} as const
