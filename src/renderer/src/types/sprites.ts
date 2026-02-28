/**
 * Sprite data types for OpenTibia sprite management.
 * Ported from legacy AS3: otlib/sprites/SpriteData.as, otlib/utils/SpriteExtent.as
 */

// ---------------------------------------------------------------------------
// Sprite Constants
// ---------------------------------------------------------------------------

/** Default sprite size in pixels (32x32). */
export const SPRITE_DEFAULT_SIZE = 32

/** Default sprite data size in bytes (32 * 32 * 4 = 4096 ARGB pixels). */
export const SPRITE_DEFAULT_DATA_SIZE = 4096

/** Default sprite size label. */
export const SPRITE_DEFAULT_VALUE = '32x32'

// ---------------------------------------------------------------------------
// SpriteData
// ---------------------------------------------------------------------------

export interface SpriteData {
  id: number
  pixels: Uint8Array | null
}

export function createSpriteData(id = 0, pixels: Uint8Array | null = null): SpriteData {
  if (pixels) {
    return { id, pixels }
  }

  // Fill with transparent magenta (0xFFFF00FF in ARGB)
  const empty = new Uint8Array(SPRITE_DEFAULT_DATA_SIZE)
  for (let i = 0; i < SPRITE_DEFAULT_DATA_SIZE; i += 4) {
    empty[i] = 0xff // Alpha
    empty[i + 1] = 0xff // Red
    empty[i + 2] = 0x00 // Green
    empty[i + 3] = 0xff // Blue
  }
  return { id, pixels: empty }
}

export function cloneSpriteData(sd: SpriteData): SpriteData {
  return {
    id: sd.id,
    pixels: sd.pixels ? new Uint8Array(sd.pixels) : null
  }
}

export function isSpriteDataEmpty(sd: SpriteData): boolean {
  return !sd.pixels || sd.pixels.length === 0
}
