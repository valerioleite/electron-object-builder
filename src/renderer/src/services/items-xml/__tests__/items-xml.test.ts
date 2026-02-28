import { describe, it, expect } from 'vitest'
import {
  createServerItem,
  cloneServerItem,
  hasXmlData,
  getXmlAttribute,
  setXmlAttribute,
  getXmlAttributeString
} from '../../../types'
import { ServerItemList } from '../../otb/server-item-list'
import { readItemsXml } from '../items-xml-reader'
import { writeItemsXml } from '../items-xml-writer'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeList(...items: Array<{ id: number; clientId?: number }>): ServerItemList {
  const list = new ServerItemList()
  for (const { id, clientId } of items) {
    const item = createServerItem()
    item.id = id
    item.clientId = clientId ?? id
    list.add(item)
  }
  return list
}

function makeXml(content: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<items>\n${content}</items>\n`
}

// ---------------------------------------------------------------------------
// XML Attribute Helper Tests
// ---------------------------------------------------------------------------

describe('XML attribute helpers', () => {
  it('hasXmlData returns false for item without attributes', () => {
    const item = createServerItem()
    expect(hasXmlData(item)).toBe(false)
  })

  it('hasXmlData returns true for item with attributes', () => {
    const item = createServerItem()
    item.xmlAttributes = { name: 'sword' }
    expect(hasXmlData(item)).toBe(true)
  })

  it('getXmlAttribute returns value for existing key', () => {
    const item = createServerItem()
    item.xmlAttributes = { name: 'sword', weight: '50' }
    expect(getXmlAttribute(item, 'name')).toBe('sword')
    expect(getXmlAttribute(item, 'weight')).toBe('50')
  })

  it('getXmlAttribute returns undefined for missing key', () => {
    const item = createServerItem()
    item.xmlAttributes = { name: 'sword' }
    expect(getXmlAttribute(item, 'missing')).toBeUndefined()
  })

  it('getXmlAttribute returns undefined when xmlAttributes is null', () => {
    const item = createServerItem()
    expect(getXmlAttribute(item, 'name')).toBeUndefined()
  })

  it('getXmlAttributeString returns string values', () => {
    const item = createServerItem()
    item.xmlAttributes = { name: 'sword' }
    expect(getXmlAttributeString(item, 'name')).toBe('sword')
  })

  it('getXmlAttributeString returns null for nested values', () => {
    const item = createServerItem()
    item.xmlAttributes = { shootType: { _parentValue: 'distance', breakChance: '50' } }
    expect(getXmlAttributeString(item, 'shootType')).toBeNull()
  })

  it('setXmlAttribute creates xmlAttributes if null', () => {
    const item = createServerItem()
    expect(item.xmlAttributes).toBeNull()
    setXmlAttribute(item, 'name', 'sword')
    expect(item.xmlAttributes).not.toBeNull()
    expect(item.xmlAttributes!['name']).toBe('sword')
  })

  it('setXmlAttribute supports nested records', () => {
    const item = createServerItem()
    setXmlAttribute(item, 'shootType', { _parentValue: 'distance', breakChance: '50' })
    const val = getXmlAttribute(item, 'shootType') as Record<string, string>
    expect(val['_parentValue']).toBe('distance')
    expect(val['breakChance']).toBe('50')
  })

  it('cloneServerItem deep clones nested xmlAttributes', () => {
    const original = createServerItem()
    original.xmlAttributes = {
      name: 'sword',
      shootType: { _parentValue: 'distance', breakChance: '50' }
    }
    const cloned = cloneServerItem(original)

    // Values should be equal
    expect(cloned.xmlAttributes!['name']).toBe('sword')
    const nested = cloned.xmlAttributes!['shootType'] as Record<string, string>
    expect(nested['_parentValue']).toBe('distance')

    // Should be a deep copy - modifying clone should not affect original
    ;(cloned.xmlAttributes!['shootType'] as Record<string, string>)['breakChance'] = '99'
    const origNested = original.xmlAttributes!['shootType'] as Record<string, string>
    expect(origNested['breakChance']).toBe('50')
  })
})

// ---------------------------------------------------------------------------
// Reader Tests
// ---------------------------------------------------------------------------

describe('readItemsXml', () => {
  it('parses single item with name', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml('\t<item id="100" name="sword" />\n')

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    const item = list.getByServerId(100)!
    expect(item.xmlAttributes!['name']).toBe('sword')
  })

  it('parses item with all tag attributes', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml(
      '\t<item id="100" name="gold coin" article="a" plural="gold coins" editorsuffix="(100gp)" />\n'
    )

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    const item = list.getByServerId(100)!
    expect(item.xmlAttributes!['name']).toBe('gold coin')
    expect(item.xmlAttributes!['article']).toBe('a')
    expect(item.xmlAttributes!['plural']).toBe('gold coins')
    expect(item.xmlAttributes!['editorsuffix']).toBe('(100gp)')
  })

  it('parses item with nested attributes', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml(
      `\t<item id="100" name="sword">
\t\t<attribute key="weight" value="3500" />
\t\t<attribute key="attack" value="28" />
\t</item>\n`
    )

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    const item = list.getByServerId(100)!
    expect(item.xmlAttributes!['name']).toBe('sword')
    expect(item.xmlAttributes!['weight']).toBe('3500')
    expect(item.xmlAttributes!['attack']).toBe('28')
  })

  it('parses nested attributes with children (Canary style)', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml(
      `\t<item id="100" name="crossbow">
\t\t<attribute key="shootType" value="bolt">
\t\t\t<attribute key="breakChance" value="50" />
\t\t\t<attribute key="hitChance" value="90" />
\t\t</attribute>
\t</item>\n`
    )

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    const item = list.getByServerId(100)!
    const shootType = item.xmlAttributes!['shootType'] as Record<string, string>
    expect(shootType['_parentValue']).toBe('bolt')
    expect(shootType['breakChance']).toBe('50')
    expect(shootType['hitChance']).toBe('90')
  })

  it('parses nested attributes without parent value', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml(
      `\t<item id="100" name="magic item">
\t\t<attribute key="abilities">
\t\t\t<attribute key="speed" value="20" />
\t\t</attribute>
\t</item>\n`
    )

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    const item = list.getByServerId(100)!
    const abilities = item.xmlAttributes!['abilities'] as Record<string, string>
    expect(abilities['_parentValue']).toBeUndefined()
    expect(abilities['speed']).toBe('20')
  })

  it('parses item ranges (fromid/toid)', () => {
    const list = makeList({ id: 200 }, { id: 201 }, { id: 202 })
    const xml = makeXml('\t<item fromid="200" toid="202" name="grass" />\n')

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    expect(list.getByServerId(200)!.xmlAttributes!['name']).toBe('grass')
    expect(list.getByServerId(201)!.xmlAttributes!['name']).toBe('grass')
    expect(list.getByServerId(202)!.xmlAttributes!['name']).toBe('grass')
  })

  it('skips items not in ServerItemList', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml(
      '\t<item id="100" name="sword" />\n\t<item id="999" name="missing" />\n'
    )

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    expect(list.getByServerId(100)!.xmlAttributes!['name']).toBe('sword')
    // Item 999 doesn't exist, should not crash
  })

  it('detects missing nested attributes', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml(
      `\t<item id="100" name="sword">
\t\t<attribute key="weight" value="3500" />
\t\t<attribute key="customAttr" value="xyz" />
\t</item>\n`
    )

    const result = readItemsXml(xml, list, { knownAttributes: ['weight'] })

    expect(result.success).toBe(true)
    expect(result.missingAttributes).toEqual(['customAttr'])
  })

  it('detects missing tag attributes', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml('\t<item id="100" name="sword" customtag="value" />\n')

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    expect(result.missingTagAttributes).toEqual(['customtag'])
  })

  it('known attributes are case-insensitive', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml(
      `\t<item id="100" name="sword">
\t\t<attribute key="Weight" value="3500" />
\t</item>\n`
    )

    const result = readItemsXml(xml, list, { knownAttributes: ['weight'] })

    expect(result.success).toBe(true)
    expect(result.missingAttributes).toEqual([])
  })

  it('custom known tag attributes', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml('\t<item id="100" name="sword" customtag="value" />\n')

    const result = readItemsXml(xml, list, {
      knownTagAttributes: ['name', 'customtag']
    })

    expect(result.success).toBe(true)
    expect(result.missingTagAttributes).toEqual([])
  })

  it('returns failure for malformed XML', () => {
    const list = makeList({ id: 100 })
    const result = readItemsXml('<items><broken', list)

    expect(result.success).toBe(false)
  })

  it('handles empty items list', () => {
    const list = makeList()
    const xml = makeXml('')

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    expect(result.missingAttributes).toEqual([])
    expect(result.missingTagAttributes).toEqual([])
  })

  it('handles multiple items', () => {
    const list = makeList({ id: 100 }, { id: 101 }, { id: 102 })
    const xml = makeXml(
      '\t<item id="100" name="sword" />\n\t<item id="101" name="shield" />\n\t<item id="102" name="helmet" />\n'
    )

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    expect(list.getByServerId(100)!.xmlAttributes!['name']).toBe('sword')
    expect(list.getByServerId(101)!.xmlAttributes!['name']).toBe('shield')
    expect(list.getByServerId(102)!.xmlAttributes!['name']).toBe('helmet')
  })

  it('handles item with empty name', () => {
    const list = makeList({ id: 100 })
    const xml = makeXml('\t<item id="100" name="" />\n')

    const result = readItemsXml(xml, list)

    expect(result.success).toBe(true)
    expect(list.getByServerId(100)!.xmlAttributes!['name']).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Writer Tests
// ---------------------------------------------------------------------------

describe('writeItemsXml', () => {
  it('writes XML header with default encoding', () => {
    const list = makeList()
    const xml = writeItemsXml(list)

    expect(xml).toContain('<?xml version="1.0" encoding="iso-8859-1"?>')
    expect(xml).toContain('<items>')
    expect(xml).toContain('</items>')
  })

  it('writes XML header with custom encoding', () => {
    const list = makeList()
    const xml = writeItemsXml(list, { encoding: 'UTF-8' })

    expect(xml).toContain('encoding="UTF-8"')
  })

  it('writes single item with name only (self-closing)', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = { name: 'sword' }

    const xml = writeItemsXml(list)

    expect(xml).toContain('\t<item id="100" name="sword" />')
  })

  it('writes item with all tag attributes in order', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = {
      name: 'gold coin',
      article: 'a',
      plural: 'gold coins',
      editorsuffix: '(100gp)'
    }

    const xml = writeItemsXml(list)

    // article comes before name in default order
    expect(xml).toContain(
      'article="a" name="gold coin" plural="gold coins" editorsuffix="(100gp)"'
    )
  })

  it('writes item with nested attributes', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = {
      name: 'sword',
      weight: '3500',
      attack: '28'
    }

    const xml = writeItemsXml(list)

    expect(xml).toContain('<item id="100" name="sword">')
    expect(xml).toContain('\t\t<attribute key="attack" value="28" />')
    expect(xml).toContain('\t\t<attribute key="weight" value="3500" />')
    expect(xml).toContain('\t</item>')
  })

  it('writes nested record attributes', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = {
      name: 'crossbow',
      shootType: { _parentValue: 'bolt', breakChance: '50' }
    }

    const xml = writeItemsXml(list)

    expect(xml).toContain('<attribute key="shootType" value="bolt">')
    expect(xml).toContain('\t\t\t<attribute key="breakChance" value="50" />')
    expect(xml).toContain('\t\t</attribute>')
  })

  it('writes nested record without parent value', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = {
      name: 'magic item',
      abilities: { speed: '20' }
    }

    const xml = writeItemsXml(list)

    expect(xml).toContain('<attribute key="abilities">')
    expect(xml).toContain('<attribute key="speed" value="20" />')
  })

  it('uses range optimization for consecutive items', () => {
    const list = makeList({ id: 200 }, { id: 201 }, { id: 202 })
    for (let id = 200; id <= 202; id++) {
      list.getByServerId(id)!.xmlAttributes = { name: 'grass' }
    }

    const xml = writeItemsXml(list)

    expect(xml).toContain('fromid="200" toid="202" name="grass"')
    // Verify it's NOT written as individual items (no ' id="200"' with space before id)
    expect(xml).not.toContain(' id="200"')
  })

  it('does not merge non-consecutive items', () => {
    const list = makeList({ id: 200 }, { id: 202 })
    list.getByServerId(200)!.xmlAttributes = { name: 'grass' }
    list.getByServerId(202)!.xmlAttributes = { name: 'grass' }

    const xml = writeItemsXml(list)

    expect(xml).toContain('id="200"')
    expect(xml).toContain('id="202"')
    expect(xml).not.toContain('fromid')
  })

  it('does not merge items with different attributes', () => {
    const list = makeList({ id: 200 }, { id: 201 })
    list.getByServerId(200)!.xmlAttributes = { name: 'grass' }
    list.getByServerId(201)!.xmlAttributes = { name: 'stone' }

    const xml = writeItemsXml(list)

    expect(xml).toContain('id="200"')
    expect(xml).toContain('id="201"')
    expect(xml).not.toContain('fromid')
  })

  it('disables range optimization when supportsFromToId is false', () => {
    const list = makeList({ id: 200 }, { id: 201 }, { id: 202 })
    for (let id = 200; id <= 202; id++) {
      list.getByServerId(id)!.xmlAttributes = { name: 'grass' }
    }

    const xml = writeItemsXml(list, { supportsFromToId: false })

    expect(xml).toContain('id="200"')
    expect(xml).toContain('id="201"')
    expect(xml).toContain('id="202"')
    expect(xml).not.toContain('fromid')
  })

  it('skips items without XML data', () => {
    const list = makeList({ id: 100 }, { id: 101 })
    list.getByServerId(100)!.xmlAttributes = { name: 'sword' }
    // item 101 has no xmlAttributes

    const xml = writeItemsXml(list)

    expect(xml).toContain('id="100"')
    expect(xml).not.toContain('id="101"')
  })

  it('escapes XML special characters', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = { name: 'sword & shield <"great">' }

    const xml = writeItemsXml(list)

    expect(xml).toContain('name="sword &amp; shield &lt;&quot;great&quot;&gt;"')
  })

  it('writes empty name attribute', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = { name: '' }

    const xml = writeItemsXml(list)

    // name="" should still be written since name key exists and tagKey === 'name' allows empty
    expect(xml).toContain('name=""')
  })

  it('respects custom tag attribute keys', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = {
      name: 'sword',
      customTag: 'value',
      weight: '3500'
    }

    const xml = writeItemsXml(list, { tagAttributeKeys: ['name', 'customTag'] })

    // customTag should be on the tag, not nested
    expect(xml).toContain('name="sword" customTag="value"')
    expect(xml).toContain('<attribute key="weight" value="3500" />')
  })

  it('respects attribute priority', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = {
      name: 'sword',
      weight: '3500',
      attack: '28',
      defense: '10'
    }

    const xml = writeItemsXml(list, {
      attributePriority: { attack: 1, defense: 2, weight: 3 }
    })

    const attackPos = xml.indexOf('key="attack"')
    const defensePos = xml.indexOf('key="defense"')
    const weightPos = xml.indexOf('key="weight"')

    expect(attackPos).toBeLessThan(defensePos)
    expect(defensePos).toBeLessThan(weightPos)
  })

  it('handles items with only nested attributes (no tag attrs)', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = { weight: '3500' }

    const xml = writeItemsXml(list)

    expect(xml).toContain('<item id="100">')
    expect(xml).toContain('<attribute key="weight" value="3500" />')
    expect(xml).toContain('</item>')
  })
})

// ---------------------------------------------------------------------------
// Round-trip Tests
// ---------------------------------------------------------------------------

describe('round-trip (write -> read)', () => {
  it('preserves simple item data', () => {
    const list = makeList({ id: 100 }, { id: 101 })
    list.getByServerId(100)!.xmlAttributes = { name: 'sword', article: 'a' }
    list.getByServerId(101)!.xmlAttributes = { name: 'shield', article: 'a', plural: 'shields' }

    const xml = writeItemsXml(list, { supportsFromToId: false })

    // Create fresh list with same items
    const list2 = makeList({ id: 100 }, { id: 101 })
    const result = readItemsXml(xml, list2)

    expect(result.success).toBe(true)
    expect(list2.getByServerId(100)!.xmlAttributes!['name']).toBe('sword')
    expect(list2.getByServerId(100)!.xmlAttributes!['article']).toBe('a')
    expect(list2.getByServerId(101)!.xmlAttributes!['name']).toBe('shield')
    expect(list2.getByServerId(101)!.xmlAttributes!['plural']).toBe('shields')
  })

  it('preserves nested attributes', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = {
      name: 'crossbow',
      weight: '3500',
      shootType: { _parentValue: 'bolt', breakChance: '50', hitChance: '90' }
    }

    const xml = writeItemsXml(list)

    const list2 = makeList({ id: 100 })
    const result = readItemsXml(xml, list2)

    expect(result.success).toBe(true)
    const item = list2.getByServerId(100)!
    expect(item.xmlAttributes!['name']).toBe('crossbow')
    expect(item.xmlAttributes!['weight']).toBe('3500')
    const shootType = item.xmlAttributes!['shootType'] as Record<string, string>
    expect(shootType['_parentValue']).toBe('bolt')
    expect(shootType['breakChance']).toBe('50')
    expect(shootType['hitChance']).toBe('90')
  })

  it('preserves range items', () => {
    const list = makeList({ id: 200 }, { id: 201 }, { id: 202 })
    for (let id = 200; id <= 202; id++) {
      list.getByServerId(id)!.xmlAttributes = { name: 'grass', article: 'a' }
    }

    const xml = writeItemsXml(list)
    expect(xml).toContain('fromid="200" toid="202"')

    const list2 = makeList({ id: 200 }, { id: 201 }, { id: 202 })
    const result = readItemsXml(xml, list2)

    expect(result.success).toBe(true)
    for (let id = 200; id <= 202; id++) {
      expect(list2.getByServerId(id)!.xmlAttributes!['name']).toBe('grass')
      expect(list2.getByServerId(id)!.xmlAttributes!['article']).toBe('a')
    }
  })

  it('preserves special characters through XML escaping', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = { name: 'sword & shield <"great">' }

    const xml = writeItemsXml(list)

    const list2 = makeList({ id: 100 })
    const result = readItemsXml(xml, list2)

    expect(result.success).toBe(true)
    expect(list2.getByServerId(100)!.xmlAttributes!['name']).toBe('sword & shield <"great">')
  })

  it('preserves editorsuffix', () => {
    const list = makeList({ id: 100 })
    list.getByServerId(100)!.xmlAttributes = {
      name: 'gold coin',
      editorsuffix: '(100gp)'
    }

    const xml = writeItemsXml(list)

    const list2 = makeList({ id: 100 })
    const result = readItemsXml(xml, list2)

    expect(result.success).toBe(true)
    expect(list2.getByServerId(100)!.xmlAttributes!['editorsuffix']).toBe('(100gp)')
  })

  it('complex scenario with mixed items', () => {
    const list = makeList(
      { id: 100 },
      { id: 101 },
      { id: 102 },
      { id: 200 },
      { id: 201 },
      { id: 202 },
      { id: 300 }
    )

    // Single items with different data
    list.getByServerId(100)!.xmlAttributes = {
      name: 'sword',
      article: 'a',
      weight: '3500',
      attack: '28'
    }
    list.getByServerId(101)!.xmlAttributes = {
      name: 'magic plate armor',
      article: 'a',
      weight: '12000',
      armor: '17'
    }
    // Item 102 has no XML data - should be skipped

    // Range items
    for (let id = 200; id <= 202; id++) {
      list.getByServerId(id)!.xmlAttributes = { name: 'grass' }
    }

    // Item with nested attributes
    list.getByServerId(300)!.xmlAttributes = {
      name: 'crossbow',
      shootType: { _parentValue: 'bolt', breakChance: '50' }
    }

    const xml = writeItemsXml(list)

    // Verify structure
    expect(xml).toContain('id="100"')
    expect(xml).toContain('id="101"')
    expect(xml).not.toContain('id="102"') // No XML data
    expect(xml).toContain('fromid="200" toid="202"')
    expect(xml).toContain('id="300"')

    // Read back
    const list2 = makeList(
      { id: 100 },
      { id: 101 },
      { id: 102 },
      { id: 200 },
      { id: 201 },
      { id: 202 },
      { id: 300 }
    )
    const result = readItemsXml(xml, list2)

    expect(result.success).toBe(true)
    expect(list2.getByServerId(100)!.xmlAttributes!['name']).toBe('sword')
    expect(list2.getByServerId(100)!.xmlAttributes!['weight']).toBe('3500')
    expect(list2.getByServerId(101)!.xmlAttributes!['armor']).toBe('17')
    expect(list2.getByServerId(102)!.xmlAttributes).toBeNull() // No data
    expect(list2.getByServerId(200)!.xmlAttributes!['name']).toBe('grass')
    expect(list2.getByServerId(201)!.xmlAttributes!['name']).toBe('grass')
    const shootType = list2.getByServerId(300)!.xmlAttributes!['shootType'] as Record<
      string,
      string
    >
    expect(shootType['_parentValue']).toBe('bolt')
    expect(shootType['breakChance']).toBe('50')
  })
})
