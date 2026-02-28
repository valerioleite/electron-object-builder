import { describe, it, expect } from 'vitest'
import { ServerItemList } from '../server-item-list'
import { readOtb } from '../otb-reader'
import { writeOtb } from '../otb-writer'
import { SpecialChar, RootAttribute } from '../otb-constants'
import {
  createServerItem,
  ServerItemType,
  ServerItemGroup,
  ServerItemFlag,
  TileStackOrder,
  getServerItemFlags,
  setServerItemFlags,
  getServerItemGroup
} from '../../../types'

// ---------------------------------------------------------------------------
// Helper: Build a minimal OTB binary from a ServerItemList
// ---------------------------------------------------------------------------

function buildOtb(list: ServerItemList): ArrayBuffer {
  return writeOtb(list)
}

function makeList(
  opts: {
    major?: number
    minor?: number
    build?: number
    clientVersion?: number
  } = {}
): ServerItemList {
  const list = new ServerItemList()
  list.majorVersion = opts.major ?? 3
  list.minorVersion = opts.minor ?? 62
  list.buildNumber = opts.build ?? 0
  list.clientVersion = opts.clientVersion ?? 1098
  return list
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('OTB Constants', () => {
  it('should have correct SpecialChar values', () => {
    expect(SpecialChar.NODE_START).toBe(0xfe)
    expect(SpecialChar.NODE_END).toBe(0xff)
    expect(SpecialChar.ESCAPE_CHAR).toBe(0xfd)
  })

  it('should have correct RootAttribute values', () => {
    expect(RootAttribute.VERSION).toBe(0x01)
  })
})

// ---------------------------------------------------------------------------
// ServerItemList
// ---------------------------------------------------------------------------

describe('ServerItemList', () => {
  it('should start empty', () => {
    const list = new ServerItemList()
    expect(list.count).toBe(0)
    expect(list.minId).toBe(100) // default
    expect(list.maxId).toBe(100) // default
  })

  it('should add and retrieve items by server ID', () => {
    const list = new ServerItemList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    list.add(item)

    expect(list.count).toBe(1)
    expect(list.getItemById(100)).toBe(item)
    expect(list.getByServerId(100)).toBe(item)
    expect(list.hasItem(100)).toBe(true)
    expect(list.hasItem(101)).toBe(false)
  })

  it('should track items by client ID', () => {
    const list = new ServerItemList()
    const item1 = createServerItem()
    item1.id = 100
    item1.clientId = 200
    const item2 = createServerItem()
    item2.id = 101
    item2.clientId = 200
    list.add(item1)
    list.add(item2)

    expect(list.hasClientId(200)).toBe(true)
    expect(list.getItemsByClientId(200)).toHaveLength(2)
    expect(list.getFirstItemByClientId(200)).toBe(item1)
  })

  it('should track min/max IDs', () => {
    const list = new ServerItemList()
    const item1 = createServerItem()
    item1.id = 150
    const item2 = createServerItem()
    item2.id = 200
    const item3 = createServerItem()
    item3.id = 100
    list.add(item1)
    list.add(item2)
    list.add(item3)

    expect(list.minId).toBe(100)
    expect(list.maxId).toBe(200)
  })

  it('should return sorted array', () => {
    const list = new ServerItemList()
    const item1 = createServerItem()
    item1.id = 300
    const item2 = createServerItem()
    item2.id = 100
    const item3 = createServerItem()
    item3.id = 200
    list.add(item1)
    list.add(item2)
    list.add(item3)

    const arr = list.toArray()
    expect(arr.map((i) => i.id)).toEqual([100, 200, 300])
  })

  it('should remove items', () => {
    const list = new ServerItemList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    list.add(item)

    expect(list.removeItem(100)).toBe(true)
    expect(list.count).toBe(0)
    expect(list.hasItem(100)).toBe(false)
    expect(list.hasClientId(200)).toBe(false)
    expect(list.removeItem(100)).toBe(false) // already removed
  })

  it('should recalculate min/max on removal of boundary items', () => {
    const list = new ServerItemList()
    const item1 = createServerItem()
    item1.id = 100
    const item2 = createServerItem()
    item2.id = 200
    const item3 = createServerItem()
    item3.id = 300
    list.add(item1)
    list.add(item2)
    list.add(item3)

    list.removeItem(100) // Remove min
    expect(list.minId).toBe(200)

    list.removeItem(300) // Remove max
    expect(list.maxId).toBe(200)
  })

  it('should clear all items', () => {
    const list = new ServerItemList()
    const item = createServerItem()
    item.id = 100
    list.add(item)

    list.clear()
    expect(list.count).toBe(0)
  })

  it('should create missing items', () => {
    const list = new ServerItemList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 100
    list.add(item)

    const created = list.createMissingItems(103)
    expect(created).toBe(3)
    expect(list.count).toBe(4) // original + 3 new
    expect(list.hasClientId(101)).toBe(true)
    expect(list.hasClientId(102)).toBe(true)
    expect(list.hasClientId(103)).toBe(true)
  })

  it('should get max client ID', () => {
    const list = new ServerItemList()
    const item1 = createServerItem()
    item1.id = 100
    item1.clientId = 200
    const item2 = createServerItem()
    item2.id = 101
    item2.clientId = 500
    list.add(item1)
    list.add(item2)

    expect(list.getMaxClientId()).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// OTB Round-trip: Write then Read
// ---------------------------------------------------------------------------

describe('OTB Round-trip', () => {
  it('should round-trip empty OTB (no items)', () => {
    const list = makeList()
    const buffer = buildOtb(list)
    const result = readOtb(buffer)

    expect(result.items.count).toBe(0)
    expect(result.items.majorVersion).toBe(3)
    expect(result.items.minorVersion).toBe(62)
    expect(result.items.buildNumber).toBe(0)
  })

  it('should round-trip version metadata', () => {
    const list = makeList({ major: 5, minor: 10, build: 42, clientVersion: 1200 })
    const buffer = buildOtb(list)
    const result = readOtb(buffer)

    expect(result.items.majorVersion).toBe(5)
    expect(result.items.minorVersion).toBe(10)
    expect(result.items.buildNumber).toBe(42)
  })

  it('should round-trip a simple item', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.type = ServerItemType.NONE
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)

    expect(result.items.count).toBe(1)
    const loaded = result.items.getItemById(100)!
    expect(loaded).toBeDefined()
    expect(loaded.id).toBe(100)
    expect(loaded.clientId).toBe(200)
    expect(loaded.type).toBe(ServerItemType.NONE)
  })

  it('should round-trip item types (ground, container, fluid, splash, deprecated)', () => {
    const list = makeList()

    const types: [ServerItemType, number][] = [
      [ServerItemType.GROUND, 100],
      [ServerItemType.CONTAINER, 101],
      [ServerItemType.FLUID, 102],
      [ServerItemType.SPLASH, 103],
      [ServerItemType.DEPRECATED, 104]
    ]

    for (const [type, id] of types) {
      const item = createServerItem()
      item.id = id
      item.clientId = id + 1000
      item.type = type
      if (type === ServerItemType.GROUND) item.groundSpeed = 150
      list.add(item)
    }

    const buffer = buildOtb(list)
    const result = readOtb(buffer)

    expect(result.items.count).toBe(5)

    const ground = result.items.getItemById(100)!
    expect(ground.type).toBe(ServerItemType.GROUND)
    expect(ground.groundSpeed).toBe(150)

    const container = result.items.getItemById(101)!
    expect(container.type).toBe(ServerItemType.CONTAINER)

    const fluid = result.items.getItemById(102)!
    expect(fluid.type).toBe(ServerItemType.FLUID)

    const splash = result.items.getItemById(103)!
    expect(splash.type).toBe(ServerItemType.SPLASH)

    const deprecated = result.items.getItemById(104)!
    expect(deprecated.type).toBe(ServerItemType.DEPRECATED)
  })

  it('should round-trip item flags', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.unpassable = true
    item.blockMissiles = true
    item.blockPathfinder = true
    item.hasElevation = true
    item.multiUse = true
    item.pickupable = true
    item.movable = false // Default is true, explicitly false
    item.stackable = true
    item.readable = true
    item.rotatable = true
    item.hangable = true
    item.hookSouth = true
    item.hookEast = true
    item.ignoreLook = true
    item.isAnimation = true
    item.fullGround = true
    item.forceUse = true
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(100)!

    expect(loaded.unpassable).toBe(true)
    expect(loaded.blockMissiles).toBe(true)
    expect(loaded.blockPathfinder).toBe(true)
    expect(loaded.hasElevation).toBe(true)
    expect(loaded.multiUse).toBe(true)
    expect(loaded.pickupable).toBe(true)
    expect(loaded.movable).toBe(false)
    expect(loaded.stackable).toBe(true)
    expect(loaded.readable).toBe(true)
    expect(loaded.rotatable).toBe(true)
    expect(loaded.hangable).toBe(true)
    expect(loaded.hookSouth).toBe(true)
    expect(loaded.hookEast).toBe(true)
    expect(loaded.ignoreLook).toBe(true)
    expect(loaded.isAnimation).toBe(true)
    expect(loaded.fullGround).toBe(true)
    expect(loaded.forceUse).toBe(true)
  })

  it('should round-trip sprite hash', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.spriteHash = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(100)!

    expect(loaded.spriteHash).toEqual(
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    )
  })

  it('should create empty sprite hash for non-deprecated items without one', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.spriteHash = null
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(100)!

    // Reader creates a 16-byte zero hash
    expect(loaded.spriteHash).toEqual(new Uint8Array(16))
  })

  it('should round-trip numeric attributes', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.minimapColor = 12345
    item.maxReadWriteChars = 255
    item.maxReadChars = 128
    item.lightLevel = 7
    item.lightColor = 215
    item.tradeAs = 500
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(100)!

    expect(loaded.minimapColor).toBe(12345)
    expect(loaded.maxReadWriteChars).toBe(255)
    expect(loaded.maxReadChars).toBe(128)
    expect(loaded.lightLevel).toBe(7)
    expect(loaded.lightColor).toBe(215)
    expect(loaded.tradeAs).toBe(500)
  })

  it('should round-trip item name', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.name = 'magic plate armor'
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(100)!

    expect(loaded.name).toBe('magic plate armor')
  })

  it('should round-trip stack order', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.stackOrder = TileStackOrder.TOP
    item.hasStackOrder = true
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(100)!

    expect(loaded.stackOrder).toBe(TileStackOrder.TOP)
    expect(loaded.hasStackOrder).toBe(true)
  })

  it('should round-trip multiple items', () => {
    const list = makeList()

    for (let i = 100; i < 110; i++) {
      const item = createServerItem()
      item.id = i
      item.clientId = i + 1000
      item.name = `item_${i}`
      list.add(item)
    }

    const buffer = buildOtb(list)
    const result = readOtb(buffer)

    expect(result.items.count).toBe(10)
    for (let i = 100; i < 110; i++) {
      const loaded = result.items.getItemById(i)!
      expect(loaded).toBeDefined()
      expect(loaded.clientId).toBe(i + 1000)
      expect(loaded.name).toBe(`item_${i}`)
    }
  })

  it('should round-trip deprecated items (only server ID)', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 5000
    item.type = ServerItemType.DEPRECATED
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(5000)!

    expect(loaded.type).toBe(ServerItemType.DEPRECATED)
    expect(loaded.clientId).toBe(0) // not written for deprecated
    // Deprecated items don't get sprite hash
    expect(loaded.spriteHash).toBeNull()
  })

  it('should handle escape characters in data correctly', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    // Use a sprite hash containing special bytes
    item.spriteHash = new Uint8Array([
      0xfd, 0xfe, 0xff, 0x00, 0xfd, 0xfe, 0xff, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09
    ])
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(100)!

    expect(loaded.spriteHash).toEqual(
      new Uint8Array([
        0xfd, 0xfe, 0xff, 0x00, 0xfd, 0xfe, 0xff, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09
      ])
    )
  })

  it('should round-trip ground item with all ground attributes', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.type = ServerItemType.GROUND
    item.groundSpeed = 250
    item.stackOrder = TileStackOrder.NONE
    item.minimapColor = 0x7d01
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(100)!

    expect(loaded.type).toBe(ServerItemType.GROUND)
    expect(loaded.groundSpeed).toBe(250)
    expect(loaded.minimapColor).toBe(0x7d01)
  })

  it('should round-trip a complex item with all attributes', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 2160
    item.clientId = 3031
    item.type = ServerItemType.NONE
    item.name = 'crystal coin'
    item.spriteHash = new Uint8Array(16).fill(0xab)
    item.unpassable = false
    item.pickupable = true
    item.stackable = true
    item.movable = true
    item.minimapColor = 0
    item.lightLevel = 0
    item.lightColor = 0
    item.maxReadWriteChars = 0
    item.maxReadChars = 0
    item.tradeAs = 2160
    list.add(item)

    const buffer = buildOtb(list)
    const result = readOtb(buffer)
    const loaded = result.items.getItemById(2160)!

    expect(loaded.id).toBe(2160)
    expect(loaded.clientId).toBe(3031)
    expect(loaded.name).toBe('crystal coin')
    expect(loaded.pickupable).toBe(true)
    expect(loaded.stackable).toBe(true)
    expect(loaded.tradeAs).toBe(2160)
    expect(loaded.spriteHash).toEqual(new Uint8Array(16).fill(0xab))
  })
})

// ---------------------------------------------------------------------------
// Type helpers (already in types, test them here for coverage)
// ---------------------------------------------------------------------------

describe('ServerItem type helpers', () => {
  it('should get/set flags correctly', () => {
    const item = createServerItem()
    item.unpassable = true
    item.pickupable = true
    item.stackable = true

    const flags = getServerItemFlags(item)
    expect(flags & ServerItemFlag.UNPASSABLE).toBeTruthy()
    expect(flags & ServerItemFlag.PICKUPABLE).toBeTruthy()
    expect(flags & ServerItemFlag.STACKABLE).toBeTruthy()
    expect(flags & ServerItemFlag.ROTATABLE).toBeFalsy()

    const item2 = createServerItem()
    setServerItemFlags(item2, flags)
    expect(item2.unpassable).toBe(true)
    expect(item2.pickupable).toBe(true)
    expect(item2.stackable).toBe(true)
    expect(item2.rotatable).toBe(false)
  })

  it('should map ServerItemType to ServerItemGroup', () => {
    expect(getServerItemGroup(ServerItemType.GROUND)).toBe(ServerItemGroup.GROUND)
    expect(getServerItemGroup(ServerItemType.CONTAINER)).toBe(ServerItemGroup.CONTAINER)
    expect(getServerItemGroup(ServerItemType.FLUID)).toBe(ServerItemGroup.FLUID)
    expect(getServerItemGroup(ServerItemType.SPLASH)).toBe(ServerItemGroup.SPLASH)
    expect(getServerItemGroup(ServerItemType.DEPRECATED)).toBe(ServerItemGroup.DEPRECATED)
    expect(getServerItemGroup(ServerItemType.NONE)).toBe(ServerItemGroup.NONE)
  })
})

// ---------------------------------------------------------------------------
// Binary format verification
// ---------------------------------------------------------------------------

describe('OTB Binary format', () => {
  it('should start with 4-byte zero header', () => {
    const list = makeList()
    const buffer = writeOtb(list)
    const view = new DataView(buffer)
    expect(view.getUint32(0, true)).toBe(0)
  })

  it('should have NODE_START as 5th byte (root node)', () => {
    const list = makeList()
    const buffer = writeOtb(list)
    const bytes = new Uint8Array(buffer)
    expect(bytes[4]).toBe(SpecialChar.NODE_START)
  })

  it('should end with NODE_END (closing root node)', () => {
    const list = makeList()
    const buffer = writeOtb(list)
    const bytes = new Uint8Array(buffer)
    expect(bytes[bytes.length - 1]).toBe(SpecialChar.NODE_END)
  })

  it('should produce deterministic output', () => {
    const list = makeList()
    const item = createServerItem()
    item.id = 100
    item.clientId = 200
    item.name = 'test item'
    list.add(item)

    const buffer1 = writeOtb(list)
    const buffer2 = writeOtb(list)
    expect(new Uint8Array(buffer1)).toEqual(new Uint8Array(buffer2))
  })
})
