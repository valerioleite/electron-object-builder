/**
 * Pre-parsed attribute definitions for all TFS server versions.
 * Converted from legacy config/attributes/*.xml files.
 * Each entry contains the server metadata and list of ItemAttribute definitions.
 */

import { ItemAttribute } from '@renderer/types'

export interface AttributeServerData {
  server: string
  displayName: string
  supportsFromToId: boolean
  itemsXmlEncoding: string
  attributes: ItemAttribute[]
}

// ---------------------------------------------------------------------------
// Helper to reduce boilerplate
// ---------------------------------------------------------------------------

type AttrType = ItemAttribute['type']

const MAX = Number.MAX_SAFE_INTEGER

function attr(
  key: string,
  type: AttrType,
  category: string,
  values: string[] | null = null,
  placement: string | null = null
): ItemAttribute {
  return { key, type, category, placement, order: MAX, values, attributes: null }
}

// ---------------------------------------------------------------------------
// Shared value lists (reused across versions)
// ---------------------------------------------------------------------------

const DIRECTIONS = ['north', 'east', 'south', 'west']
const CORPSE_TYPES = ['venom', 'blood', 'undead', 'fire', 'energy']
const AMMO_ACTION_036 = ['removecount', 'removecharge', 'moveback']
const AMMO_ACTION_10 = ['move', 'moveback', 'removecharge', 'removecount']

// tfs0.3.6 / tfs0.4 / tfs0.5 shared values
const TYPE_VALUES_036 = [
  'container',
  'key',
  'magicfield',
  'depot',
  'mailbox',
  'trashholder',
  'teleport',
  'door',
  'bed'
]
const TYPE_VALUES_04 = [...TYPE_VALUES_036, 'rune']
const TYPE_VALUES_10 = [...TYPE_VALUES_036] // no rune in 1.0
const TYPE_VALUES_11 = [...TYPE_VALUES_04] // rune back in 1.1+

const SLOT_TYPE_036 = [
  'head',
  'body',
  'legs',
  'feet',
  'backpack',
  'two-handed',
  'necklace',
  'ring',
  'ammo',
  'hand'
]
const SLOT_TYPE_10 = [
  'head',
  'body',
  'legs',
  'feet',
  'backpack',
  'two-handed',
  'right-hand',
  'left-hand',
  'necklace',
  'ring',
  'ammo',
  'hand'
]

const WEAPON_TYPE_036 = [
  'sword',
  'club',
  'axe',
  'shield',
  'distance',
  'wand',
  'rod',
  'ammunition',
  'fist'
]
const WEAPON_TYPE_10 = ['sword', 'club', 'axe', 'shield', 'distance', 'wand', 'ammunition']

const AMMO_TYPE_036 = [
  'none',
  'bolt',
  'arrow',
  'spear',
  'throwingstar',
  'throwingknife',
  'stone',
  'snowball'
]
const AMMO_TYPE_10 = [
  'spear',
  'bolt',
  'arrow',
  'poisonarrow',
  'burstarrow',
  'throwingstar',
  'throwingknife',
  'smallstone',
  'largerock',
  'snowball',
  'powerbolt',
  'infernalbolt',
  'huntingspear',
  'enchantedspear',
  'royalspear',
  'sniperarrow',
  'onyxarrow',
  'piercingbolt',
  'etherealspear',
  'flasharrow',
  'flammingarrow',
  'shiverarrow',
  'eartharrow'
]

const SHOOT_TYPE_036 = [
  'spear',
  'bolt',
  'arrow',
  'fire',
  'energy',
  'poisonarrow',
  'burstarrow',
  'throwingstar',
  'throwingknife',
  'smallstone',
  'death',
  'largerock',
  'snowball',
  'powerbolt',
  'poisonfield',
  'infernalbolt',
  'huntingspear',
  'enchantedspear',
  'redstar',
  'greenstar',
  'royalspear',
  'sniperarrow',
  'onyxarrow',
  'piercingbolt',
  'whirlwindsword',
  'whirlwindaxe',
  'whirlwindclub',
  'etherealspear',
  'ice',
  'earth',
  'holy',
  'suddendeath',
  'flasharrow',
  'flammingarrow',
  'shiverarrow',
  'energyball',
  'smallice',
  'smallholy',
  'smallearth',
  'eartharrow',
  'explosion',
  'cake'
]

const SHOOT_TYPE_10 = [
  'spear',
  'bolt',
  'arrow',
  'fire',
  'energy',
  'poisonarrow',
  'burstarrow',
  'throwingstar',
  'throwingknife',
  'smallstone',
  'death',
  'largerock',
  'snowball',
  'powerbolt',
  'poison',
  'infernalbolt',
  'huntingspear',
  'enchantedspear',
  'redstar',
  'greenstar',
  'royalspear',
  'sniperarrow',
  'onyxarrow',
  'piercingbolt',
  'whirlwindsword',
  'whirlwindaxe',
  'whirlwindclub',
  'etherealspear',
  'ice',
  'earth',
  'holy',
  'suddendeath',
  'flasharrow',
  'flammingarrow',
  'shiverarrow',
  'energyball',
  'smallice',
  'smallholy',
  'smallearth',
  'eartharrow',
  'explosion',
  'cake',
  'tarsalarrow',
  'vortexbolt',
  'prismaticbolt',
  'crystallinearrow',
  'drillbolt',
  'envenomedarrow'
]

const SHOOT_TYPE_11 = [...SHOOT_TYPE_10, 'gloothspear', 'simplearrow']

const EFFECT_036 = [
  'drawblood',
  'loseenergy',
  'poff',
  'blockhit',
  'explosionarea',
  'explosiondamage',
  'firearea',
  'yellowrings',
  'poisonrings',
  'hitarea',
  'teleport',
  'energydamage',
  'wrapsblue',
  'wrapsred',
  'wrapsgreen',
  'hitbyfire',
  'poison',
  'mortarea',
  'soundgreen',
  'soundred',
  'poisonarea',
  'soundyellow',
  'soundpurple',
  'soundblue',
  'soundwhite',
  'bubbles',
  'craps',
  'giftwraps',
  'fireworkyellow',
  'fireworkred',
  'fireworkblue',
  'stun',
  'sleep',
  'watercreature',
  'groundshaker',
  'hearts',
  'fireattack',
  'energyarea',
  'smallclouds',
  'holydamage',
  'bigclouds',
  'icearea',
  'icetornado',
  'iceattack',
  'stones',
  'smallplants',
  'carniphila',
  'purpleenergy',
  'yellowenergy',
  'holyarea',
  'bigplants',
  'cake',
  'giantice',
  'watersplash',
  'plantattack',
  'tutorialarrow',
  'tutorialsquare',
  'mirrorhorizontal',
  'mirrorvertical',
  'skullhorizontal',
  'skullvertical',
  'assassin',
  'stepshorizontal',
  'bloodysteps',
  'stepsvertical',
  'yalaharighost',
  'bats',
  'smoke',
  'insects'
]

const EFFECT_04 = [...EFFECT_036, 'dragonhead']

const EFFECT_10 = [
  'redspark',
  'bluebubble',
  'poff',
  'yellowspark',
  'explosionarea',
  'explosion',
  'firearea',
  'yellowbubble',
  'greenbubble',
  'blackspark',
  'teleport',
  'energy',
  'blueshimmer',
  'redshimmer',
  'greenshimmer',
  'fire',
  'greenspark',
  'mortarea',
  'greennote',
  'rednote',
  'poison',
  'yellownote',
  'purplenote',
  'bluenote',
  'whitenote',
  'bubbles',
  'dice',
  'giftwraps',
  'yellowfirework',
  'redfirework',
  'bluefirework',
  'stun',
  'sleep',
  'watercreature',
  'groundshaker',
  'hearts',
  'fireattack',
  'energyarea',
  'smallclouds',
  'holydamage',
  'bigclouds',
  'icearea',
  'icetornado',
  'iceattack',
  'stones',
  'smallplants',
  'carniphila',
  'purpleenergy',
  'yellowenergy',
  'holyarea',
  'bigplants',
  'cake',
  'giantice',
  'watersplash',
  'plantattack',
  'tutorialarrow',
  'tutorialsquare',
  'mirrorhorizontal',
  'mirrorvertical',
  'skullhorizontal',
  'skullvertical',
  'assassin',
  'stepshorizontal',
  'bloodysteps',
  'stepsvertical',
  'yalaharighost',
  'bats',
  'smoke',
  'insects',
  'dragonhead',
  'orcshaman',
  'orcshamanfire',
  'thunder',
  'ferumbras',
  'confettihorizontal',
  'confettivertical',
  'blacksmoke'
]

const EFFECT_11 = [...EFFECT_10, 'redsmoke', 'yellowsmoke', 'greensmoke', 'purplesmoke']

const FLUID_SOURCE_036 = [
  'water',
  'blood',
  'beer',
  'slime',
  'lemonade',
  'milk',
  'mana',
  'life',
  'oil',
  'urine',
  'coconutmilk',
  'wine',
  'mud',
  'fruitjuice',
  'lava',
  'rum',
  'swamp'
]
const FLUID_SOURCE_04 = [...FLUID_SOURCE_036, 'tea', 'mead']
const FLUID_SOURCE_10 = [
  'water',
  'blood',
  'beer',
  'slime',
  'lemonade',
  'milk',
  'mana',
  'life',
  'oil',
  'urine',
  'coconut',
  'wine',
  'mud',
  'fruitjuice',
  'lava',
  'rum',
  'swamp',
  'tea',
  'mead'
]

const FLOOR_CHANGE_036 = [
  'down',
  'north',
  'south',
  'west',
  'east',
  'northex',
  'southex',
  'westex',
  'eastex'
]
const FLOOR_CHANGE_10 = [
  'down',
  'north',
  'south',
  'southalt',
  'southex',
  'west',
  'east',
  'eastalt',
  'eastex'
]
const FLOOR_CHANGE_14 = ['down', 'north', 'south', 'southalt', 'west', 'east', 'eastalt']

// Absorb keys (shared across 0.3.6 - 1.6)
const ABSORB_KEYS_15 = [
  'absorbPercentAll',
  'absorbPercentElements',
  'absorbPercentMagic',
  'absorbPercentEnergy',
  'absorbPercentFire',
  'absorbPercentPoison',
  'absorbPercentIce',
  'absorbPercentHoly',
  'absorbPercentDeath',
  'absorbPercentLifeDrain',
  'absorbPercentManaDrain',
  'absorbPercentDrown',
  'absorbPercentPhysical',
  'absorbPercentHealing',
  'absorbPercentUndefined'
]

// Reflect Percent keys (0.3.6-0.5 only)
const REFLECT_PERCENT_KEYS = [
  'reflectPercentAll',
  'reflectPercentElements',
  'reflectPercentMagic',
  'reflectPercentEnergy',
  'reflectPercentFire',
  'reflectPercentPoison',
  'reflectPercentIce',
  'reflectPercentHoly',
  'reflectPercentDeath',
  'reflectPercentLifeDrain',
  'reflectPercentManaDrain',
  'reflectPercentDrown',
  'reflectPercentPhysical',
  'reflectPercentHealing',
  'reflectPercentUndefined'
]

// Reflect Chance keys (0.3.6-0.5 only)
const REFLECT_CHANCE_KEYS = [
  'reflectChanceAll',
  'reflectChanceElements',
  'reflectChanceMagic',
  'reflectChanceEnergy',
  'reflectChanceFire',
  'reflectChancePoison',
  'reflectChanceIce',
  'reflectChanceHoly',
  'reflectChanceDeath',
  'reflectChanceLifeDrain',
  'reflectChanceManaDrain',
  'reflectChanceDrown',
  'reflectChancePhysical',
  'reflectChanceHealing',
  'reflectChanceUndefined'
]

// Suppress 22 conditions (0.3.6-0.5)
const SUPPRESS_22 = [
  'suppressShock',
  'suppressBurn',
  'suppressPoison',
  'suppressFreeze',
  'suppressDazzle',
  'suppressCurse',
  'suppressDrown',
  'suppressPhysical',
  'suppressHaste',
  'suppressParalyze',
  'suppressDrunk',
  'suppressRegeneration',
  'suppressSoul',
  'suppressOutfit',
  'suppressInvisible',
  'suppressInfight',
  'suppressExhaust',
  'suppressMuted',
  'suppressPacified',
  'suppressLight',
  'suppressAttributes',
  'suppressManaShield'
]

// Suppress 9 conditions (1.0+)
const SUPPRESS_9 = [
  'suppressEnergy',
  'suppressFire',
  'suppressPoison',
  'suppressDrown',
  'suppressPhysical',
  'suppressFreeze',
  'suppressDazzle',
  'suppressCurse',
  'suppressDrunk'
]

// ---------------------------------------------------------------------------
// tfs0.3.6
// ---------------------------------------------------------------------------

const TFS_036: AttributeServerData = {
  server: 'tfs0.3.6',
  displayName: 'TFS 0.3.6',
  supportsFromToId: false,
  itemsXmlEncoding: 'utf-8',
  attributes: [
    // General
    attr('name', 'string', 'General'),
    attr('article', 'string', 'General'),
    attr('plural', 'string', 'General'),
    attr('description', 'string', 'General'),
    attr('runespellname', 'string', 'General'),
    attr('weight', 'number', 'General'),
    attr('worth', 'number', 'General'),
    attr('showCount', 'boolean', 'General'),
    attr('forceSerialize', 'boolean', 'General'),
    attr('writeOnceItemId', 'number', 'General'),

    // Type
    attr('type', 'string', 'Type', TYPE_VALUES_036),

    // Combat
    attr('attack', 'number', 'Combat'),
    attr('defense', 'number', 'Combat'),
    attr('armor', 'number', 'Combat'),
    attr('extraDefense', 'number', 'Combat'),
    attr('extraAttack', 'number', 'Combat'),
    attr('attackSpeed', 'number', 'Combat'),
    attr('range', 'number', 'Combat'),
    attr('hitChance', 'number', 'Combat'),
    attr('maxHitChance', 'number', 'Combat'),
    attr('breakChance', 'number', 'Combat'),
    attr('ammoAction', 'string', 'Combat', AMMO_ACTION_036),

    // Equipment
    attr('slotType', 'string', 'Equipment', SLOT_TYPE_036),
    attr('weaponType', 'string', 'Equipment', WEAPON_TYPE_036),
    attr('ammoType', 'string', 'Equipment', AMMO_TYPE_036),
    attr('shootType', 'string', 'Equipment', SHOOT_TYPE_036),
    attr('effect', 'string', 'Equipment', EFFECT_036),

    // Container
    attr('containerSize', 'number', 'Container'),
    attr('fluidSource', 'string', 'Container', FLUID_SOURCE_036),

    // Duration
    attr('decayTo', 'number', 'Duration'),
    attr('decayTime', 'number', 'Duration'),
    attr('duration', 'number', 'Duration'),
    attr('stopDuration', 'boolean', 'Duration'),
    attr('showDuration', 'boolean', 'Duration'),
    attr('charges', 'number', 'Duration'),
    attr('showCharges', 'boolean', 'Duration'),

    // Transform
    attr('rotateTo', 'number', 'Transform'),
    attr('transformEquipTo', 'number', 'Transform'),
    attr('transformDeEquipTo', 'number', 'Transform'),
    attr('transformTo', 'number', 'Transform'),
    attr('maleTransformTo', 'number', 'Transform'),
    attr('femaleTransformTo', 'number', 'Transform'),
    attr('partnerDirection', 'string', 'Transform', DIRECTIONS),

    // Text
    attr('writeable', 'boolean', 'Text'),
    attr('readable', 'boolean', 'Text'),
    attr('maxTextLen', 'number', 'Text'),

    // Properties
    attr('moveable', 'boolean', 'Properties'),
    attr('blockProjectile', 'boolean', 'Properties'),
    attr('allowPickupable', 'boolean', 'Properties'),
    attr('preventLoss', 'boolean', 'Properties'),
    attr('preventDrop', 'boolean', 'Properties'),
    attr('invisible', 'boolean', 'Properties'),
    attr('floorChange', 'string', 'Properties', FLOOR_CHANGE_036),
    attr('corpseType', 'string', 'Properties', CORPSE_TYPES),
    attr('manaShield', 'boolean', 'Properties'),
    attr('showAttributes', 'boolean', 'Properties'),
    attr('levelDoor', 'number', 'Properties'),
    attr('replaceable', 'boolean', 'Properties'),

    // Skills
    attr('speed', 'number', 'Skills'),
    attr('skillSword', 'number', 'Skills'),
    attr('skillAxe', 'number', 'Skills'),
    attr('skillClub', 'number', 'Skills'),
    attr('skillDist', 'number', 'Skills'),
    attr('skillFish', 'number', 'Skills'),
    attr('skillShield', 'number', 'Skills'),
    attr('skillFist', 'number', 'Skills'),
    attr('maxHealthPoints', 'number', 'Skills'),
    attr('maxHealthPercent', 'number', 'Skills'),
    attr('maxManaPoints', 'number', 'Skills'),
    attr('maxManaPercent', 'number', 'Skills'),
    attr('soulPoints', 'number', 'Skills'),
    attr('soulPercent', 'number', 'Skills'),
    attr('magicLevelPoints', 'number', 'Skills'),
    attr('magicLevelPercent', 'number', 'Skills'),

    // Stats
    attr('increaseMagicValue', 'number', 'Stats'),
    attr('increaseMagicPercent', 'number', 'Stats'),
    attr('increaseHealingValue', 'number', 'Stats'),
    attr('increaseHealingPercent', 'number', 'Stats'),

    // Regeneration
    attr('healthGain', 'number', 'Regeneration'),
    attr('healthTicks', 'number', 'Regeneration'),
    attr('manaGain', 'number', 'Regeneration'),
    attr('manaTicks', 'number', 'Regeneration'),

    // Elements
    attr('elementPhysical', 'number', 'Elements'),
    attr('elementFire', 'number', 'Elements'),
    attr('elementEnergy', 'number', 'Elements'),
    attr('elementEarth', 'number', 'Elements'),
    attr('elementIce', 'number', 'Elements'),
    attr('elementHoly', 'number', 'Elements'),
    attr('elementDeath', 'number', 'Elements'),
    attr('elementLifeDrain', 'number', 'Elements'),
    attr('elementManaDrain', 'number', 'Elements'),
    attr('elementHealing', 'number', 'Elements'),
    attr('elementUndefined', 'number', 'Elements'),

    // Absorb (15)
    ...ABSORB_KEYS_15.map((k) => attr(k, 'number', 'Absorb')),

    // Reflect Percent (15)
    ...REFLECT_PERCENT_KEYS.map((k) => attr(k, 'number', 'Reflect Percent')),

    // Reflect Chance (15)
    ...REFLECT_CHANCE_KEYS.map((k) => attr(k, 'number', 'Reflect Chance')),

    // Suppress (22)
    ...SUPPRESS_22.map((k) => attr(k, 'boolean', 'Suppress'))
  ]
}

// ---------------------------------------------------------------------------
// tfs0.4
// ---------------------------------------------------------------------------

const TFS_04: AttributeServerData = {
  server: 'tfs0.4',
  displayName: 'TFS 0.4',
  supportsFromToId: true,
  itemsXmlEncoding: 'utf-8',
  attributes: [
    // General (same as 0.3.6)
    attr('name', 'string', 'General'),
    attr('article', 'string', 'General'),
    attr('plural', 'string', 'General'),
    attr('description', 'string', 'General'),
    attr('runespellname', 'string', 'General'),
    attr('weight', 'number', 'General'),
    attr('worth', 'number', 'General'),
    attr('showCount', 'boolean', 'General'),
    attr('forceSerialize', 'boolean', 'General'),
    attr('writeOnceItemId', 'number', 'General'),

    // Type (+ rune)
    attr('type', 'string', 'Type', TYPE_VALUES_04),

    // Combat (same as 0.3.6)
    attr('attack', 'number', 'Combat'),
    attr('defense', 'number', 'Combat'),
    attr('armor', 'number', 'Combat'),
    attr('extraDefense', 'number', 'Combat'),
    attr('extraAttack', 'number', 'Combat'),
    attr('attackSpeed', 'number', 'Combat'),
    attr('range', 'number', 'Combat'),
    attr('hitChance', 'number', 'Combat'),
    attr('maxHitChance', 'number', 'Combat'),
    attr('breakChance', 'number', 'Combat'),
    attr('ammoAction', 'string', 'Combat', AMMO_ACTION_036),

    // Equipment (+ dualWield, + dragonhead in effect, same slot/weapon/ammo/shoot)
    attr('slotType', 'string', 'Equipment', SLOT_TYPE_036),
    attr('weaponType', 'string', 'Equipment', WEAPON_TYPE_036),
    attr('ammoType', 'string', 'Equipment', AMMO_TYPE_036),
    attr('shootType', 'string', 'Equipment', SHOOT_TYPE_036),
    attr('effect', 'string', 'Equipment', EFFECT_04),
    attr('dualWield', 'boolean', 'Equipment'),

    // Container (+ tea, mead)
    attr('containerSize', 'number', 'Container'),
    attr('fluidSource', 'string', 'Container', FLUID_SOURCE_04),

    // Duration
    attr('decayTo', 'number', 'Duration'),
    attr('decayTime', 'number', 'Duration'),
    attr('duration', 'number', 'Duration'),
    attr('stopDuration', 'boolean', 'Duration'),
    attr('showDuration', 'boolean', 'Duration'),
    attr('charges', 'number', 'Duration'),
    attr('showCharges', 'boolean', 'Duration'),

    // Transform
    attr('rotateTo', 'number', 'Transform'),
    attr('transformEquipTo', 'number', 'Transform'),
    attr('transformDeEquipTo', 'number', 'Transform'),
    attr('transformTo', 'number', 'Transform'),
    attr('maleTransformTo', 'number', 'Transform'),
    attr('femaleTransformTo', 'number', 'Transform'),
    attr('partnerDirection', 'string', 'Transform', DIRECTIONS),

    // Text
    attr('writeable', 'boolean', 'Text'),
    attr('readable', 'boolean', 'Text'),
    attr('maxTextLen', 'number', 'Text'),

    // Properties (same as 0.3.6)
    attr('moveable', 'boolean', 'Properties'),
    attr('blockProjectile', 'boolean', 'Properties'),
    attr('allowPickupable', 'boolean', 'Properties'),
    attr('preventLoss', 'boolean', 'Properties'),
    attr('preventDrop', 'boolean', 'Properties'),
    attr('invisible', 'boolean', 'Properties'),
    attr('floorChange', 'string', 'Properties', FLOOR_CHANGE_036),
    attr('corpseType', 'string', 'Properties', CORPSE_TYPES),
    attr('manaShield', 'boolean', 'Properties'),
    attr('showAttributes', 'boolean', 'Properties'),
    attr('levelDoor', 'number', 'Properties'),
    attr('replaceable', 'boolean', 'Properties'),

    // Skills (same as 0.3.6)
    attr('speed', 'number', 'Skills'),
    attr('skillSword', 'number', 'Skills'),
    attr('skillAxe', 'number', 'Skills'),
    attr('skillClub', 'number', 'Skills'),
    attr('skillDist', 'number', 'Skills'),
    attr('skillFish', 'number', 'Skills'),
    attr('skillShield', 'number', 'Skills'),
    attr('skillFist', 'number', 'Skills'),
    attr('maxHealthPoints', 'number', 'Skills'),
    attr('maxHealthPercent', 'number', 'Skills'),
    attr('maxManaPoints', 'number', 'Skills'),
    attr('maxManaPercent', 'number', 'Skills'),
    attr('soulPoints', 'number', 'Skills'),
    attr('soulPercent', 'number', 'Skills'),
    attr('magicLevelPoints', 'number', 'Skills'),
    attr('magicLevelPercent', 'number', 'Skills'),

    // Stats
    attr('increaseMagicValue', 'number', 'Stats'),
    attr('increaseMagicPercent', 'number', 'Stats'),
    attr('increaseHealingValue', 'number', 'Stats'),
    attr('increaseHealingPercent', 'number', 'Stats'),

    // Regeneration
    attr('healthGain', 'number', 'Regeneration'),
    attr('healthTicks', 'number', 'Regeneration'),
    attr('manaGain', 'number', 'Regeneration'),
    attr('manaTicks', 'number', 'Regeneration'),

    // Elements (same as 0.3.6)
    attr('elementPhysical', 'number', 'Elements'),
    attr('elementFire', 'number', 'Elements'),
    attr('elementEnergy', 'number', 'Elements'),
    attr('elementEarth', 'number', 'Elements'),
    attr('elementIce', 'number', 'Elements'),
    attr('elementHoly', 'number', 'Elements'),
    attr('elementDeath', 'number', 'Elements'),
    attr('elementLifeDrain', 'number', 'Elements'),
    attr('elementManaDrain', 'number', 'Elements'),
    attr('elementHealing', 'number', 'Elements'),
    attr('elementUndefined', 'number', 'Elements'),

    // Absorb (15)
    ...ABSORB_KEYS_15.map((k) => attr(k, 'number', 'Absorb')),

    // Reflect Percent (15)
    ...REFLECT_PERCENT_KEYS.map((k) => attr(k, 'number', 'Reflect Percent')),

    // Reflect Chance (15)
    ...REFLECT_CHANCE_KEYS.map((k) => attr(k, 'number', 'Reflect Chance')),

    // Suppress (22)
    ...SUPPRESS_22.map((k) => attr(k, 'boolean', 'Suppress'))
  ]
}

// ---------------------------------------------------------------------------
// tfs0.5 (identical to tfs0.4)
// ---------------------------------------------------------------------------

const TFS_05: AttributeServerData = {
  server: 'tfs0.5',
  displayName: 'TFS 0.5',
  supportsFromToId: true,
  itemsXmlEncoding: 'utf-8',
  attributes: [
    // General
    attr('name', 'string', 'General'),
    attr('article', 'string', 'General'),
    attr('plural', 'string', 'General'),
    attr('description', 'string', 'General'),
    attr('runespellname', 'string', 'General'),
    attr('weight', 'number', 'General'),
    attr('worth', 'number', 'General'),
    attr('showCount', 'boolean', 'General'),
    attr('forceSerialize', 'boolean', 'General'),
    attr('writeOnceItemId', 'number', 'General'),

    // Type
    attr('type', 'string', 'Type', TYPE_VALUES_04),

    // Combat
    attr('attack', 'number', 'Combat'),
    attr('defense', 'number', 'Combat'),
    attr('armor', 'number', 'Combat'),
    attr('extraDefense', 'number', 'Combat'),
    attr('extraAttack', 'number', 'Combat'),
    attr('attackSpeed', 'number', 'Combat'),
    attr('range', 'number', 'Combat'),
    attr('hitChance', 'number', 'Combat'),
    attr('maxHitChance', 'number', 'Combat'),
    attr('breakChance', 'number', 'Combat'),
    attr('ammoAction', 'string', 'Combat', AMMO_ACTION_036),

    // Equipment
    attr('slotType', 'string', 'Equipment', SLOT_TYPE_036),
    attr('weaponType', 'string', 'Equipment', WEAPON_TYPE_036),
    attr('ammoType', 'string', 'Equipment', AMMO_TYPE_036),
    attr('shootType', 'string', 'Equipment', SHOOT_TYPE_036),
    attr('effect', 'string', 'Equipment', EFFECT_04),
    attr('dualWield', 'boolean', 'Equipment'),

    // Container
    attr('containerSize', 'number', 'Container'),
    attr('fluidSource', 'string', 'Container', FLUID_SOURCE_04),

    // Duration
    attr('decayTo', 'number', 'Duration'),
    attr('decayTime', 'number', 'Duration'),
    attr('duration', 'number', 'Duration'),
    attr('stopDuration', 'boolean', 'Duration'),
    attr('showDuration', 'boolean', 'Duration'),
    attr('charges', 'number', 'Duration'),
    attr('showCharges', 'boolean', 'Duration'),

    // Transform
    attr('rotateTo', 'number', 'Transform'),
    attr('transformEquipTo', 'number', 'Transform'),
    attr('transformDeEquipTo', 'number', 'Transform'),
    attr('transformTo', 'number', 'Transform'),
    attr('maleTransformTo', 'number', 'Transform'),
    attr('femaleTransformTo', 'number', 'Transform'),
    attr('partnerDirection', 'string', 'Transform', DIRECTIONS),

    // Text
    attr('writeable', 'boolean', 'Text'),
    attr('readable', 'boolean', 'Text'),
    attr('maxTextLen', 'number', 'Text'),

    // Properties
    attr('moveable', 'boolean', 'Properties'),
    attr('blockProjectile', 'boolean', 'Properties'),
    attr('allowPickupable', 'boolean', 'Properties'),
    attr('preventLoss', 'boolean', 'Properties'),
    attr('preventDrop', 'boolean', 'Properties'),
    attr('invisible', 'boolean', 'Properties'),
    attr('floorChange', 'string', 'Properties', FLOOR_CHANGE_036),
    attr('corpseType', 'string', 'Properties', CORPSE_TYPES),
    attr('manaShield', 'boolean', 'Properties'),
    attr('showAttributes', 'boolean', 'Properties'),
    attr('levelDoor', 'number', 'Properties'),
    attr('replaceable', 'boolean', 'Properties'),

    // Skills
    attr('speed', 'number', 'Skills'),
    attr('skillSword', 'number', 'Skills'),
    attr('skillAxe', 'number', 'Skills'),
    attr('skillClub', 'number', 'Skills'),
    attr('skillDist', 'number', 'Skills'),
    attr('skillFish', 'number', 'Skills'),
    attr('skillShield', 'number', 'Skills'),
    attr('skillFist', 'number', 'Skills'),
    attr('maxHealthPoints', 'number', 'Skills'),
    attr('maxHealthPercent', 'number', 'Skills'),
    attr('maxManaPoints', 'number', 'Skills'),
    attr('maxManaPercent', 'number', 'Skills'),
    attr('soulPoints', 'number', 'Skills'),
    attr('soulPercent', 'number', 'Skills'),
    attr('magicLevelPoints', 'number', 'Skills'),
    attr('magicLevelPercent', 'number', 'Skills'),

    // Stats
    attr('increaseMagicValue', 'number', 'Stats'),
    attr('increaseMagicPercent', 'number', 'Stats'),
    attr('increaseHealingValue', 'number', 'Stats'),
    attr('increaseHealingPercent', 'number', 'Stats'),

    // Regeneration
    attr('healthGain', 'number', 'Regeneration'),
    attr('healthTicks', 'number', 'Regeneration'),
    attr('manaGain', 'number', 'Regeneration'),
    attr('manaTicks', 'number', 'Regeneration'),

    // Elements
    attr('elementPhysical', 'number', 'Elements'),
    attr('elementFire', 'number', 'Elements'),
    attr('elementEnergy', 'number', 'Elements'),
    attr('elementEarth', 'number', 'Elements'),
    attr('elementIce', 'number', 'Elements'),
    attr('elementHoly', 'number', 'Elements'),
    attr('elementDeath', 'number', 'Elements'),
    attr('elementLifeDrain', 'number', 'Elements'),
    attr('elementManaDrain', 'number', 'Elements'),
    attr('elementHealing', 'number', 'Elements'),
    attr('elementUndefined', 'number', 'Elements'),

    // Absorb (15)
    ...ABSORB_KEYS_15.map((k) => attr(k, 'number', 'Absorb')),

    // Reflect Percent (15)
    ...REFLECT_PERCENT_KEYS.map((k) => attr(k, 'number', 'Reflect Percent')),

    // Reflect Chance (15)
    ...REFLECT_CHANCE_KEYS.map((k) => attr(k, 'number', 'Reflect Chance')),

    // Suppress (22)
    ...SUPPRESS_22.map((k) => attr(k, 'boolean', 'Suppress'))
  ]
}

// ---------------------------------------------------------------------------
// tfs1.0
// ---------------------------------------------------------------------------

const TFS_10: AttributeServerData = {
  server: 'tfs1.0',
  displayName: 'TFS 1.0',
  supportsFromToId: true,
  itemsXmlEncoding: 'utf-8',
  attributes: [
    // General (removed runespellname, worth, forceSerialize)
    attr('name', 'string', 'General'),
    attr('article', 'string', 'General'),
    attr('plural', 'string', 'General'),
    attr('description', 'string', 'General'),
    attr('weight', 'number', 'General'),
    attr('showCount', 'boolean', 'General'),
    attr('writeOnceItemId', 'number', 'General'),

    // Type (no rune)
    attr('type', 'string', 'Type', TYPE_VALUES_10),

    // Combat (extraDefense -> extraDef, + ammoAction with 'move', no attackSpeed)
    attr('attack', 'number', 'Combat'),
    attr('defense', 'number', 'Combat'),
    attr('armor', 'number', 'Combat'),
    attr('extraDef', 'number', 'Combat'),
    attr('extraAttack', 'number', 'Combat'),
    attr('range', 'number', 'Combat'),
    attr('hitChance', 'number', 'Combat'),
    attr('maxHitChance', 'number', 'Combat'),
    attr('breakChance', 'number', 'Combat'),
    attr('ammoAction', 'string', 'Combat', AMMO_ACTION_10),

    // Equipment (new slotType with right-hand/left-hand, new weapon/ammo/shoot/effect)
    attr('slotType', 'string', 'Equipment', SLOT_TYPE_10),
    attr('weaponType', 'string', 'Equipment', WEAPON_TYPE_10),
    attr('ammoType', 'string', 'Equipment', AMMO_TYPE_10),
    attr('shootType', 'string', 'Equipment', SHOOT_TYPE_10),
    attr('effect', 'string', 'Equipment', EFFECT_10),

    // Container (coconut instead of coconutmilk)
    attr('containerSize', 'number', 'Container'),
    attr('fluidSource', 'string', 'Container', FLUID_SOURCE_10),

    // Duration
    attr('decayTo', 'number', 'Duration'),
    attr('decayTime', 'number', 'Duration'),
    attr('duration', 'number', 'Duration'),
    attr('stopDuration', 'boolean', 'Duration'),
    attr('showDuration', 'boolean', 'Duration'),
    attr('charges', 'number', 'Duration'),
    attr('showCharges', 'boolean', 'Duration'),

    // Transform (no partnerDirection - moved to Properties)
    attr('rotateTo', 'number', 'Transform'),
    attr('transformEquipTo', 'number', 'Transform'),
    attr('transformDeEquipTo', 'number', 'Transform'),
    attr('maleTransformTo', 'number', 'Transform'),
    attr('femaleTransformTo', 'number', 'Transform'),
    attr('transformTo', 'number', 'Transform'),

    // Text (+ allowDistRead)
    attr('writeable', 'boolean', 'Text'),
    attr('readable', 'boolean', 'Text'),
    attr('maxTextLen', 'number', 'Text'),
    attr('allowDistRead', 'boolean', 'Text'),

    // Properties (removed preventLoss/preventDrop, added blocking/runeSpellName/walkStack/alwaysOnTop/topOrder/partnerDirection)
    attr('moveable', 'boolean', 'Properties'),
    attr('blockProjectile', 'boolean', 'Properties'),
    attr('allowPickupable', 'boolean', 'Properties'),
    attr('blocking', 'boolean', 'Properties'),
    attr('invisible', 'boolean', 'Properties'),
    attr('floorChange', 'string', 'Properties', FLOOR_CHANGE_10),
    attr('corpseType', 'string', 'Properties', CORPSE_TYPES),
    attr('manaShield', 'boolean', 'Properties'),
    attr('showAttributes', 'boolean', 'Properties'),
    attr('levelDoor', 'number', 'Properties'),
    attr('runeSpellName', 'string', 'Properties'),
    attr('walkStack', 'boolean', 'Properties'),
    attr('alwaysOnTop', 'boolean', 'Properties'),
    attr('topOrder', 'number', 'Properties'),
    attr('partnerDirection', 'string', 'Properties', DIRECTIONS),
    attr('replaceable', 'boolean', 'Properties'),

    // Skills (renamed: maxHitPoints, maxHitPointsPercent, maxManaPointsPercent, soulPointsPercent, magicPoints, magicPointsPercent)
    attr('speed', 'number', 'Skills'),
    attr('skillSword', 'number', 'Skills'),
    attr('skillAxe', 'number', 'Skills'),
    attr('skillClub', 'number', 'Skills'),
    attr('skillDist', 'number', 'Skills'),
    attr('skillFish', 'number', 'Skills'),
    attr('skillShield', 'number', 'Skills'),
    attr('skillFist', 'number', 'Skills'),
    attr('maxHitPoints', 'number', 'Skills'),
    attr('maxHitPointsPercent', 'number', 'Skills'),
    attr('maxManaPoints', 'number', 'Skills'),
    attr('maxManaPointsPercent', 'number', 'Skills'),
    attr('soulPoints', 'number', 'Skills'),
    attr('soulPointsPercent', 'number', 'Skills'),
    attr('magicPoints', 'number', 'Skills'),
    attr('magicPointsPercent', 'number', 'Skills'),

    // Regeneration
    attr('healthGain', 'number', 'Regeneration'),
    attr('healthTicks', 'number', 'Regeneration'),
    attr('manaGain', 'number', 'Regeneration'),
    attr('manaTicks', 'number', 'Regeneration'),

    // Absorb (15)
    ...ABSORB_KEYS_15.map((k) => attr(k, 'number', 'Absorb')),

    // Field Absorb (new in 1.0)
    attr('fieldAbsorbPercentEnergy', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentFire', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentPoison', 'number', 'Field Absorb'),

    // Elements (reduced to 4)
    attr('elementFire', 'number', 'Elements'),
    attr('elementEnergy', 'number', 'Elements'),
    attr('elementEarth', 'number', 'Elements'),
    attr('elementIce', 'number', 'Elements'),

    // Suppress (9)
    ...SUPPRESS_9.map((k) => attr(k, 'boolean', 'Suppress'))
  ]
}

// ---------------------------------------------------------------------------
// tfs1.1
// ---------------------------------------------------------------------------

const TFS_11: AttributeServerData = {
  server: 'tfs1.1',
  displayName: 'TFS 1.1',
  supportsFromToId: true,
  itemsXmlEncoding: 'utf-8',
  attributes: [
    // General
    attr('name', 'string', 'General'),
    attr('article', 'string', 'General'),
    attr('plural', 'string', 'General'),
    attr('description', 'string', 'General'),
    attr('weight', 'number', 'General'),
    attr('showCount', 'boolean', 'General'),
    attr('writeOnceItemId', 'number', 'General'),

    // Type (+ rune)
    attr('type', 'string', 'Type', TYPE_VALUES_11),

    // Combat (removed breakChance and ammoAction from 1.0)
    attr('attack', 'number', 'Combat'),
    attr('defense', 'number', 'Combat'),
    attr('armor', 'number', 'Combat'),
    attr('extraDef', 'number', 'Combat'),
    attr('extraAttack', 'number', 'Combat'),
    attr('range', 'number', 'Combat'),
    attr('hitChance', 'number', 'Combat'),
    attr('maxHitChance', 'number', 'Combat'),

    // Equipment (+ gloothspear/simplearrow in shootType, + smoke effects)
    attr('slotType', 'string', 'Equipment', SLOT_TYPE_10),
    attr('weaponType', 'string', 'Equipment', WEAPON_TYPE_10),
    attr('ammoType', 'string', 'Equipment', AMMO_TYPE_10),
    attr('shootType', 'string', 'Equipment', SHOOT_TYPE_11),
    attr('effect', 'string', 'Equipment', EFFECT_11),

    // Container
    attr('containerSize', 'number', 'Container'),
    attr('fluidSource', 'string', 'Container', FLUID_SOURCE_10),

    // Duration
    attr('decayTo', 'number', 'Duration'),
    attr('decayTime', 'number', 'Duration'),
    attr('duration', 'number', 'Duration'),
    attr('stopDuration', 'boolean', 'Duration'),
    attr('showDuration', 'boolean', 'Duration'),
    attr('charges', 'number', 'Duration'),
    attr('showCharges', 'boolean', 'Duration'),

    // Transform
    attr('rotateTo', 'number', 'Transform'),
    attr('transformEquipTo', 'number', 'Transform'),
    attr('transformDeEquipTo', 'number', 'Transform'),
    attr('maleTransformTo', 'number', 'Transform'),
    attr('femaleTransformTo', 'number', 'Transform'),
    attr('transformTo', 'number', 'Transform'),

    // Text
    attr('writeable', 'boolean', 'Text'),
    attr('readable', 'boolean', 'Text'),
    attr('maxTextLen', 'number', 'Text'),
    attr('allowDistRead', 'boolean', 'Text'),

    // Properties (removed alwaysOnTop, topOrder from 1.0)
    attr('moveable', 'boolean', 'Properties'),
    attr('blockProjectile', 'boolean', 'Properties'),
    attr('allowPickupable', 'boolean', 'Properties'),
    attr('blocking', 'boolean', 'Properties'),
    attr('invisible', 'boolean', 'Properties'),
    attr('floorChange', 'string', 'Properties', FLOOR_CHANGE_10),
    attr('corpseType', 'string', 'Properties', CORPSE_TYPES),
    attr('manaShield', 'boolean', 'Properties'),
    attr('showAttributes', 'boolean', 'Properties'),
    attr('levelDoor', 'number', 'Properties'),
    attr('runeSpellName', 'string', 'Properties'),
    attr('walkStack', 'boolean', 'Properties'),
    attr('partnerDirection', 'string', 'Properties', DIRECTIONS),
    attr('replaceable', 'boolean', 'Properties'),

    // Skills
    attr('speed', 'number', 'Skills'),
    attr('skillSword', 'number', 'Skills'),
    attr('skillAxe', 'number', 'Skills'),
    attr('skillClub', 'number', 'Skills'),
    attr('skillDist', 'number', 'Skills'),
    attr('skillFish', 'number', 'Skills'),
    attr('skillShield', 'number', 'Skills'),
    attr('skillFist', 'number', 'Skills'),
    attr('maxHitPoints', 'number', 'Skills'),
    attr('maxHitPointsPercent', 'number', 'Skills'),
    attr('maxManaPoints', 'number', 'Skills'),
    attr('maxManaPointsPercent', 'number', 'Skills'),
    attr('soulPoints', 'number', 'Skills'),
    attr('soulPointsPercent', 'number', 'Skills'),
    attr('magicPoints', 'number', 'Skills'),
    attr('magicPointsPercent', 'number', 'Skills'),

    // Regeneration
    attr('healthGain', 'number', 'Regeneration'),
    attr('healthTicks', 'number', 'Regeneration'),
    attr('manaGain', 'number', 'Regeneration'),
    attr('manaTicks', 'number', 'Regeneration'),

    // Absorb (15)
    ...ABSORB_KEYS_15.map((k) => attr(k, 'number', 'Absorb')),

    // Field Absorb
    attr('fieldAbsorbPercentEnergy', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentFire', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentPoison', 'number', 'Field Absorb'),

    // Elements (4)
    attr('elementFire', 'number', 'Elements'),
    attr('elementEnergy', 'number', 'Elements'),
    attr('elementEarth', 'number', 'Elements'),
    attr('elementIce', 'number', 'Elements'),

    // Suppress (9)
    ...SUPPRESS_9.map((k) => attr(k, 'boolean', 'Suppress'))
  ]
}

// ---------------------------------------------------------------------------
// tfs1.2 (identical to tfs1.1)
// ---------------------------------------------------------------------------

const TFS_12: AttributeServerData = {
  server: 'tfs1.2',
  displayName: 'TFS 1.2',
  supportsFromToId: true,
  itemsXmlEncoding: 'utf-8',
  attributes: [
    // General
    attr('name', 'string', 'General'),
    attr('article', 'string', 'General'),
    attr('plural', 'string', 'General'),
    attr('description', 'string', 'General'),
    attr('weight', 'number', 'General'),
    attr('showCount', 'boolean', 'General'),
    attr('writeOnceItemId', 'number', 'General'),

    // Type
    attr('type', 'string', 'Type', TYPE_VALUES_11),

    // Combat
    attr('attack', 'number', 'Combat'),
    attr('defense', 'number', 'Combat'),
    attr('armor', 'number', 'Combat'),
    attr('extraDef', 'number', 'Combat'),
    attr('extraAttack', 'number', 'Combat'),
    attr('range', 'number', 'Combat'),
    attr('hitChance', 'number', 'Combat'),
    attr('maxHitChance', 'number', 'Combat'),

    // Equipment
    attr('slotType', 'string', 'Equipment', SLOT_TYPE_10),
    attr('weaponType', 'string', 'Equipment', WEAPON_TYPE_10),
    attr('ammoType', 'string', 'Equipment', AMMO_TYPE_10),
    attr('shootType', 'string', 'Equipment', SHOOT_TYPE_11),
    attr('effect', 'string', 'Equipment', EFFECT_11),

    // Container
    attr('containerSize', 'number', 'Container'),
    attr('fluidSource', 'string', 'Container', FLUID_SOURCE_10),

    // Duration
    attr('decayTo', 'number', 'Duration'),
    attr('decayTime', 'number', 'Duration'),
    attr('duration', 'number', 'Duration'),
    attr('stopDuration', 'boolean', 'Duration'),
    attr('showDuration', 'boolean', 'Duration'),
    attr('charges', 'number', 'Duration'),
    attr('showCharges', 'boolean', 'Duration'),

    // Transform
    attr('rotateTo', 'number', 'Transform'),
    attr('transformEquipTo', 'number', 'Transform'),
    attr('transformDeEquipTo', 'number', 'Transform'),
    attr('maleTransformTo', 'number', 'Transform'),
    attr('femaleTransformTo', 'number', 'Transform'),
    attr('transformTo', 'number', 'Transform'),

    // Text
    attr('writeable', 'boolean', 'Text'),
    attr('readable', 'boolean', 'Text'),
    attr('maxTextLen', 'number', 'Text'),
    attr('allowDistRead', 'boolean', 'Text'),

    // Properties
    attr('moveable', 'boolean', 'Properties'),
    attr('blockProjectile', 'boolean', 'Properties'),
    attr('allowPickupable', 'boolean', 'Properties'),
    attr('blocking', 'boolean', 'Properties'),
    attr('invisible', 'boolean', 'Properties'),
    attr('floorChange', 'string', 'Properties', FLOOR_CHANGE_10),
    attr('corpseType', 'string', 'Properties', CORPSE_TYPES),
    attr('manaShield', 'boolean', 'Properties'),
    attr('showAttributes', 'boolean', 'Properties'),
    attr('levelDoor', 'number', 'Properties'),
    attr('runeSpellName', 'string', 'Properties'),
    attr('walkStack', 'boolean', 'Properties'),
    attr('partnerDirection', 'string', 'Properties', DIRECTIONS),
    attr('replaceable', 'boolean', 'Properties'),

    // Skills
    attr('speed', 'number', 'Skills'),
    attr('skillSword', 'number', 'Skills'),
    attr('skillAxe', 'number', 'Skills'),
    attr('skillClub', 'number', 'Skills'),
    attr('skillDist', 'number', 'Skills'),
    attr('skillFish', 'number', 'Skills'),
    attr('skillShield', 'number', 'Skills'),
    attr('skillFist', 'number', 'Skills'),
    attr('maxHitPoints', 'number', 'Skills'),
    attr('maxHitPointsPercent', 'number', 'Skills'),
    attr('maxManaPoints', 'number', 'Skills'),
    attr('maxManaPointsPercent', 'number', 'Skills'),
    attr('soulPoints', 'number', 'Skills'),
    attr('soulPointsPercent', 'number', 'Skills'),
    attr('magicPoints', 'number', 'Skills'),
    attr('magicPointsPercent', 'number', 'Skills'),

    // Regeneration
    attr('healthGain', 'number', 'Regeneration'),
    attr('healthTicks', 'number', 'Regeneration'),
    attr('manaGain', 'number', 'Regeneration'),
    attr('manaTicks', 'number', 'Regeneration'),

    // Absorb (15)
    ...ABSORB_KEYS_15.map((k) => attr(k, 'number', 'Absorb')),

    // Field Absorb
    attr('fieldAbsorbPercentEnergy', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentFire', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentPoison', 'number', 'Field Absorb'),

    // Elements (4)
    attr('elementFire', 'number', 'Elements'),
    attr('elementEnergy', 'number', 'Elements'),
    attr('elementEarth', 'number', 'Elements'),
    attr('elementIce', 'number', 'Elements'),

    // Suppress (9)
    ...SUPPRESS_9.map((k) => attr(k, 'boolean', 'Suppress'))
  ]
}

// ---------------------------------------------------------------------------
// tfs1.4
// ---------------------------------------------------------------------------

const AMMO_TYPE_16 = [
  'spear',
  'bolt',
  'arrow',
  'poisonarrow',
  'burstarrow',
  'throwingstar',
  'throwingknife',
  'smallstone',
  'largerock',
  'snowball',
  'powerbolt',
  'infernalbolt',
  'huntingspear',
  'enchantedspear',
  'royalspear',
  'sniperarrow',
  'onyxarrow',
  'piercingbolt',
  'etherealspear',
  'flasharrow',
  'flammingarrow',
  'shiverarrow',
  'eartharrow',
  'tarsalarrow',
  'vortexbolt',
  'prismaticbolt',
  'crystallinearrow',
  'drillbolt',
  'envenomedarrow',
  'gloothspear',
  'simplearrow',
  'redstar',
  'greenstar',
  'royalstar',
  'spectralbolt',
  'diamondarrow',
  'leafstar'
]

const SHOOT_TYPE_16 = [
  'spear',
  'bolt',
  'arrow',
  'fire',
  'energy',
  'poisonarrow',
  'burstarrow',
  'throwingstar',
  'throwingknife',
  'smallstone',
  'death',
  'largerock',
  'snowball',
  'powerbolt',
  'poison',
  'infernalbolt',
  'huntingspear',
  'enchantedspear',
  'redstar',
  'greenstar',
  'royalspear',
  'sniperarrow',
  'onyxarrow',
  'piercingbolt',
  'whirlwindsword',
  'whirlwindaxe',
  'whirlwindclub',
  'etherealspear',
  'ice',
  'earth',
  'holy',
  'suddendeath',
  'flasharrow',
  'flammingarrow',
  'shiverarrow',
  'energyball',
  'smallice',
  'smallholy',
  'smallearth',
  'eartharrow',
  'explosion',
  'cake',
  'tarsalarrow',
  'vortexbolt',
  'prismaticbolt',
  'crystallinearrow',
  'drillbolt',
  'envenomedarrow',
  'gloothspear',
  'simplearrow',
  'leafstar',
  'diamondarrow',
  'spectralbolt',
  'royalstar'
]

const EFFECT_16 = [
  'redspark',
  'bluebubble',
  'poff',
  'yellowspark',
  'explosionarea',
  'explosion',
  'firearea',
  'yellowbubble',
  'greenbubble',
  'blackspark',
  'teleport',
  'energy',
  'blueshimmer',
  'redshimmer',
  'greenshimmer',
  'fire',
  'greenspark',
  'mortarea',
  'greennote',
  'rednote',
  'poison',
  'yellownote',
  'purplenote',
  'bluenote',
  'whitenote',
  'bubbles',
  'dice',
  'giftwraps',
  'yellowfirework',
  'redfirework',
  'bluefirework',
  'stun',
  'sleep',
  'watercreature',
  'groundshaker',
  'hearts',
  'fireattack',
  'energyarea',
  'smallclouds',
  'holydamage',
  'bigclouds',
  'icearea',
  'icetornado',
  'iceattack',
  'stones',
  'smallplants',
  'carniphila',
  'purpleenergy',
  'yellowenergy',
  'holyarea',
  'bigplants',
  'cake',
  'giantice',
  'watersplash',
  'plantattack',
  'tutorialarrow',
  'tutorialsquare',
  'mirrorhorizontal',
  'mirrorvertical',
  'skullhorizontal',
  'skullvertical',
  'assassin',
  'stepshorizontal',
  'bloodysteps',
  'stepsvertical',
  'yalaharighost',
  'bats',
  'smoke',
  'insects',
  'dragonhead',
  'orcshaman',
  'orcshamanfire',
  'thunder',
  'ferumbras',
  'confettihorizontal',
  'confettivertical',
  'blacksmoke',
  'redsmoke',
  'yellowsmoke',
  'greensmoke',
  'purplesmoke',
  'earlythunder',
  'bonecapsule',
  'criticaldamage',
  'plungingfish',
  'bluechain',
  'orangechain',
  'greenchain',
  'purplechain',
  'greychain',
  'yellowchain',
  'yellowsparkles',
  'faeexplosion',
  'faecoming',
  'faegoing',
  'bigcloudssinglespace',
  'stonessinglespace',
  'blueghost',
  'pointofinterest',
  'mapeffect',
  'pinkspark',
  'greenfirework',
  'orangefirework',
  'purplefirework',
  'turquoisefirework',
  'thecube',
  'drawink',
  'prismaticsparkles',
  'thaian',
  'thaianghost',
  'ghostsmoke',
  'floatingblock',
  'block',
  'rooting',
  'ghostlyscratch',
  'ghostlybite',
  'bigscratching',
  'slash',
  'bite',
  'chivalriouschallenge',
  'divinedazzle',
  'electricalspark',
  'purpleteleport',
  'redteleport',
  'orangeteleport',
  'greyteleport',
  'lightblueteleport',
  'fatal',
  'dodge',
  'hourglass',
  'fireworksstar',
  'fireworkscircle',
  'ferumbras1',
  'gazharagoth',
  'madmage',
  'horestis',
  'devovorga',
  'ferumbras2',
  'foam'
]

const TFS_14: AttributeServerData = {
  server: 'tfs1.4',
  displayName: 'TFS 1.4',
  supportsFromToId: true,
  itemsXmlEncoding: 'iso-8859-1',
  attributes: [
    // General (+ placement="tag" on article/name/plural/editorsuffix)
    attr('article', 'string', 'General', null, 'tag'),
    attr('name', 'string', 'General', null, 'tag'),
    attr('plural', 'string', 'General', null, 'tag'),
    attr('editorsuffix', 'string', 'General', null, 'tag'),
    attr('description', 'string', 'General'),
    attr('weight', 'number', 'General'),
    attr('showCount', 'boolean', 'General'),
    attr('writeOnceItemId', 'number', 'General'),

    // Type (+ rune)
    attr('type', 'string', 'Type', TYPE_VALUES_11),

    // Combat (+ attackSpeed, no breakChance/ammoAction)
    attr('attack', 'number', 'Combat'),
    attr('defense', 'number', 'Combat'),
    attr('armor', 'number', 'Combat'),
    attr('extraDef', 'number', 'Combat'),
    attr('extraAttack', 'number', 'Combat'),
    attr('attackSpeed', 'number', 'Combat'),
    attr('range', 'number', 'Combat'),
    attr('hitChance', 'number', 'Combat'),
    attr('maxHitChance', 'number', 'Combat'),

    // Equipment (same shootType/effect as 1.1/1.2)
    attr('slotType', 'string', 'Equipment', SLOT_TYPE_10),
    attr('weaponType', 'string', 'Equipment', WEAPON_TYPE_10),
    attr('ammoType', 'string', 'Equipment', AMMO_TYPE_10),
    attr('shootType', 'string', 'Equipment', SHOOT_TYPE_11),
    attr('effect', 'string', 'Equipment', EFFECT_11),

    // Container
    attr('containerSize', 'number', 'Container'),
    attr('fluidSource', 'string', 'Container', FLUID_SOURCE_10),

    // Duration
    attr('decayTo', 'number', 'Duration'),
    attr('decayTime', 'number', 'Duration'),
    attr('duration', 'number', 'Duration'),
    attr('stopDuration', 'boolean', 'Duration'),
    attr('showDuration', 'boolean', 'Duration'),
    attr('charges', 'number', 'Duration'),
    attr('showCharges', 'boolean', 'Duration'),

    // Transform (+ destroyTo)
    attr('rotateTo', 'number', 'Transform'),
    attr('destroyTo', 'number', 'Transform'),
    attr('transformEquipTo', 'number', 'Transform'),
    attr('transformDeEquipTo', 'number', 'Transform'),
    attr('maleTransformTo', 'number', 'Transform'),
    attr('femaleTransformTo', 'number', 'Transform'),
    attr('transformTo', 'number', 'Transform'),

    // Text
    attr('writeable', 'boolean', 'Text'),
    attr('readable', 'boolean', 'Text'),
    attr('maxTextLen', 'number', 'Text'),
    attr('allowDistRead', 'boolean', 'Text'),

    // Properties (+ storeItem, floorChange reduced)
    attr('moveable', 'boolean', 'Properties'),
    attr('blockProjectile', 'boolean', 'Properties'),
    attr('allowPickupable', 'boolean', 'Properties'),
    attr('blocking', 'boolean', 'Properties'),
    attr('invisible', 'boolean', 'Properties'),
    attr('floorChange', 'string', 'Properties', FLOOR_CHANGE_14),
    attr('corpseType', 'string', 'Properties', CORPSE_TYPES),
    attr('manaShield', 'boolean', 'Properties'),
    attr('showAttributes', 'boolean', 'Properties'),
    attr('levelDoor', 'number', 'Properties'),
    attr('runeSpellName', 'string', 'Properties'),
    attr('walkStack', 'boolean', 'Properties'),
    attr('partnerDirection', 'string', 'Properties', DIRECTIONS),
    attr('replaceable', 'boolean', 'Properties'),
    attr('storeItem', 'boolean', 'Properties'),

    // Skills
    attr('speed', 'number', 'Skills'),
    attr('skillSword', 'number', 'Skills'),
    attr('skillAxe', 'number', 'Skills'),
    attr('skillClub', 'number', 'Skills'),
    attr('skillDist', 'number', 'Skills'),
    attr('skillFish', 'number', 'Skills'),
    attr('skillShield', 'number', 'Skills'),
    attr('skillFist', 'number', 'Skills'),
    attr('maxHitPoints', 'number', 'Skills'),
    attr('maxHitPointsPercent', 'number', 'Skills'),
    attr('maxManaPoints', 'number', 'Skills'),
    attr('maxManaPointsPercent', 'number', 'Skills'),
    attr('soulPoints', 'number', 'Skills'),
    attr('soulPointsPercent', 'number', 'Skills'),
    attr('magicPoints', 'number', 'Skills'),
    attr('magicPointsPercent', 'number', 'Skills'),

    // Regeneration
    attr('healthGain', 'number', 'Regeneration'),
    attr('healthTicks', 'number', 'Regeneration'),
    attr('manaGain', 'number', 'Regeneration'),
    attr('manaTicks', 'number', 'Regeneration'),

    // Absorb (15)
    ...ABSORB_KEYS_15.map((k) => attr(k, 'number', 'Absorb')),

    // Field Absorb
    attr('fieldAbsorbPercentEnergy', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentFire', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentPoison', 'number', 'Field Absorb'),

    // Elements (6: + holy, death)
    attr('elementFire', 'number', 'Elements'),
    attr('elementEnergy', 'number', 'Elements'),
    attr('elementEarth', 'number', 'Elements'),
    attr('elementIce', 'number', 'Elements'),
    attr('elementHoly', 'number', 'Elements'),
    attr('elementDeath', 'number', 'Elements'),

    // Suppress (9)
    ...SUPPRESS_9.map((k) => attr(k, 'boolean', 'Suppress'))
  ]
}

// ---------------------------------------------------------------------------
// tfs1.6
// ---------------------------------------------------------------------------

const TYPE_VALUES_16 = [
  'container',
  'key',
  'magicfield',
  'depot',
  'mailbox',
  'trashholder',
  'teleport',
  'door',
  'bed',
  'rune',
  'podium'
]

const TFS_16: AttributeServerData = {
  server: 'tfs1.6',
  displayName: 'TFS 1.6',
  supportsFromToId: true,
  itemsXmlEncoding: 'iso-8859-1',
  attributes: [
    // General (same as 1.4 with placement="tag")
    attr('article', 'string', 'General', null, 'tag'),
    attr('name', 'string', 'General', null, 'tag'),
    attr('plural', 'string', 'General', null, 'tag'),
    attr('editorsuffix', 'string', 'General', null, 'tag'),
    attr('description', 'string', 'General'),
    attr('weight', 'number', 'General'),
    attr('showCount', 'boolean', 'General'),
    attr('writeOnceItemId', 'number', 'General'),

    // Type (+ podium)
    attr('type', 'string', 'Type', TYPE_VALUES_16),

    // Combat (same as 1.4)
    attr('attack', 'number', 'Combat'),
    attr('defense', 'number', 'Combat'),
    attr('armor', 'number', 'Combat'),
    attr('extraDef', 'number', 'Combat'),
    attr('extraAttack', 'number', 'Combat'),
    attr('attackSpeed', 'number', 'Combat'),
    attr('range', 'number', 'Combat'),
    attr('hitChance', 'number', 'Combat'),
    attr('maxHitChance', 'number', 'Combat'),

    // Equipment (expanded ammo/shoot/effect lists)
    attr('slotType', 'string', 'Equipment', SLOT_TYPE_10),
    attr('weaponType', 'string', 'Equipment', WEAPON_TYPE_10),
    attr('ammoType', 'string', 'Equipment', AMMO_TYPE_16),
    attr('shootType', 'string', 'Equipment', SHOOT_TYPE_16),
    attr('effect', 'string', 'Equipment', EFFECT_16),

    // Container
    attr('containerSize', 'number', 'Container'),
    attr('fluidSource', 'string', 'Container', FLUID_SOURCE_10),

    // Duration
    attr('decayTo', 'number', 'Duration'),
    attr('decayTime', 'number', 'Duration'),
    attr('duration', 'number', 'Duration'),
    attr('stopDuration', 'boolean', 'Duration'),
    attr('showDuration', 'boolean', 'Duration'),
    attr('charges', 'number', 'Duration'),
    attr('showCharges', 'boolean', 'Duration'),

    // Transform (+ maleSleeper, femaleSleeper)
    attr('rotateTo', 'number', 'Transform'),
    attr('destroyTo', 'number', 'Transform'),
    attr('transformEquipTo', 'number', 'Transform'),
    attr('transformDeEquipTo', 'number', 'Transform'),
    attr('maleTransformTo', 'number', 'Transform'),
    attr('femaleTransformTo', 'number', 'Transform'),
    attr('transformTo', 'number', 'Transform'),
    attr('maleSleeper', 'number', 'Transform'),
    attr('femaleSleeper', 'number', 'Transform'),

    // Text
    attr('writeable', 'boolean', 'Text'),
    attr('readable', 'boolean', 'Text'),
    attr('maxTextLen', 'number', 'Text'),
    attr('allowDistRead', 'boolean', 'Text'),

    // Properties (+ field, pickupable, forceSerialize, supply, worth)
    attr('moveable', 'boolean', 'Properties'),
    attr('blockProjectile', 'boolean', 'Properties'),
    attr('allowPickupable', 'boolean', 'Properties'),
    attr('blocking', 'boolean', 'Properties'),
    attr('invisible', 'boolean', 'Properties'),
    attr('floorChange', 'string', 'Properties', FLOOR_CHANGE_14),
    attr('corpseType', 'string', 'Properties', CORPSE_TYPES),
    attr('manaShield', 'boolean', 'Properties'),
    attr('showAttributes', 'boolean', 'Properties'),
    attr('levelDoor', 'number', 'Properties'),
    attr('runeSpellName', 'string', 'Properties'),
    attr('walkStack', 'boolean', 'Properties'),
    attr('partnerDirection', 'string', 'Properties', DIRECTIONS),
    attr('replaceable', 'boolean', 'Properties'),
    attr('storeItem', 'boolean', 'Properties'),
    attr('field', 'boolean', 'Properties'),
    attr('pickupable', 'boolean', 'Properties'),
    attr('forceSerialize', 'boolean', 'Properties'),
    attr('supply', 'boolean', 'Properties'),
    attr('worth', 'number', 'Properties'),

    // Skills (+ criticalHitChance/Amount, lifeLeechChance/Amount, manaLeechChance/Amount, magicLevelPoints)
    attr('speed', 'number', 'Skills'),
    attr('skillSword', 'number', 'Skills'),
    attr('skillAxe', 'number', 'Skills'),
    attr('skillClub', 'number', 'Skills'),
    attr('skillDist', 'number', 'Skills'),
    attr('skillFish', 'number', 'Skills'),
    attr('skillShield', 'number', 'Skills'),
    attr('skillFist', 'number', 'Skills'),
    attr('maxHitPoints', 'number', 'Skills'),
    attr('maxHitPointsPercent', 'number', 'Skills'),
    attr('maxManaPoints', 'number', 'Skills'),
    attr('maxManaPointsPercent', 'number', 'Skills'),
    attr('soulPoints', 'number', 'Skills'),
    attr('soulPointsPercent', 'number', 'Skills'),
    attr('magicPoints', 'number', 'Skills'),
    attr('magicPointsPercent', 'number', 'Skills'),
    attr('criticalHitChance', 'number', 'Skills'),
    attr('criticalHitAmount', 'number', 'Skills'),
    attr('lifeLeechChance', 'number', 'Skills'),
    attr('lifeLeechAmount', 'number', 'Skills'),
    attr('manaLeechChance', 'number', 'Skills'),
    attr('manaLeechAmount', 'number', 'Skills'),
    attr('magicLevelPoints', 'number', 'Skills'),

    // Regeneration
    attr('healthGain', 'number', 'Regeneration'),
    attr('healthTicks', 'number', 'Regeneration'),
    attr('manaGain', 'number', 'Regeneration'),
    attr('manaTicks', 'number', 'Regeneration'),

    // Absorb (16: + absorbPercentEarth)
    ...ABSORB_KEYS_15.map((k) => attr(k, 'number', 'Absorb')),
    attr('absorbPercentEarth', 'number', 'Absorb'),

    // Field Absorb
    attr('fieldAbsorbPercentEnergy', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentFire', 'number', 'Field Absorb'),
    attr('fieldAbsorbPercentPoison', 'number', 'Field Absorb'),

    // Elements (6)
    attr('elementFire', 'number', 'Elements'),
    attr('elementEnergy', 'number', 'Elements'),
    attr('elementEarth', 'number', 'Elements'),
    attr('elementIce', 'number', 'Elements'),
    attr('elementHoly', 'number', 'Elements'),
    attr('elementDeath', 'number', 'Elements'),

    // Boost Percent (15)
    attr('boostPercentAll', 'number', 'Boost Percent'),
    attr('boostPercentElements', 'number', 'Boost Percent'),
    attr('boostPercentMagic', 'number', 'Boost Percent'),
    attr('boostPercentEnergy', 'number', 'Boost Percent'),
    attr('boostPercentFire', 'number', 'Boost Percent'),
    attr('boostPercentPoison', 'number', 'Boost Percent'),
    attr('boostPercentIce', 'number', 'Boost Percent'),
    attr('boostPercentHoly', 'number', 'Boost Percent'),
    attr('boostPercentDeath', 'number', 'Boost Percent'),
    attr('boostPercentLifeDrain', 'number', 'Boost Percent'),
    attr('boostPercentManaDrain', 'number', 'Boost Percent'),
    attr('boostPercentDrown', 'number', 'Boost Percent'),
    attr('boostPercentPhysical', 'number', 'Boost Percent'),
    attr('boostPercentHealing', 'number', 'Boost Percent'),
    attr('boostPercentUndefined', 'number', 'Boost Percent'),

    // Magic Level Boost (12)
    attr('magicLevelEnergy', 'number', 'Magic Level Boost'),
    attr('magicLevelFire', 'number', 'Magic Level Boost'),
    attr('magicLevelPoison', 'number', 'Magic Level Boost'),
    attr('magicLevelIce', 'number', 'Magic Level Boost'),
    attr('magicLevelHoly', 'number', 'Magic Level Boost'),
    attr('magicLevelDeath', 'number', 'Magic Level Boost'),
    attr('magicLevelLifeDrain', 'number', 'Magic Level Boost'),
    attr('magicLevelManaDrain', 'number', 'Magic Level Boost'),
    attr('magicLevelDrown', 'number', 'Magic Level Boost'),
    attr('magicLevelPhysical', 'number', 'Magic Level Boost'),
    attr('magicLevelHealing', 'number', 'Magic Level Boost'),
    attr('magicLevelUndefined', 'number', 'Magic Level Boost'),

    // Suppress (9)
    ...SUPPRESS_9.map((k) => attr(k, 'boolean', 'Suppress'))
  ]
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** All attribute definitions indexed by server ID. */
export const ATTRIBUTE_DATA: Record<string, AttributeServerData> = {
  'tfs0.3.6': TFS_036,
  'tfs0.4': TFS_04,
  'tfs0.5': TFS_05,
  'tfs1.0': TFS_10,
  'tfs1.1': TFS_11,
  'tfs1.2': TFS_12,
  'tfs1.4': TFS_14,
  'tfs1.6': TFS_16
}
