/**
 * Static list of supported sprite dimensions.
 * Ported from legacy config/sprites.xml.
 */

import type { SpriteDimension } from '../types/project'

/** All supported sprite dimensions. */
export const SPRITE_DIMENSIONS: readonly SpriteDimension[] = [
  { value: '32x32', size: 32, dataSize: 4096 },
  { value: '64x64', size: 64, dataSize: 16384 },
  { value: '128x128', size: 128, dataSize: 65536 },
  { value: '256x256', size: 256, dataSize: 262144 }
]
