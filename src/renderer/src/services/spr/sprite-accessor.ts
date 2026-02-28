/**
 * SpriteAccessor - Lazy sprite extraction from a raw SPR buffer.
 *
 * Instead of extracting all sprites upfront into individual Uint8Array copies
 * (which doubles memory usage for large files), this class pre-builds an
 * address table (sprite ID -> offset in buffer) and extracts individual
 * sprites on demand.
 *
 * Memory savings: For a 300MB SPR file with 50K sprites, the eager approach
 * uses ~600MB (buffer + 50K copies). This approach uses ~300MB (buffer only)
 * plus only the sprites that are actually accessed.
 *
 * Matches the legacy AS3 pattern where SpriteReader kept a file handle open
 * and read sprites on demand via `readSprite(id)`.
 */

import { BinaryReader } from '../dat/binary-stream'

// ---------------------------------------------------------------------------
// Constants (shared with spr-reader.ts)
// ---------------------------------------------------------------------------

/** Header size without extended (signature u32 + count u16 = 6) */
const HEADER_U16 = 6

/** Header size with extended (signature u32 + count u32 = 8) */
const HEADER_U32 = 8

/** Size of each sprite address entry in bytes */
const ADDRESS_SIZE = 4

// ---------------------------------------------------------------------------
// SpriteAccessor
// ---------------------------------------------------------------------------

export class SpriteAccessor {
  private buffer: ArrayBuffer | null
  private addresses: Uint32Array | null

  readonly signature: number
  readonly spriteCount: number

  constructor(buffer: ArrayBuffer, extended: boolean) {
    this.buffer = buffer
    const headerSize = extended ? HEADER_U32 : HEADER_U16

    const reader = new BinaryReader(buffer)

    // Read header
    reader.position = 0
    this.signature = reader.readUint32()

    reader.position = 4
    this.spriteCount = extended ? reader.readUint32() : reader.readUint16()

    // Pre-build address table (just offsets, no data extraction)
    this.addresses = new Uint32Array(this.spriteCount + 1) // 1-based indexing
    for (let id = 1; id <= this.spriteCount; id++) {
      reader.position = (id - 1) * ADDRESS_SIZE + headerSize
      this.addresses[id] = reader.readUint32()
    }
  }

  /**
   * Check if a sprite ID exists and is non-empty.
   */
  has(id: number): boolean {
    if (!this.addresses || id < 1 || id > this.spriteCount) return false
    return this.addresses[id] !== 0
  }

  /**
   * Get compressed pixel data for a sprite ID (1-based).
   * Extracts from the buffer on demand (lazy).
   * Returns undefined if the sprite is empty or out of range.
   */
  get(id: number): Uint8Array | undefined {
    if (!this.addresses || !this.buffer || id < 1 || id > this.spriteCount) return undefined

    const address = this.addresses[id]
    if (address === 0) return undefined

    const reader = new BinaryReader(this.buffer)
    reader.position = address

    // Skip 3-byte magenta RGB header
    reader.readUint8()
    reader.readUint8()
    reader.readUint8()

    const length = reader.readUint16()
    if (length === 0) return undefined

    // Extract compressed pixels
    return new Uint8Array(this.buffer.slice(reader.position, reader.position + length))
  }

  /**
   * Get the count of non-empty sprites (iterates address table).
   */
  getNonEmptyCount(): number {
    if (!this.addresses) return 0
    let count = 0
    for (let id = 1; id <= this.spriteCount; id++) {
      if (this.addresses[id] !== 0) count++
    }
    return count
  }

  /**
   * Iterate over all non-empty sprite IDs.
   */
  *ids(): IterableIterator<number> {
    if (!this.addresses) return
    for (let id = 1; id <= this.spriteCount; id++) {
      if (this.addresses[id] !== 0) {
        yield id
      }
    }
  }

  /**
   * Extract all sprites into a Map (for operations that need all data,
   * like SPR write or sprite optimization).
   * This is the "materialization" of the lazy accessor.
   */
  extractAll(): Map<number, Uint8Array> {
    const sprites = new Map<number, Uint8Array>()
    for (const id of this.ids()) {
      const data = this.get(id)
      if (data) {
        sprites.set(id, data)
      }
    }
    return sprites
  }

  /**
   * Estimate the memory footprint of the underlying buffer in bytes.
   */
  getBufferSize(): number {
    return this.buffer?.byteLength ?? 0
  }

  /**
   * Release the reference to the buffer (for explicit cleanup).
   * After calling this, all get() calls will fail.
   */
  dispose(): void {
    this.addresses = null
    this.buffer = null
  }
}
