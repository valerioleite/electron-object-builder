/**
 * OTB (Open Tibia Binary) file writer.
 * Writes items.otb files using Binary Tree format with escape characters.
 *
 * Ported from legacy AS3: otlib/items/OtbWriter.as
 *
 * File format (Binary Tree):
 * - Header: 4 bytes (uint32, always 0)
 * - Root node: [0xFE][type=0][flags:u32][VERSION attr][child nodes...][0xFF]
 * - Child nodes (items): [0xFE][group:u8][flags:u32][attributes...][0xFF]
 * - Escape mechanism: 0xFD before special bytes (0xFD, 0xFE, 0xFF) in data
 */

import {
  type ServerItem,
  getServerItemFlags,
  getServerItemGroup,
  ServerItemType,
  ServerItemAttribute
} from '../../types'
import { SpecialChar, RootAttribute } from './otb-constants'
import { ServerItemList } from './server-item-list'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Writes a ServerItemList to OTB binary format.
 */
export function writeOtb(itemList: ServerItemList): ArrayBuffer {
  const state: WriterState = { data: [], size: 0 }

  // Header (4 bytes = 0)
  writeUint32Raw(state, 0)

  // Root node
  createNode(state, 0)
  writeUint32Escaped(state, 0) // flags (unused)

  // Version attribute
  writeVersionAttribute(state, itemList)

  // Write each item
  const items = itemList.toArray()
  for (const item of items) {
    writeItem(state, item)
  }

  // Close root node
  closeNode(state)

  // Build final buffer
  const result = new Uint8Array(state.size)
  let offset = 0
  for (const chunk of state.data) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result.buffer as ArrayBuffer
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface WriterState {
  data: Uint8Array[]
  size: number
}

// ---------------------------------------------------------------------------
// Node operations
// ---------------------------------------------------------------------------

function createNode(state: WriterState, type: number): void {
  writeByteRaw(state, SpecialChar.NODE_START)
  writeByteEscaped(state, type)
}

function closeNode(state: WriterState): void {
  writeByteRaw(state, SpecialChar.NODE_END)
}

function writeVersionAttribute(state: WriterState, itemList: ServerItemList): void {
  // Build version data: majorVersion(4) + minorVersion(4) + buildNumber(4) + CSD string(128) = 140 bytes
  const versionData = new Uint8Array(140)
  const versionView = new DataView(versionData.buffer)

  versionView.setUint32(0, itemList.majorVersion, true)
  versionView.setUint32(4, itemList.minorVersion, true)
  versionView.setUint32(8, itemList.buildNumber, true)

  // CSD version string (128 bytes, null-padded)
  const majorStr = Math.floor(itemList.clientVersion / 100)
  const minorStr = itemList.clientVersion % 100
  const csdStr = `OTB ${itemList.majorVersion}.${itemList.minorVersion}.${itemList.buildNumber}-${majorStr}.${minorStr}`
  const csdBytes = new TextEncoder().encode(csdStr)
  versionData.set(csdBytes.subarray(0, Math.min(csdBytes.length, 128)), 12)

  writeProp(state, RootAttribute.VERSION, versionData)
}

function writeItem(state: WriterState, item: ServerItem): void {
  // Create node with item group
  createNode(state, getServerItemGroup(item.type))

  // Write flags
  writeUint32Escaped(state, getServerItemFlags(item))

  // Always write Server ID
  const serverIdData = new Uint8Array(2)
  new DataView(serverIdData.buffer).setUint16(0, item.id, true)
  writeProp(state, ServerItemAttribute.SERVER_ID, serverIdData)

  if (item.type !== ServerItemType.DEPRECATED) {
    // Client ID
    const clientIdData = new Uint8Array(2)
    new DataView(clientIdData.buffer).setUint16(0, item.clientId, true)
    writeProp(state, ServerItemAttribute.CLIENT_ID, clientIdData)

    // Sprite hash
    if (item.spriteHash && item.spriteHash.length > 0) {
      writeProp(state, ServerItemAttribute.SPRITE_HASH, item.spriteHash)
    }

    // Minimap color
    if (item.minimapColor !== 0) {
      const data = new Uint8Array(2)
      new DataView(data.buffer).setUint16(0, item.minimapColor, true)
      writeProp(state, ServerItemAttribute.MINIMAP_COLOR, data)
    }

    // Max read/write chars
    if (item.maxReadWriteChars !== 0) {
      const data = new Uint8Array(2)
      new DataView(data.buffer).setUint16(0, item.maxReadWriteChars, true)
      writeProp(state, ServerItemAttribute.MAX_READ_WRITE_CHARS, data)
    }

    // Max read chars
    if (item.maxReadChars !== 0) {
      const data = new Uint8Array(2)
      new DataView(data.buffer).setUint16(0, item.maxReadChars, true)
      writeProp(state, ServerItemAttribute.MAX_READ_CHARS, data)
    }

    // Light
    if (item.lightLevel !== 0 || item.lightColor !== 0) {
      const data = new Uint8Array(4)
      const dv = new DataView(data.buffer)
      dv.setUint16(0, item.lightLevel, true)
      dv.setUint16(2, item.lightColor, true)
      writeProp(state, ServerItemAttribute.LIGHT, data)
    }

    // Ground speed (only for ground type)
    if (item.type === ServerItemType.GROUND) {
      const data = new Uint8Array(2)
      new DataView(data.buffer).setUint16(0, item.groundSpeed, true)
      writeProp(state, ServerItemAttribute.GROUND_SPEED, data)
    }

    // Stack order
    if (item.stackOrder !== 0) {
      const data = new Uint8Array([item.stackOrder])
      writeProp(state, ServerItemAttribute.STACK_ORDER, data)
    }

    // Trade as
    if (item.tradeAs !== 0) {
      const data = new Uint8Array(2)
      new DataView(data.buffer).setUint16(0, item.tradeAs, true)
      writeProp(state, ServerItemAttribute.TRADE_AS, data)
    }

    // Name (last)
    if (item.name && item.name.length > 0) {
      const nameBytes = new TextEncoder().encode(item.name)
      writeProp(state, ServerItemAttribute.NAME, nameBytes)
    }
  }

  closeNode(state)
}

// ---------------------------------------------------------------------------
// Property writing
// ---------------------------------------------------------------------------

function writeProp(state: WriterState, attr: number, data: Uint8Array): void {
  writeByteEscaped(state, attr)
  writeUint16Escaped(state, data.length)
  writeBytesEscaped(state, data)
}

// ---------------------------------------------------------------------------
// Low-level byte writing with escape handling
// ---------------------------------------------------------------------------

function writeByteRaw(state: WriterState, value: number): void {
  const byte = new Uint8Array([value])
  state.data.push(byte)
  state.size += 1
}

function writeByteEscaped(state: WriterState, value: number): void {
  if (isSpecial(value)) {
    writeByteRaw(state, SpecialChar.ESCAPE_CHAR)
  }
  writeByteRaw(state, value)
}

function writeUint16Escaped(state: WriterState, value: number): void {
  const bytes = new Uint8Array(2)
  new DataView(bytes.buffer).setUint16(0, value, true)
  writeBytesEscaped(state, bytes)
}

function writeUint32Raw(state: WriterState, value: number): void {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value, true)
  state.data.push(bytes)
  state.size += 4
}

function writeUint32Escaped(state: WriterState, value: number): void {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value, true)
  writeBytesEscaped(state, bytes)
}

function writeBytesEscaped(state: WriterState, bytes: Uint8Array): void {
  for (let i = 0; i < bytes.length; i++) {
    writeByteEscaped(state, bytes[i])
  }
}

function isSpecial(value: number): boolean {
  return (
    value === SpecialChar.NODE_START ||
    value === SpecialChar.NODE_END ||
    value === SpecialChar.ESCAPE_CHAR
  )
}
