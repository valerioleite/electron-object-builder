/**
 * SPR file reader - reads OpenTibia sprite (SPR) binary files.
 * Ported from legacy AS3: otlib/sprites/SpriteReader.as
 *
 * SPR file format:
 *   [signature:u32]                      4 bytes
 *   [sprite_count:u16|u32]               2 or 4 bytes (u32 for extended/v960+)
 *   [address_table: count × u32]         each address points to sprite data
 *   [sprite_data...]                     sequential sprite data blocks
 *
 * Each sprite data block at its address:
 *   [R:u8=0xFF][G:u8=0x00][B:u8=0xFF]   3-byte magenta RGB header (skipped)
 *   [length:u16]                          compressed pixel data length
 *   [compressed_pixels: length bytes]     RLE compressed pixel data
 */

import { BinaryReader } from '../dat/binary-stream'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Header size without extended (signature u32 + count u16 = 6) */
const HEADER_U16 = 6

/** Header size with extended (signature u32 + count u32 = 8) */
const HEADER_U32 = 8

/** Size of each sprite address entry in bytes */
const ADDRESS_SIZE = 4

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SprReadResult {
  signature: number
  spriteCount: number
  /** Compressed pixel data by sprite ID (1-based). Only non-empty sprites are present. */
  sprites: Map<number, Uint8Array>
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read an SPR binary file and return all sprite data.
 *
 * @param buffer - Raw SPR file bytes
 * @param extended - If true, count is u32 and header is 8 bytes (v960+)
 * @returns Parsed SPR data with signature, count, and compressed sprite pixels
 */
export function readSpr(buffer: ArrayBuffer, extended: boolean): SprReadResult {
  const reader = new BinaryReader(buffer)
  const headerSize = extended ? HEADER_U32 : HEADER_U16

  // Read header
  reader.position = 0
  const signature = reader.readUint32()

  reader.position = 4
  const spriteCount = extended ? reader.readUint32() : reader.readUint16()

  // Read all sprites
  const sprites = new Map<number, Uint8Array>()

  for (let id = 1; id <= spriteCount; id++) {
    // Read address from address table
    reader.position = (id - 1) * ADDRESS_SIZE + headerSize
    const address = reader.readUint32()

    if (address === 0) continue

    // Read sprite data at address
    reader.position = address
    reader.readUint8() // skip red   (0xFF)
    reader.readUint8() // skip green (0x00)
    reader.readUint8() // skip blue  (0xFF)

    const length = reader.readUint16()
    if (length === 0) continue

    // Read compressed pixels
    const start = reader.position
    const compressed = new Uint8Array(
      buffer.slice(reader.position, reader.position + length)
    )
    reader.position = start + length

    sprites.set(id, compressed)
  }

  return { signature, spriteCount, sprites }
}

/**
 * Check if a sprite at the given ID is empty in the buffer.
 *
 * @param buffer - Raw SPR file bytes
 * @param id - Sprite ID (1-based)
 * @param extended - Extended format flag
 * @returns true if sprite is empty (address=0 or length=0)
 */
export function isSpriteEmpty(buffer: ArrayBuffer, id: number, extended: boolean): boolean {
  const reader = new BinaryReader(buffer)
  const headerSize = extended ? HEADER_U32 : HEADER_U16

  reader.position = (id - 1) * ADDRESS_SIZE + headerSize
  const address = reader.readUint32()
  if (address === 0) return true

  reader.position = address
  reader.readUint8() // skip RGB header
  reader.readUint8()
  reader.readUint8()

  return reader.readUint16() === 0
}
