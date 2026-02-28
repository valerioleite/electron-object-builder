/**
 * Items XML writer.
 * Writes ServerItemList to items.xml format (forgottenserver format).
 * Supports range optimization (fromid/toid), configurable tag attributes,
 * nested attributes with proper indentation, and XML escaping.
 *
 * Ported from legacy AS3: otlib/items/ItemsXmlWriter.as
 */

import { type ServerItem, type XmlAttributeValue } from '../../types'
import { type ServerItemList } from '../otb/server-item-list'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ItemsXmlWriteOptions {
  /** XML encoding declared in the header. Default: 'iso-8859-1'. */
  encoding?: string
  /** Ordered list of attribute keys written on the <item> tag. Default: ['article', 'name', 'plural', 'editorsuffix']. */
  tagAttributeKeys?: string[]
  /** Enable fromid/toid range optimization for consecutive items with identical attributes. Default: true. */
  supportsFromToId?: boolean
  /** Priority map (key -> number). Lower values come first. Keys not in map are sorted alphabetically after prioritized ones. */
  attributePriority?: Record<string, number>
}

/**
 * Writes a ServerItemList to items.xml format string.
 * Only items with XML data (name, article, or other attributes) are included.
 */
export function writeItemsXml(items: ServerItemList, options?: ItemsXmlWriteOptions): string {
  const encoding = options?.encoding ?? 'iso-8859-1'
  const tagAttributeKeys = options?.tagAttributeKeys ?? [
    'article',
    'name',
    'plural',
    'editorsuffix'
  ]
  const supportsFromToId = options?.supportsFromToId ?? true
  const attributePriority = options?.attributePriority ?? null
  const tagAttrsLookup = new Set(tagAttributeKeys)

  const parts: string[] = []
  parts.push(`<?xml version="1.0" encoding="${encoding}"?>\n`)
  parts.push('<items>\n')

  const itemsArray = items.toArray()
  let i = 0

  while (i < itemsArray.length) {
    const item = itemsArray[i]

    if (!itemHasXmlData(item)) {
      i++
      continue
    }

    const rangeEnd = supportsFromToId ? findRangeEnd(itemsArray, i) : i

    if (rangeEnd > i) {
      writeItemElement(
        parts,
        item,
        itemsArray[rangeEnd],
        tagAttributeKeys,
        tagAttrsLookup,
        attributePriority
      )
      i = rangeEnd + 1
    } else {
      writeItemElement(parts, item, null, tagAttributeKeys, tagAttrsLookup, attributePriority)
      i++
    }
  }

  parts.push('</items>\n')
  return parts.join('')
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function writeItemElement(
  parts: string[],
  item: ServerItem,
  endItem: ServerItem | null,
  tagAttributeKeys: string[],
  tagAttrsLookup: Set<string>,
  attributePriority: Record<string, number> | null
): void {
  const hasChildren = itemHasNestedAttributes(item, tagAttrsLookup)
  const isRange = endItem !== null && endItem.id !== item.id

  let xml = '\t<item'

  // 1. ID or range (always first)
  if (isRange) {
    xml += ` fromid="${item.id}" toid="${endItem!.id}"`
  } else {
    xml += ` id="${item.id}"`
  }

  // 2. Tag attributes in configured order
  for (const tagKey of tagAttributeKeys) {
    const tagValue = getTagAttributeValue(item, tagKey)
    if (tagValue !== null && (tagValue.length > 0 || tagKey === 'name')) {
      xml += ` ${tagKey}="${escapeXml(tagValue)}"`
    }
  }

  // 3. Nested attributes (non-tag)
  if (hasChildren) {
    xml += '>\n'
    parts.push(xml)
    writeNestedAttributes(parts, item.xmlAttributes!, 2, tagAttrsLookup, attributePriority)
    parts.push('\t</item>\n')
  } else {
    xml += ' />\n'
    parts.push(xml)
  }
}

function getTagAttributeValue(item: ServerItem, key: string): string | null {
  if (!item.xmlAttributes) return null
  const val = item.xmlAttributes[key]
  if (typeof val === 'string') return val
  return null
}

function writeNestedAttributes(
  parts: string[],
  attrs: Record<string, XmlAttributeValue>,
  indentLevel: number,
  tagAttrsLookup: Set<string>,
  attributePriority: Record<string, number> | null
): void {
  // Collect non-tag, non-internal keys
  const keys = Object.keys(attrs).filter((k) => k !== '_parentValue' && !tagAttrsLookup.has(k))

  // Sort by priority then alphabetically
  keys.sort((a, b) => {
    const pA = attributePriority?.[a] ?? Number.MAX_SAFE_INTEGER
    const pB = attributePriority?.[b] ?? Number.MAX_SAFE_INTEGER
    if (pA !== pB) return pA - pB
    return a.localeCompare(b)
  })

  const indent = '\t'.repeat(indentLevel)

  for (const key of keys) {
    const value = attrs[key]

    if (typeof value === 'object') {
      // Nested attribute with children
      const parentValue = value['_parentValue']
      const valueStr = parentValue ? ` value="${escapeXml(parentValue)}"` : ''
      parts.push(`${indent}<attribute key="${key}"${valueStr}>\n`)

      // Write child attributes (excluding _parentValue, sorted alphabetically)
      const childKeys = Object.keys(value)
        .filter((k) => k !== '_parentValue')
        .sort()
      const childIndent = '\t'.repeat(indentLevel + 1)
      for (const ck of childKeys) {
        parts.push(`${childIndent}<attribute key="${ck}" value="${escapeXml(value[ck])}" />\n`)
      }

      parts.push(`${indent}</attribute>\n`)
    } else {
      // Simple attribute
      parts.push(`${indent}<attribute key="${key}" value="${escapeXml(value)}" />\n`)
    }
  }
}

// ---------------------------------------------------------------------------
// Range optimization
// ---------------------------------------------------------------------------

function findRangeEnd(itemsArray: ServerItem[], startIndex: number): number {
  const startItem = itemsArray[startIndex]
  if (!itemHasXmlData(startItem)) return startIndex

  let endIndex = startIndex

  for (let i = startIndex + 1; i < itemsArray.length; i++) {
    const nextItem = itemsArray[i]
    const prevItem = itemsArray[i - 1]

    // IDs must be consecutive
    if (nextItem.id !== prevItem.id + 1) break

    // Attributes must be identical
    if (!areXmlAttributesEqual(startItem, nextItem)) break

    endIndex = i
  }

  return endIndex
}

function areXmlAttributesEqual(a: ServerItem, b: ServerItem): boolean {
  return deepCompareXmlAttributes(a.xmlAttributes, b.xmlAttributes)
}

function deepCompareXmlAttributes(
  a: Record<string, XmlAttributeValue> | null,
  b: Record<string, XmlAttributeValue> | null
): boolean {
  const hasA = a !== null && Object.keys(a).length > 0
  const hasB = b !== null && Object.keys(b).length > 0

  if (!hasA && !hasB) return true
  if (hasA !== hasB) return false

  const keysA = Object.keys(a!)
  const keysB = Object.keys(b!)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    const valA = a![key]
    const valB = b![key]

    if (valB === undefined) return false
    if (typeof valA !== typeof valB) return false

    if (typeof valA === 'string') {
      if (valA !== valB) return false
    } else {
      // Both are nested records
      const nestedA = valA as Record<string, string>
      const nestedB = valB as Record<string, string>
      const nKeysA = Object.keys(nestedA)
      const nKeysB = Object.keys(nestedB)
      if (nKeysA.length !== nKeysB.length) return false
      for (const nk of nKeysA) {
        if (nestedA[nk] !== nestedB[nk]) return false
      }
    }
  }

  return true
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function itemHasXmlData(item: ServerItem): boolean {
  if (!item.xmlAttributes) return false
  return Object.keys(item.xmlAttributes).length > 0
}

function itemHasNestedAttributes(item: ServerItem, tagAttrsLookup: Set<string>): boolean {
  if (!item.xmlAttributes) return false
  for (const key of Object.keys(item.xmlAttributes)) {
    if (!tagAttrsLookup.has(key) && key !== '_parentValue') return true
  }
  return false
}

function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
