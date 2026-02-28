/**
 * OTB (Open Tibia Binary) file reader.
 * Reads items.otb files using Binary Tree format with escape characters.
 *
 * Ported from legacy AS3: otlib/items/OtbReader.as
 *
 * File format (Binary Tree):
 * - Header: 4 bytes (uint32, always 0)
 * - Root node: [0xFE][type=0][flags:u32][VERSION attr][child nodes...][0xFF]
 * - Child nodes (items): [0xFE][group:u8][flags:u32][attributes...][0xFF]
 * - Escape mechanism: 0xFD before special bytes (0xFD, 0xFE, 0xFF) in data
 */

import {
  type ServerItem,
  createServerItem,
  setServerItemFlags,
  ServerItemType,
  ServerItemGroup,
  ServerItemAttribute,
  TileStackOrder
} from '../../types'
import { SpecialChar, RootAttribute } from './otb-constants'
import { ServerItemList } from './server-item-list'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface OtbReadResult {
  items: ServerItemList
}

/**
 * Reads an OTB binary buffer and returns the parsed items.
 */
export function readOtb(buffer: ArrayBuffer): OtbReadResult {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  const state: ReaderState = { bytes, view, position: 0, currentNodePosition: 0 }
  const items = new ServerItemList()

  parseOtb(state, items)

  return { items }
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ReaderState {
  bytes: Uint8Array
  view: DataView
  position: number
  currentNodePosition: number
}

// ---------------------------------------------------------------------------
// Binary tree traversal
// ---------------------------------------------------------------------------

function parseOtb(state: ReaderState, items: ServerItemList): void {
  // Get root node
  const rootNode = getChildNode(state)
  if (!rootNode) throw new Error('OTB: missing root node')

  const rootView = new DataView(rootNode.buffer, rootNode.byteOffset, rootNode.byteLength)
  let rootPos = 0

  rootPos += 1 // first byte is 0 (node type)
  rootPos += 4 // flags (unused)

  // Read version attribute
  if (rootPos < rootNode.byteLength) {
    const attr = rootNode[rootPos++]
    if (attr === RootAttribute.VERSION) {
      const datalen = rootView.getUint16(rootPos, true)
      rootPos += 2

      if (datalen !== 140) {
        throw new Error(`OTB: invalid version header size: ${datalen}`)
      }

      items.majorVersion = rootView.getUint32(rootPos, true)
      rootPos += 4
      items.minorVersion = rootView.getUint32(rootPos, true)
      rootPos += 4
      items.buildNumber = rootView.getUint32(rootPos, true)
      // Skip remaining 128 bytes (CSD version string)
    }
  }

  // Read child nodes (items)
  let node = getChildNode(state)
  while (node !== null) {
    const item = parseItemNode(node)
    items.add(item)
    node = getNextNode(state)
  }
}

function parseItemNode(node: Uint8Array): ServerItem {
  const item = createServerItem()
  const nodeView = new DataView(node.buffer, node.byteOffset, node.byteLength)
  let pos = 0

  // Read item group -> determine type
  const itemGroup = node[pos++]
  switch (itemGroup) {
    case ServerItemGroup.GROUND:
      item.type = ServerItemType.GROUND
      break
    case ServerItemGroup.CONTAINER:
      item.type = ServerItemType.CONTAINER
      break
    case ServerItemGroup.SPLASH:
      item.type = ServerItemType.SPLASH
      break
    case ServerItemGroup.FLUID:
      item.type = ServerItemType.FLUID
      break
    case ServerItemGroup.DEPRECATED:
      item.type = ServerItemType.DEPRECATED
      break
    default:
      item.type = ServerItemType.NONE
      break
  }

  // Read flags (uint32)
  const flags = nodeView.getUint32(pos, true)
  pos += 4
  setServerItemFlags(item, flags)

  // Read attributes
  while (pos < node.byteLength) {
    const attribute = node[pos++]
    const attrLen = nodeView.getUint16(pos, true)
    pos += 2

    switch (attribute) {
      case ServerItemAttribute.SERVER_ID:
        item.id = nodeView.getUint16(pos, true)
        pos += 2
        break

      case ServerItemAttribute.CLIENT_ID:
        item.clientId = nodeView.getUint16(pos, true)
        pos += 2
        break

      case ServerItemAttribute.GROUND_SPEED:
        item.groundSpeed = nodeView.getUint16(pos, true)
        pos += 2
        break

      case ServerItemAttribute.NAME:
        item.name = decodeUtf8(node, pos, attrLen)
        pos += attrLen
        break

      case ServerItemAttribute.SPRITE_HASH:
        item.spriteHash = new Uint8Array(node.buffer, node.byteOffset + pos, attrLen).slice()
        pos += attrLen
        break

      case ServerItemAttribute.MINIMAP_COLOR:
        item.minimapColor = nodeView.getUint16(pos, true)
        pos += 2
        break

      case ServerItemAttribute.MAX_READ_WRITE_CHARS:
        item.maxReadWriteChars = nodeView.getUint16(pos, true)
        pos += 2
        break

      case ServerItemAttribute.MAX_READ_CHARS:
        item.maxReadChars = nodeView.getUint16(pos, true)
        pos += 2
        break

      case ServerItemAttribute.LIGHT:
        item.lightLevel = nodeView.getUint16(pos, true)
        pos += 2
        item.lightColor = nodeView.getUint16(pos, true)
        pos += 2
        break

      case ServerItemAttribute.STACK_ORDER:
        item.stackOrder = node[pos] as TileStackOrder
        item.hasStackOrder = true
        pos += 1
        break

      case ServerItemAttribute.TRADE_AS:
        item.tradeAs = nodeView.getUint16(pos, true)
        pos += 2
        break

      default:
        // Skip unknown attribute
        pos += attrLen
        break
    }
  }

  // Ensure sprite hash exists for non-deprecated items
  if (!item.spriteHash && item.type !== ServerItemType.DEPRECATED) {
    item.spriteHash = new Uint8Array(16)
  }

  return item
}

// ---------------------------------------------------------------------------
// Binary tree node navigation
// ---------------------------------------------------------------------------

function getChildNode(state: ReaderState): Uint8Array | null {
  if (!advance(state)) return null
  return getNodeData(state)
}

function getNextNode(state: ReaderState): Uint8Array | null {
  state.position = state.currentNodePosition

  if (state.position >= state.bytes.byteLength) return null

  let value = state.bytes[state.position++]
  if (value !== SpecialChar.NODE_START) return null

  state.position++ // Skip node type

  let level = 1
  while (state.position < state.bytes.byteLength) {
    value = state.bytes[state.position++]

    if (value === SpecialChar.NODE_END) {
      level--
      if (level === 0) {
        if (state.position >= state.bytes.byteLength) return null

        value = state.bytes[state.position++]
        if (value === SpecialChar.NODE_END) {
          return null
        } else if (value !== SpecialChar.NODE_START) {
          return null
        } else {
          state.currentNodePosition = state.position - 1
          return getNodeData(state)
        }
      }
    } else if (value === SpecialChar.NODE_START) {
      level++
    } else if (value === SpecialChar.ESCAPE_CHAR) {
      if (state.position < state.bytes.byteLength) {
        state.position++
      }
    }
  }

  return null
}

function getNodeData(state: ReaderState): Uint8Array | null {
  state.position = state.currentNodePosition

  if (state.position >= state.bytes.byteLength) return null

  let value = state.bytes[state.position++]
  if (value !== SpecialChar.NODE_START) return null

  const nodeBytes: number[] = []

  while (state.position < state.bytes.byteLength) {
    value = state.bytes[state.position++]

    if (value === SpecialChar.NODE_END || value === SpecialChar.NODE_START) {
      break
    } else if (value === SpecialChar.ESCAPE_CHAR) {
      if (state.position < state.bytes.byteLength) {
        value = state.bytes[state.position++]
      }
    }

    nodeBytes.push(value)
  }

  state.position = state.currentNodePosition
  return new Uint8Array(nodeBytes)
}

function advance(state: ReaderState): boolean {
  let seekPos: number
  if (state.currentNodePosition === 0) {
    seekPos = 4 // Skip 4-byte header
  } else {
    seekPos = state.currentNodePosition
  }

  if (seekPos >= state.bytes.byteLength) return false

  state.position = seekPos
  let value = state.bytes[state.position++]

  if (value !== SpecialChar.NODE_START) return false

  if (state.currentNodePosition === 0) {
    state.currentNodePosition = state.position - 1
    return true
  } else {
    state.position++ // Skip node type

    while (state.position < state.bytes.byteLength) {
      value = state.bytes[state.position++]

      if (value === SpecialChar.NODE_END) {
        return false
      } else if (value === SpecialChar.NODE_START) {
        state.currentNodePosition = state.position - 1
        return true
      } else if (value === SpecialChar.ESCAPE_CHAR) {
        if (state.position < state.bytes.byteLength) {
          state.position++
        }
      }
    }
  }

  return false
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function decodeUtf8(data: Uint8Array, offset: number, length: number): string {
  const slice = data.subarray(offset, offset + length)
  return new TextDecoder('utf-8').decode(slice)
}
