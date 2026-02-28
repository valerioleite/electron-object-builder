/**
 * Items XML reader.
 * Reads items.xml files and populates ServerItem XML attributes.
 * Supports single items (id), ranges (fromid/toid), nested attributes,
 * and attribute validation against known attribute sets.
 *
 * Ported from legacy AS3: otlib/items/ItemsXmlReader.as
 */

import { type ServerItem, type XmlAttributeValue } from '../../types'
import { type ServerItemList } from '../otb/server-item-list'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ItemsXmlReadOptions {
  /** Known nested attribute keys (from itemAttributes.xml config). Used for validation. */
  knownAttributes?: string[]
  /** Known tag-level attribute keys (placement="tag" in config). Default: name, article, plural, editorsuffix. */
  knownTagAttributes?: string[]
}

export interface ItemsXmlReadResult {
  success: boolean
  /** Nested attribute keys found in items.xml but not in knownAttributes (sorted). */
  missingAttributes: string[]
  /** Tag attribute keys found in items.xml but not in knownTagAttributes (sorted). */
  missingTagAttributes: string[]
}

/**
 * Reads items.xml content and populates ServerItemList with XML attributes.
 * Items must already exist in the list (loaded from OTB).
 */
export function readItemsXml(
  xmlContent: string,
  items: ServerItemList,
  options?: ItemsXmlReadOptions
): ItemsXmlReadResult {
  const knownAttributes = options?.knownAttributes
    ? new Set(options.knownAttributes.map((k) => k.toLowerCase()))
    : new Set<string>()
  const knownTagAttributes = options?.knownTagAttributes
    ? new Set(options.knownTagAttributes)
    : new Set(DEFAULT_KNOWN_TAG_ATTRS)

  const missingAttributes = new Set<string>()
  const missingTagAttributes = new Set<string>()

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')

    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      return { success: false, missingAttributes: [], missingTagAttributes: [] }
    }

    const root = doc.documentElement
    for (let i = 0; i < root.children.length; i++) {
      const element = root.children[i]
      if (element.tagName !== 'item') continue

      const idAttr = element.getAttribute('id')
      const fromIdAttr = element.getAttribute('fromid')
      const toIdAttr = element.getAttribute('toid')

      if (idAttr) {
        const id = parseInt(idAttr, 10)
        const item = items.getByServerId(id)
        if (item) {
          parseItemElement(
            item,
            element,
            knownTagAttributes,
            knownAttributes,
            missingTagAttributes,
            missingAttributes
          )
        }
      } else if (fromIdAttr && toIdAttr) {
        const fromId = parseInt(fromIdAttr, 10)
        const toId = parseInt(toIdAttr, 10)
        for (let rangeId = fromId; rangeId <= toId; rangeId++) {
          const item = items.getByServerId(rangeId)
          if (item) {
            parseItemElement(
              item,
              element,
              knownTagAttributes,
              knownAttributes,
              missingTagAttributes,
              missingAttributes
            )
          }
        }
      }
    }

    return {
      success: true,
      missingAttributes: Array.from(missingAttributes).sort(),
      missingTagAttributes: Array.from(missingTagAttributes).sort()
    }
  } catch {
    return { success: false, missingAttributes: [], missingTagAttributes: [] }
  }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

const DEFAULT_KNOWN_TAG_ATTRS = ['name', 'article', 'plural', 'editorsuffix']
const RESERVED_ATTRS = new Set(['id', 'fromid', 'toid'])

function parseItemElement(
  item: ServerItem,
  element: Element,
  knownTagAttributes: Set<string>,
  knownAttributes: Set<string>,
  missingTagAttributes: Set<string>,
  missingAttributes: Set<string>
): void {
  // Read ALL attributes from the <item> tag dynamically
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    if (RESERVED_ATTRS.has(attr.name)) continue

    // Track unknown tag attributes
    if (!knownTagAttributes.has(attr.name)) {
      missingTagAttributes.add(attr.name)
    }

    setItemXmlAttr(item, attr.name, attr.value)
  }

  // Parse nested <attribute> elements
  parseAttributeElements(element, item, knownAttributes, missingAttributes)
}

function parseAttributeElements(
  parentElement: Element,
  item: ServerItem,
  knownAttributes: Set<string>,
  missingAttributes: Set<string>
): void {
  for (let i = 0; i < parentElement.children.length; i++) {
    const child = parentElement.children[i]
    if (child.tagName !== 'attribute') continue

    const key = child.getAttribute('key')
    if (!key) continue

    // Check for nested child <attribute> elements
    const nestedChildren = getChildAttributeElements(child)
    if (nestedChildren.length > 0) {
      const nested: Record<string, string> = {}

      // Check for parent value (Canary style: parent has value AND children)
      const parentValue = child.getAttribute('value')
      if (parentValue) {
        nested['_parentValue'] = parentValue
      }

      for (const nestedChild of nestedChildren) {
        const childKey = nestedChild.getAttribute('key')
        const childValue = nestedChild.getAttribute('value')
        if (childKey) {
          nested[childKey] = childValue ?? ''
        }
      }

      setItemXmlAttr(item, key, nested)
    } else {
      const value = child.getAttribute('value') ?? ''
      setItemXmlAttr(item, key, value)
    }

    // Track unknown attributes (case-insensitive)
    if (knownAttributes.size > 0 && !knownAttributes.has(key.toLowerCase())) {
      missingAttributes.add(key)
    }
  }
}

function getChildAttributeElements(element: Element): Element[] {
  const result: Element[] = []
  for (let i = 0; i < element.children.length; i++) {
    if (element.children[i].tagName === 'attribute') {
      result.push(element.children[i])
    }
  }
  return result
}

function setItemXmlAttr(item: ServerItem, key: string, value: XmlAttributeValue): void {
  if (!item.xmlAttributes) item.xmlAttributes = {}
  item.xmlAttributes[key] = value
}
