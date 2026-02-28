/**
 * Sprite pixel compression/decompression utilities.
 * Ported from legacy AS3: otlib/sprites/Sprite.as
 *
 * Sprite RLE compression format:
 *   Chunks of [transparent_count:u16 LE][colored_count:u16 LE][colored_pixels...]
 *   - Each colored pixel: RGB (3 bytes) or RGBA (4 bytes) depending on transparency flag
 *   - Decompressed format: ARGB per pixel (4 bytes), 32x32 = 4096 bytes total
 *   - A pixel is "transparent" when all 4 ARGB bytes are 0x00
 */

import { SPRITE_DEFAULT_SIZE, SPRITE_DEFAULT_DATA_SIZE } from '../../types'

/** Number of pixels in a sprite (32 * 32 = 1024) */
const PIXEL_COUNT = SPRITE_DEFAULT_SIZE * SPRITE_DEFAULT_SIZE

/** Transparent marker byte used in RGB data (ItemEditor compatibility) */
const TRANSPARENT_COLOR = 0x11

/** Size of RGB data buffer (32 * 32 * 3 = 3072) */
const RGB_SIZE = SPRITE_DEFAULT_SIZE * SPRITE_DEFAULT_SIZE * 3

// ---------------------------------------------------------------------------
// Compression
// ---------------------------------------------------------------------------

/**
 * Compress ARGB pixel data into sprite RLE chunk format.
 *
 * @param pixels - 4096 bytes in ARGB format ([A,R,G,B] x 1024 pixels)
 * @param transparent - Store RGBA per colored pixel (4 bytes) vs RGB (3 bytes)
 * @returns Compressed pixel data (empty Uint8Array if image is fully transparent)
 */
export function compressPixels(pixels: Uint8Array, transparent: boolean): Uint8Array {
  if (pixels.length !== SPRITE_DEFAULT_DATA_SIZE) {
    throw new Error(
      `Invalid pixel data length: expected ${SPRITE_DEFAULT_DATA_SIZE}, got ${pixels.length}`
    )
  }

  const out = new ArrayBuffer(SPRITE_DEFAULT_DATA_SIZE * 2)
  const view = new DataView(out)
  const pixelView = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength)

  let writePos = 0
  let index = 0
  let totalTransparent = 0

  while (index < PIXEL_COUNT) {
    // Count consecutive transparent pixels
    let transparentCount = 0
    while (index < PIXEL_COUNT) {
      // Read as big-endian uint32: ARGB packed. Transparent pixel = 0x00000000
      const color = pixelView.getUint32(index * 4, false)
      if (color !== 0) break
      totalTransparent++
      transparentCount++
      index++
    }

    // Entire image is transparent — return empty
    if (totalTransparent >= PIXEL_COUNT) break
    // Ran out of pixels after counting trailing transparent — done
    if (index >= PIXEL_COUNT) break

    // Write transparent count
    view.setUint16(writePos, transparentCount, true)
    writePos += 2

    // Save position for colored count (backfill after counting)
    const coloredCountPos = writePos
    writePos += 2

    // Count and write colored pixels
    let coloredCount = 0
    while (index < PIXEL_COUNT) {
      const color = pixelView.getUint32(index * 4, false)
      if (color === 0) break

      const off = index * 4
      view.setUint8(writePos++, pixels[off + 1]) // R
      view.setUint8(writePos++, pixels[off + 2]) // G
      view.setUint8(writePos++, pixels[off + 3]) // B
      if (transparent) {
        view.setUint8(writePos++, pixels[off]) // A
      }

      coloredCount++
      index++
    }

    // Backfill colored count
    view.setUint16(coloredCountPos, coloredCount, true)
  }

  return new Uint8Array(out, 0, writePos)
}

// ---------------------------------------------------------------------------
// Decompression
// ---------------------------------------------------------------------------

/**
 * Decompress sprite RLE data back to ARGB pixel format.
 *
 * @param compressed - Compressed pixel data (RLE chunks)
 * @param transparent - If true, read RGBA per colored pixel; otherwise RGB with alpha=0xFF
 * @returns 4096 bytes of ARGB pixel data
 */
export function uncompressPixels(compressed: Uint8Array, transparent: boolean): Uint8Array {
  const pixels = new Uint8Array(SPRITE_DEFAULT_DATA_SIZE)
  if (compressed.length === 0) return pixels

  const view = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength)
  let read = 0
  let write = 0

  while (read < compressed.length) {
    const transparentPixels = view.getUint16(read, true)
    read += 2
    const coloredPixels = view.getUint16(read, true)
    read += 2

    // Transparent pixels — already zeroed in output
    write += transparentPixels * 4

    // Colored pixels
    for (let i = 0; i < coloredPixels; i++) {
      const r = compressed[read++]
      const g = compressed[read++]
      const b = compressed[read++]
      const a = transparent ? compressed[read++] : 0xff

      pixels[write++] = a
      pixels[write++] = r
      pixels[write++] = g
      pixels[write++] = b
    }
  }

  return pixels
}

// ---------------------------------------------------------------------------
// RGB Data (ItemEditor compatibility)
// ---------------------------------------------------------------------------

/**
 * Get RGB data from compressed sprite, for hash calculation compatibility.
 * Returns 3072 bytes (32*32*3) with 0x11 for transparent pixels.
 *
 * @param compressed - Compressed pixel data
 * @param transparent - Transparency flag
 * @returns 3072 bytes of RGB data
 */
export function getRGBData(compressed: Uint8Array, transparent: boolean): Uint8Array {
  const rgb = new Uint8Array(RGB_SIZE)

  if (compressed.length === 0) {
    rgb.fill(TRANSPARENT_COLOR)
    return rgb
  }

  const view = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength)
  let read = 0
  let write = 0

  while (read < compressed.length) {
    const transparentPixels = view.getUint16(read, true)
    read += 2
    const coloredPixels = view.getUint16(read, true)
    read += 2

    for (let i = 0; i < transparentPixels; i++) {
      rgb[write++] = TRANSPARENT_COLOR
      rgb[write++] = TRANSPARENT_COLOR
      rgb[write++] = TRANSPARENT_COLOR
    }

    for (let i = 0; i < coloredPixels; i++) {
      rgb[write++] = compressed[read++] // R
      rgb[write++] = compressed[read++] // G
      rgb[write++] = compressed[read++] // B
      if (transparent) read++ // skip alpha
    }
  }

  while (write < RGB_SIZE) {
    rgb[write++] = TRANSPARENT_COLOR
  }

  return rgb
}

// ---------------------------------------------------------------------------
// ARGB <-> RGBA conversion (for Canvas2D ImageData)
// ---------------------------------------------------------------------------

/**
 * Convert ARGB pixel data to RGBA format (for Canvas2D ImageData).
 * OpenTibia uses ARGB byte order; Canvas uses RGBA.
 */
export function argbToRgba(argb: Uint8Array): Uint8ClampedArray {
  const len = argb.length
  const rgba = new Uint8ClampedArray(len)
  for (let i = 0; i < len; i += 4) {
    rgba[i] = argb[i + 1] // R
    rgba[i + 1] = argb[i + 2] // G
    rgba[i + 2] = argb[i + 3] // B
    rgba[i + 3] = argb[i] // A
  }
  return rgba
}

/**
 * Convert RGBA pixel data to ARGB format (from Canvas2D ImageData).
 */
export function rgbaToArgb(rgba: Uint8ClampedArray | Uint8Array): Uint8Array {
  const len = rgba.length
  const argb = new Uint8Array(len)
  for (let i = 0; i < len; i += 4) {
    argb[i] = rgba[i + 3] // A
    argb[i + 1] = rgba[i] // R
    argb[i + 2] = rgba[i + 1] // G
    argb[i + 3] = rgba[i + 2] // B
  }
  return argb
}
