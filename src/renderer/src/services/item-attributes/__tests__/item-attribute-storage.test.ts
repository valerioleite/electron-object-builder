import { describe, it, expect, beforeEach } from 'vitest'
import {
  ATTRIBUTE_DATA,
  getAvailableServers,
  getAvailableServersWithLabels,
  loadServer,
  getAttributes,
  getCurrentServer,
  getDisplayName,
  getSupportsFromToId,
  getItemsXmlEncoding,
  getCategories,
  getAttributesByCategory,
  getAttributeKeysInOrder,
  getTagAttributeKeys,
  getAttributePriority,
  searchAttributes,
  getServerMetadata,
  resetAttributeStorage
} from '../index'

beforeEach(() => {
  resetAttributeStorage()
})

// ---------------------------------------------------------------------------
// ATTRIBUTE_DATA completeness
// ---------------------------------------------------------------------------

describe('ATTRIBUTE_DATA', () => {
  it('should contain all 8 TFS server versions', () => {
    const ids = Object.keys(ATTRIBUTE_DATA).sort()
    expect(ids).toEqual([
      'tfs0.3.6',
      'tfs0.4',
      'tfs0.5',
      'tfs1.0',
      'tfs1.1',
      'tfs1.2',
      'tfs1.4',
      'tfs1.6'
    ])
  })

  it('each server should have required metadata fields', () => {
    for (const [id, data] of Object.entries(ATTRIBUTE_DATA)) {
      expect(data.server).toBe(id)
      expect(typeof data.displayName).toBe('string')
      expect(data.displayName.length).toBeGreaterThan(0)
      expect(typeof data.supportsFromToId).toBe('boolean')
      expect(typeof data.itemsXmlEncoding).toBe('string')
      expect(Array.isArray(data.attributes)).toBe(true)
      expect(data.attributes.length).toBeGreaterThan(0)
    }
  })

  it('tfs0.3.6 should not support fromToId', () => {
    expect(ATTRIBUTE_DATA['tfs0.3.6'].supportsFromToId).toBe(false)
  })

  it('all other versions should support fromToId', () => {
    for (const id of ['tfs0.4', 'tfs0.5', 'tfs1.0', 'tfs1.1', 'tfs1.2', 'tfs1.4', 'tfs1.6']) {
      expect(ATTRIBUTE_DATA[id].supportsFromToId).toBe(true)
    }
  })

  it('tfs1.4 and tfs1.6 should have iso-8859-1 encoding', () => {
    expect(ATTRIBUTE_DATA['tfs1.4'].itemsXmlEncoding).toBe('iso-8859-1')
    expect(ATTRIBUTE_DATA['tfs1.6'].itemsXmlEncoding).toBe('iso-8859-1')
  })

  it('older versions should have utf-8 encoding', () => {
    for (const id of ['tfs0.3.6', 'tfs0.4', 'tfs0.5', 'tfs1.0', 'tfs1.1', 'tfs1.2']) {
      expect(ATTRIBUTE_DATA[id].itemsXmlEncoding).toBe('utf-8')
    }
  })

  it('all attributes should have valid ItemAttribute fields', () => {
    const validTypes = ['string', 'number', 'boolean', 'mixed']
    for (const data of Object.values(ATTRIBUTE_DATA)) {
      for (const attr of data.attributes) {
        expect(typeof attr.key).toBe('string')
        expect(attr.key.length).toBeGreaterThan(0)
        expect(validTypes).toContain(attr.type)
        expect(typeof attr.category).toBe('string')
        expect(attr.category.length).toBeGreaterThan(0)
        expect(typeof attr.order).toBe('number')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Version-specific attribute counts (verified against XML files)
// ---------------------------------------------------------------------------

describe('attribute counts per version', () => {
  it('tfs0.3.6 should have 160 attributes', () => {
    expect(ATTRIBUTE_DATA['tfs0.3.6'].attributes.length).toBe(160)
  })

  it('tfs0.4 should have 161 attributes', () => {
    expect(ATTRIBUTE_DATA['tfs0.4'].attributes.length).toBe(161)
  })

  it('tfs0.5 should have 161 attributes', () => {
    expect(ATTRIBUTE_DATA['tfs0.5'].attributes.length).toBe(161)
  })

  it('tfs1.0 should have 109 attributes', () => {
    expect(ATTRIBUTE_DATA['tfs1.0'].attributes.length).toBe(109)
  })

  it('tfs1.1 should have 105 attributes', () => {
    expect(ATTRIBUTE_DATA['tfs1.1'].attributes.length).toBe(105)
  })

  it('tfs1.2 should have 105 attributes', () => {
    expect(ATTRIBUTE_DATA['tfs1.2'].attributes.length).toBe(105)
  })

  it('tfs1.4 should have 111 attributes', () => {
    expect(ATTRIBUTE_DATA['tfs1.4'].attributes.length).toBe(111)
  })

  it('tfs1.6 should have 153 attributes', () => {
    expect(ATTRIBUTE_DATA['tfs1.6'].attributes.length).toBe(153)
  })
})

// ---------------------------------------------------------------------------
// Version-specific content verification
// ---------------------------------------------------------------------------

describe('version-specific content', () => {
  it('tfs0.3.6 should have old attribute names', () => {
    const attrs = ATTRIBUTE_DATA['tfs0.3.6'].attributes
    const keys = attrs.map((a) => a.key)
    expect(keys).toContain('extraDefense')
    expect(keys).toContain('runespellname')
    expect(keys).toContain('maxHealthPoints')
    expect(keys).toContain('maxHealthPercent')
    expect(keys).toContain('preventLoss')
    expect(keys).toContain('preventDrop')
    expect(keys).not.toContain('extraDef')
    expect(keys).not.toContain('runeSpellName')
  })

  it('tfs0.3.6 should have Stats, Reflect Percent, Reflect Chance categories', () => {
    const categories = new Set(ATTRIBUTE_DATA['tfs0.3.6'].attributes.map((a) => a.category))
    expect(categories.has('Stats')).toBe(true)
    expect(categories.has('Reflect Percent')).toBe(true)
    expect(categories.has('Reflect Chance')).toBe(true)
  })

  it('tfs0.4 should have dualWield', () => {
    const keys = ATTRIBUTE_DATA['tfs0.4'].attributes.map((a) => a.key)
    expect(keys).toContain('dualWield')
  })

  it('tfs0.3.6 should NOT have dualWield', () => {
    const keys = ATTRIBUTE_DATA['tfs0.3.6'].attributes.map((a) => a.key)
    expect(keys).not.toContain('dualWield')
  })

  it('tfs1.0 should have new attribute names', () => {
    const keys = ATTRIBUTE_DATA['tfs1.0'].attributes.map((a) => a.key)
    expect(keys).toContain('extraDef')
    expect(keys).toContain('runeSpellName')
    expect(keys).toContain('maxHitPoints')
    expect(keys).toContain('maxHitPointsPercent')
    expect(keys).toContain('walkStack')
    expect(keys).toContain('blocking')
    expect(keys).not.toContain('extraDefense')
    expect(keys).not.toContain('preventLoss')
  })

  it('tfs1.0 should NOT have Stats, Reflect categories', () => {
    const categories = new Set(ATTRIBUTE_DATA['tfs1.0'].attributes.map((a) => a.category))
    expect(categories.has('Stats')).toBe(false)
    expect(categories.has('Reflect Percent')).toBe(false)
    expect(categories.has('Reflect Chance')).toBe(false)
  })

  it('tfs1.0 should have Field Absorb category', () => {
    const categories = new Set(ATTRIBUTE_DATA['tfs1.0'].attributes.map((a) => a.category))
    expect(categories.has('Field Absorb')).toBe(true)
  })

  it('tfs1.4 should have placement="tag" attributes', () => {
    const tagAttrs = ATTRIBUTE_DATA['tfs1.4'].attributes.filter((a) => a.placement === 'tag')
    const tagKeys = tagAttrs.map((a) => a.key)
    expect(tagKeys).toContain('article')
    expect(tagKeys).toContain('name')
    expect(tagKeys).toContain('plural')
    expect(tagKeys).toContain('editorsuffix')
  })

  it('tfs1.0 should NOT have placement="tag" attributes', () => {
    const tagAttrs = ATTRIBUTE_DATA['tfs1.0'].attributes.filter((a) => a.placement === 'tag')
    expect(tagAttrs.length).toBe(0)
  })

  it('tfs1.4 should have destroyTo', () => {
    const keys = ATTRIBUTE_DATA['tfs1.4'].attributes.map((a) => a.key)
    expect(keys).toContain('destroyTo')
  })

  it('tfs1.4 should have storeItem', () => {
    const keys = ATTRIBUTE_DATA['tfs1.4'].attributes.map((a) => a.key)
    expect(keys).toContain('storeItem')
  })

  it('tfs1.6 should have Boost Percent category', () => {
    const categories = new Set(ATTRIBUTE_DATA['tfs1.6'].attributes.map((a) => a.category))
    expect(categories.has('Boost Percent')).toBe(true)
  })

  it('tfs1.6 should have Magic Level Boost category', () => {
    const categories = new Set(ATTRIBUTE_DATA['tfs1.6'].attributes.map((a) => a.category))
    expect(categories.has('Magic Level Boost')).toBe(true)
  })

  it('tfs1.6 should have podium in Type values', () => {
    const typeAttr = ATTRIBUTE_DATA['tfs1.6'].attributes.find(
      (a) => a.key === 'type' && a.category === 'Type'
    )
    expect(typeAttr).toBeDefined()
    expect(typeAttr!.values).toContain('podium')
  })

  it('tfs1.6 should have leech and critical skill attributes', () => {
    const keys = ATTRIBUTE_DATA['tfs1.6'].attributes.map((a) => a.key)
    expect(keys).toContain('criticalHitChance')
    expect(keys).toContain('criticalHitAmount')
    expect(keys).toContain('lifeLeechChance')
    expect(keys).toContain('lifeLeechAmount')
    expect(keys).toContain('manaLeechChance')
    expect(keys).toContain('manaLeechAmount')
  })
})

// ---------------------------------------------------------------------------
// getAvailableServers
// ---------------------------------------------------------------------------

describe('getAvailableServers', () => {
  it('should return sorted list of 8 server IDs', () => {
    const servers = getAvailableServers()
    expect(servers).toHaveLength(8)
    expect(servers[0]).toBe('tfs0.3.6')
    expect(servers[7]).toBe('tfs1.6')
    // Verify sorted
    const sorted = [...servers].sort()
    expect(servers).toEqual(sorted)
  })
})

// ---------------------------------------------------------------------------
// getAvailableServersWithLabels
// ---------------------------------------------------------------------------

describe('getAvailableServersWithLabels', () => {
  it('should return server IDs with display names', () => {
    const servers = getAvailableServersWithLabels()
    expect(servers).toHaveLength(8)
    expect(servers[0]).toEqual({ server: 'tfs0.3.6', displayName: 'TFS 0.3.6' })
    expect(servers[7]).toEqual({ server: 'tfs1.6', displayName: 'TFS 1.6' })
  })
})

// ---------------------------------------------------------------------------
// loadServer
// ---------------------------------------------------------------------------

describe('loadServer', () => {
  it('should load tfs1.4 and set as current', () => {
    const attrs = loadServer('tfs1.4')
    expect(attrs).not.toBeNull()
    expect(attrs!.length).toBe(111)
    expect(getCurrentServer()).toBe('tfs1.4')
  })

  it('should return null for unknown server', () => {
    const attrs = loadServer('tfs99.9')
    expect(attrs).toBeNull()
    expect(getCurrentServer()).toBeNull()
  })

  it('should switch current server on subsequent load', () => {
    loadServer('tfs1.0')
    expect(getCurrentServer()).toBe('tfs1.0')
    loadServer('tfs1.6')
    expect(getCurrentServer()).toBe('tfs1.6')
  })
})

// ---------------------------------------------------------------------------
// getAttributes
// ---------------------------------------------------------------------------

describe('getAttributes', () => {
  it('should return null when no server loaded', () => {
    expect(getAttributes()).toBeNull()
  })

  it('should return attributes after loading server', () => {
    loadServer('tfs1.2')
    const attrs = getAttributes()
    expect(attrs).not.toBeNull()
    expect(attrs!.length).toBe(105)
  })
})

// ---------------------------------------------------------------------------
// getCurrentServer
// ---------------------------------------------------------------------------

describe('getCurrentServer', () => {
  it('should return null initially', () => {
    expect(getCurrentServer()).toBeNull()
  })

  it('should return loaded server name', () => {
    loadServer('tfs0.5')
    expect(getCurrentServer()).toBe('tfs0.5')
  })
})

// ---------------------------------------------------------------------------
// getDisplayName
// ---------------------------------------------------------------------------

describe('getDisplayName', () => {
  it('should return display name for known server', () => {
    expect(getDisplayName('tfs1.4')).toBe('TFS 1.4')
    expect(getDisplayName('tfs0.3.6')).toBe('TFS 0.3.6')
  })

  it('should return serverName as fallback for unknown server', () => {
    expect(getDisplayName('unknown')).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// getSupportsFromToId
// ---------------------------------------------------------------------------

describe('getSupportsFromToId', () => {
  it('should return false for tfs0.3.6', () => {
    expect(getSupportsFromToId('tfs0.3.6')).toBe(false)
  })

  it('should return true for tfs1.4', () => {
    expect(getSupportsFromToId('tfs1.4')).toBe(true)
  })

  it('should use current server when no argument', () => {
    loadServer('tfs0.3.6')
    expect(getSupportsFromToId()).toBe(false)
  })

  it('should default to true when no server loaded and no argument', () => {
    expect(getSupportsFromToId()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getItemsXmlEncoding
// ---------------------------------------------------------------------------

describe('getItemsXmlEncoding', () => {
  it('should return iso-8859-1 for tfs1.4', () => {
    expect(getItemsXmlEncoding('tfs1.4')).toBe('iso-8859-1')
  })

  it('should return utf-8 for tfs1.0', () => {
    expect(getItemsXmlEncoding('tfs1.0')).toBe('utf-8')
  })

  it('should use current server when no argument', () => {
    loadServer('tfs1.6')
    expect(getItemsXmlEncoding()).toBe('iso-8859-1')
  })

  it('should default to iso-8859-1 when no server loaded', () => {
    expect(getItemsXmlEncoding()).toBe('iso-8859-1')
  })
})

// ---------------------------------------------------------------------------
// getCategories
// ---------------------------------------------------------------------------

describe('getCategories', () => {
  it('should return empty array when no server loaded', () => {
    expect(getCategories()).toEqual([])
  })

  it('should return unique categories in definition order for tfs1.6', () => {
    loadServer('tfs1.6')
    const categories = getCategories()
    expect(categories[0]).toBe('General')
    expect(categories[1]).toBe('Type')
    expect(categories[2]).toBe('Combat')
    expect(categories).toContain('Boost Percent')
    expect(categories).toContain('Magic Level Boost')
    expect(categories).toContain('Suppress')
    // No duplicates
    expect(new Set(categories).size).toBe(categories.length)
  })

  it('should return categories with Stats and Reflect for tfs0.3.6', () => {
    loadServer('tfs0.3.6')
    const categories = getCategories()
    expect(categories).toContain('Stats')
    expect(categories).toContain('Reflect Percent')
    expect(categories).toContain('Reflect Chance')
  })

  it('should NOT contain Stats or Reflect for tfs1.0', () => {
    loadServer('tfs1.0')
    const categories = getCategories()
    expect(categories).not.toContain('Stats')
    expect(categories).not.toContain('Reflect Percent')
    expect(categories).not.toContain('Reflect Chance')
  })
})

// ---------------------------------------------------------------------------
// getAttributesByCategory
// ---------------------------------------------------------------------------

describe('getAttributesByCategory', () => {
  it('should return empty array when no server loaded', () => {
    expect(getAttributesByCategory('General')).toEqual([])
  })

  it('should return attributes for a known category', () => {
    loadServer('tfs1.6')
    const general = getAttributesByCategory('General')
    expect(general.length).toBeGreaterThan(0)
    expect(general.every((a) => a.category === 'General')).toBe(true)
    const keys = general.map((a) => a.key)
    expect(keys).toContain('name')
    expect(keys).toContain('weight')
  })

  it('should return empty for unknown category', () => {
    loadServer('tfs1.6')
    expect(getAttributesByCategory('NonExistent')).toEqual([])
  })

  it('should return correct count for Suppress in tfs0.3.6 (22)', () => {
    loadServer('tfs0.3.6')
    const suppress = getAttributesByCategory('Suppress')
    expect(suppress.length).toBe(22)
  })

  it('should return correct count for Suppress in tfs1.0 (9)', () => {
    loadServer('tfs1.0')
    const suppress = getAttributesByCategory('Suppress')
    expect(suppress.length).toBe(9)
  })
})

// ---------------------------------------------------------------------------
// getAttributeKeysInOrder
// ---------------------------------------------------------------------------

describe('getAttributeKeysInOrder', () => {
  it('should return empty array when no server loaded', () => {
    expect(getAttributeKeysInOrder()).toEqual([])
  })

  it('should return all keys in definition order', () => {
    loadServer('tfs1.4')
    const keys = getAttributeKeysInOrder()
    expect(keys.length).toBe(111)
    // First few should be from General category
    expect(keys[0]).toBe('article')
    expect(keys[1]).toBe('name')
    expect(keys[2]).toBe('plural')
  })
})

// ---------------------------------------------------------------------------
// getTagAttributeKeys
// ---------------------------------------------------------------------------

describe('getTagAttributeKeys', () => {
  it('should return empty array when no server loaded', () => {
    expect(getTagAttributeKeys()).toEqual([])
  })

  it('should return tag attributes for tfs1.4', () => {
    loadServer('tfs1.4')
    const tagKeys = getTagAttributeKeys()
    expect(tagKeys).toContain('article')
    expect(tagKeys).toContain('name')
    expect(tagKeys).toContain('plural')
    expect(tagKeys).toContain('editorsuffix')
    expect(tagKeys.length).toBe(4)
  })

  it('should return empty for tfs1.0 (no tag attributes)', () => {
    loadServer('tfs1.0')
    const tagKeys = getTagAttributeKeys()
    expect(tagKeys.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getAttributePriority
// ---------------------------------------------------------------------------

describe('getAttributePriority', () => {
  it('should return empty object when no server loaded', () => {
    expect(getAttributePriority()).toEqual({})
  })

  it('should return empty object when no attributes have explicit order', () => {
    loadServer('tfs1.4')
    const priority = getAttributePriority()
    // None of our XML files use the order attribute, so this should be empty
    expect(Object.keys(priority).length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// searchAttributes
// ---------------------------------------------------------------------------

describe('searchAttributes', () => {
  it('should return empty array when no server loaded', () => {
    expect(searchAttributes('attack')).toEqual([])
  })

  it('should find attributes by partial key match', () => {
    loadServer('tfs1.6')
    const results = searchAttributes('attack')
    expect(results.length).toBeGreaterThan(0)
    const keys = results.map((a) => a.key)
    expect(keys).toContain('attack')
    expect(keys).toContain('extraAttack')
    expect(keys).toContain('attackSpeed')
  })

  it('should be case-insensitive', () => {
    loadServer('tfs1.6')
    const lower = searchAttributes('absorb')
    const upper = searchAttributes('ABSORB')
    const mixed = searchAttributes('AbSoRb')
    expect(lower.length).toBe(upper.length)
    expect(lower.length).toBe(mixed.length)
  })

  it('should return empty for non-matching keyword', () => {
    loadServer('tfs1.6')
    expect(searchAttributes('xyznonexistent')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getServerMetadata
// ---------------------------------------------------------------------------

describe('getServerMetadata', () => {
  it('should return metadata for known server', () => {
    const meta = getServerMetadata('tfs1.6')
    expect(meta).not.toBeNull()
    expect(meta!.server).toBe('tfs1.6')
    expect(meta!.displayName).toBe('TFS 1.6')
    expect(meta!.supportsFromToId).toBe(true)
    expect(meta!.itemsXmlEncoding).toBe('iso-8859-1')
  })

  it('should return null for unknown server', () => {
    expect(getServerMetadata('unknown')).toBeNull()
  })

  it('should return metadata for tfs0.3.6', () => {
    const meta = getServerMetadata('tfs0.3.6')
    expect(meta).not.toBeNull()
    expect(meta!.supportsFromToId).toBe(false)
    expect(meta!.itemsXmlEncoding).toBe('utf-8')
  })
})

// ---------------------------------------------------------------------------
// resetAttributeStorage
// ---------------------------------------------------------------------------

describe('resetAttributeStorage', () => {
  it('should clear current server', () => {
    loadServer('tfs1.4')
    expect(getCurrentServer()).toBe('tfs1.4')
    resetAttributeStorage()
    expect(getCurrentServer()).toBeNull()
    expect(getAttributes()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Integration
// ---------------------------------------------------------------------------

describe('integration', () => {
  it('should load, query, switch, and query another server', () => {
    // Load tfs0.3.6
    loadServer('tfs0.3.6')
    expect(getCategories()).toContain('Reflect Percent')
    expect(getAttributesByCategory('Suppress').length).toBe(22)

    // Switch to tfs1.6
    loadServer('tfs1.6')
    expect(getCategories()).not.toContain('Reflect Percent')
    expect(getCategories()).toContain('Boost Percent')
    expect(getAttributesByCategory('Suppress').length).toBe(9)

    // Tag attributes only in tfs1.6
    const tagKeys = getTagAttributeKeys()
    expect(tagKeys.length).toBe(4)

    // Search across all attributes
    const absorbResults = searchAttributes('absorbPercent')
    expect(absorbResults.length).toBe(19) // 15 standard + absorbPercentEarth + 3 fieldAbsorbPercent* in tfs1.6
  })

  it('should provide consistent data for items.xml integration', () => {
    loadServer('tfs1.4')

    // Tag keys for items.xml writer
    const tagKeys = getTagAttributeKeys()
    expect(tagKeys).toEqual(['article', 'name', 'plural', 'editorsuffix'])

    // All keys for items.xml reader (known attributes)
    const allKeys = getAttributeKeysInOrder()
    expect(allKeys.length).toBe(111)
    expect(allKeys).toContain('attack')
    expect(allKeys).toContain('defense')

    // Encoding
    expect(getItemsXmlEncoding()).toBe('iso-8859-1')

    // Supports fromToId
    expect(getSupportsFromToId()).toBe(true)
  })
})
