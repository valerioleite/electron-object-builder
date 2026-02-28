import { describe, it, expect } from 'vitest'
import {
  ThingCategory,
  ThingCategoryValue,
  isValidThingCategory,
  getThingCategoryByValue,
  getThingCategoryValue,
  type ThingType,
  createThingType,
  getThingFrameGroup,
  setThingFrameGroup,
  copyThingProperties,
  cloneThingType,
  copyThingPatterns,
  getThingSpriteIndices,
  isThingTypeEmpty,
  createThing,
  addThingFrameGroupState,
  removeThingFrameGroupState,
  type ThingData,
  createThingData,
  cloneThingData
} from '../things'
import {
  AnimationMode,
  FrameGroupType,
  createFrameGroup,
  createFrameDuration,
  cloneFrameGroup
} from '../animation'
import { createSpriteData, type SpriteData } from '../sprites'

// ---------------------------------------------------------------------------
// ThingCategory
// ---------------------------------------------------------------------------

describe('ThingCategory', () => {
  it('should define all four categories', () => {
    expect(ThingCategory.ITEM).toBe('item')
    expect(ThingCategory.OUTFIT).toBe('outfit')
    expect(ThingCategory.EFFECT).toBe('effect')
    expect(ThingCategory.MISSILE).toBe('missile')
  })

  it('should have exactly 4 category keys', () => {
    const keys = Object.keys(ThingCategory)
    expect(keys).toHaveLength(4)
    expect(keys).toEqual(['ITEM', 'OUTFIT', 'EFFECT', 'MISSILE'])
  })
})

describe('ThingCategoryValue', () => {
  it('should map categories to numeric values', () => {
    expect(ThingCategoryValue[ThingCategory.ITEM]).toBe(1)
    expect(ThingCategoryValue[ThingCategory.OUTFIT]).toBe(2)
    expect(ThingCategoryValue[ThingCategory.EFFECT]).toBe(3)
    expect(ThingCategoryValue[ThingCategory.MISSILE]).toBe(4)
  })

  it('should have entries for all categories', () => {
    expect(Object.keys(ThingCategoryValue)).toHaveLength(4)
  })
})

describe('isValidThingCategory', () => {
  it('should return true for valid categories', () => {
    expect(isValidThingCategory('item')).toBe(true)
    expect(isValidThingCategory('outfit')).toBe(true)
    expect(isValidThingCategory('effect')).toBe(true)
    expect(isValidThingCategory('missile')).toBe(true)
  })

  it('should return false for invalid strings', () => {
    expect(isValidThingCategory('')).toBe(false)
    expect(isValidThingCategory('weapon')).toBe(false)
    expect(isValidThingCategory('ITEM')).toBe(false)
    expect(isValidThingCategory('Item')).toBe(false)
    expect(isValidThingCategory('items')).toBe(false)
  })

  it('should return false for numeric strings matching category values', () => {
    expect(isValidThingCategory('1')).toBe(false)
    expect(isValidThingCategory('2')).toBe(false)
    expect(isValidThingCategory('3')).toBe(false)
    expect(isValidThingCategory('4')).toBe(false)
  })

  it('should return false for whitespace and special characters', () => {
    expect(isValidThingCategory(' item')).toBe(false)
    expect(isValidThingCategory('item ')).toBe(false)
    expect(isValidThingCategory(' ')).toBe(false)
    expect(isValidThingCategory('item\n')).toBe(false)
  })
})

describe('getThingCategoryByValue', () => {
  it('should return the category for valid numeric values', () => {
    expect(getThingCategoryByValue(1)).toBe(ThingCategory.ITEM)
    expect(getThingCategoryByValue(2)).toBe(ThingCategory.OUTFIT)
    expect(getThingCategoryByValue(3)).toBe(ThingCategory.EFFECT)
    expect(getThingCategoryByValue(4)).toBe(ThingCategory.MISSILE)
  })

  it('should return null for invalid values', () => {
    expect(getThingCategoryByValue(0)).toBeNull()
    expect(getThingCategoryByValue(5)).toBeNull()
    expect(getThingCategoryByValue(-1)).toBeNull()
    expect(getThingCategoryByValue(100)).toBeNull()
  })

  it('should return null for floating point values', () => {
    expect(getThingCategoryByValue(1.5)).toBeNull()
    expect(getThingCategoryByValue(2.9)).toBeNull()
  })

  it('should return null for NaN and Infinity', () => {
    expect(getThingCategoryByValue(NaN)).toBeNull()
    expect(getThingCategoryByValue(Infinity)).toBeNull()
    expect(getThingCategoryByValue(-Infinity)).toBeNull()
  })
})

describe('getThingCategoryValue', () => {
  it('should return numeric value for each category', () => {
    expect(getThingCategoryValue(ThingCategory.ITEM)).toBe(1)
    expect(getThingCategoryValue(ThingCategory.OUTFIT)).toBe(2)
    expect(getThingCategoryValue(ThingCategory.EFFECT)).toBe(3)
    expect(getThingCategoryValue(ThingCategory.MISSILE)).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// ThingType - createThingType
// ---------------------------------------------------------------------------

describe('createThingType', () => {
  it('should create a ThingType with default id, category, and name', () => {
    const thing = createThingType()
    expect(thing.id).toBe(0)
    expect(thing.category).toBe(ThingCategory.ITEM)
    expect(thing.name).toBe('')
  })

  it('should initialize all boolean properties to false', () => {
    const thing = createThingType()
    const booleanProps: (keyof ThingType)[] = [
      'isGround',
      'isGroundBorder',
      'isOnBottom',
      'isOnTop',
      'isContainer',
      'stackable',
      'forceUse',
      'multiUse',
      'hasCharges',
      'writable',
      'writableOnce',
      'isFluidContainer',
      'isFluid',
      'isUnpassable',
      'isUnmoveable',
      'blockMissile',
      'blockPathfind',
      'noMoveAnimation',
      'pickupable',
      'hangable',
      'isVertical',
      'isHorizontal',
      'rotatable',
      'hasLight',
      'dontHide',
      'isTranslucent',
      'floorChange',
      'hasOffset',
      'hasBones',
      'hasElevation',
      'isLyingObject',
      'animateAlways',
      'miniMap',
      'isLensHelp',
      'isFullGround',
      'ignoreLook',
      'cloth',
      'isMarketItem',
      'hasDefaultAction',
      'wrappable',
      'unwrappable',
      'topEffect',
      'usable'
    ]
    for (const prop of booleanProps) {
      expect(thing[prop]).toBe(false)
    }
  })

  it('should initialize all numeric properties to 0', () => {
    const thing = createThingType()
    const numericProps: (keyof ThingType)[] = [
      'groundSpeed',
      'maxReadWriteChars',
      'maxReadChars',
      'lightLevel',
      'lightColor',
      'offsetX',
      'offsetY',
      'elevation',
      'miniMapColor',
      'lensHelp',
      'clothSlot',
      'marketCategory',
      'marketTradeAs',
      'marketShowAs',
      'marketRestrictProfession',
      'marketRestrictLevel',
      'defaultAction'
    ]
    for (const prop of numericProps) {
      expect(thing[prop]).toBe(0)
    }
  })

  it('should initialize marketName to empty string', () => {
    const thing = createThingType()
    expect(thing.marketName).toBe('')
  })

  it('should initialize bonesOffsetX with 8 zeros', () => {
    const thing = createThingType()
    expect(thing.bonesOffsetX).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(thing.bonesOffsetX).toHaveLength(8)
  })

  it('should initialize bonesOffsetY with 8 zeros', () => {
    const thing = createThingType()
    expect(thing.bonesOffsetY).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(thing.bonesOffsetY).toHaveLength(8)
  })

  it('should initialize frameGroups as empty array', () => {
    const thing = createThingType()
    expect(thing.frameGroups).toEqual([])
  })

  it('should create independent instances', () => {
    const a = createThingType()
    const b = createThingType()
    a.id = 42
    a.isGround = true
    a.bonesOffsetX[0] = 99
    expect(b.id).toBe(0)
    expect(b.isGround).toBe(false)
    expect(b.bonesOffsetX[0]).toBe(0)
  })

  it('should have independent bonesOffsetX arrays between instances', () => {
    const a = createThingType()
    const b = createThingType()
    a.bonesOffsetX[3] = 42
    a.bonesOffsetY[5] = 77
    expect(b.bonesOffsetX[3]).toBe(0)
    expect(b.bonesOffsetY[5]).toBe(0)
  })

  it('should have independent frameGroups arrays between instances', () => {
    const a = createThingType()
    const b = createThingType()
    const group = createFrameGroup()
    a.frameGroups.push(group)
    expect(b.frameGroups).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// ThingType - getThingFrameGroup / setThingFrameGroup
// ---------------------------------------------------------------------------

describe('getThingFrameGroup', () => {
  it('should return the frame group at the given index', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.width = 2
    thing.frameGroups[FrameGroupType.DEFAULT] = group

    const result = getThingFrameGroup(thing, FrameGroupType.DEFAULT)
    expect(result).toBe(group)
    expect(result!.width).toBe(2)
  })

  it('should return undefined for an unset index', () => {
    const thing = createThingType()
    expect(getThingFrameGroup(thing, FrameGroupType.DEFAULT)).toBeUndefined()
    expect(getThingFrameGroup(thing, FrameGroupType.WALKING)).toBeUndefined()
  })
})

describe('setThingFrameGroup', () => {
  it('should set the frame group at the given index', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]).toBe(group)
  })

  it('should set the frame group type on the group', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    expect(group.type).toBe(FrameGroupType.DEFAULT)

    setThingFrameGroup(thing, FrameGroupType.WALKING, group)
    expect(group.type).toBe(FrameGroupType.WALKING)
  })

  it('should overwrite an existing frame group', () => {
    const thing = createThingType()
    const group1 = createFrameGroup()
    group1.width = 1
    const group2 = createFrameGroup()
    group2.width = 3

    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group1)
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group2)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]!.width).toBe(3)
  })

  it('should allow setting both DEFAULT and WALKING groups', () => {
    const thing = createThingType()
    const idle = createFrameGroup()
    idle.frames = 1
    const walking = createFrameGroup()
    walking.frames = 5

    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    expect(thing.frameGroups[FrameGroupType.DEFAULT]!.frames).toBe(1)
    expect(thing.frameGroups[FrameGroupType.WALKING]!.frames).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// ThingType - copyThingProperties
// ---------------------------------------------------------------------------

describe('copyThingProperties', () => {
  it('should copy boolean flags from source to target', () => {
    const source = createThingType()
    source.isGround = true
    source.stackable = true
    source.pickupable = true
    source.rotatable = true
    source.hasLight = true
    source.wrappable = true
    source.topEffect = true

    const target = createThingType()
    copyThingProperties(source, target)

    expect(target.isGround).toBe(true)
    expect(target.stackable).toBe(true)
    expect(target.pickupable).toBe(true)
    expect(target.rotatable).toBe(true)
    expect(target.hasLight).toBe(true)
    expect(target.wrappable).toBe(true)
    expect(target.topEffect).toBe(true)
  })

  it('should copy numeric values from source to target', () => {
    const source = createThingType()
    source.groundSpeed = 100
    source.lightLevel = 7
    source.lightColor = 215
    source.offsetX = 8
    source.offsetY = 16
    source.elevation = 24
    source.miniMapColor = 180
    source.lensHelp = 1112
    source.clothSlot = 3
    source.marketCategory = 5
    source.marketTradeAs = 200
    source.defaultAction = 2

    const target = createThingType()
    copyThingProperties(source, target)

    expect(target.groundSpeed).toBe(100)
    expect(target.lightLevel).toBe(7)
    expect(target.lightColor).toBe(215)
    expect(target.offsetX).toBe(8)
    expect(target.offsetY).toBe(16)
    expect(target.elevation).toBe(24)
    expect(target.miniMapColor).toBe(180)
    expect(target.lensHelp).toBe(1112)
    expect(target.clothSlot).toBe(3)
    expect(target.marketCategory).toBe(5)
    expect(target.marketTradeAs).toBe(200)
    expect(target.defaultAction).toBe(2)
  })

  it('should NOT copy id, category, or name', () => {
    const source = createThingType()
    source.id = 100
    source.category = ThingCategory.OUTFIT
    source.name = 'Test'

    const target = createThingType()
    target.id = 50
    target.category = ThingCategory.ITEM
    target.name = 'Original'

    copyThingProperties(source, target)

    expect(target.id).toBe(50)
    expect(target.category).toBe(ThingCategory.ITEM)
    expect(target.name).toBe('Original')
  })

  it('should NOT copy frameGroups', () => {
    const source = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [1, 2, 3]
    setThingFrameGroup(source, FrameGroupType.DEFAULT, group)

    const target = createThingType()
    copyThingProperties(source, target)

    expect(target.frameGroups).toEqual([])
  })

  it('should copy marketName', () => {
    const source = createThingType()
    source.marketName = 'Golden Armor'
    const target = createThingType()
    copyThingProperties(source, target)
    expect(target.marketName).toBe('Golden Armor')
  })

  it('should slice bonesOffsetX and bonesOffsetY (new arrays)', () => {
    const source = createThingType()
    source.bonesOffsetX = [1, 2, 3, 4, 5, 6, 7, 8]
    source.bonesOffsetY = [10, 20, 30, 40, 50, 60, 70, 80]

    const target = createThingType()
    copyThingProperties(source, target)

    expect(target.bonesOffsetX).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(target.bonesOffsetY).toEqual([10, 20, 30, 40, 50, 60, 70, 80])

    // Verify they are new arrays (not the same reference)
    expect(target.bonesOffsetX).not.toBe(source.bonesOffsetX)
    expect(target.bonesOffsetY).not.toBe(source.bonesOffsetY)

    // Mutating target should not affect source
    target.bonesOffsetX[0] = 999
    expect(source.bonesOffsetX[0]).toBe(1)
  })

  it('should copy ALL boolean properties exhaustively', () => {
    const source = createThingType()
    // Set every boolean property to true
    source.isGround = true
    source.isGroundBorder = true
    source.isOnBottom = true
    source.isOnTop = true
    source.isContainer = true
    source.stackable = true
    source.forceUse = true
    source.multiUse = true
    source.hasCharges = true
    source.writable = true
    source.writableOnce = true
    source.isFluidContainer = true
    source.isFluid = true
    source.isUnpassable = true
    source.isUnmoveable = true
    source.blockMissile = true
    source.blockPathfind = true
    source.noMoveAnimation = true
    source.pickupable = true
    source.hangable = true
    source.isVertical = true
    source.isHorizontal = true
    source.rotatable = true
    source.hasLight = true
    source.dontHide = true
    source.isTranslucent = true
    source.floorChange = true
    source.hasOffset = true
    source.hasBones = true
    source.hasElevation = true
    source.isLyingObject = true
    source.animateAlways = true
    source.miniMap = true
    source.isLensHelp = true
    source.isFullGround = true
    source.ignoreLook = true
    source.cloth = true
    source.isMarketItem = true
    source.hasDefaultAction = true
    source.wrappable = true
    source.unwrappable = true
    source.topEffect = true
    source.usable = true

    const target = createThingType()
    copyThingProperties(source, target)

    expect(target.isGround).toBe(true)
    expect(target.isGroundBorder).toBe(true)
    expect(target.isOnBottom).toBe(true)
    expect(target.isOnTop).toBe(true)
    expect(target.isContainer).toBe(true)
    expect(target.stackable).toBe(true)
    expect(target.forceUse).toBe(true)
    expect(target.multiUse).toBe(true)
    expect(target.hasCharges).toBe(true)
    expect(target.writable).toBe(true)
    expect(target.writableOnce).toBe(true)
    expect(target.isFluidContainer).toBe(true)
    expect(target.isFluid).toBe(true)
    expect(target.isUnpassable).toBe(true)
    expect(target.isUnmoveable).toBe(true)
    expect(target.blockMissile).toBe(true)
    expect(target.blockPathfind).toBe(true)
    expect(target.noMoveAnimation).toBe(true)
    expect(target.pickupable).toBe(true)
    expect(target.hangable).toBe(true)
    expect(target.isVertical).toBe(true)
    expect(target.isHorizontal).toBe(true)
    expect(target.rotatable).toBe(true)
    expect(target.hasLight).toBe(true)
    expect(target.dontHide).toBe(true)
    expect(target.isTranslucent).toBe(true)
    expect(target.floorChange).toBe(true)
    expect(target.hasOffset).toBe(true)
    expect(target.hasBones).toBe(true)
    expect(target.hasElevation).toBe(true)
    expect(target.isLyingObject).toBe(true)
    expect(target.animateAlways).toBe(true)
    expect(target.miniMap).toBe(true)
    expect(target.isLensHelp).toBe(true)
    expect(target.isFullGround).toBe(true)
    expect(target.ignoreLook).toBe(true)
    expect(target.cloth).toBe(true)
    expect(target.isMarketItem).toBe(true)
    expect(target.hasDefaultAction).toBe(true)
    expect(target.wrappable).toBe(true)
    expect(target.unwrappable).toBe(true)
    expect(target.topEffect).toBe(true)
    expect(target.usable).toBe(true)
  })

  it('should copy ALL numeric properties exhaustively', () => {
    const source = createThingType()
    source.groundSpeed = 100
    source.maxReadWriteChars = 250
    source.maxReadChars = 500
    source.lightLevel = 7
    source.lightColor = 215
    source.offsetX = 8
    source.offsetY = 16
    source.elevation = 24
    source.miniMapColor = 180
    source.lensHelp = 1112
    source.clothSlot = 3
    source.marketCategory = 5
    source.marketTradeAs = 200
    source.marketShowAs = 201
    source.marketRestrictProfession = 15
    source.marketRestrictLevel = 80
    source.defaultAction = 2

    const target = createThingType()
    copyThingProperties(source, target)

    expect(target.groundSpeed).toBe(100)
    expect(target.maxReadWriteChars).toBe(250)
    expect(target.maxReadChars).toBe(500)
    expect(target.lightLevel).toBe(7)
    expect(target.lightColor).toBe(215)
    expect(target.offsetX).toBe(8)
    expect(target.offsetY).toBe(16)
    expect(target.elevation).toBe(24)
    expect(target.miniMapColor).toBe(180)
    expect(target.lensHelp).toBe(1112)
    expect(target.clothSlot).toBe(3)
    expect(target.marketCategory).toBe(5)
    expect(target.marketTradeAs).toBe(200)
    expect(target.marketShowAs).toBe(201)
    expect(target.marketRestrictProfession).toBe(15)
    expect(target.marketRestrictLevel).toBe(80)
    expect(target.defaultAction).toBe(2)
  })

  it('should not mutate the source object', () => {
    const source = createThingType()
    source.isGround = true
    source.groundSpeed = 100
    source.bonesOffsetX = [1, 2, 3, 4, 5, 6, 7, 8]

    const target = createThingType()
    copyThingProperties(source, target)

    // Mutate target
    target.isGround = false
    target.groundSpeed = 999
    target.bonesOffsetX[0] = 999

    // Source should remain unchanged
    expect(source.isGround).toBe(true)
    expect(source.groundSpeed).toBe(100)
    expect(source.bonesOffsetX[0]).toBe(1)
  })

  it('should overwrite existing target values', () => {
    const source = createThingType()
    source.isGround = false
    source.groundSpeed = 0

    const target = createThingType()
    target.isGround = true
    target.groundSpeed = 999

    copyThingProperties(source, target)

    expect(target.isGround).toBe(false)
    expect(target.groundSpeed).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// ThingType - cloneThingType
// ---------------------------------------------------------------------------

describe('cloneThingType', () => {
  it('should clone id, category, and name', () => {
    const thing = createThingType()
    thing.id = 42
    thing.category = ThingCategory.EFFECT
    thing.name = 'Fireball'

    const clone = cloneThingType(thing)
    expect(clone.id).toBe(42)
    expect(clone.category).toBe(ThingCategory.EFFECT)
    expect(clone.name).toBe('Fireball')
  })

  it('should clone all properties', () => {
    const thing = createThingType()
    thing.isGround = true
    thing.groundSpeed = 150
    thing.hasLight = true
    thing.lightLevel = 5
    thing.lightColor = 200
    thing.cloth = true
    thing.clothSlot = 7
    thing.isMarketItem = true
    thing.marketName = 'Test Item'

    const clone = cloneThingType(thing)
    expect(clone.isGround).toBe(true)
    expect(clone.groundSpeed).toBe(150)
    expect(clone.hasLight).toBe(true)
    expect(clone.lightLevel).toBe(5)
    expect(clone.lightColor).toBe(200)
    expect(clone.cloth).toBe(true)
    expect(clone.clothSlot).toBe(7)
    expect(clone.isMarketItem).toBe(true)
    expect(clone.marketName).toBe('Test Item')
  })

  it('should deep-clone frame groups', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.width = 2
    group.height = 2
    group.spriteIndex = [10, 20, 30, 40]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    const clone = cloneThingType(thing)
    const clonedGroup = clone.frameGroups[FrameGroupType.DEFAULT]!

    expect(clonedGroup).not.toBe(group)
    expect(clonedGroup.width).toBe(2)
    expect(clonedGroup.height).toBe(2)
    expect(clonedGroup.spriteIndex).toEqual([10, 20, 30, 40])
    expect(clonedGroup.spriteIndex).not.toBe(group.spriteIndex)
  })

  it('should clone both DEFAULT and WALKING groups', () => {
    const thing = createThingType()
    const idle = createFrameGroup()
    idle.spriteIndex = [1, 2, 3, 4]
    idle.patternX = 4
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.spriteIndex = [5, 6, 7, 8]
    walking.patternX = 4
    walking.frames = 2
    walking.isAnimation = true
    walking.frameDurations = [createFrameDuration(100, 200), createFrameDuration(150, 250)]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    const clone = cloneThingType(thing)
    expect(clone.frameGroups[FrameGroupType.DEFAULT]).toBeDefined()
    expect(clone.frameGroups[FrameGroupType.WALKING]).toBeDefined()

    expect(clone.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex).toEqual([1, 2, 3, 4])
    expect(clone.frameGroups[FrameGroupType.WALKING]!.spriteIndex).toEqual([5, 6, 7, 8])

    // Should be independent copies
    expect(clone.frameGroups[FrameGroupType.DEFAULT]).not.toBe(idle)
    expect(clone.frameGroups[FrameGroupType.WALKING]).not.toBe(walking)
  })

  it('should handle thing with no frame groups', () => {
    const thing = createThingType()
    const clone = cloneThingType(thing)
    expect(clone.frameGroups).toEqual([])
  })

  it('should deep-clone frame durations independently', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.frames = 2
    group.isAnimation = true
    group.frameDurations = [createFrameDuration(100, 200), createFrameDuration(300, 400)]
    group.spriteIndex = [1, 2]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    const clone = cloneThingType(thing)
    const clonedDurations = clone.frameGroups[FrameGroupType.DEFAULT]!.frameDurations!

    // Should be new array and new duration objects
    expect(clonedDurations).not.toBe(group.frameDurations)
    expect(clonedDurations[0]).not.toBe(group.frameDurations![0])
    expect(clonedDurations[0]).toEqual({ minimum: 100, maximum: 200 })
    expect(clonedDurations[1]).toEqual({ minimum: 300, maximum: 400 })

    // Mutating cloned durations should not affect original
    clonedDurations[0].minimum = 999
    expect(group.frameDurations![0].minimum).toBe(100)
  })

  it('should deep-clone bones offset arrays independently', () => {
    const thing = createThingType()
    thing.bonesOffsetX = [10, 20, 30, 40, 50, 60, 70, 80]
    thing.bonesOffsetY = [11, 21, 31, 41, 51, 61, 71, 81]

    const clone = cloneThingType(thing)
    expect(clone.bonesOffsetX).toEqual([10, 20, 30, 40, 50, 60, 70, 80])
    expect(clone.bonesOffsetY).toEqual([11, 21, 31, 41, 51, 61, 71, 81])

    clone.bonesOffsetX[0] = 999
    clone.bonesOffsetY[0] = 999
    expect(thing.bonesOffsetX[0]).toBe(10)
    expect(thing.bonesOffsetY[0]).toBe(11)
  })

  it('should produce an independent clone (mutations do not propagate)', () => {
    const thing = createThingType()
    thing.id = 10
    thing.isGround = true
    const group = createFrameGroup()
    group.spriteIndex = [1]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    const clone = cloneThingType(thing)
    clone.id = 20
    clone.isGround = false
    clone.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex[0] = 999

    expect(thing.id).toBe(10)
    expect(thing.isGround).toBe(true)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex[0]).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// ThingType - copyThingPatterns
// ---------------------------------------------------------------------------

describe('copyThingPatterns', () => {
  it('should copy frame group structure from source to target', () => {
    const source = createThingType()
    const group = createFrameGroup()
    group.width = 2
    group.height = 2
    group.patternX = 4
    group.frames = 3
    group.spriteIndex = [10, 20, 30, 40, 50, 60, 70, 80]
    setThingFrameGroup(source, FrameGroupType.DEFAULT, group)

    const target = createThingType()
    copyThingPatterns(source, target)

    const targetGroup = target.frameGroups[FrameGroupType.DEFAULT]!
    expect(targetGroup.width).toBe(2)
    expect(targetGroup.height).toBe(2)
    expect(targetGroup.patternX).toBe(4)
    expect(targetGroup.frames).toBe(3)
  })

  it('should zero all spriteIndex values', () => {
    const source = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [10, 20, 30, 40]
    setThingFrameGroup(source, FrameGroupType.DEFAULT, group)

    const target = createThingType()
    copyThingPatterns(source, target)

    const targetGroup = target.frameGroups[FrameGroupType.DEFAULT]!
    expect(targetGroup.spriteIndex).toEqual([0, 0, 0, 0])
    expect(targetGroup.spriteIndex).toHaveLength(4)
  })

  it('should copy both DEFAULT and WALKING groups', () => {
    const source = createThingType()
    const idle = createFrameGroup()
    idle.spriteIndex = [1, 2]
    setThingFrameGroup(source, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.spriteIndex = [3, 4, 5]
    setThingFrameGroup(source, FrameGroupType.WALKING, walking)

    const target = createThingType()
    copyThingPatterns(source, target)

    expect(target.frameGroups[FrameGroupType.DEFAULT]).toBeDefined()
    expect(target.frameGroups[FrameGroupType.WALKING]).toBeDefined()
    expect(target.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex).toEqual([0, 0])
    expect(target.frameGroups[FrameGroupType.WALKING]!.spriteIndex).toEqual([0, 0, 0])
  })

  it('should clear existing target frameGroups', () => {
    const source = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [1]
    setThingFrameGroup(source, FrameGroupType.DEFAULT, group)

    const target = createThingType()
    const existingGroup = createFrameGroup()
    existingGroup.spriteIndex = [99, 98, 97]
    setThingFrameGroup(target, FrameGroupType.DEFAULT, existingGroup)
    setThingFrameGroup(target, FrameGroupType.WALKING, cloneFrameGroup(existingGroup))

    copyThingPatterns(source, target)

    // Target should now only have DEFAULT (matching source)
    expect(target.frameGroups[FrameGroupType.DEFAULT]).toBeDefined()
    expect(target.frameGroups[FrameGroupType.WALKING]).toBeUndefined()
    expect(target.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex).toEqual([0])
  })

  it('should handle source with no frame groups', () => {
    const source = createThingType()
    const target = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [1, 2, 3]
    setThingFrameGroup(target, FrameGroupType.DEFAULT, group)

    copyThingPatterns(source, target)
    expect(target.frameGroups).toEqual([])
  })

  it('should preserve animation data (isAnimation, frameDurations) but zero sprite indices', () => {
    const source = createThingType()
    const group = createFrameGroup()
    group.frames = 3
    group.isAnimation = true
    group.frameDurations = [
      createFrameDuration(100, 200),
      createFrameDuration(200, 300),
      createFrameDuration(300, 400)
    ]
    group.spriteIndex = [10, 20, 30]
    setThingFrameGroup(source, FrameGroupType.DEFAULT, group)

    const target = createThingType()
    copyThingPatterns(source, target)

    const targetGroup = target.frameGroups[FrameGroupType.DEFAULT]!
    expect(targetGroup.frames).toBe(3)
    expect(targetGroup.isAnimation).toBe(true)
    expect(targetGroup.frameDurations).toHaveLength(3)
    expect(targetGroup.spriteIndex).toEqual([0, 0, 0])
  })

  it('should produce deep clone that does not share references with source', () => {
    const source = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [10, 20]
    setThingFrameGroup(source, FrameGroupType.DEFAULT, group)

    const target = createThingType()
    copyThingPatterns(source, target)

    const targetGroup = target.frameGroups[FrameGroupType.DEFAULT]!
    // Even though zeroed, spriteIndex is a new array
    expect(targetGroup.spriteIndex).not.toBe(group.spriteIndex)

    // Mutating target should not affect source
    targetGroup.width = 99
    expect(group.width).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// ThingType - getThingSpriteIndices
// ---------------------------------------------------------------------------

describe('getThingSpriteIndices', () => {
  it('should return flat array of all sprite indices from all groups', () => {
    const thing = createThingType()
    const idle = createFrameGroup()
    idle.spriteIndex = [1, 2, 3]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.spriteIndex = [4, 5, 6, 7]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    expect(getThingSpriteIndices(thing)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('should return empty array for thing with no frame groups', () => {
    const thing = createThingType()
    expect(getThingSpriteIndices(thing)).toEqual([])
  })

  it('should return indices from a single DEFAULT group', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [100, 200, 300]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    expect(getThingSpriteIndices(thing)).toEqual([100, 200, 300])
  })

  it('should include zero indices', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [0, 5, 0, 10]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    expect(getThingSpriteIndices(thing)).toEqual([0, 5, 0, 10])
  })

  it('should handle sparse frameGroups array (gap between DEFAULT and WALKING)', () => {
    const thing = createThingType()
    // Only set WALKING (index 1), leaving DEFAULT (index 0) as undefined
    const walking = createFrameGroup()
    walking.spriteIndex = [50, 60]
    thing.frameGroups[FrameGroupType.WALKING] = walking

    const result = getThingSpriteIndices(thing)
    // Should skip the undefined DEFAULT group and return WALKING sprites
    expect(result).toEqual([50, 60])
  })

  it('should return empty array when frame groups have empty spriteIndex', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = []
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    expect(getThingSpriteIndices(thing)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// ThingType - isThingTypeEmpty
// ---------------------------------------------------------------------------

describe('isThingTypeEmpty', () => {
  it('should return true when DEFAULT group spriteIndex are all 0', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [0, 0, 0, 0]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    expect(isThingTypeEmpty(thing)).toBe(true)
  })

  it('should return false when any sprite index is non-zero', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [0, 0, 5, 0]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    expect(isThingTypeEmpty(thing)).toBe(false)
  })

  it('should return true when there is no DEFAULT frame group', () => {
    const thing = createThingType()
    expect(isThingTypeEmpty(thing)).toBe(true)
  })

  it('should ignore WALKING group (only checks DEFAULT)', () => {
    const thing = createThingType()
    const idle = createFrameGroup()
    idle.spriteIndex = [0, 0]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.spriteIndex = [10, 20]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    expect(isThingTypeEmpty(thing)).toBe(true)
  })

  it('should return false for a single non-zero sprite', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = [1]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    expect(isThingTypeEmpty(thing)).toBe(false)
  })

  it('should return true for an empty spriteIndex array', () => {
    const thing = createThingType()
    const group = createFrameGroup()
    group.spriteIndex = []
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    expect(isThingTypeEmpty(thing)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ThingType - createThing
// ---------------------------------------------------------------------------

describe('createThing', () => {
  it('should create an item with DEFAULT frame group', () => {
    const thing = createThing(100, ThingCategory.ITEM, false, 500)
    expect(thing.id).toBe(100)
    expect(thing.category).toBe(ThingCategory.ITEM)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]).toBeDefined()
    expect(thing.frameGroups[FrameGroupType.WALKING]).toBeUndefined()
  })

  it('should create an item with 1x1 patterns and 1 sprite slot', () => {
    const thing = createThing(100, ThingCategory.ITEM, false, 500)
    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.patternX).toBe(1)
    expect(group.patternY).toBe(1)
    expect(group.spriteIndex).toEqual([0])
  })

  it('should create an outfit without frame groups (single DEFAULT)', () => {
    const thing = createThing(1, ThingCategory.OUTFIT, false, 300)
    expect(thing.id).toBe(1)
    expect(thing.category).toBe(ThingCategory.OUTFIT)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]).toBeDefined()
    expect(thing.frameGroups[FrameGroupType.WALKING]).toBeUndefined()
  })

  it('should create an outfit with frame groups (DEFAULT + WALKING)', () => {
    const thing = createThing(1, ThingCategory.OUTFIT, true, 300)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]).toBeDefined()
    expect(thing.frameGroups[FrameGroupType.WALKING]).toBeDefined()
  })

  it('should create outfit frame groups with 4-direction patternX', () => {
    const thing = createThing(1, ThingCategory.OUTFIT, false, 300)
    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.patternX).toBe(4)
  })

  it('should create outfit frame groups with correct sprite count (4 dirs)', () => {
    const thing = createThing(1, ThingCategory.OUTFIT, false, 300)
    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    // 1*1*4*1*1*1*1 = 4 sprites
    expect(group.spriteIndex).toHaveLength(4)
    expect(group.spriteIndex.every((idx) => idx === 0)).toBe(true)
  })

  it('should create outfit with frame duration using provided duration', () => {
    const thing = createThing(1, ThingCategory.OUTFIT, false, 300)
    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.frameDurations).toBeDefined()
    expect(group.frameDurations![0].minimum).toBe(300)
    expect(group.frameDurations![0].maximum).toBe(300)
  })

  it('should create an effect with DEFAULT frame group (1x1)', () => {
    const thing = createThing(1, ThingCategory.EFFECT, false, 100)
    expect(thing.category).toBe(ThingCategory.EFFECT)
    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.patternX).toBe(1)
    expect(group.patternY).toBe(1)
    expect(group.spriteIndex).toEqual([0])
  })

  it('should create a missile with 3x3 patterns', () => {
    const thing = createThing(1, ThingCategory.MISSILE, false, 75)
    expect(thing.category).toBe(ThingCategory.MISSILE)
    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.patternX).toBe(3)
    expect(group.patternY).toBe(3)
    // 1*1*3*3*1*1*1 = 9 sprites
    expect(group.spriteIndex).toHaveLength(9)
    expect(group.spriteIndex.every((idx) => idx === 0)).toBe(true)
  })

  it('should throw for invalid category', () => {
    expect(() => createThing(1, 'invalid' as ThingCategory, false, 500)).toThrow(
      'Invalid category: invalid'
    )
  })

  it('should set group types correctly for outfit with frame groups', () => {
    const thing = createThing(1, ThingCategory.OUTFIT, true, 300)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]!.type).toBe(FrameGroupType.DEFAULT)
    expect(thing.frameGroups[FrameGroupType.WALKING]!.type).toBe(FrameGroupType.WALKING)
  })

  it('should initialize all property flags to defaults for all categories', () => {
    const categories: ThingCategory[] = [
      ThingCategory.ITEM,
      ThingCategory.OUTFIT,
      ThingCategory.EFFECT,
      ThingCategory.MISSILE
    ]
    for (const cat of categories) {
      const thing = createThing(1, cat, false, 300)
      expect(thing.isGround).toBe(false)
      expect(thing.stackable).toBe(false)
      expect(thing.hasLight).toBe(false)
      expect(thing.name).toBe('')
    }
  })

  it('should use the provided id for all categories', () => {
    expect(createThing(42, ThingCategory.ITEM, false, 500).id).toBe(42)
    expect(createThing(99, ThingCategory.OUTFIT, false, 300).id).toBe(99)
    expect(createThing(7, ThingCategory.EFFECT, false, 100).id).toBe(7)
    expect(createThing(3, ThingCategory.MISSILE, false, 75).id).toBe(3)
  })

  it('should create missile with all sprite slots set to 0', () => {
    const thing = createThing(1, ThingCategory.MISSILE, false, 75)
    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.spriteIndex).toHaveLength(9)
    for (const idx of group.spriteIndex) {
      expect(idx).toBe(0)
    }
  })

  it('should not create WALKING group for non-outfit categories even with useFrameGroups=true', () => {
    const item = createThing(1, ThingCategory.ITEM, true, 500)
    expect(item.frameGroups[FrameGroupType.WALKING]).toBeUndefined()

    const effect = createThing(1, ThingCategory.EFFECT, true, 100)
    expect(effect.frameGroups[FrameGroupType.WALKING]).toBeUndefined()

    const missile = createThing(1, ThingCategory.MISSILE, true, 75)
    expect(missile.frameGroups[FrameGroupType.WALKING]).toBeUndefined()
  })

  it('should create outfit with both groups having matching patternX and duration', () => {
    const thing = createThing(1, ThingCategory.OUTFIT, true, 250)
    const idle = thing.frameGroups[FrameGroupType.DEFAULT]!
    const walking = thing.frameGroups[FrameGroupType.WALKING]!

    expect(idle.patternX).toBe(4)
    expect(walking.patternX).toBe(4)
    expect(idle.frameDurations![0]).toEqual({ minimum: 250, maximum: 250 })
    expect(walking.frameDurations![0]).toEqual({ minimum: 250, maximum: 250 })
  })

  it('should create effect with DEFAULT group having patternX=1 and patternY=1', () => {
    const thing = createThing(1, ThingCategory.EFFECT, false, 100)
    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.patternX).toBe(1)
    expect(group.patternY).toBe(1)
    expect(group.patternZ).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// ThingType - addThingFrameGroupState
// ---------------------------------------------------------------------------

describe('addThingFrameGroupState', () => {
  function createOutfitWith4DirNFrames(n: number): ThingType {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT
    const group = createFrameGroup()
    group.patternX = 4
    group.frames = n
    // Total sprites = 1*1 * 4 * 1 * 1 * n = 4*n
    group.spriteIndex = Array.from({ length: 4 * n }, (_, i) => i + 1)
    if (n > 1) {
      group.isAnimation = true
      group.frameDurations = Array.from({ length: n }, () => createFrameDuration(200, 300))
    }
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)
    return thing
  }

  it('should not split if frames < 3', () => {
    const thing = createOutfitWith4DirNFrames(2)
    addThingFrameGroupState(thing, false, 300)
    // Should remain unchanged - only DEFAULT, no WALKING
    expect(thing.frameGroups[FrameGroupType.WALKING]).toBeUndefined()
    expect(thing.frameGroups[FrameGroupType.DEFAULT]!.frames).toBe(2)
  })

  it('should not split if no DEFAULT group', () => {
    const thing = createThingType()
    addThingFrameGroupState(thing, false, 300)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]).toBeUndefined()
    expect(thing.frameGroups[FrameGroupType.WALKING]).toBeUndefined()
  })

  it('should split 3-frame group into idle (1 frame) + walking (2 frames)', () => {
    const thing = createOutfitWith4DirNFrames(3)
    addThingFrameGroupState(thing, false, 300)

    const idle = thing.frameGroups[FrameGroupType.DEFAULT]!
    const walking = thing.frameGroups[FrameGroupType.WALKING]!

    expect(idle.frames).toBe(1)
    expect(walking.frames).toBe(2)
  })

  it('should set idle spriteIndex to first frame sprites', () => {
    // 4 dirs, 3 frames => 12 sprites total: [1..12]
    // idleSprites = 4 (one frame of 4 dirs)
    const thing = createOutfitWith4DirNFrames(3)
    addThingFrameGroupState(thing, false, 300)

    const idle = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(idle.spriteIndex).toEqual([1, 2, 3, 4])
  })

  it('should set walking spriteIndex to remaining frames', () => {
    const thing = createOutfitWith4DirNFrames(3)
    addThingFrameGroupState(thing, false, 300)

    const walking = thing.frameGroups[FrameGroupType.WALKING]!
    // Walking gets frames-1 = 2 frames, 4 dirs each => sprites [5..12]
    expect(walking.spriteIndex).toEqual([5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('should set idle as non-animation', () => {
    const thing = createOutfitWith4DirNFrames(4)
    addThingFrameGroupState(thing, false, 300)

    const idle = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(idle.isAnimation).toBe(false)
    expect(idle.frameDurations).toBeNull()
    expect(idle.animationMode).toBe(AnimationMode.ASYNCHRONOUS)
    expect(idle.loopCount).toBe(0)
    expect(idle.startFrame).toBe(0)
  })

  it('should set walking as animation when frames > 1', () => {
    const thing = createOutfitWith4DirNFrames(4)
    addThingFrameGroupState(thing, false, 300)

    const walking = thing.frameGroups[FrameGroupType.WALKING]!
    expect(walking.isAnimation).toBe(true)
    expect(walking.animationMode).toBe(AnimationMode.ASYNCHRONOUS)
  })

  it('should use default duration when improvedAnimations is false', () => {
    const thing = createOutfitWith4DirNFrames(4)
    addThingFrameGroupState(thing, false, 300)

    const walking = thing.frameGroups[FrameGroupType.WALKING]!
    expect(walking.frameDurations).toHaveLength(3)
    for (const fd of walking.frameDurations!) {
      expect(fd.minimum).toBe(300)
      expect(fd.maximum).toBe(300)
    }
  })

  it('should copy durations from original when improvedAnimations is true', () => {
    const thing = createOutfitWith4DirNFrames(4)
    // Set custom durations on original
    const original = thing.frameGroups[FrameGroupType.DEFAULT]!
    original.frameDurations = [
      createFrameDuration(100, 150),
      createFrameDuration(200, 250),
      createFrameDuration(300, 350),
      createFrameDuration(400, 450)
    ]

    addThingFrameGroupState(thing, true, 300)

    const walking = thing.frameGroups[FrameGroupType.WALKING]!
    // Walking has 3 frames, should copy first 3 durations from original
    expect(walking.frameDurations).toHaveLength(3)
    expect(walking.frameDurations![0]).toEqual({ minimum: 100, maximum: 150 })
    expect(walking.frameDurations![1]).toEqual({ minimum: 200, maximum: 250 })
    expect(walking.frameDurations![2]).toEqual({ minimum: 300, maximum: 350 })
  })

  it('should set correct group types', () => {
    const thing = createOutfitWith4DirNFrames(5)
    addThingFrameGroupState(thing, false, 300)

    expect(thing.frameGroups[FrameGroupType.DEFAULT]!.type).toBe(FrameGroupType.DEFAULT)
    expect(thing.frameGroups[FrameGroupType.WALKING]!.type).toBe(FrameGroupType.WALKING)
  })

  it('should split exactly 3 frames: 1 idle + 2 walking', () => {
    const thing = createOutfitWith4DirNFrames(3)
    addThingFrameGroupState(thing, false, 300)

    const idle = thing.frameGroups[FrameGroupType.DEFAULT]!
    const walking = thing.frameGroups[FrameGroupType.WALKING]!

    // idle: 1 frame * 4 dirs = 4 sprites [1,2,3,4]
    expect(idle.frames).toBe(1)
    expect(idle.spriteIndex).toHaveLength(4)
    // walking: 2 frames * 4 dirs = 8 sprites [5..12]
    expect(walking.frames).toBe(2)
    expect(walking.spriteIndex).toHaveLength(8)
    // Verify total sprites accounted for
    expect(idle.spriteIndex.length + walking.spriteIndex.length).toBe(12)
  })

  it('should split 5 frames into 1 idle + 4 walking', () => {
    const thing = createOutfitWith4DirNFrames(5)
    addThingFrameGroupState(thing, false, 300)

    const idle = thing.frameGroups[FrameGroupType.DEFAULT]!
    const walking = thing.frameGroups[FrameGroupType.WALKING]!

    expect(idle.frames).toBe(1)
    expect(walking.frames).toBe(4)
    expect(idle.spriteIndex).toHaveLength(4)
    expect(walking.spriteIndex).toHaveLength(16)
  })

  it('should set walking isAnimation to false when walking has exactly 1 frame', () => {
    // frames=2 should not split (< 3), this tests the isAnimation = walkingFrames > 1 logic
    // Use frames=3: walking gets 2 frames, so isAnimation = true
    const thing3 = createOutfitWith4DirNFrames(3)
    addThingFrameGroupState(thing3, false, 300)
    expect(thing3.frameGroups[FrameGroupType.WALKING]!.isAnimation).toBe(true)
  })

  it('should preserve patternX, patternY, patternZ from original group', () => {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT
    const group = createFrameGroup()
    group.patternX = 4
    group.patternY = 2
    group.patternZ = 3
    group.frames = 4
    group.spriteIndex = Array.from({ length: 4 * 2 * 3 * 4 }, (_, i) => i + 1)
    group.isAnimation = true
    group.frameDurations = Array.from({ length: 4 }, () => createFrameDuration(100, 200))
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    addThingFrameGroupState(thing, false, 300)

    const idle = thing.frameGroups[FrameGroupType.DEFAULT]!
    const walking = thing.frameGroups[FrameGroupType.WALKING]!

    expect(idle.patternX).toBe(4)
    expect(idle.patternY).toBe(2)
    expect(idle.patternZ).toBe(3)
    expect(walking.patternX).toBe(4)
    expect(walking.patternY).toBe(2)
    expect(walking.patternZ).toBe(3)
  })

  it('should use default duration for missing frame durations when improvedAnimations is true', () => {
    const thing = createOutfitWith4DirNFrames(4)
    // Set frameDurations to null to test fallback
    thing.frameGroups[FrameGroupType.DEFAULT]!.frameDurations = null

    addThingFrameGroupState(thing, true, 250)

    const walking = thing.frameGroups[FrameGroupType.WALKING]!
    expect(walking.frameDurations).toHaveLength(3)
    for (const fd of walking.frameDurations!) {
      expect(fd.minimum).toBe(250)
      expect(fd.maximum).toBe(250)
    }
  })
})

// ---------------------------------------------------------------------------
// ThingType - removeThingFrameGroupState
// ---------------------------------------------------------------------------

describe('removeThingFrameGroupState', () => {
  function createOutfitWithIdleAndWalking(): ThingType {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT

    const idle = createFrameGroup()
    idle.patternX = 4
    idle.frames = 1
    // 4 sprites for 4 directions
    idle.spriteIndex = [1, 2, 3, 4]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.patternX = 4
    walking.frames = 3
    // 4 dirs * 3 frames = 12 sprites
    walking.spriteIndex = [10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33]
    walking.isAnimation = true
    walking.frameDurations = [
      createFrameDuration(100, 200),
      createFrameDuration(150, 250),
      createFrameDuration(200, 300)
    ]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    return thing
  }

  it('should merge idle + walking into single DEFAULT group with 3 frames', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 300, false)

    expect(thing.frameGroups[FrameGroupType.DEFAULT]).toBeDefined()
    expect(thing.frameGroups[FrameGroupType.WALKING]).toBeUndefined()

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.frames).toBe(3)
  })

  it('should set frame 1 from idle sprites', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    // Frame 1: idle's first (and only) frame = [1,2,3,4]
    expect(group.spriteIndex.slice(0, 4)).toEqual([1, 2, 3, 4])
  })

  it('should set frame 2 from walking first frame', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    // Frame 2: walking's first frame = [10,11,12,13]
    expect(group.spriteIndex.slice(4, 8)).toEqual([10, 11, 12, 13])
  })

  it('should set frame 3 from walking 2nd frame when < 5 frames', () => {
    const thing = createOutfitWithIdleAndWalking()
    // Walking has 3 frames, which is > 1 but < 5
    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    // Frame 3: walking's 2nd frame (index 1) = [20,21,22,23]
    expect(group.spriteIndex.slice(8, 12)).toEqual([20, 21, 22, 23])
  })

  it('should set frame 3 from walking 5th frame when available', () => {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT

    const idle = createFrameGroup()
    idle.patternX = 4
    idle.frames = 1
    idle.spriteIndex = [1, 2, 3, 4]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.patternX = 4
    walking.frames = 6
    // 4 dirs * 6 frames = 24 sprites
    walking.spriteIndex = Array.from({ length: 24 }, (_, i) => 100 + i)
    walking.isAnimation = true
    walking.frameDurations = Array.from({ length: 6 }, () => createFrameDuration(100, 200))
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    // Frame 3: walking's 5th frame (index 4) => offset 4*4=16: [116,117,118,119]
    expect(group.spriteIndex.slice(8, 12)).toEqual([116, 117, 118, 119])
  })

  it('should set animation properties on merged group', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.isAnimation).toBe(true)
    expect(group.animationMode).toBe(AnimationMode.ASYNCHRONOUS)
    expect(group.loopCount).toBe(0)
    expect(group.startFrame).toBe(0)
  })

  it('should set uniform frame durations with provided duration', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.frameDurations).toHaveLength(3)
    for (const fd of group.frameDurations!) {
      expect(fd.minimum).toBe(300)
      expect(fd.maximum).toBe(300)
    }
  })

  it('should reduce patternZ to 1 when removeMounts is true', () => {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT

    const idle = createFrameGroup()
    idle.patternX = 4
    idle.patternZ = 2
    idle.frames = 1
    idle.spriteIndex = [1, 2, 3, 4, 5, 6, 7, 8]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.patternX = 4
    walking.patternZ = 2
    walking.frames = 2
    walking.spriteIndex = Array.from({ length: 16 }, (_, i) => 10 + i)
    walking.isAnimation = true
    walking.frameDurations = [createFrameDuration(100, 200), createFrameDuration(100, 200)]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    removeThingFrameGroupState(thing, 300, true)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.patternZ).toBe(1)
  })

  it('should not reduce patternZ when removeMounts is false', () => {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT

    const idle = createFrameGroup()
    idle.patternX = 4
    idle.patternZ = 2
    idle.frames = 1
    idle.spriteIndex = [1, 2, 3, 4, 5, 6, 7, 8]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.patternX = 4
    walking.patternZ = 2
    walking.frames = 2
    walking.spriteIndex = Array.from({ length: 16 }, (_, i) => 10 + i)
    walking.isAnimation = true
    walking.frameDurations = [createFrameDuration(100, 200), createFrameDuration(100, 200)]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.patternZ).toBe(2)
  })

  it('should handle missing idle (only walking)', () => {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT

    const walking = createFrameGroup()
    walking.patternX = 4
    walking.frames = 2
    walking.spriteIndex = [10, 11, 12, 13, 20, 21, 22, 23]
    walking.isAnimation = true
    walking.frameDurations = [createFrameDuration(100, 200), createFrameDuration(100, 200)]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.frames).toBe(3)
    // When idle is null, normal = createFrameGroup() which has patternX=1
    // so spritesPerFrame = 1*1*1*1*1*1 = 1
    // Frame 1: zero (no idle)
    // Frame 2: walking.spriteIndex[0] = 10
    // Frame 3: walking.spriteIndex[1] = 20 (2nd frame, since length=8 > 1)
    expect(group.spriteIndex).toEqual([0, 10, 20])
  })

  it('should handle missing walking (only idle)', () => {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT

    const idle = createFrameGroup()
    idle.patternX = 4
    idle.frames = 1
    idle.spriteIndex = [1, 2, 3, 4]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    expect(group.frames).toBe(3)
    // Frame 1: idle sprites
    expect(group.spriteIndex.slice(0, 4)).toEqual([1, 2, 3, 4])
    // Frame 2 and 3: zeros (no walking)
    expect(group.spriteIndex.slice(4, 8)).toEqual([0, 0, 0, 0])
    expect(group.spriteIndex.slice(8, 12)).toEqual([0, 0, 0, 0])
  })

  it('should do nothing when both idle and walking are missing', () => {
    const thing = createThingType()
    removeThingFrameGroupState(thing, 300, false)
    expect(thing.frameGroups).toEqual([])
  })

  it('should set the merged group type to DEFAULT', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 300, false)
    expect(thing.frameGroups[FrameGroupType.DEFAULT]!.type).toBe(FrameGroupType.DEFAULT)
  })

  it('should set frame 3 from walking first frame when walking has only 1 frame', () => {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT

    const idle = createFrameGroup()
    idle.patternX = 4
    idle.frames = 1
    idle.spriteIndex = [1, 2, 3, 4]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.patternX = 4
    walking.frames = 1
    // 4 dirs * 1 frame = 4 sprites, exactly spritesPerFrame
    walking.spriteIndex = [10, 11, 12, 13]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    // Frame 1: idle [1,2,3,4]
    expect(group.spriteIndex.slice(0, 4)).toEqual([1, 2, 3, 4])
    // Frame 2: walking first frame [10,11,12,13]
    expect(group.spriteIndex.slice(4, 8)).toEqual([10, 11, 12, 13])
    // Frame 3: walking first frame again (length == spritesPerFrame, fallback to 1st)
    expect(group.spriteIndex.slice(8, 12)).toEqual([10, 11, 12, 13])
  })

  it('should use different duration values based on parameter', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 150, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    for (const fd of group.frameDurations!) {
      expect(fd.minimum).toBe(150)
      expect(fd.maximum).toBe(150)
    }
  })

  it('should produce correct total sprite count for merged group', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 300, false)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    // spritesPerFrame = 1*1*1*4*1*1 = 4
    // 3 frames * 4 = 12 total sprites
    expect(group.spriteIndex).toHaveLength(12)
  })

  it('should handle removeMounts when patternZ > 1 in walking', () => {
    const thing = createThingType()
    thing.category = ThingCategory.OUTFIT

    const idle = createFrameGroup()
    idle.patternX = 4
    idle.patternZ = 2
    idle.frames = 1
    // 4 dirs * 2 mount layers = 8 sprites
    idle.spriteIndex = [1, 2, 3, 4, 5, 6, 7, 8]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, idle)

    const walking = createFrameGroup()
    walking.patternX = 4
    walking.patternZ = 2
    walking.frames = 2
    walking.spriteIndex = Array.from({ length: 16 }, (_, i) => 10 + i)
    walking.isAnimation = true
    walking.frameDurations = [createFrameDuration(100, 200), createFrameDuration(100, 200)]
    setThingFrameGroup(thing, FrameGroupType.WALKING, walking)

    removeThingFrameGroupState(thing, 300, true)

    const group = thing.frameGroups[FrameGroupType.DEFAULT]!
    // removeMounts sets patternZ=1 before computing spritesPerFrame
    // spritesPerFrame = 1*1*1*4*1*1 = 4 (patternZ reduced to 1)
    expect(group.patternZ).toBe(1)
    expect(group.spriteIndex).toHaveLength(12) // 3 frames * 4 = 12
  })

  it('should remove WALKING group from frameGroups after merge', () => {
    const thing = createOutfitWithIdleAndWalking()
    removeThingFrameGroupState(thing, 300, false)

    expect(thing.frameGroups[FrameGroupType.WALKING]).toBeUndefined()
    expect(thing.frameGroups.filter((g) => g !== undefined)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// ThingData - createThingData
// ---------------------------------------------------------------------------

describe('createThingData', () => {
  it('should create a ThingData with provided values', () => {
    const thing = createThingType()
    thing.id = 100
    const sprites = new Map<FrameGroupType, SpriteData[]>()

    const data = createThingData(200, 1056, thing, sprites)
    expect(data.obdVersion).toBe(200)
    expect(data.clientVersion).toBe(1056)
    expect(data.thing).toBe(thing)
    expect(data.sprites).toBe(sprites)
  })

  it('should set xmlAttributes to null', () => {
    const thing = createThingType()
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(300, 1000, thing, sprites)
    expect(data.xmlAttributes).toBeNull()
  })

  it('should preserve sprites map contents', () => {
    const thing = createThingType()
    const sprite1 = createSpriteData(1)
    const sprite2 = createSpriteData(2)
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    sprites.set(FrameGroupType.DEFAULT, [sprite1, sprite2])

    const data = createThingData(200, 1000, thing, sprites)
    expect(data.sprites.get(FrameGroupType.DEFAULT)).toHaveLength(2)
    expect(data.sprites.get(FrameGroupType.DEFAULT)![0].id).toBe(1)
    expect(data.sprites.get(FrameGroupType.DEFAULT)![1].id).toBe(2)
  })

  it('should work with empty sprites map', () => {
    const thing = createThingType()
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(100, 710, thing, sprites)
    expect(data.sprites.size).toBe(0)
  })

  it('should store the exact same thing and sprites references (not cloned)', () => {
    const thing = createThingType()
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(200, 1000, thing, sprites)
    expect(data.thing).toBe(thing)
    expect(data.sprites).toBe(sprites)
  })
})

// ---------------------------------------------------------------------------
// ThingData - cloneThingData
// ---------------------------------------------------------------------------

describe('cloneThingData', () => {
  it('should clone obdVersion and clientVersion', () => {
    const thing = createThingType()
    thing.id = 50
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(300, 1056, thing, sprites)

    const clone = cloneThingData(data)
    expect(clone.obdVersion).toBe(300)
    expect(clone.clientVersion).toBe(1056)
  })

  it('should deep-clone the thing', () => {
    const thing = createThingType()
    thing.id = 50
    thing.isGround = true
    thing.groundSpeed = 150
    const group = createFrameGroup()
    group.spriteIndex = [1, 2]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(200, 1000, thing, sprites)

    const clone = cloneThingData(data)
    expect(clone.thing).not.toBe(data.thing)
    expect(clone.thing.id).toBe(50)
    expect(clone.thing.isGround).toBe(true)
    expect(clone.thing.groundSpeed).toBe(150)
    expect(clone.thing.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex).toEqual([1, 2])

    // Mutation should not propagate
    clone.thing.id = 999
    clone.thing.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex[0] = 999
    expect(data.thing.id).toBe(50)
    expect(data.thing.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex[0]).toBe(1)
  })

  it('should deep-clone sprites map', () => {
    const thing = createThingType()
    const sprite1 = createSpriteData(1)
    const sprite2 = createSpriteData(2)
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    sprites.set(FrameGroupType.DEFAULT, [sprite1, sprite2])

    const data = createThingData(200, 1000, thing, sprites)
    const clone = cloneThingData(data)

    expect(clone.sprites).not.toBe(data.sprites)
    expect(clone.sprites.size).toBe(1)

    const clonedSprites = clone.sprites.get(FrameGroupType.DEFAULT)!
    expect(clonedSprites).toHaveLength(2)
    expect(clonedSprites[0]).not.toBe(sprite1)
    expect(clonedSprites[0].id).toBe(1)
    expect(clonedSprites[1].id).toBe(2)

    // Verify pixel data is cloned
    if (sprite1.pixels && clonedSprites[0].pixels) {
      expect(clonedSprites[0].pixels).not.toBe(sprite1.pixels)
      expect(clonedSprites[0].pixels).toEqual(sprite1.pixels)
    }
  })

  it('should clone sprites for both DEFAULT and WALKING groups', () => {
    const thing = createThingType()
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    sprites.set(FrameGroupType.DEFAULT, [createSpriteData(1)])
    sprites.set(FrameGroupType.WALKING, [createSpriteData(2), createSpriteData(3)])

    const data = createThingData(200, 1000, thing, sprites)
    const clone = cloneThingData(data)

    expect(clone.sprites.get(FrameGroupType.DEFAULT)!).toHaveLength(1)
    expect(clone.sprites.get(FrameGroupType.WALKING)!).toHaveLength(2)
  })

  it('should clone xmlAttributes as a new object', () => {
    const thing = createThingType()
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(200, 1000, thing, sprites)
    data.xmlAttributes = { name: 'Golden Armor', weight: '3500' }

    const clone = cloneThingData(data)
    expect(clone.xmlAttributes).toEqual({ name: 'Golden Armor', weight: '3500' })
    expect(clone.xmlAttributes).not.toBe(data.xmlAttributes)

    // Mutation should not propagate
    clone.xmlAttributes!.name = 'Silver Armor'
    expect(data.xmlAttributes!.name).toBe('Golden Armor')
  })

  it('should keep xmlAttributes null when source is null', () => {
    const thing = createThingType()
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(200, 1000, thing, sprites)

    const clone = cloneThingData(data)
    expect(clone.xmlAttributes).toBeNull()
  })

  it('should handle empty sprites map', () => {
    const thing = createThingType()
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(200, 1000, thing, sprites)

    const clone = cloneThingData(data)
    expect(clone.sprites.size).toBe(0)
    expect(clone.sprites).not.toBe(data.sprites)
  })

  it('should handle sprite data with null pixels', () => {
    const thing = createThingType()
    const sprite: SpriteData = { id: 1, pixels: null }
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    sprites.set(FrameGroupType.DEFAULT, [sprite])

    const data = createThingData(200, 1000, thing, sprites)
    const clone = cloneThingData(data)

    const clonedSprites = clone.sprites.get(FrameGroupType.DEFAULT)!
    expect(clonedSprites[0].id).toBe(1)
    expect(clonedSprites[0].pixels).toBeNull()
  })

  it('should clone xmlAttributes with many keys', () => {
    const thing = createThingType()
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    const data = createThingData(200, 1000, thing, sprites)
    data.xmlAttributes = {
      name: 'Sword',
      article: 'a',
      weight: '3500',
      attack: '28',
      defense: '15'
    }

    const clone = cloneThingData(data)
    expect(Object.keys(clone.xmlAttributes!)).toHaveLength(5)
    expect(clone.xmlAttributes!.name).toBe('Sword')
    expect(clone.xmlAttributes!.weight).toBe('3500')
  })

  it('should produce fully independent clone', () => {
    const thing = createThingType()
    thing.id = 1
    thing.isGround = true
    const group = createFrameGroup()
    group.spriteIndex = [10]
    setThingFrameGroup(thing, FrameGroupType.DEFAULT, group)

    const sprite = createSpriteData(10)
    const sprites = new Map<FrameGroupType, SpriteData[]>()
    sprites.set(FrameGroupType.DEFAULT, [sprite])

    const data = createThingData(200, 1000, thing, sprites)
    data.xmlAttributes = { article: 'a' }

    const clone = cloneThingData(data)

    // Mutate everything in the clone
    clone.obdVersion = 999
    clone.clientVersion = 999
    clone.thing.id = 999
    clone.thing.isGround = false
    clone.thing.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex[0] = 999
    clone.sprites.get(FrameGroupType.DEFAULT)![0].id = 999
    clone.xmlAttributes!.article = 'an'

    // Original should be unchanged
    expect(data.obdVersion).toBe(200)
    expect(data.clientVersion).toBe(1000)
    expect(data.thing.id).toBe(1)
    expect(data.thing.isGround).toBe(true)
    expect(data.thing.frameGroups[FrameGroupType.DEFAULT]!.spriteIndex[0]).toBe(10)
    expect(data.sprites.get(FrameGroupType.DEFAULT)![0].id).toBe(10)
    expect(data.xmlAttributes!.article).toBe('a')
  })
})
