/**
 * Item Attribute Storage service.
 * Manages loading and querying of attribute definitions per TFS server version.
 * Ported from legacy AS3: otlib/items/ItemAttributeStorage.as
 */

import { ATTRIBUTE_DATA, type AttributeServerData } from './attribute-xml-data'
import type { ItemAttribute } from '@renderer/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metadata for a loaded server configuration */
export interface AttributeServerMetadata {
  server: string
  displayName: string
  supportsFromToId: boolean
  itemsXmlEncoding: string
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let _currentServer: string | null = null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getServerData(serverName: string): AttributeServerData | null {
  return ATTRIBUTE_DATA[serverName] ?? null
}

/**
 * Recursively collects attribute keys from an attribute and its nested children.
 */
function collectAttributeKeys(attr: ItemAttribute, result: string[]): void {
  result.push(attr.key)
  if (attr.attributes) {
    for (const child of attr.attributes) {
      collectAttributeKeys(child, result)
    }
  }
}

/**
 * Recursively collects key->order pairs for attributes with explicit order.
 */
function collectAttributePriority(attrs: ItemAttribute[], result: Record<string, number>): void {
  for (const attr of attrs) {
    if (attr.order !== Number.MAX_SAFE_INTEGER) {
      result[attr.key] = attr.order
    }
    if (attr.attributes) {
      collectAttributePriority(attr.attributes, result)
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get list of available server IDs (sorted) */
export function getAvailableServers(): string[] {
  return Object.keys(ATTRIBUTE_DATA).sort()
}

/** Get available servers with display names */
export function getAvailableServersWithLabels(): Array<{ server: string; displayName: string }> {
  return getAvailableServers().map((server) => ({
    server,
    displayName: getDisplayName(server)
  }))
}

/** Load attributes for a specific server. Returns null if server not found. Caches result. */
export function loadServer(serverName: string): ItemAttribute[] | null {
  const data = getServerData(serverName)
  if (!data) return null

  _currentServer = serverName
  return data.attributes
}

/** Get attributes for currently loaded server */
export function getAttributes(): ItemAttribute[] | null {
  if (!_currentServer) return null

  const data = getServerData(_currentServer)
  return data ? data.attributes : null
}

/** Get current server name */
export function getCurrentServer(): string | null {
  return _currentServer
}

/** Get display name for a server */
export function getDisplayName(serverName: string): string {
  const data = getServerData(serverName)
  return data ? data.displayName : serverName
}

/** Check if server supports fromid/toid range optimization in items.xml */
export function getSupportsFromToId(serverName?: string): boolean {
  const name = serverName ?? _currentServer
  if (!name) return true

  const data = getServerData(name)
  if (!data) return true

  return data.supportsFromToId
}

/** Get items.xml encoding for a server */
export function getItemsXmlEncoding(serverName?: string): string {
  const name = serverName ?? _currentServer
  if (!name) return 'iso-8859-1'

  const data = getServerData(name)
  if (!data) return 'iso-8859-1'

  return data.itemsXmlEncoding
}

/** Get unique category names for currently loaded server (in definition order) */
export function getCategories(): string[] {
  const attrs = getAttributes()
  if (!attrs) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const attr of attrs) {
    if (!seen.has(attr.category)) {
      seen.add(attr.category)
      result.push(attr.category)
    }
  }

  return result
}

/** Get attributes filtered by category */
export function getAttributesByCategory(category: string): ItemAttribute[] {
  const attrs = getAttributes()
  if (!attrs) return []

  return attrs.filter((attr) => attr.category === category)
}

/** Get all attribute keys in definition order (including nested) */
export function getAttributeKeysInOrder(): string[] {
  const attrs = getAttributes()
  if (!attrs) return []

  const keys: string[] = []
  for (const attr of attrs) {
    collectAttributeKeys(attr, keys)
  }
  return keys
}

/** Get attribute keys with placement="tag" */
export function getTagAttributeKeys(): string[] {
  const attrs = getAttributes()
  if (!attrs) return []

  return attrs.filter((attr) => attr.placement === 'tag').map((attr) => attr.key)
}

/** Get map of attribute priorities (key -> order) for attributes with explicit order */
export function getAttributePriority(): Record<string, number> {
  const attrs = getAttributes()
  if (!attrs) return {}

  const result: Record<string, number> = {}
  collectAttributePriority(attrs, result)
  return result
}

/** Search attributes by key (partial match, case-insensitive) */
export function searchAttributes(keyword: string): ItemAttribute[] {
  const attrs = getAttributes()
  if (!attrs) return []

  const lower = keyword.toLowerCase()
  return attrs.filter((attr) => attr.key.toLowerCase().indexOf(lower) >= 0)
}

/** Get metadata for a server */
export function getServerMetadata(serverName: string): AttributeServerMetadata | null {
  const data = getServerData(serverName)
  if (!data) return null

  return {
    server: serverName,
    displayName: data.displayName,
    supportsFromToId: data.supportsFromToId,
    itemsXmlEncoding: data.itemsXmlEncoding
  }
}

/** Reset storage state (for testing) */
export function resetAttributeStorage(): void {
  _currentServer = null
}
