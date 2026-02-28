/**
 * Sprite hash computation for OTB format compatibility.
 * Computes MD5 hash of sprite pixel data in the same format as ItemEditor/legacy ObjectBuilder.
 *
 * The hash is computed from the DEFAULT frame group's first W*H*L sprites,
 * converted to vertically-flipped BGR0 format.
 *
 * Ported from legacy SpriteStorage.getSpriteHash() (AS3).
 */

import { type ThingType, FrameGroupType } from '../../types'
import { getRGBData } from '../spr'
import { md5 } from './md5'

/** Transparent color value used in RGB data (0x11). */
const TRANSPARENT_COLOR = 0x11

/** Standard sprite size (32x32 pixels). */
const SPRITE_SIZE = 32

/** Bytes per sprite in RGB format (32 * 32 * 3). */
const RGB_SPRITE_SIZE = SPRITE_SIZE * SPRITE_SIZE * 3

/** Bytes per sprite in BGR0 format (32 * 32 * 4). */
const BGR0_SPRITE_SIZE = SPRITE_SIZE * SPRITE_SIZE * 4

/**
 * Type for a function that retrieves compressed sprite pixels by sprite ID.
 * Returns null/undefined if the sprite doesn't exist or is empty.
 */
export type SpritePixelProvider = (spriteId: number) => Uint8Array | null | undefined

/**
 * Computes the MD5 sprite hash for a ThingType, matching legacy/ItemEditor format.
 *
 * The hash is computed from the DEFAULT frame group's first (width * height * layers) sprites.
 * Each sprite is converted to RGB, flipped vertically, then stored as BGR0 (4 bytes per pixel).
 * The resulting byte stream is MD5-hashed to produce a 16-byte hash.
 *
 * @param thingType The thing type to compute hash for
 * @param getCompressedPixels Function to retrieve compressed pixels by sprite ID
 * @param transparent Whether sprites use transparency mode
 * @returns 16-byte MD5 hash, or null if no DEFAULT frame group
 */
export function computeSpriteHash(
  thingType: ThingType,
  getCompressedPixels: SpritePixelProvider,
  transparent: boolean
): Uint8Array {
  const emptyHash = new Uint8Array(16)

  const group = thingType.frameGroups[FrameGroupType.DEFAULT]
  if (!group) return emptyHash

  const spritesToHash = group.width * group.height * group.layers
  if (!group.spriteIndex || group.spriteIndex.length < spritesToHash) return emptyHash

  // Build the BGR0 stream for all sprites
  const stream = new Uint8Array(spritesToHash * BGR0_SPRITE_SIZE)
  let writePos = 0

  for (let i = 0; i < spritesToHash; i++) {
    const spriteId = group.spriteIndex[i]
    const compressed = spriteId > 0 ? getCompressedPixels(spriteId) : null

    if (!compressed || compressed.length === 0) {
      // Write transparent sprite (TRANSPARENT_COLOR, TRANSPARENT_COLOR, TRANSPARENT_COLOR, 0)
      for (let p = 0; p < SPRITE_SIZE * SPRITE_SIZE; p++) {
        stream[writePos++] = TRANSPARENT_COLOR
        stream[writePos++] = TRANSPARENT_COLOR
        stream[writePos++] = TRANSPARENT_COLOR
        stream[writePos++] = 0
      }
      continue
    }

    // Get RGB data from compressed pixels
    const rgbData = getRGBData(compressed, transparent)

    // Flip vertically and convert RGB to BGR0
    for (let y = 0; y < SPRITE_SIZE; y++) {
      const srcY = SPRITE_SIZE - y - 1
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const srcPos = srcY * (SPRITE_SIZE * 3) + x * 3

        const r = rgbData[srcPos]
        const g = rgbData[srcPos + 1]
        const b = rgbData[srcPos + 2]

        stream[writePos++] = b
        stream[writePos++] = g
        stream[writePos++] = r
        stream[writePos++] = 0
      }
    }
  }

  return md5(stream)
}
